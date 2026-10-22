//! P6.1E: wspolna sekwencja nazw cywilizacji i przydzial cywilizacji AI (web, pin `edb8fb56`):
//! - `gra/src/game/civ-names.ts` -> modul glowny,
//! - `gra/src/game/civ-roster.ts` -> [`roster`].
//!
//! `civ-names.ts` buduje na `city-names-pool.ts`, portowanym w P6.1D ([`super::city_names`]);
//! re-eksporty weba (`export { ... } from './city-names-pool'`) sa tu `pub use` tych samych
//! funkcji Rust. Dane (`civs.json`, `city-names-pools.json`) sa juz w Rust; stale
//! (`MIASTA_CYWILIZACJI_LEN`, przesuniecie ziarna tasowania AI, awaryjny typ) leza w
//! `data/derived/civ-matrix-params.json`, a teksty zastepcze w `civ-bonus-city-names.json`.
//!
//! Domena wejsc: indeksy i numery rywali to liczby calkowite (`i64`), identyfikatory wlascicieli
//! to liczby calkowite, ziarno to liczba calkowita (modulo 2^32 jak `>>> 0`).
//!
//! `braz-access.ts` zostal juz zportowany w P6.1C (`super::start_position`); tu nie jest duplikowany.

use std::collections::HashSet;

use crate::data::civilizations::{CivsFile, CywilizacjeItem};
use crate::data::derived::{civ_bonus_city_names, civ_matrix_params};

use super::city_names as pool;
use super::city_names::CivForCityNames;

pub use super::city_names::{
    city_name_with_suffix, city_names_pool_common_len, city_names_pool_regular_len,
    collect_used_city_names_from_cities, nazwa_klastra_at, nazwy_klastra_len,
    pick_ai_found_city_name, pick_next_city_name, pick_next_city_name_from_names,
    pick_next_regular_city_name, suggest_player_found_city_name, CityNameRef, CityNamesPoolsData,
};

/// Web `CivDef` w zakresie czytanym przez `civ-names.ts`.
/// `None` odpowiada brakowi pola w obiekcie JS (`undefined`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CivNamesDef {
    pub ikona_id: Option<String>,
    /// Pole `Cywilizacja` (nazwa wyswietlana).
    pub cywilizacja: Option<String>,
    pub nazwy_miast: Option<Vec<String>>,
    /// Dawne pole `nazwyKlastra` (fallback widoku koncowych wpisow).
    pub nazwy_klastra: Option<Vec<String>>,
}

impl From<&CywilizacjeItem> for CivNamesDef {
    fn from(item: &CywilizacjeItem) -> Self {
        Self {
            ikona_id: Some(item.ikona_id.clone()),
            cywilizacja: Some(item.cywilizacja.clone()),
            nazwy_miast: Some(item.nazwy_miast.clone()),
            nazwy_klastra: None,
        }
    }
}

/// Web `CivsData.cywilizacje` z wczytanego `civs.json`.
pub fn civ_names_defs_from_file(civs: &CivsFile) -> Vec<CivNamesDef> {
    civs.cywilizacje.iter().map(CivNamesDef::from).collect()
}

fn for_city_names(civs: &[CivNamesDef]) -> Vec<CivForCityNames> {
    civs.iter()
        .map(|c| CivForCityNames {
            ikona_id: c.ikona_id.clone(),
            nazwy_miast: c.nazwy_miast.clone(),
        })
        .collect()
}

/// Web `MIASTA_CYWILIZACJI_LEN`.
pub fn miasta_cywilizacji_len() -> usize {
    civ_matrix_params().nazwy.miasta_cywilizacji_len
}

/// Web `findCivByIkonaId`: pierwsza cywilizacja o danym `ikonaId`.
pub fn find_civ_by_ikona_id<'a>(
    civs: &'a [CivNamesDef],
    ikona_id: &str,
) -> Option<&'a CivNamesDef> {
    civs.iter()
        .find(|c| c.ikona_id.as_deref() == Some(ikona_id))
}

/// JS `array.slice(start, end)` dla indeksow nieujemnych (poza zakresem => skrocenie).
fn js_slice(items: &[String], start: usize, end: usize) -> Vec<String> {
    let end = end.min(items.len());
    if start >= end {
        return Vec::new();
    }
    items[start..end].to_vec()
}

/// Web `getNazwyKlastra`: koncowe wpisy wspolnej listy (`nazwyMiast`), a bez niej `nazwyKlastra`.
pub fn get_nazwy_klastra(civs: &[CivNamesDef], ikona_id: &str) -> Vec<String> {
    let def = find_civ_by_ikona_id(civs, ikona_id);
    match def {
        Some(CivNamesDef {
            nazwy_miast: Some(names),
            ..
        }) => js_slice(
            names,
            city_names_pool_regular_len(),
            city_names_pool_common_len(),
        ),
        Some(CivNamesDef {
            nazwy_klastra: Some(names),
            ..
        }) => names.clone(),
        _ => Vec::new(),
    }
}

/// Web `getNazwyMiast` (prywatna): lista nazw miast cywilizacji albo pusta.
fn get_nazwy_miast(civs: &[CivNamesDef], ikona_id: &str) -> Vec<String> {
    find_civ_by_ikona_id(civs, ikona_id)
        .and_then(|def| def.nazwy_miast.clone())
        .unwrap_or_default()
}

fn pool_has<'a>(
    pools: Option<&'a CityNamesPoolsData>,
    ikona_id: &str,
) -> Option<&'a CityNamesPoolsData> {
    pools.filter(|p| p.contains_key(ikona_id))
}

/// Web `playerStartCityName`: stolica i kolejne miasta gracza - first-free ze wspolnej kolejki cywilizacji.
pub fn player_start_city_name(
    civs: &[CivNamesDef],
    player_civ_id: &str,
    pools: Option<&CityNamesPoolsData>,
    used_names: Option<&HashSet<String>>,
) -> String {
    if let Some(pools) = pool_has(pools, player_civ_id) {
        return pool::player_capital_from_pool(pools, player_civ_id, used_names);
    }
    let fallback = civ_bonus_city_names().fallback_stolica.as_str();
    let city_names = get_nazwy_miast(civs, player_civ_id);
    if !city_names.is_empty() {
        let empty = HashSet::new();
        return pick_next_city_name_from_names(
            &city_names,
            used_names.unwrap_or(&empty),
            Some(fallback),
        );
    }
    let names = get_nazwy_klastra(civs, player_civ_id);
    nazwa_klastra_at(&names, 0, fallback)
}

/// Web `clusterRivalCityName`: rywal klastra (numer 1-based) - first-free ze wspolnej kolejki.
pub fn cluster_rival_city_name(
    civs: &[CivNamesDef],
    player_civ_id: &str,
    rival_index_1_based: i64,
    pools: Option<&CityNamesPoolsData>,
    used_names: Option<&HashSet<String>>,
) -> String {
    if let Some(pools) = pool_has(pools, player_civ_id) {
        return pool::cluster_rival_from_pool(
            pools,
            player_civ_id,
            rival_index_1_based,
            used_names,
        );
    }
    let fallback = format!(
        "{}{}",
        civ_bonus_city_names().fallback_rywal_prefiks,
        rival_index_1_based
    );
    let city_names = get_nazwy_miast(civs, player_civ_id);
    if !city_names.is_empty() && rival_index_1_based >= 1 {
        let implicit: HashSet<String>;
        let used = match used_names {
            Some(used) => used,
            None => {
                implicit = city_names
                    .iter()
                    .take(rival_index_1_based as usize)
                    .cloned()
                    .collect();
                &implicit
            }
        };
        return pick_next_city_name_from_names(&city_names, used, Some(&fallback));
    }
    let names = get_nazwy_klastra(civs, player_civ_id);
    if names.is_empty() {
        return fallback;
    }
    let idx = if rival_index_1_based >= 1 {
        rival_index_1_based - 1
    } else {
        rival_index_1_based
    };
    nazwa_klastra_at(&names, idx, &fallback)
}

/// Web `foreignCapitalCityName`: stolica obcego klastra - first-free ze wspolnej kolejki.
pub fn foreign_capital_city_name(
    civs: &[CivNamesDef],
    typ_ikona_id: &str,
    pools: Option<&CityNamesPoolsData>,
    used_names: Option<&HashSet<String>>,
) -> String {
    if let Some(pools) = pool_has(pools, typ_ikona_id) {
        return pool::foreign_capital_from_pool(pools, typ_ikona_id, used_names);
    }
    let city_names = get_nazwy_miast(civs, typ_ikona_id);
    if !city_names.is_empty() {
        let empty = HashSet::new();
        return pick_next_city_name_from_names(
            &city_names,
            used_names.unwrap_or(&empty),
            Some(typ_ikona_id),
        );
    }
    let names = get_nazwy_klastra(civs, typ_ikona_id);
    nazwa_klastra_at(&names, 0, typ_ikona_id)
}

/// Web `stateCityName`: ujednolicony odczyt nazwy panstwa-miasta (indeks 0-based).
pub fn state_city_name(
    civs: &[CivNamesDef],
    ikona_id: &str,
    index: i64,
    fallback: &str,
    pools: Option<&CityNamesPoolsData>,
    used_names: Option<&HashSet<String>>,
) -> String {
    pool::resolve_state_city_name(
        pools,
        &for_city_names(civs),
        ikona_id,
        index,
        fallback,
        used_names,
    )
}

/// Web `civDisplayName`: nazwa nacji z JSON, a bez niej sam `ikonaId`.
pub fn civ_display_name(civs: &[CivNamesDef], ikona_id: &str) -> String {
    find_civ_by_ikona_id(civs, ikona_id)
        .and_then(|def| def.cywilizacja.clone())
        .unwrap_or_else(|| ikona_id.to_owned())
}

/// Web `validateNazwyKlastra`: kazdy typ ma wspolna liste (100+10) bez duplikatow.
pub fn validate_nazwy_klastra(civs: &[CivNamesDef]) -> Vec<String> {
    let common_len = city_names_pool_common_len();
    let mut errs = Vec::new();
    for civ in civs {
        // web: `c.ikonaId ?? c.Cywilizacja` (oba brakuja => napis "undefined").
        let id = civ
            .ikona_id
            .clone()
            .or_else(|| civ.cywilizacja.clone())
            .unwrap_or_else(|| "undefined".to_owned());
        let names: &[String] = civ.nazwy_miast.as_deref().unwrap_or(&[]);
        if names.len() != common_len {
            errs.push(format!(
                "{id}: oczekiwano {common_len} nazw, jest {}",
                names.len()
            ));
        }
        let unique: HashSet<&String> = names.iter().collect();
        if unique.len() != names.len() {
            errs.push(format!("{id}: duplikaty we wspólnej liście nazwMiast"));
        }
    }
    errs
}

/// Web `getMiastaCywilizacji`: widok pierwszych `MIASTA_CYWILIZACJI_LEN` wpisow (nie alokator nazw).
pub fn get_miasta_cywilizacji(pools: &CityNamesPoolsData, ikona_id: &str) -> Vec<String> {
    pools
        .get(ikona_id)
        .map(|entry| js_slice(&entry.miasta_cywilizacji, 0, miasta_cywilizacji_len()))
        .unwrap_or_default()
}

/// Web `getMiastaPanstwa`: widok koncowych wpisow (od `MIASTA_CYWILIZACJI_LEN` do konca wspolnej puli).
pub fn get_miasta_panstwa(pools: &CityNamesPoolsData, ikona_id: &str) -> Vec<String> {
    pools
        .get(ikona_id)
        .map(|entry| {
            js_slice(
                &entry.miasta_cywilizacji,
                miasta_cywilizacji_len(),
                city_names_pool_common_len(),
            )
        })
        .unwrap_or_default()
}

/// Web `pickAiFoundedCityName` (deprecated): pierwsza wolna nazwa z puli cywilizacji.
/// `_owner_city_count` zostaje w sygnaturze dla zgodnosci z call-site'ami weba.
pub fn pick_ai_founded_city_name(
    pools: &CityNamesPoolsData,
    ikona_id: &str,
    used_names: &HashSet<String>,
    _owner_city_count: i64,
) -> String {
    pick_next_city_name(pools, ikona_id, used_names, None)
}

/// Web `validateCityNamesPools(pools, civs)` z `civ-names.ts`: walidacja wspolnej puli + lustra `civs.json.nazwyMiast`.
pub fn validate_city_names_pools(pools: &CityNamesPoolsData, civs: &[CivNamesDef]) -> Vec<String> {
    pool::validate_city_names_pools(pools, &for_city_names(civs))
}

/// Web `civ-roster.ts`: losowy zestaw unikalnych typow AI przy starcie gry (E1-D-Q1=A).
pub mod roster {
    use std::collections::{BTreeMap, HashSet};

    use super::civ_matrix_params;
    use crate::domain::rng::Mulberry32;

    pub use crate::domain::unit_epoch::civ_ids_available_at_game_epoch;

    /// Jedno miejsce gracza w puli aktywnych typow (struktura gry: `1 + liczba AI`), nie parametr balansu.
    const PLAYER_SLOTS: i64 = 1;

    /// Web `seed >>> 0` (ToUint32 dla liczb calkowitych).
    pub fn to_uint32(seed: i64) -> u32 {
        seed.rem_euclid(1_i64 << 32) as u32
    }

    /// Web `makeRng(seed)`: strumien mulberry32 zgodny bit-w-bit (domena `Mulberry32`, P6.1).
    pub fn make_rng(seed: i64) -> Mulberry32 {
        Mulberry32::new(to_uint32(seed))
    }

    /// Web `civIdsFromRoster`: `ikonaId` w kolejnosci pliku, bez brakujacych i pustych.
    pub fn civ_ids_from_roster(cywilizacje: &[Option<String>]) -> Vec<String> {
        cywilizacje
            .iter()
            .map(|c| c.clone().unwrap_or_default())
            .filter(|id| !id.is_empty())
            .collect()
    }

    /// Web `AssignAiCivInput`.
    #[derive(Debug, Clone, PartialEq, Default)]
    pub struct AssignAiCivInput {
        pub all_civ_ids: Vec<String>,
        pub player_civ_id: String,
        pub ai_owner_ids: Vec<i64>,
        /// Cap unikalnych typow na mapie (3/5/7/9).
        pub aktywne_typy: i64,
        pub seed: i64,
        /// Typy AI wybrane przez gracza w kreatorze, w kolejnosci zaznaczenia; `None`/puste = losowo.
        pub preferred_civ_ids: Option<Vec<String>>,
    }

    /// Stabilne usuniecie duplikatow (web `[...new Set(list)]`).
    fn dedup_stable<I: IntoIterator<Item = String>>(items: I) -> Vec<String> {
        let mut seen = HashSet::new();
        items
            .into_iter()
            .filter(|item| seen.insert(item.clone()))
            .collect()
    }

    /// Tasowanie Fisher-Yates z webu: `i` od konca, `j = floor(rng() * (i + 1))`.
    fn seeded_shuffle(items: &[String], rng: &mut Mulberry32) -> Vec<String> {
        let mut shuffled = items.to_vec();
        for i in (1..shuffled.len()).rev() {
            let j = (rng.next_f64() * (i as f64 + 1.0)).floor() as usize;
            shuffled.swap(i, j);
        }
        shuffled
    }

    /// Web `pickActiveCivPool`: pula aktywnych typow (gracz + wybrane AI), preferowane maja pierwszenstwo.
    pub fn pick_active_civ_pool(
        all_civ_ids: &[String],
        player_civ_id: &str,
        aktywne_typy: i64,
        num_ai: i64,
        seed: i64,
        preferred_civ_ids: Option<&[String]>,
    ) -> Vec<String> {
        let pool = dedup_stable(all_civ_ids.iter().filter(|id| !id.is_empty()).cloned());
        if pool.is_empty() {
            return if player_civ_id.is_empty() {
                Vec::new()
            } else {
                vec![player_civ_id.to_owned()]
            };
        }

        let min_types = civ_matrix_params().roster.min_typow;
        let types_needed = min_types.max(aktywne_typy.min(PLAYER_SLOTS + num_ai));
        let others: Vec<String> = pool
            .iter()
            .filter(|id| id.as_str() != player_civ_id)
            .cloned()
            .collect();
        let mut rng = make_rng(seed);
        let shuffled = seeded_shuffle(&others, &mut rng);
        let need_others = ((types_needed - PLAYER_SLOTS).max(0) as usize).min(shuffled.len());

        let others_set: HashSet<&String> = others.iter().collect();
        let preferred_valid: Vec<String> = match preferred_civ_ids {
            Some(preferred) => dedup_stable(
                preferred
                    .iter()
                    .filter(|id| {
                        !id.is_empty() && id.as_str() != player_civ_id && others_set.contains(id)
                    })
                    .cloned(),
            ),
            None => Vec::new(),
        };
        let picked: Vec<String> = if preferred_valid.is_empty() {
            shuffled.iter().take(need_others).cloned().collect()
        } else {
            // Preferowane w kolejnosci zaznaczenia, do limitu - deterministyczne, bez rng.
            let mut chosen: Vec<String> = preferred_valid.into_iter().take(need_others).collect();
            if chosen.len() < need_others {
                let chosen_set: HashSet<String> = chosen.iter().cloned().collect();
                let missing = need_others - chosen.len();
                chosen.extend(
                    shuffled
                        .iter()
                        .filter(|id| !chosen_set.contains(*id))
                        .take(missing)
                        .cloned(),
                );
            }
            chosen
        };

        let cap = types_needed.max(0) as usize;
        let active: Vec<String> =
            if !player_civ_id.is_empty() && pool.iter().any(|id| id == player_civ_id) {
                std::iter::once(player_civ_id.to_owned())
                    .chain(picked)
                    .collect()
            } else if !picked.is_empty() {
                picked.into_iter().take(cap).collect()
            } else {
                vec![pool[0].clone()]
            };
        dedup_stable(active.into_iter().filter(|id| !id.is_empty()))
            .into_iter()
            .take(cap)
            .collect()
    }

    /// Web `rotatePreferredForRepairSeed`: deterministyczna rotacja `preferred` wg ziarna.
    pub fn rotate_preferred_for_repair_seed(preferred: &[String], seed: i64) -> Vec<String> {
        if preferred.len() <= 1 {
            return preferred.to_vec();
        }
        let mut rng = make_rng(seed);
        let offset = (rng.next_f64() * preferred.len() as f64).floor() as usize;
        if offset == 0 {
            return preferred.to_vec();
        }
        (0..preferred.len())
            .map(|i| preferred[(i + offset) % preferred.len()].clone())
            .collect()
    }

    /// Web `assignAiCivTypes`: mapa `ownerId -> ikonaId` dla AI (round-robin z potasowanej puli aktywnych).
    pub fn assign_ai_civ_types(input: &AssignAiCivInput) -> BTreeMap<i64, String> {
        let params = &civ_matrix_params().roster;
        let mut sorted = input.ai_owner_ids.clone();
        sorted.sort_unstable();
        let active_pool = pick_active_civ_pool(
            &input.all_civ_ids,
            &input.player_civ_id,
            input.aktywne_typy,
            sorted.len() as i64,
            input.seed,
            input.preferred_civ_ids.as_deref(),
        );
        let ai_types: Vec<String> = active_pool
            .into_iter()
            .filter(|id| *id != input.player_civ_id)
            .collect();

        let mut rng = make_rng(input.seed + params.przesuniecie_ziarna_tasowania_ai);
        let shuffled_ai = seeded_shuffle(&ai_types, &mut rng);

        let fallback = input
            .all_civ_ids
            .iter()
            .find(|id| !id.is_empty() && **id != input.player_civ_id)
            .cloned()
            .unwrap_or_else(|| params.awaryjny_typ.clone());
        let mut out = BTreeMap::new();
        for (idx, owner_id) in sorted.iter().enumerate() {
            let civ = if shuffled_ai.is_empty() {
                fallback.clone()
            } else {
                shuffled_ai[idx % shuffled_ai.len()].clone()
            };
            out.insert(*owner_id, civ);
        }
        out
    }
}
