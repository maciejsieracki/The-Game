//! REPIN-3D batch B4 (R-RUSTPORT-REPIN-3D-B4-Q1, document
//! `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §11): `render/cities.ts` of the
//! CURRENT web (`origin/main` `86d510c66`) — `registerOwnedMeshResources`
//! (`cities.ts:264-278`, web `5d9534e0b`) applied by
//! `buildSettlementModelForStyle` to every settlement model — against vectors
//! produced by RUNNING the web (`tests/repin3d_fixtures/gen_b4.ts` → `b4.json`).
//! Geometry / material / scene hashes of the same models are covered by
//! `tests/fixtures/cities/` (pin fixtures regenerated on `origin/main`:
//! byte-identical, `cities_web_parity`).

#![allow(clippy::float_cmp)]

mod repin3d_common;

use civ_renderer::core::bronze::BronzeCiv;
use civ_renderer::models::cities::{
    build_city_map_outline, build_miasto_braz, build_miasto_kamien, register_owned_mesh_resources,
    City, CityModel, CityRenderOptions, CityRenderer, CityWallKind, MiastoBrazOpts,
    MiastoKamienOpts, Poziom,
};
use civ_renderer::pick::hex::HexCoord;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::scene::{NodeKind, Prim, UserValue, ROOT};
use repin3d_common::{load, Cmp, Json};

/// Renderer-owned keys the web writes on the same group after the model is
/// built (`cities.ts:546-566`); in Rust they are [`civ_renderer::models::cities::RenderedCity`] fields.
const RENDERER_KEYS: [&str; 5] = ["cityId", "visualKey", "ownerId", "q", "r"];

fn num(j: &Json) -> f64 {
    match j {
        Json::Str(s) if s == "NaN" => f64::NAN,
        other => other.num(),
    }
}

fn keys(m: &CityModel) -> Vec<String> {
    m.nodes[ROOT]
        .user_data
        .iter()
        .map(|(k, _)| k.to_owned())
        .collect()
}

/// Test-side recomputation (independent of the code under test): traverse
/// position of every mesh, and the first-use material list.
fn meshes_and_first_use(m: &CityModel) -> (Vec<usize>, Vec<usize>) {
    let mut meshes = Vec::new();
    let mut first = Vec::new();
    for (pos, id) in m.traverse().into_iter().enumerate() {
        if let NodeKind::Mesh(d) = &m.nodes[id].kind {
            meshes.push(pos);
            for &mi in &d.materials {
                if !first.contains(&mi) {
                    first.push(mi);
                }
            }
        }
    }
    (meshes, first)
}

fn ints(j: &Json) -> Vec<i64> {
    j.arr().iter().map(Json::i64).collect()
}

#[test]
fn settlement_models_carry_the_web_resource_registry() {
    let v = load("b4.json");
    let mut cr = CityRenderer::new([(HexCoord::new(0, 0), Terrain::Laka)]);
    let city = City {
        id: "x".into(),
        owner_id: 3,
        q: 0,
        r: 0,
        population: 4.0,
    };
    let mut cmp = Cmp::default();
    let mut prev: Option<CityModel> = None;
    let cases = v.get("settlement").arr();
    assert_eq!(cases.len(), 3330, "case count");
    let (mut reused_n, mut rebuilt_n) = (0usize, 0usize);
    for (i, c) in cases.iter().enumerate() {
        let era = num(c.get("era"));
        let civ = BronzeCiv::from_web_id(c.get("civ").str()).expect("civ");
        let level = num(c.get("level"));
        let wall = match c.get("wallKind").str() {
            "none" => CityWallKind::None,
            "stone" => CityWallKind::Stone,
            "palisada" => CityWallKind::Palisada,
            o => panic!("wallKind {o}"),
        };
        let color = c.get("color");
        let color = if color.is_null() {
            None
        } else {
            Some(color.u32())
        };
        let fe = move |_: i32| era;
        let fc = move |_: i32| civ;
        let fl = move |_: &str| level;
        let fw = move |_: &str| wall;
        let fcol = move |_: i32| color.unwrap_or(0);
        let o = CityRenderOptions {
            get_era: Some(&fe),
            get_civ: Some(&fc),
            get_level: Some(&fl),
            get_wall_kind: Some(&fw),
            owner_color_fn: if color.is_some() { Some(&fcol) } else { None },
            ..CityRenderOptions::default()
        };
        cr.sync(std::slice::from_ref(&city), &o);
        let m = &cr.city("x").expect("city").model;
        let ctx = format!(
            "#{i} era={era} civ={} L={level} wall={}",
            civ.web_id(),
            wall.web_id()
        );
        let w = c.get("reg");

        let web_keys: Vec<String> = w
            .get("keys")
            .arr()
            .iter()
            .map(|k| k.str().to_owned())
            .filter(|k| !RENDERER_KEYS.contains(&k.as_str()))
            .collect();
        cmp.eq(&format!("{ctx} keys"), keys(m), web_keys);

        let (meshes, first) = meshes_and_first_use(m);
        cmp.eq(
            &format!("{ctx} meshes"),
            meshes.len() as i64,
            w.get("meshes").i64(),
        );
        cmp.eq(
            &format!("{ctx} uniqueMats"),
            first.len() as i64,
            w.get("uniqueMats").i64(),
        );
        let ud = &m.nodes[ROOT].user_data;
        let rust_mats: Vec<i64> = ud
            .mats("mats")
            .unwrap_or(&[])
            .iter()
            .map(|id| first.iter().position(|x| x == id).map_or(-1, |p| p as i64))
            .collect();
        cmp.eq(&format!("{ctx} mats"), rust_mats, ints(w.get("mats")));
        // `perCityGeos`: the web array points at the first mesh of each
        // geometry — one per mesh, in traverse order (Z-RP-B4-1).
        let web_geos = ints(w.get("geos"));
        cmp.eq(
            &format!("{ctx} perCityGeos len"),
            ud.get("perCityGeos").cloned(),
            Some(UserValue::Len(web_geos.len())),
        );
        cmp.eq(
            &format!("{ctx} perCityGeos meshes"),
            meshes.iter().map(|&p| p as i64).collect::<Vec<_>>(),
            web_geos,
        );

        // Reuse (same visualKey, colour not part of it): the old model stays.
        let reused = c.get("reused").bool();
        if reused {
            reused_n += 1;
            // Debug text: `NaN != NaN` would fail `PartialEq` for level NaN.
            cmp.eq(
                &format!("{ctx} reused"),
                prev.as_ref().map(|p| format!("{p:?}")),
                Some(format!("{m:?}")),
            );
        } else {
            rebuilt_n += 1;
        }
        prev = Some(m.clone());
    }
    assert_eq!((reused_n, rebuilt_n), (1665, 1665));
    eprintln!("b4 settlement: {} checks", cmp.checks);
    cmp.finish("settlement registry");
}

#[test]
fn builders_alone_carry_no_registry() {
    let v = load("b4.json");
    let mut cmp = Cmp::default();
    for b in v.get("builders").arr() {
        let l = b.get("level").num();
        let m = match (b.get("f").str(), b.opt("civ").map(Json::str)) {
            ("kamien", _) => build_miasto_kamien(
                Poziom::Level(l),
                MiastoKamienOpts {
                    mur: true,
                    color: None,
                },
            ),
            ("braz", Some("grecja")) => build_miasto_braz(
                "grecja",
                Poziom::Level(l),
                MiastoBrazOpts {
                    mur: true,
                    palisada: false,
                    color: None,
                },
            ),
            ("braz", Some("rzym")) => build_miasto_braz(
                "rzym",
                Poziom::Level(l),
                MiastoBrazOpts {
                    mur: false,
                    palisada: true,
                    color: None,
                },
            ),
            o => panic!("builder {o:?}"),
        };
        let w = b.get("reg");
        let web: Vec<String> = w
            .get("keys")
            .arr()
            .iter()
            .map(|k| k.str().to_owned())
            .collect();
        cmp.eq(&format!("{} L{l} keys", b.get("f").str()), keys(&m), web);
        let (meshes, first) = meshes_and_first_use(&m);
        cmp.eq("meshes", meshes.len() as i64, w.get("meshes").i64());
        cmp.eq("uniqueMats", first.len() as i64, w.get("uniqueMats").i64());
    }
    cmp.finish("builders");
}

// ---------------------------------------------------------------------------
// Edge cases of `registerOwnedMeshResources` semantics (JS `Set` insertion
// order, `isMesh` filter, `Array.isArray(material)`), not reachable through
// the city builders (they make neither line loops, sprites nor material
// arrays) — stated against the web source `cities.ts:264-278`.

#[test]
fn registry_edge_cases() {
    // empty group: `[]` / `[]`
    let mut g = CityModel::new();
    register_owned_mesh_resources(&mut g);
    assert_eq!(keys(&g), ["mats", "perCityGeos"]);
    assert_eq!(g.nodes[ROOT].user_data.mats("mats"), Some(&[][..]));
    assert_eq!(
        g.nodes[ROOT].user_data.get("perCityGeos"),
        Some(&UserValue::Len(0))
    );

    // line loop and sprite are not `isMesh`; a material array adds each slot
    // once, in slot order; first use wins (mesh order != creation order).
    let mut g = CityModel::new();
    let a = g.lambert_mat(0x11_2233, false);
    let b = g.lambert_mat(0x44_5566, false);
    let c = g.lambert_mat(0x77_8899, false);
    let d = g.lambert_mat(0xaa_bbcc, false);
    let sub = g.group(ROOT);
    let bx = Prim::Box {
        w: 1.0,
        h: 1.0,
        d: 1.0,
    };
    g.add_line_loop(ROOT, bx, d);
    g.sprite(ROOT, d);
    g.mesh(sub, bx, c);
    g.add_mesh_multi(ROOT, bx, vec![b, c, a, b]);
    g.mesh(ROOT, bx, c);
    register_owned_mesh_resources(&mut g);
    assert_eq!(g.nodes[ROOT].user_data.mats("mats"), Some(&[c, b, a][..]));
    assert_eq!(
        g.nodes[ROOT].user_data.get("perCityGeos"),
        Some(&UserValue::Len(3))
    );

    // existing keys keep their position; a second call is idempotent
    let mut g = build_miasto_kamien(
        Poziom::Level(3.0),
        MiastoKamienOpts {
            mur: true,
            color: None,
        },
    );
    register_owned_mesh_resources(&mut g);
    let once = g.clone();
    register_owned_mesh_resources(&mut g);
    assert_eq!(g, once);
    assert_eq!(
        keys(&g),
        ["model", "poziom", "rozmiar", "mats", "perCityGeos"]
    );

    // the outline group (line loops only) would register nothing
    let (mut o, _) = build_city_map_outline(0, 0, 0.5, Some(0x00ff_d54a), false);
    register_owned_mesh_resources(&mut o);
    let ud = &o.nodes[ROOT].user_data;
    assert_eq!(ud.array_len("mats"), Some(0));
    assert_eq!(ud.get("perCityGeos"), Some(&UserValue::Len(0)));
}
