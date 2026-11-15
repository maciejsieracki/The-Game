//! P4-1B-Q2 (R-RUSTPORT-P4-1B-Q2-RIVER-TRIM): przyciecie ogona sredniej rzeki wzdluz glownego nurtu.
//! Port 1:1 z pinu `07d2fbd72` (`gra/src/map/gen-helpers.ts`):
//! - :7623-7634 `trimMediumTailAlongMain` (FALA 175),
//! - :8194-8203 `trimMediumRenderPathAtMain` (eksportowana; render, junction snap).
//!
//! Klucz heksa w webie to `hexKey(q, r)` = `"q,r"`; dla liczb calkowitych jest to bijekcja z para
//! `(q, r)`, wiec zbior `Set<string>` jest tu zbiorem `RiverCoord`.
//! Web `mp ?? []` (pusta / `null` sciezka main) = pusty `Vec` po stronie Rust.
//! Wektory: `tests/p4_1b_river_trim_vectors/` (generator `gen.mjs` wykonuje tekst pinu).

use std::collections::HashSet;

use crate::domain::mapgen::rivers_a::RiverCoord;

/// Web `trimMediumTailAlongMain(path, mainKeys)` (:7623-7634).
/// Usuwa ogon sredniej biegnacy wzdluz main po junction: dopoki sciezka ma >= 3 heksy i OBA
/// ostatnie heksy leza na main, zdejmuje ostatni. Koniec zostaje na pierwszym heksie styku z main.
/// `pub(crate)`: przyszly `finalizeMediumPath` (M07C, `rivers_c.rs`) wola te sama funkcje.
pub(crate) fn trim_medium_tail_along_main(
    path: &[RiverCoord],
    main_keys: &HashSet<RiverCoord>,
) -> Vec<RiverCoord> {
    if path.len() < 3 || main_keys.is_empty() {
        return path.to_vec();
    }
    let mut out = path.to_vec();
    while out.len() >= 3 {
        let last = out[out.len() - 1];
        let prev = out[out.len() - 2];
        if main_keys.contains(&last) && main_keys.contains(&prev) {
            out.pop();
        } else {
            break;
        }
    }
    out
}

/// Web `trimMediumRenderPathAtMain(path, mainPaths)` (:8194-8203, eksportowana).
/// Render: utnij ogon sredniej wzdluz main (junction snap, bez przejscia przez nurt).
pub fn trim_medium_render_path_at_main(
    path: &[RiverCoord],
    main_paths: &[Vec<RiverCoord>],
) -> Vec<RiverCoord> {
    let mut main_keys: HashSet<RiverCoord> = HashSet::new();
    for mp in main_paths {
        for p in mp {
            main_keys.insert(*p);
        }
    }
    trim_medium_tail_along_main(path, &main_keys)
}
