STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/src/battle)
TEMAT: R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1
GOAL: Odtworzyc zgloszenie "dwoch wojownikow stoi naprzeciw siebie i nie atakuje", wskazac pierwszy zly commit i przyczyne plik:linia; naprawic tylko po pomiarze.
ROLA: Final Control (runda 2/5)
BADANY SHA: 6521be62c (potomek bazy 4d1916f2c; NIE jest potomkiem c8f30d562 -- dwie rownolegle galezie z tej samej bazy)

## Werdykty zarzutow
1. Bisect 2v2 gap3 na 7fdc191ac: ODDAL. Log gate-standoff-parent-7fdc191ac-r2.txt (EXIT=1): 2v2 gap3 = 6 ciosow, kontakt (minDist 1), czerwony tylko przez prog >=10. Spojne z raportem: pierwszy commit z ZEREM ciosow = 682a6b9a0; na rodzicu wolniej, nie zero.
2. Przyczyna plik:linia: ODDAL. Zweryfikowane: 682a6b9a0 battleScene.ts:7672 `if (this._canAttackFrom(...)) { done(); return; }`; HEAD battleScene.ts:7721-7726 zadaje cios (_pickAdjacentTargetByPriority + _doAttack). Galaz `steady` (HEAD :17222-17225) wola _advanceStep, ktory na HEAD uderza z sasiedztwa, wiec nie jest przyczyna.
3. Brak sciezki kolejki rozkazow/UI/Chromium: ODDAL jako luka NIE_ZMIERZONO, nie defekt. Na HEAD zadna zmierzona sciezka nie odtwarza stania (wlacznie z prawdziwym przelaczeniem manual->auto). Dalszy pomiar wymaga dokladnych krokow wlasciciela (typy jednostek, build, liczba tur) -- dispatch pkt 4 zabrania zgadywania poprawki. To informacja do orkiestratora, nie NAPRAW.
4. Brak naprawy/mutacji: ODDAL. Mutacja wykonana przeze mnie: przywrocenie wczesnego wyjscia 682a6b9a0 w miejscu 7721 -> 6/6 FAIL; bez mutacji 6/6 PASS. Produkt bez zmian, bo defekt na HEAD nie wystepuje (naprawiony wczesniej przez 0d31bc4ec).
5. Pelny suite przed/po i Chromium: ODDAL. gra/src identyczny z 4d1916f2c (`git diff --name-only 4d1916f2c 6521be62c` = tylko gra/tools/battle-standoff-two-warriors-test.cjs i pliki runu), wiec przed = po z konstrukcji.
Liczba NAPRAW: 0 -> brak FAIL.

## Samodzielna weryfikacja (swiezy npm ci --ignore-scripts w gra/)
- battle-standoff-two-warriors-test @6521be62c: EXIT=0, 6/6 PASS.
- Mutacja 7721: 6/6 FAIL (gra/src przywrocone przez git checkout).
- tsc --noEmit: EXIT=0 (TSC=0).
- battle-melee-attack-doctrine-test: EXIT=0.
- Logi gate-*-r2.txt maja linie EXIT=.
- Allowlista: brak zmian w gra/src, WERSJE.md, rust-port, src-tauri, gra-robocza, auto-improvements.ts.
- gra/node_modules usuniete.

## Integracja
Do integracji: 6521be62c (+ c8f30d562 dla artefaktow r1: 01-operator-r1.md, gate-*.txt bez -r2). Merge c8f30d562 + 6521be62c konfliktuje tylko w gra/tools/battle-standoff-two-warriors-test.cjs -- rozstrzygnac biorac wersje z 6521be62c (nadzbior, +6 linii komentarza). Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (gra/ vs rust-port; baza wspolna 4d1916f2c nie jest przodkiem parity-v2, merge-base f4c89d008); integrowac do main PRZED/niezaleznie od parity-v2, bez zmian wymuszajacych kolejnosc.

BLOKADY: Zgloszenie wlasciciela nie odtworzone na HEAD; potrzebne dokladne kroki/build wlasciciela albo zamkniecie tematu jako "nie odtworzono, zabezpieczone testem".
RUNDY: 2/5 (FC), brak FAIL
NASTEPNY KROK: orkiestrator: zapytac wlasciciela o kroki/build albo zamknac temat; integracja testu regresyjnego.
DEPLOY/PUSH: NIE WYKONANO

---

# Final Control -- RUNDA 3/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/src/battle)
TEMAT: R-WEB-BATTLE-STANDOFF-TWO-WARRIORS-Q1
GOAL: Naprawic zgloszony standoff dwoch Wojownikow (nie atakuja sie nawzajem) na realnej sciezce _startBattle.
BADANY SHA: 8ce953831 (rodzic 4f68d98c4 = fix; baza 26cd2d17b)

## Werdykty zarzutow
Zarzuty Evaluatora: [] (brak). Obrona: null. Zero NAPRAW -> PASS.

## Weryfikacja wlasna (swiezy worktree, npm ci)
- Allowlista: poza katalogiem runu zmienione tylko gra/src/battle/battleScene.ts (jedna linia kodu :3471 + komentarz) i gra/tools/battle-standoff-two-warriors-test.cjs. Brak gra-robocza, WERSJE.md, rust-port, src-tauri, auto-improvements.ts. git diff --check czysty.
- Przyczyna potwierdzona w kodzie: _kickoffBattleTurn (:3507) wychodzi na !_battleAwaitingOrders, wiec przy _manualMode=false _beginTurn nigdy nie startowal. Dla _manualMode=true wartosc bez zmian (true).
- Bramki (EXIT=0 kazda): battle-standoff-two-warriors (PASS), melee-attack-doctrine, bitwa-auto-atak-wielojednostkowy 12/12, formation-rules, manual-orders-routing, attack-move-order, dead-unit-disappearance, diplomacy 148/0, war-era-counter 82/0, unit-owner-emblem-ring-civ-color 15/0, tsc --noEmit EXIT=0.
- Mutacja (:3471 -> = this._manualMode): standoff-test EXIT=1, 2 FAIL; plik przywrocony, status czysty. gra/node_modules usuniete.

## Uwagi (bez zarzutow)
1. Chromium/live nie powtorzony przeze mnie; opieram sie na live-BEFORE/AFTER w runie (przed: runda 0, 31/36 bez ruchu; po: runda 1+, kontakt 34/35), spojnych z testem i kodem.
2. Test stubuje UI/render i _doMove/_doAttack; bramka tury _startBattle->_kickoffBattleTurn->_beginTurn jest produkcyjna.
3. NIE_ZMIERZONO live: bitwa z Generalem i 2v2 (pokryte testem jednostkowym).
4. Zalozenie (nie potwierdzenie wlasciciela): scenariusz = gracz bez Wodza/Generala (manualControlAllowed:false). Wprowadzone przez e06ad53c8.
5. gra-robocza zawiera blad do czasu deployu (osobna autoryzacja).

## Integracja
SHA koncowy do integracji: 8ce953831 (kod: 4f68d98c4) plus commit tego raportu FC. Galaz zrodlowa to potomek bazy 4d1916f2c (merge-base z origin/rust-port/parity-v2 = f4c89d0), rownolegla do parity-v2 (44a3e9ccf, 773 commity przed). Zmiana dotyka tylko gra/src/battle i gra/tools, wiec nie koliduje z rust-port/src-tauri; kolejnosc wzgledem parity-v2 dowolna, przy cherry-pick sprawdzic konflikt w battleScene.ts :3465-3475.

DEPLOY/PUSH: NIE WYKONANO
RUNDY: 3/5
NASTEPNY KROK: integracja orkiestratora, potem READY_FOR_DEPLOY, osobna autoryzacja deploy.
