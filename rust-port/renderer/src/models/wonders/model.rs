//! Object-graph types of a wonder model: since P4.27 the model is a
//! [`Scene`] (the renderer's one scene-tree type) — the CPU equivalent of
//! the `THREE.Group` / `THREE.Mesh` tree that `buildWonderModel` returns.
//! Materials 0..20 are the shared `mats` of the web in [`MaterialSlot`]
//! order (= root `userData.mats`), the owner banner material follows at
//! [`MaterialSlot::COUNT`].
//!
//! The old public names stay as aliases: [`WonderModel`] = [`Scene`],
//! [`LambertMaterial`] = [`Material`], [`Primitive`] = [`Prim`].

pub use crate::scene::{Material, Node, NodeKind, Prim, Scene, WorldMesh};

/// A built wonder model (alias of [`Scene`]).
pub type WonderModel = Scene;

/// `new THREE.MeshLambertMaterial({ color, flatShading: true })` as data
/// (`wonderModels.ts:28-30`) — alias of [`Material`].
pub type LambertMaterial = Material;

/// Geometry of a wonder mesh (box / cylinder / cone) — alias of [`Prim`].
pub type Primitive = Prim;

/// Index of a shared material in the model's `materials`, in the key order
/// of the web `mats` object (`wonderModels.ts:430-451`). The owner banner
/// material, when present, follows at index [`MaterialSlot::COUNT`].
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[allow(missing_docs)]
pub enum MaterialSlot {
    Sand,
    Stone,
    White,
    Gold,
    Brick,
    Leaf,
    Water,
    Bronze,
    Rock,
    Cave,
    Wood,
    Thatch,
    Mud,
    Clay,
    Earth,
    Red,
    Roof,
    Wall,
    Dark,
    Iron,
}

impl MaterialSlot {
    /// Number of shared materials (`Object.values(mats).length`).
    pub const COUNT: usize = 20;

    /// Index into the model's `materials`.
    #[must_use]
    pub const fn index(self) -> usize {
        self as usize
    }
}

/// Base colours of the shared materials, in [`MaterialSlot`] order
/// (`wonderModels.ts:431-450`).
pub const WONDER_MATERIAL_COLORS: [u32; MaterialSlot::COUNT] = [
    0x00d4_b878, // sand
    0x009a_9088, // stone
    0x00e8_e4dc, // white
    0x00c8_a040, // gold
    0x00a0_6848, // brick
    0x004a_8a40, // leaf
    0x005a_adbe, // water
    0x00b8_8850, // bronze
    0x00c8_7868, // rock
    0x003a_3028, // cave
    0x007a_5838, // wood
    0x00b8_a060, // thatch
    0x008a_7050, // mud
    0x00b0_7050, // clay
    0x006a_5038, // earth
    0x00a8_3838, // red
    0x002a_2828, // roof
    0x007a_7870, // wall
    0x004a_4038, // dark
    0x0055_5558, // iron
];

/// Number of shared materials registered in `userData.mats` (always 20).
#[must_use]
pub fn user_data_material_count(model: &Scene) -> usize {
    model.tracked().len()
}

/// Banner material (`ownerBanner`), if the model has a banner.
#[must_use]
pub fn banner_material(model: &Scene) -> Option<&Material> {
    model.materials.get(MaterialSlot::COUNT)
}
