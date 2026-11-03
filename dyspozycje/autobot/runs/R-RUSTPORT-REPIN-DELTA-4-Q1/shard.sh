#!/bin/bash
# Uzycie: shard.sh <K> <N> : uruchamia testy integracyjne o indeksie ≡ K (mod N) (posortowane nazwy), log gate-shard-K.txt
K=$1; N=$2
cd /home/user/The-Game/.claude/worktrees/wf_737bd667-9f6-3/rust-port/engine || exit 2
export CARGO_TARGET_DIR=/dev/shm/repin4_r3 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
LOG=/home/user/The-Game/.claude/worktrees/wf_737bd667-9f6-3/dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-4-Q1/logs/gate-shard-$K.txt
mkdir -p "$(dirname "$LOG")"
ARGS=""
i=0
for f in $(ls tests/*.rs | sort); do
  if [ $((i % N)) -eq "$K" ]; then ARGS="$ARGS --test $(basename "$f" .rs)"; fi
  i=$((i+1))
done
if [ "$K" -eq 0 ]; then ARGS="--lib $ARGS"; fi
cargo test -j 2 $ARGS > "$LOG" 2>&1
echo "EXIT=$?" >> "$LOG"
tail -3 "$LOG"
