STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-NOZEROS-Q1
GOAL: ObjectivePowerRaw / objective_power_for_owner nie zwracaja mocy przy nieustawionych skladnikach bez jawnej decyzji wolajacego. Kazdy skladnik ma stan Component (Provided | ExplicitZero | Missing), compute zwraca Result z MissingComponents(klucze), polityka domyslna STRICT.
ZMIANY/COMMIT: branch rust-port-wip/P6-POWER-NOZEROS-Q1, commit kodu 9b0b3bf65cc262fc154927254c938adc677f8d2a (baza 94cba6667344cbbf7fba1382ebd6d2ec8e0568de). Allowlista: rust-port/engine/src/domain/brake_power.rs; rust-port/engine/src/domain/brake_power_producers.rs; rust-port/engine/tests/p6_brake_inputs_vectors.rs; rust-port/engine/tests/p6_power_producers.rs; rust-port/engine/tests/p6_power_nozeros.rs (nowy); dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-NOZEROS-Q1/**. Nie zmieniano: brake_inputs.rs (power_map jest generyczny, nie wola objective_power), gra/**, Cargo.toml, WERSJE.md, origin/main, rust-port/engine/Cargo.lock (wygenerowany lokalnie, NIE commitowany).
TESTY:
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0, 48 passed, 0 failed
- cargo test --test p6_brake_inputs --test p6_brake_inputs_vectors --test p6_power_producers --test p6_power_nozeros: EXIT 0; wyniki 10 / 9 / 9 / 9 passed, 0 failed
- git diff --check: EXIT 0
- Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (usuniety po bramkach). Wolne miejsce na / przed startem: 17 GB.
- Asercje nie oslabione: asercje p6_power_producers przepisane na Component::Provided/Missing (ta sama sila); wektory p6_brake_inputs_vectors wymagaja kompletnych wejsc (.expect); pola `?? 0` w wektorach (bitwyPktSum, kulturaImperium, miastaJednoscReligii, zdobyczePower gdy nieobecne/null) przekazane jako ExplicitZero, zgodnie z web `?? 0`.
- Nowe testy p6_power_nozeros (9): pelne wejscie Ok i zgodne z adapterem; Missing aktywnego pola -> Err(["infra"]); wszystkie brakujace -> lista w kolejnosci skladnikow web; osiem skladnikow bez producenta -> Err == no_producer_keys(); ExplicitZero == Provided(0.0); nieaktywne pole bitew nie jest wymagane (FlatCount/EnemyMSum); aktywne pole bitew brakujace -> Err w obu modelach; adapter propaguje Err; producenci wymagaja apply_produced przed compute (ludki/rekruci/miasta/kultura -> Missing przed, Provided po).
BLOKADY: brak. Uwagi (nie blokady): (1) brak trybu lenient - zero wymaga jawnego ExplicitZero; (2) 8 skladnikow bez producenta (armia, bitwy, terytorium, infra, tech, ulepszenia, religia, zdobycze) nadal nie ma producentow - ta runda tylko wymusza jawnosc, nie dodaje zrodel (temat POWER-REST / POWER-ARMIA-TERYTORIUM); (3) power_map w brake_inputs.rs nadal przyjmuje Fn(i64) -> f64, wolajacy musi sam obsluzyc Result z objective_power_for_owner (zmiana sygnatury power_map poza zakresem, bez wolania w repo).
RUNDY: 1/5
NASTEPNY KROK: Evaluator (R-RUSTPORT-P6-POWER-NOZEROS-Q1, runda 1) na commicie 9b0b3bf65cc262fc154927254c938adc677f8d2a; potem Final Control. Orkiestrator decyduje o integracji; Operator nie integruje i nie pushuje.
DEPLOY/PUSH: NIE WYKONANO
