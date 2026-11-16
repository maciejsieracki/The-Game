//! R-RUSTPORT-P4-1F3-SIEGE-WONDER-VIEW: wektory producenta `sieges[]` i `wonders[]`
//! (`civ_engine::domain::overlays_view`). Kazdy wektor cytuje `plik:linia` pinu `07d2fbd72` (`gra/src/…`).

use civ_engine::data::buildings_tech::parse_wonders;
use civ_engine::domain::overlays_view::{
    camp_owner_at_hex, machines_by_camp_hex, siege_views, wonder_is_ruin, wonder_views,
    wonder_views_with_era, OverlaysViewError,
};
use civ_engine::domain::playable::{
    MovementPoints, PlayableCity, PlayablePlacedWonder, PlayableSiegeMachineKind,
};
use civ_engine::{
    CityId, PlayableGame, PlayableState, PlayableUnit, PlayableUnitKind, PlayerId, PositionDto,
    StartGameParams, UnitId,
};
use civ_view_model as vm;
use civ_view_model::SiegeMachineKind;

const CITY_OWNER: u64 = 1;
const ENEMY: u64 = 2;
const NEUTRAL: u64 = 3;

fn unit(id: u64, owner: u64, x: u16, y: u16) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(x, y),
        movement: MovementPoints::from(1_u8),
        movement_max: MovementPoints::from(1_u8),
        selected: false,
    }
}

fn city(id: u64, owner: u64, x: u16, y: u16) -> PlayableCity {
    PlayableCity {
        id: CityId::new(id),
        owner_id: PlayerId::new(owner),
        name: format!("Miasto {id}"),
        position: PositionDto::new(x, y),
        is_capital: false,
        population: 1,
        culture: 0,
    }
}

/// Web `areEnemyOwners` dla wektorow: wojna wylacznie miedzy `CITY_OWNER` i `ENEMY`.
fn at_war(a: i64, b: i64) -> bool {
    let (c, e) = (CITY_OWNER as i64, ENEMY as i64);
    (a == c && b == e) || (a == e && b == c)
}

fn hex(q: i32, r: i32) -> vm::HexCoord {
    vm::HexCoord::new(q, r)
}

fn player(id: u64) -> vm::OwnerRef {
    vm::OwnerRef::Player(vm::PlayerId::try_new(id).expect("id"))
}

fn besieged_state(units: Vec<PlayableUnit>) -> PlayableState {
    let mut state = PlayableState::empty();
    state.cities = vec![city(10, CITY_OWNER, 5, 5)];
    state.units = units;
    state.oblegane.insert(CityId::new(10));
    state
}

/// `main.ts:17501-17508`: `for (const u of units) … camps.push(keyOf(u.q, u.r))` - jeden wpis na
/// jednostke, wiec stos 2 wrogich jednostek na jednym heksie obozu daje 2 wpisy (mutacja (b):
/// deduplikacja powtorzen daje 1 wpis -> FAIL).
#[test]
fn stack_of_two_units_on_one_camp_hex_gives_two_entries() {
    let state = besieged_state(vec![unit(1, ENEMY, 6, 5), unit(2, ENEMY, 6, 5)]);
    let sieges = siege_views(&state, at_war).expect("sieges");
    assert_eq!(sieges.len(), 1);
    let camps: Vec<vm::HexCoord> = sieges[0].camp_hexes.iter().map(|c| c.hex).collect();
    assert_eq!(camps, vec![hex(6, 5), hex(6, 5)]);
    assert!(sieges[0]
        .camp_hexes
        .iter()
        .all(|c| c.owner_id == player(ENEMY)));
    assert_eq!(sieges[0].city_hex, hex(5, 5));
    assert_eq!(sieges[0].city_id, vm::CityId::try_new(10).expect("id"));
}

/// `render/siegeCampSync.ts:14-27` (`machinesByCampHex`): `campHexes[i % campHexes.length]`, czyli
/// round-robin po liscie obozow producenta; machiny = `readyMachinesForCity` (`siegeCampSync.ts:7-12`,
/// wolane z `main.ts:17511`).
#[test]
fn three_machines_on_two_camps_round_robin() {
    let mut state = besieged_state(vec![unit(1, ENEMY, 6, 5), unit(2, ENEMY, 4, 5)]);
    state.siege_machines_ready.insert(
        CityId::new(10),
        vec![
            PlayableSiegeMachineKind::Taran,
            PlayableSiegeMachineKind::Wieza,
            PlayableSiegeMachineKind::Taran,
        ],
    );
    let sieges = siege_views(&state, at_war).expect("sieges");
    let siege = &sieges[0];
    assert_eq!(
        siege.ready_machines,
        vec![
            SiegeMachineKind::Taran,
            SiegeMachineKind::Wieza,
            SiegeMachineKind::Taran
        ]
    );
    let camps: Vec<vm::HexCoord> = siege.camp_hexes.iter().map(|c| c.hex).collect();
    assert_eq!(camps, vec![hex(6, 5), hex(4, 5)]);
    let by_camp = machines_by_camp_hex(&camps, &siege.ready_machines);
    assert_eq!(
        by_camp,
        vec![
            (
                hex(6, 5),
                vec![SiegeMachineKind::Taran, SiegeMachineKind::Taran]
            ),
            (hex(4, 5), vec![SiegeMachineKind::Wieza]),
        ]
    );
}

/// `siegeCampSync.ts:18-26`: round-robin po liscie Z POWTORZENIAMI - dwa wpisy tego samego heksa
/// trafiaja do jednego wpisu mapy; pusta lista obozow albo machin = pusta mapa (`:19`).
#[test]
fn round_robin_over_duplicates_and_empty_inputs() {
    let camps = [hex(6, 5), hex(6, 5), hex(4, 5)];
    let ready = [
        SiegeMachineKind::Taran,
        SiegeMachineKind::Wieza,
        SiegeMachineKind::Wieza,
        SiegeMachineKind::Taran,
    ];
    assert_eq!(
        machines_by_camp_hex(&camps, &ready),
        vec![
            (
                hex(6, 5),
                vec![
                    SiegeMachineKind::Taran,
                    SiegeMachineKind::Wieza,
                    SiegeMachineKind::Taran
                ]
            ),
            (hex(4, 5), vec![SiegeMachineKind::Wieza]),
        ]
    );
    assert!(machines_by_camp_hex(&[], &ready).is_empty());
    assert!(machines_by_camp_hex(&camps, &[]).is_empty());
}

/// `main.ts:17503-17504`: `if (!siegeAllowedBetween(u.ownerId, c.ownerId, areEnemyOwners)) continue;`:
/// jednostka nie-wroga (trzecia strona bez wojny) i jednostka wlasciciela miasta obok miasta sa
/// pominiete; `hexDistance === 1` (`:17505`) - jednostka na dystansie 2 tez pominieta.
#[test]
fn non_enemy_unit_next_to_city_is_skipped() {
    let state = besieged_state(vec![
        unit(1, NEUTRAL, 5, 6),
        unit(2, CITY_OWNER, 4, 6),
        unit(3, ENEMY, 7, 5),
        unit(4, ENEMY, 5, 4),
    ]);
    let sieges = siege_views(&state, at_war).expect("sieges");
    let camps: Vec<vm::HexCoord> = sieges[0].camp_hexes.iter().map(|c| c.hex).collect();
    assert_eq!(camps, vec![hex(5, 4)]);
}

/// `render/siegeCampSync.ts:43` (`campOwnerByHex`, wolane z `main.ts:17514` z PELNA lista `units`):
/// `units.find(u => u.q === q && u.r === r && u.ownerId !== cityOwnerId)`. Pierwsza jednostka na heksie
/// obozu nalezy do wlasciciela miasta, druga do trzeciej strony (bez wojny), trzecia do wroga: obozem
/// jest tylko wrog, ale wlascicielem obozu jest trzecia strona (pierwsza nie-wlasciciel miasta z pelnej
/// listy). Mutacja (c) "pierwsza jednostka na heksie" daje `CITY_OWNER`; mutacja "tylko jednostki obozu"
/// daje `ENEMY` - obie FAIL.
#[test]
fn camp_owner_is_first_non_city_owner_unit_of_full_list() {
    let state = besieged_state(vec![
        unit(1, CITY_OWNER, 6, 5),
        unit(2, NEUTRAL, 6, 5),
        unit(3, ENEMY, 6, 5),
    ]);
    let sieges = siege_views(&state, at_war).expect("sieges");
    let camps = &sieges[0].camp_hexes;
    assert_eq!(camps.len(), 1);
    assert_eq!(camps[0].hex, hex(6, 5));
    assert_eq!(camps[0].owner_id, player(NEUTRAL));
    assert_eq!(
        camp_owner_at_hex(hex(6, 5), &state.units, PlayerId::new(CITY_OWNER)),
        Some(PlayerId::new(NEUTRAL))
    );
}

/// `main.ts:17493` i `:17497-17498`: `cities.filter(c => c.oblegane)` w kolejnosci `cities`; miasto bez
/// `oblegane` nie daje wpisu; oblegane miasto bez obozow daje wpis z pustymi listami
/// (`readyMachinesForCity` -> `?? []`, `siegeCampSync.ts:10-11`).
#[test]
fn only_besieged_cities_in_cities_order() {
    let mut state = PlayableState::empty();
    state.cities = vec![
        city(30, CITY_OWNER, 1, 1),
        city(20, CITY_OWNER, 9, 9),
        city(10, CITY_OWNER, 5, 5),
    ];
    state.units = vec![unit(1, ENEMY, 6, 5)];
    state.oblegane.insert(CityId::new(10));
    state.oblegane.insert(CityId::new(30));
    // Machiny miasta nieoblezonego nie tworza wpisu.
    state
        .siege_machines_ready
        .insert(CityId::new(20), vec![PlayableSiegeMachineKind::Wieza]);
    let sieges = siege_views(&state, at_war).expect("sieges");
    let ids: Vec<u64> = sieges.iter().map(|s| s.city_id.get()).collect();
    assert_eq!(ids, vec![30, 10]);
    assert!(sieges[0].camp_hexes.is_empty());
    assert!(sieges[0].ready_machines.is_empty());
    assert_eq!(sieges[1].camp_hexes.len(), 1);
    assert!(siege_views(&PlayableState::empty(), at_war)
        .expect("empty")
        .is_empty());
}

/// `main.ts:4199-4203` (`wonderIsRuin`): `empireEpochForOwner(ownerId) > getWonderAbsolutEpoka(w)`.
/// `era == absolut` -> NIE ruina (mutacja (a) `>=` -> FAIL); `era > absolut` -> ruina.
#[test]
fn wonder_ruin_boundary_equal_is_not_ruin() {
    let wonders = parse_wonders().expect("wonders.json");
    let piramidy = wonders
        .cuda
        .iter()
        .find(|w| w.id == "piramidy")
        .expect("piramidy");
    let absolut = piramidy.absolut as f64;
    assert!(!wonder_is_ruin(&wonders, "piramidy", absolut));
    assert!(wonder_is_ruin(&wonders, "piramidy", absolut + 1.0));
    assert!(!wonder_is_ruin(&wonders, "piramidy", absolut - 1.0));
}

/// `main.ts:4201` (`if (!w) return false;`, `getWonderById` = `wonders-data.ts:101`, `:109-111`):
/// nieznany `wonderId` -> NIE ruina dla dowolnej epoki.
#[test]
fn unknown_wonder_is_never_ruin() {
    let wonders = parse_wonders().expect("wonders.json");
    assert!(!wonder_is_ruin(&wonders, "nie_ma_takiego_cudu", 99.0));
    assert!(!wonder_is_ruin(&wonders, "nie_ma_takiego_cudu", f64::NAN));
}

/// `main.ts:4202`: `NaN > absolut` = `false` w JS -> NIE ruina (porownanie wprost, nie
/// `!wonderBonusActive`, ktore dla `NaN` daloby ruine).
#[test]
fn nan_era_is_not_ruin() {
    let wonders = parse_wonders().expect("wonders.json");
    assert!(!wonder_is_ruin(&wonders, "piramidy", f64::NAN));
}

/// `main.ts:4205-4210` (`placedWonderSnapshot`): `placedWorldWonders.map(pw => ({...pw, ruin}))` -
/// kolejnosc tablicy, `q/r/ownerId/wonderId` przepisane, `ruin` z epoki wlasciciela.
#[test]
fn wonder_views_keep_order_and_use_owner_era() {
    let wonders = parse_wonders().expect("wonders.json");
    let absolut = wonders
        .cuda
        .iter()
        .find(|w| w.id == "piramidy")
        .expect("piramidy")
        .absolut as f64;
    let mut state = PlayableState::empty();
    state.placed_world_wonders = vec![
        PlayablePlacedWonder {
            wonder_id: "piramidy".to_owned(),
            q: 3,
            r: -2,
            owner_id: PlayerId::new(7),
        },
        PlayablePlacedWonder {
            wonder_id: "piramidy".to_owned(),
            q: 1,
            r: 1,
            owner_id: PlayerId::new(8),
        },
        PlayablePlacedWonder {
            wonder_id: "nieznany".to_owned(),
            q: 0,
            r: 0,
            owner_id: PlayerId::new(7),
        },
    ];
    let views = wonder_views_with_era(&state, &wonders, |owner| {
        Ok(match owner.get() {
            7 => absolut + 1.0,
            8 => absolut,
            _ => f64::NAN,
        })
    })
    .expect("views");
    let summary: Vec<(&str, vm::HexCoord, vm::OwnerRef, bool)> = views
        .iter()
        .map(|v| (v.wonder_id.as_str(), v.hex, v.owner_id, v.ruin))
        .collect();
    assert_eq!(
        summary,
        vec![
            ("piramidy", hex(3, -2), player(7), true),
            ("piramidy", hex(1, 1), player(8), false),
            ("nieznany", hex(0, 0), player(7), false),
        ]
    );
    // Nieznany cud nie pyta o epoke (web `if (!w) return false` przed `empireEpochForOwner`).
    let mut only_unknown = PlayableState::empty();
    only_unknown.placed_world_wonders = vec![state.placed_world_wonders[2].clone()];
    let views = wonder_views_with_era(&only_unknown, &wonders, |_| {
        Err(OverlaysViewError::WondersData(
            "epoka nie powinna byc pytana".to_owned(),
        ))
    })
    .expect("unknown wonder skips era");
    assert!(!views[0].ruin);
}

/// Sciezka produkcyjna (`empireEpochForOwner` z faktow stanu, `main.ts:2419`): czlowiek ma epoke startu
/// (`kamien` = 1), wiec cud z `absolut` 6 nie jest ruina.
#[test]
fn production_wonder_views_use_state_epoch() {
    let mut state = PlayableGame::new(StartGameParams::default())
        .expect("scenario")
        .state()
        .clone();
    let human = state.players.iter().find(|p| p.is_human).expect("human").id;
    state.placed_world_wonders = vec![PlayablePlacedWonder {
        wonder_id: "piramidy".to_owned(),
        q: 2,
        r: 1,
        owner_id: human,
    }];
    let views = wonder_views(&state).expect("views");
    assert_eq!(views.len(), 1);
    assert!(!views[0].ruin);
    assert_eq!(views[0].hex, hex(2, 1));
    assert!(wonder_views(&PlayableState::empty())
        .expect("empty")
        .is_empty());
}
