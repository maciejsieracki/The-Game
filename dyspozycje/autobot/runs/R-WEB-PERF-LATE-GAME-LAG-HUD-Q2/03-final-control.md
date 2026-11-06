STATUS: FAIL
DOMAIN: GAME (WEB)
TEMAT: R-WEB-PERF-LATE-GAME-LAG-HUD-Q2
GOAL: refreshFog, updateHud/buildHudState i refreshTerritoryBorderOverlay na sciezce kliku zredukowane >=5x (bez zmiany regul i determinizmu AI); endTurn: zmierz i zredukuj.
ZMIANY/COMMIT: kandydat kodu 6881713c06b0f62439ad6a33467365be4ea53f85 (na bazie Operatora 21cd11793d6d7f5fee219e530f1d167e143cccba, baza 33855a5405fec55c2be90c4ccf05f955787f0eec); HEAD obrony 6debc4522fbc75b0e87f90a68bb2933a75355304. SHA kodu dla R2: 6881713c0 (poprawny, zostaje jako baza R2; NIE integrowac teraz, FAIL). Allowlista OK: gra/src/game/frame-memo.ts (nowy), gra/src/main.ts, gra/src/ui/hud.ts, gra/tools/perf-hud-frame-memo-test.cjs, gra/tools/perf-late-game-interaction-r2-live-test.cjs (nowy), runs/<ID>/**. Zero zmian w WERSJE.md, gra/data, gra-robocza, rust-port, src-tauri.
TESTY (zweryfikowane samodzielnie na 6debc4522): tsc --noEmit EXIT=0; perf-hud-frame-memo-test 15 PASS/0 FAIL (uruchamia realny kod frame-memo.ts przez esbuild); border-march-scan, city-hex-movement, move-pass-through-own-units, river-fog-visibility EXIT=0. Pomiary obrony (nie powtarzane przeze mnie; spojne z pomiarem Evaluatora 5,3-5,8x dla refreshFog): updateHud 6,4x, refreshFog 4,8x, collectTurnEvents 4,3x, border 2,3x, buildHudState/wywolanie bez zmiany; klik: wybor 6,6x, ruch 6,3x, panel miasta 7,4x (czas updateHud inclusive, n=7).

WERDYKT ZARZUTOW:
1. updateHud/buildHudState/border bez pomiaru -> ODDAL (pomiar dostarczony). Cel >=5x dla buildHudState/wywolanie (45 ms) i border (2,3x) niespelniony -> NAPRAW (R2).
2. Tabela przed/po kliku -> ODDAL dla wyboru/ruchu/panelu (n=7 min/med/max). Wejscie do miasta NIE_ZMIERZONO -> NAPRAW (R2).
3. Skalowanie z tura i endTurn -> NAPRAW: skalowanie tylko na kandydacie (bez bazy); endTurn nie zredukowany (10,0 s JS: computeTerritoryResourceYieldByCity, axialDistance, okolicaTiles).
4. Test regresyjny regexowy -> ODDAL (logika w frame-memo.ts, test behawioralny 15 PASS).
5. Nieswieza migawka zagniezdzonego updateHud -> ODDAL (run() uniewaznia migawke; test PASS). Uwaga: turnEventsFrame (main.ts) NIE jest uniewazniany przy zagniezdzonym refreshD1bHud -- ryzyko niskie, domknac w R2 (invalidate albo test).
6. Memo zdarzen zaklada brak mutacji -> ODDAL (perfEquiv 14 wlascicieli/137 miast + 5 stanow, mismatches=[]; slabosc: 1 zdarzenie w stanie testowym, wzmocnic w R2).
7. Podpis granic a rzezba terenu -> ODDAL (rangeOverlay.ts czyta z mapy tylko istnienie heksu; test strukturalny pilnuje).
8. Pozostale waskie gardla (buildHudState, previewCityEconomy, okolicaTiles, collectTurnEvents) -> NAPRAW (R2).
9. Testy *path*/*move*/*render* -> ODDAL czesciowo (czerwone identyczne z baza). NIE_ZMIERZONO: player-moves-before-ai-turn, river-path-adjacency, hotseat-etap6e-render-noop, oboz-lowiecki-las-znika-render, hud-tooltip-body-mounted-panels -- powtorzyc w R2.

Znalezisko procesowe: harness Q1 klikal przez modal "Audiencja dyplomatyczna" (pomiary Q1/R1 Operatora nieprawidlowe); harness R2 zamyka modal -- stosowac w R2.

BLOKADY: cel >=5x niespelniony dla buildHudState/wywolanie i border; endTurn bez redukcji; wejscie do miasta, baza skalowania i baza endTurn niezmierzone; SwiftShader + load 6-8 zawyza czasy bezwzgledne.
RUNDY: FC R1 (runda 1/5); nastepna: Operator R2 (baza = kod 6881713c0, merge origin/main jesli czysto).
NASTEPNY KROK: Operator R2 -> Evaluator -> FC, to samo ID. Priorytet: koszt pojedynczego buildHudState (previewCityEconomy, assignWorkedTiles, okolicaTiles), endTurn (memo computeTerritoryResourceYieldByCity, axialDistance), pomiar wejscia do miasta, skalowanie bazy, inwalidacja turnEventsFrame. Kolejnosc wzgledem origin/rust-port/parity-v2: niezalezne (zmiany tylko w gra/ web); integracja do main po PASS; parity-v2 dostaje REPIN pozniej, nie blokuje i nie jest blokowane.
DEPLOY/PUSH: NIE WYKONANO
