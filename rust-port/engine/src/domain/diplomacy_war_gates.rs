//! R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1: port `gra/src/game/diplomacy-war-gates.ts` (pin `4bbef081d`).
//!
//! web: gra/src/game/diplomacy-war-gates.ts:11 (`PEACE_CURRENCY_ACTION_IDS`), :14 (`isPeaceCurrencyAction`),
//! :19 (`isNapBlockingWarDeclaration`), :23 (`basketHasCurrencyPayment`, prywatna), :28 (`CurrencyPayloadSlice`),
//! :36 (`payloadHasCurrencyPayment`), :48 (`isCurrencyProposalForbiddenDuringWar`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - `actionId: string` = `&str` (web nie ma enumu akcji; `rozejm` jest zwyklym lancuchem). Rust
//!   `ProposalAction` (diplomacy.rs:2653) NIE MA wariantu `rozejm`, wiec nie da sie go uzyc 1:1.
//! - `number | undefined` = `Option<f64>` (`undefined` i `null` = `None`; `NaN`/`Infinity` zachowane).
//!   `(x ?? 0) > 0` zapisane jako `x.unwrap_or(0.0) > 0.0` (NaN > 0 = false, Infinity > 0 = true).
//! - `BasketItem` zredukowany do pola `typ` (`String`): to jedyne pole czytane przez bramke.
//! - `atWar = true` (domyslny parametr) = `Option<bool>`: `None` (undefined) -> `true`.
//!
//! DUPLIKAT: `diplomacy.rs:2708` (`payload_has_currency_payment`) i `:2726`
//! (`is_currency_proposal_forbidden_during_war`) NIE sa rownowazne z pinem: (1) Rust wymaga
//! `is_finite()` dla `goldOnce`/`goldPerTurn` (web: `Infinity > 0` = true), (2) Rust wymaga
//! `quantity > 0` i skonczonego dla pozycji zloto/praca (web: dowolna ilosc, takze 0/NaN/brak),
//! (3) Rust nie zna akcji `rozejm` (web od `diplomacy-war-gates.ts:11` zezwala na walute w rozejmie).
//! `diplomacy.rs` jest poza allowlista (bez edycji), wiec istniejaca funkcja zostaje dla swoich
//! wywolan (`diplomacy.rs:3182`), a ta jest wersja wierna pinowi; rozbieznosc zmierzona testem
//! `war_gates_existing_rust_gate_diverges_from_pin` (DLUG: temat `POKOJ-ROZEJM-CESJA` przepina
//! `evaluate_proposal` na te wersje).

use serde::{Deserialize, Serialize};

/// Web: `PEACE_CURRENCY_ACTION_IDS` (:11), `new Set(['pokoj', 'rozejm', 'trybut_oferta'])`.
pub const PEACE_CURRENCY_ACTION_IDS: [&str; 3] = ["pokoj", "rozejm", "trybut_oferta"];

/// Web: `isPeaceCurrencyAction` (:14).
pub fn is_peace_currency_action(action_id: &str) -> bool {
    PEACE_CURRENCY_ACTION_IDS.contains(&action_id)
}

/// Web: `isNapBlockingWarDeclaration` (:19). Tozsamosc na fladze aktywnego NAP.
pub fn is_nap_blocking_war_declaration(has_active_nap_treaty: bool) -> bool {
    has_active_nap_treaty
}

/// Web: `BasketItem` (diplomacy-pn-engine.ts:116), tylko pole `typ` czytane przez bramke.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CurrencyBasketItem {
    pub typ: String,
}

/// Web: `CurrencyPayloadSlice` (:28). Wszystkie pola opcjonalne.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct CurrencyPayloadSlice {
    pub gold_once: Option<f64>,
    pub gold_per_turn: Option<f64>,
    pub give_items: Option<Vec<CurrencyBasketItem>>,
    pub receive_items: Option<Vec<CurrencyBasketItem>>,
}

/// Web: `basketHasCurrencyPayment` (:23). `!items?.length` -> brak/pusty = false.
fn basket_has_currency_payment(items: Option<&Vec<CurrencyBasketItem>>) -> bool {
    match items {
        None => false,
        Some(v) if v.is_empty() => false,
        Some(v) => v.iter().any(|i| i.typ == "zloto" || i.typ == "praca"),
    }
}

/// Web: `payloadHasCurrencyPayment` (:36). `None` = `undefined` payload.
pub fn payload_has_currency_payment(payload: Option<&CurrencyPayloadSlice>) -> bool {
    let Some(p) = payload else {
        return false;
    };
    if p.gold_once.unwrap_or(0.0) > 0.0 {
        return true;
    }
    if p.gold_per_turn.unwrap_or(0.0) > 0.0 {
        return true;
    }
    basket_has_currency_payment(p.give_items.as_ref())
        || basket_has_currency_payment(p.receive_items.as_ref())
}

/// Web: `isCurrencyProposalForbiddenDuringWar` (:48). `at_war: None` = domyslne `true`.
pub fn is_currency_proposal_forbidden_during_war(
    action_id: &str,
    payload: Option<&CurrencyPayloadSlice>,
    at_war: Option<bool>,
) -> bool {
    if !at_war.unwrap_or(true) {
        return false;
    }
    if !payload_has_currency_payment(payload) {
        return false;
    }
    !is_peace_currency_action(action_id)
}
