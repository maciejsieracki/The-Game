STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-UI-ARMY-PANEL-GENERAL-LABEL-MULTISELECT-Q1
GOAL: Generał rozpoznawalny w listach armii, wielokrotne zaznaczanie i ROZWIĄŻ na zbiorze z potwierdzeniem; bez zmian balansu/save.
ZMIANY/COMMIT: weryfikowany e53ddf5e4 (obrona R1; baza 76dff3dee, impl. 837c56b32, origin/main 80919e2ae). Allowlista: tylko gra/src/ui/*, main.ts, nowy helper armyStackLabel.ts, testy, run-folder; brak zmian gra-robocza/WERSJE.md/rust-port/src-tauri/battle.
TESTY (własne, Chromium /opt/pw-browsers/chromium): tsc EXIT=0; git diff --check czysto; test jednostkowy 11/11; test LIVE (prawdziwy main.ts, vite build do /tmp) 7/7; commander-identity 8/8; split-movement 4/4; merge-panel-list-visibility 104/104; ai-test 274/20 (= baza).
ROZSTRZYGNIĘCIE ZARZUTÓW: 1 ODDAL (merge i pick panel renderują etykietę, sprawdzone testem); 2 ODDAL (test live: zaznacz 3 -> ROZWIĄŻ usuwa dokładnie 3, confirm, generał); 3 ODDAL (lista ścieżek Chromium w teście; inne stare testy z /usr/bin/chromium poza zakresem); 4 ODDAL (odznaka 10 px, zrzut z realnej gry); 5 ODDAL (Lista dostaje rolę przez name z main.ts + sortowanie; brak osobnego testu sortowania Listy - nota); 6 ODDAL (decyzja projektowa, etykieta i potwierdzenie z N).
NAPRAW: brak. DO DECYZJI CZŁOWIEKA: brak.
NOTY: sortowanie w armyListHud bez osobnego testu; army-split-panel-scroll-grid i unit-info-card-army-interaction (pre-existing, niezwiązane) nieuruchamiane ponownie.
BLOKADY: brak
RUNDY: 3/5 (Final Control)
NASTĘPNY KROK: integracja orkiestratora: cherry-pick/merge 837c56b32, 76dff3dee, e53ddf5e4 (+ ten raport) na origin/main. Zmiana tylko gra/ (web), niezależna od origin/rust-port/parity-v2 (b520768b0); REPIN Rust po końcu weba.
DEPLOY/PUSH: NIE WYKONANO
