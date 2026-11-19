STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECONOMY-ERA-REBALANCE-FLAG-Q1 (runda 3, obrona Operatora HAIKU; baza kandydat 291c69d0f)
GOAL: rebalans ekonomii wg epok ZA FLAGA (domyslnie OFF): ulepszenia stale jak epoka 1, zywnosc wojska x3/epoke, racje obywateli x2/epoke; konwertery i utrzymanie surowcowe poza rebalansem.

ODPOWIEDZI NA ZARZUTY EWALUATORA (20-evaluator-claude.md, commit 6547cb5fd):
1. PRZYJMUJE. converters.ts:213 (converterThroughputForEra) uzywa teraz legacyCitizenConsumptionEraMultiplier (1+0,5(e-1), bez rebalansu). Flaga nie wplywa na konwertery (test E7: ON == OFF = 10/15/20).
2. PRZYJMUJE (zalozenie): citizen-resource-upkeep.ts:190 (citizenUpkeepRateForEra, utrzymanie surowcowe obywateli) uzywa legacy. Uzasadnienie: decyzja wlasciciela (3) mowi "Zywnosc obywateli: wzrost dwukrotny", a dispatch zabrania zmiany "utrzymania surowcem". Tylko racje ZYWNOSCI (population-growth-v85, computeCityRationCost) skaluja sie 2^(e-1). Test E7: ON == OFF = 1/1,5/2/2,5/3.
3. PRZYJMUJE. Dodano testy: E7 (konwertery i utrzymanie surowcowe OFF vs ON), E8 (karta jednostki OFF=1, ON=4/12/36), E9 (nazwy epok Kamien/Braz/Zelazo -> 1/2/3); mutanty M8 (konwertery 2^(e-1)), M9 (utrzymanie surowcowe 2^(e-1)), M10 (karta bez wartosci faktycznej) - wszystkie czerwone.
4. NIE DOTYCZY (dowod danych, bez zmiany kodu): gra/data/units.json ma wylacznie epoki tekstowe: Kamien 11, Braz 37, Zelazo 27 (zliczone python3). Brak epok 4-5, wiec zwiniecie do max 3 nie zmienia wyniku. Test E9 pokrywa mapowanie nazw.
5. PRZYJMUJE. gra/src/game/economy-upkeep.ts: nowa funkcja unitFoodCardValue(unit). Flaga OFF -> surowa wartosc (bez zmian). Flaga ON -> rebalancedUnitFoodBase x R_STAWKI (4/12/36 dla bazy 1), czyli zgodnie z unitFoodPerTurn dla wlasnego terytorium. Podpiete w gra/src/ui/unitInfoCard.ts:318 i gra/src/ui/entityCards/unitAdapter.ts:304.

ZMIANY-COMMIT: commit na gałęzi detached (SHA w polu sha raportu StructuredOutput)
- gra/src/game/citizen-consumption-era.ts: nowa legacyCitizenConsumptionEraMultiplier (krzywa bez rebalansu); citizenConsumptionEraMultiplier (racje zywnosci) bez zmiany zachowania.
- gra/src/game/converters.ts:213: legacy zamiast citizen (konwertery poza rebalansem).
- gra/src/game/citizen-resource-upkeep.ts:190: legacy zamiast citizen (utrzymanie surowcowe poza rebalansem).
- gra/src/game/economy-upkeep.ts: unitFoodCardValue (eksport).
- gra/src/ui/unitInfoCard.ts, gra/src/ui/entityCards/unitAdapter.ts: wartosc karty zywnosci przez unitFoodCardValue.
- gra/tools/econ-era-rebalance-test.cjs: E7-E9, M8-M10, nowe wejscia bundla (converters, citizen-resource-upkeep).
- ZAKRES POZA ALLOWLISTA (do decyzji orkiestratora; bez tego nie da sie rozdzielic funkcji): gra/src/game/converters.ts, gra/src/game/citizen-resource-upkeep.ts, gra/tools/citizen-consumption-era-mult-test.cjs (zmieniona kotwica mutanta na legacyCitizenConsumptionEraMultiplier; bez tego gate byl czerwony po rozdzieleniu). Zmiany jednowierszowe + komentarze.
- Nietkniete: gra/data/** (poza tym co juz bylo), WERSJE.md, main.ts, rust-port, gra-robocza.
- gra/node_modules zainstalowane przez npm ci --ignore-scripts (ignorowane przez git, nie commitowane).

TESTY (surowe wyniki, uruchomione w tej rundzie):
- tsc --noEmit: exit 0
- econ-era-rebalance-test.cjs: WYNIK: 37 ok, 0 FAIL (exit 0); mutanty M1-M10 wykryte
- citizen-consumption-era-mult-test.cjs: PASS (po poprawce kotwicy)
- citizen-upkeep-era-mult-test.cjs: 681 passed, 0 failed
- foundry-throughput-x2-era-mult-test.cjs: 159 passed, 0 failed
- population-growth-v85-bonus-test.cjs: 65 pass, 0 fail
- logic-test.cjs: LOGIC OK (213/213)
- tech-tree-test.cjs: 20 pass, 0 fail
- research-test.cjs: PASSED 33 / FAILED 0
- unit-replace-test.cjs: 21/21
- combat-test.cjs: 6/6
- hud-shortage-alert-converter-test.cjs: 17 ok, 0 FAIL
- resource-gross-net-converter-inputs-test.cjs: 18 ok, 0 FAIL
- hud-resource-card-state-test.cjs: 7 ok, 0 FAIL
- PRZEDISTNIEJACE czerwone (wg Evaluatora identyczny wynik na bazie d425dd0a3; nie powtorzylem na bazie): unit-epoch-cost-test 56/1, citizen-resource-upkeep-test 122/2 (kotwice w main.ts, ktorego ta runda nie dotyka).
- NIE_ZMIERZONO w tej rundzie: ai-economy-measure-hook-test (wymaga buildu vite + Chromium); bieg <=30 tur seed 4242 OFF/ON (wymaga bundla i Chromium, nie uruchomiono). Pomiar t30 z rundy 2 jest NIEAKTUALNY dla ON: konwertery i utrzymanie surowcowe zmienily wynik. Orkiestrator musi powtorzyc bieg 150 tur OFF vs ON.

BLOKADY: brak techniczny. Decyzja do orkiestratora: akceptacja trzech plikow poza allowlista (patrz ZMIANY).

UWAGI-DLA-ORKIESTRATORA (poza zakresem, nie zmieniano):
- Karta jednostki przy flagach OFF nadal pokazuje surowa wartosc "zywnosc/ture" (1), a faktyczna zywnosc to x4 (R_STAWKI). Rozbieznosc istniala przed ta zmiana; OFF zachowane bit-w-bit.
- Konwertery (Cegielnia/Odlewnie/Huta) i utrzymanie Pracy nie zmienione (zgodnie z dispatchem: tylko inwentarz).

RUNDY: 3/5 (runda 2 = ocena Evaluatora 6547cb5fd).
NASTEPNY KROK: Evaluator (runda 3) potwierdza E7-E9 i M8-M10; Final Control decyduje o trzech plikach poza allowlista; orkiestrator uruchamia bieg 150 tur OFF vs ON (nie wykonuje tego Operator).
DEPLOY/PUSH: NIE WYKONANO
