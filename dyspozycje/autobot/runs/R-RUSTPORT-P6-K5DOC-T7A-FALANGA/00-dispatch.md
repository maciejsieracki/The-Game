# DISPATCH R-RUSTPORT-P6-K5DOC-T7A-FALANGA (runda 1) — FALANGA: `_phalanxAction`, `_phalanxLineFront`, `_phalanxStep` (#261 część A, K5DOC-T7a)

DOMENA: engine Rust (silnik bitwy oblężniczej, czysta logika kroku). MODEL: HAIKU (Operator), SONNET (Ewaluator, FC), HAIKU (Obrona) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `f85622878` (T4a, T4b, T4c, T5a, T5b, T6). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
Rozpoznanie wejściowe: `git show f85622878:dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7-FALANGA-ROZPOZNANIE/01-rozpoznanie.md` — przeczytaj sekcje o T7a w całości (w tym ustalenie krytyczne o ścieżce wywołania).
PUNKTY W PINIE (ZWERYFIKUJ przed każdym wektorem: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`):
- `isPhalanx` ~1538–1544 (port do NOWEGO predykatu; istniejące reguły nazwowe w `diplomacy.rs:4105` i `unit_replace_defs.rs:92` mają INNE reguły — NIE używaj ich).
- `PHALANX_LEAD_TOLERANCE = 2` ~1168.
- `_phalanxLineFront` ~6519 — front linii falangi własnej strony (wejście: lista falang własnej strony).
- `_phalanxAction` ~6290 — wołana z `_activateUnit` poza blokiem doktryny (6093–6098).
- `_phalanxStep` ~6576–6652 (przybliżone ±1; zweryfikuj) — kroki falangi, wywołanie `_doMove` ~6576.
- `primary_ranged` wroga: pin ~6597–6599 — w Rust brak pola w `EnemyRef` (`siege_tactics_activate.rs:104–111`); dodaj jako WEJŚCIE w traicie, nie zmieniaj struktury `EnemyRef`.

## DECYZJA (podjęta przez orkiestratora)
- Ścieżka wywołania (ustalenie z rozpoznania): w trybie ręcznym (`_manualMode` domyślnie `true`, pin 2286) i przy doktrynie `manual` falanga idzie przez `_phalanxAction`. W trybie auto z doktryną `steady` idzie przez `_executeGroupDoctrineStep` → `_advanceStep` i OMIJA linię falangi. **Wiring (kiedy wołać `_phalanxAction`) — POZA zakresem (T8/#113).** Port funkcji jest niezależny od tego, kiedy jest wołany.
- Zakres: czyste funkcje `is_phalanx`, `phalanx_line_front` (wejście = lista falang własnej strony jako wejście traitu), `phalanx_action_decide` (decyzja jednego kroku falangi, wynik Done / Move / Schedule — wzorem T4b), `phalanx_step_decide` (kroki falangi z `PHALANX_LEAD_TOLERANCE`). Ruch przez `MoveWorld` (T4c, `do_move_effects`), NIE przez `_doMove` bezpośrednio.
- Animacja, `busy`, `_raf`, `_schedule`, `done()` — POZA zakresem; scheduling zwracany jako `AfterStep::Schedule`.
- Gałąź U7.6/U7.8 w `siege_tactics_activate.rs` NIE zmieniona. `FallBackStep`/`PhalanxAction` w `siege_tactics_loop.rs` (1053–1055, 1479–1490) — NIE zmieniaj (wiring).

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_phalanx.rs` (NOWY): `is_phalanx`, `phalanx_line_front`, `phalanx_action_decide`, `phalanx_step_decide`, trait `PhalanxWorld` (wejścia: enemies, primary_ranged, occupancy, passable, move cost przez `MoveWorld`).
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_phalanx;` (alfabetycznie, zgodnie z `cargo fmt`).
3. Wektory: `rust-port/engine/tests/p6_k5doc_t7a_gen.mjs` (NOWY) wykonuje tekst pina przez TypeScript i zapisuje `p6_k5doc_t7a_vectors/vectors.json`. Testy `rust-port/engine/tests/p6_k5doc_t7a.rs` (NOWY) porównują bajt-w-bajt.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_phalanx.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_phalanx;`
- `rust-port/engine/tests/p6_k5doc_t7a*.rs` (NOWE), `p6_k5doc_t7a_gen.mjs` (NOWY), `p6_k5doc_t7a_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7A-FALANGA/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_advance.rs`, `siege_tactics_move_effects.rs`, `siege_tactics_fallback.rs` (T7b), `siege_tactics_kite.rs`, `siege_tactics_ranged_forward.rs`, `ActivateOps`, `ProdBody`, `diplomacy.rs`, `unit_replace_defs.rs`.
- Nie portuj `_fallBackStep`/`_bestFallBackStep` (T7b), gałęzi U7.6, wiringu, animacji, `_schedule`.
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`. Bez `Cargo.lock`.

## WEKTORY / TESTY
- `is_phalanx`: wektory z pina (1538–1544), co najmniej po jednym przypadku pozytywnym i negatywnym dla każdej gałęzi reguły.
- `PHALANX_LEAD_TOLERANCE = 2`: wektor graniczny (różnica dokładnie 2 i 3).
- `phalanx_line_front`: pusta lista → None; kilka falang → front wg pina.
- `phalanx_step_decide`: wróg z `primary_ranged` pomijany (pin 6597–6599); krok zajęty/nieprzejezdny odrzucony; `moveLeft <= 0` → Done.
- Każdy wektor z `plik:linia` pinu w komentarzu testu. Wartości z wykonania pina przez TypeScript.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) `PHALANX_LEAD_TOLERANCE` 2 → 3, (b) pominięcie filtra `primary_ranged`, (c) `is_phalanx` negacja jednej gałęzi.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. **Przed każdą bramką `df -h /`; przy < 8 GB BLOCK z liczbą GB.**
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w trailerach. Bez push do parity. Raport `01-operator-r1.md` w run dir.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, unikalny; usuń po bramkach.
