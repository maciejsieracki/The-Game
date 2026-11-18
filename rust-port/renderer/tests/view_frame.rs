//! R-RUSTPORT-P4-371-T1-FRAME-ADAPTER (#371, T1): the single entry point
//! `view::frame` — `MapViewDto` + `RenderLayersDto` + `MapUiState` +
//! `isSiegeMapPanelOpen()` → every adapter input ([`FrameInputs`]) → the CPU
//! state of the map renderer ([`MapScene::apply`]).
//!
//! The frame is a hand-built DTO (like `view_adapter_*`): a 4×2 map, the
//! viewer = player 1 under active fog, an own city in revolt, an enemy city
//! besieged by a player-1 unit, an enemy wonder, territory of both players,
//! a selected unit with its reachable range. Fog: column `q = 3` is only
//! explored (not visible).
//!
//! The reference renderer state is built by calling the existing adapters by
//! hand in the pin order (`gra/src/main.ts` @ `07d2fbd72`: load refresh
//! `:46138-46156`, `refreshFog` `:13475-13520`, `syncPlayerUnitSelectionOnMap`
//! `:7115-7135`, `refreshBuildHighlight` `:16351-16396`); [`MapScene::apply`]
//! must give exactly that state.

use std::collections::HashSet;

use civ_renderer::cities::RevoltRenderer;
use civ_renderer::map_units::{
    GeneralRingEntry, HighlightLayer, MapToken, MapUnitRenderer, PathRoute, SelectionMarker,
};
use civ_renderer::models::cities::renderer::SceneObject;
use civ_renderer::models::misc::siege::SiegeMarkerRenderer;
use civ_renderer::models::wonders::RenderedWonder;
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::terrain::{build_terrain, MapDetailQuality, TerrainScene};
use civ_renderer::view::{
    self, CityInputs, FogSets, FrameError, FrameInputs, HighlightSource, MapScene, MapStatic,
    MapUiState, OverlayLayers, OverlayLayersInput, UnitHighlight, UnitOverlayInputs,
    ViewAdapterError, WonderInputs,
};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

const W: u32 = 4;
const H: u32 = 2;
const DETAIL: MapDetailQuality = MapDetailQuality::High;

fn hx(q: i32, r: i32) -> vm::HexCoord {
    vm::HexCoord::new(q, r)
}

fn h(q: i32, r: i32) -> HexCoord {
    HexCoord::new(q, r)
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

fn uid(n: u64) -> vm::UnitId {
    vm::UnitId::try_new(n).unwrap()
}

fn cid(n: u64) -> vm::CityId {
    vm::CityId::try_new(n).unwrap()
}

/// r-major 4×2 map (`validate_map` order); (1,0) is a hill.
fn map() -> vm::MapViewDto {
    let mut hexes = Vec::new();
    for r in 0..H {
        for q in 0..W {
            let (q, r) = (i32::try_from(q).unwrap(), i32::try_from(r).unwrap());
            hexes.push(vm::HexStaticDto {
                coord: hx(q, r),
                teren_bazowy: if (q, r) == (1, 0) {
                    vm::Terrain::Wzgorza
                } else {
                    vm::Terrain::Rownina
                },
                rzeka_krawedzie: Vec::new(),
            });
        }
    }
    vm::MapViewDto {
        width: W,
        height: H,
        seed: 11.0,
        hexes,
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

fn hex_state(n: usize) -> Vec<vm::HexDynDto> {
    (0..n)
        .map(|_| vm::HexDynDto {
            nakladka: vm::Nakladka::Brak,
            ulepszenie: vm::Ulepszenie::Brak,
            ulepszenia: None,
            improvement_key: None,
            zloze: None,
            village_present: false,
            terraces: false,
            covering_improvement: false,
            road_mask: 0,
        })
        .collect()
}

/// Visible everywhere except column `q = 3` (explored only).
fn fog(n_hexes: usize) -> vm::FogViewDto {
    let m = map();
    vm::FogViewDto {
        state: m
            .hexes
            .iter()
            .take(n_hexes)
            .map(|hx| vm::FogState::from_code(if hx.coord.q == 3 { 1 } else { 2 }).unwrap())
            .collect(),
    }
}

fn owner(id: vm::OwnerRef, color: u32, rel: vm::RelationToViewer) -> vm::OwnerViewDto {
    vm::OwnerViewDto {
        owner_id: id,
        color,
        civ_icon_id: "x".to_owned(),
        bronze_civ: "egipt".to_owned(),
        era: 1.0,
        is_city_state: false,
        is_barbarian: false,
        ring_hex: None,
        display_name: None,
        map_outline_kind: None,
        capital_city_id: None,
        relation_to_viewer: rel,
    }
}

fn owners() -> Vec<vm::OwnerViewDto> {
    vec![
        owner(player(1), 0x0000_33cc, vm::RelationToViewer::Own),
        owner(player(2), 0x00cc_3300, vm::RelationToViewer::Wojna),
    ]
}

fn badge(name: &str) -> vm::CityBadgeDto {
    vm::CityBadgeDto {
        city_name: name.to_owned(),
        population: 3.0,
        defense_tier: 0,
        civ_icon_id: "x".to_owned(),
        owner_color: 0x0000_33cc,
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
        era: 1.0,
        is_capital: false,
    }
}

/// City 7: own, in revolt, on (0,0). City 9: enemy, besieged, on the explored
/// hex (3,1); its `fog_visible` is `true` = a stale `_visCache`
/// (`main.ts:2975`, `:13082-13086`), which the later
/// `cityRenderer.applyFogVisibility(vis, …)` of `refreshFog` overrides.
fn cities() -> Vec<vm::CityViewDto> {
    let city = |id, o, q, r, revolt, besieged| vm::CityViewDto {
        id: cid(id),
        owner_id: o,
        hex: hx(q, r),
        population: 3.0,
        level: 2.0,
        wall_kind: vm::WallKind::None,
        revolt,
        besieged,
        fog_visible: true,
        unit_count_on_hex: 0,
        badge: badge("m"),
    };
    vec![
        city(7, player(1), 0, 0, true, false),
        city(9, player(2), 3, 1, false, true),
    ]
}

fn unit(id: u64, owner: vm::OwnerRef, q: i32, r: i32) -> vm::UnitViewDto {
    vm::UnitViewDto {
        id: uid(id),
        owner_id: owner,
        type_id: "Wojownik".to_owned(),
        category: "maczuga".to_owned(),
        hex: hx(q, r),
        ruch_max: 2.0,
        ruch_left: 2.0,
        hp: 10.0,
        hp_max: Some(10.0),
        embarked: false,
        in_garnizon: false,
        is_general: false,
        veteran_stars: 0,
        armor_badge_level: 0,
        soft_badge_level: 0,
        dimmed: false,
    }
}

/// Unit 900 of the viewer besieges city 9 from (2,1); unit 901 of player 2
/// stands on (2,0).
fn units() -> Vec<vm::UnitViewDto> {
    vec![unit(900, player(1), 2, 1), unit(901, player(2), 2, 0)]
}

fn stacks() -> vm::StackViewDto {
    vm::StackViewDto {
        visible_ids: vec![uid(900), uid(901)],
        badge_by_rep_id: Vec::new(),
        starving_rep_ids: Vec::new(),
        gold_deficit_rep_ids: Vec::new(),
        vitals_by_rep_id: Vec::new(),
    }
}

fn sieges() -> Vec<vm::SiegeViewDto> {
    vec![vm::SiegeViewDto {
        city_id: cid(9),
        city_hex: hx(3, 1),
        camp_hexes: vec![vm::overlays::SiegeCampDto {
            hex: hx(2, 1),
            owner_id: player(1),
        }],
        ready_machines: Vec::new(),
    }]
}

/// Enemy wonder on the explored hex (3,0).
fn wonders() -> Vec<vm::PlacedWonderDto> {
    vec![vm::PlacedWonderDto {
        wonder_id: "piramidy".to_owned(),
        hex: hx(3, 0),
        owner_id: player(2),
        ruin: false,
    }]
}

fn territory() -> vm::TerritoryViewDto {
    vm::TerritoryViewDto {
        by_owner: vec![
            vm::OwnerHexesDto {
                owner_id: player(1),
                hexes: vec![hx(0, 0), hx(1, 0), hx(0, 1)],
            },
            vm::OwnerHexesDto {
                owner_id: player(2),
                hexes: vec![hx(3, 0), hx(3, 1)],
            },
        ],
    }
}

fn overlays() -> vm::OverlaysViewDto {
    vm::OverlaysViewDto {
        culture_range: None,
        religion_range: None,
        trade_routes: Vec::new(),
        okolica: None,
        worker_fields: Vec::new(),
        reachable: vec![hx(1, 1), hx(2, 0)],
        build_highlight: vm::BuildHighlightDto {
            kind: vm::BuildHighlightKind::Improvement,
            hexes: Vec::new(),
        },
        selection: Some(vm::SelectionDto {
            hex: hx(2, 1),
            owner_id: player(1),
        }),
        path_route: None,
    }
}

fn viewer() -> vm::ViewerDto {
    vm::ViewerDto {
        owner_id: player(1),
        fog_active: true,
    }
}

fn layers() -> vm::RenderLayersDto {
    let n = map().hexes.len();
    vm::RenderLayersDto {
        contract_version: vm::CONTRACT_VERSION,
        viewer: viewer(),
        turn: 5,
        hex_state: hex_state(n),
        fog: fog(n),
        owners: owners(),
        cities: cities(),
        units: units(),
        stacks: stacks(),
        sieges: sieges(),
        wonders: wonders(),
        territory: territory(),
        overlays: overlays(),
        battle: None,
    }
}

const UI: MapUiState = MapUiState::WEB_INITIAL;

fn statik() -> MapStatic {
    MapStatic::from_dto(&map()).unwrap()
}

fn frame(l: &vm::RenderLayersDto, siege_open: bool) -> FrameInputs {
    FrameInputs::from_dto(&statik(), l, &UI, siege_open).unwrap()
}

fn applied(siege_open: bool) -> MapScene {
    let st = statik();
    let f = frame(&layers(), siege_open);
    let mut scene = MapScene::new(&st, &f, DETAIL);
    scene.apply(&f).unwrap();
    scene
}

// ------------------------------------------------------------ snapshot

/// Every observable part of the renderer state.
#[derive(Debug, PartialEq)]
struct Snap {
    terrain: TerrainScene,
    ocean: bool,
    cities: Vec<SceneObject>,
    revolt: RevoltRenderer,
    wonders: Vec<RenderedWonder>,
    token_ids: Vec<String>,
    tokens: Vec<MapToken>,
    rings: Vec<(String, GeneralRingEntry)>,
    highlight: Option<HighlightLayer>,
    selection: Option<SelectionMarker>,
    route: Option<PathRoute>,
    sieges: SiegeMarkerRenderer,
    overlays: Option<OverlayLayers>,
}

#[allow(clippy::too_many_arguments)]
fn snap_parts(
    terrain: &TerrainScene,
    ocean: bool,
    cities: &civ_renderer::models::cities::renderer::CityRenderer,
    revolt: &RevoltRenderer,
    wonders: &civ_renderer::models::wonders::WonderRenderer,
    units: &MapUnitRenderer,
    sieges: &SiegeMarkerRenderer,
    overlays: Option<&OverlayLayers>,
) -> Snap {
    Snap {
        terrain: terrain.clone(),
        ocean,
        cities: cities.scene().to_vec(),
        revolt: revolt.clone(),
        wonders: wonders.wonders().to_vec(),
        token_ids: units.token_ids().to_vec(),
        tokens: units.tokens().cloned().collect(),
        rings: units.general_rings().to_vec(),
        highlight: units.highlight().cloned(),
        selection: units.selection().cloned(),
        route: units.path_route().cloned(),
        sieges: sieges.clone(),
        overlays: overlays.cloned(),
    }
}

fn snap(s: &MapScene) -> Snap {
    snap_parts(
        s.terrain(),
        s.show_ocean_backdrop(),
        s.cities(),
        s.revolt(),
        s.wonders(),
        s.units(),
        s.sieges(),
        s.overlays(),
    )
}

/// The pin sequence, written out by hand with the existing adapters only.
fn manual_web_sequence(siege_open: bool) -> Snap {
    let m = map();
    let l = layers();
    let ui = UI;
    // buildScene + renderer constructors.
    let mut terrain = build_terrain(&view::terrain_data(&m, &l.hex_state).unwrap().input(DETAIL));
    let mut cities = view::city_renderer(&m);
    let mut revolt = RevoltRenderer::new();
    let mut wonders = view::wonder_renderer(&m);
    let mut units = MapUnitRenderer::new(
        m.hexes
            .iter()
            .map(|x| (view::pick_hex(x.coord), view::terrain(x.teren_bazowy))),
    );
    let mut sieges = SiegeMarkerRenderer::default();
    let fog = FogSets::from_dto(&m, &l.fog, l.viewer.fog_active).unwrap();
    // syncWonderRender (`main.ts:46139`).
    WonderInputs::from_dto(&l.owners, &l.wonders)
        .unwrap()
        .sync(&mut wonders);
    // syncUnitsRender (`:46142`, `:14550-14553`).
    units.set_city_hex_keys(l.cities.iter().map(|c| view::pick_hex(c.hex)).collect());
    view::sync_units(&mut units, &l.units, &l.stacks, &ui).unwrap();
    // cityRenderer.sync (`:46143`).
    CityInputs::from_dto(&l.owners, &l.cities)
        .unwrap()
        .sync_with_revolt(&mut cities, &mut revolt);
    let okolica = view::okolica_map(&m, &l.hex_state).unwrap();
    let ov = view::overlay_layers(
        &OverlayLayersInput {
            map: &okolica,
            viewer: &l.viewer,
            owners: &l.owners,
            territory: &l.territory,
            overlays: &l.overlays,
            sieges: &l.sieges,
            fog: &fog,
        },
        &ui,
    )
    .unwrap();
    // refreshSiegeMarkers (`:46151`), getTopY = unitRenderer.topYAt.
    #[allow(clippy::cast_possible_truncation)]
    let top = |q: f64, r: f64| units.top_y_at(HexCoord::new(q as i32, r as i32));
    sieges.sync(
        &ov.sieges.ids,
        &ov.sieges.positions,
        &top,
        &ov.sieges.options,
    );
    // refreshFog (`:46152`).
    let ocean = view::apply_terrain_fog(&mut terrain, &fog, false);
    view::apply_city_fog(&mut cities, &fog, &l.viewer).unwrap();
    view::apply_wonder_fog(&mut wonders, &fog);
    // syncPlayerUnitSelectionOnMap + refreshBuildHighlight.
    let unit_calls =
        UnitOverlayInputs::from_overlays(&l.overlays).with_siege_map_panel_open(siege_open);
    unit_calls.apply(&mut units);
    let mut ov = ov;
    ov.units = unit_calls;
    snap_parts(
        &terrain,
        ocean,
        &cities,
        &revolt,
        &wonders,
        &units,
        &sieges,
        Some(&ov),
    )
}

fn city_visible(s: &MapScene, id: &str) -> bool {
    s.cities().city(id).unwrap().visible()
}

// ------------------------------------------------------------ inputs

/// One frame with a city, a unit, a siege and fog gives every adapter input.
#[test]
fn frame_inputs_hold_every_adapter_input() {
    let f = frame(&layers(), false);
    assert_eq!(f.turn, 5);
    assert_eq!(f.viewer, viewer());
    assert!(!f.land_reveal);
    // terrain_data: every hex, map seed.
    assert_eq!(f.terrain.hexes.len(), 8);
    assert_eq!(f.terrain.seed, 11);
    // FogSets: column q = 3 explored only.
    assert!(f.fog.fog_on);
    assert!(!f.fog.visible.contains(&h(3, 1)));
    assert!(f.fog.explored.contains(&h(3, 1)));
    assert_eq!(f.fog.visible.len(), 6);
    // CityInputs / WonderInputs.
    let ids: Vec<&str> = f.cities.cities.iter().map(|c| c.id.as_str()).collect();
    assert_eq!(ids, ["7", "9"]);
    assert_eq!(f.wonders.placed.len(), 1);
    // overlay_layers: territory, siege of city 9, no worker field / trade group.
    assert!(f.overlays.territory.is_some());
    assert!(f.overlays.trade_routes.is_none());
    assert_eq!(f.overlays.sieges.ids, ["9".to_owned()]);
    // Units and the Q6 calls.
    assert_eq!(f.units.len(), 2);
    assert_eq!(f.stacks, stacks());
    assert_eq!(f.city_hexes, HashSet::from([h(0, 0), h(3, 1)]));
    assert_eq!(f.overlays.units.selection, Some((h(2, 1), 1)));
    assert!(matches!(
        f.overlays.units.highlight,
        UnitHighlight::Set {
            source: HighlightSource::Reachable,
            ..
        }
    ));
}

#[test]
fn wrong_hex_state_length_is_an_error() {
    let mut l = layers();
    l.hex_state.pop();
    assert_eq!(
        FrameInputs::from_dto(&statik(), &l, &UI, false),
        Err(FrameError::View(ViewAdapterError::LengthMismatch {
            field: "hex_state",
            expected: 8,
            actual: 7,
        }))
    );
}

#[test]
fn wrong_fog_state_length_is_an_error() {
    let mut l = layers();
    l.fog = fog(5);
    assert_eq!(
        FrameInputs::from_dto(&statik(), &l, &UI, false),
        Err(FrameError::View(ViewAdapterError::LengthMismatch {
            field: "fog.state",
            expected: 8,
            actual: 5,
        }))
    );
}

/// `contract_version` must be exactly `CONTRACT_VERSION` = 2 (both sides
/// rejected, the current value accepted).
#[test]
fn contract_version_other_than_2_is_an_error() {
    assert_eq!(vm::CONTRACT_VERSION, 2);
    for v in [0_u16, 1, 3, u16::MAX] {
        let mut l = layers();
        l.contract_version = v;
        assert_eq!(
            FrameInputs::from_dto(&statik(), &l, &UI, false),
            Err(FrameError::ContractVersion {
                expected: 2,
                actual: v
            }),
            "version {v}"
        );
    }
    let mut l = layers();
    l.contract_version = 2;
    assert!(FrameInputs::from_dto(&statik(), &l, &UI, false).is_ok());
}

/// The contract version is checked before any adapter.
#[test]
fn contract_version_is_checked_first() {
    let mut l = layers();
    l.contract_version = 1;
    l.hex_state.pop();
    assert!(matches!(
        FrameInputs::from_dto(&statik(), &l, &UI, false),
        Err(FrameError::ContractVersion { actual: 1, .. })
    ));
}

#[test]
fn invalid_static_map_is_an_error() {
    let mut m = map();
    m.hexes.swap(0, 1);
    assert!(matches!(MapStatic::from_dto(&m), Err(FrameError::Map(_))));
}

#[test]
fn adapter_errors_are_passed_on() {
    let mut l = layers();
    l.owners.pop();
    assert!(matches!(
        FrameInputs::from_dto(&statik(), &l, &UI, false),
        Err(FrameError::City(_))
    ));
}

// ------------------------------------------------------------ order

/// `MapScene::apply` = the adapters called by hand in the pin order.
#[test]
fn apply_matches_the_web_call_sequence() {
    assert_eq!(snap(&applied(false)), manual_web_sequence(false));
    assert_eq!(snap(&applied(true)), manual_web_sequence(true));
}

/// `applyFogVisibility` after `sync` (`main.ts:46143` then `:13503`): the
/// enemy city on an explored-only hex is hidden although its (stale)
/// `fog_visible` is `true`; the own city stays visible. Detects a fog call
/// before the city sync and a missing `apply_city_fog`.
#[test]
fn city_fog_comes_after_city_sync() {
    let s = applied(false);
    assert!(city_visible(&s, "7"));
    assert!(!city_visible(&s, "9"));
}

/// `wonderRenderer.applyFogVisibility` after `wonderRenderer.sync`: a wonder
/// on an explored-only hex is hidden.
#[test]
fn wonder_fog_comes_after_wonder_sync() {
    let s = applied(false);
    let w = &s.wonders().wonders()[0];
    assert_eq!(w.key, "piramidy@3,0");
    assert!(!w.visible());
}

/// R6: the revolt sprite of city 7 exists (revolt after city sync).
#[test]
fn revolt_sprite_follows_city_sync() {
    let s = applied(false);
    assert!(s.revolt().sprite("7").is_some());
    assert!(s.revolt().sprite("9").is_none());
}

/// `refreshSiegeMarkers`: one marker for the besieged city.
#[test]
fn siege_marker_of_the_besieged_city() {
    let s = applied(false);
    let ids: Vec<&str> = s.sieges().markers.iter().map(|(k, _)| k.as_str()).collect();
    assert_eq!(ids, ["9"]);
}

/// `syncPlayerUnitSelectionOnMap` (`main.ts:7119-7125`): ring + reachable.
/// With the siege map panel open (`:7120-7122`) the reachable layer is
/// cleared, the ring stays.
#[test]
fn siege_map_panel_gate_is_applied() {
    let closed = applied(false);
    assert!(closed.units().highlight().is_some());
    assert!(closed.units().selection().is_some());
    let open = applied(true);
    assert!(open.units().highlight().is_none());
    assert!(open.units().selection().is_some());
    assert_eq!(
        frame(&layers(), true).overlays.units.highlight,
        UnitHighlight::Clear
    );
}

/// Unit tokens of the frame.
#[test]
fn unit_tokens_are_synced() {
    let s = applied(false);
    assert_eq!(s.units().token_ids(), ["900".to_owned(), "901".to_owned()]);
}

/// `unitRenderer.setCityHexKeys(cities)` (`main.ts:14551`) before the unit
/// sync: a token on a city hex is lifted and offset (`render/units.ts:5982-5997`).
#[test]
fn city_hex_keys_reach_the_unit_renderer() {
    let s = applied(false);
    let plain = statik().unit_renderer();
    assert_ne!(
        s.units().token_placement(h(0, 0)),
        plain.token_placement(h(0, 0))
    );
    assert_ne!(
        s.units().token_placement(h(3, 1)),
        plain.token_placement(h(3, 1))
    );
    assert_eq!(
        s.units().token_placement(h(2, 1)),
        plain.token_placement(h(2, 1))
    );
}

/// The fog of the terrain is applied: an explored-only prism is not hidden,
/// nothing is unexplored, so the ocean backdrop shows (`scene.ts:3548`).
#[test]
fn terrain_fog_is_applied() {
    let s = applied(false);
    assert!(s.show_ocean_backdrop());
    let mut fresh = build_terrain(
        &view::terrain_data(&map(), &layers().hex_state)
            .unwrap()
            .input(DETAIL),
    );
    assert_ne!(
        s.terrain(),
        &fresh,
        "setFog changed the prisms of the explored column"
    );
    let fog = FogSets::from_dto(&map(), &layers().fog, true).unwrap();
    view::apply_terrain_fog(&mut fresh, &fog, false);
    assert_eq!(s.terrain(), &fresh);
}

// ------------------------------------------------------------ idempotence

/// The pin calls `refreshFog()` from ~69 places: applying the same frame
/// again must not change the state.
#[test]
fn apply_is_idempotent() {
    let st = statik();
    let f = frame(&layers(), false);
    let mut s = MapScene::new(&st, &f, DETAIL);
    s.apply(&f).unwrap();
    let once = snap(&s);
    s.apply(&f).unwrap();
    assert_eq!(snap(&s), once);
    s.apply(&f).unwrap();
    assert_eq!(snap(&s), once);
}

/// A later frame replaces the state: city 9 becomes visible when its hex is.
#[test]
fn next_frame_updates_the_state() {
    let st = statik();
    let f1 = frame(&layers(), false);
    let mut s = MapScene::new(&st, &f1, DETAIL);
    s.apply(&f1).unwrap();
    assert!(!city_visible(&s, "9"));
    let mut l2 = layers();
    l2.fog = vm::FogViewDto {
        state: vec![vm::FogState::from_code(2).unwrap(); 8],
    };
    l2.cities[0].revolt = false;
    let f2 = frame(&l2, false);
    s.apply(&f2).unwrap();
    assert!(city_visible(&s, "9"));
    assert!(s.revolt().sprite("7").is_none());
    // And back: the same state as a scene that only saw frame 1 twice.
    s.apply(&f1).unwrap();
    assert!(!city_visible(&s, "9"));
    assert!(s.revolt().sprite("7").is_some());
}
