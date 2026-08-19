# R-WZROST-SZCZESCIE-DUBEL-WEALTH-I-CERAMIKA-Q1 — runda 2

## Werdykt

Oba `szczescieNetto: 0` w `gra/src/game/turn-economy.ts` (preview około linii 1936 i 2536) są celowe. Nie zmieniono kodu.

## Dowód ścieżki

- `previewCityEconomy()` jest używane przez trzy projekcje HUD/żywienia (`gra/src/main.ts` około 15073, 15271 i 15432), a nie do zastosowania wzrostu populacji.
- Komentarz kontraktu `CityEconomyTick.wzrostProcent` mówi wprost, że jest to „szacunek bez Szczęścia jeśli brak”. Preview nie ma wejścia z pełnym pipeline’em Order/Szczęście, więc `wt.zadowolenie` nie jest równoważne `szczescieNetto`.
- Właściwa ścieżka wzrostu jest w `applyPostCentralPopulationGrowth()` (`gra/src/game/population-growth-v85.ts`). Odczytuje `happinessByCityId`, czyli `cityOrderState.szczescie`.
- `cityOrderState.szczescie` powstaje w `main.ts` przez `evaluateOrderFromBreakdown(...)`; do tego wywołania przekazywane jest `haWealth = econTick.wealthZadowolenie`. Wealth jest więc uwzględniany dokładnie raz w realnym wzroście.
- Po poprawce `ce2d2768` `computeGrowthPercentV85()` nie dodaje już osobno `wealthPoziom`; pole pozostało wyłącznie dla kompatybilności API/save. Podstawienie `wt.zadowolenie` do preview odtworzyłoby tylko jeden składnik, pomijając pozostałe źródła Szczęścia i mogłoby sugerować fałszywy parytet.

## Regresja

Istniejący test `gra/tools/r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs` zabezpiecza właściwy kontrakt: przy stałym `szczescieNetto` zmiana `wealthPoziom` nie zmienia wzrostu, a Wealth/Ceramika/Spichlerz są osobnymi, jawnymi kanałami. W tej rundzie nie dodano testu wymuszającego Wealth w preview, bo byłby sprzeczny z jego kontraktem.
