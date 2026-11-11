STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-NOZEROS-Q1
GOAL: ObjectivePowerRaw/objective_power_for_owner nie zwracaja mocy przy nieustawionych skladnikach bez jawnej decyzji wolajacego (STRICT).
ZMIANY/COMMIT: obrona bez zmian kodu. Kod oceniany: 9b0b3bf65cc262fc154927254c938adc677f8d2a (baza 94cba6667, przodek). Raport Operatora: 9dfcba14b. Ocena Evaluatora: 6f463264d. Ten plik jest jedyna zmiana w commicie obrony. Allowlista zachowana, brak zmian gra/, WERSJE.md, Cargo.toml, Cargo.lock.
TESTY: nie ponawiano bramek (brak zmian kodu). Bramki z oceny Evaluatora na 9b0b3bf65 (CARGO_TARGET_DIR poza repo): cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib EXIT 0 (48 passed); cargo test --test p6_brake_inputs --test p6_brake_inputs_vectors --test p6_power_producers --test p6_power_nozeros EXIT 0 (10/9/9/9 passed); git diff --check EXIT 0.
  Dodatkowe dowody obrony (bez kompilacji crate):
  - probe rustc: f64::NAN.max(0.0) = 0.0 oraz (-1.0).max(0.0) = 0.0 (zob. zarzut 3).
  - grep gra/src/game/power-objective.ts @07d2fbd72: linie 230, 250, 251, 257 - `?? 0` dla bitwyPktSum, kulturaImperium, miastaJednoscReligii, zdobyczePower; linie 231-249, 252-256 - `Math.max(0, x)`.
  - grep rust-port/engine/src @9b0b3bf65: compute_objective_power i objective_power_for_owner nie maja wolajacych w src (tylko definicje w brake_power.rs:174, :268 oraz komentarz w brake_inputs.rs:14).
  - p6_power_nozeros.rs @9b0b3bf65: 9 testow #[test].

ODPOWIEDZI NA ZARZUTY (Evaluator R1, 02-evaluator.md):

Zarzut 1 (sciezka Missing/STRICT bez wektora pinu): PRZYJMUJE jako uwage nieblokujaca. Bez zmiany kodu.
  Dowod: web @07d2fbd72 nie ma stanu "brak" - pola sa czytane przez `?? 0` albo wprost, wiec nie ma wektora pinu, ktory moglby pokryc sciezke Missing. Testy Missing/STRICT sa w rust-port/engine/tests/p6_power_nozeros.rs (9 testow). Strictness jest decyzja procesu z dispatchu, nie parytetem z webem.

Zarzut 2 (comp_or_zero mapuje brak/null na ExplicitZero): PRZYJMUJE jako potwierdzenie zgodnosci. Bez zmiany kodu.
  Dowod: web linie 230, 250, 251, 257 maja `?? 0`. Mapowanie brak/null -> ExplicitZero odpowiada temu zerowi jawnemu. Wartosci power, powerBase i components w asercjach sa te same.

Zarzut 3 (Component::Provided(NaN) nie jest odrzucany; ujemne przycinane do 0): ODRZUCAM jako regresje tematu. PRZYJMUJE jako dlug do osobnej decyzji.
  Dowod, ze to nie regresja: w bazie 94cba6667 `nonneg = |v| v.max(0.0)` (brake_power.rs:145); w 9b0b3bf65 funkcja `get` w compute_objective_power robi ten sam `v.max(0.0)`. Zachowanie identyczne.
  Dowod, ze to jednak dlug zgodny z celem GOAL (brak cichych zer): probe rustc pokazuje, ze f64::NAN.max(0.0) = 0.0, czyli NaN znika jako ciche zero. Web (`Math.max(0, NaN)`) zwraca NaN, wiec Rust dzis rozjezdza sie z webem w tym przypadku.
  Ujemne wartosci: web `Math.max(0, x)` tez je przycina, wiec przycinanie ujemnych jest zgodne z webem.
  Dlaczego nie poprawiam w tym temacie: poprawka zmienia semantyke Provided(NaN) i to jest wybor produktowy/parytetowy, nie czysto techniczny. Opcje dla orkiestratora / pytania ABC do wlasciciela:
    A (rekomendacja Operatora): NaN w Provided traktowac jak Missing - w STRICT daje MissingComponents, bez cichego zera. Zgodne z GOAL, rozjazd z webem (web propaguje NaN) wymaga swiadomej akceptacji.
    B: NaN propagowac jak web (zwrot NaN) - zgodne z parytetem, ale NaN dotrze do dalszych obliczen.
  Temat: osobny R-RUSTPORT-P6-POWER-NAN-Q1 po decyzji. Nie zmieniam w tym temacie.

Zarzut 4 (8 skladnikow bez producenta nadal bez zrodel): ODRZUCAM jako blokade tematu. PRZYJMUJE jako warunek dla W8.
  Dowod: kazde pole ObjectivePowerRaw (brake_power.rs, struct od linii 127) ma typ `Component` bez wartosci domyslnej. Pole bez producenta zostaje Missing, a compute_objective_power zwraca MissingComponents, nie 0. Testy: open_components_without_producer_list_is_exactly_no_producer_keys oraz all_open_components_missing_are_listed_in_component_order w p6_power_nozeros.rs.
  Ryzyko z dispatchu (ciche zera w W8) jest zamkniete na poziomie typu: brak zrodla nie moze wyjsc jako 0 bez jawnego ExplicitZero lub Provided.
  Zrodla 8 skladnikow to osobny temat POWER-REST (lista zadan, pozycja #35, status pending) - zgodnie z dispatchem, nie w tym temacie.
  Zaleznosc dla W8 (zapisuje do raportu): (a) objective_power_for_owner i compute_objective_power zwracaja Result - W8 musi go obsluzyc; (b) power_map w brake_inputs.rs (Fn(i64) -> f64) jest nadal generyczny i nie zostal zmieniony w tym temacie - W8 musi sam przejsc z Result na obsluge bledu, nie przez unwrap bez decyzji.

NASTEPNY KROK: Final Control (Sonnet) na 9b0b3bf65 + ten commit obrony. Orkiestrator decyduje o pytaniu ABC z zarzutu 3 (opcje A/B) przed integracja. Wybor A lub B wymaga osobnego tematu, nie zmiany w tym.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push, bez integracji).
RUNDY: 1/5 (obrona Operatora r1; ocena Evaluatora 6f463264d PASS-WITH-NOTES; brak nowej rundy kodu)
BLOKADY: brak w tym temacie. Otwarte: decyzja NaN (zarzut 3, dlug); zrodla 8 skladnikow (POWER-REST); zmiana power_map w W8.
