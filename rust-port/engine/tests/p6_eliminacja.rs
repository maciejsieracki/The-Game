//! R-RUSTPORT-P6-ELIMINACJA-Q1: czysta funkcja eliminacji wlasciciela (`domain::eliminacja::eliminate_owner`).
//!
//! - Wektory: `p6_eliminacja_vectors/vectors.json` (generator `p6_eliminacja_gen.mjs` WYKONUJE tekst
//!   `eliminateOwner` z pinu 07d2fbd72 w node i sprawdza SHA-256 zrodel). Kazdy przypadek = stan poczatkowy
//!   (jednostki, `eliminatedOwners`, akumulatory bitwy i zdobyczy, pary dyplomacji) + sekwencja eliminacji;
//!   po kazdym kroku porownanie calego zakresu snapshotu z webem.
//! - Zakres porownania: jednostki, eliminatedOwners, akumulatory, relacje, activeDeals, wojny wymuszone (3 epoki:
//!   pending/cycle/rest/active), tury wejscia w Braz/Zelazo, regularWarCapturedByPairKey, forcedWarWavesByPairKey,
//!   diplomacyPairMeta, diplomacyFactorLog. NIE_ZMIERZONO = reszta pol `eliminateOwner` (patrz `domain/eliminacja.rs`).
//! - Zgodnosc wsteczna: brak nowych pol serde w `PlayableState` / `WarTurnState` (nic do testowania).

use civ_engine::domain::diplomacy::{
    ActiveDeal, CivilizationPair, Relation, RelationStatus, TreatyKind,
};
use civ_engine::domain::eliminacja::eliminate_owner;
use civ_engine::domain::playable::{PlayableState, PlayableUnit, PlayableUnitKind};
use civ_engine::domain::types::PositionDto;
use civ_engine::domain::war_forced_pairing::{ForcedWarPairState, ForcedWarSaveState};
use civ_engine::domain::{PlayerId, UnitId};
use serde_json::Value;

fn vectors() -> Value {
    serde_json::from_str(include_str!("p6_eliminacja_vectors/vectors.json")).expect("vectors")
}

fn unit(id: u64, owner: u64) -> PlayableUnit {
    PlayableUnit {
        id: UnitId::new(id),
        owner_id: PlayerId::new(owner),
        kind: PlayableUnitKind::Warrior,
        position: PositionDto::new(0, 0),
        movement: 2,
        movement_max: 2,
        selected: false,
    }
}

fn pairs_f64(v: &Value) -> Vec<(i64, f64)> {
    v.as_array()
        .expect("tablica par")
        .iter()
        .map(|p| {
            (
                p[0].as_i64().expect("klucz"),
                p[1].as_f64().expect("wartosc"),
            )
        })
        .collect()
}

fn pairs_u64(v: &Value) -> Vec<(u64, u64)> {
    v.as_array()
        .expect("tablica par")
        .iter()
        .map(|p| (p[0].as_u64().expect("a"), p[1].as_u64().expect("b")))
        .collect()
}

fn i64s(v: &Value) -> Vec<i64> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_i64().expect("liczba"))
        .collect()
}

/// Stan jednej epoki wymuszonej wojny z wektora (`extra.<epoka>`): pending, cycle, rest, active (klucz, napastnik, cel).
fn forced_from_json(v: &Value) -> ForcedWarSaveState {
    ForcedWarSaveState {
        pending_owners: i64s(&v["pending"]),
        cycle_owners: i64s(&v["cycle"]),
        rest_until_by_owner: pairs_f64(&v["rest"]),
        active_by_pair_key: active_expected(&v["active"])
            .into_iter()
            .map(|(k, att, tgt)| {
                (
                    k,
                    ForcedWarPairState {
                        attacker_id: att,
                        target_id: tgt,
                        captured_by_attacker: 0,
                        captured_by_defender: 0,
                        start_turn: None,
                    },
                )
            })
            .collect(),
    }
}

fn active_expected(v: &Value) -> Vec<(String, i64, i64)> {
    v.as_array()
        .expect("active")
        .iter()
        .map(|a| {
            (
                a[0].as_str().expect("klucz").to_string(),
                a[1].as_i64().expect("napastnik"),
                a[2].as_i64().expect("cel"),
            )
        })
        .collect()
}

fn active_actual(f: &ForcedWarSaveState) -> Vec<(String, i64, i64)> {
    f.active_by_pair_key
        .iter()
        .map(|(k, st)| (k.clone(), st.attacker_id, st.target_id))
        .collect()
}

/// Pola opaque (surowe Map weba) porownywane jako calosc: brak klucza = pusta Map.
const OPAQUE_FIELDS: [(&str, &str); 4] = [
    ("regularWarCapturedByPairKey", "regular"),
    ("forcedWarWavesByPairKey", "waves"),
    ("diplomacyPairMeta", "pair_meta"),
    ("diplomacyFactorLog", "factor_log"),
];

fn build_state(init: &Value) -> (PlayableState, Vec<i64>) {
    let mut state = PlayableState::empty();
    for (i, o) in init["unit_owners"]
        .as_array()
        .expect("units")
        .iter()
        .enumerate()
    {
        state
            .units
            .push(unit(i as u64 + 1, o.as_u64().expect("owner")));
    }
    state.war.battle_power_pts_by_owner = pairs_f64(&init["battle"]);
    state.war.zdobycze_power_by_owner = pairs_f64(&init["zdobycze"]);
    for (a, b) in pairs_u64(&init["relations"]) {
        state.war.diplomacy.relations.insert(
            CivilizationPair::new(PlayerId::new(a), PlayerId::new(b)),
            Relation::new(0.0, 0.0, RelationStatus::Neutral),
        );
    }
    let ex = &init["extra"];
    for d in ex["deals"].as_array().expect("deals") {
        state.war.diplomacy.deals.push(ActiveDeal::new(
            TreatyKind::Nap,
            PlayerId::new(d[0].as_u64().expect("a")),
            PlayerId::new(d[1].as_u64().expect("b")),
            1,
            None,
        ));
    }
    state.war.forced = [
        forced_from_json(&ex["stone"]),
        forced_from_json(&ex["bronze"]),
        forced_from_json(&ex["iron"]),
    ];
    state.war.bronze_era_enter_turn_by_owner = pairs_f64(&ex["era_bronze"]);
    state.war.iron_era_enter_turn_by_owner = pairs_f64(&ex["era_iron"]);
    for (key, field) in OPAQUE_FIELDS {
        state.war.opaque.insert(key.to_string(), ex[field].clone());
    }
    // Kolejnosc wstawiania z wektora (jak Set w webie) zachowana bez sortowania.
    let eliminated = i64s(&init["eliminated"]);
    (state, eliminated)
}

fn sorted_pairs_f64(mut v: Vec<(i64, f64)>) -> Vec<(i64, f64)> {
    v.sort_by_key(|a| a.0);
    v
}

#[test]
fn wektory_pinu_eliminacji_zgodne_z_webem_krok_po_kroku() {
    let v = vectors();
    let cases = v["cases"].as_array().expect("cases");
    assert!(cases.len() >= 150, "za malo przypadkow: {}", cases.len());
    let mut kroki = 0usize;
    // Niepustosc: sprawdza, ze wektory faktycznie wymuszaja czyszczenia (test nie jest pusty).
    let mut usuniete_umowy = 0usize;
    let mut usuniete_wojny = 0usize;
    let mut usuniete_wpisy_opaque = 0usize;
    for (ci, case) in cases.iter().enumerate() {
        let (mut state, mut elim) = build_state(&case["init"]);
        for step in case["steps"].as_array().expect("steps") {
            let owner = step["owner"].as_i64().expect("owner");
            let przed_umowy = state.war.diplomacy.deals.len();
            let przed_wojny: usize = state
                .war
                .forced
                .iter()
                .map(|f| f.active_by_pair_key.len())
                .sum();
            let przed_opaque: usize = OPAQUE_FIELDS
                .iter()
                .map(|(k, _)| {
                    state
                        .war
                        .opaque
                        .get(*k)
                        .and_then(Value::as_array)
                        .map_or(0, Vec::len)
                })
                .sum();
            let wynik = eliminate_owner(&mut state, &mut elim, owner);
            kroki += 1;
            usuniete_umowy += przed_umowy - state.war.diplomacy.deals.len();
            usuniete_wojny += przed_wojny
                - state
                    .war
                    .forced
                    .iter()
                    .map(|f| f.active_by_pair_key.len())
                    .sum::<usize>();
            let po_opaque: usize = OPAQUE_FIELDS
                .iter()
                .map(|(k, _)| {
                    state
                        .war
                        .opaque
                        .get(*k)
                        .and_then(Value::as_array)
                        .map_or(0, Vec::len)
                })
                .sum();
            usuniete_wpisy_opaque += przed_opaque - po_opaque;
            let ctx = format!("przypadek {ci}, krok owner={owner}");
            assert_eq!(
                wynik.pominieta,
                step["expect_pominieta"].as_bool().unwrap(),
                "{ctx}: pominieta"
            );
            assert_eq!(
                wynik.usuniete_jednostki as i64,
                step["expect_usuniete_jednostki"].as_i64().unwrap(),
                "{ctx}: usuniete_jednostki"
            );
            assert_eq!(
                wynik.usuniete_relacje as i64,
                step["expect_usuniete_relacje"].as_i64().unwrap(),
                "{ctx}: usuniete_relacje"
            );
            let jednostki: Vec<u64> = state.units.iter().map(|u| u.id.get()).collect();
            let oczek_jednostki: Vec<u64> = step["expect_units"]
                .as_array()
                .unwrap()
                .iter()
                .map(|x| x.as_u64().unwrap())
                .collect();
            assert_eq!(
                jednostki, oczek_jednostki,
                "{ctx}: jednostki (id po kolejnosci)"
            );
            assert_eq!(
                elim,
                i64s(&step["expect_eliminated"]),
                "{ctx}: eliminatedOwners (kolejnosc wstawiania)"
            );
            assert_eq!(
                sorted_pairs_f64(state.war.battle_power_pts_by_owner.clone()),
                sorted_pairs_f64(pairs_f64(&step["expect_battle"])),
                "{ctx}: battlePowerPtsByOwner"
            );
            assert_eq!(
                sorted_pairs_f64(state.war.zdobycze_power_by_owner.clone()),
                sorted_pairs_f64(pairs_f64(&step["expect_zdobycze"])),
                "{ctx}: zdobyczePowerByOwner"
            );
            let relacje: Vec<(u64, u64)> = state
                .war
                .diplomacy
                .relations
                .keys()
                .map(|p| (p.first.get(), p.second.get()))
                .collect();
            assert_eq!(
                relacje,
                pairs_u64(&step["expect_relations"]),
                "{ctx}: relacje (pary)"
            );
            let ex = &step["expect_extra"];
            let umowy: Vec<(u64, u64)> = state
                .war
                .diplomacy
                .deals
                .iter()
                .map(|d| (d.parties.first.get(), d.parties.second.get()))
                .collect();
            assert_eq!(
                umowy,
                pairs_u64(&ex["deals"]),
                "{ctx}: activeDeals (strony)"
            );
            for (idx, era) in ["stone", "bronze", "iron"].iter().enumerate() {
                let f = &state.war.forced[idx];
                let oczek = &ex[*era];
                assert_eq!(
                    f.pending_owners,
                    i64s(&oczek["pending"]),
                    "{ctx}: {era} pending"
                );
                assert_eq!(f.cycle_owners, i64s(&oczek["cycle"]), "{ctx}: {era} cycle");
                assert_eq!(
                    f.rest_until_by_owner,
                    pairs_f64(&oczek["rest"]),
                    "{ctx}: {era} restUntilByOwner"
                );
                assert_eq!(
                    active_actual(f),
                    active_expected(&oczek["active"]),
                    "{ctx}: {era} activeByPairKey (klucz, napastnik, cel)"
                );
            }
            assert_eq!(
                state.war.bronze_era_enter_turn_by_owner,
                pairs_f64(&ex["era_bronze"]),
                "{ctx}: bronzeEraEnterTurnByOwner"
            );
            assert_eq!(
                state.war.iron_era_enter_turn_by_owner,
                pairs_f64(&ex["era_iron"]),
                "{ctx}: ironEraEnterTurnByOwner"
            );
            for (key, field) in OPAQUE_FIELDS {
                let got = state
                    .war
                    .opaque
                    .get(key)
                    .cloned()
                    .unwrap_or_else(|| Value::Array(Vec::new()));
                assert_eq!(got, ex[field], "{ctx}: {key} (wpisy [klucz, wartosc])");
            }
        }
    }
    assert!(kroki >= 400, "za malo krokow: {kroki}");
    assert!(usuniete_umowy > 0, "wektory nie usuwaja zadnej umowy");
    assert!(
        usuniete_wojny > 0,
        "wektory nie usuwaja zadnej wojny wymuszonej"
    );
    assert!(
        usuniete_wpisy_opaque > 0,
        "wektory nie usuwaja zadnego wpisu opaque"
    );
}

#[test]
fn wlasciciel_zero_i_powtorka_sa_no_op() {
    let mut state = PlayableState::empty();
    state.units.push(unit(1, 0));
    state.units.push(unit(2, 1));
    let mut elim = vec![1];
    let r0 = eliminate_owner(&mut state, &mut elim, 0);
    assert!(r0.pominieta);
    assert_eq!(state.units.len(), 2);
    let r1 = eliminate_owner(&mut state, &mut elim, 1);
    assert!(r1.pominieta);
    assert_eq!(r1.usuniete_jednostki, 0);
    assert_eq!(state.units.len(), 2);
    assert_eq!(elim, vec![1]);
}

#[test]
fn ujemny_wlasciciel_nie_usuwa_nikogo_ale_trafia_do_zbioru() {
    // Web: eliminateOwner(-5) dopisuje -5 do eliminatedOwners i nie ma jednostek ani par o takim id.
    let mut state = PlayableState::empty();
    state.units.push(unit(1, 2));
    let mut elim = Vec::new();
    let r = eliminate_owner(&mut state, &mut elim, -5);
    assert!(!r.pominieta);
    assert_eq!(r.usuniete_jednostki, 0);
    assert_eq!(elim, vec![-5]);
    assert_eq!(state.units.len(), 1);
}
