STATUS: DECISION_REQUIRED (zarzut 7 wymaga decyzji wlasciciela/ABC; zarzuty 3 i 6 otwarte, nie zamkniete)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1
GOAL: obrona zarzutow Evaluatora wobec kandydata 1c4d3b5e6 (runda 4). Baza kodu: origin/main 807ecebdd (kandydat jest jego potomkiem). Commit kodu obrony: 235c26c7c.
ZMIANY/COMMIT: 235c26c7c (kod + testy; allowlista: gra/src/battle/battleScene.ts, gra/tools/battle-full-move-strike-test.cjs, gra/tools/battle-pursuit-move-behavior-test.cjs, gra/tools/battle-pursuit-pace-browser-entry.ts). Raport: osobny commit (ten plik). Brak zmian w WERSJE.md, manifescie, rust-port, combat-params, docs.
  - battleScene.ts: po ciosie, gdy nie ma juz zadnego wroga, ustawiany jest postStrikeBlocked=true (dotad tylko przy braku sciezki). Zachowanie gry bez zmian, to tylko znacznik diagnostyczny.
  - probe (battle-pursuit-pace-browser-entry.ts): canStrike liczy tylko wrogow nieuderzonych w tej aktywacji; dodane pole enemiesAlive.
  - test pelnej bitwy: asercja ruchu po ciosie strzelcow, asercja (a2) pelnej puli MP na danych realnych, mutacja M3 takze dla strzelcow.
  - test T3: check A6 (autentycznosc miary na danych realnej sceny).

TESTY (surowe wyjscie z tego przebiegu; Chromium headless; npm ci --ignore-scripts lokalnie w gra/):
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- battle-full-move-strike-test (wszystkie czesci, ziarna 1,2,3): 7/7 pass; mutacje M1 (doubleStrike=19), M2 (preHitThenMove=10), M3 (msmInf+msmCav=0, postHitThenMoveRanged=0) wykryte.
  SUMA code: msmInf=51, msmCav=16, postMoveThenHit=106, postHitThenMoveRanged=83, doubleStrike=0, maxStrikes inf/cav/ranged=1/1/1, preMoveThenHit=0, preHitThenMove=0, firstContact=2 (kazde ziarno).
  NOWE (a2): zuzyto 552/927 MP w 229 aktywacjach po zderzeniu z ruchem po ciosie; mpUnexplained=0.
  Determinizm (ziarno 1, x3): 4d61c61121b8594addf95c9fdfb8f0cd w 3 przebiegach. Hashe ziaren: 1=4d61c611..., 2=dfd61123..., 3=738a8fd2...
- battle-pursuit-move-behavior-test: 8/8 pass, mutacje 3/3 wykryte.
  SUMA T3 = 119/140 = 0.85 (prog 0.80, bez zmiany). Ziarna: seed1 1/7 (0.143), seed2 59/63 (0.937), seed3 59/70 (0.843). wastedActs 1/1/2 (suma 4).
  A6 (dane realne): mutacja miary zmienia werdykt w 19 aktywacjach. T1 arbPathCav=0, T2 pingpong=0.
- battle-pace-latch-test: 5/5 pass, mutacja MELEE_LATCH wykryta.
- battle-line-advance-uniform-test: 17 PASS, 0 FAIL.
- battle-pace-equal-line-live-test: 23 pass, 0 fail (uruchomiony z timeoutem 585 s; dluzszy niz 280 s).
- battle-doctrine-live-r4-test (kandydat z 235c26c7c): 4 PASS, 1 FAIL ("no browser page or console errors"). Ten sam wynik podal Evaluator dla bazy 807ecebdd; baze NIE ZMIERZONO przeze mnie.
- git diff --check: czysty.
NIE ZMIERZONO: battle-doctrine-live-r3, battle-large-mixed-doctrine-matrix (czas), zrzut ekranu Chromium (dowodem sa logi zdarzen z zywej bitwy w Chromium: callers/attackLog/ends).

OBRONA ZARZUTOW (kazdy zarzut Evaluatora 821107905):
1. PRZYJMUJE. Dodano asercje (a2): zuzycie MP w aktywacjach po zderzeniu z ruchem po ciosie (dane sondy rows/ends), 552/927 MP, 229 aktywacji, mpUnexplained=0. W trakcie znaleziono jedna aktywacje (ziarno 1, tura 11, piechota atk2, ml=2, wolne pola): postStrikeBlocked=false, enemiesAlive=0 (ostatni wrog padl w tej aktywacji), czyli brak dokad isc wg DODATKU 5b. Dlatego dodano jawny znacznik postStrikeBlocked przy braku wrogow. Zastrzezenie: dla tej aktywacji (a2) opiera sie na samoraportowaniu silnika (znacznik), a nie na niezaleznym pomiarze.
2. PRZYJMUJE. Asercja (a) strzelcow: postHitThenMoveRanged=83 > 0. Mutacja M3 zaczerwienia takze strzelcow (postHitThenMoveRanged=0).
3. OTWARTE (nie zamkniete). firstContact=2 we wszystkich ziarnach. Probowalem scenariusza z lucznikami (BFM_ATK=Lucznik:10,Hastati:4 BFM_DEF=Lucznik:8): nie doszlo do zderzenia wrecz, padl jeden strzal, wiec scenariusz nie dowodzi reguly 5a. Nie dodano testu przelaczenia przy pierwszym zderzeniu po dluzszym dojsciu. Do zrobienia w kolejnej rundzie albo wskazanym scenariuszem.
4. PRZYJMUJE CZESCIOWO. Dodano check A6: mutacja miary zmienia werdykt w 19 aktywacjach realnej sceny. Testy A1-A5 nadal syntetyczne. Nie zbudowano pelnoprzebiegowego testu mutacji z czerwonym A4 na scenie.
5. PRZYJMUJE poprawke probe; liczby w tym scenariuszu bez zmiany. Stan 'arrived' nie liczy juz wroga uderzonego w tej aktywacji. Po poprawce SUMA = 119/140, identyczna z liczbami Evaluatora (przed poprawka). Jeden pomiar po poprawce dal 132/147 (zmiana w seed 1: 14/14 zamiast 1/7), ale nie dal sie odtworzyc: seed 1 powtorzony 3 razy daje 1/7 (dwa razy z diagnostyka, raz bez niej). Przyczyna roznicy NIE ZBADANA.
6. OTWARTE (nie rozstrzygniete). Margines T3 0.85 vs 0.80. Ziarno 1: jedna aktywacja konnicy, pula 7 MP, wykorzystano 1 MP, wolna droga istnieje i jednostka stoi (wasted). To prawdopodobnie realne niedotrzymanie pelnej puli wg DODATKU 4 (nie regresja wzgledem bazy). Przyczyny nie zdiagnozowano w tej rundzie (nie ustalono tury ani przyczyny zakonczenia aktywacji).
7. DECYZJA (kodu nie zmieniono). Zakres reguly: _fullMoveRuleActive wylacza reczne rozkazy gracza, oblezenie z murem, routed; _continueAfterStrike wylacza doktryny Obrona i Ostrzal oraz ogranicza strzelcow do podejscia na zasieg. To zalozenia robocze, nie potwierdzone przez wlasciciela. Literalna regula wlasciciela (DODATEK 4 pkt 5) obejmuje AUTO, SKIP i reczna. Wymaga ABC do wlasciciela albo decyzji FC.
8. PRZYJMUJE. Liczby w tym raporcie pochodza z surowego wyjscia tego przebiegu. "6/6 pass" z poprzedniego raportu bylo bledne (wlasciwie 5/5 + 1/1; msmInf=51, msmCav=16 w sumie 3 ziaren).

BLOKADY: zarzut 7 wymaga decyzji wlasciciela (DECISION_REQUIRED). Zarzut 6 wymaga diagnozy (1 aktywacja konnicy, ziarno 1). Zarzut 3 wymaga scenariusza z dlugim dojsciem. Brak blokady technicznej.
RUNDY: 4/5 (obrona zarzutow Evaluatora r4).
NASTEPNY KROK: (1) decyzja wlasciciela w sprawie zakresu reguly (zarzut 7, ABC), (2) diagnoza aktywacji konnicy ziarno 1 (zarzut 6), (3) scenariusz dla zarzutu 3, (4) doctrine-live-r3 i large-mixed-matrix przed FC. Potem Final Control.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Commit kodu i testow: 235c26c7c. Commit raportu: osobny (sha w polu sha).
- Interpretacja dyspozycji "zacommituj tylko ten plik": raport w osobnym commicie, poprawki zarzutow w commicie kodu (inaczej kandydat nie zawiera poprawek). Gdy orkiestrator chce inaczej, prosze o znak.
- Dlug Rust: REPIN logiki bitewnej (ruch po ciosie, limit 1 cios na ture, zatrzask _meleeLatched jako przelacznik fazy).
