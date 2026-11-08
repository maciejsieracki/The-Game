//! R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1: zgodność `ai_peace_city_offer` z URUCHOMIONYM webem
//! (origin/main `gra/src/game/ai.ts`, `decideAIDiplomacy` + `aiPickMiastoDoOddania` / `aiPickMiastoDoZadania`).
//! Wektory: `tests/p6_ai_peace_city_offer_data/vectors.json`, generator (bundle TS przez esbuild, Node 22):
//! `dyspozycje/autobot/runs/R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1/gen-city-offer.ts`.
//! Pokrycie: stałe przeliczone przez web (`aiMiastoPrzekazRwProg`, `aiMiastoWagaOddawanego`), wybór miasta
//! (granice cena/waga N-1/N/N+1, minMiast 2/3, zakazane, remis), żądanie miasta (próg 500 PW), oraz pełny blok
//! N1a/N1b przez `decideAIDiplomacy` (2600 losowych, deterministycznych przypadków z siatki granic).

use civ_engine::domain::ai_peace_city_offer::{
    ai_miasto_przekaz_rw_prog, ai_miasto_waga_oddawanego, decide_city_offer,
    pick_miasto_do_oddania, pick_miasto_do_zadania, CityOfferCommand, CityOfferCtx, CityOfferRel,
    MiastoWycena, PickOddaniaOpcje,
};
use civ_engine::domain::diplomacy_war_peace_profile::{
    resolve_war_peace_profile, war_peace_params,
};
use serde_json::Value;

const DATA: &str = include_str!("p6_ai_peace_city_offer_data/vectors.json");

fn opt_f64(v: Option<&Value>) -> Option<f64> {
    v.and_then(|x| x.as_f64())
}

fn str_of(v: &Value) -> &str {
    v.as_str().expect("napis oczekiwany")
}

fn city(v: &Value) -> MiastoWycena {
    MiastoWycena {
        city_id: str_of(&v["cityId"]).to_string(),
        city_pn: v["cityPn"].as_f64().expect("cityPn"),
        zakazane: v["zakazane"].as_bool().unwrap_or(false),
    }
}

fn cities(v: &Value) -> Vec<MiastoWycena> {
    v.as_array()
        .expect("tablica miast")
        .iter()
        .map(city)
        .collect()
}

fn out_id(v: &Value) -> Option<&str> {
    v.as_str()
}

#[test]
fn wektory_zaladowane_i_nie_puste() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    assert!(v["pure"]["rwProg"].as_array().unwrap().len() >= 10);
    assert!(v["pure"]["waga"].as_array().unwrap().len() >= 10);
    assert!(v["pure"]["pickOddania"].as_array().unwrap().len() >= 100);
    assert!(v["pure"]["pickZadania"].as_array().unwrap().len() >= 5);
    let d = v["decide"].as_array().unwrap();
    assert!(d.len() >= 2000);
    let oferuj = d.iter().filter(|c| c["out"]["kind"] == "oferuj").count();
    let zada = d.iter().filter(|c| c["out"]["kind"] == "zada").count();
    let brak = d.iter().filter(|c| c["out"].is_null()).count();
    assert!(oferuj >= 100, "za mało przypadków oferuj: {oferuj}");
    assert!(zada >= 100, "za mało przypadków zada: {zada}");
    assert!(brak >= 100, "za mało przypadków bez komendy: {brak}");
    // r2: negatywne bramki (brak wojny, partner != '0') i konkretne cywilizacje muszą być w wektorach.
    let bez_wojny = d.iter().filter(|c| c["in"]["stanWojny"] == false).count();
    let nie_gracz = d.iter().filter(|c| c["in"]["partnerId"] != "0").count();
    let z_civ = d.iter().filter(|c| c["in"]["civ"].is_string()).count();
    assert!(
        bez_wojny >= 100,
        "za mało przypadków bez wojny: {bez_wojny}"
    );
    assert!(
        nie_gracz >= 100,
        "za mało przypadków partner != gracz: {nie_gracz}"
    );
    assert!(
        z_civ >= 1000,
        "za mało przypadków z myTypCywilizacji: {z_civ}"
    );
}

#[test]
fn profil_wojny_per_cywilizacja_zgodny_z_webem() {
    // r2 (notatka Evaluatora 1): gałąź min_tur_wojny per cywilizacja weryfikowana wprost z webem,
    // niezależnie od bloku decideAIDiplomacy (web resolveWarPeaceProfile, 17 kluczy).
    let v: Value = serde_json::from_str(DATA).expect("json");
    let p = war_peace_params();
    let profile = v["pure"]["profil"].as_array().unwrap();
    assert!(profile.len() >= 17, "za mało profili: {}", profile.len());
    let mut min_tur_rozne = std::collections::BTreeSet::new();
    for item in profile {
        let civ = if item["civ"].is_null() {
            None
        } else {
            Some(str_of(&item["civ"]))
        };
        let got = resolve_war_peace_profile(civ, p);
        let exp = &item["profile"];
        // Liczby w wektorach są napisami (String(x) w JS): str::parse daje dokładnie tę samą wartość f64.
        let f = |k: &str| {
            exp[k]
                .as_str()
                .unwrap_or_else(|| panic!("pole {k}: {item}"))
                .parse::<f64>()
                .expect("liczba")
        };
        assert_eq!(
            got.has_data,
            exp["hasData"].as_bool().unwrap(),
            "hasData {item}"
        );
        assert_eq!(
            got.profil_obronny,
            exp["profilObronny"].as_bool().unwrap(),
            "profilObronny {item}"
        );
        assert_eq!(got.agresywnosc, f("agresywnosc"), "agresywnosc {item}");
        assert_eq!(
            got.ekspansywnosc,
            f("ekspansywnosc"),
            "ekspansywnosc {item}"
        );
        assert_eq!(
            got.sklonnosc_podboju,
            f("sklonnoscPodboju"),
            "sklonnoscPodboju {item}"
        );
        assert_eq!(
            got.tolerancja_ryzyka,
            f("tolerancjaRyzyka"),
            "tolerancjaRyzyka {item}"
        );
        assert_eq!(
            got.prog_wojny_macierz,
            f("progWojnyMacierz"),
            "progWojnyMacierz {item}"
        );
        assert_eq!(
            got.prog_wojny_relacji,
            f("progWojnyRelacji"),
            "progWojnyRelacji {item}"
        );
        assert_eq!(
            got.prog_pokoj_slabosc,
            f("progPokojSlabosc"),
            "progPokojSlabosc {item}"
        );
        assert_eq!(
            got.prog_krytyczny,
            f("progKrytyczny"),
            "progKrytyczny {item}"
        );
        assert_eq!(got.prog_zdrowia, f("progZdrowia"), "progZdrowia {item}");
        assert_eq!(got.min_tur_wojny, f("minTurWojny"), "minTurWojny {item}");
        assert_eq!(got.zmeczenie_t, f("zmeczenieT"), "zmeczenieT {item}");
        assert_eq!(got.hamulec_n, f("hamulecN"), "hamulecN {item}");
        min_tur_rozne.insert(got.min_tur_wojny as i64);
    }
    assert!(
        min_tur_rozne.len() >= 4,
        "minTurWojny musi różnicować cywilizacje: {min_tur_rozne:?}"
    );
}

#[test]
fn prog_rw_i_waga_zgodne_z_webem() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    for c in v["pure"]["rwProg"].as_array().unwrap() {
        let agr = opt_f64(c.get("agr"));
        let got = ai_miasto_przekaz_rw_prog(agr);
        assert_eq!(got, c["v"].as_f64().unwrap(), "rwProg agr={agr:?}");
    }
    for c in v["pure"]["waga"].as_array().unwrap() {
        let eks = opt_f64(c.get("eks"));
        let got = ai_miasto_waga_oddawanego(eks);
        assert_eq!(got, c["v"].as_f64().unwrap(), "waga eks={eks:?}");
    }
}

#[test]
fn pick_miasto_do_oddania_zgodny_z_webem() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    for c in v["pure"]["pickOddania"].as_array().unwrap() {
        let miasta = cities(&c["miasta"]);
        let opcje = PickOddaniaOpcje {
            min_miast: opt_f64(c.get("minMiast")).map(|x| x as usize),
            cena_pn: opt_f64(c.get("cena")),
        };
        let eks = opt_f64(c.get("eks"));
        let got = pick_miasto_do_oddania(&miasta, eks, opcje).map(|m| m.city_id.as_str());
        assert_eq!(got, out_id(&c["out"]), "pickOddania {c}");
    }
}

#[test]
fn pick_miasto_do_zadania_zgodny_z_webem() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    for c in v["pure"]["pickZadania"].as_array().unwrap() {
        let miasta = cities(&c["miasta"]);
        let got = pick_miasto_do_zadania(&miasta).map(|m| m.city_id.as_str());
        assert_eq!(got, out_id(&c["out"]), "pickZadania {c}");
    }
}

#[test]
fn blok_oferuj_zada_zgodny_z_decide_ai_diplomacy() {
    let v: Value = serde_json::from_str(DATA).expect("json");
    for c in v["decide"].as_array().unwrap() {
        let i = &c["in"];
        let miasta_ai = cities(&i["miastaAI"]);
        let miasta_p = cities(&i["miastaPartnera"]);
        let rel = CityOfferRel {
            partner_id: str_of(&i["partnerId"]),
            rw: i["rw"].as_f64().unwrap(),
            stan_wojny: i["stanWojny"].as_bool().expect("stanWojny"),
            turns_at_war: opt_f64(i.get("turnsAtWar")),
            lost_cities_in_war: opt_f64(i.get("lost")),
            zdobyte_miasta_partnera: opt_f64(i.get("zdobyte")),
            turns_since_city_change: opt_f64(i.get("tsc")),
            is_minor_civ_partner: i["minorPartner"].as_bool().unwrap_or(false),
            miasta_partnera: &miasta_p,
        };
        let ctx = CityOfferCtx {
            my_typ_cywilizacji: i["civ"].as_str(),
            is_minor_civ_self: i["minorSelf"].as_bool().unwrap_or(false),
            agresywnosc_raw: opt_f64(i.get("agr")),
            ekspansywnosc: opt_f64(i.get("eks")),
            miasta_ai: &miasta_ai,
        };
        let got = decide_city_offer(&rel, &ctx);
        let exp = &c["out"];
        match (got, exp.is_null()) {
            (None, true) => {}
            (Some(cmd), false) => match cmd {
                CityOfferCommand::OferujMiastoZaPokoj {
                    target_id,
                    powod,
                    city_id,
                    city_pn,
                    city_weight,
                } => {
                    assert_eq!(exp["kind"], "oferuj", "rodzaj {c}");
                    assert_eq!(target_id, str_of(&i["partnerId"]));
                    assert_eq!(city_id, str_of(&exp["cityId"]), "cityId {c}");
                    assert_eq!(city_pn, exp["cityPn"].as_f64().unwrap(), "cityPn {c}");
                    assert_eq!(city_weight, exp["cityWeight"].as_f64().unwrap(), "waga {c}");
                    assert_eq!(powod, str_of(&exp["powod"]), "powod {c}");
                }
                CityOfferCommand::ZadaMiastoZaPokoj {
                    target_id,
                    powod,
                    city_id,
                    city_pn,
                } => {
                    assert_eq!(exp["kind"], "zada", "rodzaj {c}");
                    assert_eq!(target_id, str_of(&i["partnerId"]));
                    assert_eq!(city_id, str_of(&exp["cityId"]), "cityId {c}");
                    assert_eq!(city_pn, exp["cityPn"].as_f64().unwrap(), "cityPn {c}");
                    assert_eq!(powod, str_of(&exp["powod"]), "powod {c}");
                }
            },
            (got, _) => panic!("rozjazd: rust={got:?} web={exp} wejście={i}"),
        }
    }
}
