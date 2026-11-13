//! R-RUSTPORT-P6-JS-MAX-CONSOLIDATE-R2-Q1: test rownowaznosci konsolidacji `js_max`/`js_min`/`js_max0`/`js_max_sign`/`js_min_sign`.
//!
//! Dla KAZDEJ historycznej prywatnej kopii (baza `cfa1edd31`) test trzyma wyrocznie = dosłowna tresc starego ciala
//! (nazwy `old_*`) i porownuje BIT W BIT (znak zera, `+-Inf`; NaN = NaN) z wariantem `domain::js_math`, ktorym kopia zostala
//! zastapiona, na pelnej siatce par wartosci brzegowych. Dodatkowo sprawdza sciezki PUBLICZNE (re-eksporty) tych kopii.
//! Wyrocznie sa celowo skopiowane, a nie zaimportowane: nie moga zalezec od testowanego kodu.

use civ_engine::domain::js_math::{
    js_max, js_max0, js_max0_std, js_max_1_floor, js_max_sign, js_max_std, js_max_tie_b, js_min,
    js_min_sign, js_min_std, js_min_tie_b,
};

const GRID: &[f64] = &[
    f64::NAN,
    f64::INFINITY,
    f64::NEG_INFINITY,
    0.0,
    -0.0,
    1.0,
    -1.0,
    0.5,
    -0.5,
    2.5,
    -3.0,
    5e-324,
    -5e-324,
    f64::MIN_POSITIVE,
    -f64::MIN_POSITIVE,
    f64::MAX,
    f64::MIN,
    1e300,
    -1e300,
];

type Row2 = (&'static str, fn(f64, f64) -> f64, fn(f64, f64) -> f64);
type Row1 = (&'static str, fn(f64) -> f64, fn(f64) -> f64);

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a.to_bits() == b.to_bits()
}

fn check2(name: &str, new: fn(f64, f64) -> f64, old: fn(f64, f64) -> f64) {
    for &a in GRID {
        for &b in GRID {
            let (n, o) = (new(a, b), old(a, b));
            assert!(
                same(n, o),
                "{name}({a:?}, {b:?}): nowe {n:?} (bits {:#x}) != stare {o:?} (bits {:#x})",
                n.to_bits(),
                o.to_bits()
            );
        }
    }
}

fn check1(name: &str, new: fn(f64) -> f64, old: fn(f64) -> f64) {
    for &x in GRID {
        let (n, o) = (new(x), old(x));
        assert!(
            same(n, o),
            "{name}({x:?}): nowe {n:?} (bits {:#x}) != stare {o:?} (bits {:#x})",
            n.to_bits(),
            o.to_bits()
        );
    }
}

// ---- wyrocznie: dosłowne stare ciala (baza cfa1edd31) ----

/// diplomacy_multiwar, mapgen/masks(max pozytywne), diplomacy_tick_war_brake, relief, terrain_class (grupa MAX-JS).
fn old_max_multiwar(a: f64, b: f64) -> f64 {
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
fn old_min_multiwar(a: f64, b: f64) -> f64 {
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
/// society_breakdown.
fn old_max_society(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_positive() { a } else { b };
    }
    if a > b {
        a
    } else {
        b
    }
}
/// diplomacy_tick_war_brake, mapgen/relief, mapgen/terrain_class.
fn old_max_brake(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() { b } else { a };
    }
    if a > b {
        a
    } else {
        b
    }
}
fn old_min_brake(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}
/// mapgen/cluster_layout, mapgen/masks (v8math).
fn old_max_cluster(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_positive() { a } else { b };
    }
    if a > b {
        a
    } else {
        b
    }
}
/// order_effects_culture.
fn old_max_culture(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() && b.is_sign_negative() {
            -0.0
        } else {
            0.0
        };
    }
    if a > b {
        a
    } else {
        b
    }
}
/// recruitment::army_merge, turn_economy.
fn old_max_recruitment(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b {
        a
    } else if b > a {
        b
    } else if a.is_sign_positive() {
        a
    } else {
        b
    }
}
fn old_min_recruitment(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b {
        a
    } else if b < a {
        b
    } else if a.is_sign_negative() {
        a
    } else {
        b
    }
}
/// economy_city_fns (min) = old_min_multiwar; mapgen/masks (min) = old_min_brake.
/// civ_matrix::js_compat, okolica, pathfinding, roads, territory, order_effects_lane (przez civ_matrix).
fn old_max_std(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.max(b)
    }
}
fn old_min_std(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else {
        a.min(b)
    }
}
/// auto_improvements.
fn old_max_naive(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a > b {
        a
    } else {
        b
    }
}
fn old_min_naive(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a < b {
        a
    } else {
        b
    }
}
/// siege_tactics_inputs_pos (stare `js_max_sign` / `js_min_sign`).
fn old_max_sign(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_positive() || b.is_sign_positive() {
            0.0
        } else {
            -0.0
        };
    }
    a.max(b)
}
fn old_min_sign(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == 0.0 && b == 0.0 {
        return if a.is_sign_negative() || b.is_sign_negative() {
            -0.0
        } else {
            0.0
        };
    }
    a.min(b)
}
/// siege_tactics_{activate,breach,end,endcheck,unit} = `js_max(0.0, x)` z `js_max_sign`; turn_economy_post = army_merge::js_max(0, x).
fn old_max0_siege(x: f64) -> f64 {
    old_max_sign(0.0, x)
}
fn old_max0_post(x: f64) -> f64 {
    old_max_recruitment(0.0, x)
}
/// siege_tactics_inputs_wall.
fn old_max0_wall(x: f64) -> f64 {
    if x.is_nan() || x > 0.0 {
        x
    } else {
        0.0
    }
}
/// siege_capital_plunder.
fn old_max0_plunder(x: f64) -> f64 {
    if x.is_nan() {
        f64::NAN
    } else {
        x.max(0.0)
    }
}
/// diplomacy_truce.
fn old_max_1_floor(x: f64) -> f64 {
    let f = x.floor();
    if f.is_nan() {
        f64::NAN
    } else {
        f.max(1.0)
    }
}

// ---- tabela: caller -> wariant js_math ----

#[test]
fn p6_js_math_max_per_caller_bit_w_bit() {
    // (caller, nowy wariant, wyrocznia)
    let rows: &[Row2] = &[
        ("diplomacy_multiwar::js_max", js_max, old_max_multiwar),
        ("diplomacy_tick_war_brake::js_max", js_max, old_max_brake),
        ("mapgen/relief::js_max", js_max, old_max_brake),
        ("mapgen/terrain_class::js_max", js_max, old_max_brake),
        ("mapgen/cluster_layout::js_max", js_max, old_max_cluster),
        ("mapgen/masks::v8math::js_max", js_max, old_max_cluster),
        ("society_breakdown::js_max", js_max, old_max_society),
        ("order_effects_culture::js_max", js_max, old_max_culture),
        (
            "recruitment::army_merge::js_max",
            js_max,
            old_max_recruitment,
        ),
        ("turn_economy::js_max", js_max, old_max_recruitment),
        (
            "siege_tactics_inputs_pos::js_max_sign",
            js_max_sign,
            old_max_sign,
        ),
        ("civ_matrix::js_compat::js_max", js_max_std, old_max_std),
        ("okolica::js_max", js_max_std, old_max_std),
        ("pathfinding::js_max", js_max_std, old_max_std),
        ("roads::js_max", js_max_std, old_max_std),
        ("territory::js_max", js_max_std, old_max_std),
        ("order_effects_lane::js_max", js_max_std, old_max_std),
        ("auto_improvements::js_max", js_max_tie_b, old_max_naive),
    ];
    for (name, new, old) in rows {
        check2(name, *new, *old);
    }
}

#[test]
fn p6_js_math_min_per_caller_bit_w_bit() {
    let rows: &[Row2] = &[
        ("diplomacy_multiwar::js_min", js_min, old_min_multiwar),
        ("economy_city_fns::js_min", js_min, old_min_multiwar),
        ("society_breakdown::js_min", js_min, old_min_multiwar),
        ("diplomacy_tick_war_brake::js_min", js_min, old_min_brake),
        ("mapgen/relief::js_min", js_min, old_min_brake),
        ("mapgen/terrain_class::js_min", js_min, old_min_brake),
        ("mapgen/masks::v8math::js_min", js_min, old_min_brake),
        (
            "recruitment::army_merge::js_min",
            js_min,
            old_min_recruitment,
        ),
        ("turn_economy::js_min", js_min, old_min_recruitment),
        (
            "siege_tactics_inputs_pos::js_min_sign",
            js_min_sign,
            old_min_sign,
        ),
        ("civ_matrix::js_compat::js_min", js_min_std, old_min_std),
        ("auto_improvements::js_min", js_min_tie_b, old_min_naive),
    ];
    for (name, new, old) in rows {
        check2(name, *new, *old);
    }
}

#[test]
fn p6_js_math_max0_i_max_1_floor_per_caller_bit_w_bit() {
    let rows: &[Row1] = &[
        ("siege_tactics_activate::js_max0", js_max0, old_max0_siege),
        ("siege_tactics_breach::js_max0", js_max0, old_max0_siege),
        ("siege_tactics_end::js_max0", js_max0, old_max0_siege),
        ("siege_tactics_endcheck::js_max0", js_max0, old_max0_siege),
        ("siege_tactics_unit::js_max0", js_max0, old_max0_siege),
        ("turn_economy_post::js_max0", js_max0, old_max0_post),
        ("siege_tactics_inputs_wall::js_max0", js_max0, old_max0_wall),
        (
            "siege_capital_plunder::js_max0",
            js_max0_std,
            old_max0_plunder,
        ),
        (
            "diplomacy_truce::js_max_1_floor",
            js_max_1_floor,
            old_max_1_floor,
        ),
    ];
    for (name, new, old) in rows {
        check1(name, *new, *old);
    }
}

/// `js_max_sign`/`js_min_sign` (stare ciala z `f64::max`) sa rownowazne kanonicznym `js_max`/`js_min`: delegacja nie zmienia wyniku.
#[test]
fn p6_js_math_sign_rownowazne_kanonicznym() {
    check2("js_max_sign~js_max", js_max, old_max_sign);
    check2("js_min_sign~js_min", js_min, old_min_sign);
    // Wszystkie warianty "JS" (inne stare ciala) tez sa rownowazne sobie nawzajem na calej siatce.
    for old in [
        old_max_multiwar,
        old_max_society,
        old_max_brake,
        old_max_cluster,
        old_max_culture,
        old_max_recruitment,
    ] {
        check2("max-JS~js_max", js_max, old);
    }
    for old in [old_min_multiwar, old_min_brake, old_min_recruitment] {
        check2("min-JS~js_min", js_min, old);
    }
}

/// Znak zera i NaN jawnie (semantyka z tabeli): to rozni warianty, wiec zadnego nie wolno "ujednolicic".
#[test]
fn p6_js_math_znak_zera_i_nan_jawnie() {
    // JS: max -> +0, min -> -0, oba porzadki.
    assert!(js_max(0.0, -0.0).is_sign_positive());
    assert!(js_max(-0.0, 0.0).is_sign_positive());
    assert!(js_max(-0.0, -0.0).is_sign_negative());
    assert!(js_min(0.0, -0.0).is_sign_negative());
    assert!(js_min(-0.0, 0.0).is_sign_negative());
    assert!(js_min(0.0, 0.0).is_sign_positive());
    // tie_b (auto_improvements): remis zwraca b.
    assert!(js_max_tie_b(0.0, -0.0).is_sign_negative());
    assert!(js_max_tie_b(-0.0, 0.0).is_sign_positive());
    assert!(js_min_tie_b(0.0, -0.0).is_sign_negative());
    assert!(js_min_tie_b(-0.0, 0.0).is_sign_positive());
    // max0: Math.max(0, -0) = +0.
    assert!(js_max0(-0.0).is_sign_positive());
    // NaN propaguje we wszystkich wariantach.
    for f in [
        js_max,
        js_min,
        js_max_std,
        js_min_std,
        js_max_tie_b,
        js_min_tie_b,
    ] {
        assert!(f(f64::NAN, 1.0).is_nan());
        assert!(f(1.0, f64::NAN).is_nan());
        assert!(f(f64::NAN, f64::NAN).is_nan());
    }
    assert!(js_max0(f64::NAN).is_nan());
    assert!(js_max0_std(f64::NAN).is_nan());
    assert!(js_max_1_floor(f64::NAN).is_nan());
    // Inf.
    assert_eq!(js_max(f64::NEG_INFINITY, f64::INFINITY), f64::INFINITY);
    assert_eq!(js_min(f64::NEG_INFINITY, f64::INFINITY), f64::NEG_INFINITY);
    assert_eq!(js_max0(f64::NEG_INFINITY), 0.0);
    assert_eq!(js_max_1_floor(0.5), 1.0);
    assert_eq!(js_max_1_floor(3.9), 3.0);
}

/// Sciezki PUBLICZNE (re-eksporty zastepujace dawne `pub fn`): ten sam wynik co wariant z tabeli.
#[test]
fn p6_js_math_sciezki_publiczne_to_ten_sam_wariant() {
    use civ_engine::domain::{
        civ_matrix::js_compat, diplomacy_multiwar, recruitment::army_merge, siege_capital_plunder,
        siege_tactics_blow, siege_tactics_inputs_pos, society_breakdown,
    };
    check2(
        "society_breakdown::js_max",
        society_breakdown::js_max,
        old_max_society,
    );
    check2(
        "society_breakdown::js_min",
        society_breakdown::js_min,
        old_min_multiwar,
    );
    check2(
        "diplomacy_multiwar::js_max",
        diplomacy_multiwar::js_max,
        old_max_multiwar,
    );
    check2(
        "diplomacy_multiwar::js_min",
        diplomacy_multiwar::js_min,
        old_min_multiwar,
    );
    check2(
        "army_merge::js_max",
        army_merge::js_max,
        old_max_recruitment,
    );
    check2(
        "army_merge::js_min",
        army_merge::js_min,
        old_min_recruitment,
    );
    check2("js_compat::js_max", js_compat::js_max, old_max_std);
    check2("js_compat::js_min", js_compat::js_min, old_min_std);
    check2(
        "inputs_pos::js_max_sign",
        siege_tactics_inputs_pos::js_max_sign,
        old_max_sign,
    );
    check2(
        "inputs_pos::js_min_sign",
        siege_tactics_inputs_pos::js_min_sign,
        old_min_sign,
    );
    check2("blow::js_max", siege_tactics_blow::js_max, old_max_sign);
    check2("blow::js_min", siege_tactics_blow::js_min, old_min_sign);
    check1(
        "plunder::js_max0",
        siege_capital_plunder::js_max0,
        old_max0_plunder,
    );
}
