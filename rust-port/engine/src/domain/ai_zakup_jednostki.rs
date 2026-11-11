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

// ---------------------------------------------------------------------------
// R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1 (runda 3, A): wykonanie zakupu AI na REALNYM stanie.
//
// web: gra/src/main.ts:42441-42456 (AI: `shouldAIPurchaseUnit` -> `purchaseRecruitmentUnit`) oraz
// gra/src/main.ts:4579-4760 (`purchaseRecruitmentUnit`, wspolna sciezka gracz/AI: bramka zlota i Manpower,
// potem `pickUnitRecruitHint` = `canAffordUnitRecruitStock` na puli panstwa, dopiero potem pobranie
// Manpower, zlota i surowcow). `canAffordUnitRecruitStock` (economy-upkeep.ts) = `canAffordBuildingStock`
// na `unitStockCost` (building-stock-cost.ts:402); brakujace ilosci = `missingStockFor` (:101).
//
// ZALOZENIA:
// - funkcja jest CZYSTA na przekazanym stanie panstwa (`AiPurchaseState`): brak globalnego stanu, brak
//   "magicznych" zasobow - kupno sprawdza i pobiera WYLACZNIE z `state.stock` (pula panstwa, suma po miastach);
// - Manpower to skalar imperium (`manpower` >= `manpower_cost`); wybor miasta/rozkladu po miastach i kolejka
//   rekrutacji (enqueue) pozostaja po stronie wywolujacego (WIRE-WAR W4/D7);
// - bramki poza ekonomia (oblezenie, limit stosu, Super-jednostka, Naval) nie naleza do tej funkcji
//   (web sprawdza je w `purchaseRecruitmentUnit` przed ekonomia; Rust: wywolujacy);
// - wiazanie w `ai_turn.rs`: NIE w tej rundzie - brak kroku rekrutacji w petli tury i brak nosiciela stanu
//   magazynu panstwa w `ai_turn.rs` (jawny dlug do W4/D7, nie BLOCK).

use std::collections::BTreeMap;

use crate::domain::ai_resource_needs::{
    detect_owner_resource_needs, GoodsEntry, OwnerResourceNeedState, OwnerResourceNeedsInput,
};
use crate::domain::recruitment::{
    spend_recruitment, validate_recruitment, RecruitmentError, ResourceStock, UnitRecruitment,
};

/// Realny stan ekonomii panstwa uzywany przy zakupie (pula panstwa jak u gracza).
#[derive(Debug, Clone, PartialEq)]
pub struct AiPurchaseState {
    pub treasury: f64,
    /// Magazyn panstwa (suma po miastach): jedyne zrodlo surowcow kosztu.
    pub stock: ResourceStock,
    /// Rekruci (Manpower) imperium.
    pub manpower: f64,
}

/// Parametry zakupu poza stanem: koszt Manpower i wejscie rezerwy utrzymania (web `aiPurchaseReserveInputs`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiPurchaseParams {
    pub manpower_cost: f64,
    pub reserve: Option<AiPurchaseReserveParams>,
    pub net_income_per_turn: Option<f64>,
    pub upkeep_per_turn: Option<f64>,
    pub unit_upkeep_per_turn: Option<f64>,
}

/// Dlaczego AI NIE kupilo (stan niezmieniony).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AiPurchaseDecline {
    /// `should_ai_purchase_unit` = false: za malo zlota, brak Manpower albo rezerwa utrzymania (10/3/0).
    Gate,
    /// Magazyn panstwa nie pokrywa kosztu surowcowego; mapa = web `missingStockFor` (ile brakuje).
    MissingStock(BTreeMap<String, u32>),
}

/// Wynik proby zakupu.
#[derive(Debug, Clone, PartialEq)]
pub enum AiPurchaseOutcome {
    Purchased {
        gold_spent: f64,
        manpower_spent: f64,
        stock_spent: ResourceStock,
    },
    Declined(AiPurchaseDecline),
}

/// Web `missingStockFor(pool, cost)`: ile brakuje dla kazdego surowca kosztu (tylko > 0).
pub fn missing_stock_for(pool: &ResourceStock, unit: &UnitRecruitment) -> BTreeMap<String, u32> {
    unit.stock_cost
        .iter()
        .filter_map(|(k, need)| {
            let have = pool.get(k).copied().unwrap_or_default();
            (*need > have).then(|| (k.clone(), need - have))
        })
        .collect()
}

/// Zakup jednostki przez AI na realnym stanie: `should_ai_purchase_unit` (zloto + Manpower + rezerwa) ->
/// `validate_recruitment` (koszt surowcowy z magazynu panstwa) -> `spend_recruitment` (atomowo). Przy
/// odmowie `state` pozostaje NIEZMIENIONY (web: sprawdzenie przed jakimkolwiek pobraniem).
pub fn ai_try_purchase_unit(
    state: &mut AiPurchaseState,
    unit: &UnitRecruitment,
    params: &AiPurchaseParams,
) -> AiPurchaseOutcome {
    let gold = f64::from(unit.gold_cost);
    let gate = AiPurchaseInput {
        treasury: state.treasury,
        gold_cost: gold,
        has_manpower: state.manpower >= params.manpower_cost,
        reserve: params.reserve,
        net_income_per_turn: params.net_income_per_turn,
        upkeep_per_turn: params.upkeep_per_turn,
        unit_upkeep_per_turn: params.unit_upkeep_per_turn,
    };
    if !should_ai_purchase_unit(&gate) {
        return AiPurchaseOutcome::Declined(AiPurchaseDecline::Gate);
    }
    if let Err(RecruitmentError::InsufficientStock { .. }) =
        validate_recruitment(&state.stock, unit)
    {
        return AiPurchaseOutcome::Declined(AiPurchaseDecline::MissingStock(missing_stock_for(
            &state.stock,
            unit,
        )));
    }
    let spent = spend_recruitment(&state.stock, unit)
        .expect("validate_recruitment przeszlo, spend nie padnie");
    state.stock = spent.remaining_stock;
    state.treasury -= gold;
    state.manpower -= params.manpower_cost;
    AiPurchaseOutcome::Purchased {
        gold_spent: gold,
        manpower_spent: params.manpower_cost,
        stock_spent: unit.stock_cost.clone(),
    }
}

/// Potrzeby surowcowe wlasciciela po (nieudanym) zakupie: jednostka traktowana jak oczekujaca w kolejce
/// (web `queuedUnitTypeIds` + `lookupUnitStockCost`), magazyn = realny stan panstwa. To wejscie dla handlu
/// (web main.ts:22820), nie dla bramki zakupu.
pub fn ai_purchase_resource_needs(
    state: &AiPurchaseState,
    unit: &UnitRecruitment,
    priced_keys: &[String],
    pakiet_wielkosc: f64,
) -> OwnerResourceNeedState {
    let goods: Vec<GoodsEntry> = state
        .stock
        .iter()
        .map(|(k, v)| GoodsEntry {
            key: k.clone(),
            ilosc: Some(f64::from(*v)),
        })
        .collect();
    let unit_cost: Vec<(String, f64)> = unit
        .stock_cost
        .iter()
        .map(|(k, v)| (k.clone(), f64::from(*v)))
        .collect();
    let queued = vec![unit.unit_id.clone()];
    let no_building = |_: &str| None;
    let lookup_unit = |_: &str| Some(unit_cost.clone());
    detect_owner_resource_needs(&OwnerResourceNeedsInput {
        goods: &goods,
        priced_keys,
        pakiet_wielkosc,
        queued_building_ids: &[],
        lookup_building_koszt_surowce: &no_building,
        queued_unit_type_ids: &queued,
        lookup_unit_stock_cost: &lookup_unit,
        food_reserve: None,
        food_urgent_threshold: None,
        upkeep_demand: &[],
    })
}
