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
