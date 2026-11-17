# DISPATCH R-RUSTPORT-P6-R7K7C-WIRING (runda 1) — wpięcie apply_dipl_deltas_to_state w advance_turn (#106, #298, #299)

DOMENA: GAME (Rust, engine, tura dyplomacji). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator SONNET, FC SONNET. BEZ renderer/ i gra/ (poza odczytem).
BAZA (jedyna): `origin/rust-port/parity-v2` = `760be5187`. Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/`: znajdź wołający deltas dyplomacji w turze (`git grep -n "R7K7\|applyDipl\|dipl.*delta\|zarejestrujDelta" 07d2fbd72 -- gra/src`) i zasadę "brak wpisu = 0" (wartość domyślna bez wpisu w tabeli).
RUST: `rust-port/engine/src/domain/turn_war_dipl_steps.rs:1034` (`apply_dipl_deltas_to_state`, istnieje, NIEWOŁANE w produkcji), `rust-port/engine/src/domain/playable.rs:1400` (`advance_turn`), `playable.rs:1717` (test trzech tur po stores).

## CEL
Wpiąć `apply_dipl_deltas_to_state` w `advance_turn` w kolejności zgodnej z pinem, zapewnić parytet "brak wpisu = 0", dopisać wektory ≥ 150 dla samego apply i dla D3 (#299).

## ALLOWLISTA
- `rust-port/engine/src/domain/playable.rs` (wiring w `advance_turn`)
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (tylko jeśli potrzebna zmiana sygnatury; inaczej bez zmian)
- `rust-port/engine/tests/p6_r7k7c*.rs`, `p6_r7k7c_gen.mjs`, `p6_r7k7c_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-WIRING/**`

## NIE ROBIĆ
- Nie zmieniaj `gra/`, `renderer/`, `view-model/`, `Cargo.lock`, innych modułów domain poza allowlistą.
- Decyzje gameplay (kolejność faz, progi) NIE są Twoje: jeśli pin i Rust się rozjeżdżają, zapisz w raporcie jako DECISION_REQUIRED, nie wybieraj.
- Nie dodawaj nazwy modelu do trailerów. Nie używaj `#[ignore]`.

## WEKTORY / TESTY
- Wektory `apply_dipl_deltas_to_state` ≥ 150 przypadków, generowane wykonaniem tekstu pina przez TypeScript, każdy z `plik:linia`.
- Test "brak wpisu = 0": brak wpisu w tabeli daje zerową deltę (nie błąd, nie brak zmiany).
- Test wiringu: trzy tury `advance_turn` z deltami; wynik zgodny z wektorami.
- Mutacje (MUSZĄ dać FAIL): (a) usunięcie wywołania z `advance_turn`; (b) "brak wpisu" traktowany jako błąd; (c) zamiana kolejności apply względem poprzedniego kroku tury.

## BRAMKI (crate civ-engine w `rust-port/engine`)
- `CARGO_TARGET_DIR` poza repo; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- `df -h /` przed bramkami i mutacjami: ≥ 8 GB, inaczej BLOCK INFRA z liczbą GB.
- `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_r7k7c`; `cargo test --all-targets --no-fail-fast` (w tle, `timeout 1800`). Kody wyjścia w raporcie.

## KRYTERIA KOŃCA
1. Wiring w `advance_turn`, wektory ≥150 zielone, mutacje FAIL, bramki EXIT 0.
2. Commit jawnym `git add`, bez `Cargo.lock`, bez push do parity. Raport `01-operator-r1.md`.
