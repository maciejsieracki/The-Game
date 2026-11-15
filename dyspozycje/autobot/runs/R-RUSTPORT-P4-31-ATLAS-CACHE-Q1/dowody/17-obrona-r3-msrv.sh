#!/bin/bash
# Obrona r3: MSRV 1.87 na kodzie obrony (zarzut 6).
S=/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad
cd $S/code/rust-port/renderer || exit 9
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=$S/p431ob-target
echo "HEAD=$(git rev-parse HEAD)"
cargo +1.87.0 --version; rustc +1.87.0 --version
echo "== cargo +1.87.0 test --locked --all-targets"
cargo +1.87.0 test --locked --all-targets > $S/p431ob/msrv-test.log 2>&1; echo "EXIT=$?"
grep -E '^test result' $S/p431ob/msrv-test.log | awk '{p+=$4; f+=$6; i+=$8} END {print "passed="p" failed="f" ignored="i}'
grep -E 'end_of_turn_alone|lru_eviction_of_a_shown' $S/p431ob/msrv-test.log
echo "== cargo +1.87.0 check --locked --all-targets --features gpu"
cargo +1.87.0 check --locked --all-targets --features gpu 2>&1 | tail -1; echo "EXIT=${PIPESTATUS[0]}"
echo "MSRV_DONE"
