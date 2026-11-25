STATUS: PASS
DOMAIN: GAME (testy)
TEMAT: R-WEB-TEST-DEBT-OLD-728-746-Q1
GOAL: zmierzyć dziś stan każdej pozycji długu testowego FAL 728–746, sklasyfikować z dowodem, naprawić stare piny tylko jeśli są czerwone (bez osłabiania asercji), opisać kandydatów błędów gry bez zmian w gra/src i gra/data.
BAZA: origin/main 29f7ba81a8e9caf8c584ad578dfdead6fa7cfc04 (detached HEAD w worktree). Środowisko: gra/node_modules przez `npm ci --ignore-scripts` (bez build/dev).

ZMIANY/COMMIT: brak zmian w gra/tools (żaden test nie był czerwony, więc nie było pinów do naprawy; brak mutacji do wykonania). Jedyny commitowany plik: dyspozycje/autobot/runs/R-WEB-TEST-DEBT-OLD-728-746-Q1/10-operator-claude.md. Zero zmian w gra/src, gra/data, gra-robocza, gra-kanon, WERSJE.md, manifest, rust-port.

## Tabela pozycji (stan dziś, solo, exit = kod wyjścia)

| FAL | Pozycja | Stan dziś (dowód) | Klasyfikacja |
|---|---|---|---|
| 728 | recruitment-panel-compact-row-test (było 7 FAIL) | `node tools/recruitment-panel-compact-row-test.cjs --no-shots`, Chromium live, exit 0, 7 s, SUMMARY: 39 pass, 0 fail; K1 wysokość wiersza 34,3 px <= 36, brak poziomego przewijania przy 280 px | JUŻ ZIELONE |
| 729 | resource-usage-breakdown-test | exit 0, 100 passed, 0 failed | JUŻ ZIELONE |
| 729 | ui-language-count-renderer-test | exit 0, Wynik: 39 PASS / 0 FAIL | JUŻ ZIELONE |
| 729 | citizen-resource-upkeep-test (było 2 FAIL) | exit 0, 124 passed, 0 failed | JUŻ ZIELONE |
| 729 | empire-armia-produkcja-test | exit 0, 51 passed, 0 failed | JUŻ ZIELONE |
| 740 | martwa sonda ledgerAuditE3c* w main.ts | Obecna w gra/src/main.ts: deklaracje `ledgerAuditE3cLast` (l. 10502) i `ledgerAuditE3cFires` (l. 10503); NIGDY nie przypisywane ani nie inkrementowane (grep: brak przypisania, `++`, `push`); jedyny odczyt to zwrot probe w l. 33176 (`e3cLast`, `e3cFires`). Konsument: tools/resource-ledger-live-measure.cjs:175 dostaje zawsze fires=0, last=[]. Koszt: 2 zmienne + 2 pola zwrotu, zero wpływu na grę. Kodu NIE usunięto. | MARTWA SONDA (kandydat do decyzji właściciela: usunąć albo zostawić) |
| 740 | „dziennik AI nie przeżywa zapisu” | Zapis dziennika zasobów filtruje właścicieli: main.ts:42174 `resourceLedgerHistory: ledgerHistoryToSave(ownerId => isHuman(ownerId))`. Zgodnie z rejestrem FAL 746 dziennik zapisuje się tylko dla właścicieli-ludzi. Testy: resource-ledger-save-history-test 15 passed/0 failed (exit 0); save-load-ledger-history-test 4 PASS/0 FAIL (exit 0). | ZGODNE Z PROJEKTEM (nie błąd testu); czy AI ma mieć dziennik w zapisie = pytanie ABC, NIE ZMIERZONO |
| 744 | defense-breakdown-test (TypeError grecy.bonusy) | exit 0, 49 pass, 0 fail; TypeError nie odtworzony | JUŻ ZIELONE |
| 744 | pr141 (grupa testów) | Wszystkie pr141-*-test.cjs bez przeglądarki: exit 0 (m.in. ai-production 23/0, ai-strategy 19/0, combat-defense-behavior PASS 59, combat-offense 75/0, f04-cost-activation-defense 64/0, f04-society-remaining 192/0, matrix-only-ai 40/0, matrix-only-economy 92/0, matrix-only-production 96/0, population-behavior 24/0, semantic-consumer 52/0, dip-activation PASS). Przeglądarkowe/zależne: pr141-hotseat-diplomacy-owner 10/10, pr141-matrix-only-owner-ui PASS, pr141-saveload-mp-f05-g11 PASS (BOUNDED, nie dowodzi pełnego zapisu). | JUŻ ZIELONE |
| 744 | budynek-civ-bonus-u17-test | exit 0, 7 passed, 0 failed | JUŻ ZIELONE |
| 744 | pr141-runtime-ordinary-flow-harness, pr141-runtime-save-load-harness | exit 2: „BLOCKED: no browser/server/runtime module was loaded” / „BLOCKED: explicit runtime opt-in is required”. Harnessy są z założenia nieaktywne bez autoryzacji właściciela (komentarz w pliku). | HARNESS (blokada celowa, nie czerwony test) |
| 744 | pr141-runtime-ordinary-scope-test, pr141-evidence-ledger-behavior-test, pr141-current-evidence-ledger-v4-test | exit 0, komunikat „WYCOFANY: dowód historyczny” | WYCOFANE (historyczne, poza zakresem) |
| 745 | doctrine-live r3 (battle-doctrine-live-r3-test) | exit 0, 309 s (limit 10 min), 6 × [PASS], 0 × [FAIL], bez błędów strony/konsoli | JUŻ ZIELONE |
| 745 | line-advance-browser (battle-line-advance-uniform-browser-test) | exit 0, 165 s. Skrypt to pomiar bez asercji PASS/FAIL. Scena „after” (Las, seed 1): errors [], rozrzut frontu w kolejnych rundach 0–3+. Scena „before”: NIE ZMIERZONO, powód z wyjścia: brak src/battle/battleScene.orig-before.ts (plik celowo niecommitowany). Objaw „sidecary zwracają HTML” w tym przebiegu NIE odtworzony. | NIE-ZMIERZONO (baza „before”); bieg poprawny |
| 746 | t57 endTurn (endturn-t57-repro.cjs, seed 4242, 56 tur) | (a) konfiguracja domyślna `--bypass 0`: exit 0, 89 s, zatrzymanie `gate-blocked` w turze 1 (bramka „Zakończ turę”/NNS blokuje endTurn przy domyślnych podatkach, nie zawieszenie). (b) `--bypass 1` (dodatnie dosypki z haka): exit 0, 250 s, tury 1→56 ukończone, stuckQueueHeals 0, battlesAuto 0. Pierwotna przyczyna timeoutu (zawieszenie) NIE odtworzona w (b); w konfiguracji domyślnej czas do tury 56 NIE ZMIERZONY (zatrzymanie w turze 1). | HARNESS / NIE-ZMIERZONO (przebieg domyślny poza turą 1). Bramka NNS jest regułą gry, nie błędem testu; decyzja, czy bramka ma blokować turę 1, należy do właściciela |

## Bramki (surowe wyjścia)
- tsc --noEmit: exit 0
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
- unit-replace: unit-replace-test 21/21; unit-replace-archer-slinger 51 OK/0 FAIL; unit-replace-army-multi-select 36/36; unit-replace-full-cost 40/0; unit-replace-multitype-walk 25 OK/0 FAIL; unit-replace-promotion-table PASS (32 wpisów, 63 krawędzi, brak cykli); ai-unit-replace-same-rules 45/0. Wszystkie exit 0.
- combat-test: exit 0, „All sanity checks passed.” (8 linii OK/PASS w surowym wyjściu; dispatch podawał 6, liczba z dispatchu NIE ZWERYFIKOWANA)
- ai-test: `ai-test: 297 passed, 0 failed`, exit 0 (rejestr TESTDEBTQ13 podawał 292/5; stan dziś 297/0)

## Mutacje
Nie wykonano: żaden test nie został zmieniony, więc nie było pinu do naprawy wymagającego mutacji czerwonej.

## BLOKADY
- Brak blokad technicznych dla pozycji z listy poza opisanymi wyżej (line-advance „before”: brak niecommitowanego pliku baseline; t57 w konfiguracji domyślnej: zatrzymanie w turze 1 przez bramkę gry).
- Procesy Chromium: próba sprzątnięcia własnych procesów testowych (`pkill -f cbf4a126`) została odrzucona przez klasyfikator uprawnień. Na liście pozostały procesy chrome z user-data-dir pod scratchpadem tej sesji. Wymaga ręcznego sprzątnięcia przez orkiestratora albo decyzji właściciela.

## UWAGI-DLA-ORKIESTRATORA (poza zakresem, bez działań)
1. Martwa sonda ledgerAuditE3c* (main.ts:10502–10503, 33176) — kandydat do osobnego tematu sprzątania, z decyzją właściciela; konsument tools/resource-ledger-live-measure.cjs:175 wymaga równoczesnej zmiany, jeśli sonda zostanie usunięta.
2. Pytanie ABC (kandydat): czy bramka NNS „Zakończ turę” ma blokować turę 1 przy domyślnych podatkach 30/60/10 (przebieg t57 default: gate-blocked, tura 1, seed 4242).
3. Pytanie ABC (kandydat): czy dziennik zasobów AI ma trafiać do zapisu (obecnie tylko właściciele-ludzie, main.ts:42174).
4. Harnessy pr141-runtime-ordinary-flow / save-load są celowo nieaktywne; uruchomienie wymaga autoryzacji właściciela.

## RUNDY
1/5

## NASTĘPNY KROK
Orkiestrator: decyzja o martwej sondzie i pytaniach ABC z UWAG; ewentualnie osobny temat na sprzątanie sondy (poza tym tematem).

DEPLOY/PUSH: NIE WYKONANO
