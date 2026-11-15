//! R-RUSTPORT-P4-1B-Q3-MAP-VIEW: wektory pinu `07d2fbd72` dla producenta `MapViewDto` /
//! `HexDynDto` (`civ_engine::domain::map_view`).
//!
//! - Wektory: `p4_1b_map_view_vectors/vectors.json`, generator `gen.mjs` WYKONUJE kod pinu
//!   (`mapSnapshot.ts`, `road-network.ts` w calosci; fragmenty `scene.ts`, `gen-helpers.ts`,
//!   `terrain-improvements.ts`, `road-movement.ts`, `main.ts`, `picker.ts`, `types/hex.ts` ze
//!   straznikami SHA-256). Wejscie = snapshot zapisu (`serializeMapForSave`), wynik liczony na mapie
//!   odtworzonej `buildGameMapFromSnapshot` — Rust robi to samo (`build_game_map_from_snapshot`).
//! - Porownanie bajt w bajt po serializacji DTO: oczekiwany JSON weba -> `MapViewDto` /
//!   `Vec<HexDynDto>` (`deny_unknown_fields`) -> `serde_json::to_string`, to samo dla wyniku Rust.
//! - Test negatywny: przetasowana kolejnosc `SnapshotMap.hexes` -> IDENTYCZNY DTO; dlugosci
//!   `riverRenderPaths` != `rivers` -> blad `validate_map`.
//! - Mutacje (kazda musi rozjechac sie z wektorami): brak trimu dla `medium`, `None` traktowane
//!   jako nie-`main`, maska drog z filtrem mgly, brak sortowania heksow.
//! - Pokrycie liczone w tescie (nie deklarowane w JSON).

use std::collections::HashMap;

use civ_engine::domain::map_snapshot::{
    build_game_map_from_snapshot, SerializedMapData, SnapshotHex, SnapshotMap,
};
use civ_engine::domain::map_view::{
    build_hex_dyn, build_map_view, build_rivers, river_hex_record, river_render_paths,
    road_hex_keys, sorted_hexes, MapViewError,
};
use civ_engine::domain::mapgen::rivers_a::render_trim::trim_medium_render_path_at_main;
use civ_engine::domain::mapgen::rivers_a::{medium_river_render_path, RiverCoord};
use civ_engine::domain::road_network::compute_road_mask;
use civ_view_model::{validate_map, HexCoord, HexDynDto, MapViewDto, RiverKind, ViewError};
use serde_json::Value;

const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
const GEN: &str = include_str!("p4_1b_map_view_vectors/gen.mjs");

struct Case {
    name: String,
    map: SnapshotMap,
    cities: Vec<HexCoord>,
    /// Kolejnosc kluczy snapshotu (web `Object.keys`), przed odtworzeniem.
    snapshot_rq: Vec<(i32, i32)>,
    expected_view: MapViewDto,
    expected_dyn: Vec<HexDynDto>,
}

fn load() -> (Value, Vec<Case>) {
    let root: Value = serde_json::from_str(include_str!("p4_1b_map_view_vectors/vectors.json"))
        .expect("vectors.json");
    let cases = root["maps"]
        .as_array()
        .expect("maps")
        .iter()
        .map(|m| {
            let snap: SerializedMapData =
                serde_json::from_value(m["snapshot"].clone()).expect("snapshot");
            let snapshot_rq = snap.q.iter().copied().zip(snap.r.iter().copied()).collect();
            let map = build_game_map_from_snapshot(&snap).expect("rebuild");
            let cities = serde_json::from_value(m["cities"].clone()).expect("cities");
            Case {
                name: m["name"].as_str().expect("name").to_string(),
                map,
                cities,
                snapshot_rq,
                expected_view: serde_json::from_value(m["mapView"].clone()).expect("mapView"),
                expected_dyn: serde_json::from_value(m["hexState"].clone()).expect("hexState"),
            }
        })
        .collect();
    (root, cases)
}

fn ser<T: serde::Serialize>(v: &T) -> String {
    serde_json::to_string(v).expect("serializacja DTO")
}

fn view(c: &Case) -> MapViewDto {
    build_map_view(&c.map).unwrap_or_else(|e| panic!("{}: {e}", c.name))
}

fn dyn_state(c: &Case) -> Vec<HexDynDto> {
    build_hex_dyn(&c.map, &c.cities).unwrap_or_else(|e| panic!("{}: {e}", c.name))
}

fn coords(path: &[RiverCoord]) -> Vec<HexCoord> {
    path.iter()
        .map(|c| HexCoord::new(c.q as i32, c.r as i32))
        .collect()
}

fn river(path: &[HexCoord]) -> Vec<RiverCoord> {
    path.iter()
        .map(|c| RiverCoord::new(i64::from(c.q), i64::from(c.r)))
        .collect()
}

#[test]
fn naglowek_pinu_i_straznik_sha() {
    let (root, cases) = load();
    assert_eq!(root["pin"], PIN);
    let excerpts = root["excerpts"].as_array().expect("excerpts");
    assert_eq!(excerpts.len(), 30, "liczba fragmentow pinu");
    for e in excerpts
        .iter()
        .chain(root["files"].as_array().expect("files"))
    {
        let sha = e["sha256"].as_str().expect("sha256");
        assert_eq!(sha.len(), 64);
        // Skrot zapisany w wektorach = straznik w generatorze (ta sama wartosc w `gen.mjs`).
        assert!(GEN.contains(sha), "brak skrotu {sha} w gen.mjs");
    }
    assert_eq!(cases.len(), 6);
}

#[test]
fn map_view_bajt_w_bajt_z_pinem() {
    let (_, cases) = load();
    for c in &cases {
        let got = view(c);
        assert_eq!(ser(&got), ser(&c.expected_view), "{}: MapViewDto", c.name);
        validate_map(&got).unwrap_or_else(|e| panic!("{}: validate_map: {e}", c.name));
        assert_eq!(got.river_render_paths.len(), got.rivers.len());
    }
}

#[test]
fn hex_dyn_bajt_w_bajt_z_pinem() {
    let (_, cases) = load();
    for c in &cases {
        let got = dyn_state(c);
        assert_eq!(
            got.len(),
            c.expected_view.hexes.len(),
            "{}: hexState",
            c.name
        );
        for (i, (g, e)) in got.iter().zip(&c.expected_dyn).enumerate() {
            assert_eq!(ser(g), ser(e), "{}: hexState[{i}]", c.name);
        }
        assert_eq!(ser(&got), ser(&c.expected_dyn), "{}: hexState", c.name);
    }
}

/// Deterministyczne permutacje `SnapshotMap.hexes`: odwrocenie, przesuniecie, przeplot.
fn permutations(hexes: &[(String, SnapshotHex)]) -> Vec<Vec<(String, SnapshotHex)>> {
    let n = hexes.len();
    let mut rev = hexes.to_vec();
    rev.reverse();
    let mut rot = hexes.to_vec();
    rot.rotate_left(n / 3);
    let mut weave: Vec<(String, SnapshotHex)> = hexes.iter().step_by(2).cloned().collect();
    weave.extend(hexes.iter().skip(1).step_by(2).cloned());
    // Kolejnosc `q`-major (najgorszy przypadek dla porzadku r-major).
    let mut q_major = hexes.to_vec();
    q_major.sort_by_key(|(_, h)| (h.coords.q, h.coords.r));
    vec![rev, rot, weave, q_major]
}

#[test]
fn przetasowane_hexes_daja_identyczny_dto() {
    let (_, cases) = load();
    let mut checked = 0;
    for c in &cases {
        let base_view = ser(&view(c));
        let base_dyn = ser(&dyn_state(c));
        for perm in permutations(&c.map.hexes) {
            let mut m = c.map.clone();
            m.hexes = perm;
            assert_eq!(
                ser(&build_map_view(&m).expect("view")),
                base_view,
                "{}: MapViewDto zalezy od kolejnosci hexes",
                c.name
            );
            assert_eq!(
                ser(&build_hex_dyn(&m, &c.cities).expect("dyn")),
                base_dyn,
                "{}: HexDynDto zalezy od kolejnosci hexes",
                c.name
            );
            checked += 1;
        }
    }
    assert_eq!(checked, 24);
}

#[test]
fn walidacja_dlugosci_render_paths() {
    let (_, cases) = load();
    let c = cases
        .iter()
        .find(|c| c.name == "duza_tasowana")
        .expect("mapa");
    let good = view(c);
    let n = good.rivers.len();
    assert!(n > 0);
    let mut short = good.clone();
    short.river_render_paths.pop();
    assert_eq!(
        validate_map(&short),
        Err(ViewError::LengthMismatch {
            field: "map.riverRenderPaths".into(),
            expected: n,
            actual: n - 1,
        })
    );
    let mut long = good;
    long.river_render_paths.push(vec![]);
    assert_eq!(
        validate_map(&long),
        Err(ViewError::LengthMismatch {
            field: "map.riverRenderPaths".into(),
            expected: n,
            actual: n + 1,
        })
    );
}

#[test]
fn bledy_wartosci_bez_reprezentacji_w_dto() {
    let (_, cases) = load();
    let c = &cases[0];
    let mut m = c.map.clone();
    m.hexes[3].1.teren_bazowy = "wybrzeze".into();
    let key = m.hexes[3].0.clone();
    assert_eq!(
        build_map_view(&m),
        Err(MapViewError::UnknownTerrain {
            hex: key,
            value: "wybrzeze".into()
        })
    );
    let mut m = c.map.clone();
    m.river_path_kinds = Some(vec!["main".into(), "rzeczka".into()]);
    assert_eq!(
        build_map_view(&m),
        Err(MapViewError::UnknownRiverKind {
            index: 1,
            value: "rzeczka".into()
        })
    );
    let mut m = c.map.clone();
    m.szerokosc_q = 10.5;
    assert!(matches!(
        build_map_view(&m),
        Err(MapViewError::Dimension {
            field: "szerokoscQ",
            ..
        })
    ));
    let mut m = c.map.clone();
    m.hexes[0].1.nakladka = "dzungla".into();
    assert!(matches!(
        build_hex_dyn(&m, &[]),
        Err(MapViewError::UnknownNakladka { .. })
    ));
    let mut m = c.map.clone();
    m.hexes[0].1.ulepszenie = "tarasy".into();
    assert!(matches!(
        build_hex_dyn(&m, &[]),
        Err(MapViewError::UnknownUlepszenie { .. })
    ));
    let mut m = c.map.clone();
    m.hexes[0].1.rzeka.krawedzie = vec![256];
    assert!(matches!(
        build_map_view(&m),
        Err(MapViewError::RiverEdge { value: 256, .. })
    ));
}

/// Liczniki pokrycia (z wektorow i z wywolan funkcji Rust, nie z deklaracji w JSON).
#[test]
fn pokrycie_wektorow() {
    let (_, cases) = load();
    let mut sizes = std::collections::BTreeSet::new();
    let mut kinds: HashMap<&'static str, usize> = HashMap::new();
    let (mut trimmed, mut render_differs, mut shuffled_maps, mut no_kinds_maps) = (0, 0, 0, 0);
    let (mut village_by_city, mut villages, mut terraces, mut covering) = (0, 0, 0, 0);
    let (mut masks_nonzero, mut masks_on_edge, mut short_kinds_maps) = (0, 0, 0);
    for c in &cases {
        sizes.insert((c.expected_view.width, c.expected_view.height));
        let r_major = c
            .snapshot_rq
            .windows(2)
            .all(|w| (w[0].1, w[0].0) < (w[1].1, w[1].0));
        if !r_major {
            shuffled_maps += 1;
        }
        match &c.map.river_path_kinds {
            None => no_kinds_maps += 1,
            Some(k) if k.len() < c.map.river_paths.len() => short_kinds_maps += 1,
            Some(_) => {}
        }
        let mains: Vec<Vec<RiverCoord>> = c
            .expected_view
            .rivers
            .iter()
            .filter(|r| r.kind.unwrap_or(RiverKind::Main) == RiverKind::Main)
            .map(|r| river(&r.hexes))
            .collect();
        for (r, rp) in c
            .expected_view
            .rivers
            .iter()
            .zip(&c.expected_view.river_render_paths)
        {
            let key = match r.kind {
                None => "none",
                Some(RiverKind::Main) => "main",
                Some(RiverKind::Medium) => "medium",
                Some(RiverKind::Short) => "short",
                Some(RiverKind::Tributary) => "tributary",
            };
            *kinds.entry(key).or_default() += 1;
            if r.kind == Some(RiverKind::Medium)
                && trim_medium_render_path_at_main(&river(&r.hexes), &mains).len() < r.hexes.len()
            {
                trimmed += 1;
            }
            if rp != &r.hexes {
                render_differs += 1;
            }
        }
        let w = i32::try_from(c.expected_view.width).expect("w");
        let h = i32::try_from(c.expected_view.height).expect("h");
        for (hs, d) in c.expected_view.hexes.iter().zip(&c.expected_dyn) {
            let wioska = sorted_hexes(&c.map)
                .into_iter()
                .find(|(_, x)| x.coords.q == hs.coord.q && x.coords.r == hs.coord.r)
                .map(|(_, x)| x.wioska.istnieje)
                .expect("heks");
            if wioska {
                villages += 1;
                if !d.village_present {
                    village_by_city += 1;
                }
            }
            terraces += usize::from(d.terraces);
            covering += usize::from(d.covering_improvement);
            if d.road_mask != 0 {
                masks_nonzero += 1;
                let edge = hs.coord.q == 0
                    || hs.coord.r == 0
                    || hs.coord.q == w - 1
                    || hs.coord.r == h - 1;
                masks_on_edge += usize::from(edge);
            }
        }
    }
    assert!(sizes.len() >= 3, "rozmiary map: {sizes:?}");
    for k in ["main", "medium", "short", "tributary", "none"] {
        assert!(
            kinds.get(k).copied().unwrap_or(0) >= 3,
            "rodzaj {k}: {kinds:?}"
        );
    }
    assert!(no_kinds_maps >= 1 && short_kinds_maps >= 1);
    assert!(
        shuffled_maps >= 3,
        "mapy z kolejnoscia kluczy != r-major: {shuffled_maps}"
    );
    assert!(trimmed >= 10, "srednie przyciete przez trim: {trimmed}");
    assert!(
        render_differs >= 30,
        "trasy renderu rozne od surowych: {render_differs}"
    );
    assert!(
        villages >= 20 && village_by_city >= 5,
        "wioski {villages}, zastapione {village_by_city}"
    );
    assert!(
        terraces >= 10 && covering >= 100,
        "tarasy {terraces}, covering {covering}"
    );
    assert!(
        masks_nonzero >= 300 && masks_on_edge >= 30,
        "maski {masks_nonzero}/{masks_on_edge}"
    );
}

// ---------------------------------------------------------------------------
// Mutacje: kazda musi rozjechac sie z wektorami pinu.
// ---------------------------------------------------------------------------

/// Mutacja 1: `medium` bez trimu (`mediumRiverRenderPath` na surowej trasie).
#[test]
fn mutacja_brak_trimu_dla_medium_daje_fail() {
    let (_, cases) = load();
    let mut diverged = 0;
    for c in &cases {
        let record = river_hex_record(&c.map).expect("record");
        let rivers = build_rivers(&c.map).expect("rivers");
        for (r, expected) in rivers.iter().zip(&c.expected_view.river_render_paths) {
            if r.kind != Some(RiverKind::Medium) {
                continue;
            }
            let mutant = coords(&medium_river_render_path(&record, &river(&r.hexes)));
            if &mutant != expected {
                diverged += 1;
            }
        }
    }
    assert!(diverged >= 5, "mutacja bez trimu nie wykryta: {diverged}");
}

/// Mutacja 2: `None` traktowane jako nie-`main`: (a) `short` — trasa znika z `mainPaths`, wiec
/// srednie nie sa przycinane; (b) `medium` — trasa idzie lancuchem sredniej.
#[test]
fn mutacja_none_jako_nie_main_daje_fail() {
    let (_, cases) = load();
    let (mut diverged_short, mut diverged_medium) = (0, 0);
    for c in &cases {
        let record = river_hex_record(&c.map).expect("record");
        let rivers = build_rivers(&c.map).expect("rivers");
        for (as_kind, diverged) in [
            (RiverKind::Short, &mut diverged_short),
            (RiverKind::Medium, &mut diverged_medium),
        ] {
            let kinds: Vec<Option<RiverKind>> = rivers
                .iter()
                .map(|r| Some(r.kind.unwrap_or(as_kind)))
                .collect();
            let mutant = river_render_paths(&record, &c.map.river_paths, &kinds).expect("paths");
            *diverged += mutant
                .iter()
                .zip(&c.expected_view.river_render_paths)
                .filter(|(m, e)| m != e)
                .count();
        }
        // Kontrola: produkcyjne rodzaje (z `None`) daja wynik pinu.
        let kinds: Vec<Option<RiverKind>> = rivers.iter().map(|r| r.kind).collect();
        assert_eq!(
            river_render_paths(&record, &c.map.river_paths, &kinds).expect("paths"),
            c.expected_view.river_render_paths,
            "{}",
            c.name
        );
    }
    assert!(
        diverged_short >= 3 && diverged_medium >= 3,
        "mutacja None != main nie wykryta: short {diverged_short}, medium {diverged_medium}"
    );
}

/// Mutacja 3: maska drog z filtrem mgly (sasiad liczy sie tylko, gdy gracz `0` go widzi).
/// Web (`main.ts:17083`, `:3144-3147`) czyta prawdziwy stan heksow bez mgly.
#[test]
fn mutacja_maska_z_filtrem_mgly_daje_fail() {
    let (_, cases) = load();
    let mut diverged = 0;
    for c in &cases {
        let roads = road_hex_keys(&c.map);
        let visible: std::collections::HashSet<String> = c
            .map
            .hexes
            .iter()
            .filter(|(_, h)| h.widocznosc.get("0") == Some("widoczny"))
            .map(|(k, _)| k.clone())
            .collect();
        for (hs, d) in c.expected_view.hexes.iter().zip(&c.expected_dyn) {
            let mutant = compute_road_mask(hs.coord.q, hs.coord.r, |q, r| {
                let k = format!("{q},{r}");
                roads.contains(k.as_str()) && visible.contains(&k)
            });
            if mutant != d.road_mask {
                diverged += 1;
            }
        }
    }
    assert!(
        diverged >= 50,
        "mutacja filtra mgly nie wykryta: {diverged}"
    );
}

/// Mutacja 4: heksy w kolejnosci wejscia (bez sortowania po `(r, q)`).
#[test]
fn mutacja_bez_sortowania_daje_fail() {
    let (_, cases) = load();
    let mut diverged = 0;
    for c in &cases {
        let unsorted: Vec<HexCoord> = c
            .map
            .hexes
            .iter()
            .map(|(_, h)| HexCoord::new(h.coords.q, h.coords.r))
            .collect();
        let expected: Vec<HexCoord> = c.expected_view.hexes.iter().map(|h| h.coord).collect();
        if unsorted != expected {
            diverged += 1;
            let mut v = view(c);
            for (dst, (_, h)) in v.hexes.iter_mut().zip(&c.map.hexes) {
                dst.coord = HexCoord::new(h.coords.q, h.coords.r);
            }
            assert!(
                matches!(validate_map(&v), Err(ViewError::HexOrder { .. })),
                "{}",
                c.name
            );
        }
    }
    assert!(
        diverged >= 3,
        "mutacja bez sortowania nie wykryta: {diverged}"
    );
}

/// Kontrola sasiada spoza mapy: heks brzegowy z droga po wszystkich stronach w mapie ma bity
/// tylko dla sasiadow istniejacych (web `hexHasRoadAt` = `false` dla braku klucza).
#[test]
fn sasiad_spoza_mapy_to_brak_drogi() {
    let (_, cases) = load();
    for c in &cases {
        let roads = road_hex_keys(&c.map);
        for hs in &c.expected_view.hexes {
            let m = compute_road_mask(hs.coord.q, hs.coord.r, |q, r| {
                roads.contains(format!("{q},{r}").as_str())
            });
            let in_map = |q: i32, r: i32| {
                q >= 0
                    && r >= 0
                    && (q as u32) < c.expected_view.width
                    && (r as u32) < c.expected_view.height
            };
            for (i, (dq, dr)) in civ_engine::domain::road_network::ROAD_DIRS
                .iter()
                .enumerate()
            {
                if !in_map(hs.coord.q + dq, hs.coord.r + dr) {
                    assert_eq!(m & (1 << i), 0, "{}: bit poza mapa", c.name);
                }
            }
        }
        // Producent: maska rowna wektorom tez dla heksa bez drogi (duch budowy).
        let dyn_state = dyn_state(c);
        assert!(dyn_state
            .iter()
            .zip(&c.expected_dyn)
            .all(|(a, b)| a.road_mask == b.road_mask));
    }
    // Jednoheksowa mapa: wszyscy sasiedzi poza mapa -> maska 0.
    let one = cases
        .iter()
        .find(|c| c.name == "jednoheksowa")
        .expect("1x1");
    assert_eq!(dyn_state(one)[0].road_mask, 0);
}
