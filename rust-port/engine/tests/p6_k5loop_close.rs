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
//! `lastAutoMoveFrom`, wpisy `unported` (pusto albo jawny tag z wektora) i brak zużytych rzutów (gałąź nie losuje).
//!
//! Obrona r1 (zarzuty Evaluatora): rodzina `flank` (Z1: `attackDirection` `'bok'`/`'tyl'`, blok C-FLANK
//! `:8204-8235` = jawny tag `krok-naprzod-flanka`, preludium `moveLeft <= 0` przed blokiem), rodzina `rank-routed`
//! (Z2: uciekający sojusznik rangi `rank - 1` w `_compactAttackAllowsStep` `:8153-8157`; generator zachowuje tylko
//! scenariusze rozróżniające pin od mutanta bez filtra `!u.routed`) oraz zwolnienie pola `occByKey` przy routie
//! (`:9812`) i zabiciu (`:9915`) (Z3).

use std::collections::{BTreeSet, HashMap};

use civ_engine::domain::player_order_move_gate::{GroupDoctrine as GateDoctrine, GroupMeta};
use civ_engine::domain::siege_tactics_actions::BattleAction;
use civ_engine::domain::siege_tactics_activate::{ActivateEvent, ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_autobatch::cell_key;
use civ_engine::domain::siege_tactics_blow::{DefenderState, HitArc, SequenceRolls};
use civ_engine::domain::siege_tactics_blow_full::{
    AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu, FullBlowInput,
};
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_doctrine_target::AttackDirection;
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
    let (mut flank, mut flank_entered, mut rank_routed) = (0, 0, 0);
    for case in cases {
        let name = case["name"].as_str().expect("name");
        let e = &case["expect"];
        // K5LOOP-CLOSE r2: blok C-FLANK (`:8204-8235`) jest portowany. Scenariusze, w których r1 oczekiwało tagu
        // `krok-naprzod-flanka` (wartownik generatora r1 na wejściu do bloku, `:8210`), są porównywane z PEŁNYM tekstem
        // pinu w `p6_k5loop_close_r2.rs` (rodzina `flank-r1`: te same wejścia, asercja `== 120` i `unported` puste).
        // Plik `vectors.json` r1 pozostaje bajt w bajt; tu liczone są tylko do pokrycia.
        let r1_flank_tag = e["unported"]
            .as_array()
            .is_some_and(|a| a.iter().any(|t| t == "krok-naprzod-flanka"));
        if r1_flank_tag {
            assert_eq!(case["kind"].as_str(), Some("flank"), "{name}");
            flank += 1;
            flank_entered += 1;
            continue;
        }
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
        let want_unported: Vec<(UnitRef, String)> = e["unported"]
            .as_array()
            .map(|a| {
                a.iter()
                    .map(|t| (acting, t.as_str().expect("tag").to_string()))
                    .collect()
            })
            .unwrap_or_default();
        let got_unported: Vec<(UnitRef, String)> = body
            .unported
            .iter()
            .map(|(u, t)| (*u, (*t).to_string()))
            .collect();
        if got_unported != want_unported {
            failures.push(format!(
                "{name}: unported rust={got_unported:?} js={want_unported:?}"
            ));
        }
        match case["kind"].as_str() {
            Some("flank") => {
                flank += 1;
                if !want_unported.is_empty() {
                    flank_entered += 1;
                }
            }
            Some("rank-routed") => rank_routed += 1,
            _ => {}
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
    // Obrona r1: C-FLANK (wejście w blok i preludium przed blokiem) oraz linia szyku z uciekającym sojusznikiem.
    assert!(flank >= 100, "flank: {flank}");
    assert!(flank_entered >= 80, "flank w bloku: {flank_entered}");
    assert!(
        flank - flank_entered >= 15,
        "flank z preludium: {}",
        flank - flank_entered
    );
    assert!(rank_routed >= 50, "rank-routed: {rank_routed}");
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

/// Niespójne wejście adaptera (`melee_target = None` przy żywym sąsiedzie): `_advanceStep` daje `Attack`
/// (`:8241-8245`). K5LOOP-TAGS-REST (D-INT-2; dawniej tag `krok-naprzod-atak`): ciało wykonuje gałąź jak pin
/// (`_pickAdjacentTargetByPriority` -> `_doAttack`), a brak szablonu ciosu dla wybranego celu (adapter podał
/// `melee_target = None`) to jawny błąd wejścia `cios-bez-szablonu`: bez ciosu i bez ruchu.
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
    assert_eq!(body.unported, vec![(acting, "cios-bez-szablonu")]);
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

fn cu(hp: f64, morale: f64, flee: f64) -> CombatUnit {
    CombatUnit {
        hp,
        morale,
        flee_morale: flee,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

fn seq_state(atk: Vec<CombatUnit>, def: Vec<CombatUnit>) -> TurnSeqState {
    let mk = |v: Vec<CombatUnit>, base: u64| {
        v.into_iter()
            .enumerate()
            .map(|(i, c)| SeqUnit {
                id: base + i as u64,
                c,
            })
            .collect::<Vec<_>>()
    };
    TurnSeqState {
        atk: mk(atk, 1),
        def: mk(def, 100),
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
    }
}

fn plain(activate: ActivateUnit) -> ProdUnit {
    ProdUnit {
        activate,
        melee_target: None,
        blow: None,
        counter_blows: Vec::new(),
        body_ms: 0.0,
        facing: 0.0,
    }
}

/// Z3 (rout): pin `_activateUnit` okrążenie (`:6105-6121`): 3 żywych wrogów obok, morale 10 - `MORALE_SURROUND_HIT`
/// (10, `:1142`) = 0 <= `fleeMorale` 0 -> `_checkRout` -> `_startRout`, który zwalnia pole
/// `this.occByKey.delete(cellKey(ru.q, ru.r))` (`:9812`), a potem `_fleeStep` (nieportowany, tag `ucieczka-routed`).
/// Pole uciekiniera znika z `occByKey`; pola wrogów zostają.
#[test]
fn rout_po_okrazeniu_zwalnia_pole() {
    let mut me = act(10, 10, true);
    me.morale = 10.0;
    let units = [
        vec![plain(me)],
        vec![
            plain(act(11, 10, false)),
            plain(act(10, 11, false)),
            plain(act(10, 9, false)),
        ],
    ];
    let mut st = seq_state(
        vec![cu(100.0, 10.0, 0.0)],
        vec![
            cu(100.0, 100.0, 0.0),
            cu(100.0, 100.0, 0.0),
            cu(100.0, 100.0, 0.0),
        ],
    );
    let mut body = ProdBody::new(units, scene(), SequenceRolls::new(Vec::new()));
    let me_ref = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };
    let key = cell_key(10.0, 10.0);
    assert_eq!(
        body.occ_by_key().get(&key).map(String::as_str),
        Some("atk0")
    );
    body.start(me_ref, &st);
    body.complete(me_ref, &mut st);
    assert!(st.atk[0].c.routed, "okrazenie lamie jednostke");
    assert!(
        !body.occ_by_key().contains_key(&key),
        "_startRout zwalnia pole (:9812)"
    );
    assert_eq!(body.occ_by_key().len(), 3, "pola wrogow zostaja");
    assert_eq!(body.unported, vec![(me_ref, "ucieczka-routed")]);
}

/// Z3 (zabicie): cios 5 (rzut 0.0 = trafienie) przy HP 3 zabija obrońcę: `_startFade` -> `_removeUnitFromScene`, który
/// zwalnia pole `this.occByKey.delete(cellKey(ru.q, ru.r))` (`:9915`). Pole zabitego znika z `occByKey`.
#[test]
fn zabicie_zwalnia_pole() {
    let mut atk = plain(act(0, 0, true));
    atk.melee_target = Some(0);
    atk.blow = Some(melee_blow());
    atk.body_ms = 800.0;
    let mut d = plain(act(1, 0, false));
    d.facing = 3.0;
    let mut st = seq_state(vec![cu(100.0, 80.0, 0.0)], vec![cu(3.0, 100.0, 0.0)]);
    let mut body = ProdBody::new([vec![atk], vec![d]], scene(), SequenceRolls::new(vec![0.0]));
    let me_ref = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };
    let key = cell_key(1.0, 0.0);
    assert_eq!(
        body.occ_by_key().get(&key).map(String::as_str),
        Some("def0")
    );
    body.start(me_ref, &st);
    body.complete(me_ref, &mut st);
    assert!(st.def[0].c.dead && st.def[0].c.removed, "cios zabija");
    assert!(
        !body.occ_by_key().contains_key(&key),
        "_removeUnitFromScene zwalnia pole (:9915)"
    );
    assert_eq!(
        body.occ_by_key()
            .get(&cell_key(0.0, 0.0))
            .map(String::as_str),
        Some("atk0"),
        "pole atakujacego zostaje"
    );
}
