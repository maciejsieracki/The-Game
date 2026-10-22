//! Port P6.M15. Temat wlasciciel: R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1.
//! Zakres web (P6-25 §6): improvement-build.ts:1559-1569, road-movement.ts:1-84 (pin `edb8fb56`).
//!
//! Reguly drog: predykat klucza drogi, test "heks nalezy do sieci drog", zbior kluczy drog z
//! mapy oraz modyfikator kosztu ruchu (`applyRoadMovementModifier`). Mnozniki i podlogi kosztu
//! NIE sa literalami: czytane z edytowalnej tabeli `data/derived/road-movement-multipliers.json`
//! (`data::derived::road_movement_value`), nazwy kluczy drog z
//! `data/derived/ruch-jednostek-params.json`. Wektory: `tests/p6_m15_vectors/*.json` (z
//! URUCHOMIONEGO weba), test: `tests/p6_m15_roads.rs`.

use crate::data::derived::{road_movement_value, ruch_jednostek_params};
use crate::domain::improvements::{improvement_keys_for_hex, HexLike};

/// Web `ROAD_MOVE_SPEED_MULT` (`road-movement.ts:14`): dzielnik kosztu dla drogi zwyklej.
pub fn road_move_speed_mult() -> f64 {
    road_movement_value("ROAD_MOVE_SPEED_MULT")
}

/// Web `ROAD_BRUK_MOVE_SPEED_MULT` (`road-movement.ts:29`): dzielnik kosztu dla drogi brukowanej.
pub fn road_bruk_move_speed_mult() -> f64 {
    road_movement_value("ROAD_BRUK_MOVE_SPEED_MULT")
}

/// Web `ROAD_MIN_MOVE_COST` (`road-movement.ts:32`): wspolna podloga (martwa w webie - nieczytana
/// przez `applyRoadMovementModifier`; wystawiona dla pelnosci eksportow).
pub fn road_min_move_cost() -> f64 {
    road_movement_value("ROAD_MIN_MOVE_COST")
}

/// Web `ROAD_BRUK_MIN_MOVE_COST` (`road-movement.ts:57`): podloga kosztu dla drogi brukowanej.
pub fn road_bruk_min_move_cost() -> f64 {
    road_movement_value("ROAD_BRUK_MIN_MOVE_COST")
}

/// Web `Math.max(a, b)`: `NaN`, gdy ktorykolwiek argument to `NaN` (`f64::max` ignoruje `NaN`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}

/// Web `isRoadImprovementKey` (`road-movement.ts:59`; re-eksport `improvement-build.ts:1569`):
/// scisle rowne `'droga'` albo `'droga_brukowana'` (bez normalizacji, wielkosc liter ma znaczenie).
pub fn is_road_improvement_key(key: &str) -> bool {
    let names = &ruch_jednostek_params().teren;
    key == names.ulepszenie_droga || key == names.ulepszenie_droga_brukowana
}

/// Web `hexHasRoad` (`road-movement.ts:64`): heks nalezy do sieci drog (droga lub bruk).
pub fn hex_has_road(hex: &HexLike) -> bool {
    improvement_keys_for_hex(hex)
        .iter()
        .any(|key| is_road_improvement_key(key))
}

/// Web `applyRoadMovementModifier` (`road-movement.ts:73`): modyfikuje koszt wejscia na heks po
/// terenie i lesie. Priorytet: bruk (z podloga) > zwykla droga. `Infinity` przechodzi bez zmian.
pub fn apply_road_movement_modifier(cost: f64, hex: &HexLike) -> f64 {
    if cost == f64::INFINITY {
        return f64::INFINITY;
    }
    let names = &ruch_jednostek_params().teren;
    let keys = improvement_keys_for_hex(hex);
    let has =
        |name: &str| keys.iter().any(|key| key == name) || hex.ulepszenie.as_deref() == Some(name);
    if has(&names.ulepszenie_droga_brukowana) {
        return js_max(
            road_bruk_min_move_cost(),
            cost / road_bruk_move_speed_mult(),
        );
    }
    if has(&names.ulepszenie_droga) {
        return cost / road_move_speed_mult();
    }
    cost
}

/// Czy napis jest "kluczem indeksu tablicy" JS (kanoniczna liczba 0 ..= 2^32 - 2). Takie klucze
/// obiektu `Object.entries` zwraca PRZED pozostalymi, rosnaco numerycznie.
fn js_array_index(key: &str) -> Option<u32> {
    if key.is_empty() || !key.bytes().all(|b| b.is_ascii_digit()) {
        return None;
    }
    // Wiodace zero (poza samym "0") - napis nie jest kanoniczny.
    if key.len() > 1 && key.starts_with('0') {
        return None;
    }
    let value: u64 = key.parse().ok()?;
    if value <= u64::from(u32::MAX - 1) {
        u32::try_from(value).ok()
    } else {
        None
    }
}

/// Web `collectRoadKeys` (`improvement-build.ts:1559`): klucze heksow z siecia drog w kolejnosci
/// `Object.entries(map.hexes)`. `entries` = pary `(klucz, heks)` w kolejnosci WSTAWIANIA do
/// obiektu; powtorzony klucz nadpisuje wartosc na pierwotnej pozycji (semantyka wlasciwosci JS).
/// Kolejnosc wyniku (zbior JS `Set`): najpierw klucze-indeksy tablicy rosnaco, potem reszta wg
/// wstawiania.
pub fn collect_road_keys(entries: &[(String, HexLike)]) -> Vec<String> {
    let mut slots: Vec<(&str, &HexLike)> = Vec::new();
    for (key, hex) in entries {
        match slots
            .iter_mut()
            .find(|(existing, _)| *existing == key.as_str())
        {
            Some(slot) => slot.1 = hex,
            None => slots.push((key.as_str(), hex)),
        }
    }
    let mut indexed: Vec<(u32, &str, &HexLike)> = Vec::new();
    let mut others: Vec<(&str, &HexLike)> = Vec::new();
    for (key, hex) in slots {
        match js_array_index(key) {
            Some(index) => indexed.push((index, key, hex)),
            None => others.push((key, hex)),
        }
    }
    indexed.sort_by_key(|(index, _, _)| *index);
    indexed
        .into_iter()
        .map(|(_, key, hex)| (key, hex))
        .chain(others)
        .filter(|(_, hex)| hex_has_road(hex))
        .map(|(key, _)| key.to_owned())
        .collect()
}
