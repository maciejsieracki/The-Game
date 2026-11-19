//! R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6): zgodnosc adaptera stanu gry -> wejscia bitwy oblezniczej z TEKSTEM pinu.
//!
//! Wektory: `tests/p6_k5loop_adapter_vectors/vectors.json` z `tests/p6_k5loop_adapter_gen.mjs` (wykonuje tekst pinu
//! `07d2fbd72`: `collectSiegeAtkRoster`, `appendReadyMachinesToRoster`, `collectSiegeDefRoster`, `rosterToBattleUnits` +
//! `runtimeToBattleUnit`, helpery statystyk i metody sceny, `_applyStartingMoralePowerPenalty`, `toCombatUnit`,
//! `counterMultiplier`). Testy negatywne: brak definicji, brak wiersza Milicji, brak kontekstu wlasciciela, NaN/Inf.

use std::collections::{BTreeMap, BTreeSet};
use std::time::Instant;

use civ_engine::domain::battle_setup_units::Side;
use civ_engine::domain::civ_bonuses::{BonusValue, CivBonusEntry};
use civ_engine::domain::siege_battle_adapter::{
    collect_siege_rosters, stat_row_from_json, stat_rows_from_json, unit_def_index, AdapterError,
    CityDefOptions, MachineKind, MilitiaParams, OwnerRelations, RosterCity, RosterUnit,
    SiegeRosterInput, BATTLE_MAX_PER_SIDE,
};
use civ_engine::domain::siege_battle_adapter_playable::siege_inputs_from_playable;
use civ_engine::domain::siege_battle_adapter_unit::{
    apply_starting_morale_power_penalty, counter_matrix, doctrine_auto_for, norm_counters,
    roster_to_battle_units, spawn_fields, unit_blow_template, OwnerContext, RosterBattleCtx,
    SpawnEnv, SpawnSlot, StartingMoraleParams, UnitDefFallback,
};
use civ_engine::domain::siege_tactics_inputs_unit::{StatRow, ToCombatUnitOpts, UVal};
use civ_engine::{
    PlayableGame, PlayableUnit, PlayableUnitKind, PositionDto, StartGameParams, UnitId,
};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_adapter_vectors/vectors.json");
const TIME_GUARD_SECS: u64 = 90;

fn doc() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json")
}

fn f(v: &Value) -> f64 {
    match v {
        Value::Number(n) => n.as_f64().unwrap(),
        Value::String(s) if s == "Infinity" => f64::INFINITY,
        Value::String(s) if s == "-Infinity" => f64::NEG_INFINITY,
        Value::String(s) if s == "NaN" => f64::NAN,
        Value::String(s) => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
        other => panic!("nie liczba: {other}"),
    }
}

#[allow(clippy::cast_possible_truncation)]
fn i(v: &Value) -> i64 {
    let x = f(v);
    assert!(x.fract() == 0.0, "nie calkowita: {v}");
    x as i64
}

fn of(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(f(v))
    }
}

fn same(a: f64, b: f64) -> bool {
    a == b || (a.is_nan() && b.is_nan())
}

fn civ_entry(v: &Value) -> CivBonusEntry {
    let s = |k: &str| v.get(k).and_then(Value::as_str).map(str::to_owned);
    let wartosc = match &v["wartosc"] {
        Value::Object(o) => BonusValue::Number(f(&o["n"])),
        Value::String(t) => BonusValue::Text(t.clone()),
        Value::Array(a) => BonusValue::List(
            a.iter()
                .map(|x| x.as_str().unwrap_or("").to_owned())
                .collect(),
        ),
        other => panic!("wartosc {other}"),
    };
    CivBonusEntry {
        typ: s("typ").unwrap_or_default(),
        cel: s("cel").unwrap_or_default(),
        wartosc,
        opis: s("opis"),
        realizuje: s("realizuje"),
        matrix_param_id: s("matrixParamId"),
    }
}

struct Scenario {
    name: String,
    city: RosterCity,
    units: Vec<RosterUnit>,
    anchor: String,
    relations: OwnerRelations,
    def_opts: CityDefOptions,
    machines: Vec<MachineKind>,
    turn: f64,
    owners: BTreeMap<i64, OwnerContext>,
    crown: BTreeSet<String>,
    terrain: String,
    hunger: f64,
    deficit: f64,
}

fn scenario(v: &Value, civ: &Value) -> Scenario {
    let inp = &v["input"];
    let c = &inp["city"];
    let city_id = c["id"].as_str().unwrap().to_owned();
    let owner = i(&c["ownerId"]);
    let built: Vec<String> = inp["built"][&city_id]
        .as_array()
        .map(|a| a.iter().map(|x| x.as_str().unwrap().to_owned()).collect())
        .unwrap_or_default();
    let city = RosterCity {
        id: city_id,
        owner_id: owner,
        q: i(&c["q"]),
        r: i(&c["r"]),
        population: c.get("population").and_then(of),
        garnizon: c.get("garnizon").and_then(of),
        militia_regen_at_turn: c.get("militiaRegenAtTurn").and_then(of),
        ma_mur: c["maMur"].as_bool().unwrap(),
    };
    let units = inp["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| {
            let mut ru = RosterUnit::new(
                u["id"].as_str().unwrap(),
                i(&u["ownerId"]),
                u["typeId"].as_str().unwrap(),
                u["category"].as_str().unwrap(),
                i(&u["q"]),
                i(&u["r"]),
            );
            ru.is_general = u.get("isGeneral").and_then(Value::as_bool).unwrap_or(false);
            ru.hp = u.get("hp").and_then(of);
            ru.battles_survived = u.get("battlesSurvived").and_then(of);
            ru.parametry_bonus_proc = u.get("parametryBonusProc").and_then(of);
            ru.pancerz_bonus_proc = u.get("pancerzBonusProc").and_then(of);
            ru.fortified_in_field = u.get("__fort").and_then(Value::as_bool).unwrap_or(false);
            ru
        })
        .collect();
    let pairs = |k: &str| -> BTreeSet<(i64, i64)> {
        inp[k]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| {
                let (a, b) = (i(&p[0]), i(&p[1]));
                (a.min(b), a.max(b))
            })
            .collect()
    };
    let owners = inp["owners"]
        .as_object()
        .unwrap()
        .iter()
        .map(|(k, o)| {
            let key = o["civKey"].as_str().unwrap();
            (
                k.parse::<i64>().unwrap(),
                OwnerContext {
                    built_ids: o["built"]
                        .as_array()
                        .unwrap()
                        .iter()
                        .map(|x| x.as_str().unwrap().to_owned())
                        .collect(),
                    civ_bonusy: civ[key].as_array().unwrap().iter().map(civ_entry).collect(),
                    army_hungry: o["hungry"].as_bool().unwrap(),
                    gold_deficit: o["deficit"].as_bool().unwrap(),
                    difficulty_combat_mult: f(&o["diff"]),
                },
            )
        })
        .collect();
    let turn = f(&inp["turn"]);
    Scenario {
        name: v["name"].as_str().unwrap().to_owned(),
        def_opts: CityDefOptions {
            garrison_completed: built.iter().any(|b| b == "garnizon"),
            owner_era: inp["era"].get(owner.to_string()).and_then(of),
            current_turn: Some(turn),
        },
        machines: c["siegeMachines"]["ready"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| {
                if k == "taran" {
                    MachineKind::Taran
                } else {
                    MachineKind::Wieza
                }
            })
            .collect(),
        city,
        units,
        anchor: inp["anchorId"].as_str().unwrap().to_owned(),
        relations: OwnerRelations {
            wars: pairs("wars"),
            alliances: pairs("alliances"),
        },
        turn,
        owners,
        crown: inp["crownIds"]
            .as_array()
            .unwrap()
            .iter()
            .map(|x| x.as_str().unwrap().to_owned())
            .collect(),
        terrain: inp["terrain"].as_str().unwrap().to_owned(),
        hunger: f(&inp["hungerMult"]),
        deficit: f(&inp["deficitMult"]),
    }
}

fn err_name(e: &AdapterError) -> &'static str {
    match e {
        AdapterError::CityNotFound(_) => "CityNotFound",
        AdapterError::AnchorNotFound(_) => "AnchorNotFound",
        AdapterError::CityWithoutWall(_) => "CityWithoutWall",
        AdapterError::AttackerHasGeneral(_) => "AttackerHasGeneral",
        AdapterError::NoDefenders(_) => "NoDefenders",
        AdapterError::MissingUnitDef { .. } => "MissingUnitDef",
        AdapterError::MissingMilitiaRow { .. } => "MissingMilitiaRow",
        AdapterError::MissingOwnerContext { .. } => "MissingOwnerContext",
        AdapterError::NonFinite { .. } => "NonFinite",
    }
}

/// Liczniki pokrycia (nazwy jak w generatorze), liczone tu z wynikow Rust.
#[derive(Default, Debug)]
struct Cover {
    porownane_jednostki: usize,
    pola_spawnu: usize,
    pary_kontr: usize,
    milicja: usize,
    machiny: usize,
    korona: usize,
    bledy: usize,
}

#[test]
fn adapter_zgodny_z_tekstem_pinu() {
    let t0 = Instant::now();
    let d = doc();
    assert_eq!(d["pin"], "07d2fbd72f758705f8e1d59cc4968027ffbafe75");
    let rows = stat_rows_from_json(&d["units"]).expect("units");
    let index = unit_def_index(&rows);
    let counters = norm_counters(&d["counters"]);
    let counter_mult = f(&d["counterMultiplier"]);
    let militia = MilitiaParams::pin();
    let mut cover = Cover::default();
    let mut diffs: Vec<String> = Vec::new();
    for v in d["vectors"].as_array().unwrap() {
        let sc = scenario(v, &d["civBonusy"]);
        let exp = &v["expected"];
        let inp = SiegeRosterInput {
            city: &sc.city,
            anchor_id: &sc.anchor,
            units: &sc.units,
            relations: &sc.relations,
            def_opts: sc.def_opts.clone(),
            ready_machines: &sc.machines,
            turn: sc.turn,
            unit_rows: &rows,
            militia: &militia,
        };
        let res = collect_siege_rosters(&inp);
        if let Some(e) = exp.get("error") {
            cover.bledy += 1;
            match res {
                Err(got) => assert_eq!(err_name(&got), e.as_str().unwrap(), "{}", sc.name),
                Ok(_) => panic!("{}: oczekiwany blad {e}", sc.name),
            }
            continue;
        }
        let rs = res.unwrap_or_else(|e| panic!("{}: {e}", sc.name));
        let ids = |l: &[RosterUnit]| l.iter().map(|u| u.id.clone()).collect::<Vec<_>>();
        let exp_ids = |k: &str| {
            exp[k]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_str().unwrap().to_owned())
                .collect::<Vec<_>>()
        };
        assert_eq!(ids(&rs.atk), exp_ids("atkIds"), "{} atk", sc.name);
        assert_eq!(ids(&rs.def), exp_ids("defIds"), "{} def", sc.name);
        let exp_mil = exp["militiaDefs"].as_array().unwrap();
        assert_eq!(rs.militia_defs.len(), exp_mil.len(), "{} milicja", sc.name);
        for ((id, def), e) in rs.militia_defs.iter().zip(exp_mil) {
            assert_eq!(id, e["id"].as_str().unwrap());
            assert_eq!(
                def,
                &stat_row_from_json(&e["def"]).unwrap(),
                "{} milicja {id}",
                sc.name
            );
        }
        cover.milicja += rs.militia_defs.len();
        cover.machiny += rs
            .atk
            .iter()
            .filter(|u| u.id.starts_with("siege-mach-"))
            .count();
        let ctx = RosterBattleCtx {
            rows: &rows,
            index: &index,
            militia_defs: &rs.militia_defs,
            owners: &sc.owners,
            fallback: UnitDefFallback::PinRecord,
        };
        let cap = |l: Vec<RosterUnit>| l.into_iter().take(BATTLE_MAX_PER_SIDE).collect::<Vec<_>>();
        let atk = roster_to_battle_units(&cap(rs.atk.clone()), Side::Atk, &ctx).expect("atk");
        let def = roster_to_battle_units(&cap(rs.def.clone()), Side::Def, &ctx).expect("def");
        let env = SpawnEnv {
            terrain: sc.terrain.clone(),
            shallow_sea: false,
            crown_range_delta: f(&exp["crownRangeDelta"]),
        };
        let mut atk_f: Vec<_> = atk
            .iter()
            .map(|bu| spawn_fields(bu, SpawnSlot::Attacker, &env).unwrap())
            .collect();
        let mut def_f: Vec<_> = def
            .iter()
            .map(|bu| {
                let slot = if sc.crown.contains(&bu.id) {
                    SpawnSlot::DefenderCrown
                } else {
                    SpawnSlot::DefenderInner
                };
                spawn_fields(bu, slot, &env).unwrap()
            })
            .collect();
        cover.korona += def_f.iter().filter(|s| s.on_wall_walkway).count();
        for (side, units, fields, key) in
            [("atk", &atk, &atk_f, "atk"), ("def", &def, &def_f, "def")]
        {
            let eu = exp[key].as_array().unwrap();
            let es = exp["spawn"][key].as_array().unwrap();
            assert_eq!(units.len(), eu.len(), "{} {side} liczba", sc.name);
            for ((bu, sf), (e, s)) in units.iter().zip(fields.iter()).zip(eu.iter().zip(es)) {
                cover.porownane_jednostki += 1;
                let tag = format!("{} {side} {}", sc.name, bu.id);
                let mut chk = |what: &str, got: f64, want: &Value| {
                    if !same(got, f(want)) {
                        diffs.push(format!("{tag} {what}: rust {got} pin {want}"));
                    }
                };
                chk("hp", bu.hp, &e["hp"]);
                chk("maxHp", bu.max_hp, &e["maxHp"]);
                chk("pancerz", bu.pancerz_bonus_frac, &e["pancerzBonusFrac"]);
                chk(
                    "parametry",
                    bu.parametry_bonus_frac,
                    &e["parametryBonusFrac"],
                );
                chk("weteran", bu.veteran_bonus_frac, &e["veteranBonusFrac"]);
                chk(
                    "leaderMorale",
                    bu.army_leader_morale_bonus_frac,
                    &e["armyLeaderMoraleBonusFrac"],
                );
                chk(
                    "diff",
                    bu.difficulty_combat_mult,
                    &e["difficultyCombatMult"],
                );
                for (what, got, want) in [
                    ("moveLeft", sf.move_left, &s["moveLeft"]),
                    ("range", sf.range, &s["range"]),
                    ("rangeBase", sf.range_base, &s["rangeBase"]),
                    ("ammoLeft", sf.ammo_left, &s["ammoLeft"]),
                    ("ammoMax", sf.ammo_max, &s["ammoMax"]),
                    ("morale", sf.morale, &s["morale"]),
                    ("moraleMax", sf.morale_max, &s["moraleMax"]),
                    ("fleeMorale", sf.flee_morale, &s["fleeMorale"]),
                ] {
                    cover.pola_spawnu += 1;
                    if !same(got, f(want)) {
                        diffs.push(format!("{tag} {what}: rust {got} pin {want}"));
                    }
                }
                for (what, got, want) in [
                    ("ranged", sf.ranged, &s["ranged"]),
                    ("rangedBase", sf.ranged_base, &s["rangedBase"]),
                    ("primaryRanged", sf.primary_ranged, &s["primaryRanged"]),
                    ("mounted", sf.mounted, &s["mounted"]),
                    ("antiCavSpear", sf.anti_cav_spear, &s["antiCavSpear"]),
                    ("phalanx", sf.phalanx, &s["phalanx"]),
                    ("neverRout", sf.never_rout, &s["neverRout"]),
                    ("onWallWalkway", sf.on_wall_walkway, &s["onWallWalkway"]),
                    ("isCatapult", sf.is_catapult, &s["isCatapult"]),
                    (
                        "isArmyCommander",
                        bu.is_army_commander,
                        &e["isArmyCommander"],
                    ),
                    ("fortified", bu.fortified_in_field, &e["fortifiedInField"]),
                    ("armyHungry", bu.army_hungry, &e["armyHungry"]),
                    ("goldDeficit", bu.gold_deficit, &e["goldDeficit"]),
                    ("setupRanged", bu.setup_unit().ranged, &e["setupRanged"]),
                    ("braces", bu.braces_against_charge(), &e["braces"]),
                ] {
                    if Some(got) != want.as_bool() {
                        diffs.push(format!("{tag} {what}: rust {got} pin {want}"));
                    }
                }
                if bu.nazwa != e["nazwa"].as_str().unwrap()
                    || bu.kategoria != e["kategoria"].as_str().unwrap()
                {
                    diffs.push(format!(
                        "{tag} nazwa/kategoria: {} {}",
                        bu.nazwa, bu.kategoria
                    ));
                }
                if bu.stats != stat_row_from_json(&e["stats"]).unwrap() {
                    diffs.push(format!("{tag} stats"));
                }
            }
        }
        let opts = ToCombatUnitOpts {
            army_hunger_stat_mult: sc.hunger,
            skip_hunger: false,
            gold_deficit_stat_mult: sc.deficit,
            skip_gold_deficit: false,
        };
        let pen = apply_starting_morale_power_penalty(
            &atk,
            &def,
            &mut atk_f,
            &mut def_f,
            &opts,
            &StartingMoraleParams::pin(),
        );
        let ep = &exp["penalty"];
        for (what, got, want) in [
            ("mAtk", pen.m_atk, &ep["mAtk"]),
            ("mDef", pen.m_def, &ep["mDef"]),
            ("ratio", pen.ratio, &ep["ratio"]),
            ("frac", pen.frac, &ep["frac"]),
        ] {
            if !same(got, f(want)) {
                diffs.push(format!("{} kara {what}: rust {got} pin {want}", sc.name));
            }
        }
        let weaker = match pen.weaker {
            None => Value::Null,
            Some(Side::Atk) => Value::from("atk"),
            Some(Side::Def) => Value::from("def"),
        };
        assert_eq!(weaker, ep["weaker"], "{} slabsza strona", sc.name);
        for (fields, key) in [(&atk_f, "atk"), (&def_f, "def")] {
            for (sf, e) in fields.iter().zip(exp[key].as_array().unwrap()) {
                if !same(sf.morale, f(&e["moraleAfterPenalty"])) {
                    diffs.push(format!(
                        "{} {key} {} morale po karze: rust {} pin {}",
                        sc.name, e["id"], sf.morale, e["moraleAfterPenalty"]
                    ));
                }
            }
        }
        let ta: Vec<_> = atk.iter().map(|b| unit_blow_template(b, &opts)).collect();
        let td: Vec<_> = def.iter().map(|b| unit_blow_template(b, &opts)).collect();
        for (t, e) in ta.iter().chain(td.iter()).zip(
            exp["atk"]
                .as_array()
                .unwrap()
                .iter()
                .chain(exp["def"].as_array().unwrap()),
        ) {
            let c = &e["cu"];
            let cu = &t.cu;
            for (what, got, want) in [
                ("meleeAttack", cu.melee_attack, &c["meleeAttack"]),
                ("meleeDefence", cu.melee_defence, &c["meleeDefence"]),
                ("weaponDamage", cu.weapon_damage, &c["weaponDamage"]),
                ("armor", cu.armor, &c["armor"]),
                ("piercing", cu.piercing, &c["piercing"]),
                ("chargeBonus", cu.charge_bonus, &c["chargeBonus"]),
                ("health", cu.health, &c["health"]),
                ("missileAttack", cu.missile_attack, &c["missileAttack"]),
                ("karaFlanka", cu.kara_flanka, &c["karaFlanka"]),
                ("karaTyl", cu.kara_tyl, &c["karaTyl"]),
            ] {
                if !same(got, f(want)) {
                    diffs.push(format!(
                        "{} cu {} {what}: rust {got} pin {want}",
                        sc.name, e["id"]
                    ));
                }
            }
            if cu.counter_typ != c["counterTyp"].as_str().unwrap()
                || cu.rola != c["rola"].as_str().unwrap()
            {
                diffs.push(format!("{} cu {} typ/rola", sc.name, e["id"]));
            }
        }
        for (m, key) in [
            (
                counter_matrix(&ta, &td, &counters, counter_mult),
                "countersAtkDef",
            ),
            (
                counter_matrix(&td, &ta, &counters, counter_mult),
                "countersDefAtk",
            ),
        ] {
            let em = exp[key].as_array().unwrap();
            for (row, er) in m.iter().zip(em) {
                for (x, ex) in row.iter().zip(er.as_array().unwrap()) {
                    cover.pary_kontr += 1;
                    if !same(*x, f(ex)) {
                        diffs.push(format!("{} {key}: rust {x} pin {ex}", sc.name));
                    }
                }
            }
        }
    }
    assert!(
        diffs.is_empty(),
        "{} roznic:\n{}",
        diffs.len(),
        diffs.join("\n")
    );
    // Pokrycie: wartosci z generatora (tekst pinu) i liczone tu z wynikow Rust.
    let c = &d["coverage"];
    assert_eq!(c["scenariusze"].as_u64(), Some(9));
    assert_eq!(c["bledy"].as_u64().unwrap() as usize, cover.bledy);
    assert_eq!(c["milicja"].as_u64().unwrap() as usize, cover.milicja);
    assert_eq!(c["machiny"].as_u64().unwrap() as usize, cover.machiny);
    assert_eq!(c["korona"].as_u64().unwrap() as usize, cover.korona);
    for k in [
        "katapulta_korona",
        "jazda",
        "strzelcy",
        "sojusznik_atk",
        "sojusznik_def",
        "kara_atk",
        "kara_def",
        "weteran",
        "general_obroncy",
    ] {
        assert!(c[k].as_u64().unwrap() >= 1, "pokrycie {k} = 0");
    }
    assert!(cover.porownane_jednostki >= 40, "{cover:?}");
    assert!(cover.pary_kontr >= 100, "{cover:?}");
    assert!(
        t0.elapsed().as_secs() < TIME_GUARD_SECS,
        "straznik czasu {TIME_GUARD_SECS} s"
    );
}

fn small_rows() -> Vec<StatRow> {
    stat_rows_from_json(&doc()["units"]).unwrap()
}

fn base_input_parts() -> (RosterCity, Vec<RosterUnit>, OwnerRelations) {
    let city = RosterCity {
        id: "c".into(),
        owner_id: 1,
        q: 0,
        r: 0,
        population: Some(2.0),
        garnizon: None,
        militia_regen_at_turn: None,
        ma_mur: true,
    };
    let units = vec![
        RosterUnit::new("a", 0, "Wojownik", "miecznik", 1, 0),
        RosterUnit::new("d", 1, "Wojownik", "miecznik", 0, 0),
    ];
    let mut rel = OwnerRelations::default();
    rel.wars.insert((0, 1));
    (city, units, rel)
}

fn owners() -> BTreeMap<i64, OwnerContext> {
    [0, 1]
        .into_iter()
        .map(|o| {
            (
                o,
                OwnerContext {
                    built_ids: vec![],
                    civ_bonusy: vec![],
                    army_hungry: false,
                    gold_deficit: false,
                    difficulty_combat_mult: 1.0,
                },
            )
        })
        .collect()
}

#[test]
fn brak_definicji_jednostki_to_blad() {
    let rows = small_rows();
    let index = unit_def_index(&rows);
    let u = RosterUnit::new("x", 0, "Nieistniejacy", "miecznik", 0, 0);
    let ow = owners();
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::Error,
    };
    let e = roster_to_battle_units(&[u], Side::Atk, &ctx).unwrap_err();
    assert_eq!(
        e,
        AdapterError::MissingUnitDef {
            unit_id: "x".into(),
            type_id: "Nieistniejacy".into()
        }
    );
}

#[test]
fn rekord_zastepczy_pinu_dla_typu_spoza_units_json() {
    let rows = small_rows();
    let index = unit_def_index(&rows);
    let ow = owners();
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::PinRecord,
    };
    let bu = roster_to_battle_units(
        &[RosterUnit::new("r", 1, "Robotnik", "robotnik", 0, 0)],
        Side::Def,
        &ctx,
    )
    .unwrap();
    assert_eq!(bu[0].max_hp, 30.0);
    assert_eq!(bu[0].stats.get("meleeAttack"), Some(&UVal::Num(5.0)));
    assert_eq!(
        bu[0].stats.get("Jednostka"),
        Some(&UVal::Str("Robotnik".into()))
    );
}

#[test]
fn brak_kontekstu_wlasciciela_to_blad() {
    let rows = small_rows();
    let index = unit_def_index(&rows);
    let u = RosterUnit::new("x", 7, "Wojownik", "miecznik", 0, 0);
    let ow = owners();
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::Error,
    };
    assert_eq!(
        roster_to_battle_units(&[u], Side::Atk, &ctx).unwrap_err(),
        AdapterError::MissingOwnerContext { owner_id: 7 }
    );
}

#[test]
fn brak_wiersza_milicji_to_blad() {
    let (city, units, rel) = base_input_parts();
    let rows: Vec<StatRow> = small_rows()
        .into_iter()
        .filter(|r| !matches!(r.get("Jednostka"), Some(UVal::Str(s)) if s == "Wojownik" || s == "Oszczepnik"))
        .collect();
    let militia = MilitiaParams::pin();
    let inp = SiegeRosterInput {
        city: &city,
        anchor_id: "a",
        units: &units,
        relations: &rel,
        def_opts: CityDefOptions {
            garrison_completed: true,
            owner_era: Some(1.0),
            current_turn: Some(1.0),
        },
        ready_machines: &[],
        turn: 1.0,
        unit_rows: &rows,
        militia: &militia,
    };
    assert_eq!(
        collect_siege_rosters(&inp).unwrap_err(),
        AdapterError::MissingMilitiaRow {
            name: "Wojownik".into()
        }
    );
}

#[test]
fn nan_i_inf_w_danych_to_blad() {
    let rows = small_rows();
    let index = unit_def_index(&rows);
    let ow = owners();
    // NaN w statystyce definicji (wiersz milicji z NaN).
    let mut bad = rows[0].clone();
    bad.insert("meleeAttack".into(), UVal::Num(f64::NAN));
    let mil = vec![("m".to_owned(), bad)];
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &mil,
        owners: &ow,
        fallback: UnitDefFallback::Error,
    };
    let u = RosterUnit::new("m", 1, "Wojownik", "domyslny", 0, 0);
    assert!(
        matches!(roster_to_battle_units(&[u], Side::Def, &ctx), Err(AdapterError::NonFinite { what }) if what.contains("meleeAttack"))
    );
    // HP i postep.
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::Error,
    };
    for (hp, bs, pp) in [
        (Some(f64::NAN), None, None),
        (Some(f64::INFINITY), None, None),
        (None, Some(f64::NAN), None),
        (None, None, Some(f64::NEG_INFINITY)),
    ] {
        let mut u = RosterUnit::new("u", 0, "Wojownik", "miecznik", 0, 0);
        u.hp = hp;
        u.battles_survived = bs;
        u.parametry_bonus_proc = pp;
        assert!(matches!(
            roster_to_battle_units(&[u], Side::Atk, &ctx),
            Err(AdapterError::NonFinite { .. })
        ));
    }
    // Trudnosc wlasciciela.
    let mut ow2 = owners();
    ow2.get_mut(&0).unwrap().difficulty_combat_mult = f64::NAN;
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow2,
        fallback: UnitDefFallback::Error,
    };
    assert!(matches!(
        roster_to_battle_units(
            &[RosterUnit::new("u", 0, "Wojownik", "miecznik", 0, 0)],
            Side::Atk,
            &ctx
        ),
        Err(AdapterError::NonFinite { .. })
    ));
    // Populacja miasta i delta zasiegu korony.
    let (mut city, units, rel) = base_input_parts();
    city.population = Some(f64::INFINITY);
    let militia = MilitiaParams::pin();
    let inp = SiegeRosterInput {
        city: &city,
        anchor_id: "a",
        units: &units,
        relations: &rel,
        def_opts: CityDefOptions::default(),
        ready_machines: &[],
        turn: 1.0,
        unit_rows: &rows,
        militia: &militia,
    };
    assert!(
        matches!(collect_siege_rosters(&inp), Err(AdapterError::NonFinite { what }) if what == "city.population")
    );
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::Error,
    };
    let bu = roster_to_battle_units(
        &[RosterUnit::new("u", 0, "Wojownik", "miecznik", 0, 0)],
        Side::Atk,
        &ctx,
    )
    .unwrap();
    let env = SpawnEnv {
        terrain: "Rownina".into(),
        shallow_sea: false,
        crown_range_delta: f64::NAN,
    };
    assert!(matches!(
        spawn_fields(&bu[0], SpawnSlot::Attacker, &env),
        Err(AdapterError::NonFinite { .. })
    ));
}

#[test]
fn js_log10_zgodny_z_v8() {
    use civ_engine::domain::siege_battle_adapter_unit::js_log10;
    let v: Value =
        serde_json::from_str(include_str!("p6_k5loop_adapter_vectors/log10.json")).unwrap();
    let mut n = 0;
    for p in v.as_array().unwrap() {
        let x = f(&p[0]);
        let want = f(&p[1]);
        let got = js_log10(x);
        assert!(
            same(got, want) && got.to_bits() == want.to_bits() || (got == 0.0 && want == 0.0),
            "log10({x}) rust {got} v8 {want}"
        );
        n += 1;
    }
    assert!(n >= 4000);
}

/// `collectAtkRosterNearCity` bez `allowedOwnerIds` (`battleRoster.ts:62-90`): kotwica przenoszona na poczatek,
/// promien 1 heksa od miasta, cywil tylko jako kotwica.
#[test]
fn roster_atakujacego_bez_listy_wlascicieli() {
    use civ_engine::domain::siege_battle_adapter::collect_atk_roster_near_city;
    let anchor = RosterUnit::new("k", 0, "Wojownik", "miecznik", 1, 0);
    let all = vec![
        RosterUnit::new("b", 0, "Wojownik", "miecznik", 0, 1),
        RosterUnit::new("far", 0, "Wojownik", "miecznik", 2, 0),
        RosterUnit::new("civ", 0, "Osadnik", "osadnik", 0, 0),
        anchor.clone(),
        RosterUnit::new("x", 1, "Wojownik", "miecznik", 0, 0),
    ];
    let r = collect_atk_roster_near_city((0, 0), &anchor, &all, None);
    assert_eq!(
        r.iter().map(|u| u.id.as_str()).collect::<Vec<_>>(),
        vec!["k", "b"]
    );
}

/// Katapulta na koronie: `Math.max(_attackRangeFor(bu), 6)` (`battleScene.ts:4706`) takze przy zasiegu bazowym < 6;
/// `ammoCount` = `Math.floor` (`:1447`).
#[test]
fn katapulta_korony_i_amunicja_ulamkowa() {
    let rows = vec![stat_row_from_json(&serde_json::json!({
        "Jednostka": "Katapulta lekka", "Typ": "Siege", "missileAttack": 3, "Zasieg ataku (hex)": 3,
        "Ilosc pociskow": 2.7, "health": 50, "Morale bazowe": 100
    }))
    .unwrap()];
    let index = unit_def_index(&rows);
    let ow = owners();
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::Error,
    };
    let bu = roster_to_battle_units(
        &[RosterUnit::new(
            "c",
            1,
            "Katapulta lekka",
            "obleznicza",
            0,
            0,
        )],
        Side::Def,
        &ctx,
    )
    .unwrap();
    let env = SpawnEnv {
        terrain: "Rownina".into(),
        shallow_sea: false,
        crown_range_delta: 0.0,
    };
    let s = spawn_fields(&bu[0], SpawnSlot::DefenderCrown, &env).unwrap();
    assert!(s.is_catapult);
    assert_eq!((s.range, s.range_base, s.ranged), (6.0, 6.0, true));
    assert_eq!(s.ammo_left, 2.0);
    let inner = spawn_fields(&bu[0], SpawnSlot::DefenderInner, &env).unwrap();
    assert_eq!(inner.range, 3.0);
}

/// `counterMultiplier` (`combat.ts:553-577`): tylko wiersze `Atak` + `potwierdzone`; nieczytelny `Bonus` = `COUNTER_MULT`.
#[test]
fn macierz_kontr_reguly_pinu() {
    use civ_engine::domain::siege_battle_adapter_unit::counter_multiplier_pin;
    let rows = norm_counters(&serde_json::json!([
        {"Typ atakujący": "Spearman", "Cel (typ)": "Mount", "Bonus": "+20%", "Rodzaj (Atak/Obrona)": "Obrona", "Status": "potwierdzone"},
        {"Typ atakujący": "Spearman", "Cel (typ)": "Mount", "Bonus": "+50%", "Rodzaj (Atak/Obrona)": "Atak", "Status": "potwierdzone"},
        {"Typ atakujący": "Mount", "Cel (typ)": "Distance / Slinger", "Bonus": "", "Rodzaj (Atak/Obrona)": "Atak", "Status": "potwierdzone"},
        {"Typ atakujący": "Swordsman", "Cel (typ)": "Spearman", "Bonus": "+30%", "Rodzaj (Atak/Obrona)": "Atak", "Status": "do weryfikacji"}
    ]));
    assert_eq!(counter_multiplier_pin("Spearman", "Mount", &rows, 1.5), 1.5);
    assert_eq!(counter_multiplier_pin("Mount", "Slinger", &rows, 1.5), 1.5);
    assert_eq!(
        counter_multiplier_pin("Mount", "Slinger", &rows, 1.25),
        1.25
    );
    assert_eq!(
        counter_multiplier_pin("Swordsman", "Spearman", &rows, 1.5),
        1.0
    );
}

#[test]
fn doktryna_auto_ze_stanu_ciala() {
    use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
    let empty = BTreeMap::new();
    assert!(doctrine_auto_for(None, None, &empty));
    assert!(!doctrine_auto_for(
        Some(GroupDoctrine::Manual),
        None,
        &empty
    ));
    let mut meta = BTreeMap::new();
    meta.insert("g".to_owned(), (GroupDoctrine::Steady, false));
    assert!(!doctrine_auto_for(None, Some("g"), &meta));
    meta.insert("g".to_owned(), (GroupDoctrine::Steady, true));
    assert!(doctrine_auto_for(None, Some("g"), &meta));
    assert!(doctrine_auto_for(None, Some(""), &meta));
}

#[test]
fn stan_gry_mapowany_na_wejscia_rosterow() {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("start")
        .state()
        .clone();
    let city = st.cities[0].clone();
    let cid = city.id.get();
    // Bez muru: szturm odrzucony.
    let inp = siege_inputs_from_playable(&st, cid, Some(1.0)).unwrap();
    assert!(!inp.city.ma_mur);
    assert_eq!(inp.city.population, Some(f64::from(city.population)));
    assert_eq!(
        (inp.city.q, inp.city.r),
        (i64::from(city.position.x()), i64::from(city.position.y()))
    );
    assert_eq!(inp.units.len(), st.units.len());
    // Mur + Garnizon + machiny.
    st.stores
        .buildings_by_city
        .insert(cid, vec!["palisada".into(), "garnizon".into()]);
    st.siege_machines_ready.insert(
        city.id,
        vec![civ_engine::domain::playable::PlayableSiegeMachineKind::Wieza],
    );
    let enemy = civ_engine::PlayerId::new(city.owner_id.get() + 100);
    st.units.push(PlayableUnit {
        id: UnitId::new(999),
        owner_id: enemy,
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(city.position.x() + 1, city.position.y()),
        movement: 1u8.into(),
        movement_max: 1u8.into(),
        selected: false,
    });
    let inp = siege_inputs_from_playable(&st, cid, Some(2.0)).unwrap();
    assert!(inp.city.ma_mur);
    assert!(inp.def_opts.garrison_completed);
    assert_eq!(inp.def_opts.owner_era, Some(2.0));
    assert_eq!(inp.ready_machines, vec![MachineKind::Wieza]);
    let a = inp.units.iter().find(|u| u.id == "999").expect("kotwica");
    assert_eq!(a.type_id, "Wojownik");
    assert_eq!(
        siege_inputs_from_playable(&st, 987_654, None).unwrap_err(),
        AdapterError::CityNotFound("987654".into())
    );
    // Bez wojny: `siegeBattleSideOwners` daje puste strony; pin i tak sklada roster kotwicy (+ machiny) i Milicje z
    // Garnizonu (`collectCityDefRoster` dokleja ja niezaleznie od `allowedOwnerIds`). Ten sam wynik w porcie.
    let rows = small_rows();
    let militia = MilitiaParams::pin();
    let r = collect_siege_rosters(&SiegeRosterInput {
        city: &inp.city,
        anchor_id: "999",
        units: &inp.units,
        relations: &inp.relations,
        def_opts: inp.def_opts.clone(),
        ready_machines: &inp.ready_machines,
        turn: inp.turn,
        unit_rows: &rows,
        militia: &militia,
    })
    .unwrap();
    assert!(r.attacker_owners.is_empty() && r.defender_owners.is_empty());
    assert_eq!(
        r.atk.iter().map(|u| u.id.as_str()).collect::<Vec<_>>(),
        vec!["999", &format!("siege-mach-{cid}-{}-0", st.turn)]
    );
    assert!(r.def.iter().all(|u| u.militia.is_some()));
}
