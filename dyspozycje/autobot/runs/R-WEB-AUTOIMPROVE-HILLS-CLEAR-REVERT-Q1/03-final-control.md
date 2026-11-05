STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AUTOIMPROVE-HILLS-CLEAR-REVERT-Q1
GOAL: Cofnąć wyjątek Wzgórz w `wyrabMaSens` (wycinka lasu pod żywność tylko na Łące/Równinie).
ZMIANY/COMMIT: oceniany 97b12333ebe76da1f2c721e369155ccc441927fe (baza 37402ebe1, ancestor origin/main 7d2dccf42). Allowlista OK: auto-improvements.ts (tylko warunek Wzgórz + komentarz/verdict), 3 testy gra/tools, runs/<ID>/**. Brak zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle. Pliki kodu/testów nie były zmieniane w origin/main po bazie (brak konfliktu).
ZARZUTY Evaluatora: brak (0 NAPRAW, 0 ODDAL, 0 DO DECYZJI).
TESTY (odtworzone samodzielnie na 97b12333e, npm ci --ignore-scripts): simple-food-rule 36/0; ai-food-only 66/0; auto-improve-q3 41/0; autoclear-river-forest 16/0; irrigation-after-farms 42/0; stages-q1 299/0; tartak-oboz-wyscig EXIT=0; sawmill-hill-relief 8 asercji EXIT=0; tsc --noEmit EXIT=0. Mutacja (przywrócenie warunku) = FAIL wg Evaluatora i Operatora. Przeglądarka: NIE_ZMIERZONO (nie wymagana).
UWAGI: ai2-heks-po-heksie-test 2 FAIL — przedistniejące (ten sam wynik na bazie), dług testowy poza tematem.
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora: cherry-pick 97b12333e (+ commit z tym plikiem) na origin/main (7d2dccf42); zmiana tylko w gra/ (web), niezależna od origin/rust-port/parity-v2 — dowolna kolejność, ale przed REPIN Rust. Potem READY_FOR_DEPLOY.
DEPLOY/PUSH: NIE WYKONANO
