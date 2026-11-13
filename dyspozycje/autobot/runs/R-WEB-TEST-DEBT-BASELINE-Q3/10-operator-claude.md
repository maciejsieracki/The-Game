STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: zredukować dług testowy bazy 37bcf8ebb (testy czerwone na bazie) bez zmian kodu gry w gra/src i danych gry; zakres allowlisty gra/tools/*-test.cjs.
BAZA: origin/main 37bcf8ebb (checkout --detach). Dispatch oryginalny nieobecny na origin/main; użyty DODATEK z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0.
RUNDA: 1/5

## Tabela: punkt -> stan na bazie (surowy wynik) -> klasyfikacja -> zmiana -> wynik po

| Test | Stan na bazie 37bcf8ebb (surowy wynik) | Klas. | Zmiana | Wynik po |
|---|---|---|---|---|
| glod-wojska-karencja-test | `40 pass, 0 fail` | - | brak | 40/0 |
| battle-loot-test | `12 pass, 0 fail` | - | brak | 12/0 |
| weterani-test | `WYNIK: 79 PASS, 0 FAIL` | - | brak | 79/0 |
| ai-major-economy-test | `31 passed, 0 failed` | - | brak | 31/0 |
| pr141-f04-yields-activation-test | PASS | - | brak | PASS |
| forced-war-bronze-main-guard-test | `21 PASS, 1 FAIL` (okno regex `{0,3000}` za krótkie wobec ciała finalizePeaceTreatyBetween) | A (okno przestarzałe) | okno 3000 -> 6000; treść asercji bez zmian | 22 PASS, 0 FAIL |
| forced-war-iron-main-guard-test | `34 PASS, 1 FAIL` (okno `{0,2200}` za krótkie) | A | okno 2200 -> 4000 | 35 PASS, 0 FAIL |
| ai-dlug-porzadki-q1-test | ReferenceError: regularWarCapturedByPairKey is not defined (fragment eliminateOwner ewaluowany bez tej zmiennej) | B (harness) | dodano nazwę i atrapę emptyMap() do ctxNames/argumentów | 17 passed, 0 failed |
| hex-tooltip-unlock-label-dedup-test | `27 passed, 1 failed`: asercja "brak odblok." brała cały początek listy (split('Fort')[0]) i łapała wiersz Owiec ("odblok. Owce") | A (zakres asercji za szeroki) | zakres ograniczony do wiersza Kamieniołomu (od nazwy do 'Fort'); treść asercji bez zmian | 28 passed, 0 failed |
| mgla-sciezka-inwariant-test | `41 pass, 1 fail`: nowy zapis `city.q = land[index]...` w main.ts (hak testowy moveFixtureAwayForTest, przestawia MIASTA) niesklasyfikowany | A (KLASYFIKACJA) | dodany wpis NIE-JEDNOSTKA z uzasadnieniem | 42 pass, 0 fail |
| recruit-rally-default-ui-test | build esbuild: 6 błędów (?raw css/svg, brandAssets); po naprawie: import.meta.glob; po shimie: document nieobecny przy ewaluacji bundla | B (harness) | shim ?raw -> text; shim import.meta.glob; globalny JSDOM przed ewaluacją bundla | PASS (exit 0) |
| recruitment-batch-contract-test | ReferenceError: hexHasRoomFor is not defined | B (zależności harnessu) | dodano units, armyStackLimit, hexHasRoomFor (prawdziwa funkcja z src/game/army-stack-limit.ts) | NADAL FAIL: ReferenceError superUnitLimitViolation (kolejna zależność purchaseRecruitmentUnit). NIEDOKONCZONE |
| general-capital-recruitment-order-test | ReferenceError: hexHasRoomFor is not defined (page.evaluate) | B (ta sama przyczyna) | NIE ZMIENIONO | NIEDOKONCZONE |
| okolica-ownership-change-reconcile-test | `12/15 passed, 3 failed`: (a) kapitulacja głodowa, (b) annexCityStateToOwner, (c) applyCityCaptureAfterBattle: brak seedCityOwnerDefaults po zmianie ownerId | C (prawdopodobny prawdziwy błąd gry, do weryfikacji) | NIE ZMIENIONO | NIEDOKONCZONE, sekcja C |
| pre-battle-retreat-exhausted-test | `27 pass, 6 fail`: kotwice tekstowe w main.ts (showPreBattle, retreatExhaustedThisTurn, defenderCanRetreat) | A/C do rozstrzygnięcia | NIE ZMIENIONO | NIEDOKONCZONE |
| unit-replace-full-cost-test | `39 passed, 1 failed`: F0 "Taran okuty ma zamiennik Katapulta w Zelazie u 16/16 nacji" | DECYZJA właściciela (Siege wykluczony z Zastąp) | NIE ZMIENIONO (asercji audytu nie osłabiam bez decyzji) | NIEDOKONCZONE, ABC |
| punkt 6: 3 skrypty measure D-FOG-F | nie wykonano w tej rundzie | - | - | NIEDOKONCZONE |

## Bramki (surowe wyniki, po zmianach)
- tsc --noEmit: exit 0, brak linii wyjścia
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
- combat-test: `All sanity checks passed.`, exit 0
- unit-replace-test: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- unit-replace-full-cost-test: 39 passed, 1 failed (F0, punkt DECYZJA)

## Klasyfikacja C (prawdziwe błędy do osobnych tematów, NIE naprawiane)
- okolica-ownership-change-reconcile-test (a)(b)(c): po kapitulacji, aneksji i zdobyciu miasta nie wywołano seedCityOwnerDefaults po zmianie ownerId. Reprodukcja: `cd gra && node tools/okolica-ownership-change-reconcile-test.cjs`. Wymaga osobnego tematu, bo dotyczy kodu gry.

## Decyzja do właściciela (ABC)
- unit-replace-full-cost F0: czy Taran okuty ma mieć zamiennik Katapulta (Oblężniczy wykluczony z Zastąp w danych). Odpowiedź decyduje, czy zostaje test, czy dane.

## Zmiany (ZMIANY-COMMIT)
Allowlista gra/tools/*-test.cjs:
- gra/tools/ai-dlug-porzadki-q1-test.cjs
- gra/tools/forced-war-bronze-main-guard-test.cjs
- gra/tools/forced-war-iron-main-guard-test.cjs
- gra/tools/hex-tooltip-unlock-label-dedup-test.cjs
- gra/tools/mgla-sciezka-inwariant-test.cjs
- gra/tools/recruit-rally-default-ui-test.cjs
- gra/tools/recruitment-batch-contract-test.cjs (częściowo, nadal FAIL)
Raport: dyspozycje/autobot/runs/R-WEB-TEST-DEBT-BASELINE-Q3/10-operator-claude.md
Kod gry (gra/src, WERSJE.md, gra-robocza): nie zmieniano.

## TESTY
Zielone po zmianie: ai-dlug 17/0, forced-war-bronze 22/0, forced-war-iron 35/0, hex-tooltip 28/0, mgla 42/0, recruit-rally PASS, plus bramki wyżej.
Nadal czerwone: recruitment-batch-contract, general-capital-recruitment-order, okolica-ownership-change-reconcile, pre-battle-retreat-exhausted, unit-replace-full-cost (F0), D-FOG-F (nie ruszane).

## BLOKADY
1. okolica-ownership-change-reconcile: C, prawdziwy błąd gry (osobny temat).
2. recruitment-batch-contract / general-capital-recruitment-order: zależności purchaseRecruitmentUnit rosną (superUnitLimitViolation, reservedUnitTypeNamesForOwner w src/game/production.ts); wymaga pełnej atrapy.
3. pre-battle-retreat-exhausted: asercje tekstowe na main.ts, do przeglądu semantyki.
4. unit-replace-full-cost F0: decyzja właściciela.
5. punkt 6 (D-FOG-F, 3 skrypty measure): nie wykonano.

## RUNDY
1/5.

## ZAŁOŻENIA
- Dispatch oryginalny brakuje na origin/main; zastosowano DODATEK z brancha claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- Punkty już zielone na bazie (glod, battle-loot, weterani, ai-major-economy, pr141-f04-yields) nie były modyfikowane.
- Okna regex w forced-war-* poszerzono; asercji nie usunięto.
- Commit obejmuje zmienione pliki testów (allowlista) oraz ten raport, dodane wyłącznie ścieżkami.

NASTĘPNY KROK: runda 2 Operatora dla recruitment-batch/general-capital (atrapy z production.ts), pre-battle-retreat, D-FOG-F; osobny temat C dla okolica; decyzja ABC dla unit-replace F0. Evaluator po SHA commita.
DEPLOY/PUSH: NIE WYKONANO
