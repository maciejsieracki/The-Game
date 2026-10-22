//! P6.M10 - masy ladu, progi, bramki lokalnego ladu i startu gracza, roster
//! (`clusters.ts:59-126, 145-167, 176-583`; pin web `edb8fb56`). Wektory z URUCHOMIONEGO weba
//! (`tests/p6_m10_vectors/web-vectors.json`); f64 porownywane bit-w-bit.

#[path = "p6_m10_vectors/common.rs"]
mod common;

use civ_engine::domain::hex::HexCoord;
use civ_engine::domain::map_generator::Terrain;
use civ_engine::domain::mapgen::cluster_mass::{
    aktywne_typy_from_size, allocate_typy_to_masses, create_mass_land_cache,
    development_space_radius, development_space_score, foreign_mass_frac_of_largest,
    foreign_mass_min_absolute, foreign_spawn_mass_threshold, group_habitable_masses,
    is_spawn_habitable_terrain, island_fallback_mass_frac, local_land_dominance_frac,
    local_land_dominance_radius, local_land_fraction, map_size_label, mass_land_cache_from_masses,
    mass_qualifies_for_foreign_spawn, mass_size_at_hex, mass_type_cap, min_development_hex_per_civ,
    min_mass_hexes_for_center, min_mass_hexes_for_spawn, passes_local_land_gate,
    passes_player_start_mass_gate, player_start_mass_min_absolute, player_start_min_mass_hexes,
    qualifying_mass_indices_for_spawn, qualifying_mass_threshold, region_mass_dominance,
    region_mass_dominance_frac, reorder_roster_by_preference, roster_klucze,
    roster_klucze_for_start_epoch, small_mass_cap_threshold, start_reveal_radius, ClusterCity,
    ClusterSpawnCache, MassesOrCache, SeaDist, TypeCluster,
};
use civ_engine::domain::mapgen::params::map_size_label_from_dims;
use civ_engine::domain::unit_epoch::CivEntryRow;
use common::*;
use serde_json::Value;

fn masses_from(v: &Value) -> Vec<Vec<HexCoord>> {
    v.as_array()
        .expect("lens")
        .iter()
        .map(|n| {
            (0..u(n))
                .map(|k| HexCoord::new(k as i32, 0))
                .collect::<Vec<_>>()
        })
        .collect()
}

#[test]
fn constants_match_web() {
    let c = &web()["cases"]["consts"];
    assert_eq!(
        min_mass_hexes_for_center(),
        i(&c["MIN_MASS_HEXES_FOR_CENTER"])
    );
    assert_eq!(
        min_mass_hexes_for_spawn(),
        i(&c["MIN_MASS_HEXES_FOR_SPAWN"])
    );
    assert_eq!(
        min_development_hex_per_civ(),
        i(&c["MIN_DEVELOPMENT_HEX_PER_CIV"])
    );
    assert_eq!(
        small_mass_cap_threshold(),
        i(&c["SMALL_MASS_CAP_THRESHOLD"])
    );
    assert_eq!(
        development_space_radius(),
        i(&c["DEVELOPMENT_SPACE_RADIUS"])
    );
    assert_f64(
        island_fallback_mass_frac(),
        fv(&c["ISLAND_FALLBACK_MASS_FRAC"]),
        "ISLAND",
    );
    assert_eq!(
        foreign_mass_min_absolute(),
        i(&c["FOREIGN_MASS_MIN_ABSOLUTE"])
    );
    assert_f64(
        foreign_mass_frac_of_largest(),
        fv(&c["FOREIGN_MASS_FRAC_OF_LARGEST"]),
        "FOREIGN_FRAC",
    );
    assert_f64(
        local_land_dominance_frac(),
        fv(&c["LOCAL_LAND_DOMINANCE_FRAC"]),
        "LOCAL_FRAC",
    );
    assert_f64(
        region_mass_dominance_frac(),
        fv(&c["REGION_MASS_DOMINANCE_FRAC"]),
        "REGION_FRAC",
    );
    assert_eq!(
        local_land_dominance_radius(),
        i(&c["LOCAL_LAND_DOMINANCE_RADIUS"])
    );
    assert_eq!(
        player_start_min_mass_hexes(),
        i(&c["PLAYER_START_MIN_MASS_HEXES"])
    );
    assert_eq!(
        player_start_mass_min_absolute(),
        i(&c["PLAYER_START_MASS_MIN_ABSOLUTE"])
    );
    assert_eq!(start_reveal_radius(), i(&c["START_REVEAL_RADIUS"]));
    let want: Vec<String> = c["ROSTER_KLUCZE"]
        .as_array()
        .expect("roster")
        .iter()
        .map(|v| s(v).to_string())
        .collect();
    assert_eq!(roster_klucze(), want);
}

#[test]
fn alias_constants_are_not_separate_numbers() {
    // REGION_MASS_DOMINANCE_FRAC (clusters.ts:242) to alias LOCAL_LAND_DOMINANCE_FRAC (:240);
    // SMALL_MASS_CAP_THRESHOLD (:224) pochodzi z MIN_DEVELOPMENT_HEX_PER_CIV (:222).
    assert_f64(
        region_mass_dominance_frac(),
        local_land_dominance_frac(),
        "alias",
    );
    assert_eq!(
        small_mass_cap_threshold() % min_development_hex_per_civ(),
        0,
        "prog malej masy jest wielokrotnoscia MIN_DEVELOPMENT_HEX_PER_CIV"
    );
}

#[test]
fn roster_for_start_epoch_matches_web() {
    let rows_all = cases("rosterKluczeForStartEpoch");
    assert!(rows_all.len() > 200);
    for c in rows_all {
        let epoch = if c["epoch"].is_null() {
            None
        } else {
            Some(s(&c["epoch"]))
        };
        let got = if c["rows"].is_null() {
            roster_klucze_for_start_epoch(None, epoch)
        } else {
            let rows = c["rows"].as_array().expect("rows");
            let legacy: Vec<Option<Vec<&str>>> = rows
                .iter()
                .map(|r| {
                    r.get("epokiStartowe")
                        .map(|a| a.as_array().expect("arr").iter().map(s).collect())
                })
                .collect();
            let built: Vec<CivEntryRow<'_>> = rows
                .iter()
                .zip(legacy.iter())
                .map(|(r, l)| CivEntryRow {
                    ikona_id: r.get("ikonaId").and_then(Value::as_str),
                    epoka_wejscia: r.get("epokaWejscia").and_then(Value::as_str),
                    epoki_startowe: l.as_deref(),
                })
                .collect();
            roster_klucze_for_start_epoch(Some(&built), epoch)
        };
        let want: Vec<String> = c["result"]
            .as_array()
            .expect("result")
            .iter()
            .map(|v| s(v).to_string())
            .collect();
        assert_eq!(got, want, "{} epoka {:?}", s(&c["rosterName"]), epoch);
    }
}

#[test]
fn reorder_roster_by_preference_matches_web() {
    for c in cases("reorderRosterByPreference") {
        let roster: Vec<String> = c["roster"]
            .as_array()
            .expect("roster")
            .iter()
            .map(|v| s(v).to_string())
            .collect();
        let preferred: Option<Vec<String>> = if c["preferred"].is_null() {
            None
        } else {
            Some(
                c["preferred"]
                    .as_array()
                    .expect("pref")
                    .iter()
                    .map(|v| s(v).to_string())
                    .collect(),
            )
        };
        let got = reorder_roster_by_preference(&roster, preferred.as_deref());
        let want: Vec<String> = c["result"]
            .as_array()
            .expect("result")
            .iter()
            .map(|v| s(v).to_string())
            .collect();
        assert_eq!(got, want, "roster {roster:?} preferred {preferred:?}");
    }
}

#[test]
fn map_size_label_matches_web_and_params_table() {
    for c in cases("mapSizeLabel") {
        let (w, h) = (i(&c["w"]), i(&c["h"]));
        let got = map_size_label(w, h);
        assert_eq!(got.key(), s(&c["label"]), "mapSizeLabel({w},{h})");
        // clusters.ts:152 i newGameMapDefaults.ts:61 maja te same progi (dowod, ze M02 wystarcza).
        assert_eq!(
            got,
            map_size_label_from_dims(w, h),
            "zgodnosc z params ({w},{h})"
        );
    }
    for c in cases("aktywneTypyFromSize") {
        let label = civ_engine::domain::mapgen::params::MapSizeLabel::from_key(s(&c["label"]))
            .expect("label");
        assert_eq!(
            aktywne_typy_from_size(label),
            i(&c["n"]),
            "{}",
            s(&c["label"])
        );
    }
}

#[test]
fn thresholds_and_caps_match_web() {
    let rows = cases("thresholds");
    assert!(rows.len() >= 700);
    for c in rows {
        let n = i(&c["n"]);
        assert_eq!(
            qualifying_mass_threshold(n),
            i(&c["qualifying"]),
            "qualifying({n})"
        );
        assert_eq!(
            foreign_spawn_mass_threshold(n),
            i(&c["foreign"]),
            "foreign({n})"
        );
        assert_eq!(mass_type_cap(n), i(&c["cap"]), "cap({n})");
    }
}

#[test]
fn mass_qualifies_and_indices_match_web() {
    for c in cases("massQualifies") {
        let masses = masses_from(&c["lens"]);
        assert_eq!(
            mass_qualifies_for_foreign_spawn(i(&c["size"]), &masses),
            c["result"].as_bool().expect("bool"),
            "lens {} size {}",
            c["lens"],
            c["size"]
        );
    }
    for c in cases("qualifyingIndices") {
        let masses = masses_from(&c["lens"]);
        let want: Vec<usize> = c["result"].as_array().expect("arr").iter().map(u).collect();
        assert_eq!(
            qualifying_mass_indices_for_spawn(&masses),
            want,
            "lens {}",
            c["lens"]
        );
    }
}

#[test]
fn allocate_typy_to_masses_matches_web() {
    let rows = cases("allocate");
    assert!(rows.len() > 1000);
    for c in rows {
        let masses = masses_from(&c["lens"]);
        let want: Vec<i64> = c["result"].as_array().expect("arr").iter().map(i).collect();
        assert_eq!(
            allocate_typy_to_masses(i(&c["n"]), &masses),
            want,
            "lens {} n {}",
            c["lens"],
            c["n"]
        );
    }
}

#[test]
fn spawn_habitable_terrain_matches_web() {
    // Web przyjmuje tez teksty; w Rust teren to enum - mapujemy 8 nazw weba na warianty.
    let by_name = |t: &str| match t {
        "laka" => Some(Terrain::Grassland),
        "rownina" => Some(Terrain::Plains),
        "wzgorza" => Some(Terrain::Hills),
        "gory" => Some(Terrain::Mountains),
        "plytkie_morze" => Some(Terrain::ShallowSea),
        "morze" => Some(Terrain::Sea),
        "pustynia" => Some(Terrain::Desert),
        "polarny" => Some(Terrain::Polar),
        _ => None,
    };
    let mut known = 0;
    for c in cases("isSpawnHabitable") {
        if let Some(t) = by_name(s(&c["teren"])) {
            known += 1;
            assert_eq!(
                is_spawn_habitable_terrain(t),
                c["result"].as_bool().expect("bool"),
                "{}",
                c["teren"]
            );
        }
    }
    assert_eq!(known, 8, "wszystkie 8 terenow gry");
}

#[test]
fn group_habitable_masses_and_cache_match_web() {
    let by_name: std::collections::HashMap<String, &Value> = cases("groupMasses")
        .iter()
        .map(|c| (s(&c["name"]).to_string(), c))
        .collect();
    assert!(by_name.len() >= 50);
    for c in cases("groupMasses") {
        let input = hexes(&c["input"]);
        let masses = group_habitable_masses(&input);
        let name = s(&c["name"]);
        assert_eq!(masses.len(), u(&c["count"]), "{name}: liczba mas");
        let sizes: Vec<usize> = masses.iter().map(Vec::len).collect();
        let want_sizes: Vec<usize> = c["sizes"]
            .as_array()
            .expect("sizes")
            .iter()
            .map(u)
            .collect();
        assert_eq!(sizes, want_sizes, "{name}: rozmiary");
        let fnv = fnv1a64(
            &masses
                .iter()
                .map(|m| digest_hexes(m))
                .collect::<Vec<_>>()
                .join("|"),
        );
        assert_eq!(fnv, s(&c["fnv"]), "{name}: kolejnosc hexow w masach");
        let first: Vec<HexCoord> = masses
            .first()
            .map(|m| m.iter().take(5).copied().collect())
            .unwrap_or_default();
        assert_eq!(
            first,
            hexes(&c["first"]),
            "{name}: poczatek najwiekszej masy"
        );
    }
    for c in cases("massCache") {
        let name = s(&c["name"]);
        let g = by_name[name];
        let input = hexes(&g["input"]);
        let cache = create_mass_land_cache(&input);
        assert_eq!(cache.hex_index.len(), u(&c["indexSize"]), "{name}: indeks");
        let mut entries: Vec<String> = cache
            .hex_index
            .iter()
            .map(|((q, r), v)| format!("{q},{r}={v}"))
            .collect();
        // web iteruje Map w kolejnosci wstawienia: masy po kolei, hexy w kolejnosci masy
        entries.clear();
        for (mi, mass) in cache.masses.iter().enumerate() {
            for h in mass {
                entries.push(format!("{},{}={}", h.q, h.r, mi));
            }
        }
        assert_eq!(
            fnv1a64(&entries.join(";")),
            s(&c["indexFnv"]),
            "{name}: zawartosc indeksu"
        );
        let set_sizes: Vec<usize> = cache.mass_sets.iter().map(|x| x.len()).collect();
        let want: Vec<usize> = c["setSizes"]
            .as_array()
            .expect("sets")
            .iter()
            .map(u)
            .collect();
        assert_eq!(set_sizes, want, "{name}: zbiory");
        let from_masses = mass_land_cache_from_masses(cache.masses.clone());
        assert_eq!(
            from_masses, cache,
            "{name}: massLandCacheFromMasses == createMassLandCache"
        );
        assert!(c["sameAsFromMasses"].as_bool().expect("bool"));
    }
}

#[test]
fn region_mass_dominance_matches_web() {
    let rows = cases("regionDominance");
    assert!(rows.len() >= 200);
    for c in rows {
        let id = s(&c["map"]);
        let masses = group_habitable_masses(&ladowe_of(id));
        let got = region_mass_dominance(&hexes(&c["region"]), hex(&c["center"]), &masses);
        assert_f64(got.ratio, fv(&c["ratio"]), &format!("{id} ratio"));
        assert_eq!(
            got.center_mass_index.map(|x| x as i64),
            if c["centerMassIndex"].is_null() {
                None
            } else {
                Some(i(&c["centerMassIndex"]))
            },
            "{id} centerMassIndex"
        );
        assert_eq!(
            got.dominant_mass_index,
            i(&c["dominantMassIndex"]),
            "{id} dominantMassIndex"
        );
    }
}

#[test]
fn local_land_fraction_and_gate_match_web() {
    for c in cases("localLand") {
        let id = s(&c["map"]);
        let radius = if c["radius"].is_null() {
            None
        } else {
            Some(i(&c["radius"]))
        };
        let got = local_land_fraction(map_of(id), i(&c["q"]) as i32, i(&c["r"]) as i32, radius);
        assert_f64(got.ratio, fv(&c["ratio"]), &format!("{id} ratio {c}"));
        assert_eq!(got.land_count, i(&c["landCount"]), "{id} land {c}");
        assert_eq!(got.total_count, i(&c["totalCount"]), "{id} total {c}");
    }
    for c in cases("localGate") {
        let id = s(&c["map"]);
        let radius = if c["radius"].is_null() {
            None
        } else {
            Some(i(&c["radius"]))
        };
        let min_frac = if c["minFrac"].is_null() {
            None
        } else {
            Some(fv(&c["minFrac"]))
        };
        let got = passes_local_land_gate(
            map_of(id),
            i(&c["q"]) as i32,
            i(&c["r"]) as i32,
            min_frac,
            radius,
        );
        assert_eq!(got, c["result"].as_bool().expect("bool"), "{id} {c}");
    }
}

#[test]
fn development_space_and_mass_gates_match_web() {
    for c in cases("devSpace") {
        let id = s(&c["map"]);
        let masses = group_habitable_masses(&ladowe_of(id));
        let cache = mass_land_cache_from_masses(masses.clone());
        let radius = if c["radius"].is_null() {
            None
        } else {
            Some(i(&c["radius"]))
        };
        let arg = if s(&c["form"]) == "cache" {
            MassesOrCache::Cache(&cache)
        } else {
            MassesOrCache::Masses(&masses)
        };
        let got = development_space_score(
            map_of(id),
            i(&c["q"]) as i32,
            i(&c["r"]) as i32,
            arg,
            radius,
        );
        assert_eq!(got, i(&c["result"]), "{id} {c}");
    }
    for c in cases("massSizeAt") {
        let id = s(&c["map"]);
        let masses = group_habitable_masses(&ladowe_of(id));
        let cache = mass_land_cache_from_masses(masses.clone());
        let arg = if s(&c["form"]) == "cache" {
            MassesOrCache::Cache(&cache)
        } else {
            MassesOrCache::Masses(&masses)
        };
        assert_eq!(
            mass_size_at_hex(i(&c["q"]) as i32, i(&c["r"]) as i32, arg),
            i(&c["result"]),
            "{id} {c}"
        );
    }
    for c in cases("playerMassGate") {
        let id = s(&c["map"]);
        let masses = group_habitable_masses(&ladowe_of(id));
        let cache = mass_land_cache_from_masses(masses.clone());
        let arg = if s(&c["form"]) == "cache" {
            MassesOrCache::Cache(&cache)
        } else {
            MassesOrCache::Masses(&masses)
        };
        let got =
            passes_player_start_mass_gate(map_of(id), i(&c["q"]) as i32, i(&c["r"]) as i32, arg);
        assert_eq!(got, c["result"].as_bool().expect("bool"), "{id} {c}");
    }
}

#[test]
fn player_mass_gate_over_whole_maps_matches_web() {
    let all = web()["cases"]["playerMassGateAll"]
        .as_object()
        .expect("obj");
    assert!(all.len() >= 3);
    for (id, bits) in all {
        let map = map_of(id);
        let masses = group_habitable_masses(&ladowe_of(id));
        let cache = mass_land_cache_from_masses(masses);
        let got: String = map
            .tiles
            .iter()
            .map(|t| {
                if passes_player_start_mass_gate(
                    map,
                    t.coord.q,
                    t.coord.r,
                    MassesOrCache::Cache(&cache),
                ) {
                    '1'
                } else {
                    '0'
                }
            })
            .collect();
        assert_eq!(got, s(bits), "{id}: bramka masy gracza na kazdym hexie");
        assert!(
            got.contains('1') && got.contains('0'),
            "{id}: wektor ma oba wyniki"
        );
    }
}

#[test]
fn vectors_identify_the_maps_used() {
    // Mapy z generateMap maja odcisk hexow; test liczy go po stronie Rust z reprezentacji.
    for id in map_ids() {
        let r = rep(&id);
        let names = [
            (Terrain::Sea, "morze"),
            (Terrain::ShallowSea, "plytkie_morze"),
            (Terrain::Grassland, "laka"),
            (Terrain::Plains, "rownina"),
            (Terrain::Hills, "wzgorza"),
            (Terrain::Mountains, "gory"),
            (Terrain::Desert, "pustynia"),
            (Terrain::Polar, "polarny"),
        ];
        let canon: Vec<String> = map_of(&id)
            .tiles
            .iter()
            .map(|t| {
                let n = names
                    .iter()
                    .find(|(k, _)| *k == t.terrain)
                    .expect("teren")
                    .1;
                format!("{},{},{}", t.coord.q, t.coord.r, n)
            })
            .collect();
        assert_eq!(fnv1a64(&canon.join(";")), s(&r["hexesFnv"]), "{id}");
    }
    assert!(map_ids().len() >= 17);
}

#[test]
fn types_have_web_shape() {
    // clusters.ts:101-125: ClusterCity, TypeCluster (growthSlot: brak / null / hex),
    // ClusterSpawnCache (seaDist + landCache + ladowe).
    let city = ClusterCity {
        q: 1,
        r: 2,
        is_capital: true,
    };
    let mut tc = TypeCluster {
        typ_index: 0,
        typ: roster_klucze()[0].clone(),
        centrum: HexCoord::new(1, 2),
        miasta: vec![city],
        pending_state_slots: None,
        growth_slot: None,
    };
    assert!(tc.growth_slot.is_none(), "klucz nieobecny");
    tc.growth_slot = Some(None);
    assert_eq!(tc.growth_slot, Some(None), "null");
    tc.growth_slot = Some(Some(HexCoord::new(3, 4)));
    assert_eq!(tc.growth_slot, Some(Some(HexCoord::new(3, 4))), "hex");
    let cache = ClusterSpawnCache {
        sea_dist: SeaDist::new(),
        land_cache: mass_land_cache_from_masses(Vec::new()),
        ladowe: Vec::new(),
    };
    assert!(cache.land_cache.masses.is_empty() && cache.land_cache.hex_index.is_empty());
}
