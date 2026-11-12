//! P6-WIRE-WAR-PIPELINE (W8 r3): pipeline wojny tury, faza `Diplomacy` (wariant B).
//!
//! Jedno miejsce wejscia: `run_war_turn(&mut WarTurnContext)`, wolane z `PlayableGame::advance_turn`
//! przy fazie `TurnPhase::Diplomacy` (jedna linia w `playable.rs`). Kolejnosc krokow fazy zgodna z
//! kolejnoscia Rust (`events.rs`), NIE z web (decyzja wlasciciela, wariant B). Roznice wzgledem web:
//! patrz tabela w raporcie `02c-operator-r3.md`.
//!
//! Krok fazy Diplomacy (kolejnosc Rust):
//! 1. klasyfikacja wlascicieli (`all_power_owner_ids` + `phase_owners`, brak faktu = blad),
//! 2. pary: AI<->AI kwalifikowane + gracz<->AI kwalifikowany,
//! 3. wejscia wymagane tylko gdy sa pary (moc, epoki, blokady pokoju); brak producenta = blad,
//! 4. bramka R1/R2 liczona na poczatku fazy (licznik wojen z `WarTurnState.brake_phase.at_war`),
//! 5. tick relacji par (`tick_pairs_relation_scores`) z `TickContext`, w ktorym
//!    `common_border_delta = shared_border_penalty_for_epochs(epoka obu stron)` (zamyka dlug BORDER-WIRING),
//! 6. hamulec wojny (`run_brake_phase`) na `WarTurnState.brake_phase`.
//!
//! Granice (jawnie): efekty deklaracji wojny (traktaty, sojusze, UI) NIE sa tu stosowane - zwracamy
//! `declarations`. Fazy Economy/Production/Ai (oblezenie, AI-AI) czekaja na r4.
//!
//! Producenci w `WarTurnInputs::from_playable` (tylko to, co `PlayableState` i `WarTurnState` faktycznie
//! zawieraja): gracze, miasta (wlasciciele, liczba), kontakty (`diplomaticallyDiscoveredOwners` z
//! surowego `opaque`). NIE maja producenta w tym partii: epoki wlascicieli, skladniki mocy
//! (`ObjectivePowerRaw`), blokady pokoju wymuszonej epoki i `PairMetaWeb`, wspolna granica, pelny
//! `TickContext` (handel, religia, dobra wola, wiarygodnosc). Brak producenta dla pary = jawny `WarTurnError`,
//! nie cicha wartosc zerowa.

use std::collections::{BTreeMap, BTreeSet};
use std::fmt;

use crate::data::units_combat::parse_power_params;

use super::ai_diplomacy_turn::{
    pair_key, run_brake_phase, tick_pairs_relation_scores, BrakePhaseInput, PairKey, PairWarParams,
    PhaseOwner,
};
use super::brake_inputs::{
    all_power_owner_ids, gate_blocked_set, peace_locked_set, phase_owners, power_map,
    ForcedEraLock, GateFacts, OwnerFacts, OwnerRoles,
};
use super::brake_power::{
    battle_power_model, military_component_keys, objective_power_for_owner, BattlePowerModel,
    ObjectivePowerRaw, PowerCoeffs, PowerInputError,
};
use super::diplomacy::{shared_border_penalty_for_epochs, DiplomacyParams, TickContext};
use super::diplomacy_tick_war_brake::{ai_ai_pairs, is_ai_ai_eligible_owner, BrakeWarOutcome};
use super::diplomacy_truce::PairMetaWeb;
use super::playable::PlayableState;
use super::turn_war_dipl_steps::{
    note_war_declarations, run_dipl_steps, DiplStepsContext, DiplStepsInputs, DiplStepsReport,
};
use super::war_turn_state::WarTurnState;

/// Tabele mocy z `data/power-params.json` (identyczne z pinem) plus model bitwy i klucze wojskowe.
#[derive(Debug, Clone, PartialEq)]
pub struct PowerModel {
    pub coeffs: PowerCoeffs,
    pub battle: BattlePowerModel,
    pub military: BTreeSet<&'static str>,
}

impl PowerModel {
    /// Wczytanie z wbudowanego JSON (blad parsowania = blad builda, stad `expect`).
    pub fn web_params() -> Self {
        let p = parse_power_params().expect("power-params.json must parse");
        Self {
            coeffs: PowerCoeffs::from_params(&p),
            battle: battle_power_model(&p),
            military: military_component_keys(&p),
        }
    }
}

/// Konfiguracja fazy wojny (ustawienia gry, nie stan tury).
#[derive(Debug, Clone, PartialEq)]
pub struct WarTurnConfig {
    pub diplomacy: DiplomacyParams,
    /// Web `diploBrakeWarParams` per para (brak wpisu = para pominieta przez hamulec, jak w webie).
    pub pair_params: BTreeMap<PairKey, PairWarParams>,
    /// Web `diploTickP6.kryzysOstrzezenieTurPrzed`.
    pub ostrzezenie_tur_przed: f64,
    /// Web `isWarRulesMultiwarEnabled()`.
    pub multiwar_enabled: bool,
    pub power: PowerModel,
}

impl WarTurnConfig {
    pub fn new(pair_params: BTreeMap<PairKey, PairWarParams>, multiwar_enabled: bool) -> Self {
        Self {
            diplomacy: DiplomacyParams::default(),
            pair_params,
            ostrzezenie_tur_przed: 2.0,
            multiwar_enabled,
            power: PowerModel::web_params(),
        }
    }
}

/// Blokady pokoju (web `forcedEraPeaceUntilNextEraByPairKey`, `diplomacyPairMeta`). Producent: r4.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct PeaceLockFacts {
    pub forced_era_locks: BTreeMap<PairKey, ForcedEraLock>,
    pub meta_by_pair: BTreeMap<PairKey, PairMetaWeb>,
}

/// Wejscia tury od producentow. `None` / brak wpisu = producent nieobecny (blad przy uzyciu).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct WarTurnInputs {
    pub me_id: i64,
    pub human_ids: Vec<i64>,
    /// Web `getDiplomaticContacts(ME)`.
    pub contacts: Vec<i64>,
    pub city_owner_ids: Vec<i64>,
    pub ai_start_owner_ids: Vec<i64>,
    pub owner_facts: BTreeMap<i64, OwnerFacts>,
    /// Web `empireEpochForOwner` dla KAZDEGO wlasciciela (wymagane, gdy sa pary).
    pub epochs: BTreeMap<i64, f64>,
    /// `objectivePowerForOwner` wejscia per wlasciciel (wymagane dla uczestnikow par).
    pub power_raw: BTreeMap<i64, ObjectivePowerRaw>,
    /// Pary ze wspolna granica (web `commonBorder`).
    pub shared_border: BTreeSet<PairKey>,
    /// Bazowy `TickContext` per para (handel, religia, dobra wola...). Brak wpisu = domyslny.
    pub tick_extras: BTreeMap<PairKey, TickContext>,
    pub peace_locks: Option<PeaceLockFacts>,
    /// Wejscia krokow D1-D7 (`turn_war_dipl_steps`); `Default` = brak wejsc (kroki lenia: blad tylko gdy potrzebne).
    pub dipl: DiplStepsInputs,
}

/// Kontekst wywolania: stan wojny (wlasciciel) + wejscia + konfiguracja.
pub struct WarTurnContext<'a> {
    pub war: &'a mut WarTurnState,
    /// Web: numer tury (`turn`), uzywany w oknach czasowych.
    pub turn: f64,
    pub inputs: &'a WarTurnInputs,
    pub config: &'a WarTurnConfig,
}

/// Wynik fazy. Deklaracje wojny NIE sa tu stosowane (efekty w W4/W8).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct WarTurnReport {
    pub tick_pairs: Vec<PairKey>,
    pub relation_after_tick: BTreeMap<PairKey, f64>,
    pub dobra_active: BTreeSet<PairKey>,
    pub declarations: Vec<BrakeWarOutcome>,
    /// Raport krokow D1-D7 (K7).
    pub dipl: DiplStepsReport,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum WarTurnError {
    MissingOwnerFacts(i64),
    MissingEpoch(i64),
    MissingPower(i64),
    /// STRICT (POWER-NOZEROS): skladniki mocy w stanie `Missing` (klucze web `breakdown.key`).
    PowerComponentsMissing(i64, Vec<&'static str>),
    /// STRICT (POWER-NAN-STRICT): skladniki mocy podane jako `Provided(NaN/Inf)` (klucze web
    /// `breakdown.key`); odrzucane jawnie, nie zerowane ani propagowane.
    PowerComponentNonFinite(i64, Vec<&'static str>),
    MissingPeaceLocks,
    /// K7 (D1-D7): brak wejscia lub niespojny stan kroku dyplomacji, z powodem (nigdy ciche zero).
    DiplStep(String),
}

impl fmt::Display for WarTurnError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingOwnerFacts(id) => write!(f, "war turn: brak faktow wlasciciela {id}"),
            Self::MissingEpoch(id) => write!(f, "war turn: brak epoki wlasciciela {id}"),
            Self::MissingPower(id) => write!(f, "war turn: brak wejsc mocy wlasciciela {id}"),
            Self::PowerComponentsMissing(id, keys) => write!(
                f,
                "war turn: wlasciciel {id}: skladniki mocy bez zrodla (STRICT): {}",
                keys.join(", ")
            ),
            Self::PowerComponentNonFinite(id, keys) => write!(
                f,
                "war turn: wlasciciel {id}: skladniki mocy nieskonczone/NaN (STRICT): {}",
                keys.join(", ")
            ),
            Self::MissingPeaceLocks => write!(f, "war turn: brak producenta blokad pokoju"),
            Self::DiplStep(why) => write!(f, "war turn: krok dyplomacji D1-D7: {why}"),
        }
    }
}

impl std::error::Error for WarTurnError {}

impl WarTurnInputs {
    /// Producenci z `PlayableState` i `WarTurnState` (to, co te typy faktycznie zawieraja).
    /// Epoki, moc, blokady pokoju, wspolna granica i dodatkowe skladniki `TickContext` NIE sa tu
    /// produkowane (zob. naglowek modulu); pusta faza (bez AI z miastami) nie wymaga ich.
    pub fn from_playable(state: &PlayableState, war: &WarTurnState) -> Self {
        let me_id = state
            .players
            .iter()
            .find(|p| p.is_human)
            .map(|p| p.id.get() as i64)
            .unwrap_or(-1);
        let human_ids = state
            .players
            .iter()
            .filter(|p| p.is_human)
            .map(|p| p.id.get() as i64)
            .collect();
        let ai_start_owner_ids: Vec<i64> = state
            .players
            .iter()
            .filter(|p| !p.is_human)
            .map(|p| p.id.get() as i64)
            .collect();
        let city_owner_ids: Vec<i64> = state
            .cities
            .iter()
            .map(|c| c.owner_id.get() as i64)
            .collect();
        let mut owner_facts = BTreeMap::new();
        let owner_ids = state
            .players
            .iter()
            .map(|p| p.id.get() as i64)
            .chain(city_owner_ids.iter().copied());
        for id in owner_ids {
            let city_count = city_owner_ids.iter().filter(|&&c| c == id).count() as f64;
            // PlayableState nie ma barbarzyncow, kopii miast ani eliminacji: fakty sa stale false.
            owner_facts.entry(id).or_insert(OwnerFacts {
                is_barbarian: false,
                is_city_copy: false,
                eliminated: false,
                city_count,
            });
        }
        // Kontakty: surowa tablica `diplomaticallyDiscoveredOwners` (klucz web, brak => pusta, jak `?? []`).
        let contacts = war
            .opaque
            .get("diplomaticallyDiscoveredOwners")
            .and_then(|v| v.as_array())
            .map(|a| a.iter().filter_map(|v| v.as_i64()).collect())
            .unwrap_or_default();
        Self {
            me_id,
            human_ids,
            contacts,
            city_owner_ids,
            ai_start_owner_ids,
            owner_facts,
            ..Self::default()
        }
    }
}

/// Jeden krok fazy Diplomacy (wariant B). Zob. naglowek modulu.
pub fn run_war_turn(ctx: &mut WarTurnContext<'_>) -> Result<WarTurnReport, WarTurnError> {
    let inp = ctx.inputs;
    let cfg = ctx.config;
    let me = inp.me_id;
    let roles = OwnerRoles {
        me,
        human_ids: &inp.human_ids,
    };

    // 1) Wlasciciele i kwalifikacja.
    // Web `allPowerOwnerIds` zawsze zaczyna sie od `0`. Port: wpis `0` wchodzi tylko, gdy producent
    // podal dla niego fakty (PlayableState numeruje graczy od 1); pozostale id sa wymagane.
    let owner_ids: Vec<i64> = all_power_owner_ids(&inp.city_owner_ids, &inp.ai_start_owner_ids)
        .into_iter()
        .filter(|&id| id != 0 || inp.owner_facts.contains_key(&0))
        .collect();
    let owners = phase_owners(&roles, &owner_ids, &inp.owner_facts)
        .map_err(|e| WarTurnError::MissingOwnerFacts(e.owner_id))?;
    let eligible: Vec<i64> = owners
        .iter()
        .filter(|o| o.id != me && is_ai_ai_eligible_owner(&o.info))
        .map(|o| o.id)
        .collect();

    // 2) Pary (kolejnosc jak w hamulcu: AI-AI, potem gracz-AI).
    let mut tick_pairs: Vec<PairKey> = ai_ai_pairs(&eligible)
        .into_iter()
        .map(|(a, b)| pair_key(a, b))
        .collect();
    tick_pairs.extend(eligible.iter().map(|&o| pair_key(me, o)));

    // 3) Wejscia wymagane tylko przy parach.
    let mut report = WarTurnReport {
        tick_pairs: tick_pairs.clone(),
        ..WarTurnReport::default()
    };
    let (epochs, power, peace, gate) = if tick_pairs.is_empty() {
        (BTreeMap::new(), BTreeMap::new(), None, BTreeSet::new())
    } else {
        for &id in std::iter::once(&me).chain(eligible.iter()) {
            if !inp.power_raw.contains_key(&id) {
                return Err(WarTurnError::MissingPower(id));
            }
        }
        for &id in owner_ids.iter().chain(std::iter::once(&me)) {
            if !inp.epochs.contains_key(&id) {
                return Err(WarTurnError::MissingEpoch(id));
            }
        }
        let locks = inp
            .peace_locks
            .as_ref()
            .ok_or(WarTurnError::MissingPeaceLocks)?;
        let epochs = inp.epochs.clone();
        let mut power_values: BTreeMap<i64, f64> = BTreeMap::new();
        for id in std::iter::once(me).chain(eligible.iter().copied()) {
            let value = objective_power_for_owner(
                &inp.power_raw[&id],
                &cfg.power.coeffs,
                cfg.power.battle,
                &cfg.power.military,
            )
            .map_err(|e| match e {
                PowerInputError::Missing(m) => WarTurnError::PowerComponentsMissing(id, m.0),
                PowerInputError::NonFinite(n) => WarTurnError::PowerComponentNonFinite(id, n.0),
            })?;
            power_values.insert(id, value);
        }
        let power = power_map(
            &std::iter::once(me)
                .chain(eligible.iter().copied())
                .collect::<Vec<_>>(),
            |id| power_values[&id],
        );
        let peace = peace_locked_set(
            &tick_pairs,
            &locks.forced_era_locks,
            |o| epochs.get(&o).copied().unwrap_or(0.0) as i64,
            &locks.meta_by_pair,
            ctx.turn,
        );
        // Bramka R1/R2 na poczatku fazy: licznik aktywnych wojen bez barbarzyncow.
        let facts: BTreeMap<i64, GateFacts> = owners
            .iter()
            .filter(|o| tick_pairs.iter().any(|&(a, b)| a == o.id || b == o.id))
            .map(|o| {
                let war_count = ctx
                    .war
                    .brake_phase
                    .at_war
                    .iter()
                    .filter(|&&(a, b)| {
                        (a == o.id && !is_barbarian(inp, b)) || (b == o.id && !is_barbarian(inp, a))
                    })
                    .count() as i64;
                (
                    o.id,
                    GateFacts {
                        era: epochs[&o.id] as i64,
                        war_count,
                        is_player: roles.is_human(o.id),
                    },
                )
            })
            .collect();
        let gate = gate_blocked_set(cfg.multiwar_enabled, ctx.turn, &tick_pairs, &facts);
        (epochs, power, Some(peace), gate)
    };

    // 3b) K7: kroki D1-D7 pinu (przed tickiem relacji par i hamulcem D8, jak na pinie).
    let mut dipl_owner_ids: Vec<i64> = inp
        .human_ids
        .iter()
        .chain(inp.ai_start_owner_ids.iter())
        .chain(inp.city_owner_ids.iter())
        .copied()
        .collect();
    dipl_owner_ids.sort_unstable();
    dipl_owner_ids.dedup();
    report.dipl = run_dipl_steps(
        ctx.war,
        &DiplStepsContext {
            me_id: me,
            human_ids: &inp.human_ids,
            contacts: &inp.contacts,
            owner_ids: &dipl_owner_ids,
            turn: ctx.turn,
            inputs: &inp.dipl,
        },
    )?;

    // 4) Tick relacji par z TickContext (wspolna granica = delta wg epoki pary).
    let mut contexts = BTreeMap::new();
    for &(a, b) in &tick_pairs {
        let mut tc = inp.tick_extras.get(&(a, b)).copied().unwrap_or_default();
        tc.common_border = inp.shared_border.contains(&(a, b));
        tc.common_border_delta = Some(shared_border_penalty_for_epochs(
            epochs[&a],
            epochs[&b],
            &cfg.diplomacy,
        ));
        contexts.insert((a, b), tc);
    }
    let relation_after_tick = tick_pairs_relation_scores(
        &mut ctx.war.diplomacy,
        &tick_pairs,
        &contexts,
        &cfg.diplomacy,
    );

    // 5) Hamulec wojny. Wejscie `peace` jest pusta tylko, gdy nie ma par.
    let peace_locked = peace.unwrap_or_default();
    let phase_owners_ref: &[PhaseOwner] = &owners;
    let input = BrakePhaseInput {
        me_id: me,
        contacts: &inp.contacts,
        owners: phase_owners_ref,
        relation_after_tick: &relation_after_tick,
        params: &cfg.pair_params,
        ostrzezenie_tur_przed: cfg.ostrzezenie_tur_przed,
        power: &power,
        peace_locked: &peace_locked,
        gate_blocked: &gate,
    };
    let out = run_brake_phase(&mut ctx.war.brake_phase, &input);
    // P4 (hak wojny, web `main.ts:12223-12224`): kazda wojna z hamulca zeruje licznik "bez wojny" obu stron.
    let entered: Vec<(i64, i64)> = out
        .declarations
        .iter()
        .map(|d| (d.declarer, d.victim))
        .collect();
    note_war_declarations(ctx.war, &entered, ctx.turn)?;
    report.relation_after_tick = relation_after_tick;
    report.dobra_active = out.dobra_active;
    report.declarations = out.declarations;
    Ok(report)
}

fn is_barbarian(inp: &WarTurnInputs, id: i64) -> bool {
    inp.owner_facts.get(&id).is_some_and(|f| f.is_barbarian)
}
