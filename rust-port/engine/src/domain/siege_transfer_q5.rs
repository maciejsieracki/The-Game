//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q5-Q1: cztery skutki przejecia miasta z tabeli [`crate::domain::siege_transfer::TRANSFER_EFFECTS`],
//! ktore byly BRAK i sa teraz Ported (czyste funkcje, port 1:1 z pinu webu).
//!
//! Pin webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75:
//! * `gra/src/main.ts:17478` (`garnizonCountForCity`) i `:17630` (`syncCityGarnizon`) - wolane w galezi
//!   `resolveSiegeSurrender` (`main.ts:17812`) PO `enterCityAfterSurrender`;
//! * `gra/src/ui/eliminationSpectacle.ts:61-75` (`newChronicle`, `chronicleFor`) i `:138-141` (`noteCityCapture`)
//!   - wolane w galezi Transfer (`main.ts:17706`, `:36047`) z `civChronicleByOwner`;
//! * `gra/src/main.ts:17816` (`playerEverOwnedCityByOwner.add(newOwner)`) - zbior ustawiany po wejsciu garnizonu;
//! * `gra/src/main.ts:21803` (`applyLiveSafeRationForCity`) - wolane PO `endMapSiege` (`main.ts:17872`).
//!
//! Kolejnosc wywolan web (garnizon, zbior graczy, racje) jest PO `enterCityAfterSurrender` i `endMapSiege`,
//! wiec te trzy klocki nie sa podpiete w [`crate::domain::siege_transfer::apply_transfer`]; wola je wolajacy
//! w tej kolejnosci. `noteCityCapture` nie czyta stanu, ktory zmienia `apply_transfer`, wiec tez wolany po nim.
//!
//! Dowod zgodnosci: `tests/p6_siege_transfer_q5.rs` + generator `tests/p6_siege_transfer_q5_gen.mjs` (wycina
//! funkcje z pinu i wykonuje je w node). Wyjatek: `record_player_ever_owned_city` - w pinie to pojedyncze
//! wywolanie `Set.add` bez funkcji do wyciecia; jego wektor sprawdza semantyke `Set` (NIE_ZMIERZONO jako wycinek pinu).

use std::collections::{BTreeMap, BTreeSet};

use crate::domain::siege_enter_city::EnterUnit;

/// Web `garnizonCountForCity(city)` (main.ts:17478): jednostki wlasciciela miasta na jego heksie z `inGarnizon === true`.
pub fn garnizon_count_for_city(city_owner: i64, q: i64, r: i64, units: &[EnterUnit]) -> f64 {
    units
        .iter()
        .filter(|u| u.owner_id == city_owner && u.q == q && u.r == r && u.in_garnizon)
        .count() as f64
}

/// Web `syncCityGarnizon(city)` (main.ts:17630): `city.garnizon = garnizonCountForCity(city)`.
/// Zwraca nowa wartosc pola `garnizon` (wolajacy zapisuje ja w miescie).
pub fn sync_city_garnizon(city_owner: i64, q: i64, r: i64, units: &[EnterUnit]) -> f64 {
    garnizon_count_for_city(city_owner, q, r, units)
}

/// Web `CivChronicleVs` (eliminationSpectacle.ts:28).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct CivChronicleVs {
    pub k: f64,
    pub l: f64,
    pub b: f64,
}

/// Web `CivChronicle` (eliminationSpectacle.ts:37). `since_turn`/`legacy` = pola opcjonalne (`None` = brak klucza).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct CivChronicle {
    pub since_turn: Option<f64>,
    pub legacy: Option<bool>,
    pub produced: f64,
    pub lost: f64,
    pub destroyed: f64,
    pub battles: f64,
    pub cities_taken: f64,
    pub cities_lost: f64,
    pub max_cities: f64,
    pub peak_pop: f64,
    pub wonders: f64,
    pub vs: BTreeMap<i64, CivChronicleVs>,
}

/// Web `ChronicleMap = Map<number, CivChronicle>` (klucz = id wlasciciela).
pub type ChronicleMap = BTreeMap<i64, CivChronicle>;

/// Web `newChronicle(turn?, legacy = false)` (eliminationSpectacle.ts:61). Tura ustawiana tylko gdy skonczona.
pub fn new_chronicle(turn: Option<f64>, legacy: bool) -> CivChronicle {
    let mut c = CivChronicle::default();
    if let Some(t) = turn {
        if t.is_finite() {
            c.since_turn = Some(t);
        }
    }
    if legacy {
        c.legacy = Some(true);
    }
    c
}

/// Web `chronicleFor(map, ownerId, turn?)` (eliminationSpectacle.ts:71): wpis tworzony leniwie.
pub fn chronicle_for(
    map: &mut ChronicleMap,
    owner_id: i64,
    turn: Option<f64>,
) -> &mut CivChronicle {
    map.entry(owner_id)
        .or_insert_with(|| new_chronicle(turn, false))
}

/// Web `noteCityCapture(map, oldOwner, newOwner, turn?)` (eliminationSpectacle.ts:138).
/// Przejecie tego samego wlasciciela = no-op; w przeciwnym razie `citiesTaken++` zdobywcy i `citiesLost++` ofiary.
pub fn note_city_capture(
    map: &mut ChronicleMap,
    old_owner: i64,
    new_owner: i64,
    turn: Option<f64>,
) {
    if old_owner == new_owner {
        return;
    }
    chronicle_for(map, new_owner, turn).cities_taken += 1.0;
    chronicle_for(map, old_owner, turn).cities_lost += 1.0;
}

/// Web `playerEverOwnedCityByOwner.add(newOwner)` (main.ts:17816). Zwraca `true`, gdy owner byl nowy (JS `Set.add` nie mowi,
/// ale zbior jest identyfikowany po obecnosci; wolajacy nie czyta wartosci zwrotnej web).
pub fn record_player_ever_owned_city(set: &mut BTreeSet<i64>, owner_id: i64) -> bool {
    set.insert(owner_id)
}

/// Web `applyLiveSafeRationForCity(cityId)` (main.ts:21803), czesc decyzyjna po wykonaniu warunkow wejsciowych:
/// * web `if (!city || city.ownerId !== 0) return;` -> `owner_id != 0` daje `None`;
/// * web `if (!isCityAutoWyzywienieEnabled(city)) return;` -> `auto_enabled` = wynik tej funkcji (dla ownera 0: `autoWyzywienie === true`);
/// * web `ensureCityRationDefaults(city)` i `getCityRationLevel(city)` WYKONUJE WOLAJACY; tu wchodzi juz wynik jako `ration_level`;
/// * web `maxSafe = getMaxSafePoziomRacjiForPlayerCity(cityId)` - `max_safe` od wolajacego (poza zakresem tego klocka);
/// * web `if (level > maxSafe) { city.poziomRacji = maxSafe; markCityStateDirty(); }`.
///
/// Zwraca `Some(nowy poziom)` gdy web ustawilby `poziomRacji` (i wolalby `markCityStateDirty`), w przeciwnym razie `None`.
pub fn apply_live_safe_ration_for_city(
    owner_id: i64,
    auto_enabled: bool,
    ration_level: f64,
    max_safe: f64,
) -> Option<f64> {
    if owner_id != 0 || !auto_enabled {
        return None;
    }
    if ration_level > max_safe {
        Some(max_safe)
    } else {
        None
    }
}
