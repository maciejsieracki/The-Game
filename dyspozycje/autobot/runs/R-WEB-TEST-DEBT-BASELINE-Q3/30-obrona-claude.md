STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy i narzędzia w gra/tools; kod gry nietknięty; gra/src i gra/data bez zmian)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: odpowiedź Obrony na zarzuty Evaluatora (runda 3, kandydat e05af8eaf) — PRZYJMUJĘ/ODRZUCAM z dowodem; poprawka klasy A tam, gdzie jest uzasadniona decyzją i zmierzona; reszta jawnie NIE ROZSTRZYGNIĘTA.
BAZA: e05af8eaf61c4d00f973eb3ff43f03b49acc4971 (kandydat r3, detach). `git merge-base --is-ancestor e05af8eaf origin/main` = NIE (merge-base 459354a12). `git merge-base --is-ancestor 25aac7b93 origin/main` = NIE. Kandydat wymaga przeniesienia na main przed integracją (decyzja orkiestratora). npm ci w gra/ wykonany w tej rundzie (71 pakietów, `added 71 packages in 3s`).
ZMIANY-COMMIT: gra/tools/defense-breakdown-test.cjs (fixture bonusu lesnego przepięta na realny wpis matrix; asercja `noterr` zgodna z komentarzem i gatingiem). Raport: ten plik. SHA końcowy: zwracany w polu sha wywołania (commit raportu po commicie testu).

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (zakres częściowy; czerwone bez rozstrzygnięcia) — PRZYJMUJĘ, częściowo naprawione
- defense-breakdown-test: 10 FAIL -> 7 FAIL (poprawka A, patrz tabela i sekcja „Poprawka A” niżej). Pozostałe 7: klasa B (6 pozycji, patrz zarzut 5) i A-kandydat (1 pozycja: bonusChipTexts oczekuje 1 chipa, a dane Greków dają więcej wpisów matrix; NIE ROZSTRZYGNIĘTE).
- war-epoch-player-first-main-guard-test: exit 1 (2 FAIL) — NIE ZMIERZONO w tej rundzie poza kodem wyjścia; bez triage.
- pr141-ai-strategy-behavior-test: exit 1, pierwsza asercja `high conquest profile declares war in same relation; got []` — pierwsza linia zmierzona, bez triage A/B/C.
- pr141-matrix-only-ai-test: exit 1 (38 passed, 2 failed), pierwsza: `recognized Greek matrix row remains active when explicitly supplied` — bez triage.
- pr141-matrix-only-economy-test: exit 1, `grecy: gross trade uses only matrix, not poison civ multiplier` — bez triage.
- pr141-matrix-only-owner-ui-test: exit 1, `expected owner civKey in availability contexts, found 4` — bez triage.
- pr141-dip-activation-test: exit 1 (AssertionError po 8 s) — bez triage.
- Stan: NIE ROZSTRZYGNIĘTE: war-epoch (2), ai-strategy (2), matrix-only-ai (2), matrix-only-economy, matrix-only-owner-ui, dip-activation. Nie zmieniałem tych testów.

### Zarzut 2 (tabela pr141 niepełna) — PRZYJMUJĘ (pomiar)
Pętla po WSZYSTKICH `gra/tools/pr141-*-test.cjs` (33 pliki, kod wyjścia z `$?`, uruchomienie na kandydacie e05af8eaf):
- ZIELONE (rc=0, 16): ai-production-behavior (23/0), combat-defense-behavior (59 asercji), combat-offense-behavior (75/0), f04-cost-activation-defense (64/0), f04-cost-activation (20/0), f04-rush-activation (72/0), f04-society-activation (34/0), f04-society-remaining-activation (192/0), f04-work-activation, f04-yields-activation, g1-combat-activation, matrix-only-combat (36/0), matrix-only-data-wiki (15 civ, 9 stron), matrix-only-production (96/0), population-behavior (24/0), population-main-happiness-hookup (7/0).
- CZERWONE (rc=1, 17): ai-strategy-behavior (17/2), combat-defense-owner-route, current-evidence-ledger-test, current-evidence-ledger-v3-test, current-evidence-ledger-v4-test, dip-activation, evidence-ledger-behavior, f04-building-speed-activation (`ReferenceError: prod is not defined`), f04-unit-speed-activation (`ReferenceError: recStackFree is not defined`), hotseat-diplomacy-owner (5/10, `diploBrakeBonusFlags is not defined`), hotseat-production-owner-routing (`ReferenceError: units is not defined`), matrix-only-ai (38/2), matrix-only-economy, matrix-only-owner-ui, runtime-ordinary-scope (FAIL 8/19), saveload-mp-f05-g11-behavior (`ReferenceError: showHintMessage is not defined`), semantic-consumer-consistency (`ReferenceError: battleUnitCivBonusy is not defined`).
- Klasyfikacja wstępna (bez pełnego triage): v4 — ENOENT do `dyspozycje/autobot/runs/R-PR141-CODEX-F04-PRODUCTION-DEC...` (brak pliku w repo) = C (środowisko/artefakt); evidence-ledger-behavior — ENOENT `/workspace/pr141-review/current-consumers.json` = C (brak zewnętrznego wejścia). Pozostałe 15: NIE ROZSTRZYGNIĘTE.
- Tabela przed/po dla pr141: przed = 17 czerwonych, po = 17 czerwonych (ta runda nie zmieniła żadnego pr141; patrz zarzut 3).

### Zarzut 3 (wspólna przyczyna ReferenceError w harnessie nie usunięta) — PRZYJMUJĘ (nie naprawiono); ODRZUCAM przesłankę „jedna wspólna przyczyna”
Eksperyment (cofnięty, plik przywrócony z kopii, `git status` czysty dla hotseat) na `pr141-hotseat-production-owner-routing-test.cjs`: harness wykonuje deklaracje z `main.ts` i `src/game/*.ts` przez `executeDeclaration` i wstrzykuje kontekst ręcznie. Każde dodanie deklaracji odsłania kolejną zależność modułową:
1. `units` (użyte w `purchaseRecruitmentUnit`, main.ts:4750) — dodane `units: []`;
2. `armyStackLimit` (main.ts:4486) — dodana deklaracja z main.ts;
3. `BATTLE_MAX_PER_SIDE` (battleScene.ts:732, `const MAX_PER_SIDE = 500`) — dodane jako stała 500;
4. `ownUnitCountAt` (army-stack-limit.ts:22) i `stackFreeSlots` (army-stack-limit.ts:40) — dodane z pliku;
5. `superUnitLimitViolation` — ReferenceError, łańcuch NIE domknięty (zatrzymane na 5. kroku).
Wniosek: nie ma jednego identyfikatora do dodania; to łańcuch zależności ok. 5+ kroków. Poprawka wymaga przebudowy harnessu (załadowanie domknięcia zależności lub import modułu), a nie „jednej minimalnej poprawki”. Zmiany wycofane; hotseat-production pozostaje czerwony (NIE ROZSTRZYGNIĘTE).

### Zarzut 4 (niespójność dokumentacyjna r2 vs commit 25aac7b93) — PRZYJMUJĘ
Ten raport zastępuje wcześniejsze opisy harnessów pr141-hotseat (r2 twierdził „nienaprawione”, a commit 25aac7b93 zmienia `combat-defense-owner-route` (+5) i `hotseat-production-owner-routing` (+8)). Pomiar na kandydacie: `combat-defense-owner-route` nadal rc=1 (`walka_obrona_morska: real owner-id battle setup yields defender HP 80 vs foreign 80`), `hotseat-production-owner-routing` nadal rc=1 (`units is not defined`). Commit 25aac7b93 NIE daje zielonego wyniku; nie ma do niego odrębnego pomiaru po zmianie. Opis w tym raporcie jest pomiarem z tej rundy.

### Zarzut 5 (defense-breakdown: syntetyczne wpisy, brak mutacji u17/defense-breakdown; 10 FAIL bez klasyfikacji) — PRZYJMUJĘ częściowo, z pomiarem
Klasyfikacja 10 pierwotnych FAIL (przed poprawką, `node gra/tools/defense-breakdown-test.cjs`, exit 1, 23 OK / 10 FAIL):
| # | Asercja (skrót) | Wynik przed | Po poprawce A | Klasa |
|---|---|---|---|---|
| 1 | Roster samej kawalerii/rydwanów: `lines.length === 0` | FAIL (zwraca linię `Walka · punkty zdrowia · rydwanów — 1 z 2`) | FAIL | B (zob. niżej) |
| 2 | Roster mieszany: `lines.length === 1` | FAIL (2 linie: obrona + HP) | FAIL | B |
| 3 | Roster cała piechota: 1 linia, 4 z 4 | FAIL | FAIL | B |
| 4 | cityDefenseBreakdownLines: `=== 4` | FAIL (dostaje 5) | FAIL | B |
| 5 | cityDefenseBreakdownLines bez trudności: `=== 3` | FAIL | FAIL | B |
| 6 | bonusChipTexts(Grecy): 1 chip | FAIL (2 chipy) | FAIL | A-kandydat / B (zob. niżej) |
| 7 | Las: `defenderCivBonusBreakdown` zwraca DOKŁADNIE 1 linię | FAIL (0 linii — fikcyjny bonus bez `matrixParamId`) | OK | A — POPRAWIONE |
| 8 | Bonus lesny BEZ terrain: `=== 1` | FAIL (0) | OK (zmieniona na `=== 0`, zgodnie z komentarzem) | A — POPRAWIONE |
| 9 | REGRESJA Falanga na Równinie: 1 linia, 3 z 3 | FAIL (2 linie) | FAIL | B |
| 10 | cityDefenseBreakdownLines(terrain=Las): 2 z 2 | FAIL (`undefined` — brak linii lesnej) | OK | A — POPRAWIONE |
Wynik po poprawce A: 7 FAIL (17,18,19,31,32,40,46 w numeracji logu), 29 OK.

Dane diagnostyczne (pomiar, nie wnioskowanie):
- `defenderCivBonusBreakdown([Konnica, Rydwan mykeński], grecyBonusy)` = `[{"text":"Walka · punkty zdrowia · rydwanów — 1 z 2 jednostek","affectedCount":1,"totalCount":2}]` (probe na kopii testu).
- `defenderCivBonusBreakdown(3×Wojownik, grecyBonusy, 'Rownina')` = 2 linie: `Walka · obrona · piechoty — 3 z 3` oraz `Walka · punkty zdrowia · piechoty — 3 z 3`.
- Źródło: `data/civ-matrix.json` blok Grecy (typCywilizacji `grecy`) ma `walka_hp_piechota: 0` (linia ok. 697) i `walka_hp_rydwany: 0`; `civ-bonuses.ts:262-263` wpisuje je przez `MATRIX_ZERO_MARKER_IDS`; `civMatrixBonusyForCivKey` dołącza wpis z `wartosc: 0`; `defenseBreakdown.ts` (defenderCivBonusBreakdown, linie 228-250) nie odfiltrowuje wartości 0 i tekst (`civBonusOpisPl`) nie zawiera wartości liczbowej.
- Probe z filtrem `grecyBonusy = civMatrixBonusyForCivKey('grecy').filter(b => b.wartosc !== 0)` (kopia testu, usunięta): 41 OK / 2 FAIL; pozostałe FAIL to pozycje 6 i „tekst zaczyna się od oryginalnego opisu z civs.json” (oczekiwanie starego źródła civs.json; po przejściu na matrix-only tekst pochodzi z `civBonusOpisPl`).
Klasyfikacja:
- B-KANDYDAT (do ABC właściciela, NIE naprawiam): panel „Rozbicie obrony” pokazuje linie dla wpisów matrix o wartości 0 (`walka_hp_piechota`, `walka_hp_rydwany` dla Greków). Repro: powyższe wywołanie `defenderCivBonusBreakdown`. Wpływ: gracz widzi „punkty zdrowia — N z M” bez efektu; to sprzeczne z zasadą z e875b6d42 („panel nie kłamie”). Pytanie ABC: ukryć wpisy wartości 0 w defenderCivBonusBreakdown (kod) czy zostawić zero-markery (dane). Pozycje 1,2,3,4,5,9 zależą od tej decyzji.
- A-KANDYDAT (pozycja 6 i tekst „oryginalnego opisu z civs.json”): test oczekuje starego źródła (civs.json) i liczby chipów, a dane matrix-only dają więcej wpisów Greków. NIE rozstrzygam bez decyzji, czy chip ma liczyć wszystkie wpisy walki czy tylko obronę piechoty.

### Poprawka A (zrobiona, z mutacją i dowodem)
- Przyczyna: `bonusApplies()` (civ-bonuses.ts:140-163) przyjmuje wpis tylko, gdy `isKnownMatrixCombatEntry` (civ-bonuses.ts:278-283) — czyli `matrixParamId` z `MATRIX_COMBAT_ENTRY_SPECS`. Fikcyjny wpis testu (bez `matrixParamId`) nigdy nie pasował: 0 linii w każdym terenie. Test był przestarzały względem matrix-only (zmiana po pr141/F-serii), nie względem reguł gry.
- Zmiana: `fikcyjnyBonusLesny` dostaje `matrixParamId: 'walka_obrona_piechota_teren_las'` (istniejący wpis w `data/civ-matrix.json:199`, typ bonus_obrona, cel piechota, gating `_teren_las`) z komentarzem; asercja „bez terenu” zmieniona z `=== 1` na `=== 0` (komentarz w tym samym bloku już mówił „konserwatywnie NIE dopasowany”, a gating `terrainIsForestOrJungle('')` daje false).
- Mutacja (odwracalna, w worktree, przywrócona i zweryfikowana `cmp`): w `civ-bonuses.ts` `terrainIsForestOrJungle` zastąpiona przez `return true;`. Wynik: FAIL na „Bonus lesny na terenie Rownina”, „Bonus lesny BEZ terrain”, „REGRESJA Falanga na Równinie” (tu nie wina lesnego, ale test wykrywa), „cityDefenseBreakdownLines(terrain=Równina): bonus lesny pominięty”. Test wykrywa regresję gatingu lesnego.

### Zarzut 6 (pozycje zielone na kandydacie; base nie zmierzony; gate G) — PRZYJMUJĘ (brak pomiaru bazy)
- NIE ZMIERZONO w tej rundzie: stan na origin/main (ef6e8ea1e lub 459354a12). Nie zbudowałem drugiego worktree; pomiar bazy nie wykonany.
- Pozycje (`diplo-peace-weaker-seeks-city-only`, `diplo-war-peace-main-guard`, `war-rules-multiwar-main-guard`, `diplo-war-peace-gate`, `diplo-truce-r1`, `diplo-truce-r4-ai`) — zielone wg pomiaru Evaluatora na kandydacie; nie powtarzałem (poza zakresem zmiany). Gate G przyjęty jako `diplo-war-peace-gate-test`, nieweryfikowane.
- map-snapshot-load-test (169 s) — NIE ZMIERZONO w tej rundzie.

## Bramki (ta runda, surowe wyniki)
- `npx tsc --noEmit -p tsconfig.json` (gra/): exit 0.
- logic-test: `LOGIC OK (213/213)`, rc=0.
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, rc=0.
- research-test: `ALL GREEN`, rc=0.
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, rc=0.
- combat-test: `All sanity checks passed.`, rc=0.
- `git diff --check`: czysto.
- Allowlista: tylko `gra/tools/defense-breakdown-test.cjs` + ten raport. Brak zmian w gra/src, gra/data, WERSJE.md, manifestach. Tymczasowe pliki `tools/zz-probe*.cjs` usunięte.

## Tabela przed/po (ta runda)
| Pozycja | Przed (e05af8eaf) | Po (ta runda) |
|---|---|---|
| defense-breakdown-test | 23 OK / 10 FAIL (exit 1) | 29 OK / 7 FAIL (exit 1) |
| pr141-* (33 pliki) | 16 zielonych / 17 czerwonych | bez zmian: 16 / 17 |
| pozostałe z zarzutu 1 (war-epoch, ai-strategy, matrix-only-ai, matrix-only-economy, matrix-only-owner-ui, dip-activation) | czerwone | czerwone (NIE ROZSTRZYGNIĘTE) |

## Lista kandydatów B (do ABC właściciela; NIE naprawiane)
1. Panel „Rozbicie obrony” pokazuje wpisy matrix wartości 0 (`walka_hp_piechota`, `walka_hp_rydwany`, Grecy) jako linie „punkty zdrowia — N z M” bez efektu. Pliki: `src/game/defenseBreakdown.ts` (defenderCivBonusBreakdown, ok. linii 228-250), `src/game/civ-bonuses.ts` (MATRIX_ZERO_MARKER_IDS, ok. 262-263), `data/civ-matrix.json` (blok Grecy). Repro: sekcja „Dane diagnostyczne”.
2. Harness pr141-hotseat-production: łańcuch brakujących zależności (units → armyStackLimit → BATTLE_MAX_PER_SIDE → ownUnitCountAt → superUnitLimitViolation …) — to dług harnessu testowego, nie defekt gry; kandydat na przebudowę harnessu (nie na zmianę gry).

## Kandydaci A do decyzji (nie zmieniam bez zgody)
- bonusChipTexts(Grecy): liczba chipów (obrona piechoty vs wszystkie wpisy walki).
- defense-breakdown „tekst zaczyna się od oryginalnego opisu z civs.json”: źródło opisu po przejściu na matrix-only.

## Uwagi dla orkiestratora
- Kandydat e05af8eaf nie jest potomkiem origin/main (merge-base 459354a12, origin/main = ef6e8ea1e). Integracja wymaga przeniesienia na main przez orkiestratora.
- 25aac7b93 (r2 WIP) nie jest potomkiem origin/main; jego zmiany w harnessach pr141 nie dają zielonego wyniku.
- Zarzut 5 (mutacja u17 i defense-breakdown syntetyczne wpisy jednostka_specjalna/bonus_zloto): NIE ZMIERZONO w tej rundzie (mutacji u17 nie powtarzałem).

## NASTĘPNY KROK
Orkiestrator: (a) ABC do właściciela — pozycja B-1 (ukrywanie zero-markerów w „Rozbiciu obrony”); (b) decyzja o przebudowie harnessu pr141-hotseat (B-2); (c) kolejna runda Operatora: war-epoch, pr141-ai-strategy, pr141-matrix-only-ai/economy/owner-ui, pr141-dip-activation — triage A/B/C z pomiarem, oraz pomiar bazy na origin/main dla pozycji zarzutu 6.

RUNDY: 3/5 (runda operatora po INFRA r2 i FC FAIL r1; ta runda odpowiada na 6 zarzutów Evaluatora z f2023edb).
DEPLOY/PUSH: NIE WYKONANO
