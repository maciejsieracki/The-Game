//! P6 SIEGE-TAKTYKA K0b (#217, runda 1 Operatora): czyste funkcje podejscia oblezniczego.
//!
//! Port 1:1 z `gra/src/battle/battleScene.ts` (pin `07d2fbd72`):
//! * [`threat_slack`] = `_threatSlack` (`battleScene.ts:7939-7943`, `private static`): `min_t(|col-t.q| + |row-t.r| - t.range)`,
//!   pusta lista -> `+Infinity`. Minimum liczone jak JS `Math.min` (NaN propaguje sie, nie jest ignorowane).
//! * [`siege_shooter_threats`] = `_siegeShooterThreats` (`battleScene.ts:7924-7937`): zagrozenia ostrzalu obroncow
//!   (jednostki dystansowe z amunicja + wiezyczki muru).
//! * [`siege_approach_restricted`] = `_siegeApproachRestricted` (`battleScene.ts:7951-7960`), galezie (a)-(e) z tabeli
//!   wiersza 19 `P6-SIEGE-TAKTYKA.md`.
//!
//! Zaleznosci stanu sceny (`this._*`) i funkcji pomocniczych sa WEJSCIAMI JAWNYMI, nie sa tu stubowane po cichu:
//! * `canShoot(d)` (`battleScene.ts:1457`) -> pole `can_shoot` / `can_shoot` jednostki (wynik wywolujacego),
//! * `isSiegeUnit(ru.bu)` (`battleScene.ts:1552`) -> pole `is_siege_unit`,
//! * `this._applyTerrainRange(d)` (mutuje `d.range`, zalezy od terenu) -> parametr `terrain_range`: funkcja zwracajaca
//!   wartosc `d.range` PO zastosowaniu zasiegu terenowego. Wywolywana tylko dla obroncow, ktorzy przeszli straze
//!   (jak w webie), wiec wynik jest identyczny z mutacja w webie,
//! * pola sceny `siegeWallCol`, `siegeTowers`, `towerRange`, `gateOpen`, `wallEverBreached`, `siegeWallTilesInit`,
//!   `wallTileHp.size`, `towerAtWallRows.size` -> pola struktur [`SiegeTowerRef`], [`ApproachWallState`].
//!
//! K1 (runda 1): [`siege_move_refused`] = `_siegeMoveRefused` (wiersz 29, PORTED) oraz [`siege_safe_approach_goal`] =
//! czesc decyzyjna `_siegeSafeApproach` (wiersz 30, PARTIAL: petla `_siegeWalkTo`/`_bfsFirstStep`/`_doMove` nie
//! jest portowana). Zagrozenia i przechodniosc sa wejsciami jawnymi.
//!
//! Nie portowano (BRAK, poza tym modulem): `_applyTerrainRange` (sam zasieg terenu), `canShoot`, `isSiegeUnit`,
//! `_siegeWalkTo` / `_bfsFirstStep` (efekty marszu sceny).
//! Patrz `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md`.

/// Zrodlo ostrzalu `{q, r, range}` (web `Array<{ q: number; r: number; range: number }>`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Threat {
    pub q: f64,
    pub r: f64,
    pub range: f64,
}

/// Obronca jako dane wejsciowe `_siegeShooterThreats` (pola `d` z `this.def`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ShooterDefender {
    pub q: f64,
    pub r: f64,
    pub dead: bool,
    pub fading_out: bool,
    pub removed: bool,
    pub routed: bool,
    /// Wynik `canShoot(d)` (web `battleScene.ts:1457`).
    pub can_shoot: bool,
    /// Web `d.rangeBase`.
    pub range_base: f64,
}

/// Wieza oblezenia (pola `t` z `this.siegeTowers`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SiegeTowerRef {
    pub destroyed: bool,
    pub row: f64,
}

/// Stan muru potrzebny do `_siegeApproachRestricted` (pola sceny).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ApproachWallState {
    /// Web `this.siegeWallCol >= 0` (wartosc negowana w galezi (a): `!(siegeWallCol >= 0)`).
    pub wall_col_ge0: bool,
    pub gate_open: bool,
    pub wall_ever_breached: bool,
    /// Web `this.siegeWallTilesInit`.
    pub wall_tiles_init: usize,
    /// Web `this.wallTileHp.size`.
    pub wall_tiles_alive: usize,
    /// Web `this.towerAtWallRows.size`.
    pub tower_at_wall_rows_count: usize,
}

/// Atakujacy jako dane wejsciowe `_siegeApproachRestricted` (pola `ru`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ApproachUnit {
    /// Web `ru.side === 'atk'` (false = `ru.side !== 'atk'`).
    pub side_atk: bool,
    pub routed: bool,
    pub on_wall_walkway: bool,
    /// Wynik `isSiegeUnit(ru.bu)` (web `battleScene.ts:1552`).
    pub is_siege_unit: bool,
    pub primary_ranged: bool,
    /// Wynik `canShoot(ru)` (web `battleScene.ts:1457`).
    pub can_shoot: bool,
    /// Web `ru.shootingEnabled === false` (wartosc `undefined` to NIE jest wylaczenie: `!== false` jest prawdziwe).
    pub shooting_disabled: bool,
    pub mounted: bool,
}

/// Web `Math.min(a, b)` dla dwoch liczb: NaN propaguje sie (w przeciwienstwie do `f64::min`).
fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        f64::NAN
    } else if a <= b {
        a
    } else {
        b
    }
}

/// Web `battleScene.ts:7939-7943` `_threatSlack(threats, col, row)`.
///
/// Pusta lista -> `f64::INFINITY` (web `let m = Infinity`).
pub fn threat_slack(threats: &[Threat], col: f64, row: f64) -> f64 {
    let mut m = f64::INFINITY;
    for t in threats {
        m = js_min(m, (col - t.q).abs() + (row - t.r).abs() - t.range);
    }
    m
}

/// Web `battleScene.ts:7924-7937` `_siegeShooterThreats()`.
///
/// `terrain_range(d)` = wynik `this._applyTerrainRange(d)` na `d.range` (patrz opis modulu). Wywolywane tylko dla
/// obroncow, ktorzy przeszli straze (`!dead && !fadingOut && !removed && !routed`, `canShoot`, `rangeBase > 0`).
/// Wiezyczki bez zniszczenia dodaja zagrozenie `{ q: siegeWallCol, r: t.row, range: towerRange }`.
pub fn siege_shooter_threats<F>(
    defenders: &[ShooterDefender],
    towers: &[SiegeTowerRef],
    siege_wall_col: f64,
    tower_range: f64,
    mut terrain_range: F,
) -> Vec<Threat>
where
    F: FnMut(&ShooterDefender) -> f64,
{
    let mut out = Vec::new();
    for d in defenders {
        if d.dead || d.fading_out || d.removed || d.routed {
            continue;
        }
        if !d.can_shoot || d.range_base <= 0.0 {
            continue;
        }
        let range = terrain_range(d);
        if range >= 1.0 {
            out.push(Threat {
                q: d.q,
                r: d.r,
                range,
            });
        }
    }
    for t in towers {
        if t.destroyed {
            continue;
        }
        out.push(Threat {
            q: siege_wall_col,
            r: t.row,
            range: tower_range,
        });
    }
    out
}

/// Web `battleScene.ts:7951-7960` `_siegeApproachRestricted(ru)`.
///
/// Galezie (zgodnie z kolejnoscia w webie):
/// * (a) `!(siegeWallCol >= 0) || ru.side !== 'atk'` -> `false`,
/// * (b) `ru.routed || ru.onWallWalkway || isSiegeUnit(ru.bu)` -> `false`,
/// * (c) `ru.primaryRanged && canShoot(ru) && ru.shootingEnabled !== false` -> `false` (strzelec),
/// * (d) `ru.mounted` -> `!(gateOpen || tileBreached)`, gdzie `tileBreached = wallTilesInit > 0 && wallTileHp.size < wallTilesInit`,
/// * (e) piechota -> `!(wallEverBreached || towerAtWallRows.size > 0)`.
pub fn siege_approach_restricted(ru: &ApproachUnit, wall: &ApproachWallState) -> bool {
    // (a)
    if !wall.wall_col_ge0 || !ru.side_atk {
        return false;
    }
    // (b)
    if ru.routed || ru.on_wall_walkway || ru.is_siege_unit {
        return false;
    }
    // (c)
    if ru.primary_ranged && ru.can_shoot && !ru.shooting_disabled {
        return false;
    }
    // (d)
    if ru.mounted {
        let tile_breached =
            wall.wall_tiles_init > 0 && wall.wall_tiles_alive < wall.wall_tiles_init;
        return !(wall.gate_open || tile_breached);
    }
    // (e)
    !(wall.wall_ever_breached || wall.tower_at_wall_rows_count > 0)
}

/// Web `battleScene.ts:7962-7970` `_siegeMoveRefused(ru, col, row)`.
///
/// Wejscia jawne: `threats` = wynik `_siegeShooterThreats()` (patrz [`siege_shooter_threats`]; web wywoluje go dopiero po
/// przejsciu straznika `_siegeApproachRestricted`, tu lista jest liczona przez wywolujacego). `from` = `(ru.q, ru.r)`,
/// `to` = `(col, row)`. Galezie zgodne z webem:
/// * `!_siegeApproachRestricted(ru)` -> `false`,
/// * pusta lista zagrozen -> `false`,
/// * `slack(to) > 0` -> `false`,
/// * w przeciwnym razie odmowa tylko gdy krok nie zmniejsza zagrozenia: `slack(to) < slack(from)`.
///
/// NaN: porownania JS (`>`, `<`) na NaN sa fałszywe, tak samo jak w Rust `f64`, wiec wynik jest identyczny.
pub fn siege_move_refused(
    ru: &ApproachUnit,
    wall: &ApproachWallState,
    threats: &[Threat],
    from: (f64, f64),
    to: (f64, f64),
) -> bool {
    if !siege_approach_restricted(ru, wall) {
        return false;
    }
    if threats.is_empty() {
        return false;
    }
    let to_slack = threat_slack(threats, to.0, to.1);
    if to_slack > 0.0 {
        return false;
    }
    to_slack < threat_slack(threats, from.0, from.1)
}

/// Web `battleScene.ts:661-662` `BF_COLS` / `BF_ROWS` (pelne pole).
pub const BF_COLS: i64 = 68;
/// Web `battleScene.ts:662` `BF_ROWS`.
pub const BF_ROWS: i64 = 156;
/// Web `battleScene.ts:337` `DIRS4` = `DIR_DELTA` (kolejnosc N, E, S, W; `battleScene.ts:326-331`).
const DIRS4: [(i64, i64); 4] = [(0, -1), (1, 0), (0, 1), (-1, 0)];
/// Limit odwiedzin BFS z `_siegeSafeApproach` (`battleScene.ts:8115`, `head < 6000`).
pub const SAFE_APPROACH_MAX_VISITED: usize = 6000;

/// Web `battleScene.ts:8107-8136` `_siegeSafeApproach(ru, tc, tr, done)` -- CZESC DECYZYJNA.
///
/// Zwraca kafel celu (najblizszy `(tc, tr)` sposrod bezpiecznych, osiagalnych kafli BFS), albo `None` gdy web
/// zwraca `false` (brak lepszego bezpiecznego kafla niz pozycja startowa). Start liczy sie jako kandydat tylko
/// gdy jest bezpieczny (`bestD` startuje od manhattan(start) albo `Infinity`); przy remisie wygrywa wczesniej
/// odkryty kafel (scisle `<`).
///
/// * `start` = `(ru.q, ru.r)`, `target` = `(tc, tr)` (f64, zgodnie z webem: NaN przechodzi do `Infinity`-owego `bestD`
///   i nie daje kandydata),
/// * `passable(c, r)` = web `!this.occByKey.has(k) && this._passableForUnit(ru, c, r)` (wejscie jawne),
/// * bezpieczenstwo kafla = `threat_slack(threats, c, r) > 0` (jak `safe` w webie).
///
/// CZESC NIEPORTOWANA (wiersz 30 w `P6-SIEGE-TAKTYKA.md` = PARTIAL): `this._siegeWalkTo(ru, goal, done, safe)` --
/// petla marszu z `_bfsFirstStep`, `_doMove` i `_schedule`; to efekty sceny, bez odpowiednika w tym module.
pub fn siege_safe_approach_goal<P>(
    start: (i64, i64),
    target: (f64, f64),
    threats: &[Threat],
    mut passable: P,
) -> Option<(i64, i64)>
where
    P: FnMut(i64, i64) -> bool,
{
    let safe = |c: i64, r: i64| threat_slack(threats, c as f64, r as f64) > 0.0;
    let dist = |c: i64, r: i64| (c as f64 - target.0).abs() + (r as f64 - target.1).abs();
    let mut best: Option<(i64, i64)> = None;
    let mut best_d: f64 = if safe(start.0, start.1) {
        dist(start.0, start.1)
    } else {
        f64::INFINITY
    };
    let mut seen = std::collections::HashSet::new();
    seen.insert(start);
    let mut frontier: Vec<(i64, i64)> = vec![start];
    let mut head = 0usize;
    while head < frontier.len() && head < SAFE_APPROACH_MAX_VISITED {
        let (cc, cr) = frontier[head];
        head += 1;
        for (dc, dr) in DIRS4 {
            let (nc, nr) = (cc + dc, cr + dr);
            if nc < 0 || nr < 0 || nc >= BF_COLS || nr >= BF_ROWS {
                continue;
            }
            if !seen.insert((nc, nr)) {
                continue;
            }
            if !passable(nc, nr) || !safe(nc, nr) {
                continue;
            }
            let d = dist(nc, nr);
            if d < best_d {
                best_d = d;
                best = Some((nc, nr));
            }
            frontier.push((nc, nr));
        }
    }
    best
}
