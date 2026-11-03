#!/usr/bin/env bash
# Uzycie: run-shard.sh <engine_dir> <shard_idx> <shard_count> <out_log>
# Uruchamia `cargo test -j 2 --no-fail-fast` dla co N-tego pliku tests/*.rs (shard 0 dodatkowo --lib).
set -u
ENGINE="$1"; IDX="$2"; CNT="$3"; OUT="$4"
export CARGO_TARGET_DIR="${CARGO_TARGET_DIR:-/dev/shm/p6dypl1}" CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
cd "$ENGINE" || exit 99
ARGS=()
i=0
for f in $(ls tests/*.rs | sort); do
  if [ $((i % CNT)) -eq "$IDX" ]; then ARGS+=(--test "$(basename "$f" .rs)"); fi
  i=$((i + 1))
done
if [ "$IDX" -eq 0 ]; then ARGS+=(--lib); fi
cargo test -j 2 --no-fail-fast "${ARGS[@]}" > "$OUT" 2>&1
CODE=$?
P=$(grep -E '^test result:' "$OUT" | sed -E 's/.* ([0-9]+) passed; ([0-9]+) failed.*/\1 \2/' | awk '{p+=$1; f+=$2} END {print p+0, f+0}')
echo "SHARD $IDX/$CNT targets=$(( ${#ARGS[@]} / 2 )) exit=$CODE passed=${P% *} failed=${P#* }"
