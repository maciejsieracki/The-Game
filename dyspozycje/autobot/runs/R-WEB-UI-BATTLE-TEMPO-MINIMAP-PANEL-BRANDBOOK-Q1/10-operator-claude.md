STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI bitwy / brandbook)
TEMAT: R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1
GOAL: panel TEMPO + minimapa w bitwie w oprawie tokenów marki (gra/src/ui/icons/brand/tokens.css), bez zmiany logiki tempa, minimapy i dostępności.
BAZA: 6d474b82691798fe5bbdec6881520bd4886f4036 (origin/main, FALA 785). Kod operatora: commit podany w odpowiedzi orkiestratora (SHA czubka).

ZMIANY/COMMIT:
- gra/src/battle/battleHudTheme.ts: applyTempoMinimapOuterPanel1E, applyTempoRow1E, applyTempoBtn1E (tokeny var(--tg-*), stany hover/focus przez klasę .civ-tempo-btn), nowy applyTempoMinimapFrame1E (tło --tg-bg-deep, obwódka --tg-gold-dim); applyMinimap1E zmienia tylko tło na token.
- gra/src/battle/battleScene.ts (punktowo, _buildMinimapOverlay i _syncTempoPanelHighlight): aria-label przycisków tempa, odczyt tempa ×N między − a + (aktualizowany w sync), ramka canvasBox z applyTempoMinimapFrame1E; usunięty import nieużywanego applyMinimap1E. Logika pauzy/tempa/AUTO/kliku minimapy nietknięta.
- gra/tools/battle-tempo-minimap-brand-test.cjs (nowy test, 3 sekcje A/B/C).
- dyspozycje/autobot/runs/R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1/evidence/PRZED-*.png i PO-*.png (1024×640, 1280×720, 1400×900, 1280×720@2).
- Brak zmian: WERSJE.md, manifest, gra-robocza/, rust-port/, battleScene poza wskazanymi funkcjami.

TESTY:
- node gra/tools/battle-tempo-minimap-brand-test.cjs -> "OK (A: 3 grupy stylu, B: 9 tokenów, C: wiązanie sceny)", exit 0.
- npx tsc --noEmit -p tsconfig.json -> exit 0 (bez wyjścia), po ostatniej zmianie.
- Bramki non-browser: logic-test LOGIC OK (213/213); tech-tree-test 20 pass 0 fail; research-test ALL GREEN; unit-replace-test 21/21; combat-test All sanity checks passed.
- Testy HUD/minimapy: minimap-viewport-rect-follow-test OK 12/12; hud-topbar-one-row-test 140 ok 0 fail; hud-panels-below-banner-test 130 ok 0 fail; sidepanel-hud-deadzone-test 43 pass 0 fail; battle-damage-colors-test 27 PASS 0 FAIL; battle-hp-display-test 7/7.
- Chromium (/usr/bin/chromium, Playwright, vite programowo, scena bitwy bitwa_duza_pole, tryb ręczny z domyślnym stanem): zrzuty PRZED (baza) i PO (zmiany) w 4 wariantach. Konsola: brak pageerror. Wymiary panelu bez zmian: 240×166 px w każdym wariancie (wymóg ≤+10%: spełniony).
- Mutacja na kopii: NIE ZMIERZONO (nie wykonano).

WIZUALNIE (PO, 1280×720@2, oględziny zrzutu): panel TEMPO w prawym dolnym rogu, złota obwódka z tokenu, przyciski ||/−/+/monitor w ramie tokenowej, odczyt ×1 złotym, minimapa w ciemnym tle --tg-bg-deep ze złotą ramką. Porównanie pikselowe PRZED/PO nie wykonane automatycznie; różnice opisane z oględzin.

BLOKADY / NIE ZMIERZONO:
- Nie zmierzono hover/focus przycisków w przeglądarce (CSS klasy .civ-tempo-btn wstrzykiwany, brak testu interakcji).
- Nie zmierzono w grze stanu AUTO aktywnego vs wyłączonego na zrzucie (zrzut w trybie ręcznym, bez zmiany trybu).
- Brak testu jsdom porównującego klik w przyciski z tempem (kryterium a) — istniejące testy logiki nie zostały zmienione; zmiana nie dotyka handlerów.
- Dług Rust: nie sprawdzono, czy rust-port ma ten panel (REPIN) — nie zmieniano rust-port.
- Zrzuty wykonane na trybie domyślnym sceny testowej, nie na pełnej grze z kampanią.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja wizualna zrzutów PRZED/PO w evidence/, uruchomienie test brand, ocena zgodności z tokenami; FC po Evaluatorze.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Dispatch wspominał „nowy brandbook” bez jednego pliku; przyjęto gra/src/ui/icons/brand/tokens.css (FROZEN v1.0) jako jedno źródło prawdy. Nie wymyślano palety.
- Usunięto tymczasowy harness (gra/tools/tempo-shot-entry.*) i gra/node_modules przed commitem.
- Przy PRZED/PO użyto podmiany plików bazowych w worktree i przywrócenia; stan końcowy zweryfikowany testem.
