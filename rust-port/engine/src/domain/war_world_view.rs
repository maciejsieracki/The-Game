//! P6-WIRE-WAR-WORLDVIEW (W2): widok swiata dla modulow wojny tury (plan `P6-WIRE-WAR-TURN-PLAN.md`,
//! partia W2, decyzja D1=B: stan wojny w `PlayableState`, D3=1:1 z webem).
//!
//! `WarWorldView` to zestaw referencji do `PlayableState` (miasta, jednostki, gracze) plus mapa
//! dodatkowych pol miast `CityWarExtras` podawana przez wolajacego. Adaptery sa czyste: nie mutuja stanu,
//! nie losuja, a te same wejscia daja te same wyjscia (kolejnosc = kolejnosc miast/jednostek w stanie).
//!
//! Adaptery (web: typ wejsciowy modulu, plik zrodlowy):
//! - `war_target_cities` / `war_target_units` -> `WarTargetCity` / `WarTargetUnit` (`ai-war-target-select.ts`),
//! - `home_war_cities` / `home_war_units` -> `HomeWarCity` / `HomeWarUnit` (`ai-war-home-defense.ts`),
//! - `wave_cities` / `wave_units` -> `WaveCity` / `WaveUnit` (`forced-war-waves.ts`),
//! - `siege_cities` / `siege_units` -> `SiegeCity` / `SiegeUnit` (`diplomacy-siege-war-gate.ts`),
//! - `enter_cities` -> `EnterCity` (`siege-enter-city.ts`),
//! - `forced_war_neighbors` -> `ForcedWarNeighborCandidate` (`forced-war-common.ts`).
//!
//! ZALOZENIA (do akceptacji, kazde pokryte nazwa w kodzie):
//! - Z1 wspolrzedne: `PositionDto.x` -> `q`, `PositionDto.y` -> `r` (jak w `playable.rs`, mapa demo).
//! - Z2 `founded_by`, `founded_by_owner`, `captured_from_owner_id`, `ma_mur`, `oblegane` NIE istnieja w
//!   `PlayableCity`; przychodza z `CityWarExtras` podanej przez wolajacego (w W8 z miast ekonomii, `state.rs`
//!   `City.founded_by`). Brak wpisu = wartosci domyslne (`None` / `false`).
//! - Z3 `PlayableUnit` ma tylko rodzaj `Warrior` (bojowy): jest `is_field`, nie jest cywilem ani zwiadowca,
//!   nie jest na lodzi (`embarked = false`), nie oblega miasta (`oblega_city_id = None`), `ruch_left` = `movement`.
//! - Z4 kategoria jednostki dla fal = `"land"`; web filtruje wylacznie `"galera"`, wiec wynik filtra jest identyczny.
//! - Z5 sila jednostki (`HomeWarUnit.strength`) nie jest policzona tutaj: dostarcza ja wolajacy (`strength_of`).
//! - Z6 barbarzyncy nie istnieja w `PlayableState`: widok ich nie wyroznia (`is_barbarian` podaje wolajacy).
//! - Z7 kandydaci sasiedzi (`forced_war_neighbors`): pozycja = stolica wlasciciela (fallback: pierwsze miasto).
//!   Web buduje kandydatow w wolajacym (`forced-war-common.ts`, `byId`); konstrukcja po stronie webu nie zostala
//!   zmierzona (NIE_ZMIERZONO), dlatego ten adapter nie ma wektorow zgodnosci z webem.

use std::collections::HashMap;

use super::diplomacy_siege_war_gate::{SiegeCity, SiegeUnit};
use super::playable::{PlayableCity, PlayableState, PlayableUnit};
use super::siege_enter_city::EnterCity;
use super::war_forced_common::ForcedWarNeighborCandidate;
use super::war_forced_waves::{WaveCity, WaveUnit};
use super::war_home_defense::{HomeWarCity, HomeWarUnit};
use super::war_target_select::{WarTargetCity, WarTargetUnit};

/// Kategoria jednostki dla fal (Z4): dowolna wartosc rozna od `"galera"`.
pub const WAVE_UNIT_CATEGORY_LAND: &str = "land";

/// Pola miasta spoza `PlayableCity` (Z2). Domyslnie puste.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct CityWarExtras {
    pub founded_by: Option<i64>,
    pub founded_by_owner: Option<bool>,
    pub captured_from_owner_id: Option<i64>,
    pub ma_mur: bool,
    pub oblegane: bool,
}

/// Widok swiata tury dla modulow wojny: tylko odczyt.
#[derive(Debug, Clone, Copy)]
pub struct WarWorldView<'a> {
    state: &'a PlayableState,
    extras: &'a HashMap<String, CityWarExtras>,
}

fn coord(v: u16) -> i32 {
    i32::from(v)
}

fn owner(id: super::PlayerId) -> i64 {
    id.get() as i64
}

impl<'a> WarWorldView<'a> {
    pub fn new(state: &'a PlayableState, extras: &'a HashMap<String, CityWarExtras>) -> Self {
        Self { state, extras }
    }

    fn city_key(city: &PlayableCity) -> String {
        city.id.get().to_string()
    }

    fn extras_of(&self, city: &PlayableCity) -> CityWarExtras {
        self.extras
            .get(&Self::city_key(city))
            .cloned()
            .unwrap_or_default()
    }

    /// Web `isHuman(ownerId)`: gracz z `is_human`; nieznany wlasciciel = nie czlowiek.
    pub fn is_human(&self, owner_id: i64) -> bool {
        self.state
            .players
            .iter()
            .any(|p| owner(p.id) == owner_id && p.is_human)
    }

    /// Web `capitalCityIdForOwner`: pierwsza stolica wlasciciela w kolejnosci miast.
    pub fn capital_city_id(&self, owner_id: i64) -> Option<String> {
        self.state
            .cities
            .iter()
            .find(|c| c.is_capital && owner(c.owner_id) == owner_id)
            .map(Self::city_key)
    }

    pub fn war_target_cities(&self) -> Vec<WarTargetCity> {
        self.state
            .cities
            .iter()
            .map(|c| WarTargetCity {
                id: Self::city_key(c),
                owner_id: owner(c.owner_id),
                q: coord(c.position.x()),
                r: coord(c.position.y()),
            })
            .collect()
    }

    pub fn war_target_units(&self) -> Vec<WarTargetUnit> {
        self.state
            .units
            .iter()
            .map(|u| WarTargetUnit {
                owner_id: owner(u.owner_id),
                q: coord(u.position.x()),
                r: coord(u.position.y()),
            })
            .collect()
    }

    pub fn home_war_cities(&self) -> Vec<HomeWarCity> {
        self.state
            .cities
            .iter()
            .map(|c| {
                let x = self.extras_of(c);
                HomeWarCity {
                    id: Self::city_key(c),
                    q: coord(c.position.x()),
                    r: coord(c.position.y()),
                    owner_id: owner(c.owner_id),
                    captured_from_owner_id: x.captured_from_owner_id,
                    founded_by: x.founded_by,
                    founded_by_owner: x.founded_by_owner,
                }
            })
            .collect()
    }

    /// `strength_of` = web `strengthOf(u)` (Z5).
    pub fn home_war_units(&self, strength_of: &dyn Fn(&PlayableUnit) -> f64) -> Vec<HomeWarUnit> {
        self.state
            .units
            .iter()
            .map(|u| HomeWarUnit {
                id: u.id.get().to_string(),
                owner_id: owner(u.owner_id),
                q: coord(u.position.x()),
                r: coord(u.position.y()),
                is_field: true,
                embarked: false,
                ruch_left: f64::from(u.movement),
                oblega_city_id: None,
                strength: strength_of(u),
            })
            .collect()
    }

    pub fn wave_cities(&self) -> Vec<WaveCity> {
        self.state
            .cities
            .iter()
            .map(|c| WaveCity {
                id: Self::city_key(c),
                owner_id: owner(c.owner_id),
                q: f64::from(coord(c.position.x())),
                r: f64::from(coord(c.position.y())),
            })
            .collect()
    }

    pub fn wave_units(&self) -> Vec<WaveUnit> {
        self.state
            .units
            .iter()
            .map(|u| WaveUnit {
                id: u.id.get().to_string(),
                owner_id: owner(u.owner_id),
                category: WAVE_UNIT_CATEGORY_LAND.to_owned(),
                q: f64::from(coord(u.position.x())),
                r: f64::from(coord(u.position.y())),
                ruch_left: f64::from(u.movement),
                is_civilian: false,
                in_garnizon: false,
                oblega_city_id: None,
                embarked: false,
                sea_raider: false,
            })
            .collect()
    }

    pub fn siege_cities(&self) -> Vec<SiegeCity> {
        self.state
            .cities
            .iter()
            .map(|c| {
                let x = self.extras_of(c);
                SiegeCity {
                    q: i64::from(coord(c.position.x())),
                    r: i64::from(coord(c.position.y())),
                    owner_id: owner(c.owner_id),
                    ma_mur: x.ma_mur,
                    oblegane: x.oblegane,
                }
            })
            .collect()
    }

    pub fn siege_units(&self) -> Vec<SiegeUnit> {
        self.state
            .units
            .iter()
            .map(|u| SiegeUnit {
                q: i64::from(coord(u.position.x())),
                r: i64::from(coord(u.position.y())),
                owner_id: owner(u.owner_id),
            })
            .collect()
    }

    pub fn enter_cities(&self) -> Vec<EnterCity> {
        self.state
            .cities
            .iter()
            .map(|c| EnterCity {
                id: Self::city_key(c),
                q: i64::from(coord(c.position.x())),
                r: i64::from(coord(c.position.y())),
            })
            .collect()
    }

    /// Z7: jeden kandydat na owner != `self_owner_id`, pozycja = stolica (fallback: pierwsze miasto).
    pub fn forced_war_neighbors(&self, self_owner_id: i64) -> Vec<ForcedWarNeighborCandidate> {
        let mut owners: Vec<i64> = self
            .state
            .cities
            .iter()
            .map(|c| owner(c.owner_id))
            .filter(|o| *o != self_owner_id)
            .collect();
        owners.sort_unstable();
        owners.dedup();
        owners
            .into_iter()
            .filter_map(|o| {
                let cities = &self.state.cities;
                let pick = cities
                    .iter()
                    .find(|c| c.is_capital && owner(c.owner_id) == o)
                    .or_else(|| cities.iter().find(|c| owner(c.owner_id) == o))?;
                Some(ForcedWarNeighborCandidate {
                    owner_id: o,
                    q: coord(pick.position.x()),
                    r: coord(pick.position.y()),
                })
            })
            .collect()
    }
}
