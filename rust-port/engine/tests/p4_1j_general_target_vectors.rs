//! P4-1J-GENERALTARGET-WDROZENIE: zapis i odczyt pola `generalTargetId` planu marszu w
//! `PlayableState` wzgledem URUCHOMIONEGO kodu pinu `07d2fbd72` (`gra/src/game/planned-march.ts`
//! `plannedMarchesFromSave` :451-482 z galeziami :466 i :471-472, `plannedMarchesToSave` :485-501
//! z linia :496).
//!
//! Wektory: `p4_1j_general_target_vectors/vectors.json`, wygenerowane przez
//! `p4_1j_general_target_vectors/gen.mjs` (tryb `--check` porownuje plik z wynikiem generatora).
//! Generator sprawdza SHA-256 pliku zrodlowego i wycietych funkcji; ten test sprawdza skroty
//! zapisane w wektorach z wartosciami [`EXPECTED_FRAGMENT_SHA256`].
//!
//! Zakres: warstwa `PlayableState` (`PlayablePlannedMarch::general_target_id`). Przeliczanie celu
//! na zywego generala (`syncGeneralMarchTargets`) i ścieżka rekrutacji sa poza tym plikiem.
//! Wektory warstwy pathfinding (`p6_repin_wojna_*`) nie sa tu powtarzane.
//!
//! Wlasciciel weba `0` (gracz) = `PlayerId(1)` w `PlayableState` (numeracja od 1), `o` -> `o + 1`.

#[path = "../src/domain/events.rs"]
#[allow(dead_code)]
mod events;

#[path = "../src/domain/save_load.rs"]
#[allow(dead_code)]
mod save_load;

#[path = "common/snapshot.rs"]
#[allow(dead_code)]
mod snapshot;

use civ_engine::domain::playable::MovementPoints;
use civ_engine::domain::playable::PlayablePlannedMarch;
use civ_engine::{
    CityDto, CityId, CivilizationDto, GameStateDto, MapDto, PlayableState, PlayableUnit,
    PlayableUnitKind, PlayerId, PositionDto, Rng, TerrainDto, TurnDto, UnitDto, UnitId,
    UnitKindDto,
};
use events::{EventQueue, TurnEvent};
use save_load::{SaveSnapshot, TurnPhase};
use serde_json::Value;
use snapshot::decode_snapshot_str;

const VECTORS: &str = include_str!("p4_1j_general_target_vectors/vectors.json");

/// Pin, z ktorego wygenerowano wektory.
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";

/// Skroty SHA-256 wycietych funkcji `planned-march.ts` (straznik po stronie Rust; generator liczy je
/// z pinu i odmawia pracy przy roznicy).
const EXPECTED_FRAGMENT_SHA256: [(&str, &str); 3] = [
    (
        "validateAutoMarchFromSave",
        "11c9e255387567fdba34fa0e6e56eff7472341d09441ee82c825becb27f0eebe",
    ),
    (
        "plannedMarchesFromSave",
        "127a9238ab3e93d64b94681c41cc695534bb0a573eab642b591971e4132d7daa",
    ),
    (
        "plannedMarchesToSave",
        "be01a3822e5b8dba02dd168271f238473741d45d33423e8f882b4d5e0c4ef4d4",
    ),
];

/// Gracz weba (`ownerId` 0) w numeracji `PlayableState`.
const PLAYER: PlayerId = PlayerId::new(1);

fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("wektory JSON")
}

fn pairs(value: &Value) -> &Vec<Value> {
    value.as_array().expect("lista par")
}

fn cases(name: &str) -> Vec<Value> {
    vectors()[name]
        .as_array()
        .expect("lista przypadkow")
        .clone()
}

/// Kanoniczny zapis dziesietny `UnitId` (wyrocznia testu; web trzyma id jako napis).
fn canonical_id(text: &str) -> Option<UnitId> {
    let value = text.parse::<u64>().ok()?;
    (value.to_string() == text).then_some(UnitId::new(value))
}

fn id_of(value: &Value) -> UnitId {
    canonical_id(value.as_str().expect("id napisem")).expect("kanoniczne id jednostki")
}

/// Liczba JSON calkowita w zakresie `i32`.
fn int_of(value: &Value) -> i32 {
    value
        .as_i64()
        .and_then(|v| i32::try_from(v).ok())
        .expect("cel calkowity i32")
}

/// Web `generalTargetId` po odczycie: niepusty napis; brak, `null`, `""` i nie-napis = `None`
/// (`planned-march.ts:471-472` i zapis `:496` z prawdziwoscia).
fn general_of(dest: &Value) -> Option<String> {
    dest.get("generalTargetId")
        .and_then(Value::as_str)
        .filter(|id| !id.is_empty())
        .map(str::to_owned)
}

fn units_of(case: &Value) -> Vec<PlayableUnit> {
    case["units"]
        .as_array()
        .expect("units")
        .iter()
        .map(|unit| {
            let owner = unit["ownerId"].as_u64().expect("ownerId");
            let q = u16::try_from(unit["q"].as_u64().expect("q")).expect("q u16");
            let r = u16::try_from(unit["r"].as_u64().expect("r")).expect("r u16");
            PlayableUnit {
                id: id_of(&unit["id"]),
                owner_id: PlayerId::new(owner + 1),
                kind: PlayableUnitKind::Warrior,
                position: PositionDto::new(q, r),
                movement: MovementPoints::from(1_u8),
                movement_max: MovementPoints::from(1_u8),
                selected: false,
            }
        })
        .collect()
}

/// Stan `PlayableState` z wpisow weba (`Map` -> `PlayablePlannedMarch`); pole generala z weba.
fn state_from_marches(case: &Value) -> PlayableState {
    let mut state = PlayableState::empty();
    state.units = units_of(case);
    for pair in pairs(&case["marches"]) {
        let dest = &pair[1];
        state.planned_marches.push(PlayablePlannedMarch {
            unit_id: id_of(&pair[0]),
            dest_q: int_of(&dest["destQ"]),
            dest_r: int_of(&dest["destR"]),
            attack_unit_id: dest.get("attackUnitId").map(id_of),
            general_target_id: general_of(dest),
        });
    }
    state
}

/// Oczekiwane wpisy po odczycie wg wyniku weba `loaded` (kolejnosc = kolejnosc `Map` weba).
fn expected_planned(loaded: &Value) -> Vec<PlayablePlannedMarch> {
    pairs(loaded)
        .iter()
        .map(|pair| {
            let dest = &pair[1];
            PlayablePlannedMarch {
                unit_id: id_of(&pair[0]),
                dest_q: int_of(&dest["destQ"]),
                dest_r: int_of(&dest["destR"]),
                attack_unit_id: dest.get("attackUnitId").map(id_of),
                general_target_id: general_of(dest),
            }
        })
        .collect()
}

fn valid_state() -> GameStateDto {
    let map = MapDto::new(
        2,
        1,
        vec![
            civ_engine::TileDto::new(PositionDto::new(0, 0), TerrainDto::Plains),
            civ_engine::TileDto::new(PositionDto::new(1, 0), TerrainDto::Hills),
        ],
    )
    .expect("map is valid");
    let civilization = CivilizationDto::new(
        PlayerId::new(1),
        "Rome",
        vec![CityId::new(7)],
        vec![UnitId::new(8)],
    )
    .expect("civilization is valid");
    let city = CityDto::new(
        CityId::new(7),
        PlayerId::new(1),
        "Roma",
        PositionDto::new(0, 0),
        1,
    )
    .expect("city is valid");
    let unit = UnitDto::new(
        UnitId::new(8),
        PlayerId::new(1),
        UnitKindDto::Warrior,
        PositionDto::new(1, 0),
    )
    .expect("unit is valid");
    GameStateDto::new(
        map,
        vec![civilization],
        vec![city],
        vec![unit],
        TurnDto::new(3).expect("turn three is valid"),
    )
    .expect("state is valid")
}

fn snapshot() -> SaveSnapshot {
    let mut queue = EventQueue::new();
    queue.enqueue(3, TurnPhase::Ai, TurnEvent::AiTurn(1));
    SaveSnapshot::new(valid_state(), queue, Rng::new(42))
}

/// Snapshot JSON z polami zapisu weba doklejonymi DOSLOWNIE (kolejnosc kluczy i powtorzenia jak w
/// tekscie; bez przejscia przez `serde_json::Value`, ktory sortuje klucze i scala powtorzenia).
fn wire_snapshot_json(web_save_json: &str) -> String {
    let base = serde_json::to_string(&snapshot()).expect("serializes");
    let body = web_save_json
        .strip_prefix('{')
        .and_then(|s| s.strip_suffix('}'))
        .expect("obiekt zapisu");
    if body.is_empty() {
        return base;
    }
    let head = base.strip_suffix('}').expect("obiekt snapshotu");
    format!("{head},{body}}}")
}

#[test]
fn vectors_match_pinned_source_and_fragment_guards() {
    let v = vectors();
    assert_eq!(v["pin"], PIN);
    for (name, expected) in EXPECTED_FRAGMENT_SHA256 {
        assert_eq!(
            v["fragments"][name]["sha256"], expected,
            "skrot wycietej funkcji {name}"
        );
    }
    assert_eq!(
        v["sources"]["planned-march.ts"][1],
        "plannedMarchesFromSave:451-482"
    );
    assert_eq!(
        v["sources"]["planned-march.ts"][2],
        "plannedMarchesToSave:485-501"
    );
}

#[test]
fn vector_counts_are_pinned() {
    assert_eq!(cases("roundtrip_cases").len(), 61);
    assert_eq!(cases("raw_cases").len(), 51);
}

#[test]
fn roundtrip_save_matches_web_and_loads_back_like_web() {
    let mut general_kept = 0;
    let mut general_on_own_position = 0;
    for case in cases("roundtrip_cases") {
        let name = case["name"].as_str().expect("name");
        let state = state_from_marches(&case);
        let save_text = case["saveText"].as_str().expect("saveText");

        // Zapis: Rust == zapis weba odczytany tym samym loaderem (pole generala, kolejnosc, autoMarch).
        let ours = snapshot().with_playable_planned_marches(&state);
        let web = decode_snapshot_str(&wire_snapshot_json(save_text)).expect("zapis weba");
        assert_eq!(ours.planned_marches(), web.planned_marches(), "{name}");
        assert_eq!(ours.auto_march(), web.auto_march(), "{name}");

        // Odczyt wlasnego zapisu: wpisy == wpisy weba po odczycie.
        let encoded = serde_json::to_string(&ours).expect("serializes");
        let decoded = decode_snapshot_str(&encoded).expect("wlasny zapis");
        let mut loaded = state.clone();
        let report = decoded.restore_planned_marches(&mut loaded, PLAYER);
        let expected = expected_planned(&case["loaded"]);
        assert_eq!(loaded.planned_marches, expected, "{name}");
        assert!(report.unrepresentable.is_empty(), "{name}");

        general_kept += expected
            .iter()
            .filter(|march| march.general_target_id.is_some())
            .count();
        general_on_own_position += pairs(&case["loaded"])
            .iter()
            .filter(|pair| {
                let dest = &pair[1];
                general_of(dest).is_some()
                    && pairs(&case["units"]).iter().any(|unit| {
                        unit["id"] == pair[0]
                            && unit["q"] == dest["destQ"]
                            && unit["r"] == dest["destR"]
                    })
            })
            .count();
    }
    // Pokrycie galezi: zachowane generaly po odczycie, wpisy generala na pozycji jednostki (:466).
    assert!(
        general_kept >= 40,
        "zachowane generalTargetId: {general_kept}"
    );
    assert!(
        general_on_own_position >= 3,
        "generalTargetId na pozycji jednostki: {general_on_own_position}"
    );
}

#[test]
fn raw_save_text_loads_general_target_like_web() {
    let mut general_kept = 0;
    for case in cases("raw_cases") {
        let name = case["name"].as_str().expect("name");
        let raw = case["rawSave"].as_str().expect("rawSave");
        // Stan przed odczytem z "brudnymi" mapami (jak generator): odczyt musi je wyczyscic.
        let mut before = PlayableState::empty();
        before.units = units_of(&case);
        before.planned_marches.push(PlayablePlannedMarch {
            unit_id: UnitId::new(1),
            dest_q: 9,
            dest_r: 9,
            attack_unit_id: None,
            general_target_id: Some("stary".to_owned()),
        });

        let decoded = decode_snapshot_str(&wire_snapshot_json(raw)).expect("zapis weba");
        let mut loaded = before.clone();
        let report = decoded.restore_planned_marches(&mut loaded, PLAYER);
        let expected = expected_planned(&case["loaded"]);
        assert_eq!(loaded.planned_marches, expected, "{name}: {raw}");
        assert!(report.unrepresentable.is_empty(), "{name}: {raw}");
        general_kept += expected
            .iter()
            .filter(|march| march.general_target_id.is_some())
            .count();
    }
    // Wartosc zmierzona na wektorach pinu (61 roundtrip, 51 raw); zmiana wektorow wymaga swiadomej zmiany tej liczby.
    assert_eq!(
        general_kept, 18,
        "zachowane generalTargetId w odczycie surowym"
    );
}

#[test]
fn empty_general_target_is_not_written_like_web() {
    // Web planned-march.ts:496: pusty napis generalTargetId nie trafia do zapisu.
    let mut state = PlayableState::empty();
    state.planned_marches.push(PlayablePlannedMarch {
        unit_id: UnitId::new(1),
        dest_q: 9,
        dest_r: 9,
        attack_unit_id: None,
        general_target_id: Some(String::new()),
    });
    let encoded = serde_json::to_string(&snapshot().with_playable_planned_marches(&state))
        .expect("serializes");
    assert!(!encoded.contains("generalTargetId"), "{encoded}");
}
