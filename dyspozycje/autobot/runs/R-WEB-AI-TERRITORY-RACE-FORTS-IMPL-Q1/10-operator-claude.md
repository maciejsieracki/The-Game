STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-TERRITORY-RACE-FORTS-IMPL-Q1
GOAL: AI: fort dopiero od 40 NOWYCH heksów, posterunek od 16; forty/posterunki po wyczerpaniu limitu miast (bez zmiany kolejności); udział do 15% puli Pracy w oknie tur [30,90]; przy zagrożeniu udział = 0; gracz bez zmian.
ZMIANY/COMMIT: baza 72a95414a (origin/main). Allowlista: gra/data/ai-territory-race-params.json (nowy), gra/src/game/auto-improvements.ts, gra/src/game/ai.ts (planCityImprovements + 1 wywołanie w decideAITurnCore), gra/tools/ai-territory-race-test.cjs (nowy), raport. main.ts i terrain-improvements.ts nietknięte. SHA: patrz sha w odpowiedzi.

TESTY:
- tsc --noEmit: exit 0
- ai-territory-race-test.cjs (nowy): 18 OK / 0 FAIL
- mutanty (kopie src poza repo): usunięty prog per klucz -> 2 FAIL; usunięte okno udziału -> 2 FAIL; usunięty warunek zagrożenia -> 1 FAIL (wszystkie czerwone)
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; ai-economy-measure-hook-test 23/23
- auto-improvements-test 46/0; auto-improve-q3 41/0; auto-improve-no-item-cap 15/0; auto-fort-diag 18/0; terrain-improve-farm-availability 36/0
- auto-fort-claim-test: 61 OK / 2 FAIL. TE SAME 2 FAIL na bazie 72a95414a (sprawdzone na git archive) = błąd istniejący, NIE z tego tematu (sekcja „droga" w K/fixturze). Do osobnego zgłoszenia.
- Bieg dymny seed 4242, 45 tur, baza vs zmiana (bundle vite poza repo): t45 AI forty 9/9, posterunki 4/4, heksy terytorium 7980/7980; przebiegi baza i zmiana identyczne w 44/44 turach. NaN 0, brak crashy.
- NIEZGODNOŚĆ: pierwszy przebieg zmiany dał inne wyniki (posterunki 3, miasta AI 149 vs 167 w t45). Drugi przebieg tego samego kodu zgodny z bazą. Runner jest NIEDETERMINISTYCZNY (23/44 tur różnych między dwoma przebiegami identycznego kodu). PRZYCZYNY NIE ZBADANO.

BLOKADY: brak. Nieśledzone pliki gra/*.out.txt (logi moich testów) NIE są w commicie.

ZAŁOŻENIA (do potwierdzenia):
(a) Kolejność bez zmian: forty tylko po wyczerpaniu limitu miast (bramka cityLimitExhausted, krok E-FORT).
(b) „Nowe heksy” = jak w kodzie: heksy lądowe w promieniu z territoryOwnerAt == null. Heksy cudze/sporne NIE są liczone jako nowe.
(c) Progi w JSON: fort 40, posterunek 16; zastosowane per klucz (fort przed posterunkiem, z przejściem do posterunku przy niezaliczonym forcie).
(d) Udział: w oknie [30,90] suma kosztów fortów/posterunków w jednym wywołaniu pickFortClaims <= 0.15 * pula wejściowa (globalPracaPulaAtEntry). Poza oknem bez osobnego udziału. Zagrożenie = countThreatFronts na engageableEnemyUnits (bez filtra obrony domu) i zeruje forty TYLKO w oknie (poza oknem zagrożenie nie blokuje, jak przed tematem).
(e) Brak limitu łącznego (zgodnie z P3=B).
(f) AI only: nowe pole opts.aiTerritoryRace ustawiane wyłącznie w planCityImprovements (ścieżka decideAITurnCore). Wywołanie gracza (main.ts) i ścieżka miast-państw (decideDefensiveCopyTurn) tego pola nie dostają, więc zachowanie jest jak przed tematem. Stała FORT_CLAIM_MIN_NEW_HEXES = 1 zostaje dla gracza.

NASTĘPNY KROK: orkiestrator decyduje o integracji i o biegu 150 tur PRZED/PO na 2 ziarnach (nie robiłem). Uwaga: nieprzypadkowa niedeterminizacja runnera utrudni porównanie PRZED/PO bez powtórzeń.
UWAGI-DLA-ORKIESTRATORA: auto-fort-claim-test ma 2 czerwone asercje już na bazie 72a95414a; warto je naprawić osobnym tematem. Runner ai-economy-measure-run jest niedeterministyczny między przebiegami.
RUNDY: 1/5
DEPLOY/PUSH: NIE WYKONANO
