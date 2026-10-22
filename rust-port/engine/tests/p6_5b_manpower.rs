//! P6.5B - `manpower.ts` (pula Manpower, odnowa, rekrutacja z puli imperium, parametry) z wektorami
//! z URUCHOMIONEGO weba (`tests/p6_5b_vectors/manpower.json`, pin edb8fb56). Porownanie `f64` jest
//! bitowe (`NaN == NaN`, `-0 != 0`).

#[path = "p6_5b_vectors/common.rs"]
mod common;

use civ_engine::domain::recruitment::manpower::{
    can_afford_unit_manpower, can_afford_unit_manpower_empire, city_ludnosc_absolutna,
    city_manpower_current, city_manpower_max, city_manpower_snapshot, civ_manpower_max_mult,
    civ_manpower_mults, civ_manpower_regen_mult, clamp_ludki, deduct_manpower_from_empire,
    empire_manpower_current, empire_pobor_totals, empire_suma_ludkow, epoka_manpower_row,
    is_civilian_unit, is_scout_type_id, is_unit_in_besieged_location, load_manpower_regen_params,
    load_manpower_replenish_params, manpower_cost_for_heal, manpower_heal_cap_for_turn,
    manpower_regen_gain, max_affordable_manpower_heal, refresh_manpower_after_pop_change,
    refund_manpower_to_empire, refund_unit_spawn_to_city, rekrut_unit_equivalents,
    replenishment_unit_sort_key, spend_manpower, sync_live_unit_hp, tick_manpower_regen,
    try_deduct_unit_spawn_costs, try_deduct_unit_spawn_costs_empire, unit_manpower_cost,
    unit_manpower_cost_for_type, ManpowerDifficulty, ManpowerRegenParams, ManpowerReplenishParams,
    UnitSpawnDeduction,
};
use common::{
    assert_cities, assert_heal_units, assert_opt_same, assert_same, bonusy, cities, city,
    heal_unit, list, load, num, opt_num, raw_miasto,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_5b_vectors/manpower.json");

fn root() -> Value {
    load(VECTORS)
}

fn scalar<'a>(root: &'a Value, name: &str) -> &'a Vec<Value> {
    list(&root["cases"]["scalar"][name], name)
}

fn type_id(case: &Value) -> Option<&str> {
    case.get("typeId").and_then(Value::as_str)
}

fn difficulty(name: &str) -> ManpowerDifficulty {
    match name {
        "easy" => ManpowerDifficulty::Easy,
        "normal" => ManpowerDifficulty::Normal,
        "hard" => ManpowerDifficulty::Hard,
        other => panic!("trudnosc {other}"),
    }
}

fn regen_params(value: Option<&Value>) -> ManpowerRegenParams {
    match value {
        Some(p) => ManpowerRegenParams {
            regen_proc_max_per_turn: num(&p["regenProcMaxPerTurn"]),
            block_when_besieged: p["blockWhenBesieged"].as_bool().expect("block"),
        },
        None => ManpowerRegenParams::default_params(),
    }
}

#[test]
fn era_table_and_citizen_scalars_match_web() {
    let root = root();
    let mut clamped = 0;
    for case in scalar(&root, "epokaManpowerRow") {
        let got = epoka_manpower_row(num(&case["epoka"]));
        let want = &case["out"];
        assert_same("epoka", got.epoka, num(&want["epoka"]));
        assert_same(
            "ludekNaLudka",
            got.ludek_na_ludka,
            num(&want["ludekNaLudka"]),
        );
        assert_same(
            "manpowerNaLudka",
            got.manpower_na_ludka,
            num(&want["manpowerNaLudka"]),
        );
        assert_same(
            "manpowerNaJednostke",
            got.manpower_na_jednostke,
            num(&want["manpowerNaJednostke"]),
        );
        clamped += usize::from(got.epoka != num(&case["epoka"]));
    }
    assert!(clamped >= 8);
    for case in scalar(&root, "clampLudki") {
        assert_same(
            "clampLudki",
            clamp_ludki(num(&case["ludki"])),
            num(&case["out"]),
        );
    }
    for case in scalar(&root, "cityLudnoscAbsolutna") {
        assert_same(
            "cityLudnoscAbsolutna",
            city_ludnosc_absolutna(num(&case["ludki"]), num(&case["epoka"])),
            num(&case["out"]),
        );
    }
}

#[test]
fn pool_and_cost_scalars_match_web() {
    let root = root();
    for case in scalar(&root, "cityManpowerMax") {
        assert_same(
            "cityManpowerMax",
            city_manpower_max(
                num(&case["ludki"]),
                num(&case["epoka"]),
                num(&case["maxMult"]),
            ),
            num(&case["out"]),
        );
    }
    for case in scalar(&root, "unitManpowerCost") {
        assert_same(
            "unitManpowerCost",
            unit_manpower_cost(num(&case["epoka"]), num(&case["maxMult"])),
            num(&case["out"]),
        );
    }
    let mut scouts = 0;
    for case in scalar(&root, "unitManpowerCostForType") {
        let got =
            unit_manpower_cost_for_type(type_id(case), num(&case["epoka"]), num(&case["maxMult"]));
        assert_same("unitManpowerCostForType", got, num(&case["out"]));
        scouts += usize::from(got == 0.0 && type_id(case) == Some("Zwiadowca"));
    }
    assert!(scouts > 50);
    for case in scalar(&root, "isScoutTypeId") {
        assert_eq!(
            is_scout_type_id(type_id(case)),
            case["out"].as_bool().expect("out"),
            "{case}"
        );
    }
    for case in scalar(&root, "rekrutUnitEquivalents") {
        assert_same(
            "rekrutUnitEquivalents",
            rekrut_unit_equivalents(
                num(&case["rekruci"]),
                num(&case["epoka"]),
                num(&case["maxMult"]),
            ),
            num(&case["out"]),
        );
    }
}

#[test]
fn heal_cost_and_cap_match_web() {
    let root = root();
    let mut zero = 0;
    let mut positive = 0;
    for case in scalar(&root, "manpowerCostForHeal") {
        let got = manpower_cost_for_heal(
            num(&case["healHp"]),
            num(&case["maxHp"]),
            num(&case["unitCost"]),
        );
        assert_same("manpowerCostForHeal", got, num(&case["out"]));
        zero += usize::from(got == 0.0);
        positive += usize::from(got > 0.0);
    }
    assert!(zero > 50 && positive > 50);
    for case in scalar(&root, "maxAffordableManpowerHeal") {
        assert_same(
            "maxAffordableManpowerHeal",
            max_affordable_manpower_heal(
                num(&case["desiredHeal"]),
                num(&case["maxHp"]),
                num(&case["unitCost"]),
                num(&case["availableMp"]),
            ),
            num(&case["out"]),
        );
    }
    for case in scalar(&root, "manpowerHealCapForTurn") {
        let params = ManpowerReplenishParams {
            heal_pct_max_per_turn: num(&case["pct"]),
        };
        assert_same(
            "manpowerHealCapForTurn",
            manpower_heal_cap_for_turn(num(&case["maxHp"]), num(&case["curHp"]), &params),
            num(&case["out"]),
        );
    }
}

#[test]
fn regen_gain_matches_web_including_default_params() {
    let root = root();
    let mut positive = 0;
    for case in scalar(&root, "manpowerRegenGain") {
        let params = regen_params(case.get("params"));
        let got = manpower_regen_gain(
            num(&case["ludki"]),
            num(&case["epoka"]),
            &params,
            num(&case["regenMult"]),
            num(&case["maxMult"]),
        );
        assert_same("manpowerRegenGain", got, num(&case["out"]));
        positive += usize::from(got > 0.0);
    }
    assert!(positive > 100);
    for case in scalar(&root, "regenGainDefaults") {
        let got = manpower_regen_gain(
            num(&case["ludki"]),
            num(&case["epoka"]),
            &ManpowerRegenParams::default_params(),
            1.0,
            1.0,
        );
        assert_same("regenGainDefaults", got, num(&case["out"]));
    }
}

#[test]
fn raw_param_loaders_match_web() {
    let root = root();
    let params = &root["cases"]["params"];
    let mut fallbacks = 0;
    for case in list(&params["replenish"], "replenish") {
        let raw = raw_miasto(&case["raw"]);
        let got = load_manpower_replenish_params(
            difficulty(case["difficulty"].as_str().expect("difficulty")),
            Some(&raw),
        );
        assert_same(
            "healPctMaxPerTurn",
            got.heal_pct_max_per_turn,
            num(&case["out"]["healPctMaxPerTurn"]),
        );
        fallbacks += usize::from(raw.replenish.is_none_or(|row| row.easy.is_none()));
    }
    assert!(fallbacks > 100);
    for case in list(&params["regen"], "regen") {
        let raw = raw_miasto(&case["raw"]);
        let got = load_manpower_regen_params(Some(&raw));
        assert_same(
            "regenProcMaxPerTurn",
            got.regen_proc_max_per_turn,
            num(&case["out"]["regenProcMaxPerTurn"]),
        );
        assert_eq!(
            got.block_when_besieged,
            case["out"]["blockWhenBesieged"].as_bool().expect("block"),
            "{case}"
        );
    }
}

#[test]
fn game_default_params_equal_the_running_web_defaults() {
    let consts = &load(include_str!("p6_5b_vectors/format.json"))["consts"];
    let regen = load_manpower_regen_params(None);
    assert_same(
        "domyslny regen",
        regen.regen_proc_max_per_turn,
        num(&consts["defaultRegen"]["regenProcMaxPerTurn"]),
    );
    assert_eq!(
        regen.block_when_besieged,
        consts["defaultRegen"]["blockWhenBesieged"]
            .as_bool()
            .expect("block")
    );
    for (name, d) in [
        ("easy", ManpowerDifficulty::Easy),
        ("normal", ManpowerDifficulty::Normal),
        ("hard", ManpowerDifficulty::Hard),
    ] {
        assert_same(
            name,
            load_manpower_replenish_params(d, None).heal_pct_max_per_turn,
            num(&consts["defaultReplenish"][name]["healPctMaxPerTurn"]),
        );
    }
}

#[test]
fn civ_bonus_multipliers_match_web() {
    let root = root();
    let (mut doubled, mut floored) = (0, 0);
    for case in list(&root["cases"]["params"]["civ"], "civ") {
        let list = bonusy(case.get("bonusy"));
        let regen = civ_manpower_regen_mult(list.as_deref());
        let max = civ_manpower_max_mult(list.as_deref());
        assert_same("regen", regen, num(&case["regen"]));
        assert_same("max", max, num(&case["max"]));
        let (r2, m2) = civ_manpower_mults(list.as_deref());
        assert_same("mults.regenMult", r2, num(&case["mults"]["regenMult"]));
        assert_same("mults.maxMult", m2, num(&case["mults"]["maxMult"]));
        doubled += usize::from(max == 2.0 || regen == 2.0);
        floored += usize::from(max == 0.1 || regen == 0.1);
    }
    assert!(doubled > 10 && floored > 10);
}

#[test]
fn city_pool_functions_match_web() {
    let root = root();
    let c = &root["cases"]["city"];
    let (mut full, mut clamped) = (0, 0);
    for case in list(&c["cityManpowerCurrent"], "cityManpowerCurrent") {
        let ct = city(&case["city"]);
        let got = city_manpower_current(&ct, num(&case["epoka"]), num(&case["maxMult"]));
        assert_same("cityManpowerCurrent", got, num(&case["out"]));
        let max = city_manpower_max(ct.population, num(&case["epoka"]), num(&case["maxMult"]));
        full += usize::from(got == max);
        clamped += usize::from(got < max);
    }
    assert!(full > 50 && clamped > 50);

    let mut gained = 0;
    for case in list(&c["tickManpowerRegen"], "tickManpowerRegen") {
        let ct = city(&case["city"]);
        let params = regen_params(case.get("params"));
        let got = tick_manpower_regen(
            &ct,
            num(&case["epoka"]),
            &params,
            num(&case["regenMult"]),
            num(&case["maxMult"]),
        );
        assert_same("tickManpowerRegen", got, num(&case["out"]));
        gained += usize::from(
            got > city_manpower_current(&ct, num(&case["epoka"]), num(&case["maxMult"])),
        );
    }
    assert!(gained > 30);

    for case in list(&c["cityManpowerSnapshot"], "cityManpowerSnapshot") {
        let ct = city(&case["city"]);
        let got = city_manpower_snapshot(
            &ct,
            num(&case["epoka"]),
            num(&case["regenMult"]),
            num(&case["maxMult"]),
        );
        let want = &case["out"];
        assert_same("epoka", got.epoka, num(&want["epoka"]));
        assert_same("ludki", got.ludki, num(&want["ludki"]));
        assert_same(
            "ludnoscAbsolutna",
            got.ludnosc_absolutna,
            num(&want["ludnoscAbsolutna"]),
        );
        assert_same("manpowerMax", got.manpower_max, num(&want["manpowerMax"]));
        assert_same(
            "manpowerBiezacy",
            got.manpower_biezacy,
            num(&want["manpowerBiezacy"]),
        );
        assert_same(
            "kosztJednostki",
            got.koszt_jednostki,
            num(&want["kosztJednostki"]),
        );
        assert_same(
            "regenPerTurn",
            got.regen_per_turn,
            num(&want["regenPerTurn"]),
        );
        assert_same(
            "werbMaxPrzyPelnejPuli",
            got.werb_max_przy_pelnej_puli,
            num(&want["werbMaxPrzyPelnejPuli"]),
        );
    }

    for case in list(&c["canAffordUnitManpower"], "canAffordUnitManpower") {
        let ct = city(&case["city"]);
        assert_eq!(
            can_afford_unit_manpower(
                &ct,
                num(&case["epoka"]),
                num(&case["maxMult"]),
                type_id(case)
            ),
            case["out"].as_bool().expect("out"),
            "{case}"
        );
    }
    for case in list(
        &c["refreshManpowerAfterPopChange"],
        "refreshManpowerAfterPopChange",
    ) {
        let ct = city(&case["city"]);
        assert_same(
            "refreshManpowerAfterPopChange",
            refresh_manpower_after_pop_change(
                &ct,
                num(&case["epoka"]),
                opt_num(case.get("previousPop")),
                num(&case["maxMult"]),
            ),
            num(&case["out"]),
        );
    }
    for case in list(&c["spendManpower"], "spendManpower") {
        let ct = city(&case["city"]);
        assert_same(
            "spendManpower",
            spend_manpower(
                &ct,
                num(&case["epoka"]),
                opt_num(case.get("amount")),
                num(&case["maxMult"]),
            ),
            num(&case["out"]),
        );
    }
}

fn spawn(case: &Value) -> UnitSpawnDeduction {
    let reason = match case.get("reason").and_then(Value::as_str) {
        Some("brak_manpower") => {
            Some(civ_engine::domain::recruitment::manpower::UnitSpawnBlockReason::BrakManpower)
        }
        Some("brak_ludnosci") => {
            Some(civ_engine::domain::recruitment::manpower::UnitSpawnBlockReason::BrakLudnosci)
        }
        Some(other) => panic!("powod {other}"),
        None => None,
    };
    UnitSpawnDeduction {
        ok: case["ok"].as_bool().expect("ok"),
        population: num(&case["population"]),
        manpower: num(&case["manpower"]),
        koszt_manpower: num(&case["kosztManpower"]),
        reason,
    }
}

fn assert_spawn(label: &str, got: &UnitSpawnDeduction, want: &UnitSpawnDeduction) {
    assert_eq!(got.ok, want.ok, "{label} ok");
    assert_same(
        &format!("{label} population"),
        got.population,
        want.population,
    );
    assert_same(&format!("{label} manpower"), got.manpower, want.manpower);
    assert_same(
        &format!("{label} kosztManpower"),
        got.koszt_manpower,
        want.koszt_manpower,
    );
    assert_eq!(got.reason, want.reason, "{label} reason");
}

#[test]
fn spawn_and_refund_functions_match_web() {
    let root = root();
    let c = &root["cases"]["city"];
    let (mut ok, mut blocked_mp, mut blocked_pop) = (0, 0, 0);
    for case in list(&c["tryDeductUnitSpawnCosts"], "tryDeductUnitSpawnCosts") {
        let ct = city(&case["city"]);
        let got = try_deduct_unit_spawn_costs(
            &ct,
            num(&case["epoka"]),
            num(&case["popCost"]),
            num(&case["maxMult"]),
            type_id(case),
        );
        assert_spawn("tryDeductUnitSpawnCosts", &got, &spawn(&case["out"]));
        ok += usize::from(got.ok);
        blocked_mp += usize::from(got.reason.map(|r| r.as_str()) == Some("brak_manpower"));
        blocked_pop += usize::from(got.reason.map(|r| r.as_str()) == Some("brak_ludnosci"));
    }
    assert!(ok > 30 && blocked_mp > 30 && blocked_pop > 5);
    for case in list(&c["refundUnitSpawnToCity"], "refundUnitSpawnToCity") {
        let ct = city(&case["city"]);
        let (population, manpower) = refund_unit_spawn_to_city(
            &ct,
            num(&case["epoka"]),
            num(&case["popCost"]),
            opt_num(case.get("popCap")),
            num(&case["maxMult"]),
            type_id(case),
        );
        assert_same(
            "refund.population",
            population,
            num(&case["out"]["population"]),
        );
        assert_same("refund.manpower", manpower, num(&case["out"]["manpower"]));
    }
    // domyslne argumenty weba: popCost = 1, popCap = undefined, maxMult = 1, typeId = undefined
    for case in list(&c["refundDefaults"], "refundDefaults") {
        let ct = city(&case["city"]);
        let (population, manpower) = refund_unit_spawn_to_city(
            &ct,
            num(&case["epoka"]),
            civ_engine::domain::recruitment::manpower::default_refund_pop_cost(),
            None,
            1.0,
            None,
        );
        assert_same(
            "refundDefaults.population",
            population,
            num(&case["out"]["population"]),
        );
        assert_same(
            "refundDefaults.manpower",
            manpower,
            num(&case["out"]["manpower"]),
        );
    }
}

#[test]
fn empire_totals_match_web() {
    let root = root();
    let c = &root["cases"]["city"];
    let mut nonzero = 0;
    for case in list(&c["empireTotals"], "empireTotals") {
        let all = cities(&case["cities"]);
        let owner = case["ownerId"].as_i64().expect("owner");
        let (e, mm) = (num(&case["epoka"]), num(&case["maxMult"]));
        assert_same("suma", empire_suma_ludkow(&all, owner), num(&case["suma"]));
        let got = empire_pobor_totals(&all, owner, e, mm);
        let want = &case["totals"];
        assert_same("sumaLudkow", got.suma_ludkow, num(&want["sumaLudkow"]));
        assert_same(
            "ludnoscAbsolutna",
            got.ludnosc_absolutna,
            num(&want["ludnoscAbsolutna"]),
        );
        assert_same("rekruci", got.rekruci, num(&want["rekruci"]));
        assert_same("poborRaw", got.pobor_raw, num(&want["poborRaw"]));
        assert_same(
            "current",
            empire_manpower_current(&all, owner, e, mm),
            num(&case["current"]),
        );
        nonzero += usize::from(got.rekruci > 0.0);
    }
    assert!(nonzero > 100);
    for case in list(&c["canAffordEmpire"], "canAffordEmpire") {
        let all = cities(&case["cities"]);
        let recruiting = city(&case["recruiting"]);
        let got = can_afford_unit_manpower_empire(
            &all,
            case["ownerId"].as_i64().expect("owner"),
            &recruiting,
            num(&case["epoka"]),
            num(&case["popCost"]),
            num(&case["maxMult"]),
            type_id(case),
        );
        assert_eq!(got, case["out"].as_bool().expect("out"), "{case}");
    }
}

#[test]
fn empire_deduct_refund_and_spawn_mutate_like_web() {
    let root = root();
    let m = &root["cases"]["mut"];
    let (mut deducted, mut refused, mut ties) = (0, 0, 0);
    for case in list(&m["deduct"], "deduct") {
        let mut all = cities(&case["cities"]);
        let owner = case["ownerId"].as_i64().expect("owner");
        let ok = deduct_manpower_from_empire(
            &mut all,
            owner,
            num(&case["epoka"]),
            num(&case["amount"]),
            num(&case["maxMult"]),
        );
        assert_eq!(ok, case["ok"].as_bool().expect("ok"), "deduct ok {case}");
        assert_cities("deduct", &all, &cities(&case["after"]));
        deducted += usize::from(ok && num(&case["amount"]) > 0.0);
        refused += usize::from(!ok);
        let before = cities(&case["cities"]);
        let same_pool = before
            .iter()
            .filter(|c| c.owner_id == owner)
            .map(|c| city_manpower_current(c, num(&case["epoka"]), num(&case["maxMult"])))
            .collect::<Vec<_>>();
        ties += usize::from(same_pool.windows(2).any(|w| w[0] == w[1]));
    }
    assert!(deducted > 100 && refused > 50 && ties > 50);

    let mut refunded = 0;
    for case in list(&m["refund"], "refund") {
        let mut all = cities(&case["cities"]);
        let before = all.clone();
        refund_manpower_to_empire(
            &mut all,
            case["ownerId"].as_i64().expect("owner"),
            num(&case["epoka"]),
            num(&case["amount"]),
            num(&case["maxMult"]),
        );
        assert_cities("refund", &all, &cities(&case["after"]));
        refunded += usize::from(all != before);
    }
    assert!(refunded > 100);

    let (mut spawned, mut missing) = (0, 0);
    for case in list(&m["tryDeductEmpire"], "tryDeductEmpire") {
        let mut all = cities(&case["cities"]);
        let got = try_deduct_unit_spawn_costs_empire(
            &mut all,
            case["recruitingCityId"].as_str().expect("id"),
            case["ownerId"].as_i64().expect("owner"),
            num(&case["epoka"]),
            0.0,
            num(&case["maxMult"]),
            type_id(case),
        );
        assert_spawn("tryDeductEmpire", &got, &spawn(&case["out"]));
        assert_cities("tryDeductEmpire", &all, &cities(&case["after"]));
        spawned += usize::from(got.ok && got.koszt_manpower > 0.0);
        missing += usize::from(!got.ok && got.population == 0.0);
    }
    assert!(spawned > 100 && missing > 20);
}

#[test]
fn besieged_location_sort_key_sync_and_civilian_match_web() {
    let root = root();
    let x = &root["cases"]["misc"];
    let (mut besieged, mut garrison, mut field) = (0, 0, 0);
    for case in list(&x["isUnitInBesiegedLocation"], "isUnitInBesiegedLocation") {
        let u = heal_unit(&case["unit"]);
        let all = cities(&case["cities"]);
        let got = is_unit_in_besieged_location(u.owner_id, u.q, u.r, &all);
        assert_eq!(got, case["out"].as_bool().expect("out"), "{case}");
        besieged += usize::from(got);
    }
    for case in list(&x["replenishmentUnitSortKey"], "replenishmentUnitSortKey") {
        let u = heal_unit(&case["unit"]);
        let all = cities(&case["cities"]);
        let got = replenishment_unit_sort_key(&u, &all);
        assert_eq!(u64::from(got), case["out"].as_u64().expect("out"), "{case}");
        match got {
            2 => besieged += 1,
            0 => garrison += 1,
            _ => field += 1,
        }
    }
    assert!(besieged > 20 && garrison > 20 && field > 20);
    for case in list(&x["syncLiveUnitHp"], "syncLiveUnitHp") {
        let mut all = heal_units_sparse(&case["units"]);
        sync_live_unit_hp(
            &mut all,
            case["unitId"].as_str().expect("unitId"),
            num(&case["hp"]),
            num(&case["hpMax"]),
        );
        let want = heal_units_sparse(&case["after"]);
        assert_heal_units("syncLiveUnitHp", &all, &want);
    }
    for case in list(&x["isCivilianUnit"], "isCivilianUnit") {
        assert_eq!(
            is_civilian_unit(
                case["category"].as_str().expect("category"),
                case["typeId"].as_str().expect("typeId")
            ),
            case["out"].as_bool().expect("out"),
            "{case}"
        );
    }
}

/// Jednostki z `syncLiveUnitHp` maja tylko `id`, `hp`, `hpMax` (reszta pol nie jest czytana).
fn heal_units_sparse(
    value: &Value,
) -> Vec<civ_engine::domain::recruitment::manpower::ManpowerHealUnit> {
    list(value, "jednostki")
        .iter()
        .map(
            |u| civ_engine::domain::recruitment::manpower::ManpowerHealUnit {
                id: u["id"].as_str().expect("id").to_owned(),
                owner_id: 0,
                type_id: String::new(),
                category: String::new(),
                hp: opt_num(u.get("hp")),
                hp_max: opt_num(u.get("hpMax")),
                parametry_bonus_proc: None,
                battles_survived: None,
                q: None,
                r: None,
                in_garnizon: None,
            },
        )
        .collect()
}

#[test]
fn opt_helpers_are_consistent() {
    // zabezpieczenie helperow wektorow: `-0` i `NaN` zachowane, brak klucza to `None`
    let v = load(r#"{"a":{"$n":"-0"},"b":{"$n":"NaN"},"c":null}"#);
    assert_opt_same("a", opt_num(v.get("a")), Some(-0.0));
    assert!(opt_num(v.get("b")).is_some_and(f64::is_nan));
    assert!(opt_num(v.get("c")).is_none() && opt_num(v.get("d")).is_none());
}
