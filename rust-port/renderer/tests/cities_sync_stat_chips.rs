//! `R-RUSTPORT-P4-1-R5-CITY-CHIPS`: the city badge integrator
//! (`renderer/src/cities/sync/stat_chips.rs`).
//!
//! Fixture: `tests/fixtures/cities_sync/cities.json` (hand-built `owners[]`
//! and `cities[]`, no engine producer). `cities.ts:N` = line `N` of
//! `gra/src/render/cities.ts` @ `07d2fbd72`; `main.ts:N` and
//! `cityMapStatChip.ts:N` likewise.
//!
//! Every expected key is written out by hand from `cityMapBadgeKey`
//! (`cityMapStatChip.ts:962-1012`): `name|pop|d…|c…|p…|g…|w…|h…|cs…|e…|k…|l…`.

use std::collections::HashSet;

use civ_renderer::cities::overlay::stat_chip::{
    badge_layout, city_map_badge_key, render_city_map_badge, BADGE_POSITION, BADGE_RENDER_ORDER,
    BADGE_WORLD_H,
};
use civ_renderer::cities::overlay::TextureRef;
use civ_renderer::cities::sync::{stat_chip_city_visible, CityStatChips, StatChipUiState};
use civ_renderer::core::zoom_lod::CityBadgeLodLevel;
use civ_renderer::models::cities::renderer::CityRenderer;
use civ_renderer::raster::atlas::scale::badge_canvas_px;
use civ_renderer::view::{self, CityInputs};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

const FIXTURE: &str = include_str!("fixtures/cities_sync/cities.json");

/// `owners[]`, `cities[]` of the fixture.
fn fixture() -> (Vec<vm::OwnerViewDto>, Vec<vm::CityViewDto>) {
    let v: serde_json::Value = serde_json::from_str(FIXTURE).expect("fixture JSON");
    let owners = serde_json::from_value(v["owners"].clone()).expect("owners[]");
    let cities = serde_json::from_value(v["cities"].clone()).expect("cities[]");
    (owners, cities)
}

/// 4 × 3 map, all meadow, `r`-major (same as `view_adapter_cities.rs`).
fn map() -> vm::MapViewDto {
    let mut hexes = Vec::new();
    for r in 0..3 {
        for q in 0..4 {
            hexes.push(vm::HexStaticDto {
                coord: vm::HexCoord::new(q, r),
                teren_bazowy: vm::Terrain::Laka,
                rzeka_krawedzie: Vec::new(),
            });
        }
    }
    vm::MapViewDto {
        width: 4,
        height: 3,
        seed: 0.0,
        hexes,
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

/// `cityRenderer.sync(cities, _cityRenderOpts())` (`main.ts:3007`).
fn sync_models(r: &mut CityRenderer, owners: &[vm::OwnerViewDto], cities: &[vm::CityViewDto]) {
    CityInputs::from_dto(owners, cities)
        .expect("city inputs")
        .sync(r);
}

fn city_id(id: u64) -> vm::CityId {
    vm::CityId::try_new(id).unwrap()
}

fn ids(chips: &CityStatChips) -> Vec<&str> {
    chips.chips().iter().map(|c| c.city_id.as_str()).collect()
}

fn keys(chips: &CityStatChips) -> Vec<&str> {
    chips.chips().iter().map(|c| c.key.as_str()).collect()
}

fn texture_keys(chips: &CityStatChips) -> Vec<&str> {
    chips.textures().iter().map(|t| t.key.as_str()).collect()
}

/// Roma (7): own capital, palisade (`d1`), unit in production, growth 12.5
/// → `12,5%` (`formatCityGrowthPercentLabel`, `cityMapStatChip.ts:744-750`).
const KEY_ROMA: &str = "Roma|4|d1|crzymianie|pjednostka:wlocznik|g12,5%|w0|h0|cs0|e2|k1|l0";
/// Ostia (3): population 2.7 → `Math.max(1, Math.floor(2.7))` = 2, no
/// front (`p-`), starving → `—`, resource warning `w1`.
const KEY_OSTIA: &str = "Ostia|2|d0|crzymianie|p-|g\u{2014}|w1|h0|cs0|e2|k0|l0";
/// Teby (12): foreign capital, growth not asked for a foreign city
/// (`cities.ts:902`) → `g-`.
const KEY_TEBY: &str = "Teby|6|d2|cegipt|pbudynek:spichlerz|g-|w0|h0|cs0|e3|k1|l0";
/// Memfis (15) if it were shown.
const KEY_MEMFIS: &str = "Memfis|3|d0|cegipt|p-|g-|w0|h0|cs0|e3|k0|l0";

/// Initial state of the pin: models synced (`main.ts:3007`), then the badge
/// part of `sync` (`cities.ts:542-547`, `:587-592`).
fn initial() -> (
    Vec<vm::OwnerViewDto>,
    Vec<vm::CityViewDto>,
    CityRenderer,
    CityStatChips,
) {
    let (owners, cities) = fixture();
    let mut r = view::city_renderer(&map());
    sync_models(&mut r, &owners, &cities);
    let mut chips = CityStatChips::new(Some(1.0));
    chips
        .sync_after_city_models(&cities, &r, &StatChipUiState::WEB_INITIAL)
        .expect("sync");
    (owners, cities, r, chips)
}

// ------------------------------------------------------------ count, keys, order

/// `sync` → `_syncStatChip(city, group, visible && !hideStatChips)`
/// (`cities.ts:587-592`), `isVisible` = fog part (`main.ts:2975`): three
/// badges, Memfis in the fog has none. Order = `statSprites` insertion
/// order = `cities[]` order (`cities.ts:503`, `:958`), NOT city id order.
/// Mutations (a), (b), (c) of the dispatch fail here.
#[test]
fn initial_sync_builds_a_badge_per_visible_city_in_city_list_order() {
    let (_, _, _, chips) = initial();
    assert_eq!(chips.chips().len(), 3);
    assert_eq!(ids(&chips), ["7", "3", "12"]);
    assert_eq!(keys(&chips), [KEY_ROMA, KEY_OSTIA, KEY_TEBY]);
    assert!(chips.chip("15").is_none(), "Memfis is in the fog");
    // `statTexCache` gets one texture per new key, in creation order
    // (`cityMapStatChip.ts:1079`).
    assert_eq!(texture_keys(&chips), [KEY_ROMA, KEY_OSTIA, KEY_TEBY]);
    let distinct: HashSet<&str> = keys(&chips).into_iter().collect();
    assert_eq!(distinct.len(), 3, "one key per distinct badge");
}

/// The keys are `cityMapBadgeKey` of the badge input built from the DTO
/// (`cities.ts:947`, `:875-929`): `hoverExpanded` false, `lodLevel` 0.
#[test]
fn keys_are_city_map_badge_key_of_the_dto_badge() {
    let (_, cities, _, chips) = initial();
    for c in &cities[..3] {
        let id = view::city_id_string(c.id);
        let input = view::city_badge_input(&c.badge, false, Some(0.0));
        let chip = chips.chip(&id).expect("badge");
        assert_eq!(chip.key, city_map_badge_key(&input), "city {id}");
        assert_eq!(chip.input, input, "city {id}");
    }
    let memfis = view::city_badge_input(&cities[3].badge, false, Some(0.0));
    assert_eq!(city_map_badge_key(&memfis), KEY_MEMFIS);
}

/// `syncStatChips` walks `cities` in order (`cities.ts:645`); an unchanged
/// key only sets `sprite.visible = true` (`:949-952`), so the order stays.
/// A changed key deletes and re-sets the `Map` entries (`:954`, `:958-959`):
/// the city moves to the END of `statSprites`.
#[test]
fn changed_key_moves_the_badge_to_the_end_like_a_js_map() {
    let (_, mut cities, r, mut chips) = initial();
    let ui = StatChipUiState::WEB_INITIAL;
    chips.sync_stat_chips(&cities, &r, &ui).expect("sync");
    assert_eq!(ids(&chips), ["7", "3", "12"]);

    // Roma grows (badge population 4 → 5, producer value).
    cities[0].badge.population = 5.0;
    chips.sync_stat_chips(&cities, &r, &ui).expect("sync");
    assert_eq!(ids(&chips), ["3", "12", "7"]);
    assert_eq!(
        chips.chip("7").unwrap().key,
        "Roma|5|d1|crzymianie|pjednostka:wlocznik|g12,5%|w0|h0|cs0|e2|k1|l0"
    );
    // `syncStatChips` does not prune (`cities.ts:644-660`): the old texture
    // stays until `pruneUnusedStatChipTextures` (`:610`, `main.ts:43751`).
    assert_eq!(chips.textures().len(), 4);
    assert_eq!(chips.prune_unused_stat_chip_textures(), 1);
    assert_eq!(
        texture_keys(&chips),
        [
            KEY_OSTIA,
            KEY_TEBY,
            "Roma|5|d1|crzymianie|pjednostka:wlocznik|g12,5%|w0|h0|cs0|e2|k1|l0"
        ]
    );
}

// ------------------------------------------------------------ fog

/// Fog: the producer's `fog_visible` (`cityFogVisible`, `main.ts:2975`) and
/// the group visibility `grp.visible` (`cities.ts:652`), which
/// `applyFogVisibility(vis, fogOn, ME())` sets (`cities.ts:657-680`,
/// `main.ts:13503`). Mutation (a) fails here.
#[test]
fn fog_hides_foreign_badges() {
    let (_, mut cities, mut r, mut chips) = initial();
    let ui = StatChipUiState::WEB_INITIAL;
    assert!(!stat_chip_city_visible(&cities[3], &ui));

    // `applyFogVisibility`: only (0,0) and (3,2) are visible. Own cities stay
    // visible (`grp.ownerId === playerOwnerId`); Teby (2,1) is hidden even
    // though its DTO `fog_visible` is still `true`.
    let vis: HashSet<String> = ["0,0", "3,2"].iter().map(|s| (*s).to_owned()).collect();
    r.apply_fog_visibility(&vis, true, 0);
    chips.sync_stat_chips(&cities, &r, &ui).expect("sync");
    assert_eq!(ids(&chips), ["7", "3"]);
    assert!(chips.chip("12").is_none());
    // Memfis's group is visible now, but its `isVisible` (DTO fog) is false.
    assert!(r.city("15").unwrap().visible());
    assert!(chips.chip("15").is_none());

    // The producer reveals Memfis: its badge is created at the end.
    cities[3].fog_visible = true;
    chips.sync_stat_chips(&cities, &r, &ui).expect("sync");
    assert_eq!(ids(&chips), ["7", "3", "15"]);
    assert_eq!(chips.chip("15").unwrap().key, KEY_MEMFIS);
}

// ------------------------------------------------------------ city panel, hover

/// `isVisible` with the city panel (`main.ts:2974`): only the panel city
/// counts as visible, foreign or not; `hideStatChips = isCityPanelOpen()`
/// (`main.ts:2977`) hides every badge (`cities.ts:545`, `:590`, `:652`).
#[test]
fn city_panel_view_and_hide_stat_chips() {
    let (_, cities, r, mut chips) = initial();
    let panel_only = StatChipUiState {
        city_panel_view_city_id: Some(city_id(12)),
        is_city_panel_open: false,
        hover_stat_chip_city_id: None,
    };
    chips
        .sync_stat_chips(&cities, &r, &panel_only)
        .expect("sync");
    assert_eq!(ids(&chips), ["12"]);
    assert_eq!(chips.chip("12").unwrap().key, KEY_TEBY);

    // Panel on Memfis: `isVisible` is true, but `syncStatChips` also needs
    // `grp.visible` (`cities.ts:652`), still false from the last `sync`.
    let memfis_panel = StatChipUiState {
        city_panel_view_city_id: Some(city_id(15)),
        ..panel_only
    };
    assert!(stat_chip_city_visible(&cities[3], &memfis_panel));
    chips
        .sync_stat_chips(&cities, &r, &memfis_panel)
        .expect("sync");
    assert!(chips.chips().is_empty());

    let open = StatChipUiState {
        is_city_panel_open: true,
        ..panel_only
    };
    chips.sync_stat_chips(&cities, &r, &open).expect("sync");
    assert!(chips.chips().is_empty());

    // Same through the `sync` path (`visible && !hideStatChips`).
    let (_, cities, r, mut chips) = initial();
    chips
        .sync_after_city_models(&cities, &r, &open)
        .expect("sync");
    assert!(chips.chips().is_empty());
    assert!(chips.textures().is_empty(), "pruned at the end of sync");
}

/// `hoverExpanded = options.hoverStatChipCityId === city.id`
/// (`cities.ts:888`): `h1` in the key and, with hover detail, the hover row
/// (`cityMapStatChip.ts:834-837`) makes the texture taller.
#[test]
fn hover_expands_one_badge() {
    let (_, cities, r, mut chips) = initial();
    let before = chips.chip("7").unwrap().sprite.clone();
    let ui = StatChipUiState {
        hover_stat_chip_city_id: Some(city_id(7)),
        ..StatChipUiState::WEB_INITIAL
    };
    chips.sync_stat_chips(&cities, &r, &ui).expect("sync");
    let roma = chips.chip("7").unwrap();
    assert_eq!(
        roma.key,
        "Roma|4|d1|crzymianie|pjednostka:wlocznik|g12,5%|w0|h1|cs0|e2|k1|l0"
    );
    assert!(roma.input.hover_expanded);
    // Same world height, wider aspect lost to the taller canvas.
    assert!(roma.sprite.scale[0] < before.scale[0]);
    assert_eq!(chips.chip("3").unwrap().key, KEY_OSTIA);
    assert_eq!(ids(&chips), ["3", "12", "7"]);
}

// ------------------------------------------------------------ sprite

/// `makeCityMapBadgeSprite` (`cityMapStatChip.ts:1111-1124`): world height
/// 0.52, width `0.52 · img.width / img.height`, at (0, 0.92, 0),
/// `renderOrder` 12, material `transparent`, `depthTest: false`,
/// `toneMapped: false`, map = the cached texture of the key. The canvas
/// size equals the one `paintCityMapBadgeOntoCanvas` really paints.
#[test]
fn sprite_follows_make_city_map_badge_sprite() {
    let (_, _, _, chips) = initial();
    let roma = chips.chip("7").unwrap();
    let painted = render_city_map_badge(&roma.input, None, Some(1.0)).expect("paint");
    let tex = &chips.textures()[0];
    assert_eq!(tex.key, KEY_ROMA);
    assert_eq!(
        (tex.width, tex.height),
        (painted.texture.width, painted.texture.height)
    );
    let l = badge_layout(&roma.input).expect("layout");
    let px = badge_canvas_px(l.width, l.height, Some(1.0), Some(0.0));
    assert_eq!((px.width, px.height), (tex.width, tex.height));

    let s = &roma.sprite;
    let aspect = f64::from(tex.width) / f64::from(tex.height);
    assert_eq!(s.scale, [BADGE_WORLD_H * aspect, BADGE_WORLD_H, 1.0]);
    assert_eq!(s.position, BADGE_POSITION);
    assert_eq!(BADGE_POSITION, [0.0, 0.92, 0.0]);
    assert_eq!(s.render_order, BADGE_RENDER_ORDER);
    assert_eq!(BADGE_RENDER_ORDER, 12);
    assert!(s.visible);
    assert_eq!(s.material.map, TextureRef::CityBadge(KEY_ROMA.to_owned()));
    assert!(s.material.transparent && !s.material.depth_test && !s.material.tone_mapped);
}

// ------------------------------------------------------------ LOD

/// `setBadgeZoomLod(dist)` (`cities.ts:676-682`): `true` only on a level
/// change; the next `syncStatChips` re-keys every badge (`l1`) and then
/// drops every texture of another LOD (`:656-659`).
#[test]
fn lod_change_rekeys_badges_and_purges_other_lod_textures() {
    let (_, cities, r, mut chips) = initial();
    let ui = StatChipUiState::WEB_INITIAL;
    // 20 ≥ CITY_BADGE_LOD_MID_DIST (11): level 0, unchanged.
    assert!(!chips.set_badge_zoom_lod(20.0));
    assert!(!chips.lod_purge_pending());
    // 8 < 11: level 1.
    assert!(chips.set_badge_zoom_lod(8.0));
    assert!(!chips.set_badge_zoom_lod(8.0));
    assert_eq!(chips.lod_level(), CityBadgeLodLevel::L1);
    assert!(chips.lod_purge_pending());

    chips.sync_stat_chips(&cities, &r, &ui).expect("sync");
    assert!(!chips.lod_purge_pending());
    assert_eq!(ids(&chips), ["7", "3", "12"]);
    for k in keys(&chips) {
        assert!(k.ends_with("|l1"), "{k}");
    }
    assert_eq!(chips.textures().len(), 3);
    for t in chips.textures() {
        assert!(t.key.ends_with("|l1"), "{}", t.key);
        let l = badge_layout(&t.input).expect("layout");
        let px = badge_canvas_px(l.width, l.height, Some(1.0), Some(1.0));
        assert_eq!((t.width, t.height), (px.width, px.height));
    }
    // `cityBadgeLodTextureScale(1)` = 2 (`zoomLod.ts:186-189`).
    let roma = chips
        .textures()
        .iter()
        .find(|t| t.key.starts_with("Roma|"))
        .unwrap();
    let l = badge_layout(&roma.input).expect("layout");
    assert_eq!(f64::from(roma.height), l.height * 2.0);
}

// ------------------------------------------------------------ sync lifecycle

/// `sync` (`cities.ts:502-611`): a city that left `cities[]` loses its group
/// and its badge (`:597-606`); a group rebuilt with another visual key loses
/// its badge first (`:552`) and gets a new one at the end (`:587`);
/// `pruneUnusedStatChipTextures` runs at the end (`:610`).
#[test]
fn sync_removes_stale_badges_and_rebuilds_with_the_group() {
    let (owners, mut cities, mut r, mut chips) = initial();
    let ui = StatChipUiState::WEB_INITIAL;

    // Ostia leaves the list.
    cities.remove(1);
    sync_models(&mut r, &owners, &cities);
    chips
        .sync_after_city_models(&cities, &r, &ui)
        .expect("sync");
    assert_eq!(ids(&chips), ["7", "12"]);
    assert_eq!(texture_keys(&chips), [KEY_ROMA, KEY_TEBY]);

    // Roma's level changes (visual key `…|4|…` → `…|5|…`), badge unchanged:
    // new group, so the badge is recreated at the end with the same key.
    let old_vk = r.city("7").unwrap().visual_key.clone();
    cities[0].level = 5.0;
    sync_models(&mut r, &owners, &cities);
    assert_ne!(r.city("7").unwrap().visual_key, old_vk);
    chips
        .sync_after_city_models(&cities, &r, &ui)
        .expect("sync");
    assert_eq!(ids(&chips), ["12", "7"]);
    assert_eq!(chips.chip("7").unwrap().key, KEY_ROMA);
    assert_eq!(
        chips.chip("7").unwrap().group_visual_key,
        r.city("7").unwrap().visual_key
    );

    // Same data again: nothing moves.
    chips
        .sync_after_city_models(&cities, &r, &ui)
        .expect("sync");
    assert_eq!(ids(&chips), ["12", "7"]);
}

/// `syncStatChips`: `const grp = this.models.get(city.id); if (!grp)
/// continue;` (`cities.ts:646-647`) — a city without a group gets no badge.
#[test]
fn city_without_a_group_is_skipped() {
    let (owners, cities) = fixture();
    let mut r = view::city_renderer(&map());
    sync_models(&mut r, &owners, &cities[..1]);
    let mut chips = CityStatChips::new(Some(1.0));
    chips
        .sync_stat_chips(&cities, &r, &StatChipUiState::WEB_INITIAL)
        .expect("sync");
    assert_eq!(ids(&chips), ["7"]);
}

/// `dispose()` (`cities.ts:778-780`): no sprite, no texture; the LOD level
/// is kept.
#[test]
fn dispose_clears_badges_and_textures() {
    let (_, _, _, mut chips) = initial();
    assert!(chips.set_badge_zoom_lod(1.0));
    chips.dispose();
    assert!(chips.chips().is_empty());
    assert!(chips.textures().is_empty());
    assert_eq!(chips.lod_level(), CityBadgeLodLevel::L2);
}
