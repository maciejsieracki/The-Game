#!/usr/bin/env bash
# R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1 r2 — regeneracja wektorow z uruchomionego weba.
# Uzycie (katalogi robocze POZA repo):
#   WEB_ROOT=<katalog z gra/src i gra/data, np. wynik git archive origin/main gra/src gra/data> \
#   ESBUILD=<sciezka do esbuild 0.24.x> BUILD_DIR=<pusty katalog roboczy> \
#   bash gen-city-offer.sh > <repo>/rust-port/engine/tests/p6_ai_peace_city_offer_data/vectors.json
# Wymaga Node 22. Biblioteka `three` (tylko renderowanie, nie blok AI) jest zastapiona stubem:
# external + NODE_PATH; nazwy eksportow stubu sa wyciagane z uzyc `THREE.<Nazwa>` w WEB_ROOT.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
: "${WEB_ROOT:?ustaw WEB_ROOT}"
: "${ESBUILD:?ustaw ESBUILD}"
: "${BUILD_DIR:?ustaw BUILD_DIR (pusty katalog poza repo)}"
mkdir -p "$BUILD_DIR/node_modules/three"
NAMES=$(grep -rhoE 'THREE\.[A-Za-z_][A-Za-z0-9_]*' "$WEB_ROOT/gra/src" | sed 's/^THREE\.//' | sort -u | sed 's/.*/"&"/' | paste -sd, - || true)
echo "[$NAMES]" > "$BUILD_DIR/node_modules/three/names.json"
cat > "$BUILD_DIR/node_modules/three/index.js" <<'JS'
const names = require('./names.json');
const mk = () => {
  const s = new Proxy(function () {}, {
    get: (_t, k) => (k === '__esModule' || typeof k === 'symbol' ? undefined : s),
    set: () => true,
    apply: () => s,
    construct: () => s,
  });
  return s;
};
const exp = {};
for (const n of names) exp[n] = mk();
exp.__esModule = true;
module.exports = exp;
JS
cat > "$BUILD_DIR/tsconfig.json" <<EOF
{ "compilerOptions": { "paths": { "@web/*": ["$WEB_ROOT/gra/src/*"] } } }
EOF
"$ESBUILD" "$HERE/gen-city-offer.ts" --bundle --platform=node --format=cjs --target=node22 \
  --external:three --tsconfig="$BUILD_DIR/tsconfig.json" --outfile="$BUILD_DIR/gen.cjs" --log-level=warning
NODE_PATH="$BUILD_DIR/node_modules" node "$BUILD_DIR/gen.cjs"
