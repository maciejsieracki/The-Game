//! R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1 (partia 1): oblezenie w dwoch etapach -- decyzja stanu glodu garnizonu.
//!
//! Port czystej czesci `gra/src/game/siege-starvation.ts` (web `a61337844`, R-WEB-SIEGE-STARVATION-SURRENDER-Q1):
//! * [`garrison_hp_totals`] = `garrisonHpTotals` (`siege-starvation.ts:76-90`);
//! * [`siege_starvation_state`] = `siegeStarvationState` (`siege-starvation.ts:99-133`);
//! * [`SIEGE_SURRENDER_BELOW_FRAC`] = `SIEGE_SURRENDER_BELOW_FRAC` (0,5).
//!
//! Zasady (web, decyzja wlasciciela 2026-11-05): etap 1 = zapasy (glod garnizonu jeszcze nie), tick z zapasami 0
//! ROZPOCZYNA glod (zapis `siegeStarveStartMaxHp` bez atrycji); etap 2 = atrycja 6/8/10% maxHP/ture (`apply_attrition`,
//! wykonuje [`crate::domain::turn_economy_attrition::siege_turn_garrison_attrition`]); kapitulacja gdy
//! sumaHP / startMaxHp < 0,5 (remis 50,0% = miasto trzyma) albo garnizon pusty.
//!
//! ZALOZENIA (do akceptacji, brak w dispatchu):
//! * Z-SS-1 Wejscie jednostki w postaci [`SiegeGarrisonUnit`] zastepuje obiekt JS: `hp`/`hp_max`/`type_id` = `undefined`
//!   odpowiada `None`. `hpMax ?? getMaxHp(typeId)` (JS `??`) -> `hp_max.or_else(...)`: `Some(0)` NIE przechodzi
//!   na fallback (zgodnie z `??`).
//! * Z-SS-2 Cywile i jednostki bez maxHP > 0 sa pomijane przez wolajacego lub przez [`garrison_hp_totals`]
//!   (`m <= 0` -> pominiete), identycznie jak web.
//! * Z-SS-3 `food` NaN/Inf traktowane jak web: `Number.isFinite(food) ? food : 0`.
//! * Z-SS-4 `stored` (`siegeStarveStartMaxHp`) liczy sie jako start tylko gdy `typeof number && > 0`;
//!   NaN i 0 => brak startu (web `hasStart`).

/// Web `SIEGE_SURRENDER_BELOW_FRAC` (`siege-starvation.ts:61`).
pub const SIEGE_SURRENDER_BELOW_FRAC: f64 = 0.5;

/// Web `SiegeGarrisonUnit`. `None` = pole `undefined` w JS.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiegeGarrisonUnit {
    pub hp: Option<f64>,
    pub hp_max: Option<f64>,
    pub type_id: Option<String>,
}

/// Web `SiegeStarvationCity` (pola czytane przez decyzje).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiegeStarvationCity {
    pub oblegane: Option<bool>,
    pub siege_capitulation_pending: Option<bool>,
    /// Web `siegeStarveStartMaxHp` (`None` = glod jeszcze nie rozpoczety).
    pub siege_starve_start_max_hp: Option<f64>,
}

/// Web `SiegeStarvationParams` (bez `getMaxHp`, ktore podawane jest jako argument funkcji).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiegeStarvationParams {
    /// Zapasy miasta PO ticku ekonomii.
    pub food: f64,
    /// Prog kapitulacji jako ulamek startowego maxHP; `None` = [`SIEGE_SURRENDER_BELOW_FRAC`].
    pub surrender_below_frac: Option<f64>,
}

/// Web `SiegeStarvationState`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiegeStarvationState {
    /// Zapasy = 0 (etap 2 rozpoczety albo zaczyna sie w tym ticku).
    pub hunger_started: bool,
    /// Tick ma zapisac `siegeStarveStartMaxHp` (= `start_max_hp`) i NIE stosowac jeszcze atrycji.
    pub record_start: bool,
    /// Tick ma zastosowac atrycje HP glodu (etap 2 w toku).
    pub apply_attrition: bool,
    /// Miasto bez garnizonu przy zapasach 0: ustaw `siegeCapitulationPending` (przejecie w nastepnym ticku).
    pub set_legacy_pending: bool,
    /// sumaHP / startMaxHp (`None` gdy glod nie rozpoczety albo brak garnizonu).
    pub hp_fraction: Option<f64>,
    /// Suma maxHP do zapisania (`record_start`) albo aktualny start.
    pub start_max_hp: Option<f64>,
    /// Miasto ma sie poddac w tym ticku.
    pub surrender: bool,
}

/// Wynik [`garrison_hp_totals`] (web `{ hp, maxHp, count }`).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct GarrisonHpTotals {
    pub hp: f64,
    pub max_hp: f64,
    pub count: usize,
}

/// Web `unitMax`: `hpMax ?? getMaxHp(typeId)`, potem `Number.isFinite(m) && m > 0 ? m : 0`.
fn unit_max(u: &SiegeGarrisonUnit, get_max_hp: &dyn Fn(&str) -> f64) -> f64 {
    let m = match (u.hp_max, u.type_id.as_deref()) {
        (Some(m), _) => m,
        (None, Some(t)) => get_max_hp(t),
        (None, None) => 0.0,
    };
    if m.is_finite() && m > 0.0 {
        m
    } else {
        0.0
    }
}

/// Web `unitHp`: `hp ?? max`, potem `Number.isFinite(h) && h > 0 ? Math.min(h, max > 0 ? max : h) : 0`.
fn unit_hp(u: &SiegeGarrisonUnit, max: f64) -> f64 {
    let h = u.hp.unwrap_or(max);
    if h.is_finite() && h > 0.0 {
        if max > 0.0 {
            h.min(max)
        } else {
            h
        }
    } else {
        0.0
    }
}

/// Web `garrisonHpTotals` (`siege-starvation.ts:76-90`): suma maxHP i HP jednostek z maxHP > 0.
pub fn garrison_hp_totals(
    units: &[SiegeGarrisonUnit],
    get_max_hp: &dyn Fn(&str) -> f64,
) -> GarrisonHpTotals {
    let mut out = GarrisonHpTotals::default();
    for u in units {
        let m = unit_max(u, get_max_hp);
        if m <= 0.0 {
            continue;
        }
        out.count += 1;
        out.max_hp += m;
        out.hp += unit_hp(u, m);
    }
    out
}

/// Web `siegeStarvationState` (`siege-starvation.ts:99-133`). Czysta decyzja; wolac PRZED atrycja (decyzja o jej
/// zastosowaniu) i PONOWNIE po atrycji (decyzja o kapitulacji).
pub fn siege_starvation_state(
    city: &SiegeStarvationCity,
    garnizon_units: &[SiegeGarrisonUnit],
    params: &SiegeStarvationParams,
    get_max_hp: &dyn Fn(&str) -> f64,
) -> SiegeStarvationState {
    let none = SiegeStarvationState::default();
    if city.oblegane != Some(true) {
        return none;
    }
    let frac = params
        .surrender_below_frac
        .unwrap_or(SIEGE_SURRENDER_BELOW_FRAC);
    let food = if params.food.is_finite() {
        params.food
    } else {
        0.0
    };
    // Stary zapis / sciezka bez garnizonu: flaga ustawiona w poprzednim ticku -> przejecie teraz.
    if city.siege_capitulation_pending == Some(true) {
        return SiegeStarvationState {
            hunger_started: true,
            surrender: true,
            ..none
        };
    }
    if food > 0.0 {
        return none;
    }

    let tot = garrison_hp_totals(garnizon_units, get_max_hp);
    // Web `hasStart`: typeof number && > 0 (NaN odpada, bo NaN > 0 jest fałszem).
    let stored = city.siege_starve_start_max_hp.filter(|s| *s > 0.0);

    let Some(start_max) = stored else {
        if tot.count == 0 {
            // Bez garnizonu: sciezka historyczna (flaga + nastepny tick).
            return SiegeStarvationState {
                hunger_started: true,
                set_legacy_pending: true,
                ..none
            };
        }
        // Pierwszy tick glodu: zapamietaj start, jeszcze bez atrycji.
        return SiegeStarvationState {
            hunger_started: true,
            record_start: true,
            hp_fraction: if tot.max_hp > 0.0 {
                Some(tot.hp / tot.max_hp)
            } else {
                None
            },
            start_max_hp: Some(tot.max_hp),
            ..none
        };
    };

    // Etap 2 w toku. Pusty garnizon (wszyscy zgineli/wyszli) = kapitulacja.
    let fraction = tot.hp / start_max;
    let surrender = tot.count == 0 || tot.hp / start_max < frac;
    SiegeStarvationState {
        hunger_started: true,
        apply_attrition: true,
        hp_fraction: Some(fraction),
        start_max_hp: Some(start_max),
        surrender,
        ..none
    }
}
