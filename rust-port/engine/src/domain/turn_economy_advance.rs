//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q1: produkcyjny wolajacy fazy zasobow `advanceCityEconomy`
//! (web pin `4bbef081d`, `gra/src/game/turn-economy.ts:2250-2913`).
//!
//! Portowane plastry (numery linii = web):
//! * S1 `ownersWithMennica` (`:240-248`);
//! * S2 przepustowosci konwerterow per wlasciciel (`:2338-2360`) i bonusy Stolarni/Kamieniarni
//!   (`:2364-2369`) - przez `converter_throughputs_for_era` i `load_throughput`;
//! * S3 liczniki Stolarni/Kamieniarni (budynki aktywne w runtime) i Magazynow (surowe `builtIds`)
//!   per wlasciciel (`:2370-2402`);
//! * S4 cap panstwa `ownerResourceCapFor` (`:2404-2418`);
//! * S5 faza zasobow (`:2482-2500`) - `run_city_economy_resource_phase` z `turn_economy_resources`;
//! * S6 widok per miasto wynikajacy ze stanu Spichlerza/Garncarni (`:2507-2523`,
//!   pola `maSpichlerz`, `maSpichlerzII`, `spichlerzCeramika`, `spichlerzSol`,
//!   `garncarniaSurplusZadowolenie` krotki `CityEconomyTick`);
//! * S7 `applyMennicaZlotoDrainForOwners` (`:1814-1830`, wolane `:2823-2829`);
//! * S8 `reconcileOwnerResourceCaps` (`:2832`);
//! * S9 `manpowerHeal` (`:2887-2909`, obrona R1) - `advance_manpower_heal`: wrapper nad
//!   `tick_manpower_unit_replenishment` (`recruitment.rs`) z resolverami weba (era, macierz
//!   cywilizacji po `ownerCivByOwnerId`). Dziala na `ManpowerCity` (pula MP), bo `state::City`
//!   NIE ma pol `manpower`/`oblegane` (grep `state.rs`), wiec nie da sie go wolac na `state::City`.
//!
//! NIE portowane (dlug, patrz `dyspozycje/rust-port/p6/P6-ADVANCE-CITY-ECONOMY.md`): wejscia terenowe
//! (`computeTerritoryResourceYieldByCity`, `computeWorkedMagazynYieldsByCity`) wchodza jako PARAMETRY,
//! petla plonow miast, zdrowie, Wealth, manpower, utrzymanie. Petla miast nie dotyka `City.surowce`
//! (zapis tylko w fazie zasobow, drenaz Mennicy i reconcile), wiec kolejnosc efektow na `surowce`
//! jest zachowana bez portu petli.
//!
//! Zalozenia modelowe:
//! * `ownerResourceCapFor` w webie memoizuje wynik per owner; tu liczone bez cache (funkcja czysta,
//!   resolver epoki deterministyczny);
//! * `Set<number>` wlascicieli Mennicy = `BTreeSet<i64>` (drenaz per owner dotyka rozlacznych miast,
//!   wiec kolejnosc iteracji nie ma wplywu na wynik).

use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::data::civilizations::CivMatrixFile;
use crate::domain::building_costs::p6_7b::{
    assign_owner_resource_stock_from_pool, empire_zloto_stock, load_throughput,
    owner_resource_stock_all, resolve_spichlerz_city_bonus_state, spichlerz_health_bonus,
    SpichlerzCityBonusState, SpichlerzDrainParams, SpichlerzDrainPayResult, StockRecord,
};
use crate::domain::civ_matrix::civ_matrix_param;
use crate::domain::recruitment::manpower::{
    tick_manpower_unit_replenishment, HpChangedFn, ManpowerCity, ManpowerDifficulty,
    ManpowerHealUnit, ManpowerMatrixOverrides, ManpowerReplenishResult,
};
use crate::domain::resource_access::{deduct_mennica_zloto_drain, MENNICA_ZLOTO_DRAIN_PER_TURN};
use crate::domain::terrain::city_founding::p6_6b::cities::City;
use crate::domain::turn_economy::economy_upkeep_p1::{
    load_owner_storage_params, owner_resource_capacity_per_type, reconcile_owner_resource_caps,
    CityResourceHolder, Difficulty, RawCell, RawEconParamsForUpkeep, RawGroup, RawRow,
};
use crate::domain::turn_economy_resources::{
    converter_throughputs_for_era, run_city_economy_resource_phase,
    runtime_active_built_ids_for_city, EmpireResourceTickInput, ResourcePhaseOutcome,
    ResourceTickResolvers, TerritoryResourceYield, WorkedMagazynYield,
};

use crate::domain::turn_economy::economy_upkeep_p2::UnitRow;
use crate::domain::turn_economy_health::{
    city_has_water_access_in, compute_city_health, load_health_params, river_hex_set,
    CityHealthMapContext, HealthParams,
};
use crate::domain::turn_economy_territory::{
    compute_terrain_inputs, territory_nodes_of, TerrainContext, TerrainInputs,
};
use crate::domain::turn_economy_upkeep::{
    compute_praca_upkeep_by_owner, load_advance_upkeep_params, AdvanceUpkeepParams,
};

/// Resolvery weba uzywane przez plastry zasobowe (`resolveOwnerEra`, `resolveOwnerTech`,
/// `resolveOwnerZlotoAccess`, `resolveOwnerActiveLabels`, `resolveOwnerEmpireStock`).
/// `None` = `undefined` w webie.
pub struct AdvanceResolvers<'a> {
    pub owner_era: Option<&'a dyn Fn(i64) -> f64>,
    pub owner_tech: Option<&'a dyn Fn(i64) -> BTreeSet<String>>,
    /// Web default `() => true`.
    pub owner_zloto_access: &'a dyn Fn(i64) -> bool,
    pub owner_active_labels: Option<&'a dyn Fn(i64) -> Vec<String>>,
    pub owner_empire_stock: Option<&'a dyn Fn(i64) -> StockRecord>,
}

/// Wejscia plastrow zasobowych `advanceCityEconomy` (nazwy jak w sygnaturze weba).
pub struct AdvanceCityEconomyInput<'a> {
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    /// `data.econParams` (surowy JSON `econ-params.json`).
    pub econ_params: Option<&'a Value>,
    /// `'easy' | 'normal' | 'hard'`.
    pub difficulty: &'a str,
    pub player_era: f64,
    pub player_zbadane: &'a BTreeSet<String>,
    pub resolvers: AdvanceResolvers<'a>,
    /// DLUG: web liczy z mapy (`computeTerritoryResourceYieldByCity`); tu parametr.
    pub territory_resource_by_city: &'a BTreeMap<String, TerritoryResourceYield>,
    /// DLUG: web liczy z mapy (`computeWorkedMagazynYieldsByCity`); tu parametr.
    pub worked_magazyn_by_city: &'a BTreeMap<String, WorkedMagazynYield>,
}

/// Pola `CityEconomyTick` zalezne wylacznie od stanu Spichlerza/Garncarni (web `:2514-2538`).
#[derive(Debug, Clone, PartialEq)]
pub struct CityResourceView {
    pub city_id: String,
    pub ma_spichlerz: bool,
    pub ma_spichlerz_ii: bool,
    pub spichlerz_ceramika: bool,
    pub spichlerz_sol: bool,
    pub garncarnia_surplus_zadowolenie: f64,
}

/// Wynik plastrow zasobowych.
#[derive(Debug, Clone, PartialEq)]
pub struct AdvanceResourceOutcome {
    pub phase: ResourcePhaseOutcome,
    pub stolarnia_count_by_owner: BTreeMap<i64, f64>,
    pub kamieniarski_count_by_owner: BTreeMap<i64, f64>,
    pub magazyn_count_by_owner: BTreeMap<i64, f64>,
    pub mennica_owners: BTreeSet<i64>,
    pub stolarnia_bonus_drewna_civ: f64,
    pub kamieniarski_bonus_kamienia_civ: f64,
    pub per_city: Vec<CityResourceView>,
}

/// Web `ownersWithMennica` (`:240-248`): surowe `builtIds` (bez bramki runtime).
pub fn owners_with_mennica(
    cities: &[City],
    built_by_city: &BTreeMap<String, Vec<String>>,
) -> BTreeSet<i64> {
    let mut owners = BTreeSet::new();
    for c in cities {
        let has = built_by_city
            .get(&c.id)
            .map(|b| b.iter().any(|x| x == "mennica"))
            .unwrap_or(false);
        if has {
            owners.insert(c.owner_id);
        }
    }
    owners
}

/// Web `resolveOwnerEra ? resolveOwnerEra(ownerId) : (ownerId === 0 ? playerEra : 1)`.
pub fn owner_era_for(input: &AdvanceCityEconomyInput<'_>, owner_id: i64) -> f64 {
    match input.resolvers.owner_era {
        Some(f) => f(owner_id),
        None if owner_id == 0 => input.player_era,
        None => 1.0,
    }
}

/// Surowy wiersz `econ-params.json` -> `RawRow` (liczba JSON = `Num`, reszta = `Other`).
pub(crate) fn raw_row_from_value(v: &Value) -> RawRow {
    let mut row = RawRow::new();
    if let Some(obj) = v.as_object() {
        for (k, x) in obj {
            let cell = match x.as_f64() {
                Some(n) => RawCell::Num(n),
                None => RawCell::Other,
            };
            row.insert(k.clone(), cell);
        }
    }
    row
}

/// Grupa `globalne` surowego `econ-params.json` -> `RawEconParamsForUpkeep` (tylko ta grupa jest
/// czytana przez `loadOwnerStorageParams`).
pub fn raw_econ_for_storage(econ: Option<&Value>) -> RawEconParamsForUpkeep {
    let globalne = econ
        .and_then(|e| e.get("globalne"))
        .and_then(Value::as_object)
        .map(|g| {
            g.iter()
                .map(|(k, v)| (k.clone(), raw_row_from_value(v)))
                .collect::<RawGroup>()
        });
    RawEconParamsForUpkeep {
        globalne,
        ..RawEconParamsForUpkeep::default()
    }
}

pub(crate) fn difficulty_enum(difficulty: &str) -> Difficulty {
    match difficulty {
        "easy" => Difficulty::Easy,
        "hard" => Difficulty::Hard,
        _ => Difficulty::Normal,
    }
}

/// Web `ownerResourceCapFor(ownerId)` (`:2406-2418`), bez memoizacji.
pub fn owner_resource_cap_for(
    input: &AdvanceCityEconomyInput<'_>,
    magazyn_count_by_owner: &BTreeMap<i64, f64>,
    owner_id: i64,
) -> f64 {
    let params = load_owner_storage_params(
        &raw_econ_for_storage(input.econ_params),
        difficulty_enum(input.difficulty),
    );
    let era = owner_era_for(input, owner_id);
    owner_resource_capacity_per_type(
        magazyn_count_by_owner
            .get(&owner_id)
            .copied()
            .unwrap_or(0.0),
        &params,
        era,
    )
}

/// Web `applyMennicaZlotoDrainForOwners` (`:1814-1830`).
pub fn apply_mennica_zloto_drain_for_owners(
    cities: &mut [City],
    mennica_owners: &BTreeSet<i64>,
    input: &AdvanceCityEconomyInput<'_>,
) {
    for &owner_id in mennica_owners {
        let tech: BTreeSet<String> = match input.resolvers.owner_tech {
            Some(f) => f(owner_id),
            None => input.player_zbadane.clone(),
        };
        let waluta_odkryta = tech.contains("Waluta") || tech.contains("waluta");
        if !waluta_odkryta {
            continue;
        }
        if !(input.resolvers.owner_zloto_access)(owner_id) {
            continue;
        }
        let pool = owner_resource_stock_all(cities, owner_id);
        if empire_zloto_stock(Some(&pool)) < MENNICA_ZLOTO_DRAIN_PER_TURN {
            continue;
        }
        assign_owner_resource_stock_from_pool(cities, owner_id, &deduct_mennica_zloto_drain(&pool));
    }
}

/// Web `reconcileOwnerResourceCaps(cities, ownerResourceCapFor)` (`:2832`) na produkcyjnym `City`.
pub fn reconcile_city_resource_caps(
    cities: &mut [City],
    input: &AdvanceCityEconomyInput<'_>,
    magazyn_count_by_owner: &BTreeMap<i64, f64>,
) {
    let mut holders: Vec<CityResourceHolder> = cities
        .iter()
        .map(|c| CityResourceHolder {
            id: c.id.clone(),
            owner_id: c.owner_id,
            surowce: c.surowce.clone(),
        })
        .collect();
    reconcile_owner_resource_caps(&mut holders, |o| {
        Some(owner_resource_cap_for(input, magazyn_count_by_owner, o))
    });
    for (c, h) in cities.iter_mut().zip(holders) {
        c.surowce = h.surowce;
    }
}

/// PRODUKCYJNY WYWOLUJACY fazy zasobowej `advanceCityEconomy` na `state::City`: przygotowanie wejsc
/// (S1-S4) -> `run_city_economy_resource_phase` (S5) -> widoki per miasto (S6) -> drenaz Mennicy (S7)
/// -> reconcile capow (S8), w kolejnosci weba.
pub fn advance_city_economy_resources(
    cities: &mut [City],
    input: &AdvanceCityEconomyInput<'_>,
) -> AdvanceResourceOutcome {
    let null = Value::Null;
    let raw = input.econ_params.unwrap_or(&null);

    let stolarnia_bonus = load_throughput(
        raw,
        "budynek_stolarnia_bonus_drewna_civ",
        input.difficulty,
        0.10,
    );
    let kamieniarski_bonus = load_throughput(
        raw,
        "budynek_kamieniarski_bonus_kamienia_civ",
        input.difficulty,
        0.10,
    );

    let zloto = input.resolvers.owner_zloto_access;
    let tick_resolvers = || ResourceTickResolvers {
        owner_active_labels: input.resolvers.owner_active_labels,
        owner_zloto_access: Some(zloto),
    };

    let mut stolarnia: BTreeMap<i64, f64> = BTreeMap::new();
    let mut kamieniarski: BTreeMap<i64, f64> = BTreeMap::new();
    let mut magazyn: BTreeMap<i64, f64> = BTreeMap::new();
    for c in cities.iter() {
        let b_ids: &[String] = input
            .built_by_city
            .get(&c.id)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let stock_override = input.resolvers.owner_empire_stock.map(|f| f(c.owner_id));
        let runtime = runtime_active_built_ids_for_city(
            b_ids,
            c.owner_id,
            &tick_resolvers(),
            stock_override.as_ref(),
        );
        if runtime.iter().any(|x| x == "stolarnia") {
            *stolarnia.entry(c.owner_id).or_insert(0.0) += 1.0;
        }
        if runtime.iter().any(|x| x == "kamieniarski") {
            *kamieniarski.entry(c.owner_id).or_insert(0.0) += 1.0;
        }
        if b_ids.iter().any(|x| x == "magazyn") {
            *magazyn.entry(c.owner_id).or_insert(0.0) += 1.0;
        }
    }

    let mennica_owners = owners_with_mennica(cities, input.built_by_city);

    let thr =
        |o: i64| converter_throughputs_for_era(raw, input.difficulty, owner_era_for(input, o));
    let cap = |o: i64| owner_resource_cap_for(input, &magazyn, o);
    let tick_input = EmpireResourceTickInput {
        built_by_city: input.built_by_city,
        territory_resource_by_city: input.territory_resource_by_city,
        worked_magazyn_by_city: input.worked_magazyn_by_city,
        stolarnia_count_by_owner: &stolarnia,
        kamieniarski_count_by_owner: &kamieniarski,
        stolarnia_bonus_drewna_civ: stolarnia_bonus,
        kamieniarski_bonus_kamienia_civ: kamieniarski_bonus,
        converter_throughputs_for_owner: &thr,
        owner_resource_cap_for: &cap,
        resolvers: tick_resolvers(),
        // nadpisywane przez `run_city_economy_resource_phase` wynikiem `load_spichlerz_drain_params`
        spichlerz_drain_params: SpichlerzDrainParams {
            ceramika_i: 0.0,
            ceramika_ii: 0.0,
            sol_ii: 0.0,
        },
    };
    let phase =
        run_city_economy_resource_phase(cities, tick_input, input.econ_params, input.difficulty);

    let mut per_city = Vec::with_capacity(cities.len());
    for c in cities.iter() {
        let built_ids: &[String] = input
            .built_by_city
            .get(&c.id)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let runtime = {
            let stock_override = input.resolvers.owner_empire_stock.map(|f| f(c.owner_id));
            runtime_active_built_ids_for_city(
                built_ids,
                c.owner_id,
                &tick_resolvers(),
                stock_override.as_ref(),
            )
        };
        let state = phase
            .tick
            .spichlerz_by_city
            .get(&c.id)
            .copied()
            .unwrap_or_else(|| {
                resolve_spichlerz_city_bonus_state(
                    built_ids,
                    SpichlerzDrainPayResult {
                        ceramika_paid: false,
                        sol_paid: false,
                    },
                )
            });
        let garn = if runtime.iter().any(|x| x == "garncarnia") {
            phase
                .garncarnia_surplus_zadowolenie_by_owner
                .get(&c.owner_id)
                .copied()
                .unwrap_or(0.0)
        } else {
            0.0
        };
        per_city.push(CityResourceView {
            city_id: c.id.clone(),
            ma_spichlerz: state.ma_spichlerz_pop,
            ma_spichlerz_ii: state.ma_spichlerz_ii_pop,
            spichlerz_ceramika: state.ceramika_active,
            spichlerz_sol: state.sol_active,
            garncarnia_surplus_zadowolenie: garn,
        });
    }

    apply_mennica_zloto_drain_for_owners(cities, &mennica_owners, input);
    reconcile_city_resource_caps(cities, input, &magazyn);

    AdvanceResourceOutcome {
        phase,
        stolarnia_count_by_owner: stolarnia,
        kamieniarski_count_by_owner: kamieniarski,
        magazyn_count_by_owner: magazyn,
        mennica_owners,
        stolarnia_bonus_drewna_civ: stolarnia_bonus,
        kamieniarski_bonus_kamienia_civ: kamieniarski_bonus,
        per_city,
    }
}

/// WARIANT -Q2a: jak [`advance_city_economy_resources`], ale wejscia terenowe (`territoryResourceByCity`,
/// `workedMagazynByCity`) liczy SAM z `cities` + mapy (`:2296-2310`, `:2476`), a nie z parametrow.
/// Pola `territory_resource_by_city` / `worked_magazyn_by_city` w `input` sa IGNOROWANE. Reconcile
/// `okolica_reczne` (`:2306`) mutuje `cities` PRZED faza zasobow, jak w webie. Zwraca tez wejscia
/// terenowe (do porownania z webem).
pub fn advance_city_economy_resources_with_map(
    cities: &mut [City],
    terrain: &TerrainContext<'_>,
    input: &AdvanceCityEconomyInput<'_>,
) -> (AdvanceResourceOutcome, TerrainInputs) {
    let era = |o: i64| owner_era_for(input, o);
    let inputs = compute_terrain_inputs(cities, terrain, &era);
    let own = AdvanceCityEconomyInput {
        built_by_city: input.built_by_city,
        econ_params: input.econ_params,
        difficulty: input.difficulty,
        player_era: input.player_era,
        player_zbadane: input.player_zbadane,
        resolvers: AdvanceResolvers {
            owner_era: input.resolvers.owner_era,
            owner_tech: input.resolvers.owner_tech,
            owner_zloto_access: input.resolvers.owner_zloto_access,
            owner_active_labels: input.resolvers.owner_active_labels,
            owner_empire_stock: input.resolvers.owner_empire_stock,
        },
        territory_resource_by_city: &inputs.territory_resource_by_city,
        worked_magazyn_by_city: &inputs.worked_magazyn_by_city,
    };
    let out = advance_city_economy_resources(cities, &own);
    (out, inputs)
}

/// Wejscia plastra `manpowerHeal` (`turn-economy.ts:2280-2284`, `:2887-2909`).
pub struct AdvanceManpowerHealInput<'a> {
    /// Web `difficulty` (tu `ManpowerDifficulty`).
    pub difficulty: ManpowerDifficulty,
    pub player_era: f64,
    /// Web `resolveOwnerEra` (`None` = `undefined`: owner 0 -> `playerEra`, reszta 1).
    pub owner_era: Option<&'a dyn Fn(i64) -> f64>,
    /// Macierz cywilizacji (web: modul-globalny `DATA` w `civ-matrix.ts`; tu jawnie, zeby test mogl
    /// podac macierz z niezerowymi `mp_*`; produkcyjnie `&load_civ_matrix().file`).
    pub matrix: &'a CivMatrixFile,
    /// Web `ownerCivByOwnerId` (ownerId -> klucz cywilizacji).
    pub owner_civ_by_owner_id: &'a BTreeMap<i64, String>,
    /// Web `manpowerHeal.getMaxHp(typeId, liveUnit)` (`main.ts:34561`; `manpower.ts:319` wola z zywa jednostka).
    /// Gotowe zrodlo: `unit_health::UnitHealthSource::as_get_max_hp`.
    pub get_max_hp: &'a dyn Fn(&str, &ManpowerHealUnit) -> f64,
    /// Web `manpowerHeal.onUnitHpChanged`.
    pub on_unit_hp_changed: Option<&'a mut HpChangedFn<'a>>,
}

/// Port bloku `if (manpowerHeal) { tickManpowerUnitReplenishment(...) }` (`:2887-2909`). Wynik weba
/// jest odrzucany przez `advanceCityEconomy`; tu zwracany tylko do testow. Resolver macierzy:
/// brak klucza (`undefined` lub `""`) -> `None`; inaczej trzy pola `mp_*` z `civMatrixParam`.
pub fn advance_manpower_heal(
    cities: &mut [ManpowerCity],
    units: &mut [ManpowerHealUnit],
    input: AdvanceManpowerHealInput<'_>,
) -> ManpowerReplenishResult {
    let player_era = input.player_era;
    let resolve_era = |oid: i64| -> f64 {
        match input.owner_era {
            Some(f) => f(oid),
            None if oid == 0 => player_era,
            None => 1.0,
        }
    };
    let matrix = input.matrix;
    let civ_by_owner = input.owner_civ_by_owner_id;
    let resolve_matrix = |oid: i64| -> Option<ManpowerMatrixOverrides> {
        let key = civ_by_owner.get(&oid).filter(|k| !k.is_empty())?;
        Some(ManpowerMatrixOverrides {
            mp_regen_proc: Some(civ_matrix_param(matrix, key, "mp_regen_proc")),
            mp_max_proc: Some(civ_matrix_param(matrix, key, "mp_max_proc")),
            mp_koszt_jednostki_proc: Some(civ_matrix_param(matrix, key, "mp_koszt_jednostki_proc")),
        })
    };
    let get_max_hp = input.get_max_hp;
    tick_manpower_unit_replenishment(
        cities,
        units,
        input.difficulty,
        &resolve_era,
        &|_| None,
        Some(&resolve_matrix),
        get_max_hp,
        None,
        input.on_unit_hp_changed,
    )
}

/// Dodatkowe wejscia plastrow utrzymania i zdrowia (-Q3): `data.societyParams` (sekcja `zdrowie`) i
/// `data.units` (wiersze `units.json` z kolejnoscia kluczy, patrz `turn_economy_upkeep::unit_rows_from_json_str`).
pub struct UpkeepHealthInput<'a> {
    /// Web `(data as Record).societyParams` (`:2421-2424`); `None` = `undefined`.
    pub society_params: Option<&'a Value>,
    /// Web `data.units` (`:2329`).
    pub unit_rows: &'a [UnitRow],
}

/// Wynik plastrow P4/P5/P10/P16.
#[derive(Debug, Clone, PartialEq)]
pub struct UpkeepHealthOutcome {
    /// Web `pracaUpkeepByOwner` (`:2320`, w wyniku ticku `:2469`).
    pub praca_upkeep_by_owner: BTreeMap<i64, f64>,
    /// Web `:2323-2329`.
    pub params: AdvanceUpkeepParams,
    /// Web `healthParams` (`:2421-2425`).
    pub health_params: HealthParams,
    /// Web `zdrowie` per miasto (`:2519-2527`), w kolejnosci `cities`.
    pub zdrowie_by_city: Vec<(String, f64)>,
}

/// Plastry utrzymania i zdrowia `advanceCityEconomy` (-Q3), WPIETE ADDYTYWNIE obok
/// [`advance_city_economy_resources_with_map`]: nie zmienia `cities`, a stan Spichlerza bierze z wyniku
/// fazy zasobow (`views` = `AdvanceResourceOutcome::per_city`), tak jak petla miast weba czyta
/// `spichlerzByCity` po `tickEmpireResourcePipeline`.
/// Kolejnosc weba: P4 (`:2320`) -> P5 (`:2323-2329`) -> P10 (`:2421`) -> P16 per miasto (`:2519-2527`).
pub fn advance_city_economy_upkeep_health(
    cities: &[City],
    terrain: &TerrainContext<'_>,
    input: &AdvanceCityEconomyInput<'_>,
    views: &[CityResourceView],
    extra: &UpkeepHealthInput<'_>,
) -> UpkeepHealthOutcome {
    let territory_nodes = territory_nodes_of(cities);
    let praca_upkeep_by_owner = compute_praca_upkeep_by_owner(
        terrain.map,
        &territory_nodes,
        input.econ_params,
        input.difficulty,
    );
    let params = load_advance_upkeep_params(input.econ_params, input.difficulty, extra.unit_rows);
    let health_params = load_health_params(extra.society_params, input.difficulty);

    let zloto = input.resolvers.owner_zloto_access;
    let tick_resolvers = || ResourceTickResolvers {
        owner_active_labels: input.resolvers.owner_active_labels,
        owner_zloto_access: Some(zloto),
    };
    let rivers = river_hex_set(terrain.map);
    let mut zdrowie_by_city = Vec::with_capacity(cities.len());
    for c in cities {
        let built_ids: &[String] = input
            .built_by_city
            .get(&c.id)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let stock_override = input.resolvers.owner_empire_stock.map(|f| f(c.owner_id));
        let runtime = runtime_active_built_ids_for_city(
            built_ids,
            c.owner_id,
            &tick_resolvers(),
            stock_override.as_ref(),
        );
        let state = match views.iter().find(|v| v.city_id == c.id) {
            Some(v) => SpichlerzCityBonusState {
                ceramika_active: v.spichlerz_ceramika,
                sol_active: v.spichlerz_sol,
                ma_spichlerz_pop: v.ma_spichlerz,
                ma_spichlerz_ii_pop: v.ma_spichlerz_ii,
            },
            None => resolve_spichlerz_city_bonus_state(
                built_ids,
                SpichlerzDrainPayResult {
                    ceramika_paid: false,
                    sol_paid: false,
                },
            ),
        };
        let has_water = city_has_water_access_in(c.q, c.r, terrain.map, &rivers);
        let ctx = CityHealthMapContext {
            q: c.q,
            r: c.r,
            population: c.population,
            map: terrain.map,
        };
        let zdrowie = compute_city_health(
            c.population,
            &[],
            &runtime,
            &health_params,
            Some(has_water),
            Some(&ctx),
            spichlerz_health_bonus(&state),
            0.0,
        );
        zdrowie_by_city.push((c.id.clone(), zdrowie));
    }
    UpkeepHealthOutcome {
        praca_upkeep_by_owner,
        params,
        health_params,
        zdrowie_by_city,
    }
}
