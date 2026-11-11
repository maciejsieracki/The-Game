//! P6-ZAPIS-REPLAY-MIGRATE: test behawioralny sciezki replayu z checkpointem sprzed migracji.
//! Replay ze starym snapshotem (4 wodzow, era 2 => limit 2) wczytany przez
//! `load_replay_log_json` musi po odtworzeniu dac stan PO migracji (asercje na stanie),
//! a surowe wczytanie bez migracji nie moze byc odtworzone.

use civ_engine::domain::events::EventQueue;
use civ_engine::domain::replay::{ReplayError, ReplayLog, ReplayRecorder, ReplayStep};
use civ_engine::domain::save_load::{SaveMeta, SaveSnapshot};
use civ_engine::domain::zapis_loader::load_replay_log_json;
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TileDto, TurnDto, TurnEvent, TurnPhase, UnitDto, UnitId, UnitKindDto,
};

const OWNER: u64 = 1;
const FOREIGN: u64 = 2;

type UnitSpec = (u64, u64, u16, u16, bool);

fn map(w: u16, h: u16) -> MapDto {
    let mut tiles = Vec::new();
    for y in 0..h {
        for x in 0..w {
            tiles.push(TileDto::new(PositionDto::new(x, y), TerrainDto::Plains));
        }
    }
    MapDto::new(w, h, tiles).expect("map")
}

fn state(specs: &[UnitSpec]) -> GameStateDto {
    let mut civs = Vec::new();
    for owner in [OWNER, FOREIGN] {
        civs.push(
            CivilizationDto::new(
                PlayerId::new(owner),
                format!("civ{owner}"),
                Vec::<CityId>::new(),
                specs
                    .iter()
                    .filter(|s| s.1 == owner)
                    .map(|s| UnitId::new(s.0))
                    .collect(),
            )
            .expect("civ"),
        );
    }
    let cities: Vec<CityDto> = Vec::new();
    let units = specs
        .iter()
        .map(|s| {
            UnitDto::new(
                UnitId::new(s.0),
                PlayerId::new(s.1),
                UnitKindDto::Warrior,
                PositionDto::new(s.2, s.3),
            )
            .expect("unit")
            .with_general(s.4)
        })
        .collect();
    GameStateDto::new(
        map(3, 1),
        civs,
        cities,
        units,
        TurnDto::new(3).expect("turn"),
    )
    .expect("state")
}

/// Snapshot sprzed migracji: 3 wodzow gracza 1 i wodz obcy.
fn old_snapshot() -> SaveSnapshot {
    let specs: Vec<UnitSpec> = vec![
        (10, OWNER, 0, 0, true),
        (11, OWNER, 1, 0, true),
        (12, OWNER, 2, 0, true),
        (20, FOREIGN, 2, 0, true),
    ];
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(state(&specs), queue, Rng::new(42)).with_meta(SaveMeta::default())
}

fn generals(s: &SaveSnapshot) -> Vec<u64> {
    s.state()
        .units()
        .iter()
        .filter(|u| u.is_general())
        .map(|u| u.id().get())
        .collect()
}

/// Replay w formacie JSON, jak zapisany przez serializacje `ReplayLog` z checkpointem.
fn replay_text() -> String {
    let mut recorder = ReplayRecorder::<String>::new(7);
    recorder
        .record(3, "EndTurn".to_string(), Some(old_snapshot()))
        .expect("recording with old snapshot");
    serde_json::to_string(recorder.log()).expect("replay serializes")
}

#[test]
fn p6_zapis_replay_migrate_playback_yields_migrated_state() {
    let text = replay_text();
    // Kontrola: surowe wczytanie NIE eksponuje niezmigrowanego checkpointu w zadnym accessorze.
    let raw: ReplayLog<String> = serde_json::from_str(&text).expect("raw load");
    assert!(
        raw.migration_pending(),
        "raw load zostawia flage oczekiwania"
    );
    assert!(raw.step(0).expect("step 0").migration_pending());
    // Surowy accessor zwraca dane sprzed migracji (4 wodzow); bramka dziala na playback.
    let raw_snapshot = raw.step(0).and_then(|s| s.snapshot()).expect("checkpoint");
    assert_eq!(generals(raw_snapshot), vec![10, 11, 12, 20]);
    // Wczytanie z serde zachowuje dane (round-trip rowny oryginalowi).
    let original = {
        let mut recorder = ReplayRecorder::<String>::new(7);
        recorder
            .record(3, "EndTurn".to_string(), Some(old_snapshot()))
            .expect("record");
        recorder.finish()
    };
    assert_eq!(raw, original);

    // Produkcyjna sciezka: era 2 => limit 2; najmlodszy wodz gracza 1 (id 12) traci flage.
    let (loaded, reports) = load_replay_log_json::<String>(&text, |_| 2.0).expect("loader");
    assert_eq!(reports.len(), 1);
    assert_eq!(reports[0].0, 0, "raport kluczowany sekwencja kroku");
    assert_eq!(reports[0].1.demoted_generals, vec![UnitId::new(12)]);

    let mut playback = loaded.playback().expect("playback after migration");
    let step = playback.next().expect("step 0");
    assert_eq!(step.input(), "EndTurn");
    let migrated = step.snapshot().expect("migrated checkpoint");
    assert_eq!(generals(migrated), vec![10, 11, 20], "stan po migracji");
    assert_eq!(migrated.state().units().len(), 4, "nikt nie ginie");
}

#[test]
fn p6_zapis_replay_migrate_blocks_playback_without_migration() {
    let text = replay_text();
    let raw: ReplayLog<String> = serde_json::from_str(&text).expect("raw load");
    assert_eq!(
        raw.playback().err(),
        Some(ReplayError::SnapshotsNotMigrated),
        "niezmigrowany replay z checkpointem nie moze byc odtwarzany"
    );
}

#[test]
fn p6_zapis_replay_migrate_from_steps_keeps_pending_gate() {
    // Krok zdeserializowany osobno (bez ReplayLog) tez niesie flage oczekiwania.
    let text = replay_text();
    let raw: ReplayLog<String> = serde_json::from_str(&text).expect("raw load");
    let step_text = serde_json::to_string(raw.step(0).expect("step 0")).expect("ser step");
    let step: ReplayStep<String> = serde_json::from_str(&step_text).expect("step load");
    assert!(step.migration_pending());
    let mut rebuilt = ReplayLog::from_steps(7, vec![step]).expect("from_steps");
    assert_eq!(
        rebuilt.playback().err(),
        Some(ReplayError::SnapshotsNotMigrated),
        "from_steps nie moze ominac bramki"
    );
    let reports = rebuilt.migrate_on_load(|_| 2.0);
    assert_eq!(reports.len(), 1);
    assert!(!rebuilt.migration_pending());
    let mut playback = rebuilt.playback().expect("playback after migration");
    let migrated = playback
        .next()
        .and_then(|s| s.snapshot())
        .expect("checkpoint");
    assert_eq!(generals(migrated), vec![10, 11, 20]);
}

#[test]
fn p6_zapis_replay_migrate_recorded_checkpoint_is_not_blocked() {
    // Zywy checkpoint z rekordera (nie z serde) nie jest oczekujacy i odtwarza sie od razu.
    let recorder_log = {
        let mut recorder = ReplayRecorder::<String>::new(7);
        recorder
            .record(3, "EndTurn".to_string(), Some(old_snapshot()))
            .expect("record");
        recorder.finish()
    };
    assert!(!recorder_log.migration_pending());
    let playback = recorder_log.playback().expect("recorded log plays");
    assert_eq!(playback.remaining(), 1);
}

#[test]
fn p6_zapis_replay_migrate_per_owner_era_and_idempotent_reload() {
    let text = replay_text();
    let (loaded, _) = load_replay_log_json::<String>(&text, |owner| {
        if owner == PlayerId::new(OWNER) {
            1.0
        } else {
            3.0
        }
    })
    .expect("loader");
    let mut playback = loaded.playback().expect("playback");
    let migrated = playback
        .next()
        .and_then(|s| s.snapshot())
        .expect("checkpoint");
    assert_eq!(generals(migrated), vec![10, 20]);

    // Dwukrotne migrate_on_load na tym samym logu: drugi raport bez zmian (idempotencja).
    let mut twice = loaded.clone();
    let _first = twice.migrate_on_load(|_| 2.0);
    let second_same = twice.migrate_on_load(|_| 2.0);
    assert!(
        second_same
            .iter()
            .all(|(_, r)| r.demoted_generals.is_empty()),
        "powtorna migracja z ta sama epoka nic nie degraduje"
    );
    let mut twice_playback = twice.playback().expect("playback after double migration");
    let twice_snap = twice_playback
        .next()
        .and_then(|s| s.snapshot())
        .expect("checkpoint");
    assert_eq!(generals(twice_snap), vec![10, 20]);

    let again_text = serde_json::to_string(&loaded).expect("ser");
    let (again, second) = load_replay_log_json::<String>(&again_text, |_| 2.0).expect("reload");
    assert!(
        second.iter().all(|(_, r)| r.demoted_generals.is_empty()),
        "drugi odczyt bez zmian"
    );
    let mut again_playback = again.playback().expect("playback");
    let snap = again_playback
        .next()
        .and_then(|s| s.snapshot())
        .expect("checkpoint");
    assert_eq!(generals(snap), vec![10, 20]);
}

#[test]
fn p6_zapis_replay_migrate_rejects_invalid_json_without_panic() {
    assert!(load_replay_log_json::<String>("{ nie replay", |_| 1.0).is_err());
    assert!(load_replay_log_json::<String>("", |_| 1.0).is_err());
}
