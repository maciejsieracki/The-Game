STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EVENTS-ONE-TURN-LIFETIME-Q1
GOAL: wydarzenie informacyjne zyje jedna ture gracza; nieprzeczytane/nieusuniete znika przy przejsciu tury i nie wraca; w nowej turze tylko wydarzenia tej tury.
ZMIANY/COMMIT: 88e3d0e56 (kod + test silnika) oraz commit raportu/testu live (SHA ponizej w sekcji COMMIT-2). Baza: origin/main 8c0fb5766.
  Pliki: gra/src/game/event-lifetime.ts (NOWY: stampEventTurn, isEventLiveInTurn, expireEventsBeforeTurn), gra/src/ui/sidePanelHud.ts (pole opcjonalne turnCreated), gra/src/main.ts (13 producentow stempluje turnCreated; expireInformationalEventsBeforeTurn(turn) tuz po turn++ przed dismissedSidePanelEventIds.clear(); hak seedEvents stempluje), gra/tools/events-one-turn-lifetime-test.cjs, gra/tools/events-one-turn-lifetime-live-test.cjs. Zero zmian w gra-robocza, WERSJE.md, rust-port, src-tauri, battle.

POMIAR PRZED (plik:linia z origin/main) i tabela kategorii
Przed: tylko warEventLog (main.ts:9429, cap 8) NIE byl czyszczony co ture; pozostale dzienniki zerowane przy turn++ (main.ts ~35205-35220).
| kategoria | klasa | trwalosc dzis | po zmianie |
| war-*, elim-cs-*, capture-*, era-*, tech-done-*, eot-hint-* (w tym handel AI-AI, dyplomacja informacyjna), edu-veteran | informacyjne | warEventLog: przezywa tury (do cap 8) | wygasa na granicy tury |
| village-*, trade-new/lost-*, auto-ration-t*, border-march-* | informacyjne | zerowane co ture (juz 1 tura) | to samo, teraz przez wspolny sweep + turnCreated |
| revolt-warn-/revolt-, prod-empty-, diplo-pend-*, negot-* | decyzyjne | liczone na zywo w collectTurnEvents, nie sa wpisami dziennika | bez zmian (nie wygasaja) |
| modale kolejki eventDeferQueue (tech-discovery, wonder-completed, city-capture), pendingEraChangeToast, deferredMergePrompts | chwilowe, odpalane na starcie tury | flush przy starcie tury, czyszczone przy resecie | bez zmian (nie sa trwale) |
Klasyfikacja jednoznaczna, DECYZJA_WYMAGANA nie zachodzi.

ZALOZENIA (bez ABC): (a) decyzyjne = blocking:true z zywego stanu, nietkniete; sweep dodatkowo nigdy nie usuwa wpisu blocking. (b) wydarzenia z faz AI/odroczone (deferredEotHints, ration) dopisywane PO turn++ dostaja turnCreated=nowa tura i zostaja. (c) zapis/odczyt: dzienniki nie sa zapisywane w save (NIE_ZMIERZONO inny kanal, grep po warEventLog w save: brak), wpis bez turnCreated wygasa bez bledu przy najblizszym przejsciu tury. (d) licznik w naglowku panelu liczy sie z listy kart (sidePanelHud.ts:708-714), wiec jest zgodny; osobnej odznaki nieprzeczytanych nie ma. Hot-seat: reset dziennikow przy zmianie fotela juz istnial (KROK 3), sweep dziala per tura gry.
Uwaga: "przeczytane" nie jest osobnym stanem w grze, wiec wygasa tak samo jak nieprzeczytane.

TESTY
- tsc --noEmit: EXIT=0 (gate-tsc.txt).
- gra/tools/events-one-turn-lifetime-test.cjs: 25 OK / 0 FAIL (gate-unit.txt). Pokrycie: N->N+1, dismiss, odroczone z AI, blocking zostaje, brak turnCreated, hot-seat (symulacja), kontrakt zrodlowy main.ts.
- RED na baseline main.ts: 17 OK / 8 FAIL. Mutacje: brak sweepu, brak jednego stampu, off-by-one (> zamiast >=), wygasanie blocking: kazda czerwona (po 1-2 asercje).
- Chromium ?civTest=1 (vite build poza repo, realny __civTest.endTurn): gate-live-after.txt 8 OK / 0 FAIL; baseline (dist-before): 1 FAIL na "dziennik silnika nie zawiera kart ze starej tury" (gate-live-before-RED.txt) - stare karty przezywaja.
- Regresje (tools/*event*, *eot*, *toast*, *notify*, *side-panel*, *era-change*, *end-turn*), 14 skryptow node PRZED vs PO: identyczne; 3 FAIL istniejace identycznie na baseline: end-turn-modal-sequencing-test, era-change-toast-defer-test, load-fail-toast-zindex-test (kotwice tekstowe main.ts). Przegladarkowe z --dist: sidepanel-event-przekierowania 48 pass/3 fail identycznie PRZED i PO (elim-cs-12-7). NIE_ZMIERZONO: sidepanel-blocking-card-cutoff, sidepanel-diplo-dismiss (timeout 240 s po obu stronach nie sprawdzony), end-turn-gameplay-runtime, end-turn-input-stability, era-change-toast-live, events-defer-to-turn-start, hint-toast-zindex, sidepanel-hud-deadzone, sidepanel-event-header (brak --dist/limit czasu).
BLOKADY: brak. Uwaga: asercja DOM kart starej tury w Chromium nie jest rozstrzygajaca (karta decyzyjna prod-empty zaslania liste, seedEvents zeruje dziennik) - dowodem jest dziennik silnika. Drugi live end-turn zablokowany kartą prod-empty (zachowanie istniejace), zweryfikowano ze blokada trzyma ture, a info bez zmiany tury nie wygasa.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (zweryfikowac pominiete bramki przegladarkowe i 3 baseline FAIL jako istniejace).
DEPLOY/PUSH: NIE WYKONANO
