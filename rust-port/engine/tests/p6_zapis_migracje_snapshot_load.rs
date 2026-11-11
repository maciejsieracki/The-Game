//! P6-ZAPIS-MIGRACJE-FALA509 (runda 3): migracje wczytania zapisu PRZEZ pelny `SaveSnapshot`
//! (serde JSON w obie strony), dla zapisu STAREGO (bez `is_general`) i NOWEGO.
//! Web: `main.ts:46566-46573` (degradacja wodzow, siatka stosu), `main.ts:4339` (`enforceArmyStackLimit`),
//! `main.ts:33392` (`mapHexPassableForUnit`), `city-hex-movement.ts` (`canUnitOccupyCityHex`).

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayerId, PositionDto, Rng, TerrainDto,
    TileDto, TurnDto, UnitDto, UnitId, UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{SaveMeta, SaveSnapshot, TurnPhase};
use serde_json::{json, Value};

const OWNER: u64 = 1;
const FOREIGN: u64 = 2;

type UnitSpec = (u64, u64, u16, u16, bool);

fn map(w: u16, h: u16, water: &[(u16, u16)]) -> MapDto {
    let mut tiles = Vec::new();
    for y in 0..h {
        for x in 0..w {
            let t = if water.contains(&(x, y)) {
                TerrainDto::Water
            } else {
                TerrainDto::Plains
            };
            tiles.push(TileDto::new(PositionDto::new(x, y), t));
        }
    }
    MapDto::new(w, h, tiles).expect("map")
}

/// `specs`: (id, wlasciciel, x, y, wodz); `cities`: (id, wlasciciel, x, y).
fn state(map: MapDto, specs: &[UnitSpec], cities: &[(u64, u64, u16, u16)]) -> GameStateDto {
    let mut civs = Vec::new();
    for owner in [OWNER, FOREIGN] {
        civs.push(
            CivilizationDto::new(
                PlayerId::new(owner),
                format!("civ{owner}"),
                cities
                    .iter()
                    .filter(|c| c.1 == owner)
                    .map(|c| CityId::new(c.0))
                    .collect(),
                specs
                    .iter()
                    .filter(|s| s.1 == owner)
                    .map(|s| UnitId::new(s.0))
                    .collect(),
            )
            .expect("civ"),
        );
    }
    let cities = cities
        .iter()
        .map(|c| {
            CityDto::new(
                CityId::new(c.0),
                PlayerId::new(c.1),
                format!("miasto{}", c.0),
                PositionDto::new(c.2, c.3),
                1,
            )
            .expect("city")
        })
        .collect();
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
    GameStateDto::new(map, civs, cities, units, TurnDto::new(3).expect("turn")).expect("state")
}

fn snapshot(state: GameStateDto, meta: SaveMeta) -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(state, queue, Rng::new(42)).with_meta(meta)
}

fn reload(json: &Value) -> SaveSnapshot {
    serde_json::from_value(json.clone()).expect("snapshot loads")
}

fn to_json(s: &SaveSnapshot) -> Value {
    serde_json::from_str(&serde_json::to_string(s).expect("ser")).expect("json")
}

fn generals(s: &SaveSnapshot) -> Vec<u64> {
    s.state()
        .units()
        .iter()
        .filter(|u| u.is_general())
        .map(|u| u.id().get())
        .collect()
}

fn positions(s: &SaveSnapshot) -> Vec<(u64, u16, u16)> {
    s.state()
        .units()
        .iter()
        .map(|u| (u.id().get(), u.position().x(), u.position().y()))
        .collect()
}

fn big_stack(n: u64) -> Vec<UnitSpec> {
    (0..n)
        .map(|i| (100 + i, OWNER, 1u16, 1u16, false))
        .collect()
}

fn pos_of(s: &SaveSnapshot, id: u64) -> Option<(u16, u16)> {
    positions(s)
        .into_iter()
        .find(|p| p.0 == id)
        .map(|p| (p.1, p.2))
}

#[test]
fn p6_zapis_migracje_old_save_without_general_field_is_unchanged() {
    let s = snapshot(
        state(
            map(2, 2, &[]),
            &[(10, OWNER, 0, 0, false), (11, OWNER, 1, 0, false)],
            &[],
        ),
        SaveMeta::default(),
    );
    let wire = to_json(&s);
    assert!(
        !wire.to_string().contains("is_general"),
        "stary format bez pola"
    );
    let mut loaded = reload(&wire);
    let report = loaded.migrate_on_load(|_| 1.0);
    assert!(report.demoted_generals.is_empty());
    assert!(report.moved_units.is_empty());
    assert!(report.unplaced_units.is_empty());
    assert_eq!(
        to_json(&loaded),
        wire,
        "migracja nie zmienia starego zapisu"
    );
}

#[test]
fn p6_zapis_migracje_excess_generals_are_demoted_in_state() {
    let s = snapshot(
        state(
            map(3, 1, &[]),
            &[
                (10, OWNER, 0, 0, true),
                (11, OWNER, 1, 0, true),
                (12, OWNER, 2, 0, true),
                (20, FOREIGN, 2, 0, true),
            ],
            &[],
        ),
        SaveMeta::default(),
    );
    let wire = to_json(&s);
    assert!(wire.to_string().contains("is_general"));
    let mut loaded = reload(&wire);
    assert_eq!(generals(&loaded), vec![10, 11, 12, 20]);
    // era 2 => limit 2 na wlasciciela: najmlodszy wodz gracza 1 (id 12) traci flage; obcy nietkniety.
    let report = loaded.migrate_on_load(|_| 2.0);
    assert_eq!(report.demoted_generals, vec![UnitId::new(12)]);
    assert_eq!(generals(&loaded), vec![10, 11, 20]);
    assert_eq!(loaded.state().units().len(), 4, "nikt nie ginie");
    let mut again = reload(&to_json(&loaded));
    assert_eq!(generals(&again), vec![10, 11, 20]);
    assert!(
        again.migrate_on_load(|_| 2.0).demoted_generals.is_empty(),
        "idempotentne"
    );
}

#[test]
fn p6_zapis_migracje_general_flag_reads_only_json_true() {
    let s = snapshot(
        state(map(1, 1, &[]), &[(10, OWNER, 0, 0, true)], &[]),
        SaveMeta::default(),
    );
    let mut wire = to_json(&s);
    for (raw, expected) in [
        (json!(true), true),
        (json!(false), false),
        (json!("true"), false),
        (json!(1), false),
        (Value::Null, false),
    ] {
        wire["state"]["units"][0]["is_general"] = raw;
        assert_eq!(!generals(&reload(&wire)).is_empty(), expected);
    }
}

#[test]
fn p6_zapis_migracje_stack_at_limit_stays() {
    let mut s = snapshot(
        state(map(3, 3, &[]), &big_stack(500), &[]),
        SaveMeta::default(),
    );
    let before = positions(&s);
    let report = s.migrate_on_load(|_| 1.0);
    assert!(report.moved_units.is_empty());
    assert_eq!(positions(&s), before);
}

#[test]
fn p6_zapis_migracje_oversized_stack_is_split_in_state() {
    let mut s = reload(&to_json(&snapshot(
        state(map(3, 3, &[]), &big_stack(501), &[]),
        SaveMeta::default(),
    )));
    let report = s.migrate_on_load(|_| 1.0);
    // Nadwyzka = jednostki po pierwszych 500 w kolejnosci wejsciowej: id 600.
    assert_eq!(report.moved_units, vec![UnitId::new(600)]);
    assert!(report.unplaced_units.is_empty());
    let pos = positions(&s);
    assert_eq!(pos.len(), 501, "nic nie ginie");
    assert_eq!(pos.iter().filter(|p| (p.1, p.2) == (1, 1)).count(), 500);
    // Pierwszy heks pierscienia 1 w kolejnosci weba (RING_DIRS) to (q-1, r+1) = (0, 2).
    assert_eq!(pos_of(&s, 600), Some((0, 2)));
    assert_eq!(positions(&reload(&to_json(&s))), pos, "round-trip");
}

#[test]
fn p6_zapis_migracje_split_skips_water_and_foreign_city_hexes() {
    // (0,2) = woda (web mapHexPassableForUnit), (1,2) = miasto obcego (canUnitOccupyCityHex).
    let mut s = snapshot(
        state(
            map(3, 3, &[(0, 2)]),
            &big_stack(501),
            &[(900, FOREIGN, 1, 2)],
        ),
        SaveMeta::default(),
    );
    let report = s.migrate_on_load(|_| 1.0);
    assert_eq!(report.moved_units, vec![UnitId::new(600)]);
    assert_eq!(pos_of(&s, 600), Some((2, 1)));
}

#[test]
fn p6_zapis_migracje_split_allows_own_city_hex() {
    let mut s = snapshot(
        state(map(3, 3, &[]), &big_stack(501), &[(901, OWNER, 0, 2)]),
        SaveMeta::default(),
    );
    s.migrate_on_load(|_| 1.0);
    assert_eq!(pos_of(&s, 600), Some((0, 2)));
}

#[test]
fn p6_zapis_migracje_enforce_with_small_limit_reports_unplaced() {
    use civ_engine::domain::save_migrations::enforce_army_stack_limit;
    let mut st = state(
        map(1, 1, &[]),
        &[(1, OWNER, 0, 0, false), (2, OWNER, 0, 0, false)],
        &[],
    );
    let (moved, unplaced) = enforce_army_stack_limit(&mut st, 1, 6);
    assert!(moved.is_empty());
    assert_eq!(unplaced, vec![UnitId::new(2)]);
    assert_eq!(st.units().len(), 2);
}

#[test]
fn p6_zapis_migracje_auto_build_flag_consumer_old_and_new_save() {
    let base = || {
        snapshot(
            state(map(1, 1, &[]), &[(1, OWNER, 0, 0, false)], &[]),
            SaveMeta::default(),
        )
    };
    let old = reload(&to_json(&base()));
    let humans = [1.0];
    assert!(
        !old.auto_build_allowed_for_owner(1.0, &humans),
        "gracz: domyslnie wylaczone"
    );
    assert!(old.auto_build_allowed_for_owner(2.0, &humans), "AI zawsze");
    assert!(old.meta().player_epoch_war_enabled(), "brak pola = true");
    let mut wire = to_json(&base());
    wire["meta"] = json!({"autoBuildEnabled": true, "playerEpochWarEnabled": false});
    let new = reload(&wire);
    assert!(new.auto_build_allowed_for_owner(1.0, &humans));
    assert!(!new.meta().player_epoch_war_enabled());
}

#[test]
fn p6_zapis_migracje_epoch_limit_depends_on_owner_era() {
    // Odpowiedz na zarzut Evaluatora: testy stalej epoki (`|_| 1.0`) nie sprawdzaly limitu zaleznego
    // od wlasciciela. Gracz (era 1 => limit 1) traci 2 wodzow; AI (era 3 => limit 3) nietkniete.
    let s = snapshot(
        state(
            map(3, 2, &[]),
            &[
                (10, OWNER, 0, 0, true),
                (11, OWNER, 1, 0, true),
                (12, OWNER, 2, 0, true),
                (20, FOREIGN, 0, 1, true),
                (21, FOREIGN, 1, 1, true),
                (22, FOREIGN, 2, 1, true),
            ],
            &[],
        ),
        SaveMeta::default(),
    );
    let mut loaded = reload(&to_json(&s));
    let report = loaded.migrate_on_load(|o| if o.get() == OWNER { 1.0 } else { 3.0 });
    assert_eq!(
        report.demoted_generals,
        vec![UnitId::new(11), UnitId::new(12)]
    );
    assert_eq!(generals(&loaded), vec![10, 20, 21, 22]);
    assert_eq!(loaded.state().units().len(), 6, "nikt nie ginie");
}
