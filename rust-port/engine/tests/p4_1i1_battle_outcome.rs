//! R-RUSTPORT-P4-1I1-BATTLE-OUTCOME: producent `BattleOutcomeDto` (ścieżki E1–E3 + E4 z danymi z zewnątrz)
//! względem wektorów WYKONANYCH na tekście pinu `07d2fbd72`.
//!
//! Wektory: `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I1-BATTLE-OUTCOME/gen-p4-1i1-vectors.mjs` składa wycinki pinu
//! (`battle/battleScene.ts:9467-9479` `_finishDraw`, `:9485-9497` `_ffRoundCapResult`, `:10208-10240` ogon
//! `_checkEnd`, `:10246-10250` `_battleUnitsForMapExport`, `:10257-10269` `_sideEndStats`, `:3715-3748`
//! `_skipInstantFallback`, `:10719-10730` `onFinish`; `units/battleRoster.ts:26-39` `buildBattleEventLog`) i wypisuje
//! obiekt `BattleResult` + statystyki końca. Wynik generatora jest wklejony niżej bez zmian ([`PIN_VECTORS`]) i
//! zapisany obok generatora jako `p4-1i1-vectors.json`.

use civ_engine::domain::siege_no_breach::RoundCapVerdict;
use civ_engine::domain::siege_tactics_end::BattleSide;
use civ_engine::domain::siege_tactics_endcheck::EndCheckOutcome;
use civ_engine::domain::siege_tactics_outcome::{
    battle_units_for_map_export, build_battle_outcome, side_end_stats, unique_unit_ids, EndPath,
    InstantSkipData, OutcomeError, OutcomeInput, OutcomeUnit,
};
use civ_engine::domain::siege_tactics_turnseq::SeqUnit;
use civ_engine::domain::siege_tactics_unit::CombatUnit;
use civ_view_model::battle::{BattleOutcomeDto, BattleWinner};
use civ_view_model::ids::MAX_SAFE_ID;
use serde_json::Value;

/// Wyjście generatora (jeden obiekt na linię), bez zmian.
const PIN_VECTORS: &str = r#"[
{"name":"e1_attacker","winner":"atakujacy","survivors":[{"id":100,"hp":30},{"id":42,"hp":12.5},{"id":9,"hp":4},{"id":100,"hp":30}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":false,"wallBreached":null,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e1_defender","winner":"obronca","survivors":[{"id":12,"hp":7.25},{"id":5,"hp":20}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":false,"wallBreached":null,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e2_draw_siege_no_breach","winner":"remis","survivors":[{"id":100,"hp":30},{"id":42,"hp":12.5},{"id":9,"hp":4},{"id":100,"hp":30},{"id":12,"hp":7.25},{"id":5,"hp":20}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":true,"wallBreached":false,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e3_ff_cap_defender_siege_breached","winner":"obronca","survivors":[{"id":12,"hp":7.25},{"id":5,"hp":20}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":true,"wallBreached":true,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e3_ff_cap_attacker","winner":"atakujacy","survivors":[{"id":100,"hp":30},{"id":42,"hp":12.5},{"id":9,"hp":4},{"id":100,"hp":30}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":false,"wallBreached":null,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e3_ff_cap_remis_is_e2","winner":"remis","survivors":[{"id":100,"hp":30},{"id":42,"hp":12.5},{"id":9,"hp":4},{"id":100,"hp":30},{"id":12,"hp":7.25},{"id":5,"hp":20}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":true,"wallBreached":false,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e1_then_draw","winner":"remis","survivors":[{"id":100,"hp":30},{"id":42,"hp":12.5},{"id":9,"hp":4},{"id":100,"hp":30},{"id":12,"hp":7.25},{"id":5,"hp":20}],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":false,"wallBreached":null,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"end_winner_null_after_reset","winner":"obronca","survivors":[],"attackerUnitIds":["100","7","42","9","8"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":false,"wallBreached":null,"endStats":{"atk":{"total":6,"lost":4,"remaining":2,"hp":60,"hpMax":260},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e4_siege_machine","winner":"atakujacy","survivors":[{"id":21,"hp":9.5}],"attackerUnitIds":["21","22"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":true,"wallBreached":true,"endStats":{"atk":{"total":2,"lost":1,"remaining":1,"hp":15,"hpMax":60},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e4_siege_no_machine_alive","winner":"obronca","survivors":[{"id":5,"hp":3}],"attackerUnitIds":["21","22"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":true,"wallBreached":false,"endStats":{"atk":{"total":2,"lost":1,"remaining":1,"hp":8,"hpMax":60},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}},
{"name":"e4_no_siege","winner":"atakujacy","survivors":[{"id":21,"hp":9.5}],"attackerUnitIds":["21","22"],"defenderUnitIds":["3","11","12","5"],"hasWallBreached":false,"wallBreached":null,"endStats":{"atk":{"total":2,"lost":1,"remaining":1,"hp":15,"hpMax":60},"def":{"total":5,"lost":4,"remaining":1,"hp":20,"hpMax":300}}}
]"#;

/// `[id, hp, maxHp, dead, routed]` jak w generatorze (`ATK`, `DEF`, `ATK_SIEGE`).
type Spec = (u64, f64, f64, bool, bool);

const ATK: [Spec; 6] = [
    (100, 30.0, 50.0, false, false),
    (7, 0.0, 40.0, true, false),
    (42, 12.5, 40.0, true, true),
    (9, 4.0, 40.0, false, true),
    (8, 0.0, 40.0, false, true),
    (100, 30.0, 50.0, false, false),
];
const DEF: [Spec; 5] = [
    (3, 0.0, 60.0, true, false),
    (11, 5.0, 60.0, true, false),
    (3, 0.0, 60.0, true, false),
    (12, 7.25, 60.0, false, true),
    (5, 20.0, 60.0, false, false),
];
const ATK_SIEGE: [Spec; 2] = [(21, 15.0, 30.0, false, false), (22, 0.0, 30.0, true, false)];
const ATK_SIEGE_DEAD_MACHINE: [Spec; 2] =
    [(21, 0.0, 30.0, true, false), (22, 8.0, 30.0, false, false)];

fn units(spec: &[Spec]) -> Vec<OutcomeUnit> {
    spec.iter()
        .map(|&(id, hp, max_hp, dead, routed)| OutcomeUnit {
            id,
            hp,
            max_hp,
            dead,
            routed,
        })
        .collect()
}

fn vector(name: &str) -> Value {
    let all: Value = serde_json::from_str(PIN_VECTORS).expect("vectors parse");
    all.as_array()
        .expect("array")
        .iter()
        .find(|v| v["name"] == name)
        .unwrap_or_else(|| panic!("no vector {name}"))
        .clone()
}

fn winner_str(w: BattleWinner) -> &'static str {
    match w {
        BattleWinner::Atakujacy => "atakujacy",
        BattleWinner::Obronca => "obronca",
        BattleWinner::Remis => "remis",
    }
}

/// Porównanie wyniku producenta z obiektem `BattleResult` pinu (pole po polu).
fn assert_matches_pin(dto: &BattleOutcomeDto, v: &Value) {
    let name = v["name"].as_str().unwrap();
    assert_eq!(winner_str(dto.winner), v["winner"], "{name}: winner");
    let want_surv: Vec<(u64, f64)> = v["survivors"]
        .as_array()
        .unwrap()
        .iter()
        .map(|s| (s["id"].as_u64().unwrap(), s["hp"].as_f64().unwrap()))
        .collect();
    let got_surv: Vec<(u64, f64)> = dto.survivors.iter().map(|s| (s.id.get(), s.hp)).collect();
    assert_eq!(got_surv, want_surv, "{name}: survivors");
    // `buildBattleEventLog`: `String(u.id)`; DTO niesie `UnitId`, adapter robi `Display` → `String`.
    let ids = |key: &str| -> Vec<String> {
        v[key]
            .as_array()
            .unwrap()
            .iter()
            .map(|s| s.as_str().unwrap().to_owned())
            .collect()
    };
    let got_atk: Vec<String> = dto
        .attacker_unit_ids
        .iter()
        .map(|i| i.to_string())
        .collect();
    let got_def: Vec<String> = dto
        .defender_unit_ids
        .iter()
        .map(|i| i.to_string())
        .collect();
    assert_eq!(got_atk, ids("attackerUnitIds"), "{name}: attackerUnitIds");
    assert_eq!(got_def, ids("defenderUnitIds"), "{name}: defenderUnitIds");
    let want_wall = if v["hasWallBreached"].as_bool().unwrap() {
        Some(v["wallBreached"].as_bool().unwrap())
    } else {
        None
    };
    assert_eq!(dto.wall_breached, want_wall, "{name}: wallBreached");
    for (side, s) in [("atk", &dto.end_stats.atk), ("def", &dto.end_stats.def)] {
        let w = &v["endStats"][side];
        assert_eq!(
            u64::from(s.total),
            w["total"].as_u64().unwrap(),
            "{name}: {side}.total"
        );
        assert_eq!(
            u64::from(s.lost),
            w["lost"].as_u64().unwrap(),
            "{name}: {side}.lost"
        );
        assert_eq!(
            u64::from(s.remaining),
            w["remaining"].as_u64().unwrap(),
            "{name}: {side}.remaining"
        );
        assert_eq!(s.hp, w["hp"].as_f64().unwrap(), "{name}: {side}.hp");
        assert_eq!(
            s.hp_max,
            w["hpMax"].as_f64().unwrap(),
            "{name}: {side}.hpMax"
        );
    }
    // NIE_ZMIERZONO do P4-1I3 (#247): teksty `this.log` bez producenta.
    assert!(dto.log.is_empty(), "{name}: log must stay empty until I3");
    dto.validate()
        .unwrap_or_else(|e| panic!("{name}: validate: {e}"));
    let text = serde_json::to_string(dto).unwrap();
    let back: BattleOutcomeDto = serde_json::from_str(&text).unwrap();
    assert_eq!(&back, dto, "{name}: JSON round-trip");
}

fn run_single(
    atk: &[Spec],
    def: &[Spec],
    wall_col: i64,
    breached: bool,
    path: EndPath,
    name: &str,
) {
    let a = units(atk);
    let d = units(def);
    let dto =
        build_battle_outcome(&OutcomeInput::single(&a, &d, wall_col, breached, path)).unwrap();
    assert_matches_pin(&dto, &vector(name));
}

#[test]
fn e1_attacker_wins_survivors_winner_side_only() {
    run_single(
        &ATK,
        &DEF,
        -1,
        false,
        EndPath::Victory(BattleSide::Attacker),
        "e1_attacker",
    );
}

#[test]
fn e1_defender_wins_survivors_winner_side_only() {
    run_single(
        &ATK,
        &DEF,
        -1,
        false,
        EndPath::Victory(BattleSide::Defender),
        "e1_defender",
    );
}

#[test]
fn e2_draw_survivors_both_sides_atk_then_def() {
    run_single(
        &ATK,
        &DEF,
        4,
        false,
        EndPath::Draw,
        "e2_draw_siege_no_breach",
    );
}

#[test]
fn e3_ff_round_cap_defender_with_breach() {
    run_single(
        &ATK,
        &DEF,
        4,
        true,
        EndPath::FfRoundCap(BattleSide::Defender),
        "e3_ff_cap_defender_siege_breached",
    );
}

#[test]
fn e3_ff_round_cap_attacker_no_siege() {
    run_single(
        &ATK,
        &DEF,
        -1,
        false,
        EndPath::from_round_cap(RoundCapVerdict::Attacker),
        "e3_ff_cap_attacker",
    );
}

#[test]
fn e3_round_cap_remis_goes_through_finish_draw() {
    // `_ffRoundCapResult`: `cap.winner === 'remis'` → `_finishDraw` (`:9488`) = E2.
    assert_eq!(
        EndPath::from_round_cap(RoundCapVerdict::Draw),
        EndPath::Draw
    );
    run_single(
        &ATK,
        &DEF,
        4,
        false,
        EndPath::from_round_cap(RoundCapVerdict::Draw),
        "e3_ff_cap_remis_is_e2",
    );
}

#[test]
fn end_check_outcome_maps_to_e1_or_e2() {
    assert_eq!(EndPath::from_end_check(EndCheckOutcome::Continue), None);
    assert_eq!(
        EndPath::from_end_check(EndCheckOutcome::Draw),
        Some(EndPath::Draw)
    );
    assert_eq!(
        EndPath::from_end_check(EndCheckOutcome::Ended(BattleSide::Attacker)),
        Some(EndPath::Victory(BattleSide::Attacker))
    );
    assert_eq!(
        EndPath::from_end_check(EndCheckOutcome::Ended(BattleSide::Defender)),
        Some(EndPath::Victory(BattleSide::Defender))
    );
}

#[test]
fn winner_is_end_winner_before_screen_winner() {
    // E1 (atakujacy) otwiera ekran końca, potem `_finishDraw` nadpisuje `_endWinner = 'remis'`; drugie
    // `_showEndScreen('remis')` wraca wcześnie (`_endScreenShown`), więc domknięcie ma `winner = 'atakujacy'`,
    // a `onFinish` daje `this._endWinner ?? winner` = `'remis'`.
    let a = units(&ATK);
    let d = units(&DEF);
    let input = OutcomeInput {
        atk: &a,
        def: &d,
        siege_wall_col: -1,
        wall_ever_breached: false,
        screen_winner: BattleWinner::Atakujacy,
        end: Some(EndPath::Draw),
    };
    assert_matches_pin(
        &build_battle_outcome(&input).unwrap(),
        &vector("e1_then_draw"),
    );
}

#[test]
fn null_end_winner_falls_back_to_screen_winner() {
    // `_endWinner = null`, `_endSurvivors = []` (stan `_resetBattleRuntimeState`, `:10541-10542`): `?? winner`.
    let a = units(&ATK);
    let d = units(&DEF);
    let input = OutcomeInput {
        atk: &a,
        def: &d,
        siege_wall_col: -1,
        wall_ever_breached: false,
        screen_winner: BattleWinner::Obronca,
        end: None,
    };
    assert_matches_pin(
        &build_battle_outcome(&input).unwrap(),
        &vector("end_winner_null_after_reset"),
    );
}

fn e4(winner: BattleSide, survivors: Vec<(u64, f64)>, machine: bool) -> EndPath {
    EndPath::InstantSkip(InstantSkipData {
        winner,
        survivors,
        attacker_has_live_siege_unit: machine,
    })
}

#[test]
fn e4_external_data_siege_machine_assumes_breach() {
    run_single(
        &ATK_SIEGE,
        &DEF,
        4,
        false,
        e4(BattleSide::Attacker, vec![(21, 9.5)], true),
        "e4_siege_machine",
    );
}

#[test]
fn e4_external_data_no_live_machine_keeps_wall() {
    run_single(
        &ATK_SIEGE_DEAD_MACHINE,
        &DEF,
        4,
        false,
        e4(BattleSide::Defender, vec![(5, 3.0)], false),
        "e4_siege_no_machine_alive",
    );
}

#[test]
fn e4_external_data_no_siege_has_no_wall_key() {
    run_single(
        &ATK_SIEGE,
        &DEF,
        -1,
        false,
        e4(BattleSide::Attacker, vec![(21, 9.5)], true),
        "e4_no_siege",
    );
}

#[test]
fn wall_breached_present_only_in_siege() {
    // `...(this.siegeWallCol >= 0 ? { wallBreached } : {})` (`:10728`), także dla `siegeWallCol = 0`.
    let a = units(&ATK);
    let d = units(&DEF);
    for (col, breached, want) in [
        (-1, true, None),
        (-1, false, None),
        (0, true, Some(true)),
        (0, false, Some(false)),
        (7, true, Some(true)),
    ] {
        let dto = build_battle_outcome(&OutcomeInput::single(
            &a,
            &d,
            col,
            breached,
            EndPath::Victory(BattleSide::Attacker),
        ))
        .unwrap();
        assert_eq!(dto.wall_breached, want, "col {col} breached {breached}");
    }
}

#[test]
fn map_export_rout_with_hp_kept_dead_or_zero_hp_dropped() {
    // `_battleUnitsForMapExport` (`:10246-10250`): `hp > 0 && (!dead || routed)`.
    let roster = units(&[
        (1, 10.0, 10.0, false, false),     // żywa: tak
        (2, 3.0, 10.0, true, true),        // rout + dead (zdjęta z pola) z hp>0: tak
        (3, 3.0, 10.0, false, true),       // rout z hp>0: tak
        (4, 0.0, 10.0, false, true),       // rout z hp 0: nie
        (5, 0.0, 10.0, false, false),      // żywa z hp 0: nie
        (6, 5.0, 10.0, true, false),       // dead bez rout z hp>0: nie
        (7, -2.0, 10.0, false, false),     // hp ujemne: nie
        (8, f64::NAN, 10.0, false, false), // NaN > 0 = false: nie
    ]);
    let got: Vec<(u64, f64)> = battle_units_for_map_export(&roster)
        .unwrap()
        .iter()
        .map(|s| (s.id.get(), s.hp))
        .collect();
    assert_eq!(got, vec![(1, 10.0), (2, 3.0), (3, 3.0)]);
}

#[test]
fn event_log_ids_unique_first_occurrence_roster_order() {
    // `uniqueUnitIds` (`units/battleRoster.ts:26-28`): `[...new Set(ids.map(String))]`.
    let roster = units(&[
        (9, 1.0, 1.0, false, false),
        (1, 1.0, 1.0, true, false),
        (9, 1.0, 1.0, false, false),
        (10, 1.0, 1.0, false, false),
        (1, 1.0, 1.0, false, false),
    ]);
    let got: Vec<String> = unique_unit_ids(&roster)
        .unwrap()
        .iter()
        .map(|i| i.to_string())
        .collect();
    assert_eq!(got, ["9", "1", "10"]);
    assert!(unique_unit_ids(&[]).unwrap().is_empty());
}

#[test]
fn side_end_stats_lost_counts_dead_or_routed_hp_only_remaining() {
    // `_sideEndStats` (`:10257-10269`): `out = dead || routed`; `hp` tylko z nie-`out`; `hpMax` z całego rosteru;
    // `Math.max(0, …)` na obu sumach.
    let roster = units(&[
        (1, 10.0, 20.0, false, false),
        (2, 5.0, 20.0, false, true),
        (3, -4.0, -1.0, false, false),
        (4, 7.0, 20.0, true, false),
    ]);
    let s = side_end_stats(&roster).unwrap();
    assert_eq!((s.total, s.lost, s.remaining), (4, 2, 2));
    assert_eq!(s.hp, 10.0);
    assert_eq!(s.hp_max, 60.0);
    let empty = side_end_stats(&[]).unwrap();
    assert_eq!((empty.total, empty.lost, empty.remaining), (0, 0, 0));
    assert_eq!((empty.hp, empty.hp_max), (0.0, 0.0));
}

#[test]
fn ids_above_max_safe_are_rejected() {
    let a = units(&[(MAX_SAFE_ID + 1, 5.0, 5.0, false, false)]);
    let d = units(&DEF);
    let err = build_battle_outcome(&OutcomeInput::single(
        &a,
        &d,
        -1,
        false,
        EndPath::Victory(BattleSide::Defender),
    ))
    .unwrap_err();
    assert!(matches!(err, OutcomeError::Id(e) if e.value == MAX_SAFE_ID + 1));
    let ok = units(&[(MAX_SAFE_ID, 5.0, 5.0, false, false)]);
    assert!(build_battle_outcome(&OutcomeInput::single(
        &ok,
        &d,
        -1,
        false,
        EndPath::Victory(BattleSide::Attacker),
    ))
    .is_ok());
}

#[test]
fn outcome_unit_from_seq_unit() {
    let c = CombatUnit {
        hp: 12.0,
        morale: 0.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: true,
        fading_out: false,
        routed: true,
        removed: false,
        acted: false,
    };
    let u = OutcomeUnit::from_seq(&SeqUnit { id: 77, c }, 40.0);
    assert_eq!(
        u,
        OutcomeUnit {
            id: 77,
            hp: 12.0,
            max_hp: 40.0,
            dead: true,
            routed: true
        }
    );
}

/// Zarzut 2 (Evaluator r1): źródło `maxHp` dla adaptera `SiegeLoop` = `BattleUnitSpawnDto::max_hp` (po id).
#[test]
fn outcome_unit_from_seq_with_setup_takes_max_hp_by_id() {
    use civ_view_model::battle::{BattleSide as ViewSide, BattleUnitSpawnDto};
    use civ_view_model::ids::UnitId;
    let spawn = |id: u64, max_hp: f64| BattleUnitSpawnDto {
        id: UnitId::try_new(id).unwrap(),
        side: ViewSide::Atk,
        category: String::new(),
        model_name: String::new(),
        owner_color: 0,
        col: 0,
        row: 0,
        facing: 0,
        on_wall_walkway: false,
        // Spawn `hp` differs from `max_hp`: the helper must read `max_hp`.
        hp: max_hp - 1.0,
        max_hp,
        morale: 0.0,
        morale_max: 0.0,
        ammo_left: None,
        ammo_max: None,
    };
    let setup = [spawn(5, 30.0), spawn(77, 40.0), spawn(9, 50.0)];
    let c = CombatUnit {
        hp: 12.0,
        morale: 0.0,
        flee_morale: 0.0,
        move_left: 0.0,
        never_rout: false,
        dead: false,
        fading_out: false,
        routed: false,
        removed: false,
        acted: false,
    };
    let u = OutcomeUnit::from_seq_with_setup(&SeqUnit { id: 77, c }, &setup).unwrap();
    assert_eq!(u.max_hp, 40.0);
    assert_eq!(u.hp, 12.0);
    assert_eq!(u.id, 77);
    assert!(OutcomeUnit::from_seq_with_setup(&SeqUnit { id: 78, c }, &setup).is_none());
}
