//! P6.8J-P2 (partia 2 z N) - port `gra/src/game/society-breakdown.ts` (web pin 91dc998a):
//! model PorPct (Porzadek = wazone Szczescie + Prawo), pasma i efekty (`porPctBand`,
//! `tierFromPorPct`, `orderEffectsFromPorPct`), rozbicie wkladu (`orderContributionPct`),
//! `computeOrderPctBreakdown`, `evaluateOrderFromBreakdown`, modyfikator macierzy cywilizacji
//! (`applyCivMatrixHappinessModifier`) oraz laska buntu (`updateRevoltGrace`,
//! `revoltWarningMessage`).
//!
//! Progi pasm i tierow, mnozniki pasma Napiecie oraz kara Buntu skrajnego sa LITERALAMI WEB
//! (`society-breakdown.ts`, nie JSON) i sa tu nazwane stalymi z numerem linii.

use serde_json::Value;

use super::*;
use crate::domain::types::porzadek::{
    load_order_params, order_effects, OrderEffects, OrderParams, OrderTier,
};
use crate::domain::types::Difficulty;

/// Web `PorPctBand` (`society-breakdown.ts:43`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PorPctBand {
    Lad,
    Spokoj,
    Napiecie,
    Niepokoj,
    Bunt,
    BuntSkrajny,
}

impl PorPctBand {
    /// Web `POR_BAND_LABELS` (`society-breakdown.ts:922`).
    pub const fn label(self) -> &'static str {
        match self {
            Self::Lad => "Ład",
            Self::Spokoj => "Spokój",
            Self::Napiecie => "Napięcie",
            Self::Niepokoj => "Niepokój",
            Self::Bunt => "Bunt",
            Self::BuntSkrajny => "Bunt skrajny",
        }
    }
}

/// Web `OrderPctBreakdown` (`society-breakdown.ts:51`).
#[derive(Debug, Clone, PartialEq)]
pub struct OrderPctBreakdown {
    pub sz: HappinessPctBreakdown,
    pub prawo: LawPctBreakdown,
    pub waga_sz: f64,
    pub waga_praw: f64,
    pub por_pct: f64,
    pub tier: OrderTier,
    pub band: PorPctBand,
    pub band_label: &'static str,
    pub effects: OrderEffects,
}

/// Web `OrderContributionPct` (`society-breakdown.ts`, `orderContributionPct`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OrderContributionPct {
    /// % wkladu Szczescia w wynik Porzadku lacznie (0-100).
    pub sz_wklad_pct: f64,
    /// % wkladu Prawa = `100 - sz_wklad_pct`.
    pub praw_wklad_pct: f64,
}

/// Web `RevoltGraceState` (`society-breakdown.ts:1113`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RevoltGraceState {
    pub revolt_grace_remaining: Option<f64>,
    pub revolt_warning: bool,
    pub should_trigger_rebellion: bool,
    pub grace_turns_left: Option<f64>,
}

/// Progi pasm PorPct (web `porPctBand`, `society-breakdown.ts:911-919`).
const POR_LAD_MIN: f64 = 90.0;
const POR_SPOKOJ_MIN: f64 = 70.0;
const POR_NAPIECIE_MIN: f64 = 50.0;
const POR_NIEPOKOJ_MIN: f64 = 30.0;
/// Progi tierow (web `tierFromPorPct`, `society-breakdown.ts:931-936`).
const TIER_ORDER_MIN: f64 = 90.0;
const TIER_NEUTRAL_MIN: f64 = 30.0;
/// Pasmo Napiecie (web `orderEffectsFromPorPct`, case `napiecie`): produkcja 0.95, reszta 1.
const NAPIECIE_PRODUKCJA_MULT: f64 = 0.95;
/// Pasmo Bunt skrajny (web case `bunt_skrajny`): -0.15 na cztery mnozniki, +0.03 ryzyka.
const BUNT_SKRAJNY_MULT_KARA: f64 = 0.15;
const BUNT_SKRAJNY_RYZYKO_DOD: f64 = 0.03;
/// Id i etykieta linii macierzy cywilizacji (web `applyCivMatrixHappinessModifier`).
const MATRYCA_LINE_ID: &str = "matryca_eko_zadowolenie";
const MATRYCA_LINE_LABEL: &str = "Modyfikator cywilizacji (macierz ekonomii)";

/// Web `Number.isFinite(x) ? x : 0`.
fn finite_or_zero(x: f64) -> f64 {
    if x.is_finite() {
        x
    } else {
        0.0
    }
}

/// Web `FALLBACK_REVOLT_PARAMS` (`society-breakdown.ts:201`).
pub fn fallback_revolt_params() -> RevoltParams {
    RevoltParams {
        critical_por_pct: REVOLT_CRITICAL_POR_PCT,
        grace_turns: REVOLT_GRACE_TURNS,
    }
}

/// Web `porPctBand` (`society-breakdown.ts:911`). NaN/Inf PorPct = 0; prog krytyczny
/// niefiniteczny = `REVOLT_CRITICAL_POR_PCT`.
pub fn por_pct_band(por_pct: f64, critical_por_pct: f64) -> PorPctBand {
    let p = finite_or_zero(por_pct);
    let crit = if critical_por_pct.is_finite() {
        critical_por_pct
    } else {
        REVOLT_CRITICAL_POR_PCT
    };
    if p >= POR_LAD_MIN {
        PorPctBand::Lad
    } else if p >= POR_SPOKOJ_MIN {
        PorPctBand::Spokoj
    } else if p >= POR_NAPIECIE_MIN {
        PorPctBand::Napiecie
    } else if p >= POR_NIEPOKOJ_MIN {
        PorPctBand::Niepokoj
    } else if p >= crit {
        PorPctBand::Bunt
    } else {
        PorPctBand::BuntSkrajny
    }
}

/// Web `tierFromPorPct` (`society-breakdown.ts:931`).
pub fn tier_from_por_pct(por_pct: f64) -> OrderTier {
    let p = finite_or_zero(por_pct);
    if p >= TIER_ORDER_MIN {
        OrderTier::Order
    } else if p >= TIER_NEUTRAL_MIN {
        OrderTier::Neutral
    } else {
        OrderTier::Unrest
    }
}

/// Web `orderEffectsFromPorPct` (`society-breakdown.ts:938`). Cap PorPct nie wchodzi tu.
pub fn order_effects_from_por_pct(
    por_pct: f64,
    params: &OrderParams,
    critical_por_pct: f64,
) -> OrderEffects {
    match por_pct_band(por_pct, critical_por_pct) {
        PorPctBand::Lad => order_effects(OrderTier::Order, params),
        PorPctBand::Spokoj => order_effects(OrderTier::Neutral, params),
        PorPctBand::Napiecie => OrderEffects {
            production_mult: NAPIECIE_PRODUKCJA_MULT,
            pieniadz_mult: 1.0,
            nauka_mult: 1.0,
            kultura_mult: 1.0,
            growth_mult: 1.0,
            trade_mult: 1.0,
            revolt_risk: 0.0,
        },
        PorPctBand::Niepokoj => order_effects(OrderTier::Unrest, params),
        PorPctBand::Bunt => OrderEffects {
            revolt_risk: params.ryzyko_buntu_t1,
            ..order_effects(OrderTier::Unrest, params)
        },
        PorPctBand::BuntSkrajny => {
            let base = order_effects(OrderTier::Unrest, params);
            OrderEffects {
                production_mult: js_max(0.0, base.production_mult - BUNT_SKRAJNY_MULT_KARA),
                pieniadz_mult: js_max(0.0, base.pieniadz_mult - BUNT_SKRAJNY_MULT_KARA),
                nauka_mult: js_max(0.0, base.nauka_mult - BUNT_SKRAJNY_MULT_KARA),
                kultura_mult: js_max(0.0, base.kultura_mult - BUNT_SKRAJNY_MULT_KARA),
                growth_mult: base.growth_mult,
                trade_mult: 1.0,
                revolt_risk: js_min(1.0, params.ryzyko_buntu_t1 + BUNT_SKRAJNY_RYZYKO_DOD),
            }
        }
    }
}

/// Web `computePorPct` (`society-breakdown.ts:990`): `clampPct(wagaSz*sz + wagaPraw*praw, cap)`,
/// cap z `params.por_pct_cap` (blok `szczescie`), a bez niego `SZ_PCT_CAP`.
pub fn compute_por_pct(sz_pct: f64, praw_pct: f64, params: &OrderParams) -> f64 {
    let cap = params
        .por_pct_cap
        .filter(|c| c.is_finite())
        .unwrap_or(SZ_PCT_CAP);
    clamp_pct(
        params.waga_szczescie * sz_pct + params.waga_prawo * praw_pct,
        cap,
    )
}

/// Web `orderContributionPct` (`society-breakdown.ts:1019`): udzial wazonej wartosci kazdego
/// paska w sumie wazonej; gdy suma <= 0, podzial wg wag; gdy i wagi <= 0, 50/50.
pub fn order_contribution_pct(
    sz_pct: f64,
    praw_pct: f64,
    waga_sz: f64,
    waga_praw: f64,
) -> OrderContributionPct {
    let w_sz = finite_or_zero(waga_sz);
    let w_praw = finite_or_zero(waga_praw);
    let weighted_sz = finite_or_zero(sz_pct) * w_sz;
    let weighted_praw = finite_or_zero(praw_pct) * w_praw;
    let total = weighted_sz + weighted_praw;
    let sz_wklad_pct = if total > 0.0 {
        js_round(weighted_sz / total * 100.0)
    } else {
        let w_sum = w_sz + w_praw;
        if w_sum > 0.0 {
            js_round(w_sz / w_sum * 100.0)
        } else {
            50.0
        }
    };
    OrderContributionPct {
        sz_wklad_pct,
        praw_wklad_pct: 100.0 - sz_wklad_pct,
    }
}

/// Web `computeOrderPctBreakdown` (`society-breakdown.ts:1039`).
pub fn compute_order_pct_breakdown(
    sz: HappinessPctBreakdown,
    prawo: LawPctBreakdown,
    params: &OrderParams,
    revolt: RevoltParams,
) -> OrderPctBreakdown {
    let por_pct = compute_por_pct(sz.sz_pct, prawo.praw_pct, params);
    let band = por_pct_band(por_pct, revolt.critical_por_pct);
    OrderPctBreakdown {
        waga_sz: params.waga_szczescie,
        waga_praw: params.waga_prawo,
        por_pct,
        tier: tier_from_por_pct(por_pct),
        band,
        band_label: band.label(),
        effects: order_effects_from_por_pct(por_pct, params, revolt.critical_por_pct),
        sz,
        prawo,
    }
}

/// Web `evaluateOrderFromBreakdown` (`society-breakdown.ts:1063`): jedno wejscie dla SILNIK.
pub fn evaluate_order_from_breakdown(
    happiness: &HappinessBreakdownInput,
    law: &LawBreakdownInput,
    society: Option<&Value>,
    difficulty: Difficulty,
) -> OrderPctBreakdown {
    let params = load_order_params(society, difficulty);
    let revolt = load_revolt_params(society, difficulty);
    let sz = compute_happiness_breakdown(happiness, society);
    let prawo = compute_law_breakdown(law, society);
    compute_order_pct_breakdown(sz, prawo, &params, revolt)
}

/// Web `applyCivMatrixHappinessModifier` (`society-breakdown.ts:1077`): `raw` NaN/Inf/0 -> bez
/// zmian; inaczej netto x (1+raw), linia macierzy gdy delta != 0, potem ponowne liczenie Porzadku.
pub fn apply_civ_matrix_happiness_modifier(
    order: &OrderPctBreakdown,
    raw: f64,
    society: Option<&Value>,
    difficulty: Difficulty,
) -> OrderPctBreakdown {
    if !raw.is_finite() || raw == 0.0 {
        return order.clone();
    }
    let scale = load_society_scale_params(society, difficulty);
    let max = if order.sz.sz_max > 0.0 {
        order.sz.sz_max
    } else {
        1.0
    };
    let netto = order.sz.netto * (1.0 + raw);
    let delta = netto - order.sz.netto;
    let mut lines = order.sz.lines.clone();
    if delta != 0.0 {
        lines.push(SocietyLine {
            id: MATRYCA_LINE_ID.into(),
            label: MATRYCA_LINE_LABEL.into(),
            value: delta,
        });
    }
    let sz = HappinessPctBreakdown {
        lines,
        netto,
        sz_max: order.sz.sz_max,
        sz_pct: pct_from_netto(netto, max, scale.sz_pct_cap),
    };
    compute_order_pct_breakdown(
        sz,
        order.prawo.clone(),
        &load_order_params(society, difficulty),
        load_revolt_params(society, difficulty),
    )
}

/// Web `updateRevoltGrace` (`society-breakdown.ts:1120`). `current_grace` = `None` odpowiada
/// `null`/`undefined` w webie; NaN traktowane jak zero (wyczerpana laska).
pub fn update_revolt_grace(
    current_grace: Option<f64>,
    por_pct: f64,
    revolt: RevoltParams,
) -> RevoltGraceState {
    if por_pct >= revolt.critical_por_pct {
        return RevoltGraceState {
            revolt_grace_remaining: None,
            revolt_warning: false,
            should_trigger_rebellion: false,
            grace_turns_left: None,
        };
    }
    let grace_turns = js_max(0.0, revolt.grace_turns.floor());
    match current_grace {
        None => RevoltGraceState {
            revolt_grace_remaining: Some(grace_turns),
            revolt_warning: true,
            should_trigger_rebellion: false,
            grace_turns_left: Some(grace_turns),
        },
        Some(grace) if grace > 0.0 => {
            let next = grace - 1.0;
            RevoltGraceState {
                revolt_grace_remaining: Some(next),
                revolt_warning: true,
                should_trigger_rebellion: false,
                grace_turns_left: Some(next),
            }
        }
        // grace === 0 - laska wyczerpana, nadal krytycznie.
        Some(_) => RevoltGraceState {
            revolt_grace_remaining: Some(0.0),
            revolt_warning: true,
            should_trigger_rebellion: true,
            grace_turns_left: Some(0.0),
        },
    }
}

/// Web `revoltWarningMessage` (`society-breakdown.ts:1164`).
pub fn revolt_warning_message(city_name: &str, grace_turns_left: Option<f64>) -> String {
    match grace_turns_left {
        // web: `=== null || <= 0`; NaN NIE jest <= 0, wiec idzie dalej (jak w JS).
        None => last_chance_message(city_name),
        Some(left) if left <= 0.0 => last_chance_message(city_name),
        Some(1.0) => format!(
            "KRYTYCZNE — grozi bunt w {city_name}! Ostatnia tura — obniż podatki lub wprowadź wojsko."
        ),
        Some(left) => format!(
            "KRYTYCZNE — grozi bunt w {city_name}! Masz {} tury na reakcję (podatki/Wealth lub garnizon).",
            js_num_str(left)
        ),
    }
}

fn last_chance_message(city_name: &str) -> String {
    format!(
        "KRYTYCZNE — ostatnia szansa w {city_name}! Grozi rebelia. Obniż podatki (Luksus) lub stacjonuj wojsko."
    )
}
