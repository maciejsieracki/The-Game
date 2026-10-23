#!/bin/bash
# R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 — regenerate both reference fixtures outside the repo and
# compare them byte for byte (sha256) with the committed ones.
# Usage: 06-fixtures-repro.sh <scratch dir outside the repository>
S=${1:?usage: 06-fixtures-repro.sh <scratch dir>}
F="$(cd "$(dirname "$0")/../../../../../rust-port/renderer/tests/fixtures/atlas" && pwd)"
echo "## fixtures dir $F"
bash "$F/gen.sh" "$S/keys" 2>&1 | grep -v ExperimentalWarning; echo "gen.sh EXIT=${PIPESTATUS[0]}"
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node "$F/gen_gl.mjs" "$S/gl"; echo "gen_gl EXIT=$?"
sha256sum "$F/atlas_keys.json" "$S/keys/out/atlas_keys.json" "$F/atlas_gl.json" "$S/gl/atlas_gl.json"
cmp "$F/atlas_keys.json" "$S/keys/out/atlas_keys.json" && echo "atlas_keys.json IDENTICAL"
cmp "$F/atlas_gl.json" "$S/gl/atlas_gl.json" && echo "atlas_gl.json IDENTICAL"
(cd "$F" && sha256sum -c SHA256SUMS); echo "sha256sum -c EXIT=$?"
