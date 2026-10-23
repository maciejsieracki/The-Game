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
