#!/bin/bash
# uzycie: regen-hybrid.sh <nazwa...> ; generuje z refs/ekonf/hybrid do vec-regen/<nazwa>
set -e
cd /home/user/The-Game/.claude/worktrees/wf_73568134-40d-1
export PINREF=refs/ekonf/hybrid
for n in "$@"; do
  echo "=== $n"
  bash dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1/regen-vectors-ekonf.sh $n 2>&1 | tail -3 | cut -c1-160
done
