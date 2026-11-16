//! The three map overlays of `UnitRenderer` that are not tokens
//! (`gra/src/render/units.ts` @ `07d2fbd72`): the hex highlight discs
//! (`setHighlight`, `:6524-6556`), the selected-army ring
//! (`setSelectionHex`, `:6571-6591`) and the movement route
//! (`setPathRoute`, `:6608-6684`).

use std::f64::consts::PI;
use std::sync::Arc;

use super::consts::{
    DEST_COLOR, DEST_RADIAL_SEGMENTS, DEST_TORUS_R, DEST_TUBE_R, DEST_TUBULAR_SEGMENTS,
    DOT_HEIGHT_SEGMENTS, DOT_RADIUS, DOT_WIDTH_SEGMENTS, HIGHLIGHT_COLOR, HIGHLIGHT_LIFT,
    PATH_LABEL_RENDER_ORDER, PATH_LABEL_SCALE, ROUTE_COLOR, ROUTE_OPACITY, ROUTE_Y_LIFT,
    SELECTION_HEX_LIFT, SELECTION_HEX_OPACITY, TUBE_RADIAL_SEGMENTS, TUBE_RADIUS, TUBE_SEGMENTS,
    TURN_LABEL_LIFT, TURN_STOP_LABEL_LIFT,
};
use crate::geom::{tube_geometry, CatmullRomCurve3, CurveType, Vec3};
use crate::models::unit_core::parts::UnitPart;
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::scene::{Geo, Geometry, Material, MeshData, NodeId, NodeKind, Prim, Scene, Side, ROOT};

/// Discs of `setHighlight` (`:6524-6556`): one group, one shared
/// `MeshBasicMaterial`, one `getGeoHighlight()` disc per hex.
#[derive(Clone, Debug, PartialEq)]
pub struct HighlightLayer {
    /// Root = the `THREE.Group`; children = the discs, in `Set` order.
    pub scene: Scene,
    /// Hexes of the discs (the `Set` of keys, first occurrence kept).
    pub hexes: Vec<HexCoord>,
    /// `opacity` argument.
    pub opacity: f64,
}

impl HighlightLayer {
    /// `setHighlight(hexes, opacity)` body after `clearHighlight()`: `None`
    /// for an empty set (`if (hexes.size === 0) return`).
    pub(super) fn build(
        hexes: &[HexCoord],
        opacity: f64,
        top_y: &dyn Fn(HexCoord) -> f64,
    ) -> Option<Self> {
        let mut uniq: Vec<HexCoord> = Vec::with_capacity(hexes.len());
        for &h in hexes {
            if !uniq.contains(&h) {
                uniq.push(h);
            }
        }
        if uniq.is_empty() {
            return None;
        }
        let mut scene = Scene::new();
        let mut mat = Material::basic(HIGHLIGHT_COLOR);
        mat.transparent = true;
        mat.opacity = opacity;
        mat.depth_write = false;
        let m = scene.add_material(mat);
        for &h in &uniq {
            let disc = scene.add_mesh_id(ROOT, UnitPart::Highlight.geo(), m);
            let (x, z) = axial_to_world(h, HEX_R);
            scene.nodes[disc].set_pos(x, top_y(h) + HIGHLIGHT_LIFT, z);
        }
        Some(Self {
            scene,
            hexes: uniq,
            opacity,
        })
    }

    /// Number of discs.
    #[must_use]
    pub fn disc_count(&self) -> usize {
        self.scene.nodes[ROOT].children.len()
    }
}

/// The selected-army ring of `setSelectionHex` (`:6571-6591`).
#[derive(Clone, Debug, PartialEq)]
pub struct SelectionMarker {
    /// Root = the ring mesh (`getGeoSelectionHexRing()`).
    pub scene: Scene,
    /// Hex of the ring.
    pub hex: HexCoord,
    /// Owner whose colour the ring takes.
    pub owner_id: i64,
}

impl SelectionMarker {
    pub(super) fn build(hex: HexCoord, owner_id: i64, color: u32, top_y: f64, relief: f64) -> Self {
        let mut mat = Material::basic(color);
        mat.transparent = true;
        mat.opacity = SELECTION_HEX_OPACITY;
        mat.depth_write = false;
        mat.side = Side::Double;
        let mut scene = Scene::new();
        let m = scene.add_material(mat);
        scene.nodes[ROOT].kind = NodeKind::Mesh(MeshData::new(UnitPart::SelectionHexRing.geo(), m));
        scene.nodes[ROOT].rot_x(-PI / 2.0);
        let (x, z) = axial_to_world(hex, HEX_R);
        scene.nodes[ROOT].set_pos(x, top_y + SELECTION_HEX_LIFT + relief, z);
        Self {
            scene,
            hex,
            owner_id,
        }
    }

    /// `ring.material.color.getHex()`.
    #[must_use]
    pub fn color(&self) -> u32 {
        self.scene.materials.first().map_or(0, Material::hex)
    }
}

/// A turn stop of a route (`{ q, r, turn }`, `game/planned-march.ts:158-162`).
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct TurnStop {
    /// Stop hex.
    pub hex: HexCoord,
    /// Turn number (from 1).
    pub turn: u32,
}

/// `opts` of `setPathRoute(hexes, opts)` (`:6610`).
#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct PathRouteOptions {
    /// `turnLabel` (used when there are no turn stops).
    pub turn_label: Option<String>,
    /// `turnStops`.
    pub turn_stops: Vec<TurnStop>,
}

/// A label sprite of the route (`_makePathTurnLabelSprite`, `:6686-6711`):
/// the sprite parameters, the canvas texture is drawn by the GPU layer.
#[derive(Clone, Debug, PartialEq)]
pub struct RouteLabel {
    /// Text (`String(stop.turn)` or `turnLabel`).
    pub text: String,
    /// `labelSp.position`.
    pub position: (f64, f64, f64),
    /// `sp.scale` x/y (`(0.55, 0.22)`).
    pub scale: (f64, f64),
    /// `sp.renderOrder` (12).
    pub render_order: i32,
    /// `true` for the single `turnLabel` sprite (`pathTurnLabelSprite`).
    pub is_turn_label: bool,
}

/// The objects of `setPathRoute` (`routeObjects`, `:6629-6683`).
#[derive(Clone, Debug, PartialEq)]
pub struct PathRoute {
    /// Root group (identity) holding, in `routeObjects` order: the tube,
    /// the dots on the inner points, the destination torus.
    pub scene: Scene,
    /// The tube mesh node.
    pub tube: NodeId,
    /// The dot mesh nodes (`points[1 .. len - 1]`).
    pub dots: Vec<NodeId>,
    /// The destination torus node.
    pub dest: NodeId,
    /// Route points: hex centre at `topYAt + ROUTE_Y_LIFT`.
    pub points: Vec<Vec3>,
    /// Label sprites.
    pub labels: Vec<RouteLabel>,
}

impl PathRoute {
    /// `setPathRoute(hexes, opts)` body after `clearPathRoute()`: `None`
    /// for fewer than 2 hexes (`:6614`).
    pub(super) fn build(
        hexes: &[HexCoord],
        opts: &PathRouteOptions,
        top_y: &dyn Fn(HexCoord) -> f64,
    ) -> Option<Self> {
        if hexes.len() < 2 {
            return None;
        }
        let mut scene = Scene::new();
        let route_mat = |color: u32| {
            let mut mat = Material::basic(color);
            mat.transparent = true;
            mat.opacity = ROUTE_OPACITY;
            mat.depth_write = false;
            mat
        };
        let mat_gold = scene.add_material(route_mat(ROUTE_COLOR));
        let mat_dest = scene.add_material(route_mat(DEST_COLOR));

        let points: Vec<Vec3> = hexes
            .iter()
            .map(|&h| {
                let (x, z) = axial_to_world(h, HEX_R);
                Vec3::new(x, top_y(h) + ROUTE_Y_LIFT, z)
            })
            .collect();

        // `new THREE.CatmullRomCurve3(points)`: open, centripetal, 0.5.
        let curve = CatmullRomCurve3::new(points.clone(), false, CurveType::Centripetal, 0.5);
        let tube_mesh = tube_geometry(
            &curve,
            TUBE_SEGMENTS,
            TUBE_RADIUS,
            TUBE_RADIAL_SEGMENTS,
            false,
        );
        let tube = scene.add_mesh_id(
            ROOT,
            Geo::Buffer(Arc::new(Geometry::from(tube_mesh))),
            mat_gold,
        );

        // One `SphereGeometry` shared by every dot (`dotGeo`, `:6643-6655`).
        let dot_geo = Geo::Prim(Prim::Sphere {
            r: DOT_RADIUS,
            ws: DOT_WIDTH_SEGMENTS,
            hs: DOT_HEIGHT_SEGMENTS,
            phi_start: 0.0,
            phi_len: PI * 2.0,
            theta_start: 0.0,
            theta_len: PI,
        });
        let mut dots = Vec::new();
        for p in &points[1..points.len() - 1] {
            let dot = scene.add_mesh_id(ROOT, dot_geo.clone(), mat_gold);
            scene.nodes[dot].set_pos_v(*p);
            dots.push(dot);
        }

        let last = points[points.len() - 1];
        let dest = scene.add_mesh_id(
            ROOT,
            Geo::Prim(Prim::Torus {
                r: DEST_TORUS_R,
                tube: DEST_TUBE_R,
                radial: DEST_RADIAL_SEGMENTS,
                tubular: DEST_TUBULAR_SEGMENTS,
                arc: PI * 2.0,
            }),
            mat_dest,
        );
        scene.nodes[dest].set_pos_v(last);
        scene.nodes[dest].rot_x(PI / 2.0);

        let mut labels = Vec::new();
        if !opts.turn_stops.is_empty() {
            for stop in &opts.turn_stops {
                // `hexes.findIndex(h => h.q === stop.q && h.r === stop.r)`.
                let Some(idx) = hexes.iter().position(|&h| h == stop.hex) else {
                    continue;
                };
                let pt = points[idx];
                labels.push(RouteLabel {
                    text: stop.turn.to_string(),
                    position: (pt.x, pt.y + TURN_STOP_LABEL_LIFT, pt.z),
                    scale: PATH_LABEL_SCALE,
                    render_order: PATH_LABEL_RENDER_ORDER,
                    is_turn_label: false,
                });
            }
        } else if let Some(text) = opts.turn_label.as_deref().filter(|t| !t.is_empty()) {
            labels.push(RouteLabel {
                text: text.to_owned(),
                position: (last.x, last.y + TURN_LABEL_LIFT, last.z),
                scale: PATH_LABEL_SCALE,
                render_order: PATH_LABEL_RENDER_ORDER,
                is_turn_label: true,
            });
        }

        Some(Self {
            scene,
            tube,
            dots,
            dest,
            points,
            labels,
        })
    }
}
