#!/bin/bash
# Bramki P6.M03: surowe, pelne logi z EXIT=.
R=/home/user/The-Game/.claude/worktrees/wf_1cdaadde-d5c-1/dyspozycje/autobot/runs/R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1
cd /home/user/The-Game/.claude/worktrees/wf_1cdaadde-d5c-1/rust-port/engine || exit 2
export CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_1cdaadde-d5c-1 CARGO_PROFILE_DEV_DEBUG=0
cargo fmt --check > "$R/gate-fmt.log" 2>&1; echo "EXIT=$?" >> "$R/gate-fmt.log"
cargo clippy --all-targets -- -D warnings > "$R/gate-clippy.log" 2>&1; echo "EXIT=$?" >> "$R/gate-clippy.log"
cargo test > "$R/gate-test.log" 2>&1; echo "EXIT=$?" >> "$R/gate-test.log"
echo gates-done
