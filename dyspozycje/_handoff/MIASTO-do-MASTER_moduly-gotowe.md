# PACZKA: MIASTO -> MASTER : moduly gotowe do wpiecia (Q1 / Q3 / Q4)
Data: 2026-06-24. Addytywne (NIE zmieniaja istniejacych funkcji/zachowania). DoD: `node tools/logic-test.cjs` = 163/163 (zero regresji).
Backup: production.ts.bak-MIASTO, cities.ts.bak-MIASTO. Implementacja przez subagenta Sonnet.

## production.ts -- NOWE eksporty
- `splitPraca(cityPraca, udzialBudynki) -> { doBudynkow, doPuli }` (Q4). W petli tury: udzial = miasto-params `praca_udzial_budynki`
  (domyslnie 0.7); `doBudynkow` -> advanceProduction; `doPuli` -> globalna PULA Pracy w skarbcu (playerState/master).
- `unitCostMode(def) -> 'praca'|'pieniadz'` (Kamien=praca, Braz+=pieniadz); `unitPurchaseCost(def)` (koszt w Pieniadzu).
- `buildableProduction(city,data,techs,ctx?)` = lista do KOLEJKI za Prace (budynki + jednostki Kamienia).
- `purchasableUnits(city,data,techs,ctx?)` = jednostki Braz+ do KUPIENIA za Pieniadz.
  WPIECIE (Q1): kolejka uzywa `buildableProduction`; lista "Kup za Pieniadz" = `purchasableUnits`; zakup natychmiastowy:
  zdejmij `unitPurchaseCost` ze skarbca -> spawn jednostki -> `population -= populationCostOf(item)` (min 1).
  `availableProduction` NIEzmieniony (zachowany dla zgodnosci wstecznej; nowe funkcje go filtruja).

## cities.ts -- gate terytorialny (Q3)
- `canFoundCity(q,r,cities,map, opts?: { withinTerritory?: (q,r)=>boolean })` + `foundCity(..., opts?)`.
  Bez `opts` -> zachowanie BEZ zmian (teren + dystans >=5). Z `opts.withinTerritory` (predykat dostarcza MAPA/silnik)
  -> dodatkowy warunek "w terytorium" (granica/posterunek), inaczej reason 'poza terytorium'.
  (`foundCityAt` bez opts -- uzywa bazowego canFoundCity.)

## Kontekst / powiazane
- Kontrakty MAPA (koszt ulepszen + granice): _handoff/MIASTO-do-MASTER_kontrakt-ulepszenia-granice.md.
- Decyzje Q1-Q4: _handoff/MIASTO-do-MASTER_decyzje-v0.1.md.
- Cross-lane (przez mastera): Q2 utrzymanie compound (EKONOMIA/player-economy); pula Pracy w skarbcu + wydawanie na teren (master/MAPA); zakup jednostek za Pieniadz w petli tury.
DOSTEPNE DLA SEDZIEGO: zmiany addytywne, logic-test 163/163; jesli wysoka stawka -> sedzia wg DoD przed wpieciem (decyzja mastera).
