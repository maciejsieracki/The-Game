#!/usr/bin/env bash
# R-RUSTPORT-P4-33 — the reference generator run twice into separate scratch
# directories gives an identical MANIFEST.sha256 (and equal to the committed one).
# Usage: 06-generator-repro.sh <repo root> <scratch dir prepared as in the fixture README>
R="$1"; S="$2"
for o in a b; do
  rm -rf "$S/repro-$o"
  (cd "$S/refscript" && NODE_PATH="$S/ref/node_modules:/opt/node22/lib/node_modules" PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers \
    node gen.mjs "$S/repro-$o" "$R/rust-port/renderer/assets" 2>&1 | grep -v willReadFrequently | tail -2)
  echo "run $o EXIT=$? manifest sha256=$(sha256sum "$S/repro-$o/MANIFEST.sha256" | cut -c1-64)"
done
cmp "$S/repro-a/MANIFEST.sha256" "$S/repro-b/MANIFEST.sha256" && echo "run a == run b"
cmp "$S/repro-a/MANIFEST.sha256" "$R/rust-port/renderer/tests/fixtures/cityoverlay/MANIFEST.sha256" && echo "run a == committed MANIFEST.sha256"
echo "EXIT=$?"
