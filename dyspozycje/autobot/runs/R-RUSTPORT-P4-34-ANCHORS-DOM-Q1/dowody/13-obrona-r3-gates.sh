#!/usr/bin/env bash
# Bramki obrony r3 (R-RUSTPORT-P4-34-ANCHORS-DOM-Q1), uruchamiane z rust-port/renderer.
export CARGO_TARGET_DIR=/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/tgt
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
echo "HEAD(base)=$(git rev-parse HEAD)"; cargo --version; rustc --version
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings 2>&1 | tail -3; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1 | tail -3; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo test --locked --all-targets'; cargo test --locked --all-targets 2>&1 | grep -E '^(test result|     Running|test .*FAILED|error)'; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo +1.87.0 test --locked --test labels_layout --test labels_scenes --test labels_anchors'
CARGO_TARGET_DIR=$CARGO_TARGET_DIR-187 cargo +1.87.0 test --locked --test labels_layout --test labels_scenes --test labels_anchors 2>&1 | grep -E '^(test result|     Running|test .*FAILED|error)'; echo "EXIT=${PIPESTATUS[0]}"
