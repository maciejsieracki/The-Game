//! REPIN-WOJNA-2 (U1) - `gra/src/battle/formationRules.ts` (pin dc8a3adc; wczesniej 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_a_vectors/formation-rules.json`, generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WOJNA-2-Q1/gen-repin-wojna-2-formation-vectors.mjs`).

use civ_engine::domain::formation_rules::{
    classify_initial_battle_role, compact_line_allows_advance, initial_battle_formation,
    initial_battle_slots, BattleBounds, CompactSide, InitialBattleRole, RoleInput,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_a_vectors/formation-rules.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("formation-rules.json parse")
}

fn num(value: &Value) -> f64 {
    value
        .as_str()
        .expect("liczba zapisana jako tekst")
        .parse::<f64>()
        .expect("poprawna liczba")
}

fn role_from_web(text: &str) -> InitialBattleRole {
    match text {
        "commander" => InitialBattleRole::Commander,
        "mounted" => InitialBattleRole::Mounted,
        "melee" => InitialBattleRole::Melee,
        "javelin" => InitialBattleRole::Javelin,
        "archer" => InitialBattleRole::Archer,
        "slinger" => InitialBattleRole::Slinger,
        "ranged" => InitialBattleRole::Ranged,
        "siege" => InitialBattleRole::Siege,
        other => panic!("nieznana rola z weba: {other}"),
    }
}

fn opt(value: &Value) -> Option<&str> {
    value.as_str()
}

/// web `meleeLines` / `archerLines`: liczba 1|2|3 zapisana jako tekst, `null` = brak.
fn lines(value: &Value) -> Option<u8> {
    value
        .as_str()
        .map(|s| s.parse::<u8>().expect("linie 1|2|3"))
}

#[test]
fn classify_matches_web_on_all_vectors() {
    let v = root();
    let cases = v["classifyCases"].as_array().expect("classifyCases");
    assert!(
        cases.len() >= 2000,
        "za malo wektorow klasyfikacji: {}",
        cases.len()
    );
    for (i, case) in cases.iter().enumerate() {
        let input = &case["in"];
        let got = classify_initial_battle_role(RoleInput {
            commander: input["commander"].as_bool().unwrap_or(false),
            category: opt(&input["category"]),
            name: opt(&input["name"]),
            typ: opt(&input["type"]),
            primary_ranged: input["primaryRanged"].as_bool().unwrap_or(false),
        });
        let want = role_from_web(case["out"].as_str().expect("out"));
        assert_eq!(got, want, "przypadek {i}: {input}");
    }
}

#[test]
fn formation_groups_and_slots_match_web() {
    let v = root();
    let cases = v["slotCases"].as_array().expect("slotCases");
    assert!(
        cases.len() >= 400,
        "za malo wektorow ukladu: {}",
        cases.len()
    );
    for (i, case) in cases.iter().enumerate() {
        let units: Vec<(u64, InitialBattleRole)> = case["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(|u| {
                (
                    u["id"].as_u64().expect("id"),
                    role_from_web(u["role"].as_str().expect("role")),
                )
            })
            .collect();
        let b = &case["bounds"];
        let bounds = BattleBounds {
            rank_width: num(&b["rankWidth"]),
            mid_row: num(&b["midRow"]),
            play_row0: num(&b["playRow0"]),
            play_row1: num(&b["playRow1"]),
            melee_lines: lines(&b["meleeLines"]),
            archer_lines: lines(&b["archerLines"]),
        };
        let formation = initial_battle_formation(units, |u| u.1);
        let g = &case["groups"];
        let ids =
            |list: &[(u64, InitialBattleRole)]| -> Vec<u64> { list.iter().map(|u| u.0).collect() };
        let group_ids = |key: &str| -> Vec<u64> {
            g[key]
                .as_array()
                .expect("group")
                .iter()
                .map(|x| x.as_u64().expect("id"))
                .collect()
        };
        assert_eq!(
            ids(&formation.infantry),
            group_ids("infantry"),
            "przypadek {i}: infantry"
        );
        assert_eq!(
            ids(&formation.javelins),
            group_ids("javelins"),
            "przypadek {i}: javelins"
        );
        assert_eq!(
            ids(&formation.archers),
            group_ids("archers"),
            "przypadek {i}: archers"
        );
        assert_eq!(
            ids(&formation.slingers),
            group_ids("slingers"),
            "przypadek {i}: slingers"
        );
        assert_eq!(
            ids(&formation.ranged),
            group_ids("ranged"),
            "przypadek {i}: ranged"
        );
        assert_eq!(
            ids(&formation.mounted),
            group_ids("mounted"),
            "przypadek {i}: mounted"
        );
        assert_eq!(
            ids(&formation.siege),
            group_ids("siege"),
            "przypadek {i}: siege"
        );
        assert_eq!(
            ids(&formation.commanders),
            group_ids("commanders"),
            "przypadek {i}: commanders"
        );

        let slots = initial_battle_slots(formation, bounds);
        let want: Vec<(u64, f64, f64)> = case["slots"]
            .as_array()
            .expect("slots")
            .iter()
            .map(|s| (s[0].as_u64().expect("id"), num(&s[1]), num(&s[2])))
            .collect();
        let got: Vec<(u64, f64, f64)> = slots.iter().map(|s| (s.unit.0, s.row, s.rank)).collect();
        assert_eq!(got, want, "przypadek {i}: sloty");
    }
}

#[test]
fn compact_line_matches_web_on_grid() {
    let v = root();
    let cases = v["compactCases"].as_array().expect("compactCases");
    assert!(
        cases.len() >= 1800,
        "za malo wektorow linii: {}",
        cases.len()
    );
    for case in cases {
        let side = match case["side"].as_str().expect("side") {
            "atk" => CompactSide::Atk,
            "def" => CompactSide::Def,
            other => panic!("nieznana strona {other}"),
        };
        let prev = case["previousLineReferenceProgress"]
            .as_str()
            .map(|s| s.parse::<f64>().expect("f64"));
        let got = compact_line_allows_advance(
            side,
            num(&case["candidateCol"]),
            num(&case["lineReferenceProgress"]),
            prev,
        );
        assert_eq!(got, case["out"].as_bool().expect("out"), "{case}");
    }
}

/// Mutant-guard: kolejnosc galezi klasyfikacji (dowodca przed konnica, konnica przed oblezaniem).
#[test]
fn commander_wins_over_mounted_and_mounted_wins_over_siege() {
    let c = classify_initial_battle_role(RoleInput {
        commander: true,
        category: Some("konnica"),
        name: Some("Taran"),
        ..RoleInput::default()
    });
    assert_eq!(c, InitialBattleRole::Commander);
    let m = classify_initial_battle_role(RoleInput {
        category: Some("rydwan"),
        name: Some("Taran"),
        ..RoleInput::default()
    });
    assert_eq!(m, InitialBattleRole::Mounted);
}

/// Normalizacja: `Łucznik` (wielka Ł) to `lucznik`, a `Wieża oblężnicza` pasuje do `wieza oblezn`.
#[test]
fn diacritics_are_folded_like_web() {
    assert_eq!(
        classify_initial_battle_role(RoleInput {
            name: Some("Łucznik"),
            ..RoleInput::default()
        }),
        InitialBattleRole::Archer
    );
    assert_eq!(
        classify_initial_battle_role(RoleInput {
            name: Some("Wieża oblężnicza"),
            ..RoleInput::default()
        }),
        InitialBattleRole::Siege
    );
}
