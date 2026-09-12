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
