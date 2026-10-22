//! P6.5B - `unit-building-bonuses.ts` (bonusy budynkow jednostek: sciezka Pancerza i parametrow
//! miekkich, odznaki, wizyta w miescie, etykiety, scalanie mnoznikow) z wektorami z URUCHOMIONEGO
//! weba (`tests/p6_5b_vectors/buildings.json`, pin edb8fb56). Wektory `"$real"` uzywaja prawdziwego
//! `data/buildings.json` (DANE-JUZ-W-RUST) - ten sam plik, z ktorego web policzyl wynik.

#[path = "p6_5b_vectors/common.rs"]
mod common;

use civ_engine::domain::combat::unit_building_bonuses::{
    apply_city_visit_bonus_gain, armor_path_badge_level, best_building_progress_after_city_visit,
    building_combat_bonus_for_unit, building_progress_would_change, city_armor_bonus_percent,
    city_soft_stat_bonus_percent, cumulative_mnoznik_for_building_id,
    format_building_bonus_gain_hint, merge_building_bonus_into_stat_multipliers,
    mnoznik_role_for_building_id, soft_path_badge_level, unit_building_bonus_label,
    unit_pancerz_bonus_frac, unit_pancerz_bonus_proc, unit_parametry_bonus_frac,
    unit_parametry_bonus_proc, BuildingBonusGain, BuildingCombatBonus, MnoznikBuildingLookup,
    MnoznikRole, StatMultipliers, StatMultipliersLike, UnitBuildingProgress,
};
use common::{assert_opt_same, assert_same, list, load, num, opt_num, opt_string};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5b_vectors/buildings.json");
const REAL_BUILDINGS: &str = include_str!("../data/buildings.json");

fn root() -> Value {
    load(VECTORS)
}

fn bld<'a>(root: &'a Value, name: &str) -> &'a Vec<Value> {
    list(&root["cases"][name], name)
}

/// Prawdziwy `data/buildings.json` jako `MnoznikBuildingLookup` (id, baza.mnoznik, upgradeFrom).
fn real_lookup() -> Vec<MnoznikBuildingLookup> {
    let all: Value = serde_json::from_str(REAL_BUILDINGS).expect("buildings.json");
    list(&all, "buildings").iter().map(lookup).collect()
}

fn lookup(b: &Value) -> MnoznikBuildingLookup {
    MnoznikBuildingLookup {
        id: b["id"].as_str().expect("id").to_owned(),
        baza_mnoznik: b.get("baza").and_then(|baza| opt_num(baza.get("mnoznik"))),
        upgrade_from: opt_string(b.get("upgradeFrom")),
    }
}

/// Lista budynkow z wektora (`None` = `undefined`/`null`; `"$real"` = prawdziwe dane gry).
fn buildings(value: Option<&Value>) -> Option<Vec<MnoznikBuildingLookup>> {
    match value {
        Some(Value::String(marker)) if marker == "$real" => Some(real_lookup()),
        Some(Value::Array(items)) => Some(items.iter().map(lookup).collect()),
        _ => None,
    }
}

fn built(value: Option<&Value>) -> Option<Vec<String>> {
    match value {
        Some(Value::Array(items)) => Some(
            items
                .iter()
                .map(|i| i.as_str().expect("id").to_owned())
                .collect(),
        ),
        _ => None,
    }
}

fn progress(value: Option<&Value>) -> Option<UnitBuildingProgress> {
    match value {
        Some(object @ Value::Object(_)) => Some(UnitBuildingProgress {
            pancerz_bonus_proc: opt_num(object.get("pancerzBonusProc")),
            parametry_bonus_proc: opt_num(object.get("parametryBonusProc")),
        }),
        _ => None,
    }
}

fn role_name(role: Option<MnoznikRole>) -> Option<&'static str> {
    role.map(|r| match r {
        MnoznikRole::Pancerz => "pancerz",
        MnoznikRole::Parametry => "parametry",
    })
}

#[test]
fn building_roles_and_real_game_data_match_web() {
    let root = root();
    for case in bld(&root, "mnoznikRoleForBuildingId") {
        assert_eq!(
            role_name(mnoznik_role_for_building_id(
                case["id"].as_str().expect("id")
            )),
            case["out"].as_str(),
            "{case}"
        );
    }
    let lookup = real_lookup();
    for case in bld(&root, "real") {
        let ids: Vec<String> = case["built"]
            .as_array()
            .expect("built")
            .iter()
            .map(|i| i.as_str().expect("id").to_owned())
            .collect();
        assert_same(
            "armor",
            city_armor_bonus_percent(Some(&ids), Some(&lookup)),
            num(&case["armor"]),
        );
        assert_same(
            "soft",
            city_soft_stat_bonus_percent(Some(&ids), Some(&lookup)),
            num(&case["soft"]),
        );
    }
    let mut roles = 0;
    for case in bld(&root, "realCumulative") {
        let id = case["id"].as_str().expect("id");
        assert_eq!(
            role_name(mnoznik_role_for_building_id(id)),
            case["role"].as_str(),
            "{id}"
        );
        assert_same(
            "cumulative",
            cumulative_mnoznik_for_building_id(id, Some(&lookup)),
            num(&case["out"]),
        );
        roles += usize::from(mnoznik_role_for_building_id(id).is_some());
    }
    assert!(roles >= 6);
}

#[test]
fn city_percentages_and_chains_match_web_including_cycles_and_trimmed_ids() {
    let root = root();
    let (mut positive, mut chained) = (0, 0);
    for case in bld(&root, "cityBonus") {
        let list = buildings(case.get("buildings"));
        let ids = built(case.get("built"));
        let armor = city_armor_bonus_percent(ids.as_deref(), list.as_deref());
        let soft = city_soft_stat_bonus_percent(ids.as_deref(), list.as_deref());
        assert_same("armor", armor, num(&case["armor"]));
        assert_same("soft", soft, num(&case["soft"]));
        positive += usize::from(armor > 0.0 || soft > 0.0);
        chained += usize::from(armor > 15.0 || soft > 20.0);
    }
    assert!(positive > 300 && chained > 100);
    for case in bld(&root, "cumulative") {
        let list = buildings(case.get("buildings"));
        assert_same(
            "cumulative",
            cumulative_mnoznik_for_building_id(case["id"].as_str().expect("id"), list.as_deref()),
            num(&case["out"]),
        );
    }
}

#[test]
fn chain_depth_limit_matches_web() {
    let root = root();
    let (mut cut, mut reached) = (0, 0);
    for case in bld(&root, "depth") {
        let list = buildings(case.get("buildings"));
        let ids = built(case.get("built"));
        let armor = city_armor_bonus_percent(ids.as_deref(), list.as_deref());
        assert_same("armor", armor, num(&case["armor"]));
        assert_same(
            "cumulative",
            cumulative_mnoznik_for_building_id("kuznia", list.as_deref()),
            num(&case["cumulative"]),
        );
        let k = case["k"].as_u64().expect("k");
        if case["built"].as_array().is_some_and(|b| b.len() == 1) && k < 100 {
            if armor > 15.0 {
                reached += 1;
            } else {
                cut += 1;
            }
        }
    }
    assert!(
        cut > 3 && reached > 3,
        "granica glebokosci: {cut}/{reached}"
    );
}

#[test]
fn unit_progress_badges_and_fractions_match_web() {
    let root = root();
    let (mut levels_seen, mut empty) = ([0usize; 4], 0);
    for case in bld(&root, "unitProc") {
        let unit = progress(case.get("unit"));
        let u = unit.as_ref();
        assert_same("pancerz", unit_pancerz_bonus_proc(u), num(&case["pancerz"]));
        assert_same(
            "parametry",
            unit_parametry_bonus_proc(u),
            num(&case["parametry"]),
        );
        assert_same("frac", unit_pancerz_bonus_frac(u), num(&case["frac"]));
        assert_same("fracP", unit_parametry_bonus_frac(u), num(&case["fracP"]));
        assert_eq!(
            u64::from(armor_path_badge_level(u)),
            case["armorBadge"].as_u64().expect("armorBadge")
        );
        assert_eq!(
            u64::from(soft_path_badge_level(u)),
            case["softBadge"].as_u64().expect("softBadge")
        );
        assert_eq!(
            unit_building_bonus_label(u),
            case["label"].as_str().expect("label")
        );
        let combat = building_combat_bonus_for_unit(u);
        assert_same(
            "combat.pancerz",
            combat.pancerz,
            num(&case["combat"]["pancerz"]),
        );
        assert_same("combat.other", combat.other, num(&case["combat"]["other"]));
        levels_seen[usize::from(armor_path_badge_level(u))] += 1;
        empty += usize::from(unit.is_none());
    }
    assert!(levels_seen.iter().all(|n| *n > 0) && empty >= 1);
    let mut grid_levels = ([0usize; 4], [0usize; 4]);
    for case in bld(&root, "badgeGrid") {
        let u = UnitBuildingProgress {
            pancerz_bonus_proc: Some(num(&case["pp"])),
            parametry_bonus_proc: Some(num(&case["pp"])),
        };
        let (a, s) = (
            armor_path_badge_level(Some(&u)),
            soft_path_badge_level(Some(&u)),
        );
        assert_eq!(
            u64::from(a),
            case["armor"].as_u64().expect("armor"),
            "{case}"
        );
        assert_eq!(u64::from(s), case["soft"].as_u64().expect("soft"), "{case}");
        grid_levels.0[usize::from(a)] += 1;
        grid_levels.1[usize::from(s)] += 1;
    }
    assert!(grid_levels.0.iter().all(|n| *n >= 5) && grid_levels.1.iter().all(|n| *n >= 5));
}

#[test]
fn city_visit_gain_progress_and_hint_match_web() {
    let root = root();
    let (mut changed, mut unchanged, mut hints) = (0, 0, 0);
    for case in bld(&root, "apply") {
        let unit = progress(case.get("unit"));
        let list = buildings(case.get("buildings"));
        let ids = built(case.get("built"));
        let best =
            best_building_progress_after_city_visit(unit.as_ref(), ids.as_deref(), list.as_deref());
        assert_same(
            "best.pancerz",
            best.pancerz_bonus_proc,
            num(&case["best"]["pancerzBonusProc"]),
        );
        assert_same(
            "best.parametry",
            best.parametry_bonus_proc,
            num(&case["best"]["parametryBonusProc"]),
        );
        assert_eq!(
            building_progress_would_change(unit.as_ref(), ids.as_deref(), list.as_deref()),
            case["would"].as_bool().expect("would"),
            "{case}"
        );
        let mut live = unit.unwrap_or_default();
        let gain = apply_city_visit_bonus_gain(&mut live, ids.as_deref(), list.as_deref());
        let want = &case["gain"];
        assert_eq!(
            gain.changed,
            want["changed"].as_bool().expect("changed"),
            "{case}"
        );
        assert_same("armorGained", gain.armor_gained, num(&want["armorGained"]));
        assert_same("softGained", gain.soft_gained, num(&want["softGained"]));
        assert_same("armorTotal", gain.armor_total, num(&want["armorTotal"]));
        assert_same("softTotal", gain.soft_total, num(&want["softTotal"]));
        if !case["emptyInput"].as_bool().expect("emptyInput") {
            let after = &case["unitAfter"];
            assert_opt_same(
                "unitAfter.pancerz",
                live.pancerz_bonus_proc,
                opt_num(after.get("pancerzBonusProc")),
            );
            assert_opt_same(
                "unitAfter.parametry",
                live.parametry_bonus_proc,
                opt_num(after.get("parametryBonusProc")),
            );
        }
        let hint = format_building_bonus_gain_hint(
            case["labelUnit"].as_str().expect("labelUnit"),
            case["cityName"].as_str().expect("cityName"),
            &gain,
        );
        assert_eq!(hint, case["hint"].as_str().expect("hint"), "{case}");
        changed += usize::from(gain.changed);
        unchanged += usize::from(!gain.changed);
        hints += usize::from(!hint.is_empty());
    }
    assert!(changed > 100 && unchanged > 100 && hints > 100);
}

#[test]
fn gain_hint_text_matches_web_for_arbitrary_gains() {
    let root = root();
    let mut both = 0;
    for case in bld(&root, "hint") {
        let g = &case["gain"];
        let gain = BuildingBonusGain {
            changed: false,
            armor_gained: num(&g["armorGained"]),
            soft_gained: num(&g["softGained"]),
            armor_total: num(&g["armorTotal"]),
            soft_total: num(&g["softTotal"]),
        };
        let got = format_building_bonus_gain_hint("Wojownik", "Rzym", &gain);
        assert_eq!(got, case["out"].as_str().expect("out"), "{case}");
        both += usize::from(got.contains(" \u{b7} "));
    }
    assert!(both > 100);
}

#[test]
fn stat_multiplier_merge_matches_web() {
    let root = root();
    let (mut merged, mut skipped) = (0, 0);
    for case in bld(&root, "merge") {
        let m = &case["mods"];
        let mut mods = StatMultipliersLike {
            atk: num(&m["atk"]),
            obrona: num(&m["obrona"]),
            pancerz: num(&m["pancerz"]),
            uderzenie: num(&m["uderzenie"]),
            ranged_atk: num(&m["rangedAtk"]),
            health: num(&m["health"]),
        };
        let bonus = case
            .get("bonus")
            .filter(|b| b.is_object())
            .map(|b| BuildingCombatBonus {
                pancerz: num(&b["pancerz"]),
                other: num(&b["other"]),
            });
        let before = mods;
        let returned = merge_building_bonus_into_stat_multipliers(&mut mods, bonus.as_ref());
        let returned_copy = *returned;
        let a = &case["after"];
        for (label, got, key) in [
            ("atk", returned_copy.atk, "atk"),
            ("obrona", returned_copy.obrona, "obrona"),
            ("pancerz", returned_copy.pancerz, "pancerz"),
            ("uderzenie", returned_copy.uderzenie, "uderzenie"),
            ("rangedAtk", returned_copy.ranged_atk, "rangedAtk"),
            ("health", returned_copy.health, "health"),
        ] {
            assert_same(label, got, num(&a[key]));
        }
        assert!(
            case["same"].as_bool().expect("same"),
            "web zwraca ten sam obiekt"
        );
        if mods == before {
            skipped += 1;
        } else {
            merged += 1;
        }
    }
    assert!(merged > 100 && skipped > 20);
}

/// Typ spelniajacy `StatMultipliersLike` strukturalnie (jak obiekt TS z dodatkowymi polami): inna
/// kolejnosc pol i pole dodatkowe, ktorego scalanie NIE moze dotknac.
struct WideMods {
    extra: f64,
    health: f64,
    ranged_atk: f64,
    uderzenie: f64,
    pancerz: f64,
    obrona: f64,
    atk: f64,
}

impl StatMultipliers for WideMods {
    fn atk_mut(&mut self) -> &mut f64 {
        &mut self.atk
    }
    fn obrona_mut(&mut self) -> &mut f64 {
        &mut self.obrona
    }
    fn pancerz_mut(&mut self) -> &mut f64 {
        &mut self.pancerz
    }
    fn uderzenie_mut(&mut self) -> &mut f64 {
        &mut self.uderzenie
    }
    fn ranged_atk_mut(&mut self) -> &mut f64 {
        &mut self.ranged_atk
    }
    fn health_mut(&mut self) -> &mut f64 {
        &mut self.health
    }
}

/// Web: `mergeBuildingBonusIntoStatMultipliers<T extends StatMultipliersLike>` zwraca ten sam
/// obiekt typu `T`. Rust: ta sama funkcja generyczna dla innego typu niz konkretna struktura.
#[test]
fn stat_multiplier_merge_is_generic_over_any_structural_type() {
    let root = root();
    let mut compared = 0;
    for case in bld(&root, "merge") {
        let m = &case["mods"];
        let mut wide = WideMods {
            extra: 0.125,
            health: num(&m["health"]),
            ranged_atk: num(&m["rangedAtk"]),
            uderzenie: num(&m["uderzenie"]),
            pancerz: num(&m["pancerz"]),
            obrona: num(&m["obrona"]),
            atk: num(&m["atk"]),
        };
        let bonus = case
            .get("bonus")
            .filter(|b| b.is_object())
            .map(|b| BuildingCombatBonus {
                pancerz: num(&b["pancerz"]),
                other: num(&b["other"]),
            });
        let returned = merge_building_bonus_into_stat_multipliers(&mut wide, bonus.as_ref());
        let a = &case["after"];
        assert_same("atk", returned.atk, num(&a["atk"]));
        assert_same("obrona", returned.obrona, num(&a["obrona"]));
        assert_same("pancerz", returned.pancerz, num(&a["pancerz"]));
        assert_same("uderzenie", returned.uderzenie, num(&a["uderzenie"]));
        assert_same("rangedAtk", returned.ranged_atk, num(&a["rangedAtk"]));
        assert_same("health", returned.health, num(&a["health"]));
        assert_same("extra", wide.extra, 0.125);
        compared += 1;
    }
    assert!(compared > 100);
}
