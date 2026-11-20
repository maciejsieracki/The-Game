# R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1 — obrona Operatora (runda 2/5)

STATUS: PASS-WITH-NOTES (kod i testy domknięte; pomiar pkt 5 dispatchu NIE ZMIERZONO — patrz Z1)
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1 (+ DODATEK 1: trudność bez wpływu na koszt jednostek)
GOAL: rekrutacja w Pieniądzu x2 (Brąz) / x4 (Żelazo) dodatkowo do skali epoki; trudność nie mnoży kosztu ani utrzymania jednostek; audyt kosztów wojska; pomiar dymny AI.
KANDYDAT: 4dd82ca7ce76844b499dcdbbf99c2a4a55076720 (checkout detach). Poprawka obrony: czubek = SHA z sekcji ZMIANY-COMMIT.

## Odpowiedzi na zarzuty Evaluatora

**Z1 (brak pomiaru AI t30/t60, seed 4242) — PRZYJMUJĘ, NIE ZAMKNIĘTE.**
- Chromium działa: `/usr/bin/google-chrome` startuje headless z `--no-sandbox` (poprzedni „wiszący” start nie występuje w tej sesji).
- Nowy harness: `measure-ai-recruit.cjs` (w tym katalogu): realny bundle z kopii poza repo (`prepare` z `tools/ai-city-count-sim.cjs` + hak `units` w dumpie), seed 4242, mapa Maly, 60 tur, zlicza jednostki wg właściciela w t1/t30/t60, liczy NaN w dumpie i błędy strony.
- Wynik: t1 = 33 jednostek AI, 0 NaN, ale tura 1 nie przechodzi. Blokada: panel „WYMAGA DECYZJI — Produkcja: Rzym, Kolejka pusta — wybierz budynek (OTWÓRZ → WYKONAJ 1)”. Próby kliknięcia OK/Zamknij/Zamknij wszystkie informacyjne/WYKONAJ/OTWÓRZ nie odblokowały końca tury. Dowód: `measure-ai-recruit-BLOCKED-run.json`.
- Brak liczby t30/t60 PRZED/PO. Ryzyko „Żelazo ×16 hamuje rekrutację AI” NIE ZWERYFIKOWANE. Do zrobienia w kolejnej rundzie: ustawić produkcję miasta gracza w harnessie (np. przez debug hook) albo wykonać ruch gracza przed „Zakończ turę”.

**Z2 (tabela audytu bez skryptu w commicie) — PRZYJMUJĘ, NAPRAWIONE.**
- Skrypt audytu dołączony: `audit-real-costs.cjs` (wywołuje realne funkcje przez esbuild; argument = katalog `gra`).
- Wyjścia z prawdziwych funkcji: `audit-real-costs-PRZED.txt` (baza 031b42d7) i `audit-real-costs-PO.txt` (kandydat). Tabela z dispatchu zgadza się: rekrutacja Włócznik 16→32, Procarz 8→16, Rydwan konny 28→56, Falanga/Hastati 36→144, Konnica 44→176 (niski pace); utrzymanie Pieniądz/tura i żywność/tura bez zmian we wszystkich 10 jednostkach.
- Konnica utrzymanie 48/tura = baza 3 × epoka Żelazo ×4 (`economy-upkeep.ts:1122`, `unitUpkeepScaleByEpoch`) × `R_STAWKI_FALA1_FALA2_MULT` ×4 (`economy-upkeep.ts:1078`). Każdy mnożnik liczony raz; pace nie wchodzi w utrzymanie. Łącznie 16× bazy JSON. Czy to zamierzone — DECYZJA WŁAŚCICIELA, bez zmiany w kodzie.

**Z3 (testy spoza allowlisty) — PRZYJMUJĘ FORMALNIE.**
- Poza dispatchem zmienione są: `gra/tools/pr141-f04-cost-activation-test.cjs` (jedna asercja 52→26: trudność hard nie mnoży już kosztu jednostki) oraz `gra/tools/citystate-army-food-difficulty-test.cjs` (A2, B1, C1–C2, D2, G3, G4: hard = normal dla żywności/utrzymania jednostek). Oba to piny wartości zmienionych bezpośrednio przez DODATEK 1; nie da się ich zachować bez cofnięcia decyzji.
- Prośba do orkiestratora: ratyfikacja allowlisty o te dwa pliki (`upkeep-difficulty-per-owner` mieści się w „citystate-*upkeep*/*upkeep*” z DODATKU 1).

**Z4 (zduplikowany wzór kosztu) — PRZYJMUJĘ, NAPRAWIONE.**
- Był: `unitPurchaseCost` liczył `applyUnitRecruitEraExtra(scaleCostByEpoch(unitCostFromDef(def), def.Epoka), ...)` osobno od `unitRecruitBaseMoneyCost` (które używało `itemCost`).
- Jest: jedna funkcja `unitRecruitBaseMoneyCost(u: UnitDef)` = `applyUnitRecruitEraExtra(scaleCostByEpoch(unitCostFromDef(u), u.Epoka), u.Epoka)`. Używają jej: `unitProductionItem`, `availableProduction`, `availableReplacementsFor`, `unitPurchaseCost`. `itemCost('jednostka')` pozostaje bez zmian (loot bojowy). Sygnatura bez parametru `data` (nieużywany).

## ZMIANY-COMMIT
- `gra/src/game/production.ts` — dedupe jednego wzoru kosztu rekrutacji (Z4). Pozostałe zmiany kodu z rundy 1 (era-extra, usunięcie `applyDifficultyCostMultiplier` z `unitMoneyCost`, `gra/data/unit-recruit-cost-era-params.json`, `gra/data/econ-params.json`) — bez zmian.
- `dyspozycje/autobot/runs/R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1/30-obrona-claude.md` (ten raport)
- `.../audit-real-costs.cjs`, `.../audit-real-costs-PRZED.txt`, `.../audit-real-costs-PO.txt`
- `.../measure-ai-recruit.cjs`, `.../measure-ai-recruit-BLOCKED-run.json`
- SHA: patrz wynik `git rev-parse HEAD` po commicie (sekcja w odpowiedzi orkiestratorowi).

## TESTY (surowe wyjście/exit code, ta runda)
- `npx tsc --noEmit`: exit 0
- logic: LOGIC OK (213/213); tech-tree: 20 pass, 0 fail; research: 33/0; unit-replace: 21 [OK], 0 FAIL; combat: exit 0 („All sanity checks passed”); ai-unit-replace-same-rules: 45 passed, 0 failed; unit-upkeep-era-scale: 16 ok, 0 FAIL; ekonomia-5x-inwariant: 280 passed, 0 failed
- pinowane/nowe: unit-recruit-cost-era-extra 9 ok/0; unit-cost-difficulty-removed 9 ok/0; unit-epoch-cost 57 passed/0; impi-recruitment-discount 705/0; recruitment-cost-50-wood 190/0; upkeep-difficulty-per-owner 19/0; citystate-army-food-difficulty 29 PASS/0; pr141-f04-cost-activation 20 passed/0; difficulty-cost-test exit 0
- POMIAR AI 60 tur: NIE ZMIERZONO (Z1)

## BLOKADY
1. Pomiar pkt 5 (liczba jednostek AI t30/t60, brak NaN w rozgrywce) — NIE ZMIERZONO; harness zablokowany decyzją gracza w t1. Nie integrować bez pomiaru albo świadomej decyzji właściciela o ryzyku Żelaza ×16.
2. Allowlista: dwa pliki testów spoza dispatchu (Z3) — wymaga ratyfikacji orkiestratora.
3. Decyzja właściciela: utrzymanie Konnicy 48/tura (×16 bazy JSON) — zamierzone czy nie.
4. Loot bojowy (`battle-loot.ts`) nadal na dawnym `itemCost` — potwierdzić.
5. Niezaliczone do commita: `gra/node_modules` (zainstalowany `npm ci --ignore-scripts`, ignorowany przez git), kopie robocze w scratchpadzie poza repo.

## RUNDY
2/5 (obrona po FAIL/uwagach Evaluatora, ten sam temat).

## NASTĘPNY KROK
Ponowna ocena Evaluatora: Z2, Z4 zamknięte dowodem; Z3 do ratyfikacji; Z1 wymaga kolejnej rundy (odblokowanie tury w harnessie i pomiar 60 tur seed 4242 PRZED/PO). Dalej Final Control dopiero po pomiarze albo wyraźnej decyzji właściciela.

## DEPLOY/PUSH: NIE WYKONANO
