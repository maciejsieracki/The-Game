//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-2-Q1 (runda 4, partia C): port 1:1 z webem
//! `gra/src/game/diplomacy-ai-forced-peace.ts` (pin `origin/main` 5dd53e60f) - pokoj AI<->AI wymuszony po N turach
//! od prosby przegrywajacego (`registerAiPeaceRequest`, `isForcedPeaceDue`, `decideAiPeaceRequest`, `runAiAiPeaceTick`).
//!
//! PARAMETR: `AI_PEACE_TURNS_AFTER_REQUEST` = 2 - literal z `gra/data/ai-params.json` `tury_do_pokoju_po_prosbie.wartosc`
//! (zgodnie z praktyka: `data/` nie zmieniane, bo liczy testy data_compliance). Fallback webowy (2) zgodny.
//! `planPeacePayment` NIE jest tu powtorzony: to ten sam symbol, juz portowany w `diplomacy_multiwar_peace::plan_peace_payment`.
//!
//! ZALEZNOSC WEBOWA `price(winner, loser, kind)`: w TS zwraca closure `balanceFor(coveredPn)`. Tu `PeaceBalanceShape`
//! (dwie postacie: `Linear` i `Kinked`, obie wyliczane identycznym wyrazeniem w generatorze). Logika ticka dziala na
//! dowolnej postaci - wektory pokrywaja obie. PRAWDZIWA wycena z weba (ai.ts `peaceOfferAiOwnBilans`) NIE jest portowana.
//!
//! JS-SEMANTYKA: `Math.max` propaguje NaN (`js_max`); porownania z NaN falszywe; `Math.round` = `js_round`;
//! `??` dla `limit` = `Option` (Some(NaN) zostaje); `Array.from(Map.entries())` = snapshot w kolejnosci wstawiania.
//! Log: tekst jak w TS (`js_num` = `String(number)` dla zakresu uzywanego przez tick).

use super::diplomacy_multiwar::js_max;
use super::diplomacy_multiwar_peace::{
    plan_peace_payment, PeaceAsset, PeaceAssetKind, PeacePaymentPlan,
};
use std::collections::HashSet;

/// Literal z `ai-params.json` `tury_do_pokoju_po_prosbie.wartosc` (= 2).
pub const AI_PEACE_TURNS_AFTER_REQUEST: f64 = 2.0;
/// Web `LOSER_MAX_SHARE_AT_REQUEST`.
pub const LOSER_MAX_SHARE_AT_REQUEST: f64 = 0.45;
/// Web `LOSER_MAX_SHARE_KEEP`.
pub const LOSER_MAX_SHARE_KEEP: f64 = 0.5;

/// Web `AiPeaceKind`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiPeaceKind {
    Pokoj,
    Rozejm,
}

impl AiPeaceKind {
    /// Nazwa jak w TS (`'pokoj' | 'rozejm'`).
    pub fn name(self) -> &'static str {
        match self {
            AiPeaceKind::Pokoj => "pokoj",
            AiPeaceKind::Rozejm => "rozejm",
        }
    }
}

/// Web `AiPeaceRequest`. `kind` zawsze ustawiony (web: brak pola = 'pokoj', tu domyslnie Pokoj w rejestracji).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiPeaceRequest {
    pub requester_id: i64,
    pub other_id: i64,
    pub since_turn: f64,
    pub kind: AiPeaceKind,
}

/// Web `AiPeaceRequestStore` = `Map<string, AiPeaceRequest>`. Zachowuje kolejnosc wstawiania jak Map JS.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct AiPeaceRequestStore {
    entries: Vec<(String, AiPeaceRequest)>,
}

impl AiPeaceRequestStore {
    pub fn new() -> Self {
        Self::default()
    }
    pub fn has(&self, key: &str) -> bool {
        self.entries.iter().any(|(k, _)| k == key)
    }
    pub fn get(&self, key: &str) -> Option<&AiPeaceRequest> {
        self.entries.iter().find(|(k, _)| k == key).map(|(_, r)| r)
    }
    /// Web `store.delete(key)`.
    pub fn delete(&mut self, key: &str) {
        self.entries.retain(|(k, _)| k != key);
    }
    pub fn len(&self) -> usize {
        self.entries.len()
    }
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
    /// Kolejnosc wstawiania (jak `Map.entries()`).
    pub fn entries(&self) -> &[(String, AiPeaceRequest)] {
        &self.entries
    }
}

/// Web `Math.round` (polowki w gore; NaN propaguje).
pub fn js_round(x: f64) -> f64 {
    if x.is_nan() {
        x
    } else {
        (x + 0.5).floor()
    }
}

/// Web `String(number)` dla wartosci wystepujacych w logu (NaN, +-Infinity, 0 bez znaku, reszta jak Rust Display).
pub fn js_num(x: f64) -> String {
    if x.is_nan() {
        "NaN".to_string()
    } else if x == f64::INFINITY {
        "Infinity".to_string()
    } else if x == f64::NEG_INFINITY {
        "-Infinity".to_string()
    } else if x == 0.0 {
        "0".to_string()
    } else {
        format!("{x}")
    }
}

/// Web `registerAiPeaceRequest(store, pairKey, requesterId, otherId, turn, kind)`.
/// Zwraca true tylko dla NOWEJ prosby (kolejne prosby pary nie odnawiaja licznika).
pub fn register_ai_peace_request(
    store: &mut AiPeaceRequestStore,
    pair_key: &str,
    requester_id: i64,
    other_id: i64,
    turn: f64,
    kind: AiPeaceKind,
) -> bool {
    if store.has(pair_key) {
        return false;
    }
    store.entries.push((
        pair_key.to_string(),
        AiPeaceRequest {
            requester_id,
            other_id,
            since_turn: turn,
            kind,
        },
    ));
    true
}

/// Web `turnsSincePeaceRequest` = `Math.max(0, turn - sinceTurn)`.
pub fn turns_since_peace_request(req: &AiPeaceRequest, turn: f64) -> f64 {
    js_max(0.0, turn - req.since_turn)
}

/// Web `isForcedPeaceDue(req, turn, limit)`.
pub fn is_forced_peace_due(req: &AiPeaceRequest, turn: f64, limit: f64) -> bool {
    turns_since_peace_request(req, turn) >= limit
}

/// Web `isForcedPeaceDue` z domyslnym limitem (`AI_PEACE_TURNS_AFTER_REQUEST`).
pub fn is_forced_peace_due_default(req: &AiPeaceRequest, turn: f64) -> bool {
    is_forced_peace_due(req, turn, AI_PEACE_TURNS_AFTER_REQUEST)
}

/// Web `ForcedPeacePairInput`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ForcedPeacePairInput {
    pub a_is_human: bool,
    pub b_is_human: bool,
    pub a_is_major_ai: bool,
    pub b_is_major_ai: bool,
    pub eliminated: bool,
    pub forced_epoch_war: bool,
    pub at_war: bool,
}

/// Web `isForcedPeaceEligiblePair`.
pub fn is_forced_peace_eligible_pair(p: &ForcedPeacePairInput) -> bool {
    if p.a_is_human || p.b_is_human {
        return false;
    }
    if !p.a_is_major_ai || !p.b_is_major_ai {
        return false;
    }
    if p.eliminated || p.forced_epoch_war {
        return false;
    }
    p.at_war
}

/// Web `requesterShare(requesterPower, otherPower)`: `sum > 0 ? rp / sum : 0.5` (NaN -> 0.5).
pub fn requester_share(requester_power: f64, other_power: f64) -> f64 {
    let sum = requester_power + other_power;
    if sum > 0.0 {
        requester_power / sum
    } else {
        0.5
    }
}

/// Web `isClearlyLosing(share)`.
pub fn is_clearly_losing(share: f64) -> bool {
    share <= LOSER_MAX_SHARE_AT_REQUEST
}

/// Web `isStillLosing(share)`.
pub fn is_still_losing(share: f64) -> bool {
    share <= LOSER_MAX_SHARE_KEEP
}

/// Werdykt bramki zwyciezcy (web `evaluatePeaceAiGate`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GateVerdict {
    Ok,
    TooEarly,
    Stronger,
}

impl GateVerdict {
    pub fn name(self) -> &'static str {
        match self {
            GateVerdict::Ok => "ok",
            GateVerdict::TooEarly => "too_early",
            GateVerdict::Stronger => "stronger",
        }
    }
}

/// Powod decyzji (web `reason` jako kod; tekst TS: limit / bramka / tolerancja).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiPeaceReason {
    /// `limit ${limit} tur od prosby`.
    LimitReached,
    /// `bramka zwyciezcy: ${verdict}` (verdict != ok).
    GateNotOk(GateVerdict),
    /// `bilans zwyciezcy w tolerancji po zaplacie`.
    BalanceInTolerance,
    /// `bilans zwyciezcy ponizej tolerancji (zaplata za mala)`.
    BalanceBelowTolerance,
}

/// Web `AiPeaceDecision.action`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiPeaceAction {
    Wait,
    AcceptPaid,
    Force,
}

impl AiPeaceAction {
    pub fn name(self) -> &'static str {
        match self {
            AiPeaceAction::Wait => "wait",
            AiPeaceAction::AcceptPaid => "accept_paid",
            AiPeaceAction::Force => "force",
        }
    }
}

/// Web `AiPeaceDecision` (bilanse juz zaokraglone `Math.round`, jak w TS).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AiPeaceDecision {
    pub action: AiPeaceAction,
    pub reason: AiPeaceReason,
    pub balance_before: f64,
    pub balance_after: f64,
    pub turns_since: f64,
}

/// Web `AiPeaceDecisionInput`. `limit` = `None` gdy web pomija pole (`??` -> domyslny).
pub struct AiPeaceDecisionInput<'a> {
    pub req: &'a AiPeaceRequest,
    pub turn: f64,
    pub plan: &'a PeacePaymentPlan,
    pub balance_before_pn: f64,
    pub balance_after_pn: f64,
    pub tolerance_pn: f64,
    pub winner_gate_verdict: GateVerdict,
    pub limit: Option<f64>,
}

/// Web `decideAiPeaceRequest`:
/// - po limicie tur od prosby -> `Force` (zawsze),
/// - przed limitem: bramka != ok -> `Wait`; bilans po zaplacie >= -tolerancja (lub plan pelny) -> `AcceptPaid`,
/// - inaczej `Wait`.
pub fn decide_ai_peace_request(inp: &AiPeaceDecisionInput) -> AiPeaceDecision {
    let limit = inp.limit.unwrap_or(AI_PEACE_TURNS_AFTER_REQUEST);
    let turns_since = turns_since_peace_request(inp.req, inp.turn);
    let balance_before = js_round(inp.balance_before_pn);
    let balance_after = js_round(inp.balance_after_pn);
    if turns_since >= limit {
        return AiPeaceDecision {
            action: AiPeaceAction::Force,
            reason: AiPeaceReason::LimitReached,
            balance_before,
            balance_after,
            turns_since,
        };
    }
    if inp.winner_gate_verdict != GateVerdict::Ok {
        return AiPeaceDecision {
            action: AiPeaceAction::Wait,
            reason: AiPeaceReason::GateNotOk(inp.winner_gate_verdict),
            balance_before,
            balance_after,
            turns_since,
        };
    }
    if inp.plan.full || balance_after >= -inp.tolerance_pn {
        return AiPeaceDecision {
            action: AiPeaceAction::AcceptPaid,
            reason: AiPeaceReason::BalanceInTolerance,
            balance_before,
            balance_after,
            turns_since,
        };
    }
    AiPeaceDecision {
        action: AiPeaceAction::Wait,
        reason: AiPeaceReason::BalanceBelowTolerance,
        balance_before,
        balance_after,
        turns_since,
    }
}

/// Postac bilansu zwyciezcy jako funkcja zaplaty (web `balanceFor`, closure). Dwie postacie do wektorow.
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PeaceBalanceShape {
    /// `balance0 + slope * c`.
    Linear { balance0: f64, slope: f64 },
    /// `c <= knee ? balance0 + slope*c : balance0 + slope*knee + slope2*(c-knee)`.
    Kinked {
        balance0: f64,
        slope: f64,
        knee: f64,
        slope2: f64,
    },
}

impl PeaceBalanceShape {
    pub fn balance_for(&self, covered_pn: f64) -> f64 {
        match *self {
            PeaceBalanceShape::Linear { balance0, slope } => balance0 + slope * covered_pn,
            PeaceBalanceShape::Kinked {
                balance0,
                slope,
                knee,
                slope2,
            } => {
                if covered_pn <= knee {
                    balance0 + slope * covered_pn
                } else {
                    balance0 + slope * knee + slope2 * (covered_pn - knee)
                }
            }
        }
    }
}

/// Wycena z `price(winner, loser, kind)`: wymagane PW, tolerancja, bilans.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PeacePriceQuote {
    pub required_pn: f64,
    pub tolerance_pn: f64,
    pub balance: PeaceBalanceShape,
}

/// Web `assets(loser, winner, skipCityIds)` jako closure (alias: czytelnosc sygnatury).
pub type AiPeaceAssetsFn<'a> = dyn Fn(i64, i64, &HashSet<String>) -> Vec<PeaceAsset> + 'a;

/// Zaleznosci ticka (odpowiednik `AiPeaceTickDeps`; `store`, `pay`, `finalize`, `log` podawane osobno).
pub struct AiPeaceTickEnv<'a> {
    pub turn: f64,
    pub limit: Option<f64>,
    /// Web `pairEligible(a, b)`.
    pub pair_eligible: &'a dyn Fn(i64, i64) -> bool,
    /// Web `requesterShareOf(requester, other)`.
    pub requester_share_of: &'a dyn Fn(i64, i64) -> f64,
    /// Web `gateVerdict(winner, loser)`.
    pub gate_verdict: &'a dyn Fn(i64, i64) -> GateVerdict,
    /// Web `price(winner, loser, kind)`.
    pub price: &'a dyn Fn(i64, i64, AiPeaceKind) -> PeacePriceQuote,
    /// Web `assets(loser, winner, skipCityIds)`.
    pub assets: &'a AiPeaceAssetsFn<'a>,
    /// Web `cityCessionOk(cityId, loser, winner)`.
    pub city_cession_ok: &'a dyn Fn(&str, i64, i64) -> bool,
    /// Web `battlePending`.
    pub battle_pending: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AiPeaceTickAction {
    Wait,
    AcceptPaid,
    Force,
    DroppedIneligible,
    DroppedNotLosing,
}

impl AiPeaceTickAction {
    pub fn name(self) -> &'static str {
        match self {
            AiPeaceTickAction::Wait => "wait",
            AiPeaceTickAction::AcceptPaid => "accept_paid",
            AiPeaceTickAction::Force => "force",
            AiPeaceTickAction::DroppedIneligible => "dropped_ineligible",
            AiPeaceTickAction::DroppedNotLosing => "dropped_not_losing",
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct AiPeaceTickOutcome {
    pub pair_key: String,
    pub action: AiPeaceTickAction,
    pub kind: AiPeaceKind,
    pub plan: Option<PeacePaymentPlan>,
    pub decision: Option<AiPeaceDecision>,
}

/// Web `runAiAiPeaceTick(d)`. `pay`, `finalize`, `log` = callbacki zapisu (w TS `d.pay`, `d.finalize`, `d.log`).
pub fn run_ai_ai_peace_tick(
    store: &mut AiPeaceRequestStore,
    env: &AiPeaceTickEnv,
    pay: &mut dyn FnMut(i64, i64, &PeacePaymentPlan),
    finalize: &mut dyn FnMut(i64, i64, AiPeaceKind),
    log: &mut dyn FnMut(&str),
) -> Vec<AiPeaceTickOutcome> {
    let mut out = Vec::new();
    let snapshot: Vec<(String, AiPeaceRequest)> = store.entries().to_vec();
    for (key, req) in snapshot {
        let loser = req.requester_id;
        let winner = req.other_id;
        let kind = req.kind;
        if !(env.pair_eligible)(loser, winner) {
            store.delete(&key);
            out.push(AiPeaceTickOutcome {
                pair_key: key,
                action: AiPeaceTickAction::DroppedIneligible,
                kind,
                plan: None,
                decision: None,
            });
            continue;
        }
        if !is_still_losing((env.requester_share_of)(loser, winner)) {
            store.delete(&key);
            out.push(AiPeaceTickOutcome {
                pair_key: key,
                action: AiPeaceTickAction::DroppedNotLosing,
                kind,
                plan: None,
                decision: None,
            });
            continue;
        }
        let price = (env.price)(winner, loser, kind);
        let mut skip: HashSet<String> = HashSet::new();
        let plan_for = |skip: &HashSet<String>| -> PeacePaymentPlan {
            let assets: Vec<PeaceAsset> = (env.assets)(loser, winner, skip)
                .into_iter()
                .map(|a| {
                    if env.battle_pending && a.kind == PeaceAssetKind::Miasto {
                        PeaceAsset {
                            forbidden: true,
                            ..a
                        }
                    } else {
                        a
                    }
                })
                .collect();
            plan_peace_payment(price.required_pn, &assets)
        };
        let mut plan = plan_for(&skip);
        for _guard in 0..8 {
            let city_id = match plan.items.iter().find(|i| i.kind == PeaceAssetKind::Miasto) {
                Some(item) => item.id.clone(),
                None => break,
            };
            if (env.city_cession_ok)(&city_id, loser, winner) {
                break;
            }
            skip.insert(city_id);
            plan = plan_for(&skip);
        }
        let decision = decide_ai_peace_request(&AiPeaceDecisionInput {
            req: &req,
            turn: env.turn,
            plan: &plan,
            balance_before_pn: price.balance.balance_for(0.0),
            balance_after_pn: price.balance.balance_for(plan.covered_pn),
            tolerance_pn: price.tolerance_pn,
            winner_gate_verdict: (env.gate_verdict)(winner, loser),
            limit: env.limit,
        });
        if decision.action == AiPeaceAction::Wait {
            out.push(AiPeaceTickOutcome {
                pair_key: key,
                action: AiPeaceTickAction::Wait,
                kind,
                plan: Some(plan),
                decision: Some(decision),
            });
            continue;
        }
        pay(loser, winner, &plan);
        let hist = plan.histogram;
        log(&format!(
            "pokój AI{loser}↔AI{winner} [{kind}] ({action}, tury od prośby {turns}); \
             bilans zwycięzcy przed {before} -> po {after}; zapłata \
             zloto={z} surowce={s} miasto={m} ({covered}/{required} PW)",
            kind = kind.name(),
            action = decision.action.name(),
            turns = js_num(decision.turns_since),
            before = js_num(decision.balance_before),
            after = js_num(decision.balance_after),
            z = hist.zloto,
            s = hist.surowiec_ilosc,
            m = hist.miasto,
            covered = js_num(plan.covered_pn),
            required = js_num(price.required_pn),
        ));
        finalize(loser, winner, kind);
        store.delete(&key);
        let action = match decision.action {
            AiPeaceAction::AcceptPaid => AiPeaceTickAction::AcceptPaid,
            _ => AiPeaceTickAction::Force,
        };
        out.push(AiPeaceTickOutcome {
            pair_key: key,
            action,
            kind,
            plan: Some(plan),
            decision: Some(decision),
        });
    }
    out
}
