//! P6 SIEGE-TAKTYKA K5g (dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5G-Q1, runda 1, Operator): fazy AUTO bitwy taktycznej
//! jako czysta maszyna stanu.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`begin_auto_batch_phase`] = `_beginAutoBatchPhase` (`:5707-5745`): migawka stanu, planowanie zamiarow na klonach,
//!   `resolveAutoBatchPhase` (K5G0), `++_autoBatchToken` (`:5730`), start fali.
//! * [`begin_auto_batch_turn_from_current_state`] = `_beginAutoBatchTurnFromCurrentState` (`:5696-5704`).
//! * [`snapshot_auto_batch_intents`] = `_snapshotAutoBatchIntents` (`:5752-5815`), klonowanie jednostek (model K5A:
//!   [`BatchUnit`] niesie [`CombatUnit`] `Copy`) = `_cloneForAutoBatchPlanning` / `_disposeAutoBatchPlanningRoster`
//!   (`:5822-5860`, zasoby 3D nie istnieja w Rust, klon jest wartoscia).
//! * [`launch_auto_batch_resolution`] = `_launchAutoBatchResolution` (`:5865-5905`).
//! * [`resolve_auto_batch_attack`] = `_resolveAutoBatchAttack` (`:5907-5921`),
//!   [`resolve_auto_batch_movement`] = `_resolveAutoBatchMovement` (`:5924-5958`).
//! * [`finish_auto_batch_phase`] = `_finishAutoBatchPhase` (`:5961-5973`), w tym `_checkEnd` (`:5963`).
//! * [`halt_auto_battle_turn`] = `_haltAutoBattleTurn` (`:17333-17344`) -- przerwanie fazy (inkrementacja tokenu).
//! * zegar: kolejka K5E ([`VirtualClock`]) z ladunkiem [`BatchTimer`]; [`fire_timers`] = `_drainTimers`.
//!
//! Zlozenie: `resolve_auto_batch_phase` (K5G0, `siege_tactics_autophase`), stale `ACT_GAP_MS`/`TURN_GAP_MS` oraz wejscie
//! z K5F (`SeqEvent::BeginAutoBatchPhase`, patrz [`units_from_seq_refs`]); po zakonczeniu fali timer
//! [`BatchTimer::BeginTurn`] odpala zdarzenie [`BatchEvent::BeginTurn`] = `_beginTurn` (K5F).
//!
//! Efekty sceny (animacja ruchu `_doMove`, cios `_doAttack`, ucieczka `_fleeStep`, usuniecie jednostki, baner) sa jawnymi
//! zdarzeniami [`BatchEvent`]. Asynchroniczne callbacki webu (`done`) to [`LaunchCtx`] niesiony w zdarzeniu: wywolujacy
//! po zakonczeniu efektu wola [`resolve_auto_batch_movement`] (kolejny krok), [`complete_resolution`] albo
//! [`resolve_auto_batch_attack`]. Token fazy odrzuca spozniony callback po [`halt_auto_battle_turn`] i po nowej fazie.
//!
//! Bez RNG: cios/obrazenia, `_activateUnit` na klonie (planowanie), `_passableForUnit`, `_canStrikeTargetFrom` i `_checkEnd`
//! sa WSTRZYKNIETE przez [`AutoBatchEnv`] (K5h/K5i -- osobne tematy). Pomocnicze [`planning_move`] / [`planning_attack`]
//! odtwarzaja galaz planowania `_doMove` (`:8694-8712`, bez kosztu ruchu i kierunku, ktorych ten modul nie czyta) oraz
//! `_doAttack` (`:8788-8794`).
//!
//! Poza zakresem: log walki i `routedUnits` klonow (planowanie dziala na osobnej [`BatchBoard`], wiec nie ma czego
//! obcinac), `_updateBattlePhaseBanner` (zdarzenie [`BatchEvent::Banner`]; jego wczesne wyjscia sa po stronie sceny).

use std::collections::{BTreeMap, HashMap};

use crate::domain::siege_tactics_autophase::{
    resolve_auto_batch_phase, AutoBatchIntent, AutoBatchIntentKind, AutoBatchPhase,
    AutoBatchResolution, AutoBatchStep, AutoBatchUnitSnapshot,
};
use crate::domain::siege_tactics_clock::{ScheduleOutcome, VirtualClock};
use crate::domain::siege_tactics_turnseq::{TurnSeqState, UnitRef, ACT_GAP_MS, TURN_GAP_MS};
use crate::domain::siege_tactics_unit::{alive_power, CombatUnit};

/// Web `BF_COLS` (`battleScene.ts:661`).
pub const BF_COLS: f64 = 68.0;

/// Klucz kafelka (`cellKey(col,row)` = `col + ',' + row`, patrz `siege_tactics_autophase`): bity po normalizacji `-0 -> 0`
/// i kanonizacji NaN.
pub type CellKey = (u64, u64);

fn js_bits(x: f64) -> u64 {
    if x == 0.0 {
        0
    } else if x.is_nan() {
        f64::NAN.to_bits()
    } else {
        x.to_bits()
    }
}

/// Web `cellKey(col, row)` (`battleScene.ts:1797`).
pub fn cell_key(col: f64, row: f64) -> CellKey {
    (js_bits(col), js_bits(row))
}

/// Jednostka tablicy: `bu.id`, `side`, `q`, `r` + model K5A (`hp`, flagi, `moveLeft`).
#[derive(Debug, Clone, PartialEq)]
pub struct BatchUnit {
    pub id: String,
    pub side: AutoBatchPhase,
    pub q: f64,
    pub r: f64,
    pub c: CombatUnit,
}

/// Plansza: rostery `atk`, `def` i `occByKey` (kafelek -> id zajmujacej jednostki).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct BatchBoard {
    pub atk: Vec<BatchUnit>,
    pub def: Vec<BatchUnit>,
    pub occ: HashMap<CellKey, String>,
}

impl BatchBoard {
    /// Web `_findUnitById`: najpierw `atk`, potem `def`.
    pub fn find(&self, id: &str) -> Option<&BatchUnit> {
        self.atk
            .iter()
            .find(|u| u.id == id)
            .or_else(|| self.def.iter().find(|u| u.id == id))
    }

    pub fn find_mut(&mut self, id: &str) -> Option<&mut BatchUnit> {
        if let Some(i) = self.atk.iter().position(|u| u.id == id) {
            return self.atk.get_mut(i);
        }
        self.def.iter_mut().find(|u| u.id == id)
    }

    /// `[...atk, ...def]`.
    pub fn all(&self) -> impl Iterator<Item = &BatchUnit> {
        self.atk.iter().chain(self.def.iter())
    }
}

/// Ladunek timera zegara K5E (web: closure przekazany do `_schedule`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BatchTimer {
    /// `() => this._finishAutoBatchPhase(token)`.
    FinishPhase { token: u64 },
    /// `() => this._beginTurn()`.
    BeginTurn,
}

/// Licznik galezi (kryterium pokrycia): klucze stale, [`BRANCHES`].
pub const BRANCHES: &[&str] = &[
    "begin_guard",
    "begin_empty",
    "begin_launch",
    "begin_from_state_guard",
    "begin_from_state_atk",
    "begin_from_state_def",
    "plan_clone",
    "plan_source_missing",
    "plan_special_fixup",
    "launch_gone",
    "launch_routed_move",
    "launch_routed_flee",
    "launch_path",
    "launch_move_hold",
    "launch_no_target",
    "launch_attack",
    "complete_stale",
    "complete_double",
    "complete_ok",
    "complete_schedules_finish",
    "move_guard",
    "move_end_routed_reached",
    "move_end_routed_short",
    "move_end_attack",
    "move_end_done",
    "move_blocked",
    "move_step",
    "attack_invalid",
    "attack_strike",
    "finish_stale",
    "finish_end",
    "finish_to_def",
    "finish_turn_gap",
    "halt",
    "timer_dropped",
];

/// Stan maszyny faz AUTO (pola sceny: `atk`, `def`, `occByKey`, `_autoBatchPhase`, `_autoBatchResolutions`,
/// `_autoBatchPending`, `_autoBatchToken`, `_manualMode`, `_autoBattleSuspended`, `busy`, `_battleAwaitingOrders`,
/// `siegeWallCol`, `finished`, `vTimers`).
#[derive(Debug, Clone, PartialEq)]
pub struct BatchState {
    pub board: BatchBoard,
    pub manual_mode: bool,
    pub auto_battle_suspended: bool,
    pub busy: bool,
    pub battle_awaiting_orders: bool,
    /// Web `siegeWallCol` (`>= 0` = oblezenie).
    pub siege_wall_col: i64,
    pub phase: Option<AutoBatchPhase>,
    pub resolutions: Vec<AutoBatchResolution>,
    /// Flagi `completed` per rozstrzygniecie biezacej fazy (web: closure w `_launchAutoBatchResolution`).
    pub completed: Vec<bool>,
    pub pending: usize,
    pub token: u64,
    /// Zegar K5E; `clock.finished` = web `this.finished`.
    pub clock: VirtualClock<BatchTimer>,
    /// Liczniki galezi ([`BRANCHES`]).
    pub hits: BTreeMap<&'static str, u64>,
}

impl BatchState {
    pub fn new(board: BatchBoard) -> Self {
        Self {
            board,
            manual_mode: false,
            auto_battle_suspended: false,
            busy: false,
            battle_awaiting_orders: false,
            siege_wall_col: -1,
            phase: None,
            resolutions: Vec::new(),
            completed: Vec::new(),
            pending: 0,
            token: 0,
            clock: VirtualClock::new(),
            hits: BTreeMap::new(),
        }
    }

    pub fn finished(&self) -> bool {
        self.clock.finished
    }

    fn hit(&mut self, key: &'static str) {
        debug_assert!(BRANCHES.contains(&key), "nieznana galaz {key}");
        *self.hits.entry(key).or_insert(0) += 1;
    }
}

/// Kontekst jednego uruchomienia (web: zamkniecie `resolution`, `token`, `complete`). Nosi KOPIE rozstrzygniecia, bo po
/// `_haltAutoBattleTurn` tablica rozstrzygniec jest czyszczona, a spozniony callback nadal ja widzi (i jest odrzucany tokenem).
#[derive(Debug, Clone, PartialEq)]
pub struct LaunchCtx {
    pub token: u64,
    pub idx: usize,
    pub resolution: AutoBatchResolution,
}

/// Zdarzenia wyjsciowe (efekty sceny i zlecenia dla wywolujacego), w kolejnosci wywolan w pinie.
#[derive(Debug, Clone, PartialEq)]
pub enum BatchEvent {
    /// `_updateBattlePhaseBanner(first ? _findUnitById(first.unitId) : undefined)`.
    Banner { active: Option<String> },
    /// `_doMove(ru, col, row, cb)`; po animacji wywolujacy wola [`resolve_auto_batch_movement`] z `step_idx + 1`.
    Move {
        ctx: LaunchCtx,
        step_idx: usize,
        unit_id: String,
        col: f64,
        row: f64,
    },
    /// `_applyTerrainRange(attacker)`.
    ApplyTerrainRange { unit_id: String },
    /// `_doAttack(attacker, target, done)`; po ciosie wywolujacy wola [`complete_resolution`].
    Attack {
        ctx: LaunchCtx,
        attacker: String,
        target: String,
    },
    /// `_fleeStep(ru, complete)`; po kroku wywolujacy wola [`complete_resolution`].
    Flee { ctx: LaunchCtx, unit_id: String },
    /// `_removeUnitFromScene(ru)`.
    RemoveUnitFromScene { unit_id: String },
    /// `_shakeAlliesOnLoss(ru)`.
    ShakeAlliesOnLoss { unit_id: String },
    /// `_schedule(ms, cb)`; `queued = false` gdy zegar odrzucil (`finished`).
    Schedule {
        ms: f64,
        timer: BatchTimer,
        queued: bool,
    },
    /// `_checkEnd()` w `_finishAutoBatchPhase`; `ended` = wynik.
    EndCheck { ended: bool },
    /// Odpalony timer [`BatchTimer::BeginTurn`]: wywolujacy wola `begin_turn` (K5F).
    BeginTurn,
}

/// Odczyty i wstrzykniete funkcje, ktorych ten modul nie portuje (K5h/K5i i scena).
pub trait AutoBatchEnv {
    /// Web `_updateBattlePhaseBanner(first ? _findUnitById(first.unitId) : undefined)` -- wywolywane PO rozstrzygnieciu
    /// i PRZED startem fali (scena moze zmienic stan jednostek; domyslnie brak efektu). Zdarzenie [`BatchEvent::Banner`]
    /// jest emitowane zawsze.
    fn update_battle_phase_banner(&mut self, _st: &mut BatchState, _active: Option<&str>) {}
    /// Cialo `_activateUnit(clone, () => {})` w trybie planowania AUTO: ma wypelnic `intent` (pomocnicze
    /// [`planning_move`] / [`planning_attack`]) i moze zmieniac klon na `board` (takze `q`/`r` bez `_doMove`).
    fn plan_unit(&mut self, board: &mut BatchBoard, unit_id: &str, intent: &mut AutoBatchIntent);
    /// Web `_checkEnd()`; ustawia `st.clock.finished` przy koncu bitwy.
    fn check_end(&mut self, st: &mut BatchState) -> bool;
    /// Web `_passableForUnit(ru, col, row)`.
    fn passable_for_unit(&mut self, st: &BatchState, unit_id: &str, col: f64, row: f64) -> bool;
    /// Web `_doMove(ru, col, row, cb)` -- CZESC SYNCHRONICZNA (aktualizacja `occByKey`, `q`, `r` na zywej planszy). Animacja i
    /// wywolanie `cb` (kontynuacja ruchu) sa po stronie wywolujacego: zdarzenie [`BatchEvent::Move`].
    fn do_move(&mut self, st: &mut BatchState, unit_id: &str, col: f64, row: f64);
    /// Web `_applyTerrainRange(attacker)`.
    fn apply_terrain_range(&mut self, st: &mut BatchState, unit_id: &str);
    /// Web `_doAttack(attacker, target, done)` -- czesc synchroniczna (obrazenia wstrzykniete, K5i); `done` to zdarzenie
    /// [`BatchEvent::Attack`] i pozniejsze [`complete_resolution`].
    fn do_attack(&mut self, st: &mut BatchState, attacker_id: &str, target_id: &str);
    /// Web `_fleeStep(ru, done)` -- czesc synchroniczna; `done` = zdarzenie [`BatchEvent::Flee`].
    fn flee_step(&mut self, st: &mut BatchState, unit_id: &str);
    /// Web `_removeUnitFromScene(ru)`.
    fn remove_unit_from_scene(&mut self, st: &mut BatchState, unit_id: &str);
    /// Web `_shakeAlliesOnLoss(ru)`.
    fn shake_allies_on_loss(&mut self, st: &mut BatchState, unit_id: &str);
    /// Web `_canStrikeTargetFrom(attacker, col, row, target)`.
    fn can_strike_target_from(
        &mut self,
        st: &BatchState,
        attacker_id: &str,
        col: f64,
        row: f64,
        target_id: &str,
    ) -> bool;
}

/// Galaz planowania `_doMove` (`battleScene.ts:8694-8712`): `occByKey` (usun stary, ustaw nowy), `q/r`,
/// `intent.kind = 'move'` (poza `attack`), dopisanie kroku.
pub fn planning_move(
    board: &mut BatchBoard,
    intent: &mut AutoBatchIntent,
    unit_id: &str,
    col: f64,
    row: f64,
) {
    let Some(u) = board.find_mut(unit_id) else {
        return;
    };
    let old = cell_key(u.q, u.r);
    u.q = col;
    u.r = row;
    board.occ.remove(&old);
    board.occ.insert(cell_key(col, row), unit_id.to_string());
    if intent.kind != AutoBatchIntentKind::Attack {
        intent.kind = AutoBatchIntentKind::Move;
    }
    intent.steps.push(AutoBatchStep { col, row });
}

/// Galaz planowania `_doAttack` (`battleScene.ts:8788-8794`).
pub fn planning_attack(intent: &mut AutoBatchIntent, target_id: &str) {
    intent.kind = AutoBatchIntentKind::Attack;
    intent.target_id = Some(target_id.to_string());
}

/// Adapter wejscia z K5F: `SeqEvent::BeginAutoBatchPhase { units }` -> identyfikatory (`SeqUnit.id` jako napis).
pub fn units_from_seq_refs(seq: &TurnSeqState, refs: &[UnitRef]) -> Vec<String> {
    refs.iter().map(|r| seq.unit(*r).id.to_string()).collect()
}

fn unit_alive_and_unacted(u: &BatchUnit) -> bool {
    alive_power(&u.c) && !u.c.acted
}

fn schedule(st: &mut BatchState, ms: f64, timer: BatchTimer, out: &mut Vec<BatchEvent>) {
    let queued = match st.clock.schedule(ms, timer, false) {
        ScheduleOutcome::Queued => true,
        ScheduleOutcome::Dropped => {
            st.hit("timer_dropped");
            false
        }
        // `planning = false`: RunNow nie wystepuje.
        ScheduleOutcome::RunNow(_) => false,
    };
    out.push(BatchEvent::Schedule { ms, timer, queued });
}

/// Web `_beginAutoBatchTurnFromCurrentState` (`battleScene.ts:5696-5704`).
pub fn begin_auto_batch_turn_from_current_state(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    out: &mut Vec<BatchEvent>,
) {
    if st.finished() || st.manual_mode || st.siege_wall_col >= 0 {
        st.hit("begin_from_state_guard");
        return;
    }
    let ids = |roster: &[BatchUnit]| -> Vec<String> {
        roster
            .iter()
            .filter(|u| unit_alive_and_unacted(u))
            .map(|u| u.id.clone())
            .collect()
    };
    let atk = ids(&st.board.atk);
    let def = ids(&st.board.def);
    if !atk.is_empty() {
        st.hit("begin_from_state_atk");
        begin_auto_batch_phase(st, env, AutoBatchPhase::Atk, &atk, out);
    } else {
        st.hit("begin_from_state_def");
        begin_auto_batch_phase(st, env, AutoBatchPhase::Def, &def, out);
    }
}

/// Migawka `AutoBatchUnitSnapshot` z poczatku fazy (`battleScene.ts:5710-5722`), kolejnosc `[...atk, ...def]`.
pub fn build_snapshots(board: &BatchBoard) -> Vec<AutoBatchUnitSnapshot> {
    board
        .all()
        .map(|u| AutoBatchUnitSnapshot {
            id: u.id.clone(),
            side: u.side,
            q: u.q,
            r: u.r,
            dead: u.c.dead || u.c.fading_out,
            fading_out: u.c.fading_out,
            routed: u.c.routed,
            removed: u.c.removed,
            acted: u.c.acted,
            hp: Some(u.c.hp),
            occupies: Some(
                board.occ.get(&cell_key(u.q, u.r)).map(String::as_str) == Some(u.id.as_str()),
            ),
        })
        .collect()
}

/// Web `_beginAutoBatchPhase(side, units)` (`battleScene.ts:5707-5745`).
pub fn begin_auto_batch_phase(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    side: AutoBatchPhase,
    units: &[String],
    out: &mut Vec<BatchEvent>,
) {
    if st.finished() || st.manual_mode || st.auto_battle_suspended {
        st.hit("begin_guard");
        return;
    }
    let snapshots = build_snapshots(&st.board);
    // Faza jest zamrozona zanim jakakolwiek akcja ruszy: klony budowane per jednostka (patrz snapshot_auto_batch_intents).
    let intents = snapshot_auto_batch_intents(st, env, side, units);
    st.phase = Some(side);
    st.resolutions = resolve_auto_batch_phase(side, &snapshots, &intents);
    st.completed = vec![false; st.resolutions.len()];
    st.pending = st.resolutions.len();
    st.token += 1;
    let token = st.token;
    let active = st
        .resolutions
        .first()
        .and_then(|first| st.board.find(&first.unit_id))
        .map(|u| u.id.clone());
    env.update_battle_phase_banner(st, active.as_deref());
    out.push(BatchEvent::Banner { active });

    if st.pending == 0 {
        st.hit("begin_empty");
        finish_auto_batch_phase(st, env, token, out);
        return;
    }
    // Brak ACT_GAP miedzy czlonkami: kazdy ruch/atak startuje z tej samej chwili wirtualnej.
    st.hit("begin_launch");
    for idx in 0..st.resolutions.len() {
        let Some(resolution) = st.resolutions.get(idx).cloned() else {
            break;
        };
        let ctx = LaunchCtx {
            token,
            idx,
            resolution,
        };
        launch_auto_batch_resolution(st, env, &ctx, out);
    }
}

/// Web `_snapshotAutoBatchIntents(side, units)` (`battleScene.ts:5752-5815`): swieze klony obu rosterow dla KAZDEJ
/// jednostki; zywa plansza `st.board` pozostaje nietknieta (planowanie dziala na kopii).
pub fn snapshot_auto_batch_intents(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    side: AutoBatchPhase,
    units: &[String],
) -> Vec<AutoBatchIntent> {
    let mut intents: Vec<AutoBatchIntent> = Vec::new();
    for source in units {
        // `cloneById.set` -- ostatni klon o danym id wygrywa; kolejnosc jak `cloneRoster(atk)`, `cloneRoster(def)`.
        let mut clone = st.board.clone();
        st.hit("plan_clone");
        let last_clone_of = |board: &BatchBoard, id: &str| -> Option<(bool, usize)> {
            if let Some(i) = board.def.iter().rposition(|u| u.id == id) {
                return Some((false, i));
            }
            board
                .atk
                .iter()
                .rposition(|u| u.id == id)
                .map(|i| (true, i))
        };
        let clone_occ: HashMap<CellKey, String> = st
            .board
            .occ
            .iter()
            .filter_map(|(key, live_id)| {
                let (is_atk, i) = last_clone_of(&clone, live_id)?;
                let u = if is_atk { &clone.atk[i] } else { &clone.def[i] };
                (!u.c.dead && !u.c.fading_out && !u.c.removed).then(|| (*key, u.id.clone()))
            })
            .collect();
        clone.occ = clone_occ;
        let Some((is_atk, i)) = last_clone_of(&clone, source) else {
            st.hit("plan_source_missing");
            continue;
        };
        let (start_col, start_row) = {
            let u = if is_atk { &clone.atk[i] } else { &clone.def[i] };
            (u.q, u.r)
        };
        let mut intent = AutoBatchIntent {
            unit_id: source.clone(),
            side,
            kind: AutoBatchIntentKind::Hold,
            steps: Vec::new(),
            target_id: None,
        };
        env.plan_unit(&mut clone, source, &mut intent);
        // Specjalne galezie ruchu moga zmienic q/r bez przejscia przez _doMove.
        let (now_col, now_row) = {
            let u = if is_atk { &clone.atk[i] } else { &clone.def[i] };
            (u.q, u.r)
        };
        if intent.steps.is_empty() && (now_col != start_col || now_row != start_row) {
            st.hit("plan_special_fixup");
            if intent.kind != AutoBatchIntentKind::Attack {
                intent.kind = AutoBatchIntentKind::Move;
            }
            intent.steps.push(AutoBatchStep {
                col: now_col,
                row: now_row,
            });
        }
        intents.push(intent);
    }
    intents
}

/// Web `_launchAutoBatchResolution(resolution, token)` (`battleScene.ts:5865-5905`).
pub fn launch_auto_batch_resolution(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    ctx: &LaunchCtx,
    out: &mut Vec<BatchEvent>,
) {
    let res = &ctx.resolution;
    let Some(ru) = st.board.find(&res.unit_id).cloned() else {
        st.hit("launch_gone");
        complete_resolution(st, ctx, out);
        return;
    };
    if !alive_power(&ru.c) {
        st.hit("launch_gone");
        complete_resolution(st, ctx, out);
        return;
    }
    if ru.c.routed {
        if !res.steps.is_empty() {
            st.hit("launch_routed_move");
            resolve_auto_batch_movement(st, env, ctx, 0, out);
        } else {
            st.hit("launch_routed_flee");
            env.flee_step(st, &ru.id);
            out.push(BatchEvent::Flee {
                ctx: ctx.clone(),
                unit_id: ru.id.clone(),
            });
        }
        return;
    }
    let move_or_attack = matches!(
        res.kind,
        AutoBatchIntentKind::Move | AutoBatchIntentKind::Attack
    );
    if move_or_attack && !res.steps.is_empty() {
        st.hit("launch_path");
        resolve_auto_batch_movement(st, env, ctx, 0, out);
        return;
    }
    if matches!(
        res.kind,
        AutoBatchIntentKind::Move | AutoBatchIntentKind::Hold
    ) {
        st.hit("launch_move_hold");
        complete_resolution(st, ctx, out);
        return;
    }
    // Pusty identyfikator jest falsy w webie.
    let Some(target) = res.target_id.as_deref().filter(|t| !t.is_empty()) else {
        st.hit("launch_no_target");
        complete_resolution(st, ctx, out);
        return;
    };
    st.hit("launch_attack");
    resolve_auto_batch_attack(st, env, ctx, target, out);
}

/// Callback `complete` z `_launchAutoBatchResolution`: liczony dokladnie raz, odrzucany po zmianie tokenu.
pub fn complete_resolution(st: &mut BatchState, ctx: &LaunchCtx, out: &mut Vec<BatchEvent>) {
    if ctx.token != st.token {
        st.hit("complete_stale");
        return;
    }
    if st.completed.get(ctx.idx).copied().unwrap_or(false) {
        st.hit("complete_double");
        return;
    }
    if let Some(flag) = st.completed.get_mut(ctx.idx) {
        *flag = true;
    }
    st.hit("complete_ok");
    if let Some(u) = st.board.find_mut(&ctx.resolution.unit_id) {
        if alive_power(&u.c) {
            u.c.acted = true;
        }
    }
    st.pending = st.pending.saturating_sub(1);
    if st.pending == 0 {
        st.hit("complete_schedules_finish");
        schedule(
            st,
            ACT_GAP_MS,
            BatchTimer::FinishPhase { token: ctx.token },
            out,
        );
    }
}

/// Web `_resolveAutoBatchAttack(attacker, targetId, done)` (`battleScene.ts:5907-5921`). Atakujacy = jednostka z `ctx`.
pub fn resolve_auto_batch_attack(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    ctx: &LaunchCtx,
    target_id: &str,
    out: &mut Vec<BatchEvent>,
) {
    let attacker_id = ctx.resolution.unit_id.as_str();
    let valid = match (
        st.board.find(attacker_id).cloned(),
        st.board.find(target_id).cloned(),
    ) {
        (Some(a), Some(t)) => {
            let enemy = t.side != a.side && !t.c.dead && !t.c.fading_out && !t.c.routed;
            !t.c.dead
                && !t.c.fading_out
                && !t.c.removed
                && !t.c.routed
                && enemy
                && env.can_strike_target_from(st, attacker_id, a.q, a.r, target_id)
        }
        _ => false,
    };
    if !valid {
        st.hit("attack_invalid");
        complete_resolution(st, ctx, out);
        return;
    }
    st.hit("attack_strike");
    env.apply_terrain_range(st, attacker_id);
    env.do_attack(st, attacker_id, target_id);
    out.push(BatchEvent::ApplyTerrainRange {
        unit_id: attacker_id.to_string(),
    });
    out.push(BatchEvent::Attack {
        ctx: ctx.clone(),
        attacker: attacker_id.to_string(),
        target: target_id.to_string(),
    });
}

/// Web `_resolveAutoBatchMovement(ru, resolution, stepIdx, done)` (`battleScene.ts:5924-5958`).
pub fn resolve_auto_batch_movement(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    ctx: &LaunchCtx,
    step_idx: usize,
    out: &mut Vec<BatchEvent>,
) {
    if st.finished() || st.auto_battle_suspended || st.manual_mode {
        // Web wraca bez `done`: licznik `pending` nie maleje (faza zostanie przerwana tokenem).
        st.hit("move_guard");
        return;
    }
    let res = &ctx.resolution;
    let Some(ru) = st.board.find(&res.unit_id).cloned() else {
        // Web ma tu referencje `ru` przechwycona przy starcie; jednostka nie znika z rosterow, wiec to galaz obronna.
        complete_resolution(st, ctx, out);
        return;
    };
    if step_idx >= res.steps.len() {
        if ru.c.routed {
            let home_col = if ru.side == AutoBatchPhase::Atk {
                0.0
            } else {
                BF_COLS - 1.0
            };
            let reached = if ru.side == AutoBatchPhase::Atk {
                ru.q <= home_col
            } else {
                ru.q >= home_col
            };
            if reached {
                st.hit("move_end_routed_reached");
                env.remove_unit_from_scene(st, &ru.id);
                env.shake_allies_on_loss(st, &ru.id);
                out.push(BatchEvent::RemoveUnitFromScene {
                    unit_id: ru.id.clone(),
                });
                out.push(BatchEvent::ShakeAlliesOnLoss {
                    unit_id: ru.id.clone(),
                });
            } else {
                st.hit("move_end_routed_short");
            }
            complete_resolution(st, ctx, out);
            return;
        }
        if res.kind == AutoBatchIntentKind::Attack {
            if let Some(target) = res.target_id.as_deref().filter(|t| !t.is_empty()) {
                st.hit("move_end_attack");
                resolve_auto_batch_attack(st, env, ctx, target, out);
                return;
            }
        }
        st.hit("move_end_done");
        complete_resolution(st, ctx, out);
        return;
    }
    let step = res.steps[step_idx];
    let occupied_by_other = st
        .board
        .occ
        .get(&cell_key(step.col, step.row))
        .is_some_and(|occ_id| occ_id != &ru.id);
    if occupied_by_other || !env.passable_for_unit(st, &ru.id, step.col, step.row) {
        st.hit("move_blocked");
        complete_resolution(st, ctx, out);
        return;
    }
    st.hit("move_step");
    env.do_move(st, &ru.id, step.col, step.row);
    out.push(BatchEvent::Move {
        ctx: ctx.clone(),
        step_idx,
        unit_id: ru.id,
        col: step.col,
        row: step.row,
    });
}

/// Web `_finishAutoBatchPhase(token)` (`battleScene.ts:5961-5973`).
pub fn finish_auto_batch_phase(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    token: u64,
    out: &mut Vec<BatchEvent>,
) {
    if token != st.token || st.finished() || st.auto_battle_suspended || st.manual_mode {
        st.hit("finish_stale");
        return;
    }
    let ended = env.check_end(st);
    out.push(BatchEvent::EndCheck { ended });
    if ended {
        st.hit("finish_end");
        return;
    }
    if st.phase == Some(AutoBatchPhase::Atk) {
        st.hit("finish_to_def");
        let defenders: Vec<String> = st
            .board
            .def
            .iter()
            .filter(|u| unit_alive_and_unacted(u))
            .map(|u| u.id.clone())
            .collect();
        begin_auto_batch_phase(st, env, AutoBatchPhase::Def, &defenders, out);
        return;
    }
    st.hit("finish_turn_gap");
    st.phase = None;
    st.resolutions.clear();
    st.completed.clear();
    st.pending = 0;
    schedule(st, TURN_GAP_MS, BatchTimer::BeginTurn, out);
}

/// Web `_haltAutoBattleTurn(suspendInFlight)` (`battleScene.ts:17333-17344`): kolejka timerow czyszczona, token +1
/// (uniewaznia kazdy spozniony callback starej fali), faza i rozstrzygniecia zerowane.
pub fn halt_auto_battle_turn(st: &mut BatchState, suspend_in_flight: bool) {
    st.hit("halt");
    st.clock.timers.clear();
    st.busy = false;
    st.token += 1;
    st.phase = None;
    st.resolutions.clear();
    st.completed.clear();
    st.pending = 0;
    st.battle_awaiting_orders = true;
    if suspend_in_flight {
        st.auto_battle_suspended = true;
    }
}

/// Web `_drainTimers()` na zegarze K5E: odpala timery wymagalne przy `vNow`; [`BatchTimer::FinishPhase`] wola
/// [`finish_auto_batch_phase`], [`BatchTimer::BeginTurn`] emituje [`BatchEvent::BeginTurn`]. Zwraca liczbe odpalonych.
pub fn fire_timers(
    st: &mut BatchState,
    env: &mut dyn AutoBatchEnv,
    out: &mut Vec<BatchEvent>,
) -> u32 {
    let mut clock = std::mem::take(&mut st.clock);
    let fired = clock.drain_timers(|clk, payload| {
        // Handler planuje na `st.clock`: na czas wywolania wymieniamy zegar z kopia robocza drenowania.
        std::mem::swap(&mut st.clock, clk);
        match payload {
            BatchTimer::FinishPhase { token } => finish_auto_batch_phase(st, env, token, out),
            BatchTimer::BeginTurn => out.push(BatchEvent::BeginTurn),
        }
        std::mem::swap(&mut st.clock, clk);
    });
    st.clock = clock;
    fired
}
