STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-UPKEEP-RESOURCES-IMPL-Q1
GOAL: utrzymanie surowcowe budynku proporcjonalne do jego utrzymania w Pieniądzu (dla każdego surowca z koszt_surowce), zamiast stałych 5 szt./typ; gracz i AI ten sam kod; HUD/karta/panel miasta spójne.
BAZA: main 18b609dc3 (FALA 578; zawiera BLDCOST FALA 573).
ZMIANY/COMMIT: SHA commitu w odpowiedzi zwrotnej (gałąź worktree-wf_be2b6f51-758-1). Pliki:
  gra/src/game/economy-upkeep.ts (buildingResourceUpkeep(building, level) = buildingUpkeep(b, level) x współczynnik na każdy surowiec z koszt_surowce; configure/getBuildingResourceUpkeepRatio; levelFor w ForBuiltIds/preview*; usunięta stała BUILDING_RESOURCE_UPKEEP_UNITS_PER_TYPE=5),
  gra/src/game/turn-economy.ts (configureBuildingResourceUpkeepRatio z econ-params w ticku),
  gra/data/econ-params.json (budynki.utrzymanie_surowce_wspolczynnik = 1/1/1),
  gra/src/main.ts (buildingLevelForOwnerBuilding: poziom wg epoki/techu właściciela jak tick; podgląd per miasto, fallback panelu Surowców, HUD brutto/netto),
  gra/src/ui/cityPanel.ts, gra/src/ui/entityCards/buildingAdapter.ts (poziom w karcie/liście/sumie panelu miasta),
  testy: gra/tools/building-upkeep-resources-test.cjs (NOWY, 39), upkeep-test.cjs (89), cities-buildings-production-owner-contract-test.cjs (53), resource-usage-breakdown-test.cjs (przepisane celowo).
DECYZJE/ZAŁOŻENIA (do potwierdzenia przez orkiestratora):
  1. Baza "utrzymania w Pieniądzu" = EFEKTYWNE złoto z buildingUpkeep (utrzymanie + przyrost*(poziom-1), x FALA2 (2), x mnożnik epoki 1/2/4), czyli to, co karta pokazuje i pobiera tick. Konsekwencja: dla pola utrzymanie=2 w epoce 2 złoto = 8, surowce = 8 każdego (nie 2). Jeśli właściciel miał na myśli surowe pole `utrzymanie` (bez FALA2 i mnożnika epoki), trzeba zmienić bazę albo współczynnik (jest globalny, nie per epoka) - ABC do właściciela.
  2. Współczynnik w danych (econ-params), nie w kodzie; moduł ustawiany w ticku (jedno źródło dla tick/podgląd/UI); domyślnie 1.
  3. Zakres: reguła dotyczy WSZYSTKICH budynków z koszt_surowce (Dodatek 2 nadpisuje założenie "tylko budynki ze zmienionym kosztem"). Pałac (brak koszt_surowce) i Stela (utrzymanie 0) bez utrzymania surowcowego.
  4. Deficyt: mechanizm bez zmian - deductBuildingStockCostAcrossCities obcina pulę do 0, missingStockFor + komunikat "Brak surowców na utrzymanie budynków" (gracz); AI odejmuje to samo bez blokady. Brak nowych kar.
  5. AI: ai-resource-needs nie zależy od utrzymania; deficyt nie blokuje budowy (brak zakleszczenia). Symulacja krótkiego przebiegu: NIE_ZMIERZONO. Ryzyko: w epoce 3 (x4) utrzymanie surowcowe rośnie mocno - możliwy dren puli AI; wymaga pomiaru (LONGRUN) przed deployem.
  6. Zapisy: bez migracji (brak nowego pola w save; mapy upkeep czyszczone przy load i liczone z danych).
  7. HUD brutto/netto, karta budynku ("Co turę: N Pieniądza + −N drewna/t · ..."), panel miasta używają tych samych funkcji z poziomem; polskie etykiety (stockResourceLabel), bez surowych id. Format karty pozostał dotychczasowy.
TESTY (cwd gra/, esbuild+typescript doinstalowane --no-save):
  tsc --noEmit: 0 błędów w zmienionych plikach.
  building-upkeep-resources-test 39/0; upkeep-test 89/0; cities-buildings-production-owner-contract-test 53/0; empire-miasta-table-test 96/0; city-orderstate-restore-clear-test 9/0; unit-resource-upkeep-test 7/0; upkeep-difficulty-per-owner-test 19/0; ai-resource-needs-test 6/0; building-cost-resource-availability-test 58/0; owner-economy-test 20/0.
  resource-usage-breakdown-test 98/2: D3, D4 FAIL PRE-EXISTING (string "buildingResourceUpkeepByOwner.set(0, ..." nie istnieje w HEAD main.ts - nie moja zmiana).
  citizen-resource-upkeep-test 107/2: kotwica "const ordPctRaw = evaluateOrderFromBreakdown(" - niezwiązane ze zmianą (nie dotykałem tego kodu); nie sprawdzono na czystym HEAD.
  Weryfikacja w przeglądarce: NIE_ZMIERZONO.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator; ABC właściciela w pkt 1 (baza = efektywne złoto vs surowe pole) i pomiar AI (LONGRUN) przed deployem. LEDGER: dopisać dług REPIN Rust (building upkeep + building_costs.rs) - pliku LEDGER nie ma w tym worktree, wpis robi orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
