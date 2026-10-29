//! REPIN-WOJNA-NOWE-B: port `gra/src/game/army-consolidation.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/army-consolidation.ts:24 (flaga `ARMY_CONSOLIDATION_ENABLED`),
//! :26-33 (`flagOverride`, `setArmyConsolidationOverride` :29, `isArmyConsolidationEnabled` :33),
//! :38-40 (parametry z JSON), :74 (`pickRallyCity`), :89 (`buildRallyCandidates`),
//! :111 (`assignRallyTargets`), :147 (`warArmyCount`), :156 (`splitIntoWarArmies`).
//! Dane stale: `data/derived/army-consolidation-params.json` (kopia `gra/data/army-consolidation-params.json`).
//!
//! ZALOZENIA (adaptacja typow, zachowanie logiki bez zmian):
//! - web trzyma flage w zmiennej modulu (`setArmyConsolidationOverride`); tu override jest
//!   argumentem `flag_override: Option<bool>` (None = wartosc domyslna), bez stanu globalnego.
//! - identyfikatory jednostek i miast to `String` (web: `string`); porownanie `<` JS na napisach
//!   jest realizowane jako porownanie kodow UTF-16 (`cmp_js_str`), tak jak w JS.
//! - `armyCount` w `splitIntoWarArmies` to `i64` (web: `number`); wartosci <= 1 daja jedna armie
//!   (`Math.max(1, ...)`), identycznie jak w webie dla liczb calkowitych.
//! - `strengthOf` i `id` przekazywane jako domkniecia (web: generyk `T` z polem `id`).

use serde_json::Value;
use std::cmp::Ordering;
use std::collections::HashMap;
use std::sync::OnceLock;

const PARAMS_JSON: &str = include_str!("../../data/derived/army-consolidation-params.json");

/// GLOWNA FLAGA (web: `ARMY_CONSOLIDATION_ENABLED`, wydanie robocze nr 6: DEFAULT=true).
pub const ARMY_CONSOLIDATION_ENABLED: bool = true;

struct Params {
    max_per_hex: i64,
    home_group_size: i64,
    rally_search_hex: i64,
}

fn params() -> &'static Params {
    static TABLE: OnceLock<Params> = OnceLock::new();
    TABLE.get_or_init(|| {
        let root: Value =
            serde_json::from_str(PARAMS_JSON).expect("army-consolidation-params.json");
        let wartosc = |key: &str| -> i64 {
            root[key]["wartosc"]
                .as_i64()
                .unwrap_or_else(|| panic!("{key}.wartosc musi byc liczba calkowita"))
        };
        Params {
            max_per_hex: wartosc("rally_hex_max_units"),
            home_group_size: wartosc("home_defense_group_size"),
            rally_search_hex: wartosc("rally_search_hex"),
        }
    })
}

/// Web: `ARMY_CONSOLIDATION_MAX_PER_HEX` (limit jednostek na heksie zbiorki).
pub fn army_consolidation_max_per_hex() -> i64 {
    params().max_per_hex
}

/// Web: `ARMY_CONSOLIDATION_HOME_GROUP_SIZE` (kworum obrony domu).
pub fn army_consolidation_home_group_size() -> i64 {
    params().home_group_size
}

/// Web: `ARMY_CONSOLIDATION_RALLY_SEARCH_HEX` (domyslny promien szukania miasta zapasowego).
pub fn army_consolidation_rally_search_hex() -> i64 {
    params().rally_search_hex
}

/// Web: `isArmyConsolidationEnabled` (`flagOverride ?? ARMY_CONSOLIDATION_ENABLED`).
pub fn is_army_consolidation_enabled(flag_override: Option<bool>) -> bool {
    flag_override.unwrap_or(ARMY_CONSOLIDATION_ENABLED)
}

/// Jednostka polowa biorąca udział w konsolidacji (web: `ConsolidationUnit`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ConsolidationUnit {
    pub id: String,
    pub q: i64,
    pub r: i64,
    pub ruch_left: i64,
}

/// Miasto jako kandydat na heks zbiorki (web: `RallyCityRef`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RallyCityRef {
    pub id: String,
    pub q: i64,
    pub r: i64,
}

/// Heks zbiorki (web: `RallyHexRef`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RallyHexRef {
    pub q: i64,
    pub r: i64,
}

/// Przydzial jednostki do heksu zbiorki (web: `RallyAssignment`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RallyAssignment {
    pub unit_id: String,
    /// Heks, do ktorego jednostka ma dojsc (stolica albo miasto zapasowe).
    pub target_q: i64,
    pub target_r: i64,
    /// Jednostka juz stoi na swoim heksie zbiorki -- nic nie robi (scala sie na miejscu).
    pub at_rally: bool,
}

/// Porownanie napisow jak `<`/`>` w JS (kody UTF-16).
fn cmp_js_str(a: &str, b: &str) -> Ordering {
    a.encode_utf16().cmp(b.encode_utf16())
}

/// Axialna odleglosc heksowa (web: `hexDistance` z `units/setup.ts`, max(|dq|,|dr|,|ds|)).
fn hex_distance(aq: i64, ar: i64, bq: i64, br: i64) -> i64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// Web: `pickRallyCity`. Stolica = `capital_city_id`, jesli takie miasto nalezy do listy;
/// w przeciwnym razie pierwsze miasto listy.
pub fn pick_rally_city<'a>(
    cities: &'a [RallyCityRef],
    capital_city_id: Option<&str>,
) -> Option<&'a RallyCityRef> {
    if let Some(id) = capital_city_id.filter(|id| !id.is_empty()) {
        if let Some(capital) = cities.iter().find(|c| c.id == id) {
            return Some(capital);
        }
    }
    cities.first()
}

/// Web: `buildRallyCandidates`. Lista heksow zbiorki: stolica (`rally`), potem pozostale miasta
/// wlasne w promieniu `search_radius` od stolicy (wg odleglosci, potem id).
pub fn build_rally_candidates(
    cities: &[RallyCityRef],
    rally: &RallyCityRef,
    search_radius: i64,
) -> Vec<RallyHexRef> {
    let mut others: Vec<(i64, &RallyCityRef)> = cities
        .iter()
        .filter(|c| c.id != rally.id)
        .map(|c| (hex_distance(rally.q, rally.r, c.q, c.r), c))
        .filter(|(d, _)| *d <= search_radius)
        .collect();
    others.sort_by(|(da, ca), (db, cb)| da.cmp(db).then_with(|| cmp_js_str(&ca.id, &cb.id)));
    let mut out = Vec::with_capacity(others.len() + 1);
    out.push(RallyHexRef {
        q: rally.q,
        r: rally.r,
    });
    out.extend(
        others
            .into_iter()
            .map(|(_, c)| RallyHexRef { q: c.q, r: c.r }),
    );
    out
}

/// Web: `assignRallyTargets`. Przydziela kazdej jednostce heks zbiorki. Jednostki blizej
/// kotwicy (pierwszy kandydat) wybieraja pierwsze (odleglosc, potem id). Heks z zajetoscia
/// `>= max_per_hex` jest pomijany; gdy wszystkie pelne, jednostka dostaje kandydata najbardziej
/// preferowanego. `occupancy` nie jest modyfikowana.
pub fn assign_rally_targets(
    units: &[ConsolidationUnit],
    candidates: &[RallyHexRef],
    max_per_hex: i64,
    occupancy: &HashMap<(i64, i64), i64>,
) -> Vec<RallyAssignment> {
    let Some(&anchor) = candidates.first() else {
        return Vec::new();
    };
    if units.is_empty() {
        return Vec::new();
    }
    let mut counts = occupancy.clone();
    let mut ordered: Vec<&ConsolidationUnit> = units.iter().collect();
    ordered.sort_by(|a, b| {
        let da = hex_distance(a.q, a.r, anchor.q, anchor.r);
        let db = hex_distance(b.q, b.r, anchor.q, anchor.r);
        da.cmp(&db).then_with(|| cmp_js_str(&a.id, &b.id))
    });
    let mut out = Vec::with_capacity(ordered.len());
    for u in ordered {
        let target = candidates
            .iter()
            .find(|cand| counts.get(&(cand.q, cand.r)).copied().unwrap_or(0) < max_per_hex)
            .copied()
            .unwrap_or(anchor);
        *counts.entry((target.q, target.r)).or_insert(0) += 1;
        out.push(RallyAssignment {
            unit_id: u.id.clone(),
            target_q: target.q,
            target_r: target.r,
            at_rally: u.q == target.q && u.r == target.r,
        });
    }
    out
}

/// Web: `warArmyCount` - liczba armii wojennych = liczba roznych wrogich cywilizacji (min 1).
pub fn war_army_count(enemy_owner_ids: &[i64]) -> usize {
    let mut unique: Vec<i64> = enemy_owner_ids.to_vec();
    unique.sort_unstable();
    unique.dedup();
    unique.len().max(1)
}

/// Web: `splitIntoWarArmies`. Dzieli jednostki na `army_count` armii, zrownowazajac sume sily
/// (LPT: od najsilniejszej do armii o najmniejszej sumie; remisy -> nizszy indeks). Zwraca
/// niepuste armie; gdy jednostek jest mniej niz armii, powstaje tyle armii, ile jednostek.
pub fn split_into_war_armies<T: Clone>(
    units: &[T],
    army_count: i64,
    strength_of: impl Fn(&T) -> f64,
    id_of: impl Fn(&T) -> &str,
) -> Vec<Vec<T>> {
    if units.is_empty() {
        return Vec::new();
    }
    let k = army_count.max(1).min(units.len() as i64) as usize;
    let mut groups: Vec<(Vec<T>, f64)> = (0..k).map(|_| (Vec::new(), 0.0)).collect();
    let mut ordered: Vec<&T> = units.iter().collect();
    ordered.sort_by(|a, b| {
        strength_of(b)
            .partial_cmp(&strength_of(a))
            .unwrap_or(Ordering::Equal)
            .then_with(|| cmp_js_str(id_of(a), id_of(b)))
    });
    for u in ordered {
        let mut best = 0;
        for (i, group) in groups.iter().enumerate().skip(1) {
            if group.1 < groups[best].1 {
                best = i;
            }
        }
        groups[best].0.push(u.clone());
        groups[best].1 += strength_of(u);
    }
    groups
        .into_iter()
        .map(|(g, _)| g)
        .filter(|g| !g.is_empty())
        .collect()
}
