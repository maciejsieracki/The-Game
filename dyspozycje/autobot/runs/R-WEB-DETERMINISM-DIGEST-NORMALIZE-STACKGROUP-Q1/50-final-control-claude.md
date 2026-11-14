STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DETERMINISM-DIGEST-NORMALIZE-STACKGROUP-Q1
GOAL: digest testowy __detHarness.digest normalizowany wzgledem stackGroupId (Date.now); bez zmian logiki gry.
ZMIANY/COMMIT: kandydat 0dafacd81 (potomek bazy 0ff8dfd41: merge-base --is-ancestor = tak). Diff vs baza: det-digest-normalize.ts (nowy), main.ts (import + blok digest, +5/-2), tools/determinism-digest-stackgroup-test.cjs (nowy), raporty runs/**. Zgodne z allowlista; armyMerge.ts, format zapisu, data, WERSJE.md nietkniete.
TESTY (surowe wyjscie):
- determinism-digest-stackgroup-test.cjs: ZIELONY (5/5), exit 0.
- Mutant A (numeracja w kolejnosci tablicy): FAIL (e), CZERWONY (1 FAIL), exit 1.
- Mutant B (wyjscie = kopie wejscia, bez normalizacji): CZERWONY (3 FAIL).
- tsc --noEmit: 179 bledow na kandydacie i 179 na bazie (srodowisko bez gra/node_modules: brak typow three/vite); zero bledow w det-digest-normalize.ts i w zmienionych liniach main.ts; modul samodzielnie --strict: exit 0.
- git diff --check 0ff8dfd41..0dafacd81: czysty.
- 5 bramek referencyjnych, przebieg live Chromium 2x22 tury seed 271828: NIE_ZMIERZONO (brak node_modules/Chromium w tym worktree; zmiana dotyka wylacznie haka digestu pod ?civTest=1, logika gry nietknieta). Do weryfikacji w integracji.
ZARZUTY: 1 (pokrycie sortowania) - ODDAL/naprawione testem (e), mutant czerwony. 2 (siegeArmyGroupId) - ODDAL: uzasadnione (to samo zrodlo Date.now), pokryte testem (c); akceptacja zakresu = orkiestrator.
BLOKADY: brak.
RUNDY: FC runda 1/5 (Operator/Evaluator/Obrona: 2/5).
UWAGI-DLA-ORKIESTRATORA: przy integracji uruchomic 5 bramek referencyjnych i przebieg live 2x22 (NIE_ZMIERZONO tutaj). Integrowac 0dafacd81 (lub commit raportu na nim).
NASTEPNY KROK: integracja orkiestratora, bramki.
DEPLOY/PUSH: NIE WYKONANO
