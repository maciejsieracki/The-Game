STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-HUMAN-PEACE-AND-WAR-TRIBUTE-FIX-Q1
GOAL: (P21c) pokój/rozejm między dwoma fotelami ludzkimi tylko w trwającej wojnie; (P17b) „zaproponuj trybut” z modala w wojnie jako jednorazowy (goldOnce), jak koszyk.
ZMIANY/COMMIT: allowlista zachowana. gra/src/main.ts (nowa funkcja humanPeaceRejectReason; strażnik w proposeToHuman i w gałęzi accept zaproponuj_pokoj w respondToHumanProposal). gra/src/ui/diplomacyNegotiationModal.ts (case 8 readPayload: goldOnce = goldPerTurn tylko gdy offer && ctx.atWar). Nowe: gra/tools/diplo-human-peace-no-war-test.cjs, gra/tools/diplo-war-tribute-once-test.cjs. Commit: SHA w polu sha odpowiedzi operatora.
TESTY:
- tsc --noEmit: bez błędów (wyjście puste, po npm ci w gra/).
- diplo-human-peace-no-war-test.cjs: PASS=5 FAIL=0 (testy źródłowe: obecność i kolejność strażnika).
- diplo-war-tribute-once-test.cjs: PASS=4 FAIL=0 (testy źródłowe: warunek goldOnce).
- Testy NIE uruchomione na bazie (czerwone-na-bazie) ani mutacje: NIE ZMIERZONO.
- Testy behawioralne na żywo (hotseat, Chromium) i pozostałe bramki z dispatchu (logic, tech-tree, research, unit-replace, combat, ai-test, war-rules-multiwar-main-guard, hotseat e-source/B/D/E, hud-me-literal-zero, diplo-world-news, truce-end-war-notice, bramki-tmpdir): NIE ZMIERZONO w tym przebiegu.
BLOKADY: brak twardych blokad. Odstępstwo od dispatchu: strażnik NIE dodany do finalizePeaceTreatyBetween. Powód: ta funkcja obsługuje też ścieżki wymuszonego pokoju (pendingForcedPeace, stół AI, koniec wojny), gdzie status pary jest celowo przejściowy; strażnik tam mógłby zablokować legalne zakończenie wojny. Wejścia graczy (propozycja, akceptacja) są zabezpieczone. Decyzja do potwierdzenia przez orkiestratora.
Uwaga do UI: odrzucenie pokazuje komunikat (showHintMessage, prefiks „Dyplomacja:”); nie dodano osobnej etykiety/blokady przycisku w HUD. Blokada w UI nie była wymagana przez silnik; do rozważenia.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (testy źródłowe + przegląd diffu), potem bramki z listy NIE ZMIERZONO.
DEPLOY/PUSH: NIE WYKONANO
