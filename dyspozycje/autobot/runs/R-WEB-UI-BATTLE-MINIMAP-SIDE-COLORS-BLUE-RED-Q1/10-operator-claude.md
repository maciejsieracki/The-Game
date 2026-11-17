# R-WEB-UI-BATTLE-MINIMAP-SIDE-COLORS-BLUE-RED-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI bitwy, minimapa)
TEMAT: R-WEB-UI-BATTLE-MINIMAP-SIDE-COLORS-BLUE-RED-Q1
GOAL: znaczniki jednostek na minimapie bitwy wg strony gracza: gracz niebieski (BATTLE_PLAYER #3a6ad0), przeciwnik czerwony (BATTLE_ENEMY #c84040); bez zmiany ramki widoku i innych elementów.
ZMIANY-COMMIT: commit na gałęzi roboczej (SHA w polu sha wyniku). Allowlista: gra/src/battle/battleMinimap.ts, gra/src/battle/battleScene.ts (import + jedno wywołanie), gra/tools/battle-minimap-side-colors-test.cjs (nowy), dyspozycje/autobot/runs/R-WEB-UI-BATTLE-MINIMAP-SIDE-COLORS-BLUE-RED-Q1/10-operator-claude.md.

## Stan wyjściowy (zmierzone na 9bc85fef1)
- battleScene.ts `_collectMinimapData` już kolorował znaczniki przez `this._isPlayerSide(ru.side) ? BATTLE_PLAYER : BATTLE_ENEMY`, a `_isPlayerSide` = `side === _playerControlSide()` (= `_deployPlayerSideOpt`). Czyli zachowanie z GOAL było już w kodzie przed tym tematem; zmiana widocznych kolorów nie jest potrzebna.
- Brak legendy i brak tooltipa minimapy w kodzie (grep po `legend`/`legenda` w battleScene.ts i battleMinimap.ts: 0 trafień). Kryterium „legenda/tooltip zgodne” = NIE ZMIERZONO (nie ma czego zgodnić).
- Dispatch (wersja w origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0, katalog R-WEB-UI-BATTLE-MINIMAP-SIDE-COLORS-BLUE-RED-Q1) jest czytelny. DODATEK orkiestratora (00-dispatch-DODATEK-claude.md) NIE istnieje w żadnej gałęzi dla tego tematu. Lukę rozstrzygnięto założeniem: zakres wg GOAL/KRYTERIA/ALLOWLISTY z 00-dispatch.md.
- Baza: 9bc85fef1 zawiera SIDE3D (commit a7f0ad69 / 9bc85fef1), więc warunek „START PO SIDE3D” jest spełniony.

## Zmiana
1. battleMinimap.ts: nowa czysta funkcja `minimapUnitColor(side, playerSide, playerColor, enemyColor)` (bez DOM/THREE).
2. battleScene.ts `_collectMinimapData`: `color: minimapUnitColor(ru.side, this._playerControlSide(), BATTLE_PLAYER, BATTLE_ENEMY)`. Wynik taki sam jak wcześniej, ale kolor wynika z jednej testowalnej funkcji (wzorzec analogiczny do `sideColor` w 3D).
3. Nowy test gra/tools/battle-minimap-side-colors-test.cjs: (A) 4 przypadki funkcji; (B) drawBattleMinimap na atrapie ctx sprawdza fillStyle znaczników dla playerSide=atk i =def; (C) wiązanie w battleScene.ts (regex na wywołanie, brak `ru.side === 'atk|def'` w sekcji minimapy).

## TESTY (surowe wyniki, ta sesja)
- `npm ci` w gra/ (worktree, brak node_modules): added 71 packages.
- Przed zmianą: `npx tsc --noEmit` exit=0; `node tools/battle-tempo-minimap-brand-test.cjs` exit=0 („OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)”); `node tools/minimap-viewport-rect-follow-test.cjs` exit=0 („OK: 12 testów minimap-viewport-rect-follow”).
- Po zmianie: `node tools/battle-minimap-side-colors-test.cjs` exit=0 („OK: battle-minimap-side-colors (A: 4 przypadki, B: 4 znaczniki na pikselach fillStyle, C: wiązanie sceny)”).
- Po zmianie: `npx tsc --noEmit` exit=0; `node tools/battle-tempo-minimap-brand-test.cjs` exit=0; `node tools/minimap-viewport-rect-follow-test.cjs` exit=0 („OK: 12 testów”); `node tools/battle-hp-display-test.cjs` exit=0 („PASS — 7 / 7”).
- Mutacja: w battleMinimap.ts `return side === 'atk' ? playerColor : enemyColor;` → nowy test exit=1 (AssertionError). Po przywróceniu exit=0.
- `git diff --check`: czysto.

## Kryteria dispatchu
(a) test statyczny/jednostkowy playerSide=atk i =def + mutacja: SPEŁNIONE (powyżej).
(b) żywy Chromium, ≥3 zrzuty OBEJRZANE: NIE ZMIERZONO w tej rundzie. Chromium jest dostępny (/usr/bin/chromium), ale istniejący harness live pisze do evidence innego tematu i nie został uruchomiony. Zmiana nie zmienia kolorów względem stanu sprzed tematu, więc ryzyko regresji wizualnej jest niskie, ale to NIE jest dowód na żywo.
(c) tsc 0, bramki, testy brand/viewport/hp-display bez regresji: SPEŁNIONE (powyżej). Uwaga: „5 bramek” z dispatchu nie zostało nazwane; wykonano tsc + 3 powiązane testy + nowy test.
(d) dług Rust REPIN: do odnotowania, bez działania w tym temacie (kod Rust nie dotknięty).

## BLOKADY
- Brak DODATKU orkiestratora (patrz wyżej): założenie, zakres z 00-dispatch.md.
- Brak legendy/tooltipa minimapy w kodzie: NIE ZMIERZONO.
- Brak żywego zrzutu Chromium (kryterium b): NIE ZMIERZONO.

## UWAGI-DLA-ORKIESTRATORA
- Poza zakresem: podczas pracy plik wyjściowy tsc został przez pomyłkę zapisany poza worktree (w katalogu głównym repo). Przeniesiono go (mv, nie rm) do scratchpada sesji. Nie wchodzi do commita.
- Dispatch wymienia „5 bramek” bez nazw; orkiestrator może doprecyzować listę w kolejnej rundzie.
- Rekomendacja: jeśli właściciel chce dowodu wizualnego, osobny temat live-verify (3 zrzuty w Chromium) po integracji.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET): weryfikacja diffu i testów; Final Control po PASS; live-verify jako opcjonalny osobny temat.
DEPLOY/PUSH: NIE WYKONANO
