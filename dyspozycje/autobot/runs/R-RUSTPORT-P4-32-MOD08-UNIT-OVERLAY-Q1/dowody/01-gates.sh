#!/usr/bin/env bash
# R-RUSTPORT-P4-32 — gates of rust-port/renderer, raw output with EXIT codes.
# Usage: 01-gates.sh <repo root>
cd "$1/rust-port/renderer" || exit 2
T=$(mktemp -d)
echo "## pwd $(pwd)  HEAD $(git rev-parse --short HEAD)  (working tree: $(git status --short . | wc -l) changed/untracked paths under rust-port/renderer)"
echo "## rustc $(rustc --version) | 1.87: $(rustc +1.87.0 --version)"
echo '$ cargo fmt --all -- --check'
cargo fmt --all -- --check 2>&1 | tail -20; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo clippy --locked --all-targets -- -D warnings'
cargo clippy --locked --all-targets -- -D warnings 2>&1 | tail -5; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'
cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1 | tail -5; echo "EXIT=${PIPESTATUS[0]}"
echo '$ cargo test --locked --all-targets'
cargo test --locked --all-targets > $T/p432-test-stable.txt 2>&1; E=$?
grep -E "^test result|Running|FAILED|panicked" $T/p432-test-stable.txt; echo "EXIT=$E"
# shared machine, little free disk: drop the stable artefacts before the 1.87.0 build
cargo clean -q; echo "## disk after cargo clean: $(df -h / | tail -1)"
echo '$ cargo +1.87.0 test --locked --all-targets'
cargo +1.87.0 test --locked --all-targets > $T/p432-test-187.txt 2>&1; E=$?
grep -E "^test result|Running|FAILED|panicked" $T/p432-test-187.txt; echo "EXIT=$E"
cargo clean -q
for f in $T/p432-test-stable.txt $T/p432-test-187.txt; do
  echo "## $f: passed=$(grep -oE '[0-9]+ passed' "$f" | awk '{s+=$1} END {print s}') failed=$(grep -oE '[0-9]+ failed' "$f" | awk '{s+=$1} END {print s}')"
done
echo '$ git diff --cached --check && git diff --check   (run after the explicit git add of the allowlist)'
cd "$1" && git diff --cached --check && git diff --check; echo "EXIT=$?"
