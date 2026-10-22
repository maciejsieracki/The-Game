//! D-MOD-9 = A "one unit = one model" (`P4-7-NEW-MODELS-SPEC.md` §4.2) and the
//! 1:1 port of the legacy web routing, checked against the web run
//! (`tests/fixtures/unit_core/unit_core.json`, `records` / `names` /
//! `namedSigs`: `buildUnitModel(categoryOf(PL), owner, PL|EN)` signatures of
//! all 75 `units.json` rows + 2 civilians).

#[path = "unit_core_json.rs"]
mod json;

use civ_renderer::models::unit_core::registry::{build_base, pending};
use civ_renderer::models::unit_core::routing::{
    culture_from_name, model_for_or_category, named_rule, norm_name, UNIT_MODEL_TABLE,
};
use civ_renderer::models::unit_core::{
    build_model, legacy_route, model_for, Base, ModelId, Package, UnitTypeId,
};
use json::{fixture, J};
use std::collections::{BTreeMap, BTreeSet};

const OWNER_A: u32 = 0x00d0_3030;

struct Rec {
    pl: String,
    en: Option<String>,
    category: String,
    sig_pl: u32,
    sig_en: Option<u32>,
    j: J,
}

fn records() -> Vec<Rec> {
    fixture()
        .at("records")
        .arr()
        .iter()
        .map(|r| Rec {
            pl: r.at("pl").s().to_owned(),
            en: if r.at("en").is_null() {
                None
            } else {
                Some(r.at("en").s().to_owned())
            },
            category: r.at("category").s().to_owned(),
            sig_pl: r.at("sigPl").at("sig").u(),
            sig_en: if r.at("sigEn").is_null() {
                None
            } else {
                Some(r.at("sigEn").at("sig").u())
            },
            j: r.clone(),
        })
        .collect()
}

#[test]
fn rule_table_covers_exactly_the_77_unit_types() {
    let recs = records();
    assert_eq!(recs.len(), 77);
    let web: BTreeSet<&str> = recs.iter().map(|r| r.pl.as_str()).collect();
    let table: BTreeSet<&str> = UNIT_MODEL_TABLE.iter().map(|(n, _)| *n).collect();
    assert_eq!(web, table, "table keys = units.json Jednostka + civilians");
    let bases: BTreeSet<Base> = UNIT_MODEL_TABLE.iter().map(|&(_, b)| b).collect();
    assert_eq!(bases.len(), 77, "every unit type has its own model");
    // the 11 gallery-only models of P4-7 §4.1 are not reachable from data
    for b in [
        Base::CeltWarrior,
        Base::Crossbowman,
        Base::GermanWarrior,
        Base::HierosLochos,
        Base::LegionRzymski,
        Base::HastatiOld,
        Base::BerserkerOld,
        Base::P1WojownikKamien,
        Base::P1Oszczepnik,
        Base::P1Lucznik,
        Base::P1Zwiadowca,
    ] {
        assert!(!bases.contains(&b), "{b:?} must stay gallery-only");
    }
    // per package (P4-4 §4.2: 4 / 10 / 37 / 24 records + 2 civilians in MOD-04)
    let mut per: BTreeMap<String, usize> = BTreeMap::new();
    for (_, b) in UNIT_MODEL_TABLE {
        *per.entry(format!("{:?}", b.package())).or_default() += 1;
    }
    assert_eq!(per.get("Mod04Core"), Some(&6));
    assert_eq!(per.get("Mod05Stone"), Some(&10));
    assert_eq!(per.get("Mod06Bronze"), Some(&37));
    assert_eq!(per.get("Mod07Iron"), Some(&24));
}

#[test]
fn table_equals_the_legacy_pl_route_and_names_never_matter() {
    for r in records() {
        let id = UnitTypeId::new(r.pl.clone());
        let rule = model_for(&id).expect("row");
        assert_eq!(
            rule,
            legacy_route(&r.category, Some(&r.pl)),
            "{}: table vs web PL path",
            r.pl
        );
        // every consumer gets the same id; there is no EN → type mapping
        if let Some(en) = &r.en {
            assert!(
                model_for(&UnitTypeId::new(en.clone())).is_none() || en == &r.pl,
                "{en}: EN name resolved"
            );
        }
    }
}

#[test]
fn legacy_en_path_reproduces_exactly_the_three_web_divergences() {
    let mut diverging = Vec::new();
    for r in records() {
        let (Some(en), Some(sig_en)) = (&r.en, r.sig_en) else {
            continue;
        };
        let pl_id = legacy_route(&r.category, Some(&r.pl));
        let en_id = legacy_route(&r.category, Some(en));
        assert_eq!(
            pl_id != en_id,
            sig_en != r.sig_pl,
            "{} / {en}: route split must match web",
            r.pl
        );
        if pl_id != en_id {
            diverging.push((r.pl.clone(), en_id.base));
        }
    }
    diverging.sort();
    assert_eq!(
        diverging,
        vec![
            ("Stra\u{17c}nik bram Harappy".to_owned(), Base::P1Wlocznik),
            ("Wojownik z toporem".to_owned(), Base::CatTopor),
            (
                "Wojownik z \u{17c}elaznym khopesh".to_owned(),
                Base::KhopeshWarrior
            ),
        ]
    );
}

#[test]
fn web_signature_classes_equal_rust_model_id_classes() {
    // (route, web signature) for every PL and EN call
    let mut calls: Vec<(ModelId, u32, String)> = Vec::new();
    for r in records() {
        calls.push((
            legacy_route(&r.category, Some(&r.pl)),
            r.sig_pl,
            r.pl.clone(),
        ));
        if let (Some(en), Some(s)) = (&r.en, r.sig_en) {
            calls.push((legacy_route(&r.category, Some(en)), s, en.clone()));
        }
    }
    let n_records = calls.len();
    // buildUnitModel('super', owner, name) for the whitelist / culture probes
    for v in fixture().at("superSigs").arr() {
        let name = v.at("name").s();
        calls.push((
            legacy_route("super", Some(name)),
            v.at("sig").at("sig").u(),
            format!("super:{name}"),
        ));
    }
    for a in &calls {
        for b in &calls {
            assert_eq!(
                a.0 == b.0,
                a.1 == b.1,
                "{} vs {}: id {:?}/{:?} sig {}/{}",
                a.2,
                b.2,
                a.0,
                b.0,
                a.1,
                b.1
            );
        }
    }
    // where the builder is ported, the signature itself must match
    let mut compared = 0;
    let mut compared_records = 0;
    for (k, (id, sig, name)) in calls.iter().enumerate() {
        if let Ok(m) = build_model(*id, OWNER_A) {
            assert_eq!(m.signature().sig, *sig, "{name}: rust signature");
            compared += 1;
            if k < n_records {
                compared_records += 1;
            }
        }
    }
    println!(
        "model rule: {} calls ({n_records} records PL+EN), {compared} ported signatures compared",
        calls.len()
    );
    // Galera, 3 chariots, 2 civilians (PL) + Galley/3 chariots EN + Axe Warrior→topor
    // + Harappan Gate Guard→p1 wlocznik = 12, + the 10 MOD-05 Stone records PL and EN
    // (R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1) = 32, + 73 PL/EN record calls whose
    // route lands on a MOD-06 Bronze builder (R-RUSTPORT-P4-23-MOD06-UNITS-BRONZE-Q1)
    // = 105, + 47 PL/EN record calls whose route lands on a MOD-07 Iron builder
    // (R-RUSTPORT-P4-26-MOD07-UNITS-IRON-Q1) = 152, i.e. every record call
    assert_eq!(compared_records, 152);
    assert!(
        compared > compared_records,
        "super probes must reach ported builders too"
    );
}

#[test]
fn norm_name_and_culture_match_the_web() {
    let fx = fixture();
    let mut n = 0;
    for r in records() {
        assert_eq!(norm_name(&r.pl), r.j.at("normPl").s(), "normName {}", r.pl);
        assert_eq!(
            culture_from_name(Some(&r.pl)).label(),
            r.j.at("culturePl").s(),
            "culture {}",
            r.pl
        );
        n += 2;
        if let Some(en) = &r.en {
            assert_eq!(norm_name(en), r.j.at("normEn").s(), "normName {en}");
            assert_eq!(
                culture_from_name(Some(en)).label(),
                r.j.at("cultureEn").s(),
                "culture {en}"
            );
            n += 2;
        }
    }
    for v in fx.at("names").arr() {
        let name = v.at("name").s();
        assert_eq!(norm_name(name), v.at("norm").s(), "normName {name:?}");
        assert_eq!(
            culture_from_name(Some(name)).label(),
            v.at("culture").s(),
            "culture {name:?}"
        );
        n += 2;
    }
    // buildNamedUnit: same hit/miss as the web, same geometry where ported
    for v in fx.at("namedSigs").arr() {
        let name = v.at("name").s();
        let rule = named_rule(&norm_name(name));
        assert_eq!(
            rule.is_some(),
            !v.at("sig").is_null(),
            "buildNamedUnit({name:?}) hit/miss: {rule:?}"
        );
        if let (Some(b), false) = (rule, v.at("sig").is_null()) {
            if let Ok(m) = build_base(b, OWNER_A) {
                assert_eq!(m.signature().sig, v.at("sig").at("sig").u(), "{name}");
            }
        }
        n += 1;
    }
    println!("names: {n} web values checked");
}

#[test]
fn unknown_type_falls_back_to_category_with_a_warning() {
    let (id, warn) = model_for_or_category(&UnitTypeId::new("Przysz\u{142}y rekord"), "topor");
    assert_eq!(id, ModelId::of(Base::CatTopor));
    let w = warn.expect("warning");
    assert_eq!(w.unit_type.as_str(), "Przysz\u{142}y rekord");
    let (id, warn) = model_for_or_category(&UnitTypeId::new("Galera"), "topor");
    assert_eq!(id, ModelId::of(Base::Galera));
    assert!(warn.is_none());
}

#[test]
fn pending_registry_is_explicit() {
    let p = pending();
    assert!(p.iter().all(|b| b.package() != Package::Mod04Core));
    for b in &p {
        let e = build_base(*b, OWNER_A).expect_err("stub");
        assert_eq!(e.base, *b);
    }
    for b in Base::ALL
        .iter()
        .filter(|b| b.package() == Package::Mod04Core)
    {
        assert!(build_base(*b, OWNER_A).is_ok(), "{b:?} must build");
    }
    println!("pending builders: {}", p.len());
}
