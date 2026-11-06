STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI: górny baner zasobów (HUD topbar, lewy baner 3+3)
TEMAT: R-WEB-HUD-TOPBAR-BIGGER-NUMBERS-NO-GAPS-Q1
GOAL: (1) główne liczby +25–35%; (2) brak pustych przestrzeni (zwarta grupa liczba+przyrosty, wycentrowana w żetonie); (3) brutto/netto i deficyt bez zmian, układ 3+3 stały.
ZMIANY/COMMIT: baza R3 = `b74feb871` + merge `origin/main` (2510ffa0b). Kod+test+zrzuty+logi: SHA w odpowiedzi orkiestratora / `git log` (commit tego raportu osobno). Pliki: `gra/src/ui/hud.ts`, `gra/tools/hud-topbar-bigger-numbers-real-render-test.cjs`, `zrzuty/after-*.png` (12 PO zaktualizowanych; 12 PRZED bez zmian), `gate-r3-*.txt`. Push NIE.

ZMIANA (decyzja orkiestratora R3, bez ABC)
- `.civ-hud-chip-figs`: usunięte `margin-left:auto`; `.civ-hud-chip-line` gap 6→4 px.
- `.civ-hud-chip-cell`: kolumny `var(--hud-cell-med) minmax(0,max-content)` + `justify-content:center` — medalion, liczba i przyrosty tworzą zwartą grupę wycentrowaną w żetonie; żeton (3×1fr) bez zmiany szerokości.
- Liczby bez zmian względem R2 (17/15/13/12 px, +31%/+25%/+30%/+33%).

POMIARY (real render Chromium, puste boki żetonu px/stronę, lewo = prawo)
- 1920: 12 → 85–93; 2,3M → 55–79 (baner pełnej szerokości, N6 — nie cappowany; bok zależy od długości liczby, nie od układu).
- 1366: 12 → 39–47; 2,3M → 9–32 (najciaśniejszy żeton 9 px ≤ 12).
- 1024: 12 → 23–27; 2,3M → 7–12. 640: 12 → 7–13; 2,3M → 7–10.
- Przerwa liczba↔przyrosty: 0–4 px we wszystkich oknach i zestawach (≤ 6). Symetria lewo/prawo: 0,0 px.
- B3 (stałe pozycje/szerokości żetonów 12 vs 3 456 vs 2 345 678): zielone wszędzie. UWAGA: wycentrowana grupa jest zmiennej szerokości, więc medalion/liczba w żetonie przesuwają się o kilka px wraz z długością liczby (sam żeton nie). Min-width liczby NIE dodany (zostawiłby lukę po lewej przy krótkich liczbach).

TESTY (logi z `EXIT=` w `gate-r3-*.txt`)
- hud-topbar-bigger-numbers-real-render-test: 59 ok / 0 fail, EXIT=0. B4 zaktualizowany: przerwa ≤6 px + symetria ≤2 px + puste boki najciaśniejszego żetonu (2,3M) ≤ ~12 px dla okien ≤1366 (1920 tylko raport).
- Mutacja cofnięcia font-size (HUD_TS=baza): B1 FAIL 4/4, EXIT=1.
- Mutacja przywrócenia `margin-left:auto` (+ stare kolumny 1fr, plik CSS `HUD_EXTRA_CSS_FILE`): B4 FAIL 4/4 (max przerwa 184,6 / 92,3 / 44 / 30 px), EXIT=1. Samo `margin-left:auto` bez 1fr nie ma efektu (body = max-content), stąd mutacja łączona.
- hud-topbar-grid-gross-net 1199/0; hud-topbar-no-labels 94/0 (N6 zielone); hud-gross-net-rest 752/0; hud-resource-deficit-red 41/0; hud-skarbiec 34/0; hud-number-abbrev OK; hud-recruits-abbrev OK; tsc EXIT=0.
- sidepanel-hud-deadzone: 3 przebiegi: 34/2, 20/13 (civ-map-load-overlay jeszcze nie zniknął — flake czasowy), 43/0 EXIT=0. Zgodne z notą R2.
- Sekcja B (vite build poza repo, `--dist`): 1228 ok / 4 fail — te same 4 FAIL co na bazie 4905bac05 (harness endTurn, magazyn bez zmiany), nie regresja. hud-moc-warstwa-test: 21 PASS / 7 FAIL — identycznie jak baza (dług sprzed zmiany).

BLOKADY: brak. Notatki: (a) puste boki przy 1920 px i krótkich liczbach nadal 55–93 px/stronę — nieuniknione przy stałym układzie i pełnej szerokości banera (N6); jeśli właściciel chce mniej, wymagany max-width banera (łamie N6) — decyzja orkiestratora; (b) przesunięcie grupy w żetonie przy zmianie długości liczby (patrz wyżej); (c) odstępstwo 1201–1320 px z R2 (przyrosty 8,5 px) bez zmian.
Sprzątnięte: node_modules, hud.__base.ts, /tmp/civ-hud-out, dist-sidepanel-deadzone-test.

RUNDY: 3/5
NASTĘPNY KROK: Evaluator (zrzuty `zrzuty/after-*` vs `before-*`, definicja B4, notatki a–b), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
