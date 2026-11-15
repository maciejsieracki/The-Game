STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-RESIDUAL-INFANTRY-Q2
GOAL: T5 (battle-pursuit-move-behavior-test) zielony: piechota/strzelcy po zderzeniu nie tracą ruchu przy wolnej drodze i żywym wrogu (bez wyjątku doktryny).

ZMIANY/COMMIT: allowlista: gra/src/battle/battleScene.ts, gra/tools/battle-pursuit-move-behavior-test.cjs, ten raport. Baza kodu: origin/main 9cbadc54a (FALA 745). UWAGA: kandydat z dispatchu bd239cf4f to gałąź rejestru BEZ kodu FULL-MOVE (nie zawiera cdfdb274d ani narzędzi testowych); pracowano na 9cbadc54a, który zawiera cdfdb274d, zgodnie z "BAZA KODU = aktualny origin/main po FALI 745".

PRZYCZYNA (ZMIERZONA sondą FMDBG na wyjściach `_rangedForwardStep`): 2/80 aktywacji to STRZELCY (atk9, atk11 = Łucznik; Hastati nie marnują ruchu). Aktywacja kończyła się w `_rangedForwardStep` na gałęzi `!stepKey` ("walled in"): `_bestForwardStep` akceptuje tylko krok skracający oś kolumn albo odległość wierszy, więc przy wolnym polu bocznym/okrężnej drodze zwraca null i strzelec traci resztę puli (ml1/ml2), mimo że istnieje ścieżka BFS do pozycji strzału omijająca ślad aktywacji. Po pierwszej poprawce ujawniła się druga warstwa: krok wybrany "naprzód" łamał linię formacji (`_rangedFiringStepStaysBehindMelee`, doktryna steady), co też kończyło aktywację (3 aktywacje po zmianie trajektorii).

POPRAWKA (tylko gałąź strzelców w `_rangedForwardStep`, aktywna wyłącznie gdy `_fullMoveRuleActive(ru)`, czyli po zderzeniu wręcz, bez doktryn Obrona/Ostrzał w tej ścieżce, bez ręcznych rozkazów, bez oblężenia z murem): kandydat kroku jest filtrowany przez regułę linii (`stepAllowed`); gdy prosty krok jest null albo niedozwolony, jednostka idzie pierwszym krokiem najkrótszej ścieżki BFS do pozycji strzału (`_firstStepAlongPathToAttack`) z `allowFirstStep` = pole spoza śladu aktywacji (`moveTrail`, zakaz ping-ponga) i dozwolone przez linię. Przed zderzeniem (reguła nieaktywna) zachowanie bez zmian (kod ścieżki identyczny: null/niedozwolony => done()). Konnica, `_resumeFullMoveLive`, `_continueAfterStrike`, FALA 731 i równy tryb wejścia nietknięte. Marker mutacji: `/*RANGED_BFS_FALLBACK*/`.

TEST (gra/tools/battle-pursuit-move-behavior-test.cjs): dodana mutacja mutD (`/*RANGED_BFS_FALLBACK*/` -> `&& false`) i asercja "MUTACJA RANGED_BFS_FALLBACK wykryta (T5 czerwony)". Pozostałe asercje bez zmian (T3 próg 0,80 bez zmian).

TESTY (liczby z surowego wyjścia, worktree z `npm ci`):
- battle-pursuit-move-behavior-test pełny: 13/13 pass, mutacje wykryte 6/6. T5: wastedInf=0 (infActs=73, ziarna 1,2,3); przed zmianą wastedInf=2 (infActs=80). T3 freeRatio=1 (84/84), wastedActs=0. mutD: wastedInf=2 (czerwony), mutC (stary błąd): wastedInf=11, wastedActs=3.
- Determinizm: dwa kolejne przebiegi `BPM_PART=code` dają identyczny skrót "code SUMA" (md5 847f927e...), x2 (plus pełny przebieg tą samą sumą wastedInf=0).
- battle-full-move-strike-test: 8/8 pass, mutacje 4/4 (M1-M3 + M3 strzelcy), det x3 identyczny (d5c8bff7...).
- battle-pace-latch-test: 5/5, mutacja MELEE_LATCH wykryta. battle-line-advance-uniform-test: 0 FAIL. battle-pace-equal-line-live-test: 23 pass, 0 fail.
- tsc --noEmit: 0 błędów (exit 0).
- logic-test 213/213; tech-tree-test 20/0; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0.
- git diff --check: czysto.
- battle-doctrine-live-r4-test: kandydat 4 PASS + 1 FAIL ("no browser page or console errors": "Unexpected token '<'" x3, sidecary zwracające HTML); baza (9cbadc54a) identycznie 4 PASS + 1 FAIL — dług bazowy, nie naprawiany (poza zakresem).
- battle-large-mixed-doctrine-matrix-test: kandydat i baza "36 scenarios, 0 red conditions". Różnica w 2 z 36 wierszach (steady lines=2, prio 0/1): łucznik idle 1 i 2 na bazie -> 0 na kandydacie, ruchy łuczników wzrosły (8->14, 4->14); brak pogorszenia. Test zapisuje 01-matrix.json w repo: przywrócony `git checkout`, NIE commitowany.
- doctrine-live r3 i line-advance-browser: nie uruchamiane (znany dług bazowy, wg dispatchu).

BLOKADY: brak. Uwaga procesowa: kandydat bd239cf4f z dispatchu nie zawierał kodu; użyto origin/main 9cbadc54a.

UWAGI-DLA-ORKIESTRATORA:
- Dług Rust REPIN: ruch strzelców po zderzeniu (BFS po linii formacji przy zablokowanym prostym kroku) w `rust-port` nie odwzorowany; do dopisania do listy REPIN (rust-port nie ruszany).
- Zmiana nie zmienia opisu reguły dla gracza (reguła "pełny ruch" bez zmian), więc docs/encyklopedia, PORADNIK-GRACZA i wikiBundle.json nie ruszane.
- Pozostałe aktywacje strzelców z `lineAllows=false` bez dozwolonej ścieżki nadal kończą się utratą ruchu (twarda blokada formacji steady); w próbie 3 ziarna x tury 9-16 nie wystąpiło, ale nie jest to udowodnione dla innych ziaren (NIE_ZMIERZONO poza ziarnami 1-3).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) na SHA z tego commita.
DEPLOY/PUSH: NIE WYKONANO
