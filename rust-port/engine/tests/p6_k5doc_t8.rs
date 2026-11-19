//! P6 SIEGE-TAKTYKA K5DOC-T8 (dispatch R-RUSTPORT-P6-K5DOC-T8-Q1, #264, Operator r1): zgodność kroku doktryny grupy
//! w `ProdBody` z pinem `07d2fbd72`:
//! - `_executeGroupDoctrineStep` (`battleScene.ts:17966-18084`) wołany z `_activateUnit` (`:6087-6099`) dla doktryny
//!   domyślnej `steady` z `autoPlay = true` (jazda `_cavalryAction`, strzelec w zasięgu `_pickRangedTargetByPriority` ->
//!   `_doAttack`, strzelec poza zasięgiem `_rangedAction`, piechota `_advanceStep` z ciosem `_pickAdjacentTargetByPriority`
//!   `:8241-8245`, strzelec z `shootingEnabled = false`), `defensive`, `aggressive` i `skirmish`
//!   (`_executeSkirmishDoctrineStep` `:18087-18124`, `ru.rangedKite = true`, rozkaz ruchu `_performPlayerOrder` = jawny
//!   tag `doktryna-rozkaz-ruchu`, K5EXEC-T3);
//! - bramki `siegeDefenderNeverDoctrine` / `siegeMachineNeverDoctrine` (`:6087-6092`) na maszynie K5H;
//! - `ru.moveLeft = NaN`.
//!
//! Wektory: `p6_k5doc_t8_vectors/{vectors,vectors_nan,vectors_gate}.json`, generowane przez `p6_k5doc_t8_gen.mjs`,
//! który WYKONUJE tekst pinu (strażnik SHA-256 wycinków).
//!
//! Porównanie na każdym wektorze (jak r4): ślad aktywacji (zdarzenia maszyny + metoda pinu wykonana przez krok doktryny),
//! `_isUnitDoctrineAuto` (wejście adaptera liczone portem), doktryna `meta.doctrine`, czas, pozycja, `moveLeft` bitowo,
//! `facing`, zmiany facing z czasem, `Move` na każdy krok, strzał (`Facing` + `Shot`, cel i łuk trafienia), cios wręcz
//! (`Melee`), cel rozkazu ruchu, `rangedKite`, `_groupMeta` po aktywacji (`_ensureGroupMeta`), `dryCol`,
//! `heldAfterFallback`, amunicja, `occByKey`, liczba rzutów = liczba `_singleBlow` pinu, `unported` puste (poza
//! rozkazem ruchu: dokładnie `doktryna-rozkaz-ruchu`).

use std::collections::{BTreeSet, HashMap};

use civ_engine::domain::player_order_move_gate::{GroupDoctrine as GateDoctrine, GroupMeta};
use civ_engine::domain::siege_tactics_actions::{BattleAction, TimedAction};
use civ_engine::domain::siege_tactics_activate::{
    activate_unit, ActivateEvent, ActivateOps, ActivateScene, ActivateUnit, EnemyRef,
};
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, RollSource};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_step::{
    effective_doctrine, is_unit_doctrine_auto, DoctrineAction,
};
use civ_engine::domain::siege_tactics_doctrine_target::AttackDirection;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    LoopBody, ProdBody, ProdUnit, MOVE_STEP_MS, RANGED_FLY_MS,
};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5doc_t8_vectors/vectors.json");
const VECTORS_NAN: &str = include_str!("p6_k5doc_t8_vectors/vectors_nan.json");
const VECTORS_GATE: &str = include_str!("p6_k5doc_t8_vectors/vectors_gate.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5doc_t8_gen.mjs`).
const PIN_SHA256: &str = "c8e6b605b20c855812a7ce372ba3681c896e88144aa86426787e4cc62bc56004";
const PLAIN: &str = "Plaskie (rownina/laka)";
/// Rzut strzału: pudło (`roll * 100 >= hitPct`); generator ma atrapę `_singleBlow` = 0 obrażeń (jak r4).
const MISS_ROLL: f64 = 0.999_999;

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

struct TileTerrain {
    tiles: HashMap<(i64, i64), (bool, f64, bool, String)>,
    cav_mult: HashMap<String, f64>,
}

impl TileTerrain {
    fn at(&self, col: f64, row: f64) -> (bool, f64, bool, &str) {
        match self.tiles.get(&(col as i64, row as i64)) {
            Some((p, c, f, n)) => (*p, *c, *f, n.as_str()),
            None => (true, 1.0, false, PLAIN),
        }
    }
}

impl MoveTerrain for TileTerrain {
    fn passable(&self, col: f64, row: f64) -> bool {
        self.at(col, row).0
    }
    fn move_cost(&self, col: f64, row: f64) -> f64 {
        self.at(col, row).1
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.at(col, row).2
    }
    fn cavalry_multiplier(&self, col: f64, row: f64) -> f64 {
        *self
            .cav_mult
            .get(self.at(col, row).3)
            .expect("mnoznik jazdy terenu")
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

fn doctrine(s: &str) -> GroupDoctrine {
    GroupDoctrine::parse(s).unwrap_or_else(|| panic!("doktryna {s}"))
}

fn gate(s: &str) -> GateDoctrine {
    match doctrine(s) {
        GroupDoctrine::Defensive => GateDoctrine::Defensive,
        GroupDoctrine::Steady => GateDoctrine::Steady,
        GroupDoctrine::Aggressive => GateDoctrine::Aggressive,
        GroupDoctrine::Skirmish => GateDoctrine::Skirmish,
        GroupDoctrine::Manual => GateDoctrine::Manual,
    }
}

fn doctrine_name(d: GroupDoctrine) -> &'static str {
    match d {
        GroupDoctrine::Defensive => "defensive",
        GroupDoctrine::Steady => "steady",
        GroupDoctrine::Aggressive => "aggressive",
        GroupDoctrine::Skirmish => "skirmish",
        GroupDoctrine::Manual => "manual",
    }
}

/// `(unitDoctrine, groupId niepuste, wpis _groupMeta)` jednostki z wektora.
fn doctrine_inputs(
    u: &Value,
    group_meta: &Value,
) -> (Option<GroupDoctrine>, bool, Option<(GroupDoctrine, bool)>) {
    let unit = u["unitDoctrine"].as_str().map(doctrine);
    let gid = u["groupId"].as_str().filter(|g| !g.is_empty());
    let meta = gid.and_then(|g| {
        group_meta
            .as_array()
            .expect("groupMeta")
            .iter()
            .find(|m| m[0].as_str() == Some(g))
            .map(|m| (doctrine(m[1].as_str().expect("d")), b(&m[2])))
    });
    (unit, gid.is_some(), meta)
}

/// Wejście adaptera `_isUnitDoctrineAuto(ru)` liczone portem [`is_unit_doctrine_auto`] (wektor sprawdza zgodność z pinem).
fn auto_of(u: &Value, group_meta: &Value) -> bool {
    let (unit, has_group, meta) = doctrine_inputs(u, group_meta);
    is_unit_doctrine_auto(unit, has_group, meta)
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
        surround_applied: false,
        morale: num_or(&u["morale"], 100.0),
        flee_morale: num_or(&u["fleeMorale"], 0.0),
        terrain_defence_mult: num_or(&u["tdm"], 1.0),
        range: num_or(&u["range"], 1.0),
        on_wall_walkway: false,
        primary_ranged: bo(&u["primaryRanged"]),
        mounted: bo(&u["mounted"]),
        phalanx: bo(&u["phalanx"]),
        shooting_disabled: u["shootingEnabled"].as_bool() == Some(false),
        dry_col: num_or(&u["dryCol"], -1.0),
        held_after_fallback: bo(&u["heldAfterFallback"]),
        player_order_none: true,
        can_shoot: ranged_base && ammo > 0.0,
        is_siege_unit: bo(&u["siege"]),
        is_siege_tower: false,
        is_ram: false,
        is_catapult: false,
        doctrine_auto,
        // Nadpisywane przez ciało z `_getEffectiveDoctrine` (K5DOC-T8); celowo fałsz, żeby wykryć brak nadpisania.
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

fn side_of(s: &str) -> BattleSide {
    match s {
        "atk" => BattleSide::Attacker,
        "def" => BattleSide::Defender,
        other => panic!("strona {other}"),
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
        ActivateEvent::DoctrineStep => "doctrine".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::AdvanceStep => "advanceStep".into(),
        ActivateEvent::RangedAction => "rangedAction".into(),
        ActivateEvent::FallBackStep => "fallBackStep".into(),
        ActivateEvent::PhalanxAction => "phalanxAction".into(),
        ActivateEvent::CavalryAction => "cavalryAction".into(),
        ActivateEvent::Flee => "flee".into(),
        other => format!("{other:?}"),
    })
}

/// Etykieta metody pinu wykonanej przez krok doktryny (wpis śladu generatora po `doctrine`).
fn doctrine_label(a: DoctrineAction) -> Option<&'static str> {
    match a {
        DoctrineAction::Done | DoctrineAction::Attack(_) => None,
        DoctrineAction::CavalryAction => Some("cavalryAction"),
        DoctrineAction::RangedAction => Some("rangedAction"),
        DoctrineAction::AdvanceStep => Some("advanceStep"),
        DoctrineAction::MoveOrder { .. } => Some("playerOrder"),
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

fn build(case: &Value, cav_mult: &HashMap<String, f64>, with_terrain: bool) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let acting = UnitRef {
        side: side_of(case["acting"]["side"].as_str().expect("side")),
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    let e = &case["expect"];
    let attack = e["attack"]["target"].as_u64();
    let shots = blow_targets(e);
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let dead = b(&u["dead"]);
            let me = ix == usize::from(acting.side == BattleSide::Defender) && i == acting.idx;
            let (melee_target, mblow) = match (me, attack) {
                (true, Some(t)) => (Some(t as usize), Some(blow(false))),
                _ => (None, None),
            };
            units[ix].push(ProdUnit {
                activate: act(u, ix == 0, auto_of(u, &case["groupMeta"])),
                melee_target,
                blow: mblow,
                counter_blows: Vec::new(),
                body_ms: 0.0,
                facing: num(&u["facing"]),
            });
            seq[ix].push(SeqUnit {
                id: (ix * 100 + seq[ix].len()) as u64,
                c: CombatUnit {
                    hp: u["hp"].as_f64().unwrap_or(100.0),
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
        siege_wall_col: -1,
        manual_mode: false,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    let rolls = CountRolls {
        values: vec![MISS_ROLL; shots.len()],
        used: 0,
    };
    let mut body = ProdBody::new(units, scene(-1), rolls);
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let ds = &mut body.doctrine[ix][i];
            ds.unit_doctrine = u["unitDoctrine"].as_str().map(doctrine);
            ds.group_id = u["groupId"].as_str().map(str::to_string);
            ds.anti_cav_spear = bo(&u["antiCavSpear"]);
            ds.ranged_kite = u["rangedKite"].as_bool().unwrap_or(true);
            ds.shooting_enabled = u["shootingEnabled"].as_bool().unwrap_or(true);
            body.ranged_base[ix][i] = bo(&u["rangedBase"]);
            body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
            body.formation_rank[ix][i] = u["formationRank"].as_f64();
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
    for t in &shots {
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
    if with_terrain {
        let tiles = case["tiles"]
            .as_array()
            .expect("tiles")
            .iter()
            .map(|t| {
                (
                    (int(&t[0]), int(&t[1])),
                    (
                        b(&t[2]),
                        num(&t[3]),
                        b(&t[4]),
                        t[5].as_str().unwrap_or(PLAIN).to_string(),
                    ),
                )
            })
            .collect();
        body = body.with_terrain(Box::new(TileTerrain {
            tiles,
            cav_mult: cav_mult.clone(),
        }));
    }
    body.sync_occupancy(&st);
    Built { body, st, acting }
}

fn load_from(src: &str) -> (Value, HashMap<String, f64>) {
    let v: Value = serde_json::from_str(src).expect("wektory");
    assert_eq!(v["pin"].as_str(), Some(PIN));
    assert_eq!(v["pinSha256"].as_str(), Some(PIN_SHA256));
    let cav_mult = v["cavMult"]
        .as_object()
        .map(|o| o.iter().map(|(k, m)| (k.clone(), num(m))).collect())
        .unwrap_or_default();
    (v, cav_mult)
}

/// Akcje jednej aktywacji: zmiany facing jednostki działającej (bez zwrotu tuż przed `Melee`/`Shot`), `Move`, `Melee`,
/// strzał.
#[derive(Default)]
struct Got {
    facing: Vec<(f64, f64)>,
    moves: Vec<TimedAction>,
    melee: Option<(usize, f64)>,
    shot: Option<(usize, f64, f64, f64)>,
    other: usize,
}

fn split_actions(actions: &[TimedAction], acting: UnitRef) -> Got {
    let mut g = Got::default();
    for (k, a) in actions.iter().enumerate() {
        let next = actions.get(k + 1).map(|n| &n.action);
        match &a.action {
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
            BattleAction::Move { unit, .. } if *unit == acting => g.moves.push(a.clone()),
            BattleAction::Melee {
                attacker, target, ..
            } if *attacker == acting => g.melee = Some((target.idx, a.t0)),
            BattleAction::Shot { .. } | BattleAction::Log { .. } | BattleAction::Clash { .. } => {}
            _ => g.other += 1,
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

/// Jedna aktywacja wektora wobec oczekiwania (czasy względem startu). Zwraca decyzję kroku doktryny ciała.
fn check_case(
    case: &Value,
    cav_mult: &HashMap<String, f64>,
    failures: &mut Vec<String>,
) -> Option<DoctrineAction> {
    let name = case["name"].as_str().expect("name");
    let e = &case["expect"];
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, cav_mult, true);
    let aix = usize::from(acting.side == BattleSide::Defender);
    let me_v = &[&case["atk"], &case["def"]][aix][acting.idx];
    // `_isUnitDoctrineAuto` (port) = pin.
    let auto = auto_of(me_v, &case["groupMeta"]);
    if auto != b(&e["doctrineAuto"]) {
        failures.push(format!(
            "{name}: _isUnitDoctrineAuto rust={auto} js={}",
            e["doctrineAuto"]
        ));
    }
    // `meta.doctrine` (`_effectiveMetaForUnit`) = `_getEffectiveDoctrine` (port).
    let (unit_d, has_group, meta) = doctrine_inputs(me_v, &case["groupMeta"]);
    let eff = effective_doctrine(unit_d, if has_group { meta.map(|m| m.0) } else { None });
    if e["meta"].as_str() != Some(doctrine_name(eff)) {
        failures.push(format!(
            "{name}: meta.doctrine rust={} js={}",
            doctrine_name(eff),
            e["meta"]
        ));
    }
    body.set_now(0.0);
    let _ = body.take_actions();
    let start_pos = body.unit_cell(acting).expect("pozycja");
    let dur = body.start(acting, &st);
    let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
    // Cios wręcz: generator kończy na `_doMeleeAttack` (zapis celu); sam cios pokrywają inne wektory (jak r4).
    if want_attack.is_none() {
        body.complete(acting, &mut st);
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
        failures.push(format!(
            "{name}: trace rust={got_trace:?} js={want_trace:?}"
        ));
    }
    if dur != num(&e["duration"]) {
        failures.push(format!("{name}: duration rust={dur} js={}", e["duration"]));
    }
    let fin = &e["final"];
    let pos = body.unit_cell(acting).expect("pozycja");
    if pos != (int(&fin["q"]), int(&fin["r"])) {
        failures.push(format!(
            "{name}: pozycja rust={pos:?} js=({},{})",
            fin["q"], fin["r"]
        ));
    }
    let ml = st.unit(acting).c.move_left;
    if !same_f64(ml, num(&fin["moveLeft"])) {
        failures.push(format!("{name}: moveLeft rust={ml} js={}", fin["moveLeft"]));
    }
    if body.facing(acting) != num(&fin["facing"]) {
        failures.push(format!(
            "{name}: facing rust={} js={}",
            body.facing(acting),
            fin["facing"]
        ));
    }
    let a = &body.units[aix][acting.idx].activate;
    if !same_f64(a.dry_col, num(&fin["dryCol"]))
        || a.held_after_fallback != b(&fin["heldAfterFallback"])
    {
        failures.push(format!(
            "{name}: dryCol/held rust=({}, {}) js=({}, {})",
            a.dry_col, a.held_after_fallback, fin["dryCol"], fin["heldAfterFallback"]
        ));
    }
    let ammo = body.ammo_left[aix][acting.idx];
    if !same_f64(ammo, num(&fin["ammoLeft"])) {
        failures.push(format!(
            "{name}: ammoLeft rust={ammo} js={}",
            fin["ammoLeft"]
        ));
    }
    let kite = body.doctrine(acting).ranged_kite;
    if kite != b(&fin["rangedKite"]) {
        failures.push(format!(
            "{name}: rangedKite rust={kite} js={}",
            fin["rangedKite"]
        ));
    }
    let lamf = body.doctrine(acting).last_auto_move_from;
    let want_lamf = fin["lastAutoMoveFrom"]
        .as_object()
        .map(|o| (int(&o["q"]), int(&o["r"])));
    if lamf != want_lamf {
        failures.push(format!(
            "{name}: lastAutoMoveFrom rust={lamf:?} js={want_lamf:?}"
        ));
    }
    // `_groupMeta` po aktywacji (`_ensureGroupMeta` z `_effectiveMetaForUnit`).
    let mut got_meta: Vec<(String, GateDoctrine, bool)> = body
        .group_meta
        .iter()
        .map(|(k, m)| (k.clone(), m.doctrine, m.auto_play))
        .collect();
    got_meta.sort_by(|x, y| x.0.cmp(&y.0));
    let want_meta: Vec<(String, GateDoctrine, bool)> = e["groupMeta"]
        .as_array()
        .expect("groupMeta")
        .iter()
        .map(|m| {
            (
                m[0].as_str().expect("id").to_string(),
                gate(m[1].as_str().expect("d")),
                b(&m[2]),
            )
        })
        .collect();
    if got_meta != want_meta {
        failures.push(format!(
            "{name}: _groupMeta rust={got_meta:?} js={want_meta:?}"
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
    let steps = e["steps"].as_array().expect("steps");
    let mut want_moves: Vec<TimedAction> = Vec::new();
    let mut prev = start_pos;
    for s in steps {
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
    if got.moves != want_moves {
        failures.push(format!(
            "{name}: Move rust={:?} js={want_moves:?}",
            got.moves
        ));
    }
    let want_melee = want_attack.map(|t| (t, num(&e["attack"]["t"])));
    if got.melee != want_melee {
        failures.push(format!(
            "{name}: cios rust={:?} js={want_melee:?}",
            got.melee
        ));
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
    if got.other != 0 {
        failures.push(format!(
            "{name}: inne akcje ({}) {:?}",
            got.other,
            body.pending_actions()
        ));
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
    // Rozkaz ruchu (`_performPlayerOrder`, K5EXEC-T3): ten sam cel co pin i dokładnie jeden jawny tag.
    let want_order = e["orderDest"]
        .as_object()
        .map(|o| (int(&o["col"]), int(&o["row"])));
    let got_order = match step {
        Some(DoctrineAction::MoveOrder { col, row }) => Some((col, row)),
        _ => None,
    };
    if got_order != want_order {
        failures.push(format!(
            "{name}: rozkaz ruchu rust={got_order:?} js={want_order:?}"
        ));
    }
    let want_unported: Vec<(UnitRef, &'static str)> = if want_order.is_some() {
        vec![(acting, "doktryna-rozkaz-ruchu")]
    } else {
        Vec::new()
    };
    if body.unported != want_unported {
        failures.push(format!("{name}: unported {:?}", body.unported));
    }
    if body.unported.iter().any(|(_, t)| *t == "doktryna") {
        failures.push(format!("{name}: tag doktryna"));
    }
    step
}

/// Liczniki pokrycia: (rodzina, metoda pinu wykonana przez krok doktryny ciała) -> liczba wektorów.
fn run_family(v: &Value, cav_mult: &HashMap<String, f64>) -> (Vec<String>, HashMap<String, usize>) {
    let mut failures = Vec::new();
    let mut cov: HashMap<String, usize> = HashMap::new();
    for case in v["cases"].as_array().expect("cases") {
        let step = check_case(case, cav_mult, &mut failures);
        let kind = case["kind"].as_str().expect("kind");
        let key = format!("{kind}/{}", case["branch"].as_str().expect("branch"));
        *cov.entry(key).or_default() += 1;
        if step.is_none() {
            *cov.entry(format!("{kind}/bez-kroku-doktryny")).or_default() += 1;
        }
    }
    (failures, cov)
}

/// Strażnik czasu: pętla bez końca daje czytelny FAIL zamiast zawieszenia binarki.
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
        Err(_) => panic!("{label}: brak konca w 90 s (petla ruchu nie konczy sie)"),
    }
}

fn at_least(cov: &HashMap<String, usize>, key: &str, n: usize) {
    let got = cov.get(key).copied().unwrap_or(0);
    assert!(got >= n, "pokrycie {key}: {got} < {n}; {cov:?}");
}

#[test]
fn krok_doktryny_zgodny_z_pinem() {
    with_timeout("T8", || {
        let (v, cav_mult) = load_from(VECTORS);
        assert_eq!(v["cases"].as_array().expect("cases").len(), 1840);
        let (failures, cov) = run_family(&v, &cav_mult);
        assert!(
            failures.is_empty(),
            "{} rozbieznosci, pierwsze: {:#?}",
            failures.len(),
            &failures[..failures.len().min(12)]
        );
        eprintln!("pokrycie T8: {cov:?}");
        // Domyślna doktryna `steady`: 4 rodziny z dispatchu + strzelec bez strzelania.
        at_least(&cov, "steady-cav/cav", 150);
        at_least(&cov, "steady-shoot-in/shot", 150);
        at_least(&cov, "steady-shoot-out/ranged-move", 80);
        at_least(&cov, "steady-shoot-out/ranged-shot", 50);
        at_least(&cov, "steady-inf/advance-attack", 80);
        at_least(&cov, "steady-inf/advance-move", 100);
        at_least(&cov, "steady-inf/advance-none", 20);
        at_least(&cov, "steady-nobow/advance-attack", 30);
        at_least(&cov, "steady-nobow/advance-move", 40);
        at_least(&cov, "defensive/shot", 50);
        at_least(&cov, "defensive/melee", 50);
        at_least(&cov, "defensive/none", 50);
        at_least(&cov, "aggressive/cav", 40);
        at_least(&cov, "aggressive/shot", 40);
        at_least(&cov, "aggressive/melee", 40);
        at_least(&cov, "aggressive/advance-move", 40);
        // `aggressive/advance-attack` jest nieosiągalne: cios w sąsiada (`_pickAdjacentTargetByPriority`, `:18039-18043`)
        // poprzedza `_advanceStep` (`:18048`), a `_advanceStep` bije wyłącznie sąsiada (`:8241-8245`). Generator nie
        // znalazł takiego wektora (kwota usunięta po pomiarze).
        at_least(&cov, "aggressive/advance-none", 1);
        at_least(&cov, "aggressive/none", 15);
        at_least(&cov, "skirmish/ranged-shot", 30);
        at_least(&cov, "skirmish/ranged-move", 30);
        at_least(&cov, "skirmish/melee", 30);
        at_least(&cov, "skirmish/order", 40);
        at_least(&cov, "skirmish/none", 20);
        // Krawędź planszy: punkt zbiórki po clampie = własne pole (`:18104`, mutant M13 r1).
        at_least(&cov, "skirmish-edge/none", 20);
        // Jazda strzelająca (`mounted` + `canShoot` + `shootingEnabled`, zarzut Z2 / mutant E12 obrony r1): pin woła
        // `_cavalryAction` PRZED strzałem (`:17992-17995` steady, `:18028-18031` aggressive). Każdy wektor rodziny to
        // gałąź `cav`, a w co najmniej 60 z nich cel strzału był w zasięgu przed aktywacją (`rangedAtStart`), więc
        // „strzał przed jazdą” zmienia zdarzenia.
        for fam in ["steady-cav-shoot", "aggressive-cav-shoot"] {
            at_least(&cov, &format!("{fam}/cav"), 120);
            let cases = v["cases"].as_array().expect("cases");
            let shooters_in_range = cases
                .iter()
                .filter(|c| c["kind"] == fam && b(&c["rangedAtStart"]))
                .filter(|c| {
                    let side = if c["acting"]["side"] == "atk" {
                        "atk"
                    } else {
                        "def"
                    };
                    let me = &c[side][int(&c["acting"]["idx"]) as usize];
                    bo(&me["mounted"])
                        && bo(&me["rangedBase"])
                        && num_or(&me["ammoLeft"], 0.0) > 0.0
                        && me.get("shootingEnabled").is_none()
                })
                .count();
            assert!(
                shooters_in_range >= 60,
                "{fam}: jazda strzelajaca z celem w zasiegu {shooters_in_range} < 60"
            );
        }
        // `unitDoctrine` defensive/aggressive/skirmish + grupa bez wpisu `_groupMeta`, krok kończy `done()` (uwaga N2,
        // mutant E13): `_ensureGroupMeta` (`:17586`, z `_effectiveMetaForUnit` `:17636`) i tak tworzy wpis.
        for d in ["defensive", "aggressive", "skirmish"] {
            at_least(&cov, &format!("ensure-done-{d}/none"), 20);
        }
        assert!(
            cov.keys().all(|k| !k.ends_with("/bez-kroku-doktryny")),
            "kazdy wektor przechodzi krok doktryny ciala: {cov:?}"
        );
    });
}

/// `ru.moveLeft = NaN`: `aggressive` (`ru.moveLeft <= 0` fałszywe dla NaN, `:18044`) idzie `_advanceStep`; piechota,
/// jazda i `skirmish` jak w pinie.
#[test]
fn nan_move_left_zgodne_z_pinem() {
    with_timeout("T8 NaN", || {
        let (v, cav_mult) = load_from(VECTORS_NAN);
        assert_eq!(v["cases"].as_array().expect("cases").len(), 880);
        let (failures, cov) = run_family(&v, &cav_mult);
        assert!(
            failures.is_empty(),
            "{} rozbieznosci, pierwsze: {:#?}",
            failures.len(),
            &failures[..failures.len().min(12)]
        );
        eprintln!("pokrycie T8 NaN: {cov:?}");
        let moved: usize = v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .filter(|c| !c["expect"]["steps"].as_array().expect("s").is_empty())
            .count();
        assert!(moved >= 150, "NaN z ruchem: {moved}");
        let agg_adv = cov.get("aggressive-nan/advance-move").copied().unwrap_or(0)
            + cov.get("aggressive-nan/advance-none").copied().unwrap_or(0)
            + cov
                .get("aggressive-nan/advance-attack")
                .copied()
                .unwrap_or(0);
        assert!(agg_adv >= 40, "aggressive NaN -> _advanceStep: {cov:?}");
    });
}

/// Zapytania K5H dla wektorów bramek: krok doktryny zwraca `true` (pin: każda ścieżka `return true`) i jest liczony.
struct GateOps {
    doctrine_calls: usize,
}

impl ActivateOps for GateOps {
    fn apply_terrain_range(&mut self, c: f64) -> f64 {
        c
    }
    fn perform_player_order(&mut self) -> bool {
        panic!("tryb reczny poza zakresem wektorow bramek")
    }
    fn doctrine_step(&mut self) -> bool {
        self.doctrine_calls += 1;
        true
    }
    fn tower_climb(&mut self) -> bool {
        false
    }
    fn infantry_to_tower(&mut self) -> bool {
        false
    }
    fn ram_tower_step(&mut self) -> bool {
        false
    }
    fn ranged_target_in_range(&mut self) -> Option<usize> {
        None
    }
    fn target_in_range(&mut self) -> Option<usize> {
        None
    }
    fn advance_coord(&mut self) -> f64 {
        0.0
    }
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
        None
    }
}

/// Bramki `siegeDefenderNeverDoctrine` (`:6087`) i `siegeMachineNeverDoctrine` (`:6091`) na maszynie K5H
/// (`activate_unit`), z wejściem `_isUnitDoctrineAuto` liczonym portem: czy `_executeGroupDoctrineStep` jest wołany.
#[test]
fn bramki_doktryny_przy_murze_zgodne_z_pinem() {
    let (v, _) = load_from(VECTORS_GATE);
    let cases = v["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 240);
    let mut failures = Vec::new();
    let (mut def_przy_murze_auto_bez_kroku, mut machina_przy_murze_auto_bez_kroku) = (0, 0);
    let (mut atk_wall_doctrine, mut no_wall) = (0, 0);
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let side_atk = case["acting"]["side"] == "atk";
        let me = if side_atk {
            &case["atk"][0]
        } else {
            &case["def"][0]
        };
        let en = if side_atk {
            &case["def"][0]
        } else {
            &case["atk"][0]
        };
        let e = &case["expect"];
        let auto = auto_of(me, &case["groupMeta"]);
        if auto != b(&e["doctrineAuto"]) {
            failures.push(format!("{name}: auto rust={auto} js={}", e["doctrineAuto"]));
        }
        let (unit_d, has_group, meta) = doctrine_inputs(me, &case["groupMeta"]);
        let eff = effective_doctrine(unit_d, if has_group { meta.map(|m| m.0) } else { None });
        let mut au = act(me, side_atk, auto);
        // Ciało nadpisuje `doctrine_manual` z `_getEffectiveDoctrine`; tu to samo wprost.
        au.doctrine_manual = eff == GroupDoctrine::Manual;
        let wall = int(&case["wallCol"]);
        let enemies = [EnemyRef {
            q: int(&en["q"]),
            r: int(&en["r"]),
            dead: false,
            fading_out: false,
            routed: false,
            is_catapult: false,
        }];
        let mut ops = GateOps { doctrine_calls: 0 };
        let res = activate_unit(&mut au, &scene(wall), &enemies, &mut ops);
        let called = ops.doctrine_calls == 1 && res.events.contains(&ActivateEvent::DoctrineStep);
        if called != b(&e["doctrine"]) {
            failures.push(format!(
                "{name}: doktryna rust={called} js={} (mur {wall}, atk {side_atk}, siege {})",
                e["doctrine"], me["siege"]
            ));
        }
        if called && e["meta"].as_str() != Some(doctrine_name(eff)) {
            failures.push(format!("{name}: meta rust={eff:?} js={}", e["meta"]));
        }
        // Zaobserwowana blokada: auto + mur + obrońca (albo machina atakującego) i krok doktryny NIE wołany.
        if auto && wall >= 0 && !side_atk && !called {
            def_przy_murze_auto_bez_kroku += 1;
        }
        if auto && wall >= 0 && side_atk && bo(&me["siege"]) && !called {
            machina_przy_murze_auto_bez_kroku += 1;
        }
        if called && wall >= 0 && side_atk {
            atk_wall_doctrine += 1;
        }
        if called && wall < 0 {
            no_wall += 1;
        }
    }
    assert!(failures.is_empty(), "{failures:#?}");
    assert!(
        def_przy_murze_auto_bez_kroku >= 30,
        "obronca auto przy murze bez kroku doktryny: {def_przy_murze_auto_bez_kroku}"
    );
    assert!(
        machina_przy_murze_auto_bez_kroku >= 15,
        "machina auto przy murze bez kroku doktryny: {machina_przy_murze_auto_bez_kroku}"
    );
    assert!(
        atk_wall_doctrine >= 15,
        "atakujacy (nie machina) przy murze: {atk_wall_doctrine}"
    );
    assert!(no_wall >= 20, "bez muru: {no_wall}");
}

/// `meta.doctrine !== 'manual'` (`battleScene.ts:6096`) czyta `_getEffectiveDoctrine` ze stanu ciała, nie flagę wejścia:
/// przy niespójnym wejściu adaptera (`doctrine_auto = true`, a `unitDoctrine = 'manual'`) krok doktryny NIE jest
/// wykonywany (pin: `_isUnitDoctrineAuto` dałby tu `false`, a nawet przy `true` linia `:6096` odcina `manual`).
/// Mutant M24 r1 (brak nadpisania `doctrine_manual`) jest równoważny dla spójnego wejścia; ten test go zabija.
#[test]
fn doktryna_manual_ze_stanu_ciala_odcina_krok() {
    let (v, cav_mult) = load_from(VECTORS);
    let mut n = 0;
    for case in v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| c["kind"] == "steady-inf")
        .take(30)
    {
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, &cav_mult, true);
        let aix = usize::from(acting.side == BattleSide::Defender);
        body.doctrine[aix][acting.idx].unit_doctrine = Some(GroupDoctrine::Manual);
        // Bez kroku doktryny jednostka idzie dalszymi gałęziami `_activateUnit` (cios/kontratak zużywają rzuty).
        body.rolls.values = vec![MISS_ROLL; 4];
        assert!(body.units[aix][acting.idx].activate.doctrine_auto);
        body.start(acting, &st);
        body.complete(acting, &mut st);
        assert!(body.doctrine_steps.is_empty(), "{}", case["name"]);
        assert!(
            !body.trace[0].1.contains(&ActivateEvent::DoctrineStep),
            "{}",
            case["name"]
        );
        n += 1;
    }
    assert_eq!(n, 30);
}

/// Ciało przy murze: od K5LOOP-SIEGE-ATK-B (T2b) gałęzie ATAKUJĄCEGO przy murze (w tym krok doktryny) są wykonywane
/// (bramka `_doMove` `_siegeMoveRefused` i filtr `_meleeBlockedByWall`, zgodność z pinem: wektory
/// `p6_k5loop_siege_atk_b`). D-INT-2: dawna asercja „dokładnie tag `oblezenie`, bez kroku doktryny” zastąpiona
/// asercją „brak tagu oblężniczego i brak tagu `doktryna`, krok doktryny wykonany dokładnie wtedy, gdy pin go wywołał”
/// (bramka doktryny `:6087-6092` nie zależy od muru dla piechoty/jazdy/strzelców atakującego). Obrońca przy murze jest
/// wykonywany od T1 (K5LOOP-SIEGE-DEF, wektory `p6_k5loop_siege_def`).
#[test]
fn cialo_przy_murze_bez_tagu_oblezenie() {
    let (v, cav_mult) = load_from(VECTORS);
    let mut n = 0;
    for case in v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| c["acting"]["side"] == "atk")
        .take(40)
    {
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, &cav_mult, true);
        st.siege_wall_col = 40;
        let _ = body.start(acting, &st);
        if case["expect"]["attack"].is_null() {
            body.complete(acting, &mut st);
        }
        assert!(
            body.unported
                .iter()
                .all(|(_, t)| !t.starts_with("oblezenie") && *t != "doktryna"),
            "{}: {:?}",
            case["name"],
            body.unported
        );
        let pin_doctrine = case["expect"]["trace"]
            .as_array()
            .expect("trace")
            .iter()
            .any(|t| t == "doctrine");
        assert_eq!(
            !body.doctrine_steps.is_empty(),
            pin_doctrine,
            "{}",
            case["name"]
        );
        n += 1;
    }
    assert_eq!(n, 40);
}

/// Bez danych terenu (D1 K5DOC-T4e-0) gałęzie ruchowe kroku doktryny mają jawne tagi `*-brak-terenu` (jak gałęzie
/// `_activateUnit`), nigdy tag `doktryna`; cios i strzał z kroku doktryny nie wymagają terenu.
#[test]
fn bez_terenu_jawne_tagi_galezi_bez_tagu_doktryna() {
    let (v, cav_mult) = load_from(VECTORS);
    let mut tagged = 0;
    let mut acted = 0;
    for case in v["cases"].as_array().expect("cases") {
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, &cav_mult, false);
        body.start(acting, &st);
        if case["expect"]["attack"].is_null() {
            body.complete(acting, &mut st);
        }
        assert!(
            body.unported.iter().all(|(_, t)| *t != "doktryna"),
            "{}: {:?}",
            case["name"],
            body.unported
        );
        assert_eq!(body.doctrine_steps.len(), 1, "{}", case["name"]);
        match case["branch"].as_str().expect("branch") {
            "shot" | "melee" => {
                acted += 1;
                assert!(
                    body.unported.is_empty(),
                    "{}: {:?}",
                    case["name"],
                    body.unported
                );
            }
            "cav" | "ranged-shot" | "ranged-move" | "advance-move" => {
                tagged += 1;
                assert_eq!(
                    body.unported.len(),
                    1,
                    "{}: {:?}",
                    case["name"],
                    body.unported
                );
                assert!(body.unported[0].1.ends_with("-brak-terenu"));
            }
            _ => {}
        }
    }
    assert!(
        tagged >= 300 && acted >= 200,
        "tagged {tagged} acted {acted}"
    );
}
