#!/bin/sh
# Every check of Kydux, from the repository's root, stopping at the first failure.
#
#   ci/check.sh          the world's and the project's tests, lint, the i18n check,
#                        and the app's type check, tests and build
#   ci/check.sh --e2e    all that, then the browser tests against the built game
#
# The venv at .venv is used when there is one (docs/dev/dev-environment.md),
# the PATH's tools otherwise, as in CI.

set -eu

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"
E2E=""
for argument in "$@"; do
    case "$argument" in
        --e2e) E2E=yes ;;
        *) echo "usage: $0 [--e2e]" >&2; exit 2 ;;
    esac
done

if [ -x .venv/bin/python ]; then
    PATH="$REPO_ROOT/.venv/bin:$PATH"
fi

step() { echo "==> $*"; }

step "Python lint and format"
ruff check world tools tests
ruff format --check world tools tests

step "The world's and the project's tests"
pytest -q world tests/project tests/tools

step "The i18n files"
python3 tools/i18n_check.py

cd app
if [ ! -d node_modules ]; then
    step "The app's dependencies"
    npm ci
fi
step "The app's types"
npm run --silent typecheck
step "The app's tests"
npm test --silent
step "The app's build"
npm run --silent build

if [ -n "$E2E" ]; then
    step "The browser tests"
    npm run --silent e2e
    echo "==> The loop's screenshots are in app/e2e/shots/ (app/e2e/README.md)"
fi

echo "==> All checks passed"
