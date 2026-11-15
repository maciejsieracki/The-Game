//! R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1: wektory i kolejnosc krokow `declare_war_by_player`
//! (web `playerDeclareWarOnOwner`, pin `07d2fbd72`, `gra/src/main.ts:13152-13186`).

use civ_engine::domain::credibility::{CredibilityEvent, CredibilityParams, CredibilityRegistry};
use civ_engine::domain::diplomacy::{
    apply_credibility_tempo, apply_diplomatic_event, clamp_relation_for_war, ActiveDeal,
    CivilizationPair, DiplomaticEvent, Relation, RelationStatus, TreatyKind,
};
use civ_engine::domain::diplomacy_aggressor::{AggressorEngineState, WarCause};
use civ_engine::domain::diplomacy_player_war::{
    apply_war_declaration_relation, break_treaties_on_war_by_player,
    charge_war_declaration_credibility, declare_war_by_player, n2_values,
    register_player_war_declaration, N2Values, PlayerWarOutcome, KEY_OSTATNIE_PRZEWINIENIE,
};
use civ_engine::domain::diplomacy_truce::{PairMetaWeb, TruceEndOfferWeb};
use civ_engine::domain::diplomacy_truce_flow::TruceDiplomacy;
use civ_engine::domain::types::Difficulty;
use civ_engine::domain::PlayerId;
use serde_json::json;

const HUMAN: u64 = 1;
const AI: u64 = 2;
const TURN: f64 = 5.0;
/// Web `zlamanaPaktGracz_zaufanie` (`-40 Zaufanie`, `diplomacy.ts:865`, kara `zlamana_obietnica`).
const BROKEN_PACT_PLAYER_TRUST: f64 = -40.0;

fn p(x: u64) -> PlayerId {
    PlayerId::new(x)
}

fn setup(status: RelationStatus) -> (TruceDiplomacy, CredibilityRegistry, AggressorEngineState) {
    setup_with(40.0, 40.0, status)
}

fn setup_with(
    trust0: f64,
    respect0: f64,
    status: RelationStatus,
) -> (TruceDiplomacy, CredibilityRegistry, AggressorEngineState) {
    let mut s = TruceDiplomacy::new();
    s.humans.insert(p(HUMAN));
    s.diplomacy.set_relation(
        CivilizationPair::new(p(HUMAN), p(AI)),
        Relation::new(trust0, respect0, status),
    );
    (
        s,
        CredibilityRegistry::default(),
        AggressorEngineState::default(),
    )
}

/// Zaufanie po samym kroku `DeclareWar` (bez kary). Wojna podlega capowi wyniku relacji
/// (`clamp_relation_for_war`), wiec porownujemy z ta sama sciezka, nie z wartoscia startowa.
fn trust_after_plain_declare(trust0: f64, respect0: f64) -> f64 {
    apply_diplomatic_event(
        &Relation::new(trust0, respect0, RelationStatus::Peace),
        DiplomaticEvent::DeclareWar,
    )
    .trust
}

fn add_deal(s: &mut TruceDiplomacy, kind: TreatyKind) {
    s.diplomacy
        .add_deal(ActiveDeal::new(kind, p(HUMAN), p(AI), 1, None));
}

fn trust(s: &TruceDiplomacy) -> f64 {
    s.relation(p(HUMAN), p(AI)).trust
}

fn declare(
    s: &mut TruceDiplomacy,
    cred: &mut CredibilityRegistry,
    agg: &mut AggressorEngineState,
    turn: f64,
) -> PlayerWarOutcome {
    declare_war_by_player(
        s,
        cred,
        agg,
        Difficulty::Normal,
        p(HUMAN),
        p(AI),
        false,
        turn,
    )
}

fn declared_parts(out: PlayerWarOutcome) -> (bool, Vec<String>, WarCause) {
    match out {
        PlayerWarOutcome::Declared {
            truce_breach,
            broken_treaties,
            cause,
        } => (truce_breach, broken_treaties, cause),
        other => panic!("oczekiwano Declared, jest {other:?}"),
    }
}

#[test]
fn n2_wartosci_zgodne_z_pinem() {
    assert_eq!(
        n2_values(),
        N2Values {
            nap: -18.0,
            sojusz: -25.0,
            odwet_okno_tur: 10.0,
        }
    );
}

#[test]
fn nap_bez_okna_karze_n2_zrywa_nap_i_ustawia_wojne() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::Nap);
    let out = declare(&mut s, &mut cred, &mut agg, TURN);
    let (breach, broken, cause) = declared_parts(out);
    assert!(!breach);
    assert_eq!(broken.len(), 1);
    assert_eq!(cause, WarCause::BezPowodu);
    assert_eq!(s.status(p(HUMAN), p(AI)), RelationStatus::War);
    assert!(s.diplomacy.deals.is_empty());
    let ev = cred.events_of(HUMAN as i64);
    assert_eq!(ev.len(), 1);
    assert_eq!(ev[0].typ, CredibilityEvent::ZlamaniePaktuNap);
    assert_eq!(ev[0].original_value, -18.0);
    assert_eq!(ev[0].turn_occurred, TURN);
    // P4 (main.ts:12223-12224): licznik "bez wojny" obu stron zerowany.
    assert_eq!(
        cred.last_war_turn
            .iter()
            .find(|x| x.0 == HUMAN as i64)
            .map(|x| x.1),
        Some(TURN)
    );
    assert_eq!(
        cred.last_war_turn
            .iter()
            .find(|x| x.0 == AI as i64)
            .map(|x| x.1),
        Some(TURN)
    );
    let m = s.pair_meta_of(p(HUMAN), p(AI));
    assert_eq!(m.wojna_od_tury, Some(TURN));
    assert_eq!(m.n1_zastosowany, Some(false));
    assert_eq!(
        m.extra.get(KEY_OSTATNIE_PRZEWINIENIE),
        Some(&json!({
            "turn": TURN,
            "typ": "wypowiedzenie_wojny_bez_ostrzezenia",
            "byOwnerId": HUMAN as f64,
            "againstOwnerId": AI as f64,
        }))
    );
}

#[test]
fn sojusz_ma_pierwszenstwo_przed_nap_jedna_kara_n2() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::FullAlliance);
    add_deal(&mut s, TreatyKind::Nap);
    let (_, broken, _) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert_eq!(broken.len(), 2, "oba traktaty zerwane wojna");
    let ev = cred.events_of(HUMAN as i64);
    assert_eq!(ev.len(), 1, "else-if: tylko sojusz");
    assert_eq!(ev[0].typ, CredibilityEvent::ZlamaniePaktuSojusz);
    assert_eq!(ev[0].original_value, -25.0);
}

#[test]
fn okno_rozejmu_karze_nap_zrywa_rozejm_i_daje_bez_powodu() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    s.set_pair_meta(
        p(HUMAN),
        p(AI),
        PairMetaWeb {
            truce_until_turn: Some(10.0),
            truce_initiator_id: Some(AI as f64),
            ..Default::default()
        },
    );
    agg.zarejestruj_casus_belli(HUMAN as f64, AI as f64, 9.0);
    let (breach, broken, cause) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert!(breach, "okno rozejmu = zlamanie Z8");
    assert!(broken.is_empty(), "brak traktatow: brak kary zerwania");
    assert_eq!(
        cause,
        WarCause::BezPowodu,
        "zlamanie rozejmu ma pierwszenstwo przed casus belli"
    );
    let ev = cred.events_of(HUMAN as i64);
    assert_eq!(ev.len(), 1);
    assert_eq!(ev[0].typ, CredibilityEvent::ZlamaniePaktuNap);
    assert_eq!(ev[0].original_value, -18.0);
    let m = s.pair_meta_of(p(HUMAN), p(AI));
    assert_eq!(m.truce_until_turn, None);
    assert_eq!(m.truce_initiator_id, None);
    assert_eq!(
        trust(&s),
        trust_after_plain_declare(40.0, 40.0),
        "bez traktatu: zaufanie bez kary"
    );
}

#[test]
fn bez_traktatu_i_bez_okna_brak_kary_i_przyczyna_bez_powodu() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    let (breach, broken, cause) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert!(!breach);
    assert!(broken.is_empty());
    assert_eq!(cause, WarCause::BezPowodu);
    assert!(cred.events_of(HUMAN as i64).is_empty());
    assert_eq!(
        trust(&s),
        trust_after_plain_declare(40.0, 40.0),
        "bez traktatu: zaufanie bez kary"
    );
    assert_eq!(s.status(p(HUMAN), p(AI)), RelationStatus::War);
}

#[test]
fn casus_belli_daje_przyczyne_casus_belli() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    agg.zarejestruj_casus_belli(HUMAN as f64, AI as f64, 10.0);
    let (_, _, cause) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert_eq!(cause, WarCause::CasusBelli);
}

#[test]
fn odwet_pomija_n2_ale_nie_p4() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::Nap);
    // Wczesniejsze przewinienie AI wobec gracza (zlamanie NAP w turze 3), okno odwetu 10 tur.
    s.set_pair_meta(
        p(HUMAN),
        p(AI),
        PairMetaWeb {
            extra: serde_json::Map::from_iter([(
                KEY_OSTATNIE_PRZEWINIENIE.to_string(),
                json!({
                    "turn": 3.0,
                    "typ": "zlamanie_paktu_nap",
                    "byOwnerId": AI as f64,
                    "againstOwnerId": HUMAN as f64,
                }),
            )]),
            ..Default::default()
        },
    );
    let (_, broken, _) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert_eq!(broken.len(), 1, "traktat i tak zerwany");
    assert!(
        cred.events_of(HUMAN as i64).is_empty(),
        "odwet: brak kary N2"
    );
    assert_eq!(
        cred.last_war_turn.len(),
        2,
        "P4 zawsze zeruje licznik obu stron"
    );
    assert_eq!(
        s.pair_meta_of(p(HUMAN), p(AI))
            .extra
            .get(KEY_OSTATNIE_PRZEWINIENIE),
        Some(&json!({
            "turn": 3.0,
            "typ": "zlamanie_paktu_nap",
            "byOwnerId": AI as f64,
            "againstOwnerId": HUMAN as f64,
        })),
        "web main.ts:12214: odwet nie nadpisuje ostatniePrzewinienieWobecNas"
    );
}

#[test]
fn odwet_wygasa_po_oknie_i_kara_wraca() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::Nap);
    s.set_pair_meta(
        p(HUMAN),
        p(AI),
        PairMetaWeb {
            extra: serde_json::Map::from_iter([(
                KEY_OSTATNIE_PRZEWINIENIE.to_string(),
                json!({
                    "turn": 3.0,
                    "typ": "zlamanie_paktu_nap",
                    "byOwnerId": AI as f64,
                    "againstOwnerId": HUMAN as f64,
                }),
            )]),
            ..Default::default()
        },
    );
    // 20 - 3 = 17 > 10 tur: odwet nie obowiazuje.
    declare(&mut s, &mut cred, &mut agg, 20.0);
    let ev = cred.events_of(HUMAN as i64);
    assert_eq!(ev.len(), 1);
    assert_eq!(ev[0].typ, CredibilityEvent::ZlamaniePaktuNap);
}

#[test]
fn barbarzynca_bez_n2_i_bez_p4_ale_zerwanie_i_wojna_dalej() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    s.barbarians.insert(p(AI));
    add_deal(&mut s, TreatyKind::Nap);
    let (breach, broken, _) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert!(!breach);
    assert_eq!(broken.len(), 1);
    assert!(cred.events_of(HUMAN as i64).is_empty());
    assert!(
        cred.last_war_turn.is_empty(),
        "web: wczesny return przed P4"
    );
    assert_eq!(s.status(p(HUMAN), p(AI)), RelationStatus::War);
}

#[test]
fn guard_pokoju_nie_zmienia_stanu() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::Nap);
    let before = s.clone();
    let out = declare_war_by_player(
        &mut s,
        &mut cred,
        &mut agg,
        Difficulty::Normal,
        p(HUMAN),
        p(AI),
        true,
        TURN,
    );
    assert_eq!(out, PlayerWarOutcome::PeaceLocked);
    assert_eq!(s.status(p(HUMAN), p(AI)), RelationStatus::Peace);
    assert_eq!(s.diplomacy.deals.len(), before.diplomacy.deals.len());
    assert!(cred.events_of(HUMAN as i64).is_empty());
    assert_eq!(trust(&s), trust(&before));
}

/// Kara `zlamana_obietnica` liczona z tempem wiarygodnosci WYLACZNIE gdy relacja jest jeszcze w pokoju
/// (web `applyDiploEventTracked`, `main.ts:12318-12319`). Kolejnosc (a)->(b)->(c) daje tempo; zamiana a<->c
/// (relacja `wojna` przed zerwaniem) daje kare bez tempa, czyli inny stan. Test mutacji: musi wykryc zamiane.
#[test]
fn kolejnosc_a_c_zmienia_kare_mutacja_musi_dac_roznica() {
    // Kanoniczna kolejnosc (wrapper).
    let (mut s1, mut cred1, mut agg1) = setup_with(40.0, 0.0, RelationStatus::Peace);
    add_deal(&mut s1, TreatyKind::Nap);
    declare(&mut s1, &mut cred1, &mut agg1, TURN);
    let trust_canonical = trust(&s1);

    // Zamiana a<->c: relacja `wojna` ustawiona przed naliczeniem N2 i zerwaniem.
    let (mut s2, mut cred2, mut agg2) = setup_with(40.0, 0.0, RelationStatus::Peace);
    add_deal(&mut s2, TreatyKind::Nap);
    apply_war_declaration_relation(&mut s2, p(HUMAN), p(AI));
    charge_war_declaration_credibility(&mut s2, &mut cred2, p(HUMAN), p(AI), TURN);
    break_treaties_on_war_by_player(&mut s2, &cred2, Difficulty::Normal, p(HUMAN), p(AI), TURN);
    register_player_war_declaration(&mut agg2, p(HUMAN), p(AI), TURN, false);
    let trust_mutated = trust(&s2);

    assert_ne!(
        trust_canonical, trust_mutated,
        "mutacja a<->c nie zmienila wyniku: test nie wykrywa bledu kolejnosci"
    );
    assert_eq!(trust_mutated, 0.0, "bez tempa: pelna kara -40 z 40 do 0");

    // Kanoniczna: tempo z wiarygodnoscia PO naliczeniu N2 (rejestr finalny = stan w chwili zerwania).
    let w = cred1.total_of(
        HUMAN as i64,
        TURN,
        Difficulty::Normal,
        CredibilityParams::load(),
    );
    let delta = apply_credibility_tempo(BROKEN_PACT_PLAYER_TRUST, Some(w));
    let expected =
        clamp_relation_for_war(&Relation::new(40.0 + delta, 0.0, RelationStatus::War)).trust;
    assert!(
        trust_canonical > 0.0,
        "tempo musi dac niezerowy wynik (w = {w})"
    );
    assert!(
        (trust_canonical - expected).abs() < 1e-9,
        "{trust_canonical} != {expected}"
    );
    // Literal z pinu, liczony recznie: w = 20 - 18 = 2, spadek 0,99, dZ = -40 * 0,99 = -39,6, zaufanie 40 - 39,6 = 0,4.
    assert!(
        (trust_canonical - 0.4).abs() < 1e-9,
        "literal z pinu: {trust_canonical} != 0.4"
    );
}

#[test]
fn bez_karencji_zerwanie_bez_umow_nie_zmienia_relacji_przed_wojna() {
    // Brak zerwanych umow => web `if (!brokenIds.length) return;`: zadnej kary, zaufanie nietkniete.
    let (mut s, mut cred, _agg) = setup(RelationStatus::Peace);
    let broken =
        break_treaties_on_war_by_player(&mut s, &cred, Difficulty::Normal, p(HUMAN), p(AI), TURN);
    assert!(broken.is_empty());
    assert_eq!(trust(&s), 40.0);
    assert_eq!(s.status(p(HUMAN), p(AI)), RelationStatus::Peace);
    // charge sam nie zapisuje relacji (krok c dopiero zmienia status).
    charge_war_declaration_credibility(&mut s, &mut cred, p(HUMAN), p(AI), TURN);
    assert_eq!(s.status(p(HUMAN), p(AI)), RelationStatus::Peace);
}

fn przewinienie_meta(turn: f64, typ: &str, by: f64, against: f64) -> PairMetaWeb {
    PairMetaWeb {
        extra: serde_json::Map::from_iter([(
            KEY_OSTATNIE_PRZEWINIENIE.to_string(),
            json!({
                "turn": turn,
                "typ": typ,
                "byOwnerId": by,
                "againstOwnerId": against,
            }),
        )]),
        ..Default::default()
    }
}

/// Web `main.ts:12213-12219` + `12196-12201`: NAP i okno rozejmu to DWA osobne zdarzenia -18.
#[test]
fn okno_rozejmu_z_nap_daje_dwa_zdarzenia_n2() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::Nap);
    s.set_pair_meta(
        p(HUMAN),
        p(AI),
        PairMetaWeb {
            truce_until_turn: Some(10.0),
            truce_initiator_id: Some(AI as f64),
            ..Default::default()
        },
    );
    let (breach, broken, _) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert!(breach);
    assert_eq!(broken.len(), 1);
    let ev = cred.events_of(HUMAN as i64);
    assert_eq!(ev.len(), 2, "NAP + okno rozejmu = dwa zdarzenia");
    assert!(ev
        .iter()
        .all(|e| e.typ == CredibilityEvent::ZlamaniePaktuNap && e.original_value == -18.0));
}

/// Web `credibilityEventOpensOdwet` (`main.ts:12148-12153`): cztery typy otwieraja odwet, ktory pomija N2.
#[test]
fn odwet_dla_kazdego_typu_otwierajacego_pomija_n2() {
    for typ in [
        "zlamanie_paktu_sojusz",
        "odmowa_obowiazku_sojuszu",
        "wypowiedzenie_wojny_bez_ostrzezenia",
    ] {
        let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
        add_deal(&mut s, TreatyKind::Nap);
        s.set_pair_meta(
            p(HUMAN),
            p(AI),
            przewinienie_meta(3.0, typ, AI as f64, HUMAN as f64),
        );
        declare(&mut s, &mut cred, &mut agg, TURN);
        assert!(
            cred.events_of(HUMAN as i64).is_empty(),
            "typ {typ}: odwet pomija N2"
        );
    }
}

/// Typ spoza listy odwetu nie pomija N2; niezgodne strony (`byOwnerId`/`againstOwnerId`) tez nie daja odwetu
/// (web `isCredibilityRetaliation`, `main.ts:12161-12167`).
#[test]
fn odwet_wymaga_typu_i_wlasciwych_stron() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    add_deal(&mut s, TreatyKind::Nap);
    s.set_pair_meta(
        p(HUMAN),
        p(AI),
        przewinienie_meta(3.0, "zlamana_umowa_handlowa", AI as f64, HUMAN as f64),
    );
    declare(&mut s, &mut cred, &mut agg, TURN);
    assert_eq!(
        cred.events_of(HUMAN as i64).len(),
        1,
        "typ spoza listy odwetu: N2 wchodzi"
    );

    for (by, against) in [
        (99.0, HUMAN as f64),
        (AI as f64, 99.0),
        (HUMAN as f64, AI as f64),
    ] {
        let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
        add_deal(&mut s, TreatyKind::Nap);
        s.set_pair_meta(
            p(HUMAN),
            p(AI),
            przewinienie_meta(3.0, "zlamanie_paktu_nap", by, against),
        );
        declare(&mut s, &mut cred, &mut agg, TURN);
        let ev = cred.events_of(HUMAN as i64);
        assert_eq!(
            ev.len(),
            1,
            "by={by} against={against}: brak odwetu, N2 wchodzi"
        );
        assert_eq!(ev[0].original_value, -18.0);
    }
}

/// Web `isTruceWindowBreach` (`main.ts:12176-12225`): oferta pokoju po rozejmie (`truceEndOffer`) to zlamanie
/// Z8 nawet bez aktywnego rozejmu; oferta jest czyszczona (`clearTruceEndOffer`).
#[test]
fn oferta_konca_rozejmu_bez_aktywnego_rozejmu_to_zlamanie() {
    let (mut s, mut cred, mut agg) = setup(RelationStatus::Peace);
    s.set_pair_meta(
        p(HUMAN),
        p(AI),
        PairMetaWeb {
            truce_end_offer: Some(TruceEndOfferWeb {
                turn: 4.0,
                from_owner_id: AI as f64,
                to_owner_id: HUMAN as f64,
                inbox_id: None,
            }),
            ..Default::default()
        },
    );
    let (breach, broken, cause) = declared_parts(declare(&mut s, &mut cred, &mut agg, TURN));
    assert!(breach, "oferta po rozejmie = zlamanie Z8");
    assert!(broken.is_empty());
    assert_eq!(cause, WarCause::BezPowodu);
    let ev = cred.events_of(HUMAN as i64);
    assert_eq!(ev.len(), 1);
    assert_eq!(ev[0].typ, CredibilityEvent::ZlamaniePaktuNap);
    assert_eq!(ev[0].original_value, -18.0);
    assert!(s.pair_meta_of(p(HUMAN), p(AI)).truce_end_offer.is_none());
}
