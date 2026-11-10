#!/bin/bash
# R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — dispatch gates (run from anywhere; works in rust-port/renderer).
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
echo "## pwd $(pwd)  HEAD $(git rev-parse --short HEAD)  (working tree: $(git status --porcelain | wc -l) changed/untracked paths)"
echo "## rustc $(rustc --version) | 1.87: $(rustc +1.87.0 --version)"
echo; echo '$ cargo fmt --all -- --check'
cargo fmt --all -- --check; echo "EXIT=$?"
echo; echo '$ cargo clippy --locked --all-targets -- -D warnings'
cargo clippy --locked --all-targets -- -D warnings 2>&1; echo "EXIT=$?"
echo; echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'
cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1; echo "EXIT=$?"
echo; echo '$ cargo test --locked --all-targets'
cargo test --locked --all-targets 2>&1; echo "EXIT=$?"
echo; echo '$ cargo +1.87.0 test --locked --all-targets'
cargo +1.87.0 test --locked --all-targets 2>&1; echo "EXIT=$?"
