# DISPATCH R-RUSTPORT-P6-K5DOC-T4C-DOMOVE (runda 1) — efekty _doMove: zajętość, koszt terenu, bród (#314, K5DOC-T4c)

DOMENA: engine Rust (silnik bitwy oblężniczej, czysta logika stanu). MODEL: HAIKU (Operator), SONNET (Ewaluator, FC), HAIKU (Obrona) — zgodnie ze skryptem w6s.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `417091872` (zawiera T4a, T4b, T5a, T5b, T6). Worktree detached. Zapisz SHA w raporcie.
PIN (tylko odczyt): `07d2fbd72`, `gra/src/battle/battleScene.ts`.
PUNKTY WEJŚCIA W PINIE (ZWERYFIKUJ przed każdym wektorem: `git show 07d2fbd72:gra/src/battle/battleScene.ts | sed -n 'A,Bp'`):
- `_doMove` 8685–8779: gałąź `_autoBatchPlanning` (8690–8706) i gałąź bezpośrednia (8718–8761, bez animacji).
- `_moveCostForUnit` 7436; `isFordTile` 1897; `BROD_RUCH_MULT` 983 (= 0.5).
WZÓR: moduły T4a/T4b — `rust-port/engine/src/domain/siege_tactics_pathstep.rs`, `siege_tactics_advance.rs`; generator wzorem `rust-port/engine/tests/p6_k5doc_t4a_gen.mjs` (wykonuje tekst pina przez TypeScript i zapisuje wektory JSON).

## DECYZJA (podjęta przez orkiestratora)
- Zakres T4c to WYŁĄCZNIE efekty STANU z `_doMove`: przesunięcie w `occByKey`, pozycja jednostki, koszt kroku z clampem [1, 99], mnożnik brodu, `moveLeft = max(0, moveLeft - stepCost)`, a w gałęzi planowania — dopisanie kroku do `intent.steps` i `intent.kind` (gdy nie `attack`).
- **Facing NIE jest portowany** (`_updateFacing` = #107, zablokowany). Wchodzi jako WEJŚCIE: trait z metodą `update_facing(&mut self, unit_id)`, którą test podstawia przez licznik wywołań. W raporcie zapisz: „facing = wywołanie wejścia, bez logiki”.
- **Animacja, `busy`, `_raf`, `done()`, `ru.group`, `hpBarGroup` — POZA zakresem** (UI). Wynik portu to pure function zwracająca nowy stan i flagę „wykonano”.
- **Gałąź odmowy `_siegeMoveRefused`** (8686–8689) — POZA zakresem; wejście `refused: bool` (test podaje true/false). Zapisz to jako wektory z `refused=true` (`moveLeft=0`, brak zmian zajętości).

## ZAKRES
1. `rust-port/engine/src/domain/siege_tactics_move_effects.rs` (NOWY): trait `MoveWorld` (occupancy move, `move_cost(col,row)`, `is_ford(col,row)`, `update_facing(unit)`), funkcja `do_move_effects(world, unit, col, row, refused, autobatch: Option<&mut Intent>) -> MoveOutcome`. Kolejność jak w pinie: najpierw odmowa, potem zajętość, potem pozycja, koszt, brod, `moveLeft`, facing.
2. `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_move_effects;` (w porządku alfabetycznym, zgodnie z `cargo fmt`).
3. Wektory: `rust-port/engine/tests/p6_k5doc_t4c_gen.mjs` (NOWY) wykonuje tekst pina i zapisuje `p6_k5doc_t4c_vectors/vectors.json`. Testy `rust-port/engine/tests/p6_k5doc_t4c.rs` (NOWY) porównują z wynikiem Rust bajt-w-bajt.

## ALLOWLISTA
- `rust-port/engine/src/domain/siege_tactics_move_effects.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` — TYLKO linia `pub mod siege_tactics_move_effects;`
- `rust-port/engine/tests/p6_k5doc_t4c*.rs` (NOWE), `rust-port/engine/tests/p6_k5doc_t4c_gen.mjs` (NOWY), `rust-port/engine/tests/p6_k5doc_t4c_vectors/**` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4C-DOMOVE/**`

## NIE ROBIĆ
- Nie zmieniaj `siege_tactics_activate.rs`, `siege_tactics_loop.rs`, `siege_tactics_pathstep.rs`, `siege_tactics_advance.rs`, `siege_tactics_kite.rs`, `siege_tactics_ranged_forward.rs`, `siege_tactics_doctrine_*`, `ActivateOps`, `ProdBody`.
- Nie portuj `_updateFacing` (#107), `_siegeMoveRefused` (już w K1 — tylko jako wejście), animacji ani `busy`.
- Nie zmieniaj `gra/`, `rust-port/view-model/**`, `rust-port/renderer/**`. Nie dodawaj `Cargo.lock`.

## WEKTORY / TESTY
- Zwykły krok: zajętość przeniesiona (stary klucz usunięty, nowy ustawiony), `moveLeft` zmniejszony o koszt.
- Koszt: clamp `max(1, min(cost, 99))`; koszt nieskończony (`Infinity`) → 99 (wektor graniczny).
- Brod: `stepCost = enterCost / 0.5` gdy startowe LUB docelowe pole to brod; w przeciwnym razie `enterCost`. Wektory: brod na starcie, brod na celu, brak brodu.
- `moveLeft` nie schodzi poniżej 0 (wektor: koszt większy niż pozostałe `moveLeft`).
- Gałąź planowania: `intent.steps` dostaje `{col,row}`; `intent.kind` zmienia się na `move` tylko gdy nie było `attack`.
- Odmowa (`refused=true`): `moveLeft = 0`, zajętość bez zmian, facing nie wołany.
- Każdy wektor z `plik:linia` pinu w komentarzu testu. Wartości z wykonania tekstu pina przez TypeScript, nie wpisane ręcznie.
- Mutacje (MUSZĄ dać FAIL, wyniki w raporcie): (a) brod mnożnik `/ 0.5` → `* 0.5`, (b) clamp dolny `max(1, …)` → `max(0, …)`, (c) `occByKey` usunięcie starego klucza pominięte.

## KRYTERIA KOŃCA
1. Punkty ZAKRESU zrealizowane; wektory zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`. Kody wyjścia w raporcie. Przed bramką `df -h /`; przy < 8 GB zgłoś BLOCK z liczbą GB.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Commit jawnym `git add` (nigdy `-A`), BEZ `Cargo.lock`, BEZ nazwy modelu w treści i trailerach. Bez push do parity. Raport w `dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T4C-DOMOVE/01-operator-r1.md`.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
