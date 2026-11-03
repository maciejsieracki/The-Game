//! R-RUSTPORT-P6-ECON-TICK-HEAL-MAXHP-Q1 (pin weba `4bbef081d`): zrodlo `getMaxHp` dla leczenia jednostek
//! w ticku ekonomii (`advance_manpower_heal` / `run_economy_tick_for_game`).
//!
//! Lancuch weba (`main.ts:34561-34568`, closure `manpowerHeal.getMaxHp`):
//! `effectiveMaxHp(unitHealth(def), unitParametryBonusFrac(liveUnit), veteranCombatBonusFrac(liveUnit))`
//! gdzie `def = data.units.find(ud => ud.Jednostka === typeId) ?? {}`.
//!
//! * `unitHealth` (`main.ts:29877`): `normFieldVal(def['health'] ?? def['Health'], 30)` - KLUCZ MALYMI
//!   LITERAMI (`health`, TW v3) wygrywa z `Health`; w `units.json` oba istnieja i sie ROZNIA (Wojownik:
//!   `health` 22, `Health` 60). W typowanym `UnitRecord` to `health_lc` (NIE `health`).
//! * `effectiveMaxHp` (`unit-card-stats.ts:79`): `roundCardStat(base * (1 + (parametryFrac + veteranFrac)))`,
//!   bonusy dodawane PRZED jednym mnozeniem.
//! * `veteranCombatBonusFrac` (`veteran.ts:139`) i pochodne - tabela 0 / 0.10 / 0.15 / 0.20.
//! * `unitParametryBonusFrac` istnieje w Rust (`combat::unit_building_bonuses`), uzywany bez zmian.
//!
//! ZALOZENIA: (Z-HM-1) `get_max_hp` w `HealRequest` / `AdvanceManpowerHealInput` dostaje teraz zywa jednostke
//! (web `manpower.ts:319` wola `getMaxHp(u.typeId, u)`); (Z-HM-2) wartosci `health` spoza liczby/napisu
//! (tablica, obiekt) -> `fallback` (web zwrocilby je bez zmian; dane pinu to zawsze liczby calkowite).

use std::collections::HashMap;

use serde_json::Value;

use crate::data::units_combat::UnitRecord;
use crate::domain::combat::unit_building_bonuses::{unit_parametry_bonus_frac, UnitBuildingProgress};
use crate::domain::recruitment::manpower::ManpowerHealUnit;
use crate::domain::society_breakdown::js_round;

/// Web `unitHealth` fallback (`main.ts:29878`).
pub const UNIT_HEALTH_FALLBACK: f64 = 30.0;
/// Web `VETERAN_MAX_BATTLES_TRACKED` (`veteran.ts:65`).
pub const VETERAN_MAX_BATTLES_TRACKED: f64 = 3.0;
/// Web `VETERAN_BONUS_FRAC` (`veteran.ts:71-76`), klucz = liczba gwiazdek 0..3.
pub const VETERAN_BONUS_FRAC: [f64; 4] = [0.0, 0.10, 0.15, 0.20];

/// Web `parseFloat` dla napisu: wiodace biale znaki JS, znak, `Infinity`, liczba dziesietna z wykladnikiem;
/// brak prefiksu liczbowego = `NaN`.
pub fn js_parse_float(s: &str) -> f64 {
    let t = s.trim_start_matches(|c: char| {
        c.is_whitespace() || c == '\u{feff}' || c == '\u{a0}'
    });
    let b = t.as_bytes();
    let mut i = 0;
    let mut neg = false;
    if i < b.len() && (b[i] == b'+' || b[i] == b'-') {
        neg = b[i] == b'-';
        i += 1;
    }
    if t[i..].starts_with("Infinity") {
        return if neg { f64::NEG_INFINITY } else { f64::INFINITY };
    }
    let start = i;
    let mut digits = 0;
    while i < b.len() && b[i].is_ascii_digit() {
        i += 1;
        digits += 1;
    }
    if i < b.len() && b[i] == b'.' {
        let mut j = i + 1;
        let mut frac = 0;
        while j < b.len() && b[j].is_ascii_digit() {
            j += 1;
            frac += 1;
        }
        if digits > 0 || frac > 0 {
            i = j;
            digits += frac;
        }
    }
    if digits == 0 {
        return f64::NAN;
    }
    if i < b.len() && (b[i] == b'e' || b[i] == b'E') {
        let mut j = i + 1;
        if j < b.len() && (b[j] == b'+' || b[j] == b'-') {
            j += 1;
        }
        let ds = j;
        while j < b.len() && b[j].is_ascii_digit() {
            j += 1;
        }
        if j > ds {
            i = j;
        }
    }
    let v: f64 = t[start..i].parse().unwrap_or(f64::NAN);
    if neg {
        -v
    } else {
        v
    }
}

/// Web `normFieldVal(v, fallback)` (`main.ts:29777`). `None` = `undefined` (brak klucza).
pub fn norm_field_val(v: Option<&Value>, fallback: f64) -> f64 {
    let n = match v {
        None | Some(Value::Null) => return fallback,
        Some(Value::String(s)) => {
            if s == "---" || s == "\u{2014}" || s.is_empty() {
                return fallback;
            }
            js_parse_float(s)
        }
        Some(Value::Number(n)) => n.as_f64().unwrap_or(f64::NAN),
        Some(Value::Bool(b)) => {
            if *b {
                1.0
            } else {
                0.0
            }
        }
        Some(_) => f64::NAN,
    };
    if n.is_nan() {
        fallback
    } else {
        n
    }
}

/// Web `unitHealth(def)` (`main.ts:29877`) dla wiersza jako JSON: `def['health'] ?? def['Health']`
/// (`??` - tylko `null`/`undefined` przechodza do `Health`). `None` = `{}` (`?? {}` przy braku typu).
pub fn unit_health_value(def: Option<&Value>) -> f64 {
    let lower = def.and_then(|d| d.get("health"));
    let pick = match lower {
        Some(v) if !v.is_null() => Some(v),
        _ => def.and_then(|d| d.get("Health")),
    };
    norm_field_val(pick, UNIT_HEALTH_FALLBACK)
}

/// `unitHealth(def)` nad produkcyjnym typem Rust: `health_lc` (klucz `health`), brak wiersza = 30.
pub fn unit_health(def: Option<&UnitRecord>) -> f64 {
    match def {
        Some(r) => r.health_lc as f64,
        None => UNIT_HEALTH_FALLBACK,
    }
}

/// Web `roundCardStat` (`unit-card-stats.ts:65`).
pub fn round_card_stat(n: f64) -> f64 {
    if !n.is_finite() {
        return 0.0;
    }
    let r = js_round(n * 10.0) / 10.0;
    if (r - js_round(r)).abs() < 1e-6 {
        js_round(r)
    } else {
        r
    }
}

/// Web `effectiveMaxHp(baseHp, parametryBonusFrac, veteranBonusFrac)` (`unit-card-stats.ts:79`).
pub fn effective_max_hp(base_hp: f64, parametry_bonus_frac: f64, veteran_bonus_frac: f64) -> f64 {
    round_card_stat(base_hp * (1.0 + (parametry_bonus_frac + veteran_bonus_frac)))
}

/// Web `veteranBattlesWon` (`veteran.ts:95`): `battlesSurvived` liczba skonczona > 0 -> `floor`, inaczej 0.
pub fn veteran_battles_won(battles_survived: Option<f64>) -> f64 {
    match battles_survived {
        Some(v) if v.is_finite() && v > 0.0 => v.floor(),
        _ => 0.0,
    }
}

/// Web `veteranStarCount` (`veteran.ts:118`).
pub fn veteran_star_count(battles_survived: Option<f64>) -> f64 {
    veteran_battles_won(battles_survived).min(VETERAN_MAX_BATTLES_TRACKED)
}

/// Web `veteranBonusFracForWins` (`veteran.ts:123`).
pub fn veteran_bonus_frac_for_wins(wins: f64) -> f64 {
    let w = wins.floor().max(0.0).min(VETERAN_MAX_BATTLES_TRACKED);
    VETERAN_BONUS_FRAC[w as usize]
}

/// Web `veteranCombatBonusFrac` (`veteran.ts:139`).
pub fn veteran_combat_bonus_frac(battles_survived: Option<f64>) -> f64 {
    veteran_bonus_frac_for_wins(veteran_star_count(battles_survived))
}

/// Web closure `manpowerHeal.getMaxHp` (`main.ts:34561`) dla juz znalezionego wiersza.
pub fn heal_max_hp(def: Option<&UnitRecord>, live: Option<&ManpowerHealUnit>) -> f64 {
    let progress = live.map(|u| UnitBuildingProgress {
        pancerz_bonus_proc: None,
        parametry_bonus_proc: u.parametry_bonus_proc,
    });
    effective_max_hp(
        unit_health(def),
        unit_parametry_bonus_frac(progress.as_ref()),
        veteran_combat_bonus_frac(live.and_then(|u| u.battles_survived)),
    )
}

/// Indeks `data.units.find(ud => ud.Jednostka === typeId)`: PIERWSZY wiersz o danej nazwie.
pub struct UnitHealthSource<'a> {
    by_type: HashMap<&'a str, &'a UnitRecord>,
}

impl<'a> UnitHealthSource<'a> {
    pub fn new(units: &'a [UnitRecord]) -> Self {
        let mut by_type = HashMap::new();
        for u in units {
            by_type.entry(u.jednostka.as_str()).or_insert(u);
        }
        Self { by_type }
    }

    /// Web `getMaxHp(typeId, liveUnit)`.
    pub fn max_hp(&self, type_id: &str, live: Option<&ManpowerHealUnit>) -> f64 {
        heal_max_hp(self.by_type.get(type_id).copied(), live)
    }

    /// Gotowy `get_max_hp` dla `HealRequest` / `AdvanceManpowerHealInput`.
    pub fn as_get_max_hp(&self) -> impl Fn(&str, &ManpowerHealUnit) -> f64 + '_ {
        move |type_id, unit| self.max_hp(type_id, Some(unit))
    }
}
