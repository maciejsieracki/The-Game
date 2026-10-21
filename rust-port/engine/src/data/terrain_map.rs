//! Struktury danych 1:1 dla czterech plikow JSON terenu/mapy z `gra/data/`
//! (kopie w `rust-port/engine/data/`, embedded przez `include_str!`).
//!
//! Temat: R-RUSTPORT-P3-5D-DATA-TERRAIN-MAP-Q1. Ten modul NIE jest jeszcze
//! podpiety do `lib.rs` (zakaz w dispatchu); test laduje go przez `#[path]`.
//! Kazda struktura ma `deny_unknown_fields`, wiec test wykrywa kazdy klucz
//! JSON, ktorego struktura nie odwzorowuje.
#![allow(dead_code)]

use serde::{Deserialize, Serialize};

pub const TERRAIN_IMPROVEMENTS_JSON: &str = include_str!("../../data/terrain-improvements.json");
pub const TERRAIN_MOVEMENT_JSON: &str = include_str!("../../data/terrain-movement.json");
pub const TERRAIN_YIELDS_JSON: &str = include_str!("../../data/terrain-yields.json");
pub const MAP_GEN_PARAMS_JSON: &str = include_str!("../../data/map-gen-params.json");

// ---------------------------------------------------------------------------
// terrain-improvements.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainImprovementsFile {
    pub _meta: ImprovementsMeta,
    pub farma: Improvement,
    pub irygacja: Improvement,
    pub bydlo: Improvement,
    pub owce: Improvement,
    pub lama: Improvement,
    pub stadnina: Improvement,
    pub glinianka: Improvement,
    pub kamieniolom: Improvement,
    pub oboz_lowiecki: Improvement,
    pub wyrab: Improvement,
    pub tartak: Improvement,
    pub tarasy: Improvement,
    pub lodzie_rybackie: Improvement,
    pub warzelnia_soli: Improvement,
    pub fort: Improvement,
    pub droga: Improvement,
    pub droga_brukowana: Improvement,
    pub kopalnia_miedzi: Improvement,
    pub kopalnia_zelaza: Improvement,
    pub kopalnia_cyny: Improvement,
    pub kopalnia_zlota: Improvement,
    pub posterunek: Improvement,
    pub _miasto_zasieg_ref: MiastoZasiegRef,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ImprovementsMeta {
    pub opis: String,
    pub bonus_pola: String,
    pub epoka: String,
    #[serde(rename = "decyzje_MIASTO")]
    pub decyzje_miasto: String,
    pub kanon_zywnosc_hodowla: String,
    #[serde(rename = "decyzje_EKONOMIA")]
    pub decyzje_ekonomia: String,
    #[serde(rename = "klucze_surowcow_ASCII")]
    pub klucze_surowcow_ascii: String,
    pub pole_surowiec_ilosc_tura: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MiastoZasiegRef {
    pub _komentarz: String,
}

/// Bonus heksa. Klucze wystepuja tylko w niektorych ulepszeniach (np. `fort` ma `{}`).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ImprovementBonus {
    pub zywnosc: Option<i64>,
    pub praca: Option<i64>,
    pub handel: Option<i64>,
    pub pieniadz: Option<i64>,
    pub kamien: Option<i64>,
    pub glina: Option<i64>,
}

/// Blok `wyrab.wycinka`.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Wycinka {
    pub praca_per_tura: i64,
    pub tury: i64,
    pub usuwa_nakladke: String,
}

/// Jeden rekord ulepszenia terenu. Pola opcjonalne wystepuja tylko w czesci rekordow.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Improvement {
    pub nazwa: String,
    pub epoka: i64,
    pub bonus: ImprovementBonus,
    #[serde(rename = "surowiecOdblokowany")]
    pub surowiec_odblokowany: Option<String>,
    #[serde(rename = "surowiecOdblokowany_uwaga")]
    pub surowiec_odblokowany_uwaga: Option<String>,
    pub teren: String,
    pub warunek: String,
    pub koszt_praca: f64,
    pub tech: Option<String>,
    pub tech_uwaga: Option<String>,
    pub odblokowuje: String,
    pub uwagi: Option<String>,
    pub historia: String,
    /// Stawka produkcji surowca do magazynu panstwa, per ulepszenie, na ture.
    pub surowiec_ilosc_tura: Option<i64>,
    pub typ: Option<String>,
    pub wycinka: Option<Wycinka>,
    pub cywilizacje: Option<Vec<String>>,
    pub cywilizacje_uwaga: Option<String>,
    pub bonus_ruch: Option<i64>,
    pub bonus_ruch_uwaga: Option<String>,
    #[serde(rename = "upgradeFrom")]
    pub upgrade_from: Option<String>,
    pub bonus_obrona_proc: Option<i64>,
    pub bonus_wymaga_obozowania: Option<bool>,
    pub zasieg_pol: Option<i64>,
    pub zasieg_terytorium: Option<i64>,
    pub zasieg_kontroli: Option<i64>,
}

pub fn parse_terrain_improvements() -> Result<TerrainImprovementsFile, serde_json::Error> {
    serde_json::from_str(TERRAIN_IMPROVEMENTS_JSON)
}

// ---------------------------------------------------------------------------
// terrain-movement.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainMovementFile {
    pub costs: MovementCosts,
    #[serde(rename = "forestExtra")]
    pub forest_extra: i64,
}

/// Koszt ruchu per typ terenu (klucze ASCII, bez polskich znakow).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MovementCosts {
    #[serde(rename = "Laka")]
    pub laka: i64,
    #[serde(rename = "Rownina")]
    pub rownina: i64,
    #[serde(rename = "Pustynia")]
    pub pustynia: i64,
    #[serde(rename = "Wybrzeze")]
    pub wybrzeze: i64,
    #[serde(rename = "Wzgorza")]
    pub wzgorza: i64,
    #[serde(rename = "Gory")]
    pub gory: i64,
    #[serde(rename = "Morze")]
    pub morze: i64,
    #[serde(rename = "Polarny")]
    pub polarny: i64,
}

pub fn parse_terrain_movement() -> Result<TerrainMovementFile, serde_json::Error> {
    serde_json::from_str(TERRAIN_MOVEMENT_JSON)
}

// ---------------------------------------------------------------------------
// terrain-yields.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainYieldsFile {
    pub terrain_types: Vec<TerrainTypeYield>,
    pub terrain_modifiers: Vec<TerrainModifierYield>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainTypeYield {
    #[serde(rename = "Teren")]
    pub teren: String,
    #[serde(rename = "Żywność")]
    pub zywnosc: i64,
    #[serde(rename = "Praca")]
    pub praca: i64,
    #[serde(rename = "Podatek")]
    pub podatek: i64,
    #[serde(rename = "Drewno")]
    pub drewno: i64,
    #[serde(rename = "Kamień")]
    pub kamien: i64,
    #[serde(rename = "Glina")]
    pub glina: i64,
    #[serde(rename = "Suma")]
    pub suma: i64,
    #[serde(rename = "Uwagi")]
    pub uwagi: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct TerrainModifierYield {
    #[serde(rename = "Modyfikator")]
    pub modyfikator: String,
    #[serde(rename = "Żywność")]
    pub zywnosc: i64,
    #[serde(rename = "Praca")]
    pub praca: i64,
    #[serde(rename = "Podatek")]
    pub podatek: i64,
    #[serde(rename = "Drewno")]
    pub drewno: i64,
    #[serde(rename = "Kamień")]
    pub kamien: i64,
    #[serde(rename = "Glina")]
    pub glina: i64,
    #[serde(rename = "Suma")]
    pub suma: i64,
    #[serde(rename = "Uwagi")]
    pub uwagi: Option<String>,
}

pub fn parse_terrain_yields() -> Result<TerrainYieldsFile, serde_json::Error> {
    serde_json::from_str(TERRAIN_YIELDS_JSON)
}

// ---------------------------------------------------------------------------
// map-gen-params.json
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapGenParamsFile {
    pub _meta: MapGenMeta,
    pub mgla: Mgla,
    pub gestosc: Gestosc,
    pub mapa_skala: MapaSkala,
    pub generator: Generator,
    pub deposit_rules: DepositRules,
    pub metal_deposit_min_era: MetalDepositMinEra,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapGenMeta {
    pub opis: String,
    pub panel: String,
    pub export: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Mgla {
    pub default_sight_jednostki: DefaultSightJednostki,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DefaultSightJednostki {
    pub wartosc: i64,
    pub opis: String,
}

/// Trzy poziomy suwaka: low / medium / high.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Tier3<T> {
    pub low: T,
    pub medium: T,
    pub high: T,
}

/// Rozmiary map: mala / srednia / duza / ogromna / super.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct SizeTier<T> {
    pub mala: T,
    pub srednia: T,
    pub duza: T,
    pub ogromna: T,
    #[serde(rename = "super")]
    pub super_: T,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Gestosc {
    pub surowce_mult: Tier3<f64>,
    pub baseline_rarity_mult: f64,
    pub rzeki_max_mala_mapa: Tier3<i64>,
    pub river_scale: SizeTier<f64>,
    pub desert_noise_threshold: Tier3<f64>,
    pub forest_noise_threshold: Tier3<f64>,
    pub mountain_noise_threshold: Tier3<f64>,
    pub highland_noise_threshold: Tier3<f64>,
    pub relief_land_fraction: Tier3<ReliefPair>,
    pub relief_overflow_cap_frac: ReliefOverflowCapFrac,
    pub pasma_gorskie: PasmaGorskie,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefPair {
    pub mountain: f64,
    pub highland: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ReliefOverflowCapFrac {
    pub _opis: String,
    pub low: ReliefPair,
    pub medium: ReliefPair,
    pub high: ReliefPair,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PasmaTier {
    pub hexy_na_pasmo: i64,
    pub max_pasm_na_mase: i64,
    pub dlugosc_min: i64,
    pub dlugosc_max: i64,
    pub min_masa_hexow: i64,
    pub obrzeze_szansa: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct PasmaGorskie {
    pub _opis: String,
    pub low: PasmaTier,
    pub medium: PasmaTier,
    pub high: PasmaTier,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MapaSkala {
    pub _opis: String,
    pub aktywne_typy: SizeTier<i64>,
    pub domyslni_rywale: SizeTier<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Generator {
    pub default_width: i64,
    pub default_height: i64,
    pub rozmiar_dims: RozmiarDims,
}

/// Wymiary [szerokosc, wysokosc] per rozmiar mapy.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RozmiarDims {
    pub malenki: [i64; 2],
    pub maly: [i64; 2],
    pub standardowy: [i64; 2],
    pub duzy: [i64; 2],
    pub ogromny: [i64; 2],
    pub superogromny: [i64; 2],
}

/// Reguła rzadkosci zloza. `_opis` wystepuje tylko przy czesci zloz.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DepositRule {
    pub rarity: f64,
    pub _opis: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DepositRules {
    pub miedz: DepositRule,
    pub zelazo: DepositRule,
    pub glina: DepositRule,
    pub konie: DepositRule,
    pub wegiel: DepositRule,
    pub sol: DepositRule,
    pub zloto: DepositRule,
    pub cyna: DepositRule,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct MetalDepositMinEra {
    pub miedz: i64,
    pub zelazo: i64,
    pub wegiel: i64,
    pub cyna: i64,
}

pub fn parse_map_gen_params() -> Result<MapGenParamsFile, serde_json::Error> {
    serde_json::from_str(MAP_GEN_PARAMS_JSON)
}
