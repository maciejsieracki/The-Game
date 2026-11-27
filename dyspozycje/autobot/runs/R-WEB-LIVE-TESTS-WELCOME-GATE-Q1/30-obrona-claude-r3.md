STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-LIVE-TESTS-WELCOME-GATE-Q1
GOAL: Odpowiedź Operatora (obrona, runda 3) na 9 zarzutów Evaluatora wobec kandydata 6ff29f840. Kryterium rundy (przepięte testy zielone jak przed zmianą, mutacja czerwona bez helpera, pomiar przed/po na maksimum) NIE SPEŁNIONE w tej rundzie.
ZMIANY-COMMIT: tylko ten plik (raport obrony r3). Zero zmian w gra/src, gra/data i w testach gra/tools. Brak nowych migracji testów.
TESTY: w tej rundzie NIE URUCHOMIONO pomiaru przed/po (12 przepiętych testów × 2 bazy × 2 ustawienia; ok. 3 min na test, poza budżetem tej rundy). Wykonano tylko: `npm ci` w gra/ (71 pakietów, worktree) i build live do scratchpad (`vite build`, 21,4 s, OK). tsc/logic/ai-test NIE ZMIERZONO w tej rundzie (brak zmian w kodzie; wyniki r2 w logi/ bez zmian).
BLOKADY: (1) brak pomiaru przed/po dla 12 przepiętych testów i brak poziomu maksymalnego — NIE ZMIERZONO; (2) brak mutacji czerwono-zielonej na teście, który helper realnie zmienia — NIE ZMIERZONO; na end-turn-gate niewykonalne, bo z helperem wynik to 2/9 (r2); żaden zmierzony test nie zmienia wyniku dzięki closeCivWelcome (end-turn-gate 2/9 = 2/9, era-change-toast 11/9 = 11/9); (3) inwentaryzacja 102 testów z tabelą — NIE ZMIERZONO.
RUNDY: 3/5 (obrona).
NASTĘPNY KROK: Orkiestrator decyduje (zgodnie z pkt 3 dispatchu r3): helper usuwa realną blokadę kliknięć (przechwycenie przez ekran powitalny, dowód r1/r2 probe), ale testy padają z innych powodów (bramka żywności/skarbca w ?playtest=mapa, scenariusz testu). Proponowane kroki: (a) zamknąć temat jako PASS-WITH-NOTES bez dalszego przepinania, z kandydatem BŁĄD-GRY/scenariusza na osobny temat; albo (b) osobny temat R-WEB-* na hak setPlayerGranary/setPlayerTreasury w ?playtest=mapa (zmiana gra/src poza tym tematem).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty (r3)

1. Brak dowodu, że closeCivWelcome zmienia wynik testu (end-turn-gate 2/9 przed i po; era-change-toast 11/9 przed i po). — PRZYJMUJĘ. Dane: logi/etg-BEFORE-base-commit.txt (2/9), logi/etg-AFTER-cand-closeCivWelcome.txt (2/9). Brak dowodu zmiany wyniku w zmierzonym zestawie.

2. Brak mutacji czerwono-zielonej na realnym teście. — PRZYJMUJĘ. Nie wykonano. Na end-turn-gate mutacja nie może dać zielonego wyniku z helperem (2/9 z helperem), więc ten test nie spełnia kryterium. Wymagany test, który po helperze zieleni się.

3. Pomiar obejmuje 2–3 z 12 przepiętych testów; 9 testów NIE ZMIERZONO. — PRZYJMUJĘ. Pomiar przed/po w tej rundzie nie został wykonany (koszt ok. 3 min na test, brak budżetu w tej rundzie). Lista 12 przepiętych testów (git diff 6319eaf66..6ff29f840, 2 linie każdy): forced-war-iron-player-target, forced-war-player-no-contact, forced-war-player-target, forced-war-r9-no-auto-end, forced-war-trojstronna-domino, diplo-truce-ai-table, diplo-truce-live, diplo-truce-saveload, end-turn-block-event, end-turn-gate, era-change-toast, sidepanel-diplo-dismiss-real-render. Wszystkie: NIE ZMIERZONO.

4. sidepanel-diplo-dismiss-real-render-test: przed rc=1 (33 OK/4 FAIL), po timeout 280 s; brak surowego logu. — PRZYJMUJĘ. Nie ponowiono pomiaru; regresja czasowa NIE WYKLUCZONA. Log NIE ZMIERZONO.

5. Poziom maksymalny nie zmierzony na żadnym teście. — PRZYJMUJĘ. Proponowana definicja maksimum dla tego tematu (do zatwierdzenia przez orkiestratora): Dyplomacja Trudna, Koszty jednostek Wysoki ×4, Kultura i religia trudna, największa mapa dostępna w danym teście. Testy ?playtest=mapa używają ustawień wbudowanych; ich zmiana wymaga haka w gra/src, więc poziomu maksymalnego nie da się ustawić bez zmiany gry. NIE ZMIERZONO.

6. Brak inwentaryzacji i klasyfikacji (próbka ≥20). — PRZYJMUJĘ. Stan faktyczny z grep w tej rundzie: 130 plików *live*-test.cjs; 44 pliki *-test.cjs zawierają tekst „Zakończ”/„Zakonczy”; 16 plików używa closeCivWelcome; 1 plik używa prepareEndTurnGate (live-nns-gate-smoke-test.cjs). Tabela test | start | przed | po | powód: NIE ZMIERZONO.

7. gateInfo/canEnd opisane tylko dla end-turn-gate. — PRZYJMUJĘ. Dla pozostałych testów NIE ZMIERZONO.

8. end-turn-input-stability-test nie przepięty i nieuruchomiony. — PRZYJMUJĘ. Potwierdzone: gra/tools/end-turn-input-stability-test.cjs nie zawiera closeCivWelcome ani prepareEndTurnGate i nie został przepięty. NIE ZMIERZONO.

9. prepareEndTurnGate nie wpięty w żadnym teście; brak haka w ?playtest=mapa. — CZĘŚCIOWO ODRZUCAM (dowód): prepareEndTurnGate jest wpięty w gra/tools/live-nns-gate-smoke-test.cjs (linia 18: `const { prepareEndTurnGate, closeCivWelcome } = require('./_live-ready.cjs');`). Co do substancji PRZYJMUJĘ: w przepiętych testach ?playtest=mapa helper nie jest wpięty (hak __nnsMeasureDebug istnieje tylko pod ?civTest=1), więc ograniczenie jest realne i jego naprawa wymaga zmiany gra/src poza zakresem tematu. _live-ready.cjs nie zmieniano w tej rundzie.

## Stan procesu
- node_modules w worktree (npm ci, gitignored) i build w scratchpad do usunięcia po zapisie raportu.
- Logi r2 bez zmian; logi/SHA256SUMS.txt bez zmian.
- Znalezisko poza zakresem (UWAGI-DLA-ORKIESTRATORA): wzorzec *.log w .gitignore utrudnia commit logów testów live (potwierdzone w rundzie 2).
