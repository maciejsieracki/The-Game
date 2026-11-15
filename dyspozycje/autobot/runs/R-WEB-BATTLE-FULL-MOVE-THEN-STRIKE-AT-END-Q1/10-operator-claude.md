STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1
GOAL: pelny ruch, cios przy dojsciu, ruch dalej; jeden cios na ture; po pierwszym zderzeniu wrecz (DODATEK 6, r5/5, zarzut 6 FC)
ZMIANY/COMMIT: baza = kandydat Obrony r4 be9bed4fc + merge origin/main 79abbf0bf (wikiBundle regenerowany); pliki: gra/src/battle/battleScene.ts, gra/tools/battle-pursuit-move-behavior-test.cjs, gra/src/data/wikiBundle.json, docs/PORADNIK-GRACZA/10-walka.md (par. 60.5), docs/encyklopedia/pojecia/ruch-i-cios-w-bitwie.md

UWAGA BAZA: SHA aa0d32275 z dispatchu to linia dyspozycji (nie kod gry; origin/main go nie zawiera). Zgodnie z DODATKIEM 6 pracowano na be9bed4fc + merge origin/main (79abbf0bf).

MECHANIZM (zarzut 6): _resolveAutoBatchMovement konczyl aktywacje done(), gdy krok zamrozonego planu byl zajety albo plan byl krotszy niz pula MP. Dodano _resumeFullMoveAfterPlan (zywa kontynuacja po zatrzasku wzwarcia): cios jesli wrog w zasiegu i jednostka jeszcze nie bila; inaczej ruch ku najblizszemu wrogowi; po ciosie _continueAfterStrike (nie ponawia ciosu, pomija pola z tej aktywacji). Wyjatki (decyzja ABC A): doktryny Obrona/Ostrzal, reczny rozkaz gracza, uciekajacy, oblezenie z murem. Dodatkowo: (a) _cavalryAction dziedziczy slad pol z tej rundy (moveTrail) zamiast czystego - brak ping-ponga po wznowieniu; (b) ostatni krok szarzy (_bestChargeStepKey) po zatrzasku nie konczy aktywacji, tylko wznawia; (c) piechota: lastAutoMoveFrom z moveTrail. Dodano pole struckTargetId.
Diagnoza na danych: ziarno 1, runda 12, atk16: jednostka weszla w slepy zaulek (maneuver best=null), ostatni krok wrocil na pole startowe i skonczyl z 5/7 MP przy 3 wolnych polach - to nie byla blokada fizyczna.

TESTY (surowe wyjscie, Chromium + vite, tryb Pomin):
- battle-pursuit-move-behavior-test (BPM_PART=code): ziarna 1/2/3: freeRatio 1/1/1 (147/147), wastedActs 0/0/0, pingpong 0; T1,T2,T3,A1-A6 ok; nowa T4 (wastedActs==0) ok. Przed zmiana (r4) ziarno 1: wastedActs 1 (12|atk16, ml=5, 3 wolne pola); baza przed r5 ziarno 3: wastedActs 2 (freeRatio 0.843).
- mutacja mutC (RESUME_AFTER_PLAN -> done(), stary blad): wastedActs 4, freeRatio 0.85 => MUTACJA WYKRYTA (T4 czerwony). mutA/mutB tego testu nie uruchamiane w r5 (czas; markery bez zmian).
- battle-full-move-strike-test: code 7/7 (msmInf 48, msmCav 14, postMoveThenHit 100, postHitThenMoveRanged 81, doubleStrike 0, max 1 cios inf/cav/ranged, mpUnexplained 0 z 226 aktywacji, preMoveThenHit/preHitThenMove 0); mutA, mutB, mutC wykryte (M1/M2/M3 + M3 strzelcy); determinizm x3: skrot d5c8bff72c1310cb905eb716afefb93a trzykrotnie.
- battle-pace-latch-test: 5/5 (mutacja MELEE_LATCH wykryta); battle-line-advance-uniform-test: 0 FAIL; battle-pace-equal-line-live-test: 23 pass, 0 fail.
- Bramki: tsc 0; logic 213/213; tech-tree 20/20; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0. git diff --check czysty.
- battle-winning-army-*: w tym worktree brak plikow o tej nazwie (NIE ZMIERZONO; pokrycie przez pursuit-move + pace-latch).

NIE ZMIERZONO / ZASTRZEZENIA:
- battle-doctrine-live-r3: przy domyslnych limitach padl (click START WALKI >30 s, renderer programowy). Z wydluzonymi limitami (kopia tymczasowa, usunieta; wait do rundy 5 zamiast 8) bitwa 28 vs 28 przeszla 5 rund: 379 akcji, 50 strzalow, 272 ruchy konnicy, ale test konczy sie FAIL: 3x pageerror "Unexpected token '<'" (podejrzenie: zasoby sidecar serwowane jako HTML w serwerze dev; zrodlo NIE ustalone, nie porownane z baza). Porownanie z baza 807ecebdd oraz doctrine-live-r4 i large-mixed-doctrine-matrix: NIE ZMIERZONO (limit 590 s na polecenie + zakaz procesow w tle; jedno uruchomienie r3 trwa 5-8 min). Do wykonania przez Evaluatora/FC na kandydacie i bazie.
- Zrzut Chromium z zywej bitwy AUTO: dowodem jest log zdarzen testu battle-full-move-strike-test (ruch=>cios=>ruch, realny silnik w Chromium); osobny PNG nie wykonany.

ZALOZENIA DO POTWIERDZENIA: (1) przelaczenie globalne dla bitwy przy pierwszym zderzeniu wrecz; (2) strzelcy po strzale podchodza tylko na zasieg; (3) wznowienie po planie dla piechoty omija tylko pole z ostatniego kroku (nie cala sciezke).
BLOKADY: brak blokad kodu; punkty powyzej NIE ZMIERZONO.
RUNDY: 5/5 (ostatnia; po FAIL w FC LIMIT-5-EXCEEDED).
DLUG RUST: REPIN logiki bitewnej (_resumeFullMoveAfterPlan, _continueAfterStrike, slad cavTrail z moveTrail).
UWAGI-DLA-ORKIESTRATORA: SHA aa0d32275 w zadaniu to linia dyspozycji, nie kod; dispatch zaleca setsid/nohup, zadanie zakazuje procesow w tle - wybrano zakaz.
NASTEPNY KROK: Evaluator/FC: uruchomic doctrine-live r3/r4 i large-mixed matrix na kandydacie i bazie 807ecebdd.
DEPLOY/PUSH: NIE WYKONANO
