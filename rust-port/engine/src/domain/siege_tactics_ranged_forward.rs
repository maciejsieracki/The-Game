//! P6 SIEGE-TAKTYKA K5DOC-T5b (dispatch R-RUSTPORT-P6-K5DOC-T5B-MARSZ, runda 1, Operator): czyste funkcje marszu
//! strzelca ze sceny `07d2fbd72` (`gra/src/battle/battleScene.ts`):
//! * [`enemies_of_forward`] = `_enemiesOf` (`:8291-8294`),
//! * [`nearest_enemy_forward`] = `_nearestEnemy` (`:8296-8304`),
//! * [`best_forward_step`] = `_bestForwardStep` (`:6822-6893`), zwrot `Option<CellKey>`,
//! * [`ranged_forward_step_key`] = czesc decyzyjna `_rangedForwardStep` (`:6777-6787`): flagi, zasieg i wybor klucza
//!   kroku. Zwraca klucz kandydata PRZED bramka `lineAllowsRangedStep` (`:6791-6798`) i PRZED `_doMove` (`:6800`).
//!
//! Poza zakresem T5b (NIE_ZMIERZONO, zob. raport): bramka `lineAllowsRangedStep` (zalezy od
//! `_effectiveMetaForUnit`, `_rangedFiringStepStaysBehindMelee`, `_compactAttackAllowsStep`), cialo `_doMove`
//! i rekurencja `_schedule(STEP_GAP_MS, ...)` / `_rangedAction` po wejsciu w zasieg (`:6800-6811`), wpiecie w
//! `ActivateOps` / `SiegeLoop` (T8 / #113), `_rangedBackStep` i `_bestBackStep` (KITE, T5a).
//!
//! Wejscia jawne: [`ForwardUnit`] (pola `RuntimeBattleUnit` uzywane przez wycinki), lista wszystkich jednostek,
//! lista jednostek strony ruszajacej (web `this.atk` / `this.def`), predykat zajetosci (web `occByKey`) i predykat
//! przejezdnosci (web `_passableForUnit`). Zajetosc w wektorach jest unia jawnych kafelkow i kafelkow wszystkich
//! jednostek, tak jak `occByKey` w grze.
//!
//! Wektory: `tests/p6_k5doc_t5b_vectors/vectors.json`, generowane przez `tests/p6_k5doc_t5b_gen.mjs` (wykonanie tekstu
//! pina przez TypeScript).

use super::siege_tactics_approach::BF_ROWS;
use super::siege_tactics_autobatch::{cell_key, CellKey, BF_COLS};
use super::siege_tactics_end::BattleSide;
use super::siege_tactics_pathstep::Tile;

/// Web `DIRS4` = `DIR_DELTA` (`battleScene.ts:326-331`, `:337`): kolejnosc N, E, S, W.
const DIRS4: [(f64, f64); 4] = [(0.0, -1.0), (1.0, 0.0), (0.0, 1.0), (-1.0, 0.0)];

/// Jednostka widziana przez marsz strzelca: pola `RuntimeBattleUnit` uzywane przez `_rangedForwardStep`,
/// `_bestForwardStep`, `_enemiesOf` i `_nearestEnemy`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ForwardUnit {
    /// Web `(ru.q, ru.r)`.
    pub tile: Tile,
    /// Web `ru.side` (`'atk'` / `'def'`).
    pub side: BattleSide,
    /// Web `ru.range`.
    pub range: f64,
    /// Web `ru.moveLeft`.
    pub move_left: f64,
    /// Web `ru.dead`.
    pub dead: bool,
    /// Web `ru.fadingOut`.
    pub fading_out: bool,
    /// Web `ru.routed`.
    pub routed: bool,
    /// Web `ru.removed`.
    pub removed: bool,
    /// Web `ru.mounted`.
    pub mounted: bool,
    /// Web `isSiegeUnit(ru.bu)` (definicja klas jednostek poza zakresem T5b; tu jako gotowa flaga).
    pub siege: bool,
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

/// Web `if (nc < 0 || nc >= BF_COLS || nr < 0 || nr >= BF_ROWS) continue;` (`battleScene.ts:6832`).
fn in_bounds(col: f64, row: f64) -> bool {
    (0.0..BF_COLS).contains(&col) && (0.0..BF_ROWS as f64).contains(&row)
}

/// Web `_enemiesOf(ru)` (`battleScene.ts:8291-8294`): przeciwna strona bez jednostek martwych, znikajacych i rozbitych.
pub fn enemies_of_forward(me: BattleSide, units: &[ForwardUnit]) -> Vec<ForwardUnit> {
    units
        .iter()
        .copied()
        .filter(|u| u.side != me && !u.dead && !u.fading_out && !u.routed)
        .collect()
}

/// Web `_nearestEnemy(ru)` (`battleScene.ts:8296-8304`): najblizszy wrog wg `_enemiesOf`; przy remisie dystansu
/// wygrywa pierwszy z listy (ostre `<`).
pub fn nearest_enemy_forward(me: &ForwardUnit, units: &[ForwardUnit]) -> Option<ForwardUnit> {
    let mut best: Option<ForwardUnit> = None;
    let mut best_d = f64::INFINITY;
    for e in enemies_of_forward(me.side, units) {
        let dd = manhattan(me.tile, e.tile);
        if dd < best_d {
            best_d = dd;
            best = Some(e);
        }
    }
    best
}

/// Web `_bestForwardStep(ru, nearest)` (`battleScene.ts:6822-6893`): najlepszy sasiedni kafelek (z DIRS4) do marszu
/// strzelca w strone frontu wroga, albo `None`.
///
/// * `nearest` = web `nearest` (tylko `q`, `r` sa uzywane),
/// * `same_side` = web `(ru.side === 'atk' ? this.atk : this.def)` (lista calej strony, takze `me`),
/// * `occupied` = web `occByKey.has(nk)`, `passable` = web `_passableForUnit(ru, nc, nr)`.
///
/// Pierwsza petla: kandydat z DIRS4 odrzucany, gdy poza plansza, zajety, nieprzejezdny, albo gdy
/// `forwardGain <= 0 && rowGap >= 0`. Wybor: mniejsza odleglosc w osi kolumn (`colDist`), przy remisie mniejsza
/// zmiana wiersza (`lateral`, ostro `<`). Remis calkowity rozstrzyga pierwszy z DIRS4 (N, E, S, W).
///
/// Druga petla (tylko gdy pierwsza nic nie zwrocila): BFS po wierszach sojuszniczej koperty `[minRow, maxRow]`
/// (kolejnosc `[row-1, row+1]`), zwraca pierwszy wiersz, z ktorego kolejny kafelek w kierunku marszu jest wolny,
/// przejezdny, w planszy i blizej celu. Zwraca kafelek `(ru.q, first)`.
pub fn best_forward_step(
    me: &ForwardUnit,
    nearest: Tile,
    same_side: &[ForwardUnit],
    occupied: &dyn Fn(f64, f64) -> bool,
    passable: &dyn Fn(f64, f64) -> bool,
) -> Option<CellKey> {
    let dir = advance_dir(me.side);
    let (ux, uy) = me.tile;
    let col_dist_now = (nearest.0 - ux).abs();

    let mut best: Option<(f64, f64)> = None;
    let mut best_col_dist = f64::INFINITY;
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

        // Odleglosc w osi kolumn (osi marszu) od kandydata do wroga.
        let col_dist = (nearest.0 - nc).abs();
        // Zmiana wiersza od aktualnego pasa.
        let lateral = (nr - uy).abs();
        // web: forwardGain > 0 = blizej w osi; rowGap < 0 = blizej w wierszu.
        let forward_gain = col_dist_now - col_dist;
        let row_gap = (nearest.1 - nr).abs() - (nearest.1 - uy).abs();
        if forward_gain <= 0.0 && row_gap >= 0.0 {
            continue;
        }

        if col_dist < best_col_dist || (col_dist == best_col_dist && lateral < best_lateral) {
            best_col_dist = col_dist;
            best_lateral = lateral;
            best = Some((nc, nr));
        }
    }
    if let Some((c, r)) = best {
        return Some(cell_key(c, r));
    }

    // Druga petla (web `:6864-6891`): BFS po wierszach sojuszniczej koperty.
    let allies: Vec<ForwardUnit> = same_side
        .iter()
        .copied()
        .filter(|u| !u.dead && !u.fading_out && !u.removed && !u.routed && !u.mounted && !u.siege)
        .collect();
    let (min_row, max_row) = if allies.is_empty() {
        (uy, uy)
    } else {
        (
            allies
                .iter()
                .map(|u| u.tile.1)
                .fold(f64::INFINITY, f64::min),
            allies
                .iter()
                .map(|u| u.tile.1)
                .fold(f64::NEG_INFINITY, f64::max),
        )
    };
    // web `firstByRow`: wiersz -> pierwszy wiersz na trasie; dla `ru.r` wpis `null` (None).
    let mut first_by_row: Vec<(f64, Option<f64>)> = vec![(uy, None)];
    let mut queue: Vec<f64> = vec![uy];
    let mut i = 0;
    while i < queue.len() {
        let row = queue[i];
        i += 1;
        for nr in [row - 1.0, row + 1.0] {
            if nr < min_row || nr > max_row || first_by_row.iter().any(|(r, _)| *r == nr) {
                continue;
            }
            if occupied(ux, nr) || !passable(ux, nr) {
                continue;
            }
            // web `firstByRow.get(row) ?? nr`: dla `ru.r` (wpis null) pierwszym krokiem jest `nr` samo.
            let parent_first = first_by_row
                .iter()
                .find(|(r, _)| *r == row)
                .and_then(|(_, f)| *f);
            let first = parent_first.unwrap_or(nr);
            first_by_row.push((nr, Some(first)));

            let next_col = ux + dir;
            let next_distance = (nearest.0 - next_col).abs();
            if (0.0..BF_COLS).contains(&next_col)
                && !occupied(next_col, nr)
                && passable(next_col, nr)
                && next_distance < col_dist_now
            {
                return Some(cell_key(ux, first));
            }
            queue.push(nr);
        }
    }
    None
}

/// Czesc decyzyjna web `_rangedForwardStep(ru, done)` (`battleScene.ts:6776-6787`): zwraca klucz kroku, ktory
/// web przekazuje dalej do bramki `lineAllowsRangedStep`, albo `None` (web `done()`).
///
/// Kolejnosc jak w pinie: `finished`, martwy/znikajacy, `moveLeft <= 0`, brak wroga (`_nearestEnemy`),
/// juz w zasiegu (`manhattan <= range`), brak kroku (`_bestForwardStep`).
/// NIE obejmuje bramki `lineAllowsRangedStep` (`:6791-6798`) ani `_doMove` (`:6800`): zob. naglowek modulu.
pub fn ranged_forward_step_key(
    me: &ForwardUnit,
    finished: bool,
    all_units: &[ForwardUnit],
    same_side: &[ForwardUnit],
    occupied: &dyn Fn(f64, f64) -> bool,
    passable: &dyn Fn(f64, f64) -> bool,
) -> Option<CellKey> {
    if finished {
        return None;
    }
    if me.dead || me.fading_out {
        return None;
    }
    if me.move_left <= 0.0 {
        return None;
    }
    let nearest = nearest_enemy_forward(me, all_units)?;
    if manhattan(me.tile, nearest.tile) <= me.range {
        return None; // web: juz w zasiegu, strzal wybiera galaz strzalu
    }
    best_forward_step(me, nearest.tile, same_side, occupied, passable)
}
