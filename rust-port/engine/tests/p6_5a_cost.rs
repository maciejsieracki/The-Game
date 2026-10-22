//! P6.5A - `applyUnitCostPace` (`unit-cost-tempo.ts`) i `buildReplaceAvailabilityCtx`
//! (`unit-replace-context.ts`) z wektorami z URUCHOMIONEGO weba (`tests/p6_5a_vectors/cost.json`,
//! pin edb8fb56). Stale z tabeli `data/derived/unit-cost-tempo.json` sprawdza tez wektor `constants`.

#[path = "p6_5a_vectors/common.rs"]
mod common;

use civ_engine::data::derived::unit_cost_tempo;
use civ_engine::domain::recruitment::army_merge::{
    apply_unit_cost_pace, build_replace_availability_ctx, js_round, koszt_jednostek_pace_keys,
    ReplaceAvailabilityCtxParams, UnitCostPace,
};
use civ_engine::domain::recruitment::ResourceStock;
use common::{assert_same, cases, load, num};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5a_vectors/cost.json");

fn root() -> Value {
    load(VECTORS)
}

#[test]
fn table_constants_equal_the_running_web_object() {
    let root = root();
    let constants = &root["cases"]["constants"];
    let keys: Vec<&str> = constants["keys"]
        .as_array()
        .expect("keys")
        .iter()
        .map(|k| k.as_str().expect("key"))
        .collect();
    assert_eq!(
        koszt_jednostek_pace_keys(),
        keys,
        "klucze i kolejnosc KOSZT_JEDNOSTEK_PACE"
    );
    for key in &keys {
        assert_same(
            key,
            unit_cost_tempo().mnoznik(key).expect("wiersz tabeli"),
            num(&constants["KOSZT_JEDNOSTEK_PACE"][*key]),
        );
    }
    assert_same(
        "dolna granica kosztu",
        unit_cost_tempo().min_koszt,
        num(&constants["minKoszt"]),
    );
}

#[test]
fn unit_cost_pace_matches_web_bitwise() {
    let root = root();
    let (mut keys, mut numbers, mut nan, mut floor) = (0, 0, 0, 0);
    for case in cases(&root, "applyUnitCostPace") {
        let base = num(&case["base"]);
        let want = num(&case["out"]);
        let got = match &case["pace"] {
            Value::String(key) => {
                keys += 1;
                apply_unit_cost_pace(base, UnitCostPace::Key(key))
            }
            other => {
                numbers += 1;
                apply_unit_cost_pace(base, UnitCostPace::Multiplier(num(other)))
            }
        };
        assert_same(&format!("applyUnitCostPace {case}"), got, want);
        if want.is_nan() {
            nan += 1;
        }
        if want == unit_cost_tempo().min_koszt {
            floor += 1;
        }
    }
    assert!(
        keys > 300 && numbers > 200 && nan > 20 && floor > 20,
        "{keys}/{numbers}/{nan}/{floor}"
    );
}

#[test]
fn js_round_matches_half_up_semantics() {
    // wlasnosci Math.round (wartosci kontrolowane tez wektorami przez applyUnitCostPace)
    assert!(js_round(0.49999999999999994) == 0.0);
    assert!(js_round(2.5) == 3.0 && js_round(-2.5) == -2.0);
    assert!(js_round(-0.5).is_sign_negative() && js_round(-0.5) == 0.0);
    assert!(js_round(f64::NAN).is_nan() && js_round(f64::INFINITY).is_infinite());
}

#[test]
fn replace_context_keeps_every_field_and_the_required_stock() {
    let root = root();
    let mut with_stock = 0;
    for case in cases(&root, "buildReplaceAvailabilityCtx") {
        let stock: ResourceStock = case["stock"]
            .as_object()
            .expect("stock")
            .iter()
            .map(|(k, v)| {
                (
                    k.clone(),
                    u32::try_from(v.as_u64().expect("ilosc")).expect("u32"),
                )
            })
            .collect();
        let params = ReplaceAvailabilityCtxParams {
            reszta: case["rest"].clone(),
            empire_resource_stock: stock.clone(),
        };
        let got = build_replace_availability_ctx(&params);
        // web: `{ ...params }` - wszystkie pola `rest` + empireResourceStock 1:1
        let out = case["out"].as_object().expect("out");
        let mut keys: Vec<&String> = out.keys().collect();
        keys.sort();
        let mut expected_keys: Vec<String> = case["rest"]
            .as_object()
            .expect("rest")
            .keys()
            .cloned()
            .collect();
        expected_keys.push("empireResourceStock".to_owned());
        expected_keys.sort();
        assert_eq!(keys, expected_keys.iter().collect::<Vec<_>>(), "{case}");
        assert_eq!(got.reszta, case["rest"], "{case}");
        assert_eq!(got.empire_resource_stock, Some(stock), "{case}");
        assert_eq!(
            serde_json::to_value(out["empireResourceStock"].clone()).expect("json"),
            case["stock"],
            "{case}"
        );
        assert!(case["newObject"].as_bool().expect("newObject"));
        assert!(case["sameStockRef"].as_bool().expect("sameStockRef"));
        if !got
            .empire_resource_stock
            .as_ref()
            .expect("stock")
            .is_empty()
        {
            with_stock += 1;
        }
    }
    assert!(with_stock >= 10, "{with_stock}");
}
