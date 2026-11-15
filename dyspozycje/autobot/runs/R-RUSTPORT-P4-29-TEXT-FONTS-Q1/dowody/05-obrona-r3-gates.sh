#!/bin/bash
# R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — obrona r3: bramy na HEAD obrony (surowe wyniki z EXIT=).
# CARGO_TARGET_DIR poza repo: S=<katalog scratch> bash 05-obrona-r3-gates.sh
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
export CARGO_TARGET_DIR=${S:?katalog scratch poza repo}/target
echo "HEAD $(git rev-parse HEAD)"
rustc --version; rustc +1.87.0 --version
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings 2>&1 | tail -3; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1 | tail -3; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo test --locked --all-targets (rustc 1.97.0)'
cargo test --locked --all-targets 2>&1 | grep -E '^test result|FAILED|panicked' | awk '{print} /^test result/ {p+=$4; f+=$6} END {print "SUM passed=" p " failed=" f}'; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo +1.87.0 test --locked --all-targets (MSRV)'
cargo +1.87.0 test --locked --all-targets 2>&1 | grep -E '^test result|FAILED|panicked' | awk '{print} /^test result/ {p+=$4; f+=$6} END {print "SUM passed=" p " failed=" f}'; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo test --locked --test text_edge_cases --test text_scenes --test text_upper -- --nocapture (nowe testy, wydruki)'
cargo test --locked --test text_edge_cases --test text_scenes --test text_upper -- --nocapture 2>&1 | grep -E '^(100px|bold 100px|x_text_rotated_gradient:|checked|test result)'; echo "EXIT=${PIPESTATUS[0]}"
cd ../.. && echo '$ git diff --check HEAD~1 HEAD' && git diff --check HEAD~1 HEAD; echo "EXIT=$?"
git status --short -- rust-port/renderer
