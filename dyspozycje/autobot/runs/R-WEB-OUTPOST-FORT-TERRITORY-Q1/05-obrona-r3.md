STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB, `gra/`)
TEMAT: R-WEB-OUTPOST-FORT-TERRITORY-Q1
GOAL: obrona R3 (baza c7613ba36): Q-A zdobycie fortu przez wejscie wojska, Q-B wczesniejszy fort, Q-C bez zmian, Q-D usunac stare liczby 10/5.

ODPOWIEDZI NA ZARZUTY
1. Q-D stare liczby w docs: PRZYJMUJE. Poprawione: SPIS-TRESCI l.338-339 i l.2251; 02-mapa-swiata l.128-129; 05-budowa-mapa l.90 i l.202. Dowod: szeroki grep po `10 heks|+5 heks|o ok. **10|ok. **5 heks` w docs, gra/src, gra/data zwraca juz tylko trafienia poprawne lub niezwiazane (miasto 10 heksow, fort +5, zwiadowca 5 heksow, generator map, port.md "10 tur").
2. wikiBundle.json (Cywilopedia): PRZYJMUJE. Zregenerowany skryptem `node gra/tools/bundle-wiki-for-game.cjs` z docs; porownanie JSON ze stanem poprzednim: zmienila sie tylko tresc rozdzialow 02-mapa-swiata i 05-budowa-mapa (22 rozdz., 169 hasel, reszta identyczna).
3. Falszywe twierdzenie Q-D w raporcie: PRZYJMUJE. Poprzedni grep byl zbyt waski; patrz punkt 1.
4. Brak testu prawdziwego ruchu: PRZYJMUJE.
   - Nowy hak testowy `moveStep` (main.ts) wola REALNE startAnimatedMove; petla renderu konczy animacje i wola sweepFortCaptures (koniec ruchu). `fort-outpost-territory-live-test.cjs`, sekcja "Q-A ruch": jednostka gracza obok fortu C obcego (wojna) robi krok na fort; po animacji fort C ma ownerId gracza, a stary wlasciciel ma 0 heksow. Chromium 33/0 (bylo 26/0).
   - Mutacja mut5 (usuniecie sweepFortCaptures z konca ruchu): padaja 2 asercje "Q-A ruch" (31 ok / 2 fail), log gate-r3d-mut5-live.txt. main.ts przywrocony (potwierdzone grepem).
   - Luka AI (potwierdzona): ruchy AI-cywilizacji wykonuje petla komend (main.ts ok. l.38272, `cmd.type==='move'`) bez sweepu; sweep przy l.~39182 siedzi w bloku barbarzyncow (warunkowym), wiec zdobycie przez AI czekalo na koniec NASTEPNEJ tury. NAPRAWA: bezwarunkowy `sweepFortCaptures()` w try/catch zaraz po `flushAiCityRenderBatch()` (po fazie AI, przed tickiem barbarzyncow). Straznik I5 w fort-outpost-hard-territory-test.cjs (80/0, bylo 79/0). I5 to regex po tekscie, wiec dla AI nie ma E2E.
5. Zrzuty slabe: ODRZUCAM jako zarzut glowny (uwaga). Dowod graniczny jest liczbowy (ownerAt przed/po); zrzuty live-r3d-fort-border*.png dolaczone, nadal w fog of war. NIE_ZMIERZONO wizualnie: kolor granicy po zdobyciu.
6. Wiek zdobytego fortu dziedziczony przez zdobywce: uwaga przyjeta, to ZALOZENIE R3; zgloszone jako Q-F (nizej), do odpowiedzi stary mechanizm.
7. Allowlista docs/PORADNIK-GRACZA* i wikiBundle: uwaga przyjeta; zmiana wynika z Q-D (wszystkie opisy 3/5). Poza tym diff = gra/src/main.ts (hak + sweep AI), gra/tools, run.

DECISION_REQUIRED (dla orkiestratora, ABC do wlasciciela)
Q-E (bez zmian z R3): sporne heksy, wojna w tej samej turze, fort w terytorium miasta strony trzeciej; rekomendacja A.
Q-F (nowe): wiek zdobytego fortu przy sporze Q-B. A) zachowuje wiek zbudowania (obecnie: zdobywca dziedziczy pierwszenstwo), B) zdobycie nadaje nowy znacznik (zdobywca staje sie "pozniejszy"), C) liczy sie wiek cywilizacji, ktora zbudowala. Rekomendacja: A.

TESTY (po zmianach; node_modules tymczasowe, usuniete)
tsc EXIT=0. fort-outpost-hard-territory 80/0; fort-nodes-save-load 18/0; fort-strazniaca-zasieg-zakladania 85/0; territory-border, territory-border-dense-settlement, improvement-territory-gate, city-clears-forest, war-era-counter: EXIT=0 (inny format podsumowania, patrz logi); auto-improvements 46/0; ai-improvements 53/0; autoimprove-stages-q1 184/0; defeat-last-city 14/0; diplomacy 148/0; ring 15/0; ai-founding-territory 29/0; Chromium 33/0. Logi gate-r3d-*.txt, po jednej linii EXIT=.
NIE_ZMIERZONO: ai-test, civ-matrix; zdobycie przez prawdziwy ruch AI-cywilizacji w Chromium; wizualna zmiana koloru granicy.
BLOKADY: brak
RUNDY: 3/5 (obrona)
NASTEPNY KROK: Evaluator ponownie, potem Final Control; ABC Q-E i Q-F przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
