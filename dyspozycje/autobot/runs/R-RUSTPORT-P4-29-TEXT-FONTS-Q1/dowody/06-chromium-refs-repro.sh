#!/bin/bash
# R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — regenerate the Chromium references and
# check that MANIFEST.sha256 (every fixture + gen.mjs + fonts) is unchanged.
cd "$(dirname "$0")/../../../../../rust-port/renderer/tests/fixtures/text" || exit 1
cp MANIFEST.sha256 /tmp/p429-manifest.before
NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs
echo "gen EXIT=$?"
diff /tmp/p429-manifest.before MANIFEST.sha256 && echo "MANIFEST IDENTICAL ($(wc -l < MANIFEST.sha256) entries)"
echo "diff EXIT=$?"
sha256sum -c MANIFEST.sha256 | grep -vc ': OK$' | sed 's/^/files not OK: /'
cat versions.txt
rm -f /tmp/p429-manifest.before
