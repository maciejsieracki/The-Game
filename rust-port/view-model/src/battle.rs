//! Battle start (contract §3.8 `BattleViewDto`, "Start").
//!
//! The contract makes the setup the renderer's `BattleUnitsOpts`
//! (`renderer/src/battle/units.rs:842-852`) with `TerrainGrid`
//! (`battle/field.rs:353-360`), `BattleSceneOpts` (`field.rs:1978-1989`),
//! `UnitSpawn` (`units.rs:510-541`) and `FortDto` (`units.rs:726-733`). This
//! crate must not depend on the renderer (D-DTO-1 = A), so the same fields are
//! mirrored here as plain data; the adapter (P4-1G) builds the renderer
//! structs from them. The battle event stream ("Przebieg") is decision D-DTO-7,
//! not taken yet — no type for it here.
//!
//! Web literals cite the pin `07d2fbd72` (`gra/src/…`).

use crate::ids::UnitId;
use serde::{Deserialize, Serialize};

/// Battle side `'atk' | 'def'` (`battle/battleScene.ts:522`, `:1074`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BattleSide {
    /// `'atk'`.
    Atk,
    /// `'def'`.
    Def,
}

/// City fortification of the battle, `CityFortificationKind`
/// (`game/city-fortification.ts:26`); the battle reads it as `fortKind`
/// (`battle/battleScene.ts:2440`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum FortKind {
    /// `'none'`.
    None,
    /// `'palisada'`.
    Palisada,
    /// `'mur'`.
    Mur,
}

/// Tower material `'drewno' | 'kamien'` (`battle/siegeWall.ts:1105`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TowerMaterial {
    /// `'drewno'`.
    Drewno,
    /// `'kamien'`.
    Kamien,
}

/// Battle terrain grid (renderer `TerrainGrid`): `tiles.len() == cols * rows`.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleGridDto {
    /// `cols`.
    pub cols: i32,
    /// `rows`.
    pub rows: i32,
    /// `tiles` (`Uint8Array`).
    pub tiles: Vec<u8>,
}

/// Wall/tower setup (renderer `FortDto`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleFortDto {
    /// `this.fortKind`.
    pub kind: FortKind,
    /// `towerMaterialFor(fortKind)` (`None` = `null`).
    pub tower_material: Option<TowerMaterial>,
    /// `towerRows(…)`.
    pub tower_rows: Vec<i32>,
}

/// One unit at battle start (renderer `UnitSpawn`).
///
/// `ammoLeft`/`ammoMax`: the web uses `Infinity` for unlimited ammunition
/// (`ammoCount`, `battle/battleScene.ts:1434-1448`), which JSON cannot carry
/// (`JSON.stringify(Infinity)` is `null`). The DTO says `None` = unlimited;
/// the adapter maps `None` back to `f64::INFINITY`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleUnitSpawnDto {
    /// `bu.id` (adapter: `Display` → `String`).
    pub id: UnitId,
    /// Side.
    pub side: BattleSide,
    /// `bu.kategoria` (model routing; same `category_of` as the map, D-MOD-9).
    pub category: String,
    /// `String(bu.stats?.Jednostka ?? bu.nazwa)`.
    pub model_name: String,
    /// `bu.ownerColor`, `0xRRGGBB`.
    pub owner_color: u32,
    /// Column `q`.
    pub col: i32,
    /// Row `r`.
    pub row: i32,
    /// `facing` (`Dir`).
    pub facing: i32,
    /// `onWallWalkway`.
    pub on_wall_walkway: bool,
    /// `bu.hp`.
    pub hp: f64,
    /// `bu.maxHp`.
    pub max_hp: f64,
    /// `morale` at spawn.
    pub morale: f64,
    /// `moraleMax`.
    pub morale_max: f64,
    /// `ammoLeft` at spawn; `None` = unlimited (`Infinity`).
    pub ammo_left: Option<f64>,
    /// `ammoMax`; `None` = unlimited (`Infinity`).
    pub ammo_max: Option<f64>,
}

/// Battle start (renderer `BattleUnitsOpts` + `BattleSceneOpts` + `FortDto`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleSetupDto {
    /// Terrain grid after `generateBattleTerrain` + carving.
    pub grid: BattleGridDto,
    /// `terrainPreset.desertPalette`.
    pub desert_palette: bool,
    /// `opts.siege != null`.
    pub siege: bool,
    /// `opts.deploy === true` with `deployPlayerSide`; `None` = no deploy.
    pub deploy: Option<BattleSide>,
    /// `siege_wall_civ(civ, defCiv)`.
    pub siege_civ: String,
    /// `_playerControlSide()`.
    pub player_side: BattleSide,
    /// Units in the web spawn order.
    pub units: Vec<BattleUnitSpawnDto>,
    /// Wall/tower setup.
    pub fort: BattleFortDto,
}

/// Battle view (contract §3.8).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleViewDto {
    /// Start of the battle scene.
    pub setup: BattleSetupDto,
}

// ---------------------------------------------------------------------------
// Battle outcome (P4-1I1, `R-RUSTPORT-P4-1I1-BATTLE-OUTCOME`).
//
// Mirror of the web `BattleResult` (`battle/battleScene.ts:588-604`) as built
// in `onFinish` (`:10720-10729`), plus the per-side end statistics of the end
// screen (`_sideEndStats`, `:10257-10269`). Field list: recon
// `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2a / §2a.1. The type
// stands alone (not a field of `BattleViewDto`): the outcome is delivered once
// at the end of the battle, like the web `onFinish` callback.
// ---------------------------------------------------------------------------

/// Web `BattleResult.winner`: `'atakujacy' | 'obronca' | 'remis'`
/// (`battle/battleScene.ts:589`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BattleWinner {
    /// `'atakujacy'`.
    Atakujacy,
    /// `'obronca'`.
    Obronca,
    /// `'remis'` (`_finishDraw`, `:9473`).
    Remis,
}

/// One unit of `BattleResult.survivors`, narrowed to the fields the map reads.
///
/// The web exports the whole `BattleUnit` (`{ ...u.bu, hp }`, `:10248-10249`),
/// but every map consumer in the pin reads only `id` and `hp`
/// (`main.ts:34514`, `:34537`; `game/post-battle-map.ts:28-31`;
/// `game/siegeDefenders.ts:375-376`), see the recon §2a.1.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleSurvivorDto {
    /// `bu.id` (the map compares `String(sv.id)`, `main.ts:34514`; adapter:
    /// `Display` → `String`).
    pub id: UnitId,
    /// `Math.max(0, u.bu.hp)` (`:10249`); `> 0` on paths E1–E3 (filter
    /// `u.bu.hp > 0`, `:10248`).
    pub hp: f64,
}

/// One side of the end screen statistics, `_sideEndStats(side)`
/// (`battle/battleScene.ts:10257-10269`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleSideEndStatsDto {
    /// `roster.length`.
    pub total: u32,
    /// Units with `dead || routed`.
    pub lost: u32,
    /// Units with `!(dead || routed)`.
    pub remaining: u32,
    /// Sum of `Math.max(0, u.bu.hp)` over the remaining units.
    pub hp: f64,
    /// Sum of `Math.max(0, u.bu.maxHp)` over the whole roster.
    pub hp_max: f64,
}

/// Both sides of the end screen statistics (`sA`, `sD`, `:10677-10678`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleEndStatsDto {
    /// `_sideEndStats('atk')`.
    pub atk: BattleSideEndStatsDto,
    /// `_sideEndStats('def')`.
    pub def: BattleSideEndStatsDto,
}

/// Battle outcome: web `BattleResult` (`battle/battleScene.ts:588-604`,
/// built in `onFinish`, `:10720-10729`) + end statistics.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleOutcomeDto {
    /// `this._endWinner ?? winner` (`:10721`).
    pub winner: BattleWinner,
    /// `this._endSurvivors` (`:10722`), in the order of the end path
    /// (E2: attackers first, then defenders, `:9474-9477`).
    pub survivors: Vec<BattleSurvivorDto>,
    /// `this.log` (`:10723`). NIE_ZMIERZONO: the log texts have no producer
    /// yet (topic P4-1I3, #247); the producer writes an empty list. Path E4
    /// ("Pomiń", `_skipInstantFallback`, `:3744`) carries `result.log` of
    /// `computeInstantResult` (pair logs + the closing
    /// `=== Natychmiastowy wynik: … wygrywa ===` line, `:20591`).
    pub log: Vec<String>,
    /// `eventLog.attackerUnitIds` = `buildBattleEventLog(...)`
    /// (`:10724-10727`, `units/battleRoster.ts:26-39`): unique, roster order.
    pub attacker_unit_ids: Vec<UnitId>,
    /// `eventLog.defenderUnitIds`, as above.
    pub defender_unit_ids: Vec<UnitId>,
    /// `wallBreached`: only in a siege (`siegeWallCol >= 0`, `:10728`);
    /// `None` = the web omits the key (no siege).
    pub wall_breached: Option<bool>,
    /// `_sideEndStats` of both sides (end screen, `:10677-10678`).
    pub end_stats: BattleEndStatsDto,
}

impl BattleOutcomeDto {
    /// Checks the invariants the types do not enforce: every float finite
    /// (JSON has no `NaN`/`Infinity`), every survivor `hp > 0`,
    /// `lost + remaining == total` on each
    /// side (`_sideEndStats` counts every roster unit exactly once) and no
    /// duplicate id within one event-log side (`uniqueUnitIds`,
    /// `units/battleRoster.ts:26-28`).
    ///
    /// # Errors
    /// The first violated invariant.
    pub fn validate(&self) -> Result<(), crate::validate::ViewError> {
        use crate::validate::ViewError;
        for (i, s) in self.survivors.iter().enumerate() {
            if !s.hp.is_finite() {
                return Err(ViewError::NonFinite {
                    field: format!("survivors[{i}].hp"),
                });
            }
            // Every web survivor has `hp > 0`: filter `u.bu.hp > 0` on E1–E3
            // (`_battleUnitsForMapExport`, `:10248`) and `u.hp > 0` on E4
            // (`computeInstantResult`, `:20574-20575`). For a finite `hp`,
            // `hp > 0` <=> `ceil(hp) >= 1`, so `OutOfRange` with `min = 1`
            // states the bound exactly (`value` = `ceil(hp)`).
            if s.hp <= 0.0 {
                #[allow(clippy::cast_possible_truncation)]
                let value = s.hp.ceil() as i64;
                return Err(ViewError::OutOfRange {
                    field: format!("survivors[{i}].hp"),
                    value,
                    min: 1,
                    max: i64::MAX,
                });
            }
        }
        for (name, s) in [("atk", &self.end_stats.atk), ("def", &self.end_stats.def)] {
            for (field, v) in [("hp", s.hp), ("hpMax", s.hp_max)] {
                if !v.is_finite() {
                    return Err(ViewError::NonFinite {
                        field: format!("endStats.{name}.{field}"),
                    });
                }
            }
            let counted = u64::from(s.lost) + u64::from(s.remaining);
            if counted != u64::from(s.total) {
                return Err(ViewError::LengthMismatch {
                    field: format!("endStats.{name}.lost+remaining"),
                    expected: usize::try_from(s.total).unwrap_or(usize::MAX),
                    actual: usize::try_from(counted).unwrap_or(usize::MAX),
                });
            }
        }
        for (name, ids) in [
            ("attackerUnitIds", &self.attacker_unit_ids),
            ("defenderUnitIds", &self.defender_unit_ids),
        ] {
            let distinct: std::collections::BTreeSet<UnitId> = ids.iter().copied().collect();
            if distinct.len() != ids.len() {
                return Err(ViewError::LengthMismatch {
                    field: format!("{name} (unique)"),
                    expected: distinct.len(),
                    actual: ids.len(),
                });
            }
        }
        Ok(())
    }
}
