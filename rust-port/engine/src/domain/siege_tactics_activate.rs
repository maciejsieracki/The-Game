//! P6 SIEGE-TAKTYKA K5h (R-RUSTPORT-P6-SIEGE-TAKTYKA-K5H-Q1): maszyna decyzyjna `_activateUnit`
//! (`gra/src/battle/battleScene.ts:6048-6299`, pin `07d2fbd72`).
//!
//! Wejscia sa jawne: [`ActivateUnit`] (pola `ru` czytane/pisane przez metode), [`ActivateScene`] (pola `this`),
//! lista wrogow ([`EnemyRef`], pozycje i flagi) oraz [`ActivateOps`] = zapytania i delegowane akcje, ktorych
//! TRESC jest portowana w innych klockach (K1/K1b/K3/K4/K5I/...) albo jest efektem sceny. Wyjscie to lista
//! zdarzen ([`ActivateEvent`]) w kolejnosci wywolan weba, plus tagi galezi ([`ActivateResult::branches`]).
//!
//! Mapa galezi (tagi = `branch`):
//! * U7.0 wstep: `finished`, `dead`, `flee` (routed), `manual`, `doctrine`, `surround` (+ `surround-flee`).
//! * U7.1 `onWallWalkway` (:6129-6171) -> `U7.1-*`.
//! * U7.2 wieza: `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` (:6179-6180) -> `U7.2-climb|inf`.
//! * U7.3 machiny atakujacego (:6187-6220) -> `U7.3-ramtower|cata-fire|cata-advance`.
//! * U7.4 DEFENDER HOLD (:6225-6235) -> `U7.4-*`.
//! * U7.5 strzelec (:6241) -> `U7.5-ranged`.
//! * U7.6 primaryRanged bez amunicji (:6249-6276) -> `U7.6-*`.
//! * U7.7 kawaleria (:6284), U7.8 falanga (:6290), U7.9 melee (:6293-6298).
//!
//! Wywolania wspolne z innymi klockami sa wstrzykniete przez [`ActivateOps`]: `_applyTerrainRange`,
//! `_performPlayerOrder`, `_executeGroupDoctrineStep`, `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` /
//! `_siegeRamTowerStep` (K3: adapter [`tower_ops`] sklada je z `siege_tactics_tower`), `_rangedTargetInRange`,
//! `_targetInRange`, `_advanceCoord`, `_nearestEnemy`. Delegaty akcji (`_fleeStep`, `_rangedAction`,
//! `_cavalryAction`, `_phalanxAction`, `_advanceStep`, `_fallBackStep`, `_doAttack`, `_attackWallTile`,
//! `_advanceToward`) NIE sa portowane tutaj: maszyna emituje zamiar (zdarzenie), jego tresc to osobne klocki.
//! `_checkRout` uzywa K5A ([`should_rout`], [`effective_flee_threshold`]).
//!
//! Wolajacy i zaleznosci (NIE zamkniete w tym klocku): w Rust `activate_unit` nie ma wolajacego poza testem
//! i rejestracja w `mod.rs`. Petla tury (kolejnosc aktywacji, `done()`, K5F/K5G) oraz tresc delegatow musza byc
//! dopisane przy integracji. Przypisanie tresci delegatow w pinie (`gra/src/battle/battleScene.ts`, pin 07d2fbd72):
//! `_advanceToward` (:7892) -> K1/K1b (`_siegeMoveRefused` :7963, `_siegeWalkTo` :8006, `_siegeSafeApproach` :8107);
//! `_doAttack` (:8787) -> `_singleBlow` (:8809, K5I; wejscie BlowInput w K5I-2); `wallEverBreached` (:7647, :7759,
//! :8073) -> K4; wieze -> K3 przez [`tower_ops`]. Maszyna tego klocka nie wola tych funkcji bezposrednio.
//!
//! Predykaty klas (`canShoot`, `isSiegeUnit`, `isSiegeTower`, `_isRam`, `_isCatapult`) sa jawnymi flagami
//! (KLASY nie ma na bazie K5h). Przywrocenie `ru.range = origRange` w galezi muru jest no-op (nic w galezi nie
//! zmienia `range`), wiec nie ma zdarzenia.

use super::siege_tactics_blow::js_max;
use super::siege_tactics_unit::{effective_flee_threshold, should_rout, CombatUnit};

/// Web `MORALE_SURROUND_HIT` (`battleScene.ts:1142`).
pub const MORALE_SURROUND_HIT: f64 = 10.0;
/// Web `FALLBACK_TILES` (`battleScene.ts:1161`).
pub const FALLBACK_TILES: f64 = 3.0;

/// Jednostka aktywowana: pola `ru` (czytane i zapisywane przez `_activateUnit`).
#[derive(Debug, Clone, PartialEq)]
pub struct ActivateUnit {
    pub side_atk: bool,
    pub q: i64,
    pub r: i64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    pub never_rout: bool,
    pub surround_applied: bool,
    pub morale: f64,
    pub flee_morale: f64,
    /// Wynik `terrainDefenseMultiplier(...)` uzywany przez `_checkRout` (wejscie).
    pub terrain_defence_mult: f64,
    pub range: f64,
    pub on_wall_walkway: bool,
    pub primary_ranged: bool,
    pub mounted: bool,
    pub phalanx: bool,
    /// Web `ru.shootingEnabled === false`.
    pub shooting_disabled: bool,
    pub dry_col: f64,
    pub held_after_fallback: bool,
    /// Web `ru.playerOrder.type === 'none'`.
    pub player_order_none: bool,
    /// Wyniki `canShoot(ru)`, `isSiegeUnit(ru.bu)`, `isSiegeTower(ru.bu)`, `_isRam`, `_isCatapult` (wejscia).
    /// Kontrakt wolajacego: `can_shoot` = `rangedBase && ammoLeft > 0` (pin :1457). Predykat NIE czyta `range`,
    /// wiec nie zalezy od `_applyTerrainRange`. Zmienia sie tylko przez zdarzenie ataku, po ktorym aktywacja
    /// konczy sie `return`, wiec flaga jest stala w jednej aktywacji i liczy sie ja PRZED wywolaniem.
    /// Flagi `is_siege_*`, `is_ram`, `is_catapult` wynikaja z `ru.bu` (statyczne).
    pub can_shoot: bool,
    pub is_siege_unit: bool,
    pub is_siege_tower: bool,
    pub is_ram: bool,
    pub is_catapult: bool,
    /// Web `_isUnitDoctrineAuto(ru)` oraz `meta.doctrine === 'manual'` (wejscia).
    pub doctrine_auto: bool,
    pub doctrine_manual: bool,
}

/// Pola `this` czytane przez `_activateUnit`.
#[derive(Debug, Clone, PartialEq)]
pub struct ActivateScene {
    pub finished: bool,
    pub manual_mode: bool,
    /// Web `_isPlayerSide(ru.side)`.
    pub is_player_side: bool,
    /// Web `siegeWallCol` (`-1` = brak muru).
    pub wall_col: i64,
    pub gate_open: bool,
    /// Web `wallTileHp` w kolejnosci wstawienia (rzad, hp).
    pub wall_tile_hp: Vec<(i64, f64)>,
    /// Web `_siegeMachineRange(ru)` (wejscie).
    pub siege_machine_range: f64,
}

/// Wrog z listy strony przeciwnej (`this.def` / `this.atk`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EnemyRef {
    pub q: i64,
    pub r: i64,
    pub dead: bool,
    pub fading_out: bool,
    pub routed: bool,
    pub is_catapult: bool,
}

/// Zapytania i delegaty (poza portem tej maszyny). Zapytania nie maja skutkow ubocznych.
pub trait ActivateOps {
    /// `_applyTerrainRange(ru)`: zwraca `ru.range` po przeliczeniu.
    fn apply_terrain_range(&mut self, current: f64) -> f64;
    fn perform_player_order(&mut self) -> bool;
    /// `_executeGroupDoctrineStep(ru, meta, done)`.
    fn doctrine_step(&mut self) -> bool;
    fn tower_climb(&mut self) -> bool;
    fn infantry_to_tower(&mut self) -> bool;
    fn ram_tower_step(&mut self) -> bool;
    /// `_rangedTargetInRange(ru)`: indeks w liscie wrogow. Czyta `ru.range` (pin :7041), wiec implementacja
    /// musi widziec `range` PO `apply_terrain_range` z tej samej aktywacji.
    fn ranged_target_in_range(&mut self) -> Option<usize>;
    /// `_targetInRange(ru)`: indeks w liscie wrogow. Dla `canShoot(ru)` czyta `ru.range` (pin :8373-8377),
    /// tak samo jak wyzej: kontrakt kolejnosci jak dla `ranged_target_in_range`.
    fn target_in_range(&mut self) -> Option<usize>;
    fn advance_coord(&mut self) -> f64;
    /// `_nearestEnemy(ru)`: pozycja najblizszego wroga.
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)>;
}

/// Zdarzenie wyjsciowe w kolejnosci wywolan weba.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ActivateEvent {
    /// `done()` wywolane przez sama metode.
    Done,
    /// `_fleeStep(ru, done)`.
    Flee,
    ApplyTerrainRange,
    PerformPlayerOrder,
    /// `ru.playerOrder = { type: 'none' }`.
    ResetPlayerOrder,
    DoctrineStep,
    UpdateMoraleBar,
    /// `_startRout(ru)` (z `_checkRout`).
    StartRout,
    UpdateFacing,
    TowerClimb,
    InfantryToTower,
    RamTowerStep,
    /// `_doAttack(ru, enemies[target], done)`.
    Attack {
        target: usize,
    },
    /// `_attackWallTile(ru, row, done)`.
    AttackWallTile {
        row: i64,
    },
    /// `_advanceToward(ru, col, row, done)`.
    AdvanceToward {
        col: i64,
        row: i64,
    },
    RangedAction,
    FallBackStep,
    CavalryAction,
    PhalanxAction,
    AdvanceStep,
}

/// Wynik aktywacji.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct ActivateResult {
    pub events: Vec<ActivateEvent>,
    pub branches: Vec<&'static str>,
}

fn manhattan(ac: i64, ar: i64, bc: i64, br: i64) -> i64 {
    (ac - bc).abs() + (ar - br).abs()
}

/// `Math.max(0, x)` z zachowaniem NaN.
fn js_max0(x: f64) -> f64 {
    js_max(0.0, x)
}

/// Web `_checkRout(ru)` (`battleScene.ts:9783-9797`) przez K5A.
fn check_rout(u: &mut ActivateUnit, out: &mut ActivateResult) {
    let cu = CombatUnit {
        hp: 0.0,
        morale: u.morale,
        flee_morale: u.flee_morale,
        move_left: 0.0,
        never_rout: u.never_rout,
        dead: u.dead,
        fading_out: u.fading_out,
        routed: u.routed,
        removed: false,
        acted: false,
    };
    let flee = effective_flee_threshold(u.flee_morale, u.terrain_defence_mult);
    if should_rout(&cu, flee) {
        // `_startRout` ma wlasny straznik `routed || dead || fadingOut` (podzbior bramki).
        u.routed = true;
        out.events.push(ActivateEvent::StartRout);
    }
}

/// Web `_activateUnit(ru, done)` (`battleScene.ts:6048-6299`).
pub fn activate_unit<O: ActivateOps + ?Sized>(
    ru: &mut ActivateUnit,
    scene: &ActivateScene,
    enemies: &[EnemyRef],
    ops: &mut O,
) -> ActivateResult {
    let mut out = ActivateResult::default();
    let ev = &mut out;

    if scene.finished {
        ev.branches.push("U7.0-finished");
        ev.events.push(ActivateEvent::Done);
        return out;
    }
    if ru.dead || ru.fading_out {
        ev.branches.push("U7.0-dead");
        ev.events.push(ActivateEvent::Done);
        return out;
    }
    if ru.routed {
        ev.branches.push("U7.0-flee");
        ev.events.push(ActivateEvent::Flee);
        return out;
    }

    ev.events.push(ActivateEvent::ApplyTerrainRange);
    ru.range = ops.apply_terrain_range(ru.range);

    if scene.manual_mode && scene.is_player_side {
        ev.events.push(ActivateEvent::PerformPlayerOrder);
        if ops.perform_player_order() {
            ev.branches.push("U7.0-manual");
            return out;
        }
    }

    let siege_defender_never_doctrine = !ru.side_atk && scene.wall_col >= 0;
    let siege_machine_never_doctrine = ru.side_atk && scene.wall_col >= 0 && ru.is_siege_unit;
    if !scene.manual_mode
        && !siege_defender_never_doctrine
        && !siege_machine_never_doctrine
        && ru.doctrine_auto
    {
        if !ru.player_order_none {
            ru.player_order_none = true;
            ev.events.push(ActivateEvent::ResetPlayerOrder);
        }
        if !ru.doctrine_manual {
            ev.events.push(ActivateEvent::DoctrineStep);
            if ops.doctrine_step() {
                ev.branches.push("U7.0-doctrine");
                return out;
            }
        }
    }

    // FACTOR 5 -- SURROUNDED
    if !ru.surround_applied && !ru.never_rout {
        let mut adj = 0;
        for e in enemies {
            if e.dead || e.fading_out || e.routed {
                continue;
            }
            if manhattan(e.q, e.r, ru.q, ru.r) == 1 {
                adj += 1;
            }
        }
        if adj >= 3 {
            ev.branches.push("U7.0-surround");
            ru.surround_applied = true;
            ru.morale = js_max0(ru.morale - MORALE_SURROUND_HIT);
            ev.events.push(ActivateEvent::UpdateMoraleBar);
            check_rout(ru, ev);
            if ru.routed {
                ev.branches.push("U7.0-surround-flee");
                ev.events.push(ActivateEvent::Flee);
                return out;
            }
        }
    }

    ev.events.push(ActivateEvent::UpdateFacing);

    // U7.1 -- WALL WALKWAY
    if ru.on_wall_walkway {
        ev.branches.push("U7.1-walkway");
        if ru.can_shoot {
            let tgt;
            if ru.is_catapult && !ru.side_atk {
                ev.branches.push("U7.1-cata");
                let mut best: Option<usize> = None;
                let mut best_dist = f64::INFINITY;
                for (i, e) in enemies.iter().enumerate() {
                    if e.dead || e.fading_out || e.routed {
                        continue;
                    }
                    if !e.is_catapult {
                        continue;
                    }
                    let dd = manhattan(ru.q, ru.r, e.q, e.r) as f64;
                    if dd <= ru.range && dd < best_dist {
                        best_dist = dd;
                        best = Some(i);
                    }
                }
                tgt = match best {
                    Some(i) => Some(i),
                    None => ops.ranged_target_in_range(),
                };
            } else {
                ev.branches.push("U7.1-shoot-std");
                tgt = ops.ranged_target_in_range();
            }
            if let Some(t) = tgt {
                ev.branches.push("U7.1-shoot-attack");
                ev.events.push(ActivateEvent::Attack { target: t });
                return out;
            }
            ev.branches.push("U7.1-shoot-hold");
            ev.events.push(ActivateEvent::Done);
            return out;
        }
        if let Some(t) = ops.target_in_range() {
            ev.branches.push("U7.1-melee-attack");
            ev.events.push(ActivateEvent::Attack { target: t });
            return out;
        }
        ev.branches.push("U7.1-melee-hold");
        ev.events.push(ActivateEvent::Done);
        return out;
    }

    // U7.2 -- wieza
    ev.events.push(ActivateEvent::TowerClimb);
    if ops.tower_climb() {
        ev.branches.push("U7.2-climb");
        return out;
    }
    ev.events.push(ActivateEvent::InfantryToTower);
    if ops.infantry_to_tower() {
        ev.branches.push("U7.2-inf");
        return out;
    }

    // U7.3 -- machiny atakujacego
    if ru.is_siege_unit && ru.side_atk && scene.wall_col >= 0 {
        if (ru.is_ram && !scene.gate_open) || ru.is_siege_tower {
            ev.events.push(ActivateEvent::RamTowerStep);
            if ops.ram_tower_step() {
                ev.branches.push("U7.3-ramtower");
                return out;
            }
        }
        if ru.is_catapult && !scene.wall_tile_hp.is_empty() {
            let wall_col = scene.wall_col;
            let cata_range = scene.siege_machine_range;
            let mut best_row: i64 = -1;
            let mut best_dist = f64::INFINITY;
            for &(wr, hp) in &scene.wall_tile_hp {
                if hp <= 0.0 {
                    continue;
                }
                let d = manhattan(ru.q, ru.r, wall_col, wr) as f64;
                if d < best_dist {
                    best_dist = d;
                    best_row = wr;
                }
            }
            if best_row >= 0 && best_dist <= cata_range {
                ev.branches.push("U7.3-cata-fire");
                ev.events
                    .push(ActivateEvent::AttackWallTile { row: best_row });
                return out;
            }
            if best_row >= 0 {
                let approach_col = (wall_col - 1).max(0);
                ev.branches.push("U7.3-cata-advance");
                ev.events.push(ActivateEvent::AdvanceToward {
                    col: approach_col,
                    row: best_row,
                });
                return out;
            }
        }
    }

    // U7.4 -- SIEGE DEFENDER HOLD
    if !ru.side_atk && scene.wall_col >= 0 {
        ev.branches.push("U7.4-hold");
        if ru.can_shoot {
            if let Some(t) = ops.ranged_target_in_range() {
                ev.branches.push("U7.4-shoot");
                ev.events.push(ActivateEvent::Attack { target: t });
            } else {
                ev.branches.push("U7.4-shoot-hold");
                ev.events.push(ActivateEvent::Done);
            }
        } else if let Some(t) = ops.target_in_range() {
            ev.branches.push("U7.4-melee");
            ev.events.push(ActivateEvent::Attack { target: t });
        } else {
            ev.branches.push("U7.4-melee-hold");
            ev.events.push(ActivateEvent::Done);
        }
        return out;
    }

    // U7.5 -- strzelec z amunicja
    if ru.can_shoot && !ru.shooting_disabled {
        ev.branches.push("U7.5-ranged");
        ev.events.push(ActivateEvent::RangedAction);
        return out;
    }

    // U7.6 -- primaryRanged bez amunicji
    if ru.primary_ranged {
        ev.branches.push("U7.6-primary");
        if ru.dry_col < 0.0 {
            ev.branches.push("U7.6-dry-record");
            ru.dry_col = ops.advance_coord();
        }
        if let Some(t) = ops.target_in_range() {
            ev.branches.push("U7.6-adj-attack");
            ev.events.push(ActivateEvent::Attack { target: t });
            return out;
        }
        let moved_back = ru.dry_col - ops.advance_coord();
        let dist_threat = match ops.nearest_enemy_pos() {
            Some((nq, nr)) => manhattan(ru.q, ru.r, nq, nr) as f64,
            None => f64::INFINITY,
        };
        if moved_back >= FALLBACK_TILES || dist_threat >= FALLBACK_TILES {
            ev.branches.push("U7.6-set-held");
            ru.held_after_fallback = true;
        }
        if ru.held_after_fallback {
            ev.branches.push("U7.6-hold");
            ev.events.push(ActivateEvent::Done);
            return out;
        }
        ev.branches.push("U7.6-fallback");
        ev.events.push(ActivateEvent::FallBackStep);
        return out;
    }

    // U7.7 -- kawaleria
    if ru.mounted {
        ev.branches.push("U7.7-cavalry");
        ev.events.push(ActivateEvent::CavalryAction);
        return out;
    }
    // U7.8 -- falanga
    if ru.phalanx {
        ev.branches.push("U7.8-phalanx");
        ev.events.push(ActivateEvent::PhalanxAction);
        return out;
    }
    // U7.9 -- melee
    if let Some(t) = ops.target_in_range() {
        ev.branches.push("U7.9-attack");
        ev.events.push(ActivateEvent::Attack { target: t });
        return out;
    }
    ev.branches.push("U7.9-advance");
    ev.events.push(ActivateEvent::AdvanceStep);
    out
}

/// Adapter K3: trzy zapytania wiez (`_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, `_siegeRamTowerStep`)
/// liczone przez `siege_tactics_tower` na wspolnej scenie. Zwraca `handled` kazdej funkcji K3.
pub mod tower_ops {
    use super::super::siege_tactics_tower::{
        siege_infantry_to_tower_step, siege_ram_tower_step, siege_tower_climb, TowerOutcome,
        TowerScene, TowerUnit,
    };

    pub fn climb(scene: &mut TowerScene, unit: &mut TowerUnit) -> TowerOutcome {
        siege_tower_climb(scene, unit)
    }
    pub fn infantry(scene: &mut TowerScene, unit: &mut TowerUnit) -> TowerOutcome {
        siege_infantry_to_tower_step(scene, unit)
    }
    pub fn ram_tower(scene: &mut TowerScene, unit: &mut TowerUnit) -> TowerOutcome {
        siege_ram_tower_step(scene, unit)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct NoOps;
    impl ActivateOps for NoOps {
        fn apply_terrain_range(&mut self, c: f64) -> f64 {
            c
        }
        fn perform_player_order(&mut self) -> bool {
            false
        }
        fn doctrine_step(&mut self) -> bool {
            false
        }
        fn tower_climb(&mut self) -> bool {
            false
        }
        fn infantry_to_tower(&mut self) -> bool {
            false
        }
        fn ram_tower_step(&mut self) -> bool {
            false
        }
        fn ranged_target_in_range(&mut self) -> Option<usize> {
            None
        }
        fn target_in_range(&mut self) -> Option<usize> {
            None
        }
        fn advance_coord(&mut self) -> f64 {
            0.0
        }
        fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
            None
        }
    }

    fn unit() -> ActivateUnit {
        ActivateUnit {
            side_atk: true,
            q: 5,
            r: 5,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            surround_applied: false,
            morale: 50.0,
            flee_morale: 20.0,
            terrain_defence_mult: 1.0,
            range: 1.0,
            on_wall_walkway: false,
            primary_ranged: false,
            mounted: false,
            phalanx: false,
            shooting_disabled: false,
            dry_col: -1.0,
            held_after_fallback: false,
            player_order_none: true,
            can_shoot: false,
            is_siege_unit: false,
            is_siege_tower: false,
            is_ram: false,
            is_catapult: false,
            doctrine_auto: false,
            doctrine_manual: false,
        }
    }

    fn scene() -> ActivateScene {
        ActivateScene {
            finished: false,
            manual_mode: false,
            is_player_side: false,
            wall_col: -1,
            gate_open: false,
            wall_tile_hp: vec![],
            siege_machine_range: 0.0,
        }
    }

    #[test]
    fn domyslna_melee_bez_celu_idzie_naprzod() {
        let mut u = unit();
        let r = activate_unit(&mut u, &scene(), &[], &mut NoOps);
        assert_eq!(r.events.last(), Some(&ActivateEvent::AdvanceStep));
        assert_eq!(r.branches.last(), Some(&"U7.9-advance"));
    }

    #[test]
    fn nan_morale_przy_otoczeniu_rozbija() {
        let mut u = unit();
        u.morale = f64::NAN;
        let e = |q, r| EnemyRef {
            q,
            r,
            dead: false,
            fading_out: false,
            routed: false,
            is_catapult: false,
        };
        let en = [e(4, 5), e(6, 5), e(5, 4)];
        let r = activate_unit(&mut u, &scene(), &en, &mut NoOps);
        assert!(u.routed);
        assert_eq!(r.events.last(), Some(&ActivateEvent::Flee));
    }
}
