//! R-RUSTPORT-REPIN-DYPLOMACJA-ROZEJM-5-10-15-Q1 (runda 3): PODPIECIE rozejmu 5/10/15 w zywej sciezce
//! propozycji (`diplomacy.rs::evaluate_proposal_with_params` + `ProposalAction::Truce`) oraz stan pary
//! (`PairMetaWeb`) przez `TruceDiplomacy` — nosnik stanu dyplomacji z implementacja `TruceEndPorts`.
//!
//! web (pin origin/main 638e90bea): `main.ts` `finalizePeaceTreatyBetween` (~:11678-11745: Z9, (C) 0 Zaufania za
//! rozejm, startTruce = `truceUntilTurn` + `truceInitiatorId`), `truceEndPorts` (~:11845), `tickTruceExpiries`
//! (~:11887), `chargeWarDeclarationCredibility` (~:11940-11985: Z8 okno rozejmu/oferty = zlamanie, kasowanie oferty),
//! odmowa oferty pokoju po rozejmie (`main.ts:21056`).
//!
//! ZALOZENIA:
//! - ZALOZENIE-R3-A: baza PW rozejmu = 200 (web `diplomacy-acceptance-points.json`, klucz `rozejm`); stala tutaj,
//!   zeby nie zmieniac struktury `DiplomacyParams`. Rozejm dzieli cala galaz bramek pokoju (jak web).
//! - ZALOZENIE-R3-B: kara Z8 jest rejestrowana jako zdarzenie Wiarygodnosci `zlamanie_paktu_nap` w
//!   `credibility_events` (wartosc N2 z danych cywilizacji nalicza wolajacy); ten modul nie zna rejestru
//!   Wiarygodnosci silnika.
//! - ZALOZENIE-R3-C: poza zakresem R3 (dlug do WIRE-WAR W6): wolanie `tick` z petli tury swiata,
//!   `ai_truce_or_peace_mode` w decyzji AI, L11 (kontroferta zmienia dlugosc).
//! - ZALOZENIE-R3-D: miara armii = wartosc `army_m` wstrzykiwana przez wolajacego (web: `sumArmyMForOwner`,
//!   nominalna; panel uzywa wariantu Effective — rozbieznosc jak w webie).

use std::collections::{BTreeMap, BTreeSet};

use crate::domain::diplomacy::{
    apply_accepted_proposal, apply_diplomatic_event, evaluate_proposal_with_params,
    CivilizationPair, DiplomacyParams, DiplomacyState, DiplomaticEvent, DiplomaticProposal,
    ProposalAction, ProposalEvalContext, ProposalEvaluation, Relation, RelationStatus,
    ValueCatalog,
};
use crate::domain::diplomacy_truce::{
    is_truce_active, normalize_truce_duration, start_peace_treaty_lock, truce_until_turn,
    PairMetaWeb, TruceEndOfferWeb, TRUCE_DEFAULT_TURNS,
};
use crate::domain::diplomacy_truce_end::{
    clear_truce_end_offer_core, truce_end_tick_pair, truce_end_to_war_core, PairTruceMeta,
    TruceEndOffer, TruceEndPorts,
};
use crate::domain::ids::PlayerId;

/// Web `diplomacy-acceptance-points.json`: `rozejm.punkty` (ZALOZENIE-R3-A).
pub const TRUCE_BASE_PN: f64 = 200.0;

/// Zdarzenie Wiarygodnosci zarejestrowane przez Z8 (ZALOZENIE-R3-B).
pub const CREDIBILITY_EVENT_TRUCE_BREACH: &str = "zlamanie_paktu_nap";

/// Wpis oferty pokoju po rozejmie w skrzynce gracza (web: `pendingDiplomacyInbox`).
#[derive(Debug, Clone, PartialEq)]
pub struct InboxOffer {
    pub id: String,
    pub owner: PlayerId,
    pub reason: String,
}

/// Nosnik stanu dyplomacji rozejmu: relacje + umowy (`DiplomacyState`), meta par (`PairMetaWeb`),
/// armie (moc), gracze-ludzie i skrzynka ofert.
#[derive(Debug, Clone, Default)]
pub struct TruceDiplomacy {
    pub diplomacy: DiplomacyState,
    pub pair_meta: BTreeMap<CivilizationPair, PairMetaWeb>,
    pub army_m: BTreeMap<PlayerId, f64>,
    pub humans: BTreeSet<PlayerId>,
    /// Web `isBarbarian` (R3: gate Z8 — barbarzyncy poza kara i poza wojna).
    pub barbarians: BTreeSet<PlayerId>,
    pub inbox: Vec<InboxOffer>,
    pub credibility_events: Vec<(PlayerId, &'static str)>,
    /// Biezaca tura (ustawiana przez `tick` / `propose`; uzywana przez `finalize_peace` z portu).
    pub turn: f64,
}

fn pid(value: f64) -> Option<PlayerId> {
    if value.is_finite() && value >= 0.0 {
        Some(PlayerId::new(value as u64))
    } else {
        None
    }
}

impl TruceDiplomacy {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn status(&self, a: PlayerId, b: PlayerId) -> RelationStatus {
        self.diplomacy
            .relation(a, b)
            .map(|r| r.status)
            .unwrap_or(RelationStatus::Neutral)
    }

    pub fn relation(&self, a: PlayerId, b: PlayerId) -> Relation {
        self.diplomacy
            .relation(a, b)
            .cloned()
            .unwrap_or_else(Relation::starting)
    }

    pub fn set_status(&mut self, a: PlayerId, b: PlayerId, status: RelationStatus) {
        let mut r = self.relation(a, b);
        r.status = status;
        self.diplomacy.set_relation(CivilizationPair::new(a, b), r);
    }

    pub fn pair_meta_of(&self, a: PlayerId, b: PlayerId) -> PairMetaWeb {
        self.pair_meta
            .get(&CivilizationPair::new(a, b))
            .cloned()
            .unwrap_or_default()
    }

    pub fn set_pair_meta(&mut self, a: PlayerId, b: PlayerId, meta: PairMetaWeb) {
        self.pair_meta.insert(CivilizationPair::new(a, b), meta);
    }

    /// Web `finalizePeaceTreatyBetween(proposer, responder, undefined, truceTurns)` (zakres rozejmu).
    /// `truce_turns = Some(x)` z `x` spoza 5/10/15 -> `false`, nic sie nie zmienia (Z9).
    /// `None` = pokoj staly (+5 Zaufania, blokada DOW); `Some(5|10|15)` = rozejm (0 Zaufania, `truceUntilTurn`).
    pub fn finalize_peace_between(
        &mut self,
        proposer: PlayerId,
        responder: PlayerId,
        turn: f64,
        truce_turns: Option<f64>,
    ) -> bool {
        if truce_turns.is_some() && normalize_truce_duration(truce_turns).is_none() {
            return false;
        }
        let cur = self.relation(proposer, responder);
        let meta = self.pair_meta_of(proposer, responder);
        let is_truce = truce_turns.is_some();
        if is_truce {
            // (C) rozejm = tylko zmiana statusu, 0 Zaufania.
            let mut next = cur;
            next.status = RelationStatus::Peace;
            self.diplomacy
                .set_relation(CivilizationPair::new(proposer, responder), next);
            let mut m = meta;
            m.peace_until_turn = None;
            m.n3_window = None;
            m.truce_until_turn = truce_until_turn(turn, truce_turns.unwrap_or(TRUCE_DEFAULT_TURNS));
            m.truce_initiator_id = Some(proposer.get() as f64);
            m.truce_end_offer = None;
            self.set_pair_meta(proposer, responder, m);
        } else {
            let next = apply_diplomatic_event(&cur, DiplomaticEvent::Peace);
            self.diplomacy
                .set_relation(CivilizationPair::new(proposer, responder), next);
            if let Some(offer) = meta.truce_end_offer.as_ref() {
                if let Some(id) = offer.inbox_id.as_deref() {
                    self.inbox.retain(|e| e.id != id);
                }
            }
            let mut m = meta;
            m.truce_initiator_id = None;
            m.truce_end_offer = None;
            m.truce_until_turn = None;
            let locked = start_peace_treaty_lock(&m, turn, None);
            self.set_pair_meta(proposer, responder, locked);
        }
        true
    }

    /// Zywa sciezka propozycji: `evaluate_proposal_with_params` (Z9, bramki PW pokoju) -> przy akceptacji
    /// `Peace` = pokoj staly, `Truce` = rozejm 5/10/15 (domyslnie 10), pozostale = umowy (`apply_accepted_proposal`).
    pub fn propose(&mut self, proposal: &DiplomaticProposal, turn: u32) -> ProposalEvaluation {
        self.turn = f64::from(turn);
        let relation = self.relation(proposal.proposer_owner_id, proposal.responder_owner_id);
        let ctx = ProposalEvalContext::new(relation, turn);
        let eval = evaluate_proposal_with_params(
            proposal,
            &ctx,
            DiplomacyParams::default(),
            ValueCatalog::default(),
        );
        if !eval.accepted {
            return eval;
        }
        let (p, r) = (proposal.proposer_owner_id, proposal.responder_owner_id);
        match proposal.action {
            ProposalAction::Peace => {
                self.finalize_peace_between(p, r, self.turn, None);
            }
            ProposalAction::Truce => {
                let len = proposal.payload.turns.unwrap_or(TRUCE_DEFAULT_TURNS);
                self.finalize_peace_between(p, r, self.turn, Some(len));
            }
            _ => {
                self.diplomacy.deals = apply_accepted_proposal(&self.diplomacy.deals, &eval);
            }
        }
        eval
    }

    /// Web `tickTruceExpiries`: jeden tick wszystkich par (raz na ture), `ids` posortowane rosnaco.
    pub fn tick(&mut self, turn: f64, ids: &[PlayerId]) {
        self.turn = turn;
        for i in 0..ids.len() {
            for j in (i + 1)..ids.len() {
                truce_end_tick_pair(self, ids[i], ids[j], turn);
            }
        }
    }

    /// Wpisy skrzynki gracza dla oferty pokoju po rozejmie.
    pub fn offers_for(&self, owner_of_offer: PlayerId) -> Vec<&InboxOffer> {
        self.inbox
            .iter()
            .filter(|e| e.owner == owner_of_offer)
            .collect()
    }

    /// Odpowiedz adresata na oferte pokoju po rozejmie: zgoda = pokoj staly, odmowa = wojna (bez kary).
    /// Zwraca `false`, gdy nie ma oferty zaadresowanej do `responder` w tej parze.
    pub fn respond_to_truce_end_offer(
        &mut self,
        responder: PlayerId,
        initiator: PlayerId,
        accept: bool,
        turn: f64,
    ) -> bool {
        let meta = self.pair_meta_of(responder, initiator);
        let Some(offer) = meta.truce_end_offer.as_ref() else {
            return false;
        };
        if pid(offer.to_owner_id) != Some(responder) {
            return false;
        }
        self.turn = turn;
        if accept {
            self.finalize_peace_between(initiator, responder, turn, None);
        } else {
            truce_end_to_war_core(self, responder, initiator);
        }
        true
    }

    /// Web `chargeWarDeclarationCredibility` (czesc rozejmu): Z8 — wypowiedzenie wojny w oknie aktywnego
    /// rozejmu LUB oferty pokoju po rozejmie = zlamanie (kara). Kasuje oferte, czysci rozejm i inicjatora,
    /// ustawia wojne. Zwraca `true`, gdy bylo zlamanie.
    /// Web `chargeWarDeclarationCredibility` bez odwetu (`skipN2 = false`): kara Z8 naliczana.
    pub fn declare_war(&mut self, declarer: PlayerId, target: PlayerId, turn: f64) -> bool {
        self.declare_war_opts(declarer, target, turn, false)
    }

    /// Web `chargeWarDeclarationCredibility(declarer, target, { skipN2AllianceDefense })`.
    /// `skip_n2` = odwet (`isCredibilityRetaliation`) albo `skipN2AllianceDefense` — wtedy kara Z8
    /// NIE jest naliczana (web: blok `if (!skipN2)`). Zwraca okno rozejmu/oferty (web: `truceBreach`).
    /// Barbarzynca po ktorejkolwiek stronie = brak efektu (web: wczesny `return false`).
    pub fn declare_war_opts(
        &mut self,
        declarer: PlayerId,
        target: PlayerId,
        turn: f64,
        skip_n2: bool,
    ) -> bool {
        if self.barbarians.contains(&declarer) || self.barbarians.contains(&target) {
            return false;
        }
        let meta = self.pair_meta_of(declarer, target);
        let breach = is_truce_active(meta.truce_until_turn, turn) || meta.truce_end_offer.is_some();
        if breach && !skip_n2 {
            self.credibility_events
                .push((declarer, CREDIBILITY_EVENT_TRUCE_BREACH));
        }
        clear_truce_end_offer_core(self, declarer, target);
        let mut m = self.pair_meta_of(declarer, target);
        m.truce_until_turn = None;
        m.truce_initiator_id = None;
        m.wojna_od_tury = Some(turn);
        m.n1_zastosowany = Some(false);
        self.set_pair_meta(declarer, target, m);
        let cur = self.relation(declarer, target);
        let next = apply_diplomatic_event(&cur, DiplomaticEvent::DeclareWar);
        self.diplomacy
            .set_relation(CivilizationPair::new(declarer, target), next);
        breach
    }
}

impl TruceEndPorts<PlayerId> for TruceDiplomacy {
    fn meta(&self, a: PlayerId, b: PlayerId) -> PairTruceMeta<PlayerId> {
        let m = self.pair_meta_of(a, b);
        PairTruceMeta {
            truce_until: m.truce_until_turn,
            initiator: m.truce_initiator_id.and_then(pid),
            offer: m.truce_end_offer.and_then(|o| {
                Some(TruceEndOffer {
                    turn: o.turn,
                    from: pid(o.from_owner_id)?,
                    to: pid(o.to_owner_id)?,
                    inbox_id: o.inbox_id,
                })
            }),
        }
    }

    fn set_meta(&mut self, a: PlayerId, b: PlayerId, meta: PairTruceMeta<PlayerId>) {
        let mut m = self.pair_meta_of(a, b);
        m.truce_until_turn = meta.truce_until;
        m.truce_initiator_id = meta.initiator.map(|p| p.get() as f64);
        m.truce_end_offer = meta.offer.map(|o| TruceEndOfferWeb {
            turn: o.turn,
            from_owner_id: o.from.get() as f64,
            to_owner_id: o.to.get() as f64,
            inbox_id: o.inbox_id,
        });
        self.set_pair_meta(a, b, m);
    }

    fn status_is_peace(&self, a: PlayerId, b: PlayerId) -> bool {
        self.status(a, b) == RelationStatus::Peace
    }

    fn army_m(&self, owner: PlayerId) -> f64 {
        self.army_m.get(&owner).copied().unwrap_or(0.0)
    }

    fn is_human(&self, owner: PlayerId) -> bool {
        self.humans.contains(&owner)
    }

    fn declare_war_after_truce(&mut self, a: PlayerId, b: PlayerId) {
        let cur = self.relation(a, b);
        let next = apply_diplomatic_event(&cur, DiplomaticEvent::DeclareWar);
        self.diplomacy
            .set_relation(CivilizationPair::new(a, b), next);
    }

    fn enqueue_offer(&mut self, owner: PlayerId, reason: &str) -> String {
        let id = format!(
            "diplo-truce-end-{}-{}-{}",
            owner.get(),
            self.turn,
            self.inbox.len()
        );
        self.inbox.push(InboxOffer {
            id: id.clone(),
            owner,
            reason: reason.to_owned(),
        });
        id
    }

    fn remove_offer(&mut self, inbox_id: &str) {
        self.inbox.retain(|e| e.id != inbox_id);
    }

    fn finalize_peace(&mut self, proposer: PlayerId, responder: PlayerId) {
        self.finalize_peace_between(proposer, responder, self.turn, None);
    }
}
