# DISPATCH R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES (runda 1) — adapter miast, cudów i znaczników: DTO → wejścia renderera (P4-1G / #216)

DOMENA: GRAFIKA / DTO renderera (miasta, cuda, herby, odznaki). MODEL: OPUS we wszystkich rolach (seria P4-1).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `601ff304c` (P4-1G Q1 zintegrowany; zapisz SHA w raporcie). Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §3 (wiersze dla `cities[]`, `owners[]`, `wonders[]`, `CityBadgeDto`, `OwnerEmblemContext`), §4 (wejścia renderera bez konsumenta), §5 (luki), §7 wiersz `R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES` (OBOWIĄZKOWO).
Q1 (zintegrowany): `view::*`, `FogSets`, `HexCoord`, `OwnerRef`, `to_int32` w `geom/js_num.rs`. UŻYJ ich, nie duplikuj. Q2 (teren) biegnie równolegle — NIE dotykaj `view/terrain.rs`.
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
1. `cities[]` + `owners[]` (z `MapViewDto`) → `City` + `CityRenderOptions` (domknięcia wg pinu; źródła: `CityRenderer::new` i `apply_fog_visibility` w `models/cities/renderer.rs:444`, `:592-597`).
2. `PlacedWonder` + `WonderRenderOptions` (`models/wonders/renderer.rs:116`, `:193`) z wejścia `wonders[]`.
3. `OwnerEmblemContext` z `civ_id = None` dla barbarzyńców (wg pinu).
4. `CityBadgeDto` → `CityMapBadgeInput` (`CityMapBadgeInput` bez integratora R5 — integrator R5 jest poza zakresem; zapisz to w raporcie).
5. Mgła miast/cudów: `apply_fog_visibility(vis, fog_on, player_owner_id)` z wejściem `FogSets` z Q1. Pole `revealAllLand` (luka L1) NIE istnieje w DTO — nie wymyślaj; zapisz NIE_ZMIERZONO.
6. Luka L5 (`wonderBuildSites`) NIE jest w DTO — zapisz NIE_ZMIERZONO, nie wymyślaj.

## WEKTORY / TESTY (`rust-port/renderer/tests/view_adapter_cities.rs`, NOWY)
- Fixture: 2–3 miasta (własne, obce, barbarzyńca) i 1 cud, z wartościami oczekiwanymi z definicji pinu (zapisz plik:linia dla każdej wartości).
- `OwnerEmblemContext`: barbarzyńca → `civ_id = None`; gracz → `Some(id)`.
- Mgła: miasto poza `visible` przy `fog_on = true` ukryte; przy `fog_on = false` widoczne.
- Przepełnienie id właściciela → błąd (z `OwnerRef`), nie saturacja.
- Mutacje (MUSZĄ dać FAIL): `civ_id` dla barbarzyńcy ustawiane na `Some`; pominięcie filtra mgły dla cudu; `CityBadgeDto` bez pola z pinu.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje dają FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/renderer`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`; kody wyjścia w raporcie.
3. Luki L1, L5 i brak integratora R5 zapisane jako NIE_ZMIERZONO w raporcie.
4. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.

## ALLOWLISTA
- `rust-port/renderer/src/view/cities.rs` (NOWY)
- `rust-port/renderer/src/view.rs` (TYLKO deklaracja `mod cities;` i reeksporty)
- `rust-port/renderer/tests/view_adapter_cities.rs` (NOWY)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo; usuń po bramkach.
