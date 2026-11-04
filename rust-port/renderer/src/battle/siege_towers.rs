//! REPIN-3D A2 (`dyspozycje/rust-port/p4/P4-REPIN-3D.md` §2.1 #9, §2.2): the
//! shooting towers on the perimeter of the city wall / palisade of the
//! current web (`origin/main`, R-WEB-PALISADE-BATTLE-WALL-RULES-Q1 R4).
//!
//! - [`build_wall_tower`] = `buildWallTower(material, tileSize, wallHeight)`
//!   (`battle/siegeWall.ts:1102-1185`): the tower model, stone (`'kamien'`,
//!   wall) or wood (`'drewno'`, palisade), origin = centre of the base on the
//!   ground, plus `userData.towerHeight` / `towerTopY`.
//! - [`place_siege_towers`] = the scene part of
//!   `BattleScene._placeSiegeTowers(wallCol, rLo, rHi)`
//!   (`battle/battleScene.ts:4053-4086`): one `tower.clone(true)` per tower
//!   row at `(cellToWorld(wallCol, row).x − TILE_S · 0.5, 0, z)`, appended to
//!   the scene root, recorded as `{ row, mesh, destroyed: false }`.
//!
//! The battle logic the web calls there (`towerMaterialFor`, `towerRows`,
//! `strongestRangedUnitForEra`, `towerRangeFor` of `game/city-towers.ts`,
//! `miasto-params.json` spacing) is P6.13: the material and the rows come in
//! as a DTO ([`TowerMaterial`] / `rows`), exactly what the web computed
//! (ASSUMPTION Z-RP-A2-1 in the document). Breaking a tower
//! (`_destroyTowerAtRow`) and its shot (`_fireOneTower`) are batch A3.

use std::f64::consts::PI;

use crate::jsmath::{js_cos, js_sin};
use crate::models::units_kamien::kit::euler_from_quat;
use crate::scene::{MatId, Material, NodeId, NodeKind, Prim, Scene, UserValue, ROOT};

use super::field::{cell_to_world, TILE_S};
use super::siege_wall::{WALL_METALNESS, WALL_ROUGHNESS};

/// The wall height `_placeSiegeTowers` passes to `buildWallTower`
/// (`battleScene.ts:4069`, = the `height` of `_placeSiegeWall`).
pub const TOWER_WALL_HEIGHT: f64 = 2.5;

/// `TowerMaterial` (`game/city-towers.ts:20`): `'drewno'` (palisade) or
/// `'kamien'` (wall). Any other string takes the wooden branch of
/// `buildWallTower` (`material === 'kamien'` test); the type admits only
/// these two.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum TowerMaterial {
    /// `'drewno'`.
    Drewno,
    /// `'kamien'`.
    Kamien,
}

impl TowerMaterial {
    /// The web string.
    #[must_use]
    pub const fn web_id(self) -> &'static str {
        match self {
            Self::Drewno => "drewno",
            Self::Kamien => "kamien",
        }
    }
}

/// A built tower: the group as a scene tree (its `userData` is also on the
/// root node: `towerHeight`, `towerTopY`).
#[derive(Debug, Clone, PartialEq)]
pub struct WallTower {
    /// The tower `THREE.Group` (root, identity transform) and its meshes.
    pub scene: Scene,
    /// `userData.towerHeight` (`wallHeight · 1.75`).
    pub tower_height: f64,
    /// `userData.towerTopY` (`H + H · 0.1`).
    pub tower_top_y: f64,
}

/// One entry of `this.siegeTowers` (`battleScene.ts:2395`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct SiegeTower {
    /// Wall tile row.
    pub row: i32,
    /// The clone in the battle scene (`null` is never stored by
    /// `_placeSiegeTowers`).
    pub mesh: Option<NodeId>,
    /// `destroyed` (`false` at placement; A3 sets it).
    pub destroyed: bool,
}

struct T {
    m: Scene,
}

impl T {
    /// `mk(c)` of `siegeWall.ts:34-40` (no `side`).
    fn mk(&mut self, c: u32) -> MatId {
        self.m
            .add_material(Material::standard(c, WALL_METALNESS, WALL_ROUGHNESS))
    }

    /// `new THREE.Mesh(geo, mat)` + `position.set(x, y, z)` + `g.add(mesh)`.
    fn mesh(&mut self, geo: Prim, mat: MatId, x: f64, y: f64, z: f64) -> NodeId {
        let id = self.m.mesh(ROOT, geo, mat);
        self.m.node(id).set_pos(x, y, z);
        id
    }

    /// Same, with `castShadow = true`.
    fn cast(&mut self, geo: Prim, mat: MatId, x: f64, y: f64, z: f64) -> NodeId {
        let id = self.mesh(geo, mat, x, y, z);
        self.m.cast_shadow(id);
        id
    }
}

/// The 8 merlon / 4 corner offsets of `buildWallTower` (`:1129`, `:1150`).
const MERLONS: [(f64, f64); 8] = [
    (-1.0, -1.0),
    (1.0, -1.0),
    (-1.0, 1.0),
    (1.0, 1.0),
    (0.0, -1.0),
    (0.0, 1.0),
    (-1.0, 0.0),
    (1.0, 0.0),
];
const CORNERS: [(f64, f64); 4] = [(-1.0, -1.0), (1.0, -1.0), (-1.0, 1.0), (1.0, 1.0)];

/// `buildWallTower(material, tileSize, wallHeight)` (`origin/main`
/// `siegeWall.ts:1102-1185`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_wall_tower(material: TowerMaterial, tile_size: f64, wall_height: f64) -> WallTower {
    let mut g = T { m: Scene::new() };
    let t = tile_size;
    let h = wall_height * 1.75;
    let w = t * 0.55;
    match material {
        TowerMaterial::Kamien => {
            let stone = g.mk(0x8a_8478);
            let stone_dk = g.mk(0x6f_6a60);
            let slit = g.mk(0x1c_1a17);
            let body = g.mesh(Prim::bx(w, h, w), stone, 0.0, h / 2.0, 0.0);
            g.m.shadows(body, true, true);
            g.cast(
                Prim::bx(w * 1.3, h * 0.08, w * 1.3),
                stone_dk,
                0.0,
                h + h * 0.04,
                0.0,
            );
            let (m_h, m_w) = (h * 0.1, w * 0.3);
            for (cx, cz) in MERLONS {
                g.cast(
                    Prim::bx(m_w, m_h, m_w),
                    stone,
                    cx * w * 0.6,
                    h + h * 0.08 + m_h / 2.0,
                    cz * w * 0.6,
                );
            }
            for sz in [-1.0, 1.0] {
                g.mesh(
                    Prim::bx(w * 0.12, h * 0.2, w * 0.05),
                    slit,
                    0.0,
                    h * 0.78,
                    sz * (w / 2.0 + 0.01),
                );
            }
            g.mesh(
                Prim::bx(w * 0.05, h * 0.2, w * 0.12),
                slit,
                -(w / 2.0 + 0.01),
                h * 0.78,
                0.0,
            );
        }
        TowerMaterial::Drewno => {
            let wood = g.mk(0x7a_5230);
            let wood_dk = g.mk(0x4d_3119);
            let roof_m = g.mk(0x6a_4a28);
            let leg_geo = Prim::cyl(w * 0.07, w * 0.1, h, 6);
            for (cx, cz) in CORNERS {
                g.cast(leg_geo, wood, cx * w * 0.42, h / 2.0, cz * w * 0.42);
            }
            for y in [h * 0.35, h * 0.65] {
                for sz in [-1.0, 1.0] {
                    g.mesh(
                        Prim::bx(w * 0.9, h * 0.03, w * 0.04),
                        wood_dk,
                        0.0,
                        y,
                        sz * w * 0.42,
                    );
                    g.mesh(
                        Prim::bx(w * 0.04, h * 0.03, w * 0.9),
                        wood_dk,
                        sz * w * 0.42,
                        y,
                        0.0,
                    );
                }
            }
            g.cast(Prim::bx(w * 1.25, h * 0.06, w * 1.25), wood_dk, 0.0, h, 0.0);
            let rail_geo = Prim::cyl(w * 0.02, w * 0.045, h * 0.22, 5);
            for i in 0..12u32 {
                let a = (f64::from(i) / 12.0) * PI * 2.0;
                g.mesh(
                    rail_geo,
                    wood,
                    js_cos(a) * w * 0.6,
                    h + h * 0.14,
                    js_sin(a) * w * 0.6,
                );
            }
            g.cast(
                Prim::cone(w * 0.85, h * 0.32, 6),
                roof_m,
                0.0,
                h + h * 0.03 + h * 0.5,
                0.0,
            );
            for (cx, cz) in CORNERS {
                g.mesh(
                    Prim::cyl(w * 0.025, w * 0.03, h * 0.5, 5),
                    wood_dk,
                    cx * w * 0.5,
                    h + h * 0.28,
                    cz * w * 0.5,
                );
            }
        }
    }
    let top = h + h * 0.1;
    let ud = g.m.user_data(ROOT);
    ud.set("towerHeight", UserValue::Num(h));
    ud.set("towerTopY", UserValue::Num(top));
    WallTower {
        scene: g.m,
        tower_height: h,
        tower_top_y: top,
    }
}

/// `tower.clone(true)` appended to `scene`'s root: a deep copy of the nodes
/// that SHARES the materials of the first copy (three's `clone` keeps
/// `material` references; `shared` holds the first copy's material base).
/// `userData` is copied as-is (three: `JSON.parse(JSON.stringify(…))`; the
/// game values `towerHeight` 4.375 / `towerTopY` 4.8125 are finite, so the
/// JSON round trip is the identity — ASSUMPTION Z-RP-A2-3).
///
/// Web quirk kept 1:1 (measured, `a2.json`): `Object3D.copy` does
/// `quaternion.copy(source.quaternion)`, whose change callback re-derives
/// `rotation` from the quaternion (`Euler.setFromQuaternion`): an identity
/// quaternion gives the Euler `(−0, 0, −0)` (`atan2(−0, 1)`), so every cloned
/// node carries `rotation = euler_from_quat(quaternion)`, not the source
/// Euler (the matrices are unchanged; `dumpTree` hashes the Euler).
fn graft_clone(scene: &mut Scene, tpl: &Scene, shared: &mut Option<MatId>) -> NodeId {
    let before = scene.materials.len();
    let root = scene.graft(ROOT, tpl.clone());
    for n in &mut scene.nodes[root..] {
        n.rotation = euler_from_quat(n.quaternion);
    }
    match *shared {
        None => *shared = Some(before),
        Some(base) => {
            for n in &mut scene.nodes[root..] {
                match &mut n.kind {
                    NodeKind::Mesh(d) | NodeKind::LineLoop(d) => {
                        for s in &mut d.materials {
                            *s = *s - before + base;
                        }
                    }
                    NodeKind::Sprite(s) => *s = *s - before + base,
                    NodeKind::Group | NodeKind::Object3D => {}
                }
            }
            scene.materials.truncate(before);
        }
    }
    root
}

/// `_placeSiegeTowers(wallCol, rLo, rHi)` (`battleScene.ts:4053-4086`),
/// scene part. `material` = `towerMaterialFor(this.fortKind)` (`None` =
/// `null`: no tower, empty list), `rows` = `towerRows({ rowLo, rowHi,
/// gateRowLo, gateRowHi, spacing })` — both DTO computed by the battle
/// logic. Every tower is a clone of ONE `buildWallTower(material, TILE_S,
/// 2.5)` at `(x − TILE_S · 0.5, 0, z)` of `cellToWorld(wallCol, row)`.
pub fn place_siege_towers(
    scene: &mut Scene,
    wall_col: i32,
    material: Option<TowerMaterial>,
    rows: &[i32],
) -> Vec<SiegeTower> {
    let Some(material) = material else {
        return Vec::new();
    };
    let tower = build_wall_tower(material, TILE_S, TOWER_WALL_HEIGHT);
    let mut shared = None;
    let mut out = Vec::with_capacity(rows.len());
    for &row in rows {
        let mesh = graft_clone(scene, &tower.scene, &mut shared);
        let (x, z) = cell_to_world(f64::from(wall_col), f64::from(row));
        scene.nodes[mesh].set_pos(x - TILE_S * 0.5, 0.0, z);
        out.push(SiegeTower {
            row,
            mesh: Some(mesh),
            destroyed: false,
        });
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn clones_share_the_first_copy_materials() {
        let mut s = Scene::new();
        let t = place_siege_towers(&mut s, 3, Some(TowerMaterial::Kamien), &[2, 6, 10]);
        assert_eq!(t.len(), 3);
        assert_eq!(s.materials.len(), 3, "one set of 3 tower materials");
        let mats = |root: NodeId| -> Vec<MatId> {
            s.traverse_from(root)
                .into_iter()
                .filter_map(|n| s.nodes[n].mesh().map(|m| m.material()))
                .collect()
        };
        let a = mats(t[0].mesh.expect("mesh"));
        assert_eq!(a, mats(t[1].mesh.expect("mesh")));
        assert_eq!(a, mats(t[2].mesh.expect("mesh")));
        assert!(place_siege_towers(&mut s, 3, None, &[2]).is_empty());
        assert!(place_siege_towers(&mut s, 3, Some(TowerMaterial::Drewno), &[]).is_empty());
        assert_eq!(s.materials.len(), 3, "no tower, no material");
    }
}
