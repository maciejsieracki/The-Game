//! R-RUSTPORT-P6-ECON-TICK-POST-Q1 (pin weba `4bbef081d`): etapy kroku ekonomii tury PO bankowaniu
//! (`turn_economy_post.rs`): deficyt Zlota (`main.ts:35250-35354`), wzrost po centrali z `growthMultMap` i
//! `manpowerMaxMultByOwnerId` (`:36009-36092`), upkeep Pracy (`:36093-36118`).
//! Wektory z URUCHOMIONEGO weba (`dyspozycje/autobot/runs/R-RUSTPORT-P6-ECON-TICK-POST-Q1/gen-p6-econ-post-vectors.mjs`):
//! stan graniczny = stan PO prawdziwym `advanceCityEconomy`, bloku EmpireFood (`advanceEmpireFood`, auto-racje, atrycja) i
//! bankowaniu (te same scenariusze/seed co EMPIREFOOD-Q1, ktorych lancuch tick -> EmpireFood -> bankowanie jest porownany
//! bitowo w `p6_empirefood_e2e.rs`), potem prawdziwe `advanceGoldDeficit`, `applyGoldDeficitHpLoss`,
//! `applyPostCentralPopulationGrowth`. Porownanie BITOWE.

#[path = "p6_7b_vectors/common.rs"]
mod common;

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::civilizations::Num;
use civ_engine::domain::city_growth::p6_7a::empire_food::EmpireFoodCityRow;
use civ_engine::domain::city_growth::p6_7a::growth_v85::PopulationChangeHooks;
use civ_engine::domain::city_growth::p6_7a::{EmpireFoodTick, EmpireFoodTickResult, GrowthCity};
use civ_engine::domain::civ_matrix::load_civ_matrix;
use civ_engine::domain::terrain::city_founding::p6_6b::cities::{City, WealthState};
use civ_engine::domain::turn_economy::gold_deficit::{
    build_gold_deficit_params, Difficulty, GoldDeficitRuntime, GoldDeficitState,
    RawGoldDeficitInput, RawGoldDeficitRows, RawParamRow,
};
use civ_engine::domain::turn_economy_attrition::{AttritionUnit, SiegeCityState};
use civ_engine::domain::turn_economy_loop::{CityLoopExtra, CityLoopTick};
use civ_engine::domain::turn_economy_post::{
    apply_praca_upkeep_post, run_gold_deficit_step, run_post_central_growth, GoldDeficitStepInput,
    PostGrowthInput, PostPracaPools,
};
use civ_engine::domain::turn_economy_tick::EconomyTickResult;
use common::*;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_econ_post_vectors/post_0.json");
const ECON: &str = include_str!("../data/econ-params.json");

macro_rules! chk {
    ($cond:expr, $($arg:tt)*) => {
        if !$cond {
            return Err(format!($($arg)*));
        }
    };
}

fn bits(got: f64, want: f64) -> bool {
    (got.is_nan() && want.is_nan()) || got.to_bits() == want.to_bits()
}

fn chk_bits(label: &str, got: f64, want: f64) -> Result<(), String> {
    chk!(bits(got, want), "{label}: rust={got:?} web={want:?}");
    Ok(())
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn chk_opt(label: &str, got: Option<f64>, want: &Value) -> Result<(), String> {
    match (got, opt_num(want)) {
        (Some(g), Some(w)) => chk_bits(label, g, w),
        (None, None) => Ok(()),
        (g, w) => Err(format!("{label}: rust={g:?} web={w:?}")),
    }
}

fn owner_map<T>(v: &Value, f: impl Fn(&Value) -> T) -> BTreeMap<i64, T> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.parse::<i64>().unwrap(), f(x)))
        .collect()
}

fn str_map<T>(v: &Value, f: impl Fn(&Value) -> T) -> BTreeMap<String, T> {
    v.as_object()
        .unwrap()
        .iter()
        .map(|(k, x)| (k.clone(), f(x)))
        .collect()
}

fn city_of(c: &Value) -> City {
    City {
        id: text(&c["id"]),
        owner_id: c["owner"].as_i64().unwrap(),
        q: num(&c["q"]),
        r: num(&c["r"]),
        name: text(&c["id"]),
        population: num(&c["pop"]),
        wzrost_ulamkowy: opt_num(&c["frac"]),
        poziom_racji: opt_num(&c["racja"]),
        ration_migrated_v114: c["migr"].as_bool(),
        procent_rozwoj: opt_num(&c["proc"]),
        tury_bez_doplaty: opt_num(&c["tbd"]),
        wealth_state: if c["wealth"].is_null() {
            None
        } else {
            Some(WealthState {
                poziom: num(&c["wealth"]),
                pula: 0.0,
            })
        },
        ..City::default()
    }
}

fn unit_of(u: &Value) -> AttritionUnit {
    AttritionUnit {
        id: text(&u["id"]),
        owner_id: u["ownerId"].as_i64().unwrap(),
        type_id: text(&u["typeId"]),
        category: text(&u["category"]),
        hp: opt_num(&u["hp"]),
        hp_max: opt_num(&u["hpMax"]),
        oblega_city_id: u["oblega"].as_str().map(str::to_string),
        in_garnizon: u["inGarnizon"].as_bool().unwrap(),
        q: num(&u["q"]),
        r: num(&u["r"]),
    }
}

fn siege_of(c: &Value) -> SiegeCityState {
    SiegeCityState {
        id: text(&c["id"]),
        owner_id: c["owner"].as_i64().unwrap(),
        q: num(&c["q"]),
        r: num(&c["r"]),
        oblegane: c["oblegane"].as_bool().unwrap(),
        oblegajacy_owner_id: c["oblOwner"].as_i64(),
        siege_capitulation_pending: c["cap"].as_bool().unwrap(),
        has_siege_machines: c["mach"].as_bool().unwrap(),
        garnizon: opt_num(&c["garn"]),
    }
}

fn tick_of(t: &Value) -> CityLoopTick {
    let sp = &t["sp"];
    CityLoopTick {
        city_id: text(&t["cityId"]),
        owner_id: t["ownerId"].as_i64().unwrap(),
        oblegany: t["oblegany"].as_bool().unwrap(),
        zdrowie: num(&t["zdrowie"]),
        spichlerz_ceramika: sp["c"].as_bool().unwrap(),
        spichlerz_sol: sp["s"].as_bool().unwrap(),
        ma_spichlerz: sp["p"].as_bool().unwrap(),
        ma_spichlerz_ii: sp["p2"].as_bool().unwrap(),
        ludnosc_po: opt_num(&t["ludnoscPo"]).unwrap_or(f64::NAN),
        wzrost: t["wzrost"].as_bool().unwrap_or(false),
        ubytek: t["ubytek"].as_bool().unwrap_or(false),
        wzrost_procent: opt_num(&t["wzrostProcent"]),
        wzrost_ulamkowy_po: opt_num(&t["wzrostUlamkowyPo"]),
        magazyn_po_turze: opt_num(&t["magazynPoTurze"]).unwrap_or(f64::NAN),
        ..CityLoopTick::default()
    }
}

fn opt_bool_eq(got: bool, want: &Value) -> bool {
    got == want.as_bool().unwrap_or(false)
}

#[derive(Default)]
struct Hooks {
    changed: Vec<String>,
}

impl PopulationChangeHooks for Hooks {
    fn rebalance_workers_after_population_change(
        &mut self,
        _city: &mut GrowthCity,
        _pop_before: f64,
        _pop_after: f64,
        _exclude: Option<&BTreeSet<String>>,
    ) {
        // web: `map: {hexes: new Map()}`, `territoryNodes: []` - rebalans bez wplywu na pola porownywane (zob. P6.7A)
    }

    fn on_city_population_changed(&mut self, city_id: &str) {
        self.changed.push(city_id.to_string());
    }
}

fn row(v: &Value) -> Option<RawParamRow> {
    if v.is_null() {
        return None;
    }
    let g = |k: &str| js_num(&v[k]);
    Some(RawParamRow {
        easy: g("easy"),
        normal: g("normal"),
        hard: g("hard"),
    })
}

fn run_scenario(
    d: &Value,
    matrix: &civ_engine::data::civilizations::CivMatrixFile,
    s: &Value,
) -> Result<[usize; 6], String> {
    let name = text(&s["name"]);
    let p = &s["post"];
    let b = &p["boundary"];
    let inp = &p["inputs"];
    let _ = d;
    let difficulty = text(&s["difficulty"]);
    let econ_params: Value = if s["econ"].is_null() {
        serde_json::from_str(ECON).unwrap()
    } else {
        s["econ"].clone()
    };

    // ---- stan graniczny ----
    let mut cities: Vec<City> = arr(b, "cities").iter().map(city_of).collect();
    let mut extras: BTreeMap<String, CityLoopExtra> = BTreeMap::new();
    let mut hunger: BTreeMap<String, Option<f64>> = BTreeMap::new();
    let mut built: BTreeMap<String, Vec<String>> = BTreeMap::new();
    for c in arr(b, "cities") {
        let id = text(&c["id"]);
        extras.insert(
            id.clone(),
            CityLoopExtra {
                manpower: opt_num(&c["mp"]),
                ..CityLoopExtra::default()
            },
        );
        hunger.insert(id.clone(), opt_num(&c["hunger"]));
        built.insert(id, strings(&c["built"]));
    }
    let mut siege: Vec<SiegeCityState> = arr(b, "cities").iter().map(siege_of).collect();
    let mut units: Vec<AttritionUnit> = arr(b, "units").iter().map(unit_of).collect();
    let mut besieger: BTreeMap<String, i64> = str_map(&b["sbc"], |v| v.as_i64().unwrap());
    let mut tick = EconomyTickResult {
        per_city: arr(b, "ticks").iter().map(tick_of).collect(),
        growth: num(&b["econGrowth"]),
        starved: num(&b["econStarved"]),
        praca_upkeep_by_owner: owner_map(&inp["pracaUp"], num),
        ..EconomyTickResult::default()
    };
    let mut ef = EmpireFoodTickResult {
        per_owner: arr(b, "ef")
            .iter()
            .map(|o| EmpireFoodTick {
                owner_id: o["ownerId"].as_i64().unwrap(),
                per_city_rows: arr(o, "rows")
                    .iter()
                    .map(|r| EmpireFoodCityRow {
                        city_id: text(&r["cityId"]),
                        name: r["name"].as_str().unwrap_or("").to_string(),
                        produkcja: opt_num(&r["produkcja"]).unwrap_or(0.0),
                        koszt_racji: opt_num(&r["kosztRacji"]).unwrap_or(0.0),
                        bilans: opt_num(&r["bilans"]).unwrap_or(0.0),
                        wzrost_procent: opt_num(&r["wzrostProcent"]).unwrap_or(0.0),
                        nakarmione: r["nakarmione"].as_bool().unwrap_or(false),
                        breakdown: None,
                    })
                    .collect(),
                fed_by_city_id: str_map(&o["fed"], |v| v.as_bool().unwrap()),
                ..EmpireFoodTick::default()
            })
            .collect(),
    };

    // ---- 1. deficyt Zlota ----
    let humans: BTreeSet<i64> = inp["humans"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    let rows = &inp["gdRows"];
    let raw = RawGoldDeficitInput {
        ekonomia_miasta: Some(RawGoldDeficitRows {
            zloto_deficyt_stat_mult: row(&rows["zloto_deficyt_stat_mult"]),
            zloto_deficyt_karencja_tur: row(&rows["zloto_deficyt_karencja_tur"]),
            zloto_deficyt_hp_frac: row(&rows["zloto_deficyt_hp_frac"]),
        }),
        top: RawGoldDeficitRows::default(),
    };
    let diff = match difficulty.as_str() {
        "easy" => Difficulty::Easy,
        "hard" => Difficulty::Hard,
        _ => Difficulty::Normal,
    };
    let params = build_gold_deficit_params(&raw, diff);
    let gd = &p["gd"];
    chk_bits(
        &format!("{name} gd.stat"),
        params.zloto_deficyt_stat_mult,
        num(&gd["params"]["stat"]),
    )?;
    chk_bits(
        &format!("{name} gd.karencja"),
        params.zloto_deficyt_karencja_tur,
        num(&gd["params"]["karencja"]),
    )?;
    chk_bits(
        &format!("{name} gd.hp"),
        params.zloto_deficyt_hp_frac,
        num(&gd["params"]["hp"]),
    )?;
    let treasury: BTreeMap<i64, f64> = owner_map(&inp["treasury"], num);
    let owner_treasury = |o: i64| -> f64 {
        if humans.contains(&o) {
            treasury[&o]
        } else {
            treasury.get(&o).copied().unwrap_or(0.0)
        }
    };
    let units_db = civ_engine::data::units_combat::parse_units().expect("units");
    let unit_health_by_type = |t: &str| {
        civ_engine::domain::unit_health::unit_health(units_db.iter().find(|u| u.jednostka == t))
    };
    let mut states: BTreeMap<i64, GoldDeficitState> = owner_map(&inp["gdStates"], |v| {
        GoldDeficitState {
            tury_deficytu_zlota: v.as_u64().unwrap(),
        }
    });
    let mut runtime = GoldDeficitRuntime::new();
    let out = run_gold_deficit_step(
        &cities,
        &mut states,
        &mut runtime,
        &mut units,
        &mut siege,
        &mut besieger,
        &GoldDeficitStepInput {
            params: &params,
            human_owner_ids: &humans,
            owner_treasury: &owner_treasury,
            unit_health_by_type: &unit_health_by_type,
        },
    );
    let mut got_ids = out.owner_ids.clone();
    got_ids.sort_unstable();
    let mut want_ids: Vec<i64> = gd["ownerIds"]
        .as_array()
        .unwrap()
        .iter()
        .map(|v| v.as_i64().unwrap())
        .collect();
    want_ids.sort_unstable();
    chk!(got_ids == want_ids, "{name} gd owner ids {got_ids:?} vs {want_ids:?}");
    chk!(
        out.tick.per_owner.len() == arr(gd, "ticks").len(),
        "{name} gd liczba tickow"
    );
    for wt in arr(gd, "ticks") {
        let o = wt["ownerId"].as_i64().unwrap();
        let t = out
            .tick
            .by_owner
            .get(&o)
            .ok_or(format!("{name} gd brak ticku {o}"))?;
        chk_bits(&format!("{name} gd[{o}] skarbiec"), t.skarbiec, num(&wt["skarbiec"]))?;
        chk!(t.deficyt_zlota == wt["deficyt"].as_bool().unwrap(), "{name} gd[{o}] deficyt");
        chk!(
            t.tury_deficytu_zlota_po == wt["po"].as_u64().unwrap(),
            "{name} gd[{o}] po"
        );
        chk!(
            t.zloto_deficyt_atrycja_aktywna == wt["atrycja"].as_bool().unwrap(),
            "{name} gd[{o}] atrycja"
        );
    }
    let want_states: BTreeMap<i64, u64> = owner_map(&gd["states"], |v| v.as_u64().unwrap());
    let got_states: BTreeMap<i64, u64> = states
        .iter()
        .map(|(k, v)| (*k, v.tury_deficytu_zlota))
        .collect();
    chk!(got_states == want_states, "{name} gd stany {got_states:?} vs {want_states:?}");
    let mut got_d = out.destroyed_ids.clone();
    got_d.sort();
    let mut want_d = strings(&gd["destroyed"]);
    want_d.sort();
    chk!(got_d == want_d, "{name} gd zniszczone {got_d:?} vs {want_d:?}");
    chk!(
        out.player_damaged_count == gd["playerDamaged"].as_u64().unwrap() as usize,
        "{name} gd playerDamaged"
    );
    chk!(
        out.player_destroyed_count == gd["playerDestroyed"].as_u64().unwrap() as usize,
        "{name} gd playerDestroyed"
    );
    let want_units = arr(gd, "units");
    chk!(units.len() == want_units.len(), "{name} gd liczba jednostek");
    for (u, w) in units.iter().zip(want_units) {
        chk!(u.id == text(&w["id"]), "{name} gd jednostka id");
        chk_opt(&format!("{name} gd {} hp", u.id), u.hp, &w["hp"])?;
        chk_opt(&format!("{name} gd {} hpMax", u.id), u.hp_max, &w["hpMax"])?;
        chk!(
            u.oblega_city_id.as_deref() == w["oblega"].as_str(),
            "{name} gd {} oblega",
            u.id
        );
    }
    for (c, w) in siege.iter().zip(arr(gd, "siege")) {
        let l = format!("{name} gd siege {}", c.id);
        chk!(c.oblegane == w["oblegane"].as_bool().unwrap(), "{l} oblegane");
        chk!(c.oblegajacy_owner_id == w["oblOwner"].as_i64(), "{l} oblOwner");
        chk!(
            c.siege_capitulation_pending == w["cap"].as_bool().unwrap(),
            "{l} cap"
        );
        chk!(c.has_siege_machines == w["mach"].as_bool().unwrap(), "{l} mach");
        chk_opt(&format!("{l} garn"), c.garnizon, &w["garn"])?;
    }
    let want_besieger: BTreeMap<String, i64> = str_map(&gd["besieger"], |v| v.as_i64().unwrap());
    chk!(besieger == want_besieger, "{name} gd besieger");
    chk!(
        out.cleanup.ended_sieges == strings(&gd["ended"]),
        "{name} gd ended {:?} vs {:?}",
        out.cleanup.ended_sieges,
        strings(&gd["ended"])
    );
    chk!(
        out.cleanup.garnizon_synced == strings(&gd["garnSynced"]),
        "{name} gd garnSynced"
    );

    // ---- 2. wzrost po centrali ----
    let owner_civ: BTreeMap<i64, String> = owner_map(&inp["ownerCiv"], text);
    let happiness: BTreeMap<String, f64> = str_map(&inp["happiness"], num);
    let citizen: BTreeMap<String, f64> = str_map(&inp["citizen"], num);
    let growth_mult: BTreeMap<String, f64> = str_map(&inp["growthMult"], num);
    let mp_max: BTreeMap<i64, f64> = owner_map(&inp["mpMax"], num);
    let owner_era: BTreeMap<i64, f64> = owner_map(&inp["ownerEra"], num);
    let mut hooks = Hooks::default();
    let outcome = run_post_central_growth(
        &mut cities,
        &mut extras,
        &mut hunger,
        &mut tick,
        &mut ef,
        &PostGrowthInput {
            econ_params: &econ_params,
            difficulty: &difficulty,
            matrix,
            built_by_city: &built,
            owner_civ_by_owner_id: &owner_civ,
            happiness_by_city_id: &happiness,
            citizen_growth_pct_by_city_id: &citizen,
            growth_mult_map: &growth_mult,
            manpower_max_mult_by_owner_id: &mp_max,
            owner_era_by_owner: &owner_era,
            population_matrix_by_owner_id: None,
            exclude_hex_keys_by_city: None,
        },
        &mut hooks,
    );
    let g = &p["growth"];
    chk!(
        outcome.changed_city_ids == strings(&g["changed"]),
        "{name} wzrost changed {:?} vs {:?}",
        outcome.changed_city_ids,
        strings(&g["changed"])
    );
    chk!(hooks.changed == outcome.changed_city_ids, "{name} wzrost hooki");
    for (c, w) in cities.iter().zip(arr(g, "cities")) {
        let l = format!("{name} wzrost {}", c.id);
        chk!(c.id == text(&w["id"]), "{l} id");
        chk_bits(&format!("{l} pop"), c.population, num(&w["pop"]))?;
        chk_opt(&format!("{l} frac"), c.wzrost_ulamkowy, &w["frac"])?;
        chk_opt(&format!("{l} tbd"), c.tury_bez_doplaty, &w["tbd"])?;
        chk_opt(
            &format!("{l} hunger"),
            hunger.get(&c.id).copied().flatten(),
            &w["hunger"],
        )?;
        chk_opt(
            &format!("{l} mp"),
            extras.get(&c.id).and_then(|e| e.manpower),
            &w["mp"],
        )?;
    }
    for (t, w) in tick.per_city.iter().zip(arr(g, "ticks")) {
        let l = format!("{name} wzrost tick {}", t.city_id);
        chk!(t.city_id == text(&w["cityId"]), "{l} id");
        chk_bits(&format!("{l} ludnoscPo"), t.ludnosc_po, opt_num(&w["ludnoscPo"]).unwrap_or(f64::NAN))?;
        chk!(opt_bool_eq(t.wzrost, &w["wzrost"]), "{l} wzrost");
        chk!(opt_bool_eq(t.ubytek, &w["ubytek"]), "{l} ubytek");
        chk_opt(&format!("{l} wzrostProcent"), t.wzrost_procent, &w["wzrostProcent"])?;
        chk_opt(
            &format!("{l} wzrostUlamkowyPo"),
            t.wzrost_ulamkowy_po,
            &w["wzrostUlamkowyPo"],
        )?;
        chk_bits(
            &format!("{l} magazynPoTurze"),
            t.magazyn_po_turze,
            opt_num(&w["magazynPoTurze"]).unwrap_or(f64::NAN),
        )?;
    }
    chk_bits(&format!("{name} econ.growth"), tick.growth, num(&g["econGrowth"]))?;
    chk_bits(&format!("{name} econ.starved"), tick.starved, num(&g["econStarved"]))?;
    for (o, w) in ef.per_owner.iter().zip(arr(g, "ef")) {
        chk!(o.owner_id == w["ownerId"].as_i64().unwrap(), "{name} ef owner");
        for (r, wr) in o.per_city_rows.iter().zip(arr(w, "rows")) {
            let l = format!("{name} ef {}", r.city_id);
            chk!(r.name == wr["name"].as_str().unwrap_or(""), "{l} name");
            chk_bits(&format!("{l} wzrostProcent"), r.wzrost_procent, opt_num(&wr["wzrostProcent"]).unwrap_or(0.0))?;
            chk!(opt_bool_eq(r.nakarmione, &wr["nakarmione"]), "{l} nakarmione");
            match (&r.breakdown, wr["breakdown"].as_object()) {
                (Some(bd), Some(wb)) => {
                    for (got, key) in [
                        (bd.total, "total"),
                        (bd.racje, "racje"),
                        (bd.male_miasto, "maleMiasto"),
                        (bd.spichlerz, "spichlerz"),
                        (bd.zdrowie, "zdrowie"),
                        (bd.szczescie, "szczescie"),
                        (bd.cywilizacja, "cywilizacja"),
                        (bd.zaopatrzenie, "zaopatrzenie"),
                    ] {
                        chk_bits(&format!("{l} breakdown.{key}"), got, num(&wb[key]))?;
                    }
                }
                (None, None) => {}
                (g, w) => return Err(format!("{l} breakdown rust={g:?} web={w:?}")),
            }
        }
    }

    // ---- 3. upkeep Pracy ----
    let mut pools = PostPracaPools {
        player_praca_pool: num(&inp["pools"]["player"]),
        ai_praca_pool_by_owner: owner_map(&inp["pools"]["ai"], num),
    };
    let pr = apply_praca_upkeep_post(
        &mut pools,
        &tick.praca_upkeep_by_owner,
        num(&inp["pools"]["rate0"]),
    );
    let wp = &p["praca"];
    chk_bits(&format!("{name} praca player"), pools.player_praca_pool, num(&wp["player"]))?;
    let want_ai: BTreeMap<i64, f64> = owner_map(&wp["ai"], num);
    chk!(
        pools.ai_praca_pool_by_owner.keys().eq(want_ai.keys()),
        "{name} praca ai klucze"
    );
    for (o, v) in &pools.ai_praca_pool_by_owner {
        chk_bits(&format!("{name} praca ai[{o}]"), *v, want_ai[o])?;
    }
    chk_bits(&format!("{name} praca lastUpkeep"), pr.last_praca_upkeep, num(&wp["lastUpkeep"]))?;
    chk_bits(&format!("{name} praca rate"), pr.last_praca_rate, num(&wp["rate"]))?;

    Ok([
        usize::from(out.tick.per_owner.iter().any(|t| t.zloto_deficyt_atrycja_aktywna)),
        out.destroyed_ids.len(),
        out.cleanup.ended_sieges.len(),
        outcome.changed_city_ids.len(),
        usize::from(tick.per_city.iter().any(|t| t.wzrost)),
        usize::from(pr.last_praca_upkeep > 0.0),
    ])
}

fn make_matrix(d: &Value) -> civ_engine::data::civilizations::CivMatrixFile {
    let mut matrix = load_civ_matrix().file.clone();
    for (civ, params) in d["matrixPatch"].as_object().unwrap() {
        let row = matrix
            .cywilizacje
            .iter_mut()
            .find(|c| &c.ikona_id == civ)
            .unwrap_or_else(|| panic!("brak cywilizacji {civ}"));
        for (k, v) in params.as_object().unwrap() {
            let n = v.as_f64().unwrap();
            let val = if n.fract() == 0.0 {
                Num::Int(n as i64)
            } else {
                Num::Float(n)
            };
            row.params.insert(k.clone(), val);
        }
    }
    matrix
}

#[test]
fn post_bank_steps_match_running_web() {
    let d: Value = serde_json::from_str(VECTORS).expect("post_0.json");
    let matrix = make_matrix(&d);
    let scenarios = arr(&d, "scenarios");
    assert!(scenarios.len() >= 340, "scenariuszy {}", scenarios.len());
    let mut sum = [0usize; 6];
    for s in scenarios {
        match run_scenario(&d, &matrix, s) {
            Ok(c) => {
                for (a, b) in sum.iter_mut().zip(c) {
                    *a += b;
                }
            }
            Err(e) => panic!("{e}"),
        }
    }
    // pokrycie: kazda galaz musi byc realnie uruchomiona
    assert!(sum[0] > 100, "atrycja deficytu {}", sum[0]);
    assert!(sum[1] > 50, "zniszczone {}", sum[1]);
    assert!(sum[2] > 10, "konce oblezen {}", sum[2]);
    assert!(sum[3] > 100, "zmiany populacji {}", sum[3]);
    assert!(sum[4] > 10, "wzrost {}", sum[4]);
    assert!(sum[5] > 100, "upkeep pracy {}", sum[5]);
}
