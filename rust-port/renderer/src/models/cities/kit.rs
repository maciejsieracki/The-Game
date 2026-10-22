//! Builder helpers shared by the city files (each mirrors one web helper;
//! the web defines them per file, with identical bodies).

use std::f64::consts::PI;

use super::model::{CityGeo, CityMatId, CityModel};
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::model::NodeId;

impl CityModel {
    /// `B / CYL / CONE` body (`miasto-kamien.ts:98-136`, `miasto-braz.ts:108-146`):
    /// mesh at `(cx, cy, cz)`, `rotation.set(rx, ry, rz)` only when one of
    /// them is truthy (non-zero), `castShadow = true`.
    pub(crate) fn klocek(
        &mut self,
        g: NodeId,
        geo: CityGeo,
        c: [f64; 3],
        m: CityMatId,
        r: [f64; 3],
    ) -> NodeId {
        let id = self.mesh(g, geo, m);
        self.set_pos(id, c[0], c[1], c[2]);
        if r[0] != 0.0 || r[1] != 0.0 || r[2] != 0.0 {
            self.set_rot(id, r[0], r[1], r[2]);
        }
        self.drawable_mut(id).cast_shadow = true;
        id
    }

    /// `B(g, w, h, d, cx, cy, cz, m)` without rotation.
    pub(crate) fn b(&mut self, g: NodeId, s: [f64; 3], c: [f64; 3], m: CityMatId) -> NodeId {
        self.br(g, s, c, m, [0.0; 3])
    }

    /// `B(g, w, h, d, cx, cy, cz, m, rx, ry, rz)`.
    pub(crate) fn br(
        &mut self,
        g: NodeId,
        s: [f64; 3],
        c: [f64; 3],
        m: CityMatId,
        r: [f64; 3],
    ) -> NodeId {
        self.klocek(
            g,
            CityGeo::Box {
                w: s[0],
                h: s[1],
                d: s[2],
            },
            c,
            m,
            r,
        )
    }

    /// `CYL(g, rt, rb, h, cx, cy, cz, m, seg, rx, ry, rz)`.
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn cyl(
        &mut self,
        g: NodeId,
        rt: f64,
        rb: f64,
        h: f64,
        c: [f64; 3],
        m: CityMatId,
        seg: u32,
        r: [f64; 3],
    ) -> NodeId {
        self.klocek(
            g,
            CityGeo::Cylinder {
                rt,
                rb,
                h,
                radial: seg,
            },
            c,
            m,
            r,
        )
    }

    /// `CONE(g, r, h, cx, cy, cz, m, seg, rx, ry, rz)`.
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn cone(
        &mut self,
        g: NodeId,
        rad: f64,
        h: f64,
        c: [f64; 3],
        m: CityMatId,
        seg: u32,
        r: [f64; 3],
    ) -> NodeId {
        self.klocek(
            g,
            CityGeo::Cone {
                r: rad,
                h,
                radial: seg,
            },
            c,
            m,
            r,
        )
    }

    /// A `CircleGeometry(r, seg)` square (`plac`) laid flat:
    /// `rotation.x = -π/2`, `position.set(x, y, z)`, no shadow flags.
    pub(crate) fn plac(
        &mut self,
        g: NodeId,
        r: f64,
        seg: u32,
        c: [f64; 3],
        m: CityMatId,
    ) -> NodeId {
        let id = self.mesh(g, CityGeo::Circle { r, segments: seg }, m);
        self.tree.node(id).rot_x(-PI / 2.0);
        self.set_pos(id, c[0], c[1], c[2]);
        id
    }

    /// `mkPut(g)(obj, az, r, rot)` (`miasto-kamien.ts:449-456`): position on
    /// the azimuth ring, `rotation.y = rot`, `g.add(obj)`.
    pub(crate) fn put(&mut self, g: NodeId, obj: NodeId, az: f64, r: f64, rot: f64) {
        let (x, z) = az_xz(az, r);
        self.set_pos(obj, x, 0.0, z);
        self.set_rot_y(obj, rot);
        self.attach(g, obj);
    }

    /// Ghost `addBox(g, w, h, d, x, y, z, m)` (`bronzeCityRoblox.ts:175-183`,
    /// `stoneCityRoblox.ts:80-88`): bottom at `y`, cast + receive shadow.
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn add_box(
        &mut self,
        g: NodeId,
        w: f64,
        h: f64,
        d: f64,
        x: f64,
        y: f64,
        z: f64,
        m: CityMatId,
    ) {
        let id = self.mesh(g, CityGeo::Box { w, h, d }, m);
        self.set_pos(id, x, y + h / 2.0, z);
        let dr = self.drawable_mut(id);
        dr.cast_shadow = true;
        dr.receive_shadow = true;
    }

    /// Ghost `addCyl(g, rt, rb, h, x, y, z, m, seg)`
    /// (`bronzeCityRoblox.ts:185-192`): bottom at `y`, cast shadow only.
    #[allow(clippy::too_many_arguments)]
    pub(crate) fn add_cyl(
        &mut self,
        g: NodeId,
        rt: f64,
        rb: f64,
        h: f64,
        x: f64,
        y: f64,
        z: f64,
        m: CityMatId,
        seg: u32,
    ) {
        let id = self.mesh(
            g,
            CityGeo::Cylinder {
                rt,
                rb,
                h,
                radial: seg,
            },
            m,
        );
        self.set_pos(id, x, y + h / 2.0, z);
        self.drawable_mut(id).cast_shadow = true;
    }
}

/// `azXZ(deg, r)` (`miasto-kamien.ts:138-141`): azimuth 0 = N (-z), 90 = E (+x).
pub(crate) fn az_xz(deg: f64, r: f64) -> (f64, f64) {
    (
        r * js_sin((deg * PI) / 180.0),
        -r * js_cos((deg * PI) / 180.0),
    )
}

/// `tangRotY(deg)` = `(-deg * Math.PI) / 180`.
pub(crate) fn tang_rot_y(deg: f64) -> f64 {
    (-deg * PI) / 180.0
}

/// `kuSrodkowi(x, z)` = `Math.atan2(z, -x)`.
pub(crate) fn ku_srodkowi(x: f64, z: f64) -> f64 {
    js_atan2(z, -x)
}

/// `kuSrodkowi(azXZ(az, r))`.
pub(crate) fn ku_srodkowi_az(az: f64, r: f64) -> f64 {
    let (x, z) = az_xz(az, r);
    ku_srodkowi(x, z)
}
