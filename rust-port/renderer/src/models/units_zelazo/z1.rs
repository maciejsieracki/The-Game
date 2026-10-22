//! Port of `render/jednostki-z1-mezopotamia.ts` (`edb8fb56`):
//! `buildGwardiaHetycka`, `buildPiechotaNeobabilonska`, `buildMurTarcz`,
//! `buildGarnizonHarappy` (all four exports).
//!
//! The web file caches its geometries by key (`getG` / `gBox(key, w, h, d)`
//! → `BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R)`); every key is used with
//! one argument set only, so each maps to one geometry value. The products
//! are kept in the web order (`w * HEX_R`, with `w` possibly itself a product
//! such as `0.028 * 1.6`).

use super::kit::{add_scaled, bx, cn, cy, dir_down, oval_face, oval_shell, seg, v3};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`jednostki-z1-mezopotamia.ts:157-178`)
const Z1_SKIN: u32 = 0xe0ac69;
const Z1_SKIN_INDUS: u32 = 0xb8824e;
const Z1_IRON: u32 = 0x8f97a3;
const Z1_IRON_DK: u32 = 0x6b7280;
const Z1_GOLD: u32 = 0xd8b040;
const Z1_WOOD: u32 = 0x7a5c3a;
const Z1_LEATHER: u32 = 0x6b4a28;
const Z1_LEATHER_DK: u32 = 0x53381e;
const Z1_LINEN: u32 = 0xe8e0c8;
const Z1_BRICK: u32 = 0x9c4a2e;
const Z1_CREAM: u32 = 0xe6d9b8;
const Z1_TEAL: u32 = 0x1f7a78;
const Z1_FLEECE: u32 = 0xd8c8a0;
const Z1_COTTON: u32 = 0xefe9d6;
const Z1_REED: u32 = 0xd8c07c;
const Z1_REED_DARK: u32 = 0xa07f42;
const Z1_CARNELIAN: u32 = 0xc05528;
const Z1_TEALBEAD: u32 = 0x2a9d8f;
const Z1_DARKHAIR: u32 = 0x2a1a0a;
const Z1_DARK: u32 = 0x20180f;
const Z1_EYE: u32 = 0x1a1008;

// ── wymiary sylwetki (`:181-198`)
const Z1_HIP_Y: f64 = 0.208 * HEX_R;
const Z1_TORSO_W: f64 = 0.180 * HEX_R;
const Z1_TORSO_H: f64 = 0.205 * HEX_R;
const Z1_TORSO_D: f64 = 0.100 * HEX_R;
const Z1_TORSO_BOT: f64 = 0.240 * HEX_R;
const Z1_TORSO_CTR: f64 = Z1_TORSO_BOT + Z1_TORSO_H * 0.5;
const Z1_TORSO_TOP: f64 = Z1_TORSO_BOT + Z1_TORSO_H;
const Z1_NECK_H: f64 = 0.028 * HEX_R;
const Z1_HEAD_S: f64 = 0.128 * HEX_R;
const Z1_HEAD_CTR: f64 = Z1_TORSO_TOP + Z1_NECK_H + Z1_HEAD_S * 0.5;
const Z1_HEAD_TOP: f64 = Z1_TORSO_TOP + Z1_NECK_H + Z1_HEAD_S;
const Z1_SHLD_X: f64 = Z1_TORSO_W * 0.5 + 0.030 * HEX_R;
const Z1_SHLD_Y: f64 = Z1_TORSO_TOP - 0.024 * HEX_R;
const Z1_HIP_X: f64 = 0.052 * HEX_R;
const Z1_THIGH_L: f64 = 0.104 * HEX_R;
const Z1_SHIN_L: f64 = 0.096 * HEX_R;
const Z1_UPARM_L: f64 = 0.100 * HEX_R;
const Z1_FOREARM_L: f64 = 0.092 * HEX_R;

/// `gBox(key, w, h, d)` (`:207-209`).
fn gb(w: f64, h: f64, d: f64) -> Geo {
    bx(w * HEX_R, h * HEX_R, d * HEX_R)
}

fn g_torso() -> Geo {
    gb(0.180, 0.205, 0.100)
}
fn g_neck() -> Geo {
    gb(0.042, 0.028 * 1.6, 0.042)
}
fn g_head() -> Geo {
    gb(0.128, 0.128, 0.128)
}
fn g_thigh() -> Geo {
    gb(0.056, 0.104, 0.060)
}
fn g_shin() -> Geo {
    gb(0.038, 0.096, 0.042)
}
fn g_foot() -> Geo {
    gb(0.044, 0.026, 0.078)
}
fn g_up_arm() -> Geo {
    gb(0.054, 0.100, 0.054)
}
fn g_forearm() -> Geo {
    gb(0.040, 0.092, 0.040)
}
fn g_fist() -> Geo {
    gb(0.046, 0.046, 0.048)
}
fn g_skirt() -> Geo {
    gb(0.196, 0.070, 0.118)
}
fn g_belt() -> Geo {
    gb(0.190, 0.034, 0.112)
}
fn g_belt_wide() -> Geo {
    gb(0.192, 0.056, 0.114)
}
fn g_sash() -> Geo {
    gb(0.052, 0.230, 0.010)
}
fn g_toe() -> Geo {
    gb(0.030, 0.034, 0.022)
}
fn g_eye() -> Geo {
    gb(0.020, 0.020, 0.008)
}
fn g_fig8_shell() -> Geo {
    oval_shell(
        0.082 * HEX_R,
        0.094 * HEX_R,
        0.026 * HEX_R,
        0.018 * HEX_R,
        8,
    )
}
fn g_fig8_face() -> Geo {
    oval_face(0.070 * HEX_R, 0.080 * HEX_R, 0.020 * HEX_R, 8)
}

/// `z1BuildLeg` (`:285-298`): returns `footZ`.
#[allow(clippy::too_many_arguments)]
fn z1_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
    hip_y: f64,
) -> f64 {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, Z1_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, Z1_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
    p.z + 0.016 * HEX_R
}

/// `z1BuildArm` (`:299-315`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn z1_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, Z1_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, Z1_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, Z1_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `z1Core` (`:316-339`): returns the skin material.
fn z1_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin: u32, eyes: bool) -> MatId {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, Z1_TORSO_CTR, 0.0);
    let m_skin = m.mat(skin, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, Z1_TORSO_TOP + Z1_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, Z1_HEAD_CTR, 0.0);
    if eyes {
        let m_eye = m.mat(Z1_EYE, 0.02, 0.95);
        for sx in [-1.0_f64, 1.0] {
            m.add_mesh(g, g_eye(), m_eye).set_pos(
                sx * 0.028 * HEX_R,
                Z1_HEAD_CTR + 0.008 * HEX_R,
                Z1_HEAD_S * 0.5 + 0.004 * HEX_R,
            );
        }
    }
    m_skin
}

/// `z1Sash` (`:341-346`).
fn z1_sash(m: &mut UnitModel, g: NodeId, m_owner: MatId) {
    m.add_mesh(g, g_sash(), m_owner).rot_z(0.60).set_pos(
        0.0,
        Z1_TORSO_CTR + 0.012 * HEX_R,
        Z1_TORSO_D * 0.5 + 0.007 * HEX_R,
    );
}

/// `z1Tagger(group, prefix)(from, ...labels)` (`:353-360`).
fn tag(m: &mut UnitModel, g: NodeId, prefix: &str, from: usize, labels: &[&str]) {
    for (i, l) in labels.iter().enumerate() {
        if let Some(&c) = m.nodes[g].children.get(from + i) {
            m.node(c).set_name(&format!("{prefix}{l}"));
        }
    }
}

fn nchild(m: &UnitModel, g: NodeId) -> usize {
    m.nodes[g].children.len()
}

/// `z1Beard` (`:363-371`).
fn z1_beard(m: &mut UnitModel, g: NodeId, m_hair: MatId, rows: u32) {
    let z0 = Z1_HEAD_S * 0.5 - 0.004 * HEX_R;
    let geos = [
        gb(0.088, 0.026, 0.026),
        gb(0.074, 0.026, 0.022),
        gb(0.056, 0.026, 0.018),
    ];
    for i in 0..rows {
        let fi = f64::from(i);
        m.add_mesh(g, geos[i as usize], m_hair).set_pos(
            0.0,
            Z1_HEAD_CTR - (0.052 + fi * 0.026) * HEX_R,
            z0 + (0.012 - fi * 0.003) * HEX_R,
        );
    }
}

/// `buildGwardiaHetycka(ownerColor)` (`jednostki-z1-mezopotamia.ts:453-598`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_gwardia_hetycka(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let p = "het-";
    let m_linen = m.mat(Z1_LINEN, 0.06, 0.82);
    let m_iron = m.mat(Z1_IRON, 0.55, 0.40);
    let m_iron_d = m.mat(Z1_IRON_DK, 0.50, 0.46);
    let m_gold = m.mat(Z1_GOLD, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_leath = m.mat(Z1_LEATHER, 0.06, 0.82);
    let m_leath_d = m.mat(Z1_LEATHER_DK, 0.05, 0.85);
    let m_skin = m.mat(Z1_SKIN, 0.05, 0.80);
    let m_dark = m.mat(Z1_DARK, 0.05, 0.88);

    let hip_y = Z1_HIP_Y - 0.012 * HEX_R;

    let mut k = nchild(&m, g);
    z1_core(&mut m, g, m_linen, Z1_SKIN, false);
    tag(&mut m, g, p, k, &["torso", "neck", "head"]);
    k = nchild(&m, g);
    for i in 0..3_u32 {
        let mt = if i % 2 == 0 { m_iron } else { m_iron_d };
        m.add_mesh(g, gb(0.184, 0.040, 0.106), mt).set_pos(
            0.0,
            Z1_TORSO_TOP - (0.052 + f64::from(i) * 0.048) * HEX_R,
            0.0,
        );
    }
    tag(&mut m, g, p, k, &["lamella-1", "lamella-2", "lamella-3"]);
    m.add_mesh(g, g_skirt(), m_linen)
        .set_pos(0.0, Z1_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("het-skirt");
    m.add_mesh(g, g_belt_wide(), m_leath_d)
        .set_pos(0.0, 0.258 * HEX_R, 0.0)
        .set_name("het-belt");
    k = nchild(&m, g);
    z1_sash(&mut m, g, m_owner);
    tag(&mut m, g, p, k, &["sash"]);

    k = nchild(&m, g);
    let leg_l = z1_build_leg(
        &mut m, g, Z1_HIP_X, 0.58, 0.34, m_linen, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-left-thigh", "leg-left-shin", "leg-left-foot"],
    );
    k = nchild(&m, g);
    let leg_r = z1_build_leg(
        &mut m, g, -Z1_HIP_X, -0.52, -0.20, m_linen, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-right-thigh", "leg-right-shin", "leg-right-foot"],
    );
    k = nchild(&m, g);
    for (sx, fz) in [(Z1_HIP_X, leg_l), (-Z1_HIP_X, leg_r)] {
        m.add_mesh(g, g_toe(), m_leath)
            .rot_x(-0.55)
            .set_pos(sx, 0.030 * HEX_R, fz + 0.042 * HEX_R);
    }
    tag(&mut m, g, p, k, &["boot-toe-left", "boot-toe-right"]);

    m.add_mesh(
        g,
        cy(0.040 * HEX_R, 0.098 * HEX_R, 0.115 * HEX_R, 8),
        m_iron,
    )
    .set_pos(0.0, Z1_HEAD_CTR + 0.042 * HEX_R, 0.0)
    .set_name("het-helmet-cone");
    k = nchild(&m, g);
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, gb(0.020, 0.052, 0.044), m_iron).set_pos(
            sx * (Z1_HEAD_S * 0.5 + 0.004 * HEX_R),
            Z1_HEAD_CTR - 0.012 * HEX_R,
            0.014 * HEX_R,
        );
    }
    tag(
        &mut m,
        g,
        p,
        k,
        &["helmet-cheek-right", "helmet-cheek-left"],
    );
    m.add_mesh(g, gb(0.024, 0.088, 0.150), m_dark)
        .rot_x(0.10)
        .set_pos(0.0, Z1_HEAD_TOP + 0.088 * HEX_R, -0.008 * HEX_R)
        .set_name("het-helmet-crest");

    k = nchild(&m, g);
    let (wrist_r, sw_axis) = z1_build_arm(
        &mut m,
        g,
        -Z1_SHLD_X,
        1.02,
        1.40,
        m_linen,
        m_skin,
        Some(m_leath),
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["arm-right-upper", "arm-right-fore", "arm-right-fist"],
    );
    m.add_mesh(g, gb(0.056, 0.018, 0.024), m_gold)
        .rot_x(PI - 1.40)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.032 * HEX_R))
        .set_name("het-sword-guard");
    m.add_mesh(g, gb(0.026, 0.150, 0.014), m_iron)
        .rot_x(PI - 1.40)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.110 * HEX_R))
        .set_name("het-sword-blade");
    m.add_mesh(g, cn(0.016 * HEX_R, 0.042 * HEX_R, 4), m_iron)
        .rot_x(PI - 1.40)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.206 * HEX_R))
        .set_name("het-sword-tip");

    k = nchild(&m, g);
    let (wrist_l, _) = z1_build_arm(&mut m, g, Z1_SHLD_X, 0.50, 1.08, m_linen, m_skin, None);
    tag(&mut m, g, p, k, &["arm-left-upper", "arm-left-fore"]);
    let sh = m.detached_group();
    m.node(sh)
        .set_name("het-shield")
        .set_pos(
            wrist_l.x - 0.025 * HEX_R,
            wrist_l.y + 0.052 * HEX_R,
            wrist_l.z + 0.045 * HEX_R,
        )
        .rot_y(-0.20);
    for (lobe, dy) in [0.072_f64, -0.072].into_iter().enumerate() {
        let lname = if lobe == 0 { "upper" } else { "lower" };
        m.add_mesh(sh, g_fig8_shell(), m_leath)
            .set_pos(0.0, dy * HEX_R, 0.0)
            .set_name(&format!("het-shield-shell-{lname}"));
        m.add_mesh(sh, g_fig8_face(), m_owner)
            .set_pos(0.0, dy * HEX_R, 0.013 * HEX_R)
            .set_name(&format!("het-shield-face-{lname}"));
    }
    m.add_mesh(sh, gb(0.040, 0.040, 0.022), m_iron)
        .rot_z(PI / 4.0)
        .set_pos(0.0, 0.0, 0.018 * HEX_R)
        .set_name("het-shield-boss");
    m.attach(g, sh);
    m
}

/// `buildPiechotaNeobabilonska(ownerColor)` (`:674-823`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_piechota_neobabilonska(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let p = "nb-";
    let m_brick = m.mat(Z1_BRICK, 0.05, 0.84);
    let m_cream = m.mat(Z1_CREAM, 0.06, 0.82);
    let m_iron = m.mat(Z1_IRON, 0.55, 0.40);
    let m_iron_d = m.mat(Z1_IRON_DK, 0.50, 0.46);
    let m_gold = m.mat(Z1_GOLD, 0.55, 0.35);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let m_wood = m.mat(Z1_WOOD, 0.05, 0.85);
    let m_leath = m.mat(Z1_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(Z1_SKIN, 0.05, 0.80);
    let m_hair = m.mat(Z1_DARKHAIR, 0.05, 0.88);

    let hip_y = Z1_HIP_Y - 0.010 * HEX_R;

    let mut k = nchild(&m, g);
    z1_core(&mut m, g, m_brick, Z1_SKIN, false);
    tag(&mut m, g, p, k, &["torso", "neck", "head"]);
    k = nchild(&m, g);
    for sx in [-0.045_f64, 0.045] {
        m.add_mesh(g, gb(0.014, 0.190, 0.008), m_cream).set_pos(
            sx * HEX_R,
            Z1_TORSO_CTR,
            Z1_TORSO_D * 0.5 + 0.005 * HEX_R,
        );
    }
    tag(&mut m, g, p, k, &["quilt-seam-right", "quilt-seam-left"]);
    m.add_mesh(g, g_skirt(), m_brick)
        .set_pos(0.0, Z1_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("nb-skirt");
    m.add_mesh(g, gb(0.198, 0.026, 0.120), m_cream)
        .set_pos(0.0, Z1_TORSO_BOT - 0.052 * HEX_R, 0.0)
        .set_name("nb-hem");
    k = nchild(&m, g);
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(g, gb(0.024, 0.020, 0.008), m_brick).set_pos(
            sx * 0.062 * HEX_R,
            Z1_TORSO_BOT - 0.044 * HEX_R,
            0.062 * HEX_R,
        );
    }
    tag(&mut m, g, p, k, &["merlon-right", "merlon-left"]);
    m.add_mesh(g, g_belt(), m_leath)
        .set_pos(0.0, 0.256 * HEX_R, 0.0)
        .set_name("nb-belt");
    k = nchild(&m, g);
    z1_sash(&mut m, g, m_owner);
    tag(&mut m, g, p, k, &["sash"]);

    k = nchild(&m, g);
    z1_build_leg(
        &mut m, g, Z1_HIP_X, 0.55, 0.30, m_brick, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-left-thigh", "leg-left-shin", "leg-left-foot"],
    );
    k = nchild(&m, g);
    z1_build_leg(
        &mut m, g, -Z1_HIP_X, -0.50, -0.16, m_brick, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-right-thigh", "leg-right-shin", "leg-right-foot"],
    );

    m.add_mesh(
        g,
        cy(0.038 * HEX_R, 0.096 * HEX_R, 0.120 * HEX_R, 8),
        m_iron,
    )
    .set_pos(0.0, Z1_HEAD_CTR + 0.044 * HEX_R, 0.0)
    .set_name("nb-helmet-cone");
    m.add_mesh(g, gb(0.130, 0.042, 0.020), m_iron_d)
        .rot_x(-0.38)
        .set_pos(
            0.0,
            Z1_HEAD_CTR - 0.018 * HEX_R,
            -(Z1_HEAD_S * 0.5 + 0.010 * HEX_R),
        )
        .set_name("nb-helmet-neckguard");
    k = nchild(&m, g);
    z1_beard(&mut m, g, m_hair, 2);
    tag(&mut m, g, p, k, &["beard-row-1", "beard-row-2"]);

    k = nchild(&m, g);
    let (wrist_r, sw_axis) = z1_build_arm(
        &mut m,
        g,
        -Z1_SHLD_X,
        -2.15,
        2.45,
        m_brick,
        m_skin,
        Some(m_leath),
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["arm-right-upper", "arm-right-fore", "arm-right-fist"],
    );
    m.add_mesh(g, gb(0.024, 0.062, 0.024), m_wood)
        .rot_x(PI - 2.45)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.016 * HEX_R))
        .set_name("nb-sword-grip");
    m.add_mesh(g, gb(0.056, 0.018, 0.024), m_iron_d)
        .rot_x(PI - 2.45)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.052 * HEX_R))
        .set_name("nb-sword-guard");
    m.add_mesh(g, gb(0.026, 0.150, 0.014), m_iron)
        .rot_x(PI - 2.45)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.132 * HEX_R))
        .set_name("nb-sword-blade");
    m.add_mesh(g, cn(0.016 * HEX_R, 0.042 * HEX_R, 4), m_iron)
        .rot_x(PI - 2.45)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, sw_axis, 0.228 * HEX_R))
        .set_name("nb-sword-tip");

    k = nchild(&m, g);
    let (wrist_l, _) = z1_build_arm(&mut m, g, Z1_SHLD_X, 0.46, 1.02, m_brick, m_skin, None);
    tag(&mut m, g, p, k, &["arm-left-upper", "arm-left-fore"]);
    let sh = m.detached_group();
    m.node(sh)
        .set_name("nb-shield")
        .set_pos(
            wrist_l.x - 0.020 * HEX_R,
            wrist_l.y + 0.045 * HEX_R,
            wrist_l.z + 0.048 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, gb(0.156, 0.296, 0.020), m_owner)
        .set_name("nb-shield-face");
    for (bi, fy) in [-0.118_f64, 0.118].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.164, 0.022, 0.010), m_iron_d)
            .set_pos(0.0, fy * HEX_R, 0.012 * HEX_R)
            .set_name(if bi == 0 {
                "nb-shield-bar-lower"
            } else {
                "nb-shield-bar-upper"
            });
    }
    for (ri, rot) in [0.0, PI / 4.0, PI / 2.0, -PI / 4.0].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.014, 0.084, 0.008), m_gold)
            .rot_z(rot)
            .set_pos(0.0, 0.056 * HEX_R, 0.014 * HEX_R)
            .set_name(&format!("nb-ishtar-ray-{ri}"));
    }
    m.attach(g, sh);
    m
}

/// `buildMurTarcz(ownerColor)` (`:906-1089`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_mur_tarcz(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let p = "mt-";
    let m_teal = m.mat(Z1_TEAL, 0.05, 0.85);
    let m_fleece = m.mat(Z1_FLEECE, 0.04, 0.96);
    let m_iron = m.mat(Z1_IRON, 0.55, 0.40);
    let m_iron_d = m.mat(Z1_IRON_DK, 0.50, 0.46);
    let m_wood = m.mat(Z1_WOOD, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_leath = m.mat(Z1_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(Z1_SKIN, 0.05, 0.80);
    let m_black = m.mat(Z1_DARK, 0.04, 0.90);

    let hip_y = Z1_HIP_Y - 0.006 * HEX_R;

    let mut k = nchild(&m, g);
    z1_core(&mut m, g, m_teal, Z1_SKIN, false);
    tag(&mut m, g, p, k, &["torso", "neck", "head"]);
    k = nchild(&m, g);
    for i in 0..2_u32 {
        let mt = if i == 0 { m_iron } else { m_iron_d };
        m.add_mesh(g, gb(0.184, 0.038, 0.106), mt).set_pos(
            0.0,
            Z1_TORSO_TOP - (0.050 + f64::from(i) * 0.046) * HEX_R,
            0.0,
        );
    }
    tag(&mut m, g, p, k, &["lamella-1", "lamella-2"]);
    k = nchild(&m, g);
    z1_sash(&mut m, g, m_owner);
    tag(&mut m, g, p, k, &["sash"]);

    let rows = [
        (gb(0.206, 0.034, 0.134), Z1_TORSO_BOT - 0.010 * HEX_R),
        (gb(0.198, 0.034, 0.130), Z1_TORSO_BOT - 0.044 * HEX_R),
        (gb(0.190, 0.034, 0.126), Z1_TORSO_BOT - 0.078 * HEX_R),
    ];
    k = nchild(&m, g);
    for (geo, fy) in rows {
        m.add_mesh(g, geo, m_fleece).set_pos(0.0, fy, 0.0);
    }
    tag(&mut m, g, p, k, &["kaunakes-1", "kaunakes-2", "kaunakes-3"]);

    k = nchild(&m, g);
    z1_build_leg(
        &mut m, g, Z1_HIP_X, 0.26, 0.10, m_teal, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-left-thigh", "leg-left-shin", "leg-left-foot"],
    );
    k = nchild(&m, g);
    z1_build_leg(
        &mut m, g, -Z1_HIP_X, -0.26, -0.08, m_teal, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-right-thigh", "leg-right-shin", "leg-right-foot"],
    );

    m.add_mesh(
        g,
        cy(0.018 * HEX_R, 0.090 * HEX_R, 0.125 * HEX_R, 8),
        m_iron,
    )
    .set_pos(0.0, Z1_HEAD_CTR + 0.040 * HEX_R, 0.0)
    .set_name("mt-helmet-cone");
    m.add_mesh(g, gb(0.018, 0.058, 0.016), m_iron_d)
        .set_pos(
            0.0,
            Z1_HEAD_CTR - 0.008 * HEX_R,
            Z1_HEAD_S * 0.5 + 0.006 * HEX_R,
        )
        .set_name("mt-helmet-nasal");
    m.add_mesh(g, gb(0.120, 0.040, 0.020), m_iron)
        .rot_x(-0.38)
        .set_pos(
            0.0,
            Z1_HEAD_CTR - 0.020 * HEX_R,
            -(Z1_HEAD_S * 0.5 + 0.010 * HEX_R),
        )
        .set_name("mt-helmet-neckguard");
    m.add_mesh(g, gb(0.084, 0.052, 0.024), m_black)
        .set_pos(
            0.0,
            Z1_HEAD_CTR - 0.052 * HEX_R,
            Z1_HEAD_S * 0.5 - 0.004 * HEX_R,
        )
        .set_name("mt-beard");

    const MT_SPEAR_TILT: f64 = 0.15;
    let mt_spear_axis = v3(0.0, -js_sin(MT_SPEAR_TILT), js_cos(MT_SPEAR_TILT));
    let mt_spear_rotx = PI * 0.5 + MT_SPEAR_TILT;
    k = nchild(&m, g);
    let (wrist_r, _) = z1_build_arm(
        &mut m,
        g,
        -Z1_SHLD_X,
        0.95,
        2.15,
        m_teal,
        m_skin,
        Some(m_skin),
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["arm-right-upper", "arm-right-fore", "arm-right-fist"],
    );
    let grip = wrist_r;
    m.add_mesh(g, gb(0.019, 0.520, 0.019), m_wood)
        .rot_x(mt_spear_rotx)
        .set_pos_v(add_scaled(grip, mt_spear_axis, 0.175 * HEX_R))
        .set_name("mt-spear-shaft");
    m.add_mesh(g, cn(0.019 * HEX_R, 0.058 * HEX_R, 4), m_iron)
        .rot_x(mt_spear_rotx)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(
            grip,
            mt_spear_axis,
            (0.175 + 0.260 + 0.029) * HEX_R,
        ))
        .set_name("mt-spear-tip");
    m.add_mesh(g, gb(0.024, 0.030, 0.024), m_iron_d)
        .rot_x(mt_spear_rotx)
        .set_pos_v(add_scaled(
            grip,
            mt_spear_axis,
            (0.175 - 0.260 - 0.015) * HEX_R,
        ))
        .set_name("mt-spear-butt");

    k = nchild(&m, g);
    let (wrist_l, _) = z1_build_arm(&mut m, g, Z1_SHLD_X, 0.42, 0.98, m_teal, m_skin, None);
    tag(&mut m, g, p, k, &["arm-left-upper", "arm-left-fore"]);
    let sh = m.detached_group();
    m.node(sh).set_name("mt-shield").set_pos(
        wrist_l.x - 0.078 * HEX_R,
        0.198 * HEX_R,
        wrist_l.z + 0.050 * HEX_R,
    );
    m.add_mesh(sh, gb(0.244, 0.394, 0.012), m_wood)
        .set_pos(0.0, 0.0, -0.008 * HEX_R)
        .set_name("mt-shield-back");
    m.add_mesh(sh, gb(0.230, 0.380, 0.014), m_owner)
        .set_name("mt-shield-face");
    for (bi, fy) in [-0.112_f64, 0.112].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.244, 0.026, 0.010), m_iron_d)
            .set_pos(0.0, fy * HEX_R, 0.008 * HEX_R)
            .set_name(if bi == 0 {
                "mt-shield-bar-lower"
            } else {
                "mt-shield-bar-upper"
            });
    }
    for (ei, fx) in [-0.108_f64, 0.108].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.020, 0.394, 0.010), m_iron)
            .set_pos(fx * HEX_R, 0.0, 0.006 * HEX_R)
            .set_name(if ei == 0 {
                "mt-shield-edge-inner"
            } else {
                "mt-shield-edge-outer"
            });
    }
    for (si, fy) in [-0.036_f64, 0.036].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.024, 0.024, 0.010), m_iron)
            .rot_z(PI / 4.0)
            .set_pos(0.0, fy * HEX_R, 0.009 * HEX_R)
            .set_name(&format!("mt-shield-stud-{si}"));
    }
    m.attach(g, sh);
    m
}

/// `buildGarnizonHarappy(ownerColor)` (`:1183-1329`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_garnizon_harappy(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let p = "gr-";
    let m_cotton = m.mat(Z1_COTTON, 0.04, 0.86);
    let m_owner = m.mat(owner, 0.15, 0.65);
    let m_reed = m.mat(Z1_REED, 0.04, 0.88);
    let m_reed_d = m.mat(Z1_REED_DARK, 0.04, 0.88);
    let m_iron = m.mat(Z1_IRON, 0.55, 0.40);
    let m_iron_d = m.mat(Z1_IRON_DK, 0.50, 0.46);
    let m_carn = m.mat(Z1_CARNELIAN, 0.20, 0.45);
    let m_teal = m.mat(Z1_TEALBEAD, 0.18, 0.50);
    let m_leath = m.mat(Z1_LEATHER, 0.06, 0.82);
    let _m_wood = m.mat(Z1_WOOD, 0.05, 0.85);

    let hip_y = Z1_HIP_Y - 0.008 * HEX_R;

    let mut k = nchild(&m, g);
    let m_skin = z1_core(&mut m, g, m_cotton, Z1_SKIN_INDUS, true);
    tag(
        &mut m,
        g,
        p,
        k,
        &["torso", "neck", "head", "eye-right", "eye-left"],
    );
    m.add_mesh(g, g_skirt(), m_cotton)
        .set_pos(0.0, Z1_TORSO_BOT - 0.018 * HEX_R, 0.0)
        .set_name("gr-skirt");
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, 0.252 * HEX_R, 0.0)
        .set_name("gr-belt");

    k = nchild(&m, g);
    for (bi, bx_) in [-0.040_f64, 0.0, 0.040].into_iter().enumerate() {
        let mt = if bi % 2 == 0 { m_carn } else { m_teal };
        let arc = if bx_.abs() < 0.02 { -0.008 } else { 0.0 };
        m.add_mesh(g, gb(0.024, 0.024, 0.014), mt).set_pos(
            bx_ * HEX_R,
            Z1_TORSO_TOP - 0.014 * HEX_R + arc * HEX_R,
            Z1_TORSO_D * 0.5 + 0.008 * HEX_R,
        );
    }
    tag(
        &mut m,
        g,
        p,
        k,
        &[
            "bead-carnelian-right",
            "bead-turquoise-mid",
            "bead-carnelian-left",
        ],
    );

    k = nchild(&m, g);
    z1_build_leg(
        &mut m, g, Z1_HIP_X, 0.42, 0.24, m_cotton, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-left-thigh", "leg-left-shin", "leg-left-foot"],
    );
    k = nchild(&m, g);
    z1_build_leg(
        &mut m, g, -Z1_HIP_X, -0.38, -0.14, m_cotton, m_skin, m_leath, hip_y,
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["leg-right-thigh", "leg-right-shin", "leg-right-foot"],
    );

    m.add_mesh(
        g,
        cy(0.046 * HEX_R, 0.068 * HEX_R, 0.058 * HEX_R, 8),
        m_leath,
    )
    .set_pos(0.0, Z1_HEAD_CTR + 0.058 * HEX_R, 0.0)
    .set_name("gr-leather-cap");
    m.add_mesh(g, gb(0.172, 0.034, 0.172), m_cotton)
        .rot_y(PI / 8.0)
        .set_pos(0.0, Z1_HEAD_CTR + 0.030 * HEX_R, 0.0)
        .set_name("gr-turban-wrap");
    m.add_mesh(g, gb(0.026, 0.038, 0.012), m_carn)
        .set_pos(0.0, Z1_HEAD_CTR + 0.030 * HEX_R, 0.092 * HEX_R)
        .set_name("gr-turban-jewel");

    k = nchild(&m, g);
    let (wrist_r, ax) = z1_build_arm(
        &mut m,
        g,
        -Z1_SHLD_X,
        0.85,
        1.52,
        m_cotton,
        m_skin,
        Some(m_skin),
    );
    tag(
        &mut m,
        g,
        p,
        k,
        &["arm-right-upper", "arm-right-fore", "arm-right-fist"],
    );
    m.add_mesh(g, gb(0.052, 0.016, 0.022), m_iron_d)
        .rot_x(PI - 1.52)
        .set_pos_v(add_scaled(wrist_r, ax, 0.034 * HEX_R))
        .set_name("gr-cleaver-guard");
    m.add_mesh(g, gb(0.038, 0.130, 0.012), m_iron)
        .rot_x(PI - 1.52)
        .set_pos_v(add_scaled(wrist_r, ax, 0.102 * HEX_R))
        .set_name("gr-cleaver-blade");
    m.add_mesh(g, gb(0.030, 0.036, 0.011), m_iron)
        .rot_x(PI - 1.52)
        .rot_z(0.42)
        .set_pos_v(add_scaled(wrist_r, ax, 0.180 * HEX_R))
        .set_name("gr-cleaver-tip");

    k = nchild(&m, g);
    let (wrist_l, _) = z1_build_arm(&mut m, g, Z1_SHLD_X, 0.50, 1.10, m_cotton, m_skin, None);
    tag(&mut m, g, p, k, &["arm-left-upper", "arm-left-fore"]);
    let sh = m.detached_group();
    m.node(sh)
        .set_name("gr-shield")
        .set_pos(
            wrist_l.x - 0.030 * HEX_R,
            wrist_l.y + 0.052 * HEX_R,
            wrist_l.z + 0.050 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, gb(0.210, 0.340, 0.014), m_reed)
        .set_name("gr-shield-wicker");
    for (hi, vy) in [-0.110_f64, 0.110].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.222, 0.036, 0.020), m_leath)
            .set_pos(0.0, vy * HEX_R, 0.010 * HEX_R)
            .set_name(if hi == 0 {
                "gr-shield-strap-lower"
            } else {
                "gr-shield-strap-upper"
            });
    }
    for (vi, vx) in [-0.056_f64, 0.056].into_iter().enumerate() {
        m.add_mesh(sh, gb(0.034, 0.352, 0.026), m_reed_d)
            .set_pos(vx * HEX_R, 0.0, 0.016 * HEX_R)
            .set_name(if vi == 0 {
                "gr-shield-rib-inner"
            } else {
                "gr-shield-rib-outer"
            });
    }
    m.add_mesh(sh, gb(0.222, 0.044, 0.024), m_owner)
        .set_pos(0.0, 0.0, 0.020 * HEX_R)
        .set_name("gr-shield-band");
    for (si, (vx, vy)) in [
        (-0.056_f64, -0.110_f64),
        (0.056, -0.110),
        (-0.056, 0.110),
        (0.056, 0.110),
    ]
    .into_iter()
    .enumerate()
    {
        m.add_mesh(sh, gb(0.020, 0.020, 0.010), m_iron)
            .rot_z(PI / 4.0)
            .set_pos(vx * HEX_R, vy * HEX_R, 0.022 * HEX_R)
            .set_name(&format!("gr-shield-stud-{si}"));
    }
    m.attach(g, sh);
    m
}
