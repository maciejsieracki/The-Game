//! R-RUSTPORT-P4-1I2-BATTLE-FRAME: ramka bitwy ([`BattleFrameDto`]) po każdym odpaleniu klocka zegara pętli
//! oblężniczej ([`SiegeLoop`]). Wektory z pinu `07d2fbd72` (`gra/src/battle/battleScene.ts`, linie w komentarzach):
//! - kolejność jednostek = kolejność spawnu (`this.atk`, potem `this.def`, `:5541-5550`, iteracja `:5573`);
//! - amunicja `Infinity` (`ammoCount`, `:1445`) → `None`;
//! - wieża zburzona przy wyłomie (`_breachWallTile` → `_destroyTowerAtRow`, `:7648`) → wpis w `towers_destroyed`;
//! - wieża zburzona przy strzale bez kafla (`_fireSiegeTowers`, `:4216`) → wpis w `towers_destroyed`.

use std::collections::BTreeSet;

use civ_engine::domain::siege_tactics_blow_full::FullBlowInput;
use civ_engine::domain::siege_tactics_breach::WallState;
use civ_engine::domain::siege_tactics_clock::VirtualClock;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_frame::{
    ammo_to_dto, battle_frame, record_frames, FrameError, FrameInput, FrameUnitPose,
};
use civ_engine::domain::siege_tactics_loop::{
    neutral_tower_shot_template, LoopBody, LoopTimer, SiegeEnv, SiegeLoop,
};
use civ_engine::domain::siege_tactics_turnseq::{SeqUnit, TurnSeqState, UnitRef};
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use civ_view_model::battle::BattleFrameDto;
use civ_view_model::ids::UnitId;

const WALL_COL: i64 = 5;
/// Budżet iteracji przewijania (`run_fast_forward`): kilka tur bitwy, kilkadziesiąt odpaleń zegara.
const STEPS: u32 = 400;

/// Ciało bez efektów: aktywacja trwa `ms`, pozycje atakujących z `atk_cells` (wybór celu wieży).
struct NoopBody {
    ms: f64,
    atk_cells: Vec<(i64, i64)>,
}

impl LoopBody for NoopBody {
    fn start(&mut self, _unit: UnitRef, _st: &TurnSeqState) -> f64 {
        self.ms
    }
    fn complete(&mut self, _unit: UnitRef, _st: &mut TurnSeqState) {}
    fn unit_cell(&self, unit: UnitRef) -> Option<(i64, i64)> {
        match unit.side {
            BattleSide::Attacker => self.atk_cells.get(unit.idx).copied(),
            BattleSide::Defender => None,
        }
    }
    fn tower_blow(&mut self, _tmpl: &FullBlowInput, _target: usize, _st: &mut TurnSeqState) {}
}

fn cu(hp: f64, morale: f64) -> CombatUnit {
    CombatUnit {
        hp,
        morale,
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

fn units(spec: &[(u64, f64, f64)]) -> Vec<SeqUnit> {
    spec.iter()
        .map(|&(id, hp, morale)| SeqUnit {
            id,
            c: cu(hp, morale),
        })
        .collect()
}

fn state(atk: &[(u64, f64, f64)], def: &[(u64, f64, f64)]) -> TurnSeqState {
    TurnSeqState {
        atk: units(atk),
        def: units(def),
        turn_order: Vec::new(),
        turn_idx: 0,
        round_no: 0,
        siege_wall_col: WALL_COL,
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

fn wall(rows: &[i32]) -> WallState {
    WallState {
        wall_col: WALL_COL as i32,
        gate_col: -1,
        gate_hp: 0.0,
        gate_open: false,
        wall_tile_hp: rows.iter().map(|&r| (r, 100.0 + f64::from(r))).collect(),
        wall_tiles_init: rows.len(),
        tower_at_wall_rows: BTreeSet::new(),
        wall_ever_breached: false,
    }
}

/// Atakujący `[7, 3]`, obrońcy `[5, 1]`: ID celowo nieposortowane, żeby kolejność spawnu była widoczna.
const ATK: [(u64, f64, f64); 2] = [(7, 40.0, 90.0), (3, 30.0, 80.0)];
const DEF: [(u64, f64, f64); 2] = [(5, 50.0, 70.0), (1, 20.0, 60.0)];

fn new_loop(towers: &[i64], wall_rows: &[i64], shooter: bool) -> SiegeLoop<NoopBody> {
    let env = SiegeEnv {
        body: NoopBody {
            ms: 100.0,
            atk_cells: vec![(WALL_COL - 2, 2), (WALL_COL - 1, 4)],
        },
        tower_rows: towers.to_vec(),
        pending_tower_shots: Vec::new(),
        tower_range: 6.0,
        tower_shot: shooter.then(neutral_tower_shot_template),
        wall_tile_rows: wall_rows.to_vec(),
        wall_ever_breached: false,
        no_breach_cap: 1_000_000,
        move_points: [vec![0.0; ATK.len()], vec![0.0; DEF.len()]],
        morale_max: [vec![100.0; ATK.len()], vec![100.0; DEF.len()]],
    };
    SiegeLoop::new(state(&ATK, &DEF), env)
}

fn pose(col: i32, row: i32, facing: i32, on_wall: bool, ammo: f64) -> FrameUnitPose {
    FrameUnitPose {
        col,
        row,
        facing,
        on_wall_walkway: on_wall,
        ammo_left: ammo,
    }
}

/// Wejście adaptera: atakujący 7 bez limitu amunicji (`Infinity`), 3 z amunicją 2; obrońca 5 na murze.
fn input(wall_rows: &[i32]) -> FrameInput {
    FrameInput {
        poses: [
            vec![
                pose(3, 2, 1, false, f64::INFINITY),
                pose(4, 4, 1, false, 2.0),
            ],
            vec![pose(5, 2, 3, true, 0.0), pose(6, 4, 3, false, 0.0)],
        ],
        wall: wall(wall_rows),
    }
}

fn ids(f: &BattleFrameDto) -> Vec<u64> {
    f.units.iter().map(|u| u.id.get()).collect()
}

fn frames_after_run(
    lp: &mut SiegeLoop<NoopBody>,
    wall_rows: &'static [i32],
    steps: u32,
) -> Vec<BattleFrameDto> {
    let log = record_frames(lp, move |_| input(wall_rows));
    let mut clock: VirtualClock<LoopTimer> = VirtualClock::new();
    let _ = lp.run(&mut clock, steps);
    let out: Vec<BattleFrameDto> = log
        .borrow()
        .iter()
        .map(|r| r.clone().expect("ramka"))
        .collect();
    out
}

/// Pin `:5541-5550` (`this.atk = place(atkArr …)`, `this.def = …`) i `:5573` (`[...this.atk, ...this.def]`):
/// kolejność jednostek w ramce = kolejność spawnu, atakujący przed obrońcami, bez sortowania po ID.
#[test]
fn kolejnosc_jednostek_rowna_kolejnosci_spawnu() {
    let mut lp = new_loop(&[2, 4], &[2, 4], true);
    let frames = frames_after_run(&mut lp, &[2, 4], STEPS);
    assert!(
        frames.len() >= 3,
        "za mało ramek: {} (po każdym odpaleniu zegara)",
        frames.len()
    );
    for f in &frames {
        assert_eq!(ids(f), vec![7, 3, 5, 1], "kolejność spawnu");
        // Wartości z pętli trafiają do właściwej jednostki (hp/morale z `TurnSeqState`).
        assert_eq!(f.units[0].hp, 40.0);
        assert_eq!(f.units[1].morale, 80.0);
        assert_eq!(f.units[2].hp, 50.0);
        assert_eq!(f.units[3].morale, 60.0);
        // Pozycja i `onWallWalkway` z wejścia adaptera (L7), nie z pętli.
        assert_eq!((f.units[2].col, f.units[2].row), (5, 2));
        assert!(f.units[2].on_wall_walkway);
        assert!(!f.units[3].on_wall_walkway);
        assert_eq!(f.units[1].facing, 1);
        f.validate().expect("ramka spełnia validate");
    }
    // Zegar wirtualny w ramkach nie maleje (ramka po każdym odpaleniu, w kolejności odpaleń).
    for w in frames.windows(2) {
        assert!(w[1].v_now >= w[0].v_now, "vNow maleje: {:?}", w);
    }
    assert!(frames.iter().any(|f| f.v_now > 0.0));
    assert!(frames.iter().all(|f| f.round_no >= 1));
    assert!(
        frames.iter().any(|f| f.round_no >= 2),
        "ramki obejmują więcej niż jedną turę"
    );
}

/// Pin `:1445` (`ammoCount` → `Infinity` dla czystych strzelców) i `:9191-9192` (zmniejszenie tylko wartości
/// skończonej): `Infinity` → `None`, liczba skończona → `Some`.
#[test]
fn amunicja_infinity_to_none() {
    assert_eq!(ammo_to_dto(f64::INFINITY), None);
    assert_eq!(ammo_to_dto(2.0), Some(2.0));
    assert_eq!(ammo_to_dto(0.0), Some(0.0));
    let lp = new_loop(&[2, 4], &[2, 4], true);
    let f = battle_frame(&lp, 0.0, &input(&[2, 4])).expect("ramka");
    assert_eq!(f.units[0].ammo_left, None, "Infinity musi być None");
    assert_eq!(f.units[1].ammo_left, Some(2.0));
    let json = serde_json::to_value(&f).unwrap();
    assert_eq!(json["units"][0]["ammoLeft"], serde_json::Value::Null);
    assert_eq!(json["units"][1]["ammoLeft"], serde_json::json!(2.0));
    // `NaN` i `-Infinity` nie są amunicją web (`Math.max(0, …)`, `:1447`): producent odrzuca ramkę.
    for bad in [f64::NAN, f64::NEG_INFINITY, -1.0] {
        let mut inp = input(&[2, 4]);
        inp.poses[0][1].ammo_left = bad;
        assert!(
            matches!(battle_frame(&lp, 0.0, &inp), Err(FrameError::Invalid(_))),
            "amunicja {bad} przyjęta"
        );
    }
}

/// Pin `:7646-7648` (`_breachWallTile`: `wallTileHp.delete`, `wallEverBreached = true`,
/// `_destroyTowerAtRow(wallRow)`): wieża zburzona w chwili wyłomu, przed kolejną salwą.
#[test]
fn wieza_zburzona_przy_wylomie() {
    let mut lp = new_loop(&[2, 4], &[2, 4], true);
    let f0 = battle_frame(&lp, 0.0, &input(&[2, 4])).expect("ramka");
    assert!(f0.wall.towers_destroyed.is_empty());
    assert!(!f0.wall.ever_breached);

    lp.breach_wall_row(2);
    // Ramka TUŻ po wyłomie (bez kolejnego `_fireSiegeTowers`, więc tylko ścieżka `:7648`).
    let f1 = battle_frame(&lp, 0.0, &input(&[4])).expect("ramka");
    assert_eq!(f1.wall.towers_destroyed, vec![2], "pin :7648");
    assert!(f1.wall.ever_breached, "pin :7647");
    let rows: Vec<i32> = f1.wall.tile_hp.iter().map(|t| t.row).collect();
    assert_eq!(rows, vec![4], "pin :7646");
    assert_eq!(f1.wall.tile_hp[0].hp, 104.0);
    assert!(lp.tower_destroyed(0) && !lp.tower_destroyed(1));

    // Po wyłomie bitwa trwa: każda ramka po odpaleniu ma wieżę 2 dokładnie raz, wieża 4 stoi.
    let frames = frames_after_run(&mut lp, &[4], STEPS);
    assert!(!frames.is_empty());
    for f in &frames {
        assert_eq!(f.wall.towers_destroyed, vec![2]);
    }
    // Drugi wyłom na tym samym wierszu: `find(… && !x.destroyed)` nie znajduje wieży (`:4195-4196`).
    assert!(!lp.destroy_tower_at_row(2));
}

/// Pin `:4216` (`_fireSiegeTowers`: `if (!this.wallTileHp.has(t.row)) { this._destroyTowerAtRow(t.row); continue; }`):
/// wieża bez kafla zostaje zburzona przy przejściu przez wieże na początku tury, nie wcześniej.
#[test]
fn wieza_zburzona_przy_strzale_bez_kafla() {
    let mut lp = new_loop(&[2, 4], &[4], true);
    let f0 = battle_frame(&lp, 0.0, &input(&[4])).expect("ramka");
    assert!(
        f0.wall.towers_destroyed.is_empty(),
        "przed `_fireSiegeTowers` flaga nie jest ustawiona"
    );
    assert!(
        !f0.wall.ever_breached,
        "brak kafla to nie wyłom w tej bitwie"
    );
    let frames = frames_after_run(&mut lp, &[4], STEPS);
    assert!(!frames.is_empty());
    for f in &frames {
        assert_eq!(f.wall.towers_destroyed, vec![2], "pin :4216");
        assert!(!f.wall.ever_breached);
    }
    assert!(lp.tower_destroyed(0) && !lp.tower_destroyed(1));
}

/// Pin `:4209` (`if (this.finished || this.siegeTowers.length === 0 || !this.towerShooterRow) return;`): bez
/// strzelca wieży `_fireSiegeTowers` wraca przed pętlą, więc `:4216` nie burzy wieży bez kafla.
#[test]
fn bez_strzelca_brak_zburzenia_z_4216() {
    let mut lp = new_loop(&[2, 4], &[4], false);
    let frames = frames_after_run(&mut lp, &[4], STEPS);
    assert!(!frames.is_empty());
    for f in &frames {
        assert!(f.wall.towers_destroyed.is_empty());
    }
    // Wyłom (`:7648`) burzy wieżę niezależnie od strzelca.
    lp.breach_wall_row(4);
    let f = battle_frame(&lp, 0.0, &input(&[])).expect("ramka");
    assert_eq!(f.wall.towers_destroyed, vec![4]);
}

#[test]
fn niespojne_wejscie_adaptera_odrzucone() {
    let lp = new_loop(&[2, 4], &[2, 4], true);
    let mut inp = input(&[2, 4]);
    inp.poses[1].pop();
    assert_eq!(
        battle_frame(&lp, 0.0, &inp),
        Err(FrameError::PoseCount {
            side: BattleSide::Defender,
            expected: 2,
            actual: 1
        })
    );
    // Żywy kafel pętli bez HP u adaptera.
    assert_eq!(
        battle_frame(&lp, 0.0, &input(&[4])),
        Err(FrameError::TileHpMissing(2))
    );
    // Nadmiarowy wiersz u adaptera (kafel 2 zburzony w pętli, adapter nadal ma HP): błąd, nie cicho pominięty.
    let mut lp_b = new_loop(&[2, 4], &[2, 4], true);
    lp_b.breach_wall_row(2);
    assert_eq!(
        battle_frame(&lp_b, 0.0, &input(&[2, 4])),
        Err(FrameError::TileHpStale(2))
    );
    // Id ponad 2^53 - 1.
    let mut lp2 = new_loop(&[2, 4], &[2, 4], true);
    lp2.st.atk[0].id = 1_u64 << 53;
    assert!(matches!(
        battle_frame(&lp2, 0.0, &input(&[2, 4])),
        Err(FrameError::Id(_))
    ));
    assert_eq!(UnitId::try_new(7).unwrap().get(), 7);
}

/// Stan jednostek z pętli: `dead`/`routed`/`removed` przechodzą bez zmian.
#[test]
fn flagi_jednostek_z_petli() {
    let mut lp = new_loop(&[2, 4], &[2, 4], true);
    lp.st.atk[1].c.dead = true;
    lp.st.atk[1].c.hp = -3.0;
    lp.st.def[0].c.routed = true;
    lp.st.def[1].c.removed = true;
    lp.st.finished = true;
    lp.st.round_no = 4;
    let f = battle_frame(&lp, 1250.0, &input(&[2, 4])).expect("ramka");
    assert!(f.units[1].dead && !f.units[0].dead);
    assert_eq!(f.units[1].hp, -3.0);
    assert!(f.units[2].routed && f.units[3].removed);
    assert!(f.finished);
    assert_eq!(f.round_no, 4);
    assert_eq!(f.v_now, 1250.0);
}
