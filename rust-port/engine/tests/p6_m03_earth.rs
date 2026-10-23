//! P6.M03 - zakresy `earth-land-mask.ts` przydzielone temu tematowi (:1-20, :27, :32, :37-50,
//! :53-78, :97, :128-146): stale, wysokosci/szerokosci pola gry, bufory biegunowe, wiersze lądu,
//! `bitAt`, siatka podprobkowania i prog ulamka lądu. Implementacja zyje w `mapgen::prims` (M01);
//! ten plik daje BEZPOSREDNIE wektory z URUCHOMIONEGO weba (`tests/p6_m03_vectors/earth.json`,
//! pin `edb8fb56`, `gen-m03-earth.mjs`) dla wszystkich funkcji tych zakresow, w tym prywatnych.

use std::sync::OnceLock;

use civ_engine::domain::mapgen::prims::{
    earth_land_fraction_threshold, earth_land_map_rows, earth_mask_bit_at, earth_north_ocean_rows,
    earth_playable_border, earth_playable_inner_height, earth_playable_inner_width,
    earth_polar_ocean_ref_inner_h, earth_polar_ocean_ref_rows, earth_polar_ocean_rows,
    earth_south_ocean_rows, earth_subsample_grid,
};
use serde_json::Value;

#[path = "p6_m03_vectors/common.rs"]
mod common;
use common::{int, num, same};

const EARTH: &str = include_str!("p6_m03_vectors/earth.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(EARTH).expect("earth parse"))
}

fn rows(name: &str) -> &'static Vec<Value> {
    web()[name].as_array().expect(name)
}

fn nonneg(value: &Value) -> Option<u32> {
    u32::try_from(int(value)).ok()
}

#[test]
fn constants_match_web() {
    let consts = &web()["consts"];
    assert_eq!(
        i64::from(earth_playable_border()),
        int(&consts["EARTH_PLAYABLE_BORDER"])
    );
    assert_eq!(
        i64::from(earth_polar_ocean_ref_rows()),
        int(&consts["EARTH_POLAR_OCEAN_REF_ROWS"])
    );
    assert_eq!(
        i64::from(earth_polar_ocean_ref_inner_h()),
        int(&consts["EARTH_POLAR_OCEAN_REF_INNER_H"])
    );
}

#[test]
fn heights_polar_rows_and_land_rows_match_web_for_every_height() {
    let mut compared = 0;
    for row in rows("heights") {
        // Ujemne wysokosci sa poza typem `u32` (generator ma wysokosc >= 0); web je tez liczy.
        let Some(h) = nonneg(&row[0]) else { continue };
        assert_eq!(
            i64::from(earth_playable_inner_height(h)),
            int(&row[1]),
            "h={h}"
        );
        assert_eq!(i64::from(earth_polar_ocean_rows(h)), int(&row[2]), "h={h}");
        assert_eq!(i64::from(earth_north_ocean_rows(h)), int(&row[3]), "h={h}");
        assert_eq!(i64::from(earth_south_ocean_rows(h)), int(&row[4]), "h={h}");
        assert_eq!(i64::from(earth_land_map_rows(h)), int(&row[5]), "h={h}");
        compared += 1;
    }
    assert!(compared >= 700, "porownano {compared} wysokosci");
}

#[test]
fn widths_inner_width_matches_web_for_every_width() {
    let mut compared = 0;
    for row in rows("widths") {
        let Some(w) = nonneg(&row[0]) else { continue };
        assert_eq!(
            i64::from(earth_playable_inner_width(w)),
            int(&row[1]),
            "w={w}"
        );
        compared += 1;
    }
    assert!(compared >= 700);
}

#[test]
fn subsample_grid_and_land_fraction_threshold_match_web_for_all_tier_edges() {
    let rows = rows("dims");
    assert!(rows.len() >= 2_500);
    for row in rows {
        let (w, h) = (nonneg(&row[0]).expect("w"), nonneg(&row[1]).expect("h"));
        assert_eq!(
            i64::from(earth_subsample_grid(w, h)),
            int(&row[2]),
            "{w}x{h}"
        );
        assert!(
            same(earth_land_fraction_threshold(w, h), num(&row[3])),
            "{w}x{h}"
        );
    }
}

#[test]
fn bit_at_matches_web_including_clamped_out_of_range_coordinates() {
    let rows = rows("bits");
    assert!(rows.len() > 8_000);
    let mut ones = 0;
    for row in rows {
        let bit = earth_mask_bit_at(int(&row[0]), int(&row[1]));
        assert_eq!(
            i64::from(bit),
            int(&row[2]),
            "bitAt({}, {})",
            row[0],
            row[1]
        );
        ones += u64::from(bit);
    }
    assert!(ones > 0, "wektory musza zawierac pola ladu");
}
