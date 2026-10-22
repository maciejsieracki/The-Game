//! Port of `render/jednostki-p3-dystans.ts` (`edb8fb56`), the two builders the
//! game reaches: `buildAkkadianArcher` (Łucznik akadyjski) and
//! `buildAssyrianArcher` (Łucznik asyryjski).
//!
//! The file's other exports `buildZuluJavelineer`, `buildEgyptianArcher`,
//! `buildSumerianArcher` (`:511`, `:638`, `:702`) have NO importer in
//! `gra/src` (`units.ts:136-139` imports only the two above; Izijula and the
//! Stone archers use the `kamien-*-opus5.ts` builders), so they are not
//! ported here (D-MOD-3, see the P4.23 document). Their Nguni shield
//! geometries (`pdOvalShellGeo`/`pdOvalFaceGeo`) are therefore unused.
//!
//! `pdSeg`/`pdArmIK` are textually the MOD-05 chain helpers
//! (`units_kamien::kit::{seg, arm_ik}`).

use super::kit::{add_scaled, bx, cn, cy, seg, stretch, v3, Y_UP};
use crate::geom::{Mat4, Vec3};
use crate::jsmath::js_atan2;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use crate::models::units_kamien::kit::{arm_ik, ArmIkKit};
use std::f64::consts::PI;

// ── kolory serii (`jednostki-p3-dystans.ts:77-99`, used subset)
const PD_SKIN: u32 = 0xe0ac69;
const PD_BRONZE: u32 = 0xcf9234;
const PD_BRONZE_LT: u32 = 0xd0a050;
const PD_WOOD_BOW: u32 = 0x8a6238;
const PD_LEATHER: u32 = 0x6b4a28;
const PD_LINEN: u32 = 0xe8e0c8;
const PD_STRING: u32 = 0xe8e0cc;
const PD_HAIR_DK: u32 = 0x1a0c06;
const PD_SCALE: u32 = 0x9a8a5a;
const PD_SCALE_DK: u32 = 0x6f6242;
const PD_BOOT_DK: u32 = 0x4a3526;

// ── wymiary sylwetki (`:102-119`)
const PD_HIP_Y: f64 = 0.208 * HEX_R;
const PD_TORSO_W: f64 = 0.180 * HEX_R;
const PD_TORSO_H: f64 = 0.205 * HEX_R;
const PD_TORSO_D: f64 = 0.100 * HEX_R;
const PD_TORSO_BOT: f64 = 0.240 * HEX_R;
const PD_TORSO_CTR: f64 = PD_TORSO_BOT + PD_TORSO_H * 0.5;
const PD_TORSO_TOP: f64 = PD_TORSO_BOT + PD_TORSO_H;
const PD_NECK_H: f64 = 0.028 * HEX_R;
const PD_HEAD_S: f64 = 0.128 * HEX_R;
const PD_HEAD_CTR: f64 = PD_TORSO_TOP + PD_NECK_H + PD_HEAD_S * 0.5;
const PD_HEAD_TOP: f64 = PD_TORSO_TOP + PD_NECK_H + PD_HEAD_S;
const PD_SHLD_X: f64 = PD_TORSO_W * 0.5 + 0.030 * HEX_R;
const PD_SHLD_Y: f64 = PD_TORSO_TOP - 0.024 * HEX_R;
const PD_HIP_X: f64 = 0.052 * HEX_R;
const PD_THIGH_L: f64 = 0.104 * HEX_R;
const PD_SHIN_L: f64 = 0.096 * HEX_R;
const PD_UPARM_L: f64 = 0.100 * HEX_R;
const PD_FOREARM_L: f64 = 0.092 * HEX_R;

/// `PD_GRIP` / `PD_NOCK` (`:383-384`).
const PD_GRIP: Vec3 = Vec3::new(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
const PD_NOCK: Vec3 = Vec3::new(-0.052 * HEX_R, 0.458 * HEX_R, -0.020 * HEX_R);

// ── geometrie-singletony (`:170-216`, used subset)
fn g_torso() -> Geo {
    bx(PD_TORSO_W, PD_TORSO_H, PD_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, PD_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(PD_HEAD_S, PD_HEAD_S, PD_HEAD_S)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, PD_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, PD_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, PD_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, PD_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.078 * HEX_R, 0.120 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.200 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)
}
fn g_bow_mid() -> Geo {
    bx(0.021 * HEX_R, 0.150 * HEX_R, 0.024 * HEX_R)
}
fn g_bow_limb() -> Geo {
    bx(0.019 * HEX_R, 0.125 * HEX_R, 0.021 * HEX_R)
}
fn g_bow_siyah() -> Geo {
    bx(0.016 * HEX_R, 0.072 * HEX_R, 0.018 * HEX_R)
}
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_arrow_tip() -> Geo {
    cn(0.013 * HEX_R, 0.042 * HEX_R, 4)
}
fn g_fletch() -> Geo {
    bx(0.007 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)
}
fn g_quiver() -> Geo {
    bx(0.046 * HEX_R, 0.150 * HEX_R, 0.046 * HEX_R)
}
fn g_q_arrow() -> Geo {
    bx(0.009 * HEX_R, 0.085 * HEX_R, 0.009 * HEX_R)
}
fn g_cone_helm() -> Geo {
    cy(0.018 * HEX_R, 0.086 * HEX_R, 0.108 * HEX_R, 8)
}
fn g_tall_cone() -> Geo {
    cy(0.013 * HEX_R, 0.082 * HEX_R, 0.135 * HEX_R, 8)
}
fn g_nasal() -> Geo {
    bx(0.020 * HEX_R, 0.056 * HEX_R, 0.016 * HEX_R)
}
fn g_crest() -> Geo {
    bx(0.016 * HEX_R, 0.052 * HEX_R, 0.098 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.060 * HEX_R, 0.048 * HEX_R, 0.022 * HEX_R)
}
fn g_beard_lg() -> Geo {
    bx(0.064 * HEX_R, 0.085 * HEX_R, 0.024 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.206 * HEX_R, 0.022 * HEX_R, 0.128 * HEX_R)
}
fn g_robe() -> Geo {
    bx(0.198 * HEX_R, 0.150 * HEX_R, 0.122 * HEX_R)
}
fn g_scale_row() -> Geo {
    bx(0.186 * HEX_R, 0.015 * HEX_R, 0.106 * HEX_R)
}
fn g_boot_cuff() -> Geo {
    bx(0.050 * HEX_R, 0.036 * HEX_R, 0.054 * HEX_R)
}

/// `pdStretch(group, mtl, A, B, w, d)` (`:298-311`).
#[allow(clippy::too_many_arguments)]
fn pd_stretch(m: &mut UnitModel, g: NodeId, mtl: MatId, a: Vec3, b: Vec3, w: f64, d: Option<f64>) {
    stretch(m, g, g_unit(), mtl, a, b, w, d);
}

/// `pdBuildLeg` (`:314-326`).
#[allow(clippy::too_many_arguments)]
fn pd_build_leg(
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
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, PD_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, PD_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
}

/// `pdArmIK` (`:334-362`) = MOD-05 `arm_ik` with the PD geometries.
#[allow(clippy::too_many_arguments)]
fn pd_arm_ik(
    m: &mut UnitModel,
    g: NodeId,
    s: Vec3,
    t: Vec3,
    pole: Vec3,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) {
    let kit = ArmIkKit {
        up: g_up_arm(),
        fore: g_forearm(),
        fist: g_fist(),
        l1: PD_UPARM_L,
        l2: PD_FOREARM_L,
        fist_off: 0.012 * HEX_R,
    };
    arm_ik(m, g, &kit, s, t, pole, m_up, m_fore, m_fist);
}

/// `pdBuildCore(group, mat, mTorso, skinColor)` (`:365-380`).
fn pd_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin_color: u32) -> MatId {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, PD_TORSO_CTR, 0.0);
    let m_skin = m.mat(skin_color, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, PD_TORSO_TOP + PD_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, PD_HEAD_CTR, 0.0);
    m_skin
}

/// `PDBowSpec` `composite` (`:388-396`).
struct BowSpec {
    mid_h: f64,
    limb_dy: f64,
    limb_dz: f64,
    limb_rot: f64,
    tip_dy: f64,
    tip_dz: f64,
    siyah_rot: f64,
}

const PD_BOW_COMPOSITE: BowSpec = BowSpec {
    mid_h: 0.150,
    limb_dy: 0.128,
    limb_dz: -0.016,
    limb_rot: 0.52,
    tip_dy: 0.236,
    tip_dz: -0.084,
    siyah_rot: 1.12,
};

/// `pdAddDrawnBow(group, kind, …)` (`:398-446`).
#[allow(clippy::too_many_arguments)]
fn pd_add_drawn_bow(
    m: &mut UnitModel,
    g: NodeId,
    s: &BowSpec,
    m_bow: MatId,
    m_string: MatId,
    m_shaft: MatId,
    m_tip: MatId,
    m_fletch: MatId,
) {
    let gg = PD_GRIP;
    let n = PD_NOCK;
    let dir_a = gg.minus(n).normalize();
    let yaw = js_atan2(dir_a.x, dir_a.z);
    let bow = m.detached_group();
    m.node(bow).set_pos_v(gg).rot_y(yaw);
    m.add_mesh(bow, g_bow_mid(), m_bow).scale.y = s.mid_h / 0.150;
    for sg in [1.0, -1.0] {
        m.add_mesh(bow, g_bow_limb(), m_bow)
            .rot_x(-sg * s.limb_rot)
            .set_pos(0.0, sg * s.limb_dy * HEX_R, s.limb_dz * HEX_R);
        m.add_mesh(bow, g_bow_siyah(), m_bow)
            .rot_x(-sg * s.siyah_rot)
            .set_pos(0.0, sg * s.tip_dy * HEX_R, s.tip_dz * HEX_R);
    }
    m.attach(g, bow);
    let rot_y = Mat4::rotation_y(yaw);
    let tip_top = v3(0.0, (s.tip_dy + 0.034) * HEX_R, (s.tip_dz - 0.016) * HEX_R)
        .apply_mat4(&rot_y)
        .plus(gg);
    let tip_bot = v3(0.0, -(s.tip_dy + 0.034) * HEX_R, (s.tip_dz - 0.016) * HEX_R)
        .apply_mat4(&rot_y)
        .plus(gg);
    pd_stretch(m, g, m_string, tip_top, n, 0.008 * HEX_R, None);
    pd_stretch(m, g, m_string, tip_bot, n, 0.008 * HEX_R, None);
    let tip_p = add_scaled(gg, dir_a, 0.065 * HEX_R);
    pd_stretch(m, g, m_shaft, n, tip_p, 0.012 * HEX_R, None);
    m.add_mesh(g, g_arrow_tip(), m_tip)
        .quat_from_unit_vectors(Y_UP, dir_a)
        .set_pos_v(add_scaled(tip_p, dir_a, 0.018 * HEX_R));
    m.add_mesh(g, g_fletch(), m_fletch)
        .quat_from_unit_vectors(Y_UP, dir_a)
        .set_pos_v(add_scaled(n, dir_a, 0.030 * HEX_R));
}

/// `pdArcherBody` (`:449-466`).
#[allow(clippy::too_many_arguments)]
fn pd_archer_body(
    m: &mut UnitModel,
    g: NodeId,
    m_up_l: MatId,
    m_fore_l: MatId,
    m_up_r: MatId,
    m_fore_r: MatId,
    m_fist: MatId,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
) {
    let hip = PD_HIP_Y - 0.006 * HEX_R;
    pd_build_leg(m, g, PD_HIP_X, 0.30, 0.16, m_thigh, m_shin, m_foot, hip);
    pd_build_leg(m, g, -PD_HIP_X, -0.34, -0.14, m_thigh, m_shin, m_foot, hip);
    pd_arm_ik(
        m,
        g,
        v3(PD_SHLD_X, PD_SHLD_Y, 0.0),
        PD_GRIP,
        v3(0.55, -0.70, 0.20),
        m_up_l,
        m_fore_l,
        Some(m_fist),
    );
    pd_arm_ik(
        m,
        g,
        v3(-PD_SHLD_X, PD_SHLD_Y, 0.0),
        PD_NOCK,
        v3(-0.55, 0.85, -0.25),
        m_up_r,
        m_fore_r,
        Some(m_fist),
    );
}

/// `pdAddQuiver(group, mQuiver, mShaft, mFletchOwner, nArrows)` (`:469-489`).
fn pd_add_quiver(
    m: &mut UnitModel,
    g: NodeId,
    m_quiver: MatId,
    m_shaft: MatId,
    m_fletch_owner: MatId,
    n_arrows: usize,
) {
    m.add_mesh(g, g_quiver(), m_quiver)
        .rot_x(-0.24)
        .rot_z(0.22)
        .set_pos(
            -0.052 * HEX_R,
            PD_TORSO_CTR + 0.052 * HEX_R,
            -(PD_TORSO_D * 0.5 + 0.030 * HEX_R),
        );
    for [dx, dy] in [[-0.020, 0.0], [0.004, 0.010]].into_iter().take(n_arrows) {
        m.add_mesh(g, g_q_arrow(), m_shaft)
            .rot_x(-0.24)
            .rot_z(0.22)
            .set_pos(
                (-0.052 + dx) * HEX_R,
                PD_TORSO_CTR + (0.128 + dy) * HEX_R,
                -(PD_TORSO_D * 0.5 + 0.048 * HEX_R),
            );
        m.add_mesh(g, g_fletch(), m_fletch_owner)
            .rot_x(-0.24)
            .rot_z(0.22)
            .set_scale(1.0, 0.62, 0.62)
            .set_pos(
                (-0.052 + dx - 0.010) * HEX_R,
                PD_TORSO_CTR + (0.162 + dy) * HEX_R,
                -(PD_TORSO_D * 0.5 + 0.058 * HEX_R),
            );
    }
}

/// `buildAkkadianArcher(ownerColor)` (`jednostki-p3-dystans.ts:760-810`).
#[must_use]
pub fn build_akkadian_archer(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(PD_SKIN, 0.05, 0.80);
    let m_robe = m.mat(PD_LINEN, 0.05, 0.86);
    let m_bronze = m.mat(PD_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(PD_BRONZE_LT, 0.50, 0.38);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_wood = m.mat(PD_WOOD_BOW, 0.05, 0.82);
    let m_string = m.mat(PD_STRING, 0.02, 0.95);
    let m_leath = m.mat(PD_LEATHER, 0.06, 0.82);
    let m_hair = m.mat(PD_HAIR_DK, 0.04, 0.90);

    pd_build_core(&mut m, g, m_robe, PD_SKIN);
    m.add_mesh(g, g_robe(), m_robe)
        .set_pos(0.0, PD_TORSO_BOT - 0.062 * HEX_R, 0.0);
    m.add_mesh(g, g_fringe(), m_owner)
        .set_pos(0.0, PD_TORSO_BOT - 0.140 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_leath)
        .set_scale(0.96, 0.85, 0.96)
        .set_pos(0.0, PD_TORSO_BOT + 0.026 * HEX_R, 0.0);

    m.add_mesh(g, g_cone_helm(), m_bronze)
        .set_scale(1.10, 1.24, 1.10)
        .set_pos(0.0, PD_HEAD_CTR + 0.060 * HEX_R, 0.0);
    m.add_mesh(g, g_nasal(), m_bronz_l)
        .set_scale(1.3, 1.0, 1.0)
        .set_pos(
            0.0,
            PD_HEAD_CTR + 0.004 * HEX_R,
            PD_HEAD_S * 0.5 + 0.006 * HEX_R,
        );
    m.add_mesh(g, g_beard(), m_hair)
        .set_scale(1.0, 1.35, 1.0)
        .set_pos(
            0.0,
            PD_HEAD_CTR - 0.060 * HEX_R,
            PD_HEAD_S * 0.5 - 0.004 * HEX_R,
        );

    pd_archer_body(
        &mut m, g, m_robe, m_skin, m_robe, m_skin, m_skin, m_robe, m_skin, m_leath,
    );
    pd_add_drawn_bow(
        &mut m,
        g,
        &PD_BOW_COMPOSITE,
        m_wood,
        m_string,
        m_wood,
        m_bronz_l,
        m_owner,
    );
    pd_add_quiver(&mut m, g, m_leath, m_wood, m_owner, 2);
    m
}

/// `buildAssyrianArcher(ownerColor)` (`jednostki-p3-dystans.ts:819-879`).
#[must_use]
pub fn build_assyrian_archer(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(PD_SKIN, 0.05, 0.80);
    let m_scale = m.mat(PD_SCALE, 0.30, 0.55);
    let m_scale_d = m.mat(PD_SCALE_DK, 0.28, 0.60);
    let m_bronze = m.mat(PD_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(PD_BRONZE_LT, 0.50, 0.38);
    let m_owner = m.mat(owner, 0.10, 0.70);
    let m_wood = m.mat(PD_WOOD_BOW, 0.05, 0.82);
    let m_string = m.mat(PD_STRING, 0.02, 0.95);
    let m_leath = m.mat(PD_LEATHER, 0.06, 0.82);
    let m_boot = m.mat(PD_BOOT_DK, 0.05, 0.88);
    let m_hair = m.mat(PD_HAIR_DK, 0.04, 0.90);

    pd_build_core(&mut m, g, m_scale, PD_SKIN);
    for i in 0..2 {
        m.add_mesh(g, g_scale_row(), m_scale_d).set_pos(
            0.0,
            PD_TORSO_TOP - (0.052 + f64::from(i) * 0.072) * HEX_R,
            0.0,
        );
    }
    m.add_mesh(g, g_skirt(), m_scale)
        .set_scale(0.98, 0.72, 0.98)
        .set_pos(0.0, PD_TORSO_BOT - 0.010 * HEX_R, 0.0);
    m.add_mesh(g, g_belt(), m_owner)
        .set_pos(0.0, PD_TORSO_BOT + 0.020 * HEX_R, 0.0);

    m.add_mesh(g, g_tall_cone(), m_bronze)
        .set_scale(1.08, 1.18, 1.08)
        .set_pos(0.0, PD_HEAD_CTR + 0.064 * HEX_R, 0.0);
    m.add_mesh(g, g_crest(), m_bronz_l).rot_x(-0.10).set_pos(
        0.0,
        PD_HEAD_TOP + 0.066 * HEX_R,
        -0.006 * HEX_R,
    );
    m.add_mesh(g, g_beard_lg(), m_hair).set_pos(
        0.0,
        PD_HEAD_CTR - 0.072 * HEX_R,
        PD_HEAD_S * 0.5 - 0.006 * HEX_R,
    );

    pd_archer_body(
        &mut m, g, m_owner, m_skin, m_owner, m_skin, m_skin, m_owner, m_boot, m_boot,
    );
    for (sx, th_l) in [(PD_HIP_X, 0.16), (-PD_HIP_X, -0.14)] {
        m.add_mesh(g, g_boot_cuff(), m_boot)
            .rot_x(PI - th_l)
            .set_pos(
                sx,
                0.118 * HEX_R,
                if sx > 0.0 {
                    0.052 * HEX_R
                } else {
                    -0.050 * HEX_R
                },
            );
    }
    pd_add_drawn_bow(
        &mut m,
        g,
        &PD_BOW_COMPOSITE,
        m_wood,
        m_string,
        m_wood,
        m_bronz_l,
        m_owner,
    );
    pd_add_quiver(&mut m, g, m_leath, m_wood, m_owner, 1);
    m
}
