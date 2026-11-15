# DISPATCH R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE (runda 1) — rdzeń adaptera widoku w renderze (P4-1G / #216)

DOMENA: GRAFIKA / DTO renderera. MODEL: OPUS we wszystkich rolach (seria P4-1 wg listy zadań właściciela).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `be49ff3c3` (zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §2 (wzorce konwersji), §3 (tabela DTO → wejście), §7 wiersz `R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE` (OBOWIĄZKOWO), §6 B-DEP.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. Zależność `civ-view-model = { path = "../view-model" }` w `rust-port/renderer/Cargo.toml` (B-DEP; D-DTO-1 = A).
2. Konwersje §2: `HexCoord` w 4 postaciach, id → `String`, `OwnerRef` → `i32` z błędem przy przepełnieniu, `ToInt32` dla `seed`, enumy `Terrain`, `RiverKind`, `WallKind`, `MapOutlineKind`, `TradeMedium`, `SiegeMachineKind`, `BattleSide`, `FortKind`, `TowerMaterial`.
3. `FogViewDto` → 3 zbiory + `prism_hidden`.
4. WYNIESIENIE istniejącego `to_int32` z `rust-port/renderer/src/geom/earcut.rs:791-801` do `rust-port/renderer/src/geom/js_num.rs` jako `pub(crate) fn to_int32`. `earcut.rs` i adapter wołają wspólną funkcję; bez duplikatu. Zachowanie bez zmian (JS ToInt32: trunc, rem_euclid 2^32, NaN/±Inf → 0). Istniejące testy earcut muszą pozostać zielone.
5. Przepisanie komentarza modułu `rust-port/renderer/src/view.rs:1-5` zgodnie z D-DTO-1: adapter DTO → wejścia renderera; bez „computed from GameState” i bez `PositionDto`.

## WEKTORY / TESTY (`rust-port/renderer/tests/view_adapter_core.rs`, NOWY)
- `to_int32`: wektory graniczne (0, -0 → 0, 2^31, 2^32+1, -1, 1e300, NaN, ±Inf, ułamki). Wartości oczekiwane z definicji JS ToInt32 (wyliczone ręcznie i potwierdzone na pinie przez `node -e` na `git show 07d2fbd72:...` lub prostym skryptem, zapisz które).
- `OwnerRef` → `i32`: wartość mieszcząca się → OK; przepełnienie → błąd (nie saturacja).
- `HexCoord`: 4 postacie zgodne z §2 (mapowanie axial ↔ DTO).
- Enumy: każda wartość DTO ma odpowiednik; nieznana wartość → błąd, nie domyślny wariant.
- Mutacje (muszą dać FAIL): `to_int32` zastąpione `as i32` (saturacja); pominięcie `prism_hidden`; przepełnienie `OwnerRef` obcięte zamiast błędu.

## KRYTERIA KOŃCA
1. Adapter core i wektory zielone; mutacje dają FAIL (wyniki w raporcie).
2. `earcut.rs` używa `geom::js_num::to_int32`; testy earcut zielone.
3. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie.
4. Komentarz `view.rs` zgodny z D-DTO-1.
5. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/renderer/Cargo.toml`
- `rust-port/renderer/src/view.rs`
- `rust-port/renderer/src/view/**` (NOWE podmoduły)
- `rust-port/renderer/src/geom/earcut.rs` (TYLKO usunięcie lokalnego `to_int32` i import)
- `rust-port/renderer/src/geom/js_num.rs` (NOWY)
- `rust-port/renderer/src/geom/mod.rs` (deklaracja modułu)
- `rust-port/renderer/src/lib.rs` (TYLKO komentarz modułu `view`)
- `rust-port/renderer/tests/view_adapter_core.rs` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
