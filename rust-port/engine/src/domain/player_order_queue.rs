//! P6 EXEC T1 (R-RUSTPORT-P6-EXEC-T1-QUEUE-Q1, runda 1): kolejka rozkazow gracza `_executeUnitsImmediate`.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`, `_executeUnitsImmediate` `:18578-18614`):
//! * filtr startowy `dead/removed/routed/acted/queued` (`:18580-18583`) -> [`execute_units_immediate`];
//! * petla `runNext(idx)` jako jawny stan: indeks + wynik kroku ([`StepResult`]) zamiast callbackow;
//! * busy-gate (`:18600-18603`): gdy `busy`, odroczenie `_schedule(40, ...)` przez [`VirtualClock`] (zdarzenie
//!   [`OrderQueueEvent::Defer`]); w trybie planowania AUTO (`_autoBatchPlanning`) [`ScheduleOutcome::RunNow`]
//!   wykonuje ponowne `runNext` synchronicznie (jak web);
//! * `_performPlayerOrder` jest wstrzykniety jako trait [`PlayerOrderExec`] (zwraca zdarzenia i informacje, czy
//!   callback `done` zostal wywolany synchronicznie); asynchroniczne `done` obsluguje [`on_order_done`];
//! * `u.acted = true` (`:18609`) = [`PlayerOrderExec::mark_acted`]; koniec kolejki = [`OrderQueueEvent::RefreshQueuedOrderVisuals`]
//!   (`:18587`); pierwsza instrukcja `this._autoBattleSuspended = false` (`:18579`) = [`OrderQueueEvent::ClearAutoBattleSuspended`].
//!
//! Poza zakresem (dispatch): `_performPlayerOrder` (T3/T4), zmiany `ActivateOps` i `siege_tactics_activate.rs`.
//! Caly przeplyw synchroniczny: wywolujacy trzyma kolejke (`Vec<String>`) i indeks czekajacy, a wznawia przez
//! [`on_timer`] (timer z [`VirtualClock`]) albo [`on_order_done`] (asynchroniczne `done`).
//!
//! Uwaga: w trybie planowania (`planning = true`) przy stale `busy` petla nie konczy sie (web przepelnilby stos);
//! zgodnosc z pinem zachowana, bramki nie testuja tego przypadku.

use crate::domain::siege_tactics_clock::{ScheduleOutcome, VirtualClock};

/// Web `this._schedule(40, ...)` w busy-gate (`battleScene.ts:18601`).
pub const BUSY_RETRY_MS: f64 = 40.0;

/// Pola jednostki gracza czytane przez `_executeUnitsImmediate` (web `RuntimeBattleUnit`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct PlayerUnitFlags {
    pub dead: bool,
    pub removed: bool,
    pub routed: bool,
    pub acted: bool,
}

/// Wynik `_performPlayerOrder`: zdarzenia wykonania oraz, czy callback `done` zostal wywolany synchronicznie.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderOutcome<E> {
    pub events: Vec<E>,
    pub completed: bool,
}

/// Zdarzenia wynikowe kolejki (wzorem `BatchEvent` z `siege_tactics_autobatch.rs`).
#[derive(Debug, Clone, PartialEq)]
pub enum OrderQueueEvent<E> {
    /// `this._autoBattleSuspended = false` (`battleScene.ts:18579`).
    ClearAutoBattleSuspended,
    /// Zdarzenie zwrocone przez `_performPlayerOrder` (wykonanie rozkazu jednostki).
    Order(E),
    /// `this._schedule(ms, ...)` poza planowaniem: odroczenie przez [`VirtualClock`] (busy-gate).
    Defer { ms: f64 },
    /// `this._refreshQueuedOrderVisuals()` (`battleScene.ts:18587`) po wyczerpaniu kolejki.
    RefreshQueuedOrderVisuals,
}

/// Port wstrzyknietego `_performPlayerOrder` i odczytow sceny uzywanych przez kolejke.
pub trait PlayerOrderExec {
    type Event;
    /// Web `this._findPlayerUnit(id)`: `None` = `undefined`.
    fn find_player_unit(&self, id: &str) -> Option<PlayerUnitFlags>;
    /// Web `this._queuedOrderUnitIds.has(id)`.
    fn is_queued_order(&self, id: &str) -> bool;
    /// Web odczyt `this.busy` (wywolywany raz na kazda iteracje, po znalezieniu jednostki).
    fn is_busy(&mut self) -> bool;
    /// Web `this._performPlayerOrder(u, done)`.
    fn perform_player_order(&mut self, id: &str) -> OrderOutcome<Self::Event>;
    /// Web `u.acted = true` w callbacku `done` (`battleScene.ts:18609`).
    /// Web ustawia pole na obiekcie `u` zlapanym przed asynchronicznym `done`; tu wywolanie idzie po id.
    /// Kontrakt dla T3/T4: implementacja musi trafic w jednostke, ktora nadal istnieje w scenie (brak wektora na zniknieta jednostke).
    fn mark_acted(&mut self, id: &str);
}

/// Wynik jednego kroku: zdarzenia oraz indeks w kolejce, dla ktorego `_performPlayerOrder` czeka na `done`.
#[derive(Debug, Clone, PartialEq)]
pub struct StepResult<E> {
    pub events: Vec<OrderQueueEvent<E>>,
    pub awaiting: Option<usize>,
}

/// Web `_executeUnitsImmediate(unitIds)` (`battleScene.ts:18578-18614`), start.
/// Zwraca kolejke po filtrze startowym (`:18580-18583`) i wynik pierwszego przebiegu `runNext(0)`.
pub fn execute_units_immediate<X: PlayerOrderExec>(
    exec: &mut X,
    clock: &mut VirtualClock<usize>,
    unit_ids: &[String],
    planning: bool,
) -> (Vec<String>, StepResult<X::Event>) {
    let queue: Vec<String> = unit_ids
        .iter()
        .filter(|id| match exec.find_player_unit(id) {
            Some(u) => !u.dead && !u.removed && !u.routed && !u.acted && !exec.is_queued_order(id),
            None => false,
        })
        .cloned()
        .collect();
    let mut step = run_from(exec, clock, &queue, 0, planning);
    step.events
        .insert(0, OrderQueueEvent::ClearAutoBattleSuspended);
    (queue, step)
}

/// Wznowienie po odroczeniu busy-gate: web `this._schedule(40, () => runNext(idx))`, timer z [`VirtualClock`].
pub fn on_timer<X: PlayerOrderExec>(
    exec: &mut X,
    clock: &mut VirtualClock<usize>,
    queue: &[String],
    idx: usize,
    planning: bool,
) -> StepResult<X::Event> {
    run_from(exec, clock, queue, idx, planning)
}

/// Callback `done` z `_performPlayerOrder` wywolany asynchronicznie dla `queue[idx]`: `u.acted = true`, potem `runNext(idx + 1)`.
pub fn on_order_done<X: PlayerOrderExec>(
    exec: &mut X,
    clock: &mut VirtualClock<usize>,
    queue: &[String],
    idx: usize,
    planning: bool,
) -> StepResult<X::Event> {
    exec.mark_acted(&queue[idx]);
    run_from(exec, clock, queue, idx + 1, planning)
}

/// Web `runNext(idx)` (`battleScene.ts:18585-18611`) z lancuchem wywolan synchronicznych.
fn run_from<X: PlayerOrderExec>(
    exec: &mut X,
    clock: &mut VirtualClock<usize>,
    queue: &[String],
    start: usize,
    planning: bool,
) -> StepResult<X::Event> {
    let mut events = Vec::new();
    let mut idx = start;
    loop {
        if idx >= queue.len() {
            events.push(OrderQueueEvent::RefreshQueuedOrderVisuals);
            return StepResult {
                events,
                awaiting: None,
            };
        }
        let id = &queue[idx];
        // `if (!id) { runNext(idx + 1); return; }` (battleScene.ts:18591-18594): pusty id pomijany przed odczytem jednostki.
        if id.is_empty() {
            idx += 1;
            continue;
        }
        // `const u = this._findPlayerUnit(id); if (!u) runNext(idx + 1);`
        if exec.find_player_unit(id).is_none() {
            idx += 1;
            continue;
        }
        // Busy-gate: `if (this.busy) { this._schedule(40, () => runNext(idx)); return; }`
        if exec.is_busy() {
            match clock.schedule(BUSY_RETRY_MS, idx, planning) {
                ScheduleOutcome::RunNow(next) => {
                    idx = next;
                    continue;
                }
                ScheduleOutcome::Queued => {
                    events.push(OrderQueueEvent::Defer { ms: BUSY_RETRY_MS });
                    return StepResult {
                        events,
                        awaiting: None,
                    };
                }
                ScheduleOutcome::Dropped => {
                    return StepResult {
                        events,
                        awaiting: None,
                    }
                }
            }
        }
        // `if (u.acted || u.dead || u.routed) runNext(idx + 1);`
        match exec.find_player_unit(id) {
            Some(u) if !(u.acted || u.dead || u.routed) => {}
            _ => {
                idx += 1;
                continue;
            }
        }
        let outcome = exec.perform_player_order(id);
        events.extend(outcome.events.into_iter().map(OrderQueueEvent::Order));
        if outcome.completed {
            exec.mark_acted(id);
            idx += 1;
            continue;
        }
        return StepResult {
            events,
            awaiting: Some(idx),
        };
    }
}
