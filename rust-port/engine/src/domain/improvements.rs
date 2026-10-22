use serde::{Deserialize, Serialize};

/// Base terrain used by improvement qualification.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerrainType {
    Grassland,
    Plains,
    Hills,
    Mountains,
    Desert,
    Tundra,
    ShallowWater,
    Ocean,
}

#[allow(non_upper_case_globals)]
impl TerrainType {
    pub const Laka: Self = Self::Grassland;
    pub const Rownina: Self = Self::Plains;
    pub const Wzgorza: Self = Self::Hills;
    pub const Gory: Self = Self::Mountains;
    pub const Pustynia: Self = Self::Desert;
    pub const Polarny: Self = Self::Tundra;
    pub const PlytkieMorze: Self = Self::ShallowWater;
    pub const Morze: Self = Self::Ocean;

    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    pub const fn is_flat_land(self) -> bool {
        matches!(self, Self::Grassland | Self::Plains)
    }

    pub const fn is_land(self) -> bool {
        !self.is_water()
    }
}

/// Natural overlay/deposit read by the qualification rules.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Deposit {
    #[serde(rename = "bydlo", alias = "cattle")]
    Cattle,
    #[serde(rename = "owce", alias = "sheep")]
    Sheep,
    #[serde(rename = "lama")]
    Llama,
    #[serde(rename = "kon", alias = "horse")]
    Horse,
    #[serde(rename = "glina", alias = "clay")]
    Clay,
    #[serde(rename = "miedz", alias = "copper")]
    Copper,
    #[serde(rename = "zelazo", alias = "iron")]
    Iron,
    #[serde(rename = "cyna", alias = "tin")]
    Tin,
    #[serde(rename = "zloto", alias = "gold")]
    Gold,
    #[serde(rename = "sol", alias = "salt")]
    Salt,
}

/// Terrain-improvement identifiers. `Trzoda` is the player-facing name for
/// the legacy data key `bydlo`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ImprovementKey {
    #[serde(rename = "farma", alias = "farm")]
    Farm,
    #[serde(rename = "irygacja", alias = "irrigation")]
    Irrigation,
    #[serde(rename = "bydlo", alias = "cattle", alias = "trzoda")]
    Cattle,
    #[serde(rename = "owce", alias = "sheep")]
    Sheep,
    #[serde(rename = "lama")]
    Llama,
    #[serde(rename = "stadnina", alias = "horse_ranch")]
    HorseRanch,
    #[serde(rename = "tartak", alias = "lumber_mill")]
    LumberMill,
    #[serde(rename = "oboz_lowiecki", alias = "hunting_camp")]
    HuntingCamp,
    #[serde(rename = "glinianka", alias = "clay_pit")]
    ClayPit,
    #[serde(rename = "kamieniolom", alias = "quarry")]
    Quarry,
    #[serde(rename = "kopalnia_miedzi", alias = "copper_mine")]
    CopperMine,
    #[serde(rename = "kopalnia_zelaza", alias = "iron_mine")]
    IronMine,
    #[serde(rename = "kopalnia_cyny", alias = "tin_mine")]
    TinMine,
    #[serde(rename = "kopalnia_zlota", alias = "gold_mine")]
    GoldMine,
    #[serde(rename = "warzelnia_soli", alias = "salt_works")]
    SaltWorks,
    #[serde(rename = "lodzie_rybackie", alias = "fishing_boats")]
    FishingBoats,
    #[serde(rename = "tarasy", alias = "terraces")]
    Terraces,
    #[serde(rename = "droga", alias = "road")]
    Road,
    #[serde(rename = "droga_brukowana", alias = "paved_road")]
    PavedRoad,
    #[serde(rename = "wyrab", alias = "clearing")]
    Clearing,
    #[serde(rename = "fort")]
    Fort,
    #[serde(rename = "posterunek", alias = "outpost")]
    Outpost,
}

pub type Improvement = ImprovementKey;

#[allow(non_upper_case_globals)]
impl ImprovementKey {
    /// Polish/legacy aliases retained at the domain boundary.
    pub const Trzoda: Self = Self::Cattle;
    pub const Bydlo: Self = Self::Cattle;
    pub const Farma: Self = Self::Farm;
    pub const Irygacja: Self = Self::Irrigation;
    pub const Tartak: Self = Self::LumberMill;
    pub const ObozLowiecki: Self = Self::HuntingCamp;
    pub const Glinianka: Self = Self::ClayPit;
    pub const Kamieniolom: Self = Self::Quarry;
    pub const KopalniaMiedzi: Self = Self::CopperMine;
    pub const KopalniaZelaza: Self = Self::IronMine;
    pub const KopalniaCyny: Self = Self::TinMine;
    pub const KopalniaZlota: Self = Self::GoldMine;
    pub const WazelniaSoli: Self = Self::SaltWorks;
    pub const LodzieRybackie: Self = Self::FishingBoats;
    pub const Droga: Self = Self::Road;
    pub const DrogaBrukowana: Self = Self::PavedRoad;
    pub const Wyreb: Self = Self::Clearing;
    pub const Forteca: Self = Self::Fort;
    pub const Posterunek: Self = Self::Outpost;
}

/// Minimal map-field snapshot needed by pure improvement rules.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Tile {
    pub terrain: TerrainType,
    pub forest: bool,
    pub river_adjacent: bool,
    pub deposit: Option<Deposit>,
    pub improvements: Vec<ImprovementKey>,
    /// Livestock types already unlocked by the empire's first matching deposit.
    /// Missing in older saves means that no type has been unlocked yet.
    #[serde(default)]
    pub livestock_unlocked: Vec<Deposit>,
    /// Set when the empire already unlocked horses; it is separate from a
    /// horse deposit because the live game has a civ-wide unlock path.
    #[serde(default)]
    pub horse_unlocked: bool,
}

impl Tile {
    pub const fn new(terrain: TerrainType) -> Self {
        Self {
            terrain,
            forest: false,
            river_adjacent: false,
            deposit: None,
            improvements: Vec::new(),
            livestock_unlocked: Vec::new(),
            horse_unlocked: false,
        }
    }
}

/// Per-field bonus plus optional civ-wide logistics production.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct Production {
    #[serde(rename = "zywnosc", alias = "food")]
    pub food: u32,
    #[serde(rename = "praca", alias = "work")]
    pub work: u32,
    #[serde(rename = "handel", alias = "trade")]
    pub trade: u32,
    #[serde(default, rename = "pieniadz", alias = "money")]
    pub money: u32,
    #[serde(default, rename = "glina", alias = "clay")]
    pub clay: u32,
    #[serde(default, rename = "kamien", alias = "stone")]
    pub stone: u32,
    #[serde(default)]
    pub resource: Option<String>,
    #[serde(default)]
    pub resource_amount: u32,
}

impl Production {
    pub fn resource(resource: impl Into<String>, amount: u32) -> Self {
        Self {
            resource: Some(resource.into()),
            resource_amount: amount,
            ..Self::default()
        }
    }
}

/// Returns whether `key` can be built on the supplied field.
///
/// This is deliberately pure: ownership, technology, work cost and territory
/// are checked by callers. The forest rule for Trzoda is intentionally a
/// hard qualification gate, not merely a UI hint, so alternate build paths
/// cannot bypass it.
pub fn qualifies(key: ImprovementKey, tile: &Tile) -> bool {
    if tile.improvements.contains(&key) {
        return false;
    }

    if !terrain_gate(key, tile) || !deposit_gate(key, tile) || forest_gate(key, tile) {
        return false;
    }

    layers_allow(key, &tile.improvements)
}

pub fn qualifies_improvement(tile: &Tile, key: ImprovementKey) -> bool {
    qualifies(key, tile)
}

pub fn can_build_improvement(tile: &Tile, key: ImprovementKey) -> bool {
    qualifies(key, tile)
}

fn terrain_gate(key: ImprovementKey, tile: &Tile) -> bool {
    use ImprovementKey::*;

    match key {
        Farm | Cattle | HorseRanch => tile.terrain.is_flat_land(),
        Irrigation => {
            matches!(
                tile.terrain,
                TerrainType::Grassland | TerrainType::Plains | TerrainType::Desert
            ) && tile.river_adjacent
        }
        Sheep => tile.terrain == TerrainType::Hills,
        Llama => matches!(tile.terrain, TerrainType::Hills | TerrainType::Mountains),
        Terraces => tile.terrain == TerrainType::Hills,
        LumberMill | HuntingCamp => matches!(
            tile.terrain,
            TerrainType::Grassland | TerrainType::Plains | TerrainType::Hills | TerrainType::Desert
        ),
        Clearing => matches!(
            tile.terrain,
            TerrainType::Grassland | TerrainType::Plains | TerrainType::Hills
        ),
        Quarry | CopperMine | IronMine | TinMine | GoldMine => {
            matches!(tile.terrain, TerrainType::Hills | TerrainType::Mountains)
        }
        FishingBoats => matches!(tile.terrain, TerrainType::ShallowWater | TerrainType::Ocean),
        SaltWorks => tile.terrain.is_land() || tile.terrain == TerrainType::ShallowWater,
        ClayPit | Road | PavedRoad | Fort | Outpost => tile.terrain.is_land(),
    }
}

fn forest_gate(key: ImprovementKey, tile: &Tile) -> bool {
    use ImprovementKey::*;

    if !tile.forest {
        return false;
    }

    // Trzoda is intentionally blocked on forest. This is checked separately
    // from the generic food rules because it must remain true even when a
    // direct build command bypasses the panel and even when Farm is present.
    matches!(key, Farm | Irrigation | Cattle | Terraces)
}

fn deposit_gate(key: ImprovementKey, tile: &Tile) -> bool {
    use ImprovementKey::*;

    match key {
        Farm | Irrigation | Terraces => tile.deposit.is_none(),
        ClayPit => tile.deposit == Some(Deposit::Clay),
        CopperMine => tile.deposit == Some(Deposit::Copper),
        IronMine => tile.deposit == Some(Deposit::Iron),
        TinMine => tile.deposit == Some(Deposit::Tin),
        GoldMine => tile.deposit == Some(Deposit::Gold),
        SaltWorks => {
            tile.deposit == Some(Deposit::Salt) || tile.terrain == TerrainType::ShallowWater
        }
        Cattle => livestock_gate(tile, Deposit::Cattle),
        Sheep => livestock_gate(tile, Deposit::Sheep),
        Llama => livestock_gate(tile, Deposit::Llama),
        HorseRanch => tile.horse_unlocked || tile.deposit == Some(Deposit::Horse),
        LumberMill | Clearing | HuntingCamp => tile.forest,
        _ => true,
    }
}

fn livestock_gate(tile: &Tile, deposit: Deposit) -> bool {
    tile.deposit == Some(deposit) || tile.livestock_unlocked.contains(&deposit)
}

fn layers_allow(key: ImprovementKey, existing: &[ImprovementKey]) -> bool {
    use ImprovementKey::*;

    match key {
        HuntingCamp => return existing.contains(&LumberMill),
        PavedRoad => return existing.contains(&Road),
        _ => {}
    }

    let is_food_layer = |item: &ImprovementKey| {
        matches!(item, Farm | Irrigation | Cattle | Sheep | Llama | Terraces)
    };
    let is_solo_food = |item: &ImprovementKey| matches!(item, Sheep | Llama | Terraces);

    if !is_food_layer(&key) {
        return true;
    }

    if is_solo_food(&key) {
        return !existing.iter().any(is_food_layer);
    }

    if existing.iter().any(is_solo_food) {
        return false;
    }

    match key {
        // Irygacja and Trzoda can coexist only when Farm is already present.
        // Farm + Irygacja + Trzoda is the accepted three-layer food stack.
        Irrigation if existing.contains(&Cattle) => existing.contains(&Farm),
        Cattle if existing.contains(&Irrigation) => existing.contains(&Farm),
        _ => true,
    }
}

/// Canonical per-improvement production values used by the Rust port.
pub fn production_for(key: ImprovementKey) -> Production {
    use ImprovementKey::*;

    match key {
        Farm => Production {
            food: 3,
            work: 3,
            trade: 3,
            ..Production::default()
        },
        Irrigation => Production {
            food: 5,
            work: 2,
            trade: 2,
            ..Production::default()
        },
        Cattle => Production {
            food: 2,
            work: 4,
            trade: 3,
            ..Production::default()
        },
        Sheep => Production {
            food: 1,
            work: 2,
            trade: 2,
            ..Production::default()
        },
        Llama => Production {
            food: 1,
            work: 3,
            trade: 3,
            ..Production::default()
        },
        HorseRanch => Production {
            work: 2,
            trade: 2,
            ..Production::resource("kon", 25)
        },
        LumberMill => Production {
            work: 3,
            trade: 3,
            ..Production::resource("drewno", 200)
        },
        ClayPit => Production {
            work: 1,
            trade: 2,
            clay: 10,
            ..Production::resource("glina", 50)
        },
        Quarry => Production {
            work: 1,
            trade: 2,
            stone: 5,
            ..Production::resource("kamien", 200)
        },
        CopperMine | TinMine => Production {
            work: 2,
            trade: 5,
            ..Production::resource(
                if matches!(key, CopperMine) {
                    "ruda"
                } else {
                    "ruda_cyny"
                },
                20,
            )
        },
        IronMine => Production {
            work: 2,
            trade: 5,
            ..Production::resource("ruda_zelaza", 20)
        },
        GoldMine => Production {
            work: 2,
            trade: 10,
            ..Production::resource("zloto", 1)
        },
        SaltWorks => Production {
            food: 1,
            work: 1,
            trade: 3,
            money: 1,
            ..Production::resource("sol", 50)
        },
        HuntingCamp => Production {
            food: 1,
            work: 1,
            trade: 2,
            money: 1,
            ..Production::default()
        },
        Terraces => Production {
            food: 3,
            work: 2,
            trade: 2,
            ..Production::default()
        },
        FishingBoats => Production {
            food: 2,
            work: 3,
            trade: 3,
            ..Production::default()
        },
        Road => Production {
            trade: 2,
            ..Production::default()
        },
        PavedRoad => Production {
            trade: 3,
            ..Production::default()
        },
        Clearing => Production {
            trade: 1,
            ..Production::default()
        },
        Fort | Outpost => Production::default(),
    }
}

pub fn improvement_production(key: ImprovementKey) -> Production {
    production_for(key)
}

// ---------------------------------------------------------------------------
// P6.3 (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1): port `gra/src/game/terrain-improvements.ts`.
//
// Web pracuje na kluczach tekstowych z `terrain-improvements.json` (dane + kolejnosc kluczy),
// a nie na enumie `ImprovementKey` powyzej, dlatego port jest oparty o `ImprovementCatalog`
// (ten sam plik `data/terrain-improvements.json`, kolejnosc kluczy zachowana). Skale, listy
// i stale regul leza w `data/derived/ulepszenia-reguly.json`; kod nie zawiera ich literalow.
// ---------------------------------------------------------------------------

use std::sync::OnceLock;

use serde_json::Value;

use crate::data::derived::{ulepszenia_reguly, UlepszeniaRegulyFile};
use crate::data::terrain_map::TERRAIN_IMPROVEMENTS_JSON;
use crate::domain::start_position::Overlay;

/// Web `Math.round`: polowki zaokraglane w strone +nieskonczonosci (`Math.round(-2.5) === -2`),
/// bez bledu `floor(x + 0.5)` dla `0.49999999999999994`.
pub(crate) fn js_round(x: f64) -> f64 {
    if !x.is_finite() {
        return x;
    }
    let floor = x.floor();
    if x - floor >= 0.5 {
        floor + 1.0
    } else {
        floor
    }
}

/// Web `ImprovementBonus` (`terrain-improvements.ts:14`): bonus plonow heksa; brak klucza = `None`.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct CatalogBonus {
    pub zywnosc: Option<f64>,
    pub praca: Option<f64>,
    pub handel: Option<f64>,
    pub pieniadz: Option<f64>,
    pub drewno: Option<f64>,
    pub kamien: Option<f64>,
    pub glina: Option<f64>,
}

/// Web `ImprovementRow` (`terrain-improvements.ts:16`): pola uzywane przez logike.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CatalogRow {
    pub bonus: Option<CatalogBonus>,
    pub nazwa: Option<String>,
    pub epoka: Option<f64>,
    pub koszt_praca: Option<f64>,
    pub typ: Option<String>,
    pub surowiec_ilosc_tura: Option<f64>,
    pub surowiec_odblokowany: Option<String>,
    pub cywilizacje: Option<Vec<String>>,
}

fn json_number(value: Option<&Value>) -> Option<f64> {
    value.and_then(Value::as_f64)
}

fn json_string(value: Option<&Value>) -> Option<String> {
    value.and_then(Value::as_str).map(str::to_owned)
}

impl CatalogRow {
    fn from_json(value: &Value) -> Self {
        let bonus = value.get("bonus").and_then(Value::as_object).map(|bonus| {
            let number = |key: &str| json_number(bonus.get(key));
            CatalogBonus {
                zywnosc: number("zywnosc"),
                praca: number("praca"),
                handel: number("handel"),
                pieniadz: number("pieniadz"),
                drewno: number("drewno"),
                kamien: number("kamien"),
                glina: number("glina"),
            }
        });
        Self {
            bonus,
            nazwa: json_string(value.get("nazwa")),
            epoka: json_number(value.get("epoka")),
            koszt_praca: json_number(value.get("koszt_praca")),
            typ: json_string(value.get("typ")),
            surowiec_ilosc_tura: json_number(value.get("surowiec_ilosc_tura")),
            surowiec_odblokowany: json_string(value.get("surowiecOdblokowany")),
            cywilizacje: value
                .get("cywilizacje")
                .and_then(Value::as_array)
                .map(|list| {
                    list.iter()
                        .filter_map(Value::as_str)
                        .map(str::to_owned)
                        .collect()
                }),
        }
    }
}

/// Obiekt JSON z zachowana kolejnoscia kluczy (`serde_json::Value` bez `preserve_order`
/// sortowalby klucze, a web `Object.keys` zachowuje kolejnosc pliku).
struct OrderedObject(Vec<(String, Value)>);

impl<'de> serde::Deserialize<'de> for OrderedObject {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: serde::Deserializer<'de>,
    {
        struct Visitor;
        impl<'de> serde::de::Visitor<'de> for Visitor {
            type Value = OrderedObject;

            fn expecting(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                f.write_str("obiekt JSON")
            }

            fn visit_map<A>(self, mut map: A) -> Result<Self::Value, A::Error>
            where
                A: serde::de::MapAccess<'de>,
            {
                let mut rows = Vec::new();
                while let Some((key, value)) = map.next_entry::<String, Value>()? {
                    rows.push((key, value));
                }
                Ok(OrderedObject(rows))
            }
        }
        deserializer.deserialize_map(Visitor)
    }
}

/// Web `IMPROVEMENTS` (`terrain-improvements.ts:29`): wszystkie klucze pliku, tez `_meta`.
#[derive(Debug, Clone, PartialEq)]
pub struct ImprovementCatalog {
    rows: Vec<(String, CatalogRow)>,
}

impl ImprovementCatalog {
    pub fn from_json(json: &str) -> Result<Self, serde_json::Error> {
        let ordered: OrderedObject = serde_json::from_str(json)?;
        Ok(Self {
            rows: ordered
                .0
                .into_iter()
                .map(|(key, value)| (key, CatalogRow::from_json(&value)))
                .collect(),
        })
    }

    /// Web `IMPROVEMENTS[key]` (wlasne wiersze pliku; nazwy prototypu JS obsluguje `normalize_improvement_key`).
    pub fn row(&self, key: &str) -> Option<&CatalogRow> {
        self.rows
            .iter()
            .find(|(name, _)| name == key)
            .map(|(_, row)| row)
    }

    /// Web `IMPROVEMENT_KEYS` (`terrain-improvements.ts:66`): klucze bez prefiksu `_`, w kolejnosci pliku.
    pub fn keys(&self) -> Vec<String> {
        self.rows
            .iter()
            .filter(|(key, _)| !key.starts_with('_'))
            .map(|(key, _)| key.clone())
            .collect()
    }
}

/// Katalog z `data/terrain-improvements.json` (jednorazowy odczyt).
pub fn improvement_catalog() -> &'static ImprovementCatalog {
    static CATALOG: OnceLock<ImprovementCatalog> = OnceLock::new();
    CATALOG.get_or_init(|| {
        ImprovementCatalog::from_json(TERRAIN_IMPROVEMENTS_JSON)
            .expect("terrain-improvements.json must parse")
    })
}

fn rules() -> &'static UlepszeniaRegulyFile {
    ulepszenia_reguly()
}

/// Web `Hex` w zakresie czytanym przez `terrain-improvements.ts`: warstwy ulepszen, nakladka i
/// runtime-owe pole `zloze`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct HexLike {
    /// Web `ulepszenie?: unknown` (pojedyncze ulepszenie; `None` = brak pola).
    pub ulepszenie: Option<String>,
    /// Web `ulepszenia?: readonly string[] | null`.
    pub ulepszenia: Option<Vec<String>>,
    pub nakladka: Option<Overlay>,
    pub zloze: Option<String>,
}

/// Web `TileYield` (`economy.ts:256`): plony heksa.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct TileYield {
    pub zywnosc: f64,
    pub praca: f64,
    pub handel: f64,
    pub drewno: f64,
    pub kamien: f64,
    pub glina: f64,
    pub ruda: f64,
    pub ruda_zelaza: f64,
}

/// Web `TerritoryResourceYield` (`terrain-improvements.ts:207`).
#[derive(Debug, Clone, PartialEq)]
pub struct TerritoryResourceYield {
    pub resource_key: String,
    pub amount: f64,
}

/// Wynik `oreYieldFromImprovements`.
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct OreYield {
    pub ruda: f64,
    pub ruda_zelaza: f64,
}

fn lowered_trimmed(value: Option<&str>) -> Option<String> {
    value.map(|value| value.trim().to_lowercase())
}

/// Web `IMPROVEMENT_KEYS` (`terrain-improvements.ts:66`).
pub fn improvement_keys() -> Vec<String> {
    improvement_catalog().keys()
}

/// Web `normalizeImprovementKey` (`terrain-improvements.ts:109`). `IMPROVEMENTS` jest zwyklym
/// obiektem JS, wiec `IMPROVEMENTS[klucz]` jest prawdziwe tez dla nazw z `Object.prototype`
/// (`constructor`, `toString`, ...): takie klucze przechodza, tak jak w webie
/// (tabela `klucze_prototypu_js` w `ulepszenia-reguly.json`).
pub fn normalize_improvement_key(raw: Option<&str>) -> Option<String> {
    let raw = raw.filter(|raw| !raw.is_empty())?;
    if raw == "brak" {
        return None;
    }
    let catalog = improvement_catalog();
    let rules = rules();
    let truthy = |name: &str| {
        catalog.row(name).is_some() || rules.klucze_prototypu_js.klucze.iter().any(|k| k == name)
    };
    let key = rules
        .aliasy_legacy
        .aliasy
        .iter()
        .find(|alias| alias.stary == raw)
        .map_or(raw, |alias| alias.nowy.as_str());
    if truthy(key) {
        Some(key.to_owned())
    } else if truthy(raw) {
        Some(raw.to_owned())
    } else {
        None
    }
}

/// Web `migrateLegacyKopalniaKey` (`terrain-improvements.ts:40`): `None` = migracja niemozliwa.
pub fn migrate_legacy_kopalnia_key(key: &str, hex: Option<&HexLike>) -> Option<String> {
    let migration = &rules().migracja_kopalni;
    if key != migration.klucz_legacy {
        return Some(key.to_owned());
    }
    let zloze = lowered_trimmed(hex.and_then(|hex| hex.zloze.as_deref()));
    if zloze.as_deref() == Some(migration.zloze_zelazo.zloze.as_str()) {
        return Some(migration.zloze_zelazo.ulepszenie.clone());
    }
    let is_copper_deposit = zloze
        .as_deref()
        .is_some_and(|zloze| migration.zloza_miedzi.iter().any(|name| name == zloze));
    let is_ore_overlay = hex
        .and_then(|hex| hex.nakladka)
        .is_some_and(|overlay| overlay.web_value() == migration.nakladka_rudy);
    if is_copper_deposit || is_ore_overlay {
        return Some(migration.ulepszenie_miedzi.clone());
    }
    if zloze.as_deref() == Some(migration.zloze_bez_migracji.as_str()) {
        return None;
    }
    Some(migration.ulepszenie_miedzi.clone())
}

/// Web `migrateImprovementLayers` (`terrain-improvements.ts:53`).
pub fn migrate_improvement_layers(layers: &[String], hex: Option<&HexLike>) -> Vec<String> {
    layers
        .iter()
        .filter_map(|raw| migrate_legacy_kopalnia_key(raw, hex))
        .filter(|migrated| !migrated.is_empty())
        .collect()
}

/// Web `terrainImprovementEraMultiplier` (`terrain-improvements.ts:82`): ostatnia epoka z tabeli
/// kontynuuje podwajanie (`mnoznik_ostatniej * podstawa ^ (epoka - ostatnia)`).
pub fn terrain_improvement_era_multiplier(era: Option<f64>) -> f64 {
    let scale = &rules().skala_pracy;
    let normalized = match era {
        Some(era) if era.is_finite() => era.floor(),
        _ => scale.epoka_domyslna,
    };
    let first_era = scale
        .mnozniki_epoki
        .keys()
        .next()
        .copied()
        .expect("mnozniki_epoki nie moze byc pusta");
    let last_era = scale
        .mnozniki_epoki
        .keys()
        .next_back()
        .copied()
        .expect("mnozniki_epoki nie moze byc pusta");
    if normalized <= first_era as f64 {
        return scale.mnozniki_epoki[&first_era];
    }
    if normalized.abs() < i64::MAX as f64 {
        if let Some(mapped) = scale.mnozniki_epoki.get(&(normalized as i64)) {
            return *mapped;
        }
    }
    scale.mnozniki_epoki[&last_era] * scale.podstawa_podwajania.powf(normalized - last_era as f64)
}

/// Web `terrainImprovementEraForKey` (`terrain-improvements.ts:93`).
pub fn terrain_improvement_era_for_key(key: Option<&str>) -> f64 {
    normalize_improvement_key(key)
        .and_then(|normalized| improvement_catalog().row(&normalized)?.epoka)
        .filter(|era| era.is_finite())
        .unwrap_or(rules().skala_pracy.epoka_domyslna)
}

/// Web `scaleImprovementWorkCost` (`r-stawki-strojenie.ts:50`; zaleznosc, wlasciciel: P6.7).
pub fn scale_improvement_work_cost(base: f64) -> f64 {
    if !base.is_finite() || base <= 0.0 {
        return 0.0;
    }
    js_round(base * rules().skala_pracy.fala2_mnoznik).max(1.0)
}

/// Web `scaleTerrainImprovementWorkCost` (`terrain-improvements.ts:100`).
pub fn scale_terrain_improvement_work_cost(base: f64, era: Option<f64>) -> f64 {
    let stone_base = scale_improvement_work_cost(base);
    if stone_base <= 0.0 {
        return 0.0;
    }
    stone_base * terrain_improvement_era_multiplier(era)
}

/// Web `improvementBonusForKey` (`terrain-improvements.ts:117`): bez normalizacji klucza.
pub fn improvement_bonus_for_key(key: &str) -> CatalogBonus {
    improvement_catalog()
        .row(key)
        .and_then(|row| row.bonus)
        .unwrap_or_default()
}

fn add_nonzero(target: &mut f64, bonus: Option<f64>) {
    if let Some(value) = bonus.filter(|value| *value != 0.0 && !value.is_nan()) {
        *target += value;
    }
}

/// Web `applyImprovementBonus` (`terrain-improvements.ts:127`): `pieniadz` liczy sie jako `handel`.
pub fn apply_improvement_bonus(yld: &mut TileYield, improvement_key: Option<&str>) {
    let Some(key) = improvement_key.filter(|key| !key.is_empty()) else {
        return;
    };
    let bonus = improvement_bonus_for_key(key);
    add_nonzero(&mut yld.zywnosc, bonus.zywnosc);
    add_nonzero(&mut yld.praca, bonus.praca);
    add_nonzero(&mut yld.handel, bonus.handel);
    add_nonzero(&mut yld.handel, bonus.pieniadz);
    add_nonzero(&mut yld.drewno, bonus.drewno);
    add_nonzero(&mut yld.kamien, bonus.kamien);
    add_nonzero(&mut yld.glina, bonus.glina);
}

/// Web `applyImprovementBonuses` (`terrain-improvements.ts:175`).
pub fn apply_improvement_bonuses(yld: &mut TileYield, improvement_keys: &[String]) {
    for key in improvement_keys {
        apply_improvement_bonus(yld, Some(key));
    }
}

/// Web `oreYieldFromImprovements` (`terrain-improvements.ts:157`; `zloze` ignorowane jak w webie).
pub fn ore_yield_from_improvements(improvement_keys: &[String], _zloze: Option<&str>) -> OreYield {
    let ore = &rules().ruda;
    let mut out = OreYield::default();
    for raw in improvement_keys {
        let Some(key) = normalize_improvement_key(Some(raw)) else {
            continue;
        };
        let Some(mine) = ore.kopalnie.iter().find(|mine| mine.ulepszenie == key) else {
            continue;
        };
        match mine.surowiec.as_str() {
            "ruda" => out.ruda += ore.na_kopalnie,
            "ruda_zelaza" => out.ruda_zelaza += ore.na_kopalnie,
            _ => {}
        }
    }
    out
}

/// Web `resourceProductionAmountForEra` (`terrain-improvements.ts:225`).
pub fn resource_production_amount_for_era(key: &str, base_amount: f64, era: Option<f64>) -> f64 {
    let production = &rules().produkcja_epoka;
    if !production
        .ulepszenia_skalowane
        .iter()
        .any(|name| name == key)
    {
        return base_amount;
    }
    let first = production.epoka_min as f64;
    let normalized = match era {
        Some(era) if era.fract() == 0.0 && era > first && era <= production.epoka_max as f64 => era,
        _ => first,
    };
    js_round(base_amount * production.mnoznik_za_epoke.powf(normalized - first))
}

fn territory_yield_amount_for_key(key: &str) -> f64 {
    improvement_catalog()
        .row(key)
        .and_then(|row| row.surowiec_ilosc_tura)
        .filter(|amount| amount.is_finite() && *amount > 0.0)
        .unwrap_or(rules().terytorium.domyslna_ilosc)
}

/// Web `territoryResourceYieldForImprovement` (`terrain-improvements.ts:256`).
pub fn territory_resource_yield_for_improvement(
    key: Option<&str>,
    _zloze: Option<&str>,
    era: Option<f64>,
) -> Option<TerritoryResourceYield> {
    let norm = normalize_improvement_key(key)?;
    let resource = rules()
        .terytorium
        .ulepszenia
        .iter()
        .find(|row| row.ulepszenie == norm)?;
    Some(TerritoryResourceYield {
        resource_key: resource.surowiec.clone(),
        amount: resource_production_amount_for_era(
            &norm,
            territory_yield_amount_for_key(&norm),
            era,
        ),
    })
}

/// Web `foodLayerFromAnimalDeposit` (`terrain-improvements.ts:293`).
pub fn food_layer_from_animal_deposit(nakladka: Option<Overlay>) -> Option<String> {
    let overlay = nakladka?;
    rules()
        .zloze_zwierzece
        .wiersze
        .iter()
        .find(|row| row.nakladka == overlay.web_value())
        .map(|row| row.ulepszenie.clone())
}

/// Web `improvementKeysForHex` (`terrain-improvements.ts:302`): jawnie postawione warstwy,
/// bez duplikatow, w kolejnosci pierwszego wystapienia.
pub fn improvement_keys_for_hex(hex: &HexLike) -> Vec<String> {
    if let Some(layers) = hex.ulepszenia.as_ref().filter(|layers| !layers.is_empty()) {
        let mut keys: Vec<String> = Vec::new();
        for layer in layers {
            if let Some(key) = normalize_improvement_key(Some(layer)) {
                if !keys.contains(&key) {
                    keys.push(key);
                }
            }
        }
        return keys;
    }
    let single = hex.ulepszenie.as_deref().unwrap_or("brak");
    normalize_improvement_key(Some(single))
        .map(|key| vec![key])
        .unwrap_or_default()
}

fn is_road_key(key: &str) -> bool {
    rules().drogi.ulepszenia.iter().any(|road| road == key)
}

/// Web `ROAD_IMPROVEMENT_KEYS` (`terrain-improvements.ts:320`).
pub fn road_improvement_keys() -> &'static [String] {
    &rules().drogi.ulepszenia
}

/// Web `hexHasCoveringTerrainImprovement` (`terrain-improvements.ts:326`).
pub fn hex_has_covering_terrain_improvement(hex: &HexLike) -> bool {
    improvement_keys_for_hex(hex)
        .iter()
        .any(|key| !is_road_key(key))
}

/// Web `improvementHidesDepositOnHex` (`terrain-improvements.ts:333`).
pub fn improvement_hides_deposit_on_hex(
    improvement_key: &str,
    nakladka: Option<Overlay>,
    zloze: Option<&str>,
) -> bool {
    let Some(key) = normalize_improvement_key(Some(improvement_key)) else {
        return false;
    };
    let zloze = lowered_trimmed(zloze);
    rules()
        .ukrywanie_zloza
        .wiersze
        .iter()
        .find(|row| row.ulepszenie == key)
        .is_some_and(|row| {
            nakladka
                .is_some_and(|overlay| row.nakladki.iter().any(|name| name == overlay.web_value()))
                || zloze
                    .as_deref()
                    .is_some_and(|zloze| row.zloza.iter().any(|name| name == zloze))
        })
}

/// Web `hexSuppressesDepositOverlay` (`terrain-improvements.ts:370`).
pub fn hex_suppresses_deposit_overlay(hex: &HexLike, extra_layers: Option<&[String]>) -> bool {
    let mut keys = improvement_keys_for_hex(hex);
    if let Some(extra) = extra_layers {
        for raw in extra {
            if let Some(normalized) = normalize_improvement_key(Some(raw)) {
                if !keys.contains(&normalized) {
                    keys.push(normalized);
                }
            }
        }
    }
    keys.iter()
        .any(|key| improvement_hides_deposit_on_hex(key, hex.nakladka, hex.zloze.as_deref()))
}

/// Web `improvementDisplayName` (`terrain-improvements.ts:385`).
pub fn improvement_display_name(key: &str) -> String {
    improvement_catalog()
        .row(key)
        .and_then(|row| row.nazwa.clone())
        .unwrap_or_else(|| key.to_owned())
}

/// Web `LIVESTOCK_IMPROVEMENT_KEYS` (`terrain-improvements.ts:396`).
pub fn livestock_improvement_keys() -> Vec<String> {
    let catalog = improvement_catalog();
    catalog
        .keys()
        .into_iter()
        .filter(|key| {
            catalog
                .row(key)
                .and_then(|row| row.surowiec_odblokowany.as_deref())
                .is_some_and(|resource| rules().hodowla.surowce.iter().any(|name| name == resource))
        })
        .collect()
}

/// Web `isLivestockImprovementKey` (`terrain-improvements.ts:402`).
pub fn is_livestock_improvement_key(key: &str) -> bool {
    normalize_improvement_key(Some(key))
        .is_some_and(|norm| livestock_improvement_keys().contains(&norm))
}

/// Web `improvementAllowedCivs` (`terrain-improvements.ts:421`).
pub fn improvement_allowed_civs(key: &str) -> Option<&'static [String]> {
    improvement_catalog()
        .row(key)
        .and_then(|row| row.cywilizacje.as_deref())
}

/// Web `isImprovementAllowedForCiv` (`terrain-improvements.ts:426`).
pub fn is_improvement_allowed_for_civ(key: &str, typ_cywilizacji: Option<&str>) -> bool {
    let Some(allowed) = improvement_allowed_civs(key).filter(|allowed| !allowed.is_empty()) else {
        return true;
    };
    let civ = lowered_trimmed(typ_cywilizacji).unwrap_or_default();
    if civ.is_empty() {
        return false;
    }
    allowed.iter().any(|name| name.trim().to_lowercase() == civ)
}

/// Web `FARMA_POTENTIAL_FOOD_BONUS` (`terrain-improvements.ts:445`).
pub fn farma_potential_food_bonus() -> f64 {
    let food = &rules().zywnosc;
    improvement_catalog()
        .row(&food.ulepszenie_farmy)
        .and_then(|row| row.bonus)
        .and_then(|bonus| bonus.zywnosc)
        .unwrap_or(food.farma_bonus_domyslny)
}

/// Web `FOREST_FOOD_POTENTIAL_PENALTY` (`terrain-improvements.ts:448`).
pub fn forest_food_potential_penalty() -> f64 {
    rules().zywnosc.kara_las
}

/// Web `foodPotentialForHex` (`terrain-improvements.ts:459`).
pub fn food_potential_for_hex(
    teren_bazowy: TerrainType,
    nakladka: Overlay,
    improvement_keys: &[String],
) -> f64 {
    let food_keys = &rules().zywnosc.ulepszenia;
    let has_food_layer = improvement_keys
        .iter()
        .filter_map(|key| normalize_improvement_key(Some(key)))
        .any(|key| food_keys.contains(&key));
    if has_food_layer {
        return 0.0;
    }
    if nakladka == Overlay::Las {
        return forest_food_potential_penalty();
    }
    if teren_bazowy.is_flat_land() {
        return farma_potential_food_bonus();
    }
    0.0
}

/// Web `RESOURCE_UPKEEP_IMPROVEMENT_KEYS` (`terrain-improvements.ts:482`): wszystkie trwale warstwy
/// (typ inny niz jednorazowa wycinka), w kolejnosci pliku.
pub fn resource_upkeep_improvement_keys() -> Vec<String> {
    let catalog = improvement_catalog();
    catalog
        .keys()
        .into_iter()
        .filter(|key| {
            catalog.row(key).and_then(|row| row.typ.as_deref())
                != Some(rules().typ_wycinka.typ.as_str())
        })
        .collect()
}
