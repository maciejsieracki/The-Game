//! Siec drog: 6-bitowa maska sasiedztwa heksa (P4-1B-Q1, D-DTO-4 = A — silnik liczy `roadMask`).
//!
//! Port 1:1 pinu `07d2fbd72`, `gra/src/map/road-network.ts`:
//! `ROAD_DIRS` (:32-34) i `computeRoadMask` (:75-86). Geometria ramion (`roadMaskArms` i in.,
//! :89-127) zostaje w rendererze. Wolajacy w silniku: producent `HexDynDto` (P4-1B-Q3).

/// Web `ROAD_DIRS` (`road-network.ts:32-34`). KOLEJNOSC JEST KONTRAKTEM: indeks kierunku = numer
/// bitu w masce. Identyczna kolejnosc co `mapgen::prims::HEX_DIRECTIONS` (pilnuje test).
pub const ROAD_DIRS: [(i32, i32); 6] = [(1, 0), (1, -1), (0, -1), (-1, 0), (-1, 1), (0, 1)];

/// Web `computeRoadMask(q, r, hasRoadAt)` (`road-network.ts:75-86`): bit `i` ustawiony, gdy
/// sasiad `(q, r) + ROAD_DIRS[i]` ma droge wg `has_road_at`. Wynik w `0..=0x3F`.
///
/// Sasiad spoza mapy i rodzaj drogi rozstrzyga predykat wolajacego (web: `hexHasRoadAt`,
/// `main.ts:3144-3147` — brak heksa = `false`, kazdy typ drogi liczy sie tak samo).
pub fn compute_road_mask(q: i32, r: i32, has_road_at: impl Fn(i32, i32) -> bool) -> u8 {
    let mut mask = 0u8;
    for (i, (dq, dr)) in ROAD_DIRS.iter().enumerate() {
        if has_road_at(q + dq, r + dr) {
            mask |= 1 << i;
        }
    }
    mask
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn single_neighbour_sets_its_bit() {
        for (i, (dq, dr)) in ROAD_DIRS.iter().enumerate() {
            let m = compute_road_mask(3, 4, |q, r| q == 3 + dq && r == 4 + dr);
            assert_eq!(m, 1 << i);
        }
        assert_eq!(compute_road_mask(0, 0, |_, _| false), 0);
        assert_eq!(compute_road_mask(0, 0, |_, _| true), 0x3F);
    }
}
