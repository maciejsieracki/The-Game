//! P6.M12 - `buildClusterSpawnPlan` (`cluster-spawn.ts:210-445`), `ClusterSpawnPlan` (`:54-69`) i
//! `BuildClusterSpawnInput` (`:166-188`) z WEKTORAMI z URUCHOMIONEGO weba
//! (`p6_m12_vectors/web-vectors.json`) oraz z wynikami `buildClusterSpawnPlan` zapisanymi przez
//! P6.1C (`p6_1c_vectors/cluster-start.json`, prawdziwy `buildClusterStartPlan` -> `spawnPlan`).

#[path = "p6_m12_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::civilizations::{parse_city_names_pools, CityNamesPoolsFile};
use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::{GeneratedMap, HexTile, Terrain, WorldType};
use civ_engine::domain::mapgen::cluster_compute::{
    build_cluster_spawn_plan, BuildClusterSpawnInput, ClusterComputeError, ClusterSpawnPlan,
};
use civ_engine::domain::start_position::{
    ClusterSpawnPlan as StartClusterSpawnPlan, ClusterSpawnSlot, ForeignTypeClusterGroup,
};
use civ_engine::domain::PlayerId;
use common::*;
use serde_json::Value;

fn pools() -> &'static CityNamesPoolsFile {
    static P: std::sync::OnceLock<CityNamesPoolsFile> = std::sync::OnceLock::new();
    P.get_or_init(|| parse_city_names_pools().expect("pools parse"))
}

fn pid(v: &Value) -> PlayerId {
    PlayerId::new(v.as_u64().expect("owner id"))
}

fn pids(v: &Value) -> Vec<PlayerId> {
    v.as_array().expect("ids").iter().map(pid).collect()
}

/// Porownanie planu z wektorem `planOut`. Zwraca opis pierwszej roznicy.
fn plan_diff(map: &GeneratedMap, got: &ClusterSpawnPlan, want: &Value) -> Option<String> {
    macro_rules! eq {
        ($name:expr, $a:expr, $b:expr) => {
            if $a != $b {
                return Some(format!("{}: rust {:?} != web {:?}", $name, $a, $b));
            }
        };
    }
    eq!(
        "playerStartHex",
        got.player_start_hex,
        hex(&want["playerStartHex"])
    );
    eq!(
        "playerStartCityName",
        got.player_start_city_name.as_str(),
        s(&want["playerStartCityName"])
    );
    let want_slots = want["slots"].as_array().expect("slots");
    eq!("liczba slotow", got.slots.len(), want_slots.len());
    for (idx, (g, w)) in got.slots.iter().zip(want_slots).enumerate() {
        let want_slot = ClusterSpawnSlot {
            owner_id: pid(&w["ownerId"]),
            hex: HexCoord::new(i(&w["q"]) as i32, i(&w["r"]) as i32),
            city_name: s(&w["nazwa"]).to_string(),
            typ: s(&w["typ"]).to_string(),
            is_same_type_rival: w["sameRival"].as_bool().expect("sameRival"),
            is_player_capital: w["playerCap"].as_bool().expect("playerCap"),
            is_cluster_capital: w["clusterCap"].as_bool(),
        };
        if *g != want_slot {
            return Some(format!("slot {idx}: rust {g:?} != web {want_slot:?}"));
        }
    }
    let want_groups: Vec<ForeignTypeClusterGroup> = want["foreign"]
        .as_array()
        .expect("foreign")
        .iter()
        .map(|g| ForeignTypeClusterGroup {
            typ: s(&g["typ"]).to_string(),
            owner_ids: pids(&g["ownerIds"]),
            positions: hexes(&g["positions"]),
        })
        .collect();
    eq!(
        "foreignTypeClusters",
        got.foreign_type_clusters,
        want_groups
    );
    eq!(
        "pendingSameTypeRivals",
        got.pending_same_type_rivals,
        i(&want["pendingRivals"])
    );
    eq!(
        "pendingSameTypeRivalHexes",
        got.pending_same_type_rival_hexes,
        hexes(&want["pendingHexes"])
    );
    eq!(
        "clusterCapitalOwnerIds",
        got.cluster_capital_owner_ids,
        pids(&want["clusterCapIds"])
    );
    eq!(
        "pendingSameTypeRivalOwnerIds",
        got.pending_same_type_rival_owner_ids,
        pids(&want["pendingOwnerIds"])
    );
    placement_diff(map, &got.placement, &want["placement"]).map(|d| format!("placement: {d}"))
}

fn run(map: &GeneratedMap, spec: &Spec) -> Result<ClusterSpawnPlan, ClusterComputeError> {
    build_cluster_spawn_plan(&BuildClusterSpawnInput {
        map,
        civs: civs(),
        seed: spec.seed.expect("seed"),
        player_typ: spec.player_typ.as_deref().expect("playerTyp"),
        rywale_na_klaster: spec.rywale.expect("rywale"),
        aktywne_typy: spec.aktywne_typy,
        start_epoch_id: spec.epoch.as_deref(),
        city_names_pools: if spec.pools { Some(pools()) } else { None },
        preferred_civ_ids: spec.preferred.as_deref(),
    })
}

/// Liczba hexow mapy z wektora.
fn hex_count(id: &str) -> usize {
    u(&rep(id)["w"]) * u(&rep(id)["h"])
}

/// Niezmienniki ownerId (bez pinow wartosci): sloty obcych typow maja unikalne ownerId, rezerwacje
/// rywali tego samego typu sa ciagle i leza PO slotach, a stolice klastrow sa podzbiorem slotow.
fn assert_owner_invariants(id: &str, spec: &Spec, got: &ClusterSpawnPlan) {
    let n_planned: usize = got
        .placement
        .klastry
        .iter()
        .filter(|k| k.typ_index != got.placement.player_typ_index)
        .map(|k| k.miasta.len())
        .sum();
    let reserved: Vec<u64> = got
        .pending_same_type_rival_owner_ids
        .iter()
        .map(|p| p.get())
        .collect();
    // Rezerwacje ownerId powstaja tylko, gdy klaster gracza istnieje (wczesny powrot planu bez
    // klastra gracza zwraca puste listy, a `pending_same_type_rivals` = liczba rywali).
    let player_ok = got
        .placement
        .klastry
        .get(got.placement.player_typ_index)
        .is_some_and(|k| !k.miasta.is_empty());
    let expected_reserved = if player_ok {
        spec.rywale.expect("rywale").max(0)
    } else {
        0
    };
    assert_eq!(
        reserved.len() as i64,
        expected_reserved,
        "{id}: liczba rezerwacji"
    );
    if let Some(first) = reserved.first() {
        assert!(
            *first > got.slots.len() as u64,
            "{id}: rezerwacja {first} nie jest po slotach ({})",
            got.slots.len()
        );
        assert!(*first <= n_planned as u64 + 1, "{id}: rezerwacja za daleko");
    }
    for w in reserved.windows(2) {
        assert_eq!(w[1], w[0] + 1, "{id}: rezerwacje nieciagle");
    }
    let owners: BTreeSet<u64> = got.slots.iter().map(|s| s.owner_id.get()).collect();
    assert_eq!(owners.len(), got.slots.len(), "{id}: dublet ownerId");
    for cap in &got.cluster_capital_owner_ids {
        assert!(
            owners.contains(&cap.get()),
            "{id}: stolica klastra spoza slotow"
        );
    }
    assert!(got
        .slots
        .iter()
        .all(|s| !s.is_same_type_rival && !s.is_player_capital));
}

/// Porownuje plan spawnu z webem na przypadkach, ktorych mapa ma `lo < hexy <= hi` (podzial na
/// grupy pozwala testom isc rownolegle). Zwraca liczbe sprawdzonych przypadkow.
fn check_spawn_group(lo: usize, hi: usize) -> usize {
    let mut checked = 0;
    for c in cases("spawn") {
        let id = s(&c["map"]);
        let n = hex_count(id);
        if n <= lo || n > hi {
            continue;
        }
        let map = map_of(id);
        let spec = spec_of(&c["spec"]);
        let got = run(map, &spec);
        checked += 1;
        if c["threw"].as_bool().expect("threw") {
            assert!(
                matches!(
                    got.as_ref().err(),
                    Some(ClusterComputeError::DiagnosticRegionMissing { .. })
                ),
                "{id} {}: web rzuca (log diagnostyczny), port: {:?}",
                c["spec"],
                got.as_ref().err()
            );
            continue;
        }
        let got = got.unwrap_or_else(|e| panic!("{id} {}: port rzuca ({e}), web nie", c["spec"]));
        if let Some(d) = plan_diff(map, &got, &c["result"]) {
            panic!("{id} {}: {d}", c["spec"]);
        }
        assert_owner_invariants(id, &spec, &got);
    }
    checked
}

#[test]
fn build_cluster_spawn_plan_matches_web_maps_up_to_500_hexes() {
    assert!(check_spawn_group(0, 500) >= 30);
}

#[test]
fn build_cluster_spawn_plan_matches_web_maps_501_to_1100_hexes() {
    assert!(check_spawn_group(500, 1100) >= 50);
}

#[test]
fn build_cluster_spawn_plan_matches_web_maps_1101_to_2500_hexes() {
    assert!(check_spawn_group(1100, 2500) >= 40);
}

#[test]
fn build_cluster_spawn_plan_matches_web_maps_over_2500_hexes() {
    assert!(check_spawn_group(2500, usize::MAX) >= 40);
}

#[test]
fn spawn_vectors_cover_the_paths_of_buildclusterspawnplan() {
    // Pokrycie liczone na DANYCH weba (bez ponownego liczenia).
    let rows = cases("spawn");
    assert!(rows.len() >= 280, "za malo przypadkow: {}", rows.len());
    let mut threw = 0;
    let mut empty_plans = 0;
    let mut with_pools = 0;
    let mut with_foreign = 0;
    let mut rivals = 0;
    let mut moved_player = 0;
    let mut dropped = 0;
    for c in rows {
        if c["spec"]["pools"].as_bool() == Some(true) {
            with_pools += 1;
        }
        if c["threw"].as_bool() == Some(true) {
            threw += 1;
            continue;
        }
        let r = &c["result"];
        if r["slots"].as_array().expect("slots").is_empty() {
            empty_plans += 1;
        } else {
            with_foreign += 1;
        }
        if !r["pendingOwnerIds"].as_array().expect("ids").is_empty() {
            rivals += 1;
        }
        let planned: usize = r["placement"]["klastry"]
            .as_array()
            .expect("klastry")
            .iter()
            .skip(1)
            .map(|k| k["miasta"].as_array().expect("miasta").len())
            .sum();
        if r["slots"].as_array().expect("slots").len() < planned {
            dropped += 1;
        }
        let first = r["placement"]["klastry"]
            .as_array()
            .expect("klastry")
            .first();
        if let Some(k) = first {
            let cap = k["miasta"]
                .as_array()
                .expect("miasta")
                .iter()
                .find(|m| m[2].as_bool() == Some(true));
            if let Some(cap) = cap {
                if cap[0] != r["playerStartHex"][0] || cap[1] != r["playerStartHex"][1] {
                    moved_player += 1;
                }
            }
        }
    }
    assert!(threw >= 1, "rzucenia weba: {threw}");
    assert!(empty_plans >= 5, "plany bez slotow: {empty_plans}");
    assert!(with_foreign >= 200, "plany z obcymi typami: {with_foreign}");
    assert!(with_pools >= 100, "plany z pulami nazw: {with_pools}");
    assert!(rivals >= 150, "plany z rezerwacja rywali: {rivals}");
    // Sciezki naprawcze planu (odrzucone sloty / relokacja gracza) NIE sa pinowane: ich brak w
    // wektorach jest opisany w dokumencie (§6), a parytet kazdego planu sprawdza petla powyzej.
    let _ = (dropped, moved_player);
}

// ---------------------------------------------------------------------------------------------
// Zgodnosc z P6.1C: spawnPlan zapisany przez prawdziwy buildClusterStartPlan weba
// ---------------------------------------------------------------------------------------------

const MAPS_1C: &str = include_str!("p6_1c_vectors/maps.json");
const VECTORS_1C: &str = include_str!("p6_1c_vectors/cluster-start.json");

fn terrain_1c(web: &str) -> Terrain {
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

fn map_1c(maps: &Value, id: &str) -> GeneratedMap {
    let m = &maps["maps"][id];
    let (w, h) = (u(&m["szerokoscQ"]), u(&m["wysokoscR"]));
    let tiles: Vec<HexTile> = m["hexes"]
        .as_array()
        .expect("hexes")
        .iter()
        .map(|row| HexTile {
            coord: civ_engine::domain::map_generator::HexCoord::new(
                i(&row[0]) as i32,
                i(&row[1]) as i32,
            ),
            terrain: terrain_1c(s(&row[2])),
            forest: false,
            river: false,
        })
        .collect();
    assert_eq!(tiles.len(), w * h, "{id}");
    GeneratedMap {
        width: w as u32,
        height: h as u32,
        seed: 0,
        world_type: WorldType::Continents,
        tiles,
    }
}

fn start_plan_of(v: &Value) -> StartClusterSpawnPlan {
    StartClusterSpawnPlan {
        player_start_hex: HexCoord::new(
            i(&v["playerStartHex"]["q"]) as i32,
            i(&v["playerStartHex"]["r"]) as i32,
        ),
        player_start_city_name: s(&v["playerStartCityName"]).to_string(),
        slots: v["slots"]
            .as_array()
            .expect("slots")
            .iter()
            .map(|w| ClusterSpawnSlot {
                owner_id: pid(&w["ownerId"]),
                hex: HexCoord::new(i(&w["q"]) as i32, i(&w["r"]) as i32),
                city_name: s(&w["nazwaMiasta"]).to_string(),
                typ: s(&w["typ"]).to_string(),
                is_same_type_rival: w["isSameTypeRival"].as_bool().expect("flag"),
                is_player_capital: w["isPlayerCapital"].as_bool().expect("flag"),
                is_cluster_capital: w["isClusterCapital"].as_bool(),
            })
            .collect(),
        foreign_type_clusters: v["foreignTypeClusters"]
            .as_array()
            .expect("groups")
            .iter()
            .map(|g| ForeignTypeClusterGroup {
                typ: s(&g["typ"]).to_string(),
                owner_ids: pids(&g["ownerIds"]),
                positions: g["positions"]
                    .as_array()
                    .expect("positions")
                    .iter()
                    .map(|p| HexCoord::new(i(&p["q"]) as i32, i(&p["r"]) as i32))
                    .collect(),
            })
            .collect(),
        pending_same_type_rivals: u32::try_from(i(&v["pendingSameTypeRivals"])).expect("u32"),
        pending_same_type_rival_hexes: v["pendingSameTypeRivalHexes"]
            .as_array()
            .expect("hexes")
            .iter()
            .map(|p| HexCoord::new(i(&p["q"]) as i32, i(&p["r"]) as i32))
            .collect(),
        cluster_capital_owner_ids: pids(&v["clusterCapitalOwnerIds"]),
        pending_same_type_rival_owner_ids: pids(&v["pendingSameTypeRivalOwnerIds"]),
    }
}

#[test]
fn rust_spawn_plan_reproduces_p6_1c_web_spawn_plans() {
    // 160 przypadkow P6.1C (5 map z prawdziwego generateMap, 2 cywilizacje gracza, 0/3/6 rywali,
    // z pulami nazw i bez) - wiele powtarza to samo wejscie spawnu, wiec liczymy kazde wejscie raz.
    let maps: Value = serde_json::from_str(MAPS_1C).expect("maps 1c");
    let vectors: Value = serde_json::from_str(VECTORS_1C).expect("vectors 1c");
    let mut seen: BTreeMap<String, usize> = BTreeMap::new();
    for c in vectors["cases"].as_array().expect("cases") {
        let input = &c["input"];
        let key = format!(
            "{}|{}|{}|{}|{}",
            s(&c["map"]),
            i(&input["seed"]),
            s(&input["playerCivId"]),
            i(&input["rywaleNaKlaster"]),
            input["hasPools"].as_bool().expect("hasPools")
        );
        if seen.contains_key(&key) {
            continue;
        }
        let map = map_1c(&maps, s(&c["map"]));
        let plan = build_cluster_spawn_plan(&BuildClusterSpawnInput {
            map: &map,
            civs: civs(),
            seed: u32::try_from(i(&input["seed"])).expect("seed"),
            player_typ: s(&input["playerCivId"]),
            rywale_na_klaster: i(&input["rywaleNaKlaster"]),
            aktywne_typy: None,
            start_epoch_id: None,
            city_names_pools: if input["hasPools"].as_bool().expect("hasPools") {
                Some(pools())
            } else {
                None
            },
            preferred_civ_ids: None,
        })
        .unwrap_or_else(|e| panic!("{key}: {e}"));
        assert_eq!(
            plan.to_start_plan(),
            start_plan_of(&c["spawnPlan"]),
            "{key}: plan spawnu != spawnPlan z P6.1C"
        );
        seen.insert(key, 1);
    }
    assert!(seen.len() >= 30, "za malo unikalnych wejsc: {}", seen.len());
}

#[test]
fn to_start_plan_keeps_every_field_and_drops_only_placement() {
    let map = map_of("k42");
    let spec = Spec {
        seed: Some(42),
        aktywne_typy: None,
        player_typ: Some("rzymianie".to_string()),
        min_dystans: None,
        rywale: Some(3),
        min_dyst_kl: None,
        epoch: None,
        roster: false,
        pools: true,
        preferred: None,
    };
    let plan = run(map, &spec).expect("plan");
    let start = plan.to_start_plan();
    assert_eq!(start.player_start_hex, plan.player_start_hex);
    assert_eq!(start.player_start_city_name, plan.player_start_city_name);
    assert_eq!(start.slots, plan.slots);
    assert_eq!(start.foreign_type_clusters, plan.foreign_type_clusters);
    assert_eq!(
        i64::from(start.pending_same_type_rivals),
        plan.pending_same_type_rivals
    );
    assert_eq!(
        start.pending_same_type_rival_hexes,
        plan.pending_same_type_rival_hexes
    );
    assert_eq!(
        start.cluster_capital_owner_ids,
        plan.cluster_capital_owner_ids
    );
    assert_eq!(
        start.pending_same_type_rival_owner_ids,
        plan.pending_same_type_rival_owner_ids
    );
}

#[test]
fn spawn_plan_without_land_falls_back_to_origin_and_player_name() {
    let map = map_of("e_ocean");
    let spec = Spec {
        seed: Some(5),
        aktywne_typy: None,
        player_typ: Some("grecy".to_string()),
        min_dystans: None,
        rywale: Some(4),
        min_dyst_kl: None,
        epoch: None,
        roster: false,
        pools: true,
        preferred: None,
    };
    let plan = run(map, &spec).expect("plan");
    assert_eq!(plan.player_start_hex, HexCoord::new(0, 0));
    assert!(plan.slots.is_empty());
    assert!(plan.foreign_type_clusters.is_empty());
    assert_eq!(plan.pending_same_type_rivals, 4);
    assert!(plan.pending_same_type_rival_hexes.is_empty());
    assert!(plan.cluster_capital_owner_ids.is_empty());
    assert!(plan.pending_same_type_rival_owner_ids.is_empty());
    assert!(!plan.player_start_city_name.is_empty());
}
