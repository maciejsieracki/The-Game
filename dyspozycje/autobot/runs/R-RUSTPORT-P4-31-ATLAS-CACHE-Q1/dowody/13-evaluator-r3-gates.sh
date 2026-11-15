#!/bin/bash
S=/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad
cd $S/wt/rust-port/renderer || exit 9
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=$S/p431ev/target
cargo --version; rustc --version
echo "== fmt"; cargo fmt --all -- --check; echo "EXIT=$?"
echo "== clippy cpu"; cargo clippy --locked --all-targets -- -D warnings 2>&1 | tail -3; echo "EXIT=${PIPESTATUS[0]}"
echo "== clippy gpu"; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1 | tail -3; echo "EXIT=${PIPESTATUS[0]}"
echo "== test all"; cargo test --locked --all-targets > $S/p431ev/test-all.log 2>&1; echo "EXIT=$?"; grep -E '^test result' $S/p431ev/test-all.log | awk '{p+=$4; f+=$6; i+=$8} END {print "passed="p" failed="f" ignored="i}'
grep -E 'Running tests/atlas|^test result' $S/p431ev/test-all.log | grep -A1 atlas
echo "== test gpu"; cargo test --locked --features gpu --test atlas_gpu --test gpu_probe 2>&1 | grep -E '^test |^test result|SKIPPED'; echo "EXIT=${PIPESTATUS[0]}"
echo "GATES_DONE"
