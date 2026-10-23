//! P6.M04 - klasyfikacja terenu: wektory z URUCHOMIONEGO weba (`gen-helpers.ts`:825-967, 1163-1174).
//! Porownanie f64 bitowe; pokrycie wymuszone asercjami (kazdy teren wynikowy, galezie progow).

#[path = "p6_m04_vectors/common.rs"]
mod common;

use civ_engine::data::derived::mapgen_terrain_class;
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::params::DensityTier;
use civ_engine::domain::mapgen::terrain_class::{
    classify_terrain, classify_terrain_flat, hash_int3, map_border_width, relief_elev_gates,
    relief_land_fractions, teren_coverage_cell_size, terrain_cell_bias, terrain_rown_laka_jitter,
    Nakladka,
};
use common::{
    assert_f64, band_from_web, cases, fv, fv_opt, i, s, terrain_from_code, thresholds_from,
    tier_from_web, web,
};

#[test]
fn consts_match_web() {
    let c = &web()["cases"]["consts"];
    assert_f64(
        teren_coverage_cell_size(),
        fv(&c["terenCoverageCellSize"]),
        "terenCoverageCellSize",
    );
    for row in c["mapBorderWidth"].as_array().unwrap() {
        assert_f64(
            map_border_width(fv(&row[0]), fv(&row[1])),
            fv(&row[2]),
            "mapBorderWidth",
        );
    }
    for row in c["reliefLandFractions"].as_array().unwrap() {
        let tier = tier_from_web(s(&row[0]));
        let f = relief_land_fractions(tier);
        assert_f64(f.mountain, fv(&row[1]), "reliefLandFractions.mountain");
        assert_f64(f.highland, fv(&row[2]), "reliefLandFractions.highland");
        // zgodnosc ze stalymi prywatnymi weba (FALLBACK_RELIEF_FRAC)
        let fb = &c["FALLBACK_RELIEF_FRAC"][tier.key()];
        assert_f64(f.mountain, fv(&fb["mountain"]), "FALLBACK.mountain");
        assert_f64(f.highland, fv(&fb["highland"]), "FALLBACK.highland");
    }
    assert_eq!(
        DensityTier::from_key("low"),
        Some(DensityTier::Low),
        "klucze tierow weba"
    );
    // tabela balansu == prywatne stale weba (zapisane z uruchomionego kodu)
    let t = mapgen_terrain_class();
    assert_f64(
        t.przeplot_rownina_laka.amplituda_globalna.wartosc,
        fv(&c["TERRAIN_GLOBAL_MIX_AMP"]),
        "TERRAIN_GLOBAL_MIX_AMP",
    );
    assert_f64(
        t.przeplot_rownina_laka.amplituda_komorkowa.wartosc,
        fv(&c["TERRAIN_CELL_JITTER_AMP"]),
        "TERRAIN_CELL_JITTER_AMP",
    );
    let budgets = &t.relief_po_dopasowaniu_ladu.budzet_ulamek_ladu;
    for (key, value) in [
        ("low", budgets.low.wartosc),
        ("medium", budgets.medium.wartosc),
        ("high", budgets.high.wartosc),
    ] {
        assert_f64(
            value,
            fv(&c["REAPPLY_RELIEF_BUDGET_FRAC"][key]),
            "REAPPLY_RELIEF_BUDGET_FRAC",
        );
    }
}

#[test]
fn hash_int3_matches_web() {
    let rows = cases("hashInt3");
    assert!(rows.len() > 4000);
    for row in rows {
        let got = hash_int3(fv(&row[0]), fv(&row[1]), fv(&row[2]));
        assert_f64(got, fv(&row[3]), &format!("hashInt3{row}"));
        assert!((0.0..1.0).contains(&got), "hashInt3 poza [0,1): {got}");
    }
}

#[test]
fn terrain_cell_bias_matches_web() {
    let rows = cases("cellBias");
    assert!(rows.len() > 5000);
    let mut default_cell = 0;
    let mut explicit_cell = 0;
    for row in rows {
        let cs = fv_opt(&row[3]);
        if cs.is_none() {
            default_cell += 1;
        } else {
            explicit_cell += 1;
        }
        let got = terrain_cell_bias(fv(&row[0]), fv(&row[1]), fv(&row[2]), cs);
        assert_f64(got, fv(&row[4]), &format!("terrainCellBias{row}"));
    }
    assert!(
        default_cell > 600 && explicit_cell > 2000,
        "pokrycie argumentu domyslnego"
    );
}

#[test]
fn rown_laka_jitter_matches_web() {
    let rows = cases("jitter");
    assert!(rows.len() >= 3000);
    for row in rows {
        let got = terrain_rown_laka_jitter(fv(&row[0]), fv(&row[1]), fv(&row[2]));
        assert_f64(got, fv(&row[3]), &format!("jitter{row}"));
    }
}

#[test]
fn relief_elev_gates_match_web() {
    let rows = cases("elevGates");
    assert!(rows.len() > 500);
    let mut distinct = std::collections::BTreeSet::new();
    for row in rows {
        let g = relief_elev_gates(fv(&row[0]));
        assert_f64(g.mountain, fv(&row[1]), "gates.mountain");
        assert_f64(g.highland, fv(&row[2]), "gates.highland");
        assert_f64(g.land_mask_hi, fv(&row[3]), "gates.landMaskHi");
        assert_f64(g.land_mask_mtn, fv(&row[4]), "gates.landMaskMtn");
        distinct.insert(g.mountain.to_bits());
    }
    assert_eq!(distinct.len(), 3, "wszystkie trzy wiersze bramek wystepuja");
}

type ClassifyFn = fn(
    f64,
    f64,
    f64,
    f64,
    f64,
    Option<&civ_engine::domain::mapgen::terrain_class::TerrainClassifyThresholds>,
    Option<civ_engine::domain::map_generator::ClimateBand>,
    f64,
) -> civ_engine::domain::mapgen::terrain_class::TerrainResult;

fn run_classify(name: &str, f: ClassifyFn) -> std::collections::BTreeMap<String, usize> {
    let rows = cases(name);
    assert!(rows.len() >= 6000);
    let mut counts = std::collections::BTreeMap::new();
    let (mut with_th, mut with_band, mut with_bias, mut default_bias) = (0, 0, 0, 0);
    for row in rows {
        let a = row.as_array().unwrap();
        let th = thresholds_from(&a[5]);
        let band = a[6].as_str().map(band_from_web);
        let bias = fv_opt(&a[7]);
        with_th += usize::from(th.is_some());
        with_band += usize::from(band.is_some());
        with_bias += usize::from(bias.is_some());
        default_bias += usize::from(bias.is_none());
        let got = f(
            fv(&a[0]),
            fv(&a[1]),
            fv(&a[2]),
            fv(&a[3]),
            fv(&a[4]),
            th.as_ref(),
            band,
            // web: `cellBias = 0` dla `undefined`
            bias.unwrap_or(0.0),
        );
        assert_eq!(got.nakladka, Nakladka::Brak, "{name}{row}: nakladka");
        assert_eq!(got.teren_bazowy, terrain_from_code(i(&a[8])), "{name}{row}");
        *counts.entry(format!("{:?}", got.teren_bazowy)).or_insert(0) += 1;
    }
    assert!(with_th > 3000 && with_band > 3000 && with_bias > 3000 && default_bias > 1000);
    counts
}

#[test]
fn classify_terrain_matches_web() {
    let counts = run_classify("classify", classify_terrain);
    for t in [
        Terrain::Sea,
        Terrain::Grassland,
        Terrain::Plains,
        Terrain::Desert,
        Terrain::Hills,
        Terrain::Mountains,
    ] {
        assert!(
            counts.get(&format!("{t:?}")).copied().unwrap_or(0) >= 100,
            "za malo wynikow {t:?}: {counts:?}"
        );
    }
}

#[test]
fn classify_terrain_flat_matches_web() {
    let counts = run_classify("classifyFlat", classify_terrain_flat);
    for t in [Terrain::Grassland, Terrain::Plains, Terrain::Desert] {
        assert!(
            counts.get(&format!("{t:?}")).copied().unwrap_or(0) >= 100,
            "za malo wynikow {t:?}: {counts:?}"
        );
    }
    // classifyTerrainFlat nigdy nie zwraca Morza, Gor ani Wzgorz
    for t in [Terrain::Sea, Terrain::Mountains, Terrain::Hills] {
        assert!(
            !counts.contains_key(&format!("{t:?}")),
            "flat zwrocil {t:?}"
        );
    }
}
