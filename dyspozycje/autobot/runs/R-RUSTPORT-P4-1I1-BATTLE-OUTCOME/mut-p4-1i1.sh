#!/bin/bash
# Mutacje P4-1I1: kazda musi dac FAIL testu p4_1i1_battle_outcome.
S=/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad
cd /home/user/The-Game/.claude/worktrees/wf_8948228b-2a5-1/rust-port/engine || exit 2
F=src/domain/siege_tactics_outcome.rs
cp "$F" "$S/outcome.bak"
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=$S/tgt-en
for m in M1 M2 M3 M4; do
  cp "$S/outcome.bak" "$F"
  python3 "$S/mut.py" "$F" "$m" || { echo "$m APPLY-FAIL"; continue; }
  out=$(cargo test --test p4_1i1_battle_outcome 2>&1)
  rc=$?
  echo "$m rc=$rc $(echo "$out" | grep -E '^test result')"
  echo "$out" | grep -E '^test .* FAILED$' | sed "s/^/  $m /"
done
cp "$S/outcome.bak" "$F"
cargo test --test p4_1i1_battle_outcome 2>&1 | grep -E '^test result' | sed 's/^/RESTORED /'
