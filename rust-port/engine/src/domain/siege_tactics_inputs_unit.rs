//! P6 SIEGE-TAKTYKA K5i-2a4 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A4-Q1): `toCombatUnit` i zaleznosci z pinu
//! `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (port 1:1, wektory z wykonania TEKSTU pinu w node).
//!
//! Zakres (wszystko `Ported`, wektory: `tests/p6_siege_tactics_inputs_unit_vectors/vectors.json`):
//! * [`to_combat_unit`] = `toCombatUnit` (`gra/src/battle/battleScene.ts:1355-1378`),
//! * [`combat_unit_from_def`] = `combatUnitFromDef` (`gra/src/game/combat.ts:194-234`),
//! * [`combat_norm_field`] = `combatNormField` (`combat.ts:148-152`), [`unit_row_stat`] = `unitRowStat` (`combat.ts:158-176`),
//!   [`combat_stat_field`] = `combatStatField` (`combat.ts:178-184`),
//! * [`apply_veteran_frac_to_combat_unit`] = `applyVeteranFracToCombatUnit` (`gra/src/game/veteran.ts:362-385`),
//! * [`apply_army_hunger_stat_mult_to_combat_unit`] = `applyArmyHungerStatMultToCombatUnit` (`gra/src/game/army-starvation.ts:35-52`),
//! * [`apply_gold_deficit_stat_mult_to_combat_unit`] = `applyGoldDeficitStatMultToCombatUnit` (`gra/src/game/gold-deficit.ts:182-199`).
//!
//! Istniejace porty (BEZ duplikacji): mnozenie "slabych" statow dla deficytu zlota JUZ ISTNIEJE jako
//! `turn_economy::gold_deficit::apply_gold_deficit_stat_mult_to_combat_unit` (na podzbiorze statow `GoldDeficitCombatStats`);
//! tu jest mapowane z/do [`CombatUnitModel`]. Ten sam kod obsluguje glod armii (pin: identyczne cialo, osobna nazwa i parametr).
//! `combat::CombatUnit` (silnik autobitwy) to INNY, calkowitoliczbowy model i NIE jest strukturą `CombatUnit` z pinu;
//! [`CombatUnitModel`] jest modelem pinowym (pola f64 `meleeAttack`, `weaponDamage`, ...), ktorego pola zasilaja `BlowInput`
//! rdzenia K5I (`siege_tactics_blow`).
//!
//! Semantyka JS jest odwzorowana jawnie przez [`UVal`] (wartosc pola `units.json`: undefined/null/bool/liczba/napis):
//! `combatNormField` traktuje `null`/`undefined`/`'---'`/`'—'`/`''` jako brak, napisy przechodza przez `parseFloat`, a NaN -> fallback.
//!
//! Znane, swiadome uproszczenia: wartosc logiczna w polu LICZBOWYM `units.json` nie wystepuje w danych (w JS przeszlaby jako
//! `true`, tu liczy sie jako 1/0); `unbreakable?` z `CombatUnit` nie jest ustawiane przez `combatUnitFromDef`, wiec nie ma go w modelu.
//! Stale `BTERRAIN_*` NIE koliduja z `siege_tactics_inputs_terrain` (a1 nie definiuje kodow kafli) - unifikacja niepotrzebna.

use std::collections::HashMap;

use crate::domain::siege_tactics_inputs_pos::js_str_to_number;
use crate::domain::turn_economy::gold_deficit::{
    apply_gold_deficit_stat_mult_to_combat_unit as gold_deficit_stats_mult, GoldDeficitCombatStats,
};
use crate::domain::unit_health::js_parse_float;

/// Wartosc pola wiersza `units.json` (JS: `undefined`, `null`, `boolean`, `number`, `string`).
#[derive(Debug, Clone, PartialEq)]
pub enum UVal {
    Undef,
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
}

impl UVal {
    fn is_nullish(&self) -> bool {
        matches!(self, UVal::Undef | UVal::Null)
    }

    /// `String(v)` dla wartosci pola (ToString).
    pub fn js_to_string(&self) -> String {
        match self {
            UVal::Undef => "undefined".to_string(),
            UVal::Null => "null".to_string(),
            UVal::Bool(b) => b.to_string(),
            UVal::Num(n) => js_num_to_string(*n),
            UVal::Str(s) => s.clone(),
        }
    }

    /// `Number(v)`; tylko dla wartosci logicznych w polach liczbowych (patrz uproszczenia w dokumencie modulu).
    fn to_number(&self) -> f64 {
        match self {
            UVal::Undef => f64::NAN,
            UVal::Null => 0.0,
            UVal::Bool(b) => f64::from(u8::from(*b)),
            UVal::Num(n) => *n,
            UVal::Str(s) => js_str_to_number(s),
        }
    }
}

/// `Number.prototype.toString()` (radix 10) dla f64: NaN/Infinity, calkowite < 1e21 bez wykladnika, wykladnik `e+N`/`e-N` jak JS.
pub fn js_num_to_string(n: f64) -> String {
    if n.is_nan() {
        return "NaN".into();
    }
    if n == 0.0 {
        return "0".into();
    }
    if n.is_infinite() {
        return if n > 0.0 { "Infinity" } else { "-Infinity" }.into();
    }
    let a = n.abs();
    let s = if (1e-6..1e21).contains(&a) {
        format!("{a}")
    } else {
        let e = format!("{a:e}");
        let (m, ex) = e.split_once('e').expect("wykladnik");
        let ex: i32 = ex.parse().expect("wykladnik calkowity");
        format!("{m}e{}{}", if ex < 0 { '-' } else { '+' }, ex.abs())
    };
    if n < 0.0 {
        format!("-{s}")
    } else {
        s
    }
}

/// Wiersz `units.json` / `bu.stats`: brak klucza = `undefined`.
pub type StatRow = HashMap<String, UVal>;

static UNDEF: UVal = UVal::Undef;

fn get<'a>(s: &'a StatRow, k: &str) -> &'a UVal {
    s.get(k).unwrap_or(&UNDEF)
}

/// Brak wartosci w sensie `combatStatField`/`unitRowStat`: `null`, `undefined`, `'---'`, `'—'`, `''`.
fn is_missing_stat(v: &UVal) -> bool {
    match v {
        UVal::Undef | UVal::Null => true,
        UVal::Str(s) => s == "---" || s == "\u{2014}" || s.is_empty(),
        _ => false,
    }
}

/// `combatNormField(v, fallback)` (`combat.ts:148-152`).
pub fn combat_norm_field(v: &UVal, fallback: f64) -> f64 {
    if is_missing_stat(v) {
        return fallback;
    }
    let n = match v {
        UVal::Str(s) => js_parse_float(s),
        other => other.to_number(),
    };
    if n.is_nan() {
        fallback
    } else {
        n
    }
}

/// `unitRowStat(def, primary, legacy, fallback)` (`combat.ts:158-176`): `def = None` (null/undefined) -> fallback; pole `legacy`
/// czytane tylko gdy `primary` jest BRAKIEM (nie gdy wartosc jest NaN - wtedy fallback bez zagladania do `legacy`).
pub fn unit_row_stat(
    def: Option<&StatRow>,
    primary: &str,
    legacy: Option<&str>,
    fallback: f64,
) -> f64 {
    let Some(def) = def else {
        return fallback;
    };
    let v = get(def, primary);
    if !is_missing_stat(v) {
        return combat_norm_field(v, fallback);
    }
    if let Some(l) = legacy {
        let lv = get(def, l);
        if !is_missing_stat(lv) {
            return combat_norm_field(lv, fallback);
        }
    }
    fallback
}

/// `combatStatField(s, ...keys)` (`combat.ts:178-184`): pierwsza wartosc nie-brakujaca; inaczej `undefined` (`None`).
pub fn combat_stat_field<'a>(s: &'a StatRow, keys: &[&str]) -> Option<&'a UVal> {
    keys.iter().map(|k| get(s, k)).find(|v| !is_missing_stat(v))
}

/// `CombatUnit` z pinu (`combat.ts:50-146`), pola liczbowe jako f64. `None` w `Option<f64>` = `undefined`/`null`.
#[derive(Debug, Clone, PartialEq)]
pub struct CombatUnitModel {
    /// `typNazwa` (z reguly napis; w JS moze to byc dowolna wartosc `opts.typNazwa`/`Jednostka`).
    pub typ_nazwa: UVal,
    pub counter_typ: String,
    pub rola: String,
    pub melee_attack: f64,
    pub melee_defence: f64,
    pub weapon_damage: f64,
    pub armor: f64,
    pub piercing: f64,
    pub charge_bonus: f64,
    pub health: f64,
    pub canonical_effective_max_hp: Option<f64>,
    pub canonical_current_hp: Option<f64>,
    pub veteran_health_bonus_frac: Option<f64>,
    /// `'Prog dezercji (% health)'`; `None` = `null`.
    pub prog_dezercji: Option<f64>,
    pub missile_attack: f64,
    pub zasieg_ataku: UVal,
    pub ilosc_pociskow: UVal,
    pub ruch_w_bitwie: UVal,
    pub kara_flanka: f64,
    pub kara_tyl: f64,
    pub super_jednostka: UVal,
}

/// `CombatUnitFromDefOpts` (`combat.ts:186-192`). `typ_nazwa`/`rola`/`hp`: `None` = `undefined` (null tez przechodzi do dalszych `??`).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct CombatUnitFromDefOpts {
    pub typ_nazwa: Option<UVal>,
    pub rola: Option<String>,
    pub hp: Option<f64>,
}

/// `Math.round` z JS (polowki ku +Infinity, `-0` dla malych ujemnych; zgodnie z `turn_economy::gold_deficit`).
fn js_round(x: f64) -> f64 {
    if !x.is_finite() || x.fract() == 0.0 {
        return x;
    }
    let floor = x.floor();
    let rounded = if x - floor >= 0.5 { floor + 1.0 } else { floor };
    if rounded == 0.0 && x < 0.0 {
        -0.0
    } else {
        rounded
    }
}

/// `round4` z pinu (`veteran.ts`): `Math.round(x * 10000) / 10000`.
fn round4(x: f64) -> f64 {
    js_round(x * 10000.0) / 10000.0
}

/// `combatUnitFromDef(def, opts)` (`combat.ts:194-234`).
pub fn combat_unit_from_def(def: &StatRow, opts: &CombatUnitFromDefOpts) -> CombatUnitModel {
    let prog = combat_stat_field(
        def,
        &["Pr\u{f3}g dezercji (% health)", "Prog dezercji (% health)"],
    )
    .map(|raw| combat_norm_field(raw, 0.25));
    let max_hp_raw = if get(def, "health").is_nullish() {
        get(def, "Health")
    } else {
        get(def, "health")
    };
    let max_hp = combat_norm_field(max_hp_raw, 30.0);
    let finite_or_none = |k: &str| {
        let n = combat_norm_field(get(def, k), f64::NAN);
        n.is_finite().then_some(n)
    };
    let jednostka = get(def, "Jednostka");
    let opts_typ = opts.typ_nazwa.as_ref().filter(|v| !v.is_nullish());
    // typNazwa: opts.typNazwa ?? String(def['Jednostka'] ?? '')
    let typ_nazwa = match opts_typ {
        Some(v) => v.clone(),
        None => UVal::Str(if jednostka.is_nullish() {
            String::new()
        } else {
            jednostka.js_to_string()
        }),
    };
    // counterTyp: String(def['Typ'] ?? opts.typNazwa ?? def['Jednostka'] ?? '')
    let typ = get(def, "Typ");
    let counter_typ = if !typ.is_nullish() {
        typ.js_to_string()
    } else if let Some(v) = opts_typ {
        v.js_to_string()
    } else if !jednostka.is_nullish() {
        jednostka.js_to_string()
    } else {
        String::new()
    };
    let rola = match &opts.rola {
        Some(r) => r.clone(),
        None => {
            let r = get(def, "Rola (linia)");
            if r.is_nullish() {
                "Wrecz".to_string()
            } else {
                r.js_to_string()
            }
        }
    };
    let or_null = |v: &UVal| {
        if matches!(v, UVal::Undef) {
            UVal::Null
        } else {
            v.clone()
        }
    };
    let kara_tyl_raw = combat_stat_field(
        def,
        &["Kara obrony z ty\u{142}u (%)", "Kara obrony z tylu (%)"],
    );
    CombatUnitModel {
        typ_nazwa,
        counter_typ,
        rola,
        melee_attack: combat_norm_field(get(def, "meleeAttack"), 0.0),
        melee_defence: combat_norm_field(get(def, "meleeDefence"), 0.0),
        weapon_damage: combat_norm_field(get(def, "weaponDamage"), 0.0),
        armor: unit_row_stat(Some(def), "armor", Some("Pancerz"), 0.0),
        piercing: unit_row_stat(Some(def), "piercing", Some("Przebicie"), 0.0),
        charge_bonus: unit_row_stat(Some(def), "chargeBonus", Some("Uderzenie"), 0.0),
        health: opts.hp.unwrap_or(max_hp),
        canonical_effective_max_hp: finite_or_none("__canonicalEffectiveMaxHp"),
        canonical_current_hp: finite_or_none("__canonicalCurrentHp"),
        veteran_health_bonus_frac: None,
        prog_dezercji: prog,
        missile_attack: combat_norm_field(get(def, "missileAttack"), 0.0),
        zasieg_ataku: or_null(
            combat_stat_field(def, &["Zasi\u{119}g ataku (hex)", "Zasieg ataku (hex)"])
                .unwrap_or(&UNDEF),
        ),
        ilosc_pociskow: or_null(
            combat_stat_field(def, &["Ilo\u{15b}\u{107} pocisk\u{f3}w", "Ilosc pociskow"])
                .unwrap_or(&UNDEF),
        ),
        ruch_w_bitwie: or_null(get(def, "Ruch w bitwie (heksy)")),
        kara_flanka: combat_norm_field(get(def, "Kara obrony z flanki (%)"), 50.0),
        kara_tyl: combat_norm_field(kara_tyl_raw.unwrap_or(&UNDEF), 80.0),
        super_jednostka: get(def, "Super-jednostka").clone(),
    }
}

/// `applyVeteranFracToCombatUnit(cu, frac)` (`veteran.ts:362-385`): `!frac` (0, -0, NaN) -> bez zmian; inaczej statystyki
/// x(1+frac), prog dezercji x(1-frac) zaokraglony do 4 miejsc, pancerz bez zmian, `veteranHealthBonusFrac = frac`.
pub fn apply_veteran_frac_to_combat_unit(cu: &CombatUnitModel, frac: f64) -> CombatUnitModel {
    if frac == 0.0 || frac.is_nan() {
        return cu.clone();
    }
    let up = 1.0 + frac;
    CombatUnitModel {
        melee_attack: cu.melee_attack * up,
        melee_defence: cu.melee_defence * up,
        weapon_damage: cu.weapon_damage * up,
        piercing: cu.piercing * up,
        charge_bonus: cu.charge_bonus * up,
        health: cu.health * up,
        veteran_health_bonus_frac: Some(frac),
        missile_attack: cu.missile_attack * up,
        prog_dezercji: cu.prog_dezercji.map(|p| round4(p * (1.0 - frac))),
        ..cu.clone()
    }
}

fn weaken_stats(cu: &CombatUnitModel, mult: f64) -> CombatUnitModel {
    let w = gold_deficit_stats_mult(
        &GoldDeficitCombatStats {
            melee_attack: cu.melee_attack,
            melee_defence: cu.melee_defence,
            weapon_damage: cu.weapon_damage,
            piercing: cu.piercing,
            charge_bonus: cu.charge_bonus,
            health: cu.health,
            missile_attack: cu.missile_attack,
            prog_dezercji: cu.prog_dezercji,
        },
        mult,
    );
    CombatUnitModel {
        melee_attack: w.melee_attack,
        melee_defence: w.melee_defence,
        weapon_damage: w.weapon_damage,
        piercing: w.piercing,
        charge_bonus: w.charge_bonus,
        health: w.health,
        missile_attack: w.missile_attack,
        prog_dezercji: w.prog_dezercji,
        ..cu.clone()
    }
}

/// `applyArmyHungerStatMultToCombatUnit(cu, mult)` (`army-starvation.ts:35-52`): `mult >= 1 || mult <= 0` -> bez zmian (NaN: stosuje sie).
/// Cialo identyczne z deficytem zlota (pin) - korzysta z jednego istniejacego portu.
pub fn apply_army_hunger_stat_mult_to_combat_unit(
    cu: &CombatUnitModel,
    mult: f64,
) -> CombatUnitModel {
    weaken_stats(cu, mult)
}

/// `applyGoldDeficitStatMultToCombatUnit(cu, mult)` (`gold-deficit.ts:182-199`).
pub fn apply_gold_deficit_stat_mult_to_combat_unit(
    cu: &CombatUnitModel,
    mult: f64,
) -> CombatUnitModel {
    weaken_stats(cu, mult)
}

/// Pola `BattleUnit` uzywane przez `toCombatUnit`. `stats = None` (null/undefined) -> `{}`.
#[derive(Debug, Clone, PartialEq)]
pub struct BattleUnitIn {
    pub stats: Option<StatRow>,
    pub kategoria: String,
    /// `bu.hp`; `None` = null/undefined -> `health` z definicji.
    pub hp: Option<f64>,
    /// `bu.veteranBonusFrac`; `None` = null/undefined -> 0.
    pub veteran_bonus_frac: Option<f64>,
    pub army_hungry: bool,
    pub gold_deficit: bool,
}

/// Parametry `toCombatUnit` z wartosciami domyslnymi pinu (`0.75, false, 0.75, false`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ToCombatUnitOpts {
    pub army_hunger_stat_mult: f64,
    pub skip_hunger: bool,
    pub gold_deficit_stat_mult: f64,
    pub skip_gold_deficit: bool,
}

impl Default for ToCombatUnitOpts {
    fn default() -> Self {
        Self {
            army_hunger_stat_mult: 0.75,
            skip_hunger: false,
            gold_deficit_stat_mult: 0.75,
            skip_gold_deficit: false,
        }
    }
}

/// `toCombatUnit(bu, armyHungerStatMult, skipHunger, goldDeficitStatMult, skipGoldDeficit)` (`battleScene.ts:1355-1378`).
pub fn to_combat_unit(bu: &BattleUnitIn, opts: &ToCombatUnitOpts) -> CombatUnitModel {
    let empty = StatRow::new();
    let s = bu.stats.as_ref().unwrap_or(&empty);
    let jednostka = get(s, "Jednostka");
    let typ_nazwa = if jednostka.is_nullish() {
        UVal::Str(bu.kategoria.clone())
    } else {
        jednostka.clone()
    };
    let cu = combat_unit_from_def(
        s,
        &CombatUnitFromDefOpts {
            typ_nazwa: Some(typ_nazwa),
            rola: None,
            hp: bu.hp,
        },
    );
    let mut scaled = apply_veteran_frac_to_combat_unit(&cu, bu.veteran_bonus_frac.unwrap_or(0.0));
    if bu.army_hungry && !opts.skip_hunger {
        scaled = apply_army_hunger_stat_mult_to_combat_unit(&scaled, opts.army_hunger_stat_mult);
    }
    if bu.gold_deficit && !opts.skip_gold_deficit {
        scaled = apply_gold_deficit_stat_mult_to_combat_unit(&scaled, opts.gold_deficit_stat_mult);
    }
    scaled
}

#[cfg(test)]
mod tests {
    use super::*;

    fn row(pairs: &[(&str, UVal)]) -> StatRow {
        pairs
            .iter()
            .map(|(k, v)| ((*k).to_string(), v.clone()))
            .collect()
    }

    #[test]
    fn norm_field_brak_i_napisy() {
        assert_eq!(combat_norm_field(&UVal::Str("---".into()), 7.0), 7.0);
        assert_eq!(combat_norm_field(&UVal::Str("12px".into()), 7.0), 12.0);
        assert_eq!(combat_norm_field(&UVal::Str("abc".into()), 7.0), 7.0);
        assert_eq!(combat_norm_field(&UVal::Num(f64::NAN), 7.0), 7.0);
        assert!(combat_norm_field(&UVal::Num(f64::INFINITY), 7.0).is_infinite());
    }

    #[test]
    fn wartosci_domyslne_z_pustej_definicji() {
        let cu = combat_unit_from_def(&StatRow::new(), &CombatUnitFromDefOpts::default());
        assert_eq!(cu.health, 30.0);
        assert_eq!(cu.rola, "Wrecz");
        assert_eq!(cu.kara_flanka, 50.0);
        assert_eq!(cu.kara_tyl, 80.0);
        assert_eq!(cu.prog_dezercji, None);
        assert_eq!(cu.zasieg_ataku, UVal::Null);
    }

    #[test]
    fn weteran_skaluje_i_zachowuje_pancerz() {
        let def = row(&[
            ("meleeAttack", UVal::Num(10.0)),
            ("armor", UVal::Num(3.0)),
            ("health", UVal::Num(20.0)),
            ("Prog dezercji (% health)", UVal::Num(0.4)),
        ]);
        let cu = combat_unit_from_def(&def, &CombatUnitFromDefOpts::default());
        let v = apply_veteran_frac_to_combat_unit(&cu, 0.1);
        assert!((v.melee_attack - 11.0).abs() < 1e-12);
        assert_eq!(v.armor, 3.0);
        assert_eq!(v.prog_dezercji, Some(0.36));
        assert_eq!(v.veteran_health_bonus_frac, Some(0.1));
        assert_eq!(apply_veteran_frac_to_combat_unit(&cu, 0.0), cu);
    }

    #[test]
    fn js_num_to_string_zgodne_z_js() {
        assert_eq!(js_num_to_string(1e21), "1e+21");
        assert_eq!(js_num_to_string(1.5e-7), "1.5e-7");
        assert_eq!(js_num_to_string(-0.0), "0");
        assert_eq!(js_num_to_string(123456.5), "123456.5");
    }
}
