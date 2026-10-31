//! P6.8H2 partia B (8H-P1b/P2): port `gra/src/game/resource-access.ts` — etykiety złóż,
//! potencjał (złoże w zasięgu) i dostęp aktywny miasta.
//!
//! Reużyte symbole (NIE duplikowane):
//! - `improvements::{improvement_catalog, normalize_improvement_key}` (web `IMPROVEMENTS`,
//!   `normalizeImprovementKey`),
//! - `building_costs::p6_7b::StockRecord`, `resource_access::owner_has_zloto_stock`,
//! - `resource_access::capital_labels::{zloze_label, surowiec_label_or_capitalized,
//!   city_panel_range_deposit_labels}` (partia B, runda 1),
//! - `mapgen::params::{is_deposit_visible, zloze_min_era_for, DepositEraHex}` (`deposit-era.ts`),
//! - `improvement_build::{deposit_allows_player_improvement, hex_keys_within_radius, BuildHex,
//!   BuildMap}` (`depositAllowsPlayerImprovement`, `hexKeysWithinRadius`),
//! - `territory::city_sight_radius` (`citySightRadius`), `terrain::axial_distance` (`hexDistance`),
//! - `start_position::{has_braz_access, EmpireStockArg, Overlay}` (`hasBrazAccess`).
//!
//! ZAŁOŻENIA (luki, nie cicha zmiana):
//! - Z1: `computeEmpireLivestockUnlocks` (`livestock-unlock.ts:113`) NIE jest w Rust
//!   (`grep -rn computeEmpireLivestockUnlocks rust-port/engine/src` = brak). Gałąź web
//!   `options.empireLivestockUnlocks ?? compute(...)` jest wejściem: wywołujący podaje
//!   `empire_livestock_unlocks` (`None` = web `undefined` bez obliczania). NASTĘPNA-PARTIA.
//! - Z2: `cityBorderRadius` (P6.16) wstrzykiwane jako `border_radius` (jak w `territory.rs`).
//! - Z3: `zlozeMinEra` pola heksu nieobecne w `BuildHex`: `zlozeMinEraFor` spada na tabelę
//!   metali / domyślną, co daje ten sam wynik co `ensureDepositEraMeta` (deposit-era.ts:30).
//! - Z4: `sortLabels` (`localeCompare(_, 'pl')`) przybliżone `pl_collation_cmp`; zweryfikowane
//!   wektorami z pinu dla całego uniwersum etykiet (`tests/p6_8h2_vectors/`).

use std::collections::{BTreeSet, HashSet};

use super::super::building_costs::p6_7b::StockRecord;
use super::super::improvement_build::{
    deposit_allows_player_improvement, hex_keys_within_radius, BuildHex, BuildMap,
};
use super::super::improvements::TerrainType;
use super::super::improvements::{improvement_catalog, normalize_improvement_key};
use super::super::mapgen::params::{is_deposit_visible, zloze_min_era_for, DepositEraHex};
use super::super::start_position::{has_braz_access, EmpireStockArg, Overlay};
use super::super::terrain::axial_distance;
use super::super::territory::city_sight_radius;
use super::capital_labels::{
    city_panel_range_deposit_labels, surowiec_label_or_capitalized, zloze_label,
};
use super::{is_js_trim_char, keys_normalized_only, owner_has_zloto_stock, PlacedMap};

/// Web `ERA_UI_NAMES` (`resource-access.ts`).
fn era_ui_name(era: i64) -> Option<&'static str> {
    match era {
        1 => Some("Kamień"),
        2 => Some("Brąz"),
        3 => Some("Żelazo"),
        _ => None,
    }
}

/// Web `hex.zloze?.trim().toLowerCase()`; `None` = pole `undefined`.
pub fn zloze_trim_lower(zloze: Option<&str>) -> Option<String> {
    zloze.map(|z| z.trim_matches(is_js_trim_char).to_lowercase())
}

/// Web `charAt(0).toUpperCase() + slice(1)` (BMP; pierwszy `char` zamiast jednostki UTF-16).
fn capitalize_first(s: &str) -> String {
    let mut chars = s.chars();
    match chars.next() {
        None => String::new(),
        Some(first) => first.to_uppercase().collect::<String>() + chars.as_str(),
    }
}

/// Web `isDepositVisible(hex, era)` dla `BuildHex` (bez `zlozeMinEra`, patrz Z3).
fn deposit_visible(hex: &BuildHex, era: i64) -> bool {
    let view = DepositEraHex {
        zloze: hex.zloze.clone(),
        zloze_min_era: None,
    };
    is_deposit_visible(&view, era)
}

/// Web `ZLOZE_LABEL[z] ?? capitalize(z)` (dla `hexHiddenDepositHint`).
fn zloze_name_or_capitalized(z: &str) -> String {
    zloze_label(z).map_or_else(|| capitalize_first(z), str::to_owned)
}

/// Web `labelForHex` (`resource-access.ts`, prywatna). Złoże ma pierwszeństwo nad nakładką.
/// Zob. `dyspozycje/rust-port/p6/P6-8H2-DOSTEP-ZASOBOW-B.md` (rozbieżność `constructor`/`toString`).
pub fn label_for_hex(hex: &BuildHex, era: i64) -> Option<String> {
    if let Some(z) = zloze_trim_lower(hex.zloze.as_deref()).filter(|z| !z.is_empty()) {
        if !deposit_visible(hex, era) {
            return None;
        }
        return Some(zloze_name_or_capitalized(&z));
    }
    match hex.overlay {
        Overlay::ZlozeGliny => Some("Glina".to_owned()),
        Overlay::ZlozeRudy => Some("Ruda".to_owned()),
        Overlay::ZlozeKonia => Some("Koń".to_owned()),
        _ => None,
    }
}

/// Web `hexDepositDisplayLabel` (eksport).
pub fn hex_deposit_display_label(hex: &BuildHex, era: i64) -> Option<String> {
    label_for_hex(hex, era)
}

/// Web `hexHiddenDepositHint` (eksport): złoże na mapie, ale epoka nie pozwala rozpoznać typu.
pub fn hex_hidden_deposit_hint(hex: &BuildHex, era: i64) -> Option<String> {
    let z = zloze_trim_lower(hex.zloze.as_deref()).filter(|z| !z.is_empty())?;
    if deposit_visible(hex, era) {
        return None;
    }
    let name = zloze_name_or_capitalized(&z);
    let view = DepositEraHex {
        zloze: hex.zloze.clone(),
        zloze_min_era: None,
    };
    let min_era = zloze_min_era_for(&view);
    let era_name = era_ui_name(min_era).map_or_else(|| format!("epoki {min_era}"), str::to_owned);
    Some(format!("{name} — ukryte (widoczne od epoki {era_name})"))
}

/// Web `parseSurowiecOdblokowany` wejście: pole JSON jako napis, lista albo brak.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SurowiecRaw<'a> {
    /// `undefined` / `null`.
    Absent,
    /// Web `string` (także legacy `"[\"bydlo\",...]"`).
    One(&'a str),
    /// Web `string[]`.
    List(&'a [String]),
}

/// Web `parseSurowiecOdblokowany` (`resource-access.ts`, prywatna).
pub fn parse_surowiec_odblokowany(raw: SurowiecRaw<'_>) -> Vec<String> {
    match raw {
        SurowiecRaw::Absent => Vec::new(),
        SurowiecRaw::List(list) => list.to_vec(),
        SurowiecRaw::One("") => Vec::new(),
        SurowiecRaw::One(raw) => {
            let trimmed = raw.trim_matches(is_js_trim_char);
            if trimmed.starts_with('[') {
                if let Ok(serde_json::Value::Array(items)) = serde_json::from_str(trimmed) {
                    return items
                        .iter()
                        .map(|item| match item {
                            serde_json::Value::String(s) => s.clone(),
                            other => other.to_string(),
                        })
                        .collect();
                }
            }
            vec![raw.to_owned()]
        }
    }
}

/// Web `labelsForImprovementUnlock(improvementKey)` (eksport). Klucz surowo (bez normalizacji),
/// jak w web `IMPROVEMENTS[improvementKey]`.
pub fn labels_for_improvement_unlock(improvement_key: Option<&str>) -> Vec<String> {
    let Some(key) = improvement_key.filter(|k| !k.is_empty()) else {
        return Vec::new();
    };
    let raw = improvement_catalog()
        .row(key)
        .and_then(|row| row.surowiec_odblokowany.clone());
    let keys = match raw.as_deref() {
        Some(s) => parse_surowiec_odblokowany(SurowiecRaw::One(s)),
        None => parse_surowiec_odblokowany(SurowiecRaw::Absent),
    };
    keys.iter()
        .map(|k| surowiec_label_or_capitalized(k))
        .filter(|label| !label.is_empty())
        .collect()
}

/// Web `DEPOSIT_LINKED_IMPROVEMENTS` (`resource-access.ts`).
const DEPOSIT_LINKED_IMPROVEMENTS: [&str; 6] = [
    "glinianka",
    "kopalnia_miedzi",
    "kopalnia_zelaza",
    "kopalnia_cyny",
    "warzelnia_soli",
    "stadnina",
];
/// Web `LIVESTOCK_NO_DEPOSIT` (hodowla Model B).
const LIVESTOCK_NO_DEPOSIT: [&str; 3] = ["bydlo", "owce", "lama"];
/// Web `LIVESTOCK_NOT_RESOURCE` (pastwiska nie są surowcem).
const LIVESTOCK_NOT_RESOURCE: [&str; 3] = ["bydlo", "owce", "lama"];
/// Web `NO_DEPOSIT_IMPROVEMENTS`.
const NO_DEPOSIT_IMPROVEMENTS: [&str; 2] = ["tartak", "kamieniolom"];

/// Web `improvementUnlockActiveOnHex` (eksport). Klucz normalizowany; nieznany → `false`.
pub fn improvement_unlock_active_on_hex(improvement_key: &str, hex: &BuildHex) -> bool {
    let Some(norm) = normalize_improvement_key(Some(improvement_key)) else {
        return false;
    };
    let norm = norm.as_str();
    if NO_DEPOSIT_IMPROVEMENTS.contains(&norm) {
        return true;
    }
    if LIVESTOCK_NO_DEPOSIT.contains(&norm) {
        return true;
    }
    if norm == "warzelnia_soli" {
        return hex.terrain == TerrainType::PlytkieMorze || hex.zloze.as_deref() == Some("sol");
    }
    if DEPOSIT_LINKED_IMPROVEMENTS.contains(&norm) {
        return deposit_allows_player_improvement(norm, hex);
    }
    true
}

/// Web `labelsForKopalniaMiedziOnHex` (prywatna).
fn labels_for_kopalnia_miedzi_on_hex(hex: &BuildHex) -> Vec<String> {
    let z = zloze_trim_lower(hex.zloze.as_deref());
    if z.as_deref() == Some("miedz") || hex.overlay == Overlay::ZlozeRudy {
        return vec![surowiec_label_or_capitalized("ruda")];
    }
    labels_for_improvement_unlock(Some("kopalnia_miedzi"))
}

/// Web `activeLabelsForImprovementOnHex` (prywatna).
fn active_labels_for_improvement_on_hex(improvement_key: &str, hex: &BuildHex) -> Vec<String> {
    let Some(norm) = normalize_improvement_key(Some(improvement_key)) else {
        return Vec::new();
    };
    if LIVESTOCK_NOT_RESOURCE.contains(&norm.as_str()) {
        return Vec::new();
    }
    if norm == "kopalnia_miedzi" {
        return labels_for_kopalnia_miedzi_on_hex(hex);
    }
    labels_for_improvement_unlock(Some(&norm))
}

/// Web `sortLabels` = `localeCompare(b, 'pl')` (przybliżenie, Z4).
/// Polski alfabet ma osobne litery z ogonkami tuż za podstawową: Ą za A, Ć za C, Ę za E, Ł za L,
/// Ń za N, Ó za O, Ś za S, Ź i Ż za Z (w tej kolejności). Wagi: litery `0x100 + 4*baza + k`,
/// pozostałe znaki (spacja, nawiasy, cyfry) wagą kodu Unicode (< 0x100, czyli przed literami).
fn pl_primary_key(s: &str) -> Vec<u32> {
    s.chars()
        .flat_map(char::to_lowercase)
        .map(|c| {
            let letter = |base: char, k: u32| 0x100 + 4 * (base as u32 - 'a' as u32) + k;
            match c {
                'ą' => letter('a', 1),
                'ć' => letter('c', 1),
                'ę' => letter('e', 1),
                'ł' => letter('l', 1),
                'ń' => letter('n', 1),
                'ó' => letter('o', 1),
                'ś' => letter('s', 1),
                'ź' => letter('z', 1),
                'ż' => letter('z', 2),
                'a'..='z' => letter(c, 0),
                other => other as u32,
            }
        })
        .collect()
}

/// Porządek: pierwszorzędny (`pl_primary_key`), potem wielkość liter (małe przed dużymi), potem bajty.
pub fn pl_collation_cmp(a: &str, b: &str) -> std::cmp::Ordering {
    use std::cmp::Ordering;
    match pl_primary_key(a).cmp(&pl_primary_key(b)) {
        Ordering::Equal => {}
        other => return other,
    }
    let cases = |s: &str| -> Vec<bool> { s.chars().map(char::is_uppercase).collect() };
    match cases(a).cmp(&cases(b)) {
        Ordering::Equal => a.cmp(b),
        other => other,
    }
}

fn sort_labels<I: IntoIterator<Item = String>>(labels: I) -> Vec<String> {
    let mut out: Vec<String> = labels.into_iter().collect();
    out.sort_by(|a, b| pl_collation_cmp(a, b));
    out
}

/// Pola miasta czytane przez `resource-access.ts` (`ResourceAccessCity`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ResourceAccessCity {
    pub q: i32,
    pub r: i32,
    pub population: f64,
    /// Web `kulturaSkumulowana` — `None` = `undefined`/`null` (web `?? 0`).
    pub kultura: Option<f64>,
}

/// Web `ResourceAccessOptions` (`ownerId` pominięte, Z1).
#[derive(Debug, Clone, Copy, Default)]
pub struct ResourceAccessOptions<'a> {
    /// Web `builtIds`.
    pub built_ids: Option<&'a [String]>,
    /// Web `empireLivestockUnlocks` (Z1).
    pub empire_livestock_unlocks: Option<&'a HashSet<String>>,
    /// Web `empireStock` (`None` = brak / legacy `boolean`).
    pub empire_stock: Option<&'a StockRecord>,
}

/// Web `CityResourceAccess`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CityResourceAccess {
    pub potential: Vec<String>,
    pub active: Vec<String>,
}

/// Web `hexesInCitySight` + `collectDepositPotential` (prywatne).
fn collect_deposit_potential(
    city: ResourceAccessCity,
    map: &BuildMap,
    era: i64,
    border_radius: &dyn Fn(f64) -> f64,
) -> BTreeSet<String> {
    let sight = city_sight_radius(city.population, city.kultura.unwrap_or(0.0), border_radius);
    let mut found = BTreeSet::new();
    if sight <= 0.0 {
        return found;
    }
    for key in hex_keys_within_radius(city.q, city.r, sight, map) {
        let Some(hex) = map.hex(&key) else {
            continue;
        };
        if axial_distance(city.q, city.r, hex.q, hex.r) > sight {
            continue;
        }
        if let Some(label) = label_for_hex(hex, era) {
            found.insert(label);
        }
    }
    found
}

/// Web `collectActiveAccess` (prywatna).
fn collect_active_access(
    city: ResourceAccessCity,
    map: &BuildMap,
    placed: Option<&PlacedMap<'_>>,
    border_radius: &dyn Fn(f64) -> f64,
    options: ResourceAccessOptions<'_>,
) -> BTreeSet<String> {
    let sight = city_sight_radius(city.population, city.kultura.unwrap_or(0.0), border_radius);
    let mut found = BTreeSet::new();

    if let Some(placed) = placed {
        if sight > 0.0 {
            for (hex_key, imp) in placed {
                let Some(hex) = map.hex(hex_key) else {
                    continue;
                };
                if axial_distance(city.q, city.r, hex.q, hex.r) > sight {
                    continue;
                }
                for key in keys_normalized_only(*imp) {
                    if !improvement_unlock_active_on_hex(&key, hex) {
                        continue;
                    }
                    for label in active_labels_for_improvement_on_hex(&key, hex) {
                        found.insert(label);
                    }
                }
            }
        }
    }

    if let Some(unlocks) = options.empire_livestock_unlocks {
        if unlocks.contains("kon") {
            found.insert(surowiec_label_or_capitalized("kon"));
        }
    }

    if let Some(stock) = options.empire_stock {
        if has_braz_access(EmpireStockArg::Stock(stock), options.built_ids) {
            found.insert(surowiec_label_or_capitalized("braz"));
        }
    }

    if owner_has_zloto_stock(options.empire_stock) {
        found.insert(surowiec_label_or_capitalized("zloto"));
    }

    found
}

/// Web `getCityResourceAccessForCity` (ABC-19 A): potencjał (złoże) vs dostęp aktywny.
/// `placed` = `None` (web `null`/`undefined`) albo lista wpisów w kolejności wstawiania.
pub fn get_city_resource_access_for_city(
    city: ResourceAccessCity,
    map: &BuildMap,
    placed: Option<&PlacedMap<'_>>,
    era: i64,
    border_radius: &dyn Fn(f64) -> f64,
    options: ResourceAccessOptions<'_>,
) -> CityResourceAccess {
    let active_set = collect_active_access(city, map, placed, border_radius, options);
    let potential_raw = collect_deposit_potential(city, map, era, border_radius);
    let potential_labels = potential_raw
        .iter()
        .filter(|label| !active_set.contains(*label))
        .map(String::as_str);
    CityResourceAccess {
        potential: city_panel_range_deposit_labels(potential_labels),
        active: sort_labels(active_set),
    }
}

/// Web `getResourceAccessForCity`: tylko aktywny dostęp.
pub fn get_resource_access_for_city(
    city: ResourceAccessCity,
    map: &BuildMap,
    placed: Option<&PlacedMap<'_>>,
    era: i64,
    border_radius: &dyn Fn(f64) -> f64,
    options: ResourceAccessOptions<'_>,
) -> Vec<String> {
    get_city_resource_access_for_city(city, map, placed, era, border_radius, options).active
}
