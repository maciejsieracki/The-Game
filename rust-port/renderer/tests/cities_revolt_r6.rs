//! `R-RUSTPORT-P4-1-R6-REVOLT-COUNT`: the revolt sprite and the unit count
//! of a city hex (`renderer/src/cities/revolt/`), DTO → `CityRenderer` →
//! revolt layer.
//!
//! Expected values come from `tests/fixtures/cities_revolt/r6_vectors.json`,
//! copied by hand from pin `07d2fbd72` (each value names its
//! `render/cities.ts` / `main.ts` line); the hex placement uses
//! `axial_to_world` / `terrain_top_y`, already checked against web vectors
//! in `tests/cities_web_parity.rs` and `tests/pick_golden.rs`.

#![allow(clippy::float_cmp)]

use std::path::PathBuf;

use civ_renderer::cities::revolt::{RevoltCityInput, RevoltInputs, RevoltRenderer};
use civ_renderer::geom::Vec3;
use civ_renderer::models::cities::renderer::{terrain_top_y, CityRenderer, RenderedCity};
use civ_renderer::pick::hex::{axial_to_world, HexCoord, HEX_R};
use civ_renderer::scene::{NodeKind, Scene, Texture, ROOT};
use civ_renderer::view::{self, CityInputs};
use civ_view_model as vm;
use serde_json::Value;

// ------------------------------------------------------------ fixture

fn vectors() -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/cities_revolt/r6_vectors.json");
    serde_json::from_str(&std::fs::read_to_string(p).expect("fixture")).expect("json")
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("number")
}

fn vec3(v: &Value) -> [f64; 3] {
    let a = v.as_array().expect("array");
    [num(&a[0]), num(&a[1]), num(&a[2])]
}

#[derive(Debug, Clone)]
struct FixtureCity {
    id: u64,
    q: i32,
    r: i32,
    terrain: vm::Terrain,
    revolt: bool,
    unit_count: u32,
}

fn terrain_of(s: &str) -> vm::Terrain {
    match s {
        "Laka" => vm::Terrain::Laka,
        "Wzgorza" => vm::Terrain::Wzgorza,
        "Pustynia" => vm::Terrain::Pustynia,
        "Rownina" => vm::Terrain::Rownina,
        other => panic!("terrain {other} not in the fixture vocabulary"),
    }
}

fn fixture_cities(v: &Value) -> Vec<FixtureCity> {
    v["cities"]
        .as_array()
        .expect("cities")
        .iter()
        .map(|c| FixtureCity {
            id: c["id"].as_u64().expect("id"),
            q: i32::try_from(c["q"].as_i64().expect("q")).expect("q i32"),
            r: i32::try_from(c["r"].as_i64().expect("r")).expect("r i32"),
            terrain: terrain_of(c["terrain"].as_str().expect("terrain")),
            revolt: c["revolt"].as_bool().expect("revolt"),
            unit_count: u32::try_from(c["unitCount"].as_u64().expect("unitCount")).expect("u32"),
        })
        .collect()
}

const ME: u64 = 0;

fn me() -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(ME).unwrap())
}

/// 4 × 3 map, every hex meadow except the fixture city hexes.
fn map(cities: &[FixtureCity]) -> vm::MapViewDto {
    let mut hexes = Vec::new();
    for r in 0..3 {
        for q in 0..4 {
            let t = cities
                .iter()
                .find(|c| c.q == q && c.r == r)
                .map_or(vm::Terrain::Laka, |c| c.terrain);
            hexes.push(vm::HexStaticDto {
                coord: vm::HexCoord::new(q, r),
                teren_bazowy: t,
                rzeka_krawedzie: Vec::new(),
            });
        }
    }
    vm::MapViewDto {
        width: 4,
        height: 3,
        seed: 0.0,
        hexes,
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

fn owners() -> Vec<vm::OwnerViewDto> {
    vec![vm::OwnerViewDto {
        owner_id: me(),
        color: 0x001e_88e5,
        civ_icon_id: "rzymianie".to_owned(),
        bronze_civ: "rzym".to_owned(),
        era: 2.0,
        is_city_state: false,
        is_barbarian: false,
        ring_hex: Some("#1e88e5".to_owned()),
        display_name: None,
        map_outline_kind: None,
        capital_city_id: None,
        relation_to_viewer: vm::RelationToViewer::Neutralni,
    }]
}

fn badge() -> vm::CityBadgeDto {
    vm::CityBadgeDto {
        city_name: "Roma".to_owned(),
        population: 3.0,
        defense_tier: 0,
        civ_icon_id: "rzymianie".to_owned(),
        owner_color: 0x001e_88e5,
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
        era: 2.0,
        is_capital: false,
    }
}

fn city_dto(c: &FixtureCity) -> vm::CityViewDto {
    vm::CityViewDto {
        id: vm::CityId::try_new(c.id).unwrap(),
        owner_id: me(),
        hex: vm::HexCoord::new(c.q, c.r),
        population: 3.0,
        level: 3.0,
        wall_kind: vm::WallKind::None,
        revolt: c.revolt,
        besieged: false,
        fog_visible: true,
        unit_count_on_hex: c.unit_count,
        badge: badge(),
    }
}

/// `cityRenderer.sync(cities, _cityRenderOpts())` then the revolt calls of
/// the same `sync` (`render/cities.ts:541`, `:586`, `:597-599`).
fn frame(
    dtos: &[vm::CityViewDto],
    cities: &mut CityRenderer,
    revolt: &mut RevoltRenderer,
) -> RevoltInputs {
    let inputs = CityInputs::from_dto(&owners(), dtos).expect("city inputs");
    inputs.sync(cities);
    let r = RevoltInputs::from_dto(dtos);
    revolt.sync(&r, cities);
    r
}

fn setup() -> (Value, Vec<FixtureCity>, Vec<vm::CityViewDto>, CityRenderer) {
    let v = vectors();
    let fc = fixture_cities(&v);
    let dtos: Vec<_> = fc.iter().map(city_dto).collect();
    let renderer = view::city_renderer(&map(&fc));
    (v, fc, dtos, renderer)
}

fn group(r: &CityRenderer, id: u64) -> &RenderedCity {
    r.city(&id.to_string()).expect("city group")
}

fn sprite_nodes(s: &Scene) -> Vec<usize> {
    s.traverse()
        .into_iter()
        .filter(|&i| matches!(s.nodes[i].kind, NodeKind::Sprite(_)))
        .collect()
}

// ------------------------------------------------------------ tests

/// `_syncRevolt(city.id, group, getRevolt(city.id))`
/// (`render/cities.ts:586`, `:815-831`): a sprite exactly for the cities
/// with `revolt == true` (fixture ids 11, 13); none for 12, 14
/// (`:816-818`). Mutation (a) target.
#[test]
fn revolt_sprite_exists_only_for_revolt_true() {
    let (_, fc, dtos, mut cities) = setup();
    let mut revolt = RevoltRenderer::new();
    let inputs = frame(&dtos, &mut cities, &mut revolt);
    for c in &fc {
        let id = c.id.to_string();
        assert_eq!(
            revolt.sprite(&id).is_some(),
            c.revolt,
            "city {id}: sprite iff revolt (render/cities.ts:816-820)"
        );
        let input = inputs.city(&id).expect("input");
        let scene = revolt.city_overlay_scene(input, group(&cities, c.id));
        assert_eq!(
            sprite_nodes(&scene).len(),
            usize::from(c.revolt),
            "city {id}: overlay scene sprites"
        );
    }
    let ids: Vec<&str> = revolt
        .sprites()
        .iter()
        .map(|s| s.city_id.as_str())
        .collect();
    assert_eq!(ids, ["11", "13"], "revoltSprites in Map insertion order");
}

/// Position and scale of the sprite relative to the city hex:
/// local `(0, 1.35, 0)` / `(0.9, 0.9, 1)` (`render/cities.ts:827-828`) under
/// a group at `(x, terrainTopY + CITY_LIFT, z)` with scale 1.38
/// (`:573-574`, `CITY_LIFT = 0.008 * R` `:141`, `CITY_MODEL_SCALE` `:143`).
/// Mutation (c) target.
#[test]
fn revolt_sprite_position_and_scale_relative_to_hex() {
    let (v, fc, dtos, mut cities) = setup();
    let mut revolt = RevoltRenderer::new();
    let inputs = frame(&dtos, &mut cities, &mut revolt);
    let local = vec3(&v["sprite"]["position"]["value"]);
    let scale = vec3(&v["sprite"]["scale"]["value"]);
    let lift = num(&v["cityLiftFactor"]["value"]) * HEX_R;
    let model_scale = num(&v["cityModelScale"]["value"]);
    let mut checked = 0;
    for c in fc.iter().filter(|c| c.revolt) {
        let id = c.id.to_string();
        let grp = group(&cities, c.id);
        let s = revolt.sprite(&id).expect("sprite");
        assert_eq!(
            [s.position.x, s.position.y, s.position.z],
            local,
            "city {id}: sprite.position (render/cities.ts:828)"
        );
        assert_eq!(
            [s.scale.x, s.scale.y, s.scale.z],
            scale,
            "city {id}: sprite.scale (render/cities.ts:827)"
        );

        let (x, z) = axial_to_world(HexCoord::new(c.q, c.r), HEX_R);
        let top = terrain_top_y(view::terrain(c.terrain));
        let want = Vec3::new(
            x + local[0] * model_scale,
            top + lift + local[1] * model_scale,
            z + local[2] * model_scale,
        );
        let got = s.world_position(grp);
        for (g, w, axis) in [
            (got.x, want.x, "x"),
            (got.y, want.y, "y"),
            (got.z, want.z, "z"),
        ] {
            assert!(
                (g - w).abs() <= 1e-12,
                "city {id} world {axis}: got {g}, want {w} (render/cities.ts:573-574, :828)"
            );
        }

        // The same position through the exported overlay scene
        // (`matrixWorld` of the sprite child of the group root).
        let input = inputs.city(&id).expect("input");
        let scene = revolt.city_overlay_scene(input, grp);
        let sp = sprite_nodes(&scene);
        assert_eq!(sp.len(), 1);
        let world = scene.world_matrices(None);
        let p = Vec3::new(0.0, 0.0, 0.0).apply_mat4(&world[sp[0]]);
        assert!((p.x - want.x).abs() <= 1e-12, "scene world x {}", p.x);
        assert!((p.y - want.y).abs() <= 1e-12, "scene world y {}", p.y);
        assert!((p.z - want.z).abs() <= 1e-12, "scene world z {}", p.z);
        let n = &scene.nodes[sp[0]];
        assert_eq!([n.scale.x, n.scale.y, n.scale.z], scale);
        assert_eq!(
            n.parent,
            Some(ROOT),
            "parent.add(sprite) (render/cities.ts:829)"
        );
        checked += 1;
    }
    assert_eq!(checked, 2, "two revolt cities in the fixture");
}

/// `new THREE.SpriteMaterial({ map: _revoltTexture(), transparent: true,
/// depthTest: false })` (`render/cities.ts:821-825`) and the texture of
/// `_revoltTexture` (`:794-800`).
#[test]
fn revolt_material_and_texture_match_pin() {
    let (v, _, dtos, mut cities) = setup();
    let mut revolt = RevoltRenderer::new();
    frame(&dtos, &mut cities, &mut revolt);
    let m = &v["sprite"]["material"];
    let t = &v["sprite"]["texture"];
    let s = revolt.sprite("11").expect("sprite");
    assert_eq!(s.material.kind.three_type(), "SpriteMaterial");
    assert_eq!(s.material.transparent, m["transparent"].as_bool().unwrap());
    assert_eq!(s.material.depth_test, m["depthTest"].as_bool().unwrap());
    assert_eq!(s.material.depth_write, m["depthWrite"].as_bool().unwrap());
    assert_eq!(s.material.opacity, num(&m["opacity"]));
    assert_eq!(
        u64::from(s.material.hex()),
        m["colorHex"].as_u64().unwrap(),
        "default white"
    );
    let Some(Texture::Glyph(g)) = s.material.map else {
        panic!("map must be the revolt glyph texture");
    };
    assert_eq!(u64::from(g.size), t["size"].as_u64().unwrap());
    assert_eq!(g.font, t["font"].as_str().unwrap());
    assert_eq!(g.glyph.to_string(), t["glyph"].as_str().unwrap());
    assert_eq!(u64::from(g.x), t["x"].as_u64().unwrap());
    assert_eq!(u64::from(g.y), t["y"].as_u64().unwrap());
    // One shared texture (`this.revoltTex`, `:449`, `:792`): both sprites
    // reference the same glyph.
    assert_eq!(
        revolt.sprite("13").unwrap().material.map,
        s.material.map,
        "shared texture"
    );
}

/// `getUnitCountOnHex` is carried from the DTO but read by no pin renderer
/// (`render/cities.ts:345-346`, `main.ts:2971`; fixture `unitCountReaders`
/// = 0): the overlay scene of a city is the same for 0 and for > 0 units
/// and holds no counter node. Mutation (b) target.
#[test]
fn unit_count_is_carried_and_draws_no_counter() {
    let (v, fc, dtos, mut cities) = setup();
    assert_eq!(v["unitCountReaders"]["value"].as_u64(), Some(0));
    let mut revolt = RevoltRenderer::new();
    let inputs = frame(&dtos, &mut cities, &mut revolt);
    for c in &fc {
        let id = c.id.to_string();
        let input = inputs.city(&id).expect("input");
        assert_eq!(
            input.unit_count_on_hex, c.unit_count,
            "city {id}: DTO value"
        );
        let grp = group(&cities, c.id);
        let scene = revolt.city_overlay_scene(input, grp);
        // Root + the revolt sprite (if any); nothing for the count.
        assert_eq!(
            scene.nodes.len(),
            1 + usize::from(c.revolt),
            "city {id}, count {}: no counter node (no pin reader)",
            c.unit_count
        );
        assert_eq!(scene.nodes[ROOT].children.len(), usize::from(c.revolt));
        for count in [0u32, 1, 3, 7, 99] {
            let other = RevoltCityInput {
                unit_count_on_hex: count,
                ..input.clone()
            };
            assert_eq!(
                revolt.city_overlay_scene(&other, grp),
                scene,
                "city {id}: count {count} changes nothing (render/cities.ts:346 never read)"
            );
        }
    }
    // Fixture covers both 0 and > 0 counts, with and without revolt.
    assert!(fc.iter().any(|c| c.unit_count == 0 && c.revolt));
    assert!(fc.iter().any(|c| c.unit_count == 0 && !c.revolt));
    assert!(fc.iter().any(|c| c.unit_count > 0 && c.revolt));
    assert!(fc.iter().any(|c| c.unit_count > 0 && !c.revolt));
}

/// Life cycle of `revoltSprites` (`render/cities.ts:541`, `:551`, `:586`,
/// `:597-599`, `:777`, `:806-831`).
#[test]
fn revolt_sprite_life_cycle_follows_sync() {
    let (_, _, mut dtos, mut cities) = setup();
    let mut revolt = RevoltRenderer::new();
    frame(&dtos, &mut cities, &mut revolt);
    let first_11 = revolt.sprite("11").unwrap().serial;
    let first_13 = revolt.sprite("13").unwrap().serial;

    // Same state again: `if (this.revoltSprites.has(cityId)) return` (`:820`).
    frame(&dtos, &mut cities, &mut revolt);
    assert_eq!(
        revolt.sprite("11").unwrap().serial,
        first_11,
        "kept, not re-created"
    );
    assert_eq!(revolt.sprite("13").unwrap().serial, first_13);

    // Revolt ends: `_removeRevolt` (`:816-818`); revolt starts on 12.
    dtos[0].revolt = false;
    dtos[1].revolt = true;
    frame(&dtos, &mut cities, &mut revolt);
    assert!(
        revolt.sprite("11").is_none(),
        "removed when revolt == false"
    );
    assert!(revolt.sprite("12").is_some(), "added when revolt == true");
    let ids: Vec<&str> = revolt
        .sprites()
        .iter()
        .map(|s| s.city_id.as_str())
        .collect();
    assert_eq!(ids, ["13", "12"], "Map order: delete + set appends");

    // Rebuilt group (new `visualKey`: level 3 → 5): `_removeRevolt(…, grp)`
    // (`:551`) then a new sprite on the new group (`:586`).
    dtos[2].level = 5.0;
    frame(&dtos, &mut cities, &mut revolt);
    let s13 = revolt.sprite("13").unwrap();
    assert_ne!(s13.serial, first_13, "re-created on the rebuilt group");
    assert_eq!(s13.parent_visual_key, group(&cities, 13).visual_key);

    // Fogged group: the sprite stays but is not drawn (child of an
    // invisible group, `:536`, `:580`).
    dtos[2].fog_visible = false;
    frame(&dtos, &mut cities, &mut revolt);
    let s13 = revolt.sprite("13").unwrap();
    assert!(!s13.drawn(group(&cities, 13)));
    let input = RevoltInputs::from_dto(&dtos);
    let scene = revolt.city_overlay_scene(input.city("13").unwrap(), group(&cities, 13));
    assert!(
        !scene.nodes[ROOT].visible,
        "group.visible copied to the overlay root"
    );

    // City leaves the list: `_removeRevolt(id, grp)` (`:597-599`).
    dtos.remove(2);
    frame(&dtos, &mut cities, &mut revolt);
    assert!(revolt.sprite("13").is_none(), "removed with its city");
    assert!(revolt.sprite("12").is_some());

    // `dispose()`: `revoltSprites.clear()` (`:777`).
    revolt.dispose();
    assert!(revolt.sprites().is_empty());
}

/// `RevoltInputs::from_dto` keeps the DTO values and order unchanged
/// (D-DTO-1 = A: the engine computes revolt and count).
#[test]
fn revolt_inputs_from_dto_are_unchanged() {
    let (_, fc, dtos, _) = setup();
    let r = RevoltInputs::from_dto(&dtos);
    assert_eq!(r.cities.len(), fc.len());
    for (got, c) in r.cities.iter().zip(&fc) {
        assert_eq!(got.city_id, c.id.to_string());
        assert_eq!(got.revolt, c.revolt);
        assert_eq!(got.unit_count_on_hex, c.unit_count);
    }
    assert!(r.city("999").is_none());
}
