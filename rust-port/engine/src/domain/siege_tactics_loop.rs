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
use crate::domain::siege_tactics_activate::{
    activate_unit, ActivateEvent, ActivateOps, ActivateScene, ActivateUnit, EnemyRef,
};
use crate::domain::siege_tactics_blow::{DefenderState, Outcome, RollSource};
use crate::domain::siege_tactics_blow_full::{single_blow_full, FullBlowInput};
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

// ---------------------------------------------------------------------------------------------------------------
// K5-LOOP-BODY (r2 + r3 Operatora): produkcyjne ciało jednostki. Zgodność z pinem: wektory `p6_siege_tactics_loop_body_pin`
// (r3: generator wykonuje tekst pinu `_activateUnit` -> `_doAttack` -> `_singleBlow`, ślad aktywacji + wynik ciosu + stan + `engaged`).
//
// NIE WPINAĆ do [`SiegeLoop`] przed osobnymi tematami: skutki `_resolveBlowOutcome` (morale/rout po ciosie), kontratak
// (`_defenderCounters`) i timing `BLOW_HIT_T` NIE są tu zaimplementowane, więc stan produkcyjny rozjechałby się z pinem.
// FACING (NIE_ZMIERZONO, obrona r3): ciało nie ma stanu `facing` (`_updateFacing`/`_nearestEnemy`, przypisanie
// `attacker.facing` w `_doMeleeAttack`) ani `relativeHit`; łuk ciosu (`hit_arc`) jest wejściem szablonu [`ProdUnit::blow`],
// a nie wynikiem zmiany kierunku jednostek. Zgodność łuków z pinem NIE jest dowiedziona.
// ZAKRES CZĘŚCIOWY (patrz raport 01-operator-r2.md, sekcja NIE_ZMIERZONO). Ciało wykonuje tylko gałąź ciosu w zwarciu
// dla jednostki AUTO bez oblężenia, bez strzelca i bez doktryny: [`activate_unit`] (K5H) decyduje, a dla zdarzenia
// `Attack` wykonuje [`single_blow_full`] (K5I) na celu podanym przez adapter. Każda inna gałąź `_activateUnit`
// (ucieczka, doktryna, wieże, machiny, strzelec, marsz, tryb ręczny) NIE jest wykonywana: jednostka nic nie robi,
// a ścieżka trafia do [`ProdBody::unported`]. Wybór celu (`_targetInRange`) zależy od `facing`/`attackDirection`,
// których ten klocek nie niesie, więc cel jest wejściem adaptera ([`ProdUnit::melee_target`]).
// ---------------------------------------------------------------------------------------------------------------

/// Statyczna konfiguracja jednostki dla [`ProdBody`]: pola `ru` spoza [`CombatUnit`] oraz wejścia adapterów.
#[derive(Debug, Clone, PartialEq)]
pub struct ProdUnit {
    /// Pola `ru` czytane przez maszynę K5H. Pola stanu (`dead`, `fading_out`, `routed`, `morale`, `flee_morale`,
    /// `never_rout`) są nadpisywane z [`TurnSeqState`] przy `start`.
    pub activate: ActivateUnit,
    /// Indeks wroga w liście strony przeciwnej wybrany przez adapter `_targetInRange` (wejście, nieportowane).
    pub melee_target: Option<usize>,
    /// Szablon ciosu na `melee_target`. Stan obrońcy jest nadpisywany z [`TurnSeqState`] przy `complete`.
    pub blow: Option<FullBlowInput>,
    /// Czas animacji ciosu (ms) zwracany przez `start` (wejście adaptera; timing `_doAttack` nieportowany).
    pub body_ms: f64,
}

/// Wynik `start` przekazywany do `complete`.
#[derive(Debug, Clone, Copy, PartialEq)]
struct ProdPending {
    morale: f64,
    routed: bool,
    surround_applied: bool,
    attack: Option<usize>,
}

/// Zapytania maszyny K5H dla [`ProdBody`] (bez skutków ubocznych).
struct ProdOps {
    melee_target: Option<usize>,
}

impl ActivateOps for ProdOps {
    fn apply_terrain_range(&mut self, current: f64) -> f64 {
        // Przeliczenie zasięgu terenu jest wejściem adaptera (`ProdUnit::activate.range`).
        current
    }
    fn perform_player_order(&mut self) -> bool {
        false
    }
    fn doctrine_step(&mut self) -> bool {
        false
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
        self.melee_target
    }
    fn advance_coord(&mut self) -> f64 {
        0.0
    }
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
        None
    }
}

/// Etykieta gałęzi nieportowanej (zdarzenia spoza zakresu [`ProdBody`]).
fn prod_tag(ev: ActivateEvent) -> &'static str {
    match ev {
        ActivateEvent::Flee => "ucieczka-routed",
        ActivateEvent::DoctrineStep => "doktryna",
        ActivateEvent::TowerClimb => "wieza-wejscie",
        ActivateEvent::InfantryToTower => "piechota-do-wiezy",
        ActivateEvent::RamTowerStep => "taran-wieza",
        ActivateEvent::AttackWallTile { .. } => "atak-muru",
        ActivateEvent::AdvanceToward { .. } => "marsz",
        ActivateEvent::RangedAction => "strzelec",
        ActivateEvent::FallBackStep => "odwrot",
        ActivateEvent::CavalryAction => "kawaleria",
        ActivateEvent::PhalanxAction => "falanga",
        ActivateEvent::AdvanceStep => "krok-naprzod",
        _ => "inne",
    }
}

fn opposite(side: BattleSide) -> BattleSide {
    match side {
        BattleSide::Attacker => BattleSide::Defender,
        BattleSide::Defender => BattleSide::Attacker,
    }
}

fn unit_cu_mut(st: &mut TurnSeqState, r: UnitRef) -> &mut CombatUnit {
    match r.side {
        BattleSide::Attacker => &mut st.atk[r.idx].c,
        BattleSide::Defender => &mut st.def[r.idx].c,
    }
}

/// Zapis jednego ciosu wykonanego przez [`ProdBody`] (obserwacja dla testów zgodności z pinem).
#[derive(Debug, Clone, PartialEq)]
pub struct BlowRecord {
    pub attacker: UnitRef,
    pub target: UnitRef,
    pub missed: bool,
    pub hit_pct: f64,
    pub roll: f64,
    pub dmg: f64,
    pub def_hp_after: f64,
    pub extra_morale: f64,
    pub is_charge: bool,
}

/// Produkcyjne ciało jednostki pętli: składa [`activate_unit`] (K5H) i [`single_blow_full`] (K5I).
pub struct ProdBody<R: RollSource> {
    /// Jednostki stron, `[0]` atakujący, `[1]` obrońca; kolejność jak w `TurnSeqState::atk` / `def`.
    pub units: [Vec<ProdUnit>; 2],
    /// Wejścia sceny `this` dla `_activateUnit` (`finished` brane z `TurnSeqState` przy `start`).
    pub scene: ActivateScene,
    /// Deterministyczne rzuty (wstrzyknięte zamiast `Math.random`).
    pub rolls: R,
    /// Ścieżki nieportowane (NIE_ZMIERZONO): jednostka i etykieta gałęzi. Jednostka z taką ścieżką nic nie robi.
    pub unported: Vec<(UnitRef, &'static str)>,
    /// Ślad zdarzeń `_activateUnit` (K5H) każdej aktywacji, w kolejności `start`. Wczesne wyjścia: `finished` /
    /// `dead` / `fadingOut` = `[Done]`, `routed` = `[Flee]` (pin: `done()` / `_fleeStep` przed czymkolwiek innym).
    pub trace: Vec<(UnitRef, Vec<ActivateEvent>)>,
    /// Zapis każdego wykonanego ciosu (jeden rzut na cios).
    pub blows: Vec<BlowRecord>,
    /// Zbiór `engaged` sceny (`attacker>defender`, `battleScene.ts:8899`): tylko ciosy w zwarciu, także chybione.
    pub engaged: Vec<(UnitRef, UnitRef)>,
    /// Flaga `surroundApplied` (jednorazowa) trzymana między aktywacjami, bo nie ma jej w [`CombatUnit`].
    surround: [Vec<bool>; 2],
    pending: [Vec<Option<ProdPending>>; 2],
}

impl<R: RollSource> ProdBody<R> {
    pub fn new(units: [Vec<ProdUnit>; 2], scene: ActivateScene, rolls: R) -> Self {
        let surround = [
            units[0]
                .iter()
                .map(|u| u.activate.surround_applied)
                .collect(),
            units[1]
                .iter()
                .map(|u| u.activate.surround_applied)
                .collect(),
        ];
        let pending = [vec![None; units[0].len()], vec![None; units[1].len()]];
        Self {
            units,
            scene,
            rolls,
            unported: Vec::new(),
            trace: Vec::new(),
            blows: Vec::new(),
            engaged: Vec::new(),
            surround,
            pending,
        }
    }

    /// Flaga `surroundApplied` jednostki (stan między aktywacjami; nie ma jej w [`CombatUnit`]).
    pub fn surround_applied(&self, unit: UnitRef) -> bool {
        self.surround[side_ix(unit.side)][unit.idx]
    }

    fn enemies_of(&self, side: BattleSide, st: &TurnSeqState) -> Vec<EnemyRef> {
        let other = opposite(side);
        self.units[side_ix(other)]
            .iter()
            .enumerate()
            .map(|(i, pu)| {
                let c = st
                    .unit(UnitRef {
                        side: other,
                        idx: i,
                    })
                    .c;
                EnemyRef {
                    q: pu.activate.q,
                    r: pu.activate.r,
                    dead: c.dead,
                    fading_out: c.fading_out,
                    routed: c.routed,
                    is_catapult: pu.activate.is_catapult,
                }
            })
            .collect()
    }
}

impl<R: RollSource> LoopBody for ProdBody<R> {
    fn start(&mut self, unit: UnitRef, st: &TurnSeqState) -> f64 {
        let ix = side_ix(unit.side);
        self.pending[ix][unit.idx] = None;
        let seq = st.unit(unit).c;
        // Pin (`_activateUnit`, battleScene.ts:6049-6050): `finished` albo martwa / znikająca jednostka kończy od razu
        // (`done()`), PRZED jakąkolwiek inną gałęzią.
        if st.finished || seq.dead || seq.fading_out {
            self.trace.push((unit, vec![ActivateEvent::Done]));
            return 0.0;
        }
        // Uciekająca jednostka (`_fleeStep`, battleScene.ts:6055) nigdy nie atakuje; ruch ucieczki nie jest portowany.
        if seq.routed {
            self.trace.push((unit, vec![ActivateEvent::Flee]));
            self.unported.push((unit, "ucieczka-routed"));
            return 0.0;
        }
        let pu = self.units[ix][unit.idx].clone();
        // Gałęzie spoza zakresu sprawdzane PRZED maszyną (żeby maszyna nie wybrała ścieżki strzelca/doktryny).
        let out_of_scope = if self.scene.manual_mode {
            Some("tryb-reczny")
        } else if self.scene.wall_col >= 0 || st.siege_wall_col >= 0 {
            Some("oblezenie")
        } else if pu.activate.can_shoot || pu.activate.primary_ranged {
            // `primary_ranged` niesie stan między aktywacjami (`dryCol`, `heldAfterFallback`), którego ProdBody nie trzyma.
            Some("strzelec")
        } else if pu.activate.doctrine_auto {
            Some("doktryna")
        } else {
            None
        };
        if let Some(tag) = out_of_scope {
            self.unported.push((unit, tag));
            return 0.0;
        }

        let mut au = pu.activate.clone();
        au.dead = seq.dead;
        au.fading_out = seq.fading_out;
        au.routed = seq.routed;
        au.morale = seq.morale;
        au.flee_morale = seq.flee_morale;
        au.never_rout = seq.never_rout;
        au.surround_applied = self.surround[ix][unit.idx];

        let enemies = self.enemies_of(unit.side, st);
        let scene = ActivateScene {
            finished: st.finished,
            ..self.scene.clone()
        };
        // `_targetInRange` czyta `_enemiesOf`: cel martwy / znikający / uciekający nie jest celem (battleScene.ts:8291-8294).
        let melee_target = pu.melee_target.filter(|t| {
            enemies
                .get(*t)
                .is_some_and(|e| !e.dead && !e.fading_out && !e.routed)
        });
        let mut ops = ProdOps { melee_target };
        let res = activate_unit(&mut au, &scene, &enemies, &mut ops);
        self.trace.push((unit, res.events.clone()));

        // Efekty stanu aktywacji (morale z okrążenia, rout, flaga jednorazowa) zapisują się ZAWSZE, także gdy dalsza
        // gałąź jest nieportowana: pin stosuje je na początku `_activateUnit`, przed wyborem akcji.
        let mut pend = ProdPending {
            morale: au.morale,
            routed: au.routed,
            surround_applied: au.surround_applied,
            attack: None,
        };
        let mut skipped: Vec<&'static str> = Vec::new();
        for ev in res.events.iter().copied() {
            match ev {
                ActivateEvent::Done
                | ActivateEvent::ApplyTerrainRange
                | ActivateEvent::PerformPlayerOrder
                | ActivateEvent::ResetPlayerOrder
                | ActivateEvent::UpdateMoraleBar
                | ActivateEvent::StartRout
                | ActivateEvent::UpdateFacing => {}
                // Wywołania wież i taranu są w pinie bezczynne bez muru (`siegeWallCol < 0` -> `return false`,
                // battleScene.ts:8023, :8057, :8088); strażnik `oblezenie` wyżej wyklucza mur.
                ActivateEvent::TowerClimb
                | ActivateEvent::InfantryToTower
                | ActivateEvent::RamTowerStep => {}
                ActivateEvent::Attack { target } => pend.attack = Some(target),
                other => skipped.push(prod_tag(other)),
            }
        }
        // Gałąź spoza zakresu (ucieczka po okrążeniu, marsz, kawaleria, falanga...) = brak akcji po efektach stanu.
        if !skipped.is_empty() {
            for tag in skipped {
                self.unported.push((unit, tag));
            }
            pend.attack = None;
            self.pending[ix][unit.idx] = Some(pend);
            return 0.0;
        }
        if let Some(target) = pend.attack {
            if pu.melee_target != Some(target) || pu.blow.is_none() {
                self.unported.push((unit, "cios-bez-szablonu"));
                pend.attack = None;
            }
        }
        let dur = if pend.attack.is_some() {
            pu.body_ms
        } else {
            0.0
        };
        self.pending[ix][unit.idx] = Some(pend);
        dur
    }

    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState) {
        let ix = side_ix(unit.side);
        let Some(pend) = self.pending[ix][unit.idx].take() else {
            return;
        };
        self.surround[ix][unit.idx] = pend.surround_applied;
        {
            let c = unit_cu_mut(st, unit);
            c.morale = pend.morale;
            if pend.routed {
                c.routed = true;
            }
        }
        let Some(target) = pend.attack else {
            return;
        };
        let tref = UnitRef {
            side: opposite(unit.side),
            idx: target,
        };
        let tc = st.unit(tref).c;
        let Some(mut input) = self.units[ix][unit.idx].blow.clone() else {
            return;
        };
        // Para jest „pierwsza", dopóki jej klucza nie ma w `engaged` (`firstBlow = !this.engaged.has(key)`, :8896).
        input.first_blow_of_pair = !self.engaged.contains(&(unit, tref));
        input.defender_state = DefenderState {
            hp: tc.hp,
            max_hp: input.defender_state.max_hp,
            morale: tc.morale,
            flee_morale: tc.flee_morale,
            dead: tc.dead,
            fading_out: tc.fading_out,
            routed: tc.routed,
            never_rout: tc.never_rout,
            removed: tc.removed,
        };
        let out = single_blow_full(&input, &mut self.rolls);
        {
            let dc = unit_cu_mut(st, tref);
            dc.hp = out.blow.def_hp_after;
            if out.blow.outcome == Outcome::Kill {
                dc.dead = true;
            }
        }
        // Efekty `_resolveBlowOutcome` (morale, ucieczka po ciosie, efekty sceny) i zbiór `engaged` nie są
        // portowane w tym klocku: zapis ścieżki zamiast cichego pominięcia.
        if out.blow.outcome != Outcome::None {
            self.unported.push((unit, "resolveBlowOutcome-efekty"));
        }
        if out.blow.engaged_add && !self.engaged.contains(&(unit, tref)) {
            self.engaged.push((unit, tref));
        }
        self.blows.push(BlowRecord {
            attacker: unit,
            target: tref,
            missed: out.blow.missed,
            hit_pct: out.blow.hit_pct,
            roll: out.blow.roll,
            dmg: out.blow.dmg,
            def_hp_after: out.blow.def_hp_after,
            extra_morale: out.blow.extra_morale,
            is_charge: out.blow.is_charge,
        });
        // Kontratak obrońcy (`_doMeleeAttack`, COUNTER-ATTACK w battleScene.ts) nie jest portowany w tym klocku.
        // Jeśli cel przeżył cios, zapisujemy kandydata na nieportowaną gałąź (zamiast cichego pominięcia).
        // Warunek „obrońca jest melee" nie jest tu sprawdzany, więc wpis jest konserwatywny.
        if !st.unit(tref).c.dead {
            self.unported
                .push((unit, "kontratak-kandydat-nieportowany"));
        }
    }
}
