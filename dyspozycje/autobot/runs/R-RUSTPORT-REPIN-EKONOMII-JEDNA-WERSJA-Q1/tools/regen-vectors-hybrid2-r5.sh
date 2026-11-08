#!/bin/bash
# REPIN-EKONOMIA-F runda 3: regeneracja wektorow ADV/EMPIREFOOD/POST/ORDER-LANE z URUCHOMIONEGO weba origin/main.
# Generatory z poprzednich runow sa uruchamiane BEZ ZMIAN logiki - jedyna zmiana to podmiana pinu
# (`rev-parse <stary pin>` -> `rev-parse origin/main`) w tymczasowej kopii poza repo.
# Uzycie: regen-vectors-ekonf.sh <nazwa> ; nazwy: q1 q2a q3 q4 q4b q5 q6 post empirefood orderlane
# Wyniki: $SCRATCH/vec-regen/<nazwa>/ ; kopiowanie do tests/ robi wolajacy (po obejrzeniu roznic).
set -e
R=/home/user/The-Game/.claude/worktrees/wf_107919b4-5d6-1
S=${SCRATCH:-/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad}
ESB=/root/.npm/_npx/fd45a72a545557e9/node_modules/esbuild/lib/main.js
RUNS=$R/dyspozycje/autobot/runs
case "$1" in
  q1) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1/gen-p6-adv-city-econ-vectors.mjs ;;
  q2a) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q2A-Q1/gen-p6-adv-q2a-vectors.mjs ;;
  q3) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1/gen-p6-adv-q3-vectors.mjs ;;
  q4) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1/gen-p6-adv-q4-vectors.mjs ;;
  q4b) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1/gen-p6-adv-q4b-preview-vectors.mjs ;;
  q5) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1/gen-p6-adv-q5-vectors.mjs ;;
  q6) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1/gen-p6-adv-q6-vectors.mjs ;;
  post) GEN=$RUNS/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/tools/gen-p6-econ-post-vectors.mjs ;;
  empirefood) GEN=$RUNS/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/tools/gen-p6-empirefood-vectors.mjs ;;
  orderlane) GEN=$RUNS/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/tools/gen-p6-order-lane-vectors.mjs ;;
  *) echo "nieznana nazwa $1"; exit 2 ;;
esac
TMPGEN=$S/gen-tmp-$1.mjs
# PINREF (domyslnie origin/main): ref webu, z ktorego `git archive` bierze zrodla; do dowodu rozlacznosci tematow
# mozna podac syntetyczny ref (origin/main z cofnietym plikiem spoza zakresu).
REF=${PINREF:-origin/main}
sed -E "s#'rev-parse', '(4bbef081d|23dd158e9)'#'rev-parse', '$REF'#" "$GEN" > "$TMPGEN"
# web main: bonus trasy morskiej wymaga Portu (R-WEB-TRADE-SEA-BONUS-REQUIRES-PORT-Q1) -> 2. argument builtByCity
# (przy PINREF z cofnietym trade-routes.ts do pinu funkcja ma tylko 1 parametr: poprawka niepotrzebna)
if [ -z "$PINREF" ]; then
  sed -i 's/W.computeSeaTradeBonusIncomeByCity(W.computeSeaTradeRouteCountByCity(routes))/W.computeSeaTradeBonusIncomeByCity(W.computeSeaTradeRouteCountByCity(routes), builtByCity)/' "$TMPGEN"
fi
# web main (main.ts:36758): popCapByCityId przekazuje 5. argument `builtIds.includes('spichlerz_ii')` (Spichlerz II = 12)
sed -i "s/W.resolvePopulationCapMatrixDelta(civKey)));/W.resolvePopulationCapMatrixDelta(civKey), builtIds.includes('spichlerz_ii')));/" "$TMPGEN"
if [ "$1" = "q1" ]; then python3 "$RUNS/R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1/patch-gen-q1.py" "$TMPGEN"; fi
OUT=$S/vec-regen${TAG}/$1
rm -rf "$OUT"; mkdir -p "$OUT"
cd "$R"
if [ "$1" = "orderlane" ]; then
  node "$TMPGEN" "$R" "$S/gw-$1" "$ESB" "$OUT/order_lane.json" "$R/rust-port/engine/data/econ-params.json"
else
  node "$TMPGEN" "$R" "$S/gw-$1" "$ESB" "$OUT"
fi
rm -rf "$S/gw-$1"
ls -la "$OUT"
