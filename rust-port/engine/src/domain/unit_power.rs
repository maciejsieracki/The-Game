//! R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1 -- port formul pocisku z webu FALA 603
//! (R-WEB-BATTLE-RANGED-DAMAGE-MULT-Q1, kod a259012fa).
//!
//! Zrodla web (origin/main 638e90bea):
//! - `gra/src/game/unit-power.ts` `rangedDamageMultFor` (mnoznik klasy strzelca),
//! - `gra/src/game/combat.ts` `rangeDamageTw`, `rangedShotAccuracy`, `rangedShotDamage`,
//!   `hitChanceTw` (TW v3 z `tw_v3` w combat-params.json).
//!
//! Zakres tego modulu: CZYSTE funkcje formul. Petla walki per runda (battleScene/combat.ts)
//! i `fieldPower`/`armyFieldPower` nie sa jeszcze portowane w Rust (patrz raport
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-WALKA-DYSTANS-MULT-Q1/01-operator-r1.md`).

use std::sync::OnceLock;

use crate::data::units_combat::{parse_combat_params, RangedDamageMultParams};
use crate::domain::siege_tactics_blow::{js_max, js_min, js_round as js_round_js};

fn ranged_params() -> &'static RangedDamageMultParams {
    static TABLE: OnceLock<RangedDamageMultParams> = OnceLock::new();
    TABLE.get_or_init(|| {
        parse_combat_params()
            .expect("combat-params.json musi sie parsowac")
            .ranged_damage_mult
    })
}

/// Parametry TW v3 (`tw_v3` w combat-params.json) jako f64: (hit_base, hit_min, hit_max).
fn tw_hit_params() -> (f64, f64, f64) {
    static TABLE: OnceLock<(f64, f64, f64)> = OnceLock::new();
    *TABLE.get_or_init(|| {
        let tw = parse_combat_params()
            .expect("combat-params.json musi sie parsowac")
            .tw_v3;
        (tw.hit_base as f64, tw.hit_min as f64, tw.hit_max as f64)
    })
}

/// Zaokraglenie jak JS `Math.round` dla wartosci nieujemnych (polowki w gore).
fn js_round(x: f64) -> f64 {
    (x + 0.5).floor()
}

/// `rangedDamageMultFor` z web: mnoznik obrazen pocisku wg klasy strzelca.
/// - `Typ` == "Slinger" (po trim) -> `slinger` (x3),
/// - `Typ` == "Distance" i nazwa (po trim, lowercase) zaczyna sie od "łucznik" -> `lucznik_piesi` (x2),
/// - reszta -> 1.0 (Oszczepnik, Mount, Oblezenie...).
///
/// Brak pola (`None`) traktowany jak pusty string, zgodnie z `String(x ?? '')` w web.
pub fn ranged_damage_mult_for(typ: Option<&str>, jednostka: Option<&str>) -> f64 {
    let typ = typ.unwrap_or("").trim();
    if typ == "Slinger" {
        return ranged_params().slinger as f64;
    }
    let name = jednostka.unwrap_or("").trim().to_lowercase();
    if typ == "Distance" && name.starts_with("łucznik") {
        return ranged_params().lucznik_piesi as f64;
    }
    1.0
}

/// `rangedShotAccuracy` z web (pin 07d2fbd72, combat.ts:476): `Math.max(meleeAttack, missileAttack)`.
/// NaN propaguje sie jak w JS ([`js_max`]); `f64::max` ignorowalby NaN.
pub fn ranged_shot_accuracy(melee_attack: f64, missile_attack: f64) -> f64 {
    js_max(melee_attack, missile_attack)
}

/// `rangeDamageTw` z web (pin 07d2fbd72, combat.ts:468; TW Rome 2 faza dystansowa): `Math.max(1, missileAttack - armor)`.
/// NaN propaguje sie jak w JS ([`js_max`]).
pub fn range_damage_tw(missile_attack: f64, armor: f64) -> f64 {
    js_max(1.0, missile_attack - armor)
}

/// `rangedShotDamage` z web (pin 07d2fbd72, combat.ts:485-495): koncowe obrazenia pocisku auto-walki
/// jako f64, zgodnie z pinem: raw = rangeDamageTw * counterMult * rangedDamageMultFor;
/// wynik = `Math.max(1, Math.round(raw))` (JS: NaN i Infinity propaguja; zaokraglenie jak JS `Math.round`).
pub fn ranged_shot_damage_f64(
    typ: Option<&str>,
    jednostka: Option<&str>,
    missile_attack: f64,
    armor: f64,
    counter_mult: f64,
) -> f64 {
    let raw = range_damage_tw(missile_attack, armor)
        * counter_mult
        * ranged_damage_mult_for(typ, jednostka);
    js_max(1.0, js_round_js(raw))
}

/// Wariant calkowity dla wolajacych z wartosciami skonczonymi (testy formul dystansu).
/// NIE UZYWAC w produkcji: `resolve_ranged_phase` (combat.rs) woła wyłącznie `ranged_shot_damage_f64`.
/// Ta funkcja jest w produkcji nieużywana (tylko testy p6_repin_dystans_*) i rozjeżdża się z pinem dla NaN.
/// NaN -> 1 (dawne zachowanie `f64::max`); +/-Infinity i wartosci poza zakresem i64 nasycaja sie `as i64`.
pub fn ranged_shot_damage(
    typ: Option<&str>,
    jednostka: Option<&str>,
    missile_attack: f64,
    armor: f64,
    counter_mult: f64,
) -> i64 {
    let v = ranged_shot_damage_f64(typ, jednostka, missile_attack, armor, counter_mult);
    if v.is_nan() {
        1
    } else {
        v as i64
    }
}

/// `hitChanceTw` z web (pin 07d2fbd72, combat.ts:446; TW v3): `Math.max(hit_min, Math.min(hit_max, raw))`,
/// raw = hit_base + atk - def + hit_bonus. NaN propaguje sie jak w JS ([`js_min`]/[`js_max`]).
pub fn hit_chance_tw(melee_attack: f64, melee_defence: f64, hit_bonus: f64) -> f64 {
    let (base, min, max) = tw_hit_params();
    let raw = base + melee_attack - melee_defence + hit_bonus;
    js_max(min, js_min(max, raw))
}

/// Wspolczynniki mocy jednostki (`UnitPowerCoeffs` z web, `loadUnitPowerCoeffs`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct UnitPowerCoeffs {
    pub charge_divisor: f64,
    pub missile_divisor: f64,
    pub hp_field_divisor: f64,
    pub hp_siege_divisor: f64,
}

impl UnitPowerCoeffs {
    /// Z `combat-params.json` -> `unit_power`. Web przyjmuje tylko dzielniki > 0, inaczej domyslne
    /// (2, 2, 2, 10); dane w repo sa dodatnie, wiec tu brak dodatkowej ochrony (ZALOZENIE).
    pub fn from_params() -> Self {
        let u = parse_combat_params()
            .expect("combat-params.json musi sie parsowac")
            .unit_power;
        Self {
            charge_divisor: u.charge_divisor as f64,
            missile_divisor: u.missile_divisor as f64,
            hp_field_divisor: u.hp_field_divisor as f64,
            hp_siege_divisor: u.hp_siege_divisor as f64,
        }
    }
}

/// Statystyki wejsciowe `fieldPower` (web `UnitPowerInput`); brak pola = 0 (web `num()`),
/// normalizacje `null`/''/'—'/NaN robi wolajacy.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct UnitPowerInput {
    pub melee_attack: f64,
    pub melee_defence: f64,
    pub weapon_damage: f64,
    pub piercing: f64,
    pub armor: f64,
    pub charge_bonus: f64,
    pub health: f64,
    pub missile_attack: f64,
    pub typ: Option<String>,
    pub jednostka: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PowerBreakdown {
    pub attack: f64,
    pub defense: f64,
    pub total: f64,
}

fn round1(n: f64) -> f64 {
    js_round(n * 10.0) / 10.0
}

/// `fieldPower` z web (`unit-power.ts:122`): moc na polu, skladnik pocisku
/// `missileAttack * rangedDamageMultFor / missileDivisor`.
pub fn field_power(u: &UnitPowerInput, c: &UnitPowerCoeffs) -> PowerBreakdown {
    let attack = u.melee_attack
        + u.weapon_damage
        + u.piercing
        + u.charge_bonus / c.charge_divisor
        + (u.missile_attack * ranged_damage_mult_for(u.typ.as_deref(), u.jednostka.as_deref()))
            / c.missile_divisor;
    let defense = u.melee_defence + u.armor + u.health / c.hp_field_divisor;
    PowerBreakdown {
        attack: round1(attack),
        defense: round1(defense),
        total: round1(attack + defense),
    }
}
