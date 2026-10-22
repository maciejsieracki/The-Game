//! The three MOD-07 builders that live inside `render/units.ts` (`edb8fb56`):
//! `buildGaesatae` (`:2825-2891`), `buildSoldurii` (`:2947-3031`) and
//! `buildCatapult` (`:3348-3600`). They are reached by the name rules of
//! `buildNamedUnit` (`units.ts:1494-1495`, `:1657`).
//!
//! The two Celtic builders sit on the MOD-04 avatar and its gear helpers
//! ([`crate::models::unit_core::avatar`], one implementation); the catapult
//! is a standalone machine whose geometries are allocated per token
//! (`perTokenGeos`, GPU disposal bookkeeping only — in Rust plain `Prim`
//! values, compared by hash / vertices / triangles like every geometry).

use super::kit::{bx, cy, rot3, sph, sph_full, torus, v3};
use crate::jsmath::{js_cos, js_hypot_n, js_sin};
use crate::models::unit_core::avatar::{
    add_belt, add_boots, add_hands, add_long_hair, add_long_sword_right, add_mustache,
    add_spear_right, add_tall_oval_shield, add_torc, add_tunic_hem, build_base_avatar,
};
use crate::models::unit_core::consts::*;
use crate::models::unit_core::model::{Geo, MatId, NodeId, UnitModel, ROOT};
use crate::models::unit_core::parts::UnitPart;
use crate::models::units_kamien::kit::Y_UP;
use std::f64::consts::PI;

/// `armLMesh` of `buildBaseAvatar` (`units.ts:831-833`): the fifth child of
/// the root (legs, torso, sash, left arm).
const ARM_L_CHILD: usize = 4;

fn name_arm_l(m: &mut UnitModel, name: &str) {
    let id = m.nodes[ROOT].children[ARM_L_CHILD];
    m.node(id).set_name(name);
}

/// `buildGaesatae(ownerColor)` (`units.ts:2825-2891`).
#[must_use]
pub fn build_gaesatae(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_SKIN, owner);
    let g = ROOT;
    name_arm_l(&mut m, "gaesatae-arm-left");
    let m_gold = m.mat(COLOR_GOLD_BR, 0.50, 0.40);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_iron = m.mat(COLOR_STEEL, 0.50, 0.42);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_hair = m.mat(0x00c9_8a2c, 0.04, 0.86);
    let m_plank = m.mat(0x006e_4a26, 0.05, 0.85);
    let m_skin_leg = m.mat(COLOR_SKIN, 0.05, 0.80);

    for sx in [-(AV_LEG_SEP + AV_LEG_W * 0.5), AV_LEG_SEP + AV_LEG_W * 0.5] {
        m.add_mesh(
            g,
            bx(AV_LEG_W * 1.02, AV_LEG_H * 1.02, AV_LEG_W * 1.02),
            m_skin_leg,
        )
        .set_pos(sx, AV_Y_LEG_CTR, 0.0)
        .set_name("gaesatae-bare-leg");
    }
    m.add_mesh(g, UnitPart::Loincloth.geo(), m_owner)
        .set_scale(0.8, 0.55, 0.95)
        .set_pos(0.0, AV_Y_TORSO_BOT - 0.01 * HEX_R, 0.0)
        .set_name("gaesatae-loincloth");

    add_torc(&mut m, m_gold);
    for sx in [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X] {
        m.add_mesh(g, torus(0.037 * HEX_R, 0.009 * HEX_R, 6, 12), m_gold)
            .rot_x(PI / 2.0)
            .set_pos(sx, AV_Y_TORSO_BOT + AV_TORSO_H * 0.86, 0.0)
            .set_name("gaesatae-armlet");
    }
    add_mustache(&mut m, m_hair);
    add_long_hair(&mut m, m_hair);

    add_spear_right(&mut m, m_wood, m_iron, 0.62, "gaesatae");
    add_tall_oval_shield(&mut m, m_plank, m_owner, m_iron, 1.85, "gaesatae");

    let m_feet = m.mat(COLOR_SKIN, 0.05, 0.82);
    add_boots(&mut m, m_feet);
    let m_hands = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hands);
    m
}

/// `buildSoldurii(ownerColor)` (`units.ts:2947-3031`).
#[must_use]
pub fn build_soldurii(owner: u32) -> UnitModel {
    let mut m = build_base_avatar(COLOR_SKIN, COLOR_FOREST, owner);
    let g = ROOT;
    name_arm_l(&mut m, "soldurii-arm-left");
    let m_iron = m.mat(COLOR_STEEL, 0.55, 0.40);
    let m_mail = m.mat(0x008d_97a3, 0.62, 0.55);
    let m_wood = m.mat(COLOR_WOOD, 0.05, 0.85);
    let m_bronz = m.mat(COLOR_BRONZE, 0.45, 0.42);
    let m_owner = m.mat(owner, 0.12, 0.66);
    let m_hair = m.mat(0x00b8_702a, 0.04, 0.86);
    let m_plank = m.mat(0x006e_4a26, 0.05, 0.85);
    let m_leath = m.mat(COLOR_LEATHER, 0.06, 0.82);

    let m_hem = m.mat(COLOR_FOREST, 0.05, 0.86);
    add_tunic_hem(&mut m, m_hem);
    add_belt(&mut m, m_leath, 0.025);

    m.add_mesh(
        g,
        bx(AV_TORSO_W * 1.10, AV_TORSO_H * 0.80, AV_TORSO_D * 1.14),
        m_mail,
    )
    .set_pos(0.0, AV_Y_TORSO_BOT + AV_TORSO_H * 0.56, 0.0)
    .set_name("soldurii-mail");
    for sx in [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X] {
        m.add_mesh(
            g,
            bx(AV_ARM_W * 1.14, AV_ARM_H * 0.34, AV_ARM_W * 1.14),
            m_mail,
        )
        .set_pos(sx, AV_Y_ARM_CTR + AV_ARM_H * 0.30, 0.0)
        .set_name("soldurii-mail-sleeve");
    }

    add_torc(&mut m, m_bronz);

    m.add_mesh(
        g,
        sph(AV_HEAD_S * 0.58, 10, 6, 0.0, PI * 2.0, 0.0, PI * 0.5),
        m_bronz,
    )
    .set_pos(0.0, AV_Y_HEAD_CTR + 0.020 * HEX_R, 0.0)
    .set_name("soldurii-helmet");
    m.add_mesh(
        g,
        bx(AV_HEAD_S * 0.86, 0.030 * HEX_R, 0.026 * HEX_R),
        m_bronz,
    )
    .rot_x(-0.45)
    .set_pos(0.0, AV_Y_HEAD_CTR + 0.004 * HEX_R, -AV_HEAD_S * 0.52)
    .set_name("soldurii-helmet-neckguard");
    m.add_mesh(g, bx(0.024 * HEX_R, 0.026 * HEX_R, 0.024 * HEX_R), m_bronz)
        .set_pos(0.0, AV_Y_HEAD_CTR + 0.020 * HEX_R + AV_HEAD_S * 0.58, 0.0)
        .set_name("soldurii-helmet-knob");
    add_mustache(&mut m, m_hair);

    add_long_sword_right(&mut m, m_iron, m_wood, 0.32, "soldurii");
    add_tall_oval_shield(&mut m, m_owner, m_plank, m_iron, 1.85, "soldurii");

    add_boots(&mut m, m_leath);
    let m_hands = m.mat(COLOR_SKIN, 0.05, 0.80);
    add_hands(&mut m, m_hands);
    m
}

/// The `add(name, geo, m, x, y, z, rx, ry, rz)` closure of `buildCatapult`
/// (`units.ts:3365-3375`): a named mesh, `position.set`, `rotation.set`.
#[allow(clippy::too_many_arguments)]
fn add(
    m: &mut UnitModel,
    name: &str,
    geo: Geo,
    mtl: MatId,
    x: f64,
    y: f64,
    z: f64,
    rx: f64,
    ry: f64,
    rz: f64,
) -> NodeId {
    let id = m.add_mesh_id(ROOT, geo, mtl);
    m.node(id).set_name(name).set_pos(x, y, z);
    rot3(m, id, rx, ry, rz);
    id
}

/// The `span(name, m, r, a, b)` closure of `buildCatapult`
/// (`units.ts:3383-3396`): a 6-sided cylinder of radius `r` between `a` and
/// `b` (`len = Math.hypot`, axis `(d / len)` — a division, not
/// `normalize()`).
fn span(m: &mut UnitModel, name: &str, mtl: MatId, r: f64, a: [f64; 3], b: [f64; 3]) {
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    let dz = b[2] - a[2];
    let len = js_hypot_n(&[dx, dy, dz]);
    let id = m.add_mesh_id(ROOT, cy(r, r, len, 6), mtl);
    m.node(id)
        .set_name(name)
        .set_pos(
            (a[0] + b[0]) / 2.0,
            (a[1] + b[1]) / 2.0,
            (a[2] + b[2]) / 2.0,
        )
        .quat_from_unit_vectors(Y_UP, v3(dx / len, dy / len, dz / len));
}

const fn lr(s: f64) -> &'static str {
    if s < 0.0 {
        "left"
    } else {
        "right"
    }
}

/// `buildCatapult(ownerColor)` (`units.ts:3348-3600`): the onager.
#[must_use]
#[allow(clippy::too_many_lines)]
pub fn build_catapult(owner: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let m_wood = m.mat(COLOR_WOOD, 0.06, 0.82);
    let m_dk_wood = m.mat(0x004a_3018, 0.04, 0.88);
    let m_iron = m.mat(COLOR_STEEL, 0.55, 0.40);
    let m_dk_iron = m.mat(COLOR_DARK_STEEL, 0.45, 0.55);
    let m_rope = m.mat(0x009a_8060, 0.04, 0.90);
    let m_sack = m.mat(0x00bd_ae8c, 0.03, 0.94);
    let m_stone = m.mat(0x0070_7878, 0.08, 0.85);
    let m_owner = m.mat(owner, 0.12, 0.70);

    let u = 1.06 * HEX_R;
    let modu = 0.068 * u;
    let arm_r_root = modu * 0.382;
    let arm_r_tip = modu * 0.235;
    let stone_r = modu * 0.618;

    let wheel_r = 0.067 * u;
    let axle_r = 0.017 * u;
    let axle_y = wheel_r;
    let axle_z = -0.060 * u;
    let frame_bot = axle_y + axle_r;
    let frame_h = 0.048 * u;
    let frame_top = frame_bot + frame_h;
    let frame_x = 0.112 * u;
    let frame_hw = modu * 0.382;
    let frame_z0 = -0.276 * u;
    let frame_z1 = 0.250 * u;
    let wheel_x = frame_x + frame_hw + 0.017 * u;

    add(
        &mut m,
        "kt-axle",
        cy(axle_r, axle_r, 0.350 * u, 10),
        m_dk_iron,
        0.0,
        axle_y,
        axle_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    for s in [-1.0_f64, 1.0] {
        let side = lr(s);
        add(
            &mut m,
            &format!("kt-wheel-{side}"),
            cy(wheel_r - 0.004 * u, wheel_r - 0.004 * u, 0.030 * u, 16),
            m_wood,
            s * wheel_x,
            axle_y,
            axle_z,
            0.0,
            0.0,
            PI / 2.0,
        );
        add(
            &mut m,
            &format!("kt-wheel-tyre-{side}"),
            cy(wheel_r, wheel_r, 0.032 * u, 16),
            m_dk_iron,
            s * wheel_x,
            axle_y,
            axle_z,
            0.0,
            0.0,
            PI / 2.0,
        );
        add(
            &mut m,
            &format!("kt-wheel-hub-{side}"),
            cy(0.024 * u, 0.024 * u, 0.030 * u, 10),
            m_dk_wood,
            s * (wheel_x + 0.002 * u),
            axle_y,
            axle_z,
            0.0,
            0.0,
            PI / 2.0,
        );
    }

    let frame_len = frame_z1 - frame_z0;
    let frame_cz = (frame_z0 + frame_z1) / 2.0;
    for s in [-1.0_f64, 1.0] {
        add(
            &mut m,
            &format!("kt-frame-beam-{}", lr(s)),
            bx(frame_hw * 2.0, frame_h, frame_len),
            m_wood,
            s * frame_x,
            frame_bot + frame_h / 2.0,
            frame_cz,
            0.0,
            0.0,
            0.0,
        );
    }
    let cross_w = (frame_x + frame_hw) * 2.0;
    let bed_z = -0.182 * u;
    add(
        &mut m,
        "kt-frame-cross-rear",
        bx(cross_w, frame_h, 0.090 * u),
        m_wood,
        0.0,
        frame_bot + frame_h / 2.0,
        bed_z,
        0.0,
        0.0,
        0.0,
    );
    let pivot_z = 0.110 * u;
    add(
        &mut m,
        "kt-frame-cross-skein",
        bx(cross_w, frame_h, 0.060 * u),
        m_wood,
        0.0,
        frame_bot + frame_h / 2.0,
        pivot_z,
        0.0,
        0.0,
        0.0,
    );
    let sill_z = 0.222 * u;
    add(
        &mut m,
        "kt-frame-sill-front",
        bx(0.250 * u, frame_bot, 0.050 * u),
        m_dk_wood,
        0.0,
        frame_bot / 2.0,
        sill_z,
        0.0,
        0.0,
        0.0,
    );

    let post_hw = 0.024 * u;
    let post_hd = 0.034 * u;
    let post_top = 0.360 * u;
    let pivot_y = 0.312 * u;
    let skein_r = modu / 2.0;
    let post_x = 0.106 * u;
    for s in [-1.0_f64, 1.0] {
        add(
            &mut m,
            &format!("kt-skein-post-{}", lr(s)),
            bx(post_hw * 2.0, post_top - frame_top, post_hd * 2.0),
            m_dk_wood,
            s * post_x,
            (frame_top + post_top) / 2.0,
            pivot_z,
            0.0,
            0.0,
            0.0,
        );
    }
    add(
        &mut m,
        "kt-skein-bundle",
        cy(skein_r, skein_r, (post_x + post_hw) * 2.0, 12),
        m_rope,
        0.0,
        pivot_y,
        pivot_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    for s in [-1.0_f64, 1.0] {
        let side = lr(s);
        add(
            &mut m,
            &format!("kt-skein-washer-{side}"),
            cy(0.036 * u, 0.036 * u, 0.014 * u, 12),
            m_iron,
            s * (post_x + post_hw + 0.006 * u),
            pivot_y,
            pivot_z,
            0.0,
            0.0,
            PI / 2.0,
        );
        add(
            &mut m,
            &format!("kt-skein-lever-{side}"),
            bx(0.008 * u, 0.064 * u, 0.012 * u),
            m_dk_iron,
            s * (post_x + post_hw + 0.014 * u),
            pivot_y,
            pivot_z,
            0.0,
            0.0,
            s * 0.5,
        );
    }

    let arm_deg = 24.0;
    let arm_len = 0.320 * u;
    let arm_rx = -(PI / 2.0 - arm_deg * PI / 180.0);
    let arm_dy = js_cos(arm_rx);
    let arm_dz = js_sin(arm_rx);
    let on_arm = |t: f64| [0.0, pivot_y + arm_dy * t, pivot_z + arm_dz * t];

    {
        let [ax, ay, az] = on_arm(arm_len / 2.0);
        add(
            &mut m,
            "kt-arm",
            cy(arm_r_tip, arm_r_root, arm_len, 8),
            m_dk_wood,
            ax,
            ay,
            az,
            arm_rx,
            0.0,
            0.0,
        );
    }
    {
        let [hx, hy, hz] = on_arm(0.014 * u);
        add(
            &mut m,
            "kt-arm-heel",
            cy(0.030 * u, 0.030 * u, 0.070 * u, 8),
            m_dk_iron,
            hx,
            hy,
            hz,
            arm_rx,
            0.0,
            0.0,
        );
    }
    let hook_t = arm_len - 0.010 * u;
    let [hook_x, hook_y, hook_z] = on_arm(hook_t);
    add(
        &mut m,
        "kt-arm-hook",
        torus(0.017 * u, 0.006 * u, 6, 10),
        m_iron,
        hook_x,
        hook_y - 0.016 * u,
        hook_z,
        0.0,
        PI / 2.0,
        0.0,
    );
    let winch_t = 0.240 * u;
    let [wx, wy, wz] = on_arm(winch_t);
    add(
        &mut m,
        "kt-arm-winch-eye",
        torus(0.013 * u, 0.005 * u, 6, 10),
        m_iron,
        wx,
        wy,
        wz,
        PI / 2.0,
        0.0,
        0.0,
    );

    let pouch_h = 0.034 * u;
    let pouch_y = frame_top + pouch_h / 2.0;
    add(
        &mut m,
        "kt-sling-pouch",
        bx(0.090 * u, pouch_h, 0.086 * u),
        m_rope,
        0.0,
        pouch_y,
        hook_z,
        0.0,
        0.0,
        0.0,
    );
    add(
        &mut m,
        "kt-stone",
        sph_full(stone_r, 10, 8),
        m_stone,
        0.0,
        pouch_y + pouch_h / 2.0 + stone_r - 0.020 * u,
        hook_z,
        0.0,
        0.0,
        0.0,
    );
    let cord_top_y = hook_y - 0.016 * u;
    let cord_bot_y = pouch_y + pouch_h / 2.0;
    for s in [-1.0_f64, 1.0] {
        span(
            &mut m,
            &format!("kt-sling-cord-{}", lr(s)),
            m_rope,
            0.005 * u,
            [0.0, cord_top_y, hook_z],
            [s * 0.040 * u, cord_bot_y, hook_z],
        );
    }

    let stop_z = 0.222 * u;
    let stop_top = 0.506 * u;
    let beam_h = 0.050 * u;
    let pad_h = 0.056 * u;
    let beam_y = stop_top + beam_h / 2.0;
    let pad_y = stop_top + beam_h + pad_h / 2.0;
    for s in [-1.0_f64, 1.0] {
        add(
            &mut m,
            &format!("kt-stop-post-{}", lr(s)),
            bx(0.052 * u, stop_top - frame_top, 0.050 * u),
            m_dk_wood,
            s * frame_x,
            (frame_top + stop_top) / 2.0,
            stop_z,
            0.0,
            0.0,
            0.0,
        );
    }
    add(
        &mut m,
        "kt-stop-beam",
        bx(0.260 * u, beam_h, 0.048 * u),
        m_wood,
        0.0,
        beam_y,
        stop_z,
        0.0,
        0.0,
        0.0,
    );
    add(
        &mut m,
        "kt-stop-pad",
        bx(0.176 * u, pad_h, 0.072 * u),
        m_sack,
        0.0,
        pad_y,
        stop_z,
        0.0,
        0.0,
        0.0,
    );
    for s in [-1.0_f64, 1.0] {
        add(
            &mut m,
            &format!("kt-stop-strap-{}", lr(s)),
            bx(0.010 * u, pad_h + 0.014 * u, 0.080 * u),
            m_rope,
            s * 0.070 * u,
            pad_y,
            stop_z,
            0.0,
            0.0,
            0.0,
        );
    }

    let win_z = -0.248 * u;
    let win_y = 0.180 * u;
    let win_r = 0.024 * u;
    let win_top = win_y + 0.024 * u;
    let block_top = win_y + 0.046 * u;
    for s in [-1.0_f64, 1.0] {
        add(
            &mut m,
            &format!("kt-windlass-block-{}", lr(s)),
            bx(0.048 * u, block_top - frame_top, 0.048 * u),
            m_dk_wood,
            s * post_x,
            (frame_top + block_top) / 2.0,
            win_z,
            0.0,
            0.0,
            0.0,
        );
    }
    let shaft_x = 0.160 * u;
    add(
        &mut m,
        "kt-windlass-shaft",
        cy(0.012 * u, 0.012 * u, shaft_x * 2.0, 8),
        m_dk_iron,
        0.0,
        win_y,
        win_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    add(
        &mut m,
        "kt-windlass-drum",
        cy(win_r, win_r, 0.190 * u, 12),
        m_wood,
        0.0,
        win_y,
        win_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    let ratchet_x = -0.070 * u;
    let ratchet_r = 0.034 * u;
    add(
        &mut m,
        "kt-windlass-ratchet",
        cy(ratchet_r, ratchet_r, 0.010 * u, 12),
        m_dk_iron,
        ratchet_x,
        win_y,
        win_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    add(
        &mut m,
        "kt-trigger-bolt",
        cy(0.007 * u, 0.007 * u, 0.070 * u, 8),
        m_iron,
        -0.104 * u,
        win_y + 0.030 * u,
        win_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    add(
        &mut m,
        "kt-trigger-head",
        cy(0.013 * u, 0.013 * u, 0.012 * u, 8),
        m_iron,
        -0.143 * u,
        win_y + 0.030 * u,
        win_z,
        0.0,
        0.0,
        PI / 2.0,
    );
    add(
        &mut m,
        "kt-windlass-crank",
        bx(0.012 * u, 0.062 * u, 0.012 * u),
        m_dk_iron,
        0.150 * u,
        win_y + 0.031 * u,
        win_z,
        0.0,
        0.0,
        0.0,
    );
    add(
        &mut m,
        "kt-windlass-grip",
        cy(0.008 * u, 0.008 * u, 0.034 * u, 8),
        m_wood,
        0.157 * u,
        win_y + 0.062 * u,
        win_z,
        0.0,
        0.0,
        PI / 2.0,
    );

    for s in [-1.0_f64, 1.0] {
        span(
            &mut m,
            &format!("kt-winch-rope-{}", lr(s)),
            m_rope,
            0.008 * u,
            [s * 0.032 * u, win_top, win_z],
            [0.0, wy, wz],
        );
    }

    for s in [-1.0_f64, 1.0] {
        let side = lr(s);
        add(
            &mut m,
            &format!("kt-owner-panel-{side}"),
            bx(0.006 * u, 0.036 * u, 0.190 * u),
            m_owner,
            s * (frame_x + frame_hw - 0.001 * u),
            frame_bot + frame_h / 2.0,
            0.125 * u,
            0.0,
            0.0,
            0.0,
        );
        add(
            &mut m,
            &format!("kt-owner-cap-{side}"),
            bx(0.012 * u, beam_h + 0.008 * u, 0.056 * u),
            m_owner,
            s * 0.134 * u,
            beam_y,
            stop_z,
            0.0,
            0.0,
            0.0,
        );
    }
    m
}
