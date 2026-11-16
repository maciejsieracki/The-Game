//! P4-1H Q5 (`R-RUSTPORT-P4-1H-PREVIEW-Q5`, #251): zapytanie `preview_path` (web
//! `refreshPlannedMarchPreview` `main.ts:31146-31179` + `refreshHoverPathPreview` `main.ts:31181-31209`
//! @ `07d2fbd72`) zwracajace `PathRouteDto { hexes, turn_stops }`.
//!
//! Wartosci oczekiwane policzone RECZNIE z kodu pinu (`planPathTurns`, `game/planned-march.ts:215-285`),
//! nie z kodu produkcyjnego Rust. Koszty terenu: `gra/data/terrain-movement.json` @07d2fbd72
//! `Rownina: 1`, `Wzgorza: 2`, `Morze: 99` (>= 90 -> `Infinity`, `units/setup.ts:443`); adapter Q4
//! `Plains -> Rownina`, `Hills -> Wzgorza`, `Water -> Morze` (`playable_movement::teren_of`).
//!
//! Mapy sa korytarzem jednego rzedu (`r = 0`), wiec `computePath` ma dokladnie jedna trase (brak
//! remisow kolejnosci w kolejce priorytetowej); sasiedzi spoza mapy nie istnieja w `map.hexes`.

use civ_engine::domain::playable::MovementPoints;
use civ_engine::domain::playable::PlayablePlannedMarch;
use civ_engine::domain::playable_movement::{preview_path, preview_path_plan};
use civ_engine::{
    PlayableGame, PlayableMap, PlayableState, PlayableTerrain, PlayableTile, PlayableUnit,
    PlayableUnitKind, PlayerId, PositionDto, StartGameParams, UnitId,
};
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::{PathRouteDto, PathTurnStopDto};

const HUMAN: u64 = 1;
const ENEMY: u64 = 2;
const MOVER: u64 = 900;

fn tile(x: u16, terrain: PlayableTerrain) -> PlayableTile {
    PlayableTile {
        position: PositionDto::new(x, 0),
        terrain,
        passable: terrain.is_passable(),
    }
}

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

/// Korytarz `x = 0..terrains.len()`, `y = 0`; jedna jednostka gracza `MOVER` na `(0, 0)`.
fn corridor(terrains: &[PlayableTerrain], movement: u8, movement_max: u8) -> PlayableState {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone();
    let width = u16::try_from(terrains.len()).expect("szerokosc");
    state.map = PlayableMap {
        width,
        height: 1,
        tiles: terrains
            .iter()
            .enumerate()
            .map(|(x, t)| tile(u16::try_from(x).expect("x"), *t))
            .collect(),
        improvements: Vec::new(),
    };
    state.cities.clear();
    state.units = vec![unit(MOVER, HUMAN, 0, movement, movement_max)];
    state.planned_marches.clear();
    state.economy = Default::default();
    state
}

fn plains(n: usize) -> Vec<PlayableTerrain> {
    vec![PlayableTerrain::Plains; n]
}

fn h(q: i32) -> HexCoord {
    HexCoord::new(q, 0)
}

fn stop(q: i32, turn: u32) -> PathTurnStopDto {
    PathTurnStopDto { hex: h(q), turn }
}

fn dest(x: u16) -> Option<PositionDto> {
    Some(PositionDto::new(x, 0))
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

/// Wektor W1 (dwa przystanki). Pin `planPathTurns` (`planned-march.ts:215-285`):
/// `computePath` (0,0)->(4,0) = `[(1,0),(2,0),(3,0),(4,0)]`, kazdy krok `stepCost = 1` (`:247-248`,
/// Rownina 1); `perTurn = Math.max(1, perTurnMoveForUnit(u))` = `max(1, u.ruch=2)` = 2 (`:241`,
/// `main.ts:31094`).
/// - i=0: `0+1 <= 2` -> acc 1 (`:260`); i=1: `1+1 <= 2` -> acc 2;
/// - i=2: `2+1 > 2` -> push `prev=(2,0)` z `turn=1` (`:249-255`), `turnNum=2`, acc 1 (`:257-258`);
/// - i=3: `1+1 <= 2` -> acc 2;
/// - koniec: ostatni `(4,0)` != `(2,0)` -> push `{4,0,turn 2}` (`:264-268`).
///
/// `hexes` = `[{q: u.q, r: u.r}, ...plan.fullPath]` (`main.ts:31205`).
#[test]
fn w1_trasa_wieloturowa_dwa_przystanki_jak_plan_path_turns() {
    let state = corridor(&plains(5), 2, 2);
    let route = preview_path(&state, UnitId::new(MOVER), dest(4)).expect("trasa");
    assert_eq!(
        route,
        PathRouteDto {
            hexes: vec![h(0), h(1), h(2), h(3), h(4)],
            turn_stops: vec![stop(2, 1), stop(4, 2)],
        }
    );
}

/// Wektor W2 (cztery przystanki, koszty mieszane). Korytarz `Plains, Hills, Plains, Hills, Plains`,
/// `perTurn = 2`; kroki `[(1,0)=2, (2,0)=1, (3,0)=2, (4,0)=1]` (Wzgorza 2, Rownina 1).
/// - i=0: `0+2 <= 2` -> acc 2;
/// - i=1: `2+1 > 2` -> push `{1,0,t1}`, t=2, acc 1;
/// - i=2: `1+2 > 2` -> push `{2,0,t2}`, t=3, acc 2;
/// - i=3: `2+1 > 2` -> push `{3,0,t3}`, t=4, acc 1;
/// - koniec: `(4,0)` != `(3,0)` -> push `{4,0,t4}`.
#[test]
fn w2_koszty_mieszane_przystanek_co_ture() {
    use PlayableTerrain::{Hills, Plains};
    let state = corridor(&[Plains, Hills, Plains, Hills, Plains], 2, 2);
    let route = preview_path(&state, UnitId::new(MOVER), dest(4)).expect("trasa");
    assert_eq!(route.hexes, vec![h(0), h(1), h(2), h(3), h(4)]);
    assert_eq!(
        route.turn_stops,
        vec![stop(1, 1), stop(2, 2), stop(3, 3), stop(4, 4)]
    );
}

/// Wektor W3 (`perTurn` z `ruch`, nie z `ruchLeft`): `perTurnMoveForUnit` czyta `u.ruch`
/// (`main.ts:31094`), wiec jednostka z `ruchLeft = 0` i `ruch = 3` dostaje przystanki co 3 heksy:
/// i=0..2 acc 1,2,3; i=3: `3+1 > 3` -> push `{3,0,t1}`, t=2, acc 1; i=4 acc 2; koniec `{5,0,t2}`.
#[test]
fn w3_per_turn_z_ruch_max_a_nie_z_ruch_left() {
    let state = corridor(&plains(6), 0, 3);
    let route = preview_path(&state, UnitId::new(MOVER), dest(5)).expect("trasa");
    assert_eq!(route.hexes, vec![h(0), h(1), h(2), h(3), h(4), h(5)]);
    assert_eq!(route.turn_stops, vec![stop(3, 1), stop(5, 2)]);
}

/// Trasa jednoturowa: `(0,0)->(2,0)`, `perTurn 2`, acc 1, 2 -> brak przekroczenia; koniec `{2,0,t1}`.
#[test]
fn trasa_jednoturowa_jeden_przystanek() {
    let state = corridor(&plains(5), 2, 2);
    let route = preview_path(&state, UnitId::new(MOVER), dest(2)).expect("trasa");
    assert_eq!(route.hexes, vec![h(0), h(1), h(2)]);
    assert_eq!(route.turn_stops, vec![stop(2, 1)]);
}

/// Jednostka z aktywnym planem ignoruje `destination` (`main.ts:32335-32338`: przy
/// `plannedMarches.has(uSel.id)` web woła `refreshPlannedMarchPreview` i wraca, bez
/// `refreshHoverPathPreview(hit)`). Plan do `(2,0)`, kursor na `(4,0)` -> trasa planu.
#[test]
fn plan_marszu_ma_pierwszenstwo_nad_destination() {
    let mut state = corridor(&plains(5), 2, 2);
    plan_to(&mut state, 2);
    let route = preview_path(&state, UnitId::new(MOVER), dest(4)).expect("trasa planu");
    assert_eq!(route.hexes, vec![h(0), h(1), h(2)]);
    assert_eq!(route.turn_stops, vec![stop(2, 1)]);
    // Bez kursora (np. `refreshPlannedMarchPreview(u.id)` po wydaniu rozkazu, `main.ts:31292`).
    assert_eq!(preview_path(&state, UnitId::new(MOVER), None), Some(route));
}

/// Brak trasy -> `None` (`plan.fullPath.length === 0` -> `clearPathRoute()`, `main.ts:31171-31173`,
/// `:31203`, `:31209`).
#[test]
fn brak_trasy_daje_none() {
    use PlayableTerrain::{Plains, Water};
    // Woda przecina korytarz: `Morze` = `Infinity` (`setup.ts:443`), `moveCostFnForUnit` ->
    // `undefined` (brak Zeglugi); heks nie-docelowy z `Infinity` jest pomijany (`setup.ts:1156`) ->
    // `computePath` = `[]` -> `planPathTurns` `empty` (`planned-march.ts:238-239`).
    let water = corridor(&[Plains, Plains, Water, Plains], 2, 2);
    assert_eq!(preview_path(&water, UnitId::new(MOVER), dest(3)), None);
    // Cel = heks jednostki: `planPathTurns` zwraca `fullPath: []` (`planned-march.ts:234-236`).
    let flat = corridor(&plains(3), 2, 2);
    assert_eq!(preview_path(&flat, UnitId::new(MOVER), dest(0)), None);
    // Cel poza mapa: brak heksa w `map.hexes` -> `computePath` = `[]`.
    assert_eq!(preview_path(&flat, UnitId::new(MOVER), dest(7)), None);
    // Brak celu i brak planu: web nie rysuje trasy.
    assert_eq!(preview_path(&flat, UnitId::new(MOVER), None), None);
    // Nieznana jednostka: `!u` -> `clearPathRoute()` (`main.ts:31152-31156`).
    assert_eq!(preview_path(&flat, UnitId::new(4242), dest(2)), None);
}

/// Cel na wodzie JEST trasa: w `computePath` heks docelowy jest "always passable as final step"
/// (`setup.ts:1141-1152`, `enterCost = 1` tylko dla kolejki), a `pathCost` liczy `Infinity` jako 0
/// (`setup.ts:1211-1212`). Kroki `[(1,0)=1, (2,0)=0]`, `perTurn 2`: acc 1, 1 -> brak przekroczenia;
/// koniec `{2,0,t1}` (`planned-march.ts:264-268`).
#[test]
fn cel_na_wodzie_ma_trase_z_zerowym_krokiem() {
    use PlayableTerrain::{Plains, Water};
    let water = corridor(&[Plains, Plains, Water, Plains], 2, 2);
    let route = preview_path(&water, UnitId::new(MOVER), dest(2)).expect("cel zawsze przejezdny");
    assert_eq!(route.hexes, vec![h(0), h(1), h(2)]);
    assert_eq!(route.turn_stops, vec![stop(2, 1)]);
}

/// Zajetosc `occupiedForMove` (`main.ts:14578-14584`, `setup.ts:759-776`; `occupied.has` -> pominiecie
/// heksu nie-docelowego, `setup.ts:1157`): obca jednostka blokuje
/// korytarz (brak trasy), wlasna jest przejsciem (`passThrough`) i trasa przez nia istnieje.
#[test]
fn zajetosc_obca_blokuje_wlasna_przepuszcza() {
    let mut own = corridor(&plains(5), 2, 2);
    own.units.push(unit(901, HUMAN, 2, 2, 2));
    let route = preview_path(&own, UnitId::new(MOVER), dest(4)).expect("trasa przez wlasna");
    assert_eq!(route.hexes, vec![h(0), h(1), h(2), h(3), h(4)]);
    assert_eq!(route.turn_stops, vec![stop(2, 1), stop(4, 2)]);

    let mut foreign = corridor(&plains(5), 2, 2);
    foreign.units.push(unit(902, ENEMY, 2, 2, 2));
    assert_eq!(preview_path(&foreign, UnitId::new(MOVER), dest(4)), None);
}

/// `budget = undefined` (`main.ts:31167`, `:31199`) -> `budget = movementBudget ?? perTurn`
/// (`planned-march.ts:270`): segment liczony budzetem `perTurn = 2`, nie `ruchLeft = 1`.
/// `truncatePathToBudget` (`planned-march.ts:186-212`): koszt `[(1,0)]` = 1 <= 2, `[(1,0),(2,0)]`
/// = 2 <= 2, `[(1,0),(2,0),(3,0)]` = 3 > 2 -> segment `[(1,0),(2,0)]`, `segmentCost = 2`.
/// Mutacja `budget = Some(ruchLeft)` daje segment `[(1,0)]` -> FAIL.
#[test]
fn budget_none_segment_liczony_per_turn() {
    let state = corridor(&plains(5), 1, 2);
    let plan = preview_path_plan(&state, UnitId::new(MOVER), dest(4)).expect("plan");
    assert_eq!(plan.segment_path, vec![(1, 0), (2, 0)]);
    assert_eq!(plan.segment_cost, 2.0);
    assert_eq!(plan.full_path, vec![(1, 0), (2, 0), (3, 0), (4, 0)]);
    assert!(plan.reachable);
}

/// Zapytanie jest czysta funkcja: stan przed = stan po (serializacja), takze z planem marszu.
#[test]
fn zapytanie_nie_zmienia_stanu() {
    let mut state = corridor(&plains(5), 2, 2);
    let before = serde_json::to_string(&state).expect("serializacja");
    let route = preview_path(&state, UnitId::new(MOVER), dest(4));
    assert!(route.is_some());
    assert_eq!(serde_json::to_string(&state).expect("serializacja"), before);
    assert!(
        state.planned_marches.is_empty(),
        "podglad nie zapisuje planu"
    );

    plan_to(&mut state, 3);
    let before_plan = serde_json::to_string(&state).expect("serializacja");
    let _ = preview_path(&state, UnitId::new(MOVER), dest(1));
    let _ = preview_path_plan(&state, UnitId::new(MOVER), dest(1));
    assert_eq!(
        serde_json::to_string(&state).expect("serializacja"),
        before_plan
    );
}

/// Stos `playerStackAt` (`armyMerge.ts:89-105`, `:243-252`): jednostki wlasciciela na heksie bez
/// garnizonu i z tym samym `stackGroupIdOf` (`owner|q,r`, `armyMerge.ts:57-62`), w kolejnosci `units`;
/// `unitWithPlanningStackRuch` (`armyMerge.ts:918-921`, `:1180-1186`) = minimum `ruchLeft` stosu.
#[test]
fn stos_i_pula_ruchu_jak_army_merge() {
    use civ_engine::domain::playable_movement::{
        player_stack_at, unit_with_planning_stack_ruch, PlayableMoveModel,
    };
    let mut state = corridor(&plains(3), 2, 2);
    state.units.push(unit(901, HUMAN, 0, 1, 2)); // ten sam heks i wlasciciel -> w stosie
    state.units.push(unit(902, ENEMY, 0, 0, 2)); // obcy na heksie -> poza stosem
    state.units.push(unit(903, HUMAN, 1, 0, 2)); // inny heks -> poza stosem
    let model = PlayableMoveModel::from_state(&state);
    let mover = model.jednostka(UnitId::new(MOVER)).expect("jednostka");
    let stack = player_stack_at(&model.jednostki, mover);
    let ids: Vec<&str> = stack.iter().map(|u| u.id.as_str()).collect();
    assert_eq!(ids, vec!["900", "901"]);
    let pooled = unit_with_planning_stack_ruch(mover, &stack);
    assert_eq!(pooled.ruch_left, 1.0);
    assert_eq!(pooled.ruch, 2.0);
    assert_eq!(unit_with_planning_stack_ruch(mover, &[]).ruch_left, 0.0);
}
