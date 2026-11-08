#!/bin/bash
set -e
cd /home/user/The-Game/.claude/worktrees/wf_107919b4-5d6-1
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
IDX=$S/hybrid2.idx
rm -f $IDX
export GIT_INDEX_FILE=$IDX
git read-tree 331ef699b
blob=$(git rev-parse 247f1ef2a:gra/src/game/terrain-improvements.ts)
git update-index --cacheinfo 100644,$blob,gra/src/game/terrain-improvements.ts
tree=$(git write-tree)
unset GIT_INDEX_FILE
commit=$(echo "hybrid2 = 331ef699b + terrain-improvements.ts z origin/main 247f1ef2a (R-WEB-IMPROVEMENT-ERA-SCALING-Q1)" | git commit-tree $tree -p 331ef699b)
git update-ref refs/ekonf/hybrid2 $commit
echo "hybrid2=$commit"
rm -f $IDX
