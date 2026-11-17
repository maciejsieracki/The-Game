//! R-RUSTPORT-P4-364-DTO-BRIDGE-R1 (#364): warstwa `domain::dto_bridge` (mgla, odkrycie rzek,
//! zasiegi terytorium aktywnego fotela z `PlayableState`).
//!
//! 1. Wektory z URUCHOMIONEGO pinu `07d2fbd72` (`p4_364_dto_bridge_gen.mjs`: `refreshFog`, opcje
//!    `setFog`, `startRevealKeysForRiverFog`, `isAwaitingFirstPlayerCity`, `buildAllTerritoryNodes`
//!    i filtr mgly `refreshTerritoryBorderOverlay`): mgla ON/OFF, `revealAllLand`, klucze rzek dla
//!    fotela 0 i fotela 1, zasiegi dla `ME() = 0` i `ME() = 1`.
//! 2. Istniejace wektory F2 (`renderer/tests/territory_ranges_f2_vectors/vectors.json`, pin
//!    `07d2fbd72`) przez `PlayableState` - scenariusze bez wlascicieli ujemnych (barbarzyncy -1,
//!    rebelianci -99 nie maja miast/fortow w `PlayableState`, ktorego `owner_id` to `PlayerId`).
//!    Wspolrzedne przesuniete o stala (`PositionDto` jest `u16`); wszystkie reguly terytorium i
//!    kolejnosc `r`-major sa niezmiennicze wzgledem przesuniecia.
//! 3. Rownowaznosc z innymi portami: `build_territory_layers` == `territory_ranges_dto` na wejsciach
//!    zbudowanych recznie z JSON; wlasciciel per heks == engine `territory_owner_at`; zbiory
//!    wlascicieli i heksow == engine `collect_territory_hex_keys_by_owner`.

use std::collections::{BTreeMap, BTreeSet, HashSet};

use civ_engine::domain::diplomacy::{ActiveDeal, TreatyKind};
use civ_engine::domain::dto_bridge::{
    build_territory_layers, build_view_layers, engine_territory_nodes, is_awaiting_first_city,
    territory_node_inputs, DtoBridgeError,
};
use civ_engine::domain::pathfinding::ruch_jednostek::Klucz;
use civ_engine::domain::playable::{
    MovementPoints, PlayableFort, PlayableFortKind, PlayableReplaceUnit,
};
use civ_engine::domain::terrain::visibility::fog_view::{
    hex_order, ExploredByHuman, FogViewInputs,
};
use civ_engine::domain::territory::{collect_territory_hex_keys_by_owner, territory_owner_at};
use civ_engine::{
    CityId, PlayableCity, PlayableGame, PlayableMap, PlayablePlayer, PlayableState,
    PlayableTerrain, PlayableTile, PlayableUnit, PlayableUnitKind, PlayerId, PositionDto,
    StartGameParams, UnitId,
};
use civ_view_model::territory_ranges_view::territory_owner_at as vm_territory_owner_at;
use civ_view_model::{
    territory_ranges_dto, FogState, HexCoord, OwnerRef, TerritoryFogFilter, TerritoryNodeInput,
    TerritoryNodeOrder, TerritoryRangesDto,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p4_364_dto_bridge_vectors/vectors.json");
const F2_VECTORS: &str =
    include_str!("../../renderer/tests/territory_ranges_f2_vectors/vectors.json");

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

fn base_state() -> PlayableState {
    PlayableGame::new(StartGameParams::default())
        .expect("scenariusz startowy")
        .state()
        .clone()
}

fn fort_of(f: &Value) -> PlayableFort {
    PlayableFort {
        q: i(&f["q"]),
        r: i(&f["r"]),
        owner_id: PlayerId::new(n(&f["owner"])),
        kind: match f["kind"].as_str().expect("kind") {
            "fort" => PlayableFortKind::Fort,
            "posterunek" => PlayableFortKind::Posterunek,
            other => panic!("fort {other}"),
        },
        contested_useless: f["contestedUseless"].as_bool(),
        built_at_turn: f["builtAtTurn"].as_i64(),
        seq: f["seq"].as_i64(),
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
    ever_owned: BTreeSet<PlayerId>,
}

impl Scenario {
    fn inputs(&self) -> FogViewInputs<'_> {
        FogViewInputs {
            active_seat: self.me,
            fog_on: self.fog_on,
            reveal_all_land: self.reveal_all_land,
            player_start_hex_by_owner: &self.start_hexes,
            start_reveal_radius: self.start_reveal_radius,
        }
    }

    /// Eksploracja wszystkich foteli ludzkich: fotel `ME()` z wektora, pozostale puste.
    fn explored(&self) -> ExploredByHuman {
        self.state
            .players
            .iter()
            .filter(|p| p.is_human)
            .map(|p| {
                let set = if p.id == self.me {
                    self.explored_before.clone()
                } else {
                    BTreeSet::new()
                };
                (p.id, set)
            })
            .collect()
    }
}

fn scenario(sc: &Value) -> Scenario {
    let mut state = base_state();
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
        .map(fort_of)
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
    Scenario {
        state,
        me: PlayerId::new(n(&sc["me"])),
        fog_on: sc["fogOn"].as_bool().expect("fogOn"),
        reveal_all_land: sc["revealAllLand"].as_bool().expect("revealAllLand"),
        start_hexes: sc["startHexes"]
            .as_array()
            .expect("startHexes")
            .iter()
            .map(|s| (PlayerId::new(n(&s[0])), (i(&s[1]), i(&s[2]))))
            .collect(),
        start_reveal_radius: sc["startRevealRadius"].as_f64().expect("radius"),
        explored_before: keys(&sc["exploredBefore"]).into_iter().collect(),
        ever_owned: sc["everOwned"]
            .as_array()
            .expect("everOwned")
            .iter()
            .map(|o| PlayerId::new(n(o)))
            .collect(),
    }
}

fn cases() -> Vec<Value> {
    let doc: Value = serde_json::from_str(VECTORS).expect("vectors.json");
    assert_eq!(doc["pin"], "07d2fbd72");
    doc["cases"].as_array().expect("cases").clone()
}

fn hex_list(v: &Value) -> Vec<HexCoord> {
    keys(v)
        .into_iter()
        .map(|(q, r)| HexCoord::new(q, r))
        .collect()
}

fn owner_of(raw: i64) -> OwnerRef {
    match raw {
        -99 => OwnerRef::Rebel,
        -1 => OwnerRef::Barbarian,
        id => OwnerRef::Player(
            civ_view_model::PlayerId::try_new(u64::try_from(id).expect("id >= 0")).expect("id"),
        ),
    }
}

fn by_owner_of(dto: &TerritoryRangesDto) -> Vec<(i64, Vec<HexCoord>)> {
    dto.by_owner
        .iter()
        .map(|o| (o.owner_id.legacy_i64(), o.hexes.clone()))
        .collect()
}

fn btree(keys: &[Klucz]) -> BTreeSet<Klucz> {
    keys.iter().copied().collect()
}

/// Wezly `buildAllTerritoryNodes()` zbudowane RECZNIE z JSON scenariusza (niezaleznie od
/// `dto_bridge`): miasta w kolejnosci, potem forty bez `contestedUseless`, `order` tylko przy `seq`.
fn manual_nodes(sc: &Value) -> Vec<TerritoryNodeInput> {
    let mut nodes: Vec<TerritoryNodeInput> = sc["cities"]
        .as_array()
        .expect("cities")
        .iter()
        .map(|c| TerritoryNodeInput {
            hex: HexCoord::new(i(&c["q"]), i(&c["r"])),
            owner_id: owner_of(c["owner"].as_i64().expect("owner")),
            pop: c["population"].as_f64().expect("pop"),
            is_outpost: false,
            is_fort: false,
            order: None,
        })
        .collect();
    for f in sc["forts"].as_array().expect("forts") {
        if f["contestedUseless"].as_bool() == Some(true) {
            continue;
        }
        let kind = f["kind"].as_str().expect("kind");
        nodes.push(TerritoryNodeInput {
            hex: HexCoord::new(i(&f["q"]), i(&f["r"])),
            owner_id: owner_of(f["owner"].as_i64().expect("owner")),
            pop: 0.0,
            is_outpost: kind == "posterunek",
            is_fort: kind == "fort",
            order: f["seq"].as_f64().map(|seq| TerritoryNodeOrder {
                turn: f["builtAtTurn"].as_f64().unwrap_or(0.0),
                seq,
            }),
        });
    }
    nodes
}

/// Wejscia filtra mgly terytorium fotela (`main.ts:15596-15600`).
struct SeatFog<'a> {
    me: PlayerId,
    fog_on: bool,
    visible: &'a BTreeSet<Klucz>,
    explored: &'a BTreeSet<Klucz>,
}

/// Rownowaznosc trzech portow regul terytorium na jednym stanie (zarzut 5 Evaluatora F2).
fn assert_ports_agree(
    name: &str,
    state: &PlayableState,
    seat: &SeatFog<'_>,
    dto: &TerritoryRangesDto,
    manual: Option<&[TerritoryNodeInput]>,
) {
    let SeatFog {
        me,
        fog_on,
        visible,
        explored,
    } = *seat;
    let order: Vec<HexCoord> = hex_order(state)
        .into_iter()
        .map(|(q, r)| HexCoord::new(q, r))
        .collect();
    let vis_set: HashSet<HexCoord> = visible.iter().map(|&(q, r)| HexCoord::new(q, r)).collect();
    let exp_set: HashSet<HexCoord> = explored.iter().map(|&(q, r)| HexCoord::new(q, r)).collect();
    let me_vm = owner_of(i64::try_from(me.get()).expect("i64"));
    let filter = TerritoryFogFilter {
        me: me_vm,
        fog_on,
        visible: &vis_set,
        explored: &exp_set,
    };
    // (1) producent view-model na wejsciach recznych == warstwa.
    let bridge_nodes = territory_node_inputs(state).expect("wezly");
    if let Some(manual) = manual {
        assert_eq!(
            manual,
            bridge_nodes.as_slice(),
            "{name}: wezly reczne == wezly warstwy"
        );
        assert_eq!(
            &territory_ranges_dto(&order, manual, &filter),
            dto,
            "{name}: territory_ranges_dto(reczne) == build_territory_layers"
        );
    }
    // (2) wlasciciel per heks: engine `territory_owner_at` == view-model `territory_owner_at`.
    let engine_nodes = engine_territory_nodes(state).expect("wezly engine");
    for &h in &order {
        let engine = territory_owner_at(f64::from(h.q), f64::from(h.r), &engine_nodes);
        let vm = vm_territory_owner_at(h, &bridge_nodes).map(OwnerRef::legacy_i64);
        assert_eq!(engine, vm, "{name}: wlasciciel heksa {h:?}");
    }
    // (3) engine `collect_territory_hex_keys_by_owner` z tym samym filtrem == warstwa (zbiory;
    // engine trzyma `BTreeMap`/`BTreeSet`, wiec kolejnosc wstawiania sprawdzaja wektory pinu).
    let hex_keys: Vec<String> = order.iter().map(|h| format!("{},{}", h.q, h.r)).collect();
    let me_raw = i64::try_from(me.get()).expect("i64");
    let keep = |key: &str, owner: i64| -> bool {
        if owner == me_raw || !fog_on {
            return true;
        }
        let (q, r) = key.split_once(',').expect("klucz");
        let k = (q.parse::<i32>().expect("q"), r.parse::<i32>().expect("r"));
        visible.contains(&k) || explored.contains(&k)
    };
    let engine_by_owner =
        collect_territory_hex_keys_by_owner(&hex_keys, &engine_nodes, Some(&keep));
    let mine: BTreeMap<i64, BTreeSet<String>> = dto
        .by_owner
        .iter()
        .map(|o| {
            (
                o.owner_id.legacy_i64(),
                o.hexes.iter().map(|h| format!("{},{}", h.q, h.r)).collect(),
            )
        })
        .collect();
    assert_eq!(
        engine_by_owner, mine,
        "{name}: collect_territory_hex_keys_by_owner"
    );
    let mut owners_sorted: Vec<i64> = dto
        .by_owner
        .iter()
        .map(|o| o.owner_id.legacy_i64())
        .collect();
    owners_sorted.sort_unstable();
    assert_eq!(
        engine_by_owner.keys().copied().collect::<Vec<_>>(),
        owners_sorted,
        "{name}: zbior wlascicieli"
    );
}

#[test]
fn p4_364_vectors_match_pinned_web() {
    let all = cases();
    assert_eq!(all.len(), 12, "liczba przypadkow wektorow");
    for case in &all {
        let name = case["name"].as_str().expect("name");
        let sc = scenario(&case["scenario"]);
        let exp = &case["expected"];
        let mut explored = sc.explored();
        let layers = build_view_layers(&sc.state, &sc.inputs(), &sc.ever_owned, &mut explored)
            .unwrap_or_else(|e| panic!("{name}: {e}"));

        assert_eq!(
            is_awaiting_first_city(&sc.state, sc.me, &sc.ever_owned),
            exp["awaiting"].as_bool().expect("awaiting"),
            "{name}: isAwaitingFirstPlayerCity()"
        );
        // Mgla.
        assert_eq!(
            layers.fog.fog_active,
            exp["fogActive"].as_bool().expect("fogActive"),
            "{name}: fog_active"
        );
        let got: Vec<u64> = layers
            .fog
            .fog
            .state
            .iter()
            .map(|s| u64::from(s.code()))
            .collect();
        let want: Vec<u64> = exp["fog"].as_array().expect("fog").iter().map(n).collect();
        assert_eq!(got, want, "{name}: fog.state");
        assert_eq!(
            sorted_rq(&explored[&sc.me]),
            keys(&exp["exploredAfter"]),
            "{name}: eksploracja ME() po refreshFog"
        );
        // Odkrycie (opcje `setFog`).
        let land = exp["landReveal"].as_bool().unwrap_or(false);
        assert_eq!(
            layers.fog.reveal.reveal_all_land, land,
            "{name}: landReveal"
        );
        let river = if exp["riverRevealKeys"].is_null() {
            None
        } else {
            Some(hex_list(&exp["riverRevealKeys"]))
        };
        assert_eq!(
            layers.fog.reveal.river_reveal_keys, river,
            "{name}: riverRevealKeys"
        );
        // Zasiegi terytorium: `byOwner` (Map) w kolejnosci wstawiania.
        let want_territory: Vec<(i64, Vec<HexCoord>)> = exp["territory"]
            .as_array()
            .expect("territory")
            .iter()
            .map(|t| (t["owner"].as_i64().expect("owner"), hex_list(&t["hexes"])))
            .collect();
        assert_eq!(
            by_owner_of(&layers.territory),
            want_territory,
            "{name}: byOwner"
        );

        assert_ports_agree(
            name,
            &sc.state,
            &SeatFog {
                me: sc.me,
                fog_on: sc.fog_on,
                visible: &layers.fog.visible,
                explored: &layers.fog.explored_for_render,
            },
            &layers.territory,
            Some(&manual_nodes(&case["scenario"])),
        );
    }
}

#[test]
fn p4_364_vectors_cover_required_branches() {
    // Straznik pokrycia: dwa fotele z kluczami rzek (rozne kregi), revealAllLand, mgla wylaczona,
    // zasiegi dla ME()=0 i ME()=1 rozne na tym samym stanie.
    let all = cases();
    let by_name = |name: &str| -> &Value {
        &all.iter()
            .find(|c| c["name"] == name)
            .unwrap_or_else(|| panic!("brak {name}"))["expected"]
    };
    let r0 = &by_name("me0_rzeki_awaiting")["riverRevealKeys"];
    let r1 = &by_name("me1_rzeki_awaiting")["riverRevealKeys"];
    assert!(r0.as_array().is_some_and(|a| !a.is_empty()));
    assert!(r1.as_array().is_some_and(|a| !a.is_empty()));
    assert_ne!(r0, r1);
    assert!(by_name("me0_awaiting_ever_owned")["riverRevealKeys"].is_null());
    assert!(by_name("me1_awaiting_bez_startu")["riverRevealKeys"].is_null());
    assert_eq!(by_name("me0_reveal_all_land")["landReveal"], true);
    assert_eq!(by_name("mgla_wylaczona_awaiting")["fogActive"], false);
    assert_eq!(by_name("mgla_wylaczona_awaiting")["setFogArgs"], 2);
    assert!(by_name("mgla_wylaczona_awaiting")["riverRevealKeys"].is_null());
    // Obrona r1 (zarzut 7b): mgla gry wylaczona, revealAllLand wlaczone, fotel czeka na miasto.
    let w = by_name("mgla_wylaczona_reveal_awaiting");
    assert_eq!(w["fogActive"], true);
    assert_eq!(w["landReveal"], true);
    assert_eq!(w["awaiting"], true);
    assert!(w["riverRevealKeys"]
        .as_array()
        .is_some_and(|a| !a.is_empty()));
    assert_eq!(
        w["riverRevealKeys"],
        by_name("me1_rzeki_awaiting")["riverRevealKeys"]
    );
    assert_ne!(
        by_name("me0_mgla_on")["territory"],
        by_name("me1_mgla_on")["territory"]
    );
    assert_ne!(by_name("me0_mgla_on")["fog"], by_name("me1_mgla_on")["fog"]);
}

#[test]
fn p4_364_missing_explored_seat_is_error() {
    let case = cases()
        .into_iter()
        .find(|c| c["name"] == "me1_mgla_on")
        .expect("me1_mgla_on");
    let sc = scenario(&case["scenario"]);
    let mut explored: ExploredByHuman = BTreeMap::new();
    explored.insert(PlayerId::new(0), BTreeSet::new());
    assert_eq!(
        build_view_layers(&sc.state, &sc.inputs(), &sc.ever_owned, &mut explored),
        Err(DtoBridgeError::MissingExploredSeat(1))
    );
    assert!(explored[&PlayerId::new(0)].is_empty());
}

// ---------------------------------------------------------------------------
// Wektory F2 (renderer) przez `PlayableState`.
// ---------------------------------------------------------------------------

fn f2_state(sc: &Value, dq: i32, dr: i32) -> PlayableState {
    let mut state = base_state();
    let pos = |q: i32, r: i32| {
        PositionDto::new(
            u16::try_from(q + dq).expect("q >= 0"),
            u16::try_from(r + dr).expect("r >= 0"),
        )
    };
    let hexes = keys(&sc["hexes"]);
    let width = hexes.iter().map(|&(q, _)| q + dq).max().expect("hexes") + 1;
    let height = hexes.iter().map(|&(_, r)| r + dr).max().expect("hexes") + 1;
    state.map = PlayableMap {
        width: u16::try_from(width).expect("w"),
        height: u16::try_from(height).expect("h"),
        tiles: hexes
            .iter()
            .map(|&(q, r)| PlayableTile {
                position: pos(q, r),
                terrain: PlayableTerrain::Plains,
                passable: true,
            })
            .collect(),
        improvements: Vec::new(),
    };
    state.units.clear();
    state.cities.clear();
    state.forts.clear();
    for (idx, node) in sc["nodes"].as_array().expect("nodes").iter().enumerate() {
        let owner = PlayerId::new(n(&node["ownerId"]));
        let (q, r) = (i(&node["q"]), i(&node["r"]));
        let is_fort = node["isFort"].as_bool().expect("isFort");
        let is_outpost = node["isOutpost"].as_bool().expect("isOutpost");
        if is_fort || is_outpost {
            state.forts.push(PlayableFort {
                q: q + dq,
                r: r + dr,
                owner_id: owner,
                kind: if is_fort {
                    PlayableFortKind::Fort
                } else {
                    PlayableFortKind::Posterunek
                },
                contested_useless: None,
                built_at_turn: node["order"]["turn"].as_i64(),
                seq: node["order"]["seq"].as_i64(),
            });
        } else {
            // `cityRangeForPopulation` bierze `floor(pop)`, a pop <= 0 daje 0: `u32` po `floor`
            // (ujemne -> 0) jest dla reguly rownowazne.
            let pop = node["pop"].as_f64().expect("pop").floor().max(0.0);
            #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
            let population = pop as u32;
            state.cities.push(PlayableCity {
                id: CityId::new(u64::try_from(idx).expect("idx") + 1),
                owner_id: owner,
                name: format!("miasto-{idx}"),
                position: pos(q, r),
                is_capital: false,
                population,
                culture: 0,
            });
        }
    }
    state
}

#[test]
fn p4_364_f2_vectors_through_playable_state() {
    let doc: Value = serde_json::from_str(F2_VECTORS).expect("f2 vectors.json");
    assert_eq!(doc["pin"], "07d2fbd72");
    let mut used = Vec::new();
    let mut me_seen = BTreeSet::new();
    for sc in doc["scenarios"].as_array().expect("scenarios") {
        let name = sc["name"].as_str().expect("name");
        let negative_owner = sc["nodes"]
            .as_array()
            .expect("nodes")
            .iter()
            .any(|nd| nd["ownerId"].as_i64().expect("owner") < 0);
        if negative_owner {
            continue;
        }
        let hexes = keys(&sc["hexes"]);
        let dq = -hexes.iter().map(|&(q, _)| q).min().expect("hexes").min(0);
        let dr = -hexes.iter().map(|&(_, r)| r).min().expect("hexes").min(0);
        let shift = |k: Vec<Klucz>| -> Vec<Klucz> {
            k.into_iter().map(|(q, r)| (q + dq, r + dr)).collect()
        };
        let state = f2_state(sc, dq, dr);
        let me = PlayerId::new(n(&sc["me"]));
        let fog_on = sc["fogOn"].as_bool().expect("fogOn");
        let visible = btree(&shift(keys(&sc["visible"])));
        let explored = btree(&shift(keys(&sc["explored"])));
        let dto = build_territory_layers(&state, me, fog_on, &visible, &explored)
            .unwrap_or_else(|e| panic!("{name}: {e}"));
        let want: Vec<(i64, Vec<HexCoord>)> = sc["byOwner"]
            .as_array()
            .expect("byOwner")
            .iter()
            .map(|o| {
                (
                    o["ownerId"].as_i64().expect("owner"),
                    shift(keys(&o["hexes"]))
                        .into_iter()
                        .map(|(q, r)| HexCoord::new(q, r))
                        .collect(),
                )
            })
            .collect();
        assert_eq!(
            by_owner_of(&dto),
            want,
            "{name}: byOwner (F2 przez PlayableState)"
        );
        let seat = SeatFog {
            me,
            fog_on,
            visible: &visible,
            explored: &explored,
        };
        assert_ports_agree(name, &state, &seat, &dto, None);
        // Kolejnosc heksow mapy stanu == kolejnosc `hexes` wektora (r-major) po przesunieciu.
        let order: Vec<Klucz> = hex_order(&state);
        assert_eq!(order, shift(hexes.clone()), "{name}: hex_order");
        used.push(name.to_owned());
        me_seen.insert(me.get());
    }
    assert_eq!(
        used,
        [
            "two_owners_fog_off",
            "two_owners_fog_on_me0",
            "two_owners_fog_on_me1",
            "two_owners_fog_on_nothing_seen",
            "pop_edge_cases",
            "pop_fraction_floor",
            "fort_order_seq_tie",
        ],
        "uzyte scenariusze F2"
    );
    assert!(
        me_seen.contains(&0) && me_seen.contains(&1),
        "ME()=0 i ME()=1"
    );
}

#[test]
fn p4_364_fog_off_hex_codes_all_visible() {
    let case = cases()
        .into_iter()
        .find(|c| c["name"] == "mgla_wylaczona_awaiting")
        .expect("mgla_wylaczona_awaiting");
    let sc = scenario(&case["scenario"]);
    let mut explored = sc.explored();
    let layers =
        build_view_layers(&sc.state, &sc.inputs(), &sc.ever_owned, &mut explored).expect("warstwy");
    assert!(!layers.fog.fog_active);
    assert!(layers.fog.fog.state.iter().all(|&s| s == FogState::Visible));
    assert_eq!(layers.fog.reveal.river_reveal_keys, None);
    assert!(!layers.fog.reveal.reveal_all_land);
}
