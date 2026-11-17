STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DATA-REPLACE-ARCHER-TO-SLINGER-Q1
GOAL: Łucznik (standard, Kamień, Typ=Distance) może zostać zamieniony przez „Zastąp” na Procarza (standard, Brąz, Typ=Slinger); dla Inków dostępny także Procarz (Huaracoc). Ten sam silnik dla gracza i AI. Kierunek wyłącznie Łucznik → Procarz.
BAZA: cb077b588ee37abcf210ed5c00e893de30aa27b9 (origin/main, FALA 778), checkout detached w worktree.

ZMIANY/COMMIT:
- gra/data/units.json: pole "Zastąp specjalnie" wpisu Łucznik: "—" → "Procarz/Procarz (Huaracoc)". Jedyna zmiana danych (bez liczb, zdrowia, ataku, kosztów).
- gra/tools/unit-replace-promotion-table-test.cjs: jawny wyjątek ARCHER_EXCEPTIONS dla Łucznik → {Procarz, Procarz (Huaracoc)} (poza tym reguła „tylko piechota” bez zmian); EXPECTED_TABLE rozszerzony o wpis "Łucznik". Bez tej zmiany test czerwieniłby na nowym wpisie (celowo — pinned table).
- gra/tools/unit-replace-archer-slinger-test.cjs (NOWY): 8 asercji na realnym availableReplacementsFor (bundlowanym esbuild) i realnym units.json.
- dyspozycje/autobot/runs/R-WEB-DATA-REPLACE-ARCHER-TO-SLINGER-Q1/10-operator-claude.md (ten raport).
- Nie zmieniono: src/ (silnik, UI, AI), rust-port/, gra-robocza/, WERSJE.md, manifest.

TABELA Z → NA (po zmianie; ZMIERZONO z units.json):
| Z | Na | Uwagi |
|---|---|---|
| Łucznik (Kamień, Distance, Standardowa) | Procarz (Brąz, Slinger, Standardowa) oraz Procarz (Huaracoc) (Brąz, Slinger, Specjalna, Inkowie) | ZMIENIONE |
| Łucznik egipski (Egipt, Kamień) | — | bez zmian (W zamian za: Łucznik) |
| Łucznik nubijski (Egipt, Brąz) | — | bez zmian |
| Łucznik sumeryjski (Sumer, Kamień) | — | bez zmian |
| Łucznik akadyjski (Sumer, Brąz) | — | bez zmian |
| Łucznik asyryjski (Asyria, Brąz) | — | bez zmian |
| Procarz (Brąz, Slinger) | — | bez zmian (brak kierunku odwrotnego) |
| Procarz (Huaracoc) | — | bez zmian |

Narodowi łucznicy NIE dostali wpisu (zgodnie z dispatchem: wpis tylko dla Łucznika standardowego). Do decyzji: czy Egipt/Sumer/Asyria mają dostać przejście na Procarza (wymaga osobnej decyzji właściciela).

TESTY (dokładne wyniki, surowe wyjście):
- npm ci w gra/ (71 pakietów, wymagane do esbuild; node_modules usuwane po pracy).
- npx tsc --noEmit → exit 0.
- node tools/unit-replace-archer-slinger-test.cjs → 8 OK, 0 FAIL (exit 0). Asercje: Brąz Łucznik→Procarz z kosztem >0; Kamień brak Procarza; Inkowie widzą Huaracoc, Rzym nie; brak drewna → Procarz znika; mutacja kopii (pole cofnięte do „—”) → Procarz znika (test czerwony bez wpisu); kierunek Procarz→Łucznik nie istnieje.
- node tools/unit-replace-promotion-table-test.cjs → PASS: 24 wpisów źródłowych, 55 krawędzi, brak cykli (exit 0).
- node tools/unit-replace-test.cjs → WSZYSTKIE TESTY ZIELONE (21/21), exit 0.
- node tools/unit-replace-army-multi-select-test.cjs → WSZYSTKIE TESTY ZIELONE (36/36), exit 0.
- node tools/unit-replace-full-cost-test.cjs → 39 passed, 1 failed, exit 1. FAIL: „performUnitReplace (gracz): pobiera PELNY Pieniadz + surowiec z puli panstwa” — asercja to regex po src/main.ts (slice funkcji performUnitReplace). Ten temat NIE zmienia src/main.ts ani src/game/unit-replace-execute.ts; zmieniono tylko units.json i tools. NIE ZMIERZONO na czystej bazie (nie uruchomiono testu na osobnym checkout cb077b588); wniosek „nie wynika z mojej zmiany” jest na podstawie zakresu diffu, nie pomiaru.
- node tools/ai-era-unit-promotion-test.cjs → 17 passed, 0 failed, exit 0.
- node tools/ai-unit-replace-same-rules-test.cjs → 45 passed, 0 failed, exit 0.
- Bramki referencyjne: node tools/logic-test.cjs → LOGIC OK (213/213); node tools/tech-tree-test.cjs → 20 pass, 0 fail; node tools/research-test.cjs → PASSED 33/33 ALL GREEN; node tools/combat-test.cjs → COMBAT TEST 6/6 pass; node tools/load-game-regression-test.cjs → 34 PASS / 0 FAIL. Wszystkie exit 0.
- git diff --check → czysto.
- (d) picker UI w Chromium 1280×720: NIE ZMIERZONO (nie uruchamiano przeglądarki w tym temacie).
- (c) wpływ AI: ZMIERZONO STATYCZNIE (kod), nie symulacją. Ścieżka AI (promoteAiUnitForEra → availableReplacementsFor, ta sama tabela): kandydat Procarz przechodzi filtr klasy aiReplaceKeepsArmyClass, bo armyClassOfTyp mapuje Distance i Slinger na tę samą klasę „dystans” (src/game/ai-army-composition.ts:49-51). Po wejściu w Brąz AI będzie mogła zamieniać łuczników na procarzy w upgradeAiUnitsForEra, z limitem 10% armii/turę i rezerwą utrzymania (bez zmian). Efekt ilościowy NIE ZMIERZONO (wymaga pomiaru w grze/harnessie).
- (f) nowy test regresyjny: gra/tools/unit-replace-archer-slinger-test.cjs. Repo nie ma pliku „stałej listy deployu” dla testów (grep po repo: nazwy testów występują tylko w tools/ i dyspozycje/); test dopisany jako plik i nie wpięty w żaden zewnętrzny manifest.
- (e) 5 bramek referencyjnych: zielone (patrz wyżej).

BLOKADY: brak blokad technicznych. Do decyzji właściciela (DECISION, nie blokuje merge):
1. Inkowie widzą OBA warianty: Procarz (standard) i Procarz (Huaracoc). Dispatch zakładał „dla Inków — tylko Huaracoc”. Ukrycie standardowego Procarza dla Inków wymagałoby zmiany w silniku (production.ts, availableReplacementsFor), poza tym tematem — NIE zrobiono, bo nie ma wymyślania nowego mechanizmu. Wpis zostawiony jak w tabeli powyżej.
2. Narodowi łucznicy (Egipt, Sumer, Asyria) nie mają przejścia na Procarza — wymaga decyzji.
3. Wpływ na AI (automatyczne awanse łuczników w Brązie) — do akceptacji właściciela przed deployem.

RUNDY: 1/5 (Operator, Haiku 5.5).
NASTĘPNY KROK: Evaluator (Sonnet) — weryfikacja diffu (units.json: tylko pole „Zastąp specjalnie”), wynik testów z tego raportu, ocena wyjątku w teście tabeli; FC po Evaluatorze. Orkiestrator decyduje o pytaniu ABC do właściciela w sprawie pkt 1–3.
UWAGI-DLA-ORKIESTRATORA:
- Dispatch w gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0 istnieje jako runs/.../00-dispatch.md; w origin/main tego pliku nie ma (git show origin/main: path does not exist). Wykonano wg treści z gałęzi claude.
- W worktree stoją ignorowane pliki buildów testów (gra/tools/.*-bundle.cjs, .*-entry.ts) — gitignore; sprzątane przy usunięciu worktree.
- Lista zadań sesji (reminder) zawiera wpis #458 dla tego tematu — bez zmian w tej rundzie.
DEPLOY/PUSH: NIE WYKONANO
