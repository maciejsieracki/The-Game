//! The revolt sprite of one city (`_syncRevolt` / `_revoltTexture`,
//! `gra/src/render/cities.ts:791-831`, pin `07d2fbd72`) as data.

use crate::geom::{Mat4, Vec3};
use crate::models::cities::renderer::RenderedCity;
use crate::scene::{GlyphTexture, Material, MaterialKind, Texture, ROOT};

/// `_revoltTexture()` (`cities.ts:791-804`): a 64 × 64 canvas
/// (`:794-795`), `ctx.font = '48px serif'` (`:797`), `textAlign = 'center'`
/// (`:798`), `textBaseline = 'middle'` (`:799`),
/// `fillText('\u{1F525}', 32, 36)` (`:800`). One shared texture for every
/// city (`this.revoltTex`, `:449`, `:792`); rasterising it is the text
/// rasteriser's job, like [`crate::models::misc::siege::SIEGE_GLYPH`].
pub const REVOLT_GLYPH: GlyphTexture = GlyphTexture {
    size: 64,
    font: "48px serif",
    glyph: '\u{1F525}',
    x: 32,
    y: 36,
};

/// `sprite.position.set(0, 1.35, 0)` (`cities.ts:828`), in the local space
/// of the city group (the sprite is a child of the group, `:829`).
pub const REVOLT_SPRITE_POSITION: [f64; 3] = [0.0, 1.35, 0.0];

/// `sprite.scale.set(0.9, 0.9, 1)` (`cities.ts:827`), local to the group.
pub const REVOLT_SPRITE_SCALE: [f64; 3] = [0.9, 0.9, 1.0];

/// `new THREE.SpriteMaterial({ map: this._revoltTexture(), transparent:
/// true, depthTest: false })` (`cities.ts:821-825`); every other parameter
/// keeps its three r169 default (white colour, `depthWrite: true`,
/// opacity 1).
#[must_use]
pub fn revolt_material() -> Material {
    let mut m = Material::new(MaterialKind::Sprite, None);
    m.transparent = true;
    m.depth_test = false;
    m.map = Some(Texture::Glyph(REVOLT_GLYPH));
    m
}

/// One `THREE.Sprite` of `revoltSprites` (`cities.ts:448`).
#[derive(Debug, Clone, PartialEq)]
pub struct RevoltSprite {
    /// Key of `revoltSprites` (the city id).
    pub city_id: String,
    /// `visualKey` of the city group the sprite was added to
    /// (`parent.add(sprite)`, `cities.ts:829`). A rebuilt group (new
    /// `visualKey`) is a different parent: the pin removes the sprite from
    /// the old group (`_removeRevolt`, `:551`) before adding a new one to the
    /// new group (`:586`).
    pub parent_visual_key: String,
    /// `sprite.position` (local to the group).
    pub position: Vec3,
    /// `sprite.scale` (local to the group).
    pub scale: Vec3,
    /// `sprite.material` (a new material per sprite, `:821`).
    pub material: Material,
    /// Creation number inside its [`super::RevoltRenderer`] (1, 2, …): a
    /// sprite that stays (`if (this.revoltSprites.has(cityId)) return`,
    /// `:820`) keeps its number; a re-created one gets a new number.
    pub serial: u64,
}

impl RevoltSprite {
    /// `_syncRevolt` creation branch (`cities.ts:821-829`).
    #[must_use]
    pub fn new(city_id: &str, parent: &RenderedCity, serial: u64) -> Self {
        let [px, py, pz] = REVOLT_SPRITE_POSITION;
        let [sx, sy, sz] = REVOLT_SPRITE_SCALE;
        Self {
            city_id: city_id.to_owned(),
            parent_visual_key: parent.visual_key.clone(),
            position: Vec3::new(px, py, pz),
            scale: Vec3::new(sx, sy, sz),
            material: revolt_material(),
            serial,
        }
    }

    /// `sprite.matrixWorld` origin for a parent group that is a scene-graph
    /// root (the web adds the city group straight to the `THREE.Scene`,
    /// `cities.ts:583`): `group.matrix · position`, i.e. the group position
    /// plus the local offset scaled by `CITY_MODEL_SCALE` (`:573-574`,
    /// `:539-540`).
    #[must_use]
    pub fn world_position(&self, parent: &RenderedCity) -> Vec3 {
        let m: Mat4 = parent.model.local_matrix(ROOT);
        self.position.apply_mat4(&m)
    }

    /// Whether three draws the sprite: a child is skipped together with an
    /// invisible parent (`group.visible`, fog, `cities.ts:536`, `:580`).
    #[must_use]
    pub fn drawn(&self, parent: &RenderedCity) -> bool {
        parent.visible()
    }
}
