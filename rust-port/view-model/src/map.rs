//! Map layers: static `MapViewDto` (contract §3.2), per-hex dynamic
//! `HexDynDto` (§3.2) and fog `FogViewDto` (§3.3).
//!
//! Web literals cite the pin `07d2fbd72` (`gra/src/…`).

use crate::ids::HexCoord;
use serde::{Deserialize, Deserializer, Serialize, Serializer};

/// Base terrain, `TerenBazowy` (`types/hex.ts:12-24`): the web string values.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Terrain {
    /// `'laka'`.
    Laka,
    /// `'rownina'`.
    Rownina,
    /// `'wzgorza'`.
    Wzgorza,
    /// `'gory'`.
    Gory,
    /// `'plytkie_morze'`.
    PlytkieMorze,
    /// `'morze'`.
    Morze,
    /// `'pustynia'`.
    Pustynia,
    /// `'polarny'`.
    Polarny,
}

/// Overlay on the base terrain, `Nakladka` (`types/hex.ts:30-39`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Nakladka {
    /// `'brak'`.
    Brak,
    /// `'las'`.
    Las,
    /// `'zloze_gliny'`.
    ZlozeGliny,
    /// `'zloze_rudy'`.
    ZlozeRudy,
    /// `'zloze_konia'`.
    ZlozeKonia,
    /// `'zloze_owiec'`.
    ZlozeOwiec,
    /// `'zloze_bydla'`.
    ZlozeBydla,
    /// `'zloze_lamy'`.
    ZlozeLamy,
}

/// Worker improvement, `Ulepszenie` (`types/hex.ts:45-54`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Ulepszenie {
    /// `'brak'`.
    Brak,
    /// `'farma'`.
    Farma,
    /// `'irygacja'`.
    Irygacja,
    /// `'kopalnia'`.
    Kopalnia,
    /// `'droga'`.
    Droga,
    /// `'droga_brukowana'`.
    DrogaBrukowana,
    /// `'pastwisko'`.
    Pastwisko,
    /// `'tartak'`.
    Tartak,
}

/// River class, `riverPathKinds[i]` (`types/map.ts:49`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RiverKind {
    /// `'main'` (main stream to the sea, thicker).
    Main,
    /// `'medium'`.
    Medium,
    /// `'short'`.
    Short,
    /// `'tributary'`.
    Tributary,
}

/// Static part of a hex (contract §3.2 `HexStaticDto`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HexStaticDto {
    /// `Hex.coords`.
    pub coord: HexCoord,
    /// `Hex.terenBazowy`.
    pub teren_bazowy: Terrain,
    /// `Hex.rzeka.krawedzie` (`types/hex.ts:93-100`): edge indices `0..=5`.
    pub rzeka_krawedzie: Vec<u8>,
}

/// One river path (contract §3.2): `riverPaths[i]` + `riverPathKinds[i]`
/// (`types/map.ts:43-49`); renderer `RiverPath` (`terrain/mod.rs:184-190`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RiverPathDto {
    /// Hexes from the source to the mouth.
    pub hexes: Vec<HexCoord>,
    /// `riverPathKinds[i]` (`None` when the array is missing or shorter).
    pub kind: Option<RiverKind>,
}

/// Static map (contract §3.2 `MapViewDto`). Sent once per start/load
/// (decision D-DTO-3 = B).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct MapViewDto {
    /// `szerokoscQ` (`types/map.ts:18`).
    pub width: u32,
    /// `wysokoscR` (`types/map.ts:23`).
    pub height: u32,
    /// `seed` (`types/map.ts:35`), a JS number; the renderer applies `ToInt32`.
    pub seed: f64,
    /// `Object.values(map.hexes)`: order `r`-major, `q`-minor (contract §1.4):
    /// exactly `width * height` hexes, `hexes[i].coord == (i % width,
    /// i / width)` ([`crate::validate_map`]).
    pub hexes: Vec<HexStaticDto>,
    /// River paths.
    pub rivers: Vec<RiverPathDto>,
    /// Render paths of rivers (`land/medium/trim…RenderPath`, contract §3.2,
    /// D-DTO-4).
    pub river_render_paths: Vec<Vec<HexCoord>>,
}

/// Dynamic part of a hex (contract §3.2 `HexDynDto`); `hexState[i]` belongs
/// to `map.hexes[i]`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct HexDynDto {
    /// `Hex.nakladka`.
    pub nakladka: Nakladka,
    /// `Hex.ulepszenie`.
    pub ulepszenie: Ulepszenie,
    /// `HexExt.ulepszenia`.
    pub ulepszenia: Option<Vec<String>>,
    /// `HexExt.improvementKey`.
    pub improvement_key: Option<String>,
    /// `HexExt.zloze`.
    pub zloze: Option<String>,
    /// `wioska.istnieje && no city on the hex` (contract §3.2).
    pub village_present: bool,
    /// `improvementKeysForHex(hex)` contains `tarasy`.
    pub terraces: bool,
    /// `hexHasCoveringTerrainImprovement`.
    pub covering_improvement: bool,
    /// `computeRoadMask` — 6 bits (`0..=0x3F`).
    pub road_mask: u8,
}

/// Fog state of one hex for the viewer. Encoding fixed by the contract
/// (D-DTO-10 = A, §3.3): `0` unexplored, `1` explored, `2` visible — the web
/// text enum `Widocznosc` (`types/hex.ts:60-64`) has no numbers.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum FogState {
    /// `'nieodkryty'` → `0`.
    Unexplored = 0,
    /// `'odkryty'` → `1`.
    Explored = 1,
    /// `'widoczny'` → `2`.
    Visible = 2,
}

impl FogState {
    /// The JSON code.
    #[must_use]
    pub const fn code(self) -> u8 {
        self as u8
    }

    /// Decodes `0`, `1` or `2`.
    #[must_use]
    pub const fn from_code(code: u8) -> Option<Self> {
        match code {
            0 => Some(Self::Unexplored),
            1 => Some(Self::Explored),
            2 => Some(Self::Visible),
            _ => None,
        }
    }
}

impl Serialize for FogState {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_u8(self.code())
    }
}

impl<'de> Deserialize<'de> for FogState {
    fn deserialize<D: Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let code = u8::deserialize(deserializer)?;
        Self::from_code(code).ok_or_else(|| {
            <D::Error as serde::de::Error>::custom(format!("invalid fog code {code}"))
        })
    }
}

/// Fog for the viewer (contract §3.3 `FogViewDto`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct FogViewDto {
    /// Parallel to `map.hexes`.
    pub state: Vec<FogState>,
}
