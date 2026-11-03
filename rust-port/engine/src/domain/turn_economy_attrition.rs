//! R-RUSTPORT-P6-ECON-TICK-EMPIREFOOD-Q1: atrycja glodowa armii (`army-starvation.ts`) + sprzatanie po zniszczonych
//! jednostkach z `main.ts:34777-34830` (pin weba `4bbef081d`).
//!
//! Portowane (numery linii = web, pin):
//! * [`apply_army_starvation_hp_loss`] = `applyArmyStarvationHpLoss` (`army-starvation.ts:58-87`);
//! * [`sync_runtime_unit_hp_state`] = `syncRuntimeUnitHpState` (`main.ts:29894-29902`), `maxHp` dostarcza wolajacy
//!   (`effectiveRuntimeUnitMaxHp`, zob. `domain/unit_health.rs`);
//! * [`cleanup_after_starvation_destroy`] = inline'owy blok `main.ts:34796-34830` (usuniecie zniszczonych jednostek,
//!   `endMapSiege` w czesci dotyczacej stanu miasta/jednostek, `syncGarnizonForCity`);
//! * [`siege_turn_garrison_attrition`] = czesc czysta bloku N3 "TURA OBLEZENIA" `main.ts:34986-35004` (atrycja garnizonu
//!   miasta oblezonego + `syncGarnizonForCity`). Reszta N3 (`handleSiegeCapitulationPhase`, `resolveSiegeSurrender`,
//!   `tickSiegeMachinesForCity`, `maybeAiAssaultAfterMachines`, panel UI; `main.ts:35005-35030`) NIE jest portowana (dlug).
//!
//! ZALOZENIA (do akceptacji):
//! * Z-EF-1 `Rust City` (`state.rs`) NIE niesie pol `oblegane`/`oblegajacyOwnerId`/`garnizon`/`siegeMachines`
//!   (grep `oblegane|garnizon|siege` po `state.rs` = tylko `garnizon_count` w innej funkcji), wiec stan oblezenia
//!   modeluje [`SiegeCityState`] dostarczany przez wolajacego; modul NIE dotyka `City`.
//! * Z-EF-2 `endMapSiege` (`main.ts:16076-16091`) obejmuje tez stan UI/AI (`siegeAiStateByKey`, `refreshSiegeMarkers`,
//!   `hideSiegeMapPanel`) - NIE portowany (poza silnikiem); modul zwraca liste `ended_sieges`, a wolajacy wykonuje
//!   te efekty uboczne. Czesc silnikowa (`oblegane=false`, `delete oblegajacyOwnerId`, `siegeCapitulationPending=false`,
//!   `clearSiegeMachines`, `delete u.oblegaCityId`, `siegeBesiegerByCity.delete`) jest zaportowana.
//! * Z-EF-3 `cityAtUnit` (`main.ts:11672`) = pierwsze miasto o tym samym `ownerId` i `q,r`.

use std::collections::{BTreeMap, BTreeSet};

use crate::domain::recruitment::army_merge::{js_max, js_min};
use crate::domain::recruitment::manpower::is_civilian_unit;

/// Web `StarvationUnit` + pola `RuntimeUnit` czytane przez blok (`oblegaCityId`, `inGarnizon`, `q`, `r`).
#[derive(Debug, Clone, PartialEq)]
pub struct AttritionUnit {
    pub id: String,
    pub owner_id: i64,
    pub type_id: String,
    pub category: String,
    /// `u.hp` (`undefined`/`null` = `None`).
    pub hp: Option<f64>,
    /// `u.hpMax` (`undefined`/`null` = `None`).
    pub hp_max: Option<f64>,
    pub oblega_city_id: Option<String>,
    pub in_garnizon: bool,
    pub q: f64,
    pub r: f64,
}

/// Web `StarvationResult`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct StarvationResult {
    pub destroyed_ids: Vec<String>,
    pub damaged_count: usize,
}

/// Web `applyArmyStarvationHpLoss` (`army-starvation.ts:58`).
pub fn apply_army_starvation_hp_loss(
    units: &mut [AttritionUnit],
    owner_id: i64,
    hp_frac: f64,
    get_max_hp: &dyn Fn(&str) -> f64,
) -> StarvationResult {
    // `Math.max(0, Math.min(1, hpFrac))`
    let frac = js_max(0.0, js_min(1.0, hp_frac));
    // `frac <= 0`: NaN daje false (idzie dalej, jak web)
    if frac <= 0.0 {
        return StarvationResult::default();
    }
    let mut out = StarvationResult::default();
    for u in units.iter_mut() {
        if u.owner_id != owner_id {
            continue;
        }
        if is_civilian_unit(&u.category, &u.type_id) {
            continue;
        }
        // `u.hpMax ?? getMaxHp(u.typeId)`
        let max_hp = match u.hp_max {
            Some(v) => v,
            None => get_max_hp(&u.type_id),
        };
        // `maxHp <= 0` (NaN -> false)
        if max_hp <= 0.0 {
            continue;
        }
        if u.hp_max.is_none() {
            u.hp_max = Some(max_hp);
        }
        if u.hp.is_none() {
            u.hp = Some(max_hp);
        }
        // `Math.max(1, Math.floor(maxHp * frac))`
        let loss = js_max(1.0, (max_hp * frac).floor());
        let hp = js_max(0.0, u.hp.unwrap_or(max_hp) - loss);
        u.hp = Some(hp);
        out.damaged_count += 1;
        // `u.hp <= 0`
        if hp <= 0.0 {
            out.destroyed_ids.push(u.id.clone());
        }
    }
    out
}

/// Web `syncRuntimeUnitHpState` (`main.ts:29894-29902`): `hpMax = maxHp`; `hp` obciete do `[0, maxHp]` (nieskonczone -> `maxHp`).
/// `max_hp` = `effectiveRuntimeUnitMaxHp(u)` (dostarcza wolajacy).
pub fn sync_runtime_unit_hp_state(u: &mut AttritionUnit, max_hp: f64) -> f64 {
    u.hp_max = Some(max_hp);
    if let Some(hp) = u.hp {
        u.hp = Some(if hp.is_finite() {
            js_max(0.0, js_min(max_hp, hp))
        } else {
            max_hp
        });
    }
    max_hp
}

/// Stan oblezenia miasta (pola `City` weba spoza Rust `City`, Z-EF-1).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeCityState {
    pub id: String,
    pub owner_id: i64,
    pub q: f64,
    pub r: f64,
    pub oblegane: bool,
    pub oblegajacy_owner_id: Option<i64>,
    pub siege_capitulation_pending: bool,
    /// `city.siegeMachines` obecne (`clearSiegeMachines` je kasuje).
    pub has_siege_machines: bool,
    /// `city.garnizon` (`syncGarnizonForCity`).
    pub garnizon: Option<f64>,
}

/// Wynik sprzatania.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct StarvationCleanup {
    /// Miasta, dla ktorych wykonano czesc silnikowa `endMapSiege` (kolejnosc wykonania).
    pub ended_sieges: Vec<String>,
    /// Miasta z przeliczonym `garnizon` (kolejnosc wstawienia do `Map` weba).
    pub garnizon_synced: Vec<String>,
}

fn hex_distance(aq: f64, ar: f64, bq: f64, br: f64) -> f64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    js_max(js_max(dq, dr), ds)
}

/// Web `endMapSiege(cityId)` (`main.ts:16076`) - czesc silnikowa (Z-EF-2).
fn end_map_siege_engine(
    city_id: &str,
    units: &mut [AttritionUnit],
    cities: &mut [SiegeCityState],
    besieger_by_city: &mut BTreeMap<String, i64>,
) {
    if let Some(c) = cities.iter_mut().find(|c| c.id == city_id) {
        c.oblegane = false;
        c.oblegajacy_owner_id = None;
        c.siege_capitulation_pending = false;
        c.has_siege_machines = false;
    }
    for u in units.iter_mut() {
        if u.oblega_city_id.as_deref() == Some(city_id) {
            u.oblega_city_id = None;
        }
    }
    besieger_by_city.remove(city_id);
}

/// Inline'owy blok `main.ts:34796-34830`: po atrycji usuwa zniszczone jednostki, konczy oblezenia bez
/// pozostalego wojska i przelicza garnizony. `destroyed_ids` = zebrane `starv.destroyedIds` (kolejnosc wlascicieli).
pub fn cleanup_after_starvation_destroy(
    units: &mut Vec<AttritionUnit>,
    cities: &mut [SiegeCityState],
    besieger_by_city: &mut BTreeMap<String, i64>,
    destroyed_ids: &[String],
) -> StarvationCleanup {
    let mut out = StarvationCleanup::default();
    if destroyed_ids.is_empty() {
        return out;
    }
    let destroyed: BTreeSet<&str> = destroyed_ids.iter().map(String::as_str).collect();
    // kolejnosc wstawiania `Set`/`Map` weba
    let mut siege_city_ids: Vec<String> = Vec::new();
    let mut garnizon_cities: Vec<String> = Vec::new();
    for u in units.iter() {
        if !destroyed.contains(u.id.as_str()) {
            continue;
        }
        if let Some(cid) = &u.oblega_city_id {
            // web: `if (u.oblegaCityId)` - pusty napis jest falsy
            if !cid.is_empty() && !siege_city_ids.contains(cid) {
                siege_city_ids.push(cid.clone());
            }
        }
        if u.in_garnizon {
            // `cityAtUnit(u)`: pierwsze miasto tego ownera na heksie jednostki
            if let Some(c) = cities
                .iter()
                .find(|c| c.owner_id == u.owner_id && c.q == u.q && c.r == u.r)
            {
                if !garnizon_cities.contains(&c.id) {
                    garnizon_cities.push(c.id.clone());
                }
            }
        }
    }
    units.retain(|u| !destroyed.contains(u.id.as_str()));

    for siege_city_id in &siege_city_ids {
        let still_marked = units
            .iter()
            .any(|x| x.oblega_city_id.as_deref() == Some(siege_city_id.as_str()));
        if still_marked {
            continue;
        }
        let Some(sc) = cities.iter().find(|c| &c.id == siege_city_id) else {
            continue;
        };
        if !sc.oblegane {
            continue;
        }
        let b_id = sc
            .oblegajacy_owner_id
            .or_else(|| besieger_by_city.get(siege_city_id).copied());
        let adj = match b_id {
            Some(b) => units
                .iter()
                .any(|x| x.owner_id == b && hex_distance(x.q, x.r, sc.q, sc.r) == 1.0),
            None => false,
        };
        if !adj {
            end_map_siege_engine(siege_city_id, units, cities, besieger_by_city);
            out.ended_sieges.push(siege_city_id.clone());
        }
    }

    for cid in &garnizon_cities {
        // `syncGarnizonForCity`: `garnizonCountForCity` = jednostki ownera na heksie miasta z `inGarnizon === true`
        let Some(idx) = cities.iter().position(|c| &c.id == cid) else {
            continue;
        };
        let (owner, q, r) = (cities[idx].owner_id, cities[idx].q, cities[idx].r);
        let n = units
            .iter()
            .filter(|u| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)
            .count();
        cities[idx].garnizon = Some(n as f64);
        out.garnizon_synced.push(cid.clone());
    }
    out
}

/// Wynik atrycji garnizonu jednego miasta oblezonego.
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeGarrisonLog {
    pub city_id: String,
    /// `realGarnizonUnits.length` przed atrycja.
    pub before: usize,
    /// `city.garnizon` po `syncGarnizonForCity`.
    pub after: f64,
}

/// Czysta czesc N3 (`main.ts:34986-35004`): dla kazdego ticku `oblegany` (w kolejnosci `econ.perCity`) atrycja HP garnizonu
/// wlasciciela miasta (`applyArmyStarvationHpLoss` na podzbiorze `inGarnizon` na heksie miasta), usuniecie zniszczonych
/// z `units`, `syncGarnizonForCity`. `besieged_city_ids` = `tick.cityId` ticków z `oblegany === true`.
pub fn siege_turn_garrison_attrition(
    units: &mut Vec<AttritionUnit>,
    cities: &mut [SiegeCityState],
    besieged_city_ids: &[String],
    hp_frac: f64,
    get_max_hp: &dyn Fn(&str) -> f64,
) -> Vec<SiegeGarrisonLog> {
    let mut log = Vec::new();
    for city_id in besieged_city_ids {
        let Some(ci) = cities.iter().position(|c| &c.id == city_id) else {
            continue;
        };
        let (owner, q, r) = (cities[ci].owner_id, cities[ci].q, cities[ci].r);
        let idxs: Vec<usize> = units
            .iter()
            .enumerate()
            .filter(|(_, u)| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)
            .map(|(i, _)| i)
            .collect();
        if idxs.is_empty() {
            continue;
        }
        let before = idxs.len();
        // web przekazuje do funkcji NOWA tablice (filter), ale elementy to te same obiekty - hp/hpMax mutuja zywe jednostki
        let mut sub: Vec<AttritionUnit> = idxs.iter().map(|&i| units[i].clone()).collect();
        let starv = apply_army_starvation_hp_loss(&mut sub, owner, hp_frac, get_max_hp);
        for (k, &i) in idxs.iter().enumerate() {
            units[i].hp = sub[k].hp;
            units[i].hp_max = sub[k].hp_max;
        }
        if !starv.destroyed_ids.is_empty() {
            units.retain(|u| !starv.destroyed_ids.contains(&u.id));
        }
        let n = units
            .iter()
            .filter(|u| u.owner_id == owner && u.q == q && u.r == r && u.in_garnizon)
            .count();
        cities[ci].garnizon = Some(n as f64);
        log.push(SiegeGarrisonLog {
            city_id: city_id.clone(),
            before,
            after: n as f64,
        });
    }
    log
}
