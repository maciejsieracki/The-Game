//! R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 podzial 3/3): kapitulacja oblezenia - czesc decyzyjna i skutki stanu miasta.
//!
//! Port czystych fragmentow webowych (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, `gra/src/main.ts`):
//! * [`handle_siege_capitulation_phase`] = `handleSiegeCapitulationPhase` (main.ts:17646-17660);
//! * [`resolve_surrender_path`] = galezie `resolveSiegeSurrender` (main.ts:17662-17672, 17702-17707, 17869-17877);
//! * [`transfer_removal_ids`] = usuniecie obroncow starego wlasciciela z heksu miasta (main.ts ok. :17787-17790);
//! * [`end_map_siege_fields`] = pola miasta gaszone przez `endMapSiege` (main.ts:17880-17893, trzy pola czytane przez
//!   `siegeStarvationState`);
//! * [`surrender_population_after`] = `city.population = Math.max(1, city.population)`.
//!
//! Wejscie garnizonu do miasta po kapitulacji NIE jest tu powielane - lezy w `siege_enter_city.rs`
//! ([`crate::domain::siege_enter_city::enter_city_after_surrender`]); kolejnosc (usuniecie obroncow -> wejscie) jest
//! po stronie wolajacego.
//!
//! NIEPORTOWANE SKUTKI PRZEJECIA (`resolveSiegeSurrender`, galaz `newOwner` - zaleznosci poza zakresem tego tematu):
//! * populacja: `applyCapturePopulationLoss`, `applyPostCaptureLawOnCapture`, `triggerRebelProtectionWarConsequence`;
//! * wojna/dyplomacja: `maybeResolveRegularWarOnCityCapture`, `recordWarCityLossForPair`;
//! * cuda/chronika/raport: `beginWonderTransferWatch`/`settleWonderTransfer`, `noteCityCapture`, `runCapitalCapturePlunder`,
//!   `recordCityCaptureEvent`, `capturePopLossReportRow`, komunikaty `showHintMessage`;
//! * miasta-panstwa i prowincja: `clearCityStateFlagOnCapture`, `foundedByOwner`, `seedCityOwnerDefaults`;
//! * kolejka produkcji: `sanitizeBuildQueue`, `filterQueue` (stolicowe budynki), zwrot Pracy;
//! * bezpieczenstwo racji: `applyLiveSafeRationForCity` (wolane PO `endMapSiege`).
//!
//! Zalozenia (do akceptacji, brak w dispatchu):
//! * Z-SU-1 `besieger` = `None` odpowiada web `null` (brak oblegajacego); `city_owner` i `besieger` to identyfikatory
//!   wlascicieli `i64` (web: liczby; barbarzyncy maja osobny id, sprawdzany przez `are_enemy`).
//! * Z-SU-2 `are_enemy(a, b)` jest wstrzykiwane jako closure i wolane WYLACZNIE, gdy web wola `areEnemyOwners`
//!   (zmiana wlasciciela); brak zmiany wlasciciela nie wywoluje closure.
//! * Z-SU-3 `food` i `pop` to `f64`; `NaN` przechodzi jak w JS (`NaN <= 0` = false; `Math.max(1, NaN)` = NaN).

use crate::domain::siege_enter_city::{EnterCity, EnterUnit};
use crate::domain::siege_starvation::SiegeStarvationCity;

/// Web `handleSiegeCapitulationPhase`: co zrobic z miastem w fazie kapitulacji (bez skutkow ubocznych).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CapitulationAction {
    /// Web `city.siegeCapitulationPending` = true -> `resolveSiegeSurrender(city.id)`.
    Resolve,
    /// Web zapasy <= 0 przy pustej fladze -> `city.siegeCapitulationPending = true` (+ alert, sync panelu).
    SetPending,
    /// Web brak zmian (zapasy > 0, flaga pusta).
    Hold,
}

/// Web `handleSiegeCapitulationPhase(city)`. `food` = web `getCityFood(city)`.
pub fn handle_siege_capitulation_phase(pending: bool, food: f64) -> CapitulationAction {
    if pending {
        CapitulationAction::Resolve
    } else if food <= 0.0 {
        CapitulationAction::SetPending
    } else {
        CapitulationAction::Hold
    }
}

/// Galaz wykonania `resolveSiegeSurrender`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SurrenderPath {
    /// Web: miasta nie ma w `cities` -> tylko `endMapSiege` (bez skutkow w miescie).
    NoCity,
    /// Web: `newOwner` rozni sie od wlasciciela, ale nie sa wrogami (np. pokoj) -> `endMapSiege` i `return`.
    NotEnemy,
    /// Web: brak oblegajacego albo ten sam wlasciciel -> komunikat "oblezenie zakonczone bez przejecia" i `endMapSiege`.
    NoCaptor,
    /// Web: przejecie miasta przez oblegajacego (pelna galaz, patrz lista niezportowanych skutkow w naglowku).
    Transfer,
}

/// Galezie `resolveSiegeSurrender` bez efektow ubocznych. `are_enemy(newOwner, oldOwner)` wolane tylko przy zmianie wlasciciela.
pub fn resolve_surrender_path(
    city_found: bool,
    city_owner: i64,
    besieger: Option<i64>,
    are_enemy: &dyn Fn(i64, i64) -> bool,
) -> SurrenderPath {
    if !city_found {
        return SurrenderPath::NoCity;
    }
    match besieger {
        Some(new_owner) if new_owner != city_owner => {
            if are_enemy(new_owner, city_owner) {
                SurrenderPath::Transfer
            } else {
                SurrenderPath::NotEnemy
            }
        }
        _ => SurrenderPath::NoCaptor,
    }
}

/// Id jednostek usuwanych z heksu miasta przy przejeciu (web: `units.splice` dla `u.q/u.r == city` i `u.ownerId == oldOwner`).
/// Zwraca w kolejnosci wejscia; zbior usunietych jest identyczny jak u web (petla wsteczna).
pub fn transfer_removal_ids(units: &[EnterUnit], city: &EnterCity, old_owner: i64) -> Vec<String> {
    units
        .iter()
        .filter(|u| u.q == city.q && u.r == city.r && u.owner_id == old_owner)
        .map(|u| u.id.clone())
        .collect()
}

/// Web `endMapSiege` - pola miasta czytane przez decyzje glodu. Ustawia `oblegane=false`, zeruje flage kapitulacji
/// i start maxHP (`delete siegeStarveStartMaxHp`). Pozostale pola (oblegajacy, grupa armii, maszyny) poza zakresem.
pub fn end_map_siege_fields(city: &mut SiegeStarvationCity) {
    city.oblegane = Some(false);
    city.siege_capitulation_pending = Some(false);
    city.siege_starve_start_max_hp = None;
}

/// Web `city.population = Math.max(1, city.population)` po przejeciu.
pub fn surrender_population_after(pop: f64) -> f64 {
    if pop.is_nan() {
        f64::NAN
    } else {
        pop.max(1.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capitulation_phase_resolves_only_when_pending() {
        assert_eq!(
            handle_siege_capitulation_phase(true, 5.0),
            CapitulationAction::Resolve
        );
        assert_eq!(
            handle_siege_capitulation_phase(true, 0.0),
            CapitulationAction::Resolve
        );
    }

    #[test]
    fn capitulation_phase_sets_pending_on_empty_stock() {
        assert_eq!(
            handle_siege_capitulation_phase(false, 0.0),
            CapitulationAction::SetPending
        );
        assert_eq!(
            handle_siege_capitulation_phase(false, -2.0),
            CapitulationAction::SetPending
        );
        assert_eq!(
            handle_siege_capitulation_phase(false, f64::NAN),
            CapitulationAction::Hold
        );
    }

    #[test]
    fn capitulation_phase_holds_with_food() {
        assert_eq!(
            handle_siege_capitulation_phase(false, 0.5),
            CapitulationAction::Hold
        );
    }

    #[test]
    fn surrender_path_branches() {
        let enemy_all: &dyn Fn(i64, i64) -> bool = &|_, _| true;
        let peace_all: &dyn Fn(i64, i64) -> bool = &|_, _| false;
        assert_eq!(
            resolve_surrender_path(false, 1, Some(2), enemy_all),
            SurrenderPath::NoCity
        );
        assert_eq!(
            resolve_surrender_path(true, 1, None, enemy_all),
            SurrenderPath::NoCaptor
        );
        assert_eq!(
            resolve_surrender_path(true, 1, Some(1), enemy_all),
            SurrenderPath::NoCaptor
        );
        assert_eq!(
            resolve_surrender_path(true, 1, Some(2), peace_all),
            SurrenderPath::NotEnemy
        );
        assert_eq!(
            resolve_surrender_path(true, 1, Some(2), enemy_all),
            SurrenderPath::Transfer
        );
    }

    #[test]
    fn enemy_check_skipped_without_owner_change() {
        let panic_closure: &dyn Fn(i64, i64) -> bool =
            &|_, _| panic!("areEnemyOwners nie powinno byc wolane");
        assert_eq!(
            resolve_surrender_path(true, 1, Some(1), panic_closure),
            SurrenderPath::NoCaptor
        );
        assert_eq!(
            resolve_surrender_path(true, 1, None, panic_closure),
            SurrenderPath::NoCaptor
        );
    }

    #[test]
    fn removal_ids_only_old_owner_on_city_hex() {
        let city = EnterCity {
            id: "c1".into(),
            q: 3,
            r: 4,
        };
        let u = |id: &str, owner: i64, q: i64, r: i64| EnterUnit {
            id: id.into(),
            owner_id: owner,
            q,
            r,
            ..Default::default()
        };
        let units = vec![
            u("a", 1, 3, 4),
            u("b", 2, 3, 4),
            u("c", 1, 3, 5),
            u("d", 1, 3, 4),
        ];
        assert_eq!(transfer_removal_ids(&units, &city, 1), vec!["a", "d"]);
        assert!(transfer_removal_ids(&units, &city, 9).is_empty());
    }

    #[test]
    fn end_siege_resets_starvation_fields() {
        let mut c = SiegeStarvationCity {
            oblegane: Some(true),
            siege_capitulation_pending: Some(true),
            siege_starve_start_max_hp: Some(20.0),
        };
        end_map_siege_fields(&mut c);
        assert_eq!(c.oblegane, Some(false));
        assert_eq!(c.siege_capitulation_pending, Some(false));
        assert_eq!(c.siege_starve_start_max_hp, None);
    }

    #[test]
    fn population_floor_matches_js_max() {
        assert_eq!(surrender_population_after(0.0), 1.0);
        assert_eq!(surrender_population_after(0.4), 1.0);
        assert_eq!(surrender_population_after(2.7), 2.7);
        assert!(surrender_population_after(f64::NAN).is_nan());
    }
}
