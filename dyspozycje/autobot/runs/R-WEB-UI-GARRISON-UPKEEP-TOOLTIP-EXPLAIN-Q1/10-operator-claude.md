STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI/tekst, prezentacja utrzymania)
TEMAT: R-WEB-UI-GARRISON-UPKEEP-TOOLTIP-EXPLAIN-Q1 (GARNTIP), runda 1/5, Operator HAIKU
GOAL: w podpowiedzi pozycji „Utrzymanie" karty budynku (Garnizon i pozostałe budynki z utrzymaniem złotem) oraz w liście budynków miasta pokazać „baza X × mnożnik silnika Y = Z", gdzie X, Y, Z pochodzą z tych samych stałych/funkcji co silnik. Dane bez zmian (wariant A). Tekst pojawia się tylko tam, gdzie baza ≠ wyświetlana wartość.

ZMIANY/COMMIT:
- gra/src/game/economy-upkeep.ts: nowa funkcja buildingUpkeepBreakdown() (base, fala2Mult, eraMult, total); buildingUpkeep() deleguje do niej (ten sam wynik); nowa buildingUpkeepExplanation() zwraca tekst „Utrzymanie: baza X × mnożnik silnika Y = Z Pieniądza/turę" albo null, gdy baza === wynik.
- gra/src/ui/entityCards/buildingAdapter.ts: wiersz „Co turę" (sekcja „Koszt utrzymania") niesie hint z buildingUpkeepExplanation(upkeepBreakdown).
- gra/src/ui/entityCards/types.ts: EntityCardRow.hint?: string.
- gra/src/ui/entityCards/renderer.ts: hint ustawia atrybut title na elemencie wartości wiersza.
- gra/src/ui/cityPanel.ts: lista budynków miasta (bld-owned-upkeep) dostaje title z tej samej podpowiedzi (pomijane dla wyłączonych budynków); import nowych funkcji.
- gra/tools/garrison-upkeep-tooltip-explain-test.cjs (nowy): 25 asercji.
- dyspozycje/autobot/runs/R-WEB-UI-GARRISON-UPKEEP-TOOLTIP-EXPLAIN-Q1/10-operator-claude.md (ten raport).
- Brak zmian w gra/data, WERSJE.md, gra-robocza; w silniku tylko refaktor buildingUpkeep bez zmiany wyniku.
- Commit: SHA w polu sha (czubek gałęzi detached od 3b1b123f2).

Wartości Garnizonu (test czyta je z silnika i buildings.json):
- X (baza utrzymania, poziom 1) = 2; Y = R_STAWKI_FALA2_MULT (2) × buildingEraCostMultiplier(epoka 1 = 1) = 2; Z = 4.
- Tekst: „Utrzymanie: baza 2 × mnożnik silnika 2 = 4 Pieniądza/turę".

TESTY (surowe liczby z wyjścia):
- npm ci --ignore-scripts w gra/: added 71 packages (brak node_modules w worktree przed startem).
- npx tsc --noEmit -p tsconfig.json: exit 0, 0 linii wyjścia (brak nowych błędów).
- node tools/garrison-upkeep-tooltip-explain-test.cjs: 25 OK, 0 FAIL, exit 0.
- Mutacja (kopia pliku buildingAdapter.ts, usunięte hint: upkeepHint): test FAIL „buildingAdapter: wiersz „Co turę" niesie hint", wynik 24 OK / 1 FAIL, exit 1; plik przywrócony z kopii (cmp identyczny).
- building-upkeep-ceramics-test: 645 passed, 0 failed.
- building-upkeep-resources-test: 47 passed, 1 failed (D10: asercja `stockResourceLabel(k)` w buildingAdapter.ts; w bazie 3b1b123f2 liczba wystąpień = 0, czyli PRZED tą zmianą; pre-existing).
- upkeep-test: 91 passed, 0 failed.
- budynek-garnizon-test: 83 pass, 0 fail.
- era-improvement-cost-upkeep-test: 52 pass, 0 fail.
- unit-resource-upkeep-test: 7 passed, 0 failed.
- citizen-resource-upkeep-test: 122 passed, 2 failed (kotwice w main.ts: „const ordPctRaw = evaluateOrderFromBreakdown(" — w bazie 0 wystąpień; main.ts nie zmieniany; pre-existing).
- Weryfikacja w przeglądarce (Chromium, zrzut tooltipu): NIE ZMIERZONO.

BLOKADY: brak blokad kodowych. Weryfikacja wizualna tooltipu w przeglądarce nie wykonana (NIE ZMIERZONO). Dwa czerwone testy (D10, citizen-kotwice) są długiem sprzed tematu, nie skutkiem tej zmiany.

RUNDY: 1/5 (wynik do oceny Evaluatora).

UWAGI-DLA-ORKIESTRATORA:
- Dispatch 00-dispatch.md istnieje tylko na gałęzi origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (nie na origin/main). Plik 00-dispatch-DODATEK-claude.md nie istnieje na żadnej z pobranych gałęzi; zadanie wzięte z 00-dispatch.md i treści rozkazu Workflow.
- Zakres „karty encji/Civpedii" (cityPanel buildBuildingDetailCard, wiersz „Utrzymanie (co turę)" w formatBuildingUpkeepGridValue) NIE został objęty: dispatch go wymienia, ale ta sekcja jest tekstowa bez hintu; do decyzji Evaluatora / kolejnej rundy.
- Zmiana obejmuje też budynki inne niż Garnizon (baza ≠ wynik dotyczy każdego budynku z mnożnikiem FALA2 ×2), zgodnie z dispatchem wyjaśnienie pojawia się tam, gdzie baza ≠ wyświetlana wartość.
- Test nie wymaga przeglądarki (bundle esbuild + odczyt kodu UI).

NASTĘPNY KROK: Evaluator (SONNET): przegląd diffu i testu; ewentualnie weryfikacja tooltipu w Chromium (wiersz „Co turę" Garnizonu i wiersz listy miasta).
DEPLOY/PUSH: NIE WYKONANO
