//! P6 SIEGE-TAKTYKA K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, DODATEK r3, Operator): zgodność `ProdBody`
//! z pinem `07d2fbd72` dla `_rangedAction` (`battleScene.ts:6656-6739`: KITE, strzał, marsz `_rangedForwardStep`),
//! gałęzi `primaryRanged` bez amunicji (U7.6 `:6250-6273`, `_fallBackStep` `:7228-7244`) i `_phalanxAction`
//! (`:6546-6578`, `_phalanxStep`), wykonywanych w ciele z każdym krokiem przez `_doMove` (`_updateFacing`, `Move`) i ze
//! strzałem `_doRangedAttack` (`Facing` + `Shot`, trafienie `_singleBlow(…, true)` po `RANGED_FLY_MS`, koniec po
//! `RANGED_GAP_MS`).
//!
//! Wektory: `p6_k5loop_close_vectors/vectors_r3.json` (+ `vectors_r3_nan.json`), generowane przez
//! `p6_k5loop_close_r3_gen.mjs`, który WYKONUJE tekst pinu (strażnik SHA-256 wycinków). Rodziny: `ranged`, `fallback`,
//! `phalanx` oraz ich kopie z `ru.moveLeft = NaN` (lekcja r2).
//!
//! Porównanie na każdym wektorze: ślad aktywacji (bez `Attack`/`Done`, sprawdzanych osobno akcjami), czas, pozycja,
//! `moveLeft` bitowo, `facing`, każda zmiana facing z czasem, każdy krok jako `Move`, cel ciosu (`Melee`), strzał
//! (`Facing` strzelca, `Shot` z chwilą trafienia, rekord ciosu: cel i łuk), `dryCol`, `heldAfterFallback`, amunicja,
//! `occByKey`, liczba rzutów = liczba `_singleBlow` pinu, `unported` PUSTE.

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
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    LoopBody, ProdBody, ProdUnit, MOVE_STEP_MS, RANGED_FLY_MS,
};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_close_vectors/vectors_r3.json");
const VECTORS_NAN: &str = include_str!("p6_k5loop_close_vectors/vectors_r3_nan.json");
/// Obrona r3 (N1): ręcznie ułożone scenariusze KITE „przyparty” z remisem odległości (generator, sekcja `tieCases`).
const VECTORS_TIE: &str = include_str!("p6_k5loop_close_vectors/vectors_r3_tie.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5loop_close_r3_gen.mjs`).
const PIN_SHA256: &str = "2bba6a05f81e66287314361878b2fbc510dc598664ef729c2ef71f02e8c2cebd";
const PLAIN: &str = "Plaskie (rownina/laka)";

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
        never_rout: false,
        surround_applied: false,
        morale: 100.0,
        flee_morale: 0.0,
        terrain_defence_mult: 1.0,
        range: num_or(&u["range"], 1.0),
        on_wall_walkway: false,
        primary_ranged: bo(&u["primaryRanged"]),
        mounted: bo(&u["mounted"]),
        phalanx: bo(&u["phalanx"]),
        shooting_disabled: false,
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

fn label(ev: &ActivateEvent) -> Option<String> {
    Some(match ev {
        // `Attack`/`Done` nie mają wpisu w śladzie generatora: cios i brak akcji porównują akcje i czas.
        ActivateEvent::Attack { .. } | ActivateEvent::Done | ActivateEvent::ResetPlayerOrder => {
            return None
        }
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::AdvanceStep => "advanceStep".into(),
        ActivateEvent::RangedAction => "rangedAction".into(),
        ActivateEvent::FallBackStep => "fallBackStep".into(),
        ActivateEvent::PhalanxAction => "phalanxAction".into(),
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

fn build(case: &Value, cav_mult: &HashMap<String, f64>, with_terrain: bool) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let acting = UnitRef {
        side: side_of(case["acting"]["side"].as_str().expect("side")),
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    let e = &case["expect"];
    let attack = e["attack"]["target"].as_u64();
    let shots: Vec<usize> = e["blows"]
        .as_array()
        .map(|bs| {
            bs.iter()
                .map(|x| x["target"].as_u64().expect("cel") as usize)
                .collect()
        })
        .unwrap_or_default();
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let dead = b(&u["dead"]);
            let me = ix == usize::from(acting.side == BattleSide::Defender) && i == acting.idx;
            // Cios wręcz (U7.6 sąsiad, falanga): szablon na cel z wektora (adapter `_targetInRange`).
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
                    morale: 100.0,
                    flee_morale: 0.0,
                    move_left: num(&u["moveLeft"]),
                    never_rout: false,
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
        values: vec![0.37; shots.len()],
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
            // `ru.rangedKite !== false` (`:6689`): brak pola = `true`.
            ds.ranged_kite = u["rangedKite"].as_bool().unwrap_or(true);
            body.ranged_base[ix][i] = bo(&u["rangedBase"]);
            body.ammo_left[ix][i] = num_or(&u["ammoLeft"], 0.0);
            body.formation_rank[ix][i] = u["formationRank"].as_f64();
        }
    }
    // Szablony strzału na cele wybrane przez pin (adapter `_singleBlow(…, true)`); inny cel w ciele =
    // `strzal-bez-szablonu` w `unported` = rozbieżność.
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

/// Akcje jednostki działającej: zmiany facing (bez zwrotu tuż przed `Melee`/`Shot`), `Move`, `Melee`, strzał
/// (`Facing` przed `Shot`, `Shot`).
#[derive(Default)]
struct Got {
    facing: Vec<(f64, f64)>,
    moves: Vec<TimedAction>,
    melee: Option<(usize, f64)>,
    shot: Option<(usize, f64, f64, f64)>,
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

/// Wynik porównania jednego wektora (liczniki pokrycia).
struct Checked {
    n_steps: usize,
    shot: bool,
    attack: bool,
}

fn check_case(
    case: &Value,
    cav_mult: &HashMap<String, f64>,
    failures: &mut Vec<String>,
) -> Checked {
    let name = case["name"].as_str().expect("name");
    let e = &case["expect"];
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, cav_mult, true);
    let start_pos = body.unit_cell(acting).expect("pozycja");
    let dur = body.start(acting, &st);
    let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
    // Cios wręcz: pin w generatorze kończy na `_doMeleeAttack` (zapis celu); sam cios pokrywają inne wektory.
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
    // Strzał: `_doRangedAttack` w `t`, trafienie (`_singleBlow` ranged) w `t + RANGED_FLY_MS` z łukiem `relativeHit`.
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
                    && rec.hit_arc == arc_of(x["hitArc"].as_str().expect("luk")) => {}
            other => failures.push(format!("{name}: trafienie rust={other:?} js={x}")),
        }
    }
    if body.rolls.used != blows.len() || (want_shot.is_some() && body.blows.len() != 1) {
        failures.push(format!(
            "{name}: rzuty rust={} js={}",
            body.rolls.used,
            blows.len()
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
    if !body.unported.is_empty() {
        failures.push(format!("{name}: unported {:?}", body.unported));
    }
    Checked {
        n_steps: steps.len(),
        shot: want_shot.is_some(),
        attack: want_attack.is_some(),
    }
}

#[derive(Default, Debug)]
struct Cov {
    ranged: usize,
    ranged_shot_in_place: usize,
    ranged_shot_after_move: usize,
    ranged_move_no_shot: usize,
    ranged_multi_step: usize,
    ranged_no_action: usize,
    fallback: usize,
    fallback_steps: usize,
    fallback_multi_step: usize,
    fallback_attack: usize,
    fallback_hold: usize,
    phalanx: usize,
    phalanx_attack: usize,
    phalanx_single_step: usize,
    phalanx_lone_advance: usize,
    phalanx_no_action: usize,
}

fn run_family(v: &Value, cav_mult: &HashMap<String, f64>, nan: bool) -> (Vec<String>, Cov) {
    let mut failures = Vec::new();
    let mut cov = Cov::default();
    for case in v["cases"].as_array().expect("cases") {
        let name = case["name"].as_str().expect("name");
        let c = check_case(case, cav_mult, &mut failures);
        let kind = case["kind"].as_str().expect("kind");
        let base = kind.strip_suffix("-nan").unwrap_or(kind);
        assert_eq!(kind.ends_with("-nan"), nan, "{name}: rodzina {kind}");
        if nan && base != "phalanx" {
            // Lekcja r2 (a): przy NaN pin robi najwyżej jeden krok marszu/odwrotu (`:6806`, `:7240`).
            assert!(c.n_steps <= 1, "{name}: NaN, pin {} krokow", c.n_steps);
        }
        let phalanx_adv = bo(&case["expect"]["phalanxAdvance"]);
        match base {
            "ranged" => {
                cov.ranged += 1;
                match (c.shot, c.n_steps) {
                    (true, 0) => cov.ranged_shot_in_place += 1,
                    (true, _) => cov.ranged_shot_after_move += 1,
                    (false, 0) => cov.ranged_no_action += 1,
                    (false, _) => cov.ranged_move_no_shot += 1,
                }
                if c.n_steps >= 2 {
                    cov.ranged_multi_step += 1;
                }
            }
            "fallback" => {
                cov.fallback += 1;
                if c.attack {
                    cov.fallback_attack += 1;
                } else if c.n_steps > 0 {
                    cov.fallback_steps += 1;
                } else {
                    cov.fallback_hold += 1;
                }
                if c.n_steps >= 2 {
                    cov.fallback_multi_step += 1;
                }
            }
            "phalanx" => {
                cov.phalanx += 1;
                if c.attack {
                    cov.phalanx_attack += 1;
                } else if phalanx_adv {
                    cov.phalanx_lone_advance += 1;
                } else if c.n_steps == 1 {
                    cov.phalanx_single_step += 1;
                } else {
                    cov.phalanx_no_action += 1;
                }
            }
            other => panic!("rodzina {other}"),
        }
    }
    (failures, cov)
}

#[test]
fn strzelec_odwrot_falanga_zgodne_z_pinem() {
    let (v, cav_mult) = load_from(VECTORS);
    assert_eq!(v["cases"].as_array().expect("cases").len(), 1040);
    let (failures, cov) = run_family(&v, &cav_mult, false);
    assert!(
        failures.is_empty(),
        "{} rozbieznosci, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(12)]
    );
    eprintln!("pokrycie r3: {cov:?}");
    assert_eq!(cov.ranged, 480);
    assert!(cov.ranged_shot_in_place >= 150, "{cov:?}");
    assert!(cov.ranged_shot_after_move >= 100, "{cov:?}");
    assert!(cov.ranged_move_no_shot >= 50, "{cov:?}");
    assert!(cov.ranged_multi_step >= 60, "{cov:?}");
    assert!(cov.ranged_no_action >= 20, "{cov:?}");
    assert_eq!(cov.fallback, 260);
    assert!(cov.fallback_steps >= 140, "{cov:?}");
    assert!(cov.fallback_multi_step >= 80, "{cov:?}");
    assert!(cov.fallback_attack >= 40, "{cov:?}");
    assert!(cov.fallback_hold >= 50, "{cov:?}");
    assert_eq!(cov.phalanx, 300);
    assert!(cov.phalanx_attack >= 20, "{cov:?}");
    assert!(cov.phalanx_single_step >= 50, "{cov:?}");
    assert!(cov.phalanx_lone_advance >= 100, "{cov:?}");
    assert!(cov.phalanx_no_action >= 30, "{cov:?}");
}

/// Lekcja r2 (a): `ru.moveLeft = NaN` dla strzelca, odwrotu i falangi. Pętle ruchu kończą się, gdy `ru.moveLeft > 0`
/// jest fałszywe (`:6806`, `:7240`), a preludium `moveLeft <= 0` przepuszcza NaN. Strażnik czasu: pętla bez końca daje
/// czytelny FAIL zamiast zawieszenia binarki.
#[test]
fn nan_move_left_zgodne_z_pinem() {
    let (tx, rx) = std::sync::mpsc::channel();
    let worker = std::thread::spawn(move || {
        let r = std::panic::catch_unwind(|| {
            let (v, cav_mult) = load_from(VECTORS_NAN);
            assert_eq!(v["cases"].as_array().expect("cases").len(), 1040);
            let (failures, cov) = run_family(&v, &cav_mult, true);
            assert!(
                failures.is_empty(),
                "{} rozbieznosci, pierwsze: {:#?}",
                failures.len(),
                &failures[..failures.len().min(12)]
            );
            eprintln!("pokrycie NaN: {cov:?}");
            assert!(
                cov.ranged_move_no_shot + cov.ranged_shot_after_move >= 150,
                "{cov:?}"
            );
            assert!(cov.fallback_steps >= 140, "{cov:?}");
            assert!(
                cov.phalanx_single_step + cov.phalanx_lone_advance >= 150,
                "{cov:?}"
            );
        });
        let _ = tx.send(r.is_ok());
        if let Err(e) = r {
            std::panic::resume_unwind(e);
        }
    });
    match rx.recv_timeout(std::time::Duration::from_secs(90)) {
        Ok(true) => worker.join().expect("watek testu NaN"),
        Ok(false) => {
            let _ = worker.join();
            panic!("NaN: rozbieznosc z pinem (szczegoly wyzej)");
        }
        Err(_) => panic!("NaN: brak konca w 90 s (petla ruchu nie konczy sie przy moveLeft = NaN)"),
    }
}

/// Bez danych terenu gałęzie ruchowe r3 nie działają (także strzał z miejsca i cios falangi) i są jawnie oznaczone
/// (D1 K5DOC-T4e-0, jak `kawaleria-brak-terenu` w r2); stan bez zmian, zero rzutów.
#[test]
fn bez_terenu_jawne_tagi() {
    let (v, cav_mult) = load_from(VECTORS);
    for (kind, tag, trace) in [
        ("ranged", "strzelec-brak-terenu", "rangedAction"),
        ("fallback", "odwrot-brak-terenu", "fallBackStep"),
        ("phalanx", "falanga-brak-terenu", "phalanxAction"),
    ] {
        let mut n = 0;
        for case in v["cases"]
            .as_array()
            .expect("cases")
            .iter()
            .filter(|c| {
                c["kind"] == kind
                    && c["expect"]["trace"]
                        .as_array()
                        .expect("trace")
                        .iter()
                        .any(|t| t == trace)
            })
            .take(30)
        {
            let Built {
                mut body,
                mut st,
                acting,
            } = build(case, &cav_mult, false);
            body.rolls.values.clear();
            let before = body.unit_cell(acting);
            let ml0 = st.unit(acting).c.move_left;
            assert_eq!(body.start(acting, &st), 0.0);
            body.complete(acting, &mut st);
            assert_eq!(body.unit_cell(acting), before);
            assert_eq!(st.unit(acting).c.move_left.to_bits(), ml0.to_bits());
            assert_eq!(body.unported, vec![(acting, tag)]);
            assert!(body.blows.is_empty());
            n += 1;
        }
        assert!(n >= 20, "{kind}: {n}");
    }
}

/// `BattleAction::Shot` nie ma jeszcze wariantu DTO (I5): konwersja jest jawnym błędem, nie cichym pominięciem.
#[test]
fn strzal_bez_dto_to_jawny_blad() {
    use civ_engine::domain::siege_tactics_actions::{actions_to_dto, ActionError};
    let (v, cav_mult) = load_from(VECTORS);
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| {
            c["kind"] == "ranged"
                && c["expect"]["steps"].as_array().expect("steps").is_empty()
                && c["expect"]["blows"].as_array().expect("blows").len() == 1
        })
        .expect("strzal z miejsca");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, &cav_mult, true);
    body.start(acting, &st);
    body.complete(acting, &mut st);
    let actions = body.take_actions();
    assert!(actions
        .iter()
        .any(|a| matches!(a.action, BattleAction::Shot { .. })));
    assert_eq!(
        actions_to_dto(&actions, &st),
        Err(ActionError::ShotWithoutDto(acting))
    );
}

/// Kolejność rzutów strzałów: dwie kolejne aktywacje strzelców na wspólnym stanie zużywają po jednym rzucie, w
/// kolejności aktywacji (pin: `Math.random()` w `_singleBlow` po locie pocisku, przed `done()` i następną aktywacją).
/// Rzut zużyty przed trafieniem albo dodatkowy rzut przesuwa sekwencję i daje FAIL.
#[test]
fn rzuty_strzalow_w_kolejnosci_aktywacji() {
    let (v, cav_mult) = load_from(VECTORS);
    let cases: Vec<&Value> = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| {
            c["kind"] == "ranged"
                && c["expect"]["steps"].as_array().expect("steps").is_empty()
                && c["expect"]["blows"].as_array().expect("blows").len() == 1
        })
        .take(40)
        .collect();
    assert!(cases.len() >= 40);
    let mut pairs = 0;
    for case in cases {
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, &cav_mult, true);
        body.rolls.values = vec![0.05, 0.95];
        body.start(acting, &st);
        body.complete(acting, &mut st);
        assert_eq!(body.rolls.used, 1, "jeden rzut na strzal");
        // Druga aktywacja tego samego strzelca (stan po pierwszym strzale; cel ten sam albo nowy z pinu).
        let aix = usize::from(acting.side == BattleSide::Defender);
        if !body.units[aix][acting.idx].activate.can_shoot {
            continue;
        }
        for t in 0..body.units[1 - aix].len() {
            body.ranged_blows[aix][acting.idx]
                .entry(t)
                .or_insert_with(|| blow(true));
        }
        body.start(acting, &st);
        body.complete(acting, &mut st);
        if body.blows.len() == 2 {
            assert_eq!(body.rolls.used, 2);
            assert!(
                (body.blows[0].roll - 5.0).abs() < 1e-9,
                "{:?}",
                body.blows[0]
            );
            assert!(
                (body.blows[1].roll - 95.0).abs() < 1e-9,
                "{:?}",
                body.blows[1]
            );
            pairs += 1;
        }
    }
    assert!(pairs >= 20, "pary strzalow: {pairs}");
}

/// Obrona r3 (N1, mutant Evaluatora E11): KITE „przyparty” (`:6719-6721`) strzela w `_rangedTargetInRange(ru) ?? nearest`.
/// `_rangedTargetInRange` (`:7041-7052`) przy remisie odległości bierze niższe HP, `_nearestEnemy` (`:8296-8304`) pierwszego
/// na liście. Każdy wektor ma remis z niższym HP DALEJ na liście, więc podmiana na samo `nearest` daje inny cel (generator
/// odrzuca wektor, w którym cel pinu == `nearest`). Wszystkie cztery sąsiednie pola są nieprzechodnie: brak kroku.
#[test]
fn kite_przyparty_remis_odleglosci_nizsze_hp() {
    let (v, cav_mult) = load_from(VECTORS_TIE);
    let cases = v["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 8);
    let mut failures = Vec::new();
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let c = check_case(case, &cav_mult, &mut failures);
        assert!(c.shot, "{name}: brak strzału");
        assert_eq!(c.n_steps, 0, "{name}: krok mimo przyparcia");
        assert!(!c.attack, "{name}: cios wręcz");
        let blows = case["expect"]["blows"].as_array().expect("blows");
        assert_eq!(blows.len(), 1, "{name}");
        // Cel pinu różny od `nearest` (pierwszy przy remisie): wektor rozróżnia mutanta E11.
        let acting_atk = case["acting"]["side"].as_str() == Some("atk");
        let enemies = case[if acting_atk { "def" } else { "atk" }]
            .as_array()
            .expect("wrogowie");
        let me = &case[if acting_atk { "atk" } else { "def" }][0];
        let (mq, mr) = (num(&me["q"]), num(&me["r"]));
        let mut nearest = (usize::MAX, f64::INFINITY);
        for (i, e) in enemies.iter().enumerate() {
            let d = (num(&e["q"]) - mq).abs() + (num(&e["r"]) - mr).abs();
            if d < nearest.1 {
                nearest = (i, d);
            }
        }
        assert_ne!(
            blows[0]["target"].as_u64(),
            Some(nearest.0 as u64),
            "{name}: wektor nie rozróżnia E11"
        );
    }
    assert!(
        failures.is_empty(),
        "{} rozbieznosci: {:#?}",
        failures.len(),
        failures
    );
}
