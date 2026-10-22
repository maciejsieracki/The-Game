//! Temat wlasciciel: R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1.
//! P6.M14 (R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1): port 1:1 modulow mapy weba (pin edb8fb56)
//! `gra/src/map/territory.ts` (1-145), `territory-work.ts` (1-166) i `range-hexes.ts` (1-115).
//!
//! Zrodlo wzorow, ktore juz istnieja w Rust (P6.3, `terrain.rs`), jest reuzywane, nie kopiowane:
//! `CityNode`, `axial_distance` (wersja i32), `city_range_for_population`, `city_territory_radius`
//! (promienie fort / posterunek / miasto czytane z `terrain-improvements.json` i `miasto-params.json`).
//! Ten modul nie zawiera zadnych liczb balansowych.
//!
//! Zaleznosci zewnetrzne, ktore NIE naleza do M14 (ZALOZENIE Z5 z P6-25 §9, wywolujacy dostarcza wynik):
//! - `cityBorderRadius` (game/culture-religion.ts, P6.16) -> parametr `border_radius`,
//! - `dominantReligion` (game/culture-religion.ts, P6.16) -> parametr `dominant_religion`,
//! - `computeLostToNearerSiblingByCity` (game/okolica.ts, P6.8) -> parametr `lost_to_sibling_by_city`.
//!
//! Wspolrzedne zapytan (`q`, `r`) sa `f64`, bo web operuje na `number`, a klucze `"q,r"` heksow mapy
//! sa parsowane przez JS `Number(...)` (patrz `js_number`); wezly (`CityNode`) maja `i32` jak reszta silnika.

use std::collections::{BTreeMap, BTreeSet};

pub use super::terrain::{
    axial_distance, city_range_for_population, city_territory_radius, CityNode,
};

// ---------------------------------------------------------------------------------------------
// Pomocnicze: semantyka JS wymagana przez 1:1 (Number(string), String.prototype.trim, Math.max)
// ---------------------------------------------------------------------------------------------

/// Znaki usuwane przez JS `String.prototype.trim` (WhiteSpace + LineTerminator wg ECMA-262).
/// Rozni sie od `char::is_whitespace` (Rust uwzglednia U+0085, JS nie; JS uwzglednia U+FEFF).
fn is_js_whitespace(c: char) -> bool {
    ('\u{2000}'..='\u{200A}').contains(&c)
        || matches!(
            c,
            '\u{0009}'
                | '\u{000A}'
                | '\u{000B}'
                | '\u{000C}'
                | '\u{000D}'
                | '\u{0020}'
                | '\u{00A0}'
                | '\u{1680}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202F}'
                | '\u{205F}'
                | '\u{3000}'
                | '\u{FEFF}'
        )
}

/// JS `String.prototype.trim`.
pub fn js_trim(s: &str) -> &str {
    s.trim_matches(is_js_whitespace)
}

fn radix_literal(body: &str, radix: u32) -> f64 {
    if body.is_empty() {
        return f64::NAN;
    }
    let mut acc = 0.0_f64;
    for c in body.chars() {
        match c.to_digit(radix) {
            Some(d) => acc = acc * f64::from(radix) + f64::from(d),
            None => return f64::NAN,
        }
    }
    acc
}

fn is_decimal_literal(s: &str) -> bool {
    let b = s.as_bytes();
    let mut i = 0;
    if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
        i += 1;
    }
    let int_start = i;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
    }
    let int_digits = i - int_start;
    let mut frac_digits = 0;
    if i < b.len() && b[i] == b'.' {
        i += 1;
        let fs = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        frac_digits = i - fs;
    }
    if int_digits == 0 && frac_digits == 0 {
        return false;
    }
    if i < b.len() && (b[i] == b'e' || b[i] == b'E') {
        i += 1;
        if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
            i += 1;
        }
        let es = i;
        while i < b.len() && b[i].is_ascii_digit() {
            i += 1;
        }
        if i == es {
            return false;
        }
    }
    i == b.len()
}

/// JS `Number(string)`: trim, pusty -> 0, `Infinity`, literaly 0x/0o/0b, dziesietne; inaczej NaN.
pub fn js_number(s: &str) -> f64 {
    let t = js_trim(s);
    if t.is_empty() {
        return 0.0;
    }
    match t {
        "Infinity" | "+Infinity" => return f64::INFINITY,
        "-Infinity" => return f64::NEG_INFINITY,
        _ => {}
    }
    if let Some(rest) = t.strip_prefix("0x").or_else(|| t.strip_prefix("0X")) {
        return radix_literal(rest, 16);
    }
    if let Some(rest) = t.strip_prefix("0o").or_else(|| t.strip_prefix("0O")) {
        return radix_literal(rest, 8);
    }
    if let Some(rest) = t.strip_prefix("0b").or_else(|| t.strip_prefix("0B")) {
        return radix_literal(rest, 2);
    }
    if is_decimal_literal(t) {
        return t.parse::<f64>().unwrap_or(f64::NAN);
    }
    f64::NAN
}

/// Wspolny fragment pętli webowych: `parts = key.split(','); q = Number(parts[0]); r = Number(parts[1]);
/// if (!Number.isFinite(q) || !Number.isFinite(r)) continue;`. `None` = `continue`.
pub fn parse_hex_key(key: &str) -> Option<(f64, f64)> {
    let mut parts = key.split(',');
    let q = parts.next().map_or(f64::NAN, js_number);
    let r = parts.next().map_or(f64::NAN, js_number);
    if q.is_finite() && r.is_finite() {
        Some((q, r))
    } else {
        None
    }
}

/// JS `Math.max(a, b)`: NaN jesli ktorykolwiek argument jest NaN (inaczej niz `f64::max`).
fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}

// ---------------------------------------------------------------------------------------------
// territory.ts
// ---------------------------------------------------------------------------------------------

/// Web `TerritoryNode` (`territory.ts:37`): `CityNode & { ownerId: number }`.
#[derive(Debug, Clone, PartialEq)]
pub struct TerritoryNode {
    pub node: CityNode,
    pub owner_id: i64,
}

impl TerritoryNode {
    pub fn new(node: CityNode, owner_id: i64) -> Self {
        Self { node, owner_id }
    }
}

/// Web `axialDistance` (`territory.ts:47`) na `number`: `(|dq| + |dr| + |ds|) / 2`, `s = -q - r`.
/// Wersja `f64` obsluguje klucze mapy parsowane przez `Number()`; dla liczb calkowitych daje to samo
/// co `terrain::axial_distance` (sprawdzane testem).
pub fn axial_distance_f64(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let a_s = -aq - ar;
    let b_s = -bq - br;
    ((aq - bq).abs() + (ar - br).abs() + (a_s - b_s).abs()) / 2.0
}

/// Web `citySightRadius` (`okolica.ts:55`, re-eksport w `territory.ts:57`):
/// `base = cityRangeForPopulation(pop); if (base <= 0) return 0; return base + cityBorderRadius(kultura)`.
/// `border_radius` = `cityBorderRadius` z P6.16 (wywolujacy; Z5). Web domyslnie `kulturaSkumulowana = 0`.
pub fn city_sight_radius(
    population: f64,
    kultura_skumulowana: f64,
    border_radius: &dyn Fn(f64) -> f64,
) -> f64 {
    let base = city_range_for_population(population);
    if base <= 0.0 {
        return 0.0;
    }
    base + border_radius(kultura_skumulowana)
}

/// Web `isInTerritory` (`territory.ts:92`): heks w zasiegu KTOREGOKOLWIEK wezla.
pub fn is_in_territory(q: impl Into<f64>, r: impl Into<f64>, nodes: &[CityNode]) -> bool {
    let (q, r) = (q.into(), r.into());
    nodes.iter().any(|node| {
        axial_distance_f64(q, r, f64::from(node.q), f64::from(node.r))
            <= city_territory_radius(node)
    })
}

/// Web `territoryOwnerAt` (`territory.ts:106`): najblizszy wezel w promieniu; remis -> pierwszy.
pub fn territory_owner_at(
    q: impl Into<f64>,
    r: impl Into<f64>,
    nodes: &[TerritoryNode],
) -> Option<i64> {
    let (q, r) = (q.into(), r.into());
    let mut best_owner: Option<i64> = None;
    let mut best_dist = f64::INFINITY;
    for tn in nodes {
        let radius = city_territory_radius(&tn.node);
        let dist = axial_distance_f64(q, r, f64::from(tn.node.q), f64::from(tn.node.r));
        if dist > radius {
            continue;
        }
        if dist < best_dist {
            best_dist = dist;
            best_owner = Some(tn.owner_id);
        }
    }
    best_owner
}

/// Web `isPlayerTerritoryHex` (`territory.ts:133`); web domyslnie `playerOwnerId = 0`.
pub fn is_player_territory_hex(
    q: impl Into<f64>,
    r: impl Into<f64>,
    player_nodes: &[CityNode],
    all_nodes: &[TerritoryNode],
    player_owner_id: i64,
) -> bool {
    let (q, r) = (q.into(), r.into());
    if !all_nodes.is_empty() {
        return territory_owner_at(q, r, all_nodes) == Some(player_owner_id);
    }
    is_in_territory(q, r, player_nodes)
}

// ---------------------------------------------------------------------------------------------
// territory-work.ts
// ---------------------------------------------------------------------------------------------

/// Podzbior webowego `City` uzywany przez `territory-work.ts` (`id`, `ownerId`, `q`, `r`, `population`,
/// `okolicaReczne?: Record<string, number>`). `None` w `okolica_reczne` = pole nieobecne (falsy).
#[derive(Debug, Clone, PartialEq)]
pub struct WorkCity {
    pub id: String,
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    pub population: f64,
    pub okolica_reczne: Option<BTreeMap<String, f64>>,
}

/// Web `buildTerritoryNodesFromCities` (`territory-work.ts:10`): `level` zawsze 1 (jak `CityNode::city`).
pub fn build_territory_nodes_from_cities(cities: &[WorkCity]) -> Vec<TerritoryNode> {
    cities
        .iter()
        .map(|c| TerritoryNode::new(CityNode::city(c.q, c.r, c.population), c.owner_id))
        .collect()
}

/// Web `isTerritoryHexOwnedBy` (`territory-work.ts:26`): brak wezlow -> `false` (fail-closed).
pub fn is_territory_hex_owned_by(
    q: impl Into<f64>,
    r: impl Into<f64>,
    owner_id: i64,
    territory_nodes: &[TerritoryNode],
) -> bool {
    if territory_nodes.is_empty() {
        return false;
    }
    territory_owner_at(q, r, territory_nodes) == Some(owner_id)
}

/// Web `makeTerritoryWorkableFilter` (`territory-work.ts:37`).
pub fn make_territory_workable_filter<'a>(
    territory_nodes: &'a [TerritoryNode],
    owner_id: i64,
    base_workable: Option<&'a dyn Fn(i32, i32) -> bool>,
) -> Box<dyn Fn(i32, i32) -> bool + 'a> {
    Box::new(move |q, r| {
        if let Some(base) = base_workable {
            if !base(q, r) {
                return false;
            }
        }
        is_territory_hex_owned_by(q, r, owner_id, territory_nodes)
    })
}

/// Web `cityCenterKeys` (`territory-work.ts:55`): klucze `"q,r"` centrow WSZYSTKICH miast.
pub fn city_center_keys(cities: &[WorkCity]) -> BTreeSet<String> {
    cities.iter().map(|c| format!("{},{}", c.q, c.r)).collect()
}

/// Web `isReczneKeyLegal` (`territory-work.ts:77`): kolejnosc warunkow 1:1 (centrum PRZED parsowaniem;
/// klucz niesparsowalny -> `true`).
pub fn is_reczne_key_legal(
    key: &str,
    owner_id: i64,
    centers: &BTreeSet<String>,
    territory_nodes: &[TerritoryNode],
    lost_for_city: Option<&BTreeSet<String>>,
) -> bool {
    if centers.contains(key) {
        return false;
    }
    let Some((q, r)) = parse_hex_key(key) else {
        return true;
    };
    if !is_territory_hex_owned_by(q, r, owner_id, territory_nodes) {
        return false;
    }
    if lost_for_city.is_some_and(|lost| lost.contains(key)) {
        return false;
    }
    true
}

/// Web `reconcileWorkedTilesForOwner` (`territory-work.ts:106`). Zwraca `true` gdy cokolwiek zmieniono.
/// Klucz niesparsowalny jest ZAWSZE zachowany (web: `continue` przed sprawdzeniem centrum/terytorium/lost).
pub fn reconcile_worked_tiles_for_owner(
    cities: &mut [WorkCity],
    territory_nodes: &[TerritoryNode],
    owner_id: i64,
    lost_to_sibling_by_city: Option<&BTreeMap<String, BTreeSet<String>>>,
) -> bool {
    let mut changed = false;
    let centers = city_center_keys(cities);
    for city in cities.iter_mut() {
        if city.owner_id != owner_id {
            continue;
        }
        let Some(current) = city.okolica_reczne.as_ref() else {
            continue;
        };
        let mut reczne = current.clone();
        let mut city_changed = false;
        let lost_for_city = lost_to_sibling_by_city.and_then(|m| m.get(&city.id));
        for key in current.keys() {
            let Some((q, r)) = parse_hex_key(key) else {
                continue;
            };
            if centers.contains(key.as_str()) {
                reczne.remove(key);
                city_changed = true;
                continue;
            }
            if !is_territory_hex_owned_by(q, r, owner_id, territory_nodes) {
                reczne.remove(key);
                city_changed = true;
                continue;
            }
            if lost_for_city.is_some_and(|lost| lost.contains(key.as_str())) {
                reczne.remove(key);
                city_changed = true;
            }
        }
        if city_changed {
            city.okolica_reczne = Some(reczne);
            changed = true;
        }
    }
    changed
}

/// Web `reconcileAllWorkedTiles` (`territory-work.ts:156`): po jednym przebiegu na wlasciciela.
pub fn reconcile_all_worked_tiles(
    cities: &mut [WorkCity],
    territory_nodes: &[TerritoryNode],
    lost_to_sibling_by_city: Option<&BTreeMap<String, BTreeSet<String>>>,
) {
    let owners: BTreeSet<i64> = cities.iter().map(|c| c.owner_id).collect();
    for oid in owners {
        reconcile_worked_tiles_for_owner(cities, territory_nodes, oid, lost_to_sibling_by_city);
    }
}

// ---------------------------------------------------------------------------------------------
// range-hexes.ts
// ---------------------------------------------------------------------------------------------

/// Web `RangeCityInput` (`range-hexes.ts:13`).
#[derive(Debug, Clone, PartialEq)]
pub struct RangeCityInput {
    pub id: String,
    pub q: i32,
    pub r: i32,
    pub owner_id: i64,
    pub population: f64,
    pub kultura: f64,
    pub is_outpost: Option<bool>,
    pub is_fort: Option<bool>,
}

/// Web `ReligionState` (`culture-religion.ts:616`): `counts` religia -> liczba wyznawcow.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ReligionState {
    pub counts: BTreeMap<String, f64>,
}

/// Web `DominantReligionResult.status`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DominantStatus {
    None,
    Mixed,
    Dominant,
}

/// Web `DominantReligionResult` (wynik `dominantReligion`, P6.16): `religion`, `status` (udzial nieuzywany tu).
#[derive(Debug, Clone, PartialEq)]
pub struct DominantReligion {
    pub religion: Option<String>,
    pub status: DominantStatus,
}

/// Web `filterHex?: (key, ownerId) => boolean` z `collectTerritoryHexKeysByOwner`.
pub type HexOwnerFilter<'a> = dyn Fn(&str, i64) -> bool + 'a;

/// Web `collectTerritoryHexKeysByOwner` (`range-hexes.ts:28`). `hex_keys` = `Object.keys(map.hexes)`.
pub fn collect_territory_hex_keys_by_owner(
    hex_keys: &[String],
    territory_nodes: &[TerritoryNode],
    filter_hex: Option<&HexOwnerFilter<'_>>,
) -> BTreeMap<i64, BTreeSet<String>> {
    let mut by_owner: BTreeMap<i64, BTreeSet<String>> = BTreeMap::new();
    for key in hex_keys {
        let Some((q, r)) = parse_hex_key(key) else {
            continue;
        };
        let Some(owner) = territory_owner_at(q, r, territory_nodes) else {
            continue;
        };
        if let Some(filter) = filter_hex {
            if !filter(key, owner) {
                continue;
            }
        }
        by_owner.entry(owner).or_default().insert(key.clone());
    }
    by_owner
}

/// Web `collectCultureRangeHexKeys` (`range-hexes.ts:53`); web domyslnie `ownerId = 0`.
pub fn collect_culture_range_hex_keys(
    hex_keys: &[String],
    cities: &[RangeCityInput],
    owner_id: i64,
    border_radius: &dyn Fn(f64) -> f64,
) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        let sight = city_sight_radius(c.population, c.kultura, border_radius);
        if sight <= 0.0 {
            continue;
        }
        for key in hex_keys {
            let Some((q, r)) = parse_hex_key(key) else {
                continue;
            };
            if axial_distance_f64(q, r, f64::from(c.q), f64::from(c.r)) <= sight {
                out.insert(key.clone());
            }
        }
    }
    out
}

/// Web `collectReligionRangeHexKeys` (`range-hexes.ts:75`); web domyslnie `ownerId = 0`.
/// `szerzenie_max_dystans` = `params.szerzenieMaxDystans` (`None` = pole nieobecne -> `?? 0`).
/// `dominant_religion` = `dominantReligion(rel, params)` z P6.16 (wywolujacy; Z5).
pub fn collect_religion_range_hex_keys(
    hex_keys: &[String],
    cities: &[RangeCityInput],
    city_relig: &BTreeMap<String, ReligionState>,
    state_religion: Option<&str>,
    szerzenie_max_dystans: Option<f64>,
    dominant_religion: &dyn Fn(&ReligionState) -> DominantReligion,
    owner_id: i64,
) -> BTreeSet<String> {
    let mut out = BTreeSet::new();
    let spread_extra = js_max(0.0, szerzenie_max_dystans.unwrap_or(0.0).floor());
    // `stateReligion?.trim() || null`: pusty lancuch po trim -> null.
    let state = state_religion.map(js_trim).filter(|s| !s.is_empty());

    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        let empty = ReligionState::default();
        let rel = city_relig.get(&c.id).unwrap_or(&empty);
        let dom = dominant_religion(rel);
        let has_state = state.is_some_and(|s| rel.counts.get(s).copied().unwrap_or(0.0) > 0.0);
        let is_dom = state.is_some_and(|s| {
            dom.religion.as_deref() == Some(s) && dom.status == DominantStatus::Dominant
        });
        if state.is_some() && !has_state && !is_dom && !rel.counts.is_empty() {
            continue;
        }

        let mut node = CityNode::city(c.q, c.r, c.population);
        node.is_outpost = c.is_outpost;
        node.is_fort = c.is_fort;
        let range_r = city_territory_radius(&node) + spread_extra;
        if range_r <= 0.0 {
            continue;
        }

        for key in hex_keys {
            let Some((q, r)) = parse_hex_key(key) else {
                continue;
            };
            if axial_distance_f64(q, r, f64::from(c.q), f64::from(c.r)) <= range_r {
                out.insert(key.clone());
            }
        }
    }
    out
}
