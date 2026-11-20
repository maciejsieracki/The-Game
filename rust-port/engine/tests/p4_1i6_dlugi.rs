//! R-RUSTPORT-P4-1I6-DLUGI-Q1: długi klienta bitwy oblężniczej po stronie silnika i mostu.
//!
//! * D-1I6-SETUP: odpowiedź `StartSiegeStorm` niesie `BattleSetupDto` (`siegeBattle.setup`) — scena `new BattleScene`
//!   przed `bs.play` (`main.ts:36980-37019` @ `07d2fbd72`); pozostałe odpowiedzi bez klucza.
//! * D-1I6-ERR: błąd komendy bitwy jako typ (`BridgeError.siegeBattle`: kod + dane) obok niezmienionego tekstu.
//! * D-1I6-ORPHAN / D-1I6-ABORT-E2E: `AbortSiegeBattle` zamyka bitwę bez wyniku (stan gry bez zmian, bez
//!   `StateChanged`), `Aborted` osiągalne przez most.

#![allow(dead_code)]
#![allow(clippy::float_cmp)]

#[path = "../src/bridge.rs"]
mod bridge;

use bridge::{
    BridgeDispatch, BridgeError, BridgeErrorCode, BridgeEvent, BridgeRequest, BridgeResult,
    CivEngineAdapter, EngineBridge, EngineCommand, MockEngineAdapter, SiegeBattleErrorDto,
    StartGameParams, WallMs,
};
use civ_engine::domain::city_towers::strongest_ranged_unit_for_era;
use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableCity, PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind,
    PlayableState, PlayableTerrain, PlayableUnit, PlayableUnitKind,
};
use civ_engine::domain::siege_battle_adapter::AdapterError;
use civ_engine::domain::siege_battle_adapter_body::clamp_era;
use civ_engine::domain::siege_battle_apply::{
    self, SiegeBattleError, SiegeBattlePayload, SiegeBattlePhaseDto, SIEGE_ATTACKER_COLOR,
    SIEGE_DEFENDER_COLOR,
};
use civ_engine::domain::siege_battle_session::{SessionError, SiegeBattleSession};
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};
use civ_view_model::battle::{BattleSetupDto, BattleSide, FortKind, TowerMaterial};
use serde_json::json;

const HUMAN: u64 = 1;
const ENEMY: u64 = 101;
const CITY: u64 = 900;
const CITY_POS: (u16, u16) = (4, 3);
const ANCHOR: u64 = 7001;

fn add_unit(st: &mut PlayableState, id: u64, owner: u64, pos: (u16, u16), ty: &str) {
    st.units.push(PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(pos.0, pos.1),
        movement: 1u8.into(),
        movement_max: 1u8.into(),
        selected: false,
    });
    st.economy.units.insert(
        id,
        PlayableReplaceUnit {
            type_id: Some(ty.to_owned()),
            ..PlayableReplaceUnit::default()
        },
    );
}

/// Scenariusz `p6_zdobycie_miasta_a_bridge.rs`: gracz (1) oblega stolicę 101 z taranem; `fort` = budynki miasta.
fn state(seed: u32, fort: &[&str]) -> PlayableState {
    let mut st = PlayableGame::new(StartGameParams {
        seed,
        ..StartGameParams::default()
    })
    .expect("start")
    .state()
    .clone();
    for t in &mut st.map.tiles {
        t.terrain = PlayableTerrain::Plains;
        t.passable = true;
    }
    st.units.clear();
    st.economy.units.clear();
    st.players.push(PlayablePlayer {
        id: PlayerId::new(ENEMY),
        name: "wrog".into(),
        civilization: "rzymianie".into(),
        is_human: false,
    });
    st.war.diplomacy.set_relation(
        CivilizationPair::new(PlayerId::new(HUMAN), PlayerId::new(ENEMY)),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    st.cities.push(PlayableCity {
        id: CityId::new(CITY),
        owner_id: PlayerId::new(ENEMY),
        name: "Twierdza".into(),
        position: PositionDto::new(CITY_POS.0, CITY_POS.1),
        is_capital: true,
        population: 3,
        culture: 0,
    });
    st.cities.push(PlayableCity {
        id: CityId::new(905),
        owner_id: PlayerId::new(ENEMY),
        name: "Druga".into(),
        position: PositionDto::new(0, 0),
        is_capital: false,
        population: 2,
        culture: 0,
    });
    st.stores
        .buildings_by_city
        .insert(CITY, fort.iter().map(|b| (*b).to_owned()).collect());
    st.oblegane.insert(CityId::new(CITY));
    st.siege_machines_ready
        .insert(CityId::new(CITY), vec![PlayableSiegeMachineKind::Taran]);
    st.economy.ai_treasury_by_owner.insert(ENEMY, 40.0);
    let mut id = 7000;
    for t in [
        "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Wojownik", "Łucznik",
    ] {
        id += 1;
        add_unit(&mut st, id, HUMAN, (CITY_POS.0 + 1, CITY_POS.1), t);
    }
    add_unit(&mut st, 8001, ENEMY, CITY_POS, "Wojownik");
    st
}

fn bridge_for(st: PlayableState) -> EngineBridge<CivEngineAdapter> {
    EngineBridge::new(CivEngineAdapter::from_game(PlayableGame::from_state(st)))
}

fn send(
    b: &mut EngineBridge<CivEngineAdapter>,
    cmd: EngineCommand,
) -> Result<BridgeDispatch, BridgeError> {
    b.handle(BridgeRequest::new("r", cmd))
}

fn battle(d: &BridgeDispatch) -> &SiegeBattlePayload {
    d.response.siege_battle.as_ref().expect("siegeBattle")
}

fn state_of(d: &BridgeDispatch) -> &PlayableState {
    match &d.response.result {
        BridgeResult::State { state } => state,
        _ => panic!("komendy bitwy odpowiadaja State"),
    }
}

fn start(b: &mut EngineBridge<CivEngineAdapter>) -> BridgeDispatch {
    send(
        b,
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    )
    .expect("start")
}

fn setup_of(d: &BridgeDispatch) -> &BattleSetupDto {
    battle(d).setup.as_ref().expect("start niesie setup")
}

/// Sesja `new BattleScene` (przed `play`) dla tego samego szturmu: niezależne odczytanie pola i rozstawienia.
fn prepared(st: &PlayableState) -> SiegeBattleSession {
    let a = siege_battle_apply::prepare_storm(st, CITY, ANCHOR, 1).expect("storm");
    let data = siege_battle_apply::session_data().expect("dane");
    SiegeBattleSession::prepare(st, a.input(), data).expect("prepare")
}

// ------------------------------------------------------------ D-1I6-SETUP

#[test]
fn start_niesie_setup_sceny_wg_pinu() {
    let st = state(11, &["palisada"]);
    let mut b = bridge_for(st.clone());
    let d = start(&mut b);
    let p = battle(&d);
    let setup = setup_of(&d);
    // `opts.siege != null`, `deploy: atkRosterRef.some(isGeneral)` (bez generała), `deployPlayerSide: 'atk'`.
    assert!(setup.siege);
    assert_eq!(setup.deploy, None);
    assert_eq!(setup.player_side, BattleSide::Atk);
    // `ikonaIdToBronzeCiv('rzymianie')` (`defCiv`, `main.ts:36989`) -> `siege_wall_civ`.
    let def_civ = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 1)
        .expect("storm")
        .input()
        .def_civ
        .clone()
        .expect("defCiv");
    assert_eq!(setup.siege_civ, def_civ);
    // Palisada: `towerMaterialFor('palisada') = 'drewno'`, wiersze wież pola T5a.
    let s = prepared(&st);
    let field = s.field();
    let siege = field.siege.as_ref().expect("mur");
    assert_eq!(setup.fort.kind, FortKind::Palisada);
    assert_eq!(setup.fort.tower_material, Some(TowerMaterial::Drewno));
    let rows: Vec<i32> = siege.tower_rows.iter().map(|r| *r as i32).collect();
    assert!(!rows.is_empty(), "palisada ma wieże");
    assert_eq!(setup.fort.tower_rows, rows);
    assert_eq!(setup.grid.cols, field.map.cols());
    assert_eq!(setup.grid.rows, field.map.rows());
    assert_eq!(setup.grid.tiles, field.map.tiles());
    assert_eq!(setup.desert_palette, field.desert_palette);
    // Jednostki: kolejność i id = jednostki sceny odpowiedzi (`this.atk`, `this.def`), strona i kolor pinu.
    assert_eq!(setup.units.len(), p.units.len());
    for (su, u) in setup.units.iter().zip(&p.units) {
        assert_eq!(su.id.get(), u.battle_id);
        let (side, color) = match u.side.as_str() {
            "atk" => (BattleSide::Atk, SIEGE_ATTACKER_COLOR),
            "def" => (BattleSide::Def, SIEGE_DEFENDER_COLOR),
            other => panic!("strona {other}"),
        };
        assert_eq!(su.side, side);
        assert_eq!(su.owner_color, color);
        assert!(su.hp > 0.0 && su.hp <= su.max_hp, "{su:?}");
        assert!(su.morale > 0.0 && su.morale <= su.morale_max, "{su:?}");
        assert!((0..=3).contains(&su.facing), "{su:?}");
    }
    assert_eq!(SIEGE_ATTACKER_COLOR, 0x00ff_d54a);
    assert_eq!(SIEGE_DEFENDER_COLOR, 0x00c8_4040);
    // `String(bu.stats.Jednostka ?? bu.nazwa)` i `bu.kategoria` z `units.json`: łucznik ma amunicję skończoną.
    let names: Vec<&str> = setup.units.iter().map(|u| u.model_name.as_str()).collect();
    assert!(names.contains(&"Wojownik"), "{names:?}");
    assert!(names.contains(&"Łucznik"), "{names:?}");
    for u in &setup.units {
        assert!(!u.category.is_empty(), "{u:?}");
        if u.model_name == "Łucznik" {
            let ammo = u.ammo_max.expect("łucznik: amunicja skończona");
            assert!(ammo > 0.0);
            assert_eq!(u.ammo_left, Some(ammo), "start: pełna amunicja");
        }
        if u.model_name == "Wojownik" {
            assert_eq!(u.ammo_max, None, "wojownik: bez amunicji = Infinity");
        }
    }
}

/// Wiersz `units.json` (surowe dane, niezależnie od adaptera sceny).
fn units_json_row(name: &str) -> serde_json::Value {
    let raw = include_str!("../data/units.json");
    let rows: Vec<serde_json::Value> = serde_json::from_str(raw).expect("units.json");
    rows.into_iter()
        .find(|r| r["Jednostka"] == json!(name))
        .unwrap_or_else(|| panic!("brak {name} w units.json"))
}

/// Obrona r1, Z2 (E01/E02): `maxHp`, `hp` i `kategoria` jednostek setupu liczone NIEZALEŻNIE od setupu: `maxHp` =
/// `unitHealth(def) = def.health ?? def.Health` (`main.ts:33093`; bez bonusów weterana/parametrów), `hp` = HP jednostki
/// mapy (tu ranna, `hp < maxHp`), kategoria = `categoryOf(Jednostka, Rola (linia), Super, Typ)` (`unit_replace_defs`,
/// ta sama tabela, z której mapa nadaje kategorię nowej jednostce).
#[test]
fn setup_hp_maxhp_kategoria_niezaleznie() {
    const RANNY: u64 = 7002;
    const RANNY_HP: f64 = 5.0;
    let mut st = state(11, &["palisada"]);
    st.economy.units.get_mut(&RANNY).expect("ranny").hp = Some(RANNY_HP);
    let mut b = bridge_for(st.clone());
    let d = start(&mut b);
    let p = battle(&d);
    let setup = setup_of(&d);
    let mut cats = std::collections::BTreeSet::new();
    let mut ranny_widziany = false;
    for (su, u) in setup.units.iter().zip(&p.units) {
        let Ok(map_id) = u.unit_id.parse::<u64>() else {
            continue; // milicja: brak jednostki mapy
        };
        let ty = st.economy.units[&map_id]
            .type_id
            .clone()
            .expect("typ jednostki");
        let row = units_json_row(&ty);
        let health = row["health"]
            .as_f64()
            .or_else(|| row["Health"].as_f64())
            .expect("health");
        assert_eq!(su.max_hp, health, "maxHp = unitHealth(def) dla {ty}");
        let expected_cat = civ_engine::domain::unit_replace_defs::category_of(
            row["Jednostka"].as_str().expect("Jednostka"),
            row["Rola (linia)"].as_str().unwrap_or(""),
            row["Super-jednostka"].as_str() == Some("TAK"),
            row["Typ"].as_str(),
        );
        assert_eq!(su.category, expected_cat, "kategoria {ty}");
        cats.insert(su.category.clone());
        assert_eq!(su.model_name, ty, "String(Jednostka ?? nazwa)");
        if map_id == RANNY {
            ranny_widziany = true;
            assert_eq!(su.hp, RANNY_HP, "hp = HP jednostki mapy");
            assert!(su.hp < su.max_hp);
        } else {
            assert_eq!(su.hp, su.max_hp, "pełne HP {map_id}");
        }
    }
    assert!(ranny_widziany, "ranna jednostka w setupie");
    assert!(
        cats.len() >= 2,
        "wojownik i łucznik mają różne kategorie: {cats:?}"
    );
}

/// Obrona r1, Z2 (E04): `model_name = String(stats.Jednostka ?? nazwa)`. W szturmie bez wodza `Jednostka == nazwa`, więc
/// różnicę sprawdza producent na jednostce wodza (`nazwa` = tytuł wodza, `Jednostka` = typ z `units.json`) i na
/// jednostce bez pola `Jednostka` (zostaje `nazwa`).
#[test]
fn model_name_jednostka_przed_nazwa() {
    use civ_engine::domain::battle_setup_units::Side;
    use civ_engine::domain::siege_battle_adapter::{unit_def_index, RosterUnit};
    use civ_engine::domain::siege_battle_adapter_unit::{
        roster_to_battle_units, OwnerContext, RosterBattleCtx, UnitDefFallback,
    };
    let data = siege_battle_apply::session_data().expect("dane");
    let index = unit_def_index(&data.unit_rows);
    let mut owners = std::collections::BTreeMap::new();
    owners.insert(
        1i64,
        OwnerContext {
            built_ids: Vec::new(),
            civ_bonusy: Vec::new(),
            army_hungry: false,
            gold_deficit: false,
            difficulty_combat_mult: 1.0,
        },
    );
    let ctx = RosterBattleCtx {
        rows: &data.unit_rows,
        index: &index,
        militia_defs: &[],
        owners: &owners,
        fallback: UnitDefFallback::Error,
    };
    let mut wodz = RosterUnit::new("g1", 1, "Wojownik", "domyslny", 0, 0);
    wodz.is_general = true;
    let bus = roster_to_battle_units(&[wodz], Side::Atk, &ctx).expect("wódz");
    let bu = &bus[0];
    assert_ne!(bu.nazwa, "Wojownik", "nazwa wodza = tytuł");
    assert_eq!(siege_battle_apply::spawn_model_name(bu), "Wojownik");
    let mut bez = bu.clone();
    bez.stats.remove("Jednostka");
    assert_eq!(siege_battle_apply::spawn_model_name(&bez), bu.nazwa);
}

/// Obrona r1, Z2 (E07): `siege_civ = (defCiv ?? civ) ?? 'rzym'` (`battleScene.ts:3480`). `def_civ = None` wymaga
/// właściciela miasta spoza `players`; wtedy port nie znajduje obrońców (roster obrońców i kontekst właściciela
/// `owner_contexts` pochodzą z `players`), więc szturm kończy się przed bitwą typowanym `NoDefenders*` i gałąź `'rzym'`
/// jest przez most nieosiągalna (udokumentowane w `02a-obrona.md`, Z2/E07). Test pilnuje tej nieosiągalności: gdyby
/// taki szturm zaczął kiedyś startować, test padnie i wymusi sprawdzenie `siege_civ == "rzym"`.
#[test]
fn def_civ_none_nieosiagalne_przez_most() {
    let mut st = state(11, &["palisada"]);
    st.players.retain(|p| p.id != PlayerId::new(ENEMY));
    let Err(e) = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 1) else {
        panic!("właściciel spoza players: brak bitwy");
    };
    assert!(
        matches!(
            e,
            SiegeBattleError::NoDefendersCaptureRequested { city_id: CITY }
                | SiegeBattleError::NoDefendersWallIntact { city_id: CITY }
        ),
        "{e:?}"
    );
    let mut b = bridge_for(st);
    let be = send(
        &mut b,
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    )
    .expect_err("start bez właściciela");
    assert_eq!(be.message, e.to_string());
    assert!(be.siege_battle.is_some(), "błąd typowany");
    let e2 = send(&mut b, EngineCommand::FinishSiegeBattle).expect_err("brak bitwy");
    assert_eq!(e2.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
}

#[test]
fn setup_to_rozstawienie_przed_play() {
    let st = state(12, &["palisada"]);
    let mut b = bridge_for(st.clone());
    let setup = setup_of(&start(&mut b)).clone();
    let s = prepared(&st);
    let spawn = siege_battle_apply::session_frame(&s).expect("ramka spawnu");
    assert_eq!(setup.units.len(), spawn.units.len());
    for (su, fu) in setup.units.iter().zip(&spawn.units) {
        assert_eq!(su.id, fu.id);
        assert_eq!((su.col, su.row), (fu.col, fu.row), "pole spawnu {su:?}");
        assert_eq!(su.facing, fu.facing, "kierunek spawnu (D-1I6-SPAWN-FACING)");
        assert_eq!(su.on_wall_walkway, fu.on_wall_walkway);
        assert_eq!(su.hp, fu.hp);
        assert_eq!(su.morale, fu.morale);
        assert_eq!(su.ammo_left, fu.ammo_left);
    }
    // `moraleMax` ciała, `maxHp` jednostki = HP startowe (pełne HP w scenariuszu).
    let body = &s.battle_loop().env.body;
    let mut i = 0;
    for side in 0..2 {
        for mm in &body.morale_max[side] {
            assert_eq!(setup.units[i].morale_max, *mm);
            assert_eq!(setup.units[i].max_hp, setup.units[i].hp);
            i += 1;
        }
    }
    // Obrońca na koronie palisady (spawn obrońców muru).
    assert!(
        setup
            .units
            .iter()
            .any(|u| u.side == BattleSide::Def && u.on_wall_walkway),
        "{:?}",
        setup.units
    );
}

#[test]
fn setup_tylko_w_odpowiedzi_startu_i_deterministyczny() {
    let st = state(13, &["palisada"]);
    let mut b1 = bridge_for(st.clone());
    let mut b2 = bridge_for(st);
    let d1 = start(&mut b1);
    let d2 = start(&mut b2);
    assert_eq!(setup_of(&d1), setup_of(&d2), "determinizm");
    let wire = serde_json::to_value(&d1.response).expect("json");
    assert!(wire["siegeBattle"]["setup"].is_object());
    assert!(wire["siegeBattle"]["setup"]["units"].is_array());
    assert!(wire["siegeBattle"]["towerShooter"].is_object());
    let step = send(
        &mut b1,
        EngineCommand::StepSiegeBattle {
            wall_ms: WallMs(16.0),
        },
    )
    .expect("step");
    assert!(battle(&step).setup.is_none());
    assert!(battle(&step).tower_shooter.is_none());
    let wire = serde_json::to_value(&step.response).expect("json");
    assert!(wire["siegeBattle"].get("setup").is_none());
    assert!(wire["siegeBattle"].get("towerShooter").is_none());
    let skip = send(&mut b1, EngineCommand::SkipSiegeBattle).expect("skip");
    assert!(battle(&skip).setup.is_none());
    let fin = send(&mut b1, EngineCommand::FinishSiegeBattle).expect("finish");
    assert!(battle(&fin).setup.is_none());
    assert!(battle(&fin).tower_shooter.is_none());
    // `siegeBattle` startu = ten sam po JSON (Eq z PartialEq f64: wartości skończone).
    let back: SiegeBattlePayload =
        serde_json::from_value(serde_json::to_value(battle(&d1)).expect("json")).expect("back");
    assert_eq!(&back, battle(&d1));
}

#[test]
fn strzelec_wiezy_i_mur_kamienny() {
    let st = state(14, &["mury"]);
    let mut b = bridge_for(st.clone());
    let d = start(&mut b);
    let setup = setup_of(&d);
    assert_eq!(setup.fort.kind, FortKind::Mur);
    assert_eq!(setup.fort.tower_material, Some(TowerMaterial::Kamien));
    let a = siege_battle_apply::prepare_storm(&st, CITY, ANCHOR, 1).expect("storm");
    let data = siege_battle_apply::session_data().expect("dane");
    let row = strongest_ranged_unit_for_era(
        &data.tower_units,
        clamp_era(a.input().defender_era),
        a.input().def_civ.as_deref(),
    )
    .expect("strzelec wieży");
    let shooter = battle(&d).tower_shooter.clone().expect("towerShooter");
    let s = |k: &str| match row.get(k) {
        Some(serde_json::Value::String(v)) => Some(v.clone()),
        None | Some(serde_json::Value::Null) => None,
        Some(v) => Some(v.to_string()),
    };
    assert_eq!(shooter.typ, s("Typ"));
    assert_eq!(shooter.jednostka, s("Jednostka"));
    assert!(shooter.jednostka.is_some());
    // Nazwa strzelca = ta, którą ciało pętli loguje (`tower_shooter_nazwa`, `:4211`).
    assert_eq!(
        Some(
            prepared(&st)
                .battle_loop()
                .env
                .body
                .tower_shooter_nazwa
                .clone()
        ),
        shooter.jednostka
    );
}

/// Miasto bez obwarowań: szturm odrzucony typowanym błędem adaptera (`CityWithoutWall`) przed otwarciem bitwy.
#[test]
fn bez_obwarowan_blad_adaptera_bez_bitwy() {
    let mut b = bridge_for(state(15, &[]));
    let e = send(
        &mut b,
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    )
    .expect_err("brak muru");
    assert!(
        matches!(e.siege_battle, Some(SiegeBattleErrorDto::Adapter { .. })),
        "{e:?}"
    );
    let e = send(&mut b, EngineCommand::AbortSiegeBattle).expect_err("brak bitwy");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
}

// ------------------------------------------------------------ D-1I6-ERR

#[test]
fn blad_bitwy_jako_typ_obok_tekstu() {
    let mut b = bridge_for(state(16, &["palisada"]));
    // Bez bitwy: `noActiveBattle` dla Step / Skip / Finish / Abort.
    for cmd in [
        EngineCommand::StepSiegeBattle {
            wall_ms: WallMs(16.0),
        },
        EngineCommand::SkipSiegeBattle,
        EngineCommand::FinishSiegeBattle,
        EngineCommand::AbortSiegeBattle,
    ] {
        let e = send(&mut b, cmd).expect_err("brak bitwy");
        assert_eq!(e.code, BridgeErrorCode::EngineRejected);
        assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
        assert_eq!(e.message, SiegeBattleError::NoActiveBattle.to_string());
    }
    // Bramka startu z danymi: miasto nie istnieje.
    let e = send(
        &mut b,
        EngineCommand::StartSiegeStorm {
            city_id: 4242,
            unit_id: ANCHOR,
        },
    )
    .expect_err("brak miasta");
    assert_eq!(
        e.siege_battle,
        Some(SiegeBattleErrorDto::CityNotFound { city_id: 4242 })
    );
    let wire = serde_json::to_value(&e).expect("json");
    assert_eq!(
        wire["siegeBattle"],
        json!({"code": "city_not_found", "cityId": 4242})
    );
    // `Finish` przed końcem = `not_finished` (bitwa trwa); drugi start = `battle_in_progress`.
    start(&mut b);
    let e = send(&mut b, EngineCommand::FinishSiegeBattle).expect_err("trwa");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NotFinished));
    assert!(e.siege_battle.as_ref().is_some_and(|d| d.is_not_finished()));
    assert_eq!(
        e.message,
        SiegeBattleError::Session(SessionError::NotFinished).to_string()
    );
    let e = send(
        &mut b,
        EngineCommand::StartSiegeStorm {
            city_id: CITY,
            unit_id: ANCHOR,
        },
    )
    .expect_err("druga bitwa");
    assert_eq!(
        e.siege_battle,
        Some(SiegeBattleErrorDto::BattleInProgress { city_id: CITY })
    );
    // Komenda mapy w trakcie bitwy to błąd gry, nie bitwy: bez `siegeBattle`.
    let e = send(&mut b, EngineCommand::AdvanceTurn).expect_err("bitwa w toku");
    assert_eq!(e.siege_battle, None);
}

/// Każdy wariant: kod JSON, dane i `Display` DTO równy tekstowi błędu biblioteki (`message` się nie zmienia).
#[test]
fn kazdy_wariant_bledu_ma_kod_i_ten_sam_tekst() {
    let cases: Vec<(SiegeBattleError, serde_json::Value)> = vec![
        (
            SiegeBattleError::NoActiveBattle,
            json!({"code": "no_active_battle"}),
        ),
        (
            SiegeBattleError::BattleInProgress { city_id: 3 },
            json!({"code": "battle_in_progress", "cityId": 3}),
        ),
        (
            SiegeBattleError::NotHumanBesieger { unit_id: 4 },
            json!({"code": "not_human_besieger", "unitId": 4}),
        ),
        (
            SiegeBattleError::CityNotFound(5),
            json!({"code": "city_not_found", "cityId": 5}),
        ),
        (
            SiegeBattleError::UnitNotFound(6),
            json!({"code": "unit_not_found", "unitId": 6}),
        ),
        (
            SiegeBattleError::CityTileMissing(7),
            json!({"code": "city_tile_missing", "cityId": 7}),
        ),
        (
            SiegeBattleError::NoDefendersWallIntact { city_id: 8 },
            json!({"code": "no_defenders_wall_intact", "cityId": 8}),
        ),
        (
            SiegeBattleError::NoDefendersCaptureRequested { city_id: 9 },
            json!({"code": "no_defenders_capture_requested", "cityId": 9}),
        ),
        (
            SiegeBattleError::Session(SessionError::NotFinished),
            json!({"code": "not_finished"}),
        ),
        (
            SiegeBattleError::Session(SessionError::AlreadyFinished),
            json!({"code": "session", "detail": "AlreadyFinished"}),
        ),
        (
            SiegeBattleError::Adapter(AdapterError::NoDefenders("x".into())),
            json!({"code": "adapter", "detail": AdapterError::NoDefenders("x".into()).to_string()}),
        ),
        (
            SiegeBattleError::Producer("p".into()),
            json!({"code": "producer", "detail": "p"}),
        ),
        (
            SiegeBattleError::NotEnemyCity { city_id: 10 },
            json!({"code": "not_enemy_city", "cityId": 10}),
        ),
        (
            SiegeBattleError::NotAdjacent {
                unit_id: 11,
                city_id: 12,
            },
            json!({"code": "not_adjacent", "unitId": 11, "cityId": 12}),
        ),
        (
            SiegeBattleError::NotSiegeAnchor {
                unit_id: 13,
                besieger_id: 14,
            },
            json!({"code": "not_siege_anchor", "unitId": 13, "besiegerId": 14}),
        ),
        (
            SiegeBattleError::AnchorCannotAttack {
                unit_id: 15,
                reason: "cywil",
            },
            json!({"code": "anchor_cannot_attack", "unitId": 15, "reason": "cywil"}),
        ),
        (
            SiegeBattleError::NotAtWar { city_id: 16 },
            json!({"code": "not_at_war", "cityId": 16}),
        ),
        (
            SiegeBattleError::Aborted {
                city_id: 17,
                reason: "r".into(),
            },
            json!({"code": "aborted", "cityId": 17, "reason": "r"}),
        ),
        (
            SiegeBattleError::AbortRequested,
            json!({"code": "abort_requested"}),
        ),
        (
            SiegeBattleError::AbortNotAllowed { city_id: 18 },
            json!({"code": "abort_not_allowed", "cityId": 18}),
        ),
    ];
    for (err, wire) in cases {
        let dto = SiegeBattleErrorDto::from(&err);
        assert_eq!(serde_json::to_value(&dto).expect("json"), wire, "{err:?}");
        let back: SiegeBattleErrorDto = serde_json::from_value(wire).expect("back");
        assert_eq!(back, dto);
        assert_eq!(dto.to_string(), err.to_string(), "{err:?}");
        assert_eq!(
            dto.is_not_finished(),
            matches!(err, SiegeBattleError::Session(SessionError::NotFinished))
        );
        let bridged = BridgeError::from_siege_battle(&err);
        assert_eq!(bridged.code, BridgeErrorCode::EngineRejected);
        assert_eq!(bridged.message, err.to_string());
        assert_eq!(bridged.siege_battle, Some(dto));
    }
}

// ------------------------------------------------------------ D-1I6-ORPHAN / D-1I6-ABORT-E2E

#[test]
fn abort_po_starcie_zamyka_bitwe_bez_zmiany_stanu() {
    let st = state(17, &["palisada"]);
    let mut b = bridge_for(st);
    let before = state_of(&send(&mut b, EngineCommand::GetState).expect("get")).clone();
    start(&mut b);
    let d = send(&mut b, EngineCommand::AbortSiegeBattle).expect("abort");
    let p = battle(&d);
    assert_eq!(p.phase, SiegeBattlePhaseDto::Aborted);
    assert_eq!(p.city_id, CITY);
    assert!(p.actions.is_empty() && p.frame.is_none() && p.result.is_none());
    assert!(p.setup.is_none() && p.units.is_empty());
    assert!(d.events.is_empty(), "stan bez zmian: brak StateChanged");
    assert_eq!(state_of(&d), &before, "stan gry bez zmian");
    // Machiny nie zużyte (`onCancel` sceny: `consumeReadyMachines` tylko po wyniku, `main.ts:37021-37023`).
    assert_eq!(
        state_of(&d).siege_machines_ready.get(&CityId::new(CITY)),
        Some(&vec![PlayableSiegeMachineKind::Taran])
    );
    let wire = serde_json::to_value(&d.response).expect("json");
    assert_eq!(wire["siegeBattle"]["phase"], json!("aborted"));
    // Bitwa zamknięta: kolejne komendy bitwy = brak bitwy, komendy mapy odblokowane, nowy szturm możliwy.
    let e = send(&mut b, EngineCommand::AbortSiegeBattle).expect_err("druga");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    let e = send(
        &mut b,
        EngineCommand::StepSiegeBattle {
            wall_ms: WallMs(16.0),
        },
    )
    .expect_err("po abort");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    let again = start(&mut b);
    assert_eq!(battle(&again).phase, SiegeBattlePhaseDto::Running);
    assert!(battle(&again).setup.is_some());
}

/// D-1I6D-4 (obrona r1, Z1): porzucenie TRWAJĄCEJ bitwy (po `Step`) jest dozwolone jak „Wycofaj się z bitwy” pinu
/// (`battleScene.ts:3359` → `onCancel` → `setMood('mapa')`, `main.ts:37023`): bitwa zamknięta bez wyniku, stan gry i
/// machiny bez zmian, brak `StateChanged`.
#[test]
fn abort_w_trakcie_bitwy_zamyka_bez_wyniku() {
    let st = state(18, &["palisada"]);
    let mut b = bridge_for(st);
    let before = state_of(&send(&mut b, EngineCommand::GetState).expect("get")).clone();
    start(&mut b);
    for _ in 0..3 {
        let d = send(
            &mut b,
            EngineCommand::StepSiegeBattle {
                wall_ms: WallMs(16.0),
            },
        )
        .expect("step");
        assert_eq!(battle(&d).phase, SiegeBattlePhaseDto::Running, "bitwa trwa");
    }
    let d = send(&mut b, EngineCommand::AbortSiegeBattle).expect("wycofanie w trakcie bitwy");
    let p = battle(&d);
    assert_eq!(p.phase, SiegeBattlePhaseDto::Aborted);
    assert_eq!(p.city_id, CITY);
    assert!(p.result.is_none() && p.frame.is_none() && p.actions.is_empty());
    assert!(d.events.is_empty(), "brak StateChanged");
    assert_eq!(state_of(&d), &before, "stan gry bez zmian");
    assert_eq!(
        state_of(&d).siege_machines_ready.get(&CityId::new(CITY)),
        Some(&vec![PlayableSiegeMachineKind::Taran]),
        "machiny nie zużyte"
    );
    let e = send(&mut b, EngineCommand::FinishSiegeBattle).expect_err("bitwa zamknięta");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    // Po `Skip` w toku (przed odczytem wyniku) — także bitwa przewinięta do końca jest już `Finished`: patrz niżej.
}

/// D-1I6D-4: po końcu bitwy (faza `Finished`, np. po `Skip`) porzucenie jest odrzucane: pin ma wtedy tylko ekran końca
/// z „Zakończ bitwę”, które oddaje wynik (`battleScene.ts:10720-10733`). Bitwa zostaje, `Finish` stosuje ten sam wynik
/// co bez próby porzucenia (odrzucona próba nie zostawia flagi).
#[test]
fn abort_po_koncu_odrzucony() {
    let st = state(18, &["palisada"]);
    let mut b = bridge_for(st.clone());
    let before = state_of(&send(&mut b, EngineCommand::GetState).expect("get")).clone();
    start(&mut b);
    send(
        &mut b,
        EngineCommand::StepSiegeBattle {
            wall_ms: WallMs(16.0),
        },
    )
    .expect("step");
    let skip = send(&mut b, EngineCommand::SkipSiegeBattle).expect("skip trwa");
    assert_eq!(battle(&skip).phase, SiegeBattlePhaseDto::Finished);
    for _ in 0..2 {
        let e = send(&mut b, EngineCommand::AbortSiegeBattle).expect_err("po końcu");
        assert_eq!(
            e.siege_battle,
            Some(SiegeBattleErrorDto::AbortNotAllowed { city_id: CITY })
        );
    }
    let fin = send(&mut b, EngineCommand::FinishSiegeBattle).expect("finish");
    assert_eq!(fin.events.len(), 1);
    assert_ne!(state_of(&fin), &before);
    let mut c = bridge_for(st);
    start(&mut c);
    send(
        &mut c,
        EngineCommand::StepSiegeBattle {
            wall_ms: WallMs(16.0),
        },
    )
    .expect("step");
    send(&mut c, EngineCommand::SkipSiegeBattle).expect("skip");
    let fin2 = send(&mut c, EngineCommand::FinishSiegeBattle).expect("finish");
    assert_eq!(battle(&fin2).result, battle(&fin).result);
    assert_eq!(state_of(&fin2), state_of(&fin));
}

/// Biblioteka (D-1I6D-4): `request_abort` po `step`/`skip` sesji z pamięci podręcznej i z odtworzenia (inny wątek /
/// wyczyszczona pamięć) daje ten sam werdykt: trwająca = flaga, zakończona = `AbortNotAllowed` bez flagi.
#[test]
fn request_abort_wg_fazy_takze_po_odtworzeniu() {
    for clear in [false, true] {
        let mut g = PlayableGame::from_state(state(21, &["palisada"]));
        g.start_siege_storm(CITY, ANCHOR).expect("start");
        g.step_siege_battle(16.0).expect("step");
        if clear {
            siege_battle_apply::clear_live_session_cache();
        }
        let b = g.siege_battle().expect("bitwa");
        let fresh = b.clone();
        b.request_abort().expect("trwająca bitwa");
        assert_ne!(&fresh, b, "flaga ustawiona");
        assert!(matches!(
            g.finish_siege_battle(),
            Err(SiegeBattleError::Aborted { .. })
        ));
        assert!(g.siege_battle().is_none());

        g.start_siege_storm(CITY, ANCHOR).expect("start 2");
        g.skip_siege_battle().expect("skip");
        if clear {
            siege_battle_apply::clear_live_session_cache();
        }
        let b = g.siege_battle().expect("bitwa 2");
        let fresh = b.clone();
        assert_eq!(
            b.request_abort(),
            Err(SiegeBattleError::AbortNotAllowed { city_id: CITY })
        );
        assert_eq!(&fresh, b, "flaga nieustawiona");
        assert!(g.finish_siege_battle().is_ok(), "zostaje Finish z wynikiem");
    }
}

#[test]
fn abort_przez_mock_adapter() {
    let mut b = EngineBridge::new(MockEngineAdapter::default());
    let e = b
        .handle(BridgeRequest::new("a", EngineCommand::AbortSiegeBattle))
        .expect_err("mock bez sesji");
    assert_eq!(e.code, BridgeErrorCode::EngineRejected);
    assert_eq!(e.siege_battle, None, "brak sesji to nie błąd bitwy");
    b.handle(BridgeRequest::new(
        "c",
        EngineCommand::CreateSession {
            params: StartGameParams::default(),
        },
    ))
    .expect("session");
    let e = b
        .handle(BridgeRequest::new("a", EngineCommand::AbortSiegeBattle))
        .expect_err("brak bitwy");
    assert_eq!(e.siege_battle, Some(SiegeBattleErrorDto::NoActiveBattle));
    assert!(b
        .adapter()
        .calls()
        .iter()
        .any(|c| matches!(c, EngineCommand::AbortSiegeBattle)));
}

/// Biblioteka: żądanie porzucenia jest zużywane przez `finish` gry (D-WIRB-8 → `Aborted`), klon bitwy je zachowuje.
#[test]
fn zadanie_porzucenia_w_grze() {
    let mut g = PlayableGame::from_state(state(19, &["palisada"]));
    g.start_siege_storm(CITY, ANCHOR).expect("start");
    let b = g.siege_battle().expect("bitwa");
    let fresh = b.clone();
    b.request_abort().expect("zaraz po starcie");
    let flagged = b.clone();
    assert_ne!(&fresh, b, "flaga jest częścią stanu bitwy");
    assert_eq!(&flagged, b, "klon zachowuje flagę");
    let e = g.finish_siege_battle().expect_err("porzucona");
    match e {
        SiegeBattleError::Aborted { city_id, reason } => {
            assert_eq!(city_id, CITY);
            assert_eq!(reason, SiegeBattleError::AbortRequested.to_string());
        }
        other => panic!("{other:?}"),
    }
    assert!(g.siege_battle().is_none());
    // Bez flagi `finish` trwającej bitwy = `NotFinished` (bitwa zostaje).
    g.start_siege_storm(CITY, ANCHOR).expect("start 2");
    assert_eq!(
        g.finish_siege_battle(),
        Err(SiegeBattleError::Session(SessionError::NotFinished))
    );
    assert!(g.siege_battle().is_some());
}

#[test]
fn abort_nie_jest_zdarzeniem_stanu() {
    let mut b = bridge_for(state(20, &["palisada"]));
    start(&mut b);
    let d = send(&mut b, EngineCommand::AbortSiegeBattle).expect("abort");
    assert!(!d
        .events
        .iter()
        .any(|e| matches!(e, BridgeEvent::StateChanged { .. })));
    assert!(EngineCommand::AbortSiegeBattle.is_siege_battle());
}
