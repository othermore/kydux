#!/bin/sh
# Put the built game where nginx serves it to friends over the internet
# (docs/dev/dev-environment.md, "Opening the game to friends").
#
#   ci/deploy.sh          build the game and copy it into /srv/kydux
#   ci/deploy.sh --site   also copy deploy/nginx-kydux.conf into nginx's sites and
#                         reload nginx (needs sudo; run once, and again when the
#                         site's file changes)
#
# The copy keeps the files' names, so that a browser that holds an older build
# asks for the new page and gets new files with it; nothing of the repository
# but app/dist goes to /srv/kydux. The first time, the owner makes /srv/kydux
# (the commands are in the document above). KYDUX_DEPLOY_TARGET names another
# folder, to try the script.

set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
TARGET="${KYDUX_DEPLOY_TARGET:-/srv/kydux}"
SITE=/etc/nginx/sites-available/kydux

if [ ! -d "$TARGET" ] || [ ! -w "$TARGET" ]; then
    echo "$0: $TARGET must exist and be writable by $(id -un): see dev-environment.md" >&2
    exit 2
fi

echo "==> Building the game"
(cd app && npm run --silent build)

echo "==> Copying app/dist to $TARGET"
rsync -a --delete --exclude='*.map' app/dist/ "$TARGET"/
echo "==> $TARGET holds the build of $(git rev-parse --short HEAD)"

for argument in "$@"; do
    case "$argument" in
        --site)
            echo "==> Installing the nginx site (sudo)"
            sudo install -m 644 deploy/nginx-kydux.conf "$SITE"
            sudo ln -sf "$SITE" /etc/nginx/sites-enabled/kydux
            sudo nginx -t
            sudo systemctl reload nginx
            ;;
        *) echo "usage: $0 [--site]" >&2; exit 2 ;;
    esac
done
