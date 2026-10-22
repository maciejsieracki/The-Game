//! `buildBaseAvatar` and the shared gear sub-assemblies of `render/units.ts`
//! (`edb8fb56`, lines 763-979, 1145-1279, 4782-4800). Every helper adds
//! meshes to the model's root group, exactly like the web helpers add to
//! `group`; per-token geometries are plain [`Prim`] values (the web
//! `perTokenGeos` list only exists for GPU disposal).

use super::consts::*;
use super::model::{Geo, MatId, Prim, UnitModel, ROOT};
use super::parts::UnitPart;
use std::f64::consts::PI;

pub(crate) fn part(p: UnitPart) -> Geo {
    p.geo()
}
pub(crate) fn bx(w: f64, h: f64, d: f64) -> Geo {
    Geo::Prim(Prim::bx(w, h, d))
}
pub(crate) fn cyl(rt: f64, rb: f64, h: f64, radial: u32) -> Geo {
    Geo::Prim(Prim::cyl(rt, rb, h, radial))
}

/// `addOwnerHelmStripe(group, mOwner, perGeo, yOffset = 0.018)` (`units.ts:763-774`).
pub fn add_owner_helm_stripe(m: &mut UnitModel, m_owner: MatId, y_offset: f64) {
    m.add_mesh(
        ROOT,
        bx(0.160 * HEX_R, 0.026 * HEX_R, 0.160 * HEX_R),
        m_owner,
    )
    .set_pos(0.0, AV_Y_HEAD_CTR + y_offset * HEX_R, 0.0);
}

/// `buildBaseAvatar(skin, cloth, owner)` (`units.ts:794-871`): R6 box
/// avatar, feet at y = 0, eyes on +Z. Returns the model (its tracked
/// materials are the web `mats` list the callers keep appending to).
#[must_use]
pub fn build_base_avatar(skin_color: u32, cloth_color: u32, owner_col: u32) -> UnitModel {
    let mut m = UnitModel::new();
    let g = ROOT;
    let m_skin = m.mat(skin_color, 0.05, 0.80);
    let m_cloth = m.mat(cloth_color, 0.05, 0.85);
    let m_trouse = m.mat(COLOR_TROUSERS, 0.05, 0.85);
    let m_eye = m.mat(COLOR_DARK_EYE, 0.02, 0.95);
    let m_sash = m.mat(owner_col, 0.08, 0.70);

    m.add_mesh(g, part(UnitPart::AvLeg), m_trouse).set_pos(
        -(AV_LEG_SEP + AV_LEG_W * 0.5),
        AV_Y_LEG_CTR,
        0.0,
    );
    m.add_mesh(g, part(UnitPart::AvLeg), m_trouse).set_pos(
        AV_LEG_SEP + AV_LEG_W * 0.5,
        AV_Y_LEG_CTR,
        0.0,
    );
    m.add_mesh(g, part(UnitPart::AvTorso), m_cloth)
        .set_pos(0.0, AV_Y_TORSO_CTR, 0.0);
    m.add_mesh(g, part(UnitPart::Sash), m_sash).set_pos(
        0.0,
        AV_Y_TORSO_CTR - 0.01 * HEX_R,
        AV_TORSO_D * 0.5 + 0.003 * HEX_R,
    );
    m.add_mesh(g, part(UnitPart::AvArm), m_cloth)
        .set_pos(-AV_ARM_OFFSET_X, AV_Y_ARM_CTR, 0.0);
    m.add_mesh(g, part(UnitPart::AvArm), m_cloth)
        .set_pos(AV_ARM_OFFSET_X, AV_Y_ARM_CTR, 0.0);
    m.add_mesh(g, part(UnitPart::AvNeck), m_cloth)
        .set_pos(0.0, AV_Y_NECK_CTR, 0.0);
    m.add_mesh(g, part(UnitPart::AvHead), m_skin)
        .set_pos(0.0, AV_Y_HEAD_CTR, 0.0);
    let eye_z = AV_HEAD_S * 0.5 + 0.003 * HEX_R;
    let eye_y = AV_Y_HEAD_CTR + 0.010 * HEX_R;
    let eye_x_off = 0.030 * HEX_R;
    m.add_mesh(g, part(UnitPart::AvEye), m_eye)
        .set_pos(-eye_x_off, eye_y, eye_z);
    m.add_mesh(g, part(UnitPart::AvEye), m_eye)
        .set_pos(eye_x_off, eye_y, eye_z);
    m
}

const LEG_XS: [f64; 2] = [-(AV_LEG_SEP + AV_LEG_W * 0.5), AV_LEG_SEP + AV_LEG_W * 0.5];

/// `addGreaves` (`units.ts:910-917`).
pub fn add_greaves(m: &mut UnitModel, m_bronze: MatId) {
    let yc = AV_Y_LEG_BOT + 0.075 * HEX_R;
    for sx in LEG_XS {
        m.add_mesh(ROOT, part(UnitPart::Greave), m_bronze)
            .set_pos(sx, yc, 0.004 * HEX_R);
    }
}

/// `addPteruges` (`units.ts:920-924`).
pub fn add_pteruges(m: &mut UnitModel, m_strip: MatId) {
    m.add_mesh(ROOT, part(UnitPart::MailSkirt), m_strip)
        .set_pos(0.0, AV_Y_TORSO_BOT + 0.012 * HEX_R, 0.0);
}

/// `addHipSword(group, mScab, mHilt, side)` (`units.ts:931-942`).
pub fn add_hip_sword(m: &mut UnitModel, m_scab: MatId, m_hilt: MatId, side: f64) {
    let x = side * (AV_TORSO_W * 0.5 + 0.030 * HEX_R);
    let yc = AV_Y_TORSO_BOT + 0.02 * HEX_R;
    m.add_mesh(ROOT, part(UnitPart::Scabbard), m_scab)
        .rot_z(side * 0.12)
        .set_pos(x, yc, 0.045 * HEX_R);
    m.add_mesh(ROOT, part(UnitPart::SwordGrip), m_hilt).set_pos(
        x + side * 0.012 * HEX_R,
        yc + 0.085 * HEX_R,
        0.045 * HEX_R,
    );
}

/// `addBoots` (`units.ts:949-955`).
pub fn add_boots(m: &mut UnitModel, m_boot: MatId) {
    for sx in LEG_XS {
        m.add_mesh(ROOT, part(UnitPart::Boot), m_boot).set_pos(
            sx,
            AV_Y_LEG_BOT + 0.022 * HEX_R,
            0.018 * HEX_R,
        );
    }
}

/// `addHands` (`units.ts:958-965`).
pub fn add_hands(m: &mut UnitModel, m_hand: MatId) {
    let yc = AV_Y_ARM_CTR - AV_ARM_H * 0.5 + 0.022 * HEX_R;
    for sx in [-AV_ARM_OFFSET_X, AV_ARM_OFFSET_X] {
        m.add_mesh(ROOT, part(UnitPart::Hand), m_hand)
            .set_pos(sx, yc, 0.004 * HEX_R);
    }
}

/// `addBelt(group, mBelt, dy = 0.025)` (`units.ts:968-972`).
pub fn add_belt(m: &mut UnitModel, m_belt: MatId, dy: f64) {
    m.add_mesh(ROOT, part(UnitPart::BeltP), m_belt)
        .set_pos(0.0, AV_Y_TORSO_BOT + dy * HEX_R, 0.0);
}

/// `addTunicHem` (`units.ts:975-979`).
pub fn add_tunic_hem(m: &mut UnitModel, m_hem: MatId) {
    m.add_mesh(ROOT, part(UnitPart::TunicHem), m_hem).set_pos(
        0.0,
        AV_Y_TORSO_BOT - 0.018 * HEX_R,
        0.0,
    );
}

/// `addTorc` (`units.ts:1145-1160`).
pub fn add_torc(m: &mut UnitModel, m_torc: MatId) {
    let torus = Geo::Prim(Prim::Torus {
        r: 0.052 * HEX_R,
        tube: 0.012 * HEX_R,
        radial: 6,
        tubular: 14,
        arc: PI * 1.7,
    });
    m.add_mesh(ROOT, torus, m_torc).rot_x(PI / 2.0).set_pos(
        0.0,
        AV_Y_TORSO_TOP - 0.004 * HEX_R,
        0.004 * HEX_R,
    );
    for sx in [-1.0_f64, 1.0] {
        m.add_mesh(
            ROOT,
            bx(0.020 * HEX_R, 0.020 * HEX_R, 0.020 * HEX_R),
            m_torc,
        )
        .set_pos(
            sx * 0.040 * HEX_R,
            AV_Y_TORSO_TOP - 0.004 * HEX_R,
            0.050 * HEX_R,
        );
    }
}

fn named(m: &mut UnitModel, id: usize, prefix: &str, suffix: &str) {
    if !prefix.is_empty() {
        let name = format!("{prefix}{suffix}");
        m.node(id).set_name(&name);
    }
}

/// `addTallOvalShield(group, mFace, mSpine, mBoss, perGeo, heightScale = 1.75,
/// namePrefix = '')` (`units.ts:1192-1218`).
pub fn add_tall_oval_shield(
    m: &mut UnitModel,
    m_face: MatId,
    m_spine: MatId,
    m_boss: MatId,
    height_scale: f64,
    name_prefix: &str,
) {
    let sh_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.016 * HEX_R);
    let sh_z = 0.046 * HEX_R;
    let face_half_t = 0.018 * HEX_R * 0.92 * 0.5;
    let id = m.add_mesh_id(ROOT, part(UnitPart::OvalShield), m_face);
    m.node(id)
        .rot_x(PI / 2.0)
        .set_scale(1.0, 0.92, height_scale)
        .set_pos(sh_x, AV_Y_TORSO_CTR, sh_z);
    named(m, id, name_prefix, "-shield-face");
    let id = m.add_mesh_id(
        ROOT,
        bx(0.022 * HEX_R, 0.255 * HEX_R, 0.020 * HEX_R),
        m_spine,
    );
    m.node(id)
        .set_pos(sh_x, AV_Y_TORSO_CTR, sh_z + face_half_t + 0.008 * HEX_R);
    named(m, id, name_prefix, "-shield-spine");
    let id = m.add_mesh_id(ROOT, part(UnitPart::ShieldBoss), m_boss);
    m.node(id)
        .rot_x(PI / 2.0)
        .set_pos(sh_x, AV_Y_TORSO_CTR, sh_z + face_half_t + 0.009 * HEX_R);
    named(m, id, name_prefix, "-shield-boss");
}

/// `addLongSwordRight(group, mBlade, mHilt, perGeo, bladeLen = 0.30,
/// namePrefix = '')` (`units.ts:1221-1241`).
pub fn add_long_sword_right(
    m: &mut UnitModel,
    m_blade: MatId,
    m_hilt: MatId,
    blade_len: f64,
    name_prefix: &str,
) {
    let x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.018 * HEX_R;
    let id = m.add_mesh_id(
        ROOT,
        bx(0.022 * HEX_R, 0.060 * HEX_R, 0.022 * HEX_R),
        m_hilt,
    );
    m.node(id)
        .set_pos(x, AV_Y_TORSO_CTR - 0.01 * HEX_R, 0.02 * HEX_R);
    named(m, id, name_prefix, "-sword-grip");
    let id = m.add_mesh_id(ROOT, part(UnitPart::SwordCross), m_hilt);
    m.node(id)
        .set_pos(x, AV_Y_TORSO_CTR + 0.030 * HEX_R, 0.02 * HEX_R);
    named(m, id, name_prefix, "-sword-cross");
    let id = m.add_mesh_id(
        ROOT,
        bx(0.026 * HEX_R, blade_len * HEX_R, 0.012 * HEX_R),
        m_blade,
    );
    m.node(id).set_pos(
        x,
        AV_Y_TORSO_CTR + 0.030 * HEX_R + blade_len * HEX_R * 0.5,
        0.02 * HEX_R,
    );
    named(m, id, name_prefix, "-sword-blade");
}

/// `addSpearRight(group, mWood, mTip, perGeo, shaftLen = 0.48, namePrefix = '')`
/// (`units.ts:1244-1261`).
pub fn add_spear_right(
    m: &mut UnitModel,
    m_wood: MatId,
    m_tip: MatId,
    shaft_len: f64,
    name_prefix: &str,
) {
    let x = AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.014 * HEX_R;
    let bot = AV_Y_LEG_BOT + 0.01 * HEX_R;
    let ctr = bot + shaft_len * HEX_R * 0.5;
    let top = bot + shaft_len * HEX_R;
    let id = m.add_mesh_id(
        ROOT,
        bx(0.015 * HEX_R, shaft_len * HEX_R, 0.015 * HEX_R),
        m_wood,
    );
    m.node(id).set_pos(x, ctr, 0.01 * HEX_R);
    named(m, id, name_prefix, "-spear-shaft");
    let id = m.add_mesh_id(ROOT, part(UnitPart::SpearTip), m_tip);
    m.node(id).set_pos(x, top + 0.028 * HEX_R, 0.01 * HEX_R);
    named(m, id, name_prefix, "-spear-tip");
}

/// `addMustache` (`units.ts:1264-1270`).
pub fn add_mustache(m: &mut UnitModel, m_hair: MatId) {
    m.add_mesh(
        ROOT,
        bx(0.075 * HEX_R, 0.022 * HEX_R, 0.012 * HEX_R),
        m_hair,
    )
    .set_pos(
        0.0,
        AV_Y_HEAD_CTR - 0.028 * HEX_R,
        AV_HEAD_S * 0.5 + 0.004 * HEX_R,
    );
}

/// `addLongHair` (`units.ts:1273-1279`).
pub fn add_long_hair(m: &mut UnitModel, m_hair: MatId) {
    m.add_mesh(
        ROOT,
        bx(0.150 * HEX_R, 0.120 * HEX_R, 0.060 * HEX_R),
        m_hair,
    )
    .set_pos(
        0.0,
        AV_Y_HEAD_CTR + 0.010 * HEX_R,
        -AV_HEAD_S * 0.5 - 0.018 * HEX_R,
    );
}

/// `addSuperBanner(group, mPole, mFlag, mFin, perGeo)` (`units.ts:4782-4800`).
pub fn add_super_banner(m: &mut UnitModel, m_pole: MatId, m_flag: MatId, m_fin: MatId) {
    let pole_x = -(AV_ARM_OFFSET_X + AV_ARM_W * 0.5 + 0.030 * HEX_R);
    let pole_ctr_y = AV_Y_LEG_BOT + 0.33 * HEX_R * 0.5;
    let pole_top_y = AV_Y_LEG_BOT + 0.33 * HEX_R;
    m.add_mesh(ROOT, part(UnitPart::BannerPole), m_pole)
        .set_scale(1.0, 1.1, 1.0)
        .set_pos(pole_x, pole_ctr_y, -0.02 * HEX_R);
    m.add_mesh(ROOT, part(UnitPart::BannerFlag), m_flag)
        .set_pos(
            pole_x - 0.047 * HEX_R,
            pole_top_y - 0.036 * HEX_R,
            -0.02 * HEX_R,
        );
    m.add_mesh(ROOT, bx(0.024 * HEX_R, 0.024 * HEX_R, 0.024 * HEX_R), m_fin)
        .set_pos(pole_x, pole_top_y + 0.012 * HEX_R, -0.02 * HEX_R);
}
