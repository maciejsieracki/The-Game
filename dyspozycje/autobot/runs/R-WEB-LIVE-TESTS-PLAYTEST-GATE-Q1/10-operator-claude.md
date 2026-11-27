STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1
GOAL: zamknąć lukę z #108: przynajmniej 3 testy live, które przed zmianą padają na bramce „Zakończ turę” w ?playtest=mapa, a po zmianie idą dalej, z mutacją czerwono-zieloną. Tabela inwentaryzacji ≥20 wierszy.
ZMIANY/COMMIT: baza c2749691b686f4ece6b2cb5e35b3438d0427c365 (origin/main, `git rev-parse HEAD` = c2749691b686f4ece6b2cb5e35b3438d0427c365; `git merge-base --is-ancestor` z bazą: tak). Zmienione pliki: dyspozycje/analizy/TESTY-LIVE-BRAMKA-PLAYTEST-2026-11-27.md (inwentaryzacja 105 wierszy) i ten raport. Kod gry, testy *-live-test.cjs i _live-ready.cjs NIE zmienione. Commit: patrz SHA w odpowiedzi orkiestratorze.
TESTY:
- Inwentaryzacja (grep -c, 105 plików *-live-test.cjs): closeCivWelcome w 12 plikach; prepareEndTurnGate w 0 plikach *-live-test.cjs (jedyne użycie: gra/tools/live-nns-gate-smoke-test.cjs).
- Pomiary live PRZED/PO: NIE ZMIERZONO w tej rundzie. Nie uruchomiono Chromium ani żadnego testu live.
- Bramki tsc/logic/tech-tree/research/unit-replace/combat/ai-test: NIE ZMIERZONO (brak zmiany w kodzie gry, nie uruchomiono w tej rundzie).
- Poziom maksymalny (Dyplomacja Trudna, Koszty jednostek Wysoki x4, Kultura i religia trudny, największa mapa): NIE ZMIERZONO.
BLOKADY:
1. Hak do ustawienia skarbca i spichlerza (`prepareEndTurnGate` -> `__nnsMeasureDebug.setPlayerTreasury/setPlayerGranary`) według raportu FC LIVEGATE działa tylko pod ?civTest=1. Test forced-war-player-target-live-test.cjs działa na ?playtest=mapa, więc bez zmiany w gra/src/main.ts (blok playtest, wyłącznie setter skarbca/spichlerza) albo przeniesienia testu na ?civTest=1 mechanizm nie zadziała. Nie wykonałem tej zmiany w tej rundzie: wymaga najpierw potwierdzenia warunku strażnika w main.ts (ok. linii 34841), zbudowania live i pomiarów, czyli więcej pracy niż mieści się w jednej rundzie.
2. Brak pomiarów PRZED/PO na ≥3 testach, brak mutacji czerwono-zielonej: kryterium binarne tematu nie jest spełnione.
3. Ryzyko dla integracji: żadne. Zmiana w tej rundzie to wyłącznie dokumentacja.
RUNDY: 1/5. Werdykt: BLOCK (kryterium binarne niespełnione, bez zmian w kodzie gry).
NASTĘPNY KROK: (a) otworzyć osobny temat R-WEB-* z allowlistą gra/src/main.ts (blok playtest, tylko setter skarbca/spichlerza, bez zmiany reguł); po wdrożeniu PRZED/PO na forced-war-player-target, sidepanel-diplo i jednym z 12 testów; (b) alternatywnie przenieść test na ?civTest=1 (bez zmian w gra/src), ale wtedy poziom maksymalny ustawień trzeba zmierzyć osobno; (c) #108 NIE zamykać.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Wzorzec `*.log` w .gitignore utrudnia commit logów testów live (używać .txt) — powtórzone z raportu FC LIVEGATE.
- Dysk przy starcie rundy: `df -h /` = 17G dostępne z 252G (59% użycia). Nic nie usuwano poza plikami tej rundy (brak).
- Zgłoszenie do rejestru: sekcja 3 raportu FC LIVEGATE (`gra/tools/live-nns-gate-smoke-test.cjs` używa prepareEndTurnGate, a 12 przepiętych testów nie) potwierdzona grep-em.
