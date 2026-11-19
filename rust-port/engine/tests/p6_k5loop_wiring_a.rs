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
        // `_removeUnitFromScene` (`:9910-9913`) ustawia `dead = true` także uciekinierowi, który zszedł z pola z HP > 0;
        // HP <= 0 obowiązuje tylko poległych bez ucieczki.
        if u.dead && !u.routed {
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
    assert_eq!(format!("{:016x}", fnv(&all)), "619d9ea6ba687f71", "{all}");
}

/// D-WIRA-3: kwantyzacja klatek 16 ms z resztą; pierwsza klatka tylko ustawia `vLastWall` (`_advanceVClock` `:9502`).
#[test]
fn klatki_czasu_rzeczywistego_i_zegar() {
    let (st, input) = state_for(&scenarios()[5].1);
    let mut ses = SiegeBattleSession::start(&st, &input, &data()).unwrap();
    assert_eq!(ses.step(16.0).unwrap().frames, 1);
    assert_eq!(
        ses.clock().v_now,
        0.0,
        "pierwsza klatka nie przesuwa zegara"
    );
    assert_eq!(ses.step(15.0).unwrap().frames, 0);
    assert_eq!(ses.step(1.0).unwrap().frames, 1);
    assert_eq!(ses.clock().v_now, 16.0);
    assert_eq!(ses.step(40.0).unwrap().frames, 2);
    assert_eq!(ses.clock().v_now, 48.0);
}

/// D-WIRA-1: kompozytor ciosu jak `_singleBlow` (`:8892-8930`): `isChargeRound` z pierwszego ciosu pary (bonus cywilizacji
/// rundy szarży, `germanie`), tylko wręcz; kontra `counterMultiplier(cuA, cuD)` w kierunku ciosu.
#[test]
fn kompozytor_ciosu_szarza_i_kontry() {
    use civ_engine::data::civilizations::parse_civ_matrix;
    use civ_engine::domain::civ_bonuses::civ_matrix_bonusy_for_civ_key;
    use civ_engine::domain::siege_battle_adapter_unit::counter_multiplier_pin;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::BlowSite;
    use civ_engine::domain::siege_tactics_turnseq::UnitRef;
    let s = Scn {
        atk: vec!["Włócznik", "Wojownik"],
        def: vec!["Konnica"],
        built: vec!["mury"],
        machines: vec![],
        battle_index: 7,
    };
    let (st, mut input) = state_for(&s);
    let enemy = st.players.iter().find(|p| p.name == "wrog").unwrap().id;
    let bonusy = civ_matrix_bonusy_for_civ_key(&parse_civ_matrix().unwrap(), "germanie");
    input
        .owners
        .get_mut(&i64::try_from(enemy.get()).unwrap())
        .unwrap()
        .civ_bonusy = bonusy;
    let d = data();
    let ses = SiegeBattleSession::start(&st, &input, &d).unwrap();
    let first = input.anchor_unit_id.to_string();
    let ai = ses.roster_ids()[0]
        .iter()
        .position(|x| *x == first)
        .expect("wlocznik w bitwie");
    let a = UnitRef {
        side: BattleSide::Attacker,
        idx: ai,
    };
    let t = UnitRef {
        side: BattleSide::Defender,
        idx: 0,
    };
    let site = |attacker, target, ranged, first_blow| BlowSite {
        attacker,
        target,
        ranged,
        attacker_cell: (10, 70),
        target_cell: (11, 70),
        target_on_wall: false,
        first_blow,
    };
    let c1 = ses.compose_blow(&site(a, t, false, true)).unwrap();
    let c2 = ses.compose_blow(&site(a, t, false, false)).unwrap();
    let c3 = ses.compose_blow(&site(a, t, true, true)).unwrap();
    assert_ne!(
        c1.atk_mods, c2.atk_mods,
        "bonus rundy szarzy tylko przy pierwszym ciosie"
    );
    assert_eq!(c2.atk_mods, c3.atk_mods, "strzal nie jest szarza");
    let back = ses.compose_blow(&site(t, a, false, true)).unwrap();
    let (ta, td) = (
        c1.attacker.counter_typ.clone(),
        back.attacker.counter_typ.clone(),
    );
    assert_eq!(
        c1.counter_mult,
        counter_multiplier_pin(&ta, &td, &d.counters, d.counter_mult)
    );
    assert_eq!(
        back.counter_mult,
        counter_multiplier_pin(&td, &ta, &d.counters, d.counter_mult)
    );
    assert_ne!(
        c1.counter_mult, back.counter_mult,
        "kontry niesymetryczne dla pary {ta}/{td}"
    );
}

// ---------------------------------------------------------------------------------------------------------------
// Obrona r1 (zarzuty Evaluatora Z2, Z3, Z4): trafienie wieży przez kompozytor, gałęzie `tower_blow_full`,
// `_checkRout` z bieżącego kafla, walidacja `step` przed startem, mutanty M16/M23.
// ---------------------------------------------------------------------------------------------------------------

fn owner_ids(st: &PlayableState) -> (i64, i64) {
    let own = i64::try_from(st.cities[0].owner_id.get()).unwrap();
    let enemy = i64::try_from(
        st.players
            .iter()
            .find(|p| p.name == "wrog")
            .unwrap()
            .id
            .get(),
    )
    .unwrap();
    (own, enemy)
}

fn civ_bonusy(key: &str) -> Vec<civ_engine::domain::civ_bonuses::CivBonusEntry> {
    use civ_engine::data::civilizations::parse_civ_matrix;
    use civ_engine::domain::civ_bonuses::civ_matrix_bonusy_for_civ_key;
    civ_matrix_bonusy_for_civ_key(&parse_civ_matrix().unwrap(), key)
}

fn uref(
    side: civ_engine::domain::siege_tactics_end::BattleSide,
    idx: usize,
) -> civ_engine::domain::siege_tactics_turnseq::UnitRef {
    civ_engine::domain::siege_tactics_turnseq::UnitRef { side, idx }
}

/// Pierwszy kafel pola o nazwie kombatowej `name` (`combatTerrainName`).
fn find_cell(ses: &SiegeBattleSession, name: &str) -> Option<(i64, i64)> {
    let m = &ses.field().map;
    for r in 0..m.rows() {
        for c in 0..m.cols() {
            if m.combat_terrain_name_f(f64::from(c), f64::from(r)) == name {
                return Some((i64::from(c), i64::from(r)));
            }
        }
    }
    None
}

/// Z2: trafienie wieży (`_fireOneTower` `:4236-4264` → `_singleBlow(shooter, target, true)` `:8811-8960`) jest składane z
/// REALNEGO celu (`cuD`: Obrona, Pancerz, `maxHp`), z trudnością strony obrońcy dla strzelca
/// (`battleUnitDifficultyCombatMult(shooter.bu, defenderDifficultyCombatMult)`), trudnością właściciela celu, kontrą
/// `counterMultiplier(shooter, cuD)` i środowiskiem obrony miasta; strzelec = `towerShooterRow`.
#[test]
fn wieza_sklada_cios_z_realnym_celem() {
    use civ_engine::domain::siege_battle_adapter_unit::counter_multiplier_pin;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::{BlowSite, TowerBlowSite};
    let s = scn_base();
    let (st, mut input) = state_for(&s);
    let (own, enemy) = owner_ids(&st);
    input.owners.get_mut(&own).unwrap().difficulty_combat_mult = 1.25;
    input.owners.get_mut(&enemy).unwrap().difficulty_combat_mult = 0.8;
    let d = data();
    let ses = SiegeBattleSession::start(&st, &input, &d).unwrap();
    let lp = ses.battle_loop();
    let wall_col = lp.st.siege_wall_col;
    let row = *lp.env.tower_rows.first().expect("wieze na murze");
    let tmpl = lp.env.tower_shot.clone().expect("strzelec wiezy");
    let target = uref(BattleSide::Attacker, 0);
    let def0 = uref(BattleSide::Defender, 0);
    let site = TowerBlowSite {
        target,
        shooter_cell: (wall_col, row),
        target_cell: (wall_col - 2, row),
        target_on_wall: false,
    };
    let inp = ses
        .compose_tower_blow(&site)
        .expect("kompozytor zna strzelca");
    // Ten sam `cuD`, co przy każdym innym ciosie w tę jednostkę.
    let any = ses
        .compose_blow(&BlowSite {
            attacker: def0,
            target,
            ranged: true,
            attacker_cell: (wall_col, row),
            target_cell: (wall_col - 2, row),
            target_on_wall: false,
            first_blow: true,
        })
        .unwrap();
    let as_atk = ses
        .compose_blow(&BlowSite {
            attacker: target,
            target: def0,
            ranged: false,
            attacker_cell: (wall_col - 2, row),
            target_cell: (wall_col, row),
            target_on_wall: true,
            first_blow: true,
        })
        .unwrap();
    assert_eq!(inp.defender, any.defender, "cuD celu");
    assert!(
        inp.defender.melee_defence > 0.0,
        "Obrona celu nie z neutralnego szablonu"
    );
    assert_eq!(inp.defender_state.max_hp, any.defender_state.max_hp);
    assert_ne!(
        inp.defender_state.max_hp, tmpl.defender_state.max_hp,
        "maxHp celu, nie 10 z neutralnego szablonu"
    );
    assert_eq!(inp.attacker, tmpl.attacker, "strzelec = towerShooterRow");
    assert!(inp.ranged);
    assert_eq!(
        inp.atk_diff_mult, 1.25,
        "trudnosc strony obroncy (strzelec)"
    );
    assert_eq!(inp.def_diff_mult, 0.8, "trudnosc wlasciciela celu");
    assert!(inp.env.is_city_defense_battle, "obrona miasta");
    assert_eq!(
        inp.counter_mult,
        counter_multiplier_pin(
            &inp.attacker.counter_typ,
            &as_atk.attacker.counter_typ,
            &d.counters,
            d.counter_mult
        )
    );
}

/// Z2: bonusy cywilizacji strzelca = `defenderCivBonusy` sceny (`battleUnitCivBonusy(shooter.bu, defenderCivBonusy)`,
/// właściciel `defRosterRef[0]`, `main.ts:36995`), nie bonusy atakującego.
#[test]
fn wieza_bonusy_cywilizacji_strony_obroncy() {
    use civ_engine::data::civilizations::{parse_civ_matrix, Num};
    use civ_engine::domain::civ_bonuses::civ_matrix_bonusy_for_civ_key;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::TowerBlowSite;
    let mut m = parse_civ_matrix().unwrap();
    let row = m
        .cywilizacje
        .iter_mut()
        .find(|c| c.typ_cywilizacji == "rzymianie")
        .unwrap();
    row.params
        .insert("walka_atak_wszystkie".into(), Num::Float(0.5));
    let bonus = civ_matrix_bonusy_for_civ_key(&m, "rzymianie");
    let s = scn_base();
    let (st, input) = state_for(&s);
    let (own, enemy) = owner_ids(&st);
    let d = data();
    let compose = |input: &SiegeSessionInput| {
        let ses = SiegeBattleSession::start(&st, input, &d).unwrap();
        let wall_col = ses.battle_loop().st.siege_wall_col;
        let row = ses.battle_loop().env.tower_rows[0];
        ses.compose_tower_blow(&TowerBlowSite {
            target: uref(BattleSide::Attacker, 0),
            shooter_cell: (wall_col, row),
            target_cell: (wall_col - 2, row),
            target_on_wall: false,
        })
        .unwrap()
    };
    let base = compose(&input);
    let mut with_def = input.clone();
    with_def.owners.get_mut(&own).unwrap().civ_bonusy = bonus.clone();
    let mut with_atk = input.clone();
    with_atk.owners.get_mut(&enemy).unwrap().civ_bonusy = bonus;
    let d_mods = compose(&with_def).atk_mods;
    let a_mods = compose(&with_atk).atk_mods;
    assert!(
        d_mods.atk > base.atk_mods.atk,
        "bonus obroncy dziala na strzelca: {d_mods:?} vs {:?}",
        base.atk_mods
    );
    assert_eq!(
        a_mods, base.atk_mods,
        "bonus atakujacego nie dziala na strzelca"
    );
}

/// Ciało z gotowym trafieniem wieży: sesja `mur`, wiersz pierwszej wieży, cel = atakujący 0.
fn tower_fixture() -> (SiegeBattleSession, i64) {
    let (st, input) = state_for(&scn_base());
    let ses = SiegeBattleSession::start(&st, &input, &data()).unwrap();
    let row = ses.battle_loop().env.tower_rows[0];
    (ses, row)
}

/// Z3 / E2: zabicie przez wieżę wykonuje ripple `_shakeAlliesOnLoss(defender)` (`_resolveBlowOutcome` `:9048`) i wpis
/// `_pushClash(..., 'padl')` z aktorem wieży.
#[test]
fn wieza_zabicie_ripple_i_padl() {
    use civ_engine::domain::siege_tactics_actions::{Actor, BattleAction};
    use civ_engine::domain::siege_tactics_blow::ClashTag;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::LoopBody;
    let (mut ses, row) = tower_fixture();
    let lp = ses.battle_loop_mut();
    let tmpl = lp.env.tower_shot.clone().unwrap();
    let target = uref(BattleSide::Attacker, 0);
    let mut killed = false;
    for _ in 0..500 {
        lp.st.atk[0].c.hp = 1e-6;
        lp.st.atk[0].c.morale = 1e9;
        lp.env.body.set_tower_row(row);
        lp.env.body.tower_blow(&tmpl, 0, &mut lp.st);
        if lp.st.atk[0].c.fading_out || lp.st.atk[0].c.dead {
            killed = true;
            break;
        }
    }
    assert!(killed, "brak trafienia w 500 rzutach");
    assert_eq!(
        lp.env.body.kill_ripples,
        vec![target],
        "ripple przy zabiciu"
    );
    let acts = lp.env.body.take_actions();
    assert!(
        acts.iter().any(|a| matches!(
            a.action,
            BattleAction::Clash { attacker: Actor::Tower(r), target: t, tag: ClashTag::Padl, .. }
                if r == row && t == target
        )),
        "{acts:?}"
    );
    assert!(lp.env.body.unported.is_empty());
}

/// Z3 / E3: trafienie (nieśmiertelne) celu, który uciekł w czasie lotu pocisku (`RANGED_FLY_MS`, `_fireOneTower`
/// `:4263-4264` sprawdza tylko `dead`/`fadingOut`): `_resolveBlowOutcome` przechodzi do gałęzi morale i
/// `_pushClash(..., defender.routed ? 'rout' : '')` (`:9066`) daje tag `rout`.
#[test]
fn wieza_trafienie_uciekajacego_tag_rout() {
    use civ_engine::domain::siege_tactics_actions::{Actor, BattleAction};
    use civ_engine::domain::siege_tactics_blow::ClashTag;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::LoopBody;
    let (mut ses, row) = tower_fixture();
    let lp = ses.battle_loop_mut();
    let tmpl = lp.env.tower_shot.clone().unwrap();
    let target = uref(BattleSide::Attacker, 0);
    let mut tag = None;
    for _ in 0..500 {
        lp.st.atk[0].c.hp = 1e6;
        lp.st.atk[0].c.routed = true;
        lp.env.body.set_tower_row(row);
        lp.env.body.tower_blow(&tmpl, 0, &mut lp.st);
        tag = lp
            .env
            .body
            .take_actions()
            .into_iter()
            .find_map(|a| match a.action {
                BattleAction::Clash {
                    attacker: Actor::Tower(r),
                    target: t,
                    tag,
                    ..
                } if r == row && t == target => Some(tag),
                _ => None,
            });
        if tag.is_some() {
            break;
        }
    }
    assert_eq!(tag, Some(ClashTag::Rout));
    assert!(lp.env.body.kill_ripples.is_empty());
}

/// Z4a (D-WIRA-10): `_checkRout` liczy `terrainDefenseMultiplier` z BIEŻĄCEGO kafla (`combatTerrainName(ru.q, ru.r)`,
/// `:9790-9792`). Sojusznik poległego (`_shakeAlliesOnLoss` `:9048`, strata `MORALE_ALLY_DEATH_LOSS`, potem
/// `_checkRout`) z morale po stracie między `flee - MORALE_TERRAIN_RESIST` a `flee` ucieka na kaflu startowym (równina),
/// a po przejściu na wzgórza (+50% Obrony dla każdej roli; las tylko vs `dystans`/`flanka`) nie.
#[test]
fn checkrout_z_biezacego_kafla() {
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::{LoopBody, MORALE_ALLY_DEATH_LOSS};
    let (st, input) = state_for(&scn_base());
    let d = data();
    let probe = SiegeBattleSession::start(&st, &input, &d).unwrap();
    let hills = find_cell(&probe, "Wzgorza")
        .or_else(|| find_cell(&probe, "Gory"))
        .expect("wzgorza na polu bitwy");
    let ally = uref(BattleSide::Attacker, 1);
    let tdm_hills = probe.terrain_defence_mult_at(ally, hills).unwrap();
    assert!(tdm_hills > 1.0, "wzgorza daja bonus obrony ({tdm_hills})");
    let start_cell = {
        let a = &probe.battle_loop().env.body.units[0][1].activate;
        (a.q, a.r)
    };
    let start_tdm = probe.battle_loop().env.body.units[0][1]
        .activate
        .terrain_defence_mult;
    assert_eq!(
        probe.terrain_defence_mult_at(ally, start_cell).unwrap(),
        start_tdm,
        "start: ta sama wartosc co adapter"
    );
    assert!(start_tdm <= 1.0, "kafel startowy bez bonusu");
    let ally_routs = |cell: Option<(i64, i64)>| {
        let mut ses = SiegeBattleSession::start(&st, &input, &d).unwrap();
        let lp = ses.battle_loop_mut();
        let row = lp.env.tower_rows[0];
        let tmpl = lp.env.tower_shot.clone().unwrap();
        if let Some((q, r)) = cell {
            for i in [0, 1] {
                lp.env.body.units[0][i].activate.q = q;
                lp.env.body.units[0][i].activate.r = r;
            }
        } else {
            lp.env.body.units[0][0].activate.q = start_cell.0;
            lp.env.body.units[0][0].activate.r = start_cell.1;
        }
        lp.st.atk[1].c.flee_morale = 20.0;
        for _ in 0..500 {
            lp.st.atk[0].c.hp = 1e-6;
            lp.st.atk[0].c.morale = 1e9;
            lp.st.atk[1].c.morale = 18.0 + MORALE_ALLY_DEATH_LOSS;
            lp.env.body.set_tower_row(row);
            lp.env.body.tower_blow(&tmpl, 0, &mut lp.st);
            if lp.st.atk[0].c.fading_out || lp.st.atk[0].c.dead {
                assert_eq!(lp.st.atk[1].c.morale, 18.0, "strata ripple");
                return lp.st.atk[1].c.routed;
            }
        }
        panic!("brak trafienia w 500 rzutach");
    };
    assert!(ally_routs(None), "kafel startowy: ucieczka");
    assert!(
        !ally_routs(Some(hills)),
        "wzgorza (biezacy kafel): brak ucieczki"
    );
}

/// Z4c: `step` z niepoprawnym czasem w fazie `Prepared` zwraca błąd BEZ startu bitwy.
#[test]
fn step_niepoprawny_czas_nie_startuje_bitwy() {
    let (st, input) = state_for(&scn_base());
    let mut ses = SiegeBattleSession::prepare(&st, &input, &data()).unwrap();
    for bad in [f64::NAN, -1.0, f64::INFINITY] {
        assert!(ses.step(bad).is_err());
        assert_eq!(ses.phase(), SessionPhase::Prepared, "{bad}");
    }
    assert!(ses.battle_loop().st.turn_order.is_empty(), "brak tury 0");
}

/// M16: `def_on_wall` kompozytora = `defender.onWallWalkway` (`:8839`, `wallCivMult` `:8932`): obrońca na koronie z
/// bonusem muru cywilizacji (`hetyci`, `walka_obrona_piechota_w_murze`) ma `def_on_wall` i mnożnik ≠ 1.
#[test]
fn kompozytor_mur_cywilizacji_obroncy() {
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::BlowSite;
    let s = Scn {
        def: vec!["Wojownik", "Włócznik"],
        ..scn_base()
    };
    let (st, mut input) = state_for(&s);
    let (own, _) = owner_ids(&st);
    input.owners.get_mut(&own).unwrap().civ_bonusy = civ_bonusy("hetyci");
    let ses = SiegeBattleSession::start(&st, &input, &data()).unwrap();
    let wall_col = ses.battle_loop().st.siege_wall_col;
    let mk = |on_wall| BlowSite {
        attacker: uref(BattleSide::Attacker, 0),
        target: uref(BattleSide::Defender, 0),
        ranged: false,
        attacker_cell: (wall_col - 1, 50),
        target_cell: (wall_col, 50),
        target_on_wall: on_wall,
        first_blow: true,
    };
    let on = ses.compose_blow(&mk(true)).unwrap();
    let off = ses.compose_blow(&mk(false)).unwrap();
    assert!(on.def_on_wall && !off.def_on_wall);
    assert!(
        on.def_wall_civ_mult > 1.0,
        "bonus muru hetytow ({})",
        on.def_wall_civ_mult
    );
    assert_eq!(off.def_wall_civ_mult, 1.0);
}

/// M23: kontekst cywilizacji ciosu dostaje `terrain: defTerrain` (`:8905-8920`). Bonus leśny (`slowianie`,
/// `walka_obrona_piechota_teren_las`) działa, gdy nazwa terenu zawiera `las`/`dzungl`/`gor` (`bonusApplies`; uwaga:
/// `Plaskie` zawiera `las`, więc działa też na równinie, jak w pinie), ale NIE w rzece (`Rzeka`): obrońca w rzece ma
/// mniejszą Obronę niż na równinie. Pole z rzeką: `worldTerrain.rzeka = true`.
#[test]
fn kompozytor_las_cywilizacji_obroncy() {
    use civ_engine::domain::battle_setup_terrain::WorldTerrainInput;
    use civ_engine::domain::siege_tactics_end::BattleSide;
    use civ_engine::domain::siege_tactics_loop::BlowSite;
    let (st, mut input) = state_for(&scn_base());
    let (own, _) = owner_ids(&st);
    input.owners.get_mut(&own).unwrap().civ_bonusy = civ_bonusy("slowianie");
    input.world_terrain = Some(WorldTerrainInput {
        baza: "Rownina".into(),
        las: false,
        rzeka: true,
    });
    let ses = SiegeBattleSession::start(&st, &input, &data()).unwrap();
    let river = find_cell(&ses, "Rzeka").expect("rzeka na polu bitwy");
    let plain = find_cell(&ses, "Plaskie (rownina/laka)").expect("rownina na polu bitwy");
    let mk = |cell: (i64, i64)| BlowSite {
        attacker: uref(BattleSide::Attacker, 0),
        target: uref(BattleSide::Defender, 0),
        ranged: true,
        attacker_cell: (cell.0 - 3, cell.1),
        target_cell: cell,
        target_on_wall: false,
        first_blow: true,
    };
    let r = ses.compose_blow(&mk(river)).unwrap();
    let p = ses.compose_blow(&mk(plain)).unwrap();
    assert!(
        p.def_mods.obrona > r.def_mods.obrona,
        "rownina {} vs rzeka {}",
        p.def_mods.obrona,
        r.def_mods.obrona
    );
}
