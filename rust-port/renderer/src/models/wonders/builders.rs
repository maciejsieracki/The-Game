//! Port of `gra/src/render/wonderModels.ts` (pin `edb8fb56`): helpers
//! `box`/`cyl`/`cone`, the 19 wonder builders, the `default` model, the ruin
//! colour (`grey`) and the owner banner.
//!
//! Every expression keeps the web operand order (e.g. `Math.cos(a) * 0.20 * R`
//! is `(cos(a) * 0.20) * R`), so the f64 results are bit-identical as long as
//! the platform `sin`/`cos` agree with V8 for the angles used (verified by
//! `tests/wonders_web_parity.rs`).

use std::f64::consts::{PI, SQRT_2};

use super::js_trig::{js_cos, js_sin};
use super::model::{LambertMaterial, MaterialSlot, Node, Primitive, WonderModel};
use super::model::{MaterialSlot as S, WONDER_MATERIAL_COLORS};
use crate::geom::Vec3;
use crate::pick::hex::{js_round, HEX_R};

/// `R = HEX_R` (`wonderModels.ts:15`).
const R: f64 = HEX_R;

/// `WonderModelOptions` (`wonderModels.ts:8-13`).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct WonderModelOptions {
    /// After an "absolute" — greyed stone (`opts.ruin ?? false`).
    pub ruin: bool,
    /// Owner colour for the banner; `None` = no banner (`opts.ownerColor === undefined`).
    pub owner_color: Option<u32>,
}

/// `WONDER_MODEL_IDS` (`wonderModels.ts:488-493`), in web order.
pub const WONDER_MODEL_IDS: [&str; 19] = [
    "piramidy",
    "wielka_stela",
    "wiszace_ogrody",
    "wyrocznia",
    "roquepertuse",
    "stupa_sanchi",
    "petra",
    "hamonga",
    "kolos",
    "osada_aschaffenburg",
    "ziggurat",
    "mundo_perdido",
    "terakotowa_armia",
    "koloseum",
    "dur_sharrukin",
    "brama_narodow",
    "palac_weiyang",
    "yerkapi",
    "posag_peruna",
];

/// Model registry: the arms of the `switch (wonderId)` in `buildWonderModel`
/// (`wonderModels.ts:453-477`). Any other id (including the 5 parked
/// wonders of epoch 4+) is [`WonderShape::Default`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum WonderShape {
    /// `piramidy` → `egyptianPyramid`.
    EgyptianPyramid,
    /// `wielka_stela` → `obelisk`.
    Obelisk,
    /// `wiszace_ogrody` → `hangingGardens`.
    HangingGardens,
    /// `wyrocznia` → `oracleTemple`.
    OracleTemple,
    /// `roquepertuse` → `gallicOppidum`.
    GallicOppidum,
    /// `stupa_sanchi` → `stupa`.
    Stupa,
    /// `petra` → `rockFacade`.
    RockFacade,
    /// `hamonga` → `trilithon`.
    Trilithon,
    /// `kolos` → `colossus`.
    Colossus,
    /// `osada_aschaffenburg` → `celticWalledSettlement`.
    CelticWalledSettlement,
    /// `ziggurat` → `ziggurat`.
    Ziggurat,
    /// `mundo_perdido` → `mayanPyramid`.
    MayanPyramid,
    /// `terakotowa_armia` → `terracottaPit`.
    TerracottaPit,
    /// `koloseum` → `colosseum`.
    Colosseum,
    /// `dur_sharrukin` → `citadel`.
    Citadel,
    /// `brama_narodow` → `grandGate`.
    GrandGate,
    /// `palac_weiyang` → `palaceWeiyang`.
    PalaceWeiyang,
    /// `yerkapi` → `rampGate`.
    RampGate,
    /// `posag_peruna` → `woodenIdol`.
    WoodenIdol,
    /// `default:` — stone cylinder + gold cone.
    Default,
}

impl WonderShape {
    /// Resolves a wonder id exactly like the web `switch` (exact string match).
    #[must_use]
    pub fn from_id(wonder_id: &str) -> Self {
        match wonder_id {
            "piramidy" => Self::EgyptianPyramid,
            "wielka_stela" => Self::Obelisk,
            "wiszace_ogrody" => Self::HangingGardens,
            "wyrocznia" => Self::OracleTemple,
            "roquepertuse" => Self::GallicOppidum,
            "stupa_sanchi" => Self::Stupa,
            "petra" => Self::RockFacade,
            "hamonga" => Self::Trilithon,
            "kolos" => Self::Colossus,
            "osada_aschaffenburg" => Self::CelticWalledSettlement,
            "ziggurat" => Self::Ziggurat,
            "mundo_perdido" => Self::MayanPyramid,
            "terakotowa_armia" => Self::TerracottaPit,
            "koloseum" => Self::Colosseum,
            "dur_sharrukin" => Self::Citadel,
            "brama_narodow" => Self::GrandGate,
            "palac_weiyang" => Self::PalaceWeiyang,
            "yerkapi" => Self::RampGate,
            "posag_peruna" => Self::WoodenIdol,
            _ => Self::Default,
        }
    }
}

/// `grey(c, ruin)` (`wonderModels.ts:17-26`).
#[must_use]
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)] // 0..=255
pub(crate) fn grey(c: u32, ruin: bool) -> u32 {
    if !ruin {
        return c;
    }
    let r = f64::from((c >> 16) & 255);
    let g = f64::from((c >> 8) & 255);
    let b = c & 255;
    let b = f64::from(b);
    let m = (r + g + b) / 3.0;
    let ch = |v: f64| js_round(v * 0.45 + m * 0.55) as u32;
    (ch(r) << 16) | (ch(g) << 8) | ch(b)
}

fn mat(c: u32, ruin: bool) -> LambertMaterial {
    LambertMaterial {
        color: grey(c, ruin),
        flat_shading: true,
    }
}

// ---------------------------------------------------------------------------
// Helpers (`wonderModels.ts:32-61`). `m` is a material index.

#[allow(clippy::too_many_arguments)]
fn bx(g: &mut Node, w: f64, h: f64, d: f64, x: f64, y: f64, z: f64, m: usize) {
    let mut mesh = Node::mesh(
        Primitive::Box {
            width: w,
            height: h,
            depth: d,
        },
        m,
    );
    mesh.position = Vec3::new(x, y + h / 2.0, z);
    mesh.cast_shadow = true;
    mesh.receive_shadow = true;
    g.children.push(mesh);
}

#[allow(clippy::too_many_arguments)]
fn cyl(g: &mut Node, rt: f64, rb: f64, h: f64, x: f64, y: f64, z: f64, m: usize, seg: u32) {
    let mut mesh = Node::mesh(
        Primitive::Cylinder {
            radius_top: rt,
            radius_bottom: rb,
            height: h,
            radial_segments: seg,
        },
        m,
    );
    mesh.position = Vec3::new(x, y + h / 2.0, z);
    mesh.cast_shadow = true;
    g.children.push(mesh);
}

#[allow(clippy::too_many_arguments)]
fn cone(g: &mut Node, r: f64, h: f64, x: f64, y: f64, z: f64, m: usize, seg: u32) {
    let mut mesh = Node::mesh(
        Primitive::Cone {
            radius: r,
            height: h,
            radial_segments: seg,
        },
        m,
    );
    mesh.position = Vec3::new(x, y + h / 2.0, z);
    mesh.cast_shadow = true;
    g.children.push(mesh);
}

/// Loop counter as a JavaScript number.
fn n(i: i32) -> f64 {
    f64::from(i)
}

// ---------------------------------------------------------------------------
// Builders (`wonderModels.ts:63-418`).

/// `egyptianPyramid` (`:64-70`).
fn egyptian_pyramid(g: &mut Node, sand: usize, gold: usize) {
    let base_w = 0.52 * R;
    let h = 0.48 * R;
    let base_radius = (base_w / 2.0) * SQRT_2;
    cone(g, base_radius, h, 0.0, 0.0, 0.0, sand, 4);
    cone(g, 0.05 * R, 0.08 * R, 0.0, h, 0.0, gold, 4);
}

/// `obelisk` (`:72-76`).
fn obelisk(g: &mut Node, stone: usize, cap: usize) {
    bx(g, 0.14 * R, 0.06 * R, 0.14 * R, 0.0, 0.0, 0.0, stone);
    bx(g, 0.10 * R, 0.52 * R, 0.10 * R, 0.0, 0.06 * R, 0.0, stone);
    cone(g, 0.07 * R, 0.10 * R, 0.0, 0.58 * R, 0.0, cap, 4);
}

/// `hangingGardens` (`:78-87`).
fn hanging_gardens(g: &mut Node, brick: usize, leaf: usize, water: usize) {
    for i in 0..4 {
        let w = (0.50 - n(i) * 0.08) * R;
        let h = 0.07 * R;
        let y = n(i) * 0.08 * R;
        bx(g, w, h, w * 0.72, 0.0, y, 0.0, brick);
        bx(g, w * 0.88, 0.04 * R, w * 0.55, 0.0, y + h, 0.0, leaf);
    }
    bx(
        g,
        0.18 * R,
        0.05 * R,
        0.18 * R,
        0.22 * R,
        0.02 * R,
        0.0,
        water,
    );
}

/// `oracleTemple` (`:89-96`).
fn oracle_temple(g: &mut Node, stone: usize, roof: usize) {
    cyl(g, 0.28 * R, 0.30 * R, 0.05 * R, 0.0, 0.0, 0.0, stone, 6);
    for i in 0..6 {
        let a = (n(i) / 6.0) * PI * 2.0;
        bx(
            g,
            0.05 * R,
            0.18 * R,
            0.05 * R,
            js_cos(a) * 0.20 * R,
            0.05 * R,
            js_sin(a) * 0.20 * R,
            stone,
        );
    }
    cone(g, 0.26 * R, 0.12 * R, 0.0, 0.23 * R, 0.0, roof, 6);
}

/// `stupa` (`:98-103`).
fn stupa(g: &mut Node, white: usize, gold: usize) {
    cyl(g, 0.22 * R, 0.24 * R, 0.08 * R, 0.0, 0.0, 0.0, white, 8);
    cyl(
        g,
        0.18 * R,
        0.20 * R,
        0.10 * R,
        0.0,
        0.08 * R,
        0.0,
        white,
        8,
    );
    cone(g, 0.16 * R, 0.14 * R, 0.0, 0.18 * R, 0.0, gold, 8);
    bx(g, 0.04 * R, 0.10 * R, 0.04 * R, 0.0, 0.32 * R, 0.0, gold);
}

/// `rockFacade` (`:105-111`).
fn rock_facade(g: &mut Node, rock: usize, cave: usize) {
    bx(g, 0.48 * R, 0.38 * R, 0.14 * R, 0.0, 0.08 * R, 0.0, rock);
    bx(
        g,
        0.22 * R,
        0.20 * R,
        0.06 * R,
        0.0,
        0.14 * R,
        0.06 * R,
        cave,
    );
    for sx in [-0.14, 0.14] {
        cyl(
            g,
            0.04 * R,
            0.05 * R,
            0.22 * R,
            sx * R,
            0.0,
            0.10 * R,
            rock,
            4,
        );
    }
}

/// `trilithon` (`:113-118`).
fn trilithon(g: &mut Node, stone: usize) {
    for sx in [-0.16, 0.16] {
        bx(g, 0.10 * R, 0.32 * R, 0.10 * R, sx * R, 0.0, 0.0, stone);
    }
    bx(g, 0.44 * R, 0.08 * R, 0.12 * R, 0.0, 0.32 * R, 0.0, stone);
}

/// `colossus` (`:121-162`).
fn colossus(g: &mut Node, bronze: usize, stone: usize, water: usize, flame: usize) {
    bx(g, 0.14 * R, 0.025 * R, 0.28 * R, 0.0, 0.012 * R, 0.0, water);
    for sx in [-1.0, 1.0] {
        let x = sx * 0.20 * R;
        bx(g, 0.14 * R, 0.07 * R, 0.13 * R, x, 0.0, 0.0, stone);
        bx(g, 0.09 * R, 0.24 * R, 0.09 * R, x, 0.07 * R, 0.0, bronze);
    }
    bx(g, 0.16 * R, 0.20 * R, 0.09 * R, 0.0, 0.31 * R, 0.0, bronze);
    bx(g, 0.18 * R, 0.05 * R, 0.10 * R, 0.0, 0.28 * R, 0.0, bronze);
    bx(g, 0.11 * R, 0.11 * R, 0.09 * R, 0.0, 0.51 * R, 0.0, bronze);
    for i in 0..7 {
        let a = (n(i) / 7.0) * PI * 2.0 - PI / 2.0;
        bx(
            g,
            0.018 * R,
            0.07 * R,
            0.018 * R,
            js_cos(a) * 0.08 * R,
            0.58 * R,
            js_sin(a) * 0.05 * R,
            bronze,
        );
    }
    bx(
        g,
        0.06 * R,
        0.18 * R,
        0.06 * R,
        -0.13 * R,
        0.34 * R,
        0.0,
        bronze,
    );
    bx(
        g,
        0.06 * R,
        0.22 * R,
        0.06 * R,
        0.13 * R,
        0.40 * R,
        0.0,
        bronze,
    );
    cyl(
        g,
        0.045 * R,
        0.05 * R,
        0.035 * R,
        0.13 * R,
        0.52 * R,
        0.0,
        bronze,
        6,
    );
    cone(g, 0.055 * R, 0.10 * R, 0.13 * R, 0.57 * R, 0.0, flame, 4);
}

/// `celticWalledSettlement` (`:165-214`).
#[allow(clippy::similar_names)]
fn celtic_walled_settlement(
    g: &mut Node,
    earth: usize,
    wood: usize,
    thatch: usize,
    stone: usize,
    water: usize,
) {
    let wall_base = 0.10 * R;
    let wall_h = 0.22 * R;
    cyl(g, 0.48 * R, 0.50 * R, wall_base, 0.0, 0.0, 0.0, earth, 12);
    cyl(
        g,
        0.44 * R,
        0.46 * R,
        wall_h,
        0.0,
        wall_base,
        0.0,
        stone,
        12,
    );
    for i in 0..18 {
        let a = (n(i) / 18.0) * PI * 2.0;
        if (a - PI / 2.0).abs() < 0.28 {
            continue;
        }
        let px = js_cos(a) * 0.45 * R;
        let pz = js_sin(a) * 0.45 * R;
        let py = wall_base + wall_h;
        bx(
            g,
            0.020 * R,
            0.09 * R,
            0.020 * R,
            px,
            py + 0.045 * R,
            pz,
            wood,
        );
        cone(g, 0.024 * R, 0.04 * R, px, py + 0.11 * R, pz, wood, 4);
    }
    for sx in [-1.0, 1.0] {
        bx(
            g,
            0.07 * R,
            0.26 * R,
            0.07 * R,
            sx * 0.12 * R,
            wall_base + 0.13 * R,
            0.44 * R,
            stone,
        );
        cone(
            g,
            0.065 * R,
            0.09 * R,
            sx * 0.12 * R,
            wall_base + 0.30 * R,
            0.44 * R,
            thatch,
            4,
        );
    }
    bx(
        g,
        0.22 * R,
        0.05 * R,
        0.06 * R,
        0.0,
        wall_base + 0.24 * R,
        0.44 * R,
        wood,
    );
    bx(
        g,
        0.24 * R,
        0.11 * R,
        0.15 * R,
        0.0,
        wall_base + 0.055 * R,
        0.0,
        wood,
    );
    bx(
        g,
        0.26 * R,
        0.09 * R,
        0.17 * R,
        0.0,
        wall_base + 0.16 * R,
        0.0,
        thatch,
    );
    for sx in [-0.10, -0.03, 0.03, 0.10] {
        bx(
            g,
            0.035 * R,
            0.22 * R,
            0.035 * R,
            sx * R,
            wall_base + 0.055 * R,
            0.06 * R,
            wood,
        );
    }
    let huts: [(f64, f64); 4] = [(-0.17, -0.11), (0.19, -0.09), (-0.13, 0.17), (0.15, 0.15)];
    for (hx, hz) in huts {
        cyl(
            g,
            0.08 * R,
            0.085 * R,
            0.085 * R,
            hx * R,
            wall_base + 0.042 * R,
            hz * R,
            wood,
            10,
        );
        cone(
            g,
            0.10 * R,
            0.10 * R,
            hx * R,
            wall_base + 0.132 * R,
            hz * R,
            thatch,
            10,
        );
    }
    bx(
        g,
        0.38 * R,
        0.022 * R,
        0.09 * R,
        0.0,
        0.011 * R,
        -0.47 * R,
        water,
    );
}

/// `ziggurat` (`:216-232`).
fn ziggurat(g: &mut Node, mud: usize, stair: usize) {
    let tiers = [
        [0.48 * R, 0.09 * R],
        [0.38 * R, 0.08 * R],
        [0.28 * R, 0.07 * R],
        [0.18 * R, 0.06 * R],
    ];
    let mut y = 0.0;
    for [w, h] in tiers {
        bx(g, w, h, w, 0.0, y, 0.0, mud);
        bx(g, 0.06 * R, h, 0.14 * R, 0.20 * R, y, 0.18 * R, stair);
        y += h;
    }
    bx(g, 0.06 * R, 0.10 * R, 0.06 * R, 0.0, y, 0.0, stair);
}

/// `mayanPyramid` (`:234-238`).
fn mayan_pyramid(g: &mut Node, stone: usize, temple: usize) {
    bx(g, 0.44 * R, 0.16 * R, 0.44 * R, 0.0, 0.0, 0.0, stone);
    bx(g, 0.30 * R, 0.12 * R, 0.30 * R, 0.0, 0.16 * R, 0.0, stone);
    bx(g, 0.18 * R, 0.08 * R, 0.14 * R, 0.0, 0.28 * R, 0.0, temple);
}

/// `terracottaPit` (`:240-247`).
fn terracotta_pit(g: &mut Node, clay: usize, earth: usize) {
    bx(g, 0.50 * R, 0.06 * R, 0.36 * R, 0.0, 0.0, 0.0, earth);
    for row in 0..3 {
        for col in -2..=2 {
            bx(
                g,
                0.04 * R,
                0.10 * R,
                0.03 * R,
                n(col) * 0.08 * R,
                0.06 * R,
                (n(row) - 1.0) * 0.09 * R,
                clay,
            );
        }
    }
}

/// `archUnit` (`:249-262`).
#[allow(clippy::too_many_arguments)]
fn arch_unit(
    parent: &mut Node,
    tier_h: f64,
    arch_w: f64,
    pillar_w: f64,
    depth: f64,
    stone: usize,
    dark: usize,
) {
    bx(
        parent,
        pillar_w,
        tier_h,
        depth,
        -arch_w / 2.0,
        tier_h / 2.0,
        0.0,
        stone,
    );
    bx(
        parent,
        pillar_w,
        tier_h,
        depth,
        arch_w / 2.0,
        tier_h / 2.0,
        0.0,
        stone,
    );
    bx(
        parent,
        arch_w + pillar_w * 2.0,
        tier_h * 0.22,
        depth * 1.05,
        0.0,
        tier_h * 0.89,
        0.0,
        stone,
    );
    bx(
        parent,
        arch_w * 0.72,
        tier_h * 0.50,
        depth * 0.55,
        0.0,
        tier_h * 0.46,
        0.0,
        dark,
    );
}

/// One colosseum tier (`wonderModels.ts:282-284`).
struct ColosseumTier {
    rx: f64,
    rz: f64,
    base_y: f64,
    tier_h: f64,
    n: i32,
    arch_w: f64,
    pillar_w: f64,
    depth: f64,
}

/// `colosseum` (`:265-328`).
fn colosseum(g: &mut Node, stone: usize, sand: usize, dark: usize) {
    let mut arena = Node::mesh(
        Primitive::Cylinder {
            radius_top: 0.19 * R,
            radius_bottom: 0.19 * R,
            height: 0.028 * R,
            radial_segments: 24,
        },
        sand,
    );
    arena.scale = Vec3::new(1.55, 1.0, 1.05);
    arena.position.y = 0.014 * R;
    arena.receive_shadow = true;
    g.children.push(arena);

    let tiers = [
        ColosseumTier {
            rx: 0.42,
            rz: 0.29,
            base_y: 0.028,
            tier_h: 0.095,
            n: 16,
            arch_w: 0.058,
            pillar_w: 0.028,
            depth: 0.05,
        },
        ColosseumTier {
            rx: 0.37,
            rz: 0.26,
            base_y: 0.123,
            tier_h: 0.082,
            n: 16,
            arch_w: 0.052,
            pillar_w: 0.025,
            depth: 0.046,
        },
        ColosseumTier {
            rx: 0.33,
            rz: 0.23,
            base_y: 0.205,
            tier_h: 0.072,
            n: 14,
            arch_w: 0.048,
            pillar_w: 0.022,
            depth: 0.042,
        },
    ];
    for tier in &tiers {
        for i in 0..tier.n {
            let a = (n(i) / n(tier.n)) * PI * 2.0;
            let px = js_cos(a) * tier.rx * R;
            let pz = js_sin(a) * tier.rz * R;
            let mut arch = Node::group();
            arch.position = Vec3::new(px, tier.base_y * R, pz);
            arch.rotation.y = -a + PI / 2.0;
            arch_unit(
                &mut arch,
                tier.tier_h * R,
                tier.arch_w * R,
                tier.pillar_w * R,
                tier.depth * R,
                stone,
                dark,
            );
            g.children.push(arch);
        }
    }

    let attic_n = 14;
    let attic_y = 0.277 * R;
    let attic_h = 0.055 * R;
    for i in 0..attic_n {
        let a = (n(i) / n(attic_n)) * PI * 2.0;
        let px = js_cos(a) * 0.30 * R;
        let pz = js_sin(a) * 0.21 * R;
        let mut seg = Node::group();
        seg.position = Vec3::new(px, attic_y, pz);
        seg.rotation.y = -a + PI / 2.0;
        bx(
            &mut seg,
            0.07 * R,
            attic_h,
            0.038 * R,
            0.0,
            attic_h / 2.0,
            0.0,
            stone,
        );
        bx(
            &mut seg,
            0.025 * R,
            attic_h * 0.35,
            0.02 * R,
            0.0,
            attic_h * 0.55,
            0.012 * R,
            dark,
        );
        g.children.push(seg);
    }

    bx(
        g,
        0.10 * R,
        0.14 * R,
        0.06 * R,
        -0.07 * R,
        0.07 * R,
        0.30 * R,
        stone,
    );
    bx(
        g,
        0.10 * R,
        0.14 * R,
        0.06 * R,
        0.07 * R,
        0.07 * R,
        0.30 * R,
        stone,
    );
    bx(
        g,
        0.20 * R,
        0.04 * R,
        0.07 * R,
        0.0,
        0.16 * R,
        0.30 * R,
        stone,
    );
}

/// `citadel` (`:330-337`).
fn citadel(g: &mut Node, wall: usize, zig: usize) {
    bx(g, 0.46 * R, 0.14 * R, 0.46 * R, 0.0, 0.0, 0.0, wall);
    for (sx, sz) in [(-0.22, -0.22), (0.22, -0.22), (-0.22, 0.22), (0.22, 0.22)] {
        bx(
            g,
            0.08 * R,
            0.20 * R,
            0.08 * R,
            sx * R,
            0.14 * R,
            sz * R,
            wall,
        );
    }
    bx(g, 0.16 * R, 0.14 * R, 0.16 * R, 0.0, 0.14 * R, 0.0, zig);
    cone(g, 0.10 * R, 0.08 * R, 0.0, 0.28 * R, 0.0, zig, 4);
}

/// `grandGate` (`:339-347`).
fn grand_gate(g: &mut Node, stone: usize, gold: usize) {
    bx(g, 0.10 * R, 0.28 * R, 0.10 * R, -0.18 * R, 0.0, 0.0, stone);
    bx(g, 0.10 * R, 0.28 * R, 0.10 * R, 0.18 * R, 0.0, 0.0, stone);
    bx(g, 0.44 * R, 0.08 * R, 0.12 * R, 0.0, 0.28 * R, 0.0, stone);
    bx(g, 0.36 * R, 0.06 * R, 0.08 * R, 0.0, 0.36 * R, 0.0, gold);
    for sx in [-0.14, 0.14] {
        bx(
            g,
            0.06 * R,
            0.14 * R,
            0.08 * R,
            sx * R,
            0.06 * R,
            0.06 * R,
            gold,
        );
    }
}

/// `palaceWeiyang` (`:349-356`).
fn palace_weiyang(g: &mut Node, red: usize, roof: usize, gold: usize) {
    bx(g, 0.48 * R, 0.08 * R, 0.28 * R, 0.0, 0.0, 0.0, red);
    bx(g, 0.40 * R, 0.10 * R, 0.22 * R, 0.0, 0.08 * R, 0.0, roof);
    for sx in [-0.16, 0.0, 0.16] {
        bx(
            g,
            0.05 * R,
            0.16 * R,
            0.05 * R,
            sx * R,
            0.08 * R,
            0.10 * R,
            red,
        );
    }
    bx(g, 0.08 * R, 0.06 * R, 0.08 * R, 0.0, 0.18 * R, 0.0, gold);
}

/// `rampGate` (`:358-364`).
fn ramp_gate(g: &mut Node, earth: usize, stone: usize) {
    bx(g, 0.40 * R, 0.14 * R, 0.30 * R, 0.0, 0.0, -0.06 * R, earth);
    bx(
        g,
        0.12 * R,
        0.18 * R,
        0.08 * R,
        0.0,
        0.14 * R,
        0.10 * R,
        stone,
    );
    for sx in [-0.10, 0.10] {
        bx(
            g,
            0.06 * R,
            0.10 * R,
            0.10 * R,
            sx * R,
            0.06 * R,
            0.14 * R,
            stone,
        );
    }
}

/// `woodenIdol` (`:366-371`).
fn wooden_idol(g: &mut Node, wood: usize, iron: usize) {
    bx(g, 0.12 * R, 0.06 * R, 0.12 * R, 0.0, 0.0, 0.0, wood);
    bx(g, 0.14 * R, 0.34 * R, 0.10 * R, 0.0, 0.06 * R, 0.0, wood);
    bx(g, 0.20 * R, 0.04 * R, 0.04 * R, 0.0, 0.28 * R, 0.0, iron);
    bx(g, 0.04 * R, 0.04 * R, 0.18 * R, 0.0, 0.22 * R, 0.0, iron);
}

/// `gallicOppidum` (`:374-418`).
fn gallic_oppidum(g: &mut Node, earth: usize, wood: usize, thatch: usize, stone: usize) {
    cyl(g, 0.46 * R, 0.48 * R, 0.07 * R, 0.0, 0.0, 0.0, earth, 10);
    cyl(
        g,
        0.42 * R,
        0.44 * R,
        0.05 * R,
        0.0,
        0.07 * R,
        0.0,
        stone,
        10,
    );
    for i in 0..16 {
        let a = (n(i) / 16.0) * PI * 2.0;
        if (a - PI / 2.0).abs() < 0.32 {
            continue;
        }
        let px = js_cos(a) * 0.44 * R;
        let pz = js_sin(a) * 0.44 * R;
        bx(g, 0.022 * R, 0.11 * R, 0.022 * R, px, 0.125 * R, pz, wood);
        cone(g, 0.026 * R, 0.035 * R, px, 0.185 * R, pz, wood, 4);
    }
    bx(
        g,
        0.05 * R,
        0.13 * R,
        0.05 * R,
        -0.08 * R,
        0.065 * R,
        0.43 * R,
        wood,
    );
    bx(
        g,
        0.05 * R,
        0.13 * R,
        0.05 * R,
        0.08 * R,
        0.065 * R,
        0.43 * R,
        wood,
    );
    bx(
        g,
        0.20 * R,
        0.035 * R,
        0.05 * R,
        0.0,
        0.145 * R,
        0.43 * R,
        wood,
    );
    let huts: [(f64, f64); 3] = [(-0.14, -0.06), (0.15, -0.04), (-0.04, 0.14)];
    for (hx, hz) in huts {
        cyl(
            g,
            0.085 * R,
            0.09 * R,
            0.09 * R,
            hx * R,
            0.12 * R,
            hz * R,
            wood,
            10,
        );
        cone(g, 0.105 * R, 0.11 * R, hx * R, 0.21 * R, hz * R, thatch, 10);
    }
    for i in 0..6 {
        let a = (n(i) / 6.0) * PI * 2.0;
        bx(
            g,
            0.025 * R,
            0.08 * R,
            0.02 * R,
            js_cos(a) * 0.07 * R,
            0.12 * R,
            js_sin(a) * 0.07 * R,
            stone,
        );
    }
    cyl(
        g,
        0.028 * R,
        0.032 * R,
        0.16 * R,
        0.0,
        0.12 * R,
        0.0,
        wood,
        6,
    );
    bx(g, 0.055 * R, 0.045 * R, 0.045 * R, 0.0, 0.28 * R, 0.0, wood);
}

/// `ownerBanner` (`:420-424`): a new material at index [`MaterialSlot::COUNT`].
fn owner_banner(g: &mut Node, banner: usize) {
    bx(
        g,
        0.04 * R,
        0.14 * R,
        0.04 * R,
        0.24 * R,
        0.08 * R,
        0.0,
        banner,
    );
    bx(
        g,
        0.10 * R,
        0.06 * R,
        0.02 * R,
        0.28 * R,
        0.16 * R,
        0.0,
        banner,
    );
}

/// `buildWonderModel(wonderId, opts)` (`wonderModels.ts:427-486`).
#[must_use]
pub fn build_wonder_model(wonder_id: &str, opts: WonderModelOptions) -> WonderModel {
    let ruin = opts.ruin;
    let mut materials: Vec<LambertMaterial> = WONDER_MATERIAL_COLORS
        .iter()
        .map(|&c| mat(c, ruin))
        .collect();
    let mut g = Node::group();
    let k = MaterialSlot::index;
    match WonderShape::from_id(wonder_id) {
        WonderShape::EgyptianPyramid => egyptian_pyramid(&mut g, k(S::Sand), k(S::Gold)),
        WonderShape::Obelisk => obelisk(&mut g, k(S::Stone), k(S::Gold)),
        WonderShape::HangingGardens => {
            hanging_gardens(&mut g, k(S::Brick), k(S::Leaf), k(S::Water));
        }
        WonderShape::OracleTemple => oracle_temple(&mut g, k(S::Stone), k(S::Gold)),
        WonderShape::GallicOppidum => {
            gallic_oppidum(&mut g, k(S::Earth), k(S::Wood), k(S::Thatch), k(S::Stone))
        }
        WonderShape::Stupa => stupa(&mut g, k(S::White), k(S::Gold)),
        WonderShape::RockFacade => rock_facade(&mut g, k(S::Rock), k(S::Cave)),
        WonderShape::Trilithon => trilithon(&mut g, k(S::Stone)),
        WonderShape::Colossus => {
            colossus(&mut g, k(S::Bronze), k(S::Stone), k(S::Water), k(S::Gold))
        }
        WonderShape::CelticWalledSettlement => celtic_walled_settlement(
            &mut g,
            k(S::Earth),
            k(S::Wood),
            k(S::Thatch),
            k(S::Stone),
            k(S::Water),
        ),
        WonderShape::Ziggurat => ziggurat(&mut g, k(S::Mud), k(S::Stone)),
        WonderShape::MayanPyramid => mayan_pyramid(&mut g, k(S::Stone), k(S::Gold)),
        WonderShape::TerracottaPit => terracotta_pit(&mut g, k(S::Clay), k(S::Earth)),
        WonderShape::Colosseum => colosseum(&mut g, k(S::Stone), k(S::Sand), k(S::Dark)),
        WonderShape::Citadel => citadel(&mut g, k(S::Wall), k(S::Mud)),
        WonderShape::GrandGate => grand_gate(&mut g, k(S::Stone), k(S::Gold)),
        WonderShape::PalaceWeiyang => {
            palace_weiyang(&mut g, k(S::Red), k(S::Roof), k(S::Gold));
        }
        WonderShape::RampGate => ramp_gate(&mut g, k(S::Earth), k(S::Stone)),
        WonderShape::WoodenIdol => wooden_idol(&mut g, k(S::Wood), k(S::Iron)),
        WonderShape::Default => {
            cyl(
                &mut g,
                0.20 * R,
                0.22 * R,
                0.20 * R,
                0.0,
                0.0,
                0.0,
                k(S::Stone),
                6,
            );
            cone(
                &mut g,
                0.18 * R,
                0.12 * R,
                0.0,
                0.20 * R,
                0.0,
                k(S::Gold),
                6,
            );
        }
    }
    if let Some(owner) = opts.owner_color {
        materials.push(mat(owner, ruin));
        owner_banner(&mut g, MaterialSlot::COUNT);
    }
    WonderModel { root: g, materials }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grey_matches_hand_computation() {
        // 0xd4b878: r=212 g=184 b=120, m=172; 212*0.45+172*0.55 = 190 → 0xbe.
        assert_eq!(grey(0x00d4_b878, false), 0x00d4_b878);
        assert_eq!(grey(0x00d4_b878, true) >> 16, 190);
    }

    #[test]
    fn registry_covers_the_19_ids_and_defaults_the_rest() {
        let mut shapes: Vec<WonderShape> = WONDER_MODEL_IDS
            .iter()
            .map(|id| WonderShape::from_id(id))
            .collect();
        assert!(shapes.iter().all(|s| *s != WonderShape::Default));
        shapes.sort_by_key(|s| *s as u8);
        shapes.dedup();
        assert_eq!(shapes.len(), 19);
        for parked in [
            "nalanda",
            "angkor_wat",
            "wielki_dzwon",
            "mauzoleum_teodoryka",
            "kopiec_grobowy",
            "",
        ] {
            assert_eq!(WonderShape::from_id(parked), WonderShape::Default);
        }
    }
}
