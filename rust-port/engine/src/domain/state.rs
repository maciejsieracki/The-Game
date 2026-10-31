use serde::{Deserialize, Serialize};
use std::collections::HashSet;

use super::{CityDto, CivilizationDto, MapDto, TurnDto, UnitDto, ValidationError};

/// Canonical serializable state for the staged engine.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(try_from = "RawGameStateDto")]
pub struct GameStateDto {
    map: MapDto,
    civilizations: Vec<CivilizationDto>,
    cities: Vec<CityDto>,
    units: Vec<UnitDto>,
    turn: TurnDto,
}

#[derive(Debug, Deserialize)]
struct RawGameStateDto {
    map: MapDto,
    civilizations: Vec<CivilizationDto>,
    cities: Vec<CityDto>,
    units: Vec<UnitDto>,
    turn: TurnDto,
}

impl GameStateDto {
    pub fn new(
        map: MapDto,
        civilizations: Vec<CivilizationDto>,
        cities: Vec<CityDto>,
        units: Vec<UnitDto>,
        turn: TurnDto,
    ) -> Result<Self, ValidationError> {
        let state = Self {
            map,
            civilizations,
            cities,
            units,
            turn,
        };
        state.validate()?;
        Ok(state)
    }

    pub fn validate(&self) -> Result<(), ValidationError> {
        self.map.validate()?;
        for civilization in &self.civilizations {
            civilization.validate()?;
        }
        for city in &self.cities {
            city.validate()?;
            if !self.map.contains(city.position()) {
                return Err(ValidationError::EntityOutOfBounds {
                    entity: "city",
                    position: city.position(),
                });
            }
        }
        for unit in &self.units {
            unit.validate()?;
            if !self.map.contains(unit.position()) {
                return Err(ValidationError::EntityOutOfBounds {
                    entity: "unit",
                    position: unit.position(),
                });
            }
        }

        ensure_unique_ids(
            self.civilizations.iter().map(CivilizationDto::id),
            ValidationError::DuplicateCivilization,
        )?;
        ensure_unique_ids(
            self.cities.iter().map(CityDto::id),
            ValidationError::DuplicateCity,
        )?;
        ensure_unique_ids(
            self.units.iter().map(UnitDto::id),
            ValidationError::DuplicateUnit,
        )?;

        for city in &self.cities {
            let owner = self
                .civilizations
                .iter()
                .find(|civilization| civilization.id() == city.owner_id())
                .ok_or(ValidationError::UnknownCityOwner(city.owner_id()))?;
            if !owner.city_ids().contains(&city.id()) {
                return Err(ValidationError::CityOwnerMismatch {
                    city: city.id(),
                    civilization: owner.id(),
                });
            }
        }
        for unit in &self.units {
            let owner = self
                .civilizations
                .iter()
                .find(|civilization| civilization.id() == unit.owner_id())
                .ok_or(ValidationError::UnknownUnitOwner(unit.owner_id()))?;
            if !owner.unit_ids().contains(&unit.id()) {
                return Err(ValidationError::UnitOwnerMismatch {
                    unit: unit.id(),
                    civilization: owner.id(),
                });
            }
        }

        for civilization in &self.civilizations {
            for city_id in civilization.city_ids() {
                let city = self
                    .cities
                    .iter()
                    .find(|city| city.id() == *city_id)
                    .ok_or(ValidationError::UnknownCityReference(*city_id))?;
                if city.owner_id() != civilization.id() {
                    return Err(ValidationError::CityOwnerMismatch {
                        city: city.id(),
                        civilization: civilization.id(),
                    });
                }
            }
            for unit_id in civilization.unit_ids() {
                let unit = self
                    .units
                    .iter()
                    .find(|unit| unit.id() == *unit_id)
                    .ok_or(ValidationError::UnknownUnitReference(*unit_id))?;
                if unit.owner_id() != civilization.id() {
                    return Err(ValidationError::UnitOwnerMismatch {
                        unit: unit.id(),
                        civilization: civilization.id(),
                    });
                }
            }
        }

        Ok(())
    }

    pub fn map(&self) -> &MapDto {
        &self.map
    }

    pub fn civilizations(&self) -> &[CivilizationDto] {
        &self.civilizations
    }

    pub fn cities(&self) -> &[CityDto] {
        &self.cities
    }

    pub fn units(&self) -> &[UnitDto] {
        &self.units
    }

    pub const fn turn(&self) -> TurnDto {
        self.turn
    }
}

impl TryFrom<RawGameStateDto> for GameStateDto {
    type Error = ValidationError;

    fn try_from(raw: RawGameStateDto) -> Result<Self, Self::Error> {
        Self::new(raw.map, raw.civilizations, raw.cities, raw.units, raw.turn)
    }
}

pub type CanonicalState = GameStateDto;
pub type MapState = MapDto;
pub type CivilizationState = CivilizationDto;
pub type CityState = CityDto;
pub type UnitState = UnitDto;
pub type TurnState = TurnDto;

fn ensure_unique_ids<T, I, F>(ids: I, duplicate: F) -> Result<(), ValidationError>
where
    T: Eq + std::hash::Hash + Copy,
    I: IntoIterator<Item = T>,
    F: Fn(T) -> ValidationError,
{
    let mut seen = HashSet::new();
    for id in ids {
        if !seen.insert(id) {
            return Err(duplicate(id));
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// P6.6A (R-RUSTPORT-P6-6A-MIASTA-ZAKLADANIE-A-Q1): porty `city-founding.ts` (163 linie),
// `conquest-stability.ts` (191) i `visibility.ts` (328) z `gra/src/game/` (pin edb8fb56).
// `city-hex-clear.ts` lezy w `domain/terrain.rs` (`terrain::city_hex_clear`). `state` jest modulem
// prywatnym, wiec moduly sa udostepnione jako `domain::terrain::{city_founding, ...}`.
// Parametry balansu: `data/derived/{city-founding-params,conquest-stability-params,
// visibility-params}.json` oraz `data/miasto-params.json` / `data/map-gen-params.json`.
// ---------------------------------------------------------------------------

pub mod city_founding {
    use std::sync::OnceLock;

    /// P6.6B: udostepnienie modulow `p6_6b` (patrz komentarz przy `pub mod p6_6b`).
    pub use super::p6_6b;

    use crate::data::derived::{city_founding_params, CityFoundingParamsFile};
    use crate::data::economy_society::parse_miasto_params;
    use crate::domain::recruitment::army_merge::js_max;
    use crate::domain::recruitment::manpower::js_number_to_string;

    /// Web `FoundCitySourceCity` (`city-founding.ts:11`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct FoundCitySourceCity {
        pub id: String,
        pub owner_id: i64,
        pub population: f64,
    }

    /// Web `FoundCityAffordance` (`city-founding.ts:38`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct FoundCityAffordance {
        pub ok: bool,
        pub reason: Option<String>,
        pub koszt_praca: f64,
        pub koszt_ludnosc: f64,
        pub source_city_id: Option<String>,
    }

    /// Wartosci uzywane przez te funkcje: koszt Pracy, koszt ludnosci i prog AI (`AI_FOUNDING_SOURCE_MIN_POP`).
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct FoundCityParams {
        pub work_cost: f64,
        pub population_cost: f64,
        pub ai_source_min_pop: f64,
    }

    /// Web `readParam` (`city-founding.ts:17`): liczba skonczona z wiersza, inaczej wartosc zapasowa.
    pub fn read_param(value: Option<f64>, fallback: f64) -> f64 {
        match value {
            Some(v) if v.is_finite() => v,
            _ => fallback,
        }
    }

    impl FoundCityParams {
        /// Z danych: `data/miasto-params.json` (wartosci glowne, DANE-JUZ-W-RUST) +
        /// `data/derived/city-founding-params.json` (zapasowe i prog AI).
        pub fn from_data() -> Self {
            let miasto = parse_miasto_params().expect("miasto-params.json must parse");
            let file: &CityFoundingParamsFile = city_founding_params();
            Self {
                work_cost: read_param(
                    Some(miasto.zaloz_miasto_koszt_praca.wartosc as f64),
                    file.fallback_koszt_praca,
                ),
                population_cost: read_param(
                    Some(miasto.zaloz_miasto_koszt_ludnosci.wartosc as f64),
                    file.fallback_koszt_ludnosci,
                ),
                ai_source_min_pop: file.ai_source_min_pop,
            }
        }
    }

    /// Parametry z danych (jednorazowy odczyt).
    pub fn found_city_params() -> &'static FoundCityParams {
        static PARAMS: OnceLock<FoundCityParams> = OnceLock::new();
        PARAMS.get_or_init(FoundCityParams::from_data)
    }

    fn fill(template: &str, pairs: &[(&str, String)]) -> String {
        let mut out = template.to_owned();
        for (name, value) in pairs {
            out = out.replace(&format!("{{{name}}}"), value);
        }
        out
    }

    /// Web `foundCityWorkCost` (`city-founding.ts:23`).
    pub fn found_city_work_cost() -> f64 {
        found_city_params().work_cost
    }

    /// Web `foundCityPopulationCost` (`city-founding.ts:31`).
    pub fn found_city_population_cost() -> f64 {
        found_city_params().population_cost
    }

    /// Web `AI_FOUNDING_SOURCE_MIN_POP` (`city-founding.ts:53`).
    pub fn ai_founding_source_min_pop() -> f64 {
        found_city_params().ai_source_min_pop
    }

    /// Web `isSubsequentFoundCity` (`city-founding.ts:48`): `playerCities` to tu same `ownerId`.
    pub fn is_subsequent_found_city(player_city_owner_ids: &[i64], owner_id: i64) -> bool {
        player_city_owner_ids.contains(&owner_id)
    }

    /// Web `pickSourceCityForFounding` (`city-founding.ts:60`). `rand` jest wstrzykniete (web:
    /// `Math.random`); wywolywane najwyzej raz, tylko przy remisie. `None` odpowiada `null` oraz
    /// `undefined` (indeks poza tablica), oba falsy dla `evaluateFoundCityAffordance`.
    pub fn pick_source_city_for_founding_with<'a>(
        cities: &'a [FoundCitySourceCity],
        owner_id: i64,
        rand: &mut dyn FnMut() -> f64,
        params: &FoundCityParams,
    ) -> Option<&'a FoundCitySourceCity> {
        let pop_cost = params.population_cost;
        let min_pop = if owner_id > 0 {
            js_max(pop_cost + 1.0, params.ai_source_min_pop)
        } else {
            pop_cost + 1.0
        };
        let eligible: Vec<&FoundCitySourceCity> = cities
            .iter()
            .filter(|c| c.owner_id == owner_id && c.population >= min_pop)
            .collect();
        if eligible.is_empty() {
            return None;
        }
        let max_pop = eligible
            .iter()
            .map(|c| c.population)
            .fold(f64::NEG_INFINITY, js_max);
        let tied: Vec<&FoundCitySourceCity> = eligible
            .into_iter()
            .filter(|c| c.population == max_pop)
            .collect();
        if tied.len() == 1 {
            return Some(tied[0]);
        }
        let len = tied.len() as f64;
        let idx = crate::domain::recruitment::army_merge::js_min(len - 1.0, (rand() * len).floor());
        if idx.is_nan() || idx < 0.0 {
            return None;
        }
        Some(tied[idx as usize])
    }

    /// Web `pickSourceCityForFounding` z parametrami z danych.
    pub fn pick_source_city_for_founding<'a>(
        cities: &'a [FoundCitySourceCity],
        owner_id: i64,
        rand: &mut dyn FnMut() -> f64,
    ) -> Option<&'a FoundCitySourceCity> {
        pick_source_city_for_founding_with(cities, owner_id, rand, found_city_params())
    }

    /// Web `evaluateFoundCityAffordance` (`city-founding.ts:84`).
    pub fn evaluate_found_city_affordance_with(
        treasury_praca: f64,
        cities: &[FoundCitySourceCity],
        owner_id: i64,
        rand: &mut dyn FnMut() -> f64,
        params: &FoundCityParams,
    ) -> FoundCityAffordance {
        let texts = &city_founding_params().teksty;
        let owner_ids: Vec<i64> = cities.iter().map(|c| c.owner_id).collect();
        let first_free = !is_subsequent_found_city(&owner_ids, owner_id);
        let koszt_praca = if first_free { 0.0 } else { params.work_cost };
        let koszt_ludnosc = if first_free {
            0.0
        } else {
            params.population_cost
        };

        if treasury_praca < koszt_praca {
            return FoundCityAffordance {
                ok: false,
                reason: Some(fill(
                    &texts.za_malo_pracy,
                    &[("koszt", js_number_to_string(koszt_praca))],
                )),
                koszt_praca,
                koszt_ludnosc,
                source_city_id: None,
            };
        }

        if first_free {
            return FoundCityAffordance {
                ok: true,
                reason: None,
                koszt_praca,
                koszt_ludnosc,
                source_city_id: None,
            };
        }

        let Some(source) = pick_source_city_for_founding_with(cities, owner_id, rand, params)
        else {
            let min_needed = if owner_id > 0 {
                js_max(koszt_ludnosc + 1.0, params.ai_source_min_pop)
            } else {
                koszt_ludnosc + 1.0
            };
            return FoundCityAffordance {
                ok: false,
                reason: Some(fill(
                    &texts.potrzebne_miasto,
                    &[("koszt", js_number_to_string(min_needed))],
                )),
                koszt_praca,
                koszt_ludnosc,
                source_city_id: None,
            };
        };

        FoundCityAffordance {
            ok: true,
            reason: None,
            koszt_praca,
            koszt_ludnosc,
            source_city_id: Some(source.id.clone()),
        }
    }

    /// Web `evaluateFoundCityAffordance` z parametrami z danych.
    pub fn evaluate_found_city_affordance(
        treasury_praca: f64,
        cities: &[FoundCitySourceCity],
        owner_id: i64,
        rand: &mut dyn FnMut() -> f64,
    ) -> FoundCityAffordance {
        evaluate_found_city_affordance_with(
            treasury_praca,
            cities,
            owner_id,
            rand,
            found_city_params(),
        )
    }

    /// Web `canAffordFoundCity` (`city-founding.ts:130`, `@deprecated`). `first_city_free` =
    /// `opts?.firstCityFree` (brak opcji = `false`).
    pub fn can_afford_found_city_with(
        treasury_praca: f64,
        source_city_population: f64,
        first_city_free: bool,
        params: &FoundCityParams,
    ) -> FoundCityAffordance {
        let texts = &city_founding_params().teksty;
        let koszt_praca = if first_city_free {
            0.0
        } else {
            params.work_cost
        };
        let koszt_ludnosc = if first_city_free {
            0.0
        } else {
            params.population_cost
        };

        if treasury_praca < koszt_praca {
            return FoundCityAffordance {
                ok: false,
                reason: Some(fill(
                    &texts.za_malo_pracy,
                    &[("koszt", js_number_to_string(koszt_praca))],
                )),
                koszt_praca,
                koszt_ludnosc,
                source_city_id: None,
            };
        }
        if !first_city_free && source_city_population - koszt_ludnosc < 1.0 {
            return FoundCityAffordance {
                ok: false,
                reason: Some(fill(
                    &texts.za_malo_ludnosci,
                    &[("koszt", js_number_to_string(koszt_ludnosc))],
                )),
                koszt_praca,
                koszt_ludnosc,
                source_city_id: None,
            };
        }
        FoundCityAffordance {
            ok: true,
            reason: None,
            koszt_praca,
            koszt_ludnosc,
            source_city_id: None,
        }
    }

    /// Web `canAffordFoundCity` z parametrami z danych.
    pub fn can_afford_found_city(
        treasury_praca: f64,
        source_city_population: f64,
        first_city_free: bool,
    ) -> FoundCityAffordance {
        can_afford_found_city_with(
            treasury_praca,
            source_city_population,
            first_city_free,
            found_city_params(),
        )
    }

    /// Web `foundCityCostLabel` (`city-founding.ts:158`).
    pub fn found_city_cost_label_with(first_city_free: bool, params: &FoundCityParams) -> String {
        let texts = &city_founding_params().teksty;
        if first_city_free {
            return texts.etykieta_darmowe.clone();
        }
        fill(
            &texts.etykieta_platne,
            &[
                ("praca", js_number_to_string(params.work_cost)),
                ("ludnosc", js_number_to_string(params.population_cost)),
            ],
        )
    }

    /// Web `foundCityCostLabel` z parametrami z danych.
    pub fn found_city_cost_label(first_city_free: bool) -> String {
        found_city_cost_label_with(first_city_free, found_city_params())
    }
}

pub mod conquest_stability {
    use crate::data::derived::conquest_stability_params;

    /// Web `isForeignCultureDominant` (`conquest-stability.ts:22`).
    pub fn is_foreign_culture_dominant(own_culture_share: f64) -> bool {
        own_culture_share < conquest_stability_params().prog_obca_kultura
    }

    /// Web `isConquestUnstable` (`conquest-stability.ts:27`).
    pub fn is_conquest_unstable(own_culture_share: f64, foreign_religion_dominant: bool) -> bool {
        is_foreign_culture_dominant(own_culture_share) && foreign_religion_dominant
    }

    /// Pola miasta czytane i zmieniane przez `onCityCapturedCulture`
    /// (`{ ownCultureShare?, kulturaOwnShare? }`; `None` = pole nieobecne).
    #[derive(Debug, Clone, Copy, PartialEq, Default)]
    pub struct CityCultureMix {
        pub own_culture_share: Option<f64>,
        pub kultura_own_share: Option<f64>,
    }

    /// Web `clearCityCultureMix` (`society-inputs.ts:40`, import `conquest-stability.ts:19`): usuwa oba
    /// pola. Trzy linie, port lokalny do czasu portu `society-inputs.ts` (wlasciciel docelowy).
    pub fn clear_city_culture_mix(city: &mut CityCultureMix) {
        city.own_culture_share = None;
        city.kultura_own_share = None;
    }

    /// Web `CityCaptureCultureOpts` (`conquest-stability.ts:34`).
    #[derive(Clone, Copy, Default)]
    pub struct CityCaptureCultureOpts<'a> {
        /// Web `civKeyForOwner?: (ownerId) => string`.
        pub civ_key_for_owner: Option<&'a dyn Fn(i64) -> String>,
    }

    /// `Math.max(0, Math.min(1, x))` z semantyka JS (NaN propaguje, znak zera).
    fn clamp01(x: f64) -> f64 {
        use crate::domain::recruitment::army_merge::{js_max, js_min};
        js_max(0.0, js_min(1.0, x))
    }

    /// Web `onCityCapturedCulture` (`conquest-stability.ts:40`). `same_culture_circle` to
    /// `sameCultureCircle` z `diplomacy-display.ts:213` (P6.14) wstrzykniete jako domkniecie.
    pub fn on_city_captured_culture(
        city: &mut CityCultureMix,
        new_owner_id: Option<i64>,
        previous_owner_id: Option<i64>,
        opts: Option<&CityCaptureCultureOpts>,
        same_culture_circle: &dyn Fn(&str, &str) -> bool,
    ) {
        let (Some(new_owner), Some(previous_owner)) = (new_owner_id, previous_owner_id) else {
            return;
        };
        if new_owner == previous_owner {
            return;
        }
        if let Some(civ_key) = opts.and_then(|o| o.civ_key_for_owner) {
            if same_culture_circle(&civ_key(new_owner), &civ_key(previous_owner)) {
                clear_city_culture_mix(city);
                return;
            }
        }
        let prev = clamp01(
            city.own_culture_share
                .or(city.kultura_own_share)
                .unwrap_or(1.0),
        );
        let share = clamp01(1.0 - prev);
        city.own_culture_share = Some(share);
        city.kultura_own_share = Some(share);
    }

    /// Web `CultureBuildings` (`culture-religion.ts:405`): flagi budynkow kulturalnych.
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
    pub struct CultureBuildings {
        pub has_amfiteatr: bool,
        pub has_biblioteka: bool,
        pub has_palac: bool,
        pub has_stela: bool,
        pub has_sad: bool,
        pub has_laznia: bool,
    }

    /// Web `ReligionBuildings` (`culture-religion.ts:1084`): flagi budynkow religijnych.
    #[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
    pub struct ReligionBuildings {
        pub has_swiatynia: bool,
        pub has_kamienne_kregi: bool,
    }

    /// Web `CultureCity` (`culture-religion.ts:280`) - pola uzywane przez konwersje kultury.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct CultureCity {
        pub kultura_skumulowana: f64,
        pub own_culture_share: Option<f64>,
    }

    /// Web `cultureBuildingsFromIds` (`conquest-stability.ts:63`); mapowanie id -> flaga w
    /// `conquest-stability-params.json` (`budynki_kulturalne`).
    pub fn culture_buildings_from_ids<S: AsRef<str>>(built_ids: &[S]) -> CultureBuildings {
        let mut out = CultureBuildings::default();
        for (flag, ids) in &conquest_stability_params().budynki_kulturalne {
            let present = ids
                .iter()
                .any(|id| built_ids.iter().any(|b| b.as_ref() == id));
            match flag.as_str() {
                "hasAmfiteatr" => out.has_amfiteatr = present,
                "hasBiblioteka" => out.has_biblioteka = present,
                "hasPalac" => out.has_palac = present,
                "hasStela" => out.has_stela = present,
                "hasSad" => out.has_sad = present,
                "hasLaznia" => out.has_laznia = present,
                _ => {}
            }
        }
        out
    }

    /// Web `religionBuildingsFromIds` (`conquest-stability.ts:77`); mapowanie w
    /// `conquest-stability-params.json` (`budynki_religijne`).
    pub fn religion_buildings_from_ids<S: AsRef<str>>(built_ids: &[S]) -> ReligionBuildings {
        let mut out = ReligionBuildings::default();
        for (flag, ids) in &conquest_stability_params().budynki_religijne {
            let present = ids
                .iter()
                .any(|id| built_ids.iter().any(|b| b.as_ref() == id));
            match flag.as_str() {
                "hasSwiatynia" => out.has_swiatynia = present,
                "hasKamienneKregi" => out.has_kamienne_kregi = present,
                _ => {}
            }
        }
        out
    }

    /// Wynik `convertViaTemple` czytany przez tick (`state`, `converted`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct ReligionConversion<S> {
        pub state: S,
        pub converted: f64,
    }

    /// Web `CultureReligionTickResult` (`conquest-stability.ts:84`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct CultureReligionTickResult<S> {
        pub own_culture_share: f64,
        pub religion_state: S,
        pub culture_rate_applied: f64,
        pub religion_converted: f64,
    }

    /// Web `tickCityCultureReligion` (`conquest-stability.ts:95`). Zaleznosci spoza zakresu
    /// (`convertCulture`, `convertViaTemple` z `culture-religion.ts`, P6.16) sa WSTRZYKNIETE:
    /// `convert_culture` zwraca `ownCultureShare` z wyniku, `convert_via_temple` zwraca `state` i
    /// `converted`. `S` = `ReligionState`, `CP` / `RP` = `CultureParams` / `ReligionParams`.
    #[allow(clippy::too_many_arguments)]
    pub fn tick_city_culture_religion<S, CP, RP>(
        own_culture_share: f64,
        religion_state: S,
        built_ids: &[&str],
        owner_religion: Option<&str>,
        foreign_religion_dominant: bool,
        culture_params: &CP,
        religion_params: &RP,
        convert_culture: &dyn Fn(&CultureCity, &CultureBuildings, &CP) -> f64,
        convert_via_temple: &dyn Fn(&S, &str, &ReligionBuildings, &RP) -> ReligionConversion<S>,
    ) -> CultureReligionTickResult<S> {
        let mut share = own_culture_share;
        let mut rel = religion_state;

        if share < 1.0 {
            let cc = CultureCity {
                kultura_skumulowana: 0.0,
                own_culture_share: Some(share),
            };
            share = convert_culture(&cc, &culture_buildings_from_ids(built_ids), culture_params);
        }

        if let Some(owner) = owner_religion.filter(|r| foreign_religion_dominant && !r.is_empty()) {
            let rel_conv = convert_via_temple(
                &rel,
                owner,
                &religion_buildings_from_ids(built_ids),
                religion_params,
            );
            rel = rel_conv.state;
            return CultureReligionTickResult {
                own_culture_share: share,
                religion_state: rel,
                culture_rate_applied: share - own_culture_share,
                religion_converted: rel_conv.converted,
            };
        }

        CultureReligionTickResult {
            own_culture_share: share,
            religion_state: rel,
            culture_rate_applied: share - own_culture_share,
            religion_converted: 0.0,
        }
    }

    /// Web `conquestUnstableHappinessPenalty` (`conquest-stability.ts:156`, `@deprecated`): kara
    /// usunieta decyzja wlasciciela (G5, 2026-09-05) - ZAWSZE 0; argumenty `society` / `difficulty`
    /// nie wplywaja na wynik i zostaly pominiete.
    pub fn conquest_unstable_happiness_penalty(
        _own_culture_share: f64,
        _foreign_religion_dominant: bool,
    ) -> f64 {
        0.0
    }

    /// Web `conquestNoGarrisonLawPenalty` (`conquest-stability.ts:172`, `@deprecated`): ZAWSZE 0
    /// (R-PRAWO-PRZEBUDOWA-SKALI-Q1 D5); `society` / `difficulty` pominiete.
    pub fn conquest_no_garrison_law_penalty(
        _own_culture_share: f64,
        _foreign_religion_dominant: bool,
        _garnizon_count: f64,
    ) -> f64 {
        0.0
    }

    /// Web `conquestRevoltRiskMultiplier` (`conquest-stability.ts:183`).
    pub fn conquest_revolt_risk_multiplier(
        own_culture_share: f64,
        foreign_religion_dominant: bool,
        garnizon_count: f64,
    ) -> f64 {
        if garnizon_count > 0.0 {
            return 1.0;
        }
        if !is_conquest_unstable(own_culture_share, foreign_religion_dominant) {
            return 1.0;
        }
        conquest_stability_params().mnoznik_ryzyka_buntu_niestabilny_bez_garnizonu
    }
}

pub mod visibility {
    use std::collections::{BTreeSet, HashMap};
    use std::sync::OnceLock;

    use crate::data::derived::visibility_params;
    use crate::data::terrain_map::parse_map_gen_params;
    use crate::data::units_combat::UnitRecord;
    use crate::domain::pathfinding::ruch_jednostek::{
        int_key, is_water_terrain, Klucz, RuchJednostka, RuchMapa, TerenBazowy,
    };

    pub use crate::domain::territory::city_sight_radius;

    /// Web `DEFAULT_SIGHT` = `mapGenDefaultSight()` (`visibility.ts:25`, `map-gen-params-loader.ts:90`):
    /// `mgla.default_sight_jednostki.wartosc` z `data/map-gen-params.json`, gdy `> 0`; inaczej
    /// `FALLBACK_SIGHT` (`visibility-params.json`).
    pub fn default_sight() -> f64 {
        static SIGHT: OnceLock<f64> = OnceLock::new();
        *SIGHT.get_or_init(|| {
            let from_data = parse_map_gen_params()
                .expect("map-gen-params.json must parse")
                .mgla
                .default_sight_jednostki
                .wartosc as f64;
            default_sight_from(from_data, visibility_params().fallback_sight)
        })
    }

    /// Web `mapGenDefaultSight` (`map-gen-params-loader.ts:90`): `typeof v === 'number' && v > 0 ? v :
    /// FALLBACK_SIGHT` (NaN i wartosci niedodatnie -> wartosc zapasowa).
    pub fn default_sight_from(value: f64, fallback: f64) -> f64 {
        if value > 0.0 {
            value
        } else {
            fallback
        }
    }

    /// Web `FOG_EXPLORED_BRIGHTNESS` (`visibility.ts:31`).
    pub fn fog_explored_brightness() -> f64 {
        visibility_params().fog_explored_brightness
    }

    /// Web `UnitSightResolver` (`visibility.ts:34`).
    pub type UnitSightResolver<'a> = Box<dyn Fn(&RuchJednostka) -> f64 + 'a>;

    /// Podzbior web `UnitDef` czytany przez `buildUnitSightResolver`: `Jednostka`, `'Widok pola'`,
    /// `Ruch` (`Some` tylko, gdy wartosc jest liczba - `typeof === 'number'`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct UnitSightDef {
        pub jednostka: String,
        pub widok_pola: Option<f64>,
        pub ruch: Option<f64>,
    }

    impl UnitSightDef {
        pub fn from_unit_record(record: &UnitRecord) -> Self {
            Self {
                jednostka: record.jednostka.clone(),
                widok_pola: Some(record.widok_pola as f64),
                ruch: Some(record.ruch as f64),
            }
        }
    }

    /// Web `buildUnitSightResolver` (`visibility.ts:40`). `city_sight = None` -> `DEFAULT_SIGHT`.
    pub fn build_unit_sight_resolver<'a>(
        unit_defs: &[UnitSightDef],
        city_sight: Option<f64>,
    ) -> UnitSightResolver<'a> {
        let city_sight = city_sight.unwrap_or_else(default_sight);
        let mut by_name: HashMap<String, (Option<f64>, Option<f64>)> = HashMap::new();
        for def in unit_defs {
            by_name.insert(def.jednostka.clone(), (def.widok_pola, def.ruch));
        }
        let city_type_id = visibility_params().city_type_id.clone();
        Box::new(move |unit: &RuchJednostka| {
            let type_id = unit.type_id.as_deref();
            if type_id == Some(city_type_id.as_str()) {
                return city_sight;
            }
            let def = type_id.and_then(|t| by_name.get(t));
            if let Some((Some(widok), _)) = def {
                return *widok;
            }
            if let Some((_, Some(ruch))) = def {
                return *ruch;
            }
            default_sight()
        })
    }

    /// Odleglosc heksowa na `f64` (web `hexDistance`, `setup.ts:354`; wariant liczb zmiennoprzecinkowych
    /// - odpowiednik `hex_distance_f` w `pathfinding::ruch_jednostek` jest prywatny).
    fn hex_distance_f64(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
        let dq = (aq - bq).abs();
        let dr = (ar - br).abs();
        let ds = ((-aq - ar) - (-bq - br)).abs();
        dq.max(dr).max(ds)
    }

    /// Wspolna petla `computeVisibleAt` / `computeVisible` (`visibility.ts:64`, `:150`): krok `dq`, `dr`
    /// o 1 od `-sight` do `sight` (arytmetyka `f64` jak w JS), klucz istnieje tylko dla calkowitych
    /// wspolrzednych. `sight` nieskonczone: web nie konczy sie - tu zwracamy brak heksow.
    fn add_disc(out: &mut BTreeSet<Klucz>, q: i32, r: i32, map: &RuchMapa, sight: f64) {
        if !sight.is_finite() {
            return;
        }
        let (qf, rf) = (f64::from(q), f64::from(r));
        let mut dq = -sight;
        while dq <= sight {
            let mut dr = -sight;
            while dr <= sight {
                if hex_distance_f64(qf, rf, qf + dq, rf + dr) <= sight {
                    if let Some(key) = int_key(qf + dq, rf + dr) {
                        if map.contains(key) {
                            out.insert(key);
                        }
                    }
                }
                dr += 1.0;
            }
            dq += 1.0;
        }
    }

    /// Web `computeVisibleAt` (`visibility.ts:64`).
    pub fn compute_visible_at(q: i32, r: i32, map: &RuchMapa, sight: f64) -> BTreeSet<Klucz> {
        let mut visible = BTreeSet::new();
        add_disc(&mut visible, q, r, map, sight);
        visible
    }

    /// Web `computeVisibleAlongPath` (`visibility.ts:105`): suma widocznosci ze wszystkich heksow sciezki.
    pub fn compute_visible_along_path(
        path_hexes: &[(i32, i32)],
        map: &RuchMapa,
        sight: f64,
    ) -> BTreeSet<Klucz> {
        let mut visible = BTreeSet::new();
        for (q, r) in path_hexes {
            add_disc(&mut visible, *q, *r, map, sight);
        }
        visible
    }

    /// Argument `sightOrResolver` weba (`computeVisible`, przeciazenia `:140` i `:145`, implementacja `:150`).
    pub enum UnitSight<'a> {
        Fixed(f64),
        Resolver(&'a dyn Fn(&RuchJednostka) -> f64),
    }

    /// Web `computeVisible` (`visibility.ts:150`).
    pub fn compute_visible(
        player_units: &[RuchJednostka],
        map: &RuchMapa,
        sight: UnitSight,
    ) -> BTreeSet<Klucz> {
        let mut visible = BTreeSet::new();
        for unit in player_units {
            let radius = match &sight {
                UnitSight::Fixed(s) => *s,
                UnitSight::Resolver(resolve) => resolve(unit),
            };
            add_disc(&mut visible, unit.q, unit.r, map, radius);
        }
        visible
    }

    /// Web `addExplored` (`visibility.ts:190`): dopisuje klucze `visible` do `explored`.
    pub fn add_explored(explored: &mut BTreeSet<Klucz>, visible: &BTreeSet<Klucz>) {
        for key in visible {
            explored.insert(*key);
        }
    }

    /// Web `allHexKeys` (`visibility.ts:210`). Kolejnosc: rosnaco po `(q, r)` (`BTreeMap`); web:
    /// kolejnosc wstawiania do `map.hexes`.
    pub fn all_hex_keys(map: &RuchMapa) -> Vec<Klucz> {
        map.hexes.keys().copied().collect()
    }

    /// Web `isRevealLandTeren` (`visibility.ts:215`): wszystko poza `Morze`.
    pub fn is_reveal_land_teren(terrain: TerenBazowy) -> bool {
        terrain != TerenBazowy::Morze
    }

    /// Web `allRevealLandKeys` (`visibility.ts:219`).
    pub fn all_reveal_land_keys(map: &RuchMapa) -> Vec<Klucz> {
        map.hexes
            .iter()
            .filter(|(_, hex)| is_reveal_land_teren(hex.teren))
            .map(|(key, _)| *key)
            .collect()
    }

    /// Web `isDryLandTeren` (`visibility.ts:228`): ląd bez wody (`isWaterTerrain`).
    pub fn is_dry_land_teren(terrain: TerenBazowy) -> bool {
        !is_water_terrain(terrain)
    }

    /// Web `allDryLandKeys` (`visibility.ts:232`).
    pub fn all_dry_land_keys(map: &RuchMapa) -> Vec<Klucz> {
        map.hexes
            .iter()
            .filter(|(_, hex)| is_dry_land_teren(hex.teren))
            .map(|(key, _)| *key)
            .collect()
    }

    /// Web `exploredSetForRender` (`visibility.ts:241`): bez `reveal_all_land` kopia `explored`.
    pub fn explored_set_for_render(
        explored: &BTreeSet<Klucz>,
        all_land_keys: &BTreeSet<Klucz>,
        reveal_all_land: bool,
    ) -> BTreeSet<Klucz> {
        if !reveal_all_land {
            return explored.clone();
        }
        let mut merged = explored.clone();
        for key in all_land_keys {
            merged.insert(*key);
        }
        merged
    }

    /// Web `PlayerVisibilityCity` (`visibility.ts:256`).
    #[derive(Debug, Clone, PartialEq)]
    pub struct PlayerVisibilityCity {
        pub q: i32,
        pub r: i32,
        pub population: f64,
        /// Web `kultura?` (`None` = 0).
        pub kultura: Option<f64>,
    }

    /// Web `ComputePlayerVisibilityOptions` (`visibility.ts:263`).
    pub struct ComputePlayerVisibilityOptions<'a> {
        pub map: &'a RuchMapa,
        pub player_units: &'a [RuchJednostka],
        pub player_cities: &'a [PlayerVisibilityCity],
        pub unit_sight: &'a dyn Fn(&RuchJednostka) -> f64,
        pub start_hex: Option<(i32, i32)>,
        /// Web `startRevealRadius?` (`None` -> `start_reveal_radius` z `visibility-params.json`).
        pub start_reveal_radius: Option<f64>,
    }

    /// Web `computePlayerVisibility` (`visibility.ts:277`). `border_radius` = `cityBorderRadius`
    /// z `culture-religion.ts` (P6.16), wstrzykniete do `city_sight_radius` (jak w `territory.rs`).
    pub fn compute_player_visibility(
        opts: &ComputePlayerVisibilityOptions,
        border_radius: &dyn Fn(f64) -> f64,
    ) -> BTreeSet<Klucz> {
        let mut visible = BTreeSet::new();

        for u in opts.player_units {
            let sight = (opts.unit_sight)(u);
            add_disc(&mut visible, u.q, u.r, opts.map, sight);
        }

        for c in opts.player_cities {
            let sight = city_sight_radius(c.population, c.kultura.unwrap_or(0.0), border_radius);
            if sight <= 0.0 {
                continue;
            }
            add_disc(&mut visible, c.q, c.r, opts.map, sight);
        }

        if !visible.is_empty() {
            return visible;
        }
        if let Some((q, r)) = opts.start_hex {
            let radius = opts
                .start_reveal_radius
                .unwrap_or(visibility_params().start_reveal_radius);
            return compute_visible_at(q, r, opts.map, radius);
        }
        visible
    }

    /// Web `unitsVisibleOnMap` (`visibility.ts:319`). `player_owner_id = None` -> 0.
    pub fn units_visible_on_map<'a>(
        units: &'a [RuchJednostka],
        visible_hexes: &BTreeSet<Klucz>,
        player_owner_id: Option<i64>,
    ) -> Vec<&'a RuchJednostka> {
        let player = player_owner_id.unwrap_or(0);
        units
            .iter()
            .filter(|u| {
                if u.in_garnizon {
                    return u.owner_id == player;
                }
                u.owner_id == player || visible_hexes.contains(&(u.q, u.r))
            })
            .collect()
    }
}

// ---------------------------------------------------------------------------
// P6.6B (R-RUSTPORT-P6-6B-MIASTA-ZAKLADANIE-B-Q1): porty `display-names.ts` (311 linii),
// `empire-city-defaults.ts` (554) i `cities.ts` (1393) z `gra/src/game/` (pin edb8fb56; liczby linii
// z `wc -l` na `git archive edb8fb56`, dispatch podawal 288/525/1293). Moduly leza w `p6_6b`;
// `state` jest modulem prywatnym `domain`, a `domain/mod.rs` jest poza allowlista tematu, wiec
// `p6_6b` jest udostepniony przez `pub use` wewnatrz juz publicznego `city_founding`:
// `domain::terrain::city_founding::p6_6b::{display_names, cities, empire_city_defaults}`.
// Parametry: `data/derived/{cities-params,display-names-params}.json`, `data/miasto-params.json`.
// ---------------------------------------------------------------------------

pub mod p6_6b {
    pub mod display_names {
        use std::collections::HashSet;

        use crate::data::derived::{display_names_params, DisplayNamesTechnicalPattern};
        use crate::domain::territory::js_trim;

        /// Web `CITY_STATE_LABEL` (`display-names.ts:8`).
        pub fn city_state_label() -> &'static str {
            &display_names_params().etykieta_miasto_panstwo
        }

        /// Web `CITY_STATE_SEPARATOR` (`display-names.ts:9`).
        pub fn city_state_separator() -> &'static str {
            &display_names_params().separator
        }

        /// Web `EntityDisplayCtx` (`display-names.ts:11`); `None` = pole pominiete (`undefined`).
        #[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
        pub struct EntityDisplayCtx<'a> {
            pub base_name: Option<&'a str>,
            pub is_city_state: Option<bool>,
        }

        /// Web `formatEntityDisplayName` (`display-names.ts:17`).
        pub fn format_entity_display_name(ctx: &EntityDisplayCtx<'_>) -> String {
            let base = js_trim(ctx.base_name.unwrap_or(""));
            if base.is_empty() {
                return String::new();
            }
            if ctx.is_city_state.unwrap_or(false) {
                return format!("{base}{}{}", city_state_separator(), city_state_label());
            }
            base.to_owned()
        }

        /// Web `stripCityStateSuffix` (`display-names.ts:27`).
        pub fn strip_city_state_suffix(name: &str) -> String {
            let suffix = format!("{}{}", city_state_separator(), city_state_label());
            name.strip_suffix(suffix.as_str())
                .unwrap_or(name)
                .to_owned()
        }

        /// Pola slotu spawnu klastra czytane przez `isClusterCityStateSlot` (`undefined` = `None`).
        #[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
        pub struct ClusterSlot {
            pub is_same_type_rival: Option<bool>,
            pub is_cluster_capital: Option<bool>,
            pub is_player_capital: Option<bool>,
        }

        /// Web `isClusterCityStateSlot` (`display-names.ts:33`).
        pub fn is_cluster_city_state_slot(slot: &ClusterSlot) -> bool {
            if slot.is_player_capital.unwrap_or(false) {
                return false;
            }
            if slot.is_same_type_rival.unwrap_or(false) {
                return true;
            }
            !slot.is_cluster_capital.unwrap_or(false)
        }

        /// Element `OwnerCityStateOpts.cities` (`display-names.ts:46`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub struct OwnerCityRef {
            pub owner_id: i64,
            pub start_city_state: Option<bool>,
        }

        /// Web `OwnerCityStateOpts` (`display-names.ts:43`).
        #[derive(Debug, Clone, Copy, Default)]
        pub struct OwnerCityStateOpts<'a> {
            pub simplified_owners: Option<&'a HashSet<i64>>,
            pub typ_copy_owners: Option<&'a HashSet<i64>>,
            pub cities: Option<&'a [OwnerCityRef]>,
        }

        /// Web `isOwnerClusterCityState` (`display-names.ts:50`). `ownerId` jako i64 (identyfikatory
        /// wlascicieli sa calkowite).
        pub fn is_owner_cluster_city_state(
            owner_id: i64,
            opts: Option<&OwnerCityStateOpts<'_>>,
        ) -> bool {
            if owner_id <= 0 {
                return false;
            }
            let Some(o) = opts else {
                return false;
            };
            if o.simplified_owners.is_some_and(|s| s.contains(&owner_id)) {
                return true;
            }
            if o.typ_copy_owners.is_some_and(|s| s.contains(&owner_id)) {
                return true;
            }
            o.cities.is_some_and(|cities| {
                cities
                    .iter()
                    .any(|c| c.owner_id == owner_id && c.start_city_state.unwrap_or(false))
            })
        }

        /// Web `clearCityStateFlagOnCapture` (`display-names.ts:88`): `city.startCityState`.
        pub fn clear_city_state_flag_on_capture(start_city_state: &mut Option<bool>) -> bool {
            if *start_city_state != Some(true) {
                return false;
            }
            *start_city_state = Some(false);
            true
        }

        /// Web `ForceCultureIconOpts` (`display-names.ts:96`).
        #[derive(Debug, Clone, Copy, Default)]
        pub struct ForceCultureIconOpts<'a> {
            pub base: OwnerCityStateOpts<'a>,
            pub cluster_capital_owner_ids: Option<&'a HashSet<i64>>,
            pub player_civ_key: Option<&'a str>,
            pub owner_civ_key: Option<&'a str>,
        }

        /// Web `shouldForceCultureIconForOwner` (`display-names.ts:110`).
        pub fn should_force_culture_icon_for_owner(
            owner_id: i64,
            opts: Option<&ForceCultureIconOpts<'_>>,
        ) -> bool {
            if owner_id <= 0 {
                return false;
            }
            if is_owner_cluster_city_state(owner_id, opts.map(|o| &o.base)) {
                return true;
            }
            let player_key = js_trim(opts.and_then(|o| o.player_civ_key).unwrap_or(""));
            let owner_key = js_trim(opts.and_then(|o| o.owner_civ_key).unwrap_or(""));
            let capital = opts
                .and_then(|o| o.cluster_capital_owner_ids)
                .is_some_and(|s| s.contains(&owner_id));
            !player_key.is_empty() && !owner_key.is_empty() && player_key == owner_key && !capital
        }

        /// Web `CityMapLabelOpts` (`display-names.ts:134`).
        #[derive(Debug, Clone, Copy, Default)]
        pub struct CityMapLabelOpts<'a> {
            pub player_owner_id: Option<i64>,
            pub is_capital: Option<bool>,
            pub civ_display_name: Option<&'a str>,
            pub is_city_state_owner: Option<bool>,
        }

        /// Pola miasta czytane przez `formatCityMapLabel` (`display-names.ts:172`).
        #[derive(Debug, Clone, Copy)]
        pub struct CityMapLabelCity<'a> {
            pub name: &'a str,
            pub owner_id: i64,
            pub start_city_state: Option<bool>,
        }

        /// Web `formatCityMapLabel` (`display-names.ts:171`).
        pub fn format_city_map_label(
            city: &CityMapLabelCity<'_>,
            opts: Option<&CityMapLabelOpts<'_>>,
        ) -> String {
            let player_owner_id = opts.and_then(|o| o.player_owner_id).unwrap_or(0);
            let is_foreign = city.owner_id != player_owner_id;
            let is_city_state = is_foreign && city.start_city_state.unwrap_or(false);
            let is_city_state_owner = opts.and_then(|o| o.is_city_state_owner) == Some(true);

            if is_foreign
                && opts.and_then(|o| o.is_capital) == Some(true)
                && !is_city_state
                && !is_city_state_owner
            {
                let civ = opts.and_then(|o| o.civ_display_name);
                let base = foreign_capital_map_name(Some(city.name), civ);
                if !base.is_empty() {
                    return format_entity_display_name(&EntityDisplayCtx {
                        base_name: Some(base.as_str()),
                        is_city_state: Some(false),
                    });
                }
            }

            format_entity_display_name(&EntityDisplayCtx {
                base_name: Some(city.name),
                is_city_state: Some(is_city_state),
            })
        }

        /// Web `formatOwnerDiploLabel` (`display-names.ts:198`).
        pub fn format_owner_diplo_label(
            base_name: &str,
            owner_id: i64,
            opts: Option<&OwnerCityStateOpts<'_>>,
        ) -> String {
            let stripped = strip_city_state_suffix(base_name);
            format_entity_display_name(&EntityDisplayCtx {
                base_name: Some(stripped.as_str()),
                is_city_state: Some(is_owner_cluster_city_state(owner_id, opts)),
            })
        }

        fn matches_technical(t: &str, pattern: &DisplayNamesTechnicalPattern) -> bool {
            let mut chars = t.chars();
            for want in pattern.prefiks.chars() {
                let Some(got) = chars.next() else {
                    return false;
                };
                let same = if pattern.ignoruj_wielkosc {
                    got.eq_ignore_ascii_case(&want)
                } else {
                    got == want
                };
                if !same {
                    return false;
                }
            }
            let rest = chars.as_str();
            if pattern.cyfry {
                !rest.is_empty() && rest.chars().all(|c| c.is_ascii_digit())
            } else {
                rest.is_empty()
            }
        }

        /// Web `isTechnicalOwnerLabel` (`display-names.ts:210`): puste i placeholdery `Rywal N` /
        /// `AI N` / `oid-N` (wzorce w `display-names-params.json`).
        pub fn is_technical_owner_label(name: Option<&str>) -> bool {
            let t = js_trim(name.unwrap_or(""));
            if t.is_empty() {
                return true;
            }
            display_names_params()
                .wzorce_techniczne
                .iter()
                .any(|p| matches_technical(t, p))
        }

        /// Web `ResolveOwnerBaseNameInput` (`display-names.ts:219`).
        #[derive(Debug, Clone, Copy)]
        pub struct ResolveOwnerBaseNameInput<'a> {
            pub owner_id: i64,
            pub cached: Option<&'a str>,
            pub city_name: Option<&'a str>,
            pub civ_display_name: Option<&'a str>,
            pub is_city_state: bool,
            pub is_cluster_capital: Option<bool>,
        }

        /// Web `cleanDisplayPart` (`display-names.ts:229`). `Some("")` jest mozliwe (po obcieciu
        /// dopisku) i w JS jest falsy, ale NIE jest nullish.
        fn clean_display_part(value: Option<&str>) -> Option<String> {
            match value {
                Some(v) if !v.is_empty() && !is_technical_owner_label(Some(v)) => {
                    Some(strip_city_state_suffix(v))
                }
                _ => None,
            }
        }

        fn truthy(value: &Option<String>) -> Option<&str> {
            value.as_deref().filter(|s| !s.is_empty())
        }

        /// Web `foreignCapitalMapName` (`display-names.ts:247`).
        pub fn foreign_capital_map_name(
            city_name: Option<&str>,
            civ_display_name: Option<&str>,
        ) -> String {
            clean_display_part(city_name)
                .or_else(|| clean_display_part(civ_display_name))
                .unwrap_or_default()
        }

        /// Web `resolveOwnerBaseName` (`display-names.ts:262`). `ownerId` jest w webie
        /// destrukturyzowane, ale nieuzywane.
        pub fn resolve_owner_base_name(input: &ResolveOwnerBaseNameInput<'_>) -> String {
            let is_city_state = input.is_city_state;
            let clean_city = clean_display_part(input.city_name);
            let clean_civ = clean_display_part(input.civ_display_name);
            let clean_cached = clean_display_part(input.cached);

            if input.is_cluster_capital.unwrap_or(false) {
                if let Some(civ) = truthy(&clean_civ) {
                    return civ.to_owned();
                }
            }
            if is_city_state {
                if let (Some(city), Some(civ)) = (truthy(&clean_city), truthy(&clean_civ)) {
                    if city != civ {
                        return format!("{city}{}{civ}", city_state_separator());
                    }
                }
                if let Some(civ) = truthy(&clean_civ) {
                    return civ.to_owned();
                }
                if let Some(city) = truthy(&clean_city) {
                    return city.to_owned();
                }
            }
            if !is_city_state {
                if let Some(civ) = truthy(&clean_civ) {
                    return civ.to_owned();
                }
            }
            if let Some(cached) = truthy(&clean_cached) {
                return cached.to_owned();
            }
            if let Some(city) = truthy(&clean_city) {
                return city.to_owned();
            }
            if let Some(civ) = truthy(&clean_civ) {
                return civ.to_owned();
            }
            if let Some(cached) = input.cached {
                if !js_trim(cached).is_empty() {
                    return strip_city_state_suffix(cached);
                }
            }
            if let Some(city) = input.city_name {
                if !js_trim(city).is_empty() {
                    return strip_city_state_suffix(city);
                }
            }
            String::new()
        }

        /// Web `sanitizeOwnerDisplayBase` (`display-names.ts:301`).
        pub fn sanitize_owner_display_base(
            base: Option<&str>,
            civ_display_name: Option<&str>,
        ) -> String {
            let trimmed = js_trim(base.unwrap_or(""));
            if !trimmed.is_empty() && !is_technical_owner_label(Some(trimmed)) {
                return strip_city_state_suffix(trimmed);
            }
            let civ = match civ_display_name {
                Some(c) if !c.is_empty() && !is_technical_owner_label(Some(c)) => {
                    Some(strip_city_state_suffix(c))
                }
                _ => None,
            };
            civ.unwrap_or_default()
        }
    }

    pub mod cities {
        use std::collections::{BTreeMap, HashSet};

        use serde_json::Value;

        use crate::data::derived::cities_params;
        use crate::data::economy_society::parse_miasto_params;
        use crate::domain::pathfinding::ruch_jednostek::{
            is_water_terrain, RuchMapa, TerenBazowy as RuchTeren,
        };
        use crate::domain::recruitment::army_merge::{js_max, js_min, js_round};
        use crate::domain::recruitment::manpower::js_number_to_string;
        use crate::domain::territory::js_trim;

        // -------------------------------------------------------------------
        // Typy (web: interfejsy i unie napisow z `cities.ts`)
        // -------------------------------------------------------------------

        /// Web `CityPodzialHandlu` (`cities.ts:21`).
        #[derive(Debug, Clone, Copy, PartialEq, Default)]
        pub struct CityPodzialHandlu {
            pub procent_nauka: f64,
            pub procent_pieniadz: f64,
            pub procent_luksus: f64,
        }

        /// Klucz pola `CityPodzialHandlu` (web: `keyof CityPodzialHandlu`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum HandelKey {
            Pieniadz,
            Nauka,
            Luksus,
        }

        impl CityPodzialHandlu {
            pub fn get(&self, key: HandelKey) -> f64 {
                match key {
                    HandelKey::Pieniadz => self.procent_pieniadz,
                    HandelKey::Nauka => self.procent_nauka,
                    HandelKey::Luksus => self.procent_luksus,
                }
            }

            pub fn set(&mut self, key: HandelKey, value: f64) {
                match key {
                    HandelKey::Pieniadz => self.procent_pieniadz = value,
                    HandelKey::Nauka => self.procent_nauka = value,
                    HandelKey::Luksus => self.procent_luksus = value,
                }
            }
        }

        /// Web `CityPodzialPracy` (`cities.ts:40`).
        #[derive(Debug, Clone, Copy, PartialEq, Default)]
        pub struct CityPodzialPracy {
            pub procent_budynki: f64,
        }

        /// Web `OkolicaFocus` (`cities.ts:45`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum OkolicaFocus {
            Zrownowazone,
            Zywnosc,
            Produkcja,
            Podatki,
        }

        impl OkolicaFocus {
            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Zrownowazone => "zrownowazone",
                    Self::Zywnosc => "zywnosc",
                    Self::Produkcja => "produkcja",
                    Self::Podatki => "podatki",
                }
            }

            pub fn from_web(value: &str) -> Option<Self> {
                match value {
                    "zrownowazone" => Some(Self::Zrownowazone),
                    "zywnosc" => Some(Self::Zywnosc),
                    "produkcja" => Some(Self::Produkcja),
                    "podatki" => Some(Self::Podatki),
                    _ => None,
                }
            }
        }

        /// Web `OkolicaTryb` (`cities.ts:48`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum OkolicaTryb {
            Auto,
            Reczny,
        }

        impl OkolicaTryb {
            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Auto => "auto",
                    Self::Reczny => "reczny",
                }
            }

            pub fn from_web(value: &str) -> Option<Self> {
                match value {
                    "auto" => Some(Self::Auto),
                    "reczny" => Some(Self::Reczny),
                    _ => None,
                }
            }
        }

        /// Web `BudowaFocus` (`cities.ts:60`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum BudowaFocus {
            Zrownowazone,
            Wzrost,
            Wojsko,
            Kultura,
            Prawo,
            Produkcja,
        }

        impl BudowaFocus {
            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Zrownowazone => "zrownowazone",
                    Self::Wzrost => "wzrost",
                    Self::Wojsko => "wojsko",
                    Self::Kultura => "kultura",
                    Self::Prawo => "prawo",
                    Self::Produkcja => "produkcja",
                }
            }

            pub fn from_web(value: &str) -> Option<Self> {
                match value {
                    "zrownowazone" => Some(Self::Zrownowazone),
                    "wzrost" => Some(Self::Wzrost),
                    "wojsko" => Some(Self::Wojsko),
                    "kultura" => Some(Self::Kultura),
                    "prawo" => Some(Self::Prawo),
                    "produkcja" => Some(Self::Produkcja),
                    _ => None,
                }
            }
        }

        /// Web `BudowaTryb` (`cities.ts:69`) plus wartosc `Auto`, ktora istnieje WYLACZNIE w starych
        /// zapisach (web czyta ja surowo w `ensureCitySaveDefaults`, `cities.ts:753`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum BudowaTryb {
            Reczny,
            Priorytet,
            Lista,
            Zrownowazone,
            Auto,
        }

        impl BudowaTryb {
            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Reczny => "reczny",
                    Self::Priorytet => "priorytet",
                    Self::Lista => "lista",
                    Self::Zrownowazone => "zrownowazone",
                    Self::Auto => "auto",
                }
            }

            pub fn from_web(value: &str) -> Option<Self> {
                match value {
                    "reczny" => Some(Self::Reczny),
                    "priorytet" => Some(Self::Priorytet),
                    "lista" => Some(Self::Lista),
                    "zrownowazone" => Some(Self::Zrownowazone),
                    "auto" => Some(Self::Auto),
                    _ => None,
                }
            }
        }

        /// Web `UlepszeniaFocus` (`cities.ts:181`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum UlepszeniaFocus {
            Zywnosc,
            Surowce,
            Infrastruktura,
            Zrownowazone,
        }

        impl UlepszeniaFocus {
            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Zywnosc => "zywnosc",
                    Self::Surowce => "surowce",
                    Self::Infrastruktura => "infrastruktura",
                    Self::Zrownowazone => "zrownowazone",
                }
            }

            pub fn from_web(value: &str) -> Option<Self> {
                match value {
                    "zywnosc" => Some(Self::Zywnosc),
                    "surowce" => Some(Self::Surowce),
                    "infrastruktura" => Some(Self::Infrastruktura),
                    "zrownowazone" => Some(Self::Zrownowazone),
                    _ => None,
                }
            }
        }

        /// Web `UlepszeniaTryb` (`cities.ts:184`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub enum UlepszeniaTryb {
            Auto,
            Reczny,
        }

        impl UlepszeniaTryb {
            pub fn web_value(self) -> &'static str {
                match self {
                    Self::Auto => "auto",
                    Self::Reczny => "reczny",
                }
            }

            pub fn from_web(value: &str) -> Option<Self> {
                match value {
                    "auto" => Some(Self::Auto),
                    "reczny" => Some(Self::Reczny),
                    _ => None,
                }
            }
        }

        /// Web `BudowaListaSzablon` (`cities.ts:72`). `budynki` to w typie `string[]`, ale dane z
        /// zapisu nie sa sprawdzane elementarnie (`isBudowaListaSzablonArray`), wiec elementy to
        /// dowolne wartosci JSON.
        #[derive(Debug, Clone, PartialEq)]
        pub struct BudowaListaSzablon {
            pub id: String,
            pub nazwa: String,
            pub budynki: Vec<Value>,
        }

        /// Web `WealthState` (`wealth.ts`) w zakresie uzywanym przez `freshWealthState`.
        #[derive(Debug, Clone, Copy, PartialEq, Default)]
        pub struct WealthState {
            pub poziom: f64,
            pub pula: f64,
        }

        /// Wartosc `City.magazynZywnosci`: typ weba to `number`, ale stare zapisy niosa obiekt
        /// `{ aktualny }` (czytany przez `readCityFoodBuffer`); `Other` to kazda inna wartosc
        /// (napis, `null`, tablica...).
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub enum FoodBuffer {
            Number(f64),
            Legacy { aktualny: Option<f64> },
            Other,
        }

        /// Podzbior pol `City` (`cities.ts:834`) czytanych lub zapisywanych przez logike trzech
        /// plikow P6.6B. Pozostale pola interfejsu (oblezenie, rebelia, kultura, manpower...) sa
        /// czystymi danymi bez logiki w tych plikach - patrz dokument P6-6B §4. `None` = pole
        /// nieobecne (`undefined`).
        #[derive(Debug, Clone, PartialEq, Default)]
        pub struct City {
            pub id: String,
            pub owner_id: i64,
            pub q: f64,
            pub r: f64,
            pub name: String,
            pub population: f64,
            pub magazyn_zywnosci: Option<FoodBuffer>,
            pub surowce: Option<BTreeMap<String, f64>>,
            pub podzial_handlu_override: Option<bool>,
            pub podzial_handlu: Option<CityPodzialHandlu>,
            pub podzial_pracy_override: Option<bool>,
            pub podzial_pracy: Option<CityPodzialPracy>,
            pub poziom_racji: Option<f64>,
            pub poziom_racji_override: Option<bool>,
            pub auto_wyzywienie: Option<bool>,
            pub ration_migrated_v114: Option<bool>,
            pub wzrost_ulamkowy: Option<f64>,
            pub tury_bez_doplaty: Option<f64>,
            pub procent_rozwoj: Option<f64>,
            pub okolica_focus: Option<OkolicaFocus>,
            pub okolica_focus_override: Option<bool>,
            pub okolica_tryb: Option<OkolicaTryb>,
            /// Web `okolicaReczne?: Record<string, number>` (`cities.ts:955`): tryb reczny z zachowana
            /// kolejnoscia wstawiania (`Reczne`). `None` = pole nieobecne. P6.8G r4 (N1, hak rebalansu).
            pub okolica_reczne: Option<crate::domain::okolica::Reczne>,
            pub budowa_focus: Option<BudowaFocus>,
            pub budowa_tryb: Option<BudowaTryb>,
            pub budowa_focus_override: Option<bool>,
            pub budowa_priorytet_typow: Option<Vec<BudowaFocus>>,
            pub budowa_lista: Option<Vec<String>>,
            pub ulepszenia_override: Option<bool>,
            pub ulepszenia_focus: Option<UlepszeniaFocus>,
            pub ulepszenia_tryb: Option<UlepszeniaTryb>,
            pub ulepszenia_only_worked: Option<bool>,
            pub ulepszenia_wolno_wycinac_las: Option<bool>,
            pub ulepszenia_praca_percent: Option<f64>,
            /// Stare pole `ulepszeniaPerTurn` (nietypowane w `City`, czytane surowo przez migracje);
            /// `None` = brak pola lub wartosc nie jest liczba.
            pub ulepszenia_per_turn: Option<f64>,
            pub wealth_state: Option<WealthState>,
            pub wealth_immunity_remaining: Option<f64>,
            pub founded_by_owner: Option<bool>,
            pub start_city_state: Option<bool>,
            pub postep_budynkow_usuniete: Option<BTreeMap<String, f64>>,
        }

        // -------------------------------------------------------------------
        // Stale i domyslne (dane: data/derived/cities-params.json)
        // -------------------------------------------------------------------

        fn pct_total() -> f64 {
            cities_params().procent_calosc
        }

        fn clamp_pct(x: f64) -> f64 {
            js_max(0.0, js_min(pct_total(), x))
        }

        fn okolica_focus_from(value: &str) -> OkolicaFocus {
            OkolicaFocus::from_web(value).expect("cities-params.json: okolica focus")
        }

        fn budowa_focus_from(value: &str) -> BudowaFocus {
            BudowaFocus::from_web(value).expect("cities-params.json: budowa focus")
        }

        fn budowa_tryb_from(value: &str) -> BudowaTryb {
            BudowaTryb::from_web(value).expect("cities-params.json: budowa tryb")
        }

        fn ulepszenia_focus_from(value: &str) -> UlepszeniaFocus {
            UlepszeniaFocus::from_web(value).expect("cities-params.json: ulepszenia focus")
        }

        fn ulepszenia_tryb_from(value: &str) -> UlepszeniaTryb {
            UlepszeniaTryb::from_web(value).expect("cities-params.json: ulepszenia tryb")
        }

        /// Web `freshWealthState` (`wealth.ts:249`), wejscie z danych (poza zakresem tej czesci).
        pub fn fresh_wealth_state() -> WealthState {
            let inputs = &cities_params().wejscia_z_innych_modulow_weba;
            WealthState {
                poziom: inputs.swiezy_wealth_poziom,
                pula: inputs.swiezy_wealth_pula,
            }
        }

        /// Web `EMPTY_BUDOWA_LISTA_BIBLIOTEKA` (`cities.ts:75`).
        pub fn empty_budowa_lista_biblioteka() -> Vec<BudowaListaSzablon> {
            Vec::new()
        }

        /// Web `DEFAULT_OKOLICA_FOCUS` (`cities.ts:56`).
        pub fn default_okolica_focus() -> OkolicaFocus {
            okolica_focus_from(&cities_params().okolica.domyslny_focus)
        }

        /// Web `DEFAULT_OKOLICA_TRYB` (`cities.ts:57`).
        pub fn default_okolica_tryb() -> OkolicaTryb {
            OkolicaTryb::from_web(&cities_params().okolica.domyslny_tryb)
                .expect("cities-params.json: okolica tryb")
        }

        /// Web `DEFAULT_BUDOWA_FOCUS` (`cities.ts:177`).
        pub fn default_budowa_focus() -> BudowaFocus {
            budowa_focus_from(&cities_params().budowa.domyslny_focus)
        }

        /// Web `DEFAULT_BUDOWA_TRYB` (`cities.ts:178`).
        pub fn default_budowa_tryb() -> BudowaTryb {
            budowa_tryb_from(&cities_params().budowa.domyslny_tryb)
        }

        /// Web `DEFAULT_ULEPSZENIA_FOCUS` (`cities.ts:202`).
        pub fn default_ulepszenia_focus() -> UlepszeniaFocus {
            ulepszenia_focus_from(&cities_params().ulepszenia.domyslny_focus)
        }

        /// Web `DEFAULT_ULEPSZENIA_TRYB` (`cities.ts:203`).
        pub fn default_ulepszenia_tryb() -> UlepszeniaTryb {
            ulepszenia_tryb_from(&cities_params().ulepszenia.domyslny_tryb)
        }

        /// Web `DEFAULT_ULEPSZENIA_ONLY_WORKED` (`cities.ts:217`).
        pub fn default_ulepszenia_only_worked() -> bool {
            cities_params().ulepszenia.domyslnie_only_worked
        }

        /// Web `DEFAULT_ULEPSZENIA_WOLNO_WYCINAC_LAS` (`cities.ts:226`).
        pub fn default_ulepszenia_wolno_wycinac_las() -> bool {
            cities_params().ulepszenia.domyslnie_wolno_wycinac_las
        }

        /// Web `DEFAULT_ULEPSZENIA_PRACA_PERCENT` (`cities.ts:229`).
        pub fn default_ulepszenia_praca_percent() -> f64 {
            cities_params().ulepszenia.domyslna_praca_procent
        }

        /// Web `AI_MAJOR_ULEPSZENIA_PRACA_PERCENT` (`cities.ts:232`).
        pub fn ai_major_ulepszenia_praca_percent() -> f64 {
            cities_params().ulepszenia.ai_major_praca_procent
        }

        /// Web `MAX_ULEPSZENIA_PRACA_AUTO_PERCENT` (`cities.ts:240`).
        pub fn max_ulepszenia_praca_auto_percent() -> f64 {
            cities_params().ulepszenia.max_auto_praca_procent
        }

        /// Web `DEFAULT_BUDOWA_PRIORYTET_TYPOW` (`cities.ts:396`).
        pub fn default_budowa_priorytet_typow() -> Vec<BudowaFocus> {
            cities_params()
                .budowa
                .domyslny_priorytet_typow
                .iter()
                .map(|v| budowa_focus_from(v))
                .collect()
        }

        /// Web `BUDOWA_TYP_FOCUS` (`cities.ts:405`).
        pub fn budowa_typ_focus() -> Vec<BudowaFocus> {
            cities_params()
                .budowa
                .typy_focus
                .iter()
                .map(|v| budowa_focus_from(v))
                .collect()
        }

        /// Web `DEFAULT_PODZIAL_HANDLU` (`cities.ts:436`).
        pub fn default_podzial_handlu() -> CityPodzialHandlu {
            let d = &cities_params().podzial_handlu.domyslnie;
            CityPodzialHandlu {
                procent_nauka: d.procent_nauka,
                procent_pieniadz: d.procent_pieniadz,
                procent_luksus: d.procent_luksus,
            }
        }

        /// Web `DEFAULT_PODZIAL_PRACY` (`cities.ts:443`).
        pub fn default_podzial_pracy() -> CityPodzialPracy {
            CityPodzialPracy {
                procent_budynki: cities_params().podzial_pracy.domyslnie_budynki,
            }
        }

        /// Web `MIN_PODZIAL_PRACY_BUDYNKI_PERCENT` (`cities.ts:456`).
        pub fn min_podzial_pracy_budynki_percent() -> f64 {
            cities_params().podzial_pracy.min_budynki
        }

        /// Web `MAX_PODZIAL_PRACY_BUDYNKI_PERCENT` (`cities.ts:457`).
        pub fn max_podzial_pracy_budynki_percent() -> f64 {
            cities_params().podzial_pracy.max_budynki
        }

        /// Web `AI_FIXED_PROCENT_BUDYNKI` (`cities.ts:469`).
        pub fn ai_fixed_procent_budynki() -> f64 {
            cities_params().podzial_pracy.ai_stale_budynki
        }

        /// Web `MAX_PROCENT_PULI_IMPERIUM` (`cities.ts:478`) = calosc - minimum budynkow.
        pub fn max_procent_puli_imperium() -> f64 {
            pct_total() - min_podzial_pracy_budynki_percent()
        }

        /// Web `MIN_PROCENT_PULI_IMPERIUM_ZASADA3_NADWYZKA` (`cities.ts:515`).
        pub fn min_procent_puli_imperium_zasada3_nadwyzka() -> f64 {
            cities_params().podzial_pracy.min_pula_zasada3_nadwyzka
        }

        /// Web `PODZIAL_PRACY_PULA_LBL` (`cities.ts:535`).
        pub fn podzial_pracy_pula_lbl() -> &'static str {
            &cities_params().etykiety_podzialu_pracy.pula
        }

        /// Web `PODZIAL_PRACY_PULA_LBL_PELNA` (`cities.ts:537`).
        pub fn podzial_pracy_pula_lbl_pelna() -> &'static str {
            &cities_params().etykiety_podzialu_pracy.pula_pelna
        }

        /// Web `PODZIAL_PRACY_PULA_TIP` (`cities.ts:539`).
        pub fn podzial_pracy_pula_tip() -> &'static str {
            &cities_params().etykiety_podzialu_pracy.pula_tip
        }

        /// Web `MIN_PROCENT_PULI_IMPERIUM` (`cities.ts:543`) = calosc - maksimum budynkow.
        pub fn min_procent_puli_imperium() -> f64 {
            pct_total() - max_podzial_pracy_budynki_percent()
        }

        /// Web `DEFAULT_PROCENT_ROZWOJ` (`cities.ts:570`).
        pub fn default_procent_rozwoj() -> f64 {
            cities_params().wyzywienie.domyslny_procent_rozwoj
        }

        /// Web `DEFAULT_PROCENT_ROZWOJ_WYZYWIENIE` (`cities.ts:573`): `Math.round(DEFAULT_POZIOM_RACJI
        /// / WYZYWIENIE_MAX * 100)`; oba skladniki z `population-growth-v85.ts` (wejscie z danych).
        pub fn default_procent_rozwoj_wyzywienie() -> f64 {
            let inputs = &cities_params().wejscia_z_innych_modulow_weba;
            js_round(inputs.domyslny_poziom_racji / inputs.wyzywienie_max * pct_total())
        }

        /// Web `DEFAULT_POZIOM_RACJI` (`population-growth-v85.ts:70`), wejscie z danych.
        pub fn default_poziom_racji() -> f64 {
            cities_params()
                .wejscia_z_innych_modulow_weba
                .domyslny_poziom_racji
        }

        /// Web `WYZYWIENIE_MAX` (`population-growth-v85.ts:28`), wejscie z danych.
        pub fn wyzywienie_max() -> f64 {
            cities_params().wejscia_z_innych_modulow_weba.wyzywienie_max
        }

        /// Web `HANDEL_PCT_STEP` (`cities.ts:578`).
        pub fn handel_pct_step() -> f64 {
            cities_params().podzial_handlu.krok
        }

        /// Web `MAX_PROCENT_NAUKA` (`cities.ts:581`).
        pub fn max_procent_nauki() -> f64 {
            cities_params().podzial_handlu.max_nauka
        }

        /// Web `AI_FIXED_PROCENT_NAUKA` (`cities.ts:601`) = `MAX_PROCENT_NAUKA`.
        pub fn ai_fixed_procent_nauki() -> f64 {
            max_procent_nauki()
        }

        /// Web `MIN_CITY_DISTANCE` (`cities.ts:1120`): `data/miasto-params.json` (`min_dystans_miast`);
        /// zapasowe `?? 5` jest nieosiagalne, bo typ danych wymusza obecnosc pola.
        pub fn min_city_distance() -> f64 {
            static VALUE: std::sync::OnceLock<f64> = std::sync::OnceLock::new();
            *VALUE.get_or_init(|| {
                parse_miasto_params()
                    .expect("miasto-params.json must parse")
                    .min_dystans_miast
                    .wartosc as f64
            })
        }

        /// Web `MIN_CITY_DISTANCE_START_CITY_STATE` (`cities.ts:1122`).
        pub fn min_city_distance_start_city_state() -> f64 {
            cities_params().zakladanie.min_dystans_miasto_panstwo
        }

        // -------------------------------------------------------------------
        // Biblioteka list budowy
        // -------------------------------------------------------------------

        /// Licznik `_budowaListaSzablonSeq` (`cities.ts:82`) - w webie zmienna modulu, tu jawny stan.
        #[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
        pub struct BudowaListaIdGen {
            pub seq: u64,
        }

        impl BudowaListaIdGen {
            /// Web `newBudowaListaSzablonId` (`cities.ts:84`); `now_ms` = `Date.now()`.
            pub fn new_id(&mut self, now_ms: f64) -> String {
                self.seq += 1;
                format!(
                    "{}{}-{}",
                    cities_params().budowa.lista_szablon_id_prefiks,
                    js_number_to_string(now_ms),
                    self.seq
                )
            }
        }

        /// Web `defaultBudowaListaNazwa` (`cities.ts:90`).
        pub fn default_budowa_lista_nazwa(biblioteka: &[BudowaListaSzablon]) -> String {
            let budowa = &cities_params().budowa;
            let used: HashSet<String> = biblioteka
                .iter()
                .map(|s| js_trim(&s.nazwa).to_lowercase())
                .collect();
            let limit = budowa.lista_limit_nazw as u64;
            for i in 1..limit {
                let candidate = format!("{}{i}", budowa.lista_domyslna_nazwa_prefiks);
                if !used.contains(&candidate.to_lowercase()) {
                    return candidate;
                }
            }
            format!(
                "{}{}",
                budowa.lista_domyslna_nazwa_prefiks,
                biblioteka.len() + 1
            )
        }

        fn is_budowa_lista_szablon_item(item: &Value) -> bool {
            let Value::Object(o) = item else {
                return false;
            };
            matches!(o.get("id"), Some(Value::String(_)))
                && matches!(o.get("nazwa"), Some(Value::String(_)))
                && matches!(o.get("budynki"), Some(Value::Array(_)))
        }

        fn is_budowa_lista_szablon_array(raw: Option<&Value>) -> bool {
            match raw {
                Some(Value::Array(items)) => items.iter().all(is_budowa_lista_szablon_item),
                _ => false,
            }
        }

        fn copy_szablony(raw: &Value) -> Vec<BudowaListaSzablon> {
            let Value::Array(items) = raw else {
                return Vec::new();
            };
            items
                .iter()
                .map(|s| BudowaListaSzablon {
                    id: s["id"].as_str().unwrap_or_default().to_owned(),
                    nazwa: s["nazwa"].as_str().unwrap_or_default().to_owned(),
                    budynki: s["budynki"].as_array().cloned().unwrap_or_default(),
                })
                .collect()
        }

        /// Web `loadBudowaListaBiblioteka` (`cities.ts:119`). `meta` to `meta` z zapisu (`None` =
        /// `null`/`undefined`); `now` = `Date.now()` (wolane raz na kazdy nowy identyfikator).
        pub fn load_budowa_lista_biblioteka(
            meta: Option<&Value>,
            ids: &mut BudowaListaIdGen,
            now: &mut dyn FnMut() -> f64,
        ) -> Vec<BudowaListaSzablon> {
            let field = |name: &str| -> Option<&Value> {
                match meta {
                    Some(Value::Object(o)) => o.get(name),
                    _ => None,
                }
            };
            let raw_new = field("budowaListaBiblioteka");
            if is_budowa_lista_szablon_array(raw_new) {
                return copy_szablony(raw_new.expect("checked"));
            }
            let raw_legacy = field("budowaListaSzablony");
            if let Some(Value::Object(o)) = raw_legacy {
                let slots = &cities_params().budowa.lista_slot_legacy;
                if slots.iter().any(|s| o.contains_key(s)) {
                    let mut out = Vec::new();
                    for slot in slots {
                        if let Some(Value::Array(budynki)) = o.get(slot) {
                            if !budynki.is_empty() {
                                out.push(BudowaListaSzablon {
                                    id: ids.new_id(now()),
                                    nazwa: format!(
                                        "{}{slot}",
                                        cities_params().budowa.lista_nazwa_legacy_prefiks
                                    ),
                                    budynki: budynki.clone(),
                                });
                            }
                        }
                    }
                    return out;
                }
            }
            if is_budowa_lista_szablon_array(raw_legacy) {
                return copy_szablony(raw_legacy.expect("checked"));
            }
            Vec::new()
        }

        /// Web `dedupeBudowaLista` (`cities.ts:160`).
        pub fn dedupe_budowa_lista(budynki: &[String]) -> Vec<String> {
            let mut seen: HashSet<&str> = HashSet::new();
            let mut out = Vec::new();
            for id in budynki {
                if id.is_empty() || !seen.insert(id.as_str()) {
                    continue;
                }
                out.push(id.clone());
            }
            out
        }

        /// Web `isAutoBudowaTryb` (`cities.ts:172`).
        pub fn is_auto_budowa_tryb(t: Option<BudowaTryb>) -> bool {
            let v = t.unwrap_or_else(default_budowa_tryb);
            matches!(
                v,
                BudowaTryb::Priorytet | BudowaTryb::Lista | BudowaTryb::Zrownowazone
            )
        }

        /// Web `isBudowaTypFocus` (`cities.ts:413`).
        pub fn is_budowa_typ_focus(f: BudowaFocus) -> bool {
            f != budowa_focus_from(&cities_params().budowa.focus_bez_typu)
        }

        /// Web `sanitizeBudowaPriorytetTypow` (`cities.ts:418`).
        pub fn sanitize_budowa_priorytet_typow(list: Option<&[BudowaFocus]>) -> Vec<BudowaFocus> {
            let filtered: Vec<BudowaFocus> = list
                .unwrap_or(&[])
                .iter()
                .copied()
                .filter(|f| is_budowa_typ_focus(*f))
                .collect();
            if filtered.is_empty() {
                return default_budowa_priorytet_typow();
            }
            filtered
        }

        // -------------------------------------------------------------------
        // Procent budzetu Pracy auto-ulepszen
        // -------------------------------------------------------------------

        /// Web `clampUlepszeniaPracaPercent` (`cities.ts:257`); `None` = nie-liczba.
        pub fn clamp_ulepszenia_praca_percent(n: Option<f64>) -> f64 {
            match n {
                Some(v) if v.is_finite() => js_max(
                    0.0,
                    js_min(max_ulepszenia_praca_auto_percent(), js_round(v)),
                ),
                _ => default_ulepszenia_praca_percent(),
            }
        }

        /// Web `migrateUlepszeniaPerTurnToPercent` (`cities.ts:279`): tabela `migracja_per_turn`;
        /// wartosc spoza tabeli trafia do ostatniego wiersza (galaz `return 100` weba).
        pub fn migrate_ulepszenia_per_turn_to_percent(n: f64) -> f64 {
            let rows = &cities_params().ulepszenia.migracja_per_turn;
            rows.iter()
                .find(|row| row.per_turn == n)
                .or_else(|| rows.last())
                .expect("cities-params.json: migracja_per_turn")
                .procent
        }

        /// Web `resolveUlepszeniaPracaPercentFromRaw` (`cities.ts:291`). Wejscia `unknown` weba:
        /// `None` = nie-liczba (tylko `typeof number` i `=== 1|2|3` maja znaczenie).
        pub fn resolve_ulepszenia_praca_percent_from_raw(
            new_val: Option<f64>,
            legacy_per_turn: Option<f64>,
        ) -> f64 {
            if let Some(v) = new_val {
                return clamp_ulepszenia_praca_percent(Some(v));
            }
            if let Some(legacy) = legacy_per_turn {
                let known = cities_params()
                    .ulepszenia
                    .migracja_per_turn
                    .iter()
                    .any(|row| row.per_turn == legacy);
                if known {
                    return migrate_ulepszenia_per_turn_to_percent(legacy);
                }
            }
            default_ulepszenia_praca_percent()
        }

        // -------------------------------------------------------------------
        // Polityka auto-ulepszen
        // -------------------------------------------------------------------

        /// Web `UlepszeniaEmpirePolicy` (`cities.ts:303`). `wolno_wycinac_las` jest w typie weba
        /// `boolean`, ale kod czyta je z `??` (stare zapisy) - stad `Option`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct UlepszeniaEmpirePolicy {
            pub focus: UlepszeniaFocus,
            pub tryb: UlepszeniaTryb,
            pub only_worked: bool,
            pub praca_auto_percent: f64,
            pub wolno_wycinac_las: Option<bool>,
        }

        /// Web `freshUlepszeniaEmpirePolicy` (`cities.ts:312`).
        pub fn fresh_ulepszenia_empire_policy() -> UlepszeniaEmpirePolicy {
            UlepszeniaEmpirePolicy {
                focus: default_ulepszenia_focus(),
                tryb: default_ulepszenia_tryb(),
                only_worked: default_ulepszenia_only_worked(),
                praca_auto_percent: default_ulepszenia_praca_percent(),
                wolno_wycinac_las: Some(default_ulepszenia_wolno_wycinac_las()),
            }
        }

        /// Web `freshUlepszeniaEmpirePolicyForOwner` (`cities.ts:329`); `is_ai_improvement_owner` jest
        /// wstrzykniete (w webie parametr).
        pub fn fresh_ulepszenia_empire_policy_for_owner(
            owner_id: i64,
            is_ai_improvement_owner: &dyn Fn(i64) -> bool,
        ) -> UlepszeniaEmpirePolicy {
            let mut policy = fresh_ulepszenia_empire_policy();
            if is_ai_improvement_owner(owner_id) {
                policy.praca_auto_percent = ai_major_ulepszenia_praca_percent();
            }
            policy
        }

        /// Web `computeAiImprovementBudgetCap` (`cities.ts:339`).
        pub fn compute_ai_improvement_budget_cap(
            cumulative_praca_pool: f64,
            praca_auto_percent: f64,
        ) -> f64 {
            let bounded_percent = clamp_pct(praca_auto_percent);
            (cumulative_praca_pool * bounded_percent / pct_total()).floor()
        }

        /// Web `computeAiImprovementBudgetCapForOwner` (`cities.ts:348`).
        pub fn compute_ai_improvement_budget_cap_for_owner(
            owner_id: i64,
            cumulative_praca_pool: f64,
            is_ai_improvement_owner: &dyn Fn(i64) -> bool,
        ) -> f64 {
            let policy =
                fresh_ulepszenia_empire_policy_for_owner(owner_id, is_ai_improvement_owner);
            compute_ai_improvement_budget_cap(cumulative_praca_pool, policy.praca_auto_percent)
        }

        /// Web `EffectiveUlepszeniaSettings` (`cities.ts:358`); pole `override` weba (slowo
        /// zarezerwowane w Rust) = `is_override`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct EffectiveUlepszeniaSettings {
            pub focus: UlepszeniaFocus,
            pub tryb: UlepszeniaTryb,
            pub only_worked: bool,
            pub praca_auto_percent: f64,
            pub wolno_wycinac_las: bool,
            pub is_override: bool,
        }

        /// Web `resolveEffectiveUlepszenia` (`cities.ts:368`).
        pub fn resolve_effective_ulepszenia(
            city: &City,
            empire: &UlepszeniaEmpirePolicy,
        ) -> EffectiveUlepszeniaSettings {
            if city.ulepszenia_override == Some(true) {
                return EffectiveUlepszeniaSettings {
                    focus: city
                        .ulepszenia_focus
                        .unwrap_or_else(default_ulepszenia_focus),
                    tryb: city.ulepszenia_tryb.unwrap_or_else(default_ulepszenia_tryb),
                    only_worked: city
                        .ulepszenia_only_worked
                        .unwrap_or_else(default_ulepszenia_only_worked),
                    praca_auto_percent: clamp_ulepszenia_praca_percent(
                        city.ulepszenia_praca_percent,
                    ),
                    wolno_wycinac_las: city
                        .ulepszenia_wolno_wycinac_las
                        .unwrap_or_else(default_ulepszenia_wolno_wycinac_las),
                    is_override: true,
                };
            }
            EffectiveUlepszeniaSettings {
                focus: empire.focus,
                tryb: empire.tryb,
                only_worked: empire.only_worked,
                praca_auto_percent: empire.praca_auto_percent,
                wolno_wycinac_las: empire
                    .wolno_wycinac_las
                    .unwrap_or_else(default_ulepszenia_wolno_wycinac_las),
                is_override: false,
            }
        }

        // -------------------------------------------------------------------
        // Podzial Pracy i Handlu
        // -------------------------------------------------------------------

        /// Web `clampPodzialPracyBudynkiPercent` (`cities.ts:545`); `None` = nie-liczba.
        pub fn clamp_podzial_pracy_budynki_percent(n: Option<f64>) -> f64 {
            match n {
                Some(v) if v.is_finite() => js_max(
                    min_podzial_pracy_budynki_percent(),
                    js_min(max_podzial_pracy_budynki_percent(), js_round(v)),
                ),
                _ => default_podzial_pracy().procent_budynki,
            }
        }

        /// Web `procentPuliImperiumZBudynkow` (`cities.ts:557`).
        pub fn procent_puli_imperium_z_budynkow(procent_budynki: Option<f64>) -> f64 {
            pct_total() - clamp_podzial_pracy_budynki_percent(procent_budynki)
        }

        /// Web `podzialPracyZProcentuPuli` (`cities.ts:562`).
        pub fn podzial_pracy_z_procentu_puli(procent_puli: Option<f64>) -> CityPodzialPracy {
            let p = match procent_puli {
                Some(v) if v.is_finite() => js_max(
                    min_procent_puli_imperium(),
                    js_min(max_procent_puli_imperium(), js_round(v)),
                ),
                _ => pct_total() - default_podzial_pracy().procent_budynki,
            };
            CityPodzialPracy {
                procent_budynki: clamp_podzial_pracy_budynki_percent(Some(pct_total() - p)),
            }
        }

        /// Web `snapHandelPct` (`cities.ts:603`).
        pub fn snap_handel_pct(n: f64) -> f64 {
            let step = handel_pct_step();
            js_max(0.0, js_min(pct_total(), js_round(n / step) * step))
        }

        /// Web `normalizePodzialHandlu` (`cities.ts:608`).
        pub fn normalize_podzial_handlu(split: &CityPodzialHandlu) -> CityPodzialHandlu {
            let total = pct_total();
            let mut p = snap_handel_pct(split.procent_pieniadz);
            let mut n = snap_handel_pct(split.procent_nauka);
            let mut l = snap_handel_pct(split.procent_luksus);

            n = js_min(n, max_procent_nauki());

            let mut sum = p + n + l;
            if sum != total {
                l = clamp_pct(l + (total - sum));
                sum = p + n + l;
                if sum != total {
                    n = clamp_pct(n + (total - sum));
                    n = js_min(n, max_procent_nauki());
                    sum = p + n + l;
                    if sum != total {
                        p = clamp_pct(p + (total - sum));
                    }
                }
            }
            CityPodzialHandlu {
                procent_pieniadz: p,
                procent_nauka: n,
                procent_luksus: l,
            }
        }

        /// Web `adjustHandelSplit` (`cities.ts:640`).
        pub fn adjust_handel_split(
            current: &CityPodzialHandlu,
            changed: HandelKey,
            new_val: f64,
        ) -> CityPodzialHandlu {
            let total = pct_total();
            let step = handel_pct_step();
            let max_nauka = max_procent_nauki();
            let mut next = *current;
            let mut changed_val = snap_handel_pct(new_val);

            if changed == HandelKey::Nauka {
                changed_val = js_min(changed_val, max_nauka);
            }

            next.set(changed, changed_val);
            let keys: Vec<HandelKey> = [HandelKey::Pieniadz, HandelKey::Nauka, HandelKey::Luksus]
                .into_iter()
                .filter(|k| *k != changed)
                .collect();
            let remainder = total - next.get(changed);
            if remainder < 0.0 {
                next.set(changed, total);
                for k in &keys {
                    next.set(*k, 0.0);
                }
                return next;
            }
            let (k0, k1) = (keys[0], keys[1]);

            let nauka_key = if k0 == HandelKey::Nauka {
                Some(k0)
            } else if k1 == HandelKey::Nauka {
                Some(k1)
            } else {
                None
            };
            let non_nauka_key = if nauka_key == Some(k0) {
                Some(k1)
            } else if nauka_key == Some(k1) {
                Some(k0)
            } else {
                None
            };

            if let (Some(nk), Some(nn)) = (nauka_key, non_nauka_key) {
                if current.get(nk) >= max_nauka {
                    next.procent_nauka = js_min(max_nauka, remainder);
                    next.set(nn, js_max(0.0, remainder - next.procent_nauka));
                    return next;
                }
            }

            let sum_others = current.get(k0) + current.get(k1);
            if sum_others <= 0.0 {
                let half = js_round(remainder / 2.0 / step) * step;
                next.set(k0, half);
                next.set(k1, remainder - half);
                if k0 == HandelKey::Nauka && next.procent_nauka > max_nauka {
                    next.procent_nauka = max_nauka;
                    next.set(k1, remainder - next.procent_nauka);
                } else if k1 == HandelKey::Nauka && next.procent_nauka > max_nauka {
                    next.procent_nauka = max_nauka;
                    next.set(k0, remainder - next.procent_nauka);
                }
                next.set(k0, clamp_pct(next.get(k0)));
                next.set(k1, clamp_pct(next.get(k1)));
                return next;
            }

            let mut v0 = snap_handel_pct(remainder * current.get(k0) / sum_others);
            if v0 > remainder {
                v0 = (remainder / step).floor() * step;
            }

            if k0 == HandelKey::Nauka && v0 > max_nauka {
                v0 = max_nauka;
            }

            next.set(k0, v0);
            next.set(k1, remainder - v0);

            next.set(k0, clamp_pct(next.get(k0)));
            next.set(k1, clamp_pct(next.get(k1)));

            if k1 == HandelKey::Nauka && next.procent_nauka > max_nauka {
                next.procent_nauka = max_nauka;
                next.set(k0, remainder - next.procent_nauka);
                next.set(k0, clamp_pct(next.get(k0)));
            }

            next
        }

        fn fresh_city_podzial_pracy() -> CityPodzialPracy {
            default_podzial_pracy()
        }

        /// Wstrzykiwane zaleznosci `ensureCitySaveDefaults` lezace poza plikami tej czesci:
        /// `readCityFoodBuffer` (`economy-upkeep.ts`) i `ensureCityRationDefaults`
        /// (`population-growth-v85.ts`).
        pub struct SaveDefaultsDeps<'a> {
            pub read_city_food_buffer: &'a dyn Fn(Option<&FoodBuffer>) -> f64,
            pub ensure_city_ration_defaults: &'a mut dyn FnMut(&mut City),
        }

        /// Web `ensureCityPodzialDefaults` (`cities.ts:730`).
        pub fn ensure_city_podzial_defaults(city: &mut City) {
            if city.podzial_handlu_override == Some(true) && city.podzial_handlu.is_some() {
                let current = city.podzial_handlu.expect("checked");
                city.podzial_handlu = Some(normalize_podzial_handlu(&current));
            } else if city.podzial_handlu_override == Some(true) && city.podzial_handlu.is_none() {
                city.podzial_handlu = Some(default_podzial_handlu());
            }
            match city.podzial_pracy {
                None => city.podzial_pracy = Some(default_podzial_pracy()),
                Some(p) => {
                    city.podzial_pracy = Some(CityPodzialPracy {
                        procent_budynki: clamp_podzial_pracy_budynki_percent(Some(
                            p.procent_budynki,
                        )),
                    });
                }
            }
        }

        fn has_entries<T>(v: &Option<Vec<T>>) -> bool {
            v.as_ref().is_some_and(|x| !x.is_empty())
        }

        /// Web `ensureCitySaveDefaults` (`cities.ts:746`).
        pub fn ensure_city_save_defaults(city: &mut City, deps: &mut SaveDefaultsDeps<'_>) {
            ensure_city_podzial_defaults(city);
            if city.wealth_state.is_none() {
                city.wealth_state = Some(fresh_wealth_state());
            }
            if city.okolica_focus.is_none() {
                city.okolica_focus = Some(default_okolica_focus());
            }
            if city.okolica_tryb.is_none() {
                city.okolica_tryb = Some(default_okolica_tryb());
            }
            if city.budowa_focus.is_none() {
                city.budowa_focus = Some(default_budowa_focus());
            }
            let raw_tryb = city.budowa_tryb;
            if raw_tryb == Some(BudowaTryb::Auto) {
                city.budowa_tryb = Some(BudowaTryb::Priorytet);
                if !has_entries(&city.budowa_priorytet_typow) {
                    city.budowa_priorytet_typow =
                        Some(vec![city.budowa_focus.unwrap_or_else(default_budowa_focus)]);
                }
            } else if city.budowa_tryb.is_none() {
                city.budowa_tryb = Some(default_budowa_tryb());
            }
            let zrown = budowa_focus_from(&cities_params().budowa.focus_bez_typu);
            let raw_priorytet: Vec<BudowaFocus> =
                city.budowa_priorytet_typow.clone().unwrap_or_default();
            if city.budowa_tryb == Some(BudowaTryb::Priorytet) {
                let only_zrownowazone =
                    !raw_priorytet.is_empty() && raw_priorytet.iter().all(|f| *f == zrown);
                if only_zrownowazone {
                    city.budowa_tryb = Some(BudowaTryb::Zrownowazone);
                    city.budowa_priorytet_typow = Some(default_budowa_priorytet_typow());
                    city.budowa_focus = Some(zrown);
                } else if raw_priorytet.contains(&zrown) {
                    city.budowa_priorytet_typow = Some(sanitize_budowa_priorytet_typow(Some(
                        raw_priorytet.as_slice(),
                    )));
                }
            }
            if city.budowa_tryb == Some(BudowaTryb::Zrownowazone) {
                if !has_entries(&city.budowa_priorytet_typow) {
                    city.budowa_priorytet_typow = Some(default_budowa_priorytet_typow());
                } else {
                    let current = city.budowa_priorytet_typow.clone().unwrap_or_default();
                    city.budowa_priorytet_typow =
                        Some(sanitize_budowa_priorytet_typow(Some(current.as_slice())));
                }
                city.budowa_focus = Some(zrown);
            }
            if city.budowa_tryb == Some(BudowaTryb::Priorytet)
                && !has_entries(&city.budowa_priorytet_typow)
            {
                let seed = [city.budowa_focus.unwrap_or_else(default_budowa_focus)];
                city.budowa_priorytet_typow =
                    Some(sanitize_budowa_priorytet_typow(Some(seed.as_slice())));
            }
            if city.budowa_lista.is_none() {
                city.budowa_lista = Some(Vec::new());
            }
            if city.ulepszenia_override == Some(true) {
                if city.ulepszenia_focus.is_none() {
                    city.ulepszenia_focus = Some(default_ulepszenia_focus());
                }
                if city.ulepszenia_tryb.is_none() {
                    city.ulepszenia_tryb = Some(default_ulepszenia_tryb());
                }
                if city.ulepszenia_only_worked.is_none() {
                    city.ulepszenia_only_worked = Some(default_ulepszenia_only_worked());
                }
                if city.ulepszenia_wolno_wycinac_las.is_none() {
                    city.ulepszenia_wolno_wycinac_las =
                        Some(default_ulepszenia_wolno_wycinac_las());
                }
                city.ulepszenia_praca_percent = Some(clamp_ulepszenia_praca_percent(Some(
                    resolve_ulepszenia_praca_percent_from_raw(
                        city.ulepszenia_praca_percent,
                        city.ulepszenia_per_turn,
                    ),
                )));
            }
            let buf = (deps.read_city_food_buffer)(city.magazyn_zywnosci.as_ref());
            let unchanged =
                matches!(city.magazyn_zywnosci, Some(FoodBuffer::Number(x)) if x == buf);
            if !unchanged {
                city.magazyn_zywnosci = Some(FoodBuffer::Number(buf));
            }
            (deps.ensure_city_ration_defaults)(city);
            if city.surowce.is_none() {
                city.surowce = Some(BTreeMap::new());
            }
            if city.postep_budynkow_usuniete.is_none() {
                city.postep_budynkow_usuniete = Some(BTreeMap::new());
            }
        }

        // -------------------------------------------------------------------
        // Zakladanie miasta
        // -------------------------------------------------------------------

        /// Web `countsTowardCityFoundingLimit` (`cities.ts:1125`).
        pub fn counts_toward_city_founding_limit(founded_by_owner: Option<bool>) -> bool {
            founded_by_owner != Some(false)
        }

        /// Web `wasIndependentCityStateBeforeCapture` (`cities.ts:1157`).
        pub fn was_independent_city_state_before_capture(start_city_state: Option<bool>) -> bool {
            start_city_state == Some(true)
        }

        /// Web `hexDistance` (`units/setup.ts:354`) na liczbach f64 (`Math.max(dq, dr, ds)`).
        fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
            let dq = (aq - bq).abs();
            let dr = (ar - br).abs();
            let ds = ((-aq - ar) - (-bq - br)).abs();
            js_max(js_max(dq, dr), ds)
        }

        /// Web opcje `canFoundCity` (`cities.ts:1168`).
        #[derive(Clone, Copy, Default)]
        pub struct CanFoundCityOpts<'a> {
            pub within_territory: Option<&'a dyn Fn(f64, f64) -> bool>,
            pub founding_city_state: Option<bool>,
            pub cluster_start_slot: Option<bool>,
            pub owner_id: Option<i64>,
            pub owner_era: Option<f64>,
            /// `Some(cityLimitBase)` = obecny obiekt `gameConfig`; wewnatrz `cityLimitBase?`.
            pub game_config: Option<GameConfig>,
        }

        /// Web `gameConfig` z `canFoundCity`: `{ cityLimitBase?: number }`.
        #[derive(Debug, Clone, Copy, Default, PartialEq)]
        pub struct GameConfig {
            pub city_limit_base: Option<f64>,
        }

        /// Wynik `canFoundCity` (`{ ok, reason }`); `reason` pusty gdy `ok`.
        #[derive(Debug, Clone, PartialEq, Eq)]
        pub struct CanFoundCityResult {
            pub ok: bool,
            pub reason: String,
        }

        fn refuse(reason: &str) -> CanFoundCityResult {
            CanFoundCityResult {
                ok: false,
                reason: reason.to_owned(),
            }
        }

        /// Teren heksu o kluczu `"q,r"`: klucze mapy to napisy liczb calkowitych; liczba
        /// niecalkowita lub spoza i32 nie moze byc kluczem (ZALOZENIE, patrz dokument §7).
        fn hex_terrain_at(map: &RuchMapa, q: f64, r: f64) -> Option<RuchTeren> {
            let to_key = |x: f64| -> Option<i32> {
                if x.is_finite() && x.fract() == 0.0 && x.abs() <= f64::from(i32::MAX) {
                    Some(x as i32)
                } else {
                    None
                }
            };
            let key = (to_key(q)?, to_key(r)?);
            map.hexes.get(&key).map(|h| h.teren)
        }

        /// Web `canFoundCity` (`cities.ts:1163`).
        pub fn can_found_city(
            q: f64,
            r: f64,
            cities: &[City],
            map: &RuchMapa,
            opts: Option<&CanFoundCityOpts<'_>>,
        ) -> CanFoundCityResult {
            let founding = &cities_params().zakladanie;
            let reasons = &founding.powody;

            let Some(terrain) = hex_terrain_at(map, q, r) else {
                return refuse(&reasons.poza_mapa);
            };
            if is_water_terrain(terrain) {
                return refuse(&reasons.morze);
            }
            if terrain == RuchTeren::Gory {
                return refuse(&reasons.gory);
            }

            let cluster_start_slot = opts.and_then(|o| o.cluster_start_slot).unwrap_or(false);
            if !cluster_start_slot {
                let founding_city_state = opts.and_then(|o| o.founding_city_state).unwrap_or(false);
                for city in cities {
                    let min_dist = if founding_city_state || city.start_city_state == Some(true) {
                        min_city_distance_start_city_state()
                    } else {
                        min_city_distance()
                    };
                    if hex_distance(q, r, city.q, city.r) < min_dist {
                        return refuse(&reasons.za_blisko);
                    }
                }
            }

            if let Some(within) = opts.and_then(|o| o.within_territory) {
                if !within(q, r) {
                    return refuse(&reasons.poza_terytorium);
                }
            }

            if let Some(o) = opts {
                if let (Some(owner_id), Some(owner_era), Some(game_config)) =
                    (o.owner_id, o.owner_era, o.game_config)
                {
                    let base = game_config
                        .city_limit_base
                        .unwrap_or(founding.limit_miast_baza_zapas);
                    let era = js_max(founding.min_epoka, owner_era);
                    let limit = base + (era - founding.min_epoka) * founding.limit_miast_krok_epoka;
                    let owners_cities = cities
                        .iter()
                        .filter(|c| {
                            c.owner_id == owner_id
                                && counts_toward_city_founding_limit(c.founded_by_owner)
                        })
                        .count() as f64;
                    if owners_cities >= limit {
                        return refuse(&reasons.limit_epoka);
                    }
                }
            }

            CanFoundCityResult {
                ok: true,
                reason: String::new(),
            }
        }

        fn new_city(
            q: f64,
            r: f64,
            owner_id: i64,
            index: usize,
            name: &str,
            full: bool,
            founding_city_state: bool,
        ) -> City {
            let founding = &cities_params().zakladanie;
            let mut city = City {
                id: format!("{}{index}", founding.id_prefiks),
                owner_id,
                q,
                r,
                name: name.to_owned(),
                population: founding.startowa_populacja,
                wealth_state: Some(fresh_wealth_state()),
                wealth_immunity_remaining: Some(founding.wealth_immunitet_tur),
                podzial_handlu_override: Some(false),
                podzial_pracy: Some(fresh_city_podzial_pracy()),
                podzial_pracy_override: Some(false),
                okolica_focus_override: Some(false),
                budowa_focus_override: Some(false),
                procent_rozwoj: Some(default_procent_rozwoj_wyzywienie()),
                poziom_racji: Some(default_poziom_racji()),
                poziom_racji_override: Some(false),
                founded_by_owner: Some(true),
                ..City::default()
            };
            if full {
                city.auto_wyzywienie = Some(true);
                city.budowa_tryb = Some(budowa_tryb_from(
                    &cities_params().budowa.domyslny_tryb_nowe_miasto,
                ));
                if founding_city_state {
                    city.start_city_state = Some(true);
                }
            }
            city
        }

        /// Osadnik (pola czytane przez `foundCity`): `RuntimeUnit.{ownerId,q,r}`.
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct Settler {
            pub owner_id: i64,
            pub q: f64,
            pub r: f64,
        }

        /// Web `foundCity` (`cities.ts:1235`); `within_territory` = `opts.withinTerritory`.
        pub fn found_city(
            settler: &Settler,
            cities: &[City],
            map: &RuchMapa,
            name: &str,
            within_territory: Option<&dyn Fn(f64, f64) -> bool>,
        ) -> Option<City> {
            let opts = CanFoundCityOpts {
                within_territory,
                ..CanFoundCityOpts::default()
            };
            let check = can_found_city(settler.q, settler.r, cities, map, Some(&opts));
            if !check.ok {
                return None;
            }
            Some(new_city(
                settler.q,
                settler.r,
                settler.owner_id,
                cities.len(),
                name,
                false,
                false,
            ))
        }

        /// Web `foundCityAt` (`cities.ts:1269`); `founding_city_state` / `cluster_start_slot`
        /// domyslnie `false`.
        #[allow(clippy::too_many_arguments)]
        pub fn found_city_at(
            q: f64,
            r: f64,
            owner_id: i64,
            cities: &[City],
            map: &RuchMapa,
            name: &str,
            founding_city_state: bool,
            cluster_start_slot: bool,
        ) -> Option<City> {
            let opts = CanFoundCityOpts {
                founding_city_state: Some(founding_city_state),
                cluster_start_slot: Some(cluster_start_slot),
                ..CanFoundCityOpts::default()
            };
            let check = can_found_city(q, r, cities, map, Some(&opts));
            if !check.ok {
                return None;
            }
            Some(new_city(
                q,
                r,
                owner_id,
                cities.len(),
                name,
                true,
                founding_city_state,
            ))
        }

        /// Web `cityName` (`cities.ts:1328`, `@deprecated`). `None` odpowiada `undefined`: indeks
        /// niecalkowity z zakresu puli (`CITY_NAMES[1.5]`).
        pub fn city_name(index: f64) -> Option<String> {
            let names = &cities_params().nazwy_miast;
            if index >= 0.0 && index < names.lista.len() as f64 {
                if index.fract() != 0.0 {
                    return None;
                }
                return Some(names.lista[index as usize].clone());
            }
            Some(format!(
                "{}{}",
                names.prefiks_generyczny,
                js_number_to_string(index + 1.0)
            ))
        }

        /// Web `FoundFromVillageResult` (`cities.ts:1351`).
        #[derive(Debug, Clone, PartialEq)]
        pub enum FoundFromVillageResult {
            Ok(Box<City>),
            Err { reason: String },
        }

        /// Web `foundCityFromVillage` (`cities.ts:1374`).
        pub fn found_city_from_village(
            q: f64,
            r: f64,
            cities: &[City],
            map: &RuchMapa,
            within_territory: Option<&dyn Fn(f64, f64) -> bool>,
        ) -> FoundFromVillageResult {
            let opts = CanFoundCityOpts {
                within_territory,
                ..CanFoundCityOpts::default()
            };
            let check = can_found_city(q, r, cities, map, Some(&opts));
            if !check.ok {
                return FoundFromVillageResult::Err {
                    reason: check.reason,
                };
            }

            let name = city_name(cities.len() as f64).unwrap_or_default();
            match found_city_at(q, r, 0, cities, map, &name, false, false) {
                Some(city) => FoundFromVillageResult::Ok(Box::new(city)),
                None => FoundFromVillageResult::Err {
                    reason: cities_params().zakladanie.powody.found_city_at_null.clone(),
                },
            }
        }
    }

    pub mod empire_city_defaults {
        use crate::data::derived::cities_params;

        use super::cities::{
            clamp_podzial_pracy_budynki_percent, default_budowa_focus, default_budowa_tryb,
            default_okolica_focus, default_podzial_pracy, default_poziom_racji, BudowaFocus,
            BudowaTryb, City, CityPodzialPracy, OkolicaFocus,
        };

        /// Mapa `Map<number, V>` weba z zachowana kolejnoscia wstawiania (iteracja `Map`/`Set`
        /// w JS jest w kolejnosci wstawiania; ponowne `set` istniejacego klucza nie zmienia miejsca).
        #[derive(Debug, Clone, PartialEq)]
        pub struct OwnerMap<V> {
            entries: Vec<(i64, V)>,
        }

        impl<V> Default for OwnerMap<V> {
            fn default() -> Self {
                Self {
                    entries: Vec::new(),
                }
            }
        }

        impl<V> OwnerMap<V> {
            pub fn new() -> Self {
                Self::default()
            }

            pub fn has(&self, key: i64) -> bool {
                self.entries.iter().any(|(k, _)| *k == key)
            }

            pub fn get(&self, key: i64) -> Option<&V> {
                self.entries.iter().find(|(k, _)| *k == key).map(|(_, v)| v)
            }

            pub fn set(&mut self, key: i64, value: V) {
                match self.entries.iter_mut().find(|(k, _)| *k == key) {
                    Some(slot) => slot.1 = value,
                    None => self.entries.push((key, value)),
                }
            }

            pub fn keys(&self) -> Vec<i64> {
                self.entries.iter().map(|(k, _)| *k).collect()
            }

            pub fn len(&self) -> usize {
                self.entries.len()
            }

            pub fn is_empty(&self) -> bool {
                self.entries.is_empty()
            }

            pub fn entries(&self) -> &[(i64, V)] {
                &self.entries
            }
        }

        // ---------------------------------------------------------------
        // 1. Podzial Pracy
        // ---------------------------------------------------------------

        /// Web `podzialPracyEqual` (`empire-city-defaults.ts:59`).
        pub fn podzial_pracy_equal(a: &CityPodzialPracy, b: &CityPodzialPracy) -> bool {
            clamp_podzial_pracy_budynki_percent(Some(a.procent_budynki))
                == clamp_podzial_pracy_budynki_percent(Some(b.procent_budynki))
        }

        fn normalize_podzial_pracy(split: &CityPodzialPracy) -> CityPodzialPracy {
            CityPodzialPracy {
                procent_budynki: clamp_podzial_pracy_budynki_percent(Some(split.procent_budynki)),
            }
        }

        /// Web `resolveCityPodzialPracy` (`empire-city-defaults.ts:69`).
        pub fn resolve_city_podzial_pracy(
            city: &City,
            owner_default: Option<&CityPodzialPracy>,
            params_fallback: Option<&CityPodzialPracy>,
        ) -> CityPodzialPracy {
            if city.podzial_pracy_override == Some(true) {
                if let Some(p) = city.podzial_pracy.as_ref() {
                    return normalize_podzial_pracy(p);
                }
            }
            if let Some(d) = owner_default {
                return normalize_podzial_pracy(d);
            }
            if let Some(p) = city.podzial_pracy.as_ref() {
                return normalize_podzial_pracy(p);
            }
            normalize_podzial_pracy(
                &params_fallback
                    .copied()
                    .unwrap_or_else(default_podzial_pracy),
            )
        }

        /// Web `PodzialPracyLocalChange` (`empire-city-defaults.ts:101`).
        #[derive(Debug, Clone, Copy, PartialEq)]
        pub struct PodzialPracyLocalChange {
            pub podzial_pracy: Option<CityPodzialPracy>,
            pub podzial_pracy_override: bool,
        }

        /// Web `applyPodzialPracyLocalChange` (`empire-city-defaults.ts:108`).
        pub fn apply_podzial_pracy_local_change(
            procent_budynki_raw: Option<f64>,
            owner_default: Option<&CityPodzialPracy>,
        ) -> PodzialPracyLocalChange {
            let procent_budynki = clamp_podzial_pracy_budynki_percent(procent_budynki_raw);
            let globalny = clamp_podzial_pracy_budynki_percent(Some(
                owner_default
                    .map(|d| d.procent_budynki)
                    .unwrap_or(default_podzial_pracy().procent_budynki),
            ));
            if procent_budynki == globalny {
                return PodzialPracyLocalChange {
                    podzial_pracy: None,
                    podzial_pracy_override: false,
                };
            }
            PodzialPracyLocalChange {
                podzial_pracy: Some(CityPodzialPracy { procent_budynki }),
                podzial_pracy_override: true,
            }
        }

        /// Web `migratePodzialPracyOnLoad` (`empire-city-defaults.ts:123`).
        pub fn migrate_podzial_pracy_on_load(
            cities: &mut [City],
            owner_defaults: &mut OwnerMap<CityPodzialPracy>,
            saved_defaults: Option<&[(i64, CityPodzialPracy)]>,
        ) {
            match saved_defaults.filter(|s| !s.is_empty()) {
                Some(saved) => {
                    for (oid, split) in saved {
                        owner_defaults.set(*oid, normalize_podzial_pracy(split));
                    }
                }
                None => {
                    for city in cities.iter() {
                        if !owner_defaults.has(city.owner_id) {
                            let seed = city.podzial_pracy.unwrap_or_else(default_podzial_pracy);
                            owner_defaults.set(city.owner_id, normalize_podzial_pracy(&seed));
                        }
                    }
                    for city in cities.iter_mut() {
                        if city.podzial_pracy_override.is_some() {
                            continue;
                        }
                        let def = owner_defaults
                            .get(city.owner_id)
                            .copied()
                            .unwrap_or_else(default_podzial_pracy);
                        let Some(current) = city.podzial_pracy else {
                            city.podzial_pracy_override = Some(false);
                            continue;
                        };
                        let normalized = normalize_podzial_pracy(&current);
                        city.podzial_pracy = Some(normalized);
                        let differs = !podzial_pracy_equal(&normalized, &def);
                        city.podzial_pracy_override = Some(differs);
                        if !differs {
                            city.podzial_pracy = None;
                        }
                    }
                }
            }
            for city in cities.iter_mut() {
                if let Some(p) = city.podzial_pracy {
                    city.podzial_pracy = Some(normalize_podzial_pracy(&p));
                }
            }
            for city in cities.iter() {
                if !owner_defaults.has(city.owner_id) {
                    owner_defaults.set(
                        city.owner_id,
                        normalize_podzial_pracy(&default_podzial_pracy()),
                    );
                }
            }
        }

        /// Web `freshOwnerDefaultPodzialPracy` (`empire-city-defaults.ts:182`).
        pub fn fresh_owner_default_podzial_pracy() -> CityPodzialPracy {
            default_podzial_pracy()
        }

        // ---------------------------------------------------------------
        // 2. Priorytet Praca/Zywnosc (okolicaFocus)
        // ---------------------------------------------------------------

        /// Web `resolveCityOkolicaFocus` (`empire-city-defaults.ts:192`).
        pub fn resolve_city_okolica_focus(
            city: &City,
            owner_default: Option<OkolicaFocus>,
        ) -> OkolicaFocus {
            if city.okolica_focus_override == Some(true) {
                if let Some(f) = city.okolica_focus {
                    return f;
                }
            }
            owner_default
                .or(city.okolica_focus)
                .unwrap_or_else(default_okolica_focus)
        }

        /// Web `broadcastOkolicaFocusToOwnerCities` (`empire-city-defaults.ts:207`).
        pub fn broadcast_okolica_focus_to_owner_cities(
            cities: &mut [City],
            owner_id: i64,
            focus: OkolicaFocus,
        ) {
            for c in cities.iter_mut() {
                if c.owner_id != owner_id || c.okolica_focus_override == Some(true) {
                    continue;
                }
                c.okolica_focus = Some(focus);
            }
        }

        /// Web `migrateOkolicaFocusOnLoad` (`empire-city-defaults.ts:219`).
        pub fn migrate_okolica_focus_on_load(
            cities: &mut [City],
            owner_defaults: &mut OwnerMap<OkolicaFocus>,
            saved_defaults: Option<&[(i64, OkolicaFocus)]>,
        ) {
            match saved_defaults.filter(|s| !s.is_empty()) {
                Some(saved) => {
                    for (oid, focus) in saved {
                        owner_defaults.set(*oid, *focus);
                    }
                }
                None => {
                    for city in cities.iter() {
                        if !owner_defaults.has(city.owner_id) {
                            owner_defaults.set(
                                city.owner_id,
                                city.okolica_focus.unwrap_or_else(default_okolica_focus),
                            );
                        }
                    }
                    for city in cities.iter_mut() {
                        if city.okolica_focus_override.is_some() {
                            continue;
                        }
                        let def = owner_defaults
                            .get(city.owner_id)
                            .copied()
                            .unwrap_or_else(default_okolica_focus);
                        let differs = city.okolica_focus.is_some_and(|f| f != def);
                        city.okolica_focus_override = Some(differs);
                        if !differs {
                            city.okolica_focus = Some(def);
                        }
                    }
                }
            }
            for city in cities.iter() {
                if !owner_defaults.has(city.owner_id) {
                    owner_defaults.set(city.owner_id, default_okolica_focus());
                }
            }
        }

        /// Web `freshOwnerDefaultOkolicaFocus` (`empire-city-defaults.ts:250`).
        pub fn fresh_owner_default_okolica_focus() -> OkolicaFocus {
            default_okolica_focus()
        }

        // ---------------------------------------------------------------
        // 3. Priorytet produkcji (budowaFocus + budowaTryb)
        // ---------------------------------------------------------------

        /// Web `CityBudowaProfil` (`empire-city-defaults.ts:261`).
        #[derive(Debug, Clone, Copy, PartialEq, Eq)]
        pub struct CityBudowaProfil {
            pub budowa_focus: BudowaFocus,
            pub budowa_tryb: BudowaTryb,
        }

        /// Web `budowaProfilEqual` (`empire-city-defaults.ts:266`).
        pub fn budowa_profil_equal(a: &CityBudowaProfil, b: &CityBudowaProfil) -> bool {
            a.budowa_focus == b.budowa_focus && a.budowa_tryb == b.budowa_tryb
        }

        /// Web `resolveCityBudowaProfil` (`empire-city-defaults.ts:270`).
        pub fn resolve_city_budowa_profil(
            city: &City,
            owner_default: Option<&CityBudowaProfil>,
        ) -> CityBudowaProfil {
            if city.budowa_focus_override == Some(true) {
                if let (Some(focus), Some(tryb)) = (city.budowa_focus, city.budowa_tryb) {
                    return CityBudowaProfil {
                        budowa_focus: focus,
                        budowa_tryb: tryb,
                    };
                }
            }
            if let Some(d) = owner_default {
                return *d;
            }
            CityBudowaProfil {
                budowa_focus: city.budowa_focus.unwrap_or_else(default_budowa_focus),
                budowa_tryb: city.budowa_tryb.unwrap_or_else(default_budowa_tryb),
            }
        }

        /// Web `broadcastBudowaProfilToOwnerCities` (`empire-city-defaults.ts:290`).
        pub fn broadcast_budowa_profil_to_owner_cities(
            cities: &mut [City],
            owner_id: i64,
            profil: &CityBudowaProfil,
        ) {
            for c in cities.iter_mut() {
                if c.owner_id != owner_id || c.budowa_focus_override == Some(true) {
                    continue;
                }
                c.budowa_focus = Some(profil.budowa_focus);
                c.budowa_tryb = Some(profil.budowa_tryb);
            }
        }

        /// Web `migrateBudowaProfilOnLoad` (`empire-city-defaults.ts:303`).
        pub fn migrate_budowa_profil_on_load(
            cities: &mut [City],
            owner_defaults: &mut OwnerMap<CityBudowaProfil>,
            saved_defaults: Option<&[(i64, CityBudowaProfil)]>,
        ) {
            match saved_defaults.filter(|s| !s.is_empty()) {
                Some(saved) => {
                    for (oid, profil) in saved {
                        owner_defaults.set(*oid, *profil);
                    }
                }
                None => {
                    for city in cities.iter() {
                        if !owner_defaults.has(city.owner_id) {
                            owner_defaults.set(
                                city.owner_id,
                                CityBudowaProfil {
                                    budowa_focus: city
                                        .budowa_focus
                                        .unwrap_or_else(default_budowa_focus),
                                    budowa_tryb: city
                                        .budowa_tryb
                                        .unwrap_or_else(default_budowa_tryb),
                                },
                            );
                        }
                    }
                    for city in cities.iter_mut() {
                        if city.budowa_focus_override.is_some() {
                            continue;
                        }
                        let def = owner_defaults
                            .get(city.owner_id)
                            .copied()
                            .unwrap_or_else(fresh_owner_default_budowa_profil);
                        let (Some(focus), Some(tryb)) = (city.budowa_focus, city.budowa_tryb)
                        else {
                            city.budowa_focus_override = Some(false);
                            continue;
                        };
                        let differs = !budowa_profil_equal(
                            &CityBudowaProfil {
                                budowa_focus: focus,
                                budowa_tryb: tryb,
                            },
                            &def,
                        );
                        city.budowa_focus_override = Some(differs);
                        if !differs {
                            city.budowa_focus = Some(def.budowa_focus);
                            city.budowa_tryb = Some(def.budowa_tryb);
                        }
                    }
                }
            }
            for city in cities.iter() {
                if !owner_defaults.has(city.owner_id) {
                    owner_defaults.set(city.owner_id, fresh_owner_default_budowa_profil());
                }
            }
        }

        /// Web `freshOwnerDefaultBudowaProfil` (`empire-city-defaults.ts:342`).
        pub fn fresh_owner_default_budowa_profil() -> CityBudowaProfil {
            CityBudowaProfil {
                budowa_focus: default_budowa_focus(),
                budowa_tryb: default_budowa_tryb(),
            }
        }

        /// Web `AI_DEFAULT_BUDOWA_TRYB` (`empire-city-defaults.ts:354`).
        pub fn ai_default_budowa_tryb() -> BudowaTryb {
            BudowaTryb::from_web(&cities_params().budowa.domyslny_tryb_ai)
                .expect("cities-params.json: budowa domyslny_tryb_ai")
        }

        /// Web `freshOwnerDefaultBudowaProfilForOwner` (`empire-city-defaults.ts:392`);
        /// `is_barbarian_owner` jest wstrzykniete (w webie parametr).
        pub fn fresh_owner_default_budowa_profil_for_owner(
            owner_id: i64,
            is_barbarian_owner: &dyn Fn(i64) -> bool,
        ) -> CityBudowaProfil {
            if owner_id < 0 || is_barbarian_owner(owner_id) {
                return fresh_owner_default_budowa_profil();
            }
            CityBudowaProfil {
                budowa_focus: default_budowa_focus(),
                budowa_tryb: ai_default_budowa_tryb(),
            }
        }

        /// Web `upgradeBudowaProfilAutoDefaultsOnLoad` (`empire-city-defaults.ts:437`). Wlasciciel 0
        /// (gracz) jest pomijany (ratyfikacja 2026-09-05, w webie literalne `oid === 0`).
        pub fn upgrade_budowa_profil_auto_defaults_on_load(
            cities: &mut [City],
            owner_defaults: &mut OwnerMap<CityBudowaProfil>,
            is_barbarian_owner: &dyn Fn(i64) -> bool,
        ) -> Vec<i64> {
            let mut owners: Vec<i64> = owner_defaults.keys();
            for c in cities.iter() {
                if !owners.contains(&c.owner_id) {
                    owners.push(c.owner_id);
                }
            }
            let mut upgraded = Vec::new();
            for oid in owners {
                if oid < 0 || is_barbarian_owner(oid) {
                    continue;
                }
                if oid == 0 {
                    continue;
                }
                let cur = owner_defaults.get(oid).copied();
                if let Some(c) = cur {
                    if c.budowa_tryb != default_budowa_tryb() {
                        continue;
                    }
                }
                let next = CityBudowaProfil {
                    budowa_focus: cur
                        .map(|c| c.budowa_focus)
                        .unwrap_or_else(default_budowa_focus),
                    budowa_tryb: ai_default_budowa_tryb(),
                };
                owner_defaults.set(oid, next);
                broadcast_budowa_profil_to_owner_cities(cities, oid, &next);
                upgraded.push(oid);
            }
            upgraded
        }

        // ---------------------------------------------------------------
        // 4. Zywnosc (poziom Wyzywienia/Racji)
        // ---------------------------------------------------------------

        /// Web `resolveCityPoziomRacji` (`empire-city-defaults.ts:479`).
        pub fn resolve_city_poziom_racji(city: &City, owner_default: Option<f64>) -> f64 {
            if city.poziom_racji_override == Some(true) {
                if let Some(p) = city.poziom_racji {
                    return p;
                }
            }
            owner_default
                .or(city.poziom_racji)
                .unwrap_or_else(default_poziom_racji)
        }

        /// Web `broadcastPoziomRacjiToOwnerCities` (`empire-city-defaults.ts:494`).
        pub fn broadcast_poziom_racji_to_owner_cities(
            cities: &mut [City],
            owner_id: i64,
            poziom: f64,
        ) {
            for c in cities.iter_mut() {
                if c.owner_id != owner_id || c.poziom_racji_override == Some(true) {
                    continue;
                }
                c.poziom_racji = Some(poziom);
            }
        }

        /// Web `broadcastAutoWyzywienieToOwnerCities` (`empire-city-defaults.ts:511`).
        pub fn broadcast_auto_wyzywienie_to_owner_cities(cities: &mut [City], owner_id: i64) {
            for c in cities.iter_mut() {
                if c.owner_id != owner_id || c.poziom_racji_override == Some(true) {
                    continue;
                }
                c.auto_wyzywienie = Some(true);
            }
        }

        /// Web `migratePoziomRacjiOnLoad` (`empire-city-defaults.ts:522`).
        pub fn migrate_poziom_racji_on_load(
            cities: &mut [City],
            owner_defaults: &mut OwnerMap<f64>,
            saved_defaults: Option<&[(i64, f64)]>,
        ) {
            match saved_defaults.filter(|s| !s.is_empty()) {
                Some(saved) => {
                    for (oid, poziom) in saved {
                        owner_defaults.set(*oid, *poziom);
                    }
                }
                None => {
                    for city in cities.iter() {
                        if !owner_defaults.has(city.owner_id) {
                            owner_defaults.set(
                                city.owner_id,
                                city.poziom_racji.unwrap_or_else(default_poziom_racji),
                            );
                        }
                    }
                    for city in cities.iter_mut() {
                        if city.poziom_racji_override.is_some() {
                            continue;
                        }
                        let def = owner_defaults
                            .get(city.owner_id)
                            .copied()
                            .unwrap_or_else(default_poziom_racji);
                        let differs = city.poziom_racji.is_some_and(|p| p != def);
                        city.poziom_racji_override = Some(differs);
                        if !differs {
                            city.poziom_racji = Some(def);
                        }
                    }
                }
            }
            for city in cities.iter() {
                if !owner_defaults.has(city.owner_id) {
                    owner_defaults.set(city.owner_id, default_poziom_racji());
                }
            }
        }

        /// Web `freshOwnerDefaultPoziomRacji` (`empire-city-defaults.ts:552`).
        pub fn fresh_owner_default_poziom_racji() -> f64 {
            default_poziom_racji()
        }
    }
}
