//! P6.8G okolica, czesc `sasiedztwo`: spor o sasiedni heks (`computeLostToNearerSiblingByCity`,
//! `collectWorkedHexKeysForOwner`, `collectWorkedHexOwnerMap`).
//! Podzial partii <=600 LOC na granicach sekcji `okolica.ts`; API eksportowane przez `okolica`.

use super::*;

// ---------------------------------------------------------------------------------------------
// Spór o sąsiedni heks (P-HEKS-SPOR-SASIAD)
// ---------------------------------------------------------------------------------------------

/// Web `computeLostToNearerSiblingByCity` (`okolica.ts:800`): cityId -> heksy w promieniu tego
/// miasta, które PRZEGRAŁO z bliższym miastem tego samego właściciela (remis: wcześniejszy indeks).
pub fn compute_lost_to_nearer_sibling_by_city(
    cities: &[OkolicaCity],
    map: &BuildMap,
) -> BTreeMap<String, BTreeSet<String>> {
    #[derive(Clone)]
    struct Sib {
        id: String,
        q: i32,
        r: i32,
        radius: f64,
    }

    let mut out: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();
    // Map.set w pętli: dla zdublowanych id ostatni indeks wygrywa.
    let mut city_index: HashMap<&str, f64> = HashMap::new();
    for (i, c) in cities.iter().enumerate() {
        city_index.insert(c.id.as_str(), i as f64);
    }

    let mut by_owner: BTreeMap<i64, Vec<Sib>> = BTreeMap::new();
    for c in cities {
        let radius = city_range_for_population(js_floor_nonneg(c.population));
        if radius <= 0.0 {
            continue;
        }
        by_owner.entry(c.owner_id).or_default().push(Sib {
            id: c.id.clone(),
            q: c.q,
            r: c.r,
            radius,
        });
    }

    for owner_cities in by_owner.values() {
        if owner_cities.len() < 2 {
            continue;
        }
        for city_a in owner_cities {
            let near: Vec<&Sib> = owner_cities
                .iter()
                .filter(|o| {
                    o.id != city_a.id
                        && axial_distance(city_a.q, city_a.r, o.q, o.r) <= city_a.radius + o.radius
                })
                .collect();
            if near.is_empty() {
                continue;
            }
            let candidates = okolica_tiles(city_a.q, city_a.r, city_a.radius, map, None);
            let mut lost: BTreeSet<String> = BTreeSet::new();
            for t in &candidates {
                let mut winner_is_a = true;
                let mut winner_dist = t.dist;
                let mut winner_index = city_index
                    .get(city_a.id.as_str())
                    .copied()
                    .unwrap_or(f64::INFINITY);
                for sib in &near {
                    let d = axial_distance(t.q, t.r, sib.q, sib.r);
                    if d > sib.radius {
                        continue;
                    }
                    let sib_index = city_index
                        .get(sib.id.as_str())
                        .copied()
                        .unwrap_or(f64::INFINITY);
                    if d < winner_dist || (d == winner_dist && sib_index < winner_index) {
                        winner_dist = d;
                        winner_is_a = false;
                        winner_index = sib_index;
                    }
                }
                if !winner_is_a {
                    lost.insert(t.key.clone());
                }
            }
            if !lost.is_empty() {
                out.insert(city_a.id.clone(), lost);
            }
        }
    }
    out
}

/// Web `collectWorkedHexKeysForOwner` (`okolica.ts:662`): heksy z 👤 dla miast właściciela.
pub fn collect_worked_hex_keys_for_owner(
    cities: &[OkolicaCity],
    map: &BuildMap,
    owner_id: i64,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    is_workable: Option<&dyn Fn(i32, i32) -> bool>,
    territory: Option<&[TerritoryNode]>,
) -> BTreeSet<String> {
    let mut keys = BTreeSet::new();
    let lost = compute_lost_to_nearer_sibling_by_city(cities, map);
    for city in cities.iter().filter(|c| c.owner_id == owner_id) {
        let worked = resolve_worked_tiles(
            city,
            map,
            yield_of,
            &ResolveWorkedTilesOpts {
                is_workable,
                territory_nodes: territory,
                owner_id: Some(owner_id),
                exclude_hex_keys: lost.get(&city.id),
                ..ResolveWorkedTilesOpts::default()
            },
        );
        for t in worked {
            keys.insert(t.key);
        }
    }
    keys
}

/// Web `collectWorkedHexOwnerMap` (`okolica.ts:690`): hexKey -> ownerId miasta.
pub fn collect_worked_hex_owner_map(
    cities: &[OkolicaCity],
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    is_workable: Option<&dyn Fn(i32, i32) -> bool>,
    territory: Option<&[TerritoryNode]>,
) -> BTreeMap<String, i64> {
    let mut by_key = BTreeMap::new();
    let lost = compute_lost_to_nearer_sibling_by_city(cities, map);
    for city in cities {
        let worked = resolve_worked_tiles(
            city,
            map,
            yield_of,
            &ResolveWorkedTilesOpts {
                is_workable,
                territory_nodes: territory,
                owner_id: Some(city.owner_id),
                exclude_hex_keys: lost.get(&city.id),
                ..ResolveWorkedTilesOpts::default()
            },
        );
        for t in worked {
            by_key.insert(t.key, city.owner_id);
        }
    }
    by_key
}
