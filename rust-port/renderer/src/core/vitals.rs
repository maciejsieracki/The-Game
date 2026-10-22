//! `render/unitVitalsPalette.ts` (web `edb8fb56`, 89 LOC): the single source
//! of the HP and movement bar colours, shared by the unit panel (CSS) and the
//! stat plate above a token (3D). Pure constants.

/// `VITALS_HP_DARK_CSS` (`unitVitalsPalette.ts:35`).
pub const VITALS_HP_DARK_CSS: &str = "#1a6020";
/// `VITALS_HP_FULL_CSS` (`:37`).
pub const VITALS_HP_FULL_CSS: &str = "#50b070";
/// `VITALS_HP_FULL` (`:45`): the map bar uses the light end of the gradient.
pub const VITALS_HP_FULL: u32 = 0x0050_b070;
/// `VITALS_HP_MID` (`:55`): amber, map only.
pub const VITALS_HP_MID: u32 = 0x00d9_a133;
/// `VITALS_HP_LOW` (`:56`): red, map only.
pub const VITALS_HP_LOW: u32 = 0x00d4_4b3c;
/// `VITALS_HP_MID_FRAC` (`:59`).
pub const VITALS_HP_MID_FRAC: f64 = 0.60;
/// `VITALS_HP_LOW_FRAC` (`:61`).
pub const VITALS_HP_LOW_FRAC: f64 = 0.30;
/// `VITALS_MOVE_DARK_CSS` (`:68`).
pub const VITALS_MOVE_DARK_CSS: &str = "#2a5080";
/// `VITALS_MOVE_FULL_CSS` (`:70`).
pub const VITALS_MOVE_FULL_CSS: &str = "#60a8e8";
/// `VITALS_MOVE_FULL` (`:76`).
pub const VITALS_MOVE_FULL: u32 = 0x0060_a8e8;
/// `VITALS_TROUGH_CSS` (`:89`).
pub const VITALS_TROUGH_CSS: &str = "rgba(0,0,0,0.62)";
