//! R-RUSTPORT-REPIN-AI-ZAKUP-REZERWA-Q1: port `shouldAIPurchaseUnit` + `loadAiPurchaseReserveParams`
//! z `gra/src/game/ai.ts` (pin web `679ab078a`, linie 7207-7262 oraz `getAiParam` 208-212).
//!
//! web: gra/src/game/ai.ts:7207-7262 (`shouldAIPurchaseUnit`, `AiPurchaseReserveParams`,
//! `loadAiPurchaseReserveParams`), gra/src/game/ai.ts:208-212 (`getAiParam`).
//!
//! ZALOZENIA (adaptacja typow, logika 1:1 z webem):
//! - pola opcjonalne webu (`reserve`, `netIncomePerTurn`, `upkeepPerTurn`, `unitUpkeepPerTurn`)
//!   sa `Option`; brak ktoregokolwiek = zachowanie dawne (tylko cena + Manpower);
//! - liczby webu (JS `number`) sa tu `f64`; `Math.max(0, x)` = `x.max(0.0)` dla skonczonych wartosci;
//! - parametry ladowane z `AiParams` (`data/ai-params.json`), wartosci `wartosc` zrzutowane na f64;
//!   fallbacki webu (`10/3/0` i `0/0/-2`) nie sa potrzebne: klucze sa obowiazkowe w strukturze.

use crate::data::economy_society_part2::AiParams;

/// Web `AiPurchaseReserveParams`: progi rezerwy utrzymania zakupu jednostki przez AI.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiPurchaseReserveParams {
    /// Tury utrzymania, ktore skarbiec musi pokryc PO zakupie (>= 0).
    pub rezerwa_tur: f64,
    /// Minimalny dochod netto zlota/ture PO zakupie (moze byc ujemny).
    pub min_dochod_netto: f64,
}

/// Web argument `inp` funkcji `shouldAIPurchaseUnit`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiPurchaseInput {
    pub treasury: f64,
    pub gold_cost: f64,
    pub has_manpower: bool,
    pub reserve: Option<AiPurchaseReserveParams>,
    /// Dochod netto zlota/ture PRZED zakupem.
    pub net_income_per_turn: Option<f64>,
    /// Lacznie utrzymanie zlota/ture PRZED zakupem (wojsko + budynki).
    pub upkeep_per_turn: Option<f64>,
    /// Utrzymanie zlota/ture dokupowanej jednostki.
    pub unit_upkeep_per_turn: Option<f64>,
}

/// Web `shouldAIPurchaseUnit(inp)` (ai.ts:7207-7242), 1:1.
pub fn should_ai_purchase_unit(inp: &AiPurchaseInput) -> bool {
    if !inp.has_manpower || inp.treasury < inp.gold_cost {
        return false;
    }
    let (Some(r), Some(net), Some(upkeep), Some(unit_upkeep)) = (
        inp.reserve,
        inp.net_income_per_turn,
        inp.upkeep_per_turn,
        inp.unit_upkeep_per_turn,
    ) else {
        return true;
    };
    let unit_upkeep = unit_upkeep.max(0.0);
    let net_after = net - unit_upkeep;
    if net_after < r.min_dochod_netto {
        return false;
    }
    let upkeep_after = upkeep.max(0.0) + unit_upkeep;
    inp.treasury - inp.gold_cost >= r.rezerwa_tur * upkeep_after
}

/// Web `loadAiPurchaseReserveParams(data, poziom)` (ai.ts:7252-7262): odczyt progow poziomu 1/2/3.
/// Web `rezerwaTur` = `Math.max(0, ...)`; `minDochodNetto` bez clampu.
pub fn load_ai_purchase_reserve_params(params: &AiParams, poziom: u8) -> AiPurchaseReserveParams {
    let (rezerwa, min_dochod) = match poziom {
        1 => (
            params.kupno_jednostki_rezerwa_tur_poziom1.wartosc,
            params.kupno_jednostki_min_dochod_netto_poziom1.wartosc,
        ),
        2 => (
            params.kupno_jednostki_rezerwa_tur_poziom2.wartosc,
            params.kupno_jednostki_min_dochod_netto_poziom2.wartosc,
        ),
        3 => (
            params.kupno_jednostki_rezerwa_tur_poziom3.wartosc,
            params.kupno_jednostki_min_dochod_netto_poziom3.wartosc,
        ),
        other => panic!("poziom trudnosci AI poza 1..=3: {other}"),
    };
    AiPurchaseReserveParams {
        rezerwa_tur: (rezerwa as f64).max(0.0),
        min_dochod_netto: min_dochod as f64,
    }
}
