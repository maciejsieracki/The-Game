//! P6-BRAKE-INPUTS (r2): testy porownujace porty Rust z wektorami wygenerowanymi z PINU web
//! (07d2fbd72f758705f8e1d59cc4968027ffbafe75) przez tests/p6_brake_inputs_gen.mjs.
//! Oczekiwania pochodza z wykonania kodu weba, a nie z asercji autora.

use std::collections::{BTreeMap, BTreeSet};

use civ_engine::data::units_combat::parse_power_params;
use civ_engine::domain::ai_diplomacy_turn::pair_key;
use civ_engine::domain::brake_inputs::{
    all_power_owner_ids, contacts_for, crisis_war_gate_blocked, gate_facts_for,
    is_peace_locked_between, phase_owners, ForcedEraLock, GateFacts, OwnerFacts, OwnerRoles,
};
use civ_engine::domain::brake_power::{
    battle_power_model, compute_objective_power, military_component_keys,
    objective_power_for_owner, BattlePowerModel, ObjectivePowerRaw, PowerCoeffs,
};
use civ_engine::domain::diplomacy_tick_war_brake::is_ai_ai_eligible_owner;
use civ_engine::domain::diplomacy_truce::PairMetaWeb;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_brake_inputs_vectors/vectors.json");

fn vec_root() -> Value {
    serde_json::from_str(VECTORS).expect("vectors.json musi sie parsowac")
}

fn num(v: &Value) -> f64 {
    v.as_f64().expect("liczba w wektorze")
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn ids(v: &Value) -> Vec<i64> {
    v.as_array()
        .expect("tablica")
        .iter()
        .map(|x| x.as_i64().expect("id"))
        .collect()
}

fn roles<'a>(me: i64, human_ids: &'a [i64]) -> OwnerRoles<'a> {
    OwnerRoles { me, human_ids }
}

#[test]
fn power_coefficients_and_flags_match_pin_json() {
    let root = vec_root();
    let coeffs = PowerCoeffs::default_params();
    let w = &root["coeffs"];
    assert_eq!(coeffs.jednostka_wojskowa, num(&w["jednostkaWojskowa"]));
    assert_eq!(coeffs.wygrana_bitwa, num(&w["wygranaBitwa"]));
    assert_eq!(coeffs.ludek, num(&w["ludek"]));
    assert_eq!(coeffs.rekrut_ekw_jednostki, num(&w["rekrutEkwJednostki"]));
    assert_eq!(coeffs.miasto, num(&w["miasto"]));
    assert_eq!(coeffs.heks_terytorium, num(&w["heksTerytorium"]));
    assert_eq!(coeffs.budynki, num(&w["budynki"]));
    assert_eq!(coeffs.tech_zbadane, num(&w["techZbadane"]));
    assert_eq!(coeffs.ulepszenie_terenu, num(&w["ulepszenieTerenu"]));
    assert_eq!(coeffs.kultura_imperium, num(&w["kulturaImperium"]));
    assert_eq!(coeffs.religia_jednosc, num(&w["religiaJednosc"]));

    let params = parse_power_params().expect("power-params.json");
    let expected_model = if root["battleModel"] == "enemy_m_sum" {
        BattlePowerModel::EnemyMSum
    } else {
        BattlePowerModel::FlatCount
    };
    assert_eq!(battle_power_model(&params), expected_model);
    let military: Vec<String> = military_component_keys(&params)
        .into_iter()
        .map(str::to_string)
        .collect();
    let mut expected: Vec<String> = root["military"]
        .as_array()
        .unwrap()
        .iter()
        .map(|x| x.as_str().unwrap().to_string())
        .collect();
    expected.sort();
    assert_eq!(military, expected);
}

#[test]
fn objective_power_matches_pinned_compute_objective_power() {
    let root = vec_root();
    let params = parse_power_params().expect("power-params.json");
    let coeff = PowerCoeffs::from_params(&params);
    let battle = battle_power_model(&params);
    let military = military_component_keys(&params);
    let cases = root["objective"].as_array().unwrap();
    assert!(cases.len() > 50, "wektory musza miec pokrycie");
    for case in cases {
        let inp = &case["input"];
        let raw = ObjectivePowerRaw {
            owner_id: inp["ownerId"].as_i64().unwrap(),
            epoka: num(&inp["epoka"]),
            jednostki: num(&inp["jednostki"]),
            wygrane_bitwy: num(&inp["wygraneBitwy"]),
            bitwy_pkt_sum: inp.get("bitwyPktSum").and_then(opt_num),
            suma_ludkow: num(&inp["sumaLudkow"]),
            rekrut_ekw: num(&inp["rekrutEkw"]),
            miasta: num(&inp["miasta"]),
            heksy_terytorium: num(&inp["heksyTerytorium"]),
            budynki: num(&inp["budynki"]),
            tech_zbadane: num(&inp["techZbadane"]),
            ulepszenia_terenu: num(&inp["ulepszeniaTerenu"]),
            kultura_imperium: inp.get("kulturaImperium").and_then(opt_num),
            miasta_jednosc_religii: inp.get("miastaJednoscReligii").and_then(opt_num),
            zdobycze_power: inp.get("zdobyczePower").and_then(opt_num),
        };
        let got = compute_objective_power(&raw, &coeff, battle, &military);
        assert_eq!(got.power, num(&case["power"]), "power, wejscie {inp}");
        assert_eq!(
            got.power_base,
            num(&case["powerBase"]),
            "powerBase, wejscie {inp}"
        );
        assert_eq!(
            objective_power_for_owner(&raw, &coeff, battle, &military),
            num(&case["power"])
        );
        let comps = case["components"].as_array().unwrap();
        assert_eq!(got.components.len(), comps.len());
        for (g, e) in got.components.iter().zip(comps) {
            assert_eq!(g.key, e["key"].as_str().unwrap());
            assert_eq!(g.raw_count, num(&e["rawCount"]), "rawCount {}", g.key);
            assert_eq!(
                g.coefficient,
                num(&e["coefficient"]),
                "coefficient {}",
                g.key
            );
            assert_eq!(g.points, num(&e["points"]), "points {}", g.key);
            assert_eq!(
                g.military,
                e["military"].as_bool().unwrap(),
                "military {}",
                g.key
            );
        }
    }
}

#[test]
fn peace_lock_matches_pinned_is_peace_locked_between() {
    let root = vec_root();
    for case in root["peace"].as_array().unwrap() {
        let a = case["a"].as_i64().unwrap();
        let b = case["b"].as_i64().unwrap();
        let turn = num(&case["turn"]);
        let eras: BTreeMap<i64, i64> = case["eras"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
            .collect();
        // Web: gracz (humanIds) ma era z playerStateByHuman, AI z ownerEraByOwner; brak = gameStartEra (1).
        let epoch = |id: i64| *eras.get(&id).unwrap_or(&1);
        let mut locks = BTreeMap::new();
        for f in case["forced"].as_array().unwrap() {
            let (fa, fb) = (f["a"].as_i64().unwrap(), f["b"].as_i64().unwrap());
            locks.insert(
                pair_key(fa, fb),
                ForcedEraLock {
                    owner_id: f["ownerId"].as_i64().unwrap(),
                    era: f["era"].as_i64().unwrap(),
                },
            );
        }
        let mut metas: BTreeMap<(i64, i64), PairMetaWeb> = BTreeMap::new();
        for m in case["meta"].as_array().unwrap() {
            let (ma, mb) = (m["a"].as_i64().unwrap(), m["b"].as_i64().unwrap());
            let peace = opt_num(&m["peaceUntilTurn"]);
            metas.insert(
                pair_key(ma, mb),
                PairMetaWeb {
                    peace_until_turn: peace,
                    ..PairMetaWeb::default()
                },
            );
        }
        let meta = metas.get(&pair_key(a, b));
        let got = is_peace_locked_between(a, b, &locks, epoch, meta, turn);
        assert_eq!(got, case["locked"].as_bool().unwrap(), "wektor {case}");
    }
}

#[test]
fn crisis_war_gate_matches_pinned_diplo_crisis_war_gate_blocked() {
    let root = vec_root();
    assert_eq!(root["realMultiwarFlag"], Value::Bool(true));
    for case in root["gate"].as_array().unwrap() {
        let declarer = case["declarer"].as_i64().unwrap();
        let victim = case["victim"].as_i64().unwrap();
        let human_ids = ids(&case["humanIds"]);
        let r = roles(0, &human_ids);
        let eras: BTreeMap<i64, i64> = case["eras"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
            .collect();
        let wars: BTreeMap<i64, i64> = case["wars"]
            .as_array()
            .unwrap()
            .iter()
            .map(|p| (p[0].as_i64().unwrap(), p[1].as_i64().unwrap()))
            .collect();
        let fact = |id: i64| -> GateFacts { gate_facts_for(&r, id, eras[&id], wars[&id]) };
        assert_eq!(r.is_human(victim), case["isHumanVictim"].as_bool().unwrap());
        let got = crisis_war_gate_blocked(
            case["multiwar"].as_bool().unwrap(),
            num(&case["turn"]),
            fact(declarer),
            fact(victim),
        );
        assert_eq!(got, case["blocked"].as_bool().unwrap(), "wektor {case}");
    }
}

#[test]
fn owner_eligibility_matches_pinned_all_power_owner_ids_and_diplo_eligible() {
    let root = vec_root();
    for case in root["eligibility"].as_array().unwrap() {
        let me = case["me"].as_i64().unwrap();
        let city_owners = ids(&case["cities"]);
        let starts = ids(&case["aiStartHexes"]);
        let barbarians = ids(&case["barbarians"]);
        let city_copy = ids(&case["cityCopy"]);
        let eliminated = ids(&case["eliminated"]);
        let owner_ids = all_power_owner_ids(&city_owners, &starts);
        assert_eq!(
            owner_ids,
            ids(&case["allPowerOwnerIds"]),
            "kolejnosc allPowerOwnerIds"
        );
        let facts: BTreeMap<i64, OwnerFacts> = owner_ids
            .iter()
            .map(|&id| {
                (
                    id,
                    OwnerFacts {
                        is_barbarian: barbarians.contains(&id),
                        is_city_copy: city_copy.contains(&id),
                        eliminated: eliminated.contains(&id),
                        city_count: city_owners.iter().filter(|&&o| o == id).count() as f64,
                    },
                )
            })
            .collect();
        let human = [0_i64];
        let phase = phase_owners(&roles(me, &human), &owner_ids, &facts).expect("komplet faktow");
        let rows = case["rows"].as_array().unwrap();
        assert_eq!(phase.len(), rows.len());
        for (owner, row) in phase.iter().zip(rows) {
            assert_eq!(owner.id, row["id"].as_i64().unwrap());
            assert_eq!(owner.info.is_player, row["isMe"].as_bool().unwrap());
            assert_eq!(
                is_ai_ai_eligible_owner(&owner.info),
                row["eligible"].as_bool().unwrap(),
                "eligible dla {}",
                owner.id
            );
        }
    }
}

/// UWAGA (zarzut FC r2 nr 4): ten test sprawdza WYLACZNIE konwersje Set -> Vec. Web `getDiplomaticContacts`
/// zwraca Array.from(zbior), wiec wektor nie testuje filtra `computeDiplomaticContacts` (diplomacy-layers.ts:221),
/// ktory nie jest portowany. Pokrycie filtra: NIE_ZWERYFIKOWANE, zaleznosc do W8 r3.
#[test]
fn contacts_match_pinned_get_diplomatic_contacts_as_set() {
    let root = vec_root();
    for case in root["contacts"].as_array().unwrap() {
        let discovered: BTreeSet<i64> = ids(&case["discovered"]).into_iter().collect();
        let mut expected = ids(&case["result"]);
        expected.sort_unstable();
        assert_eq!(contacts_for(&discovered), expected);
    }
}

#[test]
fn player_role_sources_match_web_is_human_and_is_me() {
    let root = vec_root();
    for case in root["players"].as_array().unwrap() {
        let human_ids = ids(&case["humanIds"]);
        let me = case["me"].as_i64().unwrap();
        let owner_ids = ids(&case["ownerIds"]);
        let r = roles(me, &human_ids);
        let is_human: Vec<bool> = case["isHuman"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b.as_bool().unwrap())
            .collect();
        let is_me: Vec<bool> = case["isMe"]
            .as_array()
            .unwrap()
            .iter()
            .map(|b| b.as_bool().unwrap())
            .collect();
        for (i, &id) in owner_ids.iter().enumerate() {
            assert_eq!(r.is_human(id), is_human[i], "isHuman({id})");
            assert_eq!(r.is_me(id), is_me[i], "isMe({id})");
        }
        // Jedno zrodlo prawdy o graczu: przy jednym fotelu czlowieka oba pytania daja ten sam wynik.
        if human_ids.len() == 1 {
            for &id in &owner_ids {
                assert_eq!(
                    r.is_human(id),
                    r.is_me(id),
                    "rozjazd isHuman/isMe przy jednym fotelu, id {id}"
                );
            }
        }
    }
}

#[test]
fn gate_facts_era_is_integer_as_in_web() {
    // Web empireEpochForOwner zwraca liczbe calkowita (epoka 1..10); port trzyma i64.
    let human = [0_i64];
    let f = gate_facts_for(&roles(0, &human), 0, 3, 1);
    assert_eq!(f.era, 3);
    assert!(f.is_player);
    let ai = gate_facts_for(&roles(0, &human), 2, 7, 0);
    assert!(!ai.is_player);
    assert_eq!(ai.era, 7);
}

const COMPONENT_KEYS: [&str; 12] = [
    "armia",
    "bitwy",
    "ludki",
    "rekruci",
    "miasta",
    "terytorium",
    "infra",
    "tech",
    "ulepszenia",
    "kultura",
    "religia",
    "zdobycze",
];

/// serde_json bez feature `float_roundtrip` nie odtwarza kazdego f64 co do bitu (np. 1713.1000000000001
/// czyta sie jako 1713.1). Porownanie wartosci zmiennoprzecinkowych wektorow wariantow: tolerancja
/// wzgledna 1e-9 (wynik Rust liczy te same operacje IEEE co pin, roznica to wylacznie parsowanie).
fn close(got: f64, expected: f64) -> bool {
    (got - expected).abs() <= 1e-9 * expected.abs().max(1.0)
}

fn static_component_key(s: &str) -> &'static str {
    COMPONENT_KEYS
        .iter()
        .copied()
        .find(|k| *k == s)
        .unwrap_or_else(|| panic!("nieznany klucz skladnika {s}"))
}

#[test]
fn objective_power_variants_match_pinned_compute_objective_power() {
    let root = vec_root();
    let cases = root["objectiveVariants"].as_array().unwrap();
    assert!(cases.len() >= 100, "wektory wariantow musza miec pokrycie");
    let mut saw_flat = false;
    let mut saw_enemy = false;
    let mut saw_zdobycze_military = false;
    let mut saw_half_round = false;
    for case in cases {
        let inp = &case["input"];
        let c = &case["coeff"];
        let coeff = PowerCoeffs {
            jednostka_wojskowa: num(&c["jednostkaWojskowa"]),
            wygrana_bitwa: num(&c["wygranaBitwa"]),
            ludek: num(&c["ludek"]),
            rekrut_ekw_jednostki: num(&c["rekrutEkwJednostki"]),
            miasto: num(&c["miasto"]),
            heks_terytorium: num(&c["heksTerytorium"]),
            budynki: num(&c["budynki"]),
            tech_zbadane: num(&c["techZbadane"]),
            ulepszenie_terenu: num(&c["ulepszenieTerenu"]),
            kultura_imperium: num(&c["kulturaImperium"]),
            religia_jednosc: num(&c["religiaJednosc"]),
        };
        let battle = match case["battle"].as_str().unwrap() {
            "flat_count" => {
                saw_flat = true;
                BattlePowerModel::FlatCount
            }
            "enemy_m_sum" => {
                saw_enemy = true;
                BattlePowerModel::EnemyMSum
            }
            other => panic!("nieznany model bitwy {other}"),
        };
        let military: BTreeSet<&'static str> = case["militaryKeys"]
            .as_array()
            .unwrap()
            .iter()
            .map(|k| static_component_key(k.as_str().unwrap()))
            .collect();
        if military.contains("zdobycze") {
            saw_zdobycze_military = true;
        }
        let raw = ObjectivePowerRaw {
            owner_id: inp["ownerId"].as_i64().unwrap(),
            epoka: num(&inp["epoka"]),
            jednostki: num(&inp["jednostki"]),
            wygrane_bitwy: num(&inp["wygraneBitwy"]),
            bitwy_pkt_sum: inp.get("bitwyPktSum").and_then(opt_num),
            suma_ludkow: num(&inp["sumaLudkow"]),
            rekrut_ekw: num(&inp["rekrutEkw"]),
            miasta: num(&inp["miasta"]),
            heksy_terytorium: num(&inp["heksyTerytorium"]),
            budynki: num(&inp["budynki"]),
            tech_zbadane: num(&inp["techZbadane"]),
            ulepszenia_terenu: num(&inp["ulepszeniaTerenu"]),
            kultura_imperium: inp.get("kulturaImperium").and_then(opt_num),
            miasta_jednosc_religii: inp.get("miastaJednoscReligii").and_then(opt_num),
            zdobycze_power: inp.get("zdobyczePower").and_then(opt_num),
        };
        let got = compute_objective_power(&raw, &coeff, battle, &military);
        let expected_power = num(&case["power"]);
        if got.power_base.fract() == 0.5 {
            saw_half_round = true;
        }
        assert_eq!(got.power, expected_power, "power, wejscie {inp}");
        assert!(
            close(got.power_base, num(&case["powerBase"])),
            "powerBase, wejscie {inp}"
        );
        assert_eq!(
            objective_power_for_owner(&raw, &coeff, battle, &military),
            expected_power,
            "objective_power_for_owner, wejscie {inp}"
        );
        let comps = case["components"].as_array().unwrap();
        assert_eq!(got.components.len(), comps.len());
        for (g, e) in got.components.iter().zip(comps) {
            assert_eq!(g.key, e["key"].as_str().unwrap());
            assert!(
                close(g.raw_count, num(&e["rawCount"])),
                "rawCount {}",
                g.key
            );
            assert!(
                close(g.coefficient, num(&e["coefficient"])),
                "coefficient {}",
                g.key
            );
            assert!(close(g.points, num(&e["points"])), "points {}", g.key);
            assert_eq!(
                g.military,
                e["military"].as_bool().unwrap(),
                "military {}",
                g.key
            );
        }
    }
    assert!(saw_flat && saw_enemy, "pokrycie obu modeli bitwy");
    assert!(saw_zdobycze_military, "pokrycie zdobycze w militaryKeys");
    assert!(saw_half_round, "pokrycie polowek dla Math.round");
}
