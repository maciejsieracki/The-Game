#!/bin/bash
# Syntetyczny commit "hybrid" = web origin/main z cofnietymi do pinu 4bbef081d plikami SPOZA zakresu EKONOMIA-F:
#  - terrain-improvements.ts (R-WEB-IMPROVEMENT-ERA-SCALING-Q1; dlug R-RUSTPORT-REPIN-IMPROVEMENT-ERA-F-Q1)
#  - trade-routes.ts (R-WEB-TRADE-ROUTE-CONTACT-ONLY-Q1 / TRADE-SEA-BONUS-REQUIRES-PORT-Q1; temat handlu)
# Wylacznie lokalny ref refs/ekonf/hybrid do generowania wektorow (nie pushowany).
set -e
cd /home/user/The-Game/.claude/worktrees/wf_73568134-40d-1
IDX=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/hybrid.idx
rm -f $IDX
export GIT_INDEX_FILE=$IDX
git read-tree origin/main
for f in gra/src/game/terrain-improvements.ts gra/src/game/trade-routes.ts gra/data/buildings.json; do
  blob=$(git rev-parse 4bbef081d:$f)
  git update-index --cacheinfo 100644,$blob,$f
done
tree=$(git write-tree)
unset GIT_INDEX_FILE
commit=$(echo "hybrid origin/main minus out-of-scope files" | git commit-tree $tree)
git update-ref refs/ekonf/hybrid $commit
echo "hybrid=$commit"
rm -f $IDX
