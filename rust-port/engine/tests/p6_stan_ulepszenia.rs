//! P6-STAN-ULEPSZENIA (Q1): warstwy ulepszen terenu i forty/posterunki w `PlayableState`.
//!
//! Zakres: (a) producent `ulepszenia` (`countImprovementsForOwner`, web main.ts:2643) podpiety do
//! `power_raw_for_owner` jako `Provided` (nie `ExplicitZero`); (b) forty/posterunki z `PlayableState.forts`
//! wchodza do wezlow terytorium (web `foundingNodesForOwner`, fort-territory.ts:199); (c) zgodnosc wsteczna
//! zapisu: pola pomijane, gdy domyslne, i ladowanie zapisu sprzed zmiany.
//! Wartosci liczenia ulepszen sa zgodne z producentem `brake_power_improvements`, ktorego wektory pinu
//! sa w `p6_power_improvements`.

use civ_engine::domain::brake_power::Component;
use civ_engine::domain::brake_power_army::{terytorium_for_owner, TerritoryCityInput};
use civ_engine::domain::brake_power_improvements::{
    improvement_count_for_hex, ulepszenia_for_owner,
};
use civ_engine::domain::improvements::HexLike;
use civ_engine::domain::playable::{
    PlayableCity, PlayableFort, PlayableFortKind, PlayableGame, PlayableHexImprovement,
    PlayableMap, PlayableState, PlayableTerrain, PlayableTile, StartGameParams,
};
use civ_engine::domain::terrain::{FortImprovementType, FortNode};
use civ_engine::domain::turn_war_inputs::{power_raw_for_owner, shared_border_pairs};
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::{CityId, PlayerId};

const W: u16 = 16;
const H: u16 = 16;

fn plains_map() -> PlayableMap {
    let mut tiles = Vec::new();
    for y in 0..H {
        for x in 0..W {
            tiles.push(PlayableTile {
                position: PositionDto::new(x, y),
                terrain: PlayableTerrain::Plains,
                passable: true,
            });
        }
    }
    PlayableMap {
        width: W,
        height: H,
        tiles,
        improvements: Vec::new(),
    }
}

fn city(id: u64, owner: u64, x: u16, y: u16, pop: u32) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("c{id}"),
        position: PositionDto::new(x, y),
        is_capital: false,
        population: pop,
        culture: 0,
    }
}

fn layer(x: u16, y: u16, single: Option<&str>, layers: Option<&[&str]>) -> PlayableHexImprovement {
    PlayableHexImprovement {
        position: PositionDto::new(x, y),
        ulepszenie: single.map(str::to_owned),
        ulepszenia: layers.map(|l| l.iter().map(|s| (*s).to_owned()).collect()),
    }
}

fn fort(q: i32, r: i32, owner: u64, kind: PlayableFortKind, useless: Option<bool>) -> PlayableFort {
    PlayableFort {
        q,
        r,
        owner_id: PlayerId::new(owner),
        kind,
        contested_useless: useless,
    }
}

/// Gracz 1 (czlowiek) + AI 2 (jak w `p6_wire_war_pop`); mapa i miasta podmieniane.
fn base_state() -> PlayableState {
    let mut game = PlayableGame::new(StartGameParams {
        seed: 11,
        ..StartGameParams::default()
    })
    .expect("scenario");
    game.add_player(2, "AI".to_owned()).expect("ai");
    let mut state = game.state().clone();
    state.map = plains_map();
    state.cities = vec![city(1, 1, 4, 4, 5), city(2, 2, 12, 12, 5)];
    state
}

fn ulepszenia_of(state: &PlayableState, owner: i64) -> Component {
    power_raw_for_owner(state, owner, 1.0)
        .expect("power_raw")
        .ulepszenia_terenu
}

fn terytorium_of(state: &PlayableState, owner: i64) -> Component {
    power_raw_for_owner(state, owner, 1.0)
        .expect("power_raw")
        .heksy_terytorium
}

#[test]
fn ulepszenia_are_provided_not_explicit_zero() {
    let state = base_state();
    // Brak warstw ulepszen: producent zwraca realne 0 (Provided), a nie jawne zero bez powodu.
    assert_eq!(ulepszenia_of(&state, 1), Component::Provided(0.0));
}

#[test]
fn ulepszenia_layers_match_producer_on_same_inputs() {
    let mut state = base_state();
    state.map.improvements = vec![
        layer(4, 4, Some("farma"), None),
        layer(5, 4, None, Some(&["tarasy", "irygacja", "xyz_nieznane"])),
        layer(3, 5, None, Some(&[])),
        layer(6, 4, Some("droga"), None),
    ];
    state.forts = vec![fort(8, 4, 1, PlayableFortKind::Fort, None)];
    let forts = vec![FortNode {
        q: 8,
        r: 4,
        owner_id: 1,
        kind: FortImprovementType::Fort,
        contested_useless: None,
    }];
    let cities = vec![TerritoryCityInput {
        q: 4,
        r: 4,
        population: 5.0,
        owner_id: 1,
    }];
    let counts: Vec<((i32, i32), usize)> = vec![
        (
            (4, 4),
            improvement_count_for_hex(&HexLike {
                ulepszenie: Some("farma".into()),
                ..HexLike::default()
            }),
        ),
        (
            (5, 4),
            improvement_count_for_hex(&HexLike {
                ulepszenia: Some(vec![
                    "tarasy".into(),
                    "irygacja".into(),
                    "xyz_nieznane".into(),
                ]),
                ..HexLike::default()
            }),
        ),
        ((3, 5), 0),
        (
            (6, 4),
            improvement_count_for_hex(&HexLike {
                ulepszenie: Some("droga".into()),
                ..HexLike::default()
            }),
        ),
    ];
    let expect = ulepszenia_for_owner(&cities, &forts, 1, &|q, r| {
        if (0..i32::from(W)).contains(&q) && (0..i32::from(H)).contains(&r) {
            Some(
                counts
                    .iter()
                    .find(|(k, _)| *k == (q, r))
                    .map_or(0, |(_, c)| *c),
            )
        } else {
            None
        }
    });
    assert!(expect > 0.0, "przypadek musi byc niezerowy");
    assert_eq!(ulepszenia_of(&state, 1), Component::Provided(expect));
    // Wlasciciel bez miast i fortow: brak wezlow => 0 (web countImprovementsForOwner).
    assert_eq!(ulepszenia_of(&state, 3), Component::Provided(0.0));
}

#[test]
fn fort_adds_territory_nodes_for_its_owner() {
    let mut state = base_state();
    let before = match terytorium_of(&state, 1) {
        Component::Provided(v) => v,
        other => panic!("terytorium musi byc Provided, jest {other:?}"),
    };
    state.forts = vec![fort(10, 4, 1, PlayableFortKind::Fort, None)];
    let after = match terytorium_of(&state, 1) {
        Component::Provided(v) => v,
        other => panic!("terytorium musi byc Provided, jest {other:?}"),
    };
    assert!(
        after > before,
        "fort wlasciciela musi rozszerzyc terytorium: {before} -> {after}"
    );
    let cities = vec![TerritoryCityInput {
        q: 4,
        r: 4,
        population: 5.0,
        owner_id: 1,
    }];
    let forts = vec![FortNode {
        q: 10,
        r: 4,
        owner_id: 1,
        kind: FortImprovementType::Fort,
        contested_useless: None,
    }];
    let hex_exists =
        |q: i32, r: i32| (0..i32::from(W)).contains(&q) && (0..i32::from(H)).contains(&r);
    assert_eq!(
        after,
        terytorium_for_owner(&cities, &forts, 1, &hex_exists),
        "wiring musi zgadzac sie z producentem na tych samych wejsciach"
    );
}

#[test]
fn contested_useless_fort_is_ignored() {
    let mut state = base_state();
    let plain = state.clone();
    state.forts = vec![fort(10, 4, 1, PlayableFortKind::Posterunek, Some(true))];
    assert_eq!(terytorium_of(&state, 1), terytorium_of(&plain, 1));
    assert_eq!(ulepszenia_of(&state, 1), ulepszenia_of(&plain, 1));
}

#[test]
fn foreign_fort_does_not_count_for_owner_one() {
    let mut state = base_state();
    let plain = state.clone();
    state.forts = vec![fort(10, 4, 2, PlayableFortKind::Fort, None)];
    assert_eq!(terytorium_of(&state, 1), terytorium_of(&plain, 1));
}

#[test]
fn forts_alone_do_not_create_shared_border() {
    // Web karaWspolnaGranica wymaga >2 miast po obu stronach: forty same nie tworza pary.
    let mut state = base_state();
    state.forts = vec![fort(8, 8, 2, PlayableFortKind::Fort, None)];
    let pairs = shared_border_pairs(&state).expect("pairs");
    assert!(pairs.is_empty());
}

#[test]
fn new_fields_roundtrip_and_default_is_omitted() {
    let empty = PlayableState::empty();
    let json = serde_json::to_value(&empty).expect("serialize");
    assert!(
        json.get("forts").is_none(),
        "pusta lista fortow nie jest zapisywana"
    );
    assert!(
        json["map"].get("improvements").is_none(),
        "pusta warstwa nie jest zapisywana"
    );

    // Zapis sprzed zmiany (bez nowych pol) laduje sie z domyslnymi wartosciami.
    let mut legacy = json.clone();
    legacy.as_object_mut().expect("obj").remove("forts");
    let back: PlayableState = serde_json::from_value(legacy).expect("legacy load");
    assert!(back.forts.is_empty());
    assert!(back.map.improvements.is_empty());

    let mut full = base_state();
    full.map.improvements = vec![layer(4, 4, Some("farma"), None)];
    full.forts = vec![fort(8, 4, 1, PlayableFortKind::Posterunek, Some(false))];
    let text = serde_json::to_string(&full).expect("serialize");
    let loaded: PlayableState = serde_json::from_str(&text).expect("roundtrip");
    assert_eq!(loaded, full);
}
