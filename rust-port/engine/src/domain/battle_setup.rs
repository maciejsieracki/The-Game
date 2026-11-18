//! P6 BATTLE-SETUP T5a (dispatch R-RUSTPORT-P6-BATTLE-SETUP-Q1, runda 1, Operator): ustawienie pola bitwy w silniku
//! (teren + mur), decyzja D-WIR-4 / D-BS-1: logika pola nalezy do silnika, renderer zostaje konsumentem.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * stale pola (`:661-672`, `:721-767`), `inPlayable` (`:674-676`), `battleClearSideCap` (`:742-744`),
//!   `deployClearRanksFor` / `battleClearRanks` (`:793-803`), `battleSafeCols` (`:822-836`);
//! * fragment konstruktora (`:2776-2817`): preset z heksa swiata (`presetForWorldTerrain`, bez `?bt=` - w produkcji
//!   `debugWorldTerrainOverride()` zwraca `undefined`), `presetActive`, `clearSideCap`, `generateBattleTerrain`
//!   (ziarno `'bf:' + teren`), `_carveBattleBox` (`:3917-3998`), `_fencePlayableZone` (`:4004-4013`) i przy
//!   oblezeniu `_carveWallTiles` (`:4026-4065`);
//! * rzedy wiezyczek z `_placeSiegeWall` -> `_placeSiegeTowers` (`:4075-4191`): `towerMaterialFor(fortKind)` i
//!   `towerRows` (wolane w konstruktorze `:3478-3481`); sila i zasieg strzalu wiez sa poza T5a (K3, `city_towers`).
//!
//! Teren ruchu: [`FieldMoveTerrain`] = produkcyjny [`MoveTerrain`] na wygenerowanej siatce (`terrainMap.passable`,
//! `moveCost`, `isFordTile`, `cavalryTerrainMultiplier(combatTerrainName)` z `combat.ts:756-772` na danych
//! `terrain-combat.json`).
//!
//! RNG: ustawienie pola NIE uzywa `Math.random` (wykonanie tekstu pinu w generatorze wektorow z zablokowanym
//! `Math.random`); jedyny RNG to deterministyczny `makeRng('bf:' + teren + ':68x156')`.

use super::battle_setup_terrain::{
    bterrain::{FORD, GATE, PLAINS, RIVER, WALL},
    generate_battle_terrain, is_js_whitespace, preset_for_world_terrain, BattleTerrainMap,
    GenerateOpts, TerrainPreset, WorldTerrainInput,
};
use super::city_towers::{tower_material_for, tower_rows, FortificationKind, TowerSlotInput};
use super::siege_city_fortification::{city_fortification_kind, CityFortificationKind};
use super::siege_tactics_inputs_terrain::norm_terrain;
use super::siege_tactics_move_effects::MoveTerrain;

/// `BF_COLS` (`:661`).
pub const BF_COLS: i64 = 68;
/// `BF_ROWS` (`:662`).
pub const BF_ROWS: i64 = 156;
/// `PLAYABLE_COLS = Math.round(BF_COLS * Math.SQRT1_2)` (`:665`) = 48.
pub const PLAYABLE_COLS: i64 = 48;
/// `PLAYABLE_ROWS = Math.round(BF_ROWS * Math.SQRT1_2)` (`:666`) = 110.
pub const PLAYABLE_ROWS: i64 = 110;
/// `PLAY_COL0` (`:667`).
pub const PLAY_COL0: i64 = (BF_COLS - PLAYABLE_COLS) / 2;
/// `PLAY_ROW0` (`:668`).
pub const PLAY_ROW0: i64 = (BF_ROWS - PLAYABLE_ROWS) / 2;
/// `PLAY_COL1` (`:669`).
pub const PLAY_COL1: i64 = PLAY_COL0 + PLAYABLE_COLS - 1;
/// `PLAY_ROW1` (`:670`).
pub const PLAY_ROW1: i64 = PLAY_ROW0 + PLAYABLE_ROWS - 1;
/// `PLAY_MID_COL` (`:671`).
pub const PLAY_MID_COL: i64 = PLAY_COL0 + (PLAYABLE_COLS - 1) / 2;
/// `PLAY_MID_ROW` (`:672`).
pub const PLAY_MID_ROW: i64 = PLAY_ROW0 + (PLAYABLE_ROWS - 1) / 2;
/// `MAX_PER_SIDE` (`:721`).
pub const MAX_PER_SIDE: f64 = 500.0;
/// `RANK_WIDTH` (`:728`).
pub const RANK_WIDTH: f64 = 20.0;
/// `CLEAR_DEPTH_BASE_CAP` (`:733`).
pub const CLEAR_DEPTH_BASE_CAP: f64 = 120.0;
/// `DEPLOY_MARGIN` (`:749`).
pub const DEPLOY_MARGIN: i64 = 4;
/// `FRONT_GAP` (`:763`).
pub const FRONT_GAP: i64 = 5;
/// `ATK_FRONT_COL` (`:764`).
pub const ATK_FRONT_COL: i64 = PLAY_COL0 + (PLAYABLE_COLS - FRONT_GAP) / 2;
/// `DEF_FRONT_COL` (`:765`).
pub const DEF_FRONT_COL: i64 = ATK_FRONT_COL + FRONT_GAP;
/// `ATK_COL_STEP` (`:766`).
pub const ATK_COL_STEP: i64 = -1;
/// `DEF_COL_STEP` (`:767`).
pub const DEF_COL_STEP: i64 = 1;
/// `BattleScene.WALL_TILE_HP` (`:2507`).
pub const WALL_TILE_HP: f64 = 640.0;
/// `gateHp = 400; // GATE_MAX_HP` (`_carveWallTiles`, `:4044`).
pub const GATE_MAX_HP: f64 = 400.0;

/// `inPlayable(col, row)` (`:674-676`).
#[must_use]
pub const fn in_playable(col: i64, row: i64) -> bool {
    col >= PLAY_COL0 && col <= PLAY_COL1 && row >= PLAY_ROW0 && row <= PLAY_ROW1
}

/// `Math.max(a, b)` z propagacja NaN (znak zera bez znaczenia dla wynikow calkowitych).
fn js_max2(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}

/// `Math.min(a, b)` z propagacja NaN.
fn js_min2(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.min(b)
    }
}

/// `battleClearSideCap(attackerCount, defenderCount)` (`:742-744`):
/// `Math.min(MAX_PER_SIDE, Math.max(CLEAR_DEPTH_BASE_CAP, a, b))`. NaN w ktorejkolwiek licznosci daje NaN (jak JS),
/// nieskonczonosc daje 500.
#[must_use]
pub fn battle_clear_side_cap(attacker_count: f64, defender_count: f64) -> f64 {
    js_min2(
        MAX_PER_SIDE,
        js_max2(
            js_max2(CLEAR_DEPTH_BASE_CAP, attacker_count),
            defender_count,
        ),
    )
}

/// `deployClearRanksFor(presetActive, sideCap)` (`:793-798`).
#[must_use]
pub fn deploy_clear_ranks_for(preset_active: bool, side_cap: f64) -> f64 {
    let max_ranks = (side_cap / RANK_WIDTH).ceil();
    if preset_active {
        js_max2(max_ranks + 4.0, (side_cap / 12.0).ceil() + 3.0)
    } else {
        js_max2(max_ranks + 12.0, (side_cap / 12.0).ceil() + 8.0)
    }
}

/// `battleClearRanks(presetActive, sideCap)` (`:801-803`).
#[must_use]
pub fn battle_clear_ranks(preset_active: bool, side_cap: f64) -> f64 {
    deploy_clear_ranks_for(preset_active, side_cap)
}

/// `battleSafeCols(presetActive, sideCap)` (`:822-836`) w liczbach JS (zakresy z NaN odpadaja w filtrze `hi >= lo`).
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub fn battle_safe_cols_f(preset_active: bool, side_cap: f64) -> Vec<(f64, f64)> {
    let ranks = deploy_clear_ranks_for(preset_active, side_cap);
    let (atk, def) = (ATK_FRONT_COL as f64, DEF_FRONT_COL as f64);
    let atk_end = atk + (ranks - 1.0) * ATK_COL_STEP as f64;
    let def_end = def + (ranks - 1.0) * DEF_COL_STEP as f64;
    let (atk_lo, atk_hi) = (js_min2(atk, atk_end), js_max2(atk, atk_end));
    let (def_lo, def_hi) = (js_min2(def, def_end), js_max2(def, def_end));
    [
        (PLAY_COL0 as f64, atk_lo - 1.0),
        (atk_hi + 1.0, def_lo - 1.0),
        (def_hi + 1.0, PLAY_COL1 as f64),
    ]
    .into_iter()
    .filter(|&(lo, hi)| hi >= lo)
    .collect()
}

/// [`battle_safe_cols_f`] jako kolumny calkowite (dla licznosci z [`battle_clear_side_cap`] zawsze skonczone).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn battle_safe_cols(preset_active: bool, side_cap: f64) -> Vec<(i64, i64)> {
    battle_safe_cols_f(preset_active, side_cap)
        .into_iter()
        .map(|(lo, hi)| (lo as i64, hi as i64))
        .collect()
}

/// Kolumny pasm rozstawienia (`rankCols` z `_carveBattleBox`, `:3933-3940`) w kolejnosci wstawiania do `Set`.
///
/// Petla pinu `for (k = 0; k < DEPLOY_CLEAR_RANKS; k++)` dla `k >= BF_COLS` nic juz nie dodaje (obie kolumny poza
/// polem), wiec konczymy ja na `BF_COLS`: wynik identyczny dla kazdej skonczonej glebokosci, a NaN daje zero
/// iteracji jak w pinie.
#[must_use]
#[allow(clippy::cast_precision_loss)]
pub fn deploy_rank_cols(preset_active: bool, side_cap: f64) -> Vec<i64> {
    let ranks = deploy_clear_ranks_for(preset_active, side_cap);
    let mut cols: Vec<i64> = Vec::new();
    let mut k: i64 = 0;
    while (k as f64) < ranks && k < BF_COLS {
        let ac = ATK_FRONT_COL + k * ATK_COL_STEP;
        let dc = DEF_FRONT_COL + k * DEF_COL_STEP;
        if (0..BF_COLS).contains(&ac) && !cols.contains(&ac) {
            cols.push(ac);
        }
        if (0..BF_COLS).contains(&dc) && !cols.contains(&dc) {
            cols.push(dc);
        }
        k += 1;
    }
    cols
}

fn idx(c: i64, r: i64) -> i64 {
    r * BF_COLS + c
}

/// `_carveBattleBox(presetActive, sideCap)` (`:3917-3998`): pasma rozstawienia, korytarz starcia, straz lacznosci.
pub fn carve_battle_box(map: &mut BattleTerrainMap, preset_active: bool, side_cap: f64) {
    let (r_lo, r_hi) = (PLAY_ROW0, PLAY_ROW1);
    // 1) pasma rozstawienia
    let rank_cols = deploy_rank_cols(preset_active, side_cap);
    for r in r_lo..=r_hi {
        for &c in &rank_cols {
            let i = idx(c, r);
            let t = map.get_index(i);
            if preset_active && (t == Some(RIVER) || t == Some(FORD)) {
                map.set_index(i, FORD);
            } else {
                map.set_index(i, PLAINS);
            }
        }
    }
    // 2) korytarz starcia: rzeka -> brod
    let mid_row = PLAY_MID_ROW;
    let (gap_lo, gap_hi) = (
        ATK_FRONT_COL.min(DEF_FRONT_COL),
        ATK_FRONT_COL.max(DEF_FRONT_COL),
    );
    for r in r_lo..=r_hi {
        for c in gap_lo..=gap_hi {
            if map.get_index(idx(c, r)) == Some(RIVER) {
                map.set_index(idx(c, r), FORD);
            }
        }
    }
    // 3) straz lacznosci (DFS po kaflach != River, kolejnosc DIRS4 = N, E, S, W)
    if !reachable(map, (ATK_FRONT_COL, mid_row), (DEF_FRONT_COL, mid_row)) {
        for c in PLAY_COL0..=PLAY_COL1 {
            if map.get_index(idx(c, mid_row)) == Some(RIVER) {
                map.set_index(idx(c, mid_row), FORD);
            }
        }
    }
}

const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

fn in_field(c: i64, r: i64) -> bool {
    (0..BF_COLS).contains(&c) && (0..BF_ROWS).contains(&r)
}

/// `reachable()` z `_carveBattleBox` (`:3966-3986`).
#[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
fn reachable(map: &BattleTerrainMap, start: (i64, i64), goal: (i64, i64)) -> bool {
    if !in_field(start.0, start.1) || !in_field(goal.0, goal.1) {
        return true;
    }
    let mut seen = vec![false; (BF_COLS * BF_ROWS) as usize];
    let mut stack = vec![start];
    seen[idx(start.0, start.1) as usize] = true;
    while let Some((c, r)) = stack.pop() {
        if (c, r) == goal {
            return true;
        }
        for (dc, dr) in DIRS4 {
            let (nc, nr) = (c + dc, r + dr);
            if !in_field(nc, nr) || seen[idx(nc, nr) as usize] {
                continue;
            }
            // `passableKind(tiles[i] as number)`: odczyt spoza tablicy (`undefined`) nie jest rzeka.
            if map.get_index(idx(nc, nr)) == Some(RIVER) {
                continue;
            }
            seen[idx(nc, nr) as usize] = true;
            stack.push((nc, nr));
        }
    }
    false
}

/// `_fencePlayableZone()` (`:4004-4013`): poza strefa gry wszystko `River`.
pub fn fence_playable_zone(map: &mut BattleTerrainMap) {
    for c in 0..BF_COLS {
        for r in 0..BF_ROWS {
            if !in_playable(c, r) {
                map.set_index(idx(c, r), RIVER);
            }
        }
    }
}

/// Pola oblezenia ustawiane przez `_carveWallTiles` (`:4026-4065`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeLayout {
    /// `siegeWallCol`.
    pub wall_col: i64,
    /// `siegeWallRowLo`.
    pub row_lo: i64,
    /// `siegeWallRowHi`.
    pub row_hi: i64,
    /// `siegeGateCol`.
    pub gate_col: i64,
    /// `siegeGateRow`.
    pub gate_row: i64,
    /// `gateHp`.
    pub gate_hp: f64,
    /// `gateOpen`.
    pub gate_open: bool,
    /// `wallTileHp` (`Map<row, hp>` w kolejnosci wstawiania).
    pub wall_tile_hp: Vec<(i64, f64)>,
    /// `siegeWallTilesInit = wallTileHp.size`.
    pub wall_tiles_init: usize,
}

/// `_carveWallTiles()` (`:4026-4065`): kolumna muru (`Wall`) i dwa rzedy bramy (`Gate`). Indeksuje `BF_COLS`
/// niezaleznie od szerokosci mapy (jak pin); zapis poza tablica pomijany.
pub fn carve_wall_tiles(map: &mut BattleTerrainMap) -> SiegeLayout {
    let wall_col = (BF_COLS - 2).min(DEF_FRONT_COL + 4);
    let (r_lo, r_hi) = (0, BF_ROWS - 1);
    let mid_row = PLAY_MID_ROW;
    let (gate_lo, gate_hi) = (mid_row - 1, mid_row);
    let mut wall_tile_hp = Vec::new();
    for r in r_lo..=r_hi {
        if r >= gate_lo && r <= gate_hi {
            continue;
        }
        wall_tile_hp.push((r, WALL_TILE_HP));
    }
    let wall_tiles_init = wall_tile_hp.len();
    for r in r_lo..=r_hi {
        let is_gate = r >= gate_lo && r <= gate_hi;
        if (0..BF_COLS).contains(&wall_col) {
            map.set_index(idx(wall_col, r), if is_gate { GATE } else { WALL });
        }
    }
    SiegeLayout {
        wall_col,
        row_lo: r_lo,
        row_hi: r_hi,
        gate_col: wall_col,
        gate_row: mid_row,
        gate_hp: GATE_MAX_HP,
        gate_open: false,
        wall_tile_hp,
        wall_tiles_init,
    }
}

/// Oblezenie w opcjach bitwy (`opts.siege`): budynki miasta i odstep wiezyczek z danych.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct SiegeFieldInput {
    /// `opts.siege.builtBuildingIds`.
    pub built_building_ids: Vec<String>,
    /// `miastoParamsData.wieze_strzeleckie_odstep_kafli.wartosc` (`None` = brak klucza -> `DEFAULT_TOWER_SPACING`).
    pub tower_spacing: Option<i64>,
}

/// Wejscie ustawienia pola (pola `BattleOpts` czytane przez konstruktor w zakresie T5a).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct BattleFieldInput {
    /// `opts.teren` (ziarno `'bf:' + teren`).
    pub teren: String,
    /// `opts.worldTerrain` (`None` = pole bez presetu, `presetActive = false`).
    pub world_terrain: Option<WorldTerrainInput>,
    /// `opts.attacker.length` (liczba JS; NaN/Inf dozwolone).
    pub attacker_count: f64,
    /// `opts.defender.length`.
    pub defender_count: f64,
    /// `opts.siege`.
    pub siege: Option<SiegeFieldInput>,
}

/// Mur oblezenia z wiezyczkami.
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeField {
    /// Pola z `_carveWallTiles`.
    pub layout: SiegeLayout,
    /// `fortKind = cityFortificationKind(builtBuildingIds)`.
    pub fort_kind: CityFortificationKind,
    /// Rzedy wiezyczek (`siegeTowers[].row`), puste bez obwarowania.
    pub tower_rows: Vec<i64>,
}

/// Wynik ustawienia pola (T5a: teren + mur).
#[derive(Debug, Clone, PartialEq)]
pub struct BattleField {
    /// `this.terrainMap` po wszystkich wycieciach.
    pub map: BattleTerrainMap,
    /// Uzyty preset.
    pub preset: TerrainPreset,
    /// `presetActive = worldTerrain != null`.
    pub preset_active: bool,
    /// `clearSideCap`.
    pub clear_side_cap: f64,
    /// `battleSafeCols(presetActive, clearSideCap)` przekazane generatorowi.
    pub safe_cols: Vec<(i64, i64)>,
    /// `this._desertPalette`.
    pub desert_palette: bool,
    /// Mur (tylko przy `opts.siege`).
    pub siege: Option<SiegeField>,
}

/// Opcje generatora dla danego wejscia (`:2795-2806`).
#[must_use]
#[allow(clippy::cast_possible_truncation)]
pub fn battle_generate_opts(
    input: &BattleFieldInput,
) -> (GenerateOpts, bool, f64, Vec<(i64, i64)>) {
    let preset = preset_for_world_terrain(input.world_terrain.as_ref());
    let preset_active = input.world_terrain.is_some();
    let side_cap = battle_clear_side_cap(input.attacker_count, input.defender_count);
    let safe_cols = battle_safe_cols(preset_active, side_cap);
    let opts = GenerateOpts {
        cols: BF_COLS as i32,
        rows: BF_ROWS as i32,
        seed: Some(format!("bf:{}", input.teren)),
        deploy_margin: Some(DEPLOY_MARGIN),
        row_margin: Some(PLAY_ROW0),
        safe_cols: Some(safe_cols.clone()),
        preset: Some(preset),
    };
    (opts, preset_active, side_cap, safe_cols)
}

/// Pelne ustawienie pola jak konstruktor `BattleScene` (`:2776-2817` + wiezyczki `:3478-3481`).
#[must_use]
pub fn setup_battle_field(input: &BattleFieldInput) -> BattleField {
    let (opts, preset_active, side_cap, safe_cols) = battle_generate_opts(input);
    let generated = generate_battle_terrain(&opts);
    let mut map = generated.map;
    carve_battle_box(&mut map, preset_active, side_cap);
    fence_playable_zone(&mut map);
    let siege = input.siege.as_ref().map(|s| {
        let layout = carve_wall_tiles(&mut map);
        let fort_kind = city_fortification_kind(Some(s.built_building_ids.as_slice()));
        let material = tower_material_for(match fort_kind {
            CityFortificationKind::Mur => FortificationKind::Mur,
            CityFortificationKind::Palisada => FortificationKind::Palisada,
            CityFortificationKind::None => FortificationKind::Inny,
        });
        let tower_rows = if material.is_some() {
            tower_rows(&TowerSlotInput {
                row_lo: layout.row_lo,
                row_hi: layout.row_hi,
                gate_row_lo: layout.gate_row - 1,
                gate_row_hi: layout.gate_row,
                spacing: s.tower_spacing,
            })
        } else {
            Vec::new()
        };
        SiegeField {
            layout,
            fort_kind,
            tower_rows,
        }
    });
    BattleField {
        map,
        desert_palette: generated.preset.desert_palette,
        preset: generated.preset,
        preset_active,
        clear_side_cap: side_cap,
        safe_cols,
        siege,
    }
}

// ------------------------------------------------------------------ teren ruchu

/// Wiersz `terrain-combat.json` czytany przez `cavalryTerrainMultiplier` (`Teren`, `Kawaleria/Rydwan`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CavalryTerrainRow {
    /// `Teren`.
    pub teren: String,
    /// `Kawaleria/Rydwan` (`undefined` = `None`).
    pub kawaleria: Option<String>,
}

/// Wiersze z `data/terrain-combat.json` (ta sama tresc co `gra/data/terrain-combat.json` pinu; sprawdza test).
///
/// # Errors
/// Zly JSON albo brak pola `Teren`.
pub fn terrain_combat_cavalry_rows(json: &str) -> Result<Vec<CavalryTerrainRow>, String> {
    let v: serde_json::Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
    let arr = v.as_array().ok_or("terrain-combat: oczekiwano tablicy")?;
    arr.iter()
        .map(|row| {
            let teren = row
                .get("Teren")
                .and_then(serde_json::Value::as_str)
                .ok_or("terrain-combat: brak pola Teren")?
                .to_owned();
            let kawaleria = row
                .get("Kawaleria/Rydwan")
                .and_then(serde_json::Value::as_str)
                .map(str::to_owned);
            Ok(CavalryTerrainRow { teren, kawaleria })
        })
        .collect()
}

/// Dopasowanie `/[x×]\s*(\d+(?:[.,]\d+)?)/i` (pierwsze od lewej); zwraca przechwycona liczbe.
fn match_mult(raw: &str) -> Option<String> {
    let cs: Vec<char> = raw.chars().collect();
    for start in 0..cs.len() {
        if !matches!(cs[start], 'x' | 'X' | '\u{00D7}') {
            continue;
        }
        let mut i = start + 1;
        while i < cs.len() && is_js_whitespace(cs[i]) {
            i += 1;
        }
        let d0 = i;
        while i < cs.len() && cs[i].is_ascii_digit() {
            i += 1;
        }
        if i == d0 {
            continue;
        }
        if i + 1 < cs.len() && matches!(cs[i], '.' | ',') && cs[i + 1].is_ascii_digit() {
            i += 1;
            while i < cs.len() && cs[i].is_ascii_digit() {
                i += 1;
            }
        }
        return Some(cs[d0..i].iter().collect());
    }
    None
}

/// `cavalryTerrainMultiplier(terrain, terrainData)` (`combat.ts:756-772`, z `findTerrainEntry` `:706-710`).
#[must_use]
pub fn cavalry_terrain_multiplier(terrain: &str, data: &[CavalryTerrainRow]) -> f64 {
    if terrain.is_empty() || data.is_empty() {
        return 1.0;
    }
    let want = norm_terrain(terrain);
    let Some(entry) = data.iter().find(|t| norm_terrain(&t.teren) == want) else {
        return 1.0;
    };
    let raw = match entry.kawaleria.as_deref() {
        Some(r) if !r.is_empty() => r,
        _ => return 1.0,
    };
    if norm_terrain(raw).contains("niedostepne") {
        return f64::INFINITY;
    }
    if let Some(m) = match_mult(raw) {
        if let Ok(n) = m.replacen(',', ".", 1).parse::<f64>() {
            if n.is_finite() && n > 0.0 {
                return n;
            }
        }
    }
    1.0
}

/// Produkcyjny teren ruchu na wygenerowanej siatce (wymaganie #113): [`MoveTerrain`] dla petli bitwy.
#[derive(Debug, Clone, PartialEq)]
pub struct FieldMoveTerrain {
    /// Siatka pola (zmienia sie przy wylomie: `set_tile`).
    pub map: BattleTerrainMap,
    /// Wiersze terenu walki (mnoznik kawalerii).
    pub cavalry_rows: Vec<CavalryTerrainRow>,
}

impl FieldMoveTerrain {
    /// Teren ruchu z siatki i danych `terrain-combat.json` silnika.
    ///
    /// # Errors
    /// Bledne dane terenu.
    pub fn from_engine_data(map: BattleTerrainMap) -> Result<Self, String> {
        Ok(Self {
            map,
            cavalry_rows: terrain_combat_cavalry_rows(
                crate::data::units_combat::TERRAIN_COMBAT_JSON,
            )?,
        })
    }
}

impl MoveTerrain for FieldMoveTerrain {
    fn passable(&self, col: f64, row: f64) -> bool {
        self.map.passable_f(col, row)
    }
    fn move_cost(&self, col: f64, row: f64) -> f64 {
        self.map.move_cost_f(col, row)
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.map.is_ford_f(col, row)
    }
    fn cavalry_multiplier(&self, col: f64, row: f64) -> f64 {
        cavalry_terrain_multiplier(self.map.combat_terrain_name_f(col, row), &self.cavalry_rows)
    }
}
