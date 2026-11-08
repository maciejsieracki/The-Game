# Final Control — R-BITWA-MANUAL-MELEE-ATTACK-STUCK-Q1

Werdykt: **PASS-WITH-NOTES**, etap 8/11.

## Kontrole końcowe

- Commit produktu/operatora: `1e76791c`; evaluator Defense r2: `40-evaluator-r2.md` — PASS-WITH-NOTES.
- Niezależny rerun produkcyjnego Chromium: `TMPDIR=/workspace/tmp-melee-finalcontrol node gra/tools/battle-manual-melee-browser-test.cjs` — **PASS**. Pełna scena ma 28 jednostek na stronę; fixture używa prawdziwego rekordu „Wojownik”, nie nadpisuje ról. Piechota idzie z dystansu 3 do kontaktu przez dwa pola i atakuje w następnym aktywowaniu. Potwierdzono także strzały łuczników i działania konnicy; błędy przeglądarki: 0.
- `battle-melee-attack-doctrine-test.cjs` — PASS dla parowanego 24v24 Atak/Szturm; po dojściu do kontaktu piechota wykonuje ataki. Kontrola pustego celu pozostaje bez ataku.
- `npm --prefix gra run typecheck` — PASS.
- `git diff --check 7e32176d..1e76791c` — PASS.

## Uwagi

Chromium sprawdza reprezentatywne aktywacje w pełnej scenie 28v28, nie prowadzi całej bitwy przez pełną turę. Jest to Final Control poprawki bezczynnej piechoty, nie zastępstwo dla oddzielnego testu dużych armii i wszystkich wariantów formacji.

Nie znalazłem blokera zakresu. Merge do lokalnego `main`, deploy i push pozostają do integracji z pozostałymi zmianami bitewnymi w `battleScene.ts`.
