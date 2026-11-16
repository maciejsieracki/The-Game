//! R-RUSTPORT-P4-1I2-BATTLE-FRAME r2 (zarzuty 1 i 5 Evaluatora r1): ramka po KAŻDYM odpaleniu klocka zegara, ze
//! stanem PO kroku. Pin `07d2fbd72`, `gra/src/battle/battleScene.ts`: `_drainTimers` (`:9616-9634`) woła każdy
//! callback po kolei, renderer czyta stan sceny po callbacku; `_schedule` (`:9595-9606`) w planowaniu AUTO
//! wykonuje callback synchronicznie (tu: `ScheduleOutcome::RunNow`).
//!
//! Liczba odpaleń liczona niezależnie od obserwatora:
//! - z kolejki: `timer_seq` (liczba klocków wstawionych do kolejki) minus klocki nadal w kolejce — bitwa nie kończy
//!   się w budżecie, więc nic nie jest czyszczone ani odrzucane (`Dropped` tylko po `finished`);
//! - synchroniczne (`RunNow`): liczone w ciele testowym (start aktywacji i cios wieży przy włączonym planowaniu).

use std::cell::RefCell;
use std::collections::BTreeSet;
use std::rc::Rc;

use civ_engine::domain::siege_tactics_blow_full::FullBlowInput;
use civ_engine::domain::siege_tactics_breach::WallState;
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_frame::{battle_frame, FrameInput, FrameUnitPose};
use civ_engine::domain::siege_tactics_loop::{
    neutral_tower_shot_template, LoopBody, LoopTimer, SiegeEnv, SiegeLoop,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqStep, SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use civ_view_model::battle::BattleFrameDto;

const WALL_COL: i64 = 5;
/// Budżet iteracji przewijania: kilka tur, bitwa się nie kończy (asercja w teście).
const STEPS: u32 = 400;
/// Zmiana HP jednostki w `complete` (stan PO kroku `BodyDone`).
const BODY_HP_DELTA: f64 = 1.0;
/// Zmiana HP celu w ciosie wieży (stan PO kroku `TowerHit`).
const BLOW_HP_DELTA: f64 = 0.25;

#[derive(Default)]
struct BodyLog {
    /// Po każdym `complete`: jednostka i jej HP po kroku (w kolejności wywołań).
    completes: Vec<(UnitRef, f64)>,
    /// Po każdym ciosie wieży: indeks celu w `st.atk` i jego HP po kroku.
    blows: Vec<(usize, f64)>,
    /// Starty aktywacji przy włączonym planowaniu = odpalenia `RunNow` kroku `ActivateNext`.
    nested_starts: u32,
    /// Ciosy wieży przy włączonym planowaniu = odpalenia `RunNow` klocka `TowerHit`.
    nested_blows: u32,
}

/// Ciało zmieniające stan: `complete` zmniejsza HP aktywnej jednostki, cios wieży zmniejsza HP celu. Przy
/// `complete` o numerze `plan_at` (od 1) włącza planowanie AUTO (`auto_batch_planning`), przy następnym je
/// wyłącza — kolejny krok sekwencji (`_activateNext`) odpala się wtedy synchronicznie wewnątrz odpalenia
/// `BodyDone` (zagnieżdżony `RunNow`).
struct CountingBody {
    ms: f64,
    atk_cells: Vec<(i64, i64)>,
    plan_at: Option<usize>,
    log: Rc<RefCell<BodyLog>>,
}

fn unit_mut(st: &mut TurnSeqState, u: UnitRef) -> &mut SeqUnit {
    match u.side {
        BattleSide::Attacker => &mut st.atk[u.idx],
        BattleSide::Defender => &mut st.def[u.idx],
    }
}

impl LoopBody for CountingBody {
    fn start(&mut self, _unit: UnitRef, st: &TurnSeqState) -> f64 {
        if st.auto_batch_planning {
            self.log.borrow_mut().nested_starts += 1;
        }
        self.ms
    }
    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState) {
        let mut log = self.log.borrow_mut();
        let su = unit_mut(st, unit);
        su.c.hp -= BODY_HP_DELTA;
        let hp = su.c.hp;
        log.completes.push((unit, hp));
        st.auto_batch_planning = self.plan_at == Some(log.completes.len());
    }
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        match unit.side {
            BattleSide::Attacker => self.atk_cells.get(unit.idx).copied(),
            BattleSide::Defender => None,
        }
    }
    fn tower_blow(&mut self, _tmpl: &FullBlowInput, target: usize, st: &mut TurnSeqState) {
        let mut log = self.log.borrow_mut();
        if st.auto_batch_planning {
            log.nested_blows += 1;
        }
        st.atk[target].c.hp -= BLOW_HP_DELTA;
        log.blows.push((target, st.atk[target].c.hp));
    }
}

fn cu(hp: f64) -> CombatUnit {
    CombatUnit {
        hp,
        morale: 80.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    }
}

fn state() -> TurnSeqState {
    let units = |spec: &[(u64, f64)]| -> Vec<SeqUnit> {
        spec.iter()
            .map(|&(id, hp)| SeqUnit { id, c: cu(hp) })
            .collect()
    };
    TurnSeqState {
        atk: units(&[(7, 400.0), (3, 300.0)]),
        def: units(&[(5, 500.0), (1, 200.0)]),
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: WALL_COL,
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

fn new_loop(plan_at: Option<usize>, log: Rc<RefCell<BodyLog>>) -> SiegeLoop<CountingBody> {
    let env = SiegeEnv {
        body: CountingBody {
            ms: 100.0,
            atk_cells: vec![(WALL_COL - 2, 2), (WALL_COL - 1, 4)],
            plan_at,
            log,
        },
        tower_rows: vec![2, 4],
        pending_tower_shots: Vec::new(),
        tower_range: 6.0,
        tower_shot: Some(neutral_tower_shot_template()),
        wall_tile_rows: vec![2, 4],
        wall_ever_breached: false,
        no_breach_cap: 1_000_000,
        move_points: [vec![0.0; 2], vec![0.0; 2]],
        morale_max: [vec![100.0; 2], vec![100.0; 2]],
    };
    SiegeLoop::new(state(), env)
}

fn input() -> FrameInput {
    let p = |col, row| FrameUnitPose {
        col,
        row,
        facing: 1,
        on_wall_walkway: false,
        ammo_left: f64::INFINITY,
    };
    FrameInput {
        poses: [vec![p(3, 2), p(4, 4)], vec![p(5, 2), p(6, 4)]],
        wall: WallState {
            wall_col: WALL_COL as i32,
            gate_col: -1,
            gate_hp: 0.0,
            gate_open: false,
            wall_tile_hp: [(2, 100.0), (4, 100.0)].into_iter().collect(),
            wall_tiles_init: 2,
            tower_at_wall_rows: BTreeSet::new(),
            wall_ever_breached: false,
        },
    }
}

/// Indeks jednostki w ramce: atakujący, potem obrońcy (kolejność spawnu, `:5541-5550`).
fn frame_idx(u: UnitRef) -> usize {
    match u.side {
        BattleSide::Attacker => u.idx,
        BattleSide::Defender => 2 + u.idx,
    }
}

struct Run {
    lp: SiegeLoop<CountingBody>,
    clock: VirtualClock<LoopTimer>,
    frames: Vec<(LoopTimer, BattleFrameDto)>,
    log: Rc<RefCell<BodyLog>>,
}

fn run(plan_at: Option<usize>) -> Run {
    let log = Rc::new(RefCell::new(BodyLog::default()));
    let mut lp = new_loop(plan_at, Rc::clone(&log));
    let rec: Rc<RefCell<Vec<(LoopTimer, BattleFrameDto)>>> = Rc::new(RefCell::new(Vec::new()));
    let sink = Rc::clone(&rec);
    lp.set_fire_observer(Some(Box::new(move |lp, v_now, timer| {
        let f = battle_frame(lp, v_now, &input()).expect("ramka");
        sink.borrow_mut().push((timer, f));
    })));
    let mut clock: VirtualClock<LoopTimer> = VirtualClock::new();
    let _ = lp.run(&mut clock, STEPS);
    let frames = rec.borrow().clone();
    Run {
        lp,
        clock,
        frames,
        log,
    }
}

/// Wspólne asercje: liczba ramek = liczba odpaleń (niezależny licznik), wszystkie rodzaje klocków mają ramki,
/// każda ramka pokazuje stan PO swoim kroku.
fn check(r: &Run) {
    let log = r.log.borrow();
    assert!(
        !r.lp.st.finished && !r.clock.finished,
        "bitwa w budżecie nie może się skończyć (licznik z kolejki byłby niepełny)"
    );
    let queued_fired = r.clock.timer_seq - r.clock.timers.len() as u64;
    let nested = u64::from(log.nested_starts + log.nested_blows);
    assert_eq!(
        r.frames.len() as u64,
        queued_fired + nested,
        "ramka po KAŻDYM odpaleniu: z kolejki {queued_fired}, RunNow {nested}"
    );

    // Każdy rodzaj klocka ma ramki (mutacja „tylko BodyDone” = FAIL).
    let kinds = |pred: fn(&LoopTimer) -> bool| r.frames.iter().filter(|(t, _)| pred(t)).count();
    let begin = kinds(|t| matches!(t, LoopTimer::Step(SeqStep::BeginTurn)));
    let next = kinds(|t| matches!(t, LoopTimer::Step(SeqStep::ActivateNext)));
    let done = kinds(|t| matches!(t, LoopTimer::BodyDone(_)));
    let shot = kinds(|t| matches!(t, LoopTimer::TowerShot(_)));
    let hit = kinds(|t| matches!(t, LoopTimer::TowerHit(_)));
    assert!(begin >= 2, "BeginTurn: {begin}");
    assert!(next >= 2, "ActivateNext: {next}");
    assert!(shot >= 2, "TowerShot: {shot}");
    assert!(hit >= 2, "TowerHit: {hit}");
    assert_eq!(done, log.completes.len(), "BodyDone = liczba complete");
    assert_eq!(hit, log.blows.len(), "TowerHit = liczba ciosów wieży");

    // Stan PO kroku (mutacja „obserwator przed krokiem” = FAIL).
    let mut completes = log.completes.iter();
    let mut blows = log.blows.iter();
    let mut prev_round = 1; // `start` (kickoff `_beginTurn`) ustawia turę 1 przed pierwszym odpaleniem.
    for (i, (t, f)) in r.frames.iter().enumerate() {
        match *t {
            LoopTimer::BodyDone(u) => {
                let &(cu, hp) = completes.next().expect("complete");
                assert_eq!(cu, u);
                assert_eq!(
                    f.units[frame_idx(u)].hp,
                    hp,
                    "ramka {i} ({t:?}) musi mieć HP po complete"
                );
            }
            LoopTimer::TowerHit(target) => {
                let &(bt, hp) = blows.next().expect("cios");
                assert_eq!(bt, target);
                assert_eq!(
                    f.units[target].hp, hp,
                    "ramka {i} ({t:?}) musi mieć HP po ciosie wieży"
                );
            }
            LoopTimer::Step(SeqStep::BeginTurn) => {
                assert_eq!(
                    f.round_no,
                    prev_round + 1,
                    "ramka {i} ({t:?}) musi mieć roundNo po `_beginTurn`"
                );
            }
            _ => {}
        }
        prev_round = f.round_no;
    }
}

/// Pin `:9616-9634`: ramka po każdym odpaleniu z kolejki (`BeginTurn`, `ActivateNext`, `BodyDone`,
/// `TowerShot`, `TowerHit`), ze stanem po kroku.
#[test]
fn ramka_po_kazdym_odpaleniu_z_kolejki() {
    let r = run(None);
    assert_eq!(
        r.log.borrow().nested_starts + r.log.borrow().nested_blows,
        0
    );
    check(&r);
}

/// Pin `:9595-9606` (`_schedule` w planowaniu AUTO wykonuje callback od razu): zagnieżdżone odpalenie `RunNow`
/// też dostaje ramkę. Kolejność (zarzut 5): ramka odpalenia zagnieżdżonego (`ActivateNext`) poprzedza ramkę
/// odpalenia zewnętrznego (`BodyDone`), oba z tym samym `vNow`; ramka zewnętrzna pokazuje stan po obu krokach.
#[test]
fn ramka_po_kazdym_odpaleniu_stan_po_kroku() {
    let r = run(Some(1));
    let log = r.log.borrow();
    assert_eq!(
        log.nested_starts, 1,
        "dokładnie jedno zagnieżdżone ActivateNext"
    );
    // Salwa wieży w oknie planowania: `TowerHit` odpalony synchronicznie wewnątrz `TowerShot` (`:4262`).
    assert_eq!(log.nested_blows, 1, "dokładnie jeden zagnieżdżony TowerHit");
    let (first_unit, hp_after) = log.completes[0];
    drop(log);
    check(&r);
    let pos = r
        .frames
        .iter()
        .position(|(t, _)| *t == LoopTimer::BodyDone(first_unit))
        .expect("ramka pierwszego BodyDone");
    assert!(pos >= 1);
    let (inner_t, inner) = &r.frames[pos - 1];
    let (_, outer) = &r.frames[pos];
    assert_eq!(
        *inner_t,
        LoopTimer::Step(SeqStep::ActivateNext),
        "zagnieżdżone odpalenie ma ramkę przed zewnętrznym"
    );
    assert_eq!(inner.v_now, outer.v_now);
    assert_eq!(inner.units[frame_idx(first_unit)].hp, hp_after);
    assert_eq!(outer.units[frame_idx(first_unit)].hp, hp_after);
    // Zagnieżdżony `TowerHit` (wewnątrz `TowerShot`): ramka trafienia przed ramką wystrzału, to samo `vNow`.
    let hit = r
        .frames
        .windows(2)
        .find(|w| {
            matches!(w[0].0, LoopTimer::TowerHit(_))
                && matches!(w[1].0, LoopTimer::TowerShot(_))
                && w[0].1.v_now == w[1].1.v_now
        })
        .expect("ramka zagnieżdżonego TowerHit przed ramką TowerShot");
    assert_eq!(
        hit[0].1.units, hit[1].1.units,
        "ramka zewnętrzna = stan po obu krokach"
    );
}
