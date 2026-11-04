STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-WATER-ACCESS-PORT-VS-MILL-Q1
GOAL: Port = morze LUB rzeka; Młyn i budynki słodkowodne = tylko rzeka; bez dodawania jezior (decyzja 2026-11-04).

## (1) POMIAR PRZED (baza origin/main 95a4b25ab)

| Budynek / miejsce | Obecna definicja (plik:linia) | Wymagana | Zgodność |
|---|---|---|---|
| Port, Port wielki (budowa) | `WATER_ACCESS_BUILDING_IDS` building-resource-gate.ts:148 -> `production.ts:980` `ctx.cityHasCoastOrRiver` <- main.ts:5353 `isCoastalCity(map,city) \|\| cityHasWaterAccess(city,map)` | morze lub rzeka | ZGODNA |
| Jednostki Naval (produkcja/zakup/AI) | main.ts:4253, 4388, 6800, 6830, 7896, 8956, 16746, 36667, 38036, 39512 — ta sama `cityHasCoastOrRiverAccess` | morze lub rzeka | ZGODNA |
| Chip UI Portu | cityPanel.ts:6950 „Wybrzeże lub rzeka przy mieście” | morze lub rzeka | ZGODNA |
| Młyn | brak bramki wodnej; w `buildings.json` NIE MA definicji budynku `mlyn` (tylko klucze econ `budynek_mlyn_*`, flaga `maMlyn` economy.ts:857) | tylko rzeka | brak bramki (nie ma czego naprawiać; patrz założenie A1) |
| Studnia, Akwedukt | bez bramki wodnej (`wymagania` puste) | — | n/d |
| Zdrowie miasta (brak wody −2) | `cityHasWaterAccess` turn-economy.ts:423 -> `hasFreshwaterAccess` freshwater.ts:143 = rzeka (heks/sąsiad) LUB jezioro topologiczne; morze NIE | rzeka (słodka) | ZGODNA (jezioro z decyzji 2026-11-02 bez zmian; generator nie tworzy jezior, więc dla map generowanych = rzeka-only) |
| Rezerwacja pod żywność (tartak/obóz) | auto-improvements.ts:1299 `isFreshwaterReservedHex` | słodka woda | ZGODNA |

Rozbieżności: ZERO. Port już ma definicję „morze lub rzeka” (isCoastalCity OR rzeka), słodka woda już wyklucza morze.

## (2) NAPRAWA
BRAK ZMIAN W KODZIE GRY (brak rozbieżności; grandfathering nietknięty). Założenia:
- A1: Młyn nie istnieje jako budynek budowalny w danych; nie dodaję bramki „tylko rzeka” bez istniejącego budynku (zmiana zakresu). Gdy młyn zostanie zdefiniowany, ma użyć `cityHasWaterAccess` (rzeka-only) — to wymaga osobnego tematu.
- A2: Jezioro zostaje tak jak jest (11-02); nie dodano żadnego nowego terenu jeziora.
- A3: Port nad jeziorem-morzem zamkniętym w lądzie = wybrzeże (isCoastalCity liczy każdy sąsiedni heks wodny) — bez zmiany.

## (3) TESTY
NOWY: `gra/tools/water-access-port-vs-mill-test.cjs` (14 asercji: Port morze/rzeka/sucho, „tylko rzeka” bez morza, ujście, bramka production.ts, brak bramki mlyn, pin main.ts). GREEN na bazie: ALL PASS.
Mutacje (zrobione in-place, cofnięte `git checkout`): M1 main.ts bez `|| cityHasWaterAccess` -> FAIL pin D; M2 `cityHasWaterAccess` + morze -> FAIL 2 asercje („morze samo NIE…”, „wybrzeże bez rzeki”). Obie złapane.
Regresje (PRZED = PO, bo brak zmian w src):
- freshwater-access-test: 37 PASS / 0 FAIL
- naval-water-access-gate-test: 34 pass / 5 fail (PRE-EXISTING: nieaktualne piny tekstowe main.ts: seaTradeBonusIncomeByCity, replaceAvailabilityCtxEmpireWide, purchaseRecruitmentUnit x2, isProductionAllowed)
- deposit-building-gate-test: 46 pass / 1 fail (PRE-EXISTING: „stolarnia eraBuildingCatalog ready z drewnem”)
- Nazwy `*port*`/`*mlyn*` w gra/tools: brak innych plików.
tsc: NIE_ZMIERZONO (brak zmian w src, tylko nowy .cjs).

## BLOKADY
Brak. Uwaga dla orkiestratora: 6 pre-existing FAIL (powyżej) to osobny dług testowy; REPIN Rust `city_has_water_access` — semantyka bez zmian.

## ZMIANY/COMMIT
Allowlista: nowy gra/tools/water-access-port-vs-mill-test.cjs + ten raport. SHA: patrz `git log` brancha (commit "R-WEB-WATER-ACCESS-PORT-VS-MILL-Q1 operator r1"). node_modules usunięte.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
