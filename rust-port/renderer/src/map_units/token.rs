//! One unit token of the map (`UnitRenderer` per-token state,
//! `gra/src/render/units.ts` @ `07d2fbd72`): the model group, its owner
//! ring, the deferred-reveal dimming and the overlay inputs the web passes
//! to the plate / badge functions.

use std::collections::HashMap;
use std::f64::consts::PI;

use super::consts::{
    DEFERRED_TOKEN_OPACITY, GOLD_DEFICIT_COIN_OPACITY, GOLD_DEFICIT_RENDER_ORDER, OWNER_RING_LIFT,
    OWNER_RING_OPACITY, STARVING_SKULL_OPACITY, STARVING_SKULL_RENDER_ORDER, SUFFER_ICON_PAIR_DX,
    SUFFER_ICON_SCALE_PAIR, SUFFER_ICON_SCALE_SINGLE, SUFFER_ICON_Y, SUFFER_ICON_Z, WAR_RING_COLOR,
    WAR_RING_OPACITY, WAR_RING_SCALE,
};
use crate::models::unit_core::category::attach_embark_boat;
use crate::models::unit_core::model::UnitModel;
use crate::models::unit_core::parts::UnitPart;
use crate::models::unit_core::registry::NotYetPorted;
use crate::models::unit_core::routing::{
    build_model, model_for_or_category, UnitTypeId, UnknownUnitType,
};
use crate::pick::hex::HexCoord;
use crate::pick::three::js_min;
use crate::scene::{MatId, Material, NodeId, Side, ROOT};
use crate::units::overlay::emblem::OwnerEmblemContext;
use crate::units::overlay::stat_plate::StatPlateVitals;

/// `UnitRingStance` (`units.ts:438`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum RingStance {
    /// `'own'`.
    Own,
    /// `'neutral'`.
    Neutral,
    /// `'hostile'`: a second, red war ring is added (`:6022-6036`).
    Hostile,
}

/// Badge row inputs (`applyUnitUpgradeBadgeRow(group, armor, soft, stars)`,
/// `units.ts:6215-6217`, or `syncUnitUpgradeBadges`, `:6223`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Default)]
pub struct BadgeRow {
    /// Armour path (Forge) level `0..=3`.
    pub armor: u8,
    /// Soft path (Barracks) level `0..=3`.
    pub soft: u8,
    /// Veteran star count used to place the icons.
    pub stars: u8,
}

/// A suffering icon above a stack representative (`_syncSufferingIconMap`,
/// `units.ts:6340-6371`): the sprite parameters, the canvas texture itself
/// is drawn by the GPU layer.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct SufferingIcon {
    /// Both causes hang on this token (`sufferingIconPaired`).
    pub paired: bool,
    /// `sp.scale` (x = y): `SUFFER_ICON_SCALE_PAIR` / `_SINGLE`.
    pub scale: f64,
    /// `sprite.position` (`:6365-6366`).
    pub position: (f64, f64, f64),
    /// `SpriteMaterial.opacity`.
    pub opacity: f64,
    /// `sp.renderOrder`.
    pub render_order: i32,
}

impl SufferingIcon {
    /// Army hunger skull (`_makeStarvingChipSprite`, `:6387-6409`).
    #[must_use]
    pub fn starving(paired: bool) -> Self {
        Self::new(paired, true)
    }

    /// Gold deficit coin (`_makeGoldDeficitChipSprite`, `:6419-6467`).
    #[must_use]
    pub fn gold_deficit(paired: bool) -> Self {
        Self::new(paired, false)
    }

    fn new(paired: bool, is_starving: bool) -> Self {
        let scale = if paired {
            SUFFER_ICON_SCALE_PAIR
        } else {
            SUFFER_ICON_SCALE_SINGLE
        };
        let x = if paired {
            if is_starving {
                -SUFFER_ICON_PAIR_DX
            } else {
                SUFFER_ICON_PAIR_DX
            }
        } else {
            0.0
        };
        Self {
            paired,
            scale,
            position: (x, SUFFER_ICON_Y, SUFFER_ICON_Z),
            opacity: if is_starving {
                STARVING_SKULL_OPACITY
            } else {
                GOLD_DEFICIT_COIN_OPACITY
            },
            render_order: if is_starving {
                STARVING_SKULL_RENDER_ORDER
            } else {
                GOLD_DEFICIT_RENDER_ORDER
            },
        }
    }
}

/// What the web hangs on the token besides the model and the owner ring,
/// as the inputs of the existing overlay builders
/// ([`crate::units::overlay`]): the trees and textures are built from these
/// by the GPU layer.
#[derive(Clone, Debug, PartialEq, Default)]
pub struct TokenOverlays {
    /// `applyUnitCommanderStar(tokenObj, hasCmd)` (`:6209-6210`).
    pub commander_star: bool,
    /// Badge row (`:6215-6217` / `:6223`).
    pub badge_row: BadgeRow,
    /// `applyUnitVeteranBadgeStarCount` / `syncUnitVeteranBadges`
    /// (`:6221` / `:6224`).
    pub veteran_stars: u8,
    /// Owner emblem of the plate (`ownerEmblemResolver?.(ownerId) ?? null`,
    /// `:6228`).
    pub plate_owner: Option<OwnerEmblemContext>,
    /// Plate vitals (`:6229-6236`).
    pub plate_vitals: StatPlateVitals,
    /// Stack badge `×N` (`_applyStackDisplay`, `:6283-6304`): the count when
    /// shown.
    pub stack_badge: Option<u32>,
    /// Army hunger skull (`:6323-6329`).
    pub starving_icon: Option<SufferingIcon>,
    /// Gold deficit coin (`:6330-6336`).
    pub gold_deficit_icon: Option<SufferingIcon>,
}

/// One token: the web `THREE.Group` of `buildUnitModel` plus the
/// `userData` the class keeps on it (`cat`, `typeId`, `embarked`,
/// `ringStance`, `ringOwnerId`, `deferredDim`).
#[derive(Clone, Debug, PartialEq)]
pub struct MapToken {
    /// `userData.unitId`.
    pub id: String,
    /// Unit hex (`u.q, u.r`).
    pub hex: HexCoord,
    /// `userData.ringOwnerId` (legacy owner number).
    pub owner_id: i64,
    /// `userData.cat`.
    pub category: String,
    /// `userData.typeId`.
    pub type_id: String,
    /// `userData.ringStance`.
    pub ring_stance: RingStance,
    /// `userData.embarked`.
    pub embarked: bool,
    /// Placed on a city hex (`cityHexKeys.has(key)`).
    pub on_city: bool,
    /// The model; its root is the token group (position, scale,
    /// `renderOrder`, `visible`), the owner ring(s) are root children.
    pub model: UnitModel,
    /// Set when the type id is outside `UNIT_MODEL_TABLE` (D-MOD-9 = A
    /// fallback to the category model, `D-NM-14`).
    pub unknown_type: Option<UnknownUnitType>,
    /// Overlay inputs.
    pub overlays: TokenOverlays,
    /// Owner ring node, then the war ring node when hostile.
    pub owner_rings: Vec<NodeId>,
    pub(super) deferred_dim: bool,
    /// `material.userData.dimBase` per material slot.
    pub(super) dim_base: HashMap<MatId, (bool, f64)>,
}

/// Inputs of [`MapToken::build`].
pub(super) struct TokenSpec<'a> {
    pub id: &'a str,
    pub hex: HexCoord,
    pub owner_id: i64,
    pub category: &'a str,
    pub type_id: &'a str,
    pub embarked: bool,
    pub ring_stance: RingStance,
    pub owner_color: u32,
    pub ring_color: u32,
}

impl MapToken {
    /// `buildUnitModel(cat, color, typeId)` + `attachEmbarkBoat` +
    /// `_attachOwnerRing` (`units.ts:6138-6148`, `:6156-6167`). The model is
    /// routed by type id (`model_for_or_category`, D-MOD-9 = A); the web
    /// passes the type id as `unitName` of `buildUnitModel`.
    pub(super) fn build(s: &TokenSpec<'_>) -> Result<Self, NotYetPorted> {
        let (mid, unknown_type) = model_for_or_category(&UnitTypeId::new(s.type_id), s.category);
        let mut model = build_model(mid, s.owner_color)?;
        if s.embarked {
            attach_embark_boat(&mut model);
        }
        let owner_rings = attach_owner_ring(&mut model, s.ring_stance, s.ring_color);
        Ok(Self {
            id: s.id.to_owned(),
            hex: s.hex,
            owner_id: s.owner_id,
            category: s.category.to_owned(),
            type_id: s.type_id.to_owned(),
            ring_stance: s.ring_stance,
            embarked: s.embarked,
            on_city: false,
            model,
            unknown_type,
            overlays: TokenOverlays::default(),
            owner_rings,
            deferred_dim: false,
            dim_base: HashMap::new(),
        })
    }

    /// `obj.visible`.
    #[must_use]
    pub fn visible(&self) -> bool {
        self.model.nodes[ROOT].visible
    }

    pub(super) fn set_visible(&mut self, v: bool) {
        self.model.nodes[ROOT].visible = v;
    }

    /// `obj.position`.
    #[must_use]
    pub fn position(&self) -> (f64, f64, f64) {
        let p = self.model.nodes[ROOT].position;
        (p.x, p.y, p.z)
    }

    pub(super) fn set_position(&mut self, x: f64, y: f64, z: f64) {
        self.model.nodes[ROOT].set_pos(x, y, z);
    }

    /// `userData.deferredDim === true`.
    #[must_use]
    pub const fn deferred_dim(&self) -> bool {
        self.deferred_dim
    }

    /// The token materials (`tokenMaterials` = root `userData.mats`, model
    /// materials + owner/war ring materials), deduplicated in first-seen
    /// order (`new Set(...)`, `:6069`).
    #[must_use]
    pub fn token_materials(&self) -> Vec<MatId> {
        let mut out: Vec<MatId> = Vec::new();
        for &m in self.model.tracked() {
            if !out.contains(&m) {
                out.push(m);
            }
        }
        out
    }

    /// `_applyDeferredDim(unitId, dim)` (`units.ts:6060-6086`): opacity
    /// ceiling `DEFERRED_TOKEN_OPACITY` (a threshold, not a factor), restore
    /// from the remembered base; idempotent.
    pub(super) fn apply_deferred_dim(&mut self, dim: bool) {
        if self.deferred_dim == dim {
            return;
        }
        for m in self.token_materials() {
            let mat = &mut self.model.materials[m];
            if dim {
                self.dim_base.insert(m, (mat.transparent, mat.opacity));
                let base_opacity = mat.opacity;
                mat.transparent = true;
                mat.opacity = js_min(base_opacity, DEFERRED_TOKEN_OPACITY);
            } else {
                let Some((transparent, opacity)) = self.dim_base.remove(&m) else {
                    continue;
                };
                mat.transparent = transparent;
                mat.opacity = opacity;
            }
        }
        self.deferred_dim = dim;
    }
}

fn ring_material(color: u32, opacity: f64) -> Material {
    let mut mat = Material::basic(color);
    mat.transparent = true;
    mat.opacity = opacity;
    mat.depth_write = false;
    mat.side = Side::Double;
    mat
}

/// `_attachOwnerRing(group, ownerId)` (`units.ts:6008-6043`): the owner ring
/// in the civilisation colour, and for a hostile owner a second red ring
/// scaled by `WAR_RING_SCALE`; both materials go to `userData.mats`.
pub(super) fn attach_owner_ring(
    m: &mut UnitModel,
    stance: RingStance,
    civ_color: u32,
) -> Vec<NodeId> {
    let own_mat = m.add_material(ring_material(civ_color, OWNER_RING_OPACITY));
    let own = m.add_mesh_id(ROOT, UnitPart::OwnerHexRing.geo(), own_mat);
    m.nodes[own].rot_x(-PI / 2.0);
    m.nodes[own].position.y = OWNER_RING_LIFT;
    if stance == RingStance::Hostile {
        let war_mat = m.add_material(ring_material(WAR_RING_COLOR, WAR_RING_OPACITY));
        let war = m.add_mesh_id(ROOT, UnitPart::OwnerHexRing.geo(), war_mat);
        m.nodes[war].rot_x(-PI / 2.0);
        m.nodes[war].position.y = OWNER_RING_LIFT;
        m.nodes[war].set_scale_scalar(WAR_RING_SCALE);
        m.track(own_mat);
        m.track(war_mat);
        vec![own, war]
    } else {
        m.track(own_mat);
        vec![own]
    }
}
