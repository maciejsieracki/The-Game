//! R-RUSTPORT-P6-POWER-ARMIA-TERYTORIUM-Q1: producenci skladnikow `armia` i `terytorium`
//! `computeObjectivePower` (web pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75).
//!
//! Zrodla web (wykonywane przez tests/p6_power_army_gen.mjs, nie reczne):
//! - `gra/src/game/unit-power.ts` `armyFieldPower` (M_pole do sumy armii): obleznicze = 0; cache
//!   `fieldPower` z units.json uzywany tylko gdy mnoznik pocisku `rangedDamageMultFor` == 1, inaczej
//!   `fieldPower()` liczone na zywo. Port: `army_field_power`.
//! - `gra/src/main.ts` `sumArmyMForOwner`: suma `armyFieldPower(unitDefFor(u))` po jednostkach wlasciciela,
//!   z pominieciem `osadnik` gdy opcja `liczyOsadnikWArmii` == false. Port: `sum_army_m_for_owner`.
//! - `gra/src/main.ts` `countTerritoryHexes(statsTerritoryNodesForOwner(owner))`: liczba ISTNIEJACYCH heksow
//!   w sumie dyskow promieni `cityTerritoryRadius` wezlow wlasciciela (miasta + niezbuntowane forty/posterunki).
//!   Port: `territory_hexes_for_owner`.
//!
//! Semantyka kandydata `domain/territory.rs::collect_territory_hex_keys_by_owner` (range-hexes.ts:28)
//! NIE jest tym skladnikiem: przypisuje kazdy heks JEDNEMU wlascicielowi (`territory_owner_at`, rozstrzyganie
//! sporu), a web `heksyTerytorium` liczy unie dyskow wlasnych wezlow bez rozstrzygania sporow z cudzymi.
//! Dlatego nie jest uzywany jako producent.
//!
//! Wolajacy (W8 r3) musi podac: `count_settlers` (web `liczyOsadnikWArmii`; w power-params.json wartosc
//! `true`, opcja legacy), liste jednostek z definicja po `unitDefFor` (ten modul nie robi veteran/replace),
//! miasta i forty stanu. Ten modul NIE jest jeszcze podlaczony do `brake_power_producers::COMPONENT_SOURCES`.

use std::collections::BTreeSet;
use std::sync::OnceLock;

use super::terrain::{city_territory_radius, founding_nodes_for_owner, CityNode, FortNode};
use super::unit_power::{field_power, ranged_damage_mult_for, UnitPowerCoeffs, UnitPowerInput};
use crate::data::units_combat::UnitRecord;

/// Web `isSiegeUnit`: `'Rola (linia)' === 'Oblężnicza'` (dokladne dopasowanie, bez trim).
pub fn is_siege_unit(rola_linia: Option<&str>) -> bool {
    rola_linia == Some("Oblężnicza")
}

/// Wejscie `armyFieldPower` dla jednej definicji jednostki.
#[derive(Debug, Clone, PartialEq)]
pub struct ArmyUnitDef {
    /// Statystyki `fieldPower` (w tym `typ`/`jednostka` dla mnoznika pocisku).
    pub power: UnitPowerInput,
    /// Web `Rola (linia)`.
    pub rola_linia: Option<String>,
    /// Web `fieldPower` z cache units.json; `None` = brak pola.
    pub field_power_cache: Option<f64>,
}

impl ArmyUnitDef {
    /// Definicja z rekordu units.json (bez veteran/unit-replace; wolajacy odpowiada za `unitDefFor`).
    pub fn from_unit_record(rec: &UnitRecord) -> Self {
        Self {
            power: UnitPowerInput {
                melee_attack: rec.melee_attack as f64,
                melee_defence: rec.melee_defence as f64,
                weapon_damage: rec.weapon_damage as f64,
                piercing: rec.piercing.unwrap_or(0) as f64,
                armor: rec.armor.unwrap_or(0) as f64,
                charge_bonus: rec.charge_bonus.unwrap_or(0) as f64,
                health: rec.health_lc as f64,
                missile_attack: rec.missile_attack as f64,
                typ: Some(rec.typ.clone()),
                jednostka: Some(rec.jednostka.clone()),
            },
            rola_linia: Some(rec.rola_linia.clone()),
            field_power_cache: Some(rec.field_power),
        }
    }
}

/// Web `armyFieldPower(u, coeff?)` (unit-power.ts): M_pole jednostki do sumy armii.
pub fn army_field_power(def: &ArmyUnitDef, c: &UnitPowerCoeffs) -> f64 {
    if is_siege_unit(def.rola_linia.as_deref()) {
        return 0.0;
    }
    if let Some(cache) = def.field_power_cache {
        let mult = ranged_damage_mult_for(def.power.typ.as_deref(), def.power.jednostka.as_deref());
        if cache.is_finite() && mult == 1.0 {
            return cache;
        }
    }
    field_power(&def.power, c).total
}

/// Jednostka na mapie dla sumy armii (web `units[]`: `ownerId`, `category`, definicja).
#[derive(Debug, Clone, PartialEq)]
pub struct ArmyUnit {
    pub owner_id: i64,
    /// Web `category === 'osadnik'`.
    pub is_settler: bool,
    pub def: ArmyUnitDef,
}

/// Web `sumArmyMForOwner` (main.ts): suma M_pole armii wlasciciela. Kolejnosc sumowania = kolejnosc `units`.
pub fn sum_army_m_for_owner(
    units: &[ArmyUnit],
    owner_id: i64,
    count_settlers: bool,
    c: &UnitPowerCoeffs,
) -> f64 {
    let mut sum = 0.0;
    for u in units {
        if u.owner_id != owner_id {
            continue;
        }
        if !count_settlers && u.is_settler {
            continue;
        }
        sum += army_field_power(&u.def, c);
    }
    sum
}

/// Wspolczynniki z combat-params.json (raz, jak web `loadUnitPowerCoeffs()` z domyslnym argumentem).
fn default_coeffs() -> &'static UnitPowerCoeffs {
    static COEFFS: OnceLock<UnitPowerCoeffs> = OnceLock::new();
    COEFFS.get_or_init(UnitPowerCoeffs::from_params)
}

/// Producent `armia` (skladnik `computeObjectivePower.jednostki` = web `sumArmyMForOwner`).
pub fn armia_for_owner(units: &[ArmyUnit], owner_id: i64, count_settlers: bool) -> f64 {
    sum_army_m_for_owner(units, owner_id, count_settlers, default_coeffs())
}

/// Miasto wejsciowe dla terytorium (web `cityNodesForOwner`: `q`, `r`, `population`, wlasciciel).
#[derive(Debug, Clone, PartialEq)]
pub struct TerritoryCityInput {
    pub q: i32,
    pub r: i32,
    pub population: f64,
    pub owner_id: i64,
}

/// Web `hexKeysWithinRadiusRaw` (okolica.ts): wspolrzedne dysku hex; promien niefinityczny lub <= 0 -> 0.
fn hex_disk(cq: i32, cr: i32, rad: f64) -> Vec<(i32, i32)> {
    let r = if rad.is_finite() && rad > 0.0 {
        rad.floor() as i32
    } else {
        0
    };
    let mut out = Vec::new();
    for dq in -r..=r {
        let lo = (-r).max(-dq - r);
        let hi = r.min(-dq + r);
        for dr in lo..=hi {
            out.push((cq + dq, cr + dr));
        }
    }
    out
}

/// Web `countTerritoryHexesRaw` (main.ts): liczba istniejacych heksow w unii dyskow promieni wezlow.
/// `hex_exists` = web `map.hexes[key]` truthy. Pusta lista wezlow -> 0 (web `countTerritoryHexes`).
pub fn count_territory_hexes(nodes: &[CityNode], hex_exists: &dyn Fn(i32, i32) -> bool) -> usize {
    if nodes.is_empty() {
        return 0;
    }
    let mut seen: BTreeSet<(i32, i32)> = BTreeSet::new();
    for node in nodes {
        for (q, r) in hex_disk(node.q, node.r, city_territory_radius(node)) {
            if hex_exists(q, r) {
                seen.insert((q, r));
            }
        }
    }
    seen.len()
}

/// Web `countTerritoryHexes(statsTerritoryNodesForOwner(ownerId))`: wezly = miasta wlasciciela
/// (`CityNode::city`, jak web `cityNodesForOwner`) + wlasne nie-bezuzyteczne forty/posterunki.
pub fn territory_hexes_for_owner(
    owner_id: i64,
    cities: &[TerritoryCityInput],
    forts: &[FortNode],
    hex_exists: &dyn Fn(i32, i32) -> bool,
) -> usize {
    let own: Vec<CityNode> = cities
        .iter()
        .filter(|c| c.owner_id == owner_id)
        .map(|c| CityNode::city(c.q, c.r, c.population))
        .collect();
    let nodes = founding_nodes_for_owner(owner_id, &own, forts);
    count_territory_hexes(&nodes, hex_exists)
}

/// Producent `terytorium` (skladnik `computeObjectivePower.heksyTerytorium`).
pub fn terytorium_for_owner(
    cities: &[TerritoryCityInput],
    forts: &[FortNode],
    owner_id: i64,
    hex_exists: &dyn Fn(i32, i32) -> bool,
) -> f64 {
    territory_hexes_for_owner(owner_id, cities, forts, hex_exists) as f64
}
