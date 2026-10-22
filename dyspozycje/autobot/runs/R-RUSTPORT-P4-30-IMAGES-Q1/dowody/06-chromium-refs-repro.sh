#!/bin/bash
# R-RUSTPORT-P4-30-IMAGES-Q1 — regenerate the Chromium references and check that
# MANIFEST.sha256 (every fixture + gen.mjs + inputs + fonts) is unchanged.
cd "$(dirname "$0")/../../../../../rust-port/renderer/tests/fixtures/image" || exit 1
before=$(mktemp)
cp MANIFEST.sha256 "$before"
NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs 2>&1 | grep -v -e ExperimentalWarning -e 'trace-warnings'
echo "gen EXIT=${PIPESTATUS[0]}"
diff "$before" MANIFEST.sha256 && echo "MANIFEST IDENTICAL ($(wc -l < MANIFEST.sha256) entries)"
echo "diff EXIT=$?"
sha256sum -c MANIFEST.sha256 | grep -vc ': OK$' | sed 's/^/files not OK: /'
cat versions.txt
rm -f "$before"
