//! R-RUSTPORT-REPIN-OBLEZENIE-LIMIT-150-BLOKADA-Q1 (czesc b): SIEGE-NEARBY -- blokada sasiednich stosow i dolaczanie.
//!
//! Port czystych funkcji `gra/src/game/armyMerge.ts` (web `origin/main` 638e90bea, pin z 218d7d5cf):
//! * [`stack_group_id_of`] = `stackGroupIdOf` (`armyMerge.ts:57-62`), bez pola `stackGroupId` (przekazywane jako `explicit`).
//! * [`besiege_army_groups`] = `besiegeArmyGroups` (`armyMerge.ts:177-189`).
//! * [`besiege_lock_targets`] = `besiegeLockTargets` (`armyMerge.ts:195-207`), zwraca indeksy w `units`.
//!
//! Zasada (web R-WEB-SIEGE-NEARBY-UNIT-LOCK-AND-JOIN-BESIEGING-ARMY-Q1): commitBesiege blokuje tylko stosy
//! faktycznie oblegajacej armii (grupy z zywych jednostek z `oblegaCityId == city`), nie wszystkich sasiadow.
//! Armia w miescie (`in_garnizon`) ma klucz grupy z sufiksem `|g` i nie jest dolaczana z zewnatrz.
//!
//! ZALOZENIA (do akceptacji, brak w dispatchu):
//! * Z-SN-1 Brak pola `stackGroupId` w danych Rust: wywolujacy podaje `explicit` (None = wyliczenie z pozycji).
//! * Z-SN-2 `hint` (web `siegeArmyGroupId`) to `Option<&str>`; `None` = web `undefined`.
//! * Z-SN-3 Odleglosc heksowa = `diplomacy_siege_war_gate::hex_distance` (web `hexDistance`, `units/setup.ts:354`).
//! * Z-SN-4 Wyjscie = indeksy w `units` w kolejnosci wejscia (web `filter` zachowuje kolejnosc).
//! * Z-SN-5 Zlaczenie z UI (`main.ts` commitBesiege / startMapSiege) NIE jest portowane: to warstwa web bez
//!   odpowiednika w `rust-port/engine` (poza zakresem tego tematu).

use std::collections::BTreeSet;

use super::diplomacy_siege_war_gate::hex_distance;

/// Minimalny widok jednostki potrzebny do grupowania i blokady (web `RuntimeUnit` w zakresie tych funkcji).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LockUnit {
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
    pub in_garnizon: bool,
    /// Web `oblegaCityId` (`None` = `undefined`).
    pub oblega_city_id: Option<String>,
    /// Web `stackGroupId` (`None` = brak pola).
    pub explicit_stack_group_id: Option<String>,
}

/// Web `stackGroupIdOf` (`armyMerge.ts:57-62`).
pub fn stack_group_id_of(u: &LockUnit) -> String {
    if let Some(explicit) = u.explicit_stack_group_id.as_deref() {
        if !explicit.is_empty() {
            return explicit.to_string();
        }
    }
    if u.in_garnizon {
        format!("{}|{},{}|g", u.owner_id, u.q, u.r)
    } else {
        format!("{}|{},{}", u.owner_id, u.q, u.r)
    }
}

/// Web `besiegeArmyGroups` (`armyMerge.ts:177-189`).
///
/// Grupy z zywych jednostek wlasciciela z `oblegaCityId == city_id`; gdy brak takich, `hint` jako jedyna grupa;
/// inaczej `None` (web `undefined`).
pub fn besiege_army_groups(
    units: &[LockUnit],
    city_id: &str,
    owner_id: i64,
    hint: Option<&str>,
) -> Option<BTreeSet<String>> {
    let from_units: BTreeSet<String> = units
        .iter()
        .filter(|u| u.owner_id == owner_id && u.oblega_city_id.as_deref() == Some(city_id))
        .map(stack_group_id_of)
        .collect();
    if !from_units.is_empty() {
        return Some(from_units);
    }
    hint.map(|h| BTreeSet::from([h.to_string()]))
}

/// Web `besiegeLockTargets` (`armyMerge.ts:195-207`).
///
/// Indeksy jednostek wlasciciela stojacych na heksach sasiadujacych z miastem (odleglosc = 1).
/// `groups = None` (web `undefined`, AI) -> wszyscy sasiedzi wlasciciela; `Some(set)` -> tylko stosy z tych grup.
pub fn besiege_lock_targets(
    units: &[LockUnit],
    city_q: i64,
    city_r: i64,
    owner_id: i64,
    groups: Option<&BTreeSet<String>>,
) -> Vec<usize> {
    units
        .iter()
        .enumerate()
        .filter(|(_, u)| {
            u.owner_id == owner_id
                && hex_distance(u.q, u.r, city_q, city_r) == 1
                && groups.is_none_or(|g| g.contains(&stack_group_id_of(u)))
        })
        .map(|(idx, _)| idx)
        .collect()
}
