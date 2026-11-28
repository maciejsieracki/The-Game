#!/bin/bash
# usage: measure-nns.sh <label> <seed> [turns]  -- runner aibal2-measure-run-nns (start przez __nnsMeasureDebug.startGame, jak FALA 857)
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aiempty2
LBL=$1; SEED=$2; TURNS=${3:-60}
OUT=$S/runs/nns-$LBL-$SEED; PROF=$S/prof/nns-$LBL-$SEED
rm -rf $OUT $PROF; mkdir -p $OUT $PROF
cd $S/base/gra && node tools/aibal2-measure-run-nns.cjs --dist $S/dist-$LBL --profile $PROF --out $OUT --seed $SEED --turns $TURNS --stop-at $TURNS --every 10 > $OUT/console.txt 2>&1
echo RUN_EXIT=$?
node tools/aiempty-analyze.cjs nns-$LBL-$SEED=$OUT 2>&1 | head -4
