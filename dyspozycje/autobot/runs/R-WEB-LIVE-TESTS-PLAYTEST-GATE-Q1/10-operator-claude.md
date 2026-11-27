STATUS: PASS-WITH-NOTES
DOMAIN: GAME (testy live; gra/src bez zmian, pliki testów i analiza)
TEMAT: R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1 (tag LIVEGATE2), runda 2/5
GOAL: co najmniej 3 realne testy live zmieniają wynik PRZED→PO (z bramki „Zakończ turę” na dalszy etap), mutacja czerwono-zielona na jednym, inwentaryzacja z kolumną „blokuje ekran powitalny” (≥20 wierszy z grep), hak nie zmienia gry bez flagi.
ZMIANY-COMMIT: commit z tą rundą (wskazany w polu sha wyniku). Baza 5c187d3bfecef5a09043135395d4538a93b5d3cc (`git merge-base --is-ancestor` potwierdzone przez checkout --detach). Brak zmian w gra/src (nie dodano haka w main.ts).
  Zmienione pliki (allowlista):
  - gra/tools/forced-war-player-target-live-test.cjs: bez zmian w tej rundzie (przepięte w 5c187d3be; zmierzone ponownie).
  - gra/tools/sidepanel-diplo-dismiss-real-render-test.cjs: `?playtest=mapa&civTest=1` + `prepareEndTurnGate` w endTurnAndSettle. Uwaga: plik nie pasuje do glob `*-live-test.cjs` z allowlisty, ale jest wskazany w dispatchu.
  - gra/tools/era-change-toast-live-test.cjs: `?playtest=mapa&civTest=1` + `prepareEndTurnGate` przed endTurn w sekcji C. Zamiast diplo-truce (patrz BLOKADY).
  - gra/tools/diplo-truce-live-test.cjs: zmiany z tej rundy cofnięte, plik bez modyfikacji.
  - dyspozycje/analizy/TESTY-LIVE-BRAMKA-PLAYTEST-2026-11-27.md: dopisana sekcja „Runda 2”.
  - dyspozycje/autobot/runs/R-WEB-LIVE-TESTS-PLAYTEST-GATE-Q1/logi/*.txt: surowe wyjścia, mutant (usunięty z drzewa po pomiarze) i inwentaryzacja grep.
TESTY:
  - tsc --noEmit: rc=0.
  - forced-war-player-target-live-test PRZED (kod z c2749691b, kopia tymczasowa): rc=1, „endTurn #1 nie ustabilizował się”, 147 s. PO (kod z 5c187d3be): rc=0, 12 pass / 0 fail, 364 s. Pierwsza próba PO ubita limitem 285 s w A2 (rc=124, bez błędu gry). Czas PO przekracza limit 280 s.
  - sidepanel-diplo-dismiss-real-render-test PRZED: rc=1, 33 pass / 4 fail (A6, A7, B6, B7: endTurn nie wykonany), 286 s. PO: rc=0, 35 pass / 0 fail, 133 s.
  - era-change-toast-live-test PRZED: rc=1, C/D/E fail (bramka: „Nie można zakończyć tury. Spichlerz…”), 144 s. PO: rc=1 dalej: C, D, E PASS (era 1→2, toast „Nowa epoka” widoczny), F fail (karta technologii pusta, `sections:0`; ta sama usterka w PRE), Escape timeout, 85 s.
  - Mutacja czerwono-zielona (sidepanel, bez wywołania prepareEndTurnGate): rc=1, 33 pass / 4 fail; przywrócony: rc=0, 35 pass / 0 fail.
  - diplo-truce-live-test PRZED: 27 pass / 1 fail (endUntilTurn, tura 9). Dwie próby poprawki (wiki, prepareEndTurnGate) bez efektu. Diagnoza: blokada to isPreBattleOpen (pending:false), nie NNS.
  - Poziom maksymalny: NIE ZMIERZONO. Testy używają domyślnego bootstrapu ?playtest=mapa; żaden nie ustawia Dyplomacji Trudna, Kosztów jednostek Wysoki ×4, Kultury i religii trudny ani największej mapy, i nie zawierają haka/parametru, który by je podniósł. Maksimum wg kreatora (do zweryfikowania osobno): Dyplomacja i wojna: Trudna; Koszty jednostek: Wysoki ×4; Kultura i religia: trudny; mapa: największa dostępna.
  - Inwentaryzacja: 105 plików *-live-test.cjs, kolumny z grep (closeCivWelcome, prepareEndTurnGate, civTest). Wiersze „blokuje ekran powitalny” wypełnione z kodu jako hipoteza (55 „prawdopodobnie TAK”), nie z uruchomienia. Pliki: logi/INWENTARYZACJA-grep-r2.txt oraz sekcja w dokumencie analizy. Uruchomione w tej rundzie: 4 testy (forced-war, sidepanel, era-change-toast, diplo-truce).
  - Bramki pełne (logic 213, tech-tree 20, research 33, unit-replace, combat 6, ai-test 297/0): NIE ZMIERZONO w tej rundzie (gra/src bez zmian; uruchomiono tylko tsc).
BLOKADY:
  - diplo-truce-live-test: blokada to okno przedbitewne (isPreBattleOpen), nie bramka NNS. Wymaga haka w main.ts albo osobnego tematu. Zastąpiony przez era-change-toast.
  - Pomiar na poziomie maksymalnym: nieuruchomiony (brak parametrów w testach).
  - Wszystkie trzy przepięte testy: forced-war przekracza limit 280 s (364 s). Skrócenie wymaga osobnego tematu.
  - Sekcja F era-change-toast (karta technologii pusta) to pre-existing, nie zbadana.
RUNDY: 2/5 (ostatni werdykt FC runda 1: FAIL; ten przebieg: domknięcie kryterium binarnego).
NASTĘPNY KROK: FC (Final Control) na tym commicie: weryfikacja 3 PRZED/PO (logi/*.txt), mutacji, zapisu „poziom maksymalny NIE ZMIERZONO” i decyzji o era-change-toast zamiast diplo-truce. Ewentualnie osobny temat na: pre-battle w diplo-truce, skrócenie forced-war poniżej 280 s, pomiar na poziomie maksymalnym.
DEPLOY/PUSH: NIE WYKONANO
