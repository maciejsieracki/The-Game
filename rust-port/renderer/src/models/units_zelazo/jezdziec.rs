//! Port of `render/zelazo-jezdziec-oszczepami-opus5.ts` (`edb8fb56`):
//! `buildZelazoJezdziecOszczepami` (record "Jeździec z oszczepami", rule
//! `units.ts` "jezdziec z oszczepami" / "slavic javelin cavalry").
//!
//! The lazily created `getSJ*` singletons have fixed arguments, so each maps
//! to one geometry value. Products are kept in the web order
//! (`0.110 * SJ_S * HEX_R` = `(0.110 * SJ_S) * HEX_R`).

use super::kit::{
    add_scaled, along, bx, cn, cy, cy_open, dir_down, ico, ik_arm, javelin_head, rotate_on_axis,
    seg_down, seg_up, sph_full, strap_unit, torus, torus_arc, up_dir, v3, IkArmKit,
};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`zelazo-jezdziec-oszczepami-opus5.ts:242-269`)
const SJ_COAT: u32 = 0x7d6247;
const SJ_COAT_LT: u32 = 0xb09777;
const SJ_COAT_DK: u32 = 0x3a2c1e;
const SJ_MANE: u32 = 0x1c140d;
const SJ_HOOF: u32 = 0x241a10;
const SJ_SKIN: u32 = 0xe0ac69;
const SJ_SKIN_DK: u32 = 0xbb8a52;
const SJ_HAIR_SLAV: u32 = 0xa07840;
const SJ_HAIR_DK: u32 = 0x74532c;
const SJ_LINEN: u32 = 0xe8e0c8;
const SJ_LEATHER: u32 = 0x6b4a28;
const SJ_WOOL_DK: u32 = 0x4a3a2e;
const SJ_STEEL: u32 = 0xc2cad2;
const SJ_LEATH_DK: u32 = 0x44301a;
const SJ_FUR: u32 = 0x5a3c20;
const SJ_IRON: u32 = 0x6c7480;
const SJ_IRON_LT: u32 = 0x99a2ab;
const SJ_WOOD: u32 = 0x7a5c3a;
const SJ_EYE: u32 = 0x14100c;

// ── skala i osie (`:272-359`)
const SJ_S: f64 = 0.92;
const SJ_BODY_CTR: f64 = 0.330;
const SJ_BACK_Y: f64 = 0.438;
const SJ_LEG_TOP_F: f64 = 0.2595;
const SJ_LEG_TOP_R: f64 = 0.2607;
const SJ_SEAT_Z: f64 = 0.010;
const SJ_BACK_ABS: f64 = SJ_BACK_Y * SJ_S;
const SJ_SADDLE_H: f64 = 0.026;
const SJ_SEAT_Y: f64 = SJ_BACK_ABS + SJ_SADDLE_H;
const SJ_SEAT_ZA: f64 = SJ_SEAT_Z * SJ_S;
const SJ_TORSO_W: f64 = 0.136;
const SJ_TORSO_H: f64 = 0.148;
const SJ_TORSO_D: f64 = 0.082;
const SJ_TORSO_TOP: f64 = SJ_SEAT_Y + SJ_TORSO_H;
const SJ_NECK_H: f64 = 0.020;
const SJ_HEAD_S: f64 = 0.098;
const SJ_HEAD_CTR: f64 = SJ_TORSO_TOP + SJ_NECK_H + SJ_HEAD_S * 0.5;
const SJ_SHLD_X: f64 = SJ_TORSO_W * 0.5 + 0.014;
const SJ_SHLD_Y: f64 = SJ_TORSO_TOP - 0.019;
const SJ_HIP_X: f64 = 0.098;
const SJ_UPARM_L: f64 = 0.078;
const SJ_FOREARM_L: f64 = 0.072;
const SJ_THIGH_L: f64 = 0.120;
const SJ_SHIN_L: f64 = 0.118;
const SJ_YAW: f64 = 1.02;
const SJ_JAV_TILT: f64 = 1.15;
const SJ_THROW_OFF: Vec3 = Vec3::new(-0.040, 0.104, -0.026);
const SJ_JAV_FRONT: f64 = 0.250;
const SJ_JAV_BACK: f64 = 0.150;
const SJ_SHEAF_GRIP: Vec3 = Vec3::new(0.148, 0.535, 0.060);
const SJ_SHEAF_TILT: f64 = 0.72;
const SJ_SHEAF_FRONT: f64 = 0.300;
const SJ_SHEAF_BACK: f64 = 0.120;
const SJ_SHEAF_N: usize = 4;
const SJ_THIGH_TH: f64 = 0.62;
const SJ_SHIN_TH: f64 = -0.12;
const SJ_STIRRUP_ANCHOR_Z: f64 = SJ_SEAT_ZA + 0.072;

// ── geometrie (`:437-520`, `:553-558`)
fn g_barrel() -> Geo {
    cy(
        0.110 * SJ_S * HEX_R,
        0.102 * SJ_S * HEX_R,
        0.244 * SJ_S * HEX_R,
        7,
    )
}
fn g_chest() -> Geo {
    ico(0.096 * SJ_S * HEX_R, 0)
}
fn g_rump() -> Geo {
    ico(0.100 * SJ_S * HEX_R, 0)
}
fn g_withers() -> Geo {
    bx(
        0.064 * SJ_S * HEX_R,
        0.052 * SJ_S * HEX_R,
        0.104 * SJ_S * HEX_R,
    )
}
fn g_belly() -> Geo {
    bx(
        0.122 * SJ_S * HEX_R,
        0.036 * SJ_S * HEX_R,
        0.196 * SJ_S * HEX_R,
    )
}
fn g_neck(i: usize) -> Geo {
    match i {
        0 => cy_open(
            0.054 * SJ_S * HEX_R,
            0.066 * SJ_S * HEX_R,
            0.076 * SJ_S * HEX_R,
            6,
        ),
        1 => cy_open(
            0.046 * SJ_S * HEX_R,
            0.054 * SJ_S * HEX_R,
            0.066 * SJ_S * HEX_R,
            6,
        ),
        _ => cy_open(
            0.038 * SJ_S * HEX_R,
            0.046 * SJ_S * HEX_R,
            0.052 * SJ_S * HEX_R,
            6,
        ),
    }
}
fn g_skull() -> Geo {
    bx(
        0.064 * SJ_S * HEX_R,
        0.076 * SJ_S * HEX_R,
        0.090 * SJ_S * HEX_R,
    )
}
fn g_muzzle() -> Geo {
    cy(
        0.025 * SJ_S * HEX_R,
        0.033 * SJ_S * HEX_R,
        0.076 * SJ_S * HEX_R,
        5,
    )
}
fn g_nostril() -> Geo {
    bx(
        0.010 * SJ_S * HEX_R,
        0.011 * SJ_S * HEX_R,
        0.008 * SJ_S * HEX_R,
    )
}
fn g_ear() -> Geo {
    cn(0.015 * SJ_S * HEX_R, 0.040 * SJ_S * HEX_R, 4)
}
fn g_eye_h() -> Geo {
    bx(
        0.008 * SJ_S * HEX_R,
        0.014 * SJ_S * HEX_R,
        0.014 * SJ_S * HEX_R,
    )
}
fn g_mane_lock() -> Geo {
    bx(
        0.014 * SJ_S * HEX_R,
        0.058 * SJ_S * HEX_R,
        0.026 * SJ_S * HEX_R,
    )
}
fn g_forelock() -> Geo {
    bx(
        0.020 * SJ_S * HEX_R,
        0.046 * SJ_S * HEX_R,
        0.020 * SJ_S * HEX_R,
    )
}
fn g_up_frnt() -> Geo {
    bx(
        0.046 * SJ_S * HEX_R,
        0.116 * SJ_S * HEX_R,
        0.058 * SJ_S * HEX_R,
    )
}
fn g_up_rear() -> Geo {
    bx(
        0.052 * SJ_S * HEX_R,
        0.122 * SJ_S * HEX_R,
        0.066 * SJ_S * HEX_R,
    )
}
fn g_lower() -> Geo {
    bx(
        0.030 * SJ_S * HEX_R,
        0.116 * SJ_S * HEX_R,
        0.034 * SJ_S * HEX_R,
    )
}
fn g_pastern() -> Geo {
    bx(
        0.030 * SJ_S * HEX_R,
        0.036 * SJ_S * HEX_R,
        0.034 * SJ_S * HEX_R,
    )
}
fn g_hoof() -> Geo {
    bx(
        0.036 * SJ_S * HEX_R,
        0.032 * SJ_S * HEX_R,
        0.042 * SJ_S * HEX_R,
    )
}
fn g_tail1() -> Geo {
    cy(
        0.017 * SJ_S * HEX_R,
        0.021 * SJ_S * HEX_R,
        0.050 * SJ_S * HEX_R,
        4,
    )
}
fn g_tail2() -> Geo {
    cy(
        0.009 * SJ_S * HEX_R,
        0.018 * SJ_S * HEX_R,
        0.132 * SJ_S * HEX_R,
        4,
    )
}
fn g_pad_top() -> Geo {
    bx(
        0.152 * SJ_S * HEX_R,
        0.018 * SJ_S * HEX_R,
        0.236 * SJ_S * HEX_R,
    )
}
fn g_pad_flap() -> Geo {
    bx(
        0.014 * SJ_S * HEX_R,
        0.082 * SJ_S * HEX_R,
        0.204 * SJ_S * HEX_R,
    )
}
fn g_seat() -> Geo {
    bx(0.132 * HEX_R, 0.024 * HEX_R, 0.184 * HEX_R)
}
fn g_arch_f() -> Geo {
    bx(0.112 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)
}
fn g_arch_r() -> Geo {
    bx(0.120 * HEX_R, 0.044 * HEX_R, 0.024 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.012 * HEX_R, 0.052 * HEX_R, 0.104 * HEX_R)
}
fn g_girth() -> Geo {
    cy_open(
        0.116 * SJ_S * HEX_R,
        0.116 * SJ_S * HEX_R,
        0.022 * SJ_S * HEX_R,
        7,
    )
}
fn g_breast() -> Geo {
    bx(
        0.134 * SJ_S * HEX_R,
        0.018 * SJ_S * HEX_R,
        0.020 * SJ_S * HEX_R,
    )
}
fn g_nose_band() -> Geo {
    bx(
        0.046 * SJ_S * HEX_R,
        0.012 * SJ_S * HEX_R,
        0.036 * SJ_S * HEX_R,
    )
}
fn g_brow_band() -> Geo {
    bx(
        0.064 * SJ_S * HEX_R,
        0.011 * SJ_S * HEX_R,
        0.018 * SJ_S * HEX_R,
    )
}
fn g_bit() -> Geo {
    bx(
        0.052 * SJ_S * HEX_R,
        0.009 * SJ_S * HEX_R,
        0.009 * SJ_S * HEX_R,
    )
}
fn g_bit_ring() -> Geo {
    torus(0.014 * SJ_S * HEX_R, 0.004 * SJ_S * HEX_R, 4, 8)
}
fn g_stirrup() -> Geo {
    torus_arc(0.030 * HEX_R, 0.006 * HEX_R, 4, 10, PI * 1.15)
}
fn g_stirrup_tread() -> Geo {
    bx(0.014 * HEX_R, 0.008 * HEX_R, 0.056 * HEX_R)
}
fn g_spur() -> Geo {
    cn(0.011 * HEX_R, 0.038 * HEX_R, 4)
}
fn g_torso() -> Geo {
    bx(SJ_TORSO_W * HEX_R, SJ_TORSO_H * HEX_R, SJ_TORSO_D * HEX_R)
}
fn g_kaftan() -> Geo {
    bx(
        SJ_TORSO_W * 1.06 * HEX_R,
        0.086 * HEX_R,
        SJ_TORSO_D * 1.08 * HEX_R,
    )
}
fn g_belt() -> Geo {
    bx(
        SJ_TORSO_W * 1.09 * HEX_R,
        0.024 * HEX_R,
        SJ_TORSO_D * 1.10 * HEX_R,
    )
}
fn g_neck_r() -> Geo {
    bx(0.038 * HEX_R, SJ_NECK_H * 1.6 * HEX_R, 0.038 * HEX_R)
}
fn g_head() -> Geo {
    bx(SJ_HEAD_S * HEX_R, SJ_HEAD_S * HEX_R, SJ_HEAD_S * HEX_R)
}
fn g_jaw() -> Geo {
    bx(0.066 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)
}
fn g_wasy() -> Geo {
    bx(0.020 * HEX_R, 0.040 * HEX_R, 0.013 * HEX_R)
}
fn g_hair_back() -> Geo {
    bx(0.086 * HEX_R, 0.062 * HEX_R, 0.026 * HEX_R)
}
fn g_cap() -> Geo {
    cy(0.034 * HEX_R, 0.058 * HEX_R, 0.062 * HEX_R, 8)
}
fn g_cap_band() -> Geo {
    cy(0.059 * HEX_R, 0.059 * HEX_R, 0.022 * HEX_R, 8)
}
fn g_ear_r() -> Geo {
    bx(0.009 * HEX_R, 0.025 * HEX_R, 0.016 * HEX_R)
}
fn g_eye_r() -> Geo {
    bx(0.014 * HEX_R, 0.010 * HEX_R, 0.007 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.040 * HEX_R, SJ_UPARM_L * HEX_R, 0.040 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.031 * HEX_R, SJ_FOREARM_L * HEX_R, 0.031 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.036 * HEX_R, 0.036 * HEX_R, 0.038 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.044 * HEX_R, SJ_THIGH_L * HEX_R, 0.050 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.031 * HEX_R, SJ_SHIN_L * HEX_R, 0.034 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.034 * HEX_R, 0.011 * HEX_R, 0.062 * HEX_R)
}
fn g_boot_cuff() -> Geo {
    bx(0.044 * HEX_R, 0.036 * HEX_R, 0.048 * HEX_R)
}
fn g_jav_shaft() -> Geo {
    cy(
        0.0085 * HEX_R,
        0.0100 * HEX_R,
        (SJ_JAV_FRONT + SJ_JAV_BACK) * HEX_R,
        6,
    )
}
fn g_jav_grip() -> Geo {
    bx(0.015 * HEX_R, 0.036 * HEX_R, 0.015 * HEX_R)
}
fn g_jav_butt() -> Geo {
    cn(0.010 * HEX_R, 0.026 * HEX_R, 5)
}
fn g_spare_shaft() -> Geo {
    cy(
        0.0080 * HEX_R,
        0.0095 * HEX_R,
        (SJ_SHEAF_FRONT + SJ_SHEAF_BACK) * HEX_R,
        5,
    )
}
fn g_jav_head() -> Geo {
    javelin_head(0.075 * HEX_R, 0.024 * HEX_R, 0.010 * HEX_R)
}
fn g_spare_head() -> Geo {
    javelin_head(0.066 * HEX_R, 0.022 * HEX_R, 0.009 * HEX_R)
}
fn g_shield_face() -> Geo {
    cy(0.090 * HEX_R, 0.090 * HEX_R, 0.013 * HEX_R, 12)
}
fn g_shield_rim() -> Geo {
    torus(0.090 * HEX_R, 0.007 * HEX_R, 4, 14)
}
fn g_shield_plank() -> Geo {
    bx(0.170 * HEX_R, 0.014 * HEX_R, 0.006 * HEX_R)
}
fn g_shield_boss() -> Geo {
    sph_full(0.021 * HEX_R, 8, 6)
}
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}

/// `sjArmIK` geometries and lengths (`:641`, fist offset `:661`).
fn arm_kit() -> IkArmKit {
    IkArmKit {
        up: g_up_arm(),
        fore: g_forearm(),
        fist: g_fist(),
        l1: SJ_UPARM_L * HEX_R,
        l2: SJ_FOREARM_L * HEX_R,
        fist_off: 0.010 * HEX_R,
    }
}

/// `sjStrap` (`:668-684`).
#[allow(clippy::too_many_arguments)]
fn sj_strap(
    m: &mut UnitModel,
    parent: NodeId,
    mtl: MatId,
    a: Vec3,
    b: Vec3,
    w: f64,
    t: f64,
    name: Option<&str>,
) {
    strap_unit(m, parent, g_unit(), mtl, a, b, w, t, name);
}

// ── noga konia (`:687-711`)
const SJ_LEG_UP_F: f64 = 0.116;
const SJ_LEG_LO_F: f64 = 0.116;
const SJ_LEG_UP_R: f64 = 0.122;
const SJ_LEG_LO_R: f64 = 0.116;
const SJ_LEG_JOINT_OVERLAP: f64 = 0.008;
const SJ_HOOF_H: f64 = 0.032;

#[allow(clippy::too_many_arguments)]
fn sj_horse_leg(
    m: &mut UnitModel,
    parent: NodeId,
    m_coat: MatId,
    m_dark: MatId,
    m_hoof: MatId,
    sx: f64,
    z_piv: f64,
    y_piv: f64,
    th_u: f64,
    th_l: f64,
    rear: bool,
) {
    let lu = (if rear { SJ_LEG_UP_R } else { SJ_LEG_UP_F }) * SJ_S * HEX_R;
    let ll = (if rear { SJ_LEG_LO_R } else { SJ_LEG_LO_F }) * SJ_S * HEX_R;
    let mut p = v3(
        sx * SJ_S * HEX_R,
        y_piv * SJ_S * HEX_R,
        z_piv * SJ_S * HEX_R,
    );
    let up = if rear { g_up_rear() } else { g_up_frnt() };
    p = seg_down(m, parent, up, m_coat, p, th_u, lu, None);
    p.y += SJ_LEG_JOINT_OVERLAP * SJ_S * HEX_R;
    p = seg_down(m, parent, g_lower(), m_coat, p, th_l, ll, None);
    m.add_mesh(parent, g_pastern(), m_dark)
        .set_pos_v(add_scaled(p, dir_down(th_l), 0.004 * SJ_S * HEX_R));
    m.add_mesh(parent, g_hoof(), m_hoof).set_pos(
        p.x,
        p.y - SJ_HOOF_H * 0.5 * SJ_S * HEX_R,
        p.z + 0.004 * SJ_S * HEX_R,
    );
}

/// `SJMats` (`:713-750`).
#[derive(Debug, Clone, Copy)]
struct SjMats {
    coat: MatId,
    coat_lt: MatId,
    coat_dk: MatId,
    mane: MatId,
    hoof: MatId,
    skin: MatId,
    skin_dk: MatId,
    hair: MatId,
    hair_dk: MatId,
    eye: MatId,
    linen: MatId,
    leather: MatId,
    leath_dk: MatId,
    wool: MatId,
    fur: MatId,
    steel: MatId,
    iron: MatId,
    iron_lt: MatId,
    wood: MatId,
    owner: MatId,
}

fn sj_make_materials(m: &mut UnitModel, owner: u32) -> SjMats {
    SjMats {
        coat: m.mat(SJ_COAT, 0.04, 0.87),
        coat_lt: m.mat(SJ_COAT_LT, 0.04, 0.88),
        coat_dk: m.mat(SJ_COAT_DK, 0.04, 0.89),
        mane: m.mat(SJ_MANE, 0.04, 0.90),
        hoof: m.mat(SJ_HOOF, 0.08, 0.72),
        skin: m.mat(SJ_SKIN, 0.05, 0.80),
        skin_dk: m.mat(SJ_SKIN_DK, 0.05, 0.82),
        hair: m.mat(SJ_HAIR_SLAV, 0.04, 0.86),
        hair_dk: m.mat(SJ_HAIR_DK, 0.04, 0.88),
        eye: m.mat(SJ_EYE, 0.05, 0.86),
        linen: m.mat(SJ_LINEN, 0.05, 0.84),
        leather: m.mat(SJ_LEATHER, 0.06, 0.82),
        leath_dk: m.mat(SJ_LEATH_DK, 0.05, 0.86),
        wool: m.mat(SJ_WOOL_DK, 0.05, 0.88),
        fur: m.mat(SJ_FUR, 0.04, 0.92),
        steel: m.mat(SJ_STEEL, 0.55, 0.35),
        iron: m.mat(SJ_IRON, 0.55, 0.40),
        iron_lt: m.mat(SJ_IRON_LT, 0.58, 0.34),
        wood: m.mat(SJ_WOOD, 0.05, 0.84),
        owner: m.mat(owner, 0.10, 0.70),
    }
}

/// `sjBuildMount` (`:757-947`): returns `(bitY, bitZ)`.
#[allow(clippy::too_many_lines)]
fn sj_build_mount(m: &mut UnitModel, root: NodeId, k: &SjMats) -> (f64, f64) {
    const S: f64 = SJ_S;
    m.add_mesh(root, g_barrel(), k.coat)
        .rot_x(PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.74, 1.0, 1.0)
        .set_pos(0.0, SJ_BODY_CTR * S * HEX_R, 0.004 * S * HEX_R);
    m.add_mesh(root, g_belly(), k.coat_lt).set_pos(
        0.0,
        (SJ_BODY_CTR - 0.086) * S * HEX_R,
        0.004 * S * HEX_R,
    );
    m.add_mesh(root, g_chest(), k.coat)
        .set_scale(0.82, 1.00, 0.94)
        .set_pos(0.0, (SJ_BODY_CTR + 0.006) * S * HEX_R, 0.134 * S * HEX_R);
    m.add_mesh(root, g_rump(), k.coat)
        .set_scale(0.88, 1.00, 1.06)
        .set_pos(0.0, (SJ_BODY_CTR - 0.002) * S * HEX_R, -0.140 * S * HEX_R)
        .set_name("sj-horse-rump");
    m.add_mesh(root, g_withers(), k.coat).rot_x(0.20).set_pos(
        0.0,
        0.406 * S * HEX_R,
        0.100 * S * HEX_R,
    );

    let neck_phi = [0.94_f64, 0.68, 0.44];
    let neck_len = [0.076 * S * HEX_R, 0.066 * S * HEX_R, 0.052 * S * HEX_R];
    let mut np = v3(0.0, 0.384 * S * HEX_R, 0.132 * S * HEX_R);
    let mut neck_pts = vec![np];
    for i in 0..3 {
        np = seg_up(
            m,
            root,
            g_neck(i),
            k.coat,
            np,
            neck_phi[i],
            neck_len[i],
            PI / 6.0,
        );
        neck_pts.push(np);
    }

    let head_p = v3(0.0, np.y + 0.012 * S * HEX_R, np.z + 0.020 * S * HEX_R);
    m.add_mesh(root, g_skull(), k.coat)
        .rot_x(0.22)
        .set_pos_v(head_p)
        .set_name("sj-horse-skull");

    let muz_dir = v3(0.0, -0.31, 0.951);
    let muz_base = head_p.plus(v3(0.0, -0.018 * S * HEX_R, 0.028 * S * HEX_R));
    let muzzle = along(
        m,
        root,
        g_muzzle(),
        k.coat_lt,
        add_scaled(muz_base, muz_dir, 0.038 * S * HEX_R),
        muz_dir,
        None,
    );
    m.node(muzzle).rot_y(PI / 4.0);
    let muz_end = add_scaled(muz_base, muz_dir, 0.076 * S * HEX_R);
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_nostril(), k.coat_dk).set_pos(
            s * 0.013 * S * HEX_R,
            muz_end.y + 0.009 * S * HEX_R,
            muz_end.z - 0.008 * S * HEX_R,
        );
        m.add_mesh(root, g_eye_h(), k.eye).set_pos(
            s * 0.033 * S * HEX_R,
            head_p.y + 0.017 * S * HEX_R,
            head_p.z + 0.013 * S * HEX_R,
        );
        m.add_mesh(root, g_ear(), k.coat)
            .set_pos(
                s * 0.020 * S * HEX_R,
                head_p.y + 0.050 * S * HEX_R,
                head_p.z - 0.012 * S * HEX_R,
            )
            .rot_z(-s * 0.26)
            .rot_x(0.16);
    }

    let mane_rad = [0.058 * S * HEX_R, 0.049 * S * HEX_R, 0.042 * S * HEX_R];
    for i in 0..3 {
        let phi = neck_phi[i];
        let crest = v3(0.0, js_sin(phi), -js_cos(phi));
        let mid = neck_pts[i].plus(neck_pts[i + 1]).scale(0.5);
        for f in [-0.30_f64, 0.30] {
            let along_v = up_dir(phi).scale(neck_len[i] * f);
            let pos = add_scaled(mid.plus(along_v), crest, mane_rad[i] * 0.62).plus(v3(
                0.030 * S * HEX_R,
                -0.014 * S * HEX_R,
                0.0,
            ));
            m.add_mesh(root, g_mane_lock(), k.mane)
                .rot_x(phi * 0.35)
                .rot_z(-0.30)
                .set_pos_v(pos);
        }
    }
    m.add_mesh(root, g_forelock(), k.mane).rot_x(0.58).set_pos(
        0.0,
        head_p.y + 0.038 * S * HEX_R,
        head_p.z + 0.026 * S * HEX_R,
    );

    const LX: f64 = 0.058;
    sj_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        LX,
        0.118,
        SJ_LEG_TOP_F,
        0.08,
        -0.05,
        false,
    );
    sj_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        -LX,
        0.122,
        SJ_LEG_TOP_F,
        0.42,
        0.30,
        false,
    );
    sj_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        -LX,
        -0.126,
        SJ_LEG_TOP_R,
        -0.26,
        0.14,
        true,
    );
    sj_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        LX,
        -0.130,
        SJ_LEG_TOP_R,
        -0.28,
        0.16,
        true,
    );

    let mut tp = v3(0.0, 0.388 * S * HEX_R, -0.192 * S * HEX_R);
    tp = seg_up(
        m,
        root,
        g_tail1(),
        k.mane,
        tp,
        -1.20,
        0.050 * S * HEX_R,
        0.0,
    );
    seg_up(
        m,
        root,
        g_tail2(),
        k.mane,
        tp,
        -2.98,
        0.132 * S * HEX_R,
        0.0,
    );

    m.add_mesh(root, g_pad_top(), k.owner)
        .set_pos(0.0, SJ_BACK_Y * S * HEX_R, (SJ_SEAT_Z - 0.016) * S * HEX_R)
        .set_name("sj-horse-pad");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_pad_flap(), k.owner)
            .rot_z(-s * 0.10)
            .set_pos(
                s * 0.082 * S * HEX_R,
                0.382 * S * HEX_R,
                (SJ_SEAT_Z - 0.010) * S * HEX_R,
            );
    }

    m.add_mesh(root, g_seat(), k.leather)
        .set_pos(
            0.0,
            (SJ_BACK_ABS + SJ_SADDLE_H * 0.5) * HEX_R,
            SJ_SEAT_ZA * HEX_R,
        )
        .set_name("sj-saddle-seat");
    m.add_mesh(root, g_arch_f(), k.leath_dk)
        .set_pos(
            0.0,
            (SJ_BACK_ABS + SJ_SADDLE_H + 0.006) * HEX_R,
            (SJ_SEAT_ZA + 0.086) * HEX_R,
        )
        .set_name("sj-saddle-arch-front");
    m.add_mesh(root, g_arch_r(), k.leath_dk)
        .set_pos(
            0.0,
            (SJ_BACK_ABS + SJ_SADDLE_H + 0.012) * HEX_R,
            (SJ_SEAT_ZA - 0.088) * HEX_R,
        )
        .set_name("sj-saddle-arch-rear");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_skirt(), k.leather).set_pos(
            s * 0.068 * HEX_R,
            (SJ_BACK_ABS - 0.012) * HEX_R,
            SJ_STIRRUP_ANCHOR_Z * HEX_R,
        );
    }

    m.add_mesh(root, g_girth(), k.leather)
        .rot_x(PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.74, 1.0, 1.0)
        .set_pos(
            0.0,
            SJ_BODY_CTR * S * HEX_R,
            (SJ_SEAT_Z + 0.006) * S * HEX_R,
        )
        .set_name("sj-horse-girth");
    m.add_mesh(root, g_breast(), k.leather)
        .set_pos(0.0, 0.352 * S * HEX_R, 0.200 * S * HEX_R);
    for s in [-1.0_f64, 1.0] {
        sj_strap(
            m,
            root,
            k.leather,
            v3(s * 0.050 * S * HEX_R, 0.430 * S * HEX_R, -0.090 * S * HEX_R),
            v3(s * 0.020 * S * HEX_R, 0.390 * S * HEX_R, -0.186 * S * HEX_R),
            0.011 * S * HEX_R,
            0.011 * S * HEX_R,
            None,
        );
    }

    m.add_mesh(root, g_nose_band(), k.leather)
        .rot_x(-0.31)
        .set_pos(
            0.0,
            muz_end.y + 0.022 * S * HEX_R,
            muz_end.z - 0.030 * S * HEX_R,
        );
    m.add_mesh(root, g_brow_band(), k.leather).set_pos(
        0.0,
        head_p.y + 0.030 * S * HEX_R,
        head_p.z + 0.026 * S * HEX_R,
    );
    let bit_y = muz_end.y + 0.011 * S * HEX_R;
    let bit_z = muz_end.z - 0.030 * S * HEX_R;
    m.add_mesh(root, g_bit(), k.iron)
        .set_pos(0.0, bit_y, bit_z)
        .set_name("sj-bit");
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_bit_ring(), k.iron_lt)
            .rot_y(PI / 2.0)
            .set_pos(s * 0.026 * S * HEX_R, bit_y, bit_z);
        sj_strap(
            m,
            root,
            k.leather,
            v3(s * 0.026 * S * HEX_R, bit_y, bit_z),
            v3(
                s * 0.030 * S * HEX_R,
                head_p.y + 0.032 * S * HEX_R,
                head_p.z - 0.004 * S * HEX_R,
            ),
            0.010 * S * HEX_R,
            0.010 * S * HEX_R,
            None,
        );
    }
    (bit_y, bit_z)
}

/// `sjBuildRiderCore` (`:964-1094`): returns `(shldL, shldR)`.
#[allow(clippy::too_many_lines)]
fn sj_build_rider_core(m: &mut UnitModel, root: NodeId, k: &SjMats) -> (Vec3, Vec3) {
    const SZ: f64 = SJ_SEAT_ZA;
    m.add_mesh(root, g_torso(), k.linen)
        .rot_x(-0.05)
        .set_pos(0.0, (SJ_SEAT_Y + SJ_TORSO_H * 0.5) * HEX_R, SZ * HEX_R)
        .set_name("sj-rider-torso");
    m.add_mesh(root, g_kaftan(), k.leather).set_pos(
        0.0,
        (SJ_TORSO_TOP - 0.052) * HEX_R,
        SZ * HEX_R,
    );
    m.add_mesh(root, g_belt(), k.owner)
        .set_pos(0.0, (SJ_SEAT_Y + 0.030) * HEX_R, SZ * HEX_R)
        .set_name("sj-rider-belt");

    m.add_mesh(root, g_neck_r(), k.skin).set_pos(
        0.0,
        (SJ_TORSO_TOP + SJ_NECK_H * 0.5) * HEX_R,
        SZ * HEX_R,
    );
    m.add_mesh(root, g_head(), k.skin)
        .set_pos(0.0, SJ_HEAD_CTR * HEX_R, SZ * HEX_R)
        .set_name("sj-rider-head");
    m.add_mesh(root, g_jaw(), k.skin_dk).set_pos(
        0.0,
        (SJ_HEAD_CTR - SJ_HEAD_S * 0.38) * HEX_R,
        (SZ + 0.010) * HEX_R,
    );
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_wasy(), k.hair)
            .rot_z(s * 0.35)
            .set_pos(
                s * 0.021 * HEX_R,
                (SJ_HEAD_CTR - 0.022) * HEX_R,
                (SZ + SJ_HEAD_S * 0.5 + 0.005) * HEX_R,
            )
            .set_name("sj-rider-wasy");
        m.add_mesh(root, g_ear_r(), k.skin_dk).set_pos(
            s * (SJ_HEAD_S * 0.5 + 0.004) * HEX_R,
            (SJ_HEAD_CTR - 0.006) * HEX_R,
            SZ * HEX_R,
        );
    }
    m.add_mesh(root, g_hair_back(), k.hair_dk).set_pos(
        0.0,
        (SJ_HEAD_CTR - 0.014) * HEX_R,
        (SZ - SJ_HEAD_S * 0.5 - 0.010) * HEX_R,
    );
    m.add_mesh(root, g_cap(), k.leather)
        .set_pos(0.0, (SJ_HEAD_CTR + 0.058) * HEX_R, SZ * HEX_R)
        .set_name("sj-rider-cap");
    m.add_mesh(root, g_cap_band(), k.fur)
        .set_pos(0.0, (SJ_HEAD_CTR + 0.042) * HEX_R, SZ * HEX_R);
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_eye_r(), k.eye).set_pos(
            s * 0.022 * HEX_R,
            (SJ_HEAD_CTR + 0.010) * HEX_R,
            (SZ + SJ_HEAD_S * 0.5 + 0.003) * HEX_R,
        );
    }

    for s in [-1.0_f64, 1.0] {
        let mut p = v3(s * SJ_HIP_X * HEX_R, SJ_SEAT_Y * HEX_R, SZ * HEX_R);
        p = seg_down(
            m,
            root,
            g_thigh(),
            k.wool,
            p,
            SJ_THIGH_TH,
            SJ_THIGH_L * HEX_R,
            if s > 0.0 { Some("sj-leg-thigh") } else { None },
        );
        p.x += s * 0.005 * HEX_R;
        p.y += 0.008 * HEX_R;
        p = seg_down(
            m,
            root,
            g_shin(),
            k.wool,
            p,
            SJ_SHIN_TH,
            SJ_SHIN_L * HEX_R,
            if s > 0.0 { Some("sj-leg-shin") } else { None },
        );

        m.add_mesh(root, g_boot_cuff(), k.leather).set_pos(
            p.x,
            p.y + 0.016 * HEX_R,
            p.z + 0.006 * HEX_R,
        );
        m.add_mesh(root, g_sole(), k.leath_dk)
            .set_pos(p.x, p.y - 0.005 * HEX_R, p.z + 0.012 * HEX_R)
            .set_name("sj-boot-sole");
        m.add_mesh(root, g_spur(), k.iron)
            .rot_x(PI * 0.5 - 0.42)
            .set_pos(p.x, p.y + 0.002 * HEX_R, p.z - 0.040 * HEX_R)
            .set_name("sj-spur");

        let tread_y = p.y - 0.019 * HEX_R;
        let tread_z = p.z + 0.012 * HEX_R;
        m.add_mesh(root, g_stirrup_tread(), k.iron)
            .set_pos(p.x, tread_y, tread_z)
            .set_name("sj-stirrup-tread");
        m.add_mesh(root, g_stirrup(), k.iron_lt)
            .rot_y(PI / 2.0)
            .rot_z(-PI * 0.075)
            .set_pos(p.x, tread_y + 0.030 * HEX_R, tread_z)
            .set_name("sj-stirrup-hoop");
        let eye = v3(p.x, tread_y + 0.058 * HEX_R, tread_z);
        sj_strap(
            m,
            root,
            k.leath_dk,
            v3(
                s * (SJ_HIP_X - 0.008) * HEX_R,
                (SJ_BACK_ABS + 0.006) * HEX_R,
                SJ_STIRRUP_ANCHOR_Z * HEX_R,
            ),
            eye,
            0.010 * HEX_R,
            0.010 * HEX_R,
            Some("sj-stirrup-leather"),
        );
    }

    let shld_l = v3(SJ_SHLD_X * HEX_R, SJ_SHLD_Y * HEX_R, SZ * HEX_R);
    let shld_r = v3(-SJ_SHLD_X * HEX_R, SJ_SHLD_Y * HEX_R, SZ * HEX_R);
    (shld_l, shld_r)
}

/// `sjBuildJavelin` (`:1097-1113`).
#[allow(clippy::too_many_arguments)]
fn sj_build_javelin(
    m: &mut UnitModel,
    root: NodeId,
    k: &SjMats,
    grip: Vec3,
    dir: Vec3,
    front: f64,
    back: f64,
    shaft_geo: Geo,
    head_geo: Geo,
    name_shaft: &str,
    name_head: &str,
    with_grip: bool,
    name_butt: Option<&str>,
) {
    let at = |t: f64| add_scaled(grip, dir, t * HEX_R);
    let shaft_mid = (front - back) * 0.5;
    along(
        m,
        root,
        shaft_geo,
        k.wood,
        at(shaft_mid),
        dir,
        Some(name_shaft),
    );
    if with_grip {
        along(m, root, g_jav_grip(), k.leath_dk, at(0.0), dir, None);
    }
    along(
        m,
        root,
        head_geo,
        k.iron_lt,
        at(front),
        dir,
        Some(name_head),
    );
    if let Some(nb) = name_butt {
        let butt = along(m, root, g_jav_butt(), k.iron, at(-back), dir, Some(nb));
        rotate_on_axis(m, butt, v3(1.0, 0.0, 0.0), PI);
    }
}

/// `buildZelazoJezdziecOszczepami(ownerColor)`
/// (`zelazo-jezdziec-oszczepami-opus5.ts:1119-1211`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_zelazo_jezdziec_oszczepami(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let root = m.add_group(ROOT);
    m.node(root).rot_y(SJ_YAW);

    let k = sj_make_materials(&mut m, owner);
    let (bit_y, bit_z) = sj_build_mount(&mut m, root, &k);
    let (shld_l, shld_r) = sj_build_rider_core(&mut m, root, &k);

    let throw_grip = shld_r.plus(SJ_THROW_OFF.scale(HEX_R));
    ik_arm(
        &mut m,
        root,
        &arm_kit(),
        shld_r,
        throw_grip,
        v3(-0.80, -0.35, -0.45),
        k.linen,
        Some(k.skin),
        Some("sj-throw"),
    );
    let d_jav = up_dir(SJ_JAV_TILT);
    sj_build_javelin(
        &mut m,
        root,
        &k,
        throw_grip,
        d_jav,
        SJ_JAV_FRONT,
        SJ_JAV_BACK,
        g_jav_shaft(),
        g_jav_head(),
        "sj-jav-shaft",
        "sj-jav-head",
        true,
        Some("sj-jav-butt"),
    );

    let sheaf_grip = SJ_SHEAF_GRIP.scale(HEX_R);
    let arm_l = ik_arm(
        &mut m,
        root,
        &arm_kit(),
        shld_l,
        sheaf_grip,
        v3(0.85, -0.30, -0.40),
        k.linen,
        Some(k.skin),
        Some("sj-rein"),
    );
    let d_sheaf = up_dir(SJ_SHEAF_TILT);
    let sheaf_off: [(f64, f64); 4] = [
        (-0.011, 0.009),
        (0.011, 0.009),
        (-0.007, -0.011),
        (0.013, -0.008),
    ];
    for &(ox, oy) in sheaf_off.iter().take(SJ_SHEAF_N) {
        let g = sheaf_grip.plus(v3(ox * HEX_R, oy * HEX_R, 0.0));
        sj_build_javelin(
            &mut m,
            root,
            &k,
            g,
            d_sheaf,
            SJ_SHEAF_FRONT,
            SJ_SHEAF_BACK,
            g_spare_shaft(),
            g_spare_head(),
            "sj-spare-jav-shaft",
            "sj-spare-jav-head",
            false,
            None,
        );
    }

    let wrist_l = arm_l.hand;
    sj_strap(
        &mut m,
        root,
        k.leath_dk,
        v3(0.026 * SJ_S * HEX_R, bit_y, bit_z),
        v3(
            wrist_l.x - 0.008 * HEX_R,
            wrist_l.y - 0.004 * HEX_R,
            wrist_l.z,
        ),
        0.007 * HEX_R,
        0.007 * HEX_R,
        Some("sj-rein-strap"),
    );

    let shield_ctr = v3(
        0.0,
        (SJ_SEAT_Y + 0.098) * HEX_R,
        (SJ_SEAT_ZA - SJ_TORSO_D * 0.5 - 0.030) * HEX_R,
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos_v(shield_ctr)
        .rot_x(PI / 2.0 + 0.16)
        .rot_z(0.10);
    m.add_mesh(sh, g_shield_face(), k.owner)
        .set_name("sj-shield-back");
    m.add_mesh(sh, g_shield_rim(), k.leather)
        .rot_x(PI / 2.0)
        .set_name("sj-shield-rim");
    for a in [0.0, PI / 3.0, -PI / 3.0] {
        m.add_mesh(sh, g_shield_plank(), k.wood)
            .rot_y(a)
            .set_pos(0.0, 0.009 * HEX_R, 0.0);
    }
    m.add_mesh(sh, g_shield_boss(), k.steel)
        .set_pos(0.0, -0.014 * HEX_R, 0.0)
        .set_name("sj-shield-boss");
    m.attach(root, sh);

    sj_strap(
        &mut m,
        root,
        k.leather,
        shld_l.plus(v3(-0.006 * HEX_R, 0.012 * HEX_R, -0.006 * HEX_R)),
        v3(
            -SJ_SHLD_X * 0.85 * HEX_R,
            (SJ_SEAT_Y + 0.044) * HEX_R,
            (SJ_SEAT_ZA - 0.026) * HEX_R,
        ),
        0.014 * HEX_R,
        0.010 * HEX_R,
        Some("sj-shield-baldric"),
    );
    m
}
