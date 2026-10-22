//! Unit tests of the one scene type (P4.27). The web-parity of the models
//! built on it is checked by `tests/*_web_parity.rs` (unchanged fixtures).

#![allow(clippy::float_cmp)]

use std::sync::Arc;

use super::*;
use crate::geom::{Euler, Mat4, Quat, Vec3};
use crate::terrain::color::Color;

#[derive(Debug, Clone, Copy, PartialEq)]
struct Tri(f64);

impl GeoBody for Tri {
    fn build(&self) -> crate::geom::Mesh {
        #[allow(clippy::cast_possible_truncation)]
        let s = self.0 as f32;
        crate::geom::Mesh {
            positions: vec![0.0, 0.0, 0.0, s, 0.0, 0.0, 0.0, s, 0.0],
            ..crate::geom::Mesh::default()
        }
    }
    fn three_type(&self) -> &'static str {
        "BufferGeometry"
    }
}

#[derive(Debug, Clone, Copy, PartialEq)]
struct Other(f64);

impl GeoBody for Other {
    fn build(&self) -> crate::geom::Mesh {
        crate::geom::Mesh::default()
    }
    fn three_type(&self) -> &'static str {
        "BufferGeometry"
    }
}

#[test]
fn module_bodies_downcast_through_the_arc_and_compare_by_value() {
    let a = Geo::body(Tri(2.0));
    // regression: `b.as_any()` on the `Arc` itself would downcast to the Arc
    assert_eq!(a.body_as::<Tri>(), Some(&Tri(2.0)));
    assert!(a.body_as::<Other>().is_none());
    assert_eq!(a, Geo::body(Tri(2.0)));
    assert_ne!(a, Geo::body(Tri(3.0)));
    assert_ne!(Geo::body(Other(2.0)), Geo::body(Tri(2.0)));
    assert_eq!(a.three_type(), "BufferGeometry");
    assert_eq!(a.parameters_height(), 1.0);
    assert_eq!(Geo::from(Prim::bx(1.0, 2.0, 3.0)).parameters_height(), 2.0);
    assert_eq!(a.mesh().vertex_count(), 3);
}

#[test]
fn euler_setters_keep_the_quaternion_in_sync() {
    let mut s = Scene::new();
    let m = s.add_material(Material::lambert(0x12_3456));
    let id = s.add_mesh_id(ROOT, Prim::bx(1.0, 1.0, 1.0), m);
    s.node(id).rot_x(0.3).rot_y(-1.2).rot_z(2.0);
    let n = &s.nodes[id];
    assert_eq!(n.quaternion, Quat::from_euler(Euler::xyz(0.3, -1.2, 2.0)));
    s.node(id).set_rotation(Euler {
        x: 0.1,
        y: 0.2,
        z: 0.3,
        order: crate::geom::EulerOrder::Yxz,
    });
    assert_eq!(
        s.nodes[id].quaternion,
        Quat::from_euler(s.nodes[id].rotation)
    );
}

#[test]
fn world_matrices_compose_parent_first_and_skip_detached_nodes() {
    let mut s = Scene::new();
    s.root_mut().set_pos(1.0, 2.0, 3.0);
    let g = s.add_group(ROOT);
    s.node(g).set_scale(2.0, 2.0, 2.0).rot_y(0.5);
    let m = s.add_material(Material::lambert(0xff_ffff));
    let leaf = s.add_mesh_id(g, Prim::bx(1.0, 1.0, 1.0), m);
    s.node(leaf).set_pos(0.5, 0.0, 0.0);
    let det = s.detached_group();
    s.node(det).set_pos(9.0, 9.0, 9.0);
    let w = s.world_matrices(None);
    let expect = s
        .local_matrix(ROOT)
        .mul(&s.local_matrix(g))
        .mul(&s.local_matrix(leaf));
    assert_eq!(w[leaf].e, expect.e);
    assert_eq!(w[det].e, Mat4::IDENTITY.e);
    let parent = Mat4::compose(
        Vec3::new(5.0, 0.0, 0.0),
        Quat::default(),
        Vec3::new(1.0, 1.0, 1.0),
    );
    let wp = s.world_matrices(Some(&parent));
    assert_eq!(wp[ROOT].e, parent.mul(&s.local_matrix(ROOT)).e);
    assert_eq!(s.traverse(), vec![ROOT, g, leaf]);
    assert_eq!(
        s.traverse_with_parent(),
        vec![(ROOT, None), (g, Some(0)), (leaf, Some(1))]
    );
}

#[test]
fn graft_moves_nodes_and_materials_with_shifted_ids() {
    let mut a = Scene::new();
    let ma = a.add_material(Material::lambert(0x11_1111));
    a.add_mesh_id(ROOT, Prim::bx(1.0, 1.0, 1.0), ma);
    let mut b = Scene::new();
    b.root_mut().set_pos(0.0, 1.0, 0.0);
    let mb = b.mat(0x22_2222, 0.1, 0.9);
    let inner = b.add_group(ROOT);
    b.add_mesh_id(inner, Geo::body(Tri(1.0)), mb);
    let sprite_m = b.add_material(Material::new(MaterialKind::Sprite, None));
    b.sprite(ROOT, sprite_m);
    let before = b.world_matrices(None);
    let order_b = b.traverse();
    let root_b = a.graft(ROOT, b);
    assert_eq!(a.nodes[root_b].parent, Some(ROOT));
    assert_eq!(a.nodes[ROOT].children, vec![1, root_b]);
    // every material slot of the grafted part points at the moved materials
    let mesh = a.nodes[root_b + 2].mesh().expect("mesh");
    assert_eq!(a.materials[mesh.material()].hex(), 0x22_2222);
    assert_eq!(a.nodes[root_b + 3].sprite_material(), Some(sprite_m + 1));
    // root userData.mats of the grafted scene follows its materials
    assert_eq!(a.nodes[root_b].user_data.mats("mats"), Some(&[1usize][..]));
    // world matrices of the grafted sub-tree = standalone ones under ROOT
    let w = a.world_matrices(None);
    for (k, old) in order_b.iter().enumerate() {
        let new = root_b + old;
        let want = a.local_matrix(ROOT).mul(&before[*old]);
        assert_eq!(w[new].e, want.e, "node {k}");
    }
}

#[test]
fn tracked_materials_and_retint_follow_the_unit_factory() {
    let mut s = Scene::new();
    assert!(s.tracked().is_empty());
    let a = s.mat(0xb8_8850, 0.2, 0.4);
    let b = s.add_material(Material::standard(0xb8_8850, 0.0, 1.0));
    let c = s.mat(0x12_3456, 0.0, 1.0);
    assert_eq!(s.tracked(), &[a, c]);
    assert_eq!(s.retint(0xb8_8850, 0x55_5558), 1);
    assert_eq!(s.materials[a].hex(), 0x55_5558);
    assert_eq!(
        s.materials[b].hex(),
        0xb8_8850,
        "untracked is not re-tinted"
    );
    assert_eq!(
        s.materials[a].color,
        Some(Color::from_hex(0x55_5558)),
        "linear like Color.setHex"
    );
}

#[test]
fn user_data_keeps_insertion_order_and_types() {
    let mut u = UserData::default();
    u.set("b", UserValue::Num(2.0));
    u.set("a", UserValue::Bool(true));
    u.set("b", UserValue::Str("x".to_owned()));
    let keys: Vec<&str> = u.iter().map(|(k, _)| k).collect();
    assert_eq!(keys, ["b", "a"]);
    assert!(u.flag("a"));
    assert_eq!(u.str("b"), Some("x"));
    assert_eq!(u.num("b"), None);
    u.set("n", UserValue::Len(3));
    assert_eq!(u.array_len("n"), Some(3));
}

/// Column-major `f32` matrix `T(tx, ty, tz) · S(s)` written out by hand
/// (independent of `Mat4::compose` / `world_matrices`).
fn ts(tx: f32, ty: f32, tz: f32, s: f32) -> [f32; 16] {
    [
        s, 0.0, 0.0, 0.0, 0.0, s, 0.0, 0.0, 0.0, 0.0, s, 0.0, tx, ty, tz, 1.0,
    ]
}

/// A hand-built scene with known world matrices (translations and uniform
/// scales only), every per-mesh field set to a non-default value, a
/// multi-material mesh, a sprite and hidden sub-trees.
struct Fixture {
    s: Scene,
    boxm: NodeId,
    tri: NodeId,
    spr: NodeId,
    mats: Vec<MatId>,
    tri_mat: MatId,
    spr_mat: MatId,
}

fn export_fixture() -> Fixture {
    let mut s = Scene::new();
    s.root_mut().set_pos(1.0, 2.0, 3.0);
    let g = s.add_group(ROOT);
    s.node(g).set_pos(10.0, 0.0, 0.0).set_scale(2.0, 2.0, 2.0);
    let mats: Vec<MatId> = (0..6u32)
        .map(|i| s.add_material(Material::lambert(0x10_0000 * (i + 1))))
        .collect();
    let boxm = s.add_mesh_multi(g, Prim::bx(1.0, 1.0, 1.0), mats.clone());
    s.node(boxm).set_pos(0.0, 1.0, 0.0);
    s.shadows(boxm, true, false);
    s.render_order(boxm, 7);
    let tri_mat = s.add_material(Material::standard(0x20_4060, 0.25, 0.75));
    let tri = s.add_mesh_id(ROOT, Geo::body(Tri(1.0)), tri_mat);
    s.node(tri).set_pos(0.0, 0.0, 5.0);
    s.shadows(tri, false, true);
    s.render_order(tri, -3);
    let spr_mat = s.add_material(Material::new(MaterialKind::Sprite, None));
    let spr = s.sprite(g, spr_mat);
    s.node(spr).set_pos(0.0, 0.0, 1.0);
    s.render_order(spr, 11);
    // hidden: a group with a mesh and a sprite under it, and a hidden mesh
    let hidden = s.add_group(ROOT);
    s.node(hidden).visible = false;
    s.add_mesh_id(hidden, Prim::bx(1.0, 1.0, 1.0), tri_mat);
    s.sprite(hidden, spr_mat);
    let hm = s.add_mesh_id(g, Prim::bx(2.0, 2.0, 2.0), tri_mat);
    s.node(hm).visible = false;
    Fixture {
        s,
        boxm,
        tri,
        spr,
        mats,
        tri_mat,
        spr_mat,
    }
}

#[test]
fn gpu_export_checks_every_field_against_hand_computed_values() {
    let f = export_fixture();
    let ex = f.s.export_gpu(None);
    assert_eq!(
        ex.meshes.iter().map(|m| m.node).collect::<Vec<_>>(),
        vec![f.boxm, f.tri],
        "hidden mesh / hidden sub-tree are skipped, traverse order kept"
    );
    assert_eq!(
        ex.sprites.iter().map(|m| m.node).collect::<Vec<_>>(),
        vec![f.spr]
    );

    // the box: T(1,2,3)·T(10,0,0)·S(2)·T(0,1,0) = T(11,4,3)·S(2)
    let b = &ex.meshes[0];
    assert_eq!(b.world, ts(11.0, 4.0, 3.0, 2.0));
    assert_eq!(b.topology, Topology::Triangles);
    assert_eq!((b.cast_shadow, b.receive_shadow), (true, false));
    assert_eq!(b.render_order, 7);
    // BoxGeometry(1,1,1): 24 vertices, 36 indices, +x face first
    assert_eq!(b.positions.len(), 72);
    assert_eq!(b.normals.len(), 72);
    assert_eq!(&b.normals[..3], &[1.0, 0.0, 0.0]);
    assert_eq!(b.uvs.len(), 48);
    assert_eq!(&b.uvs[..4], &[0.0, 1.0, 1.0, 1.0]);
    assert!(b.indexed);
    assert_eq!(b.indices.len(), 36);
    assert_eq!(&b.indices[..6], &[0, 2, 1, 2, 3, 1]);
    assert!(b.colors.is_none());
    assert_eq!(b.material.hex(), 0x10_0000);
    assert!(b.material_array);
    assert_eq!(b.groups.len(), 6);
    for (i, g) in b.groups.iter().enumerate() {
        let i32_ = u32::try_from(i).expect("i");
        assert_eq!((g.start, g.count), (6 * i32_, 6), "group {i}");
        assert_eq!(g.slot, f.mats[i]);
        assert_eq!(g.material.hex(), 0x10_0000 * (i32_ + 1));
    }
    assert!(matches!(b.geometry_key, GeometryKey::Prim(_)));

    // the triangle body: T(1,2,3)·T(0,0,5), non-indexed, no normals / uvs
    let t = &ex.meshes[1];
    assert_eq!(t.world, ts(1.0, 2.0, 8.0, 1.0));
    assert_eq!((t.cast_shadow, t.receive_shadow), (false, true));
    assert_eq!(t.render_order, -3);
    assert_eq!(
        t.positions,
        vec![0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 1.0, 0.0]
    );
    assert!(t.normals.is_empty() && t.uvs.is_empty());
    assert!(!t.indexed);
    assert_eq!(t.indices, vec![0, 1, 2]);
    assert!(!t.material_array);
    assert!(t.groups.is_empty());
    assert_eq!(t.material, f.s.materials[f.tri_mat]);
    assert_eq!(t.material.hex(), 0x20_4060);
    assert_eq!((t.material.metalness, t.material.roughness), (0.25, 0.75));
    assert_eq!(
        t.base_color,
        Color::from_hex(0x20_4060).to_f32(),
        "linear colour"
    );
    assert_eq!(t.geometry_key, GeometryKey::Body);

    // the sprite: T(1,2,3)·T(10,0,0)·S(2)·T(0,0,1) = T(11,2,5)·S(2)
    let sp = &ex.sprites[0];
    assert_eq!(sp.world, ts(11.0, 2.0, 5.0, 2.0));
    assert_eq!(sp.render_order, 11);
    assert_eq!(sp.material, f.s.materials[f.spr_mat]);
    assert_eq!(sp.base_color, [1.0, 1.0, 1.0]);

    // under a parent T(100,0,0): every world matrix moves by +100 in x
    let moved = f.s.export_gpu(Some(&Mat4::compose(
        Vec3::new(100.0, 0.0, 0.0),
        Quat::default(),
        Vec3::new(1.0, 1.0, 1.0),
    )));
    assert_eq!(moved.meshes[0].world, ts(111.0, 4.0, 3.0, 2.0));
    assert_eq!(moved.meshes[1].world, ts(101.0, 2.0, 8.0, 1.0));
    assert_eq!(moved.sprites[0].world, ts(111.0, 2.0, 5.0, 2.0));

    // a hidden root hides everything
    let mut hidden = f.s.clone();
    hidden.root_mut().visible = false;
    assert_eq!(hidden.export_gpu(None), GpuExport::default());
}

#[test]
fn gpu_export_of_real_models_keeps_topology_buffers_and_sharing_keys() {
    let model = crate::models::wonders::build_wonder_model(
        "koloseum",
        crate::models::wonders::WonderModelOptions {
            ruin: false,
            owner_color: Some(0x00c8_3030),
        },
    );
    let out = model.export_gpu(None);
    assert_eq!(out.meshes.len(), model.mesh_count());
    assert!(out.sprites.is_empty());
    for g in &out.meshes {
        assert_eq!(g.topology, Topology::Triangles);
        assert_eq!(g.indices.len() % 3, 0);
        assert!(matches!(g.geometry_key, GeometryKey::Prim(_)));
    }
    // a line loop (city outline) is exported with its topology
    let (outline, _) =
        crate::models::cities::build_city_map_outline(0, 0, 0.1, Some(0x00ff_0000), false);
    let lines = outline.export_gpu(None).meshes;
    assert_eq!(lines.len(), 2);
    assert!(lines.iter().all(|l| l.topology == Topology::LineLoop));
    assert!(lines.iter().all(|l| l.indices == vec![0, 1, 2, 3, 4, 5]));
    // a shared decor buffer keeps its pointer as sharing key and its colours
    let las = crate::decor::forest::build_las(2);
    let ex = las.export_gpu(None).meshes;
    assert_eq!(ex.len(), 1);
    assert!(matches!(ex[0].geometry_key, GeometryKey::Buffer(_)));
    assert_eq!(
        ex[0].colors.as_ref().map(Vec::len),
        Some(ex[0].positions.len())
    );
}

#[test]
fn mesh_root_and_named_build_a_one_node_scene() {
    let g = Arc::new(Geometry::from(Prim::bx(1.0, 1.0, 1.0).build()));
    let s = Scene::mesh_root(Arc::clone(&g), Material::lambert(0x00ff_00ff)).named("x");
    assert_eq!(s.nodes.len(), 1);
    assert!(s.nodes[ROOT].is_mesh());
    assert_eq!(s.nodes[ROOT].name, "x");
    assert!(s.nodes[ROOT]
        .mesh()
        .and_then(|m| m.geo.buffer())
        .is_some_and(|b| Arc::ptr_eq(b, &g)));
    assert_eq!(s.material_of(ROOT).map(Material::hex), Some(0x00ff_00ff));
}
