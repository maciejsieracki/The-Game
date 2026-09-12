//! Deterministic hex-map generation core.
//!
//! The implementation mirrors the TypeScript map-generation primitives:
//! Mulberry32, Fisher-Yates permutation, cosine-interpolated value noise,
//! fBm, axial neighbours, and terrain classification.  The module is kept
//! independent from the wider engine while the hex/terrain domains are being
//! integrated; its public data contracts are deliberately serializable.

use serde::{Deserialize, Serialize};
use std::fmt;
use std::sync::OnceLock;

const DEFAULT_SEED: u32 = 42;
const UNIT_SCALE: f64 = 4_294_967_296.0;
const MULBERRY_INCREMENT: u32 = 0x6d2b_79f5;
const TERRAIN_GLOBAL_MIX_AMP: f64 = 0.12;
const TERRAIN_CELL_JITTER_AMP: f64 = 0.65;

/// Supported world layouts for the deterministic core.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum WorldType {
    #[default]
    #[serde(rename = "kontynenty")]
    Continents,
    #[serde(rename = "pangea")]
    Pangea,
    #[serde(rename = "wyspy")]
    Islands,
    #[serde(rename = "ziemia")]
    Earth,
}

impl fmt::Display for WorldType {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str(match self {
            Self::Continents => "kontynenty",
            Self::Pangea => "pangea",
            Self::Islands => "wyspy",
            Self::Earth => "ziemia",
        })
    }
}

/// Latitudinal climate bands used by the TypeScript generator.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ClimateBand {
    #[serde(rename = "polar_north")]
    PolarNorth,
    #[serde(rename = "temperate_north")]
    TemperateNorth,
    #[serde(rename = "plains_north")]
    PlainsNorth,
    #[serde(rename = "desert")]
    Desert,
    #[serde(rename = "plains_south")]
    PlainsSouth,
    #[serde(rename = "temperate_south")]
    TemperateSouth,
    #[serde(rename = "polar_south")]
    PolarSouth,
}

impl ClimateBand {
    pub const fn is_polar(self) -> bool {
        matches!(self, Self::PolarNorth | Self::PolarSouth)
    }
}

/// Stable terrain labels matching the TypeScript `TerenBazowy` values.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Terrain {
    #[serde(rename = "Morze")]
    Sea,
    #[serde(rename = "PlytkieMorze")]
    ShallowSea,
    #[serde(rename = "Laka")]
    Grassland,
    #[serde(rename = "Rownina")]
    Plains,
    #[serde(rename = "Pustynia")]
    Desert,
    #[serde(rename = "Wzgorza")]
    Hills,
    #[serde(rename = "Gory")]
    Mountains,
    #[serde(rename = "Polarny")]
    Polar,
}

impl Terrain {
    pub const fn is_water(self) -> bool {
        matches!(self, Self::Sea | Self::ShallowSea)
    }

    pub const fn is_land(self) -> bool {
        !self.is_water()
    }
}

/// Axial pointy-top coordinates, equivalent to the TypeScript `{q, r}` pair.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Ord, PartialOrd, Serialize, Deserialize)]
pub struct HexCoord {
    pub q: i32,
    pub r: i32,
}

impl HexCoord {
    pub const DIRECTIONS: [Self; 6] = [
        Self { q: 1, r: 0 },
        Self { q: 1, r: -1 },
        Self { q: 0, r: -1 },
        Self { q: -1, r: 0 },
        Self { q: -1, r: 1 },
        Self { q: 0, r: 1 },
    ];

    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }

    pub fn neighbours(self) -> impl Iterator<Item = Self> {
        Self::DIRECTIONS
            .into_iter()
            .map(move |direction| Self::new(self.q + direction.q, self.r + direction.r))
    }

    pub const fn distance(self, other: Self) -> u32 {
        let dq = (self.q - other.q).unsigned_abs();
        let dr = (self.r - other.r).unsigned_abs();
        let ds = ((-self.q - self.r) - (-other.q - other.r)).unsigned_abs();
        let max_dq_dr = if dq > dr { dq } else { dr };
        if max_dq_dr > ds {
            max_dq_dr
        } else {
            ds
        }
    }
}

/// One generated map cell. `river` is a source/flow marker for the core;
/// complete river path topology belongs to the later map-network phase.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HexTile {
    pub coord: HexCoord,
    pub terrain: Terrain,
    pub forest: bool,
    pub river: bool,
}

/// Row-major generated map (`r`, then `q`), matching the TS generator loops.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct GeneratedMap {
    pub width: u32,
    pub height: u32,
    pub seed: u32,
    pub world_type: WorldType,
    pub tiles: Vec<HexTile>,
}

impl GeneratedMap {
    pub fn tile(&self, q: u32, r: u32) -> Option<&HexTile> {
        if q >= self.width || r >= self.height {
            return None;
        }
        self.tiles.get((r * self.width + q) as usize)
    }

    pub fn land_tiles(&self) -> impl Iterator<Item = &HexTile> {
        self.tiles.iter().filter(|tile| tile.terrain.is_land())
    }

    pub fn water_tiles(&self) -> impl Iterator<Item = &HexTile> {
        self.tiles.iter().filter(|tile| tile.terrain.is_water())
    }

    pub fn terrain_counts(&self) -> [usize; 8] {
        let mut counts = [0; 8];
        for tile in &self.tiles {
            counts[terrain_index(tile.terrain)] += 1;
        }
        counts
    }
}

/// Errors for invalid map dimensions.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MapGeneratorError {
    ZeroWidth,
    ZeroHeight,
    TooManyTiles,
}

impl fmt::Display for MapGeneratorError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::ZeroWidth => formatter.write_str("map width must be greater than zero"),
            Self::ZeroHeight => formatter.write_str("map height must be greater than zero"),
            Self::TooManyTiles => formatter.write_str("map dimensions overflow tile count"),
        }
    }
}

impl std::error::Error for MapGeneratorError {}

/// Mulberry32 stream compatible with the TypeScript implementation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct Mulberry32 {
    state: u32,
}

impl Mulberry32 {
    pub const fn new(seed: u32) -> Self {
        Self { state: seed }
    }

    pub const fn state(self) -> u32 {
        self.state
    }

    pub fn next_u32(&mut self) -> u32 {
        self.state = self.state.wrapping_add(MULBERRY_INCREMENT);
        let mut t = (self.state ^ (self.state >> 15)).wrapping_mul(1 | self.state);
        t ^= t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t));
        t ^ (t >> 14)
    }

    pub fn next_f64(&mut self) -> f64 {
        f64::from(self.next_u32()) / UNIT_SCALE
    }
}

#[derive(Debug, Clone, Copy)]
struct ShapeParams {
    noise_scale: f64,
    mountain_scale: f64,
    forest_scale: f64,
    desert_scale: f64,
    off_mtn_x: f64,
    off_mtn_y: f64,
    off_for_x: f64,
    off_for_y: f64,
    off_des_x: f64,
    off_des_y: f64,
}

impl ShapeParams {
    fn from_rng(rng: &mut Mulberry32, size_norm: f64) -> Self {
        let mut next_offset = || rng.next_f64() * 500.0;
        Self {
            noise_scale: 0.13 / size_norm,
            mountain_scale: 0.22 / size_norm.sqrt(),
            forest_scale: 0.19 / size_norm,
            desert_scale: 0.17 / size_norm,
            off_mtn_x: next_offset(),
            off_mtn_y: next_offset(),
            off_for_x: next_offset(),
            off_for_y: next_offset(),
            off_des_x: next_offset(),
            off_des_y: next_offset(),
        }
    }
}

#[derive(Debug, Clone, Copy)]
struct ContinentCenter {
    nq: f64,
    nr: f64,
    radius: f64,
}

struct MaskContext<'a> {
    width: u32,
    height: u32,
    permutation: &'a [u8; 256],
    noise_scale: f64,
    centers: &'a [ContinentCenter],
    land_fraction: f64,
}

/// Stateless map generator configuration.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MapGenerator {
    width: u32,
    height: u32,
    seed: u32,
    world_type: WorldType,
}

impl MapGenerator {
    pub const fn new(width: u32, height: u32, seed: u32, world_type: WorldType) -> Self {
        Self {
            width,
            height,
            seed,
            world_type,
        }
    }

    pub const fn width(self) -> u32 {
        self.width
    }

    pub const fn height(self) -> u32 {
        self.height
    }

    pub const fn seed(self) -> u32 {
        if self.seed == 0 {
            DEFAULT_SEED
        } else {
            self.seed
        }
    }

    pub const fn world_type(self) -> WorldType {
        self.world_type
    }

    pub fn generate(self) -> Result<GeneratedMap, MapGeneratorError> {
        generate_map(self.width, self.height, self.seed, self.world_type)
    }
}

/// Generates the deterministic core map.
///
/// The random-consumption order is intentional: permutation, shape offsets,
/// then the world-type centers. Changing that order changes every golden
/// vector and is therefore a compatibility break.
pub fn generate_map(
    width: u32,
    height: u32,
    seed: u32,
    world_type: WorldType,
) -> Result<GeneratedMap, MapGeneratorError> {
    if width == 0 {
        return Err(MapGeneratorError::ZeroWidth);
    }
    if height == 0 {
        return Err(MapGeneratorError::ZeroHeight);
    }
    let tile_count = width
        .checked_mul(height)
        .ok_or(MapGeneratorError::TooManyTiles)?;

    let effective_seed = if seed == 0 { DEFAULT_SEED } else { seed };
    let mut rng = Mulberry32::new(effective_seed);
    let permutation = build_permutation(&mut rng);
    let size_norm = f64::from(width.max(height)) / 36.0;
    let shape = ShapeParams::from_rng(&mut rng, size_norm.max(1.0));
    let land_fraction = default_land_fraction(world_type);
    let centers = build_world_centers(&mut rng, width, height, world_type, land_fraction);
    let mask_context = MaskContext {
        width,
        height,
        permutation: &permutation,
        noise_scale: shape.noise_scale,
        centers: &centers,
        land_fraction,
    };

    let mut tiles = Vec::with_capacity(tile_count as usize);
    for r in 0..height {
        for q in 0..width {
            let land_mask = land_mask(q, r, world_type, &mask_context);
            let elevation = fbm(
                &permutation,
                f64::from(q) * shape.noise_scale,
                f64::from(r) * shape.noise_scale,
                4,
            ) * land_mask;
            let mountain_noise = fbm(
                &permutation,
                f64::from(q) * shape.mountain_scale + shape.off_mtn_x,
                f64::from(r) * shape.mountain_scale + shape.off_mtn_y,
                3,
            );
            let forest_noise = fbm(
                &permutation,
                f64::from(q) * shape.forest_scale + shape.off_for_x,
                f64::from(r) * shape.forest_scale + shape.off_for_y,
                3,
            );
            let desert_noise = fbm(
                &permutation,
                f64::from(q) * shape.desert_scale + shape.off_des_x,
                f64::from(r) * shape.desert_scale + shape.off_des_y,
                3,
            );
            let cell_bias = terrain_cell_bias(q, r, effective_seed);
            let terrain = classify_terrain(
                elevation,
                land_mask,
                mountain_noise,
                forest_noise,
                desert_noise,
                climate_band_at(r, height, world_type == WorldType::Earth),
                cell_bias,
            );
            let forest = matches!(
                terrain,
                Terrain::Grassland | Terrain::Plains | Terrain::Hills
            ) && forest_noise > 0.62;
            tiles.push(HexTile {
                coord: HexCoord::new(q as i32, r as i32),
                terrain,
                forest,
                river: false,
            });
        }
    }

    apply_climate_bands(
        &mut tiles,
        height,
        effective_seed,
        world_type == WorldType::Earth,
    );

    // Coast classification is a separate terrain pass in the TS pipeline.
    mark_coast_tiles(&mut tiles, width, height);
    add_core_rivers(&mut tiles, width, height);

    Ok(GeneratedMap {
        width,
        height,
        seed: effective_seed,
        world_type,
        tiles,
    })
}

fn build_permutation(rng: &mut Mulberry32) -> [u8; 256] {
    let mut permutation = [0_u8; 256];
    for (index, value) in permutation.iter_mut().enumerate() {
        *value = index as u8;
    }
    for i in (1..256).rev() {
        let j = (rng.next_f64() * f64::from(i as u32 + 1)).floor() as usize;
        permutation.swap(i, j);
    }
    permutation
}

fn cos_lerp(a: f64, b: f64, t: f64) -> f64 {
    let f = (1.0 - (t * std::f64::consts::PI).cos()) * 0.5;
    a * (1.0 - f) + b * f
}

fn value_noise_2d(permutation: &[u8; 256], x: f64, y: f64) -> f64 {
    let x_floor = x.floor();
    let y_floor = y.floor();
    let xi = x_floor as i32 & 255;
    let yi = y_floor as i32 & 255;
    let xf = x - x_floor;
    let yf = y - y_floor;
    let hash = |ix: i32, iy: i32| {
        f64::from(permutation[((permutation[(ix & 255) as usize] as i32 + iy) & 255) as usize])
            / 255.0
    };
    let top = cos_lerp(hash(xi, yi), hash(xi + 1, yi), xf);
    let bottom = cos_lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), xf);
    cos_lerp(top, bottom, yf)
}

fn fbm(permutation: &[u8; 256], x: f64, y: f64, octaves: u32) -> f64 {
    let mut value = 0.0;
    let mut amplitude = 0.5;
    let mut frequency = 1.0;
    let mut max_value = 0.0;
    for _ in 0..octaves {
        value += value_noise_2d(permutation, x * frequency, y * frequency) * amplitude;
        max_value += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    value / max_value
}

fn land_mask(q: u32, r: u32, world_type: WorldType, context: &MaskContext<'_>) -> f64 {
    match world_type {
        WorldType::Continents => continents_mask(q, r, context),
        WorldType::Pangea => pangea_mask(q, r, context),
        WorldType::Islands => islands_mask(q, r, context),
        WorldType::Earth => earth_mask(
            q,
            r,
            context.width,
            context.height,
            context.permutation,
            context.noise_scale,
        ),
    }
}

fn default_land_fraction(world_type: WorldType) -> f64 {
    match world_type {
        WorldType::Continents => 0.30,
        WorldType::Pangea => 0.60,
        WorldType::Islands => 0.50,
        WorldType::Earth => 0.21,
    }
}

fn clamp_norm(value: f64, margin: f64) -> f64 {
    value.clamp(margin, 1.0 - margin)
}

fn build_world_centers(
    rng: &mut Mulberry32,
    width: u32,
    height: u32,
    world_type: WorldType,
    land_fraction: f64,
) -> Vec<ContinentCenter> {
    match world_type {
        WorldType::Continents => build_continent_centers(rng, width, height, land_fraction),
        WorldType::Pangea => build_pangea_centers(rng, width, height, land_fraction),
        WorldType::Islands => build_island_centers(rng, width, height),
        WorldType::Earth => Vec::new(),
    }
}

fn border_margin(width: u32, height: u32, minimum: f64) -> f64 {
    (2.0 / f64::from(width.saturating_sub(1).max(1)))
        .max(2.0 / f64::from(height.saturating_sub(1).max(1)))
        .max(minimum)
}

fn build_continent_centers(
    rng: &mut Mulberry32,
    width: u32,
    height: u32,
    land_fraction: f64,
) -> Vec<ContinentCenter> {
    let margin = border_margin(width, height, 0.14);
    let radius_boost = (land_fraction - 0.5).max(0.0) * 0.28;
    let sparse = land_fraction <= 0.35;
    let radius_min = (if sparse { 0.11 } else { 0.13 }) + radius_boost;
    let radius_max = (if sparse { 0.19 } else { 0.23 }) + radius_boost;
    let inset = margin + 0.06;
    [
        (0.5, 0.5),
        (inset, inset),
        (1.0 - inset, inset),
        (1.0 - inset, 1.0 - inset),
        (inset, 1.0 - inset),
    ]
    .into_iter()
    .map(|(nq, nr)| ContinentCenter {
        nq: clamp_norm(nq + random_jitter(rng, 0.035), margin),
        nr: clamp_norm(nr + random_jitter(rng, 0.035), margin),
        radius: random_range(rng, radius_min, radius_max),
    })
    .collect()
}

fn random_jitter(rng: &mut Mulberry32, amplitude: f64) -> f64 {
    (rng.next_f64() - 0.5) * amplitude
}

fn random_range(rng: &mut Mulberry32, minimum: f64, maximum: f64) -> f64 {
    minimum + rng.next_f64() * (maximum - minimum)
}

fn build_pangea_centers(
    rng: &mut Mulberry32,
    width: u32,
    height: u32,
    land_fraction: f64,
) -> Vec<ContinentCenter> {
    let t = ((land_fraction - 0.15) / 0.70).clamp(0.0, 1.0);
    let map_scale = (f64::from(width * height) / 20_160.0).sqrt();
    let size_boost = ((map_scale - 1.0) * 0.04).clamp(0.0, 0.06);
    let high_land = ((t - 0.55) / 0.45).max(0.0);
    let low_land = (1.0 - t / 0.45).max(0.0);
    let ring_pull = 0.02 + size_boost * 0.55 + high_land * 0.04 + low_land * 0.03;
    let n_blobs = if t < 0.28 {
        2
    } else if t < 0.55 {
        4
    } else {
        6
    };
    let radius_min = 0.10 + t * 0.11 + size_boost * 0.45;
    let radius_max = 0.16 + t * 0.18 + size_boost * 0.9;
    let ring_min = (0.012 + t * 0.02 + size_boost * 0.06 - ring_pull).max(0.005);
    let ring_max = (0.035 + t * 0.07 + size_boost * 0.16 - ring_pull * 1.2).max(0.02);
    let margin = border_margin(width, height, 0.12);
    let max_dim = f64::from(width.saturating_sub(1).max(height.saturating_sub(1)).max(1));
    let mut centers = vec![ContinentCenter {
        nq: clamp_norm(0.5 + random_jitter(rng, 0.028), margin),
        nr: clamp_norm(0.5 + random_jitter(rng, 0.028), margin),
        radius: random_range(rng, radius_min, radius_max),
    }];
    let ring_slots = n_blobs - 1;
    for i in 0..ring_slots {
        let angle = 2.0 * std::f64::consts::PI * f64::from(i as u32) / f64::from(ring_slots as u32)
            + (rng.next_f64() - 0.5) * 0.45;
        let ring = ring_min + rng.next_f64() * (ring_max - ring_min);
        centers.push(ContinentCenter {
            nq: clamp_norm(
                0.5 + angle.cos() * ring * max_dim / f64::from(width.saturating_sub(1).max(1))
                    + random_jitter(rng, 0.028),
                margin,
            ),
            nr: clamp_norm(
                0.5 + angle.sin() * ring * max_dim / f64::from(height.saturating_sub(1).max(1))
                    + random_jitter(rng, 0.028),
                margin,
            ),
            radius: radius_min * 1.06 + random_range(rng, 0.0, radius_max - radius_min) * 1.12,
        });
    }
    centers
}

fn build_island_centers(rng: &mut Mulberry32, width: u32, height: u32) -> Vec<ContinentCenter> {
    let margin = border_margin(width, height, 0.08);
    let map_scale = (f64::from(width * height) / 8_000.0).sqrt();
    let size_mul = (0.92 + map_scale * 0.07).clamp(0.86, 1.14);
    let base_radius = 0.25 * 0.32 * size_mul;
    let mut centers = Vec::with_capacity(16);
    for row in 0..4 {
        for col in 0..4 {
            centers.push(ContinentCenter {
                nq: clamp_norm(
                    (f64::from(col) + 0.5) * 0.25 + (rng.next_f64() - 0.5) * 0.25 * 0.22,
                    margin,
                ),
                nr: clamp_norm(
                    (f64::from(row) + 0.5) * 0.25 + (rng.next_f64() - 0.5) * 0.25 * 0.22,
                    margin,
                ),
                radius: base_radius * (0.82 + rng.next_f64() * 0.28),
            });
        }
    }
    centers
}

fn land_mask_border_fade(q: u32, r: u32, width: u32, height: u32) -> f64 {
    let distance = border_distance(q, r, width, height);
    if distance < 2 {
        return 0.0;
    }
    if distance <= 10 {
        return (0.05 * f64::from(distance - 1) / 0.45).min(1.0);
    }
    1.0
}

fn edge_rect_fade(q: u32, r: u32, width: u32, height: u32) -> f64 {
    let b = 2.0;
    let nq = f64::from(q) / f64::from(width.saturating_sub(1).max(1));
    let nr = f64::from(r) / f64::from(height.saturating_sub(1).max(1));
    let margin_q = b / f64::from(width.saturating_sub(1).max(1));
    let margin_r = b / f64::from(height.saturating_sub(1).max(1));
    (nq.min(1.0 - nq) / margin_q.max(0.001))
        .min(nr.min(1.0 - nr) / margin_r.max(0.001))
        .min(1.0)
}

fn continents_mask(q: u32, r: u32, context: &MaskContext<'_>) -> f64 {
    let width = context.width;
    let height = context.height;
    let centers = context.centers;
    let permutation = context.permutation;
    let noise_scale = context.noise_scale;
    let nq = f64::from(q) / f64::from(width.saturating_sub(1).max(1));
    let nr = f64::from(r) / f64::from(height.saturating_sub(1).max(1));
    let border = land_mask_border_fade(q, r, width, height);
    let edge = edge_rect_fade(q, r, width, height);
    if border <= 0.0 || edge <= 0.0 || centers.is_empty() {
        return 0.0;
    }
    let (zone, center, dist) = centers
        .iter()
        .enumerate()
        .map(|(index, center)| {
            let distance = (nq - center.nq).hypot(nr - center.nr);
            (index, *center, distance)
        })
        .min_by(|left, right| left.2.total_cmp(&right.2))
        .expect("centers checked above");
    let mut distances: Vec<f64> = centers
        .iter()
        .map(|center| (nq - center.nq).hypot(nr - center.nr))
        .collect();
    distances.sort_by(f64::total_cmp);
    if distances.get(1).copied().unwrap_or(f64::INFINITY) - dist < 0.018 {
        return 0.0;
    }
    let radial = (1.0 - (dist / center.radius).powf(1.55)).max(0.0);
    let coarse = fbm(
        permutation,
        f64::from(q) * noise_scale * 0.55 + 100.0,
        f64::from(r) * noise_scale * 0.55 + 100.0,
        4,
    ) * 0.24;
    let fine = fbm(
        permutation,
        f64::from(q) * noise_scale * 1.45 + 510.0,
        f64::from(r) * noise_scale * 1.45 + 510.0,
        3,
    ) * 0.16;
    let angle = (nr - center.nr).atan2(nq - center.nq);
    let angular = fbm(
        permutation,
        angle.cos() * 4.0 + zone as f64 * 11.0,
        angle.sin() * 4.0 + 220.0,
        2,
    ) * 0.10;
    ((radial + coarse + fine + angular - 0.09) * border * edge).clamp(0.0, 1.0)
}

fn pangea_mask(q: u32, r: u32, context: &MaskContext<'_>) -> f64 {
    let width = context.width;
    let height = context.height;
    let centers = context.centers;
    let permutation = context.permutation;
    let noise_scale = context.noise_scale;
    let land_fraction = context.land_fraction;
    let t = ((land_fraction - 0.15) / 0.70).clamp(0.0, 1.0);
    let map_scale = (f64::from(width * height) / 20_160.0).sqrt();
    let size_boost = ((map_scale - 1.0) * 0.04).clamp(0.0, 0.06);
    let high_land = ((t - 0.55) / 0.45).max(0.0);
    let low_land = (1.0 - t / 0.45).max(0.0);
    let cluster_radius = 0.18 + t * 0.36 + size_boost;
    let threshold = 0.17 - t * 0.10;
    let merge_sum = 0.36 + t * 0.16 + size_boost * 0.12 + high_land * 0.08;
    let merge_max = 0.22 + t * 0.18 + size_boost * 0.06 + high_land * 0.06;
    let global_warp = 0.04 + t * 0.22;
    let valley_amp = (0.045 + t * 0.025 - low_land * 0.02).max(0.015);
    let border = land_mask_border_fade(q, r, width, height);
    if border <= 0.0 {
        return 0.0;
    }
    let max_dim = f64::from(width.saturating_sub(1).max(height.saturating_sub(1)).max(1));
    let px = (f64::from(q) - f64::from(width.saturating_sub(1)) * 0.5) / max_dim;
    let py = (f64::from(r) - f64::from(height.saturating_sub(1)) * 0.5) / max_dim;
    let mut blob_max: f64 = 0.0;
    let mut blob_sum: f64 = 0.0;
    for (zone, center) in centers.iter().enumerate() {
        let cx = (center.nq - 0.5) * f64::from(width.saturating_sub(1)) / max_dim;
        let cy = (center.nr - 0.5) * f64::from(height.saturating_sub(1)) / max_dim;
        let distance = (px - cx).hypot(py - cy);
        let radial = (1.0 - (distance / center.radius).powf(1.55)).max(0.0);
        let coarse = fbm(
            permutation,
            f64::from(q) * noise_scale * 0.55 + 100.0 + zone as f64 * 37.0,
            f64::from(r) * noise_scale * 0.55 + 100.0,
            4,
        ) * 0.24;
        let fine = fbm(
            permutation,
            f64::from(q) * noise_scale * 1.45 + 510.0 + zone as f64 * 17.0,
            f64::from(r) * noise_scale * 1.45 + 510.0,
            3,
        ) * 0.16;
        let angle = (py - cy).atan2(px - cx);
        let angular = fbm(
            permutation,
            angle.cos() * 4.0 + zone as f64 * 11.0,
            angle.sin() * 4.0 + 220.0,
            2,
        ) * 0.10;
        let score = radial + coarse + fine + angular - 0.09;
        blob_max = blob_max.max(score);
        blob_sum += score.max(0.0);
    }
    let merged = (blob_sum * merge_sum + blob_max * merge_max).min(1.0);
    let cluster_fade = (1.0 - (px.hypot(py) / cluster_radius).powf(2.2)).max(0.0);
    let valley = fbm(
        permutation,
        f64::from(q) * noise_scale * 0.38 + 900.0,
        f64::from(r) * noise_scale * 0.38 + 900.0,
        4,
    ) * valley_amp;
    let warp = fbm(
        permutation,
        f64::from(q) * noise_scale * 0.45 + 200.0,
        f64::from(r) * noise_scale * 0.45 + 200.0,
        3,
    ) * global_warp;
    ((merged + warp - valley - threshold) * cluster_fade * border).clamp(0.0, 1.0)
}

fn islands_mask(q: u32, r: u32, context: &MaskContext<'_>) -> f64 {
    let width = context.width;
    let height = context.height;
    let centers = context.centers;
    let permutation = context.permutation;
    let noise_scale = context.noise_scale;
    let grid = 4_u32;
    let nq = f64::from(q) / f64::from(width.saturating_sub(1).max(1));
    let nr = f64::from(r) / f64::from(height.saturating_sub(1).max(1));
    let border = land_mask_border_fade(q, r, width, height);
    let edge = edge_rect_fade(q, r, width, height);
    if border <= 0.0 || edge <= 0.0 {
        return 0.0;
    }
    let col = (q * grid / width.max(1)).min(grid - 1);
    let row = (r * grid / height.max(1)).min(grid - 1);
    let center = centers[(row * grid + col) as usize];
    let cell_left = f64::from(col) / 4.0;
    let cell_right = f64::from(col + 1) / 4.0;
    let cell_top = f64::from(row) / 4.0;
    let cell_bottom = f64::from(row + 1) / 4.0;
    let distance_to_edge = (nq - cell_left)
        .min(cell_right - nq)
        .min(nr - cell_top)
        .min(cell_bottom - nr);
    let lane_fade = (distance_to_edge / 0.062).clamp(0.0, 1.0);
    if lane_fade <= 0.0 {
        return 0.0;
    }
    let distance = (nq - center.nq).hypot(nr - center.nr);
    let radial = (1.0 - (distance / center.radius).powf(1.88)).max(0.0);
    let coarse = fbm(
        permutation,
        f64::from(q) * noise_scale * 0.62 + 350.0,
        f64::from(r) * noise_scale * 0.62 + 350.0,
        4,
    ) * 0.18;
    let fine = fbm(
        permutation,
        f64::from(q) * noise_scale * 1.55 + 620.0,
        f64::from(r) * noise_scale * 1.55 + 620.0,
        3,
    ) * 0.10;
    let angle = (nr - center.nr).atan2(nq - center.nq);
    let angular = fbm(
        permutation,
        angle.cos() * 5.0 + (row * grid + col) as f64 * 7.0,
        angle.sin() * 5.0 + 330.0,
        2,
    ) * 0.07;
    ((radial + coarse + fine + angular - 0.12) * border * edge * lane_fade).clamp(0.0, 1.0)
}

// The generated TS Earth mask is stored as row-major run lengths to keep the
// Rust port self-contained while preserving the canonical silhouette.
const EARTH_MASK_RLE: &str = concat!(
    "017467;16;04;117;06;110;07;120;027;143;0106;15;019;16;013;164;016;112;0338;16;04;118;010;16;06;123;0",
    "26;143;0105;17;017;19;05;172;012;117;0335;13;06;119;010;15;05;126;025;143;0104;18;016;19;03;176;09;1",
    "20;0282;17;053;119;010;15;05;128;023;142;063;113;031;17;015;19;01;1118;0262;125;02;13;040;118;09;16;",
    "08;126;022;141;062;117;039;14;08;18;02;1123;0255;134;038;117;010;17;07;127;018;11;01;142;060;121;036",
    ";17;05;1136;0249;148;01;120;07;116;05;13;02;18;06;17;05;117;020;139;058;132;016;13;08;1165;02;19;019",
    "8;13;021;174;03;15;01;17;012;110;03;18;06;117;019;138;058;139;05;13;03;137;01;1155;0190;17;018;175;0",
    "9;17;05;14;01;122;06;119;016;133;064;141;04;142;03;1155;0188;110;016;176;06;111;01;128;07;13;02;114;",
    "015;132;066;143;01;143;02;1158;0185;112;014;1122;013;115;014;130;068;187;02;1159;0183;114;013;1120;0",
    "14;117;013;128;016;13;05;14;041;188;01;1161;0181;115;011;1119;015;118;014;127;016;16;01;17;040;1252;",
    "0178;115;06;1125;014;118;015;122;020;115;039;1254;0180;18;09;1126;09;12;02;113;021;120;022;115;038;1",
    "256;0197;1118;01;17;07;11;05;112;021;118;024;115;036;1260;0195;1116;04;17;013;111;022;115;027;113;03",
    "6;1263;0192;1114;028;110;022;115;028;18;039;1265;0189;1113;032;19;022;114;074;1268;0184;1115;014;12;",
    "019;14;026;113;073;122;01;1247;0183;1114;023;110;08;11;025;113;053;12;017;122;03;1245;0183;1114;023;",
    "112;034;111;072;122;05;1242;0184;1113;025;113;036;17;064;11;08;122;05;1215;03;15;01;116;0185;1113;02",
    "5;114;038;14;065;11;09;122;04;1215;05;12;03;115;0181;11;03;126;07;179;026;114;0117;122;05;1213;011;1",
    "14;0187;120;014;177;025;115;04;13;0111;121;06;1212;011;17;0195;114;021;174;025;117;01;16;092;13;015;",
    "121;06;1196;026;17;0197;111;025;172;025;125;090;16;013;120;07;1194;028;17;0199;19;025;173;024;125;08",
    "9;19;019;112;06;1195;028;18;0202;14;027;172;025;124;089;19;018;112;02;11;04;1194;029;19;0196;12;033;",
    "175;022;125;089;19;017;113;02;11;04;1194;029;110;0230;179;018;126;088;110;015;114;07;1194;029;111;01",
    "88;12;040;179;012;11;02;128;088;110;014;114;07;1195;029;112;0230;180;011;132;084;113;013;113;08;1195",
    ";029;112;0180;12;048;182;08;134;081;115;013;113;07;1196;030;111;0230;183;06;136;079;117;012;1217;030",
    ";110;0231;182;05;138;077;118;013;1217;030;19;0231;182;05;138;076;120;011;1220;030;17;0232;181;04;139",
    ";076;120;06;1235;021;16;0232;181;04;139;076;121;04;1237;021;15;0232;181;03;140;076;122;02;1239;021;1",
    "4;0232;182;01;141;076;17;02;1255;021;13;0232;1124;077;15;03;1256;021;12;0231;1124;086;1257;0253;1119",
    ";01;15;085;1254;01;13;0251;1115;06;15;085;1254;01;14;0250;1108;02;13;08;16;087;1251;02;14;0249;1109;",
    "011;18;086;1252;01;14;0250;1108;09;110;085;1253;02;13;0250;1107;09;111;084;1254;03;12;0250;1106;09;1",
    "12;085;1253;05;11;0249;1106;013;18;086;1252;06;11;0247;1108;014;16;087;1251;06;11;0247;1109;0108;195",
    ";01;1153;06;11;0246;1111;02;12;0103;168;01;124;04;113;01;1138;0253;1112;0107;157;03;17;01;122;05;113",
    ";03;1137;0252;1113;0107;156;05;16;01;121;06;112;05;1136;0252;1112;0107;157;06;14;03;120;06;113;03;11",
    "37;09;11;0241;1101;03;17;0109;156;015;119;06;114;01;1138;09;15;0236;1100;06;14;0109;158;017;118;05;1",
    "152;010;17;0233;199;0109;133;01;135;020;116;06;1151;010;18;0231;1100;0109;126;07;112;02;122;021;116;",
    "05;1150;011;18;0230;1100;0110;124;09;113;03;121;021;116;05;1144;02;13;011;18;0230;199;0111;123;010;1",
    "15;02;121;020;116;06;1142;017;17;0231;198;0112;122;011;13;02;148;03;119;07;1140;018;15;0232;197;0114",
    ";120;012;13;04;168;08;1139;019;13;0233;196;0114;120;013;13;06;167;07;1139;020;12;0233;194;0116;120;0",
    "13;13;08;119;01;145;07;1139;020;13;0232;192;0117;120;03;11;010;13;09;117;04;143;07;1123;02;114;020;1",
    "4;0231;189;0120;120;014;12;010;16;03;18;04;143;07;1122;010;18;019;15;0230;188;0121;120;014;11;010;16",
    ";05;17;05;141;08;1121;012;17;019;15;0230;188;0121;119;023;18;06;17;05;142;08;1121;012;17;019;14;0230",
    ";188;0121;118;024;17;08;16;05;143;07;1122;010;19;017;15;0230;186;0124;116;025;16;010;15;06;144;05;11",
    "24;08;110;016;16;0229;185;0127;113;016;15;06;15;011;13;08;146;01;1130;06;18;014;17;0229;185;0129;17;",
    "08;118;033;1175;08;18;012;19;0228;185;0141;122;045;1161;010;17;011;110;0228;185;0139;124;046;1160;01",
    "0;18;08;112;0228;184;0132;15;01;126;024;15;018;1159;010;18;05;114;0229;183;0132;133;047;1159;011;14;",
    "07;114;0231;181;0132;134;046;1161;010;12;08;114;0233;179;0131;137;045;1162;09;11;09;17;01;14;0236;17",
    "7;0130;141;042;1163;019;16;0243;174;0131;145;013;13;023;1164;018;15;0244;172;0133;146;011;16;021;116",
    "5;018;13;0246;170;0134;147;09;19;018;1166;018;12;0247;170;0134;149;07;111;016;1167;017;12;0247;169;0",
    "134;152;05;113;012;1170;016;12;0247;169;0134;155;01;1196;0266;153;01;113;0135;1253;0265;13;02;146;09",
    ";17;0134;1254;0266;13;02;136;02;16;012;15;0134;1114;02;1139;0265;13;02;134;022;15;0132;1116;03;1138;",
    "0265;14;01;132;025;14;0130;1119;03;1136;0266;14;02;130;026;14;0129;1120;03;1136;0266;14;03;127;028;1",
    "4;0128;192;02;128;03;1134;0267;14;04;126;028;14;0127;193;03;128;03;1133;0268;14;03;125;029;14;0127;1",
    "93;04;127;06;15;01;1123;0270;13;04;124;029;14;0126;195;03;128;012;1122;0270;13;04;124;030;13;0126;19",
    "5;04;127;013;1121;0271;13;04;123;031;11;0126;197;03;128;016;1117;0271;13;04;123;0158;198;03;127;08;1",
    "3;019;1103;04;11;0267;13;04;121;0158;199;04;128;04;16;020;1100;04;12;0267;13;05;120;0158;199;05;138;",
    "020;198;05;12;0268;12;05;119;0158;1101;04;140;019;197;05;12;0269;11;06;118;0157;1102;05;140;018;196;",
    "06;12;0276;118;026;12;03;13;0122;1104;04;141;018;194;07;12;0277;117;025;11;05;15;0120;1105;04;141;01",
    "8;190;0289;117;033;16;0117;1105;04;141;019;139;03;143;0293;117;035;16;0115;1105;05;140;020;136;06;14",
    "0;0296;117;013;15;017;16;0114;1105;05;139;022;133;09;139;0296;117;012;16;018;16;0113;1106;05;137;027",
    ";128;010;131;02;15;0297;118;010;17;019;15;0113;1106;05;136;029;126;012;128;05;14;0196;11;0100;118;09",
    ";18;028;15;0105;1106;05;135;029;125;014;127;05;13;0197;11;0100;119;07;18;029;16;0104;1106;06;133;030",
    ";125;015;125;06;13;0299;119;04;110;029;17;0103;1107;05;132;031;124;017;125;05;13;0300;131;027;11;02;",
    "16;0104;1108;05;130;032;123;019;124;05;13;0301;130;0140;1108;06;128;034;121;020;125;028;13;0279;127;",
    "0141;1109;06;126;035;120;022;124;028;14;0280;125;0141;1109;06;124;037;119;023;125;026;15;0282;124;01",
    "40;1110;06;121;039;118;024;126;025;15;0284;123;0138;1111;06;120;041;116;025;13;03;121;024;15;0293;11",
    "9;0133;1112;06;118;042;115;033;121;023;15;0295;118;0132;1113;05;117;044;113;034;122;022;15;0296;118;",
    "0131;1114;04;116;045;113;034;123;022;13;0298;117;0131;1115;03;114;048;111;036;123;022;12;0299;116;01",
    "31;1128;052;111;036;123;025;13;0297;114;0131;1126;054;111;036;123;026;12;0299;111;0132;1124;057;110;",
    "036;123;023;11;0305;19;024;11;0107;1121;060;110;025;11;011;122;0331;17;023;11;0109;1119;062;19;025;1",
    "1;011;14;03;115;0331;17;019;17;0108;1117;063;19;025;11;012;12;06;113;029;13;0300;16;017;116;0101;111",
    "8;07;18;048;18;038;12;07;111;026;12;01;14;0301;15;016;120;02;14;093;1118;01;113;048;18;038;12;09;18;",
    "030;14;0302;15;014;128;093;1131;049;17;038;12;010;16;030;15;0303;16;011;130;093;1129;050;17;038;13;0",
    "10;13;032;14;0304;18;02;11;01;12;03;131;092;1129;051;15;039;13;045;12;03;12;0302;19;02;137;092;1128;",
    "052;13;03;12;035;13;049;14;0302;18;02;139;090;1127;054;11;04;13;034;14;09;11;036;16;0304;15;04;139;0",
    "90;1125;060;13;035;13;045;17;0313;140;090;1124;060;13;036;13;045;16;0314;140;090;1122;061;13;037;13;",
    "040;11;04;15;0314;142;089;1121;061;13;037;14;045;14;0314;144;088;127;02;190;063;11;039;14;028;13;014",
    ";12;0315;150;083;122;08;188;0103;15;026;15;0330;151;084;19;02;17;012;186;0103;16;024;17;0329;152;084",
    ";16;024;185;093;15;05;16;023;18;0329;153;0117;180;095;15;05;15;022;19;0328;154;0119;177;097;15;04;16",
    ";020;19;0329;154;0119;176;099;15;03;16;018;111;0328;156;0119;175;0100;15;02;16;016;113;0328;156;0119",
    ";174;0101;16;02;15;015;115;0326;158;0118;173;0103;112;014;116;0326;158;0118;172;0104;112;012;118;032",
    "5;160;0117;171;0106;110;012;119;018;13;0304;160;0117;169;0109;19;012;119;018;13;0303;161;0117;168;01",
    "11;18;012;119;04;18;06;12;0281;11;021;162;0117;167;0112;19;011;118;0302;11;020;166;0114;166;0114;19;",
    "010;118;03;12;0297;11;020;168;0112;165;0115;110;09;117;03;14;0317;173;0107;164;0117;19;010;115;04;17",
    ";017;15;0292;175;0105;163;0119;110;08;115;04;16;05;11;013;15;0291;177;0103;163;0119;112;07;113;05;16",
    ";020;14;05;17;0279;179;0101;162;0121;111;08;112;05;17;020;15;01;111;0277;184;096;162;0121;111;09;110",
    ";06;17;011;11;08;119;0275;185;096;160;0123;19;014;16;06;17;016;11;03;122;0272;187;095;159;0124;18;01",
    "6;14;06;17;016;11;04;122;0271;189;094;157;0126;16;027;17;022;122;0270;190;093;157;0127;16;027;13;029",
    ";119;013;11;0255;191;093;156;0128;15;061;118;011;11;0256;192;092;156;0129;16;061;117;09;12;0257;191;",
    "093;155;0130;17;059;118;0267;191;093;154;0132;18;058;118;016;11;0250;190;094;153;0133;19;056;119;015",
    ";11;0250;190;094;153;0134;115;049;119;0267;189;095;152;0139;111;048;120;0267;188;095;152;0156;13;01;",
    "13;010;11;025;110;03;16;0267;188;095;152;0156;13;02;13;09;11;027;16;06;16;0267;187;095;153;0169;11;0",
    "43;16;0266;186;096;153;0159;11;07;12;045;15;020;11;0246;184;097;154;0166;12;046;14;0267;184;097;154;",
    "0486;182;098;154;0487;180;099;154;0179;11;023;11;0283;179;099;155;0202;12;0284;177;0100;155;0180;110",
    ";011;13;0284;177;099;156;017;12;0160;111;011;13;0285;175;0100;156;016;13;0159;112;011;14;0284;175;01",
    "00;156;015;14;0159;112;010;15;0285;173;0100;157;014;15;0150;13;05;113;010;16;0284;173;0100;157;013;1",
    "6;0149;16;03;112;011;16;0285;172;0100;157;011;18;0148;123;010;17;0285;171;0100;156;011;19;0147;124;0",
    "10;17;0286;170;0100;155;011;110;0147;125;08;18;0288;168;0100;154;011;110;0147;127;07;18;0290;166;010",
    "0;153;011;111;0145;130;05;19;0292;164;0100;152;011;111;0145;133;03;19;0293;163;0100;151;012;111;0144",
    ";147;062;12;0229;162;0100;149;014;111;0143;148;062;12;0230;161;0100;148;015;110;0143;150;0293;161;01",
    "01;146;016;110;0143;150;0294;160;0101;146;017;19;0141;153;0293;160;0102;144;017;110;0139;156;0293;15",
    "8;0103;144;017;19;0137;159;0293;158;0104;142;017;110;0133;163;031;12;0260;157;0105;142;017;19;0132;1",
    "66;0292;156;0106;142;017;19;0130;168;0292;155;0107;142;017;18;0130;170;032;11;0258;154;0109;141;017;",
    "18;0129;172;0290;152;0111;141;017;18;0128;174;0289;150;0114;140;017;18;0128;174;0289;148;0116;140;01",
    "7;17;0129;175;0288;146;0118;139;018;16;0130;175;0288;145;0119;138;020;14;0131;175;0288;144;0120;136;",
    "0157;175;0288;144;0120;136;0157;175;0288;143;0121;135;0157;176;0288;143;0121;135;0157;176;0288;142;0",
    "123;133;0158;176;0288;142;0123;133;0158;176;0288;142;0124;132;0158;176;0288;142;0125;130;0159;176;02",
    "88;142;0125;130;0159;176;0288;142;0126;128;0160;176;0288;142;0126;128;0160;175;0289;141;0128;126;016",
    "1;174;0290;141;0128;125;0162;173;0291;140;0129;124;0163;172;0292;140;0129;123;0164;172;0292;139;0131",
    ";121;0165;127;05;139;0293;139;0131;120;0165;121;014;136;0294;138;0132;118;0167;119;017;134;0295;137;",
    "0133;117;0167;118;020;132;0296;136;0134;19;0175;110;032;127;0297;135;0136;16;0177;18;035;125;0298;13",
    "4;0320;16;036;125;0299;132;0364;124;0300;131;0365;123;043;11;0257;131;0365;122;044;11;0257;131;0365;",
    "121;0303;131;0365;120;048;11;0255;131;0365;119;048;12;0255;130;0367;116;049;14;0254;129;0369;113;050",
    ";16;0253;125;0434;17;0254;123;0435;17;0256;122;0434;17;0257;121;0435;16;0258;121;0435;14;0260;120;04",
    "35;14;0261;120;0380;15;045;13;02;13;0262;120;0379;16;043;15;0267;119;0379;17;042;15;0271;116;0379;16",
    ";042;15;0272;116;0426;14;0274;116;0420;15;0280;115;0418;17;0280;115;0417;17;0282;113;0417;17;0283;11",
    "3;0416;16;0285;113;0415;15;0287;114;0414;14;0288;115;0705;115;0411;11;080703",
);
const EARTH_MASK_WIDTH: usize = 720;
const EARTH_MASK_HEIGHT: usize = 400;
const EARTH_MASK_BBOX: (f64, f64, f64, f64) = (0.0723, 0.0551, 0.9917, 0.7243);

fn earth_mask_bits() -> &'static [u8] {
    static BITS: OnceLock<Vec<u8>> = OnceLock::new();
    BITS.get_or_init(|| {
        let mut bits = Vec::with_capacity(EARTH_MASK_WIDTH * EARTH_MASK_HEIGHT);
        for run in EARTH_MASK_RLE.split(';') {
            let (value, count) = run.split_at(1);
            let value = value.as_bytes()[0] - b'0';
            let count: usize = count.chars().fold(0, |acc, digit| {
                acc * 10 + digit.to_digit(10).expect("valid Earth RLE") as usize
            });
            bits.extend(std::iter::repeat_n(value, count));
        }
        assert_eq!(bits.len(), EARTH_MASK_WIDTH * EARTH_MASK_HEIGHT);
        bits
    })
}

fn sample_earth_template_land(bits: &[u8], nq: f64, nr: f64) -> f64 {
    if !(0.0..=1.0).contains(&nq) || !(0.0..=1.0).contains(&nr) {
        return 0.0;
    }
    let fx = nq * (EARTH_MASK_WIDTH - 1) as f64;
    let fy = nr * (EARTH_MASK_HEIGHT - 1) as f64;
    let x0 = fx.floor() as usize;
    let y0 = fy.floor() as usize;
    let x1 = (x0 + 1).min(EARTH_MASK_WIDTH - 1);
    let y1 = (y0 + 1).min(EARTH_MASK_HEIGHT - 1);
    let tx = fx - x0 as f64;
    let ty = fy - y0 as f64;
    let bit = |x: usize, y: usize| bits[y * EARTH_MASK_WIDTH + x] as f64;
    let value = (1.0 - tx) * (1.0 - ty) * bit(x0, y0)
        + tx * (1.0 - ty) * bit(x1, y0)
        + (1.0 - tx) * ty * bit(x0, y1)
        + tx * ty * bit(x1, y1);
    if value >= 0.45 {
        1.0
    } else {
        0.0
    }
}

fn earth_template_land_at(q: u32, r: u32, width: u32, height: u32) -> f64 {
    const BORDER: u32 = 2;
    if q < BORDER
        || r < BORDER
        || q >= width.saturating_sub(BORDER)
        || r >= height.saturating_sub(BORDER)
    {
        return 0.0;
    }
    let inner_width = width.saturating_sub(1 + 2 * BORDER).max(1);
    let inner_height = height.saturating_sub(1 + 2 * BORDER).max(1);
    let polar = earth_polar_ocean_rows(height);
    let relative_r = r - BORDER;
    if relative_r < polar || relative_r >= inner_height.saturating_sub(polar) {
        return 0.0;
    }
    let land_rows = inner_height.saturating_sub(2 * polar).max(1);
    let template_r = EARTH_MASK_BBOX.1
        + (relative_r - polar) as f64 / land_rows.saturating_sub(1).max(1) as f64
            * (EARTH_MASK_BBOX.3 - EARTH_MASK_BBOX.1);
    let template_q = EARTH_MASK_BBOX.0
        + (q - BORDER) as f64 / inner_width as f64 * (EARTH_MASK_BBOX.2 - EARTH_MASK_BBOX.0);
    let cell_width = (EARTH_MASK_BBOX.2 - EARTH_MASK_BBOX.0) / inner_width as f64;
    let cell_height = (EARTH_MASK_BBOX.3 - EARTH_MASK_BBOX.1) / land_rows as f64;
    let inner = width.min(height).saturating_sub(2 * BORDER);
    let steps = if inner >= 420 {
        1
    } else if inner >= 220 {
        3
    } else if inner >= 110 {
        5
    } else {
        7
    };
    let bits = earth_mask_bits();
    if steps <= 1 {
        return sample_earth_template_land(bits, template_q, template_r);
    }
    let mut hits = 0;
    for sy in 0..steps {
        for sx in 0..steps {
            let nq = template_q - cell_width * 0.5 + (sx as f64 + 0.5) / steps as f64 * cell_width;
            let nr =
                template_r - cell_height * 0.5 + (sy as f64 + 0.5) / steps as f64 * cell_height;
            hits += sample_earth_template_land(bits, nq, nr) as u32;
        }
    }
    let threshold = if inner >= 320 {
        0.45
    } else if inner >= 160 {
        0.38
    } else if inner >= 80 {
        0.32
    } else {
        0.26
    };
    if hits as f64 / (steps * steps) as f64 >= threshold {
        1.0
    } else {
        0.0
    }
}

fn earth_mask(
    q: u32,
    r: u32,
    width: u32,
    height: u32,
    permutation: &[u8; 256],
    noise_scale: f64,
) -> f64 {
    if earth_template_land_at(q, r, width, height) <= 0.0 {
        return 0.0;
    }
    let coast_noise = fbm(
        permutation,
        f64::from(q) * noise_scale * 0.85 + 880.0,
        f64::from(r) * noise_scale * 0.85 + 880.0,
        3,
    ) * 0.09;
    (0.89 + coast_noise).clamp(0.0, 1.0)
}

fn earth_polar_ocean_rows(height: u32) -> u32 {
    let inner_height = height.saturating_sub(5).max(1);
    let scaled = (30.0 * f64::from(inner_height) / 115.0).round() as u32;
    let cap = 30_u32.max((f64::from(inner_height) * 0.12).round() as u32);
    2_u32.max(scaled.min(cap))
}

/// Returns the canonical latitudinal band used by `climateBandAt` in TS.
pub fn climate_band_at(r: u32, height: u32, is_earth: bool) -> ClimateBand {
    let buffer = if is_earth {
        earth_polar_ocean_rows(height)
    } else {
        2_u32.max((f64::from(height) * 0.05).round() as u32)
    };
    let inner_height = height.saturating_sub(2 * buffer).max(1);
    let relative = (f64::from(r).mul_add(1.0, -f64::from(buffer)))
        / f64::from(inner_height.saturating_sub(1).max(1));
    if !(0.0..=1.0).contains(&relative) {
        return if r < height / 2 {
            ClimateBand::PolarNorth
        } else {
            ClimateBand::PolarSouth
        };
    }
    let desert_half = 3.5 / f64::from(inner_height);
    let desert_low = 0.5 - desert_half;
    let desert_high = 0.5 + desert_half;
    let plains_north_low = desert_low - 0.075;
    let plains_south_high = desert_high + 0.075;
    if relative < 0.05 {
        ClimateBand::PolarNorth
    } else if relative < plains_north_low {
        ClimateBand::TemperateNorth
    } else if relative < desert_low {
        ClimateBand::PlainsNorth
    } else if relative < desert_high {
        ClimateBand::Desert
    } else if relative < plains_south_high {
        ClimateBand::PlainsSouth
    } else if relative < 0.95 {
        ClimateBand::TemperateSouth
    } else {
        ClimateBand::PolarSouth
    }
}

fn climate_band_terrain(band: ClimateBand, q: u32, r: u32, seed: u32) -> Terrain {
    if band.is_polar() {
        return Terrain::Polar;
    }
    let hash = hash_int3(q, r, seed);
    match band {
        ClimateBand::Desert => {
            if hash < 0.5 {
                Terrain::Desert
            } else {
                Terrain::Plains
            }
        }
        ClimateBand::PlainsNorth | ClimateBand::PlainsSouth => {
            if hash < 0.7 {
                Terrain::Plains
            } else {
                Terrain::Grassland
            }
        }
        ClimateBand::TemperateNorth | ClimateBand::TemperateSouth => {
            if hash < 0.85 {
                Terrain::Grassland
            } else {
                Terrain::Plains
            }
        }
        ClimateBand::PolarNorth | ClimateBand::PolarSouth => Terrain::Polar,
    }
}

fn apply_climate_bands(tiles: &mut [HexTile], height: u32, seed: u32, is_earth: bool) {
    for tile in tiles {
        if tile.terrain.is_water() || matches!(tile.terrain, Terrain::Mountains | Terrain::Hills) {
            continue;
        }
        let band = climate_band_at(tile.coord.r as u32, height, is_earth);
        let climate_terrain =
            climate_band_terrain(band, tile.coord.q as u32, tile.coord.r as u32, seed);
        tile.terrain = climate_terrain;
        if matches!(climate_terrain, Terrain::Polar | Terrain::Desert) {
            tile.forest = false;
        }
    }
}

fn classify_terrain(
    elevation: f64,
    land_mask: f64,
    mountain_noise: f64,
    forest_noise: f64,
    desert_noise: f64,
    climate_band: ClimateBand,
    cell_bias: f64,
) -> Terrain {
    if elevation < 0.14 {
        return if land_mask < 0.22 {
            Terrain::Sea
        } else {
            Terrain::Grassland
        };
    }
    if mountain_noise > 0.75 && land_mask > 0.35 && elevation > 0.22 {
        return Terrain::Mountains;
    }
    if mountain_noise > 0.60 && land_mask > 0.30 && elevation > 0.18 {
        return Terrain::Hills;
    }
    if climate_band == ClimateBand::Desert
        && desert_noise > 0.63
        && (0.18..0.45).contains(&elevation)
    {
        return Terrain::Desert;
    }
    let global = ((forest_noise + desert_noise) * 0.5 - 0.5) * TERRAIN_GLOBAL_MIX_AMP;
    if elevation + global + cell_bias * TERRAIN_CELL_JITTER_AMP > 0.35 {
        Terrain::Plains
    } else {
        Terrain::Grassland
    }
}

fn terrain_cell_bias(q: u32, r: u32, seed: u32) -> f64 {
    let cx = q / 4;
    let cy = r / 4;
    (hash_int3(cx, cy, seed) - 0.5) * 2.0
}

fn hash_int3(a: u32, b: u32, c: u32) -> f64 {
    let mut hash =
        a.wrapping_mul(374_761_393) ^ b.wrapping_mul(668_265_263) ^ c.wrapping_mul(2_246_822_519);
    hash = (hash ^ (hash >> 13)).wrapping_mul(1_274_126_177);
    f64::from(hash ^ (hash >> 16)) / UNIT_SCALE
}

fn border_distance(q: u32, r: u32, width: u32, height: u32) -> u32 {
    q.min(r).min(width - 1 - q).min(height - 1 - r)
}

fn mark_coast_tiles(tiles: &mut [HexTile], width: u32, height: u32) {
    let snapshot: Vec<Terrain> = tiles.iter().map(|tile| tile.terrain).collect();
    for tile in tiles.iter_mut() {
        if tile.terrain != Terrain::Sea {
            continue;
        }
        let adjacent_land = tile.coord.neighbours().any(|coord| {
            coord.q >= 0
                && coord.r >= 0
                && (coord.q as u32) < width
                && (coord.r as u32) < height
                && snapshot[(coord.r as u32 * width + coord.q as u32) as usize].is_land()
        });
        if adjacent_land {
            tile.terrain = Terrain::ShallowSea;
            tile.forest = false;
        }
    }
}

/// Add deterministic river paths from selected relief sources to the nearest water.
/// The marker is written for every land tile on the path, so every river tile is
/// connected to an outlet and repeated generation stays byte-for-byte stable.
fn add_core_rivers(tiles: &mut [HexTile], width: u32, height: u32) {
    if width < 5 || height < 5 {
        return;
    }
    let candidates: Vec<usize> = tiles
        .iter()
        .enumerate()
        .filter(|(_, tile)| matches!(tile.terrain, Terrain::Mountains | Terrain::Hills))
        .map(|(index, _)| index)
        .step_by(17)
        .collect();
    for source_index in candidates {
        let source = tiles[source_index].coord;
        if let Some(path) = find_water_path(tiles, width, height, source) {
            for index in path {
                tiles[index].river = true;
            }
        }
    }
}

fn find_water_path(
    tiles: &[HexTile],
    width: u32,
    height: u32,
    source: HexCoord,
) -> Option<Vec<usize>> {
    let start = tile_index(source, width, height)?;
    if tiles[start].terrain.is_water() {
        return None;
    }
    let mut queue = std::collections::VecDeque::from([start]);
    let mut previous = vec![None; tiles.len()];
    let mut visited = vec![false; tiles.len()];
    visited[start] = true;
    let mut outlet = None;

    while let Some(current) = queue.pop_front() {
        for neighbour in tiles[current].coord.neighbours() {
            let Some(index) = tile_index(neighbour, width, height) else {
                continue;
            };
            if visited[index] {
                continue;
            }
            visited[index] = true;
            previous[index] = Some(current);
            if tiles[index].terrain.is_water() {
                outlet = Some(current);
                break;
            }
            queue.push_back(index);
        }
        if outlet.is_some() {
            break;
        }
    }

    let mut path = Vec::new();
    let mut current = outlet?;
    loop {
        path.push(current);
        if current == start {
            path.reverse();
            return Some(path);
        }
        current = previous[current]?;
    }
}

fn tile_index(coord: HexCoord, width: u32, height: u32) -> Option<usize> {
    if coord.q < 0 || coord.r < 0 || coord.q as u32 >= width || coord.r as u32 >= height {
        return None;
    }
    Some(coord.r as usize * width as usize + coord.q as usize)
}

fn terrain_index(terrain: Terrain) -> usize {
    match terrain {
        Terrain::Sea => 0,
        Terrain::ShallowSea => 1,
        Terrain::Grassland => 2,
        Terrain::Plains => 3,
        Terrain::Desert => 4,
        Terrain::Hills => 5,
        Terrain::Mountains => 6,
        Terrain::Polar => 7,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mulberry32_matches_typescript_first_values() {
        let mut rng = Mulberry32::new(42);
        assert_eq!(rng.next_u32(), 2_581_720_956);
        assert_eq!(rng.next_u32(), 1_925_393_290);
        assert_eq!(rng.next_u32(), 3_661_312_704);
    }

    #[test]
    fn value_noise_and_fbm_match_typescript_golden_vectors() {
        let mut rng = Mulberry32::new(42);
        let permutation = build_permutation(&mut rng);
        assert_eq!(
            &permutation[..16],
            &[79, 208, 113, 244, 223, 165, 38, 9, 182, 5, 2, 108, 57, 25, 210, 177]
        );
        assert!((value_noise_2d(&permutation, 0.25, 0.75) - 0.7830546360319002).abs() < 1e-15);
        assert!((value_noise_2d(&permutation, 4.5, 3.25) - 0.43968444970519815).abs() < 1e-15);
        assert!((fbm(&permutation, 0.25, 0.75, 4) - 0.6691324071908695).abs() < 1e-15);
        assert!((fbm(&permutation, 4.5, 3.25, 3) - 0.3772986771424662).abs() < 1e-15);
    }

    #[test]
    fn terrain_bias_and_classification_match_typescript_golden_vectors() {
        let biases = [
            terrain_cell_bias(0, 0, 42),
            terrain_cell_bias(4, 0, 42),
            terrain_cell_bias(0, 4, 42),
            terrain_cell_bias(9, 7, 12_345),
        ];
        let expected = [
            0.23437289893627167,
            -0.6459841071628034,
            -0.14093960728496313,
            -0.0966324950568378,
        ];
        for (actual, expected) in biases.into_iter().zip(expected) {
            assert!((actual - expected).abs() < 1e-15);
        }

        let terrains = [
            classify_terrain(
                0.10,
                0.10,
                0.80,
                0.20,
                0.20,
                ClimateBand::TemperateNorth,
                0.0,
            ),
            classify_terrain(
                0.10,
                0.30,
                0.80,
                0.20,
                0.20,
                ClimateBand::TemperateNorth,
                0.0,
            ),
            classify_terrain(
                0.25,
                0.40,
                0.80,
                0.20,
                0.20,
                ClimateBand::TemperateNorth,
                0.0,
            ),
            classify_terrain(
                0.20,
                0.40,
                0.61,
                0.20,
                0.20,
                ClimateBand::TemperateNorth,
                0.0,
            ),
            classify_terrain(0.30, 0.40, 0.20, 0.20, 0.70, ClimateBand::Desert, 0.0),
            classify_terrain(
                0.40,
                0.40,
                0.20,
                0.20,
                0.20,
                ClimateBand::TemperateNorth,
                1.0,
            ),
        ];
        assert_eq!(
            terrains,
            [
                Terrain::Sea,
                Terrain::Grassland,
                Terrain::Mountains,
                Terrain::Hills,
                Terrain::Desert,
                Terrain::Plains,
            ]
        );
    }

    #[test]
    fn axial_distance_and_neighbours_match_hex_contract() {
        let origin = HexCoord::new(4, 4);
        let neighbours: Vec<_> = origin.neighbours().collect();
        assert_eq!(neighbours.len(), 6);
        assert!(neighbours.iter().all(|coord| origin.distance(*coord) == 1));
        assert_eq!(origin.distance(HexCoord::new(7, 2)), 3);
    }

    #[test]
    fn canonical_mask_vectors_match_typescript() {
        let points = [(18, 14), (9, 8), (27, 20)];
        let expected = [
            [1.0, 0.5537604801383436, 0.4956324549950586],
            [0.9789176456785471, 0.2049166935764926, 0.1281437628375818],
            [
                0.014317990285265408,
                0.004516155530222999,
                0.0037681991835320453,
            ],
        ];
        for (world_index, world_type) in
            [WorldType::Continents, WorldType::Pangea, WorldType::Islands]
                .into_iter()
                .enumerate()
        {
            let mut rng = Mulberry32::new(42);
            let permutation = build_permutation(&mut rng);
            let shape = ShapeParams::from_rng(&mut rng, 1.0);
            let fraction = default_land_fraction(world_type);
            let centers = build_world_centers(&mut rng, 36, 28, world_type, fraction);

            let context = MaskContext {
                width: 36,
                height: 28,
                permutation: &permutation,
                noise_scale: shape.noise_scale,
                centers: &centers,
                land_fraction: fraction,
            };
            for (point_index, (q, r)) in points.into_iter().enumerate() {
                let actual = land_mask(q, r, world_type, &context);
                assert!((actual - expected[world_index][point_index]).abs() < 1e-15);
            }
        }
        let mut rng = Mulberry32::new(42);
        let permutation = build_permutation(&mut rng);
        let shape = ShapeParams::from_rng(&mut rng, 1.0);
        let earth = MaskContext {
            width: 36,
            height: 28,
            permutation: &permutation,
            noise_scale: shape.noise_scale,
            centers: &[],
            land_fraction: default_land_fraction(WorldType::Earth),
        };
        for (q, r, expected) in [
            (0, 0, 0.0),
            (18, 14, 0.9316724043325739),
            (24, 14, 0.0),
            (10, 10, 0.9199536103293708),
            (30, 20, 0.0),
            (18, 4, 0.0),
            (18, 23, 0.0),
        ] {
            let actual = land_mask(q, r, WorldType::Earth, &earth);
            assert!((actual - expected).abs() < 1e-15);
        }
    }

    #[test]
    fn canonical_climate_band_vectors_match_typescript() {
        let actual = [
            climate_band_at(0, 28, false),
            climate_band_at(4, 28, false),
            climate_band_at(8, 28, false),
            climate_band_at(9, 28, false),
            climate_band_at(12, 28, false),
            climate_band_at(17, 28, false),
            climate_band_at(20, 28, false),
            climate_band_at(25, 28, false),
        ];
        assert_eq!(
            actual,
            [
                ClimateBand::PolarNorth,
                ClimateBand::TemperateNorth,
                ClimateBand::TemperateNorth,
                ClimateBand::PlainsNorth,
                ClimateBand::Desert,
                ClimateBand::PlainsSouth,
                ClimateBand::TemperateSouth,
                ClimateBand::PolarSouth,
            ]
        );
        assert_eq!(climate_band_at(0, 28, true), ClimateBand::PolarNorth);
        assert_eq!(climate_band_at(27, 28, true), ClimateBand::PolarSouth);
    }
}
