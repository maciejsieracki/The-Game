//! Constants of `render/units.ts` (`edb8fb56`, lines 251-439): avatar
//! proportions, palette, overlay ring sizes. Every value is computed with
//! the same f64 operations as the TypeScript `const` (Rust const float
//! arithmetic is IEEE-754 round-to-nearest, like JavaScript).

#![allow(missing_docs, clippy::unreadable_literal)]

/// `HEX_R` (`render/hexutil.ts:24`).
pub const HEX_R: f64 = 1.0;

// --- avatar proportions (units.ts:309-342)
pub const AV_LEG_W: f64 = 0.07 * HEX_R;
pub const AV_LEG_H: f64 = 0.20 * HEX_R;
pub const AV_LEG_SEP: f64 = 0.045 * HEX_R;
pub const AV_TORSO_W: f64 = 0.18 * HEX_R;
pub const AV_TORSO_H: f64 = 0.22 * HEX_R;
pub const AV_TORSO_D: f64 = 0.10 * HEX_R;
pub const AV_ARM_W: f64 = 0.06 * HEX_R;
pub const AV_ARM_H: f64 = 0.20 * HEX_R;
pub const AV_ARM_D: f64 = 0.06 * HEX_R;
pub const AV_NECK_W: f64 = 0.04 * HEX_R;
pub const AV_NECK_H: f64 = 0.03 * HEX_R;
pub const AV_NECK_D: f64 = 0.04 * HEX_R;
pub const AV_HEAD_S: f64 = 0.13 * HEX_R;

pub const AV_Y_LEG_BOT: f64 = 0.0;
pub const AV_Y_LEG_CTR: f64 = AV_Y_LEG_BOT + AV_LEG_H * 0.5;
pub const AV_Y_LEG_TOP: f64 = AV_Y_LEG_BOT + AV_LEG_H;
pub const AV_Y_TORSO_BOT: f64 = AV_Y_LEG_TOP;
pub const AV_Y_TORSO_CTR: f64 = AV_Y_TORSO_BOT + AV_TORSO_H * 0.5;
pub const AV_Y_TORSO_TOP: f64 = AV_Y_TORSO_BOT + AV_TORSO_H;
pub const AV_Y_NECK_CTR: f64 = AV_Y_TORSO_TOP + AV_NECK_H * 0.5;
pub const AV_Y_NECK_TOP: f64 = AV_Y_TORSO_TOP + AV_NECK_H;
pub const AV_Y_HEAD_BOT: f64 = AV_Y_NECK_TOP;
pub const AV_Y_HEAD_CTR: f64 = AV_Y_HEAD_BOT + AV_HEAD_S * 0.5;
pub const AV_Y_HEAD_TOP: f64 = AV_Y_HEAD_BOT + AV_HEAD_S;
pub const AV_Y_ARM_CTR: f64 = AV_Y_TORSO_BOT + AV_TORSO_H * 0.55;
pub const AV_ARM_OFFSET_X: f64 = AV_TORSO_W * 0.5 + AV_ARM_W * 0.5 + 0.003 * HEX_R;

// --- palette (units.ts:345-400)
pub const COLOR_SKIN: u32 = 0xe0ac69;
pub const COLOR_CLOTH: u32 = 0xb5784a;
pub const COLOR_TROUSERS: u32 = 0x4a3828;
pub const COLOR_DARK_EYE: u32 = 0x1a1008;
pub const COLOR_STEEL: u32 = 0xc2cad2;
pub const COLOR_DARK_STEEL: u32 = 0x6a7278;
pub const COLOR_BRONZE: u32 = 0xcf9234;
pub const COLOR_DARK_BRONZE: u32 = 0x7a5020;
pub const COLOR_WOOD: u32 = 0x7a5c3a;
pub const COLOR_LEATHER: u32 = 0x6b4a28;
pub const COLOR_HORSE: u32 = 0x6b4c2a;
pub const COLOR_HAT_BROWN: u32 = 0x3e2a1a;
pub const COLOR_HAT_LIGHT: u32 = 0x8b6040;
pub const COLOR_GOLD: u32 = 0xd4a830;
pub const COLOR_POLE_GREY: u32 = 0x888888;
pub const COLOR_CHARIOT: u32 = 0x8b6a2a;
pub const COLOR_SKIN_DARK: u32 = 0xc89058;
pub const COLOR_BRONZE_LT: u32 = 0xd0a050;
pub const COLOR_LINEN: u32 = 0xe8e0c8;
pub const COLOR_ROMAN_RED: u32 = 0xa42a22;
pub const COLOR_MAIL: u32 = 0x9098a0;
pub const COLOR_FUR: u32 = 0x7a6a52;
pub const COLOR_FEATHER: u32 = 0xf4f0e6;
pub const COLOR_HIDE_RED: u32 = 0x8a3a26;
pub const COLOR_SAIL: u32 = 0xe6ddc4;
pub const COLOR_SAND: u32 = 0xcdb37a;
pub const COLOR_LEAF: u32 = 0x4a6a2e;
pub const COLOR_RED_VIV: u32 = 0xc0392b;
pub const COLOR_CRIMSON: u32 = 0xa01f2e;
pub const COLOR_RUST: u32 = 0xb5482f;
pub const COLOR_TERRACOTA: u32 = 0xc15a34;
pub const COLOR_BURGUNDY: u32 = 0x7e2a30;
pub const COLOR_OCHRE: u32 = 0xc8932e;
pub const COLOR_FOREST: u32 = 0x3f8a3a;
pub const COLOR_OLIVE: u32 = 0x5d6b34;
pub const COLOR_TEAL: u32 = 0x1f7a78;
pub const COLOR_WOAD: u32 = 0x2f5aa0;
pub const COLOR_INDIGO: u32 = 0x3a4a86;
pub const COLOR_HORSE_LT: u32 = 0x8a6038;
pub const COLOR_LACQUER: u32 = 0xa8252a;
pub const COLOR_GOLD_BR: u32 = 0xe0b53a;
pub const COLOR_PAINT_WHT: u32 = 0xeae3d2;

// --- overlay geometry sizes used by catalogue parts (units.ts:403-436)
pub const HIGHLIGHT_RADIUS: f64 = HEX_R * 0.88;
pub const HIGHLIGHT_HEIGHT: f64 = 0.015 * HEX_R;
pub const SELECTION_HEX_OUTER: f64 = HEX_R * 0.94;
pub const SELECTION_HEX_WIDTH: f64 = 0.11 * HEX_R;
pub const SELECTION_HEX_INNER: f64 = SELECTION_HEX_OUTER - SELECTION_HEX_WIDTH;
pub const OWNER_RING_OUTER: f64 = HEX_R * 0.90;
pub const OWNER_RING_WIDTH: f64 = 0.045 * HEX_R;
pub const OWNER_RING_INNER: f64 = OWNER_RING_OUTER - OWNER_RING_WIDTH;
