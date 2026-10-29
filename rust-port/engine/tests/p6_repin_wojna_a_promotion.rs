//! REPIN-WOJNA-NOWE-A - `gra/src/game/ai-era-unit-promotion.ts` (pin 91dc998a) z wektorami z
//! URUCHOMIONEGO weba (`tests/p6_repin_wojna_a_vectors/ai-era-unit-promotion.json`).
//! Deps (adapter testowy) sa zbudowane z tego samego katalogu, co po stronie weba.

use civ_engine::domain::ai_era_unit_promotion::{
    promote_ai_unit_for_era, AiEraPromotionDeps, PromotableUnit, PromotionRecord,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_wojna_a_vectors/ai-era-unit-promotion.json");

#[derive(Clone)]
struct Entry {
    jednostka: String,
    epoka: f64,
    typ: Option<String>,
    rola: String,
    cost: f64,
    max_hp: f64,
    category: String,
}

struct CatalogDeps {
    catalog: Vec<Entry>,
    treasury: f64,
}

impl CatalogDeps {
    fn find(&self, id: &str) -> Option<&Entry> {
        self.catalog.iter().find(|e| e.jednostka == id)
    }
    fn record(e: &Entry) -> PromotionRecord {
        PromotionRecord {
            jednostka: e.jednostka.clone(),
            epoka: e.epoka,
            typ: e.typ.clone(),
        }
    }
}

impl AiEraPromotionDeps for CatalogDeps {
    fn old_definition(&self, unit: &PromotableUnit) -> Option<PromotionRecord> {
        self.find(&unit.type_id).map(Self::record)
    }
    fn candidates(&self, unit: &PromotableUnit) -> Vec<PromotionRecord> {
        match self.find(&unit.type_id) {
            None => Vec::new(),
            Some(old) => self
                .catalog
                .iter()
                .filter(|e| e.rola == old.rola)
                .map(Self::record)
                .collect(),
        }
    }
    fn newest_same_role(
        &self,
        _unit: &PromotableUnit,
        candidates: &[PromotionRecord],
    ) -> Option<PromotionRecord> {
        let mut best: Option<&PromotionRecord> = None;
        for c in candidates {
            if best.is_none_or(|b| c.epoka > b.epoka) {
                best = Some(c);
            }
        }
        best.cloned()
    }
    fn unit_cost(&self, unit_id: &str, _unit: &PromotableUnit) -> f64 {
        self.find(unit_id).map_or(0.0, |e| e.cost)
    }
    fn current_treasury(&self) -> f64 {
        self.treasury
    }
    fn set_treasury(&mut self, value: f64) {
        self.treasury = value;
    }
    fn old_max_hp(&self, _unit: &PromotableUnit, definition: &PromotionRecord) -> f64 {
        self.find(&definition.jednostka).map_or(0.0, |e| e.max_hp)
    }
    fn new_max_hp(&self, target: &PromotionRecord, _unit: &PromotableUnit) -> f64 {
        self.find(&target.jednostka).map_or(0.0, |e| e.max_hp)
    }
    fn category(&self, target: &PromotionRecord) -> String {
        self.find(&target.jednostka)
            .map_or_else(String::new, |e| e.category.clone())
    }
}

fn num(value: &Value) -> f64 {
    value
        .as_str()
        .expect("liczba jako tekst")
        .parse::<f64>()
        .expect("f64")
}

/// `null` i `"undef"` (rozroznienie tylko po stronie weba, `??`) to `None`.
fn opt_num(value: &Value) -> Option<f64> {
    match value {
        Value::Null => None,
        Value::String(s) if s == "undef" => None,
        other => Some(num(other)),
    }
}

fn opt_text(value: &Value) -> Option<String> {
    value.as_str().map(str::to_owned)
}

fn unit_from(v: &Value) -> PromotableUnit {
    PromotableUnit {
        type_id: v["typeId"].as_str().expect("typeId").to_owned(),
        category: opt_text(&v["category"]),
        hp: opt_num(&v["hp"]),
        hp_max: opt_num(&v["hpMax"]),
        ruch_left: opt_num(&v["ruchLeft"]),
        replace_used_this_turn: v["replaceUsedThisTurn"].as_bool().unwrap_or(false),
    }
}

fn same_f64(a: Option<f64>, b: Option<f64>) -> bool {
    match (a, b) {
        (None, None) => true,
        (Some(x), Some(y)) => x.to_bits() == y.to_bits(),
        _ => false,
    }
}

#[test]
fn promotion_matches_web_on_all_vectors() {
    let root: Value = serde_json::from_str(VECTORS).expect("ai-era-unit-promotion.json parse");
    let catalog: Vec<Entry> = root["catalog"]
        .as_array()
        .expect("catalog")
        .iter()
        .map(|c| Entry {
            jednostka: c["Jednostka"].as_str().expect("Jednostka").to_owned(),
            epoka: num(&c["Epoka"]),
            typ: opt_text(&c["Typ"]),
            rola: c["Rola (linia)"].as_str().expect("rola").to_owned(),
            cost: num(&c["cost"]),
            max_hp: num(&c["maxHp"]),
            category: c["category"].as_str().expect("category").to_owned(),
        })
        .collect();
    let cases = root["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= 600,
        "za malo wektorow awansu: {}",
        cases.len()
    );

    for (i, case) in cases.iter().enumerate() {
        let mut unit = unit_from(&case["unitIn"]);
        let mut deps = CatalogDeps {
            catalog: catalog.clone(),
            treasury: num(&case["treasury"]),
        };
        let ret1 = promote_ai_unit_for_era(&mut unit, &mut deps);
        assert_eq!(
            ret1,
            case["ret"].as_bool().expect("ret"),
            "przypadek {i}: wynik"
        );
        if case["twice"].as_bool().unwrap_or(false) {
            let ret2 = promote_ai_unit_for_era(&mut unit, &mut deps);
            assert_eq!(
                Some(ret2),
                case["ret2"].as_bool(),
                "przypadek {i}: drugie wywolanie"
            );
        }
        let out = &case["unitOut"];
        let expect = unit_from(out);
        assert_eq!(unit.type_id, expect.type_id, "przypadek {i}: typeId");
        assert_eq!(unit.category, expect.category, "przypadek {i}: category");
        assert!(
            same_f64(unit.hp, expect.hp),
            "przypadek {i}: hp {:?} vs {:?}",
            unit.hp,
            expect.hp
        );
        assert!(same_f64(unit.hp_max, expect.hp_max), "przypadek {i}: hpMax");
        assert!(
            same_f64(unit.ruch_left, expect.ruch_left),
            "przypadek {i}: ruchLeft"
        );
        assert_eq!(
            unit.replace_used_this_turn, expect.replace_used_this_turn,
            "przypadek {i}: flaga"
        );
        assert!(
            same_f64(Some(deps.treasury), Some(num(&case["treasuryOut"]))),
            "przypadek {i}: skarbiec"
        );
    }
}

/// Logika web: awans nie nastepuje bez wpisu `Typ` (po trim).
#[test]
fn empty_typ_blocks_promotion() {
    let catalog = vec![Entry {
        jednostka: "x".into(),
        epoka: 1.0,
        typ: Some("   ".into()),
        rola: "r".into(),
        cost: 1.0,
        max_hp: 1.0,
        category: "c".into(),
    }];
    let mut deps = CatalogDeps {
        catalog,
        treasury: 100.0,
    };
    let mut unit = PromotableUnit {
        type_id: "x".into(),
        category: None,
        hp: None,
        hp_max: None,
        ruch_left: None,
        replace_used_this_turn: false,
    };
    assert!(!promote_ai_unit_for_era(&mut unit, &mut deps));
    assert_eq!(unit.type_id, "x");
}
