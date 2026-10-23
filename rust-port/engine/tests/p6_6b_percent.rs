//! P6.6B - `game/cities.ts`: stale, procenty Pracy/Handlu, polityka auto-ulepszen, priorytety budowy.
//! Wektory z URUCHOMIONEGO weba (pin edb8fb56), porownanie BITOWE f64; oczekiwania wylacznie z
//! `tests/p6_6b_vectors/percent.json`. Testy ksztaltu tabel (bez pinow wartosci) sa w `p6_6b_tables.rs`.

#[path = "p6_6b_vectors/common.rs"]
mod common;

use civ_engine::domain::terrain::city_founding::p6_6b::cities::{
    adjust_handel_split, ai_fixed_procent_budynki, ai_fixed_procent_nauki,
    ai_major_ulepszenia_praca_percent, budowa_typ_focus, clamp_podzial_pracy_budynki_percent,
    clamp_ulepszenia_praca_percent, compute_ai_improvement_budget_cap,
    compute_ai_improvement_budget_cap_for_owner, default_budowa_focus,
    default_budowa_priorytet_typow, default_budowa_tryb, default_okolica_focus,
    default_okolica_tryb, default_podzial_handlu, default_podzial_pracy, default_poziom_racji,
    default_procent_rozwoj, default_procent_rozwoj_wyzywienie, default_ulepszenia_focus,
    default_ulepszenia_only_worked, default_ulepszenia_praca_percent, default_ulepszenia_tryb,
    default_ulepszenia_wolno_wycinac_las, empty_budowa_lista_biblioteka,
    fresh_ulepszenia_empire_policy, fresh_ulepszenia_empire_policy_for_owner, fresh_wealth_state,
    handel_pct_step, is_auto_budowa_tryb, is_budowa_typ_focus, max_podzial_pracy_budynki_percent,
    max_procent_nauki, max_procent_puli_imperium, max_ulepszenia_praca_auto_percent,
    migrate_ulepszenia_per_turn_to_percent, min_city_distance, min_city_distance_start_city_state,
    min_podzial_pracy_budynki_percent, min_procent_puli_imperium,
    min_procent_puli_imperium_zasada3_nadwyzka, normalize_podzial_handlu, podzial_pracy_pula_lbl,
    podzial_pracy_pula_lbl_pelna, podzial_pracy_pula_tip, podzial_pracy_z_procentu_puli,
    procent_puli_imperium_z_budynkow, resolve_effective_ulepszenia,
    resolve_ulepszenia_praca_percent_from_raw, sanitize_budowa_priorytet_typow, snap_handel_pct,
    wyzywienie_max, BudowaFocus, BudowaTryb, City, HandelKey, UlepszeniaEmpirePolicy,
    UlepszeniaFocus, UlepszeniaTryb,
};
use common::*;
use serde_json::{json, Value};

fn data() -> Value {
    load("percent.json")
}

fn opt_num(v: &Value) -> Option<f64> {
    js_num(v)
}

fn focus_list(v: &Value) -> Vec<BudowaFocus> {
    strings(v)
        .iter()
        .map(|s| BudowaFocus::from_web(s).expect("budowa focus"))
        .collect()
}

#[test]
fn constants_match_running_web() {
    let d = data();
    let c = &d["constants"];
    assert_eq!(
        default_okolica_focus().web_value(),
        text(&c["okolicaFocus"])
    );
    assert_eq!(default_okolica_tryb().web_value(), text(&c["okolicaTryb"]));
    assert_eq!(default_budowa_focus().web_value(), text(&c["budowaFocus"]));
    assert_eq!(default_budowa_tryb().web_value(), text(&c["budowaTryb"]));
    assert_eq!(
        default_ulepszenia_focus().web_value(),
        text(&c["ulepszeniaFocus"])
    );
    assert_eq!(
        default_ulepszenia_tryb().web_value(),
        text(&c["ulepszeniaTryb"])
    );
    assert_eq!(
        default_ulepszenia_only_worked(),
        c["ulepszeniaOnlyWorked"].as_bool().expect("bool")
    );
    assert_eq!(
        default_ulepszenia_wolno_wycinac_las(),
        c["ulepszeniaWolnoWycinacLas"].as_bool().expect("bool")
    );
    let numbers: [(&str, f64, &str); 18] = [
        (
            "praca%",
            default_ulepszenia_praca_percent(),
            "ulepszeniaPracaPercent",
        ),
        (
            "ai major",
            ai_major_ulepszenia_praca_percent(),
            "aiMajorUlepszeniaPracaPercent",
        ),
        (
            "max auto",
            max_ulepszenia_praca_auto_percent(),
            "maxUlepszeniaPracaAutoPercent",
        ),
        (
            "min budynki",
            min_podzial_pracy_budynki_percent(),
            "minPodzialPracyBudynki",
        ),
        (
            "max budynki",
            max_podzial_pracy_budynki_percent(),
            "maxPodzialPracyBudynki",
        ),
        (
            "ai budynki",
            ai_fixed_procent_budynki(),
            "aiFixedProcentBudynki",
        ),
        (
            "max pula",
            max_procent_puli_imperium(),
            "maxProcentPuliImperium",
        ),
        (
            "zasada3",
            min_procent_puli_imperium_zasada3_nadwyzka(),
            "minProcentPuliZasada3",
        ),
        (
            "min pula",
            min_procent_puli_imperium(),
            "minProcentPuliImperium",
        ),
        ("rozwoj", default_procent_rozwoj(), "procentRozwoj"),
        (
            "rozwoj wyz",
            default_procent_rozwoj_wyzywienie(),
            "procentRozwojWyzywienie",
        ),
        ("krok", handel_pct_step(), "handelPctStep"),
        ("max nauka", max_procent_nauki(), "maxProcentNauka"),
        ("ai nauka", ai_fixed_procent_nauki(), "aiFixedProcentNauka"),
        ("dystans", min_city_distance(), "minCityDistance"),
        (
            "dystans mp",
            min_city_distance_start_city_state(),
            "minCityDistanceStartCityState",
        ),
        ("poziom racji", default_poziom_racji(), "defaultPoziomRacji"),
        ("wyz max", wyzywienie_max(), "wyzywienieMax"),
    ];
    for (label, got, key) in numbers {
        assert_bits(label, got, num(&c[key]));
    }
    assert_eq!(
        default_budowa_priorytet_typow(),
        focus_list(&c["budowaPriorytetTypow"])
    );
    assert_eq!(budowa_typ_focus(), focus_list(&c["budowaTypFocus"]));
    let h = default_podzial_handlu();
    assert_values("podzial handlu", &handel_value(&h), &c["podzialHandlu"]);
    let p = default_podzial_pracy();
    assert_values("podzial pracy", &podzial_value(&p), &c["podzialPracy"]);
    assert_eq!(podzial_pracy_pula_lbl(), text(&c["lblPula"]));
    assert_eq!(podzial_pracy_pula_lbl_pelna(), text(&c["lblPulaPelna"]));
    assert_eq!(podzial_pracy_pula_tip(), text(&c["tipPula"]));
    assert!(empty_budowa_lista_biblioteka().is_empty());
    assert!(c["emptyBiblioteka"].as_array().expect("arr").is_empty());
    let w = fresh_wealth_state();
    assert_bits("wealth.poziom", w.poziom, num(&c["freshWealth"]["poziom"]));
    assert_bits("wealth.pula", w.pula, num(&c["freshWealth"]["pula"]));
}

#[test]
fn clamp_functions_match_web() {
    let d = data();
    for (key, f) in [
        (
            "clampUlepszenia",
            clamp_ulepszenia_praca_percent as fn(Option<f64>) -> f64,
        ),
        ("clampPodzial", clamp_podzial_pracy_budynki_percent),
        ("pulaZBudynkow", procent_puli_imperium_z_budynkow),
    ] {
        let rows = arr(&d, key);
        assert!(rows.len() >= 30, "{key}");
        for (i, row) in rows.iter().enumerate() {
            assert_bits(
                &format!("{key}[{i}]"),
                f(opt_num(&row["n"])),
                num(&row["out"]),
            );
        }
    }
}

#[test]
fn podzial_pracy_z_procentu_puli_matches_web() {
    let d = data();
    let rows = arr(&d, "podzialZPuli");
    assert!(rows.len() >= 30);
    for (i, row) in rows.iter().enumerate() {
        let got = podzial_pracy_z_procentu_puli(opt_num(&row["n"]));
        assert_values(
            &format!("podzialZPuli[{i}]"),
            &podzial_value(&got),
            &row["out"],
        );
    }
}

#[test]
fn snap_and_migrate_match_web() {
    let d = data();
    for (i, row) in arr(&d, "snap").iter().enumerate() {
        assert_bits(
            &format!("snap[{i}]"),
            snap_handel_pct(num(&row["n"])),
            num(&row["out"]),
        );
    }
    let rows = arr(&d, "migratePerTurn");
    assert!(rows.len() >= 5);
    for (i, row) in rows.iter().enumerate() {
        assert_bits(
            &format!("migrate[{i}]"),
            migrate_ulepszenia_per_turn_to_percent(num(&row["n"])),
            num(&row["out"]),
        );
    }
}

#[test]
fn resolve_praca_percent_from_raw_matches_web() {
    let d = data();
    let rows = arr(&d, "resolveRaw");
    assert!(rows.len() >= 100);
    for (i, row) in rows.iter().enumerate() {
        let got = resolve_ulepszenia_praca_percent_from_raw(
            opt_num(&row["newVal"]),
            opt_num(&row["legacy"]),
        );
        assert_bits(&format!("resolveRaw[{i}]"), got, num(&row["out"]));
    }
}

#[test]
fn normalize_podzial_handlu_matches_web() {
    let d = data();
    let rows = arr(&d, "normalize");
    assert!(rows.len() >= 200);
    for (i, row) in rows.iter().enumerate() {
        let got = normalize_podzial_handlu(&handel(&row["split"]));
        assert_values(&format!("normalize[{i}]"), &handel_value(&got), &row["out"]);
    }
}

#[test]
fn adjust_handel_split_matches_web() {
    let d = data();
    let rows = arr(&d, "adjust");
    assert!(rows.len() >= 2000, "wektor adjust: {}", rows.len());
    let mut at_cap = 0;
    for (i, row) in rows.iter().enumerate() {
        let key = match row["key"].as_str().expect("key") {
            "procentPieniadz" => HandelKey::Pieniadz,
            "procentNauka" => HandelKey::Nauka,
            "procentLuksus" => HandelKey::Luksus,
            other => panic!("klucz {other}"),
        };
        let got = adjust_handel_split(&handel(&row["split"]), key, num(&row["newVal"]));
        assert_values(&format!("adjust[{i}]"), &handel_value(&got), &row["out"]);
        if got.procent_nauka == max_procent_nauki() {
            at_cap += 1;
        }
    }
    assert!(at_cap >= 100, "wektor musi pokrywac cap Nauki: {at_cap}");
}

fn policy_value(p: &UlepszeniaEmpirePolicy) -> Value {
    let mut v = json!({
        "focus": p.focus.web_value(),
        "tryb": p.tryb.web_value(),
        "onlyWorked": p.only_worked,
        "pracaAutoPercent": enc(p.praca_auto_percent),
    });
    if let Some(w) = p.wolno_wycinac_las {
        v["wolnoWycinacLas"] = json!(w);
    }
    v
}

#[test]
fn ulepszenia_policy_and_caps_match_web() {
    let d = data();
    let pol = &d["policy"];
    assert_values(
        "fresh policy",
        &policy_value(&fresh_ulepszenia_empire_policy()),
        &pol["fresh"],
    );
    let rows = arr(pol, "forOwner");
    assert!(rows.len() >= 25);
    for (i, row) in rows.iter().enumerate() {
        let ai = ids(&row["ai"]);
        let owner = row["ownerId"].as_i64().expect("ownerId");
        let got = fresh_ulepszenia_empire_policy_for_owner(owner, &|id| ai.contains(&id));
        assert_values(&format!("forOwner[{i}]"), &policy_value(&got), &row["out"]);
    }
    let rows = arr(pol, "cap");
    assert!(rows.len() >= 100);
    for (i, row) in rows.iter().enumerate() {
        let got = compute_ai_improvement_budget_cap(num(&row["pool"]), num(&row["percent"]));
        assert_bits(&format!("cap[{i}]"), got, num(&row["out"]));
    }
    let rows = arr(pol, "capForOwner");
    assert!(rows.len() >= 40);
    for (i, row) in rows.iter().enumerate() {
        let ai = ids(&row["ai"]);
        let got = compute_ai_improvement_budget_cap_for_owner(
            row["ownerId"].as_i64().expect("ownerId"),
            num(&row["pool"]),
            &|id| ai.contains(&id),
        );
        assert_bits(&format!("capForOwner[{i}]"), got, num(&row["out"]));
    }
}

#[test]
fn resolve_effective_ulepszenia_matches_web() {
    let d = data();
    let rows = arr(&d, "effective");
    assert!(rows.len() >= 400);
    let mut overrides = 0;
    for (i, row) in rows.iter().enumerate() {
        let c = &row["city"];
        let city = City {
            ulepszenia_override: opt_bool(&c["ulepszeniaOverride"]),
            ulepszenia_focus: opt_text(&c["ulepszeniaFocus"])
                .map(|s| UlepszeniaFocus::from_web(&s).expect("focus")),
            ulepszenia_tryb: opt_text(&c["ulepszeniaTryb"])
                .map(|s| UlepszeniaTryb::from_web(&s).expect("tryb")),
            ulepszenia_only_worked: opt_bool(&c["ulepszeniaOnlyWorked"]),
            ulepszenia_wolno_wycinac_las: opt_bool(&c["ulepszeniaWolnoWycinacLas"]),
            ulepszenia_praca_percent: js_num(&c["ulepszeniaPracaPercent"]),
            ..City::default()
        };
        let e = &row["empire"];
        let empire = UlepszeniaEmpirePolicy {
            focus: UlepszeniaFocus::from_web(e["focus"].as_str().expect("focus")).expect("focus"),
            tryb: UlepszeniaTryb::from_web(e["tryb"].as_str().expect("tryb")).expect("tryb"),
            only_worked: e["onlyWorked"].as_bool().expect("bool"),
            praca_auto_percent: num(&e["pracaAutoPercent"]),
            wolno_wycinac_las: opt_bool(&e["wolnoWycinacLas"]),
        };
        let got = resolve_effective_ulepszenia(&city, &empire);
        let o = &row["out"];
        assert_eq!(
            got.focus.web_value(),
            text(&o["focus"]),
            "effective[{i}] focus"
        );
        assert_eq!(
            got.tryb.web_value(),
            text(&o["tryb"]),
            "effective[{i}] tryb"
        );
        assert_eq!(
            got.only_worked,
            o["onlyWorked"].as_bool().expect("b"),
            "effective[{i}] only"
        );
        assert_bits(
            &format!("effective[{i}] pracaAutoPercent"),
            got.praca_auto_percent,
            num(&o["pracaAutoPercent"]),
        );
        assert_eq!(
            got.wolno_wycinac_las,
            o["wolnoWycinacLas"].as_bool().expect("b"),
            "effective[{i}] wolno"
        );
        assert_eq!(
            got.is_override,
            o["override"].as_bool().expect("b"),
            "effective[{i}] override"
        );
        if got.is_override {
            overrides += 1;
        }
    }
    assert!(overrides >= 50 && overrides < rows.len());
}

#[test]
fn budowa_priority_helpers_match_web() {
    let d = data();
    let b = &d["budowa"];
    for (i, row) in arr(b, "isTyp").iter().enumerate() {
        let f = BudowaFocus::from_web(row["f"].as_str().expect("f")).expect("focus");
        assert_eq!(
            is_budowa_typ_focus(f),
            row["out"].as_bool().expect("out"),
            "isTyp[{i}]"
        );
    }
    let rows = arr(b, "sanitize");
    assert!(rows.len() >= 100);
    for (i, row) in rows.iter().enumerate() {
        let list = (!row["list"].is_null()).then(|| focus_list(&row["list"]));
        let got = sanitize_budowa_priorytet_typow(list.as_deref());
        let want: Vec<String> = strings(&row["out"]);
        let got_s: Vec<&str> = got.iter().map(|f| f.web_value()).collect();
        assert_eq!(got_s, want, "sanitize[{i}]");
    }
    for (i, row) in arr(b, "isAuto").iter().enumerate() {
        let t = opt_text(&row["t"]).map(|s| BudowaTryb::from_web(&s).expect("tryb"));
        assert_eq!(
            is_auto_budowa_tryb(t),
            row["out"].as_bool().expect("out"),
            "isAuto[{i}]"
        );
    }
}
