#!/usr/bin/env bash
# R-RUSTPORT-P4-32 — re-runs the reference generator into a separate scratch
# directory and compares its MANIFEST with the committed fixtures.
# Usage: 06-generator-repro.sh <scratch dir with websrc/, ref/, refscript/> <repo root>
S="$1"
REPO="$2"
FX="$REPO/rust-port/renderer/tests/fixtures/overlay"
cp "$FX/gen.ts" "$FX/gen.mjs" "$S/refscript/"
cd "$S/refscript" || exit 2
echo "## generator re-run into $S/out-repro, compared with the committed fixtures"
NODE_PATH="$S/ref/node_modules:/opt/node22/lib/node_modules" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
  node gen.mjs "$S/out-repro" "$REPO/rust-port/renderer/assets" 2>&1 | grep -v "willRead\|ExperimentalWarning\|trace-warnings"
echo "gen EXIT=${PIPESTATUS[0]}"
if cmp "$S/out-repro/MANIFEST.sha256" "$FX/MANIFEST.sha256"; then
  echo "MANIFEST IDENTICAL ($(wc -l < "$FX/MANIFEST.sha256") entries)"
else
  echo "MANIFEST DIFFERS"
fi
echo "sha256(MANIFEST.sha256) = $(sha256sum "$FX/MANIFEST.sha256" | cut -c1-64)"
cat "$S/out-repro/versions.txt"
