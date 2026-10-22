//! Port of `render/kamien-bazowe-opus5.ts` (`edb8fb56`): the four base Stone
//! units `buildWojownikOpus5`, `buildOszczepnikOpus5`, `buildLucznikOpus5`,
//! `buildZwiadowcaOpus5`.
//!
//! The web `kbGeos` registry (`getG(key, make)`, first creation wins) maps to
//! plain geometry values: every key is always created with the same
//! arguments (checked over the whole file), so the geometry is identical
//! whatever the build order.

use super::geo::{KamienGeo, TaperProfile};
use super::kit::{dir_down, q_from_units, rotate_on_axis, seg, span};
use crate::geom::Vec3;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, Prim, UnitModel, ROOT};
use std::f64::consts::PI;

const KB_SKIN: u32 = 0xd9a464;
const KB_SKIN_DK: u32 = 0xbb8548;
const KB_SKIN_DEEP: u32 = 0xa87439;
const KB_HAIR: u32 = 0x4d3a26;
const KB_FUR_DK: u32 = 0x5f4a30;
const KB_FUR_LT: u32 = 0x8a6f4d;
const KB_FUR_WH: u32 = 0xbfae90;
const KB_LEATHER: u32 = 0x6b4a28;
const KB_LEATH_DK: u32 = 0x4b3319;
const KB_LEATH_LT: u32 = 0x96703f;
const KB_WOOD: u32 = 0x7a5c3a;
const KB_WOOD_DK: u32 = 0x5c452c;
const KB_WOOD_LT: u32 = 0x9c7a4e;
const KB_FLINT: u32 = 0x8d9298;
const KB_FLINT_DK: u32 = 0x6d737a;
const KB_ANTLER: u32 = 0xcbb489;
const KB_BONE: u32 = 0xe6ddc2;
const KB_SINEW: u32 = 0xd8cfb4;
const KB_RESIN: u32 = 0x33261a;
const KB_OCHRE: u32 = 0xb4652a;
const KB_GRASS: u32 = 0xb9a877;
const KB_WICKER: u32 = 0xa8875a;
const KB_LINEN: u32 = 0xcfc3a4;
const DARK: u32 = 0x14110d;

const KB_HIP_Y: f64 = 0.208 * HEX_R;
const KB_TORSO_W: f64 = 0.180 * HEX_R;
const KB_TORSO_H: f64 = 0.205 * HEX_R;
const KB_TORSO_D: f64 = 0.100 * HEX_R;
const KB_TORSO_BOT: f64 = 0.240 * HEX_R;
const KB_TORSO_CTR: f64 = KB_TORSO_BOT + KB_TORSO_H * 0.5;
const KB_TORSO_TOP: f64 = KB_TORSO_BOT + KB_TORSO_H;
const KB_NECK_H: f64 = 0.028 * HEX_R;
const KB_HEAD_S: f64 = 0.128 * HEX_R;
const KB_HEAD_CTR: f64 = KB_TORSO_TOP + KB_NECK_H + KB_HEAD_S * 0.5;
const KB_HEAD_TOP: f64 = KB_TORSO_TOP + KB_NECK_H + KB_HEAD_S;
const KB_SHLD_X: f64 = KB_TORSO_W * 0.5 + 0.030 * HEX_R;
const KB_SHLD_Y: f64 = KB_TORSO_TOP - 0.024 * HEX_R;
const KB_HIP_X: f64 = 0.052 * HEX_R;
const KB_THIGH_L: f64 = 0.104 * HEX_R;
const KB_SHIN_L: f64 = 0.096 * HEX_R;
const KB_UPARM_L: f64 = 0.100 * HEX_R;
const KB_FOREARM_L: f64 = 0.092 * HEX_R;

/// `gBox(k, w, h, d)`.
fn g_box(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w * HEX_R, h * HEX_R, d * HEX_R))
}
/// `gCyl(k, rt, rb, h, seg)`.
fn g_cyl(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl(rt * HEX_R, rb * HEX_R, h * HEX_R, seg))
}
/// `gCyl(k, rt, rb, h, seg, true)`.
fn g_cyl_open(rt: f64, rb: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cyl_open(rt * HEX_R, rb * HEX_R, h * HEX_R, seg))
}
/// `gCone(k, r, h, seg)`.
fn g_cone(r: f64, h: f64, seg: u32) -> Geo {
    Geo::Prim(Prim::cone(r * HEX_R, h * HEX_R, seg))
}
/// `getG(k, () => make*Geo(len, wMax, tMax))`.
fn g_taper(profile: TaperProfile, len: f64, w_max: f64, t_max: f64) -> Geo {
    Geo::Prim(Prim::Kamien(KamienGeo::Taper {
        profile,
        len,
        w_max,
        t_max,
    }))
}

fn v3(x: f64, y: f64, z: f64) -> Vec3 {
    Vec3::new(x, y, z)
}

/// `kbBoot` (`:279-298`).
fn kb_boot(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    foot_z: f64,
    m_sole: MatId,
    m_upper: MatId,
    m_bind: MatId,
) {
    m.add_mesh(g, g_box(0.050, 0.014, 0.086), m_sole)
        .set_pos(sx, 0.007 * HEX_R, foot_z);
    m.add_mesh(g, g_box(0.046, 0.036, 0.062), m_upper).set_pos(
        sx,
        0.030 * HEX_R,
        foot_z - 0.006 * HEX_R,
    );
    m.add_mesh(g, g_box(0.042, 0.020, 0.028), m_upper).set_pos(
        sx,
        0.020 * HEX_R,
        foot_z + 0.036 * HEX_R,
    );
    for dz in [-0.014, 0.012] {
        m.add_mesh(g, g_box(0.052, 0.008, 0.030), m_bind).set_pos(
            sx,
            0.040 * HEX_R,
            foot_z + dz * HEX_R,
        );
    }
}

/// `kbBareFoot` (`:301-314`).
fn kb_bare_foot(m: &mut UnitModel, g: NodeId, sx: f64, foot_z: f64, m_skin: MatId, m_bind: MatId) {
    m.add_mesh(g, g_box(0.044, 0.026, 0.082), m_skin)
        .set_pos(sx, 0.013 * HEX_R, foot_z);
    m.add_mesh(g, g_box(0.042, 0.016, 0.020), m_skin).set_pos(
        sx,
        0.008 * HEX_R,
        foot_z + 0.048 * HEX_R,
    );
    m.add_mesh(g, g_box(0.046, 0.010, 0.036), m_bind).set_pos(
        sx,
        0.036 * HEX_R,
        foot_z - 0.014 * HEX_R,
    );
}

/// `FootFn` of the four builders.
#[derive(Clone, Copy)]
enum Foot {
    Boot {
        sole: MatId,
        upper: MatId,
        bind: MatId,
    },
    Bare {
        skin: MatId,
        bind: MatId,
    },
}

impl Foot {
    fn add(self, m: &mut UnitModel, g: NodeId, sx: f64, fz: f64) {
        match self {
            Self::Boot { sole, upper, bind } => kb_boot(m, g, sx, fz, sole, upper, bind),
            Self::Bare { skin, bind } => kb_bare_foot(m, g, sx, fz, skin, bind),
        }
    }
}

/// `kbBuildLeg` (`:319-333`).
#[allow(clippy::too_many_arguments)]
fn kb_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    foot: Foot,
    hip_y: f64,
) -> Vec3 {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(
        m,
        g,
        g_box(0.056, 0.104, 0.060),
        m_thigh,
        p,
        th_u,
        KB_THIGH_L,
    );
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    m.add_mesh(g, g_box(0.048, 0.026, 0.050), m_thigh)
        .set_pos_v(p.plus(v3(0.0, 0.006 * HEX_R, 0.004 * HEX_R)));
    p = seg(m, g, g_box(0.038, 0.096, 0.042), m_shin, p, th_l, KB_SHIN_L);
    foot.add(m, g, sx, p.z + 0.016 * HEX_R);
    p
}

/// `kbBuildArm` result.
#[derive(Clone, Copy)]
struct Arm {
    wrist: Vec3,
    axis: Vec3,
}

/// `kbBuildArm` (`:336-353`).
#[allow(clippy::too_many_arguments)]
fn kb_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> Arm {
    let mut p = v3(sx, KB_SHLD_Y, 0.0);
    p = seg(m, g, g_box(0.054, 0.100, 0.054), m_up, p, th_u, KB_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(
        m,
        g,
        g_box(0.040, 0.092, 0.040),
        m_fore,
        p,
        th_f,
        KB_FOREARM_L,
    );
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_box(0.046, 0.046, 0.048), mf)
            .rot_x(PI - th_f)
            .set_pos_v(wrist.plus(dir_down(th_f).scale(0.014 * HEX_R)));
    }
    Arm {
        wrist,
        axis: dir_down(th_f),
    }
}

/// `kbShoulder` (`:356-360`).
fn kb_shoulder(m: &mut UnitModel, g: NodeId, sx: f64, mtl: MatId) {
    m.add_mesh(g, g_box(0.052, 0.052, 0.072), mtl).set_pos(
        sx * (KB_TORSO_W * 0.5 + 0.014 * HEX_R),
        KB_SHLD_Y + 0.014 * HEX_R,
        0.0,
    );
}

/// `kbBuildTorso` (`:363-372`).
fn kb_build_torso(m: &mut UnitModel, g: NodeId, m_torso: MatId) {
    m.add_mesh(g, g_box(0.180, 0.205, 0.100), m_torso)
        .set_pos(0.0, KB_TORSO_CTR, 0.0);
    m.add_mesh(g, g_box(0.187, 0.072, 0.106), m_torso).set_pos(
        0.0,
        KB_TORSO_TOP - 0.038 * HEX_R,
        0.0,
    );
    kb_shoulder(m, g, 1.0, m_torso);
    kb_shoulder(m, g, -1.0, m_torso);
}

/// `kbBuildHead` (`:375-415`).
#[allow(clippy::too_many_arguments)]
fn kb_build_head(
    m: &mut UnitModel,
    g: NodeId,
    m_skin: MatId,
    m_skin_dk: MatId,
    m_hair: MatId,
    m_dark: MatId,
    beard: bool,
) {
    m.add_mesh(g, g_box(0.044, 0.046, 0.044), m_skin).set_pos(
        0.0,
        KB_TORSO_TOP + KB_NECK_H * 0.5,
        0.0,
    );
    m.add_mesh(g, g_box(0.128, 0.128, 0.128), m_skin)
        .set_pos(0.0, KB_HEAD_CTR, 0.0);
    m.add_mesh(g, g_box(0.086, 0.034, 0.040), m_skin_dk)
        .set_pos(0.0, KB_HEAD_CTR - KB_HEAD_S * 0.38, 0.010 * HEX_R);
    m.add_mesh(g, g_box(0.020, 0.028, 0.018), m_skin).set_pos(
        0.0,
        KB_HEAD_CTR - 0.002 * HEX_R,
        KB_HEAD_S * 0.5 + 0.007 * HEX_R,
    );
    m.add_mesh(g, g_box(0.104, 0.014, 0.016), m_skin_dk)
        .rot_x(0.12)
        .set_pos(
            0.0,
            KB_HEAD_CTR + 0.032 * HEX_R,
            KB_HEAD_S * 0.5 + 0.003 * HEX_R,
        );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.018, 0.011, 0.008), m_dark).set_pos(
            sx * 0.026 * HEX_R,
            KB_HEAD_CTR + 0.014 * HEX_R,
            KB_HEAD_S * 0.5 + 0.002 * HEX_R,
        );
    }
    m.add_mesh(g, g_box(0.126, 0.104, 0.026), m_hair).set_pos(
        0.0,
        KB_HEAD_CTR - 0.006 * HEX_R,
        -(KB_HEAD_S * 0.5 + 0.011 * HEX_R),
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.018, 0.082, 0.086), m_hair).set_pos(
            sx * (KB_HEAD_S * 0.5 + 0.006 * HEX_R),
            KB_HEAD_CTR - 0.010 * HEX_R,
            -0.018 * HEX_R,
        );
    }
    if beard {
        m.add_mesh(g, g_box(0.082, 0.050, 0.034), m_hair).set_pos(
            0.0,
            KB_HEAD_CTR - 0.070 * HEX_R,
            0.022 * HEX_R,
        );
    }
}

/// `kbOwnerSash` (`:418-422`).
fn kb_owner_sash(m: &mut UnitModel, g: NodeId, m_owner: MatId) {
    m.add_mesh(g, g_box(0.186, 0.032, 0.106), m_owner).set_pos(
        0.0,
        KB_TORSO_CTR - 0.014 * HEX_R,
        0.0,
    );
}

/// `kbSkirtBelt` (`:425-445`).
fn kb_skirt_belt(
    m: &mut UnitModel,
    g: NodeId,
    m_skirt: MatId,
    m_belt: MatId,
    m_fringe: Option<MatId>,
) {
    m.add_mesh(g, g_box(0.196, 0.070, 0.118), m_skirt).set_pos(
        0.0,
        KB_TORSO_BOT - 0.018 * HEX_R,
        0.0,
    );
    m.add_mesh(g, g_box(0.192, 0.030, 0.114), m_belt)
        .set_pos(0.0, 0.252 * HEX_R, 0.0);
    m.add_mesh(g, g_box(0.030, 0.024, 0.014), m_fringe.unwrap_or(m_belt))
        .set_pos(0.0, 0.252 * HEX_R, KB_TORSO_D * 0.5 + 0.014 * HEX_R);
    if let Some(mf) = m_fringe {
        for sx in [-2.0, -1.0, 0.0, 1.0, 2.0] {
            m.add_mesh(g, g_box(0.022, 0.050, 0.010), mf).set_pos(
                sx * 0.040 * HEX_R,
                0.176 * HEX_R,
                KB_TORSO_D * 0.5 + 0.010 * HEX_R,
            );
        }
    }
}

/// `kbFurCap` (`:448-469`).
fn kb_fur_cap(m: &mut UnitModel, g: NodeId, m_fur: MatId, m_rim: MatId, chin_strap: bool) {
    m.add_mesh(g, g_cyl(0.056, 0.086, 0.078, 10), m_fur)
        .set_pos(0.0, KB_HEAD_CTR + 0.054 * HEX_R, 0.0);
    m.add_mesh(g, g_cyl(0.090, 0.092, 0.026, 10), m_rim)
        .set_pos(0.0, KB_HEAD_CTR + 0.030 * HEX_R, 0.0);
    m.add_mesh(g, g_box(0.052, 0.022, 0.052), m_fur)
        .set_pos(0.0, KB_HEAD_CTR + 0.100 * HEX_R, 0.0);
    if chin_strap {
        for sx in [-1.0, 1.0] {
            m.add_mesh(g, g_box(0.010, 0.086, 0.010), m_rim)
                .rot_z(sx * 0.16)
                .set_pos(
                    sx * (KB_HEAD_S * 0.5 + 0.006 * HEX_R),
                    KB_HEAD_CTR - 0.010 * HEX_R,
                    0.020 * HEX_R,
                );
        }
    }
}

/// `kbLashing` (`:472-480`).
#[allow(clippy::too_many_arguments)]
fn kb_lashing(
    m: &mut UnitModel,
    g: NodeId,
    w: f64,
    h: f64,
    d: f64,
    mtl: MatId,
    at: Vec3,
    rot_x: f64,
) {
    m.add_mesh(g, g_box(w, h, d), mtl)
        .rot_x(rot_x)
        .set_pos_v(at);
}

/// `buildWojownikOpus5` (`kamien-bazowe-opus5.ts:491-679`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_wojownik_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KB_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(KB_SKIN_DK, 0.05, 0.82);
    let m_hair = m.mat(KB_HAIR, 0.04, 0.90);
    let m_dark = m.mat(DARK, 0.04, 0.88);
    let m_fur = m.mat(KB_FUR_DK, 0.03, 0.94);
    let m_fur_l = m.mat(KB_FUR_LT, 0.03, 0.92);
    let m_leath = m.mat(KB_LEATHER, 0.05, 0.86);
    let m_leath_d = m.mat(KB_LEATH_DK, 0.05, 0.88);
    let m_wood = m.mat(KB_WOOD, 0.05, 0.85);
    let m_wood_d = m.mat(KB_WOOD_DK, 0.05, 0.87);
    let m_flint = m.mat(KB_FLINT, 0.09, 0.38);
    let m_flint_d = m.mat(KB_FLINT_DK, 0.09, 0.44);
    let m_antler = m.mat(KB_ANTLER, 0.05, 0.66);
    let m_bone = m.mat(KB_BONE, 0.05, 0.72);
    let m_sinew = m.mat(KB_SINEW, 0.02, 0.92);
    let m_wicker = m.mat(KB_WICKER, 0.04, 0.88);
    let m_owner = m.mat(owner, 0.08, 0.72);

    let hip_y = KB_HIP_Y - 0.012 * HEX_R;

    kb_build_torso(&mut m, g, m_fur);
    kb_build_head(&mut m, g, m_skin, m_skin_dk, m_hair, m_dark, true);
    kb_skirt_belt(&mut m, g, m_leath, m_leath_d, Some(m_fur_l));
    kb_owner_sash(&mut m, g, m_owner);

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.078, 0.176, 0.020), m_fur_l)
            .rot_z(sx * 0.05)
            .set_pos(
                sx * 0.046 * HEX_R,
                KB_TORSO_CTR + 0.006 * HEX_R,
                KB_TORSO_D * 0.5 + 0.010 * HEX_R,
            );
    }
    m.add_mesh(g, g_box(0.150, 0.028, 0.118), m_fur_l).set_pos(
        0.0,
        KB_TORSO_TOP - 0.004 * HEX_R,
        0.0,
    );

    m.add_mesh(g, g_box(0.108, 0.008, 0.010), m_leath_d)
        .set_pos(
            0.0,
            KB_TORSO_TOP - 0.014 * HEX_R,
            KB_TORSO_D * 0.5 + 0.018 * HEX_R,
        );
    for sx in [-1.0, 0.0, 1.0] {
        m.add_mesh(g, g_cone(0.011, 0.040, 4), m_bone)
            .rot_x(PI)
            .rot_z(sx * 0.18)
            .set_pos(
                sx * 0.034 * HEX_R,
                KB_TORSO_TOP - 0.040 * HEX_R,
                KB_TORSO_D * 0.5 + 0.018 * HEX_R,
            );
    }

    let boot = Foot::Boot {
        sole: m_leath_d,
        upper: m_leath,
        bind: m_sinew,
    };
    kb_build_leg(
        &mut m, g, KB_HIP_X, 0.60, 0.36, m_leath, m_leath, boot, hip_y,
    );
    kb_build_leg(
        &mut m, g, -KB_HIP_X, -0.54, -0.22, m_leath, m_leath, boot, hip_y,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.012, 0.052, 0.012), m_sinew).set_pos(
            sx * (KB_HIP_X + 0.026 * HEX_R),
            0.222 * HEX_R,
            0.028 * HEX_R,
        );
    }

    kb_fur_cap(&mut m, g, m_fur, m_leath_d, true);
    m.add_mesh(g, g_cyl(0.093, 0.093, 0.018, 10), m_owner)
        .set_pos(0.0, KB_HEAD_CTR + 0.044 * HEX_R, 0.0);

    // right (-X): flint axe in an antler socket
    let arm_r = kb_build_arm(
        &mut m,
        g,
        -KB_SHLD_X,
        -2.18,
        2.62,
        m_fur_l,
        m_skin,
        Some(m_skin_dk),
    );
    let ax = arm_r.axis;
    let at = |d: f64| arm_r.wrist.plus(ax.scale(d * HEX_R));
    let rot_haft = PI - 2.62;

    m.add_mesh(g, g_cyl(0.014, 0.017, 0.330, 6), m_wood)
        .rot_x(rot_haft)
        .set_pos_v(at(0.108));
    m.add_mesh(g, g_box(0.026, 0.026, 0.026), m_wood_d)
        .rot_x(rot_haft)
        .set_pos_v(at(-0.062));
    m.add_mesh(g, g_box(0.024, 0.012, 0.024), m_leath_d)
        .rot_x(rot_haft)
        .set_pos_v(at(-0.042));
    m.add_mesh(g, g_cyl(0.023, 0.026, 0.060, 8), m_antler)
        .rot_x(rot_haft)
        .set_pos_v(at(0.256));
    for d in [0.226, 0.288] {
        kb_lashing(&mut m, g, 0.036, 0.011, 0.036, m_sinew, at(d), rot_haft);
    }
    let perp = v3(0.0, -ax.z, ax.y).normalize();
    let celt_q = q_from_units(v3(0.0, 1.0, 0.0), perp);
    m.add_mesh(
        g,
        g_taper(
            TaperProfile::Celt,
            0.114 * HEX_R,
            0.058 * HEX_R,
            0.026 * HEX_R,
        ),
        m_flint,
    )
    .set_pos_v(at(0.268).plus(perp.scale(0.014 * HEX_R)))
    .quaternion = celt_q;
    m.add_mesh(g, g_box(0.052, 0.010, 0.018), m_flint_d)
        .set_pos_v(at(0.268).plus(perp.scale(0.086 * HEX_R)))
        .quaternion = celt_q;
    m.add_mesh(g, g_box(0.020, 0.030, 0.014), m_wood_d)
        .set_pos_v(at(0.268).plus(perp.scale(-0.012 * HEX_R)))
        .quaternion = celt_q;

    // flint knife in a bast sheath
    let kn_x = -(KB_TORSO_W * 0.5 + 0.020 * HEX_R);
    m.add_mesh(g, g_box(0.026, 0.084, 0.016), m_wicker)
        .rot_z(-0.14)
        .set_pos(kn_x, 0.208 * HEX_R, 0.026 * HEX_R);
    m.add_mesh(g, g_box(0.020, 0.034, 0.014), m_wood)
        .rot_z(-0.14)
        .set_pos(kn_x - 0.008 * HEX_R, 0.262 * HEX_R, 0.026 * HEX_R);

    // left (+X): shield
    let arm_l = kb_build_arm(&mut m, g, KB_SHLD_X, 0.48, 1.06, m_fur_l, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            arm_l.wrist.x - 0.026 * HEX_R,
            arm_l.wrist.y + 0.040 * HEX_R,
            arm_l.wrist.z + 0.046 * HEX_R,
        )
        .rot_y(-0.22)
        .rot_z(0.05);

    m.add_mesh(sh, g_cyl_open(0.108, 0.108, 0.030, 8), m_wood)
        .rot_x(PI / 2.0)
        .set_scale(1.0, 1.0, 1.34);
    m.add_mesh(sh, g_cyl(0.100, 0.094, 0.020, 8), m_owner)
        .rot_x(PI / 2.0)
        .set_scale(1.0, 1.0, 1.34)
        .set_pos(0.0, 0.0, 0.004 * HEX_R);
    for (dy, w) in [
        (0.108, 0.108),
        (0.040, 0.176),
        (-0.040, 0.176),
        (-0.108, 0.108),
    ] {
        m.add_mesh(sh, g_box(w, 0.014, 0.010), m_wicker)
            .set_pos(0.0, dy * HEX_R, 0.014 * HEX_R);
    }
    for dx in [-0.044, 0.044] {
        m.add_mesh(sh, g_box(0.013, 0.250, 0.009), m_wicker)
            .set_pos(dx * HEX_R, 0.0, 0.017 * HEX_R);
    }
    m.add_mesh(sh, g_box(0.056, 0.056, 0.022), m_wood_d)
        .set_pos(0.0, 0.0, 0.022 * HEX_R);
    m.add_mesh(sh, g_cyl(0.010, 0.016, 0.024, 6), m_antler)
        .rot_x(PI / 2.0)
        .set_pos(0.0, 0.0, 0.036 * HEX_R);
    for (dx, dy) in [(0.0, 0.140), (0.0, -0.140), (0.102, 0.0), (-0.102, 0.0)] {
        m.add_mesh(sh, g_box(0.026, 0.016, 0.034), m_leath_d)
            .set_pos(dx * HEX_R, dy * HEX_R, 0.004 * HEX_R);
    }
    m.add_mesh(sh, g_box(0.056, 0.016, 0.016), m_wood)
        .set_pos(0.0, -0.020 * HEX_R, -0.030 * HEX_R);
    m.add_mesh(sh, g_box(0.072, 0.020, 0.012), m_leath_d)
        .set_pos(0.0, 0.026 * HEX_R, -0.026 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildOszczepnikOpus5` (`kamien-bazowe-opus5.ts:690-849`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_oszczepnik_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KB_SKIN_DEEP, 0.05, 0.78);
    let m_skin_dk = m.mat(KB_SKIN_DK, 0.05, 0.82);
    let m_hair = m.mat(KB_HAIR, 0.04, 0.90);
    let m_dark = m.mat(DARK, 0.04, 0.88);
    let m_leath = m.mat(KB_LEATHER, 0.05, 0.86);
    let m_leath_d = m.mat(KB_LEATH_DK, 0.05, 0.88);
    let m_fur_l = m.mat(KB_FUR_LT, 0.03, 0.92);
    let m_wood = m.mat(KB_WOOD, 0.05, 0.84);
    let m_wood_l = m.mat(KB_WOOD_LT, 0.05, 0.82);
    let m_flint = m.mat(KB_FLINT, 0.09, 0.38);
    let m_antler = m.mat(KB_ANTLER, 0.05, 0.66);
    let m_bone = m.mat(KB_BONE, 0.05, 0.72);
    let m_sinew = m.mat(KB_SINEW, 0.02, 0.92);
    let m_resin = m.mat(KB_RESIN, 0.06, 0.60);
    let m_ochre = m.mat(KB_OCHRE, 0.04, 0.84);
    let m_owner = m.mat(owner, 0.08, 0.72);

    let hip_y = KB_HIP_Y - 0.012 * HEX_R;

    kb_build_torso(&mut m, g, m_skin);
    kb_build_head(&mut m, g, m_skin, m_skin_dk, m_hair, m_dark, false);
    kb_skirt_belt(&mut m, g, m_fur_l, m_leath, None);
    kb_owner_sash(&mut m, g, m_owner);

    m.add_mesh(g, g_box(0.026, 0.238, 0.014), m_leath)
        .rot_z(0.58)
        .set_pos(
            0.0,
            KB_TORSO_CTR + 0.028 * HEX_R,
            KB_TORSO_D * 0.5 + 0.007 * HEX_R,
        );
    m.add_mesh(g, g_box(0.026, 0.230, 0.012), m_leath_d)
        .rot_z(-0.54)
        .set_pos(
            0.0,
            KB_TORSO_CTR + 0.026 * HEX_R,
            -(KB_TORSO_D * 0.5 + 0.007 * HEX_R),
        );
    for dy in [0.036, 0.006] {
        m.add_mesh(g, g_box(0.120, 0.010, 0.012), m_skin_dk)
            .set_pos(
                0.0,
                KB_TORSO_CTR + dy * HEX_R,
                KB_TORSO_D * 0.5 + 0.004 * HEX_R,
            );
    }
    for sx in [-1.0, 0.0, 1.0] {
        m.add_mesh(g, g_cyl(0.012, 0.012, 0.007, 6), m_bone)
            .rot_x(PI / 2.0)
            .set_pos(
                sx * 0.026 * HEX_R,
                KB_TORSO_TOP - 0.020 * HEX_R,
                KB_TORSO_D * 0.5 + 0.014 * HEX_R,
            );
    }

    let bare = Foot::Bare {
        skin: m_skin,
        bind: m_leath_d,
    };
    kb_build_leg(&mut m, g, KB_HIP_X, 0.66, 0.40, m_skin, m_skin, bare, hip_y);
    kb_build_leg(
        &mut m, g, -KB_HIP_X, -0.58, -0.24, m_skin, m_skin, bare, hip_y,
    );

    m.add_mesh(g, g_cyl(0.070, 0.070, 0.024, 10), m_owner)
        .set_pos(0.0, KB_HEAD_CTR + 0.044 * HEX_R, 0.0);
    m.add_mesh(g, g_box(0.026, 0.026, 0.030), m_owner).set_pos(
        0.0,
        KB_HEAD_CTR + 0.044 * HEX_R,
        -(KB_HEAD_S * 0.5 + 0.018 * HEX_R),
    );
    for (sx, tilt) in [(-1.0, -0.30), (1.0, 0.34)] {
        m.add_mesh(g, g_box(0.018, 0.098, 0.010), m_bone)
            .rot_x(-0.38)
            .rot_z(tilt)
            .set_pos(
                sx * 0.030 * HEX_R,
                KB_HEAD_TOP + 0.046 * HEX_R,
                -0.040 * HEX_R,
            );
        m.add_mesh(g, g_box(0.008, 0.030, 0.008), m_leath_d)
            .rot_x(-0.38)
            .rot_z(tilt)
            .set_pos(
                sx * 0.024 * HEX_R,
                KB_HEAD_TOP + 0.004 * HEX_R,
                -0.024 * HEX_R,
            );
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.024, 0.030, 0.008), m_ochre)
            .rot_z(sx * 0.22)
            .set_pos(
                sx * 0.040 * HEX_R,
                KB_HEAD_CTR - 0.014 * HEX_R,
                KB_HEAD_S * 0.5 + 0.002 * HEX_R,
            );
    }

    // right (-X): atlatl + javelin on it
    let arm_r = kb_build_arm(
        &mut m,
        g,
        -KB_SHLD_X,
        -2.42,
        1.94,
        m_skin,
        m_skin,
        Some(m_skin_dk),
    );
    let ax = arm_r.axis;
    let at = |d: f64| arm_r.wrist.plus(ax.scale(d * HEX_R));
    let rot_at = PI - 1.94;

    m.add_mesh(g, g_box(0.026, 0.230, 0.016), m_wood)
        .rot_x(rot_at)
        .set_pos_v(at(0.058));
    m.add_mesh(g, g_box(0.022, 0.038, 0.024), m_wood)
        .rot_x(rot_at)
        .set_pos_v(at(0.190));
    m.add_mesh(g, g_cone(0.012, 0.038, 5), m_antler)
        .rot_x(rot_at - 0.42)
        .set_pos_v(at(0.212).plus(v3(0.0, 0.012 * HEX_R, 0.006 * HEX_R)));
    for d in [-0.028, 0.014] {
        m.add_mesh(g, g_box(0.034, 0.012, 0.028), m_leath_d)
            .rot_x(rot_at)
            .set_pos_v(at(d));
    }
    m.add_mesh(g, g_box(0.030, 0.036, 0.024), m_sinew)
        .rot_x(rot_at)
        .set_pos_v(at(-0.008));

    let lift = v3(0.0, ax.z, -ax.y).normalize().scale(0.022 * HEX_R);
    let jav = |d: f64| at(d).plus(lift);
    m.add_mesh(g, g_cyl(0.010, 0.012, 0.520, 6), m_wood_l)
        .rot_x(rot_at)
        .set_pos_v(jav(0.170));
    m.add_mesh(g, g_box(0.016, 0.024, 0.016), m_wood_l)
        .rot_x(rot_at)
        .set_pos_v(jav(-0.098));
    m.add_mesh(
        g,
        g_taper(
            TaperProfile::LeafPoint,
            0.092 * HEX_R,
            0.036 * HEX_R,
            0.014 * HEX_R,
        ),
        m_flint,
    )
    .rot_x(rot_at)
    .set_pos_v(jav(0.428));
    m.add_mesh(g, g_box(0.020, 0.030, 0.018), m_resin)
        .rot_x(rot_at)
        .set_pos_v(jav(0.420));
    for d in [0.402, 0.434] {
        kb_lashing(&mut m, g, 0.024, 0.010, 0.024, m_sinew, jav(d), rot_at);
    }

    // left (+X): 2 spare javelins
    let arm_l = kb_build_arm(
        &mut m,
        g,
        KB_SHLD_X,
        0.30,
        0.42,
        m_skin,
        m_skin,
        Some(m_skin_dk),
    );
    for (dz, dx) in [(-0.016, -0.004), (0.016, 0.006)] {
        let bx = arm_l.wrist.x + dx * HEX_R;
        let bz = arm_l.wrist.z + dz * HEX_R;
        m.add_mesh(g, g_cyl(0.009, 0.011, 0.440, 6), m_wood_l)
            .set_pos(bx, arm_l.wrist.y + 0.078 * HEX_R, bz);
        m.add_mesh(
            g,
            g_taper(
                TaperProfile::LeafPoint,
                0.076 * HEX_R,
                0.030 * HEX_R,
                0.012 * HEX_R,
            ),
            m_flint,
        )
        .set_pos(bx, arm_l.wrist.y + 0.298 * HEX_R, bz);
        m.add_mesh(g, g_box(0.020, 0.010, 0.020), m_sinew).set_pos(
            bx,
            arm_l.wrist.y + 0.292 * HEX_R,
            bz,
        );
        m.add_mesh(g, g_box(0.014, 0.020, 0.014), m_wood).set_pos(
            bx,
            arm_l.wrist.y - 0.146 * HEX_R,
            bz,
        );
    }
    m
}

/// `buildLucznikOpus5` (`kamien-bazowe-opus5.ts:860-1023`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_lucznik_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KB_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(KB_SKIN_DK, 0.05, 0.82);
    let m_hair = m.mat(KB_HAIR, 0.04, 0.90);
    let m_dark = m.mat(DARK, 0.04, 0.88);
    let m_vest = m.mat(KB_LEATH_LT, 0.05, 0.84);
    let m_leath = m.mat(KB_LEATHER, 0.05, 0.86);
    let m_leath_d = m.mat(KB_LEATH_DK, 0.05, 0.88);
    let m_wood = m.mat(KB_WOOD, 0.05, 0.82);
    let m_wood_l = m.mat(KB_WOOD_LT, 0.05, 0.80);
    let m_flint = m.mat(KB_FLINT, 0.09, 0.38);
    let m_flint_d = m.mat(KB_FLINT_DK, 0.07, 0.52);
    let m_bone = m.mat(KB_BONE, 0.05, 0.72);
    let m_sinew = m.mat(KB_SINEW, 0.02, 0.92);
    let m_linen = m.mat(KB_LINEN, 0.03, 0.90);
    let m_owner = m.mat(owner, 0.08, 0.72);

    let hip_y = KB_HIP_Y - 0.008 * HEX_R;

    kb_build_torso(&mut m, g, m_vest);
    kb_build_head(&mut m, g, m_skin, m_skin_dk, m_hair, m_dark, true);
    kb_skirt_belt(&mut m, g, m_leath, m_leath_d, None);
    kb_owner_sash(&mut m, g, m_owner);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.012, 0.180, 0.012), m_leath_d)
            .set_pos(
                sx * 0.080 * HEX_R,
                KB_TORSO_CTR + 0.004 * HEX_R,
                KB_TORSO_D * 0.5 - 0.006 * HEX_R,
            );
    }

    let boot = Foot::Boot {
        sole: m_leath_d,
        upper: m_leath,
        bind: m_linen,
    };
    kb_build_leg(
        &mut m, g, KB_HIP_X, 0.46, 0.24, m_leath, m_skin, boot, hip_y,
    );
    kb_build_leg(
        &mut m, g, -KB_HIP_X, -0.44, -0.16, m_leath, m_skin, boot, hip_y,
    );

    kb_fur_cap(&mut m, g, m_leath, m_leath_d, false);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.014, 0.056, 0.044), m_leath)
            .rot_z(sx * 0.12)
            .set_pos(
                sx * (KB_HEAD_S * 0.5 + 0.010 * HEX_R),
                KB_HEAD_CTR + 0.010 * HEX_R,
                -0.004 * HEX_R,
            );
    }
    m.add_mesh(g, g_box(0.016, 0.096, 0.010), m_bone)
        .rot_x(-0.16)
        .rot_z(-0.52)
        .set_pos(0.058 * HEX_R, KB_HEAD_TOP + 0.048 * HEX_R, -0.012 * HEX_R);

    // left (+X): self bow
    let arm_l = kb_build_arm(
        &mut m,
        g,
        KB_SHLD_X,
        1.44,
        1.52,
        m_vest,
        m_skin,
        Some(m_skin_dk),
    );
    let grip_p = arm_l.wrist.plus(arm_l.axis.scale(0.022 * HEX_R));

    m.add_mesh(g, g_box(0.048, 0.046, 0.046), m_flint_d)
        .rot_x(PI - 1.52)
        .set_pos_v(arm_l.wrist.plus(arm_l.axis.scale(-0.042 * HEX_R)));
    for d in [-0.062, -0.020] {
        kb_lashing(
            &mut m,
            g,
            0.054,
            0.010,
            0.052,
            m_leath_d,
            arm_l.wrist.plus(arm_l.axis.scale(d * HEX_R)),
            PI - 1.52,
        );
    }

    let limb = 0.310 * HEX_R;
    let bend = 0.120 * HEX_R;
    let bow_pts: Vec<Vec3> = (0..=10)
        .map(|i| {
            let t = -1.0 + f64::from(i) * 0.2;
            v3(grip_p.x, grip_p.y + t * limb, grip_p.z - bend * t * t)
        })
        .collect();
    let g_limb_w = Geo::Prim(Prim::bx(0.013 * HEX_R, 1.0, 0.030 * HEX_R));
    let g_limb_n = Geo::Prim(Prim::bx(0.011 * HEX_R, 1.0, 0.019 * HEX_R));
    for i in 0..10 {
        let wide = (2..=7).contains(&i);
        span(
            &mut m,
            g,
            if wide { g_limb_w } else { g_limb_n },
            m_wood_l,
            bow_pts[i],
            bow_pts[i + 1],
            1.0,
        );
    }
    m.add_mesh(g, g_box(0.020, 0.062, 0.036), m_leath_d)
        .set_pos_v(bow_pts[5]);
    for idx in [0usize, 10] {
        m.add_mesh(g, g_box(0.014, 0.026, 0.022), m_bone)
            .rot_x(if idx == 0 { 0.34 } else { -0.34 })
            .set_pos_v(bow_pts[idx]);
    }

    // right (-X): hand at the cheek (full draw)
    let arm_r = kb_build_arm(
        &mut m,
        g,
        -KB_SHLD_X,
        1.26,
        -2.02,
        m_vest,
        m_skin,
        Some(m_skin_dk),
    );
    let nock = v3(
        arm_r.wrist.x + 0.032 * HEX_R,
        arm_r.wrist.y + 0.004 * HEX_R,
        arm_r.wrist.z + 0.026 * HEX_R,
    );

    let g_str = Geo::Prim(Prim::bx(0.0065 * HEX_R, 1.0, 0.0065 * HEX_R));
    span(&mut m, g, g_str, m_sinew, bow_pts[0], nock, 1.0);
    span(&mut m, g, g_str, m_sinew, bow_pts[10], nock, 1.0);
    m.add_mesh(g, g_box(0.012, 0.030, 0.012), m_sinew)
        .set_pos_v(nock);

    let arr_dir = grip_p
        .plus(v3(0.0, 0.010 * HEX_R, 0.030 * HEX_R))
        .minus(nock)
        .normalize();
    let arr_end = nock.plus(arr_dir.scale(0.352 * HEX_R));
    span(
        &mut m,
        g,
        Geo::Prim(Prim::cyl(0.0055 * HEX_R, 0.0055 * HEX_R, 1.0, 5)),
        m_wood,
        nock,
        arr_end,
        1.0,
    );
    let tip_q = q_from_units(v3(0.0, 1.0, 0.0), arr_dir);
    m.add_mesh(
        g,
        g_taper(
            TaperProfile::BarbedPoint,
            0.056 * HEX_R,
            0.028 * HEX_R,
            0.009 * HEX_R,
        ),
        m_flint,
    )
    .set_pos_v(arr_end)
    .quaternion = tip_q;
    m.add_mesh(g, g_box(0.014, 0.012, 0.014), m_sinew)
        .set_pos_v(arr_end.plus(arr_dir.scale(-0.006 * HEX_R)))
        .quaternion = tip_q;
    for k in 0..3 {
        let id = m.add_mesh_id(g, g_box(0.005, 0.034, 0.026), m_linen);
        m.node(id)
            .quat_from_unit_vectors(v3(0.0, 0.0, 1.0), arr_dir);
        rotate_on_axis(
            &mut m,
            id,
            v3(0.0, 0.0, 1.0),
            (f64::from(k) * 2.0 * PI) / 3.0,
        );
        m.node(id)
            .set_pos_v(nock.plus(arr_dir.scale(0.030 * HEX_R)));
    }

    // quiver on the back (owner colour)
    let qx = -0.052 * HEX_R;
    let qz = -(KB_TORSO_D * 0.5 + 0.032 * HEX_R);
    m.add_mesh(g, g_cyl(0.034, 0.030, 0.190, 8), m_owner)
        .rot_x(-0.32)
        .set_pos(qx, KB_TORSO_CTR + 0.040 * HEX_R, qz);
    m.add_mesh(g, g_box(0.010, 0.200, 0.010), m_wood_l)
        .rot_x(-0.32)
        .set_pos(
            qx - 0.036 * HEX_R,
            KB_TORSO_CTR + 0.040 * HEX_R,
            qz - 0.006 * HEX_R,
        );
    m.add_mesh(g, g_box(0.062, 0.024, 0.052), m_leath_d)
        .rot_x(-0.32)
        .set_pos(qx, KB_TORSO_CTR + 0.140 * HEX_R, qz - 0.034 * HEX_R);
    m.add_mesh(g, g_box(0.026, 0.220, 0.012), m_leath)
        .rot_z(-0.56)
        .set_pos(
            0.0,
            KB_TORSO_CTR + 0.030 * HEX_R,
            -(KB_TORSO_D * 0.5 + 0.008 * HEX_R),
        );
    for dx in [-0.016, 0.002, 0.018] {
        m.add_mesh(g, g_cyl(0.0055, 0.0055, 0.080, 5), m_wood)
            .rot_x(-0.32)
            .set_pos(
                qx + dx * HEX_R,
                KB_TORSO_CTR + 0.170 * HEX_R,
                qz - 0.044 * HEX_R,
            );
        m.add_mesh(g, g_box(0.005, 0.032, 0.024), m_linen)
            .rot_x(-0.32)
            .set_pos(
                qx + dx * HEX_R,
                KB_TORSO_CTR + 0.198 * HEX_R,
                qz - 0.054 * HEX_R,
            );
    }
    m
}

/// `buildZwiadowcaOpus5` (`kamien-bazowe-opus5.ts:1033-1190`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_zwiadowca_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(KB_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(KB_SKIN_DK, 0.05, 0.82);
    let m_hair = m.mat(KB_HAIR, 0.04, 0.90);
    let m_dark = m.mat(DARK, 0.04, 0.88);
    let m_fur = m.mat(KB_FUR_DK, 0.03, 0.94);
    let m_fur_w = m.mat(KB_FUR_WH, 0.03, 0.92);
    let m_hide = m.mat(KB_LEATH_LT, 0.05, 0.84);
    let m_leath = m.mat(KB_LEATHER, 0.05, 0.86);
    let m_leath_d = m.mat(KB_LEATH_DK, 0.05, 0.88);
    let m_wood_l = m.mat(KB_WOOD_LT, 0.05, 0.80);
    let m_wood_d = m.mat(KB_WOOD_DK, 0.05, 0.86);
    let m_grass = m.mat(KB_GRASS, 0.02, 0.94);
    let m_flint = m.mat(KB_FLINT, 0.09, 0.38);
    let m_bone = m.mat(KB_BONE, 0.05, 0.72);
    let m_linen = m.mat(KB_LINEN, 0.03, 0.90);
    let m_owner = m.mat(owner, 0.08, 0.72);

    let hip_y = KB_HIP_Y - 0.014 * HEX_R;

    kb_build_torso(&mut m, g, m_hide);
    kb_build_head(&mut m, g, m_skin, m_skin_dk, m_hair, m_dark, true);
    kb_skirt_belt(&mut m, g, m_leath, m_leath_d, None);
    kb_owner_sash(&mut m, g, m_owner);
    for dy in [0.050, 0.012, -0.026] {
        m.add_mesh(g, g_box(0.184, 0.008, 0.104), m_leath_d)
            .set_pos(0.0, KB_TORSO_CTR + dy * HEX_R, 0.0);
    }

    for sx in [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0] {
        m.add_mesh(g, g_box(0.038, 0.232, 0.014), m_grass)
            .rot_x(0.06)
            .rot_z(-sx * 0.035)
            .set_pos(
                sx * 0.038 * HEX_R,
                KB_TORSO_CTR + 0.006 * HEX_R,
                -(KB_TORSO_D * 0.5 + 0.020 * HEX_R),
            );
    }
    m.add_mesh(g, g_box(0.196, 0.030, 0.126), m_grass).set_pos(
        0.0,
        KB_TORSO_TOP - 0.010 * HEX_R,
        -0.008 * HEX_R,
    );
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.042, 0.150, 0.016), m_grass)
            .rot_z(-sx * 0.10)
            .set_pos(
                sx * 0.074 * HEX_R,
                KB_TORSO_CTR + 0.036 * HEX_R,
                KB_TORSO_D * 0.5 + 0.012 * HEX_R,
            );
    }

    let pack_z = -(KB_TORSO_D * 0.5 + 0.060 * HEX_R);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_cyl(0.008, 0.008, 0.250, 5), m_wood_l)
            .rot_z(sx * 0.05)
            .set_pos(sx * 0.072 * HEX_R, KB_TORSO_CTR + 0.020 * HEX_R, pack_z);
    }
    for dy in [0.086, -0.070] {
        m.add_mesh(g, g_cyl(0.007, 0.007, 0.150, 5), m_wood_l)
            .rot_z(PI / 2.0)
            .set_pos(0.0, KB_TORSO_CTR + dy * HEX_R, pack_z);
    }
    m.add_mesh(g, g_box(0.130, 0.120, 0.060), m_fur_w).set_pos(
        0.0,
        KB_TORSO_CTR + 0.014 * HEX_R,
        pack_z - 0.020 * HEX_R,
    );
    for dy in [0.048, -0.024] {
        m.add_mesh(g, g_box(0.146, 0.012, 0.070), m_leath_d)
            .set_pos(0.0, KB_TORSO_CTR + dy * HEX_R, pack_z - 0.020 * HEX_R);
    }
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.024, 0.150, 0.012), m_leath)
            .rot_x(0.20)
            .rot_z(sx * 0.22)
            .set_pos(
                sx * 0.062 * HEX_R,
                KB_TORSO_TOP - 0.056 * HEX_R,
                KB_TORSO_D * 0.5 + 0.004 * HEX_R,
            );
    }

    let boot = Foot::Boot {
        sole: m_leath_d,
        upper: m_hide,
        bind: m_linen,
    };
    kb_build_leg(
        &mut m, g, KB_HIP_X, 0.78, 0.42, m_leath, m_leath, boot, hip_y,
    );
    kb_build_leg(
        &mut m, g, -KB_HIP_X, -0.66, -0.28, m_leath, m_leath, boot, hip_y,
    );

    kb_fur_cap(&mut m, g, m_fur, m_leath_d, true);
    m.add_mesh(g, g_box(0.040, 0.018, 0.030), m_owner).set_pos(
        0.0,
        KB_HEAD_CTR + 0.052 * HEX_R,
        KB_HEAD_S * 0.5 + 0.020 * HEX_R,
    );

    let arm_l = kb_build_arm(&mut m, g, KB_SHLD_X, 1.88, 2.96, m_hide, m_skin, None);
    m.add_mesh(g, g_box(0.052, 0.016, 0.070), m_skin)
        .rot_x(0.16)
        .set_pos_v(
            arm_l
                .wrist
                .plus(v3(-0.028 * HEX_R, 0.014 * HEX_R, 0.012 * HEX_R)),
        );
    m.add_mesh(g, g_box(0.014, 0.014, 0.036), m_skin_dk)
        .set_pos_v(
            arm_l
                .wrist
                .plus(v3(-0.050 * HEX_R, 0.012 * HEX_R, 0.006 * HEX_R)),
        );

    let arm_r = kb_build_arm(
        &mut m,
        g,
        -KB_SHLD_X,
        0.40,
        0.66,
        m_hide,
        m_skin,
        Some(m_skin_dk),
    );
    let st_x = arm_r.wrist.x - 0.004 * HEX_R;
    let st_z = arm_r.wrist.z + 0.018 * HEX_R;
    m.add_mesh(g, g_cyl(0.011, 0.014, 0.460, 6), m_wood_l)
        .rot_x(0.05)
        .set_pos(st_x, 0.230 * HEX_R, st_z);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_box(0.010, 0.058, 0.010), m_wood_l)
            .rot_z(sx * 0.34)
            .set_pos(st_x + sx * 0.012 * HEX_R, 0.484 * HEX_R, st_z);
    }
    m.add_mesh(g, g_box(0.024, 0.044, 0.024), m_leath_d)
        .set_pos_v(
            arm_r
                .wrist
                .plus(v3(-0.004 * HEX_R, 0.004 * HEX_R, 0.018 * HEX_R)),
        );
    m.add_mesh(g, g_cone(0.012, 0.030, 5), m_bone)
        .rot_x(PI)
        .set_pos(st_x, 0.016 * HEX_R, st_z - 0.010 * HEX_R);

    m.add_mesh(g, g_box(0.066, 0.076, 0.036), m_leath).set_pos(
        0.104 * HEX_R,
        0.246 * HEX_R,
        0.020 * HEX_R,
    );
    m.add_mesh(g, g_box(0.070, 0.028, 0.042), m_owner).set_pos(
        0.104 * HEX_R,
        0.284 * HEX_R,
        0.020 * HEX_R,
    );
    m.add_mesh(g, g_box(0.014, 0.016, 0.012), m_bone).set_pos(
        0.104 * HEX_R,
        0.258 * HEX_R,
        0.042 * HEX_R,
    );
    m.add_mesh(g, g_box(0.024, 0.248, 0.012), m_leath_d)
        .rot_z(-0.62)
        .set_pos(
            0.0,
            KB_TORSO_CTR + 0.028 * HEX_R,
            KB_TORSO_D * 0.5 + 0.008 * HEX_R,
        );

    let kn_x = -(KB_TORSO_W * 0.5 + 0.018 * HEX_R);
    m.add_mesh(g, g_box(0.024, 0.070, 0.014), m_linen)
        .rot_z(-0.12)
        .set_pos(kn_x, 0.214 * HEX_R, 0.024 * HEX_R);
    m.add_mesh(
        g,
        g_taper(
            TaperProfile::LeafPoint,
            0.044 * HEX_R,
            0.020 * HEX_R,
            0.008 * HEX_R,
        ),
        m_flint,
    )
    .rot_z(-0.12)
    .set_pos(kn_x - 0.004 * HEX_R, 0.250 * HEX_R, 0.024 * HEX_R);
    m.add_mesh(g, g_box(0.018, 0.026, 0.014), m_wood_d)
        .rot_z(-0.12)
        .set_pos(kn_x - 0.006 * HEX_R, 0.244 * HEX_R, 0.024 * HEX_R);
    m
}
