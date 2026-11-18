//! R-RUSTPORT-P4-1F6: producent `overlays.buildHighlight` i `overlays.selection`.
//!
//! Wektory wyprowadzone z kodu pinu `07d2fbd72` (`gra/src/main.ts:16351-16396`
//! `refreshBuildHighlight`, `gra/src/render/buildHighlight.ts:22-28` `filterBuildHighlightHexes`,
//! `gra/src/map/improvement-build.ts:719-728` `MINE_IMPROVEMENT_KEYS`/`isMineImprovementKey`,
//! `gra/src/main.ts:7119` `setSelectionHex`). Wartosci oczekiwane z kodu pinu, nie z uruchomionego
//! webu (NIE_ZMIERZONO, dopuszczalne).

use std::cell::Cell;
use std::collections::HashSet;

use civ_engine::domain::overlays_view::{
    build_highlight, filter_build_highlight_hexes, selection, BuildHighlightSources,
    BuildHighlightUi, SelectionUi,
};
use civ_engine::domain::playable::MovementPoints;
use civ_engine::domain::start_reveal::{PlacementCheck, StartRevealContext};
use civ_engine::{PlayableUnit, PlayableUnitKind, PlayerId, PositionDto, UnitId};
use civ_view_model::overlays::{BuildHighlightKind, SelectionDto};
use civ_view_model::{HexCoord, OwnerRef};

fn hx(list: &[(i32, i32)]) -> Vec<HexCoord> {
    list.iter().map(|&(q, r)| HexCoord::new(q, r)).collect()
}

const MAP: &[(i32, i32)] = &[(0, 0), (1, 0), (2, 0), (3, 0), (0, 1), (5, 5)];

fn ui(found: bool, wonder: bool, open: bool, key: Option<&str>) -> BuildHighlightUi<'_> {
    BuildHighlightUi {
        found_city_mode: found,
        wonder_active: wonder,
        build_mode_open: open,
        active_improvement_key: key,
    }
}

/// Zrodla testowe: legalne heksy budowy zalezne od klucza, cud = staly zbior.
fn run(
    ui: &BuildHighlightUi<'_>,
    undo: &HashSet<String>,
) -> civ_view_model::overlays::BuildHighlightDto {
    let in_reveal = |_: i32, _: i32| true;
    let can_found = |_: i32, _: i32| true;
    let wonder = || vec![(2, 0), (3, 0), (2, 0)];
    let qual = |_: &str| vec![(1, 0), (3, 0), (0, 1)];
    build_highlight(
        ui,
        &BuildHighlightSources {
            map_hexes: MAP,
            is_in_start_reveal: &in_reveal,
            can_found_player_city_at: &can_found,
            qualifying_wonder_hexes: &wonder,
            qualifying_hexes: &qual,
            pending_undo_keys: undo,
        },
    )
}

/// Kopalnia zloza -> osobna warstwa `Mine` (`main.ts:16386-16390`; klucze kopalni
/// `improvement-build.ts:719-724`: `kopalnia_miedzi`, `kopalnia_zelaza`, `kopalnia_cyny`, `kopalnia_zlota`).
#[test]
fn deposit_mine_maps_to_mine_layer() {
    for key in [
        "kopalnia_miedzi",
        "kopalnia_zelaza",
        "kopalnia_cyny",
        "kopalnia_zlota",
    ] {
        let dto = run(&ui(false, false, true, Some(key)), &HashSet::new());
        assert_eq!(dto.kind, BuildHighlightKind::Mine, "{key}");
        assert_eq!(dto.hexes, hx(&[(1, 0), (3, 0), (0, 1)]), "{key}");
    }
}

/// Zwykle ulepszenie -> `Improvement` (`main.ts:16392-16395`, krycie `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY`).
#[test]
fn plain_improvement_maps_to_improvement_layer() {
    let dto = run(&ui(false, false, true, Some("farma")), &HashSet::new());
    assert_eq!(dto.kind, BuildHighlightKind::Improvement);
    assert_eq!(dto.hexes, hx(&[(1, 0), (3, 0), (0, 1)]));
}

/// Cud -> wariant `Wonder`, nie ulepszenie (`main.ts:16363-16367`); galaz cudu jest przed galezia
/// budowy, wiec aktywny klucz kopalni nic nie zmienia. `new Set(...)` usuwa powtorzenie `(2,0)`.
#[test]
fn wonder_maps_to_wonder_variant_before_build_branch() {
    let dto = run(
        &ui(false, true, true, Some("kopalnia_miedzi")),
        &HashSet::new(),
    );
    assert_eq!(dto.kind, BuildHighlightKind::Wonder);
    assert_eq!(dto.hexes, hx(&[(2, 0), (3, 0)]));
}

/// Zalozenie miasta ma pierwszenstwo przed cudem (`main.ts:16352` przed `:16363`).
#[test]
fn found_city_branch_precedes_wonder() {
    let dto = run(&ui(true, true, true, Some("farma")), &HashSet::new());
    assert_eq!(dto.kind, BuildHighlightKind::FoundCity);
    assert_eq!(dto.hexes, hx(MAP));
}

/// Ulepszenie po cofnieciu w turze: heks z kluczem `"q,r:key"` w `getUndoKeySet()` odjety
/// (`main.ts:16374-16378`, `buildHighlight.ts:27`); klucz innego ulepszenia nie odejmuje.
#[test]
fn undo_in_turn_removes_hex_from_highlight() {
    let undo: HashSet<String> = ["3,0:farma".to_owned(), "1,0:tartak".to_owned()].into();
    let dto = run(&ui(false, false, true, Some("farma")), &undo);
    assert_eq!(dto.kind, BuildHighlightKind::Improvement);
    assert_eq!(dto.hexes, hx(&[(1, 0), (0, 1)]));
    // ta sama regula dla warstwy kopalni (`hexes` liczone przed rozgalezieniem, `:16374-16390`)
    let undo_mine: HashSet<String> = ["0,1:kopalnia_zlota".to_owned()].into();
    let dto = run(&ui(false, false, true, Some("kopalnia_zlota")), &undo_mine);
    assert_eq!(dto.kind, BuildHighlightKind::Mine);
    assert_eq!(dto.hexes, hx(&[(1, 0), (3, 0)]));
}

/// `filterBuildHighlightHexes` (`buildHighlight.ts:22-28`): ujemne wspolrzedne w kluczu, kolejnosc zachowana.
#[test]
fn filter_matches_web_key_format() {
    let undo: HashSet<String> = ["-2,3:droga".to_owned()].into();
    let out = filter_build_highlight_hexes("droga", &[(4, -1), (-2, 3), (0, 0)], &undo);
    assert_eq!(out, vec![(4, -1), (0, 0)]);
}

/// Brak trybu (`!buildModeOpen || !activeImprovementKey || !buildApi`, `main.ts:16369-16373`):
/// puste heksy = brak warstwy; pusty klucz jak `null` (`!''` = true).
#[test]
fn no_mode_gives_no_layer() {
    for u in [
        ui(false, false, false, Some("farma")),
        ui(false, false, true, None),
        ui(false, false, true, Some("")),
        ui(false, false, false, None),
    ] {
        assert!(run(&u, &HashSet::new()).hexes.is_empty(), "{u:?}");
    }
}

/// Zalozenie miasta poza `isInStartReveal` -> heks pominiety, a `canFoundPlayerCityAt` dla niego
/// niewolane (`main.ts:16357` `continue` przed `:16358`). Krag startu z prawdziwego
/// `StartRevealContext` (`first-player-city.ts:23-33`): start `(0,0)`, promien 2.
#[test]
fn found_city_outside_start_reveal_is_skipped() {
    let ctx = StartRevealContext {
        awaiting_first_city: true,
        player_start_hex: Some((0.0, 0.0)),
        start_reveal_radius: 2.0,
    };
    let calls = Cell::new(0_u32);
    let in_reveal = |q: i32, r: i32| ctx.is_in_start_reveal(f64::from(q), f64::from(r));
    let can_found = |q: i32, r: i32| {
        calls.set(calls.get() + 1);
        // baza: (1,0) zablokowany przez canFoundCity (np. za blisko)
        ctx.can_found_player_city_at(f64::from(q), f64::from(r), |bq, br| PlacementCheck {
            ok: !(bq == 1.0 && br == 0.0),
            reason: String::new(),
        })
        .ok
    };
    let none = Vec::new;
    let qual = |_: &str| Vec::new();
    let undo = HashSet::new();
    let dto = build_highlight(
        &ui(true, false, false, None),
        &BuildHighlightSources {
            map_hexes: MAP,
            is_in_start_reveal: &in_reveal,
            can_found_player_city_at: &can_found,
            qualifying_wonder_hexes: &none,
            qualifying_hexes: &qual,
            pending_undo_keys: &undo,
        },
    );
    assert_eq!(dto.kind, BuildHighlightKind::FoundCity);
    // (3,0) dystans 3 > 2 i (5,5) dystans 10 -> pominiete; (1,0) odrzucony przez baze
    assert_eq!(dto.hexes, hx(&[(0, 0), (2, 0), (0, 1)]));
    // canFoundPlayerCityAt wolane tylko dla 4 heksow w kregu
    assert_eq!(calls.get(), 4);
}

fn unit(id: u64, owner: u64, x: u16, y: u16) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, y),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    }
}

/// `setSelectionHex(u.q, u.r, u.ownerId)` (`main.ts:7119`) dla jednostki `selectedId` z `units[]`;
/// `PositionDto(x, y)` = `HexCoord(q = x, r = y)` (kontrakt §1.4).
#[test]
fn selection_from_ui_state() {
    let units = [unit(1, 0, 2, 1), unit(7, 3, 4, 5)];
    let sel = selection(
        &SelectionUi {
            selected_unit_id: Some(7),
        },
        &units,
    );
    assert_eq!(
        sel,
        Some(SelectionDto {
            hex: HexCoord::new(4, 5),
            owner_id: OwnerRef::Player(civ_view_model::PlayerId::try_new(3).unwrap()),
        })
    );
    assert_eq!(selection(&SelectionUi::default(), &units), None);
    assert_eq!(
        selection(
            &SelectionUi {
                selected_unit_id: Some(99)
            },
            &units
        ),
        None
    );
}
