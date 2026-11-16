//! P6 SIEGE-TAKTYKA K5DOC-T4a (dispatch R-RUSTPORT-P6-K5DOC-T4A-HELPERY-SCIEZKI, runda 1, Operator): helpery sciezki
//! pieszego.
//!
//! Port z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`first_step_along_path_to_attack`] = `_firstStepAlongPathToAttack` (`:8565-8622`): BFS z rodzicami, zwraca PIERWSZY
//!   krok ku najblizszemu kafelkowi spelniajacemu `is_goal`, albo `None`. Na kazdym kroku BFS: filtr zajetosci
//!   (`occByKey` = [`BatchBoard::occ`](super::siege_tactics_autobatch::BatchBoard)) i przejezdnosci dla jednostki
//!   ([`AutoBatchEnv::passable_for_unit`], web `_passableForUnit`). ASYMETRIA `allowFirstStep`: filtr `allow_first_step`
//!   dotyczy WYLACZNIE pierwszego kroku (`cur == start`); dalsze kroki BFS go nie stosuja.
//! * [`step_toward`] = `_stepToward` (`:8413-8427`): greedy fallback, gdy BFS nie zwroci kroku.
//!
//! Wejscia jawne: `is_goal` = wynik `_makeCanAttackFromTest(ru)` albo `_canStrikeTargetFrom(ru, ., ., target)` w chwili
//! wywolania (wolajacy wylicza go przed BFS; ta funkcja nie portuje tych testow). Regula muru `wallCol-1` NIE ma tu
//! osobnego kodu: komentarz w pinie (`:8595-8604`) nie jest kodem; mur dziala przez zajetosc i `_canAttackFrom`
//! (korekta ewaluatora 1 w dispatchu).
//!
//! Celowo NIE uzywa [`bfs_first_step`](super::siege_tactics_walk::bfs_first_step) (K1b, inna funkcja: `max_visited`,
//! `pref_row`, `allow_tile`, inne zalozenia) ani `siege_tactics_tower::move_cost` (atrapa harnessu).
//!
//! Wektory: `tests/p6_k5doc_t4a_vectors/vectors.json`, generowane przez `tests/p6_k5doc_t4a_gen.mjs` (wykonanie tekstu
//! pina przez TypeScript).

use std::collections::{HashMap, VecDeque};

use super::siege_tactics_approach::BF_ROWS;
use super::siege_tactics_autobatch::{cell_key, AutoBatchEnv, BatchState, CellKey, BF_COLS};

/// Kafelek (kolumna, wiersz) jako liczby calkowite zapisane w `f64` (jak `BatchUnit::q/r`).
pub type Tile = (f64, f64);

/// Web `DIRS4` = `DIR_DELTA` (`battleScene.ts:326-331`, `:337`): kolejnosc N, E, S, W (kolejnosc wplywa na wynik BFS).
const DIRS4: [(f64, f64); 4] = [(0.0, -1.0), (1.0, 0.0), (0.0, 1.0), (-1.0, 0.0)];

/// Web `if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;` (`:8581`, `:8600` w wycinku pina).
fn in_bounds(col: f64, row: f64) -> bool {
    (0.0..BF_COLS).contains(&col) && (0.0..BF_ROWS as f64).contains(&row)
}

/// Web `manhattan(ac, ar, bc, br)` (`battleScene.ts:1917-1919`).
fn manhattan(a: Tile, b: Tile) -> f64 {
    (a.0 - b.0).abs() + (a.1 - b.1).abs()
}

/// Web `_firstStepAlongPathToAttack(ru, allowFirstStep?, target?)` (`battleScene.ts:8565-8622`), wariant bez `target`
/// (cel = `is_goal`, wyliczany przez wolajacego).
///
/// * `env` i `st`: `passable_for_unit` (web `_passableForUnit`) i `st.board.occ` (web `occByKey`).
/// * `allow_first_step`: web `allowFirstStep`; stosowany tylko do krokow z `start` (`cur == start`).
///
/// Zwraca kafelek PIERWSZEGO kroku prowadzacego do najblizszego celu, albo `None` (start jest celem lub brak sciezki).
pub fn first_step_along_path_to_attack<E: AutoBatchEnv>(
    env: &mut E,
    st: &BatchState,
    unit_id: &str,
    start: Tile,
    is_goal: &dyn Fn(f64, f64) -> bool,
    allow_first_step: Option<&dyn Fn(f64, f64) -> bool>,
) -> Option<Tile> {
    let start_key = cell_key(start.0, start.1);
    // web: if (isGoal(ru.q, ru.r)) return null;
    if is_goal(start.0, start.1) {
        return None;
    }

    // web: parent (klucz -> klucz rodzica; start -> null).
    let mut parent: HashMap<CellKey, Option<Tile>> = HashMap::new();
    parent.insert(start_key, None);
    let mut frontier: VecDeque<Tile> = VecDeque::from([start]);
    let mut goal: Option<Tile> = None;

    'bfs: while let Some(cur) = frontier.pop_front() {
        for (dc, dr) in DIRS4 {
            let (nc, nr) = (cur.0 + dc, cur.1 + dr);
            if !in_bounds(nc, nr) {
                continue;
            }
            let nk = cell_key(nc, nr);
            if parent.contains_key(&nk) {
                continue; // web: already seen
            }
            // Asymetria allowFirstStep (web :8593): tylko dla pierwszego kroku, tylko gdy cur == start.
            if cur == start && allow_first_step.is_some_and(|allow| !allow(nc, nr)) {
                continue;
            }
            if st.board.occ.contains_key(&nk) {
                continue; // web: occupied -> wall (ally i wrog)
            }
            if !env.passable_for_unit(st, unit_id, nc, nr) {
                continue; // web: river / wall body -> cannot stand
            }
            parent.insert(nk, Some(cur));
            if is_goal(nc, nr) {
                goal = Some((nc, nr));
                break 'bfs; // web: frontier.length = 0; break;
            }
            frontier.push_back((nc, nr));
        }
    }

    // web: odtworzenie sciezki po rodzicach od celu do kroku, ktorego rodzicem jest start.
    let mut node = goal?;
    loop {
        match parent.get(&cell_key(node.0, node.1)).copied().flatten() {
            Some(prev) if cell_key(prev.0, prev.1) == start_key => return Some(node),
            Some(prev) => node = prev,
            None => return None,
        }
    }
}

/// Web `_stepToward(ru, target)` (`battleScene.ts:8413-8427`): greedy krok zmniejszajacy odleglosc Manhattan do celu.
/// Pierwszy kierunek w kolejnosci N, E, S, W, ktory BEZWZGLEDNIE zmniejsza odleglosc (`dd < bestD`), przy zajetosci
/// (`occByKey`) i przejezdnosci (`passable_for_unit`) jako filtrach.
pub fn step_toward<E: AutoBatchEnv>(
    env: &mut E,
    st: &BatchState,
    unit_id: &str,
    start: Tile,
    target: Tile,
) -> Option<Tile> {
    let mut best: Option<Tile> = None;
    let mut best_d = manhattan(start, target);
    for (dc, dr) in DIRS4 {
        let (nc, nr) = (start.0 + dc, start.1 + dr);
        if !in_bounds(nc, nr) {
            continue;
        }
        if st.board.occ.contains_key(&cell_key(nc, nr)) {
            continue; // web: occupied -- cannot enter
        }
        if !env.passable_for_unit(st, unit_id, nc, nr) {
            continue; // web: deep river -- cannot enter
        }
        let dd = manhattan((nc, nr), target);
        if dd < best_d {
            best_d = dd;
            best = Some((nc, nr));
        }
    }
    best
}
