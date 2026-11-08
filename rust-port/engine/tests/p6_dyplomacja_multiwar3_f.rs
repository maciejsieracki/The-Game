//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1 (partia F): zgodnosc `brake_war_outcome` i
//! `is_war_march_open_for_pair` z URUCHOMIONYM webem (origin/main, `gra/src/game/diplomacy-tick-war-brake.ts`
//! `brakeWarOutcome` oraz `gra/src/game/war-rules-multiwar.ts` `isWarMarchOpenForPair`).
//! Wektory: `tests/p6_dyplomacja_multiwar3_f_data/{brake,march}.json`, generator
//! `gen-f.mts` (Node 22, `--experimental-strip-types --import reg.mjs`, web wypakowany `git archive origin/main gra/src gra/data` poza repo).
//! Wartosci nieskonczone/NaN jako stringi ("NaN", "Infinity", "-Infinity"); `undefined`/`null` tagu jako None.

use civ_engine::domain::diplomacy_multiwar_gate::{is_war_march_open_for_pair, ForcedEraTag};
use civ_engine::domain::diplomacy_tick_war_brake::{brake_war_outcome, WarPower};
use serde_json::Value;

const BRAKE: &str = include_str!("p6_dyplomacja_multiwar3_f_data/brake.json");
const MARCH: &str = include_str!("p6_dyplomacja_multiwar3_f_data/march.json");

/// Liczba JSON albo string web ("NaN", "Infinity", "-Infinity").
fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana, jest {v}"))
    {
        // web `undefined` tury: `undefined >= 40` = false, jak NaN
        "NaN" | "undefined" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        s => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

fn tag(v: &Value) -> Option<ForcedEraTag> {
    match v.as_str() {
        Some("bronze") => Some(ForcedEraTag::Bronze),
        Some("iron") => Some(ForcedEraTag::Iron),
        Some("stone") => Some(ForcedEraTag::Stone),
        // web: null i undefined -> brak tagu
        _ => None,
    }
}

#[test]
fn brake_war_outcome_matches_web_vectors() {
    let rows: Vec<Value> = serde_json::from_str(BRAKE).expect("brake.json");
    assert_eq!(rows.len(), 784);
    for (i, row) in rows.iter().enumerate() {
        let a = WarPower {
            owner_id: row["a"]["owner"].as_i64().unwrap(),
            power: num(&row["a"]["power"]),
        };
        let b = WarPower {
            owner_id: row["b"]["owner"].as_i64().unwrap(),
            power: num(&row["b"]["power"]),
        };
        let player = row["player"].as_i64().unwrap();
        let got = brake_war_outcome(a, b, |id| id == player);
        let ctx = format!("wiersz {i}: {row}");
        assert_eq!(
            got.declarer,
            row["declarer"].as_i64().unwrap(),
            "declarer {ctx}"
        );
        assert_eq!(got.victim, row["victim"].as_i64().unwrap(), "victim {ctx}");
        assert_eq!(
            got.may_declare,
            row["mayDeclare"].as_bool().unwrap(),
            "mayDeclare {ctx}"
        );
    }
}

#[test]
fn brake_war_outcome_player_declarer_blocks_declaration() {
    // Gracz (0) silniejszy: wojna z hamulca nie wybucha.
    let g = brake_war_outcome(
        WarPower {
            owner_id: 0,
            power: 5.0,
        },
        WarPower {
            owner_id: 2,
            power: 3.0,
        },
        |id| id == 0,
    );
    assert_eq!((g.declarer, g.victim, g.may_declare), (0, 2, false));
    // AI<->AI: zawsze mozna wypowiedziec; remis -> nizsze ownerId.
    let ai = brake_war_outcome(
        WarPower {
            owner_id: 4,
            power: 3.0,
        },
        WarPower {
            owner_id: 2,
            power: 3.0,
        },
        |_| false,
    );
    assert_eq!((ai.declarer, ai.victim, ai.may_declare), (2, 4, true));
}

#[test]
fn is_war_march_open_for_pair_matches_web_vectors_and_turn40_boundary() {
    let rows: Vec<Value> = serde_json::from_str(MARCH).expect("march.json");
    assert_eq!(rows.len(), 35);
    for row in &rows {
        let got = is_war_march_open_for_pair(num(&row["turn"]), tag(&row["tag"]));
        assert_eq!(got, row["out"].as_bool().unwrap(), "wiersz {row}");
    }
    // granica N-1 / N / N+1 wokol tury 40 (bez aktywnej wojny epoki)
    assert!(!is_war_march_open_for_pair(39.0, None));
    assert!(is_war_march_open_for_pair(40.0, None));
    assert!(is_war_march_open_for_pair(41.0, None));
    // Kamien z aktywna wojna epoki nie omija R1
    assert!(!is_war_march_open_for_pair(39.0, Some(ForcedEraTag::Stone)));
    // Brąz/Zelazo omijaja R1 przed tura 40
    assert!(is_war_march_open_for_pair(0.0, Some(ForcedEraTag::Bronze)));
    assert!(is_war_march_open_for_pair(0.0, Some(ForcedEraTag::Iron)));
}
