//! `render/tradeRoutesOverlay.ts` (web `edb8fb56`, 101 LOC): one quadratic
//! Bézier arc (`THREE.Line`, 29 points) per active trade route between the
//! two city hexes, coloured by medium. CPU geometry only.

use super::model::{MatKind, MiscMaterial};
use super::overlay::{buffer_geometry, OverlayGroup, OverlayKind, OverlayMap, OverlayObject};
use crate::jsmath::js_hypot;
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::three::{js_max, js_min};

/// `TradeRouteOverlayInput.medium`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TradeMedium {
    /// `'lad'` (land, caravan).
    Lad,
    /// `'morze'` (sea).
    Morze,
}

/// `TradeRouteOverlayInput` (`tradeRoutesOverlay.ts:18-24`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TradeRouteOverlayInput {
    /// `fromQ`.
    pub from_q: i32,
    /// `fromR`.
    pub from_r: i32,
    /// `toQ`.
    pub to_q: i32,
    /// `toR`.
    pub to_r: i32,
    /// `medium`.
    pub medium: TradeMedium,
}

/// `LAND_COLOR` (`:26`).
pub const LAND_COLOR: u32 = 0xd9_a441;
/// `SEA_COLOR` (`:27`).
pub const SEA_COLOR: u32 = 0x49_b6e0;
/// `LINE_OPACITY` (`:28`).
pub const LINE_OPACITY: f64 = 0.85;
/// `ARC_SEGMENTS` (`:29`).
pub const ARC_SEGMENTS: u32 = 28;
/// `ARC_HEIGHT_PER_WORLD_UNIT` (`:31`).
pub const ARC_HEIGHT_PER_WORLD_UNIT: f64 = 0.05;
/// `ARC_HEIGHT_MAX` (`:32`).
pub const ARC_HEIGHT_MAX: f64 = 1.6;
/// `ARC_HEIGHT_MIN` (`:33`).
pub const ARC_HEIGHT_MIN: f64 = 0.18;
/// `BASE_LIFT` (`:35`).
pub const BASE_LIFT: f64 = 0.05;

/// `QuadraticBezier(t, p0, p1, p2)` (three r169 `Interpolations.js:18-42`).
#[must_use]
pub fn quadratic_bezier(t: f64, p0: f64, p1: f64, p2: f64) -> f64 {
    let k = 1.0 - t;
    k * k * p0 + 2.0 * (1.0 - t) * t * p1 + t * t * p2
}

/// The 29 arc points of one route (`buildRouteArc`, `:43-61`:
/// `QuadraticBezierCurve3(...).getPoints(ARC_SEGMENTS)`), in double
/// precision (before the `Float32` attribute).
#[must_use]
pub fn route_arc_points(map: &OverlayMap, route: &TradeRouteOverlayInput) -> Vec<[f64; 3]> {
    let (ax, az) = axial_to_world(
        HexCoord {
            q: route.from_q,
            r: route.from_r,
        },
        HEX_R,
    );
    let (bx, bz) = axial_to_world(
        HexCoord {
            q: route.to_q,
            r: route.to_r,
        },
        HEX_R,
    );
    let ay = map.hex_top_y((route.from_q, route.from_r), BASE_LIFT);
    let by = map.hex_top_y((route.to_q, route.to_r), BASE_LIFT);
    let dist = js_hypot(bx - ax, bz - az);
    let bump = js_min(
        ARC_HEIGHT_MAX,
        js_max(ARC_HEIGHT_MIN, dist * ARC_HEIGHT_PER_WORLD_UNIT),
    );
    let mx = (ax + bx) * 0.5;
    let mz = (az + bz) * 0.5;
    let my = js_max(ay, by) + bump;
    (0..=ARC_SEGMENTS)
        .map(|d| {
            let t = f64::from(d) / f64::from(ARC_SEGMENTS);
            [
                quadratic_bezier(t, ax, mx, bx),
                quadratic_bezier(t, ay, my, by),
                quadratic_bezier(t, az, mz, bz),
            ]
        })
        .collect()
}

/// `buildTradeRoutesOverlayGroup(map, routes)` (`:77-87`).
#[must_use]
pub fn build_trade_routes_overlay_group(
    map: &OverlayMap,
    routes: &[TradeRouteOverlayInput],
) -> OverlayGroup {
    let mut group = OverlayGroup {
        name: "trade-routes-overlay".to_owned(),
        objects: Vec::new(),
    };
    for route in routes {
        let pts: Vec<f64> = route_arc_points(map, route).into_iter().flatten().collect();
        let color = match route.medium {
            TradeMedium::Morze => SEA_COLOR,
            TradeMedium::Lad => LAND_COLOR,
        };
        let mut mat = MiscMaterial::new(MatKind::LineBasic, color);
        mat.transparent = true;
        mat.opacity = LINE_OPACITY;
        mat.depth_write = false;
        let mut o = OverlayObject::new(OverlayKind::Line, mat, buffer_geometry(&pts, None));
        o.render_order = 7;
        o.frustum_culled = false;
        group.objects.push(o);
    }
    group
}
