//! P6.8G okolica, czesc `manual`: tryb reczny (`rebalanceWorkersAfterPopulationChange`,
//! `seedReczneFromAuto`, `adjustTileWorker`, `surroundingWorkerCap`, `toggleTileWorker`).
//! Podzial partii <=600 LOC na granicach sekcji `okolica.ts`; API eksportowane przez `okolica`.

use super::*;

// ---------------------------------------------------------------------------------------------
// Tryb ręczny: rebalans, adjust (+1/-1), toggle
// ---------------------------------------------------------------------------------------------

/// Web `rebalanceWorkersAfterPopulationChange` (`okolica.ts:437`). Tylko tryb ręczny.
/// Przy spadku usuwa DOKŁADNIE `excess` wpisów (także nielegalne — B3), po jednym na iterację.
#[allow(clippy::too_many_arguments)] // sygnatura 1:1 z web `rebalanceWorkersAfterPopulationChange`
pub fn rebalance_workers_after_population_change(
    city: &mut OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    pop_before: f64,
    pop_after: f64,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) {
    if pop_before == pop_after {
        return;
    }
    let tryb = city.tryb.unwrap_or(DEFAULT_OKOLICA_TRYB);
    let pop = js_floor_nonneg(pop_after);
    if tryb != OkolicaTryb::Reczny {
        return;
    }

    let radius = city_range_for_population(pop);
    let focus = city.focus.unwrap_or(DEFAULT_OKOLICA_FOCUS);
    let wagi = wagi_for_focus(focus);
    let work_filter = terrain_and_territory_filter(map, territory, city.owner_id, exclude);
    let tiles = okolica_tiles(city.q, city.r, radius, map, Some(&*work_filter));
    let mut reczne = city.reczne.clone().unwrap_or_default();

    if pop_after > pop_before {
        if reczne.count_assigned() == 0 && pop > 0.0 {
            let mut seeded_city = city.clone();
            seeded_city.population = pop;
            city.reczne = Some(seed_reczne_from_auto(
                &seeded_city,
                map,
                yield_of,
                territory,
                exclude,
            ));
            return;
        }
        let mut need = pop - reczne.count_assigned() as f64;
        let mut salt: i64 = 0;
        while need > 0.0 {
            let free: Vec<&OkolicaTile> =
                tiles.iter().filter(|t| reczne.get(&t.key) < 1.0).collect();
            if free.is_empty() {
                break;
            }
            let seed = i64::from(city.q) * 997 + i64::from(city.r) * 991 + (pop as i64) * 17 + salt;
            let idx = pick_deterministic_index(seed, free.len());
            let key = free[idx].key.clone();
            reczne.set(&key, 1.0);
            need -= 1.0;
            salt += 1;
        }
        city.reczne = Some(reczne);
        return;
    }

    if pop_after < pop_before {
        let mut excess = reczne.count_assigned() as f64 - pop;
        while excess > 0.0 {
            let keys: Vec<String> = reczne
                .iter()
                .filter(|(_, v)| *v > 0.0)
                .map(|(k, _)| k.to_owned())
                .collect();
            if keys.is_empty() {
                break;
            }
            let mut worst_key: Option<String> = None;
            let mut worst_score = f64::INFINITY;
            let mut worst_dist = -1.0_f64;
            for key in &keys {
                let (s, dist) = match tiles.iter().find(|t| &t.key == key) {
                    None => {
                        let dist = match parse_hex_key(key) {
                            Some((q, r)) => axial_distance(city.q, city.r, q, r),
                            None => f64::NAN,
                        };
                        (f64::NEG_INFINITY, dist)
                    }
                    Some(t) => {
                        let potential = if focus == OkolicaFocus::Zywnosc {
                            food_potential_of_map_hex(map, t.q, t.r)
                        } else {
                            0.0
                        };
                        (
                            tile_assign_score(yield_of(t.q, t.r), Some(wagi), potential),
                            t.dist,
                        )
                    }
                };
                if s < worst_score || (s == worst_score && dist > worst_dist) {
                    worst_score = s;
                    worst_dist = dist;
                    worst_key = Some(key.clone());
                }
            }
            if let Some(k) = worst_key {
                reczne.remove(&k);
            }
            excess -= 1.0;
        }
        city.reczne = Some(reczne);
    }
}

/// Web `adjustTileWorker` (`okolica.ts:487`): kierunkowy +1/-1, NIE toggle.
/// +1 na obsadzonym polu = `juz_obsadzone` (bez zdjęcia); -1 na pustym = `brak_robotnika`.
#[allow(clippy::too_many_arguments)] // sygnatura 1:1 z web `adjustTileWorker`
pub fn adjust_tile_worker(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    q: i32,
    r: i32,
    delta: i8,
    radius: Option<f64>,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) -> WorkerEdit {
    let pop = js_floor_nonneg(city.population);
    let rad = radius.unwrap_or_else(|| city_range_for_population(pop));
    let key = hex_key(q, r);
    let mut reczne = city.reczne.clone().unwrap_or_default();
    if city.tryb.unwrap_or(DEFAULT_OKOLICA_TRYB) != OkolicaTryb::Reczny {
        reczne = seed_reczne_from_auto(city, map, yield_of, territory, exclude);
    }
    let current = reczne.get(&key);
    let assigned = reczne.count_assigned() as f64;

    if delta == 1 {
        if current >= 1.0 {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("juz_obsadzone"),
            };
        }
        if assigned >= pop {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("limit_populacji"),
            };
        }
        let work_filter = terrain_and_territory_filter(map, territory, city.owner_id, exclude);
        let tiles = okolica_tiles(city.q, city.r, rad, map, Some(&*work_filter));
        if !tiles.iter().any(|t| t.key == key) {
            if exclude.is_some_and(|e| e.contains(&key)) {
                return WorkerEdit {
                    ok: false,
                    reczne,
                    reason: Some("zajete_przez_inne_miasto"),
                };
            }
            if territory.is_some_and(|nodes| !is_territory_hex_owned_by(q, r, city.owner_id, nodes))
            {
                return WorkerEdit {
                    ok: false,
                    reczne,
                    reason: Some("obce_terytorium"),
                };
            }
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("poza_zasiegiem"),
            };
        }
        reczne.set(&key, 1.0);
        return WorkerEdit {
            ok: true,
            reczne,
            reason: None,
        };
    }

    if current <= 0.0 {
        return WorkerEdit {
            ok: false,
            reczne,
            reason: Some("brak_robotnika"),
        };
    }
    reczne.remove(&key);
    WorkerEdit {
        ok: true,
        reczne,
        reason: None,
    }
}

/// Web `surroundingWorkerCap` (`okolica.ts:523`): `max(0, floor(population))`.
pub fn surrounding_worker_cap(population: f64) -> f64 {
    js_floor_nonneg(population)
}

/// Web `toggleTileWorker` (`okolica.ts:541`): klik zajęte = zdejmij; wolne + wolne sloty = dodaj.
/// Centrum miasta zawsze odrzucane.
#[allow(clippy::too_many_arguments)] // sygnatura 1:1 z web `toggleTileWorker`
pub fn toggle_tile_worker(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    q: i32,
    r: i32,
    radius: Option<f64>,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) -> WorkerEdit {
    let pop = surrounding_worker_cap(city.population);
    if pop <= 0.0 {
        return WorkerEdit {
            ok: false,
            reczne: Reczne::new(),
            reason: Some("brak_ludnosci"),
        };
    }
    if q == city.q && r == city.r {
        return WorkerEdit {
            ok: false,
            reczne: city.reczne.clone().unwrap_or_default(),
            reason: Some("centrum_miasta"),
        };
    }

    let rad = radius.unwrap_or_else(|| city_range_for_population(js_max(1.0, pop)));
    let key = hex_key(q, r);
    let mut reczne = city.reczne.clone().unwrap_or_default();
    if city.tryb.unwrap_or(DEFAULT_OKOLICA_TRYB) != OkolicaTryb::Reczny {
        let auto = seed_reczne_from_auto(city, map, yield_of, territory, exclude);
        reczne = if auto.get(&key) >= 1.0 {
            auto
        } else {
            Reczne::new()
        };
    }

    // B1: zdejmowanie obsadzonego pola PRZED filtrem terenu/terytorium (dane ze starych zapisów).
    if reczne.get(&key) >= 1.0 {
        reczne.remove(&key);
        return WorkerEdit {
            ok: true,
            reczne,
            reason: None,
        };
    }

    let work_filter = terrain_and_territory_filter(map, territory, city.owner_id, exclude);
    let in_range = okolica_tiles(city.q, city.r, rad, map, Some(&*work_filter))
        .iter()
        .any(|t| t.key == key);
    if !in_range {
        if exclude.is_some_and(|e| e.contains(&key)) {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("zajete_przez_inne_miasto"),
            };
        }
        if territory.is_some_and(|nodes| !is_territory_hex_owned_by(q, r, city.owner_id, nodes)) {
            return WorkerEdit {
                ok: false,
                reczne,
                reason: Some("obce_terytorium"),
            };
        }
        return WorkerEdit {
            ok: false,
            reczne,
            reason: Some("poza_zasiegiem"),
        };
    }

    let assigned = reczne.count_assigned() as f64;
    if assigned < pop {
        reczne.set(&key, 1.0);
        return WorkerEdit {
            ok: true,
            reczne,
            reason: None,
        };
    }
    WorkerEdit {
        ok: false,
        reczne,
        reason: Some("limit_populacji"),
    }
}
