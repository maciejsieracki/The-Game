//! Port of `render/zelazo-konnica-asyryjska-opus5.ts` (`edb8fb56`):
//! `buildZelazoKonnicaLancowaAsyryjska` and
//! `buildZelazoKonnicaLuczniczaAsyryjska` (records "Konnica lancowa
//! asyryjska" and "Konnica łucznicza asyryjska").
//!
//! The lazily created `getAC*` singletons have fixed arguments, so each maps
//! to one geometry value. Products are kept in the web order
//! (`0.108 * AC_S * HEX_R` = `(0.108 * AC_S) * HEX_R`).

use super::kit::{
    add_scaled, along, apply_quat, blade, bx, cn, cy, cy_open, dir_down, ico, ik_arm,
    rotate_on_axis, seg_down, seg_up, sph_full, strap_unit, torus, up_dir, v3, BladeProfile,
    IkArmKit,
};
use crate::geom::Vec3;
use crate::jsmath::{js_atan2, js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`zelazo-konnica-asyryjska-opus5.ts:217-242`)
const AC_COAT: u32 = 0x7a4527;
const AC_COAT_DK: u32 = 0x4d2a18;
const AC_MANE: u32 = 0x140c07;
const AC_HOOF: u32 = 0x241a10;
const AC_SKIN: u32 = 0xdba876;
const AC_SKIN_DK: u32 = 0xb9855a;
const AC_SCALE: u32 = 0x8f97a0;
const AC_SCALE_DK: u32 = 0x656d75;
const AC_IRON: u32 = 0x6c7480;
const AC_IRON_LT: u32 = 0x99a2ab;
const AC_BRONZE: u32 = 0xcf9234;
const AC_BRONZE_LT: u32 = 0xdaa84e;
const AC_LEATHER: u32 = 0x6b4a28;
const AC_LEATHER_DK: u32 = 0x44301a;
const AC_WOOD: u32 = 0x7a5c3a;
const AC_WOOD_BOW: u32 = 0x8a6238;
const AC_STRING: u32 = 0xe8e0cc;
const AC_BOOT: u32 = 0x3f2c1f;
const AC_HAIR: u32 = 0x1a0c06;
const AC_EYE: u32 = 0x14100c;
const AC_SHIELD_FACE: u32 = 0x5a3a20;
const AC_SHIELD_RIM: u32 = 0x8f97a0;

// ── skala i osie (`:245-292`)
const AC_S: f64 = 1.06;
const AC_BODY_CTR: f64 = 0.332;
const AC_BACK_Y: f64 = 0.440;
const AC_LEG_TOP_F: f64 = 0.2595;
const AC_LEG_TOP_R: f64 = 0.2607;
const AC_SEAT_Z: f64 = 0.010;
const AC_TORSO_W: f64 = 0.140;
const AC_TORSO_H: f64 = 0.150;
const AC_TORSO_D: f64 = 0.090;
const AC_TORSO_TOP: f64 = AC_BACK_Y * AC_S + AC_TORSO_H;
const AC_NECK_H: f64 = 0.021;
const AC_HEAD_S: f64 = 0.100;
const AC_HEAD_CTR: f64 = AC_TORSO_TOP + AC_NECK_H + AC_HEAD_S * 0.5;
const AC_HEAD_TOP: f64 = AC_TORSO_TOP + AC_NECK_H + AC_HEAD_S;
const AC_SHLD_X: f64 = AC_TORSO_W * 0.5 + 0.014;
const AC_SHLD_Y: f64 = AC_TORSO_TOP - 0.019;
const AC_HIP_X: f64 = 0.104;
const AC_UPARM_L: f64 = 0.078;
const AC_FOREARM_L: f64 = 0.072;
const AC_THIGH_L: f64 = 0.130;
const AC_SHIN_L: f64 = 0.130;
const AC_YAW: f64 = 1.02;
const AC_LANCE_TILT: f64 = 0.90;
const AC_LANCE_GRIP: Vec3 = Vec3::new(-0.150, 0.545, 0.120);
const AC_LANCE_FRONT: f64 = 0.404;
const AC_LANCE_BACK: f64 = 0.216;
const AC_BOW_S: f64 = 0.80;
const AC_BOW_CANT: f64 = 0.75;

// ── geometrie (`:369-441`, `:474-476`)
fn g_barrel() -> Geo {
    cy(
        0.108 * AC_S * HEX_R,
        0.100 * AC_S * HEX_R,
        0.256 * AC_S * HEX_R,
        7,
    )
}
fn g_chest() -> Geo {
    ico(0.094 * AC_S * HEX_R, 0)
}
fn g_rump() -> Geo {
    ico(0.096 * AC_S * HEX_R, 0)
}
fn g_withers() -> Geo {
    bx(
        0.066 * AC_S * HEX_R,
        0.056 * AC_S * HEX_R,
        0.110 * AC_S * HEX_R,
    )
}
fn g_neck(i: usize) -> Geo {
    match i {
        0 => cy_open(
            0.052 * AC_S * HEX_R,
            0.064 * AC_S * HEX_R,
            0.082 * AC_S * HEX_R,
            6,
        ),
        1 => cy_open(
            0.043 * AC_S * HEX_R,
            0.052 * AC_S * HEX_R,
            0.072 * AC_S * HEX_R,
            6,
        ),
        _ => cy_open(
            0.036 * AC_S * HEX_R,
            0.043 * AC_S * HEX_R,
            0.058 * AC_S * HEX_R,
            6,
        ),
    }
}
fn g_skull() -> Geo {
    bx(
        0.066 * AC_S * HEX_R,
        0.080 * AC_S * HEX_R,
        0.096 * AC_S * HEX_R,
    )
}
fn g_muzzle() -> Geo {
    cy(
        0.023 * AC_S * HEX_R,
        0.032 * AC_S * HEX_R,
        0.082 * AC_S * HEX_R,
        5,
    )
}
fn g_nostril() -> Geo {
    bx(
        0.010 * AC_S * HEX_R,
        0.011 * AC_S * HEX_R,
        0.008 * AC_S * HEX_R,
    )
}
fn g_ear() -> Geo {
    cn(0.015 * AC_S * HEX_R, 0.042 * AC_S * HEX_R, 4)
}
fn g_eye_h() -> Geo {
    bx(
        0.008 * AC_S * HEX_R,
        0.014 * AC_S * HEX_R,
        0.014 * AC_S * HEX_R,
    )
}
fn g_mane_tuft() -> Geo {
    bx(
        0.018 * AC_S * HEX_R,
        0.034 * AC_S * HEX_R,
        0.026 * AC_S * HEX_R,
    )
}
fn g_forelock() -> Geo {
    bx(
        0.020 * AC_S * HEX_R,
        0.042 * AC_S * HEX_R,
        0.022 * AC_S * HEX_R,
    )
}
fn g_up_frnt() -> Geo {
    bx(
        0.044 * AC_S * HEX_R,
        0.118 * AC_S * HEX_R,
        0.056 * AC_S * HEX_R,
    )
}
fn g_up_rear() -> Geo {
    bx(
        0.050 * AC_S * HEX_R,
        0.124 * AC_S * HEX_R,
        0.064 * AC_S * HEX_R,
    )
}
fn g_lower() -> Geo {
    bx(
        0.028 * AC_S * HEX_R,
        0.118 * AC_S * HEX_R,
        0.032 * AC_S * HEX_R,
    )
}
fn g_pastern() -> Geo {
    bx(
        0.028 * AC_S * HEX_R,
        0.038 * AC_S * HEX_R,
        0.032 * AC_S * HEX_R,
    )
}
fn g_hoof() -> Geo {
    bx(
        0.034 * AC_S * HEX_R,
        0.032 * AC_S * HEX_R,
        0.040 * AC_S * HEX_R,
    )
}
fn g_tail1() -> Geo {
    cy(
        0.016 * AC_S * HEX_R,
        0.020 * AC_S * HEX_R,
        0.052 * AC_S * HEX_R,
        4,
    )
}
fn g_tail2() -> Geo {
    cy(
        0.008 * AC_S * HEX_R,
        0.017 * AC_S * HEX_R,
        0.128 * AC_S * HEX_R,
        4,
    )
}
fn g_pad_top() -> Geo {
    bx(
        0.150 * AC_S * HEX_R,
        0.020 * AC_S * HEX_R,
        0.238 * AC_S * HEX_R,
    )
}
fn g_pad_flap() -> Geo {
    bx(
        0.015 * AC_S * HEX_R,
        0.096 * AC_S * HEX_R,
        0.212 * AC_S * HEX_R,
    )
}
fn g_pad_hem() -> Geo {
    bx(
        0.018 * AC_S * HEX_R,
        0.014 * AC_S * HEX_R,
        0.216 * AC_S * HEX_R,
    )
}
fn g_pad_ridge() -> Geo {
    bx(
        0.140 * AC_S * HEX_R,
        0.030 * AC_S * HEX_R,
        0.020 * AC_S * HEX_R,
    )
}
fn g_fringe() -> Geo {
    cn(0.008 * AC_S * HEX_R, 0.040 * AC_S * HEX_R, 4)
}
fn g_girth() -> Geo {
    cy_open(
        0.114 * AC_S * HEX_R,
        0.114 * AC_S * HEX_R,
        0.022 * AC_S * HEX_R,
        7,
    )
}
fn g_breast() -> Geo {
    bx(
        0.136 * AC_S * HEX_R,
        0.018 * AC_S * HEX_R,
        0.020 * AC_S * HEX_R,
    )
}
fn g_nose_band() -> Geo {
    bx(
        0.044 * AC_S * HEX_R,
        0.012 * AC_S * HEX_R,
        0.036 * AC_S * HEX_R,
    )
}
fn g_brow_band() -> Geo {
    bx(
        0.066 * AC_S * HEX_R,
        0.011 * AC_S * HEX_R,
        0.018 * AC_S * HEX_R,
    )
}
fn g_bit() -> Geo {
    bx(
        0.052 * AC_S * HEX_R,
        0.009 * AC_S * HEX_R,
        0.009 * AC_S * HEX_R,
    )
}
fn g_bit_ring() -> Geo {
    torus(0.014 * AC_S * HEX_R, 0.004 * AC_S * HEX_R, 4, 8)
}
fn g_torso() -> Geo {
    bx(AC_TORSO_W * HEX_R, AC_TORSO_H * HEX_R, AC_TORSO_D * HEX_R)
}
fn g_chest_r() -> Geo {
    bx(
        AC_TORSO_W * 1.05 * HEX_R,
        0.064 * HEX_R,
        AC_TORSO_D * 1.06 * HEX_R,
    )
}
fn g_scale_row() -> Geo {
    bx(
        AC_TORSO_W * 1.02 * HEX_R,
        0.018 * HEX_R,
        AC_TORSO_D * 1.04 * HEX_R,
    )
}
fn g_sash() -> Geo {
    bx(
        AC_TORSO_W * 1.04 * HEX_R,
        0.030 * HEX_R,
        AC_TORSO_D * 1.06 * HEX_R,
    )
}
fn g_neck_r() -> Geo {
    bx(0.040 * HEX_R, AC_NECK_H * 1.6 * HEX_R, 0.040 * HEX_R)
}
fn g_head() -> Geo {
    bx(AC_HEAD_S * HEX_R, AC_HEAD_S * HEX_R, AC_HEAD_S * HEX_R)
}
fn g_jaw() -> Geo {
    bx(0.068 * HEX_R, 0.027 * HEX_R, 0.031 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.064 * HEX_R, 0.085 * HEX_R, 0.024 * HEX_R)
}
fn g_helm() -> Geo {
    cy(0.013 * HEX_R, 0.082 * HEX_R, 0.135 * HEX_R, 8)
}
fn g_crest() -> Geo {
    bx(0.016 * HEX_R, 0.052 * HEX_R, 0.098 * HEX_R)
}
fn g_ear_r() -> Geo {
    bx(0.009 * HEX_R, 0.026 * HEX_R, 0.017 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.042 * HEX_R, AC_UPARM_L * HEX_R, 0.042 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.032 * HEX_R, AC_FOREARM_L * HEX_R, 0.032 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.037 * HEX_R, 0.037 * HEX_R, 0.039 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.044 * HEX_R, AC_THIGH_L * HEX_R, 0.050 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.031 * HEX_R, AC_SHIN_L * HEX_R, 0.035 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.036 * HEX_R, 0.012 * HEX_R, 0.066 * HEX_R)
}
fn g_boot_cuff() -> Geo {
    bx(0.048 * HEX_R, 0.040 * HEX_R, 0.052 * HEX_R)
}
fn g_shaft() -> Geo {
    cy(0.011 * HEX_R, 0.013 * HEX_R, 0.620 * HEX_R, 7)
}
fn g_socket() -> Geo {
    cy(0.015 * HEX_R, 0.018 * HEX_R, 0.036 * HEX_R, 7)
}
fn g_bind() -> Geo {
    bx(0.018 * HEX_R, 0.015 * HEX_R, 0.018 * HEX_R)
}
fn g_grip() -> Geo {
    bx(0.016 * HEX_R, 0.048 * HEX_R, 0.016 * HEX_R)
}
fn g_butt() -> Geo {
    cn(0.013 * HEX_R, 0.040 * HEX_R, 5)
}
fn g_shield() -> Geo {
    cy(0.100 * HEX_R, 0.100 * HEX_R, 0.014 * HEX_R, 12)
}
fn g_boss() -> Geo {
    sph_full(0.020 * HEX_R, 8, 6)
}
fn g_rim() -> Geo {
    torus(0.100 * HEX_R, 0.007 * HEX_R, 4, 14)
}
fn g_bow_mid() -> Geo {
    bx(0.021 * HEX_R, 0.150 * AC_BOW_S * HEX_R, 0.024 * HEX_R)
}
fn g_bow_limb() -> Geo {
    bx(0.019 * HEX_R, 0.125 * AC_BOW_S * HEX_R, 0.021 * HEX_R)
}
fn g_bow_siyah() -> Geo {
    bx(0.016 * HEX_R, 0.072 * AC_BOW_S * HEX_R, 0.018 * HEX_R)
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
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_lance_hd() -> Geo {
    // `acMakeLeafHeadGeo` (`:448-473`) = the MOD-06 `LeafHead` section table.
    blade(
        BladeProfile::LeafHead,
        0.100 * HEX_R,
        0.038 * HEX_R,
        0.015 * HEX_R,
    )
}

/// `acArmIK` geometries and lengths (`:546`, fist offset `:567`).
fn arm_kit() -> IkArmKit {
    IkArmKit {
        up: g_up_arm(),
        fore: g_forearm(),
        fist: g_fist(),
        l1: AC_UPARM_L * HEX_R,
        l2: AC_FOREARM_L * HEX_R,
        fist_off: 0.010 * HEX_R,
    }
}

/// `acStrap` (`:574-589`).
fn ac_strap(m: &mut UnitModel, parent: NodeId, mtl: MatId, a: Vec3, b: Vec3, w: f64, t: f64) {
    strap_unit(m, parent, g_unit(), mtl, a, b, w, t, None);
}

// ── noga konia (`:591-615`)
const AC_LEG_UP_F: f64 = 0.118;
const AC_LEG_LO_F: f64 = 0.118;
const AC_LEG_UP_R: f64 = 0.124;
const AC_LEG_LO_R: f64 = 0.118;
const AC_LEG_JOINT_OVERLAP: f64 = 0.008;
const AC_HOOF_H: f64 = 0.032;

#[allow(clippy::too_many_arguments)]
fn ac_horse_leg(
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
    let lu = (if rear { AC_LEG_UP_R } else { AC_LEG_UP_F }) * AC_S * HEX_R;
    let ll = (if rear { AC_LEG_LO_R } else { AC_LEG_LO_F }) * AC_S * HEX_R;
    let mut p = v3(
        sx * AC_S * HEX_R,
        y_piv * AC_S * HEX_R,
        z_piv * AC_S * HEX_R,
    );
    let up = if rear { g_up_rear() } else { g_up_frnt() };
    p = seg_down(m, parent, up, m_coat, p, th_u, lu, None);
    p.y += AC_LEG_JOINT_OVERLAP * AC_S * HEX_R;
    p = seg_down(m, parent, g_lower(), m_coat, p, th_l, ll, None);
    m.add_mesh(parent, g_pastern(), m_dark)
        .set_pos_v(add_scaled(p, dir_down(th_l), 0.004 * AC_S * HEX_R));
    m.add_mesh(parent, g_hoof(), m_hoof).set_pos(
        p.x,
        p.y - AC_HOOF_H * 0.5 * AC_S * HEX_R,
        p.z + 0.004 * AC_S * HEX_R,
    );
}

/// `ACMats` (`:617-655`).
#[derive(Debug, Clone, Copy)]
struct AcMats {
    coat: MatId,
    coat_dk: MatId,
    mane: MatId,
    hoof: MatId,
    skin: MatId,
    skin_dk: MatId,
    scale: MatId,
    scale_dk: MatId,
    leather: MatId,
    leath_dk: MatId,
    bronze: MatId,
    bronze_lt: MatId,
    iron: MatId,
    iron_lt: MatId,
    hair: MatId,
    eye: MatId,
    owner: MatId,
    boot: MatId,
    wood: MatId,
    wood_bow: MatId,
    string: MatId,
}

fn ac_make_materials(m: &mut UnitModel, owner: u32) -> AcMats {
    AcMats {
        coat: m.mat(AC_COAT, 0.04, 0.86),
        coat_dk: m.mat(AC_COAT_DK, 0.04, 0.88),
        mane: m.mat(AC_MANE, 0.04, 0.90),
        hoof: m.mat(AC_HOOF, 0.08, 0.72),
        skin: m.mat(AC_SKIN, 0.05, 0.80),
        skin_dk: m.mat(AC_SKIN_DK, 0.05, 0.82),
        scale: m.mat(AC_SCALE, 0.32, 0.50),
        scale_dk: m.mat(AC_SCALE_DK, 0.30, 0.56),
        leather: m.mat(AC_LEATHER, 0.05, 0.85),
        leath_dk: m.mat(AC_LEATHER_DK, 0.05, 0.88),
        bronze: m.mat(AC_BRONZE, 0.50, 0.42),
        bronze_lt: m.mat(AC_BRONZE_LT, 0.55, 0.36),
        iron: m.mat(AC_IRON, 0.55, 0.40),
        iron_lt: m.mat(AC_IRON_LT, 0.58, 0.34),
        hair: m.mat(AC_HAIR, 0.04, 0.90),
        eye: m.mat(AC_EYE, 0.05, 0.86),
        owner: m.mat(owner, 0.10, 0.70),
        boot: m.mat(AC_BOOT, 0.05, 0.88),
        wood: m.mat(AC_WOOD, 0.05, 0.84),
        wood_bow: m.mat(AC_WOOD_BOW, 0.05, 0.82),
        string: m.mat(AC_STRING, 0.02, 0.95),
    }
}

/// `acBuildMount` (`:662-828`): returns `(bitY, bitZ)`.
#[allow(clippy::too_many_lines)]
fn ac_build_mount(m: &mut UnitModel, root: NodeId, k: &AcMats) -> (f64, f64) {
    const S: f64 = AC_S;
    m.add_mesh(root, g_barrel(), k.coat)
        .rot_x(PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.72, 1.0, 1.0)
        .set_pos(0.0, AC_BODY_CTR * S * HEX_R, 0.004 * S * HEX_R);
    m.add_mesh(root, g_chest(), k.coat)
        .set_scale(0.80, 1.00, 0.95)
        .set_pos(0.0, (AC_BODY_CTR + 0.006) * S * HEX_R, 0.140 * S * HEX_R);
    m.add_mesh(root, g_rump(), k.coat)
        .set_scale(0.88, 1.00, 1.10)
        .set_pos(0.0, (AC_BODY_CTR - 0.002) * S * HEX_R, -0.144 * S * HEX_R);
    m.add_mesh(root, g_withers(), k.coat).rot_x(0.20).set_pos(
        0.0,
        0.408 * S * HEX_R,
        0.104 * S * HEX_R,
    );

    let neck_phi = [0.92_f64, 0.66, 0.42];
    let neck_len = [0.082 * S * HEX_R, 0.072 * S * HEX_R, 0.058 * S * HEX_R];
    let mut np = v3(0.0, 0.386 * S * HEX_R, 0.136 * S * HEX_R);
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

    let head_p = v3(0.0, np.y + 0.013 * S * HEX_R, np.z + 0.021 * S * HEX_R);
    m.add_mesh(root, g_skull(), k.coat)
        .rot_x(0.22)
        .set_pos_v(head_p);

    let muz_dir = v3(0.0, -0.31, 0.951);
    let muz_base = head_p.plus(v3(0.0, -0.018 * S * HEX_R, 0.030 * S * HEX_R));
    let muzzle = along(
        m,
        root,
        g_muzzle(),
        k.coat,
        add_scaled(muz_base, muz_dir, 0.041 * S * HEX_R),
        muz_dir,
        None,
    );
    m.node(muzzle).rot_y(PI / 4.0);
    let muz_end = add_scaled(muz_base, muz_dir, 0.082 * S * HEX_R);
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_nostril(), k.coat_dk).set_pos(
            s * 0.013 * S * HEX_R,
            muz_end.y + 0.009 * S * HEX_R,
            muz_end.z - 0.008 * S * HEX_R,
        );
        m.add_mesh(root, g_eye_h(), k.eye).set_pos(
            s * 0.034 * S * HEX_R,
            head_p.y + 0.018 * S * HEX_R,
            head_p.z + 0.014 * S * HEX_R,
        );
        m.add_mesh(root, g_ear(), k.coat)
            .set_pos(
                s * 0.021 * S * HEX_R,
                head_p.y + 0.054 * S * HEX_R,
                head_p.z - 0.012 * S * HEX_R,
            )
            .rot_z(-s * 0.28)
            .rot_x(0.16);
    }

    let mane_rad = [0.056 * S * HEX_R, 0.047 * S * HEX_R, 0.040 * S * HEX_R];
    for i in 0..3 {
        let phi = neck_phi[i];
        let crest = v3(0.0, js_sin(phi), -js_cos(phi));
        let mid = neck_pts[i].plus(neck_pts[i + 1]).scale(0.5);
        for f in [-0.28_f64, 0.28] {
            let along_v = up_dir(phi).scale(neck_len[i] * f);
            m.add_mesh(root, g_mane_tuft(), k.mane)
                .rot_x(phi)
                .set_pos_v(add_scaled(mid.plus(along_v), crest, mane_rad[i]));
        }
    }
    m.add_mesh(root, g_forelock(), k.mane).rot_x(0.62).set_pos(
        0.0,
        head_p.y + 0.040 * S * HEX_R,
        head_p.z + 0.028 * S * HEX_R,
    );

    const LX: f64 = 0.058;
    ac_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        LX,
        0.122,
        AC_LEG_TOP_F,
        0.08,
        -0.05,
        false,
    );
    ac_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        -LX,
        0.126,
        AC_LEG_TOP_F,
        0.42,
        0.30,
        false,
    );
    ac_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        -LX,
        -0.130,
        AC_LEG_TOP_R,
        -0.26,
        0.14,
        true,
    );
    ac_horse_leg(
        m,
        root,
        k.coat,
        k.coat_dk,
        k.hoof,
        LX,
        -0.134,
        AC_LEG_TOP_R,
        -0.28,
        0.16,
        true,
    );

    let mut tp = v3(0.0, 0.392 * S * HEX_R, -0.196 * S * HEX_R);
    tp = seg_up(
        m,
        root,
        g_tail1(),
        k.mane,
        tp,
        -1.20,
        0.052 * S * HEX_R,
        0.0,
    );
    seg_up(
        m,
        root,
        g_tail2(),
        k.mane,
        tp,
        -2.98,
        0.124 * S * HEX_R,
        0.0,
    );

    m.add_mesh(root, g_pad_top(), k.owner)
        .set_pos(0.0, 0.436 * S * HEX_R, (AC_SEAT_Z - 0.018) * S * HEX_R)
        .set_name("ac-horse-pad");
    m.add_mesh(root, g_pad_ridge(), k.leath_dk)
        .set_pos(0.0, 0.450 * S * HEX_R, 0.096 * S * HEX_R);
    m.add_mesh(root, g_pad_ridge(), k.leath_dk)
        .set_pos(0.0, 0.450 * S * HEX_R, -0.100 * S * HEX_R);
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_pad_flap(), k.owner)
            .rot_z(-s * 0.10)
            .set_pos(
                s * 0.081 * S * HEX_R,
                0.378 * S * HEX_R,
                (AC_SEAT_Z - 0.012) * S * HEX_R,
            );
        m.add_mesh(root, g_pad_hem(), k.leath_dk).set_pos(
            s * 0.086 * S * HEX_R,
            0.328 * S * HEX_R,
            (AC_SEAT_Z - 0.012) * S * HEX_R,
        );
    }
    m.add_mesh(root, g_girth(), k.leather)
        .rot_x(PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.72, 1.0, 1.0)
        .set_pos(
            0.0,
            AC_BODY_CTR * S * HEX_R,
            (AC_SEAT_Z + 0.006) * S * HEX_R,
        )
        .set_name("ac-horse-girth");
    m.add_mesh(root, g_breast(), k.leather)
        .set_pos(0.0, 0.358 * S * HEX_R, 0.208 * S * HEX_R);
    for s in [-1.0_f64, -0.35, 0.35, 1.0] {
        m.add_mesh(root, g_fringe(), k.leath_dk).rot_x(PI).set_pos(
            s * 0.062 * S * HEX_R,
            0.340 * S * HEX_R,
            0.210 * S * HEX_R,
        );
    }
    for s in [-1.0_f64, 1.0] {
        ac_strap(
            m,
            root,
            k.leather,
            v3(s * 0.050 * S * HEX_R, 0.432 * S * HEX_R, -0.092 * S * HEX_R),
            v3(s * 0.020 * S * HEX_R, 0.394 * S * HEX_R, -0.190 * S * HEX_R),
            0.011 * S * HEX_R,
            0.011 * S * HEX_R,
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
        head_p.y + 0.032 * S * HEX_R,
        head_p.z + 0.028 * S * HEX_R,
    );
    let bit_y = muz_end.y + 0.011 * S * HEX_R;
    let bit_z = muz_end.z - 0.030 * S * HEX_R;
    m.add_mesh(root, g_bit(), k.bronze)
        .set_pos(0.0, bit_y, bit_z);
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_bit_ring(), k.bronze_lt)
            .rot_y(PI / 2.0)
            .set_pos(s * 0.026 * S * HEX_R, bit_y, bit_z);
        ac_strap(
            m,
            root,
            k.leather,
            v3(s * 0.026 * S * HEX_R, bit_y, bit_z),
            v3(
                s * 0.030 * S * HEX_R,
                head_p.y + 0.034 * S * HEX_R,
                head_p.z - 0.004 * S * HEX_R,
            ),
            0.010 * S * HEX_R,
            0.010 * S * HEX_R,
        );
    }
    (bit_y, bit_z)
}

/// `ACRiderAnchors` (`:830-839`).
#[derive(Debug, Clone, Copy)]
struct Anchors {
    shld_l: Vec3,
    shld_r: Vec3,
    torso_ctr: Vec3,
    head_ctr: Vec3,
}

/// `acBuildRiderCore` (`:846-918`).
#[allow(clippy::too_many_lines)]
fn ac_build_rider_core(m: &mut UnitModel, root: NodeId, k: &AcMats) -> Anchors {
    let sz = AC_SEAT_Z * AC_S;
    let back_y = AC_BACK_Y * AC_S;

    m.add_mesh(root, g_torso(), k.scale).rot_x(-0.06).set_pos(
        0.0,
        (back_y + AC_TORSO_H * 0.5) * HEX_R,
        sz * HEX_R,
    );
    m.add_mesh(root, g_chest_r(), k.scale)
        .set_pos(0.0, (AC_TORSO_TOP - 0.028) * HEX_R, sz * HEX_R);
    for i in 0..3_u32 {
        m.add_mesh(root, g_scale_row(), k.scale_dk).set_pos(
            0.0,
            (AC_TORSO_TOP - 0.040 - f64::from(i) * 0.042) * HEX_R,
            sz * HEX_R,
        );
    }
    m.add_mesh(root, g_sash(), k.owner)
        .set_pos(0.0, (back_y + 0.056) * HEX_R, sz * HEX_R);

    m.add_mesh(root, g_neck_r(), k.skin).set_pos(
        0.0,
        (AC_TORSO_TOP + AC_NECK_H * 0.5) * HEX_R,
        sz * HEX_R,
    );
    m.add_mesh(root, g_head(), k.skin)
        .set_pos(0.0, AC_HEAD_CTR * HEX_R, sz * HEX_R)
        .set_name("ac-rider-head");
    m.add_mesh(root, g_jaw(), k.skin_dk).set_pos(
        0.0,
        (AC_HEAD_CTR - AC_HEAD_S * 0.38) * HEX_R,
        (sz + 0.010) * HEX_R,
    );
    m.add_mesh(root, g_beard(), k.hair).set_pos(
        0.0,
        (AC_HEAD_CTR - 0.072) * HEX_R,
        (sz + AC_HEAD_S * 0.5 - 0.006) * HEX_R,
    );
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(root, g_ear_r(), k.skin_dk).set_pos(
            s * (AC_HEAD_S * 0.5 + 0.004) * HEX_R,
            (AC_HEAD_CTR - 0.006) * HEX_R,
            sz * HEX_R,
        );
    }
    m.add_mesh(root, g_helm(), k.iron)
        .set_scale(1.05, 1.15, 1.05)
        .set_pos(0.0, (AC_HEAD_CTR + 0.050) * HEX_R, sz * HEX_R);
    m.add_mesh(root, g_crest(), k.iron_lt).rot_x(-0.10).set_pos(
        0.0,
        (AC_HEAD_TOP + 0.050) * HEX_R,
        (sz - 0.006) * HEX_R,
    );

    for s in [-1.0_f64, 1.0] {
        let mut p = v3(s * AC_HIP_X * HEX_R, back_y * HEX_R, sz * HEX_R);
        p = seg_down(
            m,
            root,
            g_thigh(),
            k.skin,
            p,
            0.45,
            AC_THIGH_L * HEX_R,
            None,
        );
        p.x += s * 0.006 * HEX_R;
        p.y += 0.008 * HEX_R;
        p = seg_down(m, root, g_shin(), k.boot, p, 0.05, AC_SHIN_L * HEX_R, None);
        m.add_mesh(root, g_boot_cuff(), k.boot).set_pos(
            p.x,
            p.y + 0.018 * HEX_R,
            p.z + 0.008 * HEX_R,
        );
        m.add_mesh(root, g_sole(), k.boot)
            .set_pos(p.x, p.y - 0.006 * HEX_R, p.z + 0.014 * HEX_R);
    }

    Anchors {
        shld_l: v3(AC_SHLD_X * HEX_R, AC_SHLD_Y * HEX_R, sz * HEX_R),
        shld_r: v3(-AC_SHLD_X * HEX_R, AC_SHLD_Y * HEX_R, sz * HEX_R),
        torso_ctr: v3(0.0, (back_y + AC_TORSO_H * 0.5) * HEX_R, sz * HEX_R),
        head_ctr: v3(0.0, AC_HEAD_CTR * HEX_R, sz * HEX_R),
    }
}

/// `buildZelazoKonnicaLancowaAsyryjska(ownerColor)`
/// (`zelazo-konnica-asyryjska-opus5.ts:924-1003`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_zelazo_konnica_lancowa_asyryjska(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let root = m.add_group(ROOT);
    m.node(root).rot_y(AC_YAW);

    let k = ac_make_materials(&mut m, owner);
    let (bit_y, bit_z) = ac_build_mount(&mut m, root, &k);
    let anc = ac_build_rider_core(&mut m, root, &k);

    let mut la = anc.shld_l;
    la = seg_down(
        &mut m,
        root,
        g_up_arm(),
        k.skin,
        la,
        0.50,
        AC_UPARM_L * HEX_R,
        None,
    );
    la.y += 0.007 * HEX_R;
    let wrist_l = seg_down(
        &mut m,
        root,
        g_forearm(),
        k.skin,
        la,
        1.05,
        AC_FOREARM_L * HEX_R,
        None,
    );
    m.add_mesh(root, g_fist(), k.skin)
        .rot_x(PI - 1.05)
        .set_pos_v(add_scaled(wrist_l, dir_down(1.05), 0.010 * HEX_R));
    let m_shield = m.mat(AC_SHIELD_FACE, 0.05, 0.85);
    let shield = m.add_mesh_id(root, g_shield(), m_shield);
    m.node(shield)
        .set_name("ac-lancowa-shield")
        .rot_z(PI / 2.0)
        .rot_y(0.30)
        .set_pos_v(wrist_l.plus(v3(0.028 * HEX_R, 0.006 * HEX_R, -0.010 * HEX_R)));
    let shield_q = m.nodes[shield].quaternion;
    let shield_pos = m.nodes[shield].position;
    let shield_axis = apply_quat(v3(0.0, 1.0, 0.0), shield_q);
    let m_rim = m.mat(AC_SHIELD_RIM, 0.5, 0.4);
    let rim = m.add_mesh_id(root, g_rim(), m_rim);
    m.node(rim).quaternion = shield_q;
    rotate_on_axis(&mut m, rim, v3(1.0, 0.0, 0.0), PI / 2.0);
    m.node(rim)
        .set_pos_v(shield_pos)
        .set_name("ac-lancowa-shield-rim");
    m.add_mesh(root, g_boss(), k.bronze).set_pos_v(add_scaled(
        shield_pos,
        shield_axis,
        0.008 * HEX_R,
    ));

    let grip = AC_LANCE_GRIP.scale(HEX_R);
    ik_arm(
        &mut m,
        root,
        &arm_kit(),
        anc.shld_r,
        grip,
        v3(-0.60, -0.75, 0.10),
        k.skin,
        Some(k.skin),
        None,
    );
    let d_lance = up_dir(AC_LANCE_TILT);
    let at_s = |t: f64| add_scaled(grip, d_lance, t * HEX_R);
    let shaft_mid = (AC_LANCE_FRONT - AC_LANCE_BACK) * 0.5;
    along(
        &mut m,
        root,
        g_shaft(),
        k.wood,
        at_s(shaft_mid),
        d_lance,
        Some("ac-lancowa-lance-shaft"),
    );
    along(&mut m, root, g_grip(), k.leath_dk, at_s(0.0), d_lance, None);
    along(
        &mut m,
        root,
        g_socket(),
        k.iron,
        at_s(AC_LANCE_FRONT - 0.010),
        d_lance,
        None,
    );
    along(
        &mut m,
        root,
        g_bind(),
        k.leath_dk,
        at_s(AC_LANCE_FRONT - 0.028),
        d_lance,
        None,
    );
    along(
        &mut m,
        root,
        g_bind(),
        k.leath_dk,
        at_s(AC_LANCE_FRONT + 0.008),
        d_lance,
        None,
    );
    along(
        &mut m,
        root,
        g_lance_hd(),
        k.iron_lt,
        at_s(AC_LANCE_FRONT),
        d_lance,
        Some("ac-lancowa-lance-head"),
    );
    let butt = along(
        &mut m,
        root,
        g_butt(),
        k.iron,
        at_s(-AC_LANCE_BACK),
        d_lance,
        Some("ac-lancowa-lance-butt"),
    );
    rotate_on_axis(&mut m, butt, v3(1.0, 0.0, 0.0), PI);

    ac_strap(
        &mut m,
        root,
        k.leath_dk,
        v3(0.026 * AC_S * HEX_R, bit_y, bit_z),
        v3(
            wrist_l.x - 0.006 * HEX_R,
            wrist_l.y + 0.006 * HEX_R,
            wrist_l.z,
        ),
        0.007 * HEX_R,
        0.007 * HEX_R,
    );
    m
}

/// `buildZelazoKonnicaLuczniczaAsyryjska(ownerColor)`
/// (`zelazo-konnica-asyryjska-opus5.ts:1009-1124`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_zelazo_konnica_lucznicza_asyryjska(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let root = m.add_group(ROOT);
    m.node(root).rot_y(AC_YAW);

    let k = ac_make_materials(&mut m, owner);
    let (bit_y, bit_z) = ac_build_mount(&mut m, root, &k);
    let anc = ac_build_rider_core(&mut m, root, &k);

    let grip_t = anc
        .shld_l
        .plus(v3(0.060 * HEX_R, 0.058 * HEX_R, 0.150 * HEX_R));
    let nock_t = anc.head_ctr.plus(v3(
        -(AC_HEAD_S * 0.5 + 0.028) * HEX_R,
        -0.018 * HEX_R,
        -0.012 * HEX_R,
    ));
    let arm_l = ik_arm(
        &mut m,
        root,
        &arm_kit(),
        anc.shld_l,
        grip_t,
        v3(0.55, -0.70, 0.20),
        k.skin,
        Some(k.skin),
        Some("ac-lucznicza-bowarm"),
    );
    let arm_r = ik_arm(
        &mut m,
        root,
        &arm_kit(),
        anc.shld_r,
        nock_t,
        v3(-0.55, 0.85, -0.25),
        k.skin,
        Some(k.skin),
        Some("ac-lucznicza-draw"),
    );

    let g = arm_l.hand;
    let n = arm_r.hand;
    let dir_a = g.minus(n).normalize();
    let yaw = js_atan2(dir_a.x, dir_a.z);
    let bow = m.detached_group();
    m.node(bow)
        .set_name("ac-lucznicza-bow")
        .set_pos_v(g)
        .rot_y(yaw);
    rotate_on_axis(&mut m, bow, v3(0.0, 0.0, 1.0), AC_BOW_CANT);
    m.add_mesh(bow, g_bow_mid(), k.wood_bow)
        .set_name("ac-lucznicza-bow");
    for sg in [1.0_f64, -1.0] {
        m.add_mesh(bow, g_bow_limb(), k.wood_bow)
            .rot_x(-sg * 0.52)
            .set_name("ac-lucznicza-bow")
            .set_pos(
                0.0,
                sg * 0.128 * AC_BOW_S * HEX_R,
                -0.016 * AC_BOW_S * HEX_R,
            );
        m.add_mesh(bow, g_bow_siyah(), k.bronze_lt)
            .rot_x(-sg * 1.12)
            .set_name("ac-lucznicza-bow")
            .set_pos(
                0.0,
                sg * 0.236 * AC_BOW_S * HEX_R,
                -0.084 * AC_BOW_S * HEX_R,
            );
    }
    m.attach(root, bow);
    let bow_matrix = m.local_matrix(bow);
    let tip_local = (0.236 + 0.034) * AC_BOW_S * HEX_R;
    let tip_local_z = -0.100 * AC_BOW_S * HEX_R;
    let tip_top = v3(0.0, tip_local, tip_local_z).apply_mat4(&bow_matrix);
    let tip_bot = v3(0.0, -tip_local, tip_local_z).apply_mat4(&bow_matrix);
    ac_strap(
        &mut m,
        root,
        k.string,
        tip_top,
        n,
        0.008 * HEX_R,
        0.008 * HEX_R,
    );
    ac_strap(
        &mut m,
        root,
        k.string,
        tip_bot,
        n,
        0.008 * HEX_R,
        0.008 * HEX_R,
    );
    let tip_p = add_scaled(g, dir_a, 0.065 * HEX_R);
    ac_strap(&mut m, root, k.wood, n, tip_p, 0.012 * HEX_R, 0.012 * HEX_R);
    let tip = m.add_mesh_id(root, g_arrow_tip(), k.iron_lt);
    m.node(tip)
        .set_name("ac-lucznicza-arrow-tip")
        .quat_from_unit_vectors(v3(0.0, 1.0, 0.0), dir_a)
        .set_pos_v(add_scaled(tip_p, dir_a, 0.018 * HEX_R));
    m.add_mesh(root, g_fletch(), k.owner)
        .quat_from_unit_vectors(v3(0.0, 1.0, 0.0), dir_a)
        .set_pos_v(add_scaled(n, dir_a, 0.030 * HEX_R));

    let rein_end = arm_l.elbow.lerp(arm_l.hand, 0.45);
    ac_strap(
        &mut m,
        root,
        k.leath_dk,
        v3(0.026 * AC_S * HEX_R, bit_y, bit_z),
        rein_end,
        0.006 * HEX_R,
        0.006 * HEX_R,
    );
    ac_strap(
        &mut m,
        root,
        k.leath_dk,
        rein_end.plus(v3(0.010 * HEX_R, 0.010 * HEX_R, 0.0)),
        rein_end.plus(v3(-0.008 * HEX_R, -0.014 * HEX_R, -0.008 * HEX_R)),
        0.006 * HEX_R,
        0.006 * HEX_R,
    );

    let q = m.add_mesh_id(root, g_quiver(), k.leather);
    m.node(q)
        .set_name("ac-lucznicza-quiver")
        .rot_x(-0.22)
        .rot_z(0.20)
        .set_pos(
            -0.056 * HEX_R,
            anc.torso_ctr.y + 0.054 * HEX_R,
            anc.torso_ctr.z - (AC_TORSO_D * 0.5 + 0.032) * HEX_R,
        );
    let qp = m.nodes[q].position;
    for (dx, dy) in [(-0.020_f64, 0.0_f64), (0.006, 0.012)] {
        m.add_mesh(root, g_q_arrow(), k.wood)
            .rot_x(-0.22)
            .rot_z(0.20)
            .set_pos(
                qp.x + dx * HEX_R,
                qp.y + (0.128 + dy) * HEX_R,
                qp.z - 0.018 * HEX_R,
            );
        m.add_mesh(root, g_fletch(), k.owner)
            .rot_x(-0.22)
            .rot_z(0.20)
            .set_scale(1.0, 0.62, 0.62)
            .set_pos(
                qp.x + dx * HEX_R - 0.010 * HEX_R,
                qp.y + (0.162 + dy) * HEX_R,
                qp.z - 0.028 * HEX_R,
            );
    }
    m
}
