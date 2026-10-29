# Integracja lokalna — R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1

**Etap 9/11 — zintegrowano do lokalnego `main`.**

- Wspólny candidate z gałęzią lokalnego `main` fast-forward do `e6bb51a5`; product commit `ad932ea6`, Final Control `2fee27f1`.
- Przed integracją na gałęzi kandydata: production mount Chromium 9/9 na Roboczej HTML przy body zoom 150%, 88+1 wpisach, marginesach ≥24 px, bez page overflow; typecheck PASS; `git diff --check` PASS.
- Real-render 34/34 niezależnie potwierdzony przez Final Control z disposable harnessem kierującym screenshot poza pełne `/tmp`.
- Ograniczenie: komponent kandydata jest montowany do dokumentu Roboczej; callbacki CTA są fixture'ami, a pełna transakcja gry nie jest testowana.

Deploy do Roboczej i push są odroczone do wspólnej fali po pozostałych poprawkach.
