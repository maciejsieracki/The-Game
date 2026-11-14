STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LIVE-VERIFY-WAVE-689-697-B1-AI-PEACE-GATE-TRACE-Q1
GOAL: rozstrzygnąć w żywej grze, dlaczego AI nie wysyła graczowi bezwarunkowego zaproponuj_pokoj przy zmęczeniu >= 0,8 (hak read-only pod ?civTest=1, bez zmian logiki gry).
ZMIANY/COMMIT: oceniany kandydat 3cc205e4a36d73876d43951c1ee5f90cd6537833 (potomek 081bcba43: potwierdzone `git merge-base --is-ancestor`). Diff 081bcba43..3cc205e4a: gra/src/main.ts (+68/-?; import warWearinessLevel, hak peaceTracePair/wiersz wejscie-decyzji/grantPlayerGold/grantPlayerFood/nnsGateBlocked, wszystko pod ?civTest=1 lub peaceTraceState.on), gra/tools/live-verify-wave-689-697-b1-peace-trace.cjs (flaga NOINTERVENE), pliki runs/<ID>/** (evidence, 10-operator, 30-obrona). Allowlista zachowana: brak zmian w gra/data, WERSJE.md, gra-robocza/, rust-port/. Brak zmian logiki gry (hak tylko odczytuje i dopisuje do peaceTraceState.rows). Uwaga integracyjna: origin/main (6e72c3c17) NIE jest przodkiem kandydata (main poszedł naprzód od bazy 081bcba43) - integracja wymaga merge-tree, zmiany dotykają tylko main.ts i jednego runnera.
TESTY (liczby z surowego wyjścia, uruchomione przeze mnie w worktree na 3cc205e4a, npm ci --ignore-scripts):
- node ./node_modules/typescript/bin/tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0
- unit-replace-test: 21/21
- combat-test: 6/6
- git diff --check 081bcba43..3cc205e4a: czysto
- Nie uruchamiałem własnego przebiegu na żywo w Chromium; oceniam evidence-r3-*.json (7 plików) przeliczone własnym skryptem (poniżej).
POMIAR WŁASNY (evidence-r3, digest per tura, 22 tury x 2 ziarna x [hak ON, OFF-a, OFF-b]; pageErrors 0 wszędzie):
- seed 271828: ON==OFF-a==OFF-b dla indeksów 0..16 (tury 2..18); pierwszy rozjazd na indeksie 17 (tura 19), i to RÓWNIEŻ między OFF-a a OFF-b (4f770d00 / 332f1308 / 4562e87e).
- seed 314159: identycznie do indeksu 17 (tura 19); rozjazd na indeksie 18 (tura 20), też OFF-a vs OFF-b.
- wiersz wejscie-decyzji: turnsAtWarAI 16 -> fatigueAI 0,80 (tura 17), kolejka queuedPeace = 1 od tury 17 na obu ziarnach (indeksy 15..21 = 1).
- peaceTracePair/filtry-warstwy: odczyty bez wstawiania do Map (przejrzany diff; defaultNeutralRelation i warStateFromRecord są czyste).
WERDYKT PER ZARZUT:
1. ODDAL. Hak nie jest źródłem rozjazdu: ON zgadza się z oboma OFF aż do tury 19/20, a OFF-a i OFF-b rozjeżdżają się w TYM SAMYM miejscu. Część o nie-read-only peaceTracePair była trafna i jest naprawiona w r3 (Map.get zamiast getDiploRelation/diplomaticContactEstablishedSet; potwierdzone w diffie). Niedeterminizm bez haka od tury 19/20 to osobne znalezisko (poza zakresem B1, patrz UWAGI).
2. ODDAL. Wiersz wejscie-decyzji (main.ts ok. l.43400-43420) rejestruje turnsAtWarAI i fatigueAI z tych samych wejść co ai.ts:7033 (warWearinessLevel na turnsAtWar, lostCities+zdobyte, turnsSinceCityChange). Wynik decideAIDiplomacy jest w wierszu filtry-warstwy jako raw. Dowód z decyzji: AI emituje zaproponuj_pokoj w T17 przy fatigueAI 0,80.
3. ODDAL jako uczciwe NIE_ZMIERZONO z konkretną blokadą: wariant bez ingerencji (NOINTERVENE=1) zatrzymuje się w T11 na bramce NNS (evidence-r3-kontrola-bez-ingerencji-271828.json), a Dodatek zezwala wyłącznie na dodatnie dosypki. Jedyna ingerencja runnera to dosypka złota/żywności w T11 (rejected 0, clicked 0), co jest zapisane jako założenie. Nie jest to defekt wytworu.
4. ODDAL (naprawione w r3): drugie ziarno 314159 uruchomione na kodzie końcowym, ON x1 i OFF x2 (evidence-r3-seed314159-*).
5. ODDAL. Zniknięcie wpisu przed T23 zgadza się z NEGOTIATION_EXPIRY_TURNS = 5 (diplomacy-proposals.ts:2528, wygasanie ustawiane w :2649 i :2687; T17+5=T22/23) na obu ziarnach; raport Operatora poprawiony w obronie. Kandydat (d) pozostaje NIE_ZMIERZONO (wojna deklarowana ręcznie).
6. ODDAL. Odwołanie do gate-*.log wycofane w obronie; endTurnInProgress to cap runnera (tury kończą się). Widoczność propozycji dla gracza w panelu (zrzut) pozostaje NIE_ZMIERZONO - nie jest to defekt dostarczonego wytworu, tylko niedomknięty punkt dispatchu ("jeśli propozycja powstaje, pokaż że gracz ją widzi") - przechodzi do UWAG.
Brak zarzutu ocenionego jako NAPRAW -> brak podstawy do FAIL.
KRYTERIA DISPATCHU: (1) PASS-WITH-NOTES: wskazano, że propozycja powstaje w T17 i trafia na stół (kandydaci a/b/c odrzucone dowodem z haka, e = wygaśnięcie wg reguły), symptom W80B NIE odtworzony w tym harnessie; (2) PASS: 2 ziarna; (3) PASS-WITH-NOTES: ON == OFF do pierwszego rozjazdu, który występuje także OFF vs OFF; (4) PASS: tsc + 5 bramek zielone; (5) PASS; (6) PASS.
BLOKADY: brak blokad integracyjnych. Otwarte (nie blokują): widoczność propozycji dla gracza (zrzut) NIE_ZMIERZONO; źródło niedeterminizmu OFF vs OFF od T19/T20 NIE_ZMIERZONO; kandydat (d) NIE_ZMIERZONO; wariant bez ingerencji zablokowany przez NNS.
RUNDY: FC po rundzie 3/5 (obrona r3), 1 ocena FC.
NASTĘPNY KROK: integracja orkiestratora SHA 3cc205e4a36d73876d43951c1ee5f90cd6537833 (merge-tree z aktualnym origin/main; zmiany: main.ts + runner + runs/<ID>); kod haka jest pod ?civTest=1, więc nie zmienia gry dla gracza. Bez deployu.
UWAGI-DLA-ORKIESTRATORA:
- Niedeterminizm ON/OFF i OFF/OFF od tury 19/20 na obu ziarnach przy tym samym ziarnie, w trybie przyspieszonym: koliduje z zamknięciami #346/#349/#362/#373; warto osobny temat diagnostyczny (hipoteza Obrony: czas rzeczywisty/timery EOT - niezweryfikowana).
- Task #376 (możliwy defekt: brak bezwarunkowej propozycji przy >= 0,8) nie jest rozstrzygnięty defektem: w tym harnessie propozycja pojawia się od T17. Jeżeli właściciel widział 0 propozycji, różnica leży w warunkach gracza spoza B1 (osobny pomiar B2 z zrzutem panelu Dyplomacja T17+).
- Wejście: tabela kandydatów a-e z raportu Obrony r3 zgadza się z evidence.
DEPLOY/PUSH: NIE WYKONANO
