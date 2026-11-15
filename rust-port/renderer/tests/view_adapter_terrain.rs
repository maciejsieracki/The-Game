//! R-RUSTPORT-P4-1G-Q2-ADAPTER-TERRAIN: the terrain part of the view adapter
//! (`renderer::view::terrain`), `P4-1G-ADAPTER-ROZPOZNANIE.md` §3.1, §3.2,
//! §3.6 (row "ukrycie dekoru"), §3.7 (row `overlays.okolica`).
//!
//! Sources of the expected values (pin `07d2fbd72`, `gra/src/**`):
//! - `width/height/hexes`: `buildScene(map, …)` reads `map.szerokoscQ`,
//!   `map.wysokoscR` and `Object.values(map.hexes)` (`render/scene.ts:1580`);
//! - `seed`: `map.seed | 0` (`TerrainInput.seed`, `terrain/mod.rs:230-232`),
//!   JS `ToInt32` (ECMA-262 §7.1.6): `(2**32 + 5) | 0 === 5`,
//!   `-1.5 | 0 === -1`, `NaN | 0 === 0`;
//! - `terraces`: `improvementKeysForHex(hex).includes('tarasy')`
//!   (`render/scene.ts:2468-2469`), carried 1:1 by `HexDynDto.terraces`;
//! - `solid_hidden`: `hideDecorAtHex(keyOf(c.q, c.r))` for every city
//!   (`main.ts:16211`) and every placed wonder, ruins included
//!   (`main.ts:4312`); nothing else in the DTO hides a solid (L5 wonder build
//!   sites are not in the DTO);
//! - `prism_hidden`: `!explored` of the Q1 fog sets (`view/fog.rs`); the fog
//!   codes `0/1/2` = unexplored/explored/visible (D-DTO-10 = A);
//! - `covering_improvement`: `hexHasCoveringTerrainImprovement(hex)`, carried
//!   by `HexDynDto.covering_improvement` (`okolica.rs:354-359`);
//! - `setFog(vis, explored, { landReveal })` / `setFog(ALL_KEYS, ALL_KEYS)`
//!   (`main.ts:13485-13514`).

use std::collections::HashSet;

use civ_renderer::cities::overlay::okolica::TileYield;
use civ_renderer::pick::hex::HexCoord as PickHex;
use civ_renderer::pick::terrain::{MapHex, Terrain};
use civ_renderer::terrain::{build_terrain, MapDetailQuality, RiverKind, RiverPath, TerrainHex};
use civ_renderer::view::{self, FogSets, ViewAdapterError};
use civ_view_model as vm;

// ------------------------------------------------------------ fixture

const W: u32 = 4;
const H: u32 = 3;

/// Base terrain of the 4×3 fixture, `r`-major (`hexes[i].coord == (i % 4,
/// i / 4)`, contract §1.4).
const TERRAIN: [vm::Terrain; 12] = [
    vm::Terrain::Morze,
    vm::Terrain::PlytkieMorze,
    vm::Terrain::Laka,
    vm::Terrain::Wzgorza,
    vm::Terrain::PlytkieMorze,
    vm::Terrain::Rownina,
    vm::Terrain::Wzgorza,
    vm::Terrain::Gory,
    vm::Terrain::Morze,
    vm::Terrain::Pustynia,
    vm::Terrain::Polarny,
    vm::Terrain::Gory,
];

/// Same terrain, renderer enum (`pick/terrain.rs:24`).
const TERRAIN_R: [Terrain; 12] = [
    Terrain::Morze,
    Terrain::PlytkieMorze,
    Terrain::Laka,
    Terrain::Wzgorza,
    Terrain::PlytkieMorze,
    Terrain::Rownina,
    Terrain::Wzgorza,
    Terrain::Gory,
    Terrain::Morze,
    Terrain::Pustynia,
    Terrain::Polarny,
    Terrain::Gory,
];

/// `HexDynDto.terraces`: true on (3,0) and (2,1) (two hills).
const TERRACES: [bool; 12] = [
    false, false, false, true, false, false, true, false, false, false, false, false,
];

/// `HexDynDto.covering_improvement`: true on (2,0), (1,1) and (3,2).
const COVERING: [bool; 12] = [
    false, false, true, false, false, true, false, false, false, false, false, true,
];

/// Fog codes: row 0 = 0,1,2,2; row 1 = 2,2,1,0; row 2 = 1,0,2,2.
const FOG: [u8; 12] = [0, 1, 2, 2, 2, 2, 1, 0, 1, 0, 2, 2];

fn coord(i: usize) -> vm::HexCoord {
    let w = usize::try_from(W).unwrap();
    vm::HexCoord::new(i32::try_from(i % w).unwrap(), i32::try_from(i / w).unwrap())
}

fn fixture_map(seed: f64) -> vm::MapViewDto {
    vm::MapViewDto {
        width: W,
        height: H,
        seed,
        hexes: (0..TERRAIN.len())
            .map(|i| vm::HexStaticDto {
                coord: coord(i),
                teren_bazowy: TERRAIN[i],
                rzeka_krawedzie: Vec::new(),
            })
            .collect(),
        rivers: vec![vm::RiverPathDto {
            hexes: vec![vm::HexCoord::new(2, 0), vm::HexCoord::new(1, 1)],
            kind: Some(vm::RiverKind::Medium),
        }],
        // One render path per river (`validate_map`, P4-1B-Q3); the terrain
        // adapter does not read it.
        river_render_paths: vec![vec![vm::HexCoord::new(2, 0), vm::HexCoord::new(1, 1)]],
    }
}

fn fixture_state() -> Vec<vm::HexDynDto> {
    (0..TERRAIN.len())
        .map(|i| vm::HexDynDto {
            nakladka: vm::Nakladka::Brak,
            ulepszenie: vm::Ulepszenie::Brak,
            ulepszenia: None,
            improvement_key: None,
            zloze: None,
            village_present: false,
            terraces: TERRACES[i],
            covering_improvement: COVERING[i],
            road_mask: 0,
        })
        .collect()
}

fn fixture_fog() -> vm::FogViewDto {
    vm::FogViewDto {
        state: FOG
            .iter()
            .map(|&c| vm::FogState::from_code(c).unwrap())
            .collect(),
    }
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

fn city(id: u64, hex: vm::HexCoord) -> vm::CityViewDto {
    vm::CityViewDto {
        id: vm::CityId::try_new(id).unwrap(),
        owner_id: player(0),
        hex,
        population: 3.0,
        level: 1.0,
        wall_kind: vm::WallKind::None,
        revolt: false,
        besieged: false,
        fog_visible: true,
        unit_count_on_hex: 0,
        badge: vm::CityBadgeDto {
            city_name: "Ateny".to_owned(),
            population: 3.0,
            defense_tier: 0,
            civ_icon_id: "grecy".to_owned(),
            owner_color: 0x00ff_0000,
            prod_active: false,
            prod_kind: None,
            prod_id: None,
            prod_item_name: None,
            prod_category_label: None,
            prod_paused: false,
            growth_percent: None,
            growth_starving: false,
            resource_warning: false,
            is_city_state: false,
            era: 1.0,
            is_capital: true,
        },
    }
}

fn wonder(hex: vm::HexCoord, ruin: bool) -> vm::PlacedWonderDto {
    vm::PlacedWonderDto {
        wonder_id: "piramidy".to_owned(),
        hex,
        owner_id: player(1),
        ruin,
    }
}

/// City on (1,1); wonder on (3,0) (a hill with terraces); ruin of a wonder on
/// (3,2) (a mountain).
fn fixture_cities() -> Vec<vm::CityViewDto> {
    vec![city(1, vm::HexCoord::new(1, 1))]
}

fn fixture_wonders() -> Vec<vm::PlacedWonderDto> {
    vec![
        wonder(vm::HexCoord::new(3, 0), false),
        wonder(vm::HexCoord::new(3, 2), true),
    ]
}

fn picks(v: &[(i32, i32)]) -> HashSet<PickHex> {
    v.iter().map(|&(q, r)| PickHex::new(q, r)).collect()
}

// ------------------------------------------------------------ TerrainInput

#[test]
fn terrain_data_copies_size_hexes_terraces_and_rivers() {
    let d = view::terrain_data(&fixture_map(7.0), &fixture_state()).unwrap();
    assert_eq!((d.width, d.height), (4, 3));
    assert_eq!(d.seed, 7);
    let want: Vec<TerrainHex> = (0..12)
        .map(|i| TerrainHex {
            coord: PickHex::new(coord(i).q, coord(i).r),
            terrain: TERRAIN_R[i],
            terraces: TERRACES[i],
        })
        .collect();
    assert_eq!(d.hexes, want);
    assert_eq!(
        d.rivers,
        vec![RiverPath {
            hexes: vec![PickHex::new(2, 0), PickHex::new(1, 1)],
            kind: Some(RiverKind::Medium),
        }]
    );
    let input = d.input(MapDetailQuality::Medium);
    assert_eq!(input.seed, 7);
    assert_eq!((input.width, input.height), (4, 3));
    assert_eq!(input.hexes, &d.hexes[..]);
    assert_eq!(input.rivers, &d.rivers[..]);
    assert_eq!(input.detail, MapDetailQuality::Medium);
}

/// Rivers: `kind: None` stays `None`, an empty hex list stays empty, DTO
/// order kept (`map.riverPaths` + `riverPathKinds`, the kind is optional).
#[test]
fn rivers_kind_none_and_empty_hexes() {
    let mut m = fixture_map(0.0);
    m.rivers = vec![
        vm::RiverPathDto {
            hexes: vec![vm::HexCoord::new(0, 1), vm::HexCoord::new(1, 1)],
            kind: None,
        },
        vm::RiverPathDto {
            hexes: Vec::new(),
            kind: Some(vm::RiverKind::Medium),
        },
        vm::RiverPathDto {
            hexes: Vec::new(),
            kind: None,
        },
    ];
    let d = view::terrain_data(&m, &fixture_state()).unwrap();
    assert_eq!(
        d.rivers,
        vec![
            RiverPath {
                hexes: vec![PickHex::new(0, 1), PickHex::new(1, 1)],
                kind: None,
            },
            RiverPath {
                hexes: Vec::new(),
                kind: Some(RiverKind::Medium),
            },
            RiverPath {
                hexes: Vec::new(),
                kind: None,
            },
        ]
    );
    m.rivers.clear();
    assert!(view::terrain_data(&m, &fixture_state())
        .unwrap()
        .rivers
        .is_empty());
}

/// The adapter's precondition: the fixture passes `validate_map`, and a map
/// with a duplicate coord does not (contract §1.4, `HexOrder`), so the
/// coord-keyed `OverlayMap.hexes` never sees duplicates in a valid snapshot.
#[test]
fn duplicate_coords_are_rejected_by_validate_map() {
    assert_eq!(vm::validate_map(&fixture_map(0.0)), Ok(()));
    let mut m = fixture_map(0.0);
    m.hexes[1].coord = vm::HexCoord::new(0, 0);
    assert!(matches!(
        vm::validate_map(&m),
        Err(vm::ViewError::HexOrder { .. })
    ));
    // Without the validator the overlay map would merge the two entries.
    assert_eq!(view::overlay_map(&m).hexes.len(), 11);
}

/// Terraces are copied 1:1, true and false both present (the mutation
/// "terraces always false" fails here and in `map_hexes_*`).
#[test]
fn terraces_are_copied_one_to_one() {
    let d = view::terrain_data(&fixture_map(0.0), &fixture_state()).unwrap();
    let got: Vec<bool> = d.hexes.iter().map(|h| h.terraces).collect();
    assert_eq!(got, TERRACES);
    assert!(got.contains(&true) && got.contains(&false));
}

/// `map.seed | 0`: `2^32 + 5 → 5` (saturating `as i32` would give
/// `i32::MAX`), `-1.5 → -1`, `NaN → 0`.
#[test]
fn seed_goes_through_to_int32() {
    for (seed, want) in [
        (4_294_967_296.0 + 5.0, 5),
        (-1.5, -1),
        (f64::NAN, 0),
        (2_147_483_648.0, -2_147_483_648),
        (-2_147_483_649.0, 2_147_483_647),
    ] {
        let m = fixture_map(seed);
        assert_eq!(
            view::terrain_data(&m, &fixture_state()).unwrap().seed,
            want,
            "terrain seed {seed:?}"
        );
        assert_eq!(
            view::terrain_scene_options(&m, true).seed,
            want,
            "pick seed {seed:?}"
        );
    }
    let o = view::terrain_scene_options(&fixture_map(1.0), false);
    assert!(!o.solids_visible);
    assert!(view::terrain_scene_options(&fixture_map(1.0), true).solids_visible);
}

#[test]
fn hex_state_length_mismatch_is_an_error() {
    let m = fixture_map(0.0);
    let mut st = fixture_state();
    st.pop();
    let err = ViewAdapterError::LengthMismatch {
        field: "hex_state",
        expected: 12,
        actual: 11,
    };
    assert_eq!(view::terrain_data(&m, &st), Err(err.clone()));
    assert_eq!(view::okolica_map(&m, &st), Err(err.clone()));
    let fog = FogSets::from_dto(&m, &fixture_fog(), true).unwrap();
    assert_eq!(view::map_hexes(&m, &st, &fog, &[], &[]), Err(err));
}

#[test]
fn fog_length_mismatch_is_an_error() {
    let m = fixture_map(0.0);
    let mut fog = FogSets::from_dto(&m, &fixture_fog(), true).unwrap();
    fog.prism_hidden.push(false);
    assert_eq!(
        view::map_hexes(&m, &fixture_state(), &fog, &[], &[]),
        Err(ViewAdapterError::LengthMismatch {
            field: "fog.prism_hidden",
            expected: 12,
            actual: 13,
        })
    );
}

// ------------------------------------------------------------ MapHex

#[test]
fn solid_hidden_covers_cities_and_wonders_including_ruins() {
    let hidden = view::solid_hidden_hexes(&fixture_cities(), &fixture_wonders());
    assert_eq!(hidden, picks(&[(1, 1), (3, 0), (3, 2)]));
}

/// A hex with a city and a wonder is hidden once; its neighbours are not.
#[test]
fn solid_hidden_city_and_wonder_on_one_hex_neighbour_not() {
    let c = vm::HexCoord::new(2, 1);
    let hidden = view::solid_hidden_hexes(&[city(9, c)], &[wonder(c, false)]);
    assert_eq!(hidden, picks(&[(2, 1)]));
    for n in [(3, 1), (1, 1), (2, 0), (3, 0), (1, 2), (2, 2)] {
        assert!(!hidden.contains(&PickHex::new(n.0, n.1)), "neighbour {n:?}");
    }
}

/// Wonder alone (no city) still hides: the mutation "skip wonders" fails.
#[test]
fn solid_hidden_wonder_without_city() {
    let hidden = view::solid_hidden_hexes(&[], &[wonder(vm::HexCoord::new(0, 2), false)]);
    assert_eq!(hidden, picks(&[(0, 2)]));
    let ruin = view::solid_hidden_hexes(&[], &[wonder(vm::HexCoord::new(0, 2), true)]);
    assert_eq!(ruin, picks(&[(0, 2)]));
    assert!(view::solid_hidden_hexes(&[], &[]).is_empty());
}

#[test]
fn map_hexes_full_fixture() {
    let m = fixture_map(0.0);
    let fog = FogSets::from_dto(&m, &fixture_fog(), true).unwrap();
    let got = view::map_hexes(
        &m,
        &fixture_state(),
        &fog,
        &fixture_cities(),
        &fixture_wonders(),
    )
    .unwrap();
    // `prism_hidden` = fog code 0 (unexplored) under active fog.
    let prism_hidden: [bool; 12] = FOG.map(|c| c == 0);
    // City (1,1) = index 5; wonder (3,0) = 3; ruin (3,2) = 11.
    let solid_hidden: [bool; 12] = [
        false, false, false, true, false, true, false, false, false, false, false, true,
    ];
    let want: Vec<MapHex> = (0..12)
        .map(|i| MapHex {
            coord: PickHex::new(coord(i).q, coord(i).r),
            terrain: TERRAIN_R[i],
            prism_hidden: prism_hidden[i],
            solid_hidden: solid_hidden[i],
            terraces: TERRACES[i],
        })
        .collect();
    assert_eq!(got, want);
    assert_eq!(
        got.iter().map(|h| h.prism_hidden).collect::<Vec<_>>(),
        fog.prism_hidden
    );
}

/// Fog off: `ALL_KEYS` explored → no prism hidden; solids still hidden
/// under cities and wonders (`hideDecorAtHex` does not depend on fog).
#[test]
fn map_hexes_fog_off() {
    let m = fixture_map(0.0);
    let fog = FogSets::from_dto(&m, &fixture_fog(), false).unwrap();
    let got = view::map_hexes(
        &m,
        &fixture_state(),
        &fog,
        &fixture_cities(),
        &fixture_wonders(),
    )
    .unwrap();
    assert!(got.iter().all(|h| !h.prism_hidden));
    let hidden: Vec<usize> = (0..12).filter(|&i| got[i].solid_hidden).collect();
    assert_eq!(hidden, [3, 5, 11]);
}

// ------------------------------------------------------------ overlays

#[test]
fn overlay_map_terrain_and_raw_seed() {
    let m = fixture_map(-1.5);
    let o = view::overlay_map(&m);
    assert_eq!(o.hexes.len(), 12);
    for (i, &t) in TERRAIN_R.iter().enumerate() {
        assert_eq!(o.terrain((coord(i).q, coord(i).r)), Some(t), "hex {i}");
    }
    assert_eq!(o.terrain((4, 0)), None);
    // Raw JS number: the overlays read `map.seed ?? 0` (`range.rs:142`).
    assert_eq!(o.seed, Some(-1.5));
}

#[test]
fn okolica_covering_improvement_only_where_set() {
    let m = fixture_map(3.0);
    let ok = view::okolica_map(&m, &fixture_state()).unwrap();
    assert_eq!(ok.map, view::overlay_map(&m));
    let want: HashSet<(i32, i32)> = [(2, 0), (1, 1), (3, 2)].into_iter().collect();
    assert_eq!(ok.covering_improvement, want);
    // No entry → false.
    for (i, &covering) in COVERING.iter().enumerate() {
        let k = (coord(i).q, coord(i).r);
        assert_eq!(ok.covering_improvement.contains(&k), covering, "hex {k:?}");
    }
}

#[test]
fn okolica_without_covering_is_empty() {
    let m = fixture_map(0.0);
    let mut st = fixture_state();
    for d in &mut st {
        d.covering_improvement = false;
    }
    assert!(view::okolica_map(&m, &st)
        .unwrap()
        .covering_improvement
        .is_empty());
}

#[test]
fn tile_yield_is_field_by_field() {
    let cases = [
        vm::TileYieldDto {
            zywnosc: Some(2.0),
            praca: Some(1.0),
            handel: Some(0.5),
        },
        vm::TileYieldDto {
            zywnosc: None,
            praca: Some(-1.0),
            handel: None,
        },
        vm::TileYieldDto {
            zywnosc: Some(0.0),
            praca: None,
            handel: Some(3.0),
        },
    ];
    for y in &cases {
        assert_eq!(
            view::tile_yield(y),
            TileYield {
                zywnosc: y.zywnosc,
                praca: y.praca,
                handel: y.handel,
            }
        );
    }
}

// ------------------------------------------------------------ terrain fog

/// `apply_terrain_fog` = `set_fog(visible, explored, land_reveal)` with the
/// Q1 sets; `land_reveal` is passed through (fog on, some hex hidden:
/// `showOceanBackdrop = landReveal`).
#[test]
fn apply_terrain_fog_matches_set_fog() {
    let m = fixture_map(11.0);
    let d = view::terrain_data(&m, &fixture_state()).unwrap();
    let fog = FogSets::from_dto(&m, &fixture_fog(), true).unwrap();
    let vis = picks(&[(2, 0), (3, 0), (0, 1), (1, 1), (2, 2), (3, 2)]);
    let exp = picks(&[
        (1, 0),
        (2, 0),
        (3, 0),
        (0, 1),
        (1, 1),
        (2, 1),
        (0, 2),
        (2, 2),
        (3, 2),
    ]);
    assert_eq!(fog.visible, vis);
    assert_eq!(fog.explored, exp);
    for land_reveal in [false, true] {
        let mut a = build_terrain(&d.input(MapDetailQuality::High));
        let mut b = a.clone();
        let ra = view::apply_terrain_fog(&mut a, &fog, land_reveal);
        let rb = b.set_fog(&vis, &exp, land_reveal);
        assert_eq!(ra, rb);
        assert_eq!(ra, land_reveal, "hidden hexes exist: backdrop = landReveal");
        assert_eq!(a, b);
    }
}

/// Fog off: all keys in both sets, no hex hidden → backdrop shown either way.
#[test]
fn apply_terrain_fog_off_is_all_keys() {
    let m = fixture_map(0.0);
    let d = view::terrain_data(&m, &fixture_state()).unwrap();
    let fog = FogSets::from_dto(&m, &fixture_fog(), false).unwrap();
    let all: HashSet<PickHex> = (0..12)
        .map(|i| PickHex::new(coord(i).q, coord(i).r))
        .collect();
    for land_reveal in [false, true] {
        let mut a = build_terrain(&d.input(MapDetailQuality::High));
        let mut b = a.clone();
        assert!(view::apply_terrain_fog(&mut a, &fog, land_reveal));
        assert!(b.set_fog(&all, &all, false));
        assert_eq!(a, b);
    }
}
