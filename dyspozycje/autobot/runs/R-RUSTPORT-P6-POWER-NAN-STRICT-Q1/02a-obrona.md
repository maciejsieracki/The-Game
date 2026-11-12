STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-NAN-STRICT-Q1
GOAL: odpowiedz na zarzuty Evaluatora (02-evaluator.md, r1) dla df8711bba; poprawka + dowod albo odrzucenie z dowodem
ZMIANY/COMMIT: baza df8711bba (Operator r1); poprawka w tym samym temacie (SHA: HEAD gałęzi rust-port-wip/P6-POWER-NAN-STRICT-Q1 po commicie obrony, zapis w raporcie zbiorczym); allowlista: rust-port/engine/src/domain/brake_power.rs, rust-port/engine/tests/p6_power_nan.rs
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib 48 passed EXIT 0; cargo test --test p6_power_nan 9 passed; p6_power_nozeros 9; p6_brake_inputs 10; p6_brake_inputs_vectors 9; p6_power_producers 9; p6_power_army 7 (wszystkie EXIT 0, 0 ignored). Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (usuniety po bramkach)
BLOKADY: brak blokad kodu. Zarzut 4 (baza) dotyczy decyzji orkiestratora przy integracji - patrz nizej.
RUNDY: 1/5 (obrona w rundzie 1; kolejny Evaluator/FC wedlug obiegu)
NASTEPNY KROK: Evaluator r2 (ten sam ID), potem Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 - pole `epoka: f64` w ObjectivePowerRaw nie jest walidowane
Decyzja: ODRZUCAM jako defekt wyniku; PRZYJMUJĘ jako udokumentowanie (poprawka dokumentacyjna).

Dowod: `grep -n epoka rust-port/engine/src/domain/brake_power.rs` pokazuje, ze pole jest uzywane wylacznie do echa do wyniku (`epoka: input.epoka` w konstrukcji `ObjectivePowerResult`). `power_base` i `power` sa liczone wylacznie z 12 skladnikow `Component` (`fold` po `points`) i nie czytaja `epoka`. `grep -rn "\.epoka"` poza brake_power.rs nie wskazuje zadnego uzycia w sciezce mocy celu. Zatem NaN/Inf w `epoka` nie zmienia `power`, czyli wynik, ktory konsumuje adapter `objective_power_for_owner`.

Zmiana: komentarz doc na polu `ObjectivePowerRaw::epoka` mowi wprost, ze pole nie jest skladnikiem, nie jest walidowane i nie wchodzi do `power_base`/`power`.

### Zarzut 2 - test `finite_complete_input_unchanged_by_nan_policy` sprawdza tylko liczbe skladnikow
Decyzja: PRZYJMUJĘ. Poprawka.

Test sprawdzal tylko `components.len() == 12` i spojnosc adaptera. Dodane asercje wartosci, wyliczone z `data/power-params.json` (pkt: jednostka 2.5, wygrana 25, ludek 5, rekruci 10, miasto 50, terytorium 1.0, budynki 5, tech 80, ulepszenie 5, kultura 0.5, religia 25, zdobycze x2):
- EnemyMSum: 7.5 + 8 + 25 + 20 + 100 + 6 + 15 + 160 + 5 + 3.5 + 50 + 2 = 402.0; `power_base == 402.0`, `power == 402.0`; skladnik `bitwy` `points == 8.0`.
- FlatCount: bitwy 1*25 zamiast 4*2, czyli 402 - 8 + 25 = 419.0; `power_base == 419.0`, `power == 419.0`.
Test przechodzi (9 passed), wartosci zgodne z obliczeniem recznym.

### Zarzut 3 - testy NaN/Inf sa syntetyczne, brak pinu dla NaN (web propaguje NaN)
Decyzja: ODRZUCAM jako defekt; PRZYJMUJĘ fakt.

Fakt: web (`Math.max(0, x)`) propaguje NaN, wiec pin z web nie ma wektora dla NaN jako wyniku. Rozbieznosc jest zamierzona (decyzja orkiestratora, wariant A: Provided(NaN/Inf) w STRICT = blad, nie cicha wartosc) i jest udokumentowana w doc comment `compute_objective_power` (brake_power.rs) oraz w 01-operator-r1.md. Testy wartosci skonczonych (p6_brake_inputs_vectors, 9 passed) pilnuja zgodnosci z pinem dla wszystkich wejsc, dla ktorych web ma dobrze zdefiniowany wynik. Brak zmiany kodu.

### Zarzut 4 - rozbieznosc bazy (258afaf8f vs origin/rust-port/parity-v2)
Decyzja: ODRZUCAM jako blokujacy (warunek zadania spelniony); zostawiam jako ostrzezenie dla orkiestratora przy integracji.

Dowod (git merge-base --is-ancestor):
- `f207ea6b1` jest przodkiem `258afaf8f` -> warunek "f207ea6b1 lub nowszy" jest spelniony przez 258afaf8f.
- `258afaf8f` NIE jest przodkiem `origin/rust-port/parity-v2` (tip 94cba6667). Gałąź parity-v2 nie zawiera POWER-ARMIA-TERYTORIUM ani POWER-NOZEROS, na ktorych stoi brake_power.rs. Dlatego baza 258afaf8f jest zgodna z dispatchem, ale integracja na parity-v2 wymaga potwierdzenia przez orkiestratora (rozbieznosc miedzy trescia zadania a dispatchem).

### Zarzut 5 - bramki odtworzone, Evaluator zapisal commit c0424b8b2
Decyzja: PRZYJMUJĘ jako informacje; bramki odtworzone po poprawce (patrz TESTY).

Commit `c0424b8b2` (02-evaluator.md) istnieje w repo i zawiera wylacznie raport Evaluatora (1 plik, 16 linii), bez zmian kodu. Nie wchodzi do diffu kodu tematu. Brak zmiany.

## Zakres zmian w obronie
- rust-port/engine/src/domain/brake_power.rs: tylko komentarz doc pola `epoka` (zarzut 1).
- rust-port/engine/tests/p6_power_nan.rs: tylko asercje wartosci w `finite_complete_input_unchanged_by_nan_policy` (zarzut 2). Asercje istniejace nieosłabione.
- dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-NAN-STRICT-Q1/02a-obrona.md (ten plik).
- Brak zmian w gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock.

NIE_ZMIERZONO: wydajnosc, zachowanie w innych modelach bitew niz EnemyMSum/FlatCount (poza zakresem zarzutow).
