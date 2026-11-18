STATUS: DECISION_REQUIRED
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-FORCED-PEACE-WINDOW-AUTO-OPEN-Q1
GOAL: ustalić przyczynę braku samoczynnego okna „Pokój wymuszony” po końcu tury i naprawić ją bez zmiany logiki pokoju (runda 1/5, Operator HAIKU).
BAZA: 899667a91e23fa3a796412a485b77a3da30221f4 (origin/main), HEAD worktree = ta sama baza (merge-base --is-ancestor: OK).

ZMIANY-COMMIT: brak zmian w kodzie gry. Commit zawiera wyłącznie ten raport. Hak `pendingForcedPeaceForTest` i tymczasowe logi diagnostyczne zostały cofnięte (git checkout gra/src/main.ts); test żywy nie został zmieniony.

TESTY (zmierzone na surowym wyjściu):
- Build vite poza repo (scratchpad/fpb), 17,6 s, exit 0.
- Test żywy diplo-forced-peace-pending-live-paths-test.cjs na bazie: exit 1, asercje FAIL: 4 (S4 „okno pojawia się samo” FAIL; S2 „pierwsze okno samo” FAIL; S2 „drugie okno po akceptacji” FAIL; S2 „po akceptacji pierwszego nadal zablokowane” FAIL). Zgodne z dispatchem (dziś czerwony, 4 FAIL). S1/S5 NIE ZMIERZONO (brak haka).
- Sonda DOM (probe2, Chromium, 2 tury z wojną 40 tur, bez zmian w kodzie):
  * tura 1→2: tick zwraca outcome „none”, pb-overlay (bitwa AI) otwarta przy końcu tury, pending pusty, okno brak;
  * tura 2→3: tick zwraca „forced_peace” (deferred=true), pending = [{pairKey 0_1, loser 1, winner 0, turnCreated 3}], okno `.cd-forced-peace-ok` = 1 bez jakiejkolwiek akcji gracza (pb-overlay = 0).
- Pozostałe testy (diplo-forced-peace-pending-test, weariness, tsc, 5 bramek referencyjnych, git diff --check): NIE ZMIERZONO — brak zmiany kodu, nie było czego weryfikować.

USTALENIA (przyczyna):
1. Okno jest tworzone i pokazywane automatycznie w tej samej pipeline'owej turze, w której pojawia się oczekujący pokój (tick w runAiPhase → showNextPendingForcedPeace, main.ts ~39259). Nie zaobserwowano, by okno znikało po utworzeniu (żadne `.remove()` na overlayu poza własnymi handlerami diplomacyAudience.ts).
2. Brak okna po końcu tury w scenariuszu testu wynika z odroczenia przez bitwę: src/game/war-weariness.ts:391 — gdy `wearinessForcedPeaceDue(...) && d.battlePending` → `none()`; pokój wymuszony jest odraczany na następną turę (decyzja ABC orkiestratora z komentarza). W sondzie tura 2 kończyła się z otwartą bitwą AI (pb-overlay=1), tick zwrócił „none”, a pending pojawił się dopiero w turze 3.
3. Test S4 zakłada okno po PIERWSZYM końcu tury (1→2), czyli w chwili, gdy pokój jest już „due”, ale jeszcze odroczony. Test czeka 90 s bez kolejnej tury, więc okno nie ma skąd się pojawić. Esc w teście „odsłania” okno dopiero po kolejnym przejściu (zgodne z obserwacją: pending pojawia się przy następnym ticku).
4. Komentarz main.ts ~41664 („wraca na wierzch na początku tury gracza”) dotyczy kolejki, która już istnieje; nie obejmuje przypadku „due, ale odroczone przez bitwę” — w tym przypadku w ogóle nie ma wpisu w kolejce do przywrócenia.

WNIOSEK: nie znalazłem defektu w main.ts, który wymagałby poprawki w allowliście. Rozbieżność dotyczy reguły odroczenia (war-weariness.ts, poza allowlistą i w ZAKAZIE tematu) oraz oczekiwania testu. Dalsza naprawa wymaga decyzji właściciela, nie zmiany kodu przez Operatora.

BLOKADY: (a) war-weariness.ts:391 jest poza allowlistą i ZAKAZ; (b) zmiana zachowania (pokój wymuszony wyskakujący od razu po zamknięciu bitwy, zamiast w następnej turze) zmienia logikę pokoju — wymaga ABC; (c) test S4 w obecnej formie oczekuje okna przy due+odroczonym pokoju.

DECYZJA DO PODJĘCIA (DECISION_REQUIRED), dwie opcje:
- A: po zamknięciu bitwy, gdy pokój był odroczony przez `battlePending`, ponownie uruchomić tick wojny (main.ts, po flushu kolejki preBattle) — zmienia moment pokoju o 0 tur, wymaga zmiany allowlisty o war-weariness.ts (wywołanie/flaga) i nowego testu;
- B: zostawić odroczenie, a S4 przepisać na oczekiwanie okna dopiero w turze, w której tick tworzy pending (test-only, bez zmiany gry).

ZALECENIE OPERATORA: B (najmniejsza zmiana, zgodna z ABC „odroczenie na następną turę”), o ile właściciel potwierdzi, że 1-turowe opóźnienie jest akceptowalne.

NASTĘPNY KROK: decyzja właściciela A/B; po niej Operator runda 2 (lub integracja testu).
RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana).
DEPLOY/PUSH: NIE WYKONANO
