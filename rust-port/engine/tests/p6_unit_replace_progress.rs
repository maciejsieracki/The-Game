//! P6-UNIT-REPLACE-PROGRESS (dlug DLUG-UNIT-REPLACE-PROGRESS): postep jednostki (`battlesSurvived`,
//! `parametryBonusProc`) w modelu stanu i wejsciu HP zamiany = pin 07d2fbd72.
//!
//! Testy:
//! 1. `newmaxhp_zgodne_z_pinem_dla_postepu` - `replace_max_hp` na wektorach pinu z postepem > 0
//!    (`unit-replace-progress-vectors.json`, generator `gen-unit-replace-progress-vectors.mjs`).
//! 2. `wektory_postepu_maja_straznika_i_probe` - SHA-256 tekstu pinu i minimalna liczba przypadkow.
//! 3. `e2e_zamiana_zranionej_jednostki_z_awansem_daje_hp_z_pinu` - komenda gracza na zranionej
//!    jednostce z awansem: HP = max(1, round(newMaxHp * (oldHp / oldMaxHp))) z wektorow pinu.
//! 4. `pola_postepu_pomijane_gdy_domyslne_i_laduja_sie_z_zapisu_sprzed_zmiany` - zgodnosc wsteczna zapisu.

use std::collections::BTreeMap;

use civ_engine::domain::playable::{
    PlayableError, PlayableGame, PlayableReplaceUnit, StartGameParams,
};
use civ_engine::domain::unit_health::unit_health_value;
use civ_engine::domain::unit_replace_cost::{replace_max_hp, ReplaceUnitProgress};
use civ_engine::domain::unit_replace_wiring::ReplaceUnitDef;
use serde_json::{json, Value};

const VECTORS: &str =
    include_str!("p6_unit_replace_progress_vectors/unit-replace-progress-vectors.json");

/// Straznik pina: SHA-256 tekstu funkcji pinu 07d2fbd72 uzytego przez generator (meta.textSha256).
const PIN_TEXT_SHA256: &str = "bacfd6380b41fbca3004576b69b2f5745cf7eab7767d9871c449e27ba86195d6";
const HUMAN_UNIT: u64 = 1;

fn parse_vectors() -> Value {
    let doc: Value = serde_json::from_str(VECTORS).expect("wektory JSON");
    assert_eq!(
        doc["meta"]["textSha256"].as_str(),
        Some(PIN_TEXT_SHA256),
        "wektory postepu wygenerowane z innego tekstu pinu"
    );
    doc
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn same_f64(got: f64, expected: f64) -> bool {
    (got - expected).abs() < 1e-9
}

/// Web `Math.round` dla liczb dodatnich (polowki w gore).
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// Zdrowie bazowe typu z wektorow pinu (klucz `health` jak `unitHealth`).
fn pin_base_health(doc: &Value, unit: &str) -> f64 {
    let case = doc["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["unit"] == unit)
        .unwrap_or_else(|| panic!("brak wektora dla {unit}"));
    num(&case["baseHealth"])
}

/// `newMaxHp` z pinu dla typu i postepu (parametryBonusProc, battlesSurvived).
fn pin_max_hp(doc: &Value, unit: &str, param: f64, battles: f64) -> f64 {
    let case = doc["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| {
            c["unit"] == unit
                && num(&c["parametryBonusProc"]) == param
                && num(&c["battlesSurvived"]) == battles
        })
        .unwrap_or_else(|| panic!("brak wektora {unit} {param}/{battles}"));
    num(&case["newMaxHp"])
}

fn game() -> PlayableGame {
    PlayableGame::new(StartGameParams {
        seed: 7,
        ..StartGameParams::default()
    })
    .expect("scenariusz startowy")
}

#[test]
fn newmaxhp_zgodne_z_pinem_dla_postepu() {
    let doc = parse_vectors();
    let cases = doc["cases"].as_array().expect("cases");
    let mut mismatches = Vec::new();
    for case in cases {
        let def = &case["def"];
        let base = unit_health_value(Some(def));
        assert!(
            same_f64(base, num(&case["baseHealth"])),
            "baza zdrowia {}",
            case["unit"]
        );
        let progress = ReplaceUnitProgress {
            parametry_bonus_proc: case["parametryBonusProc"].as_f64(),
            battles_survived: case["battlesSurvived"].as_f64(),
        };
        let got = replace_max_hp(base, progress);
        let expected = num(&case["newMaxHp"]);
        if !same_f64(got, expected) {
            mismatches.push(format!(
                "unit={} progress={progress:?}: got={got} expected={expected}",
                case["unit"]
            ));
        }
    }
    assert!(
        mismatches.is_empty(),
        "rozbieznosci newMaxHp z pinem ({}): {:?}",
        mismatches.len(),
        &mismatches[..mismatches.len().min(10)]
    );
}

#[test]
fn wektory_postepu_maja_straznika_i_probe() {
    let doc = parse_vectors();
    let cases = doc["cases"].as_array().expect("cases");
    assert!(cases.len() >= 200, "wektory postepu: {}", cases.len());
    assert!(
        cases
            .iter()
            .all(|c| num(&c["parametryBonusProc"]) > 0.0 || num(&c["battlesSurvived"]) > 0.0),
        "wszystkie przypadki z postepem > 0"
    );
}

/// Zamiana zranionej jednostki z awansem (weteran 3 bitwy, parametry 20%). Stary typ
/// "Wojownik z mieczem i tarczą", nowy "Wojownik". HP = max(1, round(newMaxHp * (oldHp / oldMaxHp)))
/// z wektorow pinu (oldMaxHp i newMaxHp z tym samym postepem). Dla oldHp = 7 wynik z postepem (5)
/// rozni sie od wyniku bez postepu (6), wiec test rozroznia oba wejscia.
#[test]
fn e2e_zamiana_zranionej_jednostki_z_awansem_daje_hp_z_pinu() {
    const OLD_TYPE: &str = "Wojownik z mieczem i tarczą";
    const NEW_TYPE: &str = "Wojownik";
    let doc = parse_vectors();
    let old_health = pin_base_health(&doc, OLD_TYPE);
    let new_health = pin_base_health(&doc, NEW_TYPE);
    let old_max = pin_max_hp(&doc, OLD_TYPE, 20.0, 3.0);
    let new_max = pin_max_hp(&doc, NEW_TYPE, 20.0, 3.0);
    let none = ReplaceUnitProgress::default();
    let new_nop = replace_max_hp(new_health, none);
    let old_nop = replace_max_hp(old_health, none);
    // Kolejnosc dzialan jak w web: newMaxHp * (oldHp / oldMaxHp).
    let hp_for = |hp: f64, new_m: f64, old_m: f64| js_round(new_m * (hp / old_m)).max(1.0);
    let old_hp = 7.0;
    let expected = hp_for(old_hp, new_max, old_max);
    assert_ne!(
        expected,
        hp_for(old_hp, new_nop, old_nop),
        "scenariusz rozroznia postep"
    );

    let mut defs = BTreeMap::new();
    defs.insert(
        OLD_TYPE.to_owned(),
        ReplaceUnitDef {
            category: "Wrecz".to_owned(),
            money_cost: 2.0,
            stock_source: None,
            max_hp: old_health,
        },
    );
    defs.insert(
        NEW_TYPE.to_owned(),
        ReplaceUnitDef {
            category: "Wrecz".to_owned(),
            money_cost: 4.0,
            stock_source: None,
            max_hp: new_health,
        },
    );

    let mut game = game();
    game.set_human_treasury(10.0).expect("skarbiec");
    game.set_replace_unit_state(
        HUMAN_UNIT,
        PlayableReplaceUnit {
            type_id: Some(OLD_TYPE.to_owned()),
            hp: Some(old_hp),
            battles_survived: Some(3.0),
            parametry_bonus_proc: Some(20.0),
            ..PlayableReplaceUnit::default()
        },
    )
    .expect("stan zranionej jednostki");

    game.replace_unit_with_defs(HUMAN_UNIT, NEW_TYPE, &defs, None)
        .expect("zamiana ma sie udac");

    let state = &game.state().economy.units[&HUMAN_UNIT];
    assert_eq!(
        state.hp,
        Some(expected),
        "HP po zamianie = pin (newMaxHp * oldHp / oldMaxHp)"
    );
    assert_eq!(
        state.battles_survived,
        Some(3.0),
        "postep nie znika przy zamianie"
    );
    assert_eq!(
        state.parametry_bonus_proc,
        Some(20.0),
        "parametry nie znikaja przy zamianie"
    );
}

#[test]
fn pola_postepu_pomijane_gdy_domyslne_i_laduja_sie_z_zapisu_sprzed_zmiany() {
    // Wartosci domyslne (brak i 0) nie pojawiaja sie w zapisie: zapis bez postepu jest jak przed zmiana.
    let zero = PlayableReplaceUnit {
        battles_survived: Some(0.0),
        ..PlayableReplaceUnit::default()
    };
    let zero_json = serde_json::to_value(&zero).expect("json");
    assert!(zero_json.get("battlesSurvived").is_none());
    assert!(zero_json.get("parametryBonusProc").is_none());

    // Wartosci niezerowe sa zapisywane.
    let progressed = PlayableReplaceUnit {
        battles_survived: Some(3.0),
        parametry_bonus_proc: Some(20.0),
        ..PlayableReplaceUnit::default()
    };
    let json = serde_json::to_value(&progressed).expect("json");
    assert_eq!(json["battlesSurvived"], json!(3.0));
    assert_eq!(json["parametryBonusProc"], json!(20.0));

    // Zapis sprzed zmiany (brak pol) laduje sie jako brak postepu.
    let old: PlayableReplaceUnit =
        serde_json::from_value(json!({ "hp": 11.0 })).expect("stary zapis");
    assert_eq!(old.battles_survived, None);
    assert_eq!(old.parametry_bonus_proc, None);
    assert_eq!(old.hp, Some(11.0));

    // Scenariusz bez postepu: zapis gry nie zawiera nowych pol.
    let mut game = game();
    game.set_replace_unit_state(HUMAN_UNIT, zero).expect("stan");
    let economy = serde_json::to_value(&game.state().economy).expect("json");
    let unit = &economy["units"][HUMAN_UNIT.to_string()];
    assert!(unit.get("battlesSurvived").is_none());
    assert!(unit.get("parametryBonusProc").is_none());
}

#[test]
fn ustawienie_stanu_odrzuca_nieskonczone_wartosci_i_nieznana_jednostke() {
    let mut game = game();
    let bad = PlayableReplaceUnit {
        battles_survived: Some(f64::NAN),
        ..PlayableReplaceUnit::default()
    };
    assert!(matches!(
        game.set_replace_unit_state(HUMAN_UNIT, bad),
        Err(PlayableError::NonFiniteEconomy)
    ));
    assert!(matches!(
        game.set_replace_unit_state(999_999, PlayableReplaceUnit::default()),
        Err(PlayableError::UnitNotFound(999_999))
    ));
}
