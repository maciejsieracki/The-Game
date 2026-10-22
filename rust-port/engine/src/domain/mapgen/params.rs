//! P6.M02: parametry nowej gry generatora mapy.
//! Temat wlasciciel: R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1.
//!
//! Port 1:1 (pin web `edb8fb56`) czterech plikow `gra/src/map/`:
//! `deposit-era.ts`, `generator.ts:762-818` (+ alias typu `:846`; zakres dispatchu `:844` to linia pusta), `newGameMapDefaults.ts`, `riverGenSwitch.ts`.
//!
//! Zasady:
//! - Stale balansowe i tekstowe web trzyma w KODZIE; tutaj leza w
//!   `data/derived/mapgen-nowa-gra.json` (parser: `data/derived.rs`). Tabele liczbowe
//!   Panel-A / Panel-E zostaja w `data/map-gen-params.json` i `data/e-start-params.json`
//!   (DANE-JUZ-W-RUST: `data/terrain_map.rs`, `data/economy_society_part2.rs`).
//! - Funkcje sa czyste (bez DOM, bez `location`/`localStorage`): odczyt URL i magazynu
//!   przegladarki (`riverGenSwitch.ts`) przyjmuje juz wyluskane lancuchy.
//! - Arytmetyka zmiennoprzecinkowa idzie tym samym torem co web (`Math.round` = `js_round`,
//!   `Math.floor`, `Math.sqrt`), wiec wyniki sa zgodne bitowo.

use std::collections::BTreeMap;
use std::sync::OnceLock;

use crate::data::derived::{mapgen_nowa_gra, MapgenNowaGraFile, TierTriple, TripleRow};
use crate::data::economy_society_part2::{parse_e_start_params, EStartParams};
use crate::data::terrain_map::{parse_map_gen_params, MapGenParamsFile, SizeTier, Tier3};
use crate::domain::improvements::js_round;
use crate::domain::map_generator::WorldType;
use crate::domain::unit_epoch::{civ_ids_available_at_game_epoch, CivEntryRow};

fn table() -> &'static MapgenNowaGraFile {
    mapgen_nowa_gra()
}

fn map_gen_params() -> &'static MapGenParamsFile {
    static TABLE: OnceLock<MapGenParamsFile> = OnceLock::new();
    TABLE.get_or_init(|| parse_map_gen_params().expect("map-gen-params.json must parse"))
}

fn e_start() -> &'static EStartParams {
    static TABLE: OnceLock<EStartParams> = OnceLock::new();
    TABLE.get_or_init(|| parse_e_start_params().expect("e-start-params.json must parse"))
}

// ---------------------------------------------------------------------------
// Normalizacja etykiet (util/norm-pl-label.ts, newGameMapDefaults.ts:144-151)
// ---------------------------------------------------------------------------

/// Web `normPlMenuLabel`: male litery, `ł->l ó->o ą/à->a ę->e ż/ź->z`, potem usuniecie wszystkiego
/// poza `[a-z0-9]` (m.in. `ć ń ś` znikaja).
pub fn norm_pl_menu_label(label: &str) -> String {
    label
        .to_lowercase()
        .chars()
        .map(|c| match c {
            'ł' => 'l',
            'ó' => 'o',
            'ą' | 'à' => 'a',
            'ę' => 'e',
            'ż' | 'ź' => 'z',
            other => other,
        })
        .filter(|c| matches!(c, 'a'..='z' | '0'..='9'))
        .collect()
}

/// Web `normQualityLabel` (newGameMapDefaults.ts:144): jak `normPlMenuLabel`, ALE bez `ż/ź->z`
/// (litery `ż`/`ź` sa usuwane, np. `Dużo -> duo`).
pub fn norm_quality_label(label: &str) -> String {
    label
        .to_lowercase()
        .chars()
        .map(|c| match c {
            'ł' => 'l',
            'ó' => 'o',
            'ą' | 'à' => 'a',
            'ę' => 'e',
            other => other,
        })
        .filter(|c| matches!(c, 'a'..='z' | '0'..='9'))
        .collect()
}

// ---------------------------------------------------------------------------
// Typy wyliczeniowe
// ---------------------------------------------------------------------------

/// Web `DensityTier`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DensityTier {
    Low,
    Medium,
    High,
}

impl DensityTier {
    /// Klucz web (`'low' | 'medium' | 'high'`).
    pub fn key(self) -> &'static str {
        match self {
            Self::Low => "low",
            Self::Medium => "medium",
            Self::High => "high",
        }
    }

    pub fn from_key(key: &str) -> Option<Self> {
        match key {
            "low" => Some(Self::Low),
            "medium" => Some(Self::Medium),
            "high" => Some(Self::High),
            _ => None,
        }
    }
}

fn pick3<T>(row: &Tier3<T>, tier: DensityTier) -> &T {
    match tier {
        DensityTier::Low => &row.low,
        DensityTier::Medium => &row.medium,
        DensityTier::High => &row.high,
    }
}

fn pick_tier<T>(row: &TierTriple<T>, tier: DensityTier) -> &T {
    match tier {
        DensityTier::Low => &row.low,
        DensityTier::Medium => &row.medium,
        DensityTier::High => &row.high,
    }
}

/// Web `MapSizeLabel`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MapSizeLabel {
    Mala,
    Srednia,
    Duza,
    Ogromna,
    Super,
}

impl MapSizeLabel {
    pub fn key(self) -> &'static str {
        match self {
            Self::Mala => "mala",
            Self::Srednia => "srednia",
            Self::Duza => "duza",
            Self::Ogromna => "ogromna",
            Self::Super => "super",
        }
    }

    pub fn from_key(key: &str) -> Option<Self> {
        match key {
            "mala" => Some(Self::Mala),
            "srednia" => Some(Self::Srednia),
            "duza" => Some(Self::Duza),
            "ogromna" => Some(Self::Ogromna),
            "super" => Some(Self::Super),
            _ => None,
        }
    }
}

fn pick_size<T>(row: &SizeTier<T>, size: MapSizeLabel) -> &T {
    match size {
        MapSizeLabel::Mala => &row.mala,
        MapSizeLabel::Srednia => &row.srednia,
        MapSizeLabel::Duza => &row.duza,
        MapSizeLabel::Ogromna => &row.ogromna,
        MapSizeLabel::Super => &row.super_,
    }
}

/// Web `RozmiarSwiata` (generator.ts:775).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RozmiarSwiata {
    Malenki,
    Maly,
    Standardowy,
    Duzy,
    Ogromny,
    Superogromny,
}

impl RozmiarSwiata {
    pub fn key(self) -> &'static str {
        match self {
            Self::Malenki => "malenki",
            Self::Maly => "maly",
            Self::Standardowy => "standardowy",
            Self::Duzy => "duzy",
            Self::Ogromny => "ogromny",
            Self::Superogromny => "superogromny",
        }
    }

    pub fn from_key(key: &str) -> Option<Self> {
        match key {
            "malenki" => Some(Self::Malenki),
            "maly" => Some(Self::Maly),
            "standardowy" => Some(Self::Standardowy),
            "duzy" => Some(Self::Duzy),
            "ogromny" => Some(Self::Ogromny),
            "superogromny" => Some(Self::Superogromny),
            _ => None,
        }
    }
}

fn rozmiar_from_table_key(key: &str) -> RozmiarSwiata {
    RozmiarSwiata::from_key(key)
        .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: nieznany rozmiar {key}"))
}

/// Epoka startowa z menu (web `StartEpochId`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StartEpochId {
    Kamien,
    Braz,
    Zelazo,
}

impl StartEpochId {
    pub fn key(self) -> &'static str {
        match self {
            Self::Kamien => "kamien",
            Self::Braz => "braz",
            Self::Zelazo => "zelazo",
        }
    }
}

// ---------------------------------------------------------------------------
// generator.ts:762-818 + 844 - rozmiary swiata
// ---------------------------------------------------------------------------

/// Web `ROZMIAR_MENU_LABELS` (generator.ts:781).
pub fn rozmiar_menu_labels() -> &'static [String] {
    &table().rozmiary.etykiety_menu
}

/// Web `ROZMIAR_DIMS[rozmiar]` (generator.ts:778; dane: `map-gen-params.json generator.rozmiar_dims`).
pub fn rozmiar_dims(rozmiar: RozmiarSwiata) -> [i64; 2] {
    let dims = &map_gen_params().generator.rozmiar_dims;
    match rozmiar {
        RozmiarSwiata::Malenki => dims.malenki,
        RozmiarSwiata::Maly => dims.maly,
        RozmiarSwiata::Standardowy => dims.standardowy,
        RozmiarSwiata::Duzy => dims.duzy,
        RozmiarSwiata::Ogromny => dims.ogromny,
        RozmiarSwiata::Superogromny => dims.superogromny,
    }
}

/// Web `rozmiarFromMenuLabel` (generator.ts:798): reguly w kolejnosci tabeli; brak dopasowania =
/// rozmiar domyslny.
pub fn rozmiar_from_menu_label(label: &str) -> RozmiarSwiata {
    let n = norm_pl_menu_label(label);
    for rule in &table().rozmiary.rozpoznawanie {
        let prefix = rule.prefiksy.iter().any(|p| n.starts_with(p.as_str()));
        let equal = rule.rowne.contains(&n);
        if prefix || equal {
            return rozmiar_from_table_key(&rule.rozmiar);
        }
    }
    rozmiar_from_table_key(&table().rozmiary.domyslny)
}

/// Web `rozmiarToDims` (generator.ts:809).
pub fn rozmiar_to_dims(rozmiar: RozmiarSwiata) -> (i64, i64) {
    let [w, h] = rozmiar_dims(rozmiar);
    (w, h)
}

/// Web `menuLabelToDims` (generator.ts:815; re-eksport newGameMapDefaults.ts:743).
pub fn menu_label_to_dims(label: &str) -> (i64, i64) {
    rozmiar_to_dims(rozmiar_from_menu_label(label))
}

fn rozmiar_tier_index(rozmiar: RozmiarSwiata) -> usize {
    let order = &table().rozmiary.kolejnosc;
    let default_index = order
        .iter()
        .position(|k| *k == table().rozmiary.domyslny)
        .unwrap_or(0);
    order
        .iter()
        .position(|k| k == rozmiar.key())
        .unwrap_or(default_index)
}

fn default_map_menu_label() -> &'static str {
    let t = table();
    let index = t
        .rozmiary
        .kolejnosc
        .iter()
        .position(|k| *k == t.rozmiary.domyslny)
        .expect("rozmiary.domyslny musi nalezec do kolejnosci");
    &t.rozmiary.etykiety_menu[index]
}

// ---------------------------------------------------------------------------
// newGameMapDefaults.ts - etykiety mapy, rywale
// ---------------------------------------------------------------------------

/// Web `mapSizeLabelFromDims` (newGameMapDefaults.ts:61).
pub fn map_size_label_from_dims(w: i64, h: i64) -> MapSizeLabel {
    let area = (w * h) as f64;
    let t = &table().etykieta_mapy;
    for step in &t.progi_pola {
        if area < step.ponizej {
            return label_from_table_key(&step.etykieta);
        }
    }
    label_from_table_key(&t.w_przeciwnym_razie)
}

fn label_from_table_key(key: &str) -> MapSizeLabel {
    MapSizeLabel::from_key(key)
        .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: nieznana etykieta mapy {key}"))
}

/// Web `mapSizeLabelFromMenuLabel` (newGameMapDefaults.ts:71).
pub fn map_size_label_from_menu_label(menu_label: &str) -> MapSizeLabel {
    let (w, h) = menu_label_to_dims(menu_label);
    map_size_label_from_dims(w, h)
}

fn e_start_rows() -> [(
    &'static str,
    &'static crate::data::economy_society_part2::EStartParamsSkalaMapyMalenki,
); 6] {
    let rows = &e_start().skala_mapy;
    let labels = rozmiar_menu_labels();
    [
        (labels[0].as_str(), &rows.malenki),
        (labels[1].as_str(), &rows.ma_y),
        (labels[2].as_str(), &rows.standardowy),
        (labels[3].as_str(), &rows.duzy),
        (labels[4].as_str(), &rows.ogromny),
        (labels[5].as_str(), &rows.super_huge),
    ]
}

/// Web `skalaRow` (e-start-params-loader.ts:52): wiersz Panel-E dopasowany po `normPlMenuLabel`.
fn skala_row(
    menu_label: &str,
) -> Option<&'static crate::data::economy_society_part2::EStartParamsSkalaMapyMalenki> {
    let n = norm_pl_menu_label(menu_label);
    e_start_rows()
        .into_iter()
        .find(|(key, _)| norm_pl_menu_label(key) == n)
        .map(|(_, row)| row)
}

/// Web `eStartRywaleAi`.
pub fn e_start_rywale_ai(menu_label: &str) -> Option<i64> {
    skala_row(menu_label).map(|row| row.rywale_ai)
}

/// Web `eStartMiastaPanstwa`.
pub fn e_start_miasta_panstwa(menu_label: &str) -> Option<i64> {
    skala_row(menu_label).map(|row| row.miasta_panstwa)
}

/// Web `eStartTypyCywilizacji` (legacy: domyslna dla kamienia, gdy > 0, inaczej pole legacy).
pub fn e_start_typy_cywilizacji(menu_label: &str) -> Option<i64> {
    let row = skala_row(menu_label)?;
    let stone = row.typy_cywilizacji_per_epoka.kamien.default;
    if stone > 0 {
        Some(stone)
    } else {
        Some(row.typy_cywilizacji)
    }
}

/// Web `normStartEpochId` / `normEpochId` (newGameMapDefaults.ts:595, e-start-params-loader.ts:92):
/// male litery, `ł->l`, `trim`; aliasy z tabeli; inaczej epoka domyslna.
pub fn norm_start_epoch_id(epoch_id: Option<&str>) -> StartEpochId {
    let t = &table().typy_cywilizacji;
    let raw = epoch_id.unwrap_or(&t.epoka_domyslna);
    let n = raw.to_lowercase().replace('ł', "l");
    let n = n.trim();
    if t.aliasy_epok.braz.iter().any(|a| a == n) {
        return StartEpochId::Braz;
    }
    if t.aliasy_epok.zelazo.iter().any(|a| a == n) {
        return StartEpochId::Zelazo;
    }
    StartEpochId::Kamien
}

/// Web `eStartTypyCywilizacjiPerEpoka`.
pub fn e_start_typy_per_epoka(menu_label: &str, epoch_id: &str) -> Option<TripleRow> {
    let row = skala_row(menu_label)?;
    let per = &row.typy_cywilizacji_per_epoka;
    let triple = match norm_start_epoch_id(Some(epoch_id)) {
        StartEpochId::Kamien => &per.kamien,
        StartEpochId::Braz => &per.braz,
        StartEpochId::Zelazo => &per.zelazo,
    };
    Some(TripleRow {
        min: triple.min,
        default: triple.default,
        max: triple.max,
    })
}

/// Web `DEFAULT_PLAYER_CIV_ID` (newGameMapDefaults.ts:131; dane Panel-E `defaulty.player_civ_id`).
pub fn default_player_civ_id() -> &'static str {
    &e_start().defaulty.player_civ_id
}

/// Web `DEFAULT_START_EPOCH_ID` (newGameMapDefaults.ts:134; dane Panel-E `defaulty.start_epoch_id`).
pub fn default_start_epoch_id() -> &'static str {
    &e_start().defaulty.start_epoch_id
}

fn map_gen_default_rywale(size: MapSizeLabel) -> i64 {
    *pick_size(&map_gen_params().mapa_skala.domyslni_rywale, size)
}

/// Opcje + opisy + indeks domyslny (web `RywaleMenuBundle` / `CivTypesMenuBundle`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MenuBundle {
    pub opts: Vec<String>,
    pub descs: Vec<String>,
    /// Indeks domyslny w `opts`.
    pub domyslny: usize,
}

/// Web `aktywneTypyFromMapLabel` (newGameMapDefaults.ts:77): `max` trojki typow cywilizacji.
/// `epoch_id = None` -> epoka domyslna aktywnych typow z tabeli.
pub fn aktywne_typy_from_map_label(menu_label: &str, epoch_id: Option<&str>) -> i64 {
    let epoch = epoch_id.unwrap_or(&table().typy_cywilizacji.epoka_domyslna_aktywnych_typow);
    civ_types_triple_for_map_label(menu_label, Some(epoch)).max
}

/// Web `defaultRywaleFromMapLabel` (newGameMapDefaults.ts:85).
pub fn default_rywale_from_map_label(menu_label: &str) -> i64 {
    if let Some(from_e) = e_start_rywale_ai(menu_label) {
        if from_e >= 0 {
            return from_e;
        }
    }
    map_gen_default_rywale(map_size_label_from_menu_label(menu_label))
}

/// Web `rywaleMenuForMapLabel` (newGameMapDefaults.ts:109).
pub fn rywale_menu_for_map_label(menu_label: &str) -> MenuBundle {
    let cfg = &table().rywale_menu;
    let def = default_rywale_from_map_label(menu_label);
    let max_typ = aktywne_typy_from_map_label(menu_label, None);
    let max_ryw = cfg
        .minimum
        .max((max_typ - cfg.odjecie_od_typow).min(def + cfg.gorna_nadwyzka));
    let min_ryw = cfg.minimum.max(def - cfg.dolna_roznica);
    let mut opts = Vec::new();
    let mut descs = Vec::new();
    let mut n = min_ryw;
    while n <= max_ryw {
        opts.push(n.to_string());
        descs.push(if n == def {
            cfg.podpowiedzi.domyslna.clone()
        } else if n < def {
            cfg.podpowiedzi.mniej.clone()
        } else {
            cfg.podpowiedzi.wiecej.clone()
        });
        n += 1;
    }
    let domyslny = opts.iter().position(|o| *o == def.to_string()).unwrap_or(0);
    MenuBundle {
        opts,
        descs,
        domyslny,
    }
}

/// Web `typSwiataFromMenuLabel` (newGameMapDefaults.ts:125).
pub fn typ_swiata_from_menu_label(label: &str) -> WorldType {
    let t = &table().typ_swiata;
    let n = norm_pl_menu_label(label);
    let key = t.z_etykiety.get(&n).unwrap_or(&t.domyslny);
    world_type_from_key(key)
}

fn world_type_from_key(key: &str) -> WorldType {
    match key {
        "kontynenty" => WorldType::Continents,
        "pangea" => WorldType::Pangea,
        "wyspy" => WorldType::Islands,
        "ziemia" => WorldType::Earth,
        other => panic!("mapgen-nowa-gra.json: nieznany typ swiata {other}"),
    }
}

// ---------------------------------------------------------------------------
// newGameMapDefaults.ts:136-190 - jakosc mapy (QualityTier i pakiet GPU + dekoracje)
// ---------------------------------------------------------------------------

/// Web `QualityTier` (`'low' | 'medium' | 'high'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum QualityTier {
    Low,
    Medium,
    High,
}

impl QualityTier {
    /// Klucz web.
    pub fn key(self) -> &'static str {
        match self {
            Self::Low => "low",
            Self::Medium => "medium",
            Self::High => "high",
        }
    }

    pub fn from_key(key: &str) -> Option<Self> {
        match key {
            "low" => Some(Self::Low),
            "medium" => Some(Self::Medium),
            "high" => Some(Self::High),
            _ => None,
        }
    }
}

/// Web `QUALITY_MENU_LABELS` (newGameMapDefaults.ts:139), z tabeli `jakosc.etykiety_menu`.
pub fn quality_menu_labels() -> &'static [String] {
    &table().jakosc.etykiety_menu
}

/// Web `DEFAULT_RENDER_QUALITY` (:141) = `eStartRenderQualityBundled()`
/// (e-start-params-loader.ts:80): `low`/`high` z danych Panel-E, inna wartosc -> `medium`.
pub fn default_render_quality() -> QualityTier {
    let t = &table().jakosc;
    match QualityTier::from_key(&e_start().defaulty.render_quality_bundled) {
        Some(q @ (QualityTier::Low | QualityTier::High)) => q,
        _ => QualityTier::from_key(&t.domyslna_z_etykiety)
            .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: jakosc.domyslna_z_etykiety")),
    }
}

/// Web `DEFAULT_MAP_DETAIL_QUALITY` (:142), z tabeli `jakosc.domyslna_jakosc_mapy_szczegoly`.
pub fn default_map_detail_quality() -> QualityTier {
    QualityTier::from_key(&table().jakosc.domyslna_jakosc_mapy_szczegoly)
        .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: jakosc.domyslna_jakosc_mapy_szczegoly"))
}

/// Web `qualityTierFromLabel` (:154): `normQualityLabel`, tokeny z tabeli, inaczej `medium`.
pub fn quality_tier_from_label(label: &str) -> QualityTier {
    let t = &table().jakosc;
    let n = norm_quality_label(label);
    if t.z_etykiety_niskie.contains(&n) {
        return QualityTier::Low;
    }
    if t.z_etykiety_wysokie.contains(&n) {
        return QualityTier::High;
    }
    QualityTier::from_key(&t.domyslna_z_etykiety)
        .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: jakosc.domyslna_z_etykiety"))
}

/// Web `qualityTierToLabel` (:161); etykiety wg kolejnosci `QUALITY_MENU_LABELS`.
pub fn quality_tier_to_label(tier: QualityTier) -> &'static str {
    let labels = quality_menu_labels();
    match tier {
        QualityTier::Low => &labels[0],
        QualityTier::Medium => &labels[1],
        QualityTier::High => &labels[2],
    }
}

/// Web `BundledMapQualityPreset` (:168).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BundledMapQualityPreset {
    pub render_quality: QualityTier,
    pub map_detail_quality: QualityTier,
}

/// Web `bundledMapQualityPreset` (:177): jeden wybor -> oba tiery (1:1).
pub fn bundled_map_quality_preset(tier: QualityTier) -> BundledMapQualityPreset {
    BundledMapQualityPreset {
        render_quality: tier,
        map_detail_quality: tier,
    }
}

/// Web `bundledMapQualityFromLabel` (:182).
pub fn bundled_map_quality_from_label(label: &str) -> BundledMapQualityPreset {
    bundled_map_quality_preset(quality_tier_from_label(label))
}

/// Web `isLargeMapMenuLabel` (:187): `normQualityLabel` (a nie `normPlMenuLabel`), tokeny z tabeli.
pub fn is_large_map_menu_label(menu_label: &str) -> bool {
    let n = norm_quality_label(menu_label);
    table().jakosc.duze_mapy.contains(&n)
}

// ---------------------------------------------------------------------------
// newGameMapDefaults.ts - gestosc swiata
// ---------------------------------------------------------------------------

/// Web `densityTierFromLabel` (newGameMapDefaults.ts:197). UWAGA web: uzywa `normQualityLabel`
/// (bez `ż->z`), wiec etykieta menu `Dużo` daje `duo` i spada do poziomu domyslnego.
pub fn density_tier_from_label(label: &str) -> DensityTier {
    let t = &table().gestosc;
    let n = norm_quality_label(label);
    if t.z_etykiety_niskie.contains(&n) {
        return DensityTier::Low;
    }
    if t.z_etykiety_wysokie.contains(&n) {
        return DensityTier::High;
    }
    DensityTier::from_key(&t.domyslna_z_etykiety)
        .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: gestosc.domyslna_z_etykiety"))
}

/// Web `densityTierToLabel` (newGameMapDefaults.ts:204); etykiety wg kolejnosci `DENSITY_MENU_LABELS`.
pub fn density_tier_to_label(tier: DensityTier) -> &'static str {
    let labels = &table().gestosc.etykiety_menu;
    match tier {
        DensityTier::Low => &labels[0],
        DensityTier::Medium => &labels[1],
        DensityTier::High => &labels[2],
    }
}

/// Web `WorldGenerationPreset`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct WorldGenerationPreset {
    pub resources: DensityTier,
    pub rivers: DensityTier,
    pub desert: DensityTier,
    pub forest: DensityTier,
    pub relief: DensityTier,
}

/// Web `DEFAULT_WORLD_DENSITY` (newGameMapDefaults.ts:219).
pub fn default_world_density() -> WorldGenerationPreset {
    let p = &table().gestosc.domyslny_preset;
    let tier = |key: &str| {
        DensityTier::from_key(key)
            .unwrap_or_else(|| panic!("mapgen-nowa-gra.json: gestosc.domyslny_preset {key}"))
    };
    WorldGenerationPreset {
        resources: tier(&p.resources),
        rivers: tier(&p.rivers),
        desert: tier(&p.desert),
        forest: tier(&p.forest),
        relief: tier(&p.relief),
    }
}

/// Web `worldGenerationPresetFromLabels` (newGameMapDefaults.ts:227).
/// `relief`: `labels.relief || labels.rivers || 'Normalnie'` (pusty lancuch = brak).
pub fn world_generation_preset_from_labels(
    resources: &str,
    rivers: &str,
    desert: &str,
    forest: &str,
    relief: Option<&str>,
) -> WorldGenerationPreset {
    let fallback = table().gestosc.domyslna_etykieta_reliefu.as_str();
    let relief_label = match relief {
        Some(label) if !label.is_empty() => label,
        _ if !rivers.is_empty() => rivers,
        _ => fallback,
    };
    WorldGenerationPreset {
        resources: density_tier_from_label(resources),
        rivers: density_tier_from_label(rivers),
        desert: density_tier_from_label(desert),
        forest: density_tier_from_label(forest),
        relief: density_tier_from_label(relief_label),
    }
}

/// Web `densityMultiplier` (newGameMapDefaults.ts:245).
pub fn density_multiplier(tier: DensityTier) -> f64 {
    *pick3(&map_gen_params().gestosc.surowce_mult, tier)
}

/// Web `maxRiversFromDensity` (newGameMapDefaults.ts:250).
pub fn max_rivers_from_density(tier: DensityTier) -> i64 {
    *pick3(&map_gen_params().gestosc.rzeki_max_mala_mapa, tier)
}

fn river_scale_by_size(size: MapSizeLabel) -> f64 {
    *pick_size(&map_gen_params().gestosc.river_scale, size)
}

/// Web `maxRiversForMapAndDensity` (newGameMapDefaults.ts:264, `@deprecated`, uzywany przez
/// `resolveWorldGenNumbers`).
pub fn max_rivers_for_map_and_density(map_menu_label: &str, tier: DensityTier) -> i64 {
    let cfg = &table().rzeki.maks_rzek_legacy;
    let base = max_rivers_from_density(tier) as f64;
    let size_label = map_size_label_from_menu_label(map_menu_label);
    let scale = river_scale_by_size(size_label);
    let (w, h) = menu_label_to_dims(map_menu_label);
    let area_boost = cfg
        .boost_min
        .max(((w * h) as f64 / cfg.dzielnik_pola).sqrt());
    js_round(base * scale * area_boost).max(cfg.wynik_min as f64) as i64
}

/// Web `riverMinPathLengthForTier` (newGameMapDefaults.ts:274).
pub fn river_min_path_length_for_tier(tier: DensityTier) -> i64 {
    *pick_tier(&table().rzeki.min_dlugosc_tier, tier)
}

/// Web `riverGridCellSizeForTier` (newGameMapDefaults.ts:281).
pub fn river_grid_cell_size_for_tier(tier: DensityTier) -> i64 {
    *pick_tier(&table().rzeki.komorka_siatki_tier, tier)
}

fn river_acceptance_cap(tier: DensityTier) -> i64 {
    *pick_tier(&table().rzeki.limit_akceptacji_tier, tier)
}

/// Web `riverGridTraceMinLen` (newGameMapDefaults.ts:298; tier domyslny: `medium`).
pub fn river_grid_trace_min_len(catalog_min_len: i64, tier: DensityTier) -> i64 {
    catalog_min_len.min(river_acceptance_cap(tier))
}

/// Web `RIVER_REF_AREA` (newGameMapDefaults.ts:304) = szerokosc x wysokosc mapy referencyjnej.
pub fn river_ref_area() -> f64 {
    let r = &table().rzeki.powierzchnia_referencyjna;
    r.szerokosc * r.wysokosc
}

/// Web `riverMapAreaScale` (newGameMapDefaults.ts:306).
pub fn river_map_area_scale(w: i64, h: i64) -> f64 {
    ((w * h) as f64 / river_ref_area()).sqrt()
}

/// Web `RiverMapParams` (newGameMapDefaults.ts:310).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RiverMapParams {
    pub area_scale: f64,
    pub min_dim: i64,
    pub main_cell: i64,
    pub tributary_cell: i64,
    pub main_grid_stride: i64,
    pub min_len: i64,
    pub max_len: i64,
    pub grid_trace_min_len: i64,
    pub feeder_min_len: i64,
    pub hard_meander_len: i64,
    pub mouth_tail_len: i64,
    pub min_inland_from_sea: i64,
    pub relief_search_min: i64,
    pub relief_search_max: i64,
    pub relief_source_bonus: i64,
    pub feeder_passes: i64,
    pub top_up_passes: i64,
    pub feeder_source_sep_mult: f64,
    pub expand_source_radius: i64,
    pub min_inland_cell: i64,
}

/// `Math.max(lo, Math.min(hi, n))` (newGameMapDefaults.ts:333).
fn clamp(n: f64, lo: f64, hi: f64) -> f64 {
    lo.max(hi.min(n))
}

fn scaled_clamp(rule: &crate::data::derived::SkalowanyClamp, area_scale: f64) -> i64 {
    clamp(
        js_round(rule.baza * area_scale),
        rule.min as f64,
        rule.max as f64,
    ) as i64
}

fn passes(rule: &crate::data::derived::PrzebiegiRegula, area_scale: f64) -> i64 {
    clamp(
        rule.baza as f64 + (area_scale * rule.mnoznik_skali).floor(),
        rule.min as f64,
        rule.max as f64,
    ) as i64
}

/// Web `resolveRiverMapParams` (newGameMapDefaults.ts:338).
pub fn resolve_river_map_params(tier: DensityTier, w: i64, h: i64) -> RiverMapParams {
    let cfg = &table().rzeki;
    let area_scale = river_map_area_scale(w, h);
    let min_dim = w.min(h);
    let min_dim_f = min_dim as f64;
    let tier_min_len = river_min_path_length_for_tier(tier) as f64;
    let tier_cap = river_acceptance_cap(tier) as f64;

    let main_cell = river_grid_cell_size_for_tier(tier);
    let tributary_cell = (cfg.dopyw_komorka.minimum as f64).max(js_round(
        main_cell as f64 * cfg.dopyw_komorka.mnoznik_glownej,
    )) as i64;
    let main_grid_stride = cfg.glowne_stride;

    let ml = &cfg.min_len;
    let min_len = clamp(
        js_round(tier_min_len * ml.mnoznik_obszaru_dol.max(area_scale)),
        ml.dolny_clamp as f64,
        tier_min_len,
    )
    .min((min_dim_f * ml.ulamek_min_wymiaru).floor());
    let xl = &cfg.max_len;
    let max_len = (min_len * xl.mnoznik_min_len_a as f64)
        .max((min_dim_f * xl.ulamek_min_wymiaru_a).floor())
        .max(js_round(min_len * xl.mnoznik_min_len_b as f64))
        .min((min_dim_f * xl.ulamek_min_wymiaru_sufit).floor());
    let gt = &cfg.siatka_trace;
    let grid_trace_min_len = clamp(
        min_len.min(tier_cap),
        gt.dolny_clamp as f64,
        (gt.gorny_podloga as f64).max((min_dim_f * gt.ulamek_min_wymiaru).floor()),
    );
    let fm = &cfg.doplyw_min_len;
    let feeder_min_len = clamp(
        (fm.dolny_clamp as f64).max(grid_trace_min_len - fm.odjecie_od_siatki as f64),
        fm.dolny_clamp as f64,
        (fm.gorny_podloga as f64).max((min_dim_f * fm.ulamek_min_wymiaru).floor()),
    );
    let hard_meander_len = scaled_clamp(&cfg.twarde_meandry, area_scale);
    let mouth_tail_len = scaled_clamp(&cfg.ogon_ujscia, area_scale);
    let min_inland_from_sea = if min_dim >= cfg.min_w_glab_ladu.prog_min_wymiaru {
        cfg.min_w_glab_ladu.gdy_duza
    } else {
        cfg.min_w_glab_ladu.gdy_mala
    };
    let relief_search_max = scaled_clamp(&cfg.szukanie_reliefu.max, area_scale);
    let large_map = area_scale >= cfg.duza_mapa_prog_skali;
    let (feeder_rule, top_up_rule) = if large_map {
        (
            &cfg.przebiegi_doplywow.duza,
            &cfg.przebiegi_dopelnienia.duza,
        )
    } else {
        (
            &cfg.przebiegi_doplywow.mala,
            &cfg.przebiegi_dopelnienia.mala,
        )
    };
    let feeder_passes = passes(feeder_rule, area_scale);
    let top_up_passes = passes(top_up_rule, area_scale);
    let min_inland_cell = (cfg.min_w_glab_komorki.dolny_clamp as f64)
        .max((min_len * cfg.min_w_glab_komorki.ulamek_min_len).floor());

    RiverMapParams {
        area_scale,
        min_dim,
        main_cell,
        tributary_cell,
        main_grid_stride,
        min_len: min_len as i64,
        max_len: max_len as i64,
        grid_trace_min_len: grid_trace_min_len as i64,
        feeder_min_len: feeder_min_len as i64,
        hard_meander_len,
        mouth_tail_len,
        min_inland_from_sea,
        relief_search_min: cfg.szukanie_reliefu.min,
        relief_search_max,
        relief_source_bonus: cfg.szukanie_reliefu.bonus_zrodla,
        feeder_passes,
        top_up_passes,
        feeder_source_sep_mult: cfg.separacja_zrodel_doplywu,
        expand_source_radius: scaled_clamp(&cfg.promien_rozszerzenia_zrodla, area_scale),
        min_inland_cell: min_inland_cell as i64,
    }
}

/// Web `{ minLen, maxLen, margin }` (newGameMapDefaults.ts:395).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RiverTrace {
    pub min_len: i64,
    pub max_len: i64,
    pub margin: i64,
}

/// Web `resolveRiverTraceForMap` (newGameMapDefaults.ts:392).
pub fn resolve_river_trace_for_map(map_menu_label: &str, rivers_tier: DensityTier) -> RiverTrace {
    let (w, h) = menu_label_to_dims(map_menu_label);
    let params = resolve_river_map_params(rivers_tier, w, h);
    let base = river_trace_limits_for_map(map_menu_label);
    RiverTrace {
        min_len: params.min_len,
        max_len: params.max_len,
        margin: base.margin,
    }
}

/// Web `riverTraceLimitsForMap` (newGameMapDefaults.ts:407).
pub fn river_trace_limits_for_map(map_menu_label: &str) -> RiverTrace {
    let cfg = &table().rzeki.limity_trasy_legacy;
    let (w, h) = menu_label_to_dims(map_menu_label);
    let min_dim = w.min(h) as f64;
    let area = (w * h) as f64;
    RiverTrace {
        min_len: if area > cfg.prog_pola {
            cfg.min_len_duza
        } else {
            cfg.min_len_mala
        },
        max_len: (cfg.max_len_dolny as f64).max((min_dim * cfg.max_len_ulamek_min_wymiaru).floor())
            as i64,
        margin: (cfg.margines_dolny as f64).max((min_dim * cfg.margines_ulamek_min_wymiaru).floor())
            as i64,
    }
}

/// Web `RESOURCE_BASELINE_RARITY_MULT` (newGameMapDefaults.ts:419; dane Panel-A).
pub fn resource_baseline_rarity_mult() -> f64 {
    map_gen_params().gestosc.baseline_rarity_mult
}

/// Web `desertNoiseThresholdFromTier` (newGameMapDefaults.ts:422).
pub fn desert_noise_threshold_from_tier(tier: DensityTier) -> f64 {
    *pick3(&map_gen_params().gestosc.desert_noise_threshold, tier)
}

/// Web `forestNoiseThresholdFromTier` (newGameMapDefaults.ts:427).
pub fn forest_noise_threshold_from_tier(tier: DensityTier) -> f64 {
    let cfg = &table().progi_szumu;
    cfg.las_dolny_prog
        .max(*pick3(&map_gen_params().gestosc.forest_noise_threshold, tier) - cfg.las_odjecie)
}

/// Web `mountainNoiseThresholdFromTier` (newGameMapDefaults.ts:432).
pub fn mountain_noise_threshold_from_tier(tier: DensityTier) -> f64 {
    *pick3(&map_gen_params().gestosc.mountain_noise_threshold, tier)
}

/// Web `highlandNoiseThresholdFromTier` (newGameMapDefaults.ts:437).
pub fn highland_noise_threshold_from_tier(tier: DensityTier) -> f64 {
    *pick3(&map_gen_params().gestosc.highland_noise_threshold, tier)
}

// ---------------------------------------------------------------------------
// newGameMapDefaults.ts - opcje generatora, udzial ladu
// ---------------------------------------------------------------------------

/// Web `difficulty` w `WorldGenOptions`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Difficulty {
    Easy,
    Normal,
    Hard,
}

/// Web `WorldGenOptions` (newGameMapDefaults.ts:442): brak pola = `None`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct WorldGenOptions {
    pub world_density: Option<WorldGenerationPreset>,
    pub map_size_menu_label: Option<String>,
    pub land_fraction: Option<f64>,
    pub difficulty: Option<Difficulty>,
    pub civ_types_count: Option<i64>,
    pub city_states_count: Option<i64>,
    pub village_rewards_enabled: Option<bool>,
}

/// Web `LAND_FRACTION_PERCENT_OPTS` (newGameMapDefaults.ts:460).
pub fn land_fraction_percent_opts() -> &'static [i64] {
    &table().udzial_ladu.opcje_procent
}

/// Web `defaultLandFractionForTyp` (gen-helpers.ts:3254; zaleznosc M01 - kopia danych w tabeli).
pub fn default_land_fraction_for_typ(typ: WorldType) -> f64 {
    let f = &table().typ_swiata.udzial_ladu;
    match typ {
        WorldType::Pangea => f.pangea,
        WorldType::Continents => f.kontynenty,
        WorldType::Islands => f.wyspy,
        WorldType::Earth => f.ziemia,
    }
}

/// Web `defaultLandFractionPercentForTyp` (newGameMapDefaults.ts:464): zaokraglenie do opcji suwaka
/// (przy remisie odleglosci wygrywa pierwsza opcja, jak `reduce` ze scisla nierownoscia).
pub fn default_land_fraction_percent_for_typ(typ: WorldType) -> i64 {
    let cfg = &table().udzial_ladu;
    let pct = js_round(default_land_fraction_for_typ(typ) * cfg.przelicznik_procent) as i64;
    let opts = &cfg.opcje_procent;
    if opts.contains(&pct) {
        return pct;
    }
    let mut best = opts[0];
    for &v in opts {
        if (v - pct).abs() < (best - pct).abs() {
            best = v;
        }
    }
    best
}

/// Web `resolveLandFraction` (newGameMapDefaults.ts:472).
pub fn resolve_land_fraction(opts: Option<&WorldGenOptions>, typ: WorldType) -> f64 {
    if let Some(fraction) = opts.and_then(|o| o.land_fraction) {
        if fraction.is_finite() {
            let cfg = &table().udzial_ladu;
            return cfg.min.max(cfg.max.min(fraction));
        }
    }
    default_land_fraction_for_typ(typ)
}

/// Web `scaleMaxRiversForLand` (newGameMapDefaults.ts:479, `@deprecated`: zwraca `configuredMax`).
pub fn scale_max_rivers_for_land(
    configured_max: i64,
    _land_hexes: i64,
    _rivers_tier: DensityTier,
) -> i64 {
    configured_max
}

/// Wynik web `resolveWorldGenNumbers` (newGameMapDefaults.ts:490).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WorldGenNumbers {
    pub resource_mult: f64,
    pub resource_baseline: f64,
    pub max_rivers: i64,
    pub desert_threshold: f64,
    pub forest_threshold: f64,
    pub mountain_threshold: f64,
    pub highland_threshold: f64,
    pub river_trace: RiverTrace,
}

/// Web `resolveWorldGenNumbers`.
pub fn resolve_world_gen_numbers(opts: Option<&WorldGenOptions>) -> WorldGenNumbers {
    let wd = opts
        .and_then(|o| o.world_density)
        .unwrap_or_else(default_world_density);
    let relief_tier = wd.relief;
    let map_label: &str = match opts.and_then(|o| o.map_size_menu_label.as_deref()) {
        Some(label) => label,
        None => default_map_menu_label(),
    };
    let resource_baseline = if opts.is_some_and(|o| o.world_density.is_some()) {
        resource_baseline_rarity_mult()
    } else {
        table().progi_szumu.bazowa_rzadkosc_bez_presetu
    };
    WorldGenNumbers {
        resource_mult: density_multiplier(wd.resources),
        resource_baseline,
        max_rivers: max_rivers_for_map_and_density(map_label, wd.rivers),
        desert_threshold: desert_noise_threshold_from_tier(wd.desert),
        forest_threshold: forest_noise_threshold_from_tier(wd.forest),
        mountain_threshold: mountain_noise_threshold_from_tier(relief_tier),
        highland_threshold: highland_noise_threshold_from_tier(relief_tier),
        river_trace: resolve_river_trace_for_map(map_label, wd.rivers),
    }
}

// ---------------------------------------------------------------------------
// newGameMapDefaults.ts - miasta-panstwa, typy cywilizacji
// ---------------------------------------------------------------------------

/// Web `MAX_MIAST_PANSTWA` (newGameMapDefaults.ts:521).
pub fn max_miast_panstwa() -> i64 {
    table().miasta_panstwa.sufit
}

/// Web `clampMiastaPanstwaCount` (newGameMapDefaults.ts:532): `raw` = `Number(raw)` weba.
pub fn clamp_miasta_panstwa_count(raw: f64, allow_zero: bool) -> i64 {
    let cfg = &table().miasta_panstwa;
    let floor = if allow_zero {
        cfg.dolna_granica_gdy_zero_dozwolone
    } else {
        cfg.dolna_granica
    };
    let n = raw.floor();
    if !n.is_finite() || n < floor as f64 {
        return floor;
    }
    (n.min(cfg.sufit as f64)) as i64
}

/// Web `MAX_TYPY_CYWILIZACJI_MENU` (newGameMapDefaults.ts:540).
pub fn max_typy_cywilizacji_menu() -> i64 {
    table().typy_cywilizacji.sufit_menu
}

/// Web `maxCivTypesForStartEpoch` (newGameMapDefaults.ts:543).
pub fn max_civ_types_for_start_epoch(epoch_id: &str, civ_roster: &[CivEntryRow<'_>]) -> i64 {
    civ_ids_available_at_game_epoch(civ_roster, epoch_id).len() as i64
}

/// Web `EPOCH_CIV_TYPE_POOL[epoch]` (newGameMapDefaults.ts:589).
pub fn epoch_civ_type_pool(epoch: StartEpochId) -> i64 {
    let pool = &table().typy_cywilizacji.pula_wg_epoki;
    match epoch {
        StartEpochId::Kamien => pool.kamien,
        StartEpochId::Braz => pool.braz,
        StartEpochId::Zelazo => pool.zelazo,
    }
}

fn clamp_typy_triple_to_epoch(
    triple: TripleRow,
    epoch_id: Option<&str>,
    civ_roster: Option<&[CivEntryRow<'_>]>,
) -> TripleRow {
    let (Some(epoch_id), Some(roster)) = (epoch_id, civ_roster) else {
        return triple;
    };
    if epoch_id.is_empty() || roster.is_empty() {
        return triple;
    }
    let epoch_max = max_civ_types_for_start_epoch(epoch_id, roster);
    if epoch_max <= 0 {
        return triple;
    }
    let cfg = &table().typy_cywilizacji.triple_z_domyslnej;
    let minimum = cfg.minimum;
    let max = triple.max.min(epoch_max);
    let mut def = triple.default.min(max);
    let mut min = triple.min.min(max);
    if min > max {
        min = minimum.max(max - cfg.krok_rozdzielenia);
    }
    if def < min {
        def = max;
    }
    if def > max {
        def = max;
    }
    TripleRow {
        min,
        default: def,
        max,
    }
}

fn triple_from_default(def: i64, pool: i64) -> TripleRow {
    let cfg = &table().typy_cywilizacji.triple_z_domyslnej;
    let max = (def + cfg.krok_max).min(pool);
    let mut min = cfg.minimum.max(def - cfg.krok_min);
    let mut adjusted = def.max(cfg.minimum).min(pool);
    if min >= max {
        min = cfg.minimum.max(max - cfg.krok_rozdzielenia);
    }
    if adjusted <= min {
        adjusted = (min + cfg.krok_rozdzielenia).min(max);
    }
    if adjusted >= max {
        adjusted = (min + cfg.krok_rozdzielenia).max(max - cfg.krok_rozdzielenia);
    }
    TripleRow {
        min,
        default: adjusted,
        max,
    }
}

fn map_menu_tier_index(menu_label: &str) -> usize {
    rozmiar_tier_index(rozmiar_from_menu_label(menu_label))
}

fn fallback_typy_triple(menu_label: &str, epoch: StartEpochId) -> TripleRow {
    let tier_index = map_menu_tier_index(menu_label);
    let pool = epoch_civ_type_pool(epoch);
    let by_epoch = &table().typy_cywilizacji.domyslne_wg_rozmiaru_fallback;
    let row = match epoch {
        StartEpochId::Kamien => &by_epoch.kamien,
        StartEpochId::Braz => &by_epoch.braz,
        StartEpochId::Zelazo => &by_epoch.zelazo,
    };
    let default_index = rozmiar_tier_index(rozmiar_from_table_key(&table().rozmiary.domyslny));
    let def = row
        .get(tier_index)
        .or_else(|| row.get(default_index))
        .copied()
        .expect("mapgen-nowa-gra.json: domyslne_wg_rozmiaru_fallback");
    triple_from_default(def, pool)
}

/// Web `civTypesTripleForMapLabel` (newGameMapDefaults.ts:633); `epoch_id = None` -> epoka
/// domyslna z tabeli.
pub fn civ_types_triple_for_map_label(menu_label: &str, epoch_id: Option<&str>) -> TripleRow {
    let epoch_raw = epoch_id.unwrap_or(&table().typy_cywilizacji.epoka_domyslna);
    let ep = norm_start_epoch_id(Some(epoch_raw));
    if let Some(from_e) = e_start_typy_per_epoka(menu_label, ep.key()) {
        return from_e;
    }
    if let Some(legacy) = e_start_typy_cywilizacji(menu_label) {
        if legacy > 0 {
            return triple_from_default(legacy, epoch_civ_type_pool(ep));
        }
    }
    fallback_typy_triple(menu_label, ep)
}

fn miasta_panstwa_triple(menu_label: &str) -> TripleRow {
    let cfg = &table().typy_cywilizacji.triple_z_domyslnej;
    let max_city = max_miast_panstwa();
    if let Some(from_e) = e_start_miasta_panstwa(menu_label) {
        if from_e > 0 {
            let clamped = clamp_miasta_panstwa_count(from_e as f64, false);
            let max = (clamped + cfg.krok_max).min(max_city);
            let mut min = cfg.minimum.max(clamped - cfg.krok_min);
            if min >= max {
                min = cfg.minimum.max(max - cfg.krok_rozdzielenia);
            }
            return TripleRow {
                min,
                default: clamped,
                max,
            };
        }
    }
    let rows = &table().miasta_panstwa.menu_wg_rozmiaru;
    let default_index = rozmiar_tier_index(rozmiar_from_table_key(&table().rozmiary.domyslny));
    *rows
        .get(map_menu_tier_index(menu_label))
        .or_else(|| rows.get(default_index))
        .expect("mapgen-nowa-gra.json: miasta_panstwa.menu_wg_rozmiaru")
}

fn menu_bundle_from_triple(
    triple: TripleRow,
    default_hint: &str,
    low_hint: &str,
    high_hint: &str,
) -> MenuBundle {
    let opts = vec![
        triple.min.to_string(),
        triple.default.to_string(),
        triple.max.to_string(),
    ];
    let descs = opts
        .iter()
        .map(|n| {
            if *n == triple.default.to_string() {
                default_hint.to_owned()
            } else if n.parse::<i64>().expect("liczba") < triple.default {
                low_hint.to_owned()
            } else {
                high_hint.to_owned()
            }
        })
        .collect();
    let domyslny = opts
        .iter()
        .position(|o| *o == triple.default.to_string())
        .unwrap_or(
            table()
                .typy_cywilizacji
                .triple_z_domyslnej
                .indeks_awaryjny_menu as usize,
        );
    MenuBundle {
        opts,
        descs,
        domyslny,
    }
}

/// Web `defaultMiastaPanstwaFromMapLabel` (newGameMapDefaults.ts:689).
pub fn default_miasta_panstwa_from_map_label(menu_label: &str) -> i64 {
    if let Some(from_e) = e_start_miasta_panstwa(menu_label) {
        if from_e > 0 {
            return clamp_miasta_panstwa_count(from_e as f64, false);
        }
    }
    miasta_panstwa_triple(menu_label).default
}

/// Web `miastaPanstwaMenuForMapLabel` (newGameMapDefaults.ts:695).
pub fn miasta_panstwa_menu_for_map_label(menu_label: &str) -> MenuBundle {
    let hints = &table().miasta_panstwa.podpowiedzi;
    menu_bundle_from_triple(
        miasta_panstwa_triple(menu_label),
        &hints.domyslna,
        &hints.mniej,
        &hints.wiecej,
    )
}

/// Web `defaultCivTypesFromMapLabel` (newGameMapDefaults.ts:712).
pub fn default_civ_types_from_map_label(
    menu_label: &str,
    epoch_id: Option<&str>,
    civ_roster: Option<&[CivEntryRow<'_>]>,
) -> i64 {
    let mut def = civ_types_triple_for_map_label(menu_label, epoch_id).default;
    if let Some(roster) = civ_roster {
        if !roster.is_empty() {
            let epoch = epoch_id.unwrap_or(&table().typy_cywilizacji.epoka_domyslna);
            def = def.min(max_civ_types_for_start_epoch(epoch, roster));
        }
    }
    def.max(table().typy_cywilizacji.triple_z_domyslnej.minimum)
}

/// Web `civTypesMenuForMapLabel` (newGameMapDefaults.ts:724).
pub fn civ_types_menu_for_map_label(
    menu_label: &str,
    epoch_id: Option<&str>,
    civ_roster: Option<&[CivEntryRow<'_>]>,
) -> MenuBundle {
    let epoch = epoch_id.unwrap_or(&table().typy_cywilizacji.epoka_domyslna);
    let triple = clamp_typy_triple_to_epoch(
        civ_types_triple_for_map_label(menu_label, Some(epoch)),
        Some(epoch),
        civ_roster,
    );
    let hints = &table().typy_cywilizacji.podpowiedzi;
    menu_bundle_from_triple(triple, &hints.domyslna, &hints.mniej, &hints.wiecej)
}

// ---------------------------------------------------------------------------
// deposit-era.ts - widocznosc zloz per epoka
// ---------------------------------------------------------------------------

/// Web `DepositEraHex` = `Pick<HexWithZloze, 'zloze' | 'zlozeMinEra'>` (deposit-era.ts:7).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct DepositEraHex {
    pub zloze: Option<String>,
    pub zloze_min_era: Option<i64>,
}

/// Niepusty `zloze` (web: `!hex.zloze` jest prawda tez dla `''`).
fn zloze_of(hex: &DepositEraHex) -> Option<&str> {
    hex.zloze.as_deref().filter(|z| !z.is_empty())
}

/// Web `METAL_DEPOSIT_MIN_ERA[key]` (deposit-era.ts:9; dane: `map-gen-params.json metal_deposit_min_era`).
pub fn metal_deposit_min_era(key: &str) -> Option<i64> {
    let m = &map_gen_params().metal_deposit_min_era;
    match key {
        "miedz" => Some(m.miedz),
        "zelazo" => Some(m.zelazo),
        "wegiel" => Some(m.wegiel),
        "cyna" => Some(m.cyna),
        _ => None,
    }
}

/// Web `zlozeMinEraFor` (deposit-era.ts:11).
pub fn zloze_min_era_for(hex: &DepositEraHex) -> i64 {
    if let Some(era) = hex.zloze_min_era {
        return era;
    }
    if let Some(z) = zloze_of(hex) {
        if let Some(era) = metal_deposit_min_era(&z.trim().to_lowercase()) {
            return era;
        }
    }
    table().zloza_epoka.min_epoka_domyslna
}

/// Web `isDepositVisible` (deposit-era.ts:18).
pub fn is_deposit_visible(hex: &DepositEraHex, current_era: i64) -> bool {
    let Some(z) = zloze_of(hex) else {
        return true;
    };
    let key = z.trim().to_lowercase();
    if table().zloza_epoka.nigdy_widoczne.contains(&key) {
        return false;
    }
    current_era >= zloze_min_era_for(hex)
}

/// Web `visibleZloze` (deposit-era.ts:25).
pub fn visible_zloze(hex: &DepositEraHex, current_era: i64) -> Option<&str> {
    let z = zloze_of(hex)?;
    is_deposit_visible(hex, current_era).then_some(z)
}

/// Web `ensureDepositEraMeta` (deposit-era.ts:30): uzupelnia `zlozeMinEra` zlozom metali.
pub fn ensure_deposit_era_meta(hexes: &mut BTreeMap<String, DepositEraHex>) {
    for hex in hexes.values_mut() {
        let Some(z) = zloze_of(hex) else {
            continue;
        };
        let key = z.trim().to_lowercase();
        if let Some(era) = metal_deposit_min_era(&key) {
            if hex.zloze_min_era.is_none() {
                hex.zloze_min_era = Some(era);
            }
        }
    }
}

/// Web `countHiddenMetalDeposits` (deposit-era.ts:40).
pub fn count_hidden_metal_deposits(hexes: &BTreeMap<String, DepositEraHex>, era: i64) -> i64 {
    hexes
        .values()
        .filter(|hex| zloze_of(hex).is_some() && !is_deposit_visible(hex, era))
        .count() as i64
}

// ---------------------------------------------------------------------------
// riverGenSwitch.ts - przelacznik generowania rzek (czysty; URL/localStorage = wejscie)
// ---------------------------------------------------------------------------

/// Web `RiverGenPhase` (riverGenSwitch.ts:12).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RiverGenPhase {
    Main,
    MainMedium,
    All,
}

impl RiverGenPhase {
    /// Lancuch web (`'main' | 'main+medium' | 'all'`) z tabeli `rzeki_przelacznik.fazy`.
    pub fn as_str(self) -> &'static str {
        let phases = &table().rzeki_przelacznik.fazy;
        match self {
            Self::Main => &phases[0],
            Self::MainMedium => &phases[1],
            Self::All => &phases[2],
        }
    }
}

/// Web `RIVER_GEN_STORAGE_KEY` (riverGenSwitch.ts:9): klucz `localStorage` dla wlaczenia rzek.
pub fn river_gen_storage_key() -> &'static str {
    &table().rzeki_przelacznik.klucze.magazyn_generowanie
}

/// Web `RIVER_GEN_PHASE_STORAGE_KEY` (riverGenSwitch.ts:10): klucz `localStorage` dla fazy.
pub fn river_gen_phase_storage_key() -> &'static str {
    &table().rzeki_przelacznik.klucze.magazyn_faza
}

/// Nazwa parametru URL czytana przez `getRiverGenEnabled` (riverGenSwitch.ts:42).
pub fn river_gen_url_param() -> &'static str {
    &table().rzeki_przelacznik.klucze.url_generowanie
}

/// Nazwa parametru URL czytana przez `getRiverGenPhase` (riverGenSwitch.ts:61).
pub fn river_gen_phase_url_param() -> &'static str {
    &table().rzeki_przelacznik.klucze.url_faza
}

/// Web `parse01` (riverGenSwitch.ts:26).
pub fn parse01(raw: Option<&str>) -> Option<bool> {
    let raw = raw?;
    let t = &table().rzeki_przelacznik;
    if t.tokeny_wylaczone.iter().any(|k| k == raw) {
        return Some(false);
    }
    if t.tokeny_wlaczone.iter().any(|k| k == raw) {
        return Some(true);
    }
    None
}

/// Web `parsePhase` (riverGenSwitch.ts:32).
pub fn parse_phase(raw: Option<&str>) -> Option<RiverGenPhase> {
    let raw = raw?;
    [
        RiverGenPhase::Main,
        RiverGenPhase::MainMedium,
        RiverGenPhase::All,
    ]
    .into_iter()
    .find(|phase| phase.as_str() == raw)
}

/// Stan modulowy `riverGenSwitch.ts` (`_override`, `_phaseOverride`) jako jawna struktura.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct RiverGenSwitch {
    enabled_override: Option<bool>,
    phase_override: Option<RiverGenPhase>,
}

impl RiverGenSwitch {
    /// Web `setRiverGenEnabledOverride`.
    pub fn set_enabled_override(&mut self, enabled: Option<bool>) {
        self.enabled_override = enabled;
    }

    /// Web `setRiverGenPhaseOverride`.
    pub fn set_phase_override(&mut self, phase: Option<RiverGenPhase>) {
        self.phase_override = phase;
    }

    /// Web `getRiverGenEnabled`: nadpisanie > parametr URL (`riverGen`) > magazyn
    /// (`civ-river-gen`) > domyslnie z tabeli.
    pub fn get_enabled(&self, url_param: Option<&str>, storage_value: Option<&str>) -> bool {
        if let Some(value) = self.enabled_override {
            return value;
        }
        if let Some(value) = parse01(url_param) {
            return value;
        }
        if let Some(value) = parse01(storage_value) {
            return value;
        }
        table().rzeki_przelacznik.generowanie_domyslne
    }

    /// Web `getRiverGenPhase`: nadpisanie > URL (`riverGenPhase`) > magazyn
    /// (`civ-river-gen-phase`) > faza domyslna z tabeli.
    pub fn get_phase(&self, url_param: Option<&str>, storage_value: Option<&str>) -> RiverGenPhase {
        if let Some(phase) = self.phase_override {
            return phase;
        }
        if let Some(phase) = parse_phase(url_param) {
            return phase;
        }
        if let Some(phase) = parse_phase(storage_value) {
            return phase;
        }
        parse_phase(Some(&table().rzeki_przelacznik.faza_domyslna))
            .expect("mapgen-nowa-gra.json: rzeki_przelacznik.faza_domyslna")
    }

    /// Web `isRiverGenMainOnly`.
    pub fn is_main_only(&self, url_param: Option<&str>, storage_value: Option<&str>) -> bool {
        self.get_phase(url_param, storage_value).as_str()
            == table().rzeki_przelacznik.faza_tylko_glowne
    }

    /// Web `isRiverGenFull`.
    pub fn is_full(&self, url_param: Option<&str>, storage_value: Option<&str>) -> bool {
        self.get_phase(url_param, storage_value).as_str() == table().rzeki_przelacznik.faza_pelna
    }
}
