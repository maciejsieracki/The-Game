STATUS: PASS
DOMAIN: GAME (WEB) — UI
TEMAT: R-WEB-HUD-PANELS-BELOW-BANNER-Q1
GOAL: panele boczne startują pod dolną krawędzią lewego banera HUD (dynamicznie), bez zmiany w trybie 1-liniowym, bez skoku.

ZMIANY/COMMIT: baza origin/main fcaa10300. Commit: SHA w odpowiedzi orkiestratorowi (`git log` brancha worktree).
- gra/src/ui/sidePanelLayout.ts: `SIDE_PANEL_TOP` = `var(--civ-hud-toolbar-top,104px)` (zmienną ustawia już `fitHudTopbar()` = dół banera + 8 px; bez niej 104 px = przesunięcie 0). Panele mają też `bottom`, więc wysokość maleje o przesunięcie, bez wyjścia poza ekran.
- gra/tools/hud-panels-below-banner-test.cjs (nowy).
Inwentarz (wszystkie używają wspólnej stałej SIDE_PANEL_TOP, zero zmian w tych plikach): sideListHud.css.ts (Miasta/Wojsko), diploListHud.ts (Dyplomacja), scienceHubHud.ts (Badania), sciencePicker.ts (dock), wikiHubHud.ts (Civpedia). Poza zakresem celowo: panel wydarzeń/powiadomień (prawa strona, top z eventsPanelTopPx pod prawym klastrem), minimapLayout.ts (SIDE_PANEL_TOP_PX liczbowe, karta jednostki), siegeMapPanel (top:120, prawa strona), cityUxFrame/modale. Zero zmian w main.ts, hud.ts, gra-robocza, WERSJE.md, rust-port, render.

TESTY:
- hud-panels-below-banner-test: PASS 119/0 (1920/1366/1024/640 x zestawy 2/3/12/12/0, 12 345 +1 234, 123 456 +12 345, deficyt; prawdziwy showHud + prawdziwy arkusz paneli list + panel na SIDE_PANEL_TOP): dół banera <= top panelu, top >= 104, tryb 1-liniowy = top 104 (przesunięcie 0), panel w oknie, brak skoku przy zmianie liczb. Zmierzone: fallback 2x3 -> top 148/118/119 (dół banera 139/109/111).
- Mutacja (sidePanelLayout.ts z bazy): FAIL (93 ok / 26 fail).
- hud-topbar-layout-a-test (istniejący, bez zmian): PASS 144/0.
- logic-test 213/213; tsc --noEmit czysto; ai-test 274 pass / 20 fail identycznie na bazie i po zmianie (bez pogorszenia).
- Zrzuty PRZED/PO (Chromium; 2 panele: lista Miasta/Wojsko + panel na SIDE_PANEL_TOP) w scratchpadzie sesji (poza repo): przed/przed-*.png, po/po-*.png. Przed (1366, duże liczby): panele zasłaniają dolny rząd banera; po: start pod banerem.

BLOKADY: brak. Zastrzeżenie: weryfikacja w pełnej aplikacji (main.ts) niewykonana — test używa prawdziwego HUD i prawdziwego CSS paneli list, nie całej gry; Dyplomacja/Badania/Civpedia/picker pokryte pośrednio (wspólna stała). Kolizja z panelem wydarzeń po prawej przy wąskich oknach poza zakresem.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
