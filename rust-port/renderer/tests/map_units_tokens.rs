//! R-RUSTPORT-P4-1-R1-UNIT-TOKENS: the strategic-map token renderer
//! (`civ_renderer::map_units`), port of `UnitRenderer` from
//! `gra/src/render/units.ts` and `gra/src/render/generalHexRing.ts` at pin
//! `07d2fbd72`.
//!
//! Inputs are hand-built `UnitViewDto` / `StackViewDto` fixtures (no engine
//! producer in this test). Every expectation cites the pin line it comes
//! from; numbers are derived from the pin literals by hand (no web run).

use std::collections::HashSet;

use civ_renderer::map_units::consts::{
    CITY_UNIT_EXTRA_LIFT, CITY_UNIT_OFFSET, CITY_UNIT_RENDER_ORDER, CITY_UNIT_SCALE,
    DEFERRED_TOKEN_OPACITY, HIGHLIGHT_COLOR, HIGHLIGHT_LIFT, HIGHLIGHT_OPACITY,
    IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY, OWNER_RING_OPACITY, ROUTE_Y_LIFT, SELECTION_HEX_LIFT,
    STACK_BADGE_SCALE, SUFFER_ICON_PAIR_DX, SUFFER_ICON_SCALE_PAIR, SUFFER_ICON_SCALE_SINGLE,
    TOKEN_LIFT, TUBE_RADIAL_SEGMENTS, TUBE_SEGMENTS, WAR_RING_COLOR, WAR_RING_OPACITY,
    WAR_RING_SCALE,
};
use civ_renderer::map_units::general_ring::{
    general_ring_loop, general_ring_positions, general_ring_world_width, general_ring_y,
    GENERAL_RING_BASE_WIDTH, GENERAL_RING_LIFT, GENERAL_RING_MIN_PX, GENERAL_RING_RENDER_ORDER,
};
use civ_renderer::map_units::{
    default_owner_color, MapUnitRenderer, PathRouteOptions, RingStance, TurnStop,
};
use civ_renderer::pick::hex::{axial_to_world, HexCoord, HEX_R};
use civ_renderer::pick::ray_to_unit;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::pick::three::{Ray, Vec3 as PVec3};
use civ_renderer::scene::ROOT;
use civ_view_model as vm;

// ------------------------------------------------------------ fixtures

fn uid(n: u64) -> vm::UnitId {
    vm::UnitId::try_new(n).unwrap()
}

fn player(n: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(n).unwrap())
}

fn unit(id: u64, owner: vm::OwnerRef, q: i32, r: i32) -> vm::UnitViewDto {
    vm::UnitViewDto {
        id: uid(id),
        owner_id: owner,
        type_id: "Wojownik".to_owned(),
        category: "maczuga".to_owned(),
        hex: vm::HexCoord::new(q, r),
        ruch_max: 2.0,
        ruch_left: 1.0,
        hp: 7.0,
        hp_max: Some(10.0),
        embarked: false,
        in_garnizon: false,
        is_general: false,
        veteran_stars: 1,
        armor_badge_level: 2,
        soft_badge_level: 0,
        dimmed: false,
    }
}

fn vitals(has_commander: bool) -> vm::StackVitalsDto {
    vm::StackVitalsDto {
        ruch_left: 0.5,
        ruch_max: 2.0,
        hp: 21.0,
        hp_max: 30.0,
        field_power_m: 12.5,
        count: 3,
        armor_badge_level: 3,
        soft_badge_level: 1,
        veteran_level: 2,
        veteran_stars: 2,
        has_commander,
    }
}

/// Stack of `ids` on one hex: `ids[0]` is the representative.
fn stack(ids: &[u64], has_commander: bool) -> vm::StackViewDto {
    vm::StackViewDto {
        visible_ids: vec![uid(ids[0])],
        badge_by_rep_id: vec![(uid(ids[0]), u32::try_from(ids.len()).unwrap())],
        starving_rep_ids: vec![],
        gold_deficit_rep_ids: vec![],
        vitals_by_rep_id: vec![(uid(ids[0]), vitals(has_commander))],
    }
}

/// 7 hexes around (0,0) plus (2,0); (1,0) is a hill, (0,1) a mountain.
fn renderer() -> MapUnitRenderer {
    let mut hexes = vec![
        (HexCoord::new(0, 0), Terrain::Laka),
        (HexCoord::new(1, 0), Terrain::Wzgorza),
        (HexCoord::new(1, -1), Terrain::Rownina),
        (HexCoord::new(0, -1), Terrain::Laka),
        (HexCoord::new(-1, 0), Terrain::Pustynia),
        (HexCoord::new(-1, 1), Terrain::Laka),
        (HexCoord::new(0, 1), Terrain::Gory),
    ];
    hexes.push((HexCoord::new(2, 0), Terrain::Laka));
    MapUnitRenderer::new(hexes)
}

fn h(q: i32, r: i32) -> HexCoord {
    HexCoord::new(q, r)
}

// ------------------------------------------------------------ sync

/// `sync` creates one token per unit (`units.ts:6100-6170`); with a stack
/// display only the representative is visible (`_applyStackDisplay`,
/// `:6270-6278`) and carries the `×N` badge (`:6292-6304`).
#[test]
fn one_token_per_unit_of_the_stack_and_only_the_representative_visible() {
    let mut r = renderer();
    let units = vec![
        unit(1, player(0), 0, 0),
        unit(2, player(0), 0, 0),
        unit(3, player(0), 0, 0),
    ];
    r.sync(&units, Some(&stack(&[1, 2, 3], false))).unwrap();
    assert_eq!(r.token_count(), 3);
    assert_eq!(r.token_ids(), ["1", "2", "3"]);
    let vis: Vec<bool> = r.tokens().map(|t| t.visible()).collect();
    assert_eq!(vis, [true, false, false]);
    assert_eq!(r.token("1").unwrap().overlays.stack_badge, Some(3));
    assert_eq!(r.token("2").unwrap().overlays.stack_badge, None);
    // `sp.scale.set(0.38, 0.38, 1)` (`:6489`).
    assert!((STACK_BADGE_SCALE - 0.38).abs() < f64::EPSILON);

    // No stack display: every token visible (`let show = true`, `:6273`).
    r.sync(&units, None).unwrap();
    assert!(r.tokens().all(|t| t.visible()));
    assert!(r.tokens().all(|t| t.overlays.stack_badge.is_none()));
}

/// `forceVisibleUnitId` shows a non-representative (`:6275`).
#[test]
fn force_visible_unit_is_shown_despite_the_stack() {
    let mut r = renderer();
    let units = vec![unit(1, player(0), 0, 0), unit(2, player(0), 0, 0)];
    r.set_force_visible_unit_id(Some("2".to_owned()));
    r.sync(&units, Some(&stack(&[1, 2], false))).unwrap();
    assert!(r.token("2").unwrap().visible());
}

/// Tokens of units that are gone are removed (`:6245-6256`); a changed
/// owner / category / embark rebuilds the token and moves it to the end of
/// the `Map` (`:6123-6150`).
#[test]
fn removal_and_rebuild_follow_the_web_map_order() {
    let mut r = renderer();
    let a = unit(1, player(0), 0, 0);
    let b = unit(2, player(0), 1, 0);
    let c = unit(3, player(0), 2, 0);
    r.sync(&[a.clone(), b.clone(), c.clone()], None).unwrap();
    assert_eq!(r.token_ids(), ["1", "2", "3"]);

    let mut a2 = a.clone();
    a2.embarked = true;
    r.sync(&[a2, b.clone()], None).unwrap();
    assert_eq!(r.token_ids(), ["2", "1"]);
    assert!(r.token("1").unwrap().embarked);
    assert!(r.token("3").is_none());

    // Only a move: same token object, new position (`:6152-6153`).
    let mut b2 = b;
    b2.hex = vm::HexCoord::new(2, 0);
    r.sync(&[b2], None).unwrap();
    assert_eq!(r.token_ids(), ["2"]);
    let (x, _, z) = r.token("2").unwrap().position();
    let (ex, ez) = axial_to_world(h(2, 0), HEX_R);
    assert_eq!((x, z), (ex, ez));
}

/// `_tokenPlacement` (`:5982-5997`): `topY + TOKEN_LIFT + relief`; on a
/// city hex `+ CITY_UNIT_EXTRA_LIFT`, offset along `CITY_UNIT_OFFSET_ANGLE`
/// and `_applyCityTokenStyle` (`:5999-6002`).
#[test]
fn placement_relief_and_city_style() {
    let mut r = renderer();
    r.set_city_hex_keys(HashSet::from([h(0, 0)]));
    r.sync(&[unit(1, player(0), 1, 0), unit(2, player(0), 0, 0)], None)
        .unwrap();

    let hill = r.token("1").unwrap();
    let (x, y, z) = hill.position();
    let (ex, ez) = axial_to_world(h(1, 0), HEX_R);
    assert_eq!((x, z), (ex, ez));
    // `unitTerrainRelief(Wzgorza) = HEX_R * 0.22` (`:230`).
    assert_eq!(
        y,
        Terrain::Wzgorza.top_y() + TOKEN_LIFT + 0.0 + HEX_R * 0.22
    );
    assert!(!hill.on_city);
    assert_eq!(hill.model.nodes[ROOT].render_order, 0);

    let city = r.token("2").unwrap();
    let (x, y, z) = city.position();
    assert_eq!(
        y,
        Terrain::Laka.top_y() + TOKEN_LIFT + CITY_UNIT_EXTRA_LIFT + 0.0
    );
    // `Math.cos(Math.PI / 2) = 6.123233995736766e-17`, `Math.sin = 1`.
    assert_eq!(x, 6.123_233_995_736_766e-17 * CITY_UNIT_OFFSET);
    assert_eq!(z, CITY_UNIT_OFFSET);
    assert!(city.on_city);
    let s = city.model.nodes[ROOT].scale;
    assert_eq!(
        (s.x, s.y, s.z),
        (CITY_UNIT_SCALE, CITY_UNIT_SCALE, CITY_UNIT_SCALE)
    );
    assert_eq!(city.model.nodes[ROOT].render_order, CITY_UNIT_RENDER_ORDER);
}

/// `_attachOwnerRing` (`:6008-6043`): one ring in the owner colour; a
/// hostile owner gets a second red ring scaled by `WAR_RING_SCALE`; the
/// default stance is `own` for owner 0 and `hostile` otherwise
/// (`:5850-5851`).
#[test]
fn owner_ring_and_war_ring() {
    let mut r = renderer();
    r.sync(&[unit(1, player(0), 0, 0), unit(2, player(3), 1, 0)], None)
        .unwrap();
    let own = r.token("1").unwrap();
    assert_eq!(own.ring_stance, RingStance::Own);
    assert_eq!(own.owner_rings.len(), 1);
    let m = own.model.nodes[own.owner_rings[0]]
        .mesh()
        .unwrap()
        .material();
    assert_eq!(own.model.materials[m].hex(), default_owner_color(0));
    assert_eq!(own.model.materials[m].opacity, OWNER_RING_OPACITY);

    let foe = r.token("2").unwrap();
    assert_eq!(foe.ring_stance, RingStance::Hostile);
    assert_eq!(foe.owner_rings.len(), 2);
    let war = foe.owner_rings[1];
    let wm = foe.model.nodes[war].mesh().unwrap().material();
    assert_eq!(foe.model.materials[wm].hex(), WAR_RING_COLOR);
    assert_eq!(foe.model.materials[wm].opacity, WAR_RING_OPACITY);
    assert_eq!(foe.model.nodes[war].scale.x, WAR_RING_SCALE);
    // `ownerColor(3) = OWNER_COLORS[3] = 0x1e88e5` (`:243`).
    assert_eq!(default_owner_color(3), 0x001e_88e5);

    // A stance change rebuilds the token (`:6126`).
    r.set_ring_stance_resolver(|_| RingStance::Neutral);
    r.sync(&[unit(1, player(0), 0, 0), unit(2, player(3), 1, 0)], None)
        .unwrap();
    assert_eq!(r.token("2").unwrap().owner_rings.len(), 1);
}

/// `_applyDeferredDim` (`:6060-6086`): opacity ceiling 0.45 (threshold, not
/// factor: the owner ring keeps 0.42), restored from the base on reveal.
#[test]
fn deferred_dim_is_a_threshold_and_is_restored() {
    let mut r = renderer();
    let mut u = unit(1, player(0), 0, 0);
    r.sync(std::slice::from_ref(&u), None).unwrap();
    let before: Vec<(bool, f64)> = {
        let t = r.token("1").unwrap();
        t.token_materials()
            .iter()
            .map(|&m| {
                (
                    t.model.materials[m].transparent,
                    t.model.materials[m].opacity,
                )
            })
            .collect()
    };
    u.dimmed = true;
    r.sync(std::slice::from_ref(&u), None).unwrap();
    r.sync(std::slice::from_ref(&u), None).unwrap(); // idempotent
    let t = r.token("1").unwrap();
    assert!(t.deferred_dim());
    for (&m, &(_, base)) in t.token_materials().iter().zip(&before) {
        let mat = &t.model.materials[m];
        assert!(mat.transparent);
        assert_eq!(mat.opacity, base.min(DEFERRED_TOKEN_OPACITY));
    }
    let ring = t.model.nodes[t.owner_rings[0]].mesh().unwrap().material();
    assert_eq!(t.model.materials[ring].opacity, OWNER_RING_OPACITY);

    u.dimmed = false;
    r.sync(std::slice::from_ref(&u), None).unwrap();
    let t = r.token("1").unwrap();
    let after: Vec<(bool, f64)> = t
        .token_materials()
        .iter()
        .map(|&m| {
            (
                t.model.materials[m].transparent,
                t.model.materials[m].opacity,
            )
        })
        .collect();
    assert_eq!(after, before);
}

/// Plate and badges (`:6206-6237`): stack vitals win; without them the
/// unit's own values and `hpMax: undefined`, `fieldPowerM: undefined`.
#[test]
fn plate_and_badges_take_stack_vitals_or_unit_values() {
    let mut r = renderer();
    let units = vec![unit(1, player(0), 0, 0), unit(2, player(0), 0, 0)];
    r.sync(&units, Some(&stack(&[1, 2], false))).unwrap();
    let rep = &r.token("1").unwrap().overlays;
    assert_eq!(rep.plate_vitals.hp, Some(21.0));
    assert_eq!(rep.plate_vitals.hp_max, Some(30.0));
    assert_eq!(rep.plate_vitals.ruch_left, Some(0.5));
    assert_eq!(rep.plate_vitals.field_power_m, Some(12.5));
    assert_eq!(rep.plate_vitals.owner_color, Some(default_owner_color(0)));
    assert_eq!(
        (rep.badge_row.armor, rep.badge_row.soft, rep.badge_row.stars),
        (3, 1, 2)
    );
    assert_eq!(rep.veteran_stars, 2);

    let other = &r.token("2").unwrap().overlays;
    assert_eq!(other.plate_vitals.hp, Some(7.0));
    assert_eq!(other.plate_vitals.hp_max, None);
    assert_eq!(other.plate_vitals.field_power_m, None);
    assert_eq!(other.plate_vitals.ruch_max, Some(2.0));
    assert_eq!(
        (
            other.badge_row.armor,
            other.badge_row.soft,
            other.badge_row.stars
        ),
        (2, 0, 1)
    );
}

/// Suffering icons (`:6340-6371`): one cause = centred, scale 0.85; both
/// causes = pair, scale 0.58, skull left, coin right.
#[test]
fn suffering_icons_single_and_paired() {
    let mut r = renderer();
    let units = vec![unit(1, player(0), 0, 0), unit(2, player(0), 1, 0)];
    let mut s = stack(&[1], false);
    s.visible_ids = vec![uid(1), uid(2)];
    s.starving_rep_ids = vec![uid(1), uid(2)];
    s.gold_deficit_rep_ids = vec![uid(2)];
    r.sync(&units, Some(&s)).unwrap();
    let one = r.token("1").unwrap().overlays.clone();
    let skull = one.starving_icon.unwrap();
    assert!(!skull.paired);
    assert_eq!(skull.scale, SUFFER_ICON_SCALE_SINGLE);
    assert_eq!(skull.position.0, 0.0);
    assert!(one.gold_deficit_icon.is_none());
    let two = r.token("2").unwrap().overlays.clone();
    let (skull, coin) = (two.starving_icon.unwrap(), two.gold_deficit_icon.unwrap());
    assert!(skull.paired && coin.paired);
    assert_eq!(skull.scale, SUFFER_ICON_SCALE_PAIR);
    assert_eq!(skull.position.0, -SUFFER_ICON_PAIR_DX);
    assert_eq!(coin.position.0, SUFFER_ICON_PAIR_DX);
}

// ------------------------------------------------------------ general band

/// The general band (`_syncGeneralRing`, `:6915-6932`): created for a unit
/// with `isGeneral` (no vitals) or `vitals.hasCommander` (`:6208-6211`), in
/// the owner colour, at `generalRingY(tops of the 7 hexes)`; hidden with its
/// token (`:6259-6262`); removed when the commander is gone (`:6917-6919`)
/// or the unit is gone (`:6241-6243`).
#[test]
fn general_has_the_seven_hex_band() {
    let mut r = renderer();
    let mut g = unit(1, player(2), 0, 0);
    g.is_general = true;
    r.sync(std::slice::from_ref(&g), None).unwrap();
    let e = r.general_ring("1").expect("general band");
    assert_eq!(e.ring.color(), default_owner_color(2));
    assert!(e.ring.visible());
    assert_eq!(
        e.ring.scene.nodes[ROOT].render_order,
        GENERAL_RING_RENDER_ORDER
    );
    assert!(r.token("1").unwrap().overlays.commander_star);
    // Highest of the 7 tops is the mountain at (0,1) (`generalHexRing.ts:221-230`).
    let (x, y, z) = e.ring.position();
    assert_eq!(y, Terrain::Gory.top_y() + GENERAL_RING_LIFT);
    assert_eq!((x, z), axial_to_world(h(0, 0), HEX_R));

    // Hidden non-representative: band hidden too.
    let other = unit(2, player(2), 0, 0);
    let mut s = stack(&[2, 1], false);
    s.vitals_by_rep_id.clear();
    r.sync(&[g.clone(), other.clone()], Some(&s)).unwrap();
    assert!(!r.general_ring("1").unwrap().ring.visible());

    // Stack vitals override `isGeneral`: the representative carries it.
    let plain = unit(1, player(2), 0, 0);
    r.sync(&[plain.clone(), other.clone()], Some(&stack(&[2, 1], true)))
        .unwrap();
    assert!(r.general_ring("1").is_none());
    assert!(r.general_ring("2").is_some());

    // Unit gone: band gone.
    r.sync(std::slice::from_ref(&plain), None).unwrap();
    assert!(r.general_ring("2").is_none());
    assert!(r.general_rings().is_empty());
}

/// `applyGeneralRingLod` → `generalRingWorldWidth` (`generalHexRing.ts:204-213`):
/// `max(0.12, 4 * 2 * d * tan(fov/2) / h)`; invalid inputs → base width;
/// `setWidth` rewrites only on a change (`:189-192`).
#[test]
fn general_band_width_follows_the_camera() {
    assert_eq!(
        general_ring_world_width(0.0, 45.0, 800.0, GENERAL_RING_MIN_PX),
        GENERAL_RING_BASE_WIDTH
    );
    assert_eq!(
        general_ring_world_width(10.0, 45.0, f64::NAN, GENERAL_RING_MIN_PX),
        GENERAL_RING_BASE_WIDTH
    );
    assert_eq!(
        general_ring_world_width(1.0, 45.0, 800.0, GENERAL_RING_MIN_PX),
        GENERAL_RING_BASE_WIDTH
    );
    let far = general_ring_world_width(100.0, 45.0, 800.0, GENERAL_RING_MIN_PX);
    let expect = 4.0 * (2.0 * 100.0 * (45.0_f64 * std::f64::consts::PI / 360.0).tan()) / 800.0;
    assert!((far - expect).abs() < 1e-12, "{far} vs {expect}");

    let mut r = renderer();
    let mut g = unit(1, player(0), 0, 0);
    g.is_general = true;
    r.sync(std::slice::from_ref(&g), None).unwrap();
    let base_pos = r.general_ring("1").unwrap().ring.positions();
    r.apply_general_ring_lod(100.0, 45.0, 800.0);
    let e = &r.general_ring("1").unwrap().ring;
    assert_eq!(e.width(), far);
    assert_eq!(e.writes(), 2);
    assert_ne!(e.positions(), base_pos);
    r.apply_general_ring_lod(100.0, 45.0, 800.0);
    assert_eq!(r.general_ring("1").unwrap().ring.writes(), 2);
}

/// `getGeneralRingLoop` (`generalHexRing.ts:60-122`): the outline of 7 hexes
/// has 18 edges (`:6`); normals are unit and outward; the band is two
/// triangles per edge (`:141`, `n * 2 * 3 * 3` floats), inner edge at
/// `GENERAL_RING_GAP` along the miter (`:158`, `:172`).
#[test]
fn general_band_outline_has_18_edges() {
    let lp = general_ring_loop();
    assert_eq!(lp.points.len(), 18);
    for (i, n) in lp.normals.iter().enumerate() {
        assert!((n.x.hypot(n.z) - 1.0).abs() < 1e-12);
        let p = lp.points[i];
        let q = lp.points[(i + 1) % 18];
        let mid = ((p.x + q.x) / 2.0, (p.z + q.z) / 2.0);
        assert!(mid.0 * n.x + mid.1 * n.z > 0.0, "normal {i} points inward");
    }
    // Every outline corner is a corner of an outer hex at distance HEX_R
    // from a neighbour centre, so it lies within 2 * sqrt(3) of the centre.
    for p in &lp.points {
        assert!(p.x.hypot(p.z) <= 2.0 * 3.0_f64.sqrt() + 1e-9);
    }
    let pos = general_ring_positions(GENERAL_RING_BASE_WIDTH);
    assert_eq!(pos.len(), 18 * 2 * 3 * 3);
    assert!(pos.iter().skip(1).step_by(3).all(|&y| y == 0.0));
    assert_eq!(
        general_ring_y(&[0.1, f64::NAN, 0.3, f64::INFINITY]),
        0.3 + GENERAL_RING_LIFT
    );
    assert_eq!(general_ring_y(&[f64::NAN]), GENERAL_RING_LIFT);
}

// ------------------------------------------------------------ highlight

/// `setHighlight` (`:6524-6556`): one disc per hex at `topY + HIGHLIGHT_LIFT`,
/// colour `HIGHLIGHT_COLOR`, given opacity (default `HIGHLIGHT_OPACITY`);
/// a new call replaces the old layer (`this.clearHighlight()`, `:6525`); an
/// empty set draws nothing (`:6527`). `clearHighlight` removes the group
/// (`:6559-6568`).
#[test]
fn highlight_set_replace_and_clear() {
    let mut r = renderer();
    r.set_highlight_default(&[h(0, 0), h(1, 0), h(0, 0), h(5, 5)]);
    let hl = r.highlight().expect("layer");
    assert_eq!(hl.disc_count(), 3);
    assert_eq!(hl.opacity, HIGHLIGHT_OPACITY);
    assert_eq!(hl.scene.materials.len(), 1);
    assert_eq!(hl.scene.materials[0].hex(), HIGHLIGHT_COLOR);
    let discs = &hl.scene.nodes[ROOT].children;
    assert_eq!(
        hl.scene.nodes[discs[1]].position.y,
        Terrain::Wzgorza.top_y() + HIGHLIGHT_LIFT
    );
    // Off the map: `topY = 0` (`:6546`).
    assert_eq!(hl.scene.nodes[discs[2]].position.y, HIGHLIGHT_LIFT);

    r.set_highlight(&[h(2, 0)], IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY);
    let hl = r.highlight().unwrap();
    assert_eq!(hl.disc_count(), 1);
    assert_eq!(
        hl.scene.materials[0].opacity,
        IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY
    );

    r.clear_highlight();
    assert!(r.highlight().is_none());

    r.set_highlight_default(&[h(0, 0)]);
    r.set_highlight_default(&[]);
    assert!(r.highlight().is_none());
}

// ------------------------------------------------------------ selection

/// `setSelectionHex(q, r, ownerId)` (`:6571-6591`): ring in the owner
/// colour at `topY + SELECTION_HEX_LIFT + relief`, `rotation.x = -π/2`.
#[test]
fn selection_ring_in_owner_colour() {
    let mut r = renderer();
    r.set_selection_hex(h(1, 0), 4);
    let s = r.selection().unwrap();
    assert_eq!(s.color(), default_owner_color(4));
    assert_eq!(
        s.scene.nodes[ROOT].position.y,
        Terrain::Wzgorza.top_y() + SELECTION_HEX_LIFT + HEX_R * 0.22
    );
    assert_eq!(s.scene.nodes[ROOT].rotation.x, -std::f64::consts::PI / 2.0);
    r.set_selection_hex(h(0, 0), 0);
    assert_eq!(r.selection().unwrap().hex, h(0, 0));
    r.clear_selection_hex();
    assert!(r.selection().is_none());
}

// ------------------------------------------------------------ route

/// `setPathRoute` (`:6608-6684`): a route of n hexes is ONE tube
/// (`TubeGeometry(curve, 64, TUBE_RADIUS, 8)`), n − 2 dots on the inner
/// points and one destination torus — not n − 1 segments; fewer than 2
/// hexes draw nothing (`:6614`). Points sit at `topYAt + ROUTE_Y_LIFT`.
#[test]
fn path_route_tube_dots_and_destination() {
    let mut r = renderer();
    let hexes = [h(0, 0), h(1, 0), h(1, -1), h(0, -1)];
    r.set_path_route(&hexes, &PathRouteOptions::default());
    let route = r.path_route().unwrap();
    assert_eq!(route.points.len(), 4);
    assert_eq!(route.dots.len(), 2);
    assert_eq!(route.scene.nodes[ROOT].children.len(), 1 + 2 + 1);
    assert_eq!(route.points[1].y, Terrain::Wzgorza.top_y() + ROUTE_Y_LIFT);
    let tube = route.scene.nodes[route.tube]
        .mesh()
        .unwrap()
        .geo
        .mesh()
        .vertex_count();
    assert_eq!(
        tube,
        ((TUBE_SEGMENTS + 1) * (TUBE_RADIAL_SEGMENTS + 1)) as usize
    );
    let dest = &route.scene.nodes[route.dest];
    assert_eq!(dest.position, route.points[3]);
    assert!(route.labels.is_empty());

    for n in 2..=6 {
        let hs: Vec<HexCoord> = (0..n).map(|i| h(i, 0)).collect();
        r.set_path_route(&hs, &PathRouteOptions::default());
        assert_eq!(r.path_route().unwrap().dots.len(), (n - 2) as usize);
    }

    r.set_path_route(&[h(0, 0)], &PathRouteOptions::default());
    assert!(r.path_route().is_none());
}

/// Labels (`:6666-6683`): turn stops label their hex (`findIndex`, stops
/// off the route skipped) at `+0.32`; without stops a `turnLabel` labels
/// the destination at `+0.35`.
#[test]
fn path_route_turn_labels() {
    let mut r = renderer();
    let hexes = [h(0, 0), h(1, 0), h(2, 0)];
    let opts = PathRouteOptions {
        turn_label: Some("3 tury".to_owned()),
        turn_stops: vec![
            TurnStop {
                hex: h(1, 0),
                turn: 1,
            },
            TurnStop {
                hex: h(9, 9),
                turn: 2,
            },
            TurnStop {
                hex: h(2, 0),
                turn: 3,
            },
        ],
    };
    r.set_path_route(&hexes, &opts);
    let route = r.path_route().unwrap();
    let texts: Vec<&str> = route.labels.iter().map(|l| l.text.as_str()).collect();
    assert_eq!(texts, ["1", "3"]);
    assert_eq!(route.labels[0].position.1, route.points[1].y + 0.32 * HEX_R);

    let opts = PathRouteOptions {
        turn_label: Some("3 tury".to_owned()),
        turn_stops: vec![],
    };
    r.set_path_route(&hexes, &opts);
    let route = r.path_route().unwrap();
    assert_eq!(route.labels.len(), 1);
    assert!(route.labels[0].is_turn_label);
    assert_eq!(route.labels[0].position.1, route.points[2].y + 0.35 * HEX_R);

    r.clear_path_route();
    assert!(r.path_route().is_none());
}

// ------------------------------------------------------------ dispose

/// `dispose()` (`:6747-6759`): route, highlight, every token and every
/// general band go; the selection ring is not touched by the web method.
#[test]
fn dispose_releases_tokens_bands_highlight_and_route() {
    let mut r = renderer();
    let mut g = unit(1, player(0), 0, 0);
    g.is_general = true;
    r.sync(&[g, unit(2, player(1), 1, 0)], None).unwrap();
    r.set_highlight_default(&[h(0, 0)]);
    r.set_path_route(&[h(0, 0), h(1, 0)], &PathRouteOptions::default());
    r.set_selection_hex(h(0, 0), 0);
    assert_eq!(r.token_count(), 2);
    assert_eq!(r.general_rings().len(), 1);

    r.dispose();
    assert_eq!(r.token_count(), 0);
    assert!(r.tokens().next().is_none());
    assert!(r.token("1").is_none());
    assert!(r.general_rings().is_empty());
    assert!(r.highlight().is_none());
    assert!(r.path_route().is_none());
    assert!(r.pick_models().is_empty());
    assert!(r.selection().is_some());
}

// ------------------------------------------------------------ picking

/// Token meshes for `UnitPickModel.meshes` (`pick/mod.rs:181-189`): only
/// visible tokens (`units.ts:5933`), every mesh of the token subtree (model
/// + owner rings), and `ray_to_unit` hits the token under a vertical ray.
#[test]
fn pick_models_come_from_visible_tokens() {
    let mut r = renderer();
    let units = vec![
        unit(1, player(0), 0, 0),
        unit(2, player(0), 0, 0),
        unit(3, player(1), 2, 0),
    ];
    r.sync(
        &units,
        Some(&{
            let mut s = stack(&[1, 2], false);
            s.visible_ids.push(uid(3));
            s
        }),
    )
    .unwrap();
    let models = r.pick_models();
    let ids: Vec<&str> = models.iter().map(|m| m.id.as_str()).collect();
    assert_eq!(ids, ["1", "3"]);
    let t3 = r.token("3").unwrap();
    assert_eq!(models[1].meshes.len(), t3.model.meshes().len());
    assert_eq!(models[1].hex, h(2, 0));

    let (x, _, z) = t3.position();
    let ray = Ray {
        origin: PVec3::new(x, 10.0, z),
        direction: PVec3::new(0.0, -1.0, 0.0),
    };
    assert_eq!(ray_to_unit(&ray, &models), Some(1));
    let miss = Ray {
        origin: PVec3::new(x + 50.0, 10.0, z),
        direction: PVec3::new(0.0, -1.0, 0.0),
    };
    assert_eq!(ray_to_unit(&miss, &models), None);
}
