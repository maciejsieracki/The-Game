//! MOD-10 city overlays vs the web (R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1).
//!
//! `tests/fixtures/cityoverlay/city.json` + `ref/*.rgba` were produced by
//! RUNNING the web modules of pin `edb8fb56` unchanged
//! (`render/cityMapStatChip.ts`, `render/cityOkolicaOverlay.ts`,
//! `render/workerFieldOverlay.ts`, bundled with three@0.169.0 by esbuild
//! 0.24.0) in headless Chromium 141 on a real Canvas 2D with the bundled
//! fonts (pages with `devicePixelRatio` 1, 2 and 1.5) and, for the numbers of
//! the okolica / worker trees, in node 22 (`gen.ts` + `gen.mjs`, README in the
//! fixture directory):
//!
//! 1. `chip_helpers_match_the_web` — `wallKindFromBuilt`,
//!    `defenseTierFromWallKind/City`, `civInitialForIconId`,
//!    `cityMapBadgeKey`, `disposeCityMapBadgeTexturesForOtherLod`,
//!    `workerOwnerColor(Rgba)`;
//! 2. `constants_match_the_web` — the three okolica styles, the palette;
//! 3. `chip_sprites_match_the_web_bit_for_bit` — per badge: key, canvas
//!    size, Three texture metadata, `texture.version` (1 + loaded images),
//!    the sprite (position / scale / centre bits, `renderOrder`, material);
//! 4. `chip_textures_match_chromium` — pixels within the RR-T8a/b/c limits
//!    (SSIM ≥ 0.985, mean_abs ≤ 1.5, px>16 ≤ 5 %);
//! 5. `okolica_trees_match_the_web_bit_for_bit` /
//!    `okolica_textures_match_chromium`;
//! 6. `worker_trees_match_the_web_bit_for_bit` (incl. the fog pass) /
//!    `worker_textures_match_chromium`;
//! 7. `chromium_tree_differences_are_last_bit_noise`;
//! 8. `textures_match_golden_hashes` (`golden.tsv`; `CITYOVERLAY_BLESS=1`
//!    re-blesses after a reviewed change), `rendering_twice_is_identical`;
//! 9. `fixtures_match_manifest_sha256` (+ size ≤ 8 MB),
//!    `inputs_equal_the_rr_t8c_pin_inputs`.

#[path = "unit_core_json.rs"]
mod json;

use std::collections::{HashMap, HashSet};
use std::fmt::Write as _;

use civ_renderer::cities::overlay::okolica::{
    build_city_okolica_overlay, CityOkolicaOverlayParams, OkolicaMap, TileYield,
    CITY_CENTER_OVERLAY_STYLE, CITY_RANGE_OVERLAY_STYLE, CITY_WORKED_OVERLAY_STYLE,
};
use civ_renderer::cities::overlay::stat_chip::{
    badge_keys_for_other_lod, city_map_badge_key, city_map_badge_key_legacy, city_map_badge_sprite,
    civ_initial_for_icon_id, defense_tier_from_city, defense_tier_from_wall_kind, legacy_input,
    paint_city_map_badge, render_city_map_badge, wall_kind_from_built, CityMapBadgeAssets,
    CityMapBadgeInput, CityMapWallKind, CivMedallionContent,
};
use civ_renderer::cities::overlay::worker_field::{
    render_worker_icon, sync_worker_field_overlay, sync_worker_field_overlay_fog,
    worker_owner_color, worker_owner_color_rgba, WorkerFieldOverlay, WORKER_OWNER_COLORS,
};
use civ_renderer::cities::overlay::{CanvasTexture, SpriteNode, TextureRef};
use civ_renderer::models::misc::range::RangeOverlayStyle;
use civ_renderer::models::misc::{HexKey, HexKeySet, OverlayGroup, OverlayKind, OverlayMap};
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::raster::metric::{compare_premultiplied, premultiply_straight, ImageDiff};
use civ_renderer::raster::Canvas2dLite;
use json::{parse, J};

const MIN_SSIM: f64 = 0.985;
const MAX_MEAN_ABS: f64 = 1.5;
const MAX_FRAC_PX_OVER_16: f64 = 0.05;

/// Explicit `mean_abs` exceptions (P4-33 §6.2), as RR-T8c does for
/// `t14_prod_icon_x1`. Both are capital badges at ×1: over the whole pill
/// the semi-transparent dark gradient (`:856-859`) is 0–1 level brighter in
/// Rust than in Chromium in a column-alternating pattern (period 2 px —
/// measured, consistent with Skia's gradient dithering, which tiny-skia does
/// not do; cause in Chromium NIE_ZMIERZONO), plus 2–4 levels on the 1.2 px
/// inner capital ring (`:866-879`, AA of a thin stroke). SSIM ≥ 0.9948 and
/// px>16 ≤ 3.2 % stay within the limits.
const MEAN_ABS_EXCEPTIONS: &[(&str, f64)] = &[
    ("zulu_capital_long@main final", 1.6),
    ("capital_only@main final", 1.6),
];

fn fx_path(rel: &str) -> String {
    format!(
        "{}/tests/fixtures/cityoverlay/{rel}",
        env!("CARGO_MANIFEST_DIR")
    )
}

fn fixture() -> J {
    parse(&std::fs::read_to_string(fx_path("city.json")).expect("city.json"))
}

fn f64_of(j: &J) -> f64 {
    f64::from_bits(j.bits()[0])
}

fn opt_f64(j: Option<&J>) -> Option<f64> {
    j.filter(|v| !v.is_null()).map(f64_of)
}

fn opt_str(j: Option<&J>) -> Option<String> {
    j.filter(|v| !v.is_null()).map(|v| v.s().to_owned())
}

fn opt_bool(j: Option<&J>) -> bool {
    j.is_some_and(|v| !v.is_null() && v.b())
}

fn key_of(s: &str) -> HexKey {
    let (q, r) = s.split_once(',').expect("q,r");
    (q.parse().expect("q"), r.parse().expect("r"))
}

fn f32_hex(s: &str) -> Vec<u32> {
    assert_eq!(s.len() % 8, 0);
    (0..s.len() / 8)
        .map(|k| u32::from_str_radix(&s[k * 8..k * 8 + 8], 16).expect("hex"))
        .collect()
}

// ------------------------------------------------------------------ inputs

struct FxAssets;

impl CityMapBadgeAssets for FxAssets {
    fn civ_sigil_svg(&self, civ_icon_id: &str) -> Option<String> {
        // gen.ts civSigil: trimmed lower-cased id; 'brak' → '' ; unknown → civ-default (civIconSvg).
        let k = civ_icon_id.trim().to_lowercase();
        if k == "brak" {
            return Some(String::new());
        }
        let own = std::fs::read_to_string(fx_path(&format!("input/civ-{k}.svg")));
        Some(own.unwrap_or_else(|_| {
            std::fs::read_to_string(fx_path("input/civ-nieznana.svg")).expect("civ-default")
        }))
    }
    #[allow(clippy::float_cmp)]
    fn leader_portrait_jpeg(&self, civ_icon_id: &str, era: f64) -> Option<Vec<u8>> {
        // gen.ts portraitUrl: "<trimmed lower civ>|<max(1, round(era) || 1)>".
        let k = civ_icon_id.trim().to_lowercase();
        let e = civ_renderer::raster::atlas::keys::js_round_at_least_one(era);
        let file = match k.as_str() {
            "grecy" if e == 2.0 => "portrait-grecy-braz",
            "zulusi" if e == 3.0 => "portrait-zulusi-zelazo",
            "egipt" if e == 1.0 => "portrait-egipt-kamien",
            _ => return None,
        };
        Some(std::fs::read(fx_path(&format!("input/{file}.jpg"))).expect("portrait"))
    }
    fn prod_icon_svg(&self, kind: &str, id: &str) -> Option<String> {
        let file = match (kind, id) {
            ("budynek", "spichlerz") => "bld-spichlerz",
            ("jednostka", "Wlocznik") => "unit-spear",
            _ => return Some(String::new()),
        };
        Some(std::fs::read_to_string(fx_path(&format!("input/{file}.svg"))).expect("prod icon"))
    }
}

#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
fn chip_input(j: &J) -> CityMapBadgeInput {
    CityMapBadgeInput {
        city_name: j.at("cityName").s().to_owned(),
        population: f64_of(j.at("population")),
        defense_tier: j.at("defenseTier").u() as u8,
        civ_icon_id: j.at("civIconId").s().to_owned(),
        owner_color: j.get("ownerColor").filter(|v| !v.is_null()).map(J::u),
        prod_active: opt_bool(j.get("prodActive")),
        prod_kind: opt_str(j.get("prodKind")),
        prod_id: opt_str(j.get("prodId")),
        growth_percent: opt_f64(j.get("growthPercent")),
        growth_starving: opt_bool(j.get("growthStarving")),
        resource_warning: opt_bool(j.get("resourceWarning")),
        hover_expanded: opt_bool(j.get("hoverExpanded")),
        prod_category_label: opt_str(j.get("prodCategoryLabel")),
        prod_item_name: opt_str(j.get("prodItemName")),
        prod_paused: opt_bool(j.get("prodPaused")),
        is_city_state: opt_bool(j.get("isCityState")),
        era: opt_f64(j.get("era")),
        is_capital: opt_bool(j.get("isCapital")),
        lod_level: opt_f64(j.get("lodLevel")),
    }
}

/// The input of a chip record (`cached_minimal` = `minimal`, `legacy`).
fn chip_input_of(fx: &J, id: &str) -> CityMapBadgeInput {
    match id {
        "legacy" => legacy_input("Legacy", 4.0),
        "cached_minimal" => chip_input(fx.at("inputs").at("chips").at("minimal")),
        _ => chip_input(fx.at("inputs").at("chips").at(id)),
    }
}

fn chip_assets(id: &str) -> Option<&'static dyn CityMapBadgeAssets> {
    if id.starts_with("na_") {
        None
    } else {
        Some(&FxAssets)
    }
}

fn okolica_map(fx: &J) -> OkolicaMap {
    let mut m = OkolicaMap::default();
    for h in fx.at("inputs").at("map").arr() {
        let a = h.arr();
        #[allow(clippy::cast_possible_truncation)]
        let key = (a[0].i() as i32, a[1].i() as i32);
        let t = Terrain::from_web_id(a[2].s()).expect("terrain");
        m.map.hexes.insert(key, t);
        if a[3].b() {
            m.covering_improvement.insert(key);
        }
    }
    m.map.seed = Some(fx.at("inputs").at("seed").f());
    m
}

fn yields(fx: &J) -> HashMap<HexKey, TileYield> {
    let mut out = HashMap::new();
    for y in fx.at("inputs").at("yields").arr() {
        let a = y.arr();
        #[allow(clippy::cast_possible_truncation)]
        let key = (a[0].i() as i32, a[1].i() as i32);
        out.insert(
            key,
            TileYield {
                zywnosc: opt_f64(Some(&a[2])),
                praca: opt_f64(Some(&a[3])),
                handel: opt_f64(Some(&a[4])),
            },
        );
    }
    out
}

// ------------------------------------------------------------------ comparison helpers

#[derive(Default)]
struct Cmp {
    errors: Vec<String>,
    n: usize,
}

impl Cmp {
    fn eq<T: PartialEq + std::fmt::Debug>(&mut self, what: &str, rust: T, web: T) {
        self.n += 1;
        if rust != web {
            self.errors
                .push(format!("{what}: rust {rust:?} web {web:?}"));
        }
    }
    fn bits(&mut self, what: &str, rust: &[f64], web: &J) {
        let w = web.bits();
        let r: Vec<u64> = rust.iter().map(|v| v.to_bits()).collect();
        self.n += r.len();
        if r != w {
            let wf: Vec<f64> = w.iter().map(|b| f64::from_bits(*b)).collect();
            self.errors
                .push(format!("{what}: rust {rust:?} web {wf:?}"));
        }
    }
    fn f32s(&mut self, what: &str, rust: &[f32], web: &J) {
        let r: Vec<u32> = rust.iter().map(|v| v.to_bits()).collect();
        let w = if web.is_null() {
            Vec::new()
        } else {
            f32_hex(web.s())
        };
        self.n += r.len().max(w.len());
        if r != w {
            let first = r.iter().zip(&w).position(|(a, b)| a != b);
            self.errors.push(format!(
                "{what}: len rust {} web {}, first difference at {first:?}",
                r.len(),
                w.len()
            ));
        }
    }
    fn finish(self, what: &str) {
        println!(
            "{what}: {} comparisons, {} differences",
            self.n,
            self.errors.len()
        );
        assert!(self.errors.is_empty(), "{what}: {:#?}", self.errors);
    }
}

fn texture_meta_check(c: &mut Cmp, what: &str, t: &CanvasTexture, m: &J) {
    c.eq(&format!("{what} w"), i64::from(t.width), m.at("w").i());
    c.eq(&format!("{what} h"), i64::from(t.height), m.at("h").i());
    c.eq(
        &format!("{what} minFilter"),
        i64::from(t.min_filter.three_constant()),
        m.at("minFilter").i(),
    );
    c.eq(
        &format!("{what} magFilter"),
        i64::from(t.mag_filter.three_constant()),
        m.at("magFilter").i(),
    );
    c.eq(
        &format!("{what} generateMipmaps"),
        t.generate_mipmaps,
        m.at("generateMipmaps").b(),
    );
    c.eq(
        &format!("{what} colorSpace"),
        if t.srgb { "srgb" } else { "" },
        m.at("colorSpace").s(),
    );
    c.eq(&format!("{what} flipY"), t.flip_y, m.at("flipY").b());
    c.eq(
        &format!("{what} version"),
        i64::from(t.version),
        m.at("version").i(),
    );
}

/// Sprite record of `gen.ts::spriteRec` vs a Rust sprite. `hex_key_web`
/// tells whether the web sprite carries `userData.hexKey`.
fn sprite_check(c: &mut Cmp, what: &str, s: &SpriteNode, w: &J) {
    c.eq(&format!("{what} type"), "Sprite", w.at("type").s());
    c.eq(&format!("{what} name"), s.name.as_str(), w.at("name").s());
    c.bits(&format!("{what} position"), &s.position, w.at("p"));
    c.bits(&format!("{what} rotation"), &[0.0; 3], w.at("r"));
    c.bits(&format!("{what} scale"), &s.scale, w.at("s"));
    c.bits(&format!("{what} center"), &s.center, w.at("c"));
    c.eq(
        &format!("{what} renderOrder"),
        i64::from(s.render_order),
        w.at("ro").i(),
    );
    c.eq(&format!("{what} visible"), s.visible, w.at("visible").b());
    let ud = w.at("ud");
    let (hk, lwh) = if ud.is_null() {
        (None, None)
    } else {
        (
            opt_str(ud.get("hexKey")).map(|k| key_of(&k)),
            opt_f64(ud.get("lwh")),
        )
    };
    c.eq(&format!("{what} ud.hexKey"), s.hex_key, hk);
    c.eq(
        &format!("{what} ud.labelWorldHeight"),
        s.label_world_height.map(f64::to_bits),
        lwh.map(f64::to_bits),
    );
    let m = &s.material;
    let wm = w.at("mat");
    c.eq(
        &format!("{what} mat.type"),
        "SpriteMaterial",
        wm.at("type").s(),
    );
    c.bits(&format!("{what} mat.color"), &m.color, wm.at("color"));
    c.eq(&format!("{what} mat.map"), true, wm.at("map").b());
    c.eq(
        &format!("{what} mat.transparent"),
        m.transparent,
        wm.at("transparent").b(),
    );
    c.eq(
        &format!("{what} mat.depthTest"),
        m.depth_test,
        wm.at("depthTest").b(),
    );
    c.eq(
        &format!("{what} mat.depthWrite"),
        m.depth_write,
        wm.at("depthWrite").b(),
    );
    c.eq(
        &format!("{what} mat.toneMapped"),
        m.tone_mapped,
        wm.at("toneMapped").b(),
    );
    c.bits(
        &format!("{what} mat.opacity"),
        &[m.opacity],
        wm.at("opacity"),
    );
    c.eq(
        &format!("{what} mat.fogBaseOpacity"),
        m.fog_base_opacity.map(f64::to_bits),
        opt_f64(wm.get("fogBase")).map(f64::to_bits),
    );
    // Three defaults the Rust data does not carry: rotation 0, sizeAttenuation.
    c.bits(&format!("{what} mat.rotation"), &[0.0], wm.at("rotation"));
    c.eq(
        &format!("{what} mat.sizeAttenuation"),
        true,
        wm.at("sizeAttenuation").b(),
    );
}

fn overlay_check(c: &mut Cmp, what: &str, g: &OverlayGroup, w: &J) {
    c.eq(&format!("{what} name"), g.name.as_str(), w.at("name").s());
    c.eq(&format!("{what} type"), "Group", w.at("type").s());
    let objs = w.at("objects").arr();
    c.eq(&format!("{what} children"), g.objects.len(), objs.len());
    for (i, (o, wo)) in g.objects.iter().zip(objs).enumerate() {
        let cx = format!("{what}/{i}");
        c.eq(&format!("{cx} kind"), o.kind.three_type(), wo.at("k").s());
        c.eq(&format!("{cx} name"), o.name.as_str(), wo.at("name").s());
        c.eq(
            &format!("{cx} renderOrder"),
            i64::from(o.render_order),
            wo.at("ro").i(),
        );
        c.eq(
            &format!("{cx} frustumCulled"),
            o.frustum_culled,
            wo.at("fc").b(),
        );
        // overlay objects are never moved: identity transform
        c.bits(&format!("{cx} position"), &[0.0; 3], wo.at("p"));
        c.bits(&format!("{cx} scale"), &[1.0; 3], wo.at("s"));
        let m = &o.material;
        let wm = wo.at("mat");
        c.eq(
            &format!("{cx} mat.type"),
            m.kind.three_type(),
            wm.at("t").s(),
        );
        c.eq(&format!("{cx} mat.color"), m.hex(), wm.at("color").u());
        let lin = m.linear_color();
        c.bits(
            &format!("{cx} mat.lin"),
            &[lin.r, lin.g, lin.b],
            wm.at("lin"),
        );
        c.eq(
            &format!("{cx} mat.transparent"),
            m.transparent,
            wm.at("transparent").b(),
        );
        c.bits(&format!("{cx} mat.opacity"), &[m.opacity], wm.at("opacity"));
        c.eq(
            &format!("{cx} mat.depthWrite"),
            m.depth_write,
            wm.at("dw").b(),
        );
        c.eq(
            &format!("{cx} mat.depthTest"),
            m.depth_test,
            wm.at("dt").b(),
        );
        c.eq(
            &format!("{cx} mat.side"),
            i64::from(m.side.three_value()),
            wm.at("side").i(),
        );
        c.eq(
            &format!("{cx} mat.polygonOffset"),
            m.polygon_offset.is_some(),
            wm.at("po").b(),
        );
        let (pof, pou) = m.polygon_offset.unwrap_or((0.0, 0.0));
        c.bits(&format!("{cx} mat.pof"), &[pof], wm.at("pof"));
        c.bits(&format!("{cx} mat.pou"), &[pou], wm.at("pou"));
        c.f32s(
            &format!("{cx} position"),
            &o.geometry.positions,
            wo.at("pos"),
        );
        c.f32s(&format!("{cx} normal"), &o.geometry.normals, wo.at("nor"));
        c.f32s(&format!("{cx} uv"), &o.geometry.uvs, wo.at("uv"));
        let widx: Option<Vec<u32>> = if wo.at("idx").is_null() {
            None
        } else {
            Some(wo.at("idx").arr().iter().map(J::u).collect())
        };
        c.eq(&format!("{cx} index"), o.geometry.indices.clone(), widx);
        if o.kind == OverlayKind::InstancedMesh {
            c.eq(
                &format!("{cx} count"),
                i64::try_from(o.instances.len()).expect("n"),
                wo.at("count").i(),
            );
            let flat: Vec<f32> = o.instances.iter().flatten().copied().collect();
            c.f32s(&format!("{cx} instanceMatrix"), &flat, wo.at("inst"));
        } else {
            c.eq(&format!("{cx} instances"), 0, o.instances.len());
        }
    }
}

fn ref_rgba(id: &str) -> Vec<u8> {
    std::fs::read(fx_path(&format!("ref/{id}.rgba"))).unwrap_or_else(|e| panic!("ref/{id}: {e}"))
}

fn diff(t: &CanvasTexture, id: &str) -> ImageDiff {
    let want = ref_rgba(id);
    let (w, h) = (t.width as usize, t.height as usize);
    assert_eq!(want.len(), w * h * 4, "{id}: size");
    compare_premultiplied(&t.premultiplied, &premultiply_straight(&want), w, h)
}

fn within(what: &str, d: &ImageDiff) -> bool {
    let max_mean = MEAN_ABS_EXCEPTIONS
        .iter()
        .find(|(w, _)| *w == what)
        .map_or(MAX_MEAN_ABS, |(_, m)| *m);
    d.ssim >= MIN_SSIM && d.mean_abs <= max_mean && d.frac_px_over_16 <= MAX_FRAC_PX_OVER_16
}

/// Prints one table row and returns whether it is within the limits.
fn report(what: &str, t: &CanvasTexture, id: &str) -> bool {
    let d = diff(t, id);
    let exc = MEAN_ABS_EXCEPTIONS.iter().any(|(w, _)| *w == what);
    println!(
        "{what} | {id} | {}x{} | {} | {:.4}{} | {:.3} | {:.5}",
        t.width,
        t.height,
        d.max_abs,
        d.mean_abs,
        if exc { " (exception ≤ 1.6)" } else { "" },
        d.frac_px_over_16 * 100.0,
        d.ssim
    );
    within(what, &d)
}

/// Every exception is used and really needed (no stale entries).
#[test]
fn mean_abs_exceptions_are_needed() {
    let fx = fixture();
    let renders = render_chips(&fx);
    for (what, _) in MEAN_ABS_EXCEPTIONS {
        let (id, _) = what.split_once(' ').expect("id phase");
        let (rid, page) = id.split_once('@').expect("id@page");
        let (r, w) = renders
            .iter()
            .zip(fx.at("chips").arr())
            .find(|(r, _)| r.id == rid && r.page == page)
            .expect("exception names a chip");
        let d = diff(&r.texture, w.at("final").s());
        assert!(d.mean_abs > MAX_MEAN_ABS, "{what}: exception not needed");
    }
}

// ------------------------------------------------------------------ Rust renders

struct ChipRender {
    id: String,
    page: String,
    initial: CanvasTexture,
    texture: CanvasTexture,
    key: String,
}

fn render_chips(fx: &J) -> Vec<ChipRender> {
    fx.at("chips")
        .arr()
        .iter()
        .map(|c| {
            let id = c.at("id").s();
            let input = chip_input_of(fx, id);
            let dpr = c.at("dpr").f();
            let r = render_city_map_badge(&input, chip_assets(id), Some(dpr)).expect("render");
            ChipRender {
                id: id.to_owned(),
                page: c.at("page").s().to_owned(),
                initial: r.initial,
                texture: r.texture,
                key: r.key,
            }
        })
        .collect()
}

fn hex_set(j: &J) -> HexKeySet {
    let keys: Vec<HexKey> = j.arr().iter().map(|k| key_of(k.s())).collect();
    HexKeySet::new(&keys)
}

fn build_okolica(fx: &J, case: &J) -> civ_renderer::cities::overlay::okolica::CityOkolicaOverlay {
    let map = okolica_map(fx);
    let y = yields(fx);
    let worked = hex_set(case.at("worked"));
    let yield_of = |q: i32, r: i32| y.get(&(q, r)).copied().unwrap_or_default();
    #[allow(clippy::cast_possible_truncation)]
    let params = CityOkolicaOverlayParams {
        city_q: case.at("cityQ").i() as i32,
        city_r: case.at("cityR").i() as i32,
        range: f64_of(case.at("range")),
        worked_keys: &worked,
        yield_of: &yield_of,
        show_yields: case.get("showYields").filter(|v| !v.is_null()).map(J::b),
        owner_id: opt_f64(case.get("ownerId")),
    };
    build_city_okolica_overlay(&map, &params).expect("okolica")
}

fn worker_input(case: &J) -> (Vec<(HexKey, f64)>, Option<f64>) {
    let worked = case
        .at("worked")
        .arr()
        .iter()
        .map(|p| {
            let a = p.arr();
            (key_of(a[0].s()), f64_of(&a[1]))
        })
        .collect();
    (worked, opt_f64(case.get("player")))
}

fn worker_case<'a>(fx: &'a J, id: &str) -> &'a J {
    fx.at("inputs")
        .at("worker")
        .arr()
        .iter()
        .find(|c| c.at("id").s() == id)
        .expect("worker case")
}

// ------------------------------------------------------------------ tests

#[test]
fn chip_helpers_match_the_web() {
    let fx = fixture();
    let h = fx.at("helpers");
    let mut c = Cmp::default();
    for w in h.at("walls").arr() {
        let a = w.arr();
        let built: Option<Vec<&str>> = if a[0].is_null() {
            None
        } else {
            Some(a[0].arr().iter().map(J::s).collect())
        };
        let b = built.as_deref();
        c.eq(
            &format!("wallKindFromBuilt({b:?})"),
            wall_kind_from_built(b).as_str(),
            a[1].s(),
        );
        c.eq(
            &format!("defenseTierFromCity({b:?})"),
            i64::from(defense_tier_from_city(b)),
            a[2].i(),
        );
    }
    for t in h.at("tiers").arr() {
        let a = t.arr();
        let k = match a[0].s() {
            "none" => CityMapWallKind::None,
            "palisada" => CityMapWallKind::Palisada,
            _ => CityMapWallKind::Stone,
        };
        c.eq(
            &format!("defenseTierFromWallKind({})", a[0].s()),
            i64::from(defense_tier_from_wall_kind(k)),
            a[1].i(),
        );
    }
    for i in h.at("initials").arr() {
        let a = i.arr();
        c.eq(
            &format!("civInitialForIconId({:?})", a[0].s()),
            civ_initial_for_icon_id(a[0].s()),
            a[1].s().to_owned(),
        );
    }
    for k in h.at("keys").arr() {
        let a = k.arr();
        let input = chip_input(fx.at("inputs").at("chips").at(a[0].s()));
        c.eq(
            &format!("cityMapBadgeKey({})", a[0].s()),
            city_map_badge_key(&input),
            a[1].s().to_owned(),
        );
    }
    c.eq(
        "cityMapBadgeKey(legacy)",
        city_map_badge_key_legacy("Legacy", Some(4.0)),
        fx.at("chips")
            .arr()
            .iter()
            .find(|x| x.at("id").s() == "legacy")
            .expect("legacy")
            .at("key")
            .s()
            .to_owned(),
    );
    for p in fx.at("purge").arr() {
        let before: Vec<&str> = p.at("before").arr().iter().map(J::s).collect();
        let lod = opt_f64(p.get("lod"));
        let freed = badge_keys_for_other_lod(&before, lod);
        let kept: Vec<&str> = before
            .iter()
            .copied()
            .filter(|k| !freed.contains(k))
            .collect();
        c.eq(
            &format!("purge({lod:?}) freed"),
            i64::try_from(freed.len()).expect("n"),
            p.at("freed").i(),
        );
        let wkept: Vec<&str> = p.at("kept").arr().iter().map(J::s).collect();
        c.eq(&format!("purge({lod:?}) kept"), kept, wkept);
    }
    for o in h.at("ownerColors").arr() {
        let a = o.arr();
        let id = f64_of(&a[0]);
        let want = if a[1].is_null() { None } else { Some(a[1].u()) };
        c.eq(
            &format!("workerOwnerColor({id})"),
            worker_owner_color(id),
            want,
        );
        c.eq(
            &format!("workerOwnerColorRgba({id}, 0.72)"),
            worker_owner_color_rgba(id, 0.72),
            a[2].s().to_owned(),
        );
        c.eq(
            &format!("workerOwnerColorRgba({id}, 1)"),
            worker_owner_color_rgba(id, 1.0),
            a[3].s().to_owned(),
        );
    }
    c.finish("helpers");
}

#[test]
fn constants_match_the_web() {
    let fx = fixture();
    let s = fx.at("consts").at("styles");
    let mut c = Cmp::default();
    for (name, rs) in [
        ("range", CITY_RANGE_OVERLAY_STYLE),
        ("center", CITY_CENTER_OVERLAY_STYLE),
        ("worked", CITY_WORKED_OVERLAY_STYLE),
    ] {
        let w = s.at(name);
        let RangeOverlayStyle {
            tint_color,
            tint_opacity,
            border_color,
            border_opacity,
            border_band_width,
            y_offset,
            hug_terrain_relief,
        } = rs;
        c.eq(
            &format!("{name}.tintColor"),
            tint_color,
            w.at("tintColor").u(),
        );
        c.eq(
            &format!("{name}.tintOpacity"),
            tint_opacity.to_bits(),
            w.at("tintOpacity").f().to_bits(),
        );
        c.eq(
            &format!("{name}.borderColor"),
            border_color,
            w.at("borderColor").u(),
        );
        c.eq(
            &format!("{name}.borderOpacity"),
            border_opacity.to_bits(),
            w.at("borderOpacity").f().to_bits(),
        );
        c.eq(
            &format!("{name}.borderBandWidth"),
            border_band_width.map(f64::to_bits),
            w.get("borderBandWidth").map(|v| v.f().to_bits()),
        );
        c.eq(
            &format!("{name}.yOffset"),
            y_offset.map(f64::to_bits),
            w.get("yOffset").map(|v| v.f().to_bits()),
        );
        c.eq(
            &format!("{name}.hugTerrainRelief"),
            hug_terrain_relief,
            w.get("hugTerrainRelief").is_some_and(J::b),
        );
    }
    let pal: Vec<u32> = fx
        .at("consts")
        .at("workerOwnerColors")
        .arr()
        .iter()
        .map(J::u)
        .collect();
    c.eq("WORKER_OWNER_COLORS", WORKER_OWNER_COLORS.to_vec(), pal);
    c.finish("constants");
}

#[test]
fn chip_sprites_match_the_web_bit_for_bit() {
    let fx = fixture();
    let renders = render_chips(&fx);
    let mut c = Cmp::default();
    for (r, w) in renders.iter().zip(fx.at("chips").arr()) {
        let what = format!("{}@{}", r.id, r.page);
        let legacy = w.get("legacyKey").is_some_and(J::b);
        if !legacy {
            c.eq(&format!("{what} key"), r.key.as_str(), w.at("key").s());
        }
        let cached = w.at("cached").b();
        texture_meta_check(&mut c, &format!("{what} texture"), &r.texture, w.at("meta"));
        // the first state: a fresh texture has version 1; a cache hit is the
        // already-loaded texture
        let first = if cached { &r.texture } else { &r.initial };
        texture_meta_check(
            &mut c,
            &format!("{what} initial"),
            first,
            w.at("initialMeta"),
        );
        let s = city_map_badge_sprite(&r.key, r.texture.width, r.texture.height);
        sprite_check(&mut c, &format!("{what} sprite"), &s, w.at("sprite"));
        c.eq(
            &format!("{what} sprite.map"),
            &s.material.map,
            &TextureRef::CityBadge(r.key.clone()),
        );
    }
    c.finish("chip sprites");
}

#[test]
fn chip_textures_match_chromium() {
    let fx = fixture();
    let renders = render_chips(&fx);
    let mut failures = Vec::new();
    println!("chip@page | ref | size | max_abs | mean_abs | px>16 % | ssim");
    for (r, w) in renders.iter().zip(fx.at("chips").arr()) {
        let cached = w.at("cached").b();
        let what = format!("{}@{} final", r.id, r.page);
        if !report(&what, &r.texture, w.at("final").s()) {
            failures.push(what);
        }
        if let Some(i) = w.get("initial").filter(|v| !v.is_null()) {
            let first = if cached { &r.texture } else { &r.initial };
            let what = format!("{}@{} initial", r.id, r.page);
            if !report(&what, first, i.s()) {
                failures.push(what);
            }
        }
    }
    // drawCityMapBadgeCanvas (no images) and the legacy wrapper
    let none = CivMedallionContent::default();
    let hover = chip_input(fx.at("inputs").at("chips").at("hover_full"));
    for (what, input, id) in [
        (
            "drawCityMapBadgeCanvas(hover_full)",
            hover,
            fx.at("drawCanvas").s(),
        ),
        (
            "drawCityMapBadgeCanvasLegacy",
            legacy_input("Legacy", 4.0),
            fx.at("drawCanvasLegacy").s(),
        ),
    ] {
        let cv = paint_city_map_badge(&input, &none, None, Some(1.0)).expect("paint");
        if !report(what, &CanvasTexture::from_canvas(&cv, 1), id) {
            failures.push(what.to_owned());
        }
    }
    assert!(failures.is_empty(), "over threshold: {failures:#?}");
}

#[test]
fn okolica_trees_match_the_web_bit_for_bit() {
    let fx = fixture();
    let mut c = Cmp::default();
    let cases = fx.at("inputs").at("okolica").arr();
    for (case, w) in cases.iter().zip(fx.at("okolica").arr()) {
        let id = case.at("id").s();
        let o = build_okolica(&fx, case);
        c.eq(&format!("{id} name"), o.name, w.at("name").s());
        c.eq(&format!("{id} type"), "Group", w.at("type").s());
        let wch = w.at("children").arr();
        let names: Vec<&str> = wch.iter().map(|x| x.at("name").s()).collect();
        c.eq(&format!("{id} children"), o.child_names(), names);
        let mut groups = vec![&o.range, &o.center];
        if let Some(wk) = &o.worked {
            groups.push(wk);
        }
        for (g, wg) in groups.iter().zip(wch) {
            overlay_check(&mut c, &format!("{id}/{}", g.name), g, wg);
        }
        if let Some(labels) = &o.yields {
            let wl = wch.last().expect("yields").at("labels").arr();
            c.eq(&format!("{id} labels"), labels.len(), wl.len());
            for (i, (l, wlab)) in labels.iter().zip(wl).enumerate() {
                let what = format!("{id} label {i} {:?}", l.hex);
                sprite_check(&mut c, &what, &l.sprite, wlab);
                texture_meta_check(&mut c, &what, &l.texture, wlab.at("texMeta"));
            }
        }
    }
    c.finish("okolica trees");
}

#[test]
fn okolica_textures_match_chromium() {
    let fx = fixture();
    let mut failures = Vec::new();
    let cases = fx.at("inputs").at("okolica").arr();
    println!("label | ref | size | max_abs | mean_abs | px>16 % | ssim");
    for (case, w) in cases.iter().zip(fx.at("okolica").arr()) {
        let o = build_okolica(&fx, case);
        let Some(labels) = &o.yields else { continue };
        let wl = w
            .at("children")
            .arr()
            .last()
            .expect("yields")
            .at("labels")
            .arr();
        for (l, wlab) in labels.iter().zip(wl) {
            let what = format!(
                "{} {:?} worker={} rows={}",
                case.at("id").s(),
                l.hex,
                l.worker,
                l.lines.len()
            );
            if !report(&what, &l.texture, wlab.at("tex").s()) {
                failures.push(what);
            }
        }
    }
    assert!(failures.is_empty(), "over threshold: {failures:#?}");
}

fn worker_group_check(c: &mut Cmp, what: &str, g: &WorkerFieldOverlay, sprites: &[J]) {
    c.eq(&format!("{what} sprites"), g.sprites.len(), sprites.len());
    for (i, (s, w)) in g.sprites.iter().zip(sprites).enumerate() {
        sprite_check(c, &format!("{what}#{i}"), s, w);
    }
}

#[test]
fn worker_trees_match_the_web_bit_for_bit() {
    let fx = fixture();
    let map: OverlayMap = okolica_map(&fx).map;
    let mut c = Cmp::default();
    // web texture index ↔ Rust texture key: a consistent bijection
    let mut tex_of: HashMap<i64, String> = HashMap::new();
    for w in fx.at("worker").arr() {
        let id = w.at("id").s();
        let (worked, player) = worker_input(worker_case(&fx, id));
        let g = sync_worker_field_overlay(&map, &worked, player);
        if w.at("group").is_null() {
            c.eq(&format!("{id} null"), true, g.is_none());
            continue;
        }
        let mut g = g.expect("group");
        let wg = w.at("group");
        c.eq(&format!("{id} name"), g.name, wg.at("name").s());
        c.eq(&format!("{id} type"), "Group", wg.at("type").s());
        let ws = wg.at("sprites").arr();
        worker_group_check(&mut c, id, &g, ws);
        for (s, wsp) in g.sprites.iter().zip(ws) {
            let TextureRef::WorkerIcon(k) = &s.material.map else {
                panic!("worker texture")
            };
            let ti = wsp.at("texIndex").i();
            let prev = tex_of.entry(ti).or_insert_with(|| k.clone());
            c.eq(
                &format!("{id} texture of web #{ti}"),
                prev.as_str(),
                k.as_str(),
            );
        }
        if let Some(fog) = w.get("fog") {
            let vis: HashSet<HexKey> = fog.at("vis").arr().iter().map(|k| key_of(k.s())).collect();
            let exp: HashSet<HexKey> = fog
                .at("explored")
                .arr()
                .iter()
                .map(|k| key_of(k.s()))
                .collect();
            sync_worker_field_overlay_fog(Some(&mut g), &vis, &exp, true);
            worker_group_check(&mut c, &format!("{id} fog"), &g, fog.at("sprites").arr());
            sync_worker_field_overlay_fog(Some(&mut g), &HashSet::new(), &HashSet::new(), false);
            worker_group_check(&mut c, &format!("{id} fogOff"), &g, w.at("fogOff").arr());
        }
    }
    let keys: HashSet<&String> = tex_of.values().collect();
    c.eq("distinct worker textures", keys.len(), tex_of.len());
    c.finish("worker trees");
}

/// The worker textures of the fixture: web index → (owner, player, Rust
/// texture), from the sprites that use them.
fn worker_textures(fx: &J) -> Vec<(i64, String, CanvasTexture)> {
    let map: OverlayMap = okolica_map(fx).map;
    let mut out: Vec<(i64, String, CanvasTexture)> = Vec::new();
    for w in fx.at("worker").arr() {
        if w.at("group").is_null() {
            continue;
        }
        let id = w.at("id").s();
        let (worked, player) = worker_input(worker_case(fx, id));
        let g = sync_worker_field_overlay(&map, &worked, player).expect("group");
        let ws = w.at("group").at("sprites").arr();
        let owners: Vec<f64> = worked
            .iter()
            .filter(|(k, _)| g.sprites.iter().any(|s| s.hex_key == Some(*k)))
            .map(|(_, o)| *o)
            .collect();
        for ((s, wsp), owner) in g.sprites.iter().zip(ws).zip(owners) {
            let ti = wsp.at("texIndex").i();
            if out.iter().any(|(i, _, _)| *i == ti) {
                continue;
            }
            let TextureRef::WorkerIcon(k) = &s.material.map else {
                panic!("worker texture")
            };
            let t = render_worker_icon(owner, player.unwrap_or(0.0)).expect("icon");
            out.push((ti, k.clone(), t));
        }
    }
    out.sort_by_key(|(i, _, _)| *i);
    out
}

#[test]
fn worker_textures_match_chromium() {
    let fx = fixture();
    let wt = fx.at("workerTex").arr();
    let mine = worker_textures(&fx);
    assert_eq!(mine.len(), wt.len(), "every web worker texture is rendered");
    let mut c = Cmp::default();
    let mut failures = Vec::new();
    println!("worker icon | ref | size | max_abs | mean_abs | px>16 % | ssim");
    for (i, k, t) in &mine {
        let w = &wt[usize::try_from(*i).expect("index")];
        texture_meta_check(&mut c, k, t, w.at("meta"));
        if !report(k, t, w.at("tex").s()) {
            failures.push(k.clone());
        }
    }
    c.finish("worker texture metadata");
    assert!(failures.is_empty(), "over threshold: {failures:#?}");
}

#[test]
fn chromium_tree_differences_are_last_bit_noise() {
    // gen.mjs lists every difference between the node and the Chromium run
    // of the same bundle (trees, helpers, inputs). Allowed: a linear colour
    // channel off by 1 ulp (THREE.Color.setHex → SRGBToLinear → Math.pow) and
    // f32 vertex arrays whose elements differ by at most 1e-6 absolute
    // (hex-corner Math.cos / Math.sin noise around 0 in the border lines).
    let fx = fixture();
    let mut colour = 0;
    let mut verts = 0;
    for d in fx.at("chromiumDiffs").arr() {
        let a = d.arr();
        let path = a[0].s();
        if path.ends_with(".mat.lin") {
            let n = a[1].bits();
            let c = a[2].bits();
            assert_eq!(n.len(), c.len(), "{path}");
            for (x, y) in n.iter().zip(&c) {
                assert!(x.abs_diff(*y) <= 1, "{path}: more than 1 ulp");
            }
            colour += 1;
        } else if path.ends_with(".pos") {
            let n = f32_hex(a[1].s());
            let c = f32_hex(a[2].s());
            assert_eq!(n.len(), c.len(), "{path}");
            let mut k = 0;
            for (x, y) in n.iter().zip(&c) {
                let (fx_, fy) = (f32::from_bits(*x), f32::from_bits(*y));
                assert!((fx_ - fy).abs() <= 1e-6, "{path}: {fx_} vs {fy}");
                k += usize::from(x != y);
            }
            println!("{path}: {k} f32 elements differ by ≤ 1e-6");
            verts += 1;
        } else {
            panic!("unexpected Chromium-vs-node difference {path}");
        }
    }
    println!("chromium-vs-node: {colour} colour channels (1 ulp), {verts} vertex arrays (≤ 1e-6)");
}

fn golden_text(fx: &J) -> String {
    let mut out = String::from(
        "# R-RUSTPORT-P4-33 golden FNV-1a 64 of the premultiplied RGBA8 of every MOD-10 texture\n# kind<TAB>id<TAB>initial<TAB>final\n",
    );
    for r in render_chips(fx) {
        writeln!(
            out,
            "chip\t{}@{}\t{:016x}\t{:016x}",
            r.id, r.page, r.initial.hash, r.texture.hash
        )
        .expect("write");
    }
    for case in fx.at("inputs").at("okolica").arr() {
        let o = build_okolica(fx, case);
        for l in o.yields.iter().flatten() {
            writeln!(
                out,
                "label\t{} {},{}\t-\t{:016x}",
                case.at("id").s(),
                l.hex.0,
                l.hex.1,
                l.texture.hash
            )
            .expect("write");
        }
    }
    for (_, k, t) in worker_textures(fx) {
        writeln!(out, "worker\t{k}\t-\t{:016x}", t.hash).expect("write");
    }
    out
}

#[test]
fn textures_match_golden_hashes() {
    let fx = fixture();
    let out = golden_text(&fx);
    print!("{out}");
    let path = fx_path("golden.tsv");
    if std::env::var_os("CITYOVERLAY_BLESS").is_some() {
        std::fs::write(&path, &out).expect("bless golden.tsv");
        return;
    }
    let want = std::fs::read_to_string(&path).expect("golden.tsv");
    assert_eq!(
        out, want,
        "golden hashes changed (CITYOVERLAY_BLESS=1 to re-bless)"
    );
}

#[test]
fn rendering_twice_is_identical() {
    let fx = fixture();
    assert_eq!(golden_text(&fx), golden_text(&fx));
    let c = Canvas2dLite::new(1, 1).expect("canvas");
    assert_eq!(
        c.rgba_hash(),
        Canvas2dLite::new(1, 1).expect("canvas").rgba_hash()
    );
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
    let mut all = total;
    for f in ["MANIFEST.sha256", "README.md", "golden.tsv"] {
        all += std::fs::metadata(fx_path(f)).map_or(0, |m| usize::try_from(m.len()).expect("len"));
    }
    println!("manifest entries={n} fixture files={listed} bytes={total} (with manifest/README/golden: {all})");
    assert!(all <= 8 * 1024 * 1024, "fixtures over 8 MB: {all}");
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
        ("civ-grecy.svg", "civ-grecy-40.svg"),
        ("civ-zulusi.svg", "civ-zulusi-40.svg"),
        ("civ-nieznana.svg", "civ-default-40.svg"),
        ("bld-spichlerz.svg", "bld-spichlerz-24.svg"),
    ] {
        let a = std::fs::read(fx_path(&format!("input/{ours}"))).expect("input");
        assert_eq!(a, image(theirs), "{ours} vs image/input/{theirs}");
    }
}
