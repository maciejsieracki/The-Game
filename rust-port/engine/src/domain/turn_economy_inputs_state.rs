//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1: wejscia stanowe `advanceCityEconomy` (pin `4bbef081d`):
//! lask Mennicy (`gra/src/game/mennica-zloto-grace.ts:1-100`), stolica ownera (`main.ts:31575`,
//! `game/capital-capture.ts:67-85`) i reczny podatek z Pracy (`main.ts:34525-34535`).

use std::collections::BTreeMap;

use crate::domain::terrain::city_founding::p6_6b::cities::City;

/// Web `MENNICA_ZLOTO_GRACE_TURNS` (`:15`).
pub const MENNICA_ZLOTO_GRACE_TURNS: f64 = 1.0;

/// Web `MennicaZlotoGraceState` (`:17-22`): liczniki lask i migawka dostepu z konca poprzedniej tury.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct MennicaZlotoGraceState {
    pub grace_turns_left: BTreeMap<i64, f64>,
    pub had_access_last_turn: BTreeMap<i64, bool>,
}

impl MennicaZlotoGraceState {
    /// Web `clearMennicaZlotoGraceState` (`:28-31`).
    pub fn clear(&mut self) {
        self.grace_turns_left.clear();
        self.had_access_last_turn.clear();
    }
}

/// Web `ownerZlotoAccessForMennica` (`:37-45`).
pub fn owner_zloto_access_for_mennica(
    owner_id: i64,
    state: &MennicaZlotoGraceState,
    has_zloto_access_now: &dyn Fn(i64) -> bool,
) -> bool {
    if has_zloto_access_now(owner_id) {
        return true;
    }
    state
        .grace_turns_left
        .get(&owner_id)
        .copied()
        .unwrap_or(0.0)
        > 0.0
}

/// Czesc mutujaca `prepareMennicaZlotoGraceForTick` (`:50-64`); resolver zwracany przez weba to
/// [`owner_zloto_access_for_mennica`] na stanie po tej mutacji.
pub fn prepare_mennica_zloto_grace_for_tick(
    state: &mut MennicaZlotoGraceState,
    owner_ids: &[i64],
    has_zloto_access_now: &dyn Fn(i64) -> bool,
) {
    for &owner_id in owner_ids {
        if has_zloto_access_now(owner_id) {
            state.grace_turns_left.insert(owner_id, 0.0);
        } else if state.had_access_last_turn.get(&owner_id) == Some(&true) {
            state
                .grace_turns_left
                .insert(owner_id, MENNICA_ZLOTO_GRACE_TURNS);
        }
    }
}

/// Web `finalizeMennicaZlotoGraceAfterTick` (`:69-82`).
pub fn finalize_mennica_zloto_grace_after_tick(
    state: &mut MennicaZlotoGraceState,
    owner_ids: &[i64],
    has_zloto_access_now: &dyn Fn(i64) -> bool,
) {
    for &owner_id in owner_ids {
        let now = has_zloto_access_now(owner_id);
        state.had_access_last_turn.insert(owner_id, now);
        if !now {
            let grace = state
                .grace_turns_left
                .get(&owner_id)
                .copied()
                .unwrap_or(0.0);
            if grace > 0.0 {
                state.grace_turns_left.insert(owner_id, grace - 1.0);
            }
        }
    }
}

/// Web `cityFoundOrder` (`capital-capture.ts:67`): `/^city(\d+)$/` -> liczba, inaczej `+Infinity`.
/// `\d` w JS to wylacznie ASCII `0-9`.
pub fn city_found_order(id: &str) -> f64 {
    let Some(rest) = id.strip_prefix("city") else {
        return f64::INFINITY;
    };
    if rest.is_empty() || !rest.bytes().all(|b| b.is_ascii_digit()) {
        return f64::INFINITY;
    }
    rest.parse::<f64>().unwrap_or(f64::INFINITY)
}

/// Web `oldestCityOfOwner` (`capital-capture.ts:73-85`): scisle `<` od `+Infinity`, wiec miasta z id spoza wzorca
/// nigdy nie sa "najstarsze" (wynik `None`, gdy zadne id nie pasuje).
pub fn oldest_city_id_of_owner(owner_id: i64, cities: &[City]) -> Option<String> {
    let mut best: Option<&City> = None;
    let mut best_order = f64::INFINITY;
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        let order = city_found_order(&c.id);
        if order < best_order {
            best = Some(c);
            best_order = order;
        }
    }
    best.map(|c| c.id.clone())
}

/// Web `capitalCityIdForOwner` (`main.ts:31575-31579`): jawna stolica, jesli nadal nalezy do ownera, inaczej
/// najstarsze miasto.
pub fn capital_city_id_for_owner(
    owner_id: i64,
    capital_city_id_by_owner: &BTreeMap<i64, String>,
    cities: &[City],
) -> Option<String> {
    if let Some(explicit) = capital_city_id_by_owner.get(&owner_id) {
        if !explicit.is_empty()
            && cities
                .iter()
                .any(|c| &c.id == explicit && c.owner_id == owner_id)
        {
            return Some(explicit.clone());
        }
    }
    oldest_city_id_of_owner(owner_id, cities)
}

/// Web `manualWorkTaxByCity` (`main.ts:34525-34535`): reczny podatek z Pracy trafia do stolicy ownera (lub pierwszego
/// jego miasta); `tax <= 0` i owner bez miast pomijane. Kolejnosc iteracji `Map` weba nie wplywa na wynik
/// (klucze to rozne miasta albo sumuja sie addytywnie), wiec `BTreeMap` jest rownowazny.
pub fn build_manual_work_tax_by_city(
    pending_by_owner: &BTreeMap<i64, f64>,
    capital_city_id_by_owner: &BTreeMap<i64, String>,
    cities: &[City],
) -> BTreeMap<String, f64> {
    let mut out: BTreeMap<String, f64> = BTreeMap::new();
    for (&owner_id, &tax) in pending_by_owner {
        let owner_cities: Vec<&City> = cities.iter().filter(|c| c.owner_id == owner_id).collect();
        if owner_cities.is_empty() || tax <= 0.0 {
            continue;
        }
        let capital_id = capital_city_id_for_owner(owner_id, capital_city_id_by_owner, cities);
        let target = owner_cities
            .iter()
            .find(|c| Some(&c.id) == capital_id.as_ref())
            .copied()
            .unwrap_or(owner_cities[0]);
        *out.entry(target.id.clone()).or_insert(0.0) += tax;
    }
    out
}
