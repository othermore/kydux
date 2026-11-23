#!/bin/sh
# Publish the built game on GitHub Pages (docs/dev/dev-environment.md, "Publishing
# the game").
#
#   ci/publish.sh             build the game and push the build to the branch
#                             gh-pages, which GitHub Pages serves
#   ci/publish.sh --dry-run   build and make the commit, push nothing, and say
#                             where the commit is
#
# The branch holds the built files alone: app/dist without its source maps and
# without the levels' solutions (__debug/, which the tester's mode reads on a
# computer of one's own and on a server of trials), CNAME, the name the site
# answers to, and .nojekyll, which has GitHub serve the files as they are. Each
# publication is one commit on top of the branch's last; nothing of
# the branch is rewritten. The push is made inside the hours Kydux is seen working
# on GitHub (ci/hours.py) and refused outside them. The tree holds no change that
# is not committed, so that what is published is a commit's build.
#
# KYDUX_PAGES_REMOTE names the repository the branch is pushed to, a remote of
# this one or an address; origin when it is not set. KYDUX_PAGES_DIST names a
# folder already built, to try the script.

set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
HOST=kydux.kidux.org
BRANCH=gh-pages
DRY=""
for argument in "$@"; do
    case "$argument" in
        --dry-run) DRY=yes ;;
        *) echo "usage: $0 [--dry-run]" >&2; exit 2 ;;
    esac
done

remote="${KYDUX_PAGES_REMOTE:-origin}"
url="$(git remote get-url "$remote" 2>/dev/null)" || url="$remote"

if [ -z "$DRY" ] && ! python3 ci/hours.py allowed; then
    echo "$0: nothing is published outside the hours; --dry-run makes the commit and pushes nothing" >&2
    exit 2
fi
if [ -n "$(git status --porcelain)" ]; then
    echo "$0: the tree has changes not committed:" >&2
    git status --short >&2
    exit 2
fi

if [ -n "${KYDUX_PAGES_DIST:-}" ]; then
    dist="$KYDUX_PAGES_DIST"
else
    echo "==> Building the game"
    (cd app && npm run --silent build)
    dist=app/dist
fi
if [ ! -f "$dist/index.html" ]; then
    echo "$0: $dist holds no built game" >&2
    exit 2
fi
version="$(python3 -c 'import json; print(json.load(open("app/package.json"))["version"])')"
commit="$(git rev-parse --short HEAD)"

work="$(mktemp -d)"
site="$work/site"
[ -n "$DRY" ] || trap 'rm -rf "$work"' EXIT

# The branch as the repository has it, or a new one where it has none yet. Any
# other answer, a repository that cannot be reached, stops here.
status=0
git ls-remote --exit-code --heads "$url" "$BRANCH" >/dev/null 2>&1 || status=$?
case "$status" in
    0) git clone -q --depth 1 --branch "$BRANCH" "$url" "$site" ;;
    2)
        git init -q -b "$BRANCH" "$site"
        git -C "$site" remote add origin "$url"
        ;;
    *)
        echo "$0: $url cannot be read" >&2
        exit 2
        ;;
esac

echo "==> Copying $dist onto the branch $BRANCH"
find "$site" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
rsync -a --exclude='*.map' --exclude='/__debug/' "$dist"/ "$site"/
printf '%s\n' "$HOST" > "$site/CNAME"
: > "$site/.nojekyll"

git -C "$site" add -A
if git -C "$site" diff --cached --quiet; then
    echo "==> $BRANCH already holds this build: nothing to publish"
    exit 0
fi
git -C "$site" -c user.name="$(git config user.name)" -c user.email="$(git config user.email)" \
    commit -q -m "Publish version $version ($commit)"

if [ -n "$DRY" ]; then
    echo "==> Nothing pushed. The commit is in $site"
    exit 0
fi
echo "==> Pushing $BRANCH to $url"
git -C "$site" push -q origin "$BRANCH"
echo "==> Published version $version ($commit) for https://$HOST/"
