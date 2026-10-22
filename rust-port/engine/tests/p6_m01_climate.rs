//! P6.M01 — klimat (`climateBandAt`, bufor oceanu, prog lasu, pustynia, woda) i literaly typow:
//! porownanie z wektorami z URUCHOMIONEGO weba (`tests/p6_m01_vectors/web-vectors.json`, pin
//! `edb8fb56`). Zamiast pojedynczych punktow: pelny sweep wysokosci 0..260 + {300, 400, 600} i
//! wszystkich wierszy `r` od -3 do `h + 2`, oba tryby (`isEarth` false/true).

use std::sync::OnceLock;

use civ_engine::domain::map_generator::{
    climate_band_at as generator_band_at, ClimateBand, Terrain, WorldType,
};
use civ_engine::domain::mapgen::prims::{
    can_assign_climate_desert, climate_band_at, climate_forest_threshold, is_polar_climate_band,
    is_water_terrain_local,
};
use serde_json::Value;

const WEB_VECTORS: &str = include_str!("p6_m01_vectors/web-vectors.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(WEB_VECTORS).expect("web vectors parse"))
}

fn txt(value: &Value) -> f64 {
    value.as_str().expect("tekst liczby").parse().expect("f64")
}

fn band_from_name(name: &str) -> ClimateBand {
    match name {
        "polar_north" => ClimateBand::PolarNorth,
        "temperate_north" => ClimateBand::TemperateNorth,
        "plains_north" => ClimateBand::PlainsNorth,
        "desert" => ClimateBand::Desert,
        "plains_south" => ClimateBand::PlainsSouth,
        "temperate_south" => ClimateBand::TemperateSouth,
        "polar_south" => ClimateBand::PolarSouth,
        other => panic!("nieznany pas klimatyczny weba: {other}"),
    }
}

fn band_names() -> Vec<&'static str> {
    web()["climate_bands"]
        .as_array()
        .expect("climate_bands")
        .iter()
        .map(|v| v.as_str().expect("nazwa"))
        .collect()
}

fn optional_band(value: &Value) -> Option<ClimateBand> {
    value.as_str().map(band_from_name)
}

#[test]
fn climate_band_sweep_matches_web_for_every_height_and_row() {
    let names = band_names();
    assert_eq!(names.len(), 7);
    let sweeps = web()["climate"].as_array().expect("climate");
    assert_eq!(sweeps.len(), (261 + 3) * 2);
    let mut cells = 0_usize;
    let mut seen = std::collections::BTreeSet::new();
    for sweep in sweeps {
        let h = sweep["h"].as_u64().expect("h") as u32;
        let is_earth = sweep["isEarth"].as_bool().expect("isEarth");
        let bands = sweep["bands"].as_str().expect("bands").as_bytes();
        assert_eq!(bands.len() as i64, i64::from(h) + 6, "dlugosc h={h}");
        for (offset, digit) in bands.iter().enumerate() {
            let r = offset as i64 - 3;
            let expected = band_from_name(names[usize::from(digit - b'0')]);
            assert_eq!(
                climate_band_at(r, h, is_earth),
                expected,
                "h={h} r={r} isEarth={is_earth}"
            );
            if r >= 0 {
                assert_eq!(
                    generator_band_at(r as u32, h, is_earth),
                    expected,
                    "wrapper h={h} r={r}"
                );
            }
            seen.insert(*digit);
            cells += 1;
        }
    }
    assert!(cells > 70_000);
    assert_eq!(seen.len(), 7, "sweep obejmuje wszystkie pasy");
}

#[test]
fn climate_band_default_arguments_and_ignored_q_match_web() {
    for row in web()["climate_default"]
        .as_array()
        .expect("climate_default")
    {
        let (h, r) = (
            row[0].as_u64().expect("h") as u32,
            row[1].as_i64().expect("r"),
        );
        let expected = band_from_name(band_names()[row[2].as_usize()]);
        assert_eq!(climate_band_at(r, h, false), expected);
    }
}

trait AsUsize {
    fn as_usize(&self) -> usize;
}

impl AsUsize for Value {
    fn as_usize(&self) -> usize {
        self.as_u64().expect("indeks") as usize
    }
}

#[test]
fn polar_predicate_matches_web() {
    let rows = web()["is_polar"].as_array().expect("is_polar");
    assert_eq!(rows.len(), 7);
    for row in rows {
        let band = band_from_name(row[0].as_str().expect("pas"));
        assert_eq!(
            is_polar_climate_band(band),
            row[1].as_bool().expect("bool"),
            "{band:?}"
        );
        assert_eq!(band.is_polar(), row[1].as_bool().expect("bool"));
    }
}

#[test]
fn forest_threshold_matches_web_bit_for_bit() {
    let rows = web()["forest_threshold"]
        .as_array()
        .expect("forest_threshold");
    assert_eq!(rows.len(), 8 * 8);
    for row in rows {
        let band = optional_band(&row[0]);
        let base = txt(&row[1]);
        assert_eq!(
            climate_forest_threshold(band, base).to_bits(),
            txt(&row[2]).to_bits(),
            "{band:?} base {base}"
        );
    }
}

#[test]
fn desert_assignment_predicate_matches_web() {
    let rows = web()["can_desert"].as_array().expect("can_desert");
    assert_eq!(rows.len(), 8);
    for row in rows {
        assert_eq!(
            can_assign_climate_desert(optional_band(&row[0])),
            row[1].as_bool().expect("bool"),
            "{:?}",
            row[0]
        );
    }
}

#[test]
fn water_terrain_predicate_matches_web_for_every_terrain() {
    let rows = web()["is_water"].as_array().expect("is_water");
    assert_eq!(rows.len(), 8);
    let mut mapped = std::collections::BTreeSet::new();
    for row in rows {
        let terrain = match row[0].as_str().expect("nazwa") {
            "Laka" => Terrain::Grassland,
            "Rownina" => Terrain::Plains,
            "Wzgorza" => Terrain::Hills,
            "Gory" => Terrain::Mountains,
            "PlytkieMorze" => Terrain::ShallowSea,
            "Morze" => Terrain::Sea,
            "Pustynia" => Terrain::Desert,
            "Polarny" => Terrain::Polar,
            other => panic!("nieznany TerenBazowy weba: {other}"),
        };
        mapped.insert(format!("{terrain:?}"));
        assert_eq!(
            is_water_terrain_local(terrain),
            row[2].as_bool().expect("bool"),
            "{terrain:?}"
        );
    }
    assert_eq!(
        mapped.len(),
        8,
        "kazdy teren weba odwzorowany na inny wariant Rust"
    );
}

#[test]
fn world_type_and_climate_band_serde_literals_match_web() {
    let web_world: Vec<&str> = web()["typ_swiata"]
        .as_array()
        .expect("typ_swiata")
        .iter()
        .map(|v| v.as_str().expect("literal"))
        .collect();
    let rust_world: Vec<String> = [
        WorldType::Continents,
        WorldType::Pangea,
        WorldType::Islands,
        WorldType::Earth,
    ]
    .iter()
    .map(|w| {
        serde_json::to_value(w)
            .expect("serde")
            .as_str()
            .expect("tekst")
            .to_owned()
    })
    .collect();
    assert_eq!(rust_world, web_world);
    for (world, literal) in [
        WorldType::Continents,
        WorldType::Pangea,
        WorldType::Islands,
        WorldType::Earth,
    ]
    .iter()
    .zip(&web_world)
    {
        assert_eq!(world.to_string(), *literal);
    }

    let order = [
        ClimateBand::PolarNorth,
        ClimateBand::TemperateNorth,
        ClimateBand::PlainsNorth,
        ClimateBand::Desert,
        ClimateBand::PlainsSouth,
        ClimateBand::TemperateSouth,
        ClimateBand::PolarSouth,
    ];
    for (band, name) in order.iter().zip(band_names()) {
        assert_eq!(
            serde_json::to_value(band).expect("serde"),
            Value::String(name.to_owned())
        );
        assert_eq!(band_from_name(name), *band);
    }
}
