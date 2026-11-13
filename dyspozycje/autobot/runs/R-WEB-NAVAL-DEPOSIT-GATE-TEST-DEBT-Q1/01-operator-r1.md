STATUS: PASS
DOMAIN: GAME (WEB) — dług testowy: bramki budowy portów i złóż
TEMAT: R-WEB-NAVAL-DEPOSIT-GATE-TEST-DEBT-Q1
GOAL: Zielone `naval-water-access-gate-test.cjs` (było 34 OK / 5 FAIL) i `deposit-building-gate-test.cjs` (było 46 OK / 1 FAIL) przez klasyfikację każdego FAIL i aktualizację przestarzałych pinów bez osłabiania.
BAZA: origin/main 8c0fb5766

## Klasyfikacja FAIL (wszystkie 6 = (A) przestarzały pin; zero (B), zero (C))

Naval (plik `gra/tools/naval-water-access-gate-test.cjs`, kod `gra/src/main.ts`):
1. Pin 1 (wpięcie bonusu morskiego, test ~l.317 / main.ts:35353): pętla ma teraz w ciele drugi wpis `maritimeTradeIncomeByCity.set(...)` (rozbicie dochodu na kanał morski). Regex dopuszcza go opcjonalnie, nadal WYMAGA `tradeIncomeByCity.set(... + bonusSea)`. Kod poprawny (bonus wpięty).
2. Pin 4 (`replaceAvailabilityCtxEmpireWide`, main.ts:6830): funkcja jest parametryczna (`ownerId = 0`), kod porównuje `c.ownerId === ownerId`; test miał literał `=== 0`. Regex zmieniony na `ownerId`.
3-4. `purchaseRecruitmentUnit` (main.ts:4253): bramka Naval i `return false;` leżą ~2460/~2770 zn. od kotwicy (blok walidacji generałów dodany przed nią), okno testu 1600 zn. Okno 1600 -> 3400 (nadal w obrębie tej funkcji). Bramka w kodzie obecna.
5. `isProductionAllowed` (main.ts:38055): pole ~3750 zn. od kotwicy (memoizacja R-WEB-TURN-SLOWDOWN-Q2 dodana wcześniej). Zamiast stałego okna: okno kończy się na `const ids = new Set<string>();` (koniec wywołania availableProduction w tym closure; nie wchodzi w sąsiednie) + dodana asercja, że koniec okna znaleziono.

Deposit (`gra/tools/deposit-building-gate-test.cjs`, kod `gra/src/game/production.ts` eraBuildingCatalog ~l.2403-2420):
6. Stolarnia `ready` z `drewno: 10`: `eraBuildingCatalog` liczy status z `canAffordBuildingStock`; `koszt_surowce.drewno = 25` w buildings.json, efektywny koszt `buildingStockCost` = 50 (FALA2 x2 + mnożnik ery). 10 < 50 => `locked` — zgodnie z projektem (kod: bramka kosztu magazynowego w katalogu). Test używa realnego kosztu z kodu (export `buildingStockCost` w bundlu testu); dodano asercję negatywną `koszt-1 => locked` oraz sanity. Nie jest to błąd bramki: `buildableProduction` celowo nie sprawdza zasobów (osobna bramka kosztu w main.ts).

Decyzje respektowane: Port = morze LUB rzeka (bez zmian w asercjach wody), słodka woda nietknięta, brak jezior/tartaku awaryjnego.

## ZMIANY/COMMIT
- gra/tools/naval-water-access-gate-test.cjs
- gra/tools/deposit-building-gate-test.cjs
- dyspozycje/autobot/runs/R-WEB-NAVAL-DEPOSIT-GATE-TEST-DEBT-Q1/{01-operator-r1.md, gate-naval.txt, gate-deposit.txt}
Kod gry (`main.ts`, `production.ts`) NIE zmieniony; `gra-robocza/**`, `WERSJE.md`, `rust-port/**`, `src-tauri/**` nietknięte. SHA: patrz niżej (uzupełnione po commicie w odpowiedzi orkiestratora).

## TESTY
- Naval: PRZED 34 OK / 5 FAIL (EXIT=1); PO 40 pass / 0 fail (EXIT=0). Log: gate-naval.txt.
- Deposit: PRZED 46 OK / 1 FAIL; PO 49 pass / 0 fail (EXIT=0). Log: gate-deposit.txt.
- Mutacje zmienionych pinów w main.ts (tymczasowo, przywrócone; `git status` czysty dla main.ts): M1 usunięcie `tradeIncomeByCity.set` w pętli morskiej => FAIL pin 1; M2 EmpireWide `cityHasCoastOrRiver: true` => FAIL pin 4; M3 `if (false)` zamiast bramki Naval w zakupie => 2x FAIL (bramka + return false); M4 `isProductionAllowed` `cityHasCoastOrRiver: true` => FAIL pin. Deposit: stolarnia sprawdzana dwustronnie (koszt-1 locked / koszt ready).
- Regresje PRZED vs PO (EXIT): building-gate-audit 0/0; deposit-coast 124/124 (timeout 100-120 s, ten sam wynik przed i po, NIE zmierzono wyniku merytorycznego — niezwiązane ze zmianą); diplomacy-deposit-trade 0/0; freshwater-access 0/0; map-deposits-era 0/0; water-access-port-vs-mill 0/0. Brak regresji. Pominięte (diag/measure/UI, nie bramki): freshwater-lake-measure, inland-water-diag, live-verify-*, unit-info-card-viewport-*, wzorce `*port*` trafiające w report/teleport.
- tsc: NIE_ZMIERZONO (zmiany wyłącznie w plikach `.cjs`, zero zmian `.ts`).

## BLOKADY
Brak. Uwaga: dwa testy opierają się na pinach tekstowych main.ts i będą się dalej starzeć przy zmianach main.ts przez inne tematy (okna znakowe); okno `isProductionAllowed` jest już ograniczone kotwicą końca, pozostałe okna stałe.

## RUNDY
1/5

## NASTĘPNY KROK
Evaluator R1 (weryfikacja klasyfikacji (A), mutacji i braku osłabienia).

DEPLOY/PUSH: NIE WYKONANO
