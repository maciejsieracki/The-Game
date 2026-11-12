#!/bin/bash
# usage: cherry.sh <list-file>; prints per-branch count of commits with and without patch equivalent on base 358cb6cf6
cd /home/user/The-Game/.claude/worktrees/wf_c4402e8a-382-1 || exit 1
while read -r b; do
  out=$(git cherry 358cb6cf6 "$b")
  plus=$(printf '%s\n' "$out" | grep -c '^+')
  minus=$(printf '%s\n' "$out" | grep -c '^-')
  echo "$b plus_not_in_base=$plus equiv_in_base=$minus"
done < "$1"
