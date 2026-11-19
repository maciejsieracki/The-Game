//! P6 SIEGE-TAKTYKA K5-LOOP (runda 1 Operatora, dispatch R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-Q1): cienki sterownik
//! składający moduły K5 w jedną pętlę bitwy oblężenia.
//!
//! Składa (bez zmiany ich logiki):
//! * [`begin_turn`] / [`activate_next`] / [`activation_done`] z `siege_tactics_turnseq` (`_beginTurn`, `_activateNext`,
//!   callback `_activateUnit`, `battleScene.ts:5631-5689`, `:5979-6030`),
//! * [`VirtualClock`] z `siege_tactics_clock` (`_schedule` `:9595-9606`, `_drainTimers` `:9616-9634`),
//! * [`run_fast_forward`] z `siege_tactics_fastforward` (`_runFastForward` `:9415-9437`) z werdyktem sufitu
//!   [`round_cap_verdict_step`] (`_roundCapVerdict` `:9449-9464`) i zakończeniem jak `_ffRoundCapResult` `:9485-9497`.
//!
//! Stan bitwy jest jawny ([`TurnSeqState`] + [`SiegeEnv`]). Efekty zewnętrzne są wstrzykiwane:
//! * ciało jednostki ([`LoopBody`]): czas trwania animacji i efekt na stanie w chwili zakończenia; na pinie to
//!   `_activateUnit` (K5h/K5i), tu jawny port wstrzykiwany (domyślna implementacja `single_blow_full` nie jest
//!   jeszcze podpięta, patrz raport K5-LOOP),
//! * wieżyczki muru (`_fireSiegeTowers`, R4): planowanie wystrzałów z odroczeniem 180 ms ([`SiegeEnv::pending_tower_shots`]),
//!   cel wybierany w chwili wystrzału, trafienie `_singleBlow` (ranged) po locie [`TOWER_FLY_MS`] (WIEZE-2B2,
//!   [`tower_blow_on_target`]); strzał wymaga szablonu strzelca [`SiegeEnv::tower_shot`] (brak wiersza = brak strzału).
//!
//! Zakres: oblężenie (`siege_wall_col >= 0`) w trybie AUTO sekwencyjnym. Sciezka `_beginAutoBatchPhase` (K5g0, bez
//! oblezenia) nie jest składana w tym module: zdarzenie [`SeqEvent::BeginAutoBatchPhase`] zatrzymuje sterownik panika,
//! bo dla oblezenia pin jej nie wywołuje.
//!
//! Nie wpina się w `PlayableState`. Nie zawiera czasu ściennego: budżet przewijania to jawny `max_steps`.

use std::cell::Cell;
use std::collections::{BTreeSet, HashMap, HashSet};

use crate::domain::army_leadership::{army_morale_ratio_without_commander, ArmyLeaderCombatant};
use crate::domain::city_towers::{strongest_ranged_unit_for_era, tower_range_for, UnitRow};
use crate::domain::formation_rules::CompactSide;
use crate::domain::js_math::js_max0;
use crate::domain::player_order_move_gate::{
    compact_attack_allows_step, should_avoid_auto_backtrack, BacktrackUnit, BlockadeSettings,
    CompactStepUnit, GroupDoctrine as GateDoctrine, GroupMeta, LineMember,
};
use crate::domain::siege_battle_adapter_body::{apply_terrain_range, TerrainRangeUnit};
use crate::domain::siege_city_fortification::{melee_blocked_by_wall, MeleeWallContext};
use crate::domain::siege_no_breach::RoundCapVerdict;
use crate::domain::siege_tactics_actions::{
    actions_to_dto, arc_tag, check_end_logs, clash_line, eliminated_log, ff_round_cap_logs,
    hit_log, miss_log, rout_log, tower_shooter_name, tower_shot_log, ActionError, Actor,
    BattleAction, EndLogInput, TimedAction,
};
use crate::domain::siege_tactics_activate::{
    activate_unit, ActivateEvent, ActivateOps, ActivateScene, ActivateUnit, EnemyRef,
};
use crate::domain::siege_tactics_advance::{
    advance_after_move, advance_step_decide, AdvanceDecision, AdvanceUnit, AdvanceWorld, AfterStep,
};
use crate::domain::siege_tactics_approach::{
    siege_approach_restricted, siege_move_refused, siege_shooter_threats, ApproachUnit,
    ApproachWallState, ShooterDefender, SiegeTowerRef, BF_COLS, BF_ROWS,
};
use crate::domain::siege_tactics_atk::{
    advance_toward_pick, attacker_wall_entry_is_breach, goal_holds, infantry_to_tower_plan,
    ram_tower_plan, tower_climb_allowed, AtkGoal, AtkSiegeScene, AtkUnitFlags, InfantryPlan,
    RamTowerPlan, WYLOM_LOG,
};
use crate::domain::siege_tactics_atk_b::{
    siege_structure_damage, tile_index_in_bounds, tower_destroyed_log, wall_retreat_cell,
    wall_tile_damage, SiegeStructStats, MORALE_GATE_BREACH, MORALE_WALL_BREACH, RAM_ANIM_MS,
    WALL_HIT_FLY_MS,
};
use crate::domain::siege_tactics_autobatch::{
    cell_key, AutoBatchEnv, BatchBoard, BatchState, CellKey,
};
use crate::domain::siege_tactics_autophase::AutoBatchIntent;
use crate::domain::siege_tactics_blow::{
    js_max, js_min, ClashTag, DefenderState, HitArc, Outcome, RollSource, SceneEffect, Side,
    MORALE_HIT_LOSS_SCALE,
};
use crate::domain::siege_tactics_blow_full::{
    attacker_from_cu, single_blow_full, AtkMods, AttackerCu, BlowEnv, DefMods, DefenderCu,
    FullBlowInput, FullBlowOutput,
};
use crate::domain::siege_tactics_cavalry::{
    best_charge_step, cav_adjacent_non_spear, cav_directed_maneuver_step, cav_maneuver_step,
    cavalry_target, first_step_toward_directed_attack, CavTerrain, Tile as CavTile,
};
use crate::domain::siege_tactics_clock::{ScheduleOutcome, VirtualClock};
use crate::domain::siege_tactics_doctrine_state::{GroupDoctrine, ProdDoctrineState};
use crate::domain::siege_tactics_doctrine_step::{
    effective_doctrine, execute_group_doctrine_step, DoctrineAction, DoctrineStep, DoctrineStepUnit,
};
use crate::domain::siege_tactics_doctrine_target::{
    desired_hit_for_direction, enemies_of as enemies_of_cmb, pick_adjacent_target_by_priority,
    pick_target_by_priority, ranged_target_in_range as ranged_target_cmb,
    target_in_range as target_in_range_cmb, AttackDirection, Combatant, TargetPriorities,
    TargetScene,
};
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_endcheck::EndCheckOutcome;
use crate::domain::siege_tactics_fallback::{
    fall_back_after_move, fall_back_step_decide, FallBackDecision, FallBackUnit, FallBackWorld,
};
use crate::domain::siege_tactics_fastforward::{
    round_cap_verdict_step, run_fast_forward, FfEvent, FfHost, FfLoopState, FfStop,
};
use crate::domain::siege_tactics_inputs_pos::{facing_toward, relative_hit, JsVal};
use crate::domain::siege_tactics_inputs_unit::{
    to_combat_unit, BattleUnitIn, StatRow, ToCombatUnitOpts, UVal,
};
use crate::domain::siege_tactics_kite::{
    best_kite_shot_step, nearest_enemy_melee, KiteUnit, MELEE_SAFE_GAP,
};
use crate::domain::siege_tactics_move_effects::{
    do_move_effects, MoveOutcome, MoveTerrain, MoveUnit, MoveWorld,
};
use crate::domain::siege_tactics_pathstep::Tile as PathTile;
use crate::domain::siege_tactics_phalanx::{
    phalanx_action_decide, PhalanxDecision, PhalanxEnemy, PhalanxUnit, PhalanxWorld,
};
use crate::domain::siege_tactics_ranged_forward::{best_forward_step, ForwardUnit};
use crate::domain::siege_tactics_roundcap::RoundCapState;
use crate::domain::siege_tactics_tower::{pick_tower_target, TowerTarget};
use crate::domain::siege_tactics_turnseq::{
    activate_next, activation_done, begin_turn, CheckSite, EndCheckSnapshot, SeqEvent, SeqStep,
    SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef,
};
use crate::domain::siege_tactics_unit::{
    effective_flee_threshold, should_rout, side_alive_end, CombatUnit,
};
use crate::domain::siege_tactics_walk::{
    siege_walk_to, DoMoveGate, WalkEvent, WalkUnit, WalkWorld, STEP_GAP_MS,
};

/// Wejście ciała jednostki (web `_activateUnit`): czas trwania i zakończenie.
pub trait LoopBody {
    /// Start ciała jednostki. Zwraca czas trwania (ms), po którym sterownik planuje zakończenie.
    fn start(&mut self, unit: UnitRef, st: &TurnSeqState) -> f64;
    /// Zakończenie ciała jednostki: efekt na stanie, przed callbackiem `_activateUnit`.
    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState);
    /// Pozycja `(q, r)` jednostki (web `u.q`, `u.r`) potrzebna `pickTowerTarget` w `_fireOneTower`.
    /// Domyślnie `None`: jednostka bez pozycji nie jest brana pod uwagę przez wieże.
    fn unit_cell(&self, _unit: UnitRef) -> Option<(i64, i64)> {
        None
    }
    /// Obrona r2 (E2-1b, D-WIRA-18): pozycja jednostki W CHWILI `v_now` (web `ru.q/ru.r` w trakcie marszu
    /// wielokrokowego, `_doMove` zmienia je w chwili kroku). Czytana przez `pickTowerTarget` w `_fireOneTower`
    /// (`battleScene.ts:4228-4233`). Domyślnie = [`LoopBody::unit_cell`].
    fn unit_cell_at(&self, unit: UnitRef, _v_now: f64) -> Option<(i64, i64)> {
        self.unit_cell(unit)
    }
    /// Trafienie wieży (web `_singleBlow(shooter, target, true)` w `_fireOneTower`, `battleScene.ts:4262`): cios z
    /// szablonu `tmpl` na atakującego `target` (indeks w `st.atk`), skutki HP/zabicia w `st`. Domyślnie bez efektu.
    fn tower_blow(&mut self, _tmpl: &FullBlowInput, _target: usize, _st: &mut TurnSeqState) {}
    /// P4-1I3: czas wirtualny (`vNow`) kolejnego wywołania ciała (`start`, `complete`, `tower_blow`); sterownik
    /// ustawia go tuż przed wywołaniem. Akcje sceny ciała dostają ten czas jako `t0`. Domyślnie bez efektu.
    fn set_now(&mut self, _v_now: f64) {}
    /// P4-1I3: wiersz wieży, której pocisk trafia w najbliższym [`LoopBody::tower_blow`] (web `'wieza:' + t.row`).
    /// Domyślnie bez efektu.
    fn set_tower_row(&mut self, _row: i64) {}
    /// P4-1I3 (obrona r1, zarzut 1): web `this._ffActive` (`battleScene.ts:2573`). W trybie przewijania
    /// `_spawnDamageLabel` kończy się od razu (`:9943`), więc ciało nie emituje wtedy [`BattleAction::Damage`].
    /// Sterownik ustawia `true` w [`SiegeLoop::resume`] (jedyny sterownik czasu to [`run_fast_forward`], web
    /// `_runFastForward`, wołane tylko przy `_ffActive`, `:9267`). Domyślnie bez efektu.
    fn set_ff_active(&mut self, _ff_active: bool) {}
    /// P4-1I3: akcje sceny zebrane od ostatniego odbioru, w kolejności wywołań (sterownik odbiera je po każdym
    /// wywołaniu ciała). Domyślnie brak akcji.
    fn take_actions(&mut self) -> Vec<TimedAction> {
        Vec::new()
    }
    /// P4-1I3: `bu.nazwa` jednostki (tekst logu wystrzału wieży, `battleScene.ts:4247`). Domyślnie znacznik
    /// strony i indeksu (`atk0`, `def1`).
    fn unit_name(&self, unit: UnitRef) -> String {
        unit_tag(unit)
    }
    /// K5LOOP-SIEGE-ATK-B (T2b): odroczone wywołania ciała zaplanowane w ostatnim wywołaniu (`start`, `complete`,
    /// [`LoopBody::fire_timer`]) jako `(ms, id)`: web `this._schedule(ms, cb)` z wnętrza ciała, które NIE kończy aktywacji
    /// (np. trafienie kamienia katapulty w mur, `_attackWallTile` `:7555`). Sterownik wstawia je do zegara PRZED
    /// zakończeniem aktywacji (kolejność `id` jak w pinie: `_schedule` przed `done()`) i woła
    /// [`LoopBody::fire_timer`] w chwili odpalenia. Domyślnie brak.
    fn take_timers(&mut self) -> Vec<(f64, u64)> {
        Vec::new()
    }
    /// K5LOOP-SIEGE-ATK-B (T2b): odpalenie odroczonego wywołania `id` (patrz [`LoopBody::take_timers`]) ze skutkami na
    /// `st`. Domyślnie bez efektu.
    fn fire_timer(&mut self, _id: u64, _st: &mut TurnSeqState) {}
    /// K5LOOP-SIEGE-ATK-B (T2b, dług T2a): web `this.wallEverBreached` po stronie ciała (wyłom przez wieżę
    /// `_trySiegeTowerClimb` `:8072-8073`, kafla muru `:7647`, bramy `:7759`). Sterownik synchronizuje
    /// [`SiegeEnv::wall_ever_breached`] po każdym wywołaniu ciała. Domyślnie `false`.
    fn wall_ever_breached(&self) -> bool {
        false
    }
    /// K5LOOP-SIEGE-ATK-B (T2b): `_destroyTowerAtRow(row)` wołane przez sterownik (`_fireSiegeTowers`, wieża bez kafla
    /// muru, `:4216`), żeby stan wież ciała (zagrożenia `_siegeShooterThreats`, `:7932-7935`) był zgodny. Domyślnie bez
    /// efektu.
    fn on_tower_destroyed(&mut self, _row: i64) {}
    /// K5LOOP-WIRING-A obrona r2 (E2-1b, D-WIRA-17): czas (ms) między [`LoopBody::complete`] a `done()` aktywacji. Pin
    /// rozdziela chwilę skutku od końca aktywacji: cios wręcz pada w `BLOW_HIT_T`, a `done()` dopiero po końcu lunge
    /// (`BLOW_LUNGE_MS`) i `_schedule(BLOW_SETTLE_MS)` (`_doMeleeAttack` `battleScene.ts:9119-9172`); strzał trafia po
    /// `RANGED_FLY_MS`, a `done()` po kolejnym `_schedule(RANGED_GAP_MS)` (`_doRangedAttack` `:9223-9229`). Wołane raz,
    /// tuż po `complete`; `0` (domyślnie) = `done()` od razu, jak dotąd.
    fn take_tail(&mut self, _unit: UnitRef) -> f64 {
        0.0
    }
}

/// Stałe morale z pinu (`battleScene.ts:1129, 1141, 1144-1145`).
pub const MORALE_DEATH_RADIUS: i64 = 3;
/// Web `MORALE_ALLY_DEATH_LOSS = 12` (`battleScene.ts:1118`): strata morale sojusznika w ripple `_shakeAlliesOnLoss`.
pub const MORALE_ALLY_DEATH_LOSS: f64 = 12.0;
pub const MORALE_ENEMY_BREAK_GAIN: f64 = 5.0;
pub const MORALE_ARMY_COLLAPSE_RATIO: f64 = 0.40;
pub const MORALE_ARMY_COLLAPSE_MULT: f64 = 1.3;

/// Czas lotu pocisku wieży (web `RANGED_FLY_MS = 380`, `battleScene.ts:1012`): odstęp od wystrzału do trafienia.
pub const TOWER_FLY_MS: f64 = 380.0;

/// Klocek zegara: krok sekwencji (`_schedule(ms, () => _beginTurn())` / `_activateNext`) albo koniec ciała jednostki.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoopTimer {
    Step(SeqStep),
    BodyDone(UnitRef),
    /// Wystrzał wieży o indeksie `i` w `tower_rows` (web `_fireOneTower`, zaplanowany `_schedule(delay, ...)`).
    TowerShot(usize),
    /// Trafienie pocisku wieży w atakującego o indeksie `target` w `st.atk` (web callback `_schedule(RANGED_FLY_MS)`).
    TowerHit(usize),
    /// K5LOOP-SIEGE-ATK-B (T2b): odroczone wywołanie ciała `id` ([`LoopBody::take_timers`]).
    BodyTimer(u64),
    /// Obrona r2 (E2-1b): `done()` aktywacji po ogonie ciała ([`LoopBody::take_tail`]): koniec lunge + `BLOW_SETTLE_MS`
    /// po ciosie albo `RANGED_GAP_MS` po trafieniu strzału.
    BodyTail(UnitRef),
}

/// Web `stagger += 180` (`battleScene.ts:4216`): odstęp między wystrzałami kolejnych wież.
pub const TOWER_STAGGER_MS: f64 = 180.0;

/// Zaplanowany wystrzał wieży (web `_schedule(delay, () => this._fireOneTower(...))` z `_fireSiegeTowers`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PlannedTowerShot {
    /// Odroczenie w ms (web `delay`, `0`, `180`, `360` …).
    pub ms: f64,
    /// Indeks wieży w `tower_rows`.
    pub tower: usize,
    /// Web `_autoBatchPlanning != null` w chwili planowania (wtedy callback wykonywany od razu).
    pub planning: bool,
}

/// Szablon ciosu strzału wieży (web `_singleBlow(shooter, target, true)`, `shooter` = syntetyczny strzelec z
/// `towerShooterRow`). Wejścia strzelca i otoczenia podaje adapter (jak `ProdUnit::blow`); cel i jego stan
/// (`hp`, `morale`, flagi) są nadpisywane z [`TurnSeqState`] przy każdym trafieniu, `ranged` jest wymuszane na `true`.
/// Neutralny szablon: [`neutral_tower_shot_template`].
pub fn neutral_tower_shot_template() -> FullBlowInput {
    FullBlowInput {
        ranged: true,
        hit_arc: HitArc::Front,
        attacker: AttackerCu {
            weapon_damage: 10.0,
            piercing: 0.0,
            melee_attack: 10.0,
            missile_attack: Some(10.0),
            charge_bonus: 0.0,
            counter_typ: String::new(),
            typ_nazwa: String::new(),
        },
        atk_mods: AtkMods {
            atk: 1.0,
            ranged_atk: 1.0,
            uderzenie: 1.0,
        },
        atk_diff_mult: 1.0,
        atk_mounted: false,
        defender: DefenderCu {
            melee_defence: 0.0,
            armor: 0.0,
            kara_flanka: None,
            kara_tyl: None,
        },
        def_mods: DefMods {
            obrona: 1.0,
            pancerz: 1.0,
        },
        def_diff_mult: 1.0,
        def_on_wall: false,
        def_fortified_in_field: false,
        def_wall_civ_mult: 1.0,
        def_braces_against_charge: false,
        first_blow_of_pair: true,
        counter_mult: 1.0,
        env: BlowEnv {
            is_city_defense_battle: false,
            wall_bonus_proc: 0.0,
            gated_terrain_multiplier: 1.0,
            field_terrain_multiplier: 1.0,
            atk_tile_is_river: false,
            river_row_exists: false,
            river_attack_mult: 1.0,
            atk_on_ford: false,
            def_on_ford_raw: false,
            shore_adjacent: false,
            brod_kara_obrona: 0.0,
            brod_bonus_brzegu: 0.0,
            fortify_obrona_proc: 0.0,
        },
        defender_state: DefenderState {
            hp: 10.0,
            max_hp: 10.0,
            morale: 100.0,
            flee_morale: 0.0,
            dead: false,
            fading_out: false,
            routed: false,
            never_rout: false,
            removed: false,
        },
        routed_after_morale: false,
    }
}

/// Wiersz `city_towers` ([`UnitRow`], wartości JSON) -> wiersz statystyk [`StatRow`] czytany przez `to_combat_unit`.
/// `null` -> `Null`, liczba -> `Num`, tekst -> `Str`, bool -> `Bool`; tablice i obiekty -> `Undef` (pin nie czyta ich
/// jako liczb statystyk).
fn stat_row_of_unit(row: &UnitRow) -> StatRow {
    row.iter()
        .map(|(k, v)| {
            let u = match v {
                serde_json::Value::Null => UVal::Null,
                serde_json::Value::Bool(b) => UVal::Bool(*b),
                serde_json::Value::Number(n) => n.as_f64().map_or(UVal::Undef, UVal::Num),
                serde_json::Value::String(s) => UVal::Str(s.clone()),
                _ => UVal::Undef,
            };
            (k.clone(), u)
        })
        .collect()
}

/// Web `towerShooterRow` + `towerRange` (`battleScene.ts:4167-4168`): strzelec wieży to najmocniejsza jednostka
/// dystansowa epoki i nacji obrońcy ([`strongest_ranged_unit_for_era`]); zasięg z [`tower_range_for`] (min `min_range`).
/// Szablon ciosu = [`neutral_tower_shot_template`] z atakującym z `to_combat_unit(wiersz)` (pin `_singleBlow` liczy
/// `toCombatUnit(shooter.bu)` z `stats: shooterRow`, `kategoria = Typ ?? 'Distance'`, `hp = Health ?? health ?? 1 || 1`).
/// Brak wiersza -> `None` (web: brak strzelca = brak planowania), zasięg wtedy z `tower_range_for(None, min_range)`.
pub fn tower_setup_from_units(
    units: &[UnitRow],
    era: f64,
    civ: Option<&str>,
    min_range: f64,
) -> (Option<FullBlowInput>, f64) {
    let row = strongest_ranged_unit_for_era(units, era, civ);
    let range = tower_range_for(row, min_range);
    (row.map(tower_shot_from_row), range)
}

/// Kategoria strzelca wieży (web `shooter.bu.kategoria`, pin `battleScene.ts:4167`): `Typ ?? 'Distance'`.
pub fn tower_shooter_kategoria(r: &UnitRow) -> String {
    match r.get("Typ") {
        None | Some(serde_json::Value::Null) => "Distance".to_string(),
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(other) => other.to_string(),
    }
}

/// HP strzelca wieży (web `shooter.bu.hp`): `Health ?? health ?? 1`, zero/NaN/Inf -> 1 (`|| 1`).
pub fn tower_shooter_hp(r: &UnitRow) -> f64 {
    match r
        .get("Health")
        .filter(|v| !v.is_null())
        .or_else(|| r.get("health").filter(|v| !v.is_null()))
        .and_then(serde_json::Value::as_f64)
    {
        Some(x) if x.is_finite() && x != 0.0 => x,
        _ => 1.0,
    }
}

/// `toCombatUnit(shooter.bu)` strzelca wieży (pin `_fireOneTower` `:4236-4244`: `stats: shooterRow`,
/// `kategoria = Typ ?? 'Distance'`, `hp = Health ?? health ?? 1 || 1`; bez weterana, głodu i deficytu: syntetyczny
/// `bu` nie ma tych pól, więc `toCombatUnit` `:1355-1377` ich nie stosuje).
pub fn tower_shooter_cu(r: &UnitRow) -> crate::domain::siege_tactics_inputs_unit::CombatUnitModel {
    to_combat_unit(
        &BattleUnitIn {
            stats: Some(stat_row_of_unit(r)),
            kategoria: tower_shooter_kategoria(r),
            hp: Some(tower_shooter_hp(r)),
            veteran_bonus_frac: None,
            army_hungry: false,
            gold_deficit: false,
        },
        &ToCombatUnitOpts::default(),
    )
}

/// Szablon ciosu wieży dla wiersza strzelca (`to_combat_unit(wiersz)` z kategorią i HP jak w pinie).
/// Wspólna ścieżka dla [`tower_setup_from_units`] i testów pinu (wiersz z wektora generatora).
pub fn tower_shot_from_row(r: &UnitRow) -> FullBlowInput {
    let cu = tower_shooter_cu(r);
    let mut tmpl = neutral_tower_shot_template();
    tmpl.attacker = attacker_from_cu(&cu);
    tmpl
}

/// Wspólna ścieżka trafienia wieży (web `_singleBlow(shooter, target, true)`): składa stan celu z `st`, liczy cios
/// [`single_blow_full`] z `rolls`, zapisuje HP i zabicie celu. Wykorzystywane przez produkcyjne ciało i testy.
pub fn tower_blow_on_target(
    tmpl: &FullBlowInput,
    st: &mut TurnSeqState,
    target: usize,
    rolls: &mut dyn RollSource,
) -> FullBlowOutput {
    let tref = UnitRef {
        side: BattleSide::Attacker,
        idx: target,
    };
    let tc = st.unit(tref).c;
    let mut input = tmpl.clone();
    input.ranged = true;
    input.defender_state = DefenderState {
        hp: tc.hp,
        max_hp: input.defender_state.max_hp,
        morale: tc.morale,
        flee_morale: tc.flee_morale,
        dead: tc.dead,
        fading_out: tc.fading_out,
        routed: tc.routed,
        never_rout: tc.never_rout,
        removed: tc.removed,
    };
    let out = single_blow_full(&input, rolls);
    let dc = unit_cu_mut(st, tref);
    dc.hp = out.blow.def_hp_after;
    if out.blow.outcome == Outcome::Kill {
        dc.dead = true;
    }
    out
}

/// Zwycięzca bitwy w nomenklaturze pinu (`'atk'`, `'def'`, `'remis'`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LoopWinner {
    Attacker,
    Defender,
    Draw,
}

impl LoopWinner {
    /// Etykieta zgodna z wektorami (`atk` / `def` / `remis`).
    pub fn label(self) -> &'static str {
        match self {
            LoopWinner::Attacker => "atk",
            LoopWinner::Defender => "def",
            LoopWinner::Draw => "remis",
        }
    }
}

/// Efekty i dane statyczne sceny potrzebne sekwencji: ciało, wieża, pole sufitu, mnożniki.
pub struct SiegeEnv<B: LoopBody> {
    pub body: B,
    /// Web `siegeTowers` (etap 1): wiersze wież na kolumnie `siegeWallCol`, kolejność jak w pinie.
    /// Puste = brak wież = brak wystrzałów (web `siegeTowers.length === 0` → `return`).
    pub tower_rows: Vec<i64>,
    /// Wystrzały zaplanowane przez [`TurnSeqEnv::fire_siege_towers`], czekające na odebranie przez sterownik
    /// (sterownik opróżnia kolejkę przy `SeqEvent::FireSiegeTowers` i wstawia je do zegara).
    pub pending_tower_shots: Vec<PlannedTowerShot>,
    /// Web `towerRange` (`towerRangeFor`, `battleScene.ts:4168`).
    pub tower_range: f64,
    /// Szablon ciosu strzelca wieży (web `towerShooterRow`, `strongestRangedUnitForEra`). `None` = brak wiersza =
    /// brak planowania wystrzałów (web guard `!this.towerShooterRow` → `return`, `battleScene.ts:4209`).
    pub tower_shot: Option<FullBlowInput>,
    /// Web `wallTileHp.has(row)` (etap 1): wiersze, na których kafel muru jeszcze stoi.
    pub wall_tile_rows: Vec<i64>,
    /// Web `wallEverBreached`.
    pub wall_ever_breached: bool,
    /// Web `siegeNoBreachMaxRounds`.
    pub no_breach_cap: i64,
    /// Web `_movementPointsFor(bu)`, indeks: [strona][jednostka].
    pub move_points: [Vec<f64>; 2],
    /// Maksimum morale jednostki (dla stubu `_armyMoraleRatio`), indeks: [strona][jednostka].
    pub morale_max: [Vec<f64>; 2],
}

fn side_ix(side: BattleSide) -> usize {
    match side {
        BattleSide::Attacker => 0,
        BattleSide::Defender => 1,
    }
}

fn unit_tag(u: UnitRef) -> String {
    let side = match u.side {
        BattleSide::Attacker => "atk",
        BattleSide::Defender => "def",
    };
    format!("{side}{}", u.idx)
}

impl<B: LoopBody> SiegeEnv<B> {
    /// `_armyMoraleRatio` piny: `armyMoraleRatioWithoutCommander` (game/army-leadership.ts) na jednostkach strony.
    fn ratio(&self, st: &TurnSeqState, side: BattleSide) -> f64 {
        let (units, maxes) = match side {
            BattleSide::Attacker => (&st.atk, &self.morale_max[0]),
            BattleSide::Defender => (&st.def, &self.morale_max[1]),
        };
        let army: Vec<ArmyLeaderCombatant> = units
            .iter()
            .zip(maxes.iter())
            .map(|(u, mx)| ArmyLeaderCombatant {
                is_army_commander: false,
                morale: u.c.morale,
                morale_max: *mx,
                dead: u.c.dead,
                fading_out: u.c.fading_out,
                routed: u.c.routed,
            })
            .collect();
        army_morale_ratio_without_commander(&army)
    }

    /// Web `_fireSiegeTowers` (`battleScene.ts:4208-4219`), etap 2A: PLANOWANIE wystrzałów. Wieża zburzona (brak
    /// kafla muru na `wall_tile_rows`, web `_destroyTowerAtRow`) jest pomijana; pozostałe dostają odroczenie
    /// `stagger` 0, 180, 360 … ms, w kolejności `tower_rows`; `stagger` rośnie tylko dla wież planujących wystrzał
    /// (pin `:4214-4218`). Nic nie ustawia `dead` ani HP w chwili planowania.
    fn plan_tower_shots(&mut self, st: &TurnSeqState) {
        let mut stagger = 0.0_f64;
        for (i, &row) in self.tower_rows.iter().enumerate() {
            if !self.wall_tile_rows.contains(&row) {
                continue;
            }
            self.pending_tower_shots.push(PlannedTowerShot {
                ms: stagger,
                tower: i,
                planning: st.auto_batch_planning,
            });
            stagger += TOWER_STAGGER_MS;
        }
    }

    /// Web `_fireOneTower` → `pickTowerTarget` (`battleScene.ts:4223-4232`): cel wybierany W CHWILI WYSTRZAŁU spośród
    /// żywych atakujących (filtr jak `this.atk.filter(...)` w pinie). Zwraca indeks w `st.atk`.
    fn pick_tower_for_row(&self, st: &TurnSeqState, row: i64, v_now: f64) -> Option<usize> {
        let mut refs: Vec<usize> = Vec::new();
        let mut targets: Vec<TowerTarget> = Vec::new();
        for (idx, u) in st.atk.iter().enumerate() {
            let c = u.c;
            if c.dead || c.fading_out || c.routed || c.removed {
                continue;
            }
            let Some((q, r)) = self.body.unit_cell_at(
                UnitRef {
                    side: BattleSide::Attacker,
                    idx,
                },
                v_now,
            ) else {
                continue;
            };
            refs.push(idx);
            targets.push(TowerTarget {
                q,
                r,
                hp: c.hp,
                dead: c.dead,
            });
        }
        pick_tower_target(st.siege_wall_col, row, self.tower_range, &targets).map(|k| refs[k])
    }
}

impl<B: LoopBody> TurnSeqEnv for SiegeEnv<B> {
    fn end_check_snapshot(&mut self, _site: CheckSite, st: &TurnSeqState) -> EndCheckSnapshot {
        let atk: Vec<CombatUnit> = st.atk.iter().map(|u| u.c).collect();
        let def: Vec<CombatUnit> = st.def.iter().map(|u| u.c).collect();
        let ratio_a = self.ratio(st, BattleSide::Attacker);
        let ratio_d = self.ratio(st, BattleSide::Defender);
        EndCheckSnapshot {
            stalled: false,
            alive_a: side_alive_end(&atk),
            alive_d: side_alive_end(&def),
            is_siege: st.siege_wall_col >= 0,
            wall_ever_breached: self.wall_ever_breached,
            total_dead: atk.iter().chain(def.iter()).filter(|u| u.dead).count(),
            ratio_a,
            ratio_d,
            ratio_a_at_cap: ratio_a,
            ratio_d_at_cap: ratio_d,
            round_no: st.round_no,
            no_breach_cap: self.no_breach_cap,
            hp_a: atk.iter().map(|u| u.hp).collect(),
            hp_d: def.iter().map(|u| u.hp).collect(),
        }
    }

    fn movement_points(&mut self, unit: UnitRef, _st: &TurnSeqState) -> f64 {
        self.move_points[side_ix(unit.side)][unit.idx]
    }

    fn fire_siege_towers(&mut self, st: &mut TurnSeqState) {
        // Web `siegeTowers.length === 0 || !towerShooterRow` → `return`: brak wież lub strzelca, brak planowania.
        if self.tower_rows.is_empty() || self.tower_shot.is_none() {
            return;
        }
        self.plan_tower_shots(st);
    }

    fn player_unit_idle(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> bool {
        // Tryb reczny poza zakresem sterownika: w AUTO warunek `_manualMode &&` jest fałszywy.
        false
    }
}

/// Sterownik bitwy oblężenia: stan sekwencji, środowisko i zapis zdarzeń.
pub struct SiegeLoop<B: LoopBody> {
    pub st: TurnSeqState,
    pub env: SiegeEnv<B>,
    /// Ślad zdarzeń w kolejności pinu: `turn:N`, `check:<miejsce>:<wynik>`, `act:<jednostka>@<vNow>`.
    pub trace: Vec<String>,
    /// Zwycięzca po zakończeniu bitwy (`None` gdy jeszcze trwa).
    pub winner: Option<LoopWinner>,
    /// Ścieżka poza zakresem sterownika (AUTO bez oblężenia, wejście w AUTO z przewijania). Ustawienie zatrzymuje
    /// bitwę bez zwycięzcy zamiast paniki; wywołujący sprawdza to pole po `run`.
    pub unsupported: Option<&'static str>,
    /// Stan pętli przewijania (`ffVirtualMs`, `ffPendingAuto`, kolejka) zachowany między wywołaniami [`Self::resume`].
    ff: FfLoopState<()>,
    /// P4-1I2 (L4): web `siegeTowers[i].destroyed` (`battleScene.ts:2443`), indeks = indeks w
    /// [`SiegeEnv::tower_rows`]. Ustawiane wyłącznie przez [`Self::destroy_tower_at_row`] (`_destroyTowerAtRow`,
    /// `:4194-4197`). Tylko odczyt dla ramki bitwy: strzał wieży nadal sprawdza kafel muru (bez zmiany logiki).
    tower_destroyed: Vec<bool>,
    /// P4-1I2: obserwator wołany po KAŻDYM odpaleniu klocka zegara ([`LoopTimer`]) z `vNow` tej chwili
    /// (producent ramki `siege_tactics_frame`). Tylko odczyt stanu; brak = nic się nie dzieje.
    fire_observer: Option<FireObserver<B>>,
    /// P4-1I3: akcje sceny (pętla + ciało) z `t0`, w kolejności wywołań sceny w pinie.
    actions: Vec<TimedAction>,
    /// P4-1I3: pociski wież w locie, `(cel, wiersz wieży)`, w kolejności wystrzałów. Lot ma stałą długość
    /// ([`TOWER_FLY_MS`]), więc trafienia przychodzą w tej samej kolejności; klocek [`LoopTimer::TowerHit`] niesie
    /// tylko cel, a wiersz potrzebny jest wpisowi `_pushClash` (`'wieza:' + row`).
    tower_in_flight: Vec<(usize, i64)>,
    /// PIN3-DIVERGENCE-Q1 (D-PIN3-3): skutek ciała ([`LoopTimer::BodyDone`]: trafienie strzału, cios wręcz, koniec
    /// ostatniego kroku) wykonywany w fazie kroków animacji klatki, PO `_drainTimers` (`_runFastForward` `:9427-9435`,
    /// `_startLoop`), a nie jako zwykły zegar z numerem nadanym w chwili `start` aktywacji. W pinie te skutki planuje
    /// kolejka `_raf` (cios `localT >= BLOW_HIT_T` w kroku lunge, ostatni krok `_doMove`) albo `_schedule` wołane z
    /// kroku `_raf` (`_doRangedAttack` `:9223`), więc zegar wieży z tym samym `due` (zaplanowany wcześniej, w fazie
    /// zegarów) odpala się PRZED nimi — kolejność rzutów RNG. `false` (domyślnie) = dawny model (dotychczasowe testy
    /// pętli); sesja ustawia `true`.
    pub body_done_raf: bool,
    /// PIN3-DIVERGENCE-Q1 (D-PIN3-3): skutki ciała odłożone do fazy kroków bieżącej klatki, w kolejności odpaleń.
    raf_pending: Vec<UnitRef>,
}

/// Obserwator odpaleń zegara pętli (P4-1I2): dostaje stan pętli PO kroku (tylko odczyt), `vNow` i odpalony
/// klocek. Wołany dokładnie raz na każde odpalenie: z kolejki (`_drainTimers`) i synchroniczne
/// ([`ScheduleOutcome::RunNow`], planowanie AUTO).
///
/// Kolejność przy zagnieżdżeniu: odpalenie `RunNow` wykonuje się wewnątrz `apply` odpalenia zewnętrznego
/// (web: callback `_schedule` wołany synchronicznie, `battleScene.ts:9595-9606`), a obserwator odpalenia
/// zewnętrznego jest wołany po zakończeniu jego `apply`. Ramka zagnieżdżonego odpalenia poprzedza więc ramkę
/// odpalenia zewnętrznego (to samo `vNow`); ramka zewnętrzna pokazuje stan po obu krokach. Pokryte testem
/// `p4_1i2_frame::ramka_po_kazdym_odpaleniu_stan_po_kroku`.
pub type FireObserver<B> = Box<dyn FnMut(&SiegeLoop<B>, f64, LoopTimer)>;

impl<B: LoopBody> SiegeLoop<B> {
    pub fn new(st: TurnSeqState, env: SiegeEnv<B>) -> Self {
        Self {
            st,
            env,
            trace: Vec::new(),
            winner: None,
            unsupported: None,
            ff: FfLoopState::<()>::new(),
            tower_destroyed: Vec::new(),
            fire_observer: None,
            actions: Vec::new(),
            tower_in_flight: Vec::new(),
            body_done_raf: false,
            raf_pending: Vec::new(),
        }
    }

    /// P4-1I3: akcje sceny zebrane od startu (albo od ostatniego [`Self::take_actions`]).
    pub fn actions(&self) -> &[TimedAction] {
        &self.actions
    }

    /// P4-1I3: odbiór akcji (kolejka zostaje pusta).
    pub fn take_actions(&mut self) -> Vec<TimedAction> {
        std::mem::take(&mut self.actions)
    }

    /// P4-1I3: bieżące akcje jako [`civ_view_model::battle::BattleActionDto`] (id z rosteru pętli).
    ///
    /// # Errors
    /// [`ActionError`] z [`actions_to_dto`].
    pub fn actions_dto(&self) -> Result<Vec<civ_view_model::battle::BattleActionDto>, ActionError> {
        actions_to_dto(&self.actions, &self.st)
    }

    fn emit(&mut self, t0: f64, action: BattleAction) {
        self.actions.push(TimedAction { t0, action });
    }

    /// Odbiór akcji ciała po jego wywołaniu (zachowuje kolejność z akcjami pętli).
    ///
    /// K5LOOP-SIEGE-ATK-B (T2b, dług T2a): synchronizacja stanu muru sterownika ze stanem ciała. Wyburzenie kafla
    /// ([`BattleAction::WallBreach`], `_breachWallTile` `:7646-7648`) usuwa wiersz z [`SiegeEnv::wall_tile_rows`], ustawia
    /// [`SiegeEnv::wall_ever_breached`] i burzy wieżę ([`Self::breach_wall_row`], ta sama reguła „pierwsza niezburzona
    /// wieża wiersza” co w ciele); wyłom bramy i wejście na mur od wieży przenosi [`LoopBody::wall_ever_breached`].
    fn drain_body(&mut self) {
        let a = self.env.body.take_actions();
        for t in &a {
            if let BattleAction::WallBreach { row } = t.action {
                self.breach_wall_row(row);
            }
        }
        self.actions.extend(a);
        if self.env.body.wall_ever_breached() {
            self.env.wall_ever_breached = true;
        }
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): wstawia do zegara odroczone wywołania ciała ([`LoopBody::take_timers`]) w kolejności
    /// ich zaplanowania. Planowanie AUTO (`_autoBatchPlanning`) wykonuje je od razu (`ScheduleOutcome::RunNow`, jak
    /// `_schedule` `:9599-9603`); po `finished` są pomijane (`:9604`).
    fn schedule_body_timers(&mut self, clock: &mut VirtualClock<LoopTimer>) {
        for (ms, id) in self.env.body.take_timers() {
            let planning = self.st.auto_batch_planning;
            match clock.schedule(ms, LoopTimer::BodyTimer(id), planning) {
                ScheduleOutcome::Queued | ScheduleOutcome::Dropped => {}
                ScheduleOutcome::RunNow(t) => self.fire(clock, t),
            }
        }
    }

    /// P4-1I2: ustawia (albo zdejmuje, `None`) obserwatora wołanego po każdym odpaleniu klocka zegara.
    pub fn set_fire_observer(&mut self, observer: Option<FireObserver<B>>) {
        self.fire_observer = observer;
    }

    /// Web `t.destroyed` wieży o indeksie `i` w [`SiegeEnv::tower_rows`] (`false` poza zakresem).
    pub fn tower_destroyed(&self, i: usize) -> bool {
        self.tower_destroyed.get(i).copied().unwrap_or(false)
    }

    /// Wiersze wież z `destroyed === true` w kolejności `siegeTowers` (= kolejność [`SiegeEnv::tower_rows`]).
    pub fn towers_destroyed_rows(&self) -> Vec<i64> {
        self.env
            .tower_rows
            .iter()
            .enumerate()
            .filter(|(i, _)| self.tower_destroyed(*i))
            .map(|(_, &row)| row)
            .collect()
    }

    /// Web `_destroyTowerAtRow(wallRow)` (`battleScene.ts:4194-4200`), część stanu: PIERWSZA niezburzona wieża
    /// na wierszu (`siegeTowers.find(x => x.row === wallRow && !x.destroyed)`) dostaje `destroyed = true`; brak
    /// takiej wieży = `return`. Mesh i wpis logu (`:4198-4199`) poza silnikiem. Zwraca, czy flaga została ustawiona.
    pub fn destroy_tower_at_row(&mut self, row: i64) -> bool {
        let n = self.env.tower_rows.len();
        if self.tower_destroyed.len() < n {
            self.tower_destroyed.resize(n, false);
        }
        let Some(i) = (0..n).find(|&i| self.env.tower_rows[i] == row && !self.tower_destroyed[i])
        else {
            return false;
        };
        self.tower_destroyed[i] = true;
        true
    }

    /// Web `_breachWallTile(wallRow)` (`battleScene.ts:7638-7650`), część stanu czytana przez pętlę:
    /// `wallTileHp.delete(wallRow)` (`:7646`, tu: usunięcie wiersza z [`SiegeEnv::wall_tile_rows`]),
    /// `wallEverBreached = true` (`:7647`) i `_destroyTowerAtRow(wallRow)` (`:7648`). Kafel terenu, etykieta,
    /// gruz, odwrót obrońców i morale (`:7643-7645`, `:7649-7750`) są poza tym sterownikiem (recon L3).
    ///
    /// Wymóg dla wpięcia produkcyjnego (#113 K5LOOP-WIRING): (1) każdy wyłom w bitwie musi iść przez tę metodę
    /// w chwili wyłomu — inaczej flaga wieży (`:7648`) powstanie dopiero przy kolejnym `_fireSiegeTowers`
    /// (`:4216`), z opóźnieniem względem pinu; (2) strażnik `if (!tiles) return;` (`:7639-7640`, brak mapy
    /// terenu bitwy) należy do wołającego: gdy mapy terenu nie ma, metody nie wolno wołać (web nie usuwa wtedy
    /// kafla, nie ustawia `wallEverBreached` i nie burzy wieży). Pętla nie ma mapy terenu, więc strażnika tu nie ma.
    pub fn breach_wall_row(&mut self, row: i64) {
        self.env.wall_tile_rows.retain(|&r| r != row);
        self.env.wall_ever_breached = true;
        self.destroy_tower_at_row(row);
    }

    /// Web `_fireSiegeTowers` (`battleScene.ts:4208-4219`), część flag: przy przejściu przez wieże (strażnik
    /// `finished || siegeTowers.length === 0 || !towerShooterRow`, `:4209`) wieża niezburzona bez kafla muru
    /// zostaje zburzona (`:4215-4216`). Planowanie wystrzałów robi bez zmian [`TurnSeqEnv::fire_siege_towers`].
    fn mark_towers_without_tile(&mut self) {
        if self.st.finished || self.env.tower_rows.is_empty() || self.env.tower_shot.is_none() {
            return;
        }
        for i in 0..self.env.tower_rows.len() {
            if self.tower_destroyed(i) {
                continue;
            }
            let row = self.env.tower_rows[i];
            if !self.env.wall_tile_rows.contains(&row) && self.destroy_tower_at_row(row) {
                // K5LOOP-SIEGE-ATK-B: ten sam stan wież w ciele (zagrożenia `_siegeShooterThreats`).
                self.env.body.on_tower_destroyed(row);
            }
        }
    }

    /// Start bitwy: web `_beginTurn()` z kickoffu. Wywoływany raz, przed pierwszym [`Self::resume`].
    pub fn start(&mut self, clock: &mut VirtualClock<LoopTimer>) {
        let mut out = Vec::new();
        begin_turn(&mut self.st, &mut self.env, &mut out);
        self.apply(clock, out);
    }

    /// Wznowienie pętli przewijania [`run_fast_forward`] z zachowanym stanem, najwyżej `max_steps` pełnych iteracji.
    /// Wynik zależy tylko od sumy wykonanych iteracji, nie od podziału na wywołania: kolejne wywołania z małym
    /// `max_steps` dają ten sam stan i ślad co jedno wywołanie z dużym limitem.
    pub fn resume(&mut self, clock: &mut VirtualClock<LoopTimer>, max_steps: u32) -> FfStop {
        // P4-1I3 (obrona r1, zarzut 1): przewijanie = web `_ffActive = true` (`skip()` `:3696`, pętla `:9267`);
        // etykiety obrażeń są wtedy pomijane (`_spawnDamageLabel` `:9943`).
        self.env.body.set_ff_active(true);
        let mut ff = std::mem::take(&mut self.ff);
        let stop = run_fast_forward(clock, &mut ff, self, max_steps);
        self.ff = ff;
        stop
    }

    /// K5LOOP-WIRING-A (#369, D-WIR-3): jedna klatka czasu rzeczywistego `_startLoop` poza przewijaniem
    /// (`battleScene.ts:9274-9277`): `_advanceVClock(wall)` (`:9500-9511`, pierwsza klatka tylko ustawia `vLastWall`), potem
    /// `_drainTimers()` (`:9616-9634`). `_ffActive = false`, więc ciało emituje [`BattleAction::Damage`]
    /// (`_spawnDamageLabel` `:9943`). `_tickProjectiles`/`_tickFades` (`:9283-9284`) nie zmieniają stanu pętli (jak
    /// `FfEvent::TickProjectiles`/`TickFades` w [`Self::resume`]). Sufit tur działa tu przez `_checkEnd`
    /// (`_roundCapVerdict` wspólny, `:9440-9447`); `_updateStallWatch` w oblężeniu nic nie liczy (`:5571`). Zwraca liczbę
    /// odpalonych klocków zegara.
    pub fn step_realtime(&mut self, clock: &mut VirtualClock<LoopTimer>, wall: f64) -> u32 {
        self.env.body.set_ff_active(false);
        clock.advance_v_clock(wall);
        let fired = clock.drain_timers(|c, t| {
            if !self.defer_to_raf(t) {
                self.fire(c, t);
            }
        });
        // PIN3-DIVERGENCE-Q1 (D-PIN3-3): faza kroków animacji klatki (`requestAnimationFrame`) po `_drainTimers`.
        while !self.raf_pending.is_empty() {
            let u = self.raf_pending.remove(0);
            self.fire(clock, LoopTimer::BodyDone(u));
        }
        fired
    }

    /// PIN3-DIVERGENCE-Q1 (D-PIN3-3): odkłada [`LoopTimer::BodyDone`] do fazy kroków bieżącej klatki
    /// ([`Self::body_done_raf`]). Zwraca `true`, gdy odłożono.
    fn defer_to_raf(&mut self, t: LoopTimer) -> bool {
        match t {
            LoopTimer::BodyDone(u) if self.body_done_raf => {
                self.raf_pending.push(u);
                true
            }
            _ => false,
        }
    }

    /// Start bitwy i przewijanie aż do zakończenia albo wyczerpania `max_steps` pełnych iteracji.
    /// Równoważne `start` + `resume`.
    pub fn run(&mut self, clock: &mut VirtualClock<LoopTimer>, max_steps: u32) -> FfStop {
        self.start(clock);
        self.resume(clock, max_steps)
    }

    /// Stan pętli przewijania zachowany między [`Self::resume`] (tylko odczyt, do asercji w testach).
    pub fn ff_state(&self) -> &FfLoopState<()> {
        &self.ff
    }

    /// Etykieta zwycięzcy (`atk` / `def` / `remis`) albo `None`.
    pub fn winner_label(&self) -> Option<&'static str> {
        self.winner.map(LoopWinner::label)
    }

    fn halt_unsupported(&mut self, clock: &mut VirtualClock<LoopTimer>, reason: &'static str) {
        self.unsupported = Some(reason);
        self.st.finished = true;
        clock.finished = true;
    }

    /// Koniec bitwy; `logs` = linie `this.log.push` ścieżki końca (P4-1I3), po nich akcja `End`
    /// (`_showEndScreen(winner)`).
    fn finish(
        &mut self,
        clock: &mut VirtualClock<LoopTimer>,
        winner: LoopWinner,
        logs: Vec<String>,
    ) {
        self.st.finished = true;
        clock.finished = true;
        self.winner = Some(winner);
        for text in logs {
            self.emit(clock.v_now, BattleAction::Log { text });
        }
        self.emit(clock.v_now, BattleAction::End { winner });
    }

    /// P4-1I3: linie logu `_checkEnd` dla wyniku `outcome` (wejścia z tego samego zrzutu co sam test końca,
    /// [`TurnSeqEnv::end_check_snapshot`], liczonego ponownie na stanie z chwili obsługi zdarzenia: między testem
    /// a obsługą `EndCheck` sekwencja nie zmienia HP, morale ani flag jednostek).
    fn end_logs(&mut self, site: CheckSite, winner: LoopWinner) -> Vec<String> {
        let s = self.env.end_check_snapshot(site, &self.st);
        check_end_logs(
            &EndLogInput {
                stalled: s.stalled,
                alive_a: s.alive_a,
                alive_d: s.alive_d,
                is_siege: s.is_siege,
                wall_ever_breached: s.wall_ever_breached,
                total_dead: s.total_dead,
                ratio_a: s.ratio_a,
                ratio_d: s.ratio_d,
                ratio_a_at_cap: s.ratio_a_at_cap,
                ratio_d_at_cap: s.ratio_d_at_cap,
                round_no: s.round_no,
                no_breach_cap: s.no_breach_cap,
            },
            Some(winner),
        )
    }

    fn apply(&mut self, clock: &mut VirtualClock<LoopTimer>, events: Vec<SeqEvent>) {
        for ev in events {
            match ev {
                SeqEvent::CounterBudgetBeginTurn
                | SeqEvent::Banner { .. }
                | SeqEvent::RefreshQueuedVisuals => {}
                // P4-1I3: `hint.textContent = 'Tura ' + roundNo` (`_beginTurn`) = akcja tury.
                SeqEvent::SetHint { round_no } => {
                    self.emit(clock.v_now, BattleAction::Turn { round_no });
                }
                SeqEvent::FireSiegeTowers => {
                    self.trace.push(format!("turn:{}", self.st.round_no));
                    // P4-1I2: flaga `destroyed` wież bez kafla (pin `:4216`); nie zmienia planowania ani zegara.
                    self.mark_towers_without_tile();
                    // Wystrzały zaplanowane w tej turze wchodzą do zegara przed kolejnymi `Schedule` (kolejność jak w pinie).
                    let planned = std::mem::take(&mut self.env.pending_tower_shots);
                    for p in planned {
                        match clock.schedule(p.ms, LoopTimer::TowerShot(p.tower), p.planning) {
                            ScheduleOutcome::Queued | ScheduleOutcome::Dropped => {}
                            ScheduleOutcome::RunNow(t) => self.fire(clock, t),
                        }
                    }
                }
                SeqEvent::BeginAutoBatchPhase { .. } => {
                    self.halt_unsupported(
                        clock,
                        "sterownik K5-LOOP obsluguje tylko oblezenie; AUTO bez oblezenia poza zakresem",
                    );
                }
                SeqEvent::EndCheck { site, outcome } => {
                    let site_s = match site {
                        CheckSite::BeginTurn => "begin",
                        CheckSite::ActivateNext => "activate",
                    };
                    let out_s = match outcome {
                        EndCheckOutcome::Continue => "continue".to_string(),
                        EndCheckOutcome::Draw => "draw".to_string(),
                        EndCheckOutcome::Ended(BattleSide::Attacker) => "ended:atk".to_string(),
                        EndCheckOutcome::Ended(BattleSide::Defender) => "ended:def".to_string(),
                    };
                    self.trace.push(format!("check:{site_s}:{out_s}"));
                    let winner = match outcome {
                        EndCheckOutcome::Continue => None,
                        EndCheckOutcome::Draw => Some(LoopWinner::Draw),
                        EndCheckOutcome::Ended(BattleSide::Attacker) => Some(LoopWinner::Attacker),
                        EndCheckOutcome::Ended(BattleSide::Defender) => Some(LoopWinner::Defender),
                    };
                    if let Some(w) = winner {
                        let logs = self.end_logs(site, w);
                        self.finish(clock, w, logs);
                    }
                }
                SeqEvent::ActivateUnit(u) => {
                    self.trace
                        .push(format!("act:{}@{}", unit_tag(u), clock.v_now));
                    self.env.body.set_now(clock.v_now);
                    let dur = self.env.body.start(u, &self.st);
                    self.drain_body();
                    // K5LOOP-SIEGE-ATK-B: `_schedule` z wnętrza ciała przed `done()` (np. `_attackWallTile` `:7555`).
                    self.schedule_body_timers(clock);
                    let _ = clock.schedule(dur, LoopTimer::BodyDone(u), false);
                }
                SeqEvent::Schedule { ms, step, planning } => {
                    match clock.schedule(ms, LoopTimer::Step(step), planning) {
                        ScheduleOutcome::Queued | ScheduleOutcome::Dropped => {}
                        ScheduleOutcome::RunNow(t) => self.fire(clock, t),
                    }
                }
            }
        }
    }

    fn fire(&mut self, clock: &mut VirtualClock<LoopTimer>, timer: LoopTimer) {
        let mut out = Vec::new();
        match timer {
            LoopTimer::Step(SeqStep::BeginTurn) => {
                begin_turn(&mut self.st, &mut self.env, &mut out);
            }
            LoopTimer::Step(SeqStep::ActivateNext) => {
                activate_next(&mut self.st, &mut self.env, &mut out);
            }
            LoopTimer::BodyDone(u) => {
                self.env.body.set_now(clock.v_now);
                self.env.body.complete(u, &mut self.st);
                self.drain_body();
                self.schedule_body_timers(clock);
                let tail = self.env.body.take_tail(u);
                if tail > 0.0 {
                    let _ = clock.schedule(tail, LoopTimer::BodyTail(u), false);
                } else {
                    activation_done(&mut self.st, &mut self.env, u, &mut out);
                }
            }
            LoopTimer::BodyTail(u) => {
                activation_done(&mut self.st, &mut self.env, u, &mut out);
            }
            LoopTimer::BodyTimer(id) => {
                self.env.body.set_now(clock.v_now);
                self.env.body.fire_timer(id, &mut self.st);
                self.drain_body();
                self.schedule_body_timers(clock);
            }
            LoopTimer::TowerShot(i) => {
                self.tower_shoot(clock, i);
            }
            LoopTimer::TowerHit(target) => {
                self.tower_hit(target, clock.v_now);
            }
        }
        self.apply(clock, out);
        // P4-1I2: ramka po każdym odpaleniu (tylko odczyt). `take` pozwala przekazać `&self` obserwatorowi.
        // Kolejność przy zagnieżdżonym `RunNow`: zob. [`FireObserver`].
        if let Some(mut obs) = self.fire_observer.take() {
            obs(self, clock.v_now, timer);
            self.fire_observer = Some(obs);
        }
    }

    /// Web `_fireOneTower` (`battleScene.ts:4223-4262`): wystrzał zaplanowanej wieży. Pomijany po `finished`.
    /// Zniszczona wieża (web `t.destroyed`; tu: brak kafla muru na `wall_tile_rows`, czyli stan po `breach_wall_tile`)
    /// nie strzela, także gdy wyłom nastąpił po zaplanowaniu salwy (pin `:4227`). Cel wybierany
    /// W CHWILI wystrzału (`pickTowerTarget`); brak celu = `return`. Trafienie `_singleBlow` po locie
    /// [`TOWER_FLY_MS`] (`_schedule(RANGED_FLY_MS, ...)`, pin `:4262`).
    fn tower_shoot(&mut self, clock: &mut VirtualClock<LoopTimer>, i: usize) {
        if self.st.finished {
            return;
        }
        let row = self.env.tower_rows[i];
        if !self.env.wall_tile_rows.contains(&row) {
            return;
        }
        // Obrona r2 (E2-1b): pozycje celów W CHWILI wystrzału (oś kroków ciała, [`LoopBody::unit_cell_at`]).
        let Some(target) = self.env.pick_tower_for_row(&self.st, row, clock.v_now) else {
            return;
        };
        // P4-1I3: `this.log.push('Wieza strzelnicza …')` (`:4247`), potem pocisk (`projectiles.push`, `:4260`).
        let tref = UnitRef {
            side: BattleSide::Attacker,
            idx: target,
        };
        let text = tower_shot_log(row, &self.env.body.unit_name(tref));
        self.emit(clock.v_now, BattleAction::Log { text });
        self.emit(
            clock.v_now,
            BattleAction::TowerShot {
                row,
                target: tref,
                land_at: clock.v_now + TOWER_FLY_MS,
            },
        );
        let planning = self.st.auto_batch_planning;
        // Wpis „w locie” przed `schedule`: przy planowaniu trafienie odpala się synchronicznie (`RunNow`).
        self.tower_in_flight.push((target, row));
        match clock.schedule(TOWER_FLY_MS, LoopTimer::TowerHit(target), planning) {
            ScheduleOutcome::Queued => {}
            ScheduleOutcome::Dropped => {
                self.tower_in_flight.pop();
            }
            ScheduleOutcome::RunNow(t) => self.fire(clock, t),
        }
    }

    /// Web callback `_schedule(RANGED_FLY_MS, ...)` w `_fireOneTower` (`battleScene.ts:4263-4269`): trafienie
    /// pomijane po `finished`, gdy cel martwy lub znika. Inaczej `_singleBlow` wieży przez [`LoopBody::tower_blow`].
    fn tower_hit(&mut self, target: usize, v_now: f64) {
        // P4-1I3: pocisk ląduje (także gdy trafienie jest pomijane); wiersz wieży dla wpisu `_pushClash`.
        let row = self
            .tower_in_flight
            .iter()
            .position(|&(t, _)| t == target)
            .map(|k| self.tower_in_flight.remove(k).1);
        if self.st.finished {
            return;
        }
        let tc = self.st.atk[target].c;
        if tc.dead || tc.fading_out {
            return;
        }
        let Some(tmpl) = self.env.tower_shot.clone() else {
            return;
        };
        self.env.body.set_now(v_now);
        if let Some(row) = row {
            self.env.body.set_tower_row(row);
        }
        self.env.body.tower_blow(&tmpl, target, &mut self.st);
        self.drain_body();
    }
}

impl<B: LoopBody> FfHost<LoopTimer, ()> for SiegeLoop<B> {
    fn round_cap(
        &mut self,
        _clock: &VirtualClock<LoopTimer>,
        _st: &FfLoopState<()>,
    ) -> Option<RoundCapVerdict> {
        let state = RoundCapState {
            round_no: self.st.round_no,
            no_breach_cap: self.env.no_breach_cap,
            wall_present: self.st.siege_wall_col >= 0,
            wall_ever_breached: self.env.wall_ever_breached,
        };
        let atk = self.env.ratio(&self.st, BattleSide::Attacker);
        let def = self.env.ratio(&self.st, BattleSide::Defender);
        round_cap_verdict_step(&state, atk, def)
    }

    fn busy(&self) -> bool {
        self.st.busy
    }

    fn event(
        &mut self,
        clock: &mut VirtualClock<LoopTimer>,
        st: &mut FfLoopState<()>,
        ev: FfEvent<LoopTimer, ()>,
    ) {
        match ev {
            FfEvent::TimerFired(t) => {
                // PIN3-DIVERGENCE-Q1 (D-PIN3-3): skutek ciała do kolejki `_ffQueue` tej iteracji (po `_drainTimers`).
                if self.defer_to_raf(t) {
                    st.queue.push(());
                } else {
                    self.fire(clock, t);
                }
            }
            FfEvent::RunQueued(()) => {
                if !self.raf_pending.is_empty() {
                    let u = self.raf_pending.remove(0);
                    self.fire(clock, LoopTimer::BodyDone(u));
                }
            }
            FfEvent::RoundCapResult(v) => {
                let w = match v {
                    RoundCapVerdict::Draw => LoopWinner::Draw,
                    RoundCapVerdict::Defender => LoopWinner::Defender,
                    RoundCapVerdict::Attacker => LoopWinner::Attacker,
                };
                // P4-1I3: `_ffRoundCapResult` (`:9485-9497`): `_finishDraw` albo linia `PAT (przewijanie)`.
                let logs = ff_round_cap_logs(v, self.env.no_breach_cap);
                self.finish(clock, w, logs);
            }
            FfEvent::EnterAuto => {
                self.halt_unsupported(
                    clock,
                    "sterownik K5-LOOP nie wchodzi w AUTO z przewijania (pending_auto zawsze false)",
                );
            }
            FfEvent::TickProjectiles(_) | FfEvent::TickFades(_) => {}
        }
    }
}

// ---------------------------------------------------------------------------------------------------------------
// K5-LOOP-BODY (r2 + r3 Operatora): produkcyjne ciało jednostki. Zgodność z pinem: wektory `p6_siege_tactics_loop_body_pin`
// (r3: generator wykonuje tekst pinu `_activateUnit` -> `_doAttack` -> `_singleBlow`, ślad aktywacji + wynik ciosu + stan + `engaged`).
//
// EFEKTY PO CIOSIE (K5LOOP-OUTCOME): [`ProdBody::strike`] stosuje na stanie wynik `_resolveBlowOutcome`
// (`battleScene.ts:9020-9068`; port rozstrzygnięcia: `siege_tactics_blow::resolve_outcome`) ścieżkami
// Kill (`_startFade` + `_boostEnemiesOnBreak` + `_gainMorale` atakującego), MoraleOnly i RoutBeforeDeath
// (`_applyMoraleDamage` -> `_checkRout` -> `_startRout`, `_gainMorale` atakującego, gdy cel się złamał).
// `_startRout` (`:9799`) obsługuje też rout z aktywacji (okrążenie). KONTRATAK obrońcy (`_defenderCounters`,
// K5LOOP-KONTRATAK) JEST zaimplementowany w [`ProdBody::counter_strike`].
// K5LOOP-KILL-RIPPLE (D-INT-2): ripple `_shakeAlliesOnLoss` przy zabiciu (`:9048`) JEST wykonywany
// ([`ProdBody::kill_ripples`]). K5LOOP-TAGS-REST: efekty dowódcy armii (`isArmyCommander`, `_removeCommanderMoraleBonus`)
// są WYKONYWANE ([`ProdBody::commander_lost`]); JAWNIE NIEPORTOWANE: `routedUnits` (dane na przyszłość, bez konsumenta). Timing `BLOW_HIT_T` (150 ms)
// to wejście adaptera ([`ProdUnit::body_ms`]).
// FACING (r4, K5LOOP-FACING): ciało trzyma `facing` każdej jednostki. `_updateFacing` (zdarzenie `UpdateFacing` na
// początku aktywacji, `_nearestEnemy` + `facingToward`) i przypisanie `attacker.facing` w `_doMeleeAttack` (przed ciosem)
// aktualizują stan; łuk ciosu liczy [`relative_hit`] z AKTUALNEGO facing obrońcy i pozycji (nie z szablonu).
// ZAKRES CZĘŚCIOWY (patrz raport 01-operator-r2.md, sekcja NIE_ZMIERZONO). Ciało wykonuje gałąź ciosu w zwarciu
// dla jednostki AUTO bez oblężenia, bez strzelca i bez doktryny: [`activate_unit`] (K5H) decyduje, a dla zdarzenia
// `Attack` wykonuje [`single_blow_full`] (K5I) na celu podanym przez adapter. K5LOOP-CLOSE r1: zdarzenie `AdvanceStep`
// (`_advanceStep`, `battleScene.ts:8198-8285`) jest WYKONYWANE ([`ProdBody::advance_step`]: T4b + T4c + `_updateFacing`
// po każdym kroku), wektory `tests/p6_k5loop_close*`. K5LOOP-CLOSE r2: C-FLANK i `_cavalryAction`; r3: `_rangedAction`
// (KITE, strzał `_doRangedAttack`, marsz `_rangedForwardStep`), U7.6 z `_fallBackStep` i `_phalanxAction`; r4: ucieczka
// `_fleeStep` (z `_removeUnitFromScene` i ripple `_shakeAlliesOnLoss`) i strzelec z `shootingEnabled = false` (zasięg
// strzału w `_targetInRange`/`_canAttackFrom`, `_doAttack` -> `_doRangedAttack`). K5DOC-T8: krok doktryny
// `_executeGroupDoctrineStep` (`:6092-6099`, `:17966-18124`) jest WYKONYWANY bez muru (decyzja
// `siege_tactics_doctrine_step`, treść tymi samymi klockami; rozkaz ruchu `skirmish` = tag `doktryna-rozkaz-ruchu`,
// K5EXEC-T3). K5LOOP-SIEGE-DEF (T1): obrońca przy murze (`onWallWalkway` `:6129-6172` z kontrbaterią katapulty,
// HOLD `:6225-6236`) jest WYKONYWANY; cel liczy ciało (`_rangedTargetInRange` / `_targetInRange` z filtrem muru).
// Pozostałe gałęzie `_activateUnit` (strona `atk` przy murze: wieże, machiny, wejście na mur; tryb ręczny) NIE są
// wykonywane: jednostka nic nie robi, a ścieżka trafia do [`ProdBody::unported`]. Wybór celu zwykłego ciosu poza
// oblężeniem (`_targetInRange`) pozostaje wejściem adaptera ([`ProdUnit::melee_target`]); szablon ciosu jest zawsze
// wejściem adaptera (cel ciała różny od `melee_target` = tag `cios-bez-szablonu`).
// ---------------------------------------------------------------------------------------------------------------

/// Statyczna konfiguracja jednostki dla [`ProdBody`]: pola `ru` spoza [`CombatUnit`] oraz wejścia adapterów.
#[derive(Debug, Clone, PartialEq)]
pub struct ProdUnit {
    /// Pola `ru` czytane przez maszynę K5H. Pola stanu (`dead`, `fading_out`, `routed`, `morale`, `flee_morale`,
    /// `never_rout`) są nadpisywane z [`TurnSeqState`] przy `start`.
    pub activate: ActivateUnit,
    /// Indeks wroga w liście strony przeciwnej wybrany przez adapter `_targetInRange` (wejście, nieportowane).
    pub melee_target: Option<usize>,
    /// Szablon ciosu na `melee_target`. Stan obrońcy jest nadpisywany z [`TurnSeqState`] przy `complete`.
    pub blow: Option<FullBlowInput>,
    /// Szablony kontrataku tej jednostki (jako OBROŃCY) na wrogów, indeks = indeks wroga w liście strony przeciwnej
    /// (pin `_defenderCounters` + `_singleBlow(defender, attacker)`). Stan obu stron jest nadpisywany przy `complete`.
    pub counter_blows: Vec<FullBlowInput>,
    /// Czas animacji ciosu (ms) zwracany przez `start` (wejście adaptera; timing `_doAttack` nieportowany).
    pub body_ms: f64,
    /// Początkowy `facing` (`Dir` jako liczba 0..3, `battleScene.ts:315-320`); potem zmienia go `_updateFacing`.
    pub facing: f64,
}

/// Wynik `start` przekazywany do `complete`.
#[derive(Debug, Clone, Copy, PartialEq)]
struct ProdPending {
    morale: f64,
    /// PIN2-PROBE-Q1 (D-PIN2-1): `ru.morale` w chwili `start` (przed okrążeniem). `complete` przepisuje [`Self::morale`]
    /// tylko wtedy, gdy aktywacja zmieniła morale; inaczej zostaje wartość sterownika (trafienia wież w trakcie marszu).
    morale_before: f64,
    /// Zdarzenie `StartRout` z `_activateUnit` (rout z okrążenia): w `complete` wykonuje pełne `_startRout`.
    start_rout: bool,
    surround_applied: bool,
    attack: Option<usize>,
    /// K5LOOP-CLOSE: `ru.moveLeft` po krokach `_advanceStep` (`None` = brak ruchu, stan bez zmian).
    move_left: Option<f64>,
    /// K5LOOP-CLOSE r3: strzał `_doRangedAttack` (cel w liście strony przeciwnej, chwila trafienia `t + RANGED_FLY_MS`).
    shot: Option<ProdShot>,
    /// K5LOOP-CLOSE r4: ucieczka `_fleeStep` wykonana w `start` na kopii stanu ([`ProdBody::flee_after`]); `complete`
    /// przepisuje tę kopię do `TurnSeqState` (efekty `_startRout`, `_removeUnitFromScene`, `_shakeAlliesOnLoss`).
    flee: bool,
    /// K5LOOP-SIEGE-ATK-B (T2b): wyłom bramy w `_attackGate` tej aktywacji (`_breachGate` `:7803-7810`): pętla morale
    /// obrońców (`-MORALE_GATE_BREACH`, `_checkRout`) wykonywana w `complete` na stanie sterownika (patrz
    /// [`ProdBody::gate_breach_morale`]).
    gate_breach: bool,
}

/// K5LOOP-CLOSE r3: strzał jednostki wykonany w `complete` (trafienie `_singleBlow(attacker, defender, true)`).
#[derive(Debug, Clone, Copy, PartialEq)]
struct ProdShot {
    target: usize,
    /// Czas wirtualny trafienia (`vNow` wystrzału + [`RANGED_FLY_MS`]); akcje trafienia mają ten `t0`.
    hit_at: f64,
}

/// Zapytania maszyny K5H dla [`ProdBody`] (bez skutków ubocznych).
struct ProdOps {
    melee_target: Option<usize>,
    /// K5LOOP-SIEGE-DEF (T1): `_rangedTargetInRange(ru)` (`battleScene.ts:7041-7053`) liczone przez ciało dla obrońcy w
    /// oblężeniu (gałęzie U7.1 i U7.4 maszyny; poza nimi maszyna nie woła tego zapytania). Poza oblężeniem `None`.
    ranged_target: Option<usize>,
    /// K5LOOP-CLOSE r3: `_advanceCoord(ru)` (`battleScene.ts:6537-6539`: atak `q`, obrona `-q`) z pozycji na starcie
    /// aktywacji (pozycja nie zmienia się w trakcie `_activateUnit` przed gałęzią ruchu).
    advance_coord: f64,
    /// K5LOOP-CLOSE r3: `_nearestEnemy(ru)` (`:8296-8304`, pierwszy ściśle najbliższy żywy wróg), pozycja.
    nearest: Option<(i64, i64)>,
    /// K5DOC-T8: wartość zwracana przez `_executeGroupDoctrineStep` ([`DoctrineStep::returns`], liczona przed maszyną
    /// przez [`execute_group_doctrine_step`] z tego samego stanu; pin: każda ścieżka `return true`, `:17966-18084`).
    /// Treść kroku wykonuje [`ProdBody`] po maszynie (zdarzenie [`ActivateEvent::DoctrineStep`]).
    doctrine_returns: bool,
    /// K5LOOP-SIEGE-ATK-A (T2a): wartości zwracane przez `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` /
    /// `_siegeRamTowerStep` (`battleScene.ts:8056`, `:8087`, `:8022`), liczone przed maszyną z tego samego stanu
    /// ([`ProdBody::siege_atk_plan`]; między startem aktywacji a tymi wywołaniami pin zmienia tylko morale okrążenia i
    /// `facing`, których te funkcje nie czytają). Treść wykonuje ciało po maszynie (gałęzie `U7.2-*`, `U7.3-ramtower`).
    /// Poza atakującym przy murze `false` (pin: `return false` dla obrońcy i bez muru).
    tower_climb: bool,
    infantry_to_tower: bool,
    ram_tower_step: bool,
}

impl ActivateOps for ProdOps {
    fn apply_terrain_range(&mut self, current: f64) -> f64 {
        // Przeliczenie wykonuje ciało przed maszyną (`ProdBody::refresh_terrain_range`, obrona r2 E2-1a), bo wejścia
        // `ProdOps` (cele) czytają już przeliczony zasięg; maszyna dostaje gotową wartość.
        current
    }
    fn perform_player_order(&mut self) -> bool {
        false
    }
    fn doctrine_step(&mut self) -> bool {
        self.doctrine_returns
    }
    fn tower_climb(&mut self) -> bool {
        self.tower_climb
    }
    fn infantry_to_tower(&mut self) -> bool {
        self.infantry_to_tower
    }
    fn ram_tower_step(&mut self) -> bool {
        self.ram_tower_step
    }
    fn ranged_target_in_range(&mut self) -> Option<usize> {
        self.ranged_target
    }
    fn target_in_range(&mut self) -> Option<usize> {
        self.melee_target
    }
    fn advance_coord(&mut self) -> f64 {
        self.advance_coord
    }
    fn nearest_enemy_pos(&mut self) -> Option<(i64, i64)> {
        self.nearest
    }
}

/// Etykieta gałęzi nieportowanej (zdarzenia spoza zakresu [`ProdBody`]).
fn prod_tag(ev: ActivateEvent) -> &'static str {
    match ev {
        ActivateEvent::Flee => "ucieczka-routed",
        // K5LOOP-SIEGE-ATK-A (T2a): `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, `_siegeRamTowerStep` i
        // `_advanceToward` (dawne `wieza-wejscie`, `piechota-do-wiezy`, `taran-wieza`, `marsz`) wykonuje ciało.
        // K5LOOP-SIEGE-ATK-B (T2b): ostrzał kafla muru (`_attackWallTile`, `:7540`) wykonuje ciało dla atakującego przy
        // murze (dawny tag `atak-muru`); poza tą gałęzią (nieosiągalne w maszynie) jawny tag.
        ActivateEvent::AttackWallTile { .. } => "atak-muru-poza-oblezeniem",
        // Obrona r1 (zarzut 3): `_advanceToward` spoza atakującego przy murze (nieosiągalne w maszynie) = jawny tag.
        ActivateEvent::AdvanceToward { .. } => "marsz-poza-oblezeniem",
        ActivateEvent::RangedAction => "strzelec",
        ActivateEvent::FallBackStep => "odwrot",
        ActivateEvent::CavalryAction => "kawaleria",
        ActivateEvent::PhalanxAction => "falanga",
        ActivateEvent::AdvanceStep => "krok-naprzod",
        _ => "inne",
    }
}

fn opposite(side: BattleSide) -> BattleSide {
    match side {
        BattleSide::Attacker => BattleSide::Defender,
        BattleSide::Defender => BattleSide::Attacker,
    }
}

fn unit_cu_mut(st: &mut TurnSeqState, r: UnitRef) -> &mut CombatUnit {
    match r.side {
        BattleSide::Attacker => &mut st.atk[r.idx].c,
        BattleSide::Defender => &mut st.def[r.idx].c,
    }
}

/// Zapis jednego ciosu wykonanego przez [`ProdBody`] (obserwacja dla testów zgodności z pinem).
#[derive(Debug, Clone, PartialEq)]
pub struct BlowRecord {
    pub attacker: UnitRef,
    pub target: UnitRef,
    pub missed: bool,
    pub hit_pct: f64,
    pub roll: f64,
    pub dmg: f64,
    pub def_hp_after: f64,
    pub extra_morale: f64,
    pub is_charge: bool,
    /// Łuk ciosu (`relativeHit` względem facing obrońcy w chwili ciosu, `battleScene.ts:8880`).
    pub hit_arc: HitArc,
}

/// Produkcyjne ciało jednostki pętli: składa [`activate_unit`] (K5H) i [`single_blow_full`] (K5I).
pub struct ProdBody<R: RollSource> {
    /// Jednostki stron, `[0]` atakujący, `[1]` obrońca; kolejność jak w `TurnSeqState::atk` / `def`.
    pub units: [Vec<ProdUnit>; 2],
    /// Wejścia sceny `this` dla `_activateUnit` (`finished` brane z `TurnSeqState` przy `start`).
    pub scene: ActivateScene,
    /// Deterministyczne rzuty (wstrzyknięte zamiast `Math.random`).
    pub rolls: R,
    /// Ścieżki nieportowane (NIE_ZMIERZONO): jednostka i etykieta gałęzi. Jednostka z taką ścieżką nic nie robi.
    pub unported: Vec<(UnitRef, &'static str)>,
    /// Ślad zdarzeń `_activateUnit` (K5H) każdej aktywacji, w kolejności `start`. Wczesne wyjścia: `finished` /
    /// `dead` / `fadingOut` = `[Done]`, `routed` = `[Flee]` (pin: `done()` / `_fleeStep` przed czymkolwiek innym).
    pub trace: Vec<(UnitRef, Vec<ActivateEvent>)>,
    /// Zapis każdego wykonanego ciosu (jeden rzut na cios).
    pub blows: Vec<BlowRecord>,
    /// K5DOC-T8: decyzja każdego wykonanego kroku doktryny (`_executeGroupDoctrineStep`, `battleScene.ts:17966-18084`)
    /// w kolejności `start`: która metoda pinu wykonała turę jednostki (obserwacja dla testów zgodności z pinem).
    pub doctrine_steps: Vec<(UnitRef, DoctrineAction)>,
    /// Zbiór `engaged` sceny (`attacker>defender`, `battleScene.ts:8899`): tylko ciosy w zwarciu, także chybione.
    pub engaged: Vec<(UnitRef, UnitRef)>,
    /// Kontrataki obrońców (K5LOOP-KONTRATAK), osobno od ciosów głównych; jeden wpis na wykonany kontratak.
    pub counters: Vec<BlowRecord>,
    /// Budżet kontrataków (`DefenderCounterBudget`, combat.ts:1279): tura, w której obrońca już kontratakował.
    counter_round: [Vec<Option<i64>>; 2],
    /// Flaga `surroundApplied` (jednorazowa) trzymana między aktywacjami, bo nie ma jej w [`CombatUnit`].
    surround: [Vec<bool>; 2],
    pending: [Vec<Option<ProdPending>>; 2],
    /// Obrona r2 (E2-1b): ogon aktywacji ([`LoopBody::take_tail`]) ustawiony w `start`, odbierany po `complete`.
    tail: [Vec<f64>; 2],
    /// Stan `facing` każdej jednostki (`ru.facing`, liczba 0..3). Zmieniany przez `_updateFacing` i `_doMeleeAttack`.
    facing: [Vec<f64>; 2],
    /// `ru.moraleMax` każdej jednostki (`_gainMorale`, `_armyMoraleRatio`). Domyślnie morale startowe z `activate.morale`.
    pub morale_max: [Vec<f64>; 2],
    /// `ru.isArmyCommander`. Domyślnie `false`. Flaga wyłącza jednostkę z `_armyMoraleRatio`
    /// (`armyMoraleRatioWithoutCommander`), a rout/zabicie dowódcy (`_startRout` `:9803-9806`, `_startFade` `:9929-9932`)
    /// wykonuje [`ProdBody::remove_commander_morale_bonus`] dla jego strony (K5LOOP-TAGS-REST, dawne tagi `dowodca-*`).
    pub is_army_commander: [Vec<bool>; 2],
    /// K5LOOP-TAGS-REST: `ru.bu.armyLeaderMoraleBonusFrac ?? 0` każdej jednostki (wejście adaptera; zerowane przez
    /// `_removeCommanderMoraleBonus`, `battleScene.ts:9999`). Domyślnie `0` (pin: brak pola = `0`, jednostka pomijana).
    pub army_leader_bonus_frac: [Vec<f64>; 2],
    /// K5LOOP-TAGS-REST: `moraleBaseFor(u.bu)` z `armyLeaderMoraleBonusFrac = 0` (`battleScene.ts:1611-1624`, BEZ mnożnika
    /// obrońcy `1.5`, który dokłada ciało jak pin `:10000`): wejście adaptera (statystyka `Morale bazowe` z weteranem).
    /// `None` przy `army_leader_bonus_frac` nie `<= 0` = błąd wejścia, jawny tag `dowodca-bez-bazy-morale` (bez zgadywania).
    pub morale_base_plain: [Vec<Option<f64>>; 2],
    /// `ru.screenLostApplied` (`_checkMeleeScreenLost`, jednorazowe -50% morale strzelców).
    screen_lost_applied: [Vec<bool>; 2],
    /// Stan doktryny każdej jednostki (K5DOC-PROD-UNIT-STAN): `unitDoctrine`, `groupId`, `rangedKite`, `shootingEnabled`,
    /// `lastAutoMoveFrom`, `antiCavSpear`, `unitTargetPriorities`. `dryCol`, `heldAfterFallback`, `mounted` są w
    /// `ProdUnit::activate` (ActivateUnit, K5H), jedynym źródle prawdy tych pól.
    /// Wartości domyślne z pinu (patrz [`ProdDoctrineState`]). Czytają go `_advanceStep`, `_rangedAction`, wybór celu
    /// i krok doktryny (K5DOC-T8: `_getEffectiveDoctrine`, `rangedKite` z `skirmish`).
    /// Trzymany w ciele, a nie w [`ProdUnit`], bo literał `ProdUnit` jest też w `p6_k5loop_outcome_pin.rs` (poza allowlistą).
    pub doctrine: [Vec<ProdDoctrineState>; 2],
    /// P4-1I3: `bu.nazwa` jednostek (teksty logu i `_pushClash`), indeks: [strona][jednostka]. Wejście adaptera;
    /// domyślnie znacznik `atk<i>` / `def<i>`.
    pub names: [Vec<String>; 2],
    /// P4-1I3: `String(towerShooterRow['Jednostka'] ?? 'Strzelec')` (`battleScene.ts:4211`); nazwa strzelca wieży w
    /// logu to `'Wieza (' + nazwa + ')'` (`:4241`). Wejście adaptera; domyślnie `Strzelec`.
    pub tower_shooter_nazwa: String,
    /// K5LOOP-SIEGE-DEF (T1): web `this.wallEverBreached` czytane przez `_meleeBlockedByWall` (`battleScene.ts:8361-8371`)
    /// przy wyborze celu obrońcy wręcz w oblężeniu (`_targetInRange`, `:8373-8410`). Wejście sterownika/adaptera
    /// (stan wyłomu trzyma [`SiegeEnv::wall_ever_breached`]; synchronizacja przy wyłomie w trakcie bitwy = T2/T7).
    /// Domyślnie `false` (pin: `wallEverBreached = false` na starcie bitwy).
    pub wall_ever_breached: bool,
    /// K5LOOP-SIEGE-ATK-A (T2a): web `siegeGateCol` / `siegeGateRow` (`battleScene.ts:2450`, `:2452`; wartości pinu na
    /// starcie sceny `-1`, ustawia je `_carveWallTiles` `:4045-4046`). Czytane przez `_siegeRamTowerStep` (`:8026-8035`).
    /// Wejście adaptera ustawienia pola (T5/T6); domyślnie wartości inicjalne pinu.
    pub siege_gate_col: i64,
    pub siege_gate_row: i64,
    /// K5LOOP-SIEGE-ATK-A (T2a): web `siegeWallTilesInit` (`:2458`, inicjalnie `0`; `_carveWallTiles` `:4055`). Czytane
    /// przez `_siegeApproachRestricted` (`:7956`) w bramce `_doMove` marszu atakującego.
    pub siege_wall_tiles_init: usize,
    /// K5LOOP-SIEGE-ATK-A (T2a): web `towerAtWallRows` (`:2499`, pusty zbiór na starcie): wiersze wież oblężniczych
    /// atakującego stojących pod murem. Dopisuje `_siegeRamTowerStep` (`:8040`, `arrive` `:8044-8047`); czytają
    /// `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep` i `_siegeApproachRestricted`. Czyszczenie przy wyłomie
    /// (`:10523`) należy do T2b.
    pub tower_at_wall_rows: BTreeSet<i64>,
    /// K5LOOP-SIEGE-ATK-A (T2a): web `_siegeMachineRange(ru)` (`:7530-7534`) jednostki, indeks [strona][jednostka]. Pin
    /// liczy go per jednostka; `ActivateScene::siege_machine_range` jest jedną wartością sceny. `Some(x)` = wartość tej
    /// jednostki (adapter), `None` = wartość sceny (zachowanie sprzed T2a).
    pub siege_machine_range: [Vec<Option<f64>>; 2],
    /// K5LOOP-SIEGE-ATK-B (T2b): web `gateHp` (`battleScene.ts:2454`, inicjalnie `0`; `_carveWallTiles` ustawia
    /// [`crate::domain::siege_tactics_atk_b::GATE_MAX_HP`], `:4047`). Zmienia `_attackGate` (`:7327`). Wejście adaptera.
    pub gate_hp: f64,
    /// K5LOOP-SIEGE-ATK-B (T2b): web `siegeTowers` (`:2443`): wiersz i `destroyed` wieżyczek muru obrońcy, w kolejności
    /// pinu. Czytane przez `_siegeShooterThreats` (`:7932-7935`) w bramce `_doMove`; `_destroyTowerAtRow` (`:4194-4200`)
    /// przy wyburzeniu kafla. Wejście adaptera (te same wiersze co [`SiegeEnv::tower_rows`]); domyślnie puste.
    pub siege_towers: Vec<SiegeTowerRef>,
    /// K5LOOP-SIEGE-ATK-B (T2b): web `towerRange` (`:2446`, inicjalnie `DEFAULT_TOWER_MIN_RANGE = 2`,
    /// `city-towers.ts:30`; `towerRangeFor` `:4168`). Zasięg zagrożenia wieżyczki w `_siegeShooterThreats`.
    pub tower_range: f64,
    /// K5LOOP-SIEGE-ATK-B (T2b): statystyki `ru.bu.stats` czytane przez `_siegeStructureDamage` (`:7505`) i
    /// `_attackWallTile` (`:7542-7545`), indeks [strona][jednostka]. Wejście adaptera (T6); `None` = brak wiersza: jawny
    /// tag `atak-bramy-bez-szablonu` / `atak-muru-bez-szablonu` zamiast zgadywania obrażeń.
    pub siege_stats: [Vec<Option<SiegeStructStats>>; 2],
    /// K5LOOP-SIEGE-ATK-B (T2b): web `ru.rangeBase` (`:1991`, zasięg bez modyfikatorów; `0` = jednostka wręcz), czytane
    /// przez `_siegeShooterThreats` (`d.rangeBase <= 0`, `:7928`). Domyślnie `activate.range` dla `can_shoot`, inaczej `0`
    /// (adapter spawnu podaje `_attackRangeFor(bu)`, `:4549`, `:4707`).
    pub range_base: [Vec<f64>; 2],
    /// K5LOOP-SIEGE-ATK-B (T2b): web `lastAttackedWallRow` (`:2511`, inicjalnie `-1`; `_attackWallTile` `:7559`). Tylko
    /// HUD (`_updateSiegeHud` `:7848`); trzymane dla ramki/renderera.
    pub last_attacked_wall_row: i64,
    /// K5LOOP-SIEGE-ATK-B: `this.siegeWallCol` bieżącej aktywacji (`max(scene.wall_col, st.siege_wall_col)`, ustawiane w
    /// `start`), czytane przez bramkę `_doMove` w [`Self::move_step_core`] (bez dostępu do `TurnSeqState`).
    seq_wall_col: i64,
    /// K5LOOP-SIEGE-ATK-B: `ru.routed` jednostki wykonującej ruch w bieżącej aktywacji (bramka `_siegeApproachRestricted`,
    /// `:7953`).
    mover_routed: bool,
    /// K5LOOP-SIEGE-ATK-B: odroczone wywołania (`ms`, `id`) z ostatniego wywołania ciała ([`LoopBody::take_timers`]).
    timers: Vec<(f64, u64)>,
    /// K5LOOP-SIEGE-ATK-B: trafienia kamieni katapult w locie: `id`, katapulta, wiersz kafla, obrażenia
    /// (`_attackWallTile` `:7555`).
    boulders: Vec<(u64, UnitRef, i64, f64)>,
    next_timer: u64,
    /// K5LOOP-SIEGE-ATK-B: wyłom bramy w `_attackGate` bieżącej aktywacji (morale obrońców w `complete`).
    pending_gate_breach: bool,
    /// K5LOOP-KILL-RIPPLE (D-INT-2): poległe jednostki, dla których `_resolveBlowOutcome` wywołało ripple
    /// `_shakeAlliesOnLoss(defender)` (`battleScene.ts:9048`), w kolejności wywołań (obserwacja dla testów zgodności z
    /// pinem; ripple z `_fleeStep` nie jest tu zapisywany).
    pub kill_ripples: Vec<UnitRef>,
    /// P4-1I3: czas wirtualny bieżącego wywołania (ustawia sterownik, [`LoopBody::set_now`]).
    now: f64,
    /// P4-1I3: wiersz wieży bieżącego trafienia ([`LoopBody::set_tower_row`]).
    tower_row: i64,
    /// P4-1I3: akcje sceny od ostatniego odbioru ([`LoopBody::take_actions`]).
    actions: Vec<TimedAction>,
    /// P4-1I3 (obrona r1): web `_ffActive` ([`LoopBody::set_ff_active`]); `true` = bez [`BattleAction::Damage`]
    /// (`_spawnDamageLabel` `:9943`). Domyślnie `false` (ciało wołane poza przewijaniem).
    ff_active: bool,
    /// K5DOC-T4e-0 (D1): dane terenu dla kosztu ruchu i brodu. `None` = brak danych; ruch wtedy zwraca
    /// [`MissingTerrain`] (bez wartości domyślnej). Ustawiane przez [`ProdBody::with_terrain`].
    terrain: Option<Box<dyn MoveTerrain>>,
    /// K5DOC-T4e-0 (D3): web `occByKey` (klucz kafelka -> identyfikator jednostki zajmującej pole). Seedowane z
    /// pozycji jednostek w [`ProdBody::new`]; aktualizowane przez [`ProdBody::move_step`].
    occ_by_key: HashMap<CellKey, String>,
    /// K5LOOP-CLOSE (D-K5C-4): `ru.formationRank` (`battleScene.ts:2039`, pole opcjonalne; czyta je
    /// `_compactAttackAllowsStep` jako `?? 0`, `:8141`, `:8156`). Domyślnie `None` (brak pola); spawn szyku ustawia je
    /// adapterem (`:5452`, `:17229`).
    pub formation_rank: [Vec<Option<f64>>; 2],
    /// K5LOOP-CLOSE (D-K5C-4): `this._groupMeta` (mapa `groupId -> { doctrine, autoPlay }`), czytana przez
    /// `_getEffectiveDoctrine` (`:17612`) i `_shouldAvoidAutoBacktrack` (`:8191`). Pin: pusta mapa na starcie bitwy.
    pub group_meta: HashMap<String, GroupMeta>,
    /// K5LOOP-CLOSE obrona r1 (Z1, D-K5C-4): `ru.attackDirection` (`battleScene.ts:2043`), czytane przez C-FLANK w
    /// `_advanceStep` (`:8204-8235`) przez `desiredHitForDirection` (`:1956-1960`). Pin spawn: `'front'` (`:4577`,
    /// `:4722`, `:5492`, `:17265`); gracz ustawia `'bok'`/`'tyl'` z UI (`:13917`, `:16975`). Domyślnie
    /// [`AttackDirection::Front`].
    pub attack_direction: [Vec<AttackDirection>; 2],
    /// K5LOOP-CLOSE r2 (D-K5C-4): `ru.rangedBase` (`battleScene.ts:2019`-okolice), czytane przez `_unitBattleClass`
    /// (`:17486-17489`) w `_priorityScore` (C-FLANK `_pickTargetByPriority`). Domyślnie `activate.can_shoot`
    /// (pin `canShoot(ru) = ru.rangedBase && ru.ammoLeft > 0`, `:1457-1459`, więc `can_shoot` implikuje `rangedBase`);
    /// adapter spawnu podaje wartość z klasy jednostki (strzelec bez amunicji = `true` przy `can_shoot = false`).
    pub ranged_base: [Vec<bool>; 2],
    /// K5LOOP-CLOSE r2 (D-K5C-4): `this._targetPriorities` (`battleScene.ts:2328-2332`), priorytety celu armii dla
    /// `_prefsForUnit` (`:17496-17511`). Pin: wartości `DEFAULT_TARGET_PRIORITIES`; zmienia je wyłącznie panel gracza.
    /// `ru.useUnitPriorities` i `meta.useGroupPriorities` (UI gracza) w ciele = `false` (pola nieobecne w AUTO).
    pub target_priorities: TargetPriorities,
    /// K5LOOP-CLOSE r3 (D-K5C-4): `ru.ammoLeft` (`battleScene.ts:1999`; `canShoot = rangedBase && ammoLeft > 0`, `:1457`).
    /// `_doRangedAttack` zmniejsza o 1 tylko wartość skończoną (`:9191-9192`). Domyślnie `Infinity` dla `can_shoot`
    /// (bez limitu) i `0` dla pozostałych; adapter spawnu podaje `ammo0` jednostki (`:4553`).
    pub ammo_left: [Vec<f64>; 2],
    /// K5LOOP-CLOSE r3: szablon strzału `_singleBlow(attacker, defender, true)` (`:9225`) na cel o danym indeksie w liście
    /// strony przeciwnej (wejście adaptera, jak [`ProdUnit::blow`] dla ciosu). Stan obrońcy nadpisywany z
    /// [`TurnSeqState`] przy `complete`. Brak szablonu dla celu wybranego przez `_rangedAction` = tag
    /// `strzal-bez-szablonu` (bez strzału).
    pub ranged_blows: [Vec<HashMap<usize, FullBlowInput>>; 2],
    /// K5LOOP-CLOSE r4 (D-K5C-4): `ru.fleeStuck` (`battleScene.ts:2018`): liczba kolejnych tur zablokowanej ucieczki
    /// (`_fleeStep` `:9877-9878`: `(ru.fleeStuck ?? 0) + 1`, przy `>= 2` jednostka znika z pola; po kroku `0`, `:9882`).
    /// Trwa między aktywacjami. Pin spawn: `0` (`:4567`, `:4717`, `:5478`, `:17255`).
    pub flee_stuck: [Vec<f64>; 2],
    /// K5LOOP-CLOSE r4: strony `TurnSeqState` po ucieczce wykonanej w `start` (kopia stanu z efektami `_startRout`
    /// z okrążenia, `_removeUnitFromScene` i `_shakeAlliesOnLoss` w kolejności pinu); `complete` tej samej jednostki
    /// przepisuje je do stanu sterownika. Bez muru między `start` a `complete` żaden zegar nie zmienia jednostek (kopia
    /// 1:1). K5LOOP-TAGS-REST: przy murze zegar (wieże, `BodyTimer`) może zmienić jednostki w tym oknie: `complete` łączy
    /// wtedy stany pole po polu ([`merge_flee_unit`]), konflikt = jawny tag `ucieczka-konflikt-zegara`.
    ///
    /// KONTRAKT dla sterownika (#113, U5 Evaluatora r4): między `start` a `complete` uciekającej jednostki nie może
    /// wystartować inna aktywacja z ucieczką, a `complete` dotyczy tej samej jednostki (twarda asercja w każdym profilu).
    /// Zmiana stanu jednostek przez zegar w tym oknie NIE jest już naruszeniem kontraktu (łączenie zamiast nadpisania).
    flee_after: Option<ProdFleeAfter>,
    /// K5LOOP-WIRING-A (#369, długi U5/F4 T4 i D-ADP-6 T6): kompozytor wejścia ciosu w chwili ciosu. `Some` = KAŻDY cios
    /// (główny, kontratak, strzał) dostaje wejście z [`BlowComposer::compose`] liczone z bieżących pozycji, `facing`,
    /// `onWallWalkway` i `engaged`, jak `_singleBlow` (`battleScene.ts:8811-8960`); szablony [`ProdUnit::blow`],
    /// [`ProdUnit::counter_blows`] i [`Self::ranged_blows`] są wtedy nieużywane, a tagi `*-bez-szablonu` nieosiągalne.
    /// `None` (domyślnie) = dotychczasowe zachowanie (szablony adaptera testów).
    pub blow_composer: Option<Box<dyn BlowComposer>>,
    /// K5LOOP-WIRING-A (#369): `true` = trafienie wieży stosuje skutki `_resolveBlowOutcome` (`battleScene.ts:9019-9068`)
    /// jak każdy cios `_singleBlow` (`_fireOneTower` `:4264`), ze strzelcem syntetycznym `dead: true` (`:4236-4244`:
    /// `_gainMorale` strzelca pomijane). `false` (domyślnie, dotychczasowe wektory `p4_1i3`/`p4_1i2`, które stubują te
    /// skutki) = jawny tag `wieza-resolveBlowOutcome-efekty`. Sesja produkcyjna ustawia `true`.
    pub tower_outcome_effects: bool,
    /// K5LOOP-WIRING-A obrona r2 (E2-1a, D-WIRA-16): `terrainRangeDelta(terrainMap.combatTerrainName(q, r))`
    /// (`battleScene.ts:7495-7496`, `combat.ts:730-742`) dla każdego kafla pola, czytane przez `_applyTerrainRange(ru)`
    /// (`:7490-7502`) w miejscach, w których woła je pin: początek aktywacji (`_activateUnit` `:6064`), `_siegeShooterThreats`
    /// (`:7929`) i zejście z korony po wyłomie (`:7740`). Siatka jest stała przez bitwę: jedyne zmiany kafli w pinie to mur
    /// i brama → `Plains` (`_breachWallTile` `:7644`, `:7763-7772`), a `combatTerrainName` muru, bramy i równiny jest ten
    /// sam (`Plaskie`, delta 0). `None` (domyślnie, dotychczasowe wektory pętli ze stubami) = zasięg z adaptera bez
    /// przeliczania (dawne D-B7); sesja produkcyjna ustawia `Some`.
    pub terrain_range_delta: Option<HashMap<(i64, i64), f64>>,
    /// K5LOOP-WIRING-A obrona r2 (E2-1b, D-WIRA-17): czas aktywacji z ciosem/strzałem jak w pinie: skutek w chwili
    /// trafienia (`complete`), `done()` po ogonie ([`LoopBody::take_tail`]: `BLOW_LUNGE_MS + BLOW_SETTLE_MS - body_ms`
    /// po ciosie, `RANGED_GAP_MS` po trafieniu strzału). `false` (domyślnie, dotychczasowe wektory pętli) = dawny model:
    /// `done()` w chwili ciosu, a strzał rozliczany na końcu `RANGED_FLY_MS + RANGED_GAP_MS`. Sesja ustawia `true`.
    pub pin_blow_timing: bool,
    /// K5LOOP-WIRING-A obrona r2 (E2-1b, D-WIRA-18): oś czasu kroków `_doMove` bieżących aktywacji `(jednostka, t0,
    /// z, na)`. Ciało liczy marsz wielokrokowy atomowo w `start`, a pin zmienia `ru.q/ru.r` dopiero w chwili kroku
    /// (`_doMove` `:8714-8775`, `t0` = start kroku). Wieże (`_fireOneTower` → `pickTowerTarget` `:4228-4233`) czytają
    /// pozycje W CHWILI wystrzału, więc [`LoopBody::unit_cell`] zwraca pozycję z tej osi dla `self.now`.
    move_timeline: Vec<MoveStepAt>,
    /// PIN3-DIVERGENCE-Q1 (D-PIN3-1): oś zmian `ru.facing` `(jednostka, t0, przed, po)` w modelu czasu pinu. Ciało
    /// liczy marsz atomowo w `start` (kroki z przyszłym `t0`), a pin obraca jednostkę w chwili KROKU (`_doMove` →
    /// `_updateFacing(ru)` `:8757`). Trafienie wieży w trakcie marszu (`_fireOneTower` → `_singleBlow` po
    /// `RANGED_FLY_MS`, `:4262-4266`) czyta `defender.facing` (`relativeHit` `:8880`) i `defender.q/r` (teren
    /// `:8831-8833`) z TEJ chwili — [`ProdBody::facing_at`] i [`LoopBody::unit_cell_at`].
    facing_timeline: Vec<(UnitRef, f64, f64, f64, bool)>,
    /// PIN3-DIVERGENCE-Q1 (D-PIN3-2): `vNow` bieżącego wywołania ciała ([`LoopBody::set_now`]); `self.now` bywa w ciele
    /// przesuwane na chwile kroków/ciosów, ta wartość nie.
    call_now: f64,
}

/// K5LOOP-WIRING-A (#369): miejsce jednego ciosu `_singleBlow(attacker, defender, ranged)` w chwili ciosu.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct BlowSite {
    pub attacker: UnitRef,
    pub target: UnitRef,
    /// Argument `ranged` (`_doRangedAttack` = `true`, `_doMeleeAttack`/`_defenderCounters` = `false`).
    pub ranged: bool,
    /// `attacker.q`, `attacker.r` w chwili ciosu.
    pub attacker_cell: (i64, i64),
    /// `defender.q`, `defender.r` w chwili ciosu.
    pub target_cell: (i64, i64),
    /// `defender.onWallWalkway` w chwili ciosu.
    pub target_on_wall: bool,
    /// `firstBlow = !this.engaged.has(key)` (`:8896`) policzone przed ciosem (dla `ranged` bez znaczenia).
    pub first_blow: bool,
}

/// K5LOOP-WIRING-A (#369): składanie [`FullBlowInput`] w chwili ciosu (pin `_singleBlow` `:8811-8960`: `toCombatUnit`,
/// teren kafli obu stron, `_wallBonusProcFor`, brod, `civCombatStatMultipliers` z `isChargeRound`, trudność, kontry).
/// `hit_arc`, `first_blow_of_pair` i `defender_state` nadpisuje dalej [`ProdBody`] (jak dotąd dla szablonów).
pub trait BlowComposer {
    fn compose(&self, site: &BlowSite) -> FullBlowInput;

    /// K5LOOP-WIRING-A r2 (zarzut Z2 Evaluatora): trafienie wieży `_singleBlow(shooter, target, true)` (`:4264`) ze
    /// strzelcem syntetycznym na `(wallCol, t.row)` strony `def` (`:4236-4244`), złożone jak każdy cios (`:8811-8960`):
    /// realny `cuD` celu (Obrona, Pancerz, `maxHp`), teren miejski kafla celu, bonusy cywilizacji i trudność strony
    /// obrońcy (`battleUnitCivBonusy(shooter.bu, defenderCivBonusy)`), kontry. `None` = kompozytor nie zna strzelca
    /// (wtedy [`ProdBody`] zapisuje jawny tag `wieza-bez-kompozytora`, bez cichego szablonu).
    fn compose_tower(&self, _site: &TowerBlowSite) -> Option<FullBlowInput> {
        None
    }

    /// K5LOOP-WIRING-A r2 (Z4a): `terrainDefenseMultiplier(terrainMap.combatTerrainName(q, r), cu.rola)` jednostki
    /// `unit` na kaflu `cell` (`_checkRout` `:9790-9792`). `None` = wartość adaptera z kafla startowego.
    fn terrain_defence_mult(&self, _unit: UnitRef, _cell: (i64, i64)) -> Option<f64> {
        None
    }
}

/// K5LOOP-WIRING-A r2: miejsce trafienia wieży (`_fireOneTower` → `_singleBlow(shooter, target, true)`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TowerBlowSite {
    /// Cel (zawsze strona atakującego: `this.atk`, `:4228`).
    pub target: UnitRef,
    /// `(shooter.q, shooter.r)` = `(wallCol, t.row)`.
    pub shooter_cell: (i64, i64),
    /// `(target.q, target.r)` w chwili trafienia.
    pub target_cell: (i64, i64),
    /// `target.onWallWalkway` w chwili trafienia.
    pub target_on_wall: bool,
}

/// K5LOOP-CLOSE r4: wynik ucieczki wykonanej w `start` (patrz [`ProdBody::flee_after`]).
#[derive(Debug, Clone)]
struct ProdFleeAfter {
    unit: UnitRef,
    /// Jednostki obu stron w chwili `start` (przed ucieczką): strażnik kontraktu w `complete`.
    before_atk: Vec<SeqUnit>,
    before_def: Vec<SeqUnit>,
    /// Jednostki obu stron po ucieczce (kopia z efektami `_startRout`, `_removeUnitFromScene`, `_shakeAlliesOnLoss`).
    atk: Vec<SeqUnit>,
    def: Vec<SeqUnit>,
}

/// Równość list jednostek odporna na NaN (`moveLeft = NaN` z lekcji r2 a): bitowa, gdy `==` zawodzi tylko przez NaN.
/// K5LOOP-TAGS-REST: łączenie trójstronne jednej jednostki po ucieczce (patrz `complete`): `cur` = stan sterownika
/// teraz, `before` = w chwili `start`, `fled` = wynik ucieczki z `start`. Porównanie liczb po bitach (NaN = NaN). Zwraca
/// `true` przy konflikcie (oba źródła zmieniły pole na różne wartości; zostaje wartość sterownika).
fn merge_flee_unit(cur: &mut CombatUnit, before: &CombatUnit, fled: &CombatUnit) -> bool {
    fn num(cur: &mut f64, before: f64, fled: f64) -> bool {
        let same = |a: f64, b: f64| a.to_bits() == b.to_bits() || (a.is_nan() && b.is_nan());
        if same(fled, before) || same(*cur, fled) {
            return false;
        }
        if same(*cur, before) {
            *cur = fled;
            return false;
        }
        true
    }
    fn flag(cur: &mut bool, before: bool, fled: bool) -> bool {
        if fled == before || *cur == fled {
            return false;
        }
        if *cur == before {
            *cur = fled;
            return false;
        }
        true
    }
    let mut c = false;
    c |= num(&mut cur.hp, before.hp, fled.hp);
    c |= num(&mut cur.morale, before.morale, fled.morale);
    c |= num(&mut cur.flee_morale, before.flee_morale, fled.flee_morale);
    c |= num(&mut cur.move_left, before.move_left, fled.move_left);
    c |= flag(&mut cur.never_rout, before.never_rout, fled.never_rout);
    c |= flag(&mut cur.dead, before.dead, fled.dead);
    c |= flag(&mut cur.fading_out, before.fading_out, fled.fading_out);
    c |= flag(&mut cur.routed, before.routed, fled.routed);
    c |= flag(&mut cur.removed, before.removed, fled.removed);
    c |= flag(&mut cur.acted, before.acted, fled.acted);
    c
}

fn same_seq_units(a: &[SeqUnit], b: &[SeqUnit]) -> bool {
    a == b || format!("{a:?}") == format!("{b:?}")
}

/// K5LOOP-CLOSE r3: wynik `_rangedAction` w ciele (czas, `moveLeft` po ruchu, strzał: cel i chwila wystrzału względem
/// początku aktywacji).
struct RangedRun {
    dur: f64,
    move_left: Option<f64>,
    shot: Option<(usize, f64)>,
}

/// K5LOOP-CLOSE r3: wynik `_phalanxAction` w ciele.
enum PhalanxRun {
    /// `_doAttack(ru, adj, done)` (`:6551`) na cel z `_targetInRange`: wspólna ścieżka ciosu.
    Attack(usize),
    /// `_advanceStep(ru, done)` (`:6556`) samotnej falangi.
    Advance,
    /// `done()` (wstrzymanie linii albo brak kroku) lub jeden krok `_doMove` (czas, `moveLeft`).
    Finished(f64, Option<f64>),
}

/// K5DOC-T4e-0 (D1): brak danych terenu przy wymaganym kroku ruchu. Jawny błąd, nie wartość domyślna.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MissingTerrain;

/// Wynik jednego kroku ruchu ([`ProdBody::move_step`]).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct MoveStepResult {
    /// Web `ru.moveLeft` po kroku (`_doMove`, `battleScene.ts:8703`).
    pub move_left: f64,
    /// Wynik `do_move_effects` (`done` = web `done()` synchronicznie).
    pub outcome: MoveOutcome,
}

/// Zajętość startowa (web `occByKey` ustawiane przy rozstawieniu): klucz pola -> `unit_tag` jednostki.
fn seed_occupancy(units: &[Vec<ProdUnit>; 2]) -> HashMap<CellKey, String> {
    let mut occ = HashMap::new();
    for (ix, side) in units.iter().enumerate() {
        let side_id = if ix == 0 {
            BattleSide::Attacker
        } else {
            BattleSide::Defender
        };
        for (idx, pu) in side.iter().enumerate() {
            let tag = unit_tag(UnitRef { side: side_id, idx });
            occ.insert(cell_key(pu.activate.q as f64, pu.activate.r as f64), tag);
        }
    }
    occ
}

/// Web `_moveCostForUnit` (`battleScene.ts:7436-7443`): nieprzejezdne = `Infinity`; piechota = koszt bazowy;
/// kawaleria = koszt bazowy * mnożnik terenu, a niedostępny dla kawalerii mnożnik = `Infinity`.
fn unit_move_cost(terrain: &dyn MoveTerrain, mounted: bool, col: f64, row: f64) -> f64 {
    if !terrain.passable(col, row) {
        return f64::INFINITY;
    }
    let base = terrain.move_cost(col, row);
    if !mounted {
        return base;
    }
    let mult = terrain.cavalry_multiplier(col, row);
    if !mult.is_finite() {
        return f64::INFINITY;
    }
    base * mult
}

/// Web `MOVE_STEP_MS` (`battleScene.ts:1010`): czas animacji jednego kroku `_doMove` (`_raf(step)` do `p >= 1`).
/// Czas kroku w ciele jest nominalny (jak `BLOW_HIT_T` w [`ProdUnit::body_ms`]); kwantyzacja klatkami rAF/FF to
/// wejście sterownika (NIE_ZMIERZONO w tym klocku).
pub const MOVE_STEP_MS: f64 = 240.0;

/// K5LOOP-SIEGE-ATK-B (T2b): czas kroku `_doMove` wołanego przez ciało: `MOVE_STEP_MS`, a przy odmowie bramki muru
/// (`ru.moveLeft = 0; done();` synchronicznie, `:8689-8692`) `0`. Ciało nie planuje AUTO-batch (`autobatch = None`),
/// więc `outcome.done` jest prawdą wyłącznie dla odmowy ([`MoveOutcome`]: gałąź bezpośrednia ma `done = false`).
fn step_ms(res: &MoveStepResult) -> f64 {
    if res.outcome.done {
        0.0
    } else {
        MOVE_STEP_MS
    }
}

/// Web `RANGED_FLY_MS = 380` (`battleScene.ts:1012`): lot pocisku jednostki (`_doRangedAttack`, `_schedule(RANGED_FLY_MS)`
/// `:9223`) od wystrzału do `_singleBlow(attacker, defender, true)`.
pub const RANGED_FLY_MS: f64 = 380.0;
/// Krok `_doMove` na osi czasu ciała: `(jednostka, t0, z, na, synchr)` (obrona r2, E2-1b). `synchr` (PIN3-DIVERGENCE-Q1,
/// D-PIN3-2): krok wykonany w chwili wywołania ciała (`t0 <= call_now`, np. pierwszy krok marszu wołany synchronicznie z
/// `_activateUnit`) — w tej samej chwili jest już zrobiony. Pozostałe kroki pin robi z kolejki `_raf`/`_ffQueue`, czyli PO
/// `_drainTimers` tej samej klatki (`_runFastForward` `:9430-9435`): zegar wieży z `due == t0` widzi jeszcze stary stan.
type MoveStepAt = (UnitRef, f64, (i64, i64), (i64, i64), bool);

/// PIN3-DIVERGENCE-Q1 (D-PIN3-2): czy wpis osi czasu ciała z chwilą `t0` (zapisany w chwili wywołania gdy `synchr`) jest
/// już wykonany w chwili `v_now` odczytu przez zegar (wieża): wcześniejszy, albo ta sama chwila i wykonany synchronicznie.
fn timeline_done(t0: f64, synchr: bool, v_now: f64) -> bool {
    t0 < v_now || (t0 == v_now && synchr)
}

/// PIN3-DIVERGENCE-Q1 (D-PIN3-2): klucz kolejności wpisów osi czasu ciała jak w klatce pinu: chwila `t0`, potem faza —
/// wykonane w wywołaniu ciała (zegar `_drainTimers`, `synchr`) = 0, kroki z kolejki `_raf` = 1 (`_runFastForward`
/// `:9427-9435`: zegary przed kolejką kroków tej samej klatki).
fn timeline_key(t0: f64, synchr: bool) -> (f64, u8) {
    (t0, u8::from(!synchr))
}

/// Web `BLOW_LUNGE_MS = 260` (`battleScene.ts:1020`): długość lunge `_doMeleeAttack` (koniec przed `BLOW_SETTLE_MS`).
pub const BLOW_LUNGE_MS: f64 = 260.0;
/// Web `BLOW_SETTLE_MS = 220` (`battleScene.ts:1022`): `_schedule` po lunge przed `done()` (`:9163`).
pub const BLOW_SETTLE_MS: f64 = 220.0;

/// Web `RANGED_GAP_MS = 320` (`battleScene.ts:1013`): pauza po trafieniu strzału przed `done()` (`:9229`).
pub const RANGED_GAP_MS: f64 = 320.0;

/// Adapter [`MoveWorld`] jednej jednostki w [`ProdBody::move_step`]: zajętość z ciała, teren z [`MoveTerrain`],
/// `mounted` z `ActivateUnit` (koszt per jednostka). `update_facing` (K5LOOP-CLOSE, D-K5C-1): pin wywołuje
/// `_updateFacing(ru)` jako OSTATNI efekt stanu `_doMove` (`battleScene.ts:8704` planowanie, `:8756` bezpośrednio),
/// po `ru.q/ru.r` i `moveLeft`. Adapter zapisuje żądanie, a ciało wykonuje `ProdBody::update_facing` zaraz po
/// [`do_move_effects`] z NOWEJ pozycji (nic między nimi nie zmienia stanu, więc kolejność jest ta sama co w pinie).
struct ProdMoveWorld<'a> {
    occ: &'a mut HashMap<CellKey, String>,
    terrain: &'a dyn MoveTerrain,
    mounted: bool,
    facing_requested: bool,
}

impl MoveWorld for ProdMoveWorld<'_> {
    fn occ_mut(&mut self) -> &mut HashMap<CellKey, String> {
        &mut *self.occ
    }

    fn move_cost(&self, col: f64, row: f64) -> f64 {
        unit_move_cost(self.terrain, self.mounted, col, row)
    }

    fn is_ford(&self, col: f64, row: f64) -> bool {
        self.terrain.is_ford(col, row)
    }

    fn update_facing(&mut self, _unit_id: &str) {
        self.facing_requested = true;
    }
}

/// Web `_passableForUnit(ru, col, row)` (`battleScene.ts:7446-7448`: `Number.isFinite(_moveCostForUnit(...))`) dla
/// helperów ścieżki T4a (`first_step_along_path_to_attack`, `step_toward`), które z [`AutoBatchEnv`] czytają
/// WYŁĄCZNIE `passable_for_unit`. Brak terenu: `missing = true` i `false` (ciało zapisuje jawny tag, D1 K5DOC-T4e-0).
struct ProdPathEnv<'a> {
    terrain: Option<&'a dyn MoveTerrain>,
    mounted: bool,
    missing: bool,
}

impl AutoBatchEnv for ProdPathEnv<'_> {
    fn plan_unit(
        &mut self,
        _board: &mut BatchBoard,
        _unit_id: &str,
        _intent: &mut AutoBatchIntent,
    ) {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie planuja (AUTO-batch poza ProdBody)")
    }
    fn check_end(&mut self, _st: &mut BatchState) -> bool {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie wolaja _checkEnd")
    }
    fn passable_for_unit(&mut self, _st: &BatchState, _unit_id: &str, col: f64, row: f64) -> bool {
        match self.terrain {
            Some(t) => unit_move_cost(t, self.mounted, col, row).is_finite(),
            None => {
                self.missing = true;
                false
            }
        }
    }
    fn do_move(&mut self, _st: &mut BatchState, _unit_id: &str, _col: f64, _row: f64) {
        unreachable!("ProdPathEnv: ruch wykonuje ProdBody::move_step_core")
    }
    fn apply_terrain_range(&mut self, _st: &mut BatchState, _unit_id: &str) {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie wolaja _applyTerrainRange")
    }
    fn do_attack(&mut self, _st: &mut BatchState, _attacker_id: &str, _target_id: &str) {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie atakuja")
    }
    fn flee_step(&mut self, _st: &mut BatchState, _unit_id: &str) {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie wolaja _fleeStep")
    }
    fn remove_unit_from_scene(&mut self, _st: &mut BatchState, _unit_id: &str) {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie usuwaja jednostek")
    }
    fn shake_allies_on_loss(&mut self, _st: &mut BatchState, _unit_id: &str) {
        unreachable!("ProdPathEnv: helpery sciezki T4a nie wolaja _shakeAlliesOnLoss")
    }
    fn can_strike_target_from(
        &mut self,
        _st: &BatchState,
        _attacker_id: &str,
        _col: f64,
        _row: f64,
        _target_id: &str,
    ) -> bool {
        unreachable!(
            "ProdPathEnv: C-FLANK (_canStrikeTargetFrom) poza zakresem _advanceStep 'front'"
        )
    }
}

/// Doktryna z `siege_tactics_doctrine_state` w typie bramek ruchu (`player_order_move_gate`); te same wartości pinu
/// (`battleScene.ts:1938`).
/// Odwrotność [`gate_doctrine`] (wpis `this._groupMeta` w typie stanu doktryny ciała).
fn doctrine_of_gate(d: GateDoctrine) -> GroupDoctrine {
    match d {
        GateDoctrine::Defensive => GroupDoctrine::Defensive,
        GateDoctrine::Steady => GroupDoctrine::Steady,
        GateDoctrine::Aggressive => GroupDoctrine::Aggressive,
        GateDoctrine::Skirmish => GroupDoctrine::Skirmish,
        GateDoctrine::Manual => GroupDoctrine::Manual,
    }
}

fn gate_doctrine(d: GroupDoctrine) -> GateDoctrine {
    match d {
        GroupDoctrine::Defensive => GateDoctrine::Defensive,
        GroupDoctrine::Steady => GateDoctrine::Steady,
        GroupDoctrine::Aggressive => GateDoctrine::Aggressive,
        GroupDoctrine::Skirmish => GateDoctrine::Skirmish,
        GroupDoctrine::Manual => GateDoctrine::Manual,
    }
}

/// Odczyty sceny `_advanceStep` (K5DOC-T4b [`AdvanceWorld`]) dla jednostki ciała. `_advanceStep` woła się tylko dla
/// jednostek bez `canShoot` (strzelec z amunicją idzie `_rangedAction`, `:6241`; z `shootingEnabled = false` ma tag
/// `strzelec-bez-strzelania`; `_rangedAction` czyta stąd wyłącznie doktrynę i `_compactAttackAllowsStep`), a mur jest
/// wykluczony (`siegeWallCol < 0`, strażnik `oblezenie`), więc `reach = 1` i `_meleeBlockedByWall` = `false`
/// (`battleScene.ts:8361-8362`).
struct ProdAdvanceWorld<'a> {
    unit: UnitRef,
    /// Pozycje i flagi `ProdUnit::activate` stron `[atk, def]`.
    units: &'a [Vec<ProdUnit>; 2],
    st: &'a TurnSeqState,
    doctrine: &'a [Vec<ProdDoctrineState>; 2],
    group_meta: &'a HashMap<String, GroupMeta>,
    formation_rank: &'a [Vec<Option<f64>>; 2],
    /// K5LOOP-CLOSE r4: `reach = canShoot(ru) ? ru.range : 1` (`_canAttackFrom` `:8437`, `_makeCanAttackFromTest`
    /// `:8455`), patrz [`ProdBody::reach_of`].
    reach: i64,
    /// K5LOOP-SIEGE-ATK-B (T2b): `_meleeBlockedByWall(ru, e)` (`:8439`, `:8456`) dla każdego wroga (indeks listy strony
    /// przeciwnej), [`ProdBody::melee_blocked_list`]. Bez muru same `false`.
    blocked: Vec<bool>,
}

impl ProdAdvanceWorld<'_> {
    /// Web `_enemiesOf(ru)` (`battleScene.ts:8291-8294`): żywi, nieznikający, nieuciekający wrogowie w kolejności listy.
    fn live_enemies(&self) -> impl Iterator<Item = (usize, i64, i64)> + '_ {
        let other = opposite(self.unit.side);
        self.units[side_ix(other)]
            .iter()
            .enumerate()
            .filter_map(move |(i, pu)| {
                let c = self
                    .st
                    .unit(UnitRef {
                        side: other,
                        idx: i,
                    })
                    .c;
                (!c.dead && !c.fading_out && !c.routed).then_some((i, pu.activate.q, pu.activate.r))
            })
    }

    fn group_meta_of(&self, ds: &ProdDoctrineState) -> Option<GroupMeta> {
        // Web `ru.groupId ? this._groupMeta.get(ru.groupId) : undefined` (pusty napis = falsy).
        ds.group_id
            .as_deref()
            .filter(|g| !g.is_empty())
            .and_then(|g| self.group_meta.get(g).copied())
    }

    /// Web `_getEffectiveDoctrine(ru)` (`battleScene.ts:17612-17619`) = `_effectiveMetaForUnit(ru).doctrine` (`:17634`).
    fn effective_doctrine(&self) -> GateDoctrine {
        let ds = &self.doctrine[side_ix(self.unit.side)][self.unit.idx];
        if let Some(d) = ds.unit_doctrine {
            return gate_doctrine(d);
        }
        self.group_meta_of(ds)
            .map(|m| m.doctrine)
            .unwrap_or(GateDoctrine::Steady)
    }
}

impl AdvanceWorld for ProdAdvanceWorld<'_> {
    /// Web `_canAttackFrom(ru, col, row)` (`battleScene.ts:8436-8444`) / `_makeCanAttackFromTest` (`:8454`).
    fn can_attack_from(&self, _unit_id: &str, col: f64, row: f64) -> bool {
        // `dd >= 1 && dd <= reach` (`:8441`); wręcz `reach = 1` (= sąsiad). K5LOOP-SIEGE-ATK-B: wróg za murem
        // (`_meleeBlockedByWall`, `:8439`) pominięty.
        let reach = self.reach as f64;
        self.live_enemies().any(|(i, q, r)| {
            let dd = (col - q as f64).abs() + (row - r as f64).abs();
            !self.blocked.get(i).copied().unwrap_or(false) && dd >= 1.0 && dd <= reach
        })
    }

    /// Web `_pickAdjacentTargetByPriority(ru)` (`:8242`): tu wyłącznie rozstrzyga `adjacent ? _doAttack : done()`
    /// (`:8243-8244`). Zwraca pierwszego żywego sąsiada (dystans 1); `_pickAdjacentTargetByPriority` (`:17545-17569`)
    /// zwraca cel dokładnie wtedy, gdy taki sąsiad istnieje, więc decyzja jest ta sama. Sam cel ciosu liczy
    /// [`ProdBody::advance_step`] klockiem T2 [`pick_adjacent_target_by_priority`] (K5DOC-T8).
    fn pick_adjacent_target(&self, _unit_id: &str) -> Option<String> {
        let me = &self.units[side_ix(self.unit.side)][self.unit.idx].activate;
        let (mq, mr) = (me.q, me.r);
        let other = opposite(self.unit.side);
        self.live_enemies()
            .find(|(_, q, r)| (mq - q).abs() + (mr - r).abs() == 1)
            .map(|(i, _, _)| {
                unit_tag(UnitRef {
                    side: other,
                    idx: i,
                })
            })
    }

    /// Web `_nearestEnemy(ru)` (`battleScene.ts:8296-8304`): pierwszy ściśle najbliższy (Manhattan).
    fn nearest_enemy(&self, _unit_id: &str) -> Option<(String, (f64, f64))> {
        let me = &self.units[side_ix(self.unit.side)][self.unit.idx].activate;
        let other = opposite(self.unit.side);
        let mut best: Option<(usize, i64, i64)> = None;
        let mut best_d = f64::INFINITY;
        for (i, q, r) in self.live_enemies() {
            let dd = ((me.q - q).abs() + (me.r - r).abs()) as f64;
            if dd < best_d {
                best_d = dd;
                best = Some((i, q, r));
            }
        }
        best.map(|(i, q, r)| {
            (
                unit_tag(UnitRef {
                    side: other,
                    idx: i,
                }),
                (q as f64, r as f64),
            )
        })
    }

    /// Web `_shouldAvoidAutoBacktrack(ru)` (`battleScene.ts:8191-8196`) przez [`should_avoid_auto_backtrack`].
    fn avoid_auto_backtrack(&self, _unit_id: &str) -> bool {
        let ds = &self.doctrine[side_ix(self.unit.side)][self.unit.idx];
        should_avoid_auto_backtrack(BacktrackUnit {
            unit_doctrine: ds.unit_doctrine.map(gate_doctrine),
            has_group_id: ds.group_id.as_deref().is_some_and(|g| !g.is_empty()),
            group_meta: self.group_meta_of(ds),
        })
    }

    /// Web `_compactAttackAllowsStep(ru, col)` (`battleScene.ts:8139-8172`) przez [`compact_attack_allows_step`].
    fn compact_attack_allows_step(&self, _unit_id: &str, col: f64) -> bool {
        let six = side_ix(self.unit.side);
        let me = &self.units[six][self.unit.idx].activate;
        let side = match self.unit.side {
            BattleSide::Attacker => CompactSide::Atk,
            BattleSide::Defender => CompactSide::Def,
        };
        let line: Vec<LineMember> = self.units[six]
            .iter()
            .enumerate()
            .map(|(i, pu)| {
                let c = self
                    .st
                    .unit(UnitRef {
                        side: self.unit.side,
                        idx: i,
                    })
                    .c;
                LineMember {
                    q: pu.activate.q as f64,
                    r: pu.activate.r as f64,
                    formation_rank: self.formation_rank[six][i],
                    mounted: pu.activate.mounted,
                    siege: pu.activate.is_siege_unit,
                    in_play: !c.dead && !c.fading_out && !c.removed && !c.routed,
                }
            })
            .collect();
        compact_attack_allows_step(
            CompactStepUnit {
                side,
                doctrine: self.effective_doctrine(),
                mounted: me.mounted,
                siege: me.is_siege_unit,
                formation_rank: self.formation_rank[six][self.unit.idx],
                q: me.q as f64,
                r: me.r as f64,
            },
            col,
            &line,
        )
    }
}

/// Wynik bloku C-FLANK `_advanceStep` (`battleScene.ts:8208-8233`) dla jednego wejścia.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum FlankDecision {
    /// Brak celu albo brak kroku manewru: marsz czołowy poniżej bloku (`:8231-8233`).
    Fallthrough,
    /// Już w pozycji do ciosu z zadanego kierunku (`:8212-8214`): `done()`.
    Done,
    /// `_doMove` na pierwszy krok `_firstStepTowardDirectedAttack` (`:8216-8229`).
    Move(CavTile),
    /// Przejezdność czytana bez [`MoveTerrain`] (D1 K5DOC-T4e-0): jawny tag.
    MissingTerrain,
}

impl<R: RollSource> ProdBody<R> {
    pub fn new(units: [Vec<ProdUnit>; 2], scene: ActivateScene, rolls: R) -> Self {
        let surround = [
            units[0]
                .iter()
                .map(|u| u.activate.surround_applied)
                .collect(),
            units[1]
                .iter()
                .map(|u| u.activate.surround_applied)
                .collect(),
        ];
        let pending = [vec![None; units[0].len()], vec![None; units[1].len()]];
        let counter_round = [vec![None; units[0].len()], vec![None; units[1].len()]];
        let facing = [
            units[0].iter().map(|u| u.facing).collect(),
            units[1].iter().map(|u| u.facing).collect(),
        ];
        let morale_max = [
            units[0].iter().map(|u| u.activate.morale).collect(),
            units[1].iter().map(|u| u.activate.morale).collect(),
        ];
        let is_army_commander = [vec![false; units[0].len()], vec![false; units[1].len()]];
        let army_leader_bonus_frac = [vec![0.0; units[0].len()], vec![0.0; units[1].len()]];
        let morale_base_plain = [vec![None; units[0].len()], vec![None; units[1].len()]];
        let screen_lost_applied = [vec![false; units[0].len()], vec![false; units[1].len()]];
        let doctrine = [
            vec![ProdDoctrineState::default(); units[0].len()],
            vec![ProdDoctrineState::default(); units[1].len()],
        ];
        let names = [
            (0..units[0].len()).map(|i| format!("atk{i}")).collect(),
            (0..units[1].len()).map(|i| format!("def{i}")).collect(),
        ];
        let formation_rank = [vec![None; units[0].len()], vec![None; units[1].len()]];
        let siege_machine_range = [vec![None; units[0].len()], vec![None; units[1].len()]];
        let siege_stats = [vec![None; units[0].len()], vec![None; units[1].len()]];
        let range_base_of = |list: &[ProdUnit]| -> Vec<f64> {
            list.iter()
                .map(|u| {
                    if u.activate.can_shoot {
                        u.activate.range
                    } else {
                        0.0
                    }
                })
                .collect()
        };
        let range_base = [range_base_of(&units[0]), range_base_of(&units[1])];
        let tail = [vec![0.0; units[0].len()], vec![0.0; units[1].len()]];
        Self {
            occ_by_key: seed_occupancy(&units),
            formation_rank,
            group_meta: HashMap::new(),
            attack_direction: [
                vec![AttackDirection::Front; units[0].len()],
                vec![AttackDirection::Front; units[1].len()],
            ],
            ranged_base: [
                units[0].iter().map(|u| u.activate.can_shoot).collect(),
                units[1].iter().map(|u| u.activate.can_shoot).collect(),
            ],
            target_priorities: TargetPriorities::default(),
            ammo_left: [
                units[0]
                    .iter()
                    .map(|u| {
                        if u.activate.can_shoot {
                            f64::INFINITY
                        } else {
                            0.0
                        }
                    })
                    .collect(),
                units[1]
                    .iter()
                    .map(|u| {
                        if u.activate.can_shoot {
                            f64::INFINITY
                        } else {
                            0.0
                        }
                    })
                    .collect(),
            ],
            ranged_blows: [
                vec![HashMap::new(); units[0].len()],
                vec![HashMap::new(); units[1].len()],
            ],
            flee_stuck: [vec![0.0; units[0].len()], vec![0.0; units[1].len()]],
            flee_after: None,
            blow_composer: None,
            tower_outcome_effects: false,
            terrain_range_delta: None,
            pin_blow_timing: false,
            move_timeline: Vec::new(),
            facing_timeline: Vec::new(),
            call_now: 0.0,
            terrain: None,
            units,
            scene,
            rolls,
            unported: Vec::new(),
            trace: Vec::new(),
            blows: Vec::new(),
            doctrine_steps: Vec::new(),
            engaged: Vec::new(),
            counters: Vec::new(),
            counter_round,
            surround,
            pending,
            tail,
            facing,
            morale_max,
            is_army_commander,
            army_leader_bonus_frac,
            morale_base_plain,
            screen_lost_applied,
            doctrine,
            names,
            tower_shooter_nazwa: "Strzelec".to_string(),
            wall_ever_breached: false,
            siege_gate_col: -1,
            siege_gate_row: -1,
            siege_wall_tiles_init: 0,
            tower_at_wall_rows: BTreeSet::new(),
            siege_machine_range,
            gate_hp: 0.0,
            siege_towers: Vec::new(),
            tower_range: 2.0,
            range_base,
            siege_stats,
            last_attacked_wall_row: -1,
            seq_wall_col: -1,
            mover_routed: false,
            timers: Vec::new(),
            boulders: Vec::new(),
            next_timer: 0,
            pending_gate_breach: false,
            kill_ripples: Vec::new(),
            now: 0.0,
            tower_row: 0,
            actions: Vec::new(),
            ff_active: false,
        }
    }

    /// P4-1I3: akcje sceny zebrane od ostatniego odbioru (tylko odczyt).
    pub fn pending_actions(&self) -> &[TimedAction] {
        &self.actions
    }

    fn emit(&mut self, action: BattleAction) {
        if let BattleAction::Move { unit, from, to, .. } = action {
            let synchr = self.now <= self.call_now;
            self.move_timeline.push((unit, self.now, from, to, synchr));
        }
        // P4-1I3 (obrona r1, zarzut 1): `_spawnDamageLabel` (`:9940-9943`): `if (this._ffActive) return;`, jedyne
        // miejsce filtra (trzy wywołania: cios `:9125`, kontratak `:9142`, wieża `:4265`).
        if self.ff_active && matches!(action, BattleAction::Damage { .. }) {
            return;
        }
        self.actions.push(TimedAction {
            t0: self.now,
            action,
        });
    }

    /// P4-1I3 (obrona r1): bieżący tryb przewijania ciała (web `_ffActive`).
    pub fn ff_active(&self) -> bool {
        self.ff_active
    }

    /// `bu.nazwa` jednostki ([`Self::names`]; poza listą: znacznik strony i indeksu).
    fn name_of(&self, unit: UnitRef) -> String {
        self.names[side_ix(unit.side)]
            .get(unit.idx)
            .cloned()
            .unwrap_or_else(|| unit_tag(unit))
    }

    /// `ru.screenLostApplied` jednostki.
    pub fn screen_lost_applied(&self, unit: UnitRef) -> bool {
        self.screen_lost_applied[side_ix(unit.side)][unit.idx]
    }

    /// Aktualny `facing` jednostki (`ru.facing` w pinie).
    pub fn facing(&self, unit: UnitRef) -> f64 {
        self.facing[side_ix(unit.side)][unit.idx]
    }

    /// Stan doktryny jednostki (K5DOC-PROD-UNIT-STAN): tylko odczyt, wartości domyślne z pinu.
    pub fn doctrine(&self, unit: UnitRef) -> &ProdDoctrineState {
        &self.doctrine[side_ix(unit.side)][unit.idx]
    }

    /// PIN3-DIVERGENCE-Q1 (D-PIN3-1): jedyny zapis `ru.facing` w ciele; w modelu czasu pinu ([`Self::pin_blow_timing`])
    /// zmiana trafia też na oś [`Self::facing_timeline`] z chwilą `self.now` (chwila kroku/ciosu na osi ciała).
    fn set_facing(&mut self, unit: UnitRef, dir: f64) {
        let ix = side_ix(unit.side);
        if self.pin_blow_timing {
            let synchr = self.now <= self.call_now;
            let now = self.now;
            // Zwrot w tej chwili osi czasu (nie bieżący stan po marszu): wartość „przed” wpisu.
            let prev = self.facing_at(unit, now);
            if prev.to_bits() == dir.to_bits() {
                return;
            }
            // PIN3-DIVERGENCE-Q1 (D-PIN3-5): zmiana z chwili WCZEŚNIEJSZEJ niż już zapisane zwroty jednostki (np.
            // `_startRout` od trafienia wieży w trakcie jej marszu, `:9818`) nie nadpisuje bieżącego `facing`: w pinie
            // późniejszy krok marszu (`_doMove` → `_updateFacing` `:8757`) obraca ją jeszcze raz. Bieżący stan = zwrot
            // najpóźniejszy w czasie.
            let k_new = timeline_key(now, synchr);
            let later = self
                .facing_timeline
                .iter()
                .any(|&(u, t0, _, _, s)| u == unit && timeline_key(t0, s) > k_new);
            self.facing_timeline.push((unit, now, prev, dir, synchr));
            if later {
                return;
            }
        }
        self.facing[ix][unit.idx] = dir;
    }

    /// PIN3-DIVERGENCE-Q1 (D-PIN3-1): `ru.facing` w chwili `v_now` (pin czyta stan bieżący; ciało ma już stan po
    /// atomowo policzonym marszu). Ostatnia wykonana zmiana ([`timeline_done`]) w kolejności pinu ([`timeline_key`]: chwila,
    /// potem faza zegara przed fazą `_raf`, remis = później zapisana); gdy wszystkie zmiany jednostki na osi są później —
    /// wartość sprzed najwcześniejszej z nich; poza modelem czasu pinu albo bez wpisów — bieżące `facing`.
    fn facing_at(&self, unit: UnitRef, v_now: f64) -> f64 {
        let cur = self.facing[side_ix(unit.side)][unit.idx];
        if !self.pin_blow_timing {
            return cur;
        }
        let mut past: Option<((f64, u8), f64)> = None;
        let mut future: Option<((f64, u8), f64)> = None;
        for &(u, t0, prev, dir, synchr) in &self.facing_timeline {
            if u != unit {
                continue;
            }
            let k = timeline_key(t0, synchr);
            if timeline_done(t0, synchr, v_now) {
                if past.is_none_or(|(pk, _)| k >= pk) {
                    past = Some((k, dir));
                }
            } else if future.is_none_or(|(fk, _)| k < fk) {
                future = Some((k, prev));
            }
        }
        match (past, future) {
            (Some((_, d)), _) => d,
            (None, Some((_, p))) => p,
            (None, None) => cur,
        }
    }

    /// `_updateFacing` (battleScene.ts:8334-8341): zwrot ku NAJBLIŻSZEMU żywemu wrogowi (`_nearestEnemy`, Manhattan,
    /// pierwszy minimalny w kolejności listy). Brak wroga = brak zmiany; wróg na tym samym polu = `facing` bez zmian.
    fn update_facing(&mut self, unit: UnitRef, enemies: &[EnemyRef]) {
        let ix = side_ix(unit.side);
        let (q, r) = (
            self.units[ix][unit.idx].activate.q,
            self.units[ix][unit.idx].activate.r,
        );
        let mut best: Option<EnemyRef> = None;
        let mut best_d = f64::INFINITY;
        for e in enemies
            .iter()
            .filter(|e| !e.dead && !e.fading_out && !e.routed)
        {
            let dd = ((q - e.q).abs() + (r - e.r).abs()) as f64;
            if dd < best_d {
                best_d = dd;
                best = Some(*e);
            }
        }
        let Some(e) = best else {
            return;
        };
        let cur = self.facing[ix][unit.idx];
        let next = facing_toward(
            &JsVal::Num((e.q - q) as f64),
            &JsVal::Num((e.r - r) as f64),
            &JsVal::Num(cur),
        )
        .to_number();
        self.set_facing(unit, next);
        // P4-1I3: pin zmienia `rotation.y` tylko przy zmianie (`if (newFacing === ru.facing) return;`, `:8338`).
        if next != cur {
            self.emit(BattleAction::Facing { unit, dir: next });
        }
    }

    /// Flaga `surroundApplied` jednostki (stan między aktywacjami; nie ma jej w [`CombatUnit`]).
    pub fn surround_applied(&self, unit: UnitRef) -> bool {
        self.surround[side_ix(unit.side)][unit.idx]
    }

    fn enemies_of(&self, side: BattleSide, st: &TurnSeqState) -> Vec<EnemyRef> {
        let other = opposite(side);
        self.units[side_ix(other)]
            .iter()
            .enumerate()
            .map(|(i, pu)| {
                let c = st
                    .unit(UnitRef {
                        side: other,
                        idx: i,
                    })
                    .c;
                EnemyRef {
                    q: pu.activate.q,
                    r: pu.activate.r,
                    dead: c.dead,
                    fading_out: c.fading_out,
                    routed: c.routed,
                    is_catapult: pu.activate.is_catapult,
                }
            })
            .collect()
    }
}

impl<R: RollSource> ProdBody<R> {
    /// K5DOC-T4e-0 (D1): ustawia dane terenu dla ruchu (adapter sceny albo test).
    pub fn with_terrain(mut self, terrain: Box<dyn MoveTerrain>) -> Self {
        self.terrain = Some(terrain);
        self
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): web `this.terrainMap.passable(col, row)` terenu ciała (z kaflami wyburzonymi w trakcie
    /// bitwy, [`PlainsCell`]); `None` = ciało bez [`MoveTerrain`]. Tylko odczyt (ramka/renderer, testy zgodności).
    pub fn terrain_passable(&self, col: i64, row: i64) -> Option<bool> {
        self.terrain
            .as_deref()
            .map(|t| t.passable(col as f64, row as f64))
    }

    /// K5DOC-T4e-0 (D3): web `occByKey` (klucz pola -> identyfikator jednostki).
    pub fn occ_by_key(&self) -> &HashMap<CellKey, String> {
        &self.occ_by_key
    }

    /// K5DOC-T4e-0: jeden krok ruchu pieszego/kawalerii (web `_doMove`, `battleScene.ts:8685-8776`) przez
    /// [`do_move_effects`]. Dla jednostki `unit` ustawia pozycję (`ActivateUnit::q/r`) i zajętość `occ_by_key`;
    /// koszt liczy per `mounted` tej jednostki. Zwraca nowe `move_left` (`max(0, moveLeft - stepCost)`).
    ///
    /// Brak danych terenu ([`Self::with_terrain`] nie wywołane) = [`MissingTerrain`] PRZED jakąkolwiek mutacją,
    /// także przy odmowie (wejście do adaptera jest wymagane). `refused` = wynik `_siegeMoveRefused`.
    pub fn move_step(
        &mut self,
        unit: UnitRef,
        col: i64,
        row: i64,
        refused: bool,
        move_left: f64,
        autobatch: Option<&mut AutoBatchIntent>,
    ) -> Result<MoveStepResult, MissingTerrain> {
        // API bez `TurnSeqState`: flagi wrogów dla `_updateFacing` (`_enemiesOf`) z `ProdUnit::activate`. Ścieżka
        // produkcyjna (`start` -> [`Self::advance_step`]) woła [`Self::move_step_core`] z flagami z `TurnSeqState`.
        let other = opposite(unit.side);
        let enemies: Vec<EnemyRef> = self.units[side_ix(other)]
            .iter()
            .map(|pu| EnemyRef {
                q: pu.activate.q,
                r: pu.activate.r,
                dead: pu.activate.dead,
                fading_out: pu.activate.fading_out,
                routed: pu.activate.routed,
                is_catapult: pu.activate.is_catapult,
            })
            .collect();
        self.move_step_core(unit, col, row, refused, move_left, autobatch, &enemies)
    }

    /// K5LOOP-WIRING-A obrona r2 (E2-1a): `_applyTerrainRange(ru)` (`battleScene.ts:7490-7502`) na bieżącym kaflu
    /// jednostki: `ru.range = ru.rangeBase` dla nie-strzelca/katapulty/`rangeBase <= 0`, inaczej
    /// `max(0, rangeBase + delta)` i podwojenie na koronie ([`apply_terrain_range`]). Bez siatki
    /// ([`Self::terrain_range_delta`] = `None`) bez zmian (dotychczasowe wektory pętli).
    fn refresh_terrain_range(&mut self, side: BattleSide, idx: usize) {
        let Some(grid) = self.terrain_range_delta.as_ref() else {
            return;
        };
        let ix = side_ix(side);
        let a = &self.units[ix][idx].activate;
        let delta = grid.get(&(a.q, a.r)).copied().unwrap_or(0.0);
        let range = apply_terrain_range(
            &TerrainRangeUnit {
                side_def: side == BattleSide::Defender,
                on_wall_walkway: a.on_wall_walkway,
                ranged_base: self.ranged_base[ix][idx],
                is_catapult: a.is_catapult,
                range_base: self.range_base[ix][idx],
            },
            delta,
        );
        self.units[ix][idx].activate.range = range;
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): `this.siegeWallCol >= 0 && this._siegeMoveRefused(ru, col, row)` (`battleScene.ts:8689`,
    /// `:7963-7970`) dla jednostki `unit` stojącej na swoim polu. `_siegeApproachRestricted(ru)` (`:7951-7960`) z flag
    /// jednostki i stanu muru ciała; `_siegeShooterThreats()` (`:7924-7937`) z obrońców (`enemies` = `this.def` z flagami
    /// `_enemiesOf`; `removed` implikuje `dead` w ciele) z `canShoot` i `rangeBase > 0` ([`Self::range_base`]), zasięgiem
    /// `d.range` po `_applyTerrainRange(d)` (wejście adaptera `activate.range`, jak w całym ciele) i z niezburzonych
    /// wieżyczek ([`Self::siege_towers`], [`Self::tower_range`]). Kolejność JS: zagrożenia liczone dopiero po bramce
    /// `_siegeApproachRestricted` (`_applyTerrainRange` nie ma tu skutku, więc kolejność nie zmienia wyniku).
    fn siege_move_refused_now(
        &mut self,
        unit: UnitRef,
        col: i64,
        row: i64,
        enemies: &[EnemyRef],
    ) -> bool {
        let wall_col = self.seq_wall_col.max(self.scene.wall_col);
        if wall_col < 0 {
            return false;
        }
        let a = &self.units[side_ix(unit.side)][unit.idx].activate;
        let approach = ApproachUnit {
            side_atk: unit.side == BattleSide::Attacker,
            routed: self.mover_routed,
            on_wall_walkway: a.on_wall_walkway,
            is_siege_unit: a.is_siege_unit,
            primary_ranged: a.primary_ranged,
            can_shoot: a.can_shoot,
            shooting_disabled: !self.doctrine[side_ix(unit.side)][unit.idx].shooting_enabled
                || a.shooting_disabled,
            mounted: a.mounted,
        };
        let here = (a.q as f64, a.r as f64);
        let wall = self.approach_wall(wall_col);
        let other = side_ix(opposite(unit.side));
        // Obrona r2 (E2-1a): `_siegeShooterThreats` (`:7929`) woła `_applyTerrainRange(d)` (MUTACJA `d.range`) dla każdego
        // obrońcy po strażach, ale tylko gdy `_siegeApproachRestricted(ru)` przepuści (`_siegeMoveRefused` `:7964`).
        if self.terrain_range_delta.is_some() && siege_approach_restricted(&approach, &wall) {
            for (i, e) in enemies.iter().enumerate() {
                if e.dead || e.fading_out || e.routed {
                    continue;
                }
                if !self.units[other][i].activate.can_shoot || self.range_base[other][i] <= 0.0 {
                    continue;
                }
                self.refresh_terrain_range(opposite(unit.side), i);
            }
        }
        let defenders: Vec<ShooterDefender> = enemies
            .iter()
            .enumerate()
            .map(|(i, e)| ShooterDefender {
                q: e.q as f64,
                r: e.r as f64,
                dead: e.dead,
                fading_out: e.fading_out,
                removed: e.dead,
                routed: e.routed,
                can_shoot: self.units[other][i].activate.can_shoot,
                range_base: self.range_base[other][i],
            })
            .collect();
        let threats = siege_shooter_threats(
            &defenders,
            &self.siege_towers,
            wall_col as f64,
            self.tower_range,
            |d| {
                defenders
                    .iter()
                    .position(|x| std::ptr::eq(x, d))
                    .map_or(f64::NAN, |i| self.units[other][i].activate.range)
            },
        );
        siege_move_refused(&approach, &wall, &threats, here, (col as f64, row as f64))
    }

    /// K5LOOP-SIEGE-ATK-B: stan muru ciała dla `_siegeApproachRestricted` (`:7951-7960`).
    fn approach_wall(&self, wall_col: i64) -> ApproachWallState {
        ApproachWallState {
            wall_col_ge0: wall_col >= 0,
            gate_open: self.scene.gate_open,
            wall_ever_breached: self.wall_ever_breached,
            wall_tiles_init: self.siege_wall_tiles_init,
            wall_tiles_alive: self.scene.wall_tile_hp.len(),
            tower_at_wall_rows_count: self.tower_at_wall_rows.len(),
        }
    }

    /// Rdzeń [`Self::move_step`]: `do_move_effects` + `_updateFacing` z NOWEJ pozycji (K5LOOP-CLOSE, D-K5C-1:
    /// `battleScene.ts:8704`/`:8756`) wobec `enemies` (lista strony przeciwnej, flagi jak w `_enemiesOf`).
    #[allow(clippy::too_many_arguments)]
    fn move_step_core(
        &mut self,
        unit: UnitRef,
        col: i64,
        row: i64,
        refused: bool,
        move_left: f64,
        autobatch: Option<&mut AutoBatchIntent>,
        enemies: &[EnemyRef],
    ) -> Result<MoveStepResult, MissingTerrain> {
        let ix = side_ix(unit.side);
        let (old_q, old_r, mounted) = {
            let pu = &self.units[ix][unit.idx];
            (pu.activate.q, pu.activate.r, pu.activate.mounted)
        };
        // Odmowa (web :8689-8692): `ru.moveLeft = 0; done();` bez czytania terenu, bez zmiany pozycji i zajetosci.
        // Dlatego nie wymaga adaptera terenu (D1: MissingTerrain tylko gdy ruch faktycznie wymaga danych).
        // K5LOOP-SIEGE-ATK-B (T2b): bramka `this.siegeWallCol >= 0 && this._siegeMoveRefused(ru, col, row)` (`:8689`)
        // liczona tutaj dla KAŻDEGO kroku ciała (krok doktryny, `_advanceStep`, C-FLANK, jazda, strzelec, odwrót, falanga,
        // ucieczka, marsze machin): jeden wspólny punkt ruchu jak w pinie. Wołający rozpoznaje odmowę po `outcome.done`
        // ([`step_ms`]).
        if refused || self.siege_move_refused_now(unit, col, row, enemies) {
            return Ok(MoveStepResult {
                move_left: 0.0,
                outcome: MoveOutcome { done: true },
            });
        }
        let Some(terrain) = self.terrain.as_deref() else {
            return Err(MissingTerrain);
        };
        let mut mu = MoveUnit {
            id: unit_tag(unit),
            q: old_q as f64,
            r: old_r as f64,
            move_left,
        };
        // Planowanie AUTO-batch (`_autoBatchPlanning`, `:8694-8713`) nie animuje kroku: bez [`BattleAction::Move`].
        let planning = autobatch.is_some();
        let mut world = ProdMoveWorld {
            occ: &mut self.occ_by_key,
            terrain,
            mounted,
            facing_requested: false,
        };
        let outcome = do_move_effects(
            &mut world, &mut mu, col as f64, row as f64, refused, autobatch,
        );
        let facing_requested = world.facing_requested;
        // Pozycja jednostki po kroku (`ru.q`, `ru.r`). Odmowa (`refused`) nie zmienia pozycji (web :8689-8692).
        if !refused {
            let pu = &mut self.units[ix][unit.idx];
            pu.activate.q = col;
            pu.activate.r = row;
        }
        // `_updateFacing(ru)` (`:8704`/`:8756`): ostatni efekt stanu `_doMove`, z nowej pozycji.
        if facing_requested {
            self.update_facing(unit, enemies);
        }
        // K5LOOP-CLOSE r2 (D-K5C-r2-2): animacja kroku (`const t0 = this._now()` po `_updateFacing`, `:8746`; koniec przy
        // `p >= 1`, `MOVE_STEP_MS`). Kolejność akcji jak wywołań sceny w pinie: `Facing` (`:8340`), potem `Move`.
        if !planning {
            self.emit(BattleAction::Move {
                unit,
                from: (old_q, old_r),
                to: (col, row),
                arrive_at: self.now + MOVE_STEP_MS,
            });
        }
        Ok(MoveStepResult {
            move_left: mu.move_left,
            outcome,
        })
    }

    /// Web: `occByKey` zwalnia pole jednostki przy `_startRout` (`battleScene.ts:9812`) i `_removeUnitFromScene`
    /// (`:9915`). Odtwarza ten stan dla jednostek, które już są `routed` albo `removed` w `st` (np. wejście ze stanu
    /// zapisanego albo test startujący w środku bitwy). Ciało robi to samo na bieżąco w `start_rout`/`start_fade`.
    pub fn sync_occupancy(&mut self, st: &TurnSeqState) {
        for (ix, side) in [BattleSide::Attacker, BattleSide::Defender]
            .into_iter()
            .enumerate()
        {
            for idx in 0..self.units[ix].len() {
                let c = st.unit(UnitRef { side, idx }).c;
                if c.routed || c.removed {
                    let pu = &self.units[ix][idx].activate;
                    let key = cell_key(pu.q as f64, pu.r as f64);
                    let tag = unit_tag(UnitRef { side, idx });
                    if self.occ_by_key.get(&key) == Some(&tag) {
                        self.occ_by_key.remove(&key);
                    }
                }
            }
        }
    }

    /// K5LOOP-CLOSE: wykonanie `_advanceStep(ru, done)` (`battleScene.ts:8198-8285`) dla zdarzenia
    /// [`ActivateEvent::AdvanceStep`]: decyzja K5DOC-T4b ([`advance_step_decide`]) -> krok `_doMove` przez
    /// [`Self::move_step_core`] (efekty T4c + `_updateFacing`) -> callback ([`advance_after_move`]); `Schedule`
    /// (`_schedule(STEP_GAP_MS, ...)`) = kolejna iteracja tej samej pętli. Zwraca czas trwania (ms):
    /// `MOVE_STEP_MS` na każdy krok + `STEP_GAP_MS` na każdy `_schedule` (nominalnie, patrz [`MOVE_STEP_MS`]).
    ///
    /// Gałęzie jawnie oznaczone (bez cichego pominięcia):
    /// * `krok-naprzod-brak-terenu`: decyzja wymaga `_passableForUnit`, a ciało nie ma [`MoveTerrain`] (D1).
    ///
    /// `Attack` (`:8241-8245`: `if (_canAttackFrom(ru, ru.q, ru.r)) { const adjacent = _pickAdjacentTargetByPriority(ru);
    /// if (adjacent) _doAttack(ru, adjacent, done); else done(); return; }`) jest wykonywany przy KAŻDYM wejściu, jak w
    /// pinie (K5LOOP-TAGS-REST, dawny tag `krok-naprzod-atak`). Cel liczy `_pickAdjacentTargetByPriority` (K5DOC-T2
    /// [`pick_adjacent_target_by_priority`]); zwracany jako trzeci element wyniku i wykonywany wspólną ścieżką
    /// `_doAttack` w `start` po krokach tej aktywacji (pierwszy element wyniku = czas przed ciosem). Osiągalność w pinie:
    /// z kroku doktryny (`steady`/`aggressive`, `:18022-18025`) przy pierwszym wejściu; z `_activateUnit` (U7.8/U7.9,
    /// falanga) praktycznie nie, bo `_targetInRange` (`:8373-8392`) obejmuje każdy cel `_canAttackFrom` (`:8436-8444`),
    /// a callback `_doMove` kończy przy `_canAttackFrom` (`:8223`, `:8277`). Niespójne wejście adaptera
    /// ([`ProdUnit::melee_target`] różne od celu `_pickAdjacentTargetByPriority`) ujawnia się wtedy jako błąd wejścia
    /// `cios-bez-szablonu` (bez zgadywania szablonu).
    ///
    /// C-FLANK (`:8204-8235`, K5LOOP-CLOSE r2, zdjęty tag `krok-naprzod-flanka`): dla `attackDirection` `'bok'`/`'tyl'`
    /// każde wejście `_advanceStep` najpierw próbuje manewru na flankę/tył celu `_pickTargetByPriority ?? _nearestEnemy`
    /// ([`Self::flank_decide`]); brak kroku = marsz czołowy poniżej (`:8231-8233`), jak w pinie.
    fn advance_step(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
    ) -> (f64, Option<f64>, Option<usize>) {
        let ix = side_ix(unit.side);
        let mounted = self.units[ix][unit.idx].activate.mounted;
        let mut move_left = st.unit(unit).c.move_left;
        // Preludium `_advanceStep` (`:8199-8202`): `finished` i `dead`/`fadingOut` odcina już `start`; `moveLeft <= 0`
        // (`NaN` nie spełnia, jak w JS) kończy przed blokiem C-FLANK.
        let desired = desired_hit_for_direction(self.attack_direction[ix][unit.idx]);
        let mut moved = false;
        let mut attack: Option<usize> = None;
        let now0 = self.now;
        let mut elapsed = 0.0;
        let enemies = self.enemies_of(unit.side, st);
        let board_state = |occ: &HashMap<CellKey, String>| {
            BatchState::new(BatchBoard {
                atk: Vec::new(),
                def: Vec::new(),
                occ: occ.clone(),
            })
        };
        loop {
            // C-FLANK (`:8204-8235`): każde wejście `_advanceStep` (także z `_schedule`), po preludium `:8199-8202`
            // (`moveLeft <= 0` kończy przed blokiem; `NaN` nie, jak w JS).
            if let Some(want) = desired.filter(|_| move_left > 0.0 || move_left.is_nan()) {
                match self.flank_decide(unit, st, want, mounted) {
                    FlankDecision::Fallthrough => {}
                    FlankDecision::Done => break,
                    FlankDecision::MissingTerrain => {
                        self.unported.push((unit, "krok-naprzod-brak-terenu"));
                        break;
                    }
                    FlankDecision::Move((col, row)) => {
                        self.now = now0 + elapsed;
                        let Ok(res) =
                            self.move_step_core(unit, col, row, false, move_left, None, &enemies)
                        else {
                            self.unported.push((unit, "krok-naprzod-brak-terenu"));
                            break;
                        };
                        move_left = res.move_left;
                        moved = true;
                        elapsed += step_ms(&res);
                        // Callback `_doMove` bloku C-FLANK (`:8222-8229`) = ten sam co marszu czołowego (`:8275-8283`),
                        // bez zapisu `lastAutoMoveFrom`.
                        let after = {
                            let au2 = self.advance_unit(unit, move_left);
                            let bst2 = board_state(&self.occ_by_key);
                            let world = self.advance_world(unit, st);
                            advance_after_move(&world, &bst2, &au2)
                        };
                        match after {
                            AfterStep::Done => break,
                            AfterStep::Schedule { ms } => {
                                elapsed += f64::from(ms);
                                continue;
                            }
                        }
                    }
                }
            }
            let au = self.advance_unit(unit, move_left);
            let bst = board_state(&self.occ_by_key);
            let (decision, missing) = {
                let world = self.advance_world(unit, st);
                let mut env = ProdPathEnv {
                    terrain: self.terrain.as_deref(),
                    mounted,
                    missing: false,
                };
                let d = advance_step_decide(&world, &mut env, &bst, &au);
                (d, env.missing)
            };
            if missing {
                self.unported.push((unit, "krok-naprzod-brak-terenu"));
                break;
            }
            match decision {
                AdvanceDecision::Done => break,
                AdvanceDecision::Attack { .. } => {
                    // `const adjacent = this._pickAdjacentTargetByPriority(ru); if (adjacent) _doAttack(...) else done()`.
                    let me = self.combatant(unit, st);
                    let en = self.combatants(opposite(unit.side), st);
                    attack =
                        pick_adjacent_target_by_priority(&me, &en, &self.target_priorities, None);
                    break;
                }
                AdvanceDecision::Move { col, row, then } => {
                    self.now = now0 + elapsed;
                    let res = self.move_step_core(
                        unit, col as i64, row as i64, false, move_left, None, &enemies,
                    );
                    let Ok(res) = res else {
                        // Teren był czytany w decyzji (passable), więc brak terenu tu nie występuje.
                        self.unported.push((unit, "krok-naprzod-brak-terenu"));
                        break;
                    };
                    move_left = res.move_left;
                    moved = true;
                    elapsed += step_ms(&res);
                    // Callback `_doMove` (`:8273-8284`): najpierw `lastAutoMoveFrom = previousPosition`.
                    if let Some((q, r)) = then {
                        self.doctrine[ix][unit.idx].last_auto_move_from =
                            Some((q as i64, r as i64));
                    }
                    let after = {
                        let au2 = self.advance_unit(unit, move_left);
                        let bst2 = board_state(&self.occ_by_key);
                        let world = self.advance_world(unit, st);
                        advance_after_move(&world, &bst2, &au2)
                    };
                    match after {
                        AfterStep::Done => break,
                        AfterStep::Schedule { ms } => elapsed += f64::from(ms),
                    }
                }
            }
        }
        self.now = now0;
        (elapsed, moved.then_some(move_left), attack)
    }

    fn advance_unit(&self, unit: UnitRef, move_left: f64) -> AdvanceUnit {
        let ix = side_ix(unit.side);
        let pu = &self.units[ix][unit.idx].activate;
        AdvanceUnit {
            id: unit_tag(unit),
            q: pu.q as f64,
            r: pu.r as f64,
            dead: false,
            fading_out: false,
            move_left,
            last_auto_move_from: self.doctrine[ix][unit.idx]
                .last_auto_move_from
                .map(|(q, r)| (q as f64, r as f64)),
        }
    }

    /// K5LOOP-CLOSE r4: zasięg ataku jednostki `canShoot(ru) ? ru.range : 1` (`_canAttackFrom` `:8437`,
    /// `_makeCanAttackFromTest` `:8455`, `_canStrikeTargetFrom` `:8491`). Strzelec z amunicją dochodzi do ścieżek ruchu
    /// wręcz tylko z `shootingEnabled = false` (`:6241`); pozostałe jednostki mają `1`.
    fn reach_of(&self, unit: UnitRef) -> i64 {
        let a = &self.units[side_ix(unit.side)][unit.idx].activate;
        if a.can_shoot {
            #[allow(clippy::cast_possible_truncation)]
            let r = a.range as i64;
            r
        } else {
            1
        }
    }

    fn advance_world<'a>(&'a self, unit: UnitRef, st: &'a TurnSeqState) -> ProdAdvanceWorld<'a> {
        ProdAdvanceWorld {
            reach: self.reach_of(unit),
            blocked: self.melee_blocked_list(unit),
            unit,
            units: &self.units,
            st,
            doctrine: &self.doctrine,
            group_meta: &self.group_meta,
            formation_rank: &self.formation_rank,
        }
    }

    /// [`Combatant`] jednostki ciała (pola `ru` czytane przez wybór celu C-FLANK i decyzje kawalerii T6). Stan z `st`
    /// (`hp`, `dead`/`fadingOut`/`routed`), pozycja z `ProdUnit::activate`, `facing` z ciała. `ammo_left` służy wyłącznie
    /// `canShoot` (`rangedBase && ammoLeft > 0`), więc niesie `activate.can_shoot`. `useUnitPriorities` = `false`
    /// (pole UI gracza, nieobecne w AUTO), patrz [`Self::target_priorities`].
    fn combatant(&self, r: UnitRef, st: &TurnSeqState) -> Combatant {
        let ix = side_ix(r.side);
        let pu = &self.units[ix][r.idx].activate;
        let c = st.unit(r).c;
        let ds = &self.doctrine[ix][r.idx];
        #[allow(clippy::cast_possible_truncation)]
        let range = pu.range as i64;
        Combatant {
            q: pu.q,
            r: pu.r,
            hp: c.hp,
            range,
            mounted: pu.mounted,
            primary_ranged: pu.primary_ranged,
            ranged_base: self.ranged_base[ix][r.idx],
            ammo_left: if pu.can_shoot { 1.0 } else { 0.0 },
            shooting_enabled: ds.shooting_enabled,
            anti_cav_spear: ds.anti_cav_spear,
            facing: self.facing[ix][r.idx],
            on_wall_walkway: pu.on_wall_walkway,
            is_siege_unit: pu.is_siege_unit,
            attack_direction: self.attack_direction[ix][r.idx],
            dead: c.dead,
            fading_out: c.fading_out,
            routed: c.routed,
            use_unit_priorities: false,
            unit_target_priorities: None,
        }
    }

    /// K5DOC-T8: `_getEffectiveDoctrine(ru)` (`battleScene.ts:17612-17619`) ze stanu doktryny ciała: `unitDoctrine`,
    /// potem `this._groupMeta.get(ru.groupId)` (pusty `groupId` = brak grupy, jak falsy w JS), inaczej `'steady'`.
    fn effective_doctrine_of(&self, unit: UnitRef) -> GroupDoctrine {
        let ds = &self.doctrine[side_ix(unit.side)][unit.idx];
        let group = ds
            .group_id
            .as_deref()
            .filter(|g| !g.is_empty())
            .and_then(|g| self.group_meta.get(g))
            .map(|m| doctrine_of_gate(m.doctrine));
        effective_doctrine(ds.unit_doctrine, group)
    }

    /// K5DOC-T8: `_ensureGroupMeta(gid)` (`battleScene.ts:17586-17593`) wołane z `_effectiveMetaForUnit` (`:17636`):
    /// brakujący wpis grupy = `{ doctrine: 'steady', autoPlay: true }`.
    fn ensure_group_meta_of(&mut self, unit: UnitRef) {
        let gid = self.doctrine[side_ix(unit.side)][unit.idx]
            .group_id
            .clone()
            .filter(|g| !g.is_empty());
        if let Some(g) = gid {
            self.group_meta.entry(g).or_insert(GroupMeta {
                doctrine: GateDoctrine::Steady,
                auto_play: true,
            });
        }
    }

    /// K5DOC-T8: decyzja `_executeGroupDoctrineStep(ru, meta, done)` ([`execute_group_doctrine_step`]) dla jednostki
    /// ciała. `ru.formationOffset` = `null` (spawn pinu `:4575`; ustawia go wyłącznie UI szyku grupy, którego ciało nie
    /// niesie); `this._generalSettings` blokady = wartości startowe pinu (`blockadeActive: false`, `:2335-2340`; zmienia
    /// je wyłącznie panel gracza).
    fn plan_doctrine_step(
        &self,
        unit: UnitRef,
        st: &TurnSeqState,
        doctrine: GroupDoctrine,
    ) -> DoctrineStep {
        let ix = side_ix(unit.side);
        let pu = &self.units[ix][unit.idx].activate;
        let ds = &self.doctrine[ix][unit.idx];
        let u = DoctrineStepUnit {
            side: unit.side,
            q: pu.q,
            r: pu.r,
            has_group: ds.group_id.as_deref().is_some_and(|g| !g.is_empty()),
            mounted: pu.mounted,
            can_shoot: pu.can_shoot,
            shooting_enabled: !pu.shooting_disabled,
            primary_ranged: pu.primary_ranged,
            ranged_base: self.ranged_base[ix][unit.idx],
            range: pu.range,
            move_left: st.unit(unit).c.move_left,
            formation_offset: None,
        };
        let me = self.combatant(unit, st);
        let en = self.combatants(opposite(unit.side), st);
        execute_group_doctrine_step(
            doctrine,
            &u,
            &me,
            &en,
            &self.target_priorities,
            BlockadeSettings {
                active: false,
                col: None,
            },
        )
    }

    /// Lista [`Combatant`] strony `side` w kolejności `TurnSeqState` (indeksy = indeksy jednostek tej strony).
    fn combatants(&self, side: BattleSide, st: &TurnSeqState) -> Vec<Combatant> {
        (0..self.units[side_ix(side)].len())
            .map(|idx| self.combatant(UnitRef { side, idx }, st))
            .collect()
    }

    /// Web `this.occByKey.has(key)` jako zbiór pól (wejście helperów T6).
    fn occupied_tiles(&self) -> HashSet<CavTile> {
        #[allow(clippy::cast_possible_truncation)]
        self.occ_by_key
            .keys()
            .map(|k| (f64::from_bits(k.0) as i64, f64::from_bits(k.1) as i64))
            .collect()
    }

    /// Uruchamia `f` z [`CavTerrain`] jednostki (`mounted`, zasięg ataku `reach`, [`Self::reach_of`]) wobec wrogów `en`.
    /// Bez muru (strażnik `oblezenie`) `_meleeBlockedByWall` = `false`, więc `_canStrikeTargetFrom` (`:8487-8493`) i
    /// `_makeCanAttackFromTest` (`:8454-8478`) = dystans Manhattan w `[1..reach]` (wręcz `reach = 1`; K5LOOP-CLOSE r4:
    /// strzelec z amunicją i `shootingEnabled = false` ma `reach = ru.range`, `:8491`, `:8455`).
    /// `_passableForUnit` (`:7446-7448`) = skończony `_moveCostForUnit` (z mnożnikiem jazdy). Drugi element wyniku =
    /// `true`, gdy przejezdność była czytana bez [`MoveTerrain`] (D1: jawny tag u wołającego).
    fn with_cav_terrain<T>(
        &self,
        unit: UnitRef,
        mounted: bool,
        reach: i64,
        en: &[Combatant],
        f: impl FnOnce(&CavTerrain) -> T,
    ) -> (T, bool) {
        let terrain = self.terrain.as_deref();
        let missing = Cell::new(false);
        let passable = |c: i64, r: i64| match terrain {
            Some(t) => unit_move_cost(t, mounted, c as f64, r as f64).is_finite(),
            None => {
                missing.set(true);
                false
            }
        };
        let is_ford = |c: i64, r: i64| terrain.is_some_and(|t| t.is_ford(c as f64, r as f64));
        let in_reach = |d: i64| d >= 1 && d <= reach;
        // K5LOOP-SIEGE-ATK-B (T2b): `_meleeBlockedByWall` w `_canStrikeTargetFrom` (`:8490`) i `_makeCanAttackFromTest`
        // (`:8456`).
        let blocked = self.melee_blocked_list(unit);
        let is_blocked = |i: usize| blocked.get(i).copied().unwrap_or(false);
        let can_strike_from = |c: i64, r: i64, i: usize| {
            let e = &en[i];
            !is_blocked(i) && in_reach((c - e.q).abs() + (r - e.r).abs())
        };
        let can_attack_from = |c: i64, r: i64| {
            enemies_of_cmb(en)
                .iter()
                .any(|(i, e)| !is_blocked(*i) && in_reach((c - e.q).abs() + (r - e.r).abs()))
        };
        let ct = CavTerrain {
            passable: &passable,
            is_ford: &is_ford,
            can_strike_from: &can_strike_from,
            can_attack_from: &can_attack_from,
        };
        let out = f(&ct);
        (out, missing.get())
    }

    /// C-FLANK `_advanceStep` (`battleScene.ts:8208-8233`) dla `desired` (`flank`/`rear`): cel
    /// `_pickTargetByPriority(ru) ?? _nearestEnemy(ru)` (`:8210`); już w pozycji (`_canStrikeTargetFrom` i `relativeHit`
    /// celu == `desired`, `:8212-8214`) = `done()`; krok `_firstStepTowardDirectedAttack` (`:8216`, BFS T6) = ruch;
    /// brak celu albo brak kroku = marsz czołowy (`:8231-8233`).
    fn flank_decide(
        &self,
        unit: UnitRef,
        st: &TurnSeqState,
        desired: HitArc,
        mounted: bool,
    ) -> FlankDecision {
        let me = self.combatant(unit, st);
        let en = self.combatants(opposite(unit.side), st);
        let picked = pick_target_by_priority(&me, &en, &self.target_priorities, None);
        // `?? this._nearestEnemy(ru)` (`:8296-8304`): pierwszy ściśle najbliższy żywy wróg.
        let tgt = picked.or_else(|| {
            let mut best: Option<usize> = None;
            let mut best_d = i64::MAX;
            for (i, e) in enemies_of_cmb(&en) {
                let d = (me.q - e.q).abs() + (me.r - e.r).abs();
                if d < best_d {
                    best_d = d;
                    best = Some(i);
                }
            }
            best
        });
        let Some(t) = tgt else {
            return FlankDecision::Fallthrough;
        };
        let e = &en[t];
        // `_canStrikeTargetFrom(ru, ru.q, ru.r, dirTarget)` (`:8212`, ciało `:8487-8493`): `1 <= dd <= reach`.
        let reach = self.reach_of(unit);
        let dd = (me.q - e.q).abs() + (me.r - e.r).abs();
        // K5LOOP-SIEGE-ATK-B: `if (this._meleeBlockedByWall(ru, target)) return false;` (`:8490`).
        let already = !self.melee_blocked_for(unit, t)
            && dd >= 1
            && dd <= reach
            && relative_hit(
                &JsVal::Num(e.facing),
                &JsVal::Num(me.q as f64),
                &JsVal::Num(me.r as f64),
                &JsVal::Num(e.q as f64),
                &JsVal::Num(e.r as f64),
            ) == desired;
        if already {
            return FlankDecision::Done;
        }
        let occ = self.occupied_tiles();
        let (step, missing) = self.with_cav_terrain(unit, mounted, reach, &en, |ct| {
            first_step_toward_directed_attack(&me, &en, t, desired, &occ, ct)
        });
        if missing {
            return FlankDecision::MissingTerrain;
        }
        match step {
            Some(tile) => FlankDecision::Move(tile),
            None => FlankDecision::Fallthrough,
        }
    }

    /// Jeden krok `_doMove` kawalerii (efekty T4c + `_updateFacing` + `Move`) w bieżącej chwili `self.now`.
    fn cav_move(
        &mut self,
        unit: UnitRef,
        tile: CavTile,
        move_left: f64,
        enemies: &[EnemyRef],
    ) -> Option<(f64, f64)> {
        self.move_step_core(unit, tile.0, tile.1, false, move_left, None, enemies)
            .ok()
            .map(|r| (r.move_left, step_ms(&r)))
    }

    /// K5LOOP-CLOSE r2: wykonanie `_cavalryAction(ru, done)` (`battleScene.ts:6372-6412`) w ciele, z decyzjami K5DOC-T6
    /// (`siege_tactics_cavalry`, bez zmian, D-K5C-3) i PRAWDZIWYM `_doMove` ([`Self::move_step_core`]: koszt terenu jazdy,
    /// bród, `_updateFacing`, `Move`) zamiast emulacji T6 `moveLeft -= 1` (`cavalry_action_decide` nie jest wołane).
    /// Kolejność: (1) sąsiad nie-włócznik -> cios (`:6377-6378`); (2) cel `_cavalryTarget`, brak = `done()`
    /// (`:6382-6383`); C-FLANK `_cavDirectedManeuverStep` (`:6389-6390`, `:6426-6446`) z pętlą w callbacku `_doMove`;
    /// `_cavManeuverStep` (`:6392`, `:6457-6501`) z pętlą; (3) wymuszony cios w pierwszego sąsiada z `_enemiesOf`
    /// (`:6397-6401`); (4) krok szarży `_bestChargeStepKey` przy `moveLeft > 0` (`:6403-6409`). Rekursja callbacków
    /// `_doMove` kawalerii NIE używa `_schedule` (inaczej niż `_advanceStep`): kroki następują co `MOVE_STEP_MS`.
    /// Helpery T6 przyjmują `moves_left: i64` wyłącznie do testu `moveLeft <= 0`; ciało podaje `1`/`0` z `ru.moveLeft`
    /// (`f64`, także ułamkowy po brodzie), żeby nie obcinać `0.5` do `0`.
    /// Zwraca (czas ms, `moveLeft` po ruchu albo `None`, cel ciosu).
    fn cavalry_action(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
    ) -> (f64, Option<f64>, Option<usize>) {
        let ix = side_ix(unit.side);
        let mounted = self.units[ix][unit.idx].activate.mounted;
        let reach = self.reach_of(unit);
        let mut move_left = st.unit(unit).c.move_left;
        let en = self.combatants(opposite(unit.side), st);
        let enemies = self.enemies_of(unit.side, st);
        let gate = |ml: f64| i64::from(ml > 0.0 || ml.is_nan());
        // (1) `_cavAdjacentNonSpear` -> `_doAttack`.
        if let Some(i) = cav_adjacent_non_spear(&self.combatant(unit, st), &en) {
            return (0.0, None, Some(i));
        }
        // (2) `_cavalryTarget`; brak = `done()`.
        let Some(tgt) = cavalry_target(&self.combatant(unit, st), &en) else {
            return (0.0, None, None);
        };
        let now0 = self.now;
        let mut elapsed = 0.0;
        let mut moved = false;
        let desired = desired_hit_for_direction(self.attack_direction[ix][unit.idx]);
        // C-FLANK: `_cavDirectedManeuverStep(ru, done, tgt, desiredDir)`; `true` = manewr przejmuje turę.
        if let Some(want) = desired {
            let first = {
                let me = self.combatant(unit, st);
                let occ = self.occupied_tiles();
                self.with_cav_terrain(unit, mounted, reach, &en, |ct| {
                    cav_directed_maneuver_step(&me, &en, tgt, want, gate(move_left), &occ, ct)
                })
                .0
            };
            if let Some(mut step) = first {
                let mut cur = tgt;
                loop {
                    self.now = now0 + elapsed;
                    let Some((ml, ms)) = self.cav_move(unit, step, move_left, &enemies) else {
                        break;
                    };
                    move_left = ml;
                    moved = true;
                    elapsed += ms;
                    // Callback (`:6436-6443`): dobry sąsiad -> `done()`; ruch -> cel `_cavalryTarget(ru) ?? tgt`.
                    let me = self.combatant(unit, st);
                    // `ru.moveLeft > 0` (`:6439`/`:6496`): dla `NaN` porównanie jest fałszywe, więc pętla kończy się po
                    // jednym kroku; samo `move_left <= 0.0` jest fałszywe dla `NaN` i kręciło pętlę dalej (zarzut Z1 r2).
                    if cav_adjacent_non_spear(&me, &en).is_some()
                        || move_left <= 0.0
                        || move_left.is_nan()
                    {
                        break;
                    }
                    cur = cavalry_target(&me, &en).unwrap_or(cur);
                    let occ = self.occupied_tiles();
                    let next = self
                        .with_cav_terrain(unit, mounted, reach, &en, |ct| {
                            cav_directed_maneuver_step(
                                &me,
                                &en,
                                cur,
                                want,
                                gate(move_left),
                                &occ,
                                ct,
                            )
                        })
                        .0;
                    match next {
                        Some(s2) => step = s2,
                        None => break,
                    }
                }
                self.now = now0;
                return (elapsed, moved.then_some(move_left), None);
            }
        }
        // `_cavManeuverStep(ru, done, tgt)`; `true` = manewr przejmuje turę.
        let first = {
            let me = self.combatant(unit, st);
            let occ = self.occupied_tiles();
            self.with_cav_terrain(unit, mounted, reach, &en, |ct| {
                cav_maneuver_step(&me, &en, tgt, gate(move_left), &occ, ct)
            })
            .0
        };
        if let Some(mut step) = first {
            loop {
                self.now = now0 + elapsed;
                let Some((ml, ms)) = self.cav_move(unit, step, move_left, &enemies) else {
                    break;
                };
                move_left = ml;
                moved = true;
                elapsed += ms;
                // Callback (`:6492-6499`): dobry sąsiad -> `done()`; ruch -> `t2 = _cavalryTarget(ru)` i kolejny krok.
                let me = self.combatant(unit, st);
                // `ru.moveLeft > 0` (`:6439`/`:6496`): dla `NaN` porównanie jest fałszywe, więc pętla kończy się po
                // jednym kroku; samo `move_left <= 0.0` jest fałszywe dla `NaN` i kręciło pętlę dalej (zarzut Z1 r2).
                if cav_adjacent_non_spear(&me, &en).is_some()
                    || move_left <= 0.0
                    || move_left.is_nan()
                {
                    break;
                }
                let Some(t2) = cavalry_target(&me, &en) else {
                    break;
                };
                let occ = self.occupied_tiles();
                let next = self
                    .with_cav_terrain(unit, mounted, reach, &en, |ct| {
                        cav_maneuver_step(&me, &en, t2, gate(move_left), &occ, ct)
                    })
                    .0;
                match next {
                    Some(s2) => step = s2,
                    None => break,
                }
            }
            self.now = now0;
            return (elapsed, moved.then_some(move_left), None);
        }
        // (3) Wymuszony cios: pierwszy sąsiad w kolejności `_enemiesOf` (`:6397-6401`).
        let me = self.combatant(unit, st);
        if let Some((i, _)) = enemies_of_cmb(&en)
            .into_iter()
            .find(|(_, e)| (me.q - e.q).abs() + (me.r - e.r).abs() == 1)
        {
            return (0.0, None, Some(i));
        }
        // (4) `_bestChargeStepKey(ru, tgt)` i `ru.moveLeft > 0` -> jeden `_doMove(ru, nc, nr, done)`.
        let occ = self.occupied_tiles();
        let charge = self
            .with_cav_terrain(unit, mounted, reach, &en, |ct| {
                best_charge_step(&me, &en, tgt, &occ, ct)
            })
            .0;
        if let Some(step) = charge {
            if move_left > 0.0 {
                if let Some((ml, ms)) = self.cav_move(unit, step, move_left, &enemies) {
                    move_left = ml;
                    moved = true;
                    elapsed += ms;
                }
            }
        }
        self.now = now0;
        (elapsed, moved.then_some(move_left), None)
    }
}

/// K5LOOP-CLOSE r3: odczyty sceny `_fallBackStep` (K5DOC-T7b [`FallBackWorld`]) dla jednostki ciała.
struct ProdFallBackWorld<'a> {
    /// Żywi wrogowie (`_enemiesOf`): pozycje; element 0 = `_nearestEnemy` (patrz [`ProdBody::fall_back`]).
    enemies: Vec<PathTile>,
    occ: &'a HashMap<CellKey, String>,
    terrain: &'a dyn MoveTerrain,
    mounted: bool,
}

impl FallBackWorld for ProdFallBackWorld<'_> {
    fn enemies(&self, _unit_id: &str) -> Vec<PathTile> {
        self.enemies.clone()
    }
    fn nearest_enemy(&self, _unit_id: &str) -> Option<PathTile> {
        self.enemies.first().copied()
    }
    fn is_occupied(&self, col: f64, row: f64) -> bool {
        self.occ.contains_key(&cell_key(col, row))
    }
    fn passable(&self, _unit_id: &str, col: f64, row: f64) -> bool {
        unit_move_cost(self.terrain, self.mounted, col, row).is_finite()
    }
}

/// K5LOOP-CLOSE r3: odczyty sceny `_phalanxAction` / `_phalanxStep` (K5DOC-T7a [`PhalanxWorld`]).
struct ProdPhalanxWorld<'a> {
    /// `_targetInRange(ru)` = wejście adaptera [`ProdUnit::melee_target`] (odfiltrowane jak w `start`).
    melee_target: Option<usize>,
    enemies: Vec<PhalanxEnemy>,
    occ: &'a HashMap<CellKey, String>,
    terrain: &'a dyn MoveTerrain,
    mounted: bool,
}

impl PhalanxWorld for ProdPhalanxWorld<'_> {
    fn target_in_range(&self, _unit_id: &str) -> Option<String> {
        self.melee_target.map(|t| t.to_string())
    }
    fn enemies_of(&self, _unit_id: &str) -> Vec<PhalanxEnemy> {
        self.enemies.clone()
    }
    fn passable_for_unit(&self, _unit_id: &str, col: f64, row: f64) -> bool {
        unit_move_cost(self.terrain, self.mounted, col, row).is_finite()
    }
    fn occupied(&self, col: f64, row: f64) -> bool {
        self.occ.contains_key(&cell_key(col, row))
    }
}

/// Klucz pola (`cellKey`) na kafelek całkowity.
fn key_tile(k: CellKey) -> (i64, i64) {
    #[allow(clippy::cast_possible_truncation)]
    (f64::from_bits(k.0) as i64, f64::from_bits(k.1) as i64)
}

/// Kafelek `f64` modułów T5/T7 na kafelek całkowity ciała.
fn int_tile(t: PathTile) -> (i64, i64) {
    #[allow(clippy::cast_possible_truncation)]
    (t.0 as i64, t.1 as i64)
}

impl<R: RollSource> ProdBody<R> {
    /// Żywi wrogowie jednostki (`_enemiesOf`, `battleScene.ts:8291-8294`) w kolejności listy strony przeciwnej:
    /// (indeks, `q`, `r`).
    fn live_enemy_cells(&self, unit: UnitRef, st: &TurnSeqState) -> Vec<(usize, i64, i64)> {
        let other = opposite(unit.side);
        self.units[side_ix(other)]
            .iter()
            .enumerate()
            .filter_map(|(i, pu)| {
                let c = st
                    .unit(UnitRef {
                        side: other,
                        idx: i,
                    })
                    .c;
                (!c.dead && !c.fading_out && !c.routed).then_some((i, pu.activate.q, pu.activate.r))
            })
            .collect()
    }

    /// `_nearestEnemy(ru)` (`battleScene.ts:8296-8304`) z bieżącej pozycji: pierwszy ściśle najbliższy żywy wróg.
    fn nearest_live_enemy(&self, unit: UnitRef, st: &TurnSeqState) -> Option<(usize, i64, i64)> {
        let (mq, mr) = self.cell_of(unit);
        let mut best = None;
        let mut best_d = i64::MAX;
        for (i, q, r) in self.live_enemy_cells(unit, st) {
            let d = (mq - q).abs() + (mr - r).abs();
            if d < best_d {
                best_d = d;
                best = Some((i, q, r));
            }
        }
        best
    }

    /// Jednostki obu stron jako [`KiteUnit`] (`[atk..., def...]`, flagi z `st`) i indeks `unit` w tej liście.
    fn kite_units(&self, unit: UnitRef, st: &TurnSeqState) -> (Vec<KiteUnit>, usize) {
        let mut out = Vec::new();
        let mut me = 0;
        for side in [BattleSide::Attacker, BattleSide::Defender] {
            for (i, pu) in self.units[side_ix(side)].iter().enumerate() {
                let r = UnitRef { side, idx: i };
                if r == unit {
                    me = out.len();
                }
                let c = st.unit(r).c;
                out.push(KiteUnit {
                    tile: (pu.activate.q as f64, pu.activate.r as f64),
                    side,
                    range: pu.activate.range,
                    primary_ranged: pu.activate.primary_ranged,
                    dead: c.dead,
                    fading_out: c.fading_out,
                    routed: c.routed,
                });
            }
        }
        (out, me)
    }

    /// Jednostka jako [`ForwardUnit`] (pola `_rangedForwardStep` / `_bestForwardStep`).
    fn forward_unit(&self, r: UnitRef, st: &TurnSeqState, move_left: f64) -> ForwardUnit {
        let pu = &self.units[side_ix(r.side)][r.idx].activate;
        let c = st.unit(r).c;
        ForwardUnit {
            tile: (pu.q as f64, pu.r as f64),
            side: r.side,
            range: pu.range,
            move_left,
            dead: c.dead,
            fading_out: c.fading_out,
            routed: c.routed,
            removed: c.removed,
            mounted: pu.mounted,
            siege: pu.is_siege_unit,
        }
    }

    /// Sojusznicy linii wręcz strony `side` (`battleScene.ts:6792-6794`, `:8177-8179`): żywi, nieusunięci,
    /// nieuciekający, nie konni, nie `rangedBase`, nie machiny. Pozycje (`q`, `r`).
    fn melee_line_allies(&self, side: BattleSide, st: &TurnSeqState) -> Vec<(i64, i64)> {
        let six = side_ix(side);
        self.units[six]
            .iter()
            .enumerate()
            .filter_map(|(i, pu)| {
                let c = st.unit(UnitRef { side, idx: i }).c;
                let keep = !c.dead
                    && !c.fading_out
                    && !c.removed
                    && !c.routed
                    && !pu.activate.mounted
                    && !self.ranged_base[six][i]
                    && !pu.activate.is_siege_unit;
                keep.then_some((pu.activate.q, pu.activate.r))
            })
            .collect()
    }

    /// Web `_rangedFiringStepStaysBehindMelee(ru, candidateCol)` (`battleScene.ts:8175-8189`).
    fn ranged_firing_step_stays_behind_melee(
        &self,
        unit: UnitRef,
        st: &TurnSeqState,
        candidate_col: i64,
    ) -> bool {
        let ix = side_ix(unit.side);
        let me = &self.units[ix][unit.idx].activate;
        if self.advance_world(unit, st).effective_doctrine() != GateDoctrine::Steady
            || !self.ranged_base[ix][unit.idx]
            || me.mounted
        {
            return false;
        }
        let allies = self.melee_line_allies(unit.side, st);
        if allies.is_empty() {
            return false;
        }
        let progress = |col: i64| if me.side_atk { col } else { -col };
        let gap = allies
            .iter()
            .map(|(_, r)| (r - me.r).abs())
            .min()
            .unwrap_or(i64::MAX);
        let lane_progress = allies
            .iter()
            .filter(|(_, r)| (r - me.r).abs() == gap)
            .map(|(q, _)| progress(*q))
            .min()
            .unwrap_or(i64::MAX);
        progress(candidate_col) <= lane_progress
    }

    /// `lineAllowsRangedStep` w `_rangedForwardStep` (`battleScene.ts:6791-6798`).
    fn ranged_line_allows_step(&self, unit: UnitRef, st: &TurnSeqState, col: i64) -> bool {
        let melee_line = !self.melee_line_allies(unit.side, st).is_empty();
        let world = self.advance_world(unit, st);
        if melee_line && world.effective_doctrine() == GateDoctrine::Steady {
            self.ranged_firing_step_stays_behind_melee(unit, st, col)
        } else {
            world.compact_attack_allows_step("", col as f64)
        }
    }

    /// `_rangedTargetInRange(ru)` (`battleScene.ts:7041-7053`) z bieżącej pozycji przez K5DOC-T2
    /// [`ranged_target_cmb`] (najbliższy w `[1..range]`, remis: niższe HP).
    fn ranged_target_now(&self, unit: UnitRef, st: &TurnSeqState) -> Option<usize> {
        let me = self.combatant(unit, st);
        let en = self.combatants(opposite(unit.side), st);
        ranged_target_cmb(&me, &en)
    }

    /// Krok `_doMove` w ciele w chwili `at`; teren jest wymagany przed wejściem w gałąź (`start`).
    fn body_step(
        &mut self,
        unit: UnitRef,
        tile: (i64, i64),
        move_left: f64,
        at: f64,
        enemies: &[EnemyRef],
    ) -> (f64, f64) {
        let saved = self.now;
        self.now = at;
        let res = self
            .move_step_core(unit, tile.0, tile.1, false, move_left, None, enemies)
            .expect("teren sprawdzony w start (galaz ruchowa bez MoveTerrain ma jawny tag)");
        self.now = saved;
        (res.move_left, step_ms(&res))
    }

    /// K5LOOP-CLOSE r3: wykonanie `_rangedAction(ru, done)` (`battleScene.ts:6656-6741`) w ciele, z klockami T5a
    /// ([`nearest_enemy_melee`], [`best_kite_shot_step`]), T5b ([`best_forward_step`]) i T2 ([`ranged_target_cmb`]), bez
    /// zmian ich logiki (D-K5C-3); każdy krok to prawdziwy `_doMove` ([`Self::move_step_core`]: koszt, bród,
    /// `_updateFacing`, `Move`). Kolejność gałęzi jak w pinie:
    /// 1. KITE (`:6689-6722`): `primaryRanged && rangedKite !== false` i najbliższy wróg wręcz w `MELEE_SAFE_GAP`;
    ///    krok `_bestKiteShotStep`, potem strzał w `_rangedTargetInRange ?? meleeThreat` (w zasięgu) z nowego pola albo
    ///    koniec; bez kroku strzał z miejsca w `_rangedTargetInRange ?? nearest`.
    /// 2. STRZAŁ (`:6727-6731`): `1 <= dNear <= range` -> `_rangedTargetInRange ?? nearest`.
    /// 3. MARSZ `_rangedForwardStep` (`:6776-6809`): preludium `moveLeft <= 0` (`NaN` przechodzi jak w JS), cel
    ///    `_nearestEnemy`, w zasięgu = koniec, krok `_bestForwardStep`, bramka `lineAllowsRangedStep`, `_doMove`;
    ///    callback: wejście w zasięg = `_rangedAction` od nowa w tej samej chwili, `ru.moveLeft > 0` (dokładna negacja:
    ///    `<= 0 || NaN` kończy) = `_schedule(STEP_GAP_MS)` i kolejny krok.
    ///
    /// Strzał (`_doAttack` -> `_doRangedAttack`, `canShoot` prawdą w całej gałęzi) wykonuje `start`/`complete`; tu
    /// zwracany jest cel i chwila wystrzału. Czas: kroki `MOVE_STEP_MS` + `STEP_GAP_MS`, strzał `RANGED_FLY_MS +
    /// RANGED_GAP_MS` (`:9223`, `:9229`). Gałąź nie losuje (rzut zużywa wyłącznie `_singleBlow` trafienia).
    fn ranged_action(&mut self, unit: UnitRef, st: &TurnSeqState) -> RangedRun {
        let ix = side_ix(unit.side);
        let mounted = self.units[ix][unit.idx].activate.mounted;
        let range = self.units[ix][unit.idx].activate.range;
        let kite_on = self.units[ix][unit.idx].activate.primary_ranged
            && self.doctrine[ix][unit.idx].ranged_kite;
        let enemies = self.enemies_of(unit.side, st);
        let now0 = self.now;
        let mut elapsed = 0.0;
        let mut move_left = st.unit(unit).c.move_left;
        let mut moved = false;
        let dist = |a: (i64, i64), q: i64, r: i64| ((a.0 - q).abs() + (a.1 - r).abs()) as f64;
        let shot: Option<(usize, f64)> = 'ra: loop {
            // `_rangedAction` (`:6656-6662`): `finished`/`dead` odcina `start`; brak wroga = `done()`.
            let Some((ni, nq, nr)) = self.nearest_live_enemy(unit, st) else {
                break None;
            };
            let d_near = dist(self.cell_of(unit), nq, nr);
            // 1) KITE.
            if kite_on {
                let (units, me_ix) = self.kite_units(unit, st);
                let me = units[me_ix];
                if let Some(threat) = nearest_enemy_melee(&me, &units) {
                    let gap = (me.tile.0 - threat.tile.0).abs() + (me.tile.1 - threat.tile.1).abs();
                    if gap <= MELEE_SAFE_GAP {
                        // Indeks zagrożenia w liście strony przeciwnej (żywe jednostki stoją na różnych polach).
                        let threat_cell = int_tile(threat.tile);
                        let threat_ix = self
                            .live_enemy_cells(unit, st)
                            .into_iter()
                            .find(|(_, q, r)| (*q, *r) == threat_cell)
                            .map(|(i, _, _)| i);
                        let step = {
                            let terrain =
                                self.terrain.as_deref().expect("teren sprawdzony w start");
                            let occ = &self.occ_by_key;
                            let occupied = |c: f64, r: f64| occ.contains_key(&cell_key(c, r));
                            let passable =
                                |c: f64, r: f64| unit_move_cost(terrain, mounted, c, r).is_finite();
                            best_kite_shot_step(&me, threat.tile, &units, &occupied, &passable)
                        };
                        if let Some(key) = step {
                            let (ml, ms) = self.body_step(
                                unit,
                                key_tile(key),
                                move_left,
                                now0 + elapsed,
                                &enemies,
                            );
                            move_left = ml;
                            moved = true;
                            elapsed += ms;
                            // Callback (`:6704-6716`): `_rangedTargetInRange` z nowego pola, inaczej zagrożenie, jeśli
                            // nadal żywe i w zasięgu; inaczej koniec tury.
                            let tgt = self.ranged_target_now(unit, st).or_else(|| {
                                threat_ix.filter(|_| {
                                    dist(self.cell_of(unit), threat_cell.0, threat_cell.1) <= range
                                })
                            });
                            break 'ra tgt.map(|t| (t, elapsed));
                        }
                        // Przyparty (`:6719-6721`): strzał z miejsca.
                        let tgt = self.ranged_target_now(unit, st).unwrap_or(ni);
                        break 'ra Some((tgt, elapsed));
                    }
                }
            }
            // 2) STRZAŁ bez ruchu (`dNear >= 1 && dNear <= ru.range`).
            if d_near >= 1.0 && d_near <= range {
                let tgt = self.ranged_target_now(unit, st).unwrap_or(ni);
                break 'ra Some((tgt, elapsed));
            }
            // 3) `_rangedForwardStep` (`:6776-6809`).
            loop {
                if move_left <= 0.0 {
                    break 'ra None;
                }
                let Some((_, eq, er)) = self.nearest_live_enemy(unit, st) else {
                    break 'ra None;
                };
                if dist(self.cell_of(unit), eq, er) <= range {
                    break 'ra None;
                }
                let step = {
                    let terrain = self.terrain.as_deref().expect("teren sprawdzony w start");
                    let occ = &self.occ_by_key;
                    let occupied = |c: f64, r: f64| occ.contains_key(&cell_key(c, r));
                    let passable =
                        |c: f64, r: f64| unit_move_cost(terrain, mounted, c, r).is_finite();
                    let me = self.forward_unit(unit, st, move_left);
                    let same: Vec<ForwardUnit> = (0..self.units[ix].len())
                        .map(|i| {
                            self.forward_unit(
                                UnitRef {
                                    side: unit.side,
                                    idx: i,
                                },
                                st,
                                0.0,
                            )
                        })
                        .collect();
                    best_forward_step(&me, (eq as f64, er as f64), &same, &occupied, &passable)
                };
                let Some(key) = step else {
                    break 'ra None;
                };
                let tile = key_tile(key);
                if !self.ranged_line_allows_step(unit, st, tile.0) {
                    break 'ra None;
                }
                let (ml, ms) = self.body_step(unit, tile, move_left, now0 + elapsed, &enemies);
                move_left = ml;
                moved = true;
                elapsed += ms;
                // Callback `_doMove` (`:6800-6807`).
                let Some((_, eq, er)) = self.nearest_live_enemy(unit, st) else {
                    break 'ra None;
                };
                if dist(self.cell_of(unit), eq, er) <= range {
                    continue 'ra;
                }
                // `if (ru.moveLeft > 0) _schedule(...) else done()`: dokładna negacja (NaN kończy, lekcja r2).
                if move_left <= 0.0 || move_left.is_nan() {
                    break 'ra None;
                }
                elapsed += f64::from(STEP_GAP_MS);
            }
        };
        let dur = match shot {
            Some((_, at)) => at + RANGED_FLY_MS + RANGED_GAP_MS,
            None => elapsed,
        };
        RangedRun {
            dur,
            move_left: moved.then_some(move_left),
            shot,
        }
    }

    /// K5LOOP-CLOSE r3: wykonanie `_fallBackStep(ru, done)` (`battleScene.ts:7228-7243`) w ciele przez K5DOC-T7b
    /// ([`fall_back_step_decide`], [`fall_back_after_move`], bez zmian): krok `_bestFallBackStep` przez prawdziwy
    /// `_doMove`, callback `ru.moveLeft > 0` = `_schedule(STEP_GAP_MS)` i kolejny krok, inaczej koniec (NaN kończy po
    /// jednym kroku jak w JS; preludium `moveLeft <= 0` przepuszcza NaN). Odwrót nie losuje.
    fn fall_back(&mut self, unit: UnitRef, st: &TurnSeqState) -> (f64, Option<f64>) {
        let ix = side_ix(unit.side);
        let mounted = self.units[ix][unit.idx].activate.mounted;
        let enemies = self.enemies_of(unit.side, st);
        let now0 = self.now;
        let mut elapsed = 0.0;
        let mut move_left = st.unit(unit).c.move_left;
        let mut moved = false;
        loop {
            let decision = {
                let (mq, mr) = self.cell_of(unit);
                let mut cells: Vec<PathTile> = self
                    .live_enemy_cells(unit, st)
                    .into_iter()
                    .map(|(_, q, r)| (q as f64, r as f64))
                    .collect();
                // `_nearestEnemy` = pierwszy ściśle najbliższy: na początek listy (dla `dMin`, minimum po wszystkich
                // wrogach, kolejność reszty nie ma znaczenia).
                let mut nearest: Option<(usize, f64)> = None;
                for (k, t) in cells.iter().enumerate() {
                    let d = (mq as f64 - t.0).abs() + (mr as f64 - t.1).abs();
                    if nearest.is_none_or(|(_, bd)| d < bd) {
                        nearest = Some((k, d));
                    }
                }
                if let Some((k, _)) = nearest {
                    let n = cells.remove(k);
                    cells.insert(0, n);
                }
                let world = ProdFallBackWorld {
                    enemies: cells,
                    occ: &self.occ_by_key,
                    terrain: self.terrain.as_deref().expect("teren sprawdzony w start"),
                    mounted,
                };
                fall_back_step_decide(
                    &world,
                    false,
                    &FallBackUnit {
                        id: unit_tag(unit),
                        q: mq as f64,
                        r: mr as f64,
                        is_atk: unit.side == BattleSide::Attacker,
                        dead: false,
                        fading_out: false,
                        move_left,
                    },
                )
            };
            let FallBackDecision::Move { col, row } = decision else {
                break;
            };
            let (ml, ms) = self.body_step(
                unit,
                int_tile((col, row)),
                move_left,
                now0 + elapsed,
                &enemies,
            );
            move_left = ml;
            moved = true;
            elapsed += ms;
            match fall_back_after_move(false, move_left) {
                AfterStep::Done => break,
                AfterStep::Schedule { ms } => elapsed += f64::from(ms),
            }
        }
        (elapsed, moved.then_some(move_left))
    }

    /// K5LOOP-CLOSE r4: wykonanie `_fleeStep(ru, done)` (`battleScene.ts:9845-9897`) na stanie `st` (kopia stanu
    /// sterownika, patrz [`Self::flee_after`]). Każde wejście `_fleeStep` (także z `_schedule(STEP_GAP_MS)`):
    /// 1. preludium (`:9846-9848`): `finished`, `dead`/`fadingOut`/`removed` = koniec; `moveLeft <= 0` = koniec (`NaN`
    ///    przechodzi, jak w JS);
    /// 2. na krawędzi własnej strony (`:9853-9858`: atak `q <= 0`, obrona `q >= BF_COLS - 1`) = `_removeUnitFromScene` +
    ///    `_shakeAlliesOnLoss`, koniec;
    /// 3. pole docelowe (`:9862-9873`): kolumna `q + dir` (atak `-1`, obrona `+1`), wiersze `r + 0, +1, -1, +2, -2`,
    ///    pierwsze w planszy, wolne w `occByKey` i przejezdne dla jednostki (`_passableForUnit`);
    /// 4. brak pola (`:9874-9880`): `fleeStuck += 1`, przy `>= 2` zniknięcie z pola + ripple; koniec;
    /// 5. `fleeStuck = 0`, krok `_doMove` (koszt, bród, `_updateFacing`, `Move`), callback (`:9884-9896`): `finished` /
    ///    `removed` / `dead` = koniec; krawędź osiągnięta = zniknięcie + ripple; `ru.moveLeft > 0` (dokładna negacja:
    ///    `<= 0 || NaN` kończy) = `_schedule(STEP_GAP_MS)` i kolejne wejście; inaczej koniec.
    ///
    /// Zwraca czas (`MOVE_STEP_MS` na krok + `STEP_GAP_MS` na `_schedule`, nominalnie). Zniknięcie z pola i ripple mają
    /// chwilę końca ostatniego kroku. Ucieczka nie losuje.
    fn flee_run(&mut self, unit: UnitRef, st: &mut TurnSeqState) -> f64 {
        let ix = side_ix(unit.side);
        let mounted = self.units[ix][unit.idx].activate.mounted;
        let atk = unit.side == BattleSide::Attacker;
        let home_col = if atk { 0 } else { BF_COLS - 1 };
        let at_home = |q: i64| if atk { q <= home_col } else { q >= home_col };
        let dir: i64 = if atk { -1 } else { 1 };
        let enemies = self.enemies_of(unit.side, st);
        let now0 = self.now;
        let mut elapsed = 0.0;
        let mut move_left = st.unit(unit).c.move_left;
        let mut moved = false;
        loop {
            // Preludium `_fleeStep` (`:9846-9848`).
            let c = st.unit(unit).c;
            if st.finished || c.dead || c.fading_out || c.removed || move_left <= 0.0 {
                break;
            }
            let (q, r) = self.cell_of(unit);
            if at_home(q) {
                self.now = now0 + elapsed;
                self.leave_field(st, unit);
                break;
            }
            let nc = q + dir;
            let target = {
                let terrain = self
                    .terrain
                    .as_deref()
                    .expect("teren sprawdzony w start (ucieczka bez MoveTerrain ma jawny tag)");
                [0_i64, 1, -1, 2, -2].into_iter().find_map(|dr| {
                    let nr = r + dr;
                    if !(0..BF_COLS).contains(&nc) || !(0..BF_ROWS).contains(&nr) {
                        return None;
                    }
                    if self
                        .occ_by_key
                        .contains_key(&cell_key(nc as f64, nr as f64))
                    {
                        return None;
                    }
                    if !unit_move_cost(terrain, mounted, nc as f64, nr as f64).is_finite() {
                        return None;
                    }
                    Some((nc, nr))
                })
            };
            let Some(tile) = target else {
                // Zablokowany (`:9874-9880`): po dwóch turach z rzędu znika z pola, żeby nie zamarzał.
                let stuck = &mut self.flee_stuck[ix][unit.idx];
                *stuck += 1.0;
                if *stuck >= 2.0 {
                    self.now = now0 + elapsed;
                    self.leave_field(st, unit);
                }
                break;
            };
            self.flee_stuck[ix][unit.idx] = 0.0;
            let (ml, ms) = self.body_step(unit, tile, move_left, now0 + elapsed, &enemies);
            move_left = ml;
            moved = true;
            elapsed += ms;
            // Callback `_doMove` (`:9884-9896`).
            let c = st.unit(unit).c;
            if st.finished || c.removed || c.dead {
                break;
            }
            if at_home(self.cell_of(unit).0) {
                self.now = now0 + elapsed;
                self.leave_field(st, unit);
                break;
            }
            // `if (ru.moveLeft > 0) _schedule(...) else done()`: dokładna negacja (NaN kończy, lekcja r2).
            if move_left <= 0.0 || move_left.is_nan() {
                break;
            }
            elapsed += f64::from(STEP_GAP_MS);
        }
        self.now = now0;
        if moved {
            unit_cu_mut(st, unit).move_left = move_left;
        }
        elapsed
    }

    /// `_removeUnitFromScene(ru)` + `_shakeAlliesOnLoss(ru)` z `_fleeStep` (`:9855-9856`, `:9878`, `:9890-9891`).
    fn leave_field(&mut self, st: &mut TurnSeqState, unit: UnitRef) {
        self.remove_unit_from_scene(st, unit);
        self.shake_allies_on_loss(st, unit);
    }

    /// `_removeUnitFromScene(ru)` (`battleScene.ts:9910-9925`) dla uciekającej jednostki: idempotentne (`removed`),
    /// `removed = dead = true`, `fadingOut = false`, zwolnienie pola `occByKey.delete(cellKey(ru.q, ru.r))` (`:9915`, bez
    /// sprawdzania właściciela, jak w pinie), odpięcie modelu i paska ([`BattleAction::Leave`]).
    fn remove_unit_from_scene(&mut self, st: &mut TurnSeqState, unit: UnitRef) {
        {
            let c = unit_cu_mut(st, unit);
            if c.removed {
                return;
            }
            c.removed = true;
            c.dead = true;
            c.fading_out = false;
        }
        self.release_tile(unit);
        self.emit(BattleAction::Leave { unit });
    }

    /// `_shakeAlliesOnLoss(fallen)` (`battleScene.ts:9743-9754`): każdy żywy, nieznikający, nieuciekający sojusznik (bez
    /// samego `fallen`) w promieniu [`MORALE_DEATH_RADIUS`] (Manhattan od pola `fallen`) traci
    /// [`MORALE_ALLY_DEATH_LOSS`] morale (`Math.max(0, ...)`), pasek ([`BattleAction::Shaken`]) i `_checkRout` (rout
    /// może kaskadować); na końcu `_checkMeleeScreenLost(fallen.side)`, gdy `fallen` nie jest `primaryRanged`.
    fn shake_allies_on_loss(&mut self, st: &mut TurnSeqState, fallen: UnitRef) {
        let (fq, fr) = self.cell_of(fallen);
        let side = fallen.side;
        for idx in 0..self.units[side_ix(side)].len() {
            let a = UnitRef { side, idx };
            if a == fallen {
                continue;
            }
            let c = st.unit(a).c;
            if c.dead || c.fading_out || c.routed {
                continue;
            }
            let (aq, ar) = self.cell_of(a);
            if (aq - fq).abs() + (ar - fr).abs() > MORALE_DEATH_RADIUS {
                continue;
            }
            let morale = {
                let ac = unit_cu_mut(st, a);
                ac.morale = js_max0(ac.morale - MORALE_ALLY_DEATH_LOSS);
                ac.morale
            };
            self.emit(BattleAction::Shaken {
                unit: a,
                fallen,
                morale,
            });
            self.check_rout(st, a);
        }
        if !self.units[side_ix(side)][fallen.idx]
            .activate
            .primary_ranged
        {
            self.check_melee_screen_lost(st, side);
        }
    }

    /// K5LOOP-CLOSE r3: wykonanie `_phalanxAction(ru, done)` (`battleScene.ts:6546-6578`) w ciele przez K5DOC-T7a
    /// ([`phalanx_action_decide`], bez zmian): sąsiad (`_targetInRange`) = cios wspólną ścieżką, samotna falanga =
    /// `_advanceStep`, wyprzedzenie linii = `done()`, krok `_phalanxStep` = jeden prawdziwy `_doMove` i `done()`
    /// (`:6635`, bez `_schedule`). Falanga nie losuje poza ciosem.
    fn phalanx_action(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
        melee_target: Option<usize>,
    ) -> PhalanxRun {
        let ix = side_ix(unit.side);
        let mounted = self.units[ix][unit.idx].activate.mounted;
        let move_left = st.unit(unit).c.move_left;
        let side_units: Vec<PhalanxUnit> = self.units[ix]
            .iter()
            .enumerate()
            .map(|(i, pu)| {
                let r = UnitRef {
                    side: unit.side,
                    idx: i,
                };
                let c = st.unit(r).c;
                PhalanxUnit {
                    id: unit_tag(r),
                    atk: unit.side == BattleSide::Attacker,
                    q: pu.activate.q as f64,
                    r: pu.activate.r as f64,
                    dead: c.dead,
                    fading_out: c.fading_out,
                    routed: c.routed,
                    phalanx: pu.activate.phalanx,
                    move_left: c.move_left,
                }
            })
            .collect();
        let other = opposite(unit.side);
        let enemies: Vec<PhalanxEnemy> = self
            .live_enemy_cells(unit, st)
            .into_iter()
            .map(|(i, q, r)| PhalanxEnemy {
                id: unit_tag(UnitRef {
                    side: other,
                    idx: i,
                }),
                q: q as f64,
                r: r as f64,
                primary_ranged: self.units[side_ix(other)][i].activate.primary_ranged,
            })
            .collect();
        let decision = {
            let world = ProdPhalanxWorld {
                melee_target,
                enemies,
                occ: &self.occ_by_key,
                terrain: self.terrain.as_deref().expect("teren sprawdzony w start"),
                mounted,
            };
            phalanx_action_decide(&world, false, &side_units[unit.idx], &side_units)
        };
        match decision {
            PhalanxDecision::Done => PhalanxRun::Finished(0.0, None),
            PhalanxDecision::Attack { target_id } => {
                PhalanxRun::Attack(target_id.parse().expect("indeks celu z melee_target"))
            }
            PhalanxDecision::AdvanceStep => PhalanxRun::Advance,
            PhalanxDecision::Move { col, row } => {
                let enemies = self.enemies_of(unit.side, st);
                let now = self.now;
                let (ml, ms) = self.body_step(unit, int_tile((col, row)), move_left, now, &enemies);
                PhalanxRun::Finished(ms, Some(ml))
            }
        }
    }

    /// K5LOOP-CLOSE r3/r4: wystrzał `_doRangedAttack` (`battleScene.ts:9179-9222`) w chwili `self.now + at`: zwrot strzelca
    /// ku polu celu (`facingFromTo`, `:9182-9184`, zawsze `rotation.y`), potem pocisk (`:9218-9221`) z trafieniem po
    /// `RANGED_FLY_MS`. Brak szablonu strzału na cel (wejście adaptera [`Self::ranged_blows`]) = jawny tag
    /// `strzal-bez-szablonu` i brak strzału.
    fn begin_shot(&mut self, unit: UnitRef, target: usize, at: f64) -> Option<ProdShot> {
        let ix = side_ix(unit.side);
        if self.blow_composer.is_none() && !self.ranged_blows[ix][unit.idx].contains_key(&target) {
            self.unported.push((unit, "strzal-bez-szablonu"));
            return None;
        }
        let t_shot = self.now + at;
        let tref = UnitRef {
            side: opposite(unit.side),
            idx: target,
        };
        let (aq, ar) = self.cell_of(unit);
        let (dq, dr) = self.cell_of(tref);
        let dir = facing_toward(
            &JsVal::Num((dq - aq) as f64),
            &JsVal::Num((dr - ar) as f64),
            &JsVal::Num(self.facing[ix][unit.idx]),
        )
        .to_number();
        let saved = self.now;
        self.now = t_shot;
        self.set_facing(unit, dir);
        self.emit(BattleAction::Facing { unit, dir });
        self.emit(BattleAction::Shot {
            attacker: unit,
            target: tref,
            land_at: t_shot + RANGED_FLY_MS,
        });
        self.now = saved;
        Some(ProdShot {
            target,
            hit_at: t_shot + RANGED_FLY_MS,
        })
    }

    /// K5LOOP-CLOSE r3: trafienie strzału (`_doRangedAttack` callback `:9223-9228`): amunicja (`ammoLeft -= 1` przy
    /// wartości skończonej, `:9191-9192`, `canShoot` przeliczone), `_singleBlow(attacker, defender, true)` (jeden
    /// rzut, łuk względem facing celu, skutki `_resolveBlowOutcome`; strzał nie dodaje pary do `engaged` i nie ma
    /// kontrataku), etykieta obrażeń `if (dmg > 0 && !defender.dead && !defender.fadingOut)` (`:9225-9227`). Akcje
    /// trafienia mają czas `hit_at`.
    fn complete_shot(&mut self, st: &mut TurnSeqState, unit: UnitRef, shot: ProdShot) {
        let ix = side_ix(unit.side);
        {
            let a = &mut self.ammo_left[ix][unit.idx];
            if a.is_finite() {
                *a -= 1.0;
            }
            let can = self.ranged_base[ix][unit.idx] && *a > 0.0;
            self.units[ix][unit.idx].activate.can_shoot = can;
        }
        let tref = UnitRef {
            side: opposite(unit.side),
            idx: shot.target,
        };
        let Some(input) = self.composed_or(
            true,
            self.ranged_blows[ix][unit.idx].get(&shot.target).cloned(),
        ) else {
            return;
        };
        let saved = self.now;
        self.now = shot.hit_at;
        let rec = self.strike(st, unit, tref, input, false);
        let tc = st.unit(tref).c;
        if rec.dmg > 0.0 && !tc.dead && !tc.fading_out {
            self.emit(BattleAction::Damage {
                target: tref,
                dmg: rec.dmg,
            });
        }
        self.blows.push(rec);
        self.now = saved;
    }
}

impl<R: RollSource> LoopBody for ProdBody<R> {
    fn tower_blow(&mut self, tmpl: &FullBlowInput, target: usize, st: &mut TurnSeqState) {
        let tref = UnitRef {
            side: BattleSide::Attacker,
            idx: target,
        };
        let max_hp = tmpl.defender_state.max_hp;
        if self.tower_outcome_effects {
            self.tower_blow_full(tmpl, tref, st);
            return;
        }
        let out = tower_blow_on_target(tmpl, st, target, &mut self.rolls);
        if out.blow.outcome != Outcome::None {
            self.unported
                .push((tref, "wieza-resolveBlowOutcome-efekty"));
        }
        // P4-1I3: wywołania sceny `_singleBlow(shooter, target, true)` (`:4264`) i etykieta (`:4265`). Skutki
        // `_resolveBlowOutcome` poza zabiciem są nieportowane (wpis wyżej): emitowane jest tylko to, co odpowiada
        // stanowi silnika — log ciosu, przy zabiciu log `wyeliminowany` i `Kill`, wpis `_pushClash` i etykieta.
        let shooter = tower_shooter_name(&self.tower_shooter_nazwa);
        let tname = self.name_of(tref);
        self.emit_blow_log(&shooter, &tname, tmpl.hit_arc, &out, max_hp);
        if out.blow.missed {
            return;
        }
        let killed = out.blow.outcome == Outcome::Kill;
        if killed {
            self.emit(BattleAction::Log {
                text: eliminated_log(&tname),
            });
            self.emit(BattleAction::Kill { unit: tref });
        }
        let tag = match out.blow.outcome {
            Outcome::Kill => ClashTag::Padl,
            Outcome::RoutBeforeDeath => ClashTag::Rout,
            Outcome::MoraleOnly | Outcome::None => {
                if st.unit(tref).c.routed {
                    ClashTag::Rout
                } else {
                    ClashTag::Plain
                }
            }
        };
        let row = self.tower_row;
        self.emit_clash(
            Actor::Tower(row),
            &shooter,
            BattleSide::Defender,
            tref,
            out.blow.dmg,
            tag,
        );
        let tc = st.unit(tref).c;
        if out.blow.dmg > 0.0 && !tc.dead && !tc.fading_out {
            self.emit(BattleAction::Damage {
                target: tref,
                dmg: out.blow.dmg,
            });
        }
    }
    fn set_now(&mut self, v_now: f64) {
        self.now = v_now;
        self.call_now = v_now;
    }
    fn set_tower_row(&mut self, row: i64) {
        self.tower_row = row;
    }
    fn set_ff_active(&mut self, ff_active: bool) {
        self.ff_active = ff_active;
    }
    fn take_actions(&mut self) -> Vec<TimedAction> {
        std::mem::take(&mut self.actions)
    }
    fn unit_name(&self, unit: UnitRef) -> String {
        self.name_of(unit)
    }
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        let pu = self.units[side_ix(unit.side)].get(unit.idx)?;
        Some((pu.activate.q, pu.activate.r))
    }
    fn unit_cell_at(&self, unit: UnitRef, v_now: f64) -> Option<(i64, i64)> {
        // Obrona r2 (E2-1b): krok o `t0 > v_now` jeszcze się nie zaczął; pozycja = `from` pierwszego takiego kroku.
        // Tylko w modelu czasu pinu ([`Self::pin_blow_timing`]); dawne wektory pętli liczą pozycje końcowe.
        if self.pin_blow_timing {
            // PIN3-DIVERGENCE-Q1 (D-PIN3-2): krok z `t0 == v_now` z kolejki `_raf` jeszcze się nie zaczął ([`timeline_done`]).
            if let Some(&(_, _, from, _, _)) = self
                .move_timeline
                .iter()
                .find(|(u, t0, _, _, synchr)| *u == unit && !timeline_done(*t0, *synchr, v_now))
            {
                return Some(from);
            }
        }
        self.unit_cell(unit)
    }
    fn take_timers(&mut self) -> Vec<(f64, u64)> {
        std::mem::take(&mut self.timers)
    }
    fn fire_timer(&mut self, id: u64, st: &mut TurnSeqState) {
        let Some(k) = self.boulders.iter().position(|b| b.0 == id) else {
            return;
        };
        let (_, unit, row, dmg) = self.boulders.remove(k);
        self.boulder_hit(st, unit, row, dmg);
    }
    fn wall_ever_breached(&self) -> bool {
        self.wall_ever_breached
    }
    fn on_tower_destroyed(&mut self, row: i64) {
        // `_destroyTowerAtRow` (`:4195`): pierwsza niezburzona wieża wiersza.
        if let Some(t) = self
            .siege_towers
            .iter_mut()
            .find(|t| t.row == row as f64 && !t.destroyed)
        {
            t.destroyed = true;
        }
    }

    fn start(&mut self, unit: UnitRef, st: &TurnSeqState) -> f64 {
        let ix = side_ix(unit.side);
        self.pending[ix][unit.idx] = None;
        // Obrona r2 (E2-1b): oś kroków poprzednich aktywacji jest już w całości przeszła (`t0 <= now`).
        let now = self.now;
        self.move_timeline.retain(|(_, t0, _, _, _)| *t0 > now);
        // PIN3-DIVERGENCE-Q1 (D-PIN3-1): oś zwrotów jak oś kroków — przeszłe wpisy są już w `facing`.
        self.facing_timeline.retain(|(_, t0, _, _, _)| *t0 > now);
        let seq = st.unit(unit).c;
        // K5LOOP-SIEGE-ATK-B: wejścia bramki `_doMove` (`:8689`) dla kroków tej aktywacji ([`Self::move_step_core`]).
        self.seq_wall_col = self.scene.wall_col.max(st.siege_wall_col);
        self.mover_routed = seq.routed;
        self.pending_gate_breach = false;
        // Pin (`_activateUnit`, battleScene.ts:6049-6050): `finished` albo martwa / znikająca jednostka kończy od razu
        // (`done()`), PRZED jakąkolwiek inną gałęzią.
        if st.finished || seq.dead || seq.fading_out {
            self.trace.push((unit, vec![ActivateEvent::Done]));
            return 0.0;
        }
        // Uciekająca jednostka (`if (ru.routed) { this._fleeStep(ru, done); return; }`, battleScene.ts:6055) nigdy nie
        // atakuje; gałąź działa przed trybem ręcznym i doktryną. K5LOOP-CLOSE r4: `_fleeStep` (`:9845-9897`) jest
        // WYKONYWANY ([`Self::flee_run`]). Bez [`MoveTerrain`] (D1 K5DOC-T4e-0) zostaje jawny tag `ucieczka-routed` i
        // brak akcji. K5LOOP-TAGS-REST: przy murze ucieczka też jest wykonywana (dawny tag `ucieczka-oblezenie`): każdy
        // krok przechodzi przez bramkę `_doMove` `siegeWallCol >= 0 && _siegeMoveRefused` (`:8689`,
        // [`Self::move_step_core`]), a `_siegeApproachRestricted` (`:7953`) zwraca `false` dla `ru.routed`
        // ([`Self::mover_routed`] = `true` tutaj), więc rozbita jednostka nigdy nie dostaje odmowy (jak w pinie).
        if seq.routed {
            self.trace.push((unit, vec![ActivateEvent::Flee]));
            if self.terrain.is_none() {
                self.unported.push((unit, "ucieczka-routed"));
                return 0.0;
            }
            let mut st2 = st.clone();
            let dur = self.flee_run(unit, &mut st2);
            self.flee_after = Some(ProdFleeAfter {
                unit,
                before_atk: st.atk.clone(),
                before_def: st.def.clone(),
                atk: st2.atk,
                def: st2.def,
            });
            self.pending[ix][unit.idx] = Some(ProdPending {
                morale: seq.morale,
                // Nieczytane (obrona PIN2-PROBE-Q1, N1): `complete` z `flee` wraca przed logiką D-PIN2-1; pole tylko
                // dla kompletności struktury (mutant E4 = równoważny).
                morale_before: seq.morale,
                start_rout: false,
                surround_applied: self.surround[ix][unit.idx],
                attack: None,
                move_left: None,
                shot: None,
                flee: true,
                gate_breach: false,
            });
            return dur;
        }
        // Obrona r2 (E2-1a): `_applyTerrainRange(ru)` na początku aktywacji (`_activateUnit` `:6064`), po strażach
        // `finished`/`dead`/`routed`, PRZED każdą gałęzią czytającą `ru.range` (cele, strzelec, marsz).
        self.refresh_terrain_range(unit.side, unit.idx);
        let pu = self.units[ix][unit.idx].clone();
        // Gałęzie spoza zakresu sprawdzane PRZED maszyną (żeby maszyna nie wybrała ścieżki strzelca/doktryny).
        // K5LOOP-SIEGE-DEF (T1): przy murze ciało wykonuje stronę `def` (`_activateUnit` `:6087`, `:6129-6172`,
        // `:6225-6236`: obrońca nie ma doktryny, trzyma mur, strzela/bije z miejsca). K5LOOP-SIEGE-ATK-A (T2a): strona
        // `atk` przy murze przechodzi przez maszynę; ciało wykonuje wejście na mur od wieży, marsz piechoty pod wieżę,
        // taran/wieżę (`_siegeRamTowerStep`) i marsz `_advanceToward` (`:6179-6220`); pozostałe gałęzie atakującego przy
        // murze (atak bramy, ostrzał muru, doktryna, cios, strzelec, jazda, falanga, krok) to jawne tagi po maszynie
        // (T2b/T4). Mur sceny maszyny (`scene.wall_col`) i mur sekwencji (`st.siege_wall_col`) to jedna wartość pinu
        // (`this.siegeWallCol`): dwie różne nieujemne wartości = błąd wejścia, jawny tag `oblezenie-mur-niespojny`.
        let siege = self.scene.wall_col >= 0 || st.siege_wall_col >= 0;
        let siege_atk = siege && unit.side == BattleSide::Attacker;
        let wall_col = self.scene.wall_col.max(st.siege_wall_col);
        let out_of_scope = if self.scene.manual_mode {
            Some("tryb-reczny")
        } else if self.scene.wall_col >= 0
            && st.siege_wall_col >= 0
            && self.scene.wall_col != st.siege_wall_col
        {
            Some("oblezenie-mur-niespojny")
        } else {
            None
        };
        if let Some(tag) = out_of_scope {
            self.unported.push((unit, tag));
            return 0.0;
        }

        let mut au = pu.activate.clone();
        au.dead = seq.dead;
        au.fading_out = seq.fading_out;
        au.routed = seq.routed;
        au.morale = seq.morale;
        au.flee_morale = seq.flee_morale;
        au.never_rout = seq.never_rout;
        // K5LOOP-WIRING-A r2 (Z4a, D-WIRA-10): `_checkRout` na starcie aktywacji czyta teren BIEŻĄCEGO kafla
        // (`combatTerrainName(ru.q, ru.r)`, `:9790-9792`).
        au.terrain_defence_mult = self.current_tdm(unit);
        au.surround_applied = self.surround[ix][unit.idx];
        // K5DOC-T8: `meta.doctrine !== 'manual'` (`battleScene.ts:6096`) czyta `_effectiveMetaForUnit(ru).doctrine` =
        // `_getEffectiveDoctrine(ru)` (`:17634`, `:17612-17619`) ze stanu doktryny ciała; flaga wejścia adaptera jest
        // nadpisywana. `_isUnitDoctrineAuto(ru)` (`:17621-17630`) zostaje wejściem adaptera (`activate.doctrine_auto`,
        // port: [`crate::domain::siege_tactics_doctrine_step::is_unit_doctrine_auto`]).
        let doctrine_now = self.effective_doctrine_of(unit);
        au.doctrine_manual = doctrine_now == GroupDoctrine::Manual;

        let enemies = self.enemies_of(unit.side, st);
        let scene = ActivateScene {
            finished: st.finished,
            // K5LOOP-SIEGE-DEF: `this.siegeWallCol` (spójność sprawdzona wyżej; `-1` bez muru).
            wall_col,
            // K5LOOP-SIEGE-ATK-A: `_siegeMachineRange(ru)` (`:7530-7534`) tej jednostki, gdy adapter go podał.
            siege_machine_range: self.siege_machine_range[ix][unit.idx]
                .unwrap_or(self.scene.siege_machine_range),
            ..self.scene.clone()
        };
        // `_targetInRange` czyta `_enemiesOf`: cel martwy / znikający / uciekający nie jest celem (battleScene.ts:8291-8294).
        // K5LOOP-CLOSE r4: strzelec z amunicją i `shootingEnabled = false` (`canShoot && !shootingEnabled`, `:6241` nie
        // wchodzi) idzie ścieżkami wręcz, ale `_targetInRange` (`:8373-8410`) liczy wtedy zasięg STRZAŁU (`canShoot`,
        // `:8376-8380`: `1 <= dd <= ru.range`) z kierunkiem natarcia (`:8402-8407`) i `lowestHp`: cel liczy ciało
        // (K5DOC-T2 [`target_in_range_cmb`], bez zmian), nie adapter. Pozostałe jednostki: wejście adaptera jak dotąd.
        // K5LOOP-SIEGE-DEF (T1): obrońca w oblężeniu (maszyna: tylko gałęzie U7.1 `onWallWalkway` i U7.4 HOLD, obie
        // kończą aktywację) liczy cel w ciele z bieżących pozycji: strzelec `_rangedTargetInRange` (`:7041-7053`),
        // wręcz `_targetInRange` (`:8373-8410`) z filtrem `_meleeBlockedByWall` (`:8361-8371`, mur i wyłom).
        // K5LOOP-SIEGE-ATK-A: atakujący przy murze liczy cele tym samym kodem (pin `_rangedTargetInRange` /
        // `_targetInRange` z `_meleeBlockedByWall` są wspólne dla stron); maszyna czyta je dla atakującego tylko w gałęzi
        // `onWallWalkway` (U7.1: cios/strzał albo trzymanie korony) i w gałęziach wręcz U7.6/U7.9 (tag `oblezenie`).
        let siege_targets = siege;
        let ranged_target = if siege_targets && pu.activate.can_shoot {
            self.ranged_target_in_range_js(unit, st)
        } else {
            None
        };
        // Atakujący strzelec przy murze (`shootingEnabled = false` albo `primaryRanged` w U7.6) czyta `_targetInRange` z
        // zasięgiem strzału (`:8376-8380`): też liczone w ciele.
        let melee_target = if siege_targets && (!pu.activate.can_shoot || siege_atk) {
            let me = self.combatant(unit, st);
            let en = self.combatants(opposite(unit.side), st);
            target_in_range_cmb(
                &me,
                &en,
                &TargetScene {
                    siege_wall_col: wall_col,
                    wall_ever_breached: self.wall_ever_breached,
                },
            )
        } else if siege_targets {
            // Strzelec obrońcy przy murze nie woła `_targetInRange` (U7.1/U7.4 czytają `_rangedTargetInRange`).
            None
        } else if pu.activate.can_shoot {
            let me = self.combatant(unit, st);
            let en = self.combatants(opposite(unit.side), st);
            target_in_range_cmb(
                &me,
                &en,
                &TargetScene {
                    siege_wall_col: -1,
                    wall_ever_breached: false,
                },
            )
        } else {
            pu.melee_target.filter(|t| {
                enemies
                    .get(*t)
                    .is_some_and(|e| !e.dead && !e.fading_out && !e.routed)
            })
        };
        // K5LOOP-CLOSE r3: `_advanceCoord(ru)` i `_nearestEnemy(ru)` dla gałęzi `primaryRanged` bez amunicji (U7.6).
        let advance_coord = if pu.activate.side_atk {
            pu.activate.q as f64
        } else {
            -(pu.activate.q as f64)
        };
        let mut nearest: Option<(i64, i64)> = None;
        let mut best_d = i64::MAX;
        for e in enemies
            .iter()
            .filter(|e| !e.dead && !e.fading_out && !e.routed)
        {
            let d = (pu.activate.q - e.q).abs() + (pu.activate.r - e.r).abs();
            if d < best_d {
                best_d = d;
                nearest = Some((e.q, e.r));
            }
        }
        // K5DOC-T8: krok doktryny liczony przed maszyną z tego samego stanu (`_applyTerrainRange` w ciele jest
        // tożsamością, a reset `playerOrder` nie zmienia wejść kroku); wykonywany tylko, gdy maszyna go wywoła.
        let doctrine_plan = au
            .doctrine_auto
            .then(|| self.plan_doctrine_step(unit, st, doctrine_now));
        // K5LOOP-SIEGE-ATK-A: decyzje `_trySiegeTowerClimb` / `_siegeInfantryToTowerStep` / `_siegeRamTowerStep` z
        // pozycji na starcie aktywacji (wartości zwracane maszynie; treść wykonywana po maszynie).
        let atk_plan = siege_atk.then(|| self.siege_atk_plan(unit, wall_col));
        let mut ops = ProdOps {
            melee_target,
            ranged_target,
            advance_coord,
            nearest,
            doctrine_returns: doctrine_plan.is_some_and(|p| p.returns),
            tower_climb: atk_plan.as_ref().is_some_and(|p| p.climb),
            infantry_to_tower: atk_plan
                .as_ref()
                .is_some_and(|p| p.infantry_missing || p.infantry != InfantryPlan::NotHandled),
            ram_tower_step: atk_plan
                .as_ref()
                .is_some_and(|p| p.ram_missing || p.ram != RamTowerPlan::NotHandled),
        };
        let res = activate_unit(&mut au, &scene, &enemies, &mut ops);
        self.trace.push((unit, res.events.clone()));
        // K5LOOP-CLOSE r3 (D-K5C-4): `ru.dryCol` i `ru.heldAfterFallback` (U7.6, `:6250-6266`) trwają między aktywacjami;
        // jedynym źródłem prawdy jest `ProdUnit::activate`.
        {
            let a = &mut self.units[ix][unit.idx].activate;
            a.dry_col = au.dry_col;
            a.held_after_fallback = au.held_after_fallback;
        }

        // Efekty stanu aktywacji (morale z okrążenia, rout, flaga jednorazowa) zapisują się ZAWSZE, także gdy dalsza
        // gałąź jest nieportowana: pin stosuje je na początku `_activateUnit`, przed wyborem akcji.
        let mut pend = ProdPending {
            morale: au.morale,
            morale_before: st.unit(unit).c.morale,
            start_rout: res.events.contains(&ActivateEvent::StartRout),
            surround_applied: au.surround_applied,
            attack: None,
            move_left: None,
            shot: None,
            flee: false,
            gate_breach: false,
        };
        let mut skipped: Vec<&'static str> = Vec::new();
        let mut advance = false;
        let mut cavalry = false;
        let mut ranged = false;
        let mut fallback = false;
        let mut phalanx = false;
        let mut flee = false;
        let mut doctrine = false;
        // K5LOOP-SIEGE-ATK-A: `_advanceToward(ru, approachCol, bestRow, done)` katapulty atakującego (`:6214-6216`).
        let mut toward: Option<(i64, i64)> = None;
        // K5LOOP-SIEGE-ATK-B: `_attackWallTile(ru, bestRow, done)` katapulty atakującego w zasięgu muru (`:6209-6212`).
        let mut wall_shot: Option<i64> = None;
        for ev in res.events.iter().copied() {
            match ev {
                ActivateEvent::Done
                | ActivateEvent::ApplyTerrainRange
                | ActivateEvent::PerformPlayerOrder
                | ActivateEvent::ResetPlayerOrder
                | ActivateEvent::UpdateMoraleBar
                | ActivateEvent::StartRout => {}
                ActivateEvent::UpdateFacing => self.update_facing(unit, &enemies),
                // Wywołania wież i taranu są w pinie bezczynne bez muru (`siegeWallCol < 0` -> `return false`,
                // battleScene.ts:8023, :8057, :8088) i dla obrońcy (`ru.side !== 'atk'` -> `return false`, `:8057`,
                // `:8088`; `_siegeRamTowerStep` woła tylko gałąź `isSiegeUnit && side === 'atk'`, `:6187`).
                // K5LOOP-SIEGE-ATK-A: dla atakującego przy murze treść wykonuje ciało po maszynie, gdy wywołanie
                // zwróciło `true` (gałąź `U7.2-climb`, `U7.2-inf`, `U7.3-ramtower`).
                ActivateEvent::TowerClimb
                | ActivateEvent::InfantryToTower
                | ActivateEvent::RamTowerStep => {}
                // K5LOOP-SIEGE-ATK-A: marsz katapulty pod mur (maszyna emituje go tylko dla atakującego przy murze).
                ActivateEvent::AdvanceToward { col, row } if siege_atk => toward = Some((col, row)),
                // K5LOOP-SIEGE-ATK-B: ostrzał kafla muru (maszyna emituje go tylko w gałęzi katapulty atakującego przy
                // murze, `:6187-6212`); poza nią jawny tag `atak-muru-poza-oblezeniem` (ramię `other`).
                ActivateEvent::AttackWallTile { row } if siege_atk => wall_shot = Some(row),
                // Obrona r1 (zarzut 3 Evaluatora): poza atakującym przy murze zdarzenie jest strukturalnie nieosiągalne
                // (maszyna emituje je tylko w gałęzi `isSiegeUnit && side === 'atk' && siegeWallCol >= 0`, `:6187`);
                // gdyby jednak padło, jawny tag `marsz-poza-oblezeniem` (ramię `other` -> [`prod_tag`]), nie ciche
                // pominięcie.
                ActivateEvent::Attack { target } => pend.attack = Some(target),
                // K5LOOP-CLOSE: `_advanceStep(ru, done)` (`battleScene.ts:6298`, cialo `:8198-8285`).
                ActivateEvent::AdvanceStep => advance = true,
                // K5LOOP-CLOSE r2: `_cavalryAction(ru, done)` (`battleScene.ts:6284`, ciało `:6372-6412`).
                ActivateEvent::CavalryAction => cavalry = true,
                // K5LOOP-CLOSE r3: `_rangedAction` (`:6241`, ciało `:6656-6741`), `_fallBackStep` (`:6272`, `:7228-7243`),
                // `_phalanxAction` (`:6290`, `:6546-6578`).
                ActivateEvent::RangedAction => ranged = true,
                ActivateEvent::FallBackStep => fallback = true,
                ActivateEvent::PhalanxAction => phalanx = true,
                // K5LOOP-CLOSE r4: rout z okrążenia (`:6116-6117`: `_checkRout` -> `_startRout`, potem `_fleeStep`).
                // Bez [`MoveTerrain`] (D1) zostaje tag `ucieczka-routed` jak dotąd (rout wykonuje wtedy `complete`).
                // K5LOOP-SIEGE-DEF: rout z okrążenia obrońcy przy murze. `_fleeStep` -> `_doMove` czyta
                // `_siegeMoveRefused` (`:8689`), nieportowane w ciele: jawny tag (efekty stanu aktywacji, w tym
                // `_startRout`, zapisują się w `complete`). Precedencja tagów TAKA SAMA jak w gałęzi `routed` w
                // [`LoopBody::start`]: najpierw brak [`MoveTerrain`] (`ucieczka-routed`, ramię `other` niżej), potem mur
                // (`ucieczka-oblezenie`), dopiero potem wykonanie `_fleeStep`.
                // K5LOOP-TAGS-REST: przy murze także (dawny tag `ucieczka-oblezenie`); bramka muru `_doMove` w
                // [`Self::move_step_core`] czyta `ru.routed` po `_startRout` (patrz `mover_routed` niżej).
                ActivateEvent::Flee if self.terrain.is_some() => flee = true,
                // K5DOC-T8: `_executeGroupDoctrineStep(ru, meta, done)` (`battleScene.ts:6097`, ciało `:17966-18084`).
                ActivateEvent::DoctrineStep => doctrine = res.branches.contains(&"U7.0-doctrine"),
                other => skipped.push(prod_tag(other)),
            }
        }
        // K5LOOP-SIEGE-ATK-B (T2b): gałęzie atakującego przy murze (cios `_doAttack` z U7.1/U7.6/U7.9, krok doktryny,
        // `_rangedAction`, `_fallBackStep`, `_cavalryAction`, `_phalanxAction`, `_advanceStep`) wykonuje ciało tymi samymi
        // klockami co bez muru: każdy `_doMove` przechodzi przez bramkę `_siegeMoveRefused` (`:8689`,
        // [`Self::move_step_core`]), a testy zasięgu ataku `_canAttackFrom` / `_makeCanAttackFromTest` /
        // `_canStrikeTargetFrom` (`:8436-8493`) filtrują `_meleeBlockedByWall` ([`Self::melee_blocked_for`]). Dawny tag
        // `oblezenie` zdjęty.
        // K5LOOP-CLOSE r4: okrążenie złamało jednostkę w tej aktywacji. Pin: `ru.morale` po trafieniu okrążenia,
        // `_checkRout` -> `_startRout` (`:9799-9831`: osłona wręcz, boost wrogów, zwolnienie pola, zwrot ku krawędzi) w
        // chwili aktywacji, potem `_fleeStep` (`:6117`). Ciało wykonuje to na kopii stanu w tej samej kolejności (rout PRZED
        // ruchem ucieczki, bo `_fleeStep` czyta zwolnione pola i facing po `_startRout`); `complete` przepisuje kopię.
        if flee && skipped.is_empty() {
            let mut st2 = st.clone();
            unit_cu_mut(&mut st2, unit).morale = au.morale;
            if pend.start_rout {
                self.start_rout(&mut st2, unit);
            }
            // `_siegeApproachRestricted` (`:7953`) czyta `ru.routed` w chwili kroku, czyli PO `_startRout` (`:6116`).
            self.mover_routed = st2.unit(unit).c.routed;
            let dur = self.flee_run(unit, &mut st2);
            self.flee_after = Some(ProdFleeAfter {
                unit,
                before_atk: st.atk.clone(),
                before_def: st.def.clone(),
                atk: st2.atk,
                def: st2.def,
            });
            pend.start_rout = false;
            pend.flee = true;
            self.pending[ix][unit.idx] = Some(pend);
            return dur;
        }
        // K5DOC-T8: krok doktryny (`:6092-6099`). Maszyna kończy aktywację po `DoctrineStep` (`return`), więc nie ma
        // tu okrążenia, `_updateFacing` ani innych gałęzi. Treść kroku = te same klocki co gałęzie `_activateUnit`.
        if let Some(plan) = doctrine_plan.filter(|_| doctrine && skipped.is_empty()) {
            // `_effectiveMetaForUnit` (`:17636`): `{ ...this._ensureGroupMeta(ru.groupId) }` tworzy brakujący wpis grupy.
            self.ensure_group_meta_of(unit);
            if plan.set_ranged_kite {
                // `_executeSkirmishDoctrineStep` (`:18092`): `ru.rangedKite = true` przed `_rangedAction`.
                self.doctrine[ix][unit.idx].ranged_kite = true;
            }
            self.doctrine_steps.push((unit, plan.action));
            match plan.action {
                DoctrineAction::Done => {
                    self.pending[ix][unit.idx] = Some(pend);
                    return 0.0;
                }
                DoctrineAction::Attack(t) => pend.attack = Some(t),
                DoctrineAction::CavalryAction => cavalry = true,
                DoctrineAction::RangedAction => ranged = true,
                DoctrineAction::AdvanceStep => {
                    advance = true;
                }
                DoctrineAction::MoveOrder { .. } => {
                    // `_performPlayerOrder(ru, finish)` (`:18082`, `:18122`; ciało `:18280-18352`) to K5EXEC-T3 (#268):
                    // jawny tag, brak ruchu. K5LOOP-TAGS-REST: tag ZOSTAJE (decyzja techniczna, raport T4): rozkaz ruchu
                    // doktryny wydaje wyłącznie `_executeSkirmishDoctrineStep` (`:18110-18122`) i gałąź końcowa
                    // `:18063-18083` (nieosiągalna: `GroupDoctrine` = `defensive | steady | aggressive | skirmish |
                    // manual`, `:1938`, każda obsłużona wcześniej). Doktrynę `skirmish` ustawia WYŁĄCZNIE gracz z UI
                    // (`_setGroupDoctrine` `:17864` z panelu generała `:18205`, `_setUnitsDoctrine` `:17666` z `:13171`);
                    // domyślna doktryna AUTO to `steady` (`_getEffectiveDoctrine` `:17612-17619`), więc w bitwie AUTO
                    // bez trybu ręcznego gałąź nie występuje. Ciało `_performPlayerOrder` `'move'` (ruch zachłanny,
                    // `_firstStepTowardMoveDestination`, kolejka rozkazów) to zakres K5EXEC-T3.
                    self.unported.push((unit, "doktryna-rozkaz-ruchu"));
                    self.pending[ix][unit.idx] = Some(pend);
                    return 0.0;
                }
            }
        }
        // Gałąź spoza zakresu (ucieczka bez terenu, marsz...) = brak akcji po efektach stanu.
        if !skipped.is_empty() {
            for tag in skipped {
                self.unported.push((unit, tag));
            }
            pend.attack = None;
            self.pending[ix][unit.idx] = Some(pend);
            return 0.0;
        }
        // K5LOOP-SIEGE-ATK-A (T2a): gałęzie wież, taranu i marszu atakującego przy murze (`:6179-6220`). Każda kończy
        // aktywację (`return` po `true`), więc wyklucza pozostałe gałęzie.
        if let Some(plan) = atk_plan {
            let run = if res.branches.contains(&"U7.2-climb") {
                Some(self.siege_atk_climb(unit, wall_col))
            } else if res.branches.contains(&"U7.2-inf") {
                Some(self.siege_atk_infantry(unit, st, wall_col, &plan, &enemies))
            } else if res.branches.contains(&"U7.3-ramtower") {
                Some(self.siege_atk_ram_tower(unit, st, wall_col, &plan, &enemies))
            } else if let Some(row) = wall_shot {
                Some(self.siege_atk_wall_tile(unit, row))
            } else {
                toward.map(|(col, row)| {
                    self.siege_atk_advance_toward(unit, st, wall_col, col, row, None, &enemies)
                })
            };
            if let Some(run) = run {
                if let Some(tag) = run.tag {
                    self.unported.push((unit, tag));
                }
                pend.move_left = run.move_left;
                pend.gate_breach = std::mem::take(&mut self.pending_gate_breach);
                self.pending[ix][unit.idx] = Some(pend);
                return run.dur;
            }
        }
        // `_cavalryAction` (`:6284`) wyklucza `_advanceStep` / `_doAttack` z `_activateUnit` (`return`). Gałąź jest
        // decyzją ruchową (D1 K5DOC-T4e-0): bez [`MoveTerrain`] jawny tag `kawaleria-brak-terenu` i brak akcji (także
        // bez ciosu w sąsiada; wektory `p6_siege_tactics_loop_body_pin` mają tu stub generatora = brak akcji).
        if cavalry {
            if self.terrain.is_none() {
                self.unported.push((unit, "kawaleria-brak-terenu"));
                self.pending[ix][unit.idx] = Some(pend);
                return 0.0;
            }
            let (dur, move_left, attack) = self.cavalry_action(unit, st);
            pend.move_left = move_left;
            match attack {
                // Cios (`_doAttack`) jest zawsze pierwszą i jedyną akcją tury jazdy: wspólna ścieżka ciosu niżej.
                Some(t) => pend.attack = Some(t),
                None => {
                    self.pending[ix][unit.idx] = Some(pend);
                    return dur;
                }
            }
        }
        // K5LOOP-CLOSE r3: strzelec, odwrót i falanga są gałęziami ruchowymi (D1 K5DOC-T4e-0, jak kawaleria r2): bez
        // [`MoveTerrain`] jawny tag i brak akcji (wektory `p6_siege_tactics_loop_body_pin`/`p4_1i3_actions` bez terenu
        // mają tu stub generatora = brak akcji, więc zachowują się bajt w bajt).
        if (ranged || fallback || phalanx) && self.terrain.is_none() {
            let tag = if ranged {
                "strzelec-brak-terenu"
            } else if fallback {
                "odwrot-brak-terenu"
            } else {
                "falanga-brak-terenu"
            };
            self.unported.push((unit, tag));
            self.pending[ix][unit.idx] = Some(pend);
            return 0.0;
        }
        if ranged {
            let run = self.ranged_action(unit, st);
            pend.move_left = run.move_left;
            let mut dur = run.dur;
            if let Some((target, at)) = run.shot {
                pend.shot = self.begin_shot(unit, target, at);
                if self.pin_blow_timing && pend.shot.is_some() {
                    // `_doRangedAttack` (`:9223-9229`): trafienie po `RANGED_FLY_MS`, `done()` po `RANGED_GAP_MS`.
                    dur = at + RANGED_FLY_MS;
                    self.tail[ix][unit.idx] = RANGED_GAP_MS;
                }
            }
            self.pending[ix][unit.idx] = Some(pend);
            return dur;
        }
        if fallback {
            let (dur, move_left) = self.fall_back(unit, st);
            pend.move_left = move_left;
            self.pending[ix][unit.idx] = Some(pend);
            return dur;
        }
        if phalanx {
            match self.phalanx_action(unit, st, melee_target) {
                PhalanxRun::Attack(t) => pend.attack = Some(t),
                PhalanxRun::Advance => advance = true,
                PhalanxRun::Finished(dur, move_left) => {
                    pend.move_left = move_left;
                    self.pending[ix][unit.idx] = Some(pend);
                    return dur;
                }
            }
        }
        // `_advanceStep` i `_doAttack` wykluczaja sie w `_activateUnit` (kazda galaz konczy sie `return`). K5DOC-T8: cios z
        // `_advanceStep` (`:8241-8245`, osiągalny z kroku doktryny `steady`/`aggressive`) idzie wspólną ścieżką `_doAttack`.
        // K5LOOP-TAGS-REST: czas kroków `_advanceStep` przed ciosem (`_doAttack` w chwili końca ostatniego kroku).
        let mut attack_pre = 0.0;
        if advance {
            let (dur, move_left, attack) = self.advance_step(unit, st);
            pend.move_left = move_left;
            match attack {
                Some(t) => {
                    pend.attack = Some(t);
                    attack_pre = dur;
                }
                None => {
                    self.pending[ix][unit.idx] = Some(pend);
                    return dur;
                }
            }
        }
        // K5LOOP-CLOSE r4: `_doAttack` (`:8787-8797`): `if (canShoot(attacker)) this._doRangedAttack(...)`. Strzelec z
        // amunicją dochodzi tu tylko z `shootingEnabled = false` (inaczej `_rangedAction`, `:6241`; mur wykluczony
        // strażnikiem `oblezenie`): cios z U7.6 (sąsiad w zasięgu strzału), kawalerii, falangi albo U7.9 jest STRZAŁEM
        // (`Facing` + `Shot`, trafienie `_singleBlow(…, true)` po `RANGED_FLY_MS`, koniec po `RANGED_GAP_MS`), nie ciosem.
        if pu.activate.can_shoot {
            if let Some(target) = pend.attack.take() {
                pend.shot = self.begin_shot(unit, target, attack_pre);
                let dur = if pend.shot.is_some() {
                    if self.pin_blow_timing {
                        self.tail[ix][unit.idx] = RANGED_GAP_MS;
                        attack_pre + RANGED_FLY_MS
                    } else {
                        attack_pre + RANGED_FLY_MS + RANGED_GAP_MS
                    }
                } else {
                    attack_pre
                };
                self.pending[ix][unit.idx] = Some(pend);
                return dur;
            }
        }
        if let Some(target) = pend.attack {
            if self.blow_composer.is_none()
                && (pu.melee_target != Some(target) || pu.blow.is_none())
            {
                self.unported.push((unit, "cios-bez-szablonu"));
                pend.attack = None;
            }
        }
        let dur = if pend.attack.is_some() {
            if self.pin_blow_timing {
                // `_doMeleeAttack` (`:9119-9172`): `done()` po `localT >= BLOW_LUNGE_MS` i `_schedule(BLOW_SETTLE_MS)`.
                self.tail[ix][unit.idx] = BLOW_LUNGE_MS + BLOW_SETTLE_MS - pu.body_ms;
            }
            attack_pre + pu.body_ms
        } else {
            attack_pre
        };
        // P4-1I3: `_doMeleeAttack` (`:9096-9175`): zwrot atakującego ku celowi (`:9104-9105`, zawsze `rotation.y`),
        // potem start lunge w `t0`; cios w `t0 + body_ms` (adapter: `BLOW_HIT_T`). Sam stan `facing` zmienia
        // [`Self::strike`] w `complete` (bez zmiany logiki); tu ta sama wartość liczona z tego samego wejścia.
        if let Some(target) = pend.attack {
            let tref = UnitRef {
                side: opposite(unit.side),
                idx: target,
            };
            let (aq, ar) = self.cell_of(unit);
            let (dq, dr) = self.cell_of(tref);
            let dir = facing_toward(
                &JsVal::Num((dq - aq) as f64),
                &JsVal::Num((dr - ar) as f64),
                &JsVal::Num(self.facing[ix][unit.idx]),
            )
            .to_number();
            let saved = self.now;
            self.now = saved + attack_pre;
            self.emit(BattleAction::Facing { unit, dir });
            let hit_at = saved + dur;
            self.emit(BattleAction::Melee {
                attacker: unit,
                target: tref,
                hit_at,
            });
            self.now = saved;
        }
        self.pending[ix][unit.idx] = Some(pend);
        dur
    }

    fn take_tail(&mut self, unit: UnitRef) -> f64 {
        std::mem::take(&mut self.tail[side_ix(unit.side)][unit.idx])
    }

    fn complete(&mut self, unit: UnitRef, st: &mut TurnSeqState) {
        let ix = side_ix(unit.side);
        let Some(pend) = self.pending[ix][unit.idx].take() else {
            return;
        };
        self.surround[ix][unit.idx] = pend.surround_applied;
        // K5LOOP-CLOSE r4: ucieczka wykonana w `start` na kopii stanu (rout z okrążenia, kroki, zniknięcie z pola, ripple);
        // stan jednostek obu stron po aktywacji = ta kopia.
        if pend.flee {
            // Kontrakt `flee_after` (U5 Evaluatora r4): twarde asercje w każdym profilu, patrz [`Self::flee_after`].
            let fa = self
                .flee_after
                .take()
                .expect("complete ucieczki bez wyniku start (kontrakt flee_after)");
            assert_eq!(
                fa.unit, unit,
                "complete innej jednostki niz start ucieczki (kontrakt flee_after)"
            );
            if same_seq_units(&st.atk, &fa.before_atk) && same_seq_units(&st.def, &fa.before_def) {
                st.atk = fa.atk;
                st.def = fa.def;
                return;
            }
            // K5LOOP-TAGS-REST: przy murze zegar sterownika (trafienia wież `TowerHit`, odroczone wywołania ciała
            // `BodyTimer`, np. kamień katapulty) może zmienić jednostki w oknie start..complete ucieczki. Łączenie
            // trójstronne pole po polu: pole zmienione tylko przez ucieczkę bierze wynik ucieczki, zmienione tylko przez
            // zegar zostaje. Pole zmienione przez oba na RÓŻNE wartości (kolejność zdarzeń w czasie rzeczywistym pinu nie
            // jest odtwarzana w ciele, które liczy ucieczkę w `start`) = jawny tag `ucieczka-konflikt-zegara` i wartość
            // zegara (NIE_ZMIERZONO, dług #369: sterownik czasu rzeczywistego).
            let mut conflict = false;
            for (cur, (before, fled)) in st
                .atk
                .iter_mut()
                .zip(fa.before_atk.iter().zip(fa.atk.iter()))
                .chain(
                    st.def
                        .iter_mut()
                        .zip(fa.before_def.iter().zip(fa.def.iter())),
                )
            {
                conflict |= merge_flee_unit(&mut cur.c, &before.c, &fled.c);
            }
            if conflict {
                self.unported.push((unit, "ucieczka-konflikt-zegara"));
            }
            return;
        }
        // PIN2-PROBE-Q1 (D-PIN2-1): pin zmienia `ru.morale` na początku `_activateUnit` (okrążenie, `:6103-6117`) od
        // razu, a trafienia wież w trakcie marszu (`_fireOneTower` -> `_resolveBlowOutcome` -> `_applyMoraleDamage`,
        // `:9722-9735`) odejmują od bieżącej wartości; `done()` niczego nie przywraca. Ciało liczy aktywację w `start`
        // (stan tylko do odczytu), więc dawne bezwarunkowe `c.morale = pend.morale` cofało trafienie wieży z okna
        // start..complete (sonda `mur_jazda_rzeka`, t. 73: `a0` 50.857 -> 67.643). Teraz: aktywacja bez zmiany morale
        // zostawia wartość sterownika; zmiana morale w aktywacji przy niezmienionym stanie sterownika = wynik aktywacji;
        // obie zmiany naraz = jawny tag `morale-konflikt-zegara` i wartość sterownika (jak `ucieczka-konflikt-zegara`).
        let morale_tag = {
            let c = unit_cu_mut(st, unit);
            let activation_changed = pend.morale.to_bits() != pend.morale_before.to_bits();
            let clock_changed = c.morale.to_bits() != pend.morale_before.to_bits();
            let conflict = activation_changed && clock_changed;
            if activation_changed && !clock_changed {
                c.morale = pend.morale;
            }
            if let Some(ml) = pend.move_left {
                c.move_left = ml;
            }
            conflict
        };
        if morale_tag {
            self.unported.push((unit, "morale-konflikt-zegara"));
        }
        // `_startRout` z aktywacji (okrążenie): ten sam kod co rout po ciosie (boost wrogów, oslona, facing).
        if pend.start_rout {
            self.start_rout(st, unit);
        }
        // K5LOOP-SIEGE-ATK-B: pętla morale `_breachGate` (`:7803-7810`) po wyłomie bramy w `_attackGate` tej aktywacji.
        if pend.gate_breach {
            self.gate_breach_morale(st);
        }
        if let Some(shot) = pend.shot {
            self.complete_shot(st, unit, shot);
            return;
        }
        let Some(target) = pend.attack else {
            return;
        };
        let tref = UnitRef {
            side: opposite(unit.side),
            idx: target,
        };
        let Some(input) = self.composed_or(false, self.units[ix][unit.idx].blow.clone()) else {
            return;
        };
        let rec = self.strike(st, unit, tref, input, false);
        // P4-1I3: `if (dmg > 0 && !defender.dead) this._spawnDamageLabel(defender, dmg)` (`:9125`).
        if rec.dmg > 0.0 && !st.unit(tref).c.dead {
            self.emit(BattleAction::Damage {
                target: tref,
                dmg: rec.dmg,
            });
        }
        self.blows.push(rec);
        self.counter_strike(st, unit, tref);
    }
}

impl<R: RollSource> ProdBody<R> {
    /// Jeden cios `_singleBlow` (pin): łuk względem facing celu, pierwsza para z `engaged`, stan celu z `st`, jeden rzut,
    /// skutki HP/zabicia, wpis do `engaged`. Wspólne dla ciosu głównego i kontrataku. Efekty `_resolveBlowOutcome`
    /// (morale/rout po ciosie) NIE są tu stosowane: zapis w `unported`.
    /// K5LOOP-WIRING-A (#369): trafienie wieży `_singleBlow(shooter, target, true)` (`:4264`) z pełnymi skutkami
    /// `_resolveBlowOutcome` (`:9019-9068`): stan celu z `st`, jeden rzut, log ciosu, potem efekty w kolejności pinu
    /// (morale/rout, zabicie z `_startFade` + `_shakeAlliesOnLoss` + `_boostEnemiesOnBreak`, wpis `_pushClash` z aktorem
    /// wieży). Strzelec jest syntetyczny i `dead` (`:4236-4244`), więc `_gainMorale(attacker)` nic nie robi. Etykieta
    /// `_spawnDamageLabel` (`:4265`) gdy `dmg > 0` i cel żywy.
    fn tower_blow_full(&mut self, tmpl: &FullBlowInput, tref: UnitRef, st: &mut TurnSeqState) {
        let tc = st.unit(tref).c;
        let tix = side_ix(tref.side);
        // PIN3-DIVERGENCE-Q1 (D-PIN3-1): pozycja i zwrot celu W CHWILI trafienia (`_singleBlow` `:8831-8833`, `:8880`),
        // nie po atomowo policzonym marszu ciała (krok `_doMove` zmienia `ru.q/r` i `facing` dopiero w chwili kroku).
        let (dq, dr) = self.unit_cell_at(tref, self.now).unwrap_or((
            self.units[tix][tref.idx].activate.q,
            self.units[tix][tref.idx].activate.r,
        ));
        let target_facing = self.facing_at(tref, self.now);
        let shooter_cell = (st.siege_wall_col, self.tower_row);
        // K5LOOP-WIRING-A r2 (Z2): przy kompozytorze wejście składane jak `_singleBlow` (`:8811-8960`) z realnym celem;
        // łuk `relativeHit(target.facing, wallCol, t.row, target.q, target.r)` (`:8880`).
        let mut input = match &self.blow_composer {
            Some(c) => {
                let site = TowerBlowSite {
                    target: tref,
                    shooter_cell,
                    target_cell: (dq, dr),
                    target_on_wall: self.units[tix][tref.idx].activate.on_wall_walkway,
                };
                match c.compose_tower(&site) {
                    Some(mut inp) => {
                        inp.hit_arc = relative_hit(
                            &JsVal::Num(target_facing),
                            &JsVal::Num(shooter_cell.0 as f64),
                            &JsVal::Num(shooter_cell.1 as f64),
                            &JsVal::Num(dq as f64),
                            &JsVal::Num(dr as f64),
                        );
                        inp
                    }
                    None => {
                        self.unported.push((tref, "wieza-bez-kompozytora"));
                        tmpl.clone()
                    }
                }
            }
            None => tmpl.clone(),
        };
        input.ranged = true;
        input.defender_state = DefenderState {
            hp: tc.hp,
            max_hp: input.defender_state.max_hp,
            morale: tc.morale,
            flee_morale: tc.flee_morale,
            dead: tc.dead,
            fading_out: tc.fading_out,
            routed: tc.routed,
            never_rout: tc.never_rout,
            removed: tc.removed,
        };
        input.routed_after_morale = true;
        let max_hp = input.defender_state.max_hp;
        let out = single_blow_full(&input, &mut self.rolls);
        unit_cu_mut(st, tref).hp = out.blow.def_hp_after;
        let shooter = tower_shooter_name(&self.tower_shooter_nazwa);
        let tname = self.name_of(tref);
        self.emit_blow_log(&shooter, &tname, input.hit_arc, &out, max_hp);
        let row = self.tower_row;
        for e in &out.blow.effects {
            match *e {
                SceneEffect::UpdateHpBar | SceneEffect::GainMorale { .. } => {}
                SceneEffect::PushClash { tag } => {
                    let tag = match (tag, out.blow.outcome) {
                        (ClashTag::Padl, _) => ClashTag::Padl,
                        (_, Outcome::RoutBeforeDeath) => ClashTag::Rout,
                        _ if st.unit(tref).c.routed => ClashTag::Rout,
                        _ => ClashTag::Plain,
                    };
                    self.emit_clash(
                        Actor::Tower(row),
                        &shooter,
                        BattleSide::Defender,
                        tref,
                        out.blow.dmg,
                        tag,
                    );
                }
                SceneEffect::ApplyMoraleDamage { dmg, extra_morale } => {
                    self.apply_morale_damage(st, tref, max_hp, dmg, extra_morale);
                }
                SceneEffect::StartFade => {
                    let c = st.unit(tref).c;
                    if !c.dead && !c.fading_out && !c.removed {
                        let text = eliminated_log(&tname);
                        self.emit(BattleAction::Log { text });
                    }
                    self.start_fade(st, tref);
                }
                SceneEffect::ShakeAllies => {
                    self.kill_ripples.push(tref);
                    self.shake_allies_on_loss(st, tref);
                }
                SceneEffect::BoostEnemies => self.boost_enemies_on_break(st, tref),
            }
        }
        let tc = st.unit(tref).c;
        if out.blow.dmg > 0.0 && !tc.dead && !tc.fading_out {
            self.emit(BattleAction::Damage {
                target: tref,
                dmg: out.blow.dmg,
            });
        }
    }

    /// K5LOOP-WIRING-A: przy [`Self::blow_composer`] wejście składa [`Self::strike`] w chwili ciosu, więc tu zastępczy
    /// szablon niosący tylko `ranged` (nadpisywany w całości); bez kompozytora szablon adaptera (`None` = brak).
    fn composed_or(&self, ranged: bool, template: Option<FullBlowInput>) -> Option<FullBlowInput> {
        if self.blow_composer.is_some() {
            let mut p = neutral_tower_shot_template();
            p.ranged = ranged;
            Some(p)
        } else {
            template
        }
    }

    fn strike(
        &mut self,
        st: &mut TurnSeqState,
        attacker: UnitRef,
        target: UnitRef,
        mut input: FullBlowInput,
        emit_facing: bool,
    ) -> BlowRecord {
        let ix = side_ix(attacker.side);
        let tix = side_ix(target.side);
        let tc = st.unit(target).c;
        let (aq, ar) = (
            self.units[ix][attacker.idx].activate.q,
            self.units[ix][attacker.idx].activate.r,
        );
        let (dq, dr) = (
            self.units[tix][target.idx].activate.q,
            self.units[tix][target.idx].activate.r,
        );
        // `_doMeleeAttack` (battleScene.ts:9104): atakujący zwraca się ku celowi; `_singleBlow` klasyfikuje łuk
        // względem facing OBROŃCY w tym momencie (`relativeHit`, battleScene.ts:8880).
        let dir = facing_toward(
            &JsVal::Num((dq - aq) as f64),
            &JsVal::Num((dr - ar) as f64),
            &JsVal::Num(self.facing[ix][attacker.idx]),
        )
        .to_number();
        self.set_facing(attacker, dir);
        // P4-1I3: zwrot obrońcy przed kontratakiem (`:9137-9138`); zwrot atakującego ciosu głównego emituje `start`.
        if emit_facing {
            let dir = self.facing[ix][attacker.idx];
            self.emit(BattleAction::Facing {
                unit: attacker,
                dir,
            });
        }
        input.hit_arc = relative_hit(
            &JsVal::Num(self.facing[tix][target.idx]),
            &JsVal::Num(aq as f64),
            &JsVal::Num(ar as f64),
            &JsVal::Num(dq as f64),
            &JsVal::Num(dr as f64),
        );
        // Para jest „pierwsza", dopóki jej klucza nie ma w `engaged` (`firstBlow = !this.engaged.has(key)`, :8896).
        let first_blow = !self.engaged.contains(&(attacker, target));
        // K5LOOP-WIRING-A: wejście złożone w chwili ciosu (pin `_singleBlow` `:8811-8960`) zamiast szablonu.
        if let Some(c) = &self.blow_composer {
            let hit_arc = input.hit_arc;
            input = c.compose(&BlowSite {
                attacker,
                target,
                ranged: input.ranged,
                attacker_cell: (aq, ar),
                target_cell: (dq, dr),
                target_on_wall: self.units[tix][target.idx].activate.on_wall_walkway,
                first_blow,
            });
            input.hit_arc = hit_arc;
        }
        input.first_blow_of_pair = first_blow;
        input.defender_state = DefenderState {
            hp: tc.hp,
            max_hp: input.defender_state.max_hp,
            morale: tc.morale,
            flee_morale: tc.flee_morale,
            dead: tc.dead,
            fading_out: tc.fading_out,
            routed: tc.routed,
            never_rout: tc.never_rout,
            removed: tc.removed,
        };
        // `routed_after_morale` (wynik `_applyMoraleDamage`) nie jest znany przed ciosem: lista efektów zawsze zawiera
        // `GainMorale` atakującego w gałęziach morale, a ProdBody stosuje go dopiero, gdy cel faktycznie się złamał.
        input.routed_after_morale = true;
        let max_hp = input.defender_state.max_hp;
        let out = single_blow_full(&input, &mut self.rolls);
        unit_cu_mut(st, target).hp = out.blow.def_hp_after;
        // P4-1I3: `this.log.push(… chybia …)` (`:8962`) albo `(… trafia …)` (`:8997-9000`), przed skutkami ciosu.
        let (an, dn) = (self.name_of(attacker), self.name_of(target));
        self.emit_blow_log(&an, &dn, input.hit_arc, &out, max_hp);
        self.apply_outcome_effects(
            st,
            attacker,
            target,
            max_hp,
            &out.blow.effects,
            out.blow.outcome,
            out.blow.dmg,
        );
        if out.blow.engaged_add && !self.engaged.contains(&(attacker, target)) {
            self.engaged.push((attacker, target));
        }
        BlowRecord {
            attacker,
            target,
            missed: out.blow.missed,
            hit_pct: out.blow.hit_pct,
            roll: out.blow.roll,
            dmg: out.blow.dmg,
            def_hp_after: out.blow.def_hp_after,
            extra_morale: out.blow.extra_morale,
            is_charge: out.blow.is_charge,
            hit_arc: input.hit_arc,
        }
    }

    /// Efekty `_resolveBlowOutcome` (`battleScene.ts:9020-9068`) na stanie, w kolejności listy `effects` z
    /// [`resolve_outcome`](crate::domain::siege_tactics_blow::resolve_outcome). Efekty czysto wizualne i log
    /// (`UpdateHpBar`, `PushClash`) są pomijane. Zabicie: `_startFade`, ripple `_shakeAlliesOnLoss` (NIEPORTOWANY),
    /// `_boostEnemiesOnBreak`, `_gainMorale`. Pozostałe ścieżki: `_applyMoraleDamage` i `_gainMorale` atakującego,
    /// gdy cel po ciosie jest `routed` (`if (defender.routed) this._gainMorale(...)`).
    #[allow(clippy::too_many_arguments)]
    fn apply_outcome_effects(
        &mut self,
        st: &mut TurnSeqState,
        attacker: UnitRef,
        defender: UnitRef,
        max_hp: f64,
        effects: &[SceneEffect],
        outcome: Outcome,
        blow_dmg: f64,
    ) {
        for e in effects {
            match *e {
                SceneEffect::UpdateHpBar => {}
                // P4-1I3: `_pushClash` (`:9038`, `:9053`, `:9067`). Tag: `padl` przy zabiciu, `rout` w gałęzi
                // rout-przed-śmiercią (bezwarunkowo, `:9038`), w gałęzi zwykłej `defender.routed ? 'rout' : ''`
                // po `_applyMoraleDamage` (`:9067`). Tag z listy efektów nie jest użyty: `routed_after_morale`
                // jest tu zawsze `true` (patrz [`Self::strike`]).
                SceneEffect::PushClash { tag } => {
                    let tag = match (tag, outcome) {
                        (ClashTag::Padl, _) => ClashTag::Padl,
                        (_, Outcome::RoutBeforeDeath) => ClashTag::Rout,
                        _ if st.unit(defender).c.routed => ClashTag::Rout,
                        _ => ClashTag::Plain,
                    };
                    let an = self.name_of(attacker);
                    self.emit_clash(
                        Actor::Unit(attacker),
                        &an,
                        attacker.side,
                        defender,
                        blow_dmg,
                        tag,
                    );
                }
                SceneEffect::ApplyMoraleDamage { dmg, extra_morale } => {
                    self.apply_morale_damage(st, defender, max_hp, dmg, extra_morale);
                }
                SceneEffect::StartFade => {
                    // P4-1I3: `this.log.push('  -> ' + nazwa + ' wyeliminowany')` (`:9046`) przed `_startFade`.
                    let c = st.unit(defender).c;
                    if !c.dead && !c.fading_out && !c.removed {
                        let text = eliminated_log(&self.name_of(defender));
                        self.emit(BattleAction::Log { text });
                    }
                    self.start_fade(st, defender);
                }
                // K5LOOP-KILL-RIPPLE (D-INT-2): `_shakeAlliesOnLoss(defender)` (`battleScene.ts:9048`) po `_startFade`,
                // przed `_boostEnemiesOnBreak` (kolejność listy efektów = kolejność pinu `:9047-9051`). Pole poległego
                // (`fallen.q/r`) zostaje po `_removeUnitFromScene` (zwalnia tylko `occByKey`), więc promień liczy się
                // od tego samego pola co w pinie.
                SceneEffect::ShakeAllies => {
                    self.kill_ripples.push(defender);
                    self.shake_allies_on_loss(st, defender);
                }
                SceneEffect::BoostEnemies => self.boost_enemies_on_break(st, defender),
                SceneEffect::GainMorale { side, amount } => {
                    // Zabicie zyskuje bezwarunkowo (cel jest już `dead`); gałęzie morale tylko po złamaniu celu.
                    let killed = st.unit(defender).c.dead;
                    if side == Side::Attacker && (killed || st.unit(defender).c.routed) {
                        self.gain_morale(st, attacker, amount);
                    }
                }
            }
        }
    }

    /// `_applyMoraleDamage` (`battleScene.ts:9722-9735`).
    fn apply_morale_damage(
        &mut self,
        st: &mut TurnSeqState,
        victim: UnitRef,
        max_hp: f64,
        dmg: f64,
        extra_loss: f64,
    ) {
        let c = st.unit(victim).c;
        if c.dead || c.fading_out || c.routed {
            return;
        }
        let mut hp_loss = MORALE_HIT_LOSS_SCALE * (dmg / js_max(1.0, max_hp));
        // FACTOR 7: armia w odwrocie lamie sie szybciej (tylko strata z HP, nie stale dodatki).
        if self.army_morale_ratio(st, victim.side) < MORALE_ARMY_COLLAPSE_RATIO {
            hp_loss *= MORALE_ARMY_COLLAPSE_MULT;
        }
        let loss = hp_loss + js_max0(extra_loss);
        let vc = unit_cu_mut(st, victim);
        vc.morale = js_max0(vc.morale - loss);
        self.check_rout(st, victim);
    }

    /// `_armyMoraleRatio(side)` = `armyMoraleRatioWithoutCommander` na jednostkach strony (`battleScene.ts:9988`).
    fn army_morale_ratio(&self, st: &TurnSeqState, side: BattleSide) -> f64 {
        let ix = side_ix(side);
        let units = match side {
            BattleSide::Attacker => &st.atk,
            BattleSide::Defender => &st.def,
        };
        let army: Vec<ArmyLeaderCombatant> = units
            .iter()
            .enumerate()
            .map(|(i, u)| ArmyLeaderCombatant {
                is_army_commander: self.is_army_commander[ix][i],
                morale: u.c.morale,
                morale_max: self.morale_max[ix][i],
                dead: u.c.dead,
                fading_out: u.c.fading_out,
                routed: u.c.routed,
            })
            .collect();
        army_morale_ratio_without_commander(&army)
    }

    /// `_gainMorale` (`battleScene.ts:9695-9700`): martwy / znikający / uciekający lub `amount <= 0` bez zmian.
    fn gain_morale(&mut self, st: &mut TurnSeqState, unit: UnitRef, amount: f64) {
        let max = self.morale_max[side_ix(unit.side)][unit.idx];
        let c = unit_cu_mut(st, unit);
        // `amount <= 0` jest fałszem dla NaN (jak w JS), stąd negacja `!(amount > 0)` nie jest użyta.
        if c.dead || c.fading_out || c.routed || amount <= 0.0 {
            return;
        }
        c.morale = js_min(max, c.morale + amount);
    }

    /// `_boostEnemiesOnBreak(fallen)` (`battleScene.ts:9707-9714`): żywi wrogowie w promieniu
    /// [`MORALE_DEATH_RADIUS`] (Manhattan) zyskują [`MORALE_ENEMY_BREAK_GAIN`] morale.
    fn boost_enemies_on_break(&mut self, st: &mut TurnSeqState, fallen: UnitRef) {
        let (fq, fr) = self.cell_of(fallen);
        let other = opposite(fallen.side);
        for idx in 0..self.units[side_ix(other)].len() {
            let e = UnitRef { side: other, idx };
            let c = st.unit(e).c;
            if c.dead || c.fading_out || c.routed {
                continue;
            }
            let (eq, er) = self.cell_of(e);
            if (eq - fq).abs() + (er - fr).abs() > MORALE_DEATH_RADIUS {
                continue;
            }
            self.gain_morale(st, e, MORALE_ENEMY_BREAK_GAIN);
        }
    }

    /// K5LOOP-SIEGE-DEF (T1): `_rangedTargetInRange(ru)` (`battleScene.ts:7041-7053`) na liczbach JS: `ru.range` jako
    /// `f64` (bez obcięcia do `i64`, jak w [`Combatant::range`]), więc `dd > NaN` jest fałszem (NaN = każdy wróg
    /// z `dd >= 1` w zasięgu), a `+Infinity` obejmuje całe pole. `_enemiesOf` (`:8291-8294`): bez martwych,
    /// znikających i uciekających. Najbliższy w `[1..range]`; remis odległości = niższe `bu.hp` (`<` ścisłe, NaN
    /// nie wygrywa), kolejność listy strony przeciwnej.
    fn ranged_target_in_range_js(&self, unit: UnitRef, st: &TurnSeqState) -> Option<usize> {
        let (q, r) = self.cell_of(unit);
        let range = self.units[side_ix(unit.side)][unit.idx].activate.range;
        let other = opposite(unit.side);
        let mut best: Option<(usize, f64)> = None;
        let mut best_d = f64::INFINITY;
        for idx in 0..self.units[side_ix(other)].len() {
            let e = UnitRef { side: other, idx };
            let c = st.unit(e).c;
            if c.dead || c.fading_out || c.routed {
                continue;
            }
            let (eq, er) = self.cell_of(e);
            let dd = ((q - eq).abs() + (r - er).abs()) as f64;
            if dd < 1.0 || dd > range {
                continue;
            }
            let take = dd < best_d || (dd == best_d && best.is_some_and(|(_, hp)| c.hp < hp));
            if take {
                best_d = dd;
                best = Some((idx, c.hp));
            }
        }
        best.map(|(i, _)| i)
    }

    /// K5LOOP-WIRING-A r2 (Z4a, D-WIRA-10): `terrainDefenseMultiplier(combatTerrainName(ru.q, ru.r), cu.rola)` z
    /// BIEŻĄCEGO kafla (`_checkRout` `:9790-9792`), gdy kompozytor zna mapę pola; bez kompozytora wartość adaptera.
    fn current_tdm(&self, unit: UnitRef) -> f64 {
        let cell = self.cell_of(unit);
        self.blow_composer
            .as_ref()
            .and_then(|c| c.terrain_defence_mult(unit, cell))
            .unwrap_or(
                self.units[side_ix(unit.side)][unit.idx]
                    .activate
                    .terrain_defence_mult,
            )
    }

    fn cell_of(&self, unit: UnitRef) -> (i64, i64) {
        let a = &self.units[side_ix(unit.side)][unit.idx].activate;
        (a.q, a.r)
    }

    /// `_checkRout` (`battleScene.ts:9783-9797`): próg ucieczki obniżony na terenie obronnym
    /// ([`ProdUnit::activate`]`.terrain_defence_mult`, wejście adaptera).
    fn check_rout(&mut self, st: &mut TurnSeqState, unit: UnitRef) {
        let c = st.unit(unit).c;
        let tdm = self.current_tdm(unit);
        if should_rout(&c, effective_flee_threshold(c.flee_morale, tdm)) {
            self.start_rout(st, unit);
        }
    }

    /// `_startRout` (`battleScene.ts:9799-9825`): flaga `routed`, `acted`, oslona wrecz, boost wrogów, zwrot ku
    /// własnej krawędzi (atakujący W = 3, obrońca E = 1), zwolnienie pola `occByKey` (`:9812`), efekty dowódcy
    /// (`:9803-9806`, [`Self::commander_lost`]). Nieportowane: `routedUnits` (dane bez konsumenta, `:9827-9830`).
    fn start_rout(&mut self, st: &mut TurnSeqState, unit: UnitRef) {
        let ix = side_ix(unit.side);
        {
            let c = unit_cu_mut(st, unit);
            if c.routed || c.dead || c.fading_out {
                return;
            }
            c.routed = true;
            c.acted = true;
        }
        // `this.occByKey.delete(cellKey(ru.q, ru.r))` (`battleScene.ts:9812`).
        // PIN3-DIVERGENCE-Q1 (D-PIN3-5): rozbicie W TRAKCIE własnego marszu (trafienie wieży między krokami): pin zwalnia
        // pole z chwili rozbicia, ale kolejne kroki `_doMove` (`:8714-8717`: `occByKey.delete(old)`, `set(new)`) dalej
        // się wykonują i zajmują pole końcowe. Ciało liczy marsz atomowo (pole końcowe już zajęte, pośrednie zwolnione),
        // więc przy pozostałych krokach na osi czasu pole końcowe zostaje zajęte.
        if !(self.pin_blow_timing && self.has_future_steps(unit) && false) {
            self.release_tile(unit);
        }
        // P4-1I3: `_sfxRout()` (`:9801`) = początek rozbicia, przed kaskadą osłony wręcz.
        self.emit(BattleAction::Rout { unit });
        // K5LOOP-TAGS-REST (`:9803-9806`): `if (ru.isArmyCommander) { _removeCommanderMoraleBonus(ru.side);
        // _disableManualIfCommanderLost(ru.side); }` przed `acted` i kaskadą osłony wręcz.
        if self.is_army_commander[ix][unit.idx] {
            self.commander_lost(st, unit);
        }
        if !self.units[ix][unit.idx].activate.primary_ranged {
            self.check_melee_screen_lost(st, unit.side);
        }
        self.boost_enemies_on_break(st, unit);
        let dir = match unit.side {
            BattleSide::Attacker => 3.0,
            BattleSide::Defender => 1.0,
        };
        self.set_facing(unit, dir);
        // P4-1I3: `ru.group.rotation.y = dirYaw(ru.facing)` (`:9818`), potem log (`:9819`).
        self.emit(BattleAction::Facing { unit, dir });
        let text = rout_log(&self.name_of(unit));
        self.emit(BattleAction::Log { text });
    }

    /// K5LOOP-TAGS-REST: efekty utraty dowódcy armii z `_startRout` (`battleScene.ts:9803-9806`) i `_startFade`
    /// (`:9929-9932`): `_removeCommanderMoraleBonus(ru.side)` i `_disableManualIfCommanderLost(ru.side)`.
    ///
    /// `_removeCommanderMoraleBonus` (`:9993-10005`), dla KAŻDEJ jednostki strony (także martwej, uciekającej i samego
    /// dowódcy) w kolejności listy:
    /// 1. `frac = bu.armyLeaderMoraleBonusFrac ?? 0`; `if (frac <= 0) continue` (NaN NIE spełnia, jednostka przechodzi);
    /// 2. `ratio = moraleMax > 0 ? Math.max(0, Math.min(1, morale / moraleMax)) : 0` (NaN propaguje przez `Math.*`);
    /// 3. `frac = 0`; `base = moraleBaseFor(bu) * (side === 'def' ? 1.5 : 1)` (`moraleBaseFor` z zerowym bonusem =
    ///    wejście adaptera [`Self::morale_base_plain`]); `moraleMax = base`; `morale = Math.min(base, Math.ceil(base *
    ///    ratio))`; `_updateMoraleBar` (render, bez stanu).
    ///
    /// `_disableManualIfCommanderLost` (`:10007-10015`) działa wyłącznie w trybie ręcznym gracza (bramka
    /// `_manualCommanderGate`, strona gracza, odroczone `_toggleManualMode` tylko przy `_manualMode`). Ciało gra AUTO
    /// (strażnik `tryb-reczny` w `start`, D-WIR-2): odroczone wywołanie nic nie zmienia, więc nie jest planowane (bez
    /// pustego zdarzenia zegara). Brak wejścia `morale_base_plain` przy jednostce z bonusem = jawny tag
    /// `dowodca-bez-bazy-morale` i brak zmiany tej jednostki (błąd wejścia adaptera, bez zgadywania bazy).
    fn commander_lost(&mut self, st: &mut TurnSeqState, commander: UnitRef) {
        let side = commander.side;
        let ix = side_ix(side);
        let side_mult = match side {
            BattleSide::Attacker => 1.0,
            BattleSide::Defender => 1.5,
        };
        for idx in 0..self.units[ix].len() {
            let frac = self.army_leader_bonus_frac[ix][idx];
            if frac <= 0.0 {
                continue;
            }
            let u = UnitRef { side, idx };
            let Some(plain) = self.morale_base_plain[ix][idx] else {
                self.unported.push((u, "dowodca-bez-bazy-morale"));
                continue;
            };
            let max = self.morale_max[ix][idx];
            let morale = st.unit(u).c.morale;
            let ratio = if max > 0.0 {
                js_max(0.0, js_min(1.0, morale / max))
            } else {
                0.0
            };
            self.army_leader_bonus_frac[ix][idx] = 0.0;
            let base = plain * side_mult;
            self.morale_max[ix][idx] = base;
            unit_cu_mut(st, u).morale = js_min(base, (base * ratio).ceil());
        }
    }

    /// `_checkMeleeScreenLost(side)` (`battleScene.ts:9759-9774`): gdy strona nie ma już żywej jednostki wrecz,
    /// jej strzelcy tracą jednorazowo 50% morale i sprawdzają rout.
    fn check_melee_screen_lost(&mut self, st: &mut TurnSeqState, side: BattleSide) {
        let ix = side_ix(side);
        let n = self.units[ix].len();
        let has_melee = (0..n).any(|i| {
            let c = st.unit(UnitRef { side, idx: i }).c;
            !c.dead && !c.fading_out && !c.routed && !self.units[ix][i].activate.primary_ranged
        });
        if has_melee {
            return;
        }
        for idx in 0..n {
            let u = UnitRef { side, idx };
            let c = st.unit(u).c;
            if c.dead || c.fading_out || c.routed || c.never_rout {
                continue;
            }
            if !self.units[ix][idx].activate.primary_ranged || self.screen_lost_applied[ix][idx] {
                continue;
            }
            self.screen_lost_applied[ix][idx] = true;
            let uc = unit_cu_mut(st, u);
            uc.morale = js_max0(uc.morale * 0.5);
            self.check_rout(st, u);
        }
    }

    /// `occByKey.delete(cellKey(ru.q, ru.r))`: zwolnienie pola jednostki (rout `:9812`, usuniecie `:9915`). Web usuwa
    /// klucz bez sprawdzania wlasciciela; tu tak samo.
    /// PIN3-DIVERGENCE-Q1 (D-PIN3-5): czy jednostka ma na osi czasu ciała kroki `_doMove` jeszcze niewykonane w chwili
    /// `self.now` ([`timeline_done`]).
    fn has_future_steps(&self, unit: UnitRef) -> bool {
        let now = self.now;
        self.move_timeline
            .iter()
            .any(|&(u, t0, _, _, synchr)| u == unit && !timeline_done(t0, synchr, now))
    }

    fn release_tile(&mut self, unit: UnitRef) {
        let pu = &self.units[side_ix(unit.side)][unit.idx].activate;
        let key = cell_key(pu.q as f64, pu.r as f64);
        self.occ_by_key.remove(&key);
    }

    /// `_startFade` -> `_removeUnitFromScene` (`battleScene.ts:9910-9937`): jednostka zabita znika z pola
    /// (`removed`, `dead`, `fadingOut = false`). Efekty dowódcy (`:9929-9932`) przed zniknięciem
    /// ([`Self::commander_lost`]).
    fn start_fade(&mut self, st: &mut TurnSeqState, unit: UnitRef) {
        {
            let c = st.unit(unit).c;
            if c.fading_out || c.dead || c.removed {
                return;
            }
        }
        // K5LOOP-TAGS-REST (`:9929-9932`): efekty dowódcy PRZED `_removeUnitFromScene` (pin: `_removeCommanderMoraleBonus`
        // czyta morale całej strony, także zabijanej jednostki, która w tej chwili nie jest jeszcze `removed`).
        if self.is_army_commander[side_ix(unit.side)][unit.idx] {
            self.commander_lost(st, unit);
        }
        let c = unit_cu_mut(st, unit);
        c.removed = true;
        c.dead = true;
        c.fading_out = false;
        // `_removeUnitFromScene`: `this.occByKey.delete(cellKey(ru.q, ru.r))` (`battleScene.ts:9915`).
        self.release_tile(unit);
        // P4-1I3: `_sfxDeath()` + `_removeUnitFromScene(ru)` (`:9933-9937`).
        self.emit(BattleAction::Kill { unit });
    }

    /// P4-1I3: log ciosu `_singleBlow`: pudło (`:8962`) albo trafienie z `arcTag` (`:8993-9000`). `max_hp` =
    /// `defender.bu.maxHp`; HP po ciosie = `def_hp_after`.
    fn emit_blow_log(
        &mut self,
        attacker: &str,
        defender: &str,
        arc: HitArc,
        out: &FullBlowOutput,
        max_hp: f64,
    ) {
        let text = if out.blow.missed {
            miss_log(attacker, defender, out.blow.roll, out.blow.hit_pct)
        } else {
            let tag = arc_tag(arc, out.composition.def_penalty_frac);
            hit_log(
                attacker,
                defender,
                &tag,
                out.blow.dmg,
                out.blow.def_hp_after,
                max_hp,
            )
        };
        self.emit(BattleAction::Log { text });
    }

    /// P4-1I3: wpis `_pushClash` (`:9550-9566`) jako akcja z gotowym tekstem panelu.
    fn emit_clash(
        &mut self,
        attacker: Actor,
        attacker_name: &str,
        attacker_side: BattleSide,
        target: UnitRef,
        dmg: f64,
        tag: ClashTag,
    ) {
        let text = clash_line(
            attacker_name,
            attacker_side,
            &self.name_of(target),
            target.side,
            dmg,
            tag,
        );
        self.emit(BattleAction::Clash {
            attacker,
            target,
            dmg,
            tag,
            text,
        });
    }

    /// Kontratak obrońcy (pin `_doMeleeAttack`, COUNTER-ATTACK, battleScene.ts:9134-9143). Warunki jak w
    /// `_defenderCounters` (battleScene.ts:9079-9091): obrońca żywy, nie znika, nie ucieka, HP > 0, budżet tury
    /// (`DefenderCounterBudget`: jeden kontratak na obrońcę w turze; turę oznacza `round_no`). Budżet sprawdzany przed
    /// gałęzią strzelca. Strzelec podstawowy (`primary_ranged`) kontratakuje tylko bez amunicji (`!canShoot`,
    /// `:9091`; K5LOOP-TAGS-REST, dawny tag `kontratak-strzelec`).
    fn counter_strike(&mut self, st: &mut TurnSeqState, attacker: UnitRef, defender: UnitRef) {
        let dix = side_ix(defender.side);
        let dc = st.unit(defender).c;
        if dc.dead || dc.fading_out || dc.routed || dc.hp <= 0.0 {
            return;
        }
        if self.counter_round[dix][defender.idx] == Some(st.round_no) {
            return;
        }
        // K5LOOP-TAGS-REST (`:9090-9091`): `if (!defender.primaryRanged) return true; return !canShoot(defender);`:
        // strzelec podstawowy kontratakuje tylko „przyparty” (bez amunicji). `canShoot = rangedBase && ammoLeft > 0`
        // (`:1457-1459`) ciało trzyma w `activate.can_shoot` (przeliczane przy każdym strzale, [`Self::complete_shot`]).
        let da = &self.units[dix][defender.idx].activate;
        if da.primary_ranged && da.can_shoot {
            return;
        }
        let Some(cin) = self.composed_or(
            false,
            self.units[dix][defender.idx]
                .counter_blows
                .get(attacker.idx)
                .cloned(),
        ) else {
            self.unported.push((defender, "kontratak-bez-szablonu"));
            return;
        };
        // `_counterBudget.consume` + `engaged.add(defender>attacker)` (odmowa szarży kontrataku).
        self.counter_round[dix][defender.idx] = Some(st.round_no);
        if !self.engaged.contains(&(defender, attacker)) {
            self.engaged.push((defender, attacker));
        }
        let rec = self.strike(st, defender, attacker, cin, true);
        // P4-1I3: `if (back > 0 && !attacker.dead && !attacker.fadingOut) this._spawnDamageLabel(attacker, back)`
        // (`:9142`).
        let ac = st.unit(attacker).c;
        if rec.dmg > 0.0 && !ac.dead && !ac.fading_out {
            self.emit(BattleAction::Damage {
                target: attacker,
                dmg: rec.dmg,
            });
        }
        self.counters.push(rec);
    }
}

/// K5LOOP-SIEGE-ATK-A (T2a): decyzje trzech funkcji wież atakującego przy murze z pozycji na starcie aktywacji
/// ([`ProdBody::siege_atk_plan`]). `*_missing` = decyzja wymagała `_passableForUnit` (BFS), a ciało nie ma
/// [`MoveTerrain`] (D1 K5DOC-T4e-0): wywołanie zwraca maszynie `true` (aktywacja kończy się jak w pinie po obsłużonej
/// gałęzi), a ciało zapisuje jawny tag `*-brak-terenu` zamiast wykonania.
#[derive(Debug, Clone, PartialEq)]
struct ProdAtkPlan {
    climb: bool,
    infantry: InfantryPlan,
    infantry_missing: bool,
    ram: RamTowerPlan,
    ram_missing: bool,
}

/// K5LOOP-SIEGE-ATK-A: wynik wykonania gałęzi atakującego przy murze (czas, `moveLeft` po ruchu, jawny tag).
struct AtkRun {
    dur: f64,
    move_left: Option<f64>,
    tag: Option<&'static str>,
}

impl AtkRun {
    fn idle() -> Self {
        AtkRun {
            dur: 0.0,
            move_left: None,
            tag: None,
        }
    }
    fn tagged(tag: &'static str) -> Self {
        AtkRun {
            dur: 0.0,
            move_left: None,
            tag: Some(tag),
        }
    }
}

/// K5LOOP-SIEGE-ATK-A: adapter [`WalkWorld`] pętli marszu K1b (`_siegeWalkTo`, `battleScene.ts:8006-8019`) dla jednej
/// jednostki ciała: `isGoal` z [`goal_holds`] na BIEŻĄCEJ zajętości ciała, `passable_free` = `!occByKey.has(k) &&
/// _passableForUnit(ru, c, r)` (`Number.isFinite(_moveCostForUnit)`, `:7446-7448`), `do_move` = `_doMove` (`:8685-8776`):
/// bramka `siegeWallCol >= 0 && _siegeMoveRefused` (`:8689`), potem [`ProdBody::move_step_core`] (efekty T4c +
/// `_updateFacing` z nowego pola + akcja `Move` w chwili `t0`).
///
/// Bramka: `_siegeMoveRefused` wymaga `_siegeApproachRestricted(ru)` (`:7963-7964`), który dla machin (`isSiegeUnit`,
/// `:7953`) i dla piechoty przy stojącej wieży (`towerAtWallRows.size > 0`, `:7959`; piechota idzie pod wieżę tylko
/// wtedy, `:8089`) zwraca `false`. K5LOOP-SIEGE-ATK-B (T2b): bramka jest liczona w [`ProdBody::move_step_core`] z
/// zagrożeniami `_siegeShooterThreats` (dawny tag `oblezenie-odmowa-ruchu` zdjęty); odmowa = `DoMoveGate::Refused`.
struct ProdSiegeWalk<'a, R: RollSource> {
    body: &'a mut ProdBody<R>,
    unit: UnitRef,
    scene: AtkSiegeScene,
    goal: AtkGoal,
    pref_row: Option<i64>,
    finished: bool,
    enemies: &'a [EnemyRef],
    mounted: bool,
    now0: f64,
    moves: u32,
    missing: Cell<bool>,
}

impl<R: RollSource> ProdSiegeWalk<'_, R> {
    fn occupied(&self, c: i64, r: i64) -> bool {
        self.body
            .occ_by_key
            .contains_key(&cell_key(c as f64, r as f64))
    }
}

impl<R: RollSource> WalkWorld for ProdSiegeWalk<'_, R> {
    fn finished(&self) -> bool {
        self.finished
    }

    fn is_goal(&self, col: i64, row: i64) -> bool {
        goal_holds(
            &self.scene,
            &|c, r| self.occupied(c, r),
            self.goal,
            col,
            row,
        )
    }

    fn passable_free(&self, col: i64, row: i64) -> bool {
        if self.occupied(col, row) {
            return false;
        }
        match self.body.terrain.as_deref() {
            Some(t) => unit_move_cost(t, self.mounted, col as f64, row as f64).is_finite(),
            None => {
                self.missing.set(true);
                false
            }
        }
    }

    fn pref_row(&self) -> Option<i64> {
        self.pref_row
    }

    fn do_move(&mut self, unit: &mut WalkUnit, col: i64, row: i64) -> DoMoveGate {
        // Każdy kolejny krok poprzedza `_schedule(STEP_GAP_MS)` (`:8017`): `t0` kroku k = k * (MOVE + GAP).
        self.body.now = self.now0 + f64::from(self.moves) * (MOVE_STEP_MS + f64::from(STEP_GAP_MS));
        match self.body.move_step_core(
            self.unit,
            col,
            row,
            false,
            unit.move_left,
            None,
            self.enemies,
        ) {
            // K5LOOP-SIEGE-ATK-B: odmowa bramki muru (`:8689-8692`) liczona w `move_step_core`.
            Ok(res) if res.outcome.done => DoMoveGate::Refused,
            Ok(res) => {
                unit.q = col;
                unit.r = row;
                unit.move_left = res.move_left;
                self.moves += 1;
                DoMoveGate::Proceed
            }
            Err(MissingTerrain) => {
                self.missing.set(true);
                DoMoveGate::Refused
            }
        }
    }
}

impl<R: RollSource> ProdBody<R> {
    /// K5LOOP-SIEGE-ATK-A: pola `this` gałęzi atakującego (`siegeWallCol`, brama, `wallTileHp.has`, `towerAtWallRows`).
    fn atk_scene(&self, wall_col: i64) -> AtkSiegeScene {
        AtkSiegeScene {
            wall_col,
            gate_col: self.siege_gate_col,
            gate_row: self.siege_gate_row,
            gate_open: self.scene.gate_open,
            wall_tile_rows: self.scene.wall_tile_hp.iter().map(|&(r, _)| r).collect(),
            tower_rows: self.tower_at_wall_rows.clone(),
        }
    }

    fn atk_flags(a: &ActivateUnit) -> AtkUnitFlags {
        AtkUnitFlags {
            side_atk: a.side_atk,
            on_wall_walkway: a.on_wall_walkway,
            mounted: a.mounted,
            is_siege_unit: a.is_siege_unit,
            is_siege_tower: a.is_siege_tower,
            is_ram: a.is_ram,
            primary_ranged: a.primary_ranged,
            can_shoot: a.can_shoot,
            shooting_disabled: a.shooting_disabled,
        }
    }

    /// K5LOOP-SIEGE-ATK-A: decyzje `_trySiegeTowerClimb`, `_siegeInfantryToTowerStep`, `_siegeRamTowerStep` (wartości
    /// zwracane maszynie K5H) z pozycji i zajętości na starcie aktywacji.
    fn siege_atk_plan(&self, unit: UnitRef, wall_col: i64) -> ProdAtkPlan {
        let a = &self.units[side_ix(unit.side)][unit.idx].activate;
        let flags = Self::atk_flags(a);
        let scene = self.atk_scene(wall_col);
        let occ = |c: i64, r: i64| self.occ_by_key.contains_key(&cell_key(c as f64, r as f64));
        let missing = Cell::new(false);
        let passable = |c: i64, r: i64| {
            if occ(c, r) {
                return false;
            }
            match self.terrain.as_deref() {
                Some(t) => unit_move_cost(t, a.mounted, c as f64, r as f64).is_finite(),
                None => {
                    missing.set(true);
                    false
                }
            }
        };
        let climb = tower_climb_allowed(&scene, &occ, flags, a.q, a.r);
        let infantry = infantry_to_tower_plan(&scene, &occ, &passable, flags, a.q, a.r);
        let infantry_missing = missing.replace(false);
        let ram = ram_tower_plan(&scene, &occ, &passable, flags, a.q, a.r);
        let ram_missing = missing.get();
        ProdAtkPlan {
            climb,
            infantry,
            infantry_missing,
            ram,
            ram_missing,
        }
    }

    /// K5LOOP-SIEGE-ATK-A: `_trySiegeTowerClimb` (`battleScene.ts:8067-8082`) po decyzji `true`: zwolnienie pola,
    /// `ru.q = wallCol`, `onWallWalkway = true`, pierwszy wyłom przez wieżę (`attackerWallEntryIsBreach`,
    /// `city-fortification.ts:96-98`: `wallEverBreached = true` + wpis dziennika), zajęcie korony, `moveLeft = 0`,
    /// `done()` synchronicznie (czas 0). Akcje: `Log` (jeśli wyłom), potem `ClimbWall`.
    fn siege_atk_climb(&mut self, unit: UnitRef, wall_col: i64) -> AtkRun {
        let ix = side_ix(unit.side);
        let (q, r) = self.cell_of(unit);
        self.occ_by_key.remove(&cell_key(q as f64, r as f64));
        let side_atk = {
            let a = &mut self.units[ix][unit.idx].activate;
            a.q = wall_col;
            a.on_wall_walkway = true;
            a.side_atk
        };
        if attacker_wall_entry_is_breach(side_atk, true) && !self.wall_ever_breached {
            self.wall_ever_breached = true;
            self.emit(BattleAction::Log {
                text: WYLOM_LOG.to_string(),
            });
        }
        self.occ_by_key
            .insert(cell_key(wall_col as f64, r as f64), unit_tag(unit));
        self.emit(BattleAction::ClimbWall {
            unit,
            from: (q, r),
            to: (wall_col, r),
        });
        AtkRun {
            dur: 0.0,
            move_left: Some(0.0),
            tag: None,
        }
    }

    /// K5LOOP-SIEGE-ATK-A: `_siegeInfantryToTowerStep` (`:8097-8100`) po decyzji `true`: czekanie przy wieży (`done()`)
    /// albo `_siegeWalkTo(ru, goal, done)`.
    fn siege_atk_infantry(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
        wall_col: i64,
        plan: &ProdAtkPlan,
        enemies: &[EnemyRef],
    ) -> AtkRun {
        if plan.infantry_missing {
            return AtkRun::tagged("piechota-do-wiezy-brak-terenu");
        }
        match plan.infantry {
            InfantryPlan::NotHandled | InfantryPlan::Wait => AtkRun::idle(),
            InfantryPlan::Walk(goal) => {
                self.siege_atk_walk(unit, st, wall_col, goal, None, None, enemies)
            }
        }
    }

    /// K5LOOP-SIEGE-ATK-A: `_siegeRamTowerStep` (`:8022-8054`) po decyzji `true`.
    fn siege_atk_ram_tower(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
        wall_col: i64,
        plan: &ProdAtkPlan,
        enemies: &[EnemyRef],
    ) -> AtkRun {
        if plan.ram_missing {
            return AtkRun::tagged("taran-wieza-brak-terenu");
        }
        match plan.ram {
            RamTowerPlan::NotHandled => AtkRun::idle(),
            // `_attackGate(ru, done)` (`:7310`): obrażenia bramy, animacja taranu, wyłom bramy = T2b.
            // K5LOOP-SIEGE-ATK-B (T2b): `_attackGate(ru, done)` (`:7310-7335`).
            RamTowerPlan::AttackGate => self.siege_atk_gate(unit),
            RamTowerPlan::AtWall { row } => {
                self.tower_at_wall_rows.insert(row);
                AtkRun::idle()
            }
            RamTowerPlan::Walk {
                goal,
                pref_row,
                arrive_base,
            } => self.siege_atk_walk(unit, st, wall_col, goal, pref_row, arrive_base, enemies),
            RamTowerPlan::AdvanceToward {
                col,
                row,
                arrive_base,
            } => self.siege_atk_advance_toward(unit, st, wall_col, col, row, arrive_base, enemies),
        }
    }

    /// K5LOOP-SIEGE-ATK-A: `_siegeWalkTo(ru, goal, done|arrive, undefined, prefRow)` (`:8006-8019`) przez pętlę K1b
    /// [`siege_walk_to`] i adapter [`ProdSiegeWalk`]. Czas: `MOVE_STEP_MS` na krok + `STEP_GAP_MS` na każdy `_schedule`
    /// (nominalnie, jak [`Self::advance_step`]). `arrive_base` = callback `arrive` wieży (`:8044-8047`), wykonywany przy
    /// `done()` marszu: `if (ru.q >= wallBase) towerAtWallRows.add(ru.r)`.
    #[allow(clippy::too_many_arguments)]
    fn siege_atk_walk(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
        wall_col: i64,
        goal: AtkGoal,
        pref_row: Option<i64>,
        arrive_base: Option<i64>,
        enemies: &[EnemyRef],
    ) -> AtkRun {
        let ix = side_ix(unit.side);
        let a = self.units[ix][unit.idx].activate.clone();
        let seq = st.unit(unit).c;
        let mut wu = WalkUnit {
            q: a.q,
            r: a.r,
            move_left: seq.move_left,
            dead: seq.dead,
            fading_out: seq.fading_out,
        };
        let now0 = self.now;
        let scene = self.atk_scene(wall_col);
        let (events, moves, missing) = {
            let mut world = ProdSiegeWalk {
                body: self,
                unit,
                scene,
                goal,
                pref_row,
                finished: st.finished,
                enemies,
                mounted: a.mounted,
                now0,
                moves: 0,
                missing: Cell::new(false),
            };
            let ev = siege_walk_to(&mut world, &mut wu);
            (ev, world.moves, world.missing.get())
        };
        self.now = now0;
        let schedules = events
            .iter()
            .filter(|e| matches!(e, WalkEvent::Schedule { .. }))
            .count() as f64;
        let dur = f64::from(moves) * MOVE_STEP_MS + schedules * f64::from(STEP_GAP_MS);
        // Odmowa bramki muru (`WalkEvent::Refused`): `ru.moveLeft = 0` (`:8690`) także bez wcześniejszego kroku.
        let refused = events
            .iter()
            .any(|e| matches!(e, WalkEvent::Refused { .. }));
        let move_left = (moves > 0 || refused).then_some(wu.move_left);
        if missing {
            return AtkRun {
                dur,
                move_left,
                tag: Some("marsz-brak-terenu"),
            };
        }
        if let Some(base) = arrive_base {
            if wu.q >= base {
                self.tower_at_wall_rows.insert(wu.r);
            }
        }
        AtkRun {
            dur,
            move_left,
            tag: None,
        }
    }

    /// K5LOOP-SIEGE-ATK-A: `_advanceToward(ru, col, row, done|arrive)` (`battleScene.ts:7892-7916`): preludium
    /// (`finished`, `dead`/`fadingOut`, `moveLeft <= 0`; `NaN` nie kończy), jeden zachłanny krok
    /// ([`advance_toward_pick`]: `_moveCostForUnit === Infinity` odrzuca, `NaN` NIE), `_doMove` (bramka jak w
    /// [`ProdSiegeWalk`]), potem `done`/`arrive` (`arrive_base`, `:8044-8047`). Bez [`MoveTerrain`] przy wymaganym
    /// odczycie kosztu: jawny tag `marsz-brak-terenu`.
    #[allow(clippy::too_many_arguments)]
    fn siege_atk_advance_toward(
        &mut self,
        unit: UnitRef,
        st: &TurnSeqState,
        wall_col: i64,
        col: i64,
        row: i64,
        arrive_base: Option<i64>,
        enemies: &[EnemyRef],
    ) -> AtkRun {
        let ix = side_ix(unit.side);
        let a = self.units[ix][unit.idx].activate.clone();
        let seq = st.unit(unit).c;
        let arrive = |body: &mut Self, run: AtkRun| -> AtkRun {
            if let Some(base) = arrive_base {
                let (q, r) = body.cell_of(unit);
                if q >= base {
                    body.tower_at_wall_rows.insert(r);
                }
            }
            run
        };
        if st.finished || seq.dead || seq.fading_out || seq.move_left <= 0.0 {
            return arrive(self, AtkRun::idle());
        }
        let Some(terrain) = self.terrain.as_deref() else {
            return AtkRun::tagged("marsz-brak-terenu");
        };
        let occ = |c: i64, r: i64| self.occ_by_key.contains_key(&cell_key(c as f64, r as f64));
        let cost_inf = |c: i64, r: i64| {
            unit_move_cost(terrain, a.mounted, c as f64, r as f64) == f64::INFINITY
        };
        let Some((nc, nr)) = advance_toward_pick(a.q, a.r, col, row, &cost_inf, &occ) else {
            return arrive(self, AtkRun::idle());
        };
        let _ = wall_col;
        // `_doMove` (bramka muru `:8689` w `move_step_core`; odmowa = `moveLeft = 0`, `done`/`arrive` od razu).
        let Ok(res) = self.move_step_core(unit, nc, nr, false, seq.move_left, None, enemies) else {
            return AtkRun::tagged("marsz-brak-terenu");
        };
        arrive(
            self,
            AtkRun {
                dur: step_ms(&res),
                move_left: Some(res.move_left),
                tag: None,
            },
        )
    }
}

/// K5LOOP-SIEGE-ATK-B (T2b): kafel wyburzony w trakcie bitwy (`tiles[idx] = BTerrain.Plains`, `_breachWallTile` `:7644`,
/// `_breachGate` `:7770`). Nakładka na teren ciała: pole `(col, row)` przechodnie, koszt `MOVE_COST[Plains] = 1`
/// (`battle-terrain.ts:139`), bez brodu; mnożnik jazdy z warstwy niżej (nazwa terenu walki muru i bramy to już
/// `'Plaskie (rownina/laka)'`, `battle-terrain.ts:157-158`, ta sama co `Plains`). Pozostałe pola bez zmian.
struct PlainsCell {
    inner: Box<dyn MoveTerrain>,
    col: f64,
    row: f64,
}

impl PlainsCell {
    fn hit(&self, col: f64, row: f64) -> bool {
        col == self.col && row == self.row
    }
}

impl MoveTerrain for PlainsCell {
    fn passable(&self, col: f64, row: f64) -> bool {
        self.hit(col, row) || self.inner.passable(col, row)
    }
    fn move_cost(&self, col: f64, row: f64) -> f64 {
        if self.hit(col, row) {
            1.0
        } else {
            self.inner.move_cost(col, row)
        }
    }
    fn is_ford(&self, col: f64, row: f64) -> bool {
        !self.hit(col, row) && self.inner.is_ford(col, row)
    }
    fn cavalry_multiplier(&self, col: f64, row: f64) -> f64 {
        self.inner.cavalry_multiplier(col, row)
    }
}

impl<R: RollSource> ProdBody<R> {
    /// K5LOOP-SIEGE-ATK-B (T2b): `_meleeBlockedByWall(ru, e)` (`battleScene.ts:8361-8371`, `city-fortification.ts:76-79`)
    /// dla jednostki `me` i wroga o indeksie `enemy` w liście strony przeciwnej. Bez muru `false`.
    fn melee_blocked_for(&self, me: UnitRef, enemy: usize) -> bool {
        let wall_col = self.seq_wall_col.max(self.scene.wall_col);
        if wall_col < 0 {
            return false;
        }
        let a = &self.units[side_ix(me.side)][me.idx].activate;
        let Some(e) = self.units[side_ix(opposite(me.side))].get(enemy) else {
            return false;
        };
        melee_blocked_by_wall(MeleeWallContext {
            attacker_is_melee: !a.can_shoot && !a.is_siege_unit,
            attacker_on_wall: a.on_wall_walkway,
            defender_on_wall: e.activate.on_wall_walkway,
            wall_breached: self.wall_ever_breached,
        })
    }

    /// Flagi [`Self::melee_blocked_for`] dla wszystkich wrogów `me` (indeksy listy strony przeciwnej).
    fn melee_blocked_list(&self, me: UnitRef) -> Vec<bool> {
        (0..self.units[side_ix(opposite(me.side))].len())
            .map(|i| self.melee_blocked_for(me, i))
            .collect()
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): `_attackGate(ru, done)` (`battleScene.ts:7310-7335`) wołane z `_siegeRamTowerStep`
    /// (`:8028`): strażnik `gateOpen || siegeGateCol < 0` (`:7311`) = `done()`; obrażenia `_siegeStructureDamage(ru)`
    /// (`:7314`, wejście adaptera [`Self::siege_stats`]); animacja taranu (`_animateRam`, akcja [`BattleAction::Ram`]);
    /// `gateHp = max(0, gateHp - dmg)` ([`BattleAction::GateDamage`]); przy `gateHp <= 0` `_breachGate()`
    /// ([`Self::breach_gate_scene`]); `done()` synchronicznie (czas 0). Pętla morale obrońców `_breachGate` (`:7803-7810`)
    /// zmienia `TurnSeqState`, więc wykonuje ją `complete` tej aktywacji ([`Self::gate_breach_morale`]).
    fn siege_atk_gate(&mut self, unit: UnitRef) -> AtkRun {
        if self.scene.gate_open || self.siege_gate_col < 0 {
            return AtkRun::idle();
        }
        let Some(stats) = self.siege_stats[side_ix(unit.side)][unit.idx] else {
            return AtkRun::tagged("atak-bramy-bez-szablonu");
        };
        let dmg = siege_structure_damage(&stats);
        let until = self.now + RAM_ANIM_MS;
        self.emit(BattleAction::Ram { unit, until });
        self.gate_hp = js_max0(self.gate_hp - dmg);
        let hp_after = self.gate_hp;
        self.emit(BattleAction::GateDamage { dmg, hp_after });
        if self.gate_hp <= 0.0 {
            self.breach_gate_scene();
            self.pending_gate_breach = true;
        }
        AtkRun::idle()
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): `_breachGate()` (`battleScene.ts:7757-7801`), część sceny: `gateOpen = true`,
    /// `wallEverBreached = true`, kafle bramy `(siegeGateCol, siegeGateRow - 1 .. siegeGateRow)` -> `Plains` (`:7763-7772`,
    /// w zakresie `tiles`; `_carveWallTiles` stawia tam zawsze `BTerrain.Gate`, `:4061-4063`), akcja
    /// [`BattleAction::GateBreach`]. Bez terenu ciała (`tiles` nieobecne) kafle bez zmian, jak w pinie.
    fn breach_gate_scene(&mut self) {
        self.scene.gate_open = true;
        self.wall_ever_breached = true;
        if self.siege_gate_col >= 0 {
            let (gc, gr) = (self.siege_gate_col, self.siege_gate_row);
            for r in [gr - 1, gr] {
                if tile_index_in_bounds(gc, r) {
                    self.plains_cell(gc, r);
                }
            }
        }
        self.emit(BattleAction::GateBreach);
    }

    /// Nakładka [`PlainsCell`] na teren ciała (brak terenu = bez zmian).
    fn plains_cell(&mut self, col: i64, row: i64) {
        if let Some(inner) = self.terrain.take() {
            self.terrain = Some(Box::new(PlainsCell {
                inner,
                col: col as f64,
                row: row as f64,
            }));
        }
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): pętla morale `_breachGate` (`battleScene.ts:7803-7810`): każdy żywy obrońca (bez
    /// `dead`/`fadingOut`/`routed`) traci [`MORALE_GATE_BREACH`] (`Math.max(0, …)`), potem `_checkRout`.
    fn gate_breach_morale(&mut self, st: &mut TurnSeqState) {
        self.def_breach_morale(st, MORALE_GATE_BREACH);
    }

    fn def_breach_morale(&mut self, st: &mut TurnSeqState, loss: f64) {
        for idx in 0..st.def.len() {
            let u = UnitRef {
                side: BattleSide::Defender,
                idx,
            };
            let c = st.unit(u).c;
            if c.dead || c.fading_out || c.routed {
                continue;
            }
            let uc = unit_cu_mut(st, u);
            uc.morale = js_max0(uc.morale - loss);
            self.check_rout(st, u);
        }
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): `_attackWallTile(ru, wallRow, done)` (`battleScene.ts:7540-7568`): obrażenia z
    /// [`Self::siege_stats`] ([`wall_tile_damage`]), kamień ([`BattleAction::Boulder`]), trafienie zaplanowane
    /// `_schedule(700, …)` (odroczone wywołanie [`LoopBody::take_timers`]), `done()` synchronicznie (czas 0).
    fn siege_atk_wall_tile(&mut self, unit: UnitRef, row: i64) -> AtkRun {
        let Some(stats) = self.siege_stats[side_ix(unit.side)][unit.idx] else {
            return AtkRun::tagged("atak-muru-bez-szablonu");
        };
        let dmg = wall_tile_damage(&stats);
        let land_at = self.now + WALL_HIT_FLY_MS;
        self.emit(BattleAction::Boulder { unit, row, land_at });
        let id = self.next_timer;
        self.next_timer += 1;
        self.timers.push((WALL_HIT_FLY_MS, id));
        self.boulders.push((id, unit, row, dmg));
        AtkRun::idle()
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): callback `_schedule(700)` z `_attackWallTile` (`battleScene.ts:7555-7565`):
    /// `curHp = wallTileHp.get(row) ?? 0`, `newHp = max(0, curHp - dmg)`, `wallTileHp.set` (istniejący klucz zostaje na
    /// swoim miejscu w kolejności mapy, nowy na końcu), `lastAttackedWallRow`, etykieta ([`BattleAction::WallDamage`]),
    /// przy `newHp <= 0` `_breachWallTile(row)` ([`Self::breach_wall_tile`]).
    fn boulder_hit(&mut self, st: &mut TurnSeqState, unit: UnitRef, row: i64, dmg: f64) {
        let cur = self
            .scene
            .wall_tile_hp
            .iter()
            .find(|(r, _)| *r == row)
            .map_or(0.0, |&(_, hp)| hp);
        let new_hp = js_max0(cur - dmg);
        match self.scene.wall_tile_hp.iter_mut().find(|(r, _)| *r == row) {
            Some(e) => e.1 = new_hp,
            None => self.scene.wall_tile_hp.push((row, new_hp)),
        }
        self.last_attacked_wall_row = row;
        self.emit(BattleAction::WallDamage {
            row,
            dmg,
            hp_after: new_hp,
        });
        if new_hp <= 0.0 {
            self.breach_wall_tile(st, unit, row);
        }
    }

    /// K5LOOP-SIEGE-ATK-B (T2b): `_breachWallTile(wallRow)` (`battleScene.ts:7638-7750`):
    /// strażnik `if (!tiles) return;` (`:7640`: bez terenu ciała jawny tag `wylom-brak-terenu` na jednostce, która
    /// strzelała, i brak skutków, jak w pinie); kafel `Plains` (w zakresie `tiles`, `:7642-7645`); `wallTileHp.delete`;
    /// `wallEverBreached = true`; `_destroyTowerAtRow` ([`BattleAction::TowerDestroyed`] + wpis dziennika);
    /// [`BattleAction::WallBreach`]; obrońcy na wyburzonym kaflu (`onWallWalkway`, `u.r === wallRow && u.q === wallCol`,
    /// w kolejności `this.def`): katapulta `_startFade`, reszta schodzi z muru ([`wall_retreat_cell`],
    /// [`BattleAction::LeaveField`], `onWallWalkway = false`; `_applyTerrainRange(u)` = zasięg z wejścia adaptera, jak w
    /// całym ciele); na końcu pętla morale `-MORALE_WALL_BREACH` z `_checkRout` (`:7745-7750`).
    fn breach_wall_tile(&mut self, st: &mut TurnSeqState, shooter: UnitRef, row: i64) {
        if self.terrain.is_none() {
            self.unported.push((shooter, "wylom-brak-terenu"));
            return;
        }
        let wall_col = self.seq_wall_col.max(self.scene.wall_col);
        if tile_index_in_bounds(wall_col, row) {
            self.plains_cell(wall_col, row);
        }
        self.scene.wall_tile_hp.retain(|&(r, _)| r != row);
        self.wall_ever_breached = true;
        if let Some(t) = self
            .siege_towers
            .iter_mut()
            .find(|t| t.row == row as f64 && !t.destroyed)
        {
            t.destroyed = true;
            self.emit(BattleAction::TowerDestroyed { row });
            self.emit(BattleAction::Log {
                text: tower_destroyed_log(row),
            });
        }
        self.emit(BattleAction::WallBreach { row });
        for idx in 0..st.def.len() {
            let u = UnitRef {
                side: BattleSide::Defender,
                idx,
            };
            let c = st.unit(u).c;
            if c.dead || c.fading_out || c.routed {
                continue;
            }
            let a = &self.units[1][idx].activate;
            if !(a.on_wall_walkway && a.r == row && a.q == wall_col) {
                continue;
            }
            if a.is_catapult {
                self.start_fade(st, u);
                continue;
            }
            let from = (a.q, a.r);
            let to = {
                let terrain = self.terrain.as_deref().expect("teren sprawdzony wyzej");
                let occ = &self.occ_by_key;
                let occupied = |c: i64, r: i64| occ.contains_key(&cell_key(c as f64, r as f64));
                let passable = |c: i64, r: i64| terrain.passable(c as f64, r as f64);
                wall_retreat_cell(wall_col, row, &occupied, &passable)
            };
            if let Some((c2, r2)) = to {
                self.occ_by_key
                    .remove(&cell_key(from.0 as f64, from.1 as f64));
                let a = &mut self.units[1][idx].activate;
                a.q = c2;
                a.r = r2;
                self.occ_by_key
                    .insert(cell_key(c2 as f64, r2 as f64), unit_tag(u));
            }
            self.units[1][idx].activate.on_wall_walkway = false;
            // `_applyTerrainRange(u)` po zejściu z korony (`:7740`): podwojenie zasięgu znika.
            self.refresh_terrain_range(BattleSide::Defender, idx);
            self.emit(BattleAction::LeaveField {
                unit: u,
                from,
                to: to.unwrap_or(from),
            });
        }
        self.def_breach_morale(st, MORALE_WALL_BREACH);
    }
}

#[cfg(test)]
mod tower_target_tests {
    //! WIEZE-2B1: wybór celu wieży odbywa się W CHWILI WYSTRZAŁU (web `_fireOneTower` → `pickTowerTarget`), a nie przy
    //! planowaniu. Testy sprawdzają `pick_tower_for_row` na stanie z chwili wystrzału.
    use super::*;
    use crate::domain::siege_tactics_turnseq::SeqUnit;
    use std::collections::BTreeSet;

    struct Cells(Vec<Option<(i64, i64)>>);

    impl LoopBody for Cells {
        fn start(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> f64 {
            0.0
        }
        fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
        fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
            match unit.side {
                BattleSide::Attacker => self.0.get(unit.idx).copied().flatten(),
                BattleSide::Defender => None,
            }
        }
    }

    fn cu(hp: f64) -> CombatUnit {
        CombatUnit {
            hp,
            morale: 100.0,
            flee_morale: 0.0,
            move_left: 0.0,
            never_rout: false,
            dead: false,
            fading_out: false,
            routed: false,
            removed: false,
            acted: false,
        }
    }

    fn state(hps: &[f64]) -> TurnSeqState {
        TurnSeqState {
            atk: hps
                .iter()
                .enumerate()
                .map(|(i, &hp)| SeqUnit {
                    id: i as u64,
                    c: cu(hp),
                })
                .collect(),
            def: Vec::new(),
            turn_order: Vec::new(),
            turn_idx: 0,
            round_no: 0,
            siege_wall_col: 5,
            manual_mode: false,
            player_side: BattleSide::Attacker,
            finished: false,
            awaiting_orders: false,
            auto_battle_suspended: false,
            busy: false,
            auto_batch_planning: false,
            queued_order_ids: BTreeSet::new(),
        }
    }

    fn env(cells: Vec<Option<(i64, i64)>>) -> SiegeEnv<Cells> {
        SiegeEnv {
            body: Cells(cells),
            tower_rows: vec![3],
            pending_tower_shots: Vec::new(),
            tower_range: 2.0,
            tower_shot: Some(neutral_tower_shot_template()),
            wall_tile_rows: vec![3],
            wall_ever_breached: false,
            no_breach_cap: 0,
            move_points: [Vec::new(), Vec::new()],
            morale_max: [Vec::new(), Vec::new()],
        }
    }

    #[test]
    fn nearest_in_range_wins_with_hp_tie_break() {
        // Wieża (5,3), zasięg 2. A0 (7,3) d=2 hp 10; A1 (6,4) d=2 hp 4 (remis, mniejsze HP wygrywa); A2 poza zasięgiem.
        let st = state(&[10.0, 4.0, 3.0]);
        let e = env(vec![Some((7, 3)), Some((6, 4)), Some((9, 9))]);
        assert_eq!(e.pick_tower_for_row(&st, 3, 0.0), Some(1));
    }

    #[test]
    fn unit_without_cell_is_skipped() {
        // A0 najbliżej (6,3), ale bez pozycji: cel to A1 (7,3).
        let st = state(&[1.0, 10.0]);
        let e = env(vec![None, Some((7, 3))]);
        assert_eq!(e.pick_tower_for_row(&st, 3, 0.0), Some(1));
    }

    #[test]
    fn target_is_chosen_at_shot_time_not_at_planning() {
        // Planowanie nie wybiera celu: stan zmieniony PO planowaniu (A1 pada) wpływa na wybór w chwili wystrzału.
        let mut st = state(&[10.0, 4.0]);
        let mut e = env(vec![Some((7, 3)), Some((6, 4))]);
        e.fire_siege_towers(&mut st);
        assert_eq!(e.pending_tower_shots.len(), 1);
        assert_eq!(e.pick_tower_for_row(&st, 3, 0.0), Some(1));
        st.atk[1].c.dead = true;
        assert_eq!(e.pick_tower_for_row(&st, 3, 0.0), Some(0));
    }

    #[test]
    fn no_target_in_range_returns_none() {
        let st = state(&[10.0]);
        let e = env(vec![Some((9, 9))]);
        assert_eq!(e.pick_tower_for_row(&st, 3, 0.0), None);
    }
}

#[cfg(test)]
mod prod_tag_tests {
    //! Obrona r1 K5LOOP-SIEGE-ATK-A (zarzut 3): `_advanceToward` spoza atakującego przy murze nie jest pomijane po cichu.
    use super::*;

    #[test]
    fn advance_toward_outside_siege_atk_has_explicit_tag() {
        assert_eq!(
            prod_tag(ActivateEvent::AdvanceToward { col: 3, row: 4 }),
            "marsz-poza-oblezeniem"
        );
        // K5LOOP-SIEGE-ATK-B (D-INT-2): `_attackWallTile` przy murze wykonuje ciało (`siege_atk_wall_tile`); `prod_tag`
        // zostaje tylko dla zdarzenia poza atakującym przy murze (dawniej `atak-muru`, nazwa jak `marsz-poza-oblezeniem`).
        assert_eq!(
            prod_tag(ActivateEvent::AttackWallTile { row: 4 }),
            "atak-muru-poza-oblezeniem"
        );
    }
}

#[cfg(test)]
mod plains_cell_tests {
    //! Obrona r1 K5LOOP-SIEGE-ATK-B (zarzut 2, E21/E22): nakładka [`PlainsCell`] = pin `tiles[idx] = BTerrain.Plains`
    //! (`_breachWallTile` `battleScene.ts:7644`, `_breachGate` `:7770`). Pin NADPISUJE typ kafla, więc każdy odczyt
    //! terenu na tym polu widzi `Plains` niezależnie od tego, co było pod spodem: przejezdny, `moveCost =
    //! MOVE_COST[Plains] = 1` (`battle-terrain.ts:139`, `:795`), `isFordTile` (`battleScene.ts:1897`) = `at(c, r) === Ford` fałsz
    //! (`battle-terrain.ts:42`). Warstwa niżej jest celowo „najgorsza” (nieprzejezdna, koszt 3, bród, mnożnik jazdy 2),
    //! żeby każdą regułę nakładki rozstrzygała nakładka, a nie teren pod spodem.
    use super::*;

    struct WorstTerrain;

    impl MoveTerrain for WorstTerrain {
        fn passable(&self, _col: f64, _row: f64) -> bool {
            false
        }
        fn move_cost(&self, _col: f64, _row: f64) -> f64 {
            3.0
        }
        fn is_ford(&self, _col: f64, _row: f64) -> bool {
            true
        }
        fn cavalry_multiplier(&self, _col: f64, _row: f64) -> f64 {
            2.0
        }
    }

    fn breached(col: f64, row: f64) -> PlainsCell {
        PlainsCell {
            inner: Box::new(WorstTerrain),
            col,
            row,
        }
    }

    #[test]
    fn wyburzony_kafel_jest_rownina_jak_pin() {
        let t = breached(30.0, 7.0);
        assert!(t.passable(30.0, 7.0));
        assert_eq!(t.move_cost(30.0, 7.0), 1.0, "MOVE_COST[Plains]");
        assert!(!t.is_ford(30.0, 7.0), "Plains nie jest brodem");
        // Mnożnik jazdy: nazwa terenu walki muru/bramy i Plains jest ta sama (`battle-terrain.ts:151,157-158`).
        assert_eq!(t.cavalry_multiplier(30.0, 7.0), 2.0);
        for (c, r) in [(30.0, 8.0), (31.0, 7.0), (29.0, 7.0), (30.0, 6.0)] {
            assert!(!t.passable(c, r));
            assert_eq!(t.move_cost(c, r), 3.0);
            assert!(t.is_ford(c, r));
        }
        // Dwa kafle bramy (`gr - 1` i `gr`, `:7768-7772`): obie nakładki działają, reszta bez zmian.
        let two = PlainsCell {
            inner: Box::new(t),
            col: 30.0,
            row: 8.0,
        };
        for r in [7.0, 8.0] {
            assert!(two.passable(30.0, r));
            assert_eq!(two.move_cost(30.0, r), 1.0);
            assert!(!two.is_ford(30.0, r));
        }
        assert!(!two.passable(30.0, 9.0));
        assert_eq!(two.move_cost(30.0, 9.0), 3.0);
        assert!(two.is_ford(30.0, 9.0));
    }

    /// Koszt kroku przez wyburzony kafel w `_doMove` (`ProdMoveWorld::move_cost` = [`unit_move_cost`] nad terenem ciała,
    /// pin `_moveCostForUnit` `:7436-7444`): piechota płaci `MOVE_COST[Plains] = 1`, jazda `1 × mnożnik`; pole obok
    /// zostaje nieprzejezdne (`Infinity`).
    #[test]
    fn krok_przez_wyburzony_kafel_placi_koszt_rowniny() {
        let t = breached(30.0, 7.0);
        assert_eq!(unit_move_cost(&t, false, 30.0, 7.0), 1.0);
        assert_eq!(unit_move_cost(&t, true, 30.0, 7.0), 2.0);
        assert_eq!(unit_move_cost(&t, false, 31.0, 7.0), f64::INFINITY);
    }
}

#[cfg(test)]
mod pin3_timeline_tests {
    //! PIN3-DIVERGENCE-Q1 (D-PIN3-2, D-PIN3-5): oś czasu ciała w kolejności klatki pinu. W `_runFastForward`
    //! (`battleScene.ts:9427-9435`) zegary z `due <= vNow` (`_drainTimers`, np. trafienie wieży `:4262`) wykonują się PRZED
    //! kolejką kroków animacji `_raf` (kolejne kroki `_doMove`, `:8714-8757`) tej samej klatki; pierwszy krok marszu jest
    //! wołany synchronicznie z `_activateUnit` (w chwili wywołania ciała).
    use super::*;
    use crate::domain::siege_tactics_activate::ActivateUnit;
    use crate::domain::siege_tactics_blow::SequenceRolls;

    fn unit_at(q: i64) -> ProdUnit {
        ProdUnit {
            activate: ActivateUnit {
                side_atk: true,
                q,
                r: 0,
                dead: false,
                fading_out: false,
                routed: false,
                never_rout: false,
                surround_applied: false,
                morale: 100.0,
                flee_morale: 0.0,
                terrain_defence_mult: 1.0,
                range: 1.0,
                on_wall_walkway: false,
                primary_ranged: false,
                mounted: false,
                phalanx: false,
                shooting_disabled: false,
                dry_col: 0.0,
                held_after_fallback: false,
                player_order_none: true,
                can_shoot: false,
                is_siege_unit: false,
                is_siege_tower: false,
                is_ram: false,
                is_catapult: false,
                doctrine_auto: false,
                doctrine_manual: false,
            },
            melee_target: None,
            blow: None,
            counter_blows: Vec::new(),
            body_ms: 0.0,
            facing: 0.0,
        }
    }

    fn body() -> ProdBody<SequenceRolls> {
        let scene = ActivateScene {
            finished: false,
            manual_mode: false,
            is_player_side: false,
            wall_col: -1,
            gate_open: false,
            wall_tile_hp: Vec::new(),
            siege_machine_range: 0.0,
        };
        let mut b = ProdBody::new([vec![unit_at(0)], vec![unit_at(5)]], scene, SequenceRolls::new(Vec::new()));
        b.pin_blow_timing = true;
        b
    }

    const A0: UnitRef = UnitRef {
        side: BattleSide::Attacker,
        idx: 0,
    };

    #[test]
    fn krok_w_tej_samej_chwili_co_zegar() {
        // Krok z kolejki `_raf` w chwili zegara: jeszcze niewykonany; krok synchroniczny: wykonany.
        assert!(!timeline_done(100.0, false, 100.0));
        assert!(timeline_done(100.0, true, 100.0));
        assert!(timeline_done(99.0, false, 100.0));
        assert!(!timeline_done(101.0, true, 100.0));
    }

    #[test]
    fn rozbicie_w_trakcie_marszu_nie_cofa_zwrotu_z_pozniejszego_kroku() {
        let mut b = body();
        // `start` aktywacji w 1000 ms: krok marszu z `_raf` w 1310 obraca jednostkę na 2.
        b.set_now(1000.0);
        b.now = 1310.0;
        b.set_facing(A0, 2.0);
        b.now = 1000.0;
        // Trafienie wieży w 1100 ms rozbija jednostkę (`_startRout` `:9818`: atakujący W = 3).
        b.set_now(1100.0);
        b.set_facing(A0, 3.0);
        assert_eq!(b.facing(A0), 2.0, "bieżący zwrot = po ostatnim kroku marszu");
        assert_eq!(b.facing_at(A0, 1050.0), 0.0);
        assert_eq!(b.facing_at(A0, 1200.0), 3.0);
        assert_eq!(b.facing_at(A0, 1400.0), 2.0);
    }

    #[test]
    fn zegar_i_krok_w_tej_samej_chwili_krok_wygrywa() {
        let mut b = body();
        b.set_now(1000.0);
        b.now = 1310.0;
        b.set_facing(A0, 2.0);
        b.now = 1000.0;
        // Rozbicie od zegara w tej samej chwili co krok `_raf` (1310): zegar pierwszy, krok obraca po nim.
        b.set_now(1310.0);
        b.set_facing(A0, 3.0);
        assert_eq!(b.facing(A0), 2.0);
        assert_eq!(b.facing_at(A0, 1310.0), 3.0, "w fazie zegara krok jeszcze nie ruszył");
        assert_eq!(b.facing_at(A0, 1311.0), 2.0);
    }
}
