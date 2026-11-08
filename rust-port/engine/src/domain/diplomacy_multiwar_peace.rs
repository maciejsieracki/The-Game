//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 3): port 1:1 z webem (pin `origin/main` a61337844):
//! - `gra/src/game/diplomacy-ai-forced-peace.ts:127` `planPeacePayment` (plan zapłaty przegranego za pokój),
//! - `gra/src/game/war-weariness.ts:121` `planEscalatedPeacePayment` (eskalacja: dodatkowe miasta),
//! - `gra/src/game/war-weariness.ts:163` `stepPairState` (stan pary: szczyt zmęczenia, stopień, reset przy nowej wojnie).
//!
//! Parametry: brak (funkcje czyste). Liczby w semantyce JS: `Math.ceil/max/min` propagują NaN (`js_max`, `js_min`
//! z `diplomacy_multiwar`); porównanie `a.pn - b.pn` przy NaN/Infinity daje NaN -> fallback na porządek po id
//! (jak `||` w JS). Sortowanie stabilne (jak `Array.prototype.sort` w V8 dla danych <= 10 elementów; wektory
//! nie przekraczają tego zakresu, zob. `tests/p6_dyplo_multiwar_gates_data/peace.json`).

use super::diplomacy_multiwar::{js_max, js_min};
use std::cmp::Ordering;
use std::collections::HashMap;

/// Web `PeaceAssetKind` (diplomacy-ai-forced-peace.ts:99).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PeaceAssetKind {
    Zloto,
    SurowiecIlosc,
    Miasto,
}

/// Web `PeaceAsset` (diplomacy-ai-forced-peace.ts:102). `forbidden` = web `forbidden?: boolean` (brak = false).
#[derive(Debug, Clone, PartialEq)]
pub struct PeaceAsset {
    pub kind: PeaceAssetKind,
    pub id: String,
    pub amount: f64,
    pub pn: f64,
    pub forbidden: bool,
}

/// Histogram pozycji planu (web `histogram`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct PeaceHistogram {
    pub zloto: i64,
    pub surowiec_ilosc: i64,
    pub miasto: i64,
}

/// Web `PeacePaymentPlan` (diplomacy-ai-forced-peace.ts:115).
#[derive(Debug, Clone, PartialEq)]
pub struct PeacePaymentPlan {
    pub items: Vec<PeaceAsset>,
    pub covered_pn: f64,
    pub shortfall_pn: f64,
    pub full: bool,
    pub histogram: PeaceHistogram,
}

/// Web `byId` (porządek po id, `<` na stringach).
/// Web `byId`: porównanie `<`/`>` na stringach JS = jednostki UTF-16 (nie bajty UTF-8).
fn by_id(a: &PeaceAsset, b: &PeaceAsset) -> Ordering {
    a.id.encode_utf16().cmp(b.id.encode_utf16())
}

/// Web `(a, b) => b.pn - a.pn || byId(a, b)` — gdy różnica NaN lub 0, rozstrzyga id.
fn by_pn_desc(a: &PeaceAsset, b: &PeaceAsset) -> Ordering {
    let d = b.pn - a.pn;
    if d.is_nan() || d == 0.0 {
        by_id(a, b)
    } else if d < 0.0 {
        Ordering::Less
    } else {
        Ordering::Greater
    }
}

/// Web `(a, b) => a.pn - b.pn || byId(a, b)`.
fn by_pn_asc(a: &PeaceAsset, b: &PeaceAsset) -> Ordering {
    let d = a.pn - b.pn;
    if d.is_nan() || d == 0.0 {
        by_id(a, b)
    } else if d < 0.0 {
        Ordering::Less
    } else {
        Ordering::Greater
    }
}

fn histogram_of(items: &[PeaceAsset]) -> PeaceHistogram {
    let mut h = PeaceHistogram::default();
    for it in items {
        match it.kind {
            PeaceAssetKind::Zloto => h.zloto += 1,
            PeaceAssetKind::SurowiecIlosc => h.surowiec_ilosc += 1,
            PeaceAssetKind::Miasto => h.miasto += 1,
        }
    }
    h
}

/// Web `planPeacePayment(requiredPn, assets)` (diplomacy-ai-forced-peace.ts:127).
/// Kolejność: złoto (pierwsze z amount>0 i pn>0), potem surowce (jeśli pokrywają resztę, inaczej wszystkie),
/// w ostateczności JEDNO miasto (najtańsze pokrywające resztę, inaczej najcenniejsze).
pub fn plan_peace_payment(required_pn: f64, assets: &[PeaceAsset]) -> PeacePaymentPlan {
    let need0 = js_max(0.0, required_pn.ceil());
    let mut items: Vec<PeaceAsset> = Vec::new();
    let mut covered = 0.0_f64;

    let gold = assets
        .iter()
        .find(|a| a.kind == PeaceAssetKind::Zloto && a.amount > 0.0 && a.pn > 0.0);
    if let Some(gold) = gold {
        if need0 > 0.0 {
            let take_pn = js_min(gold.pn, need0);
            let take_amount = js_min(gold.amount, ((take_pn / gold.pn) * gold.amount).ceil());
            items.push(PeaceAsset {
                amount: take_amount,
                pn: take_pn,
                ..gold.clone()
            });
            covered += take_pn;
        }
    }
    let mut rem = need0 - covered;

    let mut res: Vec<&PeaceAsset> = assets
        .iter()
        .filter(|a| a.kind == PeaceAssetKind::SurowiecIlosc && a.amount > 0.0 && a.pn > 0.0)
        .collect();
    res.sort_by(|a, b| by_pn_desc(a, b));
    let res_total: f64 = res.iter().map(|a| a.pn).sum();
    let mut cities: Vec<&PeaceAsset> = assets
        .iter()
        .filter(|a| a.kind == PeaceAssetKind::Miasto && !a.forbidden && a.pn > 0.0)
        .collect();
    cities.sort_by(|a, b| by_pn_asc(a, b));

    if rem > 0.0 {
        if res_total >= rem {
            for r in &res {
                if rem <= 0.0 {
                    break;
                }
                items.push((*r).clone());
                covered += r.pn;
                rem -= r.pn;
            }
        } else {
            for r in &res {
                items.push((*r).clone());
                covered += r.pn;
            }
            rem -= res_total;
            if rem > 0.0 {
                if let Some(cover) = pick_cover(&cities, rem) {
                    items.push(cover.clone());
                    covered += cover.pn;
                }
            }
        }
    }

    let histogram = histogram_of(&items);
    PeacePaymentPlan {
        items,
        covered_pn: covered,
        shortfall_pn: js_max(0.0, need0 - covered),
        full: covered >= need0,
        histogram,
    }
}

/// Web `cities.find(c => c.pn >= rem) ?? cities[cities.length - 1]`.
fn pick_cover<'a>(cities: &[&'a PeaceAsset], rem: f64) -> Option<&'a PeaceAsset> {
    cities
        .iter()
        .copied()
        .find(|c| c.pn >= rem)
        .or_else(|| cities.last().copied())
}

/// Web `planEscalatedPeacePayment(requiredPn, assets, maxCities)` (war-weariness.ts:121).
/// Najpierw `planPeacePayment` bez miast; gdy nie pokrywa i `maxCities > 0`, dokłada miasta (najtańsze
/// pokrywające resztę, inaczej najcenniejsze), do `maxCities` sztuk. Miasta forbidden nigdy.
pub fn plan_escalated_peace_payment(
    required_pn: f64,
    assets: &[PeaceAsset],
    max_cities: f64,
) -> PeacePaymentPlan {
    let no_city: Vec<PeaceAsset> = assets
        .iter()
        .filter(|a| a.kind != PeaceAssetKind::Miasto)
        .cloned()
        .collect();
    let base = plan_peace_payment(required_pn, &no_city);
    if base.full || max_cities <= 0.0 {
        return base;
    }
    let mut items = base.items.clone();
    let mut covered = base.covered_pn;
    let need0 = js_max(0.0, required_pn.ceil());
    let mut rem = need0 - covered;
    let mut pool: Vec<&PeaceAsset> = assets
        .iter()
        .filter(|a| a.kind == PeaceAssetKind::Miasto && !a.forbidden && a.pn > 0.0)
        .collect();
    pool.sort_by(|a, b| by_pn_asc(a, b));

    let mut n = 0.0_f64;
    while n < max_cities && rem > 0.0 && !pool.is_empty() {
        let idx = pool
            .iter()
            .position(|c| c.pn >= rem)
            .unwrap_or(pool.len() - 1);
        let cover = pool.remove(idx);
        items.push(cover.clone());
        covered += cover.pn;
        rem -= cover.pn;
        n += 1.0;
    }
    let histogram = histogram_of(&items);
    PeacePaymentPlan {
        items,
        covered_pn: covered,
        shortfall_pn: js_max(0.0, need0 - covered),
        full: covered >= need0,
        histogram,
    }
}

/// Web `WarWearinessPairState` (war-weariness.ts:143). `last_offer_turn` = -1 gdy brak oferty.
#[derive(Debug, Clone, PartialEq)]
pub struct WarWearinessPairState {
    pub war_start: f64,
    pub peak: f64,
    pub stage: i64,
    pub rejected_offers: i64,
    pub last_offer_turn: f64,
}

/// Web `WarWearinessStore` = `Map<string, WarWearinessPairState>`.
pub type WarWearinessStore = HashMap<String, WarWearinessPairState>;

fn fresh_pair_state(war_start: f64) -> WarWearinessPairState {
    WarWearinessPairState {
        war_start,
        peak: 0.0,
        stage: 0,
        rejected_offers: 0,
        last_offer_turn: -1.0,
    }
}

/// Web `stepPairState(store, key, warStart, level)` (war-weariness.ts:163).
/// Zmiana `warStart` (także NaN, bo `===` z NaN jest fałszem) = nowa wojna = reset stanu.
/// `peak = Math.max(peak, level)` (NaN propaguje, jak w JS).
pub fn step_pair_state<'a>(
    store: &'a mut WarWearinessStore,
    key: &str,
    war_start: f64,
    level: f64,
) -> &'a mut WarWearinessPairState {
    let st = store
        .entry(key.to_string())
        .or_insert_with(|| fresh_pair_state(war_start));
    if st.war_start != war_start {
        *st = fresh_pair_state(war_start);
    }
    st.peak = js_max(st.peak, level);
    st
}
