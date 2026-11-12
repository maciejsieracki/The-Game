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
//! Nie portowano (BRAK, poza tym modulem): `_siegeMoveRefused` (wiersz 29), `_siegeSafeApproach` (wiersz 30),
//! `_applyTerrainRange` (sam zasieg terenu), `canShoot`, `isSiegeUnit`.
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
