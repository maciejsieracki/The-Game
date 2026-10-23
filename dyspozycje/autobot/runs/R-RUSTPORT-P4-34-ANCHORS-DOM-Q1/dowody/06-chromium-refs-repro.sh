#!/bin/bash
# R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — regenerate the Chromium references a second time in a scratch
# copy (outside the repo) and compare MANIFEST.sha256 with the committed one.
# Needs: node 22, playwright 1.56.1 (NODE_PATH), Chromium 141 (PLAYWRIGHT_BROWSERS_PATH), three@0.169.0
# installed outside the repo (THREE_DIR), git with the pin edb8fb56.
set -u
REPO="$(cd "$(dirname "$0")/../../../../.." && pwd)"
R="$REPO/rust-port/renderer"
SCRATCH="${SCRATCH:-$(mktemp -d)}"
THREE_DIR="${THREE_DIR:?set THREE_DIR=<scratch>/node_modules/three (three@0.169.0)}"
mkdir -p "$SCRATCH/x/tests/fixtures/labels"
cp "$R/tests/fixtures/labels/gen.mjs" "$SCRATCH/x/tests/fixtures/labels/"
ln -sfn "$R/assets" "$SCRATCH/x/assets"
echo "## scratch $SCRATCH ; node $(node --version)"
cd "$REPO" || exit 1
NODE_PATH=${NODE_PATH:-/opt/node22/lib/node_modules} PLAYWRIGHT_BROWSERS_PATH=${PLAYWRIGHT_BROWSERS_PATH:-/opt/pw-browsers} \
  THREE_DIR="$THREE_DIR" node --no-warnings "$SCRATCH/x/tests/fixtures/labels/gen.mjs"
echo "gen EXIT=$?"
echo "## diff of MANIFEST.sha256 (committed vs regenerated; empty = identical)"
diff "$R/tests/fixtures/labels/MANIFEST.sha256" "$SCRATCH/x/tests/fixtures/labels/MANIFEST.sha256"
echo "diff EXIT=$?"
echo "## committed MANIFEST.sha256 sha256: $(sha256sum < "$R/tests/fixtures/labels/MANIFEST.sha256" | cut -d' ' -f1) ($(wc -l < "$R/tests/fixtures/labels/MANIFEST.sha256") entries)"
rm -rf "$SCRATCH/x"
