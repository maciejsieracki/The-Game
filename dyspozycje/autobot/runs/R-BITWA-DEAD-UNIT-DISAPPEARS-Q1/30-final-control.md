# Final Control — R-BITWA-DEAD-UNIT-DISAPPEARS-Q1

Werdykt: **PASS-WITH-NOTES**, etap 8/11.

## Kontrole

- Potwierdziłem dokładny kandydat `0289b51586805b4c1f95e42cdd189a2a66e030f4`.
- `node gra/tools/battle-dead-unit-disappearance-test.cjs` — PASS: zabita jednostka jest natychmiast odłączona od sceny, zwalnia heks i zasoby; jednostka routowana pozostaje widoczna podczas ucieczki.
- `npm --prefix gra run typecheck` — PASS.
- `git diff --check origin/main...HEAD` — PASS.
- Niezależny Evaluator wcześniej ocenił tę samą poprawkę jako PASS-WITH-NOTES.

## Uwaga i dalsze bramki

`army-leadership-test.cjs` ma udokumentowany ten sam baseline fail na `origin/main` i kandydacie (`initialBattleLineOrder` nie istnieje); nie przypisuję go tej poprawce.

Pozostały merge do main, deploy do roboczej, smoke/readback oraz push. Żadnego z nich nie wykonano.
