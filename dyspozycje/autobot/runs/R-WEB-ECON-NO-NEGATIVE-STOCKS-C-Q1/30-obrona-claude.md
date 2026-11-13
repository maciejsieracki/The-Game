# R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 — obrona Operatora (runda 2, odpowiedź na zarzuty FC r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ECON-NO-NEGATIVE-STOCKS-C-Q1 (podtemat C, etap C1: czysty moduł dźwigni AI + test; BEZ wpięcia w main.ts/ai.ts i BEZ runnera headless)
GOAL: zakres tej rundy = etap C1 z propozycji z 10-operator-claude.md (pure-helper + test + mutacja). Cel końcowy C (wpięcie w turę AI, runner 15×3×150, kryteria a–e) NIEZREALIZOWANY — patrz BLOKADY.
BAZA: start 9a6394a3b (origin/main 507d312ce + raport BLOCK r1).

## ZMIANY-COMMIT
- `gra/src/game/no-negative-stocks.ts` — dodane: interfejs `NnsAiLeverInput` i funkcja `buildAiLevers(input)`. Czysta funkcja: buduje `NnsLever[]` z opisu dźwigni AI. Jednostki obronne (ostatnie w mieście) dostają `eliminujeCywilizacje: true`, więc `planAiBalance` nigdy po nie nie sięga. Dźwignie z `zysk` <= 0 / NaN pomijane. Istniejące funkcje bez zmian.
- `gra/tools/no-negative-stocks-ai-test.cjs` — NOWY test (allowlista). 8 asercji: kolejność podatek → wstrzymanie → rozwiązanie od najdroższej; brak rozwiązania jednostek obronnych; pominięcie zysku <= 0/NaN; pokrycie; niepokrycie bez dźwigni; determinizm.
- Nie zmieniano: main.ts, ai.ts, no-negative-stocks-test.cjs, WERSJE.md, gra-robocza/, rust-port/.
- Commit zawiera: powyższe 2 pliki kodu + ten raport (dodane ścieżkami jawnie, bez `git add -A`).

## ODPOWIEDZI NA ZARZUTY FC (zarzut → decyzja → dowód)
1. Brak runnera `no-negative-stocks-headless-measure.cjs` / pomiaru 15×3×150 (kryt. a) → PRZYJMUJĘ. Nie zrobione w tej rundzie: runner wymaga haka w ścieżce tury AI (etap C2). NIE_ZMIERZONO.
2. `planAiBalance` nie wpięty w ai.ts/main.ts → PRZYJMUJĘ. Wpięcie świadomie poza zakresem C1 (wymaga przeliczenia `econ` przed blokiem „Bank treasury”, owner-aware disband, patrz r1 BLOKADY 2–5). Zachowanie gry bez zmian.
3. Kryterium (b) bez dowodu → PRZYJMUJĘ. NIE_ZMIERZONO.
4. Brak `ai-test` i testu kar deficytu przy wymuszonym minusie (kryt. c) → PRZYJMUJĘ częściowo. `ai-test` istnieje (8/0) i pokrywa warstwę czystą; test kar deficytu (kryt. c) NIE zrobiony.
5. Mutacja (kryt. d) → PRZYJMUJĘ częściowo. Wykonano mutacje na warstwie czystej (patrz niżej), nie na wyłączeniu równoważenia w turze (brak wpięcia).
6. Kryt. e → PRZYJMUJĘ. Wyniki w sekcji TESTY; ai-test zielony, ale kryteria a–d nadal niespełnione.
7. Runda 1 bez kodu → PRZYJMUJĘ. C1 zrobiony w tej rundzie (kod + test + mutacja).
8. Dispatch 00-dispatch.md tylko na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na origin/main → PRZYJMUJĘ jako uwagę procesową (nie zarzut do kodu). Operator odczytał pełny dispatch z tej gałęzi (`git show origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0:...00-dispatch.md`) i DODATEK z tej samej gałęzi.

## TESTY (surowe wyjście, HEAD po commicie; gra/ z `npm ci --ignore-scripts` rc=0; NIE uruchamiano build/dev)
- `npx tsc --noEmit` (gra/): rc=0, bez komunikatów.
- `node tools/no-negative-stocks-ai-test.cjs`: `no-negative-stocks-ai-test: 8 passed, 0 failed` (rc=0)
- `node tools/no-negative-stocks-test.cjs`: `no-negative-stocks-test: 25 passed, 0 failed` (rc=0)
- `node tools/no-negative-stocks-projection-test.cjs`: `no-negative-stocks-projection-test: 49 passed, 0 failed` (rc=0)
- `node tools/logic-test.cjs`: `LOGIC OK (213/213)` (rc=0)
- `node tools/tech-tree-test.cjs`: `tech-tree-test: 20 pass, 0 fail` (rc=0)
- `node tools/research-test.cjs`: `ALL GREEN` (rc=0)
- `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)` (rc=0)
- `node tools/combat-test.cjs`: `All sanity checks passed.` (rc=0)

## MUTACJE (warstwa czysta; plik po mutacji przywrócony z kopii, cmp = identyczny)
- M1: w `planAiBalance` usunięty filtr `!l.eliminujeCywilizacje` → `ai-test: 6 passed, 2 failed` (FAIL: „jednostka obronna nie jest rozwiązywana”, „brak dozwolonych dźwigni = niepokryte”). rc=1. CZERWONE, zgodnie z oczekiwaniem.
- M2: w `planAiBalance` usunięte porównanie rangi (`RANGA[...] - RANGA[...] ||`) → `ai-test: 6 passed, 2 failed` (FAIL: kolejność, „plan: podatek, potem j1”). rc=1. CZERWONE.
- Po przywróceniu: `ai-test: 8 passed, 0 failed` rc=0.

## BLOKADY (jawna lista — co nadal NIE jest zrobione)
1. Brak wpięcia w turę AI (main.ts/ai.ts) — etap C2. Bez tego `buildAiLevers` i `planAiBalance` nie są wołane z gry; zachowanie gry niezmienione.
2. Brak runnera headless 15 cywilizacji × 3 ziarna × 150 tur (kryt. a) i listy wyjątków.
3. Brak testu kar deficytu przy wymuszonym minusie (kryt. c).
4. Brak mutacji na flagę wyłączającą równoważenie w turze (kryt. d) — do zrobienia po C2.
5. Kryt. b (brak eliminacji przez równoważenie w symulacji) — NIE_ZMIERZONO.
6. Koszt `projectEmpireFoodAfterTick` (O(owners²)) — NIE_ZMIERZONO, do pomiaru przed C2.

## UWAGI-DLA-ORKIESTRATORA
- Status PASS-WITH-NOTES odnosi się WYŁĄCZNIE do etapu C1 (czysta warstwa). NIE jest to zamknięcie podtematu C ani kryteriów a–e. Orkiestrator decyduje, czy FC ma przyjąć C1 jako osobny krok, czy czekać na C2.
- Zmieniono `gra/src/game/no-negative-stocks.ts` (dodatek, bez zmian istniejących funkcji). Sprawdzić `git merge-base --is-ancestor 9a6394a3b <SHA>` przy integracji.
- Model: C2 dotyka main.ts/ai.ts i wymaga przeliczenia `econ` — zgodnie z dispatchem to temat dla SONNET na Operatorze z uzasadnieniem; decyzja orkiestratora.
- Dysk przed startem: 5,2 GB wolne (`df -h /`) przy instalacji gra/node_modules; node_modules w worktree nie jest częścią commita.

NASTĘPNY KROK: FC r2 na commit tej rundy (kod C1 + ai-test + raport); decyzja orkiestratora o C2.
DEPLOY/PUSH: NIE WYKONANO
RUNDY: 2/5 (r1: BLOCK bez kodu; r2: C1 + odpowiedzi na 8 zarzutów)
