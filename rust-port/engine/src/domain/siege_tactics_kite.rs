//! P6 SIEGE-TAKTYKA K5DOC-T5a (dispatch R-RUSTPORT-P6-K5DOC-T5A-KITE, runda 1, Operator): czyste funkcje galezi KITE
//! strzelca z `_rangedAction` (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`):
//! * [`MELEE_SAFE_GAP`] = `MELEE_SAFE_GAP` (`:968`),
//! * [`enemies_of_kite`] = `_enemiesOf` (`:8291-8294`),
//! * [`nearest_enemy_melee`] = `_nearestEnemyMelee` (`:8315-8324`): pomija wrogow `primaryRanged`,
//! * [`kite_branch_applies`] = warunek galezi 1 (`:6689-6691`): WYLACZNIE predykat, bez wykonania ruchu ani strzalu,
//! * [`best_kite_shot_step`] = `_bestKiteShotStep` (`:6959-7002`).
//!
//! Poza zakresem T5a (T5b / T8): cialo galezi KITE (`_doMove`, strzal po ruchu, `cornered` `:6719-6721`),
//! `_rangedBackStep`, `_bestBackStep`, `_rangedForwardStep`, wpiecie w `ActivateOps` / `U7.5-ranged`.
//!
//! Wejscia jawne: [`KiteUnit`] (pozycja, strona, zasieg, flagi zywotnosci i `primaryRanged`), lista jednostek obu stron,
//! predykat zajetosci (web `occByKey`) i predykat przejezdnosci (web `_passableForUnit`).
//!
//! Wektory: `tests/p6_k5doc_t5a_vectors/vectors.json`, generowane przez `tests/p6_k5doc_t5a_gen.mjs` (wykonanie tekstu
//! pina przez TypeScript).

use super::siege_tactics_approach::BF_ROWS;
use super::siege_tactics_autobatch::BF_COLS;
use super::siege_tactics_end::BattleSide;
use super::siege_tactics_pathstep::Tile;

/// Web `MELEE_SAFE_GAP` (`battleScene.ts:968`): prog dystansu, przy ktorym wrog melee wyzwala kite.
pub const MELEE_SAFE_GAP: f64 = 2.0;

/// Web `DIRS4` = `DIR_DELTA` (`battleScene.ts:326-331`, `:337`): kolejnosc N, E, S, W (decyduje o remisach).
const DIRS4: [(f64, f64); 4] = [(0.0, -1.0), (1.0, 0.0), (0.0, 1.0), (-1.0, 0.0)];

/// Jednostka widziana przez galaz KITE: pola z `RuntimeBattleUnit` potrzebne do czystych funkcji.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct KiteUnit {
    /// Web `(ru.q, ru.r)`.
    pub tile: Tile,
    /// Web `ru.side` (`'atk'` / `'def'`).
    pub side: BattleSide,
    /// Web `ru.range`.
    pub range: f64,
    /// Web `ru.primaryRanged`.
    pub primary_ranged: bool,
    /// Web `ru.dead`.
    pub dead: bool,
    /// Web `ru.fadingOut`.
    pub fading_out: bool,
    /// Web `ru.routed`.
    pub routed: bool,
}

/// Web `manhattan(ac, ar, bc, br)` (`battleScene.ts:1917-1919`).
fn manhattan(a: Tile, b: Tile) -> f64 {
    (a.0 - b.0).abs() + (a.1 - b.1).abs()
}

/// Web `_advanceDir(side)` (`battleScene.ts:6743-6745`): atak `+1`, obrona `-1`.
fn advance_dir(side: BattleSide) -> f64 {
    match side {
        BattleSide::Attacker => 1.0,
        BattleSide::Defender => -1.0,
    }
}

/// Web `if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;` (`battleScene.ts:6971`).
fn in_bounds(col: f64, row: f64) -> bool {
    (0.0..BF_COLS).contains(&col) && (0.0..BF_ROWS as f64).contains(&row)
}

/// Web `_enemiesOf(ru)` (`battleScene.ts:8291-8294`): przeciwna strona bez jednostek martwych, znikajacych i rozbitych.
pub fn enemies_of_kite(me: BattleSide, units: &[KiteUnit]) -> Vec<KiteUnit> {
    units
        .iter()
        .copied()
        .filter(|u| u.side != me && !u.dead && !u.fading_out && !u.routed)
        .collect()
}

/// Web `_nearestEnemyMelee(ru)` (`battleScene.ts:8315-8324`): najblizszy wrog bez `primaryRanged`; przy remisie
/// dystansu wygrywa pierwszy z `_enemiesOf` (ostre `<`).
pub fn nearest_enemy_melee(me: &KiteUnit, units: &[KiteUnit]) -> Option<KiteUnit> {
    let mut best: Option<KiteUnit> = None;
    let mut best_d = f64::INFINITY;
    for e in enemies_of_kite(me.side, units) {
        if e.primary_ranged {
            continue; // web: if (e.primaryRanged) continue;
        }
        let dd = manhattan(me.tile, e.tile);
        if dd < best_d {
            best_d = dd;
            best = Some(e);
        }
    }
    best
}

/// Predykat warunku galezi 1 KITE w `_rangedAction` (`battleScene.ts:6689-6691`):
/// `ru.primaryRanged && ru.rangedKite !== false` oraz `meleeThreat && manhattan(ru, meleeThreat) <= MELEE_SAFE_GAP`.
/// Nie wykonuje ruchu ani strzalu (cialo galezi to T5b/T8).
pub fn kite_branch_applies(me: &KiteUnit, ranged_kite: bool, units: &[KiteUnit]) -> bool {
    if !(me.primary_ranged && ranged_kite) {
        return false;
    }
    match nearest_enemy_melee(me, units) {
        Some(threat) => manhattan(me.tile, threat.tile) <= MELEE_SAFE_GAP,
        None => false,
    }
}

/// Web `_bestKiteShotStep(ru, threat)` (`battleScene.ts:6959-7002`): krok WSTECZ o jeden kafelek (z DIRS4), ktory
/// oddala od zagrozenia melee, pozwala dalej strzelac i nie laduje obok zadnego wroga.
///
/// * `occupied` = web `occByKey.has(nk)`, `passable` = web `_passableForUnit(ru, nc, nr)`,
/// * `threat` = przekazane `threat` (web: `meleeThreat`), `units` = wszystkie jednostki (filtr `_enemiesOf` wewnatrz),
/// * zwraca kafelek kandydata (web `cellKey` zwrocony jako wspolrzedne), albo `None`.
///
/// Wybor: wiekszy `gapScore = gap*100 + (movedBackAxis ? 50 : 0)`; przy remisie mniejszy `lateral` (ostro `<`),
/// przy pelnym remisie wygrywa pierwszy z DIRS4.
pub fn best_kite_shot_step(
    me: &KiteUnit,
    threat: Tile,
    units: &[KiteUnit],
    occupied: &dyn Fn(f64, f64) -> bool,
    passable: &dyn Fn(f64, f64) -> bool,
) -> Option<Tile> {
    let dir = advance_dir(me.side); // web: forward dir; we want the OPPOSITE
    let enemies = enemies_of_kite(me.side, units);
    if enemies.is_empty() {
        return None; // web: if (enemies.length === 0) return null;
    }
    let d_now = manhattan(me.tile, threat);
    let (ux, uy) = me.tile;

    let mut best: Option<Tile> = None;
    let mut best_gap = f64::NEG_INFINITY;
    let mut best_lateral = f64::INFINITY;
    for (dc, dr) in DIRS4 {
        let (nc, nr) = (ux + dc, uy + dr);
        if !in_bounds(nc, nr) {
            continue;
        }
        if occupied(nc, nr) {
            continue;
        }
        if !passable(nc, nr) {
            continue;
        }

        // Distances FROM the candidate tile.
        let mut d_min_any = f64::INFINITY;
        let mut in_range_of_some = false;
        for e in &enemies {
            let dd = manhattan((nc, nr), e.tile);
            if dd < d_min_any {
                d_min_any = dd;
            }
            if dd >= 1.0 && dd <= me.range {
                in_range_of_some = true;
            }
        }
        // Never back ONTO a tile adjacent to ANY enemy.
        if d_min_any <= 1.0 {
            continue;
        }
        // Must STILL be able to fire from here (otherwise the kite wastes the turn).
        if !in_range_of_some {
            continue;
        }

        let gap = manhattan((nc, nr), threat);
        if gap <= d_now {
            continue; // must open the gap from the melee threat
        }

        let moved_back_axis = (nc - ux) == -dir; // a pure backward axis step
        let lateral = (nr - uy).abs();
        let gap_score = gap * 100.0 + if moved_back_axis { 50.0 } else { 0.0 };
        if gap_score > best_gap || (gap_score == best_gap && lateral < best_lateral) {
            best_gap = gap_score;
            best_lateral = lateral;
            best = Some((nc, nr));
        }
    }
    best
}
