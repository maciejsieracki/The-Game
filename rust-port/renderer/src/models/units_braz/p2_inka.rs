//! Port of `render/jednostki-p2-inka.ts` (`edb8fb56`), the two builders the
//! game reaches: `buildAxeWarriorInka` (Wojownik z toporem) and
//! `buildInkaSlinger` (Procarz (Huaracoc)).
//!
//! The file's other two exports, `buildMaceWarrior` and `buildInkaJavelineer`
//! (`:322`, `:397`), have NO importer in `gra/src` (`units.ts:132-135` imports
//! only the two above; Chaska/Estólica use `kamien-inka-opus5.ts`), so they
//! are not ported here (D-MOD-3, see the P4.23 document).
//!
//! The lazily created `getGIK*` singletons have fixed arguments, so each maps
//! to one geometry value.

use super::kit::{add_scaled, bx, dir_down, seg, v3, Y_UP};
use crate::geom::Vec3;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── paleta (`jednostki-p2-inka.ts:58-72`)
const IK_SKIN: u32 = 0xe0ac69;
const IK_SKIN_DARK: u32 = 0xc89058;
const IK_OCHRE: u32 = 0xc8932e;
const IK_BURGUNDY: u32 = 0x7e2a30;
const IK_RED: u32 = 0xc0392b;
const IK_RED_BAND: u32 = 0xc03530;
const IK_TEAL: u32 = 0x2a9d8f;
const IK_GOLD: u32 = 0xe0b53a;
const IK_WOOD: u32 = 0x7a5c3a;
const IK_LEATHER: u32 = 0x6b4a28;
const IK_BRONZE: u32 = 0xcf9234;
const IK_BRONZE_LT: u32 = 0xd0a050;
const IK_FEATHER: u32 = 0xf4f0e6;
const IK_EYE: u32 = 0x1a1008;

// ── wymiary sylwetki (`:75-92`)
const IK_HIP_Y: f64 = 0.208 * HEX_R;
const IK_TORSO_W: f64 = 0.180 * HEX_R;
const IK_TORSO_H: f64 = 0.205 * HEX_R;
const IK_TORSO_D: f64 = 0.100 * HEX_R;
const IK_TORSO_BOT: f64 = 0.240 * HEX_R;
const IK_TORSO_CTR: f64 = IK_TORSO_BOT + IK_TORSO_H * 0.5;
const IK_TORSO_TOP: f64 = IK_TORSO_BOT + IK_TORSO_H;
const IK_NECK_H: f64 = 0.028 * HEX_R;
const IK_HEAD_S: f64 = 0.128 * HEX_R;
const IK_HEAD_CTR: f64 = IK_TORSO_TOP + IK_NECK_H + IK_HEAD_S * 0.5;
const IK_HEAD_TOP: f64 = IK_TORSO_TOP + IK_NECK_H + IK_HEAD_S;
const IK_SHLD_X: f64 = IK_TORSO_W * 0.5 + 0.030 * HEX_R;
const IK_SHLD_Y: f64 = IK_TORSO_TOP - 0.024 * HEX_R;
const IK_HIP_X: f64 = 0.052 * HEX_R;
const IK_THIGH_L: f64 = 0.104 * HEX_R;
const IK_SHIN_L: f64 = 0.096 * HEX_R;
const IK_UPARM_L: f64 = 0.100 * HEX_R;
const IK_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:137-180`)
fn g_torso() -> Geo {
    bx(IK_TORSO_W, IK_TORSO_H, IK_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, IK_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(IK_HEAD_S, IK_HEAD_S, IK_HEAD_S)
}
fn g_eye() -> Geo {
    bx(0.020 * HEX_R, 0.014 * HEX_R, 0.008 * HEX_R)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, IK_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, IK_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, IK_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, IK_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_hem_band() -> Geo {
    bx(0.204 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)
}
fn g_belt() -> Geo {
    bx(0.190 * HEX_R, 0.030 * HEX_R, 0.112 * HEX_R)
}
fn g_collar() -> Geo {
    bx(0.150 * HEX_R, 0.020 * HEX_R, 0.106 * HEX_R)
}
fn g_band() -> Geo {
    bx(0.142 * HEX_R, 0.026 * HEX_R, 0.142 * HEX_R)
}
fn g_feather() -> Geo {
    bx(0.020 * HEX_R, 0.105 * HEX_R, 0.010 * HEX_R)
}
fn g_diamond() -> Geo {
    bx(0.032 * HEX_R, 0.032 * HEX_R, 0.010 * HEX_R)
}
fn g_ear_spool() -> Geo {
    bx(0.012 * HEX_R, 0.026 * HEX_R, 0.026 * HEX_R)
}
fn g_axe_haft() -> Geo {
    bx(0.022 * HEX_R, 0.440 * HEX_R, 0.022 * HEX_R)
}
fn g_axe_sock() -> Geo {
    bx(0.030 * HEX_R, 0.052 * HEX_R, 0.034 * HEX_R)
}
fn g_axe_blade() -> Geo {
    bx(0.016 * HEX_R, 0.058 * HEX_R, 0.110 * HEX_R)
}
fn g_axe_edge() -> Geo {
    bx(0.012 * HEX_R, 0.048 * HEX_R, 0.030 * HEX_R)
}
fn g_cord() -> Geo {
    bx(0.009 * HEX_R, 0.175 * HEX_R, 0.009 * HEX_R)
}
fn g_pouch() -> Geo {
    bx(0.042 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)
}
fn g_pellet() -> Geo {
    bx(0.026 * HEX_R, 0.026 * HEX_R, 0.026 * HEX_R)
}
fn g_small_sh() -> Geo {
    bx(0.085 * HEX_R, 0.105 * HEX_R, 0.014 * HEX_R)
}
fn g_sh_boss() -> Geo {
    bx(0.030 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)
}
fn g_chullo() -> Geo {
    bx(0.148 * HEX_R, 0.055 * HEX_R, 0.148 * HEX_R)
}
fn g_ch_stripe() -> Geo {
    bx(0.142 * HEX_R, 0.014 * HEX_R, 0.142 * HEX_R)
}
fn g_ch_flap() -> Geo {
    bx(0.024 * HEX_R, 0.062 * HEX_R, 0.046 * HEX_R)
}
fn g_ch_knob() -> Geo {
    bx(0.020 * HEX_R, 0.026 * HEX_R, 0.020 * HEX_R)
}

/// `ikBuildLeg` (`:199-212`).
#[allow(clippy::too_many_arguments)]
fn ik_build_leg(
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
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, IK_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    p = seg(m, g, g_shin(), m_shin, p, th_l, IK_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, p.z + 0.016 * HEX_R);
}

/// `ikBuildArm` (`:215-230`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn ik_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, IK_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, IK_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, IK_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `ikCore(group, mat, mTunic, skinColor)` (`:233-253`): returns the skin
/// material (the factory creates skin, then eye material).
fn ik_core(m: &mut UnitModel, g: NodeId, m_tunic: MatId, skin_color: u32) -> MatId {
    m.add_mesh(g, g_torso(), m_tunic)
        .set_pos(0.0, IK_TORSO_CTR, 0.0);
    let m_skin = m.mat(skin_color, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, IK_TORSO_TOP + IK_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, IK_HEAD_CTR, 0.0);
    let m_eye = m.mat(IK_EYE, 0.02, 0.95);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_eye(), m_eye).set_pos(
            sx * 0.028 * HEX_R,
            IK_HEAD_CTR + 0.008 * HEX_R,
            IK_HEAD_S * 0.5 + 0.004 * HEX_R,
        );
    }
    m_skin
}

/// `ikSkirtSet` (`:256-271`).
fn ik_skirt_set(
    m: &mut UnitModel,
    g: NodeId,
    m_skirt: MatId,
    m_border: MatId,
    m_belt: Option<MatId>,
) {
    m.add_mesh(g, g_skirt(), m_skirt)
        .set_pos(0.0, IK_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_hem_band(), m_border)
        .set_pos(0.0, IK_TORSO_BOT - 0.050 * HEX_R, 0.0);
    if let Some(mb) = m_belt {
        m.add_mesh(g, g_belt(), mb).set_pos(0.0, 0.252 * HEX_R, 0.0);
    }
}

/// `ikHeadband` (`:274-280`).
fn ik_headband(m: &mut UnitModel, g: NodeId, m_band: MatId) -> f64 {
    let y = IK_HEAD_CTR + 0.034 * HEX_R;
    m.add_mesh(g, g_band(), m_band).set_pos(0.0, y, 0.0);
    y
}

/// `ikEarSpools` (`:283-289`).
fn ik_ear_spools(m: &mut UnitModel, g: NodeId, m_gold: MatId) {
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_ear_spool(), m_gold).set_pos(
            sx * (IK_HEAD_S * 0.5 + 0.007 * HEX_R),
            IK_HEAD_CTR - 0.012 * HEX_R,
            0.006 * HEX_R,
        );
    }
}

/// `buildAxeWarriorInka(ownerColor)` (`jednostki-p2-inka.ts:499-590`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_axe_warrior_inka(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_burg = m.mat(IK_BURGUNDY, 0.05, 0.82);
    let m_ochre = m.mat(IK_OCHRE, 0.06, 0.80);
    let m_teal = m.mat(IK_TEAL, 0.06, 0.78);
    let m_bronz = m.mat(IK_BRONZE, 0.48, 0.40);
    let m_bron_l = m.mat(IK_BRONZE_LT, 0.54, 0.32);
    let m_wood = m.mat(IK_WOOD, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.68);
    let m_leath = m.mat(IK_LEATHER, 0.06, 0.82);

    let hip_y = IK_HIP_Y - 0.012 * HEX_R;

    let m_skin = ik_core(&mut m, g, m_burg, IK_SKIN_DARK);
    ik_skirt_set(&mut m, g, m_burg, m_ochre, Some(m_leath));
    m.add_mesh(g, g_belt(), m_ochre)
        .set_scale(0.98, 1.30, 0.96)
        .set_pos(0.0, IK_TORSO_CTR + 0.036 * HEX_R, 0.0);
    for dx in [-0.048, 0.0, 0.048] {
        m.add_mesh(g, g_diamond(), m_burg)
            .rot_z(PI / 4.0)
            .set_scale(0.78, 0.78, 1.0)
            .set_pos(
                dx * HEX_R,
                IK_TORSO_CTR + 0.036 * HEX_R,
                IK_TORSO_D * 0.5 + 0.008 * HEX_R,
            );
    }

    ik_build_leg(
        &mut m, g, IK_HIP_X, 0.60, 0.35, m_burg, m_skin, m_leath, hip_y,
    );
    ik_build_leg(
        &mut m, g, -IK_HIP_X, -0.55, -0.20, m_burg, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_chullo(), m_ochre)
        .set_pos(0.0, IK_HEAD_TOP - 0.004 * HEX_R, 0.0);
    m.add_mesh(g, g_ch_stripe(), m_teal)
        .set_pos(0.0, IK_HEAD_TOP - 0.026 * HEX_R, 0.0);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_ch_flap(), m_ochre).set_pos(
            sx * (IK_HEAD_S * 0.5 + 0.006 * HEX_R),
            IK_HEAD_CTR - 0.024 * HEX_R,
            0.004 * HEX_R,
        );
    }
    m.add_mesh(g, g_ch_knob(), m_teal)
        .set_pos(0.0, IK_HEAD_TOP + 0.032 * HEX_R, 0.0);
    m.add_mesh(g, g_feather(), m_owner).rot_z(0.18).set_pos(
        0.016 * HEX_R,
        IK_HEAD_TOP + 0.082 * HEX_R,
        -0.012 * HEX_R,
    );

    let th_f = 2.62;
    let (wrist_r, axis_r) = ik_build_arm(
        &mut m,
        g,
        -IK_SHLD_X,
        -2.40,
        th_f,
        m_burg,
        m_skin,
        Some(m_skin),
    );
    let fist = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    let wg = m.detached_group();
    m.node(wg).set_pos_v(fist).rot_x(PI - th_f);
    m.add_mesh(wg, g_axe_haft(), m_wood)
        .set_pos(0.0, 0.140 * HEX_R, 0.0);
    m.add_mesh(wg, g_axe_sock(), m_bronz)
        .set_pos(0.0, 0.300 * HEX_R, 0.0);
    m.add_mesh(wg, g_axe_blade(), m_bronz)
        .set_pos(0.0, 0.300 * HEX_R, 0.064 * HEX_R);
    m.add_mesh(wg, g_axe_edge(), m_bron_l)
        .set_pos(0.0, 0.300 * HEX_R, 0.126 * HEX_R);
    m.attach(g, wg);

    let (wrist_l, _) = ik_build_arm(&mut m, g, IK_SHLD_X, 0.50, 1.10, m_burg, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.012 * HEX_R,
            wrist_l.y + 0.026 * HEX_R,
            wrist_l.z + 0.034 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, g_small_sh(), m_owner);
    m.add_mesh(sh, g_sh_boss(), m_bron_l)
        .set_pos(0.0, 0.0, 0.010 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildInkaSlinger(ownerColor)` (`jednostki-p2-inka.ts:600-678`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_inka_slinger(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_ochre = m.mat(IK_OCHRE, 0.05, 0.86);
    let m_red = m.mat(IK_RED, 0.06, 0.78);
    let m_teal = m.mat(IK_TEAL, 0.06, 0.78);
    let m_stone = m.mat(0x008a_857c, 0.05, 0.95);
    let m_owner = m.mat(owner, 0.08, 0.70);
    let m_gold = m.mat(IK_GOLD, 0.45, 0.40);
    let m_band = m.mat(IK_RED_BAND, 0.05, 0.75);
    let m_leath = m.mat(IK_LEATHER, 0.05, 0.85);
    let m_strap = m.mat(0x007a_5034, 0.05, 0.85);
    let m_feath = m.mat(IK_FEATHER, 0.03, 0.92);

    let hip_y = IK_HIP_Y - 0.008 * HEX_R;

    let m_skin = ik_core(&mut m, g, m_ochre, IK_SKIN);
    ik_skirt_set(&mut m, g, m_ochre, m_owner, Some(m_leath));
    m.add_mesh(g, g_collar(), m_gold)
        .set_pos(0.0, IK_TORSO_TOP - 0.010 * HEX_R, 0.0);
    for (di, dx) in [-0.032, 0.032].into_iter().enumerate() {
        m.add_mesh(g, g_diamond(), if di == 0 { m_red } else { m_teal })
            .rot_z(PI / 4.0)
            .set_pos(
                dx * HEX_R,
                IK_TORSO_CTR + 0.008 * HEX_R,
                IK_TORSO_D * 0.5 + 0.006 * HEX_R,
            );
    }

    ik_build_leg(
        &mut m, g, IK_HIP_X, 0.35, 0.20, m_ochre, m_skin, m_leath, hip_y,
    );
    ik_build_leg(
        &mut m, g, -IK_HIP_X, -0.60, -0.28, m_ochre, m_skin, m_leath, hip_y,
    );

    ik_headband(&mut m, g, m_band);
    m.add_mesh(g, g_feather(), m_feath)
        .set_scale(0.8, 0.72, 1.0)
        .rot_x(-0.35)
        .set_pos(0.0, IK_HEAD_TOP + 0.036 * HEX_R, -0.052 * HEX_R);
    ik_ear_spools(&mut m, g, m_gold);

    let (wrist_r, axis_r) = ik_build_arm(
        &mut m,
        g,
        -IK_SHLD_X,
        -2.85,
        3.05,
        m_ochre,
        m_skin,
        Some(m_skin),
    );
    let fist = add_scaled(wrist_r, axis_r, 0.014 * HEX_R);
    let w = v3(0.92, 0.0, -0.39).normalize();
    let pouch_p = add_scaled(fist, w, 0.175 * HEX_R);
    for dy in [-0.006, 0.006] {
        let n = m.add_mesh(g, g_cord(), m_strap);
        n.quat_from_unit_vectors(Y_UP, w)
            .set_pos_v(add_scaled(fist, w, 0.0875 * HEX_R));
        n.position.y += dy * HEX_R;
    }
    m.add_mesh(g, g_pouch(), m_leath)
        .quat_from_unit_vectors(Y_UP, w)
        .set_pos_v(pouch_p);
    m.add_mesh(g, g_pellet(), m_stone)
        .set_pos_v(add_scaled(pouch_p, w, 0.014 * HEX_R));

    ik_build_arm(
        &mut m,
        g,
        IK_SHLD_X,
        1.55,
        1.55,
        m_ochre,
        m_skin,
        Some(m_skin),
    );

    m.add_mesh(g, g_pouch(), m_leath)
        .set_scale(1.15, 1.5, 1.2)
        .set_pos(
            IK_TORSO_W * 0.5 + 0.016 * HEX_R,
            IK_TORSO_BOT - 0.020 * HEX_R,
            0.020 * HEX_R,
        );
    // `hipFlapPlace` (`:681-684`)
    m.add_mesh(g, g_sh_boss(), m_owner)
        .set_scale(1.2, 0.9, 0.8)
        .set_pos(
            IK_TORSO_W * 0.5 + 0.016 * HEX_R,
            IK_TORSO_BOT + 0.004 * HEX_R,
            0.028 * HEX_R,
        );
    m
}
