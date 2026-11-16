# DISPATCH R-RUSTPORT-P6-INTEG-K5DOC-T2-T3 (runda 1) — integracja K5DOC-T2 CELE i K5DOC-T3 GEOMETRIA na parity (#290, #256)

DOMENA: silnik oblężenia (engine), temat gry (model: HAIKU — integracja, reguła właściciela; nie 3D).
BAZA: `origin/rust-port/parity-v2` = `9f7c55499` (zawiera I2, I3). Worktree detached.
ŹRÓDŁA (oba po FC PASS-WITH-NOTES):
- K5DOC-T2 CELE — FC `03dfa64c2` (wcześniej odłożona integracja)
- K5DOC-T3 GEOMETRIA — FC `efa3b7642`, kod `85befb9ff`
Oba merge-tree czyste względem bazy osobno; sprawdź też po kolejnym merge.

## ZAKRES
1. `git merge --no-ff 03dfa64c2`, potem `git merge --no-ff efa3b7642` (kolejność: T2 pierwszy).
2. Konflikt (jeśli wystąpi) przy `mod.rs` — zachować wszystkie linie `pub mod`; przy kodzie: zachować obie strony, nie zmieniać semantyki.
3. Nie zmieniać `gra/`, `renderer/`.

## BRAMKI (rust-port/engine)
- `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (unikalny).
- `cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; PEŁNY `cargo test --all-targets --no-fail-fast` w tle (`setsid nohup … < /dev/null &`), odpytywanie logu aż do końca; wynik = EXIT i sumy `test result`.
- Wymóg: >= 8 GB wolnego przed bramką; przy mniej — BLOCK z liczbą GB.

## ALLOWLISTA
- pliki zmienione przez merge obu commitów; `rust-port/engine/src/domain/mod.rs` (tylko `pub mod`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-INTEG-K5DOC-T2-T3/**`
- NIE commitować `Cargo.lock`. NIE pushować do parity.

## KRYTERIA KOŃCA
- Bramki zielone; utrata funkcji z którejkolwiek strony = FAIL; brak `#[ignore]`.
- Raport: SHA końcowego merge, EXIT każdej bramki, sumy testów, lista konfliktów i decyzji.
- Orkiestrator robi FF na parity po zielonych bramkach.
