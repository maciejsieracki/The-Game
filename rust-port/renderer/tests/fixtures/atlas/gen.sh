#!/bin/bash
# R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 — regenerate atlas_keys.json from the web pin (outside the repo).
# Usage: gen.sh <scratch dir outside the repository>
# Needs: git, node 22, npm (registry access for three@0.169.0 + esbuild@0.24.0).
set -euo pipefail
S=${1:?usage: gen.sh <scratch dir>}
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(git -C "$HERE" rev-parse --show-toplevel)
case "$S" in "$REPO"*) echo "scratch dir must be outside the repository" >&2; exit 2;; esac
mkdir -p "$S/ref" "$S/websrc" "$S/refscript" "$S/out"
(cd "$S/ref" && [ -d node_modules/three ] || (npm init -y >/dev/null && npm install --ignore-scripts --no-audit --no-fund three@0.169.0 esbuild@0.24.0 >/dev/null))
git -C "$REPO" archive --format=tar edb8fb56 gra/src gra/data | tar -x -C "$S/websrc"
# Make module-private helpers importable: APPEND one export line, bodies untouched.
R="$S/websrc/gra/src/render"
printf '\nexport { civSigilCacheKey, leaderPortraitCacheKey, prodIconCacheKey, badgePixelRatio, badgeCanvasScale, cityBadgeLodSegment };\n' >> "$R/cityMapStatChip.ts"
printf '\nexport { workerSpriteCacheKey };\n' >> "$R/workerFieldOverlay.ts"
cp "$HERE/gen.ts" "$S/refscript/gen.ts"
NODE_PATH="$S/ref/node_modules" "$S/ref/node_modules/.bin/esbuild" "$S/refscript/gen.ts" \
  --bundle --platform=node --format=esm --outfile="$S/refscript/gen.mjs" \
  --loader:.json=json --log-level=warning
node "$S/refscript/gen.mjs" "$S/out"
sha256sum "$S/out/atlas_keys.json"
