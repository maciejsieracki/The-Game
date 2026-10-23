#!/usr/bin/env bash
# R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1 — bramy (pełne surowe logi, EXIT po każdej).
# Uruchomienie: bash 01-gates.sh > 01-gates.log 2>&1 (z dowolnego katalogu).
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
echo "## HEAD"; git rev-parse HEAD; git status --short
echo "## rustc"; rustc --version; rustc +1.87.0 --version
echo "## cargo fmt --all -- --check"
cargo fmt --all -- --check; echo "EXIT=$?"
echo "## cargo clippy --locked --all-targets -- -D warnings"
cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
echo "## cargo clippy --locked --all-targets --features gpu -- -D warnings"
cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
echo "## cargo test --locked --all-targets (stable)"
cargo test --locked --all-targets --no-fail-fast; echo "EXIT=$?"
echo "## cargo +1.87.0 test --locked --all-targets"
cargo +1.87.0 test --locked --all-targets --no-fail-fast; echo "EXIT=$?"
echo "## git diff --check"
git diff --check; echo "EXIT=$?"
