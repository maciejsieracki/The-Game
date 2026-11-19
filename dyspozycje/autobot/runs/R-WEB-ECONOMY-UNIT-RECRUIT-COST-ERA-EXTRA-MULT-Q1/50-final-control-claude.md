# R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1 — Final Control

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-RECRUIT-COST-ERA-EXTRA-MULT-Q1 (+ DODATEK 1: trudnosc bez wplywu na koszt/utrzymanie jednostek)
GOAL: rekrutacja w Pieniadzu x2 (Braz) / x4 (Zelazo) dodatkowo; trudnosc nie mnozy kosztu jednostek; audyt kosztow wojska.
ZMIANY/COMMIT: kandydat a89f4a22a7e46b3f683cf5763d867a65cbcc0d31, baza 031b42d7 jest przodkiem (merge-base --is-ancestor OK). Diff: 18 plikow, +747/-43. Kod: production.ts (jedna funkcja unitRecruitBaseMoneyCost, uzywana przez unitProductionItem, availableProduction, availableReplacementsFor, unitPurchaseCost; unitMoneyCost bez trudnosci), unit-recruit-cost-era-params.json (nowy), econ-params.json (hard/easy utrzymania jednostek = normal). itemCost('jednostka') bez zmian (jedyny pozostaly wolajacy: battle-loot.ts:63). Zero zmian w gra-robocza/, gra-kanon/, WERSJE.md, rust-port/.

## Ocena zarzutow (bez etykiet rol)
1. Brak pomiaru AI t30/t60 seed 4242 — ODDAL (uwaga), NIE blokuje kodu. Harness zablokowany panelem decyzji gracza w t1; kod nie zawiera sciezki zmieniajacej decyzje AI poza cena. Ryzyko "Zelazo x16 hamuje rekrutacje AI" NIE ZMIERZONE; przekazac do R-WEB-VERIFY-LIVE (bieg dymny po kosztach jednostek).
2. Audyt bez skryptu — NAPRAWIONE (audit-real-costs.cjs + PRZED/PO w commicie). Utrzymanie bez zmian potwierdza unit-upkeep-era-scale 16/0. Konnica 48/tura = 3 x4 (epoka) x4 (R_STAWKI), liczone raz — decyzja o zamierzeniu u wlasciciela.
3. Testy spoza allowlisty (pr141-f04-cost-activation, citystate-army-food-difficulty, upkeep-difficulty-per-owner) — ODDAL (uwaga formalna): sa pinami wartosci zmienionych wprost przez DODATEK 1; zmiany ograniczone do pinow. Ratyfikacja allowlisty po stronie orkiestratora.
4. Duplikat wzoru kosztu — NAPRAWIONE (jedna funkcja, sprawdzone diffem).

## TESTY (wlasny przebieg FC, surowe wyniki)
tsc --noEmit exit 0; logic 213/213; tech-tree 20 pass 0 fail; research 33/0; unit-replace 21/21; combat 6/6; ai-unit-replace-same-rules 45/0; unit-upkeep-era-scale 16 ok 0 FAIL; ekonomia-5x 280/0; unit-recruit-cost-era-extra 9 ok 0 FAIL (mutanty wykryte); unit-cost-difficulty-removed 9 ok 0 FAIL; unit-epoch-cost 57/0; impi 705/0; recruitment-cost-50-wood 190/0; upkeep-difficulty-per-owner 19/0; citystate-army-food-difficulty 29/0; pr141-f04-cost-activation 20/0; difficulty-cost 22/0. Wszystkie exit 0. Bieg dymny AI: NIE ZMIERZONO.

BLOKADY: brak blokad technicznych. Do decyzji/obserwacji: (a) pomiar AI t30/t60 -> VERIFY-LIVE; (b) Konnica 48/tura (x16 bazy) zamierzone?; (c) loot bojowy nadal na dawnym itemCost (battle-loot.ts:63) — spojne z dispatchem, do potwierdzenia; (d) zmiana trudnosci: Latwa AI nie placi x2, Trudna gracz nie placi x2 za rekrutacje; Trudna nie ma x2 zywnosci/utrzymania jednostek, Latwa oboz 0.38->0.5.
UWAGI-DLA-ORKIESTRATORA: UPKEEPPACE (#50) mnozy utrzymanie dodatkowo — zderzy sie z audytem Konnicy; rozwazyc po decyzji (b).
RUNDY: FC po rundzie 2/5.
NASTEPNY KROK: integracja orkiestratora (sprawdzic merge-base i diff --stat), deploy tylko na ROBOCZA.
DEPLOY/PUSH: NIE WYKONANO
