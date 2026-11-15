//! `R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE`: battle start, DTO → renderer input
//! (`renderer/src/view/battle.rs`).
//!
//! Fixtures are hand-built DTOs (no engine producer exists yet). Every
//! expected value names the pin `07d2fbd72` line (`gra/src/battle/battleScene.ts`,
//! `BS`) that defines it; the expected renderer input is the one the existing
//! parity tests build "as the web" (`tests/repin3d_a5.rs:102-142`,
//! `tests/battle3d_units.rs:948-962`).
//!
//! Values the pin computes are taken from a run of the pin: [`TOWER_ROWS`] is
//! the output of the literal `towerRows` text (`gra/src/game/city-towers.ts:47-57`)
//! run in Node for the siege call `BS:4169-4173`. Values the pin only
//! carries (spawn `col`/`row`/`hp`/`morale`, which the producer reads from the
//! army) have no pin-defined number; the adapter copies them 1:1, and the
//! fixture uses distinct values so a field swap is visible.

use civ_renderer::battle::field::{BattleSceneOpts, DeploySide, TerrainGrid, BF_COLS, BF_ROWS};
use civ_renderer::battle::units::{
    build_battle_scene_with_units_fort, BattleSide, BattleUnitsOpts, FortDto, FortKind, UnitSpawn,
};
use civ_renderer::battle::TowerMaterial;
use civ_renderer::view::{self, BattleAdapterError, BattleInputs};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

/// `towerRows({ rowLo: 0, rowHi: BF_ROWS - 1, gateRowLo: siegeGateRow - 1,
/// gateRowHi: siegeGateRow, spacing })` (`BS:4169-4173`) with
/// `rLo = 0`, `rHi = BF_ROWS - 1 = 155`, `siegeGateRow = PLAY_MID_ROW = 77`
/// (`BS:4036-4046`, `BS:661-672`) and `spacing = 4`
/// (`BS:4162`, `gra/data/miasto-params.json:104-105`). Output of the pin text
/// `city-towers.ts:47-57` run with `node --experimental-strip-types`:
/// first row `rowLo + 2`, every 4th row, gate rows 76-77 skipped.
const TOWER_ROWS: [i32; 39] = [
    2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94,
    98, 102, 106, 110, 114, 118, 122, 126, 130, 134, 138, 142, 146, 150, 154,
];

fn uid(id: u64) -> vm::UnitId {
    vm::UnitId::try_new(id).unwrap()
}

/// Flat battlefield of the renderer size (`field.rs:50-52`), tile kind 0.
fn grid_dto() -> vm::BattleGridDto {
    let n = usize::try_from(BF_COLS * BF_ROWS).unwrap();
    let mut tiles = vec![0u8; n];
    // A few non-zero tiles so a reordering / truncation is visible.
    tiles[7] = 2;
    tiles[n - 1] = 3;
    vm::BattleGridDto {
        cols: BF_COLS,
        rows: BF_ROWS,
        tiles,
    }
}

#[allow(clippy::too_many_arguments)]
fn spawn_dto(
    id: u64,
    side: vm::BattleSide,
    model: &str,
    col: i32,
    row: i32,
    facing: i32,
    walk: bool,
    ammo: Option<f64>,
) -> vm::BattleUnitSpawnDto {
    vm::BattleUnitSpawnDto {
        id: uid(id),
        side,
        category: "INFANTRY".to_owned(),
        model_name: model.to_owned(),
        owner_color: if side == vm::BattleSide::Atk {
            0x00c0_3020
        } else {
            0x0020_40c0
        },
        col,
        row,
        facing,
        on_wall_walkway: walk,
        hp: 87.5,
        max_hp: 100.0,
        morale: 60.0,
        morale_max: 100.0,
        ammo_left: ammo,
        ammo_max: ammo,
    }
}

/// A siege, palisade with wooden towers, player defending in deploy mode.
fn setup_dto() -> vm::BattleSetupDto {
    vm::BattleSetupDto {
        grid: grid_dto(),
        desert_palette: true,
        siege: true,
        deploy: Some(vm::BattleSide::Def),
        siege_civ: "egipt".to_owned(),
        player_side: vm::BattleSide::Def,
        units: vec![
            // ammoCount = Infinity (BS:1444-1446) → DTO None.
            spawn_dto(11, vm::BattleSide::Atk, "Łucznik", 20, 70, 1, false, None),
            // ammoCount = 2 (Legionista pilum, BS:1439-1441).
            spawn_dto(
                12,
                vm::BattleSide::Atk,
                "Legionista",
                21,
                72,
                1,
                false,
                Some(2.0),
            ),
            spawn_dto(
                40,
                vm::BattleSide::Def,
                "Milicja",
                44,
                74,
                3,
                true,
                Some(0.0),
            ),
        ],
        fort: vm::BattleFortDto {
            kind: vm::FortKind::Palisada,
            tower_material: Some(vm::TowerMaterial::Drewno),
            tower_rows: TOWER_ROWS.to_vec(),
        },
    }
}

#[allow(clippy::too_many_arguments)]
fn spawn_web(
    id: &str,
    side: BattleSide,
    model: &str,
    col: i32,
    row: i32,
    facing: i32,
    walk: bool,
    ammo: f64,
) -> UnitSpawn {
    UnitSpawn {
        id: id.to_owned(),
        side,
        category: "INFANTRY".to_owned(),
        model_name: model.to_owned(),
        owner_color: if side == BattleSide::Atk {
            0x00c0_3020
        } else {
            0x0020_40c0
        },
        col,
        row,
        facing,
        on_wall_walkway: walk,
        hp: 87.5,
        max_hp: 100.0,
        morale: 60.0,
        morale_max: 100.0,
        ammo_left: ammo,
        ammo_max: ammo,
    }
}

/// The renderer input built "as the web" for [`setup_dto`].
fn expected() -> BattleInputs {
    let g = grid_dto();
    BattleInputs {
        opts: BattleUnitsOpts {
            field: BattleSceneOpts {
                // `_buildBattlefield(opts.teren)` (BS:3478).
                grid: TerrainGrid::new(g.cols, g.rows, g.tiles),
                // `this._desertPalette = terrainPreset.desertPalette` (BS:2782).
                desert_palette: true,
                // `if (opts.siege)` (BS:3479).
                siege: true,
                // `_deployMode = opts.deploy === true`, `deployPlayerSide` (BS:3484-3485).
                deploy: Some(DeploySide::Def),
            },
            // `(opts.siege.defCiv ?? opts.siege.civ) ?? 'rzym'` (BS:3480).
            siege_civ: "egipt".to_owned(),
            // `_playerControlSide()` = `_deployPlayerSideOpt` (BS:12396-12397).
            player_side: BattleSide::Def,
            // `ammoLeft: ammo0, ammoMax: ammo0` (BS:4553-4554), `ammo0 = ammoCount(bu)` (BS:4512).
            units: vec![
                spawn_web(
                    "11",
                    BattleSide::Atk,
                    "Łucznik",
                    20,
                    70,
                    1,
                    false,
                    f64::INFINITY,
                ),
                spawn_web("12", BattleSide::Atk, "Legionista", 21, 72, 1, false, 2.0),
                spawn_web("40", BattleSide::Def, "Milicja", 44, 74, 3, true, 0.0),
            ],
        },
        fort: FortDto {
            // `this.fortKind` (BS:2440, :2741).
            kind: FortKind::Palisada,
            // `towerMaterialFor(this.fortKind)` (BS:4160).
            tower_material: Some(TowerMaterial::Drewno),
            // `towerRows({...})` (BS:4169-4173), pin output [`TOWER_ROWS`].
            tower_rows: TOWER_ROWS.to_vec(),
        },
    }
}

// ------------------------------------------------------------ inputs

#[test]
fn setup_maps_to_web_inputs() {
    let got = view::battle_inputs(&setup_dto()).expect("valid DTO");
    assert_eq!(got, expected());
}

#[test]
fn battle_view_uses_setup() {
    let v = vm::BattleViewDto { setup: setup_dto() };
    assert_eq!(view::battle_view_inputs(&v).unwrap(), expected());
}

#[test]
fn ammo_none_is_infinity() {
    // `return Infinity; // blank / non-numeric -> unlimited` (BS:1446).
    let a = view::ammo(None);
    assert!(a.is_infinite() && a > 0.0, "None → +Infinity, got {a}");
    assert_eq!(view::ammo(Some(2.0)).to_bits(), 2.0f64.to_bits());
    // `Math.max(0, Math.floor(n))` (BS:1448) can be 0: 0 stays 0, not Infinity.
    assert_eq!(view::ammo(Some(0.0)).to_bits(), 0.0f64.to_bits());

    let got = view::battle_inputs(&setup_dto()).unwrap();
    let u = &got.opts.units[0];
    assert!(u.ammo_left.is_infinite() && u.ammo_left > 0.0);
    assert!(u.ammo_max.is_infinite() && u.ammo_max > 0.0);
    assert_eq!(got.opts.units[1].ammo_left, 2.0);
    assert_eq!(got.opts.units[2].ammo_max, 0.0);
}

#[test]
fn ammo_null_from_json_is_infinity() {
    // `JSON.stringify(Infinity) === 'null'`: the wire form of "unlimited".
    let mut json = serde_json::to_value(setup_dto()).unwrap();
    assert!(json["units"][0]["ammoLeft"].is_null());
    json["units"][1]["ammoMax"] = serde_json::Value::Null;
    let dto: vm::BattleSetupDto = serde_json::from_value(json).unwrap();
    let got = view::battle_inputs(&dto).unwrap();
    assert_eq!(got.opts.units[0].ammo_left, f64::INFINITY);
    assert_eq!(got.opts.units[1].ammo_left, 2.0);
    assert_eq!(got.opts.units[1].ammo_max, f64::INFINITY);
}

#[test]
fn fort_present_is_one_to_one() {
    for (kind, material, rows, want_kind, want_mat) in [
        (
            vm::FortKind::Palisada,
            Some(vm::TowerMaterial::Drewno),
            vec![66, 70],
            FortKind::Palisada,
            Some(TowerMaterial::Drewno),
        ),
        (
            vm::FortKind::Mur,
            Some(vm::TowerMaterial::Kamien),
            vec![64, 68, 82, 86, 90],
            FortKind::Mur,
            Some(TowerMaterial::Kamien),
        ),
    ] {
        let dto = vm::BattleFortDto {
            kind,
            tower_material: material,
            tower_rows: rows.clone(),
        };
        assert_eq!(
            view::battle_fort(&dto),
            FortDto {
                kind: want_kind,
                tower_material: want_mat,
                tower_rows: rows,
            }
        );
    }
}

#[test]
fn fort_none_is_web_none() {
    // `fortKind = 'none'`, `towerMaterialFor('none') === null` (BS:4160-4161).
    let dto = vm::BattleFortDto {
        kind: vm::FortKind::None,
        tower_material: None,
        tower_rows: Vec::new(),
    };
    assert_eq!(view::battle_fort(&dto), FortDto::none());
}

#[test]
fn sides_are_not_swapped() {
    let mut s = setup_dto();
    let got = view::battle_inputs(&s).unwrap();
    assert_eq!(got.opts.player_side, BattleSide::Def);
    assert_eq!(got.opts.field.deploy, Some(DeploySide::Def));
    let sides: Vec<_> = got.opts.units.iter().map(|u| u.side).collect();
    assert_eq!(sides, [BattleSide::Atk, BattleSide::Atk, BattleSide::Def]);

    s.player_side = vm::BattleSide::Atk;
    s.deploy = Some(vm::BattleSide::Atk);
    let got = view::battle_inputs(&s).unwrap();
    assert_eq!(got.opts.player_side, BattleSide::Atk);
    assert_eq!(got.opts.field.deploy, Some(DeploySide::Atk));

    s.deploy = None;
    assert_eq!(view::battle_inputs(&s).unwrap().opts.field.deploy, None);
}

#[test]
fn spawn_order_is_kept() {
    let ids: Vec<_> = view::battle_inputs(&setup_dto())
        .unwrap()
        .opts
        .units
        .into_iter()
        .map(|u| u.id)
        .collect();
    assert_eq!(ids, ["11", "12", "40"]);
}

/// A field battle (no siege, no fort, no deploy), attacker side for the
/// player: the non-siege vector, full equality with the web-built input.
#[test]
fn field_battle_maps_to_web_inputs() {
    let mut s = setup_dto();
    // `opts.siege` absent → `siege: false` (BS:3479); the wall civ is never
    // read (BS:3480), the producer still sends its resolved key.
    s.siege = false;
    s.siege_civ = "rzym".to_owned();
    // `opts.deploy` absent → `_deployMode = false` (BS:3484);
    // `deployPlayerSide ?? 'atk'` (BS:3485) is still the player side.
    s.deploy = None;
    s.player_side = vm::BattleSide::Atk;
    s.desert_palette = false;
    // `fortKind = 'none'`, `towerMaterialFor('none') === null` (BS:4160-4161).
    s.fort = vm::BattleFortDto {
        kind: vm::FortKind::None,
        tower_material: None,
        tower_rows: Vec::new(),
    };

    let mut want = expected();
    want.opts.field.siege = false;
    want.opts.field.deploy = None;
    want.opts.field.desert_palette = false;
    want.opts.siege_civ = "rzym".to_owned();
    want.opts.player_side = BattleSide::Atk;
    want.fort = FortDto::none();

    let got = view::battle_inputs(&s).expect("valid field battle");
    assert_eq!(got, want);
    assert!(!got.opts.field.siege);

    let a = build_battle_scene_with_units_fort(got.opts, &got.fort);
    assert!(a.wall.is_none(), "no siege → no wall");
}

// ------------------------------------------------------------ errors

#[test]
fn grid_of_wrong_size_is_an_error() {
    let mut s = setup_dto();
    s.grid.tiles.pop();
    let n = s.grid.tiles.len();
    assert_eq!(
        view::battle_inputs(&s),
        Err(BattleAdapterError::GridSize {
            cols: BF_COLS,
            rows: BF_ROWS,
            tiles: n,
        })
    );

    let mut s = setup_dto();
    s.grid = vm::BattleGridDto {
        cols: -1,
        rows: -1,
        tiles: vec![0],
    };
    assert_eq!(
        view::battle_inputs(&s),
        Err(BattleAdapterError::GridSize {
            cols: -1,
            rows: -1,
            tiles: 1,
        })
    );
}

#[test]
fn siege_without_civ_is_an_error() {
    let mut s = setup_dto();
    s.siege_civ = String::new();
    assert_eq!(
        view::battle_inputs(&s),
        Err(BattleAdapterError::MissingSiegeCiv)
    );
    // Without a siege the web never reads the wall civ (BS:3479-3480).
    s.siege = false;
    let got = view::battle_inputs(&s).expect("no siege, no wall civ needed");
    assert!(!got.opts.field.siege);
    assert_eq!(got.opts.siege_civ, "");
}

#[test]
fn deploy_side_other_than_player_side_is_an_error() {
    // `_deployPlayerSideOpt` is both the deploy side (BS:3485) and
    // `_playerControlSide()` (BS:12396-12397): the web cannot split them.
    let mut s = setup_dto();
    s.deploy = Some(vm::BattleSide::Atk);
    s.player_side = vm::BattleSide::Def;
    assert_eq!(
        view::battle_inputs(&s),
        Err(BattleAdapterError::DeploySideMismatch {
            deploy: vm::BattleSide::Atk,
            player_side: vm::BattleSide::Def,
        })
    );
    s.deploy = Some(vm::BattleSide::Def);
    s.player_side = vm::BattleSide::Atk;
    assert_eq!(
        view::battle_inputs(&s),
        Err(BattleAdapterError::DeploySideMismatch {
            deploy: vm::BattleSide::Def,
            player_side: vm::BattleSide::Atk,
        })
    );
    // No deploy: any player side is valid (`deployPlayerSide ?? 'atk'`).
    s.deploy = None;
    assert!(view::battle_inputs(&s).is_ok());
}

// ------------------------------------------------------------ scene

#[test]
fn scene_from_adapter_equals_scene_from_web_inputs() {
    let got = view::battle_inputs(&setup_dto()).unwrap();
    let want = expected();
    let a = build_battle_scene_with_units_fort(got.opts, &got.fort);
    let b = build_battle_scene_with_units_fort(want.opts, &want.fort);
    assert_eq!(a.atk.len(), 2);
    assert_eq!(a.def.len(), 1);
    assert_eq!(a.player_side, BattleSide::Def);
    let wall = a.wall.as_ref().expect("siege wall");
    assert_eq!(wall.fort_kind, FortKind::Palisada);
    assert_eq!(
        wall.towers.len(),
        TOWER_ROWS.len(),
        "one tower per towerRows entry"
    );
    assert!(a == b, "adapter scene differs from the web-input scene");
}
