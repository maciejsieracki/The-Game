//! R-RUSTPORT-P4-371-T5A-FRAME-RESELECT-ENGINE (#371, T5a; D-371-5): ponowne zaznaczenie jednostki przy
//! otwartym panelu budowy (DLUG-FRAME-RESELECT, decyzja operatora D-OP-8 w `render_frame.rs`).
//!
//! Web (pin `07d2fbd72`, `gra/src/main.ts`): `onOpenBuild` -> `clearPlayerUnitSelection()`
//! (`:26702-26703`, `:7090-7106`); `selectPlayerUnit` (`:7233-7260`) nie zamyka trybu budowy i ustawia
//! `selectedId`, `reachable` (`:7252-7256`) i pierscien (`:7258`); `refreshBuildHighlight`
//! (`:16351-16396`) po zmianie klucza przywraca podswietlenie budowy; handler ruchu myszy czysci trase
//! przy `buildModeOpen && (foundCityMode || activeImprovementKey || activeWonderId)` (`:32273-32278`).

#[path = "../src/bridge.rs"]
#[allow(dead_code)]
mod bridge;

use bridge::{
    BridgeRequest, BridgeResult, CivEngineAdapter, EngineBridge, EngineCommand, RenderUiParams,
    StartGameParams,
};
use civ_engine::domain::overlays_view::reachable_overlay;
use civ_engine::domain::playable::{
    MovementPoints, PlayableFogSession, PlayableGame, PlayableTerrain, PlayableUnit,
    PlayableUnitKind,
};
use civ_engine::domain::render_frame::build_render_frame;
use civ_engine::{PlayableState, PlayerId, PositionDto, UnitId};
use civ_view_model as vm;
use civ_view_model::RenderLayersDto;
use serde_json::{json, Value};

const HUMAN: u64 = 1;
/// `STARTING_UNIT_ID` scenariusza startowego (`playable.rs:43-45`, pozycja (2,1)).
const WARRIOR: u64 = 1;
/// Druga jednostka gracza (mutant d: inne `selected_unit_id`).
const SECOND: u64 = 5;

/// Scenariusz startowy na rowninach (stolica (1,1)), z druga jednostka gracza w (4,3).
fn state() -> PlayableState {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenariusz")
        .state()
        .clone();
    for t in &mut state.map.tiles {
        t.terrain = PlayableTerrain::Plains;
        t.passable = t.terrain.is_passable();
    }
    state.units.push(PlayableUnit {
        id: UnitId::new(SECOND),
        owner_id: PlayerId::new(HUMAN),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(4, 3),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    });
    state
}

fn frame(state: &PlayableState, ui: &RenderUiParams) -> RenderLayersDto {
    let mut session = PlayableFogSession::for_new_game(state);
    build_render_frame(state, &mut session, PlayerId::new(HUMAN), ui).expect("ramka")
}

fn json_of(f: &RenderLayersDto) -> String {
    serde_json::to_string(f).expect("json")
}

fn hover() -> Option<PositionDto> {
    Some(PositionDto::new(4, 1))
}

/// Web `selectPlayerUnit` poza trybem budowy (D-OP-4): wzorzec nakladek jednostki.
fn plain_selected(id: u64) -> RenderUiParams {
    RenderUiParams {
        selected_unit_id: Some(id),
        hover: hover(),
        ..RenderUiParams::default()
    }
}

fn reselected(id: u64) -> RenderUiParams {
    RenderUiParams {
        build_mode_open: true,
        unit_selected_after_build_open: true,
        ..plain_selected(id)
    }
}

fn expected_reachable(state: &PlayableState, id: u64) -> Vec<vm::HexCoord> {
    let mut s = state.clone();
    s.selected_unit_id = Some(id);
    reachable_overlay(&s)
}

fn empty_unit_overlays(f: &RenderLayersDto, ctx: &str) {
    assert_eq!(f.overlays.selection, None, "{ctx}");
    assert!(f.overlays.reachable.is_empty(), "{ctx}");
    assert_eq!(f.overlays.path_route, None, "{ctx}");
}

/// Kryterium konca 1: `onOpenBuild` -> `selectPlayerUnit` -> zmiana klucza -> ramka ma jednoczesnie
/// `selection` i `buildHighlight`.
#[test]
fn scenariusz_webu_open_build_select_klucz() {
    let state = state();
    let plain = frame(&state, &plain_selected(WARRIOR));
    let sel = plain.overlays.selection.expect("D-OP-4 zaznaczenie");
    assert!(!plain.overlays.reachable.is_empty(), "wojownik ma ruch");
    assert!(plain.overlays.path_route.is_some(), "trasa do (4,1)");

    // 1. `onOpenBuild`: `clearPlayerUnitSelection()` -> `selectedId = null`; panel otwarty bez klucza.
    let opened = RenderUiParams {
        build_mode_open: true,
        hover: hover(),
        ..RenderUiParams::default()
    };
    let f1 = frame(&state, &opened);
    empty_unit_overlays(&f1, "onOpenBuild");

    // 2. `selectPlayerUnit` przy otwartym panelu: pierscien, zasieg i trasa jak poza trybem budowy.
    let f2 = frame(&state, &reselected(WARRIOR));
    assert_eq!(f2.overlays.selection, Some(sel));
    assert_eq!(f2.overlays.reachable, plain.overlays.reachable);
    assert_eq!(
        f2.overlays.reachable,
        expected_reachable(&state, WARRIOR),
        "reachableWithMergeTargets(u)"
    );
    assert_eq!(f2.overlays.path_route, plain.overlays.path_route);
    // Panel bez klucza: warstwa budowy = galaz „brak trybu” jak dotad.
    assert_eq!(f2.overlays.build_highlight, f1.overlays.build_highlight);

    // 3. Wybor klucza (`refreshBuildHighlight`): podswietlenie budowy wraca, zaznaczenie zostaje.
    let keyed = RenderUiParams {
        active_improvement_key: Some("farma".to_owned()),
        ..reselected(WARRIOR)
    };
    let f3 = frame(&state, &keyed);
    let build_only = frame(
        &state,
        &RenderUiParams {
            build_mode_open: true,
            active_improvement_key: Some("farma".to_owned()),
            ..RenderUiParams::default()
        },
    );
    assert!(
        !build_only.overlays.build_highlight.hexes.is_empty(),
        "farma w terytorium stolicy"
    );
    assert_eq!(
        f3.overlays.build_highlight, build_only.overlays.build_highlight,
        "buildHighlight jak bez zaznaczenia (mutant c)"
    );
    assert_eq!(f3.overlays.selection, Some(sel));
    assert_eq!(f3.overlays.reachable, plain.overlays.reachable);
    // `:32273-32278`: z wybranym kluczem ruch myszy czysci trase.
    assert_eq!(f3.overlays.path_route, None);

    // Kopalnia zloza: warstwa `Mine` zostaje obok zaznaczenia.
    let mine = frame(
        &state,
        &RenderUiParams {
            active_improvement_key: Some("kopalnia_miedzi".to_owned()),
            ..reselected(WARRIOR)
        },
    );
    assert_eq!(
        mine.overlays.build_highlight.kind,
        vm::BuildHighlightKind::Mine
    );
    assert!(mine.overlays.selection.is_some());

    // Pozostale pola ramki bez zmian wzgledem ramki bez zaznaczenia.
    let mut a = f3.clone();
    let mut b = build_only.clone();
    a.overlays.selection = None;
    a.overlays.reachable = Vec::new();
    b.overlays.path_route = None;
    assert_eq!(json_of(&a), json_of(&b));
}

/// Domyslne `false` = D-OP-3 bajt w bajt (mutant b: flaga zawsze `true`).
#[test]
fn flaga_false_zachowuje_d_op_3() {
    let state = state();
    for ui in [
        RenderUiParams {
            build_mode_open: true,
            ..plain_selected(WARRIOR)
        },
        RenderUiParams {
            build_mode_open: true,
            active_improvement_key: Some("farma".to_owned()),
            ..plain_selected(WARRIOR)
        },
        RenderUiParams {
            found_city_mode: true,
            ..plain_selected(WARRIOR)
        },
        RenderUiParams {
            wonder_active: true,
            ..plain_selected(WARRIOR)
        },
    ] {
        assert!(!ui.unit_selected_after_build_open);
        let f = frame(&state, &ui);
        empty_unit_overlays(&f, &format!("{ui:?}"));
        // Ta sama ramka co bez zaznaczenia w ogole (wczesny return D-OP-3).
        let none = frame(
            &state,
            &RenderUiParams {
                selected_unit_id: None,
                ..ui.clone()
            },
        );
        assert_eq!(json_of(&f), json_of(&none), "{ui:?}");
    }
}

/// Mutant a: flaga ignorowana (zawsze wczesny return) - kazdy tryb podswietlenia przywraca zaznaczenie.
#[test]
fn flaga_true_przywraca_we_wszystkich_trybach() {
    let state = state();
    let plain = frame(&state, &plain_selected(WARRIOR));
    for (ui, path_visible) in [
        (reselected(WARRIOR), true),
        (
            RenderUiParams {
                active_improvement_key: Some("farma".to_owned()),
                ..reselected(WARRIOR)
            },
            false,
        ),
        // Pusty klucz jest w webie falszywy (`activeImprovementKey &&` w `:32273`): trasa zostaje
        // (obrona r1, U1; mutant g: `.is_some()` zamiast `.is_some_and(|k| !k.is_empty())`).
        (
            RenderUiParams {
                active_improvement_key: Some(String::new()),
                ..reselected(WARRIOR)
            },
            true,
        ),
        (
            RenderUiParams {
                found_city_mode: true,
                ..reselected(WARRIOR)
            },
            false,
        ),
        (
            RenderUiParams {
                wonder_active: true,
                ..reselected(WARRIOR)
            },
            false,
        ),
        // `foundCityMode` bez `buildModeOpen`: warunek `:32273` nie zachodzi, trasa zostaje.
        (
            RenderUiParams {
                build_mode_open: false,
                found_city_mode: true,
                ..reselected(WARRIOR)
            },
            true,
        ),
    ] {
        let f = frame(&state, &ui);
        assert_eq!(f.overlays.selection, plain.overlays.selection, "{ui:?}");
        assert_eq!(f.overlays.reachable, plain.overlays.reachable, "{ui:?}");
        let expected_path = if path_visible {
            plain.overlays.path_route.clone()
        } else {
            None
        };
        assert_eq!(f.overlays.path_route, expected_path, "{ui:?}");
        // `buildHighlight` = ramka z flaga `false` (mutant c).
        let off = frame(
            &state,
            &RenderUiParams {
                unit_selected_after_build_open: false,
                ..ui.clone()
            },
        );
        assert_eq!(
            f.overlays.build_highlight, off.overlays.build_highlight,
            "{ui:?}"
        );
    }
    // Poza trybem budowy flaga nie zmienia ramki (D-OP-4).
    let outside = frame(
        &state,
        &RenderUiParams {
            unit_selected_after_build_open: true,
            ..plain_selected(WARRIOR)
        },
    );
    assert_eq!(json_of(&outside), json_of(&plain));
}

/// Mutant d: `reachable`, `selection` i trasa z `selected_unit_id` z UI, nie z innej jednostki.
#[test]
fn zasieg_z_zaznaczonej_jednostki() {
    let state = state();
    let a = frame(&state, &reselected(WARRIOR));
    let b = frame(&state, &reselected(SECOND));
    assert_eq!(a.overlays.reachable, expected_reachable(&state, WARRIOR));
    assert_eq!(b.overlays.reachable, expected_reachable(&state, SECOND));
    assert_ne!(a.overlays.reachable, b.overlays.reachable);
    assert_eq!(
        b.overlays.selection.expect("zaznaczenie").hex,
        vm::HexCoord::new(4, 3)
    );
    assert_eq!(
        b.overlays.path_route,
        frame(&state, &plain_selected(SECOND)).overlays.path_route
    );
    // Stan z innym `selected_unit_id` nie wplywa na ramke (UI jest zrodlem, D-OP-4).
    let mut other = state.clone();
    other.selected_unit_id = Some(SECOND);
    assert_eq!(
        json_of(&frame(&other, &reselected(WARRIOR))),
        json_of(&a),
        "selectedId z UI"
    );
}

/// Mutant e: flaga `true` bez `selected_unit_id` - pusto, bez paniki, ramka jak D-OP-3.
#[test]
fn flaga_true_bez_zaznaczenia() {
    let state = state();
    for key in [None, Some("farma".to_owned())] {
        let ui = RenderUiParams {
            selected_unit_id: None,
            active_improvement_key: key,
            ..reselected(WARRIOR)
        };
        let f = frame(&state, &ui);
        empty_unit_overlays(&f, &format!("{ui:?}"));
        let off = frame(
            &state,
            &RenderUiParams {
                unit_selected_after_build_open: false,
                ..ui.clone()
            },
        );
        assert_eq!(json_of(&f), json_of(&off), "{ui:?}");
    }
    // Nieistniejaca jednostka: `selection` None (`units.find`), zasieg pusty, bez paniki.
    let ghost = frame(&state, &reselected(999));
    assert_eq!(ghost.overlays.selection, None);
    assert!(ghost.overlays.reachable.is_empty());
}

/// JSON: pole opcjonalne (`unitSelectedAfterBuildOpen`), `deny_unknown_fields` dziala, round-trip serde.
#[test]
fn json_pola_flagi() {
    let missing: RenderUiParams =
        serde_json::from_value(json!({"buildModeOpen": true})).expect("ui");
    assert!(!missing.unit_selected_after_build_open);
    let ui: RenderUiParams = serde_json::from_value(json!({
        "selectedUnitId": 1,
        "buildModeOpen": true,
        "unitSelectedAfterBuildOpen": true
    }))
    .expect("ui z flaga");
    assert_eq!(ui, reselected_without_hover());
    let v = serde_json::to_value(&ui).expect("json");
    assert_eq!(v["unitSelectedAfterBuildOpen"], json!(true));
    let back: RenderUiParams = serde_json::from_value(v).expect("round-trip");
    assert_eq!(back, ui);
    let default_v = serde_json::to_value(RenderUiParams::default()).expect("json");
    assert_eq!(default_v["unitSelectedAfterBuildOpen"], json!(false));
    assert!(
        serde_json::from_value::<RenderUiParams>(json!({"unit_selected_after_build_open": true}))
            .is_err(),
        "snake_case = nieznane pole"
    );
    assert!(serde_json::from_value::<RenderUiParams>(json!({"reselect": true})).is_err());
}

fn reselected_without_hover() -> RenderUiParams {
    RenderUiParams {
        hover: None,
        ..reselected(WARRIOR)
    }
}

/// Most: `GetRenderFrame` z flaga w JSON daje przywrocone zaznaczenie przy otwartym panelu.
#[test]
fn most_get_render_frame_z_flaga() {
    let mut bridge = EngineBridge::new(CivEngineAdapter::default());
    bridge
        .handle(BridgeRequest::new(
            "create",
            EngineCommand::CreateSession {
                params: StartGameParams::default(),
            },
        ))
        .expect("sesja");
    let mut get = |ui: Value| -> RenderLayersDto {
        let cmd: EngineCommand =
            serde_json::from_value(json!({"kind": "get_render_frame", "ui": ui})).expect("komenda");
        let d = bridge
            .handle(BridgeRequest::new("frame", cmd))
            .expect("ramka");
        assert!(d.events.is_empty());
        match d.response.result {
            BridgeResult::RenderFrame { frame } => frame.0,
            _ => panic!("RenderFrame"),
        }
    };
    let off = get(json!({"selectedUnitId": WARRIOR, "buildModeOpen": true}));
    empty_unit_overlays(&off, "flaga false");
    let on = get(json!({
        "selectedUnitId": WARRIOR,
        "buildModeOpen": true,
        "unitSelectedAfterBuildOpen": true
    }));
    let plain = get(json!({"selectedUnitId": WARRIOR}));
    assert!(on.overlays.selection.is_some());
    assert_eq!(on.overlays.selection, plain.overlays.selection);
    assert_eq!(on.overlays.reachable, plain.overlays.reachable);
}
