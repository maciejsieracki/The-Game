#!/bin/bash
# Uruchamia verify-m03-strait.py (surowy log + EXIT). Uzycie: r2-verify.sh <korzen worktree>
W="${1:-/home/user/The-Game/.claude/worktrees/wf_1cdaadde-d5c-3}"
R="$W/dyspozycje/autobot/runs/R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1"
python3 -I "$R/verify-m03-strait.py" "$W/rust-port/engine/tests/p6_m03_vectors/strait.json" "$W/rust-port/engine/data/derived/mapgen-masks.json" > "$R/r2-verify-strait.log" 2>&1
echo "EXIT=$?" >> "$R/r2-verify-strait.log"
cat "$R/r2-verify-strait.log"
