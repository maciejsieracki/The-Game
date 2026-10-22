//! Siege camp models and the siege marker of the world map:
//! - `render/siegeCampModels.ts` (160 LOC): [`make_siege_soldiers`],
//!   [`make_siege_ram`], [`make_siege_tower`], [`build_siege_camp_group`];
//! - `render/siegeCampSync.ts` (47 LOC, CPU only): [`ready_machines_for_city`],
//!   [`machines_by_camp_hex`], [`camp_owner_by_hex`];
//! - `render/siegeMarker.ts` (262 LOC): [`SiegeMarkerRenderer`] (disc + ring +
//!   ⚔ sprite above each besieged city, camps on the camp hexes, `pulse`).
//!   The sprite texture is described as data ([`SIEGE_GLYPH`]); rasterising
//!   it is the text rasteriser's job (D-MOD-6), not this module's.

use std::f64::consts::PI;

use super::model::{GlyphTexture, MatKind, MiscMaterial, MiscModel, Side};
use crate::jsmath::{js_atan2, js_sin};
use crate::models::unit_core::model::{MatId, NodeId, Prim};
use crate::pick::hex::{axial_to_world_f, HEX_R};
use crate::scene::Texture;

/// `SiegeMachineKind` (`game/siegeMachines.ts:6`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum SiegeMachineKind {
    /// `'taran'` (battering ram).
    Taran,
    /// `'wieza'` (siege tower).
    Wieza,
}

impl SiegeMachineKind {
    /// Web string value.
    #[must_use]
    pub const fn web_id(self) -> &'static str {
        match self {
            Self::Taran => "taran",
            Self::Wieza => "wieza",
        }
    }

    /// From the web string value.
    #[must_use]
    pub fn from_web_id(s: &str) -> Option<Self> {
        match s {
            "taran" => Some(Self::Taran),
            "wieza" => Some(Self::Wieza),
            _ => None,
        }
    }
}

/// `CAMP_SCALE` (`siegeCampModels.ts:8`).
pub const CAMP_SCALE: f64 = 0.42;
/// `DEFAULT_SIEGE_ATTACKER_COLOR` (`siegeCampModels.ts:160`).
pub const DEFAULT_SIEGE_ATTACKER_COLOR: u32 = 0xc4_2020;

fn mk(m: &mut MiscModel, c: u32) -> MatId {
    m.add_material(MiscMaterial::lambert(c))
}

fn add(m: &mut MiscModel, parent: NodeId, prim: Prim, mt: MatId) -> NodeId {
    m.mesh(parent, prim, mt)
}

/// `makeSiegeSoldiers(count, color)` built under `parent`
/// (`siegeCampModels.ts:14-38`); returns the group.
pub fn make_siege_soldiers_in(
    m: &mut MiscModel,
    parent: Option<NodeId>,
    count: u32,
    color: u32,
) -> NodeId {
    let g = match parent {
        Some(p) => m.group(p),
        None => m.root(),
    };
    let mat = mk(m, color);
    let helmet = mk(m, 0x88_8888);
    for i in 0..count {
        let sx = m.group(g);
        let body = add(m, sx, Prim::bx(0.055, 0.1, 0.04), mat);
        m.node(body).position.y = 0.05;
        m.cast_shadow(body);
        let head = add(m, sx, sphere(0.028, 6, 5), mat);
        m.node(head).position.y = 0.135;
        m.cast_shadow(head);
        let helm = add(m, sx, Prim::cyl(0.032, 0.034, 0.02, 6), helmet);
        m.node(helm).position.y = 0.155;
        let spear_mat = mk(m, 0x6b_4f2a);
        let spear = add(m, sx, Prim::cyl(0.005, 0.005, 0.22, 4), spear_mat);
        m.node(spear).set_pos(0.04, 0.11, 0.0);
        let x = (f64::from(i) - (f64::from(count) - 1.0) / 2.0) * 0.13;
        m.node(sx).set_pos(x, 0.0, 0.0);
    }
    g
}

/// `makeSiegeSoldiers(count, color)` as a standalone model.
#[must_use]
pub fn make_siege_soldiers(count: u32, color: u32) -> MiscModel {
    let mut m = MiscModel::new();
    make_siege_soldiers_in(&mut m, None, count, color);
    m
}

/// `new THREE.SphereGeometry(r, ws, hs)`.
fn sphere(r: f64, ws: u32, hs: u32) -> Prim {
    Prim::Sphere {
        r,
        ws,
        hs,
        phi_start: 0.0,
        phi_len: PI * 2.0,
        theta_start: 0.0,
        theta_len: PI,
    }
}

/// Four wheels (`siegeCampModels.ts:63-70` / `:95-102`).
fn wheels(m: &mut MiscModel, g: NodeId, dx: f64, dz: f64) {
    for xs in [-1.0, 1.0] {
        for zs in [-1.0, 1.0] {
            let wm = mk(m, 0x3a_2c1a);
            let w = add(m, g, Prim::cyl(0.022, 0.022, 0.015, 8), wm);
            m.node(w).rot_z(PI / 2.0);
            m.node(w).set_pos(xs * dx, 0.022, zs * dz);
        }
    }
}

/// `makeSiegeRam()` built under `parent` (`siegeCampModels.ts:40-72`).
pub fn make_siege_ram_in(m: &mut MiscModel, parent: Option<NodeId>) -> NodeId {
    let g = match parent {
        Some(p) => m.group(p),
        None => m.root(),
    };
    let wood = mk(m, 0x6b_4f2a);
    let roof_m = mk(m, 0x8a_6a3a);
    let metal = mk(m, 0x55_5555);
    let body = add(m, g, Prim::bx(0.18, 0.06, 0.1), wood);
    m.node(body).position.y = 0.07;
    m.cast_shadow(body);
    let roof = add(m, g, Prim::cyl(0.07, 0.07, 0.2, 3), roof_m);
    m.node(roof).rot_z(PI / 2.0);
    m.node(roof).scale.y = 0.62;
    m.node(roof).position.y = 0.135;
    m.cast_shadow(roof);
    let beam = add(m, g, Prim::cyl(0.015, 0.015, 0.22, 6), wood);
    m.node(beam).rot_z(PI / 2.0);
    m.node(beam).set_pos(0.1, 0.07, 0.0);
    m.cast_shadow(beam);
    let head = add(m, g, sphere(0.025, 6, 5), metal);
    m.node(head).set_pos(0.22, 0.07, 0.0);
    wheels(m, g, 0.07, 0.04);
    g
}

/// `makeSiegeRam()` as a standalone model.
#[must_use]
pub fn make_siege_ram() -> MiscModel {
    let mut m = MiscModel::new();
    make_siege_ram_in(&mut m, None);
    m
}

/// `makeSiegeTower()` built under `parent` (`siegeCampModels.ts:74-104`).
pub fn make_siege_tower_in(m: &mut MiscModel, parent: Option<NodeId>) -> NodeId {
    let g = match parent {
        Some(p) => m.group(p),
        None => m.root(),
    };
    let wood = mk(m, 0x6b_4f2a);
    let planks = mk(m, 0x7a_5c32);
    let tower = add(m, g, Prim::bx(0.09, 0.34, 0.09), wood);
    m.node(tower).position.y = 0.17;
    m.cast_shadow(tower);
    for i in 0..3_u32 {
        let floor = add(m, g, Prim::bx(0.095, 0.012, 0.095), planks);
        m.node(floor).position.y = 0.05 + f64::from(i) * 0.11;
    }
    let roof_top = add(m, g, Prim::bx(0.1, 0.015, 0.1), planks);
    m.node(roof_top).position.y = 0.34;
    let ramp = add(m, g, Prim::bx(0.07, 0.01, 0.15), planks);
    m.node(ramp).rot_x(-0.45);
    m.node(ramp).set_pos(0.0, 0.26, 0.09);
    m.cast_shadow(ramp);
    wheels(m, g, 0.038, 0.035);
    g
}

/// `makeSiegeTower()` as a standalone model.
#[must_use]
pub fn make_siege_tower() -> MiscModel {
    let mut m = MiscModel::new();
    make_siege_tower_in(&mut m, None);
    m
}

/// `makeTent(color)` (`siegeCampModels.ts:106-115`).
fn make_tent(m: &mut MiscModel, parent: NodeId, color: u32) -> NodeId {
    let g = m.group(parent);
    let mat = mk(m, color);
    let tent = add(m, g, Prim::cone(0.12, 0.16, 4), mat);
    m.node(tent).position.y = 0.08;
    m.node(tent).rot_y(PI / 4.0);
    m.cast_shadow(tent);
    g
}

/// `SiegeCampBuildOpts` (`siegeCampModels.ts:117-122`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeCampBuildOpts {
    /// `attackerColor`.
    pub attacker_color: u32,
    /// `readyMachines?` (`None` = `undefined`).
    pub ready_machines: Option<Vec<SiegeMachineKind>>,
    /// `faceDirX`.
    pub face_dir_x: f64,
    /// `faceDirZ`.
    pub face_dir_z: f64,
}

/// `buildSiegeCampGroup(opts)` built under `parent` (or as the model root)
/// (`siegeCampModels.ts:124-158`); returns the camp root.
pub fn build_siege_camp_in(
    m: &mut MiscModel,
    parent: Option<NodeId>,
    opts: &SiegeCampBuildOpts,
) -> NodeId {
    let root = match parent {
        // The web builds the camp, then the caller adds it; attaching first
        // gives the same traverse order (nothing is added in between).
        Some(p) => m.group(p),
        None => m.root(),
    };
    m.node(root).set_scale_scalar(CAMP_SCALE);
    let angle = js_atan2(opts.face_dir_x, opts.face_dir_z);
    m.node(root).rot_y(angle);

    let tent_color = (opts.attacker_color & 0x00fe_fefe) >> 1;
    let t1 = make_tent(m, root, tent_color);
    m.node(t1).set_pos(-0.2, 0.0, -0.08);
    let t2 = make_tent(m, root, tent_color);
    m.node(t2).set_pos(0.18, 0.0, 0.1);

    let soldiers = make_siege_soldiers_in(m, Some(root), 4, opts.attacker_color);
    m.node(soldiers).set_pos(0.0, 0.0, 0.05);

    let machines: &[SiegeMachineKind] = opts.ready_machines.as_deref().unwrap_or(&[]);
    let mut mx = -0.35;
    for &kind in machines {
        let mm = if kind == SiegeMachineKind::Taran {
            make_siege_ram_in(m, Some(root))
        } else {
            make_siege_tower_in(m, Some(root))
        };
        m.node(mm).set_pos(mx, 0.0, 0.28);
        mx += 0.38;
    }
    if machines.is_empty() {
        let ram = make_siege_ram_in(m, Some(root));
        m.node(ram).set_pos(0.0, 0.0, 0.32);
    }
    root
}

/// `buildSiegeCampGroup(opts)` as a standalone model.
#[must_use]
pub fn build_siege_camp_group(opts: &SiegeCampBuildOpts) -> MiscModel {
    let mut m = MiscModel::new();
    build_siege_camp_in(&mut m, None, opts);
    m
}

// ------------------------------------------------------------ siegeCampSync

/// `readyMachinesForCity(city)` (`siegeCampSync.ts:7-11`):
/// `city.siegeMachines?.ready ?? []`.
#[must_use]
pub fn ready_machines_for_city(ready: Option<&[SiegeMachineKind]>) -> Vec<SiegeMachineKind> {
    ready.map(<[SiegeMachineKind]>::to_vec).unwrap_or_default()
}

/// `machinesByCampHex(campHexes, ready)` (`siegeCampSync.ts:14-27`):
/// round-robin over the camp hexes; the result keeps the `Map` insertion
/// order (first time a key receives a machine).
#[must_use]
pub fn machines_by_camp_hex(
    camp_hexes: &[String],
    ready: &[SiegeMachineKind],
) -> Vec<(String, Vec<SiegeMachineKind>)> {
    let mut out: Vec<(String, Vec<SiegeMachineKind>)> = Vec::new();
    if camp_hexes.is_empty() || ready.is_empty() {
        return out;
    }
    for (i, &kind) in ready.iter().enumerate() {
        let hk = &camp_hexes[i % camp_hexes.len()];
        if let Some(e) = out.iter_mut().find(|(k, _)| k == hk) {
            e.1.push(kind);
        } else {
            out.push((hk.clone(), vec![kind]));
        }
    }
    out
}

/// ECMAScript `StrWhiteSpaceChar` (WhiteSpace + LineTerminator).
fn is_js_space(c: char) -> bool {
    matches!(
        c,
        '\u{0009}'
            | '\u{000B}'
            | '\u{000C}'
            | ' '
            | '\u{00A0}'
            | '\u{FEFF}'
            | '\u{000A}'
            | '\u{000D}'
            | '\u{2028}'
            | '\u{2029}'
    ) || (c != '\u{0085}' && c.is_whitespace() && !c.is_ascii())
}

/// `parseInt(s, 10)`: leading white space, optional sign, the longest run of
/// decimal digits; `NaN` without digits.
#[must_use]
pub fn js_parse_int10(s: &str) -> f64 {
    let t = s.trim_start_matches(is_js_space);
    let (neg, rest) = match t.as_bytes().first() {
        Some(b'-') => (true, &t[1..]),
        Some(b'+') => (false, &t[1..]),
        _ => (false, t),
    };
    let digits: &str = &rest[..rest.bytes().take_while(u8::is_ascii_digit).count()];
    if digits.is_empty() {
        return f64::NAN;
    }
    // Exact for every length: the decimal string is parsed with correct
    // rounding (like V8 for radix 10).
    let v: f64 = digits.parse().unwrap_or(f64::NAN);
    if neg {
        -v
    } else {
        v
    }
}

/// `hk.split(',')` → `(parseInt(q), parseInt(r))`, `None` when the key does
/// not have exactly two parts or a part is `NaN` (`siegeCampSync.ts:38-42`,
/// `siegeMarker.ts:182-186`).
#[must_use]
pub fn parse_hex_key(hk: &str) -> Option<(f64, f64)> {
    let parts: Vec<&str> = hk.split(',').collect();
    if parts.len() != 2 {
        return None;
    }
    let q = js_parse_int10(parts[0]);
    let r = js_parse_int10(parts[1]);
    if q.is_nan() || r.is_nan() {
        return None;
    }
    Some((q, r))
}

/// A unit as `campOwnerByHex` reads it.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CampUnit {
    /// `q`.
    pub q: f64,
    /// `r`.
    pub r: f64,
    /// `ownerId`.
    pub owner_id: i64,
}

/// `campOwnerByHex(campHexes, units, keyOf, cityOwnerId)`
/// (`siegeCampSync.ts:30-47`): owner of the first non-city-owner unit on
/// each camp hex (`keyOf` is not called by the web body).
#[must_use]
pub fn camp_owner_by_hex(
    camp_hexes: &[String],
    units: &[CampUnit],
    city_owner_id: i64,
) -> Vec<(String, i64)> {
    let mut out: Vec<(String, i64)> = Vec::new();
    for hk in camp_hexes {
        let Some((q, r)) = parse_hex_key(hk) else {
            continue;
        };
        if let Some(u) = units
            .iter()
            .find(|u| u.q == q && u.r == r && u.owner_id != city_owner_id)
        {
            if let Some(e) = out.iter_mut().find(|(k, _)| k == hk) {
                e.1 = u.owner_id;
            } else {
                out.push((hk.clone(), u.owner_id));
            }
        }
    }
    out
}

// ------------------------------------------------------------ siegeMarker

/// `SIEGE_DISC_COLOR` (`siegeMarker.ts:15`).
pub const SIEGE_DISC_COLOR: u32 = 0xe7_4c3c;
/// `SIEGE_RING_COLOR` (`:16`).
pub const SIEGE_RING_COLOR: u32 = 0xff_1744;
/// `MARKER_LIFT` (`:17`).
pub const MARKER_LIFT: f64 = 0.14;
/// `RING_LIFT` (`:18`).
pub const RING_LIFT: f64 = 0.16;
/// `SPRITE_LIFT` (`:19`).
pub const SPRITE_LIFT: f64 = 1.35;

/// The sprite glyph texture (`siegeSpriteTexture`, `siegeMarker.ts:35-49`).
pub const SIEGE_GLYPH: GlyphTexture = GlyphTexture {
    size: 128,
    font: "bold 96px Arial",
    glyph: '\u{2694}',
    x: 64,
    y: 70,
};

/// Options of [`SiegeMarkerRenderer::sync`] (`SiegeMarkerSyncOptions`,
/// `siegeMarker.ts:51-61`); `getTopY` is the `top_y` argument of `sync`.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct SiegeMarkerSyncOptions {
    /// `campHexesByCity` (city id → camp hex keys).
    pub camp_hexes_by_city: Vec<(String, Vec<String>)>,
    /// `machinesByCampHex`.
    pub machines_by_camp_hex: Vec<(String, Vec<SiegeMachineKind>)>,
    /// `ownerColorById`.
    pub owner_color_by_id: Vec<(i64, u32)>,
    /// `campOwnerByHex`.
    pub camp_owner_by_hex: Vec<(String, i64)>,
}

fn lookup<'a, Q, B, V>(list: &'a [(B, V)], k: &Q) -> Option<&'a V>
where
    Q: PartialEq + ?Sized,
    B: std::borrow::Borrow<Q>,
{
    list.iter().find(|(kk, _)| kk.borrow() == k).map(|(_, v)| v)
}

/// One marker (`CityMarkerGroup`, `siegeMarker.ts:63-69`): its own model
/// whose root is the marker group.
#[derive(Debug, Clone, PartialEq)]
pub struct CityMarker {
    /// The marker group (root) with disc, ring, sprite and camps.
    pub model: MiscModel,
    /// Disc node.
    pub disc: NodeId,
    /// Ring node.
    pub ring: NodeId,
    /// Sprite node.
    pub sprite: NodeId,
    /// Camp roots (children of the root after the sprite).
    pub camp_groups: Vec<NodeId>,
    base_nodes: usize,
    base_mats: usize,
}

/// `SiegeMarkerRenderer` (`siegeMarker.ts:71-262`) without the scene: the
/// markers in scene order (= `Map` insertion order).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct SiegeMarkerRenderer {
    /// `(city id, marker)` in insertion order.
    pub markers: Vec<(String, CityMarker)>,
}

impl SiegeMarkerRenderer {
    /// `new SiegeMarkerRenderer(scene, map)`.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// `buildGroup()` (`siegeMarker.ts:105-132`).
    fn build_group() -> CityMarker {
        let mut m = MiscModel::new();
        let root = m.root();
        m.render_order(root, 80);

        let mut disc_m = MiscMaterial::new(MatKind::Basic, Some(SIEGE_DISC_COLOR));
        disc_m.transparent = true;
        disc_m.opacity = 0.42;
        disc_m.depth_write = false;
        disc_m.depth_test = false;
        let disc_mat = m.add_material(disc_m);
        let disc = m.mesh(
            root,
            Prim::cyl(HEX_R * 0.88, HEX_R * 0.88, 0.035, 6),
            disc_mat,
        );
        m.render_order(disc, 81);

        let mut ring_m = MiscMaterial::new(MatKind::Basic, Some(SIEGE_RING_COLOR));
        ring_m.transparent = true;
        ring_m.opacity = 0.88;
        ring_m.side = Side::Double;
        ring_m.depth_write = false;
        ring_m.depth_test = false;
        let ring_mat = m.add_material(ring_m);
        let ring = m.mesh(
            root,
            Prim::Ring {
                inner: HEX_R * 0.78,
                outer: HEX_R * 1.05,
                segments: 6,
            },
            ring_mat,
        );
        m.node(ring).rot_x(-PI / 2.0);
        m.render_order(ring, 82);

        let mut sprite_m = MiscMaterial::new(MatKind::Sprite, Some(0xff_ffff));
        sprite_m.transparent = true;
        sprite_m.depth_write = false;
        sprite_m.depth_test = false;
        sprite_m.map = Some(Texture::Glyph(SIEGE_GLYPH));
        let sprite_mat = m.add_material(sprite_m);
        let sprite = m.sprite(root, sprite_mat);
        m.node(sprite).set_scale(1.35, 1.35, 1.0);
        m.render_order(sprite, 90);

        let base_nodes = m.nodes.len();
        let base_mats = m.materials.len();
        CityMarker {
            model: m,
            disc,
            ring,
            sprite,
            camp_groups: Vec::new(),
            base_nodes,
            base_mats,
        }
    }

    /// `sync(obleganeCityIds, cityPositions, options)`
    /// (`siegeMarker.ts:148-229`). `ids` is the `Set` in insertion order,
    /// `positions` the `Map` (city id → axial `(q, r)`), `top_y` is
    /// `options.getTopY`.
    pub fn sync(
        &mut self,
        ids: &[String],
        positions: &[(String, (f64, f64))],
        top_y: &dyn Fn(f64, f64) -> f64,
        options: &SiegeMarkerSyncOptions,
    ) {
        for id in ids {
            let Some(&(pq, pr)) = lookup(positions, id.as_str()) else {
                continue;
            };
            if !self.markers.iter().any(|(k, _)| k == id) {
                self.markers.push((id.clone(), Self::build_group()));
            }
            let entry = &mut self
                .markers
                .iter_mut()
                .find(|(k, _)| k == id)
                .expect("inserted above")
                .1;

            // placeCityMarker
            let (x, z) = axial_to_world_f(pq, pr, HEX_R);
            let top = top_y(pq, pr);
            let m = &mut entry.model;
            let root = m.root();
            m.node(root).set_pos(x, 0.0, z);
            m.node(entry.disc).set_pos(0.0, top + MARKER_LIFT, 0.0);
            m.node(entry.ring).set_pos(0.0, top + RING_LIFT, 0.0);
            m.node(entry.sprite).set_pos(0.0, top + SPRITE_LIFT, 0.0);

            // drop the previous camps
            m.truncate(entry.base_nodes, entry.base_mats);
            entry.camp_groups.clear();

            let camps: &[String] =
                lookup(&options.camp_hexes_by_city, id.as_str()).map_or(&[], Vec::as_slice);
            for hk in camps {
                let Some((cq, cr)) = parse_hex_key(hk) else {
                    continue;
                };
                let owner = lookup(&options.camp_owner_by_hex, hk.as_str())
                    .copied()
                    .unwrap_or(0);
                let attacker_color = lookup(&options.owner_color_by_id, &owner)
                    .copied()
                    .unwrap_or(DEFAULT_SIEGE_ATTACKER_COLOR);
                let ready = lookup(&options.machines_by_camp_hex, hk.as_str()).cloned();
                let opts = SiegeCampBuildOpts {
                    attacker_color,
                    ready_machines: ready,
                    face_dir_x: pq - cq,
                    face_dir_z: pr - cr,
                };
                let camp = build_siege_camp_in(m, Some(root), &opts);
                let (cx, cz) = axial_to_world_f(cq, cr, HEX_R);
                let gp = m.nodes[root].position;
                let y = top_y(cq, cr) + MARKER_LIFT * 0.5;
                m.node(camp).set_pos(cx - gp.x, y, cz - gp.z);
                m.render_order(camp, 85);
                entry.camp_groups.push(camp);
            }
        }
        self.markers.retain(|(k, _)| ids.contains(k));
    }

    /// `pulse(timeSec)` (`siegeMarker.ts:232-239`): ring scale and sprite
    /// opacity.
    pub fn pulse(&mut self, time_sec: f64) {
        let pulse = 0.78 + 0.22 * js_sin(time_sec * 3.2);
        let opacity = 0.82 + 0.18 * js_sin(time_sec * 2.4);
        for (_, e) in &mut self.markers {
            let ring = e.ring;
            e.model.node(ring).set_scale(pulse, pulse, 1.0);
            if let Some(sm) = e.model.nodes[e.sprite].sprite_material() {
                e.model.materials[sm].opacity = opacity;
            }
        }
    }
}
