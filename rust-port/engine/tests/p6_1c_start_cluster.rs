//! P6.1C - `cluster-start.ts` (+ `pickSecondHumanStartHex`, `displayLabelForSlot` z
//! `cluster-spawn.ts`) z wektorami z URUCHOMIONEGO weba (`tests/p6_1c_vectors/*.json`, generator
//! `gen-p61c-vectors.mjs`). Mapy: prawdziwy `generateMap`; spawn plan: prawdziwy
//! `buildClusterSpawnPlan`; nazwy miast: nagranie wywolan prawdziwego `pickNextCityName`.

use civ_engine::domain::diplomacy::RelationStatus;
use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::start_position::{
    build_cluster_start_plan, display_label_for_slot, land_hexes_from_terrain, min_city_distance,
    min_city_distance_start_city_state, pick_second_human_start_hex, start_relation_for_pair,
    BuildClusterStartInput, CityNamePicker, ClusterSpawnPlan, ClusterSpawnSlot, ClusterStartError,
    ClusterStartPlan, ForeignTypeClusterGroup, HumanDistanceMode,
};
use civ_engine::domain::PlayerId;
use serde_json::Value;
use std::collections::BTreeMap;

const MAPS: &str = include_str!("p6_1c_vectors/maps.json");
const VECTORS: &str = include_str!("p6_1c_vectors/cluster-start.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("cluster-start vectors parse")
}

fn maps() -> Value {
    serde_json::from_str(MAPS).expect("maps vectors parse")
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

fn hex(value: &Value) -> HexCoord {
    HexCoord::new(
        i32::try_from(value["q"].as_i64().expect("q")).expect("q i32"),
        i32::try_from(value["r"].as_i64().expect("r")).expect("r i32"),
    )
}

fn pid(value: &Value) -> PlayerId {
    PlayerId::new(value.as_u64().expect("owner id"))
}

fn pids(value: &Value) -> Vec<PlayerId> {
    value.as_array().expect("array").iter().map(pid).collect()
}

fn hexes(value: &Value) -> Vec<HexCoord> {
    value.as_array().expect("array").iter().map(hex).collect()
}

fn land_for_map(maps: &Value, map_id: &str) -> Vec<HexCoord> {
    let rows = maps["maps"][map_id]["hexes"].as_array().expect("hexes");
    land_hexes_from_terrain(rows.iter().map(|row| {
        let q = i32::try_from(row[0].as_i64().expect("q")).expect("i32");
        let r = i32::try_from(row[1].as_i64().expect("r")).expect("i32");
        (
            HexCoord::new(q, r),
            terrain(row[2].as_str().expect("teren")),
        )
    }))
}

fn spawn_plan(value: &Value) -> ClusterSpawnPlan {
    ClusterSpawnPlan {
        player_start_hex: hex(&value["playerStartHex"]),
        player_start_city_name: value["playerStartCityName"]
            .as_str()
            .expect("name")
            .to_owned(),
        slots: value["slots"]
            .as_array()
            .expect("slots")
            .iter()
            .map(|slot| ClusterSpawnSlot {
                owner_id: pid(&slot["ownerId"]),
                hex: hex(slot),
                city_name: slot["nazwaMiasta"].as_str().expect("nazwa").to_owned(),
                typ: slot["typ"].as_str().expect("typ").to_owned(),
                is_same_type_rival: slot["isSameTypeRival"].as_bool().expect("rival"),
                is_player_capital: slot["isPlayerCapital"].as_bool().expect("capital"),
                is_cluster_capital: slot
                    .get("isClusterCapital")
                    .map(|v| v.as_bool().expect("bool")),
            })
            .collect(),
        foreign_type_clusters: groups(&value["foreignTypeClusters"]),
        pending_same_type_rivals: u32::try_from(
            value["pendingSameTypeRivals"].as_u64().expect("pending"),
        )
        .expect("u32"),
        pending_same_type_rival_hexes: hexes(&value["pendingSameTypeRivalHexes"]),
        cluster_capital_owner_ids: pids(&value["clusterCapitalOwnerIds"]),
        pending_same_type_rival_owner_ids: pids(&value["pendingSameTypeRivalOwnerIds"]),
    }
}

fn groups(value: &Value) -> Vec<ForeignTypeClusterGroup> {
    value
        .as_array()
        .expect("groups")
        .iter()
        .map(|group| ForeignTypeClusterGroup {
            typ: group["typ"].as_str().expect("typ").to_owned(),
            owner_ids: pids(&group["ownerIds"]),
            positions: hexes(&group["positions"]),
        })
        .collect()
}

/// Odtwarza nagrane wywolania prawdziwego `pickNextCityName` (kolejnosc, argumenty, wynik).
struct ReplayPicker<'a> {
    calls: &'a [Value],
    next: usize,
}

impl CityNamePicker for ReplayPicker<'_> {
    fn pick_next_city_name(
        &mut self,
        civ_typ: &str,
        used_names: &[String],
        fallback: &str,
    ) -> String {
        let call = self
            .calls
            .get(self.next)
            .unwrap_or_else(|| panic!("nadmiarowe wywolanie pickNextCityName #{}", self.next));
        self.next += 1;
        assert_eq!(
            civ_typ,
            call["typ"].as_str().expect("typ"),
            "typ wywolania {}",
            self.next
        );
        let used: Vec<&str> = call["used"]
            .as_array()
            .expect("used")
            .iter()
            .map(|v| v.as_str().expect("used name"))
            .collect();
        assert_eq!(
            used_names.iter().map(String::as_str).collect::<Vec<_>>(),
            used
        );
        assert_eq!(fallback, call["fallback"].as_str().expect("fallback"));
        call["result"].as_str().expect("result").to_owned()
    }
}

fn mode(value: &Value) -> Option<HumanDistanceMode> {
    value
        .as_str()
        .map(|text| HumanDistanceMode::parse(text).expect("tryb"))
}

fn assert_plan_matches(label: &str, got: &ClusterStartPlan, web: &Value) {
    assert_eq!(
        got.player_start_hex,
        hex(&web["playerStartHex"]),
        "{label} playerStartHex"
    );
    assert_eq!(
        got.player_start_city_name,
        web["playerStartCityName"].as_str().expect("name"),
        "{label} playerStartCityName"
    );
    assert_eq!(
        got.second_player_start_hex,
        (!web["secondPlayerStartHex"].is_null()).then(|| hex(&web["secondPlayerStartHex"])),
        "{label} secondPlayerStartHex"
    );
    assert_eq!(
        got.second_player_owner_id,
        (!web["secondPlayerOwnerId"].is_null()).then(|| pid(&web["secondPlayerOwnerId"])),
        "{label} secondPlayerOwnerId"
    );
    let ai: Vec<(HexCoord, PlayerId)> = web["aiStartHexes"]
        .as_array()
        .expect("ai")
        .iter()
        .map(|row| (hex(row), pid(&row["ownerId"])))
        .collect();
    assert_eq!(got.ai_start_hexes, ai, "{label} aiStartHexes");
    let cities: Vec<(HexCoord, PlayerId, String)> = web["spawnCities"]
        .as_array()
        .expect("cities")
        .iter()
        .map(|row| {
            (
                hex(row),
                pid(&row["ownerId"]),
                row["name"].as_str().expect("name").to_owned(),
            )
        })
        .collect();
    assert_eq!(got.spawn_cities, cities, "{label} spawnCities");
    assert_eq!(
        got.foreign_type_clusters,
        groups(&web["foreignTypeClusters"]),
        "{label} foreignTypeClusters"
    );
    let owner_strings = |value: &Value| -> Vec<(PlayerId, String)> {
        value
            .as_array()
            .expect("pairs")
            .iter()
            .map(|pair| (pid(&pair[0]), pair[1].as_str().expect("string").to_owned()))
            .collect()
    };
    assert_eq!(
        got.ai_owner_civ_map,
        owner_strings(&web["aiOwnerCivMap"]),
        "{label} aiOwnerCivMap"
    );
    assert_eq!(
        got.owner_display_name,
        owner_strings(&web["ownerDisplayName"]),
        "{label} ownerDisplayName"
    );
    assert_eq!(
        got.simplified_diplomacy_owners,
        pids(&web["simplifiedDiplomacyOwners"]),
        "{label} simplifiedDiplomacyOwners"
    );
    assert_eq!(
        got.foreign_type_owners,
        pids(&web["foreignTypeOwners"]),
        "{label} foreignTypeOwners"
    );
    assert_eq!(
        got.typ_city_copy_owners,
        pids(&web["typCityCopyOwners"]),
        "{label} typCityCopyOwners"
    );
    let relations = web["startRelations"].as_array().expect("relations");
    assert_eq!(
        got.start_relations.len(),
        relations.len(),
        "{label} startRelations len"
    );
    for ((owner, relation), row) in got.start_relations.iter().zip(relations) {
        assert_eq!(*owner, pid(&row[0]), "{label} startRelations owner");
        assert_eq!(
            relation.trust,
            row[1]["zaufanie"].as_f64().expect("zaufanie"),
            "{label} zaufanie"
        );
        assert_eq!(
            relation.respect,
            row[1]["respekt"].as_f64().expect("respekt"),
            "{label} respekt"
        );
        assert_eq!(relation.status, RelationStatus::Neutral, "{label} status");
        assert_eq!(
            row[1]["status"].as_str(),
            Some("neutralni"),
            "{label} web status"
        );
    }
    assert_eq!(
        u64::from(got.pending_same_type_rivals),
        web["pendingSameTypeRivals"].as_u64().expect("pending"),
        "{label} pendingSameTypeRivals"
    );
    assert_eq!(
        got.pending_same_type_rival_hexes,
        hexes(&web["pendingSameTypeRivalHexes"]),
        "{label} pendingSameTypeRivalHexes"
    );
    assert_eq!(
        got.pending_same_type_rival_owner_ids,
        pids(&web["pendingSameTypeRivalOwnerIds"]),
        "{label} pendingSameTypeRivalOwnerIds"
    );
    assert_eq!(
        u64::from(got.pending_same_type_rivals_second),
        web["pendingSameTypeRivalsSecond"].as_u64().expect("second"),
        "{label} pendingSameTypeRivalsSecond"
    );
    assert_eq!(
        got.pending_same_type_rival_owner_ids_second,
        pids(&web["pendingSameTypeRivalOwnerIdsSecond"]),
        "{label} pendingSameTypeRivalOwnerIdsSecond"
    );
    assert_eq!(
        got.cluster_capital_owner_ids,
        pids(&web["clusterCapitalOwnerIds"]),
        "{label} clusterCapitalOwnerIds"
    );
}

fn run_case(
    case: &Value,
    maps: &Value,
) -> (
    ClusterSpawnPlan,
    Result<ClusterStartPlan, ClusterStartError>,
) {
    let input = &case["input"];
    let spawn = spawn_plan(&case["spawnPlan"]);
    let land = land_for_map(maps, case["map"].as_str().expect("map"));
    let second = input["secondHumanCivId"].as_str();
    let start_input = BuildClusterStartInput {
        seed: u32::try_from(input["seed"].as_u64().expect("seed")).expect("seed u32"),
        player_civ_id: input["playerCivId"].as_str().expect("civ"),
        second_human_civ_id: second,
        human_distance_mode: mode(&input["humanDistanceMode"]),
        second_human_owner_id: input["secondHumanOwnerId"].as_u64().map(PlayerId::new),
    };
    let names = case["names"].as_array().expect("names");
    let has_pools = input["hasPools"].as_bool().expect("hasPools");
    let result = if has_pools {
        let mut picker = ReplayPicker {
            calls: names,
            next: 0,
        };
        let result = build_cluster_start_plan(&start_input, &spawn, &land, Some(&mut picker));
        assert_eq!(
            picker.next,
            names.len(),
            "{}: liczba wywolan pickNextCityName",
            case["label"]
        );
        result
    } else {
        assert!(names.is_empty(), "bez pul nie ma wywolan pickNextCityName");
        build_cluster_start_plan(&start_input, &spawn, &land, None)
    };
    (spawn, result)
}

#[test]
fn build_cluster_start_plan_matches_web_for_all_cases() {
    let vectors = vectors();
    let maps = maps();
    let cases = vectors["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 160);
    for case in cases {
        let label = case["label"].as_str().expect("label");
        let (_, result) = run_case(case, &maps);
        let plan = result.unwrap_or_else(|error| panic!("{label}: nieoczekiwany blad {error}"));
        assert_plan_matches(label, &plan, &case["plan"]);
    }
}

#[test]
fn vectors_cover_the_branches_of_build_cluster_start_plan() {
    // Straznik przed pustymi wektorami: kazda galaz logiki musi wystapic w danych z weba.
    let vectors = vectors();
    let cases = vectors["cases"].as_array().expect("cases");
    let mut rejected = 0;
    let mut promoted = 0;
    let mut renamed = 0;
    let mut second_some = 0;
    let mut explicit_owner = 0;
    let mut default_mode = 0;
    let mut no_pools = 0;
    let mut pending_second = 0;
    let mut dropped_group = 0;
    for case in cases {
        let slots = case["spawnPlan"]["slots"].as_array().expect("slots").len();
        let plan = &case["plan"];
        let accepted = plan["spawnCities"].as_array().expect("cities").len();
        if slots > accepted {
            rejected += 1;
        }
        let original_caps = case["spawnPlan"]["clusterCapitalOwnerIds"]
            .as_array()
            .expect("caps");
        let accepted_original = original_caps
            .iter()
            .filter(|owner| {
                plan["aiOwnerCivMap"]
                    .as_array()
                    .expect("map")
                    .iter()
                    .any(|pair| pair[0] == **owner)
            })
            .count();
        if plan["clusterCapitalOwnerIds"]
            .as_array()
            .expect("caps")
            .len()
            > accepted_original
        {
            promoted += 1;
        }
        if case["names"]
            .as_array()
            .expect("names")
            .iter()
            .any(|call| call["result"] != call["fallback"])
        {
            renamed += 1;
        }
        if !plan["secondPlayerStartHex"].is_null() {
            second_some += 1;
        }
        if !case["input"]["secondHumanOwnerId"].is_null() {
            explicit_owner += 1;
        }
        if !case["input"]["secondHumanCivId"].is_null()
            && case["input"]["humanDistanceMode"].is_null()
        {
            default_mode += 1;
        }
        if !case["input"]["hasPools"].as_bool().expect("pools") {
            no_pools += 1;
        }
        if plan["pendingSameTypeRivalsSecond"].as_u64().expect("n") > 0 {
            pending_second += 1;
        }
        let web_groups = case["spawnPlan"]["foreignTypeClusters"]
            .as_array()
            .expect("g")
            .len();
        if plan["foreignTypeClusters"].as_array().expect("g").len() < web_groups {
            dropped_group += 1;
        }
    }
    for (name, count) in [
        ("odrzucone sloty (kolizja dystansu)", rejected),
        ("promocja substytutu stolicy klastra", promoted),
        ("zmiana nazwy przez pickNextCityName", renamed),
        ("drugi czlowiek z heksem", second_some),
        ("jawny secondHumanOwnerId", explicit_owner),
        ("domyslny tryb dystansu", default_mode),
        ("brak pul nazw", no_pools),
        ("rywale drugiego fotela", pending_second),
        ("grupa klastra usunieta w calosci", dropped_group),
    ] {
        assert!(count > 0, "wektory nie pokrywaja galezi: {name}");
    }
}

#[test]
fn second_human_civ_equal_to_player_civ_is_rejected_like_web() {
    let vectors = vectors();
    let maps = maps();
    let case = &vectors["cases"][0];
    let spawn = spawn_plan(&case["spawnPlan"]);
    let land = land_for_map(&maps, case["map"].as_str().expect("map"));
    let input = BuildClusterStartInput {
        seed: 42,
        player_civ_id: "rzymianie",
        second_human_civ_id: Some("rzymianie"),
        human_distance_mode: None,
        second_human_owner_id: None,
    };
    let error = build_cluster_start_plan(&input, &spawn, &land, None).expect_err("duplikat");
    assert_eq!(
        error,
        ClusterStartError::DuplicateHumanCiv {
            civ_id: "rzymianie".to_owned()
        }
    );
    assert_eq!(
        error.to_string(),
        vectors["duplicateCivError"].as_str().expect("msg")
    );
}

#[test]
fn second_human_without_legal_hex_yields_no_second_seat_derived_from_code() {
    // WYPROWADZONE Z KODU, nie z weba: degenerowana mapa wywala prawdziwy computeClusters, wiec
    // plan-level null drugiego heksu nie ma wektora webowego (gen-p61c-vectors.mjs, uwaga).
    // Semantyka (cluster-start.ts:327-345,358): brak heksu => brak ownerId i brak rywali fotela 2;
    // reszta planu identyczna jak bez drugiego czlowieka.
    let vectors = vectors();
    let maps = maps();
    let case = vectors["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|case| {
            case["input"]["secondHumanCivId"].is_null()
                && case["input"]["hasPools"] == Value::Bool(true)
                && case["input"]["rywaleNaKlaster"] == 3
        })
        .expect("przypadek bazowy");
    let spawn = spawn_plan(&case["spawnPlan"]);
    let names = case["names"].as_array().expect("names");
    let run = |second: Option<&str>| {
        let input = BuildClusterStartInput {
            seed: u32::try_from(case["input"]["seed"].as_u64().expect("seed")).expect("u32"),
            player_civ_id: "rzymianie",
            second_human_civ_id: second,
            human_distance_mode: Some(HumanDistanceMode::Losowo),
            second_human_owner_id: Some(PlayerId::new(77)),
        };
        let mut picker = ReplayPicker {
            calls: names,
            next: 0,
        };
        let land = land_for_map(&maps, case["map"].as_str().expect("map"));
        let land_for_run = if second.is_some() { Vec::new() } else { land };
        build_cluster_start_plan(&input, &spawn, &land_for_run, Some(&mut picker)).expect("plan")
    };
    let without = run(None);
    let with_empty_land = run(Some("grecy"));
    assert_eq!(with_empty_land.second_player_start_hex, None);
    assert_eq!(with_empty_land.second_player_owner_id, None);
    assert_eq!(with_empty_land.pending_same_type_rivals_second, 0);
    assert!(with_empty_land
        .pending_same_type_rival_owner_ids_second
        .is_empty());
    assert_eq!(with_empty_land, without);
}

#[test]
fn pick_second_human_start_hex_matches_web() {
    let vectors = vectors();
    let maps = maps();
    let rows = vectors["pickSecond"].as_array().expect("pickSecond");
    assert_eq!(rows.len(), 720);
    let mut lands: BTreeMap<String, Vec<HexCoord>> = BTreeMap::new();
    let mut nulls = 0;
    for row in rows {
        let map_id = row["map"].as_str().expect("map").to_owned();
        let land = lands
            .entry(map_id.clone())
            .or_insert_with(|| land_for_map(&maps, &map_id));
        let got = pick_second_human_start_hex(
            land,
            hex(&row["primary"]),
            HumanDistanceMode::parse(row["mode"].as_str().expect("mode")).expect("mode"),
            u32::try_from(row["seed"].as_u64().expect("seed")).expect("u32"),
            u32::try_from(row["minDistance"].as_u64().expect("min")).expect("u32"),
            &hexes(&row["occupied"]),
        );
        let expected = (!row["result"].is_null()).then(|| hex(&row["result"]));
        if expected.is_none() {
            nulls += 1;
        }
        assert_eq!(got, expected, "row {row}");
    }
    assert!(
        nulls > 0 && nulls < rows.len(),
        "wektory musza zawierac null i nie-null"
    );
}

#[test]
fn display_label_for_slot_matches_web() {
    let vectors = vectors();
    for row in vectors["displayLabel"].as_array().expect("displayLabel") {
        let slot = &row["slot"];
        let parsed = ClusterSpawnSlot {
            owner_id: pid(&slot["ownerId"]),
            hex: hex(slot),
            city_name: slot["nazwaMiasta"].as_str().expect("nazwa").to_owned(),
            typ: slot["typ"].as_str().expect("typ").to_owned(),
            is_same_type_rival: false,
            is_player_capital: false,
            is_cluster_capital: None,
        };
        assert_eq!(
            display_label_for_slot(&parsed),
            row["label"].as_str().expect("label")
        );
    }
}

#[test]
fn constants_and_start_relations_match_web() {
    let vectors = vectors();
    let constants = &vectors["constants"];
    assert_eq!(
        u64::from(min_city_distance()),
        constants["MIN_CITY_DISTANCE"]
            .as_u64()
            .expect("MIN_CITY_DISTANCE")
    );
    assert_eq!(
        u64::from(min_city_distance_start_city_state()),
        constants["MIN_CITY_DISTANCE_START_CITY_STATE"]
            .as_u64()
            .expect("MIN_CITY_DISTANCE_START_CITY_STATE")
    );
    for (same_type, key) in [
        (true, "startRelationSameType"),
        (false, "startRelationOtherType"),
    ] {
        let relation = start_relation_for_pair(same_type);
        let web = &constants[key];
        assert_eq!(
            relation.trust,
            web["zaufanie"].as_f64().expect("zaufanie"),
            "{key}"
        );
        assert_eq!(
            relation.respect,
            web["respekt"].as_f64().expect("respekt"),
            "{key}"
        );
        assert_eq!(relation.status, RelationStatus::Neutral, "{key}");
        assert_eq!(web["status"].as_str(), Some("neutralni"));
    }
}

#[test]
fn land_hexes_filter_matches_web_rule() {
    // landHexesFromMap (cluster-spawn.ts:71): bez wody, gor i terenu polarnego; kolejnosc mapy.
    let tiles = [
        (HexCoord::new(0, 0), Terrain::Grassland),
        (HexCoord::new(1, 0), Terrain::Sea),
        (HexCoord::new(2, 0), Terrain::Mountains),
        (HexCoord::new(3, 0), Terrain::Polar),
        (HexCoord::new(4, 0), Terrain::ShallowSea),
        (HexCoord::new(5, 0), Terrain::Hills),
        (HexCoord::new(6, 0), Terrain::Desert),
        (HexCoord::new(7, 0), Terrain::Plains),
    ];
    assert_eq!(
        land_hexes_from_terrain(tiles),
        vec![
            HexCoord::new(0, 0),
            HexCoord::new(5, 0),
            HexCoord::new(6, 0),
            HexCoord::new(7, 0)
        ]
    );
}
