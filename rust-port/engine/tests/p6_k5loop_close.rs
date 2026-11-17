//! P6 SIEGE-TAKTYKA K5LOOP-CLOSE (dispatch R-RUSTPORT-P6-K5LOOP-CLOSE-R1, runda 1, Operator): zgodność `ProdBody`
//! z pinem `07d2fbd72` dla gałęzi `ActivateEvent::AdvanceStep` (`_advanceStep`, `battleScene.ts:8198-8285`)
//! wykonywanej w ciele oraz `_updateFacing` po każdym kroku `_doMove` (`:8756`).
//!
//! Wektory: `p6_k5loop_close_vectors/vectors.json`, generowane przez `p6_k5loop_close_gen.mjs`, który WYKONUJE tekst
//! pinu `_activateUnit` (6048-6299) -> `_advanceStep` -> `_doMove` -> `_updateFacing` (z `_firstStepAlongPathToAttack`,
//! `_stepToward`, `_canAttackFrom`, `_compactAttackAllowsStep`, `_shouldAvoidAutoBacktrack`, `_getEffectiveDoctrine`,
//! `_isUnitDoctrineAuto`, `_moveCostForUnit`, `isFordTile`, `compactLineAllowsAdvance`), strażnik SHA-256 wycinków.
//!
//! Porównanie na każdym wektorze: ślad aktywacji, czas trwania (kroki `MOVE_STEP_MS` + `STEP_GAP_MS`), pozycja końcowa,
//! `moveLeft` (bitowo), `facing` końcowy, KAŻDA zmiana facing z czasem (akcje `Facing`), `occByKey` po aktywacji,
//! `lastAutoMoveFrom`, brak wpisów `unported` i brak zużytych rzutów (gałąź nie losuje).

use std::collections::{BTreeSet, HashMap};

use civ_engine::domain::player_order_move_gate::{GroupDoctrine as GateDoctrine, GroupMeta};
use civ_engine::domain::siege_tactics_actions::BattleAction;
use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::SequenceRolls;
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_k5loop_close_vectors/vectors.json");

/// Teren wektora: kafelki z listy, poza listą równina (przejezdna, koszt 1, bez brodu).
struct TileTerrain {
    tiles: HashMap<(i64, i64), (bool, f64, bool)>,
}

impl TileTerrain {
    fn at(&self, col: f64, row: f64) -> (bool, f64, bool) {
        self.tiles
            .get(&(col as i64, row as i64))
            .copied()
            .unwrap_or((true, 1.0, false))
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
    fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
        panic!("kawaleria poza zakresem wektorow (piechota)")
    }
}

fn b(v: &Value) -> bool {
    v.as_bool().expect("bool")
}
fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba")
}
fn int(v: &Value) -> i64 {
    v.as_i64().expect("calkowita")
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

fn act(q: i64, r: i64, side_atk: bool) -> ActivateUnit {
    ActivateUnit {
        side_atk,
        q,
        r,
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
        primary_ranged: false,
        mounted: false,
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
        // Wektory: `_isUnitDoctrineAuto` = false (doktryna 'manual' albo grupa z autoPlay = false).
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
        other => format!("{other:?}"),
    }
}

/// Ciało, stan sekwencji i jednostka działająca zbudowane z wektora.
struct Built {
    body: ProdBody<SequenceRolls>,
    st: TurnSeqState,
    acting: UnitRef,
}

fn build(case: &Value, with_terrain: bool) -> Built {
    let sides = [&case["atk"], &case["def"]];
    let mut units: [Vec<ProdUnit>; 2] = [Vec::new(), Vec::new()];
    let mut seq: [Vec<SeqUnit>; 2] = [Vec::new(), Vec::new()];
    for (ix, list) in sides.iter().enumerate() {
        for u in list.as_array().expect("lista") {
            let dead = b(&u["dead"]);
            units[ix].push(ProdUnit {
                activate: act(int(&u["q"]), int(&u["r"]), ix == 0),
                melee_target: None,
                blow: None,
                counter_blows: Vec::new(),
                body_ms: 0.0,
                facing: num(&u["facing"]),
            });
            seq[ix].push(SeqUnit {
                id: (ix * 100 + seq[ix].len()) as u64,
                c: CombatUnit {
                    hp: 100.0,
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
            body.formation_rank[ix][i] = u["formationRank"].as_f64();
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
            .map(|t| ((int(&t[0]), int(&t[1])), (b(&t[2]), num(&t[3]), b(&t[4]))))
            .collect();
        body = body.with_terrain(Box::new(TileTerrain { tiles }));
    }
    body.sync_occupancy(&st);
    let acting = UnitRef {
        side: side_of(case["acting"]["side"].as_str().expect("side")),
        idx: case["acting"]["idx"].as_u64().expect("idx") as usize,
    };
    Built { body, st, acting }
}

#[test]
fn advance_step_i_facing_po_ruchu_zgodne_z_pinem() {
    let v: Value = serde_json::from_str(VECTORS).expect("wektory");
    assert_eq!(
        v["pin"].as_str(),
        Some("07d2fbd72f758705f8e1d59cc4968027ffbafe75")
    );
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 400, "wektory: {}", cases.len());
    let mut failures: Vec<String> = Vec::new();
    let (mut moved, mut multi, mut facing_after_move, mut no_move) = (0, 0, 0, 0);
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let e = &case["expect"];
        let Built {
            mut body,
            mut st,
            acting,
        } = build(case, true);
        let dur = body.start(acting, &st);
        body.complete(acting, &mut st);

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
        // Każda zmiana facing jednostki działającej z czasem wirtualnym (aktywacja + każdy krok `_doMove`).
        let got_facing: Vec<(f64, f64)> = body
            .pending_actions()
            .iter()
            .filter_map(|a| match a.action {
                BattleAction::Facing { unit, dir } if unit == acting => Some((a.t0, dir)),
                _ => None,
            })
            .collect();
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
        // `occByKey` po aktywacji.
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
            failures.push(format!("{name}: unported={:?}", body.unported));
        }
        let steps = e["steps"].as_array().expect("steps").len();
        if steps > 0 {
            moved += 1;
        } else {
            no_move += 1;
        }
        if steps >= 2 {
            multi += 1;
        }
        if want_facing.iter().any(|(t, _)| *t > 0.0) {
            facing_after_move += 1;
        }
    }
    assert!(
        failures.is_empty(),
        "{} rozbieznosci, pierwsze: {:#?}",
        failures.len(),
        &failures[..failures.len().min(12)]
    );
    // Pokrycie: ruch, wiele kroków (callback `_schedule`), zmiana facing PO kroku, brak ruchu (done od razu).
    assert!(moved >= 300, "ruch: {moved}");
    assert!(multi >= 200, "wiele krokow: {multi}");
    assert!(
        facing_after_move >= 30,
        "facing po kroku: {facing_after_move}"
    );
    assert!(no_move >= 30, "bez ruchu: {no_move}");
}

/// Bez danych terenu gałąź `_advanceStep` nie rusza jednostki i jest jawnie oznaczona (D1 K5DOC-T4e-0), a nie
/// po cichu pominięta.
#[test]
fn brak_terenu_daje_jawny_tag_bez_ruchu() {
    let v: Value = serde_json::from_str(VECTORS).expect("wektory");
    let case = v["cases"]
        .as_array()
        .expect("cases")
        .iter()
        .find(|c| !c["expect"]["steps"].as_array().expect("steps").is_empty())
        .expect("wektor z ruchem");
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, false);
    let before = body.unit_cell(acting);
    let ml0 = st.unit(acting).c.move_left;
    assert_eq!(body.start(acting, &st), 0.0);
    body.complete(acting, &mut st);
    assert_eq!(body.unit_cell(acting), before);
    assert_eq!(st.unit(acting).c.move_left.to_bits(), ml0.to_bits());
    assert_eq!(body.unported, vec![(acting, "krok-naprzod-brak-terenu")]);
}

/// Niespójne wejście adaptera (`melee_target = None` przy żywym sąsiedzie): `_advanceStep` daje `Attack`, nieosiągalne
/// z `_activateUnit` w pinie. Ciało oznacza to tagiem i nie wykonuje ciosu ani ruchu.
#[test]
fn atak_z_advance_step_jest_oznaczony() {
    let v: Value = serde_json::from_str(VECTORS).expect("wektory");
    let case = &v["cases"][0];
    let Built {
        mut body,
        mut st,
        acting,
    } = build(case, true);
    // Przestaw pierwszego żywego wroga obok jednostki działającej (pole wolne w zajętości).
    let other = match acting.side {
        BattleSide::Attacker => BattleSide::Defender,
        BattleSide::Defender => BattleSide::Attacker,
    };
    let (q, r) = body.unit_cell(acting).expect("pozycja");
    let oix = if other == BattleSide::Attacker { 0 } else { 1 };
    let target = (0..body.units[oix].len())
        .find(|&i| {
            let c = st
                .unit(UnitRef {
                    side: other,
                    idx: i,
                })
                .c;
            !c.dead && !c.fading_out && !c.routed
        })
        .expect("zywy wrog");
    let free = [(q + 1, r), (q - 1, r), (q, r + 1), (q, r - 1)]
        .into_iter()
        .find(|(c, rr)| {
            !body
                .occ_by_key()
                .contains_key(&cell_key(*c as f64, *rr as f64))
        })
        .expect("wolne pole");
    body.units[oix][target].activate.q = free.0;
    body.units[oix][target].activate.r = free.1;
    match acting.side {
        BattleSide::Attacker => st.atk[acting.idx].c.move_left = 3.0,
        BattleSide::Defender => st.def[acting.idx].c.move_left = 3.0,
    }
    let before = body.unit_cell(acting);
    assert_eq!(body.start(acting, &st), 0.0);
    body.complete(acting, &mut st);
    assert_eq!(body.unit_cell(acting), before);
    assert!(body.blows.is_empty());
    assert_eq!(body.unported, vec![(acting, "krok-naprzod-atak")]);
}
