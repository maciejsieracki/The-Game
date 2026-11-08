//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-3-Q1 (partia E): zgodnosc `resolve_diplomacy_action_lock` z URUCHOMIONYM
//! webem (origin/main, `gra/src/game/diplomacy-locks.ts` `resolveDiplomacyActionLock`, wszystkie case'y).
//! Wektory: `tests/p6_dyplomacja_multiwar3_e_data/locks.json` (2500 wierszy), generator `gen-de.mts`
//! (Node 22, `--import reg2.mjs`, TS transpilowane przez `typescript`; web wypakowany `git archive origin/main gra/src gra/data` poza repo).
//! Liczby NaN/Infinity jako stringi; pole web nieobecne = None / false.

use civ_engine::domain::diplomacy_locks::{resolve_diplomacy_action_lock, LockCtx, LockResult};
use serde_json::Value;

const LOCKS: &str = include_str!("p6_dyplomacja_multiwar3_e_data/locks.json");

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

fn opt_bool(v: &Value) -> Option<bool> {
    v.as_bool()
}

/// Dekodowanie kontekstu z wektora (pola `?:` web nieobecne -> None / false).
fn ctx_of(c: &Value) -> LockCtx {
    let n = |k: &str| num(&c[k]);
    let on = |k: &str| opt_num(&c[k]);
    LockCtx {
        action_id: c["actionId"].as_str().unwrap().to_string(),
        at_war: flag(&c["atWar"]),
        rel_total: n("relTotal"),
        zaufanie: n("zaufanie"),
        respekt: n("respekt"),
        has_nap: flag(&c["hasNap"]),
        has_handel: flag(&c["hasHandel"]),
        has_trade_connection: flag(&c["hasTradeConnection"]),
        has_trade_tech_self: opt_bool(&c["hasTradeTechSelf"]),
        has_trade_tech_other: opt_bool(&c["hasTradeTechOther"]),
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

fn same(a: f64, b: f64) -> bool {
    (a.is_nan() && b.is_nan()) || a == b
}

fn assert_result(got: &LockResult, want: &Value, ctx: &str) {
    assert_eq!(got.locked, flag(&want["locked"]), "locked {ctx}");
    assert_eq!(got.note, want["note"].as_str().unwrap(), "note {ctx}");
    assert_eq!(got.active, flag(&want["active"]), "active {ctx}");
    if want["requirement"].is_null() || want.get("requirement").is_none() {
        assert!(got.requirement.is_none(), "requirement niepotrzebny {ctx}");
    } else {
        let r = got
            .requirement
            .as_ref()
            .unwrap_or_else(|| panic!("requirement oczekiwany {ctx}"));
        let w = &want["requirement"];
        assert_eq!(r.kind, w["kind"].as_str().unwrap(), "kind {ctx}");
        assert!(same(r.prog, num(&w["prog"])), "prog {ctx}");
        assert!(same(r.masz, num(&w["masz"])), "masz {ctx}");
    }
}

#[test]
fn resolve_diplomacy_action_lock_matches_web_vectors() {
    let rows: Vec<Value> = serde_json::from_str(LOCKS).expect("locks.json");
    assert_eq!(rows.len(), 2500);
    let mut locked_count = 0usize;
    for (i, row) in rows.iter().enumerate() {
        let ctx = format!("wiersz {i}: {}", row["ctx"]["actionId"]);
        let got = resolve_diplomacy_action_lock(&ctx_of(&row["ctx"]));
        if got.locked {
            locked_count += 1;
        }
        assert_result(&got, &row["out"], &ctx);
    }
    // Wektory pokrywaja zarowno odblokowane, jak i zablokowane wyniki.
    assert!(locked_count > 100 && locked_count < rows.len() - 100);
}

fn base(action: &str) -> LockCtx {
    LockCtx {
        action_id: action.to_string(),
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
        sellable_tech_count: 1.0,
        buyable_tech_count: 0.0,
        known_rivals_count: 1.0,
        prog_nap_relacja: 30.0,
        prog_nap_zaufanie: None,
        kara_wspolna_granica: false,
        nap_agresor_aktywny: false,
        prog_handel_relacja: 50.0,
        prog_sojusz_relacja: 65.0,
        prog_sojusz_zaufanie: 91.0,
        prog_granice_relacja: 45.0,
        prog_granice_zaufanie: 50.0,
        prog_wymiana_tech_zaufanie: 50.0,
        prog_namow_wojne_zaufanie: 60.0,
        prog_wasalizacja_respekt: 70.0,
        prog_wchloniecie_respekt: None,
        prog_trybut_zadanie_min_respekt: 70.0,
        prog_dar_relacja: 20.0,
        is_city_state_partner: true,
        has_wasal: true,
        wasal_age_turns: Some(10.0),
        gracz_wchloniecie_po_wasalu_tur: None,
    }
}

#[test]
fn wasal_age_boundary_n_minus_1_n_n_plus_1() {
    // Min. wiek wasala 10 tur (domyslnie): 9 -> zablokowane (pozostalo 1), 10 i 11 -> przepuszcza (Respekt 100 >= 90).
    let mut c = base("15");
    c.wasal_age_turns = Some(9.0);
    let r = resolve_diplomacy_action_lock(&c);
    assert!(r.locked);
    assert_eq!(
        r.note,
        "zablokowana — wasal musi trwać ≥ 10 tur (pozostało 1)"
    );
    c.wasal_age_turns = Some(10.0);
    let r = resolve_diplomacy_action_lock(&c);
    assert!(!r.locked);
    assert_eq!(r.note, "jednorazowa opłata ¤ + zgoda wasala");
    c.wasal_age_turns = Some(11.0);
    assert!(!resolve_diplomacy_action_lock(&c).locked);
}

#[test]
fn trade_gate_order_and_tech_flags() {
    // Wojna przed bramka techniki; tech 'self' false blokuje przed polaczeniem handlowym.
    let mut c = base("5");
    c.at_war = true;
    assert_eq!(
        resolve_diplomacy_action_lock(&c).note,
        "handel niedostępny w wojnie"
    );
    c.at_war = false;
    c.has_trade_tech_self = Some(false);
    c.has_trade_connection = false;
    assert_eq!(
        resolve_diplomacy_action_lock(&c).note,
        "zablokowana — nie zbadano technologii Wymiana"
    );
    // undefined (None) = wsteczna zgodnosc: bramka pominieta.
    c.has_trade_tech_self = None;
    assert_eq!(
        resolve_diplomacy_action_lock(&c).note,
        "brak możliwego połączenia handlowego (ląd lub porty)"
    );
}

#[test]
fn nap_case_delegates_to_existing_nap_gate() {
    // Case '2' ma identyczny wynik jak istniejacy port bramki Paktu (diplomacy_nap_trust::resolve_nap_lock).
    let mut c = base("2");
    c.rel_total = 49.0;
    c.prog_nap_relacja = 50.0;
    let r = resolve_diplomacy_action_lock(&c);
    assert!(r.locked);
    assert_eq!(r.note, "zablokowana — wymaga Relacji 50 (masz 49)");
    assert_eq!(r.requirement.as_ref().unwrap().kind, "stan");
}
