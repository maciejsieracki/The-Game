#!/bin/bash
# Uruchamia weryfikator Python P6.M03 (surowy log + EXIT).
cd /home/user/scratch-m03/gen || exit 2
ENGINE=/home/user/The-Game/.claude/worktrees/wf_1cdaadde-d5c-1/rust-port/engine
START=$(date +%s)
python3 -I verify-m03-web.py /home/user/scratch-m03 "$ENGINE/tests/p6_m03_vectors" "$ENGINE" > /home/user/scratch-m03/verify-m03-web.log 2>&1
echo "EXIT=$?" >> /home/user/scratch-m03/verify-m03-web.log
echo "CZAS_S=$(( $(date +%s) - START ))" >> /home/user/scratch-m03/verify-m03-web.log
