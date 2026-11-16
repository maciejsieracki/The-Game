//! R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW: producent `sieges[]` i `wonders[]` widoku renderera
//! (`P4-1-RENDER-DTO-CONTRACT.md` §3.1, §3.5; rozpoznanie `P4-1F-OVERLAYS-ROZPOZNANIE.md` §1 SG/WD, §4 1F3).
//!
//! Czyta [`PlayableState`] (wylacznie odczyt) i zwraca typy `civ-view-model` ([`SiegeViewDto`],
//! [`PlacedWonderDto`]) bez zmiany ich ksztaltu (P4-1F1).
//!
//! Zrodlo prawdy: web na pinie `07d2fbd72` (`gra/src/…`):
//! * oblezenia = `refreshSiegeMarkers` (`main.ts:17492-17530`): miasta `cities.filter(c => c.oblegane)`
//!   w kolejnosci `cities`; obozy = KAZDA jednostka pelnej listy `units` (bez mgly) z
//!   `siegeAllowedBetween(u.ownerId, c.ownerId, areEnemyOwners)` i `hexDistance == 1`
//!   (`:17501-17508`), z powtorzeniami (jeden wpis na jednostke); maszyny = `readyMachinesForCity`
//!   (`render/siegeCampSync.ts:7-12`); wlasciciel obozu = `campOwnerByHex` (`siegeCampSync.ts:30-47`):
//!   PIERWSZA jednostka PELNEJ listy `units` na heksie z `ownerId !== cityOwnerId` (`:43`);
//! * cuda = `placedWonderSnapshot` (`main.ts:4205-4210`) z `wonderIsRuin` (`main.ts:4199-4203`):
//!   nieznany cud -> `false`, inaczej `empireEpochForOwner(ownerId) > getWonderAbsolutEpoka(w)`
//!   (`game/wonders-data.ts:164-168`). Porownanie wprost `era > absolut` (NIE `!wonder_bonus_active`),
//!   bo dla `era = NaN` web daje `false`.
//!
//! Wejscie, ktorego `PlayableState` NIE niesie: relacja wrogosci `areEnemyOwners` (web `main.ts`).
//! Podaje ja wolajacy jako funkcje (`are_enemies`), jak w `diplomacy_siege_war_gate`.
#![forbid(unsafe_code)]

use std::fmt;

use civ_view_model as vm;
use civ_view_model::overlays::SiegeCampDto;
use civ_view_model::{PlacedWonderDto, SiegeMachineKind, SiegeViewDto};

use crate::data::buildings_tech::{parse_wonders, Wonders};
use crate::domain::diplomacy_siege_war_gate::{enemy_units_adjacent_to_city, SiegeCity, SiegeUnit};
use crate::domain::playable::{PlayableSiegeMachineKind, PlayableState, PlayableUnit};
use crate::domain::turn_war_epoch::{
    empire_epoch_for_owner, game_start_era, owner_era_facts, OwnerEpochError,
};
use crate::domain::PlayerId;

/// Blad producenta nakladek oblezen i cudow (jawny, bez cichych zer).
#[derive(Debug, Clone, PartialEq)]
pub enum OverlaysViewError {
    /// Identyfikator powyzej `2^53 - 1` (kontrakt §4 pkt 4).
    IdOutOfRange(u64),
    /// Epoka wlasciciela nieustalona (web `empireEpochForOwner`).
    Epoch(OwnerEpochError),
    /// Dane `wonders.json` nie daly sie wczytac.
    WondersData(String),
}

impl fmt::Display for OverlaysViewError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::IdOutOfRange(v) => write!(f, "identyfikator {v} poza zakresem 2^53 - 1"),
            Self::Epoch(e) => write!(f, "epoka wlasciciela: {e}"),
            Self::WondersData(e) => write!(f, "wonders.json: {e}"),
        }
    }
}

impl std::error::Error for OverlaysViewError {}

impl From<OwnerEpochError> for OverlaysViewError {
    fn from(e: OwnerEpochError) -> Self {
        Self::Epoch(e)
    }
}

fn owner_i64(id: PlayerId) -> i64 {
    // Identyfikatory przechodza przez `vm_owner` (<= 2^53 - 1), wiec rzutowanie jest bezstratne.
    i64::try_from(id.get()).unwrap_or(i64::MAX)
}

fn vm_owner(id: PlayerId) -> Result<vm::OwnerRef, OverlaysViewError> {
    vm::PlayerId::try_new(id.get())
        .map(vm::OwnerRef::Player)
        .map_err(|e| OverlaysViewError::IdOutOfRange(e.value))
}

fn unit_hex(unit: &PlayableUnit) -> vm::HexCoord {
    // Kontrakt §1.4: `q = position.x`, `r = position.y`.
    vm::HexCoord::new(i32::from(unit.position.x()), i32::from(unit.position.y()))
}

const fn vm_machine(kind: PlayableSiegeMachineKind) -> SiegeMachineKind {
    match kind {
        PlayableSiegeMachineKind::Taran => SiegeMachineKind::Taran,
        PlayableSiegeMachineKind::Wieza => SiegeMachineKind::Wieza,
    }
}

/// Web `campOwnerByHex` dla jednego heksa (`render/siegeCampSync.ts:30-47`): wlasciciel PIERWSZEJ
/// jednostki PELNEJ listy `units` stojacej na `hex` z `ownerId !== cityOwnerId` (`:43`). `None` =
/// web `out` bez wpisu (nieosiagalne dla heksa obozu: obozowa jednostka ma inny wlasciciel niz miasto).
pub fn camp_owner_at_hex(
    hex: vm::HexCoord,
    units: &[PlayableUnit],
    city_owner_id: PlayerId,
) -> Option<PlayerId> {
    units
        .iter()
        .find(|u| unit_hex(u) == hex && u.owner_id != city_owner_id)
        .map(|u| u.owner_id)
}

/// Web `machinesByCampHex` (`render/siegeCampSync.ts:14-27`): gotowe machiny round-robin po LISCIE
/// obozow (z powtorzeniami: `campHexes[i % campHexes.length]`). Wynik = wpisy `Map` w kolejnosci
/// pierwszego wstawienia heksa; pusta lista obozow albo machin = pusta mapa.
pub fn machines_by_camp_hex(
    camp_hexes: &[vm::HexCoord],
    ready: &[SiegeMachineKind],
) -> Vec<(vm::HexCoord, Vec<SiegeMachineKind>)> {
    let mut out: Vec<(vm::HexCoord, Vec<SiegeMachineKind>)> = Vec::new();
    if camp_hexes.is_empty() || ready.is_empty() {
        return out;
    }
    for (i, kind) in ready.iter().enumerate() {
        let hk = camp_hexes[i % camp_hexes.len()];
        match out.iter_mut().find(|(h, _)| *h == hk) {
            Some((_, list)) => list.push(*kind),
            None => out.push((hk, vec![*kind])),
        }
    }
    out
}

/// Producent `sieges[]` (web `refreshSiegeMarkers`, `main.ts:17492-17530`): jeden wpis na miasto z
/// `oblegane` w kolejnosci `state.cities`. `are_enemies(a, b)` = web `areEnemyOwners` (wejscie wolajacego).
pub fn siege_views(
    state: &PlayableState,
    are_enemies: impl Fn(i64, i64) -> bool,
) -> Result<Vec<SiegeViewDto>, OverlaysViewError> {
    // Pelna lista `units` (bez filtra mgly: `siegeMarker.ts` nie zna mgly).
    let siege_units: Vec<SiegeUnit> = state
        .units
        .iter()
        .map(|u| SiegeUnit {
            q: i64::from(u.position.x()),
            r: i64::from(u.position.y()),
            owner_id: owner_i64(u.owner_id),
        })
        .collect();
    let mut out = Vec::new();
    for city in &state.cities {
        if !state.oblegane.contains(&city.id) {
            continue;
        }
        let city_hex =
            vm::HexCoord::new(i32::from(city.position.x()), i32::from(city.position.y()));
        let siege_city = SiegeCity {
            q: i64::from(city.position.x()),
            r: i64::from(city.position.y()),
            owner_id: owner_i64(city.owner_id),
            ma_mur: false,
            oblegane: true,
        };
        // `main.ts:17501-17508`: jeden wpis na jednostke, kolejnosc `units`, powtorzenia zachowane.
        let mut camp_hexes = Vec::new();
        for index in enemy_units_adjacent_to_city(&siege_city, &siege_units, &are_enemies) {
            let hex = unit_hex(&state.units[index]);
            let owner = camp_owner_at_hex(hex, &state.units, city.owner_id)
                .unwrap_or(state.units[index].owner_id);
            camp_hexes.push(SiegeCampDto {
                hex,
                owner_id: vm_owner(owner)?,
            });
        }
        let ready_machines = state
            .siege_machines_ready
            .get(&city.id)
            .map(|kinds| kinds.iter().copied().map(vm_machine).collect())
            .unwrap_or_default();
        out.push(SiegeViewDto {
            city_id: vm::CityId::try_new(city.id.get())
                .map_err(|e| OverlaysViewError::IdOutOfRange(e.value))?,
            city_hex,
            camp_hexes,
            ready_machines,
        });
    }
    Ok(out)
}

/// Web `wonderIsRuin` (`main.ts:4199-4203`) przy znanej epoce wlasciciela: nieznany `wonderId`
/// (`getWonderById`, `wonders-data.ts:101`, `:109-111` - tylko `cuda`) -> `false`; inaczej
/// `era > absolut`. `absolut` jest w Rust polem wymaganym (`buildings_tech.rs`), wiec fallback
/// `_meta.absolut` (`wonders-data.ts:166-167`) jest nieosiagalny.
pub fn wonder_is_ruin(wonders: &Wonders, wonder_id: &str, era: f64) -> bool {
    match wonders.cuda.iter().find(|w| w.id == wonder_id) {
        None => false,
        // `absolut` to male calkowite (epoki), konwersja do f64 jest dokladna.
        #[allow(clippy::cast_precision_loss)]
        Some(w) => era > w.absolut as f64,
    }
}

/// Producent `wonders[]` z jawna epoka wlasciciela (`era_of`): kolejnosc `placedWorldWonders`.
pub fn wonder_views_with_era(
    state: &PlayableState,
    wonders: &Wonders,
    era_of: impl Fn(PlayerId) -> Result<f64, OverlaysViewError>,
) -> Result<Vec<PlacedWonderDto>, OverlaysViewError> {
    state
        .placed_world_wonders
        .iter()
        .map(|pw| {
            // `getWonderById` przed epoka: nieznany cud nie pyta o epoke (web `if (!w) return false`).
            let ruin = if wonders.cuda.iter().any(|w| w.id == pw.wonder_id) {
                wonder_is_ruin(wonders, &pw.wonder_id, era_of(pw.owner_id)?)
            } else {
                false
            };
            Ok(PlacedWonderDto {
                wonder_id: pw.wonder_id.clone(),
                hex: vm::HexCoord::new(pw.q, pw.r),
                owner_id: vm_owner(pw.owner_id)?,
                ruin,
            })
        })
        .collect()
}

/// Producent `wonders[]` (web `placedWonderSnapshot`, `main.ts:4205-4210`): epoka wlasciciela =
/// `empire_epoch_for_owner` z faktow stanu (jak `city_view`), dane cudow = `wonders.json`.
pub fn wonder_views(state: &PlayableState) -> Result<Vec<PlacedWonderDto>, OverlaysViewError> {
    let wonders = parse_wonders().map_err(|e| OverlaysViewError::WondersData(e.to_string()))?;
    let facts = owner_era_facts(state);
    let start = game_start_era(&state.params.epoch_id);
    wonder_views_with_era(state, &wonders, |owner| {
        Ok(empire_epoch_for_owner(owner_i64(owner), &facts, start)?.0)
    })
}
