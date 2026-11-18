//! P6 BATTLE-SETUP T5a (dispatch R-RUSTPORT-P6-BATTLE-SETUP-Q1, runda 1, Operator): generator terenu pola bitwy.
//!
//! Port 1:1 `gra/src/battle/battle-terrain.ts` (pin `07d2fbd72`): `BTerrain` (`:37-46`), `xmur3`/`mulberry32`/`makeRng`
//! (`:72-101`), `pickFromRanges` (`:118-130`), `MOVE_COST`/`COMBAT_NAME` (`:138-159`), `TerrainPreset`/`DEFAULT_PRESET`
//! (`:177-277`), `presetForWorldTerrain` (`:310-379`), `generateBattleTerrain` (`:403-808`) i `tileJitter` (`:811-818`).
//! `pickSpreadRows` (`:104-114`) nie jest wolane przez generator pinu, wiec nie jest portowane.
//!
//! Arytmetyka jak w JS: indeksy kafli liczone jako `r * cols + c` na `i64`; zapis poza tablica jest pomijany, a odczyt
//! poza tablica daje `undefined` (porownania z `undefined` sa falszywe) - tak zachowuje sie `Uint8Array` w pinie, takze
//! w malych siatkach, gdzie kolumny rzeki potrafia wyjsc poza siatke. `Math.round` = [`js_round`], `Math.sin` =
//! [`js_sin`](super::battle_setup_sin::js_sin) (fdlibm jak V8). Kolejnosc wywolan `rng()` 1:1 z pinem (takze
//! zwarcie `&&` i `?:`), co sprawdzaja wektory `p6_battle_setup_vectors/vectors.json`.
//!
//! Ziarno: pin czyta `charCodeAt` (jednostki UTF-16), wiec [`xmur3`] hashuje `str::encode_utf16`.

use super::battle_setup_sin::js_sin;

/// `BTerrain` (`battle-terrain.ts:37-46`): rodzaj kafla jako kod `u8` (jak `Uint8Array` w pinie).
pub mod bterrain {
    /// Trawa (domyslny).
    pub const PLAINS: u8 = 0;
    /// Las.
    pub const FOREST: u8 = 1;
    /// Wzgorza.
    pub const HILLS: u8 = 2;
    /// Gleboka rzeka (nieprzejezdna).
    pub const RIVER: u8 = 3;
    /// Brod.
    pub const FORD: u8 = 4;
    /// Skaly.
    pub const ROCKS: u8 = 5;
    /// Mur (nieprzejezdny).
    pub const WALL: u8 = 6;
    /// Brama (nieprzejezdna do wylomu).
    pub const GATE: u8 = 7;
}
use bterrain::{FORD, FOREST, GATE, HILLS, PLAINS, RIVER, ROCKS, WALL};

/// `Math.round` z JS dla skonczonych i nieskonczonych liczb (polowki w gore; NaN -> NaN).
#[must_use]
pub fn js_round(x: f64) -> f64 {
    if !x.is_finite() {
        return x;
    }
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// Bialy znak JS (`WhiteSpace` + `LineTerminator`, ES2023 §12.2/§12.3): zbior `\s` i `String.prototype.trim`.
#[must_use]
pub fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\u{0009}'
            | '\u{000A}'
            | '\u{000B}'
            | '\u{000C}'
            | '\u{000D}'
            | '\u{0020}'
            | '\u{00A0}'
            | '\u{1680}'
            | '\u{2000}'
            ..='\u{200A}'
                | '\u{2028}'
                | '\u{2029}'
                | '\u{202F}'
                | '\u{205F}'
                | '\u{3000}'
                | '\u{FEFF}'
    )
}

/// `String.prototype.trim` (zbior [`is_js_whitespace`]).
#[must_use]
pub fn js_trim(s: &str) -> &str {
    s.trim_matches(is_js_whitespace)
}

// ------------------------------------------------------------------ RNG

/// `xmur3(str)` (`battle-terrain.ts:72-85`): stan hasha po wczytaniu ziarna (jednostki UTF-16).
#[derive(Debug, Clone)]
pub struct Xmur3 {
    h: u32,
}

impl Xmur3 {
    /// Hash ziarna.
    #[must_use]
    pub fn new(seed: &str) -> Self {
        let units: Vec<u16> = seed.encode_utf16().collect();
        #[allow(clippy::cast_possible_truncation)]
        let mut h: u32 = 1_779_033_703 ^ (units.len() as u32);
        for u in units {
            h = (h ^ u32::from(u)).wrapping_mul(3_432_918_353);
            h = h.rotate_left(13);
        }
        Self { h }
    }

    /// Kolejna wartosc (`return () => {...}`).
    pub fn next_u32(&mut self) -> u32 {
        let mut h = self.h;
        h = (h ^ (h >> 16)).wrapping_mul(2_246_822_507);
        h = (h ^ (h >> 13)).wrapping_mul(3_266_489_909);
        h ^= h >> 16;
        self.h = h;
        h
    }
}

/// `mulberry32(a)` (`battle-terrain.ts:87-95`).
#[derive(Debug, Clone)]
pub struct Mulberry32 {
    a: u32,
}

impl Mulberry32 {
    /// Strumien z ziarna.
    #[must_use]
    pub const fn new(a: u32) -> Self {
        Self { a }
    }

    /// `[0, 1)`.
    pub fn next_f64(&mut self) -> f64 {
        self.a = self.a.wrapping_add(0x6d2b_79f5);
        let a = self.a;
        let mut t = (a ^ (a >> 15)).wrapping_mul(1 | a);
        t = t.wrapping_add((t ^ (t >> 7)).wrapping_mul(61 | t)) ^ t;
        f64::from(t ^ (t >> 14)) / 4_294_967_296.0
    }
}

/// `makeRng(seed)` (`battle-terrain.ts:98-101`): `mulberry32(xmur3(seed)())`.
#[must_use]
pub fn make_rng(seed: &str) -> Mulberry32 {
    Mulberry32::new(Xmur3::new(seed).next_u32())
}

/// `pickFromRanges(rng, ranges)` (`battle-terrain.ts:118-130`). Bez poprawnych zakresow zwraca 0 i NIE zuzywa rzutu.
pub fn pick_from_ranges(rng: &mut dyn FnMut() -> f64, ranges: &[(i64, i64)]) -> i64 {
    let valid: Vec<(i64, i64)> = ranges
        .iter()
        .copied()
        .filter(|&(lo, hi)| hi >= lo)
        .collect();
    if valid.is_empty() {
        return 0;
    }
    let total: i64 = valid.iter().map(|&(lo, hi)| hi - lo + 1).sum();
    #[allow(clippy::cast_precision_loss)]
    let mut t = rng() * total as f64;
    for &(lo, hi) in &valid {
        #[allow(clippy::cast_precision_loss)]
        let w = (hi - lo + 1) as f64;
        if t < w {
            #[allow(clippy::cast_possible_truncation)]
            return lo + t.floor() as i64;
        }
        t -= w;
    }
    valid[valid.len() - 1].1
}

/// `tileJitter(col, row, salt)` (`battle-terrain.ts:811-818`): mulberry32 z hasha `(col, row, salt)`, `[0, 1)`.
#[must_use]
#[allow(clippy::cast_sign_loss, clippy::cast_possible_wrap)]
pub fn tile_jitter(col: i32, row: i32, salt: i32) -> f64 {
    let a = (col.wrapping_add(1).wrapping_mul(374_761_393)
        ^ row.wrapping_add(1).wrapping_mul(668_265_263)
        ^ salt.wrapping_add(1).wrapping_mul(2_246_822_519_u32 as i32)) as u32;
    Mulberry32::new(a).next_f64()
}

// ------------------------------------------------------------------ presety

/// `RiverMode` (`battle-terrain.ts:166-170`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RiverMode {
    /// `'winding'`.
    Winding,
    /// `'none'`.
    None,
    /// `'wide'`.
    Wide,
    /// `'coast'`.
    Coast,
}

/// `TerrainPreset` (`battle-terrain.ts:177-257`).
#[derive(Debug, Clone, PartialEq)]
pub struct TerrainPreset {
    /// `forestBlobsMul`.
    pub forest_blobs_mul: f64,
    /// `hillBlobsMul`.
    pub hill_blobs_mul: f64,
    /// `rockCountMul`.
    pub rock_count_mul: f64,
    /// `hillRadiusBoost`.
    pub hill_radius_boost: i64,
    /// `riverMode`.
    pub river_mode: RiverMode,
    /// `fordCount` (`undefined` = `None`).
    pub ford_count: Option<i64>,
    /// `lakeCount` (`undefined` = `None`).
    pub lake_count: Option<(i64, i64)>,
    /// `edgeRocks`.
    pub edge_rocks: bool,
    /// `noForest`.
    pub no_forest: bool,
    /// `desertPalette`.
    pub desert_palette: bool,
    /// `biasSafeCols`.
    pub bias_safe_cols: bool,
    /// `isMountain`.
    pub is_mountain: bool,
}

/// `DEFAULT_PRESET` (`battle-terrain.ts:260-271`).
pub const DEFAULT_PRESET: TerrainPreset = TerrainPreset {
    forest_blobs_mul: 1.0,
    hill_blobs_mul: 1.0,
    rock_count_mul: 1.0,
    hill_radius_boost: 0,
    river_mode: RiverMode::Winding,
    ford_count: None,
    lake_count: None,
    edge_rocks: false,
    no_forest: false,
    desert_palette: false,
    bias_safe_cols: false,
    is_mountain: false,
};

/// `WorldTerrainInput` (`battle-terrain.ts:278-286`): baza heksa swiata i nakladki.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct WorldTerrainInput {
    /// `baza` (TerenBazowy, wielkosc liter bez znaczenia; pusty = `''`).
    pub baza: String,
    /// `las`.
    pub las: bool,
    /// `rzeka`.
    pub rzeka: bool,
}

#[allow(clippy::too_many_arguments, clippy::fn_params_excessive_bools)]
const fn preset(
    forest: f64,
    hill: f64,
    rock: f64,
    boost: i64,
    river: RiverMode,
    edge: bool,
    no_forest: bool,
    desert: bool,
    bias: bool,
    mountain: bool,
    lakes: Option<(i64, i64)>,
) -> TerrainPreset {
    TerrainPreset {
        forest_blobs_mul: forest,
        hill_blobs_mul: hill,
        rock_count_mul: rock,
        hill_radius_boost: boost,
        river_mode: river,
        ford_count: None,
        lake_count: lakes,
        edge_rocks: edge,
        no_forest,
        desert_palette: desert,
        bias_safe_cols: bias,
        is_mountain: mountain,
    }
}

/// `presetForWorldTerrain(wt)` (`battle-terrain.ts:310-379`); `None` = `wt` nieobecne (`DEFAULT_PRESET`).
#[must_use]
pub fn preset_for_world_terrain(wt: Option<&WorldTerrainInput>) -> TerrainPreset {
    let Some(wt) = wt else {
        return DEFAULT_PRESET;
    };
    let baza = js_trim(&wt.baza).to_lowercase();
    let river_if = if wt.rzeka {
        RiverMode::Winding
    } else {
        RiverMode::None
    };
    let mut p = match baza.as_str() {
        "laka" => preset(
            1.1,
            0.3,
            0.9,
            0,
            RiverMode::Winding,
            false,
            false,
            false,
            false,
            false,
            Some((2, 4)),
        ),
        "rownina" => preset(
            0.5,
            0.0,
            0.6,
            0,
            river_if,
            false,
            false,
            false,
            false,
            false,
            Some((0, 2)),
        ),
        "wzgorza" => preset(
            0.7, 3.5, 1.8, 1, river_if, true, false, false, true, false, None,
        ),
        "gory" => preset(
            0.4, 5.0, 2.6, 2, river_if, true, false, false, true, true, None,
        ),
        "pustynia" => preset(
            0.0,
            1.3,
            1.4,
            0,
            RiverMode::None,
            false,
            true,
            true,
            true,
            false,
            None,
        ),
        "plytkie_morze" => preset(
            0.4,
            0.0,
            0.7,
            0,
            RiverMode::Coast,
            false,
            false,
            false,
            false,
            false,
            None,
        ),
        _ => DEFAULT_PRESET,
    };
    // Las overlay (`:357-363`).
    if wt.las && !p.no_forest {
        p.forest_blobs_mul = p.forest_blobs_mul.max(1.0) * 2.2;
        p.hill_blobs_mul = p.hill_blobs_mul.max(0.4);
    }
    // Rzeka overlay (`:368-374`).
    if wt.rzeka && !p.no_forest && baza != "plytkie_morze" {
        p.river_mode = RiverMode::Wide;
        p.ford_count = Some(p.ford_count.unwrap_or(3));
        p.lake_count = None;
    }
    p
}

// ------------------------------------------------------------------ mapa terenu

/// `MOVE_COST[kind]` (`battle-terrain.ts:138-147`); kod spoza tabeli = `undefined` -> `?? 1`.
#[must_use]
pub fn move_cost_of(kind: Option<u8>) -> f64 {
    match kind {
        Some(PLAINS) => 1.0,
        Some(FOREST | HILLS | ROCKS) => 2.0,
        Some(RIVER | WALL | GATE) => f64::INFINITY,
        Some(FORD) => 3.0,
        _ => 1.0,
    }
}

/// Nazwa terenu walki z kodu (`COMBAT_NAME`, `battle-terrain.ts:150-159` + `combatTerrainName` `:802-806`).
#[must_use]
pub fn combat_name_of(kind: Option<u8>, is_mountain: bool) -> &'static str {
    match kind {
        Some(HILLS) if is_mountain => "Gory",
        Some(FOREST) => "Las",
        Some(HILLS) => "Wzgorza",
        Some(RIVER | FORD) => "Rzeka",
        _ => "Plaskie (rownina/laka)",
    }
}

/// `BattleTerrainMap` (`battle-terrain.ts:49-70`, obiekt z `:785-807`): siatka kafli i preset gorski.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BattleTerrainMap {
    cols: i32,
    rows: i32,
    tiles: Vec<u8>,
    is_mountain: bool,
}

impl BattleTerrainMap {
    /// Mapa z gotowych kafli (wymaga `tiles.len() == cols * rows`).
    ///
    /// # Errors
    /// Zle wymiary albo dlugosc.
    pub fn from_tiles(
        cols: i32,
        rows: i32,
        tiles: Vec<u8>,
        is_mountain: bool,
    ) -> Result<Self, String> {
        let n = usize::try_from(i64::from(cols) * i64::from(rows))
            .map_err(|e| format!("wymiary {cols}x{rows}: {e}"))?;
        if cols <= 0 || rows <= 0 || tiles.len() != n {
            return Err(format!("mapa {cols}x{rows}: {} kafli", tiles.len()));
        }
        Ok(Self {
            cols,
            rows,
            tiles,
            is_mountain,
        })
    }

    /// `cols`.
    #[must_use]
    pub const fn cols(&self) -> i32 {
        self.cols
    }
    /// `rows`.
    #[must_use]
    pub const fn rows(&self) -> i32 {
        self.rows
    }
    /// `tiles` (wiersz po wierszu, indeks `row * cols + col`).
    #[must_use]
    pub fn tiles(&self) -> &[u8] {
        &self.tiles
    }
    /// `preset.isMountain`.
    #[must_use]
    pub const fn is_mountain(&self) -> bool {
        self.is_mountain
    }

    /// `tiles[i]` jak w `Uint8Array`: poza tablica `None` (`undefined`).
    #[must_use]
    pub fn get_index(&self, i: i64) -> Option<u8> {
        usize::try_from(i)
            .ok()
            .and_then(|i| self.tiles.get(i).copied())
    }

    /// `tiles[i] = v` jak w `Uint8Array`: zapis poza tablica pomijany.
    pub fn set_index(&mut self, i: i64, v: u8) {
        if let Some(t) = usize::try_from(i).ok().and_then(|i| self.tiles.get_mut(i)) {
            *t = v;
        }
    }

    /// `tiles[idx(c, r)]` z `idx = r * cols + c` (bez sprawdzania zakresu kolumny - jak w pinie).
    #[must_use]
    pub fn raw(&self, c: i64, r: i64) -> Option<u8> {
        self.get_index(r * i64::from(self.cols) + c)
    }

    /// Zapis `tiles[idx(c, r)] = v` (indeks liczony jak w pinie, poza tablica pomijany).
    pub fn set_raw(&mut self, c: i64, r: i64, v: u8) {
        self.set_index(r * i64::from(self.cols) + c, v);
    }

    /// Zapis kafla w zakresie siatki (np. wylom muru/bramy w pozniejszych tematach); poza siatka bez zmian.
    pub fn set_tile(&mut self, col: i32, row: i32, v: u8) {
        if col >= 0 && col < self.cols && row >= 0 && row < self.rows {
            self.set_raw(i64::from(col), i64::from(row), v);
        }
    }

    /// `at(c, r)` (`:780-783`) dla liczb JS: poza siatka `Plains`; indeks niecalkowity, NaN albo poza tablica =
    /// `undefined` (`None`).
    #[must_use]
    pub fn at_f(&self, c: f64, r: f64) -> Option<u8> {
        if c < 0.0 || c >= f64::from(self.cols) || r < 0.0 || r >= f64::from(self.rows) {
            return Some(PLAINS);
        }
        let i = r * f64::from(self.cols) + c;
        if i.is_nan() || i.fract() != 0.0 || i < 0.0 {
            return None;
        }
        #[allow(clippy::cast_possible_truncation)]
        self.get_index(i as i64)
    }

    /// `at(c, r)` dla calkowitych.
    #[must_use]
    pub fn at(&self, c: i32, r: i32) -> u8 {
        self.at_f(f64::from(c), f64::from(r)).unwrap_or(PLAINS)
    }

    /// `passable(c, r)` (`:790-793`): wszystko poza `River`/`Wall`/`Gate` (takze `undefined`).
    #[must_use]
    pub fn passable_f(&self, c: f64, r: f64) -> bool {
        !matches!(self.at_f(c, r), Some(RIVER | WALL | GATE))
    }

    /// `moveCost(c, r)` (`:794`).
    #[must_use]
    pub fn move_cost_f(&self, c: f64, r: f64) -> f64 {
        move_cost_of(self.at_f(c, r))
    }

    /// `combatTerrainName(c, r)` (`:802-806`).
    #[must_use]
    pub fn combat_terrain_name_f(&self, c: f64, r: f64) -> &'static str {
        combat_name_of(self.at_f(c, r), self.is_mountain)
    }

    /// `isFordTile(tm, c, r)` (`battleScene.ts:1897-1899`).
    #[must_use]
    pub fn is_ford_f(&self, c: f64, r: f64) -> bool {
        self.at_f(c, r) == Some(FORD)
    }
}

// ------------------------------------------------------------------ generator

/// `GenerateOpts` (`battle-terrain.ts:381-401`). Pola opcjonalne = `undefined` w pinie.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct GenerateOpts {
    /// `cols` (calkowite).
    pub cols: i32,
    /// `rows` (calkowite).
    pub rows: i32,
    /// `seed` (`?? 'battle'`).
    pub seed: Option<String>,
    /// `deployMargin` (`?? Math.round(cols * 0.18)`).
    pub deploy_margin: Option<i64>,
    /// `rowMargin` (`?? 0`).
    pub row_margin: Option<i64>,
    /// `safeCols` (pusta lista = `undefined`).
    pub safe_cols: Option<Vec<(i64, i64)>>,
    /// `preset` (`?? DEFAULT_PRESET`).
    pub preset: Option<TerrainPreset>,
}

/// Wynik generatora: mapa i uzyty preset.
#[derive(Debug, Clone, PartialEq)]
pub struct GeneratedTerrain {
    /// Mapa (`BattleTerrainMap`).
    pub map: BattleTerrainMap,
    /// Preset (`opts.preset ?? DEFAULT_PRESET`).
    pub preset: TerrainPreset,
}

struct Gen {
    map: BattleTerrainMap,
    rng: Mulberry32,
    cols: i64,
    rows: i64,
    deploy_margin: i64,
}

impl Gen {
    fn rng(&mut self) -> f64 {
        self.rng.next_f64()
    }
    fn in_deploy(&self, c: i64) -> bool {
        c < self.deploy_margin || c >= self.cols - self.deploy_margin
    }
    fn get(&self, c: i64, r: i64) -> Option<u8> {
        self.map.raw(c, r)
    }
    fn set(&mut self, c: i64, r: i64, v: u8) {
        self.map.set_raw(c, r, v);
    }
    /// `Math.floor(rng() * n)` dla calkowitego `n`.
    #[allow(clippy::cast_possible_truncation, clippy::cast_precision_loss)]
    fn floor_rng(&mut self, n: i64) -> i64 {
        (self.rng() * n as f64).floor() as i64
    }

    /// `stampBlob(cc, cr, radius, kind)` (`:640-656`).
    fn stamp_blob(&mut self, cc: i64, cr: i64, radius: i64, kind: u8) {
        let rad2 = radius * radius;
        for dr in -radius..=radius {
            for dc in -radius..=radius {
                let (c, r) = (cc + dc, cr + dr);
                if c < 0 || c >= self.cols || r < 0 || r >= self.rows {
                    continue;
                }
                if self.in_deploy(c) {
                    continue;
                }
                let d2 = dc * dc + dr * dr;
                if d2 > rad2 {
                    continue;
                }
                #[allow(clippy::cast_precision_loss)]
                if (d2 as f64) > (rad2 as f64) * 0.55 && self.rng() < 0.35 {
                    continue;
                }
                let t = self.get(c, r);
                if t == Some(RIVER) || t == Some(FORD) {
                    continue;
                }
                self.set(c, r, kind);
            }
        }
    }
}

#[allow(clippy::cast_possible_truncation)]
fn round_i(x: f64) -> i64 {
    js_round(x) as i64
}

/// `generateBattleTerrain(opts)` (`battle-terrain.ts:403-808`).
#[must_use]
#[allow(
    clippy::too_many_lines,
    clippy::cast_precision_loss,
    clippy::cast_possible_truncation,
    clippy::similar_names
)]
pub fn generate_battle_terrain(opts: &GenerateOpts) -> GeneratedTerrain {
    let cols = i64::from(opts.cols.max(4));
    let rows = i64::from(opts.rows.max(4));
    let seed = opts.seed.as_deref().unwrap_or("battle");
    let deploy_margin = opts
        .deploy_margin
        .unwrap_or_else(|| round_i(cols as f64 * 0.18))
        .max(0);
    let row_margin = opts.row_margin.unwrap_or(0).max(0);
    let preset = opts.preset.clone().unwrap_or(DEFAULT_PRESET);

    let rng = make_rng(&format!("{seed}:{cols}x{rows}"));
    #[allow(clippy::cast_sign_loss)]
    let map = BattleTerrainMap {
        cols: cols as i32,
        rows: rows as i32,
        tiles: vec![PLAINS; (cols * rows) as usize],
        is_mountain: preset.is_mountain,
    };
    let mut g = Gen {
        map,
        rng,
        cols,
        rows,
        deploy_margin,
    };

    let mid_col = cols / 2;
    let river_lo = deploy_margin + 2;
    let river_hi = cols - deploy_margin - 3;
    let interior_lo = deploy_margin;
    let interior_span = (cols - 2 * deploy_margin).max(1);
    let safe_cols: Option<&[(i64, i64)]> = opts.safe_cols.as_deref().filter(|s| !s.is_empty());

    match preset.river_mode {
        RiverMode::Winding => {
            let meander = round_i(cols as f64 * 0.10).max(2);
            let mut river_col = mid_col + (g.floor_rng(meander + 1) - meander / 2);
            let mut river_col_for_row = vec![0_i64; rows as usize];
            for r in 0..rows {
                let drift = g.floor_rng(3) - 1;
                river_col += drift;
                if river_col < river_lo {
                    river_col = river_lo;
                }
                if river_col > river_hi {
                    river_col = river_hi;
                }
                river_col_for_row[r as usize] = river_col;
                g.set(river_col, r, RIVER);
                // pin: `rng() < 0.45 && riverCol + 1 <= riverHi` (calkowite: `riverCol < riverHi`)
                if g.rng() < 0.45 && river_col < river_hi {
                    g.set(river_col + 1, r, RIVER);
                }
            }
            let trib_row_lo = (rows as f64 * 0.30).floor() as i64;
            let trib_row_hi = (rows as f64 * 0.70).floor() as i64;
            let trib_dir = if g.rng() < 0.5 { -1 } else { 1 };
            let mut trib_col = river_col_for_row[((trib_row_lo + trib_row_hi) / 2) as usize];
            let mut r = trib_row_lo;
            while r <= trib_row_hi && r < rows {
                trib_col += trib_dir * i64::from(g.rng() < 0.7);
                let lo = deploy_margin + 1;
                let hi = cols - deploy_margin - 2;
                if trib_col < lo {
                    trib_col = lo;
                }
                if trib_col > hi {
                    trib_col = hi;
                }
                if !g.in_deploy(trib_col) {
                    g.set(trib_col, r, RIVER);
                }
                r += 1;
            }
            let ford_count = preset
                .ford_count
                .unwrap_or_else(|| round_i(rows as f64 / 6.0).max(3));
            let mut ford_rows: Vec<i64> = Vec::new();
            let mut guard: i64 = 0;
            while (ford_rows.len() as i64) < ford_count && {
                let ok = guard < rows * 6;
                guard += 1;
                ok
            } {
                let rr = ((0.18 + g.rng() * 0.64) * rows as f64).floor() as i64;
                if rr > 0 && rr < rows - 1 && !ford_rows.contains(&rr) {
                    ford_rows.push(rr);
                }
            }
            let centre = (rows - 1) / 2;
            if !ford_rows.contains(&centre) {
                ford_rows.push(centre);
            }
            for &r in &ford_rows {
                for c in 0..cols {
                    if g.get(c, r) == Some(RIVER) {
                        g.set(c, r, FORD);
                    }
                }
            }
        }
        RiverMode::Wide => {
            let avail_span = (river_hi - river_lo + 1).max(6);
            let amplitude = round_i(avail_span as f64 * 0.25).max(4);
            let centre_base = river_lo + avail_span / 2;
            let play_rows = (rows - 2 * row_margin).max(8);
            let zakola = 2 + g.floor_rng(2);
            let wavelength = round_i((2 * play_rows) as f64 / zakola as f64).max(24);
            let phase = g.rng() * std::f64::consts::PI * 2.0;
            let mut prev_centre = centre_base;
            let (mut prev_c0, mut prev_c1) = (-1_i64, -1_i64);
            let pi = std::f64::consts::PI;
            for r in 0..rows {
                let rf = (r - row_margin) as f64;
                let sine = js_sin((rf / wavelength as f64) * pi * 2.0 + phase);
                let jr = r as i32;
                let c_jit = (tile_jitter(jr, 0, 811) - 0.5) * 2.0;
                let mut centre =
                    round_i(centre_base as f64 + sine * amplitude as f64 + c_jit * 1.2);
                if centre > prev_centre + 2 {
                    centre = prev_centre + 2;
                } else if centre < prev_centre - 2 {
                    centre = prev_centre - 2;
                }
                if centre < river_lo {
                    centre = river_lo;
                }
                if centre > river_hi {
                    centre = river_hi;
                }
                prev_centre = centre;
                let w_sine = js_sin((rf / (wavelength as f64 * 0.47)) * pi * 2.0 + phase * 1.7);
                let w_jit = (tile_jitter(jr, 1, 812) - 0.5) * 1.6;
                let width = round_i(4.5 + w_sine * 1.3 + w_jit).clamp(3, 6);
                let mut c0 = centre - (width >> 1);
                let mut c1 = c0 + width - 1;
                let j0 = tile_jitter(jr, 2, 813);
                let j1 = tile_jitter(jr, 3, 814);
                c0 += if j0 < 0.33 { -1 } else { i64::from(j0 > 0.66) };
                c1 += if j1 < 0.33 { -1 } else { i64::from(j1 > 0.66) };
                if c1 - c0 < 2 {
                    c0 = centre - 1;
                    c1 = centre + 1;
                }
                if c0 < river_lo {
                    c1 += river_lo - c0;
                    c0 = river_lo;
                }
                if c1 > river_hi {
                    c0 -= c1 - river_hi;
                    c1 = river_hi;
                }
                c0 = c0.max(river_lo);
                c1 = c1.min(river_hi);
                if prev_c0 >= 0 {
                    if c0 > prev_c1 {
                        c0 = prev_c1;
                    }
                    if c1 < prev_c0 {
                        c1 = prev_c0;
                    }
                }
                for c in c0..=c1 {
                    g.set(c, r, RIVER);
                }
                prev_c0 = c0;
                prev_c1 = c1;
            }
            let ford_count = match preset.ford_count {
                Some(n) => n,
                None => 2 + g.floor_rng(2),
            };
            let play_r0 = (rows - 2).min(row_margin + 2);
            let play_r1 = play_r0.max(rows - 3 - row_margin);
            let ford_band = (play_r1 - play_r0 + 1) as f64 / ford_count as f64;
            for k in 0..ford_count {
                let r0 = play_r0 + (ford_band * (k as f64 + 0.2 + g.rng() * 0.6)).floor() as i64;
                let (mut best_r, mut best_count) = (r0, f64::INFINITY);
                for dr in -5..=5 {
                    let rr = play_r0.max(play_r1.min(r0 + dr));
                    let mut cnt = 0_i64;
                    for c in 0..cols {
                        if g.get(c, rr) == Some(RIVER) {
                            cnt += 1;
                        }
                    }
                    if cnt > 0 && (cnt as f64) < best_count {
                        best_count = cnt as f64;
                        best_r = rr;
                    }
                }
                let depth = 2 + if g.rng() < 0.5 { 0 } else { 1 };
                for dr in 0..depth {
                    let r = play_r1.min(best_r + dr);
                    for c in 0..cols {
                        if g.get(c, r) == Some(RIVER) {
                            g.set(c, r, FORD);
                        }
                    }
                }
            }
        }
        RiverMode::Coast => {
            let row_lo = (rows - 1).min(row_margin);
            let row_hi = row_lo.max(rows - 1 - row_margin);
            let strip_rows = round_i((row_hi - row_lo + 1) as f64 * 0.14).max(3);
            let north = g.rng() < 0.5;
            let r0 = if north {
                row_lo
            } else {
                row_lo.max(row_hi - strip_rows + 1)
            };
            let r1 = if north {
                row_hi.min(row_lo + strip_rows - 1)
            } else {
                row_hi
            };
            for r in r0..=r1 {
                for c in 0..cols {
                    g.set(c, r, RIVER);
                }
            }
        }
        RiverMode::None => {}
    }

    // LAKES (`:603-637`).
    if let Some((lake_lo_n, lake_hi_n)) = preset.lake_count {
        let n_lakes = lake_lo_n + g.floor_rng(lake_hi_n - lake_lo_n + 1);
        let flank: Vec<(i64, i64)> = match safe_cols {
            Some(s) if s.len() >= 2 => vec![s[0], s[s.len() - 1]],
            _ => vec![(interior_lo, interior_lo + interior_span - 1)],
        };
        let lake_r0 = (rows - 3).min(row_margin + 2);
        let lake_r1 = lake_r0.max(rows - 3 - row_margin);
        for _ in 0..n_lakes {
            let cc = pick_from_ranges(&mut || g.rng.next_f64(), &flank);
            let cr = lake_r0 + g.floor_rng(lake_r1 - lake_r0 + 1);
            let rx = 1 + i64::from(g.rng() < 0.4);
            let ry = 1 + i64::from(g.rng() < 0.4);
            for dr in -ry..=ry {
                for dc in -rx..=rx {
                    let (c, r) = (cc + dc, cr + dr);
                    if c < 0 || c >= cols || r < 0 || r >= rows {
                        continue;
                    }
                    if g.in_deploy(c) {
                        continue;
                    }
                    let norm = (dc * dc) as f64 / ((rx * rx) as f64 + 0.3)
                        + (dr * dr) as f64 / ((ry * ry) as f64 + 0.3);
                    if norm > 1.0 {
                        continue;
                    }
                    if norm > 0.5 && tile_jitter(c as i32, r as i32, 815) < 0.35 {
                        continue;
                    }
                    g.set(c, r, RIVER);
                }
            }
        }
    }

    let rand_interior_col = |g: &mut Gen| interior_lo + g.floor_rng(interior_span);

    // 3) FOREST (`:661-673`).
    let field_area = (cols * rows) as f64;
    let forest_blobs = if preset.no_forest {
        0
    } else {
        round_i(round_i(field_area / 70.0).max(6) as f64 * preset.forest_blobs_mul)
    };
    for _ in 0..forest_blobs {
        let cr = 1 + g.floor_rng(rows - 2);
        let cc = rand_interior_col(&mut g);
        let radius = if g.rng() < 0.22 {
            3
        } else {
            1 + g.floor_rng(2)
        };
        g.stamp_blob(cc, cr, radius, FOREST);
    }

    // 4) HILLS (`:699-737`).
    let hill_blobs = round_i(round_i(field_area / 100.0).max(5) as f64 * preset.hill_blobs_mul);
    let boost = preset.hill_radius_boost;
    if preset.bias_safe_cols {
        let lone_count = round_i(hill_blobs as f64 * 0.25);
        let chain_budget = hill_blobs - lone_count;
        let chain_count = round_i(chain_budget as f64 / 3.0).clamp(1, 5);
        let mut placed = 0_i64;
        let mut ch = 0;
        while ch < chain_count && placed < chain_budget {
            let mut cc = rand_interior_col(&mut g);
            let mut cr = 1 + g.floor_rng(rows - 2);
            let col_drift = if g.rng() < 0.5 { -1 } else { 1 };
            let links = (2 + g.floor_rng(4)).min(chain_budget - placed);
            for _ in 0..links {
                let radius = (if g.rng() < 0.25 {
                    3
                } else {
                    1 + g.floor_rng(2)
                }) + boost;
                g.stamp_blob(cc, cr, radius, HILLS);
                placed += 1;
                cr += round_i(rows as f64 * 0.10) + g.floor_rng(3) - 1;
                let lean = col_drift * i64::from(g.rng() < 0.6);
                cc += lean + (g.floor_rng(3) - 1);
                cc = interior_lo.max((interior_lo + interior_span - 1).min(cc));
                cr = 1.max((rows - 2).min(cr));
            }
            ch += 1;
        }
        for _ in placed..hill_blobs {
            let cr = 1 + g.floor_rng(rows - 2);
            let cc = rand_interior_col(&mut g);
            g.stamp_blob(cc, cr, 1 + boost, HILLS);
        }
    } else {
        for _ in 0..hill_blobs {
            let cr = 1 + g.floor_rng(rows - 2);
            let cc = rand_interior_col(&mut g);
            let radius = (if g.rng() < 0.20 {
                3
            } else {
                1 + g.floor_rng(2)
            }) + boost;
            g.stamp_blob(cc, cr, radius, HILLS);
        }
    }

    // 5) ROCKS (`:740-748`).
    let rock_count = round_i(round_i(field_area / 50.0).max(8) as f64 * preset.rock_count_mul);
    for _ in 0..rock_count {
        let c = rand_interior_col(&mut g);
        let r = g.floor_rng(rows);
        if c < 0 || c >= cols || r < 0 || r >= rows {
            continue;
        }
        if g.in_deploy(c) {
            continue;
        }
        if g.get(c, r) == Some(PLAINS) {
            g.set(c, r, ROCKS);
        }
    }

    // 5b) EDGE ROCKS (`:758-788`).
    if preset.edge_rocks {
        match safe_cols {
            Some(s) if s.len() >= 2 => {
                let flank = [s[0], s[s.len() - 1]];
                let edge_rock_count = round_i(rock_count as f64 * 2.2);
                for _ in 0..edge_rock_count {
                    let c = pick_from_ranges(&mut || g.rng.next_f64(), &flank);
                    let r = g.floor_rng(rows);
                    if c < 0 || c >= cols || r < 0 || r >= rows {
                        continue;
                    }
                    if g.in_deploy(c) {
                        continue;
                    }
                    if g.get(c, r) == Some(PLAINS) {
                        g.set(c, r, ROCKS);
                    }
                }
            }
            _ => {
                let edge_col_band = round_i(interior_span as f64 * 0.16).max(2);
                let edge_rock_count = round_i(rock_count as f64 * 0.6);
                for _ in 0..edge_rock_count {
                    let near_left = g.rng() < 0.5;
                    let c = if near_left {
                        interior_lo + g.floor_rng(edge_col_band)
                    } else {
                        (cols - deploy_margin) - 1 - g.floor_rng(edge_col_band)
                    };
                    let near_top = g.rng() < 0.5;
                    let row_band = round_i(rows as f64 * 0.16).max(2);
                    let r = if near_top {
                        g.floor_rng(row_band)
                    } else {
                        rows - 1 - g.floor_rng(row_band)
                    };
                    if c < 0 || c >= cols || r < 0 || r >= rows {
                        continue;
                    }
                    if g.in_deploy(c) {
                        continue;
                    }
                    if g.get(c, r) == Some(PLAINS) {
                        g.set(c, r, ROCKS);
                    }
                }
            }
        }
    }

    GeneratedTerrain { map: g.map, preset }
}
