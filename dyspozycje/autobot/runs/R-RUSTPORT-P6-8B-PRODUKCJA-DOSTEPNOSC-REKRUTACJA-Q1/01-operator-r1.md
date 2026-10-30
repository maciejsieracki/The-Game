STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1
GOAL: P6.8B, partia P1b-c1 (czesc pierwsza P1b): unitStockShortfallLabel (web 682-693), UNIT_POPULATION_COST i populationCostOf (web 1815-1825) @91dc998a, z wektorami z uruchomionego weba. Temat pozostaje OTWARTY: P1b-c2 i P2 niewykonane.
ZMIANY/COMMIT: commit kodu i wektorow `ae62996d7` (baza: origin/rust-port/parity-v2 `be924f64f`, branch op-R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1). Allowlista: `rust-port/engine/src/domain/production_units.rs` (+18 linii, tylko nowa sekcja P1b-c1), `rust-port/engine/tests/p6_8b_p1b_vectors.rs` (nowy), `rust-port/engine/tests/p6_8b_vectors/p1b.json` (nowy, generowany), `dyspozycje/rust-port/p6/P6-8B-PRODUKCJA-DOSTEPNOSC.md`, run-dir (`gen-p6-8b-p1b-vectors.mjs`, `mut-p6-8b-p1b-c1.py`, `dowody/pomiar-mutacje-p1b-c1-r1.txt`). Zero zmian w gra/, rust-port/renderer, src-tauri, Cargo.toml, WERSJE.md. Push: nie.
TESTY:
- generator na git archive 91dc998a (Node 22, loader repin-b), EXIT 0: 416 przypadkow unitStockShortfallLabel, 2 prototypowe, 5 populationCostOf, UNIT_POPULATION_COST = 0 (miasto-params.json pin).
- cargo test --test p6_8b_p1b_vectors: 6/6 ok.
- cargo test --test p6_8b_helpers_vectors: 18/18 ok (regresja P1a); --lib: 6/6 ok.
- cargo clippy --lib --test p6_8b_p1b_vectors --test p6_8b_helpers_vectors -D warnings: EXIT 0.
- cargo fmt --all -- --check: EXIT 0.
- git diff --check: czysto.
- mutacje (4): M1 zwrot etykiety -> None KILLED; M3 prog `> 0` -> `>= 0` KILLED; M2 `Jednostka => 0.0` i M4 `Budynek => UNIT_POPULATION_COST` SURVIVED = EQUIV (UNIT_POPULATION_COST = 0 w pinie). Zrodlo przywrocone (porownanie bajt w bajt).
- Nie wykonano pomiarow dlugich (zgodnie z dispatchem: BEZ dlugich pomiarow). Brak run_in_background.
BLOKADY: brak dla c1. Dla c2 (nie wykonane): availableProduction (793-1003) korzysta z bramek miasta i surowcow (buildingLocationAllowed, cityBuildingPrereqMet, buildingResourceGateMet, buildingWorkCost, unitMoneyCost, itemCost, epochNumber, isScoutTypeId) -- wymaga wektorow z pelnego grafu weba; availableReplacementsFor (1004-1115) tak samo; setPaused i wstrzymana/rekrutacja wymagaja rozszerzenia CityProduction (w Rust tylko kolejka, postep).
RUNDY: 1/5 (wg zlecenia orkiestratora; naglowek 00-dispatch.md podaje "RUNDA: 3/5" i zakres r3 = P1b. Rozbieznosc zgloszona: przyjeto 1/5 z polecenia, numer runu 01-operator-r1.md).
ZALOZENIA (rozstrzygniete bez pytan ABC):
1. Baza pracy = origin/rust-port/parity-v2 (be924f64f), nie biezaca galaz worktree (7164f7ca1), bo P1a istnieje tylko na parity-v2.
2. Zrodlo wektorow = pin 91dc998a (git archive), NIE gra/ w worktree: kopia robocza gra/src/game/production.ts rozni sie od pinu (56 insercji/219 usuniec), a unitStockShortfallLabel nie wystepuje w niej wcale.
3. Klucze prototypowe `constructor`/`__proto__` w UNIT_STOCK_GATE_LABEL: odstepstwo swiadome (Rust None), przypiete testem; w danych gry nieobecne.
4. UNIT_POPULATION_COST w Rust jako stala 0.0 zamrozona z pinu (web czyta miasto-params.json z fallbackiem 1; fallback nie jest dotykany przy wartosci 0).
5. unitStockShortfallLabel istnial juz w production_units.rs przed ta runda (bez wektorow); dodany tylko test/wektory, kod nie zmieniony.
NASTEPNY KROK: Evaluator i Final Control dla ae62996d7 (partia c1), potem Operator runda 2 dla P1b-c2 (availableProduction, availableReplacementsFor, setPaused, manpowerCostOf, pola CityProduction) tym samym ID; P2 dopiero po zamknieciu B3 (recruitment.rs).
DEPLOY/PUSH: NIE WYKONANO
