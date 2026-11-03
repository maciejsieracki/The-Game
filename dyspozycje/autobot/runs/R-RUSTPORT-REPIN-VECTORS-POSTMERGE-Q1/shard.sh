#!/bin/bash
# Uzycie: shard.sh <K> <N> <PREFIX> : testy integracyjne o indeksie = K (mod N); log logs/<PREFIX>-shard-K.txt
K=$1; N=$2; P=${3:-gate}
W=/home/user/The-Game/.claude/worktrees/wf_5aadb561-3e2-1
cd $W/rust-port/engine || exit 2
export CARGO_TARGET_DIR=/dev/shm/postmerge_q1 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
LOG=$W/dyspozycje/autobot/runs/R-RUSTPORT-REPIN-VECTORS-POSTMERGE-Q1/logs/$P-shard-$K.txt
ARGS=""; i=0
for f in $(ls tests/*.rs | sort); do
  if [ $((i % N)) -eq "$K" ]; then ARGS="$ARGS --test $(basename "$f" .rs)"; fi
  i=$((i+1))
done
if [ "$K" -eq 0 ]; then ARGS="--lib $ARGS"; fi
cargo test -j 2 --no-fail-fast $ARGS > "$LOG" 2>&1
echo "EXIT=$?" >> "$LOG"
grep -E "^test result" "$LOG" | awk '{p+=$4; f+=$6} END {print "passed="p" failed="f}'
grep -E "^test .* FAILED|^failures:" "$LOG" | head -10
tail -1 "$LOG"
