# DISPATCH R-RUSTPORT-P6-K5DOC-T7B-ODWROT (runda 1) — ODWRÓT: `_bestFallBackStep` i `_fallBackStep` (#261 część B, K5DOC-T7b)

DOMENA: engine Rust (silnik bitwy oblężniczej, czysta logika kroku). MODEL: HAIKU (Operator), SONNET (Ewaluator, FC), HAIKU (Obrona) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `f85622878` (zawiera T4b, T4c, T5a, T5b, T6). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
Rozpoznanie wejściowe: `git show f85622878:dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7-FALANGA-ROZPOZNANIE/01-rozpoznanie.md` — przeczytaj sekcje o T7b w całości.
PUNKTY W PINIE (ZWERYFIKUJ przed każdym wektorem: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`):
- `_bestFallBackStep` 7186–7225: DIRS4; odrzuca zajęte (`occByKey`), nieprzejezdne (`_passableForUnit`), `dMin <= 1`, `dMin < dNow`; wynik `homeBias*100 + dMin`, `homeBias = atk ? -nc : nc`; `>` = pierwszy wygrywa remis; `null` = zaklinowany.
- `_fallBackStep` 7228–7243: guard finished/dead/fading/`moveLeft<=0`; wybór kroku (`_bestFallBackStep`); `_doMove`; callback: `moveLeft>0` → `_schedule(STEP_GAP_MS, _fallBackStep)` (7241), inaczej `done()`.
- Wołający: U7.6 w `_activateUnit` (6249–6276, wywołanie 6275) — tylko do odczytu, NIE portować gałęzi U7.6.
- Stała: `FALLBACK_TILES = 3` (pin 1161) — już w Rust: `siege_tactics_activate.rs:43` (`FALLBACK_TILES: f64 = 3.0`). Użyj istniejącej, nie duplikuj.
WZÓR: T4b — `rust-port/engine/src/domain/siege_tactics_advance.rs` (wzorzec `AfterStep::Schedule`, trait `AdvanceWorld`, `advance_step_decide`); efekty ruchu — `siege_tactics_move_effects.rs` (T4c, `do_move_effects`, trait `MoveWorld`). Generator wzorem `rust-port/engine/tests/p6_k5doc_t4c_gen.mjs`.

## DECYZJA (podjęta przez orkiestratora)
- Zakres T7b: `best_fall_back_step` (czysta funkcja wyboru kroku) i `fall_back_step_decide` (decyzja jednego kroku: Done / Move(kroku) / Schedule — wzorem T4b), oraz `fall_back_after_move` (co po kroku: planowanie kolejnego kroku, gdy `moveLeft > 0`).
- **Scheduling jest zwracany jako `AfterStep::Schedule`, nie wykonywany** (`_schedule` to UI/czas). Efekty ruchu przez `MoveWorld` (T4c), nie przez `_doMove` bezpośrednio.
- **Wiring do `ActivateUnit`/`siege_tactics_loop.rs` (`FallBackStep` nadal `unported`, linie 1053–1055, 1479–1490) — POZA zakresem.** Gałąź U7.6 w `siege_tactics_activate.rs` NIE zmieniona.
- **`_passableForUnit`, `_nearestEnemy`, `_enemiesOf`, `occByKey`** — przez trait (wejście), nie portowane.
- **Dwa typy stałych `BF_COLS`** (i64 w `siege_tactics_approach.rs:210`, f64 w innych): wybierz JEDEN typ dla granic i zapisz wybór w raporcie (rozpoznanie ostrzega). Nie przerabiaj istniejących modułów.

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_fallback.rs` (NOWY): `best_fall_back_step(...) -> Option<CellKey>`, `fall_back_step_decide(...)`, `fall_back_after_move(...)`, trait `FallBackWorld`.
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_fallback;` (alfabetycznie, zgodnie z `cargo fmt`).
3. Wektory: `rust-port/engine/tests/p6_k5doc_t7b_gen.mjs` (NOWY) wykonuje tekst pina przez TypeScript i zapisuje `p6_k5doc_t7b_vectors/vectors.json`. Testy `rust-port/engine/tests/p6_k5doc_t7b.rs` (NOWY) porównują bajt-w-bajt.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_fallback.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_fallback;`
- `rust-port/engine/tests/p6_k5doc_t7b*.rs` (NOWE), `p6_k5doc_t7b_gen.mjs` (NOWY), `p6_k5doc_t7b_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T7B-ODWROT/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_advance.rs`, `siege_tactics_move_effects.rs`, `siege_tactics_kite.rs`, `siege_tactics_ranged_forward.rs`, `ActivateOps`, `ProdBody`.
- Nie portuj falangi (T7a), gałęzi U7.6, `_activateUnit` ani `_schedule`.
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`. Bez `Cargo.lock`.

## WEKTORY / TESTY
- Wybór kroku: brak wolnego sąsiada → `None`; zajęte pole odrzucone; nieprzejezdne odrzucone; `dMin <= 1` odrzucone; `dMin < dNow` odrzucone; wynik `homeBias*100 + dMin` (`atk` true i false — dwa wektory); remis wg kolejności DIRS4 (pierwszy wygrywa).
- Granice planszy z pinu (`nc<0`, `nc>=BF_COLS`, `nr>=BF_ROWS`, `nr<0`) — wektor z kandydatem poza planszą.
- Decyzja: `moveLeft <= 0` → Done; martwy/fading → Done; `moveLeft > 0` i krok → Move + Schedule po ruchu; brak kroku → Done (zaklinowany).
- Każdy wektor z `plik:linia` pinu w komentarzu testu. Wartości z wykonania pina przez TypeScript.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) `dMin < dNow` → `dMin <= dNow`, (b) `>` → `>=` w remisie (pierwszy przestaje wygrywać), (c) `homeBias` znak odwrócony.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. **Przed każdą bramką `df -h /`; przy < 8 GB BLOCK z liczbą GB.**
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w trailerach. Bez push do parity. Raport `01-operator-r1.md` w run dir.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo, unikalny; usuń po bramkach.
