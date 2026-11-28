STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-LOAD-CAMERA-Q1 (tag LOADCAM), obrona, runda 2/5 (Operator HAIKU 5.5)
GOAL: po wczytaniu zapisu wymagającego przebudowy mapy kamera wraca na stolicę gracza (dystans 22), a nie na ok. 316; stary zapis bez zmian formatu.
ZMIANY/COMMIT: baza kandydat 6f543acea (przywrócony przez git checkout --detach). Commit obrony: SHA w polu sha odpowiedzi orkiestratora (git log -1 w worktree). Zmienione pliki (git add ścieżkami):
  - gra/src/main.ts: blok `if (regeneratedMapForLoad)` w loadGameFromSlot; focusAt na stolicy wg capitalCityIdForOwner(ME()) zamiast pierwszego miasta gracza (zarzut 2). Zmiana tylko w kamerze po wczytaniu, format zapisu bez zmian.
  - gra/tools/load-camera-test.cjs: T4 wymaga capitalCityIdForOwner(ME()); nowy T6 (strażnik `if (capCityAfterLoad)`); M6 celuje w cities[0] przez capitalCityIdForOwner; nowa M7 (usunięty strażnik) czerwona.
  - dyspozycje/analizy/KAMERA-PO-WCZYTANIU-2026-11-28.md: opis stolicy, liczba sprawdzeń, jawne NIE ZMIERZONO dla warstwy dynamicznej roundtrip (zarzut 3).
  - dyspozycje/autobot/runs/R-WEB-LOAD-CAMERA-Q1/30-obrona-claude.md (ten raport).
ODPOWIEDZI NA ZARZUTY:
  1. Test live (Chromium) - PRZYJMUJĘ, bez poprawki w tej rundzie: live pozostaje NIE ZMIERZONO. Próby/powód: harness gra/tools/save-load-continuity-live.cjs w bazie 2b019d3e3 nie ma opcji --probe-camera (jest w ad1c64734); nie portowano go i nie wykonano segmentów <=590 s z zapisem t3 i wczytaniem hakiem/klikiem. Dowód po stronie FC: wymagany live probe przed READY_FOR_DEPLOY. Wzmocniono jedynie test statyczny (T6, M7), co nie jest dowodem zachowania w przeglądarce.
  2. Widok zamiast stolicy - PRZYJMUJĘ i poprawiono: blok if (regeneratedMapForLoad) w gra/src/main.ts używa teraz capitalCityIdForOwner(ME()) (definicja: gra/src/main.ts ok. l. 40258, ta sama zasada co bramki stolicy; ma fallback na najstarsze miasto gracza) i ustawia focusAt tylko gdy stolica istnieje. Zapis dalej nie przechowuje kamery, więc przywrócenie widoku sprzed zapisu nie jest możliwe (wariant zastępczy z dispatchu).
  3. Dokument, wiersz roundtrip - PRZYJMUJĘ: w dokumencie jawnie NIE ZMIERZONO (runda 1: FAIL (2) przez SIGSEGV Chromium w sub-runie ai-economy-measure-run.cjs, bez wyniku; w tej rundzie warstwa dynamiczna nie była uruchamiana).
TESTY (surowe wyniki tej rundy, worktree po npm ci --ignore-scripts):
  - node tools/load-camera-test.cjs -> "load-camera-test: PASS", exit 0 (T0-T6 OK; M1, M2, M3, M4, M6, M7, M5b czerwone).
  - npx tsc --noEmit -> exit 0.
  - logic-test -> LOGIC OK (213/213).
  - tech-tree-test -> 20 pass, 0 fail.
  - research-test -> PASSED: 33 / FAILED: 0.
  - unit-replace-test -> WSZYSTKIE TESTY ZIELONE (21/21).
  - combat-test -> COMBAT TEST: 6/6 pass.
  - ai-test -> ai-test: 297 passed, 0 failed.
  - save-load-ai-cs-absorption-state-test -> WYNIK: 27 PASS / 0 FAIL.
  - save-load-ai-state-fields-test -> WYNIK: 29 PASS / 0 FAIL.
  - save-load-player-owned-city-test -> RESULT: PASS.
  - save-load-sort-test -> OK (4/4).
  - save-load-ledger-history-test -> 4 PASS / 0 FAIL.
  - save-load-budowa-priorytet-on-load-test -> 6 PASS / 0 FAIL.
  - Test live: NIE ZMIERZONO (patrz zarzut 1).
  - Warstwa dynamiczna save-load-roundtrip-state-drift-test: NIE ZMIERZONO.
BLOKADY: (1) brak pomiaru live po wczytaniu (kamera nie potwierdzona w przeglądarce); (2) warstwa dynamiczna roundtrip bez wyniku (SIGSEGV Chromium w rundzie 1); (3) widok ustawiany na stolicę, nie na widok sprzed zapisu (ograniczenie zapisu).
RUNDY: 2/5. Ostatni werdykt Evaluatora: PASS-WITH-NOTES (commit 1a909d9b3). Zarzuty 1-3 odpowiedziane powyżej.
NASTĘPNY KROK: Final Control: live probe (port --probe-camera z ad1c64734 lub równoważny), zrzut ekranu po wczytaniu, warstwa dynamiczna roundtrip (<=3x przy SIGSEGV). Dopiero po nich READY_FOR_DEPLOY.
UWAGI-DLA-ORKIESTRATORA: (a) node_modules w gra/ zainstalowane przez npm ci --ignore-scripts (ignorowane przez .gitignore); (b) nie uruchamiano npm run build/dev; (c) nie integrowano, nie pushowano.
DEPLOY/PUSH: NIE WYKONANO
