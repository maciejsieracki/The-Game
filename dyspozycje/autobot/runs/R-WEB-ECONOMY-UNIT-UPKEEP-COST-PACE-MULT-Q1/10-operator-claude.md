STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-UNIT-UPKEEP-COST-PACE-MULT-Q1
GOAL: „Koszty jednostek" (Niski ×1 / Normalny ×2 / Wysoki ×4) mnoży utrzymanie jednostek: Pieniądz, surowce i żywność (także poza terytorium i w obozie), spójnie w silniku, kartach i AI. Baza: 48b94c5ca.
ZMIANY-COMMIT: patrz SHA w polu sha. Pliki: gra/src/game/unit-cost-tempo.ts (mnoznikUtrzymaniaJednostek, setKosztJednostekPaceResolver, biezacyKosztJednostekPace), economy-upkeep.ts (pace na unitUpkeep, totalUnitUpkeep, upkeepBalance, unitResourceUpkeep, totalUnitResourceUpkeep, previewOwnerTotalResourceUpkeep, unitFoodPerTurn, militaryFoodConsumption, unitFoodCardValue, unitRecruitUpkeepReserve), turn-economy.ts (options.kosztJednostekPace, previewOwnerUpkeep), main.ts (boot: resolver, przekazanie tempa do wszystkich miejsc liczenia), karty (unitInfoCard, unitAdapter, cityPanel), ai.ts (rezerwa), nowy gra/tools/unit-upkeep-cost-pace-test.cjs.
TESTY: tsc --noEmit: 0 błędów. unit-upkeep-cost-pace-test: 61 ok / 0 FAIL; mutacja (normalny x2 -> x1): 39 ok / 22 FAIL (czerwone). Zielone (rc=0): logic-test (bez liczby w wyniku), combat-test, research 33/0, ekonomia-5x-inwariant 280/0, ai-unit-replace-same-rules 45/0, glod-wojska-karencja 40/0, econ-era-rebalance 38/0, upkeep 91/0, unit-upkeep-era-scale 24/0, citizen-resource-upkeep 124/0 i kilkanaście innych (unit-replace, food, ai-upkeep, recruitment). Bramki tech-tree i unit-replace-test nie podały liczby w wyniku.
Czerwone, NIE zweryfikowane na bazie (prawdopodobnie istniejący dług TEST-DEBT-Q12): building-upkeep-resources-test (D10 etykiety karty budynku, 1 FAIL); empire-food-b5-test (2 FAIL: racja mieszkańców, bez związku z utrzymaniem jednostek; autoBalanceRationsToSolvency nie wywołuje ścieżek zmienionych).
BLOKADY: (a) POMIAR smoke AI 90 tur (PRZED/PO, seed 4242) NIE ZMIERZONO; tools/ai-economy-measure-upkeep-onoff.cjs przekroczył 200 s, brak bundle i przejścia przeglądarki. (b) Istniejące piny testów zostały bez zmian: wołają bez parametru = Niski, więc są zielone jako piny Niskiego (dispatch prosił o aktualizację do Normalnego; decyzja do FC).
RUNDY: 1/5
NASTĘPNY KROK: FC; pomiar live (VERIFY-LIVE) w Chromium; decyzja o włączeniu zmian w allowliście.
UWAGI-DLA-ORKIESTRATORA:
- POZA ALLOWLISTĄ (wymaga akceptacji FC): gra/src/game/empire-food.ts (advanceEmpireFood przyjmuje tempo, bo tam liczy się żywność armii), gra/src/game/no-negative-stocks.ts (projekcja żywności), gra/src/ui/cityPanel.ts (karty chipów surowców jednostek), gra/src/game/unit-cost-tempo.ts jest na allowliście.
- Obliczenia analityczne (NIE pomiar): Falanga Normalny Pieniądz 32 -> 64/turę; żywność 64 -> 128 (własne terytorium); poza terytorium 128 -> 256.
- Stare zapisy: pole kosztJednostekPace bez wartości = Niski (main.ts, ustawienie 'niski' jak dotąd).
- Nie wykonano: deploy, push, integracja (zgodnie z dispatchem).
DEPLOY/PUSH: NIE WYKONANO
