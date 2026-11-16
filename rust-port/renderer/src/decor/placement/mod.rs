//! `placement` — map placement of the forest decor per hex (R2 of
//! `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §4, topic
//! `R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT`): where the forest / jungle clumps of
//! [`super::forest`] and [`super::jungle`] stand on the world map, and which
//! of them are hidden by a city, a wonder or a unit.
//!
//! Pin `07d2fbd72`, `gra/src/render/scene.ts` (roblox style, `styledTerrain`):
//! - placement (`:2346-2374`): a hex gets a clump when
//!   `hex.nakladka === Nakladka.Las && isDryLandTeren(t)`; it is a jungle
//!   clump when `isWarmJungleForestHex(q, r, map.wysokoscR)`, variant
//!   `wariantDjungliDlaHeksa(q, r, NDJ = 5, map.seed)`, yaw
//!   `rotacjaDjungliDlaHeksa`, otherwise a forest clump, variant
//!   `wariantLasuDlaHeksa(q, r, NL_NATURAL = 4, map.seed)` (variant 4 is
//!   reserved for the dynamic clearing, `:1717-1719`), yaw
//!   `rotacjaLasuDlaHeksa`; position `(x, vis.height + vis.yOffset, z)`,
//!   scale 1. Instances are appended to the layer of their variant in
//!   `Object.values(map.hexes)` order (the DTO order, contract §1.4); the
//!   layers are `lasInst[0..NL)` and `djunglaInst[0..NDJ)` (`:1877-1886`);
//! - `hideDecorAtHex(hexKey)` (`:3172-3216`): removes the hex from the unit
//!   set, adds it to `decorHiddenHexKeys` for good (never cleared, `:3424-3427`)
//!   and zeroes its clumps (`:3189-3196`);
//! - `syncForestForUnits(hexKeys)` (`:3164-3170`): replaces
//!   `unitForestHiddenHexKeys` with the given hexes that are not
//!   decor-hidden, then `applyZoomLodDecor`;
//! - `applyZoomLodDecor` → `applyLasFog` (`:3252-3260`, `:3307-3328`,
//!   `:3381-3389`): an instance is `ZERO_MATRIX` when
//!   `fogBrightnessForHex(k) <= 0 || forestHidden(k)` with
//!   `forestHidden = isHidden || decorHidden || unitForestHidden`, otherwise
//!   its original matrix and the instance colour `(bri, bri, bri)`.
//!
//! Callers in `gra/src/main.ts`: `syncForestForUnits(unitForestHexKeys)`
//! (`:14554-14562`, hexes of the displayed units + the forced-visible one);
//! `hideDecorAtHex` for every placed wonder, ruins included
//! (`reapplyWonderHexDecorHides`, `:4311-4313`), for a wonder finished on its
//! build site (`:5264`, right after the site is pushed to
//! `placedWorldWonders`, so it is a placed wonder of the DTO) and for every
//! city (`:16158`, `reapplyCityHexDecorHides` `:16209-16212`).
//!
//! Decision D-DTO-1 = A: the producer in the engine computes the DTO; this
//! module only places models. No game rule is evaluated here: the forest flag
//! is `HexDynDto.nakladka`, the hidden hexes are the cities and the placed
//! wonders of the snapshot (the same set as
//! [`crate::view::solid_hidden_hexes`]), the unit hexes are given by the
//! caller. Not covered (outside the DTO, see `view/terrain.rs` module doc):
//! the event-driven hides of `main.ts:16801`, `:16884`, `:16891`, `:16944`,
//! `:17014`, `:42967` (forest cut, improvements); a wonder build site under
//! construction does not hide decor in the pin either (only `:5264`, on
//! completion).
//!
//! The non-styled paths of the pin (`buildStyleForestCluster`, the
//! `forestMesh` cones, `:2375+`) and the zoom LOD flag
//! (`zoomFlags.styledDecor`, layer visibility) are not part of this module.

use std::collections::HashSet;

use civ_view_model as vm;

use super::forest::{rotacja_lasu_dla_heksa, wariant_lasu_dla_heksa, LICZBA_WARIANTOW_LASU};
use super::jungle::{
    rotacja_djungli_dla_heksa, wariant_djungli_dla_heksa, LICZBA_WARIANTOW_DJUNGLI,
};
use super::style::is_warm_jungle_forest_hex;
use crate::core::fog_dim::fog_brightness_for_hex;
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;
use crate::pick::three::Vec3;
use crate::terrain::{instance_matrix, zero_matrix};
use crate::view::{pick_hex, seed_i32, terrain, FogSets, ViewAdapterError};

/// `NL_NATURAL` (`scene.ts:1719`): the natural forest uses variants `0..4`;
/// variant 4 (`L4`, stumps and a log) is reserved for the dynamic clearing.
pub const NL_NATURAL: usize = 4;

/// Which clump model stands on a hex.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum ForestKind {
    /// `lasInst` (`lasy-modele.ts`, [`super::forest`]).
    Las,
    /// `djunglaInst` (`djungla-modele.ts`, [`super::jungle`]).
    Djungla,
}

/// One hex of the placement input, in `Object.values(map.hexes)` order.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct ForestHexInput {
    /// Axial coordinate.
    pub coord: HexCoord,
    /// `terenBazowy`.
    pub terrain: Terrain,
    /// `nakladka === Nakladka.Las`.
    pub las: bool,
}

/// One instanced layer (`lasInst[v]` / `djunglaInst[v]`): the original
/// matrices (`lasOrigMatrix[v]`) and hexes (`lasHexKey[v]`) of its instances.
#[derive(Clone, Debug, PartialEq)]
pub struct ForestLayer {
    /// Model family.
    pub kind: ForestKind,
    /// Variant index (geometry `las_geometria(v)` / `djungla_geometria(v)`).
    pub variant: usize,
    /// Original instance matrices (column-major `Float32`), placement order.
    pub matrices: Vec<[f32; 16]>,
    /// Hex of each instance.
    pub hexes: Vec<HexCoord>,
}

impl ForestLayer {
    fn new(kind: ForestKind, variant: usize) -> Self {
        Self {
            kind,
            variant,
            matrices: Vec::new(),
            hexes: Vec::new(),
        }
    }
}

/// The per-frame state of one instance after `applyLasFog`.
#[derive(Clone, Copy, Debug, PartialEq)]
pub struct ForestInstanceState {
    /// `ZERO_MATRIX` when hidden, the original matrix otherwise.
    pub matrix: [f32; 16],
    /// `Some(bri)` → `setColorAt(i, (bri, bri, bri))`; `None` when hidden
    /// (the pin leaves the colour untouched).
    pub brightness: Option<f64>,
}

/// Forest / jungle placement of one map plus its per-hex hide state
/// (`decorHiddenHexKeys`, `unitForestHiddenHexKeys`).
#[derive(Clone, Debug, PartialEq)]
pub struct ForestPlacement {
    /// `lasInst[0..NL)` (NL = [`LICZBA_WARIANTOW_LASU`]; layer 4 stays empty
    /// at build, `NL_NATURAL`).
    pub las: Vec<ForestLayer>,
    /// `djunglaInst[0..NDJ)` (NDJ = [`LICZBA_WARIANTOW_DJUNGLI`]).
    pub djungla: Vec<ForestLayer>,
    decor_hidden: HashSet<HexCoord>,
    unit_forest_hidden: HashSet<HexCoord>,
}

/// Places the forest / jungle clumps (`scene.ts:2346-2374`). `seed` is
/// `map.seed | 0`, `map_height` is `map.wysokoscR`.
#[must_use]
pub fn place_forests(seed: i32, map_height: u32, hexes: &[ForestHexInput]) -> ForestPlacement {
    let mut las: Vec<ForestLayer> = (0..LICZBA_WARIANTOW_LASU)
        .map(|v| ForestLayer::new(ForestKind::Las, v))
        .collect();
    let mut djungla: Vec<ForestLayer> = (0..LICZBA_WARIANTOW_DJUNGLI)
        .map(|v| ForestLayer::new(ForestKind::Djungla, v))
        .collect();
    let height = f64::from(map_height);
    for h in hexes {
        if !(h.las && h.terrain.is_dry_land()) {
            continue;
        }
        let (q, r) = (h.coord.q, h.coord.r);
        let (x, z) = axial_to_world(h.coord, HEX_R);
        // `baseY = vis.height + vis.yOffset` (`:2348`), no coastal drop.
        let pos = Vec3::new(x, h.terrain.top_y(), z);
        let (layer, yaw) = if is_warm_jungle_forest_hex(r, height) {
            let v = wariant_djungli_dla_heksa(q, r, LICZBA_WARIANTOW_DJUNGLI, seed);
            (&mut djungla[v], rotacja_djungli_dla_heksa(q, r, seed))
        } else {
            let v = wariant_lasu_dla_heksa(q, r, NL_NATURAL, seed);
            (&mut las[v], rotacja_lasu_dla_heksa(q, r, seed))
        };
        layer.matrices.push(instance_matrix(pos, yaw));
        layer.hexes.push(h.coord);
    }
    ForestPlacement {
        las,
        djungla,
        decor_hidden: HashSet::new(),
        unit_forest_hidden: HashSet::new(),
    }
}

/// `MapViewDto` + `HexDynDto.nakladka` → the placement input, DTO order.
///
/// # Errors
///
/// [`ViewAdapterError::LengthMismatch`] when `hex_state` is not parallel to
/// `map.hexes`.
pub fn forest_hexes(
    map: &vm::MapViewDto,
    hex_state: &[vm::HexDynDto],
) -> Result<Vec<ForestHexInput>, ViewAdapterError> {
    if hex_state.len() != map.hexes.len() {
        return Err(ViewAdapterError::LengthMismatch {
            field: "hex_state",
            expected: map.hexes.len(),
            actual: hex_state.len(),
        });
    }
    Ok(map
        .hexes
        .iter()
        .zip(hex_state)
        .map(|(h, d)| ForestHexInput {
            coord: pick_hex(h.coord),
            terrain: terrain(h.teren_bazowy),
            las: d.nakladka == vm::Nakladka::Las,
        })
        .collect())
}

impl ForestPlacement {
    /// Builds the placement from the snapshot and applies the DTO-carried
    /// hides: every placed wonder, ruins included (`main.ts:4312`, `:5264`)
    /// and every city (`main.ts:16158`, `:16211`).
    ///
    /// # Errors
    ///
    /// [`ViewAdapterError::LengthMismatch`] when `hex_state` is not parallel
    /// to `map.hexes`.
    pub fn from_dto(
        map: &vm::MapViewDto,
        hex_state: &[vm::HexDynDto],
        cities: &[vm::CityViewDto],
        wonders: &[vm::PlacedWonderDto],
    ) -> Result<Self, ViewAdapterError> {
        let hexes = forest_hexes(map, hex_state)?;
        let mut out = place_forests(seed_i32(map.seed), map.height, &hexes);
        for w in wonders {
            out.hide_decor_at_hex(pick_hex(w.hex));
        }
        for c in cities {
            out.hide_decor_at_hex(pick_hex(c.hex));
        }
        Ok(out)
    }

    /// `hideDecorAtHex(hexKey)` (`scene.ts:3172-3174`, forest part
    /// `:3189-3196`): permanent.
    pub fn hide_decor_at_hex(&mut self, hex: HexCoord) {
        self.unit_forest_hidden.remove(&hex);
        self.decor_hidden.insert(hex);
    }

    /// `syncForestForUnits(hexKeys)` (`scene.ts:3164-3170`): the unit set is
    /// replaced, decor-hidden hexes are left out.
    pub fn sync_forest_for_units<I: IntoIterator<Item = HexCoord>>(&mut self, hex_keys: I) {
        self.unit_forest_hidden.clear();
        for k in hex_keys {
            if !self.decor_hidden.contains(&k) {
                self.unit_forest_hidden.insert(k);
            }
        }
    }

    /// `decorHiddenHexKeys.has(hex)`.
    #[must_use]
    pub fn is_decor_hidden(&self, hex: HexCoord) -> bool {
        self.decor_hidden.contains(&hex)
    }

    /// `unitForestHiddenHexKeys.has(hex)`.
    #[must_use]
    pub fn is_unit_forest_hidden(&self, hex: HexCoord) -> bool {
        self.unit_forest_hidden.contains(&hex)
    }

    /// `forestHidden(k)` without fog (`scene.ts:3257-3260`).
    #[must_use]
    pub fn forest_hidden(&self, hex: HexCoord) -> bool {
        self.decor_hidden.contains(&hex) || self.unit_forest_hidden.contains(&hex)
    }

    /// The layers in draw order: `lasInst[0..NL)`, then `djunglaInst[0..NDJ)`
    /// (`scene.ts:3382-3389`).
    pub fn layers(&self) -> impl Iterator<Item = &ForestLayer> {
        self.las.iter().chain(self.djungla.iter())
    }

    /// Number of placed instances (hidden ones included; the pin zeroes, it
    /// does not remove).
    #[must_use]
    pub fn instance_count(&self) -> usize {
        self.layers().map(|l| l.hexes.len()).sum()
    }

    /// `applyLasFog` for one layer (`scene.ts:3307-3328`). `fog` is the last
    /// `setFog` pair (`None` before the first call: `hasFog = false`).
    #[must_use]
    pub fn apply_las_fog(
        &self,
        layer: &ForestLayer,
        fog: Option<&FogSets>,
    ) -> Vec<ForestInstanceState> {
        let empty = HashSet::new();
        let (visible, explored, has_fog) = match fog {
            Some(f) => (&f.visible, &f.explored, true),
            None => (&empty, &empty, false),
        };
        layer
            .hexes
            .iter()
            .zip(&layer.matrices)
            .map(|(k, m)| {
                let bri = fog_brightness_for_hex(k, visible, explored, has_fog);
                if bri <= 0.0 || self.forest_hidden(*k) {
                    ForestInstanceState {
                        matrix: zero_matrix(),
                        brightness: None,
                    }
                } else {
                    ForestInstanceState {
                        matrix: *m,
                        brightness: Some(bri),
                    }
                }
            })
            .collect()
    }

    /// Hexes whose clump is drawn after `applyLasFog`, in draw order
    /// ([`Self::layers`], then instance order).
    #[must_use]
    pub fn visible_instances(&self, fog: Option<&FogSets>) -> Vec<(ForestKind, usize, HexCoord)> {
        let mut out = Vec::new();
        for layer in self.layers() {
            for (state, hex) in self.apply_las_fog(layer, fog).iter().zip(&layer.hexes) {
                if state.brightness.is_some() {
                    out.push((layer.kind, layer.variant, *hex));
                }
            }
        }
        out
    }
}
