//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q8-Q1: pierwszy klocek przeniesienia cudow swiata (czysty rdzen decyzyjny).
//!
//! Port 1:1 z pinu webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75, `gra/src/game/wonder-transfer.ts`:
//! * `isCivilizationOwnerId` - cywilizacja = `ownerId >= 0` (sentinele -1 barbarzyncy, -99 rebelianci nie posiadaja cudow),
//! * `snapshotWonderTerritoryOwners` - migawka wlasciciela terytorium hexa kazdego cudu,
//! * `planWonderTransfers` - plan przeniesien (bez mutacji): porownanie migawek PRZED/PO zdarzeniu,
//! * `applyWonderTransfers` - stosuje plan na liscie cudow (mutuje `owner_id`, idempotentne).
//!
//! Wejscia jawne: lista cudow i funkcja `territory_owner_at` zamiast stanu gry. Brak zaleznosci od main.ts.
//!
//! NIE portowane w tym klocku (BRAK, patrz `siege_transfer.rs`): `beginWonderTransferWatch` / `settleWonderTransfer`
//! (wrapper z `gra/src/main.ts`, czyta stan gry i wola efekty UI: `showWonderCompletedNoticeDeferred`, `syncWonderRender`).
//!
//! Wektory: `tests/p6_siege_wonder_watch_vectors/vectors.json` (generator `tests/p6_siege_wonder_watch_gen.mjs`
//! wykonuje plik pinu w node).

use std::collections::BTreeMap;

/// Odpowiednik `TransferableWonder` (pola `wonderId`, `q`, `r`, `ownerId`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TransferableWonder {
    pub wonder_id: String,
    pub q: i32,
    pub r: i32,
    pub owner_id: i32,
}

/// Odpowiednik `WonderTransfer` (wpis planu).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct WonderTransfer {
    pub wonder_id: String,
    pub q: i32,
    pub r: i32,
    pub from_owner_id: i32,
    pub to_owner_id: i32,
}

/// Odpowiednik `WonderTerritorySnapshot` = `Map<string, number | null>`.
/// Brak klucza = `undefined` w TS (cud nieobecny w migawce); `None` = `null` (poza kazdym zasiegiem).
pub type WonderTerritorySnapshot = BTreeMap<String, Option<i32>>;

/// Web `isCivilizationOwnerId(ownerId)`.
pub fn is_civilization_owner_id(owner_id: i32) -> bool {
    owner_id >= 0
}

/// Web `snapshotWonderTerritoryOwners(wonders, territoryOwnerAt)`.
/// `territory_owner_at(q, r)` zwraca `None` gdy hex jest poza kazdym zasiegiem (null w TS).
pub fn snapshot_wonder_territory_owners(
    wonders: &[TransferableWonder],
    territory_owner_at: impl Fn(i32, i32) -> Option<i32>,
) -> WonderTerritorySnapshot {
    let mut out = WonderTerritorySnapshot::new();
    for w in wonders {
        out.insert(w.wonder_id.clone(), territory_owner_at(w.q, w.r));
    }
    out
}

/// Web `planWonderTransfers(wonders, before, after)` - plan bez mutacji.
pub fn plan_wonder_transfers(
    wonders: &[TransferableWonder],
    before: &WonderTerritorySnapshot,
    after: &WonderTerritorySnapshot,
) -> Vec<WonderTransfer> {
    let mut plan = Vec::new();
    for w in wonders {
        // `undefined` (brak klucza) w ktorejkolwiek migawce -> pominiecie.
        let (Some(b), Some(a)) = (before.get(&w.wonder_id), after.get(&w.wonder_id)) else {
            continue;
        };
        // `a === null` -> pominiecie.
        let Some(a) = *a else {
            continue;
        };
        // rebelianci/barbarzyncy nie posiadaja cudow -> zostaje.
        if !is_civilization_owner_id(a) {
            continue;
        }
        if a == w.owner_id {
            continue;
        }
        // spojny stan: PRZED == wlasciciel cudu; albo cud zamrozony przy cywilizacji, a hex byl u frakcji
        // niecywilizacyjnej (odbicie przez cywilizacje). Inny niespojny stan -> nie zgadujemy.
        let consistent = *b == Some(w.owner_id)
            || matches!(b, Some(bv) if !is_civilization_owner_id(*bv) && is_civilization_owner_id(w.owner_id));
        if !consistent {
            continue;
        }
        if *b == Some(a) {
            continue;
        }
        plan.push(WonderTransfer {
            wonder_id: w.wonder_id.clone(),
            q: w.q,
            r: w.r,
            from_owner_id: w.owner_id,
            to_owner_id: a,
        });
    }
    plan
}

/// Web `applyWonderTransfers(wonders, plan)` - mutuje `owner_id`; zwraca liczbe przeniesionych.
/// Idempotentne: wpis z `from_owner_id` niezgodnym z biezacym wlascicielem jest pomijany.
pub fn apply_wonder_transfers(
    wonders: &mut [TransferableWonder],
    plan: &[WonderTransfer],
) -> usize {
    let mut n = 0;
    for t in plan {
        // TS `find` = pierwsze dopasowanie po wonderId.
        let Some(w) = wonders.iter_mut().find(|x| x.wonder_id == t.wonder_id) else {
            continue;
        };
        if w.owner_id != t.from_owner_id {
            continue;
        }
        w.owner_id = t.to_owner_id;
        n += 1;
    }
    n
}
