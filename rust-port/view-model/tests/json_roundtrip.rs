//! Criterion 1: every type of contract §3 survives a JSON round-trip
//! (`to_string` → `from_str` and `to_value` → `from_value`) unchanged.

mod common;

use civ_view_model::*;
use common::*;
use serde::de::DeserializeOwned;
use serde::Serialize;
use std::fmt::Debug;

/// Round-trips `value` through JSON text and through `serde_json::Value`;
/// both must give back an equal value, and re-serializing must give the same
/// text (stable output).
fn rt<T: Serialize + DeserializeOwned + PartialEq + Debug>(value: &T) {
    let text = serde_json::to_string(value).expect("serialize");
    let back: T = serde_json::from_str(&text).expect("deserialize text");
    assert_eq!(&back, value, "text round-trip of {text}");
    assert_eq!(serde_json::to_string(&back).expect("re-serialize"), text);
    let tree = serde_json::to_value(value).expect("to_value");
    let back2: T = serde_json::from_value(tree).expect("from_value");
    assert_eq!(&back2, value, "value round-trip of {text}");
}

#[test]
fn ids_and_coords() {
    rt(&h(0, 0));
    rt(&h(-3, 7));
    rt(&h(i32::MIN, i32::MAX));
    for v in [0, 1, 42, MAX_SAFE_ID] {
        rt(&PlayerId::try_new(v).unwrap());
        rt(&CityId::try_new(v).unwrap());
        rt(&UnitId::try_new(v).unwrap());
    }
    rt(&OwnerRef::Rebel);
    rt(&OwnerRef::Barbarian);
    rt(&player(0));
    rt(&player(MAX_SAFE_ID));
}

#[test]
fn map_enums_all_variants() {
    for t in [
        Terrain::Laka,
        Terrain::Rownina,
        Terrain::Wzgorza,
        Terrain::Gory,
        Terrain::PlytkieMorze,
        Terrain::Morze,
        Terrain::Pustynia,
        Terrain::Polarny,
    ] {
        rt(&t);
    }
    for n in [
        Nakladka::Brak,
        Nakladka::Las,
        Nakladka::ZlozeGliny,
        Nakladka::ZlozeRudy,
        Nakladka::ZlozeKonia,
        Nakladka::ZlozeOwiec,
        Nakladka::ZlozeBydla,
        Nakladka::ZlozeLamy,
    ] {
        rt(&n);
    }
    for u in [
        Ulepszenie::Brak,
        Ulepszenie::Farma,
        Ulepszenie::Irygacja,
        Ulepszenie::Kopalnia,
        Ulepszenie::Droga,
        Ulepszenie::DrogaBrukowana,
        Ulepszenie::Pastwisko,
        Ulepszenie::Tartak,
    ] {
        rt(&u);
    }
    for k in [
        RiverKind::Main,
        RiverKind::Medium,
        RiverKind::Short,
        RiverKind::Tributary,
    ] {
        rt(&k);
    }
    for f in [FogState::Unexplored, FogState::Explored, FogState::Visible] {
        rt(&f);
    }
}

#[test]
fn map_structs() {
    let map = sample_map();
    for hex in &map.hexes {
        rt(hex);
    }
    for river in &map.rivers {
        rt(river);
    }
    rt(&map);
    rt(&sample_hex_dyn_full());
    rt(&sample_hex_dyn_none());
    rt(&sample_view().fog);
    rt(&FogViewDto { state: vec![] });
}

#[test]
fn owner_and_city_enums_all_variants() {
    for k in [
        MapOutlineKind::Player,
        MapOutlineKind::War,
        MapOutlineKind::Neutral,
        MapOutlineKind::Ally,
    ] {
        rt(&k);
    }
    for r in [
        RelationToViewer::Own,
        RelationToViewer::Wojna,
        RelationToViewer::Pokoj,
        RelationToViewer::Sojusz,
        RelationToViewer::Neutralni,
    ] {
        rt(&r);
    }
    for w in [WallKind::None, WallKind::Palisada, WallKind::Stone] {
        rt(&w);
    }
    for p in [ProductionKind::Budynek, ProductionKind::Jednostka] {
        rt(&p);
    }
}

#[test]
fn owner_and_city_structs() {
    rt(&sample_view().viewer);
    rt(&sample_owner_full());
    rt(&sample_owner_none());
    rt(&sample_badge_full());
    rt(&sample_badge_none());
    rt(&sample_city());
}

#[test]
fn unit_structs() {
    rt(&sample_unit_full());
    rt(&sample_unit_none());
    rt(&sample_vitals());
    rt(&sample_stacks());
}

#[test]
fn overlay_types() {
    for m in [SiegeMachineKind::Taran, SiegeMachineKind::Wieza] {
        rt(&m);
    }
    for m in [TradeMedium::Lad, TradeMedium::Morze] {
        rt(&m);
    }
    for k in [
        BuildHighlightKind::FoundCity,
        BuildHighlightKind::Wonder,
        BuildHighlightKind::Improvement,
        BuildHighlightKind::Mine,
    ] {
        rt(&k);
    }
    rt(&sample_siege());
    rt(&sample_siege().camp_hexes[2]);
    rt(&sample_path_route());
    rt(&sample_path_route().turn_stops[0]);
    rt(&sample_wonder());
    rt(&sample_owner_hexes());
    rt(&sample_territory());
    rt(&sample_trade_route());
    rt(&sample_yield_full());
    rt(&TileYieldDto {
        zywnosc: None,
        praca: Some(1.0),
        handel: None,
    });
    rt(&sample_okolica());
    rt(&sample_overlays_full().worker_fields[0]);
    rt(&sample_overlays_full().build_highlight);
    rt(&sample_overlays_full().selection.unwrap());
    rt(&sample_overlays_full());
    rt(&sample_overlays_none());
}

#[test]
fn battle_types() {
    for s in [BattleSide::Atk, BattleSide::Def] {
        rt(&s);
    }
    for k in [FortKind::None, FortKind::Palisada, FortKind::Mur] {
        rt(&k);
    }
    for m in [TowerMaterial::Drewno, TowerMaterial::Kamien] {
        rt(&m);
    }
    let battle = sample_battle();
    rt(&battle.setup.grid);
    rt(&battle.setup.fort);
    rt(&sample_spawn(Some(2.0)));
    rt(&sample_spawn(None));
    rt(&battle.setup);
    rt(&battle);
}

#[test]
fn root_full_and_minimal() {
    rt(&sample_view());
    rt(&sample_view_minimal());
}

#[test]
fn root_split_join_is_lossless() {
    let view = sample_view();
    let (map, layers) = view.clone().split();
    rt(&map);
    rt(&layers);
    assert_eq!(RenderViewDto::join(map, layers), view);
}

/// The dynamic layers serialize to exactly the full snapshot without the
/// `map` key (D-DTO-3 = B: same keys, same values).
#[test]
fn layers_json_is_view_json_without_map() {
    let view = sample_view();
    let mut full = serde_json::to_value(&view).unwrap();
    let (map, layers) = view.split();
    let removed = full.as_object_mut().unwrap().remove("map").unwrap();
    assert_eq!(removed, serde_json::to_value(&map).unwrap());
    assert_eq!(full, serde_json::to_value(&layers).unwrap());
}

/// Floats that are not short decimals survive exactly (the webview parses
/// with `JSON.parse`, which is exact; the tests use serde_json
/// `float_roundtrip` for the same guarantee). `-0.0` keeps its sign.
#[test]
fn awkward_floats_round_trip_bit_exact() {
    for v in [
        0.1 + 0.2,
        1.0 / 3.0,
        f64::MIN_POSITIVE,
        f64::MAX,
        -0.0,
        123_456_789.123_456_78,
        9_007_199_254_740_993.0,
    ] {
        let mut u = sample_unit_full();
        u.hp = v;
        let back: UnitViewDto = serde_json::from_str(&serde_json::to_string(&u).unwrap()).unwrap();
        assert_eq!(back.hp.to_bits(), v.to_bits(), "{v:?}");
    }
}

/// A synthetic map of each measured size round-trips too.
#[test]
fn synthetic_snapshots_round_trip() {
    for s in &SCENARIOS {
        let view = synthetic_view(s);
        assert_eq!(view.map.hexes.len(), s.hexes() as usize, "{}", s.name);
        view.validate().expect("synthetic snapshot is valid");
        rt(&view);
    }
}
