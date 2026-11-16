//! R6 (`R-RUSTPORT-P4-1-R6-REVOLT-COUNT`, `P4-1G-ADAPTER-ROZPOZNANIE.md`
//! §4): the revolt sprite of a city and the unit count of its hex, the two
//! city fields of the DTO that had no renderer consumer (`cities[].revolt`,
//! `cities[].unit_count_on_hex`, `view-model/src/owners.rs`).
//!
//! Pin `07d2fbd72`, `gra/src/render/cities.ts`:
//! - `CityRenderer.sync` calls `this._syncRevolt(city.id, group,
//!   options?.getRevolt?.(city.id) ?? false)` for every city of the list,
//!   on the kept group (`:541`) and on a new / rebuilt group (`:586`); a
//!   rebuilt group first loses its sprite (`_removeRevolt`, `:551`), and a
//!   city that left the list loses it too (`:597-599`);
//! - `_syncRevolt` (`:815-831`): `show == false` removes the sprite
//!   (`:816-818`); an existing sprite is left as it is (`:820`); otherwise a
//!   sprite with the shared 🔥 texture is added to the group at
//!   `(0, 1.35, 0)`, scale `(0.9, 0.9, 1)` ([`sprite`]).
//!
//! **D-DTO-1 = A**: whether a city revolts is the producer's value
//! (`getRevolt` = `bunt || revoltWarning`, `main.ts:2967-2970`, computed by
//! the engine); this module never infers it.
//!
//! **Unit count.** `getUnitCountOnHex` is declared in `CityRenderOptions`
//! (`cities.ts:345-346`) and filled by `main.ts:2971` (`unitCountOnHex`,
//! `main.ts:2901-2907`), but nothing in `CityRenderer` reads it:
//! `git grep -n "getUnitCountOnHex\|unitCountOnHex" 07d2fbd72 -- gra/src`
//! gives exactly those three lines, no call. The pin therefore draws no
//! counter on a city hex for any value (0 or more). Here the value is
//! carried ([`RevoltCityInput::unit_count_on_hex`]) and, like in the pin,
//! adds nothing to the scene ([`RevoltRenderer::city_overlay_scene`]). No
//! counter is invented (the web does not define one).
//!
//! No GPU here: the sprite is data ([`sprite::RevoltSprite`]) and
//! [`RevoltRenderer::city_overlay_scene`] returns a [`Scene`] for
//! [`Scene::export_gpu`]. The city groups live in
//! [`CityRenderer`]; this layer only reads them.

pub mod sprite;

use std::collections::HashSet;

use civ_view_model as vm;

pub use sprite::{
    revolt_material, RevoltSprite, REVOLT_GLYPH, REVOLT_SPRITE_POSITION, REVOLT_SPRITE_SCALE,
};

use crate::models::cities::renderer::{CityRenderer, RenderedCity};
use crate::scene::{Scene, ROOT};
use crate::view::city_id_string;

/// The two R6 values of one city.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RevoltCityInput {
    /// `City.id` (decimal, [`city_id_string`]).
    pub city_id: String,
    /// `getRevolt(cityId)` (`cities.ts:340`, `main.ts:2967-2970`).
    pub revolt: bool,
    /// `getUnitCountOnHex(q, r)` (`cities.ts:345-346`, `main.ts:2971`).
    /// Read by no pin renderer (module docs).
    pub unit_count_on_hex: u32,
}

/// `cities[]` as the R6 inputs, in `cities[]` order (D-DTO-5).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct RevoltInputs {
    /// One entry per DTO city.
    pub cities: Vec<RevoltCityInput>,
}

impl RevoltInputs {
    /// `cities[].revolt` / `cities[].unit_count_on_hex`, unchanged.
    #[must_use]
    pub fn from_dto(cities: &[vm::CityViewDto]) -> Self {
        Self {
            cities: cities
                .iter()
                .map(|c| RevoltCityInput {
                    city_id: city_id_string(c.id),
                    revolt: c.revolt,
                    unit_count_on_hex: c.unit_count_on_hex,
                })
                .collect(),
        }
    }

    /// The entry of a city id (`None` = not in `cities[]`).
    #[must_use]
    pub fn city(&self, id: &str) -> Option<&RevoltCityInput> {
        self.cities.iter().find(|c| c.city_id == id)
    }
}

/// The revolt part of `CityRenderer` (`revoltSprites`, `cities.ts:448`),
/// kept beside the ported [`CityRenderer`].
#[derive(Debug, Clone, Default, PartialEq)]
pub struct RevoltRenderer {
    /// `revoltSprites` in `Map` insertion order.
    sprites: Vec<RevoltSprite>,
    /// Last [`RevoltSprite::serial`] handed out.
    last_serial: u64,
}

impl RevoltRenderer {
    /// An empty layer.
    #[must_use]
    pub fn new() -> Self {
        Self::default()
    }

    /// Every sprite, in `revoltSprites` order.
    #[must_use]
    pub fn sprites(&self) -> &[RevoltSprite] {
        &self.sprites
    }

    /// `revoltSprites.get(cityId)`.
    #[must_use]
    pub fn sprite(&self, city_id: &str) -> Option<&RevoltSprite> {
        self.sprites.iter().find(|s| s.city_id == city_id)
    }

    /// `_removeRevolt(cityId, parent)` (`cities.ts:806-813`).
    pub fn remove_revolt(&mut self, city_id: &str) {
        self.sprites.retain(|s| s.city_id != city_id);
    }

    /// `_syncRevolt(cityId, parent, show)` (`cities.ts:815-831`).
    ///
    /// A sprite attached to another group (the city model was rebuilt, new
    /// `visualKey`) is first removed, as `sync` does with `_removeRevolt`
    /// before it drops the old group (`:551`).
    pub fn sync_revolt(&mut self, city_id: &str, parent: &RenderedCity, show: bool) {
        if !show {
            self.remove_revolt(city_id);
            return;
        }
        if let Some(s) = self.sprite(city_id) {
            if s.parent_visual_key == parent.visual_key {
                return;
            }
            self.remove_revolt(city_id);
        }
        self.last_serial += 1;
        self.sprites
            .push(RevoltSprite::new(city_id, parent, self.last_serial));
    }

    /// The revolt calls of `CityRenderer.sync(cities, options)`
    /// (`cities.ts:541`, `:551`, `:586`, `:597-599`), run after
    /// [`CityRenderer::sync`] with the same `cities[]`: `_syncRevolt` for
    /// every city that has a group, then `_removeRevolt` for every sprite
    /// whose city left the list.
    pub fn sync(&mut self, inputs: &RevoltInputs, cities: &CityRenderer) {
        for c in &inputs.cities {
            if let Some(grp) = cities.city(&c.city_id) {
                self.sync_revolt(&c.city_id, grp, c.revolt);
            }
        }
        let present: HashSet<&str> = inputs
            .cities
            .iter()
            .filter(|c| cities.city(&c.city_id).is_some())
            .map(|c| c.city_id.as_str())
            .collect();
        self.sprites
            .retain(|s| present.contains(s.city_id.as_str()));
    }

    /// `dispose()` (`cities.ts:777`): `revoltSprites.clear()`.
    pub fn dispose(&mut self) {
        self.sprites.clear();
    }

    /// The R6 children of one city group as a scene: a root that copies the
    /// group's transform and `visible` (the web parent), with the revolt
    /// sprite as its only possible child. `input.unit_count_on_hex` adds no
    /// node for any value (module docs: no pin reader).
    #[must_use]
    pub fn city_overlay_scene(&self, input: &RevoltCityInput, parent: &RenderedCity) -> Scene {
        let mut scene = Scene::new();
        let src = &parent.model.nodes[ROOT];
        {
            let root = scene.root_mut();
            root.position = src.position;
            root.rotation = src.rotation;
            root.quaternion = src.quaternion;
            root.scale = src.scale;
            root.visible = src.visible;
        }
        if let Some(s) = self
            .sprite(&input.city_id)
            .filter(|s| s.parent_visual_key == parent.visual_key)
        {
            let mat = scene.add_material(s.material);
            let id = scene.sprite(ROOT, mat);
            let n = scene.node(id);
            n.position = s.position;
            n.scale = s.scale;
        }
        scene
    }
}
