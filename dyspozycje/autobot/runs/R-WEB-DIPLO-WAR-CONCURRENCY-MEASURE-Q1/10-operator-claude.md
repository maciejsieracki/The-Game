STATUS: PARTIAL (2 z 3 ziaren, zaden nie do tury 150)
DOMAIN: GAME (pomiar; bez zmian logiki)
TEMAT: R-WEB-DIPLO-WAR-CONCURRENCY-MEASURE-Q1
GOAL: pomiar w grze: jak czesto wybuchaja wojny epoki, miedzy kim, i czy cywilizacja w wojnie epoki staje sie celem wojny naturalnej.
ZMIANY-COMMIT: efb196b29 (hak, runner, analizator, dowody seed 4242 t2-t76) + commit dokumentacji z tym raportem i dowodami seed 7 (SHA w polu sha).
- gra/src/main.ts: +34 linii, hak odczytowy `__warConcurrencyMeasure.snapshot` (tylko ?civTest=1), bez zmiany logiki.
- gra/tools/war-concurrency-measure-run.cjs: wznawialny runner (kopia runnera ekonomii, wojny z typem).
- gra/tools/war-concurrency-measure-analyze.cjs: analiza JSONL (epizody, zdarzenia (c), wspolbieznosc).
- dowody/: seed4242-wars-t2-t76.json, seed4242-summary-t76.json, seed4242-analiza-t76.json, seed7-wars-t2-t67.json, seed7-analiza-t67.json.
TESTY: tsc --noEmit exit 0; logic-test LOGIC OK 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6. Bundle vite w /tmp/wc-dist (poza repo).

WYNIKI (z analizatora, liczby z plikow dowodow):
| Ziarno | Tury | (a) wojny EPOKI | (b) wojny NATURALNE | (c) EPOKI -> NATURALNA | (d) maks. wojn/civ, civ z >=2 naturalnymi |
|---|---|---|---|---|---|
| 4242 | 2-76 | 1 (0 vs 25, braz, start t40, trwa) | 21 | 0 | max naturalnych 5; 10 civ, 187 civ-tur |
| 7 | 2-67 | 1 (0 vs 25, braz, start t40) | 15 | 1: t50, X=25 (w wojnie epoki z graczem), druga strona 37, typ NATURALNA | max naturalnych 5; 7 civ, 185 civ-tur |

- (a) W obu ziarnach tylko 2 z 42 wlasciciel(i) byli kiedykolwiek stroną wojny epoki (gracz 0 i civ 25). Pozostali 40 nie mieli wojny epoki w przebadanych turach. Hipoteza wlasciciela (wojny epoki nie obejmuja wszystkich) jest potwierdzona na tej probce, ale obie wojny epoki sa identyczne (ta sama para, start t40), wiec mozliwe, ze to cecha ukladu startowego, nie ogolny wzorzec. NIE ZBADANO przyczyny.
- (c) Scenariusz wlasciciela wystapil raz (seed 7, t50): civ 25 w wojnie epoki z graczem zostal w nowej wojnie naturalnej z civ 37. Wojna byla w Brazie (bez limitu). Kto wypowiedzial wojne, dane nie mowia.
- (e) Zdarzenia Kamienia (blokada stone_limit) NIE ZMIERZONO: hak nie raportuje odrzuconych prob wypowiedzenia.

BLOKADY:
1. Ziarno 1234 NIE uruchomione.
2. Seed 4242 zatrzymany w turze 76: canEnd=false przy pendingAuto=false, pending=0 i zamknietych modalach (seed 4242 z zapisu t70 - powtarzalnie dwa razy). Przyczyna NIE zbadana (kandydat: canPlayerInitiateEndTurn / healStaleEndTurnBlockers w main.ts).
3. Wznowienie ze slotu czesto konczy sie SEGV Chromium (intermitentne, zbadane tylko objawowo). Dlatego przebiegi sa swieze, ~66 tur na wywolanie 580 s; pelne 150 tur wymaga wznowien.
4. Surowe JSONL (~850 KB na 75 tur) zostaje w scratchpad (poza repo); w dowodach tylko wycinki wojen (limit 1 MB).
5. Puste pliki seed4242.* w dowody/ (z nieudanych prob, nieskomitowane) - do usuniecia przez orkiestratora.

RUNDY: 1/5
NASTEPNY KROK: runda 2: (1) zbadac stall canEnd w t76 (seed 4242) i ustalic czy to defekt gry; (2) doprowadzic seed 4242 i 7 do tury 150 (wznowienia albo swieze przebiegi w kawalkach); (3) seed 1234 do 150; (4) dodac odczyt odrzuconych prob wypowiedzenia (dla (e)); (5) sprawdzic, czy para 0-25 od tury 40 powtarza sie z przyczyny strukturalnej.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: pelny bieg 3x150 tur to ok. 2-4 h wall-clock przy obecnym tempie (ok. 9 s/tura wczesnie, 30-40 s/tura po t60).
