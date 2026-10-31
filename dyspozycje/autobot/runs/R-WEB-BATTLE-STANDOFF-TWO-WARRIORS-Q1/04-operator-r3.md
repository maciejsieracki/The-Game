STATUS: PASS
DOMAIN: GAME (WEB, gra/src/battle)
TEMAT: R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1
GOAL: Odtworzyc na realnej sciezce zgloszenie "dwoch wojownikow stoi naprzeciw siebie i sie nie atakuje", wskazac przyczyne plik:linia, naprawic minimalnie z testem regresji (czerwony->zielony) i mutacja.
ROLA: Operator (runda 3/5), baza 26cd2d17b (gra/src identyczne z 4d1916f2c)

## Przyczyna (ODTWORZONA w realnym Chromium na bundlu ROBOCZA 4d1916f2c)
gra/src/battle/battleScene.ts `_startBattle` (przed naprawa :3465): `this._battleAwaitingOrders = this._manualMode;`
oraz :3485 `if (!this._manualMode) this._kickoffBattleTurn();`, a `_kickoffBattleTurn` (:3502) zaczyna sie od
`if (!this.started || this.finished || !this._battleAwaitingOrders) return;`.
Gdy gracz nie ma Wodza/Generala, main.ts przekazuje `manualControlAllowed:false` (main.ts:29880/29932/30557/30644/32731/32786),
`_manualCommanderGate=true` (:2617), `_manualMode=false` => `_battleAwaitingOrders=false` => kickoff wychodzi od razu =>
`_beginTurn` NIGDY nie jest wolane: "Tura 0", zegar stoi, jednostki w miejscu. To dokladnie "dwoch wojownikow" (bez Generala);
pre-battle pisze: "Bez Wodza lub Generala mozesz wejsc na pole bitwy, ale walka rozegra sie automatycznie".
Wprowadzone w e06ad53c8 (28.10, "complete non-performance Robocza fixes"): dodano `if (!_manualMode) _kickoffBattleTurn()` i zmieniono
`_battleAwaitingOrders = true` na `= _manualMode`. Nie jest to regres 682a6b9a0/0d31bc4ec (R1/R2 mierzyly inny, wczesniejszy defekt;
ich test omijal `_startBattle`, wolajac `_beginTurn` recznie z `_battleAwaitingOrders:false`).

## Dowod z uruchomienia (live/, Chromium /opt/pw-browsers/chromium, prawdziwe klikniecia: jednostka -> wrog -> BITWA)
Scenariusz: ?playtest=walka, Wojownik (gracz) vs Wojownik (AI) na sasiednich heksach; bundle z origin/main:gra-robocza/Gra-ROBOCZA.html
(zmiana tylko Hastati/Lucznik->Wojownik w presecie + hak window.__bs i liczniki wywolan; logika gry nietknieta).
- PRZED (live/live-BEFORE-robocza-4d1916f2c-R.txt, 45 s, klawisz R dodatkowo): start `manual=false awaiting=false round=0`,
  pozycje u0 31,77 / u-ai-1 36,77 przez cale 45 s, HP 22/22, runda 0, `CALLS [["kick",true,false,false,false]]` (kick bez `begin`).
- PO (live/live-AFTER-fix-R.txt, build vite do scratch poza repo): `CALLS [kick(awaiting=true), begin x3]`, runda 3, kontakt 34,77/35,77,
  HP u0 22->16, wrog 22->19 (obie strony zadaja ciosy).
Zrzuty: live/live-*-end.png, live/pre-battle-choice.png. Harness: live/harness/ (README).
Macierz zmierzona live: bez rozkazu/domyslna doktryna `steady` (gracz bez Generala) 1v1, z/bez klawisza R. NIE_ZMIERZONO live:
bitwa z Generalem (playtest go nie daje) i 2v2 live — pokryte testem jednostkowym (C2 + scenariusze A/B istniejace).

## Naprawa (minimalna) i testy
battleScene.ts `_startBattle`: `this._battleAwaitingOrders = true;` (jak przed e06ad53c8; kickoff sam zeruje flage; reczny start z Generalem
bez zmian: `_manualMode=true`, czeka na rozkazy). Zero zmian w doktrynach / `0d31bc4ec`.
Test: gra/tools/battle-standoff-two-warriors-test.cjs, nowy scenariusz C przez PRODUKCYJNE `_startBattle` (stuby tylko UI/render +
dotychczasowe `_doMove/_doAttack` bo to animacje; bramka tury NIE jest stubowana):
- PRZED naprawa: 2 FAIL (gate-r3-regres-RED-before-fix.txt, EXIT=1); PO: 9/9 PASS (gate-r3-regres-GREEN-after-fix.txt, EXIT=0).
- Mutacja (powrot do `= this._manualMode`): 2 FAIL (gate-r3-mutation-revert-fix.txt, EXIT=1); fix przywrocony.
- Bramki przed/po na tej samej bazie (gate-r3-przed-*.txt / gate-r3-po-*.txt, kazdy z jedna linia EXIT=): standoff 6/6 -> 9/9,
  battle-melee-attack-doctrine EXIT=0/0, bitwa-auto-atak-wielojednostkowy 12/12 -> 12/12, battle-formation-rules EXIT=0/0, diplomacy 148/148,
  war-era-counter 82/82, ring 15/15, battle-manual-orders-routing, attack-move-order, dead-unit-disappearance EXIT=0/0; tsc --noEmit EXIT=0/0.

ZMIANY/COMMIT: gra/src/battle/battleScene.ts (1 linia + komentarz), gra/tools/battle-standoff-two-warriors-test.cjs, run dir (raport, gate-r3-*, live/). SHA: 4f68d98c4; gra-robocza, WERSJE.md, rust-port, src-tauri nietkniete.
BLOKADY: brak. Uwaga dla Evaluatora: `0d31bc4ec` doctrine "dead end" nietkniete; po integracji potrzebny deploy ROBOCZEJ (osobna autoryzacja), bundle w gra-robocza nadal ma defekt.
RUNDY: 3/5
NASTEPNY KROK: Evaluator -> Final Control -> integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
