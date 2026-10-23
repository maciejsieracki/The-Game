//! `labels` — the web's DOM-anchored map labels drawn by Rust (RR-T8e,
//! `R-RUSTPORT-P4-34-ANCHORS-DOM-Q1`; owner decision UI-Q2 = A, plan
//! `P4-25-TEXT-RASTER-AUDIT.md` §2.3 / §6).
//!
//! In the web these four groups are HTML elements positioned over the WebGL
//! canvas (pin `edb8fb56`):
//!
//! | group | web | content |
//! |---|---|---|
//! | R4 build chip | `main.ts:12851-12968` | emoji icon + „Kliknij hex” / „Niedozwolone” (+ wrapped reason) |
//! | R5 siege label | `main.ts:14560-14603` | ⚔ OBŁĘŻENIE / `<small>` city name |
//! | R15a damage | `battle/battleScene.ts:9091-9116` | `-<dmg>` |
//! | R15b wall | `battle/battleScene.ts:7477-7493` | `-<dmg> (mur)` / `MUR WYBURZONY!` |
//!
//! Here they become **textures** rendered on the CPU rasteriser
//! (`raster::Canvas2dLite`, RR-T8a; text RR-T8b; colour emoji per D-TXT-3
//! through `raster::image::emoji`, RR-T8c):
//!
//! - [`layout`] — the HTML layout of exactly these structures (padding,
//!   border, `border-radius`, `<br>`, flex rows/column, wrapping at
//!   `max-width`, `text-align: center`) in Chromium's `LayoutUnit`;
//! - [`paint`] — `box-shadow`, background, border, `text-shadow` (blur) and
//!   text, then element `opacity`;
//! - [`anchor`] — world → screen (`camera` matrices) and the label's CSS
//!   `transform`, and the shared float mechanism of R15a/R15b (rise
//!   `riseRate · age`, fade `1 − p²`, removal at `p ≥ 1`);
//! - [`style`] — the web's constants as data.
//!
//! GPU upload (sprites in the scene) and DOM hit-testing are out of scope
//! (separate topics). R6 (dev gallery) waits for D-UI-7.

pub mod anchor;
pub mod layout;
pub mod paint;
pub mod shape;
pub mod style;

pub use anchor::{
    anchored_rect, battle_world_to_screen, build_chip_left_top, r15a_anchor_world,
    r15b_anchor_world, r4_anchor_world, r5_anchor_world, siege_label_position, world_to_client_px,
    AnchorTransform, FloatFrame, FloatLabel, ProjectionCamera, ScreenRect,
};
pub use layout::{layout_r15a, layout_r15b, layout_r4, layout_r5, LabelLayout, TextFragment};
pub use paint::{render_label, LabelTexture};

/// One label instance of the four groups.
#[derive(Clone, Debug, PartialEq)]
pub enum Label {
    /// R4: icon (see [`style::r4_icon_for`]), validity, reason (shown only
    /// when invalid).
    BuildChip {
        /// Icon text (one emoji).
        icon: String,
        /// `ghostChipValid`.
        valid: bool,
        /// `ghostChipReason` (empty = none).
        reason: String,
    },
    /// R5: the besieged city's name (not upper-cased, `main.ts:14569`).
    Siege {
        /// `city.name`.
        city: String,
    },
    /// R15a: damage dealt.
    Damage {
        /// `dmg`.
        dmg: i64,
    },
    /// R15b: wall label with its text and colour.
    Wall {
        /// Text.
        text: String,
        /// CSS colour.
        color: String,
    },
}

impl Label {
    /// The label's layout.
    #[must_use]
    pub fn layout(&self) -> LabelLayout {
        match self {
            Label::BuildChip {
                icon,
                valid,
                reason,
            } => layout_r4(icon, *valid, reason),
            Label::Siege { city } => layout_r5(city),
            Label::Damage { dmg } => layout_r15a(*dmg),
            Label::Wall { text, color } => layout_r15b(text, color),
        }
    }

    /// The CSS transform that anchors the label box to its screen point.
    #[must_use]
    pub fn transform(&self) -> AnchorTransform {
        match self {
            Label::BuildChip { .. } => AnchorTransform::None,
            Label::Siege { .. } => AnchorTransform::CenterBottom,
            Label::Damage { .. } | Label::Wall { .. } => AnchorTransform::Center,
        }
    }

    /// Renders the label texture (device scale `dsf`, element `opacity`).
    #[must_use]
    pub fn render(&self, dsf: f64, opacity: f32) -> LabelTexture {
        render_label(&self.layout(), dsf, opacity)
    }
}
