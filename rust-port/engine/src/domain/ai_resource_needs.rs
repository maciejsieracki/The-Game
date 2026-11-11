//! R-RUSTPORT-REPIN-AI-ZAKUP-REALNY-STAN-DROGI-Q1 (runda 2, partia (a)): port `detectOwnerResourceNeeds`
//! z `gra/src/game/ai-resource-needs.ts` (pin web origin/main f9c6300c6 / FALA 589-596).
//!
//! web: gra/src/game/ai-resource-needs.ts:93-172 (`detectOwnerResourceNeeds`),
//! :45-91 (`resourceKeysNeededForBuildingQueue` / `resourceKeysNeededForUnitQueue`),
//! gra/src/game/diplomacy-resource-trade-pick.ts:34-49 (`detectPricedResourceDeficits`).
//!
//! ZALOZENIA (adaptacja typow, logika 1:1 z webem):
//! - `goods` (web `TradeGoodEntry[]`) = `&[GoodsEntry]`; wyszukiwanie po kluczu bierze PIERWSZY wpis
//!   (jak `Array.prototype.find`); brak `ilosc` = 0;
//! - koszt budynku: web `buildingStockCost({koszt_surowce})` bez `epokaWejscia` = FALA2 x2 + zaokraglenie
//!   (`building_costs::p6_7b::building_stock_cost`); wejscie = surowy `koszt_surowce`;
//! - koszt jednostki: web `lookupUnitStockCost(id) ?? {}` - wejscie = gotowy rekord kosztu (Rust
//!   zostawia wybor zrodla danych wywolujacemu);
//! - kolejnosc kluczy `upkeepDemand` (obiekt JS = kolejnosc wstawiania) jest wejsciem `&[(String, f64)]`,
//!   zeby wywolujacy mogl odtworzyc kolejnosc webu;
//! - `needsResource` (web: obiekt `Record<string,boolean>`) = `BTreeMap` z kluczami ustawionymi na true.

use std::collections::BTreeMap;

use crate::domain::building_costs::p6_7b::scale_stock_cost_record;

/// Koszt budynku w kolejnosci wstawiania JS: surowy `koszt_surowce` (wartosci `None` = nie-liczba).
pub type BuildingKosztRecord = Vec<(String, Option<f64>)>;
/// Koszt jednostki w kolejnosci wstawiania JS.
pub type UnitKosztRecord = Vec<(String, f64)>;

/// Web `FOOD_URGENT_THRESHOLD` (domyslny prog zywnosci).
pub const FOOD_URGENT_THRESHOLD: f64 = 8.0;
const FOOD_KEY: &str = "zywnosc";

/// Web `TradeGoodEntry` ograniczony do pol uzywanych przez detekcje deficytu.
#[derive(Debug, Clone, PartialEq)]
pub struct GoodsEntry {
    pub key: String,
    /// Web `ilosc?` (brak = 0 w obliczeniach).
    pub ilosc: Option<f64>,
}

/// Web `OwnerResourceNeedState`.
#[derive(Debug, Clone, PartialEq)]
pub struct OwnerResourceNeedState {
    /// Web `needsResource`: klucze z flaga true (deficyt magazynu/kolejki/utrzymania/zywnosci).
    pub needs_resource: BTreeMap<String, bool>,
    /// Web `deficitKeys` (posortowane wg priorytetu handlu, bez duplikatow).
    pub deficit_keys: Vec<String>,
    /// Web `urgentKeys`.
    pub urgent_keys: Vec<String>,
}

/// Web `detectOwnerResourceNeeds(input)`. Parametry opcjonalne webu sa `Option`/puste.
pub struct OwnerResourceNeedsInput<'a> {
    pub goods: &'a [GoodsEntry],
    pub priced_keys: &'a [String],
    pub pakiet_wielkosc: f64,
    /// Web `queuedBuildingIds` + `lookupBuildingStockCost` (surowy `koszt_surowce`, `None` = brak).
    pub queued_building_ids: &'a [String],
    pub lookup_building_koszt_surowce: &'a dyn Fn(&str) -> Option<BuildingKosztRecord>,
    /// Web `queuedUnitTypeIds` + `lookupUnitStockCost`.
    pub queued_unit_type_ids: &'a [String],
    pub lookup_unit_stock_cost: &'a dyn Fn(&str) -> Option<UnitKosztRecord>,
    /// Web `foodReserve` (`None` = nie podano).
    pub food_reserve: Option<f64>,
    /// Web `foodUrgentThreshold` (`None` = `FOOD_URGENT_THRESHOLD`).
    pub food_urgent_threshold: Option<f64>,
    /// Web `upkeepDemand` w kolejnosci wstawiania.
    pub upkeep_demand: &'a [(String, f64)],
}

fn stock_of(goods: &[GoodsEntry], key: &str) -> f64 {
    goods
        .iter()
        .find(|g| g.key == key)
        .and_then(|g| g.ilosc)
        .unwrap_or(0.0)
}

/// Web `new Map(goods.map(g => [g.key, g.ilosc ?? 0]))`: ostatni wpis wygrywa.
fn stock_last_wins(goods: &[GoodsEntry]) -> BTreeMap<String, f64> {
    let mut out = BTreeMap::new();
    for g in goods {
        out.insert(g.key.clone(), g.ilosc.unwrap_or(0.0));
    }
    out
}

/// Web `mergeDeficitKeys(stock, fromBuild)`: suma bez duplikatow, zachowuje kolejnosc.
fn merge_deficit_keys(stock: &[String], from_build: &[String]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for k in stock.iter().chain(from_build.iter()) {
        if !out.contains(k) {
            out.push(k.clone());
        }
    }
    out
}

/// Web `detectPricedResourceDeficits(goods, pricedKeys, pakiet)`: klucze z zapasem < pakiet,
/// posortowane malejaco po luce (stabilne, jak JS `Array.prototype.sort`).
pub fn detect_priced_resource_deficits(
    goods: &[GoodsEntry],
    priced_keys: &[String],
    pakiet: f64,
) -> Vec<String> {
    let mut deficits: Vec<(String, f64)> = Vec::new();
    for key in priced_keys {
        let stock = stock_of(goods, key);
        if stock < pakiet {
            deficits.push((key.clone(), pakiet - stock));
        }
    }
    // sort_by jest stabilny (jak JS): remisy zostaja w kolejnosci priced_keys.
    deficits.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    deficits.into_iter().map(|(k, _)| k).collect()
}

/// Web `resourceKeysNeededForBuildingQueue`: klucze kosztu budynkow w kolejce niepokryte zapasem.
/// `lookup` zwraca surowy `koszt_surowce` w KOLEJNOSCI WSTAWIANIA z JSON (jak obiekt JS);
/// skalowanie FALA2 (`scaleStockCostRecord`) robi ta funkcja per klucz, zachowujac kolejnosc.
pub fn resource_keys_needed_for_building_queue(
    queued_building_ids: &[String],
    goods: &[GoodsEntry],
    lookup: &dyn Fn(&str) -> Option<BuildingKosztRecord>,
) -> Vec<String> {
    // web: `new Map(goods.map(...))` - przy zduplikowanym kluczu wygrywa OSTATNI wpis (nie pierwszy).
    let stock = stock_last_wins(goods);
    let mut needed: Vec<String> = Vec::new();
    for id in queued_building_ids {
        for (key, raw) in lookup(id).unwrap_or_default() {
            // web buildingStockCost bez epokaWejscia: mnoznik ery = 1, wiec tylko FALA2 (x2, zaokr.).
            let single = BTreeMap::from([(key.clone(), raw)]);
            let scaled = scale_stock_cost_record(Some(&single));
            let Some(amount) = scaled.get(&key) else {
                continue;
            };
            if stock.get(&key).copied().unwrap_or(0.0) < *amount && !needed.contains(&key) {
                needed.push(key);
            }
        }
    }
    needed
}

/// Web `resourceKeysNeededForUnitQueue`. `lookup` zwraca koszt w kolejnosci wstawiania.
pub fn resource_keys_needed_for_unit_queue(
    queued_unit_type_ids: &[String],
    goods: &[GoodsEntry],
    lookup: &dyn Fn(&str) -> Option<UnitKosztRecord>,
) -> Vec<String> {
    let stock = stock_last_wins(goods);
    let mut needed: Vec<String> = Vec::new();
    for id in queued_unit_type_ids {
        for (key, amount) in lookup(id).unwrap_or_default() {
            if stock.get(&key).copied().unwrap_or(0.0) < amount && !needed.contains(&key) {
                needed.push(key);
            }
        }
    }
    needed
}

/// Web `detectOwnerResourceNeeds`: magazyn + kolejka budowy/jednostek + utrzymanie + zywnosc.
pub fn detect_owner_resource_needs(input: &OwnerResourceNeedsInput<'_>) -> OwnerResourceNeedState {
    // web: Math.max(1, pakietWielkosc) (NaN -> 1, jak Math.max z NaN dal by NaN; tu defensywnie 1).
    let pakiet = if input.pakiet_wielkosc.is_nan() {
        1.0
    } else {
        input.pakiet_wielkosc.max(1.0)
    };
    let stock_deficits = detect_priced_resource_deficits(input.goods, input.priced_keys, pakiet);

    let build_deficits = if input.queued_building_ids.is_empty() {
        Vec::new()
    } else {
        resource_keys_needed_for_building_queue(
            input.queued_building_ids,
            input.goods,
            input.lookup_building_koszt_surowce,
        )
    };
    let unit_deficits = if input.queued_unit_type_ids.is_empty() {
        Vec::new()
    } else {
        resource_keys_needed_for_unit_queue(
            input.queued_unit_type_ids,
            input.goods,
            input.lookup_unit_stock_cost,
        )
    };

    let mut upkeep_deficits: Vec<String> = Vec::new();
    for (key, demand) in input.upkeep_demand {
        if demand.is_nan() || *demand <= 0.0 {
            continue;
        }
        if stock_of(input.goods, key) < *demand {
            upkeep_deficits.push(key.clone());
        }
    }

    let merged = merge_deficit_keys(
        &merge_deficit_keys(
            &merge_deficit_keys(&stock_deficits, &build_deficits),
            &unit_deficits,
        ),
        &upkeep_deficits,
    );
    let mut needs_resource: BTreeMap<String, bool> = BTreeMap::new();
    for k in &merged {
        needs_resource.insert(k.clone(), true);
    }
    let mut deficit_keys = merged;

    let threshold = input.food_urgent_threshold.unwrap_or(FOOD_URGENT_THRESHOLD);
    let food_low = matches!(input.food_reserve, Some(f) if f < threshold);
    if food_low {
        needs_resource.insert(FOOD_KEY.to_string(), true);
        if !deficit_keys.iter().any(|k| k == FOOD_KEY) {
            deficit_keys.push(FOOD_KEY.to_string());
        }
    }

    let mut urgent_keys: Vec<String> = Vec::new();
    for key in &deficit_keys {
        if key == FOOD_KEY {
            if food_low {
                urgent_keys.push(key.clone());
            }
            continue;
        }
        if stock_of(input.goods, key) < pakiet * 0.25 {
            urgent_keys.push(key.clone());
        }
    }

    OwnerResourceNeedState {
        needs_resource,
        deficit_keys,
        urgent_keys,
    }
}
