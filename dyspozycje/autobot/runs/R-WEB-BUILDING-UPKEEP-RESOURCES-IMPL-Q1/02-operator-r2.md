STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BUILDING-UPKEEP-RESOURCES-IMPL-Q1
GOAL: Utrzymanie surowcowe budynku = surowe utrzymanie Pieniadza (pole utrzymanie + przyrostUtrzymania per poziom) na kazdy surowiec z koszt_surowce, wspolczynnik z danych (domyslnie 1), ten sam kod dla gracza i AI.
ZMIANY/COMMIT: baza 956c9a6b7 (r1) -> branch upkeep-r2-wip, commit SHA w raporcie orkiestratora (`git rev-parse HEAD`). Allowlista: gra/src/game/economy-upkeep.ts, gra/src/game/turn-economy.ts, gra/src/main.ts, gra/src/ui/cityPanel.ts, gra/src/ui/entityCards/buildingAdapter.ts, gra/tools/{building-upkeep-resources-test,cities-buildings-production-owner-contract-test,resource-usage-breakdown-test,upkeep-test}.cjs, runs/<ID>/. econ-params.json i buildings.json bez zmian w r2.
TESTY: patrz tabela ponizej.
BLOKADY: decyzja ABC o efektywnym zlocie NIE jest potrzebna (przyjeta baza z dispatchu). Pomiar AI NIE_ZMIERZONO.
RUNDY: 2/5

## Odpowiedzi na zarzuty rundy 1

1. Wspolczynnik nie byl ustawiany w ticku (PRZYJMUJE, naprawione). Usunieta zmienna modulu i `configureBuildingResourceUpkeepRatio`. Tick (`advanceCityEconomy`) czyta wspolczynnik z danych przez `readBuildingResourceUpkeepRatio(rawEconParams, trudnosc_wlasciciela)` i przekazuje go argumentem do `totalBuildingResourceUpkeep(..., ratio)`. Test F (ponizej) dowodzi zachowania w prawdziwym ticku, takze per owner.

2. Test D1 byl falszywie zielony (PRZYJMUJE, naprawione). Dodano sekcje F w `building-upkeep-resources-test.cjs`, ktora bundluje prawdziwy `advanceCityEconomy` i sprawdza: wspolczynnik 2 w danych = 2x pobor (gracz i AI), wspolczynnik per owner (owner 1 `hard` = 3x, owner 0 `normal` = 1x). Testy tekstowe zostaly tylko jako wiring (C/D), oznaczone w kodzie jako statyczne.

3. Baza 4x wobec przykladu z dispatchu (PRZYJMUJE, naprawione). Dispatch wprost mowi: „dzisiejsze utrzymanie w Pieniadzu (pole `utrzymanie`, z `przyrostUtrzymania` per poziom)“ oraz przyklad „Mury (utrzymanie 2): 2 Pieniadza + 2 drewna + 2 kamienia + 2 cegly“. R1 wzieło zloto z FALA2 i mnoznikiem epoki, czyli 4x. R2 bierze surowe pole: floor(utrzymanie + przyrost*(poziom-1)), bez FALA2 i bez mnoznika epoki (dotycza tylko zlota). Mury = 2/2/2. Nie ma juz pytania ABC o baze: przyjeta wersja z dispatchu. Wplyw na bilans (poziom 1, kazdy budynek raz): 42 budynki z kosztem surowcowym, 227 szt./ture lacznie; stara stala 5/typ dawala 510 szt./ture. To jest zmiana bilansu ekonomii w dol (-55%), wiec orkiestrator powinien ja pokazac wlascicielowi przy akceptacji.

4. Brak zmierzonego wplywu na AI (PRZYJMUJE czesciowo). Dodano dowod parytetu: test F pokazuje, ze owner AI (owner 1) dostaje ten sam pobor i ten sam wspolczynnik co gracz. Planowanie AI (`ai-resource-needs.ts`) NIE zostalo zmienione w r2 i NIE zostalo zmierzone symulacja przebiegu (dysk 1,7 GB wolnego, sprawdzenie wymaga pelnej gry). Pozostaje NIE_ZMIERZONO. Test C4 jest nadal statyczny i tak jest oznaczony.

5. Przeterminowany komentarz w main.ts ~3786 (PRZYJMUJE, naprawione). Tekst zmieniony na: budynki zaleza od poziomu i wspolczynnika z danych.

6. Format karty budynku (PRZYJMUJE, naprawione). `formatUpkeepValue` (buildingAdapter.ts) zwraca teraz „2 Pieniądze, 2 drewna, 2 kamienie, 2 cegły / turę“ z polskimi odmianami (tabela `UPKEEP_NOUN_FORMS` + `plUpkeepForm`), bez surowych id. Odmiana „Pieniądze“ (nie „Pieniądz“) jest poprawna gramatycznie dla 2-4; przyklad z dispatchu zawierał mianownik liczby pojedynczej, co uznano za literowke. Etykieta wiersza nadal „Co turę“.

7. Dlug REPIN Rust nie zapisany (PRZYJMUJE, tekst ponizej; pliku LEDGER brak w worktree). Wpis do dodania przez orkiestratora:
   - REPIN Rust (R-WEB-BUILDING-UPKEEP-RESOURCES-IMPL-Q1): funkcje `buildingResourceUpkeep(building, level, ratio)`, `totalBuildingResourceUpkeep(buildings, ratio)`, `buildingResourceUpkeepForBuiltIds`, `previewOwnerBuildingResourceUpkeep`, `previewOwnerTotalResourceUpkeep`, `readBuildingResourceUpkeepRatio` (economy-upkeep.ts). Formula: floor(floor(utrzymanie + przyrostUtrzymania*(poziom-1)) * ratio) na kazdy surowiec z koszt_surowce; ratio z econ-params `budynki.utrzymanie_surowce_wspolczynnik` (domyslnie 1, per trudnosc). Rust: building_costs.rs.

## Odpowiedzi na zarzuty z testow zastanych (ODRZUCAM z dowodem)

- D3 i D4 w `resource-usage-breakdown-test.cjs` (ODRZUCAM, pre-existing). Lancuch `buildingResourceUpkeepByOwner.set(0, { ...(econ.resourceUpkeepBuildingsByOwner.get(0) ?? {}) });` nie istnieje w main.ts ani na bazie 18b609dc3, ani na 956c9a6b7 (`git show <sha>:gra/src/main.ts | grep -c` = 0). Test zaklada kod, ktorego nie ma w bazie.
- `citizen-resource-upkeep-test` 2 FAIL na kotwicy `const ordPctRaw = evaluateOrderFromBreakdown(` (ODRZUCAM, pre-existing). Kotwica nie istnieje ani w 18b609dc3, ani w 956c9a6b7 (grep = 0). Nie dotykano tego kodu.

## Zmiany testow (celowe, z uzasadnieniem)

- upkeep-test: 91/0 (przepisane na surowe utrzymanie; ratio jako parametr; `readBuildingResourceUpkeepRatio`).
- building-upkeep-resources-test: 48/0 (nowa sekcja F, behawioralna).
- cities-buildings-production-owner-contract-test: 53/0 (oczekiwania wyliczane z def.utrzymanie zamiast stalej 2).
- resource-usage-breakdown-test: FAIL tylko D3 i D4 (pre-existing); wszystkie pozostale asercje przechodza po przepisaniu liczb I/J/B na nowa baze.
- empire-miasta-table-test 96/0, unit-resource-upkeep-test 7/0, upkeep-difficulty-per-owner-test 19/0, ai-resource-needs-test 6/0, city-orderstate-restore-clear-test 9/0, building-cost-resource-availability-test 58/0, owner-economy-test 20/0.
- citizen-resource-upkeep-test 107/2 (pre-existing, patrz wyzej).
- `tsc --noEmit -p . --ignoreDeprecations 6.0`: 0 bledow w calym projekcie. Bez tej flagi tsc konczy sie na TS5101 (baseUrl) juz na bazie.

## NIE_ZMIERZONO

- Symulacja przebiegu AI i zmiana planowania AI (`ai-resource-needs.ts`).
- Weryfikacja w przegladarce karty budynku i panelu miasta (wymaga build/dev, dysk).

## NASTEPNY KROK
Evaluator (Sonnet) na nowym SHA. Przed integracja: ABC do wlasciciela tylko w sprawie bilansu (227 vs 510 szt./ture L1), nie w sprawie bazy.

DEPLOY/PUSH: NIE WYKONANO
