//! P6.M16 - galeria 3D (`improvement-build.ts:1177-1292`): `galleryTerrainEligible`,
//! `galleryComboEligible`, `galleryComboShowModel`. Wektory z URUCHOMIONEGO weba (pin edb8fb56).

#[path = "p6_m16_vectors/common.rs"]
mod common;

use civ_engine::domain::improvement_build::*;
use common::*;
use serde_json::Value;

fn data() -> Value {
    load("gallery.json")
}

#[test]
fn gallery_terrain_eligible_matches_web() {
    let d = data();
    let (mut yes, mut no) = (0, 0);
    for c in arr(&d, "terrain") {
        let got = gallery_terrain_eligible(s(&c["key"]), terrain(&c["teren"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 40 && no > 80, "{yes} {no}");
}

#[test]
fn gallery_combo_eligible_and_show_model_match_web() {
    let d = data();
    let (mut yes, mut no) = (0, 0);
    for c in arr(&d, "combo") {
        let got = gallery_combo_eligible(&strs(&c["keys"]), terrain(&c["teren"]));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 200 && no > 200, "{yes} {no}");
    let (mut yes, mut no) = (0, 0);
    for c in arr(&d, "show") {
        let keys = strs(&c["keys"]);
        let preview = c["preview"].as_bool();
        let got = gallery_combo_show_model(&keys, terrain(&c["teren"]), preview.unwrap_or(false));
        assert_eq!(got, c["out"].as_bool().unwrap(), "{c}");
        if got {
            yes += 1;
        } else {
            no += 1;
        }
    }
    assert!(yes > 200 && no > 200, "{yes} {no}");
}
