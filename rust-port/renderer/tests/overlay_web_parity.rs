//! MOD-08 unit overlays vs the web (R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1).
//!
//! `tests/fixtures/overlay/overlay.json` + `ref/*.rgba` were produced by
//! RUNNING the web modules of pin `edb8fb56` unchanged
//! (`render/unitOwnerEmblem.ts`, `unitStatPlate.ts`, `unitUpgradeBadges.ts`,
//! `unitVeteranBadges.ts`, bundled with three@0.169.0 by esbuild 0.24.0) in
//! headless Chromium 141 on a real Canvas 2D with the bundled fonts
//! (`gen.ts` + `gen.mjs`, README in the fixture directory):
//!
//! 1. `constants_match_the_web_bit_for_bit` — exported constants (`to_bits`);
//! 2. `emblem_keys_match_the_web` — `ownerEmblemKey` for 416 contexts;
//! 3. `badge_labels_match_the_web`;
//! 4. `trees_match_the_web_bit_for_bit` — 111 Three sub-trees (plate, badge
//!    row, veteran stars, legacy sprite; fresh and after a history of
//!    `sync()` calls): node kind, name, parent, position / rotation / scale
//!    bits, `renderOrder`, `visible`, `userData`, geometry arrays (f32 bits),
//!    material parameters (bits), texture identity (a consistent bijection
//!    web texture ↔ [`TextureRef`]) and the token `userData` bookkeeping;
//! 5. `textures_match_chromium` — every web canvas texture (36, + 15 first
//!    "initial" states) vs the Rust texture: size, Three metadata, and pixels
//!    within the RR-T8a/b/c limits (SSIM ≥ 0.985, mean_abs ≤ 1.5,
//!    px>16 ≤ 5 %);
//! 6. `textures_match_golden_hashes` — FNV-1a 64 per texture
//!    (`golden.tsv`; `OVERLAY_BLESS=1` re-blesses after a reviewed change);
//! 7. `rendering_twice_is_identical`;
//! 8. `fixtures_match_manifest_sha256` (+ size ≤ 8 MB).

#[path = "unit_core_json.rs"]
mod json;

use std::collections::{BTreeMap, HashMap};
use std::fmt::Write as _;

use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight};
use civ_renderer::units::overlay::emblem::{
    legacy_owner_emblem_sprite, owner_emblem_key, render_owner_emblem, OwnerEmblemAssets,
    OwnerEmblemContext,
};
use civ_renderer::units::overlay::stat_plate::{
    self, build_stat_plate, render_plate_background, render_power_digit, render_power_frame,
    StatPlateSyncState, StatPlateVitals,
};
use civ_renderer::units::overlay::upgrade_badges::{
    self, build_upgrade_badge_row, pack_row_state, path_badge_label, render_upgrade_badge,
    UpgradeBadgeAssets,
};
use civ_renderer::units::overlay::veteran_badges::{
    self, build_veteran_badge, stars_for_level, VETERAN_BADGE_HIT_UD,
};
use civ_renderer::units::overlay::{
    MaterialKind, NodeKind, OverlayMaterial, OverlayTexture, OverlayTree, Side, TextureRef,
};
use json::{parse, J};

const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;

fn fx_path(rel: &str) -> String {
    format!(
        "{}/tests/fixtures/overlay/{rel}",
        env!("CARGO_MANIFEST_DIR")
    )
}

fn fixture() -> J {
    parse(&std::fs::read_to_string(fx_path("overlay.json")).expect("overlay.json"))
}

fn f64_of(j: &J) -> f64 {
    f64::from_bits(j.bits()[0])
}

// ------------------------------------------------------------------ inputs

struct FxAssets;

impl OwnerEmblemAssets for FxAssets {
    #[allow(clippy::float_cmp)]
    fn leader_portrait_jpeg(&self, civ_id: &str, era: f64) -> Option<Vec<u8>> {
        // gen.mjs PORTRAITS: "<civ>|<era>" → file.
        let file = match civ_id {
            "grecy" if era == 2.0 => "portrait-grecy-braz",
            "zulusi" if era == 3.0 => "portrait-zulusi-zelazo",
            "egipt" if era == 1.0 => "portrait-egipt-kamien",
            _ => return None,
        };
        Some(std::fs::read(fx_path(&format!("input/{file}.jpg"))).expect("portrait"))
    }
    fn civ_sigil_svg(&self, civ_id: &str) -> String {
        std::fs::read_to_string(fx_path(&format!("input/civ-{civ_id}-40.svg"))).unwrap_or_default()
    }
    fn barbarian_sigil_svg(&self) -> String {
        std::fs::read_to_string(fx_path("input/chip-death-40.svg")).expect("chip-death")
    }
}

impl UpgradeBadgeAssets for FxAssets {
    fn barracks_svg(&self) -> String {
        std::fs::read_to_string(fx_path("input/bld-koszary-40.svg")).expect("koszary")
    }
    fn forge_svg(&self) -> String {
        std::fs::read_to_string(fx_path("input/bld-kuznia-40.svg")).expect("kuznia")
    }
}

fn ctx_of(j: &J) -> OwnerEmblemContext {
    OwnerEmblemContext {
        civ_id: j
            .get("civId")
            .filter(|v| !v.is_null())
            .map(|v| v.s().to_owned()),
        era: f64_of(j.at("era")),
        is_city_state: j.at("isCityState").b(),
        is_barbarian: j.at("isBarbarian").b(),
    }
}

fn ctx_named(fx: &J, name: &str) -> Option<OwnerEmblemContext> {
    if name == "none" {
        return None;
    }
    Some(ctx_of(fx.at("inputs").at("ctx").at(name)))
}

#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn vitals_named(fx: &J, name: &str) -> StatPlateVitals {
    let v = fx.at("inputs").at("vitals").at(name);
    let o = |k: &str| v.get(k).filter(|x| !x.is_null()).map(f64_of);
    StatPlateVitals {
        ruch_left: o("ruchLeft"),
        ruch_max: o("ruchMax"),
        hp: o("hp"),
        hp_max: o("hpMax"),
        field_power_m: o("fieldPowerM"),
        owner_color: o("ownerColor").map(|c| c as u32),
    }
}

// ------------------------------------------------------------------ comparison helpers

#[derive(Default)]
struct Cmp {
    errors: Vec<String>,
    checks: usize,
}

impl Cmp {
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, what: &str, got: T, want: T) {
        self.checks += 1;
        if got != want && self.errors.len() < 60 {
            self.errors
                .push(format!("{what}: rust {got:?} != web {want:?}"));
        }
    }
    fn bits(&mut self, what: &str, got: f64, want: &J) {
        self.eq(what, got.to_bits(), want.bits()[0]);
    }
}

fn three_side(s: Side) -> i64 {
    match s {
        Side::Front => 0,
        Side::Double => 2,
    }
}

/// web texture id ↔ (phase, TextureRef) bijection.
#[derive(Default)]
struct TexMap {
    web_to_rust: BTreeMap<String, (bool, TextureRef)>,
    rust_to_web: BTreeMap<(bool, TextureRef), String>,
}

impl TexMap {
    fn link(
        &mut self,
        c: &mut Cmp,
        what: &str,
        web: &J,
        rust: Option<&TextureRef>,
        no_assets: bool,
    ) {
        match (web.is_null(), rust) {
            (true, None) => {}
            (false, Some(r)) => {
                let w = web.s().to_owned();
                let key = (no_assets, r.clone());
                let a = self
                    .web_to_rust
                    .entry(w.clone())
                    .or_insert_with(|| key.clone())
                    .clone();
                let b = self
                    .rust_to_web
                    .entry(key.clone())
                    .or_insert_with(|| w.clone())
                    .clone();
                c.eq(&format!("{what} texture web→rust"), &a, &key);
                c.eq(&format!("{what} texture rust→web"), &b, &w);
            }
            _ => c.eq(
                &format!("{what} texture presence"),
                rust.is_some(),
                !web.is_null(),
            ),
        }
    }
}

fn material_check(c: &mut Cmp, tm: &mut TexMap, what: &str, m: &OverlayMaterial, w: &J, na: bool) {
    let ty = match m.kind {
        MaterialKind::Standard => "MeshStandardMaterial",
        MaterialKind::Sprite => "SpriteMaterial",
    };
    c.eq(&format!("{what} type"), ty, w.at("type").s());
    for (k, got) in [("color", Some(m.color)), ("emissive", m.emissive)] {
        let wj = w.at(k);
        match got {
            None => c.eq(&format!("{what} {k} null"), true, wj.is_null()),
            Some(v) => {
                for (i, x) in v.iter().enumerate() {
                    c.bits(&format!("{what} {k}[{i}]"), *x, &wj.arr()[i]);
                }
            }
        }
    }
    tm.link(c, &format!("{what} map"), w.at("map"), m.map.as_ref(), na);
    tm.link(
        c,
        &format!("{what} emissiveMap"),
        w.at("emissiveMap"),
        m.emissive_map.as_ref(),
        na,
    );
    c.eq(
        &format!("{what} transparent"),
        m.transparent,
        w.at("transparent").b(),
    );
    c.eq(
        &format!("{what} depthTest"),
        m.depth_test,
        w.at("depthTest").b(),
    );
    c.eq(
        &format!("{what} depthWrite"),
        m.depth_write,
        w.at("depthWrite").b(),
    );
    c.eq(
        &format!("{what} toneMapped"),
        m.tone_mapped,
        w.at("toneMapped").b(),
    );
    c.eq(
        &format!("{what} side"),
        three_side(m.side),
        w.at("side").i(),
    );
    c.bits(&format!("{what} opacity"), m.opacity, w.at("opacity"));
    for (k, got) in [("roughness", m.roughness), ("metalness", m.metalness)] {
        match got {
            None => c.eq(&format!("{what} {k} null"), true, w.at(k).is_null()),
            Some(v) => c.bits(&format!("{what} {k}"), v, w.at(k)),
        }
    }
    c.eq(
        &format!("{what} flatShading"),
        false,
        w.at("flatShading").b(),
    );
}

fn f32_hex_bits(j: &J) -> Vec<u32> {
    j.arr()
        .iter()
        .map(|x| u32::from_str_radix(x.s(), 16).expect("f32 hex"))
        .collect()
}

fn geometry_check(c: &mut Cmp, what: &str, rust: &civ_renderer::geom::Mesh, w: &J) {
    let bits = |v: &[f32]| v.iter().map(|x| x.to_bits()).collect::<Vec<_>>();
    c.eq(
        &format!("{what} vtx"),
        rust.vertex_count() as i64,
        w.at("vtx").i(),
    );
    c.eq(
        &format!("{what} position"),
        bits(&rust.positions),
        f32_hex_bits(w.at("position")),
    );
    c.eq(
        &format!("{what} normal"),
        bits(&rust.normals),
        f32_hex_bits(w.at("normal")),
    );
    c.eq(
        &format!("{what} uv"),
        bits(&rust.uvs),
        f32_hex_bits(w.at("uv")),
    );
    let idx = w.at("index");
    let widx: Option<Vec<u32>> = if idx.is_null() {
        None
    } else {
        Some(idx.arr().iter().map(J::u).collect())
    };
    c.eq(&format!("{what} index"), rust.indices.clone(), widx);
    let wg: Vec<(u32, u32, u32)> = w
        .at("groups")
        .arr()
        .iter()
        .map(|g| (g.arr()[0].u(), g.arr()[1].u(), g.arr()[2].u()))
        .collect();
    let rg: Vec<(u32, u32, u32)> = rust
        .groups
        .iter()
        .map(|g| (g.start, g.count, g.material_index))
        .collect();
    c.eq(&format!("{what} groups"), rg, wg);
}

/// Compares a Rust sub-tree (`None` = nothing added) with the web token tree
/// (`nodes[0]` = the token group, its descendants = the sub-tree).
fn tree_check(
    c: &mut Cmp,
    tm: &mut TexMap,
    id: &str,
    rust: Option<&OverlayTree>,
    web: &J,
    fx: &J,
    na: bool,
) {
    let wn = web.arr();
    let rn = rust.map_or(&[][..], |t| t.nodes.as_slice());
    c.eq(&format!("{id} node count"), rn.len() + 1, wn.len());
    if rn.len() + 1 != wn.len() {
        return;
    }
    let geos: HashMap<&str, &J> = fx
        .at("geos")
        .arr()
        .iter()
        .map(|g| (g.at("id").s(), g))
        .collect();
    for (i, n) in rn.iter().enumerate() {
        let w = &wn[i + 1];
        let what = format!("{id}#{}", i + 1);
        let ty = match n.kind {
            NodeKind::Group => "Group",
            NodeKind::Mesh { .. } => "Mesh",
            NodeKind::Sprite { .. } => "Sprite",
        };
        c.eq(&format!("{what} type"), ty, w.at("type").s());
        c.eq(&format!("{what} name"), n.name, w.at("name").s());
        let parent = n.parent.map_or(0, |p| p as i64 + 1);
        c.eq(&format!("{what} parent"), parent, w.at("parent").i());
        for k in 0..3 {
            c.bits(
                &format!("{what} p[{k}]"),
                n.position[k],
                &w.at("p").arr()[k],
            );
            c.bits(
                &format!("{what} r[{k}]"),
                n.rotation[k],
                &w.at("r").arr()[k],
            );
            c.bits(&format!("{what} s[{k}]"), n.scale[k], &w.at("s").arr()[k]);
        }
        c.eq(
            &format!("{what} rotation order"),
            "XYZ",
            w.at("r").arr()[3].s(),
        );
        c.eq(
            &format!("{what} renderOrder"),
            i64::from(n.render_order),
            w.at("renderOrder").i(),
        );
        c.eq(&format!("{what} visible"), n.visible, w.at("visible").b());
        let hit = w.at("ud").get(VETERAN_BADGE_HIT_UD).is_some_and(J::b);
        c.eq(
            &format!("{what} userData.veteranBadgeHit"),
            n.veteran_badge_hit,
            hit,
        );
        c.eq(
            &format!("{what} userData size"),
            usize::from(n.veteran_badge_hit),
            w.at("ud").obj().len(),
        );
        match &n.kind {
            NodeKind::Group => {}
            NodeKind::Mesh { geometry, material } => {
                geometry_check(
                    c,
                    &format!("{what} geo"),
                    &geometry.mesh(),
                    geos[w.at("geo").s()],
                );
                material_check(c, tm, &format!("{what} mat"), material, w.at("mat"), na);
            }
            NodeKind::Sprite { center, material } => {
                c.bits(
                    &format!("{what} center.x"),
                    center[0],
                    &w.at("center").arr()[0],
                );
                c.bits(
                    &format!("{what} center.y"),
                    center[1],
                    &w.at("center").arr()[1],
                );
                material_check(c, tm, &format!("{what} mat"), material, w.at("mat"), na);
            }
        }
    }
}

/// Rebuilds every web tree in Rust and compares; returns the texture map.
fn compare_all_trees(fx: &J, c: &mut Cmp) -> TexMap {
    let mut tm = TexMap::default();
    for t in fx.at("trees").arr() {
        let id = t.at("id").s();
        let na = t.get("noAssets").is_some_and(J::b);
        let ud = t.at("nodes").arr()[0].at("ud");
        let rust = match t.at("kind").s() {
            "plate" => {
                let octx = ctx_named(fx, t.at("ctx").s());
                let vitals = vitals_named(fx, t.at("vitals").s());
                // sync() bookkeeping through the whole history (or one call).
                let mut st = StatPlateSyncState::default();
                let steps: Vec<(String, String)> = t.get("history").map_or_else(
                    || vec![(t.at("ctx").s().to_owned(), t.at("vitals").s().to_owned())],
                    |h| {
                        h.arr()
                            .iter()
                            .map(|s| (s.arr()[0].s().to_owned(), s.arr()[1].s().to_owned()))
                            .collect()
                    },
                );
                for (cn, vn) in &steps {
                    st.apply(ctx_named(fx, cn).as_ref(), &vitals_named(fx, vn));
                }
                c.eq(
                    &format!("{id} ud.statPlateOwnerKey"),
                    st.owner_key.as_deref(),
                    Some(ud.at("statPlateOwnerKey").s()),
                );
                c.eq(
                    &format!("{id} ud.statPlatePowerKey"),
                    st.power_key.as_deref(),
                    Some(ud.at("statPlatePowerKey").s()),
                );
                c.eq(
                    &format!("{id} ud.statPlateBars"),
                    st.bars.map(f64::to_bits),
                    Some(ud.at("statPlateBars").f().to_bits()),
                );
                Some(build_stat_plate(octx.as_ref(), &vitals))
            }
            "badges" => {
                let (a, s, n) = (t.at("armor").u(), t.at("soft").u(), t.at("stars").u());
                let (a, s) = (u8::try_from(a).expect("lvl"), u8::try_from(s).expect("lvl"));
                c.eq(
                    &format!("{id} ud.upgBadgeRowState"),
                    i64::from(pack_row_state(a, s, n)),
                    ud.at("upgBadgeRowState").i(),
                );
                build_upgrade_badge_row(a, s, n)
            }
            "veteran" => {
                let n = t.at("stars").u();
                c.eq(
                    &format!("{id} ud.vetBadgeStarCount"),
                    i64::from(n),
                    ud.at("vetBadgeStarCount").i(),
                );
                build_veteran_badge(n)
            }
            "veteranLevel" => {
                let lv = u8::try_from(t.at("level").u()).expect("level");
                build_veteran_badge(stars_for_level(lv))
            }
            "legacyEmblem" => {
                let octx = ctx_named(fx, t.at("ctx").s());
                let key = octx.as_ref().map_or_else(String::new, owner_emblem_key);
                c.eq(
                    &format!("{id} ud.ownerEmblemKey"),
                    key.as_str(),
                    ud.at("ownerEmblemKey").s(),
                );
                legacy_owner_emblem_sprite(octx.as_ref())
            }
            k => panic!("tree kind {k}"),
        };
        tree_check(c, &mut tm, id, rust.as_ref(), t.at("nodes"), fx, na);
    }
    tm
}

// ------------------------------------------------------------------ textures

struct Rendered {
    initial: OverlayTexture,
    texture: OverlayTexture,
}

fn render(r: &TextureRef, no_assets: bool, emblem_ctx: &FirstCtx) -> Rendered {
    let same = |t: OverlayTexture| Rendered {
        initial: t.clone(),
        texture: t,
    };
    match r {
        TextureRef::PlateBackground => same(render_plate_background().expect("bg")),
        TextureRef::PowerFrame => same(render_power_frame().expect("frame")),
        TextureRef::PowerDigit(d) => same(render_power_digit(*d).expect("digit").expect("0-9")),
        TextureRef::OwnerEmblem(key) => {
            let octx = &emblem_ctx[&(no_assets, key.clone())];
            let assets: Option<&dyn OwnerEmblemAssets> =
                if no_assets { None } else { Some(&FxAssets) };
            let e = render_owner_emblem(octx, assets).expect("emblem");
            Rendered {
                initial: e.initial,
                texture: e.texture,
            }
        }
        TextureRef::UpgradeBadge(path, level) => {
            let assets: Option<&dyn UpgradeBadgeAssets> =
                if no_assets { None } else { Some(&FxAssets) };
            let b = render_upgrade_badge(*path, *level, assets)
                .expect("badge")
                .expect("1-3");
            Rendered {
                initial: b.initial,
                texture: b.texture,
            }
        }
    }
}

/// Every web texture id → (no-assets phase, TextureRef), plus the first
/// context of every emblem key (the web caches per key: the first one wins).
/// web texture id → (no-assets phase, texture).
type Inventory = BTreeMap<String, (bool, TextureRef)>;
/// (no-assets phase, emblem key) → first context of that key.
type FirstCtx = HashMap<(bool, String), OwnerEmblemContext>;

fn texture_inventory(fx: &J) -> (Inventory, FirstCtx) {
    let mut c = Cmp::default();
    let mut tm = compare_all_trees(fx, &mut c);
    let mut first_ctx = HashMap::new();
    for t in fx.at("textures").arr() {
        let na = t.at("phase").s() == "noassets";
        let octx = ctx_named(fx, t.at("ctx").s()).expect("ctx");
        let key = owner_emblem_key(&octx);
        c.eq("emblem key", key.as_str(), t.at("key").s());
        first_ctx.entry((na, key.clone())).or_insert(octx);
        tm.link(
            &mut c,
            "emblem",
            t.at("tex"),
            Some(&TextureRef::OwnerEmblem(key)),
            na,
        );
    }
    assert!(c.errors.is_empty(), "inventory: {:#?}", c.errors);
    (tm.web_to_rust, first_ctx)
}

fn ref_rgba(name: &str) -> Option<Vec<u8>> {
    std::fs::read(fx_path(&format!("ref/{name}.rgba"))).ok()
}

// ------------------------------------------------------------------ tests

#[test]
fn constants_match_the_web_bit_for_bit() {
    let fx = fixture();
    let k = fx.at("consts");
    let mut c = Cmp::default();
    let f: &[(&str, f64)] = &[
        ("PLATE_BAR_W", stat_plate::PLATE_BAR_W),
        ("PLATE_BAR_H", stat_plate::PLATE_BAR_H),
        ("PLATE_HP_BAR_Y", stat_plate::PLATE_HP_BAR_Y),
        ("PLATE_MOVE_BAR_Y", stat_plate::PLATE_MOVE_BAR_Y),
        ("PLATE_BAR_LEFT_X", stat_plate::PLATE_BAR_LEFT_X),
        ("PLATE_OWNER_ICON_SIZE", stat_plate::PLATE_OWNER_ICON_SIZE),
        ("PLATE_BAR_DY", stat_plate::PLATE_BAR_DY),
        ("BADGE_ROW_Y", stat_plate::BADGE_ROW_Y),
        ("GENERAL_SLOT_Y", stat_plate::GENERAL_SLOT_Y),
        ("GENERAL_SLOT_SIZE", stat_plate::GENERAL_SLOT_SIZE),
        ("PLATE_MAX_HALF_WIDTH", stat_plate::PLATE_MAX_HALF_WIDTH),
        ("PLATE_TILT_RAD", stat_plate::PLATE_TILT_RAD),
        ("PLATE_FILL_Z", stat_plate::PLATE_FILL_Z),
        (
            "VETERAN_BADGE_RESERVED_Y",
            upgrade_badges::VETERAN_BADGE_RESERVED_Y,
        ),
        ("VETERAN_STAR_R", upgrade_badges::VETERAN_STAR_R),
        ("VETERAN_STAR_SPACING", upgrade_badges::VETERAN_STAR_SPACING),
        (
            "VETERAN_STAR_OUTLINE_SCALE",
            upgrade_badges::VETERAN_STAR_OUTLINE_SCALE,
        ),
        ("BADGE_ROW_TILT_RAD", upgrade_badges::BADGE_ROW_TILT_RAD),
        (
            "PATH_BADGE_COLOR_1",
            f64::from(upgrade_badges::PATH_BADGE_COLOR[0]),
        ),
        (
            "PATH_BADGE_COLOR_2",
            f64::from(upgrade_badges::PATH_BADGE_COLOR[1]),
        ),
        (
            "PATH_BADGE_COLOR_3",
            f64::from(upgrade_badges::PATH_BADGE_COLOR[2]),
        ),
        (
            "VETERAN_BADGE_COLOR",
            f64::from(veteran_badges::VETERAN_BADGE_COLOR),
        ),
        (
            "VETERAN_BADGE_OUTLINE_COLOR",
            f64::from(veteran_badges::VETERAN_BADGE_OUTLINE_COLOR),
        ),
    ];
    for (name, v) in f {
        c.bits(name, *v, k.at(name));
    }
    c.eq(
        "VETERAN_BADGE_HIT_UD",
        VETERAN_BADGE_HIT_UD,
        k.at("VETERAN_BADGE_HIT_UD").s(),
    );
    assert_eq!(c.checks, f.len() + 1);
    assert!(c.errors.is_empty(), "{:#?}", c.errors);
}

#[test]
fn emblem_keys_match_the_web() {
    let fx = fixture();
    let rows = fx.at("keys").arr();
    assert_eq!(rows.len(), 416);
    let mut c = Cmp::default();
    for r in rows {
        let a = r.arr();
        let octx = OwnerEmblemContext {
            civ_id: if a[0].is_null() {
                None
            } else {
                Some(a[0].s().to_owned())
            },
            era: f64_of(&a[1]),
            is_city_state: a[2].b(),
            is_barbarian: a[3].b(),
        };
        c.eq(
            &format!("{octx:?}"),
            owner_emblem_key(&octx).as_str(),
            a[4].s(),
        );
    }
    assert!(c.errors.is_empty(), "{:#?}", c.errors);
}

#[test]
fn badge_labels_match_the_web() {
    let fx = fixture();
    for l in fx.at("labels").arr() {
        let lv = u8::try_from(l.arr()[0].u()).expect("level");
        assert_eq!(path_badge_label(lv), l.arr()[1].s(), "level {lv}");
    }
}

#[test]
fn trees_match_the_web_bit_for_bit() {
    let fx = fixture();
    let mut c = Cmp::default();
    let tm = compare_all_trees(&fx, &mut c);
    println!(
        "trees={} checks={} web textures referenced by trees={}",
        fx.at("trees").arr().len(),
        c.checks,
        tm.web_to_rust.len()
    );
    for kind in ["plate", "badges", "veteran", "veteranLevel", "legacyEmblem"] {
        assert!(
            fx.at("trees")
                .arr()
                .iter()
                .any(|t| t.at("kind").s() == kind),
            "fixture covers {kind}"
        );
    }
    assert!(c.errors.is_empty(), "{:#?}", c.errors);
}

/// The trees in the fixture are the node (V8 12.4) run; the same bundle in
/// Chromium 141 gives 10 differences, all listed by the generator: 8 colour
/// channels off by 1 ulp (`Math.pow` of `THREE.Color.setHex` sRGB→linear in
/// the newer V8) and 2 star outline points of the informational geometry
/// `params` (`Math.cos`/`Math.sin`, the f32 vertex arrays are identical).
#[test]
fn chromium_tree_differences_are_only_last_bit_noise() {
    let fx = fixture();
    let d = fx.at("chromiumTreeDiffs").arr();
    assert_eq!(d.len(), 10, "documented count (P4-32 §4.2)");
    let (mut colour, mut shape) = (0, 0);
    for x in d {
        let a = x.arr();
        let path = a[0].s();
        if path.contains(".mat.color.") || path.contains(".mat.emissive.") {
            let (n, c) = (a[1].bits()[0], a[2].bits()[0]);
            assert_eq!(n.abs_diff(c), 1, "{path}");
            colour += 1;
        } else {
            assert!(
                path.starts_with("geos.") && path.contains(".params.shapes."),
                "{path}"
            );
            let (n, c) = (a[1].f(), a[2].f());
            assert!(
                (n - c).abs() <= 4.0 * f64::EPSILON * n.abs().max(c.abs()),
                "{path}"
            );
            shape += 1;
        }
    }
    assert_eq!((colour, shape), (8, 2));
}

#[test]
fn textures_match_chromium() {
    let fx = fixture();
    let (inv, first_ctx) = texture_inventory(&fx);
    let meta: HashMap<&str, &J> = fx
        .at("textureList")
        .arr()
        .iter()
        .map(|t| (t.at("id").s(), t))
        .collect();
    assert_eq!(
        inv.len(),
        meta.len(),
        "every web texture is mapped to a Rust texture"
    );
    let mut c = Cmp::default();
    let mut failures = Vec::new();
    println!("texture | phase | ref | size | max_abs | mean_abs | px>16 % | ssim");
    for (id, (na, r)) in &inv {
        let m = meta[id.as_str()];
        let out = render(r, *na, &first_ctx);
        let t = &out.texture;
        c.eq(&format!("{id} width"), i64::from(t.width), m.at("w").i());
        c.eq(&format!("{id} height"), i64::from(t.height), m.at("h").i());
        c.eq(
            &format!("{id} minFilter"),
            i64::from(t.min_filter.three_constant()),
            m.at("minFilter").i(),
        );
        c.eq(
            &format!("{id} magFilter"),
            i64::from(t.mag_filter.three_constant()),
            m.at("magFilter").i(),
        );
        c.eq(
            &format!("{id} generateMipmaps"),
            t.generate_mipmaps,
            m.at("generateMipmaps").b(),
        );
        c.eq(
            &format!("{id} colorSpace"),
            if t.srgb { "srgb" } else { "" },
            m.at("colorSpace").s(),
        );
        c.eq(&format!("{id} flipY"), t.flip_y, m.at("flipY").b());
        c.eq(
            &format!("{id} redrawn"),
            i64::from(t.redrawn_after_load) + 1,
            m.at("version").i(),
        );
        c.eq(
            &format!("{id} initial==final"),
            out.initial == out.texture,
            m.at("initialEqualsFinal").b(),
        );
        let mut phases = vec![("final", t, id.clone())];
        if !m.at("initialEqualsFinal").b() {
            phases.push(("initial", &out.initial, format!("{id}.initial")));
        }
        for (phase, tex, file) in phases {
            let want = ref_rgba(&file).unwrap_or_else(|| panic!("ref/{file}.rgba"));
            let (w, h) = (tex.width as usize, tex.height as usize);
            assert_eq!(want.len(), w * h * 4, "{file}: size");
            let d = compare_premultiplied(&tex.premultiplied, &premultiply_straight(&want), w, h);
            println!(
                "{id} | {phase} | {r:?}{} | {w}x{h} | {} | {:.4} | {:.3} | {:.5}",
                if *na { " (no assets)" } else { "" },
                d.max_abs,
                d.mean_abs,
                d.frac_px_over_16 * 100.0,
                d.ssim
            );
            if d.ssim < MIN_SSIM
                || d.mean_abs > MAX_MEAN_ABS
                || d.frac_px_over_16 > MAX_FRAC_PX_OVER_16
            {
                failures.push(format!("{file} ({r:?})"));
            }
        }
    }
    assert!(c.errors.is_empty(), "{:#?}", c.errors);
    assert!(
        failures.is_empty(),
        "textures over threshold: {failures:#?}"
    );
}

fn golden_text(fx: &J) -> String {
    let (inv, first_ctx) = texture_inventory(fx);
    let mut out = String::from(
        "# R-RUSTPORT-P4-32 golden FNV-1a 64 of the premultiplied RGBA8 of every overlay texture\n# web id<TAB>texture<TAB>initial<TAB>final\n",
    );
    for (id, (na, r)) in &inv {
        let t = render(r, *na, &first_ctx);
        writeln!(
            out,
            "{id}\t{r:?}{}\t{:016x}\t{:016x}",
            if *na { " no-assets" } else { "" },
            t.initial.hash,
            t.texture.hash
        )
        .expect("write");
    }
    out
}

#[test]
fn textures_match_golden_hashes() {
    let fx = fixture();
    let out = golden_text(&fx);
    print!("{out}");
    let path = fx_path("golden.tsv");
    if std::env::var_os("OVERLAY_BLESS").is_some() {
        std::fs::write(&path, &out).expect("bless golden.tsv");
        return;
    }
    let want = std::fs::read_to_string(&path).expect("golden.tsv");
    assert_eq!(
        out, want,
        "golden hashes changed (OVERLAY_BLESS=1 to re-bless)"
    );
}

#[test]
fn rendering_twice_is_identical() {
    let fx = fixture();
    assert_eq!(golden_text(&fx), golden_text(&fx));
    let v = StatPlateVitals::default();
    assert_eq!(build_stat_plate(None, &v), build_stat_plate(None, &v));
}

/// SHA-256 (FIPS 180-4), as in `tests/image_assets.rs`.
fn sha256(data: &[u8]) -> [u8; 32] {
    const K: [u32; 64] = [
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4,
        0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe,
        0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f,
        0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
        0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc,
        0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
        0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116,
        0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7,
        0xc67178f2,
    ];
    let mut h: [u32; 8] = [
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab,
        0x5be0cd19,
    ];
    let mut msg = data.to_vec();
    let bit_len = (data.len() as u64).wrapping_mul(8);
    msg.push(0x80);
    while msg.len() % 64 != 56 {
        msg.push(0);
    }
    msg.extend_from_slice(&bit_len.to_be_bytes());
    for chunk in msg.chunks(64) {
        let mut w = [0u32; 64];
        for (i, word) in chunk.chunks(4).enumerate() {
            w[i] = u32::from_be_bytes([word[0], word[1], word[2], word[3]]);
        }
        for i in 16..64 {
            let s0 = w[i - 15].rotate_right(7) ^ w[i - 15].rotate_right(18) ^ (w[i - 15] >> 3);
            let s1 = w[i - 2].rotate_right(17) ^ w[i - 2].rotate_right(19) ^ (w[i - 2] >> 10);
            w[i] = w[i - 16]
                .wrapping_add(s0)
                .wrapping_add(w[i - 7])
                .wrapping_add(s1);
        }
        let mut v = h;
        for i in 0..64 {
            let s1 = v[4].rotate_right(6) ^ v[4].rotate_right(11) ^ v[4].rotate_right(25);
            let ch = (v[4] & v[5]) ^ (!v[4] & v[6]);
            let t1 = v[7]
                .wrapping_add(s1)
                .wrapping_add(ch)
                .wrapping_add(K[i])
                .wrapping_add(w[i]);
            let s0 = v[0].rotate_right(2) ^ v[0].rotate_right(13) ^ v[0].rotate_right(22);
            let maj = (v[0] & v[1]) ^ (v[0] & v[2]) ^ (v[1] & v[2]);
            let t2 = s0.wrapping_add(maj);
            v[7] = v[6];
            v[6] = v[5];
            v[5] = v[4];
            v[4] = v[3].wrapping_add(t1);
            v[3] = v[2];
            v[2] = v[1];
            v[1] = v[0];
            v[0] = t1.wrapping_add(t2);
        }
        for (a, b) in h.iter_mut().zip(v) {
            *a = a.wrapping_add(b);
        }
    }
    let mut out = [0u8; 32];
    for (i, x) in h.iter().enumerate() {
        out[i * 4..i * 4 + 4].copy_from_slice(&x.to_be_bytes());
    }
    out
}

fn hex(b: &[u8]) -> String {
    b.iter().fold(String::new(), |mut s, x| {
        let _ = write!(s, "{x:02x}");
        s
    })
}

#[test]
fn sha256_matches_standard_vectors() {
    assert_eq!(
        hex(&sha256(b"abc")),
        "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
    assert_eq!(
        hex(&sha256(b"")),
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
}

#[test]
fn fixtures_match_manifest_sha256() {
    let man = std::fs::read_to_string(fx_path("MANIFEST.sha256")).expect("manifest");
    let mut total = 0usize;
    let mut n = 0;
    for line in man.lines() {
        let (want, file) = line.split_once("  ").expect("sha256  file");
        let bytes = std::fs::read(fx_path(file)).unwrap_or_else(|e| panic!("{file}: {e}"));
        if !file.starts_with("../") {
            total += bytes.len();
        }
        assert_eq!(hex(&sha256(&bytes)), want, "{file}");
        n += 1;
    }
    // every fixture file (except the manifest, README and golden table) is listed
    let mut listed = 0;
    for d in ["", "input", "ref"] {
        for e in std::fs::read_dir(fx_path(d)).expect("dir") {
            let e = e.expect("entry");
            if e.file_type().expect("type").is_file() {
                let name = e.file_name().into_string().expect("utf-8");
                if !["MANIFEST.sha256", "README.md", "golden.tsv"].contains(&name.as_str()) {
                    let rel = if d.is_empty() {
                        name
                    } else {
                        format!("{d}/{name}")
                    };
                    assert!(
                        man.contains(&format!("  {rel}\n")),
                        "{rel} missing from MANIFEST"
                    );
                    listed += 1;
                }
            }
        }
    }
    println!("manifest entries={n} fixture files={listed} bytes={total}");
    assert!(total <= 8 * 1024 * 1024, "fixtures over 8 MB: {total}");
}

/// The asset inputs are byte copies of the pin (`gen.mjs` reads them from
/// `git archive edb8fb56`); the RR-T8c fixtures already prove the same bytes
/// against the pin blobs (`image_assets::inputs_are_the_pin_bytes`), so the
/// shared files must be identical to those.
#[test]
fn inputs_equal_the_rr_t8c_pin_inputs() {
    let image = |f: &str| {
        std::fs::read(format!(
            "{}/tests/fixtures/image/input/{f}",
            env!("CARGO_MANIFEST_DIR")
        ))
        .expect("image fixture")
    };
    for (ours, theirs) in [
        ("portrait-grecy-braz.jpg", "portrait-grecy-braz.jpg"),
        ("portrait-zulusi-zelazo.jpg", "portrait-zulusi-zelazo.jpg"),
        ("portrait-egipt-kamien.jpg", "portrait-egipt-kamien.jpg"),
        ("chip-death-40.svg", "chip-death-40.svg"),
        ("civ-grecy-40.svg", "civ-grecy-40.svg"),
        ("civ-zulusi-40.svg", "civ-zulusi-40.svg"),
        ("civ-nieznana-40.svg", "civ-default-40.svg"),
        ("bld-koszary-40.svg", "bld-koszary-40.svg"),
        ("bld-kuznia-40.svg", "bld-kuznia-40.svg"),
    ] {
        let a = std::fs::read(fx_path(&format!("input/{ours}"))).expect("overlay input");
        assert_eq!(a, image(theirs), "{ours} vs image/input/{theirs}");
    }
}
