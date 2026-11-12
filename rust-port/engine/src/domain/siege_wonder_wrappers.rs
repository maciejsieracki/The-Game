//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q9-Q1: wrappery `beginWonderTransferWatch` / `settleWonderTransfer`
//! z pinu webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75, `gra/src/main.ts` (linie 4232 i 4240).
//!
//! Port 1:1 jako funkcje czyste. Stan gry zastapiony jawnymi wejsciami:
//! * `wonders` - lista cudow (`placedWorldWonders`), `settle` mutuje ja (jak TS `applyWonderTransfers`);
//! * `nodes` - wynik `buildAllTerritoryNodes()` (miasta + forty/posterunki);
//! * `territory_owner_at` - wstrzykniety odpowiednik `territoryOwnerAt(q, r, nodes)` (port terytorium NIE jest
//!   w tym klocku; wolajacy podaje implementacje, wektory uzywaja deterministycznego stubu z generatora);
//! * `turn`, `me_owner_id` (`isMe(x)` = `x === ME()`), `name_of` (`getWonderById(id)?.nazwa`).
//!
//! Efekty UI (`showWonderCompletedNoticeDeferred`, `focusCameraOnWonder`, `syncWonderRender`,
//! `refreshWondersPickerIfOpen`, `markCityStateDirty`, `console.log`) NIE sa wykonywane: wyjscie to jawna lista
//! zdarzen ([`WonderTransferEvent`]) i jawna lista wolan UI ([`SettleOutcome::ui_calls`]) w tej samej kolejnosci,
//! w jakiej TS je wykonuje. Wywolanie zwrotne `onShowOnMap` jest zakodowane jako `show_on_map_wonder_id`.
//!
//! Wektory: `tests/p6_siege_wonder_wrappers_vectors/vectors.json`, generator `tests/p6_siege_wonder_wrappers_gen.mjs`
//! (wycina obie funkcje z pinu `main.ts`, wykonuje w node, strazy SHA-256 fragmentow).

use crate::domain::siege_wonder_watch::{
    apply_wonder_transfers, plan_wonder_transfers, snapshot_wonder_territory_owners,
    TransferableWonder, WonderTerritorySnapshot, WonderTransfer,
};

/// Wezel terytorium (podzbior `TerritoryNode`: pola czytane przez wrappery i stub `territoryOwnerAt`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WonderTerritoryNode {
    pub q: i32,
    pub r: i32,
    pub radius: i32,
    pub owner_id: i32,
    pub is_fort: bool,
    pub is_outpost: bool,
}

/// Odpowiednik `excludeNewCity` (`City`: pola q, r, ownerId; wezel miasta = nie fort, nie posterunek).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ExcludedCity {
    pub q: i32,
    pub r: i32,
    pub owner_id: i32,
}

/// Web `beginWonderTransferWatch(excludeNewCity?)`.
/// Zwraca `None` (TS `null`) gdy brak cudow; inaczej migawke PRZED zdarzeniem.
pub fn begin_wonder_transfer_watch(
    wonders: &[TransferableWonder],
    nodes: &[WonderTerritoryNode],
    exclude_new_city: Option<ExcludedCity>,
    territory_owner_at: impl Fn(i32, i32, &[WonderTerritoryNode]) -> Option<i32>,
) -> Option<WonderTerritorySnapshot> {
    if wonders.is_empty() {
        return None;
    }
    let filtered: Vec<WonderTerritoryNode> = match exclude_new_city {
        Some(c) => nodes
            .iter()
            .filter(|n| {
                !(n.q == c.q
                    && n.r == c.r
                    && n.owner_id == c.owner_id
                    && !n.is_fort
                    && !n.is_outpost)
            })
            .cloned()
            .collect(),
        None => nodes.to_vec(),
    };
    Some(snapshot_wonder_territory_owners(wonders, |q, r| {
        territory_owner_at(q, r, &filtered)
    }))
}

/// Efekt zdarzenia dla gracza (TS `showWonderCompletedNoticeDeferred`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WonderNotice {
    /// `"mine"` (przejecie przez gracza) albo `"rival"` (utrata przez gracza).
    pub variant: &'static str,
    pub nazwa: String,
    pub location_label: String,
    pub body_html: &'static str,
    /// `Some(wonderId)` tylko dla wariantu `mine` (TS `onShowOnMap: () => focusCameraOnWonder(...)`).
    pub show_on_map_wonder_id: Option<String>,
}

/// Jedno przeniesienie z planu wraz z efektami (log + ewentualne powiadomienie).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WonderTransferEvent {
    pub transfer: WonderTransfer,
    /// Dokladna linia `console.log` z TS.
    pub log_line: String,
    pub notice: Option<WonderNotice>,
}

/// Wynik `settleWonderTransfer`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct SettleOutcome {
    /// Zwracana wartosc TS (liczba faktycznie zastosowanych przeniesien).
    pub transferred: usize,
    /// Zdarzenia dla KAZDEGO wpisu planu (takze gdy `apply` pominal wpis).
    pub events: Vec<WonderTransferEvent>,
    /// Wolania UI w kolejnosci TS; niepuste tylko gdy plan niepusty.
    pub ui_calls: Vec<&'static str>,
}

/// Web `settleWonderTransfer(before)`.
/// Wczesne wyjscia (bez efektow): `before == None`, brak cudow, pusty plan.
pub fn settle_wonder_transfer(
    before: Option<&WonderTerritorySnapshot>,
    wonders: &mut [TransferableWonder],
    nodes: &[WonderTerritoryNode],
    territory_owner_at: impl Fn(i32, i32, &[WonderTerritoryNode]) -> Option<i32>,
    turn: i32,
    me_owner_id: i32,
    name_of: impl Fn(&str) -> Option<String>,
) -> SettleOutcome {
    let Some(before) = before else {
        return SettleOutcome::default();
    };
    if wonders.is_empty() {
        return SettleOutcome::default();
    }
    let after = snapshot_wonder_territory_owners(wonders, |q, r| territory_owner_at(q, r, nodes));
    let plan = plan_wonder_transfers(wonders, before, &after);
    if plan.is_empty() {
        return SettleOutcome::default();
    }
    let transferred = apply_wonder_transfers(wonders, &plan);
    let events = plan
        .into_iter()
        .map(|t| {
            let label = name_of(&t.wonder_id).unwrap_or_else(|| t.wonder_id.clone());
            let log_line = format!(
                "[Cuda] Tura {}: {} @ {},{} przechodzi {}\u{2192}{} (zdobycie terytorium)",
                turn, label, t.q, t.r, t.from_owner_id, t.to_owner_id
            );
            let location_label = format!("Tura {} \u{00b7} {},{}", turn, t.q, t.r);
            let notice = if t.to_owner_id == me_owner_id {
                Some(WonderNotice {
                    variant: "mine",
                    nazwa: format!("Zdobyto cud: {}", label),
                    location_label,
                    body_html: "Przej\u{0119}li\u{015b}my cud wraz z jego bonusami.",
                    show_on_map_wonder_id: Some(t.wonder_id.clone()),
                })
            } else if t.from_owner_id == me_owner_id {
                Some(WonderNotice {
                    variant: "rival",
                    nazwa: format!("Utracono cud: {}", label),
                    location_label,
                    body_html: "Cud wraz z bonusami przeszed\u{0142} w r\u{0119}ce zdobywcy.",
                    show_on_map_wonder_id: None,
                })
            } else {
                None
            };
            WonderTransferEvent {
                transfer: t,
                log_line,
                notice,
            }
        })
        .collect();
    SettleOutcome {
        transferred,
        events,
        ui_calls: vec![
            "syncWonderRender",
            "refreshWondersPickerIfOpen",
            "markCityStateDirty",
        ],
    }
}
