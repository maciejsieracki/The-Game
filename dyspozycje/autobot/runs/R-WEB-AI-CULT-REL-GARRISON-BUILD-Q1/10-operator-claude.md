STATUS: PASS-WITH-NOTES
DOMAIN: GAME (AI)
TEMAT: R-WEB-AI-CULT-REL-GARRISON-BUILD-Q1
GOAL: normalny/trudny AI trzyma garnizon wg potrzeby miasta i buduje budynki Prawa/Szczescia; pomiar PRZED/PO (seed 4242 i 7, 60 tur, poziom maksymalny = trudny).
ZMIERZONE-NA: baza 54af88a0e (PRZED) vs kandydat r3 (PO; SHA w polu sha StructuredOutput).

ZMIANY/COMMIT (r3, Operator Sonnet 5.5):
- gra/src/game/ai-city-order-need.ts: `aiCityGarrisonNeedFromOrder` (wejscie z pelnego rozbicia silnika evaluateOrderFromBreakdown; linia garnizonu odjeta od netto Prawa; perUnit/cap/progi z society-params).
- gra/src/game/ai-city-garrison.ts: `garrisonPoolUnitIds` (do N najslabszych jednostek na miasto), `cityGarrisonEligibleCount`.
- gra/src/game/ai.ts: pole `AITurnOpts.cityGarrisonNeed`; `aiCityGarrisonTarget` = max(1, need); `cityGarrisonPoolIds` (pula armii wykluczona spojnie we WSZYSTKICH 6 miejscach: home-war, seeks-army, concentration/front-merge, war-allin, kampania wodza, miasta-panstwa); `emptyCityGarrisonRecruitIds` z celem; preferencja budynkow `AI_ORDER_DEFICIT_BUILDING_BONUS` = 40 (grupa "Prawo i administracja" + dajeSzczescie) przy need >= 1; `applyWarAllInCapitalToCommands` dostaje opts.
- gra/src/main.ts (minimalny plumbing, zgodnie z rozszerzeniem allowlisty): mapa `aiCityGarrisonNeedByCityId` wypelniana w petli Porzadku miast, przekazywana jako `cityGarrisonNeed` do decideAITurn TYLKO gdy aiGarrisonNeedApplies(poziom) (normalny/trudny); latwy/zgodnosc = pole undefined.
- gra/tools/ai-city-order-need-wiring-test.cjs (NOWY), gra/tools/ai-city-garrison-min-one-test.cjs (tylko aktualizacja tekstu mutacji MUT_CS po zmianie nazwy funkcji; asercje bez zmian).
- Runner pomiaru: gra/tools/ai-cult-rel-measure-run.cjs (kopia ai-economy-measure-run z `--kr`), gra/tools/ai-cult-rel-measure-summarize.cjs; dokument dyspozycje/analizy/AI-KULTURA-RELIGIA-2026-11-26.md (sekcja 6); dowod surowy 20-pomiar-r3-surowy.txt.

TESTY (surowe wyniki, kandydat r3):
- tsc --noEmit: EXIT 0 (pusty wynik).
- logic: 213/213; tech-tree: 20/0; research: 33/0; combat: 6/6; unit-replace-full-cost 40/0, unit-replace-promotion-table PASS (reszta unit-replace-* NIE URUCHAMIANA).
- ai-test: 297 passed, 0 failed (bez zmian).
- society-breakdown-test 56/0; culture-religion-level-test 59/0; culture-religion-test 65/0.
- ai-city-order-need-test 35/0; ai-city-garrison-min-one-test 38/0; ai-city-order-need-wiring-test 119/0 (T1 tabela CULTMODEL2 z pelnego wejscia: normalny 3, trudny 4; T1b niezaleznosc od stojacego garnizonu; rekrutacja, pula, gating poziomu; mutacje MW1-MW5 wszystkie wykryte).
- Brak testu jednostkowego preferencji budynkow (NIE ZMIERZONO testem; tylko pomiar zywa gra).

POMIAR (zywa gra, Chromium, poziom MAKSYMALNY: Kultura i religia = trudny; trudnosc gry w haku = Normalny - hak startGame nie pozwala na wyzsza; AI = owner != 0 wlacznie z miastami-panstwami), t60:
| wariant | miasta | jednostki | puste miasta | bud. Prawa | bud. Szczescia |
| zgodnosc 4242 | 166 | 243 | 27 (16,3%) | 42 | 140 |
| PRZED trudny 4242 | 154 | 171 | 55 (35,7%) | 12 | 60 |
| PO trudny 4242 | 151 | 156 | 51 (33,8%) | 11 | 45 |
| zgodnosc 7 | 194 | 268 | 53 (27,3%) | 11 | 110 |
| PRZED trudny 7 | 146 | 164 | 44 (30,1%) | 3 | 41 |
| PO trudny 7 | 163 | 204 | 45 (27,6%) | 13 | 58 |
DIAGNOZA (liczby): baza PRZED potwierdza notatke FALI 924 (171 vs 243 jednostek, 35,7% vs 16,3% pustych, seed 4242). Na trudnym AI buduje 57-70% mniej budynkow Szczescia i ~30% mniej jednostek; spojne z oslabiona produkcja miast przy karach Porzadku, ALE przyczyna NIE rozstrzygnieta: brak licznika powodow (bunt/tier/utrata miasta) w hooku -> NIE ZMIERZONO. H3 (utrzymanie jednostek) NIE badane.
EFEKT WPIECIA: MIESZANY. Seed 7: poprawa (jednostki 164->204, puste 30,1%->27,6%, bud. Prawa 3->13). Seed 4242: bez poprawy (jednostki 171->156, puste 35,7%->33,8%). Biegi roznia sie trajektoria AI, pojedyncze ziarno nie jest dowodem. Binarny cel "mniej pustych miast i brak rozpadu AI" osiagniety tylko czesciowo (puste miasta spadly o 2-3 pp w obu ziarnach, nadal ~2x wiecej niz w zgodnosci na 4242).
Bunty i utrata miast: NIE ZMIERZONO (liczba miast AI rosnie w kazdym biegu; brak haka buntow).

BLOKADY: brak blokad technicznych. Ograniczenia: hak startGame ustawia trudnosc gry Normalny; pomiar tylko 2 ziarna x 1 bieg na wariant; poziomy latwy/normalny nie mierzone (regula maksimum).
ZALOZENIA: (a) poziom maksymalny = trudny (Kultura i religia). (b) Bonus budynkow 40 wybrany jako "minimalna waga" (ponizej bazy grupy 110 vs wojsko 90; pozostaje stroikiem do decyzji orkiestratora). (c) Potrzeba liczona bez modyfikatora macierzy cywilizacji (applyCivMatrixHappinessModifier) - niewielki rozjazd mozliwy.
RUNDY: 3/5
NASTEPNY KROK: Evaluator; jesli Evaluator uzna efekt mieszany za niewystarczajacy, nastepny krok wymaga licznika powodow (hak odczytu buntow/pasm Porzadku w main.ts, poza minimalnym plumbingiem) oraz decyzji o ew. zmianie balansu (tylko jesli przyczyna = produkcja/utrzymanie -> DECISION_REQUIRED, nie zrobione tu).
UWAGI-DLA-ORKIESTRATORA: (1) Runner z R-WEB-CULT-REL-IMPL-Q1 nie istnieje w repo/gałęzi (dispatch wskazywał nieistniejącą ścieżkę) - uzyto ai-economy-measure-run.cjs jako bazy. (2) ai-city-garrison-min-one-test mial mutacje oparte o tekst nazwy zmiennej w ai.ts; zaktualizowano tylko tekst znajdowany, asercje nietkniete. (3) Pre-existing: dlugi czas biegow seed 7 (limit 280 s ucinal; wznawialny runner dokonczyl). (4) Katalogi tymczasowe poza repo: /tmp/claude-0/aicult (do usuniecia po integracji).
DEPLOY/PUSH: NIE WYKONANO
