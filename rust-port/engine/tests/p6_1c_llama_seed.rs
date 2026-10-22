//! P6.1C - `inca-llama-seed.ts` z wektorami z URUCHOMIONEGO weba (`tests/p6_1c_vectors/llama.json`,
//! `maps.json`; generator `gen-p61c-vectors.mjs`). Mapy: prawdziwy `generateMap`; `hashPos`:
//! linie 21-29 pliku weba wyciete werbatim. Liczby zmiennoprzecinkowe czytane z tekstu `hText`
//! (serde_json bez `float_roundtrip` myli sie o 1 ulp).

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::start_position::{
    hash_pos, hex_keys_within_radius, seed_inca_llama_deposits, Overlay, StartMapHex,
};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

const MAPS: &str = include_str!("p6_1c_vectors/maps.json");
const LLAMA: &str = include_str!("p6_1c_vectors/llama.json");

fn terrain(web: &str) -> Terrain {
    match web {
        "laka" => Terrain::Grassland,
        "rownina" => Terrain::Plains,
        "wzgorza" => Terrain::Hills,
        "gory" => Terrain::Mountains,
        "plytkie_morze" => Terrain::ShallowSea,
        "morze" => Terrain::Sea,
        "pustynia" => Terrain::Desert,
        "polarny" => Terrain::Polar,
        other => panic!("nieznany teren weba {other}"),
    }
}

fn coord(q: &Value, r: &Value) -> HexCoord {
    HexCoord::new(
        i32::try_from(q.as_i64().expect("q")).expect("q i32"),
        i32::try_from(r.as_i64().expect("r")).expect("r i32"),
    )
}

fn hex(value: &Value) -> HexCoord {
    coord(&value["q"], &value["r"])
}

fn base_map(maps: &Value, map_id: &str) -> BTreeMap<HexCoord, StartMapHex> {
    maps["maps"][map_id]["hexes"]
        .as_array()
        .expect("hexes")
        .iter()
        .map(|row| {
            (
                coord(&row[0], &row[1]),
                StartMapHex {
                    terrain: terrain(row[2].as_str().expect("teren")),
                    overlay: Overlay::from_web_value(row[3].as_str().expect("nakladka"))
                        .expect("nakladka weba"),
                    runtime_deposit: row[4].as_str().map(str::to_owned),
                },
            )
        })
        .collect()
}

#[test]
fn hash_pos_matches_web_hash_pos_verbatim() {
    let llama: Value = serde_json::from_str(LLAMA).expect("llama vectors parse");
    let rows = llama["hash"].as_array().expect("hash");
    assert_eq!(rows.len(), 210);
    for row in rows {
        let seed = u32::try_from(row["seed"].as_u64().expect("seed")).expect("seed u32");
        let q = i32::try_from(row["q"].as_i64().expect("q")).expect("q");
        let r = i32::try_from(row["r"].as_i64().expect("r")).expect("r");
        let expected: f64 = row["hText"].as_str().expect("hText").parse().expect("f64");
        let got = hash_pos(seed, q, r);
        assert_eq!(
            got.to_bits(),
            expected.to_bits(),
            "hash seed={seed} q={q} r={r}"
        );
        assert!((0.0..1.0).contains(&got));
    }
}

#[test]
fn seed_inca_llama_deposits_matches_web_for_all_cases() {
    let maps: Value = serde_json::from_str(MAPS).expect("maps parse");
    let llama: Value = serde_json::from_str(LLAMA).expect("llama vectors parse");
    let cases = llama["cases"].as_array().expect("cases");
    assert_eq!(cases.len(), 912);
    let mut bases: BTreeMap<String, BTreeMap<HexCoord, StartMapHex>> = BTreeMap::new();
    let mut seeded_cases = 0;
    let mut zloze_blocked_cases = 0;
    let mut avoid_cases = 0;
    for case in cases {
        let label = case["label"].as_str().expect("label");
        let map_id = case["map"].as_str().expect("map").to_owned();
        let mut map = bases
            .entry(map_id.clone())
            .or_insert_with(|| base_map(&maps, &map_id))
            .clone();
        let zloze = case["zloze"].as_array().expect("zloze");
        for entry in zloze {
            let key = coord(&entry[0], &entry[1]);
            map.get_mut(&key).expect("zloze hex").runtime_deposit =
                Some(entry[2].as_str().expect("zloze").to_owned());
        }
        let starts: Vec<HexCoord> = case["starts"]
            .as_array()
            .expect("starts")
            .iter()
            .map(hex)
            .collect();
        let avoid: BTreeSet<HexCoord> = case["avoid"]
            .as_array()
            .expect("avoid")
            .iter()
            .map(|key| {
                let (q, r) = key.as_str().expect("klucz").split_once(',').expect("q,r");
                HexCoord::new(q.parse().expect("q"), r.parse().expect("r"))
            })
            .collect();
        let per_start = case["perStart"]
            .as_u64()
            .map(|v| u32::try_from(v).expect("u32"));
        let radius = case["radius"]
            .as_u64()
            .map(|v| u32::try_from(v).expect("u32"));
        let seed = u32::try_from(case["seed"].as_u64().expect("seed")).expect("seed u32");
        let before = map.clone();

        let seeded = seed_inca_llama_deposits(&mut map, seed, &starts, &avoid, per_start, radius);

        assert_eq!(
            seeded as u64,
            case["seeded"].as_u64().expect("seeded"),
            "{label}: liczba posianych"
        );
        let mut changed: Vec<(HexCoord, &'static str, &'static str)> = map
            .iter()
            .filter(|(key, hex)| hex.overlay != before[key].overlay)
            .map(|(key, hex)| {
                (
                    *key,
                    before[key].overlay.web_value(),
                    hex.overlay.web_value(),
                )
            })
            .collect();
        changed.sort();
        let mut expected: Vec<(HexCoord, String, String)> = case["changed"]
            .as_array()
            .expect("changed")
            .iter()
            .map(|row| {
                (
                    coord(&row[0], &row[1]),
                    row[2].as_str().expect("przed").to_owned(),
                    row[3].as_str().expect("po").to_owned(),
                )
            })
            .collect();
        expected.sort();
        let changed_owned: Vec<(HexCoord, String, String)> = changed
            .into_iter()
            .map(|(key, from, to)| (key, from.to_owned(), to.to_owned()))
            .collect();
        assert_eq!(changed_owned, expected, "{label}: zmienione heksy");
        // nic poza nakladka sie nie zmienia
        for (key, hex) in &map {
            assert_eq!(hex.terrain, before[key].terrain, "{label}: teren");
            assert_eq!(
                hex.runtime_deposit, before[key].runtime_deposit,
                "{label}: zloze"
            );
        }
        if seeded > 0 {
            seeded_cases += 1;
            if !zloze.is_empty() {
                zloze_blocked_cases += 1;
            }
            if !avoid.is_empty() {
                avoid_cases += 1;
            }
        }
    }
    assert!(
        seeded_cases > 100,
        "za malo przypadkow z posiewem: {seeded_cases}"
    );
    assert!(
        zloze_blocked_cases > 0,
        "brak przypadku ze zlozem runtime przy posiewie"
    );
    assert!(avoid_cases > 0, "brak przypadku z avoid przy posiewie");
}

#[test]
fn hex_keys_within_radius_matches_web_loop_order() {
    // okolica.ts:66 - kolejnosc: dq (zewnetrzna) rosnaco, dr (wewnetrzna) rosnaco; tylko heksy mapy.
    let mut map = BTreeMap::new();
    for q in -2..=2 {
        for r in -2..=2 {
            map.insert(
                HexCoord::new(q, r),
                StartMapHex {
                    terrain: Terrain::Hills,
                    overlay: Overlay::Brak,
                    runtime_deposit: None,
                },
            );
        }
    }
    map.remove(&HexCoord::new(1, 0));
    let got = hex_keys_within_radius(HexCoord::new(0, 0), 1, &map);
    assert_eq!(
        got,
        vec![
            HexCoord::new(-1, 0),
            HexCoord::new(-1, 1),
            HexCoord::new(0, -1),
            HexCoord::new(0, 0),
            HexCoord::new(0, 1),
            HexCoord::new(1, -1),
        ]
    );
    assert_eq!(
        hex_keys_within_radius(HexCoord::new(0, 0), 0, &map),
        vec![HexCoord::new(0, 0)]
    );
}
