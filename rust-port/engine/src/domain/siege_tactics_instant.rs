//! Ścieżka „Pomiń” bitwy taktycznej (E4): port `computeInstantResult` i reguły wyłomu z `_skipInstantFallback`
//! (temat `R-RUSTPORT-P4-1I1B-BATTLE-INSTANT`, P4-1I / #245).
//!
//! Web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`):
//! - `_skipInstantFallback` (`:3715-3748`): `siegeWallCol >= 0 && atk.some(u => !u.dead && isSiegeUnit(u.bu))` →
//!   `wallEverBreached = true` (`:3720-3722`); wejście `computeInstantResult` = rostery z filtrem `!u.dead`
//!   (`:3724-3725`); `result.log` dopisany do `this.log` (`:3744`), `_endWinner`/`_endSurvivors` z wyniku (`:3745-3746`);
//! - `computeInstantResult` (`:20389-20593`): fale (`maxWaves = (atk + def) * 6 + 10`, `:20426`), w fali pary
//!   `lA[i % lA.length]` / `lD[i % lD.length]` dla `i < max(|lA|, |lD|)` (`:20430-20441`), pominięcie pary
//!   `!a || !d || a.hp <= 0 || d.hp <= 0` (`:20442`), `toCombatUnit(bu, hunger, true, gold, true)` +
//!   `cu.health = hp` (`:20444-20447`), `relativeHit` (`:20452-20454`), `defOnWall`/`defTerrain` (`:20466-20469`),
//!   `cityGatedTerrainMultiplier` przy obronie miasta (`:20490-20494`), `fortificationDefenseBonusForUnit`
//!   (`:20495-20498`, wpis `defBonus` `:20499`), `structBonusPctForPair` (`:20500-20501`), `fieldFortifyDefenseBonus`
//!   (`:20505-20509`), bród/brzeg (`:20516-20526`), `resolveCombat` (`:20534-20568`), HP po parze (`:20571-20572`),
//!   ocalali `hp > 0` (`:20574-20575`), werdykt (`:20580-20589`, `hpA >= hpD`, bez remisu), linia końca (`:20591`).
//!
//! ## Rozstrzygnięcie pary (`resolveCombat`) — wstrzyknięte
//!
//! `computeInstantResult` woła pełne `resolveCombat` z `game/combat.ts` (`:842-1251`: modyfikatory przed fazami,
//! faza dystansowa, zwarcie, werdykt, `res.log`) z RNG `Math.random` (brak `opts.rng`, `combat.ts:889`).
//! W silniku Rust NIE ma jeszcze portu całego `resolveCombat`: są tylko pętle faz (`combat::ranged_phase`,
//! `combat::melee_phase`) bez wejść przed fazami (#135/#167) i bez tekstów logu. `combat::resolve`
//! (`combat.rs:381`) to inny model (zbiorcza siła stron, HP `u32`, deterministyczny, bez logu i bez opcji
//! `ResolveCombatOpts`), więc podpięcie go tutaj dałoby wynik niezgodny z pinem. Dlatego rozstrzygnięcie pary
//! jest wejściem: [`InstantPairResolver`] dostaje dokładnie te argumenty, które pin podaje `resolveCombat`
//! (`cu_a`, `cu_d` po `toCombatUnit` i korektach Obrony oraz [`InstantPairOpts`] = obiekt opcji `:20534-20567`),
//! i zwraca `attackerHpLeft`, `defenderHpLeft` i `log`. Produkcyjny resolver = port `resolveCombat` (temat
//! wejść #135/#167 + teksty logu faz); do tego czasu wołającego produkcyjnego brak.
//!
//! `counters` i `terrainData` pinu, które przechodzą do `resolveCombat` bez zmian, należą do resolvera
//! (stałe bitwy). `terrainData` jest też tutaj ([`InstantScene::terrain_data`]), bo czyta je
//! `cityGatedTerrainMultiplier` (`:20492`).

use crate::domain::civ_bonuses::CivBonusEntry;
use crate::domain::siege_tactics_blow::HitArc;
use crate::domain::siege_tactics_blow_env::{TerrainRow, TileMap, WALKWAY_TERRAIN};
use crate::domain::siege_tactics_classify::{is_siege_unit, ClassifyUnit};
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_inputs_pos::{
    is_ford_tile, is_shore_adjacent_to_ford, relative_hit, JsVal,
};
use crate::domain::siege_tactics_inputs_terrain::{city_gated_terrain_multiplier, TerrainEntry};
use crate::domain::siege_tactics_inputs_unit::{
    to_combat_unit, BattleUnitIn, CombatUnitModel, ToCombatUnitOpts, UVal,
};
use crate::domain::siege_tactics_inputs_wall::{
    field_fortify_defense_bonus, fortification_defense_bonus_for_unit,
};

/// `maxRounds: 30` przekazywane do `resolveCombat` (`:20535`).
pub const INSTANT_MAX_ROUNDS: u32 = 30;

/// Linia końca `result.log` (`:20591`): `'=== Natychmiastowy wynik: ' + (ATAKUJACY|OBRONCA) + ' wygrywa ==='`.
pub fn instant_verdict_line(winner: BattleSide) -> String {
    let who = match winner {
        BattleSide::Attacker => "ATAKUJACY",
        BattleSide::Defender => "OBRONCA",
    };
    format!("=== Natychmiastowy wynik: {who} wygrywa ===")
}

/// Jednostka rosteru bitwy (`RuntimeBattleUnit`) z polami czytanymi przez `_skipInstantFallback` i
/// `computeInstantResult`.
#[derive(Debug, Clone, PartialEq)]
pub struct InstantUnit {
    /// `u.bu.id`.
    pub id: u64,
    /// Pola `bu` czytane przez `toCombatUnit` (`stats`, `kategoria`, `hp`, `veteranBonusFrac`, `armyHungry`,
    /// `goldDeficit`). `bu.hp` jest też startowym HP stanu (`{ ru: u, hp: u.bu.hp }`, `:20423-20424`); `None`
    /// (`undefined`) = `NaN`, więc jednostka odpada w filtrze `hp > 0`.
    pub bu: BattleUnitIn,
    /// `u.bu.nazwa` (rezerwa nazwy w `isSiegeUnit`, `:1554`).
    pub nazwa: Option<String>,
    /// `u.dead` (filtr `!u.dead`, `:3720`, `:3724-3725`).
    pub dead: bool,
    /// `u.q`.
    pub q: i32,
    /// `u.r`.
    pub r: i32,
    /// `u.facing` (`Dir`: N=0, E=1, S=2, W=3).
    pub facing: i32,
    /// `u.side === 'def'` (`fortificationDefenseBonusForUnit`, `:20496`).
    pub side_def: bool,
    /// `u.onWallWalkway === true` (`:20466`).
    pub on_wall_walkway: bool,
    /// `u.bu.fortifiedInField === true` (`:20505`).
    pub fortified_in_field: bool,
    /// `u.bu.pancerzBonusFrac` (`?? 0`, `:20557-20558`).
    pub pancerz_bonus_frac: Option<f64>,
    /// `u.bu.parametryBonusFrac` (`?? 0`, `:20557-20558`).
    pub parametry_bonus_frac: Option<f64>,
    /// `u.bu.civBonusy` (`battleUnitCivBonusy`, `battle-unit-context.ts:2-7`: `?? sideFallback`).
    pub civ_bonusy: Option<Vec<CivBonusEntry>>,
    /// `u.bu.difficultyCombatMult` (`battleUnitDifficultyCombatMult`, `battle-unit-context.ts:9-14`).
    pub difficulty_combat_mult: Option<f64>,
}

fn uval_string(v: Option<&UVal>) -> Option<String> {
    match v {
        None | Some(UVal::Undef) | Some(UVal::Null) => None,
        Some(other) => Some(other.js_to_string()),
    }
}

impl InstantUnit {
    /// Wejście `isSiegeUnit(u.bu)` (`:1552-1559`): `stats['Typ']`, `stats['Jednostka']`, `nazwa`.
    pub fn classify(&self) -> ClassifyUnit {
        let stats = self.bu.stats.as_ref();
        ClassifyUnit {
            typ: uval_string(stats.and_then(|s| s.get("Typ"))),
            jednostka: uval_string(stats.and_then(|s| s.get("Jednostka"))),
            nazwa: self.nazwa.clone(),
        }
    }

    /// `u.bu.hp` jako liczba (`undefined` = `NaN`).
    pub fn start_hp(&self) -> f64 {
        self.bu.hp.unwrap_or(f64::NAN)
    }
}

/// Stałe z `combat-params.json` czytane w `computeInstantResult` (pin `battleScene.ts:984-993`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct InstantConsts {
    /// `BROD_KARA_OBRONA` = `brod.karaObrona` (0.25 w pinie).
    pub brod_kara_obrona: f64,
    /// `BROD_BONUS_BRZEG` = `brod.bonusObronaBrzegu` (0.15 w pinie).
    pub brod_bonus_brzegu: f64,
    /// `FORTIFY_OBRONA_PROC_FIELD` = `oblężenie.fortify_obrona_proc` (50 w pinie).
    pub fortify_obrona_proc: f64,
}

impl InstantConsts {
    /// Wartości z danych silnika (`data/combat-params.json`).
    ///
    /// # Errors
    /// Błąd parsowania danych.
    pub fn from_data() -> Result<Self, serde_json::Error> {
        let p = crate::data::units_combat::parse_combat_params()?;
        #[allow(clippy::cast_precision_loss)]
        let fortify = p.oblezenie.fortify_obrona_proc as f64;
        Ok(Self {
            brod_kara_obrona: p.brod.kara_obrona,
            brod_bonus_brzegu: p.brod.bonus_obrona_brzegu,
            fortify_obrona_proc: fortify,
        })
    }
}

/// Stan sceny przekazywany do `computeInstantResult` przez `_skipInstantFallback` (`:3723-3742`).
#[derive(Debug, Clone, PartialEq)]
pub struct InstantScene {
    /// `this.terrain` (teren bitwy; teren bazowy miasta).
    pub terrain: String,
    /// `this.terrainData`.
    pub terrain_data: Vec<TerrainRow>,
    /// `this.terrainMap` (`None` = wołający bez mapy: `defTerrain = terrain`, brak brodu).
    pub terrain_map: Option<TileMap>,
    /// `this.attackerCivBonusy` (rezerwa strony).
    pub attacker_civ_bonusy: Vec<CivBonusEntry>,
    /// `this.defenderCivBonusy`.
    pub defender_civ_bonusy: Vec<CivBonusEntry>,
    /// `this.wallDefenseTotalProc`.
    pub wall_defense_total_proc: f64,
    /// `this.isCityDefenseBattle`.
    pub is_city_defense: bool,
    /// `this.armyHungerStatMult`.
    pub army_hunger_stat_mult: f64,
    /// `this.attackerDifficultyCombatMult`.
    pub attacker_difficulty_combat_mult: f64,
    /// `this.defenderDifficultyCombatMult`.
    pub defender_difficulty_combat_mult: f64,
    /// `this.goldDeficitStatMult`.
    pub gold_deficit_stat_mult: f64,
    /// `this.attackerOwnTerritory`.
    pub attacker_own_territory: bool,
    /// `this.defenderOwnTerritory`.
    pub defender_own_territory: bool,
    /// `this.shallowSea`.
    pub shallow_sea: bool,
    /// `this.siegeWallCol` (`-1` = brak muru).
    pub siege_wall_col: f64,
    /// Stałe brodu i fortyfikacji.
    pub consts: InstantConsts,
}

/// Obiekt opcji `resolveCombat` budowany dla pary (`:20534-20567`), bez `terrainData`/`counters`
/// (stałe bitwy, własność resolvera).
#[derive(Debug, Clone, PartialEq)]
pub struct InstantPairOpts<'a> {
    /// `maxRounds: 30`.
    pub max_rounds: u32,
    /// `defenderTerrain: defTerrain`.
    pub defender_terrain: String,
    /// `attackerPosition: arc` (`relativeHit`).
    pub attacker_position: HitArc,
    /// `battleUnitCivBonusy(a.ru.bu, attackerCivBonusy)`.
    pub attacker_civ_bonusy: &'a [CivBonusEntry],
    /// `battleUnitCivBonusy(d.ru.bu, defenderCivBonusy)`.
    pub defender_civ_bonusy: &'a [CivBonusEntry],
    /// `structureDefBonusPct: structBonusPctForPair`.
    pub structure_def_bonus_pct: f64,
    /// `attackerOwnTerritory`.
    pub attacker_own_territory: bool,
    /// `defenderOwnTerritory`.
    pub defender_own_territory: bool,
    /// `defenderOnWallWalkway: defOnWall`.
    pub defender_on_wall_walkway: bool,
    /// `shallowSea`.
    pub shallow_sea: bool,
    /// `defenderTerrainDefMultOverride: isCityDefense ? 1 : undefined`.
    pub defender_terrain_def_mult_override: Option<f64>,
    /// `attackerBuildingBonus: { pancerz, other }`.
    pub attacker_building_bonus: (f64, f64),
    /// `defenderBuildingBonus: { pancerz, other }`.
    pub defender_building_bonus: (f64, f64),
    /// `attackerArmyHungry: a.ru.bu.armyHungry === true`.
    pub attacker_army_hungry: bool,
    /// `defenderArmyHungry`.
    pub defender_army_hungry: bool,
    /// `armyHungerStatMult`.
    pub army_hunger_stat_mult: f64,
    /// `attackerGoldDeficit: a.ru.bu.goldDeficit === true`.
    pub attacker_gold_deficit: bool,
    /// `defenderGoldDeficit`.
    pub defender_gold_deficit: bool,
    /// `goldDeficitStatMult`.
    pub gold_deficit_stat_mult: f64,
    /// `battleUnitDifficultyCombatMult(a.ru.bu, attackerDifficultyCombatMult)`.
    pub attacker_difficulty_combat_mult: f64,
    /// `battleUnitDifficultyCombatMult(d.ru.bu, defenderDifficultyCombatMult)`.
    pub defender_difficulty_combat_mult: f64,
}

/// Pola wyniku `resolveCombat` czytane przez `computeInstantResult` (`:20569-20572`).
#[derive(Debug, Clone, PartialEq)]
pub struct PairCombatResult {
    /// `res.attackerHpLeft` (w pinie już `Math.max(0, hpAtk)`, `combat.ts:1245`).
    pub attacker_hp_left: f64,
    /// `res.defenderHpLeft`.
    pub defender_hp_left: f64,
    /// `res.log`.
    pub log: Vec<String>,
}

/// Rozstrzygnięcie jednej pary (web `resolveCombat(cu_a, cu_d, opts)`, `game/combat.ts:842-1251`).
pub trait InstantPairResolver {
    /// Jedna para; `cu_a.health`/`cu_d.health` = bieżące HP stanu (`:20446-20447`).
    fn resolve_pair(
        &mut self,
        cu_a: &CombatUnitModel,
        cu_d: &CombatUnitModel,
        opts: &InstantPairOpts<'_>,
    ) -> PairCombatResult;
}

/// Wpis `defBonus` (`:20499`): `{ q, r, onWall, pct }` dla obrońcy każdej rozegranej pary.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct InstantDefBonus {
    pub q: i32,
    pub r: i32,
    pub on_wall: bool,
    pub pct: f64,
}

/// Wynik `computeInstantResult` (`:20414-20417`).
#[derive(Debug, Clone, PartialEq)]
pub struct InstantResult {
    /// `winner` (`'atakujacy' | 'obronca'`).
    pub winner: BattleSide,
    /// `survivors` jako `(bu.id, hp)` strony zwycięzcy, w kolejności rosteru wejścia.
    pub survivors: Vec<(u64, f64)>,
    /// `log`: linie `res.log` kolejnych par + linia końca.
    pub log: Vec<String>,
    /// `defBonus` (web `this.lastInstantDefBonus`, `:3743`).
    pub def_bonus: Vec<InstantDefBonus>,
}

/// Wynik `_skipInstantFallback` (`:3715-3748`) bez ekranu końca.
#[derive(Debug, Clone, PartialEq)]
pub struct InstantSkipOutcome {
    /// `this.wallEverBreached` po regule machiny (`:3720-3722`).
    pub wall_ever_breached: bool,
    /// Czy atakujący ma żywą machinę oblężniczą (`this.atk.some(u => !u.dead && isSiegeUnit(u.bu))`).
    pub attacker_has_live_siege_unit: bool,
    /// Wynik `computeInstantResult`.
    pub result: InstantResult,
}

/// `this.atk.some(u => !u.dead && isSiegeUnit(u.bu))` (`:3720`).
pub fn attacker_has_live_siege_unit(atk: &[InstantUnit]) -> bool {
    atk.iter().any(|u| !u.dead && is_siege_unit(&u.classify()))
}

/// Reguła wyłomu „Pomiń” (`:3720-3722`): w oblężeniu żywa machina atakującego = założony wyłom; inaczej bez zmian.
pub fn instant_wall_ever_breached(
    siege_wall_col: f64,
    wall_ever_breached: bool,
    atk: &[InstantUnit],
) -> bool {
    if siege_wall_col >= 0.0 && attacker_has_live_siege_unit(atk) {
        true
    } else {
        wall_ever_breached
    }
}

struct SlotState<'u> {
    ru: &'u InstantUnit,
    hp: f64,
}

fn tile_at(map: &TileMap) -> impl Fn(i32, i32) -> u8 + '_ {
    move |q, r| map.at(q, r)
}

fn entries(rows: &[TerrainRow]) -> Vec<TerrainEntry<'_>> {
    rows.iter()
        .map(|r| TerrainEntry {
            teren: r.teren.as_str(),
            bonus_obrona: r.bonus_obrona.as_deref(),
        })
        .collect()
}

/// Web `computeInstantResult(aliveAtk, aliveDef, …)` (`:20389-20593`).
///
/// `alive_atk`/`alive_def` = wejście pinu (wołający filtruje `!u.dead`, jak `_skipInstantFallback`).
pub fn compute_instant_result(
    alive_atk: &[&InstantUnit],
    alive_def: &[&InstantUnit],
    scene: &InstantScene,
    resolver: &mut dyn InstantPairResolver,
) -> InstantResult {
    let mut log: Vec<String> = Vec::new();
    let mut def_bonus: Vec<InstantDefBonus> = Vec::new();

    let mut atk_state: Vec<SlotState<'_>> = alive_atk
        .iter()
        .map(|u| SlotState {
            ru: u,
            hp: u.start_hp(),
        })
        .collect();
    let mut def_state: Vec<SlotState<'_>> = alive_def
        .iter()
        .map(|u| SlotState {
            ru: u,
            hp: u.start_hp(),
        })
        .collect();

    let max_waves = (atk_state.len() + def_state.len()) * 6 + 10;
    let mut wave = 0_usize;
    let rows = entries(&scene.terrain_data);
    let cu_opts = ToCombatUnitOpts {
        army_hunger_stat_mult: scene.army_hunger_stat_mult,
        skip_hunger: true,
        gold_deficit_stat_mult: scene.gold_deficit_stat_mult,
        skip_gold_deficit: true,
    };

    while wave < max_waves {
        wave += 1;
        // `lA`/`lD`: indeksy stanów z `hp > 0` na początku fali (`:20431-20432`).
        let l_a: Vec<usize> = (0..atk_state.len())
            .filter(|&i| atk_state[i].hp > 0.0)
            .collect();
        let l_d: Vec<usize> = (0..def_state.len())
            .filter(|&i| def_state[i].hp > 0.0)
            .collect();
        if l_a.is_empty() || l_d.is_empty() {
            break;
        }

        let pairs = l_a.len().max(l_d.len());
        for i in 0..pairs {
            let ai = l_a[i % l_a.len()];
            let di = l_d[i % l_d.len()];
            let (a_hp, d_hp) = (atk_state[ai].hp, def_state[di].hp);
            if a_hp <= 0.0 || d_hp <= 0.0 {
                continue;
            }
            let a = atk_state[ai].ru;
            let d = def_state[di].ru;

            let mut cu_a = to_combat_unit(&a.bu, &cu_opts);
            let mut cu_d = to_combat_unit(&d.bu, &cu_opts);
            cu_a.health = a_hp;
            cu_d.health = d_hp;

            let arc = relative_hit(
                &JsVal::Num(f64::from(d.facing)),
                &JsVal::Num(f64::from(a.q)),
                &JsVal::Num(f64::from(a.r)),
                &JsVal::Num(f64::from(d.q)),
                &JsVal::Num(f64::from(d.r)),
            );

            let def_on_wall = d.on_wall_walkway;
            let def_terrain: String = if def_on_wall {
                WALKWAY_TERRAIN.to_string()
            } else {
                match &scene.terrain_map {
                    Some(m) => m.name(d.q, d.r).to_string(),
                    None => scene.terrain.clone(),
                }
            };

            let has_mur = scene.wall_defense_total_proc > 0.0;
            let city_elevation_terrain: &str = if def_on_wall {
                &scene.terrain
            } else {
                &def_terrain
            };
            let city_terr_mult = if scene.is_city_defense {
                city_gated_terrain_multiplier(has_mur, city_elevation_terrain, &rows)
            } else {
                1.0
            };
            let wall_bonus_for_def = fortification_defense_bonus_for_unit(
                d.side_def,
                def_on_wall,
                f64::from(d.q),
                scene.siege_wall_col,
                scene.wall_defense_total_proc,
            );
            def_bonus.push(InstantDefBonus {
                q: d.q,
                r: d.r,
                on_wall: def_on_wall,
                pct: wall_bonus_for_def,
            });
            let struct_bonus_pct_for_pair = wall_bonus_for_def
                + if scene.is_city_defense {
                    (city_terr_mult - 1.0) * 100.0
                } else {
                    0.0
                };

            if d.fortified_in_field {
                cu_d.melee_defence = field_fortify_defense_bonus(
                    cu_d.melee_defence,
                    true,
                    scene.consts.fortify_obrona_proc,
                );
            }

            if let Some(map) = &scene.terrain_map {
                let at = tile_at(map);
                let d_on_ford = is_ford_tile(&at, d.q, d.r);
                if d_on_ford {
                    cu_d.melee_defence *= 1.0 - scene.consts.brod_kara_obrona;
                } else if is_ford_tile(&at, a.q, a.r) && is_shore_adjacent_to_ford(&at, d.q, d.r) {
                    cu_d.melee_defence *= 1.0 + scene.consts.brod_bonus_brzegu;
                }
            }

            let opts = InstantPairOpts {
                max_rounds: INSTANT_MAX_ROUNDS,
                defender_terrain: def_terrain,
                attacker_position: arc,
                attacker_civ_bonusy: a
                    .civ_bonusy
                    .as_deref()
                    .unwrap_or(&scene.attacker_civ_bonusy),
                defender_civ_bonusy: d
                    .civ_bonusy
                    .as_deref()
                    .unwrap_or(&scene.defender_civ_bonusy),
                structure_def_bonus_pct: struct_bonus_pct_for_pair,
                attacker_own_territory: scene.attacker_own_territory,
                defender_own_territory: scene.defender_own_territory,
                defender_on_wall_walkway: def_on_wall,
                shallow_sea: scene.shallow_sea,
                defender_terrain_def_mult_override: scene.is_city_defense.then_some(1.0),
                attacker_building_bonus: (
                    a.pancerz_bonus_frac.unwrap_or(0.0),
                    a.parametry_bonus_frac.unwrap_or(0.0),
                ),
                defender_building_bonus: (
                    d.pancerz_bonus_frac.unwrap_or(0.0),
                    d.parametry_bonus_frac.unwrap_or(0.0),
                ),
                attacker_army_hungry: a.bu.army_hungry,
                defender_army_hungry: d.bu.army_hungry,
                army_hunger_stat_mult: scene.army_hunger_stat_mult,
                attacker_gold_deficit: a.bu.gold_deficit,
                defender_gold_deficit: d.bu.gold_deficit,
                gold_deficit_stat_mult: scene.gold_deficit_stat_mult,
                attacker_difficulty_combat_mult: a
                    .difficulty_combat_mult
                    .unwrap_or(scene.attacker_difficulty_combat_mult),
                defender_difficulty_combat_mult: d
                    .difficulty_combat_mult
                    .unwrap_or(scene.defender_difficulty_combat_mult),
            };
            let res = resolver.resolve_pair(&cu_a, &cu_d, &opts);
            log.extend(res.log);

            atk_state[ai].hp = res.attacker_hp_left;
            def_state[di].hp = res.defender_hp_left;
        }
    }

    let survivors_a: Vec<(u64, f64)> = atk_state
        .iter()
        .filter(|u| u.hp > 0.0)
        .map(|u| (u.ru.id, u.hp))
        .collect();
    let survivors_d: Vec<(u64, f64)> = def_state
        .iter()
        .filter(|u| u.hp > 0.0)
        .map(|u| (u.ru.id, u.hp))
        .collect();

    let (winner, survivors) = if !survivors_a.is_empty() && survivors_d.is_empty() {
        (BattleSide::Attacker, survivors_a)
    } else if !survivors_d.is_empty() && survivors_a.is_empty() {
        (BattleSide::Defender, survivors_d)
    } else {
        // `reduce((s, u) => s + u.hp, 0)` w kolejności rosteru (`:20585-20586`).
        let hp_a = survivors_a.iter().fold(0.0_f64, |s, u| s + u.1);
        let hp_d = survivors_d.iter().fold(0.0_f64, |s, u| s + u.1);
        if hp_a >= hp_d {
            (BattleSide::Attacker, survivors_a)
        } else {
            (BattleSide::Defender, survivors_d)
        }
    };

    log.push(instant_verdict_line(winner));
    InstantResult {
        winner,
        survivors,
        log,
        def_bonus,
    }
}

/// Web `_skipInstantFallback` (`:3715-3748`) bez `finished`, ekranu końca i `this.log`: reguła wyłomu
/// (`:3720-3722`) i `computeInstantResult` na rosterach z filtrem `!u.dead` (`:3724-3725`).
///
/// `wall_ever_breached` = `this.wallEverBreached` przed „Pomiń”.
pub fn skip_instant_fallback(
    atk: &[InstantUnit],
    def: &[InstantUnit],
    wall_ever_breached: bool,
    scene: &InstantScene,
    resolver: &mut dyn InstantPairResolver,
) -> InstantSkipOutcome {
    let live_siege = attacker_has_live_siege_unit(atk);
    let wall_ever_breached =
        instant_wall_ever_breached(scene.siege_wall_col, wall_ever_breached, atk);
    let alive_atk: Vec<&InstantUnit> = atk.iter().filter(|u| !u.dead).collect();
    let alive_def: Vec<&InstantUnit> = def.iter().filter(|u| !u.dead).collect();
    let result = compute_instant_result(&alive_atk, &alive_def, scene, resolver);
    InstantSkipOutcome {
        wall_ever_breached,
        attacker_has_live_siege_unit: live_siege,
        result,
    }
}
