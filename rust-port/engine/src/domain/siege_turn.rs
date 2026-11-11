//! R-RUSTPORT-P6-WIRE-WAR-SIEGE-AIAI-TURN-Q1 (W7): tick oblezenia jednego miasta w pojedynczej turze.
//!
//! Port SKLADANIA decyzji z webowego bloku `N3: TURA OBLEZENIA` w `gra/src/main.ts` (pin
//! 07d2fbd72f758705f8e1d59cc4968027ffbafe75, funkcja `runWorldEndTurn`-pochodna, blok po `Tick ekonomii miast`):
//! * jedyna decyzja stanu glodu = [`siege_starvation_state`] (`siege_starvation.rs`, nie duplikowana);
//! * atrycja garnizonu, kapitulacja i przejecie legacy sa tu tylko WYBIERANE (flagi w [`SiegeTurnDecision`]);
//!   samo wykonanie (`applyArmyStarvationHpLoss`, `resolveSiegeSurrender`, `handleSiegeCapitulationPhase`,
//!   `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines`) lezy po stronie wolajacego (W8 - podpiecie do petli tury).
//! * wypad (`plan_last_stand_sortie`, `siege_sortie.rs`) i wejscie do miasta (`plan_surrender_entry`,
//!   `siege_enter_city.rs`) NIE sa tu powielane - maja wlasne moduly i testy.
//!
//! Kolejnosc jak w web (`surrenderNow` liczone PRZED atrycja, przeliczane PO niej; legacy ma pierwszenstwo
//! przed kapitulacja):
//! ```text
//! st0 = state(garnizon przed)
//! surrenderNow = st0.surrender
//! if st0.recordStart        -> zapisz startMaxHp (bez atrycji)
//! elif st0.applyAttrition && !st0.surrender
//!                           -> atrycja; surrenderNow = state(garnizon po).surrender
//! if st0.setLegacyPending   -> legacy (przejecie w nastepnym ticku)
//! elif surrenderNow         -> kapitulacja
//! ```
//!
//! Licznik tur oblezenia (`siegeTurnByCity`) to [`next_siege_turn`] (web `(get ?? 0) + 1`).

use crate::domain::siege_starvation::{
    siege_starvation_state, SiegeGarrisonUnit, SiegeStarvationCity, SiegeStarvationParams,
};

/// Wybor webowego ticka oblezenia dla jednego miasta (bez efektow ubocznych).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct SiegeTurnDecision {
    /// Web `st0.recordStart`: zapisz `siegeStarveStartMaxHp = start_max_hp` (atrycji brak w tym ticku).
    pub record_start: bool,
    /// Startowe maxHP do zapisu przy `record_start` (web `oblCity.siegeStarveStartMaxHp = st0.startMaxHp`).
    pub start_max_hp: Option<f64>,
    /// Web `applyArmyStarvationHpLoss` zostal wybrany do wykonania (etap 2, miasto jeszcze trzyma).
    pub attrition_applied: bool,
    /// Web `handleSiegeCapitulationPhase(oblCity)` (brak garnizonu przy zapasach 0; bez `resolveSiegeSurrender`).
    pub legacy_pending: bool,
    /// Web `resolveSiegeSurrender(oblCity.id)` (kapitulacja w tym ticku).
    pub surrender: bool,
}

/// Web `food: tick.obleganyGlod ? 0 : (tick.magazynPoTurze ?? getCityFood(oblCity))`.
/// `magazyn_po_turze` = `None` odpowiada `undefined`/`null` w JS (wtedy zapas z miasta). `NaN` zostaje (jak `??`).
pub fn starvation_food(oblegany_glod: bool, magazyn_po_turze: Option<f64>, city_food: f64) -> f64 {
    if oblegany_glod {
        0.0
    } else {
        magazyn_po_turze.unwrap_or(city_food)
    }
}

/// Web `siegeTurnByCity.set(id, (siegeTurnByCity.get(id) ?? 0) + 1)`.
pub fn next_siege_turn(prev: Option<i64>) -> i64 {
    prev.unwrap_or(0) + 1
}

/// Decyzja ticka oblezenia jednego miasta.
///
/// * `city` - pola czytane przez `siegeStarvationState` (`oblegane`, `siegeCapitulationPending`,
///   `siegeStarveStartMaxHp`);
/// * `garrison_before` - garnizon wojskowy PRZED atrycja (`militaryGarrison()` w web);
/// * `food` - wynik [`starvation_food`];
/// * `get_max_hp` - web `getMaxHp(typeId)`;
/// * `attrition` - wywolywane TYLKO gdy web wykonuje atrycje; zwraca garnizon PO niej (jednostki, ktore
///   zginely, sa juz usuniete przez wolajacego - web `units.splice`).
pub fn siege_city_turn<F>(
    city: &SiegeStarvationCity,
    garrison_before: &[SiegeGarrisonUnit],
    food: f64,
    get_max_hp: &dyn Fn(&str) -> f64,
    attrition: F,
) -> SiegeTurnDecision
where
    F: FnOnce() -> Vec<SiegeGarrisonUnit>,
{
    let params = SiegeStarvationParams {
        food,
        surrender_below_frac: None,
    };
    let st0 = siege_starvation_state(city, garrison_before, &params, get_max_hp);
    let mut dec = SiegeTurnDecision::default();
    let mut surrender_now = st0.surrender;

    if st0.record_start {
        dec.record_start = true;
        dec.start_max_hp = st0.start_max_hp;
    } else if st0.apply_attrition && !st0.surrender {
        dec.attrition_applied = true;
        let garrison_after = attrition();
        surrender_now =
            siege_starvation_state(city, &garrison_after, &params, get_max_hp).surrender;
    }

    if st0.set_legacy_pending {
        dec.legacy_pending = true;
    } else if surrender_now {
        dec.surrender = true;
    }
    dec
}

#[cfg(test)]
mod tests {
    use super::*;

    fn unit(hp: f64, max: f64) -> SiegeGarrisonUnit {
        SiegeGarrisonUnit {
            hp: Some(hp),
            hp_max: Some(max),
            type_id: None,
        }
    }

    fn besieged(start: Option<f64>) -> SiegeStarvationCity {
        SiegeStarvationCity {
            oblegane: Some(true),
            siege_capitulation_pending: None,
            siege_starve_start_max_hp: start,
        }
    }

    const NO_HP: &dyn Fn(&str) -> f64 = &|_| 0.0;

    #[test]
    fn food_positive_holds() {
        let d = siege_city_turn(&besieged(None), &[unit(10.0, 10.0)], 5.0, NO_HP, || {
            panic!("atrycja nie powinna byc wywolana")
        });
        assert_eq!(d, SiegeTurnDecision::default());
    }

    #[test]
    fn first_starving_tick_records_start_without_attrition() {
        let d = siege_city_turn(
            &besieged(None),
            &[unit(10.0, 10.0), unit(4.0, 10.0)],
            0.0,
            NO_HP,
            || panic!("atrycja nie powinna byc wywolana w ticku startu"),
        );
        assert!(d.record_start);
        assert_eq!(d.start_max_hp, Some(20.0));
        assert!(!d.attrition_applied && !d.surrender && !d.legacy_pending);
    }

    #[test]
    fn surrender_without_attrition_when_already_below_half() {
        let garrison = [unit(4.0, 10.0)];
        let d = siege_city_turn(&besieged(Some(10.0)), &garrison, 0.0, NO_HP, || {
            vec![unit(4.0, 10.0)]
        });
        // 4/10 = 0,4 < 0,5 -> kapitulacja; st0.surrender=true wyklucza atrycje (web: applyAttrition && !surrender).
        assert!(d.surrender);
        assert!(!d.attrition_applied);
    }

    #[test]
    fn attrition_applied_and_city_holds_when_above_half() {
        let garrison = [unit(9.0, 10.0)];
        let d = siege_city_turn(&besieged(Some(10.0)), &garrison, 0.0, NO_HP, || {
            vec![unit(7.0, 10.0)]
        });
        assert!(d.attrition_applied);
        assert!(!d.surrender);
    }

    #[test]
    fn no_garrison_sets_legacy_pending_not_surrender() {
        let d = siege_city_turn(&besieged(None), &[], 0.0, NO_HP, Vec::new);
        assert!(d.legacy_pending);
        assert!(!d.surrender);
    }

    #[test]
    fn food_helpers_follow_js_nullish_rules() {
        assert_eq!(starvation_food(true, Some(7.0), 9.0), 0.0);
        assert_eq!(starvation_food(false, None, 9.0), 9.0);
        assert_eq!(starvation_food(false, Some(3.0), 9.0), 3.0);
        assert_eq!(next_siege_turn(None), 1);
        assert_eq!(next_siege_turn(Some(4)), 5);
    }
}
