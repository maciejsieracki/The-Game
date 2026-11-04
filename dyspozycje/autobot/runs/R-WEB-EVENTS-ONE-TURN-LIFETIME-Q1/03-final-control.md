STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1
GOAL: Wydarzenie informacyjne zyje jedna ture gracza; nieprzeczytane i nieusuniete znika przy przejsciu tury i nie wraca.
ZMIANY/COMMIT: koncowy SHA do integracji = SHA commita z tym plikiem na szczycie fd82125c8 (kod: 88e3d0e56, test live+raport: fd82125c8; baza 8c0fb5766). Allowlista: event-lifetime.ts (nowy), main.ts, sidePanelHud.ts, 2 testy, raport, gate-*.txt; zero zmian gra-robocza/WERSJE.md/rust-port/src-tauri/battle. git diff --check czysty.
KOLEJNOSC: origin/main (6983bbb4d) wyprzedza baze o commity, w tym zmiany main.ts; git merge-tree fd82125c8 + origin/main = czyste scalenie (bez konfliktow). Integracja na origin/main. Wzgledem origin/rust-port/parity-v2: niezalezne; po wdrozeniu REPIN Rust (events) zanotuje orkiestrator.
ZARZUTY: brak (Evaluator: zero). Werdykt: same ODDAL/brak -> PASS.
TESTY (zmierzone samodzielnie): tsc --noEmit EXIT=0; events-one-turn-lifetime-test 25 OK/0 FAIL; Chromium live (vite build poza repo) 8 OK/0 FAIL; events-defer-to-turn-start 40 OK/0 FAIL. Evaluator dodatkowo: blocking-card-cutoff 47/0, diplo-dismiss 35/0, przekierowania 48/3 (3 FAIL identyczne na baseline, elim-cs-12-7).
NIE_ZMIERZONO: era-change-toast-live (timeout 140 s), end-turn-input-stability i hint-toast-zindex (skrypt nie uzywa executablePath, brak chrome-headless-shell - infra), end-turn-gameplay-runtime, sidepanel-hud-deadzone, sidepanel-event-header; 3 FAIL node (end-turn-modal-sequencing, era-change-toast-defer, load-fail-toast-zindex) istnieja na baseline wg Operatora. Zmiana nie dotyka sciezek odroczenia/toastow.
UWAGI: asercja Chromium o kartach starej tury opiera sie na dzienniku silnika (pośredni dowod); hot-seat pokryty symulacja.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (merge do main), pelne bramki po scaleniu, potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
