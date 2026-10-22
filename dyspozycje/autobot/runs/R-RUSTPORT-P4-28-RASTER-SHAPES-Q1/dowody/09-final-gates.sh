#!/bin/bash
# Final gates after the last test changes (R-RUSTPORT-P4-28, Operator r1).
cd /home/user/The-Game/.claude/worktrees/wf_99676387-673-1/rust-port/renderer || exit 1
cargo --version; rustc --version; cargo +1.87.0 --version
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
echo '$ cargo test --locked --all-targets'; cargo test --locked --all-targets; echo "EXIT=$?"
echo '$ cargo +1.87.0 test --locked --all-targets'; cargo +1.87.0 test --locked --all-targets; echo "EXIT=$?"
echo '$ cargo +1.87.0 clippy --locked --all-targets -- -D warnings'; cargo +1.87.0 clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
