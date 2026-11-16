//! P4-1F5 (`R-RUSTPORT-P4-1F5-REACH-PATH-VIEW`, #273 / #242): `overlays.reachable` i
//! `overlays.pathRoute` (`domain::overlays_view`).
//!
//! Wartosci oczekiwane policzone RECZNIE z kodu pinu `07d2fbd72`, nie z kodu produkcyjnego Rust:
//! - `reachableWithMergeTargets` `gra/src/main.ts:14706-14731`;
//! - `occupiedForMove` `gra/src/main.ts:14578-14585` (`buildMoveOccupancy` `gra/src/units/setup.ts:759-776`,
//!   `foreignCityHexKeys` `gra/src/game/city-hex-movement.ts:66`);
//! - `computeReachable` `gra/src/units/setup.ts:840-975` (heksy `passThrough`: przejscie TAK, zasieg NIE,
//!   `:948-949`, `:965`);
//! - `canJoinStackAt` `gra/src/game/army-stack-limit.ts:55-66`, limit `armyStackLimit()` = 500;
//! - `marchPathPlan` `gra/src/main.ts:31110-31122` = `planPathTurns` `gra/src/game/planned-march.ts:215-285`
//!   + `applyFogToPathPlan` `gra/src/game/planned-march.ts:67-75`.
//!
//! Koszty terenu: `gra/data/terrain-movement.json` `Rownina: 1` (adapter P4-1H `Plains -> Rownina`).
//! Mapy to korytarz jednego rzedu (`r = 0`): jedyni sasiedzi w `map.hexes` to `(q-1,0)` i `(q+1,0)`,
//! wiec Dijkstra i `computePath` nie maja remisow kolejnosci.

use std::collections::HashSet;

use civ_engine::domain::overlays_view::{
    march_path_plan, path_route_of, path_route_overlay, reachable_overlay,
    reachable_with_merge_targets,
};
use civ_engine::domain::pathfinding::ruch_jednostek::MarchFogContext;
use civ_engine::domain::playable::{MovementPoints, PlayableCity, PlayablePlannedMarch};
use civ_engine::domain::playable_movement::{
    occupied_for_move, per_turn_move_for_unit, player_stack_at, unit_with_planning_stack_ruch,
    PlayableMoveModel,
};
use civ_engine::domain::CityId;
use civ_engine::{
    PlayableGame, PlayableMap, PlayableState, PlayableTerrain, PlayableTile, PlayableUnit,
    PlayableUnitKind, PlayerId, PositionDto, StartGameParams, UnitId,
};
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::{PathRouteDto, PathTurnStopDto};

const HUMAN: u64 = 1;
const ENEMY: u64 = 2;
const MOVER: u64 = 900;
/// Web `armyStackLimit()` = `BATTLE_MAX_PER_SIDE` (`main.ts:4358-4360`), Rust `ARMY_STACK_LIMIT`.
const STACK_LIMIT: u64 = 500;

fn unit(id: u64, owner: u64, x: u16, movement: u8, movement_max: u8) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, 0),
        movement: MovementPoints::from(movement),
        movement_max: MovementPoints::from(movement_max),
        selected: false,
    }
}

/// Korytarz rownin `x = 0..n`, `y = 0`; jednostka gracza `MOVER` na `(0,0)` zaznaczona; gracz
/// mial juz miasto (`isAwaitingFirstPlayerCity` = false).
fn corridor(n: u16, movement: u8, movement_max: u8) -> PlayableState {
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
    state.units = vec![unit(MOVER, HUMAN, 0, movement, movement_max)];
    state.planned_marches.clear();
    state.economy = Default::default();
    state.selected_unit_id = Some(MOVER);
    state.gracz_kiedys_mial_miasto = true;
    state
}

fn city(id: u64, owner: u64, x: u16) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("Miasto {id}"),
        position: PositionDto::new(x, 0),
        is_capital: false,
        population: 1,
        culture: 0,
    }
}

fn h(q: i32) -> HexCoord {
    HexCoord::new(q, 0)
}

fn hs(qs: &[i32]) -> Vec<HexCoord> {
    qs.iter().map(|&q| h(q)).collect()
}

fn stop(q: i32, turn: u32) -> PathTurnStopDto {
    PathTurnStopDto { hex: h(q), turn }
}

fn plan_to(state: &mut PlayableState, x: i32) {
    state.planned_marches.push(PlayablePlannedMarch {
        unit_id: UnitId::new(MOVER),
        dest_q: x,
        dest_r: 0,
        attack_unit_id: None,
        general_target_id: None,
    });
}

// ---------------------------------------------------------------------------
// reachable: passThrough + dopisany stos (main.ts:14706-14731, setup.ts:840-975)
// ---------------------------------------------------------------------------

/// Wektor R1 (zasieg z wlasnym stosem w zasiegu -> heks dopisany; przejscie przez wlasne
/// jednostki). Korytarz 0..5, `MOVER` (0,0) ruch 3, wlasna jednostka 901 na (1,0).
/// - `occupiedForMove(1, 900)` (`main.ts:14578-14585`): blokady {} , `passThrough` {(1,0)}
///   (`setup.ts:769-773`);
/// - `computeReachable` (`setup.ts:915-951`): pop (0,0): (1,0) koszt 1 <= 3, `passThrough` -> NIE do
///   zasiegu, `heapPush` (`:948-950`); pop (1,0): (2,0) koszt 2 -> dodany; pop (2,0): (3,0) koszt 3 ->
///   dodany; (4,0) koszt 4 > 3. MIN-MOVE (`:957-969`): (1,0) w `passThrough` -> pominiety.
///   `reach` = [(2,0), (3,0)];
/// - petla stosow (`main.ts:14716-14729`): 901 wlasna, poza stosem, inny heks; `canJoinStackAt`
///   1 + 1 <= 500; `computePath` -> [(1,0)], `pathCost` 1 <= 3 -> dopisany (1,0).
///
/// Wynik (kolejnosc `Set`): [(2,0), (3,0), (1,0)].
#[test]
fn r1_wlasny_stos_w_zasiegu_dopisany_i_przejscie_przez_wlasne() {
    let mut state = corridor(6, 3, 3);
    state.units.push(unit(901, HUMAN, 1, 3, 3));
    assert_eq!(
        reachable_with_merge_targets(&state, UnitId::new(MOVER)),
        hs(&[2, 3, 1])
    );
    assert_eq!(reachable_overlay(&state), hs(&[2, 3, 1]));
}

/// Wektor R2 (przejscie przez wlasne jednostki, `passThrough`): wlasna jednostka 901 na (1,0) NIE
/// blokuje drogi dalej - (2,0) i (3,0) sa w zasiegu tylko przez (1,0) (korytarz). Porownanie z
/// obca jednostka na (1,0) (`buildMoveOccupancy` `setup.ts:766-767`: obca -> blokada): zasieg
/// pusty; (1,0) nie jest celem scalenia (obca).
#[test]
fn r2_wlasne_jednostki_przechodnie_obce_blokuja() {
    let mut own = corridor(6, 3, 3);
    own.units.push(unit(901, HUMAN, 1, 3, 3));
    let reach = reachable_overlay(&own);
    assert!(reach.contains(&h(2)) && reach.contains(&h(3)), "{reach:?}");

    let mut foreign = corridor(6, 3, 3);
    foreign.units.push(unit(901, ENEMY, 1, 3, 3));
    assert_eq!(reachable_overlay(&foreign), Vec::<HexCoord>::new());
}

/// Wektor R3 (wlasny stos za daleko): ruch 2, wlasna jednostka na (3,0). `computeReachable`:
/// (1,0) k1, (2,0) k2; (3,0) k3 > 2 -> brak. Petla stosow: `computePath` [(1,0),(2,0),(3,0)],
/// `pathCost` 3 > 2 (`main.ts:14728`) -> niedopisany. Wynik [(1,0), (2,0)].
#[test]
fn r3_wlasny_stos_poza_kosztem_ruchu_niedopisany() {
    let mut state = corridor(6, 2, 2);
    state.units.push(unit(901, HUMAN, 3, 2, 2));
    assert_eq!(reachable_overlay(&state), hs(&[1, 2]));
}

/// Wektor R4 (stos pelny, `canJoinStackAt` = false -> heks niedopisany): 500 wlasnych jednostek
/// na (1,0). `canJoinStackAt(units, [900], 1, 0, 500)` (`army-stack-limit.ts:55-66`): `there` = 500
/// (`ownUnitCountAt` bez ruszajacych sie), 500 + 1 = 501 > 500 -> false -> `continue`
/// (`main.ts:14724`). `computeReachable`: (1,0) `passThrough`, (2,0) k2, (3,0) k3 -> [(2,0),(3,0)].
/// Granica: 499 jednostek -> 499 + 1 = 500 <= 500 -> (1,0) dopisany.
#[test]
fn r4_stos_pelny_can_join_stack_at_false_niedopisany() {
    let mut full = corridor(6, 3, 3);
    for i in 0..STACK_LIMIT {
        full.units.push(unit(1000 + i, HUMAN, 1, 3, 3));
    }
    assert_eq!(reachable_overlay(&full), hs(&[2, 3]));

    let mut room = corridor(6, 3, 3);
    for i in 0..(STACK_LIMIT - 1) {
        room.units.push(unit(1000 + i, HUMAN, 1, 3, 3));
    }
    assert_eq!(reachable_overlay(&room), hs(&[2, 3, 1]));
}

/// Wektor R5 (obce miasto blokuje heks): miasto gracza 2 na (2,0). `occupiedForMove`
/// (`main.ts:14580-14583`): `foreignCityHexKeys(1, cities)` = {(2,0)} -> blokada. `computeReachable`
/// (ruch 3): (1,0) k1; (2,0) zablokowany (`setup.ts:936`) -> korytarz uciety. Wynik [(1,0)].
/// Wlasne miasto na (2,0) nie blokuje: [(1,0), (2,0), (3,0)].
#[test]
fn r5_obce_miasto_blokuje_heks() {
    let mut foreign = corridor(6, 3, 3);
    foreign.cities.push(city(77, ENEMY, 2));
    assert_eq!(reachable_overlay(&foreign), hs(&[1]));

    let mut own = corridor(6, 3, 3);
    own.cities.push(city(78, HUMAN, 2));
    assert_eq!(reachable_overlay(&own), hs(&[1, 2, 3]));
}

/// Wektor R6 (obce miasto zdejmuje `passThrough`, `main.ts:14582`): wlasna jednostka 901 stoi w
/// obcym miescie na (2,0) -> (2,0) blokada, nie przejscie: (3,0) nieosiagalny. Petla stosow:
/// `computePath` dopuszcza cel zajety (`setup.ts:1019+`, cel jako ostatni krok) -> [(1,0),(2,0)],
/// koszt 2 <= 3 -> (2,0) dopisany. Wynik [(1,0), (2,0)].
#[test]
fn r6_obce_miasto_zdejmuje_pass_through() {
    let mut state = corridor(6, 3, 3);
    state.cities.push(city(77, ENEMY, 2));
    state.units.push(unit(901, HUMAN, 2, 3, 3));
    assert_eq!(reachable_overlay(&state), hs(&[1, 2]));
}

/// Bramki `syncPlayerUnitSelectionOnMap` (`main.ts:7115-7134`): brak zaznaczenia (`:7116`),
/// jednostka nie gracza (`:7118`), `!stackCanMove` (`planningStackRuchLeft <= 0`, `:14701-14703`),
/// `isAwaitingFirstPlayerCity()` (`:7123`) -> pusty zasieg.
#[test]
fn bramki_zaznaczenia_ruchu_i_pierwszego_miasta() {
    let mut none = corridor(6, 3, 3);
    none.selected_unit_id = None;
    assert!(reachable_overlay(&none).is_empty());

    let mut enemy = corridor(6, 3, 3);
    enemy.units[0].owner_id = PlayerId::new(ENEMY);
    assert!(reachable_overlay(&enemy).is_empty());

    // Stos: 900 ma ruch 3, 901 na tym samym heksie 0 -> minimum stosu 0.
    let mut tired = corridor(6, 3, 3);
    tired.units.push(unit(901, HUMAN, 0, 0, 3));
    assert!(reachable_overlay(&tired).is_empty());

    let mut awaiting = corridor(6, 3, 3);
    awaiting.gracz_kiedys_mial_miasto = false;
    assert!(reachable_overlay(&awaiting).is_empty());
    // Miasto gracza na mapie konczy oczekiwanie (`first-player-city.ts:16`).
    awaiting.cities.push(city(79, HUMAN, 5));
    assert_eq!(reachable_overlay(&awaiting), hs(&[1, 2, 3]));
}

/// Stos gracza porusza sie wspolnie: ruch planowania = minimum stosu (`unitWithPlanningStackRuch`,
/// `armyMerge.ts:1180-1186`): 900 ruch 3, 901 na (0,0) ruch 1 -> zasieg z budzetem 1: [(1,0)].
#[test]
fn zasieg_stosu_z_minimum_ruchu() {
    let mut state = corridor(6, 3, 3);
    state.units.push(unit(901, HUMAN, 0, 1, 3));
    assert_eq!(reachable_overlay(&state), hs(&[1]));
}

// ---------------------------------------------------------------------------
// pathRoute: marchPathPlan + turnStops (main.ts:31110-31211)
// ---------------------------------------------------------------------------

/// Wektor P1 (trasa wieloturowa, `turnStops`): plan marszu 900 -> (5,0), ruch 2 / ture.
/// `planPathTurns` (`planned-march.ts:241-268`), `perTurn` = `max(1, u.ruch=2)` = 2:
/// i0 acc1; i1 acc2; i2 2+1>2 -> push (2,0) t1, t2, acc1; i3 acc2; i4 2+1>2 -> push (4,0) t2, t3,
/// acc1; koniec (5,0) != (4,0) -> push (5,0) t3. `hexes` = [(0,0), ...fullPath] (`main.ts:31175-31177`).
#[test]
fn p1_trasa_wieloturowa_turn_stops() {
    let mut state = corridor(6, 2, 2);
    plan_to(&mut state, 5);
    let expected = PathRouteDto {
        hexes: hs(&[0, 1, 2, 3, 4, 5]),
        turn_stops: vec![stop(2, 1), stop(4, 2), stop(5, 3)],
    };
    assert_eq!(path_route_overlay(&state, None), Some(expected.clone()));
    // Plan ma pierwszenstwo nad kursorem (`main.ts:32335-32338`).
    assert_eq!(
        path_route_overlay(&state, Some(PositionDto::new(1, 0))),
        Some(expected)
    );
}

/// Hover bez planu (`refreshHoverPathPreview`, `main.ts:31181-31211`) przez `preview_path` (P4-1H):
/// kursor (3,0), ruch 2: i0 acc1, i1 acc2, i2 push (2,0) t1, koniec (3,0) t2. Brak zaznaczenia -> `None`.
#[test]
fn hover_przez_preview_path() {
    let state = corridor(6, 2, 2);
    assert_eq!(
        path_route_overlay(&state, Some(PositionDto::new(3, 0))),
        Some(PathRouteDto {
            hexes: hs(&[0, 1, 2, 3]),
            turn_stops: vec![stop(2, 1), stop(3, 2)],
        })
    );
    let mut none = state.clone();
    none.selected_unit_id = None;
    assert_eq!(
        path_route_overlay(&none, Some(PositionDto::new(3, 0))),
        None
    );
    // Kursor na heksie jednostki: `planPathTurns` -> `fullPath = []` -> `clearPathRoute()`.
    assert_eq!(
        path_route_overlay(&state, Some(PositionDto::new(0, 0))),
        None
    );
}

/// Wektor P2 (trasa a mgla, `applyFogToPathPlan`): pin C-RUCH-Q1=B (`planned-march.ts:56-75`):
/// `applyFogToPathPlan` zwraca plan BEZ zmian - trasa NIE jest skracana na granicy widocznosci
/// (wariant „slepy” `_applyFogToPathPlanBlind` `:78+` jest martwy). Mgla aktywna, widoczne tylko
/// (0,0) i (1,0), cel (5,0) w mgle: `fullPath` i `turnStops` jak bez mgly (P1), a `pathRoute`
/// producenta = trasa z `marchPathPlan` po mgle.
#[test]
fn p2_mgla_nie_skraca_trasy_turn_stops_po_mgle() {
    let mut state = corridor(6, 2, 2);
    plan_to(&mut state, 5);
    let model = PlayableMoveModel::from_state(&state);
    let unit = model.jednostka(UnitId::new(MOVER)).expect("mover");
    let stack = player_stack_at(&model.jednostki, unit);
    let occ = occupied_for_move(&state, unit.owner_id, &[UnitId::new(MOVER)]);
    let mover = unit_with_planning_stack_ruch(unit, &stack);
    let per_turn = per_turn_move_for_unit(unit);
    let fog = MarchFogContext {
        fog_active: true,
        visible: HashSet::from([(0, 0), (1, 0)]),
        attack_on_visible_enemy: false,
    };
    let fogged = march_path_plan(
        &mover,
        5,
        0,
        &model.mapa,
        &occ,
        per_turn,
        None,
        Some(&fog),
        None,
    );
    let route = path_route_of(PositionDto::new(0, 0), &fogged).expect("trasa przez mgle");
    assert_eq!(
        route,
        PathRouteDto {
            hexes: hs(&[0, 1, 2, 3, 4, 5]),
            turn_stops: vec![stop(2, 1), stop(4, 2), stop(5, 3)],
        }
    );
    assert_eq!(path_route_overlay(&state, None), Some(route));
}

/// Trasa przez wlasna jednostke (`computePath` czyta tylko blokady, `passThrough` nie wplywa,
/// `setup.ts:1019+`): 901 na (2,0) nie przerywa trasy do (4,0); obca jednostka na (2,0) - tak
/// (brak objazdu w korytarzu -> `fullPath = []` -> `None`).
#[test]
fn trasa_przez_wlasne_tak_przez_obce_nie() {
    let mut own = corridor(6, 2, 2);
    own.units.push(unit(901, HUMAN, 2, 2, 2));
    let route = path_route_overlay(&own, Some(PositionDto::new(4, 0))).expect("trasa");
    assert_eq!(route.hexes, hs(&[0, 1, 2, 3, 4]));
    assert_eq!(route.turn_stops, vec![stop(2, 1), stop(4, 2)]);

    let mut foreign = corridor(6, 2, 2);
    foreign.units.push(unit(901, ENEMY, 2, 2, 2));
    assert_eq!(
        path_route_overlay(&foreign, Some(PositionDto::new(4, 0))),
        None
    );
}
