# DISPATCH R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 (runda 1) — adapter `PlayableState` → model ruchu (RuchMapa / RuchJednostka / MoveOccupancy) (P4-1H / #250)

DOMENA: GAME (model ruchu i planów marszu, silnik). MODEL: OPUS we wszystkich rolach (seria P4-1).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `1bacc7621` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` §4 wiersz `R-RUSTPORT-P4-1H-MOVE-MODEL-Q4` (OBOWIĄZKOWO) oraz §3 (R1–R4, R6 — zintegrowane w RJ-REPIN Q3: `pathfinding.rs`, funkcje `*_occ`, `trim_path_to_stack_room`, `register_march_stop`).
Zależność zintegrowana: P4-1H RJ-REPIN Q3 (`02a1560e3`) — użyj jego funkcji, nie duplikuj.
Decyzja techniczna do zapisu w REJESTR-RUST.md przed wysłaniem: reprezentacja ruchu `u8` vs `f64` (pin `movement`/`ruch_left` to liczby zmiennoprzecinkowe; `PlayableState` ma dziś `u8`). Wybierz wariant zgodny z pinem 1:1 i uzasadnij w raporcie.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. Adapter `PlayableState → RuchMapa / RuchJednostka / MoveOccupancy`:
   - koszt terenu: `PlayableTerrain` → `TerenBazowy` (mapowanie 1:1 wg pinu),
   - `movement` → `ruch_left` (typ wg decyzji technicznej),
   - `MoveOccupancy` z własnymi jednostkami i `passThrough` (wejście z RJ-REPIN).
2. `moved_by_player_this_turn` w stanie `PlayableState` (pole z `#[serde(default, skip_serializing_if)]` jak P4-1J; zapis/odczyt w `save_load.rs`); czyszczone w `advance_turn`.
3. NIE zmieniaj zachowania `move_unit` (to Q6 — #252).
4. Nowy moduł: `rust-port/engine/src/domain/playable_movement.rs`.

## WEKTORY / TESTY
- Test zgodności adaptera: dla mapy testowej koszt terenu i zajętość = wartości policzone ręcznie z kodu pinu (plik:linia w komentarzu każdej wartości). Co najmniej: teren z kosztem != 1, heks z własną jednostką, heks z obcym miastem.
- `moved_by_player_this_turn`: ustawiane po ruchu gracza, czyszczone w `advance_turn`; round-trip zapisu z polem i bez pola (golden bez pola = bez zmian).
- Mutacje (MUSZĄ dać FAIL): koszt terenu = 1 zawsze; pominięcie `passThrough`; nieczyszczenie `moved_by_player_this_turn` w `advance_turn`.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie. Pełny test silnika obowiązkowy.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/engine/src/domain/playable_movement.rs` (NOWY)
- `rust-port/engine/src/domain/playable.rs` (pole stanu, `advance_turn`, adapter wywołanie)
- `rust-port/engine/src/domain/mod.rs` (TYLKO deklaracja modułu)
- `rust-port/engine/src/save_load.rs` (TYLKO pole `moved_by_player_this_turn`)
- `rust-port/engine/tests/p4_1h_move_model*.rs` (NOWE)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-MOVE-MODEL-Q4/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
