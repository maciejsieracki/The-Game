#!/bin/bash
cd /home/user/The-Game/.claude/worktrees/wf_c43cd53a-064-3/rust-port/renderer || exit 9
export CARGO_INCREMENTAL=0
export CARGO_TARGET_DIR=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/target
echo '$ cargo fmt --all -- --check'
cargo fmt --all -- --check; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'
cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'
cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
echo '$ cargo test --locked --all-targets'
cargo test --locked --all-targets; echo "EXIT=$?"
echo '$ cargo +1.87.0 test --locked --test labels_layout --test labels_scenes --test labels_anchors'
CARGO_TARGET_DIR=$CARGO_TARGET_DIR-187 cargo +1.87.0 test --locked --test labels_layout --test labels_scenes --test labels_anchors; echo "EXIT=$?"
