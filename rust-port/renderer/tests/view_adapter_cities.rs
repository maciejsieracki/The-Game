//! `R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES`: owners, cities, wonders, emblems
//! and badges, DTO → renderer input (`renderer/src/view/cities.rs`).
//!
//! Fixtures are hand-built DTOs (no engine producer, document §1 "Wniosek
//! 1"). Every expected value names the pin `07d2fbd72` line that defines it.

use std::collections::HashSet;

use civ_renderer::core::bronze::BronzeCiv;
use civ_renderer::models::cities::outline::CityMapOutlineKind;
use civ_renderer::models::cities::renderer::{City, CityWallKind, SceneObject};
use civ_renderer::models::wonders::{build_wonder_model, WonderModelOptions};
use civ_renderer::raster::atlas::keys::CityMapBadgeInput;
use civ_renderer::view::{
    self, CityAdapterError, CityInputs, FogSets, ViewAdapterError, WonderInputs,
};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

const ME: u64 = 0;
const FOREIGN: u64 = 3;

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

fn city_id(id: u64) -> vm::CityId {
    vm::CityId::try_new(id).unwrap()
}

/// 4 × 3 map, all meadow, `r`-major.
fn map() -> vm::MapViewDto {
    let (w, h) = (4, 3);
    let mut hexes = Vec::new();
    for r in 0..h {
        for q in 0..w {
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

#[allow(clippy::too_many_arguments)]
fn owner(
    id: vm::OwnerRef,
    color: u32,
    civ_icon_id: &str,
    bronze_civ: &str,
    era: f64,
    is_barbarian: bool,
    ring_hex: Option<&str>,
    outline: Option<vm::MapOutlineKind>,
) -> vm::OwnerViewDto {
    vm::OwnerViewDto {
        owner_id: id,
        color,
        civ_icon_id: civ_icon_id.to_owned(),
        bronze_civ: bronze_civ.to_owned(),
        era,
        is_city_state: false,
        is_barbarian,
        ring_hex: ring_hex.map(str::to_owned),
        display_name: None,
        map_outline_kind: outline,
        capital_city_id: None,
        relation_to_viewer: vm::RelationToViewer::Neutralni,
    }
}

/// `owners[]` ascending by `OwnerRef` (contract §3.4): barbarians, viewer,
/// foreign player. The barbarian entry deliberately carries a `civ_icon_id`
/// and a `ring_hex`: the adapter must drop both (`main.ts:10377`, `:10381`).
fn owners() -> Vec<vm::OwnerViewDto> {
    vec![
        owner(
            vm::OwnerRef::Barbarian,
            0x0075_7575,
            "grecy",
            "grecja",
            1.0,
            true,
            Some("#757575"),
            Some(vm::MapOutlineKind::War),
        ),
        owner(
            player(ME),
            0x001e_88e5,
            "rzymianie",
            "rzym",
            2.0,
            false,
            Some("#1e88e5"),
            Some(vm::MapOutlineKind::Player),
        ),
        owner(
            player(FOREIGN),
            0x0043_a047,
            "egipt",
            "egipt",
            3.0,
            false,
            Some("#43a047"),
            Some(vm::MapOutlineKind::Neutral),
        ),
    ]
}

fn badge(name: &str) -> vm::CityBadgeDto {
    vm::CityBadgeDto {
        city_name: name.to_owned(),
        population: 4.0,
        defense_tier: 1,
        civ_icon_id: "rzymianie".to_owned(),
        owner_color: 0x001e_88e5,
        prod_active: true,
        prod_kind: Some(vm::ProductionKind::Jednostka),
        prod_id: Some("wlocznik".to_owned()),
        prod_item_name: Some("Włócznik".to_owned()),
        prod_category_label: Some("Jednostka".to_owned()),
        prod_paused: false,
        growth_percent: Some(37.5),
        growth_starving: true,
        resource_warning: true,
        is_city_state: false,
        era: 2.0,
        is_capital: true,
    }
}

#[allow(clippy::too_many_arguments)]
fn city(
    id: u64,
    o: vm::OwnerRef,
    q: i32,
    r: i32,
    population: f64,
    level: f64,
    wall: vm::WallKind,
    fog_visible: bool,
) -> vm::CityViewDto {
    vm::CityViewDto {
        id: city_id(id),
        owner_id: o,
        hex: vm::HexCoord::new(q, r),
        population,
        level,
        wall_kind: wall,
        revolt: false,
        besieged: false,
        fog_visible,
        unit_count_on_hex: 0,
        badge: badge("Roma"),
    }
}

/// Own city, foreign city (not visible), barbarian camp-city.
fn cities() -> Vec<vm::CityViewDto> {
    vec![
        city(10, player(ME), 1, 1, 4.0, 3.0, vm::WallKind::Palisada, true),
        city(
            11,
            player(FOREIGN),
            3,
            0,
            2.0,
            2.0,
            vm::WallKind::Stone,
            false,
        ),
        city(
            12,
            vm::OwnerRef::Barbarian,
            0,
            2,
            1.0,
            1.0,
            vm::WallKind::None,
            true,
        ),
    ]
}

/// One wonder of the foreign player at `(2,2)`.
fn wonders() -> Vec<vm::PlacedWonderDto> {
    vec![vm::PlacedWonderDto {
        wonder_id: "piramidy".to_owned(),
        hex: vm::HexCoord::new(2, 2),
        owner_id: player(FOREIGN),
        ruin: false,
    }]
}

fn viewer(fog_active: bool) -> vm::ViewerDto {
    vm::ViewerDto {
        owner_id: player(ME),
        fog_active,
    }
}

/// Fog: only `(1,1)` and `(0,2)` visible; `(3,0)` and `(2,2)` explored.
fn fog_sets(fog_active: bool) -> FogSets {
    let m = map();
    let state = m
        .hexes
        .iter()
        .map(|h| match (h.coord.q, h.coord.r) {
            (1, 1) | (0, 2) => vm::FogState::Visible,
            (3, 0) | (2, 2) => vm::FogState::Explored,
            _ => vm::FogState::Unexplored,
        })
        .collect();
    FogSets::from_dto(&m, &vm::FogViewDto { state }, fog_active).unwrap()
}

// ------------------------------------------------------------ cities

#[test]
fn cities_become_renderer_cities_in_dto_order() {
    let inputs = CityInputs::from_dto(&owners(), &cities()).unwrap();
    // `City{id, ownerId, q, r, population}` (`render/cities.ts` `City`,
    // renderer `renderer.rs:118-129`); id = decimal `CityId` (D-DTO-2 = B),
    // owner = legacy number (`-1` barbarians, `ids.rs:132`).
    assert_eq!(
        inputs.cities,
        vec![
            City {
                id: "10".into(),
                owner_id: 0,
                q: 1,
                r: 1,
                population: 4.0
            },
            City {
                id: "11".into(),
                owner_id: 3,
                q: 3,
                r: 0,
                population: 2.0
            },
            City {
                id: "12".into(),
                owner_id: -1,
                q: 0,
                r: 2,
                population: 1.0
            },
        ]
    );
}

#[test]
fn render_options_follow_city_render_opts() {
    let inputs = CityInputs::from_dto(&owners(), &cities()).unwrap();
    let c = inputs.cities.clone();
    inputs.with_render_options(|o| {
        // `getEra: empireEpochForOwner` (`main.ts:2949`).
        assert_eq!((o.get_era.unwrap())(0), 2.0);
        assert_eq!((o.get_era.unwrap())(3), 3.0);
        // `getCiv: ikonaIdToBronzeCiv(civTypeForOwner(…))` (`main.ts:2955`);
        // the producer sends the bronze key, parsed by `BronzeCiv::from_web_id`.
        assert_eq!((o.get_civ.unwrap())(0), BronzeCiv::Rzym);
        assert_eq!((o.get_civ.unwrap())(3), BronzeCiv::Egipt);
        assert_eq!((o.get_civ.unwrap())(-1), BronzeCiv::Grecja);
        // `getLevel` (`main.ts:2956-2959`): producer value; unknown city → 1
        // (`: 1`, `main.ts:2958`).
        assert_eq!((o.get_level.unwrap())("10"), 3.0);
        assert_eq!((o.get_level.unwrap())("11"), 2.0);
        assert_eq!((o.get_level.unwrap())("999"), 1.0);
        // `getWallKind` (`main.ts:2961-2966`, `'mur'` → `'stone'`).
        assert_eq!((o.get_wall_kind.unwrap())("10"), CityWallKind::Palisada);
        assert_eq!((o.get_wall_kind.unwrap())("11"), CityWallKind::Stone);
        assert_eq!((o.get_wall_kind.unwrap())("12"), CityWallKind::None);
        // `getWalls` not passed: superseded by `getWallKind` (`renderer.rs:498-506`).
        assert!(o.get_walls.is_none());
        // `isVisible` fog part (`main.ts:2973-2976`).
        assert!((o.is_visible.unwrap())(&c[0]));
        assert!(!(o.is_visible.unwrap())(&c[1]));
        assert!((o.is_visible.unwrap())(&c[2]));
        // `getMapOutlineKind: cityMapOutlineKindForOwner` (`main.ts:2972`).
        assert_eq!(
            (o.get_map_outline_kind.unwrap())(0),
            Some(CityMapOutlineKind::Player)
        );
        assert_eq!(
            (o.get_map_outline_kind.unwrap())(-1),
            Some(CityMapOutlineKind::War)
        );
        // `ownerColorFn: civColorFn` (`main.ts:2978`).
        assert_eq!((o.owner_color_fn.unwrap())(0), 0x001e_88e5);
        assert_eq!((o.owner_color_fn.unwrap())(3), 0x0043_a047);
        assert_eq!((o.owner_color_fn.unwrap())(-1), 0x0075_7575);
    });
}

#[test]
fn city_renderer_sync_uses_the_options() {
    let inputs = CityInputs::from_dto(&owners(), &cities()).unwrap();
    let mut r = view::city_renderer(&map());
    inputs.sync(&mut r);
    // `visualKey = style|era|civ|level|wallKind` (`renderer.rs` `sync`).
    let keys: Vec<(&str, &str)> = ["10", "11", "12"]
        .iter()
        .map(|id| (*id, r.city(id).unwrap().visual_key.as_str()))
        .collect();
    assert_eq!(
        keys,
        [
            ("10", "roblox|2|rzym|3|palisada"),
            ("11", "roblox|3|egipt|2|stone"),
            ("12", "roblox|1|grecja|1|none"),
        ]
    );
    // `isVisible` → `group.visible`.
    assert!(r.city("10").unwrap().visible());
    assert!(!r.city("11").unwrap().visible());
    // Outline key `${ownerId}:${kind}:${civColor}` (`cities.ts:888-917`):
    // only visible cities get one.
    let mut outlines: Vec<String> = r
        .scene()
        .iter()
        .filter_map(|o| match o {
            SceneObject::Outline(ol) => Some(format!("{}={}", ol.city_id, ol.key)),
            SceneObject::City(_) => None,
        })
        .collect();
    outlines.sort();
    assert_eq!(
        outlines,
        [
            format!("10=0:player:{}", 0x001e_88e5),
            format!("12=-1:war:{}", 0x0075_7575)
        ]
    );
}

// ------------------------------------------------------------ fog

#[test]
fn city_fog_hides_foreign_cities_outside_visible() {
    let inputs = CityInputs::from_dto(&owners(), &cities()).unwrap();
    let mut r = view::city_renderer(&map());
    inputs.sync(&mut r);
    // `applyFogVisibility(vis, true, ME())` (`main.ts:13503`).
    view::apply_city_fog(&mut r, &fog_sets(true), &viewer(true)).unwrap();
    assert!(r.city("10").unwrap().visible(), "own city always visible");
    assert!(!r.city("11").unwrap().visible(), "(3,0) explored only");
    assert!(r.city("12").unwrap().visible(), "(0,2) visible");
    // Fog off: `applyFogVisibility(ALL_KEYS, false, ME())` (`main.ts:13512`).
    view::apply_city_fog(&mut r, &fog_sets(false), &viewer(false)).unwrap();
    assert!(r.city("11").unwrap().visible());
}

#[test]
fn own_city_outside_visible_stays_visible() {
    // Own city at an unexplored hex: `grp.ownerId === playerOwnerId` → visible
    // (`cities.ts:657-680`).
    let cs = vec![city(
        20,
        player(ME),
        2,
        1,
        1.0,
        1.0,
        vm::WallKind::None,
        true,
    )];
    let inputs = CityInputs::from_dto(&owners(), &cs).unwrap();
    let mut r = view::city_renderer(&map());
    inputs.sync(&mut r);
    view::apply_city_fog(&mut r, &fog_sets(true), &viewer(true)).unwrap();
    assert!(r.city("20").unwrap().visible());
}

#[test]
fn wonder_fog_hides_wonder_outside_visible() {
    let wi = WonderInputs::from_dto(&owners(), &wonders()).unwrap();
    let mut r = view::wonder_renderer(&map());
    wi.sync(&mut r);
    assert!(
        r.wonders()[0].visible(),
        "no isVisible in sync (main.ts:4316)"
    );
    // `wonderRenderer.applyFogVisibility(vis, true)` (`main.ts:13504`).
    view::apply_wonder_fog(&mut r, &fog_sets(true));
    assert!(!r.wonders()[0].visible(), "(2,2) explored only");
    // Fog off (`main.ts:13513`).
    view::apply_wonder_fog(&mut r, &fog_sets(false));
    assert!(r.wonders()[0].visible());
}

#[test]
fn viewer_owner_overflow_is_an_error() {
    let mut r = view::city_renderer(&map());
    let big = vm::ViewerDto {
        owner_id: player(u64::try_from(i32::MAX).unwrap() + 1),
        fog_active: true,
    };
    assert_eq!(
        view::apply_city_fog(&mut r, &fog_sets(true), &big),
        Err(CityAdapterError::View(ViewAdapterError::OwnerOutOfI32 {
            value: i64::from(i32::MAX) + 1
        }))
    );
}

// ------------------------------------------------------------ wonders

#[test]
fn wonders_become_placed_wonders_with_civ_color() {
    let wi = WonderInputs::from_dto(&owners(), &wonders()).unwrap();
    // `PlacedWonder{wonderId, q, r, ownerId, ruin}` (`wonderRenderer.ts:12-19`).
    assert_eq!(wi.placed.len(), 1);
    let p = &wi.placed[0];
    assert_eq!(
        (p.wonder_id.as_str(), p.q, p.r, p.owner_id, p.ruin),
        ("piramidy", 2, 2, 3, false)
    );
    let mut r = view::wonder_renderer(&map());
    wi.sync(&mut r);
    let w = &r.wonders()[0];
    assert_eq!(w.key, "piramidy@2,2");
    assert_eq!(w.visual_key, "piramidy|3|0");
    // `ownerColorFn: civColorFn` (`main.ts:4316`): the banner gets the
    // owner colour of `owners[]`, not `OWNER_COLORS[3]`.
    let expected = build_wonder_model(
        "piramidy",
        WonderModelOptions {
            ruin: false,
            owner_color: Some(0x0043_a047),
        },
    );
    assert_eq!(w.model, expected);
}

// ------------------------------------------------------------ emblem

#[test]
fn barbarian_emblem_has_no_civ_id() {
    let os = owners();
    // `civId: isBarbarian(ownerId) ? null : civTypeForOwner(ownerId)`,
    // `ringHex: isBarbarian || isCityState ? null : …` (`main.ts:10377-10383`).
    let b = view::owner_emblem_context(&os[0]);
    assert_eq!(b.civ_id, None);
    assert!(b.is_barbarian);
    assert_eq!(b.ring_hex, None);
    assert_eq!(b.era, 1.0);
    let a = view::atlas_owner_emblem_context(&os[0]);
    assert_eq!(a.civ_id, None);
    assert_eq!(a.ring_hex, None);
}

#[test]
fn player_emblem_has_civ_id() {
    let os = owners();
    let p = view::owner_emblem_context(&os[1]);
    assert_eq!(p.civ_id.as_deref(), Some("rzymianie"));
    assert_eq!(p.era, 2.0);
    assert!(!p.is_barbarian && !p.is_city_state);
    assert_eq!(p.ring_hex.as_deref(), Some("#1e88e5"));
    let a = view::atlas_owner_emblem_context(&os[2]);
    assert_eq!(a.civ_id.as_deref(), Some("egipt"));
    assert_eq!(a.ring_hex.as_deref(), Some("#43a047"));
}

#[test]
fn city_state_emblem_has_no_ring() {
    let mut o = owners()[2].clone();
    o.is_city_state = true;
    // `isCityState: portraitForceCultureIcon` → `ringHex: null` (`main.ts:10379-10383`).
    let c = view::owner_emblem_context(&o);
    assert!(c.is_city_state);
    assert_eq!(c.civ_id.as_deref(), Some("egipt"));
    assert_eq!(c.ring_hex, None);
}

// ------------------------------------------------------------ badge

#[test]
fn badge_maps_every_dto_field() {
    let b = badge("Roma");
    // `_buildBadgeInput` (`render/cities.ts:905-929`).
    let got = view::city_badge_input(&b, true, Some(2.0));
    let want = CityMapBadgeInput {
        city_name: "Roma".into(),
        population: 4.0,
        defense_tier: 1,
        civ_icon_id: "rzymianie".into(),
        owner_color: Some(0x001e_88e5),
        prod_active: true,
        prod_kind: Some("jednostka".into()),
        prod_id: Some("wlocznik".into()),
        growth_percent: Some(37.5),
        growth_starving: true,
        resource_warning: true,
        hover_expanded: true,
        prod_category_label: Some("Jednostka".into()),
        prod_item_name: Some("Włócznik".into()),
        prod_paused: false,
        is_city_state: false,
        era: Some(2.0),
        is_capital: true,
        lod_level: Some(2.0),
    };
    assert_eq!(got, want);
    // `prodKind` strings (`game/production.ts:95`).
    assert_eq!(
        view::production_kind(vm::ProductionKind::Budynek),
        "budynek"
    );
    assert_eq!(
        view::production_kind(vm::ProductionKind::Jednostka),
        "jednostka"
    );
}

#[test]
fn badge_each_field_reaches_the_input() {
    // Change one DTO field at a time: each must change the input.
    let base = badge("Roma");
    let b0 = view::city_badge_input(&base, false, None);
    let variants: Vec<(&str, vm::CityBadgeDto)> = vec![
        (
            "city_name",
            vm::CityBadgeDto {
                city_name: "X".into(),
                ..base.clone()
            },
        ),
        (
            "population",
            vm::CityBadgeDto {
                population: 9.0,
                ..base.clone()
            },
        ),
        (
            "defense_tier",
            vm::CityBadgeDto {
                defense_tier: 2,
                ..base.clone()
            },
        ),
        (
            "civ_icon_id",
            vm::CityBadgeDto {
                civ_icon_id: "egipt".into(),
                ..base.clone()
            },
        ),
        (
            "owner_color",
            vm::CityBadgeDto {
                owner_color: 1,
                ..base.clone()
            },
        ),
        (
            "prod_active",
            vm::CityBadgeDto {
                prod_active: false,
                ..base.clone()
            },
        ),
        (
            "prod_kind",
            vm::CityBadgeDto {
                prod_kind: Some(vm::ProductionKind::Budynek),
                ..base.clone()
            },
        ),
        (
            "prod_id",
            vm::CityBadgeDto {
                prod_id: None,
                ..base.clone()
            },
        ),
        (
            "prod_item_name",
            vm::CityBadgeDto {
                prod_item_name: None,
                ..base.clone()
            },
        ),
        (
            "prod_category_label",
            vm::CityBadgeDto {
                prod_category_label: None,
                ..base.clone()
            },
        ),
        (
            "prod_paused",
            vm::CityBadgeDto {
                prod_paused: true,
                ..base.clone()
            },
        ),
        (
            "growth_percent",
            vm::CityBadgeDto {
                growth_percent: None,
                ..base.clone()
            },
        ),
        (
            "growth_starving",
            vm::CityBadgeDto {
                growth_starving: false,
                ..base.clone()
            },
        ),
        (
            "resource_warning",
            vm::CityBadgeDto {
                resource_warning: false,
                ..base.clone()
            },
        ),
        (
            "is_city_state",
            vm::CityBadgeDto {
                is_city_state: true,
                ..base.clone()
            },
        ),
        (
            "era",
            vm::CityBadgeDto {
                era: 3.0,
                ..base.clone()
            },
        ),
        (
            "is_capital",
            vm::CityBadgeDto {
                is_capital: false,
                ..base.clone()
            },
        ),
    ];
    assert_eq!(variants.len(), 17, "CityBadgeDto has 17 fields");
    for (name, v) in variants {
        assert_ne!(view::city_badge_input(&v, false, None), b0, "{name} lost");
    }
}

// ------------------------------------------------------------ errors

#[test]
fn city_owner_overflow_is_an_error() {
    let big = player(u64::try_from(i32::MAX).unwrap() + 1);
    let mut os = owners();
    os.push(owner(big, 1, "egipt", "egipt", 1.0, false, None, None));
    // Owner table first: the overflow is reported, never saturated.
    assert_eq!(
        CityInputs::from_dto(&os, &[]),
        Err(CityAdapterError::View(ViewAdapterError::OwnerOutOfI32 {
            value: i64::from(i32::MAX) + 1
        }))
    );
    let cs = vec![city(30, big, 0, 0, 1.0, 1.0, vm::WallKind::None, true)];
    assert!(matches!(
        CityInputs::from_dto(&owners(), &cs),
        Err(CityAdapterError::View(
            ViewAdapterError::OwnerOutOfI32 { .. }
        ))
    ));
    let ws = vec![vm::PlacedWonderDto {
        wonder_id: "piramidy".into(),
        hex: vm::HexCoord::new(0, 0),
        owner_id: big,
        ruin: false,
    }];
    assert!(matches!(
        WonderInputs::from_dto(&owners(), &ws),
        Err(CityAdapterError::View(
            ViewAdapterError::OwnerOutOfI32 { .. }
        ))
    ));
}

#[test]
fn contract_violations_are_errors() {
    // Unknown bronze key: no fallback.
    let mut os = owners();
    os[1].bronze_civ = "rzymianie".into();
    assert_eq!(
        CityInputs::from_dto(&os, &cities()),
        Err(CityAdapterError::UnknownBronzeCiv {
            owner: 0,
            value: "rzymianie".into()
        })
    );
    // Duplicate owner.
    let mut os = owners();
    os.push(os[1].clone());
    assert_eq!(
        CityInputs::from_dto(&os, &[]),
        Err(CityAdapterError::DuplicateOwner { owner: 0 })
    );
    // Duplicate city id.
    let mut cs = cities();
    cs.push(cs[0].clone());
    assert_eq!(
        CityInputs::from_dto(&owners(), &cs),
        Err(CityAdapterError::DuplicateCity { id: "10".into() })
    );
    // City / wonder owner without an owners[] entry.
    let cs = vec![city(
        40,
        vm::OwnerRef::Rebel,
        0,
        0,
        1.0,
        1.0,
        vm::WallKind::None,
        true,
    )];
    assert_eq!(
        CityInputs::from_dto(&owners(), &cs),
        Err(CityAdapterError::MissingOwner { owner: -99 })
    );
    let ws = vec![vm::PlacedWonderDto {
        wonder_id: "piramidy".into(),
        hex: vm::HexCoord::new(0, 0),
        owner_id: player(7),
        ruin: true,
    }];
    assert_eq!(
        WonderInputs::from_dto(&owners(), &ws),
        Err(CityAdapterError::MissingOwner { owner: 7 })
    );
}

#[test]
fn renderers_take_the_static_map() {
    // `new CityRenderer(scene, map)`: a city on a known hex is placed on its
    // terrain top, so two maps that differ only in terrain give different y.
    let inputs = CityInputs::from_dto(&owners(), &cities()).unwrap();
    let mut m2 = map();
    for h in &mut m2.hexes {
        h.teren_bazowy = vm::Terrain::Gory;
    }
    let mut a = view::city_renderer(&map());
    let mut b = view::city_renderer(&m2);
    inputs.sync(&mut a);
    inputs.sync(&mut b);
    let ya = civ_renderer::models::cities::renderer::root_position(&a.city("10").unwrap().model).y;
    let yb = civ_renderer::models::cities::renderer::root_position(&b.city("10").unwrap().model).y;
    assert_ne!(ya, yb);
    let keys: HashSet<&str> = ["10", "11", "12"].into_iter().collect();
    assert!(keys.iter().all(|k| a.city(k).is_some()));
}
