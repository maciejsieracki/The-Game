//! R-RUSTPORT-P6-CRED-HAK-WYPOWIEDZENIE-IMPL-Q1: wypowiedzenie wojny przez gracza, wrapper kolejnosci krokow.
//!
//! web (pin `07d2fbd72`): `playerDeclareWarOnOwner` (`gra/src/main.ts:13152-13186`), kroki w tej kolejnosci:
//!   (a) `chargeWarDeclarationCredibility(ME, owner)` (`main.ts:12176-12225`): N2 (kara za zlamanie paktu
//!       sojuszu/NAP i za okno rozejmu/oferty), reset pary (`truceUntilTurn`, `truceInitiatorId`, `wojnaOdTury`,
//!       `n1Zastosowany`, `ostatniePrzewinienieWobecNas`), P4 (zerowanie licznika "bez wojny" OBU stron).
//!       NIE zapisuje relacji.
//!   (b) `breakTreatiesOnWar(ME, owner, breakerIsPlayer=true)` (`main.ts:23688-23702`): zerwanie umow pary
//!       (`suspendZlozeOnWar`, `treatiesBrokenByWar`); kara `zlamana_obietnica` TYLKO gdy zerwano >= 1 umowe
//!       (web `if (!brokenIds.length) return;`), z modyfikatorem tempa wiarygodnosci wg relacji w chwili kary
//!       (`applyDiploEventTracked`, `main.ts:12310-12327`: brak modyfikatora, gdy `cur.status === 'wojna'`).
//!   (c) relacja `wojna`: `applyDiploEventTracked(ME, owner, cur, 'wojna_wypowiedziana')` + `setDiploRelation`
//!       (`main.ts:13171-13175`). Dopiero PO (b): kara zalezy od relacji sprzed wypowiedzenia.
//!   (d) `zarejestrujWypowiedzenie(ME, turn, przyczynaWypowiedzenia({zlamanieRozejmu, casusBelliAktywny}))`
//!       (`main.ts:13177`).
//!
//! Poza zakresem tego modulu (BRAK / NIE_ZMIERZONO, patrz raport): `applyAllianceObligationsOnWar` (`main.ts:13170`),
//! `diplomacyLayerForOwner` + `playerDiplomacyActionAllowed` (`main.ts:13158-13163`), `pruneTributeNegotiationsBetween`,
//! `recordWarDeclarationEvent`, `pruneInvalidNegotiations` (`main.ts:13178-13181`), `recordDiploFactor` (tracking
//! zaufania/respektu), hinty i UI. Guard pokoju (`isPeaceLockedBetween`, `main.ts:13153`) przyjmowany jako wejscie
//! `peace_locked` od wolajacego (wyliczenie po stronie wolajacego).
//!
//! ZALOZENIA (adaptacja typow, logika bez zmian):
//! - Kara N2 i P4 ida do `CredibilityRegistry` (kanoniczny rejestr wiarygodnosci, `wiarygodnoscZdarzeniaByOwner`),
//!   a nie do `TruceDiplomacy::credibility_events` (ta lista istnieje tylko dla modulu rozejmu).
//! - Wartosci N2 z `diplomacy.json` (`parse_diplomacy().params`); skalowanie trudnoscia dotyczy wylacznie progow
//!   bram (`scaleDiplomacyParamsForDifficulty`, `diplomacy.ts:570-586`), nie kluczy `wiarygodnosc*`.
//! - `ostatniePrzewinienieWobecNas` przechodzi przez `PairMetaWeb::extra` (jak w `diplomacy_truce.rs`), klucz web.
//! - Dla `isCredibilityRetaliation` (odwet, `main.ts:12161-12167`) i `credibilityEventOpensOdwet` (`main.ts:12148-12153`)
//!   odczyt zrobiony tutaj na tym samym kluczu `extra`.
//! - Kroki sa wystawione jako osobne funkcje tylko po to, by test mutacji mogl wykonac je w zamienionej kolejnosci
//!   (zob. `tests/p6_cred_hak_kolejnosc.rs`); produkcja wola wylacznie [`declare_war_by_player`].

use std::sync::OnceLock;

use serde_json::json;

use crate::data::civilizations::parse_diplomacy;
use crate::domain::credibility::{CredibilityEvent, CredibilityParams, CredibilityRegistry};
use crate::domain::diplomacy::{
    apply_diplomatic_event, apply_diplomatic_event_with_params, CivilizationPair, DiplomacyParams,
    DiplomaticEvent, Relation, RelationStatus, TreatyKind,
};
use crate::domain::diplomacy_aggressor::{
    przyczyna_wypowiedzenia, AggressorEngineState, WarCause, WarCauseInput,
};
use crate::domain::diplomacy_truce::{is_truce_active, PairMetaWeb};
use crate::domain::diplomacy_truce_end::clear_truce_end_offer_core;
use crate::domain::diplomacy_truce_flow::TruceDiplomacy;
use crate::domain::ids::PlayerId;
use crate::domain::types::Difficulty;

/// Klucz web pola pary `ostatniePrzewinienieWobecNas` (`DiploPairMeta`) w `PairMetaWeb::extra`.
pub const KEY_OSTATNIE_PRZEWINIENIE: &str = "ostatniePrzewinienieWobecNas";
/// Typ zdarzenia web zapisywany jako ostatnie przewinienie przy wypowiedzeniu bez ostrzezenia (N1).
pub const TYP_WYPOWIEDZENIE_BEZ_OSTRZEZENIA: &str = "wypowiedzenie_wojny_bez_ostrzezenia";

/// Wartosci N2 i okna odwetu z `diplomacy.json` (`params`), liczone raz.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct N2Values {
    /// `wiarygodnoscN2ZlamaniePaktuNap` (web `diplomacy.ts:327`, -18).
    pub nap: f64,
    /// `wiarygodnoscN2ZlamaniePaktuSojusz` (web `diplomacy.ts:329`, -25).
    pub sojusz: f64,
    /// `wiarygodnoscOdwetOknoTur` (web `diplomacy.ts:347`, 10).
    pub odwet_okno_tur: f64,
}

/// Wartosci N2 z danych (jedno zrodlo: `diplomacy.json`, jak `CredibilityParams::load`).
pub fn n2_values() -> N2Values {
    static VALUES: OnceLock<N2Values> = OnceLock::new();
    *VALUES.get_or_init(|| {
        let p = parse_diplomacy().expect("diplomacy.json must parse").params;
        N2Values {
            nap: p.wiarygodnosc_n2_zlamanie_paktu_nap as f64,
            sojusz: p.wiarygodnosc_n2_zlamanie_paktu_sojusz as f64,
            odwet_okno_tur: p.wiarygodnosc_odwet_okno_tur as f64,
        }
    })
}

/// Web `ostatniePrzewinienieWobecNas` (`{turn, typ, byOwnerId, againstOwnerId}`).
#[derive(Debug, Clone, PartialEq)]
pub struct Przewinienie {
    pub turn: f64,
    pub typ: String,
    pub by_owner_id: f64,
    pub against_owner_id: f64,
}

/// Odczyt `ostatniePrzewinienieWobecNas` z `PairMetaWeb::extra`. Brak lub zly ksztalt = `None`.
pub fn read_przewinienie(meta: &PairMetaWeb) -> Option<Przewinienie> {
    let v = meta.extra.get(KEY_OSTATNIE_PRZEWINIENIE)?;
    Some(Przewinienie {
        turn: v.get("turn")?.as_f64()?,
        typ: v.get("typ")?.as_str()?.to_string(),
        by_owner_id: v.get("byOwnerId")?.as_f64()?,
        against_owner_id: v.get("againstOwnerId")?.as_f64()?,
    })
}

/// Web `credibilityEventOpensOdwet` (`main.ts:12148-12153`).
pub fn credibility_event_opens_odwet(typ: &str) -> bool {
    matches!(
        typ,
        TYP_WYPOWIEDZENIE_BEZ_OSTRZEZENIA
            | "zlamanie_paktu_nap"
            | "zlamanie_paktu_sojusz"
            | "odmowa_obowiazku_sojuszu"
    )
}

/// Web `isCredibilityRetaliation(retaliatorId, targetId)` (`main.ts:12161-12167`).
pub fn is_credibility_retaliation(
    state: &TruceDiplomacy,
    retaliator: PlayerId,
    target: PlayerId,
    turn: f64,
) -> bool {
    let meta = state.pair_meta_of(retaliator, target);
    let Some(off) = read_przewinienie(&meta) else {
        return false;
    };
    if off.by_owner_id != target.get() as f64 || off.against_owner_id != retaliator.get() as f64 {
        return false;
    }
    if turn - off.turn > n2_values().odwet_okno_tur {
        return false;
    }
    credibility_event_opens_odwet(&off.typ)
}

/// Krok (a). Web `chargeWarDeclarationCredibility(declarer, target)` bez opcji (`main.ts:12176-12225`).
/// Zwraca `truceBreach` (web: okno rozejmu lub oferty pokoju po rozejmie = zlamanie Z8).
/// Barbarzynca po ktorejkolwiek stronie = wczesny `false`, bez zadnego zapisu (web: `return false`).
/// NIE zapisuje relacji (`DeclareWar` dopiero w kroku (c)).
pub fn charge_war_declaration_credibility(
    state: &mut TruceDiplomacy,
    cred: &mut CredibilityRegistry,
    declarer: PlayerId,
    target: PlayerId,
    turn: f64,
) -> bool {
    if state.barbarians.contains(&declarer) || state.barbarians.contains(&target) {
        return false;
    }
    let n2 = n2_values();
    let retaliation = is_credibility_retaliation(state, declarer, target, turn);
    let (d, t) = (declarer.get() as i64, target.get() as i64);

    // web: `isTruceWindowBreach(getDiploPairMeta(declarer, target), turn)`.
    let truce_breach = {
        let meta = state.pair_meta_of(declarer, target);
        is_truce_active(meta.truce_until_turn, turn) || meta.truce_end_offer.is_some()
    };

    // web: `if (!skipN2) { ... }`; skipN2 = odwet (brak opcji `skipN2AllianceDefense` w sciezce gracza).
    if !retaliation {
        let pair = CivilizationPair::new(declarer, target);
        let has_alliance = state
            .diplomacy
            .deals
            .iter()
            .any(|deal| deal.parties == pair && deal.kind.is_alliance());
        let has_nap = state
            .diplomacy
            .deals
            .iter()
            .any(|deal| deal.parties == pair && deal.kind == TreatyKind::Nap);
        if has_alliance {
            cred.append_event(d, CredibilityEvent::ZlamaniePaktuSojusz, n2.sojusz, turn);
        } else if has_nap {
            cred.append_event(d, CredibilityEvent::ZlamaniePaktuNap, n2.nap, turn);
        }
        if truce_breach {
            cred.append_event(d, CredibilityEvent::ZlamaniePaktuNap, n2.nap, turn);
        }
    }

    // web: `clearTruceEndOffer`, potem `setDiploPairMeta` (`truceUntilTurn`/`truceInitiatorId` = undefined,
    // `wojnaOdTury`, `n1Zastosowany: false`, `ostatniePrzewinienieWobecNas` gdy nie odwet).
    clear_truce_end_offer_core(state, declarer, target);
    let mut meta = state.pair_meta_of(declarer, target);
    meta.truce_until_turn = None;
    meta.truce_initiator_id = None;
    meta.wojna_od_tury = Some(turn);
    meta.n1_zastosowany = Some(false);
    if !retaliation {
        meta.extra.insert(
            KEY_OSTATNIE_PRZEWINIENIE.to_string(),
            json!({
                "turn": turn,
                "typ": TYP_WYPOWIEDZENIE_BEZ_OSTRZEZENIA,
                "byOwnerId": declarer.get() as f64,
                "againstOwnerId": target.get() as f64,
            }),
        );
    }
    state.set_pair_meta(declarer, target, meta);

    // P4 (`main.ts:12223-12224`): KAZDA wojna zeruje licznik "bez wojny" OBU stron.
    cred.note_war_entered(d, t, turn);
    truce_breach
}

/// Tempo wiarygodnosci dla kary `zlamana_obietnica` (web `applyDiploEventTracked`, `main.ts:12313-12319`):
/// `undefined` gdy relacja jest juz `wojna` albo para bez gracza; inaczej wiarygodnosc gracza z pary.
fn tempo_credibility(
    state: &TruceDiplomacy,
    cred: &CredibilityRegistry,
    cur: &Relation,
    a: PlayerId,
    b: PlayerId,
    turn: f64,
    difficulty: Difficulty,
) -> Option<f64> {
    let a_human = state.humans.contains(&a);
    let player_in_pair = a_human || state.humans.contains(&b);
    if cur.status == RelationStatus::War || !player_in_pair {
        return None;
    }
    let human = if a_human { a } else { b };
    Some(cred.total_of(
        human.get() as i64,
        turn,
        difficulty,
        CredibilityParams::load(),
    ))
}

/// Krok (b). Web `breakTreatiesOnWar(declarer, target, breakerIsPlayer=true)` bez `bezKary` (`main.ts:23688-23702`).
/// Zwraca zerwane id umow (pusta lista = brak kary i brak zmian relacji).
pub fn break_treaties_on_war_by_player(
    state: &mut TruceDiplomacy,
    cred: &CredibilityRegistry,
    difficulty: Difficulty,
    declarer: PlayerId,
    target: PlayerId,
    turn: f64,
) -> Vec<String> {
    let broken = state.diplomacy.break_treaties_on_war(declarer, target);
    if broken.is_empty() {
        return broken;
    }
    let cur = state.relation(declarer, target);
    let credibility = tempo_credibility(state, cred, &cur, declarer, target, turn, difficulty);
    let next = apply_diplomatic_event_with_params(
        &cur,
        DiplomaticEvent::BrokenPromiseByPlayer,
        DiplomacyParams::default(),
        credibility,
    );
    state
        .diplomacy
        .set_relation(CivilizationPair::new(declarer, target), next);
    broken
}

/// Krok (c). Web `setDiploRelation(applyDiploEventTracked(ME, owner, cur, 'wojna_wypowiedziana'))` (`main.ts:13171-13175`).
/// `DeclareWar` nie zmienia zaufania (dZ = 0), wiec modyfikator tempa nie ma tu wplywu.
pub fn apply_war_declaration_relation(
    state: &mut TruceDiplomacy,
    declarer: PlayerId,
    target: PlayerId,
) {
    let cur = state.relation(declarer, target);
    let next = apply_diplomatic_event(&cur, DiplomaticEvent::DeclareWar);
    state
        .diplomacy
        .set_relation(CivilizationPair::new(declarer, target), next);
}

/// Krok (d). Web `zarejestrujWypowiedzenie(ME, turn, przyczynaWypowiedzenia({zlamanieRozejmu, casusBelliAktywny}))`
/// (`main.ts:13177`). Zwraca przyczyne zarejestrowana w agresorze.
pub fn register_player_war_declaration(
    aggressor: &mut AggressorEngineState,
    declarer: PlayerId,
    target: PlayerId,
    turn: f64,
    truce_breach: bool,
) -> WarCause {
    let casus_belli_aktywny =
        aggressor.ma_casus_belli_aktywne(declarer.get() as f64, target.get() as f64, turn);
    let cause = przyczyna_wypowiedzenia(&WarCauseInput {
        hamulec: false,
        wymuszona_epoka: false,
        wymuszona_inna: false,
        casus_belli_aktywny,
        zlamanie_rozejmu: truce_breach,
    });
    aggressor.zarejestruj_wypowiedzenie(declarer.get() as f64, turn, cause);
    cause
}

/// Wynik wypowiedzenia wojny przez gracza.
#[derive(Debug, Clone, PartialEq)]
pub enum PlayerWarOutcome {
    /// Web `isPeaceLockedBetween` (`main.ts:13153-13156`): brak jakichkolwiek zmian stanu.
    PeaceLocked,
    /// Wypowiedzenie wykonane: `truce_breach` (Z8), zerwane umowy (krok b), przyczyna (krok d).
    Declared {
        truce_breach: bool,
        broken_treaties: Vec<String>,
        cause: WarCause,
    },
}

/// Wypowiedzenie wojny przez gracza w kolejnosci webu: (a) -> (b) -> (c) -> (d).
/// `peace_locked` = wynik `isPeaceLockedBetween` po stronie wolajacego (guard z hintem w webie).
#[allow(clippy::too_many_arguments)]
pub fn declare_war_by_player(
    state: &mut TruceDiplomacy,
    cred: &mut CredibilityRegistry,
    aggressor: &mut AggressorEngineState,
    difficulty: Difficulty,
    declarer: PlayerId,
    target: PlayerId,
    peace_locked: bool,
    turn: f64,
) -> PlayerWarOutcome {
    if peace_locked {
        return PlayerWarOutcome::PeaceLocked;
    }
    let truce_breach = charge_war_declaration_credibility(state, cred, declarer, target, turn);
    let broken_treaties =
        break_treaties_on_war_by_player(state, cred, difficulty, declarer, target, turn);
    apply_war_declaration_relation(state, declarer, target);
    let cause = register_player_war_declaration(aggressor, declarer, target, turn, truce_breach);
    PlayerWarOutcome::Declared {
        truce_breach,
        broken_treaties,
        cause,
    }
}
