//! REPIN-WOJNA-2 (U4): port `gra/src/game/generalQuickFollow.ts` (pin `dc8a3adc`, plik nowy).
//!
//! web: gra/src/game/generalQuickFollow.ts:4-11 (tytul, etykiety), :13-17 (`GeneralQuickFollowUnit`),
//! :19-35 (`planEnabledGeneralFollowMarches`), :37-45 (efekty, wynik), :47-52 (`TrackedFollowUnit`),
//! :54-63 (`TrackedFollowPlanner`), :65-88 (`planTrackedGeneralFollowMarch`), :90-100
//! (`TrackedFollowPosition`), :102-128 (`syncTrackedGeneralFollowMarches`), :130-134 (`hexDistance`
//! - patrz `generals::hex_distance`), :136-161 (`issueGeneralQuickFollow`).
//!
//! Zalezy od `generals.rs` (U3). Wektory: `tests/p6_repin_wojna_2_vectors/general-quick-follow.json`
//! (generator `gen-repin-wojna-2-generals-vectors.mjs`).
//!
//! ZALOZENIA (ZALOZENIE):
//! - Typ `PlannedMarchDest` z `planned-march.ts:14-21` (wariant po `dc8a3adc`: `generalTargetId`) jest tu
//!   odwzorowany lokalnie jako `TrackedMarchDest`; `pathfinding::PlannedMarchDest` NIE zna pola
//!   `generalTargetId` (plik poza allowlista tematu) - NASTEPNA-PARTIA (zapis/odczyt save).
//! - Planner i efekty sa traitami; web wstrzykuje je jako obiekty. `mover` z `movementContext` jest
//!   przekazywany do `path_plan` bez zmian (web go nie modyfikuje w tym module).
//! - `MarchMap` naslada semantyke `Map` JS: `set` na istniejacym kluczu zachowuje pozycje.

use crate::domain::generals::{
    general_follow_destination, hex_distance, nearest_living_general, oblega_truthy, GeneralUnit,
};
use std::collections::{HashMap, HashSet};

/// Web `FollowCommanderTitle` (`generalQuickFollow.ts:4`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum FollowCommanderTitle {
    /// Web `'Wódz'`.
    Wodz,
    /// Web `'Generał'`.
    General,
}

/// Web `commanderTitleGenitive` (`generalQuickFollow.ts:5-7`).
pub fn commander_title_genitive(title: FollowCommanderTitle) -> &'static str {
    match title {
        FollowCommanderTitle::Wodz => "wodza",
        FollowCommanderTitle::General => "generała",
    }
}

/// Web `generalQuickFollowActionLabel` (`generalQuickFollow.ts:8-11`).
pub fn general_quick_follow_action_label(title: FollowCommanderTitle, active: bool) -> String {
    let genitive = commander_title_genitive(title);
    if active {
        format!("Marsz do {genitive}")
    } else {
        format!("Idź do najbliższego {genitive}")
    }
}

/// Web `planEnabledGeneralFollowMarches` (`generalQuickFollow.ts:20-35`).
/// `plan_march` dostaje jednostke, punkt docelowy `(q, r)` i `generalTargetId`.
pub fn plan_enabled_general_follow_marches(
    roster: &[GeneralUnit],
    has_march: impl Fn(&str) -> bool,
    mut plan_march: impl FnMut(&GeneralUnit, (f64, f64), &str) -> bool,
) -> Vec<String> {
    let mut planned = Vec::new();
    for unit in roster {
        if !unit.follow_general
            || has_march(&unit.id)
            || unit.is_general
            || unit.in_garnizon
            || oblega_truthy(&unit.oblega_city_id)
        {
            continue;
        }
        let commander = nearest_living_general(unit, roster);
        let follow = commander.and_then(|c| general_follow_destination(unit, Some(c)));
        let Some(follow) = follow else { continue };
        if hex_distance(unit.q, unit.r, follow.q, follow.r) == 0.0 {
            continue;
        }
        if plan_march(unit, (follow.q, follow.r), &follow.general_target_id) {
            planned.push(unit.id.clone());
        }
    }
    planned
}

/// Web `GeneralQuickFollowEffects` (`generalQuickFollow.ts:37-43`).
pub trait GeneralQuickFollowEffects {
    fn plan_march(&mut self, unit: &GeneralUnit, point: (f64, f64), target_id: &str) -> bool;
    fn movement_left(&self, unit: &GeneralUnit) -> f64;
    fn enqueue(&mut self, unit_ids: &[String]);
    fn notify(&mut self, message: &str, duration_ms: f64);
    fn refresh(&mut self);
}

/// Web `GeneralQuickFollowResult` (`generalQuickFollow.ts:45`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GeneralQuickFollowResult {
    Issued,
    Unavailable,
    Unreachable,
    Ineligible,
}

/// Web `issueGeneralQuickFollow` (`generalQuickFollow.ts:137-161`).
pub fn issue_general_quick_follow(
    unit: &GeneralUnit,
    roster: &[GeneralUnit],
    title: FollowCommanderTitle,
    effects: &mut impl GeneralQuickFollowEffects,
) -> GeneralQuickFollowResult {
    let genitive = commander_title_genitive(title);
    if unit.is_general || unit.in_garnizon || oblega_truthy(&unit.oblega_city_id) {
        return GeneralQuickFollowResult::Ineligible;
    }
    let commander = nearest_living_general(unit, roster);
    let follow = commander.and_then(|c| general_follow_destination(unit, Some(c)));
    let follow = match follow {
        Some(f) if hex_distance(unit.q, unit.r, f.q, f.r) != 0.0 => f,
        _ => {
            effects.notify(
                &format!("Brak dostępnego {genitive} do dołączenia."),
                2800.0,
            );
            effects.refresh();
            return GeneralQuickFollowResult::Unavailable;
        }
    };
    if !effects.plan_march(unit, (follow.q, follow.r), &follow.general_target_id) {
        effects.notify(&format!("Nie można wyznaczyć trasy do {genitive}."), 3200.0);
        effects.refresh();
        return GeneralQuickFollowResult::Unreachable;
    }
    effects.notify(
        &format!(
            "Rozkaz marszu do najbliższego {genitive} wydany — cel będzie śledził jego pozycję."
        ),
        3200.0,
    );
    effects.refresh();
    if effects.movement_left(unit) > 0.0 {
        effects.enqueue(std::slice::from_ref(&unit.id));
    }
    GeneralQuickFollowResult::Issued
}

/// Cel marszu (web `PlannedMarchDest`, `planned-march.ts:14-21`, wariant z `generalTargetId`).
#[derive(Debug, Clone, PartialEq)]
pub struct TrackedMarchDest {
    pub dest_q: f64,
    pub dest_r: f64,
    pub attack_unit_id: Option<String>,
    pub general_target_id: Option<String>,
}

/// Mapa marszow z semantyka `Map` JS (kolejnosc wstawiania; `set` na istniejacym kluczu nie zmienia pozycji).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct MarchMap {
    entries: Vec<(String, TrackedMarchDest)>,
}

impl MarchMap {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn set(&mut self, unit_id: &str, dest: TrackedMarchDest) {
        if let Some(entry) = self.entries.iter_mut().find(|(k, _)| k == unit_id) {
            entry.1 = dest;
        } else {
            self.entries.push((unit_id.to_string(), dest));
        }
    }

    pub fn delete(&mut self, unit_id: &str) {
        self.entries.retain(|(k, _)| k != unit_id);
    }

    pub fn get(&self, unit_id: &str) -> Option<&TrackedMarchDest> {
        self.entries
            .iter()
            .find(|(k, _)| k == unit_id)
            .map(|(_, d)| d)
    }

    /// Kopia wpisow w kolejnosci `Map` (web `[...marches]`).
    pub fn snapshot(&self) -> Vec<(String, TrackedMarchDest)> {
        self.entries.clone()
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

/// Wynik `movementContext` (web `{ mover, occupied, perTurn }`).
#[derive(Debug, Clone, PartialEq)]
pub struct MovementContext {
    pub mover: GeneralUnit,
    pub occupied: HashSet<String>,
    pub per_turn: f64,
}

/// Wynik `pathPlan` (web `{ reachable, fullPath }`; tu tylko dlugosc `fullPath`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PathPlan {
    pub reachable: bool,
    pub full_path_len: usize,
}

/// Web `TrackedFollowPlanner` (`generalQuickFollow.ts:54-63`).
pub trait TrackedFollowPlanner {
    fn player_owner_id(&self) -> f64;
    fn can_occupy(&self, unit: &GeneralUnit, q: f64, r: f64) -> bool;
    fn movement_context(&self, unit: &GeneralUnit) -> MovementContext;
    fn path_plan(
        &self,
        mover: &GeneralUnit,
        q: f64,
        r: f64,
        occupied: &HashSet<String>,
        per_turn: f64,
    ) -> PathPlan;
    fn clear_auto_explore(&mut self, unit: &GeneralUnit);
    fn mark_player_moved(&mut self, unit_id: &str);
    fn marches(&mut self) -> &mut MarchMap;
    fn sync_attack_target(&mut self, unit_id: &str, destination: &TrackedMarchDest);
}

/// Web `planTrackedGeneralFollowMarch` (`generalQuickFollow.ts:66-88`).
pub fn plan_tracked_general_follow_march<P: TrackedFollowPlanner>(
    unit: &GeneralUnit,
    point: (f64, f64),
    general_target_id: Option<&str>,
    planner: &mut P,
    mark_as_player_issued: bool,
) -> bool {
    if unit.owner_id != planner.player_owner_id()
        || unit.in_garnizon
        || oblega_truthy(&unit.oblega_city_id)
    {
        return false;
    }
    if !planner.can_occupy(unit, point.0, point.1) {
        return false;
    }
    let context = planner.movement_context(unit);
    let destination = TrackedMarchDest {
        dest_q: point.0,
        dest_r: point.1,
        attack_unit_id: None,
        general_target_id: general_target_id
            .filter(|s| !s.is_empty())
            .map(str::to_string),
    };
    let path = planner.path_plan(
        &context.mover,
        point.0,
        point.1,
        &context.occupied,
        context.per_turn,
    );
    if !path.reachable || path.full_path_len == 0 {
        return false;
    }
    planner.clear_auto_explore(unit);
    if mark_as_player_issued {
        planner.mark_player_moved(&unit.id);
    }
    planner.marches().set(&unit.id, destination.clone());
    planner.sync_attack_target(&unit.id, &destination);
    true
}

/// Web `syncTrackedGeneralFollowMarches` (`generalQuickFollow.ts:103-128`).
/// `units` - pozycje (ostatni wpis o danym id wygrywa, jak `new Map(units.map(...))`).
pub fn sync_tracked_general_follow_marches(
    units: &[GeneralUnit],
    marches: &mut MarchMap,
    mut clear_attack_target: impl FnMut(&str),
) {
    let mut by_id: HashMap<&str, &GeneralUnit> = HashMap::new();
    for unit in units {
        by_id.insert(unit.id.as_str(), unit);
    }
    for (unit_id, destination) in marches.snapshot() {
        let Some(target_id) = destination
            .general_target_id
            .as_deref()
            .filter(|s| !s.is_empty())
        else {
            continue;
        };
        let stale = match (by_id.get(unit_id.as_str()), by_id.get(target_id)) {
            (Some(follower), Some(commander)) => {
                !commander.is_general
                    || commander.dead
                    || commander.removed
                    || commander.routed
                    || commander.hp.is_some_and(|hp| hp <= 0.0)
                    || follower.owner_id != commander.owner_id
            }
            _ => true,
        };
        if stale {
            marches.delete(&unit_id);
            clear_attack_target(&unit_id);
            continue;
        }
        let (Some(follower), Some(commander)) = (by_id.get(unit_id.as_str()), by_id.get(target_id))
        else {
            continue;
        };
        if follower.q == commander.q && follower.r == commander.r {
            marches.delete(&unit_id);
            continue;
        }
        if destination.dest_q != commander.q || destination.dest_r != commander.r {
            let mut moved = destination.clone();
            moved.dest_q = commander.q;
            moved.dest_r = commander.r;
            marches.set(&unit_id, moved);
        }
    }
}
