#!/bin/bash
# usage: gates.sh <przed|po>
cd /home/user/The-Game/.claude/worktrees/wf_935d2123-6af-1/gra || exit 9
R=../dyspozycje/autobot/runs/R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1
P=$1
for t in battle-standoff-two-warriors battle-melee-attack-doctrine bitwa-auto-atak-wielojednostkowy-evaluation battle-formation-rules diplomacy war-era-counter unit-owner-emblem-ring-civ-color battle-manual-orders-routing battle-attack-move-order battle-dead-unit-disappearance; do
  [ -f tools/$t-test.cjs ] || continue
  timeout 280 node tools/$t-test.cjs > $R/gate-r3-$P-$t.txt 2>&1
  echo "EXIT=$?" >> $R/gate-r3-$P-$t.txt
  echo "$t: $(tail -3 $R/gate-r3-$P-$t.txt | tr '\n' ' ' | cut -c1-200)"
done
timeout 400 node node_modules/typescript/bin/tsc --noEmit > $R/gate-r3-$P-tsc.txt 2>&1
echo "EXIT=$?" >> $R/gate-r3-$P-tsc.txt
tail -2 $R/gate-r3-$P-tsc.txt
