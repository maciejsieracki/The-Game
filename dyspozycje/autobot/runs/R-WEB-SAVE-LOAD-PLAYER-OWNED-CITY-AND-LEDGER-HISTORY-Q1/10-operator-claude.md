# R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1 — raport Operatora, runda 1/5

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SAVE-LOAD-PLAYER-OWNED-CITY-AND-LEDGER-HISTORY-Q1 (TaskList #432, #433)
GOAL: (A) #433 — odtwarzać `playerEverOwnedCityByOwner` z zapisu, żeby gracz z 0 miastami po wczytaniu nie był blokowany przy „Zakończ turę”. (B) #432 — ustalić, czy zanik dziennika „Skąd zapasy” po wczytaniu (5→0) to defekt gry, czy artefakt harnessu.
BAZA: c284fe02dd2bd8930a9920000488f10c8c8376ec (origin/main), worktree odłączony (detached).
UWAGA O DISPATCHU: plik `00-dispatch.md` nie istnieje w `origin/main` (git show zwraca fatal). Wykonano zadanie wg DODATKU `00-dispatch-DODATEK-claude.md` z gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`, który zawiera pełny opis GOAL/KRYTERIA/ALLOWLISTĘ.

## ZMIANY-COMMIT

Kod (allowlista: `gra/src/main.ts` tylko ścieżka zapis/wczytanie + flaga #433):
- `gra/src/main.ts`, `buildSaveGameSnapshot` → `meta`: dopisane `playerEverOwnedCityByOwner: Array.from(...)` WYŁĄCZNIE gdy zbiór niepusty (spread warunkowy). Bajty zapisu bez zmian, gdy zbiór pusty.
- `gra/src/main.ts`, `restoreGameFromSave` (po istniejącej heurystyce „ma miasto teraz”): gdy `saved.meta?.playerEverOwnedCityByOwner` jest tablicą, dodawane są elementy będące `number` i skończone (unia z heurystyką). Stary zapis bez pola → zachowanie dotychczasowe (sama heurystyka), bez wyjątku.
- Nowy test: `gra/tools/save-load-player-owned-city-test.cjs` (statyczny: sprawdza zapis, odczyt, zachowanie heurystyki; mutacja na KOPII pliku usuwająca odczyt daje FAIL).

Commit: SHA podany w polu `sha` odpowiedzi (commit tej rundy z raportem).

Nie zmieniano: `budowaPriorytetTypow`, semantyki księgi `resource-ledger`, WERSJE.md, manifest, gra-robocza/, rust-port/, bez `npm run build/dev`, bez `git add -A`.

## TESTY

Surowe wyniki w tej rundzie (worktree, po `npm ci` w `gra/`, 71 pakietów):
- `npx tsc --noEmit -p .` → exit 0, bez błędów.
- `node tools/save-load-player-owned-city-test.cjs` → 5 OK / 0 FAIL, `RESULT: PASS`, exit 0 (w tym mutacja kopii: odczyt usunięty → test widzi brak odczytu).
- `node tools/save-load-roundtrip-state-drift-test.cjs --static-only 1` → 10 OK, `SAVE-LOAD ROUNDTRIP OK`, exit 0.
- `node tools/load-game-regression-test.cjs` → `34 PASS / 0 FAIL`, exit 0.
- `node tools/resource-ledger-save-history-test.cjs` → `15 passed, 0 failed`, exit 0.
- Referencyjne (po `npm ci`): logic-test `LOGIC OK (213/213)`; tech-tree-test `20 pass, 0 fail`; research-test `ALL GREEN`; unit-replace-test `WSZYSTKIE TESTY ZIELONE (21/21)`; combat-test `All sanity checks passed.` — wszystkie exit 0.
- `git diff --check` → bez wyjścia (czysto).
- NIE ZMIERZONO: test dynamiczny w Chromium dla #433 (scenariusz „0 miast po wczytaniu → Zakończ turę”). Pokryty testem statycznym (dopuszczonym przez kryteria: „test statyczny + hak civTest”). Dynamiczny dowód pozostaje do wykonania.

## #432 — analiza (bez zmian w kodzie)

Ustalenia z kodu (nie z pomiaru na żywo):
- Zapis: `resourceLedgerHistory: ledgerHistoryToSave(...)` (main.ts ~39792) — pole zawsze obecne.
- Odczyt: `restoreLedgerHistoryFromSave(saved.resourceLedgerHistory, readLedgerHistoryTurns(data.econParams, _menuDifficulty))` (main.ts ~49096).
- `gra/data/econ-params.json` → `ekonomia_miasta.ksiega_zasobow_tury` = `{easy:10, normal:10, hard:10}`. Zatem `maxTurns` = 10 (nie 0). `readLedgerHistoryTurns` zwraca 10 dla każdego poziomu trudności, więc liczba tur NIE jest obcinana do 0 przez konfigurację.
- `restoreLedgerHistoryFromSave` (resource-ledger.ts:444) robi `resetLedgerHistory()`, potem `raw.slice(raw.length - keep)`; przy `raw` niebędącym tablicą wychodzi z pustym dziennikiem.
- `resource-ledger-save-history-test.cjs` (15/0) potwierdza, że round-trip zapis→odczyt zachowuje wpisy.

Wniosek (z kodu, NIE_ZMIERZONO na żywo): 5→0 nie wynika z obcięcia przez `readLedgerHistoryTurns` ani z błędu w `restoreLedgerHistoryFromSave`. Najbardziej prawdopodobna przyczyna to artefakt migawki harnessu (migawka `load-state` wykonana przed/poza `restoreLedgerHistoryFromSave` albo przed pierwszym tickiem, który dopisuje nowe wpisy), co pozostaje do potwierdzenia pomiarem w Chromium. Nie zmieniano semantyki księgi ani kodu gry dla #432.

## BLOKADY

- Brak pomiaru live w Chromium (dla #433 dynamicznego i dla #432) — nie wykonano w tej rundzie (pojedynczy Operator, bez potwierdzonego slotu na przeglądarkę; kryteria pozwalają na test statyczny dla #433). Do zrobienia w osobnym temacie lub w kolejnej rundzie.
- #432 bez dowodu „artefakt vs defekt”: wniosek opiera się na kodzie i testach, nie na migawce.

## RUNDY

1/5 (Operator, HAIKU 5.5). Brak eskalacji modelu.

## NASTĘPNY KROK

Evaluator/Final Control: zweryfikować diff `gra/src/main.ts` (dwa bloki: zapis warunkowy i odczyt po heurystyce) i nowy test; osobno zaplanować pomiar live w Chromium dla #433 (0 miast po wczytaniu → „Zakończ turę”) oraz dla #432 (migawka przed/po `restoreLedgerHistoryFromSave` przy N=10 z `econ-params.json`).

## DEPLOY/PUSH: NIE WYKONANO

## UWAGI-DLA-ORKIESTRATORA

- Dispatch `00-dispatch.md` nie istnieje w `origin/main` pod wskazaną ścieżką (zapytanie `git show origin/main:...` → fatal). Orkiestrator może chcieć go dopisać lub wskazać inną lokalizację.
- Brak zmian w `gra/` poza `gra/src/main.ts` i nowym testem.
