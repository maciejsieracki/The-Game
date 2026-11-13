STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-DEFEND-RECAPTURE-ATTACK-PRIORITY-Q1
GOAL: AI: wlasne terytorium = miasta ZALOZONE (takze utracone); kolejnosc obrona > odzyskanie > atak; atakowana civ odwoluje WSZYSTKIE armie.
ZMIANY/COMMIT: SHA w komunikacie koncowym (commit tej rundy na galezi worktree). Pliki: gra/src/game/cities.ts, ai-war-home-defense.ts, ai.ts, gra/src/main.ts (stamp tworcy x3, bramka FALA 550), gra/tools/ai-war-defend-home-sim.cjs, ai-home-war-sees-own-land-test.cjs (1 string bramki), NOWY ai-defend-recapture-attack-priority-test.cjs.

POMIAR (baza 92d54adc8)
(a) Miasto nie pamietalo tworcy: tylko foundedByOwner (bool, cities.ts:1009; false po zdobyciu od civ) i capturedFromOwnerId (= OSTATNI poprzedni wlasciciel, nadpisywany przy kazdym przejeciu). Utracone = capturedFromOwnerId===ja (ai-war-home-defense.ts, ai.ts hasLost) -> (1) lancuch A->Y->X gubil miasto, (2) miasto zdobyte przeze mnie i utracone bylo bledne "moje".
(b) Kolejnosc juz P2 obrona -> P1 odbicie -> P3 atak (applyHomeWarPriorities, ai.ts), nakladka po war-allin/kampanii (main.ts tylko przekazuje opts; marsze planowane = tylko czlowiek).
(c) Odwolanie: luki - jednostki z komenda ataku LUB wejscia na DOWOLNE wrogie miasto oraz oblegajace DOWOLNE miasto byly wylaczone z puli; odbicie ograniczone promieniem 16 hexow (armia w marszu dalej nie wracala); tryb "wait" (za slabi) zostawial ofensywe.
(d) Bramka FALA 550 (main.ts ~40837): tylko AKTUALNE terytorium.

ZMIANY
A. cities.ts: City.foundedBy (tworca), cityFounderId, isCityLostOf, stampCityFounderOnCapture. Ustawiane przy zalozeniu (foundCityAt, osadnik) i leniwie przy KAZDEJ zmianie wlasciciela (applyCapturePopulationLoss = bitwa/kapitulacja, annex miasta-panstwa, cesja traktatem, bunt). Zdobycie NIE zmienia tworcy. MIGRACJA: brak pola = fallback capturedFromOwnerId (dotychczasowa definicja); cityFounderId: bez pola i foundedByOwner!==false = biezacy wlasciciel; foundedByOwner===false = nieznany (brak zgadywania). Zmiana formatu zapisu: tylko opcjonalne pole.
B/C. Planer: lostAll przez isCityLostOf; bez limitu odleglosci (stala RECAPTURE_RADIUS nieuzywana); "wait" -> zbiorka w najblizszym wlasnym miescie (nie ofensywa). ai.ts: locked tylko dla ataku w toku oraz wejscia na miasto KONCZACE zagrozenie (utracone lub civ majacej wojsko na mojej ziemi / trzymajacej moje miasto); oblezenie takiego miasta zostaje (decyzja wyjatku), oblezenie cudzego z boku jest odwolane (isRelevantSiege).
D. Tylko AI (gracz bez zmian); miasta-panstwa/barbarzyncy nie objeci (canEngageOwner; stamp wspolny, bez zmiany zachowania).
(d) main.ts: targetNearLostCity - cel w odleglosci <=1 od utraconego miasta jest widoczny jak wlasny teren (mgla).

TESTY
- ai-defend-recapture-attack-priority-test: PO 26/26. Silnik PRZED (BASE_SRC=drzewo 92d54adc8): 8 pass / 9 FAIL (T1 marsz nie zawraca, T2 lancuch, T3, T4 p1, T5, T6, T7) - testy padaja na starym kodzie.
- ai-war-defend-home-test 30/0, ai-fog 9/9, ai-home-war-sees-own-land 4/4 (zmieniony 1 string bramki, nie oslabiony), ai-test 289/0, logic-test 213/213, ai-home-defense-vs-barbarians 46/0, civilian-filter 8/0, ai-city-capture-integration 21, ai-city-recovery 7/0, capital-capture 107/107.
- tsc --noEmit: czyste dla zmian; 3 bledy PRE-EXISTING w src/audio/muzyka-antyczna.ts (Float32Array generic; TS 5.6.3 w piaskownicy) - niezwiazane.
- Nie uruchamiano gry w przegladarce (zmiana logiki AI; zakaz build/dev).

BLOKADY: brak. DECISION_REQUIRED: brak (uzyto istniejacych progow 0.8/0.6, 1.0/0.8, 25%, MAX_AGE 60; brak nowych w ai-params.json).
ZALOZENIA: (1) odbicie bez promienia - armia moze isc przez cala mape (limit wieku 60 tur zostaje); (2) zdobyte miasto ze starego zapisu (foundedByOwner=false, brak foundedBy), utracone, nadal bywa "utracone" wg capturedFromOwnerId - tworcy nie da sie odtworzyc; (3) miasto-panstwo podbite: tworca = id miasta-panstwa, wiec zdobywca nie jest jego tworca.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (ten sam ID).
DEPLOY/PUSH: NIE WYKONANO
