STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1
GOAL: Usunac deadlock "Zakoncz ture" przy zalegajacej kolejce odlozonych bitew, tak aby zadna bitwa w kolejce nie blokowala konca tury bez ekranu.
RUNDY: 2/5 (Operator, odpowiedz na FAIL Evaluatora runda 1)
ZMIANY/COMMIT: baza 4eb67321 (Operator r1); commit r2 -- SHA w odpowiedzi orkiestratora. Pliki: gra/src/main.ts (flushDeferredPreBattleSafely, watchdog 50 ms + battleUiResolving, healStuck na wrapperze), gra/src/ui/preBattle.ts (PRZYWROCONE do fcd86933, zmiana usunieta), gra/tools/endturn-battle-deadlock-test.cjs (piny + czesc B5), dyspozycje/autobot/runs/R-WEB-ENDTURN-BATTLE-DEADLOCK-Q1/01-operator-r2.md. Brak push, brak deployu, WERSJE.md nietkniete.
TESTY:
- endturn-battle-deadlock-test: 29/0 (czesc B: realny ui/preBattle.ts przez esbuild+jsdom, w tym B5 wyjatek w showPreBattle).
- tsc --noEmit: czysto.
- vite build (bezposredni, do katalogu tymczasowego): OK, 35 s.
- heal-stale-blockers-pending-battle-test: 23/0.
- koniec-tury-g1-g2-runda4-test: 37/1 (jedyny FAIL A8 -- ten sam co na bazie, pin tekstowy).
- koniec-tury-f1-f4-runda3-test: 38/1 (jedyny FAIL F1-A3 -- ten sam co na bazie, kolejnosc wywolan nietknieta).
- logic-test: 213/213. barbarzyncy-krazenie-test: 249/0.
- NIE_ZMIERZONO w tej rundzie: barb-city-behavior, ai-test, war-allin-capital-test (nie uruchamiane po zmianach r2).
BLOKADY: brak twardych. Zarzut 1 (test wykonaniem monolitu main.ts w Chromium) NIE domkniety w tej rundzie.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
1. (test wykonaniem, nie tekstem) NIE_ZMIERZONO w pelni. Czesc B testu wykonuje REALNY ui/preBattle.ts (kolejka N=4, FIFO, odroczenie przy audiencji, wyjatek B5). Monolit main.ts (flushDeferredPreBattleSafely, watchdog, healStuck) jest nadal pinowany tekstowo. Scenariusz w Chromium (klik "Zakoncz ture" przy N bitwach, jedna rzuca) wymaga ruchu przez pelny kreator gry (wzorzec: tools/R-HOTSEAT-FOTEL2-CYWILIZACJA-BLEDNA-live-test.cjs) i haka do wstrzykniecia kolejki; odlozone na nastepna runde.
2. (brak scenariusza wyjatku) PRZYJMUJEM. Dodano flushDeferredPreBattleSafely(where) w main.ts: try/catch, console.warn z miejscem wywolania, hidePreBattle() po wyjatku. Uzyte w healStuck i w watchdogu. Dowod mechaniki: B5a-B5d (wyjatek w showPreBattle po shift(): element przepada, po hidePreBattle() brak ducha ekranu, kolejna bitwa AFTER-THROW pokazuje sie). Pin A5d sprawdza try/catch+warn+hide.
3. (przyczyna korzeniowa tylko czesciowo) CZESCIOWO. Udowodnione: sprzatacz byl za bramka (piny A9/F2-A11 czerwone na bazie, zielone po poprawce). NIE_ZMIERZONO: kto i kiedy zostawil kolejke niepusta bez ekranu w grze wlasciciela (tura 43) i czy WAR_ALLIN_CAPITAL zwieksza czestosc zalegania. Brak symulacji wielu bitew w jednej turze. Hipoteza pozostaje NIE_ZMIERZONO.
4. (allowlista preBattle.ts) PRZYJMUJEM. Zmiana isPreBattleOpen() -> isConnected COFNIETA (plik przywrocony do wersji fcd86933). Nie ma dowodu osieroconego overlayEl w grze. Pin A6 zmieniony na "preBattle.ts bez zmian". Test B2 (osierocony overlay) usuniety razem ze zmiana.
5. (brak raportu w runs/) PRZYJMUJEM. Ten plik jest zapisem etapu; orkiestrator powinien dodac go przez git add -f.
6. (pokazanie bitwy zamiast cichego czyszczenia) ODRZUCAM z dowodem. Kolejka w tym module zawiera bitwy NAJAZDOW NA GRACZA: main.ts ok. 28680 pokazuje komunikat "Wrog atakuje twoje wojsko!" i wola showPreBattle z onAuto/onBattlefield/onCancel dla wojska gracza (launchIncomingMapFieldBattle, wolane z ok. 35714 i 36385). Gracz jest stroną bitwy, wiec ekran jest wlasciwy. ZALOZENIE: nie ma sciezki AI<->AI wpisywanej do kolejki; NIE_ZMIERZONO co dokladnie wola showPreBattle w ok. 28032 i 30797. Prog 8 s i czyszczenie zachowane dla naprawde martwej kolejki.
7. (siatka: odstepstwa od dispatchu)
   (a) PRZYJMUJEM: watchdog z setTimeout 0 zmieniony na 50 ms (ponad jedna klatke), pin A5c zaktualizowany.
   (b) PRZYJMUJEM: dodano battleUiResolving do warunkow watchdoga.
   (c) ODRZUCAM retry przy endTurnInProgress: flush jest juz w finally endActiveHumanTurn() (main.ts ok. 36744, po endTurnInProgress=false w ok. 36726). Zalegajaca kolejka zostaje wznowiona tam, bez petli 0-ms timerow w trakcie tury.
8. (podwojne wolanie sprzatacza w triggerPlayerEndTurn) ODRZUCAM. Piny A9 i F2-A11 wymagaja wolania sprzatacza PRZED bramka w triggerPlayerEndTurn (usuniecie czerwieni te piny). Drugie wolanie jest idempotentne: po pierwszym flushu isPreBattleOpen()===true, a healStuck wraca przed progiem wieku.

ZALOZENIA: (1) kolejka = najazdy na gracza (pkt 6). (2) 50 ms jako "ponad jedna klatka" (dispatch pkt 2). (3) Pozostale testy (barb-city-behavior, ai-test, war-allin-capital) NIE uruchamiane po r2 -- zmiany dotycza tylko logiki kolejki i blokady konca tury.

NASTEPNY KROK: Evaluator (ponownie) na commicie r2. Otwarte: zarzut 1 (test wykonaniem monolitu w Chromium) i zarzut 3 (dowod przyczyny korzeniowej / rola WAR_ALLIN_CAPITAL). Rekomendacja: runda 3 Operatora na te dwa punkty.
DEPLOY/PUSH: NIE WYKONANO
