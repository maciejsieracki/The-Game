//! P6 SIEGE-TAKTYKA K5I2b2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2B2-Q1): test end-to-end `single_blow_full` z `BlowEnv`
//! zlozonym przez adapter `siege_tactics_blow_env` (pozycja, mapa kafli, mur, teren) z wektorow pinu.
//!
//! Wektory: `p6_siege_tactics_blow_env_vectors/vectors.json`, generowane przez `p6_siege_tactics_blow_env_gen.mjs`
//! (Node 22). Generator WYKONUJE tekst pinu `07d2fbd72` dla: `_singleBlow` (battleScene.ts:8812-9010), `relativeHit`
//! (+ `facingToward`, `oppositeDir`), `isFordTile`, `isShoreAdjacentToFord`, `_wallBonusProcFor`
//! (+ `fortificationDefenseBonusForUnit`, `defenderInsideFortification`), `terrainDefenseMultiplier` (+ `normTerrain`,
//! `parseDefenseBonusPct`), `terrainRiverAttackMultiplier`, `cityGatedTerrainMultiplier`, oraz helperow CombatUnit.
//! Dane terenu: `gra/data/terrain-combat.json` pinu (SHA-256 = straznik). Stubami pozostaja wyjscia spoza zakresu
//! (civ, trudnosc, kontry, braces, stan sceny) - patrz naglowek generatora.
//!
//! Test sprawdza:
//!
//! * adapter: `blow_hit_arc` (relativeHit), `BlowEnv` pola terenu/mostu/muru vs obserwacje pinu (`tdm`, `gated`,
//!   `wallBonus`, `atkFord`, `defFord`, `shore`, mnoznik rzeki po nazwie, `riverRow`);
//! * koniec-koncow: skladanie ciosu (`hitChanceTw` argumenty), `baseDamage`/`rangeDamage`, wynik (trafienie,
//!   obrazenia, HP, morale, `engaged`) z `single_blow_full` na `BlowEnv` z adaptera.
//!
//! Strazniki: SHA-256 fragmentow pinu (stare + srodowiska) i danych terenu, liczniki galezi, >= 500 przypadkow.

use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, Outcome, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_env::{
    attacker_river_mult_by_name, blow_env_for, blow_hit_arc, BlowPlacement, BlowSceneCtx,
    TerrainRow, TileMap,
};
use civ_engine::domain::siege_tactics_blow_full::{
    attacker_from_cu, compose_blow, defender_from_cu, single_blow_full, AtkMods, AttackerCu,
    BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_inputs_unit::{
    to_combat_unit, BattleUnitIn, CombatUnitModel, StatRow, ToCombatUnitOpts, UVal,
};
use std::collections::HashMap;

const VECTORS: &str = include_str!("p6_siege_tactics_blow_env_vectors/vectors.json");
const FRAGMENT_SHA256: &str = "b2f9e19f1e35644e0e2ea636a9d50a02dd10d729355de5eb3eb35668910e5526";
const UNIT_FRAGMENT_SHA256: &str =
    "d1b401a2275ab01569dd16ec1a6a3618ae56b592dd13c4f900b82b252755016c";
const UNITS_SHA256: &str = "7b509817d1c613a526ea0e8066a62f340f46a29fedd6f79f0c647195727bc6d7";
const ENV_FRAGMENT_SHA256: &str =
    "8a9afb5582c2edad3e6f8e1500f679c63223d37285b579b7ac7fd226041cc7e1";
const TERRAIN_SHA256: &str = "b5f0f9c5c25a65273bc674d1ae1121ab09d93141085eb0c1a9b1bc911798f9bf";

fn load() -> serde_json::Value {
    serde_json::from_str(VECTORS).expect("vectors.json jest poprawnym JSON-em")
}

/// Liczba z wektora: NaN/Infinity zapisane jako tekst.
fn num(v: &serde_json::Value) -> f64 {
    if let Some(s) = v.as_str() {
        return match s {
            "NaN" => f64::NAN,
            "Infinity" => f64::INFINITY,
            "-Infinity" => f64::NEG_INFINITY,
            other => other.parse::<f64>().expect("liczba w wektorze"),
        };
    }
    v.as_f64().expect("liczba w wektorze")
}

/// Liczba opcjonalna: `null` -> None.
fn opt_num(v: &serde_json::Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

/// Rownosc jak w wektorach: NaN == NaN, a -0 != +0 (K5I2b2: Math.max(-0,0) = +0 w pinie, znak zera jest obserwowalny).
fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || (a == b && a.is_sign_negative() == b.is_sign_negative())
}

fn arc(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("nieznany kierunek: {other}"),
    }
}

/// Tekst wartosci z tagiem (`["n","..."] | ["s","..."] | ["z"] | ["u"] | ["b",bool]`), jak w wektorach jednostek.
fn tagged(v: &serde_json::Value) -> UVal {
    let a = v.as_array().expect("tag");
    match a[0].as_str().expect("tag str") {
        "u" => UVal::Undef,
        "z" => UVal::Null,
        "n" => UVal::Num(num_from_tag(a[1].as_str().expect("liczba"))),
        "s" => UVal::Str(a[1].as_str().expect("napis").to_string()),
        "b" => UVal::Bool(a[1].as_bool().expect("bool")),
        other => panic!("nieznany tag {other}"),
    }
}

fn num_from_tag(s: &str) -> f64 {
    match s {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        "-0" => -0.0,
        other => other.parse::<f64>().expect("liczba w wektorze"),
    }
}

/// Wiersze `gra/data/units.json` PINU (pola skalarne) z wektora.
fn units_table(v: &serde_json::Value) -> Vec<StatRow> {
    v.as_array()
        .expect("units")
        .iter()
        .map(|row| {
            row.as_object()
                .expect("wiersz")
                .iter()
                .map(|(k, val)| (k.clone(), tagged(val)))
                .collect::<HashMap<String, UVal>>()
        })
        .collect()
}

/// `cuA`/`cuD` z wiersza PINU: wiersz + nadpisanie NaN/Inf (jesli jest) -> `to_combat_unit` (K5I2a4) -> model.
fn unit_models(c: &serde_json::Value, units: &[StatRow]) -> (CombatUnitModel, CombatUnitModel) {
    let i = &c["in"];
    let one = |u: &serde_json::Value, hp: &serde_json::Value| -> CombatUnitModel {
        let idx = u["idx"].as_u64().expect("idx") as usize;
        let mut stats = units[idx].clone();
        for (k, v) in u["ovr"].as_object().expect("ovr") {
            stats.insert(k.clone(), tagged(v));
        }
        let bu = BattleUnitIn {
            stats: Some(stats),
            kategoria: u["kategoria"].as_str().expect("kategoria").to_string(),
            hp: opt_num(hp),
            veteran_bonus_frac: opt_num(&u["vet"]),
            army_hungry: u["hungry"].as_bool().expect("hungry"),
            gold_deficit: u["gold"].as_bool().expect("gold"),
        };
        to_combat_unit(
            &bu,
            &ToCombatUnitOpts {
                army_hunger_stat_mult: num(&i["hunger"]),
                skip_hunger: false,
                gold_deficit_stat_mult: num(&i["gold"]),
                skip_gold_deficit: false,
            },
        )
    };
    (
        one(&i["unitA"], &i["attacker"]["hp"]),
        one(&i["unitD"], &i["defender"]["hp"]),
    )
}

/// Porownanie `CombatUnit` Rust (`to_combat_unit`) z `CombatUnit` pinu (observed w generatorze).
fn cu_mismatches(js: &serde_json::Value, m: &CombatUnitModel) -> Vec<String> {
    let mut out = Vec::new();
    let mut eq = |name: &str, key: &str, rust: f64| {
        let want = match tagged(&js[key]) {
            UVal::Num(n) => n,
            UVal::Null | UVal::Undef => f64::NAN,
            other => panic!("pole {key}: {other:?}"),
        };
        let js_is_undef = matches!(tagged(&js[key]), UVal::Undef);
        if !js_is_undef && !same(rust, want) {
            out.push(format!("{name}: rust={rust} js={want}"));
        }
    };
    eq("meleeAttack", "meleeAttack", m.melee_attack);
    eq("meleeDefence", "meleeDefence", m.melee_defence);
    eq("weaponDamage", "weaponDamage", m.weapon_damage);
    eq("armor", "armor", m.armor);
    eq("piercing", "piercing", m.piercing);
    eq("chargeBonus", "chargeBonus", m.charge_bonus);
    eq("missileAttack", "missileAttack", m.missile_attack);
    eq("Kara flanka", "Kara obrony z flanki (%)", m.kara_flanka);
    eq("Kara tyl", "Kara obrony z tylu (%)", m.kara_tyl);
    out
}

/// Mapa, teren i stan muru sceny z wektora (`in.map`, `in.terrain`, `in.siegeWallCol`, `in.cityTerrain`).
fn scene_ctx(i: &serde_json::Value, top: &serde_json::Value) -> BlowSceneCtx {
    let m = &i["map"];
    let cols = m["cols"].as_i64().expect("cols") as i32;
    let rows = m["rows"].as_i64().expect("rows") as i32;
    let codes: Vec<u8> = m["codes"]
        .as_array()
        .expect("codes")
        .iter()
        .map(|v| v.as_u64().expect("kod kafla") as u8)
        .collect();
    let is_mountain = m["isMountain"].as_bool().expect("isMountain");
    let terrain_data: Vec<TerrainRow> = i["terrain"]
        .as_array()
        .expect("terrain")
        .iter()
        .map(|row| {
            let a = row.as_array().expect("wiersz terenu");
            TerrainRow {
                teren: a[0].as_str().expect("Teren").to_string(),
                bonus_obrona: a[1].as_str().map(str::to_string),
            }
        })
        .collect();
    BlowSceneCtx {
        map: TileMap::new(cols, rows, codes, is_mountain).expect("mapa z wektora"),
        terrain_data,
        is_city_defense_battle: i["isCity"].as_bool().expect("isCity"),
        wall_defense_total_proc: num(&i["wallTotal"]),
        siege_wall_col: num(&i["siegeWallCol"]),
        city_terrain: i["cityTerrain"].as_str().expect("cityTerrain").to_string(),
        river_attack_mult: num(&top["riverMult"]),
        brod_kara_obrona: num(&top["brod"]["karaObrona"]),
        brod_bonus_brzegu: num(&top["brod"]["bonusObronaBrzegu"]),
        fortify_obrona_proc: num(&top["fortify"]),
    }
}

/// Nazwy kafli z wektora (`in.map.names`): WYKONANIE `combatTerrainName` z pinu (battle-terrain.ts:802-806).
fn pin_names(i: &serde_json::Value) -> Vec<String> {
    i["map"]["names"]
        .as_array()
        .expect("names")
        .iter()
        .map(|v| v.as_str().expect("nazwa kafla").to_string())
        .collect()
}

/// Ulozenie ciosu z wektora (pozycje, zwrot obroncy, stan muru, rola atakujacego z `cuA`).
fn placement(i: &serde_json::Value, atk_rola: &str) -> BlowPlacement {
    let at = &i["attacker"];
    let df = &i["defender"];
    BlowPlacement {
        attacker: (
            at["q"].as_i64().expect("attacker.q") as i32,
            at["r"].as_i64().expect("attacker.r") as i32,
        ),
        defender: (
            df["q"].as_i64().expect("defender.q") as i32,
            df["r"].as_i64().expect("defender.r") as i32,
        ),
        defender_facing: df["facing"].as_i64().expect("defender.facing") as i32,
        defender_on_wall: df["onWall"].as_bool().expect("onWall"),
        defender_side_def: df["side"].as_str().expect("defender.side") == "def",
        atk_rola: atk_rola.to_string(),
    }
}

fn build_input(c: &serde_json::Value, top: &serde_json::Value, units: &[StatRow]) -> FullBlowInput {
    let i = &c["in"];
    let (cu_a, cu_d) = unit_models(c, units);
    let am = &i["atkMods"];
    let dm = &i["defMods"];
    let ctx = scene_ctx(i, top);
    let pl = placement(i, &cu_a.rola);
    FullBlowInput {
        ranged: i["ranged"].as_bool().expect("ranged"),
        hit_arc: blow_hit_arc(&pl),
        attacker: attacker_from_cu(&cu_a),
        atk_mods: AtkMods {
            atk: num(&am["atk"]),
            ranged_atk: num(&am["rangedAtk"]),
            uderzenie: num(&am["uderzenie"]),
        },
        // Mnozniki trudnosci sa po STRONIE (`side`), jak w pinie: attacker.side==='atk' ? diffA : diffD.
        atk_diff_mult: if i["attacker"]["side"].as_str().expect("attacker.side") == "atk" {
            num(&i["diffA"])
        } else {
            num(&i["diffD"])
        },
        atk_mounted: i["attacker"]["mounted"].as_bool().expect("mounted"),
        defender: defender_from_cu(&cu_d),
        def_mods: DefMods {
            obrona: num(&dm["obrona"]),
            pancerz: num(&dm["pancerz"]),
        },
        def_diff_mult: if i["defender"]["side"].as_str().expect("defender.side") == "def" {
            num(&i["diffD"])
        } else {
            num(&i["diffA"])
        },
        def_on_wall: i["defender"]["onWall"].as_bool().expect("onWall"),
        def_fortified_in_field: i["defender"]["fortified"].as_bool().expect("fortified"),
        def_wall_civ_mult: num(&i["wallCiv"]),
        def_braces_against_charge: i["braces"].as_bool().expect("braces"),
        first_blow_of_pair: !i["engagedPre"].as_bool().expect("engagedPre"),
        counter_mult: num(&i["ctr"]),
        env: blow_env_for(&ctx, &pl),
        defender_state: DefenderState {
            hp: num(&i["defender"]["hp"]),
            max_hp: num(&i["defender"]["maxHp"]),
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    }
}

/// Obserwacje pinu z `in.*` (null = funkcja nie zostala wolana w tym przypadku) vs adapter.
fn env_mismatches(
    c: &serde_json::Value,
    top: &serde_json::Value,
    units: &[StatRow],
) -> Vec<String> {
    let i = &c["in"];
    let (cu_a, _) = unit_models(c, units);
    let ctx = scene_ctx(i, top);
    let pl = placement(i, &cu_a.rola);
    let env = blow_env_for(&ctx, &pl);
    let mut out = Vec::new();
    // combatTerrainName wyprowadzony z kodow (Rust) vs nazwy z wykonania pinu, kafel po kaflu.
    let m = &i["map"];
    let cols = m["cols"].as_i64().expect("cols") as i32;
    let rows = m["rows"].as_i64().expect("rows") as i32;
    let names_pin = pin_names(i);
    for r in 0..rows {
        for q in 0..cols {
            let want = &names_pin[(r * cols + q) as usize];
            let got = ctx.map.name(q, r);
            if got != want {
                out.push(format!("combatTerrainName({q},{r}): rust={got} pin={want}"));
            }
        }
    }
    let arc_js = i["hitArc"].as_str().expect("hitArc");
    if blow_hit_arc(&pl) != arc(arc_js) {
        out.push(format!("hitArc: rust={:?} js={arc_js}", blow_hit_arc(&pl)));
    }
    let mut num_obs = |name: &str, rust: f64, js: &serde_json::Value| {
        if !js.is_null() && !same(rust, num(js)) {
            out.push(format!("{name}: rust={rust} js={}", num(js)));
        }
    };
    num_obs("tdm", env.field_terrain_multiplier, &i["tdm"]);
    num_obs("gated", env.gated_terrain_multiplier, &i["gated"]);
    num_obs("wallBonus", env.wall_bonus_proc, &i["wallBonus"]);
    num_obs(
        "riverMult",
        attacker_river_mult_by_name(&ctx, &pl),
        &i["terrRiverObs"],
    );
    let mut bool_obs = |name: &str, rust: bool, js: &serde_json::Value| {
        if let Some(b) = js.as_bool() {
            if b != rust {
                out.push(format!("{name}: rust={rust} js={b}"));
            }
        }
    };
    bool_obs("atkFord", env.atk_on_ford, &i["atkFord"]);
    bool_obs("defFord", env.def_on_ford_raw, &i["defFord"]);
    bool_obs("shore", env.shore_adjacent, &i["shore"]);
    bool_obs("riverRow", env.river_row_exists, &i["riverRow"]);
    out
}

#[derive(Default)]
struct Cover {
    total: usize,
    miss: usize,
    hit_melee: usize,
    hit_ranged: usize,
    charge: usize,
    braces_blocks_charge: usize,
    not_first_blow: usize,
    flank_hit: usize,
    rear_hit: usize,
    front_hit: usize,
    mounted_charge_morale: usize,
    on_wall: usize,
    city_battle: usize,
    field_battle: usize,
    fortified_defender: usize,
    ford_defender: usize,
    shore_bonus: usize,
    river_attack: usize,
    slinger_ranged: usize,
    lucznik_ranged: usize,
    other_ranged_mult_one: usize,
    kill: usize,
    morale_only: usize,
    dmg_floor_one: usize,
    nan_case: usize,
    inf_case: usize,
    counter_not_one: usize,
    wall_nan_inf: usize,
    neg_zero_cu: usize,
    gory_cases: usize,
}

#[test]
fn zgodnosc_z_pinem_end_to_end() {
    let v = load();
    assert_eq!(
        v["fragmentSha256"].as_str().expect("sha"),
        FRAGMENT_SHA256,
        "fragmenty pinu zmienione: wygeneruj wektory ponownie i zaktualizuj sume"
    );
    assert_eq!(
        v["unitFragmentSha256"].as_str().expect("sha jednostek"),
        UNIT_FRAGMENT_SHA256,
        "fragment toCombatUnit zmieniony"
    );
    assert_eq!(
        v["unitsSha256"].as_str().expect("sha units"),
        UNITS_SHA256,
        "units.json pinu zmieniony"
    );
    assert_eq!(
        v["envFragmentSha256"].as_str().expect("sha env"),
        ENV_FRAGMENT_SHA256,
        "fragmenty srodowiska pinu zmienione: wygeneruj wektory ponownie i zaktualizuj sume"
    );
    assert_eq!(
        v["terrainSha256"].as_str().expect("sha terrain"),
        TERRAIN_SHA256,
        "terrain-combat.json pinu zmieniony"
    );
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 500, "za malo przypadkow: {}", cases.len());
    let units = units_table(&v["units"]);
    assert_eq!(units.len(), 75, "wiersze units.json pinu");

    let mut cov = Cover::default();
    let mut failures: Vec<String> = Vec::new();

    for c in cases {
        let id = c["id"].as_u64().expect("id");
        // CombatUnit: to_combat_unit (Rust) vs toCombatUnit pinu (JS, observed) - przed skladaniem ciosu.
        let (cu_a, cu_d) = unit_models(c, &units);
        for m in cu_mismatches(&c["in"]["cuA"], &cu_a) {
            failures.push(format!("#{id} cuA {m}"));
        }
        for m in cu_mismatches(&c["in"]["cuD"], &cu_d) {
            failures.push(format!("#{id} cuD {m}"));
        }
        let input = build_input(c, &v, &units);
        for m in env_mismatches(c, &v, &units) {
            failures.push(format!("#{id} env {m}"));
        }
        if pin_names(&c["in"]).iter().any(|n| n == "Gory") {
            cov.gory_cases += 1;
        }
        let o = &c["out"];
        let u = num(&c["in"]["u"]);
        let mut rolls = SequenceRolls::new(vec![u]);
        let full = single_blow_full(&input, &mut rolls);
        let comp = full.composition;
        let blow = &full.blow;
        let mut fail = |what: &str, got: String, want: String| {
            failures.push(format!("#{id} {what}: rust={got} js={want}"));
        };

        // Skladanie: argumenty hitChanceTw.
        let hit_args = o["hitArgs"].as_array().expect("hitArgs");
        let want_hit_atk = num(&hit_args[0]);
        let got_hit_atk = if input.ranged {
            comp.atk_shoot_acc
        } else {
            comp.atk_melee
        };
        if !same(got_hit_atk, want_hit_atk) {
            fail("hit.atk", got_hit_atk.to_string(), want_hit_atk.to_string());
        }
        if !same(comp.def_final_obrona, num(&hit_args[1])) {
            fail(
                "hit.defFinalObrona",
                comp.def_final_obrona.to_string(),
                num(&hit_args[1]).to_string(),
            );
        }
        if !same(comp.charge_hit_bonus, num(&hit_args[2])) {
            fail(
                "hit.bonus",
                comp.charge_hit_bonus.to_string(),
                num(&hit_args[2]).to_string(),
            );
        }
        // Skladanie: baseDamage (melee) / rangeDamage (pocisk) i mnoznik klasy.
        if let Some(b) = o["baseArgs"].as_array() {
            if !same(comp.def_armor, num(&b[1])) {
                fail(
                    "base.armor",
                    comp.def_armor.to_string(),
                    num(&b[1]).to_string(),
                );
            }
            if !same(comp.round_atk_charge, num(&b[3])) {
                fail(
                    "base.charge",
                    comp.round_atk_charge.to_string(),
                    num(&b[3]).to_string(),
                );
            }
            if comp.is_charge != b[4].as_bool().expect("isCharge") {
                fail(
                    "base.isCharge",
                    comp.is_charge.to_string(),
                    b[4].to_string(),
                );
            }
        }
        if let Some(r) = o["rangeArgs"].as_array() {
            if !same(comp.atk_missile, num(&r[0])) {
                fail(
                    "range.missile",
                    comp.atk_missile.to_string(),
                    num(&r[0]).to_string(),
                );
            }
            if !same(comp.def_armor, num(&r[1])) {
                fail(
                    "range.armor",
                    comp.def_armor.to_string(),
                    num(&r[1]).to_string(),
                );
            }
        }
        if !o["rdm"].is_null() {
            let want = num(&o["rdm"]);
            if !same(comp.ranged_class_mult, want) {
                fail("rdm", comp.ranged_class_mult.to_string(), want.to_string());
            }
        }
        // Wynik ciosu (rdzen K5I).
        let want_missed = o["missed"].as_bool().expect("missed");
        if blow.missed != want_missed {
            fail("missed", blow.missed.to_string(), want_missed.to_string());
        }
        if !same(blow.hit_pct, num(&o["hitPct"])) {
            fail(
                "hitPct",
                blow.hit_pct.to_string(),
                num(&o["hitPct"]).to_string(),
            );
        }
        if !same(blow.roll, num(&o["roll"])) {
            fail("roll", blow.roll.to_string(), num(&o["roll"]).to_string());
        }
        if !same(blow.dmg, num(&o["dmg"])) {
            fail("dmg", blow.dmg.to_string(), num(&o["dmg"]).to_string());
        }
        if !same(num(&c["out"]["ret"]), blow.dmg) {
            fail(
                "ret",
                blow.dmg.to_string(),
                num(&c["out"]["ret"]).to_string(),
            );
        }
        if !same(blow.def_hp_after, num(&o["defHpAfter"])) {
            fail(
                "defHpAfter",
                blow.def_hp_after.to_string(),
                num(&o["defHpAfter"]).to_string(),
            );
        }
        if !want_missed {
            let want_extra = num(&o["extraMorale"]);
            if !same(blow.extra_morale, want_extra) {
                fail(
                    "extraMorale",
                    blow.extra_morale.to_string(),
                    want_extra.to_string(),
                );
            }
        }
        let want_charge = o["isCharge"].as_bool().expect("isCharge");
        if blow.is_charge != want_charge {
            fail(
                "isCharge",
                blow.is_charge.to_string(),
                want_charge.to_string(),
            );
        }
        let engaged_after = o["engagedAfter"].as_bool().expect("engagedAfter");
        let engaged_pre = o["engagedBefore"].as_bool().expect("engagedBefore");
        if blow.engaged_add != !input.ranged {
            fail(
                "engagedAdd",
                blow.engaged_add.to_string(),
                (!input.ranged).to_string(),
            );
        }
        if engaged_after != (engaged_pre || !input.ranged) {
            fail(
                "engagedAfter",
                engaged_after.to_string(),
                (engaged_pre || !input.ranged).to_string(),
            );
        }

        // Pokrycie galezi.
        cov.total += 1;
        if want_missed {
            cov.miss += 1;
        } else if input.ranged {
            cov.hit_ranged += 1;
        } else {
            cov.hit_melee += 1;
        }
        if want_charge {
            cov.charge += 1;
        }
        if !input.ranged && !input.first_blow_of_pair {
            cov.not_first_blow += 1;
        }
        if !input.ranged && input.first_blow_of_pair && input.def_braces_against_charge {
            cov.braces_blocks_charge += 1;
        }
        if !want_missed {
            match input.hit_arc {
                HitArc::Flank => cov.flank_hit += 1,
                HitArc::Rear => cov.rear_hit += 1,
                HitArc::Front => cov.front_hit += 1,
            }
            if !input.ranged && want_charge && input.atk_mounted {
                cov.mounted_charge_morale += 1;
            }
            match blow.outcome {
                Outcome::Kill => cov.kill += 1,
                Outcome::MoraleOnly => cov.morale_only += 1,
                Outcome::RoutBeforeDeath | Outcome::None => {}
            }
            if blow.dmg == 1.0 {
                cov.dmg_floor_one += 1;
            }
        }
        if input.def_on_wall {
            cov.on_wall += 1;
        }
        if input.env.is_city_defense_battle {
            cov.city_battle += 1;
        } else {
            cov.field_battle += 1;
        }
        if input.def_fortified_in_field {
            cov.fortified_defender += 1;
        }
        if input.env.def_on_ford_raw && !input.def_on_wall {
            cov.ford_defender += 1;
        }
        if input.env.shore_adjacent
            && input.env.atk_on_ford
            && !input.env.def_on_ford_raw
            && !input.def_on_wall
        {
            cov.shore_bonus += 1;
        }
        if input.env.atk_tile_is_river && input.env.river_row_exists {
            cov.river_attack += 1;
        }
        if input.ranged {
            match (c["out"]["rdmTyp"].as_str(), c["out"]["rdmJedn"].as_str()) {
                (Some("Slinger"), _) => cov.slinger_ranged += 1,
                (Some("Distance"), Some(name))
                    if name.trim().to_lowercase().starts_with("łucznik") =>
                {
                    cov.lucznik_ranged += 1
                }
                _ => cov.other_ranged_mult_one += 1,
            }
        }
        if input.counter_mult != 1.0 {
            cov.counter_not_one += 1;
        }
        let text = c.to_string();
        if text.contains("\"NaN\"") {
            cov.nan_case += 1;
        }
        if text.contains("Infinity") {
            cov.inf_case += 1;
        }
        // Mur: NaN/Inf w sumie obrony muru (wejscie wall_defense_totals z pinu).
        if matches!(
            c["in"]["wallTotal"].as_str(),
            Some("NaN" | "Infinity" | "-Infinity")
        ) {
            cov.wall_nan_inf += 1;
        }
        // -0 w CombatUnit zwróconym przez toCombatUnit PINU (observed, tagged ["n","-0"]).
        if c["in"]["cuA"].to_string().contains("[\"n\",\"-0\"]")
            || c["in"]["cuD"].to_string().contains("[\"n\",\"-0\"]")
        {
            cov.neg_zero_cu += 1;
        }
    }

    assert!(
        failures.is_empty(),
        "rozbieznosci z pinem ({}):\n{}",
        failures.len(),
        failures
            .iter()
            .take(40)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );

    // Liczniki galezi: kazda galez musi byc pokryta wektorami.
    let checks: [(&str, usize); 28] = [
        ("miss", cov.miss),
        ("hit_melee", cov.hit_melee),
        ("hit_ranged", cov.hit_ranged),
        ("charge", cov.charge),
        ("braces_blocks_charge", cov.braces_blocks_charge),
        ("not_first_blow", cov.not_first_blow),
        ("flank_hit", cov.flank_hit),
        ("rear_hit", cov.rear_hit),
        ("front_hit", cov.front_hit),
        ("mounted_charge_morale", cov.mounted_charge_morale),
        ("on_wall", cov.on_wall),
        ("city_battle", cov.city_battle),
        ("field_battle", cov.field_battle),
        ("fortified_defender", cov.fortified_defender),
        ("ford_defender", cov.ford_defender),
        ("shore_bonus", cov.shore_bonus),
        ("river_attack", cov.river_attack),
        ("slinger_ranged", cov.slinger_ranged),
        ("lucznik_ranged", cov.lucznik_ranged),
        ("other_ranged_mult_one", cov.other_ranged_mult_one),
        ("kill", cov.kill),
        ("morale_only", cov.morale_only),
        ("dmg_floor_one", cov.dmg_floor_one),
        ("nan_case", cov.nan_case),
        ("inf_case", cov.inf_case),
        ("counter_not_one", cov.counter_not_one),
        ("wall_nan_inf", cov.wall_nan_inf),
        ("neg_zero_cu", cov.neg_zero_cu),
    ];
    for (name, n) in checks {
        assert!(n > 0, "galaz bez pokrycia: {name}");
    }
    assert!(cov.total >= 500);
    // K5I2b2: procarz >= 100 przypadkow dystansowych (dispatch); regres ponizej progu musi wywalic test.
    assert!(
        cov.slinger_ranged >= 100,
        "procarz: {} < 100 przypadkow dystansowych",
        cov.slinger_ranged
    );
    // K5I2B2-POKRYCIE: lucznik >= 14 (regres wag losowania 14 -> 2 musi wywalic test).
    assert!(
        cov.lucznik_ranged >= 14,
        "lucznik: {} < 14 przypadkow dystansowych",
        cov.lucznik_ranged
    );
    assert!(
        cov.wall_nan_inf > 0,
        "mur: brak przypadkow NaN/Inf w sumie obrony"
    );
    assert!(cov.neg_zero_cu > 0, "brak -0 w CombatUnit pinu");
    // K5I2B2-DLUG-R2: galaz 'Gory' (Wzgorza na preset gorski) musi byc pokryta wektorami pinu.
    assert!(
        cov.gory_cases > 0,
        "brak przypadkow z kaflem 'Gory' w wektorach"
    );
}

#[test]
fn ranged_class_mult_z_unit_power_nie_z_wektora() {
    // Slinger x3, lucznik piesi (Distance + "Łucznik") x2, reszta x1: zrodlo to unit_power, nie wektor.
    let base = |typ: &str, jednostka: &str| FullBlowInput {
        ranged: true,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: Some(10.0),
            charge_bonus: 0.0,
            counter_typ: typ.to_string(),
            typ_nazwa: jednostka.to_string(),
        },
        atk_mods: AtkMods {
            atk: 0.0,
            ranged_atk: 0.0,
            uderzenie: 0.0,
        },
        atk_diff_mult: 1.0,
        atk_mounted: false,
        defender: DefenderCu {
            melee_defence: 0.0,
            armor: 0.0,
            kara_flanka: None,
            kara_tyl: None,
        },
        def_mods: DefMods {
            obrona: 0.0,
            pancerz: 0.0,
        },
        def_diff_mult: 1.0,
        def_on_wall: false,
        def_fortified_in_field: false,
        def_wall_civ_mult: 1.0,
        def_braces_against_charge: false,
        first_blow_of_pair: true,
        counter_mult: 1.0,
        env: BlowEnv {
            is_city_defense_battle: false,
            wall_bonus_proc: 0.0,
            gated_terrain_multiplier: 1.0,
            field_terrain_multiplier: 1.0,
            atk_tile_is_river: false,
            river_row_exists: false,
            river_attack_mult: 0.75,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.25,
            brod_bonus_brzegu: 0.15,
            fortify_obrona_proc: 50.0,
        },
        defender_state: DefenderState {
            hp: 50.0,
            max_hp: 50.0,
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    };
    let mult = |typ: &str, jednostka: &str| compose_blow(&base(typ, jednostka)).1.ranged_class_mult;
    assert_eq!(mult("Slinger", "Procarz"), 3.0);
    assert_eq!(mult("Distance", "Łucznik"), 2.0);
    assert_eq!(mult("Distance", "Oszczepnik"), 1.0);
    assert_eq!(mult("Mount", "Łucznik"), 1.0);
}

#[test]
fn nan_w_atak_dystansowy_propaguje_jak_math_max() {
    // JS: rangedShotAccuracy(meleeAttack, NaN) = Math.max(a, NaN) = NaN. f64::max zwrocilby a: test pilnuje js_max.
    let mut inp = FullBlowInput {
        ranged: true,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: Some(f64::NAN),
            charge_bonus: 0.0,
            counter_typ: "Lucznik".to_string(),
            typ_nazwa: "Łucznik".to_string(),
        },
        atk_mods: AtkMods {
            atk: 0.0,
            ranged_atk: 0.0,
            uderzenie: 0.0,
        },
        atk_diff_mult: 1.0,
        atk_mounted: false,
        defender: DefenderCu {
            melee_defence: 0.0,
            armor: 0.0,
            kara_flanka: None,
            kara_tyl: None,
        },
        def_mods: DefMods {
            obrona: 0.0,
            pancerz: 0.0,
        },
        def_diff_mult: 1.0,
        def_on_wall: false,
        def_fortified_in_field: false,
        def_wall_civ_mult: 1.0,
        def_braces_against_charge: false,
        first_blow_of_pair: true,
        counter_mult: 1.0,
        env: BlowEnv {
            is_city_defense_battle: false,
            wall_bonus_proc: 0.0,
            gated_terrain_multiplier: 1.0,
            field_terrain_multiplier: 1.0,
            atk_tile_is_river: false,
            river_row_exists: false,
            river_attack_mult: 0.75,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.25,
            brod_bonus_brzegu: 0.15,
            fortify_obrona_proc: 50.0,
        },
        defender_state: DefenderState {
            hp: 50.0,
            max_hp: 50.0,
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    };
    let (_, comp) = compose_blow(&inp);
    assert!(comp.atk_shoot_acc.is_nan());
    inp.attacker.missile_attack = None;
    let (_, comp2) = compose_blow(&inp);
    // null -> 0 (`?? 0`): max(10, 0) = 10.
    assert_eq!(comp2.atk_shoot_acc, 10.0);
}
