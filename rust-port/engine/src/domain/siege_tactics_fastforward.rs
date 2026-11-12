//! P6 SIEGE-TAKTYKA K5j (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5J-Q1): `_runFastForward`
//! jako czysta pętla krokowa bez czasu ściennego.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`run_fast_forward`] = `_runFastForward` (`battleScene.ts:9415-9437`), kolejność iteracji jak w pinie:
//!   (a) sufit tur -> zdarzenie [`FfEvent::RoundCapResult`] i zakończenie (`_roundCapVerdict` `:9424`, `_ffRoundCapResult` `:9485`),
//!   (b) `_ffPendingAuto && !busy` -> [`FfEvent::EnterAuto`] (`:9425`),
//!   (c) `vNow += FF_STEP_MS` i `ffVirtualMs += FF_STEP_MS` (`:9426-9427`),
//!   (d) [`VirtualClock::drain_timers`] -> [`FfEvent::TimerFired`] (`:9428`),
//!   (e) [`FfEvent::TickProjectiles`] i (f) [`FfEvent::TickFades`] z `vNow` (`:9429-9430`),
//!   (g) zrzut kolejki `_ffQueue` i [`FfEvent::RunQueued`] dla każdego elementu, w kolejności (`:9433-9435`).
//! * [`ff_step_ms`] = `FF_STEP_MS = _scaledWallDelta(BATTLE_FRAME_WALL_MS)` (`:9419`), `BATTLE_FRAME_WALL_MS = 16` (`:2552`).
//!
//! Zmiany względem weba (świadome, zgodne z dispatchem):
//! * Budżet czasu ściennego (`performance.now() - wall0 < 40`, `:9422-9423`) zastąpiony jawnym limitem kroków
//!   `max_steps` podawanym jako wejście. Limit sprawdzany w tym samym miejscu co warunek pętli weba (po `finished`).
//!   Wynik [`FfStop::StepLimit`] odpowiada wyjściu z pętli przez budżet; reszta klatki zostaje po stronie wywołującego.
//! * Efekty sceny (logi, `_ffEnterAuto`, `_tickProjectiles`, `_tickFades`, callbacki timerów i kolejki, `_ffRoundCapResult`)
//!   są jawnymi zdarzeniami [`FfEvent`] przekazywanymi do [`FfHost::event`]. Host wykonuje efekt i ma dostęp do stanu
//!   (w tym do `_raf` w trybie FF: dopisanie do [`FfLoopState::queue`], jak `_ffQueue.push` w `:9407`).
//! * Decyzja sufitu tur ([`FfHost::round_cap`]) jest wstrzykiwana. Domyślna implementacja hosta: [`round_cap_verdict_step`]
//!   (`ff_cap_step` z K5d, bez bramki żywych stron, jak `_roundCapVerdict` w `_runFastForward`).
//! * Uwaga do dispatchu: w pinie pętla przewijania NIE wywołuje `_checkEnd` (`:9424` to `_roundCapVerdict`).
//!   `_checkEnd` działa w callbackach timerów (obsługiwanych przez [`FfEvent::TimerFired`] w hoście), tam, gdzie woła go
//!   web. Ten moduł nie dodaje wywołania, którego nie ma w pinie.
//!
//! Moduł nie zawiera czasu ściennego ani zegara systemowego: wynik zależy wyłącznie od wejść.

use crate::domain::siege_no_breach::RoundCapVerdict;
use crate::domain::siege_tactics_clock::VirtualClock;
use crate::domain::siege_tactics_roundcap::{ff_cap_step, RoundCapState, RoundCapStep};

/// Web `BattleScene.BATTLE_FRAME_WALL_MS` (`battleScene.ts:2552`).
pub const BATTLE_FRAME_WALL_MS: f64 = 16.0;

/// Web `FF_STEP_MS = this._scaledWallDelta(BattleScene.BATTLE_FRAME_WALL_MS)` (`battleScene.ts:9419`).
pub fn ff_step_ms<T>(clock: &VirtualClock<T>) -> f64 {
    clock.scaled_wall_delta(BATTLE_FRAME_WALL_MS)
}

/// Stan pętli przewijania, który w webie żyje na scenie: `ffVirtualMs`, `ffPendingAuto`, `ffQueue`.
#[derive(Debug, Clone, PartialEq)]
pub struct FfLoopState<Q> {
    /// Web `this._ffVirtualMs`.
    pub ff_virtual_ms: f64,
    /// Web `this._ffPendingAuto`.
    pub pending_auto: bool,
    /// Web `this._ffQueue` (kolejka kroków animacji dopisywanych przez `_raf` w trybie FF).
    pub queue: Vec<Q>,
}

impl<Q> FfLoopState<Q> {
    /// Stan początkowy jak w `skip()` (`battleScene.ts:3697-3703`) przed wejściem w pętlę.
    pub fn new() -> Self {
        Self {
            ff_virtual_ms: 0.0,
            pending_auto: false,
            queue: Vec::new(),
        }
    }
}

impl<Q> Default for FfLoopState<Q> {
    fn default() -> Self {
        Self::new()
    }
}

/// Zdarzenia efektów sceny, jawne i w kolejności wykonania pinu.
#[derive(Debug, Clone, PartialEq)]
pub enum FfEvent<T, Q> {
    /// Web `this._ffEnterAuto()` (`battleScene.ts:9425`, `:3709`).
    EnterAuto,
    /// Callback timera wybrany przez `_drainTimers` (`:9428`).
    TimerFired(T),
    /// Web `this._tickProjectiles(this.vNow)` (`:9429`).
    TickProjectiles(f64),
    /// Web `this._tickFades(this.vNow)` (`:9430`).
    TickFades(f64),
    /// Element kolejki `_ffQueue` wykonany w tej iteracji (`:9433-9435`).
    RunQueued(Q),
    /// Web `this._ffRoundCapResult()` po werdykcie sufitu (`:9424`, `:9485-9497`).
    RoundCapResult(RoundCapVerdict),
}

/// Port efektów sceny i decyzji sufitu dla [`run_fast_forward`].
pub trait FfHost<T, Q> {
    /// Web `_roundCapVerdict()` (`battleScene.ts:9449`) wywoływany na początku każdej iteracji.
    fn round_cap(
        &mut self,
        clock: &VirtualClock<T>,
        st: &FfLoopState<Q>,
    ) -> Option<RoundCapVerdict>;
    /// Web `this.busy`.
    fn busy(&self) -> bool;
    /// Wykonanie efektu. Może planować timery (`clock.schedule`) i dopisywać do `st.queue` (`_raf` w trybie FF).
    fn event(&mut self, clock: &mut VirtualClock<T>, st: &mut FfLoopState<Q>, ev: FfEvent<T, Q>);
}

/// Powód zakończenia [`run_fast_forward`].
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FfStop {
    /// Web `!this.finished` jest fałszem (bitwa zakończona w tej lub wcześniejszej klatce).
    Finished,
    /// Werdykt sufitu tur (web `if (this._roundCapVerdict()) { ... return; }`).
    RoundCap(RoundCapVerdict),
    /// Wyczerpany jawny limit kroków (zamiast budżetu 40 ms ściennych).
    StepLimit,
}

/// Domyślna decyzja sufitu dla hosta: `_roundCapVerdict` jako `ff_cap_step` z K5d (bez bramki żywych stron).
pub fn round_cap_verdict_step(
    state: &RoundCapState,
    atk_ratio: f64,
    def_ratio: f64,
) -> Option<RoundCapVerdict> {
    match ff_cap_step(state, atk_ratio, def_ratio) {
        RoundCapStep::Finish(v) => Some(v),
        RoundCapStep::Continue => None,
    }
}

/// Web `_runFastForward` (`battleScene.ts:9415-9437`) z budżetem zastąpionym przez `max_steps`.
///
/// Każda pełna iteracja liczy się jako jeden krok. Pętla kończy się, gdy bitwa jest zakończona, gdy sufit tur
/// zwróci werdykt, albo gdy wykonano `max_steps` pełnych iteracji.
pub fn run_fast_forward<T, Q, H: FfHost<T, Q>>(
    clock: &mut VirtualClock<T>,
    st: &mut FfLoopState<Q>,
    host: &mut H,
    max_steps: u32,
) -> FfStop {
    let step_ms = ff_step_ms(clock);
    let mut steps: u32 = 0;
    loop {
        if clock.finished {
            return FfStop::Finished;
        }
        if steps >= max_steps {
            return FfStop::StepLimit;
        }
        if let Some(v) = host.round_cap(clock, st) {
            host.event(clock, st, FfEvent::RoundCapResult(v));
            return FfStop::RoundCap(v);
        }
        if st.pending_auto && !host.busy() {
            st.pending_auto = false;
            host.event(clock, st, FfEvent::EnterAuto);
        }
        clock.v_now += step_ms;
        st.ff_virtual_ms += step_ms;
        clock.drain_timers(|c, p| host.event(c, st, FfEvent::TimerFired(p)));
        let now = clock.v_now;
        host.event(clock, st, FfEvent::TickProjectiles(now));
        host.event(clock, st, FfEvent::TickFades(now));
        let batch = std::mem::take(&mut st.queue);
        for cb in batch {
            host.event(clock, st, FfEvent::RunQueued(cb));
        }
        steps += 1;
    }
}
