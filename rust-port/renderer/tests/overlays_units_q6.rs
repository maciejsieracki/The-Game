//! R-RUSTPORT-P4-1G-Q6-UNITS-R1 (PRIO-3D-2): the unit part of the view
//! adapter (`renderer::view::units`) through the single overlays entry point
//! [`view::overlay_layers`], then applied to [`MapUnitRenderer`].
//!
//! The DTO values are the ones the engine producer computes for the same
//! scenario (`engine/src/domain/overlays_view.rs`, test
//! `q6_agregator_wola_zasieg_trase_zaznaczenie_i_budowe`, vectors R1/P1 of
//! `engine/tests/view_overlays_reach_path.rs`): corridor `q = 0..5`, `r = 0`,
//! the selected unit 900 of player 1 on (0,0) with 3 movement points, an own
//! unit on (1,0), a planned march to (5,0):
//! - `reachable` = [(2,0), (3,0), (1,0)] (`main.ts:14706-14731`);
//! - `path_route` = hexes (0..5, 0), `turnStops` [(3,0) t1, (5,0) t2]
//!   (`planned-march.ts:241-268`);
//! - `selection` = (0,0), player 1 (`main.ts:7119`).
//!
//! The renderer has no engine dependency (D-DTO-1 = A), so the hand-off is the
//! DTO literal. Every expected renderer state is built by calling the
//! renderer the way the pin calls it (`syncPlayerUnitSelectionOnMap`,
//! `main.ts:7115-7134`; `refreshBuildHighlight`, `:16351-16396`;
//! `refreshPlannedMarchPreview`, `:31146-31179`).

use civ_renderer::map_units::consts::{HIGHLIGHT_OPACITY, IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY};
use civ_renderer::map_units::{MapUnitRenderer, PathRouteOptions, TurnStop};
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::view::units::HighlightPriority;
use civ_renderer::view::{
    self, FogSets, HighlightSource, MapUiState, OverlayLayers, UnitHighlight, UnitOverlayInputs,
};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

const N: u32 = 6;

fn hx(q: i32) -> vm::HexCoord {
    vm::HexCoord::new(q, 0)
}

fn h(q: i32) -> HexCoord {
    HexCoord::new(q, 0)
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

fn map() -> vm::MapViewDto {
    vm::MapViewDto {
        width: N,
        height: 1,
        seed: 7.0,
        hexes: (0..N)
            .map(|q| vm::HexStaticDto {
                coord: hx(i32::try_from(q).unwrap()),
                teren_bazowy: vm::Terrain::Rownina,
                rzeka_krawedzie: Vec::new(),
            })
            .collect(),
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

fn hex_state() -> Vec<vm::HexDynDto> {
    (0..N)
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

fn fog() -> FogSets {
    let dto = vm::FogViewDto {
        state: (0..N)
            .map(|_| vm::FogState::from_code(2).unwrap())
            .collect(),
    };
    FogSets::from_dto(&map(), &dto, false).unwrap()
}

/// The producer's reachable range (vector R1).
fn reachable() -> Vec<vm::HexCoord> {
    vec![hx(2), hx(3), hx(1)]
}

/// The producer's route (vector P1 with 3 movement points).
fn route() -> vm::overlays::PathRouteDto {
    vm::overlays::PathRouteDto {
        hexes: (0..6).map(hx).collect(),
        turn_stops: vec![
            vm::overlays::PathTurnStopDto {
                hex: hx(3),
                turn: 1,
            },
            vm::overlays::PathTurnStopDto {
                hex: hx(5),
                turn: 2,
            },
        ],
    }
}

fn no_build() -> vm::BuildHighlightDto {
    vm::BuildHighlightDto {
        kind: vm::BuildHighlightKind::Improvement,
        hexes: Vec::new(),
    }
}

fn overlays(build: vm::BuildHighlightDto) -> vm::OverlaysViewDto {
    vm::OverlaysViewDto {
        culture_range: None,
        religion_range: None,
        trade_routes: Vec::new(),
        okolica: None,
        worker_fields: Vec::new(),
        reachable: reachable(),
        build_highlight: build,
        selection: Some(vm::SelectionDto {
            hex: hx(0),
            owner_id: player(1),
        }),
        path_route: Some(route()),
    }
}

/// `PlayableState` → DTO (engine) → [`view::overlay_layers`].
fn layers(ov: &vm::OverlaysViewDto) -> OverlayLayers {
    let m = map();
    let okolica_map = view::okolica_map(&m, &hex_state()).unwrap();
    let viewer = vm::ViewerDto {
        owner_id: player(1),
        fog_active: false,
    };
    let territory = vm::TerritoryViewDto {
        by_owner: Vec::new(),
    };
    let fog = fog();
    let input = view::OverlayLayersInput {
        map: &okolica_map,
        viewer: &viewer,
        owners: &[],
        territory: &territory,
        overlays: ov,
        sieges: &[],
        fog: &fog,
    };
    view::overlay_layers(&input, &MapUiState::WEB_INITIAL).unwrap()
}

fn renderer() -> MapUnitRenderer {
    MapUnitRenderer::new((0..6).map(|q| (h(q), Terrain::Rownina)))
}

fn pin_turn_stops() -> PathRouteOptions {
    PathRouteOptions {
        turn_label: None,
        turn_stops: vec![
            TurnStop { hex: h(3), turn: 1 },
            TurnStop { hex: h(5), turn: 2 },
        ],
    }
}

// ------------------------------------------------------------ reachable, selection, route

/// `overlay_layers` carries the unit calls: `setSelectionHex(0, 0, 1)`,
/// `setHighlight(reachable)` with the default opacity, `setPathRoute(
/// [start, ...fullPath], { turnStops })`.
#[test]
fn q6_overlay_layers_carry_reachable_selection_and_route() {
    let l = layers(&overlays(no_build()));
    assert_eq!(
        l.units.highlight,
        UnitHighlight::Set {
            source: HighlightSource::Reachable,
            hexes: vec![h(2), h(3), h(1)],
            opacity: HIGHLIGHT_OPACITY,
        }
    );
    assert_eq!(l.units.selection, Some((h(0), 1)));
    let (hexes, opts) = l.units.path_route.clone().expect("route");
    assert_eq!(hexes, (0..6).map(h).collect::<Vec<_>>());
    assert_eq!(opts, pin_turn_stops());
    assert!(l.mine_eligible.is_none());
}

/// The adapter drives [`MapUnitRenderer`] into exactly the state of the pin
/// calls; the route labels are the turn numbers of the stops
/// (`units.ts:6666-6674`).
#[test]
fn q6_apply_matches_pin_calls_on_the_unit_renderer() {
    let l = layers(&overlays(no_build()));
    let mut got = renderer();
    l.units.apply(&mut got);

    let mut want = renderer();
    want.set_selection_hex(h(0), 1);
    want.set_highlight_default(&[h(2), h(3), h(1)]);
    want.set_path_route(&(0..6).map(h).collect::<Vec<_>>(), &pin_turn_stops());

    assert_eq!(got.selection(), want.selection());
    assert_eq!(got.highlight(), want.highlight());
    assert_eq!(got.path_route(), want.path_route());
    assert_eq!(got.highlight().unwrap().disc_count(), 3);
    // Absolute values, independent of the reference calls above (defence r1,
    // objection 5): the R1 hexes in DTO order and the pin default opacity.
    assert_eq!(got.highlight().unwrap().hexes, vec![h(2), h(3), h(1)]);
    assert_eq!(got.highlight().unwrap().opacity, HIGHLIGHT_OPACITY);
    let labels: Vec<&str> = got
        .path_route()
        .unwrap()
        .labels
        .iter()
        .map(|l| l.text.as_str())
        .collect();
    assert_eq!(labels, ["1", "2"]);
}

/// No selection, no range, no route: the next snapshot clears the ring, the
/// discs and the route (`clearSelectionHex`, `clearHighlight`,
/// `clearPathRoute`).
#[test]
fn q6_empty_unit_fields_clear_the_previous_snapshot() {
    let mut r = renderer();
    layers(&overlays(no_build())).units.apply(&mut r);
    assert!(r.selection().is_some() && r.highlight().is_some() && r.path_route().is_some());

    let mut empty = overlays(no_build());
    empty.reachable.clear();
    empty.selection = None;
    empty.path_route = None;
    let l = layers(&empty);
    assert_eq!(l.units.highlight, UnitHighlight::Clear);
    l.units.apply(&mut r);
    assert!(r.selection().is_none());
    assert!(r.highlight().is_none());
    assert!(r.path_route().is_none());
}

// ------------------------------------------------------------ build highlight (4 kinds)

fn build(kind: vm::BuildHighlightKind, qs: &[i32]) -> vm::BuildHighlightDto {
    vm::BuildHighlightDto {
        kind,
        hexes: qs.iter().map(|&q| hx(q)).collect(),
    }
}

/// `refreshBuildHighlight` (`main.ts:16351-16396`), one layer: found city and
/// wonder → default opacity (`:16360`, `:16366`), improvement →
/// `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY` (`:16392-16395`), deposit mine →
/// `clearHighlight()` plus the mine layer (`:16386-16390`). A build layer
/// replaces the reachable range (decision Q6-2).
#[test]
fn q6_build_highlight_four_kinds() {
    let found = layers(&overlays(build(vm::BuildHighlightKind::FoundCity, &[0, 2])));
    assert_eq!(
        found.units.highlight,
        UnitHighlight::Set {
            source: HighlightSource::Build(vm::BuildHighlightKind::FoundCity),
            hexes: vec![h(0), h(2)],
            opacity: HIGHLIGHT_OPACITY,
        }
    );
    let wonder = layers(&overlays(build(vm::BuildHighlightKind::Wonder, &[2])));
    assert_eq!(
        wonder.units.highlight,
        UnitHighlight::Set {
            source: HighlightSource::Build(vm::BuildHighlightKind::Wonder),
            hexes: vec![h(2)],
            opacity: HIGHLIGHT_OPACITY,
        }
    );
    let farm = layers(&overlays(build(
        vm::BuildHighlightKind::Improvement,
        &[1, 2],
    )));
    assert_eq!(
        farm.units.highlight,
        UnitHighlight::Set {
            source: HighlightSource::Build(vm::BuildHighlightKind::Improvement),
            hexes: vec![h(1), h(2)],
            opacity: IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,
        }
    );
    assert!(farm.mine_eligible.is_none());
    let mine = layers(&overlays(build(vm::BuildHighlightKind::Mine, &[4])));
    assert_eq!(mine.units.highlight, UnitHighlight::Clear);
    assert!(mine.mine_eligible.is_some(), "mine layer of Q5");

    // The opacities reach the renderer.
    let mut r = renderer();
    farm.units.apply(&mut r);
    assert_eq!(
        r.highlight().unwrap().opacity,
        IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY
    );
    found.units.apply(&mut r);
    assert_eq!(r.highlight().unwrap().opacity, HIGHLIGHT_OPACITY);
    assert_eq!(r.highlight().unwrap().hexes, vec![h(0), h(2)]);
    mine.units.apply(&mut r);
    assert!(r.highlight().is_none());
}

/// `isSiegeMapPanelOpen()` (`main.ts:7120-7122`) clears the reachable range
/// only; a build layer comes from `refreshBuildHighlight` and stays.
#[test]
fn q6_siege_map_panel_clears_reachable_only() {
    let reach = UnitOverlayInputs::from_overlays(&overlays(no_build()));
    assert_eq!(
        reach.clone().with_siege_map_panel_open(true).highlight,
        UnitHighlight::Clear
    );
    assert_eq!(reach.clone().with_siege_map_panel_open(false), reach);
    let found =
        UnitOverlayInputs::from_overlays(&overlays(build(vm::BuildHighlightKind::FoundCity, &[0])));
    assert_eq!(found.clone().with_siege_map_panel_open(true), found);
}

// ------------------------------------------------------------ units and stacks

fn unit(id: u64, q: i32) -> vm::UnitViewDto {
    vm::UnitViewDto {
        id: vm::UnitId::try_new(id).unwrap(),
        owner_id: player(1),
        type_id: "Wojownik".to_owned(),
        category: "maczuga".to_owned(),
        hex: hx(q),
        ruch_max: 3.0,
        ruch_left: 3.0,
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

/// `units[]` + `stacks` → `unitRenderer.sync` (`units.ts:6095-6263`), with
/// `setForceVisibleUnitId` from the UI state (`main.ts:14550`): the same
/// tokens as the direct call.
#[test]
fn q6_sync_units_matches_direct_sync() {
    let units = vec![unit(900, 0), unit(901, 1)];
    let stacks = vm::StackViewDto {
        visible_ids: vec![units[0].id, units[1].id],
        badge_by_rep_id: Vec::new(),
        starving_rep_ids: Vec::new(),
        gold_deficit_rep_ids: Vec::new(),
        vitals_by_rep_id: Vec::new(),
    };
    let ui = MapUiState {
        force_visible_unit_id: Some(units[1].id),
        ..MapUiState::WEB_INITIAL
    };
    let mut got = renderer();
    view::sync_units(&mut got, &units, &stacks, &ui).unwrap();

    let mut want = renderer();
    want.set_force_visible_unit_id(Some("901".to_owned()));
    want.sync(&units, Some(&stacks)).unwrap();

    assert_eq!(got.token_count(), 2);
    assert_eq!(got.token_ids(), want.token_ids());
    for id in ["900", "901"] {
        assert_eq!(got.token(id), want.token(id), "token {id}");
    }
}

// ------------------------------------------------------------ D-371-5b (#371 T5b)

/// One frame of the re-selection branch of the engine (T5a, D-OP-8): both
/// layers at once.
fn both(kind: vm::BuildHighlightKind, qs: &[i32]) -> vm::OverlaysViewDto {
    overlays(build(kind, qs))
}

fn reach_set() -> UnitHighlight {
    UnitHighlight::Set {
        source: HighlightSource::Reachable,
        hexes: vec![h(2), h(3), h(1)],
        opacity: HIGHLIGHT_OPACITY,
    }
}

fn farm_set() -> UnitHighlight {
    UnitHighlight::Set {
        source: HighlightSource::Build(vm::BuildHighlightKind::Improvement),
        hexes: vec![h(4), h(5)],
        opacity: IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY,
    }
}

/// The default priority is Q6-2 byte for byte: `from_overlays` ==
/// `from_overlays_with_priority(Build)` and `HighlightPriority::default()`
/// is `Build`.
#[test]
fn t5b_default_priority_is_q6_2() {
    assert_eq!(HighlightPriority::default(), HighlightPriority::Build);
    for ov in [
        overlays(no_build()),
        both(vm::BuildHighlightKind::Improvement, &[4, 5]),
        both(vm::BuildHighlightKind::Mine, &[4]),
        both(vm::BuildHighlightKind::FoundCity, &[0]),
    ] {
        assert_eq!(
            UnitOverlayInputs::from_overlays(&ov),
            UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Build)
        );
        assert_eq!(
            UnitOverlayInputs::from_overlays(&ov).highlight,
            view::unit_highlight(&ov, false, HighlightPriority::Build)
        );
    }
}

/// `refreshBuildHighlight` wrote last (`main.ts:16351-16396`): the build layer
/// wins over a non-empty `reachable` (mutant b: constant Reachable).
#[test]
fn t5b_build_writer_shows_the_build_layer() {
    let ov = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    assert_eq!(
        view::unit_highlight(&ov, false, HighlightPriority::Build),
        farm_set()
    );
    // Deposit mine: `clearHighlight()` (the mine layer is Q5).
    let mine = both(vm::BuildHighlightKind::Mine, &[4]);
    assert_eq!(
        view::unit_highlight(&mine, false, HighlightPriority::Build),
        UnitHighlight::Clear
    );
}

/// `selectPlayerUnit` wrote last (`main.ts:7253-7261`): the reachable range
/// wins over a non-empty build layer of every kind (mutant a: constant Build).
#[test]
fn t5b_reachable_writer_shows_the_range() {
    for kind in [
        vm::BuildHighlightKind::Improvement,
        vm::BuildHighlightKind::Mine,
        vm::BuildHighlightKind::FoundCity,
        vm::BuildHighlightKind::Wonder,
    ] {
        let ov = both(kind, &[4, 5]);
        assert_eq!(
            view::unit_highlight(&ov, false, HighlightPriority::Reachable),
            reach_set(),
            "{kind:?}"
        );
        assert_eq!(
            UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Reachable)
                .highlight,
            reach_set(),
            "{kind:?}"
        );
    }
}

/// D-371-5c U-OP-1 (replaces the T5b fallback to the build layer):
/// `selectPlayerUnit` writes `setHighlight(reachable)` also for an EMPTY set
/// (`main.ts:7256-7261`: `reachable = stackCanMove(u) && ... ?
/// reachableWithMergeTargets(u) : new Set()`), so the reachable writer with
/// an empty `reachable` is no discs whatever build layer the frame carries
/// (mutant a: the fallback to the build layer restored); with neither layer
/// `clearHighlight()` for every writer.
#[test]
fn t5c_reachable_writer_with_empty_range_is_no_discs() {
    for kind in [
        vm::BuildHighlightKind::Improvement,
        vm::BuildHighlightKind::Mine,
        vm::BuildHighlightKind::FoundCity,
        vm::BuildHighlightKind::Wonder,
    ] {
        let mut ov = both(kind, &[4, 5]);
        ov.reachable.clear();
        for siege in [false, true] {
            assert_eq!(
                view::unit_highlight(&ov, siege, HighlightPriority::Reachable),
                UnitHighlight::Clear,
                "{kind:?} siege {siege}"
            );
        }
        assert_eq!(
            UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Reachable)
                .highlight,
            UnitHighlight::Clear,
            "{kind:?}"
        );
        // The build writer keeps Q6-2 on the same frame (the deposit mine is
        // `clearHighlight()`, `main.ts:16386-16390`).
        let got = view::unit_highlight(&ov, false, HighlightPriority::Build);
        if kind == vm::BuildHighlightKind::Mine {
            assert_eq!(got, UnitHighlight::Clear);
        } else {
            assert!(
                matches!(
                    got,
                    UnitHighlight::Set {
                        source: HighlightSource::Build(k),
                        ..
                    } if k == kind
                ),
                "{kind:?}: the build layer exists on this frame"
            );
        }
    }
    let mut none = overlays(no_build());
    none.reachable.clear();
    for p in [
        HighlightPriority::Build,
        HighlightPriority::Reachable,
        HighlightPriority::Cleared,
    ] {
        assert_eq!(view::unit_highlight(&none, false, p), UnitHighlight::Clear);
    }
}

/// D-371-5c U-OP-3 / U-OP-4: `clearHighlight()` wrote last
/// (`clearPlayerUnitSelectionStateOnly`, `main.ts:7097-7101`;
/// `refreshBuildHighlight` outside build mode after `exitBuildMode`,
/// `:16369-16372`): no discs for every frame, with or without the reachable
/// range and the build layer; the ring and the route are separate calls and
/// stay (mutant d: the deselect keeps the layer).
#[test]
fn t5c_cleared_writer_is_no_discs_and_keeps_ring_and_route() {
    for kind in [
        vm::BuildHighlightKind::Improvement,
        vm::BuildHighlightKind::Mine,
        vm::BuildHighlightKind::FoundCity,
        vm::BuildHighlightKind::Wonder,
    ] {
        let ov = both(kind, &[4, 5]);
        for siege in [false, true] {
            assert_eq!(
                view::unit_highlight(&ov, siege, HighlightPriority::Cleared),
                UnitHighlight::Clear,
                "{kind:?} siege {siege}"
            );
        }
    }
    let ov = overlays(no_build());
    assert_eq!(
        view::unit_highlight(&ov, false, HighlightPriority::Cleared),
        UnitHighlight::Clear
    );
    let both_ov = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    let c = UnitOverlayInputs::from_overlays_with_priority(&both_ov, HighlightPriority::Cleared);
    let b = UnitOverlayInputs::from_overlays_with_priority(&both_ov, HighlightPriority::Build);
    assert_eq!(c.highlight, UnitHighlight::Clear);
    assert_eq!(c.selection, b.selection);
    assert_eq!(c.path_route, b.path_route);

    // On the renderer: a previous range is cleared, the ring stays.
    let mut r = renderer();
    UnitOverlayInputs::from_overlays_with_priority(&both_ov, HighlightPriority::Reachable)
        .apply(&mut r);
    assert!(r.highlight().is_some());
    c.apply(&mut r);
    assert!(r.highlight().is_none(), "clearHighlight()");
    let ring = r.selection().expect("ring kept");
    assert_eq!((ring.hex.q, ring.hex.r), (0, 0));
}

/// The web scenario of D-371-5c on hand DTOs, one renderer, pin call order:
/// panel open with a key, unit with no moves selected (`selectPlayerUnit`
/// with `stackCanMove(u) == false`: `setHighlight(new Set())`, U-OP-1) ->
/// key again (`refreshBuildHighlight`: build layer) -> deselect
/// (`clearPlayerUnitSelection`: `clearHighlight()`, U-OP-4) -> reselect ->
/// Escape (`exitBuildMode`: `clearHighlight()`, selection kept, U-OP-3).
#[test]
fn t5c_web_scenario_on_hand_dtos() {
    let mut r = renderer();
    // 1. Unit with no moves selected in build mode: both layers in the frame
    //    but `reachable` empty -> no discs, ring drawn.
    let mut stuck = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    stuck.reachable.clear();
    stuck.path_route = None;
    let u = UnitOverlayInputs::from_overlays_with_priority(&stuck, HighlightPriority::Reachable);
    assert_eq!(u.highlight, UnitHighlight::Clear);
    u.apply(&mut r);
    assert!(r.highlight().is_none(), "U-OP-1: no discs");
    assert!(r.selection().is_some());

    // 2. refreshBuildHighlight (key chosen again): the build layer.
    let u = UnitOverlayInputs::from_overlays_with_priority(&stuck, HighlightPriority::Build);
    u.apply(&mut r);
    assert_eq!(r.highlight().unwrap().hexes, vec![h(4), h(5)]);

    // 3. clearPlayerUnitSelection in build mode: no selection, the build
    //    layer still in the frame, writer Cleared -> no discs, no ring.
    let mut deselected = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    deselected.reachable.clear();
    deselected.selection = None;
    deselected.path_route = None;
    let u = UnitOverlayInputs::from_overlays_with_priority(&deselected, HighlightPriority::Cleared);
    u.apply(&mut r);
    assert!(r.highlight().is_none(), "U-OP-4: clearHighlight()");
    assert!(r.selection().is_none());

    // 4. selectPlayerUnit (moves left): the range.
    let mut reselected = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    reselected.path_route = None;
    let u =
        UnitOverlayInputs::from_overlays_with_priority(&reselected, HighlightPriority::Reachable);
    u.apply(&mut r);
    assert_eq!(r.highlight().unwrap().hexes, vec![h(2), h(3), h(1)]);

    // 5. exitBuildMode (Escape): build mode off, selection kept: the frame
    //    carries selection + reachable, no build layer; writer Cleared ->
    //    ring, no discs.
    let mut exited = overlays(no_build());
    exited.path_route = None;
    let u = UnitOverlayInputs::from_overlays_with_priority(&exited, HighlightPriority::Cleared);
    u.apply(&mut r);
    assert!(r.highlight().is_none(), "U-OP-3: clearHighlight()");
    let ring = r.selection().expect("U-OP-3: ring kept");
    assert_eq!((ring.hex.q, ring.hex.r), (0, 0));
    // Q6-2 on the same frame would show the range (the writer matters).
    assert_eq!(
        UnitOverlayInputs::from_overlays_with_priority(&exited, HighlightPriority::Build).highlight,
        reach_set()
    );
}

/// The siege map panel (`main.ts:7253-7255`): the reachable write of
/// `selectPlayerUnit` is `clearHighlight()`; the gate gives the same through
/// `with_siege_map_panel_open`.
#[test]
fn t5b_reachable_writer_with_siege_map_panel_clears() {
    let ov = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    assert_eq!(
        view::unit_highlight(&ov, true, HighlightPriority::Reachable),
        UnitHighlight::Clear
    );
    assert_eq!(
        UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Reachable)
            .with_siege_map_panel_open(true)
            .highlight,
        UnitHighlight::Clear
    );
    // The build writer keeps its layer (another call site).
    assert_eq!(
        UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Build)
            .with_siege_map_panel_open(true)
            .highlight,
        farm_set()
    );
}

/// `setSelectionHex` / `setPathRoute` are separate calls: the ring and the
/// route are the same for both writers and stay on the renderer when the
/// build layer wins (mutant f).
#[test]
fn t5b_ring_and_route_do_not_depend_on_the_writer() {
    let ov = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    let b = UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Build);
    let r = UnitOverlayInputs::from_overlays_with_priority(&ov, HighlightPriority::Reachable);
    assert_eq!(b.selection, Some((h(0), 1)));
    assert_eq!(b.selection, r.selection);
    assert_eq!(b.path_route, r.path_route);
    assert!(b.path_route.is_some());

    let mut got = renderer();
    b.apply(&mut got);
    let mut want = renderer();
    want.set_selection_hex(h(0), 1);
    want.set_highlight(&[h(4), h(5)], IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY);
    want.set_path_route(&(0..6).map(h).collect::<Vec<_>>(), &pin_turn_stops());
    assert_eq!(got.selection(), want.selection());
    assert_eq!(got.highlight(), want.highlight());
    assert_eq!(got.path_route(), want.path_route());
    assert!(got.selection().is_some() && got.path_route().is_some());
}

/// The web scenario on hand DTOs, one renderer, the pin call order:
/// `onOpenBuild` (no unit overlays, panel without key) -> `selectPlayerUnit`
/// in build mode (selection + reachable, writer Reachable) -> key chosen
/// (`refreshBuildHighlight`, writer Build: build layer, ring kept; the route
/// is cleared by the mouse handler, `main.ts:32273-32278`, i.e. by the DTO)
/// -> `selectPlayerUnit` again with the key (writer Reachable).
#[test]
fn t5b_web_scenario_on_hand_dtos() {
    let mut r = renderer();
    // 1. onOpenBuild: `clearPlayerUnitSelection()`, no key = no build layer.
    let mut opened = overlays(no_build());
    opened.reachable.clear();
    opened.selection = None;
    opened.path_route = None;
    let u = UnitOverlayInputs::from_overlays_with_priority(&opened, HighlightPriority::Build);
    u.apply(&mut r);
    assert!(r.selection().is_none() && r.highlight().is_none() && r.path_route().is_none());

    // 2. selectPlayerUnit with the panel open (no key yet).
    let reselected = overlays(no_build());
    let u =
        UnitOverlayInputs::from_overlays_with_priority(&reselected, HighlightPriority::Reachable);
    assert_eq!(u.highlight, reach_set());
    u.apply(&mut r);
    assert_eq!(r.highlight().unwrap().hexes, vec![h(2), h(3), h(1)]);
    assert!(r.selection().is_some());

    // 3. Key chosen: the frame carries both layers, the build writer wins.
    let mut keyed = both(vm::BuildHighlightKind::Improvement, &[4, 5]);
    keyed.path_route = None;
    let u = UnitOverlayInputs::from_overlays_with_priority(&keyed, HighlightPriority::Build);
    assert_eq!(u.highlight, farm_set());
    u.apply(&mut r);
    assert_eq!(r.highlight().unwrap().hexes, vec![h(4), h(5)]);
    assert_eq!(
        r.highlight().unwrap().opacity,
        IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY
    );
    let ring = r.selection().expect("ring kept after the key change");
    assert_eq!((ring.hex.q, ring.hex.r), (0, 0));

    // 4. selectPlayerUnit again with the key: the range wins again.
    let u = UnitOverlayInputs::from_overlays_with_priority(&keyed, HighlightPriority::Reachable);
    u.apply(&mut r);
    assert_eq!(r.highlight().unwrap().hexes, vec![h(2), h(3), h(1)]);
    assert_eq!(r.highlight().unwrap().opacity, HIGHLIGHT_OPACITY);
    assert!(r.selection().is_some());
}
