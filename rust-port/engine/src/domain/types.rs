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
