#!/bin/bash
# Runs every mutant of mutants.txt (NAME|FILE|SED, FILE relative to
# rust-port/renderer), both files taken from THIS directory of the repo.
HERE="$(cd "$(dirname "$0")" && pwd)"
while IFS='|' read -r name file expr; do
  [ -z "$name" ] && continue
  case "$name" in \#*) continue ;; esac
  bash "$HERE/run.sh" "$name" "$file" "$expr"
done < "$HERE/mutants.txt"
