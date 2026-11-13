#!/bin/bash
# R2 regresje: uruchamia testy z gra/tools, zapisuje gate-<nazwa>-r2.txt z linia EXIT=
cd /home/user/The-Game/.claude/worktrees/wf_3eb95e2d-343-3/gra || exit 1
R=../dyspozycje/autobot/runs/R-WEB-PERF-PLACED-IMPROVEMENTS-CACHE-Q1
for t in trade-grant-test zloto-szlak-test mennica-uspienie-test auto-improvements-test auto-improve-q3-test auto-improve-no-item-cap-test \
  trade-routes-test trade-routes-contact-only-test trade-routes-hud-filter-test trade-routes-income-test trade-routes-limit-test trade-routes-ownership-income-test \
  okolica-test okolica-isworkable-silnik-test okolica-multi-city-overlap-test okolica-tryb-reset-ownership-change-test okolica-load-reconcile-test okolica-ownership-change-reconcile-test \
  autoimprove-irrigation-after-farms-test autoimprove-river-forest-first-q1-test autoimprove-stages-q1-test autoimprove-river-forest-clear-no-citizen-q1-unit-test; do
  timeout 500 node "tools/$t.cjs" > "$R/gate-$t-r2.txt" 2>&1
  echo "EXIT=$?" >> "$R/gate-$t-r2.txt"
  echo "$t: $(grep -E 'WYNIK|passed|PASS.*FAIL|EXIT' "$R/gate-$t-r2.txt" | tail -2 | tr '\n' ' ')"
done
