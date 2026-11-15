# DISPATCH R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN (runda 1) — adapter terenu: `MapViewDto` → wejścia renderera (P4-1G / #216)

DOMENA: GRAFIKA / DTO renderera (teren, mgła per heks, okolica). MODEL: OPUS we wszystkich rolach (seria P4-1).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `601ff304c` (FC Q1 już zintegrowany; zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §3 (wiersze: `width/height`, `seed`, `hexes[].coord/.teren_bazowy`, `terraces`, `fog.state`, `solid_hidden`, `covering_improvement`, `overlays.okolica`), §4, §5 (luki), §7 wiersz `R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN` (OBOWIĄZKOWO).
Q1 (zintegrowany): `view::*`, `FogSets`, konwersje `HexCoord`, `OwnerRef`, `to_int32` w `geom/js_num.rs`. UŻYJ ich, nie duplikuj.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `MapViewDto` + `HexDynDto.terraces` → `TerrainInput` (`width/height`, `seed` przez `js_num::to_int32`, `hexes` z `coord`/`terrain`/`terraces` → `TerrainHex`).
2. `pick::terrain::MapHex` z `prism_hidden` (z `FogSets` Q1) i `solid_hidden` wyliczonym z `cities[]`, `wonders[]` i `HexDynDto.nakladka` wg pinu (`pick/terrain.rs:253-255`; `hideDecorAtHex` dla miast `main.ts:16211`, cudów `main.ts:4312`). Luka L5 (`wonderBuildSites`, placy budowy cudu) NIE jest w DTO: NIE wymyślaj jej, zapisz jako NIE_ZMIERZONO w raporcie i w kodzie komentarz z odniesieniem do L5.
3. `OverlayMap` (w tym `hexes`, `seed: Option<f64>`) i `OkolicaMap{map, covering_improvement}` z `covering_improvement` (`cities/overlay/okolica.rs:354-359`); `TileYieldDto` ↔ `TileYield` 1:1 (`overlays.rs:93` ↔ `okolica.rs:114`).
4. Mgła terenu: `TerrainScene::set_fog`-odpowiednik z wejściem `FogSets` (`visible`, `explored`, `land_reveal` z `useFogRender` — jeśli L1/L2 (`revealAllLand`, `riverRevealKeys`) brak w DTO, zapisz jako NIE_ZMIERZONO i zachowaj `land_reveal` jako jawny parametr bez domyślnej wartości).
5. Brak zmian w `view-model`, brak zmian w `Cargo.toml`.

## WEKTORY / TESTY (`rust-port/renderer/tests/view_adapter_terrain.rs`, NOWY)
- Fixture: mała mapa testowa (np. 4×3) z `terraces` true/false, z miastem i cudem (solid_hidden), z mgłą (state 0/1/2) — wartości oczekiwane z definicji pinu, zapisz źródło każdej wartości (plik:linia).
- `seed`: `seed = 2^32 + 5` → 5; `seed = -1.5` → -1; NaN → 0 (przez `to_int32`).
- `solid_hidden`: heks z miastem i cudem → true; sąsiad bez → false.
- `prism_hidden` = `!explored` (z Q1), `terraces` przepisane 1:1.
- Okolica: `covering_improvement` ustawione wyłącznie dla heksów z pinu-odpowiednikiem; brak wpisu → false.
- Mutacje (MUSZĄ dać FAIL): pominięcie `solid_hidden` dla cudu; `terraces` zawsze false; `seed` jako `as i32` (saturacja); pominięcie `covering_improvement`.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje dają FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie.
3. Luki L5 i L1/L2 zapisane jako NIE_ZMIERZONO w raporcie, bez wymyślania wartości.
4. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/renderer/src/view/terrain.rs` (NOWY)
- `rust-port/renderer/src/view.rs` (TYLKO deklaracja `mod terrain;` i reeksporty)
- `rust-port/renderer/tests/view_adapter_terrain.rs` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
