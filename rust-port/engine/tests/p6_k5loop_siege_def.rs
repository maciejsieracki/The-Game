//! P6 SIEGE-TAKTYKA K5LOOP-SIEGE-DEF (dispatch R-RUSTPORT-P6-K5LOOP-SIEGE-DEF-Q1, T1, Operator r1): zgodność `ProdBody`
//! z pinem `07d2fbd72` dla:
//! - obrońcy w oblężeniu (`siegeWallCol >= 0`, strona `def`) w `_activateUnit` (`battleScene.ts:6048-6299`): bramka
//!   `siegeDefenderNeverDoctrine` (`:6087`), okrążenie (`:6105-6118`, ucieczka = jawny tag: bez terenu
//!   `ucieczka-routed`, z terenem przy murze `ucieczka-oblezenie`), `_updateFacing` (`:6123`), gałąź `onWallWalkway` (`:6129-6172`: strzelec
//!   `_rangedTargetInRange` `:7041-7053`, kontrbateria katapulty `bestCata`, cios sąsiada `_targetInRange`, trzymanie
//!   muru), `_trySiegeTowerClimb`/`_siegeInfantryToTowerStep` (`:6179-6180`, dla obrońcy `return false`), SIEGE DEFENDER
//!   HOLD (`:6225-6236`); filtr `_meleeBlockedByWall` (`:8361-8371`) z wyłomem (`wallEverBreached`);
//! - K5LOOP-KILL-RIPPLE (D-INT-2): ripple `_shakeAlliesOnLoss` przy zabiciu (`_resolveBlowOutcome` `:9044-9056`,
//!   wywołanie `:9048`) z kaskadami `_checkRout`/`_startRout`/`_checkMeleeScreenLost`/`_boostEnemiesOnBreak`.
//!
//! Wektory: `p6_k5loop_siege_def_vectors/vectors.json` (oraz `vectors_nan.json`: `range` NaN/+Inf, `morale` NaN, `hp`
//! NaN; oraz `vectors_dd0.json`: wróg na polu obrońcy, `dd == 0`),
//! generowane przez `p6_k5loop_siege_def_gen.mjs`, który WYKONUJE tekst pinu (strażnik SHA-256 wycinków).
//!
//! Porównanie na każdym wektorze obrońcy: ślad aktywacji, czas, `facing` (końcowe i zmiany z czasem), strzał (`Facing` +
//! `Shot`, rekord trafienia: cel i łuk), cios wręcz (`Melee`: cel i czas), amunicja, akcje `Rout`/`Shaken` z czasem i
//! morale, stan WSZYSTKICH jednostek (bez ciosu wręcz), `occByKey`, liczba rzutów = liczba `_singleBlow` pinu, `unported`
//! (puste; okrążenie: dokładnie jeden tag ucieczki; nigdy `oblezenie` dla obrońcy). Ripple: pełny cios zabijający
//! (`strike` z rzutem trafiającym), stan wszystkich jednostek po zabiciu, kolejność `Kill`/`Shaken`/`Rout`,
//! [`ProdBody::kill_ripples`].

use std::collections::{BTreeMap, BTreeSet, HashMap};

use civ_engine::domain::player_order_move_gate::{GroupDoctrine as GateDoctrine, GroupMeta};
use civ_engine::domain::siege_tactics_actions::{BattleAction, TimedAction};
use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, RollSource};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_target::AttackDirection;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit, RANGED_FLY_MS};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_siege_def_vectors/vectors.json");
const VECTORS_NAN: &str = include_str!("p6_k5loop_siege_def_vectors/vectors_nan.json");
/// Obrona r1 (Z4): wróg na polu obrońcy (`dd == 0`), osobny plik generatora (bez zmiany dwóch pozostałych).
const VECTORS_DD0: &str = include_str!("p6_k5loop_siege_def_vectors/vectors_dd0.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5loop_siege_def_gen.mjs`).
const PIN_SHA256: &str = "e8e86aec589637a83159e765eab68f09198932326f7505d03b97cde7468a9deb";
/// Rzut strzału obrońcy: pudło (`roll * 100 >= hitPct`), więc trafienie nie zmienia HP ani morale celu (generator ma
/// atrapę `_singleBlow` = 0 obrażeń, jak r4).
const MISS_ROLL: f64 = 0.999_999;
/// Rzut ciosu zabijającego w rodzinie `ripple`: zawsze trafia (`roll * 100 < hitPct`).
const HIT_ROLL: f64 = 0.0;

/// Rzuty z licznikiem użycia (`Math.random` w `_singleBlow`); wyczerpanie = panika (rzut, którego pin nie robi).
struct CountRolls {
    values: Vec<f64>,
    used: usize,
}

impl RollSource for CountRolls {
    fn next_unit(&mut self) -> f64 {
        let v = *self
            .values
            .get(self.used)
            .expect("rzut, ktorego pin nie wykonuje (liczba rzutow != liczba _singleBlow)");
        self.used += 1;
        v
    }
}

fn b(v: &Value) -> bool {
    v.as_bool().expect("bool")
}
fn bo(v: &Value) -> bool {
    v.as_bool().unwrap_or(false)
}
fn num(v: &Value) -> f64 {
    match v.as_str() {
        Some("NaN") => f64::NAN,
        Some("Infinity") => f64::INFINITY,
        Some("-Infinity") => f64::NEG_INFINITY,
        _ => v.as_f64().expect("liczba"),
    }
}
fn int(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
}
fn num_or(v: &Value, d: f64) -> f64 {
    if v.is_null() {
        d
    } else {
        num(v)
    }
}

fn gate(s: &str) -> GateDoctrine {
    match s {
        "defensive" => GateDoctrine::Defensive,
        "steady" => GateDoctrine::Steady,
        "aggressive" => GateDoctrine::Aggressive,
        "skirmish" => GateDoctrine::Skirmish,
        "manual" => GateDoctrine::Manual,
        other => panic!("doktryna {other}"),
    }
}

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("strona {other}"),
    }
}

fn tag_of(u: UnitRef) -> String {
    match u.side {
        BattleSide::Attacker => format!("atk{}", u.idx),
        BattleSide::Defender => format!("def{}", u.idx),
    }
}

fn unit_of_tag(tag: &str) -> UnitRef {
    UnitRef {
        side: if tag.starts_with("atk") {
            BattleSide::Attacker
        } else {
            BattleSide::Defender
        },
        idx: tag[3..].parse().expect("idx"),
    }
}

/// Pola `ru` z wektora (`onWall`, `cata`, `siege` = wejścia adaptera: `onWallWalkway`, `_isCatapult`, `isSiegeUnit`).
fn act(u: &Value, side_atk: bool, doctrine_auto: bool) -> ActivateUnit {
    let ammo = num_or(&u["ammoLeft"], 0.0);
    let ranged_base = bo(&u["rangedBase"]);
    ActivateUnit {
        side_atk,
        q: int(&u["q"]),
        r: int(&u["r"]),
        dead: false,
        fading_out: false,
        routed: false,
        never_rout: bo(&u["neverRout"]),
        surround_applied: bo(&u["surroundApplied"]),
        morale: num_or(&u["morale"], 100.0),
        flee_morale: num_or(&u["fleeMorale"], 0.0),
        terrain_defence_mult: num_or(&u["tdm"], 1.0),
        range: num_or(&u["range"], 1.0),
        on_wall_walkway: bo(&u["onWall"]),
        primary_ranged: bo(&u["primaryRanged"]),
        mounted: bo(&u["mounted"]),
        phalanx: bo(&u["phalanx"]),
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        // Pin `canShoot(ru) = ru.rangedBase && ru.ammoLeft > 0` (`:1457-1459`).
        can_shoot: ranged_base && ammo > 0.0,
        is_siege_unit: bo(&u["siege"]),
        is_siege_tower: false,
        is_ram: false,
        is_catapult: bo(&u["cata"]),
        doctrine_auto,
        doctrine_manual: false,
    }
}

fn scene(wall_col: i64) -> ActivateScene {
    ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col,
        gate_open: false,
        wall_tile_hp: Vec::new(),
        siege_machine_range: 0.0,
    }
}

fn label(ev: &ActivateEvent) -> Option<String> {
    Some(match ev {
        ActivateEvent::Attack { .. }
        | ActivateEvent::Done
        | ActivateEvent::ResetPlayerOrder
        | ActivateEvent::UpdateMoraleBar
        | ActivateEvent::StartRout => return None,
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::Flee => "flee".into(),
        other => format!("{other:?}"),
    })
}

fn blow(ranged: bool) -> FullBlowInput {
    FullBlowInput {
        ranged,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: Some(10.0),
            charge_bonus: 0.0,
            counter_typ: String::new(),
            typ_nazwa: String::new(),
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
            river_attack_mult: 1.0,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.0,
            brod_bonus_brzegu: 0.0,
            fortify_obrona_proc: 0.0,
        },
        defender_state: DefenderState {
            hp: 100.0,
            max_hp: 100.0,
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

struct Built {
    body: ProdBody<CountRolls>,
    st: TurnSeqState,
    acting: UnitRef,
}

/// Ciało i stan z wektora. `melee` = (cel, szablon) ciosu jednostki działającej, `shots` = cele szablonów strzału,
/// `rolls` = rzuty.
fn build(case: &Value, melee: Option<usize>, shots: &[usize], rolls: Vec<f64>) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let acting = UnitRef {
        side: side_of(case["acting"]["side"].as_str().expect("side")),
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    let wall_col = int(&case["wallCol"]);
    let doctrine_auto = bo(&case["expect"]["doctrineAuto"]);
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let dead = b(&u["dead"]);
            let me = ix == usize::from(acting.side == BattleSide::Defender) && i == acting.idx;
            let (melee_target, mblow) = match (me, melee) {
                (true, Some(t)) => (Some(t), Some(blow(false))),
                _ => (None, None),
            };
            units[ix].push(ProdUnit {
                activate: act(u, ix == 0, me && doctrine_auto),
                melee_target,
                blow: mblow,
                counter_blows: Vec::new(),
                body_ms: 0.0,
                facing: num(&u["facing"]),
            });
            seq[ix].push(SeqUnit {
                id: (ix * 100 + seq[ix].len()) as u64,
                c: CombatUnit {
                    hp: num_or(&u["hp"], 100.0),
                    morale: num_or(&u["morale"], 100.0),
                    flee_morale: num_or(&u["fleeMorale"], 0.0),
                    move_left: num(&u["moveLeft"]),
                    never_rout: bo(&u["neverRout"]),
                    dead,
                    fading_out: b(&u["fadingOut"]),
                    routed: b(&u["routed"]),
                    removed: dead,
                    acted: false,
                },
            });
        }
    }
    let [atk_seq, def_seq] = seq;
    let st = TurnSeqState {
        atk: atk_seq,
        def: def_seq,
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 1,
        siege_wall_col: wall_col,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    let mut body = ProdBody::new(
        units,
        scene(wall_col),
        CountRolls {
            values: rolls,
            used: 0,
        },
    );
    body.wall_ever_breached = bo(&case["wallEverBreached"]);
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let ds = &mut body.doctrine[ix][i];
            ds.unit_doctrine = u["unitDoctrine"]
                .as_str()
                .map(|s| GroupDoctrine::parse(s).expect("doktryna"));
            ds.group_id = u["groupId"].as_str().map(str::to_string);
            body.ranged_base[ix][i] = bo(&u["rangedBase"]);
            body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
            body.morale_max[ix][i] = num_or(&u["moraleMax"], 100.0);
            body.attack_direction[ix][i] = match u["attackDirection"].as_str() {
                None | Some("front") => AttackDirection::Front,
                Some("bok") => AttackDirection::Bok,
                Some("tyl") => AttackDirection::Tyl,
                Some(other) => panic!("kierunek {other}"),
            };
        }
    }
    let aix = usize::from(acting.side == BattleSide::Defender);
    for t in shots {
        body.ranged_blows[aix][acting.idx].insert(*t, blow(true));
    }
    for g in case["groupMeta"].as_array().expect("groupMeta") {
        body.group_meta.insert(
            g[0].as_str().expect("id").to_string(),
            GroupMeta {
                doctrine: gate(g[1].as_str().expect("doktryna")),
                auto_play: b(&g[2]),
            },
        );
    }
    body.sync_occupancy(&st);
    Built { body, st, acting }
}

fn load_from(src: &str) -> Value {
    let v: Value = serde_json::from_str(src).expect("wektory");
    assert_eq!(v["pin"].as_str(), Some(PIN));
    assert_eq!(v["pinSha256"].as_str(), Some(PIN_SHA256));
    v
}

/// Akcje jednej aktywacji (format r4) + `Kill` w kolejności zdarzeń (`K:`).
#[derive(Default)]
struct Got {
    facing: Vec<(f64, f64)>,
    melee: Option<(usize, f64)>,
    shot: Option<(usize, f64, f64, f64)>,
    routs: Vec<(String, f64)>,
    shaken: Vec<(String, String, u64, f64)>,
    order: Vec<String>,
}

fn split_actions(actions: &[TimedAction], acting: UnitRef) -> Got {
    let mut g = Got::default();
    let mut rout_facing_pending = false;
    for (k, a) in actions.iter().enumerate() {
        let next = actions.get(k + 1).map(|n| &n.action);
        if matches!(&a.action, BattleAction::Rout { unit } if *unit == acting) {
            rout_facing_pending = true;
        }
        match &a.action {
            BattleAction::Facing { unit, .. } if *unit == acting && rout_facing_pending => {
                rout_facing_pending = false;
            }
            BattleAction::Facing { unit, dir } if *unit == acting => match next {
                Some(BattleAction::Melee { attacker, .. }) if *attacker == acting => {}
                Some(BattleAction::Shot {
                    attacker,
                    target,
                    land_at,
                }) if *attacker == acting => {
                    g.shot = Some((target.idx, a.t0, *land_at, *dir));
                }
                _ => g.facing.push((a.t0, *dir)),
            },
            BattleAction::Melee {
                attacker, target, ..
            } if *attacker == acting => g.melee = Some((target.idx, a.t0)),
            BattleAction::Rout { unit } => {
                g.routs.push((tag_of(*unit), a.t0));
                g.order.push(format!("R:{}", tag_of(*unit)));
            }
            BattleAction::Kill { unit } => g.order.push(format!("K:{}", tag_of(*unit))),
            BattleAction::Shaken {
                unit,
                fallen,
                morale,
            } => {
                g.shaken
                    .push((tag_of(*unit), tag_of(*fallen), morale.to_bits(), a.t0));
                g.order.push(format!("S:{}", tag_of(*unit)));
            }
            _ => {}
        }
    }
    g
}

fn same_f64(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}

fn arc_of(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("luk {other}"),
    }
}

/// Stan wszystkich jednostek po aktywacji wobec pinu (morale bitowo, flagi, `facing`, `screenLostApplied`).
fn check_units(
    name: &str,
    e: &Value,
    body: &ProdBody<CountRolls>,
    st: &TurnSeqState,
    failures: &mut Vec<String>,
) {
    for u in e["units"].as_array().expect("units") {
        let tag = u["tag"].as_str().expect("tag");
        let r = unit_of_tag(tag);
        let c = st.unit(r).c;
        // Morale NaN (wektor `morale-nan`): bity NaN z JS i Rust mogą się różnić, wartość ta sama.
        let bits = |m: f64| {
            if m.is_nan() {
                f64::NAN.to_bits()
            } else {
                m.to_bits()
            }
        };
        let got_u = (
            bits(c.morale),
            c.routed,
            c.dead,
            c.removed,
            c.fading_out,
            c.acted,
            body.facing(r).to_bits(),
            body.screen_lost_applied(r),
        );
        let want_u = (
            bits(num(&u["morale"])),
            b(&u["routed"]),
            b(&u["dead"]),
            b(&u["removed"]),
            b(&u["fadingOut"]),
            b(&u["acted"]),
            num(&u["facing"]).to_bits(),
            b(&u["screenLostApplied"]),
        );
        if got_u != want_u {
            failures.push(format!("{name}: stan {tag} rust={got_u:?} js={want_u:?}"));
        }
    }
    let want_occ: HashMap<_, String> = e["occ"]
        .as_array()
        .expect("occ")
        .iter()
        .map(|o| {
            (
                cell_key(num(&o[0]), num(&o[1])),
                o[2].as_str().expect("tag").to_string(),
            )
        })
        .collect();
    if body.occ_by_key() != &want_occ {
        failures.push(format!("{name}: occByKey rozny"));
    }
}

fn check_order(name: &str, e: &Value, got: &Got, failures: &mut Vec<String>) {
    let want_routs: Vec<(String, f64)> = e["routs"]
        .as_array()
        .expect("routs")
        .iter()
        .map(|r| (r["unit"].as_str().expect("u").to_string(), num(&r["t"])))
        .collect();
    if got.routs != want_routs {
        failures.push(format!(
            "{name}: Rout rust={:?} js={want_routs:?}",
            got.routs
        ));
    }
    let want_shaken: Vec<(String, String, u64, f64)> = e["shaken"]
        .as_array()
        .expect("shaken")
        .iter()
        .map(|r| {
            (
                r["unit"].as_str().expect("u").to_string(),
                r["fallen"].as_str().expect("f").to_string(),
                num(&r["morale"]).to_bits(),
                num(&r["t"]),
            )
        })
        .collect();
    if got.shaken != want_shaken {
        failures.push(format!(
            "{name}: Shaken rust={:?} js={want_shaken:?}",
            got.shaken
        ));
    }
    let want_order: Vec<String> = e["order"]
        .as_array()
        .expect("order")
        .iter()
        .map(|o| o.as_str().expect("order").to_string())
        .collect();
    if got.order != want_order {
        failures.push(format!(
            "{name}: kolejnosc Kill/Shaken/Rout rust={:?} js={want_order:?}",
            got.order
        ));
    }
}

/// Skąd ciało czyta mur (`this.siegeWallCol` pinu to JEDNA wartość; w Rust są dwa wejścia).
#[derive(Clone, Copy, PartialEq, Eq)]
enum WallSrc {
    /// Scena maszyny i `TurnSeqState` (wektory generatora).
    Both,
    /// Tylko scena maszyny (`st.siege_wall_col = -1`), obrona r1 Z2.
    SceneOnly,
    /// Tylko `TurnSeqState` (`scene.wall_col = -1`).
    SeqOnly,
}

/// Wariant wejścia ciała dla tego samego wektora pinu.
#[derive(Clone, Copy)]
struct Opts {
    wall: WallSrc,
    /// `ProdBody::with_terrain` (płaski teren): ucieczka z okrążenia ma wtedy dane ruchu i o tagu decyduje mur (Z3).
    terrain: bool,
}

const BASE: Opts = Opts {
    wall: WallSrc::Both,
    terrain: false,
};

/// Płaski teren (`passable`, koszt 1, bez brodu, mnożnik jazdy 1): tylko po to, by `terrain.is_some()`.
struct Flat;

impl MoveTerrain for Flat {
    fn passable(&self, _col: f64, _row: f64) -> bool {
        true
    }
    fn move_cost(&self, _col: f64, _row: f64) -> f64 {
        1.0
    }
    fn is_ford(&self, _col: f64, _row: f64) -> bool {
        false
    }
    fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
        1.0
    }
}

/// Jedna aktywacja obrońcy w oblężeniu wobec pinu. Zwraca gałąź pinu (licznik pokrycia).
fn check_def(case: &Value, failures: &mut Vec<String>) -> String {
    check_def_with(case, BASE, failures)
}

/// [`check_def`] z wariantem wejścia ciała ([`Opts`]); oczekiwania pinu te same.
fn check_def_with(case: &Value, opts: Opts, failures: &mut Vec<String>) -> String {
    let name = case["name"].as_str().expect("name");
    let e = &case["expect"];
    let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
    let blows = e["blows"].as_array().expect("blows");
    let shots: Vec<usize> = blows
        .iter()
        .map(|x| x["target"].as_u64().expect("cel") as usize)
        .collect();
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, want_attack, &shots, vec![MISS_ROLL; shots.len()]);
    assert_eq!(acting.side, BattleSide::Defender, "{name}: obronca");
    match opts.wall {
        WallSrc::Both => {}
        WallSrc::SceneOnly => st.siege_wall_col = -1,
        WallSrc::SeqOnly => body.scene.wall_col = -1,
    }
    if opts.terrain {
        body = body.with_terrain(Box::new(Flat));
    }
    body.set_now(0.0);
    let _ = body.take_actions();
    let dur = body.start(acting, &st);
    // Cios wręcz: pin w generatorze kończy na `_doMeleeAttack` (zapis celu i czasu); sam cios pokrywa rodzina `ripple`.
    if want_attack.is_none() {
        body.complete(acting, &mut st);
    }
    let got_trace: Vec<String> = body.trace[0].1.iter().filter_map(label).collect();
    let want_trace: Vec<String> = e["trace"]
        .as_array()
        .expect("trace")
        .iter()
        .map(|t| t.as_str().expect("t").to_string())
        .collect();
    if got_trace != want_trace {
        failures.push(format!(
            "{name}: trace rust={got_trace:?} js={want_trace:?}"
        ));
    }
    if dur != num(&e["duration"]) {
        failures.push(format!("{name}: duration rust={dur} js={}", e["duration"]));
    }
    let fin = &e["final"];
    if body.facing(acting) != num(&fin["facing"]) {
        failures.push(format!(
            "{name}: facing rust={} js={}",
            body.facing(acting),
            fin["facing"]
        ));
    }
    let ammo = body.ammo_left[1][acting.idx];
    if !same_f64(ammo, num(&fin["ammoLeft"])) {
        failures.push(format!(
            "{name}: ammoLeft rust={ammo} js={}",
            fin["ammoLeft"]
        ));
    }
    let got = split_actions(body.pending_actions(), acting);
    let want_facing: Vec<(f64, f64)> = e["facing"]
        .as_array()
        .expect("facing")
        .iter()
        .map(|f| (num(&f["t"]), num(&f["dir"])))
        .collect();
    if got.facing != want_facing {
        failures.push(format!(
            "{name}: zmiany facing rust={:?} js={want_facing:?}",
            got.facing
        ));
    }
    let want_melee = want_attack.map(|t| (t, num(&e["attack"]["t"])));
    if got.melee != want_melee {
        failures.push(format!(
            "{name}: cios rust={:?} js={want_melee:?}",
            got.melee
        ));
    }
    let want_shot = blows.first().map(|x| {
        let hit = num(&x["t"]);
        (
            x["target"].as_u64().expect("cel") as usize,
            hit - RANGED_FLY_MS,
            hit,
            num(&x["facing"]),
        )
    });
    if got.shot != want_shot {
        failures.push(format!(
            "{name}: strzal rust={:?} js={want_shot:?}",
            got.shot
        ));
    }
    if let Some(x) = blows.first() {
        assert!(b(&x["ranged"]), "{name}: _singleBlow ranged");
        match body.blows.first() {
            Some(rec)
                if rec.attacker == acting
                    && rec.target.idx == x["target"].as_u64().expect("cel") as usize
                    && rec.hit_arc == arc_of(x["hitArc"].as_str().expect("luk"))
                    && rec.missed => {}
            other => failures.push(format!("{name}: trafienie rust={other:?} js={x}")),
        }
    }
    if body.rolls.used != blows.len() || body.blows.len() != blows.len() {
        failures.push(format!(
            "{name}: rzuty rust={} js={}",
            body.rolls.used,
            blows.len()
        ));
    }
    check_order(name, e, &got, failures);
    if want_attack.is_none() {
        check_units(name, e, &body, &st, failures);
    }
    // Kryterium końca T1: obrońca przy murze nigdy nie ma tagu `oblezenie`; jedyny dopuszczalny tag to ucieczka po
    // rozbiciu okrążeniem (`_fleeStep`). Precedencja jak w gałęzi `routed` (`LoopBody::start`, K5LOOP-CLOSE r4): bez
    // danych terenu `ucieczka-routed`, z terenem przy murze `ucieczka-oblezenie` (`_doMove` -> `_siegeMoveRefused`).
    let fled = want_trace.iter().any(|t| t == "flee");
    let want_unported: Vec<(UnitRef, &str)> = match (fled, opts.terrain) {
        (false, _) => Vec::new(),
        (true, false) => vec![(acting, "ucieczka-routed")],
        (true, true) => vec![(acting, "ucieczka-oblezenie")],
    };
    if body.unported != want_unported {
        failures.push(format!("{name}: unported {:?}", body.unported));
    }
    e["branch"].as_str().expect("branch").to_string()
}

/// Zabicie z ripple: pełny cios `strike` (rzut trafiający, HP celu 1) wobec `_resolveBlowOutcome` pinu.
fn check_ripple(case: &Value, failures: &mut Vec<String>) -> (usize, usize, bool) {
    let name = case["name"].as_str().expect("name");
    let e = &case["expect"];
    let victim = UnitRef {
        side: side_of(case["victim"]["side"].as_str().expect("side")),
        idx: case["victim"]["idx"].as_u64().expect("idx") as usize,
    };
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, Some(victim.idx), &[], vec![HIT_ROLL]);
    assert_ne!(
        acting.side, victim.side,
        "{name}: cel po stronie przeciwnej"
    );
    body.set_now(0.0);
    let _ = body.take_actions();
    body.start(acting, &st);
    body.set_now(0.0);
    body.complete(acting, &mut st);
    match body.blows.first() {
        Some(rec) if !rec.missed && rec.target == victim && rec.def_hp_after <= 0.0 => {}
        other => failures.push(format!("{name}: cios zabijajacy rust={other:?}")),
    }
    if body.kill_ripples != vec![victim] {
        failures.push(format!(
            "{name}: kill_ripples rust={:?} js=[{}]",
            body.kill_ripples,
            tag_of(victim)
        ));
    }
    let got = split_actions(body.pending_actions(), acting);
    check_order(name, e, &got, failures);
    check_units(name, e, &body, &st, failures);
    if body.facing(acting) != num(&e["final"]["facing"]) {
        failures.push(format!(
            "{name}: facing rust={} js={}",
            body.facing(acting),
            e["final"]["facing"]
        ));
    }
    if !body.unported.is_empty() {
        failures.push(format!("{name}: unported {:?}", body.unported));
    }
    let screen = e["units"]
        .as_array()
        .expect("units")
        .iter()
        .any(|u| b(&u["screenLostApplied"]));
    (got.shaken.len(), got.routs.len(), screen)
}

/// Strażnik czasu: pętla bez końca daje czytelny FAIL zamiast zawieszenia binarki (lekcja r2).
fn with_timeout(label: &'static str, f: impl FnOnce() + Send + 'static) {
    let (tx, rx) = std::sync::mpsc::channel();
    let worker = std::thread::spawn(move || {
        let r = std::panic::catch_unwind(std::panic::AssertUnwindSafe(f));
        let _ = tx.send(r.is_ok());
        if let Err(e) = r {
            std::panic::resume_unwind(e);
        }
    });
    match rx.recv_timeout(std::time::Duration::from_secs(90)) {
        Ok(true) => worker.join().expect("watek testu"),
        Ok(false) => {
            let _ = worker.join();
            panic!("{label}: rozbieznosc z pinem (szczegoly wyzej)");
        }
        Err(_) => panic!("{label}: brak konca w 90 s"),
    }
}

fn report(failures: &[String]) {
    assert!(
        failures.is_empty(),
        "{} rozbieznosci, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(12)]
    );
}

/// Obrońca w oblężeniu: wszystkie gałęzie pinu `:6129-6172`, `:6225-6236` i okrążenie przy murze.
#[test]
fn obronca_w_oblezeniu_zgodny_z_pinem() {
    with_timeout("siege-def", || {
        let v = load_from(VECTORS);
        let cases = v["cases"].as_array().expect("cases");
        assert_eq!(cases.len(), 880 + 320);
        let mut failures = Vec::new();
        let mut cov: BTreeMap<String, usize> = BTreeMap::new();
        for case in cases.iter().filter(|c| c["kind"] != "ripple") {
            let br = check_def(case, &mut failures);
            *cov.entry(br).or_default() += 1;
        }
        report(&failures);
        eprintln!("pokrycie obroncy: {cov:?}");
        let n = |k: &str| cov.get(k).copied().unwrap_or(0);
        // Dokładne nazwy liczników pokrycia = gałęzie pinu (`branchOf` generatora).
        assert!(n("walk-shoot") >= 100, "{cov:?}");
        assert!(n("walk-shoot-hold") >= 30, "{cov:?}");
        assert!(n("walk-cata-counterbattery") >= 60, "{cov:?}");
        assert!(n("walk-cata-fallback") >= 20, "{cov:?}");
        assert!(n("walk-cata-hold") >= 10, "{cov:?}");
        assert!(n("walk-melee") >= 100, "{cov:?}");
        assert!(n("walk-melee-hold") >= 20, "{cov:?}");
        assert!(n("hold-shoot") >= 50, "{cov:?}");
        assert!(n("hold-shoot-hold") >= 50, "{cov:?}");
        assert!(n("hold-melee") >= 100, "{cov:?}");
        assert!(n("hold-melee-hold") >= 40, "{cov:?}");
        assert_eq!(n("surround-flee"), 80, "{cov:?}");
        assert_eq!(cov.values().sum::<usize>(), 880);
    });
}

/// Lekcja NaN: `range` NaN/+Inf (zasięg `_rangedTargetInRange`, kontrbateria `dd <= range`), `morale` NaN
/// (okrążenie), `hp` NaN (remis odległości).
#[test]
fn obronca_nan_inf_zgodny_z_pinem() {
    with_timeout("siege-def-nan", || {
        let v = load_from(VECTORS_NAN);
        let mut failures = Vec::new();
        let mut by_nan: BTreeMap<String, usize> = BTreeMap::new();
        let mut shot_nan = 0;
        for case in v["cases"].as_array().expect("cases") {
            let br = check_def(case, &mut failures);
            let tag = case["nan"].as_str().expect("nan").to_string();
            let shot =
                br.ends_with("shoot") || br.ends_with("counterbattery") || br.ends_with("fallback");
            if tag == "range-nan" && shot {
                shot_nan += 1;
            }
            *by_nan.entry(tag).or_default() += 1;
        }
        report(&failures);
        eprintln!("pokrycie NaN: {by_nan:?}, strzal przy NaN {shot_nan}");
        assert!(
            by_nan.get("range-nan").copied().unwrap_or(0) >= 300,
            "{by_nan:?}"
        );
        assert!(
            by_nan.get("range-inf").copied().unwrap_or(0) >= 200,
            "{by_nan:?}"
        );
        assert_eq!(
            by_nan.get("morale-nan").copied().unwrap_or(0),
            80,
            "{by_nan:?}"
        );
        assert!(
            by_nan.get("hp-nan").copied().unwrap_or(0) >= 200,
            "{by_nan:?}"
        );
        assert!(shot_nan >= 200, "{shot_nan}");
    });
}

/// K5LOOP-KILL-RIPPLE (D-INT-2): `_shakeAlliesOnLoss` przy zabiciu (`:9048`) i jego kaskady.
#[test]
fn ripple_przy_zabiciu_zgodny_z_pinem() {
    with_timeout("kill-ripple", || {
        let v = load_from(VECTORS);
        let mut failures = Vec::new();
        let (mut n, mut with_shaken, mut with_rout, mut with_screen) = (0, 0, 0, 0);
        for case in v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .filter(|c| c["kind"] == "ripple")
        {
            let (shaken, routs, screen) = check_ripple(case, &mut failures);
            n += 1;
            if shaken > 0 {
                with_shaken += 1;
            }
            if routs > 0 {
                with_rout += 1;
            }
            if screen {
                with_screen += 1;
            }
        }
        report(&failures);
        eprintln!(
            "pokrycie ripple: n={n} shaken={with_shaken} kaskada_rout={with_rout} oslona={with_screen}"
        );
        assert_eq!(n, 320);
        assert!(with_shaken >= 150, "{with_shaken}");
        assert!(with_rout >= 80, "{with_rout}");
        assert!(with_screen >= 15, "{with_screen}");
    });
}

/// Strona atakująca przy murze: od K5LOOP-SIEGE-ATK-B (T2b) ciało wykonuje jej gałęzie (zgodność z pinem: wektory
/// `p6_k5loop_siege_atk_b`). D-INT-2: dawna asercja „dokładnie tag `oblezenie`” zastąpiona asercją „brak tagu
/// oblężniczego; ciało bez terenu i bez szablonu ciosu (ten wektor) zapisuje wyłącznie jawne tagi wejścia adaptera
/// (`*-brak-terenu`, `*-bez-szablonu`), morale atakującego bez zmian”.
#[test]
fn atakujacy_przy_murze_bez_tagu_oblezenie() {
    let v = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["kind"] == "hold-melee")
        .expect("hold-melee");
    let Built {
        mut body, mut st, ..
    } = build(case, None, &[], Vec::new());
    let atk0 = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };
    let morale0 = st.unit(atk0).c.morale;
    let _ = body.start(atk0, &st);
    body.complete(atk0, &mut st);
    assert!(
        !body.unported.is_empty(),
        "wektor bez terenu i szablonu: jawny tag wejscia"
    );
    for (u, t) in &body.unported {
        assert_eq!(*u, atk0);
        assert!(!t.starts_with("oblezenie"), "tag oblezniczy {t}");
        assert!(
            t.ends_with("-brak-terenu") || t.ends_with("-bez-szablonu"),
            "tag {t}"
        );
    }
    assert_eq!(st.unit(atk0).c.morale.to_bits(), morale0.to_bits());
}

/// Dwie różne nieujemne kolumny muru (scena maszyny i sekwencja) to błąd wejścia: jawny tag, bez akcji.
#[test]
fn niespojny_mur_jawny_tag() {
    let v = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["kind"] == "walk-shoot")
        .expect("walk-shoot");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, None, &[], Vec::new());
    st.siege_wall_col += 1;
    assert_eq!(body.start(acting, &st), 0.0);
    body.complete(acting, &mut st);
    assert_eq!(body.unported, vec![(acting, "oblezenie-mur-niespojny")]);
    assert!(body.pending_actions().is_empty());
}

/// Mur tylko w `TurnSeqState` (scena maszyny bez muru) też uruchamia gałęzie obrońcy: `this.siegeWallCol` jest jedną
/// wartością pinu, więc ślad i wybór celu są te same co przy murze w scenie.
#[test]
fn mur_tylko_w_sekwencji_daje_ten_sam_wynik() {
    let v = load_from(VECTORS);
    let mut n = 0;
    for case in v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| c["kind"] == "walk-melee" || c["kind"] == "hold-shoot")
        .take(60)
    {
        let mut failures = Vec::new();
        let e = &case["expect"];
        let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
        let shots: Vec<usize> = e["blows"]
            .as_array()
            .expect("blows")
            .iter()
            .map(|x| x["target"].as_u64().expect("cel") as usize)
            .collect();
        let Built {
            mut body,
            st,
            acting,
        } = build(case, want_attack, &shots, vec![MISS_ROLL; shots.len()]);
        body.scene.wall_col = -1;
        body.start(acting, &st);
        let got = split_actions(body.pending_actions(), acting);
        let want_melee = want_attack.map(|t| (t, num(&e["attack"]["t"])));
        if got.melee != want_melee {
            failures.push("cios".to_string());
        }
        if got.shot.map(|s| s.0) != shots.first().copied() {
            failures.push("strzal".to_string());
        }
        assert!(failures.is_empty(), "{}: {failures:?}", case["name"]);
        assert!(body.unported.is_empty(), "{:?}", body.unported);
        n += 1;
    }
    assert_eq!(n, 60);
}

/// Cel ciosu obrońcy wręcz w oblężeniu liczy ciało (`_targetInRange` z filtrem muru), nie adapter: bez celu i szablonu
/// z adaptera zdarzenie `Attack` ma cel pinu, a brak szablonu to jawny tag `cios-bez-szablonu` (bez ciosu).
#[test]
fn obronca_wrecz_cel_liczy_cialo_nie_adapter() {
    let v = load_from(VECTORS);
    let mut n = 0;
    for case in v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| c["kind"] != "ripple" && c["expect"]["attack"]["target"].is_u64())
    {
        let want = case["expect"]["attack"]["target"].as_u64().expect("cel") as usize;
        let Built {
            mut body,
            st,
            acting,
        } = build(case, None, &[], Vec::new());
        assert_eq!(body.start(acting, &st), 0.0, "{}", case["name"]);
        assert!(
            body.trace[0]
                .1
                .contains(&ActivateEvent::Attack { target: want }),
            "{}: slad {:?}",
            case["name"],
            body.trace[0].1
        );
        assert_eq!(body.unported, vec![(acting, "cios-bez-szablonu")]);
        n += 1;
    }
    assert!(n >= 200, "{n}");
}

/// Obrona r1, Z2 (mutant E01: `wall_col = st.siege_wall_col`): mur TYLKO w scenie maszyny (`st.siege_wall_col = -1`)
/// daje ten sam wynik pinu co mur w obu wejściach, na WSZYSTKICH wektorach obrońcy (w tym HOLD `:6225-6236`, który
/// czyta `scene.wall_col` maszyny) i NaN/Inf. Lustro testu [`mur_tylko_w_sekwencji_daje_ten_sam_wynik`], tu z pełnym
/// porównaniem [`check_def`] (także wariant „tylko sekwencja” na tych samych wektorach).
#[test]
fn mur_tylko_w_scenie_daje_ten_sam_wynik() {
    with_timeout("siege-def-scena", || {
        let mut failures = Vec::new();
        let mut cov: BTreeMap<String, usize> = BTreeMap::new();
        for src in [VECTORS, VECTORS_NAN] {
            let v = load_from(src);
            for case in v["cases"]
                .as_array()
                .expect("cases")
                .iter()
                .filter(|c| c["kind"] != "ripple")
            {
                for wall in [WallSrc::SceneOnly, WallSrc::SeqOnly] {
                    let br = check_def_with(
                        case,
                        Opts {
                            wall,
                            terrain: false,
                        },
                        &mut failures,
                    );
                    if wall == WallSrc::SceneOnly {
                        *cov.entry(br).or_default() += 1;
                    }
                }
            }
        }
        report(&failures);
        eprintln!("pokrycie (mur tylko w scenie): {cov:?}");
        assert_eq!(cov.values().sum::<usize>(), 880 + 1343);
        for k in [
            "walk-shoot-hold",
            "walk-cata-hold",
            "walk-melee-hold",
            "hold-shoot-hold",
            "hold-melee-hold",
            "surround-flee",
        ] {
            assert!(cov.get(k).copied().unwrap_or(0) >= 10, "{k}: {cov:?}");
        }
    });
}

/// Obrona r1, Z3 (mutant E14: `Flee if siege && terrain.is_none()`): okrążenie obrońcy przy murze z danymi terenu.
/// `_fleeStep` -> `_doMove` czyta `_siegeMoveRefused` (`:8689`), więc ciało NIE wykonuje ucieczki: jawny tag
/// `ucieczka-oblezenie`, ten sam stan co pin bez ruchu (pełne [`check_def`]: stan wszystkich jednostek, `occByKey`, brak
/// akcji ruchu). Bez terenu tag `ucieczka-routed` (precedencja jak w gałęzi `routed` `LoopBody::start`, r4). Pozostałe
/// gałęzie obrońcy nie zależą od terenu (wszystkie 880 wektorów z terenem).
#[test]
fn ucieczka_okrazenia_przy_murze_z_terenem_jawny_tag() {
    with_timeout("siege-def-teren", || {
        let v = load_from(VECTORS);
        let mut failures = Vec::new();
        let mut fled = 0;
        let mut n = 0;
        for case in v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .filter(|c| c["kind"] != "ripple")
        {
            let br = check_def_with(
                case,
                Opts {
                    wall: WallSrc::Both,
                    terrain: true,
                },
                &mut failures,
            );
            if br == "surround-flee" {
                fled += 1;
            }
            n += 1;
        }
        report(&failures);
        assert_eq!(n, 880);
        assert_eq!(fled, 80);
        // Precedencja tagów ta sama co w `start()` dla jednostki już uciekającej: bez terenu `ucieczka-routed`, z terenem
        // przy murze `ucieczka-oblezenie` (wektor okrążenia z `routed = true` na starcie aktywacji).
        let case = v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .find(|c| c["kind"] == "surround")
            .expect("surround");
        for (terrain, tag) in [(false, "ucieczka-routed"), (true, "ucieczka-oblezenie")] {
            let Built {
                mut body,
                mut st,
                acting,
            } = build(case, None, &[], Vec::new());
            if terrain {
                body = body.with_terrain(Box::new(Flat));
            }
            st.def[acting.idx].c.routed = true;
            assert_eq!(body.start(acting, &st), 0.0);
            body.complete(acting, &mut st);
            assert_eq!(
                body.unported,
                vec![(acting, tag)],
                "start(), teren={terrain}"
            );
        }
    });
}

/// Obrona r1, Z4 (mutant E02: `dd < 1` -> `dd < 0`): wróg na polu obrońcy (`dd == 0`). Pin: `_rangedTargetInRange`
/// (`:7041-7053`) go pomija, kontrbateria `bestCata` (`:6144-6148`, bez dolnej granicy) bierze katapultę na tym polu,
/// `_targetInRange` wręcz (`:8386-8391`) bierze `dd === 0`. Pełne porównanie [`check_def`].
#[test]
fn obronca_wrog_na_tym_samym_polu_zgodny_z_pinem() {
    with_timeout("siege-def-dd0", || {
        let v = load_from(VECTORS_DD0);
        let cases = v["cases"].as_array().expect("cases");
        assert_eq!(cases.len(), 800);
        let mut failures = Vec::new();
        let (mut shot_other, mut shot_stacked, mut melee_stacked) = (0, 0, 0);
        for case in cases {
            check_def(case, &mut failures);
            let stacked = case["atk"].as_array().expect("atk").len() as u64 - 1;
            let me = &case["def"][0];
            let s = &case["atk"][stacked as usize];
            assert_eq!(
                (int(&s["q"]), int(&s["r"])),
                (int(&me["q"]), int(&me["r"])),
                "{}: wrog na polu obroncy",
                case["name"]
            );
            let e = &case["expect"];
            match e["blows"].as_array().expect("blows").first() {
                Some(x) if x["target"].as_u64() == Some(stacked) => shot_stacked += 1,
                Some(_) => shot_other += 1,
                None => {}
            }
            if e["attack"]["target"].as_u64() == Some(stacked) {
                melee_stacked += 1;
            }
        }
        report(&failures);
        eprintln!("dd0: strzal_inny={shot_other} kontrbateria_dd0={shot_stacked} wrecz_dd0={melee_stacked}");
        // Strzał zwykły nigdy nie trafia wroga na tym samym polu (`dd < 1`); trafia go tylko kontrbateria katapulty.
        assert!(shot_other >= 200, "{shot_other}");
        assert!(shot_stacked >= 20, "{shot_stacked}");
        assert!(melee_stacked >= 150, "{melee_stacked}");
        for case in cases {
            let stacked = case["atk"].as_array().expect("atk").len() as u64 - 1;
            if let Some(x) = case["expect"]["blows"].as_array().expect("blows").first() {
                if x["target"].as_u64() == Some(stacked) {
                    assert!(
                        b(&case["atk"][stacked as usize]["cata"]) && b(&case["def"][0]["cata"]),
                        "{}: strzal w pole obroncy tylko kontrbateria",
                        case["name"]
                    );
                }
            }
        }
    });
}
