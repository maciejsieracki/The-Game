//! Temat wlasciciel: R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1.
//! P6.M16: port 1:1 reguly budowy ulepszen na mapie weba (pin edb8fb56)
//! `gra/src/map/improvement-build.ts` (linie 50-1558; plik ma 1569 linii, 1559-1569 nalezy do M15).
//!
//! Zasady portu (jak M14):
//! - Tabele balansowe i zbiory regul (zbiory terenow, sektory, warstwy zywnosci, bramki lasu, hodowla,
//!   domyslne) leza w `data/derived/ulepszenia-budowa.json` (parser: `data/derived.rs`,
//!   `ulepszenia_budowa()`); ten modul nie zawiera ich literalow. W kodzie zostaja wylacznie
//!   identyfikatory domeny (klucze ulepszen `ImprovementKey`, kody zlozy), tak jak warianty enumow.
//! - Klucze ulepszen sa tekstem (web: unia stringow, w tym `pastwisko`, `pole_irygowane`, ktorych nie ma
//!   enum `improvements::ImprovementKey`).
//! - Zaleznosci spoza zakresu M16, potrzebne wprost przez `createQualifier`, sa portowane lokalnie
//!   w najmniejszym zakresie i potwierdzone wektorami z uruchomionego weba (wlasciciele docelowi):
//!   `game/livestock-unlock.ts` (P6.17), `game/improvement-tech.ts` (P6.17), `game/okolica.ts::hexKeysWithinRadius`
//!   (P6.8), `map/road-movement.ts::hexHasRoad` (M15; tu przez `improvements::road_improvement_keys`).
//! - `ImprovementBuildState.playerOwnerId` (web, `string|null`) nie jest czytane przez ten plik weba
//!   (zero odwolan) - pole pominiete.
//! - Wejscie poza domena: nazwy wlasciwosci `Object.prototype` (`constructor`, `toString`...) jako klucz
//!   ulepszenia (web rzuca `TypeError` w `IMPROVEMENT_MULTI_TECH_REQ[key].every`); nieobslugiwane.
//! - Kolejnosc zbiorow JS (`Set`) jest zachowana tam, gdzie wynik zalezy od niej (`Vec` o unikalnych
//!   elementach); `Map<string,..>` bez zaleznosci od kolejnosci -> `BTreeMap`.

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet};
use std::sync::OnceLock;

use crate::data::derived::{ulepszenia_budowa, UlepszeniaBudowaFile};
use crate::data::terrain_map::TERRAIN_IMPROVEMENTS_JSON;
use crate::domain::improvements::{
    improvement_catalog, improvement_display_name, improvement_keys_for_hex,
    normalize_improvement_key, road_improvement_keys, scale_terrain_improvement_work_cost, HexLike,
    TerrainType,
};
use crate::domain::start_position::Overlay;
use crate::domain::terrain::{city_territory_radius, CityNode};
use crate::domain::territory::{
    axial_distance_f64, is_in_territory, is_player_territory_hex, is_territory_hex_owned_by,
    js_trim, territory_owner_at, TerritoryNode,
};

/// Identyfikatory domeny: klucze ulepszen (`ImprovementKey`, `Ulepszenie`) i kody zlozy (`hex.zloze`).
mod klucze {
    pub const FARMA: &str = "farma";
    pub const IRYGACJA: &str = "irygacja";
    pub const BYDLO: &str = "bydlo";
    pub const OWCE: &str = "owce";
    pub const LAMA: &str = "lama";
    pub const STADNINA: &str = "stadnina";
    pub const KAMIENIOLOM: &str = "kamieniolom";
    pub const DROGA: &str = "droga";
    pub const DROGA_BRUKOWANA: &str = "droga_brukowana";
    pub const POSTERUNEK: &str = "posterunek";
    pub const FORT: &str = "fort";
    pub const GLINIANKA: &str = "glinianka";
    pub const KOPALNIA_ZELAZA: &str = "kopalnia_zelaza";
    pub const KOPALNIA_MIEDZI: &str = "kopalnia_miedzi";
    pub const KOPALNIA_ZLOTA: &str = "kopalnia_zlota";
    pub const KOPALNIA_CYNY: &str = "kopalnia_cyny";
    pub const WYRAB: &str = "wyrab";
    pub const TARTAK: &str = "tartak";
    pub const OBOZ_LOWIECKI: &str = "oboz_lowiecki";
    pub const WARZELNIA_SOLI: &str = "warzelnia_soli";
    pub const TARASY: &str = "tarasy";
    pub const LODZIE_RYBACKIE: &str = "lodzie_rybackie";
    /// Wartosc `Ulepszenie.Brak` / `Nakladka.Brak` uzywana jako "pusta" warstwa.
    pub const BRAK: &str = "brak";
    pub const ZLOZE_SOL: &str = "sol";
    pub const ZLOZE_ZELAZO: &str = "zelazo";
    pub const ZLOZE_MIEDZ: &str = "miedz";
    pub const ZLOZE_RUDA: &str = "ruda";
    pub const ZLOZE_ZLOTO: &str = "zloto";
    pub const ZLOZE_CYNA: &str = "cyna";
    pub const ZLOZE_GLINA: &str = "glina";
}

use klucze as k;

// ---------------------------------------------------------------------------------------------
// Tabele (parsowanie JSON -> typy domenowe, jednorazowo)
// ---------------------------------------------------------------------------------------------

/// Wartosc webowa `TerenBazowy` -> teren Rust (`improvements::TerrainType`).
pub fn terrain_from_web_value(value: &str) -> Option<TerrainType> {
    match value {
        "laka" => Some(TerrainType::Laka),
        "rownina" => Some(TerrainType::Rownina),
        "wzgorza" => Some(TerrainType::Wzgorza),
        "gory" => Some(TerrainType::Gory),
        "plytkie_morze" => Some(TerrainType::PlytkieMorze),
        "morze" => Some(TerrainType::Morze),
        "pustynia" => Some(TerrainType::Pustynia),
        "polarny" => Some(TerrainType::Polarny),
        _ => None,
    }
}

struct Tables {
    file: &'static UlepszeniaBudowaFile,
    teren_ladu: Vec<TerrainType>,
    teren_tartak: Vec<TerrainType>,
    teren_farma: Vec<TerrainType>,
    teren_irygacja: Vec<TerrainType>,
    /// `TERRAIN_ALLOW`: brak wpisu albo `null` = `None`.
    teren_dozwolony: HashMap<String, Option<Vec<TerrainType>>>,
}

fn terrains(codes: &[String]) -> Vec<TerrainType> {
    codes
        .iter()
        .map(|c| terrain_from_web_value(c).unwrap_or_else(|| panic!("nieznany kod terenu {c}")))
        .collect()
}

fn tables() -> &'static Tables {
    static T: OnceLock<Tables> = OnceLock::new();
    T.get_or_init(|| {
        let file = ulepszenia_budowa();
        Tables {
            file,
            teren_ladu: terrains(&file.teren.ladu),
            teren_tartak: terrains(&file.teren.tartak),
            teren_farma: terrains(&file.teren.farma_plaski),
            teren_irygacja: terrains(&file.teren.irygacja),
            teren_dozwolony: file
                .teren_dozwolony
                .iter()
                .map(|(key, list)| (key.clone(), list.as_ref().map(|l| terrains(l))))
                .collect(),
        }
    })
}

fn has(list: &[String], key: &str) -> bool {
    list.iter().any(|item| item == key)
}

/// JS `s.toLowerCase().trim()`.
fn lower_trim(s: &str) -> String {
    js_trim(&s.to_lowercase()).to_owned()
}

fn terrain_allow(key: &str) -> Option<&'static Vec<TerrainType>> {
    tables().teren_dozwolony.get(key).and_then(Option::as_ref)
}

// ---------------------------------------------------------------------------------------------
// Model mapy / stanu (projekcja `GameMap`, `Hex`, `ImprovementBuildState`)
// ---------------------------------------------------------------------------------------------

/// Web `HexWithZloze` (`improvement-build.ts:48`) w zakresie czytanym przez ten plik:
/// `coords`, `terenBazowy`, `nakladka`, `ulepszenie`, `ulepszenia`, `zloze`, `rzeka.obecna`.
#[derive(Debug, Clone, PartialEq)]
pub struct BuildHex {
    pub q: i32,
    pub r: i32,
    pub terrain: TerrainType,
    pub overlay: Overlay,
    /// `hex.ulepszenie` (wartosc enumu `Ulepszenie`); `None` = pole nieobecne.
    pub ulepszenie: Option<String>,
    /// `hex.ulepszenia`; `None` = null/undefined.
    pub ulepszenia: Option<Vec<String>>,
    /// `hex.zloze` (runtime-owe pole); `None` = undefined.
    pub zloze: Option<String>,
    /// `hex.rzeka?.obecna`.
    pub river_present: bool,
}

impl BuildHex {
    pub fn new(q: i32, r: i32, terrain: TerrainType, overlay: Overlay) -> Self {
        Self {
            q,
            r,
            terrain,
            overlay,
            ulepszenie: None,
            ulepszenia: None,
            zloze: None,
            river_present: false,
        }
    }

    pub fn key(&self) -> String {
        hex_key(self.q, self.r)
    }

    fn as_hex_like(&self) -> HexLike {
        HexLike {
            ulepszenie: self.ulepszenie.clone(),
            ulepszenia: self.ulepszenia.clone(),
            nakladka: Some(self.overlay),
            zloze: self.zloze.clone(),
        }
    }
}

/// Klucz heksa `"q,r"`.
pub fn hex_key(q: i32, r: i32) -> String {
    format!("{q},{r}")
}

/// Web `GameMap` w zakresie czytanym przez ten plik: `hexes` (klucz `"q,r"` == `coords`, ZALOZENIE Z9
/// z M14) i `riverPaths`.
#[derive(Debug, Clone, Default)]
pub struct BuildMap {
    hexes: Vec<BuildHex>,
    index: HashMap<String, usize>,
    pub river_paths: Vec<Vec<(i32, i32)>>,
}

impl BuildMap {
    pub fn new(hexes: Vec<BuildHex>, river_paths: Vec<Vec<(i32, i32)>>) -> Self {
        let mut map = Self {
            hexes: Vec::new(),
            index: HashMap::new(),
            river_paths,
        };
        for hex in hexes {
            let key = hex.key();
            match map.index.get(&key) {
                Some(&i) => map.hexes[i] = hex,
                None => {
                    map.index.insert(key, map.hexes.len());
                    map.hexes.push(hex);
                }
            }
        }
        map
    }

    pub fn hex(&self, key: &str) -> Option<&BuildHex> {
        self.index.get(key).map(|&i| &self.hexes[i])
    }

    /// `Object.values(map.hexes)`.
    pub fn hexes(&self) -> &[BuildHex] {
        &self.hexes
    }
}

/// Wartosc `string | readonly string[]` z `placedImprovements`.
#[derive(Debug, Clone, PartialEq)]
pub enum PlacedLayers {
    One(String),
    Many(Vec<String>),
}

/// Web `ImprovementBuildState` (`improvement-build.ts:50`). Zbiory JS iterowane w kodzie
/// (`placedKeys`, `roadKeys`, `pendingUndoKeys`, `ownUnitHexKeys`) to `Vec` o unikalnych elementach
/// w kolejnosci wstawiania. `None` = pole nieobecne.
#[derive(Debug, Clone)]
pub struct ImprovementBuildState {
    pub map: BuildMap,
    pub city_nodes: Vec<CityNode>,
    pub placed_keys: Option<Vec<String>>,
    pub road_keys: Option<Vec<String>>,
    pub player_civ_archetype: Option<String>,
    pub player_era: Option<f64>,
    pub territory_nodes: Option<Vec<TerritoryNode>>,
    pub player_owner_id_num: Option<i64>,
    pub placed_improvements: Option<BTreeMap<String, PlacedLayers>>,
    pub researched_techs: Option<BTreeSet<String>>,
    pub clearing_hex_keys: Option<BTreeSet<String>>,
    pub pending_undo_keys: Option<Vec<String>>,
    pub trade_route_kon_unlocked: Option<bool>,
    pub horse_stock_available: Option<f64>,
    pub own_unit_hex_keys: Option<Vec<String>>,
}

impl ImprovementBuildState {
    pub fn new(map: BuildMap, city_nodes: Vec<CityNode>) -> Self {
        Self {
            map,
            city_nodes,
            placed_keys: None,
            road_keys: None,
            player_civ_archetype: None,
            player_era: None,
            territory_nodes: None,
            player_owner_id_num: None,
            placed_improvements: None,
            researched_techs: None,
            clearing_hex_keys: None,
            pending_undo_keys: None,
            trade_route_kon_unlocked: None,
            horse_stock_available: None,
            own_unit_hex_keys: None,
        }
    }
}

// ---------------------------------------------------------------------------------------------
// Las / farma / stadnina (improvement-build.ts:159-517)
// ---------------------------------------------------------------------------------------------

/// Web `stripImprovementsWhenForestRemoved` (`:212`).
pub fn strip_improvements_when_forest_removed(layers: &[String]) -> Vec<String> {
    let dependent = &tables().file.las.zaleznosc;
    layers
        .iter()
        .filter(|key| !has(dependent, key))
        .cloned()
        .collect()
}

/// Web `isLegacyFarmOnForestLayer` (`:255`).
pub fn is_legacy_farm_on_forest_layer(key: &str, nakladka: Overlay) -> bool {
    if nakladka != Overlay::Las {
        return false;
    }
    normalize_improvement_key(Some(key)).as_deref() == Some(k::FARMA)
}

/// Web `stripLegacyFarmOnForest` (`:261`).
pub fn strip_legacy_farm_on_forest(layers: &[String], nakladka: Overlay) -> Vec<String> {
    if nakladka != Overlay::Las {
        return layers.to_vec();
    }
    layers
        .iter()
        .filter(|key| !is_legacy_farm_on_forest_layer(key, nakladka))
        .cloned()
        .collect()
}

/// Web `LegacyFarmHexView` (`:276`).
#[derive(Debug, Clone, PartialEq)]
pub struct LegacyFarmHexView {
    pub nakladka: Overlay,
    pub ulepszenie: Option<String>,
    pub ulepszenia: Option<Vec<String>>,
}

/// Web `LegacyFarmOnForestChange` (`:283`).
#[derive(Debug, Clone, PartialEq)]
pub struct LegacyFarmOnForestChange {
    pub hex_key: String,
    pub before: Vec<String>,
    pub after: Vec<String>,
    pub from_placed: bool,
}

/// Web `LegacyFarmOnForestReport` (`:297`).
#[derive(Debug, Clone, PartialEq)]
pub struct LegacyFarmOnForestReport {
    pub changes: Vec<LegacyFarmOnForestChange>,
    pub removed: usize,
    pub scanned: usize,
    pub farms_on_open_terrain: usize,
}

/// Web `planLegacyFarmOnForestRemoval` (`:312`). `hexes` w kolejnosci `Object.keys`; `None` = heks
/// `undefined` (pomijany bez liczenia w `scanned`).
pub fn plan_legacy_farm_on_forest_removal(
    hexes: &[(String, Option<LegacyFarmHexView>)],
    placed: Option<&BTreeMap<String, Vec<String>>>,
) -> LegacyFarmOnForestReport {
    let mut changes = Vec::new();
    let mut scanned = 0;
    let mut farms_on_open_terrain = 0;
    for (hex_key, hex) in hexes {
        let Some(hex) = hex else { continue };
        scanned += 1;
        let from_placed_layers = placed.and_then(|p| p.get(hex_key));
        let before = match from_placed_layers {
            Some(layers) => layers.clone(),
            None => improvement_keys_for_hex(&HexLike {
                ulepszenie: hex.ulepszenie.clone(),
                ulepszenia: hex.ulepszenia.clone(),
                nakladka: Some(hex.nakladka),
                zloze: None,
            }),
        };
        if before.is_empty() {
            continue;
        }
        if hex.nakladka != Overlay::Las {
            if before
                .iter()
                .any(|key| normalize_improvement_key(Some(key)).as_deref() == Some(k::FARMA))
            {
                farms_on_open_terrain += 1;
            }
            continue;
        }
        let after = strip_legacy_farm_on_forest(&before, hex.nakladka);
        if after.len() == before.len() {
            continue;
        }
        changes.push(LegacyFarmOnForestChange {
            hex_key: hex_key.clone(),
            before,
            after,
            from_placed: from_placed_layers.is_some(),
        });
    }
    LegacyFarmOnForestReport {
        removed: changes.len(),
        changes,
        scanned,
        farms_on_open_terrain,
    }
}

/// Callback `onHexChanged(hexKey, layers)`.
pub type HexChangedCallback<'a> = &'a mut dyn FnMut(&str, &[String]);

/// Web `removeLegacyFarmsOnForest` (`:347`): aktualizuje rejestr `placed`, zglasza kazdy zmieniony heks.
pub fn remove_legacy_farms_on_forest(
    hexes: &[(String, Option<LegacyFarmHexView>)],
    placed: &mut BTreeMap<String, Vec<String>>,
    mut on_hex_changed: Option<HexChangedCallback<'_>>,
) -> LegacyFarmOnForestReport {
    let report = plan_legacy_farm_on_forest_removal(hexes, Some(placed));
    for ch in &report.changes {
        if ch.from_placed {
            if !ch.after.is_empty() {
                placed.insert(ch.hex_key.clone(), ch.after.clone());
            } else {
                placed.remove(&ch.hex_key);
            }
        }
        if let Some(callback) = on_hex_changed.as_mut() {
            callback(&ch.hex_key, &ch.after);
        }
    }
    report
}

/// Web `isFarmBaseTerrain` (`:387`).
pub fn is_farm_base_terrain(teren: TerrainType, nakladka: Overlay) -> bool {
    if nakladka == Overlay::Las {
        return false;
    }
    tables().teren_farma.contains(&teren)
}

/// Web `isStadninaBlockedOnForest` (`:414`): od P-STADNINA-LAS-NIEROZSTRZYGNIETE-Q1 zawsze `false`.
pub fn is_stadnina_blocked_on_forest(_key: &str, _nakladka: Overlay) -> bool {
    false
}

/// Web `isImprovementBlockedOnForest` (`:474`).
pub fn is_improvement_blocked_on_forest(key: &str, nakladka: Overlay) -> bool {
    if nakladka != Overlay::Las {
        return false;
    }
    let las = &tables().file.las;
    if has(&las.wspolistnieje, key) {
        return false;
    }
    if key == k::WYRAB {
        return false;
    }
    has(&las.zablokowane, key)
}

/// Web `getImprovementForestBlockHint` (`:494`).
pub fn get_improvement_forest_block_hint(key: &str) -> String {
    let texts = &tables().file.teksty;
    if key == k::BYDLO {
        return texts.podpowiedz_bydlo.clone();
    }
    format!(
        "{}{}",
        improvement_display_name(key),
        texts.podpowiedz_las_prefiks
    )
}

/// Web `isOwceBaseTerrain` (`:513`).
pub fn is_owce_base_terrain(teren: TerrainType, nakladka: Overlay) -> bool {
    if teren != TerrainType::Wzgorza {
        return false;
    }
    if nakladka == Overlay::ZlozeOwiec {
        return true;
    }
    nakladka == Overlay::Brak
}

// ---------------------------------------------------------------------------------------------
// Warstwy zywnosci, sektory, skutek budowy (improvement-build.ts:519-659)
// ---------------------------------------------------------------------------------------------

/// Web `FOOD_LAYER_KEYS.has` (`:519`).
pub fn is_food_layer_key(key: &str) -> bool {
    has(&tables().file.zywnosc.warstwy, key)
}

fn is_solo_food_key(key: &str) -> bool {
    has(&tables().file.zywnosc.solo, key)
}

fn sektor_of(key: &str) -> Option<&'static str> {
    tables()
        .file
        .sektory
        .przypisanie
        .get(key)
        .map(String::as_str)
}

fn is_exclusive_sektor(sektor: &str) -> bool {
    has(&tables().file.sektory.wykluczajace, sektor)
}

/// Web `ImprovementBuildImpact` (`:567`).
#[derive(Debug, Clone, PartialEq)]
pub struct ImprovementBuildImpact {
    pub removed_improvements: Vec<String>,
    pub removes_forest: bool,
}

/// Web `improvementsReplacedByBuild` (`:575`).
pub fn improvements_replaced_by_build(key: &str, existing: &[String]) -> Vec<String> {
    let mut removed: Vec<String> = Vec::new();
    let mut add = |item: &str| {
        if item != key && !removed.iter().any(|r| r == item) {
            removed.push(item.to_owned());
        }
    };

    if let Some(sekt) = sektor_of(key) {
        if is_exclusive_sektor(sekt) {
            for item in existing {
                if sektor_of(item) == Some(sekt) {
                    add(item);
                }
            }
        }
    }

    if is_solo_food_key(key) {
        for item in existing {
            if is_food_layer_key(item) {
                add(item);
            }
        }
    } else if is_food_layer_key(key) {
        for item in existing {
            if is_solo_food_key(item) {
                add(item);
            }
        }
    }

    removed
}

fn existing_after_simulated_removal(existing: &[String], removed: &[String]) -> Vec<String> {
    existing
        .iter()
        .filter(|item| !removed.contains(item))
        .cloned()
        .collect()
}

/// Web `computeImprovementBuildImpact` (`:617`): `None` = twarda blokada.
pub fn compute_improvement_build_impact(
    key: &str,
    teren: TerrainType,
    nakladka: Overlay,
    existing: &[String],
) -> Option<ImprovementBuildImpact> {
    if is_improvement_blocked_on_forest(key, nakladka) {
        return None;
    }
    if key == k::OWCE && !is_owce_base_terrain(teren, nakladka) {
        return None;
    }
    if key == k::OBOZ_LOWIECKI && nakladka != Overlay::Las {
        return None;
    }
    if key == k::OBOZ_LOWIECKI && !existing.iter().any(|item| item == k::TARTAK) {
        return None;
    }

    let removed_improvements = improvements_replaced_by_build(key, existing);
    let after = existing_after_simulated_removal(existing, &removed_improvements);

    if after.iter().any(|item| item == key) {
        return None;
    }
    let sekt = sektor_of(key);
    if key != k::DROGA
        && sekt.is_some_and(is_exclusive_sektor)
        && after.iter().any(|item| sektor_of(item) == sekt)
    {
        return None;
    }
    if is_food_layer_key(key) && !can_add_food_layer(&after, key) {
        return None;
    }

    Some(ImprovementBuildImpact {
        removed_improvements,
        removes_forest: false,
    })
}

/// Web `formatImprovementBuildImpactList` (`:662`).
pub fn format_improvement_build_impact_list(impact: &ImprovementBuildImpact) -> String {
    let texts = &tables().file.teksty;
    let mut parts: Vec<String> = impact
        .removed_improvements
        .iter()
        .map(|item| improvement_display_name(item))
        .collect();
    if impact.removes_forest {
        parts.push(texts.etykieta_lasu.clone());
    }
    parts.join(&texts.separator_listy)
}

// ---------------------------------------------------------------------------------------------
// Kopalnie, cywilizacje, zloza (improvement-build.ts:701-838)
// ---------------------------------------------------------------------------------------------

/// Web `MINE_IMPROVEMENT_KEYS.has` + `isMineImprovementKey` (`:709`, `:717`); `None` = null/undefined.
pub fn is_mine_improvement_key(key: Option<&str>) -> bool {
    key.is_some_and(|key| has(&tables().file.kopalnie, key))
}

/// Web `isTarasyCiv` (`:735`).
pub fn is_tarasy_civ(civ: Option<&str>) -> bool {
    let Some(civ) = civ.filter(|civ| !civ.is_empty()) else {
        return false;
    };
    let t = lower_trim(civ);
    let tarasy = &tables().file.tarasy_cywilizacje;
    tarasy.zawiera.iter().any(|part| t.contains(part.as_str())) || has(&tarasy.rowne, &t)
}

/// Web `hasBlockingDepositForFarm` (`:743`): wolne wspolistnienie zloz - zawsze `false`.
pub fn has_blocking_deposit_for_farm(_hex: &BuildHex) -> bool {
    false
}

/// Web `hexHasClayDeposit` (`:757`).
pub fn hex_has_clay_deposit(hex: &BuildHex) -> bool {
    hex.overlay == Overlay::ZlozeGliny
        || hex
            .zloze
            .as_deref()
            .is_some_and(|zloze| js_trim(zloze).to_lowercase() == k::ZLOZE_GLINA)
}

/// Web `hexHasDepositReserve` (`:763`).
pub fn hex_has_deposit_reserve(hex: &BuildHex) -> bool {
    if hex.zloze.as_deref().is_some_and(|zloze| !zloze.is_empty()) {
        return true;
    }
    hex.overlay != Overlay::Brak && hex.overlay != Overlay::Las
}

/// Web `depositAllowsPlayerImprovement` (`:770`).
pub fn deposit_allows_player_improvement(key: &str, hex: &BuildHex) -> bool {
    let nakladka = hex.overlay;
    let zloze = hex.zloze.as_deref();
    match key {
        k::GLINIANKA => hex_has_clay_deposit(hex),
        k::WARZELNIA_SOLI => zloze == Some(k::ZLOZE_SOL),
        k::KOPALNIA_MIEDZI => {
            zloze == Some(k::ZLOZE_MIEDZ)
                || nakladka == Overlay::ZlozeRudy
                || zloze == Some(k::ZLOZE_RUDA)
        }
        k::KOPALNIA_ZELAZA => zloze == Some(k::ZLOZE_ZELAZO),
        k::KOPALNIA_ZLOTA => zloze == Some(k::ZLOZE_ZLOTO),
        k::KOPALNIA_CYNY => zloze == Some(k::ZLOZE_CYNA),
        k::BYDLO => nakladka == Overlay::ZlozeBydla,
        k::OWCE => nakladka == Overlay::ZlozeOwiec,
        k::LAMA => nakladka == Overlay::ZlozeLamy,
        k::STADNINA => nakladka == Overlay::ZlozeKonia,
        k::OBOZ_LOWIECKI => nakladka == Overlay::Las,
        _ => false,
    }
}

/// Web `canAddFoodLayer` (`:808`).
pub fn can_add_food_layer(existing: &[String], new_key: &str) -> bool {
    let ex: Vec<&String> = existing
        .iter()
        .filter(|item| is_food_layer_key(item))
        .collect();
    if ex.iter().any(|item| item.as_str() == new_key) {
        return false;
    }

    if is_solo_food_key(new_key) {
        return ex.is_empty();
    }
    if ex.iter().any(|item| is_solo_food_key(item)) {
        return false;
    }

    let has_f = ex.iter().any(|item| item.as_str() == k::FARMA);
    let has_i = ex.iter().any(|item| item.as_str() == k::IRYGACJA);
    let has_b = ex.iter().any(|item| item.as_str() == k::BYDLO);

    match new_key {
        k::FARMA => {
            if ex.is_empty() {
                return true;
            }
            ex.len() == 1 && (has_i || has_b)
        }
        k::IRYGACJA | k::BYDLO => {
            if ex.is_empty() {
                return true;
            }
            has_f
        }
        _ => false,
    }
}

/// Web `hasAnimalDeposit` (`:912`).
pub fn has_animal_deposit(nakladka: Overlay) -> bool {
    has(&tables().file.nakladki_zwierzece, nakladka.web_value())
}

// ---------------------------------------------------------------------------------------------
// Zaleznosc: game/livestock-unlock.ts (P6.17) - zakres wymagany przez createQualifier
// ---------------------------------------------------------------------------------------------

/// Web `isIncaCiv` (`livestock-unlock.ts:42`).
pub fn is_inca_civ(civ: Option<&str>) -> bool {
    let Some(civ) = civ.filter(|civ| !civ.is_empty()) else {
        return false;
    };
    let t = lower_trim(civ);
    let hod = &tables().file.hodowla;
    has(&hod.cywilizacje_inkaskie, &t)
        || hod
            .cywilizacje_inkaskie_zawiera
            .iter()
            .any(|part| t.contains(part.as_str()))
}

/// Web `isNewWorldCiv` (`livestock-unlock.ts:52`): dzis = Inkowie.
pub fn is_new_world_civ(civ: Option<&str>) -> bool {
    is_inca_civ(civ)
}

/// Web `livestockKeyFromImprovement` (`livestock-unlock.ts:56`): klucz hodowli (`"bydlo"|"owce"|"lama"|"kon"`).
pub fn livestock_key_from_improvement(improvement_key: &str) -> Option<String> {
    let hod = &tables().file.hodowla;
    let raw = lower_trim(improvement_key);
    if has(&hod.klucze_konia, &raw) {
        return Some(hod.kon.clone());
    }
    let norm = normalize_improvement_key(Some(improvement_key))?;
    if let Some(unlocked) = hod.odblokowanie.get(&norm) {
        return Some(unlocked.clone());
    }
    if hod.odblokowanie.values().any(|value| *value == norm) || norm == hod.kon {
        return Some(norm);
    }
    None
}

/// Web `isLivestockAllowed` (`livestock-unlock.ts:111`).
pub fn is_livestock_allowed(civ: Option<&str>, improvement_key: &str, era: f64) -> bool {
    let hod = &tables().file.hodowla;
    let Some(lk) = livestock_key_from_improvement(improvement_key) else {
        return true;
    };
    if lk == hod.kon {
        return true;
    }
    if lk == hod.lama {
        return is_inca_civ(civ);
    }
    if is_new_world_civ(civ) && era < hod.nowy_swiat_min_epoka_hodowli {
        return false;
    }
    true
}

/// Web `isLivestockUnlockedForPlacement` (`livestock-unlock.ts:176`).
pub fn is_livestock_unlocked_for_placement(
    improvement_key: &str,
    nakladka: Overlay,
    trade_route_kon_unlocked: bool,
    horse_stock_available: f64,
) -> bool {
    let hod = &tables().file.hodowla;
    let norm = normalize_improvement_key(Some(improvement_key))
        .unwrap_or_else(|| improvement_key.to_owned());
    if norm == k::STADNINA {
        return nakladka == Overlay::ZlozeKonia
            || trade_route_kon_unlocked
            || horse_stock_available >= hod.stadnina_koszt_koni;
    }
    true
}

/// Web `isImprovementVisibleInBuildPanel` (`:725`); `era` domyslnie z tabeli (web `era = 1`).
pub fn is_improvement_visible_in_build_panel(
    key: &str,
    civ_type: Option<&str>,
    era: Option<f64>,
) -> bool {
    let era = era.unwrap_or(tables().file.domyslne.epoka_gracza);
    if livestock_key_from_improvement(key).is_none() {
        return true;
    }
    is_livestock_allowed(civ_type, key, era)
}

// ---------------------------------------------------------------------------------------------
// Zaleznosc: game/okolica.ts::hexKeysWithinRadius (P6.8)
// ---------------------------------------------------------------------------------------------

/// Web `hexKeysWithinRadius` (`okolica.ts:66`): klucze ISTNIEJACYCH heksow w dysku hex.
pub fn hex_keys_within_radius(cq: i32, cr: i32, rad: f64, map: &BuildMap) -> Vec<String> {
    let mut out = Vec::new();
    let r = if rad.is_finite() && rad > 0.0 {
        rad.floor() as i32
    } else {
        0
    };
    for dq in -r..=r {
        let lo = (-r).max(-dq - r);
        let hi = r.min(-dq + r);
        for dr in lo..=hi {
            let key = hex_key(cq + dq, cr + dr);
            if map.hex(&key).is_some() {
                out.push(key);
            }
        }
    }
    out
}

// ---------------------------------------------------------------------------------------------
// Zaleznosc: game/improvement-tech.ts (P6.17) - meta i bramka technologii
// ---------------------------------------------------------------------------------------------

/// Web `ImprovementMeta` (`improvement-tech.ts:14`) bez `epoka`/`clearing` (nieuzywane tutaj).
#[derive(Debug, Clone, PartialEq)]
pub struct ImprovementMeta {
    pub key: String,
    pub nazwa: String,
    pub koszt_praca: f64,
    pub tech_id: Option<String>,
    pub typ: String,
}

fn raw_tech(key: &str) -> Option<String> {
    static RAW: OnceLock<serde_json::Value> = OnceLock::new();
    let raw = RAW.get_or_init(|| {
        serde_json::from_str(TERRAIN_IMPROVEMENTS_JSON).expect("terrain-improvements.json")
    });
    raw.get(key)?.get("tech")?.as_str().map(str::to_owned)
}

/// Web `normalizeTech` (`improvement-tech.ts:88`).
fn normalize_tech(raw: Option<&str>) -> Option<String> {
    let tech = &tables().file.technologie;
    let raw = raw?;
    if has(&tech.brak_wymagania, raw) {
        return None;
    }
    Some(
        tech.kanoniczne
            .get(raw)
            .cloned()
            .unwrap_or_else(|| raw.to_owned()),
    )
}

/// Web `readMeta` / `getImprovementMeta` (`improvement-tech.ts:93`).
pub fn get_improvement_meta(key: &str) -> Option<ImprovementMeta> {
    if key.starts_with('_') {
        return None;
    }
    let row = improvement_catalog().row(key)?;
    let defaults = &tables().file.domyslne;
    Some(ImprovementMeta {
        key: key.to_owned(),
        nazwa: row.nazwa.clone().unwrap_or_else(|| key.to_owned()),
        koszt_praca: scale_terrain_improvement_work_cost(
            row.koszt_praca.unwrap_or(defaults.praca_meta_bez_wpisu),
            row.epoka,
        ),
        tech_id: normalize_tech(raw_tech(key).as_deref()),
        typ: row
            .typ
            .clone()
            .unwrap_or_else(|| defaults.typ_ulepszenia.clone()),
    })
}

/// Web `requiredTechIds` (`improvement-tech.ts:128`).
fn required_tech_ids(key: &str, meta: &ImprovementMeta) -> Option<Vec<String>> {
    if let Some(multi) = tables().file.technologie.wiele_tech.get(key) {
        if !multi.is_empty() {
            return Some(multi.clone());
        }
    }
    match &meta.tech_id {
        Some(tech) if !tech.is_empty() => Some(vec![tech.clone()]),
        _ => None,
    }
}

/// Web `isImprovementTechUnlocked` (`improvement-tech.ts:150`).
pub fn is_improvement_tech_unlocked(key: &str, researched: &BTreeSet<String>) -> bool {
    let Some(meta) = get_improvement_meta(key) else {
        return false;
    };
    match required_tech_ids(key, &meta) {
        None => true,
        Some(req) => req.iter().all(|tech| researched.contains(tech)),
    }
}

/// Web `readWorkCost` (`improvement-build.ts:900`).
pub fn read_work_cost(key: &str) -> f64 {
    let entry = improvement_catalog().row(key);
    scale_terrain_improvement_work_cost(
        entry
            .and_then(|row| row.koszt_praca)
            .unwrap_or(tables().file.domyslne.praca_bez_wpisu),
        entry.and_then(|row| row.epoka),
    )
}

// ---------------------------------------------------------------------------------------------
// Zaleznosc: map/road-movement.ts::hexHasRoad (M15)
// ---------------------------------------------------------------------------------------------

pub fn hex_has_road(hex: &BuildHex) -> bool {
    improvement_keys_for_hex(&hex.as_hex_like())
        .iter()
        .any(|key| road_improvement_keys().iter().any(|road| road == key))
}

// ---------------------------------------------------------------------------------------------
// Kwalifikacja (createQualifier, improvement-build.ts:840-1175)
// ---------------------------------------------------------------------------------------------

fn keys_on_placed_hex(imp: &PlacedLayers) -> Vec<String> {
    match imp {
        PlacedLayers::One(s) => {
            if s.is_empty() {
                Vec::new()
            } else {
                vec![s.clone()]
            }
        }
        PlacedLayers::Many(list) => list.clone(),
    }
}

/// Web `hexNeighbors` (`:882`), kolejnosc 1:1.
fn hex_neighbors(q: i32, r: i32) -> Vec<(i32, i32)> {
    vec![
        (q + 1, r),
        (q - 1, r),
        (q, r + 1),
        (q, r - 1),
        (q + 1, r - 1),
        (q - 1, r + 1),
    ]
}

/// Kwalifikator z `createQualifier` (`buildImprovementQualifier`, `:1169`).
pub struct Qualifier<'a> {
    state: &'a ImprovementBuildState,
    river_hex_set: HashSet<String>,
    player_era: f64,
    player_owner_id_num: i64,
    territory_nodes: &'a [TerritoryNode],
    placed_keys: HashSet<&'a str>,
    road_keys: HashSet<&'a str>,
    own_unit_hex_keys: HashSet<&'a str>,
    pending_undo: HashSet<&'a str>,
    trade_route_kon_unlocked: bool,
    horse_stock_available: f64,
}

/// Web `buildImprovementQualifier` (`:1169`).
pub fn build_improvement_qualifier(state: &ImprovementBuildState) -> Qualifier<'_> {
    Qualifier::new(state)
}

fn as_set(list: &Option<Vec<String>>) -> HashSet<&str> {
    list.iter().flatten().map(String::as_str).collect()
}

impl<'a> Qualifier<'a> {
    pub fn new(state: &'a ImprovementBuildState) -> Self {
        let defaults = &tables().file.domyslne;
        let mut river_hex_set = HashSet::new();
        for path in &state.map.river_paths {
            for (q, r) in path {
                river_hex_set.insert(hex_key(*q, *r));
            }
        }
        Self {
            state,
            river_hex_set,
            player_era: state.player_era.unwrap_or(defaults.epoka_gracza),
            player_owner_id_num: state
                .player_owner_id_num
                .unwrap_or(defaults.wlasciciel_gracza),
            territory_nodes: state.territory_nodes.as_deref().unwrap_or(&[]),
            placed_keys: as_set(&state.placed_keys),
            road_keys: as_set(&state.road_keys),
            own_unit_hex_keys: as_set(&state.own_unit_hex_keys),
            pending_undo: as_set(&state.pending_undo_keys),
            trade_route_kon_unlocked: state.trade_route_kon_unlocked.unwrap_or(false),
            horse_stock_available: state.horse_stock_available.unwrap_or(0.0),
        }
    }

    fn in_player_territory(&self, q: i32, r: i32) -> bool {
        if !self.territory_nodes.is_empty() {
            return is_territory_hex_owned_by(q, r, self.player_owner_id_num, self.territory_nodes);
        }
        is_player_territory_hex(
            q,
            r,
            &self.state.city_nodes,
            self.territory_nodes,
            self.player_owner_id_num,
        )
    }

    fn is_road_qualified(&self, q: i32, r: i32) -> bool {
        for (nq, nr) in hex_neighbors(q, r) {
            let nb_key = hex_key(nq, nr);
            if self.road_keys.contains(nb_key.as_str()) {
                return true;
            }
            if let Some(nb_hex) = self.state.map.hex(&nb_key) {
                if hex_has_road(nb_hex) {
                    return true;
                }
            }
            for node in &self.state.city_nodes {
                if nq == node.q && nr == node.r {
                    return true;
                }
            }
        }
        for node in &self.state.city_nodes {
            if axial_distance_f64(
                f64::from(q),
                f64::from(r),
                f64::from(node.q),
                f64::from(node.r),
            ) == 1.0
            {
                return true;
            }
        }
        false
    }

    fn is_river_adjacent(&self, q: i32, r: i32) -> bool {
        let key = hex_key(q, r);
        if self
            .state
            .map
            .hex(&key)
            .is_some_and(|hex| hex.river_present)
        {
            return true;
        }
        if self.river_hex_set.contains(&key) {
            return true;
        }
        for (nq, nr) in hex_neighbors(q, r) {
            if self.river_hex_set.contains(&hex_key(nq, nr)) {
                return true;
            }
        }
        false
    }

    /// Web `getHexLayers` (`:845`) razem z `buildPlacedImprovementsMap` (`:865`) ograniczonym do
    /// zapytanego heksa (wynik mapy zalezy tylko od wpisu tego klucza).
    fn hex_layers(&self, hex_key: &str, hex: &BuildHex) -> Vec<String> {
        let mut keys: Vec<String> = improvement_keys_for_hex(&hex.as_hex_like());
        let ext: Option<Vec<String>> = match &self.state.placed_improvements {
            Some(placed) => placed.get(hex_key).map(keys_on_placed_hex),
            None => {
                let from_hex = improvement_keys_for_hex(&hex.as_hex_like());
                if !from_hex.is_empty() {
                    Some(from_hex)
                } else {
                    let single = normalize_improvement_key(Some(
                        hex.ulepszenie.as_deref().unwrap_or(k::BRAK),
                    ));
                    single.map(|s| vec![s])
                }
            }
        };
        if let Some(ext) = ext {
            for item in ext {
                let n = lower_trim(&item);
                if !n.is_empty() && n != k::BRAK && !keys.contains(&n) {
                    keys.push(n);
                }
            }
        }
        keys
    }

    /// Wewnetrzna `qualifies(key, q, r)` z `createQualifier` (`:972`).
    pub fn qualifies(&self, key: &str, q: i32, r: i32) -> bool {
        let t = tables();
        let state = self.state;
        let hex_key_str = hex_key(q, r);

        let Some(hex) = state.map.hex(&hex_key_str) else {
            return false;
        };
        let teren = hex.terrain;
        let nakladka = hex.overlay;
        let zloze = hex.zloze.as_deref();
        let existing = self.hex_layers(&hex_key_str, hex);
        let has_existing = |item: &str| existing.iter().any(|e| e == item);

        if key == k::DROGA_BRUKOWANA {
            if !t.teren_ladu.contains(&teren) {
                return false;
            }
            if !self.in_player_territory(q, r) {
                return false;
            }
            let has_droga = has_existing(k::DROGA) || hex.ulepszenie.as_deref() == Some(k::DROGA);
            let has_bruk = has_existing(k::DROGA_BRUKOWANA)
                || hex.ulepszenie.as_deref() == Some(k::DROGA_BRUKOWANA);
            return has_droga && !has_bruk;
        }

        let pending_key = format!("{hex_key_str}:{key}");
        if self.pending_undo.contains(pending_key.as_str()) {
            return true;
        }

        if key != k::DROGA && has_existing(key) {
            return false;
        }
        if key == k::DROGA && self.placed_keys.contains(hex_key_str.as_str()) {
            return false;
        }

        let livestock_ok = |hex: &BuildHex| {
            is_livestock_allowed(state.player_civ_archetype.as_deref(), key, self.player_era)
                && is_livestock_unlocked_for_placement(
                    key,
                    hex.overlay,
                    self.trade_route_kon_unlocked,
                    self.horse_stock_available,
                )
        };

        let terrain_ok = match key {
            k::FARMA => {
                is_farm_base_terrain(teren, nakladka)
                    && !has_blocking_deposit_for_farm(hex)
                    && self.in_player_territory(q, r)
            }
            k::IRYGACJA => {
                t.teren_irygacja.contains(&teren)
                    && !has_blocking_deposit_for_farm(hex)
                    && self.in_player_territory(q, r)
                    && self.is_river_adjacent(q, r)
            }
            k::BYDLO => {
                t.teren_farma.contains(&teren)
                    && self.in_player_territory(q, r)
                    && livestock_ok(hex)
            }
            k::OWCE => {
                is_owce_base_terrain(teren, nakladka)
                    && self.in_player_territory(q, r)
                    && livestock_ok(hex)
            }
            k::LAMA => {
                teren != TerrainType::Pustynia
                    && terrain_allow(k::LAMA).is_some_and(|set| set.contains(&teren))
                    && self.in_player_territory(q, r)
                    && livestock_ok(hex)
            }
            k::STADNINA => {
                self.in_player_territory(q, r)
                    && (teren == TerrainType::Laka || teren == TerrainType::Rownina)
                    && livestock_ok(hex)
            }
            k::DROGA => {
                return t.teren_ladu.contains(&teren)
                    && self.in_player_territory(q, r)
                    && self.is_road_qualified(q, r)
            }
            k::POSTERUNEK | k::FORT => {
                let owner = if !self.territory_nodes.is_empty() {
                    territory_owner_at(q, r, self.territory_nodes)
                } else {
                    None
                };
                let rival_city_territory = owner.is_some_and(|o| o != self.player_owner_id_num);
                let own_territory =
                    owner == Some(self.player_owner_id_num) || self.in_player_territory(q, r);
                t.teren_ladu.contains(&teren)
                    && !rival_city_territory
                    && (own_territory || self.own_unit_hex_keys.contains(hex_key_str.as_str()))
            }
            k::GLINIANKA => hex_has_clay_deposit(hex) && self.in_player_territory(q, r),
            k::KOPALNIA_ZELAZA => {
                self.in_player_territory(q, r)
                    && (teren == TerrainType::Wzgorza || teren == TerrainType::Gory)
                    && zloze == Some(k::ZLOZE_ZELAZO)
            }
            k::WYRAB => {
                if self
                    .pending_undo
                    .contains(format!("{hex_key_str}:{}", k::WYRAB).as_str())
                {
                    return true;
                }
                !state
                    .clearing_hex_keys
                    .as_ref()
                    .is_some_and(|set| set.contains(&hex_key_str))
                    && nakladka == Overlay::Las
                    && self.in_player_territory(q, r)
            }
            k::TARTAK => {
                self.in_player_territory(q, r)
                    && nakladka == Overlay::Las
                    && t.teren_tartak.contains(&teren)
            }
            k::OBOZ_LOWIECKI => {
                self.in_player_territory(q, r)
                    && nakladka == Overlay::Las
                    && has_existing(k::TARTAK)
            }
            k::WARZELNIA_SOLI => {
                self.in_player_territory(q, r)
                    && (teren == TerrainType::PlytkieMorze || zloze == Some(k::ZLOZE_SOL))
            }
            k::KOPALNIA_MIEDZI => {
                self.in_player_territory(q, r)
                    && (teren == TerrainType::Wzgorza || teren == TerrainType::Gory)
                    && (zloze == Some(k::ZLOZE_MIEDZ)
                        || nakladka == Overlay::ZlozeRudy
                        || zloze == Some(k::ZLOZE_RUDA))
            }
            k::KOPALNIA_ZLOTA => {
                self.in_player_territory(q, r)
                    && (teren == TerrainType::Wzgorza || teren == TerrainType::Gory)
                    && zloze == Some(k::ZLOZE_ZLOTO)
            }
            k::KOPALNIA_CYNY => {
                self.in_player_territory(q, r)
                    && (teren == TerrainType::Wzgorza || teren == TerrainType::Gory)
                    && zloze == Some(k::ZLOZE_CYNA)
            }
            k::TARASY => {
                self.in_player_territory(q, r)
                    && !has_blocking_deposit_for_farm(hex)
                    && teren == TerrainType::Wzgorza
            }
            k::LODZIE_RYBACKIE => self.in_player_territory(q, r) && teren.is_water(),
            _ => {
                let allowed = terrain_allow(key);
                t.teren_ladu.contains(&teren)
                    && self.in_player_territory(q, r)
                    && allowed.is_none_or(|set| set.contains(&teren))
            }
        };

        if !terrain_ok {
            return false;
        }
        compute_improvement_build_impact(key, teren, nakladka, &existing).is_some()
    }
}

// ---------------------------------------------------------------------------------------------
// Galeria 3D (improvement-build.ts:1177-1292) - czyste reguly terenu / kombinacji
// ---------------------------------------------------------------------------------------------

/// Web `galleryTerrainEligible` (`:1181`).
pub fn gallery_terrain_eligible(key: &str, teren: TerrainType) -> bool {
    let t = tables();
    match key {
        k::FARMA | k::BYDLO | k::STADNINA => t.teren_farma.contains(&teren),
        k::IRYGACJA => t.teren_irygacja.contains(&teren),
        k::OWCE | k::TARASY => teren == TerrainType::Wzgorza,
        k::LAMA => {
            if teren == TerrainType::Pustynia || teren == TerrainType::Morze {
                return false;
            }
            terrain_allow(k::LAMA).is_some_and(|set| set.contains(&teren))
        }
        k::LODZIE_RYBACKIE => teren.is_water(),
        k::KAMIENIOLOM
        | k::KOPALNIA_MIEDZI
        | k::KOPALNIA_ZELAZA
        | k::KOPALNIA_ZLOTA
        | k::KOPALNIA_CYNY => teren == TerrainType::Wzgorza || teren == TerrainType::Gory,
        k::WYRAB => {
            teren == TerrainType::Laka
                || teren == TerrainType::Rownina
                || teren == TerrainType::Wzgorza
        }
        k::GLINIANKA => teren == TerrainType::Laka || teren == TerrainType::Rownina,
        k::OBOZ_LOWIECKI => !teren.is_water(),
        k::WARZELNIA_SOLI => teren == TerrainType::PlytkieMorze || teren == TerrainType::Rownina,
        k::DROGA | k::DROGA_BRUKOWANA | k::FORT => t.teren_ladu.contains(&teren),
        k::TARTAK => t.teren_tartak.contains(&teren),
        k::POSTERUNEK => !teren.is_water() && t.teren_ladu.contains(&teren),
        _ => false,
    }
}

fn gallery_keys(keys: &[String]) -> Vec<&str> {
    keys.iter()
        .map(String::as_str)
        .filter(|item| !item.is_empty() && *item != k::BRAK)
        .collect()
}

/// Web `galleryComboEligible` (`:1252`).
pub fn gallery_combo_eligible(keys: &[String], teren: TerrainType) -> bool {
    let ks = gallery_keys(keys);
    let inc = |key: &str| ks.contains(&key);
    if inc(k::FARMA) && inc(k::BYDLO) && inc(k::OWCE) {
        return false;
    }
    if inc(k::BYDLO) && inc(k::OWCE) && !inc(k::FARMA) {
        return false;
    }
    if inc(k::FARMA) && inc(k::OWCE) && !inc(k::BYDLO) {
        return false;
    }
    if inc(k::FARMA) && inc(k::IRYGACJA) {
        return gallery_terrain_eligible(k::FARMA, teren)
            && gallery_terrain_eligible(k::IRYGACJA, teren);
    }
    if inc(k::FARMA) && inc(k::BYDLO) {
        return gallery_terrain_eligible(k::FARMA, teren)
            && gallery_terrain_eligible(k::BYDLO, teren);
    }
    ks.iter().all(|item| gallery_terrain_eligible(item, teren))
}

/// Web `galleryComboShowModel` (`:1276`).
pub fn gallery_combo_show_model(keys: &[String], teren: TerrainType, preview_only: bool) -> bool {
    let ks = gallery_keys(keys);
    let inc = |key: &str| ks.contains(&key);
    if preview_only && inc(k::FARMA) && inc(k::BYDLO) && inc(k::OWCE) {
        return gallery_combo_eligible(&[k::FARMA.to_owned(), k::BYDLO.to_owned()], teren);
    }
    if preview_only && inc(k::BYDLO) && inc(k::OWCE) && !inc(k::FARMA) {
        return gallery_terrain_eligible(k::BYDLO, teren);
    }
    if preview_only && inc(k::FARMA) && inc(k::OWCE) && !inc(k::BYDLO) {
        return teren == TerrainType::Wzgorza || gallery_terrain_eligible(k::FARMA, teren);
    }
    gallery_combo_eligible(keys, teren)
}

// ---------------------------------------------------------------------------------------------
// Podpowiedzi UX tartak / wyrab (improvement-build.ts:1294-1405)
// ---------------------------------------------------------------------------------------------

/// Web `ForestBuildKey` (`:1298`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ForestBuildKey {
    Tartak,
    Wyrab,
}

/// Web `ForestPlacementScan` (`:1300`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ForestPlacementScan {
    pub las_in_player_territory: usize,
    pub qualifying_in_player_territory: usize,
    pub las_outside_player_reach: usize,
    pub las_in_enemy_territory: usize,
    pub las_wrong_terrain_for_tartak: usize,
    pub las_being_cleared: usize,
}

/// Web `scanForestPlacement` (`:1315`).
pub fn scan_forest_placement(
    state: &ImprovementBuildState,
    key: ForestBuildKey,
) -> ForestPlacementScan {
    let player_owner_id_num = state
        .player_owner_id_num
        .unwrap_or(tables().file.domyslne.wlasciciel_gracza);
    let territory_nodes: &[TerritoryNode] = state.territory_nodes.as_deref().unwrap_or(&[]);
    let mut out = ForestPlacementScan::default();

    for hex in state.map.hexes() {
        if hex.overlay != Overlay::Las {
            continue;
        }
        let (q, r) = (hex.q, hex.r);
        let hex_key_str = hex_key(q, r);
        let in_reach = !state.city_nodes.is_empty() && is_in_territory(q, r, &state.city_nodes);
        if !in_reach {
            out.las_outside_player_reach += 1;
            continue;
        }
        let is_player = is_player_territory_hex(
            q,
            r,
            &state.city_nodes,
            territory_nodes,
            player_owner_id_num,
        );
        if !is_player {
            out.las_in_enemy_territory += 1;
            continue;
        }
        out.las_in_player_territory += 1;

        if key == ForestBuildKey::Tartak && !tables().teren_tartak.contains(&hex.terrain) {
            out.las_wrong_terrain_for_tartak += 1;
            continue;
        }
        if key == ForestBuildKey::Wyrab
            && state
                .clearing_hex_keys
                .as_ref()
                .is_some_and(|set| set.contains(&hex_key_str))
        {
            out.las_being_cleared += 1;
            continue;
        }
        out.qualifying_in_player_territory += 1;
    }
    out
}

/// Powod z `getForestBuildBlockReason` (`:1367`); web zwraca tekst PL (UI), tu jest wariant w kolejnosci
/// `return` w zrodle: 1 `NoCity`, 2 `AllBeingCleared`, 3 `TartakWrongTerrainAll`, 4 `TartakWrongTerrainSome`,
/// 5 `EnemyTerritory`, 6 `OutsideReach`, 7 `NoForestInTerritory`, 8 `Generic`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ForestBlockReason {
    NoCity,
    AllBeingCleared,
    TartakWrongTerrainAll,
    TartakWrongTerrainSome,
    EnemyTerritory,
    OutsideReach,
    NoForestInTerritory,
    Generic,
}

/// Web `getForestBuildBlockReason` (`:1367`); `None` = `null` (jest heks do postawienia).
pub fn get_forest_build_block_reason(
    state: &ImprovementBuildState,
    key: ForestBuildKey,
) -> Option<ForestBlockReason> {
    if state.city_nodes.is_empty() {
        return Some(ForestBlockReason::NoCity);
    }

    let scan = scan_forest_placement(state, key);

    if scan.qualifying_in_player_territory > 0 {
        return None;
    }

    if key == ForestBuildKey::Wyrab
        && scan.las_in_player_territory > 0
        && scan.las_being_cleared >= scan.las_in_player_territory
    {
        return Some(ForestBlockReason::AllBeingCleared);
    }

    if key == ForestBuildKey::Tartak
        && scan.las_wrong_terrain_for_tartak > 0
        && scan.qualifying_in_player_territory == 0
    {
        if scan.las_wrong_terrain_for_tartak >= scan.las_in_player_territory {
            return Some(ForestBlockReason::TartakWrongTerrainAll);
        }
        return Some(ForestBlockReason::TartakWrongTerrainSome);
    }

    if scan.las_in_enemy_territory > 0 && scan.las_in_player_territory == 0 {
        return Some(ForestBlockReason::EnemyTerritory);
    }

    if scan.las_outside_player_reach > 0 && scan.las_in_player_territory == 0 {
        return Some(ForestBlockReason::OutsideReach);
    }

    if scan.las_in_player_territory == 0 {
        return Some(ForestBlockReason::NoForestInTerritory);
    }

    Some(ForestBlockReason::Generic)
}

// ---------------------------------------------------------------------------------------------
// Fabryka API (createImprovementBuildApi, improvement-build.ts:1411-1557)
// ---------------------------------------------------------------------------------------------

/// Web `ImprovementBuildRequest` (`:122`; `type: 'buildImprovement'` jest stala).
#[derive(Debug, Clone, PartialEq)]
pub struct ImprovementBuildRequest {
    pub key: String,
    pub q: i32,
    pub r: i32,
    pub hex_key: String,
    pub koszt_praca: f64,
    pub action: String,
}

/// Callbacki frontu budowy ulepszen (web `ImprovementBuildCallbacks`, bez `listTypes` - patrz dokument).
pub struct ImprovementBuildApi<'a> {
    qualifier: Qualifier<'a>,
    state: &'a ImprovementBuildState,
    candidate_hex_keys: Vec<String>,
    researched: BTreeSet<String>,
    active_key: Option<String>,
}

/// Web `createImprovementBuildApi` (`:1415`); `active_key` = `mode.activeKey`.
pub fn create_improvement_build_api<'a>(
    state: &'a ImprovementBuildState,
    active_key: Option<&str>,
) -> ImprovementBuildApi<'a> {
    let mut seen: HashSet<String> = HashSet::new();
    let mut candidates: Vec<String> = Vec::new();
    let mut add = |key: String| {
        if seen.insert(key.clone()) {
            candidates.push(key);
        }
    };
    for node in &state.city_nodes {
        let rad = city_territory_radius(node) + tables().file.domyslne.pierscien_kandydatow;
        for key in hex_keys_within_radius(node.q, node.r, rad, &state.map) {
            add(key);
        }
    }
    for key in state.road_keys.iter().flatten() {
        add(key.clone());
    }
    for key in state.placed_keys.iter().flatten() {
        add(key.clone());
    }
    for composite in state.pending_undo_keys.iter().flatten() {
        if let Some(idx) = composite.rfind(':') {
            if idx > 0 {
                add(composite[..idx].to_owned());
            }
        }
    }
    for key in state.own_unit_hex_keys.iter().flatten() {
        add(key.clone());
    }

    ImprovementBuildApi {
        qualifier: Qualifier::new(state),
        state,
        candidate_hex_keys: candidates,
        researched: state.researched_techs.clone().unwrap_or_default(),
        active_key: active_key.map(str::to_owned),
    }
}

impl ImprovementBuildApi<'_> {
    /// Zbior kandydatow `candidateHexKeys` (kolejnosc wstawiania).
    pub fn candidate_hex_keys(&self) -> &[String] {
        &self.candidate_hex_keys
    }

    /// Web: `handleHexClick` istnieje tylko gdy `mode.activeKey` jest ustawiony.
    pub fn has_hex_click_handler(&self) -> bool {
        self.active_key
            .as_deref()
            .is_some_and(|key| !key.is_empty())
    }

    /// Web `getWorkCost`.
    pub fn get_work_cost(&self, key: &str) -> f64 {
        get_improvement_meta(key)
            .map(|meta| meta.koszt_praca)
            .unwrap_or_else(|| read_work_cost(key))
    }

    /// Web `canBuild`.
    pub fn can_build(&self, key: &str, q: i32, r: i32) -> bool {
        self.qualifier.qualifies(key, q, r)
    }

    /// Web `getQualifyingHexes`.
    pub fn get_qualifying_hexes(&self, key: &str) -> Vec<(i32, i32)> {
        let mut out = Vec::new();
        for hk in &self.candidate_hex_keys {
            let Some(hex) = self.state.map.hex(hk) else {
                continue;
            };
            if self.qualifier.qualifies(key, hex.q, hex.r) {
                out.push((hex.q, hex.r));
            }
        }
        out
    }

    fn request(&self, key: &str, q: i32, r: i32) -> ImprovementBuildRequest {
        let meta = get_improvement_meta(key);
        ImprovementBuildRequest {
            key: key.to_owned(),
            q,
            r,
            hex_key: hex_key(q, r),
            koszt_praca: meta
                .as_ref()
                .map(|m| m.koszt_praca)
                .unwrap_or_else(|| read_work_cost(key)),
            action: meta
                .map(|m| m.typ)
                .unwrap_or_else(|| tables().file.domyslne.typ_ulepszenia.clone()),
        }
    }

    /// Web `createBuildRequest`.
    pub fn create_build_request(
        &self,
        key: &str,
        q: i32,
        r: i32,
    ) -> Option<ImprovementBuildRequest> {
        if !self.qualifier.qualifies(key, q, r) {
            return None;
        }
        if !is_improvement_tech_unlocked(key, &self.researched) {
            return None;
        }
        Some(self.request(key, q, r))
    }

    /// Web `handleHexClick` (tylko gdy `has_hex_click_handler`); `on_select` = `mode.onSelect`.
    pub fn handle_hex_click(
        &self,
        q: i32,
        r: i32,
        on_select: Option<&mut dyn FnMut(&ImprovementBuildRequest)>,
    ) -> Option<ImprovementBuildRequest> {
        let key = self.active_key.as_deref().filter(|key| !key.is_empty())?;
        let hex_key_str = hex_key(q, r);
        let pending = self
            .state
            .pending_undo_keys
            .iter()
            .flatten()
            .any(|item| *item == format!("{hex_key_str}:{key}"));
        if pending {
            let req = self.request(key, q, r);
            if let Some(callback) = on_select {
                callback(&req);
            }
            return Some(req);
        }
        let req = self.create_build_request(key, q, r);
        if let (Some(request), Some(callback)) = (req.as_ref(), on_select) {
            callback(request);
        }
        req
    }
}
