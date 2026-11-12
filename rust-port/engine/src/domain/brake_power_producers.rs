//! P6-POWER-PRODUCERS (Q1): producenci skladnikow `computeObjectivePower` z danych stanu Rust.
//!
//! Web (pin 07d2fbd72, `gra/src/main.ts` `buildObjectivePowerForOwner`) buduje `EmpirePowerRaw` z
//! miast i stanu imperium. Ten modul porta tylko te skladniki, dla ktorych istnieje semantycznie
//! zgodny producent w Rust (funkcje czyste na `ManpowerCity` / `PressureCity`), i wpisuje je do
//! `ObjectivePowerRaw` (`apply_produced`). Tabela `COMPONENT_SOURCES` opisuje stan WSZYSTKICH 12
//! skladnikow: `RustProducer` = funkcja czysta istnieje w Rust i jest sprawdzona wektorami z pinu;
//! `NoProducer` = brak producenta (jawny powod, zadnych cichych zer ani domyslnych wartosci).
//! Uwaga: `RustProducer` spoza `produce_for_owner` (armia, terytorium, infra, tech, religia) NIE jest
//! wpisywane przez `apply_produced` - wolajacy podaje je w `ObjectivePowerRaw` z tej funkcji (W8).
//!
//! Wektory: tests/p6_power_producers_vectors/vectors.json (generator tests/p6_power_producers_gen.mjs
//! wykonuje wyciete funkcje z pinu 07d2fbd72).

use super::brake_power::{Component, ObjectivePowerRaw};
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
/// Kolejnosc = kolejnosc tabeli w testach; kazdy `RustProducer` nazywa funkcje, ktora test
/// `tests/p6_power_sources.rs` wola i porownuje z wektorami.
pub const COMPONENT_SOURCES: [(&str, ComponentSource); 12] = [
    (
        "armia",
        ComponentSource::RustProducer("brake_power_army::armia_for_owner (web sumArmyMForOwner, main.ts:2672; armyFieldPower = army_field_power, unit-power.ts)"),
    ),
    (
        "bitwy",
        ComponentSource::NoProducer("web battlePowerPtsByOwner (akumulator walk, main.ts:2254, zapis main.ts:34490); battle_power_points_from_defeated_enemy to tylko krok, brak akumulatora stanu walk w Rust (jak brake_power_rest)"),
    ),
    ("ludki", ComponentSource::RustProducer("recruitment::manpower::empire_suma_ludkow")),
    (
        "rekruci",
        ComponentSource::RustProducer("recruitment::manpower::empire_pobor_totals + rekrut_unit_equivalents"),
    ),
    ("miasta", ComponentSource::RustProducer("liczba miast wlasciciela (owner_city_ids)")),
    (
        "terytorium",
        ComponentSource::RustProducer("brake_power_army::terytorium_for_owner (web countTerritoryHexes(statsTerritoryNodesForOwner), main.ts:6135 + statsTerritoryNodesForOwner main.ts:5657; kandydat territory.rs::collect_territory_hex_keys_by_owner nie jest tym skladnikiem)"),
    ),
    (
        "infra",
        ComponentSource::RustProducer("brake_power_rest::count_buildings_for_owner (web countBuildingsForOwner, main.ts:2629)"),
    ),
    (
        "tech",
        ComponentSource::RustProducer("brake_power_rest::count_tech_for_owner (web countTechForOwner, main.ts:2638)"),
    ),
    (
        "ulepszenia",
        ComponentSource::NoProducer("web countImprovementsForOwner (main.ts:2643) z domknieciem statsTerritoryNodesForOwner (main.ts:5657) i hex improvements; brak portu tej sumy w Rust (placed_improvements_for_owner to tylko wejscie, niezweryfikowane)"),
    ),
    ("kultura", ComponentSource::RustProducer("order_effects_culture::empire_culture_total")),
    (
        "religia",
        ComponentSource::RustProducer("brake_power_rest::count_cities_with_dominant_state_religion (web countCitiesWithDominantStateReligion, culture-religion.ts:1383)"),
    ),
    (
        "zdobycze",
        ComponentSource::NoProducer("web zdobyczePowerByOwner (zapis main.ts:35673-35675); barbarian_captured_power_gain to tylko krok, brak akumulatora zdarzen eliminacji w Rust (jak brake_power_rest)"),
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

/// Wpisuje wyniki `produce_for_owner` do `ObjectivePowerRaw` (4 pola). Pozostale pola - w tym
/// `RustProducer` spoza tego zestawu (armia, terytorium, infra, tech, religia) i `NoProducer` - zostaja
/// nietkniete; wolajacy ustawia je jawnie.
pub fn apply_produced(raw: &mut ObjectivePowerRaw, produced: &ProducedComponents) {
    raw.suma_ludkow = Component::Provided(produced.suma_ludkow);
    raw.rekrut_ekw = Component::Provided(produced.rekrut_ekw);
    raw.miasta = Component::Provided(produced.miasta);
    raw.kultura_imperium = Component::Provided(produced.kultura_imperium);
}
