#!/bin/sh
# Push main to GitHub, inside the hours Kydux is seen working (ci/hours.py), with
# the version tags on its commits.
#
#   ci/push.sh            now, inside the hours: the commits not yet on GitHub are
#                         dated inside them, ending now, then pushed
#   ci/push.sh --later    the same at the next moment the hours allow, by a timer of
#                         the user's systemd
#   ci/push.sh --tags     only the check of the version tags it would push, below
#
# Nothing of Kydux's goes to GitHub by any other way. Only commits not yet on
# origin/main are dated again, as the very last step before the push: a commit
# once pushed never changes. An annotated tag, a version's (`git tag -a v0.0.4`),
# goes with the commit it is on (--follow-tags, D179); a tag on a commit dated
# again is made again on the commit's new self, with its message, dated now.
#
# Before anything, at any hour, it refuses a version tag `v<x>` it would push
# whose commit's app/package.json does not say version <x>: the version commit
# comes first, and the tag goes on it.

set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
HOURS="$REPO_ROOT/ci/hours.py"
LATER=""
TAGS=""
for argument in "$@"; do
    case "$argument" in
        --later) LATER=yes ;;
        --tags) TAGS=yes ;;
        *) echo "usage: $0 [--later | --tags]" >&2; exit 2 ;;
    esac
done

# The version a commit's app/package.json says, or nothing when it has none.
version_at() {
    git show "$1:app/package.json" 2>/dev/null |
        python3 -c 'import json, sys; print(json.load(sys.stdin).get("version", ""))' 2>/dev/null || true
}

# Every annotated version tag on a commit of main that origin has not yet: the
# tags --follow-tags takes up. Each must be on the commit of its own version.
check_tags() {
    remote="$(git ls-remote --tags origin 2>/dev/null | awk '{print $2}')" || remote=""
    wrong=""
    for tag in $(git tag --merged HEAD -l 'v*'); do
        [ "$(git cat-file -t "$tag")" = tag ] || continue
        if printf '%s\n' "$remote" | grep -qx "refs/tags/$tag"; then
            continue
        fi
        commit="$(git rev-parse --short "$tag^{commit}")"
        said="$(version_at "$tag^{commit}")"
        if [ "$said" != "${tag#v}" ]; then
            echo "$0: the tag $tag is on $commit, whose app/package.json says version" \
                "${said:-none}, not ${tag#v}" >&2
            wrong=yes
        fi
    done
    if [ -n "$wrong" ]; then
        echo "    Make the version commit first, then move the tag onto it:" >&2
        echo "    git tag -f -a <tag> -m \"Version <x>\" <the version commit>" >&2
        return 1
    fi
}

if [ "$(git rev-parse --abbrev-ref HEAD)" != main ]; then
    echo "$0: only main is pushed, and this is $(git rev-parse --abbrev-ref HEAD)" >&2
    exit 2
fi
check_tags || exit 2
if [ -n "$TAGS" ]; then
    echo "==> The version tags to push are each on their version's commit."
    exit 0
fi
if [ -n "$(git status --porcelain)" ]; then
    echo "$0: the tree has changes not committed:" >&2
    git status --short >&2
    exit 2
fi

if ! "$HOURS" allowed; then
    if [ -z "$LATER" ]; then
        echo "$0: run it then, or now with --later, which sets a timer" >&2
        exit 2
    fi
    when="$("$HOURS" next --calendar)"
    unit="kydux-push-$(date +%s)"
    systemd-run --user --quiet --collect --unit="$unit" --on-calendar="$when" \
        --working-directory="$REPO_ROOT" "$REPO_ROOT/ci/push.sh"
    echo "==> The push is set for $when, as $unit: systemctl --user list-timers;"
    echo "    what it did: journalctl --user -u $unit"
    if [ "$(loginctl show-user "$(id -un)" -p Linger --value 2>/dev/null)" != yes ]; then
        echo "    The timer lives only while you have a session on this machine; to keep it"
        echo "    without one: sudo loginctl enable-linger $(id -un)"
    fi
    exit 0
fi

# A repository still empty on GitHub has no origin/main: every commit is new,
# which git's null id stands for.
git fetch -q origin
old="$(git rev-parse HEAD)"
if git rev-parse -q --verify origin/main >/dev/null; then
    base="$(git rev-parse origin/main)"
    if ! git merge-base --is-ancestor "$base" "$old"; then
        echo "$0: origin/main is not behind main; pull first" >&2
        exit 2
    fi
    count="$(git rev-list --count "$base..$old")"
else
    base=0000000000000000000000000000000000000000
    count="$(git rev-list --count "$old")"
fi

if [ "$count" -eq 0 ]; then
    # No commit to push; a version tag made on one already pushed goes up alone.
    echo "==> No commit to push: origin/main is main."
    git push --follow-tags origin main
    exit 0
fi
# The commits to date again, oldest first, and then their new selves in the same
# order, so that each tag on one goes onto the other.
range="$old"
[ "$base" = 0000000000000000000000000000000000000000 ] || range="$base..$old"
olds="$(mktemp)"
news="$(mktemp)"
trap 'rm -f "$olds" "$news"' EXIT
git rev-list --reverse "$range" >"$olds"
new="$("$HOURS" redate "$base" "$old")"
git update-ref -m "ci/push.sh: dated inside the hours" refs/heads/main "$new" "$old"
echo "==> $count commit(s) dated inside the hours, $old -> $new"
if [ "$base" = 0000000000000000000000000000000000000000 ]; then
    git rev-list --reverse "$new" >"$news"
else
    git rev-list --reverse "$base..$new" >"$news"
fi
paste -d ' ' "$olds" "$news" | while read -r was is; do
    for tag in $(git tag --points-at "$was"); do
        [ "$(git cat-file -t "$tag")" = tag ] || continue
        git tag -f -a -m "$(git tag -l --format='%(contents)' "$tag")" "$tag" "$is" >/dev/null
        echo "==> The tag $tag on its commit dated again, $(git rev-parse --short "$is")"
    done
done
git push --follow-tags -u origin main
echo "==> Pushed main, $(git rev-parse --short HEAD), at $(date '+%H:%M')"
