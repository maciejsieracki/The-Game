//! P6.3 - `terrain-improvements.ts` z wektorami z URUCHOMIONEGO weba
//! (`tests/p6_23_vectors/improvements.json`, generator `gen-p623-vectors.mjs`, kod weba bez stubow).

#[path = "p6_23_vectors/common.rs"]
mod common;

use civ_engine::data::derived::ulepszenia_reguly;
use civ_engine::domain::improvements::{
    apply_improvement_bonus, apply_improvement_bonuses, food_layer_from_animal_deposit,
    food_potential_for_hex, hex_has_covering_terrain_improvement, hex_suppresses_deposit_overlay,
    improvement_allowed_civs, improvement_bonus_for_key, improvement_catalog,
    improvement_display_name, improvement_hides_deposit_on_hex, improvement_keys,
    improvement_keys_for_hex, is_improvement_allowed_for_civ, is_livestock_improvement_key,
    livestock_improvement_keys, migrate_improvement_layers, migrate_legacy_kopalnia_key,
    normalize_improvement_key, ore_yield_from_improvements, resource_production_amount_for_era,
    resource_upkeep_improvement_keys, road_improvement_keys, scale_terrain_improvement_work_cost,
    terrain_improvement_era_for_key, terrain_improvement_era_multiplier,
    territory_resource_yield_for_improvement, CatalogBonus, HexLike, TerrainType, TileYield,
};
use civ_engine::domain::start_position::Overlay;
use common::{assert_same, cases, num, opt_num, opt_str, string_list};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_23_vectors/improvements.json");

fn root() -> Value {
    serde_json::from_str(VECTORS).expect("improvements.json parse")
}

fn overlay(value: Option<&Value>) -> Option<Overlay> {
    opt_str(value).map(|name| Overlay::from_web_value(name).expect("znana nakladka"))
}

fn hex_like(value: &Value) -> HexLike {
    HexLike {
        ulepszenie: opt_str(value.get("ulepszenie")).map(str::to_owned),
        ulepszenia: value
            .get("ulepszenia")
            .and_then(Value::as_array)
            .map(|_| string_list(&value["ulepszenia"])),
        nakladka: overlay(value.get("nakladka")),
        zloze: opt_str(value.get("zloze")).map(str::to_owned),
    }
}

fn terrain(name: &str) -> TerrainType {
    match name {
        "laka" => TerrainType::Grassland,
        "rownina" => TerrainType::Plains,
        "wzgorza" => TerrainType::Hills,
        "gory" => TerrainType::Mountains,
        "plytkie_morze" => TerrainType::ShallowWater,
        "morze" => TerrainType::Ocean,
        "pustynia" => TerrainType::Desert,
        "polarny" => TerrainType::Tundra,
        other => panic!("nieznany teren weba {other}"),
    }
}

fn yield_from(value: &Value) -> TileYield {
    TileYield {
        zywnosc: num(&value["zywnosc"]),
        praca: num(&value["praca"]),
        handel: num(&value["handel"]),
        drewno: num(&value["drewno"]),
        kamien: num(&value["kamien"]),
        glina: num(&value["glina"]),
        ruda: num(&value["ruda"]),
        ruda_zelaza: num(&value["ruda_zelaza"]),
    }
}

fn assert_yield(label: &str, got: &TileYield, want: &TileYield) {
    assert_same(&format!("{label}.zywnosc"), got.zywnosc, want.zywnosc);
    assert_same(&format!("{label}.praca"), got.praca, want.praca);
    assert_same(&format!("{label}.handel"), got.handel, want.handel);
    assert_same(&format!("{label}.drewno"), got.drewno, want.drewno);
    assert_same(&format!("{label}.kamien"), got.kamien, want.kamien);
    assert_same(&format!("{label}.glina"), got.glina, want.glina);
    assert_same(&format!("{label}.ruda"), got.ruda, want.ruda);
    assert_same(
        &format!("{label}.ruda_zelaza"),
        got.ruda_zelaza,
        want.ruda_zelaza,
    );
}

fn assert_bonus(label: &str, got: &CatalogBonus, want: &Value) {
    let pairs = [
        ("zywnosc", got.zywnosc),
        ("praca", got.praca),
        ("handel", got.handel),
        ("pieniadz", got.pieniadz),
        ("drewno", got.drewno),
        ("kamien", got.kamien),
        ("glina", got.glina),
    ];
    for (name, value) in pairs {
        assert_eq!(value, opt_num(want.get(name)), "{label}.{name}");
    }
}

fn key_arg(case: &Value) -> Option<&str> {
    opt_str(case.get("key"))
}

#[test]
fn constants_match_web() {
    let root = root();
    let constants = &root["constants"];
    assert_eq!(
        improvement_keys(),
        string_list(&constants["IMPROVEMENT_KEYS"])
    );
    assert_eq!(
        livestock_improvement_keys(),
        string_list(&constants["LIVESTOCK_IMPROVEMENT_KEYS"])
    );
    assert_eq!(
        road_improvement_keys().to_vec(),
        string_list(&constants["ROAD_IMPROVEMENT_KEYS"])
    );
    assert_eq!(
        resource_upkeep_improvement_keys(),
        string_list(&constants["RESOURCE_UPKEEP_IMPROVEMENT_KEYS"])
    );
    let rules = ulepszenia_reguly();
    assert_same(
        "ORE_YIELD_PER_MINE",
        rules.ruda.na_kopalnie,
        num(&constants["ORE_YIELD_PER_MINE"]),
    );
    assert_same(
        "TERRITORY_YIELD_DEFAULT_AMOUNT",
        rules.terytorium.domyslna_ilosc,
        num(&constants["TERRITORY_YIELD_DEFAULT_AMOUNT"]),
    );
    assert_same(
        "FARMA_POTENTIAL_FOOD_BONUS",
        civ_engine::domain::improvements::farma_potential_food_bonus(),
        num(&constants["FARMA_POTENTIAL_FOOD_BONUS"]),
    );
    assert_same(
        "FOREST_FOOD_POTENTIAL_PENALTY",
        civ_engine::domain::improvements::forest_food_potential_penalty(),
        num(&constants["FOREST_FOOD_POTENTIAL_PENALTY"]),
    );
    for (era, multiplier) in constants["TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS"]
        .as_object()
        .expect("era multipliers")
    {
        let era: i64 = era.parse().expect("era");
        assert_same(
            "TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS",
            rules.skala_pracy.mnozniki_epoki[&era],
            num(multiplier),
        );
    }
    assert_eq!(
        rules.skala_pracy.mnozniki_epoki.len(),
        constants["TERRAIN_IMPROVEMENT_ERA_MULTIPLIERS"]
            .as_object()
            .expect("era multipliers")
            .len()
    );
}

#[test]
fn catalog_key_order_equals_json_file_order_including_meta_rows() {
    let root = root();
    let catalog = improvement_catalog();
    let web_order = string_list(&root["json_keys_in_order"]);
    for key in &web_order {
        assert!(catalog.row(key).is_some(), "katalog nie ma wiersza {key}");
    }
    let without_meta: Vec<String> = web_order
        .iter()
        .filter(|key| !key.starts_with('_'))
        .cloned()
        .collect();
    assert_eq!(catalog.keys(), without_meta);
}

#[test]
fn normalize_and_lookup_functions_match_web() {
    let root = root();
    for case in cases(&root, "normalizeImprovementKey") {
        assert_eq!(
            normalize_improvement_key(key_arg(case)),
            case.get("out").and_then(Value::as_str).map(str::to_owned),
            "normalizeImprovementKey {case}"
        );
    }
    for case in cases(&root, "improvementBonusForKey") {
        let key = case["key"].as_str().expect("key");
        assert_bonus(
            &format!("improvementBonusForKey {key}"),
            &improvement_bonus_for_key(key),
            &case["out"],
        );
    }
    for case in cases(&root, "terrainImprovementEraForKey") {
        assert_same(
            &format!("terrainImprovementEraForKey {case}"),
            terrain_improvement_era_for_key(key_arg(case)),
            num(&case["out"]),
        );
    }
    for case in cases(&root, "improvementDisplayName") {
        let key = case["key"].as_str().expect("key");
        assert_eq!(
            improvement_display_name(key),
            case["out"].as_str().expect("nazwa"),
            "improvementDisplayName {key}"
        );
    }
    for case in cases(&root, "isLivestockImprovementKey") {
        let key = case["key"].as_str().expect("key");
        assert_eq!(
            is_livestock_improvement_key(key),
            case["out"].as_bool().expect("bool"),
            "isLivestockImprovementKey {key}"
        );
    }
    for case in cases(&root, "improvementAllowedCivs") {
        let key = case["key"].as_str().expect("key");
        let want = case.get("out").map(string_list);
        assert_eq!(
            improvement_allowed_civs(key).map(<[String]>::to_vec),
            want,
            "improvementAllowedCivs {key}"
        );
    }
    for case in cases(&root, "isImprovementAllowedForCiv") {
        let key = case["key"].as_str().expect("key");
        assert_eq!(
            is_improvement_allowed_for_civ(key, opt_str(case.get("civ"))),
            case["out"].as_bool().expect("bool"),
            "isImprovementAllowedForCiv {case}"
        );
    }
}

#[test]
fn prototype_keys_are_a_documented_divergence_from_web() {
    let root = root();
    for row in root["known_divergence_prototype_keys"]
        .as_array()
        .expect("rows")
    {
        let key = row["key"].as_str().expect("key");
        // Web (JS) przepuszcza klucze prototypu obiektu przez normalizeImprovementKey ...
        assert_eq!(row["web_normalize"].as_str(), Some(key));
        // ... a port nie ma prototypu: brak wiersza w katalogu = None (swiadoma roznica).
        assert_eq!(normalize_improvement_key(Some(key)), None);
        let hex = HexLike {
            ulepszenie: Some(key.to_owned()),
            ..HexLike::default()
        };
        assert_eq!(
            string_list(&row["web_improvementKeysForHex"]),
            vec![key.to_owned()]
        );
        assert!(improvement_keys_for_hex(&hex).is_empty());
    }
}

#[test]
fn migration_functions_match_web() {
    let root = root();
    for case in cases(&root, "migrateLegacyKopalniaKey") {
        let key = case["key"].as_str().expect("key");
        let hex = case.get("hex").filter(|hex| !hex.is_null()).map(hex_like);
        assert_eq!(
            migrate_legacy_kopalnia_key(key, hex.as_ref()),
            case.get("out").and_then(Value::as_str).map(str::to_owned),
            "migrateLegacyKopalniaKey {case}"
        );
    }
    for case in cases(&root, "migrateImprovementLayers") {
        let hex = case.get("hex").filter(|hex| !hex.is_null()).map(hex_like);
        assert_eq!(
            migrate_improvement_layers(&string_list(&case["layers"]), hex.as_ref()),
            string_list(&case["out"]),
            "migrateImprovementLayers {case}"
        );
    }
}

#[test]
fn era_and_cost_scaling_match_web() {
    let root = root();
    for case in cases(&root, "terrainImprovementEraMultiplier") {
        assert_same(
            &format!("terrainImprovementEraMultiplier {case}"),
            terrain_improvement_era_multiplier(opt_num(case.get("era"))),
            num(&case["out"]),
        );
    }
    for case in cases(&root, "scaleTerrainImprovementWorkCost") {
        assert_same(
            &format!("scaleTerrainImprovementWorkCost {case}"),
            scale_terrain_improvement_work_cost(num(&case["base"]), opt_num(case.get("era"))),
            num(&case["out"]),
        );
    }
    for case in cases(&root, "resourceProductionAmountForEra") {
        assert_same(
            &format!("resourceProductionAmountForEra {case}"),
            resource_production_amount_for_era(
                case["key"].as_str().expect("key"),
                num(&case["base"]),
                opt_num(case.get("era")),
            ),
            num(&case["out"]),
        );
    }
}

#[test]
fn territory_and_ore_yields_match_web() {
    let root = root();
    let mut produced = 0;
    for case in cases(&root, "territoryResourceYieldForImprovement") {
        let got = territory_resource_yield_for_improvement(
            key_arg(case),
            opt_str(case.get("zloze")),
            opt_num(case.get("era")),
        );
        match (got, case.get("out").filter(|out| !out.is_null())) {
            (None, None) => {}
            (Some(got), Some(want)) => {
                produced += 1;
                assert_eq!(
                    got.resource_key,
                    want["resourceKey"].as_str().expect("klucz")
                );
                assert_same(
                    &format!("territory amount {case}"),
                    got.amount,
                    num(&want["amount"]),
                );
            }
            (got, want) => {
                panic!("territoryResourceYieldForImprovement {case}: {got:?} vs {want:?}")
            }
        }
    }
    assert!(
        produced > 100,
        "wektory musza obejmowac produkcje ({produced})"
    );
    for case in cases(&root, "oreYieldFromImprovements") {
        let got =
            ore_yield_from_improvements(&string_list(&case["keys"]), opt_str(case.get("zloze")));
        assert_same("ruda", got.ruda, num(&case["out"]["ruda"]));
        assert_same(
            "ruda_zelaza",
            got.ruda_zelaza,
            num(&case["out"]["ruda_zelaza"]),
        );
    }
}

#[test]
fn applying_bonuses_matches_web() {
    let root = root();
    for case in cases(&root, "applyImprovementBonus") {
        let mut yld = yield_from(&case["yield"]);
        apply_improvement_bonus(&mut yld, key_arg(case));
        assert_yield(
            &format!("applyImprovementBonus {}", case["key"]),
            &yld,
            &yield_from(&case["out"]),
        );
    }
    for case in cases(&root, "applyImprovementBonuses") {
        let mut yld = yield_from(&case["yield"]);
        apply_improvement_bonuses(&mut yld, &string_list(&case["keys"]));
        assert_yield(
            &format!("applyImprovementBonuses {}", case["keys"]),
            &yld,
            &yield_from(&case["out"]),
        );
    }
}

#[test]
fn hex_layer_functions_match_web() {
    let root = root();
    for case in cases(&root, "foodLayerFromAnimalDeposit") {
        assert_eq!(
            food_layer_from_animal_deposit(overlay(case.get("nakladka"))),
            case.get("out").and_then(Value::as_str).map(str::to_owned),
            "foodLayerFromAnimalDeposit {case}"
        );
    }
    for case in cases(&root, "improvementKeysForHex") {
        assert_eq!(
            improvement_keys_for_hex(&hex_like(&case["hex"])),
            string_list(&case["out"]),
            "improvementKeysForHex {case}"
        );
    }
    for case in cases(&root, "hexHasCoveringTerrainImprovement") {
        assert_eq!(
            hex_has_covering_terrain_improvement(&hex_like(&case["hex"])),
            case["out"].as_bool().expect("bool"),
            "hexHasCoveringTerrainImprovement {case}"
        );
    }
    for case in cases(&root, "hexSuppressesDepositOverlay") {
        let extra = case
            .get("extra")
            .and_then(Value::as_array)
            .map(|_| string_list(&case["extra"]));
        assert_eq!(
            hex_suppresses_deposit_overlay(&hex_like(&case["hex"]), extra.as_deref()),
            case["out"].as_bool().expect("bool"),
            "hexSuppressesDepositOverlay {case}"
        );
    }
    for case in cases(&root, "improvementHidesDepositOnHex") {
        let hex = hex_like(&case["hex"]);
        assert_eq!(
            improvement_hides_deposit_on_hex(
                case["key"].as_str().expect("key"),
                hex.nakladka,
                hex.zloze.as_deref()
            ),
            case["out"].as_bool().expect("bool"),
            "improvementHidesDepositOnHex {case}"
        );
    }
    for case in cases(&root, "foodPotentialForHex") {
        assert_same(
            &format!("foodPotentialForHex {case}"),
            food_potential_for_hex(
                terrain(case["teren"].as_str().expect("teren")),
                Overlay::from_web_value(case["nakladka"].as_str().expect("nakladka"))
                    .expect("nakladka"),
                &string_list(&case["keys"]),
            ),
            num(&case["out"]),
        );
    }
}

/// Test KSZTALTU bez pinow wartosci: tabele sa kompletne wzgledem katalogu, a kazde ulepszenie
/// produkujace surowiec ma dodatnia stawke (zmiana balansu nie wymaga zmiany testu).
#[test]
fn rules_tables_have_consistent_shape() {
    let rules = ulepszenia_reguly();
    let catalog = improvement_catalog();
    let keys = improvement_keys();
    for row in &rules.terytorium.ulepszenia {
        assert!(
            keys.contains(&row.ulepszenie),
            "terytorium: {}",
            row.ulepszenie
        );
        let amount = territory_resource_yield_for_improvement(Some(&row.ulepszenie), None, None)
            .expect("produkuje surowiec");
        assert_eq!(amount.resource_key, row.surowiec);
        assert!(amount.amount > 0.0);
    }
    for row in rules
        .ruda
        .kopalnie
        .iter()
        .chain(rules.terytorium.ulepszenia.iter())
    {
        assert!(catalog.row(&row.ulepszenie).is_some());
    }
    for key in rules
        .zywnosc
        .ulepszenia
        .iter()
        .chain(rules.drogi.ulepszenia.iter())
        .chain(rules.produkcja_epoka.ulepszenia_skalowane.iter())
    {
        assert!(
            keys.contains(key),
            "reguly wskazuja nieznane ulepszenie {key}"
        );
    }
    for row in &rules.ukrywanie_zloza.wiersze {
        assert!(keys.contains(&row.ulepszenie));
        assert!(!row.nakladki.is_empty() || !row.zloza.is_empty());
        for name in &row.nakladki {
            assert!(Overlay::from_web_value(name).is_some(), "nakladka {name}");
        }
    }
    for row in &rules.zloze_zwierzece.wiersze {
        assert!(Overlay::from_web_value(&row.nakladka).is_some());
        assert!(keys.contains(&row.ulepszenie));
    }
    assert!(!rules.skala_pracy.mnozniki_epoki.is_empty());
    assert!(rules
        .skala_pracy
        .mnozniki_epoki
        .values()
        .all(|multiplier| *multiplier >= 1.0));
    assert!(resource_upkeep_improvement_keys().len() < keys.len());
}
