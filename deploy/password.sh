#!/bin/sh
# Give a friend a password for the game served over the internet
# (docs/dev/dev-environment.md, "Opening the game to friends"): one line in
# nginx's password file, the password hashed, never kept in clear.
#
#   deploy/password.sh <name>     asks for the password twice, then adds or
#                                 replaces the friend's line (sudo)
#   deploy/password.sh --remove <name>
#
# Names are letters and digits. The file is /etc/nginx/kydux.htpasswd, read by
# nginx alone.

set -eu

FILE=/etc/nginx/kydux.htpasswd
REMOVE=""
NAME=""
for argument in "$@"; do
    case "$argument" in
        --remove) REMOVE=yes ;;
        *) NAME="$argument" ;;
    esac
done
case "$NAME" in
    "" | *[!A-Za-z0-9]*) echo "usage: $0 [--remove] <name>, letters and digits" >&2; exit 2 ;;
esac

sudo touch "$FILE"
sudo chown root:www-data "$FILE"
sudo chmod 640 "$FILE"

if [ -n "$REMOVE" ]; then
    sudo sed -i "/^$NAME:/d" "$FILE"
    echo "==> $NAME removed"
    exit 0
fi

printf 'Password for %s: ' "$NAME"
stty -echo; read -r FIRST; stty echo; echo
printf 'Again: '
stty -echo; read -r SECOND; stty echo; echo
if [ "$FIRST" != "$SECOND" ]; then
    echo "$0: the two passwords differ" >&2
    exit 2
fi
if [ "${#FIRST}" -lt 8 ]; then
    echo "$0: eight characters at least" >&2
    exit 2
fi
# The hash is SHA-512 crypt, which nginx reads, and the system's own form.
HASH="$(printf '%s' "$FIRST" | openssl passwd -6 -stdin)"
sudo sed -i "/^$NAME:/d" "$FILE"
printf '%s:%s\n' "$NAME" "$HASH" | sudo tee -a "$FILE" > /dev/null
echo "==> $NAME can sign in"
