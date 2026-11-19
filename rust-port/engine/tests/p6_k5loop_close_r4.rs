//! P6 SIEGE-TAKTYKA K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, DODATEK r4, Operator): zgodność `ProdBody`
//! z pinem `07d2fbd72` dla:
//! - ucieczki `_fleeStep` (`battleScene.ts:9845-9898`) jednostki już rozbitej (`:6055`, rodzina `flee`) i rozbitej
//!   okrążeniem w tej aktywacji (`:6105-6118`, rodzina `surround`: `_checkRout` -> `_startRout` -> `_fleeStep`), z
//!   `_removeUnitFromScene` (`:9910-9925`, akcja `Leave`) i ripple `_shakeAlliesOnLoss` (`:9743-9753`, akcja `Shaken`,
//!   kaskady `_checkRout`/`_startRout`/`_checkMeleeScreenLost`/`_boostEnemiesOnBreak`);
//! - strzelca z amunicją i `shootingEnabled = false` (rodzina `nobow`): zasięg strzału w `_targetInRange`
//!   (`:8373-8410`), `_canAttackFrom` (`:8436-8444`), `_makeCanAttackFromTest` (`:8454`), `_canStrikeTargetFrom`
//!   (`:8487-8493`) i `_doAttack` -> `_doRangedAttack` (`:8787-8797`);
//! - uwag FC r3: FC-U1 (`ammo2`: dwie aktywacje strzelca z `ammoLeft = 1`, druga idzie U7.6) i FC-U2 (`steady2`:
//!   `_rangedFiringStepStaysBehindMelee` z >= 2 sojusznikami wręcz w najbliższym wierszu).
//!
//! Wektory: `p6_k5loop_close_vectors/vectors_r4.json` (+ `vectors_r4_nan.json`), generowane przez
//! `p6_k5loop_close_r4_gen.mjs`, który WYKONUJE tekst pinu (strażnik SHA-256 wycinków).
//!
//! Porównanie na każdym wektorze: ślad aktywacji, czas, pozycja, `moveLeft` bitowo, `facing`, zmiany facing z czasem,
//! `Move` na każdy krok, strzał (`Facing` + `Shot`, rekord trafienia: cel i łuk), cios wręcz (`Melee`), `dryCol`,
//! `heldAfterFallback`, amunicja, `fleeStuck`, akcje `Rout`/`Leave`/`Shaken` z czasem i wartością morale, stan
//! WSZYSTKICH jednostek po aktywacji (morale bitowo, `routed`, `dead`, `removed`, `fadingOut`, `acted`, `facing`,
//! `screenLostApplied`), `occByKey`, liczba rzutów = liczba `_singleBlow` pinu, `unported` PUSTE.

use std::collections::{BTreeSet, HashMap};

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
use civ_engine::domain::siege_tactics_loop::{
    LoopBody, ProdBody, ProdUnit, MOVE_STEP_MS, RANGED_FLY_MS,
};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_close_vectors/vectors_r4.json");
const VECTORS_NAN: &str = include_str!("p6_k5loop_close_vectors/vectors_r4_nan.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5loop_close_r4_gen.mjs`).
const PIN_SHA256: &str = "72337be6046fd0541c25dbf2bcd79d10c34e07e6bdf24136c5d6b21d80b92c48";
const PLAIN: &str = "Plaskie (rownina/laka)";
/// Rzut strzału w testach r4: pudło (`roll * 100 >= hitPct`), więc trafienie nie zmienia HP ani morale celu. Generator
/// ma atrapę `_singleBlow` = 0 obrażeń; porównanie stanu wszystkich jednostek dotyczy wtedy tylko skutków
/// ucieczki/ripple/rout, a test sprawdza, że rekord ciosu jest pudłem.
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

fn act(u: &Value, side_atk: bool) -> ActivateUnit {
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
        // `_checkRout` (`:9789-9791`): mnożnik obrony terenu jednostki (wejście adaptera, pole `tdm`).
        terrain_defence_mult: num_or(&u["tdm"], 1.0),
        range: num_or(&u["range"], 1.0),
        on_wall_walkway: false,
        primary_ranged: bo(&u["primaryRanged"]),
        mounted: bo(&u["mounted"]),
        phalanx: bo(&u["phalanx"]),
        // `ru.shootingEnabled` (`:2032`): brak pola = `true` (spawn pinu).
        shooting_disabled: u["shootingEnabled"].as_bool() == Some(false),
        dry_col: num_or(&u["dryCol"], -1.0),
        held_after_fallback: bo(&u["heldAfterFallback"]),
        player_order_none: true,
        // Pin `canShoot(ru) = ru.rangedBase && ru.ammoLeft > 0` (`:1457-1459`).
        can_shoot: ranged_base && ammo > 0.0,
        is_siege_unit: false,
        is_siege_tower: false,
        is_ram: false,
        is_catapult: false,
        doctrine_auto: false,
        doctrine_manual: false,
    }
}

fn scene() -> ActivateScene {
    ActivateScene {
        finished: false,
        manual_mode: false,
        is_player_side: false,
        wall_col: -1,
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

fn tag_of(u: UnitRef) -> String {
    match u.side {
        BattleSide::Attacker => format!("atk{}", u.idx),
        BattleSide::Defender => format!("def{}", u.idx),
    }
}

fn label(ev: &ActivateEvent) -> Option<String> {
    Some(match ev {
        // `Attack`/`Done` nie mają wpisu w śladzie generatora (cios i brak akcji porównują akcje i czas);
        // `UpdateMoraleBar`/`StartRout` (okrążenie) porównują akcje `Rout` i stan jednostek.
        ActivateEvent::Attack { .. }
        | ActivateEvent::Done
        | ActivateEvent::ResetPlayerOrder
        | ActivateEvent::UpdateMoraleBar
        | ActivateEvent::StartRout => return None,
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
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
    let mut shots = blow_targets(e);
    shots.extend(blow_targets(&case["expect2"]));
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
                activate: act(u, ix == 0),
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
    let mut body = ProdBody::new(units, scene(), rolls);
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let ds = &mut body.doctrine[ix][i];
            ds.unit_doctrine = u["unitDoctrine"]
                .as_str()
                .map(|s| GroupDoctrine::parse(s).expect("doktryna"));
            ds.group_id = u["groupId"].as_str().map(str::to_string);
            ds.anti_cav_spear = bo(&u["antiCavSpear"]);
            ds.ranged_kite = u["rangedKite"].as_bool().unwrap_or(true);
            ds.shooting_enabled = u["shootingEnabled"].as_bool().unwrap_or(true);
            body.ranged_base[ix][i] = bo(&u["rangedBase"]);
            body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
            body.formation_rank[ix][i] = u["formationRank"].as_f64();
            body.morale_max[ix][i] = num_or(&u["moraleMax"], 100.0);
            body.flee_stuck[ix][i] = num_or(&u["fleeStuck"], 0.0);
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
        .expect("cavMult")
        .iter()
        .map(|(k, m)| (k.clone(), num(m)))
        .collect();
    (v, cav_mult)
}

/// Akcje jednej aktywacji: zmiany facing jednostki działającej (bez zwrotu tuż przed `Melee`/`Shot` i bez zwrotu
/// `_startRout`, `:9817-9818`, który generator widzi jako stan), `Move`, `Melee`, strzał, `Rout`, `Leave`, `Shaken`.
#[derive(Default)]
struct Got {
    facing: Vec<(f64, f64)>,
    moves: Vec<TimedAction>,
    melee: Option<(usize, f64)>,
    shot: Option<(usize, f64, f64, f64)>,
    routs: Vec<(String, f64)>,
    leaves: Vec<(String, f64)>,
    shaken: Vec<(String, String, u64, f64)>,
    /// U1 Evaluatora r4: globalna kolejność `Shaken`/`Rout`/`Leave` w strumieniu akcji (`S:`/`R:`/`L:` + jednostka).
    order: Vec<String>,
}

fn split_actions(actions: &[TimedAction], acting: UnitRef) -> Got {
    let mut g = Got::default();
    // Zwrot `_startRout` jednostki działającej (pierwszy `Facing` po jej `Rout`, po ewentualnej kaskadzie osłony).
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
            BattleAction::Move { unit, .. } if *unit == acting => g.moves.push(a.clone()),
            BattleAction::Melee {
                attacker, target, ..
            } if *attacker == acting => g.melee = Some((target.idx, a.t0)),
            BattleAction::Rout { unit } => {
                g.routs.push((tag_of(*unit), a.t0));
                g.order.push(format!("R:{}", tag_of(*unit)));
            }
            BattleAction::Leave { unit } => {
                g.leaves.push((tag_of(*unit), a.t0));
                g.order.push(format!("L:{}", tag_of(*unit)));
            }
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

/// Wynik porównania jednej aktywacji (liczniki pokrycia).
#[derive(Default)]
struct Checked {
    n_steps: usize,
    shot: bool,
    /// Cios wręcz (`_doMeleeAttack`): w r4 tylko druga aktywacja `ammo2` (U7.6, sąsiad).
    attack: bool,
    left: bool,
    shaken: usize,
    routs: usize,
}

/// Jedna aktywacja (`act_ix` = indeks w `body.trace`) wobec oczekiwania `e` (czasy względem jej startu).
#[allow(clippy::too_many_arguments)]
fn check_activation(
    name: &str,
    e: &Value,
    body: &mut ProdBody<CountRolls>,
    st: &mut TurnSeqState,
    acting: UnitRef,
    act_ix: usize,
    rolls_before: usize,
    failures: &mut Vec<String>,
) -> Checked {
    body.set_now(0.0);
    let _ = body.take_actions();
    let blows_before = body.blows.len();
    let start_pos = body.unit_cell(acting).expect("pozycja");
    let dur = body.start(acting, st);
    let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
    // Cios wręcz: pin w generatorze kończy na `_doMeleeAttack` (zapis celu); sam cios pokrywają inne wektory.
    if want_attack.is_none() {
        body.complete(acting, st);
    }
    let got_trace: Vec<String> = body.trace[act_ix].1.iter().filter_map(label).collect();
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
    let aix = usize::from(acting.side == BattleSide::Defender);
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
    let stuck = body.flee_stuck[aix][acting.idx];
    if !same_f64(stuck, num(&fin["fleeStuck"])) {
        failures.push(format!(
            "{name}: fleeStuck rust={stuck} js={}",
            fin["fleeStuck"]
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
        match body.blows.get(blows_before) {
            Some(rec)
                if rec.attacker == acting
                    && rec.target.idx == x["target"].as_u64().expect("cel") as usize
                    && rec.hit_arc == arc_of(x["hitArc"].as_str().expect("luk"))
                    && rec.missed => {}
            other => failures.push(format!("{name}: trafienie rust={other:?} js={x}")),
        }
    }
    let used = body.rolls.used - rolls_before;
    if used != blows.len() || body.blows.len() - blows_before != blows.len() {
        failures.push(format!("{name}: rzuty rust={used} js={}", blows.len()));
    }
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
    let want_leaves: Vec<(String, f64)> = e["leaves"]
        .as_array()
        .expect("leaves")
        .iter()
        .map(|r| (r["unit"].as_str().expect("u").to_string(), num(&r["t"])))
        .collect();
    if got.leaves != want_leaves {
        failures.push(format!(
            "{name}: Leave rust={:?} js={want_leaves:?}",
            got.leaves
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
    // U1 Evaluatora r4: kolejność zdarzeń w strumieniu jak w pinie (`_updateMoraleBar` przed `_checkRout` w ripple,
    // `:9749-9750`; `_removeUnitFromScene` przed `_shakeAlliesOnLoss`, `:9855-9856`), nie tylko listy osobno.
    let want_order: Vec<String> = e["order"]
        .as_array()
        .expect("order")
        .iter()
        .map(|o| o.as_str().expect("order").to_string())
        .collect();
    if got.order != want_order {
        failures.push(format!(
            "{name}: kolejnosc Shaken/Rout/Leave rust={:?} js={want_order:?}",
            got.order
        ));
    }
    // Stan wszystkich jednostek po aktywacji (bez ciosu wręcz: `complete` nie jest wtedy wołane).
    if want_attack.is_none() {
        for u in e["units"].as_array().expect("units") {
            let tag = u["tag"].as_str().expect("tag");
            let r = UnitRef {
                side: if tag.starts_with("atk") {
                    BattleSide::Attacker
                } else {
                    BattleSide::Defender
                },
                idx: tag[3..].parse().expect("idx"),
            };
            let c = st.unit(r).c;
            let got_u = (
                c.morale.to_bits(),
                c.routed,
                c.dead,
                c.removed,
                c.fading_out,
                c.acted,
                body.facing(r).to_bits(),
                body.screen_lost_applied(r),
            );
            let want_u = (
                num(&u["morale"]).to_bits(),
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
    if !body.unported.is_empty() {
        failures.push(format!("{name}: unported {:?}", body.unported));
    }
    Checked {
        n_steps: steps.len(),
        shot: want_shot.is_some(),
        attack: want_attack.is_some(),
        left: !want_leaves.is_empty(),
        shaken: want_shaken.len(),
        routs: want_routs.len(),
    }
}

/// Pierwsza (i dla `ammo2` druga) aktywacja wektora.
fn check_case(
    case: &Value,
    cav_mult: &HashMap<String, f64>,
    failures: &mut Vec<String>,
) -> (Checked, Option<Checked>) {
    let name = case["name"].as_str().expect("name");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, cav_mult, true);
    let c1 = check_activation(
        name,
        &case["expect"],
        &mut body,
        &mut st,
        acting,
        0,
        0,
        failures,
    );
    let e2 = &case["expect2"];
    if e2.is_null() {
        return (c1, None);
    }
    // FC-U1: druga aktywacja na stanie po pierwszej. `_beginTurn` (`:5650-5660`) odnawia `moveLeft` i zeruje `acted`.
    let side = if acting.side == BattleSide::Attacker {
        &case["atk"]
    } else {
        &case["def"]
    };
    let ml0 = num(&side[acting.idx]["moveLeft"]);
    for s in [&mut st.atk, &mut st.def] {
        for u in s.iter_mut() {
            u.c.acted = false;
        }
    }
    let aix = usize::from(acting.side == BattleSide::Defender);
    let unit = match acting.side {
        BattleSide::Attacker => &mut st.atk[acting.idx],
        BattleSide::Defender => &mut st.def[acting.idx],
    };
    unit.c.move_left = ml0;
    if let Some(t) = e2["attack"]["target"].as_u64() {
        let pu = &mut body.units[aix][acting.idx];
        pu.melee_target = Some(t as usize);
        pu.blow = Some(blow(false));
    }
    let used = body.rolls.used;
    let c2 = check_activation(
        &format!("{name}#2"),
        e2,
        &mut body,
        &mut st,
        acting,
        1,
        used,
        failures,
    );
    if body.units[aix][acting.idx].activate.can_shoot {
        failures.push(format!("{name}: canShoot po ostatnim pocisku"));
    }
    (c1, Some(c2))
}

#[derive(Default, Debug)]
struct Cov {
    flee: usize,
    flee_left: usize,
    flee_steps: usize,
    flee_multi_step: usize,
    flee_stuck_or_hold: usize,
    flee_shaken: usize,
    flee_cascade_rout: usize,
    surround: usize,
    surround_steps: usize,
    surround_left: usize,
    surround_shaken_or_cascade: usize,
    nobow: usize,
    nobow_shot: usize,
    nobow_move: usize,
    nobow_no_action: usize,
    ammo2: usize,
    ammo2_second_u76: usize,
    ammo2_second_melee: usize,
    steady2: usize,
    steady2_steps: usize,
}

fn run_family(v: &Value, cav_mult: &HashMap<String, f64>, nan: bool) -> (Vec<String>, Cov) {
    let mut failures = Vec::new();
    let mut cov = Cov::default();
    for case in v["cases"].as_array().expect("cases") {
        let name = case["name"].as_str().expect("name");
        let (c, c2) = check_case(case, cav_mult, &mut failures);
        let kind = case["kind"].as_str().expect("kind");
        let base = kind.strip_suffix("-nan").unwrap_or(kind);
        assert_eq!(kind.ends_with("-nan"), nan, "{name}: rodzina {kind}");
        if nan && base != "nobow" {
            // Lekcja r2 (a): przy NaN ucieczka robi najwyżej jeden krok (`ru.moveLeft > 0` fałszywe, `:9895`).
            assert!(c.n_steps <= 1, "{name}: NaN, pin {} krokow", c.n_steps);
        }
        match base {
            "flee" => {
                cov.flee += 1;
                if c.left {
                    cov.flee_left += 1;
                }
                if c.n_steps > 0 {
                    cov.flee_steps += 1;
                } else if !c.left {
                    cov.flee_stuck_or_hold += 1;
                }
                if c.n_steps >= 2 {
                    cov.flee_multi_step += 1;
                }
                if c.shaken > 0 {
                    cov.flee_shaken += 1;
                }
                if c.routs > 0 {
                    cov.flee_cascade_rout += 1;
                }
            }
            "surround" => {
                cov.surround += 1;
                assert!(c.routs >= 1, "{name}: okrazenie bez routu");
                if c.n_steps > 0 {
                    cov.surround_steps += 1;
                }
                if c.left {
                    cov.surround_left += 1;
                }
                if c.shaken > 0 || c.routs > 1 {
                    cov.surround_shaken_or_cascade += 1;
                }
            }
            "nobow" => {
                cov.nobow += 1;
                if c.shot {
                    cov.nobow_shot += 1;
                } else if c.n_steps > 0 {
                    cov.nobow_move += 1;
                } else {
                    cov.nobow_no_action += 1;
                }
            }
            "ammo2" => {
                cov.ammo2 += 1;
                assert!(c.shot, "{name}: pierwsza aktywacja bez strzalu");
                let c2 = c2.expect("druga aktywacja");
                if !c2.shot {
                    cov.ammo2_second_u76 += 1;
                }
                if c2.attack {
                    cov.ammo2_second_melee += 1;
                }
            }
            "steady2" => {
                cov.steady2 += 1;
                if c.n_steps > 0 {
                    cov.steady2_steps += 1;
                }
            }
            other => panic!("rodzina {other}"),
        }
    }
    (failures, cov)
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
        Err(_) => panic!("{label}: brak konca w 90 s (petla ruchu nie konczy sie)"),
    }
}

#[test]
fn ucieczka_strzelec_bez_strzelania_zgodne_z_pinem() {
    with_timeout("r4", || {
        let (v, cav_mult) = load_from(VECTORS);
        assert_eq!(v["cases"].as_array().expect("cases").len(), 1220);
        let (failures, cov) = run_family(&v, &cav_mult, false);
        assert!(
            failures.is_empty(),
            "{} rozbieznosci, pierwsze: {:#?}",
            failures.len(),
            &failures[..failures.len().min(12)]
        );
        eprintln!("pokrycie r4: {cov:?}");
        assert_eq!(cov.flee, 400);
        assert!(cov.flee_left >= 150, "{cov:?}");
        assert!(cov.flee_steps >= 150, "{cov:?}");
        assert!(cov.flee_multi_step >= 80, "{cov:?}");
        assert!(cov.flee_stuck_or_hold >= 50, "{cov:?}");
        assert!(cov.flee_shaken >= 80, "{cov:?}");
        assert!(cov.flee_cascade_rout >= 30, "{cov:?}");
        assert_eq!(cov.surround, 240);
        assert!(cov.surround_steps >= 150, "{cov:?}");
        // U3 Evaluatora r4: okrążenie kończy się zniknięciem z pola (krawędź / `fleeStuck >= 2`).
        assert!(cov.surround_left >= 40, "{cov:?}");
        assert_eq!(cov.nobow, 480);
        assert!(cov.nobow_shot >= 200, "{cov:?}");
        assert!(cov.nobow_move >= 60, "{cov:?}");
        assert!(cov.nobow_no_action >= 20, "{cov:?}");
        assert_eq!(cov.ammo2, 60);
        assert!(cov.ammo2_second_u76 >= 30, "{cov:?}");
        assert_eq!(cov.steady2, 40);
        assert_eq!(cov.steady2_steps, 40, "{cov:?}");
    });
}

/// Lekcja r2 (a): `ru.moveLeft = NaN` dla ucieczki i strzelca bez strzelania.
#[test]
fn nan_move_left_zgodne_z_pinem() {
    with_timeout("NaN", || {
        let (v, cav_mult) = load_from(VECTORS_NAN);
        assert_eq!(v["cases"].as_array().expect("cases").len(), 1120);
        let (failures, cov) = run_family(&v, &cav_mult, true);
        assert!(
            failures.is_empty(),
            "{} rozbieznosci, pierwsze: {:#?}",
            failures.len(),
            &failures[..failures.len().min(12)]
        );
        eprintln!("pokrycie NaN: {cov:?}");
        assert!(cov.flee_steps + cov.surround_steps >= 300, "{cov:?}");
        assert!(cov.nobow_move >= 60, "{cov:?}");
    });
}

/// Bez danych terenu (D1 K5DOC-T4e-0) ucieczka nie jest wykonywana: jawny tag `ucieczka-routed` jak przed r4, bez ruchu,
/// bez zniknięcia z pola i bez ripple. Okrążenie: rout (`_startRout`) wykonuje wtedy `complete`, jak dotąd.
#[test]
fn ucieczka_bez_terenu_jawny_tag() {
    let (v, cav_mult) = load_from(VECTORS);
    for kind in ["flee", "surround"] {
        let mut n = 0;
        for case in v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .filter(|c| c["kind"] == kind)
            .take(40)
        {
            let Built {
                mut body,
                mut st,
                acting,
            } = build(case, &cav_mult, false);
            let before = body.unit_cell(acting);
            let ml0 = st.unit(acting).c.move_left;
            assert_eq!(body.start(acting, &st), 0.0);
            body.complete(acting, &mut st);
            assert_eq!(body.unit_cell(acting), before);
            assert_eq!(st.unit(acting).c.move_left.to_bits(), ml0.to_bits());
            assert_eq!(body.unported, vec![(acting, "ucieczka-routed")]);
            assert!(st.unit(acting).c.routed, "{kind}: jednostka rozbita");
            assert!(!st.unit(acting).c.removed, "{kind}: bez znikniecia z pola");
            assert!(body.pending_actions().iter().all(|a| !matches!(
                a.action,
                BattleAction::Leave { .. } | BattleAction::Shaken { .. }
            )));
            n += 1;
        }
        assert_eq!(n, 40, "{kind}");
    }
}

/// K5LOOP-TAGS-REST (D-INT-2; dawniej `ucieczka_przy_murze_jawny_tag`, oczekiwał tagu `ucieczka-oblezenie` bez ruchu):
/// przy murze ucieczka jest wykonywana. Jedyna różnica pinu przy murze to bramka `_doMove` `siegeWallCol >= 0 &&
/// _siegeMoveRefused` (`:8689`), a `_siegeApproachRestricted` (`:7953`) zwraca `false` dla `ru.routed`: rozbita jednostka
/// nigdy nie dostaje odmowy. Wektory pinu rodziny `flee` (wszystkie 400, jednostka rozbita na starcie) muszą więc dać ten
/// sam wynik przy murze co bez niego (pełne [`check_activation`]: kroki, czasy, `Leave`, `Shaken`, stan, `occByKey`).
/// Zgodność z wykonanym tekstem pinu PRZY MURZE (z `_siegeMoveRefused` i zagrożeniami) sprawdza `p6_k5loop_tags_rest`.
#[test]
fn ucieczka_przy_murze_zgodna_z_pinem() {
    with_timeout("mur", || {
        let (v, cav_mult) = load_from(VECTORS);
        let mut failures = Vec::new();
        let (mut n, mut moved) = (0, 0);
        for case in v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .filter(|c| c["kind"] == "flee")
        {
            let name = case["name"].as_str().expect("name");
            let Built {
                mut body,
                mut st,
                acting,
            } = build(case, &cav_mult, true);
            st.siege_wall_col = 40;
            let c = check_activation(
                &format!("{name}@mur"),
                &case["expect"],
                &mut body,
                &mut st,
                acting,
                0,
                0,
                &mut failures,
            );
            assert!(body.unported.is_empty(), "{name}: {:?}", body.unported);
            if c.n_steps > 0 {
                moved += 1;
            }
            n += 1;
        }
        assert!(
            failures.is_empty(),
            "{} rozbieznosci, pierwsze: {:#?}",
            failures.len(),
            &failures[..failures.len().min(12)]
        );
        assert_eq!(n, 400);
        assert!(moved >= 150, "kroki ucieczki przy murze: {moved}");
    });
}

/// `BattleAction::Leave` i `BattleAction::Shaken` nie mają jeszcze wariantu DTO (I5): konwersja jest jawnym błędem.
#[test]
fn leave_i_shaken_bez_dto_to_jawny_blad() {
    use civ_engine::domain::siege_tactics_actions::{actions_to_dto, ActionError};
    let (v, cav_mult) = load_from(VECTORS);
    let cases = v["cases"].as_array().expect("cases");
    let leave = cases
        .iter()
        .find(|c| {
            c["kind"] == "flee"
                && !c["expect"]["leaves"].as_array().expect("l").is_empty()
                && c["expect"]["shaken"].as_array().expect("s").is_empty()
                && c["expect"]["steps"].as_array().expect("st").is_empty()
                && c["expect"]["facing"].as_array().expect("f").is_empty()
        })
        .expect("ucieczka z pola bez ripple");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(leave, &cav_mult, true);
    body.start(acting, &st);
    body.complete(acting, &mut st);
    let actions = body.take_actions();
    assert_eq!(
        actions_to_dto(&actions, &st),
        Err(ActionError::LeaveWithoutDto(acting))
    );
    let shaken = cases
        .iter()
        .find(|c| c["kind"] == "flee" && !c["expect"]["shaken"].as_array().expect("s").is_empty())
        .expect("ripple");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(shaken, &cav_mult, true);
    body.start(acting, &st);
    body.complete(acting, &mut st);
    let actions = body.take_actions();
    let first_shaken = actions
        .iter()
        .find_map(|a| match a.action {
            BattleAction::Shaken { unit, .. } => Some(unit),
            _ => None,
        })
        .expect("Shaken");
    // `Leave` poprzedza ripple (`:9855-9856`); bez niego (i bez kroków) pierwszym błędem jest `Shaken`.
    let no_leave: Vec<TimedAction> = actions
        .into_iter()
        .filter(|a| {
            !matches!(
                a.action,
                BattleAction::Leave { .. } | BattleAction::Move { .. }
            )
        })
        .collect();
    assert_eq!(
        actions_to_dto(&no_leave, &st),
        Err(ActionError::ShakenWithoutDto(first_shaken))
    );
}

/// U5 Evaluatora r4 (K5LOOP-TAGS-REST, D-INT-2): kontrakt `flee_after` jest twardą asercją dla JEDNOSTKI (`complete`
/// innej jednostki niż `start` ucieczki = panic, nie ciche nadpisanie). Dawniej panic dawała też KAŻDA zmiana stanu
/// w oknie start..complete; przy murze zegar (wieże, `BodyTimer`) zmienia jednostki w tym oknie zgodnie z pinem, więc
/// stan jest łączony pole po polu (test `ucieczka_laczenie_ze_zmiana_zegara`).
#[test]
#[should_panic(expected = "kontrakt flee_after")]
fn ucieczka_kontrakt_stanu_miedzy_start_a_complete() {
    let (v, cav_mult) = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["kind"] == "flee")
        .expect("flee");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, &cav_mult, true);
    body.start(acting, &st);
    // Sterownik łamie kontrakt: druga ucieczka startuje przed `complete` pierwszej (nadpisałaby jej wynik).
    let side = if acting.side == BattleSide::Attacker {
        BattleSide::Defender
    } else {
        BattleSide::Attacker
    };
    let list = match side {
        BattleSide::Attacker => &mut st.atk,
        BattleSide::Defender => &mut st.def,
    };
    let idx = list
        .iter()
        .position(|u| !u.c.dead && !u.c.fading_out && !u.c.removed)
        .expect("zywa jednostka drugiej strony");
    list[idx].c.routed = true;
    body.start(UnitRef { side, idx }, &st);
    body.complete(acting, &mut st);
}

/// K5LOOP-TAGS-REST: zmiana stanu przez zegar sterownika w oknie start..complete ucieczki. Pole zmienione tylko przez
/// zegar zostaje, pole zmienione tylko przez ucieczkę bierze wynik ucieczki (bez tagu); to samo pole zmienione przez oba
/// na różne wartości = jawny tag `ucieczka-konflikt-zegara` i wartość zegara.
#[test]
fn ucieczka_laczenie_ze_zmiana_zegara() {
    let (v, cav_mult) = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| {
            c["kind"] == "flee" && !c["expect"]["steps"].as_array().expect("steps").is_empty()
        })
        .expect("flee z krokiem");
    let fresh = || build(case, &cav_mult, true);
    // Wzorzec: bez zmian w oknie.
    let Built {
        mut body,
        mut st,
        acting,
    } = fresh();
    body.start(acting, &st);
    body.complete(acting, &mut st);
    let want = st.clone();
    let ml_want = st.unit(acting).c.move_left;
    // (a) zegar zmienia HP innej jednostki: wynik = ucieczka + zmiana zegara, bez tagu.
    let Built {
        mut body,
        mut st,
        acting,
    } = fresh();
    body.start(acting, &st);
    let other = UnitRef {
        side: if acting.side == BattleSide::Attacker {
            BattleSide::Defender
        } else {
            BattleSide::Attacker
        },
        idx: 0,
    };
    let hp0 = st.unit(other).c.hp;
    match other.side {
        BattleSide::Attacker => st.atk[0].c.hp = hp0 - 1.0,
        BattleSide::Defender => st.def[0].c.hp = hp0 - 1.0,
    }
    body.complete(acting, &mut st);
    assert!(body.unported.is_empty(), "{:?}", body.unported);
    assert_eq!(st.unit(other).c.hp, hp0 - 1.0);
    assert_eq!(st.unit(acting).c.move_left.to_bits(), ml_want.to_bits());
    assert_eq!(st.unit(acting).c.removed, want.unit(acting).c.removed);
    // (b) zegar zmienia `moveLeft` uciekającej jednostki na inną wartość niż ucieczka: konflikt, wartość zegara, tag.
    let Built {
        mut body,
        mut st,
        acting,
    } = fresh();
    body.start(acting, &st);
    let clock = -7.0;
    assert_ne!(clock, ml_want);
    match acting.side {
        BattleSide::Attacker => st.atk[acting.idx].c.move_left = clock,
        BattleSide::Defender => st.def[acting.idx].c.move_left = clock,
    }
    body.complete(acting, &mut st);
    assert_eq!(body.unported, vec![(acting, "ucieczka-konflikt-zegara")]);
    assert_eq!(st.unit(acting).c.move_left, clock);
}

/// U5: ten sam scenariusz bez naruszenia kontraktu przechodzi (asercja nie strzela na poprawnej ścieżce).
#[test]
fn ucieczka_kontrakt_stanu_bez_zmian_przechodzi() {
    let (v, cav_mult) = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| c["kind"] == "flee")
        .expect("flee");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, &cav_mult, true);
    body.start(acting, &st);
    body.complete(acting, &mut st);
}
