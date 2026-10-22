//! Deterministic hex-map generation core.
//!
//! The implementation mirrors the TypeScript map-generation primitives:
//! Mulberry32, Fisher-Yates permutation, cosine-interpolated value noise,
//! fBm, axial neighbours, and terrain classification.  The module is kept
//! independent from the wider engine while the hex/terrain domains are being
//! integrated; its public data contracts are deliberately serializable.

use serde::{Deserialize, Serialize};
use std::fmt;

use super::mapgen::prims;
use super::mapgen::prims::fbm;

const DEFAULT_SEED: u32 = 42;
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
    /// Kierunki sasiadow: jedno zrodlo w `mapgen::prims::HEX_DIRECTIONS` (web `HEX_DIRECTIONS`).
    pub const DIRECTIONS: [Self; 6] = {
        let mut out = [Self { q: 0, r: 0 }; 6];
        let mut index = 0;
        while index < 6 {
            out[index] = Self {
                q: prims::HEX_DIRECTIONS[index].0,
                r: prims::HEX_DIRECTIONS[index].1,
            };
            index += 1;
        }
        out
    };

    pub const fn new(q: i32, r: i32) -> Self {
        Self { q, r }
    }

    pub fn neighbours(self) -> impl Iterator<Item = Self> {
        Self::DIRECTIONS
            .into_iter()
            .map(move |direction| Self::new(self.q + direction.q, self.r + direction.r))
    }

    pub const fn distance(self, other: Self) -> u32 {
        prims::hex_distance_axial(self.q as i64, self.r as i64, other.q as i64, other.r as i64)
            as u32
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
        let (state, output) = prims::mulberry32_step(self.state);
        self.state = state;
        output
    }

    pub fn next_f64(&mut self) -> f64 {
        prims::mulberry32_unit(self.next_u32())
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
    prims::build_perm_table(|| rng.next_f64())
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

fn earth_mask(
    q: u32,
    r: u32,
    width: u32,
    height: u32,
    permutation: &[u8; 256],
    noise_scale: f64,
) -> f64 {
    if prims::earth_template_land_at(i64::from(q), i64::from(r), width, height) <= 0.0 {
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

/// Returns the canonical latitudinal band used by `climateBandAt` in TS.
pub fn climate_band_at(r: u32, height: u32, is_earth: bool) -> ClimateBand {
    prims::climate_band_at(i64::from(r), height, is_earth)
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
    f64::from(hash ^ (hash >> 16)) / prims::UNIT_SCALE
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
    use super::prims::value_noise_2d;
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
