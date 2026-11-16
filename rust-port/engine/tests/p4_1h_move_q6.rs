//! P4-1H Q6 (`R-RUSTPORT-P4-1H-MOVE-Q6`, #252): komenda `move_unit` = web `planMarchTo`
//! (`gra/src/main.ts:31213-31298` @ `07d2fbd72`) + pierwszy segment `executeMarchSegmentForUnit`
//! (`main.ts:31477-31544`) ze skutkami konca animacji w zakresie stanu (`main.ts:44097-44107`,
//! `:44180-44194`).
//!
//! Wartosci oczekiwane policzone RECZNIE z kodu pinu, nie z kodu Rust:
//! - koszty terenu `gra/data/terrain-movement.json` @07d2fbd72: `Rownina: 1`, `Morze: 99` (>= 90 ->
//!   `Infinity`, `units/setup.ts:443`); adapter Q4: `Plains -> Rownina`, `Water -> Morze`;
//! - droga: `cost / ROAD_MOVE_SPEED_MULT` = `1 / 3` (`map/road-movement.ts:14`, `:81`);
//! - `planPathTurns` (`game/planned-march.ts:215-285`): `perTurn = max(1, u.ruch)`
//!   (`main.ts:31084-31095`), segment = `truncatePathToBudget` (`:182-209`) +
//!   `trimSegmentEndOffPassThrough` (`:271-275`, `units/setup.ts:800-812`);
//! - limit stosu `armyStackLimit()` = `BATTLE_MAX_PER_SIDE` = `MAX_PER_SIDE` = **500**
//!   (`main.ts:4358-4360`, `battle/battleScene.ts:721`, `:723`), `canJoinStackAt`
//!   (`game/army-stack-limit.ts:56-66`): `there + moving.length <= limit`;
//! - `deductStackRuchLeft` (`armyMerge.ts:961`): kazdy w stosie = `max(0, min(ruchLeft) - koszt)`.
//!
//! Mapy sa korytarzem jednego rzedu (`r = 0`), wiec `computePath` ma dokladnie jedna trase.

use civ_engine::domain::playable::{
    MovementPoints, PlayableHexImprovement, PlayableMarchStopReason, PlayablePlannedMarch,
};
use civ_engine::domain::playable_movement::{
    plan_march_to, preview_path, MarchOrderOutcome, MarchSegmentOutcome,
};
use civ_engine::{
    PlayableCity, PlayableError, PlayableGame, PlayableMap, PlayablePlayer, PlayableState,
    PlayableTerrain, PlayableTile, PlayableUnit, PlayableUnitKind, PlayerId, PositionDto,
    StartGameParams, UnitId,
};
use civ_view_model::ids::HexCoord;
use civ_view_model::overlays::PathTurnStopDto;

const HUMAN: u64 = 1;
const ENEMY: u64 = 2;
const MOVER: u64 = 900;
/// `armyStackLimit()` = 500 (`main.ts:4358-4360` -> `battle/battleScene.ts:721`, `:723`).
const ARMY_STACK_LIMIT_PIN: i64 = 500;

fn tile(x: u16, terrain: PlayableTerrain) -> PlayableTile {
    PlayableTile {
        position: PositionDto::new(x, 0),
        terrain,
        passable: terrain.is_passable(),
    }
}

fn unit(id: u64, owner: u64, x: u16, movement: f64, movement_max: f64) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, 0),
        movement: MovementPoints::new(movement),
        movement_max: MovementPoints::new(movement_max),
        selected: false,
    }
}

fn city(id: u64, owner: u64, x: u16) -> PlayableCity {
    PlayableCity {
        id: civ_engine::CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("Miasto {id}"),
        position: PositionDto::new(x, 0),
        is_capital: false,
        population: 1,
        culture: 0,
    }
}

fn pos(x: u16) -> PositionDto {
    PositionDto::new(x, 0)
}

/// Korytarz `x = 0..terrains.len()`, `y = 0`; jednostka gracza `MOVER` na `(0, 0)`; gracz AI `ENEMY`.
fn corridor(terrains: &[PlayableTerrain], movement: f64, movement_max: f64) -> PlayableState {
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
    state.players.push(PlayablePlayer {
        id: PlayerId::new(ENEMY),
        name: "AI".to_owned(),
        civilization: "player-2".to_owned(),
        is_human: false,
    });
    state.planned_marches.clear();
    state.economy = Default::default();
    state
}

fn plains(n: usize) -> Vec<PlayableTerrain> {
    vec![PlayableTerrain::Plains; n]
}

/// Gra z zaznaczonym `MOVER`.
fn game(state: PlayableState) -> PlayableGame {
    let mut game = PlayableGame::from_state(state);
    game.select_unit(MOVER).expect("zaznaczenie");
    game
}

fn unit_of(game: &PlayableGame, id: u64) -> &PlayableUnit {
    game.state()
        .units
        .iter()
        .find(|u| u.id.get() == id)
        .expect("jednostka")
}

fn plan(dest: u16, attack: Option<u64>) -> PlayablePlannedMarch {
    PlayablePlannedMarch {
        unit_id: UnitId::new(MOVER),
        dest_q: i32::from(dest),
        dest_r: 0,
        attack_unit_id: attack.map(UnitId::new),
        general_target_id: None,
    }
}

fn stop(q: i32, turn: u32) -> PathTurnStopDto {
    PathTurnStopDto {
        hex: HexCoord::new(q, 0),
        turn,
    }
}

// --- 1. Cel w zasiegu jednym rozkazem: dotarcie, plan usuniety --------------------------------

#[test]
fn cel_w_zasiegu_dociera_i_usuwa_plan() {
    // Rowniny, ruch 3: trasa (1),(2),(3) koszt 3 <= budzet 3 -> segment = cala trasa, `arrived`
    // -> `finishMarchSegmentHints` -> `plannedMarches.delete` (`main.ts:31463-31464`).
    let mut game = game(corridor(&plains(5), 3.0, 3.0));
    game.move_unit(MOVER, pos(3)).expect("rozkaz");
    let u = unit_of(&game, MOVER);
    assert_eq!(u.position, pos(3));
    assert_eq!(u.movement, MovementPoints::new(0.0));
    assert!(
        game.state().planned_marches.is_empty(),
        "plan usuniety po dotarciu"
    );
    assert!(game.state().march_attack_targets.is_empty());
    assert!(game
        .state()
        .is_moved_by_player_this_turn(UnitId::new(MOVER)));
}

// --- 2. Cel wieloturowy: plan zostaje, `turn_stops` z `planPathTurns` -------------------------

#[test]
fn cel_wieloturowy_zostawia_plan_i_turn_stops() {
    let state = corridor(&plains(6), 2.0, 2.0);
    // Przed rozkazem: z (0,0) do (5,0), perTurn 2: kroki po 1 -> postoj (2) tura 1, (4) tura 2,
    // koniec (5) tura 3 (`planned-march.ts:235-262`).
    let before = preview_path(&state, UnitId::new(MOVER), Some(pos(5))).expect("trasa");
    assert_eq!(before.turn_stops, vec![stop(2, 1), stop(4, 2), stop(5, 3)]);

    let mut game = game(state);
    game.move_unit(MOVER, pos(5)).expect("rozkaz");
    let u = unit_of(&game, MOVER);
    // Segment = `truncatePathToBudget(path, 2)` = (1),(2), koszt 2.
    assert_eq!(u.position, pos(2));
    assert_eq!(u.movement, MovementPoints::new(0.0));
    assert_eq!(game.state().planned_marches, vec![plan(5, None)]);
    // `shouldStopAtObstacle`: segment krotszy i `segCost >= budget` -> brak powodu (`:325-327`).
    assert!(game.state().march_stop_notified.is_empty());
    assert!(game.state().march_stop_detail.is_empty());
    // Podglad trasy planu z nowej pozycji (2,0): (3),(4) tura 1 -> postoj (4), (5) tura 2.
    let after = preview_path(game.state(), UnitId::new(MOVER), None).expect("trasa planu");
    assert_eq!(after.turn_stops, vec![stop(4, 1), stop(5, 2)]);
}

// --- 3. Brak trasy -> blad zgodny z pinem, stan bez zmian ------------------------------------

#[test]
fn brak_trasy_daje_march_no_route_bez_zmian() {
    // (1,0) woda (`Infinity`, nie jest celem) -> `computePath` = [] -> `fullPath` puste
    // (`main.ts:31267-31270`).
    let state = corridor(
        &[
            PlayableTerrain::Plains,
            PlayableTerrain::Water,
            PlayableTerrain::Plains,
        ],
        2.0,
        2.0,
    );
    let mut game = game(state);
    let before = game.state().clone();
    assert_eq!(
        game.move_unit(MOVER, pos(2)),
        Err(PlayableError::MarchNoRoute)
    );
    assert_eq!(game.state(), &before);
    // Cel poza mapa: `computePath` -> `!map.hexes.has(dest)` -> [].
    assert_eq!(
        game.move_unit(MOVER, pos(9)),
        Err(PlayableError::MarchNoRoute)
    );
    // Cel = pozycja jednostki: `planPathTurns` -> `fullPath: []` (`:226-228`).
    assert_eq!(
        game.move_unit(MOVER, pos(0)),
        Err(PlayableError::MarchNoRoute)
    );
    assert_eq!(game.state(), &before);
    assert_eq!(
        PlayableError::MarchNoRoute.to_string(),
        "Marsz przerwany: brak trasy do celu"
    );
}

#[test]
fn cel_nieprzejezdny_obok_konczy_sie_wejsciem_kosztem_zero() {
    // Cel = woda tuz obok: `computePath` wchodzi na CEL nawet o koszcie `Infinity` (galaz celu przed
    // pominieciem nieprzejezdnych, `setup.ts` computePath), wiec `fullPath` = [(1)]. `pathCost` liczy
    // `Infinity` jako 0 (`units/setup.ts:1201-1215`: `total += c === Infinity ? 0 : c`), wiec
    // `truncatePathToBudget` przyjmuje (1) (koszt 0 <= 2) -> dotarcie kosztem 0, plan usuniety.
    // Zaokretowanie (`applyEmbarkStateAfterMove`, `main.ts:44106`) nie ma pola w `PlayableState`
    // (luka stanu, opisana w raporcie).
    let state = corridor(&[PlayableTerrain::Plains, PlayableTerrain::Water], 2.0, 2.0);
    let mut state_for_fn = state.clone();
    let mut game = game(state);
    game.move_unit(MOVER, pos(1)).expect("rozkaz przyjety");
    assert_eq!(unit_of(&game, MOVER).position, pos(1));
    assert_eq!(unit_of(&game, MOVER).movement, MovementPoints::new(2.0));
    assert!(game.state().planned_marches.is_empty());
    let outcome = plan_march_to(&mut state_for_fn, UnitId::new(MOVER), pos(1), None).expect("ok");
    assert_eq!(
        outcome,
        MarchOrderOutcome::Segment(MarchSegmentOutcome::Moved {
            to: pos(1),
            cost: 0.0,
            arrived: true,
            stop_reason: None,
            attack_pending: false,
        })
    );
}

// --- 4. Obce miasto ----------------------------------------------------------------------------

#[test]
fn obce_miasto_na_celu_odrzuca_rozkaz() {
    // `!attackTarget && !canOccupyHexForUnit` (`main.ts:31271-31277`).
    let mut state = corridor(&plains(3), 2.0, 2.0);
    state.cities.push(city(77, ENEMY, 2));
    let mut game = game(state);
    let before = game.state().clone();
    assert_eq!(
        game.move_unit(MOVER, pos(2)),
        Err(PlayableError::MarchForeignCity)
    );
    assert_eq!(game.state(), &before);
}

#[test]
fn obce_miasto_na_trasie_blokuje_trase() {
    // `occupiedForMove` dodaje heks obcego miasta do blokad (`main.ts:14578-14584`): (1,0) zablokowany,
    // jedyna trasa do (2,0) nie istnieje.
    let mut state = corridor(&plains(3), 2.0, 2.0);
    state.cities.push(city(77, ENEMY, 1));
    let mut game = game(state);
    let before = game.state().clone();
    assert_eq!(
        game.move_unit(MOVER, pos(2)),
        Err(PlayableError::MarchNoRoute)
    );
    assert_eq!(game.state(), &before);
}

// --- 5. Limit stosu 500 ------------------------------------------------------------------------

fn with_stack_at(n: u64, x: u16) -> PlayableState {
    let mut state = corridor(&plains(3), 2.0, 2.0);
    for i in 0..n {
        state.units.push(unit(10_000 + i, HUMAN, x, 1.0, 1.0));
    }
    state
}

#[test]
fn limit_stosu_500_plus_1_odmowa() {
    let mut game = game(with_stack_at(500, 2));
    let before = game.state().clone();
    assert_eq!(
        game.move_unit(MOVER, pos(2)),
        Err(PlayableError::MarchStackLimit {
            limit: ARMY_STACK_LIMIT_PIN
        })
    );
    assert_eq!(game.state(), &before);
    assert_eq!(
        PlayableError::MarchStackLimit {
            limit: ARMY_STACK_LIMIT_PIN
        }
        .to_string(),
        "Armia nie może mieć więcej niż 500 jednostek (limit bitwy)."
    );
}

#[test]
fn limit_stosu_499_plus_1_dopuszczone() {
    let mut game = game(with_stack_at(499, 2));
    game.move_unit(MOVER, pos(2)).expect("499 + 1 = 500 <= 500");
    // Pelna trasa konczy sie na wlasnym stosie (scalenie, `trimSegmentEndOffPassThrough` nie tnie
    // pelnej trasy), `trimPathToStackRoom` nie przycina (500 <= 500) -> dotarcie.
    assert_eq!(unit_of(&game, MOVER).position, pos(2));
    assert!(game.state().planned_marches.is_empty());
    let on_hex = game
        .state()
        .units
        .iter()
        .filter(|u| u.position == pos(2) && u.owner_id == PlayerId::new(HUMAN))
        .count();
    assert_eq!(on_hex as i64, ARMY_STACK_LIMIT_PIN);
}

// --- 6. Cel = wlasna jednostka ----------------------------------------------------------------

#[test]
fn cel_wlasna_jednostka_to_zwykly_marsz_ze_scaleniem() {
    // `attackTarget` pomija wlasne jednostki (`x.ownerId !== u.ownerId`, `main.ts:31245-31247`);
    // heks wlasnej jednostki jest `passThrough`, pelna trasa moze na nim sie skonczyc.
    let mut state = corridor(&plains(4), 2.0, 2.0);
    state.units.push(unit(901, HUMAN, 2, 1.0, 1.0));
    let mut game = game(state);
    game.move_unit(MOVER, pos(2)).expect("rozkaz");
    assert_eq!(unit_of(&game, MOVER).position, pos(2));
    assert!(game.state().planned_marches.is_empty());
    assert!(game.state().march_attack_targets.is_empty());
    // Druga jednostka nie ruszyla (inny stos) i nie stracila ruchu.
    assert_eq!(unit_of(&game, 901).movement, MovementPoints::new(1.0));
}

#[test]
fn wlasna_jednostka_na_trasie_nie_jest_koncem_segmentu() {
    // R1 (`planned-march.ts:271-275`): segment (1),(2) obciety budzetem 2 konczylby sie na wlasnej
    // jednostce (2,0) -> `trimSegmentEndOffPassThrough` -> (1); koszt 1, zostaje 1 ruchu.
    let mut state = corridor(&plains(5), 2.0, 2.0);
    state.units.push(unit(901, HUMAN, 2, 1.0, 1.0));
    let mut game = game(state);
    game.move_unit(MOVER, pos(4)).expect("rozkaz");
    assert_eq!(unit_of(&game, MOVER).position, pos(1));
    assert_eq!(unit_of(&game, MOVER).movement, MovementPoints::new(1.0));
    assert_eq!(game.state().planned_marches, vec![plan(4, None)]);
}

// --- 7. Cel = wrog: zapis planu, bez bitwy -----------------------------------------------------

#[test]
fn cel_wrog_zapisuje_plan_ataku_bez_bitwy() {
    // Wrog na (4,0): `attackTarget` = obca jednostka na celu (`main.ts:31245-31247`) ->
    // `marchDest.attackUnitId`, `syncMarchAttackTarget` (`:31124-31130`). Bez limitu stosu/miasta.
    let mut state = corridor(&plains(6), 2.0, 2.0);
    state.units.push(unit(950, ENEMY, 4, 1.0, 1.0));
    let mut game = game(state);
    game.move_unit(MOVER, pos(4)).expect("rozkaz ataku");
    // Segment (1),(2); cel ataku 2 heksy dalej -> `tryLaunchMarchAttack` falsz (`hexDistance > 1`)
    // -> `finishMarchSegmentHints` bez dotarcia: plan zostaje.
    assert_eq!(unit_of(&game, MOVER).position, pos(2));
    assert_eq!(game.state().planned_marches, vec![plan(4, Some(950))]);
    assert_eq!(
        game.state().march_attack_targets.get(&UnitId::new(MOVER)),
        Some(&UnitId::new(950))
    );
    // Wrog nietkniety (bitwa poza zakresem).
    assert_eq!(unit_of(&game, 950).position, pos(4));
}

#[test]
fn jawny_attack_unit_id_i_nieistniejacy_cel() {
    // Jawny `attackUnitId` (`main.ts:31243-31244`).
    let mut state = corridor(&plains(6), 0.0, 2.0);
    state.units.push(unit(950, ENEMY, 5, 1.0, 1.0));
    let mut game = game(state.clone());
    game.move_unit_with_attack(MOVER, pos(5), Some(950))
        .expect("rozkaz");
    assert_eq!(game.state().planned_marches, vec![plan(5, Some(950))]);
    // Nieistniejacy `attackUnitId` -> `units.find` undefined -> zwykly marsz (bez ataku).
    let mut game = game_from(state);
    game.move_unit_with_attack(MOVER, pos(4), Some(123_456))
        .expect("rozkaz");
    assert_eq!(game.state().planned_marches, vec![plan(4, None)]);
    assert!(game.state().march_attack_targets.is_empty());
}

fn game_from(state: PlayableState) -> PlayableGame {
    game(state)
}

#[test]
fn cel_wroga_w_zasiegu_konczy_na_granicy_bitwy() {
    // Wrog obok (1,0), ruch 1: segment (1) (`canOccupy` = cel ataku, `:31504-31506`), `arrived`;
    // `tryLaunchMarchAttack`: `hexDistance <= 1` -> w webie bitwa i `clearPlannedMarch(force)`.
    // Bitwa jest poza zakresem: plan z `attackUnitId` zostaje, `finishMarchSegmentHints` nie jest wolane.
    let mut state = corridor(&plains(3), 1.0, 1.0);
    state.units.push(unit(950, ENEMY, 1, 1.0, 1.0));
    let outcome = plan_march_to(&mut state, UnitId::new(MOVER), pos(1), None).expect("rozkaz");
    assert_eq!(
        outcome,
        MarchOrderOutcome::Segment(MarchSegmentOutcome::Moved {
            to: pos(1),
            cost: 1.0,
            arrived: true,
            stop_reason: None,
            attack_pending: true,
        })
    );
    assert_eq!(state.planned_marches, vec![plan(1, Some(950))]);
}

// --- 8. Brak MP: plan zapisany, bez segmentu ---------------------------------------------------

#[test]
fn brak_ruchu_zapisuje_plan_bez_segmentu() {
    let mut state = corridor(&plains(4), 0.0, 2.0);
    let before_units = state.units.clone();
    let outcome = plan_march_to(&mut state, UnitId::new(MOVER), pos(3), None).expect("rozkaz");
    assert_eq!(outcome, MarchOrderOutcome::PlannedWithoutSegment);
    assert_eq!(state.units, before_units, "brak ruchu jednostek");
    assert_eq!(state.planned_marches, vec![plan(3, None)]);
    assert!(state.is_moved_by_player_this_turn(UnitId::new(MOVER)));
}

// --- 9. Ulamkowy koszt drogi (f64) -------------------------------------------------------------

#[test]
fn ulamkowy_koszt_drogi_odejmowany_bez_zaokraglen() {
    // (1),(2) z droga: koszt 1/3 kazdy; (3) rownina koszt 1. Budzet 1: (1) 1/3, (1)(2) 2/3,
    // (1)(2)(3) 5/3 > 1 -> segment (1),(2), koszt 1/3 + 1/3. Ruch po odcinku = 1 - 2/3.
    let mut state = corridor(&plains(4), 1.0, 1.0);
    state.map.improvements = vec![
        PlayableHexImprovement {
            position: pos(1),
            ulepszenie: Some("droga".to_owned()),
            ulepszenia: None,
        },
        PlayableHexImprovement {
            position: pos(2),
            ulepszenie: Some("droga".to_owned()),
            ulepszenia: None,
        },
    ];
    let mut game = game(state);
    game.move_unit(MOVER, pos(3)).expect("rozkaz");
    let u = unit_of(&game, MOVER);
    assert_eq!(u.position, pos(2));
    let expected = 1.0 - (1.0 / 3.0 + 1.0 / 3.0);
    assert_eq!(u.movement.get(), expected);
    assert!(u.movement.get() > 0.3 && u.movement.get() < 0.34);
    assert_eq!(game.state().planned_marches, vec![plan(3, None)]);
    // Zapis JSON: ulamek jako liczba zmiennoprzecinkowa, odczyt bez straty.
    let json = serde_json::to_string(game.state()).expect("json");
    assert!(json.contains(&format!("\"movement\":{expected}")), "{json}");
    let back: PlayableState = serde_json::from_str(&json).expect("odczyt");
    assert_eq!(back.units, game.state().units);
    assert_eq!(serde_json::to_string(&back).expect("json"), json);
}

// --- 10. Stos rusza razem; pula ruchu = minimum -------------------------------------------------

#[test]
fn stos_rusza_razem_i_dzieli_minimum_ruchu() {
    // `playerStackAt` = wszystkie jednostki gracza na heksie; `planningStackRuchLeft` = min (2);
    // `deductStackRuchLeft` kazdemu `max(0, min - koszt)`.
    let mut state = corridor(&plains(5), 3.0, 3.0);
    state.units.push(unit(901, HUMAN, 0, 2.0, 2.0));
    let mut game = game(state);
    game.move_unit(MOVER, pos(4)).expect("rozkaz");
    for id in [MOVER, 901] {
        let u = unit_of(&game, id);
        assert_eq!(u.position, pos(2), "jednostka {id}");
        assert_eq!(u.movement, MovementPoints::new(0.0), "jednostka {id}");
    }
    assert_eq!(game.state().planned_marches, vec![plan(4, None)]);
}

// --- 11. Kolejnosc planow (web `Map.set`) i bramki komendy ------------------------------------

#[test]
fn ponowny_rozkaz_zachowuje_miejsce_planu() {
    let mut state = corridor(&plains(6), 0.0, 2.0);
    state.units.push(unit(901, HUMAN, 5, 1.0, 1.0));
    state.planned_marches = vec![
        plan(3, None),
        PlayablePlannedMarch {
            unit_id: UnitId::new(901),
            dest_q: 4,
            dest_r: 0,
            attack_unit_id: None,
            general_target_id: None,
        },
    ];
    state.planned_marches[0].general_target_id = Some("g1".to_owned());
    plan_march_to(&mut state, UnitId::new(MOVER), pos(4), None).expect("rozkaz");
    // Wpis MOVER na swoim miejscu, nadpisany nowym celem (bez `generalTargetId`, `:31253-31255`).
    assert_eq!(state.planned_marches[0], plan(4, None));
    assert_eq!(state.planned_marches[1].unit_id, UnitId::new(901));
}

#[test]
fn bramki_komendy_bez_zmian_stanu() {
    let mut game = PlayableGame::from_state(corridor(&plains(3), 2.0, 2.0));
    let before = game.state().clone();
    assert_eq!(
        game.move_unit(MOVER, pos(1)),
        Err(PlayableError::UnitNotSelected(MOVER))
    );
    assert_eq!(
        game.move_unit(4242, pos(1)),
        Err(PlayableError::UnitNotFound(4242))
    );
    assert_eq!(game.state(), &before);
}

// --- 12. Golden: dane bez nowych pol bajt w bajt ----------------------------------------------

#[test]
fn json_ruchu_calkowitego_bez_zmian_ksztaltu() {
    let state = corridor(&plains(2), 2.0, 2.0);
    let json = serde_json::to_string(&state).expect("json");
    assert!(json.contains("\"movement\":2,\"movementMax\":2"), "{json}");
    // Dawny zapis (`u8`) wczytuje sie do tej samej wartosci i zapisuje identycznie.
    let back: PlayableState = serde_json::from_str(&json).expect("odczyt");
    assert_eq!(serde_json::to_string(&back).expect("json"), json);
    assert_eq!(back.units[0].movement, 2);
}

// --- 13. Powody zatrzymania (`planned-march.ts:511-546`) ---------------------------------------

#[test]
fn etykiety_i_deduplikacja_powodow_zatrzymania() {
    use civ_engine::domain::playable_movement::{march_paused_label, note_march_stop};
    use PlayableMarchStopReason::*;
    // `marchPausedLabel`: tylko obstacle/no_path/blocked_city; `detail` ma pierwszenstwo.
    assert_eq!(march_paused_label(Some(NoMovement), None), None);
    assert_eq!(march_paused_label(Some(Fog), Some("x")), None);
    assert_eq!(
        march_paused_label(Some(Obstacle), None).as_deref(),
        Some("zablokowany heks na trasie")
    );
    assert_eq!(
        march_paused_label(Some(BlockedCity), None).as_deref(),
        Some("obce miasto na trasie")
    );
    assert_eq!(
        march_paused_label(Some(NoPath), None).as_deref(),
        Some("brak trasy do celu")
    );
    assert_eq!(
        march_paused_label(Some(Obstacle), Some("d")).as_deref(),
        Some("d")
    );
    // `noteMarchStop`: `registerMarchStop` deduplikuje ten sam powod; nowy powod nadpisuje.
    let mut state = corridor(&plains(2), 1.0, 1.0);
    let id = UnitId::new(MOVER);
    note_march_stop(&mut state, id, Some(NoMovement), Some("brak"));
    assert!(
        state.march_stop_notified.is_empty(),
        "no_movement nie jest powiadamialny"
    );
    note_march_stop(&mut state, id, Some(Obstacle), None);
    assert_eq!(state.march_stop_notified.get(&id), Some(&Obstacle));
    assert_eq!(
        state.march_stop_detail.get(&id).map(String::as_str),
        Some("zablokowany heks na trasie")
    );
    note_march_stop(&mut state, id, Some(Obstacle), Some("inny opis"));
    assert_eq!(
        state.march_stop_detail.get(&id).map(String::as_str),
        Some("zablokowany heks na trasie"),
        "ten sam powod: brak ponownego wpisu"
    );
    note_march_stop(&mut state, id, Some(NoPath), Some("opis"));
    assert_eq!(state.march_stop_notified.get(&id), Some(&NoPath));
    assert_eq!(
        state.march_stop_detail.get(&id).map(String::as_str),
        Some("opis")
    );
}

/// Obrona Q6, zarzut 4: niezmiennik "tylko skonczone wartosci" (podstawa recznego `Eq`) jest
/// wymuszony w buildach debug/test na obu publicznych konstruktorach.
#[cfg(debug_assertions)]
#[test]
#[should_panic(expected = "MovementPoints: wartosc nieskonczona lub NaN")]
fn movement_points_new_odrzuca_nan_w_debug() {
    let _ = MovementPoints::new(f64::NAN);
}

#[cfg(debug_assertions)]
#[test]
#[should_panic(expected = "MovementPoints: wartosc nieskonczona lub NaN")]
fn movement_points_from_f64_odrzuca_nieskonczonosc_w_debug() {
    let _ = MovementPoints::from(f64::INFINITY);
}

#[test]
fn movement_points_skonczone_wartosci_bez_zmian() {
    assert_eq!(MovementPoints::new(1.0 / 3.0).get(), 1.0 / 3.0);
    assert_eq!(MovementPoints::from(2.5_f64), MovementPoints::new(2.5));
    assert_eq!(MovementPoints::new(-0.0), MovementPoints::ZERO);
}
