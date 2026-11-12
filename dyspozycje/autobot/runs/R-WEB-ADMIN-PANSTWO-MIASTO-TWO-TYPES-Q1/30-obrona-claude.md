# R-WEB-ADMIN-PANSTWO-MIASTO-TWO-TYPES-Q1 — raport Obrony (Operator, Haiku), odpowiedź na zarzuty Evaluatora (report_sha 63c26bad2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ADMIN-PANSTWO-MIASTO-TWO-TYPES-Q1 (SILNIK #316)
GOAL: administrator Państwa (ulepszenia terenu) jako stan na właścicielu: jeden koszt utrzymania na Państwo, auto-ulepszenia w miastach gracza wg JEDNEGO trybu Państwa (Z4), administrator miasta buduje tylko w swoim mieście, migracja zapisu, bramka auto-ulepszeń, tsc zielone, bramki referencyjne zielone.

## Wejście

- Baza startowa: e67601e93 (kandydat r4). Worktree: gałąź `obrona-r4-two-types`.
- DODATEK orkiestratora: nie ma osobnego pliku `00-dispatch-DODATEK-claude.md`. Sekcja „## DODATEK orkiestratora — runda 2” oraz „## DECYZJA WŁAŚCICIELA (2026-11-12, ABC) — korekta Z4 i podział tematu” są na końcu `00-dispatch.md` na gałęzi `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`. Na `origin/main` katalogu runu nie ma. Zakres rozstrzygnięty z tych sekcji (Z4 = jeden tryb Państwa; SILNIK #316; PANEL/NAZWY #327 poza tym tematem).
- Allowlista rundy: `gra/src/game/city-administrator.ts`, `gra/src/game/auto-build-gate.ts`, `gra/src/main.ts`, `gra/src/ui/` (panel), `gra/data/city-administrator-params.json` (opisy), `gra/src/game/turn-economy.ts`, `gra/src/game/cities.ts`, nowe testy w `gra/tools/`.

## ZMIANY/COMMIT

- Kod: `1003bdc98be44dee02f3fe97ef7f2d330982c544` (nad e67601e93).
  - `gra/src/main.ts`: auto-ulepszenia (EOT gracza, ok. linia 40684) i migracja przy wczytaniu (ok. linia 47824) biorą tryb z polityki Państwa właściciela: `ulepszeniaEmpireForOwner(c.ownerId).tryb === 'auto'`. Wcześniej: `effectiveUlepszeniaForCity(c).tryb`, czyli tryb per miasto (override). Dodatkowo w gałęzi „OFF” przy wczytaniu przywrócono `delete ... administratorUlepszen` (stary kod, potrzebny do testu kreatora).
  - `gra/tools/administrators-wizard-test.cjs`: cofnięto do wersji bazowej `15b4327ba` (zmiana r4 była poza allowlistą; test zielony 58/0 także bez niej).
  - `gra/tools/admin-panstwo-city-gate-test.cjs`: dopisano sekcje (7) granica administratora miasta, (8) migracja zapisu, (9) wpięcie w main.ts (test statyczny), w tym Z4.
- Raport: ten plik, osobny commit.

## TESTY (surowe wyniki z tej rundy)

- `npm install --ignore-scripts` (gra/): już zainstalowane, `node_modules` obecne.
- `npx tsc --noEmit`: TSC_EXIT=0.
- `node tools/admin-panstwo-city-gate-test.cjs`: RESULT: 30 passed, 0 failed (było 10; +20: sekcje 7–9).
- `node tools/administrators-wizard-test.cjs`: 58 passed, 0 failed.
- `node tools/improvement-administrator-test.cjs`: 59 passed, 0 failed.
- `node tools/city-administrator-test.cjs`: 119 passed, 0 failed.
- `node tools/city-administrator-economy-test.cjs`: 72 passed, 0 failed.
- `node tools/upkeep-test.cjs`: 91 passed, 0 failed.
- `node tools/owner-economy-test.cjs`: 20 passed, 0 failed.
- Bramki referencyjne (nazwy z pierwszej rundy):
  - `logic-test.cjs`: PASS [213], 0 FAIL, exit 0.
  - `tech-tree-test.cjs`: 20 pass, 0 fail, exit 0.
  - `research-test.cjs`: PASSED 33 / FAILED 0 / TOTAL 33, exit 0.
  - `unit-replace-test.cjs`: 21 × [OK], 0 × [FAIL], exit 0.
  - `combat-test.cjs`: "All sanity checks passed.", exit 0.
- `git diff --check`: bez wyjścia (czysto).
- Mutacje: NIE_ZMIERZONO w tej rundzie (nie uruchomiono mutacji nowych asercji; regexy sprawdzono na aktualnym `main.ts`).
- Dowód w Chromium / w realnej grze: NIE_ZMIERZONO (patrz BLOKADY).

## ODPOWIEDZI NA ZARZUTY EVALUATORA (report_sha 63c26bad2)

1. Z4 (tryb auto jeden na Państwo): PRZYJMUJĘ. Poprawka w commicie 1003bdc98: dwa miejsca w `main.ts` przełączone na politykę Państwa. Dowód: test (9) „Z4: w main.ts nie ma odczytu trybu automatyzacji per miasto” (grep `effectiveUlepszeniaForCity(c).tryb` = brak) i „Z4: tryb auto z polityki Państwa właściciela” — oba PASS. Zakres: Z4 dotyczy TRYBU. Pola `focus` i `pracaAutoPercent` nadal czytane per miasto (`effectiveUlepszeniaForCity` w `getFocus`, `getPracaBudgetPercent`, `foodImprovementStages`). Zostawiono świadomie; w dispatchu Z4 mowi tylko o trybie. Do potwierdzenia przez właściciela.
2. Kryterium 4 (administrator miasta buduje tylko w swoim mieście): PRZYJMUJĘ. Dodano sekcję (7) w `admin-panstwo-city-gate-test.cjs`: miasto A z administratorem miasta → autobudowa dozwolona; miasto B bez → zablokowana (ta sama funkcja `isCityAutoBuildAllowed` z argumentem `cityHasWorkingAdministrator(city)`, jak `main.ts` ok. linia 10187). Administrator Państwa też nie otwiera budowy budynków w B. PASS.
3. Wpięcie `stateAdmByOwner` w main.ts bez asercji: PRZYJMUJĘ CZĘŚCIOWO. Dodano sekcję (9) — 10 asercji statycznych (regex na źródle `main.ts`): deklaracja mapy, bramka `isCityAutoImprovementActive`, `refreshAdministratorState(..., stateAdmByOwner)`, zatrudnienie `hireOwnerImprovementAdministrator`, zapis `stateImprovementAdministrators`, gałęzie wczytania, kasowanie `administratorUlepszen`, usunięcie przy OFF. Ograniczenie: to nie jest wykonanie tury. Closure `boot()` w `main.ts` nie da się zaimportować w teście; test wykrywa usunięcie wpięcia, nie błędy logiki w wpięciu. Runtime: NIE_ZMIERZONO.
4. Migracja przy wczytaniu (ścieżka main.ts, kasowanie pól, OFF): PRZYJMUJĘ CZĘŚCIOWO. Sekcja (8) testuje funkcję `migrateCityImprovementAdministratorsToState` (jeden administrator na właściciela, 2 miasta → 1 utrzymanie, pola X,Y do czyszczenia, brak migracji bez pola). Ścieżka wczytania w `main.ts` ma asercje statyczne (sekcja 9). Runtime wczytania: NIE_ZMIERZONO.
5. Teksty UI niespójne („w tym mieście wstrzymane”, brak „Administrator państwa” w `src/ui`): ODRZUCAM jako zarzut tego tematu. Dispatch (DECYZJA WŁAŚCICIELA 2026-11-12): „PANEL I NAZWY (nowy temat, #327): zatrudnianie/zwalnianie administratora Państwa w panelu Państwa; nazwy … w tekstach dla gracza”. Kryteria 1 i 6 należą do #327. W tym temacie `gra/src/ui/` nie było w zakresie zmian silnika. Dług dla #327: `buildModeHud.ts:196` („w tym mieście wstrzymane”) i `buildModeHud.ts:183`.
6. Zmiana poza allowlistą (`administrators-wizard-test.cjs`): PRZYJMUJĘ. Cofnięto do `15b4327ba` (commit 1003bdc98). Test pozostaje zielony (58/0), bo r4 zachowało w gałęzi OFF linię `delete ... administratorUlepszen` (przywrócona w `main.ts`). Plik nie jest już poza allowlistą.
7. Powiadomienia o zmianach administratora Państwa trafiają do `firstCity`; przy braku miast cicho pomijane: ODRZUCAM jako blokujące, ZOSTAWIAM DŁUG. Dowód: zatrudnienie Państwa wymaga `cityId` istniejącego miasta (`hireImprovementAdministratorForPlayer`), więc stan powstaje, gdy właściciel ma miasto. Pominięcie dotyczy tylko zmiany właściciela albo utraty wszystkich miast. Naprawa wymagałaby zmiany typu `AdministratorChange.city` (opcjonalne) i konsumenta w `main.ts` (~linia 10242), czyli zakresu poza tym tematem. Do #327 lub osobnego tematu.
8. Dowód w Chromium: NIE_ZMIERZONO. W tej rundzie nie uruchomiono gry w przeglądarce. Powód: kryterium 1 (zatrudnianie Państwa z panelu Państwa) nie jest zrobione, a wpięcie testuje się w grze tylko przez przycisk w panelu miasta (zmiana UI #327). DODATEK orkiestratora istnieje jako sekcja w `00-dispatch.md`, nie jako osobny plik (patrz Wejście).

## KRYTERIA KOŃCA (stan po tej rundzie)

1. Zatrudnienie administratora Państwa w panelu Państwa: NIESPEŁNIONE w tym temacie (przeniesione do #327, zgodnie z podziałem właściciela).
2. Koszt utrzymania raz na Państwo: SPEŁNIONE (testy improvement-administrator/economy/upkeep, zielone).
3. Miasto B bez administratora w trybie auto dostaje ulepszenia przy administratorze Państwa: SPEŁNIONE testem silnikowym bramki (sekcja 1 gate-test, 3/3 miasta objęte; bez Państwa 0).
4. Administrator miasta buduje tylko w swoim mieście: SPEŁNIONE testem (sekcja 7).
5. Migracja zapisu z administratorem miasta: SPEŁNIONE funkcją (sekcja 8) i asercjami wczytania (sekcja 9); runtime NIE_ZMIERZONO.
6. Nazwy w tekstach dla gracza: NIESPEŁNIONE w tym temacie (#327).
7. tsc zielone; bramki referencyjne zielone: SPEŁNIONE (TSC_EXIT=0; 5 bramek OK). Dowód w Chromium: NIE_ZMIERZONO.
8. Z4 (jeden tryb Państwa): SPEŁNIONE dla trybu auto (poprawka 1003bdc98); pola focus/pracaAutoPercent per miasto zostają (zakres do potwierdzenia).

## BLOKADY

- Chromium / gra w przeglądarce: NIE_ZMIERZONO (patrz odpowiedź 8).
- Runtime (wykonanie tury i wczytania zapisu w `boot()`): NIE_ZMIERZONO; pokryte tylko testami funkcji i asercjami statycznymi.
- UI trybu automatyzacji nadal per miasto (`buildModeHud.ts`, `cityPanel`): po poprawce silnik ignoruje tryb miasta, a UI go pokazuje. Mylące dla gracza — do #327.
- Teksty UI (#327), panel Państwa (#327), powiadomienia bez miast (dług, odp. 7).
- Poza allowlistą: brak (wizard-test cofnięto).

## RUNDY

Obrona r1 (ta runda) — odpowiedź na zarzuty FAIL z FC r4 (report 63c26bad2 na gałęzi eval-r4-two-types). Kolejna runda Evaluatora rozstrzyga; limit 5/5 nie wyczerpany w tym temacie na tym etapie.

## NASTĘPNY KROK

1. Evaluator: zweryfikować commit 1003bdc98 (diff: `git diff e67601e93 1003bdc98`) i nowe sekcje testu.
2. Orkiestrator: decyzja o zakresie Z4 (tylko tryb czy też focus/pracaAutoPercent) i o długach 5 i 7 (przeniesienie do #327).
3. Temat #327 (panel Państwa i nazwy) i dowód w Chromium po #327.

DEPLOY/PUSH: NIE WYKONANO
