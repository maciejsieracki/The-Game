//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q3-Q1: zdrowie miasta w ticku ekonomii `advanceCityEconomy`
//! (web pin `4bbef081d`, `gra/src/game/turn-economy.ts`).
//!
//! Portowane (numery linii = web, pin):
//! * P10 `loadHealthParams` (`:377-413`, wolane `:2421-2425`) -> [`load_health_params`];
//! * P16 `cityHasWaterAccess` (`:420-445`) -> [`city_has_water_access`];
//! * P16 `scanCityVicinityTerrain` (`:356-372`) -> [`scan_city_vicinity_terrain`];
//! * P16 `computeCityHealth` (`:456-519`, wolane `:2519-2527`) -> [`compute_city_health`].
//!
//! Zalozenia:
//! * `hasBagno` (`:367`) porownuje `hex.terenBazowy as string === 'bagno'`, a `TerenBazowy` weba
//!   (`types/hex.ts:12-24`) ma 8 wartosci BEZ `bagno` (tak samo `TerrainType` Rust), wiec galaz jest
//!   nieosiagalna na typowanej mapie; port zwraca `false` (parametr `kara_bagno` jest ladowany);
//! * wspolrzedne miasta (`f64`) nieoznaczajace heksa calkowitego (ulamkowe, `NaN`, poza `i32`) nie
//!   odpowiadaja zadnemu kluczowi `"q,r"` mapy (klucze mapy sa calkowite), wiec woda = `false`,
//!   skan okolicy = pusty (identycznie jak web: `map.hexes["1.5,2"]` = `undefined`);
//! * trudnosc spoza `easy|normal|hard` (web: typ `Difficulty`, nieosiagalna na typowanych wejsciach) daje w webie
//!   same fallbacki (`row[difficulty]` = `undefined`); port robi to samo (wektory `weird`).

use std::collections::HashSet;

use serde_json::Value;

use crate::domain::freshwater::is_lake_adjacent_cached;
use crate::domain::improvement_build::{hex_keys_within_radius, BuildMap};
use crate::domain::society_breakdown::{js_round, pick_osiedle_pop_bonus};
use crate::domain::start_position::Overlay;
use crate::domain::terrain::city_range_for_population;
use crate::domain::types::Difficulty;

/// Web `HealthParams` (`:324-343`).
#[derive(Debug, Clone, PartialEq)]
pub struct HealthParams {
    pub rzeka: f64,
    pub akwedukt: f64,
    pub studnia: f64,
    pub targowisko: f64,
    pub laznia_publiczna: f64,
    pub ceramika: f64,
    pub kara_zagoszczenie: f64,
    pub prog_zagoszczenia: f64,
    pub kara_bagno: f64,
    pub bonus_las: f64,
    pub kara_dzungla: f64,
    pub kara_brak_wody: f64,
    /// Sekcja `zdrowie` (dla `osiedlePopBonus`); `Null` gdy brak.
    osiedle_block: Value,
    legacy_male_miasto: f64,
    /// `None` = trudnosc spoza `easy|normal|hard` (web: `row[difficulty]` = `undefined` -> fallbacki).
    difficulty: Option<Difficulty>,
}

impl HealthParams {
    /// Web `osiedlePopBonus(pop)` (`:402-405`): `legacy = pop <= progZagoszczenia ? legacyMaleMiasto : 0`.
    pub fn osiedle_pop_bonus(&self, pop: f64) -> f64 {
        let legacy = if pop <= self.prog_zagoszczenia {
            self.legacy_male_miasto
        } else {
            0.0
        };
        let block = if self.osiedle_block.is_object() {
            Some(&self.osiedle_block)
        } else {
            None
        };
        match self.difficulty {
            Some(difficulty) => {
                pick_osiedle_pop_bonus(block, "zdrowie_bonus_osiedle_pop", pop, difficulty, legacy)
            }
            // nieznana trudnosc: wiersz tablicy nie istnieje (`row[difficulty]` = `undefined`) -> tylko `legacy`
            None => pick_osiedle_pop_bonus(
                None,
                "zdrowie_bonus_osiedle_pop",
                pop,
                Difficulty::Normal,
                legacy,
            ),
        }
    }
}

fn difficulty_of(difficulty: &str) -> Option<Difficulty> {
    [Difficulty::Easy, Difficulty::Normal, Difficulty::Hard]
        .into_iter()
        .find(|d| d.key() == difficulty)
}

/// Web `loadHealthParams(raw, difficulty)` (`:377-413`): sekcja `zdrowie` z `society-params.json`;
/// brak wpisu albo wartosc nieskonczona/nieliczbowa -> fallback.
pub fn load_health_params(society_params: Option<&Value>, difficulty: &str) -> HealthParams {
    let zd: Value = society_params
        .and_then(|sp| sp.get("zdrowie"))
        .filter(|z| z.is_object())
        .cloned()
        .unwrap_or(Value::Null);
    let rd = |key: &str, fallback: f64| -> f64 {
        zd.get(key)
            .and_then(|row| row.get(difficulty))
            .and_then(Value::as_f64)
            .filter(|v| v.is_finite())
            .unwrap_or(fallback)
    };
    let prog = rd("zdrowie_prog_zagęszczenia", 4.0);
    let legacy = rd("zdrowie_male_miasto_bonus", 1.0);
    HealthParams {
        rzeka: rd("zdrowie_rzeka", 2.0),
        akwedukt: rd("zdrowie_akwedukt", 4.0),
        studnia: rd("zdrowie_studnia", 2.0),
        targowisko: rd("zdrowie_targowisko", 2.0),
        laznia_publiczna: rd("zdrowie_laznia_publiczna", 5.0),
        ceramika: rd("zdrowie_ceramika", 1.0),
        kara_zagoszczenie: rd("zdrowie_kara_zagęszczenie", -1.0),
        prog_zagoszczenia: prog,
        kara_bagno: rd("zdrowie_kara_bagno", -1.0),
        bonus_las: rd("zdrowie_bonus_las", 1.0),
        kara_dzungla: rd("zdrowie_kara_dzungla", -1.0),
        kara_brak_wody: rd("zdrowie_kara_brak_wody", -2.0),
        osiedle_block: zd,
        legacy_male_miasto: legacy,
        difficulty: difficulty_of(difficulty),
    }
}

/// Zbior heksow rzek z `map.riverPaths` (web `__riverHexSetCache`, `:421-436`).
pub fn river_hex_set(map: &BuildMap) -> HashSet<(i32, i32)> {
    map.river_paths
        .iter()
        .flat_map(|path| path.iter().copied())
        .collect()
}

/// `q`/`r` jako klucz calkowity heksa albo `None` (ulamkowe / nieskonczone / poza `i32`).
fn integral_hex(q: f64, r: f64) -> Option<(i32, i32)> {
    let ok = |x: f64| {
        x.is_finite() && x.fract() == 0.0 && x >= f64::from(i32::MIN) && x <= f64::from(i32::MAX)
    };
    if ok(q) && ok(r) {
        Some((q as i32, r as i32))
    } else {
        None
    }
}

/// Sasiedzi heksa (web `HEX_NEIGHBORS`, `:553`), w kolejnosci weba.
const HEX_NEIGHBORS: [(i32, i32); 6] = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)];

/// Web `cityHasWaterAccess(city, map)` z gotowym zbiorem rzek: heks miasta ma `rzeka.obecna` albo
/// lezy w `riverPaths`, albo sasiaduje z heksem z `riverPaths`.
pub fn city_has_water_access_in(
    q: f64,
    r: f64,
    map: &BuildMap,
    rivers: &HashSet<(i32, i32)>,
) -> bool {
    let Some((cq, cr)) = integral_hex(q, r) else {
        return false;
    };
    if map
        .hex(&format!("{cq},{cr}"))
        .is_some_and(|hex| hex.river_present)
    {
        return true;
    }
    if rivers.contains(&(cq, cr))
        || HEX_NEIGHBORS
            .iter()
            .any(|(dq, dr)| rivers.contains(&(cq.wrapping_add(*dq), cr.wrapping_add(*dr))))
    {
        return true;
    }
    // REPIN-DELTA-4 (turn-economy.ts:417-425 @23dd158e9 -> `hasFreshwaterAccess`): rzeka LUB jezioro
    // na heksie miasta / sasiedzie; morze/ocean nigdy. Dla map bez jezior wynik jak dotad.
    is_lake_adjacent_cached(map, cq, cr)
}

/// Web `cityHasWaterAccess(city, map)` (`:420-445`).
pub fn city_has_water_access(q: f64, r: f64, map: &BuildMap) -> bool {
    city_has_water_access_in(q, r, map, &river_hex_set(map))
}

/// Web `CityHealthMapContext` (`:345`): `city: {q, r, population}` + mapa.
#[derive(Clone, Copy)]
pub struct CityHealthMapContext<'a> {
    pub q: f64,
    pub r: f64,
    pub population: f64,
    pub map: &'a BuildMap,
}

/// Web `CityVicinityTerrain` (`:350`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CityVicinityTerrain {
    pub has_las: bool,
    pub has_bagno: bool,
}

/// Web `scanCityVicinityTerrain(ctx)` (`:356-372`): heksy w promieniu `cityRangeForPopulation(pop)`.
pub fn scan_city_vicinity_terrain(ctx: &CityHealthMapContext<'_>) -> CityVicinityTerrain {
    let radius = city_range_for_population(ctx.population);
    let mut has_las = false;
    if let Some((cq, cr)) = integral_hex(ctx.q, ctx.r) {
        for key in hex_keys_within_radius(cq, cr, radius, ctx.map) {
            if let Some(hex) = ctx.map.hex(&key) {
                if hex.overlay == Overlay::Las {
                    has_las = true;
                    break;
                }
            }
        }
    }
    // `hasBagno` -> patrz zalozenie w naglowku modulu (brak `bagno` w `TenBazowy`).
    CityVicinityTerrain {
        has_las,
        has_bagno: false,
    }
}

/// JS prawdziwosc liczby (`if (x)`): niezerowa i nie `NaN`.
fn truthy(x: f64) -> bool {
    x != 0.0 && !x.is_nan()
}

/// Web `computeCityHealth(ludnosc, tiles, builtIds, hp, hasWaterAccess, mapCtx, spichlerzZdrowieBonus,
/// garncarniaSurplusZdrowie)` (`:456-519`). `tiles_have_river` = `tiles.map(t => t.maRzeke)` (uzywane
/// tylko gdy `has_water_access` = `None`, jak `undefined` w webie).
#[allow(clippy::too_many_arguments)]
pub fn compute_city_health(
    ludnosc: f64,
    tiles_have_river: &[bool],
    built_ids: &[String],
    hp: &HealthParams,
    has_water_access: Option<bool>,
    map_ctx: Option<&CityHealthMapContext<'_>>,
    spichlerz_zdrowie_bonus: f64,
    garncarnia_surplus_zdrowie: f64,
) -> f64 {
    let mut z = 0.0;

    let mut ma_rzeke = has_water_access == Some(true);
    if has_water_access.is_none() {
        ma_rzeke = tiles_have_river.iter().any(|&r| r);
    }

    let has = |id: &str| built_ids.iter().any(|b| b == id);
    let ma_studnie = has("studnia");
    let ma_targowisko = has("targowisko");
    let ma_akwedukt = has("akwedukt");
    let ma_laznia = has("laznia_publiczna");

    if ma_rzeke {
        z += hp.rzeka;
    }
    if ma_akwedukt {
        z += hp.akwedukt;
    }
    if ma_studnie {
        z += hp.studnia;
    }
    if ma_targowisko {
        z += hp.targowisko;
    }
    if ma_laznia {
        z += hp.laznia_publiczna;
    }

    let osiedle_v = hp.osiedle_pop_bonus(ludnosc);
    if truthy(osiedle_v) {
        z += osiedle_v;
    }

    if ludnosc > hp.prog_zagoszczenia {
        z += hp.kara_zagoszczenie * (ludnosc - hp.prog_zagoszczenia);
    }

    if !ma_rzeke && !ma_studnie && !ma_akwedukt {
        z += hp.kara_brak_wody;
    }

    if let Some(ctx) = map_ctx {
        let vicinity = scan_city_vicinity_terrain(ctx);
        if vicinity.has_las {
            z += hp.bonus_las;
        }
        if vicinity.has_bagno {
            z += hp.kara_bagno;
        }
    }

    if truthy(spichlerz_zdrowie_bonus) {
        z += spichlerz_zdrowie_bonus;
    }
    if truthy(garncarnia_surplus_zdrowie) {
        z += garncarnia_surplus_zdrowie;
    }

    js_round(z)
}
