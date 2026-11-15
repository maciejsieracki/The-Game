//! P4-1H Q4 (`R-RUSTPORT-P4-1H-MOVE-MODEL-Q4`, #250): adapter `PlayableState` -> model ruchu weba
//! (`RuchMapa` / `RuchJednostka` / `MoveOccupancy`) oraz `moved_by_player_this_turn`.
//!
//! Wartosci oczekiwane policzone RECZNIE z kodu pinu `07d2fbd72` (plik:linia przy kazdej wartosci),
//! nie z uruchomionego webu i nie z kodu produkcyjnego Rust. Dane: `gra/data/terrain-movement.json`
//! @07d2fbd72 = `{ Laka: 1, Rownina: 1, Pustynia: 2, Wybrzeze: 99, Wzgorza: 2, Gory: 99, Morze: 99,
//! Polarny: 99 }`, `forestExtra: 1` (identyczny z `rust-port/engine/data/terrain-movement.json`).

use std::collections::HashSet;

use civ_engine::domain::pathfinding::ruch_jednostek::{
    plan_path_turns_occ, terrain_move_cost, Klucz, MoveOccupancy, TerenBazowy,
};
use civ_engine::domain::playable::{PlayableHexImprovement, PlayableReplaceUnit};
use civ_engine::domain::playable_movement::{
    occupied_for_move, ruch_jednostka_of, ruch_mapa_from_state, teren_of, PlayableMoveModel,
};
use civ_engine::domain::save_load::restore_playable_planned_marches;
use civ_engine::{
    CityId, PlayableCity, PlayableGame, PlayableMap, PlayableState, PlayableTerrain, PlayableTile,
    PlayableUnit, PlayableUnitKind, PlayerId, PositionDto, StartGameParams, UnitId,
};

const HUMAN: u64 = 1;
const ENEMY: u64 = 2;

fn base_state() -> PlayableState {
    PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone()
}

fn tile(x: u16, y: u16, terrain: PlayableTerrain) -> PlayableTile {
    PlayableTile {
        position: PositionDto::new(x, y),
        terrain,
        passable: terrain.is_passable(),
    }
}

fn unit(id: u64, owner: u64, x: u16, y: u16, movement: u8, movement_max: u8) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, y),
        movement,
        movement_max,
        selected: false,
    }
}

fn city(id: u64, owner: u64, x: u16, y: u16) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("miasto-{id}"),
        position: PositionDto::new(x, y),
        is_capital: false,
        population: 1,
        culture: 0,
    }
}

fn road(x: u16, y: u16, kind: &str) -> PlayableHexImprovement {
    PlayableHexImprovement {
        position: PositionDto::new(x, y),
        ulepszenie: Some(kind.to_owned()),
        ulepszenia: None,
    }
}

/// Mapa testowa 4x2 (`x` = q, `y` = r):
///
/// ```text
/// y=0:  Plains        Hills          Forest         Water
/// y=1:  Plains+droga  Hills+droga    Plains+bruk    Plains
/// ```
fn test_map_state() -> PlayableState {
    let mut state = base_state();
    state.map = PlayableMap {
        width: 4,
        height: 2,
        tiles: vec![
            tile(0, 0, PlayableTerrain::Plains),
            tile(1, 0, PlayableTerrain::Hills),
            tile(2, 0, PlayableTerrain::Forest),
            tile(3, 0, PlayableTerrain::Water),
            tile(0, 1, PlayableTerrain::Plains),
            tile(1, 1, PlayableTerrain::Hills),
            tile(2, 1, PlayableTerrain::Plains),
            tile(3, 1, PlayableTerrain::Plains),
        ],
        improvements: vec![
            road(0, 1, "droga"),
            road(1, 1, "droga"),
            road(2, 1, "droga_brukowana"),
        ],
    };
    state
}

fn cost_at(state: &PlayableState, key: Klucz) -> f64 {
    let mapa = ruch_mapa_from_state(state);
    terrain_move_cost(mapa.get(key).expect("heks na mapie"))
}

#[test]
fn koszt_terenu_rowny_recznie_policzonym_wartosciom_pinu() {
    let state = test_map_state();
    // Plains -> Rownina: `_terrainCosts[rownina]` = 1 (terrain-movement.json `Rownina: 1`,
    // `configureTerrainMovement` setup.ts:438-445), bez lasu i drogi -> 1 (setup.ts:648-656).
    assert_eq!(cost_at(&state, (0, 0)), 1.0);
    // Hills -> Wzgorza: `Wzgorza: 2` -> 2 (setup.ts:648, :656). Koszt != 1.
    assert_eq!(cost_at(&state, (1, 0)), 2.0);
    // Forest -> Rownina + `nakladka === Las`: base 1 + `_forestExtra` 1 = 2 (setup.ts:651-654).
    assert_eq!(cost_at(&state, (2, 0)), 2.0);
    // Water -> Morze: `Morze: 99` >= 90 -> Infinity (setup.ts:443), `base === Infinity` (setup.ts:649).
    assert_eq!(cost_at(&state, (3, 0)), f64::INFINITY);
    // Plains + droga: 1 / ROAD_MOVE_SPEED_MULT (3, road-movement.ts:14) = 1/3 (road-movement.ts:81).
    assert_eq!(cost_at(&state, (0, 1)), 1.0 / 3.0);
    // Hills + droga: 2 / 3 (road-movement.ts:81) - ulamek: model ruchu musi byc f64.
    assert_eq!(cost_at(&state, (1, 1)), 2.0 / 3.0);
    // Plains + droga brukowana: max(ROAD_BRUK_MIN_MOVE_COST 1/5 (:57), 1 / 5 (:29)) = 0.2 (:78).
    assert_eq!(cost_at(&state, (2, 1)), 0.2);
    // Plains bez drogi -> 1.
    assert_eq!(cost_at(&state, (3, 1)), 1.0);
}

#[test]
fn odwzorowanie_terenu_i_kompletnosc_mapy() {
    assert_eq!(
        teren_of(PlayableTerrain::Plains),
        (TerenBazowy::Rownina, false)
    );
    assert_eq!(
        teren_of(PlayableTerrain::Hills),
        (TerenBazowy::Wzgorza, false)
    );
    assert_eq!(
        teren_of(PlayableTerrain::Forest),
        (TerenBazowy::Rownina, true)
    );
    assert_eq!(
        teren_of(PlayableTerrain::Water),
        (TerenBazowy::Morze, false)
    );
    let state = test_map_state();
    let mapa = ruch_mapa_from_state(&state);
    assert_eq!(mapa.hexes.len(), 8);
    for tile in &state.map.tiles {
        let key = (i32::from(tile.position.x()), i32::from(tile.position.y()));
        let hex = mapa.get(key).expect("kazdy kafel jest heksem");
        // Pola, ktorych stan nie ma, sa web-falsy (setup.ts:640 `rzeka?.obecna === true` -> false).
        assert!(!hex.rzeka && !hex.wioska && !hex.ma_wlasciciela);
    }
    assert_eq!(
        mapa.get((2, 1)).unwrap().ulepszenie.as_deref(),
        Some("droga_brukowana")
    );
    assert_eq!(mapa.get((3, 1)).unwrap().ulepszenie, None);
}

#[test]
fn startowa_mapa_slice_ma_koszt_pinu_dla_kazdego_kafla() {
    // Mapa scenariusza startowego: kazdy kafel ma koszt pinu wlasciwy dla swojego terenu.
    let state = base_state();
    let mapa = ruch_mapa_from_state(&state);
    assert_eq!(mapa.hexes.len(), state.map.tiles.len());
    for tile in &state.map.tiles {
        let key = (i32::from(tile.position.x()), i32::from(tile.position.y()));
        let expected = match tile.terrain {
            PlayableTerrain::Plains => 1.0,          // Rownina 1
            PlayableTerrain::Hills => 2.0,           // Wzgorza 2
            PlayableTerrain::Forest => 2.0,          // Rownina 1 + forestExtra 1
            PlayableTerrain::Water => f64::INFINITY, // Morze 99 -> Infinity
        };
        assert_eq!(
            terrain_move_cost(mapa.get(key).unwrap()),
            expected,
            "{key:?}"
        );
        // Przejezdnosc slice'a zgodna z kosztem pinu (Infinity = nieprzejezdny).
        assert_eq!(tile.passable, expected.is_finite(), "{key:?}");
    }
}

#[test]
fn jednostka_modelu_ruchu_f64_kategoria_i_wspolrzedne() {
    let mut state = test_map_state();
    state.units = vec![unit(7, HUMAN, 3, 1, 1, 2)];
    let model = PlayableMoveModel::from_state(&state);
    let ruch = model.jednostka(UnitId::new(7)).expect("jednostka w modelu");
    assert_eq!(ruch.id, "7");
    assert_eq!(ruch.owner_id, 1);
    assert_eq!((ruch.q, ruch.r), (3, 1));
    // web `ruch` / `ruchLeft` (number): ruch = movement_max, ruchLeft = movement.
    assert_eq!(ruch.ruch, 2.0);
    assert_eq!(ruch.ruch_left, 1.0);
    assert_eq!(ruch.type_id.as_deref(), Some("Wojownik"));
    // categoryOf("Wojownik", "Wręcz", false, "Swordsman"): brak slow kluczowych w nazwie i roli,
    // fallback po Typ `swordsman` -> 'miecznik' (setup.ts:246-301, :301).
    assert_eq!(ruch.category, "miecznik");
    assert_eq!(ruch.embarked, None);
    assert_eq!(ruch.oblega_city_id, None);
    assert!(!ruch.in_garnizon);

    // Kategoria ze stanu zamiany ma pierwszenstwo (web: `unit.category` po zamianie).
    state.economy.units.insert(
        7,
        PlayableReplaceUnit {
            type_id: Some("Procarz".to_owned()),
            category: Some("procarz".to_owned()),
            ..PlayableReplaceUnit::default()
        },
    );
    let ruch = ruch_jednostka_of(&state, &state.units[0]);
    assert_eq!(ruch.type_id.as_deref(), Some("Procarz"));
    assert_eq!(ruch.category, "procarz");
}

fn set(keys: &[Klucz]) -> HashSet<Klucz> {
    keys.iter().copied().collect()
}

/// Stan zajetosci: ruszajaca sie jednostka 1 (gracz) na (0,0); wlasna 2 na (1,0) i wlasna 3 na
/// (0,1); wrog 50 na (2,0); wrog 51 i wlasna 4 razem na (1,1); obce miasto na (3,1) z wlasna 5;
/// wlasne miasto na (2,1).
fn occupancy_state() -> PlayableState {
    let mut state = test_map_state();
    state.units = vec![
        unit(1, HUMAN, 0, 0, 2, 2),
        unit(2, HUMAN, 1, 0, 1, 1),
        unit(3, HUMAN, 0, 1, 1, 1),
        unit(50, ENEMY, 2, 0, 1, 1),
        unit(51, ENEMY, 1, 1, 1, 1),
        unit(4, HUMAN, 1, 1, 1, 1),
        unit(5, HUMAN, 3, 1, 1, 1),
    ];
    state.cities = vec![city(10, HUMAN, 2, 1), city(11, ENEMY, 3, 1)];
    state
}

#[test]
fn zajetosc_wlasne_przejscie_obce_blokada_obce_miasto() {
    let state = occupancy_state();
    let occ = occupied_for_move(&state, 1, &[UnitId::new(1)]);
    // Oczekiwane recznie (main.ts:14578-14584 + setup.ts:759-776):
    // - (2,0) wrog 50 -> blokada (setup.ts:768);
    // - (1,1) wrog 51 + wlasna 4 -> blokada; wlasna nie trafia do passThrough, bo heks juz
    //   zablokowany (setup.ts:773 `if (!occ.has(k))`);
    // - (3,1) obce miasto 11 -> blokada (main.ts:14581) i usuniete z passThrough mimo wlasnej
    //   jednostki 5 (main.ts:14582);
    // - (1,0) wlasna 2, (0,1) wlasna 3 -> passThrough (setup.ts:770-774);
    // - (0,0) jednostka ruszajaca sie -> pominieta (excludeIds, setup.ts:767, :771);
    // - (2,1) wlasne miasto -> ani blokada, ani przejscie (foreignCityHexKeys pomija wlasne,
    //   city-hex-movement.ts:66-74).
    assert_eq!(occ.blocked, set(&[(2, 0), (1, 1), (3, 1)]));
    assert_eq!(occ.pass_through, set(&[(1, 0), (0, 1)]));

    // Bez wykluczenia: heks ruszajacej sie jednostki to tez przejscie (setup.ts:770-774).
    let occ_all = state.occupied_for_move(PlayerId::new(HUMAN), &[]);
    assert_eq!(occ_all.blocked, set(&[(2, 0), (1, 1), (3, 1)]));
    assert_eq!(occ_all.pass_through, set(&[(1, 0), (0, 1), (0, 0)]));

    // Z perspektywy wroga: jednostki gracza blokuja, miasta gracza blokuja; (1,1) to blokada od
    // jednostki 4 gracza (setup.ts:768), a wlasny 51 nie dodaje przejscia (setup.ts:773).
    let occ_enemy = occupied_for_move(&state, 2, &[]);
    assert_eq!(
        occ_enemy.blocked,
        set(&[(0, 0), (1, 0), (0, 1), (1, 1), (3, 1), (2, 1)])
    );
    assert_eq!(occ_enemy.pass_through, set(&[(2, 0)]));
}

/// Mapa 6x1 z samych rownin: model ruchu z adaptera w `planPathTurns` (pm.ts@07 :215-285).
#[test]
fn pass_through_z_adaptera_przycina_segment_na_wlasnej_jednostce() {
    let mut state = base_state();
    state.map = PlayableMap {
        width: 6,
        height: 1,
        tiles: (0..6)
            .map(|x| tile(x, 0, PlayableTerrain::Plains))
            .collect(),
        improvements: Vec::new(),
    };
    state.cities.clear();
    state.units = vec![unit(1, HUMAN, 0, 0, 2, 2), unit(2, HUMAN, 2, 0, 1, 1)];
    let model = state.move_model();
    let mover = model.jednostka(UnitId::new(1)).unwrap();
    let occ = state.occupied_for_move(PlayerId::new(HUMAN), &[UnitId::new(1)]);
    assert_eq!(occ.pass_through, set(&[(2, 0)]));
    let plan = plan_path_turns_occ(
        mover,
        4.0,
        0.0,
        &model.mapa,
        &occ,
        None,
        mover.ruch,
        Some(mover.ruch_left),
        None,
    );
    // Pelna trasa (0,0)->(4,0) po rowninach koszt 1: [(1,0),(2,0),(3,0),(4,0)].
    assert_eq!(plan.full_path, vec![(1, 0), (2, 0), (3, 0), (4, 0)]);
    // Budzet 2 -> `truncatePathToBudget` = [(1,0),(2,0)] (pm.ts:182-209); koniec na wlasnej
    // jednostce (2,0) jest ucinany `trimSegmentEndOffPassThrough` (pm.ts:271-275,
    // setup.ts:800-812) -> [(1,0)].
    assert_eq!(plan.segment_path, vec![(1, 0)]);

    // Kontrola czulosci: ta sama trasa bez passThrough konczy sie na (2,0).
    let bez = MoveOccupancy::from_blocked(occ.blocked.clone());
    let plan_bez = plan_path_turns_occ(
        mover,
        4.0,
        0.0,
        &model.mapa,
        &bez,
        None,
        mover.ruch,
        Some(mover.ruch_left),
        None,
    );
    assert_eq!(plan_bez.segment_path, vec![(1, 0), (2, 0)]);
}

#[test]
fn moved_by_player_ustawiane_po_ruchu_i_czyszczone_w_advance_turn() {
    let mut game = PlayableGame::new(StartGameParams::default()).expect("start");
    let id = UnitId::new(1);
    assert!(!game.state().is_moved_by_player_this_turn(id));
    // Odrzucony rozkaz (jednostka niezaznaczona) nie oznacza ruchu (web: return przed :31284).
    assert!(game.move_unit(1, PositionDto::new(3, 1)).is_err());
    assert!(game.state().moved_by_player_this_turn.is_empty());

    game.select_unit(1).expect("zaznaczenie");
    game.move_unit(1, PositionDto::new(3, 1)).expect("ruch");
    // web `markPlayerMovedUnit(u.id)` (main.ts:31284, :31026-31028).
    assert!(game.state().is_moved_by_player_this_turn(id));
    assert_eq!(game.state().moved_by_player_this_turn.len(), 1);

    // web `movedByPlayerThisTurn.clear()` przy odnowieniu ruchu (main.ts:38144).
    game.advance_turn().expect("koniec tury");
    assert!(game.state().moved_by_player_this_turn.is_empty());
    assert!(!game.state().is_moved_by_player_this_turn(id));
}

#[test]
fn zapis_stanu_bez_pola_bez_zmian_i_z_polem_round_trip() {
    let state = base_state();
    let golden = serde_json::to_string(&state).unwrap();
    assert!(!golden.contains("movedByPlayerThisTurn"));
    let back: PlayableState = serde_json::from_str(&golden).unwrap();
    assert!(back.moved_by_player_this_turn.is_empty());
    assert_eq!(serde_json::to_string(&back).unwrap(), golden);

    let mut with = state.clone();
    with.mark_player_moved_unit(UnitId::new(1));
    with.mark_player_moved_unit(UnitId::new(9));
    let json = serde_json::to_string(&with).unwrap();
    assert!(json.contains("\"movedByPlayerThisTurn\":[1,9]"), "{json}");
    let back: PlayableState = serde_json::from_str(&json).unwrap();
    // Porownanie pola (cale `PlayableState` ma pola `#[serde(skip)]`, np. `gracz_kiedys_mial_miasto`).
    assert_eq!(
        back.moved_by_player_this_turn,
        with.moved_by_player_this_turn
    );
    assert!(back.is_moved_by_player_this_turn(UnitId::new(9)));
    assert_eq!(serde_json::to_string(&back).unwrap(), json);
}

#[test]
fn wczytanie_planow_czysci_moved_by_player() {
    // web: wczytanie czysci `movedByPlayerThisTurn` (main.ts:46280) razem z planami marszu.
    let mut state = base_state();
    state.mark_player_moved_unit(UnitId::new(1));
    let report = restore_playable_planned_marches(&mut state, &[], None, PlayerId::new(HUMAN));
    assert!(report.unrepresentable.is_empty());
    assert!(state.moved_by_player_this_turn.is_empty());
}
