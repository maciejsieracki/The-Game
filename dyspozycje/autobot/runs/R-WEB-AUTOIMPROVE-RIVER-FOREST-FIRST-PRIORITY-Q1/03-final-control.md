STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AUTOIMPROVE-RIVER-FOREST-FIRST-PRIORITY-Q1
GOAL: wycinka lasu przy rzece na polu obywatela (farma możliwa) jako pierwszy krok tury automatu, z zachowaniem (a)-(c).
ZMIANY/COMMIT: f81b952f9 (baza c3d859a40) przeniesiony (rebase, bez konfliktów) na origin/main 1297f51ff jako f166b5eea. Pliki: gra/src/game/auto-improvements.ts (KROK 0), gra/tools/autoclear-river-forest-priority-test.cjs (d2), gra/tools/autoimprove-river-forest-first-q1-test.cjs (nowy), runs/.../gate-regresje-PRZED-PO.txt. Diff w całości w allowliście; zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle.
TESTY (zweryfikowane samodzielnie na f166b5eea): autoimprove-river-forest-first-q1-test 10 OK / 0 FAIL; mutacja (KROK 0 wyłączony) 5 OK / 5 FAIL (czerwona); autoclear-river-forest-priority, autoimprove-stages-q1, ai-food-only-worked-hexes, autoclear-priority-q1, simple-food-rule-no-toggles, auto-improvements, ai-improvements, auto-improve-q3, auto-improve-no-item-cap, city-clears-forest, wycinka-drewno-cap: wszystkie EXIT=0; tsc --noEmit EXIT=0.
Żywa ścieżka (Chromium, endTurn): bundle PO zbudowany vite poza repo; autoclear-priority-live-test 30 tur profil Żywność: PRZED (gra-robocza) i PO identyczne (wyrab 0, farm 8, irygacja 6, errors 0) - brak regresji; ta mapa nie ma lasu przy rzece na polu obywatela, więc test nie ćwiczy nowej funkcji.
ROZSTRZYGNIĘCIE ZARZUTÓW: wszystkie 6 zarzutów z rundy 1 = ODDAL (naprawione w rundzie 2: raport, commit, log gate, test RED/GREEN, katalog runu, brak background).
NOTATKI (nie blokują):
 1. ZAŁOŻENIE 1 Operatora: niedobór (KROK 1) pozostaje przed wycinką rzeczną; gdy niedobór stawia ulepszenie w tej turze, wycinka czeka (kontrakt S3-1/s6 tartak). To realna decyzja produktowa: DO DECYZJI WŁAŚCICIELA (czy wycinka ma wyprzedzać także niedobór). Ryzyko: wycinka opóźniona tylko w turach z niedoborem.
 2. NIE_ZMIERZONO: pomiar 3 ziarna x 60 tur w main.ts z lasem przy rzece i RED/GREEN w Chromium na takiej mapie (harness nie ma sterowania ziarnem/lasem). Kontrakt pokryty testem pickera + mutacją.
 3. Istniejące przed zmianą, poza zakresem: ai-food-improvement-priority-stages-test (FAIL), audit-autoimprove-blockers (EXIT=2), autoimprove-live-hooks-test (EXIT=1).
 4. Asercja (d2) odwrócona (E1<E2 -> wycinka przed farmą) - uzasadniona decyzją właściciela 2026-11-05.
BLOKADY: brak
RUNDY: Final Control 2/5
SHA KOŃCOWY DO INTEGRACJI: patrz commit tego pliku na f166b5eea (podany w raporcie zwrotnym).
KOLEJNOŚĆ WZGLĘDEM origin/rust-port/parity-v2 (b520768b0): zmiany tylko w gra/ (web); integrować do main niezależnie, przed REPIN Rust (parity-v2 nie jest dotknięty; REPIN po zakończeniu weba).
NASTĘPNY KROK: integracja orkiestratora do main, ponowna weryfikacja bramek po merge; READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
