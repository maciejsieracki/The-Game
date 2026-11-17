# R-RUSTPORT-P4-1-R6-WIRING-R1 — Operator r1

STATUS: PASS-WITH-NOTES
DOMAIN: INFORMATIONAL (renderer, wpięcie DTO → renderer; gameplay bez zmian)
TEMAT: R-RUSTPORT-P4-1-R6-WIRING-R1
GOAL: produkcyjny wołający `RevoltRenderer::sync` po `CityRenderer::sync` na tym samym `cities[]`
(pin `07d2fbd72`, `render/cities.ts:541,551,586,597-599`).

## ZMIANY/COMMIT
- Baza: `26e3666bd` (wg dispatchu). Gałąź robocza: `rust-port-wip/R-RUSTPORT-P4-1-R6-WIRING-R1-op1`.
- Commit kodu: `d5a4956408673b7f53d66752a655c31ca9e5f2f3`.
- `git diff --stat 26e3666bd d5a495640`:
  ```
  rust-port/renderer/src/view/cities.rs        |  29 +++-
  rust-port/renderer/tests/revolt_wiring_r6.rs | 217 +++++++++++++++++++++++++++
  2 files changed, 244 insertions(+), 2 deletions(-)
  ```
- `src/view/cities.rs`:
  - `CityInputs` dostaje prywatne pole `revolt: RevoltInputs`, budowane w `CityInputs::from_dto`
    przez `RevoltInputs::from_dto(cities)` (te same `cities[]` DTO co `sync`).
  - `pub fn sync_revolt(&self, renderer: &mut RevoltRenderer, cities: &CityRenderer)` →
    `renderer.sync(&self.revolt, cities)`; dokumentacja: wołać po `sync` na tym samym `CityRenderer`.
  - `pub fn revolt_inputs(&self) -> &RevoltInputs` (podgląd wejść R6; użyty w teście równoważności).
  - Doc modułu: usunięto „`getRevolt` / `getUnitCountOnHex` (no renderer consumer, R6)”, dopisano wpięcie.
- Bez zmian w `RevoltRenderer`, `CityRenderer`, `cities/mod.rs`. `Cargo.lock` przywrócony, nie commitowany.

### Uwaga (odchylenie techniczne od litery dispatchu)
Dispatch pisze „buduje `RevoltInputs::from_dto(&self.cities)`”. `CityInputs::cities` to `Vec<City>`
(wejście renderera), a `RevoltInputs::from_dto` przyjmuje `&[vm::CityViewDto]` — adapter nie
przechowuje DTO. Dlatego `RevoltInputs` jest budowane raz w `CityInputs::from_dto` z tych samych
DTO i trzymane w adapterze; `sync_revolt` używa go bez ponownej konwersji. Efekt identyczny
(test `sync_revolt_matches_direct_revolt_sync` porównuje z `RevoltRenderer::sync(&RevoltInputs::from_dto(&dtos), …)`).
Zmiana w obrębie allowlisty (`view/cities.rs`).

## TESTY (katalog `rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo, usunięty po bramkach)
1. `cargo fmt --check` — EXIT 0.
2. `cargo clippy --all-targets -- -D warnings` — EXIT 0 (po usunięciu nieużytego importu w teście).
3. `cargo test --test revolt_wiring_r6` — EXIT 0, `test result: ok. 5 passed; 0 failed`.
4. `cargo test --all-targets --no-fail-fast` — EXIT 0; 77 × `test result: ok`; suma 664 passed,
   0 failed, 0 ignored; 0 linii `FAILED|panicked`. Dysk przed bramką 4: 16 GB wolne (≥ 12).

Testy w `tests/revolt_wiring_r6.rs` (2 miasta: 21 w buncie, 22 spokojne):
- `sync_then_sync_revolt_creates_sprite_for_revolt_city` — sprite tylko dla 21, rodzic = grupa miasta;
- `sync_revolt_matches_direct_revolt_sync` — ścieżka adaptera = bezpośrednie `RevoltRenderer::sync`;
- `sprite_removed_when_city_leaves_list` — po usunięciu 21 z listy sprite znika (`:597-599`);
- `sprite_removed_when_revolt_ends` — `revolt=false` na zachowanej grupie usuwa sprite (`:816-818`);
- `sync_revolt_before_sync_makes_no_sprite` — kolejność: przed `sync` brak grupy → brak sprite'a;
  po `sync` → `sync_revolt` sprite powstaje.

## BLOKADY
Brak.

## RUNDY
1/5.

## NASTĘPNY KROK
Evaluator r1.

## DEPLOY/PUSH
NIE WYKONANO.
