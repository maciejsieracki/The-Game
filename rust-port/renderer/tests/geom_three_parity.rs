//! Numeric parity of `civ_renderer::geom` with Three.js r169 (0.169.0).
//!
//! Reference buffers in `tests/fixtures/geom/*.json` were produced by
//! `tests/fixtures/geom/gen_fixtures.mjs` running the real Three.js 0.169.0
//! (provenance: `dyspozycje/rust-port/p4/P4-8-GEOMETRY-PRIMS.md`).
//! Float attributes must match within 1e-6 (absolute), indices and material
//! groups exactly.

use civ_renderer::geom::{
    self, merge_geometries, CatmullRomCurve3, CurveType, Euler, EulerOrder, ExtrudeOptions, Mat4,
    Mesh, Path2, Shape, Vec3,
};
use std::collections::BTreeMap;
use std::f64::consts::PI;

const TOL: f64 = 1e-6;

// ------------------------------------------------------------ mini JSON

#[derive(Debug, Clone)]
enum J {
    Null,
    Bool(bool),
    Num(f64),
    Str(String),
    Arr(Vec<J>),
    Obj(BTreeMap<String, J>),
}

struct Parser<'a> {
    s: &'a [u8],
    i: usize,
}

impl Parser<'_> {
    fn ws(&mut self) {
        while self.i < self.s.len() && (self.s[self.i] as char).is_ascii_whitespace() {
            self.i += 1;
        }
    }
    fn lit(&mut self, l: &str) {
        assert!(
            self.s[self.i..].starts_with(l.as_bytes()),
            "bad literal at {}",
            self.i
        );
        self.i += l.len();
    }
    fn value(&mut self) -> J {
        self.ws();
        match self.s[self.i] {
            b'n' => {
                self.lit("null");
                J::Null
            }
            b't' => {
                self.lit("true");
                J::Bool(true)
            }
            b'f' => {
                self.lit("false");
                J::Bool(false)
            }
            b'"' => J::Str(self.string()),
            b'[' => {
                self.i += 1;
                let mut v = Vec::new();
                self.ws();
                if self.s[self.i] == b']' {
                    self.i += 1;
                    return J::Arr(v);
                }
                loop {
                    v.push(self.value());
                    self.ws();
                    let c = self.s[self.i];
                    self.i += 1;
                    if c == b']' {
                        return J::Arr(v);
                    }
                    assert_eq!(c, b',', "expected , at {}", self.i);
                }
            }
            b'{' => {
                self.i += 1;
                let mut m = BTreeMap::new();
                self.ws();
                if self.s[self.i] == b'}' {
                    self.i += 1;
                    return J::Obj(m);
                }
                loop {
                    self.ws();
                    let k = self.string();
                    self.ws();
                    assert_eq!(self.s[self.i], b':');
                    self.i += 1;
                    let v = self.value();
                    m.insert(k, v);
                    self.ws();
                    let c = self.s[self.i];
                    self.i += 1;
                    if c == b'}' {
                        return J::Obj(m);
                    }
                    assert_eq!(c, b',', "expected , at {}", self.i);
                }
            }
            _ => {
                let st = self.i;
                while self.i < self.s.len()
                    && matches!(
                        self.s[self.i],
                        b'-' | b'+' | b'.' | b'e' | b'E' | b'0'..=b'9'
                    )
                {
                    self.i += 1;
                }
                let t = std::str::from_utf8(&self.s[st..self.i]).unwrap();
                J::Num(t.parse().unwrap_or_else(|_| panic!("bad number {t}")))
            }
        }
    }
    fn string(&mut self) -> String {
        assert_eq!(self.s[self.i], b'"');
        self.i += 1;
        let st = self.i;
        while self.s[self.i] != b'"' {
            assert_ne!(self.s[self.i], b'\\', "escapes not used by the fixtures");
            self.i += 1;
        }
        let out = std::str::from_utf8(&self.s[st..self.i])
            .unwrap()
            .to_string();
        self.i += 1;
        out
    }
}

fn parse(text: &str) -> J {
    let mut p = Parser {
        s: text.as_bytes(),
        i: 0,
    };
    p.value()
}

impl J {
    fn get(&self, k: &str) -> Option<&J> {
        match self {
            J::Obj(m) => m.get(k),
            _ => None,
        }
    }
    fn at(&self, k: &str) -> &J {
        self.get(k).unwrap_or_else(|| panic!("missing key {k}"))
    }
    fn arr(&self) -> &[J] {
        match self {
            J::Arr(v) => v,
            _ => panic!("not an array: {self:?}"),
        }
    }
    fn f(&self) -> f64 {
        match self {
            J::Num(x) => *x,
            J::Null => f64::NAN,
            _ => panic!("not a number: {self:?}"),
        }
    }
    #[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
    fn u(&self) -> u32 {
        let x = self.f();
        assert!(x >= 0.0 && x.fract() == 0.0, "not a u32: {x}");
        x as u32
    }
    fn b(&self) -> bool {
        match self {
            J::Bool(b) => *b,
            _ => panic!("not a bool: {self:?}"),
        }
    }
    fn s(&self) -> &str {
        match self {
            J::Str(s) => s,
            _ => panic!("not a string: {self:?}"),
        }
    }
    fn opt_f(&self, k: &str) -> Option<f64> {
        self.get(k).map(J::f)
    }
}

// ------------------------------------------------------------ builders

fn pts2(j: &J) -> Vec<(f64, f64)> {
    j.arr()
        .iter()
        .map(|p| (p.arr()[0].f(), p.arr()[1].f()))
        .collect()
}

fn path(pts: &[(f64, f64)], close: bool) -> Path2 {
    let mut p = Path2::from_points(pts);
    if close {
        p.close_path();
    }
    p
}

fn shape(j: &J) -> Shape {
    let close = j.get("close").is_none_or(J::b);
    Shape {
        outline: path(&pts2(j.at("outline")), close),
        holes: j
            .get("holes")
            .map(|h| h.arr().iter().map(|h| path(&pts2(h), close)).collect())
            .unwrap_or_default(),
    }
}

fn extrude_options(o: &J) -> ExtrudeOptions {
    // Same defaulting as ExtrudeGeometry.addShape.
    let bevel_thickness = o.opt_f("bevelThickness").unwrap_or(0.2);
    ExtrudeOptions {
        steps: o.get("steps").map_or(1, J::u),
        depth: o.opt_f("depth").unwrap_or(1.0),
        bevel_enabled: o.get("bevelEnabled").is_none_or(J::b),
        bevel_thickness,
        bevel_size: o.opt_f("bevelSize").unwrap_or(bevel_thickness - 0.1),
        bevel_offset: o.opt_f("bevelOffset").unwrap_or(0.0),
        bevel_segments: o.get("bevelSegments").map_or(3, J::u),
    }
}

fn order(s: &str) -> EulerOrder {
    match s {
        "XYZ" => EulerOrder::Xyz,
        "YXZ" => EulerOrder::Yxz,
        "ZXY" => EulerOrder::Zxy,
        "ZYX" => EulerOrder::Zyx,
        "YZX" => EulerOrder::Yzx,
        "XZY" => EulerOrder::Xzy,
        _ => panic!("order {s}"),
    }
}

fn apply_op(m: &mut Mesh, op: &[J]) {
    let v = |i: usize| op[i].f();
    match op[0].s() {
        "rotateX" => {
            m.rotate_x(v(1));
        }
        "rotateY" => {
            m.rotate_y(v(1));
        }
        "rotateZ" => {
            m.rotate_z(v(1));
        }
        "translate" => {
            m.translate(v(1), v(2), v(3));
        }
        "scale" => {
            m.scale(v(1), v(2), v(3));
        }
        "trs" => {
            let mat = Mat4::from_trs(
                Vec3::new(v(1), v(2), v(3)),
                Euler {
                    x: v(4),
                    y: v(5),
                    z: v(6),
                    order: order(op[7].s()),
                },
                Vec3::new(v(8), v(9), v(10)),
            );
            m.apply_matrix4(&mat);
        }
        "computeVertexNormals" => {
            m.compute_vertex_normals();
        }
        other => panic!("op {other}"),
    }
}

#[allow(clippy::too_many_lines)]
fn build(kind: &str, a: &J) -> Mesh {
    let f = |i: usize| a.arr()[i].f();
    let u = |i: usize| a.arr()[i].u();
    let b = |i: usize| a.arr()[i].b();
    match kind {
        "box" => geom::box_geometry(f(0), f(1), f(2), u(3), u(4), u(5)),
        "plane" => geom::plane_geometry(f(0), f(1), u(2), u(3)),
        "cylinder" => geom::cylinder_geometry(f(0), f(1), f(2), u(3), u(4), b(5), f(6), f(7)),
        "cone" => geom::cone_geometry(f(0), f(1), u(2), u(3), b(4), f(5), f(6)),
        "sphere" => geom::sphere_geometry(f(0), u(1), u(2), f(3), f(4), f(5), f(6)),
        "torus" => geom::torus_geometry(f(0), f(1), u(2), u(3), f(4)),
        "circle" => geom::circle_geometry(f(0), u(1), f(2), f(3)),
        "ring" => geom::ring_geometry(f(0), f(1), u(2), u(3), f(4), f(5)),
        "icosahedron" => geom::icosahedron_geometry(f(0), u(1)),
        "dodecahedron" => geom::dodecahedron_geometry(f(0), u(1)),
        "octahedron" => geom::octahedron_geometry(f(0), u(1)),
        "tetrahedron" => geom::tetrahedron_geometry(f(0), u(1)),
        "shape" => geom::shape_geometry(&shape(a)),
        "shape_multi" => {
            let shapes: Vec<Shape> = a.at("shapes").arr().iter().map(shape).collect();
            geom::shape_geometry_multi(&shapes)
        }
        "extrude" => {
            let shapes: Vec<Shape> = a.at("shapes").arr().iter().map(shape).collect();
            geom::extrude_geometry(&shapes, &extrude_options(a.at("options")))
        }
        "tube" => {
            let points = a
                .at("points")
                .arr()
                .iter()
                .map(|p| Vec3::new(p.arr()[0].f(), p.arr()[1].f(), p.arr()[2].f()))
                .collect();
            let ct = match a.at("curveType").s() {
                "centripetal" => CurveType::Centripetal,
                "chordal" => CurveType::Chordal,
                "catmullrom" => CurveType::CatmullRom,
                other => panic!("curveType {other}"),
            };
            let curve =
                CatmullRomCurve3::new(points, a.at("curveClosed").b(), ct, a.at("tension").f());
            geom::tube_geometry(
                &curve,
                a.at("tubularSegments").u(),
                a.at("radius").f(),
                a.at("radialSegments").u(),
                a.at("closed").b(),
            )
        }
        "transform" => {
            let base = a.at("base");
            let mut m = build(base.at("kind").s(), base.at("args"));
            for op in a.at("ops").arr() {
                apply_op(&mut m, op.arr());
            }
            m
        }
        "merge" => {
            let parts: Vec<Mesh> = a
                .at("parts")
                .arr()
                .iter()
                .map(|p| build(p.at("kind").s(), p.at("args")))
                .collect();
            let refs: Vec<&Mesh> = parts.iter().collect();
            merge_geometries(&refs, a.at("useGroups").b()).expect("merge")
        }
        other => panic!("unknown kind {other}"),
    }
}

// ------------------------------------------------------------ comparison

fn cmp_f(case: &str, attr: &str, got: &[f32], want: &J) -> f64 {
    let want = want.arr();
    assert_eq!(got.len(), want.len(), "{case}: {attr} length");
    let mut max = 0.0_f64;
    for (i, (g, w)) in got.iter().zip(want).enumerate() {
        let g = f64::from(*g);
        let w = w.f();
        if w.is_nan() || g.is_nan() {
            assert!(
                w.is_nan() && g.is_nan(),
                "{case}: {attr}[{i}] got {g} want {w} (NaN mismatch)"
            );
            continue;
        }
        let d = (g - w).abs();
        assert!(
            d <= TOL,
            "{case}: {attr}[{i}] got {g} want {w} (|d| = {d:e})"
        );
        max = max.max(d);
    }
    max
}

fn check_family(file: &str) -> usize {
    let path = format!("{}/tests/fixtures/geom/{file}", env!("CARGO_MANIFEST_DIR"));
    let text = std::fs::read_to_string(&path).unwrap_or_else(|e| panic!("{path}: {e}"));
    let root = parse(&text);
    assert_eq!(root.at("three").s(), "0.169.0");
    let cases = root.at("cases").arr();
    assert!(!cases.is_empty());
    for c in cases {
        let name = format!("{file}:{}", c.at("name").s());
        let m = build(c.at("kind").s(), c.at("args"));
        let dp = cmp_f(&name, "position", &m.positions, c.at("position"));
        let dn = cmp_f(&name, "normal", &m.normals, c.at("normal"));
        let du = cmp_f(&name, "uv", &m.uvs, c.at("uv"));
        match c.at("index") {
            J::Null => assert!(m.indices.is_none(), "{name}: expected non-indexed"),
            idx => {
                let want: Vec<u32> = idx.arr().iter().map(J::u).collect();
                assert_eq!(m.indices.as_ref(), Some(&want), "{name}: index");
            }
        }
        let want_groups: Vec<(u32, u32, u32)> = c
            .at("groups")
            .arr()
            .iter()
            .map(|g| (g.arr()[0].u(), g.arr()[1].u(), g.arr()[2].u()))
            .collect();
        let got_groups: Vec<(u32, u32, u32)> = m
            .groups
            .iter()
            .map(|g| (g.start, g.count, g.material_index))
            .collect();
        assert_eq!(got_groups, want_groups, "{name}: groups");
        // Determinism: the same inputs give the same bits.
        let again = build(c.at("kind").s(), c.at("args"));
        let bits = |v: &[f32]| v.iter().map(|x| x.to_bits()).collect::<Vec<_>>();
        assert_eq!(
            bits(&again.positions),
            bits(&m.positions),
            "{name}: det pos"
        );
        assert_eq!(bits(&again.normals), bits(&m.normals), "{name}: det nor");
        assert_eq!(bits(&again.uvs), bits(&m.uvs), "{name}: det uv");
        assert_eq!(again.indices, m.indices, "{name}: det idx");
        println!(
            "{name}: verts={} tris={} max|d| pos={dp:e} nor={dn:e} uv={du:e}",
            m.vertex_count(),
            m.triangle_count()
        );
    }
    cases.len()
}

macro_rules! family_test {
    ($name:ident, $file:literal, $min:literal) => {
        #[test]
        fn $name() {
            let n = check_family($file);
            assert!(n >= $min, "{} has {n} cases, expected >= {}", $file, $min);
        }
    };
}

family_test!(parity_box, "box.json", 6);
family_test!(parity_plane, "plane.json", 3);
family_test!(parity_cylinder, "cylinder.json", 10);
family_test!(parity_cone, "cone.json", 5);
family_test!(parity_sphere, "sphere.json", 9);
family_test!(parity_torus, "torus.json", 5);
family_test!(parity_circle, "circle.json", 5);
family_test!(parity_ring, "ring.json", 5);
family_test!(parity_polyhedron, "polyhedron.json", 10);
family_test!(parity_shape, "shape.json", 9);
family_test!(parity_extrude, "extrude.json", 6);
family_test!(parity_tube, "tube.json", 6);
family_test!(parity_ops, "ops.json", 11);

// ------------------------------------------------------------ API checks

#[test]
fn index_buffer_covers_non_indexed_meshes() {
    let ico = geom::icosahedron_geometry(1.0, 0);
    assert!(ico.indices.is_none());
    assert_eq!(ico.index_buffer(), (0..60).collect::<Vec<u32>>());
    assert_eq!(ico.triangle_count(), 20);
    let bx = geom::box_geometry(1.0, 1.0, 1.0, 1, 1, 1);
    assert_eq!(Some(bx.index_buffer()), bx.indices);
}

#[test]
fn merge_rejects_mixed_indexing() {
    let a = geom::box_geometry(1.0, 1.0, 1.0, 1, 1, 1);
    let b = geom::icosahedron_geometry(1.0, 0);
    assert_eq!(
        merge_geometries(&[&a, &b], false),
        Err(geom::ops::MergeError::IndexMismatch(1))
    );
    assert_eq!(
        merge_geometries(&[], false),
        Err(geom::ops::MergeError::Empty)
    );
}

#[test]
fn trs_matches_manual_composition() {
    // T * R * S applied to a point equals translate(rotate(scale(p))).
    let m = Mat4::from_trs(
        Vec3::new(1.0, 2.0, 3.0),
        Euler::xyz(0.0, PI / 2.0, 0.0),
        Vec3::new(2.0, 2.0, 2.0),
    );
    let p = Vec3::new(1.0, 0.0, 0.0).apply_mat4(&m);
    assert!((p.x - 1.0).abs() < 1e-12);
    assert!((p.y - 2.0).abs() < 1e-12);
    assert!((p.z - 1.0).abs() < 1e-12);
    let chained = Mat4::translation(1.0, 2.0, 3.0)
        .mul(&Mat4::rotation_y(PI / 2.0))
        .mul(&Mat4::scaling(2.0, 2.0, 2.0));
    for (a, b) in m.e.iter().zip(chained.e.iter()) {
        assert!((a - b).abs() < 1e-12);
    }
}
