# DISPATCH R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING (runda 1) — wpięcie ruchu pieszego w ProdBody (#315, odblokowuje #123)

DOMENA: GAME (Rust, engine). MODEL: Operator HAIKU, Obrona HAIKU, Evaluator SONNET, FC SONNET. BEZ zmian w renderer/ i gra/.
BAZA (jedyna): `origin/rust-port/parity-v2` = `760be5187` (zawiera T4a `312`, T4b `313`, T4c `314`, T4 `258`). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_advanceStep` (decyzja pieszego, kroki 1–10), `_doMove` (ok. 8685–8776), `_stepToward`, `_bfsFirstStep`. Każdy wektor z `plik:linia` pinu.
RUST (istniejące, nie przepisuj): `rust-port/engine/src/domain/siege_tactics_pathstep.rs` (T4a), `siege_tactics_advance.rs` (T4b: `advance_step_decide`, trait `AdvanceWorld`, `AfterStep::Schedule`), `siege_tactics_move_effects.rs` (T4c: `do_move_effects`, trait `MoveWorld`), `siege_tactics_loop.rs:1092` (`ProdBody<R: RollSource>`).

## CEL
Podpiąć ruch pieszego (krok `advance_step_decide` → `do_move_effects`) w `ProdBody`, tak aby tura pieszej jednostki wykonywała ruch z efektami (occByKey, koszt terenu, facing). Decyzja orkiestratora: koszt ruchu liczony PER JEDNOSTKA (zależy od `mounted`), nie stałą wartością z pinu dla całej grupy.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_loop.rs` (wiring ProdBody)
- `rust-port/engine/src/domain/mod.rs` (tylko jeśli nowy moduł)
- `rust-port/engine/tests/p6_k5doc_t4e*.rs`, `p6_k5doc_t4e_gen.mjs`, `p6_k5doc_t4e_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4E-PIESZY-WIRING/**`

## NIE ROBIĆ
- Nie zmieniaj `gra/`, `renderer/`, `view-model/`, `Cargo.lock`, `siege_tactics_advance.rs`/`_move_effects.rs` poza ich publicznym API (jeśli wymagana zmiana — BLOCK z uzasadnieniem).
- Nie dodawaj nazwy modelu do trailerów commitów.
- Nie używaj `#[ignore]` ani osłabiania asercji.

## BRAMKI (engine, crate civ-engine w `rust-port/engine`)
- `CARGO_TARGET_DIR` poza repo; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- Przed bramkami i przed każdą mutacją: `df -h /`. Wymagane ≥ 8 GB. Przy < 8 GB: BLOCK INFRA z liczbą GB, bez uruchamiania na pół.
- `cargo fmt --check -p civ-engine`; `cargo clippy --all-targets -- -D warnings`; `cargo test --test p6_k5doc_t4e`; `cargo test --all-targets --no-fail-fast` (w tle, `timeout 1800`, wynik do pliku). Kody wyjścia w raporcie.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) pominięcie kosztu terenu w ruchu; (b) odwrócenie kolejności efektów (facing przed occByKey); (c) koszt stały zamiast per `mounted`. Każdą przywróć z kopii, potwierdź zerowy diff.

## KRYTERIA KOŃCA
1. Wektory z pinu zielone; mutacje FAIL; wiring ProdBody pokryty testem end-to-end (sekwencja tury z ruchem pieszego).
2. Commit jawnym `git add` (nigdy `-A`), bez `Cargo.lock`, bez push do parity. Raport `01-operator-r1.md`.
