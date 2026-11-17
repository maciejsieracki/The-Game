# R-WEB-TEST-DOC-DEBT-GENCAP-SZCZESCIE-LEFTOVERS-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS/GAME (tylko testy i dokumentacja; zero zmian w `gra/src`, `gra/data`)
TEMAT: R-WEB-TEST-DOC-DEBT-GENCAP-SZCZESCIE-LEFTOVERS-Q1
GOAL: (1) szczescie 11/23/31 -> 12/24/32 w dokumentacji i testach, gdzie liczby dotycza kompletow; (2) asercje limitu stosu i limitu Super-jednostki w tescie GENCAP, czerwieniace sie po mutacji.
BAZA: 16b0da6e566b6ef3cc77e40e8c5c009a8c20db6e (origin/main), worktree detached.

## ZMIANY-COMMIT

Commit kodu/dokumentacji: `2ab42a727` (zawiera dwa pliki):
- `gra/tools/general-capital-recruitment-order-test.cjs` — GENCAP-LIMITS:
  - limit stosu stolicy: wartosc czytana z `REAL.MAX_PER_SIDE` (`gra/src/battle/battleScene.ts`, przez loader zrodel); asercje: limit-1 jednostek na hexie stolicy -> zakup przyjety (kolejka 1); pelny hex (limit) -> zakup odrzucony, bez zmian zlota/Manpower/drewna/kolejki/transakcji.
  - limit Super-jednostki: definicja `Super-jednostka: TAK` z realnego `gra/data/units.json` (funkcja `firstSuperUnitDef`); asercje: pierwsza kopia przyjeta; druga kopia przy zywej pierwszej odrzucona bez zmian stanu; partia 2 sztuk odrzucona.
  - helper `addUnit` w harnessie (niegeneralska jednostka na hexie stolicy).
- `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md` — linie 21-22: komplet `11 / 23 / 31` -> `12 / 24 / 32` (katalog 44), "nie 11 / 26 / 39" -> "nie 13 / 29 / 42" (bez zwijania), z adnotacja o weryfikacji. Wartosci zweryfikowane odczytem `gra/data/buildings.json` (zwiniete: era1=12, era2=24, era3=32; bez zwijania: 13/29/42; katalog 44) — nie z pamieci. BUD 14/25/42 bez zmian (zgodne z `szczescie-przebudowa-skali-test.cjs` sekcja 2b).

Commit raportu: patrz SHA w polu `sha` odpowiedzi (czubek pracy).

## PRZEGLAD `rg -n "11 ?/ ?23 ?/ ?31|11/23/31"` (dyspozycje/, gra/tools/, docs/, gra/ bez node_modules)

Poprawione:
- `dyspozycje/BALANS-SZCZESCIE-SKALOWANIE-EPOK.md:21` — komplet szczescia (patrz wyzej).

Pozostawione z powodem:
- `gra/tools/szczescie-przebudowa-skali-test.cjs:179` — komentarz HISTORII wartosci (04660f9d1 = katalog 41 = 11/23/31); to celowy opis historii, nie stan biezacy.
- `gra/tools/szczescie-skala-normalizacja-test.cjs:571` — "31 budynkow" to parametr wejsciowy scenariusza (liczba budynkow w scenariuszu), nie twierdzenie o komplecie; nie zmieniany.
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md:5551` — wpis historyczny rejestru; nie edytowany.
- `dyspozycje/autobot/runs/*` (run-y R-WEB-TEST-DEBT-DECISIONS-ARCHERBEHIND-SZCZESCIE-Q1, R-WEB-TEST-DEBT-HARNESS-TRIAGE-B-Q1, R-SZCZESCIE-*, R-WEB-DATA-CITIZEN-*) — archiwalne raporty; nie edytowane.

Nie znaleziono:
- `gra/src/ui/civpediaOpenGate.ts:36` — plik NIE ISTNIEJE w tym drzewie (`gra/src/ui/` nie zawiera pliku civpedia gate), a `rg` nie znajduje w `gra/src` zadnego "11/23/31". Dispatch wskazuje nieaktualna lokalizacje; nic do zmiany.
- `docs/` — zero trafien 11/23/31.

## TESTY (surowe wyniki z tego worktree, po `npm ci` w `gra/`)

- GENCAP `node tools/general-capital-recruitment-order-test.cjs`: baseline przed zmianą: `PASS (0 failures)`; po zmianie: `general-capital-recruitment-order-test: PASS (0 failures)`, exit 0; nowe asercje: 7 (stack constant, stack limit-1 accepted, stack full rejected, super first accepted, super alive rejected, super batch rejected) — wszystkie PASS.
- MUTACJA M1 (kopia `main.ts`, `if (!hexHasRoomFor(...)) {` -> `if (false) {`): `FAIL: stack limit: a purchase is rejected when the capital hex is at the limit...`, `FAIL (1 failures)`, exit 1. Przywrocono z kopii; `cmp` OK.
- MUTACJA M2 (kopia `production.ts`, `superUnitLimitViolation` -> `if (false) return ...`): 2 FAIL (`second copy is rejected while one is alive`, `batch of two copies is rejected`), `FAIL (2 failures)`, exit 1. Przywrocono z kopii; `cmp` OK.
- `node tools/szczescie-przebudowa-skali-test.cjs`: `535 OK, 0 FAIL`, exit 0 (2b: 14/25/42, komplet 12/24/32 — zielone).
- `node tools/szczescie-skala-normalizacja-test.cjs`: `148 OK, 0 FAIL`, exit 0.
- Bramki referencyjne (R-PROC-AUTOBOT §6):
  - `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0, 0 linii `error TS`.
  - `node tools/logic-test.cjs`: `LOGIC OK (213/213)`, exit 0.
  - `node tools/tech-tree-test.cjs`: `20 pass, 0 fail`, exit 0.
  - `node tools/research-test.cjs`: `ALL GREEN`, exit 0.
  - `node tools/unit-replace-test.cjs`: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0.
  - `node tools/combat-test.cjs`: `All sanity checks passed.`, exit 0.
  - `node tools/unit-power-test.cjs`: `=== unit-power-test: 6 pass, 0 fail ===`, exit 0.
- Brak zmian w `gra/src`, `gra/data`, `gra-robocza`, `WERSJE.md` (`git status` pokazuje tylko 2 pliki z commita; `git diff --check` czysty).

## BLOKADY

Brak blokad technicznych. Uwagi do decyzji (nie blokuja):
- Operator nie zmienial `gra/src`; komentarz `civpediaOpenGate.ts:36` z dispatchu nie istnieje w drzewie (patrz wyzej).

## RUNDY

1/5. Ostatni werdykt: n/d (runda operatora). Brak FAIL/BLOCK.

## UWAGI-DLA-ORKIESTRATORA

1. Dispatch pobrany z `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0` (plik `.../R-WEB-TEST-DOC-DEBT-GENCAP-SZCZESCIE-LEFTOVERS-Q1/00-dispatch.md`); na `origin/main` tego pliku NIE ma. Plik `00-dispatch-DODATEK-claude.md` NIE istnieje ani na main, ani na galezi — dodatek orkiestratora (srodowisko, zakazy, stan) nie zostal odczytany; zadanie wykonano wg samego dispatchu i zakazow z tresci zadania.
2. Dodano `gra/node_modules` (npm ci, git-ignored) w worktree — do usuniecia przy sprzataniu worktree (dysk).
3. Przypadkowo zapisany stdout jednego uruchomienia testu GENCAP do pliku poza repo: `/home/user/tmp/x` (poza worktree, nieśledzony). Nie usuwalem (dispatch zakazuje rm); do sprzatania przez orkiestratora.
4. Kolejne lukę do rozważenia (poza zakresem, nie robione): `gra/tools/szczescie-skala-normalizacja-test.cjs:571` i komentarz `civpediaOpenGate.ts` z dispatchu — patrz wyzej; wpisy historyczne w run-ach pozostawione celowo.
5. Tematy `GENCAP` i `SZCZESCIE` mozna uznac za zamkniete po FC; FC powinien potwierdzic, czy ograniczenie do dwoch plikow (test + BALANS) jest zgodne z allowlista (dispatch wymienia `dyspozycje/BALANS-...` jako cel).

NASTĘPNY KROK: Evaluator (SONNET) -> Obrona (HAIKU, jesli FAIL) -> Final Control (SONNET). Integracja i push wykonuje orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
