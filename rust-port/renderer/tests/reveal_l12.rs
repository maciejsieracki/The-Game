//! R-RUSTPORT-P4-1-L12-REVEAL-R1: `revealAllLand` and `riverRevealKeys`
//! (gaps L1/L2) — the DTO `civ_view_model::map::FogRevealDto` and its adapter
//! `civ_renderer::view::fog::FogReveal`.
//!
//! Expected values come from `reveal_l12_vectors/vectors.json`, written by
//! `reveal_l12_gen.mjs`, which EXECUTES the pin `07d2fbd72`
//! (`game/visibility.ts`, `main.ts` `refreshFog` / `fogExploredForRender` /
//! `startRevealKeysForRiverFog`, `render/scene.ts` `setFog` head and river
//! `fogActive`, `render/riverLod.ts` `mergedRiverVisibleInFog`). For every
//! scenario the test reads the DTO the producer must send, runs
//! `FogSets::from_dto` + `FogReveal::from_dto` and compares with what the pin
//! passes to `setFog` and what the scene derives from it: the two fog sets,
//! `landReveal`, `lastRiverRevealKeys`, `showOceanBackdropNow`,
//! `lastAnyHidden` and the visibility of every merged river entry.

use std::collections::HashSet;

use civ_renderer::decor::river_lod::merged_river_visible_in_fog;
use civ_renderer::view::fog::{FogReveal, FogRevealError, FogSets};
use civ_view_model as vm;
use civ_view_model::map::FogRevealDto;
use serde_json::Value;

const VECTORS: &str = include_str!("reveal_l12_vectors/vectors.json");

fn vectors() -> Value {
    serde_json::from_str(VECTORS).unwrap()
}

fn coord_key(v: &Value) -> String {
    let a = v.as_array().unwrap();
    format!("{},{}", a[0].as_i64().unwrap(), a[1].as_i64().unwrap())
}

fn key_list(v: &Value) -> Vec<String> {
    v.as_array().unwrap().iter().map(coord_key).collect()
}

fn map_of(s: &Value) -> vm::MapViewDto {
    let hexes: Vec<vm::HexStaticDto> = s["hexes"]
        .as_array()
        .unwrap()
        .iter()
        .map(|h| vm::HexStaticDto {
            coord: vm::HexCoord::new(
                i32::try_from(h[0].as_i64().unwrap()).unwrap(),
                i32::try_from(h[1].as_i64().unwrap()).unwrap(),
            ),
            teren_bazowy: serde_json::from_value(h[2].clone()).unwrap(),
            rzeka_krawedzie: vec![],
        })
        .collect();
    let height = u32::try_from(hexes.iter().map(|h| h.coord.r).max().unwrap() + 1).unwrap();
    let width = u32::try_from(hexes.len()).unwrap() / height;
    let map = vm::MapViewDto {
        width,
        height,
        seed: 0.0,
        hexes,
        rivers: vec![],
        river_render_paths: vec![],
    };
    vm::validate_map(&map).unwrap();
    map
}

fn sorted_keys<'a>(it: impl IntoIterator<Item = &'a String>) -> Vec<String> {
    let mut v: Vec<String> = it.into_iter().cloned().collect();
    v.sort_by_key(|k| {
        let (q, r) = k.split_once(',').unwrap();
        (r.parse::<i32>().unwrap(), q.parse::<i32>().unwrap())
    });
    v
}

/// `"q,r"` of every hex in `fog.explored` (`explored` of `setFog`), sorted
/// `r`-major like the generator.
fn explored_keys(map: &vm::MapViewDto, fog: &FogSets) -> Vec<String> {
    map.hexes
        .iter()
        .zip(&fog.prism_hidden)
        .filter(|(_, &hidden)| !hidden)
        .map(|(h, _)| format!("{},{}", h.coord.q, h.coord.r))
        .collect()
}

struct Outcome {
    land_reveal: usize,
    river_keys: usize,
    reveal_decides_river: usize,
    copy_rejected: usize,
    no_options: usize,
}

#[test]
fn reveal_matches_pinned_web_vectors() {
    let v = vectors();
    assert_eq!(v["pin"], "07d2fbd72");
    let scenarios = v["scenarios"].as_array().unwrap();
    assert!(
        scenarios.len() >= 20,
        "too few scenarios: {}",
        scenarios.len()
    );
    let mut o = Outcome {
        land_reveal: 0,
        river_keys: 0,
        reveal_decides_river: 0,
        copy_rejected: 0,
        no_options: 0,
    };
    for s in scenarios {
        let name = s["name"].as_str().unwrap();
        let map = map_of(s);
        let fog_dto: vm::FogViewDto = serde_json::from_value(s["dto"]["fog"].clone()).unwrap();
        let fog_active = s["dto"]["fogActive"].as_bool().unwrap();
        let reveal_dto: FogRevealDto = serde_json::from_value(s["dto"]["reveal"].clone()).unwrap();
        // Fog off: `setFog(ALL_KEYS, ALL_KEYS)` without options
        // (`main.ts:13506`), `startRevealKeysForRiverFog()` is not called, so
        // the producer sends `null` (R-RUSTPORT-P4-1-L12-FOGOFF-VEC-R1).
        if !fog_active {
            assert_eq!(
                reveal_dto.river_reveal_keys, None,
                "{name}: riverRevealKeys with the fog off"
            );
        }
        let fog = FogSets::from_dto(&map, &fog_dto, fog_active).unwrap();
        let reveal =
            FogReveal::from_dto(&map, &fog, &reveal_dto).unwrap_or_else(|e| panic!("{name}: {e}"));

        // `setFog(visible, explored, …)`.
        let web = &s["web"];
        assert_eq!(
            sorted_keys(&fog.visible_keys),
            key_list(&web["setFog"]["visible"]),
            "{name}: visible"
        );
        assert_eq!(
            explored_keys(&map, &fog),
            key_list(&web["setFog"]["explored"]),
            "{name}: explored"
        );
        // `scene.ts:3531-3532`: options as the scene reads them.
        let scene = &web["scene"];
        assert_eq!(
            reveal.land_reveal,
            scene["landReveal"].as_bool().unwrap(),
            "{name}: landReveal"
        );
        let want_keys =
            (!scene["riverRevealKeys"].is_null()).then(|| key_list(&scene["riverRevealKeys"]));
        assert_eq!(
            reveal.river_reveal_keys.as_ref().map(sorted_keys),
            want_keys,
            "{name}: riverRevealKeys"
        );
        if web["setFog"]["nargs"].as_u64().unwrap() == 2 {
            o.no_options += 1;
            assert!(!reveal.land_reveal && reveal.river_reveal_keys.is_none());
        }
        assert_eq!(
            reveal.show_ocean_backdrop(&fog),
            scene["showOceanBackdrop"].as_bool().unwrap(),
            "{name}: showOceanBackdrop"
        );
        let river_fog = reveal.river_fog_active(&fog);
        assert_eq!(
            river_fog,
            scene["riverFogActive"].as_bool().unwrap(),
            "{name}: lastAnyHidden"
        );
        // Merged river entries (`scene.ts:3431-3433`, `riverLod.ts:359-377`).
        let explored: HashSet<String> = explored_keys(&map, &fog).into_iter().collect();
        let visible = &fog.visible_keys;
        let is_hidden = |k: &str| !visible.contains(k) && !explored.contains(k);
        for (i, r) in web["rivers"].as_array().unwrap().iter().enumerate() {
            let keys: Vec<String> = r["keys"]
                .as_array()
                .unwrap()
                .iter()
                .map(|k| k.as_str().unwrap().to_owned())
                .collect();
            let got = merged_river_visible_in_fog(
                river_fog,
                reveal.river_reveal_keys.as_ref(),
                &is_hidden,
                keys.iter().map(String::as_str),
            );
            assert_eq!(
                got,
                r["visible"].as_bool().unwrap(),
                "{name}: river {i} {keys:?}"
            );
            let without = merged_river_visible_in_fog(
                river_fog,
                None,
                &is_hidden,
                keys.iter().map(String::as_str),
            );
            if got != without {
                o.reveal_decides_river += 1;
            }
        }
        if reveal.land_reveal {
            o.land_reveal += 1;
        }
        if reveal.river_reveal_keys.is_some() {
            o.river_keys += 1;
        }

        // Mutation (c) as a producer bug: raw `explored` instead of
        // `exploredForRender`. Rejected exactly when it differs.
        let copy: vm::FogViewDto =
            serde_json::from_value(serde_json::json!({ "state": s["exploredCopyState"] })).unwrap();
        let copy_fog = FogSets::from_dto(&map, &copy, fog_active).unwrap();
        let copy_res = FogReveal::from_dto(&map, &copy_fog, &reveal_dto);
        let differs = s["exploredCopyDiffers"].as_bool().unwrap();
        assert_eq!(
            matches!(copy_res, Err(FogRevealError::RevealNotApplied { .. })),
            differs,
            "{name}: explored copy {copy_res:?}"
        );
        if differs {
            o.copy_rejected += 1;
        }
    }
    // Coverage: every branch the mutations of the dispatch touch is reached.
    assert!(
        o.land_reveal >= 8,
        "landReveal scenarios: {}",
        o.land_reveal
    );
    assert!(
        o.river_keys >= 8,
        "riverRevealKeys scenarios: {}",
        o.river_keys
    );
    assert!(
        o.reveal_decides_river >= 5,
        "rivers decided by riverRevealKeys: {}",
        o.reveal_decides_river
    );
    assert!(o.copy_rejected >= 5, "explored copies: {}", o.copy_rejected);
    assert!(o.no_options >= 2, "fog-off scenarios: {}", o.no_options);
}

fn tiny_map() -> vm::MapViewDto {
    let ter = [
        vm::Terrain::Laka,
        vm::Terrain::Morze,
        vm::Terrain::PlytkieMorze,
        vm::Terrain::Gory,
    ];
    vm::MapViewDto {
        width: 2,
        height: 2,
        seed: 0.0,
        hexes: (0..4)
            .map(|i| vm::HexStaticDto {
                coord: vm::HexCoord::new(i % 2, i / 2),
                teren_bazowy: ter[usize::try_from(i).unwrap()],
                rzeka_krawedzie: vec![],
            })
            .collect(),
        rivers: vec![],
        river_render_paths: vec![],
    }
}

fn fog_of(codes: [u8; 4]) -> vm::FogViewDto {
    serde_json::from_value(serde_json::json!({ "state": codes })).unwrap()
}

#[test]
fn reveal_without_active_fog_is_rejected() {
    let map = tiny_map();
    let fog = FogSets::from_dto(&map, &fog_of([2, 2, 2, 2]), false).unwrap();
    let dto = FogRevealDto {
        reveal_all_land: true,
        river_reveal_keys: None,
    };
    assert_eq!(
        FogReveal::from_dto(&map, &fog, &dto),
        Err(FogRevealError::RevealWithoutFog)
    );
}

#[test]
fn fog_off_drops_the_river_keys() {
    // `setFog(ALL_KEYS, ALL_KEYS)` has no options (`main.ts:13506`).
    let map = tiny_map();
    let fog = FogSets::from_dto(&map, &fog_of([2, 2, 2, 2]), false).unwrap();
    let dto = FogRevealDto {
        reveal_all_land: false,
        river_reveal_keys: Some(vec![vm::HexCoord::new(0, 0)]),
    };
    let r = FogReveal::from_dto(&map, &fog, &dto).unwrap();
    assert!(!r.land_reveal);
    assert_eq!(r.river_reveal_keys, None);
    assert!(r.show_ocean_backdrop(&fog));
    assert!(!r.river_fog_active(&fog));
}

#[test]
fn reveal_requires_every_non_sea_hex_explored() {
    let map = tiny_map();
    let dto = FogRevealDto {
        reveal_all_land: true,
        river_reveal_keys: None,
    };
    // `Morze` (index 1) may stay unexplored; `PlytkieMorze` (index 2) may not
    // (`isRevealLandTeren` is `t !== Morze`).
    let ok = FogSets::from_dto(&map, &fog_of([2, 0, 1, 1]), true).unwrap();
    let r = FogReveal::from_dto(&map, &ok, &dto).unwrap();
    assert!(r.land_reveal);
    assert!(r.show_ocean_backdrop(&ok), "landReveal shows the ocean");
    assert!(
        !r.river_fog_active(&ok),
        "landReveal turns the river fog off"
    );
    let bad = FogSets::from_dto(&map, &fog_of([2, 0, 0, 1]), true).unwrap();
    assert_eq!(
        FogReveal::from_dto(&map, &bad, &dto),
        Err(FogRevealError::RevealNotApplied {
            hex: vm::HexCoord::new(0, 1)
        })
    );
}

#[test]
fn river_key_outside_the_map_is_rejected() {
    let map = tiny_map();
    let fog = FogSets::from_dto(&map, &fog_of([2, 0, 0, 0]), true).unwrap();
    let dto = FogRevealDto {
        reveal_all_land: false,
        river_reveal_keys: Some(vec![vm::HexCoord::new(0, 0), vm::HexCoord::new(5, 5)]),
    };
    assert_eq!(
        FogReveal::from_dto(&map, &fog, &dto),
        Err(FogRevealError::RiverKeyOutsideMap {
            hex: vm::HexCoord::new(5, 5)
        })
    );
}

#[test]
fn empty_river_keys_stay_distinct_from_none() {
    // An empty JS `Set` is truthy: `mergedRiverVisibleInFog` takes the reveal
    // branch and hides a river whose every hex is hidden.
    let map = tiny_map();
    let fog = FogSets::from_dto(&map, &fog_of([2, 0, 0, 0]), true).unwrap();
    let dto = FogRevealDto {
        reveal_all_land: false,
        river_reveal_keys: Some(vec![]),
    };
    let r = FogReveal::from_dto(&map, &fog, &dto).unwrap();
    assert_eq!(r.river_reveal_keys, Some(HashSet::new()));
}

#[test]
fn reveal_dto_json_is_strict_camel_case() {
    let dto = FogRevealDto {
        reveal_all_land: true,
        river_reveal_keys: Some(vec![vm::HexCoord::new(-1, 2)]),
    };
    let text = serde_json::to_string(&dto).unwrap();
    assert_eq!(
        text,
        r#"{"revealAllLand":true,"riverRevealKeys":[{"q":-1,"r":2}]}"#
    );
    assert_eq!(serde_json::from_str::<FogRevealDto>(&text).unwrap(), dto);
    let none = r#"{"revealAllLand":false,"riverRevealKeys":null}"#;
    assert_eq!(
        serde_json::from_str::<FogRevealDto>(none).unwrap(),
        FogRevealDto {
            reveal_all_land: false,
            river_reveal_keys: None
        }
    );
    assert!(serde_json::from_str::<FogRevealDto>(
        r#"{"revealAllLand":false,"riverRevealKeys":null,"x":1}"#
    )
    .is_err());
}
