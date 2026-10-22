//! Bit parity of `civ_renderer::models::units_kamien` (MOD-05 Stone,
//! R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1) with the web unit models.
//!
//! Reference: `tests/fixtures/units_kamien/units_kamien.json`, produced by
//! RUNNING the web builders of `edb8fb56` with three@0.169.0 / node v22.22.0
//! (`tests/fixtures/units_kamien/gen.ts`, README there). Every float is
//! compared with `to_bits()`; any difference is a failure (no tolerance).
//! The record format is the one of `tests/fixtures/unit_core` (P4.13).

#[path = "unit_core_json.rs"]
mod json;

// P4.27 (R-RUSTPORT-P4-27-SCENE-UNIFY-Q1): forced type adjustments only —
// `mesh()` / `material()` / `tracked()` are accessors of the one scene type,
// colours are stored linear (`hex()` = `getHex()`), module bodies are
// `Geo::Body`; every assertion is unchanged.
use civ_renderer::geom::Vec3;
use civ_renderer::models::unit_core::model::{
    celtic_retint, geo_hash, Geo, HexRing, LeafBlade, Material, Prim,
};
use civ_renderer::models::unit_core::registry::{pending, Package};
use civ_renderer::models::unit_core::{
    build_base, build_category_model, build_model, legacy_route, model_for, Base, UnitCategory,
    UnitModel, UnitTypeId,
};
use civ_renderer::models::units_braz::geo::BrazGeo;
use civ_renderer::models::units_kamien;
use civ_renderer::models::units_kamien::geo::KamienGeo;
use civ_renderer::models::units_kamien::kit::js_asin;
use civ_renderer::models::units_zelazo::geo::ZelazoGeo;
use json::{parse, J};

const OWNER_A: u32 = 0x00d0_3030;
const OWNER_B: u32 = 0x002a_6fdb;

/// The ten builders of the package: web export → registry builder.
const BUILDERS: [(&str, Base); 10] = [
    ("buildWojownikOpus5", Base::WojownikOpus5),
    ("buildOszczepnikOpus5", Base::OszczepnikOpus5),
    ("buildLucznikOpus5", Base::LucznikOpus5),
    ("buildZwiadowcaOpus5", Base::ZwiadowcaOpus5),
    ("buildMaceWarriorOpus5", Base::MaceWarrior),
    ("buildInkaJavelineerOpus5", Base::InkaJavelineer),
    ("buildZuluJavelineerOpus5", Base::ZuluJavelineer),
    ("buildBatteringRamOpus5", Base::BatteringRam),
    ("buildEgyptianArcherOpus5", Base::EgyptianArcher),
    ("buildSumerianArcherOpus5", Base::SumerianArcher),
];

fn kamien_fixture() -> J {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/units_kamien/units_kamien.json"
    );
    parse(&std::fs::read_to_string(path).expect("fixture"))
}

fn base_of(web_fn: &str) -> Base {
    BUILDERS
        .iter()
        .find(|(f, _)| *f == web_fn)
        .unwrap_or_else(|| panic!("unknown builder {web_fn}"))
        .1
}

fn record<'a>(fx: &'a J, pl: &str) -> &'a J {
    fx.at("records")
        .arr()
        .iter()
        .find(|r| r.at("pl").s() == pl)
        .unwrap_or_else(|| panic!("record {pl}"))
}

/// Rust counterpart of every fixture case id.
fn rust_case(fx: &J, id: &str) -> UnitModel {
    if let Some(rest) = id.strip_prefix("fn:") {
        let (f, owner) = match rest.split_once('@') {
            Some((f, "B")) => (f, OWNER_B),
            Some(_) => panic!("owner suffix"),
            None => (rest, OWNER_A),
        };
        return build_base(base_of(f), owner).expect("MOD-05 builder is ported");
    }
    if let Some(pl) = id.strip_prefix("unit:") {
        // D-MOD-9 = A: the game resolves the type id through the rule table.
        let r = record(fx, pl);
        let rule = model_for(&UnitTypeId::new(pl)).expect("in table");
        assert_eq!(rule.base.package(), Package::Mod05Stone, "{pl}");
        assert_eq!(
            legacy_route(r.at("category").s(), Some(pl)),
            rule,
            "{pl}: rule table vs legacy route"
        );
        return build_model(rule, OWNER_A).expect("ported");
    }
    if let Some(pl) = id.strip_prefix("unitEn:") {
        // web `buildUnitModel(cat, owner, EN name)` (battle fallback path)
        let r = record(fx, pl);
        let en = r.at("en").s();
        let id = legacy_route(r.at("category").s(), Some(en));
        return build_model(id, OWNER_A).expect("ported");
    }
    panic!("no Rust mapping for fixture case {id}");
}

/// `geometry.type` of the Three class the web builder allocates for `geo`
/// (exhaustive over the parametric primitives; module bodies by type).
/// P4.27: `Prim::HexRing/LeafBlade/Kamien/Braz/Zelazo` became module bodies
/// (`Geo::Body`) — forced type adjustment, same mapping.
fn three_type(geo: &Geo) -> &'static str {
    match geo {
        Geo::Prim(p) => match p {
            Prim::Box { .. } => "BoxGeometry",
            Prim::Cylinder { .. } => "CylinderGeometry",
            Prim::Cone { .. } => "ConeGeometry",
            Prim::Sphere { .. } => "SphereGeometry",
            Prim::Torus { .. } => "TorusGeometry",
            Prim::Icosahedron { .. } => "IcosahedronGeometry",
            other => panic!("primitive not produced by unit builders: {other:?}"),
        },
        Geo::Body(_) => {
            if geo.body_as::<HexRing>().is_some() {
                "ShapeGeometry"
            } else if geo.body_as::<LeafBlade>().is_some() {
                "BufferGeometry"
            } else if let Some(k) = geo.body_as::<KamienGeo>() {
                match k {
                    KamienGeo::Taper { .. }
                    | KamienGeo::NguniShell { .. }
                    | KamienGeo::NguniFace { .. } => "BufferGeometry",
                    KamienGeo::Circle { .. } => "CircleGeometry",
                }
            } else if let Some(b) = geo.body_as::<BrazGeo>() {
                b.three_type()
            } else if let Some(z) = geo.body_as::<ZelazoGeo>() {
                z.three_type()
            } else {
                panic!("unknown module body {geo:?}")
            }
        }
        Geo::Buffer(_) => panic!("unit builders allocate no shared buffers"),
    }
}

fn f64_bits(v: &[f64]) -> Vec<u64> {
    v.iter().map(|x| x.to_bits()).collect()
}

struct Cmp {
    errs: Vec<String>,
    values: usize,
}

impl Cmp {
    fn bits(&mut self, what: &str, rust: &[u64], web: &[u64]) {
        self.values += web.len();
        if rust != web {
            let first = rust
                .iter()
                .zip(web)
                .position(|(a, b)| a != b)
                .unwrap_or(usize::MAX);
            self.errs.push(format!(
                "{what}: rust {:?} web {:?} (first diff at {first}, lens {} / {})",
                rust.iter().map(|b| f64::from_bits(*b)).collect::<Vec<_>>(),
                web.iter().map(|b| f64::from_bits(*b)).collect::<Vec<_>>(),
                rust.len(),
                web.len()
            ));
        }
    }
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, what: &str, rust: T, web: T) {
        self.values += 1;
        if rust != web {
            self.errs.push(format!("{what}: rust {rust:?} web {web:?}"));
        }
    }
}

fn material_check(c: &mut Cmp, what: &str, m: &Material, w: &J) {
    c.eq(&format!("{what}.color"), m.hex(), w.at("color").u());
    let lin = m.linear_color();
    c.bits(
        &format!("{what}.lin"),
        &f64_bits(&[lin.r, lin.g, lin.b]),
        &w.at("lin").bits(),
    );
    c.bits(
        &format!("{what}.metalness"),
        &[m.metalness.to_bits()],
        &w.at("metalness").bits(),
    );
    c.bits(
        &format!("{what}.roughness"),
        &[m.roughness.to_bits()],
        &w.at("roughness").bits(),
    );
    c.eq(
        &format!("{what}.transparent"),
        m.transparent,
        w.at("transparent").b(),
    );
    c.bits(
        &format!("{what}.opacity"),
        &[m.opacity.to_bits()],
        &w.at("opacity").bits(),
    );
    c.eq(
        &format!("{what}.flatShading"),
        m.flat_shading,
        w.at("flatShading").b(),
    );
}

fn compare_model(c: &mut Cmp, id: &str, m: &UnitModel, w: &J) {
    let order = m.traverse();
    let nodes = w.at("nodes").arr();
    c.eq(&format!("{id}: node count"), order.len(), nodes.len());
    let world = m.world_matrices(None);
    let pos_of = |n: usize| order.iter().position(|&x| x == n);
    for (k, (&nid, wn)) in order.iter().zip(nodes).enumerate() {
        let n = &m.nodes[nid];
        let tag = format!("{id}#{k}");
        c.eq(
            &format!("{tag}.kind"),
            if n.mesh().is_some() { "mesh" } else { "group" },
            wn.at("kind").s(),
        );
        c.eq(&format!("{tag}.name"), n.name.as_str(), wn.at("name").s());
        let parent = n
            .parent
            .and_then(pos_of)
            .map_or(-1, |p| i64::try_from(p).unwrap());
        c.eq(&format!("{tag}.parent"), parent, wn.at("parent").i());
        c.bits(
            &format!("{tag}.p"),
            &f64_bits(&[n.position.x, n.position.y, n.position.z]),
            &wn.at("p").bits(),
        );
        let q = n.quaternion;
        c.bits(
            &format!("{tag}.q"),
            &f64_bits(&[q.x, q.y, q.z, q.w]),
            &wn.at("q").bits(),
        );
        c.bits(
            &format!("{tag}.s"),
            &f64_bits(&[n.scale.x, n.scale.y, n.scale.z]),
            &wn.at("s").bits(),
        );
        c.bits(
            &format!("{tag}.w"),
            &f64_bits(&world[nid].e),
            &wn.at("w").bits(),
        );
        if let Some(md) = n.mesh() {
            let g = md.geo.build();
            let wg = wn.at("geo");
            c.eq(
                &format!("{tag}.geo.vtx"),
                g.vertex_count(),
                wg.at("vtx").u() as usize,
            );
            c.eq(
                &format!("{tag}.geo.tri"),
                g.triangle_count(),
                wg.at("tri").u() as usize,
            );
            c.eq(&format!("{tag}.geo.hash"), geo_hash(&g), wg.at("hash").u());
            c.eq(
                &format!("{tag}.geo.type"),
                three_type(&md.geo),
                wg.at("type").s(),
            );
            material_check(
                c,
                &format!("{tag}.mat"),
                &m.materials[md.material()],
                wn.at("mat"),
            );
            let idx = m
                .tracked()
                .iter()
                .position(|&t| t == md.material())
                .map_or(-1, |p| i64::try_from(p).unwrap());
            c.eq(&format!("{tag}.matIndex"), idx, wn.at("matIndex").i());
        }
    }
    let mats = w.at("mats").arr();
    c.eq(&format!("{id}: mats count"), m.tracked().len(), mats.len());
    for (k, (&t, wm)) in m.tracked().iter().zip(mats).enumerate() {
        material_check(c, &format!("{id}.mats[{k}]"), &m.materials[t], wm);
    }
    let [lo, hi]: [Vec3; 2] = m.bbox();
    c.bits(
        &format!("{id}: bbox"),
        &f64_bits(&[lo.x, lo.y, lo.z, hi.x, hi.y, hi.z]),
        &w.at("bbox").bits(),
    );
    let s = m.signature();
    c.eq(&format!("{id}: meshes"), s.meshes, w.at("meshes").u());
    c.eq(&format!("{id}: tris"), s.tris, w.at("tris").u());
    c.eq(&format!("{id}: sig"), s.sig, w.at("sig").u());
    c.eq(
        &format!("{id}: celticRetint"),
        celtic_retint(m).is_none(),
        w.at("celticRetint").is_null(),
    );
    // every geometry of the package is a module singleton: perTokenGeos = []
    c.eq(&format!("{id}: perTokenGeos"), 0, w.at("perTokenGeos").u());
}

#[test]
fn every_web_case_is_reproduced_bit_for_bit() {
    let fx = kamien_fixture();
    let mut c = Cmp {
        errs: Vec::new(),
        values: 0,
    };
    let cases = fx.at("cases").obj();
    let mut per_kind = [0usize; 3];
    for (id, w) in cases {
        let m = rust_case(&fx, id);
        compare_model(&mut c, id, &m, w);
        let k = if id.starts_with("fn:") {
            0
        } else if id.starts_with("unit:") {
            1
        } else {
            2
        };
        per_kind[k] += 1;
    }
    println!(
        "units_kamien parity: {} cases (fn {} / unit PL {} / unit EN {}), {} values bit-exact checked, {} mismatches",
        cases.len(),
        per_kind[0],
        per_kind[1],
        per_kind[2],
        c.values,
        c.errs.len()
    );
    assert_eq!(cases.len(), 40, "fixture cases");
    assert_eq!(per_kind, [20, 10, 10]);
    assert!(
        c.errs.is_empty(),
        "{} mismatches:\n{}",
        c.errs.len(),
        c.errs
            .iter()
            .take(60)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn the_ten_records_cover_every_mod05_builder_and_counts_match_the_web() {
    let fx = kamien_fixture();
    let recs = fx.at("records").arr();
    assert_eq!(recs.len(), 10, "Stone records of units.json");
    let mut bases: Vec<Base> = recs
        .iter()
        .map(|r| {
            model_for(&UnitTypeId::new(r.at("pl").s()))
                .expect("in table")
                .base
        })
        .collect();
    bases.sort();
    let mut want: Vec<Base> = BUILDERS.iter().map(|(_, b)| *b).collect();
    want.sort();
    assert_eq!(bases, want, "one record per builder (D-MOD-9 = A)");
    for (f, b) in BUILDERS {
        let m = build_base(b, OWNER_A).expect("ported");
        let w = fx.at("cases").at(&format!("fn:{f}"));
        let s = m.signature();
        println!(
            "{f}: meshes {} tris {} vertices {} (web {} / {})",
            s.meshes,
            s.tris,
            m.meshes()
                .iter()
                .map(|&n| m.nodes[n].mesh().unwrap().geo.build().vertex_count())
                .sum::<usize>(),
            w.at("meshes").u(),
            w.at("tris").u()
        );
        assert_eq!((s.meshes, s.tris), (w.at("meshes").u(), w.at("tris").u()));
    }
}

#[test]
fn routing_no_longer_returns_not_yet_ported_for_the_stone_package() {
    // registry: every MOD-05 builder builds, none is pending
    let p = pending();
    assert!(p.iter().all(|b| b.package() != Package::Mod05Stone));
    let mut n = 0;
    for b in Base::ALL
        .iter()
        .copied()
        .filter(|b| b.package() == Package::Mod05Stone)
    {
        assert!(build_base(b, OWNER_A).is_ok(), "{b:?} must build");
        assert!(units_kamien::build(b, OWNER_B).is_some(), "{b:?}");
        n += 1;
    }
    assert_eq!(n, 10);
    // other packages are not built here
    assert!(units_kamien::build(Base::Falangita, OWNER_A).is_none());
    assert!(units_kamien::build(Base::CatTopor, OWNER_A).is_none());
    // buildCategoryModel cases delegating to MOD-05
    for label in [
        "lucznik",
        "oszczepnik",
        "zwiadowca",
        "obleznicza",
        "domyslny",
        "nieznana-kategoria",
    ] {
        let cat = UnitCategory::from_label(label);
        let m = build_category_model(cat, OWNER_A).unwrap_or_else(|e| panic!("{label}: {e}"));
        assert_eq!(
            m.signature(),
            build_base(cat.base(), OWNER_A).unwrap().signature(),
            "{label}"
        );
    }
    // `falanga` was the MOD-07 stub; since R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1
    // it builds `buildFalangita` (forced update of this stub assertion)
    assert_eq!(
        build_category_model(UnitCategory::Falanga, OWNER_A)
            .expect("ported")
            .signature(),
        build_base(Base::Falangita, OWNER_A).unwrap().signature()
    );
    // every Stone record of the rule table builds
    let fx = kamien_fixture();
    for r in fx.at("records").arr() {
        let id = model_for(&UnitTypeId::new(r.at("pl").s())).expect("in table");
        assert!(build_model(id, OWNER_A).is_ok(), "{}", r.at("pl").s());
    }
}

#[test]
fn unit_core_record_signatures_of_the_stone_records_match() {
    // independent cross-check against the P4.13 fixture (records[].sigPl/sigEn)
    let fx = json::fixture();
    let mut n = 0;
    for r in fx.at("records").arr() {
        let Some(epoka) = r.get("epoka") else {
            continue;
        };
        if epoka.is_null() || epoka.s() != "Kamie\u{144}" {
            continue;
        }
        let pl = r.at("pl").s();
        let id = model_for(&UnitTypeId::new(pl)).expect("in table");
        let s = build_model(id, OWNER_A).expect("ported").signature();
        for key in ["sigPl", "sigEn"] {
            let w = r.at(key);
            assert_eq!(
                (s.meshes, s.tris, s.sig),
                (w.at("meshes").u(), w.at("tris").u(), w.at("sig").u()),
                "{pl} {key}"
            );
        }
        n += 1;
    }
    assert_eq!(n, 10);
}

#[test]
fn asin_matches_v8() {
    let fx = kamien_fixture();
    let xs = fx.at("asin").at("x").bits();
    let ys = fx.at("asin").at("y").bits();
    assert_eq!(xs.len(), ys.len());
    let mut bad = Vec::new();
    for (&x, &y) in xs.iter().zip(&ys) {
        let r = js_asin(f64::from_bits(x));
        let w = f64::from_bits(y);
        let same = if w.is_nan() {
            r.is_nan()
        } else {
            r.to_bits() == y
        };
        if !same {
            bad.push((f64::from_bits(x), r, w));
        }
    }
    println!("asin: n={} mismatches={}", xs.len(), bad.len());
    assert!(bad.is_empty(), "{:?}", &bad[..bad.len().min(20)]);
}
