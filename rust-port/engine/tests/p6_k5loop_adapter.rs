//! R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6): zgodnosc adaptera stanu gry -> wejscia bitwy oblezniczej z TEKSTEM pinu.
//!
//! Wektory: `tests/p6_k5loop_adapter_vectors/vectors.json` z `tests/p6_k5loop_adapter_gen.mjs` (wykonuje tekst pinu
//! `07d2fbd72`: `collectSiegeAtkRoster`, `appendReadyMachinesToRoster`, `collectSiegeDefRoster`, `rosterToBattleUnits` +
//! `runtimeToBattleUnit`, helpery statystyk i metody sceny, `_applyStartingMoralePowerPenalty`, `toCombatUnit`,
//! `counterMultiplier`). Testy negatywne: brak definicji, brak wiersza Milicji, brak kontekstu wlasciciela, NaN/Inf.

use std::collections::{BTreeMap, BTreeSet};
use std::time::Instant;

use civ_engine::domain::battle_setup::{carve_wall_tiles, SiegeLayout, BF_COLS, BF_ROWS};
use civ_engine::domain::battle_setup_terrain::BattleTerrainMap;
use civ_engine::domain::battle_setup_units::Side;
use civ_engine::domain::city_towers::{TowerMaterial, UnitRow};
use civ_engine::domain::civ_bonuses::{BonusValue, CivBonusEntry};
use civ_engine::domain::siege_battle_adapter::{
    cap_side, collect_siege_rosters, stat_row_from_json, stat_rows_from_json, unit_def_index,
    AdapterError, CityDefOptions, MachineKind, MilitiaParams, OwnerRelations, RosterCity,
    RosterUnit, SiegeRosterInput, BATTLE_MAX_PER_SIDE,
};
use civ_engine::domain::siege_battle_adapter_body::{
    activate_unit_for, apply_terrain_range, body_unit_inputs, clamp_era, install_body_inputs,
    scene_inputs, tower_setup_for, TerrainRangeUnit, TowerParams, TowerSetupInput, UnitPlacement,
};
use civ_engine::domain::siege_battle_adapter_playable::siege_inputs_from_playable;
use civ_engine::domain::siege_battle_adapter_unit::{
    apply_starting_morale_power_penalty, counter_matrix, doctrine_auto_for, norm_counters,
    roster_to_battle_units, spawn_fields, unit_blow_template, OwnerContext, RosterBattleCtx,
    SpawnEnv, SpawnSlot, StartingMoraleParams, UnitDefFallback,
};
use civ_engine::domain::siege_city_fortification::CityFortificationKind;
use civ_engine::domain::siege_tactics_atk_b::{siege_structure_damage, GATE_MAX_HP};
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
    built: Vec<String>,
    def_civ: Option<String>,
    era: Value,
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
        def_civ: inp.get("defCiv").and_then(Value::as_str).map(str::to_owned),
        era: inp["era"].clone(),
        built,
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
        AdapterError::InvalidGate { .. } => "InvalidGate",
        AdapterError::InvariantViolated { .. } => "InvariantViolated",
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
    wejscia_ciala: usize,
    wiezyczki: usize,
    strzelec_wiezy: usize,
    machina_zasieg_6: usize,
    taran: usize,
    wieza_obl: usize,
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
    let unit_rows: Vec<UnitRow> = d["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| serde_json::from_value(u.clone()).unwrap())
        .collect();
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
        // Wejscia ciala (czesc 3): statystyki machin, zasieg machiny, punkty ruchu, klasy, `canShoot`.
        for (units, fields, key) in [(&atk, &atk_f, "atk"), (&def, &def_f, "def")] {
            for ((bu, sf), eb) in units
                .iter()
                .zip(fields.iter())
                .zip(exp["body"][key].as_array().unwrap())
            {
                let b = body_unit_inputs(bu, sf, &sc.terrain, false)
                    .unwrap_or_else(|e| panic!("{} {}: {e}", sc.name, bu.id));
                cover.wejscia_ciala += 1;
                let tag = format!("{} {key} {} cialo", sc.name, bu.id);
                for (what, got, want) in [
                    ("wallAttack", b.siege_stats.wall_attack, &eb["wallAttack"]),
                    (
                        "missileAttack",
                        b.siege_stats.missile_attack,
                        &eb["missileAttack"],
                    ),
                    ("impact", b.siege_stats.impact, &eb["impact"]),
                    (
                        "weaponDamage",
                        b.siege_stats.weapon_damage,
                        &eb["weaponDamage"],
                    ),
                    (
                        "structDmg",
                        siege_structure_damage(&b.siege_stats),
                        &eb["structDmg"],
                    ),
                    (
                        "siegeMachineRange",
                        b.siege_machine_range,
                        &eb["siegeMachineRange"],
                    ),
                    ("movePointsFor", b.move_points, &eb["movePointsFor"]),
                ] {
                    if !same(got, f(want)) {
                        diffs.push(format!("{tag} {what}: rust {got} pin {want}"));
                    }
                }
                for (what, got, want) in [
                    ("canShoot", b.can_shoot, &eb["canShoot"]),
                    ("isSiegeUnit", b.is_siege_unit, &eb["isSiegeUnit"]),
                    ("isSiegeTower", b.is_siege_tower, &eb["isSiegeTower"]),
                    ("isRam", b.is_ram, &eb["isRam"]),
                ] {
                    if Some(got) != want.as_bool() {
                        diffs.push(format!("{tag} {what}: rust {got} pin {want}"));
                    }
                }
                if b.is_catapult && b.siege_machine_range == 6.0 && key == "def" {
                    cover.machina_zasieg_6 += 1;
                }
                cover.taran += usize::from(b.is_ram);
                cover.wieza_obl += usize::from(b.is_siege_tower);
            }
        }
        // Wiezyczki (`_placeSiegeTowers`) na ukladzie muru T5a (`carve_wall_tiles`).
        let layout = pin_layout();
        let def_owner = rs.def[0].owner_id;
        let tw = tower_setup_for(
            &layout,
            &TowerSetupInput {
                built_building_ids: &sc.built,
                defender_era: sc.era.get(def_owner.to_string()).and_then(of),
                def_civ: sc.def_civ.as_deref(),
                units: &unit_rows,
                params: TowerParams::pin(),
            },
        );
        let et = &exp["towers"];
        let fk = match tw.fort_kind {
            CityFortificationKind::Mur => "mur",
            CityFortificationKind::Palisada => "palisada",
            CityFortificationKind::None => "none",
        };
        assert_eq!(fk, et["fortKind"].as_str().unwrap(), "{} fortKind", sc.name);
        let mat = tw.material.map(|m| match m {
            TowerMaterial::Drewno => "drewno",
            TowerMaterial::Kamien => "kamien",
        });
        assert_eq!(mat, et["material"].as_str(), "{} material", sc.name);
        let rows_exp: Vec<i64> = et["rows"].as_array().unwrap().iter().map(i).collect();
        assert_eq!(tw.rows, rows_exp, "{} wiersze wiezyczek", sc.name);
        assert!(
            same(tw.tower_range, f(&et["towerRange"])),
            "{} towerRange",
            sc.name
        );
        match et["shooterNazwa"].as_str() {
            Some(n) => {
                assert!(tw.tower_shot.is_some(), "{} strzelec", sc.name);
                assert_eq!(tw.shooter_nazwa, n, "{} nazwa strzelca", sc.name);
                cover.strzelec_wiezy += 1;
            }
            None => assert!(tw.tower_shot.is_none(), "{} brak strzelca", sc.name),
        }
        cover.wiezyczki += tw.rows.len();
        let scene = scene_inputs(&layout, tw).expect("scena");
        assert_eq!(scene.gate_hp, GATE_MAX_HP);
        assert_eq!(scene.siege_towers().len(), scene.towers.rows.len());
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
    assert_eq!(c["scenariusze"].as_u64(), Some(11));
    for (k, got) in [
        ("wiezyczki", cover.wiezyczki),
        ("strzelec_wiezy", cover.strzelec_wiezy),
        ("machina_zasieg_6", cover.machina_zasieg_6),
        ("taran", cover.taran),
        ("wieza_obl", cover.wieza_obl),
    ] {
        assert_eq!(c[k].as_u64().unwrap() as usize, got, "pokrycie {k}");
        assert!(got >= 1, "pokrycie {k} = 0");
    }
    assert!(cover.wejscia_ciala >= 40, "{cover:?}");
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

/// Uklad muru pinu (`_carveWallTiles`, port T5a) na pustej mapie.
fn pin_layout() -> SiegeLayout {
    let n = usize::try_from(BF_COLS * BF_ROWS).unwrap();
    let mut map = BattleTerrainMap::from_tiles(
        i32::try_from(BF_COLS).unwrap(),
        i32::try_from(BF_ROWS).unwrap(),
        vec![0; n],
        false,
    )
    .unwrap();
    carve_wall_tiles(&mut map)
}

/// Jednostki obu stron (taran atakujacego, lucznik i katapulta spoza `units.json` na koronie) z danymi pinu.
fn body_fixture() -> (
    Vec<civ_engine::domain::siege_battle_adapter_unit::AdapterBattleUnit>,
    Vec<civ_engine::domain::siege_battle_adapter_unit::SpawnFields>,
) {
    let d = doc();
    let rows = stat_rows_from_json(&d["units"]).unwrap();
    let index = unit_def_index(&rows);
    let ow = owners();
    let ctx = RosterBattleCtx {
        rows: &rows,
        index: &index,
        militia_defs: &[],
        owners: &ow,
        fallback: UnitDefFallback::PinRecord,
    };
    let atk = roster_to_battle_units(
        &[RosterUnit::new("t", 0, "Taran", "obleznicza", 0, 0)],
        Side::Atk,
        &ctx,
    )
    .unwrap();
    let def = roster_to_battle_units(
        &[
            RosterUnit::new("l", 1, "Łucznik", "lucznik", 0, 0),
            RosterUnit::new("k", 1, "Katapulta polowa", "obleznicza", 0, 0),
        ],
        Side::Def,
        &ctx,
    )
    .unwrap();
    let env = SpawnEnv {
        terrain: "Rownina".into(),
        shallow_sea: false,
        crown_range_delta: 1.0,
    };
    let fields = vec![
        spawn_fields(&atk[0], SpawnSlot::Attacker, &env).unwrap(),
        spawn_fields(&def[0], SpawnSlot::DefenderCrown, &env).unwrap(),
        spawn_fields(&def[1], SpawnSlot::DefenderCrown, &env).unwrap(),
    ];
    let mut units = atk;
    units.extend(def);
    (units, fields)
}

fn tower_setup_none() -> civ_engine::domain::siege_battle_adapter_body::TowerSetup {
    tower_setup_for(
        &pin_layout(),
        &TowerSetupInput {
            built_building_ids: &[],
            defender_era: Some(1.0),
            def_civ: None,
            units: &[],
            params: TowerParams::pin(),
        },
    )
}

/// Dlug T2b N1: brama ukladu muru musi miec `gateHp > 0` i stac na murze; inaczej jawny blad, nie `gate_hp = 0.0`.
#[test]
fn brama_bez_hp_to_jawny_blad() {
    let ok = scene_inputs(&pin_layout(), tower_setup_none()).unwrap();
    assert_eq!(ok.gate_hp, GATE_MAX_HP);
    assert_eq!(ok.gate_col, ok.wall_col);
    let muts: [fn(&mut SiegeLayout); 9] = [
        |l| l.gate_hp = 0.0,
        |l| l.gate_hp = -5.0,
        |l| l.gate_hp = f64::NAN,
        |l| l.gate_hp = f64::INFINITY,
        |l| l.gate_open = true,
        |l| l.gate_col = -1,
        |l| l.gate_col += 1,
        |l| l.wall_col = -1,
        |l| l.gate_row = -1,
    ];
    for mutate in muts {
        let mut l = pin_layout();
        mutate(&mut l);
        let e = scene_inputs(&l, tower_setup_none()).unwrap_err();
        assert_eq!(err_name(&e), "InvalidGate", "{l:?}");
    }
    let mut l = pin_layout();
    l.wall_tile_hp[0].1 = f64::NAN;
    assert_eq!(
        err_name(&scene_inputs(&l, tower_setup_none()).unwrap_err()),
        "NonFinite"
    );
}

/// Bez obwarowania (`fortKind = 'none'`): brak wiezyczek, `towerRange` inicjalne 2, brak strzelca (`:2446`, `:4161`).
#[test]
fn bez_obwarowania_brak_wiezyczek() {
    let t = tower_setup_none();
    assert_eq!(t.fort_kind, CityFortificationKind::None);
    assert!(t.material.is_none() && t.rows.is_empty() && t.tower_shot.is_none());
    assert_eq!((t.tower_range, t.shooter_nazwa.as_str()), (2.0, "Strzelec"));
}

/// `clampEra` (`battleScene.ts:922-925`).
#[test]
fn clamp_era_jak_pin() {
    for (x, want) in [
        (None, 1.0),
        (Some(f64::NAN), 1.0),
        (Some(f64::INFINITY), 1.0),
        (Some(0.0), 1.0),
        (Some(1.49), 1.0),
        (Some(1.5), 2.0),
        (Some(2.6), 3.0),
        (Some(7.0), 3.0),
        (Some(-3.0), 1.0),
    ] {
        assert_eq!(clamp_era(x), want, "{x:?}");
    }
}

/// `_applyTerrainRange` (`:7490-7502`): katapulta i jednostka wrecz bez zmian, delta terenu z podloga 0, x2 w gore
/// tylko dla strzelca obroncy na koronie; po zejsciu z korony (`:7740`) zasieg bez x2 (D-B7).
#[test]
fn zasieg_terenu_i_korony() {
    let u = |side_def, on_wall, ranged_base, is_catapult, range_base| TerrainRangeUnit {
        side_def,
        on_wall_walkway: on_wall,
        ranged_base,
        is_catapult,
        range_base,
    };
    assert_eq!(
        apply_terrain_range(&u(true, true, true, false, 3.0), 1.0),
        8.0
    );
    assert_eq!(
        apply_terrain_range(&u(true, true, true, false, 3.0), 0.5),
        7.0
    );
    assert_eq!(
        apply_terrain_range(&u(true, false, true, false, 3.0), 1.0),
        4.0
    );
    assert_eq!(
        apply_terrain_range(&u(false, true, true, false, 3.0), 1.0),
        4.0
    );
    assert_eq!(
        apply_terrain_range(&u(true, true, true, false, 3.0), -5.0),
        0.0
    );
    assert_eq!(
        apply_terrain_range(&u(true, true, true, true, 6.0), 1.0),
        6.0
    );
    assert_eq!(
        apply_terrain_range(&u(true, true, false, false, 1.0), 1.0),
        1.0
    );
    assert_eq!(
        apply_terrain_range(&u(true, true, true, false, 0.0), 1.0),
        0.0
    );
    assert!(apply_terrain_range(&u(false, false, true, false, 3.0), f64::NAN).is_nan());
    // Poza korona `Math.max(0, rangeBase + delta)` (`:7496`): ujemna suma = +0, nie liczba ujemna (mutant M02).
    for (side_def, on_wall) in [(true, false), (false, true), (false, false)] {
        let r = apply_terrain_range(&u(side_def, on_wall, true, false, 3.0), -5.0);
        assert!(
            r == 0.0 && r.is_sign_positive(),
            "{side_def} {on_wall}: {r}"
        );
    }
    assert_eq!(
        apply_terrain_range(&u(true, false, true, false, 3.0), -1.0),
        2.0
    );
}

/// `_placeSiegeTowers` (`:4166-4169`): `towerRows` dostaje `gateRowLo = siegeGateRow - 1`, `gateRowHi = siegeGateRow`,
/// czyli wiezyczka nie stoi na zadnym z dwoch kafli bramy (`_carveWallTiles` rzezbi `Gate` w obu, `:4045-4050`).
/// Wyrocznia: petla `towerRows` (`city-towers.ts`) przepisana z tekstu pinu; uklad z brama tak, by pierwszy slot
/// (`rowLo + 2`) wypadl na `gateRow - 1` (mutant M11).
#[test]
fn wiezyczki_omijaja_oba_kafle_bramy() {
    let units: Vec<UnitRow> = Vec::new();
    let built = vec!["mury".to_owned()];
    let rows_for = |layout: &SiegeLayout| {
        tower_setup_for(
            layout,
            &TowerSetupInput {
                built_building_ids: &built,
                defender_era: Some(1.0),
                def_civ: None,
                units: &units,
                params: TowerParams::pin(),
            },
        )
        .rows
    };
    let oracle = |l: &SiegeLayout| {
        let spacing = TowerParams::pin().spacing.max(1);
        let mut out = Vec::new();
        let mut r = l.row_lo + 2_i64.min((l.row_hi - l.row_lo).max(0));
        while r <= l.row_hi {
            if !(r >= l.gate_row - 1 && r <= l.gate_row) {
                out.push(r);
            }
            r += spacing;
        }
        out
    };
    let base = pin_layout();
    assert_eq!(rows_for(&base), oracle(&base));
    let mut l = pin_layout();
    l.gate_row = l.row_lo + 3;
    let rows = rows_for(&l);
    assert_eq!(rows, oracle(&l));
    assert!(!rows.contains(&(l.gate_row - 1)) && !rows.contains(&l.gate_row));
    assert!(!rows.contains(&(l.row_lo + 2)), "{rows:?}");
    for g in (base.row_lo + 1)..=base.row_hi {
        let mut l = pin_layout();
        l.gate_row = g;
        assert_eq!(rows_for(&l), oracle(&l), "gate_row {g}");
    }
}

/// D-B11 + install: jedno `shootingEnabled` wypelnia `activate.shooting_disabled` i `doctrine.shooting_enabled`;
/// pola sceny (brama 400, wiezyczki, zasieg wiezy) i jednostek (statystyki machin, `rangeBase`, `ammoLeft`,
/// `_siegeMachineRange`, `moraleMax`) trafiaja do ciala; zla liczba jednostek = jawny blad.
#[test]
fn wejscia_ciala_do_prodbody() {
    use civ_engine::domain::siege_battle_adapter_body::BodyUnitInputs;
    use civ_engine::domain::siege_tactics_blow::SequenceRolls;
    use civ_engine::domain::siege_tactics_loop::{ProdBody, ProdUnit};
    let (units, fields) = body_fixture();
    let ins: Vec<BodyUnitInputs> = units
        .iter()
        .zip(&fields)
        .map(|(bu, sf)| body_unit_inputs(bu, sf, "Rownina", false).unwrap())
        .collect();
    let (atk_in, def_in) = ins.split_at(1);
    // Taran: wallAttack z units.json, wrecz (bez strzelania), `_siegeMachineRange` 1.
    assert!(atk_in[0].is_ram && atk_in[0].is_siege_unit && !atk_in[0].can_shoot);
    assert_eq!(atk_in[0].siege_machine_range, 1.0);
    assert!(atk_in[0].siege_stats.wall_attack > 0.0);
    // Lucznik korony: x2 po delcie +1; katapulta spoza units.json: zasieg korony 6, `_siegeMachineRange` 6.
    assert!(def_in[0].can_shoot && def_in[0].range > def_in[0].range_base);
    assert_eq!((def_in[1].range, def_in[1].siege_machine_range), (6.0, 6.0));
    let mk = |u: &BodyUnitInputs, q: i64| ProdUnit {
        activate: activate_unit_for(
            u,
            &UnitPlacement {
                q,
                r: 5,
                terrain_defence_mult: 1.0,
            },
            true,
            false,
        )
        .unwrap(),
        melee_target: None,
        blow: None,
        counter_blows: Vec::new(),
        body_ms: 0.0,
        facing: 0.0,
    };
    let layout = pin_layout();
    let d = doc();
    let unit_rows: Vec<UnitRow> = d["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| serde_json::from_value(u.clone()).unwrap())
        .collect();
    let built = vec!["mury".to_owned()];
    let tw = tower_setup_for(
        &layout,
        &TowerSetupInput {
            built_building_ids: &built,
            defender_era: Some(2.0),
            def_civ: Some("grecy"),
            units: &unit_rows,
            params: TowerParams::pin(),
        },
    );
    let scene = scene_inputs(&layout, tw).unwrap();
    let mut body = ProdBody::new(
        [
            atk_in.iter().map(|u| mk(u, 1)).collect(),
            def_in.iter().zip(30_i64..).map(|(u, q)| mk(u, q)).collect(),
        ],
        scene.activate_scene(false, 1.0),
        SequenceRolls::new(vec![]),
    );
    // Przed: wartosc domyslna ciala (gate_hp 0 = wylom bramy pierwszym ciosem, dlug N1).
    assert_eq!(body.gate_hp, 0.0);
    body.doctrine[1][0].shooting_enabled = false;
    install_body_inputs(&mut body, &scene, [atk_in, def_in]).unwrap();
    assert_eq!(body.gate_hp, GATE_MAX_HP);
    assert_eq!(
        (body.siege_gate_col, body.siege_gate_row),
        (layout.gate_col, layout.gate_row)
    );
    assert_eq!(body.siege_wall_tiles_init, layout.wall_tiles_init);
    assert_eq!(body.siege_towers.len(), scene.towers.rows.len());
    assert!(!body.siege_towers.is_empty());
    assert_eq!(body.tower_range, scene.towers.tower_range);
    assert_eq!(body.tower_shooter_nazwa, scene.towers.shooter_nazwa);
    for (s, list) in [atk_in, def_in].iter().enumerate() {
        for (i, u) in list.iter().enumerate() {
            assert_eq!(body.names[s][i], u.name);
            assert_eq!(body.siege_stats[s][i], Some(u.siege_stats));
            assert_eq!(body.range_base[s][i], u.range_base);
            assert_eq!(body.ranged_base[s][i], u.ranged_base);
            assert_eq!(body.ammo_left[s][i], u.ammo_left);
            assert_eq!(body.siege_machine_range[s][i], Some(u.siege_machine_range));
            assert_eq!(body.morale_max[s][i], u.morale_max);
            assert_eq!(body.is_army_commander[s][i], u.is_army_commander);
            assert_eq!(body.doctrine[s][i].anti_cav_spear, u.anti_cav_spear);
            // D-B11: niezmiennik z jednego zrodla.
            assert!(body.doctrine[s][i].shooting_enabled);
            assert_eq!(
                body.doctrine[s][i].shooting_enabled,
                !body.units[s][i].activate.shooting_disabled
            );
        }
    }
    let e = install_body_inputs(&mut body, &scene, [atk_in, &def_in[..1]]).unwrap_err();
    assert_eq!(err_name(&e), "InvariantViolated");
}

/// Niezmiennik Z4: `canShoot` przy `rangeBase < 2` (katapulta korony `< 6`) = jawny blad; NaN = blad.
#[test]
fn niezmienniki_wejsc_ciala() {
    let (units, fields) = body_fixture();
    let mut sf = fields[1].clone();
    sf.range_base = 1.0;
    let e = body_unit_inputs(&units[1], &sf, "Rownina", false).unwrap_err();
    assert_eq!(err_name(&e), "InvariantViolated");
    let mut sf = fields[2].clone();
    sf.range_base = 5.0;
    let e = body_unit_inputs(&units[2], &sf, "Rownina", false).unwrap_err();
    assert_eq!(err_name(&e), "InvariantViolated");
    let mut sf = fields[1].clone();
    sf.morale = f64::NAN;
    let e = body_unit_inputs(&units[1], &sf, "Rownina", false).unwrap_err();
    assert_eq!(err_name(&e), "NonFinite");
    let b = body_unit_inputs(&units[1], &fields[1], "Rownina", false).unwrap();
    let e = activate_unit_for(
        &b,
        &UnitPlacement {
            q: 0,
            r: 0,
            terrain_defence_mult: f64::NAN,
        },
        true,
        false,
    )
    .unwrap_err();
    assert_eq!(err_name(&e), "NonFinite");
    let a = activate_unit_for(
        &b,
        &UnitPlacement {
            q: 3,
            r: 4,
            terrain_defence_mult: 1.25,
        },
        false,
        true,
    )
    .unwrap();
    assert_eq!((a.q, a.r, a.terrain_defence_mult), (3, 4, 1.25));
    assert!(!a.side_atk && a.on_wall_walkway && a.can_shoot && !a.shooting_disabled);
    assert!(!a.doctrine_auto && a.doctrine_manual && a.player_order_none);
    assert_eq!((a.dry_col, a.morale, a.range), (-1.0, b.morale, b.range));
}

/// `MAX_PER_SIDE = 500` (`battleScene.ts:721`, straznik linii generatora) i `attackers.slice(0, MAX_PER_SIDE)`
/// (`:5510`): 501. jednostka odpada, kolejnosc bez zmian. Renderer ma 120 (dlug DTO-BRIDGE, D-ADP-L5) — adapter
/// trzyma wartosc pinu (mutant M26).
#[test]
fn limit_strony_jak_pin() {
    let all: Vec<RosterUnit> = (0..501)
        .map(|i| RosterUnit::new(&format!("u{i}"), 0, "Wojownik", "miecznik", 0, 0))
        .collect();
    let capped = cap_side(&all);
    assert_eq!(capped.len(), 500);
    assert_eq!(BATTLE_MAX_PER_SIDE, 500);
    assert_eq!(capped[0].id, "u0");
    assert_eq!(capped[499].id, "u499");
    assert_eq!(cap_side(&all[..120]).len(), 120);
}
