//! R-RUSTPORT-P6-K5LOOP-WIRING-A-Q1 (#369 część A): sesja bitwy oblężniczej `SiegeBattleSession` od `PlayableState`
//! do `finish`, oba sterowniki czasu (czas rzeczywisty i `skip`), RNG z ziarna gry, jawne błędy trybu ręcznego i `skip`
//! przed startem, `ProdBody::unported` puste w pełnej bitwie AUTO z murem (kryterium startu #369).

use std::collections::BTreeMap;

use civ_engine::domain::diplomacy::{CivilizationPair, Relation, RelationStatus};
use civ_engine::domain::playable::{
    PlayableGame, PlayablePlayer, PlayableReplaceUnit, PlayableSiegeMachineKind, PlayableState,
    PlayableUnit, PlayableUnitKind, StartGameParams,
};
use civ_engine::domain::siege_battle_adapter::AdapterError;
use civ_engine::domain::siege_battle_adapter_unit::OwnerContext;
use civ_engine::domain::siege_battle_session::{
    has_damage, SessionData, SessionError, SessionOutcome, SessionPhase, SessionRolls,
    SiegeBattleSession, SiegeSessionInput,
};
use civ_engine::domain::siege_tactics_actions::TimedAction;
use civ_engine::domain::siege_tactics_blow::RollSource;
use civ_engine::domain::siege_tactics_loop::LoopWinner;
use civ_engine::{CityId, PlayerId, PositionDto, UnitId};

/// Scenariusz: liczności i typy obu stron, mury, gotowe machiny.
#[derive(Clone)]
struct Scn {
    atk: Vec<&'static str>,
    def: Vec<&'static str>,
    built: Vec<&'static str>,
    machines: Vec<PlayableSiegeMachineKind>,
    battle_index: u32,
}

fn data() -> SessionData {
    SessionData::engine().expect("dane silnika")
}

/// Stan gry: miasto pierwszego gracza z murem, atakujący gracz `+100` w wojnie, jednostki na heksie miasta (obrońcy)
/// i obok (atakujący, kotwica = pierwsza jednostka atakującego).
fn state_for(s: &Scn) -> (PlayableState, SiegeSessionInput) {
    let mut st = PlayableGame::new(StartGameParams::default())
        .expect("start")
        .state()
        .clone();
    let city = st.cities[0].clone();
    let cid = city.id.get();
    let own = city.owner_id;
    let enemy = PlayerId::new(own.get() + 100);
    st.players.push(PlayablePlayer {
        id: enemy,
        name: "wrog".into(),
        civilization: "rzymianie".into(),
        is_human: false,
    });
    st.war.diplomacy.set_relation(
        CivilizationPair::new(own, enemy),
        Relation::new(50.0, 50.0, RelationStatus::War),
    );
    let (x, y) = (city.position.x(), city.position.y());
    let mut units = Vec::new();
    let mut next = 7000u64;
    let mut add = |owner: PlayerId, dx: i32, ty: &str, st: &mut PlayableState| {
        next += 1;
        units.push(PlayableUnit {
            id: UnitId::new(next),
            owner_id: owner,
            kind: PlayableUnitKind::Warrior,
            position: PositionDto::new(
                u16::try_from(i32::from(x) + dx).unwrap(),
                u16::try_from(i32::from(y)).unwrap(),
            ),
            movement: 1u8.into(),
            movement_max: 1u8.into(),
            selected: false,
        });
        st.economy.units.insert(
            next,
            PlayableReplaceUnit {
                type_id: Some(ty.to_owned()),
                ..PlayableReplaceUnit::default()
            },
        );
        next
    };
    let mut anchor = 0;
    for t in &s.atk {
        let id = add(enemy, 1, t, &mut st);
        if anchor == 0 {
            anchor = id;
        }
    }
    for t in &s.def {
        add(own, 0, t, &mut st);
    }
    st.units = units;
    st.stores
        .buildings_by_city
        .insert(cid, s.built.iter().map(|b| (*b).to_owned()).collect());
    if !s.machines.is_empty() {
        st.siege_machines_ready
            .insert(CityId::new(cid), s.machines.clone());
    }
    let owners: BTreeMap<i64, OwnerContext> = st
        .players
        .iter()
        .map(|p| {
            (
                i64::try_from(p.id.get()).unwrap(),
                OwnerContext {
                    built_ids: vec![],
                    civ_bonusy: vec![],
                    army_hungry: false,
                    gold_deficit: false,
                    difficulty_combat_mult: 1.0,
                },
            )
        })
        .collect();
    let input = SiegeSessionInput {
        city_id: cid,
        anchor_unit_id: anchor,
        battle_index: s.battle_index,
        owners,
        owner_era: Some(1.0),
        defender_era: Some(1.0),
        def_civ: None,
        teren: "Rownina".into(),
        world_terrain: None,
    };
    (st, input)
}

fn scn_base() -> Scn {
    Scn {
        atk: vec!["Wojownik", "Wojownik", "Łucznik", "Włócznik"],
        def: vec!["Wojownik", "Łucznik"],
        built: vec!["mury"],
        machines: vec![],
        battle_index: 1,
    }
}

/// Komplet sesji przewiniętej od startu (`skip` zaraz po `play`).
fn run_skip(s: &Scn) -> (SessionOutcome, Vec<TimedAction>) {
    let (st, input) = state_for(s);
    let mut ses = SiegeBattleSession::start(&st, &input, &data()).expect("start");
    let rep = ses.skip().expect("skip");
    assert!(rep.finished, "skip konczy bitwe");
    (ses.finish().expect("finish"), rep.actions)
}

/// Sesja w czasie rzeczywistym kawałkami `chunks` (cyklicznie) aż do końca.
fn run_realtime(s: &Scn, chunks: &[f64]) -> (SessionOutcome, Vec<TimedAction>) {
    let (st, input) = state_for(s);
    let mut ses = SiegeBattleSession::start(&st, &input, &data()).expect("start");
    let mut actions = Vec::new();
    let mut k = 0usize;
    let mut guard = 0u64;
    while ses.phase() != SessionPhase::Finished {
        let r = ses.step(chunks[k % chunks.len()]).expect("step");
        actions.extend(r.actions);
        k += 1;
        guard += 1;
        assert!(guard < 5_000_000, "czas rzeczywisty bez konca");
    }
    (ses.finish().expect("finish"), actions)
}

fn summary(o: &SessionOutcome) -> String {
    let mut s = format!(
        "{}|r{}|wb{}|rolls{}|",
        o.winner.label(),
        o.round_no,
        o.wall_ever_breached,
        o.rolls_drawn
    );
    for u in &o.units {
        s.push_str(&format!(
            "{}:{:?}:{}:{}{}{};",
            u.roster_id,
            u.side,
            u.hp.to_bits(),
            u8::from(u.dead),
            u8::from(u.routed),
            u8::from(u.removed)
        ));
    }
    s
}

fn scenarios() -> Vec<(&'static str, Scn)> {
    let b = scn_base();
    vec![
        ("mur", b.clone()),
        (
            "mur_machiny",
            Scn {
                machines: vec![
                    PlayableSiegeMachineKind::Taran,
                    PlayableSiegeMachineKind::Wieza,
                ],
                battle_index: 2,
                ..b.clone()
            },
        ),
        (
            "palisada_liczni",
            Scn {
                atk: vec!["Wojownik"; 9],
                def: vec!["Wojownik", "Wojownik", "Łucznik"],
                built: vec!["palisada"],
                battle_index: 3,
                ..b.clone()
            },
        ),
        (
            "mury_kamienne_jazda",
            Scn {
                atk: vec!["Konnica", "Konnica", "Wojownik", "Procarz"],
                def: vec!["Włócznik"],
                built: vec!["mury_kamienne"],
                battle_index: 4,
                ..b.clone()
            },
        ),
        (
            "fort_slaby_atak",
            Scn {
                atk: vec!["Wojownik"],
                def: vec!["Wojownik", "Wojownik", "Łucznik", "Łucznik"],
                built: vec!["mury", "fort"],
                battle_index: 5,
                ..b.clone()
            },
        ),
        (
            "mur_taran_katapulta",
            Scn {
                atk: vec!["Wojownik", "Wojownik", "Taran", "Katapulta"],
                def: vec!["Wojownik"],
                built: vec!["mury"],
                machines: vec![PlayableSiegeMachineKind::Taran],
                battle_index: 6,
            },
        ),
    ]
}

/// Kryterium startu #369: pełna bitwa AUTO z murem (z adaptera T6, bez ręcznych szablonów ciosu) kończy się
/// zwycięzcą i `ProdBody::unported` jest PUSTE; przewijanie nie emituje `Damage` (`_spawnDamageLabel` `:9943`).
#[test]
fn pelna_bitwa_auto_z_murem_unported_puste_skip() {
    for (name, s) in scenarios() {
        let (o, actions) = run_skip(&s);
        assert!(
            o.unported.is_empty(),
            "{name}: sciezki nieportowane {:?}",
            o.unported
        );
        assert!(!has_damage(&actions), "{name}: Damage w przewijaniu");
        eprintln!("{name}: {}", summary(&o));
    }
}

/// Czas rzeczywisty: `Damage` obecne, `unported` puste, bitwa kończy się zwycięzcą.
#[test]
fn czas_rzeczywisty_damage_i_koniec() {
    let all = scenarios();
    // Bitwy z ciosami (machiny): `mur_machiny`, `mur_taran_katapulta`; pozostałe = szturm odparty bez ciosów.
    for (name, s) in [all[1].clone(), all[5].clone()] {
        let (o, actions) = run_realtime(&s, &[16.0]);
        assert!(o.rolls_drawn > 0, "{name}: brak ciosow");
        assert!(o.unported.is_empty(), "{name}: {:?}", o.unported);
        assert!(
            has_damage(&actions),
            "{name}: brak Damage w czasie rzeczywistym"
        );
        eprintln!("{name} rt: {}", summary(&o));
    }
}

/// Niezależność od podziału kroków `step`: ten sam czas ścienny w różnych porcjach (z resztą poniżej klatki) daje
/// ten sam wynik i te same akcje (jak `p6_siege_tactics_loop_resume` dla przewijania).
#[test]
fn czas_rzeczywisty_niezalezny_od_podzialu_krokow() {
    let s = scenarios()[5].1.clone();
    let (a, aa) = run_realtime(&s, &[16.0]);
    assert!(a.rolls_drawn > 0 && has_damage(&aa));
    let (b, ba) = run_realtime(&s, &[7.0, 5.0, 11.0, 9.0]);
    let (c, ca) = run_realtime(&s, &[1000.0]);
    let (d, da) = run_realtime(&s, &[33.0, 0.0, 15.0]);
    for (x, xa) in [(&b, &ba), (&c, &ca), (&d, &da)] {
        assert_eq!(summary(&a), summary(x));
        assert_eq!(format!("{aa:?}"), format!("{xa:?}"));
    }
}

/// `skip` w trakcie czasu rzeczywistego: dokończenie przewijaniem bez `Damage`; wynik deterministyczny.
#[test]
fn skip_po_starcie_w_trakcie_bitwy() {
    let s = scenarios()[5].1.clone();
    let run = || {
        let (st, input) = state_for(&s);
        let mut ses = SiegeBattleSession::start(&st, &input, &data()).unwrap();
        let mut pre = Vec::new();
        for _ in 0..40 {
            pre.extend(ses.step(16.0).unwrap().actions);
        }
        assert_eq!(ses.phase(), SessionPhase::Running);
        let rep = ses.skip().unwrap();
        assert!(rep.finished);
        assert!(!has_damage(&rep.actions), "Damage po skip");
        assert!(matches!(ses.step(16.0), Err(SessionError::AlreadyFinished)));
        assert!(matches!(ses.skip(), Err(SessionError::AlreadyFinished)));
        summary(&ses.finish().unwrap())
    };
    assert_eq!(run(), run());
}

/// R7: `skip()` przed `started` (`_skipInstantFallback`) = jawny błąd; `step` w fazie przygotowania wykonuje `play()`.
#[test]
fn skip_przed_startem_to_jawny_blad() {
    let (st, input) = state_for(&scn_base());
    let mut ses = SiegeBattleSession::prepare(&st, &input, &data()).unwrap();
    assert_eq!(ses.phase(), SessionPhase::Prepared);
    assert_eq!(
        ses.skip().unwrap_err(),
        SessionError::SkipBeforeStartNotPorted
    );
    assert_eq!(ses.phase(), SessionPhase::Prepared);
    assert!(matches!(ses.finish(), Err(SessionError::NotFinished)));
    ses.step(0.0).unwrap();
    assert_eq!(ses.phase(), SessionPhase::Running);
    assert!(matches!(ses.finish(), Err(SessionError::NotFinished)));
}

/// D-WIR-2: generał atakującego = tryb ręczny/rozstawienie nieportowane, bez cichego przejścia na AUTO.
#[test]
fn general_atakujacego_to_tryb_reczny_nieportowany() {
    let e: SessionError = AdapterError::AttackerHasGeneral("g1".into()).into();
    assert_eq!(
        e,
        SessionError::ManualModeNotPorted {
            general_id: "g1".into()
        }
    );
    let other: SessionError = AdapterError::CityNotFound("x".into()).into();
    assert!(matches!(other, SessionError::Adapter(_)));
}

/// Błędy wejścia: miasto bez muru (szturm wymaga `maMur`), kotwica spoza stanu, NaN czasu.
#[test]
fn bledy_wejscia_sa_jawne() {
    let mut s = scn_base();
    s.built = vec![];
    let (st, input) = state_for(&s);
    let e = SiegeBattleSession::start(&st, &input, &data())
        .err()
        .unwrap();
    assert!(
        matches!(e, SessionError::Adapter(AdapterError::CityWithoutWall(_))),
        "{e:?}"
    );
    let (st, mut input) = state_for(&scn_base());
    input.anchor_unit_id = 424_242;
    assert_eq!(
        SiegeBattleSession::start(&st, &input, &data())
            .err()
            .unwrap(),
        SessionError::AnchorNotFound(424_242)
    );
    let (st, input) = state_for(&scn_base());
    let mut ses = SiegeBattleSession::start(&st, &input, &data()).unwrap();
    assert!(matches!(
        ses.step(f64::NAN),
        Err(SessionError::InvalidData(_))
    ));
    assert!(matches!(ses.step(-1.0), Err(SessionError::InvalidData(_))));
}

/// D-WIR-5: ziarno z `seed` gry i numeru bitwy; ten sam numer = ten sam wynik, inny numer = inny strumień.
#[test]
fn rng_z_ziarna_gry_i_numeru_bitwy() {
    let mut a = SessionRolls::derive(42, 1);
    let mut b = SessionRolls::derive(42, 1);
    let mut c = SessionRolls::derive(42, 2);
    let mut d = SessionRolls::derive(43, 1);
    let xs: Vec<f64> = (0..8).map(|_| a.next_unit()).collect();
    let ys: Vec<f64> = (0..8).map(|_| b.next_unit()).collect();
    let zs: Vec<f64> = (0..8).map(|_| c.next_unit()).collect();
    let ws: Vec<f64> = (0..8).map(|_| d.next_unit()).collect();
    assert_eq!(xs, ys);
    assert_ne!(xs, zs);
    assert_ne!(xs, ws);
    assert!(xs.iter().all(|x| (0.0..1.0).contains(x)));
    assert_eq!(a.drawn, 8);
    // Ta sama bitwa dwa razy = ten sam wynik; inny numer bitwy = inny strumień rzutów.
    let s = scenarios()[5].1.clone();
    let (o1, _) = run_skip(&s);
    let (o2, _) = run_skip(&s);
    assert_eq!(summary(&o1), summary(&o2));
    assert!(o1.rolls_drawn > 0);
    let mut s3 = s.clone();
    s3.battle_index = 99;
    let (o3, _) = run_skip(&s3);
    assert_ne!(summary(&o1), summary(&o3));
}

/// Wynik jako DANE: ocalali z HP, zużyte machiny = gotowe machiny miasta (`consumeReadyMachines`).
#[test]
fn wynik_jako_dane() {
    let s = scenarios()[1].1.clone();
    let (o, _) = run_skip(&s);
    assert_eq!(o.consumed_machines.len(), 2);
    assert!(matches!(
        o.winner,
        LoopWinner::Attacker | LoopWinner::Defender | LoopWinner::Draw
    ));
    let n_atk = o
        .units
        .iter()
        .filter(|u| matches!(u.side, civ_engine::domain::battle_setup_units::Side::Atk))
        .count();
    assert!(
        n_atk >= s.atk.len(),
        "machiny dopisane do rosteru atakujacego"
    );
    for u in &o.units {
        assert!(u.hp <= u.max_hp && u.hp.is_finite(), "{u:?}");
        if u.dead {
            assert!(u.hp <= 0.0, "{u:?}");
        }
    }
}

fn fnv(s: &str) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for b in s.bytes() {
        h ^= u64::from(b);
        h = h.wrapping_mul(0x0100_0000_01b3);
    }
    h
}

/// Złote wyniki sesji (RUST-ONLY, zamrożenie regresji; parytet całej bitwy z pinem = BLOKADA w raporcie): skrót wyniku
/// (zwycięzca, tura, wyłom, rzuty, HP bit w bit i flagi każdej jednostki) i liczników akcji 6 scenariuszy przewijania
/// oraz 2 bitew w czasie rzeczywistym. Każda zmiana składania ciosu, kary morale, kolejności rzutów albo sterownika
/// czasu zmienia skrót.
#[test]
fn zlote_wyniki_sesji() {
    use civ_engine::domain::siege_tactics_actions::BattleAction;
    let mut all = String::new();
    for (name, s) in scenarios() {
        let (o, actions) = run_skip(&s);
        all.push_str(&format!("{name}={}#{};", summary(&o), actions.len()));
    }
    for i in [1usize, 5] {
        let (name, s) = scenarios()[i].clone();
        let (o, actions) = run_realtime(&s, &[16.0]);
        let dmg = actions
            .iter()
            .filter(|a| matches!(a.action, BattleAction::Damage { .. }))
            .count();
        all.push_str(&format!(
            "{name}-rt={}#{}#{dmg};",
            summary(&o),
            actions.len()
        ));
    }
    eprintln!("ZLOTE {:016x}", fnv(&all));
    assert_eq!(format!("{:016x}", fnv(&all)), "dcd224435100671a", "{all}");
}
