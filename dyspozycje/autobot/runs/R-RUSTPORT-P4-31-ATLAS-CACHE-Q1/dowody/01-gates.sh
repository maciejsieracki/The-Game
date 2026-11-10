#!/bin/bash
# R-RUSTPORT-P4-31-ATLAS-CACHE-Q1 — dispatch gates (run from anywhere; works in rust-port/renderer).
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
echo; echo '$ cargo test --locked --features gpu --test atlas_gpu --test gpu_probe'
cargo test --locked --features gpu --test atlas_gpu --test gpu_probe 2>&1; echo "EXIT=$?"
# The container disk is shared and small: free the stable/gpu build before the MSRV build.
echo; echo '$ cargo clean (disk space before the MSRV build)'
cargo clean 2>&1 | tail -1; echo "EXIT=$?"
echo; echo '$ cargo +1.87.0 test --locked --all-targets'
cargo +1.87.0 test --locked --all-targets 2>&1; echo "EXIT=$?"
echo; echo '$ cargo test --locked --test atlas_keys --test atlas_mip --test atlas_nturns -- --nocapture (measured numbers)'
cargo test --locked --test atlas_keys --test atlas_mip --test atlas_nturns -- --nocapture 2>&1 | grep -E 'exact|step:|unpremultiply|turn (10|50|200):|pin model|test result'; echo "EXIT=${PIPESTATUS[0]}"
echo; echo '$ git diff --check (tracked) + Cargo.toml/Cargo.lock untouched'
git diff --check; echo "diff-check EXIT=$?"
git diff --quiet -- Cargo.toml Cargo.lock; echo "Cargo.toml/lock unchanged EXIT=$?"
grep -n 'forbid(unsafe_code)' src/lib.rs; echo "forbid EXIT=$?"
