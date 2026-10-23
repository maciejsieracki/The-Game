//! `render/workerFieldOverlay.ts` (pin `edb8fb56`, 211 LOC): the 👤 icons
//! on worked fields of the world map, coloured with the owner palette (the
//! player's icon gets an extra ring), and the fog pass over them.
//!
//! `:N` = line `N` of `workerFieldOverlay.ts`. The worked fields come from
//! the caller (`workedByOwner`, hex → owner id, `main.ts:12642`).

use std::collections::HashSet;
use std::hash::BuildHasher;

use super::trace;
use super::{hex_to_rgba, CanvasTexture, SpriteMaterial, SpriteNode, TextureRef};
use crate::core::fog_dim::fog_brightness_for_hex;
use crate::models::misc::{HexKey, OverlayMap};
use crate::pick::hex::{axial_to_world, HexCoord, HEX_R};
use crate::pick::terrain::Terrain;
use crate::raster::image::emoji::{self, TextStyle};
use crate::raster::{Canvas2dLite, RasterError};

pub use crate::raster::atlas::keys::worker_sprite_cache_key;

/// `WORKER_ICON_SCALE` (`:12`).
pub const WORKER_ICON_SCALE: f64 = 0.72;
/// `WORKER_Y_OFFSET` (`:13`).
pub const WORKER_Y_OFFSET: f64 = 0.18;
/// `WORKER_BASE_OPACITY` (`:14`).
pub const WORKER_BASE_OPACITY: f64 = 0.9;
/// Icon canvas side (`:71-72`).
pub const WORKER_ICON_PX: u32 = 64;
/// Icon sprite `renderOrder` (`:123`).
pub const WORKER_RENDER_ORDER: i32 = 18;
/// Icon glyph font (`:98`).
pub const WORKER_ICON_FONT: &str = "bold 16px Segoe UI, Arial";

/// `WORKER_OWNER_COLORS` (`:22-31`).
pub const WORKER_OWNER_COLORS: [u32; 8] = [
    0x00ff_d54a,
    0x00e5_3935,
    0x0043_a047,
    0x001e_88e5,
    0x00fb_8c00,
    0x008e_24aa,
    0x0000_acc1,
    0x00f0_6292,
];

/// `workerOwnerColor(ownerId)` (`:34-36`):
/// `WORKER_OWNER_COLORS[ownerId % 8]`. JS `%` keeps the dividend's sign and
/// fractions, so a negative or fractional id indexes nothing (`undefined`,
/// `None` here).
#[must_use]
pub fn worker_owner_color(owner_id: f64) -> Option<u32> {
    // `#[allow]`: `8.0` is exact; f64 `%` is JS `%` (fmod).
    let i = owner_id % 8.0;
    if i.fract() == 0.0 && (0.0..8.0).contains(&i) {
        #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
        let idx = i as usize;
        Some(WORKER_OWNER_COLORS[idx])
    } else {
        None
    }
}

/// `workerOwnerColorRgba(ownerId, alpha)` (`:46-48`).
#[must_use]
pub fn worker_owner_color_rgba(owner_id: f64, alpha: f64) -> String {
    hex_to_rgba(worker_owner_color(owner_id), alpha)
}

/// `getWorkerIconTexture(ownerId, playerOwnerId)` (`:63-109`) without the
/// module cache (keyed by [`worker_sprite_cache_key`]; the caller caches).
///
/// # Errors
/// Never in practice (64 × 64 canvas, positive radii).
#[allow(clippy::float_cmp)] // `ownerId === playerOwnerId`
pub fn render_worker_icon(
    owner_id: f64,
    player_owner_id: f64,
) -> Result<CanvasTexture, RasterError> {
    let color = worker_owner_color(owner_id);
    let is_player = owner_id == player_owner_id;
    let mut ctx = Canvas2dLite::new(WORKER_ICON_PX, WORKER_ICON_PX)?;
    trace::clear_rect(&mut ctx, 0.0, 0.0, 64.0, 64.0);
    let pi2 = std::f64::consts::PI * 2.0;
    let cx = 32.0;
    let cy = 32.0;
    let badge_r = if is_player { 11.0 } else { 12.0 };

    if is_player {
        ctx.set_stroke_style(&hex_to_rgba(color, 1.0));
        ctx.set_line_width(3.5);
        ctx.begin_path();
        ctx.arc(cx, cy, badge_r + 4.0, 0.0, pi2, false)?;
        ctx.stroke();
        ctx.set_stroke_style("rgba(0,0,0,0.35)");
        ctx.set_line_width(1.0);
        ctx.begin_path();
        ctx.arc(cx, cy, badge_r + 5.5, 0.0, pi2, false)?;
        ctx.stroke();
    }

    trace::set_fill_style(
        &mut ctx,
        &hex_to_rgba(color, if is_player { 0.72 } else { 0.62 }),
    );
    ctx.begin_path();
    ctx.arc(cx, cy, badge_r, 0.0, pi2, false)?;
    ctx.fill();

    trace::set_fill_style(&mut ctx, "rgba(255,255,255,0.92)");
    trace::fill_text_event(
        WORKER_ICON_FONT,
        "center",
        "middle",
        "\u{1f464}",
        cx,
        cy + 1.0,
    );
    if let Some(style) = TextStyle::new(WORKER_ICON_FONT, "center", "middle") {
        emoji::fill_text(&mut ctx, &style, "\u{1f464}", cx, cy + 1.0);
    }
    Ok(CanvasTexture::from_canvas(&ctx, 1))
}

/// `makeWorkerIconSprite(ownerId, playerOwnerId)` (`:111-127`).
#[must_use]
pub fn worker_icon_sprite(owner_id: f64, player_owner_id: f64) -> SpriteNode {
    let key = worker_sprite_cache_key(owner_id, player_owner_id);
    let mut m = SpriteMaterial::overlay(TextureRef::WorkerIcon(key));
    m.opacity = WORKER_BASE_OPACITY;
    m.depth_write = false;
    m.fog_base_opacity = Some(WORKER_BASE_OPACITY);
    let mut s = SpriteNode::new(m);
    s.render_order = WORKER_RENDER_ORDER;
    s.center = [0.5, 0.5];
    s.scale = [WORKER_ICON_SCALE, WORKER_ICON_SCALE, 1.0];
    s
}

/// The `worker-field-overlay` group (`:130-156`).
#[derive(Clone, Debug, PartialEq)]
pub struct WorkerFieldOverlay {
    /// `group.name`.
    pub name: &'static str,
    /// `group.children`.
    pub sprites: Vec<SpriteNode>,
}

impl WorkerFieldOverlay {
    /// The distinct texture keys the sprites use, in first-use order (the
    /// textures to render with [`render_worker_icon`]).
    #[must_use]
    pub fn texture_keys(&self) -> Vec<String> {
        let mut out: Vec<String> = Vec::new();
        for s in &self.sprites {
            if let TextureRef::WorkerIcon(k) = &s.material.map {
                if !out.contains(k) {
                    out.push(k.clone());
                }
            }
        }
        out
    }
}

/// `buildWorkerFieldOverlayGroup(map, workedByOwner, playerOwnerId)`
/// (`:130-156`). `worked_by_owner` is the `Map` in insertion order.
#[must_use]
pub fn build_worker_field_overlay(
    map: &OverlayMap,
    worked_by_owner: &[(HexKey, f64)],
    player_owner_id: f64,
) -> WorkerFieldOverlay {
    let mut sprites = Vec::new();
    for &(key, owner_id) in worked_by_owner {
        let Some(t) = map.terrain(key) else {
            continue;
        };
        if t == Terrain::Morze || t == Terrain::Gory {
            continue;
        }
        let mut s = worker_icon_sprite(owner_id, player_owner_id);
        s.hex_key = Some(key);
        let (x, z) = axial_to_world(HexCoord { q: key.0, r: key.1 }, HEX_R);
        s.position = [x, map.hex_top_y(key, WORKER_Y_OFFSET), z];
        sprites.push(s);
    }
    WorkerFieldOverlay {
        name: "worker-field-overlay",
        sprites,
    }
}

/// `syncWorkerFieldOverlay(scene, current, map, workedByOwner,
/// playerOwnerId = 0)` (`:158-173`) without the scene bookkeeping: `None`
/// for an empty map (the web returns `null`), else the new group.
#[must_use]
pub fn sync_worker_field_overlay(
    map: &OverlayMap,
    worked_by_owner: &[(HexKey, f64)],
    player_owner_id: Option<f64>,
) -> Option<WorkerFieldOverlay> {
    if worked_by_owner.is_empty() {
        return None;
    }
    Some(build_worker_field_overlay(
        map,
        worked_by_owner,
        player_owner_id.unwrap_or(0.0),
    ))
}

/// `syncWorkerFieldOverlayFog(group, vis, exploredKeys, fogActive)`
/// (`:176-194`): hides icons on unexplored hexes, dims explored ones.
pub fn sync_worker_field_overlay_fog<S: BuildHasher>(
    group: Option<&mut WorkerFieldOverlay>,
    visible: &HashSet<HexKey, S>,
    explored: &HashSet<HexKey, S>,
    fog_active: bool,
) {
    let Some(group) = group else {
        return;
    };
    for s in &mut group.sprites {
        let Some(key) = s.hex_key else {
            continue;
        };
        let base = s.material.fog_base_opacity.unwrap_or(WORKER_BASE_OPACITY);
        let bri = fog_brightness_for_hex(&key, visible, explored, fog_active);
        s.visible = bri > 0.0;
        if bri > 0.0 {
            s.material.opacity = base * bri;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn palette_wraps_like_js_modulo() {
        assert_eq!(worker_owner_color(9.0), Some(0x00e5_3935));
        assert_eq!(worker_owner_color(-1.0), None);
        assert_eq!(worker_owner_color(1.5), None);
        assert_eq!(worker_owner_color_rgba(-1.0, 0.72), "rgba(0,0,0,0.72)");
        assert_eq!(worker_owner_color_rgba(0.0, 1.0), "rgba(255,213,74,1)");
    }
}
