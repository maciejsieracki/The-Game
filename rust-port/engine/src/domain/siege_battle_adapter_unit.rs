//! R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6), czesc 2: jednostki bitwy oblezniczej z rosterow.
//!
//! Port 1:1 z pinu `07d2fbd72` (wektory `tests/p6_k5loop_adapter_vectors/vectors.json`):
//! * `runtimeToBattleUnit` (`gra/src/main.ts:33158-33197`) z `unitDefFor`/`lookupUnitDef` (`:33003-33031`, bez rekordu
//!   zastepczego: D-ADP-1), `effectiveRuntimeUnitMaxHp`/`syncRuntimeUnitHpState` (`:33101-33118`), `unitHealth`
//!   (`:33093`), oraz `rosterToBattleUnits` sciezki szturmu (`main.ts:36885-36901`, w `launchSiegeStormFromMap`):
//!   `armyLeaderMoraleBonusFrac`, `civBonusy`, `difficultyCombatMult`;
//! * helpery statystyk `battleScene.ts`: `norm` (`:1315`), `statField` (`:1322`), `movementPoints` (`:1381`),
//!   `civUnitShapeForBattleUnit` (`:1387`), `attackRange` (`:1410`), `isRanged` (`:1420`), `ammoCount` (`:1434`),
//!   `isAntiCavSpear` (`:1522`), `isPhalanx` (`:1538`), `bracesAgainstCharge` (`:1571`), `isNeverRout` (`:1592`),
//!   `moraleBaseFor` (`:1611`), `fleeMoraleFor` (`:1627`); `isMounted`/`isPrimaryRanged`/`_isCatapult` z
//!   [`SetupUnit`] (T5b-UNITS);
//! * metody sceny: `_movementPointsFor` (`:7515`), `_attackRangeFor` (`:7522`), `_applyTerrainRange` (`:7490`),
//!   `_isWallCrownShooter` (`:7467`), `wallCrownShooterRange` (`city-defense.ts:139`);
//! * pola `RuntimeBattleUnit` przy spawnie: atakujacy (`_placeUnits` `:5440-5484`: `movementPoints`/`attackRange` BEZ
//!   mnoznikow cywilizacji), obronca w obrebie muru (`_placeSiegeDefenders` `:4527-4566`: morale x1,5,
//!   `_movementPointsFor`/`_attackRangeFor`), obronca na koronie (`:4694-4730`: katapulta `max(range, 6)` i `ranged`,
//!   `onWallWalkway`, potem `_applyTerrainRange`);
//! * `_applyStartingMoralePowerPenalty` (`battleScene.ts:5597-5629`) z `hpWeightedFieldPower`, `powerAdvantage`,
//!   `startingMoralePenaltyFrac`, `applyStartingMoralePenalty` (`gra/src/game/combat.ts:1349-1460`);
//! * `toCombatUnit` (istniejacy port K5I2a4) -> `cuA`/`cuD` ([`attacker_from_cu`], [`defender_from_cu`]) i macierz
//!   `counterMultiplier(cuA.counterTyp, cuD.counterTyp, counters)` (`combat.ts:553-577`) dla wszystkich par.
//!
//! Wartosci zalezne od pozycji i chwili ciosu (`relativeHit`, teren kafla, `isCharge`, `civCombatStatMultipliers` z
//! terenem i runda szarzy) liczy pin wewnatrz `_singleBlow` (`:8812-8960`); adapter daje ich wejscia statyczne (cu, macierz
//! kontr, `bracesAgainstCharge`, `mounted`, kontekst cywilizacji), a skladanie `FullBlowInput` per cios nalezy do #369 (T7).

// Semantyka JS: `Math.max(a, Math.min(b, x))` (kolejnosc i NaN jak w pinie, bez paniki `clamp` przy min > max),
// `!(x > 0)` (NaN = prawda) oraz stale fdlibm zapisane jak w zrodle C.
#![allow(
    clippy::manual_clamp,
    clippy::neg_cmp_op_on_partial_ord,
    clippy::excessive_precision
)]

use std::collections::BTreeMap;

use crate::domain::army_leadership::{
    army_leader_morale_bonus_frac, army_leader_title, army_leader_title_text,
    morale_with_army_leader_bonus,
};
use crate::domain::battle_setup_units::{SetupUnit, Side};
use crate::domain::brake_power_army::{
    army_field_power, is_siege_unit as is_siege_rola, ArmyUnitDef,
};
use crate::domain::civ_bonuses::{
    civ_attack_range_multiplier, civ_movement_multiplier, CivBonusEntry, CivBonusUnitShape,
};
use crate::domain::siege_battle_adapter::{finite, AdapterError, RosterUnit};
use crate::domain::siege_tactics_blow_full::{
    attacker_from_cu, defender_from_cu, AttackerCu, DefenderCu,
};
use crate::domain::siege_tactics_classify::norm_name;
use crate::domain::siege_tactics_doctrine_state::GroupDoctrine;
use crate::domain::siege_tactics_doctrine_step::is_unit_doctrine_auto;
use crate::domain::siege_tactics_inputs_pos::js_str_to_number;
use crate::domain::siege_tactics_inputs_unit::{
    combat_norm_field, to_combat_unit, BattleUnitIn, CombatUnitModel, StatRow, ToCombatUnitOpts,
    UVal,
};
use crate::domain::unit_health::{effective_max_hp, js_parse_float, veteran_combat_bonus_frac};
use crate::domain::unit_power::{UnitPowerCoeffs, UnitPowerInput};

/// `DEFAULT_BATTLE_MOVE` (`battleScene.ts:948`).
pub const DEFAULT_BATTLE_MOVE: f64 = 2.0;
/// `DEFAULT_RANGED_REACH` (`battleScene.ts:949`).
pub const DEFAULT_RANGED_REACH: f64 = 2.0;
/// `MORALE_START` (`battleScene.ts:1112`).
pub const MORALE_START: f64 = 100.0;
/// `WALL_CROWN_RANGE_MULT` (`city-defense.ts:132`).
pub const WALL_CROWN_RANGE_MULT: f64 = 2.0;
/// Zasieg katapulty obroncy na koronie (`battleScene.ts:4706`).
pub const DEF_CATAPULT_CROWN_RANGE: f64 = 5.0;
/// Mnoznik morale obroncow oblezenia na starcie (`battleScene.ts:4527`, `:4695`).
pub const DEFENDER_MORALE_MULT: f64 = 1.5;

static UNDEF: UVal = UVal::Undef;

fn get<'a>(s: &'a StatRow, k: &str) -> &'a UVal {
    s.get(k).unwrap_or(&UNDEF)
}

fn nullish(v: &UVal) -> bool {
    matches!(v, UVal::Undef | UVal::Null)
}

/// `a ?? b`.
fn coalesce<'a>(a: &'a UVal, b: &'a UVal) -> &'a UVal {
    if nullish(a) {
        b
    } else {
        a
    }
}

/// `statField(s, ascii, accent)` (`:1322-1326`): tylko `undefined` przechodzi dalej (`null` jest wartoscia).
fn stat_field<'a>(s: &'a StatRow, ascii: &str, accent: &str) -> &'a UVal {
    let a = get(s, ascii);
    if !matches!(a, UVal::Undef) {
        return a;
    }
    get(s, accent)
}

/// `Math.round` (JS): polowki w strone +Infinity.
fn js_round(x: f64) -> f64 {
    if !x.is_finite() || x.fract() == 0.0 {
        return x;
    }
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// `parseFloat(String(raw))` dla `raw` nie-liczbowego.
fn parse_float_of(v: &UVal) -> f64 {
    match v {
        UVal::Num(n) => *n,
        other => js_parse_float(&other.js_to_string()),
    }
}

/// `String(v ?? fallback)` dla napisu z pola `stats`.
fn str_or(v: &UVal, fallback: &str) -> String {
    if nullish(v) {
        fallback.to_owned()
    } else {
        v.js_to_string()
    }
}

/// Kontekst wlasciciela jednostek (z `main.ts`): budynki imperium (`empireBuiltIdsForOwner`, tytul i premia dowodcy),
/// `civBonusyForOwnerId`, `isArmyHungry`, `isGoldDeficit`, `difficultyCombatMultForOwner`.
#[derive(Debug, Clone, PartialEq)]
pub struct OwnerContext {
    pub built_ids: Vec<String>,
    pub civ_bonusy: Vec<CivBonusEntry>,
    pub army_hungry: bool,
    pub gold_deficit: bool,
    pub difficulty_combat_mult: f64,
}

/// `BattleUnit` sceny (pola uzywane przez spawn, `toCombatUnit` i rozstawienie).
#[derive(Debug, Clone, PartialEq)]
pub struct AdapterBattleUnit {
    pub id: String,
    pub owner_id: i64,
    pub side: Side,
    pub nazwa: String,
    pub kategoria: String,
    /// `{ ...def, __canonicalEffectiveMaxHp, __canonicalCurrentHp }`.
    pub stats: StatRow,
    pub hp: f64,
    pub max_hp: f64,
    pub is_army_commander: bool,
    pub pancerz_bonus_frac: f64,
    pub parametry_bonus_frac: f64,
    pub veteran_bonus_frac: f64,
    pub fortified_in_field: bool,
    /// `isArmyHungry(owner) && !isCivilianUnit(u)`.
    pub army_hungry: bool,
    /// `isGoldDeficit(owner) && !isCivilianUnit(u)`.
    pub gold_deficit: bool,
    pub army_leader_morale_bonus_frac: f64,
    pub difficulty_combat_mult: f64,
    pub civ_bonusy: Vec<CivBonusEntry>,
}

fn progress_frac(v: Option<f64>, what: &str, id: &str) -> Result<f64, AdapterError> {
    match v {
        None => Ok(0.0),
        Some(x) => {
            let x = finite(x, || format!("unit {id} {what}"))?;
            Ok(if x > 0.0 { x / 100.0 } else { 0.0 })
        }
    }
}

fn check_def_finite(id: &str, def: &StatRow) -> Result<(), AdapterError> {
    let mut keys: Vec<&String> = def.keys().collect();
    keys.sort();
    for k in keys {
        if let UVal::Num(n) = def[k] {
            finite(n, || format!("unit {id} stat {k}"))?;
        }
    }
    Ok(())
}

/// Zachowanie przy typie spoza `units.json` (D-ADP-1).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum UnitDefFallback {
    /// Rekord zastepczy pinu `lookupUnitDef` (`main.ts:33006-33024`): jawny rekord z danych pinu, osiagalny w grze
    /// (cywile `Robotnik`/`Osadnik` nie maja wiersza w `units.json`, a cywil na heksie miasta broni go).
    PinRecord,
    /// Brak wiersza = [`AdapterError::MissingUnitDef`] (tryb scisly, np. dla danych spoza gry).
    Error,
}

/// Rekord zastepczy `lookupUnitDef(typeId)` (`main.ts:33006-33024`), wartosci 1:1 z pinu.
pub fn pin_fallback_unit_def(type_id: &str) -> StatRow {
    let n = |x: f64| UVal::Num(x);
    [
        ("Jednostka", UVal::Str(type_id.to_owned())),
        ("Rola (linia)", UVal::Str("Wrecz".to_owned())),
        ("Pr\u{f3}g dezercji (% health)", n(0.25)),
        ("meleeAttack", n(5.0)),
        ("meleeDefence", n(5.0)),
        ("chargeBonus", n(2.0)),
        ("armor", n(2.0)),
        ("piercing", n(0.0)),
        ("health", n(30.0)),
        ("weaponDamage", n(4.0)),
        ("missileAttack", n(0.0)),
        ("Zasieg ataku (hex)", UVal::Null),
        ("Ilosc pociskow", UVal::Null),
        ("Ruch w bitwie (heksy)", n(2.0)),
        ("Kara obrony z flanki (%)", n(50.0)),
        ("Kara obrony z tylu (%)", n(80.0)),
    ]
    .into_iter()
    .map(|(k, v)| (k.to_owned(), v))
    .collect()
}

/// Definicja jednostki: `militiaDefOverrides.get(id) ?? lookupUnitDef(typeId)` (`main.ts:33027-33031`). Typ spoza
/// `units.json`: wg `fallback` (rekord pinu albo [`AdapterError::MissingUnitDef`], D-ADP-1).
pub fn unit_def_for(
    u: &RosterUnit,
    rows: &[StatRow],
    index: &BTreeMap<String, usize>,
    militia_defs: &[(String, StatRow)],
    fallback: UnitDefFallback,
) -> Result<StatRow, AdapterError> {
    if let Some((_, d)) = militia_defs.iter().find(|(id, _)| *id == u.id) {
        return Ok(d.clone());
    }
    if let Some(row) = index.get(&u.type_id).and_then(|&i| rows.get(i)) {
        return Ok(row.clone());
    }
    match fallback {
        UnitDefFallback::PinRecord => Ok(pin_fallback_unit_def(&u.type_id)),
        UnitDefFallback::Error => Err(AdapterError::MissingUnitDef {
            unit_id: u.id.clone(),
            type_id: u.type_id.clone(),
        }),
    }
}

/// `unitHealth(def)` (`main.ts:33093-33095`): `normFieldVal(def.health ?? def.Health, 30)`.
pub fn unit_health_of(def: &StatRow) -> f64 {
    combat_norm_field(coalesce(get(def, "health"), get(def, "Health")), 30.0)
}

/// Wejscia jednego wywolania `rosterToBattleUnits` (`main.ts:36885-36901`).
pub struct RosterBattleCtx<'a> {
    pub rows: &'a [StatRow],
    pub index: &'a BTreeMap<String, usize>,
    pub militia_defs: &'a [(String, StatRow)],
    pub owners: &'a BTreeMap<i64, OwnerContext>,
    /// Typ spoza `units.json` (D-ADP-1).
    pub fallback: UnitDefFallback,
}

/// `rosterToBattleUnits(roster, color)` sciezki szturmu (`main.ts:36885-36901`) z `runtimeToBattleUnit` (`:33158`).
pub fn roster_to_battle_units(
    roster: &[RosterUnit],
    side: Side,
    ctx: &RosterBattleCtx<'_>,
) -> Result<Vec<AdapterBattleUnit>, AdapterError> {
    let mut has_commander: BTreeMap<i64, bool> = BTreeMap::new();
    for u in roster {
        if u.is_general {
            has_commander.insert(u.owner_id, true);
        } else {
            has_commander.entry(u.owner_id).or_insert(false);
        }
    }
    roster
        .iter()
        .map(|u| {
            let owner = ctx
                .owners
                .get(&u.owner_id)
                .ok_or(AdapterError::MissingOwnerContext {
                    owner_id: u.owner_id,
                })?;
            let def = unit_def_for(u, ctx.rows, ctx.index, ctx.militia_defs, ctx.fallback)?;
            check_def_finite(&u.id, &def)?;
            finite(owner.difficulty_combat_mult, || {
                format!("owner {} difficultyCombatMult", u.owner_id)
            })?;
            if let Some(b) = u.battles_survived {
                finite(b, || format!("unit {} battlesSurvived", u.id))?;
            }
            let parametry = progress_frac(u.parametry_bonus_proc, "parametryBonusProc", &u.id)?;
            let pancerz = progress_frac(u.pancerz_bonus_proc, "pancerzBonusProc", &u.id)?;
            let veteran = veteran_combat_bonus_frac(u.battles_survived);
            let max_hp = effective_max_hp(unit_health_of(&def), parametry, veteran);
            let hp = match u.hp {
                None => max_hp,
                Some(h) => finite(h, || format!("unit {} hp", u.id))?
                    .max(0.0)
                    .min(max_hp),
            };
            let built = owner.built_ids.iter().map(String::as_str);
            let nazwa = if u.is_general {
                army_leader_title_text(army_leader_title(built.clone())).to_owned()
            } else {
                u.type_id.clone()
            };
            let mut stats = def;
            stats.insert("__canonicalEffectiveMaxHp".to_owned(), UVal::Num(max_hp));
            stats.insert("__canonicalCurrentHp".to_owned(), UVal::Num(hp));
            let civilian =
                crate::domain::siege_battle_adapter::is_civilian_unit(&u.category, &u.type_id);
            Ok(AdapterBattleUnit {
                id: u.id.clone(),
                owner_id: u.owner_id,
                side,
                nazwa,
                kategoria: u.category.clone(),
                stats,
                hp,
                max_hp,
                is_army_commander: u.is_general,
                pancerz_bonus_frac: pancerz,
                parametry_bonus_frac: parametry,
                veteran_bonus_frac: veteran,
                fortified_in_field: u.fortified_in_field,
                army_hungry: owner.army_hungry && !civilian,
                gold_deficit: owner.gold_deficit && !civilian,
                army_leader_morale_bonus_frac: army_leader_morale_bonus_frac(
                    has_commander.get(&u.owner_id).copied().unwrap_or(false),
                    built,
                ),
                difficulty_combat_mult: owner.difficulty_combat_mult,
                civ_bonusy: owner.civ_bonusy.clone(),
            })
        })
        .collect()
}

impl AdapterBattleUnit {
    fn s(&self, k: &str) -> &UVal {
        get(&self.stats, k)
    }

    /// `SetupUnit` (T5b-UNITS) z flaga `ranged = attackRange(bu) >= 2` (`:1410-1422`).
    pub fn setup_unit(&self) -> SetupUnit {
        let opt = |v: &UVal| (!nullish(v)).then(|| v.js_to_string());
        SetupUnit {
            kategoria: Some(self.kategoria.clone()),
            typ: opt(self.s("Typ")),
            jednostka: opt(self.s("Jednostka")),
            nazwa: Some(self.nazwa.clone()),
            is_army_commander: self.is_army_commander,
            ranged: self.is_ranged(),
        }
    }

    /// `String(stats['Jednostka'] ?? bu.nazwa ?? '')` po `normName`.
    fn norm_unit_name(&self) -> String {
        norm_name(&str_or(self.s("Jednostka"), &self.nazwa))
    }

    /// `movementPoints(bu)` (`:1381-1385`).
    pub fn movement_points(&self) -> f64 {
        js_round(combat_norm_field(
            self.s("Ruch w bitwie (heksy)"),
            DEFAULT_BATTLE_MOVE,
        ))
        .max(1.0)
    }

    /// `attackRange(bu)` (`:1410-1417`).
    pub fn attack_range(&self) -> f64 {
        let dyst = combat_norm_field(
            coalesce(self.s("missileAttack"), self.s("Atak dystansowy")),
            0.0,
        );
        let reach = combat_norm_field(
            stat_field(&self.stats, "Zasieg ataku (hex)", "Zasięg ataku (hex)"),
            0.0,
        );
        if reach >= 2.0 {
            return js_round(reach);
        }
        if dyst > 0.0 {
            return DEFAULT_RANGED_REACH.max(js_round(reach));
        }
        0.0
    }

    /// `isRanged(bu)` (`:1420-1422`).
    pub fn is_ranged(&self) -> bool {
        self.attack_range() >= 2.0
    }

    /// `ammoCount(bu)` (`:1434-1448`).
    pub fn ammo_count(&self) -> f64 {
        let raw = stat_field(&self.stats, "Ilosc pociskow", "Ilość pocisków");
        let n = match raw {
            UVal::Num(n) => *n,
            UVal::Str(s) => js_str_to_number(s),
            UVal::Bool(b) => f64::from(u8::from(*b)),
            UVal::Null => 0.0,
            UVal::Undef => f64::NAN,
        };
        let blank =
            matches!(raw, UVal::Undef | UVal::Null) || matches!(raw, UVal::Str(s) if s.is_empty());
        if blank || !n.is_finite() {
            return f64::INFINITY;
        }
        n.floor().max(0.0)
    }

    /// `isAntiCavSpear(bu)` (`:1522-1528`).
    pub fn is_anti_cav_spear(&self) -> bool {
        let cat = norm_name(&self.kategoria);
        if cat == "wlocznik" || cat == "falanga" || cat == "pikinier" {
            return true;
        }
        let n = self.norm_unit_name();
        [
            "wloczn", "spear", "pike", "falang", "phalan", "hoplit", "sarissa", "impi", "pikin",
        ]
        .iter()
        .any(|k| n.contains(k))
    }

    /// `isPhalanx(bu)` (`:1538-1543`).
    pub fn is_phalanx(&self) -> bool {
        if norm_name(&self.kategoria) == "falanga" {
            return true;
        }
        let n = self.norm_unit_name();
        ["falang", "phalan", "hoplit", "sarissa"]
            .iter()
            .any(|k| n.contains(k))
    }

    /// `bracesAgainstCharge(bu)` (`:1571-1580`): `String(s.Jednostka ?? bu.kategoria ?? '').toLowerCase()`.
    pub fn braces_against_charge(&self) -> bool {
        let name = str_or(self.s("Jednostka"), &self.kategoria).to_lowercase();
        ["wlocznik", "falanga", "impi", "wloczn"]
            .iter()
            .any(|k| name.contains(k))
    }

    /// `isNeverRout(bu)` (`:1592-1602`).
    pub fn is_never_rout(&self) -> bool {
        let flee = stat_field(&self.stats, "Morale ucieczki", "Morale ucieczki");
        let flee_blank = match flee {
            UVal::Undef | UVal::Null => true,
            UVal::Str(s) => s.is_empty() || s == "---" || !js_str_to_number(s).is_finite(),
            UVal::Num(n) => !n.is_finite(),
            UVal::Bool(_) => false,
        };
        let uwagi = norm_name(&str_or(self.s("Uwagi"), ""));
        if uwagi.contains("walczy do smierci") || uwagi.contains("niezlomny") {
            return true;
        }
        flee_blank
    }

    /// `moraleBaseFor(bu)` (`:1611-1624`).
    pub fn morale_base_for(&self) -> f64 {
        let v = parse_float_of(stat_field(&self.stats, "Morale bazowe", "Morale bazowe"));
        if !v.is_finite() {
            return MORALE_START;
        }
        let base = v.min(300.0).max(10.0);
        morale_with_army_leader_bonus(
            veteran_morale_bazowe_up(base, self.veteran_bonus_frac),
            self.army_leader_morale_bonus_frac,
        )
    }

    /// `fleeMoraleFor(bu)` (`:1627-1638`).
    pub fn flee_morale_for(&self) -> f64 {
        let v = parse_float_of(stat_field(
            &self.stats,
            "Morale ucieczki",
            "Morale ucieczki",
        ));
        if !v.is_finite() {
            return 25.0;
        }
        veteran_morale_ucieczki_down(v.min(295.0).max(0.0), self.veteran_bonus_frac)
    }

    /// `civUnitShapeForBattleUnit(bu)` (`:1387-1395`).
    pub fn civ_shape(&self) -> CivBonusUnitShape {
        let typ_nazwa = {
            let j = self.s("Jednostka");
            if nullish(j) {
                self.nazwa.clone()
            } else {
                j.js_to_string()
            }
        };
        CivBonusUnitShape {
            typ_nazwa,
            rola: str_or(self.s("Rola (linia)"), &self.kategoria),
            missile_attack: Some(combat_norm_field(
                coalesce(self.s("missileAttack"), self.s("Atak dystansowy")),
                0.0,
            )),
            counter_typ: Some(str_or(self.s("Typ"), "")),
        }
    }

    /// `_attackRangeFor(bu)` (`:7522-7527`).
    pub fn attack_range_for(&self) -> f64 {
        let base = self.attack_range();
        if base > 0.0 {
            js_round(base * civ_attack_range_multiplier(&self.civ_bonusy, &self.civ_shape()))
                .max(1.0)
        } else {
            0.0
        }
    }

    /// `_movementPointsFor(bu)` (`:7515-7520`), `terrain` = `this.terrain`, `shallow_sea` = `this.shallowSea`.
    pub fn movement_points_for(&self, terrain: &str, shallow_sea: bool) -> f64 {
        let m = civ_movement_multiplier(&self.civ_bonusy, &self.civ_shape(), terrain, shallow_sea);
        js_round(self.movement_points() * m).max(1.0)
    }

    /// `toCombatUnit(bu, armyHungerStatMult, false, goldDeficitStatMult)` (istniejacy port K5I2a4).
    pub fn combat_unit(&self, opts: &ToCombatUnitOpts) -> CombatUnitModel {
        to_combat_unit(
            &BattleUnitIn {
                stats: Some(self.stats.clone()),
                kategoria: self.kategoria.clone(),
                hp: Some(self.hp),
                veteran_bonus_frac: Some(self.veteran_bonus_frac),
                army_hungry: self.army_hungry,
                gold_deficit: self.gold_deficit,
            },
            opts,
        )
    }
}

fn round6(x: f64) -> f64 {
    js_round(x * 1e6) / 1e6
}

/// `veteranMoraleBazoweUp(base, frac)` (`veteran.ts:409-412`).
pub fn veteran_morale_bazowe_up(base: f64, frac: f64) -> f64 {
    if frac == 0.0 || frac.is_nan() || !base.is_finite() {
        return base;
    }
    round6(base * (1.0 + frac)).ceil()
}

/// `veteranMoraleUcieczkiDown(base, frac)` (`veteran.ts:415-418`), podloga `VETERAN_MORALE_UCIECZKI_FLOOR = 1`.
pub fn veteran_morale_ucieczki_down(base: f64, frac: f64) -> f64 {
    if frac == 0.0 || frac.is_nan() || !base.is_finite() {
        return base;
    }
    round6(base * (1.0 - frac)).floor().max(1.0)
}

/// `wallCrownShooterRange(effectiveRange)` (`city-defense.ts:139-142`).
pub fn wall_crown_shooter_range(r: f64) -> f64 {
    if !(r > 0.0) {
        // `Math.max(0, effectiveRange || 0)`: NaN i 0 -> 0.
        return if r.is_nan() { 0.0 } else { r.max(0.0) };
    }
    (r * WALL_CROWN_RANGE_MULT).ceil()
}

/// Miejsce spawnu jednostki w bitwie oblezniczej.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SpawnSlot {
    /// Atakujacy (`_placeUnits`, `:5440-5484`).
    Attacker,
    /// Obronca w obrebie muru, poza korona (`_placeSiegeDefenders` `:4527-4566`).
    DefenderInner,
    /// Obronca na koronie muru (`:4694-4730`, `onWallWalkway = true`, potem `_applyTerrainRange`).
    DefenderCrown,
}

/// Otoczenie spawnu czytane przez metody sceny.
#[derive(Debug, Clone, PartialEq)]
pub struct SpawnEnv {
    /// `this.terrain` (`_movementPointsFor`).
    pub terrain: String,
    /// `this.shallowSea`.
    pub shallow_sea: bool,
    /// `terrainRangeDelta(combatTerrainName(kafel korony))` (`_applyTerrainRange` `:7495-7496`), wejscie z T5 (mapa pola).
    pub crown_range_delta: f64,
}

/// Pola `RuntimeBattleUnit` ustawiane przy spawnie (bez pozycji i grafiki).
#[derive(Debug, Clone, PartialEq)]
pub struct SpawnFields {
    pub move_left: f64,
    pub range: f64,
    pub range_base: f64,
    pub ranged: bool,
    pub ranged_base: bool,
    pub primary_ranged: bool,
    pub ammo_left: f64,
    pub ammo_max: f64,
    pub mounted: bool,
    pub anti_cav_spear: bool,
    pub phalanx: bool,
    pub morale: f64,
    pub morale_max: f64,
    pub never_rout: bool,
    pub flee_morale: f64,
    pub on_wall_walkway: bool,
    pub is_army_commander: bool,
    pub is_catapult: bool,
}

/// Pola spawnu jednostki w danym miejscu (`slot`).
pub fn spawn_fields(
    bu: &AdapterBattleUnit,
    slot: SpawnSlot,
    env: &SpawnEnv,
) -> Result<SpawnFields, AdapterError> {
    finite(env.crown_range_delta, || "crown_range_delta".to_owned())?;
    let su = bu.setup_unit();
    let is_catapult = su.is_catapult();
    let ammo = bu.ammo_count();
    let (move_left, range_base, ranged_base, on_wall, morale) = match slot {
        SpawnSlot::Attacker => (
            bu.movement_points(),
            bu.attack_range(),
            bu.is_ranged(),
            false,
            bu.morale_base_for(),
        ),
        SpawnSlot::DefenderInner => {
            let rf = bu.attack_range_for();
            (
                bu.movement_points_for(&env.terrain, env.shallow_sea),
                rf,
                rf >= 2.0,
                false,
                bu.morale_base_for() * DEFENDER_MORALE_MULT,
            )
        }
        SpawnSlot::DefenderCrown => {
            let rf = bu.attack_range_for();
            let (r, rd) = if is_catapult {
                (rf.max(DEF_CATAPULT_CROWN_RANGE), true)
            } else {
                (rf, rf >= 2.0)
            };
            (
                bu.movement_points_for(&env.terrain, env.shallow_sea),
                r,
                rd,
                true,
                bu.morale_base_for() * DEFENDER_MORALE_MULT,
            )
        }
    };
    let mut range = range_base;
    if slot == SpawnSlot::DefenderCrown {
        // `_applyTerrainRange(ru)` (`:7490-7502`).
        if ranged_base && !is_catapult && range_base > 0.0 {
            range = (range_base + env.crown_range_delta).max(0.0);
            // `_isWallCrownShooter`: obronca, korona, `rangedBase`, nie katapulta, `rangeBase > 0`.
            range = wall_crown_shooter_range(range);
        }
    }
    Ok(SpawnFields {
        move_left,
        range,
        range_base,
        ranged: ranged_base,
        ranged_base,
        primary_ranged: su.is_primary_ranged(),
        ammo_left: ammo,
        ammo_max: ammo,
        mounted: su.is_mounted(),
        anti_cav_spear: bu.is_anti_cav_spear(),
        phalanx: bu.is_phalanx(),
        morale,
        morale_max: morale,
        never_rout: bu.is_never_rout(),
        flee_morale: bu.flee_morale_for(),
        on_wall_walkway: on_wall,
        is_army_commander: bu.is_army_commander,
        is_catapult,
    })
}

/// `loadStartingMoralePowerParams()` (`combat.ts:1335-1346`); wartosci pinu (`morale_przewaga_mocy`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct StartingMoraleParams {
    pub wspolczynnik_proc: f64,
    pub sufit_proc: f64,
    pub epsilon_ponad_flee: f64,
}

impl StartingMoraleParams {
    pub fn pin() -> Self {
        Self {
            wspolczynnik_proc: 50.0,
            sufit_proc: 65.0,
            epsilon_ponad_flee: 1.0,
        }
    }
}

/// `Math.log10` silnika V8 (`base::ieee754::log10` = fdlibm `e_log10.c` na `__ieee754_log`). `f64::log10` (libm systemu)
/// rozni sie od V8 o 1 ulp dla czesci argumentow (zmierzone: `log10(3.0095465393794747)`), a wynik zasila
/// `startingMoralePenaltyFrac`. Zgodnosc bit w bit pilnuja wektory `log10.json` (V8 z generatora).
pub fn js_log10(x: f64) -> f64 {
    const TWO54: f64 = f64::from_bits(0x4350_0000_0000_0000);
    const IVLN10: f64 = f64::from_bits(0x3fdb_cb7b_1526_e50e);
    const LOG10_2HI: f64 = f64::from_bits(0x3fd3_4413_509f_6000);
    const LOG10_2LO: f64 = f64::from_bits(0x3d59_fef3_11f1_2b36);
    let mut x = x;
    let (mut hx, lx) = words(x);
    let mut k: i32 = 0;
    if hx < 0x0010_0000 {
        if (hx & 0x7fff_ffff) == 0 && lx == 0 {
            return f64::NEG_INFINITY;
        }
        if hx < 0 {
            return f64::NAN;
        }
        k -= 54;
        x *= TWO54;
        hx = words(x).0;
    }
    if hx >= 0x7ff0_0000 {
        return x + x;
    }
    k += (hx >> 20) - 1023;
    let i = i32::from(k < 0);
    hx = (hx & 0x000f_ffff) | ((0x3ff - i) << 20);
    let y = f64::from(k + i);
    x = with_high(x, hx);
    let z = y * LOG10_2LO + IVLN10 * fdlibm_log(x);
    z + y * LOG10_2HI
}

/// Slowa IEEE (`__HI`, `__LO`).
#[allow(clippy::cast_possible_wrap, clippy::cast_possible_truncation)]
fn words(x: f64) -> (i32, u32) {
    let b = x.to_bits();
    ((b >> 32) as u32 as i32, b as u32)
}

#[allow(clippy::cast_sign_loss)]
fn with_high(x: f64, hi: i32) -> f64 {
    f64::from_bits((u64::from(hi as u32) << 32) | (x.to_bits() & 0xffff_ffff))
}

/// fdlibm `__ieee754_log` (`e_log.c`), uzywane przez `js_log10`.
fn fdlibm_log(x: f64) -> f64 {
    const LN2_HI: f64 = f64::from_bits(0x3fe6_2e42_fee0_0000);
    const LN2_LO: f64 = f64::from_bits(0x3dea_39ef_3579_3c76);
    const TWO54: f64 = f64::from_bits(0x4350_0000_0000_0000);
    const LG1: f64 = f64::from_bits(0x3fe5_5555_5555_5593);
    const LG2: f64 = f64::from_bits(0x3fd9_9999_9997_fa04);
    const LG3: f64 = f64::from_bits(0x3fd2_4924_9422_9359);
    const LG4: f64 = f64::from_bits(0x3fcc_71c5_1d8e_78af);
    const LG5: f64 = f64::from_bits(0x3fc7_4664_96cb_03de);
    const LG6: f64 = f64::from_bits(0x3fc3_9a09_d078_c69f);
    const LG7: f64 = f64::from_bits(0x3fc2_f112_df3e_5244);
    let mut x = x;
    let (mut hx, lx) = words(x);
    let mut k: i32 = 0;
    if hx < 0x0010_0000 {
        if (hx & 0x7fff_ffff) == 0 && lx == 0 {
            return f64::NEG_INFINITY;
        }
        if hx < 0 {
            return f64::NAN;
        }
        k -= 54;
        x *= TWO54;
        hx = words(x).0;
    }
    if hx >= 0x7ff0_0000 {
        return x + x;
    }
    k += (hx >> 20) - 1023;
    hx &= 0x000f_ffff;
    let i = (hx + 0x95f64) & 0x0010_0000;
    x = with_high(x, hx | (i ^ 0x3ff0_0000));
    k += i >> 20;
    let f = x - 1.0;
    let dk = f64::from(k);
    if (0x000f_ffff & (2 + hx)) < 3 {
        if f == 0.0 {
            return if k == 0 {
                0.0
            } else {
                dk * LN2_HI + dk * LN2_LO
            };
        }
        let r = f * f * (0.5 - 0.333_333_333_333_333_33 * f);
        return if k == 0 {
            f - r
        } else {
            dk * LN2_HI - ((r - dk * LN2_LO) - f)
        };
    }
    let s = f / (2.0 + f);
    let z = s * s;
    let mut i = hx - 0x6147a;
    let w = z * z;
    let j = 0x6b851 - hx;
    let t1 = w * (LG2 + w * (LG4 + w * LG6));
    let t2 = z * (LG1 + w * (LG3 + w * (LG5 + w * LG7)));
    i |= j;
    let r = t2 + t1;
    if i > 0 {
        let hfsq = 0.5 * f * f;
        if k == 0 {
            f - (hfsq - s * (hfsq + r))
        } else {
            dk * LN2_HI - ((hfsq - (s * (hfsq + r) + dk * LN2_LO)) - f)
        }
    } else if k == 0 {
        f - s * (f - r)
    } else {
        dk * LN2_HI - ((s * (f - r) - dk * LN2_LO) - f)
    }
}

/// `startingMoralePenaltyFrac(ratio)` (`combat.ts:1349-1356`).
pub fn starting_morale_penalty_frac(ratio: f64, p: &StartingMoraleParams) -> f64 {
    if !ratio.is_finite() || ratio <= 1.0 {
        return 0.0;
    }
    let raw = (p.wspolczynnik_proc / 100.0) * js_log10(ratio);
    (p.sufit_proc / 100.0).min(raw)
}

/// `powerAdvantage(mAtk, mDef)` (`combat.ts:1387-1396`): `(slabsza strona, stosunek)`.
pub fn power_advantage(m_atk: f64, m_def: f64) -> (Option<Side>, f64) {
    if !(m_atk > 0.0) || !(m_def > 0.0) || m_atk == m_def {
        return (None, 1.0);
    }
    if m_atk > m_def {
        (Some(Side::Def), m_atk / m_def)
    } else {
        (Some(Side::Atk), m_def / m_atk)
    }
}

const BATTLE_EXCLUDED_TYPES: [&str; 2] = ["Zwiadowca", "Osadnik"];

/// `hpWeightedFieldPower(roster)` (`combat.ts:1373-1385`) z `toPowerUnit` (`battleScene.ts:5601-5616`).
pub fn hp_weighted_field_power(units: &[AdapterBattleUnit], opts: &ToCombatUnitOpts) -> f64 {
    let coeffs = UnitPowerCoeffs::from_params();
    let mut sum = 0.0;
    for ru in units {
        let cu = ru.combat_unit(opts);
        let def = ArmyUnitDef {
            power: UnitPowerInput {
                melee_attack: cu.melee_attack,
                melee_defence: cu.melee_defence,
                weapon_damage: cu.weapon_damage,
                piercing: cu.piercing,
                armor: cu.armor,
                charge_bonus: cu.charge_bonus,
                health: cu.health,
                missile_attack: cu.missile_attack,
                typ: None,
                jednostka: None,
            },
            rola_linia: Some(cu.rola.clone()),
            field_power_cache: None,
        };
        // `isFieldBattleUnit(typeId, def)` (`auto-battle-power.ts:39-43`), `typeId = cu.typNazwa`.
        let type_id = cu.typ_nazwa.js_to_string();
        if is_siege_rola(def.rola_linia.as_deref())
            || BATTLE_EXCLUDED_TYPES.contains(&type_id.as_str())
        {
            continue;
        }
        let m = army_field_power(&def, &coeffs);
        if !(m > 0.0) {
            continue;
        }
        let max_hp = if ru.max_hp > 0.0 { ru.max_hp } else { 0.0 };
        let frac = if max_hp > 0.0 {
            (ru.hp / max_hp).min(1.0).max(0.0)
        } else {
            0.0
        };
        sum += m * frac;
    }
    js_round(sum * 10.0) / 10.0
}

/// Wynik `_applyStartingMoralePowerPenalty` (obserwacja).
#[derive(Debug, Clone, PartialEq)]
pub struct MoralePenalty {
    pub m_atk: f64,
    pub m_def: f64,
    pub weaker: Option<Side>,
    pub ratio: f64,
    pub frac: f64,
    /// Liczba jednostek, ktorym obnizono morale.
    pub changed: usize,
}

/// `_applyStartingMoralePowerPenalty()` (`battleScene.ts:5597-5629`) na polach spawnu obu stron (wszystkie zywe na starcie).
/// Obniza wylacznie `morale` slabszej strony (`moraleMax`, `fleeMorale` bez zmian).
pub fn apply_starting_morale_power_penalty(
    atk: &[AdapterBattleUnit],
    def: &[AdapterBattleUnit],
    atk_fields: &mut [SpawnFields],
    def_fields: &mut [SpawnFields],
    opts: &ToCombatUnitOpts,
    p: &StartingMoraleParams,
) -> MoralePenalty {
    let m_atk = hp_weighted_field_power(atk, opts);
    let m_def = hp_weighted_field_power(def, opts);
    let (weaker, ratio) = power_advantage(m_atk, m_def);
    let frac = starting_morale_penalty_frac(ratio, p);
    let mut changed = 0;
    if let Some(side) = weaker {
        if frac > 0.0 {
            let eps = if p.epsilon_ponad_flee.is_finite() {
                p.epsilon_ponad_flee
            } else {
                1.0
            };
            let fields: &mut [SpawnFields] = match side {
                Side::Atk => atk_fields,
                Side::Def => def_fields,
            };
            for f in fields.iter_mut() {
                let ukarane = js_round(f.morale * (1.0 - frac));
                let flee = if f.flee_morale.is_finite() {
                    f.flee_morale
                } else {
                    0.0
                };
                let podloga = f.morale.min(flee + eps);
                f.morale = podloga.max(ukarane).max(0.0);
                changed += 1;
            }
        }
    }
    MoralePenalty {
        m_atk,
        m_def,
        weaker,
        ratio,
        frac,
        changed,
    }
}

/// Wiersz `counters.json` po `normCounters` (`battleScene.ts:1336-1352`).
#[derive(Debug, Clone, PartialEq)]
pub struct CounterRow {
    pub typ_atakujacy: String,
    pub cel: String,
    pub bonus: UVal,
    pub rodzaj: UVal,
    pub status: UVal,
}

/// `normCounters(raw)` (`battleScene.ts:1336-1352`) na tablicy JSON.
pub fn norm_counters(raw: &serde_json::Value) -> Vec<CounterRow> {
    let Some(arr) = raw.as_array() else {
        return Vec::new();
    };
    let s = |v: Option<&serde_json::Value>| match v {
        None | Some(serde_json::Value::Null) => UVal::Str(String::new()),
        Some(serde_json::Value::String(x)) => UVal::Str(x.clone()),
        Some(serde_json::Value::Bool(b)) => UVal::Bool(*b),
        Some(serde_json::Value::Number(n)) => UVal::Num(n.as_f64().unwrap_or(f64::NAN)),
        Some(other) => UVal::Str(other.to_string()),
    };
    arr.iter()
        .filter_map(|c| {
            let o = c.as_object()?;
            let typ_a = o
                .get("Typ atakujacy")
                .filter(|v| !v.is_null())
                .or_else(|| o.get("Typ atakujący"))?;
            let typ_a = typ_a.as_str()?;
            let cel = o.get("Cel (typ)")?.as_str()?;
            Some(CounterRow {
                typ_atakujacy: typ_a.to_owned(),
                cel: cel.to_owned(),
                bonus: s(o.get("Bonus")),
                rodzaj: s(o.get("Rodzaj (Atak/Obrona)")),
                status: s(o.get("Status")),
            })
        })
        .collect()
}

/// `parseCounterBonusFrac(raw)` (`combat.ts:525-531`).
fn parse_counter_bonus_frac(raw: &UVal) -> Option<f64> {
    let UVal::Str(s) = raw else {
        return None;
    };
    let cleaned = s.trim().replace('\u{2212}', "-").replacen('%', "", 1);
    if cleaned.is_empty() {
        return None;
    }
    let n = js_parse_float(&cleaned);
    n.is_finite().then_some(n / 100.0)
}

/// `counterMultiplier(attackerType, defenderType, counters)` (`combat.ts:553-577`); `counter_mult` = `COUNTER_MULT`
/// (`combat-params.json` `counter_multiplier`).
pub fn counter_multiplier_pin(atk: &str, def: &str, rows: &[CounterRow], counter_mult: f64) -> f64 {
    let a_low = atk.to_lowercase();
    let d_low = def.to_lowercase();
    for c in rows {
        if !matches!(&c.status, UVal::Str(s) if s == "potwierdzone") {
            continue;
        }
        if !matches!(&c.rodzaj, UVal::Str(s) if s == "Atak") {
            continue;
        }
        let c_atk = c.typ_atakujacy.to_lowercase();
        let c_cel = c.cel.to_lowercase();
        let atk_match = a_low.contains(&c_atk) || c_atk.contains(&a_low);
        let def_match = c_cel
            .split('/')
            .map(crate::domain::siege_tactics_classify::js_trim)
            .any(|alt| d_low.contains(alt) || alt.contains(d_low.as_str()));
        if atk_match && def_match {
            return parse_counter_bonus_frac(&c.bonus).map_or(counter_mult, |f| 1.0 + f);
        }
    }
    1.0
}

/// Statyczne wejscia ciosu jednej jednostki (`cuA`/`cuD` z `toCombatUnit`, `bracesAgainstCharge`, `mounted`).
#[derive(Debug, Clone, PartialEq)]
pub struct UnitBlowTemplate {
    pub cu: CombatUnitModel,
    pub attacker: AttackerCu,
    pub defender: DefenderCu,
    pub braces_against_charge: bool,
    pub mounted: bool,
}

/// Szablon ciosu jednostki.
pub fn unit_blow_template(bu: &AdapterBattleUnit, opts: &ToCombatUnitOpts) -> UnitBlowTemplate {
    let cu = bu.combat_unit(opts);
    UnitBlowTemplate {
        attacker: attacker_from_cu(&cu),
        defender: defender_from_cu(&cu),
        braces_against_charge: bu.braces_against_charge(),
        mounted: bu.setup_unit().is_mounted(),
        cu,
    }
}

/// Macierz `counterMultiplier(cuA.counterTyp, cuD.counterTyp)` dla kazdej pary `(atakujacy z src, obronca z dst)`.
pub fn counter_matrix(
    src: &[UnitBlowTemplate],
    dst: &[UnitBlowTemplate],
    rows: &[CounterRow],
    counter_mult: f64,
) -> Vec<Vec<f64>> {
    src.iter()
        .map(|a| {
            dst.iter()
                .map(|d| {
                    counter_multiplier_pin(&a.cu.counter_typ, &d.cu.counter_typ, rows, counter_mult)
                })
                .collect()
        })
        .collect()
}

/// D-T8-N1: `_isUnitDoctrineAuto(ru)` liczone ze stanu ciala (`unitDoctrine`, `groupId`, `_groupMeta`), nie stala. Na
/// starcie bitwy pin ma `unitDoctrine = null`, `groupId = null` i pusta `_groupMeta` (`:4572-4576`, `:5476-5480`).
pub fn doctrine_auto_for(
    unit_doctrine: Option<GroupDoctrine>,
    group_id: Option<&str>,
    group_meta: &BTreeMap<String, (GroupDoctrine, bool)>,
) -> bool {
    let has_group = group_id.is_some_and(|g| !g.is_empty());
    let group = group_id.and_then(|g| group_meta.get(g).copied());
    is_unit_doctrine_auto(unit_doctrine, has_group, group)
}
