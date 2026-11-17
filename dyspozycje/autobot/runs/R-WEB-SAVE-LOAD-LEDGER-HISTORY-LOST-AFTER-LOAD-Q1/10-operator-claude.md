STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-LEDGER-HISTORY-LOST-AFTER-LOAD-Q1
GOAL: Dziennik „Skąd zapasy” (resourceLedgerHistory) po wczytaniu zapisu w nowej stronie ma tyle samo tur co w zapisie (3→3), a po ticku +1. Stary zapis bez pola = pusty dziennik bez błędu.
ZMIANY/COMMIT: baza 8f9250294 (origin/main, FALA 761).
  - gra/src/game/save.ts: deserializeGame przepisuje pole resourceLedgerHistory (1 linia + komentarz). PRZYCZYNA ŹRÓDŁOWA.
  - gra/tools/save-load-ledger-history-test.cjs (nowy): test regresji — statyczny + bundle esbuild + mutacja na kopii.
  - dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-LEDGER-HISTORY-LOST-AFTER-LOAD-Q1/10-operator-claude.md (ten raport).
  Allowlista zachowana: gra/src/game/save.ts (ścieżka wczytania/księgi), gra/tools/save-load-*.cjs, runs/<ID>/**. Nie dotknięto main.ts, resource-ledger.ts, WERSJE.md, manifestu, gra-robocza/, rust-port/.
PRZYCZYNA (ZMIERZONA W KODZIE, nie w przeglądarce): gra/src/game/save.ts, deserializeGame() (ok. l.686-760) składa obiekt SaveGame z JAWNEJ listy pól. Pole resourceLedgerHistory nie było na tej liście, więc każde wczytanie z magazynu (loadFromLocal -> deserializeGame -> restoreGameFromSave; main.ts loadGameFromSlot ok. l.48868) gubiło dziennik, choć serializeGame zapisywał go poprawnie (JSON.stringify całego obiektu). Zgodność z objawami: ta sama sesja omija deserializację (buildSaveGameSnapshot -> restoreGameFromSave), stąd round-trip 3→3 w tej samej sesji; nowa strona idzie przez loadFromLocal, stąd 0 wpisów przed tickiem. restoreLedgerHistoryFromSave (resource-ledger.ts:444) i readLedgerHistoryTurns działają poprawnie; prepareSessionForLoad (main.ts:10237) czyści dziennik PRZED restore, nie po nim.
TESTY:
  - tsc --noEmit: exit 0 (brak błędów).
  - logic-test: LOGIC OK (213/213), exit 0.
  - tech-tree-test: 20 pass, 0 fail, exit 0.
  - research-test: ALL GREEN, exit 0.
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
  - combat-test: All sanity checks passed, exit 0.
  - resource-ledger-save-history-test: 15 passed, 0 failed, exit 0.
  - load-game-regression-test: 34 PASS / 0 FAIL, exit 0.
  - save-load-player-owned-city-test: RESULT: PASS, exit 0.
  - save-load-roundtrip-state-drift-test --static-only 1: SAVE-LOAD ROUNDTRIP OK, exit 0.
  - save-load-ledger-history-test (NOWY): 4 PASS / 0 FAIL, exit 0. Mutant (linia z polem usunięta z kopii save.ts): czerwony, "resourceLedgerHistory nie jest tablicą po deserializeGame".
  - git diff --check: exit 0.
  - Pomiar live (Chromium, krok po kroku wg GOAL 1): NIE ZMIERZONO. Przyczyna ustalona statycznie i potwierdzona testem na prawdziwym serializerze/deserializerze (bundle esbuild) oraz mutacją; harness live (save-load-player-owned-city-live.cjs --mode 432) NIE został uruchomiony (wymaga vite build + Chromium, poza zakresem tej rundy).
BLOKADY: brak. Brak pomiaru live w przeglądarce (patrz TESTY); zalecane potwierdzenie live (tryb 432) po wdrożeniu.
RUNDY: 1/5. Ostatni werdykt: n/d (Operator).
NASTĘPNY KROK: Evaluator (SONNET) — przegląd zmiany w save.ts (1 linia + komentarz) i testu; Final Control; opcjonalnie live 432 na zbudowanym dist poza repo (weryfikacja 3→3 i +1 po ticku).
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
  - W origin/main nie ma pliku dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-LEDGER-HISTORY-LOST-AFTER-LOAD-Q1/00-dispatch.md (git show zwraca "does not exist"). Treść tematu odczytano z przekazanego opisu zadania i z DODATKU na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (00-dispatch-DODATEK-claude.md).
  - Zauważenie poza zakresem (nie działano): ten sam wzorzec „jawna lista pól" w deserializeGame może gubić inne pola SaveGame spoza listy. Warto zweryfikować, czy wszystkie pola zapisu są przepisywane — do rozważenia jako osobny temat, NIE wykonywane tutaj.
  - Live-test ponownie sprawdzający wczytanie w nowej stronie (tryb 432 z save-load-player-owned-city-live.cjs) nie był uruchamiany; zalecany w Evaluatorze lub osobnej rundzie.
