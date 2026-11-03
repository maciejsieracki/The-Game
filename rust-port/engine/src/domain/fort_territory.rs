//! Temat wlasciciel: R-RUSTPORT-REPIN-TERYTORIUM-FORTY-Q1.
//! REPIN delty weba `dc8a3adc` -> `4bbef081d`, krok 3 (forty/terytorium): logika domenowa z
//! `gra/src/game/fort-territory.ts` (linie 55-91 `builtAtTurn/seq`, `nextFortSeq`, `backfillFortOrder`;
//! 103-141 `fortTerritoryNodes`, `isHexInForeignFortTerritory`; 296-349 `applyFortCaptureByOccupation`).
//! Wiazanie z petla gry (main.ts) POZA zakresem. Starsze funkcje fortow (rival fort, takeover przez
//! miasto, ewakuacja) zostaja w `terrain.rs` (P6.3); `FortNode` z `terrain.rs` nie jest zmieniany -
//! znacznik kolejnosci niesie `OrderedFortNode` (ZALOZENIE: unika zmiany konstruktorow `FortNode`
//! poza allowlista).

use std::collections::BTreeSet;

use super::terrain::{
    axial_distance, city_territory_radius, fort_node_as_city_node, FortImprovementType, FortNode,
};
use super::territory::{territory_owner_at, TerritoryNode, TerritoryOrder};

/// Web `FortNode` z polami `builtAtTurn?`/`seq?` (`fort-territory.ts:58-65`).
/// ZALOZENIE: `built_at_turn`/`seq` to liczby calkowite.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderedFortNode {
    pub fort: FortNode,
    pub built_at_turn: Option<i64>,
    pub seq: Option<i64>,
}

impl OrderedFortNode {
    pub fn new(fort: FortNode, built_at_turn: Option<i64>, seq: Option<i64>) -> Self {
        Self {
            fort,
            built_at_turn,
            seq,
        }
    }
}

/// Web `nextFortSeq` (`fort-territory.ts:68`): `max(seq) + 1`; 0 dla pustego rejestru.
pub fn next_fort_seq(forts: &[OrderedFortNode]) -> i64 {
    let mut m = -1;
    for f in forts {
        if let Some(s) = f.seq {
            if s > m {
                m = s;
            }
        }
    }
    m + 1
}

/// Web `backfillFortOrder` (`fort-territory.ts:79`): wpisy bez `seq` dostaja kolejne numery w kolejnosci
/// tablicy i `built_at_turn = 0` (gdy brak). Zwraca liczbe uzupelnionych.
pub fn backfill_fort_order(forts: &mut [OrderedFortNode]) -> usize {
    let mut n = 0;
    let mut next = next_fort_seq(forts);
    for f in forts.iter_mut() {
        if f.seq.is_some() {
            continue;
        }
        f.seq = Some(next);
        next += 1;
        if f.built_at_turn.is_none() {
            f.built_at_turn = Some(0);
        }
        n += 1;
    }
    n
}

/// Web `fortTerritoryNodes` (`fort-territory.ts:109`): wezly TWARDEGO terytorium z fortow/posterunkow;
/// `contested_useless` pomijane; `order` tylko gdy jest `seq` (`turn = builtAtTurn ?? 0`).
pub fn fort_territory_nodes(forts: &[OrderedFortNode]) -> Vec<TerritoryNode> {
    let mut out = Vec::new();
    for f in forts {
        if f.fort.contested_useless == Some(true) {
            continue;
        }
        let order = f.seq.map(|seq| TerritoryOrder {
            turn: f.built_at_turn.unwrap_or(0),
            seq,
        });
        out.push(TerritoryNode::with_order(
            fort_node_as_city_node(f.fort.q, f.fort.r, f.fort.kind),
            f.fort.owner_id,
            order,
        ));
    }
    out
}

/// Web `isHexInForeignFortTerritory` (`fort-territory.ts:128`): heks w promieniu CUDZEGO fortu
/// (nie-bezuzytecznego), rozstrzygniety wg `territory_owner_at` na rzecz kogos innego niz `owner_id`.
pub fn is_hex_in_foreign_fort_territory(
    q: i32,
    r: i32,
    owner_id: i64,
    forts: &[OrderedFortNode],
    all_nodes: &[TerritoryNode],
) -> bool {
    let in_foreign_fort_radius = forts.iter().any(|f| {
        f.fort.owner_id != owner_id
            && f.fort.contested_useless != Some(true)
            && axial_distance(q, r, f.fort.q, f.fort.r)
                <= city_territory_radius(&fort_node_as_city_node(f.fort.q, f.fort.r, f.fort.kind))
    });
    if !in_foreign_fort_radius {
        return false;
    }
    matches!(territory_owner_at(q, r, all_nodes), Some(owner) if owner != owner_id)
}

/// Web `FortCaptureUnit` (`fort-territory.ts:298`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FortCaptureUnit {
    pub owner_id: i64,
    pub q: i32,
    pub r: i32,
    /// true = jednostka bojowa (nie cywil/osadnik/robotnik).
    pub military: bool,
}

/// Web `FortCaptureEvent` (`fort-territory.ts:307`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FortCaptureEvent {
    pub q: i32,
    pub r: i32,
    pub kind: FortImprovementType,
    pub prev_owner_id: i64,
    pub new_owner_id: i64,
}

/// Web `applyFortCaptureByOccupation` (`fort-territory.ts:331-349`): zdobycie fortu wejsciem wojska
/// wroga (`is_enemy`), gdy wlasciciel nie ma tam jednostki; jeden wrog, brak obcych/neutralnych obok;
/// barbarzyncy (`is_barbarian_owner`) nie zdobywaja. MUTUJE `forts` (zmiana `owner_id`);
/// `contested_useless` i znacznik kolejnosci zachowane.
pub fn apply_fort_capture_by_occupation(
    forts: &mut [OrderedFortNode],
    units: &[FortCaptureUnit],
    is_enemy: &dyn Fn(i64, i64) -> bool,
    is_barbarian_owner: &dyn Fn(i64) -> bool,
) -> Vec<FortCaptureEvent> {
    let mut events = Vec::new();
    for f in forts.iter_mut() {
        let here: Vec<&FortCaptureUnit> = units
            .iter()
            .filter(|u| u.q == f.fort.q && u.r == f.fort.r)
            .collect();
        if here.is_empty() {
            continue;
        }
        if here.iter().any(|u| u.owner_id == f.fort.owner_id) {
            continue;
        }
        let attackers: Vec<&FortCaptureUnit> = here
            .iter()
            .copied()
            .filter(|u| {
                u.military
                    && !is_barbarian_owner(u.owner_id)
                    && is_enemy(u.owner_id, f.fort.owner_id)
            })
            .collect();
        if attackers.is_empty() {
            continue;
        }
        let attacker_owners: BTreeSet<i64> = attackers.iter().map(|u| u.owner_id).collect();
        if attacker_owners.len() != 1 {
            continue;
        }
        if here.iter().any(|u| !attacker_owners.contains(&u.owner_id)) {
            continue;
        }
        let new_owner_id = attackers[0].owner_id;
        events.push(FortCaptureEvent {
            q: f.fort.q,
            r: f.fort.r,
            kind: f.fort.kind,
            prev_owner_id: f.fort.owner_id,
            new_owner_id,
        });
        f.fort.owner_id = new_owner_id;
    }
    events
}

/// Zrodlo wzroku z fortu/posterunku (web `fortSightSources` zwraca `{q, r, radius}`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SightSource {
    pub q: i32,
    pub r: i32,
    pub radius: f64,
}

/// Web `fortSightSources` (`fort-territory.ts:359-369` @23dd158e9, R-WEB-FORT-VISION-FOG-Q1): fort /
/// posterunek jest ZRODLEM WZROKU wlasciciela o promieniu rownym promieniowi jego terytorium (fort 5,
/// posterunek 3). `contested_useless` nie daje terytorium, wiec nie daje tez wzroku; fort wroga nie jest
/// zrodlem wzroku `owner_id`. REPIN-DELTA-4: sama funkcja czysta; `computePlayerVisibility`/mgla nie maja
/// jeszcze modulu w Rust (dlug), wiec zrodla nie sa nigdzie konsumowane.
pub fn fort_sight_sources(forts: &[FortNode], owner_id: i64) -> Vec<SightSource> {
    forts
        .iter()
        .filter(|f| f.owner_id == owner_id && f.contested_useless != Some(true))
        .map(|f| SightSource {
            q: f.q,
            r: f.r,
            radius: city_territory_radius(&fort_node_as_city_node(f.q, f.r, f.kind)),
        })
        .collect()
}
