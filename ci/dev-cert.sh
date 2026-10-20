#!/bin/sh
# Make the certificate the development server uses for HTTPS, so that the game
# can be tried from another computer on the network with everything working.
#
#   ci/dev-cert.sh            make the local authority once, and a certificate for
#                             this machine's name and addresses, signed by it
#   ci/dev-cert.sh --renew    make the machine's certificate again, keeping the
#                             authority (after a change of address)
#
# A browser gives a page SharedArrayBuffer, which stopping a runaway program
# needs, only in a secure context: https, or http on localhost. From another
# computer the dev server is neither unless it serves HTTPS with a certificate
# that computer trusts. This makes a small certificate authority of this
# machine's own, kept outside the repository in ~/.config/kydux/tls/, and a
# certificate for <hostname>.local, localhost and every address of this
# machine. The other computer trusts the authority once (dev-environment.md
# says how); the private keys never leave this machine.

set -eu

DIR="${KYDUX_TLS_DIR:-$HOME/.config/kydux/tls}"
RENEW=""
case "${1:-}" in
    "") ;;
    --renew) RENEW=yes ;;
    *) echo "usage: $0 [--renew]" >&2; exit 2 ;;
esac

mkdir -p "$DIR"
chmod 700 "$DIR"
umask 077

host="$(hostname)"

# The authority is limited by name constraints to this machine's names and to
# private addresses, so that trusting it on another computer trusts nothing
# else: even with its key, no real website's certificate can be made from it.
constraints="permitted;DNS:localhost,permitted;DNS:$host,permitted;DNS:$host.local"
for range in 127.0.0.0/255.0.0.0 10.0.0.0/255.0.0.0 172.16.0.0/255.240.0.0 \
        192.168.0.0/255.255.0.0 ::1/ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff \
        fc00::/fe00::; do
    constraints="$constraints,permitted;IP:$range"
done

if [ ! -f "$DIR/ca.key" ]; then
    openssl req -x509 -newkey rsa:3072 -nodes -days 3650 \
        -keyout "$DIR/ca.key" -out "$DIR/ca.crt" \
        -subj "/CN=Kydux development ($(hostname))" \
        -addext "basicConstraints=critical,CA:TRUE,pathlen:0" \
        -addext "keyUsage=critical,keyCertSign,cRLSign" \
        -addext "nameConstraints=critical,$constraints" 2>/dev/null
    chmod 644 "$DIR/ca.crt"
    echo "==> Made the local authority: $DIR/ca.crt"
fi

if [ -f "$DIR/server.crt" ] && [ -z "$RENEW" ]; then
    echo "==> The certificate exists: $DIR/server.crt (--renew to make it again)"
    exit 0
fi

names="DNS:localhost,DNS:$host,DNS:$host.local,IP:127.0.0.1,IP:::1"
# Only private addresses: the authority may not sign for any other.
for address in $(hostname -I 2>/dev/null); do
    case "$address" in
        10.*|192.168.*|172.1[6-9].*|172.2[0-9].*|172.3[01].*|f[cd]*) names="$names,IP:$address" ;;
    esac
done

openssl req -newkey rsa:2048 -nodes -keyout "$DIR/server.key" -out "$DIR/server.csr" \
    -subj "/CN=$host.local" 2>/dev/null
printf 'subjectAltName=%s\nextendedKeyUsage=serverAuth\nkeyUsage=critical,digitalSignature,keyEncipherment\nbasicConstraints=CA:FALSE\n' \
    "$names" > "$DIR/server.ext"
# 825 days is the longest a browser accepts for a certificate of this kind.
openssl x509 -req -in "$DIR/server.csr" -CA "$DIR/ca.crt" -CAkey "$DIR/ca.key" \
    -CAcreateserial -days 825 -sha256 -extfile "$DIR/server.ext" -out "$DIR/server.crt" 2>/dev/null
rm -f "$DIR/server.csr" "$DIR/server.ext"
chmod 644 "$DIR/server.crt"
echo "==> Made the certificate for $names"
echo "    Trust $DIR/ca.crt once on the computer the game is tried from."
