//! P6.M09 - wycinek rywali klastra (`cluster-spawn.ts`, `clusters.ts`; pin web `edb8fb56`).
//! Wektory z URUCHOMIONEGO weba: `tests/p6_m09_vectors/web-vectors.json` (generator
//! `gen-m09-vectors.mjs` w runie). Mapy: te same 5 specyfikacji co P6.1C (`maps.json`), tozsamosc
//! mapy potwierdza odcisk FNV-1a64 listy hexow. Liczby f64 w wektorach sa TEKSTEM i porownujemy je
//! bit-w-bit (`to_bits`).

use std::collections::HashSet;
use std::sync::OnceLock;

use civ_engine::data::civilizations::{parse_city_names_pools, parse_civs, CityNamesPoolsFile};
use civ_engine::domain::civ_names::{civ_names_defs_from_file, CivNamesDef};
use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::{GeneratedMap, HexTile, Terrain, WorldType};
use civ_engine::domain::mapgen::cluster_rivals::{
    build_same_type_rival_candidate_hexes, build_same_type_rival_slots, cluster_city_state_max_hex,
    cluster_city_state_min_hex, cluster_growth_reserve, cluster_pack_radius,
    compute_same_type_rival_half_plane_axis, group_foreign_type_clusters, hexes_at_distance,
    is_in_same_type_rival_half_plane, land_hexes_from_game_map, land_pool_near_core,
    map_center_from_game_map, min_dist_foreign_from_player, min_dist_foreign_in_cluster,
    min_dist_start_city_state, pack_city_states_around_capital, pack_city_states_hub_chain,
    pack_nearest_legal_land, pack_rival_cities_around_core, passes_foreign_cluster_buffer_gate,
    shuffle_in_place, AnchorHex, ForeignClusterBuffer, HubChainOpts, NearestLegalLandOpts,
    PackAroundCapitalOpts, PointF64, SameTypeRivalHalfPlaneAxis,
};
use civ_engine::domain::rng::Mulberry32;
use civ_engine::domain::start_position::{ClusterSpawnSlot, ForeignTypeClusterGroup};
use civ_engine::domain::PlayerId;
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m09_vectors/web-vectors.json");
const MAPS: &str = include_str!("p6_1c_vectors/maps.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn cases(name: &str) -> &'static Vec<Value> {
    web()["cases"][name]
        .as_array()
        .unwrap_or_else(|| panic!("brak przypadkow {name}"))
}

fn maps() -> &'static Value {
    static M: OnceLock<Value> = OnceLock::new();
    M.get_or_init(|| serde_json::from_str(MAPS).expect("maps parse"))
}

fn fnv1a64(bytes: &[u8]) -> String {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in bytes {
        h ^= u64::from(*b);
        h = h.wrapping_mul(0x0000_0100_0000_01b3);
    }
    format!("{h:016x}")
}

fn i(v: &Value) -> i64 {
    v.as_i64().expect("i64")
}

fn hx(v: &Value) -> HexCoord {
    let a = v.as_array().expect("[q,r]");
    HexCoord::new(
        i32::try_from(i(&a[0])).expect("q i32"),
        i32::try_from(i(&a[1])).expect("r i32"),
    )
}

fn hxs(v: &Value) -> Vec<HexCoord> {
    v.as_array().expect("lista").iter().map(hx).collect()
}

fn fl(v: &Value) -> f64 {
    v.as_str().expect("f64 jako tekst").parse().expect("f64")
}

fn bits_eq(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits()
}

fn fixture(id: &str) -> Vec<HexCoord> {
    hxs(&web()["fixtures"][id])
}

fn axis(v: &Value) -> SameTypeRivalHalfPlaneAxis {
    SameTypeRivalHalfPlaneAxis {
        dq: fl(&v["dq"]),
        dr: fl(&v["dr"]),
    }
}

fn buffers(v: &Value) -> Vec<ForeignClusterBuffer> {
    v.as_array()
        .expect("buffers")
        .iter()
        .map(|b| ForeignClusterBuffer {
            q: i32::try_from(i(&b["q"])).expect("q"),
            r: i32::try_from(i(&b["r"])).expect("r"),
            radius: fl(&b["radius"]),
        })
        .collect()
}

fn anchor(v: &Value) -> Option<AnchorHex> {
    if v.is_null() {
        return None;
    }
    Some(AnchorHex {
        q: i32::try_from(i(&v["q"])).expect("q"),
        r: i32::try_from(i(&v["r"])).expect("r"),
        min_dist: i(&v["minDist"]),
    })
}

/// Opcje zserializowane przez generator (klucze nieobecne = brak opcji w webie).
struct Opts {
    exclude: Option<HexCoord>,
    anchor: Option<AnchorHex>,
    axis: Option<SameTypeRivalHalfPlaneAxis>,
    buffers: Vec<ForeignClusterBuffer>,
    growth: Option<i64>,
    rings: Option<Vec<i64>>,
}

fn opts(v: &Value) -> Opts {
    Opts {
        exclude: v.get("exclude").map(hx),
        anchor: v.get("anchor").and_then(anchor),
        axis: v.get("axis").map(axis),
        buffers: v.get("buffers").map(buffers).unwrap_or_default(),
        growth: v.get("growthReserve").map(i),
        rings: v
            .get("ringDistances")
            .map(|r| r.as_array().expect("rings").iter().map(i).collect()),
    }
}

fn describe(case: &Value) -> String {
    let s = case.to_string();
    s.chars().take(240).collect()
}

fn terrain(web: &str) -> Terrain {
    match web {
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "wzgorza" => Terrain::Hills,
        "gory" => Terrain::Mountains,
        "plytkie_morze" => Terrain::ShallowSea,
        "morze" => Terrain::Sea,
        "pustynia" => Terrain::Desert,
        "polarny" => Terrain::Polar,
        other => panic!("nieznany teren weba {other}"),
    }
}

fn game_map(id: &str) -> GeneratedMap {
    let m = &maps()["maps"][id];
    let width = u32::try_from(i(&m["szerokoscQ"])).expect("w");
    let height = u32::try_from(i(&m["wysokoscR"])).expect("h");
    let tiles = m["hexes"]
        .as_array()
        .expect("hexes")
        .iter()
        .map(|row| HexTile {
            coord: civ_engine::domain::map_generator::HexCoord::new(
                i32::try_from(i(&row[0])).expect("q"),
                i32::try_from(i(&row[1])).expect("r"),
            ),
            terrain: terrain(row[2].as_str().expect("teren")),
            forest: false,
            river: false,
        })
        .collect();
    GeneratedMap {
        width,
        height,
        seed: u32::try_from(i(&m["seed"])).expect("seed"),
        world_type: WorldType::default(),
        tiles,
    }
}

fn civs() -> &'static Vec<CivNamesDef> {
    static C: OnceLock<Vec<CivNamesDef>> = OnceLock::new();
    C.get_or_init(|| civ_names_defs_from_file(&parse_civs().expect("civs parse")))
}

fn pools() -> &'static CityNamesPoolsFile {
    static P: OnceLock<CityNamesPoolsFile> = OnceLock::new();
    P.get_or_init(|| parse_city_names_pools().expect("pools parse"))
}

fn seed(v: &Value) -> u32 {
    u32::try_from(i(v)).expect("seed u32")
}

#[test]
fn vectors_identify_the_same_maps_as_p6_1c() {
    // Dowod, ze mapy z wektorow M09 to dokladnie `tests/p6_1c_vectors/maps.json`.
    for (id, spec) in web()["maps"].as_object().expect("maps") {
        let m = &maps()["maps"][id];
        let canon = m["hexes"]
            .as_array()
            .expect("hexes")
            .iter()
            .map(|r| {
                format!(
                    "{},{},{}",
                    i(&r[0]),
                    i(&r[1]),
                    r[2].as_str().expect("teren")
                )
            })
            .collect::<Vec<_>>()
            .join(";");
        assert_eq!(
            fnv1a64(canon.as_bytes()),
            spec["hexesFnv"].as_str().unwrap(),
            "{id}"
        );
        assert_eq!(
            m["hexes"].as_array().unwrap().len() as i64,
            i(&spec["hexCount"]),
            "{id}"
        );
    }
}

#[test]
fn constants_match_web_and_aliases_are_not_separate_numbers() {
    let c = &web()["cases"]["consts"];
    assert_eq!(
        cluster_city_state_min_hex(),
        i(&c["CLUSTER_CITY_STATE_MIN_HEX"])
    );
    assert_eq!(
        cluster_city_state_max_hex(),
        i(&c["CLUSTER_CITY_STATE_MAX_HEX"])
    );
    assert_eq!(
        min_dist_start_city_state(),
        i(&c["MIN_DIST_START_CITY_STATE"])
    );
    assert_eq!(
        min_dist_foreign_from_player(),
        i(&c["MIN_DIST_FOREIGN_FROM_PLAYER"])
    );
    assert_eq!(
        min_dist_foreign_in_cluster(),
        i(&c["MIN_DIST_FOREIGN_IN_CLUSTER"])
    );
    assert_eq!(cluster_growth_reserve(), i(&c["CLUSTER_GROWTH_RESERVE"]));
    // Web: :49 i :56 to aliasy :42 (jedno pole tabeli, nie osobne liczby).
    assert_eq!(min_dist_start_city_state(), cluster_city_state_min_hex());
    assert_eq!(min_dist_foreign_in_cluster(), min_dist_start_city_state());
}

#[test]
fn cluster_pack_radius_matches_web() {
    let list = cases("clusterPackRadius");
    assert!(list.len() >= 100);
    for c in list {
        assert_eq!(
            cluster_pack_radius(i(&c["maxMiast"]), i(&c["minDist"])),
            i(&c["out"]),
            "{}",
            describe(c)
        );
    }
}

#[test]
fn shuffle_in_place_matches_web() {
    let list = cases("shuffle");
    assert!(list.len() >= 70);
    for c in list {
        let n = i(&c["n"]) as usize;
        let mut arr: Vec<i64> = (0..n as i64).collect();
        let mut rng = Mulberry32::new(seed(&c["seed"]));
        shuffle_in_place(&mut arr, &mut rng);
        let want: Vec<i64> = c["out"].as_array().unwrap().iter().map(i).collect();
        assert_eq!(arr, want, "{}", describe(c));
    }
}

#[test]
fn foreign_buffer_gate_matches_web() {
    let list = cases("bufferGate");
    assert!(list.iter().any(|c| c["out"] == Value::Bool(true)));
    assert!(list.iter().any(|c| c["out"] == Value::Bool(false)));
    for c in list {
        let got = passes_foreign_cluster_buffer_gate(hx(&c["h"]), &buffers(&c["buffers"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{}", describe(c));
    }
}

#[test]
fn hexes_at_distance_matches_web() {
    for c in cases("hexesAt") {
        let got = hexes_at_distance(
            i32::try_from(i(&c["q"])).unwrap(),
            i32::try_from(i(&c["r"])).unwrap(),
            i(&c["dist"]),
        );
        assert_eq!(got, hxs(&c["out"]), "{}", describe(c));
    }
}

#[test]
fn half_plane_axis_matches_web_bitwise() {
    let list = cases("axis");
    assert!(list.len() >= 200);
    for c in list {
        let center = c["center"].as_array().unwrap();
        let got = compute_same_type_rival_half_plane_axis(
            hx(&c["capital"]),
            PointF64 {
                q: fl(&center[0]),
                r: fl(&center[1]),
            },
            seed(&c["seed"]),
        );
        let want = axis(&c["out"]);
        assert!(
            bits_eq(got.dq, want.dq) && bits_eq(got.dr, want.dr),
            "{} got {:?}",
            describe(c),
            got
        );
    }
}

#[test]
fn is_in_half_plane_matches_web() {
    let list = cases("halfPlane");
    assert!(list.iter().any(|c| c["out"] == Value::Bool(true)));
    assert!(list.iter().any(|c| c["out"] == Value::Bool(false)));
    for c in list {
        let margin = if c["margin"].is_null() {
            None
        } else {
            Some(fl(&c["margin"]))
        };
        let got = is_in_same_type_rival_half_plane(
            hx(&c["hex"]),
            hx(&c["capital"]),
            axis(&c["axis"]),
            margin,
        );
        assert_eq!(got, c["out"].as_bool().unwrap(), "{}", describe(c));
    }
}

#[test]
fn land_pool_near_core_matches_web() {
    let list = cases("landPool");
    assert!(list
        .iter()
        .any(|c| c["maxRadius"].is_null() && !c["out"].as_array().unwrap().is_empty()));
    for c in list {
        let region = fixture(c["land"].as_str().unwrap());
        let max_radius = if c["maxRadius"].is_null() {
            None
        } else {
            Some(i(&c["maxRadius"]))
        };
        let got = land_pool_near_core(
            &region,
            hx(&c["centrum"]),
            i(&c["maxMiast"]),
            i(&c["minDist"]),
            max_radius,
        );
        assert_eq!(got, hxs(&c["out"]), "{}", describe(c));
    }
}

#[test]
fn hub_chain_matches_web() {
    let list = cases("hubChain");
    assert!(
        list.iter()
            .filter(|c| !c["out"].as_array().unwrap().is_empty())
            .count()
            >= 50
    );
    for c in list {
        let land = fixture(c["land"].as_str().unwrap());
        let o = opts(&c["opts"]);
        let hub_opts = HubChainOpts {
            exclude_hex: o.exclude,
            anchor: o.anchor,
            half_plane_axis: o.axis,
            foreign_buffers: &o.buffers,
        };
        let got = pack_city_states_hub_chain(
            &land,
            hx(&c["core"]),
            i(&c["count"]),
            i(&c["minSep"]),
            i(&c["ringDist"]),
            seed(&c["seed"]),
            &hub_opts,
        );
        assert_eq!(got, hxs(&c["out"]), "{}", describe(c));
    }
}

#[test]
fn nearest_legal_land_matches_web() {
    let list = cases("nearest");
    assert!(
        list.iter()
            .filter(|c| c["out"].as_array().unwrap().len() > c["initial"].as_array().unwrap().len())
            .count()
            >= 40
    );
    for c in list {
        let land = fixture(c["land"].as_str().unwrap());
        let o = opts(&c["opts"]);
        let n_opts = NearestLegalLandOpts {
            exclude_hex: o.exclude.expect("exclude wymagane"),
            anchor: o.anchor,
            half_plane_axis: o.axis,
            foreign_buffers: &o.buffers,
        };
        let got = pack_nearest_legal_land(
            &land,
            hx(&c["core"]),
            i(&c["count"]),
            i(&c["minSep"]),
            &hxs(&c["initial"]),
            &n_opts,
        );
        assert_eq!(got, hxs(&c["out"]), "{}", describe(c));
    }
}

#[test]
fn pack_around_capital_matches_web() {
    let list = cases("aroundCapital");
    assert!(
        list.iter()
            .filter(|c| !c["out"]["stateCities"].as_array().unwrap().is_empty())
            .count()
            >= 100
    );
    assert!(
        list.iter()
            .filter(|c| !c["out"]["growthSlot"].is_null())
            .count()
            >= 50
    );
    for c in list {
        let all_land = fixture(c["land"].as_str().unwrap());
        let region = if c["region"].is_null() {
            all_land.clone()
        } else {
            hxs(&c["region"])
        };
        let o = opts(&c["opts"]);
        let p_opts = PackAroundCapitalOpts {
            exclude_hex: o.exclude,
            anchor: o.anchor,
            growth_reserve: o.growth,
            half_plane_axis: o.axis,
            foreign_buffers: &o.buffers,
            ring_distances: o.rings.as_deref(),
        };
        let got = pack_city_states_around_capital(
            &all_land,
            &region,
            hx(&c["core"]),
            i(&c["stateCityCount"]),
            i(&c["minDist"]),
            seed(&c["seed"]),
            &p_opts,
        );
        assert_eq!(
            got.state_cities,
            hxs(&c["out"]["stateCities"]),
            "{}",
            describe(c)
        );
        let want_growth = if c["out"]["growthSlot"].is_null() {
            None
        } else {
            Some(hx(&c["out"]["growthSlot"]))
        };
        assert_eq!(got.growth_slot, want_growth, "{}", describe(c));
    }
}

#[test]
fn pack_rival_cities_matches_web() {
    let list = cases("rivalCore");
    assert!(
        list.iter()
            .filter(|c| !c["out"].as_array().unwrap().is_empty())
            .count()
            >= 50
    );
    for c in list {
        let land = fixture(c["land"].as_str().unwrap());
        let center = if c["mapCenter"].is_null() {
            None
        } else {
            let a = c["mapCenter"].as_array().unwrap();
            Some(PointF64 {
                q: fl(&a[0]),
                r: fl(&a[1]),
            })
        };
        let got = pack_rival_cities_around_core(
            &land,
            hx(&c["core"]),
            i(&c["rivalCount"]),
            i(&c["minDist"]),
            seed(&c["seed"]),
            center,
        );
        assert_eq!(got, hxs(&c["out"]), "{}", describe(c));
    }
}

#[test]
fn map_helpers_match_web() {
    for c in cases("mapHelpers") {
        let map = game_map(c["map"].as_str().unwrap());
        let land = land_hexes_from_game_map(&map);
        assert_eq!(land.len() as i64, i(&c["landCount"]), "{}", describe(c));
        let canon = land
            .iter()
            .map(|h| format!("{},{}", h.q, h.r))
            .collect::<Vec<_>>()
            .join(";");
        assert_eq!(
            fnv1a64(canon.as_bytes()),
            c["landFnv"].as_str().unwrap(),
            "{}",
            describe(c)
        );
        let center = map_center_from_game_map(&map);
        let want = c["center"].as_array().unwrap();
        assert!(bits_eq(center.q, fl(&want[0])) && bits_eq(center.r, fl(&want[1])));
    }
}

#[test]
fn rival_candidate_hexes_match_web_on_real_maps() {
    let list = cases("candidates");
    assert!(
        list.iter()
            .filter(|c| !c["out"].as_array().unwrap().is_empty())
            .count()
            >= 200
    );
    for c in list {
        let map = game_map(c["map"].as_str().unwrap());
        let got = build_same_type_rival_candidate_hexes(
            &map,
            hx(&c["core"]),
            i(&c["rivalCount"]),
            seed(&c["seed"]),
        );
        assert_eq!(got, hxs(&c["out"]), "{}", describe(c));
    }
}

#[test]
fn rival_slots_match_web_on_real_maps() {
    let list = cases("slots");
    assert!(
        list.iter()
            .filter(|c| !c["out"].as_array().unwrap().is_empty())
            .count()
            >= 400
    );
    for c in list {
        let map = game_map(c["map"].as_str().unwrap());
        let with_pools = c["pools"].as_bool().unwrap();
        let got = build_same_type_rival_slots(
            &map,
            civs(),
            hx(&c["core"]),
            c["typ"].as_str().unwrap(),
            i(&c["rivalCount"]),
            seed(&c["seed"]),
            PlayerId::new(c["firstOwnerId"].as_u64().unwrap()),
            if with_pools { Some(pools()) } else { None },
        );
        let want = c["out"].as_array().unwrap();
        assert_eq!(got.len(), want.len(), "{}", describe(c));
        for (g, w) in got.iter().zip(want) {
            assert_eq!(
                g.owner_id,
                PlayerId::new(w["ownerId"].as_u64().unwrap()),
                "{}",
                describe(c)
            );
            assert_eq!(
                g.hex,
                HexCoord::new(i(&w["q"]) as i32, i(&w["r"]) as i32),
                "{}",
                describe(c)
            );
            assert_eq!(
                g.city_name,
                w["nazwaMiasta"].as_str().unwrap(),
                "{}",
                describe(c)
            );
            assert_eq!(g.typ, w["typ"].as_str().unwrap());
            assert_eq!(
                g.is_same_type_rival,
                w["isSameTypeRival"].as_bool().unwrap()
            );
            assert_eq!(g.is_player_capital, w["isPlayerCapital"].as_bool().unwrap());
            // Web nie ustawia `isClusterCapital` w slotach rywali (klucz nieobecny).
            assert!(!w["hasIsClusterCapital"].as_bool().unwrap());
            assert_eq!(g.is_cluster_capital, None);
        }
        // Nazwy w obrebie planu sa unikalne i rozne od stolicy gracza (usedNames).
        let names: HashSet<&str> = got.iter().map(|s| s.city_name.as_str()).collect();
        assert_eq!(names.len(), got.len(), "{}", describe(c));
    }
}

#[test]
fn group_foreign_type_clusters_matches_web() {
    let list = cases("group");
    assert!(list
        .iter()
        .any(|c| !c["out"].as_array().unwrap().is_empty()));
    for c in list {
        let slots: Vec<ClusterSpawnSlot> = c["slots"]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| ClusterSpawnSlot {
                owner_id: PlayerId::new(s["ownerId"].as_u64().unwrap()),
                hex: HexCoord::new(i(&s["q"]) as i32, i(&s["r"]) as i32),
                city_name: String::new(),
                typ: s["typ"].as_str().unwrap().to_owned(),
                is_same_type_rival: s["isSameTypeRival"].as_bool().unwrap(),
                is_player_capital: false,
                is_cluster_capital: None,
            })
            .collect();
        let want: Vec<ForeignTypeClusterGroup> = c["out"]
            .as_array()
            .unwrap()
            .iter()
            .map(|g| ForeignTypeClusterGroup {
                typ: g["typ"].as_str().unwrap().to_owned(),
                owner_ids: g["ownerIds"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|x| PlayerId::new(x.as_u64().unwrap()))
                    .collect(),
                positions: hxs(&g["positions"]),
            })
            .collect();
        assert_eq!(group_foreign_type_clusters(&slots), want, "{}", describe(c));
    }
}

#[test]
fn hub_chain_result_does_not_depend_on_seed_as_in_web() {
    // Web (potwierdzone w generatorze: rzuca blad przy roznicy): `shuffleInPlace` poprzedza PELNE
    // sortowanie (q, r) kandydatow, wiec ziarno hub-chain (maska xor i ponowienia) nie zmienia wyniku.
    let list = cases("seedIndependence");
    assert!(
        list.iter()
            .filter(|c| !c["out"].as_array().unwrap().is_empty())
            .count()
            >= 20
    );
    for c in list {
        let land = fixture(c["land"].as_str().unwrap());
        for s in c["seeds"].as_array().unwrap() {
            let got = pack_city_states_hub_chain(
                &land,
                hx(&c["core"]),
                i(&c["count"]),
                i(&c["minSep"]),
                i(&c["ringDist"]),
                seed(s),
                &HubChainOpts::default(),
            );
            assert_eq!(got, hxs(&c["out"]), "seed {s} {}", describe(c));
        }
    }
}

#[test]
fn rival_slots_degenerate_inputs_do_not_panic() {
    // Wejscia brzegowe zachowane z webu: licznik <= 0 => pusto; pusta mapa ladu => pusto.
    let map = game_map("k3small");
    let core = HexCoord::new(5, 5);
    assert!(build_same_type_rival_slots(
        &map,
        civs(),
        core,
        "rzymianie",
        0,
        1,
        PlayerId::new(1),
        None
    )
    .is_empty());
    assert!(build_same_type_rival_slots(
        &map,
        civs(),
        core,
        "rzymianie",
        -3,
        1,
        PlayerId::new(1),
        None
    )
    .is_empty());
    assert!(build_same_type_rival_candidate_hexes(&map, core, 0, 1).is_empty());
    let empty = GeneratedMap {
        width: 4,
        height: 4,
        seed: 0,
        world_type: WorldType::default(),
        tiles: Vec::new(),
    };
    assert!(build_same_type_rival_candidate_hexes(&empty, core, 3, 1).is_empty());
}
