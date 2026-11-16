//! Literals of the map token renderer, copied from `gra/src/render/units.ts`
//! at pin `07d2fbd72` (line numbers of that file unless stated otherwise).
//!
//! The geometry sizes of the shared parts (`HIGHLIGHT_RADIUS`,
//! `OWNER_RING_*`, `SELECTION_HEX_*` radii) already live in
//! [`crate::models::unit_core::consts`] and are used through
//! [`crate::models::unit_core::parts::UnitPart`]; only the values the
//! `UnitRenderer` class itself reads are here.

use std::f64::consts::PI;

use crate::pick::hex::HEX_R;

pub use crate::models::misc::build_highlight::{
    IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY, MAP_HEX_HIGHLIGHT_BASE_OPACITY,
};

/// `HUMAN_OWNER_PRIMARY` (`game/human-owners.ts:21`): default owner of
/// `setSelectionHex` and of the default ring stance (`units.ts:5850-5851`).
pub const HUMAN_OWNER_PRIMARY: i64 = 0;

/// `OWNER_COLORS` (`:239-248`): the default `ownerColorFn` palette.
pub const OWNER_COLORS: [u32; 8] = [
    0x00ff_d54a,
    0x00e5_3935,
    0x0043_a047,
    0x001e_88e5,
    0x00fb_8c00,
    0x008e_24aa,
    0x0000_acc1,
    0x00f0_6292,
];

/// `TOKEN_LIFT` (`:259`).
pub const TOKEN_LIFT: f64 = 0.01 * HEX_R;
/// `CITY_UNIT_EXTRA_LIFT` (`:262`).
pub const CITY_UNIT_EXTRA_LIFT: f64 = 0.28 * HEX_R;
/// `CITY_UNIT_OFFSET` (`:263`).
pub const CITY_UNIT_OFFSET: f64 = 0.38 * HEX_R;
/// `CITY_UNIT_OFFSET_ANGLE` (`:265`).
pub const CITY_UNIT_OFFSET_ANGLE: f64 = PI / 2.0;
/// `CITY_UNIT_SCALE` (`:266`).
pub const CITY_UNIT_SCALE: f64 = 1.22;
/// `obj.renderOrder = onCity ? 55 : 0` (`_applyCityTokenStyle`, `:6001`).
pub const CITY_UNIT_RENDER_ORDER: i32 = 55;

/// `unitTerrainRelief` hills (`:229-233`).
pub const RELIEF_WZGORZA: f64 = HEX_R * 0.22;
/// `unitTerrainRelief` mountains (`:229-233`).
pub const RELIEF_GORY: f64 = HEX_R * 0.34;

/// `STARVING_SKULL_OPACITY` (`:278`).
pub const STARVING_SKULL_OPACITY: f64 = 0.30;
/// `STARVING_SKULL_RENDER_ORDER` (`:279`).
pub const STARVING_SKULL_RENDER_ORDER: i32 = 15;
/// `SUFFER_ICON_SCALE_SINGLE = STARVING_SKULL_SCALE = 0.85` (`:277`, `:302`).
pub const SUFFER_ICON_SCALE_SINGLE: f64 = 0.85;
/// `SUFFER_ICON_SCALE_PAIR` (`:303`).
pub const SUFFER_ICON_SCALE_PAIR: f64 = 0.58;
/// `SUFFER_ICON_PAIR_DX` (`:304`).
pub const SUFFER_ICON_PAIR_DX: f64 = 0.30 * HEX_R;
/// `SUFFER_ICON_Y` (`:305`).
pub const SUFFER_ICON_Y: f64 = 0.78 * HEX_R;
/// `SUFFER_ICON_Z` (`:306`).
pub const SUFFER_ICON_Z: f64 = 0.10 * HEX_R;
/// `GOLD_DEFICIT_COIN_OPACITY` (`:313`).
pub const GOLD_DEFICIT_COIN_OPACITY: f64 = 0.46;
/// `GOLD_DEFICIT_RENDER_ORDER = STARVING_SKULL_RENDER_ORDER` (`:314`).
pub const GOLD_DEFICIT_RENDER_ORDER: i32 = STARVING_SKULL_RENDER_ORDER;

/// `HIGHLIGHT_LIFT` (`:413`).
pub const HIGHLIGHT_LIFT: f64 = 0.005 * HEX_R;
/// `HIGHLIGHT_COLOR` (`:414`).
pub const HIGHLIGHT_COLOR: u32 = 0x0066_ccff;
/// `HIGHLIGHT_OPACITY = MAP_HEX_HIGHLIGHT_BASE_OPACITY` (`:415`): the
/// default `opacity` of `setHighlight`.
pub const HIGHLIGHT_OPACITY: f64 = MAP_HEX_HIGHLIGHT_BASE_OPACITY;

/// `ROUTE_Y_LIFT` (`:418`).
pub const ROUTE_Y_LIFT: f64 = 0.06 * HEX_R;
/// `ROUTE_COLOR` (`:419`).
pub const ROUTE_COLOR: u32 = 0x00ff_e27a;
/// `ROUTE_OPACITY` (`:420`).
pub const ROUTE_OPACITY: f64 = 0.9;
/// `TUBE_RADIUS` (`:421`).
pub const TUBE_RADIUS: f64 = 0.05 * HEX_R;
/// `TUBE_SEGMENTS` (`:422`).
pub const TUBE_SEGMENTS: u32 = 64;
/// Radial segments of the route tube (`new THREE.TubeGeometry(curve,
/// TUBE_SEGMENTS, TUBE_RADIUS, 8, false)`, `:6636`).
pub const TUBE_RADIAL_SEGMENTS: u32 = 8;
/// `DOT_RADIUS` (`:423`).
pub const DOT_RADIUS: f64 = 0.07 * HEX_R;
/// `new THREE.SphereGeometry(DOT_RADIUS, 8, 6)` (`:6646`).
pub const DOT_WIDTH_SEGMENTS: u32 = 8;
/// `new THREE.SphereGeometry(DOT_RADIUS, 8, 6)` (`:6646`).
pub const DOT_HEIGHT_SEGMENTS: u32 = 6;
/// `DEST_TORUS_R` (`:424`).
pub const DEST_TORUS_R: f64 = 0.13 * HEX_R;
/// `DEST_TUBE_R` (`:425`).
pub const DEST_TUBE_R: f64 = 0.035 * HEX_R;
/// `new THREE.TorusGeometry(DEST_TORUS_R, DEST_TUBE_R, 8, 24)` (`:6657`).
pub const DEST_RADIAL_SEGMENTS: u32 = 8;
/// `new THREE.TorusGeometry(DEST_TORUS_R, DEST_TUBE_R, 8, 24)` (`:6657`).
pub const DEST_TUBULAR_SEGMENTS: u32 = 24;
/// `DEST_COLOR` (`:426`).
pub const DEST_COLOR: u32 = 0x00ff_8c00;
/// Turn number above a turn stop: `pt.y + 0.32 * HEX_R` (`:6672`).
pub const TURN_STOP_LABEL_LIFT: f64 = 0.32 * HEX_R;
/// `turnLabel` above the destination: `last.y + 0.35 * HEX_R` (`:6679`).
pub const TURN_LABEL_LIFT: f64 = 0.35 * HEX_R;
/// `sp.scale.set(0.55, 0.22, 1)` of the route label (`:6707`).
pub const PATH_LABEL_SCALE: (f64, f64) = (0.55, 0.22);
/// `sp.renderOrder = 12` of the route label (`:6708`).
pub const PATH_LABEL_RENDER_ORDER: i32 = 12;

/// `SELECTION_HEX_LIFT = ROUTE_Y_LIFT` (`:432`).
pub const SELECTION_HEX_LIFT: f64 = ROUTE_Y_LIFT;
/// `SELECTION_HEX_OPACITY` (`:434`).
pub const SELECTION_HEX_OPACITY: f64 = 0.92;

/// `OWNER_RING_OPACITY` (`:443`).
pub const OWNER_RING_OPACITY: f64 = 0.42;
/// `OWNER_RING_LIFT` (`:444`).
pub const OWNER_RING_LIFT: f64 = 0.006 * HEX_R;
/// `WAR_RING_COLOR` (`:445`).
pub const WAR_RING_COLOR: u32 = 0x00ff_4444;
/// `WAR_RING_OPACITY` (`:446`).
pub const WAR_RING_OPACITY: f64 = 0.38;
/// `WAR_RING_SCALE` (`:447`).
pub const WAR_RING_SCALE: f64 = 1.1;

/// `DEFERRED_TOKEN_OPACITY` (`:474`): opacity ceiling of a dimmed token.
pub const DEFERRED_TOKEN_OPACITY: f64 = 0.45;

/// Stack badge `×N` position on the representative
/// (`sprite.position.set(0.28 * HEX_R, 0.55 * HEX_R, 0.15 * HEX_R)`,
/// `:6300`).
pub const STACK_BADGE_POSITION: (f64, f64, f64) = (0.28 * HEX_R, 0.55 * HEX_R, 0.15 * HEX_R);
/// `sp.scale.set(0.38, 0.38, 1)` of the stack badge (`:6489`).
pub const STACK_BADGE_SCALE: f64 = 0.38;
/// `sp.renderOrder = 10` of the stack badge (`:6490`).
pub const STACK_BADGE_RENDER_ORDER: i32 = 10;
