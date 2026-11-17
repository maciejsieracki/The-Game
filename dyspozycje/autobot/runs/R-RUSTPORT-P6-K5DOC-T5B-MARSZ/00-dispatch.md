# DISPATCH R-RUSTPORT-P6-K5DOC-T5B-MARSZ (runda 1) — STRZELEC-MARSZ: podejście strzelca (APPROACH) i _rangedForwardStep (#260, K5DOC-T5b)

DOMENA: engine Rust (silnik bitwy oblężniczej, czyste funkcje). MODEL: HAIKU (Operator), SONNET (Evaluator, FC), HAIKU (Obrona) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `625624d97` (zawiera T4a, T4b, T5a). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
PUNKTY WEJŚCIA W PINIE (orientacyjne — ZWERYFIKUJ przed każdym wektorem przez `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`):
- `_rangedForwardStep` ~6776, `_bestForwardStep` ~6822, `_rangedAction` gałąź APPROACH (D2/D3/D4), `_siegeMachineRange` ~7530 (NIEPRZECZYTANE — przeczytaj w całości przed decyzją o zakresie).
WZÓR: moduł T5a — `rust-port/engine/src/domain/siege_tactics_kite.rs` oraz generator `rust-port/engine/tests/p6_k5doc_t5a_gen.mjs` (wykonuje tekst pina przez TypeScript i zapisuje wektory JSON). Helpery `manhattan`, `enemies_of`, `advance_dir`, `cell_key`, `BF_COLS`, `BF_ROWS` już istnieją w `siege_tactics_doctrine_target.rs`, `siege_tactics_doctrine_state.rs`, `siege_tactics_autobatch.rs`.

## DECYZJA (podjęta przez orkiestratora)
- Zakres T5b to WYŁĄCZNIE czyste funkcje (`_rangedForwardStep`, `_bestForwardStep` i predykat/krok APPROACH, jeśli jest czysty), BEZ wpięcia w `_rangedAction`, `ActivateOps` i `siege_tactics_activate.rs`. Wpięcie to T8 / #113.
- `_rangedBackStep` i `_bestBackStep` są POZA zakresem (należą do KITE, już w T5a).
- Jeśli `_siegeMachineRange` (7530) okaże się zależnością czystą i potrzebną do APPROACH — włącz ją do zakresu i opisz. Jeśli zależy od stanu gry niedostępnego w module — NIE PORTUJ, zapisz w raporcie jako NIE_ZMIERZONO z powodem.

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_ranged_forward.rs` (NOWY): 1:1 z pinem `_rangedForwardStep` i `_bestForwardStep` (zwrot `Option<CellKey>`, kolejność DIRS4 z pina, odrzuty: plansza, zajętość, przejezdność, brak celu w zasięgu, warunek postępu; remis jak w pinie — zapisz który).
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_ranged_forward;`.
3. Wektory: `rust-port/engine/tests/p6_k5doc_t5b_gen.mjs` (NOWY) wykonuje tekst pina i zapisuje `p6_k5doc_t5b_vectors/vectors.json`. Testy Rust `rust-port/engine/tests/p6_k5doc_t5b.rs` (NOWY) czytają wektory i porównują z wynikiem Rust bajt-w-bajt.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_ranged_forward.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_ranged_forward;`
- `rust-port/engine/tests/p6_k5doc_t5b*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_t5b_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_t5b_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5B-MARSZ/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_kite.rs`, `siege_tactics_doctrine_*`, `ActivateOps`, `ProdBody`.
- Nie portuj `_rangedBackStep`, `_bestBackStep` (KITE, T5a) ani `_advanceStep`/`_doMove` (T4c).
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`.

## WEKTORY / TESTY
- `best_forward_step`: brak wroga → `None`; granica planszy (`nc<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`, `nr<0`) z przypadkiem, w którym jedyny kandydat wypada poza planszą; zajęty kafelek; brak postępu odrzuca; remis wg kolejności DIRS4.
- `rangedForwardStep`: każdy wektor z `plik:linia` pinu w komentarzu testu.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) warunek postępu ostro → nieostro (tylko jeśli nierównoważny — udowodnij), (b) granica `nc>=BF_COLS` → `nc>BF_COLS`, (c) kolejność DIRS4 odwrócona.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB (nie uruchamiaj bramki na pół).
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5B-MARSZ/01-operator-r1.md`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
6. Każdy wektor ma wartość z pina policzoną przez generator (TypeScript), nie wpisaną ręcznie.
