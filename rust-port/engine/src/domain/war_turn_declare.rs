//! P6-WIRE-WAR-DECLARE-CLEANUP (W4): deklaracja wojny wymuszonej, sprzatanie przy pokoju, koniec wojny
//! wg liczby miast, blokada pokoju epoki i wykonanie zakupu jednostki AI (plan `P6-WIRE-WAR-TURN-PLAN.md`,
//! wiersz W4; decyzje D1=B stan wojny w `WarTurnState`, D3=1:1 progi z webem, D7=A zakup jako krok komend).
//!
//! Web (pin `origin/main`, `gra/src/main.ts`, numery z grepa, moga dryfowac):
//! - deklaracja wymuszona: `*ForceWarActiveByPairKey.set` + `*ForceWarCycleOwners.add` + `*PendingOwners.delete`
//!   (ok. 41559-41595; jedyny zapis wpisu aktywnej pary przy wypowiedzeniu),
//! - wejscie w epoke Brazu/Zelaza: `bronze/ironEraEnterTurnByOwner.set(owner, turn)` (ok. 2448/2466/2506),
//! - sprzatanie przy pokoju: `cleanupStone/IronForcedWarOnPeace` (ok. 11590-11619): usun wpis, usun fale pary,
//!   `*RestUntilByOwner.set(attacker, turn + ODPOCZYNEK)`; Braz ma ten sam ksztalt (`cleanupBronze...`),
//! - koniec wojny zwyklej wg miast: `recordRegularWarCityLoss` (ok. 35620-35660): prog >= 2 po obu stronach,
//!   bramka bilansu AI-AI (`isAiAiPeaceBalanceAllowed`), potem `finalizePeaceTreatyBetween` z cooldownem,
//! - blokada pokoju epoki: `forcedEraPeaceUntilNextEraByPairKey.set(pair, {ownerId, era})` (ok. 11690),
//!   zdejmowana przez `isForcedEraPeaceLocked(currentEra, warEra)` (`war_forced_common`),
//! - zakup jednostki AI: `shouldAIPurchaseUnit` -> `purchaseRecruitmentUnit` (ok. 42441-42456; bramka skarbca
//!   i Manpower wspolna z graczem, potem rezerwa magazynu panstwa).
//!
//! ZALOZENIA (do akceptacji, kazde pokryte nazwa w kodzie lub testem):
//! - Z1 (ZWERYFIKOWANE grepem, r2): wpisy map `meta` sa serializowane jako tablica par `[klucz, wartosc]`:
//!   `serializeForcedEraPeaceLocks` = `Array.from(locks.entries())` (`gra/src/game/forced-war-common.ts:155-158`),
//!   `regularWarCapturedByPairKey`, `aiAiPeaceRequestByPairKey`, `warWearinessByPairKey` = `Array.from(...entries())`
//!   (`gra/src/main.ts` ok. 37020-37022). Pole brakujace = pusta mapa (brak klucza = brak zapisu).
//! - Z2 wypowiedzenie wymuszone to wpis z `assignForcedWarPairings` (`ForcedWarPairingAssignment`), ktorego
//!   para zostala faktycznie wypowiedziana (wolajacy podaje `declared`); web sprawdza to przez
//!   `targetId === *ForceWarTargetId`, tu rownowazne przez przekazanie tylko udanych wypowiedzen.
//! - Z3 bilans AI-AI (`isAiAiPeaceBalanceAllowed`) liczy wolajacy i podaje wynik jako `ai_ai_balance_ok`
//!   (funkcja `peaceOfferAiOwnBilans` jest poza zakresem tej partii).
//! - Z4 zakup AI: `ai_try_purchase_unit` (AI-ZAKUP, parity-v2) jest wynikiem komendy; kolejka rekrutacji i wybor
//!   miasta leza po stronie wolajacego, ta funkcja tylko pobiera koszt z magazynu panstwa.
//! - Z5 start pary wymuszonej = tura wypowiedzenia (`startTurn: turn`), stan 0/0 zdobytych miast.
//! - Z6 brak dedupu po ownerId w `pending`/`cycle` poza `Vec::contains` (dlug W3-7 nie jest tu zamykany).

use std::collections::BTreeMap;

use serde_json::{Map, Value};

use super::ai_zakup_jednostki::{
    ai_try_purchase_unit, AiPurchaseOutcome, AiPurchaseParams, AiPurchaseState,
};
use super::recruitment::UnitRecruitment;
use super::war_forced_bronze::{
    WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE, WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
};
use super::war_forced_common::{is_forced_era_peace_locked, should_end_forced_war_by_city_count};
use super::war_forced_iron::WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR;
use super::war_forced_pairing::{ForcedWarEraTag, ForcedWarPairState, ForcedWarPairingAssignment};
use super::war_forced_stone::WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR;
use super::war_forced_trigger::ForcedEra;
use super::war_turn_state::WarTurnState;

/// Klucz `meta` (web `regularWarCapturedByPairKey`), przechowywany surowo w `WarTurnState::opaque` (Z1).
pub const KEY_REGULAR_WAR_CAPTURED: &str = "regularWarCapturedByPairKey";
/// Klucz `meta` (web `forcedEraPeaceUntilNextEraByPairKey`), surowo w `opaque` (Z1).
pub const KEY_ERA_PEACE_LOCK: &str = "forcedEraPeaceUntilNextEraByPairKey";
/// Klucz `meta` (web `aiAiPeaceRequestByPairKey`), czyszczony przy KAZDYM pokoju pary (web `cleanupRegularWarOnPeace`).
pub const KEY_AI_AI_PEACE_REQUEST: &str = "aiAiPeaceRequestByPairKey";
/// Klucz `meta` (web `warWearinessByPairKey`), czyszczony przy KAZDYM pokoju pary (web `cleanupRegularWarOnPeace`).
pub const KEY_WAR_WEARINESS: &str = "warWearinessByPairKey";

/// Prog konca wojny wg miast (web `WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE`, D3=1:1).
pub const REGULAR_WAR_CITY_LIMIT: i64 = WOJNA_WYMUSZONA_MAX_MIASTA_ZDOBYTE_LUB_STRACONE;

/// Klucz pary `min-max` (web `diploPairKey`).
pub fn pair_key(a: i64, b: i64) -> String {
    format!("{}-{}", a.min(b), a.max(b))
}

/// Indeks w `WarTurnState::forced` (0 = kamien, 1 = braz, 2 = zelazo).
fn era_idx(era: ForcedEra) -> usize {
    match era {
        ForcedEra::Stone => 0,
        ForcedEra::Bronze => 1,
        ForcedEra::Iron => 2,
    }
}

/// Odpoczynek napastnika po pokoju (web `*_ODPOCZYNEK_TUR`, wszystkie 20).
pub fn rest_turns_after_peace(era: ForcedEra) -> f64 {
    match era {
        ForcedEra::Stone => WOJNA_KAMIEN_WYMUSZONA_ODPOCZYNEK_TUR,
        ForcedEra::Bronze => WOJNA_WYMUSZONA_ODPOCZYNEK_TUR,
        ForcedEra::Iron => WOJNA_ZELAZO_WYMUSZONA_ODPOCZYNEK_TUR,
    }
}

fn era_of_tag(tag: ForcedWarEraTag) -> ForcedEra {
    match tag {
        ForcedWarEraTag::Stone => ForcedEra::Stone,
        ForcedWarEraTag::Bronze => ForcedEra::Bronze,
        ForcedWarEraTag::Iron => ForcedEra::Iron,
    }
}

/// Upsert wpisu tablicy par (web `Map.set`: istniejacy klucz zachowuje pozycje, nowy idzie na koniec).
fn upsert<K: PartialEq, V>(v: &mut Vec<(K, V)>, key: K, val: V) {
    if let Some(slot) = v.iter_mut().find(|(k, _)| *k == key) {
        slot.1 = val;
    } else {
        v.push((key, val));
    }
}

/// Deklaracja wojny wymuszonej (web: `*ForceWarActiveByPairKey.set` + `CycleOwners.add` + `PendingOwners.delete`).
/// `declared` = wypowiedziane pary `(epoka, napastnik, cel)` w kolejnosci wykonania. Zwraca liczbe wpisow.
pub fn declare_forced_wars(
    state: &mut WarTurnState,
    declared: &[(ForcedEra, i64, i64)],
    turn: f64,
) -> usize {
    for &(era, attacker, target) in declared {
        let slot = &mut state.forced[era_idx(era)];
        let pair = ForcedWarPairState {
            attacker_id: attacker,
            target_id: target,
            captured_by_attacker: 0,
            captured_by_defender: 0,
            start_turn: Some(turn),
        };
        upsert(
            &mut slot.active_by_pair_key,
            pair_key(attacker, target),
            pair,
        );
        if !slot.cycle_owners.contains(&attacker) {
            slot.cycle_owners.push(attacker);
        }
        slot.pending_owners.retain(|o| *o != attacker);
    }
    declared.len()
}

/// Wariant wygodny dla wyniku kroku W3: przelicza `ForcedWarPairingAssignment` na deklaracje. Wypowiedziane sa
/// tylko pary, dla ktorych `declared(owner, target)` zwraca true (Z2).
pub fn declare_from_assignments(
    state: &mut WarTurnState,
    assignments: &[ForcedWarPairingAssignment],
    turn: f64,
    declared: &dyn Fn(i64, i64) -> bool,
) -> usize {
    let list: Vec<(ForcedEra, i64, i64)> = assignments
        .iter()
        .filter(|a| declared(a.owner_id, a.target_id))
        .map(|a| (era_of_tag(a.era), a.owner_id, a.target_id))
        .collect();
    declare_forced_wars(state, &list, turn)
}

/// Web `bronzeEraEnterTurnByOwner.set(owner, turn)` / `ironEraEnterTurnByOwner.set(...)`.
/// Kamien nie ma mapy wejscia epoki: zwraca false bez zmiany stanu.
pub fn mark_era_enter_turn(
    state: &mut WarTurnState,
    era: ForcedEra,
    owner: i64,
    turn: f64,
) -> bool {
    match era {
        ForcedEra::Bronze => upsert(&mut state.bronze_era_enter_turn_by_owner, owner, turn),
        ForcedEra::Iron => upsert(&mut state.iron_era_enter_turn_by_owner, owner, turn),
        ForcedEra::Stone => return false,
    }
    true
}

/// Wynik sprzatania przy pokoju: usunieta para, napastnik z odpoczynkiem i klucz usunietych fal.
#[derive(Debug, Clone, PartialEq)]
pub struct PeaceCleanup {
    pub era: ForcedEra,
    pub attacker_id: i64,
    pub rest_until: f64,
    /// Klucz `min-max` fal do usuniecia (web `forcedWarWavesByPairKey.delete`).
    pub waves_deleted_key: String,
}

/// Web `cleanup{Stone,Bronze,Iron}ForcedWarOnPeace(proposer, responder)`: tylko wpis TEJ epoki.
/// Brak wpisu = no-op (`None`). Odpoczynek = `turn + ODPOCZYNEK` (web `.set`).
pub fn cleanup_forced_war_on_peace(
    state: &mut WarTurnState,
    era: ForcedEra,
    a: i64,
    b: i64,
    turn: f64,
) -> Option<PeaceCleanup> {
    let key = pair_key(a, b);
    let slot = &mut state.forced[era_idx(era)];
    let pos = slot
        .active_by_pair_key
        .iter()
        .position(|(k, _)| *k == key)?;
    let (_, removed) = slot.active_by_pair_key.remove(pos);
    let rest_until = turn + rest_turns_after_peace(era);
    upsert(
        &mut slot.rest_until_by_owner,
        removed.attacker_id,
        rest_until,
    );
    Some(PeaceCleanup {
        era,
        attacker_id: removed.attacker_id,
        rest_until,
        waves_deleted_key: key,
    })
}

/// Blokada pokoju epoki (web ok. 11690): przy pokoju na parze z aktywna wojna wymuszona zapisuje
/// `{ownerId: napastnik, era: epoka napastnika}`. Kolejnosc szukania jak web: kamien, braz, zelazo.
/// Zwraca true, gdy blokade zapisano.
///
/// KONTRAKT KOLEJNOSCI: funkcja MUSI byc wywolana PRZED `cleanup_forced_war_on_peace` dla tej pary
/// (cleanup usuwa wpis aktywny, ktorego ta funkcja potrzebuje). Wolajacy pokoj powinien uzywac
/// `finalize_peace_between`, ktora zachowuje te kolejnosc. Test: `peace_lock_requires_cleanup_after`.
pub fn set_era_peace_lock(
    state: &mut WarTurnState,
    a: i64,
    b: i64,
    attacker_epoch_of: &dyn Fn(i64) -> i64,
) -> bool {
    let key = pair_key(a, b);
    let active = [0usize, 1, 2].into_iter().find_map(|idx| {
        state.forced[idx]
            .active_by_pair_key
            .iter()
            .find(|(k, _)| *k == key)
            .map(|(_, p)| p.attacker_id)
    });
    let Some(attacker) = active else {
        return false;
    };
    let mut entries = read_entries(&state.opaque, KEY_ERA_PEACE_LOCK);
    let lock = serde_json::json!({ "ownerId": attacker, "era": attacker_epoch_of(attacker) });
    upsert(&mut entries, key, lock);
    write_entries(&mut state.opaque, KEY_ERA_PEACE_LOCK, entries);
    true
}

/// Web `isForcedEraPeaceLocked(currentEra, warEra)` dla zapisanej blokady pary. Brak blokady = false.
pub fn is_era_peace_blocked(state: &WarTurnState, a: i64, b: i64, current_era: i64) -> bool {
    let key = pair_key(a, b);
    read_entries(&state.opaque, KEY_ERA_PEACE_LOCK)
        .iter()
        .find(|(k, _)| *k == key)
        .and_then(|(_, v)| v.get("era").and_then(Value::as_i64))
        .is_some_and(|war_era| is_forced_era_peace_locked(current_era, war_era))
}

/// Licznik zdobytych miast w wojnie zwyklej (web `regularWarCapturedByPairKey`, `ownerA = min`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct CityCapture {
    pub owner_a: i64,
    pub owner_b: i64,
    pub captured_by_a: i64,
    pub captured_by_b: i64,
}

impl CityCapture {
    fn from_value(v: &Value) -> Option<Self> {
        let o = v.as_object()?;
        Some(CityCapture {
            owner_a: o.get("ownerA")?.as_i64()?,
            owner_b: o.get("ownerB")?.as_i64()?,
            captured_by_a: o.get("capturedByA").and_then(Value::as_i64).unwrap_or(0),
            captured_by_b: o.get("capturedByB").and_then(Value::as_i64).unwrap_or(0),
        })
    }

    fn to_value(self) -> Value {
        serde_json::json!({
            "ownerA": self.owner_a,
            "ownerB": self.owner_b,
            "capturedByA": self.captured_by_a,
            "capturedByB": self.captured_by_b,
        })
    }
}

/// Wynik rejestracji utraty miasta w wojnie zwyklej.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CityLossVerdict {
    /// Pary nie ma w stanie wojny: nic nie zapisano (web: wczesny `return`).
    NotAtWar,
    /// Para ma aktywna wojne WYMUSZONA w dowolnej epoce: bezpiecznik weba (`*ForceWarActiveByPairKey.has`),
    /// nic nie zapisano, zeby nie liczyc miast podwojnie (web main.ts ok. 35614-35620).
    ForcedWarPair,
    /// Licznik zapisany, prog nieosiagniety.
    Counted,
    /// Prog osiagniety, ale bilans AI-AI ujemny: licznik zostaje, pokoj nie nastepuje (Z3).
    BalanceBlocked(CityCapture),
    /// Prog osiagniety: wpis usuniety, wolajacy finalizuje pokoj z cooldownem.
    EndByPeace(CityCapture),
}

fn read_entries(opaque: &Map<String, Value>, key: &str) -> Vec<(String, Value)> {
    opaque
        .get(key)
        .and_then(Value::as_array)
        .map(|arr| {
            arr.iter()
                .filter_map(|e| {
                    let p = e.as_array()?;
                    Some((p.first()?.as_str()?.to_string(), p.get(1)?.clone()))
                })
                .collect()
        })
        .unwrap_or_default()
}

fn write_entries(opaque: &mut Map<String, Value>, key: &str, entries: Vec<(String, Value)>) {
    let arr = entries
        .into_iter()
        .map(|(k, v)| Value::Array(vec![Value::from(k), v]))
        .collect();
    opaque.insert(key.to_string(), Value::Array(arr));
}

/// Czy para ma wpis aktywnej wojny wymuszonej w ktorejkolwiek epoce (web: `*ForceWarActiveByPairKey.has`).
fn has_forced_war_pair(state: &WarTurnState, key: &str) -> bool {
    state
        .forced
        .iter()
        .any(|slot| slot.active_by_pair_key.iter().any(|(k, _)| k == key))
}

/// Web `cleanupRegularWarOnPeace(proposer, responder)` (ok. 11648-11653): przy KAZDYM pokoju pary usuwa
/// licznik zwyklej wojny, zadanie pokoju AI-AI i zmeczenie wojna. Zwraca liczbe realnie usunietych wpisow.
/// Mapy bez wpisu pozostaja nietkniete (brak klucza = brak zapisu), wiec round-trip meta sie nie zmienia.
pub fn cleanup_regular_war_on_peace(state: &mut WarTurnState, a: i64, b: i64) -> usize {
    let key = pair_key(a, b);
    let mut removed = 0;
    for meta_key in [
        KEY_REGULAR_WAR_CAPTURED,
        KEY_AI_AI_PEACE_REQUEST,
        KEY_WAR_WEARINESS,
    ] {
        if !state.opaque.contains_key(meta_key) {
            continue;
        }
        let mut entries = read_entries(&state.opaque, meta_key);
        let before = entries.len();
        entries.retain(|(k, _)| *k != key);
        if entries.len() != before {
            removed += 1;
            write_entries(&mut state.opaque, meta_key, entries);
        }
    }
    removed
}

/// Raport pokoju z `finalize_peace_between`.
#[derive(Debug, Clone, PartialEq)]
pub struct PeaceFinalizeReport {
    /// Czy zapisano blokade pokoju epoki (wymaga aktywnej wojny wymuszonej pary).
    pub era_lock_set: bool,
    /// Sprzatniete wpisy wojny wymuszonej (kolejnosc: kamien, zelazo, braz - jak web).
    pub forced_cleaned: Vec<PeaceCleanup>,
    /// Liczba usunietych wpisow wojny zwyklej (`cleanup_regular_war_on_peace`).
    pub regular_cleaned: usize,
}

/// Wspolny punkt wejscia dla KAZDEGO pokoju pary (web `finalizePeaceTreatyBetween`, kolejnosc z ok. 11690
/// i 11739-11742): najpierw blokada epoki (czyta wpis aktywny), potem sprzatanie wojny wymuszonej
/// i wojny zwyklej. Wolajacy nie moze zmienic tej kolejnosci.
pub fn finalize_peace_between(
    state: &mut WarTurnState,
    a: i64,
    b: i64,
    turn: f64,
    attacker_epoch_of: &dyn Fn(i64) -> i64,
) -> PeaceFinalizeReport {
    let era_lock_set = set_era_peace_lock(state, a, b, attacker_epoch_of);
    let mut forced_cleaned = Vec::new();
    for era in [ForcedEra::Stone, ForcedEra::Iron, ForcedEra::Bronze] {
        if let Some(c) = cleanup_forced_war_on_peace(state, era, a, b, turn) {
            forced_cleaned.push(c);
        }
    }
    let regular_cleaned = cleanup_regular_war_on_peace(state, a, b);
    PeaceFinalizeReport {
        era_lock_set,
        forced_cleaned,
        regular_cleaned,
    }
}

/// Web `recordRegularWarCityLoss(oldOwner, newOwner)` (ok. 35620-35660). `at_war` = relacja pary to wojna;
/// `ai_ai_balance_ok` = wynik bramki bilansu AI-AI (Z3), liczony tylko gdy prog osiagniety.
pub fn register_regular_war_city_loss(
    state: &mut WarTurnState,
    old_owner: i64,
    new_owner: i64,
    at_war: bool,
    ai_ai_balance_ok: bool,
) -> CityLossVerdict {
    if old_owner == new_owner {
        return CityLossVerdict::NotAtWar;
    }
    let key = pair_key(old_owner, new_owner);
    if has_forced_war_pair(state, &key) {
        return CityLossVerdict::ForcedWarPair;
    }
    if !at_war {
        return CityLossVerdict::NotAtWar;
    }
    let owner_a = old_owner.min(new_owner);
    let owner_b = old_owner.max(new_owner);
    let mut entries = read_entries(&state.opaque, KEY_REGULAR_WAR_CAPTURED);
    let mut st = entries
        .iter()
        .find(|(k, _)| *k == key)
        .and_then(|(_, v)| CityCapture::from_value(v))
        .unwrap_or(CityCapture {
            owner_a,
            owner_b,
            captured_by_a: 0,
            captured_by_b: 0,
        });
    if new_owner == owner_a {
        st.captured_by_a += 1;
    } else {
        st.captured_by_b += 1;
    }
    if !should_end_forced_war_by_city_count(
        st.captured_by_a,
        st.captured_by_b,
        REGULAR_WAR_CITY_LIMIT,
    ) {
        upsert(&mut entries, key, st.to_value());
        write_entries(&mut state.opaque, KEY_REGULAR_WAR_CAPTURED, entries);
        return CityLossVerdict::Counted;
    }
    if !ai_ai_balance_ok {
        upsert(&mut entries, key, st.to_value());
        write_entries(&mut state.opaque, KEY_REGULAR_WAR_CAPTURED, entries);
        return CityLossVerdict::BalanceBlocked(st);
    }
    entries.retain(|(k, _)| *k != key);
    write_entries(&mut state.opaque, KEY_REGULAR_WAR_CAPTURED, entries);
    CityLossVerdict::EndByPeace(st)
}

/// Komenda zakupu jednostki AI (web `shouldAIPurchaseUnit` -> `purchaseRecruitmentUnit`, Z4).
#[derive(Debug, Clone, PartialEq)]
pub struct AiPurchaseCommand {
    pub owner_id: i64,
    pub city_id: String,
    pub unit: UnitRecruitment,
    pub params: AiPurchaseParams,
}

/// Wynik pojedynczej komendy zakupu.
#[derive(Debug, Clone, PartialEq)]
pub struct AiPurchaseReport {
    pub owner_id: i64,
    pub city_id: String,
    pub outcome: AiPurchaseOutcome,
}

/// Wykonuje komendy zakupu w kolejnosci wejscia na realnym stanie panstwa kazdego wlasciciela (Z4).
/// Komenda wlasciciela bez stanu (`states` nie ma klucza) jest pomijana bez raportu (Z4).
pub fn run_ai_purchase_commands(
    states: &mut BTreeMap<i64, AiPurchaseState>,
    cmds: &[AiPurchaseCommand],
) -> Vec<AiPurchaseReport> {
    let mut reports = Vec::with_capacity(cmds.len());
    for cmd in cmds {
        let Some(state) = states.get_mut(&cmd.owner_id) else {
            continue;
        };
        let outcome = ai_try_purchase_unit(state, &cmd.unit, &cmd.params);
        reports.push(AiPurchaseReport {
            owner_id: cmd.owner_id,
            city_id: cmd.city_id.clone(),
            outcome,
        });
    }
    reports
}
