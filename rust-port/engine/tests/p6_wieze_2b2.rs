//! R-RUSTPORT-P6-WIEZE-2B2-Q1: strzał wieży oblężniczej (web `_fireOneTower`, pin 07d2fbd72 `battleScene.ts:4223-4262`).
//!
//! Zakres testów: cel wybierany w chwili wystrzału, zniszczona wieża nie strzela, brak wiersza strzelca = brak
//! planowania, obrażenia przez wspólną ścieżkę `single_blow_full` (ranged = true) z aktualizacją HP celu.

use std::collections::BTreeSet;

use civ_engine::domain::city_towers::{tower_range_for, UnitRow, DEFAULT_TOWER_MIN_RANGE};
use civ_engine::domain::siege_tactics_blow::SequenceRolls;
use civ_engine::domain::siege_tactics_blow_full::{single_blow_full, FullBlowInput};
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_loop::{
    neutral_tower_shot_template, tower_blow_on_target, tower_setup_from_units, tower_shooter_hp,
    tower_shooter_kategoria, tower_shot_from_row, LoopBody, LoopTimer, SiegeEnv, SiegeLoop,
    TOWER_FLY_MS,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqEnv, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;

/// Ciało z pozycjami atakujących; strzał wieży woła wspólną ścieżkę `tower_blow_on_target` z własnymi rzutami.
struct TowerBody {
    atk_cells: Vec<Option<(i64, i64)>>,
    rolls: SequenceRolls,
    tower_blows: usize,
    /// Moc strzelca (`missile_attack`) szablonu z ostatniego trafienia wieży.
    shooter_missile: Option<f64>,
    /// Indeksy celów (`st.atk`) kolejnych trafień wieży, w kolejności wystąpienia.
    targets: Vec<usize>,
    /// Szablony ciosu przekazane do `tower_blow` (wejście `single_blow_full` przed wymuszeniem `ranged`).
    tmpls: Vec<FullBlowInput>,
}

impl LoopBody for TowerBody {
    fn start(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> f64 {
        0.0
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        match unit.side {
            BattleSide::Attacker => self.atk_cells.get(unit.idx).copied().flatten(),
            BattleSide::Defender => None,
        }
    }
    fn tower_blow(
        &mut self,
        tmpl: &civ_engine::domain::siege_tactics_blow_full::FullBlowInput,
        target: usize,
        st: &mut TurnSeqState,
    ) {
        self.tower_blows += 1;
        self.shooter_missile = tmpl.attacker.missile_attack;
        self.targets.push(target);
        self.tmpls.push(tmpl.clone());
        let _ = tower_blow_on_target(tmpl, st, target, &mut self.rolls);
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

fn state(atk_hp: &[f64]) -> TurnSeqState {
    TurnSeqState {
        atk: atk_hp
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

fn env(
    cells: Vec<Option<(i64, i64)>>,
    tower_rows: Vec<i64>,
    wall_tile_rows: Vec<i64>,
    with_shooter: bool,
) -> SiegeEnv<TowerBody> {
    SiegeEnv {
        body: TowerBody {
            atk_cells: cells,
            rolls: SequenceRolls::new(vec![0.0]),
            tower_blows: 0,
            shooter_missile: None,
            targets: Vec::new(),
            tmpls: Vec::new(),
        },
        tower_rows,
        pending_tower_shots: Vec::new(),
        tower_range: 2.0,
        wall_tile_rows,
        wall_ever_breached: false,
        no_breach_cap: 10,
        move_points: [vec![3.0], vec![3.0]],
        morale_max: [vec![100.0], vec![100.0]],
        tower_shot: if with_shooter {
            Some(neutral_tower_shot_template())
        } else {
            None
        },
    }
}

/// Wieża (5,3), zasięg 2, jedyny atakujący (7,3) w zasięgu. Obrońca żywy, bitwa nie kończy się przed strzałem.
fn live_state(hp: f64) -> TurnSeqState {
    let mut st = state(&[hp]);
    st.def = vec![SeqUnit {
        id: 100,
        c: cu(10.0),
    }];
    st
}

/// Uruchamia sterownik do wyczerpania zegara (wystrzał planowany w `BeginTurn`, trafienie po locie).
fn run_loop(sl: &mut SiegeLoop<TowerBody>) {
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = sl.run(&mut clock, 10_000);
}

#[test]
fn tower_shot_damages_target_through_single_blow_full() {
    // Oczekiwana wartość: ta sama ścieżka `single_blow_full` (ranged) na szablonie z tym samym rzutem 0.0.
    let tmpl = neutral_tower_shot_template();
    let expected = single_blow_full(&tmpl, &mut SequenceRolls::new(vec![0.0]))
        .blow
        .def_hp_after;
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    run_loop(&mut sl);
    assert!(sl.env.body.tower_blows >= 1, "wystrzał wieży nie zaszedł");
    assert_eq!(sl.st.atk[0].c.hp, expected, "HP celu po strzale wieży");
    assert!(expected < 10.0, "wzorcowy cios powinien zadać obrażenia");
}

#[test]
fn no_shooter_row_means_no_planning_and_no_shot() {
    // Guard pina `!this.towerShooterRow` → `return`: bez szablonu strzelca nic nie jest planowane.
    let mut st = live_state(10.0);
    let mut e = env(vec![Some((7, 3))], vec![3], vec![3], false);
    e.fire_siege_towers(&mut st);
    assert!(
        e.pending_tower_shots.is_empty(),
        "bez wiersza strzelca brak planowania"
    );
    let mut sl = SiegeLoop::new(live_state(10.0), e);
    run_loop(&mut sl);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "bez wiersza strzelca brak strzału"
    );
    assert_eq!(sl.st.atk[0].c.hp, 10.0, "bez strzału HP bez zmian");
}

#[test]
fn destroyed_tower_does_not_shoot() {
    // Wieża planowana (kafel muru jest), ale kafel zostaje zburzony przed wystrzałem: web `t.destroyed` → brak strzału.
    let mut clock = VirtualClock::<LoopTimer>::new();
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
    // Kafel muru na wieży (5,3) zostaje zburzony po zaplanowaniu wystrzału, przed jego wykonaniem.
    sl.env.wall_tile_rows.clear();
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(sl.env.body.tower_blows, 0, "zniszczona wieża nie strzela");
    assert_eq!(sl.st.atk[0].c.hp, 10.0, "HP celu bez zmian");
}

#[test]
fn live_wall_tile_control_case_shoots() {
    // Kontrola do testu wyżej: ten sam zegar z kaflem muru na miejscu daje strzał.
    let mut clock = VirtualClock::<LoopTimer>::new();
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert!(
        sl.env.body.tower_blows >= 1,
        "kontrola: wieża z kaflem muru strzela"
    );
}

#[test]
fn dead_target_is_not_chosen_at_shot_time() {
    // Cel martwy w chwili wystrzału nie jest wybierany (filtr `pick_tower_target` jak w pinie): brak strzału.
    let mut st = live_state(10.0);
    st.atk[0].c.dead = true;
    let mut sl = SiegeLoop::new(st, env(vec![Some((7, 3))], vec![3], vec![3], true));
    run_loop(&mut sl);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "martwy cel nie jest celem wieży"
    );
}

/// Trafienie pocisku (web callback `_schedule(RANGED_FLY_MS)`, `battleScene.ts:4263-4269`) pomija cel martwy
/// PO wystrzale, a nie tylko w chwili wyboru. Test steruje zegarem bezposrednio przez `LoopTimer::TowerHit`.
#[test]
fn tower_hit_skips_target_dead_before_impact() {
    // Drugi atakujący żyje, więc bitwa nie kończy się przed trafieniem (inaczej `finished` maskuje guard).
    let mut st = two_attacker_state();
    st.atk[0].c.dead = true;
    let mut sl = SiegeLoop::new(st, two_attacker_env());
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerHit(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "cel martwy przed trafieniem nie dostaje ciosu wieży"
    );
}

/// Stan z dwoma atakującymi (oba żywe) i żywym obrońcą; cele w (7,3) i (7,4), wieża (5,3).
fn two_attacker_state() -> TurnSeqState {
    let mut st = state(&[10.0, 10.0]);
    st.def = vec![SeqUnit {
        id: 100,
        c: cu(10.0),
    }];
    st
}

fn two_attacker_env() -> SiegeEnv<TowerBody> {
    let mut e = env(vec![Some((7, 3)), Some((7, 4))], vec![3], vec![3], true);
    e.move_points[0] = vec![3.0, 3.0];
    e.morale_max[0] = vec![100.0, 100.0];
    e
}

#[test]
fn tower_hit_skips_target_fading_out_before_impact() {
    let mut st = two_attacker_state();
    st.atk[0].c.fading_out = true;
    let mut sl = SiegeLoop::new(st, two_attacker_env());
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerHit(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(
        sl.env.body.tower_blows, 0,
        "cel znikający przed trafieniem nie dostaje ciosu wieży"
    );
}

/// Kontrola do dwóch testów wyżej: żywy cel w `TowerHit` dostaje cios (guard nie jest tautologią).
#[test]
fn tower_hit_on_live_target_blows() {
    let mut sl = SiegeLoop::new(two_attacker_state(), two_attacker_env());
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerHit(0), false);
    let _ = sl.run(&mut clock, 10_000);
    assert_eq!(sl.env.body.tower_blows, 1, "żywy cel dostaje cios wieży");
}

/// Opóźnienie zaplanowanego trafienia wieży: `due - now` w chwili, gdy `TowerHit` trafił do kolejki zegara.
/// Pierwszy krok `resume(.., 1)` wykonuje wystrzał (`TowerShot`) i odkłada trafienie, zanim zegar ruszy dalej,
/// więc `now` w tym miejscu to chwila wystrzału. `None`, gdy trafienia nie zaplanowano.
fn tower_hit_delay_after_first_step(
    sl: &mut SiegeLoop<TowerBody>,
    clock: &mut VirtualClock<LoopTimer>,
) -> Option<f64> {
    let _ = sl.resume(clock, 1);
    let now = clock.now();
    clock
        .timers
        .iter()
        .find(|t| matches!(t.payload, LoopTimer::TowerHit(_)))
        .map(|t| t.due - now)
}

/// Trafienie wieży następuje dokładnie po `TOWER_FLY_MS` (380 ms, web `RANGED_FLY_MS`) od wystrzału: czas zegara
/// w chwili ciosu mierzony na przewijaniu, nie z porównania dwóch stałych.
#[test]
fn tower_hit_lands_after_tower_fly_ms() {
    assert_eq!(TOWER_FLY_MS, 380.0, "stała zgodna z pinem RANGED_FLY_MS");
    let mut sl = SiegeLoop::new(
        live_state(10.0),
        env(vec![Some((7, 3))], vec![3], vec![3], true),
    );
    let mut clock = VirtualClock::<LoopTimer>::new();
    let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
    assert_eq!(
        tower_hit_delay_after_first_step(&mut sl, &mut clock),
        Some(TOWER_FLY_MS),
        "trafienie zaplanowane na wystrzał + TOWER_FLY_MS"
    );
    let _ = sl.resume(&mut clock, 10_000);
    assert_eq!(sl.env.body.tower_blows, 1, "strzał dociera do trafienia");
}

// ---------------------------------------------------------------------------------------------------------------
// WIEZE-2B2 r2 (zarzut Evaluatora 2): strzelec wieży z `city_towers::strongest_ranged_unit_for_era`, nie z szablonu.
// Wektory: `p6_city_towers_vectors` (wykonanie pinu `strongestRangedUnitForEra` / `towerRangeFor`).
// ---------------------------------------------------------------------------------------------------------------

const CITY_VECTORS: &str = include_str!("p6_city_towers_vectors/vectors.json");

/// Wiersz `units` z wektora JSON -> `UnitRow` (kolumny pinu pod nazwami z `units.json`).
fn unit_row_of(v: &serde_json::Value) -> UnitRow {
    v.as_object()
        .expect("wiersz jednostki jest obiektem")
        .iter()
        .map(|(k, val)| (k.clone(), val.clone()))
        .collect()
}

/// `missileAttack` widziane przez cios (pin `combatNormField(def['missileAttack'], 0)`, combat.ts:223): null/brak -> 0.
fn combat_missile_of(row: &UnitRow) -> f64 {
    row.get("missileAttack")
        .and_then(serde_json::Value::as_f64)
        .filter(|x| x.is_finite())
        .unwrap_or(0.0)
}

#[test]
fn tower_setup_shooter_comes_from_city_towers_row() {
    let root: serde_json::Value = serde_json::from_str(CITY_VECTORS).expect("JSON");
    let cases = root["cases"]["strongestRangedUnitForEra"]
        .as_array()
        .expect("przypadki strongestRangedUnitForEra");
    assert!(cases.len() >= 150, "za malo przypadkow: {}", cases.len());
    let mut with_row = 0usize;
    for c in cases {
        let units: Vec<UnitRow> = c["units"]
            .as_array()
            .expect("units")
            .iter()
            .map(unit_row_of)
            .collect();
        let era = c["era"].as_f64().expect("era");
        let civ = c["civ"].as_str();
        let (shot, range) = tower_setup_from_units(&units, era, civ, DEFAULT_TOWER_MIN_RANGE);
        match c["expectIndex"].as_u64() {
            None => assert!(shot.is_none(), "brak wiersza = brak strzelca ({})", c["id"]),
            Some(i) => {
                with_row += 1;
                let row = &units[i as usize];
                let shot = shot.expect("wiersz jest = jest strzelec");
                // Pin: wybór strzelca liczy `missilePower` (fallback `Atak dystansowy`), ale cios czyta kolumnę
                // `missileAttack` przez `combatNormField(def['missileAttack'], 0)` (combat.ts:223): null -> 0.
                assert_eq!(
                    shot.attacker.missile_attack,
                    Some(combat_missile_of(row)),
                    "moc strzelca w ciosie z wiersza city_towers ({})",
                    c["id"]
                );
                assert_eq!(
                    range,
                    tower_range_for(Some(row), DEFAULT_TOWER_MIN_RANGE),
                    "zasieg wiezy z wiersza ({})",
                    c["id"]
                );
                // Pin `_fireSiegeTowers` (battleScene.ts:4212-4213): kategoria = `String(Typ ?? 'Distance')`,
                // hp = `Number(Health ?? health ?? 1) || 1`.
                assert_eq!(
                    tower_shooter_kategoria(row),
                    pin_kategoria(row),
                    "kategoria strzelca z pinu ({})",
                    c["id"]
                );
                assert_eq!(
                    tower_shooter_hp(row),
                    pin_hp(row),
                    "hp strzelca z pinu ({})",
                    c["id"]
                );
            }
        }
    }
    assert!(with_row >= 100, "za malo przypadkow z wierszem: {with_row}");
}

/// Pętla wieży używa szablonu strzelca z WIERSZA jednostki (nie ze stałego szablonu): moc `missileAttack` wiersza
/// (7) trafia do ciosu wieży, a zasięg wiezy pochodzi z `towerRangeFor` (reach 3 >= min 2).
#[test]
fn tower_shot_uses_shooter_row_from_city_towers() {
    let units: Vec<UnitRow> = vec![unit_row_of(&serde_json::json!({
        "Nazwa": "Lucznik",
        "Rola (linia)": "Dystans",
        "missileAttack": 7,
        "Zasięg ataku (hex)": 3,
        "Epoka": "Kamień",
        "Dostępna w epokach": "Kamień",
        "Health": 10,
        "Typ": "Distance"
    }))];
    let (shot, range) = tower_setup_from_units(&units, 1.0, None, DEFAULT_TOWER_MIN_RANGE);
    assert!(shot.is_some(), "wiersz strzelca daje szablon");
    assert_eq!(range, 3.0, "zasieg z wiersza");
    let mut e = env(vec![Some((7, 3))], vec![3], vec![3], false);
    e.tower_shot = shot;
    e.tower_range = range;
    let mut sl = SiegeLoop::new(live_state(10.0), e);
    run_loop(&mut sl);
    assert_eq!(
        sl.env.body.tower_blows, 1,
        "wieża strzela szablonem z wiersza"
    );
    assert_eq!(
        sl.env.body.shooter_missile,
        Some(combat_missile_of(&units[0])),
        "moc strzelca w ciosie = missileAttack wiersza"
    );
}

// ---------------------------------------------------------------------------------------------------------------
// WIEZE-2B2 r2 (zarzut Evaluatora 1): wektory z WYKONANIA pinu `_fireOneTower` (generator `p6_wieze_2b2_gen.mjs`,
// strażnik SHA-256 fragmentów pinu w `meta.fragmentSha256`). Oczekiwania = cel z pinu (indeks w `this.atk`),
// brak celu (martwy/znikający/zniszczona wieża/koniec bitwy) i opóźnienie trafienia 380 ms.
// ---------------------------------------------------------------------------------------------------------------

/// Pin: `String(Typ ?? 'Distance')` (battleScene.ts:4240, kategoria strzelca wieży).
fn pin_kategoria(row: &UnitRow) -> String {
    match row.get("Typ") {
        None | Some(serde_json::Value::Null) => "Distance".to_string(),
        Some(serde_json::Value::String(s)) => s.clone(),
        Some(serde_json::Value::Number(n)) => n.to_string(),
        Some(other) => other.to_string(),
    }
}

/// Pin: `Number(Health ?? health ?? 1) || 1` (battleScene.ts:4212). Dla liczb i braku wartości; napisy liczbowe
/// (JS `Number('10')`) nie występują w wektorach strzelców pinu.
fn pin_hp(row: &UnitRow) -> f64 {
    let raw = row
        .get("Health")
        .filter(|v| !v.is_null())
        .or_else(|| row.get("health").filter(|v| !v.is_null()));
    let x = raw.and_then(serde_json::Value::as_f64).unwrap_or(1.0);
    if x.is_finite() && x != 0.0 {
        x
    } else {
        1.0
    }
}

const PIN_VECTORS: &str = include_str!("p6_wieze_2b2_vectors/vectors.json");

fn flag(u: &serde_json::Value, key: &str) -> bool {
    u[key].as_bool().unwrap_or(false)
}

fn cu_full(hp: f64, dead: bool, fading_out: bool, routed: bool, removed: bool) -> CombatUnit {
    CombatUnit {
        hp,
        morale: 100.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead,
        fading_out,
        routed,
        removed,
        acted: false,
    }
}

#[test]
fn tower_fire_matches_pin_vectors() {
    let root: serde_json::Value = serde_json::from_str(PIN_VECTORS).expect("JSON");
    let cases = root["cases"].as_array().expect("przypadki");
    assert!(cases.len() >= 200, "za malo przypadkow: {}", cases.len());
    let (mut hits, mut skips) = (0usize, 0usize);
    for c in cases {
        let id = c["id"].as_str().unwrap_or("?");
        let wall_col = c["wallCol"].as_i64().expect("wallCol");
        let tower_row = c["towerRow"].as_i64().expect("towerRow");
        let tower_range = c["towerRange"].as_f64().expect("towerRange");
        let destroyed = c["destroyed"].as_bool().expect("destroyed");
        let finished = c["finished"].as_bool().expect("finished");
        let mut atk = Vec::new();
        let mut cells = Vec::new();
        for (i, u) in c["atk"].as_array().expect("atk").iter().enumerate() {
            let hp = u["hp"].as_f64().expect("hp");
            let c_unit = cu_full(
                hp,
                flag(u, "dead"),
                flag(u, "fadingOut"),
                flag(u, "routed"),
                flag(u, "removed"),
            );
            atk.push(SeqUnit {
                id: i as u64,
                c: c_unit,
            });
            cells.push(Some((
                u["q"].as_i64().expect("q"),
                u["r"].as_i64().expect("r"),
            )));
        }
        let n = atk.len();
        let mut st = live_state(10.0);
        st.atk = atk;
        st.siege_wall_col = wall_col;
        st.finished = finished;
        let wall_rows = if destroyed {
            Vec::new()
        } else {
            vec![tower_row]
        };
        let mut e = env(cells, vec![tower_row], wall_rows, false);
        // Strzelec z WIERSZA wektora (`shooterRow` z pinu), szablon ciosu jak w produkcyjnym składaniu.
        let shooter_row = unit_row_of(&c["shooterRow"]);
        e.tower_shot = Some(tower_shot_from_row(&shooter_row));
        e.body.rolls = SequenceRolls::new(vec![0.0; 4]);
        e.tower_range = tower_range;
        e.move_points = [vec![3.0; n], vec![3.0]];
        e.morale_max = [vec![100.0; n], vec![100.0]];
        let want = c["expectTarget"].as_i64().expect("expectTarget");
        if want >= 0 {
            // Kategoria i HP strzelca z pinu (wejście składania ciosu w `_fireSiegeTowers`).
            assert_eq!(
                Some(tower_shooter_kategoria(&shooter_row)),
                c["expectKategoria"].as_str().map(String::from),
                "{id}: kategoria strzelca z pinu"
            );
            assert_eq!(
                Some(tower_shooter_hp(&shooter_row)),
                c["expectHp"].as_f64(),
                "{id}: hp strzelca z pinu"
            );
        }
        let mut sl = SiegeLoop::new(st, e);
        let mut clock = VirtualClock::<LoopTimer>::new();
        // Jeden wystrzał wieży na zegarze (bez `start`, który sam planowałby wystrzał i dublował go).
        let _ = clock.schedule(0.0, LoopTimer::TowerShot(0), false);
        let delay = tower_hit_delay_after_first_step(&mut sl, &mut clock);
        let _ = sl.resume(&mut clock, 10_000);
        if want < 0 {
            assert!(
                sl.env.body.targets.is_empty(),
                "{id}: pin nie strzela, a cios zaszedl"
            );
            assert!(
                delay.is_none(),
                "{id}: pin nie strzela, a trafienie zaplanowano po {delay:?}"
            );
            skips += 1;
        } else {
            assert_eq!(
                sl.env.body.targets,
                vec![want as usize],
                "{id}: cel wystrzalu z pinu"
            );
            // Opóźnienie trafienia w kolejce zegara = `_schedule(RANGED_FLY_MS, ...)` z pinu.
            assert_eq!(
                delay,
                c["expectDelayMs"].as_f64(),
                "{id}: opóźnienie trafienia wieży z pinu"
            );
            // Wejście `single_blow_full`: `stats` strzelca (Jednostka) i flaga `ranged` z pinu.
            let tmpl = &sl.env.body.tmpls[0];
            assert_eq!(
                Some(tmpl.attacker.typ_nazwa.clone()),
                c["expectStats"]["Jednostka"].as_str().map(String::from),
                "{id}: stats strzelca (Jednostka) w ciosie"
            );
            assert_eq!(
                Some(tmpl.ranged),
                c["expectRanged"].as_bool(),
                "{id}: flaga ranged w ciosie"
            );
            hits += 1;
        }
    }
    assert!(
        hits >= 80 && skips >= 80,
        "pokrycie wektorow: trafien={hits} brakow={skips}"
    );
}
