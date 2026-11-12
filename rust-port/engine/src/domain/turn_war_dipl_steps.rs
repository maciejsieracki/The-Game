//! P6-WIRE-WAR-R7K7 (W8 r7 klocek K7): kroki dyplomacji D1-D7 pinu WEWNATRZ fazy Diplomacy `run_war_turn`.
//!
//! Pin (tylko odczyt) `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, `gra/src/main.ts` `runDiplomacyTurnTick`
//! (:24229-24331). Kolejnosc krokow wzgledem siebie jak na pinie; wszystkie wykonuja sie PRZED tickiem relacji
//! par i hamulcem (D8, `turn_war_pipeline.rs`), czyli tak jak na pinie (D8 jest ostatni). Kolejnosc FAZ
//! (wariant B, `events.rs:44`) bez zmian: ten modul nie dodaje fazy.
//!
//! Tabela krok -> funkcja -> status (szczegoly: raport `01-operator-r*.md`):
//! - D1 `expireTreaties` (:24231) -> `DiplomacyState::expire_deals` (is_active_at = `wygasaTura > turn`): WPIETE.
//! - D2 finisz wiarygodnosci wygaslych traktatow (:24233-24270) -> `credibility::expiry_finish_events`: WPIETE
//!   (R-RUSTPORT-P6-WIRE-WAR-CRED-Q1): zdarzenia P1-P3 sa ZAPISYWANE do rejestru wiarygodnosci
//!   (`credibility::CredibilityRegistry`, klucze `meta.wiarygodnosc*` w `opaque`), a lista zlecen w raporcie
//!   (`credibility_requests`) zostaje jako dziennik (tak samo kary N6 z D3).
//! - D3 `tickCyclicResourceTradeDeals` (:24077) -> `tick_cyclic_resource_trade_deals` (uzywa
//!   `transfer_quantity_resource`, `normalize_resource_quantity`; `build_cyclic_resource_transfers` to BUDOWNICZY
//!   transferow z koszyka przy zawarciu umowy, NIE tick tury; w tym kroku nie jest wolany): WPIETE.
//!   Poza zakresem (jawnie): bonus zaufania P7 (`applyDiploP7Bonuses`, brak magazynu `diplomacyTradeStreak`)
//!   i powiadomienia UI.
//! - D4 `updateWiarygodnoscStreamsThisTurn` (:24184) + `tickWiarygodnoscBezWojnyMilestone` (:12058, petla
//!   `allWiarygodnoscOwnerIds()` :24273): WPIETE w kolejnosci pinu: po D3 (`tickCyclicResourceTradeDeals`), przed D5
//!   (`tickTruceExpiries`). Trudnosc (`_menuDifficulty`) = `DiplStepsInputs::difficulty` (domyslnie normalna jak
//!   `default:` w webie); wlasciciele P4 = `owner_ids` bez `credibility_excluded_owners` (barbarzyncy, §1).
//!   Hak "wojna zeruje licznik P4" (`main.ts:12223`) to `CredibilityRegistry::note_war_entered`: WPIETY od
//!   R-RUSTPORT-P6-CRED-WOJNA-Q1 w `note_war_declarations`, wolany w `run_war_turn` PO hamulcu D8 dla par z
//!   `BrakePhaseOutput::declarations` (wojny z progu, AI-AI i gracz-AI z `may_declare`). Deklaracje wojny
//!   wymuszonej (W3, `war_turn_declare.rs`) i wypowiedzenia z sojuszu/klastra NIE sa tu wpiete (web: poza
//!   `chargeWarDeclarationCredibility` tego kroku; sciezki alians/klaster = NIE_ZMIERZONO, patrz raport).
//! - D5 `tickTruceExpiries` (:12122) -> `truce_end_tick_pair` na `TruceDiplomacy` (porty z `diplomacy_truce_flow`):
//!   WPIETE (`truce_expiry_action` jest wolane wewnatrz `truce_end_tick_pair`).
//! - D6 `tickDiplomacyPayments` + zerwania za danine (:24275-24298) -> `tick_diplomacy_payments`,
//!   `tribute_break_pairs`: WPIETE (port 1:1 `diplomacy-economy.ts`), z wektorami z pinu.
//! - `deactivateZlozeGrantsForDeal` (pin w `runDiplomacyTurnTick`: :24234 dla wygaslych, :24294 dla zerwanych w D6;
//!   poza tym tick: :22774 `breakTreatyVoluntarily`, :23694 `breakTreatiesOnWar`): BRAK. Pin trzyma
//!   `zlozeGrants` w stanie gry (`zlozeGrants = deactivateZlozeGrantsForDeal(...)`), a w Rust nie ma modelu ani
//!   portu zlozeGrants (grep `zloze_grant|ZlozeGrant|zlozeGrant` w `engine/src` = pusty). Wywolanie nie jest
//!   wpiete; luka jawna, nie ciche zero.
//! - D7 dobra wola: galaz z hamulcem (flaga ON, domyslna na pinie) wpieta wczesniej w `run_brake_phase`;
//!   galaz bez hamulca (`tickDobraWolaOnRelation`) = `tick_dobra_wola_on_relation`, wolana tylko gdy
//!   `DiplStepsInputs::brake_flag_off` (na pinie `DIPLO_TICK_WAR_BRAKE_ENABLED_DEFAULT = true`, wylaczenie tylko w
//!   testach). `syncRelationFromDeals` (:24319) dla kontaktow gracza: `sync_relation_from_deals`.
//!
//! Efekty na zasoby poza `WarTurnState` (zapasy miast, skarbce, pula Pracy) NIE sa stosowane do `PlayableState`
//! (poza allowlista klocka): raport niesie `city_resources` (stan po D3), `treasury_deltas`, `praca_deltas`
//! (tak samo jak `declarations` w hamulcu). Stan wlasciciela (`war.diplomacy`, meta par, skrzynka, liczniki
//! dostaw) jest zmieniany w miejscu, atomowo: blad = zadnej zmiany.
//!
//! BRAK CICHYCH ZER: brak skarbca / puli Pracy / mocy armii wlasciciela, ktorego krok faktycznie potrzebuje,
//! daje `WarTurnError::DiplStep` z powodem (wejscie sprawdzane leniwie: tylko gdy dane wchodza do decyzji).

use std::cell::RefCell;
use std::collections::{BTreeMap, BTreeSet};

use serde_json::{json, Value};

use super::credibility::{
    expiry_finish_events, stream_active_tuples, stream_kind_of, CredibilityEvent,
    CredibilityParams, CredibilityRegistry, StreamActive, StreamDeal,
};
use super::diplomacy::{
    normalize_resource_quantity, transfer_quantity_resource, ActiveDeal, CityResourceState,
    CivilizationPair, DiplomacyState, DiplomaticEvent, PaymentKind, RelationStatus, TreatyKind,
};
use super::diplomacy_truce::{pair_meta_from_save, PairMetaWeb};
use super::diplomacy_truce_end::{truce_end_tick_pair, PairTruceMeta, TruceEndPorts};
use super::diplomacy_truce_flow::{InboxOffer, TruceDiplomacy};
use super::ids::PlayerId;
use super::turn_war_pipeline::WarTurnError;
use super::types::Difficulty;
use super::war_turn_state::WarTurnState;

/// Klucze `opaque` (web `meta`).
pub const KEY_PAIR_META: &str = "diplomacyPairMeta";
pub const KEY_INBOX: &str = "pendingDiplomacyInbox";

/// Web `BARBARIAN_COOPERATION_TURNS` (`diplomacy-barbarian-cooperation.ts:21`).
pub const BARBARIAN_COOPERATION_TURNS: f64 = 3.0;

/// Wejscia krokow D1-D7 od producentow. Pusty (`Default`) = brak umow/skrzynki wymaga zero wejsc.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct DiplStepsInputs {
    /// `true` = flaga hamulca OFF (galaz `tickDobraWolaOnRelation`). Domyslnie `false` = ON (pin).
    pub brake_flag_off: bool,
    /// Skarbce wlascicieli (web `ownerTreasury`). Brak wpisu = producent nieobecny (blad przy uzyciu).
    pub treasury: BTreeMap<i64, f64>,
    /// Pule Pracy wlascicieli (web `ownerPracaPool`). Brak wpisu = blad przy uzyciu.
    pub praca_pool: BTreeMap<i64, f64>,
    /// Zapasy miast (web `city.surowce`). `None` = producent nieobecny (blad, gdy sa umowy cykliczne).
    pub cities: Option<Vec<CityResourceState>>,
    /// Stolica wlasciciela (web `capitalCityIdForOwner`); brak wpisu = `None` jak w webie.
    pub capital_city: BTreeMap<i64, String>,
    /// Moc armii (web `sumArmyMForOwner`) per wlasciciel; wymagana, gdy rozejm AI-AI wygasa.
    pub army_m: BTreeMap<i64, f64>,
    /// Trudnosc gry (web `_menuDifficulty`): start/wagi strumieni wiarygodnosci. Domyslnie normalna (jak `default:`
    /// w webie). Uwaga: `StartGameParams.difficulty` nie jest jeszcze zmapowane przez producenta (BRAK).
    pub difficulty: Difficulty,
    /// Wlasciciele bez wiarygodnosci (barbarzyncy, web `allWiarygodnoscOwnerIds` ich pomija) - wykluczeni z P4.
    pub credibility_excluded_owners: BTreeSet<i64>,
}

/// Zlecenie zdarzenia wiarygodnosci (D2 / N6 z D3): dziennik w raporcie; zdarzenie jest tez zapisywane do rejestru.
#[derive(Debug, Clone, PartialEq)]
pub struct CredibilityRequest {
    pub owner: i64,
    pub kind: &'static str,
    pub value: f64,
}

/// Wynik jednej pozycji handlu cyklicznego.
#[derive(Debug, Clone, PartialEq)]
pub struct CyclicOutcome {
    pub deal_id: String,
    pub index: usize,
    pub delivered: bool,
}

/// Wynik D6.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct PaymentsResult {
    pub paid: Vec<String>,
    pub broken: Vec<String>,
    pub messages: Vec<String>,
}

/// Raport krokow D1-D7.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct DiplStepsReport {
    pub expired_deals: Vec<String>,
    pub credibility_requests: Vec<CredibilityRequest>,
    /// Aktywne zobowiazania strumienia S1-S4 tej tury (D4), w kolejnosci pinu.
    pub credibility_stream_active: Vec<StreamActive>,
    /// Pary `(a, b)` i tura konca karencji (`recordBarbarianCooperationGrace`), do zastosowania przez wolajacego.
    pub barbarian_grace: Vec<(i64, i64, f64)>,
    pub cyclic: Vec<CyclicOutcome>,
    /// Zapasy miast po D3 (`None` = brak umow cyklicznych, nic do zastosowania).
    pub city_resources: Option<Vec<CityResourceState>>,
    pub treasury_deltas: BTreeMap<i64, f64>,
    pub praca_deltas: BTreeMap<i64, f64>,
    pub truce_pairs_changed: Vec<(i64, i64)>,
    pub payments: PaymentsResult,
    /// Pary (platnik, odbiorca), ktorym nalozono `trybut_odmowa` (casus belli po zerwaniu danin).
    pub tribute_breaks: Vec<(i64, i64)>,
    pub dobra_wola_off_ticked: Vec<(i64, i64)>,
    pub synced_status: Vec<(i64, i64)>,
}

fn pid(id: i64) -> PlayerId {
    PlayerId::new(id.max(0) as u64)
}

fn err(msg: String) -> WarTurnError {
    WarTurnError::DiplStep(msg)
}

// ---------------------------------------------------------------------------------------------
// D6: port 1:1 `gra/src/game/diplomacy-economy.ts` (activeDealsToPaymentDeals, tickDiplomacyPayments,
// tributeBreakPairsFromDeals).
// ---------------------------------------------------------------------------------------------

/// Web `TributeDeal` (`kind: 'tribute'`).
#[derive(Debug, Clone, PartialEq)]
pub struct TributeDeal {
    pub id: String,
    pub payer: i64,
    pub receiver: i64,
    pub per_turn: f64,
    pub until: Option<f64>,
}

/// Skarbiec jako adapter (web `TreasuryAdapter`); blad = brak producenta dla wlasciciela.
pub trait Treasury {
    fn balance(&self, owner: i64) -> Result<f64, WarTurnError>;
    fn add(&mut self, owner: i64, delta: f64) -> Result<(), WarTurnError>;
}

/// Web `activeDealsToPaymentDeals`: pomija `handelJednorazowy`, brak/<=0 kwoty i wygasle (`turn > doTury`).
pub fn active_deals_to_payment_deals(deals: &[ActiveDeal], turn: f64) -> Vec<TributeDeal> {
    let mut out = Vec::new();
    for d in deals {
        if d.one_shot_trade {
            continue;
        }
        let Some(eco) = d.economy else { continue };
        if eco.money_per_turn <= 0.0 {
            continue;
        }
        let until = d.expires_turn.map(f64::from);
        if until.is_some_and(|u| turn > u) {
            continue;
        }
        out.push(TributeDeal {
            id: d.id.clone(),
            payer: eco.payer_owner_id.get() as i64,
            receiver: eco.receiver_owner_id.get() as i64,
            per_turn: eco.money_per_turn,
            until,
        });
    }
    out
}

/// Web `tickDiplomacyPayments` (tylko ksztalt `tribute`; handel `trade` nie wchodzi z `activeDealsToPaymentDeals`).
pub fn tick_diplomacy_payments(
    deals: &[TributeDeal],
    treasury: &mut dyn Treasury,
    turn: f64,
) -> Result<PaymentsResult, WarTurnError> {
    let mut res = PaymentsResult::default();
    for deal in deals {
        if deal.until.is_some_and(|u| turn > u) {
            continue;
        }
        let amount = deal.per_turn;
        if amount <= 0.0 {
            continue;
        }
        let balance = treasury.balance(deal.payer)?;
        if balance < amount {
            res.broken.push(deal.id.clone());
            res.messages.push(format!(
                "Trybut zerwany ({}): brak {} ¤ u gracza {}",
                deal.id, amount, deal.payer
            ));
            continue;
        }
        treasury.add(deal.payer, -amount)?;
        treasury.add(deal.receiver, amount)?;
        res.paid.push(deal.id.clone());
        res.messages.push(format!(
            "Trybut {} ¤: {} → {}",
            amount, deal.payer, deal.receiver
        ));
    }
    Ok(res)
}

/// Web `tributeBreakPairsFromDeals`: `(deal_id, platnik, odbiorca)` dla zerwanych danin (kolejnosc `deals`).
pub fn tribute_break_pairs(deals: &[ActiveDeal], broken: &[String]) -> Vec<(String, i64, i64)> {
    if broken.is_empty() {
        return Vec::new();
    }
    let drop: BTreeSet<&str> = broken.iter().map(String::as_str).collect();
    let mut out = Vec::new();
    for d in deals {
        if !drop.contains(d.id.as_str()) {
            continue;
        }
        let Some(eco) = d.economy else { continue };
        if eco.money_per_turn <= 0.0 {
            continue;
        }
        out.push((
            d.id.clone(),
            eco.payer_owner_id.get() as i64,
            eco.receiver_owner_id.get() as i64,
        ));
    }
    out
}

// ---------------------------------------------------------------------------------------------
// D7: `tickDobraWolaOnRelation` (diplomacy-pn-engine.ts:313) i `syncRelationFromDeals` (main.ts:22832).
// ---------------------------------------------------------------------------------------------

/// Web `tickDobraWolaOnRelation`: `(nowe zaufanie, nowy licznik, przyrost)`. Zaufanie ograniczone do [0, 100].
pub fn tick_dobra_wola_on_relation(trust: f64, remaining: f64) -> (f64, f64, f64) {
    if remaining <= 0.0 {
        return (trust, remaining, 0.0);
    }
    ((trust + 1.0).clamp(0.0, 100.0), remaining - 1.0, 1.0)
}

/// Web `syncRelationFromDeals`: poza wojna sojusz (traktat sojuszu) -> `sojusz`, inaczej NAP -> `pokoj`.
/// Zwraca `true`, gdy status sie zmienil lub zostal ustawiony.
pub fn sync_relation_from_deals(state: &mut DiplomacyState, a: PlayerId, b: PlayerId) -> bool {
    let mut rel = state.relation(a, b).cloned().unwrap_or_default();
    if rel.status == RelationStatus::War {
        return false;
    }
    let pair = CivilizationPair::new(a, b);
    let has_alliance = state
        .deals
        .iter()
        .any(|d| d.parties == pair && d.kind.is_alliance());
    let has_nap = state.has_deal(a, b, Some(TreatyKind::Nap));
    let target = if has_alliance {
        RelationStatus::Alliance
    } else if has_nap {
        RelationStatus::Peace
    } else {
        return false;
    };
    rel.status = target;
    state.set_relation(pair, rel);
    true
}

// ---------------------------------------------------------------------------------------------
// D3: tick handlu cyklicznego.
// ---------------------------------------------------------------------------------------------

struct Ledger<'a> {
    inp: &'a DiplStepsInputs,
    cities: Option<Vec<CityResourceState>>,
    treasury: BTreeMap<i64, f64>,
    praca: BTreeMap<i64, f64>,
    treasury_delta: BTreeMap<i64, f64>,
    praca_delta: BTreeMap<i64, f64>,
}

impl<'a> Ledger<'a> {
    fn new(inp: &'a DiplStepsInputs) -> Self {
        Self {
            inp,
            cities: inp.cities.clone(),
            treasury: inp.treasury.clone(),
            praca: inp.praca_pool.clone(),
            treasury_delta: BTreeMap::new(),
            praca_delta: BTreeMap::new(),
        }
    }

    fn cities(&self) -> Result<&Vec<CityResourceState>, WarTurnError> {
        self.cities.as_ref().ok_or_else(|| {
            err("brak producenta zapasow miast (handel cykliczny wymaga city.surowce)".into())
        })
    }

    /// Web `ownerResourceStock`: suma zapasu surowca w miastach wlasciciela.
    fn stock(&self, owner: i64, key: &str) -> Result<f64, WarTurnError> {
        let key = key.trim().to_lowercase();
        Ok(self
            .cities()?
            .iter()
            .filter(|c| c.owner_id.get() as i64 == owner)
            .map(|c| c.resources.get(&key).copied().unwrap_or(0.0))
            .sum())
    }

    fn praca_of(&self, owner: i64) -> Result<f64, WarTurnError> {
        self.praca.get(&owner).copied().ok_or_else(|| {
            err(format!(
                "brak producenta puli Pracy wlasciciela {owner} (web ownerPracaPool)"
            ))
        })
    }
}

impl Treasury for Ledger<'_> {
    fn balance(&self, owner: i64) -> Result<f64, WarTurnError> {
        self.treasury.get(&owner).copied().ok_or_else(|| {
            err(format!(
                "brak producenta skarbca wlasciciela {owner} (web ownerTreasury)"
            ))
        })
    }

    fn add(&mut self, owner: i64, delta: f64) -> Result<(), WarTurnError> {
        let cur = self.balance(owner)?;
        self.treasury.insert(owner, cur + delta);
        *self.treasury_delta.entry(owner).or_insert(0.0) += delta;
        Ok(())
    }
}

fn credibility_n6() -> (f64, f64) {
    let p = crate::data::civilizations::parse_diplomacy()
        .expect("diplomacy.json must parse")
        .params;
    (
        p.wiarygodnosc_n6_prog_tur_zrzedu as f64,
        p.wiarygodnosc_n6_niedotrzymanie_handlu_cyklicznego as f64,
    )
}

/// Web `applyCyclicDeliveryOutcome` (bez UI/logu zdarzen). `item` = indeks w `deal.cyclic_resource_transfers`.
fn apply_cyclic_outcome(
    deal: &mut ActiveDeal,
    idx: usize,
    delivered: bool,
    seller_at_fault: bool,
    buyer_at_fault: bool,
    ledger: &mut Ledger<'_>,
    requests: &mut Vec<CredibilityRequest>,
) -> Result<bool, WarTurnError> {
    let item = deal.cyclic_resource_transfers[idx].clone();
    if delivered {
        let buyer = item.buyer_owner_id.get() as i64;
        let seller = item.seller_owner_id.get() as i64;
        let cap = ledger.inp.capital_city.get(&buyer).cloned();
        let result = transfer_quantity_resource(
            &item.resource_key,
            item.units_per_turn,
            item.seller_owner_id,
            item.buyer_owner_id,
            cap.as_deref(),
            ledger.cities()?,
        );
        ledger.cities = Some(result.cities);
        let z = item.payment_per_turn;
        match item.payment {
            Some(PaymentKind::Gold) if z > 0.0 => {
                // Web `applyOneShotGoldTransfer`: strict, przy braku srodkow bez zmian.
                if ledger.balance(buyer)? >= z {
                    ledger.add(buyer, -z)?;
                    ledger.add(seller, z)?;
                }
            }
            Some(PaymentKind::Work) if z > 0.0 => {
                let b = ledger.praca_of(buyer)?;
                let s = ledger.praca_of(seller)?;
                ledger.praca.insert(buyer, b - z);
                ledger.praca.insert(seller, s + z);
                *ledger.praca_delta.entry(buyer).or_insert(0.0) -= z;
                *ledger.praca_delta.entry(seller).or_insert(0.0) += z;
            }
            _ => {}
        }
    } else {
        deal.cyclic_ever_failed = true;
    }
    let (prog, value) = credibility_n6();
    let it = &mut deal.cyclic_resource_transfers[idx];
    it.seller_failed_turns = if seller_at_fault {
        it.seller_failed_turns + 1
    } else {
        0
    };
    it.buyer_failed_turns = if buyer_at_fault {
        it.buyer_failed_turns + 1
    } else {
        0
    };
    if f64::from(it.seller_failed_turns) >= prog {
        requests.push(CredibilityRequest {
            owner: it.seller_owner_id.get() as i64,
            kind: "niedotrzymanie_handlu_cyklicznego",
            value,
        });
        it.seller_failed_turns = 0;
    }
    if f64::from(it.buyer_failed_turns) >= prog {
        requests.push(CredibilityRequest {
            owner: it.buyer_owner_id.get() as i64,
            kind: "niedotrzymanie_handlu_cyklicznego",
            value,
        });
        it.buyer_failed_turns = 0;
    }
    Ok(delivered)
}

fn tick_cyclic_resource_trade_deals(
    deals: &mut [ActiveDeal],
    ledger: &mut Ledger<'_>,
    report: &mut DiplStepsReport,
) -> Result<(), WarTurnError> {
    if !deals
        .iter()
        .any(|d| !d.cyclic_resource_transfers.is_empty())
    {
        return Ok(());
    }
    #[allow(clippy::needless_range_loop)]
    // `deals[di]` jest pozyczane lacznie z `ledger` w apply_cyclic_outcome
    for di in 0..deals.len() {
        let n = deals[di].cyclic_resource_transfers.len();
        if n == 0 {
            continue;
        }
        // Self-heal (R-DYPLO-CENNIK-SKALA-5X-Q1): ilosc zaokraglona w dol do kroku, RAZ na ture, przed sprawdzeniem.
        for it in &mut deals[di].cyclic_resource_transfers {
            it.units_per_turn =
                normalize_resource_quantity(&it.resource_key, it.units_per_turn, None);
        }
        let mut handled = vec![false; n];
        for i in 0..n {
            if handled[i] {
                continue;
            }
            let a = deals[di].cyclic_resource_transfers[i].clone();
            let mut b_idx: Option<usize> = None;
            if a.payment.is_none() {
                b_idx = (0..n).find(|&j| {
                    let o = &deals[di].cyclic_resource_transfers[j];
                    j != i
                        && !handled[j]
                        && o.payment.is_none()
                        && o.seller_owner_id == a.buyer_owner_id
                        && o.buyer_owner_id == a.seller_owner_id
                });
            }
            let deal_id = deals[di].id.clone();
            let seller_ok = |l: &Ledger<'_>, it: &super::diplomacy::CyclicResourceTransfer| {
                if it.seller_owner_id == it.buyer_owner_id || it.units_per_turn <= 0.0 {
                    return Ok(false);
                }
                Ok::<bool, WarTurnError>(
                    l.stock(it.seller_owner_id.get() as i64, &it.resource_key)?
                        >= it.units_per_turn,
                )
            };
            if let Some(bi) = b_idx {
                let b = deals[di].cyclic_resource_transfers[bi].clone();
                handled[i] = true;
                handled[bi] = true;
                let a_ok = seller_ok(ledger, &a)?;
                let b_ok = seller_ok(ledger, &b)?;
                let both = a_ok && b_ok; // atomowosc barteru
                let ok_a = apply_cyclic_outcome(
                    &mut deals[di],
                    i,
                    both,
                    !a_ok,
                    false,
                    ledger,
                    &mut report.credibility_requests,
                )?;
                let ok_b = apply_cyclic_outcome(
                    &mut deals[di],
                    bi,
                    both,
                    !b_ok,
                    false,
                    ledger,
                    &mut report.credibility_requests,
                )?;
                report.cyclic.push(CyclicOutcome {
                    deal_id: deal_id.clone(),
                    index: i,
                    delivered: ok_a,
                });
                report.cyclic.push(CyclicOutcome {
                    deal_id,
                    index: bi,
                    delivered: ok_b,
                });
                continue;
            }
            handled[i] = true;
            let s_ok = seller_ok(ledger, &a)?;
            let z = a.payment_per_turn;
            let mut buyer_ok = true;
            let buyer = a.buyer_owner_id.get() as i64;
            if s_ok && z > 0.0 && a.payment == Some(PaymentKind::Gold) {
                buyer_ok = ledger.balance(buyer)? >= z;
            } else if s_ok && z > 0.0 && a.payment == Some(PaymentKind::Work) {
                buyer_ok = ledger.praca_of(buyer)? >= z;
            }
            let ok = apply_cyclic_outcome(
                &mut deals[di],
                i,
                s_ok && buyer_ok,
                !s_ok,
                s_ok && !buyer_ok,
                ledger,
                &mut report.credibility_requests,
            )?;
            report.cyclic.push(CyclicOutcome {
                deal_id,
                index: i,
                delivered: ok,
            });
        }
    }
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// D1/D2: wygasanie traktatow i zlecenia finiszu wiarygodnosci.
// ---------------------------------------------------------------------------------------------

fn finish_requests(deal: &ActiveDeal, expired_turn: f64, report: &mut DiplStepsReport) {
    let p = CredibilityParams::load();
    let (pa, pb) = (
        deal.parties.first.get() as i64,
        deal.parties.second.get() as i64,
    );
    if deal.kind == TreatyKind::BarbarianCooperation || deal.barbarian_cooperation {
        report
            .barbarian_grace
            .push((pa, pb, expired_turn + BARBARIAN_COOPERATION_TURNS - 1.0));
    }
    for (event, value) in expiry_finish_events(
        deal.kind,
        !deal.cyclic_resource_transfers.is_empty(),
        deal.cyclic_ever_failed,
        p,
    ) {
        for owner in [pa, pb] {
            report.credibility_requests.push(CredibilityRequest {
                owner,
                kind: event.web_key(),
                value,
            });
        }
    }
}

// ---------------------------------------------------------------------------------------------
// D2 (zapis) + D4: rejestr wiarygodnosci.
// ---------------------------------------------------------------------------------------------

/// Zapisuje zlecenia D2/N6 do rejestru, potem D4: `updateWiarygodnoscStreamsThisTurn` i P4 dla kazdego
/// wlasciciela (`allWiarygodnoscOwnerIds`). Zapisuje do `opaque` tylko zmienione klucze.
fn credibility_steps(
    work: &mut WarTurnState,
    cx: &DiplStepsContext<'_>,
    report: &mut DiplStepsReport,
) -> Result<(), WarTurnError> {
    let p = CredibilityParams::load();
    let difficulty = cx.inputs.difficulty;
    let turn = cx.turn;
    let before = CredibilityRegistry::from_meta(&work.opaque).map_err(|e| err(e.to_string()))?;
    let mut reg = before.clone();

    for r in &report.credibility_requests {
        let event = CredibilityEvent::from_web_key(r.kind)
            .ok_or_else(|| err(format!("nieznany typ zdarzenia wiarygodnosci '{}'", r.kind)))?;
        reg.append_event(r.owner, event, r.value, turn);
    }

    let stream_deals: Vec<StreamDeal> = work
        .diplomacy
        .deals
        .iter()
        .map(|d| StreamDeal {
            id: d.id.clone(),
            kind: stream_kind_of(d.kind),
            parties: (d.parties.first.get() as i64, d.parties.second.get() as i64),
            cyclic_len: d.cyclic_resource_transfers.len(),
        })
        .collect();
    let cyclic = &report.cyclic;
    // Web `wiarygodnoscCyclicDeliveryOkThisTurn.get(...)`: brak wpisu = `undefined` (nie `false`).
    let delivery_ok = |id: &str, idx: usize| {
        cyclic
            .iter()
            .find(|c| c.deal_id == id && c.index == idx)
            .map(|c| c.delivered)
    };
    let active = stream_active_tuples(&stream_deals, &delivery_ok);
    reg.update_streams_this_turn(&active, difficulty, p);
    report.credibility_stream_active = active;

    let mut owners: Vec<i64> = cx
        .owner_ids
        .iter()
        .copied()
        .filter(|o| !cx.inputs.credibility_excluded_owners.contains(o))
        .collect();
    owners.sort_unstable();
    owners.dedup();
    for o in owners {
        reg.tick_no_war_milestone(o, turn, p)
            .map_err(|e| err(e.to_string()))?;
    }
    reg.store_changes(&before, &mut work.opaque);
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// D5: porty rozejmu z sledzeniem brakujacej mocy armii.
// ---------------------------------------------------------------------------------------------

struct TrackedTruce<'a> {
    td: TruceDiplomacy,
    army: &'a BTreeMap<i64, f64>,
    missing: RefCell<BTreeSet<i64>>,
}

impl TruceEndPorts<PlayerId> for TrackedTruce<'_> {
    fn meta(&self, a: PlayerId, b: PlayerId) -> PairTruceMeta<PlayerId> {
        self.td.meta(a, b)
    }
    fn set_meta(&mut self, a: PlayerId, b: PlayerId, meta: PairTruceMeta<PlayerId>) {
        self.td.set_meta(a, b, meta)
    }
    fn status_is_peace(&self, a: PlayerId, b: PlayerId) -> bool {
        self.td.status_is_peace(a, b)
    }
    fn army_m(&self, owner: PlayerId) -> f64 {
        match self.army.get(&(owner.get() as i64)) {
            Some(v) => *v,
            None => {
                self.missing.borrow_mut().insert(owner.get() as i64);
                0.0
            }
        }
    }
    fn is_human(&self, owner: PlayerId) -> bool {
        self.td.is_human(owner)
    }
    fn declare_war_after_truce(&mut self, a: PlayerId, b: PlayerId) {
        self.td.declare_war_after_truce(a, b)
    }
    fn enqueue_offer(&mut self, owner: PlayerId, reason: &str) -> String {
        self.td.enqueue_offer(owner, reason)
    }
    fn remove_offer(&mut self, inbox_id: &str) {
        self.td.remove_offer(inbox_id)
    }
    fn finalize_peace(&mut self, proposer: PlayerId, responder: PlayerId) {
        self.td.finalize_peace(proposer, responder)
    }
}

fn parse_pair(key: &str) -> Option<CivilizationPair> {
    let (a, b) = key.split_once('-')?;
    Some(CivilizationPair::new(
        PlayerId::new(a.parse().ok()?),
        PlayerId::new(b.parse().ok()?),
    ))
}

fn pair_key_str(p: CivilizationPair) -> String {
    format!("{}-{}", p.first.get(), p.second.get())
}

fn read_pair_meta(
    war: &WarTurnState,
) -> Result<BTreeMap<CivilizationPair, PairMetaWeb>, WarTurnError> {
    let mut out = BTreeMap::new();
    match war.opaque.get(KEY_PAIR_META) {
        None => {}
        Some(Value::Array(rows)) => {
            for row in rows {
                let one = pair_meta_from_save(&Value::Array(vec![row.clone()]));
                let Some((k, m)) = one.into_iter().next() else {
                    return Err(err(format!("{KEY_PAIR_META}: wpis nie jest [klucz, meta]")));
                };
                let p = parse_pair(&k)
                    .ok_or_else(|| err(format!("{KEY_PAIR_META}: zly klucz pary '{k}'")))?;
                out.insert(p, m);
            }
        }
        Some(_) => return Err(err(format!("{KEY_PAIR_META}: oczekiwano tablicy par"))),
    }
    Ok(out)
}

fn read_inbox(war: &WarTurnState) -> Result<Vec<InboxOffer>, WarTurnError> {
    match war.opaque.get(KEY_INBOX) {
        None => Ok(Vec::new()),
        Some(Value::Array(rows)) => Ok(rows
            .iter()
            .filter_map(|r| {
                Some(InboxOffer {
                    id: r.get("id")?.as_str()?.to_owned(),
                    owner: PlayerId::new(r.get("ownerId")?.as_u64()?),
                    reason: r.get("reason")?.as_str()?.to_owned(),
                })
            })
            .collect()),
        Some(_) => Err(err(format!("{KEY_INBOX}: oczekiwano tablicy"))),
    }
}

fn truce_step(
    war: &mut WarTurnState,
    inp: &DiplStepsInputs,
    owner_ids: &[i64],
    human_ids: &[i64],
    turn: f64,
    report: &mut DiplStepsReport,
) -> Result<(), WarTurnError> {
    let before_meta = read_pair_meta(war)?;
    let before_inbox = read_inbox(war)?;
    // Zero par z metadanymi rozejmu/oferty = brak pracy (bez wymagania wejsc).
    if before_meta
        .values()
        .all(|m| m.truce_until_turn.is_none() && m.truce_end_offer.is_none())
    {
        return Ok(());
    }
    let mut td = TruceDiplomacy::new();
    td.diplomacy = war.diplomacy.clone();
    td.pair_meta = before_meta.clone();
    td.humans = human_ids.iter().map(|&h| pid(h)).collect();
    td.inbox = before_inbox.clone();
    td.turn = turn;
    let mut tr = TrackedTruce {
        td,
        army: &inp.army_m,
        missing: RefCell::new(BTreeSet::new()),
    };
    let mut ids: Vec<i64> = owner_ids.to_vec();
    ids.sort_unstable();
    ids.dedup();
    for i in 0..ids.len() {
        for j in (i + 1)..ids.len() {
            truce_end_tick_pair(&mut tr, pid(ids[i]), pid(ids[j]), turn);
        }
    }
    if let Some(&m) = tr.missing.borrow().iter().next() {
        return Err(err(format!(
            "brak mocy armii wlasciciela {m} (web sumArmyMForOwner) przy wygasnieciu rozejmu"
        )));
    }
    let td = tr.td;
    war.diplomacy = td.diplomacy;
    // Meta par: zmieniamy tylko pary, ktorych meta sie zmienila (reszta zachowuje oryginalny JSON).
    let mut rows: Vec<Value> = match war.opaque.get(KEY_PAIR_META) {
        Some(Value::Array(a)) => a.clone(),
        _ => Vec::new(),
    };
    for (pair, meta) in &td.pair_meta {
        if before_meta.get(pair) == Some(meta) {
            continue;
        }
        let new_val = serde_json::to_value(meta).map_err(|e| err(e.to_string()))?;
        let key = pair_key_str(*pair);
        let pos = rows.iter().position(|r| {
            r.get(0)
                .and_then(Value::as_str)
                .and_then(parse_pair)
                .is_some_and(|p| p == *pair)
        });
        let row = Value::Array(vec![Value::String(key), new_val]);
        match pos {
            Some(p) => rows[p] = row,
            None => rows.push(row),
        }
        report
            .truce_pairs_changed
            .push((pair.first.get() as i64, pair.second.get() as i64));
    }
    if !report.truce_pairs_changed.is_empty() {
        war.opaque
            .insert(KEY_PAIR_META.to_owned(), Value::Array(rows));
    }
    // Skrzynka: usuniete wg id, nowe oferty dopisane (bez `civName`: etykieta UI nie ma portu).
    let old_ids: BTreeSet<&str> = before_inbox.iter().map(|o| o.id.as_str()).collect();
    let new_ids: BTreeSet<&str> = td.inbox.iter().map(|o| o.id.as_str()).collect();
    if old_ids != new_ids {
        let mut arr: Vec<Value> = match war.opaque.get(KEY_INBOX) {
            Some(Value::Array(a)) => a.clone(),
            _ => Vec::new(),
        };
        arr.retain(|r| {
            r.get("id")
                .and_then(Value::as_str)
                .is_none_or(|id| new_ids.contains(id))
        });
        for o in td.inbox.iter().filter(|o| !old_ids.contains(o.id.as_str())) {
            arr.push(json!({
                "id": o.id,
                "ownerId": o.owner.get(),
                "cmdType": "zaproponuj_pokoj",
                "reason": o.reason,
            }));
        }
        war.opaque.insert(KEY_INBOX.to_owned(), Value::Array(arr));
    }
    Ok(())
}

// ---------------------------------------------------------------------------------------------
// Wejscie: kroki D1-D7 w kolejnosci pinu.
// ---------------------------------------------------------------------------------------------

/// Kontekst tozsamosci wlascicieli z `WarTurnInputs`.
pub struct DiplStepsContext<'a> {
    pub me_id: i64,
    pub human_ids: &'a [i64],
    pub contacts: &'a [i64],
    pub owner_ids: &'a [i64],
    pub turn: f64,
    pub inputs: &'a DiplStepsInputs,
}

/// Hak P4 (`main.ts:12223-12224`, R-RUSTPORT-P6-CRED-WOJNA-Q1): KAZDA wojna zeruje licznik "bez wojny" OBU stron.
/// Wolane w `run_war_turn` po hamulcu (`run_brake_phase`) dla kazdej pary, ktora faktycznie weszla w wojne w tej
/// turze (`BrakePhaseOutput::declarations`, tam gdzie web woła `chargeWarDeclarationCredibility`). Zapis do `opaque`
/// tylko zmienionych kluczy; brak wojny = brak zmiany stanu.
pub fn note_war_declarations(
    war: &mut WarTurnState,
    declarations: &[(i64, i64)],
    turn: f64,
) -> Result<(), WarTurnError> {
    if declarations.is_empty() {
        return Ok(());
    }
    let before = CredibilityRegistry::from_meta(&war.opaque).map_err(|e| err(e.to_string()))?;
    let mut reg = before.clone();
    for &(a, b) in declarations {
        reg.note_war_entered(a, b, turn);
    }
    reg.store_changes(&before, &mut war.opaque);
    Ok(())
}

/// D1 -> D2 -> D3 -> D4 -> D5 -> D6 -> D7 (galaz OFF + `syncRelationFromDeals`). Atomowo.
pub fn run_dipl_steps(
    war: &mut WarTurnState,
    cx: &DiplStepsContext<'_>,
) -> Result<DiplStepsReport, WarTurnError> {
    let mut report = DiplStepsReport::default();
    let turn = cx.turn;
    let mut work = war.clone();

    // D1: expireTreaties (+ D2: finisz dla traktatow, ktore zniknely TU).
    let turn_u = if turn.is_finite() && turn >= 0.0 {
        turn as u32
    } else {
        0
    };
    let before: Vec<ActiveDeal> = work.diplomacy.deals.clone();
    work.diplomacy.expire_deals(turn_u);
    for d in &before {
        if work.diplomacy.deals.iter().any(|x| x.id == d.id) {
            continue;
        }
        report.expired_deals.push(d.id.clone());
        finish_requests(d, turn, &mut report);
    }

    // D3: handel cykliczny.
    let mut ledger = Ledger::new(cx.inputs);
    let mut deals = std::mem::take(&mut work.diplomacy.deals);
    tick_cyclic_resource_trade_deals(&mut deals, &mut ledger, &mut report)?;
    work.diplomacy.deals = deals;

    // D2/D3 -> rejestr wiarygodnosci (zdarzenia P1-P3 z D2 i N6 z D3, w kolejnosci wywolan pinu), potem D4
    // (strumienie S1-S4 + kamienie P4) PRZED D5, jak na pinie (:24272-24274).
    credibility_steps(&mut work, cx, &mut report)?;

    // D5: wygasniecia rozejmow.
    truce_step(
        &mut work,
        cx.inputs,
        cx.owner_ids,
        cx.human_ids,
        turn,
        &mut report,
    )?;

    // D6: platnosci (danina) i zerwania.
    let pay_deals = active_deals_to_payment_deals(&work.diplomacy.deals, turn);
    if !pay_deals.is_empty() {
        let res = tick_diplomacy_payments(&pay_deals, &mut ledger, turn)?;
        let breaks = tribute_break_pairs(&work.diplomacy.deals, &res.broken);
        for (_, payer, receiver) in &breaks {
            work.diplomacy.apply_event(
                pid(*payer),
                pid(*receiver),
                DiplomaticEvent::TributeRefused,
            );
            report.tribute_breaks.push((*payer, *receiver));
        }
        work.diplomacy
            .deals
            .retain(|d| !res.broken.iter().any(|id| id == &d.id));
        report.payments = res;
    }

    // D7: galaz bez hamulca (tylko flaga OFF) + syncRelationFromDeals dla kontaktow.
    let me = cx.me_id;
    for &oid in cx.contacts {
        if oid == me {
            continue;
        }
        if cx.inputs.brake_flag_off {
            let (a, b) = (pid(me), pid(oid));
            let pair = CivilizationPair::new(a, b);
            let mut metas = read_pair_meta(&work)?;
            let meta = metas.entry(pair).or_default();
            if meta.dobra_wola_remaining_tur > 0.0 {
                let rel = work.diplomacy.relation(a, b).cloned().unwrap_or_default();
                let (trust, rem, _) =
                    tick_dobra_wola_on_relation(rel.trust, meta.dobra_wola_remaining_tur);
                let mut next = rel;
                next.trust = trust;
                work.diplomacy.set_relation(pair, next);
                meta.dobra_wola_remaining_tur = rem;
                let meta_v = serde_json::to_value(&*meta).map_err(|e| err(e.to_string()))?;
                let mut rows: Vec<Value> = match work.opaque.get(KEY_PAIR_META) {
                    Some(Value::Array(a)) => a.clone(),
                    _ => Vec::new(),
                };
                let row = Value::Array(vec![Value::String(pair_key_str(pair)), meta_v]);
                match rows.iter().position(|r| {
                    r.get(0)
                        .and_then(Value::as_str)
                        .and_then(parse_pair)
                        .is_some_and(|p| p == pair)
                }) {
                    Some(p) => rows[p] = row,
                    None => rows.push(row),
                }
                work.opaque
                    .insert(KEY_PAIR_META.to_owned(), Value::Array(rows));
                report.dobra_wola_off_ticked.push((me, oid));
            }
        }
        if sync_relation_from_deals(&mut work.diplomacy, pid(me), pid(oid)) {
            report.synced_status.push((me, oid));
        }
    }

    report.city_resources = ledger.cities.clone().filter(|_| !report.cyclic.is_empty());
    report.treasury_deltas = ledger.treasury_delta;
    report.praca_deltas = ledger.praca_delta;
    *war = work;
    Ok(report)
}
