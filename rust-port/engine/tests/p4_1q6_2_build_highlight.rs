//! R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1 (dlug Q6-2): jedna warstwa podswietlenia mapy przy
//! zaznaczonej jednostce gracza i trybach budowy.
//!
//! Wektory: `p4_1q6_2_vectors/vectors.json` z generatora `p4_1q6_2_gen.mjs`, ktory WYKONUJE tekst pinu
//! `07d2fbd72`: `syncPlayerUnitSelectionOnMap` (`gra/src/main.ts:7115-7135`), `refreshBuildHighlight`
//! (`:16351-16396`), `clear/refreshMineEligibleOverlay` (`:15541-15564`), `filterBuildHighlightHexes`
//! (`render/buildHighlight.ts:22-28`), `isMineImprovementKey` (`map/improvement-build.ts:719-729`).
//! Obserwable pinu: koncowa warstwa `unitRenderer.setHighlight` (heksy + krycie; `null` = brak warstwy)
//! i warstwa kopalni (`mineEligibleGroup`).
//!
//! Odtworzenie obserwabli z pol producenta (`reachable`, `build_highlight`) idzie regula adaptera
//! renderera (`renderer/src/view/units.rs` `unit_highlight` i `renderer/src/view/overlays.rs`
//! `mine_eligible_group`, decyzja Q6-2): niepusta warstwa budowy wygrywa (kopalnia = `clearHighlight`),
//! inaczej `reachable`, inaczej brak warstwy. Silnik nie zalezy od crate renderera, wiec regula jest tu
//! przepisana 1:1 ([`layer_of`]).

use std::collections::HashSet;

use civ_engine::domain::overlays_view::{
    build_highlight, build_highlight_mode_active, reachable_overlay, unit_overlays_view,
    BuildHighlightSources, BuildHighlightUi, SelectionUi, UnitOverlaysInput, UnitOverlaysView,
};
use civ_engine::domain::playable::MovementPoints;
use civ_engine::{
    PlayableGame, PlayableMap, PlayableState, PlayableTerrain, PlayableTile, PlayableUnit,
    PlayableUnitKind, PlayerId, PositionDto, StartGameParams, UnitId,
};
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::BuildHighlightKind;
use serde_json::Value;

const VECTORS: &str = include_str!("p4_1q6_2_vectors/vectors.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const HUMAN: u64 = 1;
const MOVER: u64 = 900;

/// Korytarz rownin `x = 0..n`, `y = 0`; jednostka gracza `MOVER` na `(0,0)` (ruch 3) zaznaczona;
/// gracz mial juz miasto (`isAwaitingFirstPlayerCity` = false), jak w `view_overlays_reach_path.rs`.
fn corridor(n: u16) -> PlayableState {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone();
    state.map = PlayableMap {
        width: n,
        height: 1,
        tiles: (0..n)
            .map(|x| PlayableTile {
                position: PositionDto::new(x, 0),
                terrain: PlayableTerrain::Plains,
                passable: true,
            })
            .collect(),
        improvements: Vec::new(),
    };
    state.cities.clear();
    state.units = vec![PlayableUnit {
        id: UnitId::new(MOVER),
        owner_id: PlayerId::new(HUMAN),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(0, 0),
        movement: MovementPoints::from(3u8),
        movement_max: MovementPoints::from(3u8),
        selected: false,
    }];
    state.planned_marches.clear();
    state.economy = Default::default();
    state.selected_unit_id = Some(MOVER);
    state.gracz_kiedys_mial_miasto = true;
    state
}

fn hexes(v: &Value) -> Vec<(i32, i32)> {
    v.as_array()
        .expect("lista heksow")
        .iter()
        .map(|h| {
            let h = h.as_array().expect("para [q, r]");
            (
                h[0].as_i64().expect("q") as i32,
                h[1].as_i64().expect("r") as i32,
            )
        })
        .collect()
}

fn coords(v: &[(i32, i32)]) -> Vec<HexCoord> {
    v.iter().map(|&(q, r)| HexCoord::new(q, r)).collect()
}

/// Obserwabla pinu: warstwa `setHighlight` (heksy + etykieta krycia) albo brak warstwy.
type Layer = Option<(Vec<HexCoord>, &'static str)>;

/// Regula adaptera (`renderer/src/view/units.rs` `unit_highlight` z `siege_map_panel_open = false`,
/// `renderer/src/view/overlays.rs` `mine_eligible_group`): `(warstwa podswietlenia, warstwa kopalni)`.
fn layer_of(view: &UnitOverlaysView) -> (Layer, Option<Vec<HexCoord>>) {
    let bh = &view.build_highlight;
    let mine =
        (bh.kind == BuildHighlightKind::Mine && !bh.hexes.is_empty()).then(|| bh.hexes.clone());
    let layer = if !bh.hexes.is_empty() {
        match bh.kind {
            BuildHighlightKind::Mine => None,
            BuildHighlightKind::FoundCity | BuildHighlightKind::Wonder => {
                Some((bh.hexes.clone(), "HIGHLIGHT_OPACITY"))
            }
            BuildHighlightKind::Improvement => {
                Some((bh.hexes.clone(), "IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY"))
            }
        }
    } else if view.reachable.is_empty() {
        None
    } else {
        Some((view.reachable.clone(), "HIGHLIGHT_OPACITY"))
    };
    (layer, mine)
}

fn expected_layer(v: &Value) -> Layer {
    if v.is_null() {
        return None;
    }
    let opacity = match v["opacity"].as_str().expect("opacity") {
        "HIGHLIGHT_OPACITY" => "HIGHLIGHT_OPACITY",
        "IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY" => "IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY",
        other => panic!("nieznane krycie {other}"),
    };
    Some((coords(&hexes(&v["hexes"])), opacity))
}

struct Case {
    name: String,
    found_city_mode: bool,
    wonder_active: bool,
    build_mode_open: bool,
    key: Option<String>,
    map_hexes: Vec<(i32, i32)>,
    start_reveal: HashSet<(i32, i32)>,
    can_found: HashSet<(i32, i32)>,
    wonder_hexes: Vec<(i32, i32)>,
    qualifying: Vec<(i32, i32)>,
    undo: HashSet<String>,
    reachable: Vec<HexCoord>,
    layer: Layer,
    mine: Option<Vec<HexCoord>>,
}

fn cases() -> Vec<Case> {
    let root: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    assert_eq!(root["pin"].as_str(), Some(PIN));
    root["vectors"]
        .as_array()
        .expect("vectors")
        .iter()
        .map(|v| {
            let ui = &v["ui"];
            let exp = &v["expected"];
            Case {
                name: v["name"].as_str().expect("name").to_owned(),
                found_city_mode: ui["foundCityMode"].as_bool().expect("foundCityMode"),
                wonder_active: ui["wonderActive"].as_bool().expect("wonderActive"),
                build_mode_open: ui["buildModeOpen"].as_bool().expect("buildModeOpen"),
                key: ui["activeImprovementKey"].as_str().map(str::to_owned),
                map_hexes: hexes(&v["mapHexes"]),
                start_reveal: hexes(&v["startReveal"]).into_iter().collect(),
                can_found: hexes(&v["canFound"]).into_iter().collect(),
                wonder_hexes: hexes(&v["wonderHexes"]),
                qualifying: hexes(&v["qualifying"]),
                undo: v["undoKeys"]
                    .as_array()
                    .expect("undoKeys")
                    .iter()
                    .map(|k| k.as_str().expect("klucz").to_owned())
                    .collect(),
                reachable: coords(&hexes(&v["reachable"])),
                layer: expected_layer(&exp["highlight"]),
                mine: (!exp["mineEligible"].is_null())
                    .then(|| coords(&hexes(&exp["mineEligible"]))),
            }
        })
        .collect()
}

fn view_for(state: &PlayableState, c: &Case) -> UnitOverlaysView {
    // `buildModeOpen` bez klucza ulepszenia nie wystepuje w wektorach: web czysci zaznaczenie przy
    // otwarciu panelu budowy (`onOpenBuild` -> `clearPlayerUnitSelection()`, `main.ts:26702-26703`).
    assert!(
        !(c.build_mode_open && c.key.is_none() && !c.found_city_mode && !c.wonder_active),
        "{}: wektor poza zakresem",
        c.name
    );
    let ui = BuildHighlightUi {
        found_city_mode: c.found_city_mode,
        wonder_active: c.wonder_active,
        build_mode_open: c.build_mode_open,
        active_improvement_key: c.key.as_deref(),
    };
    let reveal = |q: i32, r: i32| c.start_reveal.contains(&(q, r));
    let found = |q: i32, r: i32| c.can_found.contains(&(q, r));
    let wonder = || c.wonder_hexes.clone();
    let qual = |_: &str| c.qualifying.clone();
    let src = BuildHighlightSources {
        map_hexes: &c.map_hexes,
        is_in_start_reveal: &reveal,
        can_found_player_city_at: &found,
        qualifying_wonder_hexes: &wonder,
        qualifying_hexes: &qual,
        pending_undo_keys: &c.undo,
    };
    let view = unit_overlays_view(
        state,
        &UnitOverlaysInput {
            hover: None,
            build_ui: ui,
            build_sources: &src,
            selection_ui: SelectionUi {
                selected_unit_id: state.selected_unit_id,
            },
        },
    );
    // Pole `build_highlight` agregatora = producent F6 bez zmian (te same zrodla).
    assert_eq!(
        view.build_highlight,
        build_highlight(&ui, &src),
        "{}",
        c.name
    );
    view
}

/// Wszystkie wektory pinu: obserwable warstwy podswietlenia i kopalni odtworzone z pol producenta.
#[test]
fn q6_2_wektory_pinu_warstwa_podswietlenia() {
    let state = corridor(4);
    let cs = cases();
    assert_eq!(cs.len(), 12, "liczba wektorow");
    for c in &cs {
        // Warunek wstepny: zasieg z wektora = producent F5 (sam zasieg testuje P4-1F5).
        assert_eq!(reachable_overlay(&state), c.reachable, "{}: zasieg", c.name);
        let view = view_for(&state, c);
        let (layer, mine) = layer_of(&view);
        assert_eq!(layer, c.layer, "{}: warstwa setHighlight", c.name);
        assert_eq!(mine, c.mine, "{}: warstwa kopalni", c.name);
    }
}

/// Mutacja (a): aktywny tryb budowy z pustym zbiorem heksow MUSI wygasic `reachable`
/// (pusty zbior w `setHighlight(qual)` `main.ts:16360`, `setHighlight(new Set(...))` `:16366`,
/// `:16392-16395`; `clearHighlight()` `:16387`).
#[test]
fn q6_2_pusty_zbior_budowy_wygasza_zasieg() {
    let state = corridor(4);
    let mut seen = 0;
    for c in cases().iter().filter(|c| c.name != "ruch_bez_trybu_budowy") {
        let view = view_for(&state, c);
        assert!(
            view.reachable.is_empty(),
            "{}: zasieg w trybie budowy",
            c.name
        );
        if view.build_highlight.hexes.is_empty() {
            seen += 1;
        }
    }
    // zalozenie miasta x2, cud, kopalnia x2, ulepszenie x2.
    assert_eq!(seen, 7, "wektory z pustym zbiorem budowy");
}

/// Mutacja (b): tryb kopalni zachowuje heksy budowy (warstwa kopalni, `refreshMineEligibleOverlay`
/// `main.ts:16388`), a czysci tylko `setHighlight` (`:16387`).
#[test]
fn q6_2_kopalnia_zachowuje_heksy_budowy() {
    let state = corridor(4);
    let c = cases()
        .into_iter()
        .find(|c| c.name == "kopalnia_niepusta")
        .expect("wektor kopalni");
    let view = view_for(&state, &c);
    assert_eq!(view.build_highlight.kind, BuildHighlightKind::Mine);
    assert_eq!(view.build_highlight.hexes, coords(&[(2, 0), (1, 0)]));
    assert!(view.reachable.is_empty());
}

/// Mutacja (c): zwykly tryb ruchu zachowuje `reachable` (`main.ts:7123-7125`).
#[test]
fn q6_2_tryb_ruchu_zachowuje_zasieg() {
    let state = corridor(4);
    let c = cases()
        .into_iter()
        .find(|c| c.name == "ruch_bez_trybu_budowy")
        .expect("wektor ruchu");
    let view = view_for(&state, &c);
    assert_eq!(view.reachable, coords(&[(1, 0), (2, 0), (3, 0)]));
    assert!(view.build_highlight.hexes.is_empty());
}

/// Tabela galezi `refreshBuildHighlight` (`main.ts:16352`, `:16363`, `:16369`): tryb aktywny wtedy i
/// tylko wtedy, gdy producent F6 nie zwraca galezi „brak trybu budowy”.
#[test]
fn q6_2_tabela_aktywnosci_trybu_budowy() {
    let ui = |found, wonder, open, key| BuildHighlightUi {
        found_city_mode: found,
        wonder_active: wonder,
        build_mode_open: open,
        active_improvement_key: key,
    };
    let rows = [
        (ui(false, false, false, None), false),
        (ui(false, false, true, None), false),
        (ui(false, false, true, Some("")), false),
        (ui(false, false, false, Some("farma")), false),
        (ui(false, false, true, Some("farma")), true),
        (ui(false, false, true, Some("kopalnia_cyny")), true),
        (ui(true, false, false, None), true),
        (ui(false, true, false, None), true),
        (ui(true, true, true, Some("farma")), true),
    ];
    for (row, active) in rows {
        assert_eq!(build_highlight_mode_active(&row), active, "{row:?}");
    }
}
