//! R-RUSTPORT-P6-ADVANCE-CITY-ECONOMY-Q6-Q1: wejscia z cudow swiata dla `advanceCityEconomy` (pin `4bbef081d`):
//! `gra/src/game/wonders-data.ts:216-312` (`sumWonderCityYieldsForOwner`, `hasAnyWonderCityYield`,
//! `sumWonderTradeRouteBonusForOwner`, bramka `isWonderBonusActive`) i `gra/src/main.ts:3937-3969`
//! (`wonderCityYieldBonusForOwner`, `wonderTradeRouteBonusForOwner`, `buildWonderCityYieldsByOwnerMap`).
//! Dane: `data/wonders.json` (identyczne z pinem; `cmp` = zgodne).

use std::collections::{BTreeMap, BTreeSet};

use crate::data::buildings_tech::Wonders;
use crate::domain::trade::TradeRouteMedium;
use crate::domain::turn_economy_loop::WonderYieldBonus;

/// Web `Required<WonderYieldBonus>` (7 pol; petla miast czyta tylko 5, zob. [`CityWonderYields::to_loop_bonus`]).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct CityWonderYields {
    pub pieniadz: f64,
    pub zywnosc: f64,
    pub nauka: f64,
    pub kultura: f64,
    pub zadowolenie: f64,
    pub praca: f64,
    pub obrona: f64,
}

impl CityWonderYields {
    /// Pola czytane przez `applyWonderCityYields` (`turn-economy.ts:212`): bez `zadowolenie` i `obrona`.
    pub fn to_loop_bonus(self) -> WonderYieldBonus {
        WonderYieldBonus {
            pieniadz: self.pieniadz,
            zywnosc: self.zywnosc,
            nauka: self.nauka,
            kultura: self.kultura,
            praca: self.praca,
        }
    }
}

/// Cud postawiony na mapie (`placedWorldWonders`): tylko `ownerId` i `wonderId` sa czytane przez ekonomie
/// (`wonderIdsOwnedBy`, `main.ts:3932`).
#[derive(Debug, Clone, PartialEq)]
pub struct PlacedWonderRef {
    pub owner_id: i64,
    pub wonder_id: String,
}

/// Web `wonderIdsOwnedBy` (`main.ts:3932`).
pub fn wonder_ids_owned_by(placed: &[PlacedWonderRef], owner_id: i64) -> Vec<String> {
    placed
        .iter()
        .filter(|p| p.owner_id == owner_id)
        .map(|p| p.wonder_id.clone())
        .collect()
}

/// Web `wonderById` (`new Map(entries)`: przy duplikacie id wygrywa ostatni) + `isWonderBonusActive`
/// (`eraImperium <= absolut`, `:164`, `:176`).
fn find_wonder<'a>(w: &'a Wonders, id: &str) -> Option<&'a crate::data::buildings_tech::Cud> {
    w.cuda.iter().rfind(|c| c.id == id)
}

/// Web `isWonderBonusActive` (`:176`): `eraImperium <= absolut` (NaN -> nieaktywny).
fn wonder_bonus_active(owner_era: f64, absolut: i64) -> bool {
    owner_era <= absolut as f64
}

/// Web `sumWonderCityYieldsForOwner` (`:216-236`).
pub fn sum_wonder_city_yields_for_owner(
    wonders: &Wonders,
    owner_wonder_ids: &[String],
    owner_era: f64,
) -> CityWonderYields {
    let mut t = CityWonderYields::default();
    for id in owner_wonder_ids {
        let Some(w) = find_wonder(wonders, id) else {
            continue;
        };
        let m = &w.bonusy.miasto;
        if !wonder_bonus_active(owner_era, w.absolut) {
            continue;
        }
        let g = |x: Option<i64>| x.map(|v| v as f64).unwrap_or(0.0);
        t.pieniadz += g(m.pieniadz);
        t.zywnosc += g(m.zywnosc);
        t.nauka += g(m.nauka);
        t.kultura += g(m.kultura);
        t.zadowolenie += g(m.zadowolenie);
        t.praca += g(m.praca);
        t.obrona += g(m.obrona);
    }
    t
}

/// Web `hasAnyWonderCityYield` (`:238-246`).
pub fn has_any_wonder_city_yield(b: &CityWonderYields) -> bool {
    b.pieniadz != 0.0
        || b.zywnosc != 0.0
        || b.nauka != 0.0
        || b.kultura != 0.0
        || b.zadowolenie != 0.0
        || b.praca != 0.0
        || b.obrona != 0.0
}

/// Web `sumWonderTradeRouteBonusForOwner` (`:295-312`): suma `handel_procent`; `cel === 'handel_morski'` tylko dla
/// tras morskich.
pub fn sum_wonder_trade_route_bonus_for_owner(
    wonders: &Wonders,
    owner_wonder_ids: &[String],
    owner_era: f64,
    medium: TradeRouteMedium,
) -> f64 {
    let mut total = 0.0;
    for id in owner_wonder_ids {
        let Some(w) = find_wonder(wonders, id) else {
            continue;
        };
        if !wonder_bonus_active(owner_era, w.absolut) {
            continue;
        }
        for s in &w.bonusy.specjalne {
            if s.typ != "handel_procent" {
                continue;
            }
            if s.cel.as_deref() == Some("handel_morski") && medium != TradeRouteMedium::Sea {
                continue;
            }
            total += s.wartosc;
        }
    }
    total
}

/// Web `buildWonderCityYieldsByOwnerMap` (`main.ts:3962-3971`): `ownerIds` z duplikatami pomijane, wpis tylko gdy
/// `hasAnyWonderCityYield`. `owner_era` = `empireEpochForOwner`.
pub fn build_wonder_city_yields_by_owner_map(
    wonders: &Wonders,
    placed: &[PlacedWonderRef],
    owner_ids: &[i64],
    owner_era: &dyn Fn(i64) -> f64,
) -> BTreeMap<i64, WonderYieldBonus> {
    let mut out = BTreeMap::new();
    let mut seen = BTreeSet::new();
    for &oid in owner_ids {
        if !seen.insert(oid) {
            continue;
        }
        let bonus = sum_wonder_city_yields_for_owner(
            wonders,
            &wonder_ids_owned_by(placed, oid),
            owner_era(oid),
        );
        if has_any_wonder_city_yield(&bonus) {
            out.insert(oid, bonus.to_loop_bonus());
        }
    }
    out
}
