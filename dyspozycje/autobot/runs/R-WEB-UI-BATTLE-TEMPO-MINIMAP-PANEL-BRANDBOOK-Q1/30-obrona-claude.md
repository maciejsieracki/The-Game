# OBRONA r2 (Operator HAIKU 5.5) — odpowiedź na zarzuty Evaluatora r2 (kandydat 703aaacad)

STATUS: PASS-WITH-NOTES (zarzuty 1, 2, 4 przyjęte i naprawione z dowodem; zarzut 3 odrzucony z dowodem i przekazany jako DECISION; zarzut 5 częściowo: (d) odrzucony, (e) przyjęty jako dług)
DOMAIN: GAME (UI bitwy / brandbook)
TEMAT: R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1
GOAL: panel TEMPO + minimapa w oprawie tokenów marki, bez zmiany logiki tempa, minimapy i dostępności.
BAZA: 703aaacad52f4708b745b0dadceebd066faed52e (kandydat r2; origin/main 6d474b826 jest jego przodkiem).
KOD OBRONY r2: 5b973ca12 (commit na 703aaacad; 4 pliki: battleMinimap.ts, entry.ts, live-test.cjs, evidence/live-test.json).
RUNDY: 2/5 (obrona r2); Evaluator r2 wykonany na 703aaacad.

ZMIANY/COMMIT (allowlista DODATEK 2 + pliki testowe):
- gra/src/battle/battleMinimap.ts: TYLKO eksport czterech stałych palety (MINIMAP_BG, MINIMAP_RIVER, MINIMAP_FORD, MINIMAP_VIEW_FRAME). Wartości i logika bez zmian (diff 0 w treści funkcji).
- gra/tools/battle-hud-tempo-minimap-entry.ts: window.__tempo.palette (stałe + terrainMinimapColor(3/4)). Plik spoza literalnej allowlisty, ale to wejście testu (helper).
- gra/tools/battle-hud-tempo-minimap-live-test.cjs: nowe sprawdzenia (P) i (C) — patrz TESTY. Plik testowy spoza literalnej allowlisty (helper testu).
- evidence/live-test.json: wynik ostatniego pozytywnego przebiegu (84 OK / 0 FAIL).
- Brak zmian: handlerów tempa, kliku minimapy, kamery, battleScene.ts (committed), battleHudTheme.ts (committed), tokens.css, WERSJE.md, manifest, rust-port, gra-robocza.
- Mapowanie palety stare→nowe (zgodne z DODATKIEM 2): tło canvasu rgba(12,18,35,.92) → #080a12 (= --tg-bg-deep); rzeka #1a3878 → #325371 (= color-mix(science-blue 45%, panel-bg)); bród #2a5098 → #3d678c (= color-mix(science-blue 60%, panel-bg)); ramka widoku rgba(255,255,255,.88) → rgba(232,216,138,.95) (= gold-primary 95%). Las/góry/mury/bramy/nizina bez zmian. Czytelność woda/ląd/góry: rzeka i bród ciemniejsze od lądu, różne tony między sobą.

ODPOWIEDZI NA ZARZUTY EVALUATORA r2:

Zarzut 1 (brak dowodu mutacyjnego dla palety minimapy): PRZYJMUJĘ — NAPRAWIONE.
- Dodano (P): piksel canvasu (getImageData 1x1) dla bg/river/ford/viewFrame porównany z kolorem wyliczonym przez przeglądarkę z var(--tg-*) i color-mix; plus terrainMinimapColor(3/4) = stałe palety.
- Dowód pozytywny: 84 OK / 0 FAIL (4 warianty ekranu × 21 sprawdzeń).
- Dowód mutacyjny: patrz M5 niżej (powrót do #1a3878 ⇒ 4 FAIL w P).

Zarzut 2 (kontrola negatywna słaba: MUTATE=1 tylko DOM; brak mutacji kliku i twardego koloru): PRZYJMUJĘ — NAPRAWIONE.
- Dodano (C): kolor nieaktywnego przycisku Przyspiesz = computed --tg-gold-primary (porównanie z probe-elementem) oraz obecność 4 aria-label.
- Mutacje ŹRÓDŁOWE na czystym commicie 5b973ca12 (każda: zmiana pliku → live test → git checkout przywrócenie; wynik surowy z logu):
  - M1 twardy kolor w rzędzie tempa (battleHudTheme.ts: color nieaktywnego → #ff00ff): exit 1, "Wynik: 80 OK, 4 FAIL" — FAIL: "C kolor nieaktywnego przycisku tempa = token --tg-gold-primary" got rgb(255,0,255) want rgb(232,216,138) (x4 wariantów).
  - M2 usunięcie aria-label (battleScene.ts mkTempoBtn: setAttribute('aria-label') → 'data-mut'): exit 1; test pada na waitForFunction aria-label "Przyspiesz" (timeout 60 s, linia 81) — CZERWONO, ale nie jako nazwany check; uczciwie: to FAIL przez wyjątek, nie przez asercję.
  - M3 odłączenie handlera „Zwolnij” w źródle (onclick → pusta funkcja): exit 1, "Wynik: 80 OK, 4 FAIL" — FAIL: "A Zwolnij cofa speedIdx" start 0 after 1 (x4).
  - M4 odłączenie kliku minimapy w źródle (if (dx²+dy² < 36) → if (false)): exit 1, "Wynik: 80 OK, 4 FAIL" — FAIL: "B klik w lewa czesc minimapy przesuwa kamere" left=right=(33,77) (x4).
  - M5 cofnięcie palety rzeki do #1a3878 (battleMinimap.ts): exit 1, "Wynik: 80 OK, 4 FAIL" — FAIL: "P paleta river" have [26,56,120] want [50,83,113] (x4).
- Kontrola DOM (MUTATE=1, onclick=null w przeglądarce) zostaje jako dodatkowa, ale już nie jest jedynym dowodem.

Zarzut 3 (konwencja znaczników gracz/przeciwnik): ODRZUCAM w zakresie zmiany kodu; przekazuję jako DECISION.
- Dowód stanu repo (703aaacad): gra/src/battle/battleHudTheme.ts:17 BATTLE_PLAYER = '#3a6ad0' (niebieski), :22 BATTLE_ENEMY = '#c84040' (czerwony). Tak są rysowane znaczniki i panel bitwy; zrzuty PO-r2 pokazują to samo.
- DODATEK 2 pkt (2) zakłada, że konwencja „gracz czerwony, przeciwnik żółty wg BATTLE-DAMAGE-COLORS” JUŻ obowiązuje („zachowuje konwencję”). W repo tej konwencji nie ma: w battleHudTheme.ts brak żółtego przeciwnika, a osobny temat R-WEB-BATTLE-DAMAGE-COLORS-PLAYER-RED-ENEMY-YELLOW-Q1 (zgłoszenie właściciela 2026-11-09) nie zmienił znaczników w tym kodzie (NIE ZMIERZONO, czy wdrożono w main po 703aaacad — poza zakresem tej gałęzi).
- Zmiana kolorów znaczników stron na minimapie samodzielnie rozjechałaby minimapę z panelem bitwy i z resztą HUD. Decyzja (zmiana konwencji stron vs zachowanie niebieski/czerwony) należy do orkiestratora. NIE zmieniono.
- Uwaga o wodzie: po zmianie palety woda to ściszony granat (#325371 / #3d678c), nie jaskrawa tafla; nowy zrzut PO nie był wykonywany (paleta identyczna z kandydatem r2, którego zrzuty PO-r2 istnieją w evidence/). NIE ZMIERZONO ponownie.

Zarzut 4 (fallbacki var(--tg-*) i wstrzyknięcie tokenów): PRZYJĘTE w r1 (52627837e), ponownie potwierdzone: applyTempoBtn1E ma fallbacki (battleHudTheme.ts:401-404), ensureBrandRootTokens() wołane w _buildMinimapOverlay (battleScene.ts:12452). Brak nowej zmiany. Ścieżka startu bitwy bez wstrzyknięcia tokenów: NIE ZMIERZONO poza ścieżką _buildMinimapOverlay (test live odpala pełną scenę i daje 84 OK).

Zarzut 5 (d/e, uwagi proceduralne):
- (d) wpis testu na liście deployu — ODRZUCAM w zakresie Operatora (lista deployu i rejestry = orkiestrator, CLAUDE.md p.1 i p.4). Nazwy plików testowych do wpisu: gra/tools/battle-tempo-minimap-brand-test.cjs, gra/tools/battle-hud-tempo-minimap-live-test.cjs (+ entry .ts/.html).
- (e) dług Rust — PRZYJMUJĘ jako dług do rejestru: w tej gałęzi `grep -ril tempo --include=*.rs rust-port` = 0 trafień; REPIN panelu TEMPO i palety minimapy w Rust NIE ZBADANY głębiej (NIE ZMIERZONO).
- pozostałe uwagi: evidence/live-test.json jest nadpisywany przez każdy przebieg testu — zostawiono wynik pozytywny (84 OK) w commicie; mutacje przywracane przez git checkout. PRZED/PO zrzuty nie były ponawiane (paleta r3 == paleta r2).

TESTY (surowe wyjścia, commit 5b973ca12):
- tsc --noEmit (gra/): exit 0 (brak błędów). node_modules: symlink do gra/node_modules sibling worktree (wf_b100750d-100-2), w .gitignore — do usunięcia przy sprzątaniu.
- Live Chromium `node tools/battle-hud-tempo-minimap-live-test.cjs`: "Wynik: 84 OK, 0 FAIL", exit 0 (4 warianty: 1024x640@1, 1280x720@1, 1400x900@1, 1280x720@2).
- Mutacje M1–M5 (powyżej): każda exit 1 i FAIL. Log: scratchpad (mut1..mut5 *.log).
- battle-tempo-minimap-brand-test.cjs: "battle-tempo-minimap-brand-test: OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)", exit 0.
- minimap-viewport-rect-follow-test.cjs: "OK: 12 testów minimap-viewport-rect-follow", exit 0.
- battle-damage-colors-test.cjs: "WYNIK: 27 PASS / 0 FAIL", exit 0.
- battle-hp-display-test.cjs: "PASS — 7 / 7", exit 0.
- logic-test.cjs: "LOGIC OK (213/213)", exit 0.
- tech-tree-test.cjs: "tech-tree-test: 20 pass, 0 fail", exit 0.
- research-test.cjs: "PASSED: 33 / FAILED: 0 / TOTAL: 33", exit 0.
- unit-replace-test.cjs: 21 linii [OK], 0 [FAIL], exit 0.
- combat-test.cjs: "All sanity checks passed.", exit 0.
- NIE PONOWIONO: load-game-regression (Evaluator: 34/0), hud-topbar/minimap pozostałe testy — poza zakresem zarzutów r2 i nie dotyczą zmienionych plików (palety i testy). Zostają do listy bramek FC.

BLOKADY / NIE ZMIERZONO:
- Kolor znaczników stron (zarzut 3) — decyzja orkiestratora (DECISION_REQUIRED).
- Rust REPIN panelu TEMPO i palety minimapy — dług, nie zbadany.
- Nowe zrzuty PRZED/PO dla r3 — nie wykonane (paleta bez zmian względem r2).
- Ścieżka startu bitwy bez wstrzyknięcia tokenów poza _buildMinimapOverlay — NIE ZMIERZONO.

RUNDY: Operator: r1 (e580a9f1), r2 (703aaacad), obrona r1 (52627837e), obrona r2 (5b973ca12 + raport). Limit 5 nieosiągnięty.

NASTĘPNY KROK: (1) decyzja orkiestratora: kolor znaczników stron (zarzut 3); (2) Evaluator r3 / Final Control na commicie raportu; (3) ewentualny temat R-WEB-BATTLE-TEMPO-CLICK-BEHAVIOR-BROWSER-Q1 NIE jest już potrzebny dla kryterium (a) — test zachowania jest w live teście.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wpis na listę deployu: gra/tools/battle-tempo-minimap-brand-test.cjs i gra/tools/battle-hud-tempo-minimap-live-test.cjs (+ entry .ts/.html) — po stronie orkiestratora.
- Sprzątanie: gra/node_modules to symlink do worktree wf_b100750d-100-2 (ignorowane przez git); usunąć symlink (nie katalog docelowy) przy sprzątaniu.
- Rozbieżność DODATKU 2 (pkt 2 „zachowuje konwencję gracz czerwony / przeciwnik żółty”) ze stanem repo (BATTLE_PLAYER niebieski, BATTLE_ENEMY czerwony) — do rozstrzygnięcia.

---

# HISTORIA: obrona r1 (poprzedni raport)

STATUS: DECISION_REQUIRED (zarzuty 1 i 2 otwarte: kryterium (a) i GOAL 2 niespełnione; wymagają decyzji orkiestratora, patrz niżej)
DOMAIN: GAME (UI bitwy / brandbook)
TEMAT: R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1
GOAL: panel TEMPO + minimapa w oprawie tokenów marki, bez zmiany logiki tempa, minimapy i dostępności.
BAZA: 6d474b82691798fe5bbdec6881520bd4886f4036 (origin/main, FALA 785).
KANDYDAT Operatora: e580a9f199fd0303cc7c75ef08b380cbc22883d8.
Raport Evaluatora: e69cedcfbea62eeec963330adbfa021bf371aa6f (20-evaluator-claude.md).
Kod obrony: 52627837e (poprzednia obrona, już w gałęzi worktree; ta runda NIE dodała nowego kodu, tylko zweryfikowała commit i przepisała raport).
SHA końcowe obrony: patrz pole sha w odpowiedzi (commit tego pliku).

ZMIANY/COMMIT (allowlista: battleHudTheme.ts, battleScene.ts, battle-tempo-minimap-brand-test.cjs, runs/<ID>/):
- 52627837e, zawartość zweryfikowana przez `git show 52627837e`:
  - gra/src/battle/battleHudTheme.ts (applyTempoBtn1E): fallbacki w var() dla --tg-panel-grad, --tg-btn-primary, --tg-btn-primary-ink, --tg-gold-primary.
  - gra/src/battle/battleScene.ts: import ensureBrandRootTokens (l.255) i wywołanie na początku _buildMinimapOverlay (l.~12450), przed budową panelu Tempo.
  - gra/tools/battle-tempo-minimap-brand-test.cjs: usunięty wyjątek `t === '--tg-focus-ring'` w teście B.
- Brak zmian: WERSJE.md, manifest, gra-robocza/, rust-port/, handlery pauzy/tempa/AUTO/kliku minimapy, battleMinimap.ts, tokens.css.

ODPOWIEDZI NA ZARZUTY EVALUATORA:

Zarzut 1 (kryt. a: brak testu zachowania klik tempa / klik minimapy): PRZYJMUJĘ, NIE NAPRAWIONE w tej rundzie.
- Sekcja C testu to regexy po źródle (potwierdzone: test C sprawdza obecność tekstu w battleScene.ts, nie zachowanie).
- Test zachowania wymaga uruchomienia BattleScene w Chromium (wzorzec: gra/tools/ev4-r4q2-przycisk-real-render-test.cjs, esbuild + Playwright). Konstrukcja BattleScene (constructor(opts: BattleOpts), l.2783) wymaga pełnego stanu bitwy; handlery tempa są domknięciami w _buildMinimapOverlay (l.12502-12517), niedostępnymi osobno. Nie zbudowałem harnessu w tej rundzie: to osobny zakres pracy (NIE ZMIERZONO).
- Kryterium (a) dispatchu NIE jest spełnione. Rekomendacja: osobny temat R-WEB-BATTLE-TEMPO-CLICK-BEHAVIOR-BROWSER-Q1 (klik −/+/pauza zmienia speedIdx/pauzę; klik w minimapę zmienia kamerę), albo decyzja orkiestratora o zawężeniu kryterium.

Zarzut 2 (GOAL 2 / kryt. b: minimapa nadal jaskrawoniebieska na zrzucie PO): PRZYJMUJĘ diagnozę, NIE NAPRAWIONE.
- Pomiar pikseli evidence/PO-1280x720.png (poprzednio, skrypt poza repo): (1030,650) = #183676; (1240,650) = #193776; (1200,592) = #183575. To blisko #1a3878 = terrainMinimapColor(3) „river” (gra/src/battle/battleMinimap.ts, l.34-45). Niebieski pochodzi z kafli rzeki w canvasie drawBattleMinimap, nie z ramki (ramka #080a12 jest zasłonięta canvasem).
- Naprawa wymaga zmiany palety terenu minimapy (terrainMinimapColor, wspólna funkcja). To decyzja wizualna/brandowa — NIE podejmuję jej sam.
- ABC do właściciela (proponowane): kolor rzeki/brodu w minimapie bitwy: (A) wyciszony granat z palety marki (rekomendacja: spójność z oprawą panelu), (B) zostawić obecny kolor, (C) inny ton z tokenów. Bez decyzji GOAL 2 nie jest zrealizowany.

Zarzut 3 (luki dowodowe: hover/focus, AUTO, DPI 2, wyjątek --tg-focus-ring): CZĘŚCIOWO PRZYJĘTE.
- Wyjątek --tg-focus-ring USUNIĘTY w 52627837e. Dowód: test B przechodzi (wynik niżej).
- hover/focus (.civ-tempo-btn), stan AUTO aktywny/wyłączony, DPI 2 dla innych rozmiarów: NIE ZMIERZONO — wymagają przeglądarki, jak w zarzucie 1. Pozostają luką.

Zarzut 4 (ryzyko var(--tg-*) bez fallbacku i bez gwarancji wstrzyknięcia tokenów): PRZYJMUJĘ i NAPRAWIONO (52627837e).
- Fallbacki dodane do wszystkich var() w applyTempoBtn1E (widoczne w `git show 52627837e -- gra/src/battle/battleHudTheme.ts`, l.401-404).
- ensureBrandRootTokens() (gra/src/ui/brandTokenVars.ts l.~120) jest idempotentne (sprawdza ROOT_STYLE_ID przed wstrzyknięciem) i już wołane w ~12 modułach UI (wikiHubHud, cityPanel, minimapHud, newGameFlow, mapLoadingOverlay, turnTransitionOverlay itd.) — wywołanie w battleScene jest zgodne z istniejącym wzorcem.
- NIE ZMIERZONO na Chromium, czy w każdej ścieżce startu bitwy tokeny są wstrzyknięte przed pierwszym renderem; wywołanie w _buildMinimapOverlay pokrywa ścieżkę budowy panelu.

Zarzut 5 (d: wpis testu na listę deployu; e: dług Rust): CZĘŚCIOWO ODRZUCONE / PRZYJĘTE jako uwaga.
- (d) ODRZUCAM w zakresie Operatora: lista deployu i rejestry są po stronie orkiestratora (CLAUDE.md p.1 i p.4). Zostawiam w UWAGACH-DLA-ORKIESTRATORA.
- (e) PRZYJMUJĘ jako dług do rejestru: grep "tempo" w rust-port (*.rs) — 0 trafień w tej worktree (zgodne z Evaluatorem). Głębiej NIE ZMIERZONO.

TESTY (surowe wyjście, ta runda):
- `node gra/tools/battle-tempo-minimap-brand-test.cjs` -> "battle-tempo-minimap-brand-test: OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)", EXIT=0.
- Składnia (esbuild transformSync, loader ts): "SYNTAX OK src/battle/battleScene.ts", "SYNTAX OK src/battle/battleHudTheme.ts".
- tsc --noEmit: NIE ZMIERZONO w tej rundzie (gra/node_modules to symlink z samym esbuild, brak typescript). Ewaluator r1 podał exit 0 na e580a9f1, ale nie na 52627837e — wymaga powtórki przez FC.
- Pozostałe bramki non-browser (logic, tech-tree, research, unit-replace, combat, minimap-viewport-rect-follow, battle-damage-colors, hud-topbar-one-row): NIE PONOWIONO na 52627837e.
- Zrzuty PRZED/PO: NIE PONOWIONO (zmiana fallbacków nie zmienia kolorów przy wstrzykniętych tokenach; zrzut PO z ścieżką minimapy nadal wymaga decyzji z zarzutu 2).

BLOKADY / NIE ZMIERZONO:
- Test zachowania kliku (zarzut 1) — brak harnessu przeglądarkowego.
- Paleta rzeki w minimapie (zarzut 2) — decyzja właściciela (ABC).
- hover/focus, AUTO aktywny/wyłączony, DPI 2 inne rozmiary (zarzut 3).
- tsc i pełna seria bramek non-browser na 52627837e.
- Dług REPIN panelu TEMPO w rust-port — do rejestru.

RUNDY: Operator: runda 1 (e580a9f1), Evaluator r1 (e69cedcf), obrona r1 (52627837e), ta runda = weryfikacja/przepisanie obrony bez nowego kodu. Limit 5 nieosiągnięty.
NASTĘPNY KROK: (1) decyzja orkiestratora: ABC palety rzeki w minimapie (zarzut 2); (2) decyzja: osobny temat R-WEB-BATTLE-TEMPO-CLICK-BEHAVIOR-BROWSER-Q1 albo zawężenie kryterium (a); (3) po decyzjach — Evaluator r2 i Final Control na commicie obrony (tsc, bramki non-browser).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- ABC do właściciela: kolor rzeki/brodu w minimapie bitwy (terrainMinimapColor w gra/src/battle/battleMinimap.ts). Bez tej decyzji GOAL 2 nie jest zrealizowany.
- Nowy temat do rozważenia (NIE zakładany przeze mnie): R-WEB-BATTLE-TEMPO-CLICK-BEHAVIOR-BROWSER-Q1 (test zachowania w przeglądarce + hover/focus/AUTO/DPI 2), wzorzec gra/tools/ev4-r4q2-przycisk-real-render-test.cjs.
- Lista deployu: wpis gra/tools/battle-tempo-minimap-brand-test.cjs po stronie orkiestratora (zarzut 5d).
- Dług Rust: REPIN panelu TEMPO (rust-port: brak trafień grep "tempo" w *.rs) — do rejestru.
- Dyspozycja: dispatch 00-dispatch.md nie istnieje w origin/main pod tą ścieżką; treść odczytana z DODATKU w gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (DODATEK 1: baza po GENSTAR, 6d474b826).
- Dysk: / ma 13 GB wolnego (df -h), 68% zajęte.
