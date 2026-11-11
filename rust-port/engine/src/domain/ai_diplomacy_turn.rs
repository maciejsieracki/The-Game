//! P6-WIRE-WAR-DIPLO-TURN (W6): faza dyplomacji tury — galaz hamulca (`diplomacy_tick_war_brake` ON).
//!
//! web: gra/src/main.ts `runDiplomacyTurnTick` (l.24229, galaz `if (brakeOn)`), `tickDiploAiAiPairsWithBrake`
//! (l.11734), `diploBrakeCrisisStep` (l.11578), `diploAiOwnersEligible` (l.11601), `processDiploCrisisQueue`
//! (l.11650), `diploBrakeWarParams` (l.11567); dobra wola: `dobraWolaTurnStep` (P4, galaz ON).
//! Pure funkcje skladowe (`advance_crisis_counter`, `sort_crisis_queue`, `brake_war_outcome`, ...) sa w
//! `diplomacy_tick_war_brake.rs` i NIE sa tu duplikowane; ten plik tylko SKLADA je w jeden krok tury.
//!
//! ZAKRES I GRANICE (jawnie, zob. raport W6):
//! - Tick relacji pary (`tickDiplomacy`) jest WEJSCIEM: `relation_after_tick` (web: `relationScore` po ticku).
//! - Galaz OFF (`isDiploTickWarBrakeEnabled() == false`) NIE jest tu modelowana: caller wybiera galaz.
//! - Efekty deklaracji wojny (traktaty, sojusze, zdarzenia, UI) NIE sa tu: zwracamy `declarations`,
//!   a skutki stosuje caller (W4/W8). Tu tylko `at_war` i liczniki.
//! - Podpiecie do petli tury Rust = W8 (ostatnia partia planu, `P6-WIRE-WAR-TURN-PLAN.md`).
//!
//! ZALOZENIA (adaptacja, logika bez zmian):
//! - Klucz pary = `(min, max)` (web: `diploPairKey` = `lo_hi`).
//! - Brakujacy parametr pary / zaufanie / sila w mapach wejsciowych: web nigdy ich nie ma (dane zawsze
//!   komplet), wiec Rust przyjmuje domyslne neutralne: zaufanie NaN (= reset), sila 0.0, `n` = +inf.

use std::collections::{BTreeMap, BTreeSet};

use super::diplomacy_tick_war_brake::{
    ai_ai_pairs, brake_war_outcome, crisis_step_for_pair, dobra_wola_turn_step,
    is_ai_ai_eligible_owner, sort_crisis_queue, AiAiOwnerInfo, BrakeWarOutcome, CrisisQueueEntry,
    CrisisStep, WarBrakeP6Params, WarPower,
};

/// Klucz pary niezalezny od kolejnosci: `(min, max)`. Web: `diploPairKey`.
pub type PairKey = (i64, i64);

/// Web: `diploPairKey(a, b)`.
pub fn pair_key(a: i64, b: i64) -> PairKey {
    (a.min(b), a.max(b))
}

/// Parametry wojny z progu dla pary (web: `diploBrakeWarParams` -> `{ prog, n }`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PairWarParams {
    /// Prog relacji (wlacznie); relacja <= prog liczy sie jako kryzys.
    pub prog: f64,
    /// Liczba kolejnych tur kryzysu do wojny (N).
    pub n: f64,
}

/// Stan fazy, ktory przechodzi z tury na ture (web: `diplomacyCrisisCounters`, status wojny, `dobraWolaRemainingTur`).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct BrakePhaseState {
    /// Web: `diplomacyCrisisCounters` (wpis 0 = usuniety, nigdy nie przechowywany).
    pub counters: BTreeMap<PairKey, f64>,
    /// Pary w stanie `wojna` (web: `getDiploRelation(a,b).status === 'wojna'`).
    pub at_war: BTreeSet<PairKey>,
    /// Web: `getDiploPairMeta(ME, oid).dobraWolaRemainingTur` dla par gracz<->AI.
    pub dobra_remaining: BTreeMap<PairKey, f64>,
}

/// Wlasciciel wchodzacy do fazy (web: `allPowerOwnerIds` + `diploOwnerEligibleForBrake`).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PhaseOwner {
    pub id: i64,
    pub info: AiAiOwnerInfo,
}

/// Wejscie jednej tury fazy.
#[derive(Debug, Clone, Copy)]
pub struct BrakePhaseInput<'a> {
    /// Web: `ME()` (gracz).
    pub me_id: i64,
    /// Web: `getDiplomaticContacts()` (kolejnosc bez znaczenia dla wyniku).
    pub contacts: &'a [i64],
    /// Wszyscy wlasciciele w kolejnosci `allPowerOwnerIds`.
    pub owners: &'a [PhaseOwner],
    /// Zaufanie (`relationScore`) po ticku, per para.
    pub relation_after_tick: &'a BTreeMap<PairKey, f64>,
    /// Parametry wojny z progu per para (web: `diploBrakeWarParams`).
    pub params: &'a BTreeMap<PairKey, PairWarParams>,
    /// Web: `diploTickP6.kryzysOstrzezenieTurPrzed` (ostrzezenie przed wojna).
    pub ostrzezenie_tur_przed: f64,
    /// Web: `objectivePowerForOwner` per owner.
    pub power: &'a BTreeMap<i64, f64>,
    /// Web: `isPeaceLockedBetween` per para (wynik sprawdzony przez caller).
    pub peace_locked: &'a BTreeSet<PairKey>,
    /// Web: `diploCrisisWarGateBlocked(declarer, victim)` (R1/R2) — wynik policzony przez caller, `(declarer, victim)`.
    pub gate_blocked: &'a BTreeSet<(i64, i64)>,
}

/// Wynik fazy dla tury.
#[derive(Debug, Clone, PartialEq)]
pub struct BrakePhaseOutput {
    /// Pary, ktorym dobra wola byla aktywna w tej turze (snapshot PRZED odliczeniem; web: `diplomacyDobraWolaActiveTura`).
    pub dobra_active: BTreeSet<PairKey>,
    /// Deklaracje wojny z progu w kolejnosci kolejki (web: `processDiploCrisisQueue`).
    pub declarations: Vec<BrakeWarOutcome>,
}

/// Web: `diploBrakeCrisisStep(a, b)` — jeden krok histerezy pary; licznik 0 = wpis usuniety.
pub fn brake_crisis_step(
    state: &mut BrakePhaseState,
    pair: PairKey,
    relation: f64,
    params: PairWarParams,
    ostrzezenie_tur_przed: f64,
) -> CrisisStep {
    let at_war = state.at_war.contains(&pair);
    let prev = state.counters.get(&pair).copied().unwrap_or(0.0);
    let p6 = WarBrakeP6Params {
        kryzys_prog_zaufania: params.prog,
        kryzys_tur_do_wojny: params.n,
        kryzys_ostrzezenie_tur_przed: ostrzezenie_tur_przed,
    };
    let step = crisis_step_for_pair(prev, relation, at_war, &p6);
    if step.counter > 0.0 {
        state.counters.insert(pair, step.counter);
    } else {
        state.counters.remove(&pair);
    }
    step
}

/// Web: `runDiplomacyTurnTick` galaz `brakeOn` (bez tickow relacji, ktore sa wejsciem).
///
/// Kolejnosc (zgodna z web): 1) odliczenie dobrej woli gracz<->kontakt; 2) AI<->AI: krok kryzysu po
/// kazdej parze, potem krok kryzysu gracz<->AI; 3) kolejka wojen z progu (sort, pominiecie: wojna,
/// blokada pokoju, gracz jako silniejsza strona, bramka R1/R2).
pub fn run_brake_phase(
    state: &mut BrakePhaseState,
    input: &BrakePhaseInput<'_>,
) -> BrakePhaseOutput {
    let me = input.me_id;
    let params_of = |key: PairKey| input.params.get(&key).copied();
    let n_of = |key: PairKey| params_of(key).map(|p| p.n).unwrap_or(f64::INFINITY);
    let relation_of = |key: PairKey| {
        input
            .relation_after_tick
            .get(&key)
            .copied()
            .unwrap_or(f64::NAN)
    };

    // 1) P4: dobra wola (snapshot aktywnosci przed odliczeniem, licznik spada).
    let mut dobra_active = BTreeSet::new();
    for &oid in input.contacts {
        if oid == me {
            continue;
        }
        let key = pair_key(me, oid);
        let rem = state.dobra_remaining.get(&key).copied().unwrap_or(0.0);
        if rem > 0.0 {
            let step = dobra_wola_turn_step(rem);
            if step.active_this_turn {
                dobra_active.insert(key);
            }
            state.dobra_remaining.insert(key, step.next);
        }
    }

    // 2) P3/P6: pary AI<->AI, potem gracz<->AI (ta sama kwalifikacja: diploOwnerEligibleForBrake).
    let eligible: Vec<i64> = input
        .owners
        .iter()
        .filter(|o| o.id != me && is_ai_ai_eligible_owner(&o.info))
        .map(|o| o.id)
        .collect();
    let ai_pairs: Vec<(i64, i64)> = ai_ai_pairs(&eligible);
    for (a, b) in ai_pairs {
        let key = pair_key(a, b);
        if let Some(p) = params_of(key) {
            brake_crisis_step(state, key, relation_of(key), p, input.ostrzezenie_tur_przed);
        }
    }
    for &o in &eligible {
        let key = pair_key(me, o);
        if let Some(p) = params_of(key) {
            brake_crisis_step(state, key, relation_of(key), p, input.ostrzezenie_tur_przed);
        }
    }

    // 3) P6: kolejka wojen z progu (processDiploCrisisQueue).
    let mut ready: Vec<CrisisQueueEntry> = Vec::new();
    let snapshot: Vec<(PairKey, f64)> = state.counters.iter().map(|(k, v)| (*k, *v)).collect();
    for (key, counter) in snapshot {
        if state.at_war.contains(&key) {
            state.counters.remove(&key);
            continue;
        }
        if counter >= n_of(key) {
            ready.push(CrisisQueueEntry {
                owner_a: key.0,
                owner_b: key.1,
                counter,
            });
        }
    }
    let power_of = |id: i64| input.power.get(&id).copied().unwrap_or(0.0);
    let mut declarations = Vec::new();
    for e in sort_crisis_queue(&ready) {
        let key = pair_key(e.owner_a, e.owner_b);
        if state.at_war.contains(&key) {
            state.counters.remove(&key);
            continue;
        }
        if input.peace_locked.contains(&key) {
            continue;
        }
        let outcome = brake_war_outcome(
            WarPower {
                owner_id: e.owner_a,
                power: power_of(e.owner_a),
            },
            WarPower {
                owner_id: e.owner_b,
                power: power_of(e.owner_b),
            },
            |o| o == me,
        );
        if !outcome.may_declare {
            continue;
        }
        if input
            .gate_blocked
            .contains(&(outcome.declarer, outcome.victim))
        {
            continue;
        }
        state.at_war.insert(key);
        state.counters.remove(&key);
        declarations.push(outcome);
    }

    BrakePhaseOutput {
        dobra_active,
        declarations,
    }
}
