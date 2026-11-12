//! P6 SIEGE-TAKTYKA K5e (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5E-Q1): zegar wirtualny i kolejka
//! timerow bitwy taktycznej.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`VirtualClock::advance_v_clock`] = `_advanceVClock` (`battleScene.ts:9500-9511`).
//! * [`VirtualClock::scaled_wall_delta`] = `_scaledWallDelta` (`battleScene.ts:9512-9515`); stala
//!   [`BATTLE_FRAME_MAX_WALL_DELTA_MS`] = `battleScene.ts:2553`.
//! * [`VirtualClock::schedule`] = `_schedule` (`battleScene.ts:9595-9606`), z gałęzią planowania AUTO (`_autoBatchPlanning`)
//!   zwracaną jako [`ScheduleOutcome::RunNow`] (web wykonuje callback synchronicznie).
//! * [`VirtualClock::drain_timers`] = `_drainTimers` (`battleScene.ts:9616-9634`): wybór najwcześniejszego `due <= vNow`,
//!   remis po `id`, guard [`DRAIN_GUARD_LIMIT`] (`100000`) na jedno wywołanie.
//!
//! Decyzja modelu (dispatch, `events.rs` odrzucone): kolejka jest WŁASNA i kluczowana czasem wirtualnym
//! (`due = vNow + ms`, `id = vTimerSeq++`). `domain/events.rs` ma klucz `(tura, faza, sekwencja)` i NIE jest równoważny.
//!
//! Callbacki webu nie są wykonywane tutaj: ładunek timera `T` jest jawnym zdarzeniem wyjściowym, które wywołujący
//! obsługuje w `on_fire` (w tym ewentualne ponowne `schedule` w trakcie drenowania, zgodnie z pętlą `while` z pinu).
//!
//! Poza zakresem tego modułu (świadomie, K5 wg doc `P6-SIEGE-TAKTYKA.md` §K5.10): pętla tur, `_checkEnd`, `_runFastForward`
//! (`FF_STEP_MS`, budżet ściany 40 ms), `_startLoop`, oraz powiązanie z `roundNo`. Pole `finished` jest wejściem ustawianym
//! przez wywołującego (web: `this.finished`), nie wynikiem tego modułu poza zachowaniem `_schedule`/`_drainTimers`.

/// Web `BATTLE_FRAME_MAX_WALL_DELTA_MS` (`battleScene.ts:2553`): górny clamp delty ściennej (ms).
pub const BATTLE_FRAME_MAX_WALL_DELTA_MS: f64 = 100.0;

/// Sufit wywołań callbacków w jednym `_drainTimers` (`battleScene.ts:9632`: `if (++guard > 100000) break;`).
pub const DRAIN_GUARD_LIMIT: u32 = 100_000;

/// Jeden timer w kolejce: web `{ due, cb, id }`. `payload` zastępuje `cb`.
#[derive(Debug, Clone, PartialEq)]
pub struct Timer<T> {
    pub due: f64,
    pub id: u64,
    pub payload: T,
}

/// Wynik `_schedule`.
#[derive(Debug, Clone, PartialEq)]
pub enum ScheduleOutcome<T> {
    /// Dopisano do kolejki (web: `vTimers.push`).
    Queued,
    /// Pominięte, bo `finished` (web: `if (this.finished) return;`).
    Dropped,
    /// Tryb planowania AUTO (web: `_autoBatchPlanning` != null): callback wykonywany od razu, z ładunkiem do wykonania.
    RunNow(T),
}

/// Stan zegara i kolejki: web `vNow`, `vLastWall`, `vTimers`, `vTimerSeq`, `paused`, `speedMul`, `finished`.
#[derive(Debug, Clone, PartialEq)]
pub struct VirtualClock<T> {
    pub v_now: f64,
    pub v_last_wall: f64,
    pub timers: Vec<Timer<T>>,
    pub timer_seq: u64,
    pub paused: bool,
    pub speed_mul: f64,
    pub finished: bool,
}

/// Web `Math.max` / `Math.min` (NaN propaguje, znak zera jak w JS): wspolne helpery z `siege_tactics_blow`.
pub use crate::domain::siege_tactics_blow::{js_max, js_min};

impl<T> VirtualClock<T> {
    /// Nowy zegar: stan poczatkowy jak pola sceny webu (`vNow = 0`, `vLastWall = 0`, `vTimers = []`, `vTimerSeq = 0`).
    pub fn new() -> Self {
        Self {
            v_now: 0.0,
            v_last_wall: 0.0,
            timers: Vec::new(),
            timer_seq: 0,
            paused: false,
            speed_mul: 1.0,
            finished: false,
        }
    }

    /// Web `_now()` (`battleScene.ts:9403`).
    pub fn now(&self) -> f64 {
        self.v_now
    }

    /// Web `_scaledWallDelta` (`battleScene.ts:9512-9515`): `clamp(delta, 0, 100) * speedMul`.
    pub fn scaled_wall_delta(&self, wall_delta: f64) -> f64 {
        let clamped = js_max(0.0, js_min(wall_delta, BATTLE_FRAME_MAX_WALL_DELTA_MS));
        clamped * self.speed_mul
    }

    /// Web `_advanceVClock(wall)` (`battleScene.ts:9500-9511`).
    /// Pierwsze wywolanie (`vLastWall === 0`) tylko ustawia referencje. Na pauzie referencja jest odswiezana, zegar stoi.
    pub fn advance_v_clock(&mut self, wall: f64) {
        if self.v_last_wall == 0.0 {
            self.v_last_wall = wall;
            return;
        }
        let mut dw = wall - self.v_last_wall;
        self.v_last_wall = wall;
        if self.paused {
            return;
        }
        if dw < 0.0 {
            dw = 0.0;
        }
        self.v_now += self.scaled_wall_delta(dw);
    }

    /// Web `_schedule(ms, cb)` (`battleScene.ts:9595-9606`). Kolejność jak w pinie: najpierw planowanie AUTO
    /// (`planning`), potem `finished`, na końcu `due = vNow + max(0, ms)`, `id = vTimerSeq++`.
    pub fn schedule(&mut self, ms: f64, payload: T, planning: bool) -> ScheduleOutcome<T> {
        if planning {
            return ScheduleOutcome::RunNow(payload);
        }
        if self.finished {
            return ScheduleOutcome::Dropped;
        }
        let due = self.v_now + js_max(0.0, ms);
        let id = self.timer_seq;
        self.timer_seq += 1;
        self.timers.push(Timer { due, id, payload });
        ScheduleOutcome::Queued
    }

    /// Web `_drainTimers()` (`battleScene.ts:9616-9634`). `target` = `vNow` odczytane raz na poczatku.
    /// Wybor: `due > target` pomijane; kandydat zastepuje najlepszego, gdy `due` mniejsze lub rowne z mniejszym `id`.
    /// Porownania f64 maja semantyke JS (`NaN` nie jest `>`/`<`/`==`). `on_fire` dostaje klocek i moze planowac dalej.
    /// Zwraca liczbe wykonanych callbackow. Po `finished` czysci kolejke i konczy.
    pub fn drain_timers<F: FnMut(&mut Self, T)>(&mut self, mut on_fire: F) -> u32 {
        let target = self.v_now;
        let mut guard: u32 = 0;
        let mut fired: u32 = 0;
        loop {
            if self.finished {
                self.timers.clear();
                return fired;
            }
            let mut best: Option<usize> = None;
            for i in 0..self.timers.len() {
                let t = &self.timers[i];
                if t.due > target {
                    continue;
                }
                let replace = match best {
                    None => true,
                    Some(b) => {
                        let bt = &self.timers[b];
                        t.due < bt.due || (t.due == bt.due && t.id < bt.id)
                    }
                };
                if replace {
                    best = Some(i);
                }
            }
            let Some(b) = best else {
                break;
            };
            let timer = self.timers.remove(b);
            on_fire(self, timer.payload);
            fired += 1;
            guard += 1;
            if guard > DRAIN_GUARD_LIMIT {
                break;
            }
        }
        fired
    }
}

impl<T> Default for VirtualClock<T> {
    fn default() -> Self {
        Self::new()
    }
}
