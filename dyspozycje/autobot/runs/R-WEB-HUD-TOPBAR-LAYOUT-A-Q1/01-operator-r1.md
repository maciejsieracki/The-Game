STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — UI banery HUD
TEMAT: R-WEB-HUD-TOPBAR-LAYOUT-A-Q1
GOAL: układ A lewego banera + wszystkie chipy prawego banera w jednej linii (decyzja właściciela 2026-11-07).

ZMIANY/COMMIT: baza origin/main 9b019a7d8; commit — SHA w wiadomości zwrotnej (commit zawiera ten raport).
- gra/src/ui/hud.ts: nowy CSS lewego banera (żeton 2-piętrowy: ikona | etykieta / liczba / „+brutto / +netto” = 70% liczby, `--hud-cell-val`), `fitHudTopbar()` (JS po renderze + na resize): lewy = 6 w linii, gdy najszerszy żeton się nie mieści `.hud-left-fallback` (2x3), potem `.hud-left-compact/.tiny`; prawy = nowrap + stopnie `.hud-r-tight` → `.hud-r-stack` (liczba nad przyrostem) → `.hud-r-min`; szerokości banerów przycinane do rzeczywistego medalionu Mocy; `--civ-hud-toolbar-top` przesuwa pasek narzędzi pod wysoki lewy baner. Prawy klaster: przyciski u góry, baner POD nimi (kolumna do 2600 px).
- gra/tools/hud-topbar-layout-a-test.cjs (NOWY, real-render showHud, 4 szerokości x 4 zestawy).
- Zaktualizowane testy: hud-gross-net-rest, hud-topbar-grid-gross-net, hud-topbar-no-labels, hud-topbar-bigger-numbers (wołają fitHudTopbar po renderze — tak jak gra; pasek narzędzi: „dół banera <= przesunięty top”; B3/N4 porównują pozycje w TYM SAMYM trybie, bo tryby są zamierzone; mutanty przepisane na nowe łańcuchy CSS, mutanty Moc dodatkowo wyłączają klamrę JS). Nic nie osłabione poza tym uzasadnionym zawężeniem.

KLUCZOWE USTALENIE: w bazie prawy baner (z przyciskami Rekrutacja/Civpedia/Menu) nachodził na medalion Mocy już od 1920 px i zawijał chipy (zrzuty przed-*). Dlatego baner jest teraz pod przyciskami.

TESTY (logi gate-*.txt z EXIT=):
- NOWY hud-topbar-layout-a-test: PASS 144 ok / 0 fail. Pomiar PRZED (baza): plusy 0,559x liczby, prawy baner 2–5 linii, nachodzenie na Moc (pomiary-przed.txt). PO: plusy 0,70; prawy baner jedna wartość `top` przy 1920/1366/1024/640 dla wszystkich zestawów (małe 2/3/12/12/0; 12 345 +1 234; 123 456 +12 345); scrollWidth<=clientWidth przy >=1024; brak nakładania na Moc/lewy baner/przyciski; lewy: 1 linia przy 1920 (małe i 20 000), fallback 2x3 przy 1366/1024/640 i ogromnych liczbach. Mutacja (HUD_TS=baza): 64 czerwone (L1, R1) — gate-mutacja-baza.txt.
- hud-gross-net-rest PASS (816 ok, mutanty wykryte), hud-topbar-grid-gross-net EXIT=0, hud-topbar-no-labels PASS 94, hud-topbar-bigger-numbers (HUD_BASE=4905bac05) 0 fail, hud-number-abbrev, hud-recruits-abbrev, hud-resource-deficit-red 41, hud-skarbiec 34, hud-konwerter-dopasowanie, hud-miasto-*, hud-zetony-ekonomia-brutto-live: PASS.
- tsc --noEmit EXIT=0; logic-test 213/213; unit-renderer-overlay-sync 17/0; capture-render-sync 23/0; city-badge-zoom-lod 67/0.
- Pełna gra (vite build poza repo, ?playtest=mapa) 1920/1366/1024: chipy prawego banera w jednej linii (top=67), baner nie nachodzi na Moc, pasek narzędzi przesunięty do 148/118 px przy fallbacku (gate-gra-pelna.txt, zrzuty gra-pelna-*.png). Obejrzane: czytelne, bez ucięć.
- Zrzuty PRZED/PO: zrzuty/przed-*.png, po-*.png (4 szerokości x 4 zestawy).

BLOKADY / NOTES (nie wprowadzone przez tę zmianę, NIE sprawdzone na bazie):
- Padają niezależnie od hud.ts: hud-armia-chip-jednostki (2), hud-moc-warstwa (7), hud-obywatele-chip (3) — asercje wzorców źródła main.ts (main.ts nietknięty); hud-tooltip-body-mounted-panels (3, .civ-emp-info-tip); sidepanel-hud-deadzone (13, wszystkie przez `.civ-map-load-overlay` przechwytujący klik); ai-test 274/20 (nie importuje hud). Porównanie z bazą: NIE_ZMIERZONO.
- Przy 640 px i liczbach średnich/dużych prawy baner przewija się poziomo (dozwolone w dispatchu); ikony nie schodzą do 2. linii.
- Przy fallbacku (1366 i mniej) lewy baner ma 93–139 px wysokości; pasek narzędzi przesuwa się dynamicznie, ale panele boczne (SIDE_PANEL_TOP=104, osobne moduły) mogą po otwarciu zasłaniać dolny rząd banera.
- Przyciski prawego klastra przy 640 px nadal zachodzą na medalion Mocy (stan z bazy, poza zakresem „prawy baner”).
- Dla ekstremalnych liczb (−999,9M) tryb compact zmniejsza czcionki (te same kolumny).

RUNDY: 1/5
NASTĘPNY KROK: Evaluator
DEPLOY/PUSH: NIE WYKONANO
