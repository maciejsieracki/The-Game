//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q5-Q1: JEDNA funkcja `advance_city_economy` skladajaca plastry
//! `advanceCityEconomy` (web pin `4bbef081d`, `gra/src/game/turn-economy.ts:2250-2913`) w kolejnosci weba
//! i zwracajaca odpowiednik `EconomyTickResult` (`:1108-1148`) ze WSZYSTKIMI polami.
//!
//! Kolejnosc plastrow: faza zasobowa + drenaz Mennicy + reconcile capow (`advance_city_economy_resources_with_map`,
//! `:2476-2500`, `:2822-2832`) -> zdrowie/P4/P5 (`advance_city_economy_upkeep_health`) -> petla miast
//! (`advance_city_economy_loop`, `:2506-2800`) -> P23 utrzymanie per owner ([`compute_owner_upkeep`], `:2834-2884`)
//! -> P24 `manpowerHeal` (`:2887-2909`, opcjonalny).
//!
//! P23 (`:2834-2884`): `buildingsByOwner` (poziom budynku `buildingLevelForEpoch` wg ery i techu wlasciciela),
//! `upkeepBalance(income, buildings, units, unitUpkeepTbl, upkeepParams)`, utrzymanie surowcowe budynkow
//! (`totalBuildingResourceUpkeep`) i jednostek (`totalUnitResourceUpkeep`), scalone `addResourceCosts`.
//!
//! ZALOZENIA (odstepstwa od 1:1, do akceptacji wlasciciela):
//! * Z-Q5-1 (domkniecie Z-Q4-3): drenaz Mennicy i reconcile capow sa liczone PRZED petla miast (web: po).
//!   Petla czyta `City.surowce` WYLACZNIE przez resolvery (`turn-economy.ts:2511-2513`, `:2558`), a w Rust
//!   resolvery sa wartosciami wstrzyknietymi (`&dyn Fn`), wiec nie widza zmian `cities` (borrow checker:
//!   `cities` jest `&mut`). W webie resolvery z `main.ts:5210-5253` czytaja stan zywy, ale sa MEMOIZOWANE per
//!   owner przy pierwszym wolaniu; zob. `P6-ADVANCE-CITY-ECONOMY-Q5.md` sek. 3 (pomiar fazy pierwszego wolania).
//!   KONTRAKT dla wolajacego: wartosc resolvera = wartosc z PIERWSZEGO wolania w webie, nie przeliczana po drenazu.
//! * Z-Q5-2: `EconUnit` w webie nie ma pola `category`, a `upkeepBalance` dostaje je przez
//!   `as unknown as UnitUpkeepLike[]` (`:2867`), wiec `unit.category === undefined` (brak wpisu w
//!   `DEFAULT_UNIT_UPKEEP_BY_CATEGORY`); Rust przekazuje pusty napis (brak wpisu).
//! * Z-Q5-3: `EconomyTickResult.growth`/`starved` sa w `advanceCityEconomy` zawsze 0 (`:2463-2464`; jedyny
//!   inkrement: `population-growth-v85.ts:597-598` w wolajacym PO ticku) - zwracane jako 0.
//! * Z-Q5-4: kolejnosc kluczy `Map` weba nie jest zachowana (BTreeMap); porownanie po kluczach.
//! * Z-Q5-5: komorki `units.json` kolumny `Utrzymanie surowiec` inne niz tekst/null (liczba -> napis JS) nie
//!   wystepuja w danych (`units.json`: 74 napisy, 1 null).

use std::collections::{BTreeMap, BTreeSet, HashSet};

use crate::data::buildings_tech::Building;
use crate::domain::building_costs::p6_7b::EpochInput;
use crate::domain::production_units::building_level_for_epoch;
use crate::domain::recruitment::manpower::{
    js_number_to_string, HpChangedFn, ManpowerCity, ManpowerDifficulty, ManpowerHealUnit,
    ManpowerReplenishResult,
};
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::turn_economy::economy_upkeep_p2::{
    add_resource_costs, total_building_resource_upkeep, total_unit_resource_upkeep, upkeep_balance,
    BuildingInstanceLike, BuildingRecord, UnitCell, UnitResourceUpkeepSource, UnitRow, UnitTypeRef,
    UnitUpkeepLike, UpkeepBalance,
};
use crate::domain::turn_economy_advance::{
    advance_manpower_heal, owner_era_for, AdvanceCityEconomyInput, AdvanceManpowerHealInput,
    UpkeepHealthInput,
};
use crate::domain::turn_economy_loop::{
    advance_city_economy_loop, AdvanceLoopInput, AdvanceLoopOutcome, CityLoopExtra, CityLoopTick,
};
use crate::domain::turn_economy_territory::TerrainContext;
use crate::domain::turn_economy_upkeep::AdvanceUpkeepParams;

/// Web `EconUnit` (`turn-economy.ts:1282`) - pola czytane przez P23 (`ownerId`, `typeId`).
#[derive(Debug, Clone, PartialEq)]
pub struct EconUnit {
    pub owner_id: i64,
    pub type_id: String,
}

/// Web `manpowerHeal` (`:2280-2284`): zywe jednostki + `getMaxHp(typeId, liveUnit)` + `onUnitHpChanged`.
pub struct HealRequest<'a> {
    pub units: &'a mut [ManpowerHealUnit],
    pub get_max_hp: &'a dyn Fn(&str, &ManpowerHealUnit) -> f64,
    pub on_unit_hp_changed: Option<&'a mut HpChangedFn<'a>>,
}

/// Web `EconomyTickResult` (`:1108-1148`), wszystkie pola.
#[derive(Debug, Clone, PartialEq)]
pub struct EconomyTickResult {
    pub per_city: Vec<CityLoopTick>,
    pub cities: f64,
    pub total_praca: f64,
    pub total_pieniadz: f64,
    pub total_nauka: f64,
    pub total_luksus: f64,
    pub total_kultura: f64,
    pub total_zywnosc: f64,
    pub total_praca_pula: f64,
    pub growth: f64,
    pub starved: f64,
    pub upkeep_by_owner: BTreeMap<i64, UpkeepBalance>,
    pub resource_upkeep_by_owner: BTreeMap<i64, BTreeMap<String, f64>>,
    pub resource_upkeep_buildings_by_owner: BTreeMap<i64, BTreeMap<String, f64>>,
    pub resource_upkeep_units_by_owner: BTreeMap<i64, BTreeMap<String, f64>>,
    pub praca_upkeep_by_owner: BTreeMap<i64, f64>,
}

/// Wynik plastra P23 (cztery mapy per owner).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct OwnerUpkeepTail {
    pub upkeep_by_owner: BTreeMap<i64, UpkeepBalance>,
    pub resource_upkeep_by_owner: BTreeMap<i64, BTreeMap<String, f64>>,
    pub resource_upkeep_buildings_by_owner: BTreeMap<i64, BTreeMap<String, f64>>,
    pub resource_upkeep_units_by_owner: BTreeMap<i64, BTreeMap<String, f64>>,
}

/// Pelny wynik: odpowiednik `EconomyTickResult` + wyniki plastrow (diagnostyka) + wynik leczenia.
#[derive(Debug, Clone, PartialEq)]
pub struct AdvanceTickOutcome {
    pub result: EconomyTickResult,
    pub city_loop: AdvanceLoopOutcome,
    pub heal: Option<ManpowerReplenishResult>,
}

/// Wiersz katalogu budynkow -> `BuildingRecord` (pola czytane przez `economy-upkeep.ts`).
pub fn building_record_of(b: &Building) -> BuildingRecord {
    BuildingRecord {
        id: b.id.clone(),
        utrzymanie: Some(b.utrzymanie as f64),
        przyrost_utrzymania: Some(b.przyrost_utrzymania as f64),
        epoka_wejscia: Some(b.epoka_wejscia as f64),
        koszt_surowce: b.koszt_surowce.as_ref().map(|k| {
            let mut m: BTreeMap<String, Option<f64>> = BTreeMap::new();
            m.insert("drewno".into(), k.drewno.map(|x| x as f64));
            m.insert("kamien".into(), k.kamien.map(|x| x as f64));
            m.insert("cegla".into(), k.cegla.map(|x| x as f64));
            m
        }),
    }
}

fn cell_text<'a>(row: &'a UnitRow, key: &str) -> Option<&'a UnitCell> {
    row.iter().find(|(k, _)| k == key).map(|(_, v)| v)
}

/// Web `data.units.find(u => u.Jednostka === typeId)` -> zrodlo utrzymania surowcowego.
fn unit_upkeep_source(rows: &[UnitRow], type_id: &str) -> Option<UnitResourceUpkeepSource> {
    let row = rows
        .iter()
        .find(|r| matches!(cell_text(r, "Jednostka"), Some(UnitCell::Text(t)) if t == type_id))?;
    let epoka = match cell_text(row, "Epoka") {
        Some(UnitCell::Num(x)) => EpochInput::Number(*x),
        Some(UnitCell::Text(t)) => EpochInput::Text(t.clone()),
        _ => EpochInput::Other,
    };
    // `(x ?? '').toString().trim()`: null/brak -> '' (None), liczba -> napis JS.
    let rodzaj = match cell_text(row, "Utrzymanie surowiec") {
        Some(UnitCell::Text(t)) => Some(t.clone()),
        Some(UnitCell::Num(x)) => Some(js_number_to_string(*x)),
        _ => None,
    };
    let ilosc = match cell_text(row, "Utrzymanie surowiec (ilość)") {
        Some(UnitCell::Num(x)) => Some(*x),
        _ => None,
    };
    Some(UnitResourceUpkeepSource {
        epoka,
        utrzymanie_surowiec: rodzaj,
        utrzymanie_surowiec_ilosc: ilosc,
    })
}

/// P23 (`:2834-2884`): utrzymanie per owner.
pub fn compute_owner_upkeep(
    cities: &[City],
    input: &AdvanceCityEconomyInput<'_>,
    buildings: &[Building],
    econ_units: &[EconUnit],
    unit_rows: &[UnitRow],
    income_by_owner: &BTreeMap<i64, f64>,
    params: &AdvanceUpkeepParams,
) -> OwnerUpkeepTail {
    // `:2838` - Set(ownerId miast + ownerId jednostek).
    let owner_ids: BTreeSet<i64> = cities
        .iter()
        .map(|c| c.owner_id)
        .chain(econ_units.iter().map(|u| u.owner_id))
        .collect();

    // `:2841-2865` - buildingsByOwner (tylko miasta z niepustym builtIds).
    let mut buildings_by_owner: BTreeMap<i64, Vec<BuildingInstanceLike>> = BTreeMap::new();
    for c in cities {
        let built: &[String] = input
            .built_by_city
            .get(&c.id)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        if built.is_empty() {
            continue;
        }
        let owner_era = owner_era_for(input, c.owner_id);
        let owner_tech: BTreeSet<String> = match input.resolvers.owner_tech {
            Some(f) => f(c.owner_id),
            None => input.player_zbadane.clone(),
        };
        let unlocked: HashSet<String> = owner_tech.into_iter().collect();
        let list = buildings_by_owner.entry(c.owner_id).or_default();
        for bid in built {
            let Some(b) = buildings.iter().find(|b| &b.id == bid) else {
                continue;
            };
            let gate: Option<Vec<(String, String)>> = b
                .poziom_tech_gate
                .as_ref()
                .map(|g| g.iter().map(|(k, v)| (k.clone(), v.clone())).collect());
            let level = building_level_for_epoch(
                b.epoka_wejscia as f64,
                owner_era,
                b.maks_poziom as f64,
                gate.as_deref(),
                Some(&unlocked),
            );
            list.push(BuildingInstanceLike {
                record: building_record_of(b),
                level,
            });
        }
    }

    // `:2866-2884`.
    let mut out = OwnerUpkeepTail::default();
    let no_buildings: Vec<BuildingInstanceLike> = Vec::new();
    for oid in owner_ids {
        let income = income_by_owner.get(&oid).copied().unwrap_or(0.0);
        let ounits: Vec<&EconUnit> = econ_units.iter().filter(|u| u.owner_id == oid).collect();
        let like: Vec<UnitUpkeepLike> = ounits
            .iter()
            .map(|u| UnitUpkeepLike {
                type_id: u.type_id.clone(),
                category: String::new(),
            })
            .collect();
        let blds = buildings_by_owner.get(&oid).unwrap_or(&no_buildings);
        let balance = upkeep_balance(
            income,
            blds,
            &like,
            &params.unit_upkeep_table,
            &params.upkeep,
        );
        out.upkeep_by_owner.insert(oid, balance);

        let buildings_res = total_building_resource_upkeep(blds);
        let refs: Vec<UnitTypeRef> = ounits
            .iter()
            .map(|u| UnitTypeRef {
                type_id: u.type_id.clone(),
            })
            .collect();
        let units_res = total_unit_resource_upkeep(&refs, |t| unit_upkeep_source(unit_rows, t));
        let mut res = buildings_res.clone();
        add_resource_costs(&mut res, &units_res);
        out.resource_upkeep_by_owner.insert(oid, res);
        out.resource_upkeep_buildings_by_owner
            .insert(oid, buildings_res);
        out.resource_upkeep_units_by_owner.insert(oid, units_res);
    }
    out
}

fn manpower_difficulty(difficulty: &str) -> ManpowerDifficulty {
    match difficulty {
        "easy" => ManpowerDifficulty::Easy,
        "hard" => ManpowerDifficulty::Hard,
        _ => ManpowerDifficulty::Normal,
    }
}

/// `advanceCityEconomy` (`turn-economy.ts:2250-2913`) jako jedna funkcja nad produkcyjnym `state::City`.
/// `heal = None` odpowiada `manpowerHeal === undefined`.
#[allow(clippy::too_many_arguments)]
pub fn advance_city_economy<'a>(
    cities: &mut [City],
    extras: &mut BTreeMap<String, CityLoopExtra>,
    terrain: &TerrainContext<'_>,
    input: &AdvanceCityEconomyInput<'a>,
    upkeep_extra: &UpkeepHealthInput<'_>,
    lp: &AdvanceLoopInput<'a>,
    econ_units: &[EconUnit],
    heal: Option<HealRequest<'a>>,
) -> AdvanceTickOutcome {
    let city_loop = advance_city_economy_loop(cities, extras, terrain, input, upkeep_extra, lp);
    let tail = compute_owner_upkeep(
        cities,
        input,
        lp.data.buildings,
        econ_units,
        upkeep_extra.unit_rows,
        &city_loop.income_by_owner,
        &city_loop.upkeep_health.params,
    );

    let heal_result = heal.map(|h| {
        let mut pools: Vec<ManpowerCity> = cities
            .iter()
            .map(|c| {
                let e = extras.get(&c.id).copied().unwrap_or_default();
                ManpowerCity {
                    id: c.id.clone(),
                    owner_id: c.owner_id,
                    population: c.population,
                    manpower: e.manpower,
                    q: c.q as i32,
                    r: c.r as i32,
                    oblegane: if e.oblegane { Some(true) } else { None },
                }
            })
            .collect();
        let res = advance_manpower_heal(
            &mut pools,
            h.units,
            AdvanceManpowerHealInput {
                difficulty: manpower_difficulty(input.difficulty),
                player_era: input.player_era,
                owner_era: input.resolvers.owner_era,
                matrix: lp.data.matrix,
                owner_civ_by_owner_id: lp.maps.owner_civ_by_owner_id,
                get_max_hp: h.get_max_hp,
                on_unit_hp_changed: h.on_unit_hp_changed,
            },
        );
        for p in pools {
            extras.entry(p.id).or_default().manpower = p.manpower;
        }
        res
    });

    let result = EconomyTickResult {
        per_city: city_loop.per_city.clone(),
        cities: city_loop.cities,
        total_praca: city_loop.total_praca,
        total_pieniadz: city_loop.total_pieniadz,
        total_nauka: city_loop.total_nauka,
        total_luksus: city_loop.total_luksus,
        total_kultura: city_loop.total_kultura,
        total_zywnosc: city_loop.total_zywnosc,
        total_praca_pula: city_loop.total_praca_pula,
        growth: 0.0,
        starved: 0.0,
        upkeep_by_owner: tail.upkeep_by_owner,
        resource_upkeep_by_owner: tail.resource_upkeep_by_owner,
        resource_upkeep_buildings_by_owner: tail.resource_upkeep_buildings_by_owner,
        resource_upkeep_units_by_owner: tail.resource_upkeep_units_by_owner,
        praca_upkeep_by_owner: city_loop.upkeep_health.praca_upkeep_by_owner.clone(),
    };
    AdvanceTickOutcome {
        result,
        city_loop,
        heal: heal_result,
    }
}
