//! Port of `render/jednostki-p57-wlocznie-machiny.ts` (`edb8fb56`), the three
//! builders the game reaches: `buildImpi`, `buildSumerianSpearman` (Włócznik
//! sumeryjski) and `buildSiegeTower` (Wieża oblężnicza).
//!
//! The file's fourth export `buildBatteringRam` (`:584`) has NO importer in
//! `gra/src` (`units.ts:148-152` imports only the three above; Taran uses
//! `kamien-zulu-taran-opus5.ts`), so it is not ported here (D-MOD-3, see the
//! P4.23 document).
//!
//! The lazily created `getGWM*` singletons and the `wmBox`/`wmCyl` caches
//! (keyed by their exact arguments) map to one geometry value per argument
//! set.

use super::kit::{
    add_scaled, bx, cn, cy, cy_o, cy_open, dir_down, js_sign, oval_face, oval_shell, seg, v3,
};
use crate::geom::Vec3;
use crate::models::unit_core::consts::HEX_R;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use std::f64::consts::PI;

// ── kolory serii (`jednostki-p57-wlocznie-machiny.ts:68-88`, used subset)
const WM_SKIN_ZULU: u32 = 0xb06030;
const WM_SKIN: u32 = 0xe0ac69;
const WM_BRONZE: u32 = 0xcf9234;
const WM_BRONZE_LT: u32 = 0xd0a050;
const WM_COPPER: u32 = 0xb87333;
const WM_WOOD: u32 = 0x7a5c3a;
const WM_WOOD_DK: u32 = 0x4a3018;
const WM_PLANKS: u32 = 0x8a6840;
const WM_WICKER: u32 = 0xc9a066;
const WM_LEATHER: u32 = 0x6b4a28;
const WM_HIDE_RED: u32 = 0x8a3a26;
const WM_HIDE_WHT: u32 = 0xe8ddc4;
const WM_FUR: u32 = 0x5a3c20;
const WM_FUR_LT: u32 = 0x7a5230;
const WM_TEAL: u32 = 0x1f7a78;
const WM_FLEECE: u32 = 0xd8c8a0;
const WM_BLACK: u32 = 0x171310;
const WM_CRANE_WHT: u32 = 0xf0ece0;

// ── wymiary sylwetki (`:91-109`)
const WM_HIP_Y: f64 = 0.208 * HEX_R;
const WM_TORSO_W: f64 = 0.180 * HEX_R;
const WM_TORSO_H: f64 = 0.205 * HEX_R;
const WM_TORSO_D: f64 = 0.100 * HEX_R;
const WM_TORSO_BOT: f64 = 0.240 * HEX_R;
const WM_TORSO_CTR: f64 = WM_TORSO_BOT + WM_TORSO_H * 0.5;
const WM_TORSO_TOP: f64 = WM_TORSO_BOT + WM_TORSO_H;
const WM_NECK_H: f64 = 0.028 * HEX_R;
const WM_HEAD_S: f64 = 0.128 * HEX_R;
const WM_HEAD_CTR: f64 = WM_TORSO_TOP + WM_NECK_H + WM_HEAD_S * 0.5;
const WM_HEAD_TOP: f64 = WM_TORSO_TOP + WM_NECK_H + WM_HEAD_S;
const WM_SHLD_X: f64 = WM_TORSO_W * 0.5 + 0.030 * HEX_R;
const WM_SHLD_Y: f64 = WM_TORSO_TOP - 0.024 * HEX_R;
const WM_HIP_X: f64 = 0.052 * HEX_R;
const WM_THIGH_L: f64 = 0.104 * HEX_R;
const WM_SHIN_L: f64 = 0.096 * HEX_R;
const WM_UPARM_L: f64 = 0.100 * HEX_R;
const WM_FOREARM_L: f64 = 0.092 * HEX_R;

// ── geometrie-singletony (`:155-194`, `:239-240`, used subset)
fn g_torso() -> Geo {
    bx(WM_TORSO_W, WM_TORSO_H, WM_TORSO_D)
}
fn g_neck() -> Geo {
    bx(0.042 * HEX_R, WM_NECK_H * 1.6, 0.042 * HEX_R)
}
fn g_head() -> Geo {
    bx(WM_HEAD_S, WM_HEAD_S, WM_HEAD_S)
}
fn g_thigh() -> Geo {
    bx(0.056 * HEX_R, WM_THIGH_L, 0.060 * HEX_R)
}
fn g_shin() -> Geo {
    bx(0.038 * HEX_R, WM_SHIN_L, 0.042 * HEX_R)
}
fn g_foot() -> Geo {
    bx(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)
}
fn g_up_arm() -> Geo {
    bx(0.054 * HEX_R, WM_UPARM_L, 0.054 * HEX_R)
}
fn g_forearm() -> Geo {
    bx(0.040 * HEX_R, WM_FOREARM_L, 0.040 * HEX_R)
}
fn g_fist() -> Geo {
    bx(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)
}
fn g_skirt() -> Geo {
    bx(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)
}
fn g_shoba() -> Geo {
    bx(0.062 * HEX_R, 0.046 * HEX_R, 0.062 * HEX_R)
}
fn g_isicoco() -> Geo {
    cy_open(0.052 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R, 8)
}
fn g_feather() -> Geo {
    bx(0.018 * HEX_R, 0.130 * HEX_R, 0.010 * HEX_R)
}
fn g_fringe() -> Geo {
    bx(0.044 * HEX_R, 0.052 * HEX_R, 0.014 * HEX_R)
}
fn g_patch_big() -> Geo {
    bx(0.052 * HEX_R, 0.088 * HEX_R, 0.010 * HEX_R)
}
fn g_patch_sm() -> Geo {
    bx(0.040 * HEX_R, 0.052 * HEX_R, 0.010 * HEX_R)
}
fn g_mgobo() -> Geo {
    bx(0.016 * HEX_R, 0.500 * HEX_R, 0.016 * HEX_R)
}
fn g_mgobo_tuft() -> Geo {
    bx(0.026 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)
}
fn g_diamond() -> Geo {
    bx(0.040 * HEX_R, 0.040 * HEX_R, 0.010 * HEX_R)
}
fn g_iklwa_shaft() -> Geo {
    bx(0.018 * HEX_R, 0.240 * HEX_R, 0.018 * HEX_R)
}
fn g_iklwa_blade() -> Geo {
    bx(0.036 * HEX_R, 0.090 * HEX_R, 0.012 * HEX_R)
}
fn g_iklwa_tip() -> Geo {
    cn(0.016 * HEX_R, 0.044 * HEX_R, 4)
}
fn g_cone_helm() -> Geo {
    cy(0.018 * HEX_R, 0.090 * HEX_R, 0.125 * HEX_R, 8)
}
fn g_nose_g() -> Geo {
    bx(0.018 * HEX_R, 0.058 * HEX_R, 0.016 * HEX_R)
}
fn g_neck_g() -> Geo {
    bx(0.120 * HEX_R, 0.040 * HEX_R, 0.020 * HEX_R)
}
fn g_beard() -> Geo {
    bx(0.084 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)
}
fn g_fleece_row1() -> Geo {
    bx(0.206 * HEX_R, 0.034 * HEX_R, 0.134 * HEX_R)
}
fn g_fleece_row2() -> Geo {
    bx(0.198 * HEX_R, 0.034 * HEX_R, 0.130 * HEX_R)
}
fn g_fleece_row3() -> Geo {
    bx(0.190 * HEX_R, 0.034 * HEX_R, 0.126 * HEX_R)
}
fn g_fleece_tab() -> Geo {
    bx(0.030 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)
}
fn g_pauldron() -> Geo {
    bx(0.066 * HEX_R, 0.026 * HEX_R, 0.108 * HEX_R)
}
fn g_tower_face() -> Geo {
    bx(0.170 * HEX_R, 0.340 * HEX_R, 0.014 * HEX_R)
}
fn g_tower_back() -> Geo {
    bx(0.184 * HEX_R, 0.354 * HEX_R, 0.012 * HEX_R)
}
fn g_tower_bar() -> Geo {
    bx(0.184 * HEX_R, 0.024 * HEX_R, 0.010 * HEX_R)
}
fn g_stud() -> Geo {
    bx(0.024 * HEX_R, 0.024 * HEX_R, 0.010 * HEX_R)
}
fn g_spear_shaft() -> Geo {
    bx(0.019 * HEX_R, 0.600 * HEX_R, 0.019 * HEX_R)
}
fn g_spear_tip() -> Geo {
    cn(0.019 * HEX_R, 0.058 * HEX_R, 4)
}
fn g_spear_butt() -> Geo {
    bx(0.024 * HEX_R, 0.030 * HEX_R, 0.024 * HEX_R)
}
fn g_nguni_shell() -> Geo {
    oval_shell(
        0.088 * HEX_R,
        0.205 * HEX_R,
        0.030 * HEX_R,
        0.014 * HEX_R,
        10,
    )
}
fn g_nguni_face() -> Geo {
    oval_face(0.076 * HEX_R, 0.180 * HEX_R, 0.022 * HEX_R, 10)
}

/// `wmBox(w, h, d)` (`:563-568`).
fn wm_box(w: f64, h: f64, d: f64) -> Geo {
    bx(w * HEX_R, h * HEX_R, d * HEX_R)
}
/// `wmCyl(rt, rb, h, seg, open)` (`:569-575`).
fn wm_cyl(rt: f64, rb: f64, h: f64, seg: u32, open: bool) -> Geo {
    cy_o(rt * HEX_R, rb * HEX_R, h * HEX_R, seg, open)
}

/// `wmBuildLeg` (`:258-272`): `(knee, ankle)`.
#[allow(clippy::too_many_arguments)]
fn wm_build_leg(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_l: f64,
    m_thigh: MatId,
    m_shin: MatId,
    m_foot: MatId,
    hip_y: f64,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, hip_y, 0.0);
    p = seg(m, g, g_thigh(), m_thigh, p, th_u, WM_THIGH_L);
    p.z -= 0.004 * HEX_R;
    p.y += 0.008 * HEX_R;
    let knee = p;
    let ankle = seg(m, g, g_shin(), m_shin, p, th_l, WM_SHIN_L);
    m.add_mesh(g, g_foot(), m_foot)
        .set_pos(sx, 0.013 * HEX_R, ankle.z + 0.016 * HEX_R);
    (knee, ankle)
}

/// `wmBuildArm` (`:275-290`): `(wrist, axis)`.
#[allow(clippy::too_many_arguments)]
fn wm_build_arm(
    m: &mut UnitModel,
    g: NodeId,
    sx: f64,
    th_u: f64,
    th_f: f64,
    m_up: MatId,
    m_fore: MatId,
    m_fist: Option<MatId>,
) -> (Vec3, Vec3) {
    let mut p = v3(sx, WM_SHLD_Y, 0.0);
    p = seg(m, g, g_up_arm(), m_up, p, th_u, WM_UPARM_L);
    p.y += 0.010 * HEX_R;
    let wrist = seg(m, g, g_forearm(), m_fore, p, th_f, WM_FOREARM_L);
    if let Some(mf) = m_fist {
        m.add_mesh(g, g_fist(), mf)
            .rot_x(PI - th_f)
            .set_pos_v(add_scaled(wrist, dir_down(th_f), 0.014 * HEX_R));
    }
    (wrist, dir_down(th_f))
}

/// `wmBuildCore(group, mat, mTorso, skinColor)` (`:293-307`).
fn wm_build_core(m: &mut UnitModel, g: NodeId, m_torso: MatId, skin_color: u32) {
    m.add_mesh(g, g_torso(), m_torso)
        .set_pos(0.0, WM_TORSO_CTR, 0.0);
    let m_skin = m.mat(skin_color, 0.05, 0.80);
    m.add_mesh(g, g_neck(), m_skin)
        .set_pos(0.0, WM_TORSO_TOP + WM_NECK_H * 0.5, 0.0);
    m.add_mesh(g, g_head(), m_skin)
        .set_pos(0.0, WM_HEAD_CTR, 0.0);
}

/// `buildImpi(ownerColor)` (`jednostki-p57-wlocznie-machiny.ts:319-446`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_impi(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(WM_SKIN_ZULU, 0.05, 0.80);
    let m_fur = m.mat(WM_FUR, 0.04, 0.92);
    let m_fur_lt = m.mat(WM_FUR_LT, 0.04, 0.90);
    let m_white = m.mat(WM_HIDE_WHT, 0.03, 0.90);
    let m_hide = m.mat(WM_HIDE_RED, 0.04, 0.88);
    let m_leath = m.mat(WM_LEATHER, 0.05, 0.84);
    let m_owner = m.mat(owner, 0.10, 0.68);
    let m_wood = m.mat(WM_WOOD, 0.05, 0.85);
    let m_bronz = m.mat(WM_BRONZE, 0.40, 0.48);
    let m_black = m.mat(WM_BLACK, 0.04, 0.90);
    let m_crane = m.mat(WM_CRANE_WHT, 0.03, 0.88);

    let hip_y = WM_HIP_Y - 0.014 * HEX_R;

    wm_build_core(&mut m, g, m_skin, WM_SKIN_ZULU);

    m.add_mesh(g, g_skirt(), m_fur)
        .set_pos(0.0, WM_TORSO_BOT - 0.018 * HEX_R, 0.0);
    m.add_mesh(g, g_fringe(), m_owner)
        .set_scale(1.30, 1.35, 1.0)
        .set_pos(0.0, WM_TORSO_BOT - 0.046 * HEX_R, 0.062 * HEX_R);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_fringe(), m_fur_lt).set_pos(
            sx * 0.066 * HEX_R,
            WM_TORSO_BOT - 0.042 * HEX_R,
            0.056 * HEX_R,
        );
    }

    let (knee_l, _) = wm_build_leg(
        &mut m, g, WM_HIP_X, 0.66, 0.40, m_skin, m_skin, m_skin, hip_y,
    );
    let (knee_r, _) = wm_build_leg(
        &mut m, g, -WM_HIP_X, -0.58, -0.24, m_skin, m_skin, m_skin, hip_y,
    );
    for (knee, th_l) in [(knee_l, 0.40), (knee_r, -0.24)] {
        m.add_mesh(g, g_shoba(), m_white)
            .rot_x(PI - th_l)
            .set_pos_v(add_scaled(knee, dir_down(th_l), 0.034 * HEX_R));
    }

    m.add_mesh(g, g_isicoco(), m_black)
        .set_pos(0.0, WM_HEAD_TOP + 0.008 * HEX_R, 0.0);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, g_feather(), m_crane)
            .rot_z(s * 0.14)
            .rot_x(-0.10)
            .set_pos(
                s * 0.022 * HEX_R,
                WM_HEAD_TOP + 0.078 * HEX_R,
                -0.024 * HEX_R,
            );
    }

    let (wrist_r, ax) = wm_build_arm(
        &mut m,
        g,
        -WM_SHLD_X,
        1.00,
        1.52,
        m_skin,
        m_skin,
        Some(m_skin),
    );
    m.add_mesh(g, g_shoba(), m_white).rot_x(PI - 1.00).set_pos(
        -WM_SHLD_X,
        WM_SHLD_Y - 0.030 * HEX_R,
        0.030 * HEX_R,
    );
    m.add_mesh(g, g_iklwa_shaft(), m_wood)
        .rot_x(PI - 1.52)
        .set_pos_v(add_scaled(wrist_r, ax, 0.055 * HEX_R));
    m.add_mesh(g, g_iklwa_blade(), m_bronz)
        .rot_x(PI - 1.52)
        .set_pos_v(add_scaled(wrist_r, ax, 0.225 * HEX_R));
    m.add_mesh(g, g_iklwa_tip(), m_bronz)
        .rot_x(PI - 1.52)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, ax, 0.295 * HEX_R));

    let (wrist_l, _) = wm_build_arm(&mut m, g, WM_SHLD_X, 0.50, 1.05, m_skin, m_skin, None);
    m.add_mesh(g, g_shoba(), m_white).rot_x(PI - 0.50).set_pos(
        WM_SHLD_X,
        WM_SHLD_Y - 0.036 * HEX_R,
        0.018 * HEX_R,
    );
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(
            wrist_l.x - 0.022 * HEX_R,
            wrist_l.y + 0.030 * HEX_R,
            wrist_l.z + 0.042 * HEX_R,
        )
        .rot_y(-0.18);
    m.add_mesh(sh, g_nguni_shell(), m_leath);
    m.add_mesh(sh, g_nguni_face(), m_white)
        .set_pos(0.0, 0.0, 0.010 * HEX_R);
    m.add_mesh(sh, g_patch_big(), m_hide).rot_z(0.30).set_pos(
        -0.030 * HEX_R,
        0.088 * HEX_R,
        0.016 * HEX_R,
    );
    m.add_mesh(sh, g_patch_big(), m_hide).rot_z(-0.42).set_pos(
        0.026 * HEX_R,
        -0.086 * HEX_R,
        0.016 * HEX_R,
    );
    m.add_mesh(sh, g_patch_sm(), m_hide).rot_z(0.55).set_pos(
        0.040 * HEX_R,
        0.020 * HEX_R,
        0.016 * HEX_R,
    );
    m.add_mesh(sh, g_diamond(), m_owner)
        .rot_z(PI / 4.0)
        .set_pos(0.0, 0.0, 0.020 * HEX_R);
    m.add_mesh(sh, g_mgobo(), m_wood)
        .set_pos(0.0, 0.010 * HEX_R, -0.014 * HEX_R);
    m.add_mesh(sh, g_mgobo_tuft(), m_fur_lt)
        .set_pos(0.0, 0.278 * HEX_R, -0.014 * HEX_R);
    m.attach(g, sh);
    m
}

/// `buildSumerianSpearman(ownerColor)` (`jednostki-p57-wlocznie-machiny.ts:455-559`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_sumerian_spearman(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_teal = m.mat(WM_TEAL, 0.05, 0.85);
    let m_fleece = m.mat(WM_FLEECE, 0.04, 0.96);
    let m_copper = m.mat(WM_COPPER, 0.45, 0.42);
    let m_bronze = m.mat(WM_BRONZE, 0.42, 0.45);
    let m_bronz_l = m.mat(WM_BRONZE_LT, 0.50, 0.38);
    let m_wood = m.mat(WM_WOOD, 0.05, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_leath = m.mat(WM_LEATHER, 0.06, 0.82);
    let m_skin = m.mat(WM_SKIN, 0.05, 0.80);
    let m_black = m.mat(WM_BLACK, 0.04, 0.90);

    let hip_y = WM_HIP_Y - 0.006 * HEX_R;

    wm_build_core(&mut m, g, m_teal, WM_SKIN);
    for sx in [-1.0, 1.0] {
        m.add_mesh(g, g_pauldron(), m_leath).set_pos(
            sx * 0.062 * HEX_R,
            WM_TORSO_TOP - 0.004 * HEX_R,
            0.0,
        );
    }

    let rows = [
        (g_fleece_row1(), WM_TORSO_BOT - 0.010 * HEX_R),
        (g_fleece_row2(), WM_TORSO_BOT - 0.044 * HEX_R),
        (g_fleece_row3(), WM_TORSO_BOT - 0.078 * HEX_R),
    ];
    for (geo, fy) in rows {
        m.add_mesh(g, geo, m_fleece).set_pos(0.0, fy, 0.0);
    }
    for sx in [-0.056, 0.0, 0.056] {
        m.add_mesh(g, g_fleece_tab(), m_fleece).set_pos(
            sx * HEX_R,
            WM_TORSO_BOT - 0.106 * HEX_R,
            0.050 * HEX_R,
        );
    }

    wm_build_leg(
        &mut m, g, WM_HIP_X, 0.26, 0.10, m_teal, m_skin, m_leath, hip_y,
    );
    wm_build_leg(
        &mut m, g, -WM_HIP_X, -0.26, -0.08, m_teal, m_skin, m_leath, hip_y,
    );

    m.add_mesh(g, g_cone_helm(), m_copper)
        .set_pos(0.0, WM_HEAD_CTR + 0.040 * HEX_R, 0.0);
    m.add_mesh(g, g_nose_g(), m_bronz_l).set_pos(
        0.0,
        WM_HEAD_CTR - 0.008 * HEX_R,
        WM_HEAD_S * 0.5 + 0.006 * HEX_R,
    );
    m.add_mesh(g, g_neck_g(), m_copper).rot_x(-0.38).set_pos(
        0.0,
        WM_HEAD_CTR - 0.020 * HEX_R,
        -(WM_HEAD_S * 0.5 + 0.010 * HEX_R),
    );
    m.add_mesh(g, g_beard(), m_black).set_pos(
        0.0,
        WM_HEAD_CTR - 0.052 * HEX_R,
        WM_HEAD_S * 0.5 - 0.004 * HEX_R,
    );

    let (wrist_r, ax) = wm_build_arm(
        &mut m,
        g,
        -WM_SHLD_X,
        1.24,
        1.58,
        m_teal,
        m_skin,
        Some(m_skin),
    );
    m.add_mesh(g, g_spear_shaft(), m_wood)
        .rot_x(PI - 1.58)
        .set_pos_v(add_scaled(wrist_r, ax, 0.060 * HEX_R));
    m.add_mesh(g, g_spear_tip(), m_bronze)
        .rot_x(PI - 1.58)
        .rot_y(PI / 4.0)
        .set_pos_v(add_scaled(wrist_r, ax, 0.405 * HEX_R));
    m.add_mesh(g, g_spear_butt(), m_bronz_l)
        .rot_x(PI - 1.58)
        .set_pos_v(add_scaled(wrist_r, ax, -0.255 * HEX_R));

    wm_build_arm(&mut m, g, WM_SHLD_X, 0.42, 0.98, m_teal, m_skin, None);
    let sh = m.detached_group();
    m.node(sh)
        .set_pos(0.130 * HEX_R, 0.195 * HEX_R, 0.105 * HEX_R);
    m.add_mesh(sh, g_tower_back(), m_wood)
        .set_pos(0.0, 0.0, -0.008 * HEX_R);
    m.add_mesh(sh, g_tower_face(), m_owner);
    for fy in [-0.092, 0.092] {
        m.add_mesh(sh, g_tower_bar(), m_bronze)
            .set_pos(0.0, fy * HEX_R, 0.008 * HEX_R);
    }
    for fy in [-0.030, 0.030, 0.150] {
        m.add_mesh(sh, g_stud(), m_bronz_l)
            .rot_z(PI / 4.0)
            .set_pos(0.0, fy * HEX_R, 0.009 * HEX_R);
    }
    m.attach(g, sh);
    m
}

/// `buildSiegeTower(ownerColor)` (`jednostki-p57-wlocznie-machiny.ts:714-840`).
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_siege_tower(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_wood = m.mat(WM_WOOD, 0.06, 0.82);
    let m_dk_wood = m.mat(WM_WOOD_DK, 0.04, 0.88);
    let m_wicker = m.mat(WM_WICKER, 0.05, 0.86);
    let m_plank = m.mat(WM_PLANKS, 0.05, 0.80);
    let m_leath = m.mat(WM_LEATHER, 0.05, 0.88);
    let m_dark = m.mat(0x0024_1708, 0.03, 0.95);
    let m_owner = m.mat(owner, 0.12, 0.70);

    for wz in [-0.110, 0.110] {
        for wx in [-0.148, 0.148] {
            m.add_mesh(g, wm_cyl(0.060, 0.060, 0.034, 8, false), m_plank)
                .rot_z(PI / 2.0)
                .set_pos(wx * HEX_R, 0.060 * HEX_R, wz * HEX_R);
            m.add_mesh(g, wm_box(0.022, 0.022, 0.022), m_dk_wood)
                .set_pos(js_sign(wx) * 0.168 * HEX_R, 0.060 * HEX_R, wz * HEX_R);
        }
        m.add_mesh(g, wm_box(0.336, 0.028, 0.028), m_dk_wood)
            .set_pos(0.0, 0.060 * HEX_R, wz * HEX_R);
    }

    m.add_mesh(g, wm_box(0.280, 0.030, 0.250), m_wood)
        .set_pos(0.0, 0.105 * HEX_R, 0.0);

    for k in 0..3 {
        let y0 = (0.120 + f64::from(k) * 0.140) * HEX_R;
        for sz in [-1.0, 1.0] {
            m.add_mesh(g, wm_box(0.230, 0.135, 0.016), m_wicker)
                .set_pos(0.0, y0 + 0.0675 * HEX_R, sz * 0.105 * HEX_R);
        }
        for sx in [-1.0, 1.0] {
            m.add_mesh(g, wm_box(0.016, 0.135, 0.210), m_wicker)
                .set_pos(sx * 0.107 * HEX_R, y0 + 0.0675 * HEX_R, 0.0);
        }
    }
    for sx in [-0.117, 0.117] {
        for sz in [-0.107, 0.107] {
            m.add_mesh(g, wm_box(0.030, 0.450, 0.030), m_dk_wood)
                .set_pos(sx * HEX_R, 0.345 * HEX_R, sz * HEX_R);
        }
    }
    for gy in [0.258, 0.398] {
        m.add_mesh(g, wm_box(0.270, 0.018, 0.245), m_plank)
            .set_pos(0.0, gy * HEX_R, 0.0);
    }

    m.add_mesh(g, wm_box(0.262, 0.024, 0.240), m_plank)
        .set_pos(0.0, 0.547 * HEX_R, 0.0);
    m.add_mesh(g, wm_box(0.262, 0.036, 0.016), m_wood)
        .set_pos(0.0, 0.577 * HEX_R, 0.112 * HEX_R);
    m.add_mesh(g, wm_box(0.262, 0.056, 0.016), m_wood)
        .set_pos(0.0, 0.587 * HEX_R, -0.112 * HEX_R);
    for sx in [-0.123, 0.123] {
        m.add_mesh(g, wm_box(0.016, 0.056, 0.240), m_wood)
            .set_pos(sx * HEX_R, 0.587 * HEX_R, 0.0);
    }

    m.add_mesh(g, wm_box(0.170, 0.014, 0.190), m_plank)
        .rot_x(-1.134)
        .set_pos(0.0, 0.646 * HEX_R, 0.160 * HEX_R);
    for sx in [-0.064, 0.064] {
        m.add_mesh(g, wm_box(0.010, 0.100, 0.010), m_leath)
            .rot_x(0.62)
            .set_pos(sx * HEX_R, 0.672 * HEX_R, 0.165 * HEX_R);
    }

    for sx in [-1.0, 1.0] {
        m.add_mesh(g, wm_cyl(0.048, 0.048, 0.012, 6, false), m_owner)
            .rot_z(PI / 2.0)
            .set_pos(sx * 0.122 * HEX_R, 0.420 * HEX_R, 0.025 * HEX_R);
    }

    for py in [0.335, 0.475] {
        m.add_mesh(g, wm_box(0.056, 0.018, 0.012), m_dark)
            .set_pos(0.0, py * HEX_R, 0.114 * HEX_R);
    }

    m.add_mesh(g, wm_box(0.090, 0.110, 0.012), m_dark)
        .set_pos(0.0, 0.180 * HEX_R, -0.114 * HEX_R);
    for s in [-1.0, 1.0] {
        m.add_mesh(g, wm_box(0.024, 0.190, 0.020), m_wood)
            .rot_z(s * 0.60)
            .set_pos(0.0, 0.330 * HEX_R, -0.116 * HEX_R);
    }

    m.add_mesh(g, wm_box(0.013, 0.170, 0.013), m_wood).set_pos(
        -0.060 * HEX_R,
        0.660 * HEX_R,
        -0.060 * HEX_R,
    );
    m.add_mesh(g, wm_box(0.100, 0.056, 0.008), m_owner).set_pos(
        -0.002 * HEX_R,
        0.714 * HEX_R,
        -0.060 * HEX_R,
    );
    m
}
