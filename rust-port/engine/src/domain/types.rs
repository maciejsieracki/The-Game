use serde::{Deserialize, Serialize};
use std::{collections::HashSet, error::Error, fmt};

use super::{CityId, PlayerId, UnitId};

/// Errors raised when a state DTO violates a domain invariant.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ValidationError {
    EmptyName {
        entity: &'static str,
    },
    InvalidMapDimensions {
        width: u16,
        height: u16,
    },
    MapTileCount {
        expected: usize,
        actual: usize,
    },
    MapTileOutOfBounds {
        position: PositionDto,
        width: u16,
        height: u16,
    },
    DuplicateMapTile(PositionDto),
    InvalidPopulation,
    DuplicateCivilization(PlayerId),
    DuplicateCity(CityId),
    DuplicateUnit(UnitId),
    DuplicateCityReference(CityId),
    DuplicateUnitReference(UnitId),
    UnknownCityReference(CityId),
    UnknownUnitReference(UnitId),
    UnknownCityOwner(PlayerId),
    UnknownUnitOwner(PlayerId),
    CityOwnerMismatch {
        city: CityId,
        civilization: PlayerId,
    },
    UnitOwnerMismatch {
        unit: UnitId,
        civilization: PlayerId,
    },
    EntityOutOfBounds {
        entity: &'static str,
        position: PositionDto,
    },
}

impl fmt::Display for ValidationError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::EmptyName { entity } => write!(formatter, "{entity} name cannot be empty"),
            Self::InvalidMapDimensions { width, height } => {
                write!(
                    formatter,
                    "map dimensions must be positive, got {width}x{height}"
                )
            }
            Self::MapTileCount { expected, actual } => {
                write!(formatter, "map needs {expected} tiles, got {actual}")
            }
            Self::MapTileOutOfBounds {
                position,
                width,
                height,
            } => write!(
                formatter,
                "map tile at {} is outside {width}x{height}",
                position
            ),
            Self::DuplicateMapTile(position) => {
                write!(formatter, "duplicate map tile at {position}")
            }
            Self::InvalidPopulation => formatter.write_str("city population must be at least 1"),
            Self::DuplicateCivilization(id) => {
                write!(formatter, "civilization {id} already exists")
            }
            Self::DuplicateCity(id) => write!(formatter, "city {id} already exists"),
            Self::DuplicateUnit(id) => write!(formatter, "unit {id} already exists"),
            Self::DuplicateCityReference(id) => {
                write!(
                    formatter,
                    "civilization references city {id} more than once"
                )
            }
            Self::DuplicateUnitReference(id) => {
                write!(
                    formatter,
                    "civilization references unit {id} more than once"
                )
            }
            Self::UnknownCityReference(id) => {
                write!(formatter, "civilization references unknown city {id}")
            }
            Self::UnknownUnitReference(id) => {
                write!(formatter, "civilization references unknown unit {id}")
            }
            Self::UnknownCityOwner(id) => write!(formatter, "city owner {id} does not exist"),
            Self::UnknownUnitOwner(id) => write!(formatter, "unit owner {id} does not exist"),
            Self::CityOwnerMismatch { city, civilization } => write!(
                formatter,
                "city {city} is not owned by civilization {civilization}"
            ),
            Self::UnitOwnerMismatch { unit, civilization } => write!(
                formatter,
                "unit {unit} is not owned by civilization {civilization}"
            ),
            Self::EntityOutOfBounds { entity, position } => {
                write!(formatter, "{entity} at {position} is outside the map")
            }
        }
    }
}

impl Error for ValidationError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct PositionDto {
    x: u16,
    y: u16,
}

impl PositionDto {
    pub const fn new(x: u16, y: u16) -> Self {
        Self { x, y }
    }

    pub const fn x(self) -> u16 {
        self.x
    }

    pub const fn y(self) -> u16 {
        self.y
    }
}

impl fmt::Display for PositionDto {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(formatter, "({}, {})", self.x, self.y)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TerrainDto {
    Plains,
    Hills,
    Forest,
    Water,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct TileDto {
    position: PositionDto,
    terrain: TerrainDto,
}

impl TileDto {
    pub const fn new(position: PositionDto, terrain: TerrainDto) -> Self {
        Self { position, terrain }
    }

    pub const fn position(self) -> PositionDto {
        self.position
    }

    pub const fn terrain(self) -> TerrainDto {
        self.terrain
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "RawMapDto")]
pub struct MapDto {
    width: u16,
    height: u16,
    tiles: Vec<TileDto>,
}

#[derive(Debug, Deserialize)]
struct RawMapDto {
    width: u16,
    height: u16,
    tiles: Vec<TileDto>,
}

impl MapDto {
    pub fn new(width: u16, height: u16, tiles: Vec<TileDto>) -> Result<Self, ValidationError> {
        let map = Self {
            width,
            height,
            tiles,
        };
        map.validate()?;
        Ok(map)
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.width == 0 || self.height == 0 {
            return Err(ValidationError::InvalidMapDimensions {
                width: self.width,
                height: self.height,
            });
        }

        let expected = usize::from(self.width) * usize::from(self.height);
        if self.tiles.len() != expected {
            return Err(ValidationError::MapTileCount {
                expected,
                actual: self.tiles.len(),
            });
        }

        let mut positions = HashSet::with_capacity(self.tiles.len());
        for tile in &self.tiles {
            let position = tile.position();
            if position.x() >= self.width || position.y() >= self.height {
                return Err(ValidationError::MapTileOutOfBounds {
                    position,
                    width: self.width,
                    height: self.height,
                });
            }
            if !positions.insert(position) {
                return Err(ValidationError::DuplicateMapTile(position));
            }
        }

        Ok(())
    }

    pub const fn width(&self) -> u16 {
        self.width
    }

    pub const fn height(&self) -> u16 {
        self.height
    }

    pub fn tiles(&self) -> &[TileDto] {
        &self.tiles
    }

    pub fn contains(&self, position: PositionDto) -> bool {
        position.x() < self.width && position.y() < self.height
    }
}

impl TryFrom<RawMapDto> for MapDto {
    type Error = ValidationError;

    fn try_from(raw: RawMapDto) -> Result<Self, Self::Error> {
        Self::new(raw.width, raw.height, raw.tiles)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "RawCivilizationDto")]
pub struct CivilizationDto {
    id: PlayerId,
    name: String,
    city_ids: Vec<CityId>,
    unit_ids: Vec<UnitId>,
}

#[derive(Debug, Deserialize)]
struct RawCivilizationDto {
    id: PlayerId,
    name: String,
    city_ids: Vec<CityId>,
    unit_ids: Vec<UnitId>,
}

impl CivilizationDto {
    pub fn new(
        id: PlayerId,
        name: impl Into<String>,
        city_ids: Vec<CityId>,
        unit_ids: Vec<UnitId>,
    ) -> Result<Self, ValidationError> {
        let civilization = Self {
            id,
            name: name.into(),
            city_ids,
            unit_ids,
        };
        civilization.validate()?;
        Ok(civilization)
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.name.trim().is_empty() {
            return Err(ValidationError::EmptyName {
                entity: "civilization",
            });
        }
        ensure_unique(&self.city_ids, ValidationError::DuplicateCityReference)?;
        ensure_unique(&self.unit_ids, ValidationError::DuplicateUnitReference)?;
        Ok(())
    }

    pub const fn id(&self) -> PlayerId {
        self.id
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub fn city_ids(&self) -> &[CityId] {
        &self.city_ids
    }

    pub fn unit_ids(&self) -> &[UnitId] {
        &self.unit_ids
    }
}

impl TryFrom<RawCivilizationDto> for CivilizationDto {
    type Error = ValidationError;

    fn try_from(raw: RawCivilizationDto) -> Result<Self, Self::Error> {
        Self::new(raw.id, raw.name, raw.city_ids, raw.unit_ids)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "RawCityDto")]
pub struct CityDto {
    id: CityId,
    owner_id: PlayerId,
    name: String,
    position: PositionDto,
    population: u32,
}

#[derive(Debug, Deserialize)]
struct RawCityDto {
    id: CityId,
    owner_id: PlayerId,
    name: String,
    position: PositionDto,
    population: u32,
}

impl CityDto {
    pub fn new(
        id: CityId,
        owner_id: PlayerId,
        name: impl Into<String>,
        position: PositionDto,
        population: u32,
    ) -> Result<Self, ValidationError> {
        let city = Self {
            id,
            owner_id,
            name: name.into(),
            position,
            population,
        };
        city.validate()?;
        Ok(city)
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        if self.name.trim().is_empty() {
            return Err(ValidationError::EmptyName { entity: "city" });
        }
        if self.population == 0 {
            return Err(ValidationError::InvalidPopulation);
        }
        Ok(())
    }

    pub const fn id(&self) -> CityId {
        self.id
    }

    pub const fn owner_id(&self) -> PlayerId {
        self.owner_id
    }

    pub fn name(&self) -> &str {
        &self.name
    }

    pub const fn position(&self) -> PositionDto {
        self.position
    }

    pub const fn population(&self) -> u32 {
        self.population
    }
}

impl TryFrom<RawCityDto> for CityDto {
    type Error = ValidationError;

    fn try_from(raw: RawCityDto) -> Result<Self, Self::Error> {
        Self::new(raw.id, raw.owner_id, raw.name, raw.position, raw.population)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum UnitKindDto {
    Settler,
    Warrior,
    Scout,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "RawUnitDto")]
pub struct UnitDto {
    id: UnitId,
    owner_id: PlayerId,
    kind: UnitKindDto,
    position: PositionDto,
}

#[derive(Debug, Deserialize)]
struct RawUnitDto {
    id: UnitId,
    owner_id: PlayerId,
    kind: UnitKindDto,
    position: PositionDto,
}

impl UnitDto {
    pub const fn new(
        id: UnitId,
        owner_id: PlayerId,
        kind: UnitKindDto,
        position: PositionDto,
    ) -> Result<Self, ValidationError> {
        let unit = Self {
            id,
            owner_id,
            kind,
            position,
        };
        match unit.validate() {
            Ok(()) => Ok(unit),
            Err(error) => Err(error),
        }
    }

    pub const fn validate(&self) -> Result<(), ValidationError> {
        Ok(())
    }

    pub const fn id(&self) -> UnitId {
        self.id
    }

    pub const fn owner_id(&self) -> PlayerId {
        self.owner_id
    }

    pub const fn kind(&self) -> UnitKindDto {
        self.kind
    }

    pub const fn position(&self) -> PositionDto {
        self.position
    }
}

impl TryFrom<RawUnitDto> for UnitDto {
    type Error = ValidationError;

    fn try_from(raw: RawUnitDto) -> Result<Self, Self::Error> {
        Self::new(raw.id, raw.owner_id, raw.kind, raw.position)
    }
}

pub type TurnDto = super::Turn;

fn ensure_unique<T, F>(values: &[T], duplicate: F) -> Result<(), ValidationError>
where
    T: Eq + std::hash::Hash + Copy,
    F: Fn(T) -> ValidationError,
{
    let mut seen = HashSet::with_capacity(values.len());
    for value in values {
        if !seen.insert(*value) {
            return Err(duplicate(*value));
        }
    }
    Ok(())
}

/// Poziom trudności gry: JEDYNY typ w `domain/` (P3-22 etap 2, runda 3, decyzja techniczna).
/// Re-eksportowany z `domain::diplomacy`, `domain::barbarians` i `domain::trade`, więc dotychczasowe
/// ścieżki importu działają bez zmian. Serializacja `easy` / `normal` / `hard` jak w web.
/// Klucze tabel `data/derived/*.json` dla klasy (b) używają tych samych nazw (`difficulty_key`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum Difficulty {
    #[serde(rename = "easy")]
    Easy,
    #[default]
    #[serde(rename = "normal")]
    Normal,
    #[serde(rename = "hard")]
    Hard,
}

impl Difficulty {
    /// Klucz tabel danych (`easy` / `normal` / `hard`), zgodny z webem.
    pub const fn key(self) -> &'static str {
        match self {
            Self::Easy => "easy",
            Self::Normal => "normal",
            Self::Hard => "hard",
        }
    }
}

/// P6.2 (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1): port `gra/src/game/order.ts` (Porzadek miasta =
/// funkcja Szczescia i Prawa, progi T1/T2, efekty unrest/neutral/order, migracja buntu, rozklad
/// nastrojow). UWAGA NAZEWNICZA: web `order.ts` to "Porzadek" (stabilnosc miasta), a NIE kolejka
/// rozkazow; dispatch/GAP-ANALYSIS nazywaja go "komendy/rozkazy" (ZALOZENIE 1 dokumentu P6-23).
/// Wszystkie liczby balansowe leza w `data/derived/porzadek-params.json` i
/// `data/society-params.json` (blok `porzadek`, `szczescie`); kod nie zawiera ich literalow.
pub mod porzadek {
    use std::collections::BTreeMap;

    use serde_json::Value;

    use super::Difficulty;
    use crate::data::derived::porzadek_param;
    use crate::domain::improvements::js_round;

    /// Web `OrderTier` (`order.ts:90`).
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum OrderTier {
        Unrest,
        Neutral,
        Order,
    }

    /// Web `OrderInputs` (`order.ts:97`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct OrderInputs {
        pub szczescie: f64,
        pub prawo: f64,
    }

    /// Web `OrderParams` (`order.ts:105`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct OrderParams {
        pub waga_szczescie: f64,
        pub waga_prawo: f64,
        pub prog_t1: f64,
        pub prog_t2: f64,
        pub kara_produkcja_t1: f64,
        pub kara_pieniadz_t1: f64,
        pub kara_nauka_t1: f64,
        pub kara_kultura_t1: f64,
        pub kara_wzrost_t1: f64,
        pub ryzyko_buntu_t1: f64,
        pub bonus_produkcja_t2: f64,
        pub bonus_handel_t2: f64,
        pub por_pct_cap: Option<f64>,
    }

    /// Web `OrderEffects` (`order.ts:144`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct OrderEffects {
        pub production_mult: f64,
        pub pieniadz_mult: f64,
        pub nauka_mult: f64,
        pub kultura_mult: f64,
        pub growth_mult: f64,
        pub trade_mult: f64,
        pub revolt_risk: f64,
    }

    /// Web `OrderYieldMults` (`order.ts:162`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct OrderYieldMults {
        pub production_mult: f64,
        pub pieniadz_mult: f64,
        pub nauka_mult: f64,
        pub kultura_mult: f64,
    }

    /// Web `OrderResult` (`order.ts:416`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct OrderResult {
        pub order: f64,
        pub tier: OrderTier,
        pub effects: OrderEffects,
    }

    /// Web `RevoltMigrationCity` (`order.ts:464`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct RevoltMigrationCity {
        pub id: String,
        pub owner_id: i64,
        pub population: f64,
    }

    /// Web `HappinessBreakdown` (`order.ts:515`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct HappinessBreakdown {
        pub zadowoleni: f64,
        pub kontentni: f64,
        pub niezadowoleni: f64,
    }

    /// Web `FALLBACK_ORDER_PARAMS` (`order.ts:174`), czytane z `porzadek-params.json`.
    pub fn fallback_order_params() -> OrderParams {
        OrderParams {
            waga_szczescie: porzadek_param("waga_szczescie"),
            waga_prawo: porzadek_param("waga_prawo"),
            prog_t1: porzadek_param("prog_t1"),
            prog_t2: porzadek_param("prog_t2"),
            kara_produkcja_t1: porzadek_param("kara_produkcja_t1"),
            kara_pieniadz_t1: porzadek_param("kara_pieniadz_t1"),
            kara_nauka_t1: porzadek_param("kara_nauka_t1"),
            kara_kultura_t1: porzadek_param("kara_kultura_t1"),
            kara_wzrost_t1: porzadek_param("kara_wzrost_t1"),
            ryzyko_buntu_t1: porzadek_param("ryzyko_buntu_t1"),
            bonus_produkcja_t2: porzadek_param("bonus_produkcja_t2"),
            bonus_handel_t2: porzadek_param("bonus_handel_t2"),
            por_pct_cap: Some(porzadek_param("por_pct_cap")),
        }
    }

    /// `society-params.json` z silnika (zrodlo bloku `porzadek` / `szczescie`).
    pub fn society_params() -> &'static Value {
        static SOCIETY: std::sync::OnceLock<Value> = std::sync::OnceLock::new();
        SOCIETY.get_or_init(|| {
            serde_json::from_str(crate::data::derived::SOCIETY_PARAMS_JSON)
                .expect("society-params.json must parse")
        })
    }

    /// Web `pick` (`order.ts:236`): wartosc dla poziomu trudnosci albo `fallback`, gdy wiersza
    /// brak lub wartosc nie jest skonczona liczba.
    fn pick(row: Option<&Value>, difficulty: Difficulty, fallback: f64) -> f64 {
        row.and_then(|row| row.get(difficulty.key()))
            .and_then(Value::as_f64)
            .filter(|value| value.is_finite())
            .unwrap_or(fallback)
    }

    /// Web `loadOrderParams` (`order.ts:259`): `society` = `None` -> same wartosci domyslne.
    pub fn load_order_params(society: Option<&Value>, difficulty: Difficulty) -> OrderParams {
        let block = society.and_then(|society| society.get("porzadek"));
        let row = |key: &str| block.and_then(|block| block.get(key));
        let f = fallback_order_params();
        OrderParams {
            waga_szczescie: pick(row("porzadek_waga_szczescie"), difficulty, f.waga_szczescie),
            waga_prawo: pick(row("porzadek_waga_prawo"), difficulty, f.waga_prawo),
            prog_t1: pick(row("porzadek_prog_t1"), difficulty, f.prog_t1),
            prog_t2: pick(row("porzadek_prog_t2"), difficulty, f.prog_t2),
            kara_produkcja_t1: pick(
                row("porzadek_kara_produkcja_t1"),
                difficulty,
                f.kara_produkcja_t1,
            ),
            kara_pieniadz_t1: pick(
                row("porzadek_kara_pieniadz_t1"),
                difficulty,
                f.kara_pieniadz_t1,
            ),
            kara_nauka_t1: pick(row("porzadek_kara_nauka_t1"), difficulty, f.kara_nauka_t1),
            kara_kultura_t1: pick(
                row("porzadek_kara_kultura_t1"),
                difficulty,
                f.kara_kultura_t1,
            ),
            kara_wzrost_t1: pick(row("porzadek_kara_wzrost_t1"), difficulty, f.kara_wzrost_t1),
            ryzyko_buntu_t1: pick(
                row("porzadek_ryzyko_buntu_t1"),
                difficulty,
                f.ryzyko_buntu_t1,
            ),
            bonus_produkcja_t2: pick(
                row("porzadek_bonus_produkcja_t2"),
                difficulty,
                f.bonus_produkcja_t2,
            ),
            bonus_handel_t2: pick(
                row("porzadek_bonus_handel_t2"),
                difficulty,
                f.bonus_handel_t2,
            ),
            // Cap PorPct mieszka w bloku `szczescie` (jak w webie), nie w `porzadek`.
            por_pct_cap: Some(pick(
                society
                    .and_then(|society| society.get("szczescie"))
                    .and_then(|block| block.get("szczescie_pct_cap")),
                difficulty,
                f.por_pct_cap
                    .unwrap_or_else(|| porzadek_param("por_pct_cap")),
            )),
        }
    }

    /// Web `computeOrder` (`order.ts:317`): `round(wagaSzczescie * szczescie + wagaPrawo * prawo)`;
    /// wejscia nieskonczone / NaN liczone jako 0.
    pub fn compute_order(inputs: OrderInputs, params: &OrderParams) -> f64 {
        let szczescie = if inputs.szczescie.is_finite() {
            inputs.szczescie
        } else {
            0.0
        };
        let prawo = if inputs.prawo.is_finite() {
            inputs.prawo
        } else {
            0.0
        };
        js_round(params.waga_szczescie * szczescie + params.waga_prawo * prawo)
    }

    /// Web `orderTier` (`order.ts:344`).
    pub fn order_tier(order: f64, params: &OrderParams) -> OrderTier {
        if order < params.prog_t1 {
            return OrderTier::Unrest;
        }
        if order >= params.prog_t2 {
            return OrderTier::Order;
        }
        OrderTier::Neutral
    }

    /// Web `clamp01` (`order.ts:499`).
    fn clamp01(x: f64) -> f64 {
        if !x.is_finite() || x < 0.0 {
            return 0.0;
        }
        if x > 1.0 {
            return 1.0;
        }
        x
    }

    /// Efekt neutralny (wszystkie mnozniki 1, brak ryzyka). Jedynka to element neutralny mnozenia,
    /// a nie parametr balansowy.
    const fn neutral_effects() -> OrderEffects {
        OrderEffects {
            production_mult: 1.0,
            pieniadz_mult: 1.0,
            nauka_mult: 1.0,
            kultura_mult: 1.0,
            growth_mult: 1.0,
            trade_mult: 1.0,
            revolt_risk: 0.0,
        }
    }

    /// Web `orderEffects` (`order.ts:372`).
    pub fn order_effects(tier: OrderTier, params: &OrderParams) -> OrderEffects {
        let neutral = neutral_effects();
        match tier {
            OrderTier::Unrest => OrderEffects {
                production_mult: (neutral.production_mult + params.kara_produkcja_t1).max(0.0),
                pieniadz_mult: (neutral.pieniadz_mult + params.kara_pieniadz_t1).max(0.0),
                nauka_mult: (neutral.nauka_mult + params.kara_nauka_t1).max(0.0),
                kultura_mult: (neutral.kultura_mult + params.kara_kultura_t1).max(0.0),
                growth_mult: (neutral.growth_mult + params.kara_wzrost_t1).max(0.0),
                trade_mult: neutral.trade_mult,
                revolt_risk: clamp01(params.ryzyko_buntu_t1),
            },
            OrderTier::Order => OrderEffects {
                production_mult: neutral.production_mult + params.bonus_produkcja_t2,
                trade_mult: neutral.trade_mult + params.bonus_handel_t2,
                ..neutral
            },
            OrderTier::Neutral => neutral,
        }
    }

    /// Web `evaluateOrder` (`order.ts:429`).
    pub fn evaluate_order(inputs: OrderInputs, params: &OrderParams) -> OrderResult {
        let order = compute_order(inputs, params);
        let tier = order_tier(order, params);
        let effects = order_effects(tier, params);
        OrderResult {
            order,
            tier,
            effects,
        }
    }

    /// Web `orderEffectsToYieldMults` (`order.ts:443`): w stanie `order` bonus handlu idzie na
    /// mnoznik Pieniadza.
    pub fn order_effects_to_yield_mults(
        tier: OrderTier,
        effects: &OrderEffects,
    ) -> OrderYieldMults {
        if tier == OrderTier::Order {
            return OrderYieldMults {
                production_mult: effects.production_mult,
                pieniadz_mult: effects.trade_mult,
                nauka_mult: neutral_effects().nauka_mult,
                kultura_mult: neutral_effects().kultura_mult,
            };
        }
        OrderYieldMults {
            production_mult: effects.production_mult,
            pieniadz_mult: effects.pieniadz_mult,
            nauka_mult: effects.nauka_mult,
            kultura_mult: effects.kultura_mult,
        }
    }

    /// Web `pickRevoltMigrationTarget` (`order.ts:474`): inne miasto tego samego wlasciciela z
    /// najwyzszym Porzadkiem (remis: pierwsze na liscie); brak wpisu / wartosc nieskonczona = 0.
    pub fn pick_revolt_migration_target(
        source_id: &str,
        owner_id: i64,
        cities: &[RevoltMigrationCity],
        order_by_city_id: &BTreeMap<String, f64>,
    ) -> Option<String> {
        let mut best_id: Option<&str> = None;
        let mut best_order = f64::NEG_INFINITY;
        for city in cities {
            if city.id == source_id || city.owner_id != owner_id || city.population < 1.0 {
                continue;
            }
            let order_val = order_by_city_id
                .get(&city.id)
                .copied()
                .filter(|value| value.is_finite())
                .unwrap_or(0.0);
            if order_val > best_order {
                best_order = order_val;
                best_id = Some(&city.id);
            }
        }
        best_id.map(str::to_owned)
    }

    /// Web `happinessBreakdown` (`order.ts:548`): rozklad populacji na zadowolonych / kontentnych /
    /// niezadowolonych (tylko UI, nie wplywa na mechanike).
    pub fn happiness_breakdown(population: f64, szczescie: f64) -> HappinessBreakdown {
        let pop = if population.is_finite() && population > 0.0 {
            population.floor()
        } else {
            0.0
        };
        if pop <= 0.0 {
            return HappinessBreakdown {
                zadowoleni: 0.0,
                kontentni: 0.0,
                niezadowoleni: 0.0,
            };
        }
        let hap = if szczescie.is_finite() {
            szczescie
        } else {
            0.0
        };
        let scale = porzadek_param("szczescie_skala_max");
        let happy_frac = (hap / scale).clamp(0.0, 1.0);
        let unhappy_frac = (-hap / scale).clamp(0.0, 1.0);
        let zadowoleni = (pop * happy_frac).floor();
        let niezadowoleni = (pop * unhappy_frac).floor();
        HappinessBreakdown {
            zadowoleni,
            kontentni: pop - zadowoleni - niezadowoleni,
            niezadowoleni,
        }
    }
}
