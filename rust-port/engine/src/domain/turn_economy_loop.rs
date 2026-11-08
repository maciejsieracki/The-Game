//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q4-Q1: petla miast `advanceCityEconomy` (web pin `4bbef081d`,
//! `gra/src/game/turn-economy.ts:2277-2913`), plastry P12, P17, P18, P19, P20.
//!
//! Portowane (numery linii = web):
//! * P12 stolica / liczba miast per wlasciciel (`:2444-2454`) -> [`capital_and_city_count_by_owner`];
//! * P17 plony miasta (`:2536-2621`): `toEconomyCity` (`:956`, tu: rozwiazanie podzialu Handlu / Pracy),
//!   `cityWorkedTilesForEconomy` (`:624`), `cityYieldPerTurn` (przez `economy_yield`),
//!   `applyOrderYieldMults` (`:176`) -> [`apply_order_yield_mults`], `applyWonderCityYields` (`:212`) ->
//!   [`apply_wonder_city_yields`], korupcja (`corruptionRate` + `corruptionBuildingReduction`);
//! * P18 Wealth (`wealthParamsForOwner`, `advanceWealth`), `splitPraca`, `routeCashForCity` (`:2625-2662`);
//! * P19 oblezenie / wzrost V8.5 (`:2664-2755`): galaz oblezenia, `computeCityFoodBalanceV85`,
//!   `computeGrowthPercentV85`;
//! * P20 manpower per miasto (`:2750-2773`): `cityManpowerMax` + `tickManpowerRegen`.
//!
//! Wolajacy: [`advance_city_economy_loop`] = `advance_city_economy_resources_with_map` (faza zasobow,
//! drenaz Mennicy, reconcile) + `advance_city_economy_upkeep_health` (zdrowie) + petla miast, na
//! PRODUKCYJNYM `state::City`. Kolejnosc inna niz w webie (drenaz Mennicy i reconcile capow PRZED petla,
//! nie po niej) jest rownowazna: petla nie czyta ani nie zapisuje `City.surowce` (jedyne pola
//! mutowane przez petle: `wealth_state`, `wealth_immunity_remaining`, `magazyn_zywnosci` w galezi
//! oblezenia, `manpower` w [`CityLoopExtra`]).
//!
//! ZALOZENIA (odstepstwa od 1:1 wymuszone allowlista / typami):
//! * `state::City` NIE ma pol `oblegane`, `garnizon`, `manpower` (grep `state.rs`); niosa je
//!   [`CityLoopExtra`] per `city.id` (brak wpisu = `undefined`). `state.rs` poza allowlista.
//! * `city_worked_hexes` / `terrain_web_key` / `hex_like_of` z `turn_economy_territory.rs` sa prywatne,
//!   a `domain/territory*` jest poza allowlista -> kopia (~40 linii) w tym pliku.
//! * `civEconomyYieldMultipliers(ownerBonusy)` i `civManpowerMults(ownerBonusy)` zwracaja w pinie stale
//!   `{1,1}` (`economy.ts:782`, `manpower.ts`), wiec `civBonusyForCivKey` nie jest wolane.
//! * `yld.zywnosc` (netto po racjach i cudach) nie trafia do `CityEconomyTick` (tick uzywa
//!   `foodBal.bilansLokalny`); Rust zwraca je w [`CityLoopDiag::y1`] (do porownania z webem).

use std::collections::{BTreeMap, BTreeSet, HashSet};

use serde_json::Value;

use crate::data::buildings_tech::Building;
use crate::data::civilizations::CivMatrixFile;
use crate::domain::building_costs::p6_7b::{
    built_ids_for_spichlerz_yields, SpichlerzCityBonusState,
};
use crate::domain::city_growth::p6_7a::growth_v85::{
    compute_growth_percent_v85, get_city_ration_level, GrowthPercentInput,
};
use crate::domain::city_growth::p6_7a::happiness::compute_growth_happiness_netto;
use crate::domain::city_growth::p6_7a::SpichlerzCityBonusState as GrowthSpichlerz;
use crate::domain::city_growth::p6_7a::{compute_city_food_balance_v85, GameDifficulty};
use crate::domain::city_growth::repin_b3::{
    route_cash_for_city, wealth_params_for_owner, WealthModParams,
};
use crate::domain::civ_matrix::js_compat::js_max;
use crate::domain::economy_city_fns::{
    city_building_entries_from_built_ids, corruption_building_reduction, corruption_rate,
    BuildingLevelCatalogEntry, CorruptionParams,
};
use crate::domain::economy_city_params::{load_econ_params, EconParams};
use crate::domain::economy_yield::{
    city_praca_integer, city_yield_per_turn_from_worked_imp, BuildingYieldsInput,
    CityBuildingFullInput, CityBuildingInput, CityYieldHeadParams, CityYieldInput, CityYieldParams,
    CityYieldTailParams, WorkedTileImpInput,
};
use crate::domain::improvement_build::BuildHex;
use crate::domain::improvements::{improvement_keys_for_hex, HexLike, TerrainType};
use crate::domain::okolica::{
    is_land_workable_hex, resolve_worked_tiles, OkolicaYield, ResolveWorkedTilesOpts,
};
use crate::domain::production_units::split_praca;
use crate::domain::recruitment::manpower::{
    city_manpower_max, civ_manpower_matrix_mults, load_manpower_regen_params, tick_manpower_regen,
    ManpowerCity,
};
use crate::domain::terrain::city_founding::p6_6b::cities::{
    fresh_wealth_state as city_fresh_wealth_state, normalize_podzial_handlu, City,
    CityPodzialHandlu, CityPodzialPracy, FoodBuffer, WealthState as CityWealthState,
};
use crate::domain::terrain::city_founding::p6_6b::empire_city_defaults::resolve_city_podzial_pracy;
use crate::domain::terrain::city_range_for_population;
use crate::domain::territory::TerritoryNode;
use crate::domain::turn_economy::economy_upkeep_p1::read_city_food_buffer;
use crate::domain::turn_economy::economy_upkeep_p1::FoodBuffer as EconFoodBuffer;
use crate::domain::turn_economy::wealth::{
    advance_wealth, load_wealth_params, RawWealthParamsJson, RawWealthRow, WealthParams,
    WealthState,
};
use crate::domain::turn_economy_advance::{
    advance_city_economy_resources_with_map, advance_city_economy_upkeep_health, owner_era_for,
    AdvanceCityEconomyInput, AdvanceResourceOutcome, UpkeepHealthInput, UpkeepHealthOutcome,
};
use crate::domain::turn_economy_resources::{
    runtime_active_built_ids_for_city, ResourceTickResolvers,
};
use crate::domain::turn_economy_territory::{territory_nodes_of, TerrainContext, TerrainInputs};

/// Pola `City` weba, ktorych nie ma w `state::City` (patrz ZALOZENIA).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct CityLoopExtra {
    /// Web `city.oblegane === true`.
    pub oblegane: bool,
    /// Web `city.garnizon` (`None` = `undefined`/`null`).
    pub garnizon: Option<f64>,
    /// Web `city.manpower` (`None` = `undefined`); po petli niesie nowa pule.
    pub manpower: Option<f64>,
}

/// Web `OrderYieldMults` (B2-Q6).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct OrderYieldMults {
    pub production_mult: f64,
    pub pieniadz_mult: f64,
    pub nauka_mult: f64,
    pub kultura_mult: f64,
}

/// Web `WonderYieldBonus` (pola nieobecne = 0; w webie `if (bonus.x)` pomija `undefined`, 0 i NaN).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct WonderYieldBonus {
    pub pieniadz: f64,
    pub zywnosc: f64,
    pub nauka: f64,
    pub kultura: f64,
    pub praca: f64,
}

/// Mapy wejsciowe `advanceCityEconomy` czytane przez petle miast (nazwy jak w sygnaturze weba).
pub struct CityLoopMaps<'a> {
    pub owner_civ_by_owner_id: &'a BTreeMap<i64, String>,
    pub order_mult_by_city: &'a BTreeMap<String, OrderYieldMults>,
    pub wonder_city_yields_by_owner: &'a BTreeMap<i64, WonderYieldBonus>,
    pub trade_route_building_bonus_by_city: &'a BTreeMap<String, f64>,
    pub trade_income_by_city: &'a BTreeMap<String, f64>,
    pub maritime_trade_income_by_city: &'a BTreeMap<String, f64>,
    pub manual_work_tax_by_city: &'a BTreeMap<String, f64>,
    pub owner_default_podzial_handlu_by_owner: &'a BTreeMap<i64, CityPodzialHandlu>,
    pub owner_default_podzial_pracy_by_owner: &'a BTreeMap<i64, CityPodzialPracy>,
}

/// Dane statyczne petli: macierz cywilizacji i katalog budynkow (`data.buildings`).
pub struct CityLoopData<'a> {
    pub matrix: &'a CivMatrixFile,
    pub buildings: &'a [Building],
}

/// Pola `CityEconomyTick` (web `:1049`) zapisywane przez petle miast.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct CityLoopTick {
    pub city_id: String,
    pub owner_id: i64,
    pub owner_era: f64,
    pub praca: f64,
    pub pieniadz: f64,
    pub pieniadz_brutto: f64,
    pub zywnosc_netto: f64,
    pub nauka: f64,
    pub luksus: f64,
    pub kultura: f64,
    pub ludnosc_przed: f64,
    pub ludnosc_po: f64,
    pub wzrost: bool,
    pub ubytek: bool,
    pub zdrowie: f64,
    pub do_budynkow: f64,
    pub do_puli: f64,
    pub wealth_mnoznik: f64,
    pub wealth_zadowolenie: f64,
    pub garncarnia_surplus_zadowolenie: f64,
    pub pieniadz_z_pracy: f64,
    pub pieniadz_z_tras: f64,
    pub oblegany: bool,
    pub oblegany_glod: bool,
    pub magazyn_po_turze: f64,
    pub ma_spichlerz: bool,
    pub ma_spichlerz_ii: bool,
    pub spichlerz_ceramika: bool,
    pub spichlerz_sol: bool,
    pub procent_rozwoj: f64,
    pub zywnosc_brutto: f64,
    pub koszt_racji: f64,
    pub bilans_lokalny: f64,
    pub poziom_racji: f64,
    /// `None` w galezi oblezenia (web nie ustawia pola).
    pub wzrost_procent: Option<f64>,
    pub wzrost_ulamkowy_po: Option<f64>,
}

/// Wartosci posrednie petli per miasto (do porownania z webem; web nie niesie ich w ticku).
#[derive(Debug, Clone, PartialEq)]
pub struct CityLoopDiag {
    pub city_id: String,
    pub is_capital: bool,
    pub dystans_od_stolicy: f64,
    pub liczba_miast: f64,
    pub strata_bazowa: f64,
    pub redukcja_budynkow: f64,
    pub strata_fraction: f64,
    pub n_worked: usize,
    pub ma_mennica: bool,
    pub waluta_odkryta: bool,
    /// Plony tuz po `cityYieldPerTurn` (przed mnoznikami Porzadku i cudami).
    pub y0: LoopYield,
    /// Plony po cudach (`yld`), z `yld.zywnosc` = bilans lokalny + cud.
    pub y1: LoopYield,
}

/// Wynik petli: `EconomyTickResult` (czesc petli miast) + wyniki faz zasobowej i zdrowia.
#[derive(Debug, Clone, PartialEq)]
pub struct AdvanceLoopOutcome {
    pub per_city: Vec<CityLoopTick>,
    pub cities: f64,
    pub total_praca: f64,
    pub total_pieniadz: f64,
    pub total_nauka: f64,
    pub total_luksus: f64,
    pub total_kultura: f64,
    pub total_zywnosc: f64,
    pub total_praca_pula: f64,
    /// Web `incomeByOwner` (`:2468`).
    pub income_by_owner: BTreeMap<i64, f64>,
    pub resources: AdvanceResourceOutcome,
    pub upkeep_health: UpkeepHealthOutcome,
    pub terrain: TerrainInputs,
    pub diag: Vec<CityLoopDiag>,
}

/// Plony miasta po `cityYieldPerTurn` (web `CityYieldResult`, pola mutowane przez petle).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LoopYield {
    pub praca: f64,
    pub pieniadz: f64,
    pub zywnosc: f64,
    pub nauka: f64,
    pub luksus: f64,
    pub kultura: f64,
}

/// JS prawdziwosc liczby (`if (x)`): niezerowa i nie `NaN`.
fn truthy(x: f64) -> bool {
    x != 0.0 && !x.is_nan()
}

/// Web `applyOrderYieldMults` (`:176`): mnozy tylko gdy mnoznik `!== 1` (NaN tez mnozy).
pub fn apply_order_yield_mults(yld: &mut LoopYield, m: &OrderYieldMults) {
    if m.production_mult != 1.0 {
        yld.praca *= m.production_mult;
    }
    if m.pieniadz_mult != 1.0 {
        yld.pieniadz *= m.pieniadz_mult;
    }
    if m.nauka_mult != 1.0 {
        yld.nauka *= m.nauka_mult;
    }
    if m.kultura_mult != 1.0 {
        yld.kultura *= m.kultura_mult;
    }
}

/// Web `applyWonderCityYields` (`:212`): flat bonusy cudow (`if (bonus.x)` = prawdziwosc JS).
pub fn apply_wonder_city_yields(yld: &mut LoopYield, bonus: Option<&WonderYieldBonus>) {
    let Some(b) = bonus else { return };
    if truthy(b.pieniadz) {
        yld.pieniadz += b.pieniadz;
    }
    if truthy(b.zywnosc) {
        yld.zywnosc += b.zywnosc;
    }
    if truthy(b.nauka) {
        yld.nauka += b.nauka;
    }
    if truthy(b.kultura) {
        yld.kultura += b.kultura;
    }
    if truthy(b.praca) {
        yld.praca += b.praca;
    }
}

/// Web `:2444-2454` (P12): wspolrzedne "stolicy" (pierwsze miasto wlasciciela w tablicy) i liczba miast.
pub fn capital_and_city_count_by_owner(
    cities: &[City],
) -> (BTreeMap<i64, (f64, f64)>, BTreeMap<i64, f64>) {
    let mut capital: BTreeMap<i64, (f64, f64)> = BTreeMap::new();
    let mut count: BTreeMap<i64, f64> = BTreeMap::new();
    for c in cities {
        capital.entry(c.owner_id).or_insert((c.q, c.r));
        *count.entry(c.owner_id).or_insert(0.0) += 1.0;
    }
    (capital, count)
}

/// Web `hexDistance` (`units/setup.ts:358`): `max(|dq|, |dr|, |ds|)`.
fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// Web `resolveCityPodzialHandlu` (`empire-handel-split.ts:21`).
pub fn resolve_city_podzial_handlu(
    city: &City,
    owner_default: Option<&CityPodzialHandlu>,
    params_fallback: &CityPodzialHandlu,
) -> CityPodzialHandlu {
    if city.podzial_handlu_override == Some(true) {
        if let Some(p) = city.podzial_handlu.as_ref() {
            return normalize_podzial_handlu(p);
        }
    }
    if let Some(d) = owner_default {
        return normalize_podzial_handlu(d);
    }
    if let Some(p) = city.podzial_handlu.as_ref() {
        return normalize_podzial_handlu(p);
    }
    normalize_podzial_handlu(params_fallback)
}

/// Surowy `econ-params.json` (`wealth`) -> `RawWealthParamsJson` (wiersz nie-obiekt = brak wartosci).
pub fn raw_wealth_from_value(econ: Option<&Value>) -> RawWealthParamsJson {
    let mut out = RawWealthParamsJson::default();
    let Some(group) = econ
        .and_then(|e| e.get("wealth"))
        .and_then(Value::as_object)
    else {
        return out;
    };
    for (k, row) in group {
        let cell = |d: &str| row.get(d).and_then(Value::as_f64);
        out.wealth.insert(
            k.clone(),
            RawWealthRow {
                easy: cell("easy"),
                normal: cell("normal"),
                hard: cell("hard"),
            },
        );
    }
    out
}

fn wealth_difficulty(difficulty: &str) -> crate::domain::turn_economy::gold_deficit::Difficulty {
    use crate::domain::turn_economy::gold_deficit::Difficulty as D;
    match difficulty {
        "easy" => D::Easy,
        "hard" => D::Hard,
        _ => D::Normal,
    }
}

fn game_difficulty(difficulty: &str) -> GameDifficulty {
    match difficulty {
        "easy" => GameDifficulty::Easy,
        "hard" => GameDifficulty::Hard,
        _ => GameDifficulty::Normal,
    }
}

/// Klucz `TerenBazowy` (web `types/hex.ts`) dla wiersza `terrain-yields.json` (kopia z `turn_economy_territory`).
fn terrain_web_key(t: TerrainType) -> &'static str {
    match t {
        TerrainType::Grassland => "laka",
        TerrainType::Plains => "rownina",
        TerrainType::Hills => "wzgorza",
        TerrainType::Mountains => "gory",
        TerrainType::ShallowWater => "plytkie_morze",
        TerrainType::Ocean => "morze",
        TerrainType::Desert => "pustynia",
        TerrainType::Tundra => "polarny",
    }
}

fn hex_like_of(hex: &BuildHex) -> HexLike {
    HexLike {
        ulepszenie: hex.ulepszenie.clone(),
        ulepszenia: hex.ulepszenia.clone(),
        nakladka: Some(hex.overlay),
        zloze: hex.zloze.clone(),
    }
}

/// Web `cityWorkedTilesForEconomy` (`:624-681`) zwracajaca HEKSY (centrum + przypisane pola);
/// kopia prywatnej funkcji z `turn_economy_territory`.
fn city_worked_hexes<'m>(
    city: &City,
    ctx: &TerrainContext<'m>,
    territory_nodes: &[TerritoryNode],
    exclude: Option<&BTreeSet<String>>,
    owner_era: Option<f64>,
) -> Vec<&'m BuildHex> {
    let map = ctx.map;
    let mut out = Vec::new();
    let key_of = |q: f64, r: f64| format!("{},{}", q as i32, r as i32);
    if let Some(h) = map.hex(&key_of(city.q, city.r)) {
        out.push(h);
    }
    let pop = {
        let f = city.population.floor();
        if f.is_nan() {
            f
        } else {
            f.max(0.0)
        }
    };
    if pop <= 0.0 {
        return out;
    }
    let radius = city_range_for_population(pop);
    let yield_of = |q: i32, r: i32| -> OkolicaYield {
        match map.hex(&format!("{q},{r}")) {
            None => OkolicaYield::default(),
            Some(h) => {
                let y = crate::domain::turn_economy_territory::hex_tile_yield(
                    ctx.terrain_yields,
                    h,
                    owner_era,
                );
                OkolicaYield {
                    zywnosc: y.zywnosc,
                    praca: y.praca,
                    handel: y.handel,
                }
            }
        }
    };
    let land = |q: i32, r: i32| is_land_workable_hex(map, q, r);
    let assigned = resolve_worked_tiles(
        &crate::domain::turn_economy_territory::okolica_city_of(city),
        map,
        &yield_of,
        &ResolveWorkedTilesOpts {
            radius: Some(radius),
            territory_nodes: Some(territory_nodes),
            owner_id: Some(city.owner_id),
            is_workable: Some(&land),
            exclude_hex_keys: exclude,
            ..ResolveWorkedTilesOpts::default()
        },
    );
    for t in assigned {
        if let Some(h) = map.hex(&t.key) {
            out.push(h);
        }
    }
    out
}

fn econ_food_buffer(b: Option<FoodBuffer>) -> EconFoodBuffer {
    match b {
        Some(FoodBuffer::Number(v)) => EconFoodBuffer::Num(v),
        Some(FoodBuffer::Legacy { aktualny }) => EconFoodBuffer::Obj { aktualny },
        Some(FoodBuffer::Other) | None => EconFoodBuffer::Other,
    }
}

fn yield_params(p: &EconParams) -> CityYieldParams {
    CityYieldParams {
        head: CityYieldHeadParams {
            budynek_mlyn_mnoznik_pracy: p.budynek_mlyn_mnoznik_pracy,
            budynek_mlyn_bonus_pracy: p.budynek_mlyn_bonus_pracy,
            budynek_cegielni_bonus_pracy: p.budynek_cegielnia_bonus_pracy,
        },
        tail: CityYieldTailParams {
            korupcja_cap: p.korupcja_cap,
            mennica_mnoznik_po_walucie: p.mennica_mnoznik_po_walucie,
            biblioteka_bonus_nauki: p.budynek_biblioteka_bonus_nauki,
            akademia_bonus_nauki: p.budynek_akademia_bonus_nauki,
            garncarnia_bonus_zywnosci: p.budynek_garncarnia_bonus_zywnosci,
            zywnosc_zuzytka_populacja: p.zywnosc_zuzytka_populacja,
        },
    }
}

/// Wejscia petli miast ponad wejsciami faz zasobowej i zdrowia.
pub struct AdvanceLoopInput<'a> {
    pub maps: CityLoopMaps<'a>,
    pub data: CityLoopData<'a>,
}

/// PRODUKCYJNY WYWOLUJACY petli miast `advanceCityEconomy` (patrz doc modulu).
/// `input.territory_resource_by_city` / `worked_magazyn_by_city` sa ignorowane (liczone z mapy).
#[allow(clippy::needless_range_loop)] // indeks `i` laczy `cities`, `resources.per_city` i `zdrowie_by_city`
pub fn advance_city_economy_loop(
    cities: &mut [City],
    extras: &mut BTreeMap<String, CityLoopExtra>,
    terrain: &TerrainContext<'_>,
    input: &AdvanceCityEconomyInput<'_>,
    upkeep_extra: &UpkeepHealthInput<'_>,
    lp: &AdvanceLoopInput<'_>,
) -> AdvanceLoopOutcome {
    let null = Value::Null;
    let raw = input.econ_params.unwrap_or(&null);
    let params = load_econ_params(raw, input.difficulty);
    let yparams = yield_params(&params);

    // `:2296` - wezly terytorium PRZED reconcile (reconcile jest w fazie zasobowej).
    let territory_nodes = territory_nodes_of(cities);
    // P12 `:2444-2454`.
    let (capital_coords, city_count) = capital_and_city_count_by_owner(cities);

    // Faza zasobowa (`:2476-2500`) + drenaz Mennicy + reconcile; zdrowie (`:2519-2527`).
    let (resources, terrain_inputs) =
        advance_city_economy_resources_with_map(cities, terrain, input);
    let upkeep_health = advance_city_economy_upkeep_health(
        cities,
        terrain,
        input,
        &resources.per_city,
        upkeep_extra,
    );

    let wealth_base: WealthParams = load_wealth_params(
        &raw_wealth_from_value(input.econ_params),
        wealth_difficulty(input.difficulty),
    );
    let regen_params = load_manpower_regen_params(None);
    let growth_difficulty = game_difficulty(input.difficulty);
    let matrix = lp.data.matrix;
    let maps = &lp.maps;
    let zloto = input.resolvers.owner_zloto_access;
    let tick_resolvers = || ResourceTickResolvers {
        owner_active_labels: input.resolvers.owner_active_labels,
        owner_zloto_access: Some(zloto),
    };
    let gate_store: Vec<Option<Vec<(String, String)>>> = lp
        .data
        .buildings
        .iter()
        .map(|b| {
            b.poziom_tech_gate
                .as_ref()
                .map(|g| g.iter().map(|(k, v)| (k.clone(), v.clone())).collect())
        })
        .collect();
    let catalog: Vec<BuildingLevelCatalogEntry<'_>> = lp
        .data
        .buildings
        .iter()
        .zip(&gate_store)
        .map(|(b, gate)| BuildingLevelCatalogEntry {
            id: b.id.as_str(),
            epoka_wejscia: b.epoka_wejscia as f64,
            maks_poziom: b.maks_poziom as f64,
            poziom_tech_gate: gate.as_deref(),
        })
        .collect();

    let mut out = AdvanceLoopOutcome {
        per_city: Vec::with_capacity(cities.len()),
        cities: 0.0,
        total_praca: 0.0,
        total_pieniadz: 0.0,
        total_nauka: 0.0,
        total_luksus: 0.0,
        total_kultura: 0.0,
        total_zywnosc: 0.0,
        total_praca_pula: 0.0,
        income_by_owner: BTreeMap::new(),
        resources: resources.clone(),
        upkeep_health: upkeep_health.clone(),
        terrain: terrain_inputs.clone(),
        diag: Vec::with_capacity(cities.len()),
    };
    let mut capital_seen: BTreeSet<i64> = BTreeSet::new();
    let handel_fallback = CityPodzialHandlu {
        procent_nauka: params.suwak_handel_nauka_default,
        procent_pieniadz: params.suwak_handel_pieniadz,
        procent_luksus: params.suwak_handel_luksus,
    };
    let praca_fallback = CityPodzialPracy {
        procent_budynki: params.suwak_praca_budynki,
    };

    for i in 0..cities.len() {
        let owner_id = cities[i].owner_id;
        let city_id = cities[i].id.clone();
        let is_capital = !capital_seen.contains(&owner_id);
        capital_seen.insert(owner_id);

        let worked = city_worked_hexes(
            &cities[i],
            terrain,
            &territory_nodes,
            terrain_inputs.lost_to_sibling_by_city.get(&city_id),
            Some(owner_era_for(input, owner_id)),
        );
        let keys_store: Vec<Vec<String>> = worked
            .iter()
            .map(|h| improvement_keys_for_hex(&hex_like_of(h)))
            .collect();
        let tiles: Vec<WorkedTileImpInput<'_>> = worked
            .iter()
            .zip(&keys_store)
            .map(|(h, keys)| WorkedTileImpInput {
                teren_bazowy: terrain_web_key(h.terrain),
                nakladka: h.overlay.web_value(),
                ma_rzeke: h.river_present,
                ulepszenia_keys: if keys.is_empty() { None } else { Some(keys) },
                ulepszenie_key: keys.first().map(String::as_str),
                zloze: h.zloze.as_deref(),
                wlasciciel_era: Some(owner_era_for(input, owner_id)),
            })
            .collect();

        let built_ids: &[String] = input
            .built_by_city
            .get(&city_id)
            .map(Vec::as_slice)
            .unwrap_or(&[]);
        let stock_override = input.resolvers.owner_empire_stock.map(|f| f(owner_id));
        let runtime = runtime_active_built_ids_for_city(
            built_ids,
            owner_id,
            &tick_resolvers(),
            stock_override.as_ref(),
        );
        let view = &resources.per_city[i];
        let spichlerz_state = SpichlerzCityBonusState {
            ceramika_active: view.spichlerz_ceramika,
            sol_active: view.spichlerz_sol,
            ma_spichlerz_pop: view.ma_spichlerz,
            ma_spichlerz_ii_pop: view.ma_spichlerz_ii,
        };
        let growth_spichlerz = GrowthSpichlerz {
            ceramika_active: spichlerz_state.ceramika_active,
            sol_active: spichlerz_state.sol_active,
            ma_spichlerz_pop: spichlerz_state.ma_spichlerz_pop,
            ma_spichlerz_ii_pop: spichlerz_state.ma_spichlerz_ii_pop,
        };
        let garncarnia_zadowolenie = view.garncarnia_surplus_zadowolenie;
        let zdrowie = upkeep_health.zdrowie_by_city[i].1;
        let ma_spichlerz_ii = spichlerz_state.ma_spichlerz_ii_pop;
        let ma_spichlerz = spichlerz_state.ma_spichlerz_pop;
        let poziom_racji = get_city_ration_level(&cities[i]);
        let owner_civ_key: Option<&str> = maps
            .owner_civ_by_owner_id
            .get(&owner_id)
            .map(String::as_str);

        // `toEconomyCity` (`:956`): rozwiazanie podzialow Handlu i Pracy.
        let podzial_handlu = resolve_city_podzial_handlu(
            &cities[i],
            maps.owner_default_podzial_handlu_by_owner.get(&owner_id),
            &handel_fallback,
        );
        let podzial_pracy = resolve_city_podzial_pracy(
            &cities[i],
            maps.owner_default_podzial_pracy_by_owner.get(&owner_id),
            Some(&praca_fallback),
        );

        let owner_era = owner_era_for(input, owner_id);
        let owner_tech: BTreeSet<String> = match input.resolvers.owner_tech {
            Some(f) => f(owner_id),
            None => input.player_zbadane.clone(),
        };
        let waluta_odkryta = owner_tech.contains("Waluta") || owner_tech.contains("waluta");
        let ma_mennica_built = resources.mennica_owners.contains(&owner_id);
        let ma_mennica = ma_mennica_built && zloto(owner_id);

        let dystans = match capital_coords.get(&owner_id) {
            Some(&(cq, cr)) if !is_capital => hex_distance(cities[i].q, cities[i].r, cq, cr),
            _ => 0.0,
        };
        let liczba_miast = city_count.get(&owner_id).copied().unwrap_or(1.0);
        let strata_bazowa = corruption_rate(
            dystans,
            liczba_miast,
            CorruptionParams {
                wspolczynnik_dystansu: params.korupcja_wspolczynnik_dystansu,
                wspolczynnik_miast: params.korupcja_wspolczynnik_miast,
                cap: params.korupcja_cap,
            },
        );
        let built_refs: Vec<&str> = built_ids.iter().map(String::as_str).collect();
        let redukcja = corruption_building_reduction(&built_refs);
        let strata_fraction = strata_bazowa * (1.0 - redukcja);
        let has = |id: &str| runtime.iter().any(|x| x == id);

        let yield_built_ids = built_ids_for_spichlerz_yields(&runtime, &spichlerz_state);
        let yield_refs: Vec<&str> = yield_built_ids.iter().map(String::as_str).collect();
        let unlocked: HashSet<String> = owner_tech.iter().cloned().collect();
        let entries =
            city_building_entries_from_built_ids(&yield_refs, &catalog, owner_era, Some(&unlocked));
        let buildings: Vec<CityBuildingFullInput<'_>> = entries
            .iter()
            .map(|e| {
                let b = &lp.data.buildings[e.catalog_index];
                CityBuildingFullInput {
                    base: CityBuildingInput {
                        id: b.id.as_str(),
                        level: e.level,
                        baza: BuildingYieldsInput {
                            praca: b.baza.praca as f64,
                            pieniadz: b.baza.pieniadz as f64,
                            zywnosc: b.baza.zywnosc as f64,
                            nauka: b.baza.nauka as f64,
                            kultura: b.baza.kultura as f64,
                        },
                        przyrost: BuildingYieldsInput {
                            praca: b.przyrost.praca as f64,
                            pieniadz: b.przyrost.pieniadz as f64,
                            zywnosc: b.przyrost.zywnosc as f64,
                            nauka: b.przyrost.nauka as f64,
                            kultura: b.przyrost.kultura as f64,
                        },
                    },
                    daje_szczescie: b.daje_szczescie,
                    baza_zadowolenie: Some(b.baza.zadowolenie as f64),
                    przyrost_zadowolenie: b.przyrost.zadowolenie as f64,
                }
            })
            .collect();

        let cy_input = CityYieldInput {
            civ_key: owner_civ_key,
            ludnosc: cities[i].population,
            procent_nauka: podzial_handlu.procent_nauka,
            procent_pieniadz: podzial_handlu.procent_pieniadz,
            procent_luksus: podzial_handlu.procent_luksus,
            poborca_count: 0,
            praca_terenu: 0.0,
            handel_terenu: 0.0,
            zywnosc_terenu: 0.0,
            praca_budynkow: 0.0,
            pieniadz_budynkow: 0.0,
            pieniadz_portu: 0.0,
            zywnosc_budynkow: 0.0,
            nauka_budynkow: 0.0,
            kultura_budynkow: 0.0,
            ma_mlyn: has("mlyn"),
            ma_cegielnia: has("cegielnia"),
            strata_fraction,
            waluta_odkryta,
            ma_mennica,
            ma_biblioteka: has("biblioteka"),
            ma_akademia: has("akademia"),
            civ_handel_mult: Some(1.0),
            premia_handlu_tras: Some(
                maps.trade_route_building_bonus_by_city
                    .get(&city_id)
                    .copied()
                    .unwrap_or(0.0),
            ),
            additional_tax: Some(
                maps.manual_work_tax_by_city
                    .get(&city_id)
                    .copied()
                    .unwrap_or(0.0),
            ),
            civ_nauka_mult: Some(1.0),
            liczba_garncarni: Some(runtime.iter().filter(|x| *x == "garncarnia").count() as f64),
            wojsko_zuzycie_zywnosci: 0.0,
        };
        let cy = city_yield_per_turn_from_worked_imp(
            matrix,
            terrain.terrain_yields,
            &yparams,
            &cy_input,
            &tiles,
            &buildings,
        );
        let mut yld = LoopYield {
            praca: cy.praca,
            pieniadz: cy.pieniadz,
            zywnosc: cy.zywnosc,
            nauka: cy.nauka,
            luksus: cy.luksus,
            kultura: cy.kultura,
        };
        let y0 = yld;
        if let Some(m) = maps.order_mult_by_city.get(&city_id) {
            apply_order_yield_mults(&mut yld, m);
        }
        yld.praca = city_praca_integer(yld.praca);
        let zywnosc_brutto = cy.zywnosc_brutto;
        let (koszt_racji, bilans_lokalny, poziom_racji_bal) = compute_city_food_balance_v85(
            zywnosc_brutto,
            cities[i].population,
            &cities[i],
            Some(&growth_spichlerz),
            owner_era,
        );
        yld.zywnosc = bilans_lokalny;
        apply_wonder_city_yields(&mut yld, maps.wonder_city_yields_by_owner.get(&owner_id));
        out.diag.push(CityLoopDiag {
            city_id: city_id.clone(),
            is_capital,
            dystans_od_stolicy: dystans,
            liczba_miast,
            strata_bazowa,
            redukcja_budynkow: redukcja,
            strata_fraction,
            n_worked: worked.len(),
            ma_mennica,
            waluta_odkryta,
            y0,
            y1: yld,
        });

        // P18 Wealth (`:2625-2662`).
        let wealth_civ_key = owner_civ_key;
        let city_wealth_params = {
            let m = wealth_params_for_owner(
                matrix,
                WealthModParams {
                    cap_na_epoke: wealth_base.cap_na_epoke,
                    mnoznik_na_poziom: wealth_base.mnoznik_na_poziom,
                },
                wealth_civ_key,
            );
            WealthParams {
                cap_na_epoke: m.cap_na_epoke,
                mnoznik_na_poziom: m.mnoznik_na_poziom,
                ..wealth_base
            }
        };
        let prev_wealth = match cities[i].wealth_state {
            Some(w) => WealthState {
                poziom: w.poziom,
                pula: w.pula,
            },
            None => {
                let f = city_fresh_wealth_state();
                WealthState {
                    poziom: f.poziom,
                    pula: f.pula,
                }
            }
        };
        let wealth_immunity = cities[i].wealth_immunity_remaining.unwrap_or(0.0) > 0.0;
        let wt = advance_wealth(
            prev_wealth,
            yld.luksus,
            yld.pieniadz,
            owner_era,
            city_wealth_params,
            if wealth_immunity { Some(1.0) } else { None },
        );
        if wealth_immunity {
            if let Some(r) = cities[i].wealth_immunity_remaining {
                cities[i].wealth_immunity_remaining = Some(js_max(0.0, r - 1.0));
            }
        }
        cities[i].wealth_state = Some(CityWealthState {
            poziom: wt.poziom,
            pula: wt.pula,
        });
        let pieniadz_po_wealth = (yld.pieniadz * wt.mnoznik).floor();
        let pieniadz_z_tras = route_cash_for_city(
            matrix,
            maps.trade_income_by_city
                .get(&city_id)
                .copied()
                .unwrap_or(0.0),
            maps.maritime_trade_income_by_city
                .get(&city_id)
                .copied()
                .unwrap_or(0.0),
            owner_civ_key,
        );
        let split = split_praca(yld.praca, podzial_pracy.procent_budynki / 100.0);
        let extra = extras.get(&city_id).copied().unwrap_or_default();
        let procent_rozwoj =
            crate::domain::civ_matrix::js_compat::js_math_round((poziom_racji / 6.0) * 100.0);

        // P19 galaz oblezenia (`:2664-2735`).
        if extra.oblegane {
            let garnizon = match extra.garnizon {
                Some(g) if g > 0.0 => g,
                _ => 0.0,
            };
            let zuzycie = cities[i].population + garnizon;
            let przed = read_city_food_buffer(econ_food_buffer(cities[i].magazyn_zywnosci));
            let po_turze = js_max(0.0, przed - zuzycie);
            let glod = po_turze <= 0.0;
            cities[i].magazyn_zywnosci = Some(FoodBuffer::Number(po_turze));
            let tick = CityLoopTick {
                city_id: city_id.clone(),
                owner_id,
                owner_era,
                praca: yld.praca,
                pieniadz: pieniadz_po_wealth + pieniadz_z_tras,
                pieniadz_brutto: yld.pieniadz,
                zywnosc_netto: 0.0,
                nauka: yld.nauka,
                luksus: yld.luksus,
                kultura: yld.kultura,
                ludnosc_przed: cities[i].population,
                ludnosc_po: cities[i].population,
                wzrost: false,
                ubytek: false,
                zdrowie,
                do_budynkow: split.do_budynkow,
                do_puli: split.do_puli,
                wealth_mnoznik: wt.mnoznik,
                wealth_zadowolenie: wt.zadowolenie,
                garncarnia_surplus_zadowolenie: garncarnia_zadowolenie,
                pieniadz_z_pracy: cy.pieniadz_z_pracy,
                pieniadz_z_tras,
                oblegany: true,
                oblegany_glod: glod,
                magazyn_po_turze: po_turze,
                ma_spichlerz,
                ma_spichlerz_ii,
                spichlerz_ceramika: spichlerz_state.ceramika_active,
                spichlerz_sol: spichlerz_state.sol_active,
                procent_rozwoj,
                zywnosc_brutto: 0.0,
                koszt_racji: 0.0,
                bilans_lokalny: 0.0,
                poziom_racji,
                wzrost_procent: None,
                wzrost_ulamkowy_po: None,
            };
            *out.income_by_owner.entry(owner_id).or_insert(0.0) += tick.pieniadz;
            out.cities += 1.0;
            out.total_praca += yld.praca;
            out.total_pieniadz += tick.pieniadz;
            out.total_nauka += yld.nauka;
            out.total_luksus += yld.luksus;
            out.total_kultura += yld.kultura;
            out.total_zywnosc += 0.0;
            out.total_praca_pula += split.do_puli;
            out.per_city.push(tick);
            continue;
        }

        // Normalna sciezka (`:2738-2800`).
        let before = cities[i].population;
        let growth_preview = compute_growth_percent_v85(&GrowthPercentInput {
            population: cities[i].population,
            poziom_racji: poziom_racji_bal,
            zdrowie,
            szczescie_netto: compute_growth_happiness_netto(
                wt.zadowolenie,
                garncarnia_zadowolenie > 0.0,
                ma_spichlerz || ma_spichlerz_ii,
            ),
            wealth_poziom: wt.poziom,
            spichlerz_state: growth_spichlerz,
            civ_key: owner_civ_key.map(str::to_owned),
            difficulty: Some(growth_difficulty),
            ration_params: upkeep_health.params.ration,
            citizen_resource_growth_pct: None,
            population_matrix: None,
        });

        // P20 manpower (`:2750-2773`).
        let civ_for_matrix = owner_civ_key.filter(|k| !k.is_empty());
        let mp_mults = civ_manpower_matrix_mults(None, civ_for_matrix.map(|k| (matrix, k)));
        let mut mp_city = ManpowerCity {
            id: city_id.clone(),
            owner_id,
            population: cities[i].population,
            manpower: extra.manpower,
            q: cities[i].q as i32,
            r: cities[i].r as i32,
            oblegane: Some(extra.oblegane),
        };
        if mp_city.manpower.is_none() {
            mp_city.manpower = Some(city_manpower_max(
                cities[i].population,
                owner_era,
                mp_mults.max_mult,
            ));
        }
        let new_mp = tick_manpower_regen(
            &mp_city,
            owner_era,
            &regen_params,
            mp_mults.regen_mult,
            mp_mults.max_mult,
        );
        extras.entry(city_id.clone()).or_default().manpower = Some(new_mp);

        let magazyn_po_turze = cities[i].wzrost_ulamkowy.unwrap_or(0.0);
        let income = out.income_by_owner.entry(owner_id).or_insert(0.0);
        *income = *income + pieniadz_po_wealth + pieniadz_z_tras;

        let tick = CityLoopTick {
            city_id: city_id.clone(),
            owner_id,
            owner_era,
            praca: yld.praca,
            pieniadz: pieniadz_po_wealth + pieniadz_z_tras,
            pieniadz_brutto: yld.pieniadz,
            zywnosc_netto: bilans_lokalny,
            nauka: yld.nauka,
            luksus: yld.luksus,
            kultura: yld.kultura,
            ludnosc_przed: before,
            ludnosc_po: before,
            wzrost: false,
            ubytek: false,
            zdrowie,
            do_budynkow: split.do_budynkow,
            do_puli: split.do_puli,
            wealth_mnoznik: wt.mnoznik,
            wealth_zadowolenie: wt.zadowolenie,
            garncarnia_surplus_zadowolenie: garncarnia_zadowolenie,
            pieniadz_z_pracy: cy.pieniadz_z_pracy,
            pieniadz_z_tras,
            oblegany: false,
            oblegany_glod: false,
            magazyn_po_turze,
            ma_spichlerz,
            ma_spichlerz_ii,
            spichlerz_ceramika: spichlerz_state.ceramika_active,
            spichlerz_sol: spichlerz_state.sol_active,
            procent_rozwoj,
            zywnosc_brutto,
            koszt_racji,
            bilans_lokalny,
            poziom_racji,
            wzrost_procent: Some(growth_preview.total),
            wzrost_ulamkowy_po: Some(cities[i].wzrost_ulamkowy.unwrap_or(0.0)),
        };
        out.cities += 1.0;
        out.total_praca += yld.praca;
        out.total_pieniadz += tick.pieniadz;
        out.total_nauka += yld.nauka;
        out.total_luksus += yld.luksus;
        out.total_kultura += yld.kultura;
        out.total_zywnosc += bilans_lokalny;
        out.total_praca_pula += split.do_puli;
        out.per_city.push(tick);
    }
    out
}
