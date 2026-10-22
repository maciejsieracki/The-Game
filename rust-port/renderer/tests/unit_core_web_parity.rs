//! Bit parity of `civ_renderer::models::unit_core` with the web unit models.
//!
//! Reference: `tests/fixtures/unit_core/unit_core.json`, produced by
//! RUNNING the web builders of `edb8fb56` with three@0.169.0
//! (`tests/fixtures/unit_core/gen.ts`, README there). Every float is compared
//! with `to_bits()`; any difference is a failure (no tolerance).

#[path = "unit_core_json.rs"]
mod json;

// P4.27 (R-RUSTPORT-P4-27-SCENE-UNIFY-Q1): forced type adjustments only —
// `mesh()` / `material()` / `tracked()` are accessors of the one scene type,
// colours are stored linear (`hex()` = `getHex()`), module bodies are
// `Geo::Body`; every assertion is unchanged.
use civ_renderer::geom::Vec3;
use civ_renderer::models::unit_core::category::{apply_culture_overrides, attach_embark_boat};
use civ_renderer::models::unit_core::galera::{build_galera, GaleraPoza};
use civ_renderer::models::unit_core::horse::{add_rider_legs, build_horse, build_zloze_konie};
use civ_renderer::models::unit_core::model::{celtic_retint, geo_hash, Material, ROOT};
use civ_renderer::models::unit_core::parts::{HorsePart, UnitPart};
use civ_renderer::models::unit_core::{
    build_base, build_category_model, build_model, legacy_route, model_for, p1, Base, Culture,
    NotYetPorted, UnitCategory, UnitModel, UnitTypeId,
};
use json::{fixture, J};

const OWNER_A: u32 = 0x00d0_3030;
const OWNER_B: u32 = 0x002a_6fdb;

fn culture(s: &str) -> Culture {
    Culture::ALL
        .into_iter()
        .find(|c| c.label() == s)
        .unwrap_or_else(|| panic!("culture {s}"))
}

fn std_mat(m: &mut UnitModel, c: u32, metal: f64, rough: f64) -> usize {
    m.mat(c, metal, rough)
}

/// Rust counterpart of every fixture case id.
fn rust_case(id: &str) -> Result<UnitModel, NotYetPorted> {
    if let Some(rest) = id.strip_prefix("cat:") {
        let (label, owner) = match rest.split_once('@') {
            Some((l, "B")) => (l, OWNER_B),
            Some(_) => panic!("owner suffix"),
            None => (rest, OWNER_A),
        };
        return build_category_model(UnitCategory::from_label(label), owner);
    }
    if let Some(rest) = id.strip_prefix("unit:") {
        let (name, owner) = match rest.split_once('@') {
            Some((n, "B")) => (n, OWNER_B),
            Some(_) => panic!("owner suffix"),
            None => (rest, OWNER_A),
        };
        let cat = match name {
            "Galera" => "galera",
            "Osadnik" => "osadnik",
            "Robotnik" => "robotnik",
            _ => "rydwan",
        };
        let legacy = legacy_route(cat, Some(name));
        let rule = model_for(&UnitTypeId::new(name)).expect("in table");
        assert_eq!(legacy, rule, "{id}: rule table vs legacy route");
        return build_model(rule, owner);
    }
    if let Some(f) = id.strip_prefix("named:") {
        let base = match f {
            "buildHierosLochos" => Base::HierosLochos,
            "buildCrossbowman" => Base::Crossbowman,
            "buildCeltWarrior" => Base::CeltWarrior,
            "buildGermanWarrior" => Base::GermanWarrior,
            "buildBerserker" => Base::BerserkerOld,
            _ => panic!("named case {f}"),
        };
        assert_eq!(base.web_fn(), f);
        return build_base(base, OWNER_A);
    }
    match id {
        "galera:plyniecie" => return Ok(build_galera(OWNER_A, GaleraPoza::Plyniecie)),
        "galera:atak" => return Ok(build_galera(OWNER_A, GaleraPoza::Atak)),
        "p1:wojownikKamien" => return Ok(p1::build_wojownik_kamien(OWNER_A)),
        "p1:oszczepnik" => return Ok(p1::build_oszczepnik(OWNER_A)),
        "p1:lucznik" => return Ok(p1::build_lucznik(OWNER_A)),
        "p1:zwiadowca" => return Ok(p1::build_zwiadowca(OWNER_A)),
        "p1:procarz" => return Ok(p1::build_procarz(OWNER_A)),
        "p1:wlocznik" => return Ok(p1::build_wlocznik(OWNER_A)),
        "p1:miecznik" => return Ok(p1::build_miecznik(OWNER_A)),
        "kon:horse" => {
            let mut m = UnitModel::new();
            let b = std_mat(&mut m, 0x8a_6038, 0.1, 0.78);
            let mn = std_mat(&mut m, 0x1a_0e06, 0.1, 0.78);
            build_horse(&mut m, ROOT, b, mn, None, 0.0, 0.0);
            return Ok(m);
        }
        "kon:horseHarness" => {
            let mut m = UnitModel::new();
            let b = std_mat(&mut m, 0x8a_6038, 0.05, 0.85);
            let mn = std_mat(&mut m, 0x1a_0e06, 0.05, 0.85);
            let h = std_mat(&mut m, 0x4a_3828, 0.05, 0.85);
            build_horse(&mut m, ROOT, b, mn, Some(h), 0.1, -0.4);
            return Ok(m);
        }
        "kon:zloze" => return Ok(build_zloze_konie(1.0)),
        "kon:zloze@0.5" => return Ok(build_zloze_konie(0.5)),
        "kon:riderLegs" => {
            let mut m = UnitModel::new();
            let c = std_mat(&mut m, 0xa0_1f2e, 0.06, 0.78);
            let b = std_mat(&mut m, 0x3a_2414, 0.06, 0.78);
            add_rider_legs(&mut m, ROOT, c, b, 0.296);
            return Ok(m);
        }
        _ => {}
    }
    if let Some(rest) = id.strip_prefix("embark:") {
        let cat = if rest == "p1miecznik" {
            "miecznik"
        } else {
            rest
        };
        let mut m = build_category_model(UnitCategory::from_label(cat), OWNER_A)?;
        attach_embark_boat(&mut m);
        return Ok(m);
    }
    if let Some(rest) = id.strip_prefix("culture:") {
        let (cat, cu) = rest.split_once(':').expect("culture case");
        let cat = UnitCategory::from_label(cat);
        let mut m = build_category_model(cat, OWNER_A)?;
        apply_culture_overrides(&mut m, cat, culture(cu));
        return Ok(m);
    }
    panic!("no Rust mapping for fixture case {id}");
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
    let retint = w.at("celticRetint");
    match (celtic_retint(m), retint.is_null()) {
        (None, true) => {}
        (Some(r), false) => {
            c.eq(&format!("{id}: retint.iron"), r.iron, retint.at("iron").u());
            c.eq(
                &format!("{id}: retint.tunic"),
                r.tunic,
                retint.at("tunic").u(),
            );
            c.eq(
                &format!("{id}: retint.crest"),
                r.crest,
                retint.at("crest").u(),
            );
        }
        (r, _) => c
            .errs
            .push(format!("{id}: celticRetint rust {r:?} web {retint:?}")),
    }
}

/// Expected stubs: case → builder of another package. The MOD-05 Stone
/// cases (`lucznik`, `oszczepnik`, `zwiadowca`, `obleznicza`, `domyslny`,
/// `nieznana-kategoria`) are ported since R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1
/// and compared bit for bit like every other case.
/// The last stub, `falanga` (MOD-07), is ported since
/// R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1: no case is expected to be pending.
fn expected_pending(id: &str) -> Option<Base> {
    let _label = id.strip_prefix("cat:")?;
    None
}

#[test]
fn every_web_case_is_reproduced_bit_for_bit() {
    let fx = fixture();
    let mut c = Cmp {
        errs: Vec::new(),
        values: 0,
    };
    let mut ported = 0;
    let mut pending = Vec::new();
    for (id, w) in fx.at("cases").obj() {
        match rust_case(id) {
            Ok(m) => {
                assert!(expected_pending(id).is_none(), "{id} should be a stub");
                compare_model(&mut c, id, &m, w);
                ported += 1;
            }
            Err(e) => {
                assert_eq!(
                    Some(e.base),
                    expected_pending(id),
                    "{id}: unexpected stub {e}"
                );
                pending.push(id.clone());
            }
        }
    }
    println!(
        "unit_core parity: {} cases, {ported} compared ({} values bit-exact checked), {} pending stubs: {pending:?}",
        fx.at("cases").obj().len(),
        c.values,
        pending.len()
    );
    assert_eq!(
        pending.len(),
        0,
        "pending stub cases (MOD-07 closed the last one)"
    );
    assert_eq!(ported, 68, "compared cases (+ cat:falanga since MOD-07)");
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
fn part_catalogues_match_the_web_singletons() {
    let fx = fixture();
    let parts = fx.at("parts");
    let mut units = 0;
    let mut kon = 0;
    for (k, w) in parts.obj() {
        if k.starts_with("units:") {
            units += 1;
        }
        if k.starts_with("kon:") {
            kon += 1;
        }
        let _ = w;
    }
    assert_eq!(units, 88, "web getGeo* count");
    assert_eq!(UnitPart::ALL.len(), 88);
    assert_eq!(kon, 20, "web getGeoNH* count");
    assert_eq!(HorsePart::ALL.len(), 20);
    let mut errs = Vec::new();
    let mut check = |key: String, mesh: civ_renderer::geom::Mesh| {
        let w = parts
            .get(&key)
            .unwrap_or_else(|| panic!("fixture lacks {key}"));
        let got = (mesh.vertex_count(), mesh.triangle_count(), geo_hash(&mesh));
        let want = (
            w.at("vtx").u() as usize,
            w.at("tri").u() as usize,
            w.at("hash").u(),
        );
        if got != want {
            errs.push(format!("{key}: rust {got:?} web {want:?}"));
        }
    };
    for p in UnitPart::ALL {
        check(format!("units:{}", p.web_name()), p.prim().build());
    }
    for p in HorsePart::ALL {
        check(format!("kon:{}", p.web_name()), p.prim().build());
    }
    assert!(errs.is_empty(), "{}", errs.join("\n"));

    // The p1 registry (65 keys) is covered through the p1 models: every web
    // registry geometry hash must occur among the Rust p1 meshes.
    let mut rust_hashes = std::collections::BTreeSet::new();
    for m in [
        p1::build_wojownik_kamien(OWNER_A),
        p1::build_oszczepnik(OWNER_A),
        p1::build_lucznik(OWNER_A),
        p1::build_zwiadowca(OWNER_A),
        p1::build_procarz(OWNER_A),
        p1::build_wlocznik(OWNER_A),
        p1::build_miecznik(OWNER_A),
    ] {
        for id in m.meshes() {
            rust_hashes.insert(geo_hash(&m.nodes[id].mesh().unwrap().geo.build()));
        }
    }
    let mut p1_keys = 0;
    for (k, w) in parts.obj() {
        if k.starts_with("p1:") {
            p1_keys += 1;
            assert!(
                rust_hashes.contains(&w.at("hash").u()),
                "{k}: web p1 geometry not produced in Rust"
            );
        }
    }
    assert_eq!(p1_keys, 65);
}

#[test]
fn signature_is_sensitive_to_owner_colour_and_pose() {
    let a = build_galera(OWNER_A, GaleraPoza::Plyniecie).signature();
    let b = build_galera(OWNER_B, GaleraPoza::Plyniecie).signature();
    let c = build_galera(OWNER_A, GaleraPoza::Atak).signature();
    assert_ne!(a.sig, b.sig);
    assert_ne!(a.sig, c.sig);
    assert_eq!(a.meshes, c.meshes);
}
