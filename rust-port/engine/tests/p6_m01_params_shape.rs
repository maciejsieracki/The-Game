//! P6.M01 — testy KSZTALTU tabel `data/derived/mapgen-core-params.json` i `earth-land-mask.json`
//! oraz niezmiennikow rdzenia, BEZ pinow wartosci balansowych: zmiana liczby kalibracyjnej w JSON
//! nie wymaga zmiany tych testow, o ile zachowany jest ksztalt. Zgodnosc liczb z webem sprawdzaja
//! osobno testy wektorowe `p6_m01_prims|earth_mask|climate` (to zamraza ZRODLO weba, nie balans).

use civ_engine::data::derived::{
    earth_land_mask_file, mapgen_core_params, parse_earth_land_mask, parse_mapgen_core_params,
    EARTH_LAND_MASK_JSON, MAPGEN_CORE_PARAMS_JSON,
};
use civ_engine::domain::map_generator::ClimateBand;
use civ_engine::domain::mapgen::prims::{
    climate_band_at, earth_land_fraction_threshold, earth_mask_bbox, earth_mask_bit_at,
    earth_mask_height, earth_mask_width, earth_polar_ocean_rows, earth_subsample_grid,
    earth_template_land_at, latitudinal_ocean_buffer_rows, sample_earth_template_land,
};

fn band_rank(band: ClimateBand) -> u8 {
    match band {
        ClimateBand::PolarNorth => 0,
        ClimateBand::TemperateNorth => 1,
        ClimateBand::PlainsNorth => 2,
        ClimateBand::Desert => 3,
        ClimateBand::PlainsSouth => 4,
        ClimateBand::TemperateSouth => 5,
        ClimateBand::PolarSouth => 6,
    }
}

/// Token liczby po `"klucz":` w surowym tekscie JSON (do kontroli, ze parser nie gubi ulp).
fn raw_number_after(json: &str, key: &str) -> f64 {
    let needle = format!("\"{key}\":");
    let start = json
        .find(&needle)
        .unwrap_or_else(|| panic!("brak klucza {key}"))
        + needle.len();
    let token: String = json[start..]
        .trim_start()
        .chars()
        .take_while(|c| c.is_ascii_digit() || matches!(c, '.' | '-' | '+' | 'e' | 'E'))
        .collect();
    token
        .parse()
        .unwrap_or_else(|_| panic!("zly token {token} dla {key}"))
}

#[test]
fn params_files_parse_and_have_the_expected_shape() {
    let params = parse_mapgen_core_params().expect("mapgen-core-params.json");
    assert!(!params.zrodlo.is_empty());
    let earth = &params.earth;
    assert!(earth.granica_grywalna >= 1);
    assert!(earth.polarny_ocean_wiersze_ref >= 1);
    assert!(earth.polarny_ocean_wysokosc_ref >= 1);
    assert!(earth.polarny_ocean_min_wiersze >= 1);
    assert!(earth.polarny_ocean_limit_proc > 0.0 && earth.polarny_ocean_limit_proc < 0.5);
    assert!(earth.prog_szablonu_ladu > 0.0 && earth.prog_szablonu_ladu <= 1.0);
    assert!(earth.podprobkowanie_domyslne >= 1);
    assert!(earth.prog_ulamka_ladu_domyslny > 0.0 && earth.prog_ulamka_ladu_domyslny <= 1.0);
    // Progi: malejace po `min_wewn` (pierwszy pasujacy wygrywa), wartosci dodatnie.
    assert!(!earth.podprobkowanie_progi.is_empty());
    assert!(earth
        .podprobkowanie_progi
        .windows(2)
        .all(|w| w[0].min_wewn > w[1].min_wewn));
    assert!(earth.podprobkowanie_progi.iter().all(|t| t.kroki >= 1));
    assert!(!earth.prog_ulamka_ladu_progi.is_empty());
    assert!(earth
        .prog_ulamka_ladu_progi
        .windows(2)
        .all(|w| w[0].min_wewn > w[1].min_wewn));
    assert!(earth
        .prog_ulamka_ladu_progi
        .iter()
        .all(|t| t.prog > 0.0 && t.prog <= 1.0));

    let climate = &params.klimat;
    assert!(climate.polarny_proc > 0.0 && climate.polarny_proc < 0.5);
    assert!(climate.pustynia_pol_wiersze > 0.0);
    assert!(climate.rowniny_pol_proc > 0.0 && climate.rowniny_pol_proc < 0.5);
    assert!(climate.bufor_proceduralny_proc >= 0.0 && climate.bufor_proceduralny_proc < 0.5);
    assert!(climate.bufor_proceduralny_min_wiersze >= 1);
    assert!(climate.las_prog_wrogi.is_finite() && climate.las_umiarkowany_delta.is_finite());
    assert_eq!(&params, mapgen_core_params(), "singleton == swiezy parse");
}

#[test]
fn params_floats_are_parsed_exactly_from_the_raw_json_text() {
    // `serde_json` bez `float_roundtrip` moze przeklamac ulp; tabela ma pozostac dokladna.
    let params = mapgen_core_params();
    let climate = &params.klimat;
    let earth = &params.earth;
    for (key, value) in [
        ("polarny_proc", climate.polarny_proc),
        ("pustynia_pol_wiersze", climate.pustynia_pol_wiersze),
        ("rowniny_pol_proc", climate.rowniny_pol_proc),
        ("bufor_proceduralny_proc", climate.bufor_proceduralny_proc),
        ("las_prog_wrogi", climate.las_prog_wrogi),
        ("las_umiarkowany_delta", climate.las_umiarkowany_delta),
        ("polarny_ocean_limit_proc", earth.polarny_ocean_limit_proc),
        ("prog_szablonu_ladu", earth.prog_szablonu_ladu),
        ("prog_ulamka_ladu_domyslny", earth.prog_ulamka_ladu_domyslny),
    ] {
        assert_eq!(
            value.to_bits(),
            raw_number_after(MAPGEN_CORE_PARAMS_JSON, key).to_bits(),
            "{key}"
        );
    }
    let mask = earth_land_mask_file();
    for (key, value) in [
        ("min_x", mask.bbox.min_x),
        ("min_y", mask.bbox.min_y),
        ("max_x", mask.bbox.max_x),
        ("max_y", mask.bbox.max_y),
    ] {
        assert_eq!(
            value.to_bits(),
            raw_number_after(EARTH_LAND_MASK_JSON, key).to_bits(),
            "{key}"
        );
    }
}

#[test]
fn mask_file_is_well_formed() {
    let file = parse_earth_land_mask().expect("earth-land-mask.json");
    assert!(file.szerokosc > 1 && file.wysokosc > 1);
    assert!(file.bbox.min_x >= 0.0 && file.bbox.max_x <= 1.0 && file.bbox.min_x < file.bbox.max_x);
    assert!(file.bbox.min_y >= 0.0 && file.bbox.max_y <= 1.0 && file.bbox.min_y < file.bbox.max_y);
    let mut total = 0_usize;
    for run in file.rle.split(';') {
        let (bit, count) = run.split_at(1);
        assert!(bit == "0" || bit == "1", "bit przebiegu: {run}");
        let count: usize = count.parse().expect("dlugosc przebiegu");
        assert!(count > 0);
        total += count;
    }
    assert_eq!(total, file.szerokosc * file.wysokosc);
    let ones = (0..earth_mask_height())
        .flat_map(|y| (0..earth_mask_width()).map(move |x| (x, y)))
        .filter(|(x, y)| earth_mask_bit_at(*x as i64, *y as i64) == 1)
        .count();
    assert!(ones > 0 && ones < total, "maska ma i lad, i morze");
    let (min_x, min_y, max_x, max_y) = earth_mask_bbox();
    assert!(min_x < max_x && min_y < max_y);
}

#[test]
fn climate_bands_are_ordered_north_to_south_and_cover_the_playable_rows() {
    for is_earth in [false, true] {
        for height in 20..=260_u32 {
            let ranks: Vec<u8> = (0..i64::from(height))
                .map(|r| band_rank(climate_band_at(r, height, is_earth)))
                .collect();
            assert!(
                ranks.windows(2).all(|w| w[0] <= w[1]),
                "h={height} earth={is_earth}: pasy nie rosna"
            );
            assert_eq!(ranks[0], 0, "polnoc zaczyna sie od pasa polarnego");
            assert_eq!(
                *ranks.last().expect("rzedy"),
                6,
                "poludnie konczy sie pasem polarnym"
            );
            assert!(
                ranks.contains(&3),
                "h={height} earth={is_earth}: brak pustyni"
            );
        }
    }
}

#[test]
fn climate_is_polar_outside_the_map() {
    for height in [10_u32, 40, 120] {
        for is_earth in [false, true] {
            assert_eq!(
                climate_band_at(-1, height, is_earth),
                ClimateBand::PolarNorth
            );
            assert_eq!(
                climate_band_at(i64::from(height) + 1, height, is_earth),
                ClimateBand::PolarSouth
            );
        }
    }
}

#[test]
fn ocean_buffers_never_shrink_with_height_and_respect_their_lower_bound() {
    let params = mapgen_core_params();
    let mut previous_earth = 0;
    let mut previous_plain = 0;
    for height in 0..=400_u32 {
        let earth = earth_polar_ocean_rows(height);
        let plain = latitudinal_ocean_buffer_rows(height, false);
        assert!(earth >= params.earth.polarny_ocean_min_wiersze);
        assert!(plain >= params.klimat.bufor_proceduralny_min_wiersze);
        assert!(
            earth >= previous_earth && plain >= previous_plain,
            "h={height}"
        );
        assert_eq!(latitudinal_ocean_buffer_rows(height, true), earth);
        previous_earth = earth;
        previous_plain = plain;
    }
}

#[test]
fn template_land_respects_border_and_polar_buffers_and_yields_binary_values() {
    let border = i64::from(civ_engine::domain::mapgen::prims::earth_playable_border());
    for (width, height) in [(36_u32, 28_u32), (168, 120), (80, 60), (250, 100)] {
        let polar = i64::from(earth_polar_ocean_rows(height));
        let mut land = 0;
        let mut sea = 0;
        for r in 0..i64::from(height) {
            for q in 0..i64::from(width) {
                let value = earth_template_land_at(q, r, width, height);
                assert!(value == 0.0 || value == 1.0);
                let in_border = q < border
                    || r < border
                    || q >= i64::from(width) - border
                    || r >= i64::from(height) - border;
                let in_polar =
                    r - border < polar || r - border >= i64::from(height) - 1 - 2 * border - polar;
                if in_border || in_polar {
                    assert_eq!(value, 0.0, "{width}x{height} ({q},{r}) w buforze");
                }
                if value == 1.0 {
                    land += 1;
                } else {
                    sea += 1;
                }
            }
        }
        assert!(land > 0 && sea > 0, "{width}x{height}: lad i morze");
    }
}

#[test]
fn subsample_and_threshold_tiers_never_decrease_resolution_for_bigger_maps() {
    let mut previous_steps = u32::MAX;
    let mut previous_threshold = 0.0_f64;
    for size in (4..=700_u32).step_by(2) {
        let steps = earth_subsample_grid(size, size);
        let threshold = earth_land_fraction_threshold(size, size);
        assert!(steps >= 1 && threshold > 0.0);
        assert!(
            steps <= previous_steps,
            "wieksza mapa nie moze miec wiekszego podprobkowania ({size})"
        );
        assert!(
            threshold >= previous_threshold,
            "wieksza mapa nie obniza progu ulamka ({size})"
        );
        previous_steps = steps;
        previous_threshold = threshold;
    }
}

#[test]
fn template_sampling_is_zero_outside_the_unit_square() {
    for (nq, nr) in [
        (-0.1, 0.5),
        (1.1, 0.5),
        (0.5, -0.1),
        (0.5, 1.1),
        (-5.0, 7.0),
    ] {
        assert_eq!(sample_earth_template_land(nq, nr), 0.0);
    }
}
