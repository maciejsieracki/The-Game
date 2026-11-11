//! P6-POWER-PRODUCERS (Q1): producenci skladnikow `computeObjectivePower` z danych stanu Rust.
//!
//! Web (pin 07d2fbd72, `gra/src/main.ts` `buildObjectivePowerForOwner`) buduje `EmpirePowerRaw` z
//! miast i stanu imperium. Ten modul porta tylko te skladniki, dla ktorych istnieje semantycznie
//! zgodny producent w Rust (funkcje czyste na `ManpowerCity` / `PressureCity`), i wpisuje je do
//! `ObjectivePowerRaw`. Pozostale skladniki NIE maja producenta w tej rundzie - patrz
//! `COMPONENT_SOURCES` (jawny brak, zadnych cichych zer ani domyslnych wartosci).
//!
//! Wektory: tests/p6_power_producers_vectors/vectors.json (generator tests/p6_power_producers_gen.mjs
//! wykonuje wyciete funkcje z pinu 07d2fbd72).

use super::brake_power::ObjectivePowerRaw;
use super::order_effects_culture::{empire_culture_total, PressureCity};
use super::recruitment::manpower::{
    empire_pobor_totals, empire_suma_ludkow, rekrut_unit_equivalents, ManpowerCity,
};

/// Zrodlo skladnika `computeObjectivePower` (klucz = web `breakdown.key`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ComponentSource {
    /// Producent w tym module (funkcja czysta na stanie Rust).
    RustProducer(&'static str),
    /// Brak producenta w Rust w tej rundzie: wejscie wolajacego (W8 r3) albo osobny temat.
    NoProducer(&'static str),
}

/// Tabela pokrycia 12 skladnikow web `computeObjectivePower` (NIE_ZMIERZONO tam, gdzie brak producenta).
pub const COMPONENT_SOURCES: [(&str, ComponentSource); 12] = [
    (
        "armia",
        ComponentSource::NoProducer("web sumArmyMForOwner (suma M_pole); armyFieldPower nieportowane (unit_power.rs); Rust army_m (diplomacy_truce_flow.rs) to pole stubu trait, NIE producent"),
    ),
    (
        "bitwy",
        ComponentSource::NoProducer("web battlePowerPtsByOwner (akumulator z walk); brak producenta z PlayableState"),
    ),
    ("ludki", ComponentSource::RustProducer("recruitment::manpower::empire_suma_ludkow")),
    (
        "rekruci",
        ComponentSource::RustProducer("recruitment::manpower::empire_pobor_totals + rekrut_unit_equivalents"),
    ),
    ("miasta", ComponentSource::RustProducer("liczba miast wlasciciela (owner_city_ids)")),
    (
        "terytorium",
        ComponentSource::NoProducer("web countTerritoryHexes(statsTerritoryNodesForOwner) = foundingNodesForOwner + cityTerritoryRadius; kandydat territory.rs::collect_territory_hex_keys_by_owner NIE zweryfikowany semantycznie"),
    ),
    (
        "infra",
        ComponentSource::NoProducer("web countBuildingsForOwner (cityBuilt); brak producenta z PlayableState"),
    ),
    (
        "tech",
        ComponentSource::NoProducer("web countTechForOwner (ownerResearchedTechs / aiResearchDone); brak producenta"),
    ),
    (
        "ulepszenia",
        ComponentSource::NoProducer("web countImprovementsForOwner (territory nodes + hex improvements); brak producenta"),
    ),
    ("kultura", ComponentSource::RustProducer("order_effects_culture::empire_culture_total")),
    (
        "religia",
        ComponentSource::NoProducer("web countCitiesWithDominantStateReligion; Rust ma dominant_religion, bez zweryfikowanej rownowaznosci"),
    ),
    (
        "zdobycze",
        ComponentSource::NoProducer("web zdobyczePowerByOwner (trwaly bonus po eliminacji); brak producenta w Rust"),
    ),
];

/// Klucze skladnikow bez producenta (`NoProducer`). Wolajacy (W8 r3) musi podac je jawnie w `ObjectivePowerRaw`.
pub fn no_producer_keys() -> Vec<&'static str> {
    COMPONENT_SOURCES
        .iter()
        .filter_map(|(k, s)| match s {
            ComponentSource::NoProducer(_) => Some(*k),
            ComponentSource::RustProducer(_) => None,
        })
        .collect()
}

/// Producent `empireSumaLudkow` (web manpower.ts:574): suma `clampLudki(population)` miast wlasciciela.
pub fn ludki_for_owner(cities: &[ManpowerCity], owner_id: i64) -> f64 {
    empire_suma_ludkow(cities, owner_id)
}

/// Producent `rekruci` (web main.ts: `rekrutUnitEquivalents(pobor.rekruci, epoka, mpMults.costMult)`).
/// Pula rekrutow liczona z `maxMult` (web `empirePoborTotals`), ekwiwalent jednostek z `costMult`.
pub fn rekruci_ekw_for_owner(
    cities: &[ManpowerCity],
    owner_id: i64,
    epoka: f64,
    max_mult: f64,
    cost_mult: f64,
) -> f64 {
    let pobor = empire_pobor_totals(cities, owner_id, epoka, max_mult);
    rekrut_unit_equivalents(pobor.rekruci, epoka, cost_mult)
}

/// Producent `miasta` (web main.ts: `ownerCities.length`).
pub fn miasta_for_owner(city_owner_ids: &[i64], owner_id: i64) -> f64 {
    city_owner_ids.iter().filter(|&&o| o == owner_id).count() as f64
}

/// Producent `kultura` (web `empireCultureTotal`, culture-religion.ts:1370).
pub fn kultura_for_owner(cities: &[PressureCity], owner_id: i64) -> f64 {
    empire_culture_total(cities, owner_id)
}

/// Skladniki z producentow dla jednego wlasciciela.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ProducedComponents {
    pub suma_ludkow: f64,
    pub rekrut_ekw: f64,
    pub miasta: f64,
    pub kultura_imperium: f64,
}

/// Wejscia producentow: miasta manpower/kultura oraz liczba miast (owner ids) i parametry epoki.
#[derive(Debug, Clone, Copy)]
pub struct ProducerInputs<'a> {
    pub manpower_cities: &'a [ManpowerCity],
    pub pressure_cities: &'a [PressureCity],
    pub city_owner_ids: &'a [i64],
    pub epoka: f64,
    pub max_mult: f64,
    pub cost_mult: f64,
}

/// Uruchamia wszystkie producenty z tabeli `RustProducer` dla wlasciciela.
pub fn produce_for_owner(inputs: &ProducerInputs<'_>, owner_id: i64) -> ProducedComponents {
    ProducedComponents {
        suma_ludkow: ludki_for_owner(inputs.manpower_cities, owner_id),
        rekrut_ekw: rekruci_ekw_for_owner(
            inputs.manpower_cities,
            owner_id,
            inputs.epoka,
            inputs.max_mult,
            inputs.cost_mult,
        ),
        miasta: miasta_for_owner(inputs.city_owner_ids, owner_id),
        kultura_imperium: kultura_for_owner(inputs.pressure_cities, owner_id),
    }
}

/// Wpisuje wyniki producentow do `ObjectivePowerRaw`. Pola bez producenta (`NoProducer`) zostaja
/// nietkniete - wolajacy ustawia je jawnie.
pub fn apply_produced(raw: &mut ObjectivePowerRaw, produced: &ProducedComponents) {
    raw.suma_ludkow = produced.suma_ludkow;
    raw.rekrut_ekw = produced.rekrut_ekw;
    raw.miasta = produced.miasta;
    raw.kultura_imperium = Some(produced.kultura_imperium);
}
