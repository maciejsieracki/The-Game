STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-UI-TOOLBAR-ZOOM-BEHIND-EXPANDED-PANELS-Q1
GOAL: kontrolki mapy (zoom/pełny ekran, minimapa z przyciskami, toolbar ikon) leżą POD panelami rozwijanymi; jedno źródło prawdy dla warstwy.
ZMIANY/COMMIT: gra/src/ui/hudLayout.ts (nowe stałe Z_MAP_CONTROLS=309, Z_MAP_CONTROLS_MAX_BELOW_PANELS=310), hud.ts (.civ-hud-util-dock 318 -> Z_MAP_CONTROLS; .civ-mini 309 -> stała), mapToolbarHud.ts (310 -> stała), minimapHud.ts (310 -> stała), nowy test gra/tools/map-controls-behind-panels-live-test.cjs, evidence/ (zrzuty przed/po). Brak zmian w main.ts, cityPanel.ts, silniku, JSON.
DIAGNOZA: ikony ze zrzutu właściciela to przyciski narzędzi minimapy + kontrolka zoom. Zoom/pełny ekran (.civ-hud-util-dock) miał z-index 318 > panele list (311/313/405 Civpedia-hub wg elementFromPoint pod nim) i leżał NAD Dyplomacją, miastami, nauką, armią. Toolbar ikon po lewej (310) i minimapa (310) były pod panelami listowymi (311) już wcześniej; ujednolicono je do stałej, by nie rozjechać porządku. Warstwa 309 < .civ-hud (310) < panele (311+); toasty (320+/600+) i tooltipy (100050) bez zmian, nad panelami.
ZAŁOŻENIE: wybrano wariant "warstwa pod panelem" (bez ukrywania, bez migotania); zoom-dock traci pierwszeństwo nad kartą jednostki (311) — jest to też panel rozwijany, zgodne z GOAL.
TESTY:
- tsc --noEmit: 0 błędów.
- logic-test 213/213; tech-tree-test 20 pass/0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; bottom-bar-hud-wykonaj-overlap-test 33/0.
- NOWY live test (Chromium, vite build, viewport 860x700): PASS po poprawce. Tabela panel x kontrolka (po poprawce): dyplomacja/miasta/nauka/armia/civpedia: zoom-dock nakłada się 4, panel pod punktem 4/4 OK; minimapa nakłada się 2, 2/2 OK; toolbar-ikony: brak nakładania (panele zaczynają się na prawo od toolbaru); budowa/imperium/rekrutacja-imperium: brak nakładania przy 860 px (imperium ma backdrop 449/panel 450 > wszystkie kontrolki). Po zamknięciu kontrolki są na wierzchu (sprawdzane w teście).
- MUTACJA: cofnięcie poprawki (git apply -R) -> ten sam test CZERWONY: dyplomacja/miasta/nauka/armia: zoom-dock nad panelem 0/4 FAIL. Poprawka przywrócona -> PASS.
- Zrzuty: evidence/przed-dyplomacja-860.png, evidence/po-dyplomacja-860.png (obejrzany "po": zoom i minimapa za panelem Dyplomacji).
- hint-toast-zindex-empire-panel-test: FAIL niezwiązany z tematem (przed zmianami też: bramka szuka starej formuły z-index w main.ts, której nie dotykam) — NIE_ZMIERZONO na czystym origin/main, ale main.ts nie jest w moim diffie; do zgłoszenia jako dług testowy.
BLOKADY: brak. Nie dotykano cityPanel.ts/hud* poza warstwą (W12 bez konfliktu; hud.ts tylko 3 linie z-index + import).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (powtórzyć node tools/map-controls-behind-panels-live-test.cjs --shots <dir>; test sam buduje bundle poza repo, ok. 30 s + generacja świata).
DEPLOY/PUSH: NIE WYKONANO
