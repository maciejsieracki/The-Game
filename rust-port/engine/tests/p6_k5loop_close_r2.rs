//! P6 SIEGE-TAKTYKA K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, DODATEK r2, Operator): zgodność `ProdBody`
//! z pinem `07d2fbd72` dla C-FLANK w `_advanceStep` (`battleScene.ts:8204-8235`) i `_cavalryAction` (`:6372-6412`)
//! wykonywanych w ciele, z każdym krokiem przez `_doMove` (koszt terenu jazdy, bród, `_updateFacing`) oraz z akcją
//! `BattleAction::Move` (D-K5C-r2-2) na każdy krok.
//!
//! Wektory: `p6_k5loop_close_vectors/vectors_r2.json`, generowane przez `p6_k5loop_close_r2_gen.mjs`, który WYKONUJE
//! tekst pinu (`_activateUnit` -> `_advanceStep` / `_cavalryAction` -> `_doMove` -> `_updateFacing`, z
//! `_pickTargetByPriority`, `_firstStepTowardDirectedAttack`, `_cavAdjacentNonSpear`, `_cavalryTarget`,
//! `_cavDirectedManeuverStep`, `_cavManeuverStep`, `_bestChargeStepKey`, `cavalryTerrainMultiplier` na danych
//! `terrain-combat.json`), strażnik SHA-256 wycinków. Rodziny: `flank-r1` (te same 120 scenariuszy `flank` co w r1,
//! wtedy tag `krok-naprzod-flanka`; teraz pełny pin i `unported` puste), `flank-full`, `cavalry`.
//!
//! Porównanie na każdym wektorze: ślad aktywacji, czas trwania, pozycja końcowa, `moveLeft` (bitowo), `facing`, każda
//! zmiana facing z czasem, `occByKey`, `lastAutoMoveFrom`, każdy krok jako `Move` (pole startu, pole celu, `t0`,
//! `arrive_at`), cel ciosu (`Melee`), `unported` PUSTE i zero zużytych rzutów (`SequenceRolls::new(vec![])`).

use std::collections::{BTreeSet, HashMap};

use civ_engine::domain::player_order_move_gate::{GroupDoctrine as GateDoctrine, GroupMeta};
use civ_engine::domain::siege_tactics_actions::{BattleAction, TimedAction};
use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_target::AttackDirection;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit, MOVE_STEP_MS};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_close_vectors/vectors_r2.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// Strażnik generatora (`EXPECTED_SHA256` w `p6_k5loop_close_r2_gen.mjs`).
const PIN_SHA256: &str = "c5a5bc11db1471b17b61da5ce6a73951e34ee8790711386a179ea97bf1153619";
const PLAIN: &str = "Plaskie (rownina/laka)";

/// Teren wektora: kafelki z listy, poza listą równina (przejezdna, koszt 1, bez brodu). Mnożnik jazdy wg nazwy terenu
/// walki z `cavMult` (pin `cavalryTerrainMultiplier` na `terrain-combat.json`).
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
        let name = self.at(col, row).3;
        *self.cav_mult.get(name).expect("mnoznik jazdy terenu")
    }
}

fn b(v: &Value) -> bool {
    v.as_bool().expect("bool")
}
fn bo(v: &Value) -> bool {
    v.as_bool().unwrap_or(false)
}
fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}
fn int(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
}
fn num_or_inf(v: &Value) -> f64 {
    match v.as_str() {
        Some("Infinity") => f64::INFINITY,
        _ => num(v),
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
        range: 1.0,
        on_wall_walkway: false,
        primary_ranged: bo(&u["primaryRanged"]),
        mounted: bo(&u["mounted"]),
        phalanx: false,
        shooting_disabled: false,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: false,
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

fn label(ev: &ActivateEvent) -> String {
    match ev {
        ActivateEvent::ApplyTerrainRange => "terrainRange".into(),
        ActivateEvent::UpdateFacing => "facing".into(),
        ActivateEvent::TowerClimb => "towerClimb".into(),
        ActivateEvent::InfantryToTower => "infToTower".into(),
        ActivateEvent::AdvanceStep => "advanceStep".into(),
        ActivateEvent::CavalryAction => "cavalryAction".into(),
        other => format!("{other:?}"),
    }
}

fn melee_blow() -> FullBlowInput {
    FullBlowInput {
        ranged: false,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 5.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: None,
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
        atk_mounted: true,
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
    }
}

struct Built {
    body: ProdBody<SequenceRolls>,
    st: TurnSeqState,
    acting: UnitRef,
}

fn build(case: &Value, cav_mult: &HashMap<String, f64>, with_terrain: bool) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let acting = UnitRef {
        side: side_of(case["acting"]["side"].as_str().expect("side")),
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    let attack = case["expect"]["attack"]["target"].as_u64();
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let dead = b(&u["dead"]);
            let me = ix == usize::from(acting.side == BattleSide::Defender) && i == acting.idx;
            // Cios jazdy: szablon ciosu na cel wskazany przez wektor (adapter `_doAttack`). Ciało wybiera cel samo
            // (T6); inny wybór niż w pinie = `cios-bez-szablonu` w `unported` = rozbieżność.
            let (melee_target, blow) = match (me, attack) {
                (true, Some(t)) => (Some(t as usize), Some(melee_blow())),
                _ => (None, None),
            };
            units[ix].push(ProdUnit {
                activate: act(u, ix == 0),
                melee_target,
                blow,
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
    let mut body = ProdBody::new(units, scene(), SequenceRolls::new(Vec::new()));
    for (ix, list) in sides.iter().enumerate() {
        for (i, u) in list.as_array().expect("lista").iter().enumerate() {
            let ds = &mut body.doctrine[ix][i];
            ds.unit_doctrine = u["unitDoctrine"]
                .as_str()
                .map(|s| GroupDoctrine::parse(s).expect("doktryna"));
            ds.group_id = u["groupId"].as_str().map(str::to_string);
            ds.anti_cav_spear = bo(&u["antiCavSpear"]);
            body.ranged_base[ix][i] = bo(&u["rangedBase"]);
            body.formation_rank[ix][i] = u["formationRank"].as_f64();
            body.attack_direction[ix][i] = match u["attackDirection"].as_str() {
                None | Some("front") => AttackDirection::Front,
                Some("bok") => AttackDirection::Bok,
                Some("tyl") => AttackDirection::Tyl,
                Some(other) => panic!("attackDirection {other}"),
            };
        }
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

fn load() -> (Value, HashMap<String, f64>) {
    let v: Value = serde_json::from_str(VECTORS).expect("wektory");
    assert_eq!(v["pin"].as_str(), Some(PIN));
    assert_eq!(v["pinSha256"].as_str(), Some(PIN_SHA256));
    let cav_mult = v["cavMult"]
        .as_object()
        .expect("cavMult")
        .iter()
        .map(|(k, m)| (k.clone(), num_or_inf(m)))
        .collect();
    (v, cav_mult)
}

/// Akcje jednostki działającej: (`Facing` bez zwrotu `_doMeleeAttack` przed `Melee`), `Move`, `Melee`.
type Got = (Vec<(f64, f64)>, Vec<TimedAction>, Option<(usize, f64)>);

fn split_actions(actions: &[TimedAction], acting: UnitRef) -> Got {
    let mut facing = Vec::new();
    let mut moves = Vec::new();
    let mut melee = None;
    for (k, a) in actions.iter().enumerate() {
        match &a.action {
            BattleAction::Facing { unit, dir } if *unit == acting => {
                // Zwrot `_doMeleeAttack` (`:9104-9105`) tuż przed lunge: poza zakresem wektora (stub `_doAttack`).
                let before_melee = matches!(
                    actions.get(k + 1).map(|n| &n.action),
                    Some(BattleAction::Melee { attacker, .. }) if *attacker == acting
                );
                if !before_melee {
                    facing.push((a.t0, *dir));
                }
            }
            BattleAction::Move { unit, .. } if *unit == acting => moves.push(a.clone()),
            BattleAction::Melee {
                attacker, target, ..
            } if *attacker == acting => melee = Some((target.idx, a.t0)),
            _ => {}
        }
    }
    (facing, moves, melee)
}

#[derive(Default)]
struct Cov {
    flank_r1: usize,
    flank_r1_moved: usize,
    flank_full: usize,
    flank_moved: usize,
    flank_already: usize,
    cav: usize,
    cav_attack: usize,
    cav_moved: usize,
    cav_multi: usize,
    cav_hold: usize,
    cav_directed_moved: usize,
    cav_cost_gt1: usize,
    cav_frac_left: usize,
    facing_after_move: usize,
    cav_spear: usize,
    cav_adj: usize,
}

#[test]
fn flank_i_kawaleria_zgodne_z_pinem() {
    let (v, cav_mult) = load();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 760, "wektory: {}", cases.len());
    let mut failures: Vec<String> = Vec::new();
    let mut cov = Cov::default();
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let e = &case["expect"];
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, &cav_mult, true);
        let start_pos = body.unit_cell(acting).expect("pozycja");
        let ml0 = st.unit(acting).c.move_left;
        let dur = body.start(acting, &st);
        let want_attack = e["attack"]["target"].as_u64().map(|t| t as usize);
        if want_attack.is_none() {
            body.complete(acting, &mut st);
        }

        let got_trace: Vec<String> = body.trace[0]
            .1
            .iter()
            .filter(|ev| !matches!(ev, ActivateEvent::ResetPlayerOrder))
            .map(label)
            .collect();
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
        if ml.to_bits() != num(&fin["moveLeft"]).to_bits() {
            failures.push(format!("{name}: moveLeft rust={ml} js={}", fin["moveLeft"]));
        }
        if body.facing(acting) != num(&fin["facing"]) {
            failures.push(format!(
                "{name}: facing rust={} js={}",
                body.facing(acting),
                fin["facing"]
            ));
        }
        let got_last = body.doctrine(acting).last_auto_move_from;
        let want_last = fin["lastAutoMoveFrom"]
            .as_object()
            .map(|o| (int(&o["q"]), int(&o["r"])));
        if got_last != want_last {
            failures.push(format!(
                "{name}: lastAutoMoveFrom rust={got_last:?} js={want_last:?}"
            ));
        }
        let (got_facing, got_moves, got_melee) = split_actions(body.pending_actions(), acting);
        let want_facing: Vec<(f64, f64)> = e["facing"]
            .as_array()
            .expect("facing")
            .iter()
            .map(|f| (num(&f["t"]), num(&f["dir"])))
            .collect();
        if got_facing != want_facing {
            failures.push(format!(
                "{name}: zmiany facing rust={got_facing:?} js={want_facing:?}"
            ));
        }
        // Każdy krok `_doMove` = jedna akcja `Move` (pole startu = pole po poprzednim kroku, `t0` = start animacji).
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
        if got_moves != want_moves {
            failures.push(format!("{name}: Move rust={got_moves:?} js={want_moves:?}"));
        }
        let want_melee = want_attack.map(|t| (t, num(&e["attack"]["t"])));
        if got_melee != want_melee {
            failures.push(format!("{name}: cios rust={got_melee:?} js={want_melee:?}"));
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
        // Cel końcowy tematu: brak gałęzi nieportowanych we wszystkich scenariuszach wektorów.
        if !body.unported.is_empty() {
            failures.push(format!("{name}: unported {:?}", body.unported));
        }

        let n_steps = steps.len();
        let dir = case[case["acting"]["side"].as_str().expect("side")][acting.idx]
            ["attackDirection"]
            .as_str()
            .unwrap_or("front");
        match case["kind"].as_str() {
            Some("flank-r1") => {
                cov.flank_r1 += 1;
                if n_steps > 0 {
                    cov.flank_r1_moved += 1;
                }
            }
            Some("flank-full") => cov.flank_full += 1,
            Some("cavalry") => {
                cov.cav += 1;
                if want_attack.is_some() {
                    cov.cav_attack += 1;
                } else if n_steps == 0 {
                    cov.cav_hold += 1;
                }
                if n_steps > 0 {
                    cov.cav_moved += 1;
                    if dir != "front" {
                        cov.cav_directed_moved += 1;
                    }
                    // Koszt kroku jazdy > 1 (mnożnik terenu / koszt bazowy) albo ułamkowy `moveLeft` po brodzie.
                    let spent = ml0 - num(&fin["moveLeft"]);
                    if spent > n_steps as f64 {
                        cov.cav_cost_gt1 += 1;
                    }
                    if num(&fin["moveLeft"]).fract() != 0.0 {
                        cov.cav_frac_left += 1;
                    }
                }
                if n_steps >= 2 {
                    cov.cav_multi += 1;
                }
            }
            // Rodziny celowane: wymuszony cios we włócznika (`:6397-6401`) i wybór sąsiada (`:6351-6370`).
            Some("cavalry-spear") => {
                assert!(want_attack.is_some(), "{name}: cios");
                cov.cav_spear += 1;
            }
            Some("cavalry-adj") => {
                assert!(want_attack.is_some(), "{name}: cios");
                cov.cav_adj += 1;
            }
            other => panic!("rodzina {other:?}"),
        }
        if matches!(case["kind"].as_str(), Some("flank-r1" | "flank-full")) {
            if n_steps > 0 {
                cov.flank_moved += 1;
            } else if dur == 0.0 {
                cov.flank_already += 1;
            }
        }
        if want_facing.iter().any(|(t, _)| *t > 0.0) {
            cov.facing_after_move += 1;
        }
    }
    assert!(
        failures.is_empty(),
        "{} rozbieznosci, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(12)]
    );
    // Pokrycie rodzin i gałęzi.
    assert_eq!(
        cov.flank_r1, 120,
        "flank-r1 = wszystkie scenariusze flank z r1"
    );
    assert!(
        cov.flank_r1_moved >= 60,
        "flank-r1 z ruchem: {}",
        cov.flank_r1_moved
    );
    assert!(cov.flank_full >= 200, "flank-full: {}", cov.flank_full);
    assert!(
        cov.flank_moved >= 250,
        "flank z ruchem: {}",
        cov.flank_moved
    );
    assert!(
        cov.flank_already >= 20,
        "flank bez ruchu: {}",
        cov.flank_already
    );
    assert!(cov.cav >= 300, "kawaleria: {}", cov.cav);
    assert!(cov.cav_attack >= 15, "kawaleria cios: {}", cov.cav_attack);
    assert!(cov.cav_moved >= 200, "kawaleria ruch: {}", cov.cav_moved);
    assert!(
        cov.cav_multi >= 100,
        "kawaleria wiele krokow: {}",
        cov.cav_multi
    );
    assert!(cov.cav_hold >= 5, "kawaleria bez akcji: {}", cov.cav_hold);
    assert!(
        cov.cav_directed_moved >= 60,
        "kawaleria C-FLANK: {}",
        cov.cav_directed_moved
    );
    assert!(
        cov.cav_cost_gt1 >= 20,
        "kawaleria koszt > 1: {}",
        cov.cav_cost_gt1
    );
    assert!(
        cov.cav_spear >= 40,
        "kawaleria cios we wlocznika: {}",
        cov.cav_spear
    );
    assert!(
        cov.cav_adj >= 60,
        "kawaleria wybor sasiada: {}",
        cov.cav_adj
    );
    assert!(
        cov.facing_after_move >= 60,
        "facing po kroku: {}",
        cov.facing_after_move
    );
    eprintln!(
        "pokrycie: flank_r1={} (ruch {}), flank_full={}, flank_ruch={}, flank_stoi={}, cav={}, cios={}, ruch={}, \
         wiele={}, stoi={}, cflank={}, koszt>1={}, ulamek={}, facing_po_kroku={}",
        cov.flank_r1,
        cov.flank_r1_moved,
        cov.flank_full,
        cov.flank_moved,
        cov.flank_already,
        cov.cav,
        cov.cav_attack,
        cov.cav_moved,
        cov.cav_multi,
        cov.cav_hold,
        cov.cav_directed_moved,
        cov.cav_cost_gt1,
        cov.cav_frac_left,
        cov.facing_after_move
    );
}

/// Bez danych terenu gałąź kawalerii nie działa wcale (także cios w sąsiada) i jest jawnie oznaczona
/// `kawaleria-brak-terenu` (D1 K5DOC-T4e-0), a nie po cichu pominięta; stan bez zmian.
#[test]
fn kawaleria_bez_terenu_daje_jawny_tag() {
    let (v, cav_mult) = load();
    for case in v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| c["kind"] == "cavalry")
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
        assert_eq!(body.unported, vec![(acting, "kawaleria-brak-terenu")]);
        assert!(body.blows.is_empty());
    }
}

/// Bez danych terenu C-FLANK nie rusza jednostki: jawny tag `krok-naprzod-brak-terenu` (BFS czyta przejezdność).
#[test]
fn flanka_bez_terenu_daje_jawny_tag() {
    let (v, cav_mult) = load();
    let mut n = 0;
    for case in v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .filter(|c| {
            c["kind"] == "flank-full" && !c["expect"]["steps"].as_array().expect("steps").is_empty()
        })
        .take(40)
    {
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, &cav_mult, false);
        let before = body.unit_cell(acting);
        body.start(acting, &st);
        body.complete(acting, &mut st);
        assert_eq!(body.unit_cell(acting), before);
        assert_eq!(body.unported, vec![(acting, "krok-naprzod-brak-terenu")]);
        n += 1;
    }
    assert!(n >= 20);
}

/// `BattleAction::Move` nie ma jeszcze wariantu DTO (I5): konwersja jest jawnym błędem, nie cichym pominięciem.
#[test]
fn move_bez_dto_to_jawny_blad() {
    use civ_engine::domain::siege_tactics_actions::{actions_to_dto, ActionError};
    let (v, cav_mult) = load();
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| {
            c["kind"] == "cavalry" && !c["expect"]["steps"].as_array().expect("steps").is_empty()
        })
        .expect("ruch jazdy");
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
        .any(|a| matches!(a.action, BattleAction::Move { .. })));
    assert_eq!(
        actions_to_dto(&actions, &st),
        Err(ActionError::MoveWithoutDto(acting))
    );
}

/// C-FLANK „już w pozycji” (`battleScene.ts:8212-8214`): sąsiad na zadanym łuku = `done()` bez ciosu i bez ruchu.
/// Z `_activateUnit` gałąź jest NIEOSIĄGALNA dla piechoty (sąsiad = `_targetInRange` wybiera `_doAttack`, `:6293-6297`;
/// callback `_doMove` kończy przy `_canAttackFrom`, `:8224`), więc wektory pinu jej nie zawierają. Test bezpośredni
/// na wejściu adaptera bez celu (`melee_target = None`, jak `atak_z_advance_step_jest_oznaczony` w r1): bez testu
/// `already` ciało poszłoby w marsz czołowy i oznaczyło `krok-naprzod-atak`.
#[test]
fn flanka_juz_w_pozycji_konczy_bez_akcji() {
    use civ_engine::domain::siege_tactics_inputs_pos::{relative_hit, JsVal};
    let me_q = 10_i64;
    let (dq, dr) = (11_i64, 10_i64);
    let facing = (0..4)
        .map(f64::from)
        .find(|f| {
            relative_hit(
                &JsVal::Num(*f),
                &JsVal::Num(me_q as f64),
                &JsVal::Num(10.0),
                &JsVal::Num(dq as f64),
                &JsVal::Num(dr as f64),
            ) == HitArc::Flank
        })
        .expect("facing z lukiem flanki");
    let mk = |q: i64, r: i64, atk: bool, f: f64| ProdUnit {
        activate: act(&serde_json::json!({ "q": q, "r": r }), atk),
        melee_target: None,
        blow: None,
        counter_blows: Vec::new(),
        body_ms: 0.0,
        facing: f,
    };
    let cu = |ml: f64| CombatUnit {
        hp: 100.0,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: ml,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    };
    let st = TurnSeqState {
        atk: vec![SeqUnit { id: 1, c: cu(3.0) }],
        def: vec![SeqUnit { id: 2, c: cu(0.0) }],
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
    let mut body = ProdBody::new(
        [
            vec![mk(me_q, 10, true, 1.0)],
            vec![mk(dq, dr, false, facing)],
        ],
        scene(),
        SequenceRolls::new(Vec::new()),
    )
    .with_terrain(Box::new(TileTerrain {
        tiles: HashMap::new(),
        cav_mult: HashMap::new(),
    }));
    body.doctrine[0][0].unit_doctrine = Some(GroupDoctrine::Manual);
    body.attack_direction[0][0] = AttackDirection::Bok;
    let me = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };
    assert_eq!(body.start(me, &st), 0.0);
    assert_eq!(body.unit_cell(me), Some((me_q, 10)));
    assert!(body.unported.is_empty(), "{:?}", body.unported);
    assert!(!body.pending_actions().iter().any(|a| matches!(
        a.action,
        BattleAction::Move { .. } | BattleAction::Melee { .. }
    )));
}
