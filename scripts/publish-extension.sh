#!/usr/bin/env bash
# Builds the extension and publishes ONLY the built files plus the friends' install guide
# to a separate branch called `extension`. Friends download that branch as a zip.
#
#   bash scripts/publish-extension.sh          # build, update local `extension` branch, push if `origin` exists
#   PUSH=0 bash scripts/publish-extension.sh   # only update the local branch
set -euo pipefail
cd "$(dirname "$0")/.."

SITE_URL="${SITE_URL:-https://lernling.vercel.app}"

echo "==> Building the extension"
npm run build --workspace @lernling/extension

SRC="apps/extension/.output/chrome-mv3"
[ -f "$SRC/manifest.json" ] || { echo "Build output not found at $SRC"; exit 1; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/lernling-extension"
cp -r "$SRC"/. "$TMP/lernling-extension/"

# Work out the GitHub owner/repo from the `origin` remote, to fill in the download link.
REMOTE="$(git remote get-url origin 2>/dev/null || true)"
SLUG="$(printf '%s' "$REMOTE" | sed -E 's#^(git@github.com:|https://github.com/)##; s#\.git$##')"
if [ -n "$SLUG" ] && [ "$SLUG" != "$REMOTE" ]; then
  DOWNLOAD_URL="https://github.com/$SLUG/archive/refs/heads/extension.zip"
  REPO_NAME="${SLUG#*/}"
else
  DOWNLOAD_URL="(download link not set yet: ask the person who sent you this)"
  REPO_NAME="lernling"
fi
sed -e "s#{{DOWNLOAD_URL}}#$DOWNLOAD_URL#g" \
    -e "s#{{REPO_NAME}}#$REPO_NAME#g" \
    -e "s#{{SITE_URL}}#$SITE_URL#g" \
    docs/friends-readme.md > "$TMP/README.md"

echo "==> Creating the extension-only branch"
NAME="$(git config user.name || echo Lernling)"
EMAIL="$(git config user.email || echo noreply@example.com)"
git -C "$TMP" init -q -b extension
git -C "$TMP" add -A
git -C "$TMP" -c user.name="$NAME" -c user.email="$EMAIL" commit -q -m "Lernling extension $(date -u +%Y-%m-%d)"
git fetch -q "$TMP" extension:refs/heads/extension --force

if [ "${PUSH:-1}" = "1" ] && [ -n "$REMOTE" ]; then
  echo "==> Pushing branch 'extension' to origin"
  git push --force origin extension:extension
  echo "Friends download link: $DOWNLOAD_URL"
else
  echo "Local branch 'extension' updated (not pushed)."
fi
