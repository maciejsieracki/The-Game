STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-RANGED-CLEANUP-Q1
GOAL: RangedShot::damage jako f64 (wartosc = dawne damage_exact dla skonczonych, NaN/Infinity zachowane); usuniecie publicznej ranged_shot_damage(i64) i przelaczenie testow na ranged_shot_damage_f64; brak zmian wynikow dla wartosci skonczonych.
ZMIANY/COMMIT: baza a8210a4f2 (INTEG-B19; SHA dostepny, fallback 358cb6cf6 nieuzyty). Commit lokalny na gałęzi roboczej rust-port-wip/R-RUSTPORT-P6-RANGED-CLEANUP-Q1 (SHA w rejestrze raportu orkiestratora). Bez push.
  Allowlista: rust-port/engine/src/domain/combat.rs, rust-port/engine/src/domain/unit_power.rs, rust-port/engine/tests/p6_repin_dystans_petla.rs, rust-port/engine/tests/p6_repin_dystans_formulas.rs, rust-port/engine/tests/p6_ranged_damage_nan.rs, dyspozycje/autobot/runs/R-RUSTPORT-P6-RANGED-CLEANUP-Q1/**.
  Zmiany produkcyjne:
  - unit_power.rs: usunieta funkcja ranged_shot_damage(..) -> i64 wraz z doc. Pozostaje ranged_shot_damage_f64 (bez zmian).
  - combat.rs: RangedShot::damage: i64 -> f64 (wartosc = dawne damage_exact, NaN/Infinity zachowane). Pole damage_exact usuniete (zastapione przez damage); usunieta pomocnicza damage_exact_to_i64. Wyniki routingu HP bez zmian (HP celu liczone z tej samej wartosci co przed zmiana).
  Zmiany testowe (zmienione asercje, z uzasadnieniem typ/wartosc):
  - p6_repin_dystans_petla.rs: import ranged_shot_damage -> ranged_shot_damage_f64 (typ); assert damage == 45 -> 45.0 (typ i64->f64); s.damage as f64 -> s.damage (2x, usuniety cast); assert damage == 0 -> 0.0 (typ); porownanie z funkcja i64 -> ranged_shot_damage_f64 (ta sama wartosc 45).
  - p6_repin_dystans_formulas.rs (plik spoza dwoch wymienionych w dispatchu; importowal usunieta funkcje, wiec musial sie zmienic): import i wywolania -> ranged_shot_damage_f64; oczekiwane z JSON rzutowane as f64 (wartosci identyczne); literaly calkowite w asercjach -> literaly f64 (typ). Liczba wektorow bez zmian (>= 2480).
  - p6_ranged_damage_nan.rs: import ranged_shot_damage usuniety; usuniety wariant i64 w petli wektorowej (asercja got_i == exp); usuniete asercje na funkcji i64 (NaN -> 1 oraz Infinity -> i64::MAX). Ich odpowiedniki f64 (NaN.is_nan(), Infinity) sa juz w tym samym tescie. s.damage_exact -> s.damage (zmiana nazwy pola, typ). Asercja s.damage == 0 w przypadku NaN -> s.damage.is_nan() (ZMIANA WARTOSCI: pole damage jest teraz f64 i przenosi NaN jak pin; dawniej NaN -> 0 w polu i64). Asercja damage == 45 -> 45.0 (typ).
TESTY:
  - cargo fmt --check: exit 0.
  - cargo clippy --all-targets -- -D warnings: exit 0.
  - cargo test --lib: 94 passed, 0 failed.
  - p6_repin_dystans_petla: 3 passed; p6_repin_dystans_formulas: 8 passed; p6_repin_dystans_fieldpower: 1 passed; p6_ranged_damage_nan: 7 passed; p6_unit_power_maxnan: 2 passed; combat: 7 passed.
  - p6_combat_harness: NIE_ZMIERZONO - w rust-port/engine/tests nie ma pliku ani targetu o tej nazwie (cargo test --test p6_combat_harness nie znajduje targetu).
  - Toolchain: cargo 1.97.0 (c980f4866 2026-06-30), rustc 1.97.0 (2d8144b78 2026-07-07).
  - Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR w worktree (usuwany po bramkach).
  - Cargo.lock wygenerowany lokalnie przez cargo (nieSledzony) - usuniety, NIE commitowany.
BLOKADY: brak (p6_combat_harness: brak targetu w repo, patrz TESTY). Dysk przy starcie: 3.9 GB wolne (< 6 GB): kompilacja wykonana, wlasny target usuniety po bramkach.
RUNDY: 1/5 (Operator, HAIKU).
NASTEPNY KROK: Evaluator (weryfikacja allowlisty i zmian asercji wg listy powyzej; zwrocic uwage na zmiane wartosci NaN w tescie nan oraz na p6_repin_dystans_formulas.rs spoza listy dispatchu).
DEPLOY/PUSH: NIE WYKONANO (lokalny commit; bez push, bez integracji).
