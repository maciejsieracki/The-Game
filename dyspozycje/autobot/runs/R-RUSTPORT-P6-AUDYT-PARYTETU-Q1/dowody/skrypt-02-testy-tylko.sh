#!/bin/bash
# For each zero-reference module (src+benches), count files under engine tests/ mentioning it.
cd /home/user/The-Game/.claude/worktrees/wf_c4402e8a-382-1/rust-port/engine || exit 1
S=/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad
awk -F'\t' '$2==0{print $1}' $S/callers_full.tsv | while read -r m; do
  n=$(grep -rlw -- "$m" tests 2>/dev/null | wc -l)
  echo "$m tests_files=$n"
done
