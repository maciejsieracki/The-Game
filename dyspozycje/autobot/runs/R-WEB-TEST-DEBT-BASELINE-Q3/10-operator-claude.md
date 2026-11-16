STATUS: PASS-WITH-NOTES
DOMAIN: GAME (tylko testy; gra/src, gra/data, WERSJE.md, manifest nietkniete)
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: triage czerwonych testow bazowych (runda 3/5). Pomiar na bazie 25aac7b93, klasyfikacja A/B/C, poprawka klasy A (okolica-load-reconcile), tabela przed/po, lista kandydatow B.
ZMIANY-COMMIT: gra/tools/okolica-load-reconcile-test.cjs (klasa A: kotwice tekstowe wskazywaly linie `playerEverOwnedCity = cities.some(...)` usunieta przez FALE/#433; zastapione przez `playerEverOwnedCityByOwner.clear()`, mutacja 2.4 przepisana na aktualne wywolanie `reconcileAllWorkedTiles` po `healInconsistentUnits('wczytanie zapisu', ...)`). Dowod mutacji: wbudowana asercja 2.4 (usuniecie call site przestaje dopasowywac wzorzec) przechodzi. Reszta bez zmian.
BAZA: 25aac7b932a746be75ed5876a98eea8742c9b3e9 (= refs/keep/R-WEB-TESTDEBT-Q3-r2-op). Ancestry: `git merge-base --is-ancestor 25aac7b93 origin/main` -> NIE (origin/main = ef6e8ea1e, FALA 767). Dispatch nazywa baze „origin/main”; zastosowano SHA z dispatchu i DODATKU 2. npm ci w gra/ wykonany (71 pakietow).

TESTY (ZMIERZONO, surowe wyjscie, baza 25aac7b93, poza wpisem „PO” ponizej):

## 1. pr141-* (17 testow z tabeli r2)
| test | przed: exit / wynik | klasa / przyczyna (cytat) |
|---|---|---|
| pr141-ai-production-behavior | 0 / 23 pass | zielony |
| pr141-ai-strategy-behavior | 1 / 17 pass, 2 FAIL | "high conquest profile declares war in same relation; got []"; "risk 8 crosses war threshold at unchanged relation; got []". NIE ROZSTRZYGNIETE (A lub B: prog wojny AI) |
| pr141-combat-defense-behavior | 0 | zielony |
| pr141-combat-defense-owner-route | 1 | "walka_obrona_morska: real owner-id battle setup yields defender HP 80 vs foreign 80". NIE ROZSTRZYGNIETE; hipoteza B (morska obrona nie wplywa na HP obroncy przy counterTyp Naval, civ-bonuses.ts:241) NIEPOTWIERDZONA w kodzie |
| pr141-combat-offense-behavior | 0 / 75 pass | zielony |
| pr141-dip-activation | 1 | AssertionError "missing/non-major row preserves caller fallback". NIE ZMIERZONO (brak analizy) |
| pr141-hotseat-diplomacy-owner | 1 / TOTAL 5/10 | "diploBrakeBonusFlags is not defined" (harness, zagniezdzona funkcja main.ts nieobecna w vm). Klasa C/harness, NIE NAPRAWIONE |
| pr141-hotseat-production-owner-routing | 1 | "ReferenceError: units is not defined" (harness; r2 zapisal „hexHasRoomFor” – inny blad na tej bazie). Harness, NIE NAPRAWIONE |
| pr141-matrix-only-ai | 1 / 38 pass, 2 FAIL | "recognized Greek matrix row remains active when explicitly supplied"; "recognized Roman partner remains available when explicitly supplied". NIE ROZSTRZYGNIETE |
| pr141-matrix-only-combat | 0 / 36 pass | zielony |
| pr141-matrix-only-data-wiki | 0 / 15 civ rows, 9 CivPedia | zielony |
| pr141-matrix-only-economy | 1 | "grecy: gross trade uses only matrix, not poison civ multiplier" (diff 'simple'). NIE ROZSTRZYGNIETE |
| pr141-matrix-only-owner-ui | 1 | "expected owner civKey in availability contexts, found 4". NIE ROZSTRZYGNIETE |
| pr141-matrix-only-production | 0 / 96 pass | zielony |
| pr141-population-behavior | 0 / 24 pass | zielony |
| pr141-population-main-happiness-hookup | 0 / 7 pass | zielony |
| pr141-runtime-ordinary-scope | 1 / FAIL 8/19 | ENOENT lstat `dyspozycje/autobot/runs/R-PR141-CODEX-RUNTIME-ORDINARY-PREP-20261019` (katalog runu nieobecny w worktree). Klasa C (srodowisko) |
Podsumowanie pr141: 8 zielonych, 9 czerwonych (przed) -> 9 czerwonych (po; bez zmian w pr141). Pozycje z zaleznosciami spoza dispatchu (f04-*, ledgery v1/v3/v4, evidence-ledger-behavior) — NIE ZMIERZONO.

## 2. okolica-load-reconcile-test
- przed: 21/23, FAIL P-MILET-ATENY-OKOLICA-RECZNE-PRZY-PRZEJECIU-LOAD (kotwica `playerEverOwnedCity = cities.some`) i "punkt mutacji zlokalizowany dokladnie".
- klasa A (test przestarzaly wzgledem R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY (#433)). Zachowanie zachowane: reconcileAllWorkedTiles w restoreGameFromSave (main.ts:49239) przed przeliczeniem playerEverOwnedCityByOwner (main.ts:49243).
- PO: 23/23 OK (ZMIERZONO, exit 0).

## 3. defense-breakdown-test
- przed = PO: 23 pass / 10 FAIL (ZMIERZONO, exit 1). Brak TypeError (usuniety w r1).
- Dane z wlasnego debugowania (kopia testu usunieta po pomiarze): roster sama kawaleria/rydwany zwraca 1 linie "Walka · punkty zdrowia · rydwanów — 1 z 2 jednostek" (test oczekuje 0); roster mieszany zwraca 3 linie (Falanga obrona 2/4, Falanga punkty zdrowia 2/4, rydwany HP 1/4), test oczekuje 1; roster cala piechota: 2 linie po 4/4 (test oczekuje 1). cityDefenseBreakdownLines: 5 linii zamiast 4.
- Klasyfikacja: NIE ROZSTRZYGNIETE (A: test oczekuje modelu sprzed rozdzielenia linii obrony/HP i bez linii rydwanow; B: civ-matrix celowo emituje linie HP i rydwanow, co wymaga decyzji). NIE ZMIENIANO asercji (wymaga decyzji owner/Evaluator).

## 4. Pozostale pozycje dispatchu (ZMIERZONO)
| test | wynik | klasa |
|---|---|---|
| budynek-civ-bonus-u17-test | exit 0, 6 pass / 0 fail | zielony (r1 naprawa trzyma) |
| diplo-peace-weaker-seeks-city-only-test | exit 0, 35 / 0 | zielony na bazie (h2/h4/h5 nie czerwone) |
| diplo-war-peace-main-guard-test | exit 0, 35 / 0 | zielony |
| war-rules-multiwar-main-guard-test | exit 0, 21 / 0 | zielony |
| war-epoch-player-first-main-guard-test | exit 1, 33 pass / 2 FAIL | "[baza]: main.ts: bramka R1/R2 po stronie AI dla pary gracza (targetIsPlayer: true)"; "bypass R3 usunięty (brak waveActorBypassR3) + licznik per cywilizacja". NIE ROZSTRZYGNIETE (kandydat B lub A), NIE ZMIENIANO |
| diplo-war-peace-gate-test | exit 0, 24 / 0 | zielony (pozycja „gate G” z dispatchu nie zidentyfikowana jednoznacznie – przyjeto ten plik) |
| diplo-truce-r1-test | exit 0, 31 / 0 | zielony |
| diplo-truce-r4-ai-test | exit 0, 24 / 0 | zielony |
| diplomacy-sensible-deals-main-guard-test | exit 0, 22 / 0 | zielony |
| map-snapshot-load-test | exit 0, 169 s, 58 pass / 0 fail / 1 KNOWN-FAIL (poza exit code) | znany otwarty bloker: budzet agregatowy rotacji autozapisu 14,364 MB UTF-16 > ~5 MB origin (decyzja ABC wlasciciela, nie test) |

## 5. Bramki (ZMIERZONO)
- tsc --noEmit: exit 0.
- logic-test: exit 0, LOGIC OK (213/213).
- tech-tree-test: exit 0, 20 pass / 0 fail.
- research-test: exit 0, PASSED 33 / FAILED 0.
- unit-replace-test: exit 0 (koncowy wynik: wszystkie [OK]; nie liczono sumy).
- combat-test: exit 0, "All sanity checks passed."
- git diff --check: OK.

## 6. Tabela przed/po (czerwone -> czerwone)
| zakres | przed (25aac7b93) | po (ta runda) |
|---|---|---|
| okolica-load-reconcile-test | 21/23 (2 FAIL) | 23/23 (0 FAIL) |
| defense-breakdown-test | 23/10 | 23/10 (bez zmian, NIE ROZSTRZYGNIETE) |
| pr141-* (17) | 9 czerwonych | 9 czerwonych (klasyfikacja ponizej, bez poprawek asercji) |
| war-epoch-player-first-main-guard | 2 FAIL | 2 FAIL (bez zmian) |
| budynek-civ-bonus-u17, weaker-seeks, main-guard (diplo/war), truce-r1/r4 | zielone | zielone |
| map-snapshot-load-test | exit 0 (1 known-fail) | exit 0 (bez zmian) |

## 7. Kandydaci B (NIE naprawiono; do ABC/Evaluator)
- B1: morska obrona nie wplywa na HP obroncy (pr141-combat-defense-owner-route; HP 80 = 80). Hipoteza, nie potwierdzona w kodzie.
- B2: linie HP i rydwanow w defenderCivBonusBreakdown (defense-breakdown, 10 FAIL) – czy zamierzone (wtedy test = A).
- B3: prog wojny AI (pr141-ai-strategy-behavior, "got []") – czy prog zmieniony decyzja.
- B4: war-epoch-player-first-main-guard: bramka R1/R2 po stronie AI dla pary gracza; brak waveActorBypassR3.
- Plonu kamienia 50 vs 55 i linii 0% z r1 — bez potwierdzenia (NIE ZMIERZONO w tej rundzie).

## 8. NIE ZMIERZONO / jawnie
- pr141: dip-activation, matrix-only-ai/economy/owner-ui, ai-strategy – tylko wyjscie pierwszej asercji, bez analizy zrodla (klasyfikacja nierozstrzygnieta).
- hotseat-diplomacy-owner i hotseat-production-owner-routing: harness nieprzerobiony (ReferenceError), bez pomiaru po ewentualnej naprawie.
- pr141-f04-*, ledgery v1/v3/v4, evidence-ledger-behavior: NIE ZMIERZONO.
- Brak mutacji klasy A poza okolica (mutacja wbudowana w test 2.4).

RUNDY: 3/5 (Operator HAIKU; r1 FC FAIL, r2 INFRA/BLOCK bez commita; r3 = ta runda; Sonnet nieuzasadniony – brak drugiej nieudanej rundy merytorycznej).
NASTEPNY KROK: (1) Evaluator sprawdza okolica-load-reconcile (23/23, mutacja 2.4) i diff jednego pliku; (2) ABC wlasciciela: defense-breakdown (A vs B: linie HP/rydwanow); prog wojny AI (pr141-ai-strategy); bramka R1/R2 (war-epoch); morska obrona (pr141-combat-defense-owner-route); (3) osobny temat harnessu dla pr141 hotseat-* i runtime-ordinary-scope (brak katalogu runu).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: dispatch nazywa baze „origin/main”, ale 25aac7b93 nie jest przodkiem origin/main (ef6e8ea1e). Uzyto SHA 25aac7b93 zgodnie z dispatchem i DODATKIEM 2. Nie utworzono zadnych sesji, zadan ani harmonogramow. Tymczasowa kopia defense-breakdown do debugu usunieta przed commitem.
