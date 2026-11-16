STATUS: PASS-WITH-NOTES (obrona r1; zarzuty 1 i 2 pozostają OTWARTE, patrz niżej)
DOMAIN: GAME (UI bitwy / brandbook)
TEMAT: R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1
GOAL: panel TEMPO + minimapa w bitwie w oprawie tokenów marki, bez zmiany logiki tempa, minimapy i dostępności.
BAZA: 6d474b82691798fe5bbdec6881520bd4886f4036 (origin/main, FALA 785).
KANDYDAT Operatora r1: e580a9f199fd0303cc7c75ef08b380cbc22883d8. Evaluator r1: e69cedcfbea62eeec963330adbfa021bf371aa6f (tylko raport).
Obrona r2 (ta runda): commit kodu w gałęzi detached od e69cedcf (SHA końcowy w polu sha odpowiedzi orkiestratora).

ZMIANY/COMMIT (allowlista: battleHudTheme.ts, battleScene.ts, battle-tempo-minimap-brand-test.cjs, runs/<ID>/):
- gra/src/battle/battleHudTheme.ts: w applyTempoBtn1E dodano fallbacki do var(): --tg-panel-grad, --tg-btn-primary, --tg-btn-primary-ink, --tg-gold-primary (wartości z tokens.css / battleHudTheme). Logika stylu bez zmian.
- gra/src/battle/battleScene.ts: import ensureBrandRootTokens z ../ui/brandTokenVars; wywołanie na początku _buildMinimapOverlay (przed budową panelu Tempo). Reszta bez zmian.
- gra/tools/battle-tempo-minimap-brand-test.cjs: usunięty wyjątek `t === '--tg-focus-ring'` z testu B (token istnieje w gra/src/ui/icons/brand/tokens.css linia 37 z dwukropkiem, więc wyjątek był zbędny).
- Brak zmian: WERSJE.md, manifest, gra-robocza/, rust-port/, handlery pauzy/tempa/AUTO/kliku minimapy, battleMinimap.ts (terrainMinimapColor), tokens.css.

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (kryt. a: brak testu zachowania klik tempa / klik minimapy): PRZYJMUJĘ, NIE NAPRAWIONE w tej rundzie.
- Dowód: sekcja C testu nadal opiera się na regexach po źródle (świadomie nie zmieniane). Test zachowania wymaga wejścia w BattleScene w przeglądarce (wzór: gra/tools/*-browser-entry.ts + Chromium + vite). Taki harness wymaga node_modules w worktree i zrzutów; po starcie zostało 4.0 GB wolnego miejsca na / (df -h), a dispatch wymaga ≥4 GB przed startem web. Nie zbudowałem harnessu, żeby nie zejść poniżej progu.
- Rekomendacja: osobny temat R-WEB-BATTLE-TEMPO-CLICK-BEHAVIOR-BROWSER-Q1 (Haiku; przeglądarka; asercja: klik − / + / pauza zmienia speedIdx/pauzę, klik w minimapę zmienia kamerę).
- Kryterium (a) z dispatchu NIE jest spełnione.

Zarzut 2 (GOAL 2 / kryt. b: minimapa nadal jaskrawoniebieska na PO): PRZYJMUJĘ diagnozę, NIE NAPRAWIONE; źródło koloru zidentyfikowane.
- Pomiar pikseli zrzutu evidence/PO-1280x720.png (dekoder PNG bez zewnętrznych bibliotek, skrypt poza repo):
  (1030,650) = #183676; (1040,650) = #183676; (1050,650) = #183676; (1240,650) = #193776; (1250,650) = #193776; (1200,592) = #183575 — to blisko #1a3878 = terrainMinimapColor(3) "river" (gra/src/battle/battleMinimap.ts l.34-45).
  (1100,650) = #283828 i (1200,680) = #283828 — to blisko #2a3a2a = domyślny teren (równiny).
- Wniosek: niebieski na minimapie to kafle rzeki w samym canvasie (drawBattleMinimap), a NIE ramka (ramka ma tło #080a12 i jest zasłonięta canvasem). Zmiana ramki z r1 nie mogła tego zmienić — zgadzam się z Evaluatorem.
- Naprawa wymaga zmiany palety terenu minimapy (terrainMinimapColor, wspólna funkcja w battleMinimap.ts). To decyzja wizualna/brandowa (kolor rzeki w minimapie), nie zrobiłem jej bez zgody i bez zrzutu PO, który potwierdzi efekt. Pytanie ABC do właściciela: kolor rzeki/brodu w minimapie w tokenach marki (np. wyciszony granat z palety marki) — do decyzji orkiestratora.
- Dodatkowo NIE ZMIERZONO: czy kafle rzeki zasłaniają całą szerokość ramki w innych rozmiarach (zrzuty 1024×640, 1400×900 nie oglądane).

Zarzut 3 (luki dowodowe: hover/focus, AUTO, DPI 2, wyjątek --tg-focus-ring w teście B): CZĘŚCIOWO PRZYJĘTE.
- Wyjątek --tg-focus-ring USUNIĘTY (commit): test B przechodzi bez wyjątku (dowód niżej).
- Hover/focus, stan AUTO aktywny/wyłączony, DPI 2 dla innych rozmiarów: NIE ZMIERZONO (wymagają przeglądarki, jak w zarzucie 1). Zostają jako luka.

Zarzut 4 (ryzyko var(--tg-*) bez fallbacku i bez gwarancji wstrzyknięcia tokenów): PRZYJMUJĘ i NAPRAWIONO.
- Fallbacki dodane do wszystkich var() w applyTempoBtn1E (--tg-panel-grad, --tg-btn-primary, --tg-btn-primary-ink, --tg-gold-primary). Pozostałe var() w tym pliku już miały fallbacki (grep: l.283, 301, 302, 356, 358, 359, 372, 384, 385, 399, 400, 402-404).
- ensureBrandRootTokens() (gra/src/ui/brandTokenVars.ts l.110) wołane na początku _buildMinimapOverlay — tokeny są wstrzykiwane przed budową panelu, także przy starcie bitwy bez menu/wiki. Import i wywołanie w gra/src/battle/battleScene.ts.
- Dowód: node gra/tools/battle-tempo-minimap-brand-test.cjs -> "battle-tempo-minimap-brand-test: OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)", EXIT=0 (po zmianach).

Zarzut 5 (d: wpis testu na listę deployu; e: dług Rust): CZĘŚCIOWO ODRZUCONE / PRZYJĘTE jako uwaga.
- (d) ODRZUCAM w zakresie Operatora: lista deployu i rejestry są po stronie orkiestratora (CLAUDE.md p.1 i p.4). Zostawiam w UWAGACH-DLA-ORKIESTRATORA.
- (e) PRZYJMUJĘ jako dług do zapisania: grep "tempo" w rust-port (*.rs) w tej worktree zwrócił 0 trafień (zgodne z Evaluatorem). Nie badałem rust-port głębiej (NIE ZMIERZONO). Dług REPIN panelu TEMPO zostaje do odnotowania w rejestrze.

TESTY (wyniki z surowego wyjścia):
- node gra/tools/battle-tempo-minimap-brand-test.cjs -> "battle-tempo-minimap-brand-test: OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)", EXIT=0.
- Składnia (esbuild transformSync, loader ts): gra/src/battle/battleScene.ts OK; gra/src/battle/battleHudTheme.ts OK.
- git diff --check: CHECK-OK (bez wyjść).
- Środowisko testu: gra/node_modules to symlink do esbuild 0.28.2 zainstalowanego poza repo (scratchpad); pełne npm ci NIE wykonane (miejsce na dysku).
- tsc --noEmit: NIE ZMIERZONO (brak typescript/three w worktree).
- Pozostałe bramki non-browser (logic, tech-tree, research, unit-replace, combat, minimap-viewport-rect-follow, battle-damage-colors, hud-topbar-one-row): NIE PONOWIONO w tej rundzie. Zmiany r2 dotyczą tylko stylu przycisków tempa, fallbacków var() i wywołania ensureBrandRootTokens(); zielone wyniki Evaluatora na e580a9f1 nie zostały zweryfikowane ponownie na tym commicie.
- Zrzuty: NIE PONOWIONO (PRZED/PO z r1 bez zmian; zmiana fallbacków nie zmienia kolorów przy wstrzykniętych tokenach).

BLOKADY / NIE ZMIERZONO:
- Test zachowania kliku (zarzut 1) — brak harnessu przeglądarkowego.
- Efekt wizualny palety rzeki w minimapie (zarzut 2) — wymaga decyzji i zrzutu PO.
- hover/focus, AUTO aktywny/wyłączony, DPI 2 inne rozmiary (zarzut 3).
- tsc --noEmit i ponowna pełna seria bramek non-browser po r2.
- Mutacja na kopii r2: NIE ZMIERZONO.

RUNDY: Operator 2/5 (obrona r1 = runda 1 Operatora po zarzutach Evaluatora r1 wykonana jako obrona; kolejny krok Evaluator r2)
NASTĘPNY KROK: Evaluator r2 na commicie kodu obrony (sprawdzić: test B bez wyjątku, fallbacki, ensureBrandRootTokens); decyzja orkiestratora w sprawie zarzutów 1 i 2 (ABC palety rzeki w minimapie; osobny temat przeglądarkowy).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- ABC do właściciela: kolor rzeki/brodu w minimapie bitwy (terrainMinimapColor w gra/src/battle/battleMinimap.ts, wspólna funkcja) — wybrać paletę z tokenów marki albo zostawić. Bez tej decyzji GOAL 2 nie jest zrealizowany.
- Nowy temat do rozważenia (nie zakładany przeze mnie, zgodnie z zakazem): R-WEB-BATTLE-TEMPO-CLICK-BEHAVIOR-BROWSER-Q1 (test zachowania w przeglądarce + hover/focus/AUTO/DPI 2).
- Lista deployu: wpis nowego testu gra/tools/battle-tempo-minimap-brand-test.cjs po stronie orkiestratora (zarzut 5d).
- Dług Rust: REPIN panelu TEMPO (rust-port: brak trafień grep "tempo" w *.rs) — do rejestru.
- Dysk: po starcie 4.0 GB wolne na / (df -h); worktree zostaje do przeglądu, gra/node_modules (symlink) do usunięcia przez orkiestratora po Evaluatorze.
