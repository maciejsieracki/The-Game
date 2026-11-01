//! P6.M07B-Q4 partia 4a: pelne trasowanie rzeki (`traceRiver`) i wariant siatki.
//! Web (pin `4bbef081d`, gen-helpers.ts): `traceRiver` (:6708), `traceRiverForGridFill` (:6822).
//! Wektory: `tests/p6_m07b4_vectors/web-rivers-b-q4.json` (`gen_q4_vectors.mjs`).
//! Profiler rzek (`RIVER_PROFILE_ON`, tylko liczniki/czas) nie wplywa na wynik - pominiety.

use std::collections::{HashMap, HashSet};

use crate::domain::mapgen::landsea::ocean_connected_water_keys;
use crate::domain::mapgen::prims::hex_key;
use crate::domain::mapgen::rivers_a::grow::{
    grow_river_inland_before_drainage, InlandGrowParams, TraceRiverOpts,
};
use crate::domain::mapgen::rivers_a::walk::{infer_map_dims_from_hexes, path_ends_at_sea};
use crate::domain::mapgen::rivers_a::{
    build_open_ocean_distance_field, build_sea_distance_field, repair_river_path_adjacency,
    river_path_respects_sea_buffer, RiverCoord, RIVER_HARD_MEANDER_LEN, RIVER_MIN_INLAND_FROM_SEA,
    RIVER_MOUTH_TAIL_LEN,
};
use crate::domain::mapgen::rivers_b::astar::a_star_river_to_sea;
use crate::domain::mapgen::rivers_b::extend::{
    extend_river_to_wybrzeze, finish_river_mouth_at_sea,
};
use crate::domain::mapgen::rivers_b::trace_coast::greedy_river_drain_to_sea;
use crate::domain::mapgen::rivers_b::window::sanitize_river_turn_window;
use crate::domain::mapgen::terrain_class::HexRecord;

/// Web `traceRiver(hexes, sq, sr, maxLen = 40, traceOpts)` (:6708). Min. `minLen` (domyslnie 4)
/// hex w glab ladu, potem A* do morza (fallback: zjazd zachlanny), ogon ujscia, naprawa i
/// sanityzacja okna skretu. `[]` gdy brak `seaDist` zrodla, naruszony bufor od morza (bez
/// `relaxSeaBuffer`) albo trasa nie konczy sie przy oceanie. `rand` domyslnie `() => 0`
/// (jedna sekwencja przez wzrost, A*, zjazd - jak w webie). `river_sep_index` nieuzywany (web tez).
pub fn trace_river(
    hexes: &HexRecord,
    sq: i64,
    sr: i64,
    max_len: usize,
    opts: &mut TraceRiverOpts<'_>,
) -> Vec<RiverCoord> {
    let sea_owned;
    let sea_dist: &HashMap<String, i64> = match opts.sea_dist {
        Some(s) => s,
        None => {
            sea_owned = build_sea_distance_field(hexes);
            &sea_owned
        }
    };
    let (width, height) = match (opts.map_width, opts.map_height) {
        (Some(w), Some(h)) => (w, h),
        _ => infer_map_dims_from_hexes(hexes),
    };
    let open_owned;
    let open_ocean_dist: &HashMap<String, i64> = match opts.open_ocean_dist {
        Some(o) => o,
        None => {
            open_owned =
                build_open_ocean_distance_field(hexes, width, height, opts.ocean_connected);
            &open_owned
        }
    };
    let ocean_owned;
    let ocean_connected: &HashSet<String> = match opts.ocean_connected {
        Some(o) => o,
        None => {
            ocean_owned = ocean_connected_water_keys(hexes, width, height);
            &ocean_owned
        }
    };
    let mut zero = || 0.0_f64;
    let rand: &mut dyn FnMut() -> f64 = match opts.rand.as_mut() {
        Some(r) => &mut **r,
        None => &mut zero,
    };
    let src_key = hex_key(sq, sr);
    let Some(&start_dist) = sea_dist.get(&src_key) else {
        return Vec::new();
    };

    let inland_target = opts.min_len.unwrap_or(4) as i64;
    let mouth_tail_len = opts.mouth_tail_len.unwrap_or(RIVER_MOUTH_TAIL_LEN) as i64;
    let hard_meander_len = opts.hard_meander_len.unwrap_or(RIVER_HARD_MEANDER_LEN);
    let allow_relief = opts.allow_relief_traversal.unwrap_or(false);
    let relax_sea_buffer = opts.relax_sea_buffer.unwrap_or(false);
    let max_len_i = max_len as i64;
    let step_cap_i = (inland_target + mouth_tail_len + 12)
        .max(max_len_i.min((start_dist as f64 * 2.5).ceil() as i64 + inland_target + 10));
    let step_cap = step_cap_i as usize;
    let inland_growth_max = (step_cap_i - mouth_tail_len - 4).min(max_len_i);

    let params = InlandGrowParams {
        sq,
        sr,
        sea_dist,
        open_ocean_dist,
        inland_target_len: inland_target as usize,
        step_cap,
        hard_meander_len,
        allow_relief_traversal: allow_relief,
        relax_sea_buffer,
        inland_growth_max: Some(inland_growth_max.max(0) as usize),
        block_river_keys: opts.block_river_keys,
        min_path_sep: opts.min_path_sep.unwrap_or(0),
        land_centroid: opts.land_centroid,
        land_center_square: opts.land_center_square,
    };
    let mut path = grow_river_inland_before_drainage(hexes, &params, &mut *rand);

    let tail_from = *path.last().expect("trasa niepusta");
    let drain_budget = (mouth_tail_len + 4).max(step_cap_i - path.len() as i64 + 1) as usize;
    let mut drain_path = a_star_river_to_sea(
        hexes,
        tail_from.q,
        tail_from.r,
        sea_dist,
        open_ocean_dist,
        ocean_connected,
        drain_budget,
        &mut *rand,
        allow_relief,
    );
    if drain_path.len() <= 1 {
        drain_path = greedy_river_drain_to_sea(
            hexes,
            tail_from.q,
            tail_from.r,
            sea_dist,
            open_ocean_dist,
            ocean_connected,
            drain_budget,
            &mut *rand,
            &src_key,
            allow_relief,
        );
    }
    if drain_path.len() > 1 {
        path.extend_from_slice(&drain_path[1..]);
    } else if path.len() <= 1 {
        path = a_star_river_to_sea(
            hexes,
            sq,
            sr,
            sea_dist,
            open_ocean_dist,
            ocean_connected,
            step_cap,
            &mut *rand,
            allow_relief,
        );
        if path.len() <= 1 {
            path = greedy_river_drain_to_sea(
                hexes,
                sq,
                sr,
                sea_dist,
                open_ocean_dist,
                ocean_connected,
                step_cap,
                &mut *rand,
                &src_key,
                allow_relief,
            );
        }
    }

    if path.len() > step_cap {
        path.truncate(step_cap);
    }
    extend_river_to_wybrzeze(hexes, &mut path, sea_dist);
    finish_river_mouth_at_sea(
        hexes,
        &mut path,
        sea_dist,
        open_ocean_dist,
        ocean_connected,
        &src_key,
    );
    let path = repair_river_path_adjacency(&path, hexes, &src_key);
    let path = sanitize_river_turn_window(&path, hexes, &src_key);

    let ends = path_ends_at_sea(hexes, &path, Some((width, height)), Some(ocean_connected));
    if !relax_sea_buffer {
        if !river_path_respects_sea_buffer(
            hexes,
            &path,
            sea_dist,
            RIVER_MIN_INLAND_FROM_SEA,
            RIVER_MOUTH_TAIL_LEN,
        ) || !ends
        {
            return Vec::new();
        }
    } else if !ends {
        return Vec::new();
    }
    path
}

/// Web `traceRiverForGridFill(hexes, sq, sr, maxLen, catalogMinLen, acceptLen, traceOpts,
/// relaxSeaBuffer = false, fastMode = false)` (:6822). Proby `minLen`: fast `[acceptLen,
/// max(3, floor(acceptLen*0.75))]`, inaczej `[catalogMinLen, max(acceptLen, floor(catalogMinLen*0.6)),
/// acceptLen, 3]`; powtorzone wartosci pomijane. Pierwsza trasa `>= acceptLen` wygrywa (przy
/// `relaxSeaBuffer` dodatkowo `pathEndsAtSea` na `oceanConnected` z opcji lub liczonym z wymiarow).
/// `rand` z opcji jest wspolny dla wszystkich prob (web: ta sama funkcja w `{...traceOpts}`);
/// `opts.min_len` jest nadpisywane (web: kopia opcji). Nieuzywane w webie wywolanie
/// `buildSeaDistanceField` w galezi `relaxSeaBuffer` pominiete (bez efektu ubocznego).
#[allow(clippy::too_many_arguments)]
pub fn trace_river_for_grid_fill(
    hexes: &HexRecord,
    sq: i64,
    sr: i64,
    max_len: usize,
    catalog_min_len: usize,
    accept_len: usize,
    opts: &mut TraceRiverOpts<'_>,
    relax_sea_buffer: bool,
    fast_mode: bool,
) -> Vec<RiverCoord> {
    let tries: Vec<usize> = if fast_mode {
        vec![
            accept_len,
            3usize.max((accept_len as f64 * 0.75).floor() as usize),
        ]
    } else {
        vec![
            catalog_min_len,
            accept_len.max((catalog_min_len as f64 * 0.6).floor() as usize),
            accept_len,
            3,
        ]
    };
    let mut seen: HashSet<usize> = HashSet::new();
    for try_min in tries {
        if !seen.insert(try_min) {
            continue;
        }
        opts.min_len = Some(try_min);
        let path = trace_river(hexes, sq, sr, max_len, opts);
        if path.len() < accept_len {
            continue;
        }
        if !relax_sea_buffer {
            return path;
        }
        let (width, height) = match (opts.map_width, opts.map_height) {
            (Some(w), Some(h)) => (w, h),
            _ => infer_map_dims_from_hexes(hexes),
        };
        let ocean_owned;
        let ocean: &HashSet<String> = match opts.ocean_connected {
            Some(o) => o,
            None => {
                ocean_owned = ocean_connected_water_keys(hexes, width, height);
                &ocean_owned
            }
        };
        if path_ends_at_sea(hexes, &path, Some((width, height)), Some(ocean)) {
            return path;
        }
    }
    Vec::new()
}
