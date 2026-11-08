STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-MANUAL-BATTLE-BEHAVIOR-Q1
GOAL: Reczna bitwa na oblezone miasto (mur/palisada): tarany do BRAMY, wieza oblezna daje wejscie na mur (piechota wchodzi i bije), lucznicy ostrzeliwuja mur; konnica/rydwany z boku az do wylomu bramy; szarza / atakuj-marszem bez machin = podejscie poza zasieg ostrzalu obroncow i brak ataku na obroncow na koronie.

ZMIANY-COMMIT:
- c2b65751e (baza RED): hak testowy `?rams=N&towers=M&bare=1` (main.ts, tylko hak bitwy), `testBattle.ts` (`addSiegeMachinesCount`, unikalne id machin presetu `atkS*` -- dawniej kolizja `atk0` piechoty z `atk0` machiny), harness `gra/tools/siege-manual-battle-live.cjs`.
- deaf7c268 (naprawa): `gra/src/battle/battleScene.ts`, test `gra/tools/siege-manual-battle-behavior-test.cjs`, rozbudowa harnessu.
- (ten raport + logi gate-* + zrzuty: osobny commit docs, SHA w `git log`.)
- Poza allowlista: zero zmian (`gra-robocza`, `WERSJE.md`, `rust-port`, `src-tauri`, `ai.ts` nietkniete). PUSH nie.

PRZYCZYNY (zmierzone przed naprawa, plik:linia z bazy c2b65751e `battleScene.ts`):
1. `_performPlayerOrder` (~17727): w trybie RECZNYM jednostka gracza z rozkazem `none` stoi; machiny (`isSiegeUnit`) nigdy nie docieraly do bloku "SIEGE MACHINES" (~6088, po `_performPlayerOrder`) -> tarany/wieze z `attack`/`attackMove` szly generyczna sciezka do wroga (naokolo muru), wieza stala. Pomiar PRZED: taran `attackMove` min dystans do bramy 27, `attack` 22, `none` 5 po 30 rundach (brama 400/400).
2. `_advanceToward` (~7812): zachlanny krok, 1 kafel/aktywacje, bez omijania wlasnych jednostek (taran blokowany/zawracany).
3. Wieza (~6128): jechala po wlasnym rzedzie, bez kontroli wolnej korony; piechota nie miala trasy pod wieze (w manualu klimb w ogole nie byl wolany) -> PRZED: `towersAtWall=[]`, 0 na koronie po 36 rundach.
4. Szarza/atakuj-marszem/doktryna: brak jakiejkolwiek reguly strefy ostrzalu -> wrecz wchodzil w zasieg lucznikow (luz -1) i dzieki `_cavalryAction`/`_chargeMoveDest` konnica objezdzala mur i szla wzdluz niego (kol 38, rzedy 24-30).

NAPRAWA (zalozenia bez pytan ABC):
- Jeden punkt ruchu `_doMove`: odmowa kroku, ktory wprowadza jednostke wrecz/konnicy w zasieg ostrzalu (lucznicy z amunicja, zasieg x2 na koronie, wiezyczki muru; Manhattan); odwrot dozwolony; odmowa konczy ruch w turze (brak petli). Obejmuje szarze, atakuj-marszem, doktryne i AUTO.
- Ograniczenie zwalnia: piechota -- wylom (brama/kafel/wieza przy murze/wejscie po wiezy); konnica i rydwany -- TYLKO wylom bramy lub kafla muru (sama wieza ich nie zwalnia). Strzelcy (`primaryRanged` z amunicja) wolni; Hastati z pila = wrecz (ograniczeni).
- `_performSiegeManualOrder` (reczny): tarany/wieze jada same (rozkazy none/attack/attackMove; `move` = wolna wola gracza), piechota przy wiezy wchodzi i od razu bije (`_targetInRange`), idzie pod wieze, wrecz z `attack`/`attackMove` przy zamknietym murze = `_siegeSafeApproach` (najblizszy bezpieczny kafel do celu zamiast ataku na obroncow na koronie); bezczynny strzelec strzela do celu w zasiegu.
- Taran: BFS do kafla PRZED brama (rzad bramy preferowany), wielokrokowo; wieza: BFS pod mur na wolnej koronie; wspolne helpery z AUTO (`_trySiegeTowerClimb`, `_siegeRamTowerStep`).
- Zalozenie: brak zmian R-WEB-PALISADE-BATTLE-WALL-RULES (R1-R4) i SIEGE-TOWER-BREACH-EVERYWHERE (wylom po wiezy dalej ustawia `wallEverBreached`); korona = zywy kafel muru (nie brama).

TESTY:
- tsc `--noEmit`: EXIT=0 (`gate-tsc.txt`).
- Harness zywy (Chromium, `?playtest=oblezenie-duze`, Math.random=mulberry32, render wylaczony na czas biegu, zegar wirtualny): PRZED 0/11 (mury) -- `gate-live-przed.txt`; PO 21/21 (mury 11 + palisada 10) -- `gate-live-po.txt`. Scenariusze: A1 taran->brama (none/attackMove/attack), A2 wieza+piechota->korona, B1 szarza piechoty bez machin (poza ogniem, luz>0, podeszla blisko), B2 konnica, B3 tarany+armia, C1 po rozbiciu bramy armia wchodzi (brak zakleszczenia).
- Test jednostkowy+mutacje `siege-manual-battle-behavior-test.cjs`: PRZED (baza + test) 10 OK / 26 FAIL; PO 36 OK / 0 FAIL (`gate-unit-*.txt`); mutacja prawdziwej funkcji (cofniecie id) czerwona.
- Regresja `gra/tools/*battle|siege|palisade|wall|charge*` bez `live|browser` : PRZED 34 OK / 14 FAIL (48 plikow), PO 37 OK / 12 FAIL (49 plikow, z nowym testem) -- `gate-regresja-*.txt`. 12 FAIL identyczne PRZED i PO (zaleznosc od srodowiska: brak /usr/bin/chromium, brak pliku runow; wall-defenders-bonus-range timeout 150 s). Roznice PRZED/PO to testy niestabilne (matrix, deadlock-exec), nie regresja. Wykryte w trakcie i naprawione: stuby w `battle-attack-move-order-test`/`battle-manual-orders-routing-test` bez `siegeWallCol` (guard `!(>= 0)`).
- Zrzuty Chromium (<= 56 KB sztuka): `zrzuty/przed-*.jpg` i `zrzuty/po-*.jpg` (taran->brama; wieza->mur po 36 rundach; szarza bez machin). PRZED: brama pusta; PO: dwa tarany u bramy.
- NIE_ZMIERZONO: pelna gra z miastem z mapy (tylko preset oblezenie-duze); wiezyczki palisady w C/B scenariuszach tylko jako zrodlo ognia z kodu; bitwa AUTO-batch poza oblezeniem (nietknieta).

BLOKADY: brak. Uwaga: kolizja id `atk0` machin w presecie byla cecha playtestu (naprawiona); w grze z mapy id nie kolidowaly.
RUNDY: 1/5
NASTEPNY KROK: Evaluator R1 (niezalezne uruchomienie harnessu na swiezym buildzie: `node tools/siege-manual-battle-live.cjs <dist> out.json`; po wdrozeniu REPIN Rust `rust-port/renderer/src/battle/**` zanotuje orkiestrator).
DEPLOY-PUSH: NIE WYKONANO
