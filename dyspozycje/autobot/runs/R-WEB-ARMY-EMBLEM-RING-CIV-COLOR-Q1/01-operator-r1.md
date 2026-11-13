STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, gra/)
TEMAT: R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1
GOAL: Obwódka medalionu właściciela na tabliczce jednostki ma barwę danej pełnej cywilizacji (ta sama liczba co obwódka heksu, `civColorFn` = `_resolveOwnerColor`). Miasto-państwo (srebro) i barbarzyńcy (czerwień) bez zmian. Brak/zła barwa → mosiądz.
ZMIANY-COMMIT: branch worktree-wf_37a45ada-872-1, baza 7164f7ca1. Commit: SHA w sekcji końcowej (zob. git log -1). Allowlista: gra/src/render/unitOwnerEmblem.ts (ringHex w kontekście, ringColorFor, klucz cache z barwą), gra/src/main.ts (civRingHexFn + pole ringHex w rezolwerze), gra/tools/unit-owner-emblem-ring-civ-color-test.cjs (nowy test), dyspozycje/autobot/runs/R-WEB-ARMY-EMBLEM-RING-CIV-COLOR-Q1/ (raport + dowody). Nie tknięto units.ts ani unitStatPlate.ts (barwa już tam płynie przez ownerColor). Nie tknięto gra-robocza/, WERSJE.md, rust-port/, src-tauri/.
TESTY:
- npx tsc --noEmit (gra/): PASS, exit 0.
- node tools/unit-owner-emblem-ring-civ-color-test.cjs: 15 passed, 0 failed.
- node tools/commander-star-emblem-test.cjs: 12 passed, 0 failed (regresja).
- git diff --check: czysto.
- Chromium 149 (/opt/pw-browsers/chromium-1194, Playwright CDN zablokowany przez proxy 403): podgląd tabliczek z PRODUKCYJNYCH modułów unitStatPlate.ts + unitOwnerEmblem.ts, kamera ~52°, odczyt pikseli kanwy (promień 54, pozycja 64,10). PO: Grecy #1e5aa8, Persowie #c41e3a, Celtowie #d4a017, ciemna cyw. #5c4033, miasto-państwo #b9c8d8, barbarzyńcy #c84040 (wszystkie zgodne z oczekiwaniem). PRZED (7164f7ca1): wszystkie pełne cywilizacje #e8d88a (mosiądz).
- Dowody: dowody/tabliczki-przed.png, dowody/tabliczki-po.png, skrypty dowody/build-plate-preview.cjs, dowody/shot.cjs.
BLOKADY:
- NIE ZMIERZONO: zrzut z PRAWDZIWEJ GRY (pełna mapa, ≥3 właścicieli na żywo). Podgląd używa tych samych modułów, ale bez main.ts; wiring rezolwera (ringHex) sprawdza tylko test źródłowy regexem + tsc. Evaluator powinien potwierdzić na żywej grze (vite build do scratch outDir, nie dev/build w gra/).
- NIE ZMIERZONO: portrety władców (leaderPortraitUrl) — podgląd ma je wyłączone; obwódka na portrecie (ścieżka z ctx.strokeStyle = ringColor) jest zmieniona w kodzie, ale nie zrzutowana.
- Uwaga czytelności: ciemna barwa #5c4033 na tarczy rgba(12,17,26,0.92) — obwódka widoczna, ale o niskim kontraście (dowody/tabliczki-po.png, 4. tabliczka). Zostawiono bez zmiany koloru (kolor = tożsamość cywilizacji); do oceny Evaluatora.
- Sygnet zastępczy (civSigilSvg fallback) pozostaje mosiężny — zakres tematu to obwódka (pierścień), nie wnętrze. ZAŁOŻENIE.
- Gałąź dispatchu (origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0, d1d3215b1) ma inną historię niż worktree (3615 plików różnicy); dispatch odczytany przez git show, ale commit wykonany na worktree-wf_37a45ada-872-1. Integracja po stronie orkiestratora.
- Brak node_modules w worktree przed etapem: zainstalowane npm ci (gra/), usunięte po etapie.
BLOKADY-ANTY: brak; cache emblematu rozróżnia barwy (klucz civ:<civ>:<era>:<hex>, test PASS).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5): odtworzyć testy i zrzut; zrzut z żywej gry (≥3 właścicieli) i pomiar kontrastu ciemnej barwy; Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO
