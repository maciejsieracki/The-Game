//! R-RUSTPORT-P4-1F6: oswietlony krag startu i walidacja pierwszego miasta gracza.
//!
//! Port `gra/src/game/first-player-city.ts` (pin `07d2fbd72`, cale 49 linii) oraz
//! domkniec `isInStartReveal` / `canFoundPlayerCityAt` z `main.ts:12886-12943`.
//!
//! Granica portu (decyzja techniczna, raport 01-operator-r1): domkniecie `canFoundPlayerCityAt`
//! w pinie woła `canFoundCity(q, r, cities, map, {...foundingTerritoryOpts(ME()), ownerId, ownerEra,
//! gameConfig})` (`main.ts:12928-12933`). Ten wynik bazowy (`base.ok`, `base.reason`) przychodzi tu
//! jako wejscie wolajacego (`base`), bo `canFoundCity` jest juz w Rust
//! (`state::p6_6b::cities::can_found_city`), a skladanie `foundingTerritoryOpts` (wezly miast,
//! forty) nalezy do wolajacego. Ten modul nie zmienia zadnej innej czesci silnika.

use crate::domain::js_math::js_max;
use crate::domain::state::p6_6b::cities::CanFoundCityResult;

/// Wynik walidacji `{ ok, reason }` (`first-player-city.ts:43`, `canFoundCity` `cities.ts:1163`);
/// `reason` pusty, gdy `ok`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PlacementCheck {
    /// `ok`.
    pub ok: bool,
    /// `reason`.
    pub reason: String,
}

impl From<CanFoundCityResult> for PlacementCheck {
    fn from(r: CanFoundCityResult) -> Self {
        Self {
            ok: r.ok,
            reason: r.reason,
        }
    }
}

/// `FIRST_CITY_START_REVEAL_DENIED` (`first-player-city.ts:7`).
pub const FIRST_CITY_START_REVEAL_DENIED: &str = "poza oświetlonym obszarem startu";

/// `isAwaitingFirstPlayerCity(playerEverOwnedCity, cities, playerOwnerId = 0)`
/// (`first-player-city.ts:14-20`): `!playerEverOwnedCity && !cities.some(c => c.ownerId === playerOwnerId)`.
/// `city_owner_ids` = `ownerId` kolejnych miast.
#[must_use]
pub fn is_awaiting_first_player_city(
    player_ever_owned_city: bool,
    city_owner_ids: impl IntoIterator<Item = i64>,
    player_owner_id: i64,
) -> bool {
    !player_ever_owned_city && !city_owner_ids.into_iter().any(|o| o == player_owner_id)
}

/// Web `hexDistance` (`units/setup.ts:361-366`): `Math.max(|dq|, |dr|, |ds|)` na liczbach JS
/// (NaN propaguje jak `Math.max`).
#[must_use]
pub fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    js_max(js_max(dq, dr), ds)
}

/// `isHexInStartReveal(q, r, awaitingFirstCity, playerStartHex, startRevealRadius, hexDistance)`
/// (`first-player-city.ts:23-33`): poza oczekiwaniem na pierwsze miasto albo bez heksu startu
/// zawsze `true`; inaczej `hexDistance(q, r, start) <= startRevealRadius` (granica wlacznie, `:32`).
#[must_use]
pub fn is_hex_in_start_reveal(
    q: f64,
    r: f64,
    awaiting_first_city: bool,
    player_start_hex: Option<(f64, f64)>,
    start_reveal_radius: f64,
    hex_distance: impl Fn(f64, f64, f64, f64) -> f64,
) -> bool {
    let Some((sq, sr)) = player_start_hex.filter(|_| awaiting_first_city) else {
        return true;
    };
    hex_distance(q, r, sq, sr) <= start_reveal_radius
}

/// `validateFirstPlayerCityPlacement(q, r, awaitingFirstCity, inStartReveal, baseOk, baseReason = '')`
/// (`first-player-city.ts:36-48`). `q`/`r` sa w pinie nieuzywane (zachowane dla sygnatury).
#[must_use]
pub fn validate_first_player_city_placement(
    _q: f64,
    _r: f64,
    awaiting_first_city: bool,
    in_start_reveal: bool,
    base_ok: bool,
    base_reason: &str,
) -> PlacementCheck {
    if !base_ok {
        return PlacementCheck {
            ok: false,
            reason: base_reason.to_owned(),
        };
    }
    if awaiting_first_city && !in_start_reveal {
        return PlacementCheck {
            ok: false,
            reason: FIRST_CITY_START_REVEAL_DENIED.to_owned(),
        };
    }
    PlacementCheck {
        ok: true,
        reason: String::new(),
    }
}

/// Kontekst domkniec `isInStartReveal` / `canFoundPlayerCityAt` (`main.ts:12886-12943`) dla
/// aktywnego fotela `ME()`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StartRevealContext {
    /// `isAwaitingFirstPlayerCity()` (`main.ts:12882-12884`) dla `ME()`.
    pub awaiting_first_city: bool,
    /// `playerStartHexFor(ME())` (`main.ts:3027`); `None` = `null`.
    pub player_start_hex: Option<(f64, f64)>,
    /// `startRevealRadius` (`main.ts:3033`, `:44381`).
    pub start_reveal_radius: f64,
}

impl StartRevealContext {
    /// `isInStartReveal(q, r)` (`main.ts:12886-12895`) z `hexDistance` z `units/setup.ts`.
    #[must_use]
    pub fn is_in_start_reveal(&self, q: f64, r: f64) -> bool {
        is_hex_in_start_reveal(
            q,
            r,
            self.awaiting_first_city,
            self.player_start_hex,
            self.start_reveal_radius,
            hex_distance,
        )
    }

    /// `canFoundPlayerCityAt(q, r)` (`main.ts:12923-12943`): `base(q, r)` = wynik
    /// `canFoundCity(q, r, cities, map, {...foundingTerritoryOpts(ME()), ownerId: ME(), ownerEra,
    /// gameConfig})` (`:12928-12933`), potem `validateFirstPlayerCityPlacement` (`:12934-12941`).
    #[must_use]
    pub fn can_found_player_city_at(
        &self,
        q: f64,
        r: f64,
        base: impl FnOnce(f64, f64) -> PlacementCheck,
    ) -> PlacementCheck {
        let base = base(q, r);
        validate_first_player_city_placement(
            q,
            r,
            self.awaiting_first_city,
            self.is_in_start_reveal(q, r),
            base.ok,
            &base.reason,
        )
    }
}
