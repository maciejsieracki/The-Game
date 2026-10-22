//! `render/settlementModel.ts` (web `edb8fb56`, 27 LOC): the settlement
//! factory, `roblox` branch only. The game style is the constant
//! `GAME_MAP_RENDER_STYLE = 'roblox'` (`mapRenderStyle.ts:40`); the
//! `civ`/`minecraft` branch (`buildBronzeCity` / `buildStoneAgeCity`) is
//! out of scope (D-MOD-1).
//!
//! Live callers in the web: the city-founding ghost
//! (`main.ts:13023`: `buildSettlementModel(player.era, civ, 1, 0xffd54a,
//! false)`); `CityRenderer` reaches it only for a non-`roblox` style
//! (`cities.ts:249`), i.e. never in the game.

use super::ghost_braz::build_bronze_city_roblox;
use super::ghost_kamien::build_stone_age_city_roblox;
use super::model::CityModel;
use crate::core::bronze::BronzeCiv;
use crate::pick::hex::js_round;
use crate::pick::three::{js_max, js_min};

/// `buildSettlementModel(era, civ, level, ownerCol, withWalls)` with
/// `style = GAME_MAP_RENDER_STYLE` (`settlementModel.ts:12-24`): era ≥ 2 →
/// [`build_bronze_city_roblox`], otherwise (also NaN) →
/// [`build_stone_age_city_roblox`] (per-civ overload).
#[must_use]
pub fn build_settlement_model(
    era: f64,
    civ: BronzeCiv,
    level: f64,
    owner_col: u32,
    with_walls: bool,
) -> CityModel {
    let l = js_max(1.0, js_min(10.0, js_round(level)));
    if era >= 2.0 {
        return build_bronze_city_roblox(civ, l, owner_col, with_walls);
    }
    build_stone_age_city_roblox(civ, l, owner_col, with_walls)
}
