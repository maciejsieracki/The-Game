//! R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1: zrodlo `ownerDefaultPodzialHandlu` / `ownerDefaultPodzialPracy`
//! (domyslny podzial per owner), 1:1 z `gra/src/main.ts` (pin `4bbef081d`):
//! `initOwnerDefaultPodzialHandlu` (`:5516-5540`), `initOwnerDefaultCityFields` (`:5548-5590`, tylko Praca),
//! `seedCityOwnerDefaults` (`:5655-5680`, tylko Praca/Handel). Pozostale pola seedu (okolica, budowa, racje) poza
//! zakresem tego tematu (nie czyta ich `advance_city_economy`).
//!
//! `isHuman(ownerId)` (`:5659`, `:5677`) i lista `aiStartHexes` dostarcza wolajacy.

use std::collections::BTreeMap;

use crate::domain::terrain::city_founding::p6_6b::cities::{
    ai_fixed_procent_budynki, ai_fixed_procent_nauki, default_podzial_handlu, City,
    CityPodzialHandlu, CityPodzialPracy,
};
use crate::domain::terrain::city_founding::p6_6b::empire_city_defaults::fresh_owner_default_podzial_pracy;

/// Web `freshOwnerDefaultPodzialHandlu` (`empire-handel-split.ts:82`).
pub fn fresh_owner_default_podzial_handlu() -> CityPodzialHandlu {
    default_podzial_handlu()
}

/// Wpis AI: `{ ...DEFAULT_PODZIAL_HANDLU, procentNauka: AI_FIXED_PROCENT_NAUKA }`.
fn ai_podzial_handlu() -> CityPodzialHandlu {
    CityPodzialHandlu {
        procent_nauka: ai_fixed_procent_nauki(),
        ..default_podzial_handlu()
    }
}

fn ai_podzial_pracy() -> CityPodzialPracy {
    CityPodzialPracy {
        procent_budynki: ai_fixed_procent_budynki(),
    }
}

/// Web `initOwnerDefaultPodzialHandlu(humanOwnerIds)` (`:5516-5540`). `ai_start_owner_ids` = `aiStartHexes[].ownerId`
/// w kolejnosci; wpis `ownerId === 0` w tej galezi daje wartosc gracza.
pub fn init_owner_default_podzial_handlu(
    human_owner_ids: &[i64],
    ai_start_owner_ids: &[i64],
) -> BTreeMap<i64, CityPodzialHandlu> {
    let mut m = BTreeMap::new();
    for &o in human_owner_ids {
        m.insert(o, fresh_owner_default_podzial_handlu());
    }
    for &o in ai_start_owner_ids {
        m.entry(o).or_insert_with(|| {
            if o == 0 {
                fresh_owner_default_podzial_handlu()
            } else {
                ai_podzial_handlu()
            }
        });
    }
    m
}

/// Web `initOwnerDefaultCityFields` — czesc `ownerDefaultPodzialPracy` (`:5548-5590`).
pub fn init_owner_default_podzial_pracy(
    human_owner_ids: &[i64],
    ai_start_owner_ids: &[i64],
) -> BTreeMap<i64, CityPodzialPracy> {
    let mut m = BTreeMap::new();
    for &o in human_owner_ids {
        m.insert(o, fresh_owner_default_podzial_pracy());
    }
    for &o in ai_start_owner_ids {
        m.entry(o).or_insert_with(|| {
            if o == 0 {
                fresh_owner_default_podzial_pracy()
            } else {
                ai_podzial_pracy()
            }
        });
    }
    m
}

/// Web `seedCityOwnerDefaults(c)` — czesc Praca/Handel (`:5655-5680`): dla ownera bez wpisu seeduje
/// czlowieka wartoscia gracza, reszte (AI, barbarzyncy, rebelianci) stalym AI.
pub fn seed_city_owner_defaults_podzial(
    city: &City,
    is_human: &dyn Fn(i64) -> bool,
    handlu: &mut BTreeMap<i64, CityPodzialHandlu>,
    pracy: &mut BTreeMap<i64, CityPodzialPracy>,
) {
    let o = city.owner_id;
    pracy.entry(o).or_insert_with(|| {
        if is_human(o) {
            fresh_owner_default_podzial_pracy()
        } else {
            ai_podzial_pracy()
        }
    });
    handlu.entry(o).or_insert_with(|| {
        if is_human(o) {
            fresh_owner_default_podzial_handlu()
        } else {
            ai_podzial_handlu()
        }
    });
}
