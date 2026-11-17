STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-BUDYNEK-GARNIZON-DUPLICATE-EXPORT-Q1
GOAL: `gra/tools/budynek-garnizon-test.cjs` buduje się i uruchamia; eksporty dopisywane do bufora esbuild tylko gdy brak ich w `cityPanel.ts`; bez zmian w `gra/src` i `gra/data`.

ZMIANY/COMMIT:
- Allowlista: `gra/tools/budynek-garnizon-test.cjs` (jedyny zmieniony plik kodu) + ten raport.
- Przyczyna: `cityPanel.ts:9304` ma już `export function renderBuildList(`; test dopisywał bezwarunkowo `export { buildBuildingDetailCard, renderBuildList };` → esbuild „Multiple exports with the same name renderBuildList". `buildBuildingDetailCard` (`cityPanel.ts:7842`) NIE jest wyeksportowane, więc to jedyny brakujący eksport.
- Poprawka: regex `export\s+(async\s+)?function\s+NAZWA\b` sprawdza każdą nazwę; dopisywane są tylko brakujące (dziś: `buildBuildingDetailCard`).
- Commit: SHA w polu `sha` odpowiedzi orkiestratora (commit z tym raportem i zmianą testu, bazowany na 1bb6f6e87).
- `git diff --stat origin/main -- gra/src gra/data`: pusty (0 linii).

TESTY:
- (a) `node tools/budynek-garnizon-test.cjs` (cwd `gra/`), etap budowania PRZECHODZI (brak błędu esbuild), test drukuje własny wynik surowo: `budynek-garnizon-test: 79 pass, 2 fail`, exit 1.
- Czerwone asercje (NIE ruszane, zgodnie z dispatchem, osobny temat):
  - `FAIL: [AI1] kotwica: ai.ts nadal zawiera listę \`const infraOrder = [ ... ];\`` (lista budów AI, `ai.ts::infraOrder`).
  - `FAIL: [E4] karta zawiera wiersz utrzymania` — tekst karty zawiera nagłówki i opis, ale wiersz utrzymania nie został rozpoznany przez asercję (pierwsze 200 znaków: „GarnizonEpoka KamieńJeden poziomAdministracjaWymaganiaWymaganiabrak — dostępny od startuOpisGarnizon to stała straż porządkowa…").
- (b) MUTACJA: bezwarunkowe `src += 'export { buildBuildingDetailCard, renderBuildList };'` → `src/ui/cityPanel.ts:12699:34: ERROR: Multiple exports with the same name "renderBuildList"`, exit 1. Po przywróceniu poprawki test znów buduje się (plik przywrócony z kopii, cmp zgodny).
- (c) `npx tsc --noEmit` (cwd `gra/`): exit 0.
- (c) 5 bramek referencyjnych: NIE_ZMIERZONO — dispatch nie wymienia ich nazw, a w tym kontekście nie odnalazłem listy; orkiestrator powinien je wskazać przy następnej rundzie.
- (d) `git diff origin/main -- gra/src gra/data`: pusty.
- Uwaga: `npm ci --ignore-scripts` w `gra/` (71 pakietów) wykonane tylko po to, by test znalazł `node_modules/esbuild` i `playwright`; `package-lock.json` nietknięty, nie commitowany.

BLOKADY:
- Dwie czerwone asercje ([AI1], [E4]) — poza zakresem tego tematu (dispatch: nie ruszać `src`, osobny temat). Nie osłabiano asercji.
- Dispatch `00-dispatch.md` istnieje tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (nie w `origin/main`); dodatek odczytany z tej gałęzi.

RUNDY: 1/5 (wynik: build naprawiony; 2 asercje czerwone → rekomendacja osobnego tematu)

NASTĘPNY KROK: Evaluator weryfikuje (a)–(d); orkiestrator decyduje o osobnych tematach dla [AI1] (kotwica `infraOrder` w `ai.ts`) i [E4] (asercja wiersza utrzymania w karcie Garnizonu) oraz wskazuje 5 bramek referencyjnych.

DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Sprzątanie: `gra/node_modules` zainstalowane w worktree (do usunięcia przez orkiestratora po zakończeniu tematu); `/home/user/The-Game/.claude/worktrees/wf_d67a8d01-ddb-1/../scratchpad-*.txt` i `scratchpad-garnizon-fixed.cjs` to pliki pomocnicze poza repo.
