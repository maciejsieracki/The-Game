#!/bin/bash
# Runs every mutant of mutants.txt (NAME|FILE|SED, FILE relative to rust-port/renderer).
B=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p417op/mut
while IFS='|' read -r name file expr; do
  [ -z "$name" ] && continue
  case "$name" in \#*) continue ;; esac
  bash "$B/run.sh" "$name" "$file" "$expr"
done < "$B/mutants.txt"
