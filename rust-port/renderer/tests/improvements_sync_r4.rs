//! `R-RUSTPORT-P4-1-R4-IMPROVEMENTS-RESOURCES`: improvement meshes,
//! resource overlays and villages per hex (`renderer/src/improvements/sync/`),
//! DTO → [`MapObjectsLayer`].
//!
//! Expected constants and orders come from
//! `tests/fixtures/improvements_sync/r4_vectors.json`, copied by hand from
//! pin `07d2fbd72` (`gra/src/main.ts`; each value names its line). Model
//! geometry is the output of the already ported builders
//! (`build_improvement_sectored`, `build_styled_resource_overlay`,
//! `build_wioska`), which have their own web-vector tests; this file checks
//! the integrator: which builder runs with which inputs, placement, order,
//! and fog.

#![allow(clippy::float_cmp)]

use std::collections::HashSet;
use std::path::PathBuf;

use civ_renderer::core::merge_decor::collapse_to_merged_mesh;
use civ_renderer::decor::style::ReliefSampler;
use civ_renderer::improvements::sync::{
    build_improvement_visual, build_resource_overlay, improvement_relief_sampler,
    merged_improvement_layers, ExternalInputs, MapObjectsInput, MapObjectsLayer,
};
use civ_renderer::models::cities::renderer::terrain_top_y;
use civ_renderer::models::improvements::droga::ROAD_MASK_FULL;
use civ_renderer::models::improvements::model::ImprovementExt;
use civ_renderer::models::improvements::registry::{build_improvement_sectored, SectorRelief};
use civ_renderer::models::improvements::{build_styled_resource_overlay, Nakladka};
use civ_renderer::models::misc::HexKey;
use civ_renderer::pick::hex::{axial_to_world, HexCoord, HEX_R};
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::scene::{Scene, ROOT};
use civ_renderer::view::{FogSets, ViewAdapterError};
use civ_view_model as vm;
use serde_json::Value;

// ------------------------------------------------------------ fixture

fn vectors() -> Value {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/improvements_sync/r4_vectors.json");
    serde_json::from_str(&std::fs::read_to_string(p).expect("fixture")).expect("json")
}

fn c(v: &Value, name: &str) -> f64 {
    v["constants"][name]["value"].as_f64().expect(name)
}

fn keys(v: &Value) -> Vec<HexKey> {
    v.as_array()
        .expect("array of [q, r]")
        .iter()
        .map(|p| {
            let a = p.as_array().expect("[q, r]");
            (
                i32::try_from(a[0].as_i64().expect("q")).expect("q i32"),
                i32::try_from(a[1].as_i64().expect("r")).expect("r i32"),
            )
        })
        .collect()
}

struct Fixture {
    v: Value,
    map: vm::MapViewDto,
    hex_state: Vec<vm::HexDynDto>,
    fog: vm::FogViewDto,
}

fn fixture() -> Fixture {
    let v = vectors();
    let map: vm::MapViewDto = serde_json::from_value(v["map"].clone()).expect("map");
    vm::validate_map(&map).expect("valid map");
    let hex_state: Vec<vm::HexDynDto> =
        serde_json::from_value(v["hexState"].clone()).expect("hexState");
    let fog: vm::FogViewDto = serde_json::from_value(v["fog"].clone()).expect("fog");
    Fixture {
        v,
        map,
        hex_state,
        fog,
    }
}

fn ext(v: &Value) -> ExternalInputs {
    let e = &v["external"];
    let set = |k: &str| keys(&e[k]).into_iter().collect::<HashSet<HexKey>>();
    ExternalInputs {
        show_resource_deposit_overlay: e["showResourceDepositOverlay"].as_bool().expect("show"),
        lama_deposit_visible: e["lamaDepositVisible"].as_bool().expect("lama"),
        zloze_hidden: set("zlozeHidden"),
        deposit_overlay_suppressed: set("depositOverlaySuppressed"),
        preserves_hill_relief: set("preservesHillRelief"),
    }
}

fn inputs(f: &Fixture) -> MapObjectsInput {
    MapObjectsInput::from_dto(&f.map, &f.hex_state).expect("from_dto")
}

fn fog_sets(f: &Fixture) -> FogSets {
    FogSets::from_dto(
        &f.map,
        &f.fog,
        f.v["fogActive"].as_bool().expect("fogActive"),
    )
    .expect("fog sets")
}

fn snapshot(f: &Fixture) -> MapObjectsLayer {
    let mut layer = MapObjectsLayer::new();
    layer.sync_snapshot(&inputs(f), &ext(&f.v), &fog_sets(f));
    layer
}

/// Every vertex position of every mesh of the group, in traverse order.
fn positions(s: &Scene) -> Vec<f32> {
    s.meshes()
        .into_iter()
        .flat_map(|id| {
            s.nodes[id]
                .mesh()
                .expect("mesh")
                .geo
                .mesh()
                .positions
                .clone()
        })
        .collect()
}

fn root_pos(s: &Scene) -> [f64; 3] {
    let p = s.nodes[ROOT].position;
    [p.x, p.y, p.z]
}

fn world_xz(q: i32, r: i32) -> (f64, f64) {
    axial_to_world(HexCoord::new(q, r), HEX_R)
}

/// The colour multiplier of every dimmed material of the group (`color /
/// fogBaseColor`), or `None` when nothing was dimmed.
fn dim_factors(s: &Scene) -> Vec<f64> {
    let mut out = Vec::new();
    for id in s.meshes() {
        for &slot in &s.nodes[id].mesh().expect("mesh").materials {
            let m = &s.materials[slot];
            if let (Some(col), Some(base)) = (m.color, m.fog_base_color) {
                let (b, cc) = (base.r.max(base.g).max(base.b), col.r.max(col.g).max(col.b));
                if b > 0.0 {
                    out.push(cc / b);
                }
            }
        }
    }
    out
}

// ------------------------------------------------------------ inputs

/// `map.hexes[i]` ↔ `hexState[i]` (contract §3.2); a shorter `hexState`
/// is an error, not a truncation.
#[test]
fn from_dto_pairs_hexes_and_rejects_length_mismatch() {
    let f = fixture();
    let m = inputs(&f);
    assert_eq!(m.hexes.len(), 12);
    assert_eq!(m.seed, 12345);
    let h = m.hex((0, 0)).expect("hex 0,0");
    assert_eq!(h.terrain, Terrain::Laka);
    assert_eq!(h.nakladka, Nakladka::ZlozeGliny);
    assert_eq!(h.road_mask, 5);
    assert_eq!(h.improvement_key.as_deref(), Some("droga"));
    assert!(m.hex((2, 0)).expect("2,0").village_present);
    let err = MapObjectsInput::from_dto(&f.map, &f.hex_state[..11]).unwrap_err();
    assert_eq!(
        err,
        ViewAdapterError::LengthMismatch {
            field: "hexState",
            expected: 12,
            actual: 11
        }
    );
}

/// `mergedImprovementLayers` (`main.ts:3126-3137`): placed layers in order,
/// then the implicit livestock layer (`:3130-3131`).
#[test]
fn merged_layers_follow_pin() {
    let f = fixture();
    let m = inputs(&f);
    let exp = &f.v["expected"]["layers"];
    for (q, r) in [(0, 0), (0, 1), (2, 1), (0, 2)] {
        let want: Vec<String> =
            serde_json::from_value(exp[format!("{q},{r}")].clone()).expect("layers");
        assert_eq!(
            merged_improvement_layers(m.hex((q, r)).unwrap()),
            want,
            "{q},{r}"
        );
    }
    assert!(merged_improvement_layers(m.hex((1, 0)).unwrap()).is_empty());
}

// ------------------------------------------------------------ improvements

/// Mutation (a): the road arms come from `HexDynDto.road_mask`
/// (`buildImprovementVisual(…, computeRoadMask(q, r, hexHasRoadAt))`,
/// `main.ts:17080-17084`, `:3162-3173`), not from `ROAD_MASK_FULL`.
#[test]
fn improvement_mesh_uses_dto_road_mask_and_pin_placement() {
    let f = fixture();
    let layer = snapshot(&f);
    let got = layer.improvement_mesh((0, 0)).expect("mesh on 0,0");
    // pin: buildImprovementSectored(['farma','droga'], 0xffd54a, undefined, HEX_R, {}, 5)
    let owner = u32::try_from(f.v["constants"]["ownerCol"]["value"].as_u64().unwrap()).unwrap();
    let expected_with = |mask: u32| {
        let mut g = build_improvement_sectored(
            &["farma", "droga"],
            owner,
            HEX_R,
            &SectorRelief::default(),
            mask,
        );
        collapse_to_merged_mesh(&mut g);
        positions(&g)
    };
    let mask = u32::from(f.hex_state[0].road_mask);
    assert_eq!(mask, 0b000101);
    assert_eq!(positions(got), expected_with(mask), "geometry of mask 5");
    assert_ne!(
        expected_with(mask),
        expected_with(ROAD_MASK_FULL),
        "fixture mask must change the road shape"
    );
    // improvementMeshPlacement (`main.ts:16874`): topYAt + 0.01.
    let (x, z) = world_xz(0, 0);
    assert_eq!(
        root_pos(got),
        [x, terrain_top_y(Terrain::Laka) + c(&f.v, "surfaceLift"), z]
    );
    assert!(!got.nodes[ROOT].matrix_auto_update);
}

/// Terraces on a hill: hill + terraces added, no `+0.01`
/// (`main.ts:17085-17090`, `:16871-16872`); livestock deposit drawn as the
/// `bydlo` layer (`:3130-3131`).
#[test]
fn terraces_and_livestock_layers() {
    let f = fixture();
    let layer = snapshot(&f);
    let t = layer.improvement_mesh((2, 1)).expect("terraces 2,1");
    assert!(!positions(t).is_empty(), "hill + terraces geometry");
    let (x, z) = world_xz(2, 1);
    assert_eq!(root_pos(t), [x, terrain_top_y(Terrain::Wzgorza), z]);

    let b = layer.improvement_mesh((0, 1)).expect("cattle 0,1");
    let owner = u32::try_from(f.v["constants"]["ownerCol"]["value"].as_u64().unwrap()).unwrap();
    let mut want =
        build_improvement_sectored(&["bydlo"], owner, HEX_R, &SectorRelief::default(), 0);
    collapse_to_merged_mesh(&mut want);
    assert_eq!(positions(b), positions(&want));
}

/// `keepsReliefUnderImprovement` (`main.ts:16839-16849`): only the
/// external `preservesHillRelief` decides on a hill; terraces and flat
/// terrain never keep the relief.
#[test]
fn relief_sampler_needs_external_predicate() {
    let f = fixture();
    let m = inputs(&f);
    let mut e = ext(&f.v);
    let mut hill = m.hex((1, 0)).unwrap().clone();
    hill.ulepszenia = Some(vec!["kopalnia_miedzi".into()]);
    let layers = merged_improvement_layers(&hill);
    assert!(improvement_relief_sampler(&hill, &layers, m.seed, &e).is_none());
    e.preserves_hill_relief.insert((1, 0));
    assert!(improvement_relief_sampler(&hill, &layers, m.seed, &e).is_some());
    let terr = m.hex((2, 1)).unwrap();
    e.preserves_hill_relief.insert((2, 1));
    let tl = merged_improvement_layers(terr);
    assert!(
        improvement_relief_sampler(terr, &tl, m.seed, &e).is_none(),
        "tarasy"
    );
    let flat = m.hex((0, 0)).unwrap();
    e.preserves_hill_relief.insert((0, 0));
    let fl = merged_improvement_layers(flat);
    assert!(
        improvement_relief_sampler(flat, &fl, m.seed, &e).is_none(),
        "laka"
    );
    // empty layers: the pin's improvementReliefOpts is never reached
    let empty = build_improvement_visual(&[], &SectorRelief::default(), 5);
    assert_eq!(empty.node_count(), 1);
}

// ------------------------------------------------------------ resources

/// `syncResourceOverlayAtHex` gates (`main.ts:3207-3219`), each with its
/// fixture hex. Mutation (c): `zloze` `None` / `''` never makes an overlay
/// on its own, a real `zloze` does.
#[test]
fn resource_overlay_gates() {
    let f = fixture();
    let m = inputs(&f);
    let e = ext(&f.v);
    let at = |q: i32, r: i32, e: &ExternalInputs| {
        build_resource_overlay(m.hex((q, r)).unwrap(), m.seed, e).is_some()
    };
    assert!(at(1, 0, &e), "zloze 'miedz' on a hill");
    assert!(at(3, 2, &e), "zloze 'miedz' on a meadow");
    assert!(
        at(0, 0, &e),
        "clay overlay under a farm (farma does not hide it)"
    );
    assert!(!at(1, 1, &e), "zloze None, nakladka brak");
    assert!(!at(2, 1, &e), "zloze '' (falsy)");
    assert!(!at(3, 1, &e), "water");
    assert!(!at(0, 1, &e), "livestock deposit");
    assert!(!at(1, 2, &e), "llama for a non-llama civ");
    assert!(!at(2, 2, &e), "zloze hidden by era");
    assert!(!at(0, 2, &e), "dedicated improvement");
    let mut e2 = e.clone();
    e2.lama_deposit_visible = true;
    assert!(at(1, 2, &e2), "llama for a llama civ");
    e2.zloze_hidden.clear();
    assert!(at(2, 2, &e2), "iron in its era");
    e2.deposit_overlay_suppressed.clear();
    assert!(at(0, 2, &e2), "salt without the dedicated gate");
    e2.show_resource_deposit_overlay = false;
    assert!(!at(1, 0, &e2), "toggle off");
}

/// `compactDepositAtEdge` (`main.ts:3058-3094`) on a hill
/// (elevated constants, relief under the outline) and on flat land.
#[test]
fn deposit_marker_placement() {
    let f = fixture();
    let m = inputs(&f);
    let e = ext(&f.v);
    for ((q, r), t, edge, span) in [
        (
            (1, 0),
            Terrain::Wzgorza,
            "depositEdgeRElevated",
            "depositTargetSpanElevated",
        ),
        ((3, 2), Terrain::Laka, "depositEdgeR", "depositTargetSpan"),
    ] {
        let ov = build_resource_overlay(m.hex((q, r)).unwrap(), m.seed, &e).expect("overlay");
        // the same builder before placement, to read its span
        let mut raw = build_styled_resource_overlay(Nakladka::Brak, Some("miedz")).unwrap();
        civ_renderer::improvements::sync::maybe_collapse_resource_overlay(&mut raw);
        let bb = raw.box_from_object(ROOT);
        let max_span = (bb.max.x - bb.min.x).max(bb.max.z - bb.min.z);
        let dds = raw.nodes[ROOT]
            .user_data
            .num("depositDisplayScale")
            .unwrap_or(1.0);
        let scale = c(&f.v, "depositMaxScale").min(c(&f.v, span) * HEX_R / max_span) * dds;
        let s = ov.nodes[ROOT].scale;
        assert_eq!([s.x, s.y, s.z], [scale, scale, scale], "{q},{r} scale");
        let edge_r = c(&f.v, edge) * HEX_R;
        let (x, z) = world_xz(q, r);
        let rot = f64::from(q) * c(&f.v, "depositRotQ") + f64::from(r) * c(&f.v, "depositRotR");
        assert_eq!(ov.nodes[ROOT].rotation.y, rot, "{q},{r} rotY");
        let half = max_span * scale / 2.0;
        let relief = ReliefSampler::new(t, q, r, m.seed, HEX_R).map_or(0.0, |sm| {
            let mut v = f64::INFINITY;
            for dx in [-half, 0.0, half] {
                for dz in [-half, 0.0, half] {
                    v = v.min(sm.sample(dx, -edge_r + dz));
                }
            }
            if v.is_finite() {
                v.max(0.0)
            } else {
                0.0
            }
        });
        let p = root_pos(&ov);
        assert_eq!(p[0], x, "{q},{r} x");
        assert_eq!(p[2], z - edge_r, "{q},{r} z");
        assert_eq!(
            p[1],
            terrain_top_y(t) + relief + c(&f.v, "surfaceLift"),
            "{q},{r} y"
        );
        // centred in XZ before scaling (main.ts:3074-3077)
        let cb = {
            let mut g = ov.clone();
            g.nodes[ROOT].position = civ_renderer::geom::Vec3::new(0.0, 0.0, 0.0);
            g.nodes[ROOT].scale = civ_renderer::geom::Vec3::new(1.0, 1.0, 1.0);
            g.nodes[ROOT].set_rot(0.0, 0.0, 0.0);
            g.box_from_object(ROOT)
        };
        assert!(((cb.min.x + cb.max.x) / 2.0).abs() < 1e-6, "{q},{r} cx");
        assert!(((cb.min.z + cb.max.z) / 2.0).abs() < 1e-6, "{q},{r} cz");
    }
    assert_eq!(c(&f.v, "overlayCollapseMinMeshes"), 7.0);
}

/// Pin order of `resourceOverlays`, `improvementMeshes` and `villageMeshes`
/// after one snapshot (fixture `expected.order`).
#[test]
fn snapshot_orders_match_pin_call_order() {
    let f = fixture();
    let layer = snapshot(&f);
    let exp = &f.v["expected"];
    let order = |v: &[civ_renderer::improvements::sync::HexGroup]| {
        v.iter().map(|e| e.hex).collect::<Vec<_>>()
    };
    assert_eq!(
        order(layer.resource_overlays()),
        keys(&exp["resourceOverlayOrder"])
    );
    assert_eq!(
        order(layer.improvement_meshes()),
        keys(&exp["improvementMeshOrder"])
    );
    assert_eq!(order(layer.village_meshes()), keys(&exp["villageOrder"]));
}

// ------------------------------------------------------------ villages + fog

/// Mutation (b): a village on an unexplored hex is hidden; on an explored
/// one it is shown at `FOG_EXPLORED_BRIGHTNESS` (`main.ts:3430-3443`,
/// `fogDim.ts:16-26`). Village placement `main.ts:3381-3386`.
#[test]
fn villages_follow_dto_and_fog() {
    let f = fixture();
    let layer = snapshot(&f);
    let explored = layer.village_mesh((2, 0)).expect("village 2,0");
    let hidden = layer.village_mesh((3, 0)).expect("village 3,0");
    assert!(explored.nodes[ROOT].visible);
    assert!(
        !hidden.nodes[ROOT].visible,
        "village in the fog must be hidden"
    );
    let dim = dim_factors(explored);
    assert!(!dim.is_empty());
    let b = c(&f.v, "fogExploredBrightness");
    assert!(dim.iter().all(|d| (d - b).abs() < 1e-12), "{dim:?}");
    let (x, z) = world_xz(2, 0);
    assert_eq!(root_pos(explored), [x, terrain_top_y(Terrain::Laka), z]);
    assert_eq!(explored.nodes[ROOT].rotation.y, c(&f.v, "villageRotY"));
    assert!(layer.village_mesh((1, 1)).is_none(), "no village flag");
}

/// Fog of overlays and improvements (`main.ts:3284-3292`, `:3314-3329`);
/// without fog every group is shown at full brightness (`:13507-13509`).
#[test]
fn overlay_and_improvement_fog() {
    let f = fixture();
    let layer = snapshot(&f);
    assert!(!layer.resource_overlay((3, 2)).unwrap().nodes[ROOT].visible);
    let lit = layer.resource_overlay((1, 0)).unwrap();
    assert!(lit.nodes[ROOT].visible);
    assert!(dim_factors(lit).iter().all(|d| (d - 1.0).abs() < 1e-12));
    assert!(layer.improvement_mesh((0, 0)).unwrap().nodes[ROOT].visible);

    let mut layer = layer;
    let no_fog = FogSets::from_dto(&f.map, &f.fog, false).unwrap();
    layer.apply_fog(&no_fog);
    for g in layer
        .resource_overlays()
        .iter()
        .chain(layer.improvement_meshes())
        .chain(layer.village_meshes())
    {
        assert!(g.group.nodes[ROOT].visible, "{:?}", g.hex);
        assert!(dim_factors(&g.group)
            .iter()
            .all(|d| (d - 1.0).abs() < 1e-12));
    }
}

/// T1: a later snapshot drops the mesh of a hex that lost its layers and
/// the village that left the DTO (`main.ts:17067-17071`, `:3391-3397`).
#[test]
fn later_snapshot_removes_stale_groups() {
    let mut f = fixture();
    let mut layer = snapshot(&f);
    assert!(layer.take_shadow_map_update());
    assert!(!layer.take_shadow_map_update());
    f.hex_state[0].ulepszenia = None;
    f.hex_state[2].village_present = false;
    layer.sync_snapshot(&inputs(&f), &ext(&f.v), &fog_sets(&f));
    assert!(layer.improvement_mesh((0, 0)).is_none());
    assert!(layer.village_mesh((2, 0)).is_none());
    assert!(layer.village_mesh((3, 0)).is_some());
    assert!(layer.resource_overlay((0, 0)).is_some(), "clay stays");
    assert!(layer.take_shadow_map_update());
}

/// Barbarian camps (`syncCampMeshes`, `main.ts:3401-3427`) have no DTO
/// field: nothing camp-like is produced (NIE_ZMIERZONO in the report).
#[test]
fn no_camp_groups_without_dto_field() {
    let f = fixture();
    let layer = snapshot(&f);
    let villages: Vec<HexKey> = layer.village_meshes().iter().map(|e| e.hex).collect();
    let flagged: Vec<HexKey> = f
        .hex_state
        .iter()
        .zip(&f.map.hexes)
        .filter(|(d, _)| d.village_present)
        .map(|(_, s)| (s.coord.q, s.coord.r))
        .collect();
    assert_eq!(villages, flagged);
}
