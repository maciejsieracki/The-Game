//! R-RUSTPORT-P4-1-R2-DECOR-PLACEMENT: forest / jungle placement per hex and
//! its hide state (`renderer::decor::placement`), R2 of
//! `P4-1G-ADAPTER-ROZPOZNANIE.md` §4.
//!
//! Fixture `tests/fixtures/decor_placement/scene.json` (map 3×20): forest
//! hexes on temperate, tropical and arid rows, one forest on shallow sea,
//! two cities, a wonder and a wonder ruin on forest, unit hexes and fog.
//!
//! Sources of the expected values (pin `07d2fbd72`, `gra/src/**`):
//! - V1 placement condition `hex.nakladka === Nakladka.Las &&
//!   isDryLandTeren(t)` (`render/scene.ts:2348`);
//! - V2 jungle when `isWarmJungleForestHex(q, r, map.wysokoscR)`
//!   (`render/scene.ts:2354`), variant `wariantDjungliDlaHeksa(q, r, NDJ,
//!   map.seed)` and yaw `rotacjaDjungliDlaHeksa` (`:2355-2356`); forest
//!   variant `wariantLasuDlaHeksa(q, r, NL_NATURAL = 4, map.seed)` and yaw
//!   `rotacjaLasuDlaHeksa` (`:2365-2366`, `NL_NATURAL` `:1719`);
//! - V3 position `(x, vis.height + vis.yOffset, z)`, scale 1
//!   (`render/scene.ts:2349`, `:2352-2353`);
//! - V4 order: instances appended per variant layer (`lasIdx[v]++`,
//!   `djunglaIdx[v]++`, `:2357-2373`) while iterating
//!   `Object.values(map.hexes)` (`:1727`, r-major DTO order);
//! - V5 `hideDecorAtHex` for every placed wonder (`main.ts:4312`), finished
//!   wonder site (`main.ts:5264`) and city (`main.ts:16158`, `:16211`);
//!   permanent (`render/scene.ts:3172-3174`, `:3424-3427`);
//! - V6 `syncForestForUnits` replaces the unit set, skipping decor-hidden
//!   hexes (`render/scene.ts:3164-3170`); `hideDecorAtHex` removes the hex
//!   from it (`:3173`);
//! - V7 `applyLasFog`: `ZERO_MATRIX` when `bri <= 0 || forestHidden(k)`,
//!   otherwise the original matrix and colour `bri`
//!   (`render/scene.ts:3307-3328`, `forestHidden` `:3259-3260`,
//!   `fogBrightnessForHex` `render/fogDim.ts:16-26`).

use std::collections::{HashMap, HashSet};

use civ_renderer::decor::forest::{rotacja_lasu_dla_heksa, wariant_lasu_dla_heksa};
use civ_renderer::decor::jungle::{rotacja_djungli_dla_heksa, wariant_djungli_dla_heksa};
use civ_renderer::decor::placement::{
    forest_hexes, place_forests, ForestKind, ForestPlacement, NL_NATURAL,
};
use civ_renderer::decor::style::is_warm_jungle_forest_hex;
use civ_renderer::pick::hex::{axial_to_world, HexCoord as PickHex, HEX_R};
use civ_renderer::pick::three::Vec3;
use civ_renderer::terrain::{instance_matrix, zero_matrix, FOG_EXPLORED_BRIGHTNESS};
use civ_renderer::view::{self, FogSets, ViewAdapterError};
use civ_view_model as vm;
use serde_json::Value;

// ------------------------------------------------------------ fixture

struct Fixture {
    map: vm::MapViewDto,
    state: Vec<vm::HexDynDto>,
    cities: Vec<vm::CityViewDto>,
    wonders: Vec<vm::PlacedWonderDto>,
    units: Vec<PickHex>,
    fog: vm::FogViewDto,
}

fn pair(v: &Value) -> (i32, i32) {
    let a = v.as_array().unwrap();
    (
        i32::try_from(a[0].as_i64().unwrap()).unwrap(),
        i32::try_from(a[1].as_i64().unwrap()).unwrap(),
    )
}

fn qr(v: &Value) -> (i32, i32) {
    (
        i32::try_from(v["q"].as_i64().unwrap()).unwrap(),
        i32::try_from(v["r"].as_i64().unwrap()).unwrap(),
    )
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

fn city(id: u64, hex: vm::HexCoord) -> vm::CityViewDto {
    vm::CityViewDto {
        id: vm::CityId::try_new(id).unwrap(),
        owner_id: player(0),
        hex,
        population: 3.0,
        level: 1.0,
        wall_kind: vm::WallKind::None,
        revolt: false,
        besieged: false,
        fog_visible: true,
        unit_count_on_hex: 0,
        badge: vm::CityBadgeDto {
            city_name: "Ateny".to_owned(),
            population: 3.0,
            defense_tier: 0,
            civ_icon_id: "grecy".to_owned(),
            owner_color: 0x00ff_0000,
            prod_active: false,
            prod_kind: None,
            prod_id: None,
            prod_item_name: None,
            prod_category_label: None,
            prod_paused: false,
            growth_percent: None,
            growth_starving: false,
            resource_warning: false,
            is_city_state: false,
            era: 1.0,
            is_capital: true,
        },
    }
}

fn load() -> Fixture {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/decor_placement/scene.json"
    );
    let j: Value = serde_json::from_str(&std::fs::read_to_string(path).unwrap()).unwrap();
    let w = u32::try_from(j["width"].as_u64().unwrap()).unwrap();
    let h = u32::try_from(j["height"].as_u64().unwrap()).unwrap();
    let mut terrain: HashMap<(i32, i32), vm::Terrain> = HashMap::new();
    for t in j["terrain"].as_array().unwrap() {
        terrain.insert(qr(t), serde_json::from_value(t["t"].clone()).unwrap());
    }
    let forest: HashSet<(i32, i32)> = j["forest"].as_array().unwrap().iter().map(pair).collect();
    let mut fog_code: HashMap<(i32, i32), u8> = HashMap::new();
    for f in j["fog"].as_array().unwrap() {
        fog_code.insert(qr(f), u8::try_from(f["code"].as_u64().unwrap()).unwrap());
    }
    let coords: Vec<(i32, i32)> = (0..i32::try_from(h).unwrap())
        .flat_map(|r| (0..i32::try_from(w).unwrap()).map(move |q| (q, r)))
        .collect();
    let map = vm::MapViewDto {
        width: w,
        height: h,
        seed: j["seed"].as_f64().unwrap(),
        hexes: coords
            .iter()
            .map(|&(q, r)| vm::HexStaticDto {
                coord: vm::HexCoord::new(q, r),
                teren_bazowy: terrain.get(&(q, r)).copied().unwrap_or(vm::Terrain::Laka),
                rzeka_krawedzie: Vec::new(),
            })
            .collect(),
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    };
    vm::validate_map(&map).unwrap();
    let state = coords
        .iter()
        .map(|c| vm::HexDynDto {
            nakladka: if forest.contains(c) {
                vm::Nakladka::Las
            } else {
                vm::Nakladka::Brak
            },
            ulepszenie: vm::Ulepszenie::Brak,
            ulepszenia: None,
            improvement_key: None,
            zloze: None,
            village_present: false,
            terraces: false,
            covering_improvement: false,
            road_mask: 0,
        })
        .collect();
    let cities = j["cities"]
        .as_array()
        .unwrap()
        .iter()
        .enumerate()
        .map(|(i, c)| {
            let (q, r) = pair(c);
            city(u64::try_from(i + 1).unwrap(), vm::HexCoord::new(q, r))
        })
        .collect();
    let wonders = j["wonders"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| {
            let (q, r) = qr(x);
            vm::PlacedWonderDto {
                wonder_id: "piramidy".to_owned(),
                hex: vm::HexCoord::new(q, r),
                owner_id: player(1),
                ruin: x["ruin"].as_bool().unwrap(),
            }
        })
        .collect();
    let units = j["units"]
        .as_array()
        .unwrap()
        .iter()
        .map(|u| {
            let (q, r) = pair(u);
            PickHex::new(q, r)
        })
        .collect();
    let fog = vm::FogViewDto {
        state: coords
            .iter()
            .map(|c| vm::FogState::from_code(fog_code.get(c).copied().unwrap_or(2)).unwrap())
            .collect(),
    };
    Fixture {
        map,
        state,
        cities,
        wonders,
        units,
        fog,
    }
}

fn hx(q: i32, r: i32) -> PickHex {
    PickHex::new(q, r)
}

fn built(f: &Fixture) -> ForestPlacement {
    ForestPlacement::from_dto(&f.map, &f.state, &f.cities, &f.wonders).unwrap()
}

/// Kind of the clump expected on every placed hex (V1, V2): the fixture rows
/// 2, 10, 15 are not tropical, rows 6, 13 are; (1,0) is shallow sea.
fn expected_kinds() -> Vec<(PickHex, ForestKind)> {
    vec![
        (hx(0, 2), ForestKind::Las),
        (hx(1, 2), ForestKind::Las),
        (hx(0, 6), ForestKind::Djungla),
        (hx(2, 6), ForestKind::Djungla),
        (hx(1, 10), ForestKind::Las),
        (hx(2, 10), ForestKind::Las),
        (hx(0, 13), ForestKind::Djungla),
        (hx(1, 13), ForestKind::Djungla),
        (hx(2, 13), ForestKind::Djungla),
        (hx(0, 15), ForestKind::Las),
    ]
}

fn state_of(p: &ForestPlacement, hex: PickHex, fog: Option<&FogSets>) -> (Option<f64>, [f32; 16]) {
    for layer in p.layers() {
        let states = p.apply_las_fog(layer, fog);
        if let Some(i) = layer.hexes.iter().position(|&h| h == hex) {
            return (states[i].brightness, states[i].matrix);
        }
    }
    panic!("no instance on {hex:?}");
}

// ------------------------------------------------------------ placement

#[test]
fn climate_rows_of_the_fixture() {
    // Precondition of V2 (`mapRenderStyle.ts:772-774`): the rows chosen in the
    // fixture fall into the zones the expectations assume.
    for (r, warm) in [(2, false), (6, true), (10, false), (13, true), (15, false)] {
        assert_eq!(is_warm_jungle_forest_hex(r, 20.0), warm, "row {r}");
    }
}

#[test]
fn instance_count_and_kind_per_hex() {
    let f = load();
    let p = built(&f);
    // V1: 11 forest hexes, (1,0) is `plytkie_morze` → 10 instances; hidden
    // hexes keep their instance (`hideInstancedOnHex` zeroes, `:3149-3161`).
    assert_eq!(p.instance_count(), 10);
    assert_eq!(p.las.len(), 5);
    assert_eq!(p.djungla.len(), 5);
    assert_eq!(p.las.iter().map(|l| l.hexes.len()).sum::<usize>(), 5);
    assert_eq!(p.djungla.iter().map(|l| l.hexes.len()).sum::<usize>(), 5);
    // `NL_NATURAL = 4`: layer 4 (clearing) is empty at build (`:1717-1719`).
    assert_eq!(NL_NATURAL, 4);
    assert!(p.las[4].hexes.is_empty());
    let placed: HashMap<PickHex, ForestKind> = p
        .layers()
        .flat_map(|l| l.hexes.iter().map(move |h| (*h, l.kind)))
        .collect();
    assert_eq!(placed.len(), 10, "one clump per hex");
    assert!(!placed.contains_key(&hx(1, 0)), "no clump on shallow sea");
    for (h, k) in expected_kinds() {
        assert_eq!(placed.get(&h), Some(&k), "kind on {h:?}");
    }
}

#[test]
fn variant_and_matrix_follow_the_pin_formula() {
    let f = load();
    let p = built(&f);
    let seed = view::seed_i32(f.map.seed);
    let terrain: HashMap<PickHex, civ_renderer::pick::terrain::Terrain> = f
        .map
        .hexes
        .iter()
        .map(|h| (view::pick_hex(h.coord), view::terrain(h.teren_bazowy)))
        .collect();
    for layer in p.layers() {
        assert_eq!(layer.hexes.len(), layer.matrices.len());
        for (h, m) in layer.hexes.iter().zip(&layer.matrices) {
            // V2: variant + yaw.
            let (v, yaw) = match layer.kind {
                ForestKind::Las => (
                    wariant_lasu_dla_heksa(h.q, h.r, NL_NATURAL, seed),
                    rotacja_lasu_dla_heksa(h.q, h.r, seed),
                ),
                ForestKind::Djungla => (
                    wariant_djungli_dla_heksa(h.q, h.r, 5, seed),
                    rotacja_djungli_dla_heksa(h.q, h.r, seed),
                ),
            };
            assert_eq!(layer.variant, v, "variant on {h:?}");
            // V3: (x, vis.height + vis.yOffset, z).
            let (x, z) = axial_to_world(*h, HEX_R);
            let want = instance_matrix(Vec3::new(x, terrain[h].top_y(), z), yaw);
            assert_eq!(
                m.map(f32::to_bits),
                want.map(f32::to_bits),
                "matrix on {h:?}"
            );
        }
    }
}

#[test]
fn instance_order_is_dto_order_per_layer() {
    let f = load();
    let p = built(&f);
    let width = i32::try_from(f.map.width).unwrap();
    let idx = |h: &PickHex| h.r * width + h.q;
    // V4: the expected layer content is the fixture forest list in DTO
    // (r-major) order, filtered by kind and variant.
    let seed = view::seed_i32(f.map.seed);
    let variant = |k: ForestKind, h: &PickHex| match k {
        ForestKind::Las => wariant_lasu_dla_heksa(h.q, h.r, NL_NATURAL, seed),
        ForestKind::Djungla => wariant_djungli_dla_heksa(h.q, h.r, 5, seed),
    };
    let kinds = expected_kinds();
    let mut multi = 0;
    for layer in p.layers() {
        let want: Vec<PickHex> = kinds
            .iter()
            .filter(|(h, k)| *k == layer.kind && variant(*k, h) == layer.variant)
            .map(|(h, _)| *h)
            .collect();
        assert_eq!(
            layer.hexes, want,
            "{:?} variant {}",
            layer.kind, layer.variant
        );
        for w in layer.hexes.windows(2) {
            assert!(idx(&w[0]) < idx(&w[1]), "order {:?}", layer.hexes);
        }
        if layer.hexes.len() >= 2 {
            multi += 1;
        }
    }
    // 5 forest clumps in 4 natural variants: at least one layer holds two
    // instances, so a reversed order cannot pass.
    assert!(multi >= 1, "fixture must put two instances in one layer");
}

// ------------------------------------------------------------ hides

#[test]
fn city_and_wonder_hexes_hide_their_clump() {
    let f = load();
    let p = built(&f);
    // V5: cities (2,10) (forest) and (0,1) (no forest); wonder (0,13) and
    // ruin (1,13) (both forest).
    for h in [hx(2, 10), hx(0, 1), hx(0, 13), hx(1, 13)] {
        assert!(p.is_decor_hidden(h), "{h:?}");
    }
    let hidden: HashSet<PickHex> = view::solid_hidden_hexes(&f.cities, &f.wonders);
    for layer in p.layers() {
        for h in &layer.hexes {
            assert_eq!(p.is_decor_hidden(*h), hidden.contains(h), "{h:?}");
        }
    }
    // V7: zero matrix, colour untouched.
    for h in [hx(2, 10), hx(0, 13), hx(1, 13)] {
        assert_eq!(state_of(&p, h, None), (None, zero_matrix()), "{h:?}");
    }
    for h in [
        hx(0, 2),
        hx(1, 2),
        hx(0, 6),
        hx(2, 6),
        hx(1, 10),
        hx(2, 13),
        hx(0, 15),
    ] {
        assert_eq!(state_of(&p, h, None).0, Some(1.0), "{h:?}");
    }
}

#[test]
fn units_hide_the_forest_under_them() {
    let f = load();
    let mut p = built(&f);
    p.sync_forest_for_units(f.units.iter().copied());
    // V6: (0,2) forest under a unit; (2,10) is a city hex → not in the unit
    // set; (1,1) has no forest but is in the set.
    assert!(p.is_unit_forest_hidden(hx(0, 2)));
    assert!(!p.is_unit_forest_hidden(hx(2, 10)));
    assert!(p.is_unit_forest_hidden(hx(1, 1)));
    assert_eq!(state_of(&p, hx(0, 2), None), (None, zero_matrix()));
    let visible: HashSet<(ForestKind, PickHex)> = p
        .visible_instances(None)
        .into_iter()
        .map(|(k, _, h)| (k, h))
        .collect();
    let want: HashSet<(ForestKind, PickHex)> = [
        (ForestKind::Las, hx(1, 2)),
        (ForestKind::Las, hx(1, 10)),
        (ForestKind::Las, hx(0, 15)),
        (ForestKind::Djungla, hx(0, 6)),
        (ForestKind::Djungla, hx(2, 6)),
        (ForestKind::Djungla, hx(2, 13)),
    ]
    .into_iter()
    .collect();
    assert_eq!(visible, want);
    // The unit set is replaced, not merged: the forest comes back.
    p.sync_forest_for_units([hx(1, 2)]);
    assert!(!p.is_unit_forest_hidden(hx(0, 2)));
    assert_eq!(state_of(&p, hx(0, 2), None).0, Some(1.0));
    assert_eq!(state_of(&p, hx(1, 2), None), (None, zero_matrix()));
}

#[test]
fn hide_decor_moves_hex_out_of_the_unit_set_for_good() {
    let f = load();
    let mut p = built(&f);
    p.sync_forest_for_units([hx(1, 10)]);
    assert!(p.is_unit_forest_hidden(hx(1, 10)));
    // V6/V5: `unitForestHiddenHexKeys.delete` + `decorHiddenHexKeys.add`.
    p.hide_decor_at_hex(hx(1, 10));
    assert!(!p.is_unit_forest_hidden(hx(1, 10)));
    assert!(p.is_decor_hidden(hx(1, 10)));
    // Permanent: an empty unit sync does not bring it back.
    p.sync_forest_for_units(std::iter::empty());
    assert!(p.forest_hidden(hx(1, 10)));
    assert_eq!(state_of(&p, hx(1, 10), None), (None, zero_matrix()));
}

// ------------------------------------------------------------ fog

#[test]
fn fog_dims_explored_and_hides_unexplored() {
    let f = load();
    let p = built(&f);
    let fog = FogSets::from_dto(&f.map, &f.fog, true).unwrap();
    // V7: (0,6) explored → FOG_EXPLORED_BRIGHTNESS; (0,15) unexplored → zero.
    assert_eq!(
        state_of(&p, hx(0, 6), Some(&fog)).0,
        Some(FOG_EXPLORED_BRIGHTNESS)
    );
    assert_eq!(state_of(&p, hx(0, 15), Some(&fog)), (None, zero_matrix()));
    assert_eq!(state_of(&p, hx(1, 2), Some(&fog)).0, Some(1.0));
    // City under fog stays hidden.
    assert_eq!(state_of(&p, hx(2, 10), Some(&fog)), (None, zero_matrix()));
    // Fog off (`setFog(ALL_KEYS, ALL_KEYS)`, `main.ts:13506`): full brightness.
    let off = FogSets::from_dto(&f.map, &f.fog, false).unwrap();
    assert_eq!(state_of(&p, hx(0, 15), Some(&off)).0, Some(1.0));
}

#[test]
fn hex_state_length_mismatch_is_an_error() {
    let f = load();
    let short = &f.state[..f.state.len() - 1];
    assert_eq!(
        forest_hexes(&f.map, short),
        Err(ViewAdapterError::LengthMismatch {
            field: "hex_state",
            expected: 60,
            actual: 59,
        })
    );
    // Direct placement agrees with `from_dto` before the hides.
    let hexes = forest_hexes(&f.map, &f.state).unwrap();
    let direct = place_forests(view::seed_i32(f.map.seed), f.map.height, &hexes);
    assert_eq!(direct.las, built(&f).las);
    assert_eq!(direct.djungla, built(&f).djungla);
}
