STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-UPKEEP-CERAMICS-IMPL-Q1
GOAL: Runda 2 — odpowiedź na zarzuty Evaluatora r1: dowód braku ujemnego zapasu, łańcuch deficyt->garncarnia, agregat miast, symulacja tur (MODEL) z liczbami; wzmocnienie testów legacy.
ZMIANY/COMMIT: baza kodu b1a5c1e80 (r1). Pliki r2: gra/src/game/ai.ts (1 zmiana: `const AI_BUILDING_FOR_DEFICIT` -> `export const`, tylko na potrzeby testu łańcucha), gra/tools/building-upkeep-ceramics-test.cjs (sekcje E-H), gra/tools/upkeep-test.cjs i gra/tools/building-upkeep-resources-test.cjs (zamiast filtrowania ceramiki: asercja, że pole utrzymania daje stałą ilość z buildings.json; reszta asercji jak w bazie). Brak push, deployu, WERSJE.md, build/dev.
ODPOWIEDZI NA ZARZUTY:
 1. Symulacja N tur / saldo / % tur z deficytem — PRZYJĘTE (częściowo). Sekcja H: 200 tur, realne funkcje (detectOwnerResourceNeeds, deductBuildingStockCostAcrossCities, totalBuildingResourceUpkeep, readBuildingResourceUpkeepRatio), popyt 8/t z danych. Produkcja Garncarni 50/t (fallback converters.ts) i budowa przez AI to ZAŁOŻENIA modelu, nie pomiar gry. Wyniki:
    S1 Garncarnia od t0, zapas 0: deficyt 1/200 tur (0,5%), saldo min 42, koniec 8400 (model nie ma capu Magazynu).
    S2 Garncarnia od t10, zapas 0: deficyt 11/200 tur (5,5%), saldo min 0.
    S3 brak Garncarni (worst case), zapas 8: deficyt 199/200 tur (99,5%), saldo 0. AI MUSI postawić producenta; to zależy od boostu w ai.ts, którego model nie testuje.
    NIE_ZMIERZONO w grze: tempo budowy Garncarni przez AI oraz saldo w prawdziwej turze (wymaga headless bundle main.ts).
 2. Brak ujemnego zapasu — PRZYJĘTE: sekcja E (3 przypadki: zapas 3+2 przy poborze 8 -> [0,0]; 5+3 przy poborze 6 -> [0,2]; zapas 0 bez zmian, obcy owner nietknięty) oraz asercja nieujemności w każdej turze sekcji H. Obserwacja: niedobór poboru jest tracony (clamp), nie zapisywany jako dług. Zgodne z kontraktem funkcji.
 3. Łańcuch deficyt -> Garncarnia — PRZYJĘTE częściowo: sekcja F sprawdza AI_BUILDING_FOR_DEFICIT.ceramika == ['garncarnia'] oraz że deficyt z detectOwnerResourceNeeds mapuje się na garncarnię. NIE pokryte: boostCandidatesForResourceDeficits i ścieżka main.ts resourceDeficitKeysForOwner (wewnątrz boot(), niedostępne headless): NIE_ZMIERZONO.
 4. Zmienione testy legacy — PRZYJĘTE: filtr zastąpiony asercją (pole utrzymania = stała ilość, ratio 1); reszta asercji (koszt_surowce) jak w bazie. Agregat 4 miast = 8: sekcja G; sekcja C już sprawdza totalBuildingResourceUpkeep = 8 dla katalogu (nie 40).
 Odchylenie od allowlisty (ai.ts, main.ts, buildingAdapter, docs, wikiBundle, testy legacy): uzasadnione funkcjonalnie; ai.ts w r2 to jeden `export`. Do jawnej akceptacji orkiestratora.
TESTY (worktree, node, bez build/dev):
- building-upkeep-ceramics-test: 649 pass / 0 fail (sekcje A-H)
- upkeep-test: 91 / 0
- building-upkeep-resources-test: 48 / 0
- ai-resource-needs-test: 6 / 0
- git diff --check: czysty
- tsc / przeglądarka: NIE_ZMIERZONO w tej rundzie
BLOKADY:
- Pomiar w prawdziwej grze (saldo ceramiki w turze, tempo budowy Garncarni przez AI): NIE_ZMIERZONO.
- Garncarnia wymaga Gliny w imperium (wymagania w buildings.json); model zakłada dostępność glina+drewno.
- Akceptacja bazy 5c96ff0eb i odchyleń allowlisty: do decyzji orkiestratora.
RUNDY: 2/5 (ostatni werdykt Evaluatora: FAIL r1)
NASTĘPNY KROK: Evaluator (Sonnet) rundy 2: weryfikacja sekcji E-H i asercji legacy; orkiestrator decyduje o odchyleniach i o pomiarze w grze przed FC.
DEPLOY/PUSH: NIE WYKONANO
