//! R-RUSTPORT-P4-1C-FOG-VIEW-R1 (#253, #335): producent `FogViewDto` (mgla aktywnego fotela).
//!
//! 1. Wektory z URUCHOMIONEGO pinu `07d2fbd72` (`p4_1c_fog_vectors/gen.mjs`: `refreshFog` z
//!    `main.ts` + `game/visibility.ts`, `okolica.ts`, `fort-territory.ts`, `diplomacy-treaties.ts`):
//!    sam fotel, fotel + sojusznicy (obronny/pelny, pakt i handel bez unii, drugi fotel czlowieka bez
//!    unii), `revealAllLand`, krag startu, brak zrodel, mgla wylaczona (z i bez `revealAllLand`).
//! 2. Eksploracja per fotel (zachowanie Rust wg dispatchu; pin ma jeden fotel): zmiana fotela nie
//!    przenosi mgly drugiego.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::domain::diplomacy::{ActiveDeal, TreatyKind};
use civ_engine::domain::pathfinding::ruch_jednostek::Klucz;
use civ_engine::domain::playable::{
    MovementPoints, PlayableFort, PlayableFortKind, PlayableReplaceUnit,
};
use civ_engine::domain::terrain::visibility::fog_view::{
    alliance_formal_kind_between, refresh_fog, AllianceFormalKind, ExploredByHuman, FogViewError,
    FogViewInputs,
};
use civ_engine::{
    CityId, PlayableCity, PlayableGame, PlayableMap, PlayablePlayer, PlayableState,
    PlayableTerrain, PlayableTile, PlayableUnit, PlayableUnitKind, PlayerId, PositionDto,
    StartGameParams, UnitId,
};
use civ_view_model::FogState;
use serde_json::Value;

const VECTORS: &str = include_str!("p4_1c_fog_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn n(v: &Value) -> u64 {
    v.as_u64().unwrap_or_else(|| panic!("liczba: {v}"))
}

fn i(v: &Value) -> i32 {
    i32::try_from(v.as_i64().unwrap_or_else(|| panic!("liczba: {v}"))).expect("i32")
}

fn u16_of(v: &Value) -> u16 {
    u16::try_from(n(v)).expect("u16")
}

fn keys(v: &Value) -> Vec<Klucz> {
    v.as_array()
        .expect("lista kluczy")
        .iter()
        .map(|k| (i(&k[0]), i(&k[1])))
        .collect()
}

fn sorted_rq(set: &BTreeSet<Klucz>) -> Vec<Klucz> {
    let mut out: Vec<Klucz> = set.iter().copied().collect();
    out.sort_by_key(|&(q, r)| (r, q));
    out
}

fn terrain_of(name: &str) -> PlayableTerrain {
    match name {
        "Plains" => PlayableTerrain::Plains,
        "Hills" => PlayableTerrain::Hills,
        "Forest" => PlayableTerrain::Forest,
        "Water" => PlayableTerrain::Water,
        other => panic!("teren {other}"),
    }
}

struct Scenario {
    state: PlayableState,
    me: PlayerId,
    fog_on: bool,
    reveal_all_land: bool,
    start_hexes: BTreeMap<PlayerId, Klucz>,
    start_reveal_radius: f64,
    explored_before: BTreeSet<Klucz>,
}

fn scenario(sc: &Value) -> Scenario {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone();
    let tiles = sc["tiles"]
        .as_array()
        .expect("tiles")
        .iter()
        .map(|t| {
            let terrain = terrain_of(t["t"].as_str().expect("t"));
            PlayableTile {
                position: PositionDto::new(u16_of(&t["q"]), u16_of(&t["r"])),
                terrain,
                passable: terrain.is_passable(),
            }
        })
        .collect();
    state.map = PlayableMap {
        width: u16_of(&sc["width"]),
        height: u16_of(&sc["height"]),
        tiles,
        improvements: Vec::new(),
    };
    state.players = sc["players"]
        .as_array()
        .expect("players")
        .iter()
        .map(|p| PlayablePlayer {
            id: PlayerId::new(n(&p["id"])),
            name: format!("gracz-{}", n(&p["id"])),
            civilization: "rzym".to_owned(),
            is_human: p["human"].as_bool().expect("human"),
        })
        .collect();
    state.units.clear();
    state.economy.units.clear();
    for u in sc["units"].as_array().expect("units") {
        let id = n(&u["id"]);
        state.units.push(PlayableUnit {
            id: UnitId::new(id),
            owner_id: PlayerId::new(n(&u["owner"])),
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(u16_of(&u["q"]), u16_of(&u["r"])),
            movement: MovementPoints::from(2u8),
            movement_max: MovementPoints::from(2u8),
            selected: false,
        });
        state.economy.units.insert(
            id,
            PlayableReplaceUnit {
                type_id: Some(u["typeId"].as_str().expect("typeId").to_owned()),
                ..PlayableReplaceUnit::default()
            },
        );
    }
    state.cities = sc["cities"]
        .as_array()
        .expect("cities")
        .iter()
        .map(|c| PlayableCity {
            id: CityId::new(n(&c["id"])),
            owner_id: PlayerId::new(n(&c["owner"])),
            name: format!("miasto-{}", n(&c["id"])),
            position: PositionDto::new(u16_of(&c["q"]), u16_of(&c["r"])),
            is_capital: false,
            population: u32::try_from(n(&c["population"])).expect("u32"),
            culture: u32::try_from(n(&c["culture"])).expect("u32"),
        })
        .collect();
    state.forts = sc["forts"]
        .as_array()
        .expect("forts")
        .iter()
        .map(|f| PlayableFort {
            q: i(&f["q"]),
            r: i(&f["r"]),
            owner_id: PlayerId::new(n(&f["owner"])),
            kind: match f["kind"].as_str().expect("kind") {
                "fort" => PlayableFortKind::Fort,
                "posterunek" => PlayableFortKind::Posterunek,
                other => panic!("fort {other}"),
            },
            contested_useless: f["contestedUseless"].as_bool(),
            built_at_turn: None,
            seq: None,
        })
        .collect();
    state.war.diplomacy.deals = sc["deals"]
        .as_array()
        .expect("deals")
        .iter()
        .map(|d| {
            let kind: TreatyKind = serde_json::from_value(d["kind"].clone()).expect("rodzaj");
            ActiveDeal::new(
                kind,
                PlayerId::new(n(&d["a"])),
                PlayerId::new(n(&d["b"])),
                1,
                None,
            )
        })
        .collect();
    let start_hexes = sc["startHexes"]
        .as_array()
        .expect("startHexes")
        .iter()
        .map(|s| (PlayerId::new(n(&s[0])), (i(&s[1]), i(&s[2]))))
        .collect();
    Scenario {
        state,
        me: PlayerId::new(n(&sc["me"])),
        fog_on: sc["fogOn"].as_bool().expect("fogOn"),
        reveal_all_land: sc["revealAllLand"].as_bool().expect("revealAllLand"),
        start_hexes,
        start_reveal_radius: sc["startRevealRadius"].as_f64().expect("startRevealRadius"),
        explored_before: keys(&sc["exploredBefore"]).into_iter().collect(),
    }
}

fn fog_code(state: FogState) -> u64 {
    u64::from(state.code())
}

#[test]
fn p4_1c_fog_vectors_match_pinned_web() {
    let doc = vectors();
    let cases = doc["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 7, "liczba przypadkow wektorow");
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let sc = scenario(&case["scenario"]);
        let inputs = FogViewInputs {
            active_seat: sc.me,
            fog_on: sc.fog_on,
            reveal_all_land: sc.reveal_all_land,
            player_start_hex_by_owner: &sc.start_hexes,
            start_reveal_radius: sc.start_reveal_radius,
        };
        let mut explored: ExploredByHuman = BTreeMap::new();
        explored.insert(sc.me, sc.explored_before.clone());
        let view = refresh_fog(&sc.state, &inputs, &mut explored).expect("refresh_fog");
        let exp = &case["expected"];
        assert_eq!(
            view.fog_active,
            exp["fogActive"].as_bool().expect("fogActive"),
            "{name}: fog_active"
        );
        let got: Vec<u64> = view.fog.state.iter().copied().map(fog_code).collect();
        let want: Vec<u64> = exp["fog"].as_array().expect("fog").iter().map(n).collect();
        assert_eq!(got, want, "{name}: fog.state");
        if view.fog_active {
            assert_eq!(
                sorted_rq(&view.visible),
                keys(&exp["setFogVisible"]),
                "{name}: setFog vis"
            );
            assert_eq!(
                sorted_rq(&view.explored_for_render),
                keys(&exp["setFogExplored"]),
                "{name}: setFog exploredForRender"
            );
        }
        assert_eq!(
            sorted_rq(&explored[&sc.me]),
            keys(&exp["exploredAfter"]),
            "{name}: explored po refreshFog"
        );
    }
}

#[test]
fn p4_1c_fog_vectors_cover_union_and_reveal_branches() {
    // Straznik pokrycia: wektory musza rozrozniac unie sojusznikow i revealAllLand.
    let doc = vectors();
    let by_name = |name: &str| -> Vec<u64> {
        doc["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .find(|c| c["name"] == name)
            .unwrap_or_else(|| panic!("brak {name}"))["expected"]["fog"]
            .as_array()
            .expect("fog")
            .iter()
            .map(n)
            .collect()
    };
    assert_ne!(by_name("sam_fotel"), by_name("fotel_sojusznik"));
    assert_ne!(by_name("sam_fotel"), by_name("reveal_all_land"));
    assert_ne!(by_name("mgla_wylaczona"), by_name("mgla_wylaczona_reveal"));
    assert!(by_name("brak_zrodel_brak_startu").iter().all(|&c| c != 2));
}

#[test]
fn p4_1c_alliance_formal_kind_between_matches_pin() {
    let a = PlayerId::new(1);
    let b = PlayerId::new(2);
    let c = PlayerId::new(3);
    let deals = vec![
        ActiveDeal::new(TreatyKind::DefensiveAlliance, b, a, 1, None),
        ActiveDeal::new(TreatyKind::FullAlliance, a, b, 2, None),
        ActiveDeal::new(TreatyKind::Nap, a, c, 1, None),
        ActiveDeal::new(TreatyKind::TradeRoute, a, c, 1, None),
    ];
    assert_eq!(
        alliance_formal_kind_between(&deals, a, b),
        Some(AllianceFormalKind::Wojskowy)
    );
    assert_eq!(
        alliance_formal_kind_between(&deals[..1], a, b),
        Some(AllianceFormalKind::Obronny)
    );
    assert_eq!(alliance_formal_kind_between(&deals, a, c), None);
    assert_eq!(alliance_formal_kind_between(&deals, b, c), None);
}

/// Stan dwoch foteli czlowieka (1 i 5) na mapie z wektora `sam_fotel`.
fn two_seat_scenario() -> Scenario {
    let doc = vectors();
    let case = doc["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["name"] == "sam_fotel")
        .expect("sam_fotel")
        .clone();
    scenario(&case["scenario"])
}

#[test]
fn p4_1c_fog_explored_is_per_seat() {
    let sc = two_seat_scenario();
    let seat_a = PlayerId::new(1);
    let seat_b = PlayerId::new(5);
    let mut explored: ExploredByHuman = BTreeMap::new();
    explored.insert(seat_a, BTreeSet::new());
    explored.insert(seat_b, BTreeSet::new());
    let inputs_for = |seat: PlayerId| FogViewInputs {
        active_seat: seat,
        fog_on: true,
        reveal_all_land: false,
        player_start_hex_by_owner: &sc.start_hexes,
        start_reveal_radius: sc.start_reveal_radius,
    };

    // Tura fotela A: odkrywa tylko swoje.
    let view_a = refresh_fog(&sc.state, &inputs_for(seat_a), &mut explored).expect("A");
    assert!(!view_a.visible.is_empty());
    assert_eq!(explored[&seat_a], view_a.visible);
    assert!(explored[&seat_b].is_empty(), "fotel B nie dostaje mgly A");

    // Zmiana fotela: B widzi wylacznie swoja eksploracje.
    let view_b = refresh_fog(&sc.state, &inputs_for(seat_b), &mut explored).expect("B");
    assert_eq!(explored[&seat_b], view_b.visible);
    assert_eq!(explored[&seat_a], view_a.visible, "eksploracja A bez zmian");
    assert_eq!(view_b.explored_for_render, view_b.visible);
    let only_a: Vec<&Klucz> = view_a.visible.difference(&view_b.visible).collect();
    assert!(
        !only_a.is_empty(),
        "scenariusz musi miec heksy widziane tylko przez A"
    );
    let order = civ_engine::domain::terrain::visibility::fog_view::hex_order(&sc.state);
    for key in only_a {
        let idx = order.iter().position(|k| k == key).expect("heks w mapie");
        assert_eq!(
            view_b.fog.state[idx],
            FogState::Unexplored,
            "heks {key:?} odkryty przez A nie moze byc odkryty dla B"
        );
    }

    // Powrot do A: eksploracja A zachowana (kod 1/2), B nie dopisuje sie do A.
    let view_a2 = refresh_fog(&sc.state, &inputs_for(seat_a), &mut explored).expect("A2");
    assert_eq!(view_a2.explored_for_render, view_a.visible);
}

#[test]
fn p4_1c_fog_missing_seat_is_error() {
    let sc = two_seat_scenario();
    let mut explored: ExploredByHuman = BTreeMap::new();
    explored.insert(PlayerId::new(1), BTreeSet::new());
    let inputs = FogViewInputs {
        active_seat: PlayerId::new(5),
        fog_on: true,
        reveal_all_land: false,
        player_start_hex_by_owner: &sc.start_hexes,
        start_reveal_radius: sc.start_reveal_radius,
    };
    assert_eq!(
        refresh_fog(&sc.state, &inputs, &mut explored),
        Err(FogViewError::MissingExploredSeat(5))
    );
    assert!(explored[&PlayerId::new(1)].is_empty());
}
