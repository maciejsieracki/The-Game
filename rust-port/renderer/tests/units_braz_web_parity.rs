//! Bit parity of `civ_renderer::models::units_braz` (MOD-06 Bronze,
//! R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1) with the web unit models.
//!
//! Reference: `tests/fixtures/units_braz/units_braz.json`, produced by
//! RUNNING the web builders of `edb8fb56` with three@0.169.0 / node v22.22.0
//! (`tests/fixtures/units_braz/gen.ts`, README there). Every float is
//! compared with `to_bits()`; any difference is a failure (no tolerance).
//! The record format is the one of `tests/fixtures/unit_core` (P4.13) and
//! `tests/fixtures/units_kamien` (P4.19). A case stored as `sameAs` (the
//! generator found its full web record identical to an earlier case) is
//! compared, in full, against the referenced web record.

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
    build_base, build_model, legacy_route, model_for, Base, UnitModel, UnitTypeId,
};
use civ_renderer::models::units_braz;
use civ_renderer::models::units_braz::geo::BrazGeo;
use civ_renderer::models::units_kamien::geo::KamienGeo;
use civ_renderer::models::units_zelazo::geo::ZelazoGeo;
use json::{parse, J};

const OWNER_A: u32 = 0x00d0_3030;
const OWNER_B: u32 = 0x002a_6fdb;

/// The 30 exported builders of the package: web export → registry builder.
const BUILDERS: [(&str, Base); 30] = [
    ("buildProcarzBrazOpus5", Base::ProcarzBrazOpus5),
    ("buildWlocznikBrazOpus5", Base::WlocznikBrazOpus5),
    ("buildMiecznikBrazOpus5", Base::MiecznikBrazOpus5),
    ("buildRydwanWolyBrazOpus5", Base::RydwanWolyBrazOpus5),
    ("buildKonnicaBrazOpus5", Base::KonnicaBrazOpus5),
    ("buildRydwanKonnyBrazOpus5", Base::RydwanKonnyBrazOpus5),
    (
        "buildRydwanKapadokijskiOpus5",
        Base::RydwanKapadokijskiOpus5,
    ),
    ("buildNubianArcherOpus5", Base::NubianArcherOpus5),
    ("buildTaranOkutyOpus5", Base::TaranOkutyOpus5),
    ("buildAxeWarriorInka", Base::AxeWarriorInka),
    ("buildInkaSlinger", Base::InkaSlinger),
    ("buildAkkadianArcher", Base::AkkadianArcher),
    ("buildAssyrianArcher", Base::AssyrianArcher),
    ("buildSherden", Base::Sherden),
    ("buildTyrrhenian", Base::Tyrrhenian),
    ("buildShekelesh", Base::Shekelesh),
    ("buildMycenaeanWarrior", Base::MycenaeanWarrior),
    ("buildShangHalberdier", Base::ShangHalberdier),
    ("buildKhopeshWarrior", Base::KhopeshWarrior),
    ("buildImpi", Base::Impi),
    ("buildSumerianSpearman", Base::SumerianSpearman),
    ("buildSiegeTower", Base::SiegeTower),
    ("buildPiechotaHetycka", Base::PiechotaHetycka),
    ("buildGwardiaIshtar", Base::GwardiaIshtar),
    ("buildWojownikBabilonski", Base::WojownikBabilonski),
    ("buildWojownikFenicki", Base::WojownikFenicki),
    ("buildStraznikHarappy", Base::StraznikHarappy),
    ("buildPiechotaInduska", Base::PiechotaInduska),
    ("buildLegionRzymski", Base::LegionRzymski),
    ("buildGwardzistaChampi", Base::GwardzistaChampi),
];

/// The eight MOD-06 builders that live inside `units.ts` (not exported; the
/// fixture reaches them through `buildUnitModel` with the PL record name).
const UNITS_TS: [(&str, Base); 8] = [
    ("Je\u{17a}dziec chi\u{144}ski", Base::ChineseCavalry),
    ("Hu Ben Wei (Gwardia Tygrysa)", Base::HuBenWei),
    ("uThulwana (Bia\u{142}e Tarcze)", Base::UThulwana),
    ("Kr\u{f3}lewska Gwardia", Base::InkaRoyalGuard),
    ("Rydwan egipski", Base::EgyptianChariot),
    ("Med\u{17c}aj (Gwardia Faraona)", Base::Medjay),
    ("Rydwan sumeryjski", Base::SumerianChariot),
    ("Gwardia Kr\u{f3}lewska Sumeru", Base::SumerianRoyalGuard),
];

fn braz_fixture() -> J {
    let path = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/units_braz/units_braz.json"
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
fn rust_case(fx: &J, id: &str) -> Result<UnitModel, String> {
    if let Some(rest) = id.strip_prefix("fn:") {
        let (f, owner) = match rest.split_once('@') {
            Some((f, "B")) => (f, OWNER_B),
            Some(_) => panic!("owner suffix"),
            None => (rest, OWNER_A),
        };
        return build_base(base_of(f), owner).map_err(|e| e.to_string());
    }
    for (prefix, owner) in [("unit:", OWNER_A), ("unitB:", OWNER_B)] {
        if let Some(pl) = id.strip_prefix(prefix) {
            // D-MOD-9 = A: the game resolves the type id through the rule table.
            let r = record(fx, pl);
            let rule = model_for(&UnitTypeId::new(pl)).expect("in table");
            assert_eq!(
                legacy_route(r.at("category").s(), Some(pl)),
                rule,
                "{pl}: rule table vs legacy route"
            );
            return build_model(rule, owner).map_err(|e| e.to_string());
        }
    }
    if let Some(pl) = id.strip_prefix("unitEn:") {
        // web `buildUnitModel(cat, owner, EN name)` (battle fallback path)
        let r = record(fx, pl);
        let en = r.at("en").s();
        let id = legacy_route(r.at("category").s(), Some(en));
        return build_model(id, OWNER_A).map_err(|e| e.to_string());
    }
    panic!("no Rust mapping for fixture case {id}");
}

/// The web record of a case (`sameAs` resolved).
fn web_record<'a>(fx: &'a J, id: &str) -> &'a J {
    let mut w = fx.at("cases").at(id);
    while let Some(s) = w.get("sameAs") {
        w = fx.at("cases").at(s.s());
    }
    w
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
    let mut vertices = 0usize;
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
            vertices += g.vertex_count();
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
    c.eq(
        &format!("{id}: vertices"),
        vertices,
        w.at("vertices").u() as usize,
    );
    c.eq(&format!("{id}: sig"), s.sig, w.at("sig").u());
    c.eq(
        &format!("{id}: celticRetint"),
        celtic_retint(m).is_none(),
        w.at("celticRetint").is_null(),
    );
}

#[test]
fn every_web_case_is_reproduced_bit_for_bit() {
    let fx = braz_fixture();
    let mut c = Cmp {
        errs: Vec::new(),
        values: 0,
    };
    let cases = fx.at("cases").obj();
    let mut per_kind = [0usize; 4];
    let mut same_as = 0usize;
    for (id, w) in cases {
        let web = web_record(&fx, id);
        if w.get("sameAs").is_some() {
            same_as += 1;
        }
        match rust_case(&fx, id) {
            Ok(m) => compare_model(&mut c, id, &m, web),
            Err(e) => c.errs.push(format!("{id}: {e}")),
        }
        let k = if id.starts_with("fn:") {
            0
        } else if id.starts_with("unit:") {
            1
        } else if id.starts_with("unitB:") {
            2
        } else {
            3
        };
        per_kind[k] += 1;
        // The 30 exported builders keep every geometry as a module singleton
        // (`perTokenGeos = []`); the `units.ts` builders allocate per token
        // (GPU disposal bookkeeping only, not part of the tree).
        if id.starts_with("fn:") {
            c.eq(
                &format!("{id}: perTokenGeos"),
                0,
                web.at("perTokenGeos").u(),
            );
        }
    }
    println!(
        "units_braz parity: {} cases (fn {} / unit PL {} / unit PL owner B {} / unit EN {}; {} via sameAs), {} values bit-exact checked, {} mismatches",
        cases.len(),
        per_kind[0],
        per_kind[1],
        per_kind[2],
        per_kind[3],
        same_as,
        c.values,
        c.errs.len()
    );
    // Diagnostics only: `UNITS_BRAZ_SHOW=<substring>` prints every mismatch
    // whose text contains it (the assertions below are unaffected).
    if let Ok(f) = std::env::var("UNITS_BRAZ_SHOW") {
        for e in c.errs.iter().filter(|e| e.contains(&f)) {
            println!("MISMATCH {e}");
        }
    }
    assert_eq!(cases.len(), 180, "fixture cases");
    assert_eq!(per_kind, [60, 40, 40, 40]);
    assert!(
        c.errs.is_empty(),
        "{} mismatches:\n{}",
        c.errs.len(),
        c.errs
            .iter()
            .take(80)
            .cloned()
            .collect::<Vec<_>>()
            .join("\n")
    );
}

#[test]
fn the_records_cover_every_mod06_builder_and_counts_match_the_web() {
    let fx = braz_fixture();
    let recs = fx.at("records").arr();
    assert_eq!(recs.len(), 40, "Bronze records of units.json");
    let mut bases: Vec<Base> = recs
        .iter()
        .map(|r| {
            model_for(&UnitTypeId::new(r.at("pl").s()))
                .expect("in table")
                .base
        })
        .filter(|b| b.package() == Package::Mod06Bronze)
        .collect();
    assert_eq!(
        bases.len(),
        37,
        "Bronze 40 - Galera, Rydwan myke\u{144}ski, Rydwan Shang"
    );
    bases.sort();
    let mut want: Vec<Base> = BUILDERS
        .iter()
        .map(|(_, b)| *b)
        .chain(UNITS_TS.iter().map(|(_, b)| *b))
        .filter(|b| *b != Base::LegionRzymski)
        .collect();
    want.sort();
    assert_eq!(bases, want, "one record per builder (D-MOD-9 = A)");
    let all: Vec<Base> = Base::ALL
        .iter()
        .copied()
        .filter(|b| b.package() == Package::Mod06Bronze)
        .collect();
    assert_eq!(
        all.len(),
        38,
        "37 record builders + LegionRzymski (no record)"
    );
    let cases = fx.at("cases");
    for (f, b) in BUILDERS {
        let m = build_base(b, OWNER_A).expect("ported");
        let w = web_record(&fx, &format!("fn:{f}"));
        let s = m.signature();
        println!(
            "{f}: meshes {} tris {} (web {} / {})",
            s.meshes,
            s.tris,
            w.at("meshes").u(),
            w.at("tris").u()
        );
        assert_eq!((s.meshes, s.tris), (w.at("meshes").u(), w.at("tris").u()));
    }
    for (pl, b) in UNITS_TS {
        let m = build_base(b, OWNER_A).expect("ported");
        let w = web_record(&fx, &format!("unit:{pl}"));
        let s = m.signature();
        println!(
            "{} ({pl}): meshes {} tris {} (web {} / {})",
            b.web_fn(),
            s.meshes,
            s.tris,
            w.at("meshes").u(),
            w.at("tris").u()
        );
        assert_eq!(
            (s.meshes, s.tris, s.sig),
            (w.at("meshes").u(), w.at("tris").u(), w.at("sig").u())
        );
        assert!(cases.get(&format!("unitB:{pl}")).is_some());
    }
}

#[test]
fn routing_no_longer_returns_not_yet_ported_for_the_bronze_package() {
    let p = pending();
    assert!(p.iter().all(|b| b.package() != Package::Mod06Bronze));
    assert!(p.iter().all(|b| b.package() == Package::Mod07Iron));
    let mut n = 0;
    for b in Base::ALL
        .iter()
        .copied()
        .filter(|b| b.package() == Package::Mod06Bronze)
    {
        assert!(build_base(b, OWNER_A).is_ok(), "{b:?} must build");
        assert!(units_braz::build(b, OWNER_B).is_some(), "{b:?}");
        n += 1;
    }
    assert_eq!(n, 38);
    // other packages are not built here
    assert!(units_braz::build(Base::Falangita, OWNER_A).is_none());
    assert!(units_braz::build(Base::WojownikOpus5, OWNER_A).is_none());
    assert!(units_braz::build(Base::CatTopor, OWNER_A).is_none());
    // every Bronze record of the rule table builds
    let fx = braz_fixture();
    for r in fx.at("records").arr() {
        let id = model_for(&UnitTypeId::new(r.at("pl").s())).expect("in table");
        assert!(build_model(id, OWNER_A).is_ok(), "{}", r.at("pl").s());
    }
}

#[test]
fn unit_core_record_signatures_of_the_bronze_records_match() {
    // independent cross-check against the P4.13 fixture (records[].sigPl/sigEn)
    let fx = json::fixture();
    let mut n = 0;
    for r in fx.at("records").arr() {
        let Some(epoka) = r.get("epoka") else {
            continue;
        };
        if epoka.is_null() || epoka.s() != "Br\u{105}z" {
            continue;
        }
        let pl = r.at("pl").s();
        let id = model_for(&UnitTypeId::new(pl)).expect("in table");
        let s = build_model(id, OWNER_A).expect("ported").signature();
        let w = r.at("sigPl");
        assert_eq!(
            (s.meshes, s.tris, s.sig),
            (w.at("meshes").u(), w.at("tris").u(), w.at("sig").u()),
            "{pl} sigPl"
        );
        n += 1;
    }
    assert_eq!(n, 40);
}
