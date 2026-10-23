//! P6.M03 r2 (zarzut 3, mutant M15) - `landMaskKontynenty` w cieśninie: wektory z URUCHOMIONEGO
//! weba (`tests/p6_m03_vectors/strait.json`, `gen-m03-strait.mjs`, pin `edb8fb56`), w ktorych
//! `dist2 - distC` jest rowne progowi `0.018` CO DO BITU (oraz o 1 ulp mniej / wiecej). Heks lezy
//! w jednym wierszu z oboma centrami, wiec `hypot(x, 0) = |x|` i roznice sa dokladne. Web
//! (`dist2 - distC < 0.018`): rowne -> NIE ciesnina (wynik > 0); `<=` dalby 0.

use std::sync::OnceLock;

use civ_engine::data::derived::mapgen_masks;
use civ_engine::domain::mapgen::masks::land_mask_kontynenty;
use civ_engine::domain::mapgen::prims::build_perm_table;
use serde_json::Value;

#[path = "p6_m03_vectors/common.rs"]
mod common;
use common::{centers, dim, int, num, rng, same};

const STRAIT: &str = include_str!("p6_m03_vectors/strait.json");

fn web() -> &'static Value {
    static WEB: OnceLock<Value> = OnceLock::new();
    WEB.get_or_init(|| serde_json::from_str(STRAIT).expect("strait parse"))
}

#[test]
fn strait_vectors_match_web_at_exact_threshold_and_one_ulp_around_it() {
    let v = web();
    let mut perm_rng = rng(u32::try_from(int(&v["seed"])).expect("seed"));
    let perm = build_perm_table(&mut perm_rng);
    let noise = num(&v["noise_scale"]);
    let threshold = mapgen_masks().kontynenty.ciesnina;
    assert!(
        same(threshold, num(&v["threshold"])),
        "prog z tabeli != prog z weba"
    );
    let mut kinds = [0usize; 3];
    for case in v["cases"].as_array().expect("cases") {
        let cs = centers(&case["centers"]);
        let (q, r) = (int(&case["q"]), int(&case["r"]));
        let actual =
            land_mask_kontynenty(q, r, dim(&case["w"]), dim(&case["h"]), &cs, &perm, noise);
        assert!(same(actual, num(&case["value"])), "{case}: rust {actual:?}");
        // Konstrukcja wektora: roznica odleglosci dokladnie wedlug rodzaju przypadku.
        let diff = num(&case["diff"]);
        let (idx, expect_zero) = match case["kind"].as_str().expect("kind") {
            "rowne" => {
                assert!(same(diff, threshold));
                (0, false)
            }
            "ulp_mniej" => {
                assert!(diff < threshold);
                (1, true)
            }
            "ulp_wiecej" => {
                assert!(diff > threshold);
                (2, false)
            }
            other => panic!("rodzaj {other}"),
        };
        assert_eq!(actual == 0.0, expect_zero, "{case}");
        kinds[idx] += 1;
    }
    // Wektory musza obejmowac wszystkie trzy rodzaje (inaczej `<` vs `<=` jest nierozroznialne).
    assert!(
        kinds.iter().all(|&n| n >= 3),
        "rodzaje przypadkow: {kinds:?}"
    );
}
