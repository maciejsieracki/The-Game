//! Deterministic hex-map generation core.
//!
//! The implementation mirrors the TypeScript map-generation primitives:
//! Mulberry32, Fisher-Yates permutation, cosine-interpolated value noise,
//! fBm, axial neighbours, and terrain classification.  The module is kept
//! independent from the wider engine while the hex/terrain domains are being
//! integrated; its public data contracts are deliberately serializable.

use serde::{Deserialize, Serialize};
use std::fmt;

const DEFAULT_SEED: u32 = 42;
const UNIT_SCALE: f64 = 4_294_967_296.0;
const MULBERRY_INCREMENT: u32 = 0x6d2b_79f5;
const TERRAIN_GLOBAL_MIX_AMP: f64 = 0.12;
const TERRAIN_CELL_JITTER_AMP: f64 = 0.65;

/// Supported world layouts for the deterministic core.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum WorldType {
    #[serde(rename = "kontynenty")]
    Continents,
    #[serde(rename = "pangea")]
    Pangea,
    #[serde(rename = "wyspy")]
    Islands,
    #[serde(rename = "ziemia")]
    Earth,
}

impl Default for WorldType {
    fn default() -> Self {
        Self::Continents
    }
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
/// The random-consumption order is intentional: permutation first, then six
/// shape offsets, then one classification pass. Changing that order changes
/// every golden vector and is therefore a compatibility break.
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

    let mut tiles = Vec::with_capacity(tile_count as usize);
    for r in 0..height {
        for q in 0..width {
            let land_mask = land_mask(
                q,
                r,
                width,
                height,
                world_type,
                &permutation,
                shape.noise_scale,
            );
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

fn land_mask(
    q: u32,
    r: u32,
    width: u32,
    height: u32,
    world_type: WorldType,
    permutation: &[u8; 256],
    noise_scale: f64,
) -> f64 {
    if border_distance(q, r, width, height) < 2 {
        return 0.0;
    }
    let nq = f64::from(q) / f64::from(width.saturating_sub(1).max(1));
    let nr = f64::from(r) / f64::from(height.saturating_sub(1).max(1));
    match world_type {
        WorldType::Continents | WorldType::Earth => ellipse_mask(q, r, width, height),
        WorldType::Pangea => {
            let base = ellipse_mask(q, r, width, height);
            let warp = fbm(
                permutation,
                f64::from(q) * noise_scale * 0.7 + 31.0,
                f64::from(r) * noise_scale * 0.7 + 17.0,
                3,
            );
            (base + (warp - 0.5) * 0.30).clamp(0.0, 1.0)
        }
        WorldType::Islands => {
            let cell_q = (q * 4 / width.max(1)).min(3);
            let cell_r = (r * 4 / height.max(1)).min(3);
            let center_q = (f64::from(cell_q) + 0.5) / 4.0;
            let center_r = (f64::from(cell_r) + 0.5) / 4.0;
            let distance = ((nq - center_q).powi(2) + (nr - center_r).powi(2)).sqrt();
            let island = (1.0 - distance / 0.115).clamp(0.0, 1.0);
            let warp = fbm(
                permutation,
                f64::from(q) * noise_scale + 7.0,
                f64::from(r) * noise_scale + 19.0,
                2,
            );
            (island + (warp - 0.5) * 0.22).clamp(0.0, 1.0)
        }
    }
}

fn ellipse_mask(q: u32, r: u32, width: u32, height: u32) -> f64 {
    let cx = f64::from(width.saturating_sub(1)) * 0.5;
    let cy = f64::from(height.saturating_sub(1)) * 0.5;
    let dx = (f64::from(q) - cx) / (cx + 0.5);
    let dy = (f64::from(r) - cy) / (cy + 0.5);
    let distance = (dx * dx + dy * dy).sqrt();
    (1.0 - (distance / 0.85).powi(2)).max(0.0)
}

fn classify_terrain(
    elevation: f64,
    land_mask: f64,
    mountain_noise: f64,
    forest_noise: f64,
    desert_noise: f64,
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
    if desert_noise > 0.63 && (0.18..0.45).contains(&elevation) {
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
            classify_terrain(0.10, 0.10, 0.80, 0.20, 0.20, 0.0),
            classify_terrain(0.10, 0.30, 0.80, 0.20, 0.20, 0.0),
            classify_terrain(0.25, 0.40, 0.80, 0.20, 0.20, 0.0),
            classify_terrain(0.20, 0.40, 0.61, 0.20, 0.20, 0.0),
            classify_terrain(0.30, 0.40, 0.20, 0.20, 0.70, 0.0),
            classify_terrain(0.40, 0.40, 0.20, 0.20, 0.20, 1.0),
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
}
