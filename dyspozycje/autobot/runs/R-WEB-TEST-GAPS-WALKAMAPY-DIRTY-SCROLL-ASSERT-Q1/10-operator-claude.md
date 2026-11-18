# R-WEB-TEST-GAPS-WALKAMAPY-DIRTY-SCROLL-ASSERT-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TEST-GAPS-WALKAMAPY-DIRTY-SCROLL-ASSERT-Q1
GOAL: (A) markCityStateDirty po dołożeniu miast w doStartPlaytestWalkaMapy + test z mutacją; (B) asercja scrollTop w żywym teście odświeżania panelu miasta + mutacja.
BAZA: 13ad6b363c548a659143dddbad65b0217525c98e (origin/main)
ZMIANY-COMMIT: allowlista: gra/src/main.ts (+4 linie: jedno wywołanie i komentarz, tylko doStartPlaytestWalkaMapy); gra/tools/city-panel-refresh-at-turn-start-live-test.cjs (asercja scrollTop); nowy gra/tools/playtest-walkamapy-dirty-forecast-test.cjs; ten raport. Nietknięte: refreshOpenPanelsAtTurnStart, inne presety, TREATY-PAY, FPD2.

## (A) walka-mapy
- `markCityStateDirty()` po pętli cities.push (main.ts ok. l.49373).
- Nowy test statyczny: 5 pass / 0 fail na źródle; mutacja (wywołanie usunięte w kopii): 2 pass / 3 fail (ZMIERZONO).
- Prognoza ekonomii w grze NIE ZMIERZONO; test sprawdza obecność i kolejność wywołania.

## (B) scrollTop w żywym teście
- Przed EOT scrollTop przewijanego elementu panelu miasta = 150; po EOT oczekiwane 150 (±1 px).
- Viewport testu zmniejszony do 1600×520: przy 1000 px panel nie przewijał się (BLOCKED).
- Realny Chromium, build poza repo, bundle z poprawką A.
- Po zmianie: PASS, scrollTop 150 → 150 (ZMIERZONO).
- Mutacja w kopii źródła (restorePanelScrollPositions usunięte, źródło przywrócone, cmp identyczny): FAIL, scrollTop 150 → 0 (ZMIERZONO).
- Przed zmianą test nie miał asercji scroll, więc taka mutacja przechodziła niezauważona.
- Jeden przebieg Chromium padł (Target page closed); powtórka bez zmian kodu przeszła. Przyczyna NIE ZMIERZONO.

## Bramki (surowe wyniki)
| Bramka | Wynik |
|---|---|
| tsc --noEmit | exit 0, brak błędów |
| logic-test | 213/213 |
| tech-tree-test | 20 pass, 0 fail |
| research-test | 33/33 |
| unit-replace-test | 21/21 |
| combat-test | 6/6 |
| playtest-mapa-dirty-forecast-test | 10 pass, 0 fail (bez regresji) |
| open-panel-refresh-after-tech-live | PASS |
| city-panel-refresh-at-turn-start-live | PASS (z asercją scroll) |

## BLOKADY
Brak. NIE ZMIERZONO: przyczyna flaky crashu Chromium; prognoza w grze dla walka-mapy.

## RUNDY
1/5. Werdykt: PASS-WITH-NOTES. Decyzja właściciela: brak.

## NASTĘPNY KROK
Final Control: przegląd commita i allowlisty.

## UWAGI-DLA-ORKIESTRATORA
- Do sprzątania poza repo: /tmp/claude-0/wf-d866-build (dwa buildy ~200 MB, kopie HTML, logi, diag.cjs).
- gra/node_modules zainstalowany w worktree (npm ci --ignore-scripts).

DEPLOY/PUSH: NIE WYKONANO
