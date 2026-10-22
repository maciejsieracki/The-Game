//! `addRobloxSkyDecor(scene, cx, cz, span, lite)` (`render/robloxCity.ts:270-294`,
//! web `edb8fb56`) — the only live export of `robloxCity.ts`
//! (`scene.ts:73,3071`). `buildRobloxCity` / `buildRobloxRomeCity` are dead in
//! practice (only importer: the dead `robloxScene.ts`) and stay out of this
//! port until D-MOD-2 is decided (`P4-4-MODEL-CATALOG.md` §6).
//!
//! The web adds the cloud groups straight to the scene; here they are the
//! children of the returned model's root, in the same order. All puffs share
//! one `IcosahedronGeometry(1, 0)` and one transparent flat Lambert material.

use super::model::{MatKind, MiscMaterial, MiscModel};
use crate::core::bronze::rnd;
use crate::models::unit_core::model::Prim;

/// Number of clouds (`lite ? 14 : 36`, `robloxCity.ts:278`).
#[must_use]
pub const fn sky_cloud_count(lite: bool) -> u32 {
    if lite {
        14
    } else {
        36
    }
}

/// `addRobloxSkyDecor(scene, cx, cz, span, lite)`: the clouds as children of
/// the model root (the scene stand-in).
#[must_use]
pub fn add_roblox_sky_decor(cx: f64, cz: f64, span: f64, lite: bool) -> MiscModel {
    let mut m = MiscModel::new();
    let scene = m.root();
    let mut cloud = MiscMaterial::new(MatKind::Lambert, 0xff_ffff);
    cloud.flat_shading = true;
    cloud.transparent = true;
    cloud.opacity = 0.9;
    let cloud_mat = m.mat(cloud);
    let puff = Prim::Icosahedron { r: 1.0, detail: 0 };
    for i in 0..sky_cloud_count(lite) {
        let n = f64::from(i);
        let g = m.detached_group();
        let bx = cx + (rnd(n, 99.0) - 0.5) * span * 1.5;
        let bz = cz + (rnd(n, 77.0) - 0.5) * span * 1.5;
        let by = 2.5 + rnd(n, 55.0) * 4.0 + span * 0.08;
        let scale = 1.4 + rnd(n, 33.0) * 2.8;
        for p in 0..5_u32 {
            let pf = f64::from(p);
            let id = m.mesh(g, puff, cloud_mat);
            m.node(id)
                .set_scale_scalar(scale * (0.7 + rnd(n, pf) * 0.5));
            m.node(id).set_pos(
                (pf - 2.0) * scale * 0.55,
                rnd(n, pf + 10.0) * 0.35,
                rnd(n, pf + 20.0) * 0.45,
            );
        }
        m.node(g).set_pos(bx, by, bz);
        m.attach(scene, g);
    }
    m
}
