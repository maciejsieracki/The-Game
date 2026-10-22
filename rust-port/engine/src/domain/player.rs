use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet, HashMap};
use std::fmt;

use serde::{Deserialize, Serialize};

use super::hex::HexCoord;
use super::{Difficulty, EngineError, OwnerRef, PlayerId};
use crate::data::buildings_tech::Technologia;
use crate::data::civilizations::BonusyItem;
use crate::data::derived::{
    parse_player_state_params, parse_research_costs, PlayerStateParamsFile, ResearchCostsFile,
};

/// Fotel gracza ludzkiego w single-player (web `HUMAN_OWNER_PRIMARY`, human-owners.ts:21).
pub const HUMAN_OWNER_PRIMARY: PlayerId = PlayerId::new(0);

/// AI-MANAGE-Q1=A (web `isMajorAiOwner`, owner-utils.ts:12): major AI to właściciel-gracz
/// o id > 0, który nie jest miastem-państwem. Barbarzyńca i rebelianci nie są major AI.
pub fn is_major_ai_owner(owner: OwnerRef, is_city_state: impl Fn(PlayerId) -> bool) -> bool {
    match owner {
        OwnerRef::Player(id) => id.get() > 0 && !is_city_state(id),
        OwnerRef::Barbarian | OwnerRef::Rebel => false,
    }
}

/// Stan foteli ludzkich (web `HumanSeats`, human-owners.ts:27). Pojedynczy fotel = single-player,
/// więcej niż jeden = hot-seat. Aktywny fotel może być spoza listy (wtedy brak następnego).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HumanSeats {
    human_owners: Vec<PlayerId>,
    active: PlayerId,
}

impl HumanSeats {
    pub fn new(human_owners: Vec<PlayerId>, active: PlayerId) -> Self {
        Self {
            human_owners,
            active,
        }
    }

    pub fn human_owners(&self) -> &[PlayerId] {
        &self.human_owners
    }

    pub const fn active(&self) -> PlayerId {
        self.active
    }

    /// Web `isHumanOwner`: właściciel jest którymkolwiek z foteli ludzkich.
    pub fn is_human_owner(&self, owner: OwnerRef) -> bool {
        owner
            .player()
            .is_some_and(|id| self.human_owners.contains(&id))
    }

    /// Web `isActiveHuman`: właściciel jest DOKŁADNIE aktywnym fotelem.
    pub fn is_active_human(&self, owner: OwnerRef) -> bool {
        owner == OwnerRef::Player(self.active)
    }

    /// Web `isAiOwner`: nie człowiek, nie barbarzyńca, nie rebeliant.
    pub fn is_ai_owner(&self, owner: OwnerRef) -> bool {
        if self.is_human_owner(owner) {
            return false;
        }
        !owner.is_barbarian() && owner != OwnerRef::Rebel
    }

    /// Web `nextHumanSeat`: kolejny fotel po aktywnym, cyklicznie. `None` przy <= 1 foteli
    /// lub gdy aktywny fotel nie należy do listy.
    pub fn next_human_seat(&self) -> Option<PlayerId> {
        if self.human_owners.len() <= 1 {
            return None;
        }
        let index = self.human_owners.iter().position(|id| *id == self.active)?;
        self.human_owners
            .get((index + 1) % self.human_owners.len())
            .copied()
    }

    /// Web `isHotSeat`: więcej niż jeden fotel ludzki.
    pub fn is_hot_seat(&self) -> bool {
        self.human_owners.len() > 1
    }
}

/// Komunikat odmowy założenia pierwszego miasta poza kręgiem startu (web
/// `FIRST_CITY_START_REVEAL_DENIED`, first-player-city.ts:9).
pub const FIRST_CITY_START_REVEAL_DENIED: &str = "poza oświetlonym obszarem startu";

/// Web `isAwaitingFirstPlayerCity` (first-player-city.ts:16): gracz nigdy nie posiadał miasta
/// i żadne z podanych miast nie należy do `player`. Web domyślnie `playerOwnerId = 0`
/// (`HUMAN_OWNER_PRIMARY`); tu właściciel jest jawny.
pub fn is_awaiting_first_player_city(
    player_ever_owned_city: bool,
    city_owners: impl IntoIterator<Item = OwnerRef>,
    player: PlayerId,
) -> bool {
    let owner = OwnerRef::Player(player);
    !player_ever_owned_city
        && !city_owners
            .into_iter()
            .any(|city_owner| city_owner == owner)
}

/// Web `isHexInStartReveal` (first-player-city.ts:24). Bez oczekiwania na pierwsze miasto
/// albo bez heksu startu każdy heks jest widoczny. `hex.distance` odpowiada webowemu
/// `hexDistance` (units/setup.ts:354), czyli max(|dq|, |dr|, |ds|).
pub fn is_hex_in_start_reveal(
    hex: HexCoord,
    awaiting_first_city: bool,
    player_start_hex: Option<HexCoord>,
    start_reveal_radius: u32,
) -> bool {
    match player_start_hex {
        Some(start) if awaiting_first_city => hex.distance(start) <= start_reveal_radius,
        _ => true,
    }
}

/// Web `validateFirstPlayerCityPlacement` (first-player-city.ts:37). Zwraca `Ok(())` dla
/// `ok: true` (web: `reason: ''`), w pozostałych przypadkach `Err` z powodem.
pub fn validate_first_player_city_placement(
    awaiting_first_city: bool,
    in_start_reveal: bool,
    base_ok: bool,
    base_reason: &str,
) -> Result<(), String> {
    if !base_ok {
        return Err(base_reason.to_owned());
    }
    if awaiting_first_city && !in_start_reveal {
        return Err(FIRST_CITY_START_REVEAL_DENIED.to_owned());
    }
    Ok(())
}

// ---------------------------------------------------------------------------
// P6.1B: stan gracza i badania (web `playerState.ts`, pin edb8fb56)
// ---------------------------------------------------------------------------

/// Blad domeny stanu gracza (web nie ma sciezek bledu; tu tylko brak danych tabeli).
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum PlayerStateError {
    /// Brak kosztu badania w `research-costs.json` dla (technologia, tempo, tryb).
    MissingResearchCost {
        technologia: String,
        tempo: String,
        tryb: String,
    },
    /// Trudnosc bez wpisu w `player-state-params.json` -> `tryb_badan_gracza`.
    MissingResearchMode { difficulty: String },
}

impl fmt::Display for PlayerStateError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::MissingResearchCost {
                technologia,
                tempo,
                tryb,
            } => write!(
                f,
                "research-costs.json: brak kosztu dla {technologia} / {tempo} / {tryb}"
            ),
            Self::MissingResearchMode { difficulty } => write!(
                f,
                "player-state-params.json: brak tryb_badan_gracza dla {difficulty}"
            ),
        }
    }
}

impl std::error::Error for PlayerStateError {}

/// Bramka budynku/ulepszenia badania (web `EmpireResearchGate` + `researchGatesMet`, research.ts:234).
/// Sama bramka (`research.ts`, P6.17) NIE jest portowana w P6.1B: silnik dostaje predykat.
pub trait ResearchGate {
    /// Web `researchGatesMet(tech, gate)`: czy tech przechodzi bramke imperium.
    fn gates_met(&self, tech: &Technologia) -> bool;
}

/// Web `techId` (playerState.ts:176): nazwa techu przycieta jak JS `String.prototype.trim`.
fn tech_id(t: &Technologia) -> &str {
    js_trim(&t.technologia)
}

/// Znaki, ktore JS `trim()` uznaje za biale (WhiteSpace + LineTerminator, ECMA-262).
fn is_js_whitespace(c: char) -> bool {
    matches!(
        c,
        '\u{9}'..='\u{D}'
            | '\u{20}'
            | '\u{A0}'
            | '\u{1680}'
            | '\u{2000}'..='\u{200A}'
            | '\u{2028}'
            | '\u{2029}'
            | '\u{202F}'
            | '\u{205F}'
            | '\u{3000}'
            | '\u{FEFF}'
    )
}

fn js_trim(s: &str) -> &str {
    s.trim_matches(is_js_whitespace)
}

/// Porownanie napisow jak operator `<` w JS (kolejnosc jednostek UTF-16, nie bajtow UTF-8).
fn cmp_utf16(a: &str, b: &str) -> Ordering {
    a.encode_utf16().cmp(b.encode_utf16())
}

/// Web `techCost` (playerState.ts:181): koszt bazowy techu (`Koszt nauki`).
/// Gałąź `null`/`NaN` -> 0 jest NIE-DOTYCZY: `Technologia.koszt_nauki` jest typem calkowitym.
pub fn tech_cost(t: &Technologia) -> i64 {
    t.koszt_nauki
}

/// Web `eraAdvanceTarget` (playerState.ts:299): docelowy numer epoki po ukonczeniu techu.
pub fn era_advance_target(t: &Technologia) -> Option<i64> {
    t.awans_do_epoki
}

/// Web `isEraAdvanceTech` (playerState.ts:304).
pub fn is_era_advance_tech(t: &Technologia) -> bool {
    era_advance_target(t).is_some()
}

/// Web `researchPlanLength` (playerState.ts:538): aktywny cel + kolejka.
pub fn research_plan_length(state: &PlayerState) -> usize {
    usize::from(state.player_research_target_id.is_some()) + state.research_queue.len()
}

/// Web `dequeueResearchTarget` (playerState.ts:588).
pub fn dequeue_research_target(state: &mut PlayerState, tech_id: &str) -> bool {
    if let Some(index) = state.research_queue.iter().position(|id| id == tech_id) {
        state.research_queue.remove(index);
        return true;
    }
    if state.player_research_target_id.as_deref() == Some(tech_id) {
        state.player_research_target_id = if state.research_queue.is_empty() {
            None
        } else {
            Some(state.research_queue.remove(0))
        };
        return true;
    }
    false
}

/// Web `clearResearchQueue` (playerState.ts:604): czysci kolejke, nie rusza aktywnego celu.
pub fn clear_research_queue(state: &mut PlayerState) {
    state.research_queue.clear();
}

/// Web `getResearchPlanSnapshot` (playerState.ts:612): aktywny cel, potem kolejka FIFO.
pub fn get_research_plan_snapshot(state: &PlayerState) -> Vec<String> {
    let mut plan = Vec::new();
    if let Some(target) = &state.player_research_target_id {
        plan.push(target.clone());
    }
    plan.extend(state.research_queue.iter().cloned());
    plan
}

/// Web `PlayerState` (playerState.ts:90). `nauka`/`skarbiec` to liczby JS (f64), `zbadane` to
/// zbior (uporzadkowany, bo kolejnosc iteracji nie wchodzi do logiki).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PlayerState {
    pub skarbiec: f64,
    pub nauka: f64,
    pub zbadane: BTreeSet<String>,
    pub badana: Option<String>,
    #[serde(rename = "playerResearchTargetId")]
    pub player_research_target_id: Option<String>,
    #[serde(rename = "researchQueue")]
    pub research_queue: Vec<String>,
    pub era: i64,
    #[serde(rename = "pieniadzMnoznik")]
    pub pieniadz_mnoznik: i64,
    #[serde(rename = "tempoGry")]
    pub tempo_gry: String,
    #[serde(rename = "buildingCostPace")]
    pub building_cost_pace: String,
    #[serde(rename = "kosztJednostekPace")]
    pub koszt_jednostek_pace: String,
    #[serde(rename = "wzrostLudnosciPace")]
    pub wzrost_ludnosci_pace: String,
    #[serde(rename = "ruchSwiataPace")]
    pub ruch_swiata_pace: String,
    #[serde(rename = "civType")]
    pub civ_type: String,
    #[serde(rename = "civBonusy")]
    pub civ_bonusy: Vec<BonusyItem>,
    #[serde(rename = "rakietaWystrzelona")]
    pub rakieta_wystrzelona: bool,
}

/// Web `ResearchCompletion` (playerState.ts:331).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResearchCompletion {
    pub id: String,
    pub koszt: u32,
    pub awans_epoki: bool,
    pub pieniadz: bool,
    pub era: i64,
}

/// Web `ResearchStepResult` (playerState.ts:345).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ResearchStepResult {
    pub completed: Vec<ResearchCompletion>,
    pub badana: Option<String>,
}

/// Web `ResearchStateInfo` (playerState.ts:449).
#[derive(Debug, Clone, PartialEq)]
pub struct ResearchStateInfo {
    pub pula: f64,
    pub target_id: Option<String>,
    pub koszt_celu: u32,
    pub postep_fraction: f64,
    pub turns_left: Option<f64>,
}

/// Reguly stanu gracza i badan: stale z `player-state-params.json` i koszty z `research-costs.json`.
/// Wszystkie funkcje web `playerState.ts`, ktore potrzebuja tych danych, sa metodami.
#[derive(Debug, Clone)]
pub struct PlayerRules {
    params: PlayerStateParamsFile,
    costs: ResearchCostsFile,
}

impl PlayerRules {
    pub fn new(params: PlayerStateParamsFile, costs: ResearchCostsFile) -> Self {
        Self { params, costs }
    }

    /// Wczytuje wbudowane tabele (`player-state-params.json`, `research-costs.json`).
    pub fn load() -> Result<Self, serde_json::Error> {
        Ok(Self::new(
            parse_player_state_params()?,
            parse_research_costs()?,
        ))
    }

    /// Web `PIENIADZ_MNOZNIK` (playerState.ts:75), z tabeli.
    pub fn pieniadz_mnoznik(&self) -> i64 {
        self.params.pieniadz_mnoznik
    }

    /// Web `RESEARCH_QUEUE_MAX` (playerState.ts:82), z tabeli.
    pub fn research_queue_max(&self) -> usize {
        self.params.research_queue_max
    }

    /// Web `createPlayerState` (playerState.ts:144), wartosci poczatkowe z tabeli.
    pub fn create_player_state(&self) -> PlayerState {
        let init = &self.params.stan_poczatkowy;
        PlayerState {
            skarbiec: init.skarbiec,
            nauka: init.nauka,
            zbadane: BTreeSet::new(),
            badana: None,
            player_research_target_id: None,
            research_queue: Vec::new(),
            era: init.era,
            pieniadz_mnoznik: init.pieniadz_mnoznik,
            tempo_gry: init.tempo_gry.clone(),
            building_cost_pace: init.building_cost_pace.clone(),
            koszt_jednostek_pace: init.koszt_jednostek_pace.clone(),
            wzrost_ludnosci_pace: init.wzrost_ludnosci_pace.clone(),
            ruch_swiata_pace: init.ruch_swiata_pace.clone(),
            civ_type: init.civ_type.clone(),
            civ_bonusy: Vec::new(),
            rakieta_wystrzelona: init.rakieta_wystrzelona,
        }
    }

    fn is_no_prereq(&self, lowered: &str) -> bool {
        self.params.brak_prereq.iter().any(|b| b == lowered)
    }

    /// Web `parsePrereqs` (playerState.ts:187).
    pub fn parse_prereqs(&self, t: &Technologia) -> Vec<String> {
        let raw = js_trim(&t.wymaga_prereq);
        if raw.is_empty() || self.is_no_prereq(&raw.to_lowercase()) {
            return Vec::new();
        }
        raw.split('+')
            .map(js_trim)
            .filter(|s| !s.is_empty() && !self.is_no_prereq(&s.to_lowercase()))
            .map(str::to_owned)
            .collect()
    }

    /// Web `prereqsMet` (playerState.ts:198).
    pub fn prereqs_met(&self, t: &Technologia, researched: &BTreeSet<String>) -> bool {
        self.parse_prereqs(t).iter().all(|p| researched.contains(p))
    }

    /// Web `epochNumber` (playerState.ts:119). Etykieta epoki: trim, male litery, bez diakrytykow PL.
    pub fn epoch_number(&self, t: &Technologia) -> Option<i64> {
        let norm: String = js_trim(&t.epoka)
            .to_lowercase()
            .chars()
            .map(|c| self.params.diakrytyki_epoki.get(&c).copied().unwrap_or(c))
            .collect();
        self.params.numer_epoki.get(&norm).copied()
    }

    /// Web `epochGateMet` (playerState.ts:136): zasada 1, cala epoka N przed N+1.
    pub fn epoch_gate_met(
        &self,
        t: &Technologia,
        techs: &[Technologia],
        done: &BTreeSet<String>,
    ) -> bool {
        let Some(e) = self.epoch_number(t) else {
            return true;
        };
        for other in techs {
            let Some(oe) = self.epoch_number(other) else {
                continue;
            };
            if oe < e && !done.contains(tech_id(other)) {
                return false;
            }
        }
        true
    }

    /// Web `epochTierGateMet` (playerState.ts:158): zasada 2, tiery wewnatrz epoki.
    /// Gałąź "Poziom nie jest skonczona liczba" jest NIE-DOTYCZY: `Technologia.poziom` to `i64`.
    pub fn epoch_tier_gate_met(
        &self,
        t: &Technologia,
        techs: &[Technologia],
        done: &BTreeSet<String>,
    ) -> bool {
        let Some(e) = self.epoch_number(t) else {
            return true;
        };
        let p = t.poziom;
        for other in techs {
            if self.epoch_number(other) != Some(e) {
                continue;
            }
            if other.poziom < p && !done.contains(tech_id(other)) {
                return false;
            }
        }
        true
    }

    /// Wspolny warunek "tech moze byc rozpoczety" (poza pustym id i `researched`).
    fn start_allowed(
        &self,
        t: &Technologia,
        techs: &[Technologia],
        researched: &BTreeSet<String>,
        gate: Option<&dyn ResearchGate>,
    ) -> bool {
        self.prereqs_met(t, researched)
            && self.epoch_gate_met(t, techs, researched)
            && self.epoch_tier_gate_met(t, techs, researched)
            && gate.is_none_or(|g| g.gates_met(t))
    }

    /// Web `availableTechs` (playerState.ts:178). Kolejnosc jak w danych.
    pub fn available_techs<'a>(
        &self,
        techs: &'a [Technologia],
        researched: &BTreeSet<String>,
        gate: Option<&dyn ResearchGate>,
    ) -> Vec<&'a Technologia> {
        techs
            .iter()
            .filter(|t| {
                let id = tech_id(t);
                if id.is_empty() || researched.contains(id) {
                    return false;
                }
                self.start_allowed(t, techs, researched, gate)
            })
            .collect()
    }

    /// Web `cheapestAvailable` (playerState.ts:198). Remis: nazwa wg porzadku UTF-16 jak JS `<`.
    pub fn cheapest_available(
        &self,
        techs: &[Technologia],
        researched: &BTreeSet<String>,
        gate: Option<&dyn ResearchGate>,
    ) -> Option<String> {
        let mut best: Option<&Technologia> = None;
        for t in self.available_techs(techs, researched, gate) {
            best = match best {
                None => Some(t),
                Some(b) => {
                    let by_cost = tech_cost(t).cmp(&tech_cost(b));
                    if by_cost == Ordering::Less
                        || (by_cost == Ordering::Equal
                            && cmp_utf16(tech_id(t), tech_id(b)) == Ordering::Less)
                    {
                        Some(t)
                    } else {
                        Some(b)
                    }
                }
            };
        }
        best.map(|b| tech_id(b).to_owned())
    }

    /// Web `isMoneyTech` (playerState.ts:309): Waluta albo wzmianka o pieniadzu w uwagach/budynku.
    pub fn is_money_tech(&self, t: &Technologia) -> bool {
        if tech_id(t).to_lowercase() == self.params.technologia_pieniadza {
            return true;
        }
        let notes = format!(
            "{} {}",
            t.uwagi.as_deref().unwrap_or(""),
            t.odblokowuje_budynek.as_deref().unwrap_or("")
        );
        notes
            .to_lowercase()
            .contains(self.params.uwagi_pieniadza_igla.as_str())
    }

    /// Koszt badania gracza (web `scaledResearchCost(techCost, tempo, 0, difficulty, Epoka)`),
    /// odczytany z `research-costs.json` (DANE-JUZ-W-RUST, dowod: wektor `costs`).
    pub fn scaled_research_cost(
        &self,
        t: &Technologia,
        tempo: &str,
        difficulty: Difficulty,
    ) -> Result<u32, PlayerStateError> {
        let tryb = self
            .params
            .tryb_badan_gracza
            .get(difficulty.key())
            .ok_or_else(|| PlayerStateError::MissingResearchMode {
                difficulty: difficulty.key().to_owned(),
            })?;
        self.costs.lookup(tech_id(t), tempo, tryb).ok_or_else(|| {
            PlayerStateError::MissingResearchCost {
                technologia: tech_id(t).to_owned(),
                tempo: tempo.to_owned(),
                tryb: tryb.clone(),
            }
        })
    }

    /// Wewnetrzne `targetAllowed` z `researchStep` (playerState.ts:373).
    fn target_allowed(
        &self,
        id: &str,
        by_id: &HashMap<&str, &Technologia>,
        techs: &[Technologia],
        done: &BTreeSet<String>,
        gate: Option<&dyn ResearchGate>,
    ) -> bool {
        let Some(def) = by_id.get(id) else {
            return false;
        };
        if done.contains(id) {
            return false;
        }
        self.start_allowed(def, techs, done, gate)
    }

    /// Web `researchStep` (playerState.ts:362): jeden przebieg badan konca tury. Mutuje `state`.
    pub fn research_step(
        &self,
        state: &mut PlayerState,
        techs: &[Technologia],
        gate: Option<&dyn ResearchGate>,
        difficulty: Difficulty,
    ) -> Result<ResearchStepResult, PlayerStateError> {
        let mut completed = Vec::new();
        // Web: `Map` z nadpisywaniem duplikatow (ostatni wiersz wygrywa).
        let mut by_id: HashMap<&str, &Technologia> = HashMap::new();
        for t in techs {
            let id = tech_id(t);
            if !id.is_empty() {
                by_id.insert(id, t);
            }
        }

        let explicit_ok = match &state.player_research_target_id {
            Some(id) => self.target_allowed(id, &by_id, techs, &state.zbadane, gate),
            None => false,
        };
        if explicit_ok {
            state.badana = state.player_research_target_id.clone();
        } else {
            let current_ok = match &state.badana {
                Some(id) => {
                    by_id.contains_key(id.as_str())
                        && self.target_allowed(id, &by_id, techs, &state.zbadane, gate)
                }
                None => false,
            };
            if !current_ok {
                state.badana = self
                    .available_techs(techs, &state.zbadane, gate)
                    .first()
                    .map(|t| tech_id(t).to_owned());
            }
        }

        let max_iters = techs.len() + 1;
        let mut iters = 0;
        while let Some(current) = state.badana.clone() {
            if iters >= max_iters {
                break;
            }
            iters += 1;
            let Some(def) = by_id.get(current.as_str()).copied() else {
                state.badana = self.cheapest_available(techs, &state.zbadane, gate);
                continue;
            };

            let cost = self.scaled_research_cost(def, &state.tempo_gry, difficulty)?;
            if state.nauka < f64::from(cost) {
                break;
            }
            if let Some(g) = gate {
                if !g.gates_met(def) {
                    break;
                }
            }

            state.nauka -= f64::from(cost);
            state.zbadane.insert(current.clone());

            let awans_target = era_advance_target(def);
            let money = self.is_money_tech(def);
            if let Some(target) = awans_target {
                state.era = state.era.max(target);
            }
            if money {
                state.pieniadz_mnoznik = self.params.pieniadz_mnoznik;
            }
            completed.push(ResearchCompletion {
                id: current,
                koszt: cost,
                awans_epoki: awans_target.is_some(),
                pieniadz: money,
                era: state.era,
            });

            state.player_research_target_id = None;
            while !state.research_queue.is_empty() {
                let queued = state.research_queue.remove(0);
                if state.zbadane.contains(&queued) {
                    continue;
                }
                if !self.target_allowed(&queued, &by_id, techs, &state.zbadane, gate) {
                    continue;
                }
                state.player_research_target_id = Some(queued);
                break;
            }

            if state.player_research_target_id.is_some() {
                state.badana = state.player_research_target_id.clone();
            } else {
                state.badana = self
                    .available_techs(techs, &state.zbadane, gate)
                    .first()
                    .map(|t| tech_id(t).to_owned());
            }
        }

        Ok(ResearchStepResult {
            completed,
            badana: state.badana.clone(),
        })
    }

    /// Web `setPlayerResearchTarget` (playerState.ts:471).
    pub fn set_player_research_target(
        &self,
        state: &mut PlayerState,
        tech_id: &str,
        techs: &[Technologia],
        gate: Option<&dyn ResearchGate>,
    ) -> bool {
        let Some(def) = techs.iter().find(|t| js_trim(&t.technologia) == tech_id) else {
            return false;
        };
        if state.zbadane.contains(tech_id) {
            return false;
        }
        if !self.start_allowed(def, techs, &state.zbadane, gate) {
            return false;
        }
        state.player_research_target_id = Some(tech_id.to_owned());
        true
    }

    /// Web `getResearchState` (playerState.ts:497).
    pub fn get_research_state(
        &self,
        state: &PlayerState,
        techs: &[Technologia],
        nauka_per_turn: f64,
        difficulty: Difficulty,
    ) -> Result<ResearchStateInfo, PlayerStateError> {
        let target_id = state
            .player_research_target_id
            .clone()
            .or_else(|| state.badana.clone());
        // Web: `targetId ? find : undefined` - pusty napis jest falsy.
        let def = target_id
            .as_deref()
            .filter(|id| !id.is_empty())
            .and_then(|id| techs.iter().find(|t| js_trim(&t.technologia) == id));
        let koszt_celu = match def {
            Some(d) => self.scaled_research_cost(d, &state.tempo_gry, difficulty)?,
            None => 0,
        };
        let pula = state.nauka;
        let mut postep_fraction = 0.0;
        if koszt_celu > 0 {
            let ratio = pula / f64::from(koszt_celu);
            postep_fraction = if ratio.is_nan() {
                ratio
            } else {
                ratio.min(1.0)
            };
        }
        let mut turns_left = None;
        if def.is_some() && nauka_per_turn > 0.0 {
            let remaining = f64::from(koszt_celu) - pula;
            turns_left = Some(if remaining <= 0.0 {
                0.0
            } else {
                (remaining / nauka_per_turn).ceil()
            });
        }
        Ok(ResearchStateInfo {
            pula,
            target_id,
            koszt_celu,
            postep_fraction,
            turns_left,
        })
    }

    /// Web `enqueueResearchTarget` (playerState.ts:558): luzna walidacja przy dodawaniu.
    pub fn enqueue_research_target(
        &self,
        state: &mut PlayerState,
        tech_id: &str,
        techs: &[Technologia],
    ) -> bool {
        if !techs.iter().any(|t| js_trim(&t.technologia) == tech_id) {
            return false;
        }
        if state.zbadane.contains(tech_id) {
            return false;
        }
        if state.player_research_target_id.as_deref() == Some(tech_id) {
            return false;
        }
        if state.research_queue.iter().any(|id| id == tech_id) {
            return false;
        }
        if research_plan_length(state) >= self.params.research_queue_max {
            return false;
        }
        if state.player_research_target_id.is_none() {
            state.player_research_target_id = Some(tech_id.to_owned());
        } else {
            state.research_queue.push(tech_id.to_owned());
        }
        true
    }
}

/// Stany graczy ludzkich w hot-seat (web `playerStateByHuman`, main.ts:9040, 11321): kazdy fotel
/// ma NIEZALEZNY `PlayerState`, tworzony przy pierwszym uzyciu.
#[derive(Debug, Clone, Default, PartialEq)]
pub struct PlayerStateByHuman {
    states: BTreeMap<PlayerId, PlayerState>,
}

impl PlayerStateByHuman {
    pub fn new() -> Self {
        Self::default()
    }

    /// Web: `if (!playerStateByHuman.has(id)) playerStateByHuman.set(id, createPlayerState())`.
    pub fn ensure(&mut self, owner: PlayerId, rules: &PlayerRules) -> &mut PlayerState {
        self.states
            .entry(owner)
            .or_insert_with(|| rules.create_player_state())
    }

    pub fn get(&self, owner: PlayerId) -> Option<&PlayerState> {
        self.states.get(&owner)
    }

    pub fn get_mut(&mut self, owner: PlayerId) -> Option<&mut PlayerState> {
        self.states.get_mut(&owner)
    }

    pub fn len(&self) -> usize {
        self.states.len()
    }

    pub fn is_empty(&self) -> bool {
        self.states.is_empty()
    }
}

/// A player identity kept independent from future map and economy systems.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Player {
    id: PlayerId,
    name: String,
}

impl Player {
    pub fn new(id: PlayerId, name: impl Into<String>) -> Result<Self, EngineError> {
        let name = name.into();
        if name.trim().is_empty() {
            return Err(EngineError::EmptyPlayerName);
        }

        Ok(Self { id, name })
    }

    pub const fn id(&self) -> PlayerId {
        self.id
    }

    pub fn name(&self) -> &str {
        &self.name
    }
}
