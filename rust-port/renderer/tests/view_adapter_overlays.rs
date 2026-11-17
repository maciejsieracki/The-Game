//! R-RUSTPORT-P4-1G-Q5-ADAPTER-OVERLAYS: the overlays part of the view adapter
//! (`renderer::view::overlays`), `P4-1G-ADAPTER-ROZPOZNANIE.md` §3.6, §3.7,
//! §7 row Q5.
//!
//! Every expected value is the renderer input built "as the web builds it"
//! (pin `07d2fbd72`, `gra/src/**`): the same renderer functions, called with
//! literal inputs written from the pin, compared with what the adapter builds
//! from the DTO. Sources:
//! - territory: `refreshTerritoryBorderOverlay` (`main.ts:15582-15616`),
//!   `relationColorFn` (`main.ts:4065-4068`), `RELATION_BORDER_COLOR_*`
//!   (`game/civ-visual.ts:84-86`) and `relationBorderColor`
//!   (`civ-visual.ts:100-104`);
//! - ranges: `refreshRangeOverlays` (`main.ts:15625-15647`);
//! - trade routes: `refreshTradeRoutesOverlay` (`main.ts:15379-15397`);
//! - worker fields: `refreshWorkerFieldOverlay` (`main.ts:15432-15448`);
//! - city surroundings: `syncOkolicaOverlay` (`main.ts:6644-6666`);
//! - deposit-mine layer: `refreshMineEligibleOverlay` (`main.ts:15559-15568`)
//!   from `refreshBuildHighlight` (`main.ts:16386-16390`);
//! - sieges: `refreshSiegeMarkers` (`main.ts:17492-17530`),
//!   `render/siegeCampSync.ts:14-47`;
//! - UI start values: `main.ts:15338`, `:15358`, `:15419`, `:6575`, `:13644`,
//!   `:2977`.

use std::collections::HashSet;

use civ_renderer::cities::overlay::okolica::{
    build_city_okolica_overlay, CityOkolicaOverlayParams, TileYield,
};
use civ_renderer::cities::overlay::worker_field::{
    sync_worker_field_overlay, sync_worker_field_overlay_fog,
};
use civ_renderer::models::misc::range::{
    build_range_overlay_group_game, build_territory_border_group, RangeOverlayStyle,
    TerritoryBorderParams, CULTURE_RANGE_STYLE, MINE_ELIGIBLE_STYLE, RELIGION_RANGE_STYLE,
};
use civ_renderer::models::misc::siege::{
    SiegeMachineKind, SiegeMarkerRenderer, SiegeMarkerSyncOptions, MARKER_LIFT,
};
use civ_renderer::models::misc::trade::{
    build_trade_routes_overlay_group, TradeMedium, TradeRouteOverlayInput,
};
use civ_renderer::models::misc::{HexKey, HexKeySet, MatKind, MiscMaterial};
use civ_renderer::pick::hex::{axial_to_world, HexCoord as PickHex, HEX_R};
use civ_renderer::pick::terrain::build_terrain_pick_scene;
use civ_renderer::view::{self, FogSets, MapUiState, OverlayAdapterError};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

const W: u32 = 5;
const H: u32 = 4;

/// 5×4 map, `r`-major (`hexes[i].coord == (i % 5, i / 5)`, contract §1.4).
const TERRAIN: [vm::Terrain; 20] = [
    // r = 0
    vm::Terrain::Morze,
    vm::Terrain::Laka,
    vm::Terrain::Laka,
    vm::Terrain::Wzgorza,
    vm::Terrain::Rownina,
    // r = 1
    vm::Terrain::PlytkieMorze,
    vm::Terrain::Laka,
    vm::Terrain::Rownina,
    vm::Terrain::Wzgorza,
    vm::Terrain::Gory,
    // r = 2
    vm::Terrain::Laka,
    vm::Terrain::Pustynia,
    vm::Terrain::Laka,
    vm::Terrain::Wzgorza,
    vm::Terrain::Laka,
    // r = 3
    vm::Terrain::Polarny,
    vm::Terrain::Laka,
    vm::Terrain::Rownina,
    vm::Terrain::Laka,
    vm::Terrain::Morze,
];

/// Fog codes (`0` unexplored, `1` explored, `2` visible; D-DTO-10 = A).
const FOG: [u8; 20] = [2, 2, 2, 1, 0, 2, 2, 2, 1, 0, 2, 1, 2, 2, 0, 1, 1, 2, 2, 2];

/// `HexDynDto.covering_improvement` on (1,1) only.
const COVERING: [bool; 20] = [
    false, false, false, false, false, false, true, false, false, false, false, false, false,
    false, false, false, false, false, false, false,
];

fn coord(i: usize) -> vm::HexCoord {
    let w = usize::try_from(W).unwrap();
    vm::HexCoord::new(i32::try_from(i % w).unwrap(), i32::try_from(i / w).unwrap())
}

fn hx(q: i32, r: i32) -> vm::HexCoord {
    vm::HexCoord::new(q, r)
}

fn fixture_map() -> vm::MapViewDto {
    vm::MapViewDto {
        width: W,
        height: H,
        seed: 4242.0,
        hexes: (0..TERRAIN.len())
            .map(|i| vm::HexStaticDto {
                coord: coord(i),
                teren_bazowy: TERRAIN[i],
                rzeka_krawedzie: Vec::new(),
            })
            .collect(),
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

fn fixture_state() -> Vec<vm::HexDynDto> {
    (0..TERRAIN.len())
        .map(|i| vm::HexDynDto {
            nakladka: vm::Nakladka::Brak,
            ulepszenie: vm::Ulepszenie::Brak,
            ulepszenia: None,
            improvement_key: None,
            zloze: None,
            village_present: false,
            terraces: false,
            covering_improvement: COVERING[i],
            road_mask: 0,
        })
        .collect()
}

fn fixture_fog() -> vm::FogViewDto {
    vm::FogViewDto {
        state: FOG
            .iter()
            .map(|&c| vm::FogState::from_code(c).unwrap())
            .collect(),
    }
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

const VIEWER_COLOR: u32 = 0x11_2233;
const P1_COLOR: u32 = 0x44_5566;
const P2_COLOR: u32 = 0x77_8899;
const BARB_COLOR: u32 = 0xaa_0000;
const P3_COLOR: u32 = 0x00_00bb;
const P4_COLOR: u32 = 0x00_cc00;

fn owner(id: vm::OwnerRef, color: u32, rel: vm::RelationToViewer) -> vm::OwnerViewDto {
    vm::OwnerViewDto {
        owner_id: id,
        color,
        civ_icon_id: "x".to_owned(),
        bronze_civ: "egypt".to_owned(),
        era: 1.0,
        is_city_state: false,
        is_barbarian: id == vm::OwnerRef::Barbarian,
        ring_hex: None,
        display_name: None,
        map_outline_kind: None,
        capital_city_id: None,
        relation_to_viewer: rel,
    }
}

/// `owners[]` ascending by `OwnerRef`: barbarians (war, forced by
/// `getDiploRelation`, `main.ts:4058-4061`), the viewer (`self`), war,
/// alliance, peace, neutral.
fn owners() -> Vec<vm::OwnerViewDto> {
    vec![
        owner(
            vm::OwnerRef::Barbarian,
            BARB_COLOR,
            vm::RelationToViewer::Wojna,
        ),
        owner(player(0), VIEWER_COLOR, vm::RelationToViewer::Own),
        owner(player(1), P1_COLOR, vm::RelationToViewer::Wojna),
        owner(player(2), P2_COLOR, vm::RelationToViewer::Sojusz),
        owner(player(3), P3_COLOR, vm::RelationToViewer::Pokoj),
        owner(player(4), P4_COLOR, vm::RelationToViewer::Neutralni),
    ]
}

fn viewer(fog_active: bool) -> vm::ViewerDto {
    vm::ViewerDto {
        owner_id: player(0),
        fog_active,
    }
}

fn territory() -> vm::TerritoryViewDto {
    let oh = |o: vm::OwnerRef, hexes: &[(i32, i32)]| vm::OwnerHexesDto {
        owner_id: o,
        hexes: hexes.iter().map(|&(q, r)| hx(q, r)).collect(),
    };
    vm::TerritoryViewDto {
        by_owner: vec![
            oh(player(0), &[(1, 0), (2, 0), (1, 1), (2, 1)]),
            oh(player(1), &[(3, 0), (4, 0), (3, 1)]),
            oh(player(2), &[(0, 2), (1, 2)]),
            oh(vm::OwnerRef::Barbarian, &[(1, 3)]),
            oh(player(3), &[(3, 2), (4, 2)]),
            oh(player(4), &[(2, 3), (3, 3)]),
        ],
    }
}

fn okolica_dto() -> vm::OkolicaViewDto {
    // Every hex of the range 1 around (2,1) that exists on the map, in
    // `hexKeysWithinRadius` order (producer Z-1F4-3).
    let y = |z: Option<f64>, p: Option<f64>, h: Option<f64>| vm::TileYieldDto {
        zywnosc: z,
        praca: p,
        handel: h,
    };
    vm::OkolicaViewDto {
        city_id: vm::CityId::try_new(7).unwrap(),
        city_hex: hx(2, 1),
        range: 1.0,
        worked_hexes: vec![hx(2, 0), hx(1, 2)],
        yields: vec![
            (hx(1, 1), y(Some(2.0), None, None)),
            (hx(1, 2), y(Some(1.0), Some(1.0), None)),
            (hx(2, 0), y(Some(3.0), None, Some(1.0))),
            (hx(2, 1), y(Some(2.0), Some(2.0), Some(1.0))),
            (hx(2, 2), y(None, None, None)),
            (hx(3, 0), y(None, Some(2.0), None)),
            (hx(3, 1), y(Some(1.0), None, None)),
        ],
        show_yields: Some(true),
        owner_id: player(0),
    }
}

fn overlays() -> vm::OverlaysViewDto {
    vm::OverlaysViewDto {
        culture_range: Some(vec![hx(1, 0), hx(2, 0), hx(1, 1), hx(2, 0)]),
        religion_range: Some(vec![hx(2, 1), hx(2, 2)]),
        trade_routes: vec![
            vm::TradeRouteDto {
                from: hx(2, 1),
                to: hx(4, 2),
                medium: vm::TradeMedium::Lad,
            },
            vm::TradeRouteDto {
                from: hx(1, 1),
                to: hx(3, 3),
                medium: vm::TradeMedium::Morze,
            },
        ],
        okolica: Some(okolica_dto()),
        worker_fields: vec![
            vm::WorkerFieldDto {
                hex: hx(1, 1),
                owner_id: player(0),
            },
            vm::WorkerFieldDto {
                hex: hx(4, 0),
                owner_id: player(1),
            },
            vm::WorkerFieldDto {
                hex: hx(4, 1),
                owner_id: player(1),
            },
            vm::WorkerFieldDto {
                hex: hx(3, 0),
                owner_id: player(2),
            },
        ],
        reachable: Vec::new(),
        build_highlight: vm::BuildHighlightDto {
            kind: vm::BuildHighlightKind::Mine,
            hexes: vec![hx(3, 0), hx(3, 1), hx(3, 0)],
        },
        selection: None,
        path_route: None,
    }
}

fn siege(
    city: u64,
    hex: vm::HexCoord,
    camps: &[(i32, i32, vm::OwnerRef)],
    ready: &[vm::SiegeMachineKind],
) -> vm::SiegeViewDto {
    vm::SiegeViewDto {
        city_id: vm::CityId::try_new(city).unwrap(),
        city_hex: hex,
        camp_hexes: camps
            .iter()
            .map(|&(q, r, o)| vm::overlays::SiegeCampDto {
                hex: hx(q, r),
                owner_id: o,
            })
            .collect(),
        ready_machines: ready.to_vec(),
    }
}

/// Two besieged cities sharing the camp hex (3,1): city 7 (camps of player 1,
/// one unit twice on (1,1)) and city 9 (camp of player 2 on (3,1)).
fn sieges() -> Vec<vm::SiegeViewDto> {
    use vm::SiegeMachineKind::{Taran, Wieza};
    vec![
        siege(
            7,
            hx(2, 1),
            &[(1, 1, player(1)), (3, 1, player(1)), (1, 1, player(1))],
            &[Taran, Wieza, Taran],
        ),
        siege(9, hx(3, 2), &[(3, 1, player(2))], &[Wieza]),
    ]
}

fn ui_all_off() -> MapUiState {
    MapUiState {
        territory_border_visible: false,
        show_trade_routes_overlay: false,
        show_worker_overlay: false,
        is_city_panel_open: false,
        city_panel_view_city_id: None,
        force_visible_unit_id: None,
        hide_stat_chips: false,
        hover_stat_chip_city_id: None,
    }
}

fn fog_sets(active: bool) -> FogSets {
    FogSets::from_dto(&fixture_map(), &fixture_fog(), active).unwrap()
}

fn keys(list: &[(i32, i32)]) -> HexKeySet {
    HexKeySet::new(list)
}

// ------------------------------------------------------------ UI state

/// `MapUiState::WEB_INITIAL` = the pin start values: `territoryBorderVisible
/// = true` (`main.ts:15338`), `showTradeRoutesOverlay = true` (`:15358`),
/// `showWorkerOverlay = true` (`:15419`), `cityPanelViewCityId = null`
/// (`:6575`), `forceVisibleUnitId = null` (`:13644`), `hideStatChips =
/// isCityPanelOpen() = false` (`:2977`).
#[test]
fn ui_web_initial_matches_pin() {
    let ui = MapUiState::WEB_INITIAL;
    assert!(ui.territory_border_visible);
    assert!(ui.show_trade_routes_overlay);
    assert!(ui.show_worker_overlay);
    assert!(!ui.is_city_panel_open);
    assert_eq!(ui.city_panel_view_city_id, None);
    assert_eq!(ui.force_visible_unit_id, None);
    assert!(!ui.hide_stat_chips);
}

// ------------------------------------------------------------ territory

/// `RELATION_BORDER_COLOR_WOJNA = 0xff5252`, `_SOJUSZ = 0x4fc3f7`,
/// `_NEUTRALNY = 0xffd700` (`game/civ-visual.ts:84-86`); `relationBorderColor`
/// maps `wojna`/`sojusz` to them and everything else (`pokoj`, `neutralni`)
/// to gold (`civ-visual.ts:100-104`).
#[test]
fn relation_border_colors_match_pin_literals() {
    assert_eq!(view::RELATION_BORDER_COLOR_WOJNA, 0xff5252);
    assert_eq!(view::RELATION_BORDER_COLOR_SOJUSZ, 0x4fc3f7);
    assert_eq!(view::RELATION_BORDER_COLOR_NEUTRALNY, 0xffd700);
    let c = view::relation_border_color;
    assert_eq!(c(vm::RelationToViewer::Wojna), Some(0xff5252));
    assert_eq!(c(vm::RelationToViewer::Sojusz), Some(0x4fc3f7));
    assert_eq!(c(vm::RelationToViewer::Pokoj), Some(0xffd700));
    assert_eq!(c(vm::RelationToViewer::Neutralni), Some(0xffd700));
    assert_eq!(c(vm::RelationToViewer::Own), None);
}

/// `relationColorFn` (`main.ts:4065-4068`): own owner → `civColorFn(ME())`,
/// others → `relationBorderColor(status)`.
#[test]
fn relation_color_own_is_viewer_color() {
    let o = owners();
    let v = viewer(true);
    let got: Vec<u32> = o
        .iter()
        .map(|e| view::relation_color(e, &v).unwrap())
        .collect();
    assert_eq!(
        got,
        vec![
            0xff5252,
            VIEWER_COLOR,
            0xff5252,
            0x4fc3f7,
            0xffd700,
            0xffd700
        ]
    );
}

/// `self` on a foreign owner, or a status on the viewer itself, contradicts
/// `isMe(ownerId)`: an error, not a guess.
#[test]
fn relation_mismatch_is_an_error() {
    let v = viewer(true);
    let foreign_self = owner(player(1), P1_COLOR, vm::RelationToViewer::Own);
    assert_eq!(
        view::relation_color(&foreign_self, &v),
        Err(OverlayAdapterError::RelationMismatch {
            owner: 1,
            viewer: 0
        })
    );
    let me_at_war = owner(player(0), VIEWER_COLOR, vm::RelationToViewer::Wojna);
    assert_eq!(
        view::relation_color(&me_at_war, &v),
        Err(OverlayAdapterError::RelationMismatch {
            owner: 0,
            viewer: 0
        })
    );
}

/// The adapter group equals `buildTerritoryBorderGroup(map, byOwner,
/// civColorFn, TERRITORY_BORDER_BAND_WIDTH, TERRITORY_BORDER_OPACITY,
/// relationColorFn)` (`main.ts:15607-15614`) built with literal inputs.
#[test]
fn territory_group_matches_web_inputs() {
    let map = view::overlay_map(&fixture_map());
    let got = view::territory_border_group(
        &map,
        &territory(),
        &owners(),
        &viewer(true),
        &MapUiState::WEB_INITIAL,
    )
    .unwrap()
    .expect("territoryBorderVisible = true");

    let by_owner: Vec<(i64, HexKeySet)> = vec![
        (0, keys(&[(1, 0), (2, 0), (1, 1), (2, 1)])),
        (1, keys(&[(3, 0), (4, 0), (3, 1)])),
        (2, keys(&[(0, 2), (1, 2)])),
        (-1, keys(&[(1, 3)])),
        (3, keys(&[(3, 2), (4, 2)])),
        (4, keys(&[(2, 3), (3, 3)])),
    ];
    let civ = |o: i64| match o {
        0 => VIEWER_COLOR,
        1 => P1_COLOR,
        2 => P2_COLOR,
        -1 => BARB_COLOR,
        3 => P3_COLOR,
        4 => P4_COLOR,
        _ => unreachable!(),
    };
    let relation = |o: i64| match o {
        0 => VIEWER_COLOR, // isMe → civColorFn(ME())
        1 => 0xff5252,     // wojna
        2 => 0x4fc3f7,     // sojusz
        -1 => 0xff5252,    // barbarians: wojna
        3 | 4 => 0xffd700, // pokoj, neutralni
        _ => unreachable!(),
    };
    let want = build_territory_border_group(
        &map,
        &by_owner,
        &civ,
        TerritoryBorderParams {
            band_width: Some(0.45),
            opacity: Some(0.7),
            relation_band_width: None,
        },
        Some(&relation),
    );
    assert_eq!(got, want);
    // Two bands per owner (outer civ + inner relation), six owners.
    assert_eq!(got.objects.len(), 12);
    assert_eq!(got.objects[3].name, "territory-relation-1");
    let red = MiscMaterial::new(MatKind::Basic, Some(0xff5252)).color;
    assert_eq!(got.objects[3].material.color, red);
}

/// Gate `territoryBorderVisible || isCityPanelOpen()` (`main.ts:15583`).
#[test]
fn territory_gate_follows_switch_and_city_panel() {
    let map = view::overlay_map(&fixture_map());
    let t = territory();
    let o = owners();
    let v = viewer(true);
    let off = ui_all_off();
    assert_eq!(
        view::territory_border_group(&map, &t, &o, &v, &off).unwrap(),
        None,
        "switch off, panel closed: no group"
    );
    let on = MapUiState {
        territory_border_visible: true,
        ..off
    };
    assert!(view::territory_border_group(&map, &t, &o, &v, &on)
        .unwrap()
        .is_some());
    let panel = MapUiState {
        is_city_panel_open: true,
        ..off
    };
    assert!(
        view::territory_border_group(&map, &t, &o, &v, &panel)
            .unwrap()
            .is_some(),
        "the city panel forces the borders on"
    );
    // `byOwner.size === 0` → no group (`:15601`).
    let empty = vm::TerritoryViewDto {
        by_owner: Vec::new(),
    };
    assert_eq!(
        view::territory_border_group(&map, &empty, &o, &v, &on).unwrap(),
        None
    );
}

/// Two owners claiming the same hex keep one entry each (per owner, as the
/// web `Map<owner, Set<key>>`); a hex repeated inside one owner list is one
/// `Set` entry at its first position.
#[test]
fn territory_by_owner_one_entry_per_owner() {
    let t = vm::TerritoryViewDto {
        by_owner: vec![
            vm::OwnerHexesDto {
                owner_id: player(1),
                hexes: vec![hx(2, 1), hx(3, 1), hx(2, 1)],
            },
            vm::OwnerHexesDto {
                owner_id: player(2),
                hexes: vec![hx(2, 1)],
            },
        ],
    };
    let got = view::territory_by_owner(&t);
    assert_eq!(got.len(), 2);
    assert_eq!(got[0].0, 1);
    assert_eq!(got[0].1.iter().collect::<Vec<_>>(), vec![(2, 1), (3, 1)]);
    assert_eq!(got[1].0, 2);
    assert_eq!(got[1].1.iter().collect::<Vec<_>>(), vec![(2, 1)]);
}

#[test]
fn territory_missing_or_duplicate_owner_is_an_error() {
    let map = view::overlay_map(&fixture_map());
    let mut o = owners();
    o.retain(|e| e.owner_id != player(3));
    assert_eq!(
        view::territory_border_group(
            &map,
            &territory(),
            &o,
            &viewer(true),
            &MapUiState::WEB_INITIAL
        ),
        Err(OverlayAdapterError::MissingOwner { owner: 3 })
    );
    let mut d = owners();
    d.push(owner(player(2), P2_COLOR, vm::RelationToViewer::Sojusz));
    assert_eq!(
        view::territory_border_group(
            &map,
            &territory(),
            &d,
            &viewer(true),
            &MapUiState::WEB_INITIAL
        ),
        Err(OverlayAdapterError::DuplicateOwner { owner: 2 })
    );
}

// ------------------------------------------------------------ ranges

/// `buildRangeOverlayGroup(map, keys, CULTURE_RANGE_STYLE)` /
/// `RELIGION_RANGE_STYLE` (`main.ts:15631-15645`); the DTO list is one set
/// (owner `0`, P4-1F1 c), `new Set(keys)` drops the repeated (2,0).
#[test]
fn ranges_match_web_inputs_and_gate_on_city_panel() {
    let map = view::overlay_map(&fixture_map());
    let o = overlays();
    let ui = MapUiState::WEB_INITIAL;
    let culture = view::culture_range_group(&map, &o, &ui).unwrap();
    let want = build_range_overlay_group_game(
        &map,
        &keys(&[(1, 0), (2, 0), (1, 1)]),
        &CULTURE_RANGE_STYLE,
    );
    assert_eq!(culture, want);
    let religion = view::religion_range_group(&map, &o, &ui).unwrap();
    let want =
        build_range_overlay_group_game(&map, &keys(&[(2, 1), (2, 2)]), &RELIGION_RANGE_STYLE);
    assert_eq!(religion, want);

    // `if (isCityPanelOpen()) return;` (`:15629`).
    let panel = MapUiState {
        is_city_panel_open: true,
        ..ui
    };
    assert_eq!(view::culture_range_group(&map, &o, &panel), None);
    assert_eq!(view::religion_range_group(&map, &o, &panel), None);

    // `None` (switch off) and an empty set (`keys.size > 0`, `:15633`).
    let none = vm::OverlaysViewDto {
        culture_range: None,
        religion_range: Some(Vec::new()),
        ..o
    };
    assert_eq!(view::culture_range_group(&map, &none, &ui), None);
    assert_eq!(view::religion_range_group(&map, &none, &ui), None);
}

#[test]
fn range_hex_key_set_keeps_first_position() {
    let s = view::range_hex_key_set(&[hx(1, 1), hx(0, 0), hx(1, 1), hx(2, 0)]);
    assert_eq!(s.iter().collect::<Vec<_>>(), vec![(1, 1), (0, 0), (2, 0)]);
}

// ------------------------------------------------------------ trade routes

/// `inputs.push({ fromQ, fromR, toQ, toR, medium: route.medium })`
/// (`main.ts:15392`), `'lad'` → land colour `0xd9a441`, `'morze'` → sea
/// colour `0x49b6e0` (`render/tradeRoutesOverlay.ts:26-27`).
#[test]
fn trade_routes_match_web_inputs() {
    let map = view::overlay_map(&fixture_map());
    let o = overlays();
    let got = view::trade_routes_group(&map, &o.trade_routes, &MapUiState::WEB_INITIAL).unwrap();
    let inputs = [
        TradeRouteOverlayInput {
            from_q: 2,
            from_r: 1,
            to_q: 4,
            to_r: 2,
            medium: TradeMedium::Lad,
        },
        TradeRouteOverlayInput {
            from_q: 1,
            from_r: 1,
            to_q: 3,
            to_r: 3,
            medium: TradeMedium::Morze,
        },
    ];
    assert_eq!(view::trade_route_input(&o.trade_routes[0]), inputs[0]);
    assert_eq!(view::trade_route_input(&o.trade_routes[1]), inputs[1]);
    assert_eq!(got, build_trade_routes_overlay_group(&map, &inputs));
    let land = MiscMaterial::new(MatKind::LineBasic, Some(0xd9a441)).color;
    let sea = MiscMaterial::new(MatKind::LineBasic, Some(0x49b6e0)).color;
    assert_eq!(got.objects[0].material.color, land);
    assert_eq!(got.objects[1].material.color, sea);
}

/// Gates `showTradeRoutesOverlay` (`:15381`), `isCityPanelOpen()`
/// (`:15382`), empty list (`:15383`).
#[test]
fn trade_routes_gate() {
    let map = view::overlay_map(&fixture_map());
    let routes = overlays().trade_routes;
    let off = ui_all_off();
    assert_eq!(view::trade_routes_group(&map, &routes, &off), None);
    let on = MapUiState {
        show_trade_routes_overlay: true,
        ..off
    };
    assert!(view::trade_routes_group(&map, &routes, &on).is_some());
    let panel = MapUiState {
        is_city_panel_open: true,
        ..on
    };
    assert_eq!(view::trade_routes_group(&map, &routes, &panel), None);
    assert_eq!(view::trade_routes_group(&map, &[], &on), None);
}

// ------------------------------------------------------------ worker fields

/// `syncWorkerFieldOverlay(scene, null, map, workedByOwner, ME())` +
/// `syncWorkerFieldOverlayFog(group, vis, explored, true)`
/// (`main.ts:15441-15444`) with literal inputs. (4,1) is `Gory`, skipped by
/// the renderer itself (`workerFieldOverlay.ts`), not by the adapter.
#[test]
fn worker_fields_match_web_inputs_with_fog() {
    let map = view::overlay_map(&fixture_map());
    let o = overlays();
    let fog = fog_sets(true);
    let got = view::worker_field_overlay(
        &map,
        &o.worker_fields,
        &viewer(true),
        &fog,
        &MapUiState::WEB_INITIAL,
    )
    .unwrap();

    let worked: Vec<(HexKey, f64)> =
        vec![((1, 1), 0.0), ((4, 0), 1.0), ((4, 1), 1.0), ((3, 0), 2.0)];
    let mut want = sync_worker_field_overlay(&map, &worked, Some(0.0)).unwrap();
    // FOG codes: visible = state 2, explored = state >= 1.
    let all: Vec<HexKey> = (0..20).map(|i| (i % 5, i / 5)).collect();
    let visible: HashSet<HexKey> = all
        .iter()
        .zip(FOG)
        .filter(|(_, c)| *c == 2)
        .map(|(k, _)| *k)
        .collect();
    let explored: HashSet<HexKey> = all
        .iter()
        .zip(FOG)
        .filter(|(_, c)| *c >= 1)
        .map(|(k, _)| *k)
        .collect();
    sync_worker_field_overlay_fog(Some(&mut want), &visible, &explored, true);
    assert_eq!(got, want);
    // (4,0) is unexplored (code 0): hidden; (3,0) explored only: dimmed.
    assert_eq!(got.sprites.len(), 3);
    let s40 = got
        .sprites
        .iter()
        .find(|s| s.hex_key == Some((4, 0)))
        .unwrap();
    assert!(!s40.visible);
    let s30 = got
        .sprites
        .iter()
        .find(|s| s.hex_key == Some((3, 0)))
        .unwrap();
    assert!(s30.visible);
}

/// Fog off: `ALL_KEYS`, `fogActive = false` (`main.ts:15445-15446`) — every
/// icon visible.
#[test]
fn worker_fields_without_fog_are_all_visible() {
    let map = view::overlay_map(&fixture_map());
    let got = view::worker_field_overlay(
        &map,
        &overlays().worker_fields,
        &viewer(false),
        &fog_sets(false),
        &MapUiState::WEB_INITIAL,
    )
    .unwrap();
    assert!(got.sprites.iter().all(|s| s.visible));
}

/// `Map.set` semantics of `workedByOwner`: a repeated hex keeps its first
/// position and takes the last owner.
#[test]
fn worked_by_owner_is_a_js_map() {
    let f = |q, r, o| vm::WorkerFieldDto {
        hex: hx(q, r),
        owner_id: o,
    };
    let got = view::worked_by_owner(&[
        f(1, 1, player(0)),
        f(2, 0, player(1)),
        f(1, 1, player(2)),
        f(0, 2, vm::OwnerRef::Barbarian),
    ]);
    assert_eq!(got, vec![((1, 1), 2.0), ((2, 0), 1.0), ((0, 2), -1.0)]);
}

/// Gate `!showWorkerOverlay || isCityPanelOpen()` (`main.ts:15434`), empty
/// map (`:15440`).
#[test]
fn worker_fields_gate() {
    let map = view::overlay_map(&fixture_map());
    let fields = overlays().worker_fields;
    let v = viewer(true);
    let fog = fog_sets(true);
    let off = ui_all_off();
    assert_eq!(
        view::worker_field_overlay(&map, &fields, &v, &fog, &off),
        None
    );
    let on = MapUiState {
        show_worker_overlay: true,
        ..off
    };
    assert!(view::worker_field_overlay(&map, &fields, &v, &fog, &on).is_some());
    let panel = MapUiState {
        is_city_panel_open: true,
        ..on
    };
    assert_eq!(
        view::worker_field_overlay(&map, &fields, &v, &fog, &panel),
        None
    );
    assert_eq!(view::worker_field_overlay(&map, &[], &v, &fog, &on), None);
}

// ------------------------------------------------------------ okolica

/// `syncCityOkolicaOverlay(scene, …, map, { cityQ, cityR, range, workedKeys,
/// yieldOf, showYields: true, ownerId: city.ownerId })` (`main.ts:6655-6665`)
/// with a literal `yieldOf`.
#[test]
fn okolica_matches_web_inputs() {
    let map = fixture_map();
    let okolica_map = view::okolica_map(&map, &fixture_state()).unwrap();
    let panel = MapUiState {
        is_city_panel_open: true,
        ..MapUiState::WEB_INITIAL
    };
    let dto = okolica_dto();
    let got = view::okolica_overlay(&okolica_map, Some(&dto), &panel)
        .unwrap()
        .unwrap();

    let y = |z: Option<f64>, p: Option<f64>, h: Option<f64>| TileYield {
        zywnosc: z,
        praca: p,
        handel: h,
    };
    let yield_of = |q: i32, r: i32| match (q, r) {
        (1, 1) => y(Some(2.0), None, None),
        (1, 2) => y(Some(1.0), Some(1.0), None),
        (2, 0) => y(Some(3.0), None, Some(1.0)),
        (2, 1) => y(Some(2.0), Some(2.0), Some(1.0)),
        (3, 0) => y(None, Some(2.0), None),
        (3, 1) => y(Some(1.0), None, None),
        _ => y(None, None, None),
    };
    let worked = keys(&[(2, 0), (1, 2)]);
    let want = build_city_okolica_overlay(
        &okolica_map,
        &CityOkolicaOverlayParams {
            city_q: 2,
            city_r: 1,
            range: 1.0,
            worked_keys: &worked,
            yield_of: &yield_of,
            show_yields: Some(true),
            owner_id: Some(0.0),
        },
    )
    .unwrap();
    assert_eq!(got, want);
    // Labels: (1,1) has a covering improvement, (2,2) an empty yield → no
    // label; the other five land hexes have one.
    let labels = got.yields.as_ref().unwrap();
    let hexes: Vec<HexKey> = labels.iter().map(|l| l.hex).collect();
    assert!(!hexes.contains(&(1, 1)));
    assert!(!hexes.contains(&(2, 2)));
    assert_eq!(labels.len(), 5);
}

/// `if (!isCityPanelOpen()) { dispose; return }` (`main.ts:6645`).
#[test]
fn okolica_gate_on_city_panel() {
    let map = fixture_map();
    let okolica_map = view::okolica_map(&map, &fixture_state()).unwrap();
    let dto = okolica_dto();
    let closed = MapUiState::WEB_INITIAL;
    assert_eq!(
        view::okolica_overlay(&okolica_map, Some(&dto), &closed).unwrap(),
        None
    );
    let open = MapUiState {
        is_city_panel_open: true,
        ..closed
    };
    assert!(view::okolica_overlay(&okolica_map, Some(&dto), &open)
        .unwrap()
        .is_some());
    assert_eq!(
        view::okolica_overlay(&okolica_map, None, &open).unwrap(),
        None
    );
}

#[test]
fn okolica_yield_table_must_cover_the_range_once() {
    let map = fixture_map();
    let okolica_map = view::okolica_map(&map, &fixture_state()).unwrap();
    let open = MapUiState {
        is_city_panel_open: true,
        ..MapUiState::WEB_INITIAL
    };
    let mut missing = okolica_dto();
    missing.yields.retain(|(h, _)| *h != hx(3, 1));
    assert_eq!(
        view::okolica_overlay(&okolica_map, Some(&missing), &open),
        Err(OverlayAdapterError::MissingYield { q: 3, r: 1 })
    );
    let mut dup = okolica_dto();
    let first = dup.yields[0];
    dup.yields.push(first);
    assert_eq!(
        view::okolica_overlay(&okolica_map, Some(&dup), &open),
        Err(OverlayAdapterError::DuplicateYield { q: 1, r: 1 })
    );
}

// ------------------------------------------------------------ mine layer

/// `buildRangeOverlayGroup(map, new Set(keys), { ...MINE_ELIGIBLE_STYLE,
/// tintOpacity: MINE_BUILD_HIGHLIGHT_OPACITY })` (`main.ts:15562-15565`); only
/// for the deposit-mine kind with hexes (`:16386-16390`, `:15561`).
#[test]
fn mine_layer_matches_web_inputs() {
    let map = view::overlay_map(&fixture_map());
    let bh = overlays().build_highlight;
    let got = view::mine_eligible_group(&map, &bh).unwrap();
    // `MINE_BUILD_HIGHLIGHT_OPACITY` = 0.3 × 1.2 (`render/buildHighlight.ts:9-10`).
    let style = RangeOverlayStyle {
        tint_opacity: 0.3 * 1.2,
        ..MINE_ELIGIBLE_STYLE
    };
    assert_eq!(view::MINE_LAYER_STYLE, style);
    let want = build_range_overlay_group_game(&map, &keys(&[(3, 0), (3, 1)]), &style);
    assert_eq!(got, want);

    for kind in [
        vm::BuildHighlightKind::FoundCity,
        vm::BuildHighlightKind::Wonder,
        vm::BuildHighlightKind::Improvement,
    ] {
        let other = vm::BuildHighlightDto {
            kind,
            hexes: bh.hexes.clone(),
        };
        assert_eq!(view::mine_eligible_group(&map, &other), None, "{kind:?}");
    }
    let empty = vm::BuildHighlightDto {
        kind: vm::BuildHighlightKind::Mine,
        hexes: Vec::new(),
    };
    assert_eq!(view::mine_eligible_group(&map, &empty), None);
}

// ------------------------------------------------------------ sieges

/// `refreshSiegeMarkers` (`main.ts:17492-17530`) by hand on the fixture:
/// - `campHexesByCity`: `7 → ["1,1","3,1","1,1"]`, `9 → ["3,1"]`;
/// - `machinesByCampHex` round-robin (`siegeCampSync.ts:14-27`): city 7
///   `taran→"1,1"`, `wieza→"3,1"`, `taran→"1,1"`; city 9 `wieza→"3,1"`;
///   joined (`[...prev, ...kinds]`, `:17511-17513`);
/// - `allCampOwners.set` (`:17514-17516`): `"1,1"→1`, `"3,1"→1` then `→2`
///   (last city wins, first position kept);
/// - `ownerColorById` starts with `[0, civColorFn(0)]` (`:17498`).
#[test]
fn siege_inputs_match_web_maps() {
    let got = view::siege_inputs(&sieges(), &owners()).unwrap();
    let s = |x: &str| x.to_owned();
    let want = view::SiegeInputs {
        ids: vec![s("7"), s("9")],
        positions: vec![(s("7"), (2.0, 1.0)), (s("9"), (3.0, 2.0))],
        options: SiegeMarkerSyncOptions {
            camp_hexes_by_city: vec![
                (s("7"), vec![s("1,1"), s("3,1"), s("1,1")]),
                (s("9"), vec![s("3,1")]),
            ],
            machines_by_camp_hex: vec![
                (
                    s("1,1"),
                    vec![SiegeMachineKind::Taran, SiegeMachineKind::Taran],
                ),
                (
                    s("3,1"),
                    vec![SiegeMachineKind::Wieza, SiegeMachineKind::Wieza],
                ),
            ],
            owner_color_by_id: vec![(0, VIEWER_COLOR), (1, P1_COLOR), (2, P2_COLOR)],
            camp_owner_by_hex: vec![(s("1,1"), 1), (s("3,1"), 2)],
        },
    };
    assert_eq!(got, want);
}

#[test]
fn siege_camp_owner_without_owner_entry_is_an_error() {
    let mut s = sieges();
    s[1].camp_hexes[0].owner_id = player(5);
    assert_eq!(
        view::siege_inputs(&s, &owners()),
        Err(OverlayAdapterError::MissingOwner { owner: 5 })
    );
}

/// `getTopY: (q, r) => unitRenderer.topYAt(q, r)` (`main.ts:17522`) =
/// `TerrainPickScene::top_y_at` of the Q2 picking scene: the camp group sits
/// at `topY(camp) + MARKER_LIFT * 0.5` (`siegeMarker.ts`, `siege.rs` `sync`).
#[test]
fn siege_sync_uses_the_picking_scene_top_y() {
    let map = fixture_map();
    let fog = fog_sets(false);
    let hexes = view::map_hexes(&map, &fixture_state(), &fog, &[], &[]).unwrap();
    let scene = build_terrain_pick_scene(&hexes, None, view::terrain_scene_options(&map, true));
    // (3,1) is a hill: its top differs from the meadow (1,1).
    let top_hill = scene.top_y_at(PickHex::new(3, 1));
    let top_meadow = scene.top_y_at(PickHex::new(1, 1));
    assert!(top_hill != top_meadow);

    let inputs = view::siege_inputs(&sieges(), &owners()).unwrap();
    let mut got = SiegeMarkerRenderer::new();
    inputs.sync(&mut got, &scene);

    let top_y = |q: f64, r: f64| {
        #[allow(clippy::cast_possible_truncation)]
        scene.top_y_at(PickHex::new(q as i32, r as i32))
    };
    let mut want = SiegeMarkerRenderer::new();
    want.sync(&inputs.ids, &inputs.positions, &top_y, &inputs.options);
    assert_eq!(got, want);

    // City 9 at (3,2): its single camp on the hill (3,1).
    let (id, marker) = &got.markers[1];
    assert_eq!(id, "9");
    let camp = marker.camp_groups[0];
    let root = marker.model.root();
    let (cx, cz) = axial_to_world(PickHex::new(3, 1), HEX_R);
    let (gx, gz) = axial_to_world(PickHex::new(3, 2), HEX_R);
    let p = marker.model.nodes[camp].position;
    assert_eq!(p.y, top_hill + MARKER_LIFT * 0.5);
    assert_eq!(p.x, cx - gx);
    assert_eq!(p.z, cz - gz);
    assert_eq!(marker.model.nodes[root].position.y, 0.0);
}

// ------------------------------------------------------------ all overlays

/// One `MapUiState` drives every gate of [`view::overlay_layers`].
#[test]
fn overlay_layers_single_ui_entry_point() {
    let map = fixture_map();
    let okolica_map = view::okolica_map(&map, &fixture_state()).unwrap();
    let v = viewer(true);
    let o = owners();
    let t = territory();
    let ov = overlays();
    let s = sieges();
    let fog = fog_sets(true);
    let input = view::OverlayLayersInput {
        map: &okolica_map,
        viewer: &v,
        owners: &o,
        territory: &t,
        overlays: &ov,
        sieges: &s,
        fog: &fog,
    };

    let start = view::overlay_layers(&input, &MapUiState::WEB_INITIAL).unwrap();
    assert!(start.territory.is_some());
    assert!(start.culture_range.is_some());
    assert!(start.religion_range.is_some());
    assert!(start.trade_routes.is_some());
    assert!(start.worker_fields.is_some());
    assert!(start.okolica.is_none(), "panel closed");
    assert!(start.mine_eligible.is_some());
    assert_eq!(start.sieges.ids.len(), 2);

    let off = view::overlay_layers(&input, &ui_all_off()).unwrap();
    assert!(off.territory.is_none());
    assert!(off.trade_routes.is_none());
    assert!(off.worker_fields.is_none());
    assert!(off.okolica.is_none());
    // Ranges, the mine layer and the siege markers have no switch of L4.
    assert!(off.culture_range.is_some());
    assert!(off.mine_eligible.is_some());
    assert_eq!(off.sieges, start.sieges);

    let panel = MapUiState {
        is_city_panel_open: true,
        ..ui_all_off()
    };
    let p = view::overlay_layers(&input, &panel).unwrap();
    assert!(p.territory.is_some());
    assert!(p.okolica.is_some());
    assert!(p.culture_range.is_none());
    assert!(p.religion_range.is_none());
    assert!(p.trade_routes.is_none());
    assert!(p.worker_fields.is_none());
}
