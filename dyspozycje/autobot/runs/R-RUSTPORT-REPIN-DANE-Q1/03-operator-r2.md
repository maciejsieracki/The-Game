STATUS: BLOCK (techniczny, logika: 12 testow czerwonych wymaga zmiany reguly w Rust, nie danych; dane, schemat i derived zrobione z dowodem)
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-DANE-Q1
GOAL: krok 1 odswiezenia portu do 91dc998a (4 kopie bajtowe engine/data, przeliczenie derived i wektorow, bez oslabiania testow).
ZMIANY-COMMIT: baza 7d515368 (odtworzona, detached). Commity r2: C1 1caf5eab (schemat civs/econ + testy), C2 7b36da83 (derived 3/5 + drift testow units/recruitment), C3 e6ff0fd8 (wektory p6_1d/p6_1e z 91dc998a + poprawka generatora), C4 = ten raport + dokument REPIN-DANE sekcja 8 + logi (SHA w `git log -1`). Pliki danych bez zmian (sha256 jak w r1). Cargo.lock lokalny, nie commitowany. Nie pushowano.
TESTY:
- `cargo fmt --all -- --check`: EXIT=0 (`fmt-r2.log`).
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0 (`clippy-r2.log`).
- `cargo test --locked --all-targets --no-fail-fast`: EXIT=101, passed 1195, failed 12, razem 1207 = baza (`test-r2.log`). Zero usunietych testow. Asercje przepiete na nowy pin (zrodlo: web 91dc998a): data_civilizations (48 bonusow / 15 list / mnoznik 2.3 -> brak kluczy 15/15), data_units_combat (Kamien 10->11, Braz 40->39), recruitment (Rydwan braz 50 -> drewno 25), p6_1d real_civs (prog >=40 -> ==0).
- Kontrola generatorow: na danych edb8fb56 kazdy generator odtwarza committed plik bajt-w-bajt (`gen-control-r2.log`).
- `git diff --check`: czysty.
BLOKADY:
- 12 czerwonych, wszystkie LOGIKA (nie dane): p6_1d_civ_bonuses x5 (`tests/p6_1d_civ_bonuses.rs:319,357,381,402,455`; web `civ-bonuses.ts` hunki 142-196, 288-320, 335, 377-389) i p6_1e_civ_matrix x7 (`tests/p6_1e_civ_matrix.rs:653,747,799,924,981,1098,1208`; web `civ-ai-data.ts` fallback -> undefined i `resolveArchetypeAggressionWithDifficulty`, `civ-matrix-semantic.ts` statusy BLOCKED/UNWIRED/REAL_GAMEPLAY). Pieciu z p6_1d byli zieloni w r1 tylko dlatego, ze wektory opisywaly edb8fb56; regeneracja ujawnila dryf.
- Derived niezregenerowane z powodu zmiany logiki web: `unit-gold-states.json` (diff 64 linie, Rydwan; `production.ts` hunki 583-587, 628-640) i `building-work-states.json` (diff 6828 linii; `production.ts` hunk 562 + zniżka cywilizacji z civs.json = 0).
- Mennica: w Rust brak konsumenta (`grep` = tylko definicje pol); logika zyje w webie (`economy.ts:236`, `turn-economy.ts:308`). Osobny temat portu.
RUNDY: 2/5 (ostatni werdykt r1: BLOCK; r2: BLOCK logiczny). Decyzja wlasciciela NIE jest wymagana; wymagany jest osobny temat logiki (port `civ-bonuses.ts`, `civ-ai-data.ts`, `civ-matrix-semantic.ts`, `production.ts` unitMoneyCost/buildingWorkCost) - zapisany w dokumencie sekcja 8.7.
NASTEPNY KROK: osobny temat logiki (nie w tym tematie) albo decyzja orkiestratora, czy pin przesunac z 12 czerwonymi testami zablokowanymi jawnie; kryterium C tego tematu nie jest spelnione.
DEPLOY/PUSH: NIE WYKONANO
