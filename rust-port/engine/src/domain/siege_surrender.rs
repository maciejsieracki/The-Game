//! R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 podzial 3/3): kapitulacja oblezenia - czesc decyzyjna i skutki stanu miasta.
//!
//! Port czystych fragmentow webowych (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, `gra/src/main.ts`):
//! * [`besieger_owner_for_city`] = `besiegerOwnerForCity` (main.ts:17634-17644);
//! * [`handle_siege_capitulation_phase`] = `handleSiegeCapitulationPhase` (main.ts:17646-17660);
//! * [`surrender_tick_action`] = lacznik decyzja ticka -> akcja (web main.ts:38864-38868, PRZED licznikiem tur);
//! * [`resolve_surrender_path`] = galezie `resolveSiegeSurrender` (main.ts:17662-17672, 17702-17707, 17869-17877);
//! * [`transfer_removal_ids`] = usuniecie obroncow starego wlasciciela z heksu miasta (main.ts:17787-17790);
//! * [`end_map_siege_fields`] = pola miasta gaszone przez `endMapSiege` (main.ts:17880-17893);
//! * [`surrender_population_after`] = `city.population = Math.max(1, city.population)` (main.ts po splice).
//!
//! Wejscie garnizonu do miasta po kapitulacji NIE jest tu powielane - lezy w `siege_enter_city.rs`
//! ([`crate::domain::siege_enter_city::enter_city_after_surrender`]); kolejnosc (usuniecie obroncow -> wejscie) jest
//! po stronie wolajacego.
//!
//! ## Skutki przejecia w `resolveSiegeSurrender` (galaz `newOwner`) - tabela stanu (obrona r2)
//!
//! Stan zweryfikowany grepem po `rust-port/engine/src` w tym commicie. "ISTNIEJE" = modul w Rust, ale NIE
//! podpiety tu; zgodnosc semantyczna z web NIE zweryfikowana w tym temacie. "BRAK" = nazwa nie znaleziona.
//!
//! | web (main.ts)                                  | Rust                                                        | stan |
//! |------------------------------------------------|-------------------------------------------------------------|------|
//! | besiegerOwnerForCity (17634)                   | [`besieger_owner_for_city`] (ten modul)                     | PORT |
//! | handleSiegeCapitulationPhase (17646)           | [`handle_siege_capitulation_phase`] (ten modul)             | PORT |
//! | splice obroncow starego wlasciciela (~17787)   | [`transfer_removal_ids`] (ten modul)                        | PORT |
//! | enterCityAfterSurrender                        | `siege_enter_city::enter_city_after_surrender`              | ISTNIEJE |
//! | sanitizeBuildQueue (production.ts)             | `production_queue::sanitize_build_queue`                    | ISTNIEJE |
//! | filterQueue                                    | `production_queue::filter_queue`                            | ISTNIEJE |
//! | clearCityStateFlagOnCapture (state)            | `state::clear_city_state_flag_on_capture`                   | ISTNIEJE |
//! | applyPostCaptureLawOnCapture                   | `order_effects_lane::apply_post_capture_law_override`       | ISTNIEJE |
//! | triggerRebelProtectionWarConsequence           | `order_effects_lane::tick_rebel_protection_end_of_turn` (inna funkcja, do weryfikacji) | ISTNIEJE? |
//! | recordWarCityLossForPair                       | `diplomacy_war_peace_profile::record_war_city_loss`         | ISTNIEJE |
//! | maybeResolveRegularWarOnCityCapture            | `war_turn_declare::register_regular_war_city_loss` (do weryfikacji) | ISTNIEJE? |
//! | seedCityOwnerDefaults                          | `turn_economy_inputs_podzial::seed_city_owner_defaults_podzial` (wariant) | ISTNIEJE? |
//! | siegeDefenderUnits (siege-starvation.ts)       | `siege_starvation::siege_defender_units` (inny zbior: nie splice) | ISTNIEJE |
//! | applyCapturePopulationLoss                     | brak nazwy w `src`                                          | BRAK |
//! | beginWonderTransferWatch / settleWonderTransfer| brak nazwy w `src`                                          | BRAK |
//! | noteCityCapture, runCapitalCapturePlunder      | brak nazwy w `src`                                          | BRAK |
//! | recordCityCaptureEvent, capturePopLossReportRow| brak nazwy w `src`                                          | BRAK |
//! | applyLiveSafeRationForCity                     | brak nazwy w `src`                                          | BRAK |
//! | foundedByOwner (pole miasta, ustawiane warunkowo) | brak logiki w `src` tego tematu                          | BRAK |
//! | showHintMessage (UI)                           | poza domena Rust                                            | N/D |
//!
//! Wniosek: galaz przejecia NIE jest jeszcze zlozona w jedna funkcje. Zaleznosci BRAK wymagaja osobnych tematow.
//!
//! Zalozenia (do akceptacji, brak w dispatchu):
//! * Z-SU-1 `besieger` = `None` odpowiada web `null` (brak oblegajacego); identyfikatory wlascicieli to `i64`.
//! * Z-SU-2 `are_enemy(a, b)` jest wstrzykiwane jako closure i wolane WYLACZNIE, gdy web wola `areEnemyOwners`
//!   (zmiana wlasciciela); brak zmiany wlasciciela nie wywoluje closure. Wektory generuje wykonanie pinu (log wywolan).
//! * Z-SU-3 `food`, `pop` to `f64`; `NaN` przechodzi jak w JS (`NaN <= 0` = false; `Math.max(1, NaN)` = NaN).
//! * Z-SU-4 wspolrzedne heksowe `i64` (web: liczby calkowite w danych gry, `hexDistance` zgodny z `max(|dq|,|dr|,|ds|)`).

use crate::domain::siege_enter_city::EnterCity;
use crate::domain::siege_enter_city::EnterUnit;
use crate::domain::siege_starvation::SiegeStarvationCity;
use crate::domain::siege_turn::SiegeTurnDecision;

/// Miasto widziane przez `besiegerOwnerForCity`: wlasciciel, heks i (opcjonalnie) `oblegajacyOwnerId`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BesiegerCity {
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
    /// Web `city.oblegajacyOwnerId` (`None` = pole nieustawione, `undefined` w JS).
    pub oblegajacy_owner_id: Option<i64>,
}

/// Jednostka widziana przez `besiegerOwnerForCity` (wlasciciel i heks).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BesiegerUnit {
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
}

/// Web `hexDistance` (`units/setup.ts:361`): `max(|dq|, |dr|, |ds|)`, `ds = (-aq-ar) - (-bq-br)`.
fn hex_distance(aq: i64, ar: i64, bq: i64, br: i64) -> i64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// Web `besiegerOwnerForCity(city)`: 1) `oblegajacyOwnerId`, 2) `siegeBesiegerByCity`, 3) pierwszy obcy wlasciciel
/// jednostki w odleglosci 1 od miasta (kolejnosc wejscia `units`). `stored` = wpis `siegeBesiegerByCity.get(city.id)`.
pub fn besieger_owner_for_city(
    city: &BesiegerCity,
    stored: Option<i64>,
    units: &[BesiegerUnit],
) -> Option<i64> {
    if let Some(owner) = city.oblegajacy_owner_id {
        return Some(owner);
    }
    if let Some(owner) = stored {
        return Some(owner);
    }
    units
        .iter()
        .find(|u| u.owner_id != city.owner_id && hex_distance(u.q, u.r, city.q, city.r) == 1)
        .map(|u| u.owner_id)
}

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

/// Akcja wybrana przez lacznik ticka oblezenia (web main.ts:38864-38868).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SurrenderTickAction {
    /// Brak decyzji o kapitulacji w tym ticku.
    None,
    /// Web `if (st0.setLegacyPending) handleSiegeCapitulationPhase(oblCity)`.
    CapitulationPhase(CapitulationAction),
    /// Web `else if (surrenderNow) resolveSiegeSurrender(oblCity.id)`.
    Surrender,
}

/// Lacznik: decyzja [`siege_city_turn`](crate::domain::siege_turn::siege_city_turn) -> akcja kapitulacji.
/// Wolac DOKLADNIE w tym miejscu: po decyzji, PRZED `next_siege_turn` (web: `siegeTurnByCity.set(...)` po bloku).
/// `pending` = `city.siegeCapitulationPending`, `food` = `getCityFood(city)` w chwili wywolania.
pub fn surrender_tick_action(
    dec: &SiegeTurnDecision,
    pending: bool,
    food: f64,
) -> SurrenderTickAction {
    if dec.legacy_pending {
        SurrenderTickAction::CapitulationPhase(handle_siege_capitulation_phase(pending, food))
    } else if dec.surrender {
        SurrenderTickAction::Surrender
    } else {
        SurrenderTickAction::None
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
    /// Web: przejecie miasta przez oblegajacego (pelna galaz, patrz tabela stanu w naglowku).
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
///
/// Uwaga (obrona r2, zarzut 7): web czyta te pola przez prawdziwosc (`!city.oblegane`, `city.siegeCapitulationPending`)
/// albo `=== true` (`cities.filter(c => c.oblegane === true)`); Rust czyta je przez `== Some(true)`, `!= Some(true)`
/// i `filter(> 0)`. Zatem `Some(false)` i `None` (web `undefined` po `delete`) sa dla wszystkich czytelnikow rownowazne.
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
    fn linker_none_without_decision() {
        let d = SiegeTurnDecision::default();
        assert_eq!(
            surrender_tick_action(&d, false, 0.0),
            SurrenderTickAction::None
        );
        assert_eq!(
            surrender_tick_action(&d, true, 0.0),
            SurrenderTickAction::None
        );
    }

    #[test]
    fn linker_legacy_routes_to_phase_and_surrender_to_resolve() {
        let legacy = SiegeTurnDecision {
            legacy_pending: true,
            ..Default::default()
        };
        assert_eq!(
            surrender_tick_action(&legacy, false, 0.0),
            SurrenderTickAction::CapitulationPhase(CapitulationAction::SetPending)
        );
        assert_eq!(
            surrender_tick_action(&legacy, true, 0.0),
            SurrenderTickAction::CapitulationPhase(CapitulationAction::Resolve)
        );
        let surrender = SiegeTurnDecision {
            surrender: true,
            ..Default::default()
        };
        assert_eq!(
            surrender_tick_action(&surrender, false, 0.0),
            SurrenderTickAction::Surrender
        );
    }

    #[test]
    fn besieger_explicit_then_stored_then_adjacent() {
        let city = BesiegerCity {
            owner_id: 1,
            q: 0,
            r: 0,
            oblegajacy_owner_id: Some(3),
        };
        assert_eq!(besieger_owner_for_city(&city, Some(2), &[]), Some(3));
        let city = BesiegerCity {
            oblegajacy_owner_id: None,
            ..city
        };
        assert_eq!(besieger_owner_for_city(&city, Some(2), &[]), Some(2));
        let adj = BesiegerUnit {
            owner_id: 2,
            q: 1,
            r: 0,
        };
        let far = BesiegerUnit {
            owner_id: 4,
            q: 3,
            r: 0,
        };
        assert_eq!(besieger_owner_for_city(&city, None, &[far, adj]), Some(2));
        assert_eq!(besieger_owner_for_city(&city, None, &[far]), None);
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
