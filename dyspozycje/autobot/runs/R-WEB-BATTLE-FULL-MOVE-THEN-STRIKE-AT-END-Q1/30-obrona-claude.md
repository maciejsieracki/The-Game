STATUS: FAIL (obrona r5/5; jedna bramka czerwona: T5 piechoty -- 2 aktywacje, NIE NAPRAWIONE; po FC FAIL -> LIMIT-5-EXCEEDED, decyzja wlasciciela)
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1
GOAL: odpowiedz na 7 zarzutow Evaluatora r5 (715a88c5e, kandydat cdea121d6): PRZYJMUJE / ODRZUCA z dowodem. Baza: cdea121d6 + merge origin/main (794ec9eda, FALA 744).
ZMIANY-COMMIT: branch R-WEB-FULL-MOVE-r5-obrona; commit = merge origin/main + regeneracja wikiBundle + test T5 (piechota) + sonda (latched, pathFreeVisited, doctrineExempt) + klasyfikator (exempt, pre-latch, enemiesAlive=0, sciezka omijajaca slad). battleScene.ts: BEZ zmian wzgledem cdea121d6 (probe prob fallbacku w _resumeFullMoveLive cofniety -- brak efektu na T5).
  Pliki: gra/tools/battle-pursuit-move-behavior-test.cjs, gra/tools/battle-pursuit-pace-browser-entry.ts, gra/src/data/wikiBundle.json (regeneracja po merge), dyspozycje/autobot/runs/R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1/30-obrona-claude.md.

ODPOWIEDZI NA ZARZUTY EVALUATORA
Z1 (baza/integracja) -- PRZYJMUJE. origin/main byl 794ec9eda (nie 46b845913 z raportu). git merge origin/main: konflikt TYLKO w gra/src/data/wikiBundle.json; rozwiazany przez `git checkout --theirs` + `node tools/bundle-wiki-for-game.cjs` (wynik: "22 rozdz. + 183 haseł"). Po merge: tsc --noEmit = 0 bledow (exit 0, pusty log). Pozostale 5 bramek referencyjnych po merge: NIE ZMIERZONO w tej rundzie.
Z2 (pokrycie mutacyjne piechoty/strzelcow) -- PRZYJMUJE TEST, CZESCIOWO ODRZUCAM ZAMKNIECIE. Dodano T5 (wastedInf == 0 dla nie-konnicy, tury 9-16, 3 ziarna) i T5b (kontrola niepusta) oraz liczenie mutC dla piechoty.
   Wynik na kandydacie: T5 FAIL, wastedInf=2 z infActs=80 (ziarna 1-3, sumarycznie).
   Wynik mutC (RESUME_AFTER_PLAN -> done()): wastedInf=18 (vs 2 na kodzie) -> mutacja dla piechoty WYKRYTA (czerwona). Konnica: wastedActs 3 w mutC, 0 na kodzie.
   Dwa przypadki (oba: latched=true, enemiesAlive 1-2, pathFreeVisited=true, doctrineExempt=false, struckRound=false, moveLeft 1 i 2):
     runda 10, id atk9, mp 3, pole (36,76), moveLeft 2, freeCells 37,76 / 35,76 / 36,75
     runda 12, id atk11, mp 3, pole (42,72), moveLeft 1, freeCells 43,72 / 41,72 / 42,71
   Ziarno dla tych przypadkow: NIE ZMIERZONO (log WASTED_INF nie niesie ziarna; sumaryczny T5 po 3 ziarnach).
   HIPOTEZY ODRZUCONE NA DOWODZIE:
     (a) "doktryna Obrona/Ostrzal" -- ODRZUCAM: doctrineExempt=false w obu przypadkach (wyjscie sondy BPM_DEBUG=1).
     (b) "_resumeFullMoveLive -> _advanceStep nie kontynuuje" -- ODRZUCAM jako przyczyne: probe fallback (po _advanceStep, gdy moveLeft>0 i zywy wrog -> _continueAfterStrike) dal IDENTYCZNE liczby (wastedInf=2, infActs=80, SUMA allPool 315). Zmiana cofnieta.
   HIPOTEZA NIEPOTWIERDZONA: aktywacja piechoty konczy sie na sciezce poza _resumeFullMoveLive (np. wczesniejszy `done` w _advanceStep l.~8580-8590: brak celu `if (!target) done()` lub `_canAttackFrom` bez sasiada `else done()`). NIE ZWERYFIKOWANO -- wymaga sledzenia stosu w sondzie.
   Decyzja dla FC: albo kolejna runda (brak -- r5/5), albo przyjecie T5 jako czerwonej bramki z zapisem wyjatku wlasciciela.

Z3 (zakres testow: tylko skip, jeden sklad) -- CZESCIOWO ODRZUCAM.
   - "tryb reczny gracza": ODRZUCAM jako zarzut wobec testu -- wyjatek ABC A (DODATEK 6 pkt b) wylacza regule dla recznego rozkazu; _fullMoveRuleActive (battleScene.ts) zwraca false dla jednostek gracza w _manualMode bez doktryny AUTO. Test nie ma tu czego mierzyc.
   - "doktryny Obrona/Ostrzal" i "uciekajacy": wyjatki ABC A; w sondzie dodano doctrineExempt (klasyfikator: 'exempt', poza miara). NIE ZMIERZONO w realnej bitwie (brak testu z doktryna Obrona/Ostrzal w scenariuszu).
   - "animowany AUTO": NIE ZMIERZONO. Tryb skip nie zostal porownany z animowanym AUTO; nie twierdze, ze sciezka logiki jest identyczna.
   - "oblezenie z murem", "obronca z konnica/strzelcami": NIE ZMIERZONO.

Z4 (battle-winning-army-* nie istnieja) -- ODRZUCAM jako wymog kodu. Sprawdzone: `git ls-tree -r --name-only origin/main | grep -c winning-army` = 0; to samo dla HEAD = 0. Nie tworze tych plikow (nie sa wymagane przez zadna zmiane kodu). Pokrycie FALI 731: pursuit-move (BPM), pace-latch, line-advance-uniform, pace-equal-line-live (zob. TESTY).

Z5 (brak PNG z zywej bitwy) -- ODRZUCAM. Kryterium (g) DODATKU 1 brzmi "log/zrzut"; log zdarzen z realnego silnika w Chromium istnieje: wyjscie battle-full-move-strike-test (code): "ok (a) piechota: ruch => cios => ruch dalej po zderzeniu", "ok (a) konnica...", "ok (a) strzelcy: ruch po strzale po zderzeniu", "ok (b) max JEDEN cios na aktywacje", "ok (c) przed pierwszym zderzeniem brak sekwencji ruch => cios". PNG nie wykonano.

ZMIERZONO (surowe wyjscia, ta sesja, worktree R-WEB-FULL-MOVE-r5-obrona):
- tsc --noEmit: exit 0, 0 linii bledow.
- battle-full-move-strike-test BFM_PART=code: SUMA firstContact 6, maxStrikes inf/cav/ranged 1/1/1, preMoveThenHit 0, preHitThenMove 0, postMoveThenHit 100, postHitThenMoveRanged 81, msmInf 48, msmCav 14, doubleStrike 0, mpUsed 534/906, mpUnexplained 0 -> 7/7 pass.
- battle-pursuit-move-behavior-test BPM_PART=code (po zmianach klasyfikatora i sondy): SUMA allPool 315, freeRatio 1 (147/147), wastedActs 0, pingpong 0, arbPathCav 0, blockedActs 8, mutSensitive 16, infActs 80, wastedInf 2, preLatch 0, exempt 0 -> T1 ok, T2 ok, T3 ok (1.000 >= 0.80), T4 ok, T5 FAIL (wastedInf=2), T5b ok, A1-A4 ok, A6 ok, A7 ok, A8 ok, A5 (mutacja miary) ok -> 12/13.
- battle-pursuit-move-behavior-test BPM_PART=mutC: SUMA wastedActs 3 (konnica), wastedInf 18 (piechota), freeRatio 0.887 -> mutacje wykryte 3/3 (T4 i T5 czerwone po mutacji).
- Chromium: uzyty `require("playwright")` + vite z gra/; nie pobierano przegladarki.
- Dlugosc wlasnych przebiegow: ok. 3 min na przebieg BPM; zadne polecenie nie przekroczylo 590 s; NIE uzyto run_in_background.

NIE ZMIERZONO w tej rundzie:
- battle-doctrine-live-r3/r4 i battle-large-mixed-doctrine-matrix (kandydat vs 807ecebdd/79abbf0bf): NIE ZMIERZONO (wymagane przez DODATEK 6 pkt 3 -- nie wykonane, brak czasu w rundzie).
- battle-pace-latch, battle-line-advance-uniform, battle-pace-equal-line-live: NIE ZMIERZONO po merge.
- 5 bramek referencyjnych po merge (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6): NIE ZMIERZONO.
- git diff --check po merge: NIE ZMIERZONO.
- Determinizm x3 (skrot stanu) w tej rundzie: NIE ZMIERZONO (strike test ma skrot w trybie det, nieuruchomiony).

BLOKADY: T5 czerwony (2 aktywacje piechoty z wolna droga omijajaca slad i zywym wrogiem, 1-2 MP niewykorzystane). Przyczyna niezidentyfikowana; probe fallback nie usunal jej. Nie naprawiono.

RUNDY: 5/5 (ostatnia). Po FAIL w FC: LIMIT-5-EXCEEDED, wymagana decyzja wlasciciela.

NASTEPNY KROK (dla orkiestratora/FC):
1. Decyzja: (A) T5 jako znana, zapisana pozostalosc (2/80 aktywacji piechoty) -> PASS-WITH-NOTES, albo (B) nowy temat na zrodlo T5 (sledzenie stosu done() w _advanceStep i w sciezce piechoty; ziarno w logu).
2. Integracja: merge tej galezi do main dopiero po decyzji 1; wikiBundle juz regenerowany po merge 794ec9eda.
3. Przed integracja: 5 bramek, battle-doctrine-live r3/r4 + matrix vs baza (NIE ZMIERZONO).
UWAGI-DLA-ORKIESTRATORA: SHA aa0d32275 w dispatchu to linia dyspozycji, nie kod (potwierdzone wczesniej przez Evaluatora). Gałąź dispatchow nie jest baza kodu. Test battle-pursuit-move-behavior-test zapisuje wyniki tylko na stdout; nie modyfikuje repo (sprawdzone: git status po przebiegach pokazuje tylko pliki tematu).
DEPLOY/PUSH: NIE WYKONANO
