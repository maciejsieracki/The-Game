STATUS: PASS-WITH-NOTES (CZĘŚCIOWY r2: wykonano zapis dziennika N tur w zapisie gry (kryterium b); partia 3 (źródła łup/zwrot/miasto/dar), test zgodności 3 ziarna x 30 tur, hash z/bez księgi, pomiar tury, zrzuty Chromium i docs NIE WYKONANE)
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1
GOAL: „Skąd zapasy” partie 3–4 — w tej rundzie: kryterium (b) zapis->wczytanie zachowuje dziennik, stary zapis bez pola = pusty dziennik.
BAZA: fbfb5ba72 (FC r2 FAIL, kod 2888d6485/3467a19f9) + merge origin/main 06fcc8526 (FALA 734) — merge commit a341e5210 (czysty, bez konfliktów).
ZMIANY/COMMIT: allowlista zachowana; zmienione pliki:
- gra/src/game/resource-ledger.ts — NOWE: LedgerHistorySave, ledgerHistoryToSave() (kopia migawki N tur, niezależna od późniejszych mutacji), restoreLedgerHistoryFromSave(raw, N) (brak/zły kształt = pusty dziennik, pominięcie złych wpisów, przycięcie do N).
- gra/src/game/save.ts — pole OPCJONALNE resourceLedgerHistory w SaveGame (+ import typu). SAVE_VERSION bez zmian (pole opcjonalne, stare zapisy wczytują się).
- gra/src/main.ts — 3 minimalne wpięcia: import (2 nazwy), buildSaveGameSnapshot: `resourceLedgerHistory: ledgerHistoryToSave()`, restoreGameFromSave: `restoreLedgerHistoryFromSave(saved.resourceLedgerHistory, readLedgerHistoryTurns(...))` po `turn = saved.tura`. Zero wpływu na stan gry (dziennik nie czyta RNG ani nie mutuje miast).
- gra/tools/resource-ledger-save-history-test.cjs — NOWY, 15 asercji (zapis->JSON->odczyt, stary zapis, złe kształty, przycięcie N, migawka, mutacja).
- dyspozycje/autobot/runs/R-WEB-UI-RESOURCE-SOURCE-LEDGER-UI-AND-REST-Q1/10-operator-claude.md (ten raport).
Rozmiar pola w zapisie (3 tury, 2 właścicieli, testowy zestaw): 1072 B. Realny rozmiar przy N=10 i pełnej gospodarce: NIE ZMIERZONO.
Okno pending (pobory między tickami) NIE jest zapisywane — po wczytaniu opróżniane (resetPendingLedger, jak dotąd); to jawna decyzja z uzasadnieniem: pending to jeden tick niezaksięgowany, a zapis go nie odtwarza.
Poza zakresem / nietknięte: WERSJE.md, manifest, rust-port, kod E3c (szlak, main.ts ~40337), dokumentacja (docs/encyklopedia, PORADNIK), wikiBundle.

TESTY (surowe wyniki z tego worktree):
- `./node_modules/.bin/tsc --noEmit` (gra/): exit 0, brak linii błędów (po poprawce importu w save.ts).
- resource-ledger-save-history-test (NOWY): 15 passed, 0 failed (po poprawce 1 asercji oczekiwanej liczby ticków: null i string pomijane, 2 ticki zostają — zachowanie zgodne z kodem).
- resource-ledger-skad-ui-test: 18 passed, 0 failed.
- resource-ledger-test: 1030 passed, 0 failed.
- resource-ledger-consume-test: 30 passed, 0 failed.
- resource-ledger-trade-test: RESULT 29 passed, 0 failed.
- git diff --check: czysty.
- NIE ZMIERZONO: 5 bramek referencyjnych (logic/tech-tree/research/unit-replace/combat/unit-power) w tej rundzie — uruchomić przy integracji.
- NIE ZMIERZONO: zapis->wczytanie w realnej grze (test na prawdziwym buildSaveGameSnapshot/restoreGameFromSave wymaga harnessu gry; obecny test działa na czystych funkcjach + JSON round-trip).

RUNDY: 2/5 tego tematu (ten sam ID).

BLOKADY (jawna lista, NIE wykonane w tej rundzie):
1. Partia 3 — źródła niezaksięgowane (łup z bitwy, zwrot przy anulowaniu rekrutacji/budowy, zdobycie/oddanie miasta, dar/prezent). Kryterium (a) niespełnione. Wymaga osobnej rundy: grep creditOwnerResourceStock / deductBuildingStockCostAcrossCities / addOwnerResource + testy na realnej ścieżce + mutacja.
2. Test zgodności księgi z magazynem w realnej grze (≥3 ziarna x 30 tur, ledgerTestDebug) — NIE ZMIERZONO.
3. Hash stanu z księgą i bez księgi (3 ziarna) — NIE ZMIERZONO (hak setLedgerRecordingEnabled istnieje w main.ts, test nie napisany).
4. Pomiar czasu tury ≥3 powtórzeń (tick 100) — NIE ZMIERZONO.
5. Zrzuty Chromium „Skąd zapasy” (sól, ceramika, dwa rozmiary) i test DOM pełnego panelu — NIE ZMIERZONO w tej rundzie.
6. Docs: docs/encyklopedia, docs/PORADNIK-GRACZA, regeneracja wikiBundle (node tools/bundle-wiki-for-game.cjs) — NIE WYKONANO.
7. Wycinka lasu gracza (test 7j/7k tekstowy) — NIE RUSZANE w tej rundzie.
8. Decyzja ABC E3c (szlak) — nietknięta; księga nie ma źródła „szlak”.

NASTĘPNY KROK: runda 3 do TEGO SAMEGO ID: (1) partia 3 źródła + testy mutacyjne, (2) harness realnej gry (3 ziarna x 30 tur, ledgerTestDebug) z testem zgodności i hashem, (3) pomiar tury ≥3x, (4) zrzuty Chromium i DOM, (5) docs + wikiBundle. Rozważyć podział na dwa tematy (źródła+harness oraz pomiary+docs) — decyzja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- gra/node_modules w tym worktree to symlink do wf_1465bf01-f91-1/gra/node_modules (użyty tylko do tsc/esbuild; symlink usunięty przed commitem).
- Brak nowych sesji ani zadań utworzonych przez tego Operatora.
- Dispatch wskazywał kandydat fbfb5ba72 (FC r2 report) jako bazę, a kod FC w 2888d6485/3467a19f9; tu użyto fbfb5ba72 + merge origin/main, zgodnie z DODATKIEM.
