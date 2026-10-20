#!/bin/sh
# Push main to GitHub, inside the hours Kydux is seen working (ci/hours.py).
#
#   ci/push.sh            now, inside the hours: the commits not yet on GitHub are
#                         dated inside them, ending now, then pushed
#   ci/push.sh --later    the same at the next moment the hours allow, by a timer of
#                         the user's systemd
#
# Nothing of Kydux's goes to GitHub by any other way. Only commits not yet on
# origin/main are dated again, as the very last step before the push: a commit
# once pushed never changes.

set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
HOURS="$REPO_ROOT/ci/hours.py"
LATER=""
for argument in "$@"; do
    case "$argument" in
        --later) LATER=yes ;;
        *) echo "usage: $0 [--later]" >&2; exit 2 ;;
    esac
done

if [ "$(git rev-parse --abbrev-ref HEAD)" != main ]; then
    echo "$0: only main is pushed, and this is $(git rev-parse --abbrev-ref HEAD)" >&2
    exit 2
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
    echo "==> Nothing to push: origin/main is main."
    exit 0
fi
new="$("$HOURS" redate "$base" "$old")"
git update-ref -m "ci/push.sh: dated inside the hours" refs/heads/main "$new" "$old"
echo "==> $count commit(s) dated inside the hours, $old -> $new"
git push -u origin main
echo "==> Pushed main, $(git rev-parse --short HEAD), at $(date '+%H:%M')"
