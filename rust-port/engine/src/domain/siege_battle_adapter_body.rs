//! R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6), czesc 3: wejscia ciala petli ([`ProdBody`]), sceny ([`ActivateScene`]) i
//! srodowiska ([`crate::domain::siege_tactics_loop::SiegeEnv`]) bitwy oblezniczej, liczone z wyjsc czesci 1-2
//! ([`super::siege_battle_adapter`], [`super::siege_battle_adapter_unit`]) i z ukladu muru T5a
//! ([`crate::domain::battle_setup::SiegeLayout`]).
//!
//! Pin `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! * `_applyTerrainRange` (`:7490-7502`) i `_isWallCrownShooter` (`:7467-7470`) jako funkcje czyste
//!   ([`apply_terrain_range`], [`is_wall_crown_shooter`]) — dlug T2b N3/D-B7 (zasieg po zejsciu z korony);
//! * `_siegeMachineRange` (`:7530-7534`), statystyki `_siegeStructureDamage`/`_attackWallTile` (`:7505-7545`,
//!   [`SiegeStructStats`] przez `unitRowStat`), `isSiegeUnit`/`isSiegeTower`/`_isRam`/`canShoot`;
//! * `_placeSiegeTowers` (`:4158-4170`): material, `towerShooterRow` (`strongestRangedUnitForEra`), `towerRange`
//!   (`towerRangeFor`), wiersze wiezyczek (`towerRows`), nazwa strzelca (`:4211`);
//! * pola sceny z `_carveWallTiles` (`:4026-4065`): `siegeGateCol/Row`, `gateHp` (dlug T2b N1: brak bramy albo
//!   `gateHp` nie > 0 = jawny blad [`AdapterError::InvalidGate`], nie `0.0` po cichu), `siegeWallTilesInit`.
//!
//! D-B11 (kanoniczne `ru.shootingEnabled`): adapter trzyma JEDNO pole [`BodyUnitInputs::shooting_enabled`] (spawn:
//! `shootingEnabled: true`, `:4565`, `:4718`, `:5481`) i z niego wypelnia oba miejsca ciala
//! (`ActivateUnit::shooting_disabled` = negacja, `ProdDoctrineState::shooting_enabled`), wiec niezmiennik
//! `doctrine.shooting_enabled == !activate.shooting_disabled` zachodzi z konstrukcji.
//!
//! Zakres: brak wpiecia w most i w `SiegeLoop` (#369, T7). [`install_body_inputs`] wypelnia pola istniejacego
//! [`ProdBody`] (zbudowanego przez T7 z pozycjami z rozstawienia); pozycje, `terrain_defence_mult` i teren kafla
//! (delta zasiegu) sa wejsciem wolajacego, bo zaleza od rozstawienia (T5b `place_units`).

use crate::domain::battle_setup::SiegeLayout;
use crate::domain::battle_setup_units::Side;
use crate::domain::city_towers::{
    strongest_ranged_unit_for_era, tower_material_for, tower_range_for, tower_rows,
    FortificationKind, TowerMaterial, TowerSlotInput, UnitRow, DEFAULT_TOWER_MIN_RANGE,
    DEFAULT_TOWER_SPACING,
};
use crate::domain::js_math::js_max;
use crate::domain::siege_battle_adapter::{finite, AdapterError};
use crate::domain::siege_battle_adapter_unit::{
    wall_crown_shooter_range, AdapterBattleUnit, SpawnFields,
};
use crate::domain::siege_city_fortification::{city_fortification_kind, CityFortificationKind};
use crate::domain::siege_tactics_activate::{ActivateScene, ActivateUnit};
use crate::domain::siege_tactics_approach::SiegeTowerRef;
use crate::domain::siege_tactics_atk_b::SiegeStructStats;
use crate::domain::siege_tactics_blow::RollSource;
use crate::domain::siege_tactics_blow_full::FullBlowInput;
use crate::domain::siege_tactics_classify::{
    can_shoot, is_ram, is_siege_tower, is_siege_unit, ClassifyUnit, ShootUnit,
};
use crate::domain::siege_tactics_inputs_unit::unit_row_stat;
use crate::domain::siege_tactics_loop::{tower_shot_from_row, ProdBody};

/// `_isWallCrownShooter(ru)` (`battleScene.ts:7467-7470`): obronca na koronie, `rangedBase`, nie katapulta,
/// `rangeBase > 0`.
pub fn is_wall_crown_shooter(
    side_def: bool,
    on_wall_walkway: bool,
    ranged_base: bool,
    is_catapult: bool,
    range_base: f64,
) -> bool {
    side_def && on_wall_walkway && ranged_base && !is_catapult && range_base > 0.0
}

/// Pola `ru` czytane przez `_applyTerrainRange`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TerrainRangeUnit {
    pub side_def: bool,
    pub on_wall_walkway: bool,
    pub ranged_base: bool,
    pub is_catapult: bool,
    pub range_base: f64,
}

/// `_applyTerrainRange(ru)` (`battleScene.ts:7490-7502`): nowe `ru.range`. `terrain_delta` =
/// `terrainRangeDelta(combatTerrainName(ru.q, ru.r))` kafla, na ktorym jednostka stoi (wejscie wolajacego). Pin
/// wola to przy spawnie korony (`:4730`), na poczatku aktywacji (`:6064`), po zejsciu z korony (`:7740`) i w
/// `_siegeShooterThreats` (`:7929`); w ciele [`ProdBody`] `ActivateOps::apply_terrain_range` jest tozsamoscia
/// (D-B7), wiec T7 wpina te funkcje tam, gdzie pin ja wola.
pub fn apply_terrain_range(ru: &TerrainRangeUnit, terrain_delta: f64) -> f64 {
    if !ru.ranged_base || ru.is_catapult || ru.range_base <= 0.0 {
        return ru.range_base;
    }
    let range = js_max(0.0, ru.range_base + terrain_delta);
    if is_wall_crown_shooter(
        ru.side_def,
        ru.on_wall_walkway,
        ru.ranged_base,
        ru.is_catapult,
        ru.range_base,
    ) {
        wall_crown_shooter_range(range)
    } else {
        range
    }
}

/// `_siegeMachineRange(ru)` (`battleScene.ts:7530-7534`): `_attackRangeFor(bu)` gdy `>= 1`, inaczej 6 dla katapulty
/// i 1 dla reszty.
pub fn siege_machine_range(bu: &AdapterBattleUnit) -> f64 {
    let r = bu.attack_range_for();
    if r >= 1.0 {
        r
    } else if bu.setup_unit().is_catapult() {
        6.0
    } else {
        1.0
    }
}

/// Statystyki `ru.bu.stats` czytane przez `_siegeStructureDamage` (`:7505-7513`) i `_attackWallTile` (`:7542-7545`).
pub fn siege_struct_stats(bu: &AdapterBattleUnit) -> SiegeStructStats {
    let s = Some(&bu.stats);
    let weapon_damage = unit_row_stat(s, "weaponDamage", Some("Atak"), 8.0);
    SiegeStructStats {
        wall_attack: unit_row_stat(s, "wallAttack", None, 0.0),
        missile_attack: unit_row_stat(s, "missileAttack", Some("Atak dystansowy"), 0.0),
        impact: unit_row_stat(s, "chargeBonus", Some("Uderzenie"), weapon_damage),
        weapon_damage,
    }
}

/// `ClassifyUnit` z `bu` (`Typ`, `Jednostka`, `nazwa` jako `String(v)`).
pub fn classify_unit_of(bu: &AdapterBattleUnit) -> ClassifyUnit {
    let su = bu.setup_unit();
    ClassifyUnit {
        typ: su.typ,
        jednostka: su.jednostka,
        nazwa: su.nazwa,
    }
}

/// Wejscia jednej jednostki dla ciala, sceny i srodowiska petli (wszystko poza pozycja).
#[derive(Debug, Clone, PartialEq)]
pub struct BodyUnitInputs {
    /// `bu.nazwa` (`ProdBody::names`).
    pub name: String,
    pub side_atk: bool,
    /// `ProdBody::siege_stats`.
    pub siege_stats: SiegeStructStats,
    /// `ru.range` po spawnie (z `_applyTerrainRange` korony).
    pub range: f64,
    /// `ru.rangeBase` (`ProdBody::range_base`).
    pub range_base: f64,
    /// `ru.rangedBase` (`ProdBody::ranged_base`).
    pub ranged_base: bool,
    /// `ru.ammoLeft` (`ProdBody::ammo_left`).
    pub ammo_left: f64,
    /// D-B11: jedyne zrodlo `ru.shootingEnabled` (spawn `true`).
    pub shooting_enabled: bool,
    /// `_siegeMachineRange(ru)` (`ProdBody::siege_machine_range`).
    pub siege_machine_range: f64,
    /// `_movementPointsFor(bu)` (`SiegeEnv::move_points`; reset `moveLeft` co ture).
    pub move_points: f64,
    /// `ru.moveLeft` po spawnie (atakujacy: `movementPoints(bu)` bez civ, `:5458`).
    pub move_left: f64,
    /// `ru.morale` po karze startowej, `ru.moraleMax` (`SiegeEnv::morale_max`, `ProdBody::morale_max`).
    pub morale: f64,
    pub morale_max: f64,
    pub flee_morale: f64,
    pub never_rout: bool,
    pub mounted: bool,
    pub phalanx: bool,
    pub anti_cav_spear: bool,
    pub primary_ranged: bool,
    pub on_wall_walkway: bool,
    pub is_army_commander: bool,
    /// `canShoot(ru)`, `isSiegeUnit`, `isSiegeTower`, `_isRam`, `_isCatapult`.
    pub can_shoot: bool,
    pub is_siege_unit: bool,
    pub is_siege_tower: bool,
    pub is_ram: bool,
    pub is_catapult: bool,
}

/// Wejscia ciala jednostki z `bu` i pol spawnu (po karze morale startowej).
///
/// Niezmienniki T2b (Z4): `can_shoot` implikuje `range_base >= 2` (strzelec) albo `range_base >= 6` (katapulta na
/// koronie); naruszenie = [`AdapterError::InvariantViolated`] (z konstrukcji spawnu nieosiagalne: `ranged = range >=
/// 2`, katapulta korony `max(range, 6)`).
pub fn body_unit_inputs(
    bu: &AdapterBattleUnit,
    spawn: &SpawnFields,
    terrain: &str,
    shallow_sea: bool,
) -> Result<BodyUnitInputs, AdapterError> {
    let side_atk = bu.side == Side::Atk;
    let cls = classify_unit_of(bu);
    let shoot = can_shoot(&ShootUnit {
        ranged_base: spawn.ranged_base,
        ammo_left: spawn.ammo_left,
    });
    if shoot {
        let min = if spawn.is_catapult && spawn.on_wall_walkway {
            6.0
        } else {
            2.0
        };
        // NaN tez narusza niezmiennik (porownanie JS `>=` z NaN jest falszywe).
        if spawn.range_base.is_nan() || spawn.range_base < min {
            return Err(AdapterError::InvariantViolated {
                what: format!(
                    "unit {}: canShoot, rangeBase {} < {min}",
                    bu.id, spawn.range_base
                ),
            });
        }
    }
    let move_points = bu.movement_points_for(terrain, shallow_sea);
    let smr = siege_machine_range(bu);
    for (v, what) in [
        (move_points, "move_points"),
        (smr, "siege_machine_range"),
        (spawn.range, "range"),
        (spawn.range_base, "range_base"),
        (spawn.morale, "morale"),
        (spawn.morale_max, "morale_max"),
    ] {
        finite(v, || format!("unit {} {what}", bu.id))?;
    }
    Ok(BodyUnitInputs {
        name: bu.nazwa.clone(),
        side_atk,
        siege_stats: siege_struct_stats(bu),
        range: spawn.range,
        range_base: spawn.range_base,
        ranged_base: spawn.ranged_base,
        ammo_left: spawn.ammo_left,
        shooting_enabled: true,
        siege_machine_range: smr,
        move_points,
        move_left: spawn.move_left,
        morale: spawn.morale,
        morale_max: spawn.morale_max,
        flee_morale: spawn.flee_morale,
        never_rout: spawn.never_rout,
        mounted: spawn.mounted,
        phalanx: spawn.phalanx,
        anti_cav_spear: spawn.anti_cav_spear,
        primary_ranged: spawn.primary_ranged,
        on_wall_walkway: spawn.on_wall_walkway,
        is_army_commander: spawn.is_army_commander,
        can_shoot: shoot,
        is_siege_unit: is_siege_unit(&cls),
        is_siege_tower: is_siege_tower(&cls),
        is_ram: is_ram(&cls),
        is_catapult: spawn.is_catapult,
    })
}

/// Pozycja i wejscia zalezne od pola (rozstawienie T5b, teren) jednej jednostki.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct UnitPlacement {
    pub q: i64,
    pub r: i64,
    /// `terrainDefenseMultiplier(...)` kafla (czyta `_checkRout`).
    pub terrain_defence_mult: f64,
}

/// `ActivateUnit` (K5H) jednostki na starcie bitwy: pola spawnu pinu (`dead/fadingOut/routed/surroundApplied =
/// false`, `dryCol = -1`, `heldAfterFallback = false`, `playerOrder = { type: 'none' }`, `:4555-4566`, `:4711-4721`,
/// `:5466-5481`) i `doctrine_auto` z D-T8-N1 (`is_unit_doctrine_auto` ze stanu ciala, patrz
/// [`super::siege_battle_adapter_unit::doctrine_auto_for`]). `doctrine_manual` = `meta.doctrine === 'manual'` grupy
/// (na starcie `_groupMeta` pusta: `false`).
pub fn activate_unit_for(
    u: &BodyUnitInputs,
    place: &UnitPlacement,
    doctrine_auto: bool,
    doctrine_manual: bool,
) -> Result<ActivateUnit, AdapterError> {
    finite(place.terrain_defence_mult, || {
        format!("unit {} terrain_defence_mult", u.name)
    })?;
    Ok(ActivateUnit {
        side_atk: u.side_atk,
        q: place.q,
        r: place.r,
        dead: false,
        fading_out: false,
        routed: false,
        never_rout: u.never_rout,
        surround_applied: false,
        morale: u.morale,
        flee_morale: u.flee_morale,
        terrain_defence_mult: place.terrain_defence_mult,
        range: u.range,
        on_wall_walkway: u.on_wall_walkway,
        primary_ranged: u.primary_ranged,
        mounted: u.mounted,
        phalanx: u.phalanx,
        shooting_disabled: !u.shooting_enabled,
        dry_col: -1.0,
        held_after_fallback: false,
        player_order_none: true,
        can_shoot: u.can_shoot,
        is_siege_unit: u.is_siege_unit,
        is_siege_tower: u.is_siege_tower,
        is_ram: u.is_ram,
        is_catapult: u.is_catapult,
        doctrine_auto,
        doctrine_manual,
    })
}

/// Parametry wiezyczek z `miasto-params.json` (`wieze_strzeleckie_odstep_kafli`, `wieze_strzeleckie_zasieg_min`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TowerParams {
    pub spacing: i64,
    pub min_range: f64,
}

impl TowerParams {
    /// Wartosci danych pinu (`miasto-params.json`: 4 i 2 = `DEFAULT_TOWER_SPACING`/`DEFAULT_TOWER_MIN_RANGE`).
    pub fn pin() -> Self {
        Self {
            spacing: DEFAULT_TOWER_SPACING,
            min_range: DEFAULT_TOWER_MIN_RANGE,
        }
    }
}

/// Wejscie `_placeSiegeTowers` (`:4158-4170`).
pub struct TowerSetupInput<'a> {
    /// `opts.siege.builtBuildingIds` (`cityBuilt.get(city.id) ?? []`, `main.ts:36990`).
    pub built_building_ids: &'a [String],
    /// `opts.defenderEra` przed `clampEra` (`empireEpochForOwner(defRoster[0].ownerId)`, `main.ts:37009`).
    pub defender_era: Option<f64>,
    /// `opts.siege.defCiv ?? opts.siege.civ` (`ikonaIdToBronzeCiv(defCivId)`, `main.ts:36989`).
    pub def_civ: Option<&'a str>,
    /// Lista jednostek (`this._battleData.units`).
    pub units: &'a [UnitRow],
    pub params: TowerParams,
}

/// Wynik `_placeSiegeTowers`: pola sceny wiezyczek.
#[derive(Debug, Clone, PartialEq)]
pub struct TowerSetup {
    /// `cityFortificationKind(builtBuildingIds)`.
    pub fort_kind: CityFortificationKind,
    /// `towerMaterialFor(fortKind)`; `None` = brak wiezyczek (pin `return` przed reszta).
    pub material: Option<TowerMaterial>,
    /// Wiersze wiezyczek w kolejnosci pinu (`SiegeEnv::tower_rows`, `ProdBody::siege_towers`).
    pub rows: Vec<i64>,
    /// `towerRange` (bez wiezyczek: wartosc inicjalna `DEFAULT_TOWER_MIN_RANGE`, `:2446`).
    pub tower_range: f64,
    /// Szablon strzalu `towerShooterRow` (`None` = brak strzelca = brak planowania, `:4209`).
    pub tower_shot: Option<FullBlowInput>,
    /// `String(towerShooterRow['Jednostka'] ?? 'Strzelec')` (`:4211`).
    pub shooter_nazwa: String,
}

/// `clampEra(era)` (`battleScene.ts:922-925`).
pub fn clamp_era(era: Option<f64>) -> f64 {
    match era {
        Some(e) if e.is_finite() => {
            let r = (e + 0.5).floor();
            r.clamp(1.0, 3.0)
        }
        _ => 1.0,
    }
}

/// `_placeSiegeTowers(wallCol, rLo, rHi)` (`:4158-4170`) na ukladzie muru T5a.
pub fn tower_setup_for(layout: &SiegeLayout, inp: &TowerSetupInput<'_>) -> TowerSetup {
    let fort_kind = city_fortification_kind(Some(inp.built_building_ids));
    let kind = match fort_kind {
        CityFortificationKind::Mur => FortificationKind::Mur,
        CityFortificationKind::Palisada => FortificationKind::Palisada,
        CityFortificationKind::None => FortificationKind::Inny,
    };
    let material = tower_material_for(kind);
    let Some(material) = material else {
        return TowerSetup {
            fort_kind,
            material: None,
            rows: Vec::new(),
            tower_range: DEFAULT_TOWER_MIN_RANGE,
            tower_shot: None,
            shooter_nazwa: "Strzelec".to_owned(),
        };
    };
    let row = strongest_ranged_unit_for_era(inp.units, clamp_era(inp.defender_era), inp.def_civ);
    let tower_range = tower_range_for(row, inp.params.min_range);
    let rows = tower_rows(&TowerSlotInput {
        row_lo: layout.row_lo,
        row_hi: layout.row_hi,
        gate_row_lo: layout.gate_row - 1,
        gate_row_hi: layout.gate_row,
        spacing: Some(inp.params.spacing),
    });
    let shooter_nazwa = match row.and_then(|r| r.get("Jednostka")) {
        None | Some(serde_json::Value::Null) => "Strzelec".to_owned(),
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(v) => v.to_string(),
    };
    TowerSetup {
        fort_kind,
        material: Some(material),
        rows,
        tower_range,
        tower_shot: row.map(tower_shot_from_row),
        shooter_nazwa,
    }
}

/// Pola sceny z ukladu muru (`_carveWallTiles`) i wiezyczek: wejscia `ProdBody`, `ActivateScene` i `SiegeEnv`.
#[derive(Debug, Clone, PartialEq)]
pub struct SceneInputs {
    pub wall_col: i64,
    pub gate_col: i64,
    pub gate_row: i64,
    /// `gateHp` (`> 0`, skonczone; dlug T2b N1).
    pub gate_hp: f64,
    pub gate_open: bool,
    pub wall_tile_hp: Vec<(i64, f64)>,
    pub wall_tiles_init: usize,
    pub towers: TowerSetup,
}

/// Scena z ukladu muru. Brama spoza muru, `gateHp` nie > 0 albo NaN/Inf, otwarta brama na starcie =
/// [`AdapterError::InvalidGate`] (pin: `_carveWallTiles` ustawia zawsze `gateHp = 400`, `gateOpen = false`).
pub fn scene_inputs(layout: &SiegeLayout, towers: TowerSetup) -> Result<SceneInputs, AdapterError> {
    if layout.wall_col < 0 || layout.gate_col != layout.wall_col || layout.gate_row < 0 {
        return Err(AdapterError::InvalidGate {
            what: format!(
                "wall_col {} gate_col {} gate_row {}",
                layout.wall_col, layout.gate_col, layout.gate_row
            ),
        });
    }
    if !(layout.gate_hp.is_finite() && layout.gate_hp > 0.0) || layout.gate_open {
        return Err(AdapterError::InvalidGate {
            what: format!("gate_hp {} gate_open {}", layout.gate_hp, layout.gate_open),
        });
    }
    for (row, hp) in &layout.wall_tile_hp {
        finite(*hp, || format!("wall_tile_hp row {row}"))?;
    }
    Ok(SceneInputs {
        wall_col: layout.wall_col,
        gate_col: layout.gate_col,
        gate_row: layout.gate_row,
        gate_hp: layout.gate_hp,
        gate_open: layout.gate_open,
        wall_tile_hp: layout.wall_tile_hp.clone(),
        wall_tiles_init: layout.wall_tiles_init,
        towers,
    })
}

impl SceneInputs {
    /// `ActivateScene` na starcie bitwy AUTO (`finished = false`, `_manualMode = false`). `siege_machine_range`
    /// sceny jest zastepowane wartoscia per jednostka ([`install_body_inputs`] wypelnia
    /// `ProdBody::siege_machine_range` dla kazdej jednostki), wiec tu podawana jest jawnie przez wolajacego.
    pub fn activate_scene(&self, is_player_side: bool, siege_machine_range: f64) -> ActivateScene {
        ActivateScene {
            finished: false,
            manual_mode: false,
            is_player_side,
            wall_col: self.wall_col,
            gate_open: self.gate_open,
            wall_tile_hp: self.wall_tile_hp.clone(),
            siege_machine_range,
        }
    }

    /// `siegeTowers` (`:2443`, `destroyed = false` na starcie).
    pub fn siege_towers(&self) -> Vec<SiegeTowerRef> {
        self.towers
            .rows
            .iter()
            .map(|&row| SiegeTowerRef {
                destroyed: false,
                row: row as f64,
            })
            .collect()
    }

    /// `wallTileHp.has(row)` (`SiegeEnv::wall_tile_rows`).
    pub fn wall_tile_rows(&self) -> Vec<i64> {
        self.wall_tile_hp.iter().map(|(r, _)| *r).collect()
    }
}

/// Wypelnia pola [`ProdBody`] z wejsc adaptera: scena (`siege_gate_col/row`, `siege_wall_tiles_init`, `gate_hp`,
/// `siege_towers`, `tower_range`, `tower_shooter_nazwa`) i jednostki (`names`, `siege_stats`, `range_base`,
/// `ranged_base`, `ammo_left`, `siege_machine_range`, `morale_max`, `is_army_commander`, doktryna:
/// `shooting_enabled` i `anti_cav_spear`, oraz `activate.shooting_disabled` z tego samego pola, D-B11).
/// Liczba jednostek ciala rozna od wejsc = [`AdapterError::InvariantViolated`].
pub fn install_body_inputs<R: RollSource>(
    body: &mut ProdBody<R>,
    scene: &SceneInputs,
    units: [&[BodyUnitInputs]; 2],
) -> Result<(), AdapterError> {
    for (s, list) in units.iter().enumerate() {
        if body.units[s].len() != list.len() {
            return Err(AdapterError::InvariantViolated {
                what: format!(
                    "strona {s}: cialo {} jednostek, adapter {}",
                    body.units[s].len(),
                    list.len()
                ),
            });
        }
    }
    body.siege_gate_col = scene.gate_col;
    body.siege_gate_row = scene.gate_row;
    body.siege_wall_tiles_init = scene.wall_tiles_init;
    body.gate_hp = scene.gate_hp;
    body.siege_towers = scene.siege_towers();
    body.tower_range = scene.towers.tower_range;
    body.tower_shooter_nazwa = scene.towers.shooter_nazwa.clone();
    for (s, list) in units.iter().enumerate() {
        for (i, u) in list.iter().enumerate() {
            body.names[s][i] = u.name.clone();
            body.siege_stats[s][i] = Some(u.siege_stats);
            body.range_base[s][i] = u.range_base;
            body.ranged_base[s][i] = u.ranged_base;
            body.ammo_left[s][i] = u.ammo_left;
            body.siege_machine_range[s][i] = Some(u.siege_machine_range);
            body.morale_max[s][i] = u.morale_max;
            body.is_army_commander[s][i] = u.is_army_commander;
            body.doctrine[s][i].shooting_enabled = u.shooting_enabled;
            body.doctrine[s][i].anti_cav_spear = u.anti_cav_spear;
            body.units[s][i].activate.shooting_disabled = !u.shooting_enabled;
        }
    }
    Ok(())
}
