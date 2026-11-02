//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1: plastry utrzymania ticku ekonomii `advanceCityEconomy`
//! (web pin `4bbef081d`, `gra/src/game/turn-economy.ts`).
//!
//! Portowane (numery linii = web, pin):
//! * P4 `computePracaUpkeepByOwner` (`:917-945`, wolane `:2320`) + `loadResourceImprovementUpkeepCost`
//!   (`:900-906`) -> [`compute_praca_upkeep_by_owner`], [`load_resource_improvement_upkeep_cost`];
//! * P5 parametry ladowane raz na tick (`:2323-2329`): `loadUpkeepParams`, `loadStorageParams`,
//!   `buildRationParams`, `buildUnitUpkeepTable` -> [`load_advance_upkeep_params`] (WOLA istniejace funkcje z
//!   `turn_economy::economy_upkeep_p1` i `economy_upkeep_p2`
//!   i `city_growth::p6_7a::growth_v85`, nie duplikuje ich logiki).
//!
//! Zalozenia:
//! * `data.econParams` jest zawsze podane (web przy `undefined` rzucilby `TypeError`); `None` -> `Null`,
//!   czyli wszystkie wartosci z fallbackow;
//! * `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` = [`resource_upkeep_improvement_keys`] (zbior kluczy, jak `Set` weba);
//! * `hex_like_of` jest lokalna kopia widoku `BuildHex` -> `HexLike` (ta z `turn_economy_territory.rs` jest
//!   prywatna, a ten plik nie jest w jej allowliscie);
//! * kolejnosc kluczy wiersza `units.json` jest istotna (`buildUnitUpkeepTable` bierze PIERWSZY klucz
//!   `Utrzymanie*`), a `serde_json::Value` jej nie zachowuje, wiec [`unit_rows_from_json_str`] parsuje
//!   w kolejnosci wstawiania.

use std::collections::{BTreeMap, BTreeSet};

use serde::de::{Deserialize, Deserializer, MapAccess, SeqAccess, Visitor};
use serde_json::Value;

use crate::domain::building_costs::p6_7b::load_throughput;
use crate::domain::city_growth::p6_7a::growth_v85::{build_ration_params, RationParams};
use crate::domain::improvement_build::{BuildHex, BuildMap};
use crate::domain::improvements::{
    improvement_keys_for_hex, resource_upkeep_improvement_keys, terrain_improvement_era_for_key,
    terrain_improvement_era_multiplier, HexLike,
};
use crate::domain::society_breakdown::{js_max, js_round};
use crate::domain::territory::{territory_owner_at, TerritoryNode};
use crate::domain::turn_economy::economy_upkeep_p1::{
    load_storage_params, Difficulty, RawEconParamsForUpkeep, RawGroup, StorageParams, UpkeepParams,
};
use crate::domain::turn_economy::economy_upkeep_p2::{
    build_unit_upkeep_table, load_upkeep_params, UnitCell, UnitRow, UnitUpkeepTable,
};
use crate::domain::types::Difficulty as GameDifficulty;

/// Web klucz parametru kosztu Pracy za utrzymanie ulepszenia (`econ-params.json` grupa `budynki`).
const PRACA_UPKEEP_KEY: &str = "ulepszenie_surowcowe_upkeep_praca";

fn hex_like_of(hex: &BuildHex) -> HexLike {
    HexLike {
        ulepszenie: hex.ulepszenie.clone(),
        ulepszenia: hex.ulepszenia.clone(),
        nakladka: Some(hex.overlay),
        zloze: hex.zloze.clone(),
    }
}

/// Web `loadResourceImprovementUpkeepCost(data, difficulty)` (`:900-906`):
/// `loadThroughput(data.econParams ?? {}, 'ulepszenie_surowcowe_upkeep_praca', difficulty, 1)`.
pub fn load_resource_improvement_upkeep_cost(econ_params: Option<&Value>, difficulty: &str) -> f64 {
    let null = Value::Null;
    load_throughput(
        econ_params.unwrap_or(&null),
        PRACA_UPKEEP_KEY,
        difficulty,
        1.0,
    )
}

/// Web `computePracaUpkeepByOwner(map, territoryNodes, data, difficulty)` (`:917-945`): Praca/ture do
/// odjecia civ-wide per wlasciciel za trwale ulepszenia terenu. Dla kazdego heksa (kolejnosc
/// `Object.keys(map.hexes)`) bez ulepszen pomijany; wlasciciel = `territoryOwnerAt`; brak wlasciciela =
/// pomijany; koszt klucza = `max(0, round(cost * mnoznikEpoki(epokaKlucza)))` tylko dla kluczy ze zbioru
/// `RESOURCE_UPKEEP_IMPROVEMENT_KEYS`; wpis tylko gdy suma > 0.
pub fn compute_praca_upkeep_by_owner(
    map: &BuildMap,
    territory_nodes: &[TerritoryNode],
    econ_params: Option<&Value>,
    difficulty: &str,
) -> BTreeMap<i64, f64> {
    let cost = js_max(
        0.0,
        load_resource_improvement_upkeep_cost(econ_params, difficulty),
    );
    let upkeep_keys: BTreeSet<String> = resource_upkeep_improvement_keys().into_iter().collect();
    let mut out: BTreeMap<i64, f64> = BTreeMap::new();
    for hex in map.hexes() {
        let imp_keys = improvement_keys_for_hex(&hex_like_of(hex));
        if imp_keys.is_empty() {
            continue;
        }
        let Some(owner) = territory_owner_at(hex.q, hex.r, territory_nodes) else {
            continue;
        };
        let mut upkeep = 0.0;
        for key in &imp_keys {
            if !upkeep_keys.contains(key) {
                continue;
            }
            let era = terrain_improvement_era_for_key(Some(key));
            upkeep += js_max(
                0.0,
                js_round(cost * terrain_improvement_era_multiplier(Some(era))),
            );
        }
        if upkeep > 0.0 {
            *out.entry(owner).or_insert(0.0) += upkeep;
        }
    }
    out
}

/// Parametry ladowane raz na tick (web `:2323-2329`).
#[derive(Debug, Clone, PartialEq)]
pub struct AdvanceUpkeepParams {
    /// Web `upkeepParams = loadUpkeepParams(rawEconParams, difficulty)`.
    pub upkeep: UpkeepParams,
    /// Web `storageParams = loadStorageParams(rawEconParams, difficulty)`.
    pub storage: StorageParams,
    /// Web `rationParams = buildRationParams(rawEconParams, difficulty)`.
    pub ration: RationParams,
    /// Web `unitUpkeepTbl = buildUnitUpkeepTable(data.units)`.
    pub unit_upkeep_table: UnitUpkeepTable,
}

fn raw_group(econ: &Value, name: &str) -> Option<RawGroup> {
    econ.get(name).and_then(Value::as_object).map(|g| {
        g.iter()
            .map(|(k, v)| {
                (
                    k.clone(),
                    crate::domain::turn_economy_advance::raw_row_from_value(v),
                )
            })
            .collect::<RawGroup>()
    })
}

/// Surowy `econ-params.json` -> `RawEconParamsForUpkeep` (wszystkie trzy grupy czytane przez
/// `loadUpkeepParams`/`loadStorageParams`).
pub fn raw_econ_for_upkeep(econ_params: Option<&Value>) -> RawEconParamsForUpkeep {
    let null = Value::Null;
    let econ = econ_params.unwrap_or(&null);
    RawEconParamsForUpkeep {
        ekonomia_miasta: raw_group(econ, "ekonomia_miasta"),
        budynki: raw_group(econ, "budynki"),
        globalne: raw_group(econ, "globalne"),
    }
}

fn upkeep_difficulty(difficulty: &str) -> Difficulty {
    crate::domain::turn_economy_advance::difficulty_enum(difficulty)
}

/// Web `:2323-2329`: `loadUpkeepParams`, `loadStorageParams`, `buildRationParams`, `buildUnitUpkeepTable`
/// na tym samym `data.econParams` i `data.units`.
pub fn load_advance_upkeep_params(
    econ_params: Option<&Value>,
    difficulty: &str,
    unit_rows: &[UnitRow],
) -> AdvanceUpkeepParams {
    let raw = raw_econ_for_upkeep(econ_params);
    let d = upkeep_difficulty(difficulty);
    let null = Value::Null;
    let game_difficulty = match difficulty {
        "easy" => GameDifficulty::Easy,
        "hard" => GameDifficulty::Hard,
        _ => GameDifficulty::Normal,
    };
    AdvanceUpkeepParams {
        upkeep: load_upkeep_params(&raw, d),
        storage: load_storage_params(&raw, d),
        ration: build_ration_params(econ_params.unwrap_or(&null), game_difficulty),
        unit_upkeep_table: build_unit_upkeep_table(unit_rows),
    }
}

fn unit_cell_of(v: &Value) -> UnitCell {
    match v {
        Value::Null => UnitCell::Null,
        Value::String(s) => UnitCell::Text(s.clone()),
        Value::Number(n) => n.as_f64().map_or(UnitCell::Other, UnitCell::Num),
        _ => UnitCell::Other,
    }
}

struct OrderedRow(UnitRow);

impl<'de> Deserialize<'de> for OrderedRow {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct RowVisitor;
        impl<'de> Visitor<'de> for RowVisitor {
            type Value = OrderedRow;
            fn expecting(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.write_str("obiekt wiersza units.json")
            }
            fn visit_map<A: MapAccess<'de>>(self, mut a: A) -> Result<OrderedRow, A::Error> {
                let mut row: UnitRow = Vec::new();
                while let Some(k) = a.next_key::<String>()? {
                    let v: Value = a.next_value()?;
                    let cell = unit_cell_of(&v);
                    // duplikat klucza: JS zachowuje pierwsza pozycje, nadpisuje wartosc
                    match row.iter_mut().find(|(rk, _)| *rk == k) {
                        Some(slot) => slot.1 = cell,
                        None => row.push((k, cell)),
                    }
                }
                Ok(OrderedRow(row))
            }
        }
        d.deserialize_map(RowVisitor)
    }
}

struct OrderedRows(Vec<UnitRow>);

impl<'de> Deserialize<'de> for OrderedRows {
    fn deserialize<D: Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        struct RowsVisitor;
        impl<'de> Visitor<'de> for RowsVisitor {
            type Value = OrderedRows;
            fn expecting(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.write_str("tablica wierszy units.json")
            }
            fn visit_seq<A: SeqAccess<'de>>(self, mut a: A) -> Result<OrderedRows, A::Error> {
                let mut rows = Vec::new();
                while let Some(OrderedRow(row)) = a.next_element::<OrderedRow>()? {
                    rows.push(row);
                }
                Ok(OrderedRows(rows))
            }
        }
        d.deserialize_seq(RowsVisitor)
    }
}

/// `units.json` (tablica obiektow) -> wiersze z ZACHOWANA kolejnoscia kluczy.
pub fn unit_rows_from_json_str(text: &str) -> Result<Vec<UnitRow>, serde_json::Error> {
    serde_json::from_str::<OrderedRows>(text).map(|r| r.0)
}
