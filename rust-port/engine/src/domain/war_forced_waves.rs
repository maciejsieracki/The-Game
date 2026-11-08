//! P6-FORCED-WAR-MODULES-Q1 (runda 3, partia G3a): fale wojny wymuszonej z
//! `gra/src/game/forced-war-waves.ts` (pin `origin/main`), 1:1:
//! - `approachSectorForHex` (sektor 0..5 od celu ku punktowi zbiorki; JS `Math.round` = [`js_round`]),
//! - `planForcedWarWave` (kotwica = najwiekszy lokalny klaster jednostek, cel = najblizsze miasto
//!   spoza puli historii; z aktywnymi falami/historia ranking: cel, sektor, odstep sektora),
//! - `pruneForcedWarWaves` (zdobyte/martwe/w pelni zaangazowane fale -> historia),
//! - `serializeForcedWarWaves` / `restoreForcedWarWaves` (walidacja wejscia JSON jak w webie),
//! - `emptyForcedWarWaveState`, `hexDistanceForForcedWar`.
//!
//! ZALOZENIA / ODSTEPSTWA (opisane w `dyspozycje/rust-port/p6/P6-FORCED-WAR-MODULES.md`, sekcja 2b):
//! - `isCivilianUnit` (zbiory w `units/setup.ts`) NIE jest portowane tutaj: wywolujacy podaje
//!   wynik jako pole `is_civilian` (wektory liczone przez prawdziwy web ze stubem zwracajacym to pole).
//! - Porownanie identyfikatorow (`localeCompare`) = porzadek bajtowy Rust; poprawne dla identyfikatorow
//!   jednostek/miast z alfabetu malych liter, cyfr i `-` (zalozenie, potwierdzone wektorami).
//! - Liczby (wspolrzedne, sektory, tury) jako `f64`: lustrzane do JS `number`.
//! - `restore`: pola nieliczbowe / zlego ksztaltu w falach (np. `createdTurn` inny niz liczba) daja
//!   0 zamiast surowej wartosci webu; nieznane pola fali sa odrzucane. Wektory nie zawieraja tych
//!   przypadkow (dane zapisu produkowane przez `serialize` maja zawsze poprawny ksztalt).
//! - Pozostaje poza zakresem G3a: timer/trigger wojny wymuszonej z `main.ts` (wejscie AI w epoke,
//!   sprzatanie przy pokoju, `sweepStaleForcedWarEntries`, podpiecie planu do tury).

use std::collections::HashSet;

use serde_json::Value;

/// Web `ARMY_CONCENTRATION_MIN_UNITS` (army-concentration.ts).
pub const ARMY_CONCENTRATION_MIN_UNITS: usize = 3;
/// Web `ARMY_CONCENTRATION_RADIUS` (army-concentration.ts).
pub const ARMY_CONCENTRATION_RADIUS: f64 = 4.0;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct WaveHex {
    pub q: f64,
    pub r: f64,
}

/// Pola `RuntimeUnit` potrzebne przez fale (web: `eligibleWaveUnit`, `planForcedWarWave`, `prune`).
#[derive(Debug, Clone, PartialEq)]
pub struct WaveUnit {
    pub id: String,
    pub owner_id: i64,
    pub category: String,
    pub q: f64,
    pub r: f64,
    pub ruch_left: f64,
    pub is_civilian: bool,
    pub in_garnizon: bool,
    pub oblega_city_id: Option<String>,
    pub embarked: bool,
    pub sea_raider: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct WaveCity {
    pub id: String,
    pub owner_id: i64,
    pub q: f64,
    pub r: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ForcedWarWave {
    pub id: String,
    pub target_city_id: String,
    pub unit_ids: Vec<String>,
    pub origin_hex: WaveHex,
    pub rally_point: WaveHex,
    pub approach_sector: f64,
    pub created_turn: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ForcedWarWaveHistory {
    pub target_city_id: String,
    pub origin_hex: WaveHex,
    pub rally_point: WaveHex,
    pub approach_sector: f64,
    pub created_turn: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ForcedWarWaveState {
    pub next_wave_id: f64,
    pub waves: Vec<ForcedWarWave>,
    pub history: Vec<ForcedWarWaveHistory>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct ForcedWarWavePlan {
    pub target_city_id: String,
    pub unit_ids: Vec<String>,
    pub move_unit_ids: Vec<String>,
    pub deferred_unit_ids: Vec<String>,
    pub origin_hex: WaveHex,
    pub rally_point: WaveHex,
    pub approach_sector: f64,
    pub created_turn: f64,
}

fn cmp_f64(a: f64, b: f64) -> std::cmp::Ordering {
    a.partial_cmp(&b).unwrap_or(std::cmp::Ordering::Equal)
}

/// Web `hexDistance` (units/setup.ts): max(|dq|, |dr|, |ds|), s = -q - r.
pub fn hex_distance(a: WaveHex, b: WaveHex) -> f64 {
    let dq = (a.q - b.q).abs();
    let dr = (a.r - b.r).abs();
    let ds = ((-a.q - a.r) - (-b.q - b.r)).abs();
    dq.max(dr).max(ds)
}

pub fn hex_distance_for_forced_war(a: WaveHex, b: WaveHex) -> f64 {
    hex_distance(a, b)
}

/// JS `Math.round` (połówki w stronę +∞): dokładne, bez błędu `floor(x + 0.5)`.
fn js_round(x: f64) -> f64 {
    let f = x.floor();
    if x - f >= 0.5 {
        f + 1.0
    } else {
        f
    }
}

/// Web `approachSectorForHex`: stabilny sektor 0..5 od celu w kierunku punktu.
pub fn approach_sector_for_hex(target: WaveHex, origin: WaveHex) -> f64 {
    if target.q == origin.q && target.r == origin.r {
        return 0.0;
    }
    let angle = (origin.r - target.r).atan2(origin.q - target.q);
    let rounded = js_round(angle / (std::f64::consts::PI * 2.0) * 6.0);
    ((rounded % 6.0) + 6.0) % 6.0
}

fn sector_distance(a: f64, b: f64) -> f64 {
    let d = (a - b).abs() % 6.0;
    d.min(6.0 - d)
}

fn wave_hex(q: f64, r: f64) -> WaveHex {
    WaveHex { q, r }
}

fn unit_hex(u: &WaveUnit) -> WaveHex {
    wave_hex(u.q, u.r)
}

fn city_hex(c: &WaveCity) -> WaveHex {
    wave_hex(c.q, c.r)
}

fn history_from_wave(w: &ForcedWarWave) -> ForcedWarWaveHistory {
    ForcedWarWaveHistory {
        target_city_id: w.target_city_id.clone(),
        origin_hex: w.origin_hex,
        rally_point: w.rally_point,
        approach_sector: w.approach_sector,
        created_turn: w.created_turn,
    }
}

fn eligible_wave_unit(u: &WaveUnit, excluded: &HashSet<String>) -> bool {
    !excluded.contains(&u.id)
        && u.ruch_left > 0.0
        && !u.is_civilian
        && !u.in_garnizon
        && u.oblega_city_id.is_none()
        && !u.embarked
        && !u.sea_raider
        && u.category != "galera"
}

fn compare_unit(a: &WaveUnit, b: &WaveUnit) -> std::cmp::Ordering {
    cmp_f64(a.q, b.q)
        .then(cmp_f64(a.r, b.r))
        .then(a.id.cmp(&b.id))
}

/// Wynik `targetForAnchor` (web): miasto, sektor i trzy klucze rankingu.
struct AnchorTarget<'a> {
    city: &'a WaveCity,
    sector: f64,
    target_different: u8,
    sector_different: u8,
    sector_gap: f64,
}

fn target_for_anchor<'a>(
    anchor: WaveHex,
    cities: &'a [WaveCity],
    excluded_targets: &HashSet<&str>,
    hex_distance_fn: &dyn Fn(WaveHex, WaveHex) -> f64,
    prior_sectors: &[f64],
) -> Option<AnchorTarget<'a>> {
    let preferred: Vec<&WaveCity> = cities
        .iter()
        .filter(|c| !excluded_targets.contains(c.id.as_str()))
        .collect();
    let candidates: Vec<&WaveCity> = if preferred.is_empty() {
        cities.iter().collect()
    } else {
        preferred
    };
    if candidates.is_empty() {
        return None;
    }
    let mut sorted = candidates;
    sorted.sort_by(|a, b| {
        cmp_f64(
            hex_distance_fn(anchor, city_hex(a)),
            hex_distance_fn(anchor, city_hex(b)),
        )
        .then(cmp_f64(a.q, b.q))
        .then(cmp_f64(a.r, b.r))
        .then(a.id.cmp(&b.id))
    });
    let city = sorted[0];
    let sector = approach_sector_for_hex(city_hex(city), anchor);
    let sector_gap = if prior_sectors.is_empty() {
        0.0
    } else {
        prior_sectors
            .iter()
            .map(|&s| sector_distance(sector, s))
            .fold(f64::INFINITY, f64::min)
    };
    Some(AnchorTarget {
        city,
        sector,
        target_different: u8::from(!excluded_targets.contains(city.id.as_str())),
        sector_different: u8::from(!prior_sectors.contains(&sector)),
        sector_gap,
    })
}

struct WaveCandidate<'a> {
    anchor: &'a WaveUnit,
    group: Vec<&'a WaveUnit>,
    sum: f64,
    target: &'a WaveCity,
    sector: f64,
    target_different: u8,
    sector_different: u8,
    sector_gap: f64,
}

/// Web `planForcedWarWave`. `hex_distance_fn` = `hexDistanceFn` (ranking miast); grupowanie
/// jednostek zawsze używa `hex_distance` (jak w webie).
pub fn plan_forced_war_wave(
    units: &[WaveUnit],
    target_cities: &[WaveCity],
    active_waves: &[ForcedWarWave],
    excluded_unit_ids: &HashSet<String>,
    hex_distance_fn: &dyn Fn(WaveHex, WaveHex) -> f64,
    created_turn: f64,
    wave_history: &[ForcedWarWaveHistory],
) -> Option<ForcedWarWavePlan> {
    let mut eligible: Vec<&WaveUnit> = units
        .iter()
        .filter(|u| eligible_wave_unit(u, excluded_unit_ids))
        .collect();
    eligible.sort_by(|a, b| compare_unit(a, b));
    if eligible.len() < ARMY_CONCENTRATION_MIN_UNITS {
        return None;
    }
    let mut excluded_targets: HashSet<&str> = HashSet::new();
    for w in active_waves {
        excluded_targets.insert(w.target_city_id.as_str());
    }
    for w in wave_history {
        excluded_targets.insert(w.target_city_id.as_str());
    }
    let prior_sectors: Vec<f64> = active_waves
        .iter()
        .map(|w| w.approach_sector)
        .chain(wave_history.iter().map(|w| w.approach_sector))
        .collect();

    let mut candidates: Vec<WaveCandidate> = Vec::new();
    for &anchor in &eligible {
        let anchor_hex = unit_hex(anchor);
        let group: Vec<&WaveUnit> = eligible
            .iter()
            .copied()
            .filter(|u| hex_distance(unit_hex(u), anchor_hex) <= ARMY_CONCENTRATION_RADIUS)
            .collect();
        if group.len() < ARMY_CONCENTRATION_MIN_UNITS {
            continue;
        }
        let Some(chosen) = target_for_anchor(
            anchor_hex,
            target_cities,
            &excluded_targets,
            hex_distance_fn,
            &prior_sectors,
        ) else {
            continue;
        };
        let sum = group
            .iter()
            .map(|u| hex_distance(unit_hex(u), anchor_hex))
            .sum::<f64>();
        candidates.push(WaveCandidate {
            anchor,
            group,
            sum,
            target: chosen.city,
            sector: chosen.sector,
            target_different: chosen.target_different,
            sector_different: chosen.sector_different,
            sector_gap: chosen.sector_gap,
        });
    }
    if candidates.is_empty() {
        return None;
    }
    let use_history = !active_waves.is_empty() || !wave_history.is_empty();
    candidates.sort_by(|a, b| {
        if use_history {
            b.target_different
                .cmp(&a.target_different)
                .then(b.sector_different.cmp(&a.sector_different))
                .then(cmp_f64(b.sector_gap, a.sector_gap))
                .then(b.group.len().cmp(&a.group.len()))
                .then(cmp_f64(a.sum, b.sum))
                .then(cmp_f64(a.anchor.q, b.anchor.q))
                .then(cmp_f64(a.anchor.r, b.anchor.r))
                .then(a.anchor.id.cmp(&b.anchor.id))
        } else {
            b.group
                .len()
                .cmp(&a.group.len())
                .then(cmp_f64(a.sum, b.sum))
                .then(cmp_f64(a.anchor.q, b.anchor.q))
                .then(cmp_f64(a.anchor.r, b.anchor.r))
                .then(a.anchor.id.cmp(&b.anchor.id))
        }
    });
    let best = candidates.into_iter().next()?;
    let unit_ids: Vec<String> = best.group.iter().map(|u| u.id.clone()).collect();
    let move_unit_ids: Vec<String> = best
        .group
        .iter()
        .filter(|u| u.id != best.anchor.id)
        .map(|u| u.id.clone())
        .collect();
    let anchor_hex = unit_hex(best.anchor);
    Some(ForcedWarWavePlan {
        target_city_id: best.target.id.clone(),
        deferred_unit_ids: unit_ids.clone(),
        unit_ids,
        move_unit_ids,
        origin_hex: anchor_hex,
        rally_point: anchor_hex,
        approach_sector: best.sector,
        created_turn,
    })
}

/// Web `pruneForcedWarWaves`. `None` wejscia = `undefined`; wynik `None` = `undefined`.
pub fn prune_forced_war_waves(
    state: Option<&ForcedWarWaveState>,
    attacker_id: i64,
    target_owner_id: i64,
    units: &[WaveUnit],
    cities: &[WaveCity],
) -> Option<ForcedWarWaveState> {
    let state = state?;
    let mut kept: Vec<ForcedWarWave> = Vec::new();
    let mut history: Vec<ForcedWarWaveHistory> = state.history.clone();
    for wave in &state.waves {
        let Some(city) = cities.iter().find(|c| c.id == wave.target_city_id) else {
            history.push(history_from_wave(wave));
            continue;
        };
        if city.owner_id != target_owner_id {
            history.push(history_from_wave(wave));
            continue;
        }
        let live: Vec<&WaveUnit> = wave
            .unit_ids
            .iter()
            .filter_map(|id| {
                units
                    .iter()
                    .find(|u| u.id == *id && u.owner_id == attacker_id)
            })
            .collect();
        if live.is_empty() {
            history.push(history_from_wave(wave));
            continue;
        }
        let city_hex = city_hex(city);
        let fully_engaged = live.iter().all(|u| {
            u.oblega_city_id.as_deref() == Some(wave.target_city_id.as_str())
                || hex_distance(unit_hex(u), city_hex) <= 1.0
        });
        if fully_engaged {
            history.push(history_from_wave(wave));
            continue;
        }
        kept.push(ForcedWarWave {
            unit_ids: live.iter().map(|u| u.id.clone()).collect(),
            ..wave.clone()
        });
    }
    if kept.is_empty() && history.is_empty() {
        None
    } else {
        Some(ForcedWarWaveState {
            next_wave_id: state.next_wave_id.max(1.0),
            waves: kept,
            history,
        })
    }
}

pub fn empty_forced_war_wave_state() -> ForcedWarWaveState {
    ForcedWarWaveState {
        next_wave_id: 1.0,
        waves: Vec::new(),
        history: Vec::new(),
    }
}

/// Web `serializeForcedWarWaves` (Map -> tablica par w kolejnosci wstawiania; kopie wartosci).
pub fn serialize_forced_war_waves(
    states: &[(String, ForcedWarWaveState)],
) -> Vec<(String, ForcedWarWaveState)> {
    states.to_vec()
}

fn parse_hex(v: Option<&Value>) -> Option<WaveHex> {
    let o = v?.as_object()?;
    Some(wave_hex(o.get("q")?.as_f64()?, o.get("r")?.as_f64()?))
}

fn restore_wave(w: &Value) -> Option<ForcedWarWave> {
    let o = w.as_object()?;
    let id = o.get("id")?.as_str()?.to_string();
    let target_city_id = o.get("targetCityId")?.as_str()?.to_string();
    let unit_ids = o
        .get("unitIds")?
        .as_array()?
        .iter()
        .filter_map(|v| v.as_str().map(str::to_string))
        .collect();
    let origin_hex = parse_hex(o.get("originHex"))?;
    let rally_point = parse_hex(o.get("rallyPoint"))?;
    let approach_sector = o.get("approachSector")?.as_f64()?;
    let created_turn = o.get("createdTurn").and_then(Value::as_f64).unwrap_or(0.0);
    Some(ForcedWarWave {
        id,
        target_city_id,
        unit_ids,
        origin_hex,
        rally_point,
        approach_sector,
        created_turn,
    })
}

fn restore_history(w: &Value) -> Option<ForcedWarWaveHistory> {
    let o = w.as_object()?;
    let target_city_id = o.get("targetCityId")?.as_str()?.to_string();
    let origin_hex = parse_hex(o.get("originHex"))?;
    let rally_point = parse_hex(o.get("rallyPoint"))?;
    let approach_sector = o.get("approachSector")?.as_f64()?;
    let created_turn = o.get("createdTurn").and_then(Value::as_f64).unwrap_or(0.0);
    Some(ForcedWarWaveHistory {
        target_city_id,
        origin_hex,
        rally_point,
        approach_sector,
        created_turn,
    })
}

/// Web `restoreForcedWarWaves`. Duplikat klucza nadpisuje wartosc na pierwotnej pozycji (semantyka Map).
pub fn restore_forced_war_waves(saved: &Value) -> Vec<(String, ForcedWarWaveState)> {
    let mut out: Vec<(String, ForcedWarWaveState)> = Vec::new();
    let Some(rows) = saved.as_array() else {
        return out;
    };
    for row in rows {
        let Some(row) = row.as_array() else {
            continue;
        };
        let Some(key) = row.first().and_then(Value::as_str) else {
            continue;
        };
        let Some(raw) = row.get(1).and_then(Value::as_object) else {
            continue;
        };
        let Some(raw_waves) = raw.get("waves").and_then(Value::as_array) else {
            continue;
        };
        let waves: Vec<ForcedWarWave> = raw_waves.iter().filter_map(restore_wave).collect();
        let history: Vec<ForcedWarWaveHistory> = raw
            .get("history")
            .and_then(Value::as_array)
            .map(|h| h.iter().filter_map(restore_history).collect())
            .unwrap_or_default();
        let next_wave_id = match raw.get("nextWaveId").and_then(Value::as_f64) {
            Some(n) => n.max(1.0),
            None => waves.len() as f64 + 1.0,
        };
        let state = ForcedWarWaveState {
            next_wave_id,
            waves,
            history,
        };
        match out.iter().position(|(k, _)| k == key) {
            Some(pos) => out[pos].1 = state,
            None => out.push((key.to_string(), state)),
        }
    }
    out
}
