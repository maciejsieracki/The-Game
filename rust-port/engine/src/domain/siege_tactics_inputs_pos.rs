//! P6 SIEGE-TAKTYKA K5i-2a2 (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5I2A2-Q1): czyste funkcje pozycji / brodu / trudnosci / kary flanki
//! z pinu `07d2fbd72f758705f8e1d59cc4968027ffbafe75` (port 1:1, wektory z wykonania TEKSTU pinu w node).
//!
//! Zakres (wszystko `Ported`, wektory: `tests/p6_siege_tactics_inputs_pos_vectors/vectors.json`):
//! * [`facing_toward`] = `facingToward` (`battleScene.ts:347-353`),
//! * [`opposite_dir`] = `oppositeDir` (`battleScene.ts:370-372`),
//! * [`relative_hit`] = `relativeHit` (`battleScene.ts:385-400`),
//! * [`is_ford_tile`] = `isFordTile` (`battleScene.ts:1897-1899`),
//! * [`is_shore_adjacent_to_ford`] = `isShoreAdjacentToFord` (`battleScene.ts:1907-1914`, 4-kierunkowe sasiedztwo `DIR_DELTA`,
//!   `battleScene.ts:326-331`),
//! * [`battle_unit_difficulty_combat_mult`] = `battleUnitDifficultyCombatMult` (`battle-unit-context.ts:9-14`),
//! * [`flank_rear_defense_penalty`] = `flankRearDefensePenalty` (`combat.ts:589-606`) - przeniesiona z
//!   `siege_tactics_blow_inputs.rs` (tam byla wersja na `Option<f64>`, bez modelu tekstu i bez wywolujacego w wektorach).
//!
//! Semantyka JS jest odwzorowana jawnie przez [`JsVal`] (wejscia tekstowe): `"1" + 2 === "12"`, `"3" >= 0`, `"0" === 0` falszywe,
//! `null >= 0` prawdziwe, parametr domyslny `fallback = Dir.E` tylko dla `undefined`. Kierunki (`Dir`): N=0, E=1, S=2, W=3
//! (`battleScene.ts:315-320`), `DIR_DELTA` w tej samej kolejnosci.
//!
//! Teren: kafle sa kodami `BTerrain` (`battle-terrain.ts:37-46`; River=3, Ford=4); funkcja `at(col,row)` zastepuje
//! `BattleTerrainMap.at` (poza mapa = Plains - odpowiedzialnosc dostawcy mapy).

use crate::domain::siege_tactics_blow::HitArc;
use crate::domain::unit_health::js_parse_float;

/// Wartosc JS wchodzaca do funkcji (`undefined`, `null`, liczba, napis) - do odwzorowania koercji.
#[derive(Debug, Clone, PartialEq)]
pub enum JsVal {
    Undef,
    Null,
    Num(f64),
    Str(String),
}

impl JsVal {
    /// `Number(v)` (ToNumber): `undefined` -> NaN, `null` -> 0, napis -> [`js_str_to_number`].
    pub fn to_number(&self) -> f64 {
        match self {
            JsVal::Undef => f64::NAN,
            JsVal::Null => 0.0,
            JsVal::Num(n) => *n,
            JsVal::Str(s) => js_str_to_number(s),
        }
    }

    /// `a === b` (strict): NaN != NaN, brak koercji miedzy typami.
    pub fn strict_eq(&self, other: &JsVal) -> bool {
        match (self, other) {
            (JsVal::Undef, JsVal::Undef) | (JsVal::Null, JsVal::Null) => true,
            (JsVal::Num(a), JsVal::Num(b)) => a == b,
            (JsVal::Str(a), JsVal::Str(b)) => a == b,
            _ => false,
        }
    }
}

fn is_js_whitespace(c: char) -> bool {
    // JS WhiteSpace + LineTerminator; `char::is_whitespace` zawiera dodatkowo U+0085, ktorego JS nie traktuje jak spacji.
    (c.is_whitespace() && c != '\u{85}') || c == '\u{feff}'
}

/// `Number(s)` dla napisu (StringToNumber): puste/biale = 0, `0x`/`0o`/`0b`, `+/-Infinity`, liczba dziesietna CALA; inaczej NaN.
pub fn js_str_to_number(s: &str) -> f64 {
    let t = s.trim_matches(is_js_whitespace);
    if t.is_empty() {
        return 0.0;
    }
    let b = t.as_bytes();
    if b.len() > 2 && b[0] == b'0' {
        let radix = match b[1] {
            b'x' | b'X' => Some(16),
            b'o' | b'O' => Some(8),
            b'b' | b'B' => Some(2),
            _ => None,
        };
        if let Some(r) = radix {
            let mut acc = 0.0_f64;
            for &c in &b[2..] {
                match (c as char).to_digit(r) {
                    Some(d) => acc = acc * f64::from(r) + f64::from(d),
                    None => return f64::NAN,
                }
            }
            return acc;
        }
    }
    let (neg, rest) = match b[0] {
        b'+' => (false, &t[1..]),
        b'-' => (true, &t[1..]),
        _ => (false, t),
    };
    if rest == "Infinity" {
        return if neg {
            f64::NEG_INFINITY
        } else {
            f64::INFINITY
        };
    }
    // StrDecimalLiteral: digits [. digits?] | . digits, [eE][+-]?digits, cala zawartosc.
    let r = rest.as_bytes();
    let mut i = 0;
    let mut int_digits = 0;
    while i < r.len() && r[i].is_ascii_digit() {
        i += 1;
        int_digits += 1;
    }
    let mut frac_digits = 0;
    if i < r.len() && r[i] == b'.' {
        i += 1;
        while i < r.len() && r[i].is_ascii_digit() {
            i += 1;
            frac_digits += 1;
        }
    }
    if int_digits == 0 && frac_digits == 0 {
        return f64::NAN;
    }
    if i < r.len() && (r[i] == b'e' || r[i] == b'E') {
        i += 1;
        if i < r.len() && (r[i] == b'+' || r[i] == b'-') {
            i += 1;
        }
        let ds = i;
        while i < r.len() && r[i].is_ascii_digit() {
            i += 1;
        }
        if i == ds {
            return f64::NAN;
        }
    }
    if i != r.len() {
        return f64::NAN;
    }
    let v: f64 = rest.parse().unwrap_or(f64::NAN);
    if neg {
        -v
    } else {
        v
    }
}

/// Cztery kierunki zwrotu (`enum Dir`, `battleScene.ts:315-320`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Dir {
    N = 0,
    E = 1,
    S = 2,
    W = 3,
}

impl Dir {
    fn val(self) -> JsVal {
        JsVal::Num(f64::from(self as u8))
    }
}

/// `DIR_DELTA` (`battleScene.ts:326-331`): (dCol, dRow) dla N, E, S, W.
pub const DIR_DELTA: [(i32, i32); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];

/// Kod `BTerrain.River` (`battle-terrain.ts:37-46`).
pub const BTERRAIN_RIVER: u8 = 3;
/// Kod `BTerrain.Ford` (`battle-terrain.ts:37-46`).
pub const BTERRAIN_FORD: u8 = 4;

/// `facingToward(dCol, dRow, fallback = Dir.E)` (`battleScene.ts:347-353`).
///
/// Zwraca `Dir` jako liczbe albo - gdy oba wektory sa ROWNE `0` (strict, tylko liczby) - dokladnie wartosc `fallback`
/// (moze byc tekstem). `fallback = undefined` -> parametr domyslny `Dir.E`.
pub fn facing_toward(d_col: &JsVal, d_row: &JsVal, fallback: &JsVal) -> JsVal {
    let fb = if *fallback == JsVal::Undef {
        Dir::E.val()
    } else {
        fallback.clone()
    };
    if matches!(d_col, JsVal::Num(c) if *c == 0.0) && matches!(d_row, JsVal::Num(r) if *r == 0.0) {
        return fb;
    }
    let c = d_col.to_number();
    let r = d_row.to_number();
    if c.abs() >= r.abs() {
        return if c >= 0.0 { Dir::E.val() } else { Dir::W.val() };
    }
    if r >= 0.0 {
        Dir::S.val()
    } else {
        Dir::N.val()
    }
}

/// `oppositeDir(d)` = `((d + 2) % 4)` (`battleScene.ts:370-372`). Dla napisu `d + 2` to KONKATENACJA (`"1" + 2 === "12"`).
pub fn opposite_dir(d: &JsVal) -> f64 {
    let sum = match d {
        JsVal::Str(s) => js_str_to_number(&format!("{s}2")),
        other => other.to_number() + 2.0,
    };
    sum % 4.0
}

/// `relativeHit(defenderFacing, attackerCol, attackerRow, defenderCol, defenderRow)` (`battleScene.ts:385-400`).
pub fn relative_hit(
    defender_facing: &JsVal,
    attacker_col: &JsVal,
    attacker_row: &JsVal,
    defender_col: &JsVal,
    defender_row: &JsVal,
) -> HitArc {
    let incoming = facing_toward(
        &JsVal::Num(attacker_col.to_number() - defender_col.to_number()),
        &JsVal::Num(attacker_row.to_number() - defender_row.to_number()),
        defender_facing,
    );
    if incoming.strict_eq(defender_facing) {
        return HitArc::Front;
    }
    if incoming.strict_eq(&JsVal::Num(opposite_dir(defender_facing))) {
        return HitArc::Rear;
    }
    HitArc::Flank
}

/// `isFordTile(tm, col, row)` (`battleScene.ts:1897-1899`): `tm.at(col,row) === BTerrain.Ford`.
pub fn is_ford_tile(at: &dyn Fn(i32, i32) -> u8, col: i32, row: i32) -> bool {
    at(col, row) == BTERRAIN_FORD
}

/// `isShoreAdjacentToFord(tm, col, row)` (`battleScene.ts:1907-1914`): suchy kafel (nie River/Ford) stykajacy sie ortogonalnie z brodem.
pub fn is_shore_adjacent_to_ford(at: &dyn Fn(i32, i32) -> u8, col: i32, row: i32) -> bool {
    let own = at(col, row);
    if own == BTERRAIN_RIVER || own == BTERRAIN_FORD {
        return false;
    }
    for (dc, dr) in DIR_DELTA {
        if at(col + dc, row + dr) == BTERRAIN_FORD {
            return true;
        }
    }
    false
}

/// `battleUnitDifficultyCombatMult(unit, sideFallback)` = `unit.difficultyCombatMult ?? sideFallback`
/// (`battle-unit-context.ts:9-14`). `unit_value` = `None` gdy pole nieobecne; `undefined`/`null` -> `sideFallback`;
/// pozostale (takze NaN, 0, tekst) przechodza bez zmian.
pub fn battle_unit_difficulty_combat_mult(
    unit_value: Option<&JsVal>,
    side_fallback: &JsVal,
) -> JsVal {
    match unit_value {
        None | Some(JsVal::Undef) | Some(JsVal::Null) => side_fallback.clone(),
        Some(v) => v.clone(),
    }
}

/// `flankRearDefensePenalty(unit, position)` (`combat.ts:589-606`): `position === 'front'` -> 0; `'flank'` czyta
/// "Kara obrony z flanki (%)", kazda INNA wartosc pozycji czyta "Kara obrony z tylu (%)". Pole `null`/`undefined`/`'---'`/`''` -> 0;
/// napis przez `parseFloat`, liczba bez zmian; NaN -> 0; wynik `val / 100`.
pub fn flank_rear_defense_penalty(flank_field: &JsVal, rear_field: &JsVal, position: &str) -> f64 {
    if position == "front" {
        return 0.0;
    }
    let raw = if position == "flank" {
        flank_field
    } else {
        rear_field
    };
    let val = match raw {
        JsVal::Undef | JsVal::Null => return 0.0,
        JsVal::Str(s) if s == "---" || s.is_empty() => return 0.0,
        JsVal::Str(s) => js_parse_float(s),
        JsVal::Num(n) => *n,
    };
    if val.is_nan() {
        return 0.0;
    }
    val / 100.0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn n(x: f64) -> JsVal {
        JsVal::Num(x)
    }
    fn s(x: &str) -> JsVal {
        JsVal::Str(x.to_string())
    }

    #[test]
    fn to_number_napisy() {
        assert_eq!(js_str_to_number(" 12 "), 12.0);
        assert_eq!(js_str_to_number(""), 0.0);
        assert_eq!(js_str_to_number("0x10"), 16.0);
        assert!(js_str_to_number("1 2").is_nan());
        assert!(js_str_to_number("abc").is_nan());
        assert_eq!(js_str_to_number("-Infinity"), f64::NEG_INFINITY);
        assert_eq!(js_str_to_number("5."), 5.0);
        assert!(js_str_to_number("1e").is_nan());
    }

    #[test]
    fn facing_i_opposite() {
        assert_eq!(facing_toward(&n(0.0), &n(0.0), &n(3.0)), n(3.0));
        assert_eq!(facing_toward(&n(2.0), &n(-2.0), &JsVal::Undef), n(1.0));
        assert_eq!(facing_toward(&n(0.0), &n(-1.0), &JsVal::Undef), n(0.0));
        assert_eq!(facing_toward(&s("0"), &s("0"), &n(3.0)), n(1.0));
        assert_eq!(opposite_dir(&n(1.0)), 3.0);
        assert_eq!(opposite_dir(&s("1")), 0.0); // "12" % 4
    }

    #[test]
    fn relative_hit_tabela() {
        let z = n(0.0);
        assert_eq!(relative_hit(&n(1.0), &n(2.0), &z, &z, &z), HitArc::Front);
        assert_eq!(relative_hit(&n(1.0), &n(-2.0), &z, &z, &z), HitArc::Rear);
        assert_eq!(relative_hit(&n(1.0), &z, &n(2.0), &z, &z), HitArc::Flank);
    }

    #[test]
    fn bro_i_brzeg() {
        let at = |c: i32, r: i32| if (c, r) == (1, 0) { BTERRAIN_FORD } else { 0 };
        assert!(is_ford_tile(&at, 1, 0));
        assert!(is_shore_adjacent_to_ford(&at, 0, 0));
        assert!(!is_shore_adjacent_to_ford(&at, 1, 0));
        assert!(!is_shore_adjacent_to_ford(&at, 1, 1 + 1));
    }

    #[test]
    fn trudnosc_i_kara() {
        assert_eq!(
            battle_unit_difficulty_combat_mult(Some(&JsVal::Null), &n(1.2)),
            n(1.2)
        );
        assert_eq!(
            battle_unit_difficulty_combat_mult(Some(&n(0.0)), &n(1.2)),
            n(0.0)
        );
        assert_eq!(
            flank_rear_defense_penalty(&s("50"), &JsVal::Undef, "flank"),
            0.5
        );
        assert_eq!(flank_rear_defense_penalty(&n(50.0), &n(30.0), "front"), 0.0);
        assert_eq!(flank_rear_defense_penalty(&n(50.0), &n(30.0), "rear"), 0.3);
        assert_eq!(flank_rear_defense_penalty(&s("---"), &s(""), "flank"), 0.0);
    }
}
