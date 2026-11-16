//! R3 river ribbons (R-RUSTPORT-P4-1-R3-RIVER-RIBBONS): the Rust `rivers`
//! port against data produced by the **web** code at the pin `07d2fbd72`
//! (`gra/src/render/scene.ts`, three@0.169.0), see
//! `tests/fixtures/rivers/README.md`.
//!
//! The input of every scenario is a `MapViewDto` (contract §3.2) read from
//! the fixture: `hexes[].terenBazowy`, `rivers`, `riverRenderPaths`. The test
//! converts it to renderer inputs itself (no production DTO adapter here —
//! that is the separate `view/` topic). Every `Float32` attribute (position,
//! normal, uv) is compared bit for bit, indices exactly, ribbon points as f64
//! bits.
//!
//! Pin line references (`scene.ts`): water colour `palette.river`
//! (`:2005-2006`, `mapRenderStyle.ts:568`), land ribbons `:1267-1375`,
//! point walk `:1124-1233`, ribbon geometry `:385-460`, mouths `:626-887`
//! and `:2918-2992`, stage filter `:1534-1558`, `riverMouthY` `:2886-2888`.

#![allow(clippy::float_cmp)]

use std::collections::{HashMap, HashSet};
use std::path::PathBuf;

use civ_renderer::core::map_style::{
    river_surface_lift_y, style_scene_palette, MapRenderStyle, FLAT_LAND_SURFACE_Y,
};
use civ_renderer::geom::{Mesh, Vec3};
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::rivers::edges::simplify_river_render_path;
use civ_renderer::rivers::land::{
    build_river_points_from_hex_path, path_reaches_open_sea_render, LandRiverOpts,
};
use civ_renderer::rivers::ribbon::{build_ribbon_geometry, HalfWidth};
use civ_renderer::rivers::{
    build_river_ribbons, render_coastal_mouths, render_land_rivers, river_indices_for_stage,
    river_material, river_mouth_y, RiverEntry, RiverMaterialKind, RiverRibbonError,
    RiverRibbonInput, RiverRibbons, COAST_DELTA_RENDER_ORDER, LAND_RIVER_RENDER_ORDER,
    RIVER_MOUTH_RENDER_ORDER,
};
use civ_renderer::scene::Side;
use civ_renderer::terrain::coast::{river_delta_hexes, TerrainAt};
use civ_renderer::terrain::{RiverKind, RiverPath};
use civ_view_model::{validate_map, MapViewDto};
use serde_json::Value;

// Record counts of the fixture (gen.ts prints them; README.md).
const N_SCENARIOS: usize = 14;
const N_ENTRIES: usize = 274;
const N_POINT_CASES: usize = 20;
const N_RIBBON_CASES: usize = 8;

fn fixture() -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("tests/fixtures/rivers/rivers.json");
    let s = std::fs::read_to_string(&p).unwrap_or_else(|e| panic!("{}: {e}", p.display()));
    serde_json::from_str(&s).expect("rivers.json")
}

fn num(v: &Value) -> f64 {
    v.as_f64()
        .unwrap_or_else(|| panic!("number expected, got {v}"))
}

fn arr(v: &Value) -> &Vec<Value> {
    v.as_array()
        .unwrap_or_else(|| panic!("array expected, got {v}"))
}

fn usize_of(v: &Value) -> usize {
    usize::try_from(v.as_u64().expect("u64")).expect("usize")
}

fn u32s(v: &Value) -> Vec<u32> {
    arr(v)
        .iter()
        .map(|x| u32::try_from(x.as_u64().expect("u32")).expect("u32"))
        .collect()
}

fn strings(v: &Value) -> Vec<String> {
    arr(v)
        .iter()
        .map(|x| x.as_str().expect("str").to_owned())
        .collect()
}

fn coord(v: &Value) -> HexCoord {
    let c = |k: &str| i32::try_from(v[k].as_i64().expect("int")).expect("i32");
    HexCoord::new(c("q"), c("r"))
}

fn parse_key(k: &str) -> HexCoord {
    let (q, r) = k.split_once(',').expect("q,r");
    HexCoord::new(q.parse().expect("q"), r.parse().expect("r"))
}

fn terrain_of(t: civ_view_model::Terrain) -> Terrain {
    use civ_view_model::Terrain as T;
    match t {
        T::Laka => Terrain::Laka,
        T::Rownina => Terrain::Rownina,
        T::Wzgorza => Terrain::Wzgorza,
        T::Gory => Terrain::Gory,
        T::PlytkieMorze => Terrain::PlytkieMorze,
        T::Morze => Terrain::Morze,
        T::Pustynia => Terrain::Pustynia,
        T::Polarny => Terrain::Polarny,
    }
}

fn kind_of(k: civ_view_model::RiverKind) -> RiverKind {
    use civ_view_model::RiverKind as K;
    match k {
        K::Main => RiverKind::Main,
        K::Medium => RiverKind::Medium,
        K::Short => RiverKind::Short,
        K::Tributary => RiverKind::Tributary,
    }
}

/// Renderer inputs of one fixture map (test-side conversion of the DTO).
struct MapInputs {
    terrain: TerrainAt,
    rivers: Vec<RiverPath>,
    render_paths: Vec<Vec<HexCoord>>,
}

fn map_inputs(dto_json: &Value) -> MapInputs {
    let dto: MapViewDto = serde_json::from_value(dto_json.clone()).expect("MapViewDto");
    validate_map(&dto).expect("valid MapViewDto");
    let hc = |c: civ_view_model::HexCoord| HexCoord::new(c.q, c.r);
    let terrain: TerrainAt = dto
        .hexes
        .iter()
        .map(|h| (hc(h.coord), terrain_of(h.teren_bazowy)))
        .collect::<HashMap<_, _>>();
    let rivers = dto
        .rivers
        .iter()
        .map(|r| RiverPath {
            hexes: r.hexes.iter().copied().map(hc).collect(),
            kind: r.kind.map(kind_of),
        })
        .collect();
    let render_paths = dto
        .river_render_paths
        .iter()
        .map(|p| p.iter().copied().map(hc).collect())
        .collect();
    MapInputs {
        terrain,
        rivers,
        render_paths,
    }
}

fn mesh_matches(ctx: &str, m: &Mesh, g: &Value) {
    let f32bits = |v: &[f32]| v.iter().map(|x| x.to_bits()).collect::<Vec<u32>>();
    assert_eq!(
        m.vertex_count(),
        usize_of(&g["vertexCount"]),
        "{ctx}: vertexCount"
    );
    assert_eq!(
        f32bits(&m.positions),
        u32s(&g["position"]),
        "{ctx}: position"
    );
    match &g["normal"] {
        Value::Null => assert!(m.normals.is_empty(), "{ctx}: normal"),
        n => assert_eq!(f32bits(&m.normals), u32s(n), "{ctx}: normal"),
    }
    match &g["uv"] {
        Value::Null => assert!(m.uvs.is_empty(), "{ctx}: uv"),
        u => assert_eq!(f32bits(&m.uvs), u32s(u), "{ctx}: uv"),
    }
    match &g["index"] {
        Value::Null => assert!(m.indices.is_none(), "{ctx}: index"),
        i => assert_eq!(
            m.indices.as_deref(),
            Some(u32s(i).as_slice()),
            "{ctx}: index"
        ),
    }
    assert!(m.groups.is_empty(), "{ctx}: groups");
}

fn entry_matches(ctx: &str, e: &RiverEntry, x: &Value) {
    let mat = match e.material {
        RiverMaterialKind::Water => "water",
        RiverMaterialKind::CoastDelta => "delta",
    };
    assert_eq!(mat, x["mat"].as_str().expect("mat"), "{ctx}: material");
    assert_eq!(
        i64::from(e.render_order),
        x["renderOrder"].as_i64().expect("ro"),
        "{ctx}: renderOrder"
    );
    assert_eq!(
        e.merged,
        x["merged"].as_bool().expect("merged"),
        "{ctx}: merged"
    );
    let keys: Vec<String> = e.hex_keys.iter().map(str::to_owned).collect();
    assert_eq!(keys, strings(&x["hexKeys"]), "{ctx}: hexKeys");
    match &x["pointHex"] {
        Value::Null => assert!(e.point_hex.is_none(), "{ctx}: pointHex"),
        p => assert_eq!(
            e.point_hex.as_deref(),
            Some(strings(p).as_slice()),
            "{ctx}: pointHex"
        ),
    }
    match &x["segPointHex"] {
        Value::Null => assert!(e.seg_point_hex.is_none(), "{ctx}: segPointHex"),
        s => {
            let want: Vec<Vec<String>> = arr(s).iter().map(strings).collect();
            assert_eq!(e.seg_point_hex.as_ref(), Some(&want), "{ctx}: segPointHex");
        }
    }
    mesh_matches(ctx, &e.geometry, &x["geo"]);
}

fn ribbons_match(name: &str, got: &RiverRibbons, sc: &Value) {
    let want = arr(&sc["entries"]);
    assert_eq!(got.entries.len(), want.len(), "{name}: entry count");
    for (i, (e, x)) in got.entries.iter().zip(want).enumerate() {
        entry_matches(&format!("{name} entry {i}"), e, x);
    }
    let keys: Vec<String> = got.river_hex_keys.iter().map(str::to_owned).collect();
    assert_eq!(keys, strings(&sc["landHexKeys"]), "{name}: riverHexKeys");
}

fn scenario_ribbons(sc: &Value) -> RiverRibbons {
    let inputs = map_inputs(&sc["map"]);
    let delta: HashSet<HexCoord> = strings(&sc["deltaHexKeys"])
        .iter()
        .map(|k| parse_key(k))
        .collect();
    let stage = u8::try_from(sc["stage"].as_u64().expect("stage")).expect("u8");
    let input = RiverRibbonInput {
        radius: num(&sc["R"]),
        terrain: &inputs.terrain,
        rivers: &inputs.rivers,
        render_paths: &inputs.render_paths,
        delta_hexes: &delta,
        stage,
        river_render_fast: sc["fast"].as_bool().expect("fast"),
        scene_build_fast: sc["sceneFast"].as_bool().expect("sceneFast"),
    };
    match &sc["landOpts"] {
        Value::Null => build_river_ribbons(&input).expect("ribbons"),
        o => {
            // renderLandRiversFromPaths with explicit opts (scene.ts:1280-1293), then the mouths.
            let opts = LandRiverOpts {
                batch_size: o.get("batchSize").map_or(32, usize_of),
                tributary_decimate_dist: o.get("tributaryDecimateDist").map(num),
            };
            let idx = river_indices_for_stage(input.rivers, stage);
            let mouth_y = river_mouth_y(input.radius);
            let land = render_land_rivers(&input, &idx, mouth_y, opts);
            let mut entries = land.entries;
            entries.extend(render_coastal_mouths(&input, &idx, mouth_y));
            RiverRibbons {
                entries,
                river_hex_keys: land.land_hex_keys,
            }
        }
    }
}

#[test]
fn fixture_record_counts() {
    let f = fixture();
    assert_eq!(f["pin"], "07d2fbd72");
    assert_eq!(f["three"], "169");
    let sc = arr(&f["scenarios"]);
    assert_eq!(sc.len(), N_SCENARIOS);
    assert_eq!(
        sc.iter().map(|s| arr(&s["entries"]).len()).sum::<usize>(),
        N_ENTRIES
    );
    assert_eq!(arr(&f["points"]).len(), N_POINT_CASES);
    assert_eq!(arr(&f["ribbons"]).len(), N_RIBBON_CASES);
}

/// Every scenario of the fixture: entries, materials, render orders, fog keys
/// and geometry bit for bit (scene.ts:2860-2995).
#[test]
fn scenarios_match_web_bit_for_bit() {
    let f = fixture();
    for sc in arr(&f["scenarios"]) {
        let name = sc["name"].as_str().expect("name");
        let got = scenario_ribbons(sc);
        ribbons_match(name, &got, sc);
        if let Some(y) = sc["riverMouthY"].as_f64() {
            assert_eq!(
                river_mouth_y(num(&sc["R"])).to_bits(),
                y.to_bits(),
                "{name}: riverMouthY"
            );
        }
    }
}

/// `buildRiverPointsFromHexPath` on raw hex paths (scene.ts:1124-1233), with
/// `simplifyRiverRenderPath` (:1085-1104) and `pathReachesOpenSeaRender` (:604-612).
#[test]
fn point_walk_matches_web() {
    let f = fixture();
    let a = arr(&f["scenarios"])
        .iter()
        .find(|s| s["name"] == "A-s5")
        .expect("A-s5");
    let inputs = map_inputs(&a["map"]);
    let mouth_y = river_mouth_y(1.0);
    let surf = river_surface_lift_y(1.0);
    for (ci, c) in arr(&f["points"]).iter().enumerate() {
        let path: Vec<HexCoord> = arr(&c["path"]).iter().map(coord).collect();
        let ext = c["extendToCenter"].as_bool().expect("ext");
        let ctx = format!("point case {ci} {path:?} ext={ext}");
        let simplified: Vec<HexCoord> = arr(&c["simplified"]).iter().map(coord).collect();
        assert_eq!(
            simplify_river_render_path(&path),
            simplified,
            "{ctx}: simplify"
        );
        assert_eq!(
            path_reaches_open_sea_render(&inputs.terrain, &path),
            c["reachesSea"].as_bool().expect("reachesSea"),
            "{ctx}: reachesSea"
        );
        let rp = build_river_points_from_hex_path(&inputs.terrain, &path, 1.0, mouth_y, surf, ext);
        let want: Vec<[u64; 3]> = arr(&c["pts"])
            .iter()
            .map(|p| {
                let p = arr(p);
                [
                    num(&p[0]).to_bits(),
                    num(&p[1]).to_bits(),
                    num(&p[2]).to_bits(),
                ]
            })
            .collect();
        let got: Vec<[u64; 3]> = rp
            .pts
            .iter()
            .map(|p| [p.x.to_bits(), p.y.to_bits(), p.z.to_bits()])
            .collect();
        assert_eq!(got, want, "{ctx}: points (order and values)");
        assert_eq!(rp.point_hex, strings(&c["pointHex"]), "{ctx}: pointHex");
        let keys: Vec<String> = rp.hex_keys.iter().map(str::to_owned).collect();
        assert_eq!(keys, strings(&c["hexKeys"]), "{ctx}: hexKeys");
    }
}

/// `buildRibbonGeometry(points, halfWidth, _, true)` (scene.ts:385-460).
#[test]
fn ribbon_geometry_matches_web() {
    let f = fixture();
    for (ci, c) in arr(&f["ribbons"]).iter().enumerate() {
        let pts: Vec<Vec3> = arr(&c["pts"])
            .iter()
            .map(|p| {
                let p = arr(p);
                Vec3::new(num(&p[0]), num(&p[1]), num(&p[2]))
            })
            .collect();
        let widths: Vec<f64>;
        let hw = match &c["halfWidth"] {
            Value::Array(a) => {
                widths = a.iter().map(num).collect();
                HalfWidth::PerPoint(&widths)
            }
            v => HalfWidth::Scalar(num(v)),
        };
        let m = build_ribbon_geometry(&pts, hw);
        mesh_matches(&format!("ribbon case {ci}"), &m, &c["geo"]);
        // 2 vertices per point, 2 triangles per segment (scene.ts:413-418).
        assert_eq!(m.vertex_count(), 2 * pts.len());
        assert_eq!(m.triangle_count(), 2 * (pts.len() - 1));
    }
}

/// Water colour and material flags (scene.ts:2005-2017, mapRenderStyle.ts:568),
/// coast-delta colour (scene.ts:2024-2029), heights (mapRenderStyle.ts:181-186).
#[test]
fn colours_and_constants_match_web() {
    let f = fixture();
    let k = &f["constants"];
    let water = river_material(RiverMaterialKind::Water);
    assert_eq!(f64::from(water.material.hex()), num(&k["paletteRiver"]));
    assert_eq!(water.material.hex(), 0x006a_adbe);
    assert_eq!(
        style_scene_palette(MapRenderStyle::Roblox).river,
        water.material.hex()
    );
    // scene.ts:161 RIVER_COLOR = 0x5fb4e8 is defined but never read in the pin.
    assert_ne!(water.material.hex(), 0x005f_b4e8);
    assert_eq!(water.material.emissive.to_hex(), 0x0022_88dd); // scene.ts:2007
    assert_eq!(water.emissive_intensity, 0.65); // scene.ts:2008
    assert_eq!(water.material.side, Side::Double); // scene.ts:2009
    assert!(water.material.depth_write); // scene.ts:2010
    assert_eq!(water.material.polygon_offset, Some((2.0, 2.0))); // scene.ts:2011-2013
    assert!(!water.fog); // scene.ts:2016
    let delta = river_material(RiverMaterialKind::CoastDelta);
    assert_eq!(f64::from(delta.material.hex()), num(&k["coastDeltaColor"]));
    assert_eq!(delta.material.side, Side::Double);
    assert!(!delta.fog);
    assert_eq!(
        river_surface_lift_y(1.0).to_bits(),
        num(&k["riverSurfaceLiftY1"]).to_bits()
    );
    assert_eq!(
        FLAT_LAND_SURFACE_Y.to_bits(),
        num(&k["flatLandSurfaceY"]).to_bits()
    );
    assert_eq!(
        (
            LAND_RIVER_RENDER_ORDER,
            RIVER_MOUTH_RENDER_ORDER,
            COAST_DELTA_RENDER_ORDER
        ),
        (55, 58, 50)
    );
}

/// Hand-checked vector, independent of the fixture: river 0 of map A runs
/// straight north→south along q = 2 (hexes (2,0)…(2,4) on land, then
/// Wybrzeże (2,5) and Morze (2,6)). Its land ribbon has 1 start edge point,
/// 3 inset wall corners per middle hex (straight run, scene.ts:1019) for the
/// 3 middle hexes, 1 end edge point and the centre of the last hex (the
/// path reaches the sea, scene.ts:1221-1229): 12 points, 11 quads, 24
/// vertices, 22 triangles; points follow the path hex by hex.
#[test]
fn straight_river_segments_and_point_order() {
    let f = fixture();
    let sc = arr(&f["scenarios"])
        .iter()
        .find(|s| s["name"] == "A-s5")
        .expect("A-s5");
    let got = scenario_ribbons(sc);
    let e = &got.entries[0];
    assert_eq!(e.material, RiverMaterialKind::Water);
    assert_eq!(e.render_order, 55);
    let ph = e.point_hex.as_ref().expect("main river has pointHex");
    let want: Vec<&str> = [
        "2,1", "2,1", "2,1", "2,1", "2,2", "2,2", "2,2", "2,3", "2,3", "2,3", "2,4", "2,4",
    ]
    .to_vec();
    assert_eq!(ph.iter().map(String::as_str).collect::<Vec<_>>(), want);
    assert_eq!(e.geometry.vertex_count(), 24);
    assert_eq!(e.geometry.triangle_count(), 22);
    // Cross-section centres (mean of the two vertices of point i).
    let mid: Vec<(f32, f32)> = e
        .geometry
        .positions
        .chunks_exact(6)
        .map(|v| ((v[0] + v[3]) * 0.5, (v[2] + v[5]) * 0.5))
        .collect();
    // First point: midpoint of the (2,0)|(2,1) wall (z = 0.75) inset 0.15 towards
    // the centre of (2,1) (z = 1.5): 0.75 + 0.75 * 0.15 = 0.8625 (scene.ts:1172-1184).
    assert!((mid[0].1 - 0.8625).abs() < 1e-6, "first point {:?}", mid[0]);
    // Last point: centre of (2,4) = (√3·4, 6) (extendToCenter, scene.ts:1223-1229).
    let sqrt3 = 3.0f32.sqrt();
    assert!(
        (mid[11].0 - 4.0 * sqrt3).abs() < 1e-5 && (mid[11].1 - 6.0).abs() < 1e-6,
        "{:?}",
        mid[11]
    );
    // Every point lies inside the z band of its own hex (|z - 1.5 r| < R): the
    // ribbon walks the walls of each hex in path order, source to mouth.
    for (i, h) in ph.iter().enumerate() {
        let r: f32 = h.split_once(',').expect("q,r").1.parse().expect("r");
        assert!(
            (mid[i].1 - 1.5 * r).abs() < 1.0,
            "point {i} {:?} outside hex {h}",
            mid[i]
        );
    }
    // Water colour of the land ribbon.
    assert_eq!(river_material(e.material).material.hex(), 0x006a_adbe);
    // The mouth of river 0 (coast (2,5) is a delta hex): funnel 50, water 58, delta top 58.
    let mouth: Vec<(RiverMaterialKind, i32)> = got
        .entries
        .iter()
        .filter(|e| e.hex_keys.has("2,5"))
        .map(|e| (e.material, e.render_order))
        .collect();
    assert_eq!(
        mouth,
        vec![
            (RiverMaterialKind::CoastDelta, 50),
            (RiverMaterialKind::Water, 58),
            (RiverMaterialKind::CoastDelta, 58),
        ]
    );
}

/// The renderer's own `river_delta_hexes` (terrain/coast.rs) gives the same
/// delta hexes as the pin `computeRiverDeltaHexKeys` on every fixture map.
#[test]
fn delta_hexes_match_web() {
    let f = fixture();
    for sc in arr(&f["scenarios"]) {
        if sc["stage"] == 0 {
            continue;
        }
        let inputs = map_inputs(&sc["map"]);
        let want: HashSet<HexCoord> = strings(&sc["deltaHexKeys"])
            .iter()
            .map(|k| parse_key(k))
            .collect();
        assert_eq!(
            river_delta_hexes(&inputs.terrain, &inputs.rivers),
            want,
            "{}",
            sc["name"]
        );
    }
}

#[test]
fn render_paths_must_be_one_to_one_with_rivers() {
    let terrain = TerrainAt::new();
    let rivers = vec![RiverPath {
        hexes: vec![HexCoord::new(0, 0), HexCoord::new(1, 0)],
        kind: None,
    }];
    let delta = HashSet::new();
    let input = RiverRibbonInput {
        radius: 1.0,
        terrain: &terrain,
        rivers: &rivers,
        render_paths: &[],
        delta_hexes: &delta,
        stage: 5,
        river_render_fast: false,
        scene_build_fast: false,
    };
    assert_eq!(
        build_river_ribbons(&input),
        Err(RiverRibbonError::RenderPathCount {
            rivers: 1,
            render_paths: 0
        })
    );
}
