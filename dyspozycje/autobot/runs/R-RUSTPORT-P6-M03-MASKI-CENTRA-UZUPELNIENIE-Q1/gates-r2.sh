#!/bin/bash
# Bramki P6.M03 runda 2: surowe, pelne logi z EXIT=. Uzycie: gates-r2.sh <korzen worktree>
W="${1:-/home/user/The-Game/.claude/worktrees/wf_1cdaadde-d5c-3}"
R="$W/dyspozycje/autobot/runs/R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1"
cd "$W/rust-port/engine" || exit 2
export CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_1cdaadde-d5c-3 CARGO_PROFILE_DEV_DEBUG=0
cargo fmt --check > "$R/r2-gate-fmt.log" 2>&1; echo "EXIT=$?" >> "$R/r2-gate-fmt.log"
cargo clippy --all-targets -- -D warnings > "$R/r2-gate-clippy.log" 2>&1; echo "EXIT=$?" >> "$R/r2-gate-clippy.log"
cargo test > "$R/r2-gate-test.log" 2>&1; echo "EXIT=$?" >> "$R/r2-gate-test.log"
echo gates-done
