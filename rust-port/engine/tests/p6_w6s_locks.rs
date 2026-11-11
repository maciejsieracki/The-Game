//! R-RUSTPORT-P6-W6S-LOCKS-Q1 (W6 wariant A, punkt 1): test behawioralny `resolve_diplomacy_action_lock`
//! na wektorach z PINOWANEGO webu (`07d2fbd72f758705f8e1d59cc4968027ffbafe75`,
//! `gra/src/game/diplomacy-locks.ts`). Wektory: `tests/p6_w6s_locks_vectors/locks.json`,
//! generator `tests/p6_w6s_locks_gen.mjs` (Node 22 + esbuild spoza repo; nie ręcznie).
//!
//! Każdy wiersz: deterministyczny kontekst (ziarno stałe) + oczekiwany wynik z JS.
//! NaN/Infinity jako stringi; pole web nieobecne = brak klucza (None / false) albo `null` w `requirement`.

use civ_engine::domain::diplomacy_locks::{resolve_diplomacy_action_lock, LockCtx, LockResult};
use serde_json::Value;
use std::collections::{BTreeMap, BTreeSet};

const VECTORS: &str = include_str!("p6_w6s_locks_vectors/locks.json");

fn num(v: &Value) -> f64 {
    if let Some(f) = v.as_f64() {
        return f;
    }
    match v
        .as_str()
        .unwrap_or_else(|| panic!("liczba oczekiwana: {v}"))
    {
        "NaN" => f64::NAN,
        "Infinity" => f64::INFINITY,
        "-Infinity" => f64::NEG_INFINITY,
        s => s
            .parse::<f64>()
            .unwrap_or_else(|_| panic!("nie liczba: {s}")),
    }
}

fn opt_num(v: &Value) -> Option<f64> {
    if v.is_null() {
        None
    } else {
        Some(num(v))
    }
}

fn flag(v: &Value) -> bool {
    v.as_bool().unwrap_or(false)
}

fn ctx_of(c: &Value) -> LockCtx {
    let n = |k: &str| num(&c[k]);
    let on = |k: &str| opt_num(&c[k]);
    LockCtx {
        action_id: c["actionId"].as_str().expect("actionId").to_string(),
        at_war: flag(&c["atWar"]),
        rel_total: n("relTotal"),
        zaufanie: n("zaufanie"),
        respekt: n("respekt"),
        has_nap: flag(&c["hasNap"]),
        has_handel: flag(&c["hasHandel"]),
        has_trade_connection: flag(&c["hasTradeConnection"]),
        has_trade_tech_self: c["hasTradeTechSelf"].as_bool(),
        has_trade_tech_other: c["hasTradeTechOther"].as_bool(),
        has_wymiana: flag(&c["hasWymiana"]),
        has_sojusz: flag(&c["hasSojusz"]),
        has_granice: flag(&c["hasGranice"]),
        breaks_treaty_label: c["breaksTreatyLabel"].as_str().map(str::to_string),
        sellable_tech_count: n("sellableTechCount"),
        buyable_tech_count: n("buyableTechCount"),
        known_rivals_count: n("knownRivalsCount"),
        prog_nap_relacja: n("progNapRelacja"),
        prog_nap_zaufanie: on("progNapZaufanie"),
        kara_wspolna_granica: flag(&c["karaWspolnaGranica"]),
        nap_agresor_aktywny: flag(&c["napAgresorAktywny"]),
        prog_handel_relacja: n("progHandelRelacja"),
        prog_sojusz_relacja: n("progSojuszRelacja"),
        prog_sojusz_zaufanie: n("progSojuszZaufanie"),
        prog_granice_relacja: n("progGraniceRelacja"),
        prog_granice_zaufanie: n("progGraniceZaufanie"),
        prog_wymiana_tech_zaufanie: n("progWymianaTechZaufanie"),
        prog_namow_wojne_zaufanie: n("progNamowWojneZaufanie"),
        prog_wasalizacja_respekt: n("progWasalizacjaRespekt"),
        prog_wchloniecie_respekt: on("progWchloniecieRespekt"),
        prog_trybut_zadanie_min_respekt: n("progTrybutZadanieMinRespekt"),
        prog_dar_relacja: n("progDarRelacja"),
        is_city_state_partner: flag(&c["isCityStatePartner"]),
        has_wasal: flag(&c["hasWasal"]),
        wasal_age_turns: on("wasalAgeTurns"),
        gracz_wchloniecie_po_wasalu_tur: on("graczWchlonieciePoWasaluTur"),
    }
}

fn same_f64(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn rows() -> Vec<Value> {
    let rows: Vec<Value> = serde_json::from_str(VECTORS).expect("locks.json");
    assert!(rows.len() >= 3000, "za mało wektorów: {}", rows.len());
    rows
}

/// Każdy wiersz: zgodność pełnego wyniku (locked / note / active / requirement) z webem.
#[test]
fn resolve_diplomacy_action_lock_matches_pinned_web_vectors() {
    for (i, row) in rows().iter().enumerate() {
        let ctx_json = &row["ctx"];
        let want = &row["want"];
        let label = format!("wiersz {i} akcja {}", ctx_json["actionId"]);
        let got: LockResult = resolve_diplomacy_action_lock(&ctx_of(ctx_json));

        assert_eq!(got.locked, flag(&want["locked"]), "locked: {label}");
        assert_eq!(got.note, want["note"].as_str().unwrap(), "note: {label}");
        assert_eq!(got.active, flag(&want["active"]), "active: {label}");

        if want["requirement"].is_null() {
            assert!(
                got.requirement.is_none(),
                "requirement niepotrzebny: {label}"
            );
        } else {
            let r = got
                .requirement
                .as_ref()
                .unwrap_or_else(|| panic!("requirement oczekiwany: {label}"));
            let w = &want["requirement"];
            assert_eq!(r.kind, w["kind"].as_str().unwrap(), "kind: {label}");
            assert!(same_f64(r.prog, num(&w["prog"])), "prog: {label}");
            assert!(same_f64(r.masz, num(&w["masz"])), "masz: {label}");
        }
    }
}

/// Pokrycie: wektory obejmują każdą akcję 2..15 oraz gałąź `default`, a wynik ma wszystkie stany
/// (zablokowana z wymaganiem, zablokowana bez wymagania, otwarta, aktywna).
#[test]
fn vectors_cover_every_case_and_outcome() {
    let mut per_action: BTreeMap<String, BTreeSet<&'static str>> = BTreeMap::new();
    let mut kinds: BTreeSet<String> = BTreeSet::new();
    for row in rows() {
        let id = row["ctx"]["actionId"].as_str().unwrap().to_string();
        let want = &row["want"];
        let state = if flag(&want["active"]) {
            "active"
        } else if flag(&want["locked"]) {
            if want["requirement"].is_null() {
                "locked-plain"
            } else {
                "locked-req"
            }
        } else {
            "open"
        };
        if let Some(k) = want["requirement"]["kind"].as_str() {
            kinds.insert(k.to_string());
        }
        per_action.entry(id).or_default().insert(state);
    }
    for id in [
        "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15",
    ] {
        let states = per_action
            .get(id)
            .unwrap_or_else(|| panic!("brak wektorów dla akcji {id}"));
        assert!(
            states.contains("open") || states.contains("locked-req"),
            "akcja {id}: {states:?}"
        );
    }
    assert!(
        per_action.contains_key("1")
            || per_action.contains_key("16")
            || per_action.contains_key("x"),
        "brak wektorów gałęzi default"
    );
    let all: BTreeSet<&str> = per_action.values().flatten().copied().collect();
    for s in ["open", "locked-req", "locked-plain", "active"] {
        assert!(all.contains(s), "brak stanu {s} w wektorach");
    }
    for k in ["zaufanie", "respekt", "stan"] {
        assert!(kinds.contains(k), "brak wymagania typu {k}");
    }
}

/// Stałe zachowanie na wejściu brzegowym: akcja '15' bez wasala => zablokowana (notka web),
/// bez zależności od wektorów — chroni przed cichą zmianą kolejności bramek.
#[test]
fn action_15_without_vassal_is_locked_with_web_note() {
    let ctx = LockCtx {
        action_id: "15".to_string(),
        at_war: false,
        rel_total: 100.0,
        zaufanie: 100.0,
        respekt: 100.0,
        has_nap: false,
        has_handel: false,
        has_trade_connection: true,
        has_trade_tech_self: None,
        has_trade_tech_other: None,
        has_wymiana: false,
        has_sojusz: false,
        has_granice: false,
        breaks_treaty_label: None,
        sellable_tech_count: 0.0,
        buyable_tech_count: 0.0,
        known_rivals_count: 0.0,
        prog_nap_relacja: 30.0,
        prog_nap_zaufanie: None,
        kara_wspolna_granica: false,
        nap_agresor_aktywny: false,
        prog_handel_relacja: 50.0,
        prog_sojusz_relacja: 65.0,
        prog_sojusz_zaufanie: 70.0,
        prog_granice_relacja: 45.0,
        prog_granice_zaufanie: 50.0,
        prog_wymiana_tech_zaufanie: 50.0,
        prog_namow_wojne_zaufanie: 60.0,
        prog_wasalizacja_respekt: 70.0,
        prog_wchloniecie_respekt: None,
        prog_trybut_zadanie_min_respekt: 50.0,
        prog_dar_relacja: 20.0,
        is_city_state_partner: true,
        has_wasal: false,
        wasal_age_turns: None,
        gracz_wchloniecie_po_wasalu_tur: None,
    };
    let r = resolve_diplomacy_action_lock(&ctx);
    assert!(r.locked);
    assert_eq!(r.note, "zablokowana — brak aktywnej wasalizacji");
    assert!(r.requirement.is_none());
}
