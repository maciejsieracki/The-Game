//! R-RUSTPORT-P4-417A-K5EXEC-H4-MANUAL-MODE-STATE-Q1 (#417A, krok H4/T5, część A): tryb ręczny gracza w ciele bitwy
//! (`ProdBody`): stan `ru.playerOrder`, wykonanie `_performPlayerOrder` (`battleScene.ts:18280-18428`) z predykatami
//! ciała i kolejka `_executeUnitsImmediate` (`:18578-18614`).
//!
//! Dowód (pin `07d2fbd72`): decyzje liczą porty T3/T4/H3 (`perform_player_order`, `siege_manual_order_step`), na których
//! wektory kroku z pinu zielone są w `p4_404_move_order`, `p4_415_attack_orders`, `p4_416_siege_manual_order`. Ten plik
//! sprawdza WPIĘCIE w ciele: skutek rozkazu na stanie jednostki (pozycja, `playerOrder`, cios, tag `unported`), z
//! oczekiwaniami wyliczonymi z tekstu pinu (numery linii przy każdym teście). Bitwy w czasie rzeczywistym z rozkazem gracza
//! to część B (#422).

use std::collections::BTreeSet;

use civ_engine::domain::player_order_move::PlayerOrder;
use civ_engine::domain::player_order_queue::{
    execute_units_immediate, on_order_done, OrderQueueEvent,
};
use civ_engine::domain::siege_prod_manual::{ManualRun, ManualState};
use civ_engine::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
use civ_engine::domain::siege_tactics_blow::SequenceRolls;
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_doctrine_state::GroupDoctrine;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{LoopBody, ManualQueue, ProdBody, ProdUnit};
use civ_engine::domain::siege_tactics_move_effects::MoveTerrain;
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;

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

const A0: UnitRef = UnitRef {
    side: BattleSide::Attacker,
    idx: 0,
};
const D0: UnitRef = UnitRef {
    side: BattleSide::Defender,
    idx: 0,
};

fn unit(side_atk: bool, q: i64, r: i64) -> ProdUnit {
    ProdUnit {
        activate: ActivateUnit {
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
            dry_col: 0.0,
            held_after_fallback: false,
            player_order_none: true,
            can_shoot: false,
            is_siege_unit: false,
            is_siege_tower: false,
            is_ram: false,
            is_catapult: false,
            doctrine_auto: false,
            doctrine_manual: false,
        },
        melee_target: None,
        blow: None,
        counter_blows: Vec::new(),
        body_ms: 0.0,
        facing: 0.0,
    }
}

fn cu() -> CombatUnit {
    CombatUnit {
        hp: 100.0,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 4.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

/// Gracz = atakujący (`id` 1..), wróg = obrońca (`id` 100..). `manual` = `scene.manual_mode` i `exec`.
fn setup(
    atk: &[(i64, i64)],
    def: &[(i64, i64)],
    wall_col: i64,
    manual: bool,
) -> (ProdBody<SequenceRolls>, TurnSeqState) {
    let scene = ActivateScene {
        finished: false,
        manual_mode: manual,
        is_player_side: false,
        wall_col,
        gate_open: false,
        wall_tile_hp: Vec::new(),
        siege_machine_range: 0.0,
    };
    let units = [
        atk.iter().map(|&(q, r)| unit(true, q, r)).collect(),
        def.iter().map(|&(q, r)| unit(false, q, r)).collect(),
    ];
    let mut b =
        ProdBody::new(units, scene, SequenceRolls::new(vec![0.5; 8])).with_terrain(Box::new(Flat));
    b.move_order_exec = true;
    if manual {
        b.enable_manual_exec(BattleSide::Attacker);
    }
    let seq = |base: u64, n: usize| -> Vec<SeqUnit> {
        (0..n)
            .map(|i| SeqUnit {
                id: base + i as u64,
                c: cu(),
            })
            .collect()
    };
    let st = TurnSeqState {
        atk: seq(1, atk.len()),
        def: seq(100, def.len()),
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 1,
        siege_wall_col: wall_col,
        manual_mode: manual,
        player_side: BattleSide::Attacker,
        finished: false,
        awaiting_orders: false,
        auto_battle_suspended: false,
        busy: false,
        auto_batch_planning: false,
        queued_order_ids: BTreeSet::new(),
    };
    (b, st)
}

fn pos(b: &ProdBody<SequenceRolls>, u: UnitRef) -> (i64, i64) {
    let a = &b.units[usize::from(u.side == BattleSide::Defender)][u.idx].activate;
    (a.q, a.r)
}

/// Jedna aktywacja jednostki: `start` + `complete` (bez zegara; marsz atomowy).
fn activate(b: &mut ProdBody<SequenceRolls>, st: &mut TurnSeqState, u: UnitRef) -> f64 {
    let dur = b.start(u, st);
    b.complete(u, st);
    dur
}

fn last_run(b: &ProdBody<SequenceRolls>) -> ManualRun {
    b.manual.records.last().expect("decyzja rozkazu").run
}

fn has_tag(b: &ProdBody<SequenceRolls>, u: UnitRef, tag: &str) -> bool {
    b.unported.iter().any(|(x, t)| *x == u && *t == tag)
}

// --- (1) domyślnie wyłączone: zachowanie sprzed #417A ------------------------------------------------------------

/// `scene.manual_mode` bez `exec`: jawny tag `tryb-reczny`, brak ruchu i brak decyzji (jak przed #417A).
#[test]
fn bez_exec_tryb_reczny_to_jawny_tag() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(30, 10)], -1, false);
    b.scene.manual_mode = true;
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    activate(&mut b, &mut st, A0);
    assert!(has_tag(&b, A0, "tryb-reczny"));
    assert_eq!(pos(&b, A0), (10, 10));
    assert!(b.manual.records.is_empty());
}

// --- (2) hold / none (`:18282`, `:18287-18296`) ---------------------------------------------------------------

#[test]
fn hold_konczy_aktywacje_bez_akcji() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(30, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::Hold);
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(pos(&b, A0), (10, 10));
    assert_eq!(b.player_order(A0), PlayerOrder::Hold, "hold trwa");
    assert!(b.unported.is_empty());
}

/// `none` bez doktryny AUTO (`unitDoctrine = manual`): `done()` (`:18294-18295`).
#[test]
fn none_bez_doktryny_auto_to_done() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(30, 10)], -1, true);
    b.doctrine[0][0].unit_doctrine = Some(GroupDoctrine::Manual);
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(pos(&b, A0), (10, 10));
}

/// `none` + doktryna AUTO `steady` = `_executeGroupDoctrineStep` (`:18288-18291`): piechota idzie krokiem
/// `_advanceStep` ku wrogowi.
#[test]
fn none_z_doktryna_auto_wykonuje_krok_doktryny() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(14, 10)], -1, true);
    b.doctrine[0][0].unit_doctrine = Some(GroupDoctrine::Steady);
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Doctrine(GroupDoctrine::Steady));
    assert!(pos(&b, A0).0 > 10, "krok ku wrogowi: {:?}", pos(&b, A0));
    assert_eq!(b.doctrine_steps.len(), 1);
}

/// `none` + doktryna `skirmish`: krok doktryny wystawia `ru.playerOrder = move(dest)` (`:18112-18117`) i woła
/// `_performPlayerOrder`; w trybie ręcznym rozkaz TRWA po aktywacji (callback `finish`, `:18113-18119`: `move` gdy
/// jednostka nie stoi na celu, inaczej `none`), w odróżnieniu od AUTO, gdzie zeruje go następna aktywacja (`:6094`).
#[test]
fn none_skirmish_rozkaz_ruchu_trwa_po_aktywacji() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(40, 10)], -1, true);
    b.doctrine[0][0].unit_doctrine = Some(GroupDoctrine::Skirmish);
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Doctrine(GroupDoctrine::Skirmish));
    let order = b.player_order(A0);
    let at = pos(&b, A0);
    match order {
        PlayerOrder::Move { col, row } => {
            assert_ne!((col, row), at, "po finish: move tylko gdy nie na celu")
        }
        PlayerOrder::None => {}
        o => panic!("rozkaz po kroku skirmish: {o:?}"),
    }
    assert!(
        b.move_orders.iter().any(|m| m.unit == A0),
        "krok doktryny wykonał rozkaz ruchu"
    );
    assert!(
        matches!(order, PlayerOrder::Move { .. }),
        "cel dalej niż jeden krok: rozkaz trwa"
    );
}

// --- (3) move (`:18297-18352`) --------------------------------------------------------------------------------

#[test]
fn move_krok_zachlanny_i_zdjecie_rozkazu_na_celu() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    activate(&mut b, &mut st, A0);
    assert!(matches!(
        last_run(&b),
        ManualRun::Move { tile: (11, 10), .. }
    ));
    assert_eq!(pos(&b, A0), (11, 10));
    assert_eq!(b.player_order(A0), PlayerOrder::Move { col: 12, row: 10 });
    // Krok na cel zdejmuje rozkaz PRZED `_doMove` (`:18340`).
    st.atk[0].c.acted = false;
    st.atk[0].c.move_left = 4.0;
    activate(&mut b, &mut st, A0);
    assert_eq!(pos(&b, A0), (12, 10));
    assert_eq!(b.player_order(A0), PlayerOrder::None);
    // Kolejna aktywacja: `none` bez doktryny AUTO? Domyślna doktryna AUTO = `steady`, więc to krok doktryny,
    // a nie ruch rozkazu (`:18288`); rozkaz pozostaje `none`.
    assert_eq!(b.manual.raw_order(A0), PlayerOrder::None);
}

/// Cel = pozycja: `playerOrder = none`, `done()` (`:18300-18304`).
#[test]
fn move_na_celu_zdejmuje_rozkaz_i_nic_nie_robi() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 10, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(b.player_order(A0), PlayerOrder::None);
    assert_eq!(pos(&b, A0), (10, 10));
}

/// Sąsiedni wróg przerywa ruch: `_doAttack(ru, adj, done)` (`:18305-18309`), rozkaz bez zmian.
#[test]
fn move_z_sasiadem_atakuje() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(11, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 20, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Attack(0));
    assert_eq!(pos(&b, A0), (10, 10));
    assert_eq!(b.player_order(A0), PlayerOrder::Move { col: 20, row: 10 });
    // Atak dochodzi do wspólnej ścieżki ciosu (brak szablonu adaptera = jawny tag).
    assert!(has_tag(&b, A0, "cios-bez-szablonu"));
}

/// Zajęte pole zachłanne: obejście kolumną (`:18318-18320`) albo rzędem (`:18321-18322`).
#[test]
fn move_omija_zajete_pole() {
    // Sojusznik na (11,10) blokuje krok zachłanny na cel (12,11): obejście w kolumnie = (11,10) zajęte, więc rząd (10,11).
    let (mut b, mut st) = setup(&[(10, 10), (11, 11)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 11 });
    activate(&mut b, &mut st, A0);
    let (q, r) = pos(&b, A0);
    assert!(
        (q, r) == (11, 10) || (q, r) == (10, 11),
        "obejście zajętego pola zachłannego: {q},{r}"
    );
}

// --- (4) attack / attackMove (`:18353-18428`) -------------------------------------------------------------------

/// `attack` na wroga w zasięgu: `_doAttack` (`:18403-18405`).
#[test]
fn attack_w_zasiegu_uderza() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(11, 10), (30, 30)], -1, true);
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 100 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Attack(0));
    assert_eq!(b.player_order(A0), PlayerOrder::Attack { target_id: 100 });
}

/// `attack` na dalekiego wroga: krok `_firstStepAlongPathToAttack` (`:18409-18421`), rozkaz trwa.
#[test]
fn attack_dalekiego_celu_idzie_krokiem() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(16, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 100 });
    activate(&mut b, &mut st, A0);
    assert!(matches!(
        last_run(&b),
        ManualRun::Move { tile: (11, 10), .. }
    ));
    assert_eq!(pos(&b, A0), (11, 10));
    assert_eq!(b.player_order(A0), PlayerOrder::Attack { target_id: 100 });
}

/// `attack` na nieistniejący / martwy cel: `playerOrder = none`, `done()` (`:18397-18401`).
#[test]
fn attack_na_martwy_lub_nieznany_cel_zdejmuje_rozkaz() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(16, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 999 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(b.player_order(A0), PlayerOrder::None);
    // Martwy cel (`!u.dead`).
    let (mut b, mut st) = setup(&[(10, 10)], &[(11, 10)], -1, true);
    st.def[0].c.dead = true;
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 100 });
    activate(&mut b, &mut st, A0);
    assert_eq!(b.player_order(A0), PlayerOrder::None);
}

/// `attackMove`: zagrożenie na trasie w zasięgu uderzenia = `_doAttack` (`:18369-18372`); bez zagrożenia krok po trasie
/// (`:18390-18393`) i rozkaz trwa; na punkcie trasy rozkaz znika (`:18384-18388`).
#[test]
fn attack_move_zagrozenie_marsz_i_cel() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(11, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 14, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Attack(0));

    let (mut b, mut st) = setup(&[(10, 10)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 12, row: 10 });
    activate(&mut b, &mut st, A0);
    assert!(matches!(
        last_run(&b),
        ManualRun::Move { tile: (11, 10), .. }
    ));
    assert_eq!(
        b.player_order(A0),
        PlayerOrder::AttackMove { col: 12, row: 10 }
    );

    let (mut b, mut st) = setup(&[(12, 10)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 12, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(b.player_order(A0), PlayerOrder::None);
}

// --- (5) strona przeciwna w trybie ręcznym ----------------------------------------------------------------------

/// Jednostka strony nie-gracza przechodzi przez maszynę z `manual_mode` (bez doktryny, `:6089`), nie przez rozkazy.
#[test]
fn strona_przeciwna_nie_wykonuje_rozkazow_gracza() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(11, 10)], -1, true);
    activate(&mut b, &mut st, D0);
    assert!(
        b.manual.records.is_empty(),
        "rozkazy tylko dla strony gracza"
    );
    assert!(!has_tag(&b, D0, "tryb-reczny"));
    let (_, ev) = b.trace.last().expect("ślad");
    assert!(
        !ev.iter().any(|e| format!("{e:?}") == "PerformPlayerOrder"),
        "druga strona nie woła _performPlayerOrder: {ev:?}"
    );
}

/// AUTO (`manual_mode = false`) z `exec`: doktryna zeruje `ru.playerOrder` (`:6093-6095`).
#[test]
fn auto_zeruje_rozkaz_gracza() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(40, 40)], -1, false);
    b.enable_manual_exec(BattleSide::Attacker);
    b.doctrine[0][0].unit_doctrine = Some(GroupDoctrine::Steady);
    // `_isUnitDoctrineAuto(ru)` jest wejściem adaptera maszyny (`ActivateUnit::doctrine_auto`).
    b.units[0][0].activate.doctrine_auto = true;
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(b.player_order(A0), PlayerOrder::None);
    assert!(b.manual.records.is_empty());
}

// --- (6) bezczynność jednostki gracza (`:6027-6028`) ------------------------------------------------------------

#[test]
fn bezczynna_jednostka_gracza() {
    let (mut b, _st) = setup(&[(10, 10)], &[(40, 40)], -1, true);
    // Domyślna doktryna AUTO: nie jest bezczynna nawet z `none`.
    assert!(!b.player_unit_idle(A0));
    b.doctrine[0][0].unit_doctrine = Some(GroupDoctrine::Manual);
    assert!(b.player_unit_idle(A0));
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    assert!(!b.player_unit_idle(A0));
    b.set_player_order(A0, PlayerOrder::None);
    b.manual.exec = false;
    assert!(!b.player_unit_idle(A0), "bez trybu ręcznego nigdy");
}

// --- (7) kolejka `_executeUnitsImmediate` (`:18578-18614`) ------------------------------------------------------

#[test]
fn kolejka_wykonuje_rozkaz_i_oznacza_acted() {
    let (mut b, mut st) = setup(&[(10, 10), (10, 14)], &[(40, 40)], -1, true);
    // Cel = pozycja (`:18300-18304`) i `hold` (`:18282`): `done()` synchroniczne, bez ruchu.
    b.set_player_order(A0, PlayerOrder::Move { col: 10, row: 10 });
    b.set_player_order(
        UnitRef {
            side: BattleSide::Attacker,
            idx: 1,
        },
        PlayerOrder::Hold,
    );
    let mut clock: VirtualClock<usize> = VirtualClock::new();
    let ids = vec!["1".to_string(), "2".to_string(), "999".to_string()];
    let (queue, step) = {
        let mut q = ManualQueue {
            body: &mut b,
            st: &mut st,
        };
        execute_units_immediate(&mut q, &mut clock, &ids, false)
    };
    // Filtr startowy odrzuca nieznany id (`_findPlayerUnit` = undefined).
    assert_eq!(queue, vec!["1".to_string(), "2".to_string()]);
    assert_eq!(step.awaiting, None, "oba rozkazy zakończone synchronicznie");
    assert_eq!(
        b.player_order(A0),
        PlayerOrder::None,
        "rozkaz zdjęty poza aktywacją"
    );
    assert!(
        st.atk[0].c.acted && st.atk[1].c.acted,
        "u.acted = true (:18609)"
    );
    assert!(matches!(
        step.events.last(),
        Some(OrderQueueEvent::RefreshQueuedOrderVisuals)
    ));
    let orders: Vec<_> = step
        .events
        .iter()
        .filter(|e| matches!(e, OrderQueueEvent::Order(_)))
        .collect();
    assert_eq!(orders.len(), 2);
}

/// Busy-gate (`:18600-18603`): zajęta scena odracza rozkaz o 40 ms, jednostka nie rusza i nie jest `acted`.
#[test]
fn kolejka_busy_gate_odracza() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    st.busy = true;
    let mut clock: VirtualClock<usize> = VirtualClock::new();
    let ids = vec!["1".to_string()];
    let (_, step) = {
        let mut q = ManualQueue {
            body: &mut b,
            st: &mut st,
        };
        execute_units_immediate(&mut q, &mut clock, &ids, false)
    };
    assert!(step
        .events
        .iter()
        .any(|e| matches!(e, OrderQueueEvent::Defer { ms } if (*ms - 40.0).abs() < f64::EPSILON)));
    assert_eq!(pos(&b, A0), (10, 10));
    assert!(!st.atk[0].c.acted);
}

/// Jednostka już `acted` albo w `_queuedOrderUnitIds` jest pomijana przez filtr startowy (`:18580-18583`).
#[test]
fn kolejka_pomija_acted_i_zakolejkowane() {
    let (mut b, mut st) = setup(&[(10, 10), (10, 14)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    st.atk[0].c.acted = true;
    st.queued_order_ids.insert(2);
    let mut clock: VirtualClock<usize> = VirtualClock::new();
    let ids = vec!["1".to_string(), "2".to_string()];
    let (queue, _) = {
        let mut q = ManualQueue {
            body: &mut b,
            st: &mut st,
        };
        execute_units_immediate(&mut q, &mut clock, &ids, false)
    };
    assert!(queue.is_empty());
    assert_eq!(pos(&b, A0), (10, 10));
}

/// Rozkaz z czasem trwania (marsz > 0 ms) nie kończy się synchronicznie: kolejka czeka (`awaiting`), a po `done`
/// (`on_order_done`) jednostka dostaje `acted` i kolejka idzie dalej (`:18608-18610`).
#[test]
fn kolejka_asynchroniczne_done_czeka_na_wolajacego() {
    let (mut b, mut st) = setup(&[(10, 10), (10, 14)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    b.set_player_order(
        UnitRef {
            side: BattleSide::Attacker,
            idx: 1,
        },
        PlayerOrder::Hold,
    );
    let mut clock: VirtualClock<usize> = VirtualClock::new();
    let ids = vec!["1".to_string(), "2".to_string()];
    let (queue, step) = {
        let mut q = ManualQueue {
            body: &mut b,
            st: &mut st,
        };
        execute_units_immediate(&mut q, &mut clock, &ids, false)
    };
    // Atomowy marsz: `move_step_core` zwraca czas kroku (> 0), więc `done()` jest asynchroniczne.
    if let Some(idx) = step.awaiting {
        assert_eq!(idx, 0);
        assert!(!st.atk[0].c.acted);
        b.complete(A0, &mut st);
        let step2 = {
            let mut q = ManualQueue {
                body: &mut b,
                st: &mut st,
            };
            on_order_done(&mut q, &mut clock, &queue, idx, false)
        };
        assert_eq!(step2.awaiting, None);
        assert!(st.atk[0].c.acted && st.atk[1].c.acted);
    } else {
        // Marsz zakończony w czasie 0 (`done` synchroniczne): obie jednostki `acted`.
        assert!(st.atk[0].c.acted && st.atk[1].c.acted);
    }
    assert_eq!(pos(&b, A0), (11, 10));
}

// --- (8) oblężenie ręczne (`_performSiegeManualOrder`, `:18435-18475`) ------------------------------------------

/// Podejście ograniczone (mur zamknięty, brak wyłomu i wież): wróg w zasięgu = `_doAttack` (`:18461-18463`).
#[test]
fn oblezenie_podejscie_ograniczone_z_celem_w_zasiegu_uderza() {
    let (mut b, mut st) = setup(&[(35, 10)], &[(36, 10)], 40, true);
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 100 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Attack(0));
    assert_eq!(pos(&b, A0), (35, 10));
}

/// Podejście ograniczone: cel nieżywy/nieznany albo stoimy na celu = `playerOrder = none` (`:18467`, `:18470`).
#[test]
fn oblezenie_podejscie_ograniczone_zdejmuje_rozkaz() {
    let (mut b, mut st) = setup(&[(30, 10)], &[(10, 10)], 40, true);
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 999 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(b.player_order(A0), PlayerOrder::None);

    let (mut b, mut st) = setup(&[(30, 10)], &[(10, 10)], 40, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 30, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::Done);
    assert_eq!(b.player_order(A0), PlayerOrder::None);
}

/// `_siegeSafeApproach` (`:8107-8136`): cel marszu istnieje (brak zagrożeń = każde pole bezpieczne) = `true`;
/// wykonanie marszu poza zakresem części A: jawny tag (część B), a wynik decyzji jest w śladzie.
#[test]
fn oblezenie_bezpieczne_podejscie_ma_jawny_tag() {
    let (mut b, mut st) = setup(&[(30, 10)], &[(10, 10)], 40, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 36, row: 10 });
    activate(&mut b, &mut st, A0);
    assert_eq!(last_run(&b), ManualRun::SiegeSafeApproach { stepped: true });
    assert!(has_tag(&b, A0, "reczny-oblezenie-bezpieczne-podejscie"));
}

/// Ruch (`move`) w oblężeniu nie przechodzi przez `_performSiegeManualOrder` (`:18436`): zwykła gałąź `move`.
#[test]
fn oblezenie_move_idzie_zwykla_galezia() {
    let (mut b, mut st) = setup(&[(30, 10)], &[(10, 10)], 40, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 32, row: 10 });
    activate(&mut b, &mut st, A0);
    assert!(matches!(
        last_run(&b),
        ManualRun::Move { tile: (31, 10), .. }
    ));
}

// --- (9) stan rozkazu: `finish` kroku doktryny (`:18073-18079`) --------------------------------------------------

/// Callback `finish`: po ruchu `move(dest)` gdy jednostka nie stoi na celu, inaczej `none`; rozstrzyga go odczyt z
/// aktualną pozycją (`order_at` bez zmiany stanu, `settle` ze zmianą).
#[test]
fn finish_kroku_doktryny_rozstrzyga_wg_pozycji() {
    let u = A0;
    let mut m = ManualState::new([1, 1]);
    m.begin_doctrine_move(u, (5, 5));
    assert_eq!(m.raw_order(u), PlayerOrder::Move { col: 5, row: 5 });
    assert_eq!(m.order_at(u, (5, 5)), PlayerOrder::None, "na celu: none");
    assert_eq!(
        m.order_at(u, (4, 5)),
        PlayerOrder::Move { col: 5, row: 5 },
        "poza celem: move"
    );
    // `order_at` nie zmienia stanu; `settle` rozstrzyga i czyści `finish`.
    assert_eq!(m.raw_order(u), PlayerOrder::Move { col: 5, row: 5 });
    assert_eq!(m.settle(u, (5, 5)), PlayerOrder::None);
    assert_eq!(m.raw_order(u), PlayerOrder::None);
    m.begin_doctrine_move(u, (5, 5));
    assert_eq!(m.settle(u, (4, 5)), PlayerOrder::Move { col: 5, row: 5 });
    // Po rozstrzygnięciu `finish` nie działa drugi raz: nowa pozycja nie zdejmuje rozkazu.
    assert_eq!(m.order_at(u, (5, 5)), PlayerOrder::Move { col: 5, row: 5 });
    // Jawny zapis `ru.playerOrder` kasuje oczekujące `finish`.
    m.begin_doctrine_move(u, (5, 5));
    m.set_order(u, PlayerOrder::Hold);
    assert_eq!(m.order_at(u, (5, 5)), PlayerOrder::Hold);
}

// --- (10) przypadki z mutantów ------------------------------------------------------------------------------------

/// `_attackMovePath(..., allowEnemyCells = true)` (`:18356`, `:18556-18558`): pole wroga jest przejezdne dla trasy
/// zagrożeń, więc wróg stojący NA punkcie trasy (cel `attackMove`) jest zagrożeniem na trasie (`routeTiles.has`) i
/// rozkaz idzie krokiem ku niemu (`:18374-18381`), mimo że nie da się go jeszcze uderzyć.
#[test]
fn attack_move_wrog_na_trasie_jest_zagrozeniem() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(15, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 15, row: 10 });
    activate(&mut b, &mut st, A0);
    assert!(
        matches!(last_run(&b), ManualRun::Move { tile: (11, 10), .. }),
        "krok ku zagrożeniu na trasie: {:?}",
        last_run(&b)
    );
    assert_eq!(pos(&b, A0), (11, 10));
}

/// Sojusznik NA trasie blokuje ją (`this._isPlayerSide(occupant.side)`, `:18557`): bez wroga na trasie i bez zagrożenia
/// w zasięgu uderzenia krok po trasie omija sojusznika (`_firstStepOnAttackMovePath`, `allowEnemyCells = false`).
#[test]
fn attack_move_sojusznik_na_trasie_blokuje() {
    let (mut b, mut st) = setup(&[(10, 10), (11, 10)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::AttackMove { col: 12, row: 10 });
    activate(&mut b, &mut st, A0);
    let (q, r) = pos(&b, A0);
    assert!(
        (q, r) != (11, 10) && (q, r) != (10, 10),
        "ruch musi omijać sojusznika na (11,10): {q},{r}"
    );
}

/// `_canStrikeTargetFrom` (`:8487-8494`): zasięg wręcz = 1 (`1 <= dd <= reach`). Wróg w odległości 2 nie jest w zasięgu
/// uderzenia (krok ku niemu), wróg w odległości 1 jest.
#[test]
fn zasieg_wrecz_to_dokladnie_jedno_pole() {
    let (mut b, mut st) = setup(&[(10, 10)], &[(12, 10)], -1, true);
    b.set_player_order(A0, PlayerOrder::Attack { target_id: 100 });
    activate(&mut b, &mut st, A0);
    assert!(matches!(
        last_run(&b),
        ManualRun::Move { tile: (11, 10), .. }
    ));
    activate(&mut b, &mut st, A0);
    assert_eq!(
        last_run(&b),
        ManualRun::Attack(0),
        "sąsiad (dd = 1) w zasięgu"
    );
}

/// Rozkaz z czasem trwania nie kończy się synchronicznie (`completed = false`), `hold` tak (`:18282`).
#[test]
fn rozkaz_poza_aktywacja_ma_wlasciwy_completed() {
    let (mut b, mut st) = setup(&[(10, 10), (10, 14)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    b.set_player_order(
        UnitRef {
            side: BattleSide::Attacker,
            idx: 1,
        },
        PlayerOrder::Hold,
    );
    let mv = b.perform_order_direct(A0, &mut st);
    assert!(mv.dur > 0.0 && !mv.completed, "krok ruchu trwa: {mv:?}");
    let hold = b.perform_order_direct(
        UnitRef {
            side: BattleSide::Attacker,
            idx: 1,
        },
        &mut st,
    );
    assert!(hold.completed && hold.dur == 0.0, "{hold:?}");
}

/// Kolejka: rozkaz z czasem trwania czeka na `done` (`awaiting`), jednostka dostaje `acted` dopiero po `on_order_done`.
#[test]
fn kolejka_move_czeka_na_done() {
    let (mut b, mut st) = setup(&[(10, 10), (10, 14)], &[(40, 40)], -1, true);
    b.set_player_order(A0, PlayerOrder::Move { col: 12, row: 10 });
    let mut clock: VirtualClock<usize> = VirtualClock::new();
    let ids = vec!["1".to_string(), "2".to_string()];
    let (queue, step) = {
        let mut q = ManualQueue {
            body: &mut b,
            st: &mut st,
        };
        execute_units_immediate(&mut q, &mut clock, &ids, false)
    };
    assert_eq!(step.awaiting, Some(0));
    assert!(!st.atk[0].c.acted);
    b.complete(A0, &mut st);
    let step2 = {
        let mut q = ManualQueue {
            body: &mut b,
            st: &mut st,
        };
        on_order_done(&mut q, &mut clock, &queue, 0, false)
    };
    assert!(st.atk[0].c.acted, "u.acted = true po done (:18609)");
    assert!(step2.awaiting.is_some() || st.atk[1].c.acted);
}

/// `_effectiveMetaForUnit` (`:17633-17636`) dopisuje domyślny wpis grupy także w `_performSiegeManualOrder`
/// (`doctrineAuto`, `:18443-18444`), nawet gdy rozkaz kończy się pomostem muru (bez kroku doktryny).
#[test]
fn oblezenie_none_z_grupa_dopisuje_wpis_grupy() {
    let (mut b, mut st) = setup(&[(40, 10)], &[(10, 10)], 40, true);
    b.units[0][0].activate.on_wall_walkway = true;
    b.doctrine[0][0].group_id = Some("g1".to_string());
    assert!(b.group_meta.is_empty());
    activate(&mut b, &mut st, A0);
    assert!(b.group_meta.contains_key("g1"), "`_ensureGroupMeta(g1)`");
    assert_eq!(last_run(&b), ManualRun::Done);
}
