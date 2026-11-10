#!/bin/bash
# Obrona r1 R-RUSTPORT-P4-30-IMAGES-Q1. Dysk kontenera ~3,5 GB wolne: debuginfo=0,
# incremental=0 (nie zmienia semantyki ani hashy RGBA), target czyszczony między toolchainami.
cd /home/user/The-Game/.claude/worktrees/wf_5b41339e-109-3/rust-port/renderer || exit 1
T=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt
export CARGO_TARGET_DIR=$T CARGO_PROFILE_DEV_DEBUG=0 CARGO_INCREMENTAL=0
echo "base: c92a28e1 + poprawki obrony r1 (working tree)"
rustc --version; rustc +1.87.0 --version
cargo fmt --all -- --check; echo "fmt EXIT=$?"
cargo clippy --locked --all-targets -- -D warnings; echo "clippy EXIT=$?"
cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "clippy-gpu EXIT=$?"
cargo test --locked --all-targets; echo "test-stable EXIT=$?"
rm -rf $T
cargo +1.87.0 test --locked --all-targets; echo "test-1.87 EXIT=$?"
rm -rf $T
