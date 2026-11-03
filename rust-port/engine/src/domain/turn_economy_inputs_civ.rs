//! R-RUSTPORT-P6-ECON-TICK-STATE-SOURCES-Q1: zrodlo `ownerCivMap` (cywilizacja wlasciciela) dla ticku ekonomii,
//! 1:1 z `gra/src/main.ts:34435-34440` (pin `4bbef081d`).
//!
//! Web: (1) kopia `_menuCivIdByOwner` (`:1828`), (2) gdy brak `HUMAN_OWNER_PRIMARY` (0) -> `player.civType || 'grecy'`
//! (`:34437-34439`), (3) nadpisanie wpisami `aiOwnerCivMap` (`:8395`, `:34440`). Kolejnosc nadpisan ma znaczenie.

use std::collections::BTreeMap;

/// Web `HUMAN_OWNER_PRIMARY` (fotel czlowieka 0).
pub const HUMAN_OWNER_PRIMARY: i64 = 0;
/// Web fallback `|| 'grecy'` (`main.ts:34438`).
pub const DEFAULT_PLAYER_CIV: &str = "grecy";

/// Web `ownerCivMap` (`main.ts:34435-34440`). `player_civ_type = None` albo `Some("")` => `'grecy'` (JS `||`).
pub fn build_owner_civ_map(
    menu_civ_id_by_owner: &BTreeMap<i64, String>,
    player_civ_type: Option<&str>,
    ai_owner_civ_map: &BTreeMap<i64, String>,
) -> BTreeMap<i64, String> {
    let mut out: BTreeMap<i64, String> = menu_civ_id_by_owner.clone();
    out.entry(HUMAN_OWNER_PRIMARY).or_insert_with(|| {
        match player_civ_type {
            Some(c) if !c.is_empty() => c,
            _ => DEFAULT_PLAYER_CIV,
        }
        .to_string()
    });
    for (oid, civ) in ai_owner_civ_map {
        out.insert(*oid, civ.clone());
    }
    out
}
