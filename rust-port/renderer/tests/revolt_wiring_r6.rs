//! `R-RUSTPORT-P4-1-R6-WIRING-R1`: production wiring of
//! [`RevoltRenderer::sync`] through the cities adapter
//! ([`CityInputs::sync_revolt`]).
//!
//! Pin `07d2fbd72`, `gra/src/render/cities.ts`: `CityRenderer.sync(cities,
//! options)` calls `_syncRevolt(city.id, group, getRevolt(city.id))` on the
//! kept group (`:541`) and on a new / rebuilt group (`:586`), and drops the
//! sprite of a city that left the list (`:597-599`). The adapter runs the
//! same calls after [`CityInputs::sync`] with the same `cities[]`.

use civ_renderer::cities::revolt::{RevoltInputs, RevoltRenderer};
use civ_renderer::view::{self, CityInputs};
use civ_view_model as vm;

const REVOLT_ID: u64 = 21;
const CALM_ID: u64 = 22;

fn me() -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(0).unwrap())
}

/// 3 × 2 meadow map.
fn map() -> vm::MapViewDto {
    let mut hexes = Vec::new();
    for r in 0..2 {
        for q in 0..3 {
            hexes.push(vm::HexStaticDto {
                coord: vm::HexCoord::new(q, r),
                teren_bazowy: vm::Terrain::Laka,
                rzeka_krawedzie: Vec::new(),
            });
        }
    }
    vm::MapViewDto {
        width: 3,
        height: 2,
        seed: 0.0,
        hexes,
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

fn owners() -> Vec<vm::OwnerViewDto> {
    vec![vm::OwnerViewDto {
        owner_id: me(),
        color: 0x001e_88e5,
        civ_icon_id: "rzymianie".to_owned(),
        bronze_civ: "rzym".to_owned(),
        era: 2.0,
        is_city_state: false,
        is_barbarian: false,
        ring_hex: Some("#1e88e5".to_owned()),
        display_name: None,
        map_outline_kind: None,
        capital_city_id: None,
        relation_to_viewer: vm::RelationToViewer::Neutralni,
    }]
}

fn badge() -> vm::CityBadgeDto {
    vm::CityBadgeDto {
        city_name: "Roma".to_owned(),
        population: 3.0,
        defense_tier: 0,
        civ_icon_id: "rzymianie".to_owned(),
        owner_color: 0x001e_88e5,
        prod_active: false,
        prod_kind: None,
        prod_id: None,
        prod_item_name: None,
        prod_category_label: None,
        prod_paused: false,
        growth_percent: None,
        growth_starving: false,
        resource_warning: false,
        is_city_state: false,
        era: 2.0,
        is_capital: false,
    }
}

fn city(id: u64, q: i32, r: i32, revolt: bool) -> vm::CityViewDto {
    vm::CityViewDto {
        id: vm::CityId::try_new(id).unwrap(),
        owner_id: me(),
        hex: vm::HexCoord::new(q, r),
        population: 3.0,
        level: 3.0,
        wall_kind: vm::WallKind::None,
        revolt,
        besieged: false,
        fog_visible: true,
        unit_count_on_hex: 1,
        badge: badge(),
    }
}

/// Two cities, the first one in revolt.
fn two_cities() -> Vec<vm::CityViewDto> {
    vec![city(REVOLT_ID, 0, 0, true), city(CALM_ID, 2, 1, false)]
}

fn inputs(dtos: &[vm::CityViewDto]) -> CityInputs {
    CityInputs::from_dto(&owners(), dtos).expect("city inputs")
}

fn id(n: u64) -> String {
    n.to_string()
}

/// `view.sync` then `view.sync_revolt`: a sprite for the city in revolt,
/// attached to its group, none for the calm one (`render/cities.ts:586`,
/// `:815-831`).
#[test]
fn sync_then_sync_revolt_creates_sprite_for_revolt_city() {
    let view = inputs(&two_cities());
    let mut cities = view::city_renderer(&map());
    let mut revolt = RevoltRenderer::new();

    view.sync(&mut cities);
    view.sync_revolt(&mut revolt, &cities);

    let grp = cities.city(&id(REVOLT_ID)).expect("revolt city group");
    let s = revolt.sprite(&id(REVOLT_ID)).expect("revolt sprite");
    assert_eq!(s.parent_visual_key, grp.visual_key, "parent = city group");
    assert!(cities.city(&id(CALM_ID)).is_some(), "calm city group");
    assert!(
        revolt.sprite(&id(CALM_ID)).is_none(),
        "no sprite when getRevolt == false (render/cities.ts:816-818)"
    );
    assert_eq!(revolt.sprites().len(), 1);
}

/// The adapter path gives the same layer as [`RevoltRenderer::sync`] fed
/// with [`RevoltInputs::from_dto`] of the same `cities[]`.
#[test]
fn sync_revolt_matches_direct_revolt_sync() {
    let dtos = two_cities();
    let view = inputs(&dtos);
    let mut cities = view::city_renderer(&map());
    view.sync(&mut cities);

    let mut wired = RevoltRenderer::new();
    view.sync_revolt(&mut wired, &cities);
    let mut direct = RevoltRenderer::new();
    direct.sync(&RevoltInputs::from_dto(&dtos), &cities);

    assert_eq!(wired, direct);
    assert_eq!(view.revolt_inputs(), &RevoltInputs::from_dto(&dtos));
}

/// A city that left `cities[]` loses its sprite (`render/cities.ts:597-599`),
/// on the next `sync` + `sync_revolt` of the shorter list.
#[test]
fn sprite_removed_when_city_leaves_list() {
    let mut cities = view::city_renderer(&map());
    let mut revolt = RevoltRenderer::new();

    let first = inputs(&two_cities());
    first.sync(&mut cities);
    first.sync_revolt(&mut revolt, &cities);
    assert!(revolt.sprite(&id(REVOLT_ID)).is_some(), "precondition");

    let second = inputs(&[city(CALM_ID, 2, 1, false)]);
    second.sync(&mut cities);
    second.sync_revolt(&mut revolt, &cities);

    assert!(cities.city(&id(REVOLT_ID)).is_none(), "group removed");
    assert!(
        revolt.sprite(&id(REVOLT_ID)).is_none(),
        "sprite removed with its city"
    );
    assert!(revolt.sprites().is_empty());
}

/// The revolt flag turning off on a kept group removes the sprite
/// (`render/cities.ts:541`, `:816-818`).
#[test]
fn sprite_removed_when_revolt_ends() {
    let mut cities = view::city_renderer(&map());
    let mut revolt = RevoltRenderer::new();

    let first = inputs(&two_cities());
    first.sync(&mut cities);
    first.sync_revolt(&mut revolt, &cities);
    assert!(revolt.sprite(&id(REVOLT_ID)).is_some(), "precondition");

    let calm = inputs(&[city(REVOLT_ID, 0, 0, false), city(CALM_ID, 2, 1, false)]);
    calm.sync(&mut cities);
    calm.sync_revolt(&mut revolt, &cities);

    assert!(cities.city(&id(REVOLT_ID)).is_some(), "group kept");
    assert!(revolt.sprites().is_empty());
}

/// Order: `sync_revolt` before `sync` finds no city group, so no sprite is
/// made (in the web `_syncRevolt` only runs on a group `sync` has). The
/// required order `sync` → `sync_revolt` then makes it.
#[test]
fn sync_revolt_before_sync_makes_no_sprite() {
    let view = inputs(&two_cities());
    let mut cities = view::city_renderer(&map());
    let mut revolt = RevoltRenderer::new();

    view.sync_revolt(&mut revolt, &cities);
    assert!(cities.city(&id(REVOLT_ID)).is_none(), "no group yet");
    assert!(
        revolt.sprites().is_empty(),
        "no sprite without a city group"
    );

    view.sync(&mut cities);
    view.sync_revolt(&mut revolt, &cities);
    assert!(revolt.sprite(&id(REVOLT_ID)).is_some());
    assert_eq!(revolt.sprites().len(), 1);
}
