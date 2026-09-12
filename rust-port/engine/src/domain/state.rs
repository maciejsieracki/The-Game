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
