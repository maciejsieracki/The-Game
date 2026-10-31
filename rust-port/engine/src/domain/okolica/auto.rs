//! P6.8G okolica, czesc `auto`: automat auto-okolicy (`assignWorkedTiles`, `resolveWorkedTiles`).
//! Podzial partii <=600 LOC na granicach sekcji `okolica.ts`; API eksportowane przez `okolica`.

use super::*;

// ---------------------------------------------------------------------------------------------
// Automat (auto-okolica)
// ---------------------------------------------------------------------------------------------

/// Web `assignWorkedTiles` (`okolica.ts:348`): `population` NAJLEPSZYCH pól (score malejąco).
/// Remis: bliżej centrum, potem klucz. `population` niefinite / <=0 -> [].
pub fn assign_worked_tiles(
    center_q: i32,
    center_r: i32,
    population: f64,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    opts: &AssignOptions<'_>,
) -> Vec<OkolicaTile> {
    let radius = opts
        .radius
        .unwrap_or_else(|| city_range_for_population(population));
    let filter = effective_is_workable(opts);
    let tiles = okolica_tiles(center_q, center_r, radius, map, Some(&*filter));
    let scored: Vec<ScoredTile<'_>> = tiles
        .iter()
        .map(|t| {
            let y = yield_of(t.q, t.r);
            let potential = opts.potential_of.map_or(0.0, |f| f(t.q, t.r));
            ScoredTile {
                t,
                s: tile_assign_score(y, opts.wagi, potential),
                zywnosc: y.zywnosc,
                potential,
            }
        })
        .collect();
    let scored = v8_sort_by(scored, &|a, b| compare_scored(a, b, opts.focus));
    let pop = if population.is_finite() {
        population
    } else {
        0.0
    };
    let n = pop.floor().max(0.0).min(scored.len() as f64) as usize;
    scored.into_iter().take(n).map(|x| x.t.clone()).collect()
}

/// Opcje z fokusem żywności: potencjał żywności tylko dla `zywnosc` (web `assignOptionsForFocus`).
fn with_focus_potential<'a>(
    base: AssignOptions<'a>,
    focus: OkolicaFocus,
    potential: &'a dyn Fn(i32, i32) -> f64,
) -> AssignOptions<'a> {
    let mut opts = base;
    opts.focus = Some(focus);
    if focus == OkolicaFocus::Zywnosc {
        opts.potential_of = Some(potential);
    }
    opts
}

/// Web `resolveWorkedTiles` (`okolica.ts:380`): auto lub ręczne przypisanie pól.
pub fn resolve_worked_tiles(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    opts: &ResolveWorkedTilesOpts<'_>,
) -> Vec<OkolicaTile> {
    let pop = js_floor_nonneg(city.population);
    let radius = opts
        .radius
        .unwrap_or_else(|| city_range_for_population(pop));
    let tryb = opts.tryb.or(city.tryb).unwrap_or(DEFAULT_OKOLICA_TRYB);
    let focus = opts.focus.or(city.focus).unwrap_or(DEFAULT_OKOLICA_FOCUS);

    if tryb == OkolicaTryb::Reczny {
        let filter_base = AssignOptions {
            is_workable: opts.is_workable,
            territory_nodes: opts.territory_nodes,
            owner_id: opts.owner_id,
            exclude_hex_keys: opts.exclude_hex_keys,
            ..AssignOptions::default()
        };
        let work_filter = effective_is_workable(&filter_base);
        let tiles = okolica_tiles(city.q, city.r, radius, map, Some(&*work_filter));
        let owned;
        let reczne: &Reczne = match (opts.reczne, city.reczne.as_ref()) {
            (Some(r), _) => r,
            (None, Some(r)) => r,
            (None, None) => {
                owned = Reczne::new();
                &owned
            }
        };
        let mut out = Vec::new();
        for (key, count) in reczne.iter() {
            if count.is_nan() || count <= 0.0 {
                continue;
            }
            if let Some(t) = tiles.iter().find(|t| t.key == key) {
                out.push(t.clone());
            }
        }
        if out.len() as f64 > pop {
            out.truncate(pop as usize);
        }
        return out;
    }

    let pot = |q: i32, r: i32| food_potential_of_map_hex(map, q, r);
    let base = AssignOptions {
        radius: Some(radius),
        is_workable: opts.is_workable,
        territory_nodes: opts.territory_nodes,
        owner_id: Some(opts.owner_id.unwrap_or(city.owner_id)),
        exclude_hex_keys: opts.exclude_hex_keys,
        wagi: Some(wagi_for_focus(focus)),
        ..AssignOptions::default()
    };
    assign_worked_tiles(
        city.q,
        city.r,
        pop,
        map,
        yield_of,
        &with_focus_potential(base, focus, &pot),
    )
}

/// Web `seedReczneFromAuto` (`okolica.ts:415`): pierwsze wejście w tryb ręczny — kopia auto.
pub fn seed_reczne_from_auto(
    city: &OkolicaCity,
    map: &BuildMap,
    yield_of: &dyn Fn(i32, i32) -> OkolicaYield,
    territory: Option<&[TerritoryNode]>,
    exclude: Option<&BTreeSet<String>>,
) -> Reczne {
    let pop = js_floor_nonneg(city.population);
    let mut out = Reczne::new();
    if pop <= 0.0 {
        return out;
    }
    let radius = city_range_for_population(pop);
    let focus = city.focus.unwrap_or(DEFAULT_OKOLICA_FOCUS);
    let land = |q: i32, r: i32| is_land_workable_hex(map, q, r);
    let pot = |q: i32, r: i32| food_potential_of_map_hex(map, q, r);
    let base = AssignOptions {
        radius: Some(radius),
        is_workable: Some(&land),
        territory_nodes: territory,
        owner_id: Some(city.owner_id),
        exclude_hex_keys: exclude,
        wagi: Some(wagi_for_focus(focus)),
        ..AssignOptions::default()
    };
    let tiles = assign_worked_tiles(
        city.q,
        city.r,
        pop,
        map,
        yield_of,
        &with_focus_potential(base, focus, &pot),
    );
    for t in &tiles {
        out.set(&t.key, 1.0);
    }
    out
}
