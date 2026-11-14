# R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1 — raport Obrony (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-TRUST-WAR-N6-CLEANUP-Q1
GOAL: usunięcie martwego pola p6.kryzysTurDoWojny z JSON, N hamulca wojny wyłącznie z profilu wojny pary, opis w Civpedii (zaufanie 0 w wojnie, N zależne od pary, bez stałego 6).
ZMIANY/COMMIT: baza kandydata 3c3a21ed8 (origin/main 96c30f2c4 niezintegrowany). Commit obrony: zmiana wyłącznie w gra/tools/diplo-trust-war-n6-cleanup-test.cjs (+ ten raport). Kod gry NIE zmieniony.
TESTY: patrz sekcja ODPOWIEDZI NA ZARZUTY i tabela bramek poniżej.
BLOKADY: brak. Niezmierzone: merge z origin/main na żywo (tylko dry-run git merge-tree), build w przeglądarce (nie dotyczy zmiany).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 na commicie obrony; integracja orkiestratora (merge z origin/main wymaga regeneracji wikiBundle narzędziem i ponownych bramek).
DEPLOY/PUSH: NIE WYKONANO

## ODPOWIEDZI NA ZARZUTY EVALUATORA

### Zarzut 1 (niski) — test sekcja 2 tautologiczna, tylko N=4 i 7 — PRZYJMUJĘ
- Poprawka: sekcja 2 obejmuje teraz pełny zakres profilu N=3..7 (pętla `2.3`..`2.7`) oraz przypadek bez jawnego N (`2x`, wojna nie wyzwala się).
- Dowód mutacyjny: wstawienie pola `"kryzysTurDoWojny": 5` z powrotem do gra/data/diplomacy-tick-params.json daje `FAIL 1a: p6 nie ma kryzysTurDoWojny` i `16 pass / 1 fail` (przywrócono git checkout).
- Zastrzeżenie uczciwe: sekcja 2 nadal nie uruchamia main.ts (plik TS w przeglądarkowej pętli). Wiązanie `kryzysTurDoWojny: w.n` sprawdza sekcja 1d (sprawdzenie źródła) i tsc (punkt 2). Wartość N z hamulecN profilu nie jest testowana na żywo (NIE_ZMIERZONO w runtime).
- Wynik: `diplo-trust-war-n6-cleanup-test: 17 pass / 0 fail` (był 13/0).

### Zarzut 2 (niski) — typ WarBrakeP6Params nadal wymaga kryzysTurDoWojny — ODRZUCAM (dowód)
- Wymaganie N w typie jest zamierzone: crisisStepForPair / advanceCrisisCounter muszą dostać N jawnie. Typ nie jest typem JSON: `diplomacyTickParams.p6` (main.ts:12154) jest wnioskowany z JSON, który NIE zawiera pola.
- Dowód (mutacja tymczasowa, przywrócona): usunięcie `kryzysTurDoWojny: w.n` z main.ts:12183 daje błąd tsc:
  `src/main.ts(12183,94): error TS2345: ... Property 'kryzysTurDoWojny' is missing in type '{ kryzysProgZaufania: number; kryzysOstrzezenieTurPrzed: number; }' but required in type 'WarBrakeP6Params'.`
  Czyli brak wiązania N z profilu jest wyłapywany przez tsc, nie tylko przez komentarz. Dodatkowy alias typu (Omit) nie zmieniłby zachowania, więc nie wprowadzono.

### Zarzut 3 (informacyjny) — licznik w wojnie vs brzmienie dispatchu — ODRZUCAM (zgodność z kodem)
- Kod: diplomacy-tick-war-brake.ts:209 — `if (atWar) return { counter: 0, ... }`; para w wojnie ma licznik 0.
- Civpedia docs/encyklopedia/pojecia/wypowiedzenie-wojny.md:43 — „w wojnie ... licznik kryzysu nie liczy: para w wojnie ma licznik 0”. Opis zgodny z kodem.
- Dispatch „licznik kryzysu liczy tury do wypowiedzenia wojny” dotyczy fazy PRZED wojną (kryzys → N tur → wypowiedzenie). Opis w Civpedii nie zmienia tego. Rozstrzygnięcie terminologii: orkiestrator (ABC nr 18). Bez zmiany kodu i tekstu.

### Zarzut 4 (informacyjny) — brak merge z origin/main 96c30f2c4 — PRZYJMUJĘ jako notę (bez integracji przez Obronę)
- Merge-base HEAD z origin/main = 421e47dff (nie 03f39f0ad). Dry-run `git merge-tree --write-tree HEAD origin/main` → exit 0 (czysto, bez konfliktów; drzewo nie zmienione).
- Integracja (merge + regeneracja wikiBundle narzędziem + bramki) należy do orkiestratora; Obrona nie integruje.

## TESTY (surowe wyniki, ten sam worktree, po commicie obrony)

| Komenda | Wynik |
|---|---|
| `npx tsc --noEmit` (gra/) | 0 błędów (brak wyjścia) |
| `node tools/logic-test.cjs` | LOGIC OK (213/213) |
| `node tools/tech-tree-test.cjs` | tech-tree-test: 20 pass, 0 fail |
| `node tools/research-test.cjs` | PASSED: 33 / FAILED: 0 / TOTAL: 33 — ALL GREEN |
| `node tools/unit-replace-test.cjs` | WSZYSTKIE TESTY ZIELONE (21/21) |
| `node tools/combat-test.cjs` | COMBAT TEST: 6/6 pass — All sanity checks passed. |
| `node tools/diplo-trust-war-n6-cleanup-test.cjs` | 17 pass / 0 fail (było 13/0) |
| `node tools/diplo-tick-war-brake-unit-test.cjs` | 69 pass / 0 fail |
| `node tools/diplo-tick-war-brake-mutation-test.cjs` | 17 pass / 0 fail (baza + 16 mutantów) |
| `node tools/json-descriptions-sync-test.cjs` | 19 pass / 0 fail |
| `git diff --check` | czysto (exit 0) |

Uwaga: node_modules w gra/ zainstalowane przez `npm ci` w worktree (nie `npm run build/dev`); do usunięcia przy sprzątaniu.
