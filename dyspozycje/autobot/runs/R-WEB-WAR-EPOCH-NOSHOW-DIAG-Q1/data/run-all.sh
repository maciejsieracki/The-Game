#!/bin/bash
cd /home/user/The-Game/.claude/worktrees/wf_a128750d-3d2-1/gra
D=/home/user/The-Game/.claude/worktrees/wf_a128750d-3d2-1/dyspozycje/autobot/runs/R-WEB-WAR-EPOCH-NOSHOW-DIAG-Q1/data
run() { node tools/r-web-war-epoch-diag.cjs --seed $1 --turns 70 --ai 5 --flag warRulesMultiwar=$2 --out $D/run-s$1-w$2.json > $D/log-s$1-w$2.txt 2>&1; echo "done s$1 w$2 exit=$?" >> $D/progress.txt; }
run 101 true & run 102 true & run 103 true & wait
run 101 false & run 102 false & run 103 false & wait
echo ALLDONE >> $D/progress.txt
