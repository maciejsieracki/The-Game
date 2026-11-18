//! P6 SIEGE-TAKTYKA K5LOOP-SIEGE-ATK-B (dispatch R-RUSTPORT-P6-K5LOOP-SIEGE-ATK-B-Q1, T2b, Operator r1): zgodność
//! `ProdBody` z pinem `07d2fbd72` dla ATAKUJĄCEGO przy murze w `_activateUnit` (`battleScene.ts:6048-6299`), część B:
//! - katapulta `_attackWallTile` (`:7540-7568`): kamień, trafienie po `_schedule(700)`, `wallTileHp`, wyłom
//!   `_breachWallTile` (`:7638-7750`: kafel `Plains`, `wallEverBreached`, `_destroyTowerAtRow`, odwrót obrońców z korony,
//!   katapulta obrońcy `_startFade`, morale `MORALE_WALL_BREACH` + `_checkRout`);
//! - taran `_attackGate` (`:7310-7335`) i `_breachGate` (`:7757-7811`: `gateOpen`, kafle bramy, `MORALE_GATE_BREACH`);
//! - pozostałe gałęzie atakującego przy murze (krok doktryny, cios, strzelec, jazda, falanga, krok, odwrót) z bramką
//!   `_doMove` (`_siegeMoveRefused` + `_siegeShooterThreats`, `:8689`) i filtrem `_meleeBlockedByWall`.
//!
//! Wektory: `p6_k5loop_siege_atk_b_vectors/{vectors,vectors_nan,vectors_edge,vectors_retreat}.json`, generowane przez
//! `p6_k5loop_siege_atk_b_gen.mjs`, który WYKONUJE tekst pinu (strażnik SHA-256 wycinków).

use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::sync::mpsc;
use std::time::Duration;

use civ_engine::domain::diplomacy_aggressor::js_number_to_string;
use civ_engine::domain::siege_tactics_actions::{
    actions_to_dto, ActionError, BattleAction, TimedAction,
};
use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_approach::SiegeTowerRef;
use civ_engine::domain::siege_tactics_atk_b::{tower_destroyed_log, SiegeStructStats};
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, RollSource};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_step::DoctrineAction;
use civ_engine::domain::siege_tactics_doctrine_target::AttackDirection;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    LoopBody, ProdBody, ProdUnit, MOVE_STEP_MS, RANGED_FLY_MS,
};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_siege_atk_b_vectors/vectors.json");
const VECTORS_NAN: &str = include_str!("p6_k5loop_siege_atk_b_vectors/vectors_nan.json");
const VECTORS_EDGE: &str = include_str!("p6_k5loop_siege_atk_b_vectors/vectors_edge.json");
/// Obrona r1 (zarzut 3): odwrót z wyburzonego kafla rozstrzygany przez `dc = 3` i obrońca `fadingOut` na kaflu.
const VECTORS_RETREAT: &str = include_str!("p6_k5loop_siege_atk_b_vectors/vectors_retreat.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5loop_siege_atk_b_gen.mjs`).
const PIN_SHA256: &str = "489ddf8ec4d902b13ccd8e83109506ef34d3659b0657aef924f821661d441699";
/// Rzut strzału: pudło; generator ma atrapę `_singleBlow` = 0 obrażeń (jak T8).
const MISS_ROLL: f64 = 0.999_999;
/// Lekcja NaN: strażnik czasu testu (pętle marszu przy `moveLeft = NaN`).
const LOOP_GUARD: Duration = Duration::from_secs(90);
const BF_ROWS: i64 = 156;

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
fn same_f64(a: f64, b: f64) -> bool {
    a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan())
}
fn tag_of(u: UnitRef) -> String {
    match u.side {
        BattleSide::Attacker => format!("atk{}", u.idx),
        BattleSide::Defender => format!("def{}", u.idx),
    }
}

/// Teren z wektora: mur w `wallCol` nieprzechodni poza bramą otwartą na starcie (`gateRow - 1`, `gateRow`), kafle
/// specjalne. Ta sama reguła co `terrainMapOf` generatora (stan POCZĄTKOWY; wyburzenia nakłada ciało).
struct VecTerrain {
    wall_col: i64,
    gate_row: i64,
    gate_open: bool,
    tiles: BTreeMap<(i64, i64), (bool, f64, bool)>,
}

impl VecTerrain {
    fn from(t: &Value) -> Self {
        let mut tiles = BTreeMap::new();
        for x in t["tiles"].as_array().expect("tiles") {
            tiles.insert(
                (int(&x["c"]), int(&x["r"])),
                (b(&x["pass"]), num(&x["cost"]), b(&x["ford"])),
            );
        }
        VecTerrain {
            wall_col: int(&t["wallCol"]),
            gate_row: int(&t["gateRow"]),
            gate_open: b(&t["gateOpen"]),
            tiles,
        }
    }
    fn key(col: f64, row: f64) -> (i64, i64) {
        assert!(col.fract() == 0.0 && row.fract() == 0.0, "pole calkowite");
        (col as i64, row as i64)
    }
    fn wall(&self, c: i64, r: i64) -> bool {
        (0..BF_ROWS).contains(&r)
            && c == self.wall_col
            && !(self.gate_open && (r == self.gate_row - 1 || r == self.gate_row))
    }
}

impl MoveTerrain for VecTerrain {
    fn passable(&self, col: f64, row: f64) -> bool {
        let (c, r) = Self::key(col, row);
        !self.wall(c, r) && self.tiles.get(&(c, r)).is_none_or(|t| t.0)
    }
    fn move_cost(&self, col: f64, row: f64) -> f64 {
        self.tiles.get(&Self::key(col, row)).map_or(1.0, |t| t.1)
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.tiles.get(&Self::key(col, row)).is_some_and(|t| t.2)
    }
    fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
        // `cavalryTerrainMultiplier('Plaskie (rownina/laka)')` = 1 (generator to sprawdza).
        1.0
    }
}

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
        shooting_disabled: u["shootingEnabled"].as_bool() == Some(false),
        dry_col: num_or(&u["dryCol"], -1.0),
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: ranged_base && ammo > 0.0,
        is_siege_unit: bo(&u["siege"]),
        is_siege_tower: bo(&u["tower"]),
        is_ram: bo(&u["ram"]),
        is_catapult: bo(&u["cata"]),
        doctrine_auto,
        doctrine_manual: false,
    }
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

fn blow_targets(e: &Value) -> Vec<usize> {
    e["blows"]
        .as_array()
        .map(|bs| {
            bs.iter()
                .map(|x| x["target"].as_u64().expect("cel") as usize)
                .collect()
        })
        .unwrap_or_default()
}

fn stats_of(u: &Value) -> Option<SiegeStructStats> {
    let s = &u["resolvedStats"];
    if s.is_null() {
        return None;
    }
    Some(SiegeStructStats {
        wall_attack: num(&s["wallAttack"]),
        missile_attack: num(&s["missileAttack"]),
        impact: num(&s["impact"]),
        weapon_damage: num(&s["weaponDamage"]),
    })
}

/// Ciało i stan z wektora. `terrain = false` = ciało bez [`MoveTerrain`].
fn build(case: &Value, terrain: bool) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let acting = UnitRef {
        side: BattleSide::Attacker,
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    let e = &case["expect"];
    let wall_col = int(&case["wallCol"]);
    let doctrine_auto = b(&e["doctrineAuto"]);
    let attack = e["attack"]["target"].as_u64();
    let shots = blow_targets(e);
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let dead = b(&u["dead"]);
            let me = ix == 0 && i == acting.idx;
            let (melee_target, mblow) = match (me, attack) {
                (true, Some(t)) => (Some(t as usize), Some(blow(false))),
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
    let wall_tile_hp: Vec<(i64, f64)> = case["wallTiles"]
        .as_array()
        .expect("wallTiles")
        .iter()
        .map(|t| (int(&t[0]), num(&t[1])))
        .collect();
    let scene = ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col,
        gate_open: b(&case["gateOpen"]),
        wall_tile_hp,
        siege_machine_range: f64::NAN,
    };
    let rolls = CountRolls {
        values: vec![MISS_ROLL; shots.len()],
        used: 0,
    };
    let mut body = ProdBody::new(units, scene, rolls);
    if terrain {
        body = body.with_terrain(Box::new(VecTerrain::from(&case["terrain"])));
    }
    body.wall_ever_breached = b(&case["wallEverBreached"]);
    body.siege_gate_col = int(&case["gateCol"]);
    body.siege_gate_row = int(&case["gateRow"]);
    body.siege_wall_tiles_init = case["wallTilesInit"].as_u64().expect("init") as usize;
    body.tower_at_wall_rows = case["towerAtWallRows"]
        .as_array()
        .expect("towerAtWallRows")
        .iter()
        .map(int)
        .collect();
    body.gate_hp = num(&case["gateHp"]);
    body.siege_towers = case["towers"]
        .as_array()
        .expect("towers")
        .iter()
        .map(|t| SiegeTowerRef {
            destroyed: b(&t["destroyed"]),
            row: num(&t["row"]),
        })
        .collect();
    body.tower_range = num(&case["towerRange"]);
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let ds = &mut body.doctrine[ix][i];
            ds.unit_doctrine = u["unitDoctrine"]
                .as_str()
                .map(|s| GroupDoctrine::parse(s).expect("doktryna"));
            assert!(u["groupId"].is_null(), "scenariusze bez grup");
            ds.anti_cav_spear = bo(&u["antiCavSpear"]);
            ds.shooting_enabled = u["shootingEnabled"].as_bool().unwrap_or(true);
            let rb = bo(&u["rangedBase"]);
            body.ranged_base[ix][i] = rb;
            body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
            body.range_base[ix][i] = if rb { num_or(&u["range"], 1.0) } else { 0.0 };
            body.morale_max[ix][i] = num_or(&u["moraleMax"], 100.0);
            body.siege_machine_range[ix][i] = Some(num_or(&u["machRange"], 1.0));
            body.siege_stats[ix][i] = stats_of(u);
            body.attack_direction[ix][i] = match u["attackDirection"].as_str() {
                None | Some("front") => AttackDirection::Front,
                Some("bok") => AttackDirection::Bok,
                Some("tyl") => AttackDirection::Tyl,
                Some(other) => panic!("kierunek {other}"),
            };
        }
    }
    for t in &shots {
        body.ranged_blows[0][acting.idx].insert(*t, blow(true));
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

fn label(ev: &ActivateEvent) -> Option<String> {
    Some(match ev {
        ActivateEvent::Attack { .. }
        | ActivateEvent::Done
        | ActivateEvent::ResetPlayerOrder
        | ActivateEvent::UpdateMoraleBar
        | ActivateEvent::StartRout
        | ActivateEvent::PerformPlayerOrder => return None,
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
        ActivateEvent::DoctrineStep => "doctrine".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::RamTowerStep => "ramTower".into(),
        ActivateEvent::AdvanceToward { col, row } => format!("advanceToward:{col},{row}"),
        ActivateEvent::AttackWallTile { row } => format!("attackWallTile:{row}"),
        ActivateEvent::AdvanceStep => "advanceStep".into(),
        ActivateEvent::RangedAction => "rangedAction".into(),
        ActivateEvent::FallBackStep => "fallBackStep".into(),
        ActivateEvent::PhalanxAction => "phalanxAction".into(),
        ActivateEvent::CavalryAction => "cavalryAction".into(),
        ActivateEvent::Flee => "flee".into(),
    })
}

fn doctrine_label(a: DoctrineAction) -> Option<&'static str> {
    match a {
        DoctrineAction::Done | DoctrineAction::Attack(_) => None,
        DoctrineAction::CavalryAction => Some("cavalryAction"),
        DoctrineAction::RangedAction => Some("rangedAction"),
        DoctrineAction::AdvanceStep => Some("advanceStep"),
        DoctrineAction::MoveOrder { .. } => Some("playerOrder"),
    }
}

fn arc_of(s: &str) -> HitArc {
    match s {
        "front" => HitArc::Front,
        "flank" => HitArc::Flank,
        "rear" => HitArc::Rear,
        other => panic!("luk {other}"),
    }
}

fn unit_of(tag: &str) -> UnitRef {
    if let Some(i) = tag.strip_prefix("atk") {
        UnitRef {
            side: BattleSide::Attacker,
            idx: i.parse().expect("idx"),
        }
    } else {
        UnitRef {
            side: BattleSide::Defender,
            idx: tag.strip_prefix("def").expect("def").parse().expect("idx"),
        }
    }
}

/// Wynik jednej aktywacji (gałąź pinu dla liczników pokrycia).
struct CaseOut {
    branch: String,
}

/// Jedna aktywacja atakującego przy murze wobec pinu (czasy względem startu aktywacji) z odroczonymi wywołaniami.
fn check_case(case: &Value, failures: &mut Vec<String>) -> CaseOut {
    let name = case["name"].as_str().expect("name").to_string();
    let e = &case["expect"];
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, true);
    let mut fail = |what: &str, got: String, want: String| {
        failures.push(format!("{name}: {what}: rust={got} pin={want}"));
    };
    let wall_col = int(&case["wallCol"]);
    let gate_col = int(&case["gateCol"]);
    let init_terrain = VecTerrain::from(&case["terrain"]);
    body.set_now(0.0);
    let start_pos = body.unit_cell(acting).expect("pozycja");
    let dur = body.start(acting, &st);
    let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
    // Cios wręcz: generator kończy na `_doMeleeAttack` (zapis celu); sam cios pokrywają inne wektory (jak T8).
    if want_attack.is_none() {
        body.complete(acting, &mut st);
    }
    // Odroczone wywołania ciała (`_schedule(700)` kamienia katapulty) w chwili `ms` od startu.
    for (ms, id) in body.take_timers() {
        body.set_now(ms);
        body.fire_timer(id, &mut st);
    }
    let step = body
        .doctrine_steps
        .iter()
        .find(|(u, _)| *u == acting)
        .map(|(_, a)| *a);
    let mut got_trace: Vec<String> = body.trace[0].1.iter().filter_map(label).collect();
    if let Some(l) = step.and_then(doctrine_label) {
        got_trace.push(l.to_string());
    }
    let want_trace: Vec<String> = e["trace"]
        .as_array()
        .expect("trace")
        .iter()
        .map(|t| t.as_str().expect("t").to_string())
        .collect();
    if got_trace != want_trace {
        fail("slad", format!("{got_trace:?}"), format!("{want_trace:?}"));
    }
    if !same_f64(dur, num(&e["duration"])) {
        fail("czas", format!("{dur}"), format!("{}", e["duration"]));
    }
    // Stan końcowy jednostki działającej.
    let fin = &e["final"];
    let pos = body.unit_cell(acting).expect("pozycja");
    if pos != (int(&fin["q"]), int(&fin["r"])) {
        fail(
            "pozycja",
            format!("{pos:?}"),
            format!("({},{})", fin["q"], fin["r"]),
        );
    }
    let ml = st.unit(acting).c.move_left;
    if !same_f64(ml, num(&fin["moveLeft"])) {
        fail("moveLeft", format!("{ml}"), format!("{}", fin["moveLeft"]));
    }
    if body.facing(acting) != num(&fin["facing"]) {
        fail(
            "facing",
            format!("{}", body.facing(acting)),
            format!("{}", fin["facing"]),
        );
    }
    let a = &body.units[0][acting.idx].activate;
    if !same_f64(a.dry_col, num(&fin["dryCol"]))
        || a.held_after_fallback != b(&fin["heldAfterFallback"])
    {
        fail(
            "dryCol/held",
            format!("({}, {})", a.dry_col, a.held_after_fallback),
            format!("({}, {})", fin["dryCol"], fin["heldAfterFallback"]),
        );
    }
    if a.on_wall_walkway != b(&fin["onWall"]) {
        fail(
            "onWall",
            format!("{}", a.on_wall_walkway),
            format!("{}", fin["onWall"]),
        );
    }
    let ammo = body.ammo_left[0][acting.idx];
    if !same_f64(ammo, num(&fin["ammoLeft"])) {
        fail(
            "ammoLeft",
            format!("{ammo}"),
            format!("{}", fin["ammoLeft"]),
        );
    }
    if body.doctrine(acting).ranged_kite != b(&fin["rangedKite"]) {
        fail(
            "rangedKite",
            format!("{}", body.doctrine(acting).ranged_kite),
            format!("{}", fin["rangedKite"]),
        );
    }
    let lamf = body.doctrine(acting).last_auto_move_from;
    let want_lamf = fin["lastAutoMoveFrom"]
        .as_object()
        .map(|o| (int(&o["q"]), int(&o["r"])));
    if lamf != want_lamf {
        fail(
            "lastAutoMoveFrom",
            format!("{lamf:?}"),
            format!("{want_lamf:?}"),
        );
    }
    // Akcje jednostki działającej: zwroty, kroki, cios, strzał.
    let actions: Vec<TimedAction> = body.pending_actions().to_vec();
    let mut facing: Vec<(f64, f64)> = Vec::new();
    let mut moves: Vec<TimedAction> = Vec::new();
    let mut melee: Option<(usize, f64)> = None;
    let mut shot: Option<(usize, f64, f64, f64)> = None;
    for (k, ta) in actions.iter().enumerate() {
        let next = actions.get(k + 1).map(|n| &n.action);
        match &ta.action {
            BattleAction::Facing { unit, dir } if *unit == acting => match next {
                Some(BattleAction::Melee { attacker, .. }) if *attacker == acting => {}
                Some(BattleAction::Shot {
                    attacker,
                    target,
                    land_at,
                }) if *attacker == acting => shot = Some((target.idx, ta.t0, *land_at, *dir)),
                _ => facing.push((ta.t0, *dir)),
            },
            BattleAction::Move { unit, .. } if *unit == acting => moves.push(ta.clone()),
            BattleAction::Melee {
                attacker, target, ..
            } if *attacker == acting => {
                melee = Some((target.idx, ta.t0));
            }
            _ => {}
        }
    }
    let want_facing: Vec<(f64, f64)> = e["facing"]
        .as_array()
        .expect("facing")
        .iter()
        .map(|f| (num(&f["t"]), num(&f["dir"])))
        .collect();
    if facing != want_facing {
        fail(
            "zmiany facing",
            format!("{facing:?}"),
            format!("{want_facing:?}"),
        );
    }
    let mut want_moves: Vec<TimedAction> = Vec::new();
    let mut prev = start_pos;
    for s in e["steps"].as_array().expect("steps") {
        let to = (int(&s["col"]), int(&s["row"]));
        let t0 = num(&s["t"]);
        want_moves.push(TimedAction {
            t0,
            action: BattleAction::Move {
                unit: acting,
                from: prev,
                to,
                arrive_at: t0 + MOVE_STEP_MS,
            },
        });
        prev = to;
    }
    if moves != want_moves {
        fail("Move", format!("{moves:?}"), format!("{want_moves:?}"));
    }
    let want_melee = want_attack.map(|t| (t, num(&e["attack"]["t"])));
    if melee != want_melee {
        fail("cios", format!("{melee:?}"), format!("{want_melee:?}"));
    }
    let blows = e["blows"].as_array().expect("blows");
    let want_shot = blows.first().map(|x| {
        let hit = num(&x["t"]);
        (
            x["target"].as_u64().expect("cel") as usize,
            hit - RANGED_FLY_MS,
            hit,
            num(&x["facing"]),
        )
    });
    if shot != want_shot {
        fail("strzal", format!("{shot:?}"), format!("{want_shot:?}"));
    }
    if let Some(x) = blows.first() {
        match body.blows.first() {
            Some(rec)
                if rec.attacker == acting
                    && rec.target.idx == x["target"].as_u64().expect("cel") as usize
                    && rec.hit_arc == arc_of(x["hitArc"].as_str().expect("luk"))
                    && rec.missed => {}
            other => fail("trafienie", format!("{other:?}"), format!("{x}")),
        }
    }
    if body.rolls.used != blows.len() {
        fail(
            "rzuty",
            format!("{}", body.rolls.used),
            format!("{}", blows.len()),
        );
    }
    // Stan wszystkich jednostek po aktywacji i odroczonych wywołaniach (wyłom: odwrót, katapulta, morale, rout).
    for u in e["units"].as_array().expect("units") {
        let r = unit_of(u["unit"].as_str().expect("unit"));
        let six = usize::from(r.side == BattleSide::Defender);
        let au = &body.units[six][r.idx].activate;
        let c = st.unit(r).c;
        let got = (au.q, au.r, au.on_wall_walkway, c.routed, c.dead, c.removed);
        let want = (
            int(&u["q"]),
            int(&u["r"]),
            b(&u["onWall"]),
            b(&u["routed"]),
            b(&u["dead"]),
            b(&u["removed"]),
        );
        if got != want {
            fail(
                &format!("jednostka {}", u["unit"]),
                format!("{got:?}"),
                format!("{want:?}"),
            );
        }
        if !same_f64(c.morale, num(&u["morale"])) {
            fail(
                &format!("morale {}", u["unit"]),
                format!("{}", c.morale),
                format!("{}", u["morale"]),
            );
        }
        if body.facing(r) != num(&u["facing"]) {
            fail(
                &format!("facing {}", u["unit"]),
                format!("{}", body.facing(r)),
                format!("{}", u["facing"]),
            );
        }
    }
    // Stan muru, bramy i wież.
    let want_hp: Vec<(i64, f64)> = e["wallTileHp"]
        .as_array()
        .expect("wallTileHp")
        .iter()
        .map(|t| (int(&t[0]), num(&t[1])))
        .collect();
    let got_hp = &body.scene.wall_tile_hp;
    if got_hp.len() != want_hp.len()
        || got_hp
            .iter()
            .zip(&want_hp)
            .any(|(g, w)| g.0 != w.0 || !same_f64(g.1, w.1))
    {
        fail("wallTileHp", format!("{got_hp:?}"), format!("{want_hp:?}"));
    }
    if !same_f64(body.gate_hp, num(&e["gateHp"])) {
        fail(
            "gateHp",
            format!("{}", body.gate_hp),
            format!("{}", e["gateHp"]),
        );
    }
    if body.scene.gate_open != b(&e["gateOpen"]) {
        fail(
            "gateOpen",
            format!("{}", body.scene.gate_open),
            format!("{}", e["gateOpen"]),
        );
    }
    if body.wall_ever_breached != b(&e["wallEverBreached"]) {
        fail(
            "wallEverBreached",
            format!("{}", body.wall_ever_breached),
            format!("{}", e["wallEverBreached"]),
        );
    }
    if body.last_attacked_wall_row != int(&e["lastAttackedWallRow"]) {
        fail(
            "lastAttackedWallRow",
            format!("{}", body.last_attacked_wall_row),
            format!("{}", e["lastAttackedWallRow"]),
        );
    }
    let got_td: Vec<bool> = body.siege_towers.iter().map(|t| t.destroyed).collect();
    let want_td: Vec<bool> = e["towersDestroyed"]
        .as_array()
        .expect("td")
        .iter()
        .map(b)
        .collect();
    if got_td != want_td {
        fail(
            "wieze zburzone",
            format!("{got_td:?}"),
            format!("{want_td:?}"),
        );
    }
    let want_twr: BTreeSet<i64> = e["towerAtWallRows"]
        .as_array()
        .expect("twr")
        .iter()
        .map(int)
        .collect();
    if body.tower_at_wall_rows != want_twr {
        fail(
            "towerAtWallRows",
            format!("{:?}", body.tower_at_wall_rows),
            format!("{want_twr:?}"),
        );
    }
    // Kafle zamienione na `Plains` (wyburzenie kafla muru / bramy): przechodniość terenu ciała.
    let want_plains: BTreeSet<(i64, i64)> = e["plains"]
        .as_array()
        .expect("plains")
        .iter()
        .map(|p| {
            assert_eq!(int(&p[2]), 0, "{name}: kafel zamieniony na Plains");
            (int(&p[0]), int(&p[1]))
        })
        .collect();
    let mut got_plains: BTreeSet<(i64, i64)> = BTreeSet::new();
    for col in [wall_col, gate_col] {
        if col < 0 {
            continue;
        }
        for row in 0..BF_ROWS {
            let now = body.terrain_passable(col, row).expect("teren");
            let before = init_terrain.passable(col as f64, row as f64);
            if now != before {
                got_plains.insert((col, row));
            }
        }
    }
    if got_plains != want_plains {
        fail(
            "kafle Plains",
            format!("{got_plains:?}"),
            format!("{want_plains:?}"),
        );
    }
    // Akcje muru i bramy (kolejność wywołań sceny pinu) i dziennik wież.
    let mut got_order: Vec<String> = Vec::new();
    let mut got_logs: Vec<String> = Vec::new();
    let mut wall_labels: Vec<(i64, String, f64)> = Vec::new();
    for ta in &actions {
        match &ta.action {
            BattleAction::Ram { unit, until } => {
                assert_eq!(*unit, acting);
                assert!(same_f64(*until, ta.t0 + 320.0), "{name}: Ram until");
                got_order.push("RAM".into());
            }
            BattleAction::Boulder { unit, row, land_at } => {
                assert_eq!(*unit, acting);
                assert!(same_f64(*land_at, ta.t0 + 700.0), "{name}: Boulder land_at");
                let _ = row;
                got_order.push("BOULDER".into());
            }
            BattleAction::WallDamage { row, dmg, .. } => {
                got_order.push(format!("LABEL:{row}"));
                wall_labels.push((*row, format!("-{} (mur)", js_number_to_string(*dmg)), ta.t0));
            }
            BattleAction::WallBreach { row } => {
                got_order.push(format!("LABEL:{row}"));
                wall_labels.push((*row, "MUR WYBURZONY!".into(), ta.t0));
            }
            BattleAction::TowerDestroyed { row } => got_order.push(format!("TOWER:{row}")),
            // `LeaveField` (zejście z wyburzonego kafla, `:7704-7741`): `from` = kafel muru, `to` = pole po odwrocie
            // z pinu (stan końcowy jednostki; `to == from`, gdy jednostka zostaje), obrońca już nie na murze.
            BattleAction::LeaveField { unit, from, to } => {
                let want = e["units"]
                    .as_array()
                    .expect("units")
                    .iter()
                    .find(|u| unit_of(u["unit"].as_str().expect("unit")) == *unit)
                    .map(|u| ((int(&u["q"]), int(&u["r"])), b(&u["onWall"])));
                let breached = actions
                    .iter()
                    .any(|a| matches!(a.action, BattleAction::WallBreach { row } if row == from.1));
                if unit.side != BattleSide::Defender || want != Some((*to, false)) || !breached {
                    fail(
                        "LeaveField",
                        format!("{unit:?} {from:?} -> {to:?}"),
                        format!("{want:?}"),
                    );
                }
            }
            BattleAction::Rout { unit } => got_order.push(format!("R:{}", tag_of(*unit))),
            BattleAction::Kill { unit } => got_order.push(format!("K:{}", tag_of(*unit))),
            BattleAction::Leave { unit } => got_order.push(format!("L:{}", tag_of(*unit))),
            BattleAction::Shaken { unit, .. } => got_order.push(format!("S:{}", tag_of(*unit))),
            BattleAction::Log { text } if text.starts_with("Wieza strzelnicza w wy") => {
                got_logs.push(text.clone());
            }
            _ => {}
        }
    }
    let want_order: Vec<String> = e["order"]
        .as_array()
        .expect("order")
        .iter()
        .map(|x| x.as_str().expect("o").to_string())
        .collect();
    if got_order != want_order {
        fail(
            "kolejnosc akcji sceny",
            format!("{got_order:?}"),
            format!("{want_order:?}"),
        );
    }
    let want_logs: Vec<String> = e["log"]
        .as_array()
        .expect("log")
        .iter()
        .map(|x| x.as_str().expect("l").to_string())
        .collect();
    if got_logs != want_logs {
        fail(
            "dziennik wiez",
            format!("{got_logs:?}"),
            format!("{want_logs:?}"),
        );
    }
    for l in &got_logs {
        assert!(want_logs.contains(l));
    }
    let want_labels: Vec<(i64, String, f64)> = e["labels"]
        .as_array()
        .expect("labels")
        .iter()
        .map(|l| {
            (
                int(&l["row"]),
                l["text"].as_str().expect("text").to_string(),
                num(&l["t"]),
            )
        })
        .collect();
    if wall_labels != want_labels {
        fail(
            "etykiety muru",
            format!("{wall_labels:?}"),
            format!("{want_labels:?}"),
        );
    }
    // Chwile routów, zabić (katapulta obrońcy) i ram/kamienia.
    let times = |kind: &str| -> Vec<(String, f64)> {
        e[kind]
            .as_array()
            .expect("lista")
            .iter()
            .map(|x| (x["unit"].as_str().unwrap_or("").to_string(), num(&x["t"])))
            .collect()
    };
    let got_routs: Vec<(String, f64)> = actions
        .iter()
        .filter_map(|ta| match ta.action {
            BattleAction::Rout { unit } => Some((tag_of(unit), ta.t0)),
            _ => None,
        })
        .collect();
    if got_routs != times("routs") {
        fail(
            "routy",
            format!("{got_routs:?}"),
            format!("{:?}", times("routs")),
        );
    }
    let got_kills: Vec<(String, f64)> = actions
        .iter()
        .filter_map(|ta| match ta.action {
            BattleAction::Kill { unit } => Some((tag_of(unit), ta.t0)),
            _ => None,
        })
        .collect();
    if got_kills != times("kills") {
        fail(
            "zabicia",
            format!("{got_kills:?}"),
            format!("{:?}", times("kills")),
        );
    }
    let ram_t: Vec<f64> = actions
        .iter()
        .filter(|ta| matches!(ta.action, BattleAction::Ram { .. }))
        .map(|ta| ta.t0)
        .collect();
    let want_ram_t: Vec<f64> = e["rams"]
        .as_array()
        .expect("rams")
        .iter()
        .map(|x| num(&x["t"]))
        .collect();
    if ram_t != want_ram_t {
        fail("taran t", format!("{ram_t:?}"), format!("{want_ram_t:?}"));
    }
    let boulder_t: Vec<f64> = actions
        .iter()
        .filter(|ta| matches!(ta.action, BattleAction::Boulder { .. }))
        .map(|ta| ta.t0)
        .collect();
    let want_boulder_t: Vec<f64> = e["boulders"]
        .as_array()
        .expect("boulders")
        .iter()
        .map(|x| num(&x["t"]))
        .collect();
    if boulder_t != want_boulder_t {
        fail(
            "kamien t",
            format!("{boulder_t:?}"),
            format!("{want_boulder_t:?}"),
        );
    }
    // Zajętość pól.
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
        fail(
            "occByKey",
            format!("{:?}", body.occ_by_key()),
            format!("{want_occ:?}"),
        );
    }
    // Rozkaz ruchu kroku doktryny (`_performPlayerOrder`, K5EXEC-T3): jedyny dozwolony tag.
    let want_order_dest = e["orderDest"]
        .as_object()
        .map(|o| (int(&o["col"]), int(&o["row"])));
    let got_order_dest = match step {
        Some(DoctrineAction::MoveOrder { col, row }) => Some((col, row)),
        _ => None,
    };
    if got_order_dest != want_order_dest {
        fail(
            "rozkaz ruchu",
            format!("{got_order_dest:?}"),
            format!("{want_order_dest:?}"),
        );
    }
    let want_unported: Vec<(UnitRef, &'static str)> = if want_order_dest.is_some() {
        vec![(acting, "doktryna-rozkaz-ruchu")]
    } else {
        Vec::new()
    };
    if body.unported != want_unported {
        fail(
            "unported",
            format!("{:?}", body.unported),
            format!("{want_unported:?}"),
        );
    }
    CaseOut {
        branch: e["branch"].as_str().expect("branch").to_string(),
    }
}

fn run_family(src: &'static str) -> (Vec<String>, HashMap<String, usize>, usize) {
    let v = load_from(src);
    let mut failures = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    let cases = v["cases"].as_array().expect("cases");
    for case in cases {
        let out = check_case(case, &mut failures);
        *cov.entry(out.branch).or_default() += 1;
    }
    (failures, cov, cases.len())
}

fn guarded(label: &'static str, src: &'static str) -> (Vec<String>, HashMap<String, usize>, usize) {
    let (tx, rx) = mpsc::channel();
    std::thread::Builder::new()
        .name(label.into())
        .stack_size(64 * 1024 * 1024)
        .spawn(move || {
            let _ = tx.send(run_family(src));
        })
        .expect("watek");
    rx.recv_timeout(LOOP_GUARD).unwrap_or_else(|_| {
        panic!("{label}: przekroczony strażnik czasu {LOOP_GUARD:?} (pętla bez końca?)")
    })
}

fn report(label: &str, failures: &[String]) {
    assert!(
        failures.is_empty(),
        "{label}: {} rozbieżności z pinem, pierwsze:\n{}",
        failures.len(),
        failures
            .iter()
            .take(15)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

fn at_least(cov: &HashMap<String, usize>, key: &str, n: usize) {
    let got = cov.get(key).copied().unwrap_or(0);
    assert!(got >= n, "pokrycie {key}: {got} < {n} ({cov:?})");
}

#[test]
fn zgodnosc_z_pinem_atakujacy_przy_murze_czesc_b() {
    let (failures, cov, n) = guarded("baza", VECTORS);
    report("baza", &failures);
    assert!(n >= 1500, "liczba wektorow {n}");
    // Dokładne nazwy liczników pokrycia (gałąź pinu wykonana przez wektor, `branchOf` generatora).
    at_least(&cov, "wall-breach", 100);
    at_least(&cov, "wall-hit", 50);
    at_least(&cov, "cata-toward", 100);
    at_least(&cov, "gate-breach", 80);
    at_least(&cov, "gate-hit", 40);
    at_least(&cov, "gate-guard", 10);
    at_least(&cov, "ram-move", 20);
    at_least(&cov, "doc-advance-move", 100);
    at_least(&cov, "doc-advance-refused", 40);
    at_least(&cov, "advance-refused", 10);
    at_least(&cov, "doc-cav", 50);
    at_least(&cov, "doc-cav-refused", 5);
    at_least(&cov, "cav-refused", 3);
    at_least(&cov, "ranged-refused", 3);
    at_least(&cov, "doc-ranged-refused", 5);
    at_least(&cov, "phalanx-refused", 5);
    at_least(&cov, "ranged-shot", 40);
    at_least(&cov, "doc-order", 50);
    at_least(&cov, "doc-attack", 20);
    at_least(&cov, "attack", 15);
    at_least(&cov, "fallback", 3);
}

#[test]
fn zgodnosc_z_pinem_nan() {
    let (failures, cov, n) = guarded("nan", VECTORS_NAN);
    report("nan", &failures);
    assert!(n >= 400, "liczba wektorow NaN {n}");
    at_least(&cov, "wall-breach", 30);
    at_least(&cov, "gate-breach", 40);
    at_least(&cov, "gate-hit", 30);
    at_least(&cov, "doc-advance-refused", 5);
}

#[test]
fn zgodnosc_z_pinem_krawedzie_planszy() {
    let (failures, cov, n) = guarded("krawedzie", VECTORS_EDGE);
    report("krawedzie", &failures);
    assert!(n >= 250, "liczba wektorow krawedzi {n}");
    at_least(&cov, "wall-breach", 40);
    at_least(&cov, "ram-move", 20);
}

/// Obrona r1 (zarzut 3, mutanty E14/E11): `_breachWallTile` `:7697-7741`. (a) pola `dc = 1` i `dc = 2` zajęte albo
/// nieprzejezdne: o polu odwrotu decyduje `dc = 3` (`:7719`); (b) obrońca `fadingOut` na wyburzonym kaflu jest pomijany
/// (`:7698`) i zostaje na polu i na koronie. Każdy przypadek porównuje pełny stan z pinem (`check_case`); liczniki z
/// generatora (`retreatDc3`, `retreatSkipFading`) liczy też test z wektora.
#[test]
fn zgodnosc_z_pinem_odwrot_z_muru() {
    let (failures, cov, n) = guarded("odwrot", VECTORS_RETREAT);
    report("odwrot", &failures);
    assert!(n >= 90, "liczba wektorow odwrotu {n}");
    at_least(&cov, "wall-breach", 90);
    let v = load_from(VECTORS_RETREAT);
    let (mut dc3, mut skip) = (0i64, 0i64);
    for c in v["cases"].as_array().expect("cases") {
        let w = int(&c["wallCol"]);
        let wr = int(&c["expect"]["lastAttackedWallRow"]);
        let start: Vec<&Value> = c["atk"]
            .as_array()
            .expect("atk")
            .iter()
            .chain(c["def"].as_array().expect("def"))
            .collect();
        for (s, u) in start
            .iter()
            .zip(c["expect"]["units"].as_array().expect("units"))
        {
            if s["side"] != "def" || !b(&s["onWall"]) || int(&s["q"]) != w || int(&s["r"]) != wr {
                continue;
            }
            if b(&s["fadingOut"]) {
                assert!(b(&u["onWall"]) && int(&u["q"]) == w && int(&u["r"]) == wr);
                skip += 1;
            } else if !b(&u["onWall"]) && int(&u["q"]) == (w + 3).min(67) {
                dc3 += 1;
            }
        }
    }
    assert_eq!(dc3, v["stats"]["retreatDc3"].as_i64().expect("retreatDc3"));
    assert_eq!(
        skip,
        v["stats"]["retreatSkipFading"]
            .as_i64()
            .expect("retreatSkipFading")
    );
    assert!(dc3 >= 30, "retreatDc3 {dc3}");
    assert!(skip >= 15, "retreatSkipFading {skip}");
}

/// Statystyki generatora (liczniki pokrycia skutków wyłomu) — nazwy jak w `statsFor` generatora.
#[test]
fn pokrycie_skutkow_wylomu() {
    let mut total: HashMap<&str, i64> = HashMap::new();
    for src in [VECTORS, VECTORS_NAN, VECTORS_EDGE] {
        let v = load_from(src);
        for k in [
            "retreatMoved",
            "retreatStuck",
            "cataKilled",
            "towerDestroyed",
            "gateBreach",
            "routsAfterBreach",
            "refusedMoves",
        ] {
            *total.entry(k).or_default() += v["stats"][k].as_i64().expect("licznik");
        }
    }
    for (k, min) in [
        ("retreatMoved", 40),
        ("retreatStuck", 3),
        ("cataKilled", 3),
        ("towerDestroyed", 15),
        ("gateBreach", 100),
        ("routsAfterBreach", 150),
        ("refusedMoves", 100),
    ] {
        assert!(total[k] >= min, "pokrycie {k}: {} < {min}", total[k]);
    }
}

/// Kryterium zamknięcia tagu `oblezenie`: dla atakującego przy murze ciało nie zapisuje żadnego tagu oblężniczego; bez
/// terenu tylko jawne tagi wejścia adaptera (`*-brak-terenu`, `wylom-brak-terenu`), bez statystyk machin
/// `*-bez-szablonu`.
#[test]
fn brak_tagow_oblezniczych_dla_atakujacego() {
    const SIEGE: [&str; 8] = [
        "wieza-wejscie",
        "piechota-do-wiezy",
        "taran-wieza",
        "atak-muru",
        "atak-bramy",
        "marsz",
        "oblezenie",
        "oblezenie-odmowa-ruchu",
    ];
    let mut seen_missing = 0usize;
    for src in [VECTORS, VECTORS_NAN, VECTORS_EDGE, VECTORS_RETREAT] {
        let v = load_from(src);
        for case in v["cases"].as_array().expect("cases") {
            for terrain in [true, false] {
                let Built {
                    mut body,
                    mut st,
                    acting,
                } = build(case, terrain);
                // Bez statystyk machin (`None`) = jawny tag wejścia adaptera.
                let strip = case["kind"] == "cata" && !terrain;
                if strip {
                    body.siege_stats[0][acting.idx] = None;
                }
                let _ = body.start(acting, &st);
                if case["expect"]["attack"].is_null() {
                    body.complete(acting, &mut st);
                }
                for (ms, id) in body.take_timers() {
                    body.set_now(ms);
                    body.fire_timer(id, &mut st);
                }
                for (u, t) in &body.unported {
                    assert_eq!(*u, acting);
                    assert!(
                        !SIEGE.contains(t) && !t.starts_with("oblezenie"),
                        "{}: tag oblezniczy {t}",
                        case["name"]
                    );
                    if terrain {
                        assert_eq!(*t, "doktryna-rozkaz-ruchu", "{}: tag {t}", case["name"]);
                    } else {
                        assert!(
                            t.ends_with("-brak-terenu")
                                || t.ends_with("-bez-szablonu")
                                || *t == "doktryna-rozkaz-ruchu",
                            "{}: tag {t}",
                            case["name"]
                        );
                        seen_missing += 1;
                    }
                }
            }
        }
    }
    assert!(
        seen_missing > 100,
        "jawne tagi wejscia bez terenu: {seen_missing}"
    );
}

/// Akcje T2b nie mają jeszcze wariantów DTO (I5b #370): jawny błąd, bez cichego pominięcia.
#[test]
fn akcje_muru_i_bramy_bez_dto_jawny_blad() {
    let v = load_from(VECTORS);
    let mut checked = 0usize;
    for case in v["cases"].as_array().expect("cases") {
        if !matches!(
            case["expect"]["branch"].as_str(),
            Some("wall-breach" | "gate-breach")
        ) {
            continue;
        }
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, true);
        let _ = body.start(acting, &st);
        body.complete(acting, &mut st);
        for (ms, id) in body.take_timers() {
            body.set_now(ms);
            body.fire_timer(id, &mut st);
        }
        let actions = body.take_actions();
        let first = actions
            .iter()
            .find(|a| {
                matches!(
                    a.action,
                    BattleAction::Ram { .. }
                        | BattleAction::Boulder { .. }
                        | BattleAction::GateDamage { .. }
                        | BattleAction::WallDamage { .. }
                        | BattleAction::WallBreach { .. }
                        | BattleAction::GateBreach
                        | BattleAction::TowerDestroyed { .. }
                        | BattleAction::LeaveField { .. }
                )
            })
            .expect("akcja muru/bramy");
        let only = vec![first.clone()];
        let err = actions_to_dto(&only, &st).expect_err("brak DTO");
        let ok = matches!(
            (&first.action, &err),
            (BattleAction::Ram { .. }, ActionError::RamWithoutDto(_))
                | (
                    BattleAction::Boulder { .. },
                    ActionError::BoulderWithoutDto(_)
                )
                | (
                    BattleAction::GateDamage { .. },
                    ActionError::GateDamageWithoutDto
                )
                | (
                    BattleAction::WallDamage { .. },
                    ActionError::WallDamageWithoutDto(_)
                )
                | (
                    BattleAction::WallBreach { .. },
                    ActionError::WallBreachWithoutDto(_)
                )
                | (BattleAction::GateBreach, ActionError::GateBreachWithoutDto)
                | (
                    BattleAction::TowerDestroyed { .. },
                    ActionError::TowerDestroyedWithoutDto(_)
                )
                | (
                    BattleAction::LeaveField { .. },
                    ActionError::LeaveFieldWithoutDto(_)
                )
        );
        assert!(ok, "{}: {:?} -> {err:?}", case["name"], first.action);
        checked += 1;
    }
    assert!(checked >= 150, "sprawdzone {checked}");
    // Każdy wariant osobno.
    let u = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };
    let st = build(&v["cases"][0], true).st;
    for (a, want) in [
        (BattleAction::GateBreach, "GateBreachWithoutDto"),
        (
            BattleAction::TowerDestroyed { row: 3 },
            "TowerDestroyedWithoutDto(3)",
        ),
        (
            BattleAction::WallBreach { row: 4 },
            "WallBreachWithoutDto(4)",
        ),
        (
            BattleAction::LeaveField {
                unit: u,
                from: (1, 1),
                to: (2, 1),
            },
            "LeaveFieldWithoutDto",
        ),
        (
            BattleAction::GateDamage {
                dmg: 1.0,
                hp_after: 2.0,
            },
            "GateDamageWithoutDto",
        ),
        (
            BattleAction::WallDamage {
                row: 5,
                dmg: 1.0,
                hp_after: 2.0,
            },
            "WallDamageWithoutDto(5)",
        ),
        (
            BattleAction::Ram {
                unit: u,
                until: 320.0,
            },
            "RamWithoutDto",
        ),
        (
            BattleAction::Boulder {
                unit: u,
                row: 2,
                land_at: 700.0,
            },
            "BoulderWithoutDto",
        ),
    ] {
        let err = actions_to_dto(&[TimedAction { t0: 0.0, action: a }], &st).expect_err("brak DTO");
        assert!(format!("{err:?}").starts_with(want), "{err:?} != {want}");
    }
    let _ = tower_destroyed_log(1);
}

/// Ciało-atrapa sterownika: pierwsza aktywacja atakującego planuje odroczone wywołanie (jak `_schedule(700)` kamienia
/// katapulty), którego odpalenie wyburza kafel muru w wierszu 5 (akcja `WallBreach`, flaga wyłomu ciała).
#[derive(Default)]
struct MockBody {
    now: f64,
    start_at: Option<f64>,
    fired: Vec<(u64, f64)>,
    timers: Vec<(f64, u64)>,
    actions: Vec<TimedAction>,
    breached: bool,
    towers_destroyed: Vec<i64>,
}

impl LoopBody for MockBody {
    fn start(&mut self, unit: UnitRef, _st: &TurnSeqState) -> f64 {
        if unit.side == BattleSide::Attacker && self.start_at.is_none() {
            self.start_at = Some(self.now);
            self.timers.push((700.0, 7));
        }
        0.0
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
    fn set_now(&mut self, v_now: f64) {
        self.now = v_now;
    }
    fn take_actions(&mut self) -> Vec<TimedAction> {
        std::mem::take(&mut self.actions)
    }
    fn take_timers(&mut self) -> Vec<(f64, u64)> {
        std::mem::take(&mut self.timers)
    }
    fn fire_timer(&mut self, id: u64, _st: &mut TurnSeqState) {
        self.fired.push((id, self.now));
        self.actions.push(TimedAction {
            t0: self.now,
            action: BattleAction::WallBreach { row: 5 },
        });
        self.breached = true;
    }
    fn wall_ever_breached(&self) -> bool {
        self.breached
    }
    fn on_tower_destroyed(&mut self, row: i64) {
        self.towers_destroyed.push(row);
    }
}

/// K5LOOP-SIEGE-ATK-B (dług T2a): sterownik wstawia odroczone wywołanie ciała do zegara (`_schedule(700)` z wnętrza
/// `_attackWallTile`) i po odpaleniu synchronizuje stan muru sterownika ze stanem ciała: wiersz kafla znika z
/// `wall_tile_rows`, `wall_ever_breached` (sufit tur bez wyłomu, koniec bitwy), wieża w wyłomie zburzona; wieża bez kafla
/// zburzona przez sterownik trafia do ciała (`on_tower_destroyed`, zagrożenia `_siegeShooterThreats`).
#[test]
fn sterownik_synchronizuje_wylom_z_cialem() {
    use civ_engine::domain::siege_tactics_clock::VirtualClock;
    use civ_engine::domain::siege_tactics_loop::{
        neutral_tower_shot_template, LoopTimer, SiegeEnv, SiegeLoop,
    };
    let cu = |hp: f64| CombatUnit {
        hp,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 1.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    };
    let st = TurnSeqState {
        atk: vec![SeqUnit {
            id: 1,
            c: cu(100.0),
        }],
        def: vec![SeqUnit {
            id: 2,
            c: cu(100.0),
        }],
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: 30,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    let env = SiegeEnv {
        body: MockBody::default(),
        tower_rows: vec![5, 9, 5],
        pending_tower_shots: Vec::new(),
        tower_range: 2.0,
        tower_shot: Some(neutral_tower_shot_template()),
        wall_tile_rows: vec![4, 5, 6],
        wall_ever_breached: false,
        no_breach_cap: 1_000_000,
        move_points: [vec![1.0], vec![1.0]],
        morale_max: [vec![100.0], vec![100.0]],
    };
    let mut sl = SiegeLoop::new(st, env);
    let mut clock: VirtualClock<LoopTimer> = VirtualClock::new();
    let _ = sl.run(&mut clock, 400);
    let body = &sl.env.body;
    let start_at = body.start_at.expect("aktywacja atakujacego");
    // Termin `due = vNow + 700` (`_schedule`); odpalenie w pierwszej klatce zegara (krok 16 ms) z `vNow >= due`.
    assert_eq!(body.fired.len(), 1, "jedno odpalenie");
    let (id, at) = body.fired[0];
    assert_eq!(id, 7);
    assert!(
        at >= start_at + 700.0 && at < start_at + 700.0 + 16.0,
        "odpalenie po 700 ms: start {start_at}, odpalenie {at}"
    );
    assert_eq!(sl.env.wall_tile_rows, vec![4, 6]);
    assert!(sl.env.wall_ever_breached);
    // Wieża bez kafla (wiersz 9) zburzona przez sterownik i przekazana ciału; w wyłomie wiersza 5 zburzona PIERWSZA
    // niezburzona wieża tego wiersza (indeks 0).
    assert_eq!(body.towers_destroyed.first(), Some(&9));
    assert!(sl.tower_destroyed(0));
    assert!(sl.tower_destroyed(1));
    assert!(
        sl.actions()
            .iter()
            .any(|a| matches!(a.action, BattleAction::WallBreach { row: 5 })),
        "akcja ciala przekazana do sterownika"
    );
}

/// Ciało-atrapa wyłomu BRAMY (Obrona r1, zarzut 1 / E06): `_attackGate` -> `_breachGate` (`battleScene.ts:7757-7759`:
/// `gateOpen = true; wallEverBreached = true`) ustawia flagę ciała synchronicznie w aktywacji, BEZ akcji
/// [`BattleAction::WallBreach`] (brama nie jest kaflem `wallTileHp`, `wall_tile_rows` bez zmian). Jedyną drogą do
/// sterownika jest [`LoopBody::wall_ever_breached`] w `drain_body`. `breach = false` = bliźniak bez wyłomu.
struct GateBreachBody {
    breach: bool,
    breached: bool,
    starts: usize,
}

impl LoopBody for GateBreachBody {
    fn start(&mut self, unit: UnitRef, _st: &TurnSeqState) -> f64 {
        self.starts += 1;
        if self.breach && unit.side == BattleSide::Attacker {
            self.breached = true;
        }
        0.0
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
    fn set_now(&mut self, _v_now: f64) {}
    fn take_actions(&mut self) -> Vec<TimedAction> {
        Vec::new()
    }
    fn wall_ever_breached(&self) -> bool {
        self.breached
    }
}

/// K5LOOP-SIEGE-ATK-B, Obrona r1 (zarzut 1): wyłom bramy w ciele przechodzi do sterownika wyłącznie przez
/// `body.wall_ever_breached()` (`drain_body`). Skutek w sterowniku = `_roundCapVerdict` (`battleScene.ts:9449-9464`):
/// mur bez wyłomu kończy bitwę REMISEM po `siegeNoBreachMaxRounds` (tu 2), po wyłomie sufit to `FF_MAX_ROUNDS`.
/// Bez synchronizacji oba przebiegi kończą się remisem po 2 rundach.
#[test]
fn sterownik_przejmuje_wylom_bramy_z_ciala_bez_akcji_wallbreach() {
    use civ_engine::domain::siege_tactics_clock::VirtualClock;
    use civ_engine::domain::siege_tactics_fastforward::FfStop;
    use civ_engine::domain::siege_tactics_loop::{LoopTimer, SiegeEnv, SiegeLoop};
    let cu = || CombatUnit {
        hp: 100.0,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 1.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    };
    let run = |breach: bool| {
        let st = TurnSeqState {
            atk: vec![SeqUnit { id: 1, c: cu() }],
            def: vec![SeqUnit { id: 2, c: cu() }],
            turn_order: Vec::new(),
            turn_idx: 0,
            round_no: 0,
            siege_wall_col: 30,
            manual_mode: false,
            player_side: BattleSide::Attacker,
            finished: false,
            awaiting_orders: false,
            auto_battle_suspended: false,
            busy: false,
            auto_batch_planning: false,
            queued_order_ids: BTreeSet::new(),
        };
        let env = SiegeEnv {
            body: GateBreachBody {
                breach,
                breached: false,
                starts: 0,
            },
            tower_rows: Vec::new(),
            pending_tower_shots: Vec::new(),
            tower_range: 2.0,
            tower_shot: None,
            wall_tile_rows: vec![4, 5, 6],
            wall_ever_breached: false,
            no_breach_cap: 2,
            move_points: [vec![1.0], vec![1.0]],
            morale_max: [vec![100.0], vec![100.0]],
        };
        let mut sl = SiegeLoop::new(st, env);
        let mut clock: VirtualClock<LoopTimer> = VirtualClock::new();
        let stop = sl.run(&mut clock, 4000);
        (stop, sl)
    };
    let (stop_twin, twin) = run(false);
    // Bliźniak: mur bez wyłomu, sufit `siegeNoBreachMaxRounds = 2` (`_beginTurn` -> `_checkEnd` -> remis).
    assert_eq!(stop_twin, FfStop::Finished);
    assert_eq!(twin.winner_label(), Some("remis"));
    assert!(!twin.env.wall_ever_breached);
    assert_eq!(twin.st.round_no, 2, "bliźniak: remis po 2 rundach");

    let (stop, sl) = run(true);
    assert!(sl.env.body.breached, "ciało ustawiło wyłom bramy");
    assert!(sl.env.body.starts >= 1);
    // Synchronizacja: flaga sterownika z ciała, bez akcji `WallBreach` i bez zmiany kafli muru.
    assert!(sl.env.wall_ever_breached, "drain_body przenosi wyłom bramy");
    assert_eq!(sl.env.wall_tile_rows, vec![4, 5, 6]);
    assert!(!sl
        .actions()
        .iter()
        .any(|a| matches!(a.action, BattleAction::WallBreach { .. })));
    // Skutek: brak remisu „mur bez wyłomu” po 2 rundach; bitwa trwa dalej niż bliźniak.
    assert_eq!(stop, FfStop::StepLimit, "po wyłomie bramy bitwa trwa");
    assert_eq!(sl.winner_label(), None);
    assert!(
        sl.st.round_no > 2 * twin.st.round_no,
        "po wyłomie bramy runda {} > {}",
        sl.st.round_no,
        twin.st.round_no
    );
}
