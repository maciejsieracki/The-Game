STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-SUPER-UNIT-LIMIT-ONE-NOT-ENFORCED-Q1
GOAL: Limit "max 1 żywa Super-jednostka na cywilizację" (Hieros Lochos, decyzja A3=A, audyt #11) wymuszony po stronie wykonania i liczący CAŁY stan cywilizacji (żywe + kolejki rekrutacji wszystkich miast), dla gracza i AI.
ZMIANY/COMMIT: gałąź worktree-wf_f29de965-4bb-1, baza 264aebdf7 (= origin/main, FALA 574); SHA commitu w odpowiedzi zwrotnej. Pliki: gra/src/game/production.ts, gra/src/main.ts, gra/src/game/empire-recruit-plan.ts, gra/src/ui/cityPanel.ts, gra/tools/super-unit-limit-one-test.cjs, ten raport.

DIAGNOZA (przyczyny źródłowe)
1. `purchaseRecruitmentUnit` (main.ts; jedyna ścieżka zakupu gracza i AI) NIE sprawdzał limitu — bramka `aliveUnitTypeNames` była tylko w `availableProduction` / `availableReplacementsFor`, czyli ukrywała pozycję na liście. Wywołania bezpośrednie (onPurchaseUnit, zbiorczy panel, AI rush-buy, ilość > 1) omijały limit.
2. `aliveUnitTypeNames` liczył tylko `units` (żywe na mapie). Opłacone, a jeszcze niewypuszczone sztuki w `cityProd.rekrutacja` (kolejki WSZYSTKICH miast) nie rezerwowały limitu, więc dokupowanie kolejnych sztuk (inne miasto / ilość > 1 / kolejne tury) przechodziło. To potwierdza hipotezę właściciela ("system nie zlicza tego w całości").
3. Ilość > 1 (licznik karty rekrutacji, zbiorczy panel imperium, RECRUIT-ALL) szła jako jedna partia.
4. "Zastąp": lista zamienników liczona przy otwarciu pickera; `performUnitReplace` nie powtarzał sprawdzenia przy wykonaniu.

NAPRAWA
- production.ts: `reservedUnitTypeNames(alive, cityProductions)` = żywe + `rekrutacja` + legacy `kolejka` wszystkich miast; `superUnitLimitViolation(def, typeId, reserved, quantity)` zwraca komunikat PL `SUPER_UNIT_LIMIT_BLOCK_PL` gdy Super jest już zarezerwowana LUB ilość > 1.
- main.ts: `reservedUnitTypeNamesForOwner(ownerId)` jako jedno źródło prawdy, użyte w 5 miejscach (ctx Zastąp, ctx panelu miasta getAliveUnitTypeNames, ctx produkcji AI, ctx build AI, ctx zastępstw). Egzekucja: guard w `purchaseRecruitmentUnit` (gracz + AI), `purchaseRecruitmentUnits` (partia), `performUnitReplace` (zamiana). Zbiorczy panel imperium: `maxTotal=1` dla Super.
- empire-recruit-plan.ts: `executeEmpireRecruitment` przyjmuje `maxTotal`/`maxTotalReason` (ucina zamówienie, komunikat PL z przyczyną).
- cityPanel.ts: licznik karty rekrutacji Super = max 1.
- Migracja starych zapisów (>1 sztuka): ZGŁOSZONE I ZOSTAWIONE. Żadna istniejąca jednostka nie jest usuwana; `reserved` zawiera typ, więc nowe sztuki są blokowane (test pkt 6). Uwaga: sztuki już opłacone w kolejce ze starego zapisu wypuszczą się normalnie (zwrot kosztu nie zaimplementowany; decyzja produktowa dla orkiestratora/właściciela).

TESTY
- NOWY gra/tools/super-unit-limit-one-test.cjs: 28 OK / 0 FAIL (kolejka 2 pozycje -> druga odrzucona; dwa miasta; Zastąp z żywą i z zakolejkowaną; ilość > 1; zapis z 6 sztukami; zbiorczy panel maxTotal; kontrola statyczna wpięcia main.ts/cityPanel.ts, w tym 0 pozostałych `aliveUnitTypeNames: new Set(`).
- Regresje: unit-replace-test 15/15, unit-replace-full-cost-test 40/0, empire-recruit-plan-test 17/0, recruit-list-visibility-test 9/0 — zielone.
- tsc --noEmit (TS 5.6 z katalogu tymczasowego, bez node_modules gry): 177 błędów środowiskowych (brak modułu 'three', typy vite glob); żaden nie dotyczy zmienionych linii.
- recruitment-batch-contract-test.cjs: pada na `hexHasRoomFor is not defined` w wyciętym fragmencie purchaseRecruitmentUnit (kod sprzed tej zmiany, niekompletny stub w teście) — dług testowy poza allowlistą, nie ruszano.
- empire-mass-recruitment-test i inne live/real-render: wymagają playwright — brak w środowisku. Chromium: NIE_ZMIERZONO (brak przeglądarki/playwright; zakaz build/dev w gra/). Weryfikacja wizualna panelu (licznik 1, komunikat): NIE_ZMIERZONO.

WPIS LEDGER (REPIN Rust): do odtworzenia w Rust: (1) rezerwacja = żywe + wszystkie `rekrutacja`/`kolejka` jednostki cywilizacji; (2) odrzucenie zakupu/zamiany Super gdy typ zarezerwowany lub quantity > 1 (komunikat PL "Limit Super-jednostki: tylko 1 sztuka na cywilizację (żywa, w kolejce rekrutacji lub po zamianie)."); (3) AI przez tę samą ścieżkę. W repo na bazie 264aebdf7 nie znaleziono pliku LEDGER REPIN — wpis zostaje w tym raporcie do przeniesienia przez orkiestratora.

BLOKADY: brak (poza NIE_ZMIERZONO Chromium i długiem recruitment-batch-contract-test wyżej)
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (r1), następnie Obrona i Final Control; orkiestrator: przeniesienie wpisu LEDGER, decyzja o zwrocie kosztu dla starych zapisów z duplikatem w kolejce.
DEPLOY/PUSH: NIE WYKONANO
