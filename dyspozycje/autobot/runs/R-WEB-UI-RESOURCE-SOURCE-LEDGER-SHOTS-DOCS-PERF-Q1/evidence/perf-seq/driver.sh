#!/bin/bash
# 5 par sekwencyjnych ON/OFF (100 tur, seed 4242, przeladowanie strony przy kazdym przebiegu).
# Kolejnosc par naprzemienna: ON,OFF / OFF,ON, zeby nie faworyzowac jednego wariantu.
SCR=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
cd $SCR/kopia
run() {
  local name=$1
  local extra=""
  if [[ $name == off-* ]]; then extra="--ledger-off"; fi
  mkdir -p $SCR/perf-seq/$name
  echo "START $name $(date +%T)" >> $SCR/perf-seq/driver.log
  node tools/endturn-gate-diag-measure.cjs --run --pw $SCR/kopia --dist $SCR/dist --out $SCR/perf-seq/$name --seed 4242 --turns 100 --gate-fix taxsplit $extra > $SCR/perf-seq/$name.log 2>&1 < /dev/null
  echo "END $name rc=$? $(date +%T)" >> $SCR/perf-seq/driver.log
}
run on-1
run off-1
run off-2
run on-2
run on-3
run off-3
run off-4
run on-4
run on-5
run off-5
echo ALLDONE >> $SCR/perf-seq/driver.log
