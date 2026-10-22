//! P6.1D: pule nazw miast per cywilizacja (web `gra/src/game/city-names-pool.ts`, pin `edb8fb56`).
//!
//! Dane pul (`city-names-pools.json`) sa juz w Rust (`data::civilizations::CityNamesPoolsFile`);
//! tu zyje logika wyboru kolejnej wolnej nazwy, sufiksow rzymskich i walidacji.
//! Stale (dlugosci pul, sufiksy rzymskie, teksty zastepcze) pochodza z
//! `data/derived/civ-bonus-city-names.json` (edytowalne), nie z literalow w kodzie.
//!
//! Domena wejsc: indeksy i numery rywali to liczby calkowite (`i64`), jak w uzyciu weba
//! (przydzial/numer miasta); wartosci niecalkowite webowego `number` nie wystepuja.

use std::collections::HashSet;

use crate::data::civilizations::CityNamesPoolsFile;
use crate::data::derived::civ_bonus_city_names;

/// Web `CityNamesPoolsData` = `Record<ikonaId, CityNamesPoolEntry>`; dane juz w Rust.
pub type CityNamesPoolsData = CityNamesPoolsFile;

/// Web `CivsForCityNames` (typ wejsciowy bez logiki): cywilizacje z `ikonaId` i `nazwyMiast`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CivForCityNames {
    pub ikona_id: Option<String>,
    pub nazwy_miast: Option<Vec<String>>,
}

/// Miasto jako para (wlasciciel, nazwa) - web `{ ownerId, name }`.
#[derive(Debug, Clone, PartialEq)]
pub struct CityNameRef {
    pub owner_id: i64,
    pub name: String,
}

/// Web `CITY_NAMES_POOL_REGULAR_LEN`.
pub fn city_names_pool_regular_len() -> usize {
    civ_bonus_city_names().dlugosc_regularna
}

/// Web `CITY_NAMES_POOL_STATE_LEN`.
pub fn city_names_pool_state_len() -> usize {
    civ_bonus_city_names().dlugosc_panstwa
}

/// Web `CITY_NAMES_POOL_COMMON_LEN` = regularna + panstwa.
pub fn city_names_pool_common_len() -> usize {
    city_names_pool_regular_len() + city_names_pool_state_len()
}

/// Web `NAZWY_KLASTRA_LEN` = dlugosc sufiksu miast-panstw.
pub fn nazwy_klastra_len() -> usize {
    city_names_pool_state_len()
}

/// Bezpieczny odczyt indeksu (web `nazwaKlastraAt`): pusta nazwa lub indeks poza zakresem => fallback.
pub fn nazwa_klastra_at(names: &[String], index: i64, fallback: &str) -> String {
    if index >= 0 {
        if let Some(name) = names.get(index as usize) {
            if !name.is_empty() {
                return name.clone();
            }
        }
    }
    fallback.to_owned()
}

/// Wspolna kolejka (pierwsze `COMMON_LEN` pozycji) albo pusta, gdy brak wpisu.
fn common_names<'a>(pools: &'a CityNamesPoolsData, ikona_id: &str) -> &'a [String] {
    match pools.get(ikona_id) {
        Some(entry) => {
            let all = entry.miasta_cywilizacji.as_slice();
            &all[..all.len().min(city_names_pool_common_len())]
        }
        None => &[],
    }
}

fn take_prefix(names: &[String], count: i64) -> HashSet<String> {
    let count = count.max(0) as usize;
    names.iter().take(count).cloned().collect()
}

/// Web `rivalPoolIndex`: indeks pozycji rywala przy wejsciu 1-based.
pub fn rival_pool_index(rival_index_1_based: i64, pool_len: i64) -> i64 {
    if pool_len <= 1 {
        return 0;
    }
    let rival_slots = pool_len - 1;
    ((rival_index_1_based.max(1) - 1) % rival_slots) + 1
}

/// Web `stateCityNameAt`: kompatybilny adapter nazwy z kolejki (indeks 0-based).
/// `used_names = None` => pierwsze `index` pozycji uznane za zajete.
pub fn state_city_name_at(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    index: i64,
    fallback: &str,
    used_names: Option<&HashSet<String>>,
) -> String {
    let common = common_names(pools, ikona_id);
    if common.is_empty() || index < 0 {
        return fallback.to_owned();
    }
    let implicit;
    let used = match used_names {
        Some(used) => used,
        None => {
            implicit = take_prefix(common, index);
            &implicit
        }
    };
    pick_next_city_name_from_names(common, used, Some(fallback))
}

/// Web `playerCapitalFromPool`: pierwszy wolny wpis wspolnej kolejki, fallback "Stolica" z tabeli.
pub fn player_capital_from_pool(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    used_names: Option<&HashSet<String>>,
) -> String {
    let empty = HashSet::new();
    pick_next_city_name(
        pools,
        ikona_id,
        used_names.unwrap_or(&empty),
        Some(civ_bonus_city_names().fallback_stolica.as_str()),
    )
}

/// Web `clusterRivalFromPool`: adapter rywala klastra do wspolnej kolejki (1-based).
pub fn cluster_rival_from_pool(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    rival_index_1_based: i64,
    used_names: Option<&HashSet<String>>,
) -> String {
    let common = common_names(pools, ikona_id);
    let fallback = format!(
        "{}{}",
        civ_bonus_city_names().fallback_rywal_prefiks,
        rival_index_1_based
    );
    if rival_index_1_based < 1 {
        return fallback;
    }
    let implicit;
    let used = match used_names {
        Some(used) => used,
        None => {
            implicit = take_prefix(common, rival_index_1_based);
            &implicit
        }
    };
    pick_next_city_name_from_names(common, used, Some(&fallback))
}

/// Web `foreignCapitalFromPool`: stolica obcego klastra, fallback = `ikonaId`.
pub fn foreign_capital_from_pool(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    used_names: Option<&HashSet<String>>,
) -> String {
    let empty = HashSet::new();
    pick_next_city_name(
        pools,
        ikona_id,
        used_names.unwrap_or(&empty),
        Some(ikona_id),
    )
}

/// Web `collectUsedCityNames`: nazwy miast wlascicieli danego typu cywilizacji.
/// Brakujacy `ownerIds[i]` => pozycja pominieta (web: `undefined`).
pub fn collect_used_city_names(
    city_names: &[String],
    owner_ids: &[i64],
    civ_type_for_owner: impl Fn(i64) -> String,
    target_civ_id: &str,
) -> HashSet<String> {
    let mut used = HashSet::new();
    for (i, name) in city_names.iter().enumerate() {
        if let Some(owner_id) = owner_ids.get(i) {
            if civ_type_for_owner(*owner_id) == target_civ_id && !name.is_empty() {
                used.insert(name.clone());
            }
        }
    }
    used
}

/// Web `collectUsedCityNamesFromCities`.
pub fn collect_used_city_names_from_cities(
    cities: &[CityNameRef],
    civ_type_for_owner: impl Fn(i64) -> String,
    target_civ_id: &str,
) -> HashSet<String> {
    let mut used = HashSet::new();
    for city in cities {
        if civ_type_for_owner(city.owner_id) == target_civ_id && !city.name.is_empty() {
            used.insert(city.name.clone());
        }
    }
    used
}

/// Web `cityNameWithSuffix`: "Ateny II", "Ateny III"... (powyzej zakresu tabeli: liczba arabska).
pub fn city_name_with_suffix(base: &str, ordinal: i64) -> String {
    if ordinal <= 1 {
        return base.to_owned();
    }
    let roman = &civ_bonus_city_names().rzymskie;
    let max_roman = roman.len() as i64 - 1;
    let suffix = if ordinal <= max_roman {
        roman[ordinal as usize].clone()
    } else {
        ordinal.to_string()
    };
    format!("{base} {suffix}")
}

/// Web `pickNextCityNameFromNames`: kanoniczny first-free z jednej kolejki nazw.
/// `fallback = None` => domyslny tekst zastepczy z tabeli ("Miasto").
/// Niczego nie mutuje; po wyczerpaniu kolejki wybiera pierwszy wolny sufiks.
pub fn pick_next_city_name_from_names(
    names: &[String],
    used_names: &HashSet<String>,
    fallback: Option<&str>,
) -> String {
    let fallback = fallback.unwrap_or(civ_bonus_city_names().fallback_miasto.as_str());
    for name in names {
        if !name.is_empty() && !used_names.contains(name) {
            return name.clone();
        }
    }

    let base = names
        .iter()
        .find(|n| !n.is_empty())
        .map_or(fallback, String::as_str);
    if !names.iter().any(|n| !n.is_empty()) && !used_names.contains(base) {
        return base.to_owned();
    }

    let mut ordinal = 2;
    loop {
        let candidate = city_name_with_suffix(base, ordinal);
        if used_names.contains(&candidate) || names.contains(&candidate) {
            ordinal += 1;
        } else {
            return candidate;
        }
    }
}

/// Web `pickNextCityName`: nastepna wolna nazwa z pelnej wspolnej puli.
pub fn pick_next_city_name(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    used_names: &HashSet<String>,
    fallback: Option<&str>,
) -> String {
    pick_next_city_name_from_names(common_names(pools, ikona_id), used_names, fallback)
}

/// Web `pickNextRegularCityName`: alias historyczny (bez fallbacku => "Miasto").
pub fn pick_next_regular_city_name(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    used_names: &HashSet<String>,
) -> String {
    pick_next_city_name(pools, ikona_id, used_names, None)
}

/// Web `suggestPlayerFoundCityName`. `player_owner_id` zostaje w sygnaturze dla zgodnosci
/// z call-site'ami weba (kolejka jest cywilizacyjna, argument nieuzywany).
pub fn suggest_player_found_city_name(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    cities: &[CityNameRef],
    civ_type_for_owner: impl Fn(i64) -> String,
    _player_owner_id: i64,
) -> String {
    let used = collect_used_city_names_from_cities(cities, civ_type_for_owner, ikona_id);
    pick_next_city_name(
        pools,
        ikona_id,
        &used,
        Some(civ_bonus_city_names().fallback_stolica.as_str()),
    )
}

/// Web `pickAiFoundCityName`. `ikona_id` jest nieuzywane (jak w webie): cywilizacje okresla
/// `civ_type_for_owner(owner_id)`.
pub fn pick_ai_found_city_name(
    pools: &CityNamesPoolsData,
    _ikona_id: &str,
    cities: &[CityNameRef],
    civ_type_for_owner: impl Fn(i64) -> String,
    owner_id: i64,
) -> String {
    let civ_id = civ_type_for_owner(owner_id);
    let used = collect_used_city_names_from_cities(cities, &civ_type_for_owner, &civ_id);
    pick_next_city_name(pools, &civ_id, &used, None)
}

/// Web `validateCityNamesPools`: walidacja wspolnego JSON (dev/test/CI). Zwraca komunikaty bledow.
pub fn validate_city_names_pools(
    pools: &CityNamesPoolsData,
    civs: &[CivForCityNames],
) -> Vec<String> {
    let mut errs = Vec::new();
    let civ_ids: Vec<&str> = civs
        .iter()
        .filter_map(|c| c.ikona_id.as_deref())
        .filter(|id| !id.is_empty())
        .collect();
    let common_len = city_names_pool_common_len();

    for cid in civ_ids {
        let Some(entry) = pools.get(cid) else {
            errs.push(format!("{cid}: brak wpisu w city-names-pools.json"));
            continue;
        };
        let common = &entry.miasta_cywilizacji;
        if common.len() != common_len {
            errs.push(format!(
                "{cid}: miasta_cywilizacji {} !== {common_len}",
                common.len()
            ));
        }
        let unique: HashSet<&String> = common.iter().collect();
        if unique.len() != common.len() {
            errs.push(format!(
                "{cid}: duplikaty we wspólnej liście miasta_cywilizacji"
            ));
        }
        let civ = civs.iter().find(|c| c.ikona_id.as_deref() == Some(cid));
        let civ_names: &[String] = civ.and_then(|c| c.nazwy_miast.as_deref()).unwrap_or(&[]);
        if civ_names != common.as_slice() {
            errs.push(format!("{cid}: civs.json.nazwyMiast ≠ miasta_cywilizacji"));
        }
    }
    errs
}

/// Web `resolveStateCityName`: nazwa panstwa-miasta z fallbackiem na `nazwyMiast` z civs.json.
pub fn resolve_state_city_name(
    pools: Option<&CityNamesPoolsData>,
    civs: &[CivForCityNames],
    ikona_id: &str,
    index: i64,
    fallback: &str,
    used_names: Option<&HashSet<String>>,
) -> String {
    if let Some(pools) = pools {
        if pools.contains_key(ikona_id) {
            return state_city_name_at(pools, ikona_id, index, fallback, used_names);
        }
    }
    let names: &[String] = civs
        .iter()
        .find(|c| c.ikona_id.as_deref() == Some(ikona_id))
        .and_then(|c| c.nazwy_miast.as_deref())
        .unwrap_or(&[]);
    if !names.is_empty() && index >= 0 {
        let implicit;
        let used = match used_names {
            Some(used) => used,
            None => {
                implicit = take_prefix(names, index);
                &implicit
            }
        };
        return pick_next_city_name_from_names(names, used, Some(fallback));
    }
    if index >= 0 {
        nazwa_klastra_at(names, index, fallback)
    } else {
        fallback.to_owned()
    }
}
