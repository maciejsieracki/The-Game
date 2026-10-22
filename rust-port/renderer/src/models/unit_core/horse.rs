//! Port of `render/kon-nowy-model.ts` (`edb8fb56`): the shared horse
//! (`buildHorse`, used by cavalry, chariots, the stud farm and the horse
//! deposit), the unused `addRiderLegs` export and `buildZlozeKonie`.

use super::consts::HEX_R;
use super::jstrig::JsTrig;
use super::model::{Geo, MatId, Material, NodeId, UnitModel, ROOT};
use super::parts::HorsePart;
use crate::geom::Vec3;
use std::f64::consts::PI;

const NH_BODY_CTR: f64 = 0.221 * HEX_R;
const NH_BACK_Y: f64 = 0.296 * HEX_R;
const NH_LEG_TOP_F: f64 = 0.196 * HEX_R;
const NH_LEG_TOP_R: f64 = 0.200 * HEX_R;

fn hp(p: HorsePart) -> Geo {
    p.geo()
}

/// `nhChainSeg` (`kon-nowy-model.ts:94-105`).
#[allow(clippy::too_many_arguments)]
fn nh_chain_seg(
    m: &mut UnitModel,
    group: NodeId,
    geo: Geo,
    mtl: MatId,
    p: Vec3,
    theta: f64,
    len: f64,
    phase: f64,
) -> Vec3 {
    let dir = Vec3::new(0.0, theta.js_cos(), theta.js_sin());
    let n = m.add_mesh(group, geo, mtl);
    n.rot_x(theta);
    if phase != 0.0 {
        n.rot_y(phase);
    }
    n.set_pos_v(p.plus(dir.scale(len * 0.5)));
    p.plus(dir.scale(len))
}

/// `nhBuildLeg` (`kon-nowy-model.ts:113-139`).
#[allow(clippy::too_many_arguments)]
fn nh_build_leg(
    m: &mut UnitModel,
    group: NodeId,
    m_horse: MatId,
    m_hoof: MatId,
    sx: f64,
    z_piv: f64,
    y_piv: f64,
    th_u: f64,
    th_l: f64,
    rear: bool,
    cx: f64,
    cz: f64,
) {
    let lu = if rear { 0.092 * HEX_R } else { 0.088 * HEX_R };
    let ll = 0.080 * HEX_R;
    let d_u = Vec3::new(0.0, -th_u.js_cos(), -th_u.js_sin());
    let d_l = Vec3::new(0.0, -th_l.js_cos(), -th_l.js_sin());
    let p0 = Vec3::new(cx + sx, y_piv, cz + z_piv);
    let p1 = p0.plus(d_u.scale(lu));
    let p2 = p1.plus(d_l.scale(ll));

    let up = if rear {
        HorsePart::UpRear
    } else {
        HorsePart::UpFrnt
    };
    m.add_mesh(group, hp(up), m_horse)
        .rot_x(-th_u)
        .set_pos_v(p0.plus(d_u.scale(lu * 0.5)));
    m.add_mesh(group, hp(HorsePart::Lower), m_horse)
        .rot_x(-th_l)
        .set_pos_v(p1.plus(d_l.scale(ll * 0.5 - 0.010 * HEX_R)));
    m.add_mesh(group, hp(HorsePart::Hoof), m_hoof).set_pos(
        p2.x,
        p2.y - 0.0096 * HEX_R,
        p2.z - 0.004 * HEX_R,
    );
}

/// `buildHorse(group, mat, mHorse, mMane, mHarn, cx, cz)`
/// (`kon-nowy-model.ts:153-269`). Adds the horse meshes to `group` (head
/// toward −Z, hooves on y = 0) and returns the back height (rider seat).
/// The web material factory argument is unused there (`void mat`), so it is
/// not a parameter here.
pub fn build_horse(
    m: &mut UnitModel,
    group: NodeId,
    m_horse: MatId,
    m_mane: MatId,
    m_harn: Option<MatId>,
    cx: f64,
    cz: f64,
) -> f64 {
    // body: barrel + chest + rump + withers
    m.add_mesh(group, hp(HorsePart::Barrel), m_horse)
        .rot_x(-PI / 2.0)
        .rot_y(PI / 7.0)
        .set_scale(0.82, 1.0, 1.06)
        .set_pos(cx, NH_BODY_CTR, cz + 0.004 * HEX_R);
    m.add_mesh(group, hp(HorsePart::Chest), m_horse)
        .set_scale(0.80, 1.00, 0.95)
        .set_pos(cx, NH_BODY_CTR + 0.002 * HEX_R, cz - 0.130 * HEX_R);
    m.add_mesh(group, hp(HorsePart::Rump), m_horse)
        .set_scale(0.86, 0.98, 1.12)
        .set_pos(cx, NH_BODY_CTR - 0.004 * HEX_R, cz + 0.130 * HEX_R);
    m.add_mesh(group, hp(HorsePart::Withers), m_horse)
        .rot_x(-0.22)
        .set_pos(cx, NH_BODY_CTR + 0.046 * HEX_R, cz - 0.088 * HEX_R);

    // arched neck: 3 chained segments
    let thetas = [-1.02, -0.62, -0.26];
    let lens = [0.082 * HEX_R, 0.072 * HEX_R, 0.058 * HEX_R];
    let geos = [HorsePart::Neck1, HorsePart::Neck2, HorsePart::Neck3];
    let mut p = Vec3::new(cx, NH_BODY_CTR + 0.032 * HEX_R, cz - 0.140 * HEX_R);
    let mut neck_pts = vec![p];
    for i in 0..3 {
        p = nh_chain_seg(
            m,
            group,
            hp(geos[i]),
            m_horse,
            p,
            thetas[i],
            lens[i],
            PI / 6.0,
        );
        neck_pts.push(p);
    }

    // head: skull + muzzle + ears
    let head_p = Vec3::new(cx, p.y + 0.012 * HEX_R, p.z - 0.022 * HEX_R);
    m.add_mesh(group, hp(HorsePart::Skull), m_horse)
        .rot_x(-0.20)
        .set_pos_v(head_p);
    let muz_dir = Vec3::new(0.0, -0.31, -0.951);
    m.add_mesh(group, hp(HorsePart::Muzzle), m_horse)
        .rot_x(-1.886)
        .rot_y(PI / 4.0)
        .set_pos_v(
            head_p
                .plus(Vec3::new(0.0, -0.012 * HEX_R, -0.036 * HEX_R))
                .plus(muz_dir.scale(0.034 * HEX_R)),
        );
    for side in [-1.0_f64, 1.0] {
        let ear = m.add_mesh(group, hp(HorsePart::Ear), m_horse);
        ear.set_pos(
            cx + side * 0.020 * HEX_R,
            head_p.y + 0.052 * HEX_R,
            head_p.z + 0.016 * HEX_R,
        );
        ear.rot_z(-side * 0.30);
        ear.rot_x(-0.18);
    }

    // mane along the neck + forelock
    let mane_rad = [0.048 * HEX_R, 0.040 * HEX_R, 0.034 * HEX_R];
    for i in 0..3 {
        let th: f64 = thetas[i];
        let mid = neck_pts[i].plus(neck_pts[i + 1]).scale(0.5);
        let perp = Vec3::new(0.0, -th.js_sin(), th.js_cos());
        let seg = m.add_mesh(group, hp(HorsePart::Mane), m_mane);
        seg.scale.y = (lens[i] / (0.100 * HEX_R)) * 1.12;
        seg.rot_x(th);
        seg.set_pos_v(mid.plus(perp.scale(mane_rad[i])));
    }
    m.add_mesh(group, hp(HorsePart::Fore), m_mane)
        .rot_x(-0.72)
        .set_pos(cx, head_p.y + 0.040 * HEX_R, head_p.z - 0.026 * HEX_R);

    // jointed legs, dynamic stride
    let x = 0.052 * HEX_R;
    nh_build_leg(
        m,
        group,
        m_horse,
        m_mane,
        x,
        -0.118 * HEX_R,
        NH_LEG_TOP_F,
        0.10,
        -0.06,
        false,
        cx,
        cz,
    );
    nh_build_leg(
        m,
        group,
        m_horse,
        m_mane,
        -x,
        -0.110 * HEX_R,
        0.206 * HEX_R,
        1.00,
        -0.18,
        false,
        cx,
        cz,
    );
    nh_build_leg(
        m,
        group,
        m_horse,
        m_mane,
        -x,
        0.116 * HEX_R,
        NH_LEG_TOP_R,
        -0.34,
        -0.10,
        true,
        cx,
        cz,
    );
    nh_build_leg(
        m,
        group,
        m_horse,
        m_mane,
        x,
        0.116 * HEX_R,
        NH_LEG_TOP_R,
        0.24,
        0.04,
        true,
        cx,
        cz,
    );

    // tail: root up-back + falling strand
    let t = Vec3::new(cx, NH_BODY_CTR + 0.034 * HEX_R, cz + 0.196 * HEX_R);
    let t = nh_chain_seg(
        m,
        group,
        hp(HorsePart::Tail1),
        m_mane,
        t,
        1.10,
        0.048 * HEX_R,
        0.0,
    );
    nh_chain_seg(
        m,
        group,
        hp(HorsePart::Tail2),
        m_mane,
        t,
        2.76,
        0.108 * HEX_R,
        0.0,
    );

    // harness (chariot / onager)
    if let Some(harn) = m_harn {
        m.add_mesh(group, hp(HorsePart::Girth), harn)
            .rot_x(-PI / 2.0)
            .rot_y(PI / 7.0)
            .set_scale(0.85, 1.0, 1.09)
            .set_pos(cx, NH_BODY_CTR, cz + 0.042 * HEX_R);
        m.add_mesh(group, hp(HorsePart::Breast), harn).set_pos(
            cx,
            NH_BODY_CTR + 0.016 * HEX_R,
            cz - 0.196 * HEX_R,
        );
    }

    NH_BACK_Y
}

/// `addRiderLegs(group, mCloth, mBoot, riderBotY)` (`kon-nowy-model.ts:278-301`,
/// exported but unused in the game — ported per D-MOD-3 = B).
pub fn add_rider_legs(
    m: &mut UnitModel,
    group: NodeId,
    m_cloth: MatId,
    m_boot: MatId,
    rider_bot_y: f64,
) {
    use super::model::Prim;
    let g_thigh = Geo::Prim(Prim::bx(0.042 * HEX_R, 0.088 * HEX_R, 0.048 * HEX_R));
    let g_shin = Geo::Prim(Prim::bx(0.026 * HEX_R, 0.086 * HEX_R, 0.030 * HEX_R));
    let g_boot = Geo::Prim(Prim::bx(0.030 * HEX_R, 0.022 * HEX_R, 0.054 * HEX_R));
    for s in [-1.0_f64, 1.0] {
        m.add_mesh(group, g_thigh.clone(), m_cloth)
            .rot_x(-1.24)
            .set_pos(
                s * 0.064 * HEX_R,
                rider_bot_y + 0.010 * HEX_R,
                -0.020 * HEX_R,
            );
        m.add_mesh(group, g_shin.clone(), m_cloth)
            .rot_x(0.10)
            .set_pos(
                s * 0.076 * HEX_R,
                rider_bot_y - 0.048 * HEX_R,
                -0.058 * HEX_R,
            );
        m.add_mesh(group, g_boot.clone(), m_boot).set_pos(
            s * 0.076 * HEX_R,
            rider_bot_y - 0.094 * HEX_R,
            -0.066 * HEX_R,
        );
    }
}

/// `buildZlozeKonie(hexR = HEX_R)` (`kon-nowy-model.ts:323-342`): one horse
/// near the hex edge for the horse deposit. Its materials are created with
/// `flatShading: true` and are NOT tracked in `userData['mats']`.
#[must_use]
pub fn build_zloze_konie(hex_r: f64) -> UnitModel {
    let mut m = UnitModel::new();
    let std = |c: u32| {
        let mut mt = Material::standard(c, 0.05, 0.85);
        mt.flat_shading = true;
        mt
    };
    // { x: 0.80, z: -0.14, rotY: 2.30, body: 0x6b4a2f, mane: 0x2a1c12 }
    let (kx, kz, rot_y, body, mane) = (0.80, -0.14, 2.30, 0x6b_4a2f_u32, 0x2a_1c12_u32);
    let sub = m.detached_group();
    let m_body = m.untracked_mat(std(body));
    let m_mane = m.untracked_mat(std(mane));
    build_horse(&mut m, sub, m_body, m_mane, None, 0.0, 0.0);
    m.node(sub)
        .set_scale_scalar(0.36)
        .set_pos(kx * hex_r, 0.0, kz * hex_r)
        .rot_y(rot_y);
    m.attach(ROOT, sub);
    m
}
