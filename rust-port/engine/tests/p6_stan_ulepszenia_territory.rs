//! P6-STAN-TERYTORIUM-VEC (Q1): wektory pinu dla skladnika `heksy_terytorium` z fortami/posterunkami na `PlayableState`.
//!
//! Wektory: `p6_stan_ulepszenia_territory_vectors/vectors.json` generuje
//! `tests/p6_stan_ulepszenia_territory_gen.mjs`, ktory WYKONUJE w node wyciety kod weba z pinu 07d2fbd72:
//! `statsTerritoryNodesForOwner` + `countTerritoryHexesRaw` (main.ts), `foundingNodesForOwner` (fort-territory.ts),
//! `cityTerritoryRadius` (map/territory.ts), `cityRangeForPopulation` / `hexKeysWithinRadiusRaw` (game/okolica.ts).
//! Oczekiwanie pochodzi z weba, NIE z Rusta.
//!
//! Test sprawdza producent `terytorium_for_owner` przez `power_raw_for_owner` (sciezka produkcyjna):
//! miasta wlasciciela + wlasne, nie-bezuzyteczne forty/posterunki stanu, zliczane po heksach istniejacych na mapie,
//! z fortami obcymi (nie wchodza), z fortami poza mapa (nie licza sie) i z remisem `built_at_turn` (kolejnosc `seq`
//! nie wplywa na ten skladnik - zmierzone na webie jako `expected_no_order`).

use civ_engine::domain::brake_power::Component;
use civ_engine::domain::playable::{
    PlayableCity, PlayableFort, PlayableFortKind, PlayableGame, PlayableMap, PlayableState,
    PlayableTerrain, PlayableTile, StartGameParams,
};
use civ_engine::domain::turn_war_inputs::power_raw_for_owner;
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::{CityId, PlayerId};

const TERRITORY_VECTORS: &str = include_str!("p6_stan_ulepszenia_territory_vectors/vectors.json");
const TERRITORY_PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";
/// SHA-256 wycietego kodu weba (statsTerritoryNodesForOwner, countTerritoryHexesRaw, foundingNodesForOwner, ...).
const TERRITORY_EXTRACTED_SHA256: &str =
    "491e441c6fdf52465065aac9d95966761cba83c7cbdaa008b734a098b852da49";
const TERRITORY_MIN_CASES: usize = 200;
const TERRITORY_MIN_TIE_CASES: usize = 40;
const TERRITORY_MIN_FORT_CHANGED: usize = 30;

/// Stan z graczami 1..3 (producent wymaga wpisu w `players`, jak w p6_stan_ulepszenia.rs `base_state`).
fn players_state() -> PlayableState {
    let mut game = PlayableGame::new(StartGameParams {
        seed: 11,
        ..StartGameParams::default()
    })
    .expect("scenario");
    game.add_player(2, "AI".to_owned()).expect("ai2");
    game.add_player(3, "AI3".to_owned()).expect("ai3");
    game.state().clone()
}

fn json_u16(v: &serde_json::Value, key: &str) -> u16 {
    v[key].as_u64().unwrap_or_else(|| panic!("pole {key}")) as u16
}

/// Stan z przypadku. `drop_order` usuwa `built_at_turn`/`seq` (lustro `expected_no_order` z weba);
/// `reverse_seq` odwraca kolejnosc `seq` (inwariancja wzgledem kolejnosci budowy).
fn state_of(case: &serde_json::Value, drop_order: bool, reverse_seq: bool) -> PlayableState {
    let w = json_u16(case, "w");
    let h = json_u16(case, "h");
    let text = case["tiles"].as_str().expect("tiles");
    let tiles: Vec<PlayableTile> = text
        .chars()
        .enumerate()
        .map(|(i, ch)| {
            let x = (i % usize::from(w)) as u16;
            let y = (i / usize::from(w)) as u16;
            let terrain = match ch {
                'W' => PlayableTerrain::Water,
                'F' => PlayableTerrain::Forest,
                'P' => PlayableTerrain::Plains,
                other => panic!("nieznany teren {other}"),
            };
            let passable = !matches!(terrain, PlayableTerrain::Water);
            PlayableTile {
                position: PositionDto::new(x, y),
                terrain,
                passable,
            }
        })
        .collect();
    assert_eq!(tiles.len(), usize::from(w) * usize::from(h), "rozmiar mapy");
    let mut state = players_state();
    state.map = PlayableMap {
        width: w,
        height: h,
        tiles,
        improvements: Vec::new(),
    };
    state.cities = case["cities"]
        .as_array()
        .expect("cities")
        .iter()
        .enumerate()
        .map(|(i, c)| PlayableCity {
            id: CityId::new(i as u64 + 1),
            owner_id: PlayerId::new(c["owner"].as_u64().expect("owner")),
            name: format!("c{}", i + 1),
            position: PositionDto::new(json_u16(c, "x"), json_u16(c, "y")),
            is_capital: false,
            population: c["pop"].as_u64().expect("pop") as u32,
            culture: 0,
        })
        .collect();
    let forts_json = case["forts"].as_array().expect("forts");
    // Odwrocenie kolejnosci: nowy seq = (max + min) - seq dla zbioru fortow przypadku.
    let all_seq: Vec<i64> = forts_json
        .iter()
        .filter_map(|x| x.get("seq").and_then(serde_json::Value::as_i64))
        .collect();
    let seq_max = all_seq.iter().copied().max().unwrap_or(0);
    let seq_min = all_seq.iter().copied().min().unwrap_or(0);
    state.forts = forts_json
        .iter()
        .map(|f| {
            let seq = if drop_order {
                None
            } else {
                f.get("seq").and_then(serde_json::Value::as_i64).map(|s| {
                    if reverse_seq {
                        seq_max + seq_min - s
                    } else {
                        s
                    }
                })
            };
            PlayableFort {
                q: f["q"].as_i64().expect("q") as i32,
                r: f["r"].as_i64().expect("r") as i32,
                owner_id: PlayerId::new(f["owner"].as_u64().expect("owner")),
                kind: match f["kind"].as_str().expect("kind") {
                    "fort" => PlayableFortKind::Fort,
                    "posterunek" => PlayableFortKind::Posterunek,
                    other => panic!("rodzaj fortu {other}"),
                },
                contested_useless: f
                    .get("contested_useless")
                    .and_then(serde_json::Value::as_bool),
                built_at_turn: if drop_order {
                    None
                } else {
                    f.get("built_at_turn").and_then(serde_json::Value::as_i64)
                },
                seq,
            }
        })
        .collect();
    state
}

fn terytorium(state: &PlayableState, owner: i64) -> f64 {
    match power_raw_for_owner(state, owner, 1.0)
        .expect("power_raw")
        .heksy_terytorium
    {
        Component::Provided(v) => v,
        other => panic!("heksy_terytorium musi byc Provided, jest {other:?}"),
    }
}

#[test]
fn heksy_terytorium_with_forts_matches_pin() {
    let root: serde_json::Value = serde_json::from_str(TERRITORY_VECTORS).expect("vectors.json");
    assert_eq!(root["pin"].as_str(), Some(TERRITORY_PIN), "pin wektorow");
    assert_eq!(
        root["extracted_sha256"].as_str(),
        Some(TERRITORY_EXTRACTED_SHA256),
        "SHA-256 wycietego kodu weba"
    );
    let owners: Vec<i64> = root["owners"]
        .as_array()
        .expect("owners")
        .iter()
        .map(|o| o.as_i64().expect("owner"))
        .collect();
    let cases = root["cases"].as_array().expect("cases");
    assert!(
        cases.len() >= TERRITORY_MIN_CASES,
        "wymagane >= {TERRITORY_MIN_CASES} przypadkow, jest {}",
        cases.len()
    );
    let mut tie_cases = 0usize;
    let mut fort_changed = 0usize;
    let mut checks = 0usize;
    for (i, case) in cases.iter().enumerate() {
        if case["tie_built_at_turn"].as_bool() == Some(true) {
            tie_cases += 1;
        }
        let state = state_of(case, false, false);
        let mut no_forts = state.clone();
        no_forts.forts.clear();
        let no_order = state_of(case, true, false);
        let reversed = state_of(case, false, true);
        let mut changed_here = false;
        for owner in &owners {
            let key = owner.to_string();
            let expected = case["expected"][&key].as_i64().expect("expected") as f64;
            let without = case["expected_without_forts"][&key]
                .as_i64()
                .expect("expected_without_forts") as f64;
            let no_order_expected = case["expected_no_order"][&key]
                .as_i64()
                .expect("expected_no_order") as f64;
            assert_eq!(
                terytorium(&state, *owner),
                expected,
                "przypadek {i}, wlasciciel {owner}: heksy_terytorium z fortami (pin {expected})"
            );
            assert_eq!(
                terytorium(&no_forts, *owner),
                without,
                "przypadek {i}, wlasciciel {owner}: heksy_terytorium bez fortow (pin {without})"
            );
            assert_eq!(
                terytorium(&no_order, *owner),
                no_order_expected,
                "przypadek {i}, wlasciciel {owner}: bez builtAtTurn/seq (pin {no_order_expected})"
            );
            assert_eq!(
                terytorium(&reversed, *owner),
                expected,
                "przypadek {i}, wlasciciel {owner}: odwrocona kolejnosc seq nie moze zmienic skladnika"
            );
            if expected != without {
                changed_here = true;
            }
            checks += 1;
        }
        if changed_here {
            fort_changed += 1;
        }
    }
    assert_eq!(checks, cases.len() * owners.len(), "liczba sprawdzen");
    assert!(
        tie_cases >= TERRITORY_MIN_TIE_CASES,
        "za malo przypadkow z remisem builtAtTurn: {tie_cases}"
    );
    assert!(
        fort_changed >= TERRITORY_MIN_FORT_CHANGED,
        "za malo przypadkow zmienianych przez forty: {fort_changed}"
    );
}

#[test]
fn foreign_and_contested_forts_do_not_add_territory() {
    // Stan minimalny: jedno miasto wlasciciela 1 (pop 5 -> promien 5) na mapie 12x12 bez wody.
    let tiles: Vec<PlayableTile> = (0..12u16)
        .flat_map(|y| (0..12u16).map(move |x| (x, y)))
        .map(|(x, y)| PlayableTile {
            position: PositionDto::new(x, y),
            terrain: PlayableTerrain::Plains,
            passable: true,
        })
        .collect();
    let mut base = players_state();
    base.map = PlayableMap {
        width: 12,
        height: 12,
        tiles,
        improvements: Vec::new(),
    };
    base.cities = vec![PlayableCity {
        id: CityId::new(1),
        owner_id: PlayerId::new(1),
        name: "c1".to_string(),
        position: PositionDto::new(6, 6),
        is_capital: false,
        population: 5,
        culture: 0,
    }];
    let before = terytorium(&base, 1);
    assert!(before > 0.0, "miasto daje terytorium");
    let mut with = base.clone();
    // Fort wlasciciela 2 daleko od miasta wlasciciela 1 (poza jego dyskiem r=5).
    with.forts = vec![PlayableFort {
        q: 0,
        r: 0,
        owner_id: PlayerId::new(2),
        kind: PlayableFortKind::Fort,
        contested_useless: None,
        built_at_turn: Some(1),
        seq: Some(0),
    }];
    assert_eq!(
        terytorium(&with, 1),
        before,
        "obcy fort nie dodaje heksow wlasciciela 1"
    );
    // Fort wlasciciela 2 w rogu mapy (0,0): dysk r=5 przyciety do mapy = 21 heksow (1+2+...+6).
    assert_eq!(
        terytorium(&with, 2),
        21.0,
        "wlasny fort wlasciciela 2 daje dysk r=5 przyciety do mapy (21 heksow)"
    );
    with.forts[0].owner_id = PlayerId::new(1);
    with.forts[0].contested_useless = Some(true);
    assert_eq!(
        terytorium(&with, 1),
        before,
        "fort bezuzyteczny (contested_useless) nie dodaje heksow wlascicielowi"
    );
    with.forts[0].contested_useless = Some(false);
    assert!(
        terytorium(&with, 1) > before,
        "wlasny, uzyteczny fort rozszerza terytorium"
    );
}
