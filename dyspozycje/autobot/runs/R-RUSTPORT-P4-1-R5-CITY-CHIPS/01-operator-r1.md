# R-RUSTPORT-P4-1-R5-CITY-CHIPS — Operator r1

STATUS: PASS
DOMAIN: GAME (renderer 3D, plakietki miast)
TEMAT: R-RUSTPORT-P4-1-R5-CITY-CHIPS
GOAL: integrator plakietek miast (`CityRenderer.syncStatChips`, R5 z `P4-1G-ADAPTER-ROZPOZNANIE.md` §4) w rendererze Rust, zasilany `cities[].badge` z DTO (D-DTO-1 = A) i stanem UI; klucze `city_map_badge_key`, kolejność jak w pinie.
ZMIANY/COMMIT: baza `origin/rust-port/parity-v2` = `dd9a1b4e7a1b1c0084df61f073d8e41660d80c87` (worktree detached). Commit: SHA w wyniku Workflow (commit z tego raportu). Pliki (tylko allowlista):
- `rust-port/renderer/src/cities/sync/mod.rs` (NOWY)
- `rust-port/renderer/src/cities/sync/stat_chips.rs` (NOWY)
- `rust-port/renderer/src/cities/mod.rs` — wyłącznie `pub mod sync;` + `pub use sync::{CityStatChips, StatChipUiState};`
- `rust-port/renderer/tests/cities_sync_stat_chips.rs` (NOWY)
- `rust-port/renderer/tests/fixtures/cities_sync/cities.json` (NOWY)
- ten raport
Bez zmian: `view-model/**`, `engine/**`, `cities/overlay/**`, `view/cities.rs`, `view/overlays.rs`, `map_units/**`, `rivers/**`, `gra/`, `Cargo.lock`.
TESTY: zob. niżej (bramki EXIT 0, mutacje a/b/c FAIL).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO

## Co zrobiono (pin `07d2fbd72`)

Odczyt webu przed kodem: `gra/src/render/cities.ts` (`sync` :502-611, `pruneUnusedStatChipTextures` :625-636, `syncStatChips` :644-660, `setBadgeZoomLod` :676-682, `dispose` :766-780, `_removeStatChip` :833-844, `_buildBadgeInput` :875-929, `_syncStatChip` :933-960), `gra/src/main.ts` (`_cityRenderOpts` :2939-3005, `statChipHoverCityId` :2938, `cityPanelViewCityId` :6575, wywołania `syncStatChips` :14563, :32265, :32269, :32348, :44303, `pruneUnusedStatChipTextures` :43751), `gra/src/render/cityMapStatChip.ts` (`makeCityMapBadgeSprite` :1052-1125, `disposeCityMapBadgeTexturesForOtherLod` :1034-1047).

`cities/sync/stat_chips.rs` — `CityStatChips` (stan `statSprites`/`statSpriteKeys`/`statTexCache`/`badgeLodLevel`/`badgeLodPurgePending` jako dane):
- `sync_stat_chips(cities, models, ui)` = `syncStatChips`: miasto bez grupy w `CityRenderer` pomijane (:646-647); pokaz = `isVisible && grp.visible && !hideStatChips` (:652); po pętli usunięcie tekstur innego LOD, gdy LOD się zmienił (:656-659).
- `sync_after_city_models(cities, models, ui)` = część plakietek z `sync`: `_syncStatChip(visible && !hideStatChips)` (:542-547, :587-592); grupa przebudowana (inny `visual_key`) traci plakietkę przed ponownym utworzeniem (:552) — plakietka trafia na koniec jak w `Map`; plakietki miast bez grupy usuwane (:597-606); `pruneUnusedStatChipTextures` na końcu (:610).
- `_syncStatChip` (:933-960): wejście = `view::city_badge_input(&dto.badge, hover, Some(lod))` (Q3, `hoverExpanded` :888, `lodLevel` :928), klucz `city_map_badge_key`, ten sam klucz → tylko `sprite.visible = true` (:949-952), inny → usunięcie + nowy sprite na końcu (`Map.delete` + `Map.set`, :954-959).
- sprite: `city_map_badge_sprite(key, w, h)` (istniejący, `cityMapStatChip.ts:1111-1124`), `w × h` = rozmiar kanwy tekstury z cache dla klucza (pierwsza tekstura klucza, :1071-1080) albo `badge_canvas_px(badge_layout(input))` — bez rasteryzacji w integratorze; piksele maluje wołający przez `render_city_map_badge(entry.input, …)` (test potwierdza równość rozmiaru z rzeczywiście namalowaną teksturą).
- `set_badge_zoom_lod(dist)` (:676-682, `city_badge_lod_level_for_dist`), `prune_unused_stat_chip_textures()` (:625-636), `dispose()` (:778-780, LOD zostaje).
- `StatChipUiState` (luka L4, UI, nie DTO): `city_panel_view_city_id`, `is_city_panel_open` (= `hideStatChips`), `hover_stat_chip_city_id`; `WEB_INITIAL` wg `main.ts:2938`, `:6575`. Nazwy i typy pól jak w `MapUiState` z Q5 (`922300020`, jeszcze nie na parity) — do zunifikowania przy integracji Q5.
- `stat_chip_city_visible` = `isVisible` (`main.ts:2973-2976`): panel miasta → tylko to miasto; inaczej `fog_visible` producenta.

Zero reguł gry: treść plakietki (17 pól) w całości z `CityBadgeDto`; integrator dodaje tylko stan UI/renderera.

## Testy (`tests/cities_sync_stat_chips.rs`, 11 testów, fixture `tests/fixtures/cities_sync/cities.json`)

Fixture: 2 właścicieli (gracz 0, obcy 3), 4 miasta w kolejności `7, 3, 12, 15` (celowo nie wg id); Memfis (15) obcy we mgle. Klucze oczekiwane wypisane ręcznie z `cityMapBadgeKey` (`cityMapStatChip.ts:962-1012`), każdy test z `plik:linia` pinu w komentarzu.
- liczba plakietek 3, ids `["7","3","12"]`, klucze literalne, tekstury w kolejności tworzenia;
- klucze = `city_map_badge_key(city_badge_input(dto.badge, false, Some(0)))`;
- zmiana klucza przenosi plakietkę na koniec (semantyka `Map`), `syncStatChips` nie przycina cache, `prune` usuwa 1;
- mgła: DTO `fog_visible` i `grp.visible` po `apply_fog_visibility`; odsłonięcie Memfis → plakietka na końcu;
- panel miasta (`cityPanelViewCityId`) i `hideStatChips` (oba ścieżki: `syncStatChips` i `sync`);
- hover: `h1` w kluczu, wyższa kanwa (wiersz hover);
- sprite: skala `0.52·w/h`, pozycja (0, 0.92, 0), `renderOrder` 12, materiał; rozmiar = tekstura z `render_city_map_badge`;
- LOD: `set_badge_zoom_lod` tylko przy zmianie poziomu, klucze `|l1`, tekstury innego LOD usunięte, skala ×2;
- `sync`: miasto usunięte → plakietka i tekstura usunięte; przebudowa grupy (`level`) → plakietka na końcu;
- miasto bez grupy pomijane; `dispose`.

## Mutacje (wszystkie dają FAIL; plik przywrócony, `restored: True`)

| Mutacja | Zmiana | Wynik |
|---|---|---|
| (a1) plakietka obcego miasta mimo mgły | `None => city.fog_visible` → `None => true` | FAILED, 4 testy: `initial_sync_…`, `fog_hides_foreign_badges`, `changed_key_…`, `sync_removes_stale_…` (7 passed; 4 failed) |
| (a2) mgła grupy pominięta | `visible && grp.visible() && !…` → `visible && !…` | FAILED, 2 testy: `fog_hides_foreign_badges`, `city_panel_view_and_hide_stat_chips` (9 passed; 2 failed) |
| (b) kolejność miast odwrócona | `for city in cities` → `cities.iter().rev()` (oba miejsca) | FAILED, 7 testów (4 passed; 7 failed) |
| (c) klucz stały | `city_map_badge_key(&badge)` → `String::from("K")` | FAILED, 9 testów (2 passed; 9 failed) |

Skrypt: `scratchpad/mutations.py` (poza repo), uruchamia `cargo test --test cities_sync_stat_chips` per mutacja.

## Bramki (`rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny poza repo, usunięty po bramkach)

- `df -h /` przed bramką: 12 GB wolne (wcześniej w trakcie pracy chwilowo 5,1 GB — inne sesje; bramki odpalone dopiero przy ≥ 8 GB: 14 GB i 12 GB).
- `cargo fmt --check`: EXIT 0 (po `rustfmt` nowych plików).
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --all-targets --no-fail-fast`: EXIT 0 — 69 binarek testowych, 570 passed, 0 failed, 0 ignored.
- Brak `#[ignore]`, brak osłabionych asercji.

## Uwagi / NIE_ZMIERZONO

1. `StatChipUiState` to osobny typ, bo `MapUiState` (Q5, `922300020`) nie jest na parity, a `view/overlays.rs` jest poza allowlistą. Pola zgodne nazwą i typem; brakujący w `MapUiState` jest `hover_stat_chip_city_id`. Unifikacja = decyzja techniczna przy integracji Q5.
2. W webie sprite jest dzieckiem grupy miasta — efektywna widoczność to `sprite.visible && group.visible`. Tu plakietka jest kluczowana `city_id` i zapamiętuje `group_visual_key`; renderer GPU (RR-T…) musi rysować ją pod grupą `RenderedCity` (ta sama zasada).
3. `pickStatChipCityIdAt` (`cities.ts:691+`, raycast hover) — poza zakresem R5, nie portowane.
4. `sync_after_city_models` trzeba wołać po każdym `CityInputs::sync` (w webie to jedna metoda `sync`); przy pominięciu wywołania `_syncStatChip` i tak usuwa plakietkę zmienionej grupy (kontrola `group_visual_key`), ale kolejność w `Map` może się wtedy różnić od pinu.
