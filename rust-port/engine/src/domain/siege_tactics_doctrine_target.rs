//! K5DOC-T2 CELE (dispatch R-RUSTPORT-P6-K5DOC-T2-CELE-Q1): wybor celu wg priorytetow gracza, port 1:1 z pina
//! `gra/src/battle/battleScene.ts` przy `07d2fbd72`.
//!
//! Zakres (kazda funkcja ma podpisany zakres linii pina):
//! * [`unit_battle_class`] = `_unitBattleClass` (`battleScene.ts:17486-17489`),
//! * [`prefs_for_unit`] = `_prefsForUnit` (`:17496-17511`): priorytet jednostki > grupy > armii,
//! * [`priority_score`] = `_priorityScore` (`:17512-17520`), bonus `+0.45` jazdy przeciw wloczni (`:17518`),
//! * [`pick_target_by_priority`] = `_pickTargetByPriority` (`:17523-17543`), tie-break po dystansie,
//! * [`pick_adjacent_target_by_priority`] = `_pickAdjacentTargetByPriority` (`:17545-17569`), kierunek natarcia,
//! * [`pick_ranged_target_by_priority`] = `_pickRangedTargetByPriority` (`:17571-17584`), zasieg `[1..range]`,
//! * [`ranged_target_in_range`] = `_rangedTargetInRange` (`:7041-7053`), najblizszy w zasiegu, tie-break po HP,
//! * [`target_in_range`] = `_targetInRange` (`:8373-8410`), z filtrem [`melee_blocked_by_wall_for`]
//!   (`_meleeBlockedByWall`, `:8361-8371`), `dd === 0 || dd === 1` i wyborem po `lowestHp`,
//! * [`takes_ranged_action`] = warunek `canShoot(ru) && ru.shootingEnabled !== false` (`:6241`),
//! * [`enemies_of`] = `_enemiesOf` (`:8291-8294`), filtr `!dead && !fadingOut && !routed`,
//! * [`desired_hit_for_direction`] = `desiredHitForDirection` (`:1956-1960`).
//!
//! Wejscie jest jawne: zamiast `RuntimeBattleUnit` funkcje biora [`Combatant`] (pola uzywane przez pin)
//! oraz [`TargetScene`] (stan sceny: `siegeWallCol`, `wallEverBreached`) i [`GroupPrefs`] (meta grupy
//! attackera, `None` = brak grupy lub brak wpisu w `_groupMeta`). Nie zmienia zadnej sciezki produkcyjnej:
//! wpiecie w pętle nalezy do tematow T8 / #113.
//!
//! Wartosci domyslne priorytetow armii: `DEFAULT_TARGET_PRIORITIES` (`battleScene.ts:2323-2327`) oraz
//! identyczna inicjalizacja `_targetPriorities` (`:2328-2332`). Wektory: `tests/p6_k5doc_target_vectors/`.

use crate::domain::siege_city_fortification::{melee_blocked_by_wall, MeleeWallContext};
use crate::domain::siege_tactics_blow::HitArc;
use crate::domain::siege_tactics_doctrine_state::BattleUnitClass;
use crate::domain::siege_tactics_inputs_pos::{relative_hit, JsVal};

/// Web `type AttackDirection = 'front' | 'bok' | 'tyl'` (`battleScene.ts:1950`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AttackDirection {
    Front,
    Bok,
    Tyl,
}

/// Web `desiredHitForDirection(dir)` (`battleScene.ts:1956-1960`): `bok` -> flank, `tyl` -> rear, `front` -> brak.
pub fn desired_hit_for_direction(dir: AttackDirection) -> Option<HitArc> {
    match dir {
        AttackDirection::Bok => Some(HitArc::Flank),
        AttackDirection::Tyl => Some(HitArc::Rear),
        AttackDirection::Front => None,
    }
}

/// Indeks klasy w tablicach `Record<BattleUnitClass, ...>` (kolejnosc: mounted, ranged, melee).
fn class_ix(c: BattleUnitClass) -> usize {
    match c {
        BattleUnitClass::Mounted => 0,
        BattleUnitClass::Ranged => 1,
        BattleUnitClass::Melee => 2,
    }
}

/// Web `Partial<Record<BattleUnitClass, BattleUnitClass[]>>` (np. `unitTargetPriorities`, `groupTargetPriorities`).
/// `None` w danej klasie = brak wpisu (pin: `up` undefined).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PartialPriorities {
    pub by_class: [Option<Vec<BattleUnitClass>>; 3],
}

/// Priorytety armii: `Record<BattleUnitClass, BattleUnitClass[]>` (pin `_targetPriorities`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TargetPriorities {
    pub by_class: [Vec<BattleUnitClass>; 3],
}

impl Default for TargetPriorities {
    /// Domyslne `_targetPriorities` = `DEFAULT_TARGET_PRIORITIES` (`battleScene.ts:2323-2327`, `:2328-2332`).
    fn default() -> Self {
        use BattleUnitClass::{Melee, Mounted, Ranged};
        Self {
            by_class: [
                vec![Mounted, Ranged, Melee], // mounted: ['mounted', 'ranged', 'melee'] (:2324)
                vec![Ranged, Mounted, Melee], // ranged:  ['ranged', 'mounted', 'melee'] (:2325)
                vec![Melee, Ranged, Mounted], // melee:   ['melee', 'ranged', 'mounted'] (:2326)
            ],
        }
    }
}

/// Pola jednostki (`RuntimeBattleUnit`) czytane przez wybor celu. Wspolrzedne: kolumna `q`, wiersz `r`.
#[derive(Debug, Clone, PartialEq)]
pub struct Combatant {
    pub q: i64,
    pub r: i64,
    /// `ru.bu.hp` (`lowestHp`, tie-break przy wyborze przylegajacego celu).
    pub hp: f64,
    /// `ru.range` (zasieg strzalu; wrecz = 1 w grze, tu przekazywany jawnie).
    pub range: i64,
    /// `ru.mounted` (`:2010` / `isMounted`).
    pub mounted: bool,
    /// `ru.primaryRanged`.
    pub primary_ranged: bool,
    /// `ru.rangedBase`.
    pub ranged_base: bool,
    /// `ru.ammoLeft`.
    pub ammo_left: f64,
    /// `ru.shootingEnabled` (`:2032`).
    pub shooting_enabled: bool,
    /// `ru.antiCavSpear` (`:2009`).
    pub anti_cav_spear: bool,
    /// `ru.facing` (Dir 0..3, `relativeHit`).
    pub facing: f64,
    /// `ru.onWallWalkway`.
    pub on_wall_walkway: bool,
    /// `isSiegeUnit(ru.bu)`.
    pub is_siege_unit: bool,
    /// `ru.attackDirection` (`:2041`-okolice; domyslnie `Front`).
    pub attack_direction: AttackDirection,
    /// `ru.dead`.
    pub dead: bool,
    /// `ru.fadingOut`.
    pub fading_out: bool,
    /// `ru.routed`.
    pub routed: bool,
    /// `ru.useUnitPriorities` (`:2046`).
    pub use_unit_priorities: bool,
    /// `ru.unitTargetPriorities` (`:2045`).
    pub unit_target_priorities: Option<PartialPriorities>,
}

/// Meta grupy atakujacego (`GroupMeta`, `:2064-2076`): `useGroupPriorities` + `groupTargetPriorities`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct GroupPrefs {
    /// `meta.useGroupPriorities` (`:2075-2076`).
    pub use_group_priorities: bool,
    /// `meta.groupTargetPriorities` (`:2074`).
    pub group_target_priorities: Option<PartialPriorities>,
}

/// Stan sceny potrzebny do filtra muru (`this.siegeWallCol`, `this.wallEverBreached`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TargetScene {
    /// `this.siegeWallCol` (`< 0` = brak muru, `_meleeBlockedByWall` zwraca `false`).
    pub siege_wall_col: i64,
    /// `this.wallEverBreached`.
    pub wall_ever_breached: bool,
}

/// Web `_unitBattleClass(ru)` (`battleScene.ts:17486-17489`).
pub fn unit_battle_class(u: &Combatant) -> BattleUnitClass {
    if u.mounted {
        BattleUnitClass::Mounted
    } else if u.primary_ranged || u.ranged_base {
        BattleUnitClass::Ranged
    } else {
        BattleUnitClass::Melee
    }
}

/// Web `canShoot(ru)` (`battleScene.ts:1457-1459`): `ru.rangedBase && ru.ammoLeft > 0`.
pub fn can_shoot(u: &Combatant) -> bool {
    u.ranged_base && u.ammo_left > 0.0
}

/// Warunek gałęzi strzału z pina (`battleScene.ts:6241`, `:17971` i pokrewne): `canShoot(ru) && ru.shootingEnabled !== false`.
pub fn takes_ranged_action(u: &Combatant) -> bool {
    can_shoot(u) && u.shooting_enabled
}

/// Web `manhattan(ac, ar, bc, br)` (`battleScene.ts:1917-1919`).
pub fn manhattan(a: &Combatant, b: &Combatant) -> i64 {
    (a.q - b.q).abs() + (a.r - b.r).abs()
}

/// Web `_enemiesOf(ru)` (`battleScene.ts:8291-8294`): przeciwna strona bez jednostek martwych, znikajacych i rozbitych.
/// Zwraca indeksy do `side` (zeby wywolujacy mogl odniesc wynik do listy zrodlowej).
pub fn enemies_of(side: &[Combatant]) -> Vec<(usize, &Combatant)> {
    side.iter()
        .enumerate()
        .filter(|(_, u)| !u.dead && !u.fading_out && !u.routed)
        .collect()
}

/// Web `_prefsForUnit(ru)` (`battleScene.ts:17496-17511`). Kolejnosc: priorytet jednostki (gdy `useUnitPriorities`
/// i wpis dlugosci 3), potem grupy (gdy `useGroupPriorities` i wpis dlugosci 3), potem armii.
pub fn prefs_for_unit(
    a: &Combatant,
    army: &TargetPriorities,
    group: Option<&GroupPrefs>,
) -> Vec<BattleUnitClass> {
    let ac = unit_battle_class(a);
    if a.use_unit_priorities {
        if let Some(up) = a
            .unit_target_priorities
            .as_ref()
            .and_then(|p| p.by_class[class_ix(ac)].as_ref())
        {
            if up.len() == 3 {
                return up.clone();
            }
        }
    }
    if let Some(meta) = group {
        if meta.use_group_priorities {
            if let Some(gp) = meta
                .group_target_priorities
                .as_ref()
                .and_then(|p| p.by_class[class_ix(ac)].as_ref())
            {
                if gp.len() == 3 {
                    return gp.clone();
                }
            }
        }
    }
    army.by_class[class_ix(ac)].clone()
}

/// Web `_priorityScore(ru, enemy)` (`battleScene.ts:17512-17520`). Indeks klasy celu w `prefs` (brak = `prefs.len()`),
/// plus `+0.45` gdy atakujacy to jazda, a cel to wloczna przeciwjazdowa.
pub fn priority_score(a: &Combatant, e: &Combatant, prefs: &[BattleUnitClass]) -> f64 {
    let ac = unit_battle_class(a);
    let ec = unit_battle_class(e);
    let idx = prefs.iter().position(|c| *c == ec);
    let mut score = match idx {
        Some(i) => i as f64,
        None => prefs.len() as f64,
    };
    // battleScene.ts:17518 -- bonus antyjazdy (`score += 0.45`).
    if ac == BattleUnitClass::Mounted && e.anti_cav_spear {
        score += 0.45;
    }
    score
}

/// Web `_pickTargetByPriority(ru)` (`battleScene.ts:17523-17543`): najlepszy wg priorytetu, tie-break po dystansie.
/// Remis calkowity: zostaje pierwszy w kolejnosci listy (`<` jest scisle).
pub fn pick_target_by_priority(
    a: &Combatant,
    side: &[Combatant],
    army: &TargetPriorities,
    group: Option<&GroupPrefs>,
) -> Option<usize> {
    let prefs = prefs_for_unit(a, army, group);
    let mut best: Option<usize> = None;
    let mut best_p = f64::INFINITY;
    let mut best_d = i64::MAX;
    for (i, e) in enemies_of(side) {
        let p = priority_score(a, e, &prefs);
        let d = manhattan(a, e);
        if p < best_p || (p == best_p && d < best_d) {
            best_p = p;
            best_d = d;
            best = Some(i);
        }
    }
    best
}

/// Web `_pickAdjacentTargetByPriority(ru)` (`battleScene.ts:17545-17569`). Sasiedzi (dystans 1); gdy kierunek
/// natarcia wymaga `flank`/`rear`, najpierw wybor sposrod trafien o tym łuku (`relativeHit`), potem zwykly wybor.
/// Tie-break w wyborze po priorytecie: nizsze HP (`e.bu.hp < best.bu.hp`).
pub fn pick_adjacent_target_by_priority(
    a: &Combatant,
    side: &[Combatant],
    army: &TargetPriorities,
    group: Option<&GroupPrefs>,
) -> Option<usize> {
    let prefs = prefs_for_unit(a, army, group);
    let adj: Vec<(usize, &Combatant)> = enemies_of(side)
        .into_iter()
        .filter(|(_, e)| manhattan(a, e) == 1)
        .collect();
    if adj.is_empty() {
        return None;
    }
    let best_by_priority = |list: &[(usize, &Combatant)]| -> Option<usize> {
        let mut best: Option<(usize, &Combatant)> = None;
        let mut best_p = f64::INFINITY;
        for &(i, e) in list {
            let p = priority_score(a, e, &prefs);
            let take = match best {
                None => p < best_p,
                Some((_, b)) => p < best_p || (p == best_p && e.hp < b.hp),
            };
            if take {
                best_p = p;
                best = Some((i, e));
            }
        }
        best.map(|(i, _)| i)
    };

    if let Some(desired) = desired_hit_for_direction(a.attack_direction) {
        let matching: Vec<(usize, &Combatant)> = adj
            .iter()
            .copied()
            .filter(|(_, e)| hit_arc(a, e) == desired)
            .collect();
        if let Some(m) = best_by_priority(&matching) {
            return Some(m);
        }
    }
    best_by_priority(&adj)
}

/// Web `_pickRangedTargetByPriority(ru)` (`battleScene.ts:17571-17584`): cel w zasiegu `[1..range]`, priorytet,
/// tie-break po dystansie (mniejszy wygrywa).
pub fn pick_ranged_target_by_priority(
    a: &Combatant,
    side: &[Combatant],
    army: &TargetPriorities,
    group: Option<&GroupPrefs>,
) -> Option<usize> {
    let prefs = prefs_for_unit(a, army, group);
    let mut best: Option<usize> = None;
    let mut best_p = f64::INFINITY;
    let mut best_d = i64::MAX;
    for (i, e) in enemies_of(side) {
        let d = manhattan(a, e);
        if d > a.range || d < 1 {
            continue;
        }
        let p = priority_score(a, e, &prefs);
        if p < best_p || (p == best_p && d < best_d) {
            best_p = p;
            best_d = d;
            best = Some(i);
        }
    }
    best
}

/// Web `_rangedTargetInRange(ru)` (`battleScene.ts:7041-7053`): najblizszy wrog w `[1..range]`,
/// przy remisie odleglosci nizsze HP.
pub fn ranged_target_in_range(a: &Combatant, side: &[Combatant]) -> Option<usize> {
    let mut best: Option<usize> = None;
    let mut best_d = i64::MAX;
    for (i, e) in enemies_of(side) {
        let dd = manhattan(a, e);
        if dd < 1 || dd > a.range {
            continue;
        }
        let take = match best {
            None => dd < best_d,
            Some(b) => dd < best_d || (dd == best_d && e.hp < side[b].hp),
        };
        if take {
            best_d = dd;
            best = Some(i);
        }
    }
    best
}

/// Web `_meleeBlockedByWall(ru, e)` (`battleScene.ts:8361-8371`): `meleeBlockedByWall` z kontekstem sceny.
/// `attackerIsMelee = !canShoot(ru) && !isSiegeUnit(ru.bu)`; brak muru (`siegeWallCol < 0`) = `false`.
pub fn melee_blocked_by_wall_for(a: &Combatant, e: &Combatant, scene: &TargetScene) -> bool {
    if scene.siege_wall_col < 0 {
        return false;
    }
    melee_blocked_by_wall(MeleeWallContext {
        wall_breached: scene.wall_ever_breached,
        attacker_is_melee: !can_shoot(a) && !a.is_siege_unit,
        attacker_on_wall: a.on_wall_walkway,
        defender_on_wall: e.on_wall_walkway,
    })
}

/// Web `_targetInRange(ru)` (`battleScene.ts:8373-8410`).
///
/// Strzelec (`canShoot`): wrogowie w `[1..range]`, bez filtra muru. Wrecz: filtr `_meleeBlockedByWall`, potem
/// `dd === 0 || dd === 1`. Zbior zasiegu zawezony do kierunku natarcia (`relativeHit`), gdy pasuja; wybor po `lowestHp`.
pub fn target_in_range(a: &Combatant, side: &[Combatant], scene: &TargetScene) -> Option<usize> {
    let mut in_reach: Vec<(usize, &Combatant)> = Vec::new();
    if can_shoot(a) {
        for (i, e) in enemies_of(side) {
            let dd = manhattan(a, e);
            if dd >= 1 && dd <= a.range {
                in_reach.push((i, e));
            }
        }
    } else {
        for (i, e) in enemies_of(side) {
            if melee_blocked_by_wall_for(a, e, scene) {
                continue;
            }
            let dd = manhattan(a, e);
            if dd == 1 || dd == 0 {
                in_reach.push((i, e));
            }
        }
    }
    if in_reach.is_empty() {
        return None;
    }
    if let Some(desired) = desired_hit_for_direction(a.attack_direction) {
        let matching: Vec<(usize, &Combatant)> = in_reach
            .iter()
            .copied()
            .filter(|(_, e)| hit_arc(a, e) == desired)
            .collect();
        if !matching.is_empty() {
            return Some(lowest_hp(&matching));
        }
    }
    Some(lowest_hp(&in_reach))
}

/// Web `lowestHp(list)` z `_targetInRange`: pierwszy o najnizszym HP (`<` scisle).
fn lowest_hp(list: &[(usize, &Combatant)]) -> usize {
    let mut best = list[0];
    for &(i, e) in list {
        if e.hp < best.1.hp {
            best = (i, e);
        }
    }
    best.0
}

/// `relativeHit(e.facing, ru.q, ru.r, e.q, e.r)` (`battleScene.ts:385-400`) w postaci wejsc tekstowych [`JsVal`].
fn hit_arc(a: &Combatant, e: &Combatant) -> HitArc {
    relative_hit(
        &JsVal::Num(e.facing),
        &JsVal::Num(a.q as f64),
        &JsVal::Num(a.r as f64),
        &JsVal::Num(e.q as f64),
        &JsVal::Num(e.r as f64),
    )
}
