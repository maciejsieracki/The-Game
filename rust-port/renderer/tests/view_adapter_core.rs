//! R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE: the shared conversions of the view
//! adapter (`renderer::view`) and the fog sets
//! (`dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` §2, §3.3).
//!
//! `ToInt32` expectations: the JS expression `x | 0` (ECMA-262 §7.1.6),
//! printed by a plain Node script (`node -e`, `xs.map(x => x | 0)`) — a
//! language rule, not code of the pin. The values also follow by hand from
//! "trunc, modulo 2^32, two's complement".

use std::collections::HashSet;

use civ_renderer::battle::siege_towers::TowerMaterial;
use civ_renderer::battle::units::{BattleSide, FortKind};
use civ_renderer::models::cities::outline::CityMapOutlineKind;
use civ_renderer::models::cities::renderer::CityWallKind;
use civ_renderer::models::misc::siege::SiegeMachineKind;
use civ_renderer::models::misc::trade::TradeMedium;
use civ_renderer::pick::hex::HexCoord as PickHex;
use civ_renderer::pick::terrain::Terrain;
use civ_renderer::terrain::RiverKind;
use civ_renderer::view::{self, FogSets, ViewAdapterError};
use civ_view_model as vm;

// ------------------------------------------------------------ ToInt32

/// `(x, x | 0)` from Node.
const TO_INT32: &[(f64, i32)] = &[
    (0.0, 0),
    (-0.0, 0),
    (0.5, 0),
    (-0.5, 0),
    (1.9, 1),
    (-1.9, -1),
    (12_345.678, 12_345),
    (-12_345.678, -12_345),
    (-1.0, -1),
    (2_147_483_647.0, 2_147_483_647),
    (2_147_483_648.0, -2_147_483_648),
    (2_147_483_648.7, -2_147_483_648),
    (-2_147_483_648.0, -2_147_483_648),
    (-2_147_483_648.9, -2_147_483_648),
    (-2_147_483_649.0, 2_147_483_647),
    (4_294_967_295.0, -1),
    (4_294_967_296.0, 0),
    (4_294_967_297.0, 1),
    (6_442_450_943.5, 2_147_483_647),
    (1e10, 1_410_065_408),
    (-1e10, -1_410_065_408),
    (9_007_199_254_740_991.0, -1),
    (1e300, 0),
    (-1e300, 0),
    (f64::NAN, 0),
    (f64::INFINITY, 0),
    (f64::NEG_INFINITY, 0),
];

#[test]
fn seed_is_js_to_int32() {
    for &(x, want) in TO_INT32 {
        assert_eq!(view::seed_i32(x), want, "ToInt32({x:?})");
    }
}

/// `-0 | 0` is `+0`; as an `i32` there is only one zero, but the result must
/// be exactly `0`, whatever the sign of the input zero.
#[test]
fn seed_minus_zero_is_zero() {
    assert_eq!(view::seed_i32(-0.0), 0);
    assert_eq!(view::seed_i32(-0.999_999), 0);
}

/// Saturation (`as i32`) differs from ToInt32 on these: the vector table
/// must contain them, or the mutation "`to_int32` → `as i32`" would pass.
#[test]
#[allow(clippy::cast_possible_truncation)]
fn vectors_distinguish_wrap_from_saturation() {
    let differing = TO_INT32
        .iter()
        .filter(|&&(x, want)| (x as i32) != want)
        .count();
    assert!(differing >= 8, "only {differing} vectors catch saturation");
}

// ------------------------------------------------------------ owners

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).unwrap())
}

#[test]
fn owner_i32_fits() {
    assert_eq!(view::owner_i32(player(0)), Ok(0));
    assert_eq!(view::owner_i32(player(7)), Ok(7));
    assert_eq!(view::owner_i32(player(2_147_483_647)), Ok(i32::MAX));
    assert_eq!(view::owner_i32(vm::OwnerRef::Barbarian), Ok(-1));
    assert_eq!(view::owner_i32(vm::OwnerRef::Rebel), Ok(-99));
}

#[test]
fn owner_i32_overflow_is_an_error() {
    for id in [
        2_147_483_648_u64,
        4_294_967_296,
        4_294_967_297,
        vm::MAX_SAFE_ID,
    ] {
        let got = view::owner_i32(player(id));
        assert_eq!(
            got,
            Err(ViewAdapterError::OwnerOutOfI32 {
                value: i64::try_from(id).unwrap()
            }),
            "owner {id}"
        );
    }
}

#[test]
fn owner_i64_and_f64_are_the_legacy_number() {
    assert_eq!(
        view::owner_i64(player(vm::MAX_SAFE_ID)),
        9_007_199_254_740_991
    );
    assert_eq!(view::owner_i64(vm::OwnerRef::Barbarian), -1);
    assert_eq!(view::owner_i64(vm::OwnerRef::Rebel), -99);
    assert_eq!(
        view::owner_f64(player(vm::MAX_SAFE_ID)),
        9_007_199_254_740_991.0
    );
    assert_eq!(view::owner_f64(player(3)), 3.0);
    assert_eq!(view::owner_f64(vm::OwnerRef::Rebel), -99.0);
}

// ------------------------------------------------------------ ids

#[test]
fn ids_are_decimal_strings() {
    let c = |v| vm::CityId::try_new(v).unwrap();
    let u = |v| vm::UnitId::try_new(v).unwrap();
    assert_eq!(view::city_id_string(c(0)), "0");
    assert_eq!(view::city_id_string(c(42)), "42");
    assert_eq!(view::city_id_string(c(vm::MAX_SAFE_ID)), "9007199254740991");
    assert_eq!(view::unit_id_string(u(1)), "1");
    assert_eq!(view::unit_id_string(u(1_000_000)), "1000000");
}

// ------------------------------------------------------------ coordinates

#[test]
fn hex_coord_four_shapes() {
    for (q, r) in [(0, 0), (3, 5), (-2, 7), (i32::MAX, i32::MIN)] {
        let h = vm::HexCoord::new(q, r);
        assert_eq!(view::pick_hex(h), PickHex::new(q, r));
        assert_eq!(view::hex_key(h), (q, r));
        assert_eq!(view::hex_key_string(h), format!("{q},{r}"));
        assert_eq!(view::hex_f64(h), (f64::from(q), f64::from(r)));
        let b = view::hex_build_highlight(h);
        assert_eq!((b.q, b.r), (f64::from(q), f64::from(r)));
    }
    // The web key of a negative coordinate (`${q},${r}`).
    assert_eq!(view::hex_key_string(vm::HexCoord::new(-1, -12)), "-1,-12");
}

// ------------------------------------------------------------ enums

/// JSON string of a DTO enum value (its web id).
macro_rules! web_id {
    ($v:expr) => {
        serde_json::to_value($v)
            .unwrap()
            .as_str()
            .unwrap()
            .to_owned()
    };
}

#[test]
fn terrain_maps_every_variant_by_web_id() {
    // Exhaustive (no wildcard): a new DTO variant breaks this test's build.
    let all = [
        vm::Terrain::Laka,
        vm::Terrain::Rownina,
        vm::Terrain::Wzgorza,
        vm::Terrain::Gory,
        vm::Terrain::PlytkieMorze,
        vm::Terrain::Morze,
        vm::Terrain::Pustynia,
        vm::Terrain::Polarny,
    ];
    for t in all {
        match t {
            vm::Terrain::Laka
            | vm::Terrain::Rownina
            | vm::Terrain::Wzgorza
            | vm::Terrain::Gory
            | vm::Terrain::PlytkieMorze
            | vm::Terrain::Morze
            | vm::Terrain::Pustynia
            | vm::Terrain::Polarny => {}
        }
        assert_eq!(
            Some(view::terrain(t)),
            Terrain::from_web_id(&web_id!(&t)),
            "{t:?}"
        );
    }
    // Same declaration order (`Object.values(TerenBazowy)`).
    let mapped: Vec<Terrain> = all.iter().map(|&t| view::terrain(t)).collect();
    assert_eq!(mapped, Terrain::ALL.to_vec());
}

#[test]
fn river_kind_maps_every_variant_by_web_id() {
    for k in [
        vm::RiverKind::Main,
        vm::RiverKind::Medium,
        vm::RiverKind::Short,
        vm::RiverKind::Tributary,
    ] {
        assert_eq!(
            Some(view::river_kind(k)),
            RiverKind::from_web_id(&web_id!(&k)),
            "{k:?}"
        );
    }
}

#[test]
fn wall_kind_maps_every_variant_by_web_id() {
    let all = [
        vm::WallKind::None,
        vm::WallKind::Palisada,
        vm::WallKind::Stone,
    ];
    let got: Vec<CityWallKind> = all.iter().map(|&k| view::city_wall_kind(k)).collect();
    assert_eq!(
        got,
        [
            CityWallKind::None,
            CityWallKind::Palisada,
            CityWallKind::Stone
        ]
    );
    for k in all {
        assert_eq!(view::city_wall_kind(k).web_id(), web_id!(&k), "{k:?}");
    }
}

#[test]
fn map_outline_kind_maps_every_variant_by_web_id() {
    let all = [
        vm::MapOutlineKind::Player,
        vm::MapOutlineKind::War,
        vm::MapOutlineKind::Neutral,
        vm::MapOutlineKind::Ally,
    ];
    let got: Vec<CityMapOutlineKind> = all.iter().map(|&k| view::map_outline_kind(k)).collect();
    assert_eq!(
        got,
        [
            CityMapOutlineKind::Player,
            CityMapOutlineKind::War,
            CityMapOutlineKind::Neutral,
            CityMapOutlineKind::Ally
        ]
    );
    for k in all {
        assert_eq!(view::map_outline_kind(k).web_id(), web_id!(&k), "{k:?}");
    }
}

#[test]
fn trade_medium_maps_every_variant() {
    assert_eq!(view::trade_medium(vm::TradeMedium::Lad), TradeMedium::Lad);
    assert_eq!(
        view::trade_medium(vm::TradeMedium::Morze),
        TradeMedium::Morze
    );
    assert_eq!(web_id!(&vm::TradeMedium::Lad), "lad");
    assert_eq!(web_id!(&vm::TradeMedium::Morze), "morze");
}

#[test]
fn siege_machine_kind_maps_every_variant_by_web_id() {
    for k in [vm::SiegeMachineKind::Taran, vm::SiegeMachineKind::Wieza] {
        let r = view::siege_machine_kind(k);
        assert_eq!(r.web_id(), web_id!(&k), "{k:?}");
        assert_eq!(SiegeMachineKind::from_web_id(&web_id!(&k)), Some(r));
    }
}

#[test]
fn battle_side_maps_every_variant() {
    assert_eq!(view::battle_side(vm::BattleSide::Atk), BattleSide::Atk);
    assert_eq!(view::battle_side(vm::BattleSide::Def), BattleSide::Def);
    assert_eq!(web_id!(&vm::BattleSide::Atk), "atk");
    assert_eq!(web_id!(&vm::BattleSide::Def), "def");
}

#[test]
fn fort_kind_maps_every_variant() {
    assert_eq!(view::fort_kind(vm::FortKind::None), FortKind::None);
    assert_eq!(view::fort_kind(vm::FortKind::Palisada), FortKind::Palisada);
    assert_eq!(view::fort_kind(vm::FortKind::Mur), FortKind::Mur);
    // The renderer's wall model of each (`battleScene.ts:3985`).
    assert_eq!(
        view::fort_kind(vm::FortKind::Palisada).wall_kind().web_id(),
        "palisada"
    );
    assert_eq!(
        view::fort_kind(vm::FortKind::Mur).wall_kind().web_id(),
        "mur"
    );
}

#[test]
fn tower_material_maps_every_variant_by_web_id() {
    for m in [vm::TowerMaterial::Drewno, vm::TowerMaterial::Kamien] {
        assert_eq!(view::tower_material(m).web_id(), web_id!(&m), "{m:?}");
    }
    assert_eq!(
        view::tower_material(vm::TowerMaterial::Kamien),
        TowerMaterial::Kamien
    );
}

/// An unknown value is an error when the DTO is read — never a default
/// variant (the DTO enums have no catch-all, and the adapter `match`es have
/// no wildcard).
#[test]
fn unknown_enum_values_are_errors() {
    macro_rules! rejects {
        ($t:ty, $json:expr) => {
            serde_json::from_str::<$t>($json).is_err()
        };
    }
    assert!(rejects!(vm::Terrain, "\"bagno\""));
    assert!(rejects!(vm::Terrain, "\"\""));
    assert!(rejects!(vm::RiverKind, "\"delta\""));
    assert!(rejects!(vm::WallKind, "\"mur\""));
    assert!(rejects!(vm::MapOutlineKind, "\"enemy\""));
    assert!(rejects!(vm::TradeMedium, "\"powietrze\""));
    assert!(rejects!(vm::SiegeMachineKind, "\"katapulta\""));
    assert!(rejects!(vm::BattleSide, "\"neutral\""));
    assert!(rejects!(vm::FortKind, "\"stone\""));
    assert!(rejects!(vm::TowerMaterial, "\"zelazo\""));
    assert!(rejects!(vm::FogState, "3"));
    // Case matters: no lenient matching.
    assert!(rejects!(vm::Terrain, "\"Laka\""));
    // Known values still parse (the test above is not vacuous).
    assert!(serde_json::from_str::<vm::WallKind>("\"stone\"").is_ok());
    assert!(serde_json::from_str::<vm::FortKind>("\"mur\"").is_ok());
}

/// `riverPathKinds[i]` missing stays `None` (the renderer's own "treated as
/// `'main'`" rule), it is not turned into `Some(Main)` by the adapter.
#[test]
fn missing_river_kind_stays_none() {
    let kinds: [Option<vm::RiverKind>; 2] = [None, Some(vm::RiverKind::Short)];
    let mapped: Vec<Option<RiverKind>> = kinds.iter().map(|k| k.map(view::river_kind)).collect();
    assert_eq!(mapped, [None, Some(RiverKind::Short)]);
}

// ------------------------------------------------------------ fog

/// A `w × h` map, `r`-major, all meadow.
fn map(w: u32, h: u32) -> vm::MapViewDto {
    let mut hexes = Vec::new();
    for r in 0..i32::try_from(h).unwrap() {
        for q in 0..i32::try_from(w).unwrap() {
            hexes.push(vm::HexStaticDto {
                coord: vm::HexCoord::new(q, r),
                teren_bazowy: vm::Terrain::Laka,
                rzeka_krawedzie: Vec::new(),
            });
        }
    }
    vm::MapViewDto {
        width: w,
        height: h,
        seed: 0.0,
        hexes,
        rivers: Vec::new(),
        river_render_paths: Vec::new(),
    }
}

fn fog(codes: &[u8]) -> vm::FogViewDto {
    vm::FogViewDto {
        state: codes
            .iter()
            .map(|&c| vm::FogState::from_code(c).unwrap())
            .collect(),
    }
}

fn picks(v: &[(i32, i32)]) -> HashSet<PickHex> {
    v.iter().map(|&(q, r)| PickHex::new(q, r)).collect()
}

#[test]
fn fog_active_builds_three_sets_and_prism_hidden() {
    // (0,0) unexplored, (1,0) explored, (0,1) visible, (1,1) visible,
    // (0,2) unexplored, (1,2) explored.
    let m = map(2, 3);
    let f = fog(&[0, 1, 2, 2, 0, 1]);
    let s = FogSets::from_dto(&m, &f, true).unwrap();
    assert!(s.fog_on);
    assert_eq!(s.visible, picks(&[(0, 1), (1, 1)]));
    // Explored includes the visible hexes (pin `addExplored(…, vis)`).
    assert_eq!(s.explored, picks(&[(1, 0), (0, 1), (1, 1), (1, 2)]));
    assert_eq!(
        s.visible_keys,
        ["0,1", "1,1"].iter().map(|k| (*k).to_owned()).collect()
    );
    assert_eq!(s.visible_hex_keys, [(0, 1), (1, 1)].into_iter().collect());
    assert_eq!(
        s.explored_hex_keys,
        [(1, 0), (0, 1), (1, 1), (1, 2)].into_iter().collect()
    );
    assert_eq!(s.prism_hidden, vec![true, false, false, false, true, false]);
}

#[test]
fn fog_off_is_all_keys() {
    let m = map(2, 2);
    let f = fog(&[0, 0, 1, 2]);
    let s = FogSets::from_dto(&m, &f, false).unwrap();
    assert!(!s.fog_on);
    let all = picks(&[(0, 0), (1, 0), (0, 1), (1, 1)]);
    assert_eq!(s.visible, all);
    assert_eq!(s.explored, all);
    assert_eq!(s.visible_keys.len(), 4);
    assert_eq!(s.visible_hex_keys.len(), 4);
    assert_eq!(s.explored_hex_keys.len(), 4);
    assert_eq!(s.prism_hidden, vec![false; 4]);
}

#[test]
fn fog_length_mismatch_is_an_error() {
    let m = map(2, 2);
    let f = fog(&[2, 2, 2]);
    assert_eq!(
        FogSets::from_dto(&m, &f, true),
        Err(ViewAdapterError::LengthMismatch {
            field: "fog.state",
            expected: 4,
            actual: 3
        })
    );
}

#[test]
fn fog_all_unexplored_hides_every_prism() {
    let m = map(3, 1);
    let s = FogSets::from_dto(&m, &fog(&[0, 0, 0]), true).unwrap();
    assert!(s.visible.is_empty() && s.explored.is_empty());
    assert!(s.visible_keys.is_empty() && s.explored_hex_keys.is_empty());
    assert_eq!(s.prism_hidden, vec![true; 3]);
}
