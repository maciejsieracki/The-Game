//! R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369, część B): bitwa oblężnicza gracza w grze — wejście sesji ze stanu,
//! sterowanie sesją między komendami mostu i zastosowanie wyniku do [`PlayableState`].
//!
//! Pin `07d2fbd72` (`gra/src/main.ts`): `launchSiegeStormFromMap` (`:36799-37024`) → `onBattlefield` → `new BattleScene` →
//! `bs.play(res => { consumeReadyMachines(city); finishSiegeStormBattle(...) })` (`:37019-37024`);
//! `finishSiegeStormBattle` (`:36596-36690`) → `applyMapBattleOutcome` (`:34431-34730`) → `applyPostBattleMap`
//! (`game/post-battle-map.ts:431-467`) → `afterSiegeUi` (`:36628-36672`).
//!
//! Decyzje techniczne (wpis do `REJESTR-RUST.md` przez orkiestratora, raport `01-operator-r1.md`):
//! * **D-WIRB-1 (sesja między komendami = zapis sterowania + powtórka).** [`SiegeBattleSession`] nie jest `Send`
//!   (`Box<dyn MoveTerrain>`, `Box<dyn BlowComposer>`, `FireObserver` w `siege_tactics_loop.rs`), a `PlayableGame` jest
//!   stanem zarządzanym przez Tauri (`State<Mutex<EngineBridge<CivEngineAdapter>>>` wymaga `Send`). Dlatego gra trzyma
//!   [`ActiveSiegeBattle`]: migawkę stanu z chwili startu, wejście sesji i listę wykonanych operacji sterownika
//!   (`step(ms)` / `skip()`). Każda komenda odtwarza sesję tymi samymi wywołaniami (te same operacje zmiennoprzecinkowe,
//!   ten sam strumień RNG D-WIR-5), więc stan jest identyczny z sesją trzymaną w pamięci; dowodzi tego test
//!   niezależności od podziału kroków i test ścieżki odtworzenia (każda komenda bez pamięci podręcznej = ten sam
//!   wynik). Żywa sesja jest trzymana w pamięci podręcznej wątku (`LIVE_SESSION`) jako optymalizacja: komenda z tego
//!   samego wątku kontynuuje sesję bez powtórki; chybienie (inny wątek Tauri, klon gry, błąd poprzedniej komendy)
//!   odtwarza sesję z zapisu (koszt O(długość bitwy), NIE_ZMIERZONO w release).
//! * **D-WIRB-2 (stan gry w trakcie bitwy).** Pin w trakcie sceny nie zmienia mapy (machiny zużywa dopiero wynik
//!   sceny, `:37021-37023`; UI mapy zasłonięte). Port: `AdvanceTurn`, `MoveUnit`, `CancelPlannedMarch` i drugi
//!   `StartSiegeStorm` zwracają jawny błąd „bitwa w toku”; zapis bitwy w toku poza zakresem (gra trzyma ją poza DTO).
//! * **D-WIRB-3 (gałąź zdobycia = hak T8).** Wygrana atakującego z wyłomem: część B stosuje wspólne skutki
//!   `applyPostBattleMap` (HP/straty z `manualSurvivors`, weterani, punkt ruchu), a ruch na heks miasta
//!   (`wipeDefenderOnCityCenter`, `retreatDefendersAfterAtkWin`, `moveAtkRosterOntoBattleHex`) i `applyCityCaptureToMap`
//!   zwraca jako [`CityCaptureRequested`] dla #354 (T8) — bez `apply_transfer_with_effects` tutaj.
//! * **D-ADP-11 (sojusz = umowa).** Pin `hasAllianceDealBetween` (`main.ts:22648-22655`): aktywna umowa
//!   `sojusz_pelny` / `sojusz_defensywny` / `SojuszWojskowy` (alias `sojusz_pelny` w [`crate::domain::diplomacy::TreatyKind`]).
//!   Port czyta umowy wprost ([`alliance_pairs_from_deals`]) zamiast statusu relacji (synchronizowanego z umów dopiero
//!   w kroku tury), więc umowa zawarta w tej samej turze działa przed szturmem.
//! * **D-ADP-L-BARB (barbarzyńcy).** Pin `areEnemyOwners` (`main.ts:13129-13133`): barbarzyńca (`-1`) wrogiem każdego.
//!   `PlayableState` nie ma właścicieli ujemnych (`PlayerId` u64, brak magazynu barbarzyńców), więc reguła nie ma
//!   wejścia: [`siege_inputs_with_deals`] mapuje wyłącznie graczy stanu. Gdy barbarzyńcy wejdą do stanu, mapowanie
//!   musi dodać ich jednostki i wojnę z każdym (temat stanu barbarzyńców), bez zmian w tej części.

use std::collections::{BTreeMap, BTreeSet};
use std::sync::OnceLock;

use civ_view_model::battle::{BattleActionDto, BattleFrameDto, BattleWinner};
use serde::{Deserialize, Serialize};

use crate::data::civilizations::parse_civ_matrix;
use crate::data::economy_society_part2::parse_ai_params;
use crate::domain::battle_setup_terrain::WorldTerrainInput;
use crate::domain::city_view::ikona_id_to_bronze_civ;
use crate::domain::civ_bonuses::civ_matrix_bonusy_for_civ_key;
use crate::domain::diplomacy::RelationStatus;
use crate::domain::playable::{
    MovementPoints, PlayableReplaceUnit, PlayableSiegeMachineKind, PlayableState, PlayableTerrain,
};
use crate::domain::siege_battle_adapter::{
    collect_siege_rosters, is_civilian_unit, AdapterError, RosterUnit, SiegeRosterInput,
};
use crate::domain::siege_battle_adapter_playable::{
    siege_inputs_from_playable, PlayableSiegeInputs,
};
use crate::domain::siege_battle_adapter_unit::OwnerContext;
use crate::domain::siege_battle_session::{
    SessionData, SessionError, SessionOutcome, SessionPhase, SiegeBattleSession, SiegeSessionInput,
};
use crate::domain::siege_tactics_actions::{actions_to_dto, TimedAction};
use crate::domain::siege_tactics_breach::WallState;
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_frame::{battle_frame, FrameInput, FrameUnitPose};
use crate::domain::siege_tactics_loop::LoopWinner;
use crate::domain::siege_tactics_turnseq::UnitRef;
use crate::domain::turn_war_epoch::{empire_epoch_for_owner, game_start_era, owner_era_facts};
use crate::domain::turn_war_inputs::HUMAN_OWNER_ID;
use crate::domain::{CityId, PlayerId, PositionDto, UnitId};

/// `VETERAN_MAX_BATTLES_TRACKED` (`game/veteran.ts:65`).
pub const VETERAN_MAX_BATTLES_TRACKED: f64 = 3.0;

/// `HEX_NEIGHBORS` (`units/setup.ts:595-602`), kolejność pinu.
const HEX_NEIGHBORS: [(i32, i32); 6] = [(1, 0), (-1, 0), (0, 1), (0, -1), (1, -1), (-1, 1)];

/// Błędy komend bitwy oblężniczej (jawne; stan gry bez zmian przy błędzie).
#[derive(Debug, Clone, PartialEq)]
pub enum SiegeBattleError {
    /// Komenda bitwy bez trwającej bitwy (`Step` / `Skip` / `Finish`).
    NoActiveBattle,
    /// D-WIRB-2: komenda mapy albo drugi szturm w trakcie bitwy (`city_id` trwającej bitwy).
    BattleInProgress { city_id: u64 },
    /// Pin `ctx.oblegajacyOwnerId !== 0` (`main.ts:36800-36806`): szturm wydaje tylko gracz (fotel główny).
    NotHumanBesieger { unit_id: u64 },
    /// Miasto o tym id nie istnieje.
    CityNotFound(u64),
    /// Jednostka-kotwica nie istnieje.
    UnitNotFound(u64),
    /// Heks miasta poza mapą stanu (teren `dTeren`).
    CityTileMissing(u64),
    /// Pin `:36826-36829`: brak obrońców, mur/palisada nienaruszone i brak machin — bez zmian stanu.
    NoDefendersWallIntact { city_id: u64 },
    /// Pin `:36830-36834`: brak obrońców przy gotowych machinach = `consumeReadyMachines` + `captureCityWithoutBattle`
    /// (zdobycie bez bitwy) — hak T8 (#354), bez zmian stanu tutaj.
    NoDefendersCaptureRequested { city_id: u64 },
    /// Błąd sesji (tryb ręczny, faza, dane, pętla poza zakresem).
    Session(SessionError),
    /// Błąd adaptera rosterów (dane jednostek, NaN/Inf...).
    Adapter(AdapterError),
    /// Producent wejść (dane trudności, cywilizacji, epoki) albo DTO (ramka, akcje) zwrócił błąd.
    Producer(String),
}

impl std::fmt::Display for SiegeBattleError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NoActiveBattle => f.write_str("siege battle: no battle in progress"),
            Self::BattleInProgress { city_id } => {
                write!(f, "siege battle in progress (city {city_id})")
            }
            Self::NotHumanBesieger { unit_id } => {
                write!(f, "siege storm: unit {unit_id} is not the human besieger")
            }
            Self::CityNotFound(id) => write!(f, "siege storm: city {id} does not exist"),
            Self::UnitNotFound(id) => write!(f, "siege storm: unit {id} does not exist"),
            Self::CityTileMissing(id) => write!(f, "siege storm: city {id} is outside the map"),
            Self::NoDefendersWallIntact { city_id } => write!(
                f,
                "siege storm: city {city_id} has no defenders, wall intact and no siege machines"
            ),
            Self::NoDefendersCaptureRequested { city_id } => write!(
                f,
                "siege storm: city {city_id} has no defenders (capture without battle = T8 #354)"
            ),
            Self::Session(e) => write!(f, "siege battle: {e}"),
            Self::Adapter(e) => write!(f, "siege battle roster: {e}"),
            Self::Producer(e) => write!(f, "siege battle: {e}"),
        }
    }
}

impl std::error::Error for SiegeBattleError {}

impl From<SessionError> for SiegeBattleError {
    fn from(e: SessionError) -> Self {
        Self::Session(e)
    }
}

impl From<AdapterError> for SiegeBattleError {
    fn from(e: AdapterError) -> Self {
        match e {
            AdapterError::AttackerHasGeneral(_) => Self::Session(SessionError::from(e)),
            other => Self::Adapter(other),
        }
    }
}

/// Czas ścienny kroku czasu rzeczywistego (ms). `Eq` ręczne (jak `MovementPoints`): JSON nie niesie `NaN`/`Infinity`,
/// a wartości ujemne i nieskończone odrzuca [`SiegeBattleSession::step`] (`InvalidData`) przed zmianą stanu.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(transparent)]
pub struct WallMs(pub f64);

impl Eq for WallMs {}

/// Faza bitwy w odpowiedzi mostu.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SiegeBattlePhaseDto {
    /// Czas rzeczywisty (`started`, `!_ffActive`).
    Running,
    /// `finished`: wynik gotowy do `FinishSiegeBattle`.
    Finished,
    /// Wynik zastosowany do stanu gry (`FinishSiegeBattle`), bitwa zamknięta.
    Applied,
}

/// Jednostka sceny: identyfikator bitwy (`UnitId` w akcjach i ramce) → jednostka mapy (`RuntimeUnit.id`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiegeBattleUnitRefDto {
    /// Identyfikator jednostki w akcjach i ramce (`SeqUnit::id`).
    pub battle_id: u64,
    /// Identyfikator rosteru (dziesiętne id jednostki stanu; milicja: id syntetyczne adaptera).
    pub unit_id: String,
    /// Strona: `atk` / `def`.
    pub side: String,
}

/// Jednostka, której HP ustawił wynik (`run.hp = hp`, `post-battle-map.ts:186`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiegeUnitHpDto {
    pub unit_id: u64,
    pub hp: f64,
}

/// D-WIRB-3: hak T8 (#354) — `applyCityCaptureToMap` i wejście na heks miasta po wygranej z wyłomem.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CityCaptureRequested {
    pub city_id: u64,
    /// `atkRoster[0].ownerId`.
    pub attacker_owner_id: u64,
    /// `atkRoster[0].id` (kotwica, `moveAtkRosterOntoBattleHex`).
    pub anchor_unit_id: u64,
}

/// Wynik zastosowany do stanu (`FinishSiegeBattle`).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiegeBattleResultDto {
    /// `res.winner`.
    pub winner: BattleWinner,
    /// `roundNo` końca bitwy.
    pub round_no: i64,
    /// `res.wallBreached` (`wallEverBreached`, `battleScene.ts:10728`).
    pub wall_breached: bool,
    /// `stormCaptureBlocked` (`main.ts:36622-36623`): wygrana atakującego bez wyłomu — mur stoi.
    pub capture_blocked: bool,
    /// Hak T8 (D-WIRB-3); `None` poza wygraną atakującego z wyłomem.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub capture_requested: Option<CityCaptureRequested>,
    /// Jednostki stanu usunięte (`removeUnitById`), kolejność rosteru (atakujący, potem obrońcy).
    pub removed_unit_ids: Vec<u64>,
    /// HP ustawione ocalałym, kolejność rosteru.
    pub hp: Vec<SiegeUnitHpDto>,
    /// `consumeReadyMachines(city)` (`main.ts:37023`).
    pub consumed_machines: Vec<PlayableSiegeMachineKind>,
    /// Oblężenie zakończone (`endMapSiege`: remis `:36660` albo `validateActiveSieges` `:34727`).
    pub siege_ended: bool,
}

/// Odpowiedź komend bitwy oblężniczej mostu (pole `siegeBattle` odpowiedzi).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiegeBattlePayload {
    pub city_id: u64,
    pub phase: SiegeBattlePhaseDto,
    /// Jednostki sceny (tylko w odpowiedzi `StartSiegeStorm`).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub units: Vec<SiegeBattleUnitRefDto>,
    /// Akcje sceny od poprzedniej odpowiedzi (konsument: `renderer/src/battle/playback.rs`).
    pub actions: Vec<BattleActionDto>,
    /// Ramka po komendzie (`None` po zastosowaniu wyniku).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub frame: Option<BattleFrameDto>,
    /// Wynik zastosowany do stanu (tylko `FinishSiegeBattle`).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub result: Option<SiegeBattleResultDto>,
}

/// `BridgeResponse`/`BridgeResult` derywują `Eq`; DTO z `f64` mają `PartialEq` (wzorzec `RenderFramePayload`). Ramka i akcje
/// przechodzą `validate` (wartości skończone), więc `==` jest zwrotne.
impl Eq for SiegeBattlePayload {}

/// Operacja sterownika sesji zapisana do powtórki (D-WIRB-1).
#[derive(Debug, Clone, Copy, PartialEq)]
enum DriverOp {
    Step(f64),
    Skip,
}

/// Trwająca bitwa oblężnicza gry (D-WIRB-1).
#[derive(Debug, Clone, PartialEq)]
pub struct ActiveSiegeBattle {
    pub city_id: u64,
    pub anchor_unit_id: u64,
    /// Stan z chwili `StartSiegeStorm` (wejście sceny i rosterów; D-WIRB-2: mapa w trakcie bitwy się nie zmienia).
    start_state: Box<PlayableState>,
    input: SiegeSessionInput,
    /// Pełne rostery (`atkRosterRef` / `defRosterRef`, przed limitem pola) z pozycjami startu (`atkStartSnap`).
    atk_roster: Vec<RosterUnit>,
    def_roster: Vec<RosterUnit>,
    ops: Vec<DriverOp>,
    /// Klucz sesji żywej w pamięci podręcznej wątku ([`LIVE_SESSION`]); unikalny w procesie.
    live_key: u64,
}

/// D-WIRB-1: pamięć podręczna sesji żywej (optymalizacja, nie źródło prawdy). Sesja nie jest `Send`, więc żyje w wątku,
/// który ją zbudował; trafienie wymaga tego samego klucza bitwy i tej samej liczby operacji sterownika. Chybienie
/// (inny wątek, klon gry, błąd poprzedniej komendy) = odtworzenie z zapisu [`ActiveSiegeBattle::rebuild`].
struct LiveSession {
    key: u64,
    ops: usize,
    session: SiegeBattleSession,
}

thread_local! {
    static LIVE_SESSION: std::cell::RefCell<Option<LiveSession>> = const { std::cell::RefCell::new(None) };
}

static NEXT_LIVE_KEY: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(1);

/// Czyści pamięć podręczną sesji wątku (testy: każda komenda idzie wtedy ścieżką odtworzenia).
pub fn clear_live_session_cache() {
    LIVE_SESSION.with(|c| c.borrow_mut().take());
}

/// Sesja dla komendy: z pamięci podręcznej wątku, gdy pasuje klucz i liczba operacji, inaczej odtworzona.
fn take_session(battle: &ActiveSiegeBattle) -> Result<SiegeBattleSession, SiegeBattleError> {
    let cached = LIVE_SESSION.with(|c| {
        let mut slot = c.borrow_mut();
        match slot.take() {
            Some(l) if l.key == battle.live_key && l.ops == battle.ops.len() => Some(l.session),
            other => {
                *slot = other;
                None
            }
        }
    });
    match cached {
        Some(s) => Ok(s),
        None => battle.rebuild(),
    }
}

fn keep_session(battle: &ActiveSiegeBattle, session: SiegeBattleSession) {
    LIVE_SESSION.with(|c| {
        *c.borrow_mut() = Some(LiveSession {
            key: battle.live_key,
            ops: battle.ops.len(),
            session,
        });
    });
}

impl ActiveSiegeBattle {
    /// Wejście sesji (testy i diagnostyka).
    #[must_use]
    pub fn input(&self) -> &SiegeSessionInput {
        &self.input
    }

    /// Odtworzenie sesji (D-WIRB-1): `start` + te same operacje sterownika; akcje już oddane klientowi są odrzucane.
    ///
    /// # Errors
    /// [`SiegeBattleError::Session`].
    pub fn rebuild(&self) -> Result<SiegeBattleSession, SiegeBattleError> {
        let data = session_data()?;
        let mut s = SiegeBattleSession::start(&self.start_state, &self.input, data)?;
        s.battle_loop_mut().take_actions();
        for op in &self.ops {
            match op {
                DriverOp::Step(ms) => {
                    s.step(*ms)?;
                }
                DriverOp::Skip => {
                    s.skip()?;
                }
            }
        }
        Ok(s)
    }
}

/// Dane sesji silnika (parsowane raz).
///
/// # Errors
/// [`SiegeBattleError::Session`] przy błędzie danych.
pub fn session_data() -> Result<&'static SessionData, SiegeBattleError> {
    static DATA: OnceLock<Result<SessionData, SessionError>> = OnceLock::new();
    DATA.get_or_init(SessionData::engine)
        .as_ref()
        .map_err(|e| SiegeBattleError::Session(e.clone()))
}

fn owner_i64(p: PlayerId) -> i64 {
    i64::try_from(p.get()).unwrap_or(i64::MAX)
}

fn ordered(a: i64, b: i64) -> (i64, i64) {
    if a <= b {
        (a, b)
    } else {
        (b, a)
    }
}

/// D-ADP-11: pary właścicieli z aktywną umową sojuszniczą (`hasAllianceDealBetween`, `main.ts:22648-22655`).
#[must_use]
pub fn alliance_pairs_from_deals(state: &PlayableState) -> BTreeSet<(i64, i64)> {
    state
        .war
        .diplomacy
        .deals
        .iter()
        .filter(|d| d.kind.is_alliance())
        .map(|d| ordered(owner_i64(d.parties.first), owner_i64(d.parties.second)))
        .collect()
}

/// Wejścia rosterów szturmu ze stanu z sojuszami z umów (D-ADP-11). Jedyny producent wejść rosterów sesji.
///
/// # Errors
/// [`AdapterError`] adaptera stanu.
pub fn siege_inputs_with_deals(
    state: &PlayableState,
    city_id: u64,
    owner_era: Option<f64>,
) -> Result<PlayableSiegeInputs, AdapterError> {
    let mut inp = siege_inputs_from_playable(state, city_id, owner_era)?;
    inp.relations.alliances = alliance_pairs_from_deals(state);
    Ok(inp)
}

/// Teren heksa jako `terenBazowy` + `worldTerrainFromHex` (`main.ts:1934-1943`); mapowanie terenu stanu jak
/// `render_frame::terrain_labels` (las = nakładka na równinie, brak rzek w stanie).
fn hex_terrain(t: PlayableTerrain) -> (&'static str, bool) {
    match t {
        PlayableTerrain::Plains => ("rownina", false),
        PlayableTerrain::Hills => ("wzgorza", false),
        PlayableTerrain::Forest => ("rownina", true),
        PlayableTerrain::Water => ("morze", false),
    }
}

/// Web `difficultyCombatMultForOwner(ownerId)` (`main.ts:9523-9527`) w modelu stanu jak `render_frame`
/// (`render_frame.rs:644-663`): fotel główny = 1, AI = `1 + bonusWalka` poziomu trudności gry.
fn difficulty_combat_mult(state: &PlayableState, owner: i64) -> Result<f64, SiegeBattleError> {
    if owner == HUMAN_OWNER_ID {
        return Ok(1.0);
    }
    let p = parse_ai_params().map_err(|e| SiegeBattleError::Producer(e.to_string()))?;
    let bonus = match state.params.difficulty.as_str() {
        "Łatwy" | "easy" => p.trudnosc_poziom1_bonus_walka.wartosc,
        // Typ `i64` w `ai-params.json` (wartosc calkowita 0); JS `number`.
        #[allow(clippy::cast_precision_loss)]
        "Normalny" | "normal" => p.trudnosc_poziom2_bonus_walka.wartosc as f64,
        "Trudny" | "hard" => p.trudnosc_poziom3_bonus_walka.wartosc,
        other => {
            return Err(SiegeBattleError::Producer(format!(
                "nieznana trudnosc {other}"
            )))
        }
    };
    Ok(1.0 + if bonus.is_finite() { bonus } else { 0.0 })
}

/// Kontekst właścicieli sceny (`rosterToBattleUnits` `main.ts:36887-36902`, `civBonusyForOwnerId` `:9842-9846`,
/// `empireBuiltIdsForOwner` `:3493-3504`, `difficultyCombatMultForOwner`). Głód armii i deficyt Złota: `PlayableState`
/// nie niesie stanu głodu ani deficytu (brak producenta) — `false` = brak kary (dług D-WIRB-4, jawny w raporcie).
/// Markery kosztu produkcji (`civProductionCostBonusyForCivKey`) nie wchodzą: nie są modyfikatorami walki.
fn owner_contexts(state: &PlayableState) -> Result<BTreeMap<i64, OwnerContext>, SiegeBattleError> {
    let matrix = parse_civ_matrix().map_err(|e| SiegeBattleError::Producer(e.to_string()))?;
    let mut out = BTreeMap::new();
    for p in &state.players {
        let mut built: Vec<String> = Vec::new();
        for c in state.cities.iter().filter(|c| c.owner_id == p.id) {
            for b in state
                .stores
                .buildings_by_city
                .get(&c.id.get())
                .map_or(&[][..], Vec::as_slice)
            {
                if !built.contains(b) {
                    built.push(b.clone());
                }
            }
        }
        let owner = owner_i64(p.id);
        let civ_bonusy = if p.civilization.is_empty() {
            Vec::new()
        } else {
            civ_matrix_bonusy_for_civ_key(&matrix, &p.civilization)
        };
        out.insert(
            owner,
            OwnerContext {
                built_ids: built,
                civ_bonusy,
                army_hungry: false,
                gold_deficit: false,
                difficulty_combat_mult: difficulty_combat_mult(state, owner)?,
            },
        );
    }
    Ok(out)
}

/// Producent wejścia sesji ze stanu (`launchSiegeStormFromMap` `:36799-36937` + opcje `new BattleScene`
/// `:36980-37018`) wraz z pełnymi rosterami (do zastosowania wyniku).
///
/// # Errors
/// [`SiegeBattleError`] (bramki pinu, adapter, dane).
pub fn prepare_storm(
    state: &PlayableState,
    city_id: u64,
    unit_id: u64,
    battle_index: u32,
) -> Result<ActiveSiegeBattle, SiegeBattleError> {
    let data = session_data()?;
    let city = state
        .cities
        .iter()
        .find(|c| c.id.get() == city_id)
        .ok_or(SiegeBattleError::CityNotFound(city_id))?;
    let anchor = state
        .units
        .iter()
        .find(|u| u.id.get() == unit_id)
        .ok_or(SiegeBattleError::UnitNotFound(unit_id))?;
    if owner_i64(anchor.owner_id) != HUMAN_OWNER_ID {
        return Err(SiegeBattleError::NotHumanBesieger { unit_id });
    }
    let tile = state
        .map
        .tile(city.position)
        .ok_or(SiegeBattleError::CityTileMissing(city_id))?;
    let (teren, las) = hex_terrain(tile.terrain);
    let facts = owner_era_facts(state);
    let start_era = game_start_era(&state.params.epoch_id);
    let era = |owner: i64| {
        empire_epoch_for_owner(owner, &facts, start_era)
            .map(|(e, _)| e)
            .map_err(|e| SiegeBattleError::Producer(e.to_string()))
    };
    let city_owner = owner_i64(city.owner_id);
    let owner_era = era(city_owner)?;
    let inp = siege_inputs_with_deals(state, city_id, Some(owner_era))?;
    let rosters = match collect_siege_rosters(&SiegeRosterInput {
        city: &inp.city,
        anchor_id: &unit_id.to_string(),
        units: &inp.units,
        relations: &inp.relations,
        def_opts: inp.def_opts.clone(),
        ready_machines: &inp.ready_machines,
        turn: inp.turn,
        unit_rows: &data.unit_rows,
        militia: &data.militia,
    }) {
        Ok(r) => r,
        // Pin `:36825-36834`: bez obrońców — mur nienaruszony bez machin (komunikat), z machinami zdobycie bez bitwy.
        Err(AdapterError::NoDefenders(_)) => {
            return Err(if inp.ready_machines.is_empty() {
                SiegeBattleError::NoDefendersWallIntact { city_id }
            } else {
                SiegeBattleError::NoDefendersCaptureRequested { city_id }
            })
        }
        Err(e) => return Err(e.into()),
    };
    let def_owner = rosters.def.first().map_or(city_owner, |u| u.owner_id);
    // `defCivId` (`main.ts:36861-36863`): cywilizacja właściciela miasta; `ikonaIdToBronzeCiv` (`:36989`).
    let def_civ = state
        .players
        .iter()
        .find(|p| p.id == city.owner_id)
        .map(|p| ikona_id_to_bronze_civ(&p.civilization).to_owned());
    let input = SiegeSessionInput {
        city_id,
        anchor_unit_id: unit_id,
        battle_index,
        owners: owner_contexts(state)?,
        owner_era: Some(owner_era),
        defender_era: Some(era(def_owner)?),
        def_civ,
        teren: teren.to_owned(),
        world_terrain: Some(WorldTerrainInput {
            baza: teren.to_owned(),
            las,
            rzeka: false,
        }),
    };
    Ok(ActiveSiegeBattle {
        city_id,
        anchor_unit_id: unit_id,
        start_state: Box::new(state.clone()),
        input,
        atk_roster: rosters.atk,
        def_roster: rosters.def,
        ops: Vec::new(),
        live_key: NEXT_LIVE_KEY.fetch_add(1, std::sync::atomic::Ordering::Relaxed),
    })
}

/// Ramka sceny z pętli i ciała (pozy, amunicja, mur): producent [`battle_frame`] po komendzie.
///
/// # Errors
/// [`SiegeBattleError::Producer`] (niespójna ramka).
pub fn session_frame(s: &SiegeBattleSession) -> Result<BattleFrameDto, SiegeBattleError> {
    let lp = s.battle_loop();
    let body = &lp.env.body;
    let to_i32 = |v: i64| {
        i32::try_from(v).map_err(|_| SiegeBattleError::Producer(format!("wiersz/kolumna {v}")))
    };
    let mut poses: [Vec<FrameUnitPose>; 2] = [Vec::new(), Vec::new()];
    for (s_ix, side) in [BattleSide::Attacker, BattleSide::Defender]
        .into_iter()
        .enumerate()
    {
        for (i, u) in body.units[s_ix].iter().enumerate() {
            let facing = body.facing(UnitRef { side, idx: i });
            #[allow(clippy::cast_possible_truncation)]
            poses[s_ix].push(FrameUnitPose {
                col: to_i32(u.activate.q)?,
                row: to_i32(u.activate.r)?,
                facing: facing as i32,
                on_wall_walkway: u.activate.on_wall_walkway,
                ammo_left: body.ammo_left[s_ix][i],
            });
        }
    }
    let mut wall_tile_hp = BTreeMap::new();
    for &(row, hp) in &body.scene.wall_tile_hp {
        wall_tile_hp.insert(to_i32(row)?, hp);
    }
    let mut tower_at_wall_rows = BTreeSet::new();
    for &row in &body.tower_at_wall_rows {
        tower_at_wall_rows.insert(to_i32(row)?);
    }
    let wall = WallState {
        wall_col: to_i32(lp.st.siege_wall_col)?,
        gate_col: to_i32(body.siege_gate_col)?,
        gate_hp: body.gate_hp,
        gate_open: body.scene.gate_open,
        wall_tile_hp,
        wall_tiles_init: body.siege_wall_tiles_init,
        tower_at_wall_rows,
        wall_ever_breached: lp.env.wall_ever_breached,
    };
    battle_frame(lp, s.clock().now(), &FrameInput { poses, wall })
        .map_err(|e| SiegeBattleError::Producer(format!("ramka: {e:?}")))
}

/// Jednostki sceny (mapowanie id bitwy → id rosteru).
#[must_use]
pub fn session_units(s: &SiegeBattleSession) -> Vec<SiegeBattleUnitRefDto> {
    let st = &s.battle_loop().st;
    let ids = s.roster_ids();
    let mut out = Vec::new();
    for (side, list, tag) in [(0usize, &st.atk, "atk"), (1usize, &st.def, "def")] {
        for (i, u) in list.iter().enumerate() {
            out.push(SiegeBattleUnitRefDto {
                battle_id: u.id,
                unit_id: ids[side].get(i).cloned().unwrap_or_default(),
                side: tag.to_owned(),
            });
        }
    }
    out
}

fn payload(
    s: &SiegeBattleSession,
    city_id: u64,
    actions: &[TimedAction],
    units: bool,
) -> Result<SiegeBattlePayload, SiegeBattleError> {
    // D-WIRB-6: akcje odpowiedzi w kolejności czasu wirtualnego (sortowanie stabilne po `t0`). Ciało pętli emituje marsz
    // wielokrokowy jednej aktywacji z przyszłymi `t0` (kolejne `_doMove` po `MOVE_STEP_MS + przerwa`), zanim zegar
    // odpali klocki o wcześniejszym czasie (np. strzał wieży); w pinie te wywołania sceny zachodzą w kolejności czasu,
    // a `validate_actions` (P4-1I3) wymaga niemalejącego `t0`. Remisy `t0` zachowują kolejność emisji.
    let mut ordered = actions.to_vec();
    ordered.sort_by(|a, b| a.t0.partial_cmp(&b.t0).unwrap_or(std::cmp::Ordering::Equal));
    let actions = actions_to_dto(&ordered, &s.battle_loop().st)
        .map_err(|e| SiegeBattleError::Producer(format!("akcje: {e:?}")))?;
    Ok(SiegeBattlePayload {
        city_id,
        phase: if s.phase() == SessionPhase::Finished {
            SiegeBattlePhaseDto::Finished
        } else {
            SiegeBattlePhaseDto::Running
        },
        units: if units { session_units(s) } else { Vec::new() },
        actions,
        frame: Some(session_frame(s)?),
        result: None,
    })
}

/// `StartSiegeStorm`: sesja w fazie czasu rzeczywistego (`bs.play`), odpowiedź z jednostkami sceny, akcjami startu i
/// ramką.
///
/// # Errors
/// [`SiegeBattleError`].
pub fn start_payload(battle: &ActiveSiegeBattle) -> Result<SiegeBattlePayload, SiegeBattleError> {
    let data = session_data()?;
    let mut s = SiegeBattleSession::start(&battle.start_state, &battle.input, data)?;
    let actions = s.battle_loop_mut().take_actions();
    let out = payload(&s, battle.city_id, &actions, true);
    keep_session(battle, s);
    out
}

/// `StepSiegeBattle{wall_ms}`: krok czasu rzeczywistego; operacja zapisywana dopiero po powodzeniu.
///
/// # Errors
/// [`SiegeBattleError::Session`] (np. `AlreadyFinished`, `InvalidData`).
pub fn step(
    battle: &mut ActiveSiegeBattle,
    wall_ms: f64,
) -> Result<SiegeBattlePayload, SiegeBattleError> {
    // Błąd komendy: sesja nie wraca do pamięci podręcznej (kolejna komenda odtwarza ją z zapisu operacji).
    let mut s = take_session(battle)?;
    let rep = s.step(wall_ms)?;
    battle.ops.push(DriverOp::Step(wall_ms));
    let out = payload(&s, battle.city_id, &rep.actions, false);
    keep_session(battle, s);
    out
}

/// `SkipSiegeBattle`: przewijanie do końca bitwy (`skip()` po starcie, `:3680-3707`).
///
/// # Errors
/// [`SiegeBattleError::Session`].
pub fn skip(battle: &mut ActiveSiegeBattle) -> Result<SiegeBattlePayload, SiegeBattleError> {
    let mut s = take_session(battle)?;
    let rep = s.skip()?;
    battle.ops.push(DriverOp::Skip);
    let out = payload(&s, battle.city_id, &rep.actions, false);
    keep_session(battle, s);
    out
}

fn battle_winner(w: LoopWinner) -> BattleWinner {
    match w {
        LoopWinner::Attacker => BattleWinner::Atakujacy,
        LoopWinner::Defender => BattleWinner::Obronca,
        LoopWinner::Draw => BattleWinner::Remis,
    }
}

fn unit_index(state: &PlayableState, id: &str) -> Option<usize> {
    let n: u64 = id.parse().ok()?;
    state.units.iter().position(|u| u.id.get() == n)
}

fn remove_unit(state: &mut PlayableState, id: &str, removed: &mut Vec<u64>) {
    if let Some(i) = unit_index(state, id) {
        let uid = state.units[i].id.get();
        state.units.remove(i);
        state.economy.units.remove(&uid);
        removed.push(uid);
    }
}

fn pos_of(u: &RosterUnit) -> (i32, i32) {
    #[allow(clippy::cast_possible_truncation)]
    (u.q as i32, u.r as i32)
}

/// `mapHexPassableForUnit && !besiegedCityAtHex` (`retreatHexPassable`, `main.ts:33765-33775`).
fn retreat_hex_passable(state: &PlayableState, q: i32, r: i32) -> bool {
    let (Ok(x), Ok(y)) = (u16::try_from(q), u16::try_from(r)) else {
        return false;
    };
    let p = PositionDto::new(x, y);
    let Some(tile) = state.map.tile(p) else {
        return false;
    };
    // Teren stanu nie ma gór; woda = `isWaterTerrain`.
    if matches!(tile.terrain, PlayableTerrain::Water) {
        return false;
    }
    !state
        .cities
        .iter()
        .any(|c| c.position == p && state.oblegane.contains(&c.id))
}

/// `isOccupiedHex(q, r, exceptId)` (`main.ts:33777-33779`).
fn is_unit_at(state: &PlayableState, q: i32, r: i32, except: Option<u64>) -> bool {
    state.units.iter().any(|u| {
        i32::from(u.position.x()) == q
            && i32::from(u.position.y()) == r
            && Some(u.id.get()) != except
    })
}

/// Pozycje rosteru (obiekty `RuntimeUnit` pinu: zachowują ostatnią pozycję także po usunięciu z `units`).
struct RosterPos {
    pos: BTreeMap<String, (i32, i32)>,
}

impl RosterPos {
    fn centroid(&self, roster: &[RosterUnit]) -> (f64, f64) {
        if roster.is_empty() {
            return (0.0, 0.0);
        }
        let (mut sq, mut sr) = (0.0, 0.0);
        for u in roster {
            let (q, r) = self.pos[&u.id];
            sq += f64::from(q);
            sr += f64::from(r);
        }
        #[allow(clippy::cast_precision_loss)]
        let n = roster.len() as f64;
        (sq / n, sr / n)
    }
}

/// `pickRetreatTargetAwayFromAttacker` / `pickRetreatTargetTowardAttackerSide` (`post-battle-map.ts:213-240`).
fn pick_retreat_target(
    state: &PlayableState,
    battle: (i32, i32),
    atk_centroid: (f64, f64),
    away: bool,
) -> (i32, i32) {
    let mut passable: Vec<(i32, i32)> = HEX_NEIGHBORS
        .iter()
        .map(|&(dq, dr)| (battle.0 + dq, battle.1 + dr))
        .filter(|&(q, r)| retreat_hex_passable(state, q, r))
        .collect();
    if passable.is_empty() {
        return battle;
    }
    let d = |p: &(i32, i32)| {
        (f64::from(p.0) - atk_centroid.0).powi(2) + (f64::from(p.1) - atk_centroid.1).powi(2)
    };
    // `Array.prototype.sort` stabilne; komparator `db - da` (dalej najpierw) albo `da - db`.
    passable.sort_by(|a, b| {
        let (da, db) = (d(a), d(b));
        let o = if away {
            db.partial_cmp(&da)
        } else {
            da.partial_cmp(&db)
        };
        o.unwrap_or(std::cmp::Ordering::Equal)
    });
    passable[0]
}

/// `placeFanOutGroup` (`post-battle-map.ts:281-319`). `defLossesThisTurn` przy braku miejsca: pola brak w stanie
/// (poza zakresem, raport).
#[allow(clippy::too_many_arguments)]
fn place_fan_out_group(
    state: &mut PlayableState,
    rp: &mut RosterPos,
    alive: &[RosterUnit],
    lead_id: &str,
    battle: (i32, i32),
    direction: (i32, i32),
    city_center: Option<(i32, i32)>,
) {
    let (dq, dr) = (direction.0 - battle.0, direction.1 - battle.1);
    let mut order: Vec<&str> = vec![lead_id];
    order.extend(
        alive
            .iter()
            .map(|u| u.id.as_str())
            .filter(|id| *id != lead_id),
    );
    for id in order {
        let Some(i) = unit_index(state, id) else {
            continue;
        };
        let (uq, ur) = (
            i32::from(state.units[i].position.x()),
            i32::from(state.units[i].position.y()),
        );
        if city_center == Some((uq, ur)) {
            continue;
        }
        let uid = state.units[i].id.get();
        for step in 1..=3 {
            let (tq, tr) = (uq + dq * step, ur + dr * step);
            if !retreat_hex_passable(state, tq, tr) {
                break;
            }
            if !is_unit_at(state, tq, tr, Some(uid)) {
                #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
                {
                    state.units[i].position = PositionDto::new(tq as u16, tr as u16);
                }
                rp.pos.insert(id.to_owned(), (tq, tr));
                break;
            }
        }
    }
}

fn live<'a>(state: &PlayableState, roster: &'a [RosterUnit]) -> Vec<&'a RosterUnit> {
    roster
        .iter()
        .filter(|u| unit_index(state, &u.id).is_some())
        .collect()
}

fn hex_distance(a: (i32, i32), b: (i32, i32)) -> i32 {
    let (dq, dr) = (a.0 - b.0, a.1 - b.1);
    (dq.abs() + dr.abs() + (dq + dr).abs()) / 2
}

/// Wejście zastosowania wyniku: miasto, kotwica i pełne rostery (`atkRosterRef` / `defRosterRef` z pozycjami startu).
#[derive(Debug, Clone, Copy)]
pub struct ApplyRosters<'a> {
    pub city_id: u64,
    pub anchor_unit_id: u64,
    pub atk_roster: &'a [RosterUnit],
    pub def_roster: &'a [RosterUnit],
}

/// Zastosowanie wyniku bitwy do stanu: `consumeReadyMachines` + `finishSiegeStormBattle` bez gałęzi zdobycia
/// (D-WIRB-3). Kolejność jak pin: machiny (`:37023`), `applyPostBattleMap` (survivors `:168-189`, weterani
/// `:411-429`, gałąź zwycięzcy `:443-463`, punkt ruchu `:465`), `validateActiveSieges` (`:34727`), `afterSiegeUi`
/// (remis → `endMapSiege`, `:36660`).
///
/// # Errors
/// [`SiegeBattleError::Producer`] przy niespójnym wyniku.
#[allow(clippy::too_many_lines)]
pub fn apply_outcome(
    state: &mut PlayableState,
    battle: &ApplyRosters<'_>,
    outcome: &SessionOutcome,
    scene_ids: &[Vec<String>; 2],
) -> Result<SiegeBattleResultDto, SiegeBattleError> {
    let city_id = battle.city_id;
    let cid = CityId::new(city_id);
    let city = state
        .cities
        .iter()
        .find(|c| c.id == cid)
        .ok_or(SiegeBattleError::CityNotFound(city_id))?
        .clone();
    let battle_hex = (i32::from(city.position.x()), i32::from(city.position.y()));
    // `consumeReadyMachines(city)` (`main.ts:37023`, `siegeMachines.ts:74-81`).
    let consumed_machines = state.siege_machines_ready.remove(&cid).unwrap_or_default();

    let winner = outcome.winner;
    let breached = outcome.wall_ever_breached;
    // `cityIsFortified(maMur, built)`: szturm wymaga `maMur` (`:36814`), więc zawsze `true`;
    // `stormCaptureBlocked = winner === 'atakujacy' && !canCaptureCity(true, breached)` (`:36622-36623`).
    let capture_blocked = winner == LoopWinner::Attacker && !breached;

    // `applyManualSurvivors` (`post-battle-map.ts:168-189`): survivors = `_endSurvivors` (`battleScene.ts:10225`,
    // `:9474-9477`, `:9495`): `_battleUnitsForMapExport` zwycięzcy (remis: obu stron) = `hp > 0 && (!dead || routed)`.
    let survivor_sides: &[usize] = match winner {
        LoopWinner::Attacker => &[0],
        LoopWinner::Defender => &[1],
        LoopWinner::Draw => &[0, 1],
    };
    let mut survivors: BTreeMap<String, f64> = BTreeMap::new();
    for u in &outcome.units {
        let s = match u.side {
            crate::domain::battle_setup_units::Side::Atk => 0,
            crate::domain::battle_setup_units::Side::Def => 1,
        };
        if survivor_sides.contains(&s) && u.hp > 0.0 && (!u.dead || u.routed) {
            survivors.insert(u.roster_id.clone(), u.hp.max(0.0));
        }
    }
    // `buildBattleEventLog(this.atk, this.def)` (`:10724-10727`): jednostki sceny obu stron.
    let logged: BTreeSet<&str> = scene_ids
        .iter()
        .flat_map(|v| v.iter().map(String::as_str))
        .collect();
    let mut removed = Vec::new();
    let mut hp_set = Vec::new();
    for u in battle.atk_roster.iter().chain(battle.def_roster.iter()) {
        if !logged.contains(u.id.as_str()) {
            continue;
        }
        match survivors.get(&u.id) {
            None => remove_unit(state, &u.id, &mut removed),
            Some(&hp) => {
                if let Some(i) = unit_index(state, &u.id) {
                    let uid = state.units[i].id.get();
                    if hp <= 0.0 {
                        remove_unit(state, &u.id, &mut removed);
                    } else {
                        state.economy.units.entry(uid).or_default().hp = Some(hp);
                        hp_set.push(SiegeUnitHpDto { unit_id: uid, hp });
                    }
                }
            }
        }
    }

    // `registerVeteranProgressAfterBattle` (`post-battle-map.ts:411-429`, `veteran.ts:95-98`, `:291-294`).
    if winner != LoopWinner::Draw {
        let win_roster = if winner == LoopWinner::Attacker {
            battle.atk_roster
        } else {
            battle.def_roster
        };
        let mut seen = BTreeSet::new();
        for r in win_roster {
            if !logged.contains(r.id.as_str()) || !seen.insert(r.id.clone()) {
                continue;
            }
            let Some(i) = unit_index(state, &r.id) else {
                continue;
            };
            if is_civilian_unit(&r.category, &r.type_id) {
                continue;
            }
            let uid = state.units[i].id.get();
            let entry: &mut PlayableReplaceUnit = state.economy.units.entry(uid).or_default();
            let cur = entry
                .battles_survived
                .filter(|v| v.is_finite() && *v > 0.0)
                .map_or(0.0, f64::floor);
            entry.battles_survived = Some((cur + 1.0).min(VETERAN_MAX_BATTLES_TRACKED));
        }
    }

    let mut rp = RosterPos {
        pos: battle
            .atk_roster
            .iter()
            .chain(battle.def_roster.iter())
            .map(|u| (u.id.clone(), pos_of(u)))
            .collect(),
    };
    let anchor_id = battle.anchor_unit_id.to_string();
    let mut capture_requested = None;
    match winner {
        LoopWinner::Attacker if capture_blocked => {
            // R1: mur/palisada stoi — atakujący zostają pod murami (`post-battle-map.ts:443-444`).
        }
        LoopWinner::Attacker => {
            // D-WIRB-3: `wipeDefenderOnCityCenter` + `retreatDefendersAfterAtkWin` + `moveAtkRosterOntoBattleHex` +
            // `applyCityCaptureToMap` (`:445-448`, `main.ts:34646-34665`) = hak T8.
            let atk_owner = battle
                .atk_roster
                .first()
                .map_or(0, |u| u64::try_from(u.owner_id).unwrap_or(0));
            capture_requested = Some(CityCaptureRequested {
                city_id,
                attacker_owner_id: atk_owner,
                anchor_unit_id: battle.anchor_unit_id,
            });
        }
        LoopWinner::Defender => {
            // `retreatAtkRosterToStart` (`:380-390`); `defLossesThisTurn` obrońców: pola brak w stanie (raport).
            for r in battle.atk_roster {
                if let Some(i) = unit_index(state, &r.id) {
                    let (q, rr) = pos_of(r);
                    if let (Ok(x), Ok(y)) = (u16::try_from(q), u16::try_from(rr)) {
                        state.units[i].position = PositionDto::new(x, y);
                    }
                }
            }
        }
        LoopWinner::Draw => {
            // `post-battle-map.ts:455-462`: atakujący w stronę swojej strony, potem obrońcy od atakujących.
            let atk_dir =
                pick_retreat_target(state, battle_hex, rp.centroid(battle.atk_roster), false);
            let atk_alive: Vec<RosterUnit> = live(state, battle.atk_roster)
                .into_iter()
                .cloned()
                .collect();
            if !atk_alive.is_empty() {
                place_fan_out_group(
                    state,
                    &mut rp,
                    &atk_alive,
                    &anchor_id,
                    battle_hex,
                    atk_dir,
                    Some(battle_hex),
                );
            }
            let def_alive: Vec<RosterUnit> = live(state, battle.def_roster)
                .into_iter()
                .cloned()
                .collect();
            // `pickLiveDefLead` (`:321-328`): obrońca na heksie bitwy, inaczej pierwszy żywy.
            let lead = def_alive
                .iter()
                .find(|u| {
                    unit_index(state, &u.id).is_some_and(|i| {
                        (
                            i32::from(state.units[i].position.x()),
                            i32::from(state.units[i].position.y()),
                        ) == battle_hex
                    })
                })
                .or_else(|| def_alive.first())
                .map(|u| u.id.clone());
            if let Some(lead) = lead {
                let dir =
                    pick_retreat_target(state, battle_hex, rp.centroid(battle.atk_roster), true);
                place_fan_out_group(
                    state,
                    &mut rp,
                    &def_alive,
                    &lead,
                    battle_hex,
                    dir,
                    Some(battle_hex),
                );
            }
        }
    }

    // `spendAttackMpOnLive` (`post-battle-map.ts:392-402`).
    for r in battle.atk_roster {
        if is_civilian_unit(&r.category, &r.type_id) && r.id != anchor_id {
            continue;
        }
        if let Some(i) = unit_index(state, &r.id) {
            let left = f64::from(state.units[i].movement);
            state.units[i].movement = MovementPoints::new((left - 1.0).max(0.0));
        }
    }

    // `if (mapWinner === 'obronca') selectedId = null` (`main.ts:34670`).
    if winner == LoopWinner::Defender {
        state.selected_unit_id = None;
        for u in &mut state.units {
            u.selected = false;
        }
    }

    // `validateActiveSieges` (`main.ts:18019-18037`) dla szturmowanego miasta: oblegający = właściciel kotwicy (pin
    // `ctx.oblegajacyOwnerId === 0`, `:36800`). Pozostałe miasta: stan nie niesie `oblegajacyOwnerId` (raport).
    let mut siege_ended = false;
    let besieger = battle.atk_roster.first().map_or(-1, |u| u.owner_id);
    if state.oblegane.contains(&cid) {
        let at_war = u64::try_from(besieger).ok().is_some_and(|b| {
            state
                .war
                .diplomacy
                .relation(PlayerId::new(b), city.owner_id)
                .is_some_and(|r| r.status == RelationStatus::War)
        });
        let adjacent = state.units.iter().any(|u| {
            owner_i64(u.owner_id) == besieger
                && hex_distance(
                    (i32::from(u.position.x()), i32::from(u.position.y())),
                    battle_hex,
                ) == 1
        });
        if !at_war || !adjacent {
            end_map_siege(state, cid);
            siege_ended = true;
        }
    }
    // `afterSiegeUi` remis: `endMapSiege(city.id)` (`main.ts:36660`, R-OBLEZENIE-REMIS-MASZYNY-Q2=A).
    if winner == LoopWinner::Draw {
        end_map_siege(state, cid);
        siege_ended = true;
    }

    Ok(SiegeBattleResultDto {
        winner: battle_winner(winner),
        round_no: outcome.round_no,
        wall_breached: breached,
        capture_blocked,
        capture_requested,
        removed_unit_ids: removed,
        hp: hp_set,
        consumed_machines,
        siege_ended,
    })
}

/// `endMapSiege(cityId)` (`main.ts:17880-17899`) w zakresie stanu: `oblegane = false`, `clearSiegeMachines(city)`.
/// Pola `oblegajacyOwnerId`, `siegeArmyGroupId`, `siegeCapitulationPending`, `oblegaCityId`, liczniki tur oblężenia: brak w
/// `PlayableState` (raport).
fn end_map_siege(state: &mut PlayableState, cid: CityId) {
    state.oblegane.remove(&cid);
    state.siege_machines_ready.remove(&cid);
}

/// `FinishSiegeBattle`: wynik sesji + zastosowanie do stanu.
///
/// # Errors
/// [`SiegeBattleError::Session`] (`NotFinished`), [`SiegeBattleError::Producer`].
pub fn finish(
    state: &mut PlayableState,
    battle: &ActiveSiegeBattle,
) -> Result<SiegeBattlePayload, SiegeBattleError> {
    let s = take_session(battle)?;
    let outcome = s.finish()?;
    if !outcome.unported.is_empty() {
        return Err(SiegeBattleError::Producer(format!(
            "sciezki nieportowane: {:?}",
            outcome.unported
        )));
    }
    let ids = s.roster_ids().clone();
    let rosters = ApplyRosters {
        city_id: battle.city_id,
        anchor_unit_id: battle.anchor_unit_id,
        atk_roster: &battle.atk_roster,
        def_roster: &battle.def_roster,
    };
    let result = apply_outcome(state, &rosters, &outcome, &ids)?;
    Ok(SiegeBattlePayload {
        city_id: battle.city_id,
        phase: SiegeBattlePhaseDto::Applied,
        units: Vec::new(),
        actions: Vec::new(),
        frame: None,
        result: Some(result),
    })
}

/// Id jednostki stanu z dziesiętnego id rosteru (`None` = jednostka wirtualna: milicja, machina).
#[must_use]
pub fn state_unit_id(roster_id: &str) -> Option<UnitId> {
    roster_id.parse::<u64>().ok().map(UnitId::new)
}
