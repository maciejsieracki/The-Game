STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-THEN-STRIKE-AT-END-Q1
GOAL: do pierwszego zderzenia wręcz równy tryb wejścia; od zderzenia pełny ruch, cios przy dojściu, ruch dalej ku następnemu wrogowi, jeden cios na jednostkę na turę, brak dokąd iść = reszta ruchu przepada (DODATEK 4 + 5 + 5a + 5b).

BAZA KODU: origin/main 807ecebdd (NIE 989eb0ee — to czubek gałęzi dispatchów, inna linia historii; kod bazowy wzięty z origin/main). Runda 4/5, Operator Sonnet.

ZMIANY/COMMIT (allowlista):
- gra/src/battle/battleScene.ts: `_fullMoveRuleActive` (reguła aktywna dopiero po zatrzasku `_meleeLatched`; nie w oblężeniu z murem; nie dla rozkazów ręcznych gracza; nie dla doktryn Obrona/Ostrzał), `_strikeOnArrival` (cios na dojściu w `_advanceStep` x2 i w manewrach konnicy `_cavManeuverStep`/`_cavDirectedManeuverStep`), `_continueAfterStrike` (reszta puli ku NASTĘPNEMU wrogowi — najbliższy osiągalny, bez drugiego ciosu, bez wracania na pola z tej rundy `moveTrail`), limit "jeden cios na turę" w `_doAttack` (`struckRound`), `_resumeFullMoveLive` (zamrożony cel zginął w tej samej fali — żywa kontynuacja zamiast utraty ruchu). Planer (`_snapshotAutoBatchIntents`) bez zmian: plan = ruch + cios na końcu ścieżki, kontynuacja po ciosie jest żywa.
- gra/tools/battle-full-move-strike-test.cjs (NOWY): test realnej bitwy AUTO w Chromium + 3 mutacje + determinizm.
- gra/tools/battle-pursuit-pace-browser-entry.ts: sonda końca aktywacji (`ends`), licznik `seq`, pola zdarzeń.
- gra/tools/battle-pursuit-move-behavior-test.cjs: miara T3 (5b) + test autentyczności blokady + mutacja miary; seedy 1,2,3.
- docs/encyklopedia/pojecia/ruch-i-cios-w-bitwie.md (nowe), docs/encyklopedia/indeks.md, docs/PORADNIK-GRACZA/10-walka.md §60.5, gra/src/data/wikiBundle.json (regeneracja `node tools/bundle-wiki-for-game.cjs`).
Bez zmian: WERSJE.md, manifest, rust-port, próg T3 (0,80).

MECHANIZM REGRESJI T3 (r1-r3): cios kończył aktywację z niewykorzystaną pulą, a zamrożony plan konnicy tracił cios/ruch gdy cel ginął w tej samej fali. Teraz: po ciosie ruch trwa; gdy zamrożony cel zginął — `_resumeFullMoveLive`.

TESTY (surowe wyjście):
- tsc --noEmit: exit 0. git diff --check: czysty.
- battle-full-move-strike-test (ziarna 1,2,3 + 3 mutacje + det x3): "6/6 pass, mutacje wykryte 3/3". Liczby: msmInf=63, msmCav=25 (ruch=>cios=>ruch), maxStrikes<=1 dla piechoty/konnicy/strzelców, doubleStrike=0, preMoveThenHit+preHitThenMove=0 przed zderzeniem, postMoveThenHit=122. Mutacje: M1 (bez limitu) doubleStrike=23; M2 (reguła przed zderzeniem) preHitThenMove=10; M3 (cios kończy aktywację) msm=0. Determinizm: skrót zdarzeń identyczny x3 (4d61c611...).
- battle-pursuit-move-behavior-test BPM_PART=code seedy 1,2,3: T1 ok (arbPathCav=0), T2 ok (pingpong=0), T3 freeRatio=0.85 (119/140; seed1 0.14 przy puli 7, seed2 0.94, seed3 0.84) >= 0.80; A1-A4 (autentyczność blokady) ok; mutacje PATH_RESERVE, CAV_TRAIL i miary (każda niewykorzystana = zablokowana) wykryte.
- battle-pace-latch-test 5/5 + mutacja wykryta; battle-line-advance-uniform-test 0 FAIL; battle-pace-equal-line-live-test 23 pass 0 fail.
- Bramki: logic 213/213, tech-tree 20/20, research ALL GREEN, unit-replace 21/21, combat OK, unit-power 6/0, map-field-battle 24/0, mgla-sciezka-inwariant 41/1 (wynik bazowy, dług znany).
- battle-large-mixed-doctrine-matrix: 36 scenariuszy, 0 red conditions (plik evidence zmieniony przez test cofnięty).
- battle-doctrine-live-r3/r4: NIE ZMIERZONO — pada na kliknięciu UI harnessu world-map także na czystej bazie origin/main (zweryfikowane dla r4; r3 timeout 270 s).

MIARA T3 (5b): z miary wypada aktywacja, w której stan sceny na końcu (sonda `ends`) dowodzi blokady fizycznej (brak wolnego pola przyległego poza polami odwiedzonymi w tej aktywacji, albo brak ścieżki do pozycji ciosu) oraz aktywacja po ciosie stojąca przy następnym wrogu. Jednostka z wolną drogą, która stoi, nadal obniża miarę (A4). Pula i wykorzystanie liczone w punktach ruchu.

ZAŁOŻENIA DO POTWIERDZENIA: (1) przełączenie globalne, przy pierwszym zderzeniu wręcz którejkolwiek pary (istniejący zatrzask `_meleeLatched`); (2) cios na dojściu nie kosztuje ruchu; (3) strzelcy po strzale podchodzą tylko na zasięg następnego celu; doktryny Obrona/Ostrzał po ciosie nie maszerują; (4) "tura" = jedna aktywacja w rundzie bitwy (`struckRound === roundNo`); (5) następny cel = najbliższy osiągalny wróg inny niż właśnie uderzony; (6) ręczne rozkazy gracza i oblężenie z murem bez zmian.

BLOKADY: brak.
UWAGI-DLA-ORKIESTRATORA: (a) BAZA w zadaniu wskazywała 989eb0ee (gałąź dispatchów) — pracowano na origin/main 807ecebdd; (b) brak zrzutu ekranu Chromium (NIE ZMIERZONO) — dowodem jest log zdarzeń realnej bitwy AUTO (seq ruch/cios) w teście; (c) battle-doctrine-live-r3/r4 niewykonalne w tym środowisku (dług bazowy); (d) dług Rust: REPIN logiki bitewnej; (e) w scenariuszu testowym faza przed zderzeniem to 1 runda (strzały pila), więc asercja "przed zderzeniem" jest słaba bez mutacji M2.
RUNDY: 4/5
NASTĘPNY KROK: Evaluator, potem Obrona, Final Control.
DEPLOY/PUSH: NIE WYKONANO
