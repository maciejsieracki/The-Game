//! Port of `render/braz-konnica-opus5.ts` (`edb8fb56`):
//! `buildKonnicaBrazOpus5` (Konnica / Horseman, Bronze).
//!
//! The lazily created `getKN*` singletons have fixed arguments, so each maps
//! to one geometry value. The whole figure hangs on a pivot group rotated by
//! `KN_YAW` (3/4 view).

use super::geo::BladeProfile;
use super::kit::{
    add_scaled, blade, bx, cn, cy, cy_open, ico, quat_units_synced, rotate_on_axis, seg, sph,
    torus, v3, Y_UP,
};
use crate::geom::Vec3;
use crate::jsmath::{js_cos, js_sin};
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use crate::pick::three::js_max;
use std::f64::consts::PI;

// ── paleta (`braz-konnica-opus5.ts:166-188`)
const KN_COAT: u32 = 0xb08a52;
const KN_COAT_DK: u32 = 0x6d4c26;
const KN_MANE: u32 = 0x3a2917;
const KN_HOOF: u32 = 0x3a2c1c;
const KN_SKIN: u32 = 0xdba876;
const KN_SKIN_DK: u32 = 0xb9855a;
const KN_WOOL: u32 = 0xc2a066;
const KN_WOOL_DK: u32 = 0x977a48;
const KN_LEATHER: u32 = 0x6b4a28;
const KN_LEATHER_DK: u32 = 0x4a331b;
const KN_FELT: u32 = 0xa07c4e;
const KN_WOOD: u32 = 0x7a5c3a;
const KN_BRONZE: u32 = 0xcf9234;
const KN_BRONZE_LT: u32 = 0xdaa84e;
const KN_HAIR: u32 = 0x2a1c10;
const KN_EYE: u32 = 0x14100c;

// ── skala (`:202-237`, unitless ×HEX_R)
const KN_BODY_CTR: f64 = 0.332;
const KN_BACK_Y: f64 = 0.440;
const KN_LEG_TOP_F: f64 = 0.2595;
const KN_LEG_TOP_R: f64 = 0.2607;
const KN_SEAT_Z: f64 = 0.010;
const KN_TORSO_W: f64 = 0.140;
const KN_TORSO_H: f64 = 0.150;
const KN_TORSO_D: f64 = 0.084;
const KN_TORSO_TOP: f64 = KN_BACK_Y + KN_TORSO_H;
const KN_NECK_H: f64 = 0.021;
const KN_HEAD_S: f64 = 0.100;
const KN_HEAD_CTR: f64 = KN_TORSO_TOP + KN_NECK_H + KN_HEAD_S * 0.5;
const KN_SHLD_X: f64 = KN_TORSO_W * 0.5 + 0.012;
const KN_SHLD_Y: f64 = KN_TORSO_TOP - 0.019;
const KN_HIP_X: f64 = 0.104;
const KN_UPARM_L: f64 = 0.078;
const KN_FOREARM_L: f64 = 0.072;
const KN_THIGH_L: f64 = 0.130;
const KN_SHIN_L: f64 = 0.130;
const KN_YAW: f64 = 1.02;
const KN_CAP_R: f64 = 0.068;

// ── nogi konia (`:500-506`)
const KN_LEG_UP_F: f64 = 0.118;
const KN_LEG_LO_F: f64 = 0.118;
const KN_LEG_UP_R: f64 = 0.124;
const KN_LEG_LO_R: f64 = 0.118;
const KN_LEG_JOINT_OVERLAP: f64 = 0.008;
const KN_HOOF_H: f64 = 0.032;

// ── geometrie-singletony (`:308-384`, `:413-415`)
fn g_barrel() -> Geo {
    cy(0.108 * HEX_R, 0.100 * HEX_R, 0.256 * HEX_R, 7)
}
fn g_chest() -> Geo {
    ico(0.094 * HEX_R, 0)
}
fn g_rump() -> Geo {
    ico(0.096 * HEX_R, 0)
}
fn g_withers() -> Geo {
    bx(0.066 * HEX_R, 0.056 * HEX_R, 0.110 * HEX_R)
}
fn g_stripe() -> Geo {
    bx(0.022 * HEX_R, 0.012 * HEX_R, 0.150 * HEX_R)
}
fn g_neck1() -> Geo {
    cy_open(0.052 * HEX_R, 0.064 * HEX_R, 0.082 * HEX_R, 6)
}
fn g_neck2() -> Geo {
    cy_open(0.043 * HEX_R, 0.052 * HEX_R, 0.072 * HEX_R, 6)
}
fn g_neck3() -> Geo {
    cy_open(0.036 * HEX_R, 0.043 * HEX_R, 0.058 * HEX_R, 6)
}
fn g_skull() -> Geo {
    bx(0.066 * HEX_R, 0.080 * HEX_R, 0.096 * HEX_R)
}
fn g_muzzle() -> Geo {
    cy(0.023 * HEX_R, 0.032 * HEX_R, 0.082 * HEX_R, 5)
}
fn g_nostril() -> Geo {
    bx(0.010 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)
}
fn g_ear() -> Geo {
    cn(0.015 * HEX_R, 0.042 * HEX_R, 4)
}
fn g_eye() -> Geo {
    bx(0.008 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)
}
fn g_mane_tuft() -> Geo {
    bx(0.018 * HEX_R, 0.034 * HEX_R, 0.026 * HEX_R)
}
fn g_forelock() -> Geo {
    bx(0.020 * HEX_R, 0.042 * HEX_R, 0.022 * HEX_R)
}
fn g_up_frnt() -> Geo {
    bx(0.044 * HEX_R, 0.118 * HEX_R, 0.056 * HEX_R)
}
fn g_up_rear() -> Geo {
    bx(0.050 * HEX_R, 0.124 * HEX_R, 0.064 * HEX_R)
}
fn g_lower() -> Geo {
    bx(0.028 * HEX_R, 0.118 * HEX_R, 0.032 * HEX_R)
}
fn g_pastern() -> Geo {
    bx(0.028 * HEX_R, 0.038 * HEX_R, 0.032 * HEX_R)
}
fn g_hoof() -> Geo {
    bx(0.034 * HEX_R, 0.032 * HEX_R, 0.040 * HEX_R)
}
fn g_tail1() -> Geo {
    cy(0.016 * HEX_R, 0.020 * HEX_R, 0.052 * HEX_R, 4)
}
fn g_tail2() -> Geo {
    cy(0.008 * HEX_R, 0.017 * HEX_R, 0.128 * HEX_R, 4)
}
fn g_pad_top() -> Geo {
    bx(0.150 * HEX_R, 0.020 * HEX_R, 0.238 * HEX_R)
}
fn g_pad_flap() -> Geo {
    bx(0.015 * HEX_R, 0.096 * HEX_R, 0.212 * HEX_R)
}
fn g_pad_hem() -> Geo {
    bx(0.018 * HEX_R, 0.014 * HEX_R, 0.216 * HEX_R)
}
fn g_girth() -> Geo {
    cy_open(0.114 * HEX_R, 0.114 * HEX_R, 0.022 * HEX_R, 7)
}
fn g_breast() -> Geo {
    bx(0.136 * HEX_R, 0.018 * HEX_R, 0.020 * HEX_R)
}
fn g_nose_band() -> Geo {
    bx(0.044 * HEX_R, 0.012 * HEX_R, 0.036 * HEX_R)
}
fn g_brow_band() -> Geo {
    bx(0.066 * HEX_R, 0.011 * HEX_R, 0.018 * HEX_R)
}
fn g_bit() -> Geo {
    bx(0.052 * HEX_R, 0.009 * HEX_R, 0.009 * HEX_R)
}
fn g_bit_ring() -> Geo {
    torus(0.014 * HEX_R, 0.004 * HEX_R, 4, 8)
}
fn g_torso() -> Geo {
    bx(KN_TORSO_W * HEX_R, KN_TORSO_H * HEX_R, KN_TORSO_D * HEX_R)
}
fn g_chest_r() -> Geo {
    bx(
        KN_TORSO_W * 1.05 * HEX_R,
        0.064 * HEX_R,
        KN_TORSO_D * 1.06 * HEX_R,
    )
}
fn g_neck_r() -> Geo {
    bx(0.040 * HEX_R, KN_NECK_H * 1.6 * HEX_R, 0.040 * HEX_R)
}
fn g_head() -> Geo {
    bx(KN_HEAD_S * HEX_R, KN_HEAD_S * HEX_R, KN_HEAD_S * HEX_R)
}
fn g_jaw() -> Geo {
    bx(0.068 * HEX_R, 0.027 * HEX_R, 0.031 * HEX_R)
}
fn g_nose() -> Geo {
    bx(0.015 * HEX_R, 0.020 * HEX_R, 0.013 * HEX_R)
}
fn g_brow() -> Geo {
    bx(0.080 * HEX_R, 0.010 * HEX_R, 0.012 * HEX_R)
}
fn g_ear_r() -> Geo {
    bx(0.009 * HEX_R, 0.026 * HEX_R, 0.017 * HEX_R)
}
fn g_eye_r() -> Geo {
    bx(0.015 * HEX_R, 0.009 * HEX_R, 0.007 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.042 * HEX_R, KN_UPARM_L * HEX_R, 0.042 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.032 * HEX_R, KN_FOREARM_L * HEX_R, 0.032 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.037 * HEX_R, 0.037 * HEX_R, 0.039 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.044 * HEX_R, KN_THIGH_L * HEX_R, 0.050 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.031 * HEX_R, KN_SHIN_L * HEX_R, 0.035 * HEX_R)
}
fn g_sole() -> Geo {
    bx(0.036 * HEX_R, 0.012 * HEX_R, 0.066 * HEX_R)
}
fn g_toes() -> Geo {
    bx(0.032 * HEX_R, 0.012 * HEX_R, 0.017 * HEX_R)
}
fn g_ank_strap() -> Geo {
    bx(0.039 * HEX_R, 0.009 * HEX_R, 0.012 * HEX_R)
}
fn g_tunic_hem() -> Geo {
    bx(0.188 * HEX_R, 0.044 * HEX_R, 0.100 * HEX_R)
}
fn g_fold() -> Geo {
    bx(0.019 * HEX_R, 0.038 * HEX_R, 0.009 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.147 * HEX_R, 0.021 * HEX_R, 0.091 * HEX_R)
}
fn g_buckle() -> Geo {
    bx(0.024 * HEX_R, 0.019 * HEX_R, 0.012 * HEX_R)
}
fn g_sheath() -> Geo {
    bx(0.017 * HEX_R, 0.054 * HEX_R, 0.012 * HEX_R)
}
fn g_hilt() -> Geo {
    bx(0.019 * HEX_R, 0.019 * HEX_R, 0.012 * HEX_R)
}
fn g_cap_dome() -> Geo {
    sph(KN_CAP_R * HEX_R, 10, 6, 0.0, PI * 2.0, 0.0, PI / 2.0)
}
fn g_cap_band() -> Geo {
    cy(0.075 * HEX_R, 0.078 * HEX_R, 0.017 * HEX_R, 10)
}
fn g_nape() -> Geo {
    bx(0.076 * HEX_R, 0.036 * HEX_R, 0.015 * HEX_R)
}
fn g_shaft() -> Geo {
    cy(0.010 * HEX_R, 0.012 * HEX_R, 0.440 * HEX_R, 7)
}
fn g_socket() -> Geo {
    cy(0.014 * HEX_R, 0.017 * HEX_R, 0.034 * HEX_R, 7)
}
fn g_bind() -> Geo {
    bx(0.017 * HEX_R, 0.014 * HEX_R, 0.017 * HEX_R)
}
fn g_grip() -> Geo {
    bx(0.015 * HEX_R, 0.044 * HEX_R, 0.015 * HEX_R)
}
fn g_butt() -> Geo {
    cn(0.012 * HEX_R, 0.038 * HEX_R, 5)
}
fn g_unit() -> Geo {
    bx(1.0, 1.0, 1.0)
}
fn g_spear_hd() -> Geo {
    blade(
        BladeProfile::LeafHead,
        0.088 * HEX_R,
        0.033 * HEX_R,
        0.013 * HEX_R,
    )
}

/// `knDown(theta)` (`:425-427`).
fn kn_down(theta: f64) -> Vec3 {
    v3(0.0, -js_cos(theta), js_sin(theta))
}

/// `knUpDir(phi)` (`:428-430`).
fn kn_up_dir(phi: f64) -> Vec3 {
    v3(0.0, js_cos(phi), js_sin(phi))
}

/// `knSegUp(parent, geo, mtl, P, phi, len, spin)` (`:447-459`).
#[allow(clippy::too_many_arguments)]
fn kn_seg_up(
    m: &mut UnitModel,
    parent: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    phi: f64,
    len: f64,
    spin: f64,
) -> Vec3 {
    let dir = kn_up_dir(phi);
    let n = m.add_mesh(parent, geo, mtl);
    n.rot_x(phi);
    if spin != 0.0 {
        n.rot_y(spin);
    }
    n.set_pos_v(p.plus(dir.scale(len * 0.5)));
    p.plus(dir.scale(len))
}

/// `knAlong(parent, geo, mtl, P, D)` (`:462-472`): orientation with
/// `D.clone().normalize()`; the quaternion path re-derives `rotation`.
fn kn_along(m: &mut UnitModel, parent: NodeId, geo: Geo, mtl: MatId, p: Vec3, d: Vec3) -> NodeId {
    let id = m.add_mesh_id(parent, geo, mtl);
    if d.y < -0.9999 {
        m.node(id).rot_x(PI);
    } else {
        quat_units_synced(m, id, Y_UP, d.normalize());
    }
    m.node(id).set_pos_v(p);
    id
}

/// `knStrap(parent, mtl, A, B, w, t)` (`:479-493`).
#[allow(clippy::too_many_arguments)]
fn kn_strap(m: &mut UnitModel, parent: NodeId, mtl: MatId, a: Vec3, b: Vec3, w: f64, t: f64) {
    let d = b.minus(a);
    let len = d.length();
    let id = m.add_mesh_id(parent, g_unit(), mtl);
    m.node(id).set_scale(w, js_max(len, 1e-5), t);
    if len > 1e-6 {
        if d.y / len < -0.9999 {
            m.node(id).rot_x(PI);
        } else {
            m.node(id).quat_from_unit_vectors(Y_UP, d.normalize());
        }
    }
    m.node(id).set_pos_v(add_scaled(a, d, 0.5));
}

/// `knHorseLeg` (`:508-528`).
#[allow(clippy::too_many_arguments)]
fn kn_horse_leg(
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
    let lu = (if rear { KN_LEG_UP_R } else { KN_LEG_UP_F }) * HEX_R;
    let ll = (if rear { KN_LEG_LO_R } else { KN_LEG_LO_F }) * HEX_R;
    let mut p = v3(sx * HEX_R, y_piv * HEX_R, z_piv * HEX_R);
    p = seg(
        m,
        parent,
        if rear { g_up_rear() } else { g_up_frnt() },
        m_coat,
        p,
        th_u,
        lu,
    );
    p.y += KN_LEG_JOINT_OVERLAP * HEX_R;
    p = seg(m, parent, g_lower(), m_coat, p, th_l, ll);
    m.add_mesh(parent, g_pastern(), m_dark)
        .set_pos_v(add_scaled(p, kn_down(th_l), 0.004 * HEX_R));
    m.add_mesh(parent, g_hoof(), m_hoof).set_pos(
        p.x,
        p.y - KN_HOOF_H * 0.5 * HEX_R,
        p.z + 0.004 * HEX_R,
    );
}

/// `buildKonnicaBrazOpus5(ownerColor)` (`braz-konnica-opus5.ts:533-878`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_konnica_braz_opus5(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let root = m.add_group(ROOT);
    m.node(root).rot_y(KN_YAW);

    let m_coat = m.mat(KN_COAT, 0.04, 0.86);
    let m_coat_dk = m.mat(KN_COAT_DK, 0.04, 0.88);
    let m_mane = m.mat(KN_MANE, 0.04, 0.90);
    let m_hoof = m.mat(KN_HOOF, 0.08, 0.72);
    let m_skin = m.mat(KN_SKIN, 0.05, 0.80);
    let m_skin_dk = m.mat(KN_SKIN_DK, 0.05, 0.82);
    let m_wool = m.mat(KN_WOOL, 0.03, 0.88);
    let m_wool_dk = m.mat(KN_WOOL_DK, 0.03, 0.90);
    let m_leather = m.mat(KN_LEATHER, 0.05, 0.85);
    let m_leath_dk = m.mat(KN_LEATHER_DK, 0.05, 0.88);
    let m_felt = m.mat(KN_FELT, 0.04, 0.88);
    let m_wood = m.mat(KN_WOOD, 0.05, 0.84);
    let m_bronze = m.mat(KN_BRONZE, 0.50, 0.42);
    let m_bronze_lt = m.mat(KN_BRONZE_LT, 0.55, 0.36);
    let m_hair = m.mat(KN_HAIR, 0.04, 0.90);
    let m_eye = m.mat(KN_EYE, 0.05, 0.86);
    let m_owner = m.mat(owner, 0.10, 0.70);

    // KOŃ — tułów
    m.add_mesh(root, g_barrel(), m_coat)
        .rot_x(PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.72, 1.0, 1.0)
        .set_pos(0.0, KN_BODY_CTR * HEX_R, 0.004 * HEX_R);
    m.add_mesh(root, g_chest(), m_coat)
        .set_scale(0.80, 1.00, 0.95)
        .set_pos(0.0, (KN_BODY_CTR + 0.006) * HEX_R, 0.140 * HEX_R);
    m.add_mesh(root, g_rump(), m_coat)
        .set_scale(0.88, 1.00, 1.10)
        .set_pos(0.0, (KN_BODY_CTR - 0.002) * HEX_R, -0.144 * HEX_R);
    m.add_mesh(root, g_withers(), m_coat)
        .rot_x(0.20)
        .set_pos(0.0, 0.408 * HEX_R, 0.104 * HEX_R);
    m.add_mesh(root, g_stripe(), m_coat_dk)
        .set_pos(0.0, 0.436 * HEX_R, -0.140 * HEX_R);

    // SZYJA
    let neck_phi = [0.92, 0.66, 0.42];
    let neck_len = [0.082 * HEX_R, 0.072 * HEX_R, 0.058 * HEX_R];
    let neck_geo = [g_neck1(), g_neck2(), g_neck3()];
    let mut np = v3(0.0, 0.386 * HEX_R, 0.136 * HEX_R);
    let mut neck_pts = vec![np];
    for i in 0..3 {
        np = kn_seg_up(
            &mut m,
            root,
            neck_geo[i],
            m_coat,
            np,
            neck_phi[i],
            neck_len[i],
            PI / 6.0,
        );
        neck_pts.push(np);
    }

    // ŁEB
    let head_p = v3(0.0, np.y + 0.013 * HEX_R, np.z + 0.021 * HEX_R);
    m.add_mesh(root, g_skull(), m_coat)
        .rot_x(0.22)
        .set_pos_v(head_p);
    let muz_dir = v3(0.0, -0.31, 0.951);
    let muz_base = head_p.plus(v3(0.0, -0.018 * HEX_R, 0.030 * HEX_R));
    let muzzle = kn_along(
        &mut m,
        root,
        g_muzzle(),
        m_coat,
        add_scaled(muz_base, muz_dir, 0.041 * HEX_R),
        muz_dir,
    );
    m.node(muzzle).rot_y(PI / 4.0);
    let muz_end = add_scaled(muz_base, muz_dir, 0.082 * HEX_R);
    for s in [-1.0, 1.0] {
        m.add_mesh(root, g_nostril(), m_coat_dk).set_pos(
            s * 0.013 * HEX_R,
            muz_end.y + 0.009 * HEX_R,
            muz_end.z - 0.008 * HEX_R,
        );
        m.add_mesh(root, g_eye(), m_eye).set_pos(
            s * 0.034 * HEX_R,
            head_p.y + 0.018 * HEX_R,
            head_p.z + 0.014 * HEX_R,
        );
        m.add_mesh(root, g_ear(), m_coat)
            .set_pos(
                s * 0.021 * HEX_R,
                head_p.y + 0.054 * HEX_R,
                head_p.z - 0.012 * HEX_R,
            )
            .rot_z(-s * 0.28)
            .rot_x(0.16);
    }

    // GRZYWA
    let mane_rad = [0.056 * HEX_R, 0.047 * HEX_R, 0.040 * HEX_R];
    for i in 0..3 {
        let phi = neck_phi[i];
        let crest = v3(0.0, js_sin(phi), -js_cos(phi));
        let mid = neck_pts[i].plus(neck_pts[i + 1]).scale(0.5);
        for f in [-0.28, 0.28] {
            let along = kn_up_dir(phi).scale(neck_len[i] * f);
            m.add_mesh(root, g_mane_tuft(), m_mane)
                .rot_x(phi)
                .set_pos_v(add_scaled(mid.plus(along), crest, mane_rad[i]));
        }
    }
    m.add_mesh(root, g_forelock(), m_mane).rot_x(0.62).set_pos(
        0.0,
        head_p.y + 0.040 * HEX_R,
        head_p.z + 0.028 * HEX_R,
    );

    // NOGI
    let lx = 0.058;
    kn_horse_leg(
        &mut m,
        root,
        m_coat,
        m_coat_dk,
        m_hoof,
        lx,
        0.122,
        KN_LEG_TOP_F,
        0.08,
        -0.05,
        false,
    );
    kn_horse_leg(
        &mut m,
        root,
        m_coat,
        m_coat_dk,
        m_hoof,
        -lx,
        0.126,
        KN_LEG_TOP_F,
        0.42,
        0.30,
        false,
    );
    kn_horse_leg(
        &mut m,
        root,
        m_coat,
        m_coat_dk,
        m_hoof,
        -lx,
        -0.130,
        KN_LEG_TOP_R,
        -0.26,
        0.14,
        true,
    );
    kn_horse_leg(
        &mut m,
        root,
        m_coat,
        m_coat_dk,
        m_hoof,
        lx,
        -0.134,
        KN_LEG_TOP_R,
        -0.28,
        0.16,
        true,
    );

    // OGON
    let mut tp = v3(0.0, 0.392 * HEX_R, -0.196 * HEX_R);
    tp = kn_seg_up(
        &mut m,
        root,
        g_tail1(),
        m_mane,
        tp,
        -1.20,
        0.052 * HEX_R,
        0.0,
    );
    kn_seg_up(
        &mut m,
        root,
        g_tail2(),
        m_mane,
        tp,
        -2.98,
        0.124 * HEX_R,
        0.0,
    );

    // OPORZĄDZENIE
    m.add_mesh(root, g_pad_top(), m_owner)
        .set_pos(0.0, 0.436 * HEX_R, (KN_SEAT_Z - 0.018) * HEX_R);
    for s in [-1.0, 1.0] {
        m.add_mesh(root, g_pad_flap(), m_owner)
            .rot_z(-s * 0.10)
            .set_pos(
                s * 0.081 * HEX_R,
                0.378 * HEX_R,
                (KN_SEAT_Z - 0.012) * HEX_R,
            );
        m.add_mesh(root, g_pad_hem(), m_leath_dk).set_pos(
            s * 0.086 * HEX_R,
            0.328 * HEX_R,
            (KN_SEAT_Z - 0.012) * HEX_R,
        );
    }
    m.add_mesh(root, g_girth(), m_leather)
        .rot_x(PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.72, 1.0, 1.0)
        .set_pos(0.0, KN_BODY_CTR * HEX_R, (KN_SEAT_Z + 0.006) * HEX_R);
    m.add_mesh(root, g_breast(), m_leather)
        .set_pos(0.0, 0.358 * HEX_R, 0.208 * HEX_R);
    for s in [-1.0, 1.0] {
        kn_strap(
            &mut m,
            root,
            m_leather,
            v3(s * 0.050 * HEX_R, 0.432 * HEX_R, -0.092 * HEX_R),
            v3(s * 0.020 * HEX_R, 0.394 * HEX_R, -0.190 * HEX_R),
            0.011 * HEX_R,
            0.011 * HEX_R,
        );
    }

    // UZDA + WĘDZIDŁO
    m.add_mesh(root, g_nose_band(), m_leather)
        .rot_x(-0.31)
        .set_pos(0.0, muz_end.y + 0.022 * HEX_R, muz_end.z - 0.030 * HEX_R);
    m.add_mesh(root, g_brow_band(), m_leather).set_pos(
        0.0,
        head_p.y + 0.032 * HEX_R,
        head_p.z + 0.028 * HEX_R,
    );
    let bit_y = muz_end.y + 0.011 * HEX_R;
    let bit_z = muz_end.z - 0.030 * HEX_R;
    m.add_mesh(root, g_bit(), m_bronze)
        .set_pos(0.0, bit_y, bit_z);
    for s in [-1.0, 1.0] {
        m.add_mesh(root, g_bit_ring(), m_bronze_lt)
            .rot_y(PI / 2.0)
            .set_pos(s * 0.026 * HEX_R, bit_y, bit_z);
        kn_strap(
            &mut m,
            root,
            m_leather,
            v3(s * 0.026 * HEX_R, bit_y, bit_z),
            v3(
                s * 0.030 * HEX_R,
                head_p.y + 0.034 * HEX_R,
                head_p.z - 0.004 * HEX_R,
            ),
            0.010 * HEX_R,
            0.010 * HEX_R,
        );
    }

    // JEŹDZIEC
    let sz = KN_SEAT_Z;
    m.add_mesh(root, g_torso(), m_wool).rot_x(-0.06).set_pos(
        0.0,
        (KN_BACK_Y + KN_TORSO_H * 0.5) * HEX_R,
        sz * HEX_R,
    );
    m.add_mesh(root, g_chest_r(), m_wool)
        .set_pos(0.0, (KN_TORSO_TOP - 0.028) * HEX_R, sz * HEX_R);
    m.add_mesh(root, g_tunic_hem(), m_wool).set_pos(
        0.0,
        (KN_BACK_Y + 0.024) * HEX_R,
        (sz + 0.005) * HEX_R,
    );
    for s in [-1.0, 0.0, 1.0] {
        m.add_mesh(root, g_fold(), m_wool_dk).set_pos(
            s * 0.042 * HEX_R,
            (KN_BACK_Y + 0.020) * HEX_R,
            (sz + KN_TORSO_D * 0.5 + 0.010) * HEX_R,
        );
    }
    m.add_mesh(root, g_belt(), m_leather)
        .set_pos(0.0, (KN_BACK_Y + 0.052) * HEX_R, sz * HEX_R);
    m.add_mesh(root, g_buckle(), m_bronze_lt).set_pos(
        0.0,
        (KN_BACK_Y + 0.052) * HEX_R,
        (sz + KN_TORSO_D * 0.5 + 0.009) * HEX_R,
    );
    m.add_mesh(root, g_sheath(), m_leather)
        .rot_z(-0.12)
        .set_pos(
            0.079 * HEX_R,
            (KN_BACK_Y + 0.024) * HEX_R,
            (sz + 0.012) * HEX_R,
        );
    m.add_mesh(root, g_hilt(), m_bronze_lt)
        .rot_z(-0.12)
        .set_pos(
            0.083 * HEX_R,
            (KN_BACK_Y + 0.060) * HEX_R,
            (sz + 0.012) * HEX_R,
        );

    // głowa jeźdźca
    m.add_mesh(root, g_neck_r(), m_skin).set_pos(
        0.0,
        (KN_TORSO_TOP + KN_NECK_H * 0.5) * HEX_R,
        sz * HEX_R,
    );
    m.add_mesh(root, g_head(), m_skin)
        .set_pos(0.0, KN_HEAD_CTR * HEX_R, sz * HEX_R);
    m.add_mesh(root, g_jaw(), m_skin_dk).set_pos(
        0.0,
        (KN_HEAD_CTR - KN_HEAD_S * 0.38) * HEX_R,
        (sz + 0.010) * HEX_R,
    );
    m.add_mesh(root, g_nose(), m_skin).set_pos(
        0.0,
        (KN_HEAD_CTR - 0.004) * HEX_R,
        (sz + KN_HEAD_S * 0.5 + 0.006) * HEX_R,
    );
    m.add_mesh(root, g_brow(), m_skin_dk).rot_x(0.12).set_pos(
        0.0,
        (KN_HEAD_CTR + 0.026) * HEX_R,
        (sz + KN_HEAD_S * 0.5 + 0.003) * HEX_R,
    );
    for s in [-1.0, 1.0] {
        m.add_mesh(root, g_eye_r(), m_eye).set_pos(
            s * 0.021 * HEX_R,
            (KN_HEAD_CTR + 0.010) * HEX_R,
            (sz + KN_HEAD_S * 0.5 + 0.002) * HEX_R,
        );
        m.add_mesh(root, g_ear_r(), m_skin_dk).set_pos(
            s * (KN_HEAD_S * 0.5 + 0.004) * HEX_R,
            (KN_HEAD_CTR - 0.006) * HEX_R,
            sz * HEX_R,
        );
    }
    let cap_y = (KN_HEAD_CTR + 0.014) * HEX_R;
    m.add_mesh(root, g_cap_dome(), m_felt)
        .set_pos(0.0, cap_y, sz * HEX_R);
    m.add_mesh(root, g_cap_band(), m_owner)
        .set_pos(0.0, (KN_HEAD_CTR + 0.016) * HEX_R, sz * HEX_R);
    m.add_mesh(root, g_nape(), m_hair).set_pos(
        0.0,
        (KN_HEAD_CTR + 0.004) * HEX_R,
        (sz - KN_HEAD_S * 0.5 - 0.006) * HEX_R,
    );

    // NOGI JEŹDŹCA
    for s in [-1.0, 1.0] {
        let mut p = v3(s * KN_HIP_X * HEX_R, KN_BACK_Y * HEX_R, sz * HEX_R);
        p = seg(&mut m, root, g_thigh(), m_skin, p, 0.45, KN_THIGH_L * HEX_R);
        p.x += s * 0.006 * HEX_R;
        p.y += 0.008 * HEX_R;
        p = seg(&mut m, root, g_shin(), m_skin, p, 0.05, KN_SHIN_L * HEX_R);
        m.add_mesh(root, g_sole(), m_leather).set_pos(
            p.x,
            p.y - 0.006 * HEX_R,
            p.z + 0.012 * HEX_R,
        );
        m.add_mesh(root, g_toes(), m_skin)
            .set_pos(p.x, p.y - 0.004 * HEX_R, p.z + 0.044 * HEX_R);
        m.add_mesh(root, g_ank_strap(), m_leather).set_pos(
            p.x,
            p.y + 0.018 * HEX_R,
            p.z + 0.002 * HEX_R,
        );
    }

    // LEWE RAMIĘ: WODZE
    let mut la = v3(KN_SHLD_X * HEX_R, KN_SHLD_Y * HEX_R, sz * HEX_R);
    la = seg(
        &mut m,
        root,
        g_up_arm(),
        m_skin,
        la,
        0.55,
        KN_UPARM_L * HEX_R,
    );
    la.y += 0.007 * HEX_R;
    let wrist_l = seg(
        &mut m,
        root,
        g_forearm(),
        m_skin,
        la,
        1.15,
        KN_FOREARM_L * HEX_R,
    );
    m.add_mesh(root, g_fist(), m_skin)
        .rot_x(PI - 1.15)
        .set_pos_v(add_scaled(wrist_l, kn_down(1.15), 0.010 * HEX_R));
    for s in [-1.0, 1.0] {
        kn_strap(
            &mut m,
            root,
            m_leath_dk,
            v3(s * 0.026 * HEX_R, bit_y, bit_z),
            v3(
                wrist_l.x - s * 0.005 * HEX_R,
                wrist_l.y + 0.006 * HEX_R,
                wrist_l.z,
            ),
            0.007 * HEX_R,
            0.007 * HEX_R,
        );
    }

    // PRAWE RAMIĘ: WŁÓCZNIA
    let mut ra = v3(-KN_SHLD_X * HEX_R, KN_SHLD_Y * HEX_R, sz * HEX_R);
    ra = seg(
        &mut m,
        root,
        g_up_arm(),
        m_skin,
        ra,
        0.22,
        KN_UPARM_L * HEX_R,
    );
    ra.y += 0.007 * HEX_R;
    let wrist_r = seg(
        &mut m,
        root,
        g_forearm(),
        m_skin,
        ra,
        0.75,
        KN_FOREARM_L * HEX_R,
    );
    m.add_mesh(root, g_fist(), m_skin)
        .rot_x(PI - 0.75)
        .set_pos_v(add_scaled(wrist_r, kn_down(0.75), 0.010 * HEX_R));
    let spear_tilt = 0.16;
    let d_spear = kn_up_dir(spear_tilt);
    let grip = v3(
        wrist_r.x - 0.018 * HEX_R,
        wrist_r.y + 0.002 * HEX_R,
        wrist_r.z + 0.010 * HEX_R,
    );
    let at_s = |t: f64| add_scaled(grip, d_spear, t * HEX_R);
    kn_along(&mut m, root, g_shaft(), m_wood, at_s(0.0), d_spear);
    kn_along(&mut m, root, g_grip(), m_leath_dk, at_s(0.0), d_spear);
    kn_along(&mut m, root, g_socket(), m_bronze, at_s(0.236), d_spear);
    kn_along(&mut m, root, g_bind(), m_leath_dk, at_s(0.222), d_spear);
    kn_along(&mut m, root, g_bind(), m_leath_dk, at_s(0.250), d_spear);
    kn_along(
        &mut m,
        root,
        g_spear_hd(),
        m_bronze_lt,
        at_s(0.246),
        d_spear,
    );
    let butt = kn_along(&mut m, root, g_butt(), m_bronze, at_s(-0.216), d_spear);
    rotate_on_axis(&mut m, butt, v3(1.0, 0.0, 0.0), PI);
    m
}
