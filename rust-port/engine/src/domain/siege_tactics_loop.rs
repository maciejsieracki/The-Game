//! P6 SIEGE-TAKTYKA K5-LOOP (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1): cienki sterownik
//! składający moduły K5 w jedną pętlę bitwy oblężenia.
//!
//! Składa (bez zmiany ich logiki):
//! * [`begin_turn`] / [`activate_next`] / [`activation_done`] z `siege_tactics_turnseq` (`_beginTurn`, `_activateNext`,
//!   callback `_activateUnit`, `battleScene.ts:5631-5689`, `:5979-6030`),
//! * [`VirtualClock`] z `siege_tactics_clock` (`_schedule` `:9595-9606`, `_drainTimers` `:9616-9634`),
//! * [`run_fast_forward`] z `siege_tactics_fastforward` (`_runFastForward` `:9415-9437`) z werdyktem sufitu
//!   [`round_cap_verdict_step`] (`_roundCapVerdict` `:9449-9464`) i zakończeniem jak `_ffRoundCapResult` `:9485-9497`.
//!
//! Stan bitwy jest jawny ([`TurnSeqState`] + [`SiegeEnv`]). Efekty zewnętrzne są wstrzykiwane:
//! * ciało jednostki ([`LoopBody`]): czas trwania animacji i efekt na stanie w chwili zakończenia; na pinie to
//!   `_activateUnit` (K5h/K5i), tu jawny port wstrzykiwany (domyślna implementacja `single_blow_full` nie jest
//!   jeszcze podpięta, patrz raport K5-LOOP),
//! * wieżyczka muru (`_fireSiegeTowers`, R4): jednostka docelowa z [`SiegeEnv::tower`].
//!
//! Zakres: oblężenie (`siege_wall_col >= 0`) w trybie AUTO sekwencyjnym. Sciezka `_beginAutoBatchPhase` (K5g0, bez
//! oblezenia) nie jest składana w tym module: zdarzenie [`SeqEvent::BeginAutoBatchPhase`] zatrzymuje sterownik panika,
//! bo dla oblezenia pin jej nie wywołuje.
//!
//! Nie wpina się w `PlayableState`. Nie zawiera czasu ściennego: budżet przewijania to jawny `max_steps`.

use crate::domain::army_leadership::{army_morale_ratio_without_commander, ArmyLeaderCombatant};
use crate::domain::siege_no_breach::RoundCapVerdict;
use crate::domain::siege_tactics_clock::{ScheduleOutcome, VirtualClock};
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_endcheck::EndCheckOutcome;
use crate::domain::siege_tactics_fastforward::{
    round_cap_verdict_step, run_fast_forward, FfEvent, FfHost, FfLoopState, FfStop,
};
use crate::domain::siege_tactics_roundcap::RoundCapState;
use crate::domain::siege_tactics_turnseq::{
    activate_next, activation_done, begin_turn, CheckSite, EndCheckSnapshot, SeqEvent, SeqStep,
    TurnSeqEnv, TurnSeqState, UnitRef,
};
use crate::domain::siege_tactics_unit::{side_alive_end, CombatUnit};

/// Wejście ciała jednostki (web `_activateUnit`): czas trwania i zakończenie.
pub trait LoopBody {
    /// Start ciała jednostki. Zwraca czas trwania (ms), po którym sterownik planuje zakończenie.
    fn start(&mut self, unit: UnitRef, st: &TurnSeqState) -> f64;
    /// Zakończenie ciała jednostki: efekt na stanie, przed callbackiem `_activateUnit`.
    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState);
}

/// Klocek zegara: krok sekwencji (`_schedule(ms, () => _beginTurn())` / `_activateNext`) albo koniec ciała jednostki.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoopTimer {
    Step(SeqStep),
    BodyDone(UnitRef),
}

/// Zwycięzca bitwy w nomenklaturze pinu (`'atk'`, `'def'`, `'remis'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoopWinner {
    Attacker,
    Defender,
    Draw,
}

impl LoopWinner {
    /// Etykieta zgodna z wektorami (`atk` / `def` / `remis`).
    pub fn label(self) -> &'static str {
        match self {
            LoopWinner::Attacker => "atk",
            LoopWinner::Defender => "def",
            LoopWinner::Draw => "remis",
        }
    }
}

/// Efekty i dane statyczne sceny potrzebne sekwencji: ciało, wieża, pole sufitu, mnożniki.
pub struct SiegeEnv<B: LoopBody> {
    pub body: B,
    /// Web `_fireSiegeTowers` (R4): jednostka trafiona przez wieżyczkę przy każdym początku tury (jeśli żyje).
    pub tower: Option<UnitRef>,
    /// Web `wallEverBreached`.
    pub wall_ever_breached: bool,
    /// Web `siegeNoBreachMaxRounds`.
    pub no_breach_cap: i64,
    /// Web `_movementPointsFor(bu)`, indeks: [strona][jednostka].
    pub move_points: [Vec<f64>; 2],
    /// Maksimum morale jednostki (dla stubu `_armyMoraleRatio`), indeks: [strona][jednostka].
    pub morale_max: [Vec<f64>; 2],
}

fn side_ix(side: BattleSide) -> usize {
    match side {
        BattleSide::Attacker => 0,
        BattleSide::Defender => 1,
    }
}

fn unit_tag(u: UnitRef) -> String {
    let side = match u.side {
        BattleSide::Attacker => "atk",
        BattleSide::Defender => "def",
    };
    format!("{side}{}", u.idx)
}

impl<B: LoopBody> SiegeEnv<B> {
    /// `_armyMoraleRatio` piny: `armyMoraleRatioWithoutCommander` (game/army-leadership.ts) na jednostkach strony.
    fn ratio(&self, st: &TurnSeqState, side: BattleSide) -> f64 {
        let (units, maxes) = match side {
            BattleSide::Attacker => (&st.atk, &self.morale_max[0]),
            BattleSide::Defender => (&st.def, &self.morale_max[1]),
        };
        let army: Vec<ArmyLeaderCombatant> = units
            .iter()
            .zip(maxes.iter())
            .map(|(u, mx)| ArmyLeaderCombatant {
                is_army_commander: false,
                morale: u.c.morale,
                morale_max: *mx,
                dead: u.c.dead,
                fading_out: u.c.fading_out,
                routed: u.c.routed,
            })
            .collect();
        army_morale_ratio_without_commander(&army)
    }
}

impl<B: LoopBody> TurnSeqEnv for SiegeEnv<B> {
    fn end_check_snapshot(&mut self, _site: CheckSite, st: &TurnSeqState) -> EndCheckSnapshot {
        let atk: Vec<CombatUnit> = st.atk.iter().map(|u| u.c).collect();
        let def: Vec<CombatUnit> = st.def.iter().map(|u| u.c).collect();
        let ratio_a = self.ratio(st, BattleSide::Attacker);
        let ratio_d = self.ratio(st, BattleSide::Defender);
        EndCheckSnapshot {
            stalled: false,
            alive_a: side_alive_end(&atk),
            alive_d: side_alive_end(&def),
            is_siege: st.siege_wall_col >= 0,
            wall_ever_breached: self.wall_ever_breached,
            total_dead: atk.iter().chain(def.iter()).filter(|u| u.dead).count(),
            ratio_a,
            ratio_d,
            ratio_a_at_cap: ratio_a,
            ratio_d_at_cap: ratio_d,
            round_no: st.round_no,
            no_breach_cap: self.no_breach_cap,
            hp_a: atk.iter().map(|u| u.hp).collect(),
            hp_d: def.iter().map(|u| u.hp).collect(),
        }
    }

    fn movement_points(&mut self, unit: UnitRef, _st: &TurnSeqState) -> f64 {
        self.move_points[side_ix(unit.side)][unit.idx]
    }

    fn fire_siege_towers(&mut self, st: &mut TurnSeqState) {
        if let Some(r) = self.tower {
            let c = match r.side {
                BattleSide::Attacker => &mut st.atk[r.idx].c,
                BattleSide::Defender => &mut st.def[r.idx].c,
            };
            if !c.dead {
                c.dead = true;
            }
        }
    }

    fn player_unit_idle(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> bool {
        // Tryb reczny poza zakresem sterownika: w AUTO warunek `_manualMode &&` jest fałszywy.
        false
    }
}

/// Sterownik bitwy oblężenia: stan sekwencji, środowisko i zapis zdarzeń.
pub struct SiegeLoop<B: LoopBody> {
    pub st: TurnSeqState,
    pub env: SiegeEnv<B>,
    /// Ślad zdarzeń w kolejności pinu: `turn:N`, `check:<miejsce>:<wynik>`, `act:<jednostka>@<vNow>`.
    pub trace: Vec<String>,
    /// Zwycięzca po zakończeniu bitwy (`None` gdy jeszcze trwa).
    pub winner: Option<LoopWinner>,
    /// Ścieżka poza zakresem sterownika (AUTO bez oblężenia, wejście w AUTO z przewijania). Ustawienie zatrzymuje
    /// bitwę bez zwycięzcy zamiast paniki; wywołujący sprawdza to pole po `run`.
    pub unsupported: Option<&'static str>,
}

impl<B: LoopBody> SiegeLoop<B> {
    pub fn new(st: TurnSeqState, env: SiegeEnv<B>) -> Self {
        Self {
            st,
            env,
            trace: Vec::new(),
            winner: None,
            unsupported: None,
        }
    }

    /// Start bitwy: web `_beginTurn()` z kickoffu, potem pętla przewijania [`run_fast_forward`] aż do zakończenia
    /// albo wyczerpania `max_steps` pełnych iteracji.
    pub fn run(&mut self, clock: &mut VirtualClock<LoopTimer>, max_steps: u32) -> FfStop {
        let mut out = Vec::new();
        begin_turn(&mut self.st, &mut self.env, &mut out);
        self.apply(clock, out);
        let mut ff = FfLoopState::<()>::new();
        run_fast_forward(clock, &mut ff, self, max_steps)
    }

    /// Etykieta zwycięzcy (`atk` / `def` / `remis`) albo `None`.
    pub fn winner_label(&self) -> Option<&'static str> {
        self.winner.map(LoopWinner::label)
    }

    fn halt_unsupported(&mut self, clock: &mut VirtualClock<LoopTimer>, reason: &'static str) {
        self.unsupported = Some(reason);
        self.st.finished = true;
        clock.finished = true;
    }

    fn finish(&mut self, clock: &mut VirtualClock<LoopTimer>, winner: LoopWinner) {
        self.st.finished = true;
        clock.finished = true;
        self.winner = Some(winner);
    }

    fn apply(&mut self, clock: &mut VirtualClock<LoopTimer>, events: Vec<SeqEvent>) {
        for ev in events {
            match ev {
                SeqEvent::CounterBudgetBeginTurn
                | SeqEvent::SetHint { .. }
                | SeqEvent::Banner { .. }
                | SeqEvent::RefreshQueuedVisuals => {}
                SeqEvent::FireSiegeTowers => {
                    self.trace.push(format!("turn:{}", self.st.round_no));
                }
                SeqEvent::BeginAutoBatchPhase { .. } => {
                    self.halt_unsupported(
                        clock,
                        "sterownik K5-LOOP obsluguje tylko oblezenie; AUTO bez oblezenia poza zakresem",
                    );
                }
                SeqEvent::EndCheck { site, outcome } => {
                    let site_s = match site {
                        CheckSite::BeginTurn => "begin",
                        CheckSite::ActivateNext => "activate",
                    };
                    let out_s = match outcome {
                        EndCheckOutcome::Continue => "continue".to_string(),
                        EndCheckOutcome::Draw => "draw".to_string(),
                        EndCheckOutcome::Ended(BattleSide::Attacker) => "ended:atk".to_string(),
                        EndCheckOutcome::Ended(BattleSide::Defender) => "ended:def".to_string(),
                    };
                    self.trace.push(format!("check:{site_s}:{out_s}"));
                    match outcome {
                        EndCheckOutcome::Continue => {}
                        EndCheckOutcome::Draw => self.finish(clock, LoopWinner::Draw),
                        EndCheckOutcome::Ended(BattleSide::Attacker) => {
                            self.finish(clock, LoopWinner::Attacker)
                        }
                        EndCheckOutcome::Ended(BattleSide::Defender) => {
                            self.finish(clock, LoopWinner::Defender)
                        }
                    }
                }
                SeqEvent::ActivateUnit(u) => {
                    self.trace
                        .push(format!("act:{}@{}", unit_tag(u), clock.v_now));
                    let dur = self.env.body.start(u, &self.st);
                    let _ = clock.schedule(dur, LoopTimer::BodyDone(u), false);
                }
                SeqEvent::Schedule { ms, step, planning } => {
                    match clock.schedule(ms, LoopTimer::Step(step), planning) {
                        ScheduleOutcome::Queued | ScheduleOutcome::Dropped => {}
                        ScheduleOutcome::RunNow(t) => self.fire(clock, t),
                    }
                }
            }
        }
    }

    fn fire(&mut self, clock: &mut VirtualClock<LoopTimer>, timer: LoopTimer) {
        let mut out = Vec::new();
        match timer {
            LoopTimer::Step(SeqStep::BeginTurn) => {
                begin_turn(&mut self.st, &mut self.env, &mut out);
            }
            LoopTimer::Step(SeqStep::ActivateNext) => {
                activate_next(&mut self.st, &mut self.env, &mut out);
            }
            LoopTimer::BodyDone(u) => {
                self.env.body.complete(u, &mut self.st);
                activation_done(&mut self.st, &mut self.env, u, &mut out);
            }
        }
        self.apply(clock, out);
    }
}

impl<B: LoopBody> FfHost<LoopTimer, ()> for SiegeLoop<B> {
    fn round_cap(
        &mut self,
        _clock: &VirtualClock<LoopTimer>,
        _st: &FfLoopState<()>,
    ) -> Option<RoundCapVerdict> {
        let state = RoundCapState {
            round_no: self.st.round_no,
            no_breach_cap: self.env.no_breach_cap,
            wall_present: self.st.siege_wall_col >= 0,
            wall_ever_breached: self.env.wall_ever_breached,
        };
        let atk = self.env.ratio(&self.st, BattleSide::Attacker);
        let def = self.env.ratio(&self.st, BattleSide::Defender);
        round_cap_verdict_step(&state, atk, def)
    }

    fn busy(&self) -> bool {
        self.st.busy
    }

    fn event(
        &mut self,
        clock: &mut VirtualClock<LoopTimer>,
        _st: &mut FfLoopState<()>,
        ev: FfEvent<LoopTimer, ()>,
    ) {
        match ev {
            FfEvent::TimerFired(t) => self.fire(clock, t),
            FfEvent::RoundCapResult(v) => {
                let w = match v {
                    RoundCapVerdict::Draw => LoopWinner::Draw,
                    RoundCapVerdict::Defender => LoopWinner::Defender,
                    RoundCapVerdict::Attacker => LoopWinner::Attacker,
                };
                self.finish(clock, w);
            }
            FfEvent::EnterAuto => {
                self.halt_unsupported(
                    clock,
                    "sterownik K5-LOOP nie wchodzi w AUTO z przewijania (pending_auto zawsze false)",
                );
            }
            FfEvent::TickProjectiles(_) | FfEvent::TickFades(_) | FfEvent::RunQueued(()) => {}
        }
    }
}
