STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI bitwy / brandbook)
TEMAT: R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1
GOAL: panel TEMPO + minimapa w bitwie w oprawie tokenów marki (gra/src/ui/icons/brand/tokens.css), bez zmiany logiki tempa, minimapy i dostępności; r2 domyka zarzuty FC r1: paleta canvasu minimapy, test zachowania na realnych funkcjach, pomiar w Chromium, zrzuty PRZED/PO.

BAZA: origin/main = 6d474b82691798fe5bbdec6881520bd4886f4036. KANDYDAT r1 = 0078ccb3ae9d7672cda74622af177cbdf9b8462a (potomek 6d474b826: `git merge-base --is-ancestor 6d474b826 0078ccb` = TAK). Start r2: `git checkout --detach 0078ccb3a` (HEAD potwierdzony = 0078ccb3ae9d7672cda74622af177cbdf9b8462a, drzewo czyste). SHA commita r2 z kodem i raportem: pole `sha` w odpowiedzi StructuredOutput.

ZMIANY/COMMIT (allowlista r2 = DODATEK 2 + pliki pomocnicze testu):
- gra/src/battle/battleMinimap.ts — TYLKO kolory canvasu (zero zmian logiki rysowania pozycji, kliku, kamery, wydajności). Mapowanie stare → nowe:
  - tło canvasu: rgba(12,18,35,0.92) → #080a12 (= --tg-bg-deep)
  - rzeka (t=3): #1a3878 → #325371 (--tg-science-blue #5a9bd4 stonowany ~45% w stronę --tg-panel-bg #121820)
  - bród (t=4): #2a5098 → #3d678c (stonowany ~60%, jaśniejszy niż rzeka = rozróżnialność zachowana)
  - ramka widoku: rgba(255,255,255,0.88) → rgba(232,216,138,0.95) (--tg-gold-primary #e8d88a)
  - bez zmian: ląd (las/góry/mury/bramy/nizina), znaczniki stron (BATTLE_PLAYER/BATTLE_ENEMY), obwódka zewnętrzna canvasu rgba(232,216,138,0.55).
  - Stałe paletowe opisane komentarzem w pliku (canvas nie czyta zmiennych CSS).
- gra/tools/battle-hud-tempo-minimap-live-test.cjs (NOWY, Chromium przez Playwright + vite; realna BattleScene na presecie bitwa_duza_pole; klikanie realną myszą).
- gra/tools/battle-hud-tempo-minimap-entry.ts + .html (NOWE, wejście przeglądarkowe dla testu powyżej; plików pomocniczych nie da się sensownie wyrazić w nazwie „-test.cjs”).
- dyspozycje/.../evidence/: PRZED-r2-{1024x640,1280x720,1400x900,1280x720@2}.png + PRZED-r2-panel-*.png (baza = 0078ccb, czyli stan przed r2); PO-r2-* + PO-r2-panel-* (po r2); live-test.json (56 kontroli OK); live-test-mutacja.json (kontrola negatywna). Wcześniejsze PRZED-/PO-*.png z r1 (baza 6d474b8) zostają bez zmian.
- Brak zmian: battleScene.ts, battleHudTheme.ts, WERSJE.md, manifest, gra-robocza/, rust-port/, gra/tools/tempo-shot-*, node_modules (nie w commicie).

TESTY (surowe wyjście, kandydat r2 z zmianami):
- `npx tsc --noEmit -p tsconfig.json` → EXIT 0.
- `node tools/battle-hud-tempo-minimap-live-test.cjs` (exe=/usr/bin/chromium, swiftshader) → "Wynik: 56 OK, 0 FAIL" na 4 wariantach: 1024×640, 1280×720, 1400×900, 1280×720@2.
  - (A) zachowanie tempa: Przyspiesz speedIdx 0→1 i odczyt "×2" = speedMul; Zwolnij cofa 1→0; Pauza przełącza scene.paused i wraca; AUTO przełącza _manualMode.
  - (B) zachowanie minimapy: klik w 10% szerokości → camTarget.x=6, klik w 90% → camTarget.x=61 (monotonicznie); ten sam punkt dwa razy → identyczny camTarget (deterministycznie).
  - (C) stany (pomiar w Chromium, 1280×720 oraz pozostałe warianty — patrz tabela niżej): hover Przyspiesz zmienia color rgb(232,216,138) → rgb(244,230,168); focus-visible po Tab daje outline 2px solid; AUTO aktywne tło linear-gradient(rgb(240,220,136)→rgb(185,154,40)) vs nieaktywne linear-gradient(rgba(18,24,32,.96)→rgba(8,10,16,.96)); po dwóch klikach AUTO wraca do stanu wyjściowego.
  - (D) układ: panel 240×166 px na każdym wariancie, right 16 / bottom 16 (prawy dolny róg); limit ≤ 236·1,10 spełniony (240 px).
  - (E) brak pageerror w konsoli na wszystkich wariantach.
- KONTROLA NEGATYWNA: `MUTATE=1 node tools/battle-hud-tempo-minimap-live-test.cjs` — w kopii w przeglądarce ustawiono onclick=null na „Zwolnij” → FAIL w sekcji A na 4/4 wariantach (start 0, po kliku 1) → "KONTROLA NEGATYWNA: mutacja zlapana — OK".
- `node tools/battle-tempo-minimap-brand-test.cjs` (test r1, statyczny) → "OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)", EXIT 0.
- `node tools/minimap-viewport-rect-follow-test.cjs` → "OK: 12 testów", EXIT 0.
- Bramki referencyjne: logic-test LOGIC OK (213/213); tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test All sanity checks passed.
- Testy HUD bitwy: battle-damage-colors-test 27 PASS / 0 FAIL; battle-hp-display-test 7/7; hud-topbar-one-row-test 140 ok 0 fail; hud-panels-below-banner-test 130 ok 0 fail; sidepanel-hud-deadzone-test 43 pass 0 fail; load-game-regression-test 34 PASS / 0 FAIL.
- PRZED/PO (oględziny zrzutów 1280×720@2, wycinek panelu): woda z jaskrawoniebieskiej tafli (#1a3878/#2a5098) na stonowany stalowy niebieski; ramka widoku z białej na złotą; tło minimapy z granatu na prawie czarne #080a12. Rząd Tempo, przyciski, odczyt ×1 i rozmiar panelu bez zmian. Różnice opisane z oględzin.

WERDYKT PER ZARZUT FC r1:
1. (kryt. a, test zachowania) — NAPRAWIONE: nowy test na realnej BattleScene w Chromium (klik tempa zmienia tempo, klik minimapy przesuwa kamerę) + kontrola negatywna (mutacja handlera) na 4/4 wariantach.
2. (GOAL 2, minimapa jaskrawoniebieska) — NAPRAWIONE: paleta canvasu z tokenów marki (tło, rzeka, bród, ramka widoku); PO różni się od PRZED na zrzucie.
3. (pomiar hover/focus/AUTO w Chromium) — ZMIERZONE na 4 wariantach (tabela wyżej): hover, focus-visible, AUTO aktywne/wyłączone.
4. (tokeny przed panelem, fallbacki) — bez zmian względem r1 (ensureBrandRootTokens + fallbacki var() w battleHudTheme.ts, wcześniej naprawione w 52627837e).
5. (lista deployu) — do zatwierdzenia przez orkiestratora (patrz UWAGI).
6. (dług Rust) — NIE ZMIERZONO pełny przegląd rust-port; wyszukiwanie `minimap|tempo` w *.rs nie dało trafień (dług do potwierdzenia przez orkiestratora / rejestr).

NIE ZMIERZONO / ZAŁOŻENIA:
- Stan „aktywne tempo” jako podświetlenie przycisku: NIE dotyczy — przyciski −/+ nie są przełącznikami; aktywne tempo jest oznaczone złotym odczytem ×N (nie zmieniano). Zostawiono jako zachowanie r1.
- Pikselowy diff PRZED/PO: NIE ZMIERZONO (różnice z oględzin).
- Scena testowa bitwa_duza_pole w trybie domyślnym (ręczny); kampania/pełna gra NIE ZMIERZONO.
- Hover/focus/AUTO zmierzone na scenie testowej; w pełnej grze nie zmierzono.

BLOKADY: brak technicznych.
RUNDY: r1 = Operator (e580a9f19 → 0078ccb3a) + Evaluator (e69cedcfb) + Obrona (52627837e) → FC r1 FAIL (50-final-control-claude.md, f8d085772). r2 = ten raport (Operator HAIKU 5.5), runda 2/5.
NASTĘPNY KROK: Evaluator (SONNET) r2: weryfikacja testu live (56 OK + mutacja 4/4), zrzutów PRZED-r2/PO-r2 w evidence/ i zmian battleMinimap.ts; potem Obrona i Final Control.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Lista deployu (punkt d): dodać gra/tools/battle-tempo-minimap-brand-test.cjs (r1) oraz gra/tools/battle-hud-tempo-minimap-live-test.cjs (r2). Test live wymaga: npm w gra/ (playwright, vite), /usr/bin/chromium; uruchomienie z katalogu gra/: `node tools/battle-hud-tempo-minimap-live-test.cjs` (bramka) i `MUTATE=1 node tools/battle-hud-tempo-minimap-live-test.cjs` (kontrola negatywna, oczekiwane FAIL w sekcji A → exit 0 po stronie logiki kontroli).
- Allowlista r2: battleMinimap.ts (rozszerzona wg DODATEK 2). Pliki gra/tools/battle-hud-tempo-minimap-entry.{ts,html} to wejście przeglądarkowe testu — proszę o zatwierdzenie poza literą allowlisty „battle-hud*-test.cjs”.
- Dług Rust: REPIN panelu TEMPO/minimapy oraz palety canvasu minimapy (battleMinimap.ts → rust-port) — do rejestru; NIE ZMIERZONO pełny przegląd rust-port.
- Pomiar 1280×720@1 vs @2 pokazuje identyczne wymiary panelu (240×166 CSS px) — zgodnie z oczekiwaniem.
- Brak znalezisk poza zakresem tematu.
