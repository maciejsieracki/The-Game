//! REPIN-3D batch A1 (topic R-RUSTPORT-REPIN-3D-A-Q1, document
//! `dyspozycje/rust-port/p4/P4-REPIN-3D.md`): the order-queue state of the
//! CURRENT web `battle/battleScene.ts` (`origin/main`) that decides which
//! order arrows the scene draws and whether they are drawn as queued
//! (dashed). Pin `edb8fb56` (parts 1–5 of MOD-14) had no attack-move order
//! and never consumed queue entries on activation; both changed in the web
//! (commits `601fc3baf` "Add manual attack-move battle order", `96d088b4d`
//! "clear stale queued order ids after activation").
//!
//! | web (`origin/main`) | Rust |
//! |---|---|
//! | `_queuedOrderUnitIds: Set<string>` | [`QueuedOrders`] (JS `Set` semantics: insertion order, no duplicates) |
//! | the queue part of `_activateNext` (`:5847-5898`) | [`next_activation`], [`consume_on_activation`] |
//! | `_issueBattleAttackMove` (`:18076-18096`) | [`issue_attack_move`] |
//! | `_cancelAttackMoveSelected` (`:18098-18106`), Escape in `_onKeyManual` (`:16850-16856`) | [`cancel_attack_move_selected`] |
//!
//! The arrows themselves are [`super::units::refresh_queued_order_visuals`]
//! (with [`super::units::PlayerOrder::AttackMove`]); the immediate removal of
//! killed units is [`super::units::kill_unit`]. What an order DOES on the
//! field (route, threat scan, melee) is battle logic (P6.13) and is not here.
//!
//! Verified against vectors produced by running the web code
//! (`tests/repin3d_a1.rs`, `tests/repin3d_fixtures/`).

use super::units::{OrderUnit, PlayerOrder};

/// `this._queuedOrderUnitIds` — the ids whose order waits for their unit's
/// own activation ("dyspozycja", Ctrl/Shift + click). A JS `Set<string>`:
/// insertion-ordered, without duplicates; `add` of a present id keeps its
/// place.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct QueuedOrders {
    ids: Vec<String>,
}

impl QueuedOrders {
    /// `new Set()`.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// `new Set(ids)` (later duplicates dropped).
    pub fn from_ids<I, S>(ids: I) -> Self
    where
        I: IntoIterator<Item = S>,
        S: AsRef<str>,
    {
        let mut q = Self::new();
        for id in ids {
            q.add(id.as_ref());
        }
        q
    }

    /// `set.has(id)`.
    #[must_use]
    pub fn has(&self, id: &str) -> bool {
        self.ids.iter().any(|x| x == id)
    }

    /// `set.add(id)`.
    pub fn add(&mut self, id: &str) {
        if !self.has(id) {
            self.ids.push(id.to_owned());
        }
    }

    /// `set.delete(id)`: `true` when the id was present.
    pub fn delete(&mut self, id: &str) -> bool {
        match self.ids.iter().position(|x| x == id) {
            Some(i) => {
                self.ids.remove(i);
                true
            }
            None => false,
        }
    }

    /// `set.clear()`.
    pub fn clear(&mut self) {
        self.ids.clear();
    }

    /// `[...set]` (insertion order) — the `queued` argument of
    /// [`super::units::refresh_queued_order_visuals`].
    #[must_use]
    pub fn ids(&self) -> &[String] {
        &self.ids
    }

    /// `set.size`.
    #[must_use]
    pub fn len(&self) -> usize {
        self.ids.len()
    }

    /// `set.size === 0`.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.ids.is_empty()
    }
}

/// One entry of `this.turnOrder` (the turn snapshot of `_beginTurn`) as the
/// queue step of `_activateNext` reads it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TurnCandidate {
    /// `bu.id`.
    pub id: String,
    /// `dead`.
    pub dead: bool,
    /// `fadingOut`.
    pub fading_out: bool,
    /// `removed`.
    pub removed: bool,
    /// `acted`.
    pub acted: bool,
}

impl TurnCandidate {
    /// `!cand.dead && !cand.fadingOut && !cand.removed && !cand.acted` (`:5861`).
    #[must_use]
    pub const fn can_act(&self) -> bool {
        !self.dead && !self.fading_out && !self.removed && !self.acted
    }
}

/// The result of the queue step of `_activateNext`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct NextActivation {
    /// Index into the turn order of the unit that activates now; `None` =
    /// the turn is exhausted (the web schedules `_beginTurn` after
    /// `TURN_GAP_MS`).
    pub unit: Option<usize>,
    /// `clearedSkippedQueuedOrder`: at least one skipped candidate had a
    /// queued order, which was dropped — the caller refreshes the arrows
    /// ([`super::units::refresh_queued_order_visuals`]) once.
    pub refresh: bool,
}

/// The candidate scan of `_activateNext` (`origin/main :5853-5866`; the
/// early returns on `finished`, `_battleAwaitingOrders` and `_checkEnd()`
/// before it are the caller's). Walks `order` from `*turn_idx` (advanced
/// past the activated unit, or to the end), stops at the first candidate
/// that can act; in manual mode every skipped candidate's queued order is
/// dropped from `queued`.
pub fn next_activation(
    order: &[TurnCandidate],
    turn_idx: &mut usize,
    manual: bool,
    queued: &mut QueuedOrders,
) -> NextActivation {
    let mut refresh = false;
    while *turn_idx < order.len() {
        let i = *turn_idx;
        *turn_idx += 1;
        let cand = &order[i];
        if cand.can_act() {
            return NextActivation {
                unit: Some(i),
                refresh,
            };
        }
        if manual && queued.delete(&cand.id) {
            refresh = true;
        }
    }
    NextActivation {
        unit: None,
        refresh,
    }
}

/// The first step of the activation callback of `_activateNext`
/// (`:5881-5883`): the unit's queued order has been consumed by its own
/// activation. `true` = it was queued (manual mode only) — refresh the
/// arrows.
pub fn consume_on_activation(manual: bool, queued: &mut QueuedOrders, id: &str) -> bool {
    manual && queued.delete(id)
}

/// `_findPlayerUnit(id)`: the first roster unit with that id.
fn find_mut<'a>(roster: &'a mut [OrderUnit], id: &str) -> Option<&'a mut OrderUnit> {
    roster.iter_mut().find(|u| u.id == id)
}

/// What [`issue_attack_move`] asks the caller to do next.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AttackMoveIssued {
    /// The `_showOrderFeedback` text.
    pub feedback: &'static str,
    /// `!queueOnly`: run the orders now (`_executeUnitsImmediate(ids)` then
    /// `_advanceToNextBattleUnit(new Set(ids))` — logic).
    pub execute_now: bool,
}

/// `_issueBattleAttackMove(col, row, queueOnly)` (`origin/main :18076-18096`)
/// on the player roster, with `ids` = `_collectOrderUnitIds()` (selection /
/// groups → P6.13). Returns `None` for an empty selection (nothing happens).
/// Otherwise `order_move(roster, col, row, ids)` is `_orderMoveForUnits`
/// (group formation offsets, `_moveDestinationsForSelection` — logic,
/// injected); then every listed live unit (not dead / removed / routed)
/// gets `AttackMove` to its move-order tile (its formation slot), or to
/// `(col, row)` when it has no move order, and its id is queued
/// (`queue_only`) or unqueued. The caller then refreshes the arrows
/// ([`super::units::refresh_queued_order_visuals`]) — always, like the web.
pub fn issue_attack_move<F>(
    roster: &mut [OrderUnit],
    ids: &[String],
    col: i32,
    row: i32,
    queue_only: bool,
    queued: &mut QueuedOrders,
    order_move: F,
) -> Option<AttackMoveIssued>
where
    F: FnOnce(&mut [OrderUnit], i32, i32, &[String]),
{
    if ids.is_empty() {
        return None;
    }
    order_move(roster, col, row, ids);
    for id in ids {
        let Some(u) = find_mut(roster, id) else {
            continue;
        };
        if u.dead || u.removed || u.routed {
            continue;
        }
        let (wc, wr) = match u.order {
            PlayerOrder::Move { col: c, row: r } => (c, r),
            _ => (col, row),
        };
        u.order = PlayerOrder::AttackMove { col: wc, row: wr };
        if queue_only {
            queued.add(id);
        } else {
            queued.delete(id);
        }
    }
    Some(AttackMoveIssued {
        feedback: if queue_only {
            "Dyspozycja ATAKUJ-MARSZEM"
        } else {
            "ATAKUJ-MARSZEM"
        },
        execute_now: !queue_only,
    })
}

/// `_cancelAttackMoveSelected()` (`origin/main :18098-18106`; also the
/// Escape branch of `_onKeyManual`) with `ids` = `_collectOrderUnitIds()`:
/// every listed unit whose order is `AttackMove` gets no order and leaves the
/// queue. The caller then refreshes the arrows.
pub fn cancel_attack_move_selected(
    roster: &mut [OrderUnit],
    ids: &[String],
    queued: &mut QueuedOrders,
) {
    for id in ids {
        let Some(u) = find_mut(roster, id) else {
            continue;
        };
        if !matches!(u.order, PlayerOrder::AttackMove { .. }) {
            continue;
        }
        u.order = PlayerOrder::None;
        queued.delete(id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn queued_orders_follow_js_set() {
        let mut q = QueuedOrders::from_ids(["b", "a", "b", "c"]);
        assert_eq!(q.ids(), ["b", "a", "c"]);
        q.add("a");
        assert_eq!(q.ids(), ["b", "a", "c"]);
        assert!(q.delete("a"));
        assert!(!q.delete("a"));
        q.add("a");
        assert_eq!(q.ids(), ["b", "c", "a"]);
        assert_eq!(q.len(), 3);
        q.clear();
        assert!(q.is_empty() && !q.has("b"));
    }

    fn cand(id: &str, flags: [bool; 4]) -> TurnCandidate {
        TurnCandidate {
            id: id.into(),
            dead: flags[0],
            fading_out: flags[1],
            removed: flags[2],
            acted: flags[3],
        }
    }

    #[test]
    fn next_activation_each_skip_flag_and_bounds() {
        // N-1 / N / N+1 around the end of the order, every skip flag alone.
        let order = vec![
            cand("d", [true, false, false, false]),
            cand("f", [false, true, false, false]),
            cand("r", [false, false, true, false]),
            cand("a", [false, false, false, true]),
            cand("ok", [false; 4]),
        ];
        for (start, want_unit, want_idx) in [
            (0usize, Some(4usize), 5usize),
            (4, Some(4), 5),
            (5, None, 5),
            (6, None, 6),
        ] {
            let mut q = QueuedOrders::from_ids(["d", "f", "r", "a", "ok"]);
            let mut idx = start;
            let n = next_activation(&order, &mut idx, true, &mut q);
            assert_eq!((n.unit, idx), (want_unit, want_idx), "start {start}");
            assert_eq!(n.refresh, start == 0, "start {start}");
            assert!(q.has("ok"));
            assert_eq!(q.len(), if start == 0 { 1 } else { 5 });
        }
        let mut q = QueuedOrders::from_ids(["d"]);
        let mut idx = 0;
        let n = next_activation(&order, &mut idx, false, &mut q);
        assert!(!n.refresh && q.has("d") && n.unit == Some(4));
        assert!(!consume_on_activation(false, &mut q, "d"));
        assert!(consume_on_activation(true, &mut q, "d"));
        assert!(!consume_on_activation(true, &mut q, "d"));
    }
}
