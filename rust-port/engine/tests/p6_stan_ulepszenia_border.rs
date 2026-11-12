//! P6-STAN-ULEPSZENIA (obrona r3, zarzut 3): wspolna granica lagodu z fortami/posterunkami na `PlayableState`.
//!
//! Wektory: `p6_stan_ulepszenia_border_vectors/shared_border.json` generuje
//! `tests/p6_stan_ulepszenia_border_gen.mjs`, ktory WYKONUJE w node wyciety kod weba z pinu 07d2fbd72:
//! `fortTerritoryNodes` (game/fort-territory.ts), `territoryOwnerAt` (map/territory.ts) i
//! `ownersHaveSharedLandBorder` (game/trade-routes.ts), a bramke `karaWspolnaGranica` (main.ts:22876) odtwarza
//! liczba miast > 2 po obu stronach. Oczekiwanie pochodzi z weba, NIE z Rusta.
//!
//! Test obejmuje konwersje fortow stanu do wezlow terytorium (`territory_nodes_from_state`, przez
//! `shared_border_pairs`): flagi fort/posterunek, `contested_useless`, kolejnosc budowy (`order` z
//! `built_at_turn`/`seq`). Konwersja `fort_nodes_from_state` (producent ulepszen) jest sprawdzana wektorami
//! ulepszen z pinu w `p6_stan_ulepszenia` (przypadki z fortami).

use civ_engine::domain::playable::{
    PlayableCity, PlayableFort, PlayableFortKind, PlayableMap, PlayableState, PlayableTerrain,
    PlayableTile,
};
use civ_engine::domain::turn_war_inputs::shared_border_pairs;
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::{CityId, PlayerId};

const BORDER_VECTORS: &str = include_str!("p6_stan_ulepszenia_border_vectors/shared_border.json");
const BORDER_PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// SHA-256 wycietego kodu weba (fortTerritoryNodes, fortNodeAsCityNode, territoryOwnerAt, ownersHaveSharedLandBorder, ...).
const BORDER_EXTRACTED_SHA256: &str =
    "60560089dc6a4e6988f073f996677bfed5c4f0a073d04abf9ff76a7d1b16615c";
const BORDER_MIN_CASES: usize = 60;
const BORDER_MIN_FORT_CHANGED: usize = 10;
const BORDER_MIN_ORDER_CASES: usize = 16;

fn json_u16(v: &serde_json::Value, key: &str) -> u16 {
    v[key].as_u64().unwrap_or_else(|| panic!("pole {key}")) as u16
}

fn state_of(case: &serde_json::Value) -> PlayableState {
    let w = json_u16(case, "w");
    let h = json_u16(case, "h");
    let text = case["tiles"].as_str().expect("tiles");
    let tiles: Vec<PlayableTile> = text
        .chars()
        .enumerate()
        .map(|(i, ch)| {
            let x = (i % usize::from(w)) as u16;
            let y = (i / usize::from(w)) as u16;
            let terrain = match ch {
                'W' => PlayableTerrain::Water,
                'F' => PlayableTerrain::Forest,
                'P' => PlayableTerrain::Plains,
                other => panic!("nieznany teren {other}"),
            };
            let passable = !matches!(terrain, PlayableTerrain::Water);
            PlayableTile {
                position: PositionDto::new(x, y),
                terrain,
                passable,
            }
        })
        .collect();
    assert_eq!(tiles.len(), usize::from(w) * usize::from(h), "rozmiar mapy");
    let mut state = PlayableState::empty();
    state.map = PlayableMap {
        width: w,
        height: h,
        tiles,
        improvements: Vec::new(),
    };
    state.cities = case["cities"]
        .as_array()
        .expect("cities")
        .iter()
        .enumerate()
        .map(|(i, c)| PlayableCity {
            id: CityId::new(i as u64 + 1),
            owner_id: PlayerId::new(c["owner"].as_u64().expect("owner")),
            name: format!("c{}", i + 1),
            position: PositionDto::new(json_u16(c, "x"), json_u16(c, "y")),
            is_capital: false,
            population: c["pop"].as_u64().expect("pop") as u32,
            culture: 0,
        })
        .collect();
    state.forts = case["forts"]
        .as_array()
        .expect("forts")
        .iter()
        .map(|f| PlayableFort {
            q: f["q"].as_i64().expect("q") as i32,
            r: f["r"].as_i64().expect("r") as i32,
            owner_id: PlayerId::new(f["owner"].as_u64().expect("owner")),
            kind: match f["kind"].as_str().expect("kind") {
                "fort" => PlayableFortKind::Fort,
                "posterunek" => PlayableFortKind::Posterunek,
                other => panic!("rodzaj fortu {other}"),
            },
            contested_useless: f
                .get("contested_useless")
                .and_then(serde_json::Value::as_bool),
            built_at_turn: f.get("built_at_turn").and_then(serde_json::Value::as_i64),
            seq: f.get("seq").and_then(serde_json::Value::as_i64),
        })
        .collect();
    state
}

#[test]
fn shared_border_with_and_without_forts_matches_pin() {
    let root: serde_json::Value = serde_json::from_str(BORDER_VECTORS).expect("shared_border.json");
    assert_eq!(root["pin"].as_str(), Some(BORDER_PIN), "pin wektorow");
    assert_eq!(
        root["extracted_sha256"].as_str(),
        Some(BORDER_EXTRACTED_SHA256),
        "SHA-256 wycietego kodu weba"
    );
    let cases = root["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= BORDER_MIN_CASES,
        "wymagane >= {BORDER_MIN_CASES} przypadkow, jest {}",
        cases.len()
    );
    let mut fort_changed = 0usize;
    let mut order_cases = 0usize;
    for (i, case) in cases.iter().enumerate() {
        let state = state_of(case);
        let expected = case["expected"].as_bool().expect("expected");
        let expected_without = case["expected_without"]
            .as_bool()
            .expect("expected_without");
        let with = shared_border_pairs(&state).expect("pairs z fortami");
        assert_eq!(
            !with.is_empty(),
            expected,
            "przypadek {i}: granica z fortami (pin {expected})"
        );
        let mut plain = state.clone();
        plain.forts.clear();
        let without = shared_border_pairs(&plain).expect("pairs bez fortow");
        assert_eq!(
            !without.is_empty(),
            expected_without,
            "przypadek {i}: granica bez fortow (pin {expected_without})"
        );
        if expected != expected_without {
            fort_changed += 1;
        }
        if case["order_decides"].as_bool() == Some(true) {
            order_cases += 1;
        }
    }
    assert!(
        fort_changed >= BORDER_MIN_FORT_CHANGED,
        "za malo par zmienianych przez forty: {fort_changed}"
    );
    assert!(
        order_cases >= BORDER_MIN_ORDER_CASES,
        "za malo przypadkow, w ktorych kolejnosc budowy rozstrzyga: {order_cases}"
    );
}

#[test]
fn fort_order_fields_roundtrip_and_legacy_load_without_them() {
    let mut state = PlayableState::empty();
    state.forts = vec![PlayableFort {
        q: 3,
        r: 4,
        owner_id: PlayerId::new(1),
        kind: PlayableFortKind::Fort,
        contested_useless: None,
        built_at_turn: Some(12),
        seq: Some(7),
    }];
    let text = serde_json::to_string(&state).expect("serialize");
    assert!(text.contains("\"builtAtTurn\":12"), "{text}");
    assert!(text.contains("\"seq\":7"), "{text}");
    let back: PlayableState = serde_json::from_str(&text).expect("roundtrip");
    assert_eq!(back, state);

    // Zapis bez pol kolejnosci (sprzed zmiany) laduje sie z None i nie zapisuje ich ponownie.
    let mut plain = PlayableState::empty();
    plain.forts = vec![PlayableFort {
        built_at_turn: None,
        seq: None,
        ..state.forts[0].clone()
    }];
    let plain_text = serde_json::to_string(&plain).expect("serialize plain");
    assert!(!plain_text.contains("builtAtTurn"), "{plain_text}");
    assert!(!plain_text.contains("\"seq\""), "{plain_text}");
    let mut legacy: serde_json::Value = serde_json::from_str(&plain_text).expect("json");
    legacy["forts"][0]
        .as_object_mut()
        .expect("fort obj")
        .remove("builtAtTurn");
    let loaded: PlayableState = serde_json::from_value(legacy).expect("legacy load");
    assert_eq!(loaded.forts[0].built_at_turn, None);
    assert_eq!(loaded.forts[0].seq, None);
}
