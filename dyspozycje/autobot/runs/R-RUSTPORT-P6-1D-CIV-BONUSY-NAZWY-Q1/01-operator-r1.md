STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-1D-CIV-BONUSY-NAZWY-Q1
GOAL: port logiki `city-names-pool.ts` (23 eksporty) i `civ-bonuses.ts` (17 eksportow) do Rust: kazdy symbol PORTOWANY z wektorem z uruchomionego weba / DANE-JUZ-W-RUST / NIE-DOTYCZY; brak literalow danych w kodzie; niezalezny weryfikator 0 rozbieznosci; bramki fmt/clippy/test zielone.
ZMIANY/COMMIT: allowlista (zob. `dyspozycje/rust-port/p6/P6-1D.md` §7); commit w worktree wf_5a999a56-eb6-1 (SHA w odpowiedzi Operatora), bez push.
TESTY: `cargo fmt --check` EXIT=0 (`gate-fmt-r1.log`); `cargo clippy --all-targets -- -D warnings` EXIT=0 (`gate-clippy-r1.log`); `cargo test` 437 passed / 0 failed, EXIT=0 (`gate-test-r1.log`; baseline 406 + 31 nowych: p6_1d_civ_bonuses 14, p6_1d_city_names 13, p6_1d_tables 4); weryfikator Python 790309 sprawdzen, 0 rozbieznosci, EXIT=0 (`verify-p61d-r1.log`).
BLOKADY: brak. Jawne ograniczenia (P6-1D.md §5): `ł` nie dekomponuje sie w NFD (zachowanie weba odtworzone), Hangul i plaszczyzny astralne NIE_ZMIERZONO, trzy litery Unicode (U+A7CE/D2/D4) poza hashem BMP (dryf wersji Unicode Node vs Rust), weryfikator Python ma Unicode 14 (nie weryfikuje niezaleznie calego BMP; to robi test Rust vs Node).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Haiku 5.5) - niezalezna kontrola: przebieg gate, przeglad `civ_bonuses.rs`/`city_names.rs` wzgledem TS, test negatywny, audyt literalow; nastepnie Final Control.
DEPLOY/PUSH: NIE WYKONANO
