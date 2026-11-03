STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-EVENTS-DEFER-TO-TURN-START-Q1
GOAL: modale informacji/odkryc generowane w fazie tur innych cywilizacji i PM pojawiaja sie dopiero na poczatku nowej tury gracza (wyjatek: dyplomacja).
ZMIANY/COMMIT: gra/src/game/event-defer-queue.ts (NOWY), gra/src/main.ts (emisja/odroczenie), gra/tools/events-defer-to-turn-start-test.cjs (NOWY), gra/tools/elimination-toast-merge-test.cjs (licznik call-site'ow przez wrapper Deferred, uzasadnienie: wywolania showCityCaptureNotice ida teraz przez wrapper). SHA: patrz commit zawierajacy ten plik (git log -1 -- ten plik).

## 1. Inwentarz kanalow (stan bazowy 57a7ada40)
- Toasty `showHintMessage` (302 wolania): JUZ odraczane w `endTurnInProgress` -> `deferredEotHints` -> dziennik Wydarzenia (main.ts showHintMessage, flush ~39511 `deferredHintsToSidePanelEvents`). Bez zmian.
- Toast epoki: `pendingEraChangeToastForNextTurn` + `flushPendingEraChangeToast` (juz odroczony).
- Scalanie armii (gracz): `promptMergeIfCoLocated` odracza w EOT (`deferredMergePrompts`), flush w `finally`. AI nie ma komunikatu scalania (promptMergeIfCoLocated wraca dla !isHuman). Bez zmian.
- Dziennik `warEventLog` (8 miejsc unshift): wpisy trwale, zapisywane; overlay przejscia tury zaslania panel w EOT. Bez zmian.
- WYCIEKAJACE (modal natychmiast w EOT) - NAPRAWIONE: (a) `showTechDiscoveryNotice` po auto-badaniu EOT (main.ts ~35363), po awansie epoki (~15671), nagroda nauki z chatki (~28825; chatki zbierane tez przez zwiadowcow w EOT); (b) `showWonderCompletedNotice` (3 miejsca: cud przegrany/wlasny/rywala; produkcja miast w EOT); (c) `showCityCaptureNotice` (2 miejsca, zdobycie przez gracza np. marsz zaplanowany wykonywany w EOT).
- Klikane przez gracza (openTechDoneEventLink, onOpenTechDetails, civElim z karty) - faza gracza, natychmiastowe.

## 2. Pomiar na zywo (Chromium, ?playtest=mapa&civTest=1, realny advanceSeat)
PRZED (baza): modal odkrycia tech. (Brazownictwo) widoczny t=3897ms z `endTurnInProgress=true` (faza ekonomii/tury przeciwnikow; poczatek tury gracza dopiero ~8000ms) -> wyciek.
PO: modal widoczny dopiero gdy `endTurnInProgress=false` (D2 PASS); gdy faza AI otworzyla bitwe (pb-overlay), modal czeka za nia i pokazuje sie po jej zamknieciu (D2b/D2d PASS); `openTechCompletion` w fazie gracza nadal natychmiastowy (D4 PASS).

## 3. Implementacja
Modul `event-defer-queue.ts` (FIFO `{seq,channel,ownerId,fire}`, `shouldDeferNotice` z wyjatkiem `diplomacy`, `flushFor(owner)`, `clear()`). main.ts: `emitOrDeferNotice`, wrappery `showWonderCompletedNoticeDeferred`/`showCityCaptureNoticeDeferred`, `flushDeferredNotices()` (no-op w EOT i przy otwartej bitwie/audiencji) wolane z `flushDeferredMergePrompts()` (wszystkie punkty odblokowania + finally tury), z `advanceSeat()` po `switchActiveHuman(nextSeat)` (hot-seat) i z `renderLoop` (O(1) gdy pusta; ponawianie za bitwa); `eventDeferQueue.clear()` w `resetEndTurnBlockers` (Nowa gra/wczytanie). Argumenty modali liczone w chwili zdarzenia (np. numer tury).
Zapis/wczytanie: kolejka jest zawsze oproznona w `finally` tury przed mozliwoscia zapisu przez gracza; trwale slady (`tech-done-*`, `era-*` w warEventLog) zapisuja sie normalnie; load/nowa gra czyszczy (brak duplikatow).

## ZALOZENIA / DECYZJA_WYMAGANA
- Z1: dyplomacja jest wyjatkiem (decyzja ABC); dzis zadne okno dyplomacji nie bylo wolane przez ten mechanizm, wiec zero zmian zachowania (kanal `diplomacy` w module oznaczony jako niedraczony).
- Z2: interaktywne okno bitwy (pre-battle), na ktorej decyzje czeka faza AI, NIE jest odraczane (gra wstrzymana na odpowiedzi) - to okno decyzyjne; odroczone modale czekaja za nim. DECYZJA_WYMAGANA tylko jesli wlasciciel chce takze to okno odroczyc (zmiana przeplywu gry, poza zakresem).
- Z3: hot-seat: wpisy niosa ownerId; wszystkie dzisiejsze emitery sa hard-kodowane na fotel 0. Znany dlug poza zakresem: `switchActiveHuman` czysci globalny `warEventLog` (niotagowany ownerem), wiec w 2+ fotelach dziennik EOT moze znikac - NIE_ZMIERZONO, nie dotkniete.
- Z4: kolejnosc: odroczone modale (kolejno wystapienia) przed pojedynczym promptem scalania armii.
- NIE_ZMIERZONO na zywo: wonder/city-capture/chatka w EOT (pokryte strukturalnie C2/C3 + jednostkowo).

## TESTY
- tsc --noEmit: EXIT=0.
- events-defer-to-turn-start-test.cjs: GREEN 38 OK / 0 FAIL (A jednostkowe 14, B mutacje 7/7 lamia, C strukturalne 9, D zywe 8). RED na bazowym main.ts: 27 OK / 9 FAIL (C1-C7, C9, D2 `eot=true` t=3897ms).
- Regresje (74 testow nie-live z wzorcow toast/notification/event/turn/army-merge/saveload/hotseat, PO): 35 niezerowych; PRZED (baza) te same 35 niezerowe poza: elimination-toast-merge (moja regresja, naprawiona: 56/0), hotseat-etap6f-part2-data (TIMEOUT pod obciazeniem, solo 24/0), hint-toast-zindex i hotseat-drugi-fotel (zle w obu stanach: EXIT=1 vs TIMEOUT). Pozostale ~32 awarie sa istniejace na bazie (przestarzale kotwice regexowe / srodowisko). 12 testow *live* nie uruchomione (poza budzetem czasu): NIE_ZMIERZONO.
- `git diff --check` czysty; node_modules i bundle w /dev/shm usuniete.

## BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator (weryfikacja Z2/Z3, ew. dodatkowy pomiar wonder/capture na zywo)
DEPLOY/PUSH: NIE WYKONANO
