//! `render/hexShape.ts` (web `edb8fb56`, 32 LOC): the pointy-top hex outline
//! shared by `units.ts`, `cityMapOutline.ts` and the map cylinders.
//!
//! The 2D path type is the existing [`crate::geom::Path2`] (P4.8), so a hex
//! outline can go straight into `shape_geometry` / `extrude_geometry`.

use std::f64::consts::PI;

use crate::geom::{Path2, Vec3};

/// Angle of corner `i` (`Math.PI / 2 + (i * Math.PI) / 3`, same operation
/// order as `hexShape.ts:10` and `:25`).
fn corner_angle(i: u32) -> f64 {
    PI / 2.0 + (f64::from(i) * PI) / 3.0
}

/// `hexRingPointsXZ(R, y = 0)` (`hexShape.ts:7-14`): the 6 corners in the
/// XZ plane, starting at +Z (`angle = π/2`) and turning by 60°.
#[must_use]
pub fn hex_ring_points_xz(radius: f64, y: f64) -> [Vec3; 6] {
    let mut out = [Vec3::default(); 6];
    for (i, v) in (0u32..).zip(out.iter_mut()) {
        let angle = corner_angle(i);
        *v = Vec3::new(radius * angle.cos(), y, radius * angle.sin());
    }
    out
}

/// `appendPointyTopHex(path, radius, reverse)` (`hexShape.ts:17-32`): appends
/// the outline in the XY plane (`moveTo` the first corner, `lineTo` the other
/// five, `closePath`). `reverse` walks the corners 5 → 0 (a hole winding).
pub fn append_pointy_top_hex(path: &mut Path2, radius: f64, reverse: bool) {
    const FORWARD: [u32; 6] = [0, 1, 2, 3, 4, 5];
    const BACKWARD: [u32; 6] = [5, 4, 3, 2, 1, 0];
    let order = if reverse { BACKWARD } else { FORWARD };
    for (j, &i) in order.iter().enumerate() {
        let angle = corner_angle(i);
        let x = radius * angle.cos();
        let y = radius * angle.sin();
        if j == 0 {
            path.move_to(x, y);
        } else {
            path.line_to(x, y);
        }
    }
    path.close_path();
}
