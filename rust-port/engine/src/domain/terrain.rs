use serde::{Deserialize, Serialize};

/// Base terrain types used by the world map.
///
/// Forests, deposits and rivers are overlays in the game model rather than
/// base terrain values. `ShallowWater` is the coastal water band; it remains
/// workable by a city but is not traversable by land units.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TerrainType {
    Grassland,
    Plains,
    Hills,
    Mountains,
    ShallowWater,
    Ocean,
    Desert,
    Tundra,
}

/// Short alias for callers that prefer `Terrain` as the domain name.
pub type Terrain = TerrainType;

/// Alias matching the terminology used by the map layer.
pub type BaseTerrain = TerrainType;
pub type TerenBazowy = TerrainType;

#[allow(non_upper_case_globals)]
impl TerrainType {
    // Source-data aliases. They keep the Rust API readable in English while
    // allowing direct use of the established map vocabulary.
    pub const Laka: Self = Self::Grassland;
    pub const Rownina: Self = Self::Plains;
    pub const Wzgorza: Self = Self::Hills;
    pub const Gory: Self = Self::Mountains;
    pub const PlytkieMorze: Self = Self::ShallowWater;
    pub const Morze: Self = Self::Ocean;
    pub const Pustynia: Self = Self::Desert;
    pub const Polarny: Self = Self::Tundra;

    // Common singular/legacy names.
    pub const Mountain: Self = Self::Mountains;
    pub const Coast: Self = Self::ShallowWater;
    pub const CoastalWater: Self = Self::ShallowWater;

    /// True for both shallow and deep water.
    pub const fn is_water(self) -> bool {
        matches!(self, Self::ShallowWater | Self::Ocean)
    }

    pub const fn is_land(self) -> bool {
        !self.is_water()
    }

    /// Whether the cell can be worked for city yields.
    ///
    /// This intentionally follows the game rule rather than movement rules:
    /// only deep ocean and mountains are excluded. Coastal shallow water can
    /// therefore be a productive city field even though land units cannot
    /// enter it.
    pub const fn is_workable(self) -> bool {
        !matches!(self, Self::Ocean | Self::Mountains)
    }

    /// Whether an ordinary land unit can enter this terrain.
    pub const fn is_passable(self) -> bool {
        matches!(
            self,
            Self::Grassland | Self::Plains | Self::Hills | Self::Desert | Self::Tundra
        )
    }

    /// Whether the terrain is a legal city site before map/distance checks.
    pub const fn can_found_city(self) -> bool {
        self.is_land() && !matches!(self, Self::Mountains)
    }

    pub const fn is_city_site(self) -> bool {
        self.can_found_city()
    }

    /// Base movement cost for a land unit, or `None` when impassable.
    pub const fn movement_cost(self) -> Option<u8> {
        match self {
            Self::Hills => Some(2),
            Self::Grassland | Self::Plains | Self::Desert | Self::Tundra => Some(1),
            Self::Mountains | Self::ShallowWater | Self::Ocean => None,
        }
    }

    pub const fn is_coastal_water(self) -> bool {
        matches!(self, Self::ShallowWater)
    }
}

/// Pure qualification of a map field independent of ownership and distance.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TileQualification {
    pub workable: bool,
    pub passable: bool,
    pub city_site: bool,
}

impl TileQualification {
    pub const fn for_terrain(terrain: TerrainType) -> Self {
        Self {
            workable: terrain.is_workable(),
            passable: terrain.is_passable(),
            city_site: terrain.can_found_city(),
        }
    }
}

pub const fn is_workable_terrain(terrain: TerrainType) -> bool {
    terrain.is_workable()
}

pub const fn is_passable_terrain(terrain: TerrainType) -> bool {
    terrain.is_passable()
}

pub const fn can_found_city_on(terrain: TerrainType) -> bool {
    terrain.can_found_city()
}
