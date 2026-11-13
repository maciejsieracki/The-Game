#!/bin/bash
cd /home/user/The-Game/.claude/worktrees/wf_f0c87e41-20c-3/gra
O=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
for t in autoimprove-stages-q1 auto-improvements ai-improvements auto-improve-q3 auto-improve-no-item-cap autoimprove-irrigation-after-farms autoimprove-live-hooks autoimprove-river-forest-first-q1 ai-food-improvement-priority-stages road-connectivity road-hook-mainguard map-improvement-qualify improvement-territory-gate roads-city-links-only; do
  f=tools/$t-test.cjs
  [ -f "$f" ] || { echo "$t MISSING"; continue; }
  timeout 280 node "$f" > "$O/g-$t.txt" 2>&1
  echo "$t EXIT=$? $(grep -E '[0-9]+ OK|passed' "$O/g-$t.txt" | tail -1)"
done
npx tsc --noEmit > "$O/tsc.txt" 2>&1
echo TSC=$?
