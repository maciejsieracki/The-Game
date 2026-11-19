//! R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (T6), czesc 3: `PlayableState` -> wejscia rosterow szturmu.
//!
//! Mapowanie stanu Rust na pola `RuntimeUnit` / `City` czytane przez [`super::siege_battle_adapter`]:
//! * jednostki: [`ruch_jednostka_of`] (id dziesietne, wlasciciel, `type_id`/`category` ze stanu zamiany albo typu
//!   startowego), HP i postep z `economy.units` (`hp`, `battlesSurvived`, `parametryBonusProc`);
//! * miasto: pozycja (`q = position.x`, `r = position.y`, jak `PlayableFort`), populacja, `maMur` liczony jak przy
//!   wczytaniu zapisu w pinie (`main.ts:46333`: `mury` / `mury_kamienne` / `fort` / `palisada` w `cityBuilt`), Garnizon
//!   ukonczony = `garnizon` w `cityBuilt` (`siegeDefenders.ts:89-94`);
//! * relacje: wojna/sojusz z `war.diplomacy` (`areEnemyOwners` `main.ts:13129-13133`, `hasAllianceDealBetween`);
//! * gotowe machiny: `siege_machines_ready` miasta.
//!
//! Luki stanu (jawnie, bez wartosci domyslnych udajacych dane): `PlayableState` nie ma generalow (`isGeneral`),
//! licznika `city.garnizon`, `militiaRegenAtTurn`, `ufortyfikowanyWPolu`/`inGarnizon` ani `pancerzBonusProc` — w stanie te
//! byty nie istnieja, wiec mapowanie daje ich brak (`false` / `None`) zgodny z modelem stanu, a nie zgadywanie. Epoka
//! wlasciciela (`ownerEra`) i kontekst wlascicieli (`OwnerContext`) podaje wolajacy (producent epoki W8 r6).

use std::collections::BTreeSet;

use crate::domain::diplomacy::RelationStatus;
use crate::domain::ids::{CityId, PlayerId};
use crate::domain::playable::{PlayableSiegeMachineKind, PlayableState};
use crate::domain::playable_movement::ruch_jednostka_of;
use crate::domain::siege_battle_adapter::{
    AdapterError, CityDefOptions, MachineKind, OwnerRelations, RosterCity, RosterUnit,
};

/// Budynki, przy ktorych pin ustawia `city.maMur = true` (`main.ts:46333`).
const WALL_BUILDINGS: [&str; 4] = ["mury", "mury_kamienne", "fort", "palisada"];
/// `GARRISON_BUILDING_ID` (`siegeDefenders.ts:22`).
const GARRISON_BUILDING: &str = "garnizon";

fn owner_i64(p: PlayerId) -> i64 {
    i64::try_from(p.get()).unwrap_or(i64::MAX)
}

/// Wejscia rosterow szturmu wyprowadzone ze stanu.
#[derive(Debug, Clone, PartialEq)]
pub struct PlayableSiegeInputs {
    pub city: RosterCity,
    pub units: Vec<RosterUnit>,
    pub relations: OwnerRelations,
    pub def_opts: CityDefOptions,
    pub ready_machines: Vec<MachineKind>,
    pub turn: f64,
}

/// Mapuje `PlayableState` na wejscia [`super::siege_battle_adapter::collect_siege_rosters`]. `owner_era` = epoka
/// wlasciciela miasta (producent epoki), `anchor_id` sprawdzany przez wolajacego rosterow.
pub fn siege_inputs_from_playable(
    state: &PlayableState,
    city_id: u64,
    owner_era: Option<f64>,
) -> Result<PlayableSiegeInputs, AdapterError> {
    let city = state
        .cities
        .iter()
        .find(|c| c.id.get() == city_id)
        .ok_or_else(|| AdapterError::CityNotFound(city_id.to_string()))?;
    let built: &[String] = state
        .stores
        .buildings_by_city
        .get(&city_id)
        .map_or(&[], Vec::as_slice);
    let ma_mur = built.iter().any(|b| WALL_BUILDINGS.contains(&b.as_str()));
    let units = state
        .units
        .iter()
        .map(|u| {
            let rj = ruch_jednostka_of(state, u);
            let rep = state.economy.units.get(&u.id.get());
            let mut ru = RosterUnit::new(
                &rj.id,
                rj.owner_id,
                rj.type_id.as_deref().unwrap_or(""),
                &rj.category,
                i64::from(rj.q),
                i64::from(rj.r),
            );
            ru.hp = rep.and_then(|r| r.hp);
            ru.battles_survived = rep.and_then(|r| r.battles_survived);
            ru.parametry_bonus_proc = rep.and_then(|r| r.parametry_bonus_proc);
            ru
        })
        .collect();
    let mut relations = OwnerRelations::default();
    let owners: Vec<PlayerId> = state.players.iter().map(|p| p.id).collect();
    for (i, &a) in owners.iter().enumerate() {
        for &b in &owners[i + 1..] {
            match state.war.diplomacy.relation(a, b).map(|r| r.status) {
                Some(RelationStatus::War) => {
                    relations.wars.insert(order(owner_i64(a), owner_i64(b)));
                }
                Some(RelationStatus::Alliance) => {
                    relations
                        .alliances
                        .insert(order(owner_i64(a), owner_i64(b)));
                }
                _ => {}
            }
        }
    }
    let ready_machines = state
        .siege_machines_ready
        .get(&CityId::new(city_id))
        .map(|v| {
            v.iter()
                .map(|k| match k {
                    PlayableSiegeMachineKind::Taran => MachineKind::Taran,
                    PlayableSiegeMachineKind::Wieza => MachineKind::Wieza,
                })
                .collect()
        })
        .unwrap_or_default();
    let turn = f64::from(state.turn);
    Ok(PlayableSiegeInputs {
        city: RosterCity {
            id: city_id.to_string(),
            owner_id: owner_i64(city.owner_id),
            q: i64::from(city.position.x()),
            r: i64::from(city.position.y()),
            population: Some(f64::from(city.population)),
            garnizon: None,
            militia_regen_at_turn: None,
            ma_mur,
        },
        units,
        relations,
        def_opts: CityDefOptions {
            garrison_completed: built.iter().any(|b| b == GARRISON_BUILDING),
            owner_era,
            current_turn: Some(turn),
        },
        ready_machines,
        turn,
    })
}

fn order(a: i64, b: i64) -> (i64, i64) {
    if a <= b {
        (a, b)
    } else {
        (b, a)
    }
}

/// Zbior wlascicieli wystepujacych w stanie (gracze), pomocniczo dla wolajacych budujacych `OwnerContext`.
pub fn state_owner_ids(state: &PlayableState) -> BTreeSet<i64> {
    state.players.iter().map(|p| owner_i64(p.id)).collect()
}
