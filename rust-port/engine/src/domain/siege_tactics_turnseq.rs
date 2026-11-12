//! P6 SIEGE-TAKTYKA K5f (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5F-Q1): sekwencja tury sekwencyjnej.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`begin_turn`] = `_beginTurn` (`battleScene.ts:5631-5689`).
//! * [`activate_next`] = `_activateNext` (`battleScene.ts:5979-6030`), bez ciala `_activateUnit` (K5h/K5i).
//! * [`activation_done`] = callback przekazany do `_activateUnit` w `_activateNext` (`battleScene.ts:6005-6029`).
//!
//! Stan (`turnOrder`, `turnIdx`, `acted`, `moveLeft`, `roundNo`, flagi) jest jawnym wejsciem/wyjsciem [`TurnSeqState`].
//! Odczyty ze sceny (`_checkEnd` z jego wejsciami, `_movementPointsFor`, `_fireSiegeTowers`, `_isUnitDoctrineAuto`)
//! idą przez [`TurnSeqEnv`]. Efekty sceny (licznik kontrataku, hint, baner, `_beginAutoBatchPhase`, `_activateUnit`,
//! `_refreshQueuedOrderVisuals`, `_schedule`) sa jawnymi zdarzeniami [`SeqEvent`] w kolejnosci jak w pinie.
//!
//! `_schedule(ms, cb)` = [`SeqEvent::Schedule`]: wykonanie kolejki (K5E `VirtualClock::schedule`) lezy po stronie wywolujacego.
//! Gdy `planning` = true, zegar K5E zwraca `RunNow` i wywolujacy wykonuje krok od razu (jak web `_autoBatchPlanning`).
//!
//! Nie portowano: RNG, `_activateUnit` (K5h/K5i), `_beginAutoBatchPhase` (K5g0), `_updateStallWatch` (wewnatrz wejscia
//! [`TurnSeqEnv::end_check_snapshot`] przy `CheckSite::BeginTurn`, bo w pinie wywolywany tuz przed `_checkEnd`).

use std::collections::BTreeSet;

use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_endcheck::{end_check_order, EndCheckInput, EndCheckOutcome};
use crate::domain::siege_tactics_unit::{alive_power, CombatUnit};

/// Web `ACT_GAP_MS` (`battleScene.ts:1014`): przerwa miedzy aktywacjami dwoch jednostek.
pub const ACT_GAP_MS: f64 = 160.0;
/// Web `TURN_GAP_MS` (`battleScene.ts:1023`): przerwa miedzy pelnymi turami.
pub const TURN_GAP_MS: f64 = 240.0;

/// Miejsce wywolania `_checkEnd`: poczatek tury (`battleScene.ts:5635`) albo `_activateNext` (`:5982`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CheckSite {
    BeginTurn,
    ActivateNext,
}

/// Wejscia `_checkEnd` po stronie wartosci (wlasciwosci `EndCheckInput` bez pozyczek). Liczy je wywolujacy przez [`TurnSeqEnv`].
#[derive(Debug, Clone, PartialEq)]
pub struct EndCheckSnapshot {
    pub stalled: bool,
    pub alive_a: bool,
    pub alive_d: bool,
    pub is_siege: bool,
    pub wall_ever_breached: bool,
    pub total_dead: usize,
    pub ratio_a: f64,
    pub ratio_d: f64,
    pub ratio_a_at_cap: f64,
    pub ratio_d_at_cap: f64,
    pub round_no: i64,
    pub no_breach_cap: i64,
    pub hp_a: Vec<f64>,
    pub hp_d: Vec<f64>,
}

/// Wskazanie jednostki: strona + indeks w `atk` albo `def` (web: referencja `RuntimeBattleUnit`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UnitRef {
    pub side: BattleSide,
    pub idx: usize,
}

/// Jednostka sekwencji: `id` = web `u.bu.id` (klucz `_queuedOrderUnitIds`), `c` = model K5A.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SeqUnit {
    pub id: u64,
    pub c: CombatUnit,
}

/// Krok do zaplanowania przez `_schedule`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SeqStep {
    BeginTurn,
    ActivateNext,
}

/// Stan sekwencji tury (web: `atk`, `def`, `turnOrder`, `turnIdx`, `roundNo`, `siegeWallCol`, `_manualMode`,
/// `_playerControlSide()`, `finished`, `_battleAwaitingOrders`, `_autoBattleSuspended`, `busy`, `_autoBatchPlanning`,
/// `_queuedOrderUnitIds`).
#[derive(Debug, Clone, PartialEq)]
pub struct TurnSeqState {
    pub atk: Vec<SeqUnit>,
    pub def: Vec<SeqUnit>,
    pub turn_order: Vec<UnitRef>,
    pub turn_idx: usize,
    pub round_no: i64,
    /// Web `siegeWallCol` (`>= 0` = oblezenie).
    pub siege_wall_col: i64,
    pub manual_mode: bool,
    /// Web `_playerControlSide()`.
    pub player_side: BattleSide,
    pub finished: bool,
    pub awaiting_orders: bool,
    pub auto_battle_suspended: bool,
    pub busy: bool,
    /// Web `_autoBatchPlanning != null`.
    pub auto_batch_planning: bool,
    pub queued_order_ids: BTreeSet<u64>,
}

impl TurnSeqState {
    fn side_units(&self, side: BattleSide) -> &[SeqUnit] {
        match side {
            BattleSide::Attacker => &self.atk,
            BattleSide::Defender => &self.def,
        }
    }

    fn side_units_mut(&mut self, side: BattleSide) -> &mut Vec<SeqUnit> {
        match side {
            BattleSide::Attacker => &mut self.atk,
            BattleSide::Defender => &mut self.def,
        }
    }

    /// Odczyt jednostki po referencji.
    pub fn unit(&self, r: UnitRef) -> &SeqUnit {
        &self.side_units(r.side)[r.idx]
    }

    fn unit_mut(&mut self, r: UnitRef) -> &mut SeqUnit {
        &mut self.side_units_mut(r.side)[r.idx]
    }

    fn is_player_side(&self, side: BattleSide) -> bool {
        side == self.player_side
    }
}

/// Odczyty i efekty, ktore sekwencja pobiera ze sceny. Kazda metoda odpowiada jednemu wywolaniu w pinie.
pub trait TurnSeqEnv {
    /// Wejscia `_checkEnd` w miejscu `site`. Dla [`CheckSite::BeginTurn`] wywolujacy wykonuje najpierw
    /// `_updateStallWatch` (web `battleScene.ts:5634`), bo tak jest w pinie.
    fn end_check_snapshot(&mut self, site: CheckSite, st: &TurnSeqState) -> EndCheckSnapshot;
    /// Web `_movementPointsFor(ru.bu)`.
    fn movement_points(&mut self, unit: UnitRef, st: &TurnSeqState) -> f64;
    /// Web `_fireSiegeTowers()` (R4). Moze zmienic jednostki (np. zabic) przed zbudowaniem `turnOrder`.
    fn fire_siege_towers(&mut self, st: &mut TurnSeqState);
    /// Web `u.playerOrder.type === 'none' && !this._isUnitDoctrineAuto(u)`.
    fn player_unit_idle(&mut self, unit: UnitRef, st: &TurnSeqState) -> bool;
}

/// Zdarzenia wyjsciowe (efekty sceny i zlecenia dla zegara). Kolejnosc odpowiada kolejnosci wywolan w pinie.
#[derive(Debug, Clone, PartialEq)]
pub enum SeqEvent {
    /// Web `this._counterBudget.beginTurn()`.
    CounterBudgetBeginTurn,
    /// Web `this._fireSiegeTowers()` (wywolanie srodowiska juz nastapilo).
    FireSiegeTowers,
    /// Web `this.hint.textContent = 'Tura ' + roundNo ...`.
    SetHint { round_no: i64 },
    /// Web `_updateBattlePhaseBanner(u)` / `_updateBattlePhaseBanner()`.
    Banner { active: Option<UnitRef> },
    /// Web `_beginAutoBatchPhase('atk', a)`: wejscie do K5g0, po nim `_beginTurn` konczy sie bez `_activateNext`.
    BeginAutoBatchPhase {
        side: BattleSide,
        units: Vec<UnitRef>,
    },
    /// Wywolanie `_checkEnd` w miejscu `site` i jego wynik.
    EndCheck {
        site: CheckSite,
        outcome: EndCheckOutcome,
    },
    /// Web `_activateUnit(u, cb)`: ciało jednostki (K5h/K5i) ma wywolac [`activation_done`] po zakonczeniu.
    ActivateUnit(UnitRef),
    /// Web `_refreshQueuedOrderVisuals()`.
    RefreshQueuedVisuals,
    /// Web `_schedule(ms, cb)`. `planning` = `_autoBatchPlanning != null` w chwili wywolania.
    Schedule {
        ms: f64,
        step: SeqStep,
        planning: bool,
    },
}

/// Wywolanie `_checkEnd` z przerwaniem: `true` gdy `finished` (web `return true`). Ustawia `finished` jak w pinie.
fn check_end(
    st: &mut TurnSeqState,
    env: &mut dyn TurnSeqEnv,
    site: CheckSite,
    out: &mut Vec<SeqEvent>,
) -> bool {
    let snap = env.end_check_snapshot(site, st);
    let outcome = end_check_order(&EndCheckInput {
        stalled: snap.stalled,
        alive_a: snap.alive_a,
        alive_d: snap.alive_d,
        is_siege: snap.is_siege,
        wall_ever_breached: snap.wall_ever_breached,
        total_dead: snap.total_dead,
        ratio_a: snap.ratio_a,
        ratio_d: snap.ratio_d,
        ratio_a_at_cap: snap.ratio_a_at_cap,
        ratio_d_at_cap: snap.ratio_d_at_cap,
        round_no: snap.round_no,
        no_breach_cap: snap.no_breach_cap,
        hp_a: &snap.hp_a,
        hp_d: &snap.hp_d,
    });
    out.push(SeqEvent::EndCheck { site, outcome });
    match outcome {
        EndCheckOutcome::Continue => false,
        EndCheckOutcome::Draw | EndCheckOutcome::Ended(_) => {
            st.finished = true;
            true
        }
    }
}

/// Indeksy jednostek strony, ktore przezyly (`!dead && !fadingOut && !removed`), w kolejnosci tablicy.
fn alive_refs(st: &TurnSeqState, side: BattleSide) -> Vec<UnitRef> {
    st.side_units(side)
        .iter()
        .enumerate()
        .filter(|(_, u)| alive_power(&u.c))
        .map(|(idx, _)| UnitRef { side, idx })
        .collect()
}

fn opposite(side: BattleSide) -> BattleSide {
    match side {
        BattleSide::Attacker => BattleSide::Defender,
        BattleSide::Defender => BattleSide::Attacker,
    }
}

/// Web `_beginTurn()` (`battleScene.ts:5631-5689`).
pub fn begin_turn(st: &mut TurnSeqState, env: &mut dyn TurnSeqEnv, out: &mut Vec<SeqEvent>) {
    if st.finished || st.awaiting_orders {
        return;
    }
    if check_end(st, env, CheckSite::BeginTurn, out) {
        return;
    }
    st.round_no += 1;

    out.push(SeqEvent::CounterBudgetBeginTurn);
    if st.siege_wall_col >= 0 {
        out.push(SeqEvent::FireSiegeTowers);
        env.fire_siege_towers(st);
    }

    // Snapshot zyjacych jednostek: w trybie recznym gracz, potem wrog; w AUTO przeplot atk/def.
    let a = alive_refs(st, BattleSide::Attacker);
    let d = alive_refs(st, BattleSide::Defender);
    let order: Vec<UnitRef> = if st.manual_mode {
        let mut o = alive_refs(st, st.player_side);
        o.extend(alive_refs(st, opposite(st.player_side)));
        o
    } else {
        let n = a.len().max(d.len());
        let mut o = Vec::with_capacity(a.len() + d.len());
        for i in 0..n {
            if let Some(r) = a.get(i) {
                o.push(*r);
            }
            if let Some(r) = d.get(i) {
                o.push(*r);
            }
        }
        o
    };

    // Kazda jednostka z tury: acted = false, moveLeft = _movementPointsFor.
    let mps: Vec<f64> = order.iter().map(|r| env.movement_points(*r, st)).collect();
    for (r, mp) in order.iter().zip(mps) {
        let u = st.unit_mut(*r);
        u.c.acted = false;
        u.c.move_left = mp;
    }

    st.turn_order = order;
    st.turn_idx = 0;

    out.push(SeqEvent::SetHint {
        round_no: st.round_no,
    });
    out.push(SeqEvent::Banner { active: None });

    if !st.manual_mode && st.siege_wall_col < 0 {
        out.push(SeqEvent::BeginAutoBatchPhase {
            side: BattleSide::Attacker,
            units: a,
        });
        return;
    }
    activate_next(st, env, out);
}

/// Web `_activateNext()` (`battleScene.ts:5979-6030`).
pub fn activate_next(st: &mut TurnSeqState, env: &mut dyn TurnSeqEnv, out: &mut Vec<SeqEvent>) {
    if st.finished || st.awaiting_orders {
        return;
    }
    if check_end(st, env, CheckSite::ActivateNext, out) {
        return;
    }

    let mut picked: Option<UnitRef> = None;
    let mut cleared_skipped_queued_order = false;
    while st.turn_idx < st.turn_order.len() {
        let cand = st.turn_order[st.turn_idx];
        st.turn_idx += 1;
        let su = *st.unit(cand);
        // Pomijane: martwe / znikajace / usuniete / juz zrobily ruch. Routed nadal aktywuja sie (ucieczka).
        if alive_power(&su.c) && !su.c.acted {
            picked = Some(cand);
            break;
        }
        if st.manual_mode && st.queued_order_ids.remove(&su.id) {
            cleared_skipped_queued_order = true;
        }
    }
    if cleared_skipped_queued_order {
        out.push(SeqEvent::RefreshQueuedVisuals);
    }

    match picked {
        None => {
            // Cala tura wykonana -> nastepna po przerwie.
            out.push(SeqEvent::Schedule {
                ms: TURN_GAP_MS,
                step: SeqStep::BeginTurn,
                planning: st.auto_batch_planning,
            });
        }
        Some(u) => {
            out.push(SeqEvent::Banner { active: Some(u) });
            out.push(SeqEvent::ActivateUnit(u));
        }
    }
}

/// Callback `_activateUnit(u, cb)` z `_activateNext`: po zakonczeniu ciała jednostki (K5h/K5i).
pub fn activation_done(
    st: &mut TurnSeqState,
    env: &mut dyn TurnSeqEnv,
    unit: UnitRef,
    out: &mut Vec<SeqEvent>,
) {
    let id = st.unit(unit).id;
    if st.manual_mode && st.queued_order_ids.remove(&id) {
        out.push(SeqEvent::RefreshQueuedVisuals);
    }
    if st.auto_battle_suspended {
        st.busy = false;
        return;
    }
    let idle_player_unit =
        st.manual_mode && st.is_player_side(unit.side) && env.player_unit_idle(unit, st);
    if !idle_player_unit {
        st.unit_mut(unit).c.acted = true;
    }
    out.push(SeqEvent::Schedule {
        ms: ACT_GAP_MS,
        step: SeqStep::ActivateNext,
        planning: st.auto_batch_planning,
    });
}
