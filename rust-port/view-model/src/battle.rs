//! Battle start (contract §3.8 `BattleViewDto`, "Start").
//!
//! The contract makes the setup the renderer's `BattleUnitsOpts`
//! (`renderer/src/battle/units.rs:842-852`) with `TerrainGrid`
//! (`battle/field.rs:353-360`), `BattleSceneOpts` (`field.rs:1978-1989`),
//! `UnitSpawn` (`units.rs:510-541`) and `FortDto` (`units.rs:726-733`). This
//! crate must not depend on the renderer (D-DTO-1 = A), so the same fields are
//! mirrored here as plain data; the adapter (P4-1G) builds the renderer
//! structs from them. The battle course ("Przebieg", D-DTO-7) follows the recon
//! `P4-1I-BATTLE-ROZPOZNANIE.md` §5: outcome and frame as snapshots
//! ([`BattleOutcomeDto`], [`BattleFrameDto`]) plus the transient actions of a
//! step ([`BattleActionDto`], P4-1I3).
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

// ---------------------------------------------------------------------------
// Battle frame (P4-1I2, `R-RUSTPORT-P4-1I2-BATTLE-FRAME`).
//
// State of the battle after one step of the loop (one fired timer of the web
// `_drainTimers`, `battle/battleScene.ts:9616-9634`): what the renderer needs
// for the bars and the positions. Field list: recon
// `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2b. Transient actions
// (lunge, projectile flight, labels) are not here: P4-1I3 (`BattleActionDto`).
// ---------------------------------------------------------------------------

/// One unit of a battle frame: the fields of `RuntimeBattleUnit`
/// (`battle/battleScene.ts:1962-2028`) the bars and the scene read.
///
/// `ammoLeft`: the web keeps `Infinity` for unlimited ammunition (`ammoCount`,
/// `:1434-1448`; `_doRangedAttack` decrements only a finite value, `:9191-9192`).
/// JSON cannot carry it, so `None` = unlimited, as in
/// [`BattleUnitSpawnDto::ammo_left`].
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleFrameUnitDto {
    /// `bu.id`.
    pub id: UnitId,
    /// Column `q` (`:1977`).
    pub col: i32,
    /// Row `r` (`:1978`).
    pub row: i32,
    /// `facing` (`:2011`; `Dir`: `N = 0`, `E = 1`, `S = 2`, `W = 3`, `:315-320`).
    pub facing: i32,
    /// `bu.hp` (may be `<= 0` after a killing blow, `:8991`).
    pub hp: f64,
    /// `morale` (`:2013`).
    pub morale: f64,
    /// `ammoLeft` (`:1999`); `None` = unlimited (`Infinity`).
    pub ammo_left: Option<f64>,
    /// `routed` (`:2016`).
    pub routed: bool,
    /// `dead` (`:1982`).
    pub dead: bool,
    /// `removed` (`:2021`).
    pub removed: bool,
    /// `onWallWalkway` (`:2028`).
    pub on_wall_walkway: bool,
}

/// One living wall tile: `wallTileHp.get(row)` (`battle/battleScene.ts:2501`;
/// a missing key = tile breached, `:7646`).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleWallTileHpDto {
    /// Wall row.
    pub row: i32,
    /// Tile HP.
    pub hp: f64,
}

/// Wall state of a battle frame: `wallTileHp` (`:2501`), `gateHp` (`:2454`),
/// `gateOpen` (`:2456`), `wallEverBreached` (`:2503`),
/// `siegeTowers[].destroyed` (`:2443`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleFrameWallDto {
    /// Living wall tiles; one entry per row.
    pub tile_hp: Vec<BattleWallTileHpDto>,
    /// `gateHp`.
    pub gate_hp: f64,
    /// `gateOpen`.
    pub gate_open: bool,
    /// `wallEverBreached`.
    pub ever_breached: bool,
    /// Rows of the towers with `destroyed === true`, in `siegeTowers` order
    /// (`_destroyTowerAtRow`, `:4194-4200`; called on a breach, `:7648`, and by
    /// `_fireSiegeTowers` for a tower whose tile is gone, `:4216`).
    pub towers_destroyed: Vec<i32>,
}

/// Battle frame: the state after one loop step (recon §2b).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleFrameDto {
    /// `vNow` (virtual clock, ms, `:2556`).
    pub v_now: f64,
    /// `roundNo` (`:2698`).
    pub round_no: i64,
    /// Units in the web spawn order: attackers, then defenders (`this.atk` /
    /// `this.def` from `place(...)`, `:5541-5550`; iterated as
    /// `[...this.atk, ...this.def]`, e.g. `:5573`).
    pub units: Vec<BattleFrameUnitDto>,
    /// Wall state.
    pub wall: BattleFrameWallDto,
    /// `finished` (`:2518`).
    pub finished: bool,
}

impl BattleFrameDto {
    /// Checks the invariants the types do not enforce: every float finite
    /// (JSON has no `NaN`/`Infinity`; unlimited ammunition is `None`),
    /// `vNow >= 0`, `roundNo >= 0`, `facing` a `Dir` (`0..=3`), `ammoLeft >= 0`
    /// (`ammoCount` returns `Math.max(0, …)`, `:1447`; `canShoot` needs
    /// `ammoLeft > 0` before the decrement, `:1458`, `:9191-9192`), no
    /// duplicate unit id, wall row or destroyed tower row (`towerRows` yields
    /// strictly increasing rows, `game/city-towers.ts:47-56`).
    ///
    /// # Errors
    /// The first violated invariant.
    pub fn validate(&self) -> Result<(), crate::validate::ViewError> {
        use crate::validate::ViewError;
        use std::collections::BTreeSet;
        fn finite(field: impl FnOnce() -> String, v: f64) -> Result<(), ViewError> {
            if v.is_finite() {
                Ok(())
            } else {
                Err(ViewError::NonFinite { field: field() })
            }
        }
        fn non_negative(field: impl FnOnce() -> String, v: f64) -> Result<(), ViewError> {
            if v >= 0.0 {
                return Ok(());
            }
            // `floor`, not `trunc`: for a finite `v < 0`, `floor(v) <= -1 < min`, so the reported
            // `value` itself lies outside `min..=max` (`trunc(-0.5)` = 0 would look in range). Same
            // convention as `survivors[i].hp` above (`ceil` for the `min = 1` bound).
            #[allow(clippy::cast_possible_truncation)]
            let value = v.floor() as i64;
            Err(ViewError::OutOfRange {
                field: field(),
                value,
                min: 0,
                max: i64::MAX,
            })
        }
        // Duplicates are reported as `LengthMismatch { expected: distinct, actual: len }` with a
        // `(unique …)` field, the convention already used by `BattleOutcomeDto::validate`
        // (`attackerUnitIds (unique)`); `ViewError` lives in `validate.rs`, outside this topic.
        fn unique(field: &str, distinct: usize, actual: usize) -> Result<(), ViewError> {
            if distinct == actual {
                return Ok(());
            }
            Err(ViewError::LengthMismatch {
                field: field.to_string(),
                expected: distinct,
                actual,
            })
        }
        finite(|| "vNow".into(), self.v_now)?;
        non_negative(|| "vNow".into(), self.v_now)?;
        if self.round_no < 0 {
            return Err(ViewError::OutOfRange {
                field: "roundNo".into(),
                value: self.round_no,
                min: 0,
                max: i64::MAX,
            });
        }
        let mut ids = BTreeSet::new();
        for (i, u) in self.units.iter().enumerate() {
            finite(|| format!("units[{i}].hp"), u.hp)?;
            finite(|| format!("units[{i}].morale"), u.morale)?;
            if let Some(a) = u.ammo_left {
                finite(|| format!("units[{i}].ammoLeft"), a)?;
                non_negative(|| format!("units[{i}].ammoLeft"), a)?;
            }
            if !(0..=3).contains(&u.facing) {
                return Err(ViewError::OutOfRange {
                    field: format!("units[{i}].facing"),
                    value: i64::from(u.facing),
                    min: 0,
                    max: 3,
                });
            }
            ids.insert(u.id);
        }
        unique("units (unique id)", ids.len(), self.units.len())?;
        let w = &self.wall;
        finite(|| "wall.gateHp".into(), w.gate_hp)?;
        let mut rows = BTreeSet::new();
        for (i, t) in w.tile_hp.iter().enumerate() {
            finite(|| format!("wall.tileHp[{i}].hp"), t.hp)?;
            rows.insert(t.row);
        }
        unique("wall.tileHp (unique row)", rows.len(), w.tile_hp.len())?;
        let towers: BTreeSet<i32> = w.towers_destroyed.iter().copied().collect();
        unique(
            "wall.towersDestroyed (unique row)",
            towers.len(),
            w.towers_destroyed.len(),
        )?;
        Ok(())
    }
}

// ---------------------------------------------------------------------------
// Battle actions (P4-1I3, `R-RUSTPORT-P4-1I3-BATTLE-ACTIONS`).
//
// Transient actions of a loop step that the state difference cannot show
// (recon `dyspozycje/rust-port/p4/P4-1I-BATTLE-ROZPOZNANIE.md` §2c): the web
// calls scene methods directly (`_doMeleeAttack`, `_spawnDamageLabel`,
// `_startRout`, `_startFade`, `_fireOneTower`, `_pushClash`, `this.log.push`),
// so a lunge or a miss leaves no trace in the frame. Each action carries `t0`,
// the virtual time (`vNow`, ms) of the scene call; a list is in the order of the
// scene calls in the pin `07d2fbd72`. Only paths already ported in the engine
// are produced (blow, counter, tower shot, rout, kill, end, turn; P4-1I5a: the
// step `Move` and the unit shot `Shot`; P4-1I5b: the flight from the field
// `Leave` and its ripple `Shaken`, the climb `ClimbWall`, the catapult
// `Boulder` / `WallDamage`, the ram `Ram` / `GateDamage`, the breaches
// `WallBreach` / `GateBreach` / `TowerDestroyed` and the retreat from the
// breached wall `LeaveField`).
// ---------------------------------------------------------------------------

/// Tag of a clash entry (`_pushClash(…, outcome)`, `battle/battleScene.ts:9550-9566`):
/// `''`, `'padl'`, `'rout'`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum BattleClashTagDto {
    /// `''` (plain hit).
    Plain,
    /// `'padl'` (the blow killed the target).
    Padl,
    /// `'rout'` (the blow broke the target's morale).
    Rout,
}

/// Who dealt a blow: a battle unit or a wall tower. The tower shooter of
/// `_fireOneTower` is synthetic (`id: 'wieza:' + row`, in no roster,
/// `battle/battleScene.ts:4238-4245`), so it is identified by its wall row.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "type", deny_unknown_fields)]
pub enum BattleActorDto {
    /// A unit of `this.atk` / `this.def`.
    Unit {
        /// `bu.id`.
        id: UnitId,
    },
    /// The tower on wall row `row` (`'wieza:' + t.row`).
    Tower {
        /// Wall row of the tower.
        row: i32,
    },
}

/// One transient action (the variant), see [`BattleActionDto`].
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", tag = "kind", deny_unknown_fields)]
pub enum BattleActionKindDto {
    /// A new turn: `hint.textContent = 'Tura ' + roundNo` (`_beginTurn`).
    #[serde(rename_all = "camelCase")]
    Turn {
        /// `roundNo` after the increment.
        round_no: i64,
    },
    /// A unit turns: `ru.facing = …; ru.group.rotation.y = dirYaw(ru.facing)`
    /// (`_updateFacing` `:8334-8341`, `_doMeleeAttack` `:9104-9105` and
    /// `:9137-9138`, `_startRout` `:9817-9818`).
    Facing {
        /// Unit.
        id: UnitId,
        /// New `Dir` (`N = 0`, `E = 1`, `S = 2`, `W = 3`, `:315-320`).
        dir: i32,
    },
    /// Melee lunge (`_doMeleeAttack`, `:9096-9175`): the lunge starts at `t0`,
    /// the blow connects at `hitAt` (`t0 + BLOW_HIT_T`, `:9122`).
    #[serde(rename_all = "camelCase")]
    Melee {
        /// Attacker.
        attacker: UnitId,
        /// Target.
        target: UnitId,
        /// Moment of the blow.
        hit_at: f64,
    },
    /// Wall tower shot (`_fireOneTower`, `:4223-4270`): projectile from the
    /// tower of row `row` to `target`, launched at `t0`, landing at `landAt`
    /// (`t0 + RANGED_FLY_MS`, `:4262`).
    #[serde(rename_all = "camelCase")]
    TowerShot {
        /// Wall row of the tower.
        row: i32,
        /// Target unit.
        target: UnitId,
        /// Moment of the hit.
        land_at: f64,
    },
    /// Floating damage label `_spawnDamageLabel(ru, dmg)` (`:9940-9971`).
    Damage {
        /// Unit hit.
        target: UnitId,
        /// Damage shown as `'-' + dmg`.
        dmg: f64,
    },
    /// Entry of the "Ostatnie starcia" panel (`_pushClash`, `:9550-9566`).
    Clash {
        /// Who dealt the blow.
        attacker: BattleActorDto,
        /// Unit hit.
        target: UnitId,
        /// Damage of the blow (`> 0`).
        dmg: f64,
        /// Tag.
        tag: BattleClashTagDto,
        /// The panel line built by `_pushClash`.
        text: String,
    },
    /// The unit breaks and flees (`_startRout`, `:9799-9825`; `_sfxRout`).
    Rout {
        /// Unit.
        id: UnitId,
    },
    /// The unit dies and leaves the field (`_startFade` → `_removeUnitFromScene`,
    /// `:9927-9938`; `_sfxDeath`).
    Kill {
        /// Unit.
        id: UnitId,
    },
    /// A line of the battle log, `this.log.push(text)` (→ `BattleResult.log`,
    /// `:10723`).
    Log {
        /// Text, byte for byte as in the pin.
        text: String,
    },
    /// End of the battle (`_showEndScreen(winner)`).
    End {
        /// Winner.
        winner: BattleWinner,
    },
    /// One step of a unit (`_doMove`, `battleScene.ts:8714-8776`; P4-1I5a,
    /// D-WIR-6): the logical cell changes at `t0` (`ru.q = col; ru.r = row`,
    /// `:8731`), the walk starts at `t0` (`const t0 = this._now()`, `:8752`,
    /// after `_updateFacing`, whose turn is the separate `Facing` action with
    /// the same `t0`) and ends at `arriveAt = t0 + MOVE_STEP_MS` (`p >= 1`,
    /// `MOVE_STEP_MS = 240`, `:1010`).
    #[serde(rename_all = "camelCase")]
    Move {
        /// Unit.
        id: UnitId,
        /// Column before the step (`ru.q`).
        from_col: i32,
        /// Row before the step (`ru.r`).
        from_row: i32,
        /// Column after the step.
        to_col: i32,
        /// Row after the step.
        to_row: i32,
        /// End of the walk.
        arrive_at: f64,
    },
    /// Unit shot (`_doRangedAttack`, `:9179-9235`; P4-1I5a, D-WIR-7): a
    /// projectile from the shooter's cell to the target's cell launched at
    /// `t0` (`projectiles.push({ t0: this._now(), dur: RANGED_FLY_MS })`,
    /// `:9218-9221`), landing at `landAt = t0 + RANGED_FLY_MS`
    /// (`_schedule(RANGED_FLY_MS, …)`, `:9224`). The shooter's turn is the
    /// separate `Facing` action with the same `t0` (`:9182-9184`). The
    /// projectile kind is not carried: the renderer derives it from the
    /// shooter as the web does (`projectileKind(attacker.bu)`, `:9203`).
    #[serde(rename_all = "camelCase")]
    Shot {
        /// Shooter.
        attacker: UnitId,
        /// Target.
        target: UnitId,
        /// Moment of the hit.
        land_at: f64,
    },
    /// A fleeing unit leaves the field (`_fleeStep` → `_removeUnitFromScene`,
    /// `:9853-9857`, `:9876-9878`, `:9887-9892`; body `:9910-9925`; P4-1I5b,
    /// D-I5B-1): model and bars are detached at once, no sound, no label and
    /// no HP change (unlike `Kill` = `_startFade`). The ripple on the allies is
    /// the separate `Shaken` actions that follow with the same `t0`.
    Leave {
        /// Unit.
        id: UnitId,
    },
    /// Morale ripple `_shakeAlliesOnLoss(fallen)` (`:9743-9753`; D-I5B-2): the
    /// ally `id` loses `MORALE_ALLY_DEATH_LOSS`, `morale` is the value after
    /// the loss (`Math.max(0, …)`) drawn by `_updateMoraleBar(a)` (`:9749`).
    Shaken {
        /// Ally shaken.
        id: UnitId,
        /// The unit that fell (`fallen`).
        fallen: UnitId,
        /// Morale after the loss.
        morale: f64,
    },
    /// Climb from a siege tower onto the wall crown (`_trySiegeTowerClimb`,
    /// `:8067-8082`; D-I5B-3): `ru.q = wallCol` (the row does not change),
    /// `onWallWalkway = true`, model at `(x, 2.5, z)` and bars `HPBAR_Y` above
    /// at once (no animation). The first-breach log line, when any, is the
    /// `Log` action before it.
    #[serde(rename_all = "camelCase")]
    ClimbWall {
        /// Unit.
        id: UnitId,
        /// Column before the climb (`ru.q`).
        from_col: i32,
        /// Row (`ru.r`).
        from_row: i32,
        /// Column after the climb (`siegeWallCol`).
        to_col: i32,
        /// Row after the climb (= `fromRow`).
        to_row: i32,
    },
    /// Catapult stone `_attackWallTile` (`:7540-7552`, `_spawnCatapultBoulder`
    /// `:7571-7600`; D-I5B-4): from the catapult's tile (top + 0.8) to the
    /// wall tile `(siegeWallCol, row)` at height 1.5, launched at `t0`, landing
    /// at `landAt = t0 + 700` (`_schedule(700, …)`, `:7555`). The tile damage is
    /// the separate `WallDamage` at `landAt`.
    #[serde(rename_all = "camelCase")]
    Boulder {
        /// The catapult.
        id: UnitId,
        /// Wall row aimed at.
        row: i32,
        /// Moment of the hit.
        land_at: f64,
    },
    /// Hit of the stone on a wall tile (the `_schedule(700)` callback,
    /// `:7556-7564`; D-I5B-5): `wallTileHp.set(row, hpAfter)`, HUD and the
    /// label `'-' + dmg + ' (mur)'` in `#ff8800` (`_spawnWallLabel`, `:7561`).
    #[serde(rename_all = "camelCase")]
    WallDamage {
        /// Wall row.
        row: i32,
        /// Damage (`Math.max(1, Math.round(base))`, `:7545`).
        dmg: f64,
        /// Tile HP after the hit (`Math.max(0, cur - dmg)`).
        hp_after: f64,
    },
    /// Ram animation `_animateRam(ru.group, gateDir)` of `_attackGate`
    /// (`:7316-7323`, `:7337-7360`; D-I5B-6): from the ram's position toward
    /// the gate `(siegeGateCol, siegeGateRow)` and back, `until = t0 + 320`
    /// (`duration = 320`).
    Ram {
        /// The ram.
        id: UnitId,
        /// End of the animation.
        until: f64,
    },
    /// Gate damage of `_attackGate` (`:7326-7331`; D-I5B-7): `gateHp =
    /// Math.max(0, gateHp - dmg)` and the HUD.
    #[serde(rename_all = "camelCase")]
    GateDamage {
        /// Damage (`_siegeStructureDamage`, `>= 1`).
        dmg: f64,
        /// Gate HP after the hit.
        hp_after: f64,
    },
    /// Wall tile breached `_breachWallTile(row)` (`:7638-7697`; D-I5B-8): the
    /// tile becomes `Plains`, `wallTileHp.delete(row)`, label
    /// `'MUR WYBURZONY!'` in `#ff4400`, the row's wall segments hidden, 7
    /// rubble pieces. The tower of that row is the `TowerDestroyed` before it;
    /// the defenders leaving the tile are the `LeaveField` / `Kill` after it.
    WallBreach {
        /// Wall row.
        row: i32,
    },
    /// Gate opened `_breachGate()` (`:7757-7801`; D-I5B-9): `gateOpen`, the gate
    /// tiles `Plains`, the gate group and the gate meshes of the wall hidden.
    /// A struct variant without fields (not a unit variant): serde accepts
    /// unknown keys next to the tag of an internally tagged unit variant even
    /// with `deny_unknown_fields`, `{}` keeps the keys strict.
    GateBreach {},
    /// `_destroyTowerAtRow(row)` (`:4194-4200`; D-I5B-10): the first live tower
    /// of that row is `destroyed` and its mesh hidden; its log line is the
    /// `Log` action after it.
    TowerDestroyed {
        /// Wall row of the tower.
        row: i32,
    },
    /// A defender leaves the breached wall tile (`_breachWallTile`,
    /// `:7700-7741`; D-I5B-11): `onWallWalkway = false`; when a free cell was
    /// found (`to != from`) the model stands at once on its tile top and the
    /// bars `HPBAR_Y` above; when none was (`to == from`, `:7717`) the unit
    /// stays where it is (model not moved).
    #[serde(rename_all = "camelCase")]
    LeaveField {
        /// Unit.
        id: UnitId,
        /// Column before (`ru.q`, the wall column).
        from_col: i32,
        /// Row before.
        from_row: i32,
        /// Column after.
        to_col: i32,
        /// Row after.
        to_row: i32,
    },
}

/// One action with its start time (recon §2c).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct BattleActionDto {
    /// Virtual time of the scene call (`vNow`, ms).
    pub t0: f64,
    /// The action.
    pub action: BattleActionKindDto,
}

fn action_finite(field: String, v: f64) -> Result<(), crate::validate::ViewError> {
    if v.is_finite() {
        Ok(())
    } else {
        Err(crate::validate::ViewError::NonFinite { field })
    }
}

/// `v >= min` for finite `v` and `min`; the error reports `floor(v)` and
/// `ceil(min)` (same convention as [`BattleFrameDto::validate`]).
fn action_at_least(field: String, v: f64, min: f64) -> Result<(), crate::validate::ViewError> {
    if v >= min {
        return Ok(());
    }
    #[allow(clippy::cast_possible_truncation)]
    let (value, min) = (v.floor() as i64, min.ceil() as i64);
    Err(crate::validate::ViewError::OutOfRange {
        field,
        value,
        min,
        max: i64::MAX,
    })
}

/// `dmg` finite and `> 0`.
fn action_dmg(field: String, v: f64) -> Result<(), crate::validate::ViewError> {
    action_finite(field.clone(), v)?;
    if v > 0.0 {
        return Ok(());
    }
    #[allow(clippy::cast_possible_truncation)]
    let value = v.floor() as i64;
    Err(crate::validate::ViewError::OutOfRange {
        field,
        value,
        min: 1,
        max: i64::MAX,
    })
}

/// A field cell index (column or row of the battle grid): `>= 0` (the grid
/// size is the renderer's, `BF_COLS` / `BF_ROWS`, checked there).
fn action_index(field: String, v: i32) -> Result<(), crate::validate::ViewError> {
    if v >= 0 {
        return Ok(());
    }
    Err(crate::validate::ViewError::OutOfRange {
        field,
        value: i64::from(v),
        min: 0,
        max: i64::from(i32::MAX),
    })
}

fn action_text(field: String, s: &str) -> Result<(), crate::validate::ViewError> {
    if s.is_empty() {
        Err(crate::validate::ViewError::LengthMismatch {
            field,
            expected: 1,
            actual: 0,
        })
    } else {
        Ok(())
    }
}

impl BattleActionDto {
    /// Checks one action: `t0` finite and `>= 0`; `hitAt`/`landAt`/`arriveAt`
    /// finite and `>= t0`; `dmg` finite and `> 0` (`_spawnDamageLabel` and
    /// `_pushClash` are only called for `dmg > 0`, `:9125`, `:9142`, `:4265`,
    /// doc `:9547`); `dir` a `Dir` (`0..=3`); `roundNo >= 1` (`_beginTurn`
    /// increments before the hint); log and clash texts non-empty; melee and
    /// shot attacker != target; a step changes the cell (`from != to`; the DTO
    /// does not require adjacent cells, `_doMove` does not check it, D-WIR-6).
    /// P4-1I5b: `landAt` (stone) / `until` (ram) finite and `>= t0`; wall /
    /// gate `dmg` finite and `> 0`, `hpAfter` finite and `>= 0`; `Shaken`
    /// morale finite and `>= 0`, ally != fallen; every cell index and wall
    /// row `>= 0`; a climb keeps the row and changes the column. The exact
    /// pin durations (`+ 700`, `+ 320`) and the grid bounds are checked by
    /// the renderer consumer, as for `Move` / `Shot` (D-I5B-12).
    /// `prefix` is the JSON path of the action (e.g. `actions[3]`).
    ///
    /// # Errors
    /// The first violated invariant.
    pub fn validate_at(&self, prefix: &str) -> Result<(), crate::validate::ViewError> {
        use crate::validate::ViewError;
        let f = |name: &str| format!("{prefix}.{name}");
        action_finite(f("t0"), self.t0)?;
        action_at_least(f("t0"), self.t0, 0.0)?;
        match &self.action {
            BattleActionKindDto::Turn { round_no } => {
                if *round_no < 1 {
                    return Err(ViewError::OutOfRange {
                        field: f("action.roundNo"),
                        value: *round_no,
                        min: 1,
                        max: i64::MAX,
                    });
                }
            }
            BattleActionKindDto::Facing { dir, .. } => {
                if !(0..=3).contains(dir) {
                    return Err(ViewError::OutOfRange {
                        field: f("action.dir"),
                        value: i64::from(*dir),
                        min: 0,
                        max: 3,
                    });
                }
            }
            BattleActionKindDto::Melee {
                attacker,
                target,
                hit_at,
            } => {
                action_finite(f("action.hitAt"), *hit_at)?;
                action_at_least(f("action.hitAt"), *hit_at, self.t0)?;
                if attacker == target {
                    // Two distinct units expected, one found.
                    return Err(ViewError::LengthMismatch {
                        field: f("action.target (!= attacker)"),
                        expected: 2,
                        actual: 1,
                    });
                }
            }
            BattleActionKindDto::TowerShot { land_at, .. } => {
                action_finite(f("action.landAt"), *land_at)?;
                action_at_least(f("action.landAt"), *land_at, self.t0)?;
            }
            BattleActionKindDto::Damage { dmg, .. } => action_dmg(f("action.dmg"), *dmg)?,
            BattleActionKindDto::Clash { dmg, text, .. } => {
                action_dmg(f("action.dmg"), *dmg)?;
                action_text(f("action.text"), text)?;
            }
            BattleActionKindDto::Log { text } => action_text(f("action.text"), text)?,
            BattleActionKindDto::Move {
                from_col,
                from_row,
                to_col,
                to_row,
                arrive_at,
                ..
            } => {
                action_finite(f("action.arriveAt"), *arrive_at)?;
                action_at_least(f("action.arriveAt"), *arrive_at, self.t0)?;
                if (from_col, from_row) == (to_col, to_row) {
                    // A step changes the cell (`_doMove` is called with a new tile); two distinct cells
                    // expected, one found.
                    return Err(ViewError::LengthMismatch {
                        field: f("action.to (!= from)"),
                        expected: 2,
                        actual: 1,
                    });
                }
            }
            BattleActionKindDto::Shot {
                attacker,
                target,
                land_at,
            } => {
                action_finite(f("action.landAt"), *land_at)?;
                action_at_least(f("action.landAt"), *land_at, self.t0)?;
                if attacker == target {
                    return Err(ViewError::LengthMismatch {
                        field: f("action.target (!= attacker)"),
                        expected: 2,
                        actual: 1,
                    });
                }
            }
            BattleActionKindDto::Shaken { id, fallen, morale } => {
                action_finite(f("action.morale"), *morale)?;
                action_at_least(f("action.morale"), *morale, 0.0)?;
                if id == fallen {
                    return Err(ViewError::LengthMismatch {
                        field: f("action.fallen (!= id)"),
                        expected: 2,
                        actual: 1,
                    });
                }
            }
            BattleActionKindDto::ClimbWall {
                from_col,
                from_row,
                to_col,
                to_row,
                ..
            } => {
                action_index(f("action.fromCol"), *from_col)?;
                action_index(f("action.fromRow"), *from_row)?;
                action_index(f("action.toCol"), *to_col)?;
                action_index(f("action.toRow"), *to_row)?;
                if to_row != from_row {
                    // `_trySiegeTowerClimb` sets only `ru.q` (`:8070`): the row stays.
                    return Err(ViewError::OutOfRange {
                        field: f("action.toRow (== fromRow)"),
                        value: i64::from(*to_row),
                        min: i64::from(*from_row),
                        max: i64::from(*from_row),
                    });
                }
                if to_col == from_col {
                    return Err(ViewError::LengthMismatch {
                        field: f("action.toCol (!= fromCol)"),
                        expected: 2,
                        actual: 1,
                    });
                }
            }
            BattleActionKindDto::Boulder { row, land_at, .. } => {
                action_index(f("action.row"), *row)?;
                action_finite(f("action.landAt"), *land_at)?;
                action_at_least(f("action.landAt"), *land_at, self.t0)?;
            }
            BattleActionKindDto::WallDamage { row, dmg, hp_after } => {
                action_index(f("action.row"), *row)?;
                action_dmg(f("action.dmg"), *dmg)?;
                action_finite(f("action.hpAfter"), *hp_after)?;
                action_at_least(f("action.hpAfter"), *hp_after, 0.0)?;
            }
            BattleActionKindDto::Ram { until, .. } => {
                action_finite(f("action.until"), *until)?;
                action_at_least(f("action.until"), *until, self.t0)?;
            }
            BattleActionKindDto::GateDamage { dmg, hp_after } => {
                action_dmg(f("action.dmg"), *dmg)?;
                action_finite(f("action.hpAfter"), *hp_after)?;
                action_at_least(f("action.hpAfter"), *hp_after, 0.0)?;
            }
            BattleActionKindDto::WallBreach { row }
            | BattleActionKindDto::TowerDestroyed { row } => {
                action_index(f("action.row"), *row)?;
            }
            BattleActionKindDto::LeaveField {
                from_col,
                from_row,
                to_col,
                to_row,
                ..
            } => {
                action_index(f("action.fromCol"), *from_col)?;
                action_index(f("action.fromRow"), *from_row)?;
                action_index(f("action.toCol"), *to_col)?;
                action_index(f("action.toRow"), *to_row)?;
            }
            BattleActionKindDto::Rout { .. }
            | BattleActionKindDto::Kill { .. }
            | BattleActionKindDto::End { .. }
            | BattleActionKindDto::Leave { .. }
            | BattleActionKindDto::GateBreach {} => {}
        }
        Ok(())
    }
}

/// Checks a list of actions (one battle or one step): every action
/// ([`BattleActionDto::validate_at`], prefix `actions[i]`) and the time order of
/// the scene calls: `t0` never decreases (the engine emits each action when its
/// virtual clock reaches it).
///
/// # Errors
/// The first violated invariant.
pub fn validate_actions(actions: &[BattleActionDto]) -> Result<(), crate::validate::ViewError> {
    let mut prev = 0.0_f64;
    for (i, a) in actions.iter().enumerate() {
        let prefix = format!("actions[{i}]");
        a.validate_at(&prefix)?;
        action_at_least(format!("{prefix}.t0"), a.t0, prev)?;
        prev = a.t0;
    }
    Ok(())
}
