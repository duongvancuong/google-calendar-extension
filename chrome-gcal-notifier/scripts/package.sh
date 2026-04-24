#!/usr/bin/env bash
# scripts/package.sh — build a Chrome Web Store-ready zip of the extension.
#
# Usage:
#   ./scripts/package.sh
#
# Output:
#   dist/gcal-notifier-v<version>.zip
#
# The zip contains only the files Chrome needs at runtime:
#   manifest.json, background/, content/, popup/, src/, icons/
#
# The following are excluded: node_modules, tests, scripts, docs, dev
# configs (jest.config.js, package*.json, .git*, *.md, dist/).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

VERSION=$(node -e "console.log(require('./manifest.json').version)")
NAME="gcal-notifier-v${VERSION}"
DIST_DIR="$ROOT_DIR/dist"
ZIP_PATH="$DIST_DIR/${NAME}.zip"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_PATH"

echo "Packaging version ${VERSION} -> ${ZIP_PATH}"

# -x patterns are evaluated against paths relative to the zip root.
# Use -r to recurse and -X to strip OS metadata.
zip -r -X "$ZIP_PATH" . \
  -i 'manifest.json' \
     'background/*' \
     'content/*' \
     'popup/*' \
     'src/*' \
     'icons/*'

echo ""
echo "Contents of ${ZIP_PATH}:"
unzip -l "$ZIP_PATH"

SIZE_BYTES=$(wc -c < "$ZIP_PATH" | tr -d ' ')
SIZE_KB=$(( SIZE_BYTES / 1024 ))
echo ""
echo "Total size: ${SIZE_KB} KB"

# Chrome Web Store max upload is 10 MB; warn at 5 MB.
if [ "$SIZE_BYTES" -gt $((5 * 1024 * 1024)) ]; then
  echo "WARNING: package is larger than 5 MB. Review contents."
fi

echo ""
echo "Next steps:"
echo "  1. Test the zip locally:"
echo "     chrome://extensions -> Developer mode -> Load unpacked"
echo "     (or drag the zip into chrome://extensions after unzipping)"
echo "  2. Upload ${ZIP_PATH} to the Chrome Web Store dashboard."
