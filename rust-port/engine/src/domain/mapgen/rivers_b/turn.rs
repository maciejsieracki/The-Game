//! P6.M07B partia 1 — geometria okna skretu rzeki (web gen-helpers.ts:7051-7086, pin edb8fb56).
//! Reuzywa z `rivers_a::grow`: `path_segment_dirs`, `path_signed_turn_deltas` (bez zmiany widocznosci).

use crate::domain::mapgen::rivers_a::grow::{path_segment_dirs, path_signed_turn_deltas};
use crate::domain::mapgen::rivers_a::RiverCoord;

/// Web `riverSegmentUnitVector` zwraca `{ x, y }` (wektor jednostkowy w przestrzeni swiata).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct UnitVec {
    pub x: f64,
    pub y: f64,
}

/// Web `riverSegmentUnitVector(a, b)` (:7051): wektor jednostkowy a->b (pointy-top axial).
/// Dlugosc < 1e-9 (ten sam heks) daje `{0,0}`.
/// ZALOZENIE (dossier): `f64::hypot` zamiast `Math.hypot`; V8 zwraca 1-ulp inna wartosc zaleznie
/// od tieru JIT, wiec wektory porownujemy z tolerancja 1e-12; wyniki logiczne (dot < -0.01) sa bit-identyczne.
pub fn river_segment_unit_vector(a: RiverCoord, b: RiverCoord) -> UnitVec {
    let sqrt3 = 3f64.sqrt();
    let x1 = sqrt3 * (a.q as f64 + a.r as f64 / 2.0);
    let y1 = 1.5 * a.r as f64;
    let x2 = sqrt3 * (b.q as f64 + b.r as f64 / 2.0);
    let y2 = 1.5 * b.r as f64;
    let dx = x2 - x1;
    let dy = y2 - y1;
    let len = dx.hypot(dy);
    if len < 1e-9 {
        return UnitVec { x: 0.0, y: 0.0 };
    }
    UnitVec {
        x: dx / len,
        y: dy / len,
    }
}

/// Web `riverPathHasSharpUTurn(path)` (:7064): czy trojka kolejnych segmentow ma zawrot 180 (dot < -0.01).
pub fn river_path_has_sharp_u_turn(path: &[RiverCoord]) -> bool {
    if path.len() < 3 {
        return false;
    }
    for i in 0..path.len() - 2 {
        let v1 = river_segment_unit_vector(path[i], path[i + 1]);
        let v2 = river_segment_unit_vector(path[i + 1], path[i + 2]);
        if v1.x * v2.x + v1.y * v2.y < -0.01 {
            return true;
        }
    }
    false
}

/// Web `riverPathViolatesTurnWindow(path, windowHex, maxSum)` (:7075): bramka regresji okna skretu.
/// Zwraca true, gdy jest sharp U-turn, skret |delta| > 1 albo |suma okna| > maxSum.
pub fn river_path_violates_turn_window(
    path: &[RiverCoord],
    window_hex: usize,
    max_sum: i64,
) -> bool {
    if path.len() < 3 {
        return false;
    }
    if river_path_has_sharp_u_turn(path) {
        return true;
    }
    let deltas = path_signed_turn_deltas(&path_segment_dirs(path));
    for i in 0..deltas.len() {
        if deltas[i].abs() > 1 {
            return true;
        }
        if i + 1 < window_hex {
            continue;
        }
        let sum: i64 = deltas[i + 1 - window_hex..i + 1].iter().sum();
        if sum.abs() > max_sum {
            return true;
        }
    }
    false
}
