# R-WEB-TEST-GAPS-WALKAMAPY-DIRTY-SCROLL-ASSERT-Q1 — Final Control (runda 1/5)

STATUS: PASS
DOMAIN: GAME (preset testowy + test)
TEMAT: R-WEB-TEST-GAPS-WALKAMAPY-DIRTY-SCROLL-ASSERT-Q1
GOAL: (A) markCityStateDirty() po dołożeniu miast w doStartPlaytestWalkaMapy + test z mutacją; (B) asercja scrollTop w żywym teście odświeżania panelu miasta + mutacja.
ZMIERZONO / NIE ZMIERZONO: patrz niżej.

## ZMIANY-COMMIT
Kandydat: 64362623d98447a9be0b1427871ad55f519b70fc. Baza 13ad6b363 jest jego przodkiem (git merge-base --is-ancestor: tak), jeden commit ponad bazą.
Diff vs baza (git diff --stat): 10-operator-claude.md (+50), gra/src/main.ts (+4: komentarz + jedno `markCityStateDirty();` w doStartPlaytestWalkaMapy, po pętli cities.push), city-panel-refresh-at-turn-start-live-test.cjs (+47/-4), nowy playtest-walkamapy-dirty-forecast-test.cjs (+67). Wszystko w allowliście; logika refreshOpenPanelsAtTurnStart, TREATY-PAY, FPD2 nietknięte.
integration_sha: 64362623d98447a9be0b1427871ad55f519b70fc (ten FC dodaje tylko ten raport, bez kodu).

## TESTY (surowe wyniki, własne uruchomienie)
| Bramka | Wynik |
|---|---|
| tsc --noEmit | exit 0 |
| logic-test | 213/213 |
| tech-tree-test | 20 pass, 0 fail |
| research-test | 33/33 |
| unit-replace-test | 21/21 |
| combat-test | 6/6 |
| playtest-mapa-dirty-forecast-test | 10 pass, 0 fail |
| playtest-walkamapy-dirty-forecast-test (nowy) | 5 pass, 0 fail |
| ...ten sam, mutacja (kopia main.ts bez wywołania) | 2 pass, 3 fail (czerwony) |
| city-panel-refresh-at-turn-start-live (Chromium, build vite poza repo) | PASS, scrollTop 150 -> 150 (overflow 762) |
| ...mutacja (restorePanelScrollPositions zakomentowane, build, źródło przywrócone cmp) | FAIL: "przed 150, po 0" |
| open-panel-refresh-after-tech-live | PASS |

Bramki referencyjne wszystkie zielone na kandydacie, więc porównanie baza vs kandydat dla czerwonych nie było potrzebne.
Uwaga: test walka-mapy jest statyczny (kolejność wywołania w ciele funkcji); prognoza ekonomii w żywej grze dla walka-mapy NIE ZMIERZONO (zgodnie z deklaracją Operatora, wzór jak playtest-mapa-dirty-forecast-test).

## ZARZUTY EVALUATORA
Brak (zarzuty: []). Obrona: brak. Samodzielna weryfikacja nie znalazła nic do NAPRAW.

## BLOKADY
Brak.

## RUNDY
1/5. Werdykt: PASS.

## NASTĘPNY KROK
Integracja orkiestratora commita 64362623d (FF/merge do main), potem rejestr. Zmiana dotyka src/main.ts, więc wymaga wdrożenia na ROBOCZĄ według zasad orkiestratora (osobna autoryzacja).

## UWAGI-DLA-ORKIESTRATORA
- origin/main (a62b09b3c) jest o 11 commitów przed bazą 13ad6b363 (baza jest jego przodkiem; kandydat jeszcze nie w main). Przed integracją: `git merge-base --is-ancestor` i `git diff --stat`; merge ma dotknąć tylko 4 plików z diffu.
- Do sprzątnięcia poza repo: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad (build1, build2, ev, logi) oraz gra/node_modules w worktree.

DEPLOY/PUSH: NIE WYKONANO
