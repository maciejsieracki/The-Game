#!/bin/bash
# R4 regeneracja wektorow z weba 638e90bea. Uzycie: regen2.sh <q5|q6|empirefood|orderlane> [TAG]
set -e
R=${R_WT:-/home/user/The-Game/.claude/worktrees/wf_6b34d676-080-1}
S=${SCRATCH:-/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad}
ESB=/root/.npm/_npx/fd45a72a545557e9/node_modules/esbuild/lib/main.js
RUNS=$R/dyspozycje/autobot/runs
case "$1" in
  q5) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1/gen-p6-adv-q5-vectors.mjs ;;
  q6) GEN=$RUNS/R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1/gen-p6-adv-q6-vectors.mjs ;;
  empirefood) GEN=$RUNS/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/tools/gen-p6-empirefood-vectors.mjs ;;
  orderlane) GEN=$RUNS/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/tools/gen-p6-order-lane-vectors.mjs ;;
  *) echo "nieznana $1"; exit 2 ;;
esac
PIN_DATA="${PIN_DATA-units}"
PIN_SRC="${PIN_SRC-}"
TMPGEN=$S/gen2-$1.mjs
python3 $RUNS/R-RUSTPORT-REPIN-EKONOMIA-CERAMIKA-GARNCARSTWO-Q1/mkgen-r4.py "$GEN" "$TMPGEN" "$PIN_DATA" "$PIN_SRC"
OUT=$S/vec2/${2:-x}/$1
rm -rf "$OUT"; mkdir -p "$OUT"
cd "$R"
if [ "$1" = "orderlane" ]; then
  node "$TMPGEN" "$R" "$S/gw2-$1" "$ESB" "$OUT/order_lane.json" ${ECONFILE:-}
else
  node "$TMPGEN" "$R" "$S/gw2-$1" "$ESB" "$OUT"
fi
rm -rf "$S/gw2-$1"
md5sum $OUT/*.json | head -3
