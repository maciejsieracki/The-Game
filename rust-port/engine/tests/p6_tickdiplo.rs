//! R-RUSTPORT-P6-TICKDIPLO-GEN-Q1 (W6 dług: wektory tickDiplomacy): test behawioralny
//! `DiplomacyState::tick_pair` (-> `tick_relation` -> `compute_trust_delta`) na wektorach
//! z PINOWANEGO webu (`07d2fbd72f758705f8e1d59cc4968027ffbafe75`, `gra/src/game/diplomacy.ts`,
//! `tickDiplomacy`). Wektory: `tests/p6_tickdiplo_vectors/tick.json`, generator
//! `tests/p6_tickdiplo_gen.mjs` (Node 22 + esbuild spoza repo; nie ręcznie).
//!
//! Porównanie: `zaufanie` i `respekt` po jednym ticku (dokładna równość f64; kolejność
//! sumowania ΔZ jest identyczna po obu stronach).
//!
//! NIE_ZMIERZONO (brak odpowiednika w modelu Rust, poza zakresem tego testu):
//! - zanik `urazyHistoryczne` co 20 tur (web: `turn % 20 === 0`),
//! - wygasanie `traktaty` (`wygasaTura <= turn`),
//! - `relacjaOgolna` (pochodna; w Rust brak pola),
//! - `stanWojny` (web: alternatywna ścieżka `isRelationAtWar`; generator używa tylko slim `status`),
//! - NaN / Infinity jako wejście (generator ich nie emituje).
//!
//! Mapowanie TickCtx (web, camelCase) -> TickContext (Rust) jest jawne w `tick_ctx_of`.

use civ_engine::domain::diplomacy::{
    CivilizationPair, DiplomacyParams, DiplomacyState, PeaceTrustTier, Relation, RelationStatus,
    TickContext,
};
use civ_engine::domain::PlayerId;
use serde_json::Value;

const VECTORS: &str = include_str!("p6_tickdiplo_vectors/tick.json");
const PIN: &str = "07d2fbd72f758705f8e1d59cc4968027ffbafe75";

/// Liczby w wektorach są stringami (`String(x)` z JS): `str::parse` jest poprawnie zaokrąglony,
/// a serde_json bez `float_roundtrip` potrafi przesunąć floaty o 1 ULP.
fn num(v: &Value) -> f64 {
    v.as_str()
        .unwrap_or_else(|| panic!("liczba (string) oczekiwana: {v}"))
        .parse::<f64>()
        .unwrap_or_else(|_| panic!("nie liczba: {v}"))
}

fn status_of(s: &str) -> RelationStatus {
    match s {
        "wojna" => RelationStatus::War,
        "pokoj" => RelationStatus::Peace,
        "sojusz" => RelationStatus::Alliance,
        "neutralni" => RelationStatus::Neutral,
        other => panic!("nieznany status web: {other}"),
    }
}

/// Jawne mapowanie `TickCtx` (web) -> `TickContext` (Rust).
/// Web: `pokojTrustTier ?? (aktywnyPakt ? 'nap' : undefined)` (pole deprecated).
/// Web `karaWspolnaGranica` (-2) -> Rust `common_border`; `wiarygodnoscSelf` -> `credibility`.
fn tick_ctx_of(c: &Value) -> TickContext {
    let flag = |k: &str| c[k].as_bool().unwrap_or(false);
    let peace_tier = match c["pokojTrustTier"].as_str() {
        Some("sojusz") => Some(PeaceTrustTier::Alliance),
        Some("nap") => Some(PeaceTrustTier::Nap),
        Some("pokoj") => Some(PeaceTrustTier::Peace),
        Some(other) => panic!("nieznany pokojTrustTier: {other}"),
        None if flag("aktywnyPakt") => Some(PeaceTrustTier::Nap),
        None => None,
    };
    TickContext {
        active_trade: flag("aktywnyHandel"),
        peace_tier,
        goodwill: flag("dobraWolaAktywna"),
        common_enemy: flag("wspolnyWrog"),
        same_religion: flag("wspolnaReligia"),
        different_religion: flag("odmiennaReligia"),
        common_border: flag("karaWspolnaGranica"),
        credibility: c.get("wiarygodnoscSelf").map(num),
    }
}

#[test]
fn tick_pair_matches_pinned_web_tick_diplomacy_on_vectors() {
    let doc: Value = serde_json::from_str(VECTORS).expect("tick.json: poprawny JSON");
    assert_eq!(doc["pin"].as_str(), Some(PIN), "pin wektorów");
    let rows = doc["rows"].as_array().expect("rows");
    assert_eq!(rows.len(), 2000, "liczba wierszy");

    let params = DiplomacyParams::default();
    let (a, b) = (PlayerId::new(1), PlayerId::new(2));

    let mut war_rows = 0usize;
    let mut war_trust_increase = 0usize;
    let mut tier_seen = [false; 4];
    let mut cred_undefined = 0usize;
    let mut clamped_top = 0usize;
    let mut clamped_bottom = 0usize;

    for (idx, row) in rows.iter().enumerate() {
        let rel = &row["rel"];
        let ctx_json = &row["ctx"];
        let status = status_of(rel["status"].as_str().expect("status"));
        let trust_in = num(&rel["zaufanie"]);
        let respect_in = num(&rel["respekt"]);
        let relation = Relation::new(trust_in, respect_in, status);
        let ctx = tick_ctx_of(ctx_json);

        match ctx.peace_tier {
            Some(PeaceTrustTier::Alliance) => tier_seen[0] = true,
            Some(PeaceTrustTier::Nap) => tier_seen[1] = true,
            Some(PeaceTrustTier::Peace) => tier_seen[2] = true,
            None => tier_seen[3] = true,
        }
        if ctx.credibility.is_none() {
            cred_undefined += 1;
        }

        let mut state = DiplomacyState::new();
        state.set_relation(CivilizationPair::new(a, b), relation);
        let got = state.tick_pair(a, b, &ctx, &params);

        let want_trust = num(&row["want"]["zaufanie"]);
        let want_respect = num(&row["want"]["respekt"]);
        assert_eq!(
            got.trust, want_trust,
            "wiersz {idx}: zaufanie (wejście {row})"
        );
        assert_eq!(
            got.respect, want_respect,
            "wiersz {idx}: respekt (wejście {row})"
        );

        if status == RelationStatus::War {
            war_rows += 1;
            if got.trust > trust_in {
                war_trust_increase += 1;
            }
        }
        if want_trust == 100.0 {
            clamped_top += 1;
        }
        if want_trust == 0.0 {
            clamped_bottom += 1;
        }
    }

    // Sanity: wektory pokrywają gałęzie wojny, każdy tier i brak wiarygodności.
    assert!(war_rows >= 300, "za mało wierszy wojny: {war_rows}");
    assert_eq!(war_trust_increase, 0, "w wojnie zaufanie nie rośnie");
    assert!(
        tier_seen.iter().all(|&s| s),
        "brak pokrycia tieru: {tier_seen:?}"
    );
    assert!(cred_undefined > 0, "brak wierszy bez wiarygodności");
    assert!(clamped_top + clamped_bottom > 0, "brak klamrowania 0/100");
}
