STATUS: PASS
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-STADNINA-FORT-TERRITORY-SCAN-Q1
ROLA: Operator (obrona), runda 1/5, baza kodu: 69f86ef95 (origin/main 95a4b25ab)

Zarzut 1 (brak symulacji pełnej gry, 3 ziarna) — PRZYJMUJĘ w zakresie możliwym.
Pełna gra w przeglądarce to ok. 50 min/bieg (patrz `ai-city-count-sim.cjs`), więc pełna gra: NIE_ZMIERZONO.
Zamiast tego pomiar na realnych mapach: `gra/tools/ai-stadnina-fort-realmap-sim.cjs` (generateMap 100x70, ziarna 1,2,3,
każde złoże konia: własny fort w odl. 1, miasto w odl. 8; prawdziwe `getQualifyingHexes` i `pickAutoImprovements`).
PRZED (auto-improvements.ts z 95a4b25ab): 29 scenariuszy, gracz legalnie 45 heksów Stadniny, AI 10.
PO: gracz 45, AI 45, AI-nielegalne 0 (ziarna 1/2/3: 11/11, 8/8, 26/26).

Zarzut 2 (brak regresji PRE) — PRZYJMUJĘ. Te same 10 testów regresji na bazie 95a4b25ab (PRE) i na 69f86ef95 (POST):
wszystkie EXIT=0, identyczne liczniki (15/29/28/17/56/81/63/18/80/40 zaliczone, 0 FAIL) — brak przesunięcia zachowania.

Zarzut 3 (promień bez marginesu +1) — ODRZUCAM. Margines +1 w `buildCandidateHexKeys` (improvement-build.ts:1432) to tylko
szerszy zbiór kandydatów; o legalności decyduje kwalifikator oparty o `territoryOwnerAt`, czyli dokładnie
`cityTerritoryRadius(n)`. Heks na odległości +1 od koła fortu nie należy do terytorium, więc nigdy nie jest legalny.
Skan AI = dokładny zbiór legalnych heksów. Dowód: sim wyżej (AI 45 = gracz 45, 0 nielegalnych) i test (spór).

Zarzut 4 (test sporu z wrogim miastem nierozstrzygający) — PRZYJMUJĘ. Dodano do `ai-stadnina-fort-territory-test.cjs`
blok "(spor)": wrogie miasto pop 8 w (14,0), (10,6) oraz pop 3 w (12,2); asercje: AI nie bierze heksów nielegalnych dla gracza
oraz widzi wszystkie legalne. Przypadek (10,6): gracz legalne [10,-3], AI [10,-3] (wrogie miasto realnie odcina 10,3 i 12,0 —
test rozstrzygający); (12,2): [10,-3 8,0] = [10,-3 8,0]; (14,0): puste = puste. Wynik testu: 17 OK / 0 FAIL.

BRAMKI: tsc --noEmit EXIT=0; test fort-territory 17/0; regresje PRE i POST jak wyżej.
DEPLOY/PUSH: NIE WYKONANO
