//! Wspolna implementacja `Math.max` / `Math.min` (i pochodnych) w semantyce JS.
//! Temat R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1 (zadanie #110, wariant b): jedno miejsce zamiast ~39 prywatnych kopii.
//!
//! Konsolidacja NIE zmienia obserwowalnego zachowania zadnego callera. Kopie w domenie mialy TRZY rozne semantyki
//! (liczone dla NaN i znaku zera), dlatego modul eksportuje warianty per semantyka:
//!
//! | wariant | NaN | `(+0, -0)` / `(-0, +0)` | uzywany przez |
//! |---|---|---|---|
//! | [`js_max`] / [`js_min`] | propaguje | jak ECMAScript: max -> `+0`, min -> `-0` (niezaleznie od kolejnosci) | wiekszosc domeny |
//! | [`js_max_std`] / [`js_min_std`] | propaguje | jak `f64::max` / `f64::min` (znak NIEGWARANTOWANY) | `civ_matrix::js_compat` i jego uzytkownicy |
//! | [`js_max_tie_b`] / [`js_min_tie_b`] | propaguje | remis zwraca `b` (`max(+0, -0) = -0`) | `auto_improvements` |
//!
//! Pochodne: [`js_max0`] = `js_max(0, x)`; [`js_max0_std`] (NaN propaguje, `x.max(0.0)`); [`js_max_1_floor`];
//! [`js_max_sign`] / [`js_min_sign`] (nazwy historyczne `siege_tactics_inputs_pos`, wynik identyczny z [`js_max`] / [`js_min`]).
//!
//! Nie ujednolicac wariantow do JS bez osobnej decyzji: to zmienia wyniki callerow (znak zera bywa obserwowalny).

/// `Math.max(a, b)`: NaN propaguje; `Math.max(-0, +0) === +0` (i `Math.max(+0, -0) === +0`).
#[inline]
pub fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { b } else { a };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// `Math.min(a, b)`: NaN propaguje; `Math.min(+0, -0) === -0` (i `Math.min(-0, +0) === -0`).
#[inline]
pub fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

/// `Math.max(a, b)` z propagacja NaN, a dla pozostalych wartosci `f64::max` (znak zera przy `(+0, -0)` NIEGWARANTOWANY).
/// Zachowanie historycznych kopii `civ_matrix::js_compat`, `okolica`, `pathfinding`, `roads`, `territory`.
#[inline]
pub fn js_max_std(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}

/// `Math.min(a, b)` z propagacja NaN, a dla pozostalych wartosci `f64::min` (znak zera NIEGWARANTOWANY).
/// Zachowanie historycznej kopii `civ_matrix::js_compat`.
#[inline]
pub fn js_min_std(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.min(b)
    }
}

/// `Math.max(a, b)` z propagacja NaN; remis (takze `(+0, -0)`) zwraca `b`, wiec `max(+0, -0) = -0` (NIE jak ECMAScript).
/// Zachowanie historycznej kopii `auto_improvements`.
#[inline]
pub fn js_max_tie_b(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b {
        a
    } else {
        b
    }
}

/// `Math.min(a, b)` z propagacja NaN; remis zwraca `b`, wiec `min(+0, -0) = -0`, ale `min(-0, +0) = +0` (NIE jak ECMAScript).
/// Zachowanie historycznej kopii `auto_improvements`.
#[inline]
pub fn js_min_tie_b(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b {
        a
    } else {
        b
    }
}

/// `Math.max(0, x)`: NaN propaguje, `Math.max(0, -0) === +0`.
#[inline]
pub fn js_max0(x: f64) -> f64 {
    js_max(0.0, x)
}

/// `Math.max(0, x)` w wersji `x.max(0.0)` z propagacja NaN (znak zera dla `x = -0` NIEGWARANTOWANY).
/// Zachowanie historycznej kopii `siege_capital_plunder`.
#[inline]
pub fn js_max0_std(x: f64) -> f64 {
    if x.is_nan() {
        f64::NAN
    } else {
        x.max(0.0)
    }
}

/// `Math.max(1, Math.floor(x))`; NaN propaguje (`Math.max(1, NaN) = NaN`). Zachowanie historycznej kopii `diplomacy_truce`.
#[inline]
pub fn js_max_1_floor(x: f64) -> f64 {
    let f = x.floor();
    if f.is_nan() {
        f64::NAN
    } else {
        f.max(1.0)
    }
}

/// Nazwa historyczna (`siege_tactics_inputs_pos`): `Math.max` ze znakiem zera = [`js_max`] (rownowaznosc: test `p6_js_math_equiv`).
#[inline]
pub fn js_max_sign(a: f64, b: f64) -> f64 {
    js_max(a, b)
}

/// Nazwa historyczna (`siege_tactics_inputs_pos`): `Math.min` ze znakiem zera = [`js_min`] (rownowaznosc: test `p6_js_math_equiv`).
#[inline]
pub fn js_min_sign(a: f64, b: f64) -> f64 {
    js_min(a, b)
}
