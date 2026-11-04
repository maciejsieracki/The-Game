//! REPIN-3D batch B2 (R-RUSTPORT-REPIN-3D-B2-Q1, document
//! `dyspozycje/rust-port/p4/P4-REPIN-3D.md` §10): the owner medallion of the
//! CURRENT web (`origin/main` @ `86d510c66`) — `render/unitOwnerEmblem.ts`
//! `ringHex` (ring colour of a full civilisation: `normalizeRingHex`,
//! `ringColorFor`, `drawDisc` / `drawFallbackGlyph` / the ring over the
//! portrait, `emblemKey` `civ:<civ>:<era>:<ring>`) and `render/unitStatPlate.ts`
//! `PLATE_OWNER_ICON_SIZE` 0,20 → 0,80·HEX_R — against vectors produced by
//! RUNNING the web in headless Chromium 141 (`tests/repin3d_fixtures/gen_b2.ts`
//! + `gen_b2.mjs`, the harness of `tests/fixtures/overlay/gen.mjs`).
//!
//! Batch B3 (same file, allowlist `tests/repin3d_b2*`): the commander star of
//! `render/unitVeteranBadges.ts` (`applyUnitCommanderStar`) against
//! `tests/repin3d_fixtures/b3.json` (`gen_b3.ts`, node).
//!
//! The pin-era trees / textures / keys without `ringHex` are covered by the
//! regenerated `tests/fixtures/overlay/` (`overlay_web_parity`) and
//! `tests/fixtures/atlas/atlas_keys.json` (`atlas_keys`).

#[path = "unit_core_json.rs"]
mod json;

use std::collections::HashMap;

use civ_renderer::raster::atlas::keys::{
    normalize_ring_hex, owner_emblem_key as atlas_key, OwnerEmblemContext as AtlasCtx,
};
use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight};
use civ_renderer::units::overlay::emblem::{
    owner_emblem_key, render_owner_emblem, ring_color_for, EmblemVariant, OwnerEmblemAssets,
    OwnerEmblemContext,
};
use civ_renderer::units::overlay::stat_plate::{
    build_stat_plate, plate_owner_key, StatPlateVitals, PLATE_OWNER_ICON_SIZE,
};
use civ_renderer::units::overlay::veteran_badges::{
    build_commander_star, commander_star_update, CommanderStarUpdate, COMMANDER_STAR_BADGE,
    COMMANDER_STAR_HIT_UD,
};
use civ_renderer::units::overlay::{
    MaterialKind, NodeKind, OverlayTexture, OverlayTree, Side, TextureRef,
};
use json::{parse, J};

const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;
/// Largest per-channel difference allowed at the probe pixels of the ring
/// (anti-aliasing / colour-management noise; a wrong ring colour is ≥ 40).
const MAX_RING_PROBE_DIFF: i32 = 3;

fn dir() -> String {
    format!("{}/tests", env!("CARGO_MANIFEST_DIR"))
}

fn fixture() -> J {
    parse(&std::fs::read_to_string(format!("{}/repin3d_fixtures/b2.json", dir())).expect("b2.json"))
}

fn f64_hex(s: &str) -> f64 {
    f64::from_bits(u64::from_str_radix(s, 16).expect("hex bits"))
}

struct FxAssets;

impl OwnerEmblemAssets for FxAssets {
    #[allow(clippy::float_cmp)]
    fn leader_portrait_jpeg(&self, civ_id: &str, era: f64) -> Option<Vec<u8>> {
        // gen.mjs / gen_b2.mjs PORTRAITS: "<civ>|<era>" → file.
        let file = match civ_id {
            "grecy" if era == 2.0 => "portrait-grecy-braz",
            "zulusi" if era == 3.0 => "portrait-zulusi-zelazo",
            "egipt" if era == 1.0 => "portrait-egipt-kamien",
            _ => return None,
        };
        Some(std::fs::read(format!("{}/fixtures/overlay/input/{file}.jpg", dir())).expect("jpg"))
    }
    fn civ_sigil_svg(&self, civ_id: &str) -> String {
        std::fs::read_to_string(format!(
            "{}/fixtures/overlay/input/civ-{civ_id}-40.svg",
            dir()
        ))
        .unwrap_or_default()
    }
    fn barbarian_sigil_svg(&self) -> String {
        std::fs::read_to_string(format!(
            "{}/fixtures/overlay/input/chip-death-40.svg",
            dir()
        ))
        .expect("chip-death")
    }
}

fn opt_str(j: Option<&J>) -> Option<String> {
    j.filter(|v| !v.is_null()).map(|v| v.s().to_owned())
}

fn ctx_of(j: &J) -> OwnerEmblemContext {
    OwnerEmblemContext {
        civ_id: opt_str(j.get("civId")),
        era: f64_hex(j.at("era").s()),
        is_city_state: j.at("isCityState").b(),
        is_barbarian: j.at("isBarbarian").b(),
        ring_hex: opt_str(j.get("ringHex")),
    }
}

/// `rings[i]`: `{undef: true}` (property absent) or `{v: <string | null>}`.
fn ring_of(j: &J) -> Option<String> {
    if j.get("undef").is_some() {
        None
    } else {
        opt_str(j.get("v"))
    }
}

#[test]
fn plate_owner_icon_size_is_the_web_constant() {
    let fx = fixture();
    let want = fx.at("consts").at("PLATE_OWNER_ICON_SIZE").s();
    assert_eq!(format!("{:016x}", PLATE_OWNER_ICON_SIZE.to_bits()), want);
    assert_eq!(want, "3fe999999999999a", "0.80 * HEX_R (HEX_R = 1)");
}

#[test]
fn emblem_keys_with_ring_hex_match_the_web() {
    let fx = fixture();
    let bases = fx.at("bases").arr();
    let rings = fx.at("rings").arr();
    let rows = fx.at("keys").arr();
    assert_eq!(rows.len(), bases.len() * rings.len());
    assert_eq!(rows.len(), 168);
    let mut bad = Vec::new();
    let mut ringed = 0;
    for r in rows {
        let a = r.arr();
        let (bi, ri) = (a[0].u() as usize, a[1].u() as usize);
        let want = a[2].s();
        let mut octx = ctx_of(&bases[bi]);
        octx.ring_hex = ring_of(&rings[ri]);
        let got = owner_emblem_key(&octx);
        let actx = AtlasCtx {
            civ_id: octx.civ_id.clone(),
            era: octx.era,
            is_city_state: octx.is_city_state,
            is_barbarian: octx.is_barbarian,
            ring_hex: octx.ring_hex.clone(),
        };
        let got_atlas = atlas_key(&actx);
        if got != want || got_atlas != want {
            bad.push(format!(
                "{octx:?}: units {got:?} atlas {got_atlas:?} web {want:?}"
            ));
        }
        if want.starts_with("civ:") && !want.ends_with(":brass") {
            ringed += 1;
        }
    }
    assert!(bad.is_empty(), "{bad:#?}");
    // 3 full-civ bases × 10 valid rings of gen_b2.ts RINGS (indices 4-9, 11,
    // 12, 22, 23); the other 18 rings → brass.
    assert_eq!(ringed, 30);
}

#[test]
fn normalize_ring_hex_edges() {
    // The branches of `normalizeRingHex` one by one (web `:249-253`).
    assert_eq!(normalize_ring_hex(None), None);
    assert_eq!(normalize_ring_hex(Some("")), None);
    assert_eq!(normalize_ring_hex(Some("\u{feff}")), None);
    assert_eq!(normalize_ring_hex(Some("#1E88E5")), Some("#1e88e5".into()));
    assert_eq!(
        normalize_ring_hex(Some("\u{2029}#aBcDeF ")),
        Some("#abcdef".into())
    );
    assert_eq!(normalize_ring_hex(Some("#1e88e")), None); // N−1
    assert_eq!(normalize_ring_hex(Some("#1e88e5")), Some("#1e88e5".into())); // N
    assert_eq!(normalize_ring_hex(Some("#1e88e5a")), None); // N+1
    assert_eq!(normalize_ring_hex(Some("x1e88e5")), None);
    assert_eq!(normalize_ring_hex(Some("\u{85}#1e88e5")), None);
    // ringColorFor: only the `civ` variant takes the ring.
    assert_eq!(
        ring_color_for(EmblemVariant::Civ, Some("#ABCDEF")),
        "#abcdef"
    );
    assert_eq!(ring_color_for(EmblemVariant::Civ, Some("#abc")), "#e8d88a");
    assert_eq!(ring_color_for(EmblemVariant::Civ, None), "#e8d88a");
    assert_eq!(
        ring_color_for(EmblemVariant::CityState, Some("#abcdef")),
        "#b9c8d8"
    );
    assert_eq!(
        ring_color_for(EmblemVariant::Barbarian, Some("#abcdef")),
        "#c84040"
    );
}

#[test]
fn plate_owner_icon_matches_the_web() {
    let fx = fixture();
    let ctx_by_name: HashMap<&str, OwnerEmblemContext> = fx
        .at("textures")
        .arr()
        .iter()
        .map(|t| (t.at("name").s(), ctx_of(t.at("ctx"))))
        .collect();
    let v = StatPlateVitals {
        ruch_left: Some(2.0),
        ruch_max: Some(2.0),
        hp: Some(100.0),
        hp_max: Some(100.0),
        field_power_m: Some(42.0),
        owner_color: Some(0x001e_88e5),
    };
    let plates = fx.at("plates").arr();
    assert_eq!(plates.len(), 3);
    for p in plates {
        let octx = &ctx_by_name[p.at("name").s()];
        let key = plate_owner_key(Some(octx));
        assert_eq!(key, p.at("ownerKey").s());
        let tree = build_stat_plate(Some(octx), &v);
        let icons: Vec<_> = tree
            .nodes
            .iter()
            .filter(|n| match &n.kind {
                NodeKind::Mesh { material, .. } => {
                    material.map == Some(TextureRef::OwnerEmblem(key.clone()))
                }
                _ => false,
            })
            .collect();
        assert_eq!(icons.len(), 1, "one owner icon");
        let icon = p.at("icon");
        let hexes = |a: [f64; 3]| a.map(|x| format!("{:016x}", x.to_bits()));
        let want = |k: &str| -> Vec<String> {
            icon.at(k).arr().iter().map(|x| x.s().to_owned()).collect()
        };
        assert_eq!(
            hexes(icons[0].position).to_vec(),
            want("p"),
            "{key} position"
        );
        assert_eq!(hexes(icons[0].scale).to_vec(), want("s"), "{key} scale");
        assert_eq!(i64::from(icons[0].render_order), icon.at("renderOrder").i());
    }
}

fn ref_rgba(name: &str) -> Vec<u8> {
    std::fs::read(format!("{}/repin3d_fixtures/b2_ref/{name}.rgba", dir()))
        .unwrap_or_else(|_| panic!("b2_ref/{name}.rgba"))
}

/// Straight RGBA of a premultiplied texel.
fn straight(t: &OverlayTexture, x: usize, y: usize) -> [i32; 4] {
    let i = (y * t.width as usize + x) * 4;
    let p = &t.premultiplied[i..i + 4];
    let a = i32::from(p[3]);
    let un = |c: u8| {
        if a == 0 {
            0
        } else {
            (i32::from(c) * 255 + a / 2) / a
        }
    };
    [un(p[0]), un(p[1]), un(p[2]), a]
}

#[test]
fn ring_textures_match_chromium() {
    let fx = fixture();
    let meta: HashMap<&str, &J> = fx
        .at("textureList")
        .arr()
        .iter()
        .map(|t| (t.at("id").s(), t))
        .collect();
    // First context of every (phase, key) → web texture id: the web caches per
    // key (cache cleared when the asset source changes).
    let mut first: HashMap<(String, String), (&str, OwnerEmblemContext)> = HashMap::new();
    let mut failures = Vec::new();
    println!("name | phase | ref | max_abs | mean_abs | px>16 % | ssim | ring probe");
    for t in fx.at("textures").arr() {
        let phase = t.at("phase").s().to_owned();
        let octx = ctx_of(t.at("ctx"));
        let key = owner_emblem_key(&octx);
        assert_eq!(key, t.at("key").s(), "{octx:?}");
        let id = t.at("tex").s();
        let slot = (phase.clone(), key.clone());
        if let Some((prev, _)) = first.get(&slot) {
            // cache hit on the web: same texture object
            assert_eq!(
                *prev, id,
                "{key}: the web shares the texture of the first context"
            );
            continue;
        }
        first.insert(slot, (id, octx.clone()));
        let assets: Option<&dyn OwnerEmblemAssets> = if phase == "noassets" {
            None
        } else {
            Some(&FxAssets)
        };
        let e = render_owner_emblem(&octx, assets).expect("emblem");
        let m = meta[id];
        assert_eq!(i64::from(e.texture.width), m.at("w").i());
        assert_eq!(i64::from(e.texture.height), m.at("h").i());
        assert_eq!(
            i64::from(e.texture.redrawn_after_load) + 1,
            m.at("version").i(),
            "{key} redrawn"
        );
        assert_eq!(
            e.initial == e.texture,
            m.at("initialEqualsFinal").b(),
            "{key} initial==final"
        );
        let mut phases = vec![("final", &e.texture, id.to_owned())];
        if !m.at("initialEqualsFinal").b() {
            phases.push(("initial", &e.initial, format!("{id}.initial")));
        }
        for (ph, tex, file) in phases {
            let want = ref_rgba(&file);
            let (w, h) = (tex.width as usize, tex.height as usize);
            assert_eq!(want.len(), w * h * 4);
            let d = compare_premultiplied(&tex.premultiplied, &premultiply_straight(&want), w, h);
            // Ring probe: the middle of the ring stroke (r = 54, width 14) at
            // the top, left and bottom of the disc — straight colour vs web.
            let mut probe = 0;
            for (x, y) in [(64usize, 10usize), (10, 64), (64, 118), (118, 64)] {
                let g = straight(tex, x, y);
                let i = (y * w + x) * 4;
                let r = [0, 1, 2, 3].map(|k| i32::from(want[i + k]));
                for k in 0..4 {
                    probe = probe.max((g[k] - r[k]).abs());
                }
            }
            println!(
                "{} | {ph} | {file} | {} | {:.4} | {:.3} | {:.5} | {probe}",
                t.at("name").s(),
                d.max_abs,
                d.mean_abs,
                d.frac_px_over_16 * 100.0,
                d.ssim
            );
            if d.ssim < MIN_SSIM
                || d.mean_abs > MAX_MEAN_ABS
                || d.frac_px_over_16 > MAX_FRAC_PX_OVER_16
                || probe > MAX_RING_PROBE_DIFF
            {
                failures.push(format!("{file} ({key}, {ph})"));
            }
        }
    }
    assert_eq!(first.len(), meta.len(), "every web texture compared");
    assert!(
        failures.is_empty(),
        "textures over threshold: {failures:#?}"
    );
}

#[test]
fn ring_colour_reaches_the_pixels() {
    // Independent of the web references: the same civ / era with two ring
    // colours renders different rings, and the brass fallback equals `None`.
    let base = OwnerEmblemContext {
        civ_id: Some("brak".into()),
        era: 2.0,
        ..OwnerEmblemContext::default()
    };
    let with = |ring: Option<&str>| {
        render_owner_emblem(
            &OwnerEmblemContext {
                ring_hex: ring.map(str::to_owned),
                ..base.clone()
            },
            None,
        )
        .expect("emblem")
        .texture
    };
    let blue = with(Some("#1e88e5"));
    assert_eq!(straight(&blue, 64, 10), [0x1e, 0x88, 0xe5, 255]);
    assert_eq!(with(Some("#zzzzzz")), with(None));
    assert_eq!(straight(&with(None), 64, 10), [0xe8, 0xd8, 0x8a, 255]);
}

// ------------------------------------------------------------------ batch B3: commander star

fn hex_bits(j: &J) -> u64 {
    u64::from_str_radix(j.s(), 16).expect("hex bits")
}

fn f32_bits(j: &J) -> Vec<u32> {
    j.arr()
        .iter()
        .map(|x| u32::from_str_radix(x.s(), 16).expect("f32"))
        .collect()
}

/// The commander sub-tree vs the web dump (`gen_b3.ts` `dumpTree`): node type,
/// name, parent, position / rotation / scale bits, `renderOrder`, `visible`,
/// `userData`, geometry (f32 bits) and material parameters (bits).
fn commander_tree_check(rust: &OverlayTree, w: &J, geos: &J, what: &str) -> Vec<String> {
    let nodes = w.arr();
    if rust.nodes.len() != nodes.len() {
        return vec![format!(
            "{what}: {} nodes vs web {}",
            rust.nodes.len(),
            nodes.len()
        )];
    }
    let mut bad = Vec::new();
    let bits3 = |a: [f64; 3]| a.map(f64::to_bits).to_vec();
    let want3 = |j: &J| j.arr().iter().map(hex_bits).collect::<Vec<_>>();
    for (i, (n, wn)) in rust.nodes.iter().zip(nodes).enumerate() {
        let mut chk = |k: &str, ok: bool| {
            if !ok {
                bad.push(format!("{what}#{i} {k}"));
            }
        };
        let parent = n.parent.map_or(-1, |p| i64::try_from(p).expect("index"));
        chk("parent", parent == wn.at("parent").i());
        chk("name", n.name == wn.at("name").s());
        chk("position", bits3(n.position) == want3(wn.at("p")));
        chk("rotation", bits3(n.rotation) == want3(wn.at("r")));
        chk("order", wn.at("order").s() == "XYZ");
        chk("scale", bits3(n.scale) == want3(wn.at("s")));
        chk(
            "renderOrder",
            i64::from(n.render_order) == wn.at("renderOrder").i(),
        );
        chk("visible", n.visible == wn.at("visible").b());
        let ud = wn.at("ud").obj();
        let hit = ud.get(COMMANDER_STAR_HIT_UD).is_some_and(J::b);
        chk("ud.commanderStarBadgeHit", n.commander_star_hit == hit);
        chk("ud size", ud.len() == usize::from(n.commander_star_hit));
        chk("no veteran hit", !n.veteran_badge_hit);
        match &n.kind {
            NodeKind::Group => chk("type", wn.at("type").s() == "Group"),
            NodeKind::Mesh { geometry, material } => {
                chk("type", wn.at("type").s() == "Mesh");
                let g = geos
                    .arr()
                    .iter()
                    .find(|g| g.at("id").s() == wn.at("geo").s())
                    .expect("geo");
                let mesh = geometry.mesh();
                let f32s = |v: &[f32]| v.iter().map(|x| x.to_bits()).collect::<Vec<_>>();
                chk(
                    "geo vtx",
                    i64::try_from(mesh.vertex_count()).expect("vtx") == g.at("vtx").i(),
                );
                chk(
                    "geo position",
                    f32s(&mesh.positions) == f32_bits(g.at("position")),
                );
                chk(
                    "geo normal",
                    f32s(&mesh.normals) == f32_bits(g.at("normal")),
                );
                chk("geo uv", f32s(&mesh.uvs) == f32_bits(g.at("uv")));
                let m = wn.at("mat");
                chk("mat type", m.at("type").s() == "MeshStandardMaterial");
                chk("mat kind", material.kind == MaterialKind::Standard);
                chk("mat color", bits3(material.color) == want3(m.at("color")));
                chk(
                    "mat emissive",
                    material.emissive.map(bits3) == Some(want3(m.at("emissive"))),
                );
                chk("mat map", material.map.is_none() && m.at("map").is_null());
                chk(
                    "mat transparent",
                    material.transparent == m.at("transparent").b(),
                );
                chk(
                    "mat depthTest",
                    material.depth_test == m.at("depthTest").b(),
                );
                chk(
                    "mat depthWrite",
                    material.depth_write == m.at("depthWrite").b(),
                );
                chk(
                    "mat toneMapped",
                    material.tone_mapped == m.at("toneMapped").b(),
                );
                chk(
                    "mat side",
                    material.side == Side::Front && m.at("side").i() == 0,
                );
                chk(
                    "mat opacity",
                    material.opacity.to_bits() == hex_bits(m.at("opacity")),
                );
                chk(
                    "mat roughness",
                    material.roughness.map(f64::to_bits) == Some(hex_bits(m.at("roughness"))),
                );
                chk(
                    "mat metalness",
                    material.metalness.map(f64::to_bits) == Some(hex_bits(m.at("metalness"))),
                );
            }
            NodeKind::Sprite { .. } => chk("type", false),
        }
    }
    bad
}

fn b3() -> J {
    parse(&std::fs::read_to_string(format!("{}/repin3d_fixtures/b3.json", dir())).expect("b3.json"))
}

#[test]
fn commander_star_matches_the_web_bit_for_bit() {
    let fx = b3();
    assert_eq!(
        fx.at("consts").at("COMMANDER_STAR_HIT_UD").s(),
        COMMANDER_STAR_HIT_UD
    );
    let geos = fx.at("geos");
    let rust = build_commander_star();
    assert_eq!(rust.nodes[0].name, COMMANDER_STAR_BADGE);
    let mut bad = Vec::new();
    let mut trees = 0;
    for (ci, c) in fx.at("cases").arr().iter().enumerate() {
        // Replay the sequence with the Rust sync rule; the web state after
        // each step must match (presence, identity kept, child count, tree).
        let mut present = false;
        for (si, s) in c.at("steps").arr().iter().enumerate() {
            let has = s.at("has").b();
            let u = commander_star_update(present, has);
            let same = present && u == CommanderStarUpdate::Keep;
            present = match u {
                CommanderStarUpdate::Add => true,
                CommanderStarUpdate::Remove => false,
                CommanderStarUpdate::Keep => present,
            };
            let what = format!("case {ci} step {si}");
            if present != s.at("present").b() {
                bad.push(format!("{what}: present {present}"));
            }
            if same != s.at("same").b() {
                bad.push(format!("{what}: same {same}"));
            }
            if i64::from(present) != s.at("children").i() {
                bad.push(format!("{what}: children"));
            }
            let t = s.at("tree");
            if !t.is_null() {
                trees += 1;
                bad.extend(commander_tree_check(&rust, t, geos, &what));
            }
        }
    }
    let co = fx.at("coexist");
    assert_eq!(
        co.at("children").arr().iter().map(J::s).collect::<Vec<_>>(),
        vec![COMMANDER_STAR_BADGE],
        "veteran stars removed, the commander badge stays (separate child)"
    );
    bad.extend(commander_tree_check(
        &rust,
        co.at("commander"),
        geos,
        "coexist",
    ));
    assert!(bad.is_empty(), "{bad:#?}");
    assert_eq!(trees, 10); // steps with the badge present (gen_b3.ts SEQS)
}

#[test]
fn commander_star_update_edges() {
    use CommanderStarUpdate::{Add, Keep, Remove};
    assert_eq!(commander_star_update(false, false), Keep);
    assert_eq!(commander_star_update(false, true), Add);
    assert_eq!(commander_star_update(true, true), Keep);
    assert_eq!(commander_star_update(true, false), Remove);
    let t = build_commander_star();
    assert_eq!(t.nodes.len(), 3);
    assert!(!t.nodes[0].commander_star_hit);
    assert!(t.nodes[1..].iter().all(|n| n.commander_star_hit));
}
