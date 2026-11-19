STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-PEACE-CITIES-NOT-TRANSFERRED-AND-WAR-NEXT-TURN-Q1
GOAL: ustalić, czemu pokój z cesją 2 miast nie przeniósł miast i czemu ta sama cywilizacja zaatakowała w następnej turze; naprawić błędy, nie decyzje projektowe.
ZMIANY/COMMIT: tylko raport; brak zmian kodu gry (patrz NASTĘPNY KROK). Baza: 04722f538.
TESTY: NIE ZMIERZONO runtime (brak zapisu gry właściciela, brak odtworzenia scenariusza w grze).
 - npm ci --ignore-scripts w gra/: OK (71 pakietów). tsc --noEmit: exit 0.
 - diplomacy-city-cession-test: 79 pass / 0 fail; diplomacy-city-cession-r3-test: 79 / 0.
 - ai-war-weariness-peace-test: PASS=96 FAIL=0; diplo-war-peace-gate-test: 24 / 0; diplo-forced-peace-pending-test: PASS=40 FAIL=0.
 - Bramki logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6: NIE URUCHOMIONO (nie zlokalizowano skryptów w package.json).
 - Nowy test regresji NIE napisany: bez odtworzenia w grze nie zbudowano asercji na prawdziwych funkcjach.
BLOKADY: brak zapisu gry właściciela; domknięcia w main.ts (applyProposalOutcomeImpl, transferCityByTreaty) nieosiągalne z testu czystego.
ODCZYT KODU (gra/src/main.ts, nie zmieniany):
 (A) Cesja. Pre-kontrola cityCessionPayloadBlockReason (~l.40954) dopuszcza NAJWYŻEJ 1 miasto (total > 1 -> blokada, pokój nie zawarty, komunikat). Ścieżka oneShotTrade (applyProposalOutcomeImpl ~l.27056) jest jedyną z pre-kontrolą. Ścieżki omijające ją: (2) akceptacja z inboxa `zaproponuj_pokoj` (~l.22721) -> finalizePeaceTreatyBetween BEZ przelewu pozycji; (3) acceptPendingForcedPeace (~l.26865) -> transferBasketItems i zawsze finalize; (4) truce-end (z założenia bez miast). W transferBasketItems (~l.13713) błąd transferCityByTreaty tylko loguje console.error — pokój zostaje zawarty (połowiczny pokój).
 Hipoteza główna: pokój bez przeniesienia miast wynika z (2) lub (3), albo z połowicznego wykonania; NIE POTWIERDZONE.
 (B) Ponowna wojna. Zwykłe wypowiedzenie AI respektuje blokadę pokoju (isWarTreatyBlocked; peaceUntilTurn = tura+10, diplomacy-peace-lock.ts). Wojna EPOKI (powód R-EPOKA-*-WYMUSZONA-WOJNA) omija blokadę świadomie (R-WEB-ERA-WAR-IGNORE-TREATIES-Q1: eraWar blokuje tylko sojusz, war-rules-multiwar.ts:426). Lock forcedEraPeaceUntilNextEra (main.ts:12751) działa tylko w isPeaceLockedBetween, którego wojna epoki nie sprawdza. Hipoteza: następna tura to wojna epoki zaplanowana przed pokojem; NIE POTWIERDZONE (wymaga logu tury z powodem wypowiedzenia).
 (iii) Regres po FALACH 863/865/866: NIE SPRAWDZONO.
NASTĘPNY KROK: (1) log konsoli albo zapis gry właściciela z tury zawarcia pokoju (szukać: "pokój odrzucony — cesja", "BŁĄD: cesja miasta", powód wypowiedzenia z R-EPOKA); (2) runda 2 po tych danych; (3) PYTANIE ABC dla właściciela: czy wojna epoki ma omijać świeży pokój (obecna reguła IGNORE-TREATIES) — to decyzja projektowa, nie błąd; (4) poprawka po potwierdzeniu: pozycje cesji w ścieżkach (2)/(3) przez tę samą pre-kontrolę albo rollback pokoju przy błędzie transferu.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA: gra/node_modules zainstalowane w worktree (gitignored). Nie utworzono żadnych sesji ani zadań.
