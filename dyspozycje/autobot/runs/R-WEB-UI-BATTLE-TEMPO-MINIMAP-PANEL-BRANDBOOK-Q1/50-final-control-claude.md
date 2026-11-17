STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI bitwy / brandbook)
TEMAT: R-WEB-UI-BATTLE-TEMPO-MINIMAP-PANEL-BRANDBOOK-Q1
GOAL: panel TEMPO + minimapa w oprawie tokenow marki, bez zmiany logiki tempa, minimapy i dostepnosci.
BAZA: 0078ccb3ae9d7672cda74622af177cbdf9b8462a | KANDYDAT (integration_sha): 43075b0cf3a7b1555cc7f0fcf0342df85ced6851
ANCESTRY: git merge-base --is-ancestor 0078ccb 43075b0 -> TAK.

ZMIANY/COMMIT (diff 0078ccb..43075b0, poza dyspozycje/): gra/src/battle/battleMinimap.ts (tylko stale palety + uzycie w rysowaniu: tlo, rzeka, brod, ramka widoku; logika rysowania/klik/kamera bez zmian), gra/tools/battle-hud-tempo-minimap-entry.ts/.html (helper testu), gra/tools/battle-hud-tempo-minimap-live-test.cjs (nowy test). Pliki entry/live-test poza literalna allowlista, ale to narzedzia testowe (zero wplywu na gre) - akceptowane. Brak WERSJE/manifest/rust-port/gra-robocza.

TESTY (surowe wyniki, samodzielnie, kandydat):
- tsc --noEmit: exit 0
- battle-tempo-minimap-brand-test: OK; minimap-viewport-rect-follow: 12 OK; battle-damage-colors: 27 PASS/0 FAIL; battle-hp-display: 7/7
- 5 bramek: logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6 (zielone, brak dlugu bazowego do rozroznienia)
- load-game-regression: 34 PASS / 0 FAIL
- battle-hud-tempo-minimap-live-test (Chromium przez Vite; 1024x640, 1280x720, 1400x900, 1280x720@2): Wynik 84 OK, 0 FAIL (zachowanie Przyspiesz/Zwolnij/Pauza/AUTO, klik minimapy przesuwa kamere deterministycznie, hover/focus/aria-label, kolory palety na pikselach canvasu, brak pageerror).
- Mutacja wlasna na zrodle: MINIMAP_RIVER '#325371' -> '#1a3878' (stary jaskrawy): live-test FAIL "P[1024x640]/[1280x720] paleta river = token marki (piksel canvasu)" have [26,56,120] want [50,83,113]. Zrodlo przywrocone, git status czysty. (Mutacje M1-M4 wg raportu obrony; nie powtarzane - NIE ZMIERZONO przeze mnie.)

ZARZUTY EVALUATORA:
1 (brak dowodu mutacyjnego palety): ODDAL - naprawione w r3 (test na pikselach canvasu), potwierdzone moja mutacja.
2 (slaba kontrola negatywna): ODDAL - mutacje zrodlowe M1-M4 dodane w obronie; moja mutacja palety potwierdza dzialanie testu.
3 (konwencja znacznikow gracz czerwony/przeciwnik zolty): ODDAL jako obserwacja - w repo znaczniki to BATTLE_PLAYER #3a6ad0 / BATTLE_ENEMY #c84040 (battleHudTheme.ts); DODATEK nakazuje "zachowac konwencje", operator zachowal stan istniejacy. Konwencja damage-colors dotyczy liczb obrazen. Zmiana kolorow znacznikow = osobna decyzja produktowa, nie blokuje. Woda stonowana (#325371), czytelnosc terenow zachowana.
4 (proceduralne): ODDAL - entry/live-test to narzedzia; live-test.json deterministyczny (po biegu zielonym git status czysty); wpis na liste deployu i dlug Rust po stronie orkiestratora.
Zero NAPRAW.

BLOKADY: brak technicznych.
UWAGI-DLA-ORKIESTRATORA:
(a) Lista deployu: gra/tools/battle-tempo-minimap-brand-test.cjs, gra/tools/battle-hud-tempo-minimap-live-test.cjs (+ entry .ts/.html).
(b) Dlug Rust REPIN: panel TEMPO (battleHudTheme/battleScene _buildMinimapOverlay, _syncTempoPanelHighlight) i paleta minimapy (battleMinimap.ts: MINIMAP_BG/RIVER/FORD/VIEW_FRAME) - NIE ZMIERZONO.
(c) Opcjonalna decyzja: kolor znacznikow stron minimapy (niebieski/czerwony vs czerwony/zolty).
(d) Pikselowego PRZED/PO (14 PNG) nie ogladalem - NIE ZMIERZONO.
(e) Fallbacki var() bez wstrzyknietych tokenow - sciezka startu bitwy poza standardowa NIE ZMIERZONA.
(f) W moim biegu mutacyjnym proces testu po FAIL nie zakonczyl sie w limicie (harness zawisa po FAIL); bieg zielony konczy sie normalnie. Przy sprzataniu usunac gra/node_modules w worktree.
RUNDY: FC r2 (runda 2/5 tematu).
NASTEPNY KROK: integracja orkiestratora 43075b0cf (merge do main, bramki; deploy ROBOCZA po osobnej autoryzacji).
DEPLOY/PUSH: NIE WYKONANO
