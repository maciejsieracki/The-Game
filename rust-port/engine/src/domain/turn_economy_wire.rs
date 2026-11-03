//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1: WIAZANIE `advance_city_economy` z petla tury gry, 1:1 z miejscem
//! wywolania weba (pin `4bbef081d`, `gra/src/main.ts:34417-34578` wejscia + wywolanie, `:35045-35131` bankowanie).
//!
//! [`run_economy_tick_for_game`] odtwarza w kolejnosci weba: odswiezone trasy handlowe -> dochod z tras
//! (`turn_economy_inputs_trade`) -> reczny podatek z Pracy -> lask Mennicy `prepare` -> resolvery (memoizowane
//! per owner przy PIERWSZYM wolaniu = migawka sprzed drenazu, Z-Q5-1) -> `advance_city_economy` -> `finalize` lask
//! (na stanie PO ticku, jak web) -> bankowanie per owner ([`OwnerBank`]) wraz z odjeciem utrzymania surowcowego
//! od zapasow miast (`deductBuildingStockCostAcrossCities`).
//!
//! RELACJA DO `turn_economy.rs` (`settle_turn`/`resolve_turn`, `u64`): INNY kontrakt (pula Pracy `u64`, brak
//! wolajacego); to NIE jest odpowiednik `advanceCityEconomy`. Wiazanie NIE mapuje na `EconomyBalances`:
//! skarbiec/nauka weba to `f64` per owner moga schodzic ponizej 0 (`main.ts:35061`, komentarz `:35131`), a `u64`
//! tego nie wyraza (Z-Q6-1). Bankowanie zwraca skladniki, a [`OwnerBank::apply_treasury`] odtwarza kolejnosc
//! dzialan zmiennoprzecinkowych weba (`+= dochod; -= utrzymanie`).
//!
//! ZALOZENIA (do akceptacji): Z-Q6-1 (powyzej); Z-Q6-2 `growthMultByCity`, `wzrostLudnosciPace`,
//! `cityReligionByCityId` to MARTWE parametry `advanceCityEconomy` (wystepuja tylko w sygnaturze,
//! `turn-economy.ts:2256`, `:2264`, `:2269`; grep po ciele `:2250-2913` = 0 uzyc) - wiazanie ich nie przyjmuje;
//! Z-Q6-3 `heal` (`manpowerHeal`) i `owner_*` resolvery dostarcza wolajacy (zob. dlug -Q7).

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

use serde_json::Value;

use crate::data::buildings_tech::{Building, Wonders};
use crate::data::civilizations::CivMatrixFile;
use crate::domain::building_costs::p6_7b::{
    deduct_building_stock_cost_across_cities, owner_resource_stock_all, StockRecord,
};
use crate::domain::economy_city_params::load_econ_params;
use crate::domain::resource_access::owner_has_zloto_stock;
use crate::domain::terrain::city_founding::p6_6b::cities::{
    City, CityPodzialHandlu, CityPodzialPracy,
};
use crate::domain::trade::{TradeRoute, TradeRouteMedium};
use crate::domain::turn_economy::economy_upkeep_p2::UnitRow;
use crate::domain::turn_economy_advance::{
    AdvanceCityEconomyInput, AdvanceResolvers, UpkeepHealthInput,
};
use crate::domain::turn_economy_attrition::AttritionUnit;
use crate::domain::turn_economy_empirefood::{
    run_empire_food_block, EmpireFoodBlockCtx, EmpireFoodBlockOutcome, EmpireFoodBlockState,
    FoodUnit,
};
use crate::domain::turn_economy_inputs_state::{
    build_manual_work_tax_by_city, finalize_mennica_zloto_grace_after_tick,
    owner_zloto_access_for_mennica, prepare_mennica_zloto_grace_for_tick, MennicaZlotoGraceState,
};
use crate::domain::turn_economy_inputs_trade::{
    build_trade_tick_inputs, load_pin_trade_income_params,
};
use crate::domain::turn_economy_inputs_wonders::{
    build_wonder_city_yields_by_owner_map, sum_wonder_trade_route_bonus_for_owner,
    wonder_ids_owned_by, PlacedWonderRef,
};
use crate::domain::turn_economy_loop::{
    AdvanceLoopInput, CityLoopData, CityLoopExtra, CityLoopMaps, OrderYieldMults,
};
use crate::domain::turn_economy_territory::TerrainContext;
use crate::domain::turn_economy_tick::{
    advance_city_economy, AdvanceTickOutcome, EconUnit, EconomyTickResult, HealRequest,
};

/// Web `OwnerEconomySum` (`turn-economy.ts:1151-1159`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct OwnerEconomySum {
    pub pieniadz: f64,
    pub nauka: f64,
    pub do_puli: f64,
    pub praca: f64,
    pub kultura: f64,
    pub pieniadz_z_tras: f64,
}

/// Web `sumEconomyForOwner` (`:1161-1186`): suma po `tk.ownerId`.
pub fn sum_economy_for_owner(result: &EconomyTickResult, owner_id: i64) -> OwnerEconomySum {
    let mut s = OwnerEconomySum::default();
    for tk in &result.per_city {
        if tk.owner_id != owner_id {
            continue;
        }
        s.pieniadz += tk.pieniadz;
        s.nauka += tk.nauka;
        s.do_puli += tk.do_puli;
        s.praca += tk.praca;
        s.kultura += tk.kultura;
        s.pieniadz_z_tras += tk.pieniadz_z_tras;
    }
    s
}

/// Web `sumEconomyForPlayerCities` (`:1190-1216`): suma po miastach, ktore NALEZA do ownera w `cities`.
pub fn sum_economy_for_player_cities(
    result: &EconomyTickResult,
    cities: &[City],
    owner_id: i64,
) -> OwnerEconomySum {
    let ids: BTreeSet<&str> = cities
        .iter()
        .filter(|c| c.owner_id == owner_id)
        .map(|c| c.id.as_str())
        .collect();
    let mut s = OwnerEconomySum::default();
    for tk in &result.per_city {
        if !ids.contains(tk.city_id.as_str()) {
            continue;
        }
        s.pieniadz += tk.pieniadz;
        s.nauka += tk.nauka;
        s.do_puli += tk.do_puli;
        s.praca += tk.praca;
        s.kultura += tk.kultura;
        s.pieniadz_z_tras += tk.pieniadz_z_tras;
    }
    s
}

/// Bankowanie jednego ownera po ticku (`main.ts:35045-35131`).
#[derive(Debug, Clone, PartialEq)]
pub struct OwnerBank {
    pub owner_id: i64,
    pub is_human: bool,
    pub sum: OwnerEconomySum,
    /// `utrzymanieRazem` odjete od skarbca (web odejmuje tylko gdy `> 0`); `0.0` gdy nie odjeto.
    pub upkeep_applied: f64,
    pub deficyt: bool,
    /// Utrzymanie surowcowe odjete od zapasow miast (`resourceUpkeepByOwner`); puste = brak odjecia.
    pub resource_upkeep_deducted: BTreeMap<String, f64>,
}

impl OwnerBank {
    /// `skarbiec += pieniadz; skarbiec -= utrzymanieRazem` (kolejnosc dzialan f64 jak w `main.ts:35061-35067`
    /// i `:35121-35123`).
    pub fn apply_treasury(&self, before: f64) -> f64 {
        let mut s = before + self.sum.pieniadz;
        if self.upkeep_applied > 0.0 {
            s -= self.upkeep_applied;
        }
        s
    }

    /// Fotel czlowieka: `nauka += nauka` (`:35062`); AI: `pula + nauka + bonus trudnosci` (`:35149-35152`).
    pub fn apply_science(&self, before: f64, ai_difficulty_bonus: f64) -> f64 {
        if self.is_human {
            before + self.sum.nauka
        } else {
            before + self.sum.nauka + ai_difficulty_bonus
        }
    }
}

/// Wynik wiazania.
#[derive(Debug, Clone, PartialEq)]
pub struct GameEconomyTickOutcome {
    pub tick: AdvanceTickOutcome,
    /// Fotele czlowieka (kolejnosc rosnaca), potem AI (kolejnosc pierwszego wystapienia miasta).
    pub banks: Vec<OwnerBank>,
    /// `ownerIdsOnMap()` uzyte do lask Mennicy.
    pub map_owner_ids: Vec<i64>,
    /// Wynik bloku EmpireFood (`main.ts:34594-34850`); `None` gdy wolajacy go nie podal
    /// ([`run_economy_tick_for_game`]).
    pub empire_food: Option<EmpireFoodBlockOutcome>,
}

/// Wejscia bloku EmpireFood uzupelniajace [`GameEconomyContext`] (R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1).
pub struct EmpireFoodWireInput<'a> {
    /// Migawka `econUnits` z poczatku tury.
    pub econ_units: &'a [FoodUnit],
    /// `typCityCopyOwners`.
    pub typ_city_copy_owners: &'a BTreeSet<i64>,
    /// `unitHealth(data.units.find(...) ?? {})`.
    pub unit_health_by_type: &'a dyn Fn(&str) -> f64,
    /// `effectiveRuntimeUnitMaxHp(u)`.
    pub runtime_max_hp: &'a dyn Fn(&AttritionUnit) -> f64,
    pub state: EmpireFoodBlockState<'a>,
}

/// Wejscia wiazania: stan gry + dane statyczne + resolvery, ktore web czerpie ze stanu poza ekonomia.
pub struct GameEconomyContext<'a> {
    pub difficulty: &'a str,
    pub player_era: f64,
    pub player_zbadane: &'a BTreeSet<String>,
    /// `data.econParams`.
    pub econ_params: &'a Value,
    pub terrain: &'a TerrainContext<'a>,
    pub matrix: &'a CivMatrixFile,
    pub buildings: &'a [Building],
    pub unit_rows: &'a [UnitRow],
    pub society_params: Option<&'a Value>,
    pub wonders: &'a Wonders,
    // ---- stan gry ----
    pub built_by_city: &'a BTreeMap<String, Vec<String>>,
    pub owner_civ_by_owner_id: &'a BTreeMap<i64, String>,
    pub order_mult_by_city: &'a BTreeMap<String, OrderYieldMults>,
    pub owner_default_podzial_handlu_by_owner: &'a BTreeMap<i64, CityPodzialHandlu>,
    pub owner_default_podzial_pracy_by_owner: &'a BTreeMap<i64, CityPodzialPracy>,
    /// `tradeRoutes` po `recomputeTradeRoutesNow` (odswiezenie tras = dlug -Q7).
    pub trade_routes: &'a [TradeRoute],
    pub placed_wonders: &'a [PlacedWonderRef],
    pub pending_manual_work_tax_by_owner: &'a BTreeMap<i64, f64>,
    pub capital_city_id_by_owner: &'a BTreeMap<i64, String>,
    pub human_owner_ids: &'a BTreeSet<i64>,
    pub econ_units: &'a [EconUnit],
    // ---- resolvery weba ----
    /// `empireEpochForOwner`.
    pub owner_era: &'a dyn Fn(i64) -> f64,
    /// `unlockedTechSetForOwner`.
    pub owner_tech: &'a dyn Fn(i64) -> BTreeSet<String>,
    /// `ownerHasNativeResourceAccess(o,'zloto') || hasTradeRouteResourceAccess(grants,o,'zloto')` (`main.ts:5180-5184`);
    /// czesc "zapas w skarbcu" liczy wiazanie.
    pub native_zloto_access: &'a dyn Fn(i64) -> bool,
    /// `empireActiveResourceLabelsForOwner` (przed dopisaniem `Zloto`).
    pub empire_active_labels: &'a dyn Fn(i64) -> Vec<String>,
}

const BARBARIAN_OWNER_ID: i64 = -1;
const REBEL_FACTION_OWNER_ID: i64 = -99;

/// Web `ownerIdsOnMap` (`main.ts:5197`): unikalne ownerId z miast w kolejnosci pierwszego wystapienia.
pub fn owner_ids_on_map(cities: &[City]) -> Vec<i64> {
    let mut seen = BTreeSet::new();
    let mut out = Vec::new();
    for c in cities {
        if seen.insert(c.owner_id) {
            out.push(c.owner_id);
        }
    }
    out
}

/// Odpowiednik bloku `main.ts:34417-34578` + `:35045-35131`. Mutuje `cities` (tick + odjecie utrzymania
/// surowcowego), `extras` i stan lask Mennicy. `heal = None` oznacza brak `manpowerHeal`.
pub fn run_economy_tick_for_game(
    cities: &mut [City],
    extras: &mut BTreeMap<String, CityLoopExtra>,
    grace: &mut MennicaZlotoGraceState,
    ctx: &GameEconomyContext<'_>,
    heal: Option<HealRequest<'_>>,
) -> GameEconomyTickOutcome {
    run_economy_tick_for_game_with_food(cities, extras, grace, ctx, heal, None)
}

/// Jak [`run_economy_tick_for_game`], ale z blokiem EmpireFood/auto-racje/atrycja MIEDZY tickiem a bankowaniem
/// (`main.ts:34594-34850`), czyli w kolejnosci weba. `food = None` odtwarza dawne zachowanie.
pub fn run_economy_tick_for_game_with_food(
    cities: &mut [City],
    extras: &mut BTreeMap<String, CityLoopExtra>,
    grace: &mut MennicaZlotoGraceState,
    ctx: &GameEconomyContext<'_>,
    heal: Option<HealRequest<'_>>,
    food: Option<EmpireFoodWireInput<'_>>,
) -> GameEconomyTickOutcome {
    // `HealRequest<'a>` jest inwariantne w `'a` (`&'a mut dyn FnMut + 'a`); przepozyczamy na lokalny, krotszy zakres.
    let mut heal = heal;
    let heal_local = heal.as_mut().map(|h| HealRequest {
        units: &mut *h.units,
        get_max_hp: h.get_max_hp,
        on_unit_hp_changed: h
            .on_unit_hp_changed
            .as_mut()
            .map(|f| &mut **f as &mut crate::domain::recruitment::manpower::HpChangedFn<'_>),
    });
    // ---- dochod z tras (main.ts:34484-34524) ----
    let econ_cfg = load_econ_params(ctx.econ_params, ctx.difficulty);
    let income_params = load_pin_trade_income_params(Some(ctx.econ_params), ctx.difficulty);
    let wonder_trade = |owner: i64, medium: TradeRouteMedium| -> f64 {
        sum_wonder_trade_route_bonus_for_owner(
            ctx.wonders,
            &wonder_ids_owned_by(ctx.placed_wonders, owner),
            (ctx.owner_era)(owner),
            medium,
        )
    };
    let targowisko = |city_id: &str| -> f64 {
        if ctx
            .built_by_city
            .get(city_id)
            .is_some_and(|b| b.iter().any(|x| x == "targowisko"))
        {
            econ_cfg.budynek_targowisko_bonus_handlu
        } else {
            0.0
        }
    };
    let trade =
        build_trade_tick_inputs(ctx.trade_routes, &income_params, &wonder_trade, &targowisko);

    // ---- reczny podatek z Pracy (:34525-34535) ----
    let manual_tax = build_manual_work_tax_by_city(
        ctx.pending_manual_work_tax_by_owner,
        ctx.capital_city_id_by_owner,
        cities,
    );

    // ---- cuda (:34546) ----
    let city_owner_ids: Vec<i64> = cities.iter().map(|c| c.owner_id).collect();
    let wonder_yields = build_wonder_city_yields_by_owner_map(
        ctx.wonders,
        ctx.placed_wonders,
        &city_owner_ids,
        ctx.owner_era,
    );

    // ---- lask Mennicy `prepare` (:34537-34541) i migawki resolverow (pierwsze wolanie = sprzed drenazu, Z-Q5-1) ----
    let map_owner_ids = owner_ids_on_map(cities);
    let stock_snapshot: BTreeMap<i64, StockRecord> = map_owner_ids
        .iter()
        .map(|&o| (o, owner_resource_stock_all(cities, o)))
        .collect();
    let has_now_pre = |o: i64| -> bool {
        let zl = match stock_snapshot.get(&o) {
            Some(s) => owner_has_zloto_stock(Some(s)),
            None => false,
        };
        zl || (ctx.native_zloto_access)(o)
    };
    prepare_mennica_zloto_grace_for_tick(grace, &map_owner_ids, &has_now_pre);

    let mut tick = {
        let grace_ro: &MennicaZlotoGraceState = grace;
        let zloto_cache: RefCell<BTreeMap<i64, bool>> = RefCell::new(BTreeMap::new());
        let zloto = |o: i64| -> bool {
            if let Some(v) = zloto_cache.borrow().get(&o) {
                return *v;
            }
            let v = owner_zloto_access_for_mennica(o, grace_ro, &has_now_pre);
            zloto_cache.borrow_mut().insert(o, v);
            v
        };
        let labels_cache: RefCell<BTreeMap<i64, Vec<String>>> = RefCell::new(BTreeMap::new());
        let labels = |o: i64| -> Vec<String> {
            if let Some(v) = labels_cache.borrow().get(&o) {
                return v.clone();
            }
            let mut out: Vec<String> = Vec::new();
            for l in (ctx.empire_active_labels)(o) {
                if !out.contains(&l) {
                    out.push(l);
                }
            }
            if has_now_pre(o) && !out.iter().any(|l| l == "Złoto") {
                out.push("Złoto".to_string());
            }
            labels_cache.borrow_mut().insert(o, out.clone());
            out
        };
        let stock = |o: i64| -> StockRecord { stock_snapshot.get(&o).cloned().unwrap_or_default() };

        let empty_terr = BTreeMap::new();
        let empty_worked = BTreeMap::new();
        let input = AdvanceCityEconomyInput {
            built_by_city: ctx.built_by_city,
            econ_params: Some(ctx.econ_params),
            difficulty: ctx.difficulty,
            player_era: ctx.player_era,
            player_zbadane: ctx.player_zbadane,
            resolvers: AdvanceResolvers {
                owner_era: Some(ctx.owner_era),
                owner_tech: Some(ctx.owner_tech),
                owner_zloto_access: &zloto,
                owner_active_labels: Some(&labels),
                owner_empire_stock: Some(&stock),
            },
            territory_resource_by_city: &empty_terr,
            worked_magazyn_by_city: &empty_worked,
        };
        let lp = AdvanceLoopInput {
            maps: CityLoopMaps {
                owner_civ_by_owner_id: ctx.owner_civ_by_owner_id,
                order_mult_by_city: ctx.order_mult_by_city,
                wonder_city_yields_by_owner: &wonder_yields,
                trade_route_building_bonus_by_city: &trade.trade_route_building_bonus_by_city,
                trade_income_by_city: &trade.trade_income_by_city,
                maritime_trade_income_by_city: &trade.maritime_trade_income_by_city,
                manual_work_tax_by_city: &manual_tax,
                owner_default_podzial_handlu_by_owner: ctx.owner_default_podzial_handlu_by_owner,
                owner_default_podzial_pracy_by_owner: ctx.owner_default_podzial_pracy_by_owner,
            },
            data: CityLoopData {
                matrix: ctx.matrix,
                buildings: ctx.buildings,
            },
        };
        let upkeep_extra = UpkeepHealthInput {
            society_params: ctx.society_params,
            unit_rows: ctx.unit_rows,
        };
        advance_city_economy(
            cities,
            extras,
            ctx.terrain,
            &input,
            &upkeep_extra,
            &lp,
            ctx.econ_units,
            heal_local,
        )
    };

    // ---- `finalizeMennicaZlotoGraceAfterTick` (:34581-34585): `ownerHasZlotoAccessNow` czyta stan PO ticku ----
    {
        let post: BTreeMap<i64, StockRecord> = map_owner_ids
            .iter()
            .map(|&o| (o, owner_resource_stock_all(cities, o)))
            .collect();
        let has_now_post = |o: i64| -> bool {
            let zl = match post.get(&o) {
                Some(s) => owner_has_zloto_stock(Some(s)),
                None => false,
            };
            zl || (ctx.native_zloto_access)(o)
        };
        finalize_mennica_zloto_grace_after_tick(grace, &map_owner_ids, &has_now_post);
    }

    // ---- blok EmpireFood / auto-racje / atrycja (:34594-34850): PO ticku, PRZED bankowaniem ----
    let empire_food = food.map(|mut f| {
        let human_ids: Vec<i64> = ctx.human_owner_ids.iter().copied().collect();
        let block_ctx = EmpireFoodBlockCtx {
            econ_params: ctx.econ_params,
            difficulty: ctx.difficulty,
            matrix: ctx.matrix,
            unit_rows: ctx.unit_rows,
            built_by_city: ctx.built_by_city,
            owner_civ_by_owner_id: ctx.owner_civ_by_owner_id,
            econ_units: f.econ_units,
            human_owner_ids: &human_ids,
            typ_city_copy_owners: f.typ_city_copy_owners,
            owner_era: ctx.owner_era,
            unit_health_by_type: f.unit_health_by_type,
            runtime_max_hp: f.runtime_max_hp,
        };
        let sol = &tick.city_loop.resources.phase.tick;
        let (sol_army, sol_cities) = (
            sol.sol_army_by_owner.clone(),
            sol.sol_city_ids_by_owner.clone(),
        );
        run_empire_food_block(
            cities,
            &mut tick.result,
            &sol_army,
            &sol_cities,
            &block_ctx,
            &mut f.state,
        )
    });

    // ---- bankowanie (:35045-35131) ----
    let result = &tick.result;
    let mut banks: Vec<OwnerBank> = Vec::new();
    let mut bank_one = |owner_id: i64, is_human: bool, cities: &mut [City]| {
        let sum = if is_human {
            sum_economy_for_player_cities(result, cities, owner_id)
        } else {
            sum_economy_for_owner(result, owner_id)
        };
        let balance = result.upkeep_by_owner.get(&owner_id);
        let (upkeep_applied, deficyt) = match balance {
            Some(b) if b.utrzymanie_razem > 0.0 => (b.utrzymanie_razem, b.deficyt),
            _ => (0.0, false),
        };
        let mut deducted = BTreeMap::new();
        if let Some(res) = result.resource_upkeep_by_owner.get(&owner_id) {
            if !res.is_empty() {
                deduct_building_stock_cost_across_cities(cities, owner_id, res);
                deducted = res.clone();
            }
        }
        banks.push(OwnerBank {
            owner_id,
            is_human,
            sum,
            upkeep_applied,
            deficyt,
            resource_upkeep_deducted: deducted,
        });
    };
    for &h in ctx.human_owner_ids {
        bank_one(h, true, cities);
    }
    let mut seen_ai = BTreeSet::new();
    let ai_ids: Vec<i64> = cities
        .iter()
        .map(|c| c.owner_id)
        .filter(|&o| {
            !ctx.human_owner_ids.contains(&o)
                && o != BARBARIAN_OWNER_ID
                && o != REBEL_FACTION_OWNER_ID
        })
        .filter(|&o| seen_ai.insert(o))
        .collect();
    for o in ai_ids {
        bank_one(o, false, cities);
    }

    GameEconomyTickOutcome {
        tick,
        banks,
        map_owner_ids,
        empire_food,
    }
}
