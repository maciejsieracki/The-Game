//! R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1, runda 2: wektory wygenerowane z URUCHOMIONEGO kodu weba.
//! Źródło: origin/main 638e90bea, `gra/src/game/diplomacy-peace-lock.ts` (+ `diplomacy-war-peace-profile.ts`
//! i `gra/data/*.json`), wyeksportowane `git archive` do katalogu poza repo, uruchomione pod Node 22.22
//! (`--experimental-strip-types`, loader rozwiązujący importy bez rozszerzenia i JSON). Generator i harness
//! leżą poza repo (scratchpad runu); tu są wyłącznie wyniki. Porty i ścieżki tick: `TruceEndPorts` jak w webie.
//! Próg 0.20 i epsilon 1e-9: `przewagaMilitarna` w `diplomacy-war-peace-params.json` (638e90bea).

use civ_engine::domain::diplomacy_truce::normalize_truce_duration;
use civ_engine::domain::diplomacy_truce_end::{
    ai_truce_or_peace_mode, is_truce_window_breach, peace_finalize_gives_trust_event,
    truce_end_ai_accepts_default, truce_end_offer_expired, truce_end_offer_target,
    truce_end_tick_pair, PairTruceMeta, TruceEndOffer, TruceEndPorts, TruceOrPeaceMode,
    PRZEWAGA_EPSILON, PRZEWAGA_PROG,
};

#[test]
fn progi_zgodne_z_json_weba() {
    // web: przewagaMilitarna.prog = 0.20, epsilon = 1e-9 (638e90bea)
    assert_eq!(PRZEWAGA_PROG, 0.20);
    assert_eq!(PRZEWAGA_EPSILON, 1e-9);
}

const WEB_AI_ACCEPTS: &[(f64, f64, bool)] = &[
    (0.0, 0.0, false),
    (0.0, 1.0, true),
    (0.0, 5.0, true),
    (0.0, 10.0, true),
    (0.0, 79.999, true),
    (0.0, 80.0, true),
    (0.0, 80.0000001, true),
    (0.0, 80.001, true),
    (0.0, 100.0, true),
    (0.0, 150.0, true),
    (0.0, 1000.0, true),
    (0.0, -1.0, false),
    (0.0, f64::NAN, false),
    (0.0, f64::INFINITY, false),
    (1.0, 0.0, false),
    (1.0, 1.0, false),
    (1.0, 5.0, true),
    (1.0, 10.0, true),
    (1.0, 79.999, true),
    (1.0, 80.0, true),
    (1.0, 80.0000001, true),
    (1.0, 80.001, true),
    (1.0, 100.0, true),
    (1.0, 150.0, true),
    (1.0, 1000.0, true),
    (1.0, -1.0, false),
    (1.0, f64::NAN, false),
    (1.0, f64::INFINITY, false),
    (5.0, 0.0, false),
    (5.0, 1.0, false),
    (5.0, 5.0, false),
    (5.0, 10.0, true),
    (5.0, 79.999, true),
    (5.0, 80.0, true),
    (5.0, 80.0000001, true),
    (5.0, 80.001, true),
    (5.0, 100.0, true),
    (5.0, 150.0, true),
    (5.0, 1000.0, true),
    (5.0, -1.0, false),
    (5.0, f64::NAN, false),
    (5.0, f64::INFINITY, false),
    (10.0, 0.0, false),
    (10.0, 1.0, false),
    (10.0, 5.0, false),
    (10.0, 10.0, false),
    (10.0, 79.999, true),
    (10.0, 80.0, true),
    (10.0, 80.0000001, true),
    (10.0, 80.001, true),
    (10.0, 100.0, true),
    (10.0, 150.0, true),
    (10.0, 1000.0, true),
    (10.0, -1.0, false),
    (10.0, f64::NAN, false),
    (10.0, f64::INFINITY, false),
    (79.999, 0.0, false),
    (79.999, 1.0, false),
    (79.999, 5.0, false),
    (79.999, 10.0, false),
    (79.999, 79.999, false),
    (79.999, 80.0, false),
    (79.999, 80.0000001, false),
    (79.999, 80.001, false),
    (79.999, 100.0, true),
    (79.999, 150.0, true),
    (79.999, 1000.0, true),
    (79.999, -1.0, false),
    (79.999, f64::NAN, false),
    (79.999, f64::INFINITY, false),
    (80.0, 0.0, false),
    (80.0, 1.0, false),
    (80.0, 5.0, false),
    (80.0, 10.0, false),
    (80.0, 79.999, false),
    (80.0, 80.0, false),
    (80.0, 80.0000001, false),
    (80.0, 80.001, false),
    (80.0, 100.0, true),
    (80.0, 150.0, true),
    (80.0, 1000.0, true),
    (80.0, -1.0, false),
    (80.0, f64::NAN, false),
    (80.0, f64::INFINITY, false),
    (80.0000001, 0.0, false),
    (80.0000001, 1.0, false),
    (80.0000001, 5.0, false),
    (80.0000001, 10.0, false),
    (80.0000001, 79.999, false),
    (80.0000001, 80.0, false),
    (80.0000001, 80.0000001, false),
    (80.0000001, 80.001, false),
    (80.0000001, 100.0, true),
    (80.0000001, 150.0, true),
    (80.0000001, 1000.0, true),
    (80.0000001, -1.0, false),
    (80.0000001, f64::NAN, false),
    (80.0000001, f64::INFINITY, false),
    (80.001, 0.0, false),
    (80.001, 1.0, false),
    (80.001, 5.0, false),
    (80.001, 10.0, false),
    (80.001, 79.999, false),
    (80.001, 80.0, false),
    (80.001, 80.0000001, false),
    (80.001, 80.001, false),
    (80.001, 100.0, false),
    (80.001, 150.0, true),
    (80.001, 1000.0, true),
    (80.001, -1.0, false),
    (80.001, f64::NAN, false),
    (80.001, f64::INFINITY, false),
    (100.0, 0.0, false),
    (100.0, 1.0, false),
    (100.0, 5.0, false),
    (100.0, 10.0, false),
    (100.0, 79.999, false),
    (100.0, 80.0, false),
    (100.0, 80.0000001, false),
    (100.0, 80.001, false),
    (100.0, 100.0, false),
    (100.0, 150.0, true),
    (100.0, 1000.0, true),
    (100.0, -1.0, false),
    (100.0, f64::NAN, false),
    (100.0, f64::INFINITY, false),
    (150.0, 0.0, false),
    (150.0, 1.0, false),
    (150.0, 5.0, false),
    (150.0, 10.0, false),
    (150.0, 79.999, false),
    (150.0, 80.0, false),
    (150.0, 80.0000001, false),
    (150.0, 80.001, false),
    (150.0, 100.0, false),
    (150.0, 150.0, false),
    (150.0, 1000.0, true),
    (150.0, -1.0, false),
    (150.0, f64::NAN, false),
    (150.0, f64::INFINITY, false),
    (1000.0, 0.0, false),
    (1000.0, 1.0, false),
    (1000.0, 5.0, false),
    (1000.0, 10.0, false),
    (1000.0, 79.999, false),
    (1000.0, 80.0, false),
    (1000.0, 80.0000001, false),
    (1000.0, 80.001, false),
    (1000.0, 100.0, false),
    (1000.0, 150.0, false),
    (1000.0, 1000.0, false),
    (1000.0, -1.0, false),
    (1000.0, f64::NAN, false),
    (1000.0, f64::INFINITY, false),
    (-1.0, 0.0, false),
    (-1.0, 1.0, false),
    (-1.0, 5.0, false),
    (-1.0, 10.0, false),
    (-1.0, 79.999, false),
    (-1.0, 80.0, false),
    (-1.0, 80.0000001, false),
    (-1.0, 80.001, false),
    (-1.0, 100.0, false),
    (-1.0, 150.0, false),
    (-1.0, 1000.0, false),
    (-1.0, -1.0, false),
    (-1.0, f64::NAN, false),
    (-1.0, f64::INFINITY, false),
    (f64::NAN, 0.0, false),
    (f64::NAN, 1.0, false),
    (f64::NAN, 5.0, false),
    (f64::NAN, 10.0, false),
    (f64::NAN, 79.999, false),
    (f64::NAN, 80.0, false),
    (f64::NAN, 80.0000001, false),
    (f64::NAN, 80.001, false),
    (f64::NAN, 100.0, false),
    (f64::NAN, 150.0, false),
    (f64::NAN, 1000.0, false),
    (f64::NAN, -1.0, false),
    (f64::NAN, f64::NAN, false),
    (f64::NAN, f64::INFINITY, false),
    (f64::INFINITY, 0.0, false),
    (f64::INFINITY, 1.0, false),
    (f64::INFINITY, 5.0, false),
    (f64::INFINITY, 10.0, false),
    (f64::INFINITY, 79.999, false),
    (f64::INFINITY, 80.0, false),
    (f64::INFINITY, 80.0000001, false),
    (f64::INFINITY, 80.001, false),
    (f64::INFINITY, 100.0, false),
    (f64::INFINITY, 150.0, false),
    (f64::INFINITY, 1000.0, false),
    (f64::INFINITY, -1.0, false),
    (f64::INFINITY, f64::NAN, false),
    (f64::INFINITY, f64::INFINITY, false),
];
const WEB_OFFER_TARGET: &[(Option<u32>, Option<u32>)] = &[
    (None, None),
    (None, None),
    (Some(1), Some(2)),
    (Some(2), Some(1)),
    (Some(3), None),
];
const WEB_OFFER_EXPIRED: &[(f64, f64, bool)] = &[
    (5.0, 4.0, false),
    (5.0, 5.0, false),
    (5.0, 6.0, true),
    (5.0, 11.0, true),
    (10.0, 4.0, false),
    (10.0, 5.0, false),
    (10.0, 6.0, false),
    (10.0, 11.0, true),
];
const WEB_WINDOW_BREACH: &[(Option<f64>, bool, f64, bool)] = &[
    (None, false, 5.0, false),
    (None, false, 5.0, false),
    (Some(15.0), false, 14.0, true),
    (Some(15.0), false, 15.0, false),
    (None, true, 4.0, true),
    (None, false, 4.0, false),
];
const WEB_DURATION: &[(Option<f64>, Option<f64>)] = &[
    (Some(5.0), Some(5.0)),
    (Some(10.0), Some(10.0)),
    (Some(15.0), Some(15.0)),
    (Some(7.0), None),
    (Some(0.0), None),
    (Some(5.5), None),
    (None, None),
    (None, None),
    (Some(f64::NAN), None),
    (Some(f64::INFINITY), None),
    (Some(-5.0), None),
];
const WEB_MODE: &[(f64, f64, f64, bool, bool, bool)] = &[
    (0.0, 0.5, 59.0, false, true, true),
    (0.0, 0.5, 59.0, false, false, false),
    (0.0, 0.5, 59.0, true, true, false),
    (0.0, 0.5, 59.0, true, false, false),
    (0.0, 0.5, 60.0, false, true, true),
    (0.0, 0.5, 60.0, false, false, true),
    (0.0, 0.5, 60.0, true, true, true),
    (0.0, 0.5, 60.0, true, false, true),
    (0.0, 0.69, 59.0, false, true, true),
    (0.0, 0.69, 59.0, false, false, false),
    (0.0, 0.69, 59.0, true, true, false),
    (0.0, 0.69, 59.0, true, false, false),
    (0.0, 0.69, 60.0, false, true, true),
    (0.0, 0.69, 60.0, false, false, true),
    (0.0, 0.69, 60.0, true, true, true),
    (0.0, 0.69, 60.0, true, false, true),
    (0.0, 0.7, 59.0, false, true, true),
    (0.0, 0.7, 59.0, false, false, true),
    (0.0, 0.7, 59.0, true, true, true),
    (0.0, 0.7, 59.0, true, false, true),
    (0.0, 0.7, 60.0, false, true, true),
    (0.0, 0.7, 60.0, false, false, true),
    (0.0, 0.7, 60.0, true, true, true),
    (0.0, 0.7, 60.0, true, false, true),
    (0.99, 0.5, 59.0, false, true, true),
    (0.99, 0.5, 59.0, false, false, false),
    (0.99, 0.5, 59.0, true, true, false),
    (0.99, 0.5, 59.0, true, false, false),
    (0.99, 0.5, 60.0, false, true, true),
    (0.99, 0.5, 60.0, false, false, true),
    (0.99, 0.5, 60.0, true, true, true),
    (0.99, 0.5, 60.0, true, false, true),
    (0.99, 0.69, 59.0, false, true, true),
    (0.99, 0.69, 59.0, false, false, false),
    (0.99, 0.69, 59.0, true, true, false),
    (0.99, 0.69, 59.0, true, false, false),
    (0.99, 0.69, 60.0, false, true, true),
    (0.99, 0.69, 60.0, false, false, true),
    (0.99, 0.69, 60.0, true, true, true),
    (0.99, 0.69, 60.0, true, false, true),
    (0.99, 0.7, 59.0, false, true, true),
    (0.99, 0.7, 59.0, false, false, true),
    (0.99, 0.7, 59.0, true, true, true),
    (0.99, 0.7, 59.0, true, false, true),
    (0.99, 0.7, 60.0, false, true, true),
    (0.99, 0.7, 60.0, false, false, true),
    (0.99, 0.7, 60.0, true, true, true),
    (0.99, 0.7, 60.0, true, false, true),
    (1.0, 0.5, 59.0, false, true, true),
    (1.0, 0.5, 59.0, false, false, true),
    (1.0, 0.5, 59.0, true, true, true),
    (1.0, 0.5, 59.0, true, false, true),
    (1.0, 0.5, 60.0, false, true, true),
    (1.0, 0.5, 60.0, false, false, true),
    (1.0, 0.5, 60.0, true, true, true),
    (1.0, 0.5, 60.0, true, false, true),
    (1.0, 0.69, 59.0, false, true, true),
    (1.0, 0.69, 59.0, false, false, true),
    (1.0, 0.69, 59.0, true, true, true),
    (1.0, 0.69, 59.0, true, false, true),
    (1.0, 0.69, 60.0, false, true, true),
    (1.0, 0.69, 60.0, false, false, true),
    (1.0, 0.69, 60.0, true, true, true),
    (1.0, 0.69, 60.0, true, false, true),
    (1.0, 0.7, 59.0, false, true, true),
    (1.0, 0.7, 59.0, false, false, true),
    (1.0, 0.7, 59.0, true, true, true),
    (1.0, 0.7, 59.0, true, false, true),
    (1.0, 0.7, 60.0, false, true, true),
    (1.0, 0.7, 60.0, false, false, true),
    (1.0, 0.7, 60.0, true, true, true),
    (1.0, 0.7, 60.0, true, false, true),
    (1.2, 0.5, 59.0, false, true, true),
    (1.2, 0.5, 59.0, false, false, true),
    (1.2, 0.5, 59.0, true, true, true),
    (1.2, 0.5, 59.0, true, false, true),
    (1.2, 0.5, 60.0, false, true, true),
    (1.2, 0.5, 60.0, false, false, true),
    (1.2, 0.5, 60.0, true, true, true),
    (1.2, 0.5, 60.0, true, false, true),
    (1.2, 0.69, 59.0, false, true, true),
    (1.2, 0.69, 59.0, false, false, true),
    (1.2, 0.69, 59.0, true, true, true),
    (1.2, 0.69, 59.0, true, false, true),
    (1.2, 0.69, 60.0, false, true, true),
    (1.2, 0.69, 60.0, false, false, true),
    (1.2, 0.69, 60.0, true, true, true),
    (1.2, 0.69, 60.0, true, false, true),
    (1.2, 0.7, 59.0, false, true, true),
    (1.2, 0.7, 59.0, false, false, true),
    (1.2, 0.7, 59.0, true, true, true),
    (1.2, 0.7, 59.0, true, false, true),
    (1.2, 0.7, 60.0, false, true, true),
    (1.2, 0.7, 60.0, false, false, true),
    (1.2, 0.7, 60.0, true, true, true),
    (1.2, 0.7, 60.0, true, false, true),
];
const WEB_TRUST_EVENT: &[(Option<f64>, bool)] = &[
    (Some(5.0), false),
    (Some(10.0), false),
    (Some(15.0), false),
    (Some(7.0), true),
    (Some(0.0), true),
    (None, true),
    (None, true),
];

#[test]
fn web_truce_end_ai_accepts() {
    for &(p, a, want) in WEB_AI_ACCEPTS {
        assert_eq!(truce_end_ai_accepts_default(p, a), want, "p={p} a={a}");
    }
}

#[test]
fn web_offer_target() {
    for &(init, want) in WEB_OFFER_TARGET {
        assert_eq!(
            truce_end_offer_target(init, 1u32, 2u32),
            want,
            "init={init:?}"
        );
    }
}

#[test]
fn web_offer_expired() {
    for &(o, c, want) in WEB_OFFER_EXPIRED {
        assert_eq!(truce_end_offer_expired(o, c), want, "o={o} c={c}");
    }
}

#[test]
fn web_window_breach() {
    for &(until, has_offer, t, want) in WEB_WINDOW_BREACH {
        assert_eq!(
            is_truce_window_breach(until, has_offer, t),
            want,
            "until={until:?} t={t}"
        );
    }
}

#[test]
fn web_duration_5_10_15_i_zla() {
    for &(input, want) in WEB_DURATION {
        assert_eq!(normalize_truce_duration(input), want, "in={input:?}");
    }
}

#[test]
fn web_ai_truce_or_peace_mode() {
    for &(fat, will, z, weaker, fb_pokoj, want_pokoj) in WEB_MODE {
        let got = ai_truce_or_peace_mode(fat, will, z, weaker, fb_pokoj);
        let want = if want_pokoj {
            TruceOrPeaceMode::Pokoj
        } else {
            TruceOrPeaceMode::Rozejm
        };
        assert_eq!(
            got, want,
            "fat={fat} will={will} z={z} weaker={weaker} fb={fb_pokoj}"
        );
    }
}

#[test]
fn web_peace_finalize_trust_event() {
    for &(t, want) in WEB_TRUST_EVENT {
        assert_eq!(peace_finalize_gives_trust_event(t), want, "t={t:?}");
    }
}

/// Port testowy: stan jednej pary + log efektów w kolejności jak w web (atrapy z tick.mjs).
#[derive(Default)]
struct Fake {
    meta: PairTruceMeta<u32>,
    peace: bool,
    army: [f64; 3],
    human: Vec<u32>,
    log: Vec<String>,
    inbox_n: u32,
}

impl TruceEndPorts<u32> for Fake {
    fn meta(&self, _a: u32, _b: u32) -> PairTruceMeta<u32> {
        self.meta.clone()
    }
    fn set_meta(&mut self, _a: u32, _b: u32, meta: PairTruceMeta<u32>) {
        self.meta = meta;
        self.log.push("setMeta".into());
    }
    fn status_is_peace(&self, _a: u32, _b: u32) -> bool {
        self.peace
    }
    fn army_m(&self, owner: u32) -> f64 {
        self.army[owner as usize]
    }
    fn is_human(&self, owner: u32) -> bool {
        self.human.contains(&owner)
    }
    fn declare_war_after_truce(&mut self, _a: u32, _b: u32) {
        self.peace = false;
        self.log.push("war".into());
    }
    fn enqueue_offer(&mut self, owner: u32, _reason: &str) -> String {
        self.inbox_n += 1;
        self.log.push(format!("enqueue:{owner}"));
        format!("inbox{}", self.inbox_n)
    }
    fn remove_offer(&mut self, inbox_id: &str) {
        self.log.push(format!("remove:{inbox_id}"));
    }
    fn finalize_peace(&mut self, proposer: u32, responder: u32) {
        self.peace = true;
        self.log.push(format!("peace:{proposer}>{responder}"));
    }
}

fn fake(
    until: Option<f64>,
    init: Option<u32>,
    offer: Option<TruceEndOffer<u32>>,
    peace: bool,
    army: [f64; 3],
    human: Vec<u32>,
) -> Fake {
    Fake {
        meta: PairTruceMeta {
            truce_until: until,
            initiator: init,
            offer,
        },
        peace,
        army,
        human,
        ..Default::default()
    }
}

#[test]
fn web_tick_s1_ai_akceptuje_pokoj_po_rozejmie() {
    let mut f = fake(Some(10.0), Some(1), None, true, [0.0, 80.0, 100.0], vec![1]);
    truce_end_tick_pair(&mut f, 1, 2, 10.0);
    assert_eq!(f.log, vec!["setMeta", "peace:1>2"]);
    assert!(f.peace);
    assert_eq!(f.meta.truce_until, None);
    assert_eq!(f.meta.offer, None);
}

#[test]
fn web_tick_s2_ai_odmawia_wojna_bez_kary() {
    let mut f = fake(
        Some(10.0),
        Some(1),
        None,
        true,
        [0.0, 100.0, 100.0],
        vec![1],
    );
    truce_end_tick_pair(&mut f, 1, 2, 10.0);
    assert_eq!(f.log, vec!["setMeta", "war"]);
    assert!(!f.peace);
}

#[test]
fn web_tick_s3_gracz_dostaje_oferte_w_skrzynce() {
    let mut f = fake(Some(10.0), Some(1), None, true, [0.0, 1.0, 100.0], vec![2]);
    truce_end_tick_pair(&mut f, 1, 2, 10.0);
    assert_eq!(f.log, vec!["setMeta", "enqueue:1", "setMeta"]);
    assert_eq!(
        f.meta.offer,
        Some(TruceEndOffer {
            turn: 10.0,
            from: 1,
            to: 2,
            inbox_id: Some("inbox1".into())
        })
    );
    // drugi tick w tej samej turze: oferta czeka, bez zmian (web: S8)
    truce_end_tick_pair(&mut f, 1, 2, 10.0);
    assert_eq!(f.log, vec!["setMeta", "enqueue:1", "setMeta"]);
}

#[test]
fn web_tick_s4_timeout_oferty_wojna_i_usuniecie_wpisu() {
    let offer = Some(TruceEndOffer {
        turn: 10.0,
        from: 1,
        to: 2,
        inbox_id: Some("x9".into()),
    });
    let mut f = fake(None, None, offer, true, [0.0; 3], vec![]);
    truce_end_tick_pair(&mut f, 1, 2, 11.0);
    assert_eq!(f.log, vec!["war", "remove:x9", "setMeta"]);
    assert!(!f.peace);
    assert_eq!(f.meta.offer, None);
}

#[test]
fn web_tick_s5_nie_pokoj_tylko_czysci_rozejm() {
    let mut f = fake(Some(10.0), Some(1), None, false, [0.0, 1.0, 100.0], vec![]);
    truce_end_tick_pair(&mut f, 1, 2, 10.0);
    assert_eq!(f.log, vec!["setMeta"]);
    assert_eq!(f.meta.truce_until, None);
}

#[test]
fn web_tick_s6_brak_inicjatora_wojna() {
    let mut f = fake(Some(10.0), None, None, true, [0.0, 1.0, 100.0], vec![]);
    truce_end_tick_pair(&mut f, 1, 2, 10.0);
    assert_eq!(f.log, vec!["setMeta", "war"]);
}

#[test]
fn web_tick_s7_przed_wygasnieciem_nic() {
    let mut f = fake(Some(10.0), Some(1), None, true, [0.0, 1.0, 100.0], vec![]);
    truce_end_tick_pair(&mut f, 1, 2, 9.0);
    assert!(f.log.is_empty());
    assert_eq!(f.meta.truce_until, Some(10.0));
}
