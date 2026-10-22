//! Port of `render/jednostki-p1-rdzen.ts` (`edb8fb56`): the generic core
//! series (7 exports). In the game only `buildProcarz`, `buildWlocznik` and
//! `buildMiecznik` are reachable (`case 'procarz'|'wlocznik'|'miecznik'` of
//! `buildCategoryModel`); `buildWojownikKamien`, `buildOszczepnik`,
//! `buildLucznik` and `buildZwiadowca` are unused exports (replaced by
//! `kamien-bazowe-opus5.ts`) and are ported per D-MOD-3 = B.
//!
//! The web `p1Geos` registry (`getG(key, make)`, first creation wins) maps
//! to plain [`Prim`] values: every key is always created with the same
//! arguments, so the geometry is identical.

use super::consts::HEX_R;
use super::jstrig::JsTrig;
use super::model::{Geo, LeafBlade, MatId, NodeId, Prim, UnitModel, ROOT};
use crate::geom::Vec3;
use std::f64::consts::PI;

const P1_SKIN: u32 = 0xe0ac69;
const P1_SKIN_DARK: u32 = 0xc89058;
const P1_FUR_DK: u32 = 0x5f4a30;
const P1_FUR_LT: u32 = 0x8a6f4d;
const P1_LEATHER: u32 = 0x6b4a28;
const P1_LEATH_LT: u32 = 0x96703f;
const P1_WOOD: u32 = 0x7a5c3a;
const P1_WOOD_DK: u32 = 0x5c452c;
const P1_FLINT: u32 = 0x8d9298;
const P1_BONE: u32 = 0xe6ddc2;
const P1_BRONZE: u32 = 0xcf9234;
const P1_BRONZE_LT: u32 = 0xd8ab52;
const P1_STRING: u32 = 0xd8cfb4;
const P1_OCHRE: u32 = 0xc8932e;
const P1_TEAL: u32 = 0x1f7a78;
const P1_RUST: u32 = 0xb5482f;
const P1_OLIVE: u32 = 0x5d6b34;
const P1_STONE: u32 = 0x8a857c;

const P1_HIP_Y: f64 = 0.208 * HEX_R;
const P1_TORSO_W: f64 = 0.180 * HEX_R;
const P1_TORSO_H: f64 = 0.205 * HEX_R;
const P1_TORSO_D: f64 = 0.100 * HEX_R;
const P1_TORSO_BOT: f64 = 0.240 * HEX_R;
const P1_TORSO_CTR: f64 = P1_TORSO_BOT + P1_TORSO_H * 0.5;
const P1_TORSO_TOP: f64 = P1_TORSO_BOT + P1_TORSO_H;
const P1_NECK_H: f64 = 0.028 * HEX_R;
const P1_HEAD_S: f64 = 0.128 * HEX_R;
const P1_HEAD_CTR: f64 = P1_TORSO_TOP + P1_NECK_H + P1_HEAD_S * 0.5;
const P1_HEAD_TOP: f64 = P1_TORSO_TOP + P1_NECK_H + P1_HEAD_S;
const P1_SHLD_X: f64 = P1_TORSO_W * 0.5 + 0.030 * HEX_R;
const P1_SHLD_Y: f64 = P1_TORSO_TOP - 0.024 * HEX_R;
const P1_HIP_X: f64 = 0.052 * HEX_R;
const P1_THIGH_L: f64 = 0.104 * HEX_R;
const P1_SHIN_L: f64 = 0.096 * HEX_R;
const P1_UPARM_L: f64 = 0.100 * HEX_R;
const P1_FOREARM_L: f64 = 0.092 * HEX_R;

/// `gBox(k, w, h, d)` = `BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R)`.
fn g_box(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w * HEX_R, h * HEX_R, d * HEX_R))
}
fn g_torso() -> Geo {
    g_box(0.180, 0.205, 0.100)
}
fn g_neck() -> Geo {
    g_box(0.042, 0.045, 0.042)
}
fn g_head() -> Geo {
    g_box(0.128, 0.128, 0.128)
}
fn g_thigh() -> Geo {
    g_box(0.056, 0.104, 0.060)
}
fn g_shin() -> Geo {
    g_box(0.038, 0.096, 0.042)
}
fn g_foot() -> Geo {
    g_box(0.044, 0.026, 0.078)
}
fn g_up_arm() -> Geo {
    g_box(0.054, 0.100, 0.054)
}
fn g_forearm() -> Geo {
    g_box(0.040, 0.092, 0.040)
}
fn g_fist() -> Geo {
    g_box(0.046, 0.046, 0.048)
}
fn g_skirt() -> Geo {
    g_box(0.196, 0.070, 0.118)
}
fn g_belt() -> Geo {
    g_box(0.190, 0.034, 0.112)
}
fn g_sash() -> Geo {
    g_box(0.186, 0.032, 0.106)
}
fn g_cone(r: f64, h: f64, radial: u32) -> Geo {
    Geo::Prim(Prim::cone(r, h, radial))
}
fn g_cyl(rt: f64, rb: f64, h: f64, radial: u32) -> Geo {
    Geo::Prim(Prim::cyl(rt, rb, h, radial))
}
fn g_cyl_open(rt: f64, rb: f64, h: f64, radial: u32) -> Geo {
    Geo::Prim(Prim::cyl_open(rt, rb, h, radial))
}
/// `BoxGeometry(t, 1, t)` used by `p1Span` (unit height, scaled along Y).
fn g_unit_rod(t: f64) -> Geo {
    Geo::Prim(Prim::bx(t * HEX_R, 1.0, t * HEX_R))
}

/// `p1Dir(theta)`: from the vertical DOWN, +theta = forward (+Z).
fn p1_dir(theta: f64) -> Vec3 {
    Vec3::new(0.0, -theta.js_cos(), theta.js_sin())
}

/// `p1Seg` (`jednostki-p1-rdzen.ts:117-127`).
fn p1_seg(
    m: &mut UnitModel,
    g: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    theta: f64,
    len: f64,
) -> Vec3 {
    let dir = p1_dir(theta);
    m.add_mesh(g, geo, mtl)
        .rot_x(PI - theta)
        .set_pos_v(p.plus(dir.scale(len * 0.5)));
    p.plus(dir.scale(len))
}

/// `p1Span` (`jednostki-p1-rdzen.ts:130-143`): a Y-axis mesh stretched A→B.
fn p1_span(m: &mut UnitModel, g: NodeId, geo: Geo, mtl: MatId, a: Vec3, b: Vec3) {
    let dir = b.minus(a);
    let len = dir.length();
    let dir = dir.normalize();
    let height = geo.parameters_height();
    let n = m.add_mesh(g, geo, mtl);
    n.quat_from_unit_vectors(Vec3::new(0.0, 1.0, 0.0), dir);
    n.scale.y = len / height;
    n.set_pos_v(a.plus(dir.scale(len * 0.5)));
}

/// `p1BuildLeg` (`jednostki-p1-rdzen.ts:146-158`).
#[allow(clippy::too_many_arguments)]
fn p1_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
    hip_y: f64,
) {
    let mut p = Vec3::new(sx, hip_y, 0.0);
    p = p1_seg(m, g, g_thigh(), m_thigh, p, th_u, P1_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = p1_seg(m, g, g_shin(), m_shin, p, th_l, P1_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
}

/// `p1BuildArm` result.
struct Arm {
    wrist: Vec3,
    axis: Vec3,
}

/// `p1BuildArm` (`jednostki-p1-rdzen.ts:161-177`).
#[allow(clippy::too_many_arguments)]
fn p1_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> Arm {
    let mut p = Vec3::new(sx, P1_SHLD_Y, 0.0);
    p = p1_seg(m, g, g_up_arm(), m_up, p, th_u, P1_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = p1_seg(m, g, g_forearm(), m_fore, p, th_f, P1_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(wrist.plus(p1_dir(th_f).scale(0.014 * HEX_R)));
    }
    Arm {
        wrist,
        axis: p1_dir(th_f),
    }
}

/// `p1BuildCore` (`jednostki-p1-rdzen.ts:180-195`): torso + neck + head.
fn p1_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin: u32) -> MatId {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, P1_TORSO_CTR, 0.0);
    let m_skin = m.mat(skin, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, P1_TORSO_TOP + P1_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, P1_HEAD_CTR, 0.0);
    m_skin
}

/// `p1OwnerSash`.
fn p1_owner_sash(m: &mut UnitModel, g: NodeId, m_owner: MatId) {
    m.add_mesh(g, g_sash(), m_owner)
        .set_pos(0.0, P1_TORSO_CTR - 0.012 * HEX_R, 0.0);
}

/// `p1SkirtBelt`.
fn p1_skirt_belt(m: &mut UnitModel, g: NodeId, m_skirt: MatId, m_belt: Option<MatId>) {
    m.add_mesh(g, g_skirt(), m_skirt)
        .set_pos(0.0, P1_TORSO_BOT - 0.018 * HEX_R, 0.0);
    if let Some(b) = m_belt {
        m.add_mesh(g, g_belt(), b).set_pos(0.0, 0.252 * HEX_R, 0.0);
    }
}

/// `p1FurCap`.
fn p1_fur_cap(m: &mut UnitModel, g: NodeId, m_fur: MatId) {
    m.add_mesh(
        g,
        g_cyl(0.058 * HEX_R, 0.088 * HEX_R, 0.080 * HEX_R, 8),
        m_fur,
    )
    .set_pos(0.0, P1_HEAD_CTR + 0.052 * HEX_R, 0.0);
}

/// `p1BronzeCone`.
fn p1_bronze_cone(m: &mut UnitModel, g: NodeId, m_bronze: MatId, m_knob: Option<MatId>) {
    m.add_mesh(
        g,
        g_cyl(0.086 * HEX_R, 0.092 * HEX_R, 0.036 * HEX_R, 8),
        m_bronze,
    )
    .set_pos(0.0, P1_HEAD_CTR + 0.036 * HEX_R, 0.0);
    m.add_mesh(g, g_cone(0.086 * HEX_R, 0.108 * HEX_R, 8), m_bronze)
        .set_pos(0.0, P1_HEAD_CTR + 0.108 * HEX_R, 0.0);
    if let Some(k) = m_knob {
        m.add_mesh(g, g_box(0.026, 0.030, 0.026), k)
            .set_pos(0.0, P1_HEAD_CTR + 0.170 * HEX_R, 0.0);
    }
}

/// Round shield sub-group at the left wrist (`sh` groups of the p1 models).
struct ShieldSpec {
    off: (f64, f64, f64),
    yaw: f64,
}

fn shield_group(m: &mut UnitModel, g: NodeId, wrist: Vec3, s: &ShieldSpec) -> NodeId {
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist.x - s.off.0 * HEX_R,
            wrist.y + s.off.1 * HEX_R,
            wrist.z + s.off.2 * HEX_R,
        )
        .rot_y(s.yaw);
    let _ = g;
    sh
}

/// `buildWojownikKamien(ownerColor)` (`jednostki-p1-rdzen.ts:255-333`).
#[must_use]
pub fn build_wojownik_kamien(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_fur = m.mat(P1_FUR_DK, 0.04, 0.92);
    let m_fur_l = m.mat(P1_FUR_LT, 0.04, 0.90);
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let _m_wood = m.mat(P1_WOOD, 0.05, 0.85);
    let m_wood_d = m.mat(P1_WOOD_DK, 0.05, 0.86);
    let m_flint = m.mat(P1_FLINT, 0.18, 0.55);
    let m_bone = m.mat(P1_BONE, 0.06, 0.75);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let hip_y = P1_HIP_Y - 0.012 * HEX_R;

    let m_skin = p1_build_core(&mut m, g, m_fur, P1_SKIN);
    p1_skirt_belt(&mut m, g, m_leath, Some(m_fur_l));
    p1_owner_sash(&mut m, g, m_owner);
    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.58, 0.34, m_skin, m_leath, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.52, -0.20, m_skin, m_leath, m_leath, hip_y,
    );

    p1_fur_cap(&mut m, g, m_fur);
    m.add_mesh(g, g_box(0.150, 0.022, 0.150), m_owner).set_pos(
        0.0,
        P1_HEAD_CTR + 0.026 * HEX_R,
        0.0,
    );
    m.add_mesh(g, g_cone(0.018 * HEX_R, 0.064 * HEX_R, 4), m_bone)
        .rot_x(0.85)
        .rot_y(PI / 4.0)
        .set_pos(0.0, P1_HEAD_CTR + 0.058 * HEX_R, 0.088 * HEX_R);

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        -2.30,
        2.75,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    let ax = arm_r.axis;
    m.add_mesh(g, g_box(0.021, 0.200, 0.021), m_wood_d)
        .rot_x(PI - 2.75)
        .set_pos_v(arm_r.wrist.plus(ax.scale(0.112 * HEX_R)));
    m.add_mesh(g, g_box(0.036, 0.100, 0.018), m_flint)
        .rot_x(PI - 2.75)
        .set_pos_v(arm_r.wrist.plus(ax.scale(0.258 * HEX_R)));
    m.add_mesh(g, g_cone(0.020 * HEX_R, 0.048 * HEX_R, 4), m_flint)
        .rot_x(PI - 2.75)
        .rot_y(PI / 4.0)
        .set_pos_v(arm_r.wrist.plus(ax.scale(0.330 * HEX_R)));

    let arm_l = p1_build_arm(&mut m, g, P1_SHLD_X, 0.50, 1.10, m_skin, m_skin, None);
    let sh = shield_group(
        &mut m,
        g,
        arm_l.wrist,
        &ShieldSpec {
            off: (0.020, 0.030, 0.040),
            yaw: -0.20,
        },
    );
    m.add_mesh(
        sh,
        g_cyl(0.086 * HEX_R, 0.078 * HEX_R, 0.020 * HEX_R, 10),
        m_owner,
    )
    .rot_x(PI / 2.0);
    m.add_mesh(
        sh,
        g_cyl_open(0.094 * HEX_R, 0.094 * HEX_R, 0.016 * HEX_R, 10),
        m_leath,
    )
    .rot_x(PI / 2.0)
    .set_pos(0.0, 0.0, -0.003 * HEX_R);
    m.add_mesh(sh, g_box(0.034, 0.034, 0.020), m_wood_d)
        .set_pos(0.0, 0.0, 0.013 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildOszczepnik(ownerColor)` (`jednostki-p1-rdzen.ts:341-406`).
#[must_use]
pub fn build_oszczepnik(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_fur = m.mat(P1_FUR_LT, 0.04, 0.90);
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let m_wood = m.mat(P1_WOOD, 0.05, 0.85);
    let m_flint = m.mat(P1_FLINT, 0.18, 0.55);
    let m_bone = m.mat(P1_BONE, 0.06, 0.75);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let hip_y = P1_HIP_Y - 0.012 * HEX_R;

    let m_torso = m.mat(P1_SKIN_DARK, 0.05, 0.80);
    let m_skin = p1_build_core(&mut m, g, m_torso, P1_SKIN_DARK);
    p1_skirt_belt(&mut m, g, m_fur, Some(m_leath));
    p1_owner_sash(&mut m, g, m_owner);
    m.add_mesh(g, g_box(0.026, 0.230, 0.014), m_leath)
        .rot_z(0.60)
        .set_pos(
            0.0,
            P1_TORSO_CTR + 0.030 * HEX_R,
            P1_TORSO_D * 0.5 + 0.006 * HEX_R,
        );

    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.60, 0.36, m_skin, m_skin, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.54, -0.22, m_skin, m_skin, m_leath, hip_y,
    );

    p1_fur_cap(&mut m, g, m_leath);
    m.add_mesh(g, g_box(0.022, 0.098, 0.012), m_bone)
        .rot_x(-0.42)
        .set_pos(0.030 * HEX_R, P1_HEAD_TOP + 0.055 * HEX_R, -0.045 * HEX_R);

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        -2.55,
        1.32,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    let jav_th = PI * 0.5 - 0.14;
    let jav_axis = Vec3::new(0.0, 0.14_f64.js_sin(), 0.14_f64.js_cos());
    let grip = arm_r.wrist.plus(arm_r.axis.scale(0.014 * HEX_R));
    m.add_mesh(g, g_box(0.015, 0.440, 0.015), m_wood)
        .rot_x(PI - jav_th)
        .set_pos_v(grip.plus(jav_axis.scale(0.060 * HEX_R)));
    m.add_mesh(g, g_cone(0.017 * HEX_R, 0.055 * HEX_R, 4), m_flint)
        .rot_x(PI - jav_th)
        .rot_y(PI / 4.0)
        .set_pos_v(grip.plus(jav_axis.scale((0.060 + 0.220 + 0.024) * HEX_R)));

    let arm_l = p1_build_arm(
        &mut m,
        g,
        P1_SHLD_X,
        0.35,
        0.55,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    for dz in [-0.014, 0.014] {
        m.add_mesh(g, g_box(0.013, 0.400, 0.013), m_wood).set_pos(
            arm_l.wrist.x + 0.004 * HEX_R,
            arm_l.wrist.y + 0.085 * HEX_R,
            arm_l.wrist.z + dz * HEX_R,
        );
        m.add_mesh(g, g_cone(0.017 * HEX_R, 0.055 * HEX_R, 4), m_flint)
            .rot_y(PI / 4.0)
            .set_pos(
                arm_l.wrist.x + 0.004 * HEX_R,
                arm_l.wrist.y + 0.085 * HEX_R + 0.227 * HEX_R,
                arm_l.wrist.z + dz * HEX_R,
            );
    }
    m
}

/// `buildLucznik(ownerColor)` (`jednostki-p1-rdzen.ts:415-506`).
#[must_use]
pub fn build_lucznik(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let m_vest = m.mat(P1_LEATH_LT, 0.05, 0.86);
    let m_wood = m.mat(P1_WOOD, 0.05, 0.82);
    let m_flint = m.mat(P1_FLINT, 0.18, 0.55);
    let m_bone = m.mat(P1_BONE, 0.06, 0.75);
    let m_str = m.mat(P1_STRING, 0.02, 0.95);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let hip_y = P1_HIP_Y - 0.008 * HEX_R;

    let m_skin = p1_build_core(&mut m, g, m_vest, P1_SKIN);
    p1_skirt_belt(&mut m, g, m_leath, Some(m_leath));
    p1_owner_sash(&mut m, g, m_owner);
    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.42, 0.22, m_skin, m_skin, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.40, -0.14, m_skin, m_skin, m_leath, hip_y,
    );

    p1_fur_cap(&mut m, g, m_leath);
    m.add_mesh(g, g_box(0.020, 0.092, 0.012), m_bone)
        .rot_z(-0.50)
        .set_pos(0.062 * HEX_R, P1_HEAD_TOP + 0.048 * HEX_R, -0.010 * HEX_R);

    let arm_l = p1_build_arm(
        &mut m,
        g,
        P1_SHLD_X,
        1.45,
        1.50,
        m_vest,
        m_skin,
        Some(m_skin),
    );
    let grip_p = arm_l.wrist.plus(arm_l.axis.scale(0.020 * HEX_R));
    let bow_r = 0.140 * HEX_R;
    let mut bow_pts: Vec<Vec3> = Vec::new();
    for i in 0..=6_u32 {
        let phi = (-70.0 + (140.0 / 6.0) * f64::from(i)) * PI / 180.0;
        bow_pts.push(Vec3::new(
            grip_p.x,
            grip_p.y + bow_r * phi.js_sin(),
            grip_p.z - bow_r + bow_r * phi.js_cos(),
        ));
    }
    for i in 0..6 {
        p1_span(
            &mut m,
            g,
            g_unit_rod(0.016),
            m_wood,
            bow_pts[i],
            bow_pts[i + 1],
        );
    }

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        1.30,
        -2.05,
        m_vest,
        m_skin,
        Some(m_skin),
    );
    let nock = Vec3::new(
        arm_r.wrist.x + 0.030 * HEX_R,
        arm_r.wrist.y,
        arm_r.wrist.z + 0.024 * HEX_R,
    );
    p1_span(&mut m, g, g_unit_rod(0.007), m_str, bow_pts[0], nock);
    p1_span(&mut m, g, g_unit_rod(0.007), m_str, bow_pts[6], nock);

    let arr_dir = grip_p
        .plus(Vec3::new(0.0, 0.012 * HEX_R, 0.02 * HEX_R))
        .minus(nock)
        .normalize();
    let arr_end = nock.plus(arr_dir.scale(0.330 * HEX_R));
    p1_span(&mut m, g, g_unit_rod(0.011), m_wood, nock, arr_end);
    m.add_mesh(g, g_cone(0.014 * HEX_R, 0.042 * HEX_R, 4), m_flint)
        .quat_from_unit_vectors(Vec3::new(0.0, 1.0, 0.0), arr_dir)
        .set_pos_v(arr_end.plus(arr_dir.scale(0.018 * HEX_R)));
    for off in [0.014, 0.036] {
        m.add_mesh(g, g_box(0.006, 0.026, 0.024), m_bone)
            .quat_from_unit_vectors(Vec3::new(0.0, 0.0, 1.0), arr_dir)
            .set_pos_v(nock.plus(arr_dir.scale(off * HEX_R)));
    }

    m.add_mesh(g, g_box(0.052, 0.170, 0.045), m_owner)
        .rot_x(-0.30)
        .set_pos(
            -0.048 * HEX_R,
            P1_TORSO_CTR + 0.040 * HEX_R,
            -(P1_TORSO_D * 0.5 + 0.030 * HEX_R),
        );
    for dx in [-0.014, 0.012] {
        m.add_mesh(g, g_box(0.009, 0.075, 0.009), m_wood)
            .rot_x(-0.30)
            .set_pos(
                -0.048 * HEX_R + dx * HEX_R,
                P1_TORSO_CTR + 0.150 * HEX_R,
                -(P1_TORSO_D * 0.5 + 0.064 * HEX_R),
            );
        m.add_mesh(g, g_box(0.006, 0.026, 0.024), m_bone)
            .rot_x(-0.30)
            .set_pos(
                -0.048 * HEX_R + dx * HEX_R,
                P1_TORSO_CTR + 0.185 * HEX_R,
                -(P1_TORSO_D * 0.5 + 0.075 * HEX_R),
            );
    }
    m
}

/// `buildZwiadowca(ownerColor)` (`jednostki-p1-rdzen.ts:514-573`).
#[must_use]
pub fn build_zwiadowca(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_fur = m.mat(P1_FUR_DK, 0.04, 0.92);
    let m_fur_l = m.mat(P1_FUR_LT, 0.04, 0.90);
    let m_tunic = m.mat(P1_OLIVE, 0.05, 0.86);
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let m_wood = m.mat(P1_WOOD, 0.05, 0.82);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let hip_y = P1_HIP_Y - 0.014 * HEX_R;

    let m_skin = p1_build_core(&mut m, g, m_tunic, P1_SKIN_DARK);
    p1_skirt_belt(&mut m, g, m_leath, Some(m_fur_l));
    p1_owner_sash(&mut m, g, m_owner);
    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.72, 0.40, m_tunic, m_skin, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.62, -0.26, m_tunic, m_skin, m_leath, hip_y,
    );

    p1_fur_cap(&mut m, g, m_fur);
    m.add_mesh(g, g_box(0.032, 0.110, 0.026), m_fur_l)
        .rot_x(-0.55)
        .set_pos(
            0.0,
            P1_HEAD_CTR + 0.010 * HEX_R,
            -(P1_HEAD_S * 0.5 + 0.028 * HEX_R),
        );

    let arm_l = p1_build_arm(&mut m, g, P1_SHLD_X, 1.90, 2.99, m_tunic, m_skin, None);
    m.add_mesh(g, g_box(0.052, 0.016, 0.066), m_skin)
        .set_pos_v(
            arm_l
                .wrist
                .plus(Vec3::new(-0.030 * HEX_R, 0.014 * HEX_R, 0.010 * HEX_R)),
        );

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        0.42,
        0.70,
        m_tunic,
        m_skin,
        Some(m_skin),
    );
    let staff_x = arm_r.wrist.x - 0.004 * HEX_R;
    let staff_z = arm_r.wrist.z + 0.016 * HEX_R;
    m.add_mesh(g, g_box(0.016, 0.430, 0.016), m_wood)
        .set_pos(staff_x, 0.215 * HEX_R, staff_z);
    m.add_mesh(g, g_box(0.026, 0.024, 0.026), m_wood)
        .set_pos(staff_x, 0.442 * HEX_R, staff_z);

    m.add_mesh(g, g_box(0.062, 0.072, 0.032), m_leath).set_pos(
        0.100 * HEX_R,
        0.250 * HEX_R,
        0.018 * HEX_R,
    );
    m.add_mesh(g, g_box(0.062, 0.024, 0.036), m_owner).set_pos(
        0.100 * HEX_R,
        0.282 * HEX_R,
        0.018 * HEX_R,
    );
    m.add_mesh(g, g_box(0.024, 0.250, 0.012), m_leath)
        .rot_z(-0.62)
        .set_pos(
            0.0,
            P1_TORSO_CTR + 0.030 * HEX_R,
            P1_TORSO_D * 0.5 + 0.006 * HEX_R,
        );
    m
}

/// `buildProcarz(ownerColor)` (`jednostki-p1-rdzen.ts:606-663`).
#[must_use]
pub fn build_procarz(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_tunic = m.mat(P1_OCHRE, 0.05, 0.85);
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let m_bronz = m.mat(P1_BRONZE, 0.42, 0.42);
    let m_cord = m.mat(P1_STRING, 0.03, 0.92);
    let m_stone = m.mat(P1_STONE, 0.05, 0.95);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let hip_y = P1_HIP_Y - 0.010 * HEX_R;

    let m_skin = p1_build_core(&mut m, g, m_tunic, P1_SKIN);
    p1_skirt_belt(&mut m, g, m_tunic, Some(m_leath));
    p1_owner_sash(&mut m, g, m_owner);
    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.55, 0.30, m_tunic, m_skin, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.48, -0.16, m_tunic, m_skin, m_leath, hip_y,
    );

    p1_bronze_cone(&mut m, g, m_bronz, None);

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        -2.90,
        2.50,
        m_tunic,
        m_skin,
        Some(m_skin),
    );
    let p0 = arm_r.wrist.plus(arm_r.axis.scale(0.016 * HEX_R));
    let p1p = Vec3::new(-0.005 * HEX_R, p0.y + 0.062 * HEX_R, p0.z - 0.158 * HEX_R);
    let p2p = Vec3::new(0.128 * HEX_R, p0.y + 0.028 * HEX_R, p0.z - 0.005 * HEX_R);
    p1_span(&mut m, g, g_unit_rod(0.011), m_cord, p0, p1p);
    p1_span(&mut m, g, g_unit_rod(0.011), m_cord, p1p, p2p);
    m.add_mesh(g, g_box(0.044, 0.026, 0.060), m_leath)
        .set_pos_v(p2p)
        .rot_y(0.5);
    m.add_mesh(g, g_box(0.024, 0.020, 0.024), m_stone)
        .set_scale_scalar(1.15)
        .set_pos_v(p2p.plus(Vec3::new(0.0, 0.020 * HEX_R, 0.0)));

    p1_build_arm(
        &mut m,
        g,
        P1_SHLD_X,
        0.85,
        1.15,
        m_tunic,
        m_skin,
        Some(m_skin),
    );

    m.add_mesh(g, g_box(0.058, 0.062, 0.034), m_leath).set_pos(
        -0.100 * HEX_R,
        0.248 * HEX_R,
        0.020 * HEX_R,
    );
    for dx in [-0.012, 0.012] {
        m.add_mesh(g, g_box(0.024, 0.020, 0.024), m_stone)
            .set_scale_scalar(0.8)
            .set_pos(-0.100 * HEX_R + dx * HEX_R, 0.284 * HEX_R, 0.020 * HEX_R);
    }
    m
}

/// `buildWlocznik(ownerColor)` (`jednostki-p1-rdzen.ts:672-749`).
#[must_use]
pub fn build_wlocznik(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_tunic = m.mat(P1_TEAL, 0.05, 0.85);
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let m_bronz = m.mat(P1_BRONZE, 0.42, 0.42);
    let m_bronz_l = m.mat(P1_BRONZE_LT, 0.55, 0.35);
    let m_wood = m.mat(P1_WOOD, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let hip_y = P1_HIP_Y - 0.010 * HEX_R;

    let m_skin = p1_build_core(&mut m, g, m_tunic, P1_SKIN);
    p1_skirt_belt(&mut m, g, m_leath, Some(m_leath));
    p1_owner_sash(&mut m, g, m_owner);
    m.add_mesh(g, g_box(0.092, 0.088, 0.016), m_bronz).set_pos(
        0.0,
        P1_TORSO_CTR + 0.052 * HEX_R,
        P1_TORSO_D * 0.5 + 0.008 * HEX_R,
    );
    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.55, 0.30, m_tunic, m_bronz_l, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.50, -0.16, m_tunic, m_bronz_l, m_leath, hip_y,
    );

    p1_bronze_cone(&mut m, g, m_bronz, Some(m_bronz_l));
    m.add_mesh(g, g_box(0.018, 0.050, 0.014), m_bronz).set_pos(
        0.0,
        P1_HEAD_CTR + 0.004 * HEX_R,
        P1_HEAD_S * 0.5 + 0.006 * HEX_R,
    );

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        -2.55,
        1.32,
        m_tunic,
        m_skin,
        Some(m_skin),
    );
    let spear_th = PI * 0.5 + 0.20;
    let spear_axis = Vec3::new(0.0, -(0.20_f64.js_sin()), 0.20_f64.js_cos());
    let grip = arm_r.wrist.plus(arm_r.axis.scale(0.014 * HEX_R));
    m.add_mesh(g, g_box(0.020, 0.560, 0.020), m_wood)
        .rot_x(PI - spear_th)
        .set_pos_v(grip.plus(spear_axis.scale(0.125 * HEX_R)));
    let tip = m.add_mesh(g, g_cone(0.024 * HEX_R, 0.078 * HEX_R, 4), m_bronz_l);
    tip.rot_x(PI - spear_th).rot_y(PI / 4.0);
    tip.scale.z = 0.45;
    tip.set_pos_v(grip.plus(spear_axis.scale((0.125 + 0.280 + 0.034) * HEX_R)));
    m.add_mesh(g, g_box(0.022, 0.045, 0.022), m_bronz)
        .rot_x(PI - spear_th)
        .set_pos_v(grip.plus(spear_axis.scale((0.125 - 0.280 - 0.018) * HEX_R)));

    let arm_l = p1_build_arm(&mut m, g, P1_SHLD_X, 0.52, 1.05, m_tunic, m_skin, None);
    let sh = shield_group(
        &mut m,
        g,
        arm_l.wrist,
        &ShieldSpec {
            off: (0.040, 0.055, 0.048),
            yaw: -0.20,
        },
    );
    m.add_mesh(
        sh,
        g_cyl(0.104 * HEX_R, 0.088 * HEX_R, 0.026 * HEX_R, 12),
        m_owner,
    )
    .rot_x(PI / 2.0);
    m.add_mesh(
        sh,
        g_cyl_open(0.114 * HEX_R, 0.114 * HEX_R, 0.018 * HEX_R, 12),
        m_bronz_l,
    )
    .rot_x(PI / 2.0)
    .set_pos(0.0, 0.0, -0.004 * HEX_R);
    m.add_mesh(sh, g_box(0.040, 0.040, 0.024), m_bronz)
        .set_pos(0.0, 0.0, 0.018 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildMiecznik(ownerColor)` (`jednostki-p1-rdzen.ts:757-833`).
#[must_use]
pub fn build_miecznik(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_tunic = m.mat(P1_RUST, 0.05, 0.82);
    let m_leath = m.mat(P1_LEATHER, 0.05, 0.85);
    let m_bronz = m.mat(P1_BRONZE, 0.42, 0.42);
    let m_bronz_l = m.mat(P1_BRONZE_LT, 0.55, 0.35);
    let m_wood = m.mat(P1_WOOD_DK, 0.05, 0.85);
    let m_crest = m.mat(0xa0_1f2e, 0.08, 0.74);
    let m_owner = m.mat(owner, 0.14, 0.64);
    let hip_y = P1_HIP_Y - 0.012 * HEX_R;

    let m_skin = p1_build_core(&mut m, g, m_tunic, P1_SKIN);
    p1_skirt_belt(&mut m, g, m_leath, Some(m_leath));
    p1_owner_sash(&mut m, g, m_owner);
    p1_build_leg(
        &mut m, g, P1_HIP_X, 0.58, 0.34, m_tunic, m_skin, m_leath, hip_y,
    );
    p1_build_leg(
        &mut m, g, -P1_HIP_X, -0.52, -0.20, m_tunic, m_skin, m_leath, hip_y,
    );

    p1_bronze_cone(&mut m, g, m_bronz, None);
    m.add_mesh(g, g_box(0.100, 0.020, 0.022), m_bronz_l)
        .set_pos(0.0, P1_HEAD_CTR + 0.168 * HEX_R, 0.0);
    m.add_mesh(g, g_box(0.124, 0.048, 0.020), m_crest).set_pos(
        0.0,
        P1_HEAD_CTR + 0.198 * HEX_R,
        0.0,
    );

    let arm_r = p1_build_arm(
        &mut m,
        g,
        -P1_SHLD_X,
        -2.05,
        2.62,
        m_tunic,
        m_skin,
        Some(m_skin),
    );
    let ax = arm_r.axis;
    m.add_mesh(g, g_box(0.020, 0.052, 0.020), m_wood)
        .rot_x(PI - 2.62)
        .set_pos_v(arm_r.wrist.plus(ax.scale(0.012 * HEX_R)));
    m.add_mesh(g, g_box(0.058, 0.016, 0.024), m_bronz)
        .rot_x(PI - 2.62)
        .set_pos_v(arm_r.wrist.plus(ax.scale(0.042 * HEX_R)));
    m.add_mesh(
        g,
        Geo::body(LeafBlade {
            len: 0.185 * HEX_R,
            w_max: 0.058 * HEX_R,
        }),
        m_bronz_l,
    )
    .rot_x(PI - 2.62)
    .set_pos_v(arm_r.wrist.plus(ax.scale(0.050 * HEX_R)));

    let arm_l = p1_build_arm(&mut m, g, P1_SHLD_X, 0.50, 1.08, m_tunic, m_skin, None);
    let sh = shield_group(
        &mut m,
        g,
        arm_l.wrist,
        &ShieldSpec {
            off: (0.036, 0.050, 0.046),
            yaw: -0.22,
        },
    );
    m.add_mesh(
        sh,
        g_cyl(0.112 * HEX_R, 0.096 * HEX_R, 0.026 * HEX_R, 12),
        m_owner,
    )
    .rot_x(PI / 2.0);
    m.add_mesh(
        sh,
        g_cyl_open(0.122 * HEX_R, 0.122 * HEX_R, 0.018 * HEX_R, 12),
        m_bronz,
    )
    .rot_x(PI / 2.0)
    .set_pos(0.0, 0.0, -0.004 * HEX_R);
    m.add_mesh(sh, g_box(0.020, 0.190, 0.012), m_bronz_l)
        .set_pos(0.0, 0.0, 0.016 * HEX_R);
    m.add_mesh(sh, g_box(0.190, 0.020, 0.012), m_bronz_l)
        .set_pos(0.0, 0.0, 0.016 * HEX_R);
    m.attach(g, sh);
    m
}
