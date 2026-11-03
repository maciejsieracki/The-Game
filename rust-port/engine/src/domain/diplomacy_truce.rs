//! R-RUSTPORT-P6-DYPLOMACJA-TRUCE-AGRESOR-Q1: port `gra/src/game/diplomacy-peace-lock.ts` (pin `4bbef081d`)
//! oraz stanu pary `DiploPairMeta` w czesci rozejmu / blokady pokoju.
//!
//! web diplomacy-peace-lock.ts: :11 (`PEACE_TREATY_LOCK_TURNS`), :14 (`isPeaceTreatyLocked`),
//! :27 (`startPeaceTreatyLock`), :44 (`filterAllianceObligationsRespectingPeaceLock`),
//! :67 (`TRUCE_DURATION_OPTIONS`), :70 (`TRUCE_DEFAULT_TURNS`), :73 (`normalizeTruceDuration`),
//! :79 (`truceUntilTurn`), :86 (`isTruceActive`), :96 (`truceExpiryAction`), :105 (`isTruceBreach`).
//! web diplomacy-pn-engine.ts:69-103 (`DiploPairMeta`: `peaceUntilTurn` :89, `truceUntilTurn` :95,
//! `n3Window` :84); zapis: main.ts:33540 (`diplomacyPairMeta: Array.from(map.entries())`, pary `[klucz, meta]`).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Liczby z webu (`number`) = `f64`, zeby zachowac NaN / Infinity / porownania JS. `number | null | undefined`
//!   = `Option<f64>` (`None` = brak/`null`). `Math.max` / `Math.floor` z NaN: patrz `js_max_1_floor`.
//! - `DiploPairMeta` w `diplomacy.rs:1190` ma tylko 2 pola i jest `Copy`; bez edycji tego pliku powstaje
//!   NOWY serializowalny typ `PairMetaWeb` (camelCase jak zapis weba). Pola spoza zakresu tematu
//!   (np. `ostatniePrzewinienieWobecNas`, `wojnaStartTura`) przechodza przez `extra` (`#[serde(flatten)]`),
//!   co odtwarza spread `{...meta}` z `startPeaceTreatyLock` i brak utraty pol przy zapis/odczyt.
//! - Brak pola w JSON = `None` (web: `undefined` jest pomijane przez `JSON.stringify`); `null` w JSON czytany jak brak.
//!   NaN/Infinity serializuja sie jak w webie do `null` (`JSON.stringify(NaN)`).
//! - Domyslny parametr `lockTurns = PEACE_TREATY_LOCK_TURNS` dziala tylko dla `undefined`: `Option<f64>`.

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::domain::alliance_war_obligation::AllianceObligation;
use crate::domain::ids::PlayerId;

/// Web: `PEACE_TREATY_LOCK_TURNS` (:11).
pub const PEACE_TREATY_LOCK_TURNS: f64 = 10.0;
/// Web: `TRUCE_DURATION_OPTIONS` (:67).
pub const TRUCE_DURATION_OPTIONS: [f64; 3] = [5.0, 10.0, 15.0];
/// Web: `TRUCE_DEFAULT_TURNS` (:70).
pub const TRUCE_DEFAULT_TURNS: f64 = 10.0;

/// Web: `n3Window.typ` (diplomacy-pn-engine.ts:84).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum N3WindowKind {
    #[serde(rename = "bezterminowe")]
    Bezterminowe,
    #[serde(rename = "pokoj")]
    Pokoj,
}

/// Web: `n3Window` (diplomacy-pn-engine.ts:84).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct N3Window {
    pub turn: f64,
    pub typ: N3WindowKind,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub by_owner_id: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub charged: Option<bool>,
}

/// Web: `DiploPairMeta` (diplomacy-pn-engine.ts:69), pola rozejmu / pokoju / okna N3 + przechodnie reszta.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct PairMetaWeb {
    #[serde(default)]
    pub trust_pn_gained_this_turn: f64,
    #[serde(default)]
    pub dobra_wola_remaining_tur: f64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub wojna_od_tury: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub n1_zastosowany: Option<bool>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub n3_window: Option<N3Window>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub peace_until_turn: Option<f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub truce_until_turn: Option<f64>,
    /// Pola niewymienione wyzej (np. `ostatniePrzewinienieWobecNas`, `wojnaStartTura`) - bez zmian.
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

/// Web: `isPeaceTreatyLocked` (:14). `meta: None` = `undefined`.
pub fn is_peace_treaty_locked(meta: Option<&PairMetaWeb>, current_turn: f64) -> bool {
    let until = meta.and_then(|m| m.peace_until_turn);
    match until {
        Some(u) if u.is_finite() => current_turn < u,
        _ => false,
    }
}

/// `Math.max(1, Math.floor(x))` z propagacja NaN jak w JS (`Math.max(1, NaN)` = NaN).
fn js_max_1_floor(x: f64) -> f64 {
    let f = x.floor();
    if f.is_nan() {
        f64::NAN
    } else {
        f.max(1.0)
    }
}

/// Web: `startPeaceTreatyLock` (:27). `lock_turns: None` = domyslne `PEACE_TREATY_LOCK_TURNS`.
/// Zwraca kopie z `peaceUntilTurn` i `n3Window = { turn, typ: 'pokoj', charged: false }`.
pub fn start_peace_treaty_lock(
    meta: &PairMetaWeb,
    current_turn: f64,
    lock_turns: Option<f64>,
) -> PairMetaWeb {
    let turns = js_max_1_floor(lock_turns.unwrap_or(PEACE_TREATY_LOCK_TURNS));
    let mut out = meta.clone();
    out.peace_until_turn = Some(current_turn + turns);
    out.n3_window = Some(N3Window {
        turn: current_turn,
        typ: N3WindowKind::Pokoj,
        by_owner_id: None,
        charged: Some(false),
    });
    out
}

/// Web: `filterAllianceObligationsRespectingPeaceLock` (:44). Pomija sojusznikow z blokada wobec celu,
/// puste obowiazki odpadaja; kolejnosc zachowana.
pub fn filter_alliance_obligations_respecting_peace_lock(
    obligations: &[AllianceObligation],
    is_peace_locked: impl Fn(PlayerId, PlayerId) -> bool,
) -> Vec<AllianceObligation> {
    let mut out = Vec::new();
    for ob in obligations {
        let obligated_allies: Vec<PlayerId> = ob
            .obligated_allies
            .iter()
            .copied()
            .filter(|ally| !is_peace_locked(*ally, ob.must_declare_war_on))
            .collect();
        if obligated_allies.is_empty() {
            continue;
        }
        let mut next = ob.clone();
        next.obligated_allies = obligated_allies;
        out.push(next);
    }
    out
}

/// Web: `normalizeTruceDuration` (:73). Tylko 5 / 10 / 15, w przeciwnym razie `None`.
pub fn normalize_truce_duration(turns: Option<f64>) -> Option<f64> {
    let t = turns?;
    if !t.is_finite() {
        return None;
    }
    if TRUCE_DURATION_OPTIONS.contains(&t) {
        Some(t)
    } else {
        None
    }
}

/// Web: `truceUntilTurn` (:79). Tura, w ktorej rozejm przestaje obowiazywac (wylacznie).
pub fn truce_until_turn(start_turn: f64, duration_turns: f64) -> Option<f64> {
    let d = normalize_truce_duration(Some(duration_turns))?;
    if !start_turn.is_finite() {
        return None;
    }
    Some(start_turn + d)
}

/// Web: `isTruceActive` (:86). Wlacznie z tura zawarcia, wylacznie od `until`.
pub fn is_truce_active(until: Option<f64>, current_turn: f64) -> bool {
    match until {
        Some(u) if u.is_finite() => current_turn < u,
        _ => false,
    }
}

/// Web: `truceExpiryAction` (:96) - wartosci `'none'` | `'revert_to_war'`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TruceExpiryAction {
    #[serde(rename = "none")]
    None,
    #[serde(rename = "revert_to_war")]
    RevertToWar,
}

/// Web: `truceExpiryAction` (:96). Wygasniecie dokladnie w `until` (`currentTurn >= until`).
pub fn truce_expiry_action(until: Option<f64>, current_turn: f64) -> TruceExpiryAction {
    match until {
        Some(u) if u.is_finite() && current_turn >= u => TruceExpiryAction::RevertToWar,
        _ => TruceExpiryAction::None,
    }
}

/// Web: `isTruceBreach` (:105). Wypowiedzenie wojny w trakcie aktywnego rozejmu.
pub fn is_truce_breach(until: Option<f64>, current_turn: f64) -> bool {
    is_truce_active(until, current_turn)
}

/// Zapis pary w formacie weba (main.ts:33540): tablica `[klucz, meta]`. Odczyt toleruje stary zapis
/// (brak `truceUntilTurn` = `None`).
pub fn pair_meta_to_save(entries: &[(String, PairMetaWeb)]) -> Value {
    Value::Array(
        entries
            .iter()
            .map(|(k, m)| {
                Value::Array(vec![
                    Value::String(k.clone()),
                    serde_json::to_value(m).unwrap_or(Value::Null),
                ])
            })
            .collect(),
    )
}

/// Odczyt zapisu z `pair_meta_to_save`; pozycje o zlym ksztalcie sa pomijane.
pub fn pair_meta_from_save(raw: &Value) -> Vec<(String, PairMetaWeb)> {
    let Some(arr) = raw.as_array() else {
        return Vec::new();
    };
    arr.iter()
        .filter_map(|e| {
            let pair = e.as_array()?;
            let key = pair.first()?.as_str()?.to_string();
            let meta: PairMetaWeb = serde_json::from_value(pair.get(1)?.clone()).ok()?;
            Some((key, meta))
        })
        .collect()
}
