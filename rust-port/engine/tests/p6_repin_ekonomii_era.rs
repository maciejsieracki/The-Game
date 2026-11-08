//! R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1 (r5, czesc C): epoka wlasciciela w `tile_yield_full`
//! (`WorkedTileImpInput::wlasciciel_era`), 1:1 z webem `economy.ts::tileYield(WorkedTile.wlascicielEra)` ->
//! `applyImprovementBonuses(out, impKeys, tile.wlascicielEra)` (R-WEB-IMPROVEMENT-ERA-SCALING-Q1).
//!
//! Wektory: `tests/p6_repin_ekonomii_vectors/era_tile.json` z URUCHOMIONEGO weba (hybrid2 = 331ef699b +
//! `terrain-improvements.ts` z origin/main 247f1ef2a); generator
//! `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1/tools/gen-p6-repin-ekonomii-era-vectors.mjs`.
//!
//! - `tile_yield_with_owner_era_matches_running_web`: 1760 kafelkow (5 terenow x 2 nakladki x rzeka x 11 zestawow
//!   ulepszen x 8 epok: undefined, 0, 1, 1.5, 2, 2.5, 3, 4), bit-w-bit.
//! - `era_boundaries_n_minus_1_n_n_plus_1`: farma/tartak/kopalnia na lace; epoka 1 (N-1), 2 (N), 3 (N+1) oraz spoza
//!   zbioru {2,3} (0, 1.5, 4, brak) = wartosci bazowe, jak `improvementYieldForEra` w webie.

use civ_engine::data::terrain_map::parse_terrain_yields;
use civ_engine::domain::economy_yield::{tile_yield_full, WorkedTileImpInput};
use serde_json::Value;

const VECTORS: &str = include_str!("p6_repin_ekonomii_vectors/era_tile.json");

fn ef(v: &Value) -> f64 {
    let s = v["f"].as_str().expect("tagged number");
    s.parse::<f64>()
        .unwrap_or_else(|_| panic!("unparsable number {s}"))
}

fn same(got: f64, exp: f64) -> bool {
    (got.is_nan() && exp.is_nan()) || got.to_bits() == exp.to_bits()
}

fn era_of(v: &Value) -> Option<f64> {
    if v.get("u").is_some() {
        None
    } else {
        Some(ef(v))
    }
}

#[test]
fn tile_yield_with_owner_era_matches_running_web() {
    let doc: Value = serde_json::from_str(VECTORS).expect("era_tile.json");
    let data = parse_terrain_yields().expect("terrain-yields.json");
    let cases = doc["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 1760);
    let mut scaled = 0usize;
    for (i, c) in cases.iter().enumerate() {
        let inp = &c["in"];
        let keys: Option<Vec<String>> = inp["keys"].as_array().map(|a| {
            a.iter()
                .map(|x| x.as_str().expect("klucz").to_owned())
                .collect()
        });
        let tile = WorkedTileImpInput {
            teren_bazowy: inp["teren"].as_str().unwrap(),
            nakladka: inp["nakladka"].as_str().unwrap(),
            ma_rzeke: inp["maRzeke"].as_bool().unwrap(),
            ulepszenia_keys: keys.as_deref(),
            ulepszenie_key: keys.as_ref().and_then(|k| k.first()).map(String::as_str),
            zloze: None,
            wlasciciel_era: era_of(&inp["era"]),
        };
        let y = tile_yield_full(&data, &tile);
        let out = &c["out"];
        for (name, got) in [
            ("zywnosc", y.zywnosc),
            ("praca", y.praca),
            ("handel", y.handel),
            ("drewno", y.drewno),
            ("kamien", y.kamien),
            ("glina", y.glina),
            ("ruda", y.ruda),
            ("ruda_zelaza", y.ruda_zelaza),
        ] {
            let exp = ef(&out[name]);
            assert!(
                same(got, exp),
                "case {i} {inp} pole {name}: rust={got} web={exp}"
            );
        }
        if tile.wlasciciel_era.is_some_and(|e| e == 2.0 || e == 3.0) && keys.is_some() {
            scaled += 1;
        }
    }
    assert!(scaled > 0, "wektor nie zawiera skalowanych epok");
}

fn farm_tile_yield(era: Option<f64>) -> (f64, f64, f64) {
    let data = parse_terrain_yields().expect("terrain-yields.json");
    let keys = vec!["farma".to_owned()];
    let y = tile_yield_full(
        &data,
        &WorkedTileImpInput {
            teren_bazowy: "laka",
            nakladka: "brak",
            ma_rzeke: false,
            ulepszenia_keys: Some(&keys),
            ulepszenie_key: Some("farma"),
            zloze: None,
            wlasciciel_era: era,
        },
    );
    (y.zywnosc, y.praca, y.handel)
}

#[test]
fn era_boundaries_n_minus_1_n_n_plus_1() {
    let base = farm_tile_yield(None);
    // N-1 = epoka 1 (Kamien): wartosci bazowe z JSON.
    assert_eq!(farm_tile_yield(Some(1.0)), base);
    // N = epoka 2 (Braz): farma ma bonus zywnosci > 0, wiec +1 (praca/handel: tylko gdy baza > 0).
    let e2 = farm_tile_yield(Some(2.0));
    assert_eq!(e2.0, base.0 + 1.0, "zywnosc era 2");
    // N+1 = epoka 3 (Zelazo): +2.
    let e3 = farm_tile_yield(Some(3.0));
    assert_eq!(e3.0, base.0 + 2.0, "zywnosc era 3");
    // Poza zbiorem {2,3} web zwraca baze (`era !== 2 && era !== 3`).
    for off in [0.0, 1.5, 2.5, 4.0, -1.0, f64::NAN] {
        assert_eq!(farm_tile_yield(Some(off)), base, "era {off}");
    }
}
