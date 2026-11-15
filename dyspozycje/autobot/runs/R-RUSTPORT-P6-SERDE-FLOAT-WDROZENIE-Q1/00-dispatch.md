# DISPATCH R-RUSTPORT-P6-SERDE-FLOAT-WDROZENIE-Q1 (runda 1) — WDROŻENIE DECYZJI TAK (#170 / #139 / #151 / #232)

TEMAT: włączyć feature `float_roundtrip` serde_json w `rust-port/engine` i usunąć tolerancję `close()` (1e-9) w `p6_brake_inputs_vectors.rs` — porównanie bit-w-bit. Decyzja zatwierdzona w `dyspozycje/rust-port/p6/SERDE-FLOAT-DECYZJA.md` (FC PASS-WITH-NOTES `4cb572a95`).
DOMENA: GAME (testy wektorowe). Model: Operator HAIKU, Evaluator SONNET, Obrona HAIKU, FC SONNET.
BAZA (jedyna obowiązująca): `f7baa3848`. Worktree detached. Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## KROKI
1. `rust-port/engine/Cargo.toml:9`: `serde_json = { version = "...", features = ["float_roundtrip"] }` (zachowaj wersję i resztę).
2. `rust-port/engine/tests/p6_brake_inputs_vectors.rs`: usuń `close()` z tolerancją 1e-9 (linie ok. 367-372, 452, 466, 471, 475) i porównuj przez `to_bits()` lub `==` na f64 zgodnie z wektorem pinu.
3. Jeśli któryś wektor nie przechodzi bit-w-bit: NIE luzuj asercji. Zapisz konkretny przypadek (plik:linia, wartość) jako NIE_ZMIERZONO w `01-operator-r1.md` i zgłoś BLOCK z dowodem.

## BRAMKI (EXIT zapisany)
`cargo fmt --check`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_brake_inputs_vectors`; `cargo test --lib`.

## KRYTERIA KOŃCA
1. Feature włączony w Cargo.toml; `close()` usunięte z p6_brake_inputs_vectors.rs.
2. Bramki EXIT 0 lub udokumentowany BLOCK z dowodem.
3. Brak `#[ignore]`, brak osłabionych asercji, brak zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/engine/Cargo.toml`
- `rust-port/engine/tests/p6_brake_inputs_vectors.rs`
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-SERDE-FLOAT-WDROZENIE-Q1/**`

Commit jawnym `git add`. NIE commituj `Cargo.lock` (jeśli się zmieni — zgłoś w raporcie). NIE `git add -A`. Bez push do parity. Target CARGO poza repo; usuń po bramkach.
