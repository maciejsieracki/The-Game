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
//!   odtwarza sesję z zapisu (koszt O(długość bitwy), NIE_ZMIERZONO w release). Obrona r1 (Z3): klucz trafienia to
//!   `(live_key, ops.len())`, a `Clone` bitwy nadaje klonowi NOWY `live_key` ([`NEXT_LIVE_KEY`]), więc klon nigdy nie
//!   trafia w sesję oryginału ani innego klonu (rozbieżne historie o tej samej długości = różne klucze).
//! * **D-WIRB-6 (obrona r1, Z1: kolejność strumienia dla `renderer/src/battle/playback.rs`).** Konsument kolejkuje
//!   `push_actions(actions)` a potem `push_frame(frame)` i odrzuca każdy element o czasie mniejszym niż poprzedni
//!   (`check_order`, `playback.rs:584-625`, stan `last_queued` przez całą bitwę). Ciało pętli emituje akcje z przyszłym
//!   `t0` (marsz wielokrokowy jednej aktywacji, `_doMove` po `MOVE_STEP_MS`), zanim zegar dojdzie do tego czasu.
//!   Port wstrzymuje więc akcje z `t0 > vNow` ramki odpowiedzi ([`ActiveSiegeBattle`] `pending`) i oddaje je w
//!   odpowiedzi, której ramka ma `vNow >= t0`; reszta (`t0` za końcem bitwy) wychodzi w odpowiedzi
//!   `FinishSiegeBattle` (bez ramki). W każdej odpowiedzi: akcje posortowane stabilnie po `t0`, ramka nie wcześniejsza
//!   niż oddane akcje, a pierwsza akcja nie wcześniejsza niż ramka poprzedniej odpowiedzi — test
//!   `strumien_przyjmuje_konsument_playback` odwzorowuje `check_order` konsumenta.
//! * **D-WIRB-7 (obrona r1, Z2: bramki wejścia szturmu).** Most omija UI, więc [`prepare_storm`] odrzuca komendę, której
//!   web nie pozwala wydać: miasto gracza (`resolveEnemyCityClick` `not_enemy`, `map-attack-city.ts:119-121`); miasto
//!   oblegane z oblegającym w odległości 1 = ścieżka `siege_panel` (`:127-139`): kotwicą jest PIERWSZA jednostka stanu
//!   obcego właściciela w odległości 1 (`units.find`), inna jednostka = błąd; inaczej ścieżka `attack_choice`
//!   (`adjacentPlayerAttackers` `:66-80` + `canInitiateSiege` `mapSiegeDetect.ts:74-81`): kotwica gracza, odległość 1,
//!   `ruchLeft > 0`, nie cywil (`hint_civilian` `:141-146`), mur; `launchSiegeStormFromMap` (`main.ts:36800`): oblegający
//!   = gracz; wojna (`withPlayerWarConsent` `main.ts:13266-13281`: bez wojny web pyta o wypowiedzenie — most nie
//!   wypowiada wojny w tej komendzie, wypowiedzenie = osobna komenda #305) i `siegeAllowedBetween`
//!   (`diplomacy-siege-war-gate.ts:72-79`). Mgła (`hint_city_not_visible`): poza zakresem (sąsiedni heks jest zawsze w
//!   zasięgu widzenia kotwicy).
//! * **D-WIRB-8 (obrona r1, Z6: wyjście z bitwy).** `FinishSiegeBattle` jest zawsze wyjściem: wynik zastosowany albo
//!   `NotFinished` (bitwa trwa, dostępne `Skip`), albo — przy każdym innym błędzie (ścieżka nieportowana
//!   `outcome.unported`, `LoopUnsupported`, błąd zastosowania) — bitwa jest ZAMYKANA bez zmiany stanu i komenda zwraca
//!   [`SiegeBattleError::Aborted`]. Web nie ma tej ścieżki (scena zawsze kończy się wynikiem); port nie zgaduje wyniku.
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
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::OnceLock;

use civ_view_model::battle::{
    BattleActionDto, BattleFortDto, BattleFrameDto, BattleGridDto, BattleSetupDto,
    BattleSide as VmBattleSide, BattleUnitSpawnDto, BattleWinner, FortKind,
    TowerMaterial as VmTowerMaterial,
};
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
use crate::domain::battle_setup_units::Side;
use crate::domain::city_towers::strongest_ranged_unit_for_era;
use crate::domain::siege_battle_adapter::{
    collect_siege_rosters, is_civilian_unit, unit_def_index, AdapterError, RosterUnit,
    SiegeRosterInput, BATTLE_MAX_PER_SIDE,
};
use crate::domain::siege_battle_adapter_body::clamp_era;
use crate::domain::siege_battle_adapter_playable::{
    siege_inputs_from_playable, PlayableSiegeInputs,
};
use crate::domain::siege_battle_adapter_unit::{
    roster_to_battle_units, AdapterBattleUnit, OwnerContext, RosterBattleCtx,
};
use crate::domain::siege_city_fortification::CityFortificationKind;
use crate::domain::siege_battle_session::{
    SessionData, SessionError, SessionOutcome, SessionPhase, SiegeBattleSession, SiegeSessionInput,
};
use crate::domain::siege_tactics_actions::{actions_to_dto, TimedAction};
use crate::domain::siege_tactics_breach::WallState;
use crate::domain::siege_tactics_end::BattleSide;
use crate::domain::siege_tactics_frame::{battle_frame, FrameInput, FrameUnitPose};
use crate::domain::siege_tactics_loop::LoopWinner;
use crate::domain::siege_tactics_turnseq::UnitRef;
use crate::domain::turn_war_epoch::{
    empire_epoch_for_owner, game_start_era, owner_era_facts, OwnerEraFacts,
};
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
    /// D-WIRB-7: miasto gracza (`resolveEnemyCityClick` → `not_enemy`, `map-attack-city.ts:119-121`).
    NotEnemyCity { city_id: u64 },
    /// D-WIRB-7: kotwica nie w odległości 1 od miasta (`adjacentPlayerAttackers`, `canInitiateSiege`).
    NotAdjacent { unit_id: u64, city_id: u64 },
    /// D-WIRB-7: miasto oblegane — szturm z panelu oblężenia wydaje pierwsza jednostka oblegająca (`siege_panel`,
    /// `map-attack-city.ts:127-139`).
    NotSiegeAnchor { unit_id: u64, besieger_id: u64 },
    /// D-WIRB-7: kotwica nie może atakować (`adjacentPlayerAttackers`: `ruchLeft > 0`, nie cywil).
    AnchorCannotAttack { unit_id: u64, reason: &'static str },
    /// D-WIRB-7: brak wojny z właścicielem miasta (`withPlayerWarConsent` / `siegeAllowedBetween`).
    NotAtWar { city_id: u64 },
    /// D-WIRB-8: bitwa zamknięta bez zastosowania wyniku (stan bez zmian); `reason` = błąd źródłowy.
    Aborted { city_id: u64, reason: String },
    /// P4-1I6-DLUGI (D-1I6D-3): wołający zażądał porzucenia bitwy (`AbortSiegeBattle`, np. klient nie zbudował sceny);
    /// źródło [`Self::Aborted`] w `FinishSiegeBattle`, nie wychodzi poza grę.
    AbortRequested,
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
            Self::NotEnemyCity { city_id } => {
                write!(f, "siege storm: city {city_id} belongs to the player")
            }
            Self::NotAdjacent { unit_id, city_id } => write!(
                f,
                "siege storm: unit {unit_id} is not adjacent to city {city_id}"
            ),
            Self::NotSiegeAnchor {
                unit_id,
                besieger_id,
            } => write!(
                f,
                "siege storm: besieged city is stormed by unit {besieger_id}, not {unit_id}"
            ),
            Self::AnchorCannotAttack { unit_id, reason } => {
                write!(f, "siege storm: unit {unit_id} cannot attack ({reason})")
            }
            Self::NotAtWar { city_id } => {
                write!(
                    f,
                    "siege storm: not at war with the owner of city {city_id}"
                )
            }
            Self::Aborted { city_id, reason } => write!(
                f,
                "siege battle at city {city_id} closed without a result: {reason}"
            ),
            Self::AbortRequested => f.write_str("siege battle aborted by the caller"),
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

/// P4-1I6-DLUGI (D-1I6-ERR): błąd komendy bitwy oblężniczej na drucie mostu — kod i dane, nie tekst
/// (`BridgeError.siegeBattle`). Pola `detail` niosą wyłącznie opis błędów wewnętrznych (sesja, adapter, producent),
/// których typy nie są częścią kontraktu; `NotFinished` ma własny kod (D-WIRB-8: bitwa trwa, dostępne `Skip`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "code",
    rename_all = "snake_case",
    rename_all_fields = "camelCase"
)]
pub enum SiegeBattleErrorDto {
    /// [`SiegeBattleError::NoActiveBattle`].
    NoActiveBattle,
    /// [`SiegeBattleError::BattleInProgress`].
    BattleInProgress { city_id: u64 },
    /// [`SiegeBattleError::NotHumanBesieger`].
    NotHumanBesieger { unit_id: u64 },
    /// [`SiegeBattleError::CityNotFound`].
    CityNotFound { city_id: u64 },
    /// [`SiegeBattleError::UnitNotFound`].
    UnitNotFound { unit_id: u64 },
    /// [`SiegeBattleError::CityTileMissing`].
    CityTileMissing { city_id: u64 },
    /// [`SiegeBattleError::NoDefendersWallIntact`].
    NoDefendersWallIntact { city_id: u64 },
    /// [`SiegeBattleError::NoDefendersCaptureRequested`].
    NoDefendersCaptureRequested { city_id: u64 },
    /// `SiegeBattleError::Session(SessionError::NotFinished)`: `Finish` przed końcem bitwy.
    NotFinished,
    /// Inny błąd sesji (`detail` = opis `SessionError`).
    Session { detail: String },
    /// [`SiegeBattleError::Adapter`] (`detail` = opis `AdapterError`).
    Adapter { detail: String },
    /// [`SiegeBattleError::Producer`].
    Producer { detail: String },
    /// [`SiegeBattleError::NotEnemyCity`].
    NotEnemyCity { city_id: u64 },
    /// [`SiegeBattleError::NotAdjacent`].
    NotAdjacent { unit_id: u64, city_id: u64 },
    /// [`SiegeBattleError::NotSiegeAnchor`].
    NotSiegeAnchor { unit_id: u64, besieger_id: u64 },
    /// [`SiegeBattleError::AnchorCannotAttack`].
    AnchorCannotAttack { unit_id: u64, reason: String },
    /// [`SiegeBattleError::NotAtWar`].
    NotAtWar { city_id: u64 },
    /// [`SiegeBattleError::Aborted`]: bitwa zamknięta bez wyniku, stan gry bez zmian.
    Aborted { city_id: u64, reason: String },
    /// [`SiegeBattleError::AbortRequested`] (nie wychodzi z gry: `Finish` zamienia go na `Aborted`).
    AbortRequested,
}

impl SiegeBattleErrorDto {
    /// D-WIRB-8: `Finish` przed końcem bitwy (bitwa trwa, dostępne `Skip`).
    #[must_use]
    pub const fn is_not_finished(&self) -> bool {
        matches!(self, Self::NotFinished)
    }
}

impl From<&SiegeBattleError> for SiegeBattleErrorDto {
    fn from(e: &SiegeBattleError) -> Self {
        match e {
            SiegeBattleError::NoActiveBattle => Self::NoActiveBattle,
            SiegeBattleError::BattleInProgress { city_id } => Self::BattleInProgress {
                city_id: *city_id,
            },
            SiegeBattleError::NotHumanBesieger { unit_id } => Self::NotHumanBesieger {
                unit_id: *unit_id,
            },
            SiegeBattleError::CityNotFound(id) => Self::CityNotFound { city_id: *id },
            SiegeBattleError::UnitNotFound(id) => Self::UnitNotFound { unit_id: *id },
            SiegeBattleError::CityTileMissing(id) => Self::CityTileMissing { city_id: *id },
            SiegeBattleError::NoDefendersWallIntact { city_id } => Self::NoDefendersWallIntact {
                city_id: *city_id,
            },
            SiegeBattleError::NoDefendersCaptureRequested { city_id } => {
                Self::NoDefendersCaptureRequested { city_id: *city_id }
            }
            SiegeBattleError::Session(SessionError::NotFinished) => Self::NotFinished,
            SiegeBattleError::Session(s) => Self::Session {
                detail: s.to_string(),
            },
            SiegeBattleError::Adapter(a) => Self::Adapter {
                detail: a.to_string(),
            },
            SiegeBattleError::Producer(p) => Self::Producer { detail: p.clone() },
            SiegeBattleError::NotEnemyCity { city_id } => Self::NotEnemyCity { city_id: *city_id },
            SiegeBattleError::NotAdjacent { unit_id, city_id } => Self::NotAdjacent {
                unit_id: *unit_id,
                city_id: *city_id,
            },
            SiegeBattleError::NotSiegeAnchor {
                unit_id,
                besieger_id,
            } => Self::NotSiegeAnchor {
                unit_id: *unit_id,
                besieger_id: *besieger_id,
            },
            SiegeBattleError::AnchorCannotAttack { unit_id, reason } => Self::AnchorCannotAttack {
                unit_id: *unit_id,
                reason: (*reason).to_owned(),
            },
            SiegeBattleError::NotAtWar { city_id } => Self::NotAtWar { city_id: *city_id },
            SiegeBattleError::Aborted { city_id, reason } => Self::Aborted {
                city_id: *city_id,
                reason: reason.clone(),
            },
            SiegeBattleError::AbortRequested => Self::AbortRequested,
        }
    }
}

impl std::fmt::Display for SiegeBattleErrorDto {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NotFinished => write!(
                f,
                "{}",
                SiegeBattleError::Session(SessionError::NotFinished)
            ),
            Self::Session { detail } => write!(f, "siege battle: {detail}"),
            Self::Adapter { detail } => write!(f, "siege battle roster: {detail}"),
            Self::Producer { detail } => write!(f, "siege battle: {detail}"),
            Self::AnchorCannotAttack { unit_id, reason } => {
                write!(f, "siege storm: unit {unit_id} cannot attack ({reason})")
            }
            other => match other.to_error() {
                Some(e) => write!(f, "{e}"),
                None => write!(f, "{other:?}"),
            },
        }
    }
}

impl SiegeBattleErrorDto {
    /// Błąd biblioteki dla kodów bez pola `detail` (te same teksty `Display`).
    fn to_error(&self) -> Option<SiegeBattleError> {
        Some(match self {
            Self::NoActiveBattle => SiegeBattleError::NoActiveBattle,
            Self::BattleInProgress { city_id } => SiegeBattleError::BattleInProgress {
                city_id: *city_id,
            },
            Self::NotHumanBesieger { unit_id } => SiegeBattleError::NotHumanBesieger {
                unit_id: *unit_id,
            },
            Self::CityNotFound { city_id } => SiegeBattleError::CityNotFound(*city_id),
            Self::UnitNotFound { unit_id } => SiegeBattleError::UnitNotFound(*unit_id),
            Self::CityTileMissing { city_id } => SiegeBattleError::CityTileMissing(*city_id),
            Self::NoDefendersWallIntact { city_id } => SiegeBattleError::NoDefendersWallIntact {
                city_id: *city_id,
            },
            Self::NoDefendersCaptureRequested { city_id } => {
                SiegeBattleError::NoDefendersCaptureRequested { city_id: *city_id }
            }
            Self::NotEnemyCity { city_id } => SiegeBattleError::NotEnemyCity { city_id: *city_id },
            Self::NotAdjacent { unit_id, city_id } => SiegeBattleError::NotAdjacent {
                unit_id: *unit_id,
                city_id: *city_id,
            },
            Self::NotSiegeAnchor {
                unit_id,
                besieger_id,
            } => SiegeBattleError::NotSiegeAnchor {
                unit_id: *unit_id,
                besieger_id: *besieger_id,
            },
            Self::NotAtWar { city_id } => SiegeBattleError::NotAtWar { city_id: *city_id },
            Self::Aborted { city_id, reason } => SiegeBattleError::Aborted {
                city_id: *city_id,
                reason: reason.clone(),
            },
            Self::AbortRequested => SiegeBattleError::AbortRequested,
            Self::AnchorCannotAttack { .. }
            | Self::NotFinished
            | Self::Session { .. }
            | Self::Adapter { .. }
            | Self::Producer { .. } => return None,
        })
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
    /// P4-1I6-DLUGI (D-1I6D-3): bitwa porzucona komendą `AbortSiegeBattle` (stan gry bez zmian, bitwa zamknięta).
    Aborted,
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
///
/// Kontrakt dla T8 (obrona r1, U2): część B liczy `validateActiveSieges` szturmowanego miasta PRZED wejściem na heks i
/// przed zmianą właściciela (`siegeEnded` wyniku). W pinie wywołanie jest po `applyCityCaptureToMap`
/// (`main.ts:34744`), a zdobycie blokuje `isCityCaptureBlockedByDefenders` (`main.ts:34650-34653`). Konsument haka
/// MUSI: (1) sprawdzić `isCityCaptureBlockedByDefenders` po `wipeDefenderOnCityCenter`/`retreatDefendersAfterAtkWin`,
/// (2) wykonać `applyCityCaptureToMap` i (3) powtórzyć `validateActiveSieges` na stanie po zdobyciu.
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
    /// #354 (D-ZMA-2): wynik konsumenta haka w `FinishSiegeBattle` (`applyCityCaptureToMap` albo jawny brak zdobycia);
    /// `None` poza wygraną z wyłomem i w samym [`apply_outcome`] (część B).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub capture: Option<crate::domain::city_capture_apply::CityCaptureResultDto>,
    /// Jednostki stanu usunięte (`removeUnitById`), kolejność rosteru (atakujący, potem obrońcy).
    pub removed_unit_ids: Vec<u64>,
    /// HP ustawione ocalałym, kolejność rosteru.
    pub hp: Vec<SiegeUnitHpDto>,
    /// `consumeReadyMachines(city)` (`main.ts:37023`).
    pub consumed_machines: Vec<PlayableSiegeMachineKind>,
    /// Oblężenie zakończone (`endMapSiege`: remis `:36660` albo `validateActiveSieges` `main.ts:34744`).
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
    /// P4-1I6-DLUGI (D-1I6-SETUP): scena startu `new BattleScene(...)` (tylko `StartSiegeStorm`; producent
    /// [`battle_setup`]). Addytywne: odpowiedzi pozostałych komend bez klucza.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub setup: Option<BattleSetupDto>,
    /// P4-1I6-DLUGI (D-1I6D-2): strzelec wieży sceny (`towerShooterRow`, `battleScene.ts:4209-4211`; tylko
    /// `StartSiegeStorm`). `None` = brak wieży albo brak strzelca (pin: brak strzałów wieży).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tower_shooter: Option<SiegeTowerShooterDto>,
}

/// Strzelec wieży (`_fireOneTower` `:4133-4147`): pola wiersza `towerShooterRow` czytane przez `projectileKind`
/// (`kategoria = String(shooterRow.Typ ?? 'Distance')`, `Jednostka ?? 'Wieza (' + ... + ')'`).
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SiegeTowerShooterDto {
    /// `String(shooterRow.Typ)`; `None` = `null`/brak (`?? 'Distance'` u konsumenta).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub typ: Option<String>,
    /// `String(shooterRow.Jednostka)`; `None` = `null`/brak (`?? 'Strzelec'` u konsumenta).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub jednostka: Option<String>,
}

impl SiegeBattlePayload {
    /// D-1I6D-3: odpowiedź `AbortSiegeBattle` (bitwa zamknięta bez wyniku, bez akcji i ramki).
    #[must_use]
    pub fn aborted(city_id: u64) -> Self {
        Self {
            city_id,
            phase: SiegeBattlePhaseDto::Aborted,
            units: Vec::new(),
            actions: Vec::new(),
            frame: None,
            result: None,
            setup: None,
            tower_shooter: None,
        }
    }
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

/// Trwająca bitwa oblężnicza gry (D-WIRB-1). `Clone` ręczny: klon dostaje nowy `live_key` (Z3); `PartialEq` pomija
/// `live_key` (klucz pamięci podręcznej, nie stan bitwy).
#[derive(Debug)]
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
    /// D-WIRB-6 (Z1): akcje już wyemitowane przez scenę, z `t0` późniejszym niż `vNow` ostatniej oddanej ramki.
    pending: Vec<BattleActionDto>,
    /// Klucz sesji żywej w pamięci podręcznej wątku ([`LIVE_SESSION`]); unikalny w procesie i dla każdego klonu.
    live_key: u64,
    /// D-1I6D-3: żądanie porzucenia ([`Self::request_abort`]); zużywa je [`finish`] (błąd → `Aborted` w grze).
    abort_requested: AtomicBool,
}

fn next_live_key() -> u64 {
    NEXT_LIVE_KEY.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
}

impl Clone for ActiveSiegeBattle {
    fn clone(&self) -> Self {
        Self {
            city_id: self.city_id,
            anchor_unit_id: self.anchor_unit_id,
            start_state: self.start_state.clone(),
            input: self.input.clone(),
            atk_roster: self.atk_roster.clone(),
            def_roster: self.def_roster.clone(),
            ops: self.ops.clone(),
            pending: self.pending.clone(),
            // Z3: klon = osobna historia; wspólny klucz oddawałby klonowi sesję innego klonu z pamięci podręcznej.
            live_key: next_live_key(),
            abort_requested: AtomicBool::new(self.abort_requested.load(Ordering::Relaxed)),
        }
    }
}

impl PartialEq for ActiveSiegeBattle {
    fn eq(&self, other: &Self) -> bool {
        self.city_id == other.city_id
            && self.anchor_unit_id == other.anchor_unit_id
            && self.start_state == other.start_state
            && self.input == other.input
            && self.atk_roster == other.atk_roster
            && self.def_roster == other.def_roster
            && self.ops == other.ops
            && self.pending == other.pending
            && self.abort_requested.load(Ordering::Relaxed)
                == other.abort_requested.load(Ordering::Relaxed)
    }
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
    /// D-1I6D-3 (`AbortSiegeBattle`): oznacza bitwę do porzucenia. Gra trzyma bitwę za `&` (`PlayableGame::siege_battle`,
    /// plik gry poza zakresem tematu), więc żądanie jest flagą; najbliższe [`finish`] zwraca
    /// [`SiegeBattleError::AbortRequested`], a `PlayableGame::finish_siege_battle` (D-WIRB-8) zamyka bitwę bez zmiany
    /// stanu i zwraca `Aborted`. Odpowiednik webu: `onCancel` sceny (`main.ts:37017`, deploy anulowany: brak wyniku,
    /// machiny nie zużyte).
    pub fn request_abort(&self) {
        self.abort_requested.store(true, Ordering::Relaxed);
    }

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
    prepare_storm_with_eras(
        state,
        city_id,
        unit_id,
        battle_index,
        &owner_era_facts(state),
        game_start_era(&state.params.epoch_id),
    )
}

/// [`prepare_storm`] z jawnymi faktami epok (`empireEpochForOwner`). `PlayableState` nie niesie dziś epoki per właściciel
/// ([`owner_era_facts`]: każdy właściciel = epoka startu), więc testy producenta wstrzykują fakty, żeby rozróżnić epokę
/// właściciela miasta (milicja, `main.ts:34768-34771`) od epoki obrońcy (`defRosterRef[0].ownerId`, `:36999`).
///
/// # Errors
/// Jak [`prepare_storm`].
#[allow(clippy::too_many_lines)]
pub fn prepare_storm_with_eras(
    state: &PlayableState,
    city_id: u64,
    unit_id: u64,
    battle_index: u32,
    facts: &OwnerEraFacts,
    start_era: f64,
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
    // D-WIRB-7: bramki wejścia (`resolveEnemyCityClick`, `canInitiateSiege`, `launchSiegeStormFromMap`, wojna).
    let city_hex = (i32::from(city.position.x()), i32::from(city.position.y()));
    let dist = |u: &crate::domain::playable::PlayableUnit| {
        hex_distance(
            (i32::from(u.position.x()), i32::from(u.position.y())),
            city_hex,
        )
    };
    if owner_i64(city.owner_id) == HUMAN_OWNER_ID {
        return Err(SiegeBattleError::NotEnemyCity { city_id });
    }
    // `siege_panel` (`map-attack-city.ts:127-139`): `units.find(u => u.ownerId !== city.ownerId && hexDistance === 1)`.
    let besieger = if state.oblegane.contains(&city.id) {
        state
            .units
            .iter()
            .find(|u| u.owner_id != city.owner_id && dist(u) == 1)
    } else {
        None
    };
    let attack_choice = match besieger {
        Some(b) if b.id.get() != unit_id => {
            return Err(SiegeBattleError::NotSiegeAnchor {
                unit_id,
                besieger_id: b.id.get(),
            })
        }
        Some(_) => false,
        None => true,
    };
    // `launchSiegeStormFromMap` (`main.ts:36800-36806`): `ctx.oblegajacyOwnerId !== 0`.
    if owner_i64(anchor.owner_id) != HUMAN_OWNER_ID {
        return Err(SiegeBattleError::NotHumanBesieger { unit_id });
    }
    if attack_choice {
        // `adjacentPlayerAttackers` (`:66-80`) + `canInitiateSiege` (`mapSiegeDetect.ts:74-81`).
        if dist(anchor) != 1 {
            return Err(SiegeBattleError::NotAdjacent { unit_id, city_id });
        }
        if f64::from(anchor.movement) <= 0.0 {
            return Err(SiegeBattleError::AnchorCannotAttack {
                unit_id,
                reason: "ruchLeft = 0",
            });
        }
    }
    // `withPlayerWarConsent` (`main.ts:13266-13281`) + `siegeAllowedBetween` (`diplomacy-siege-war-gate.ts:72-79`,
    // `areEnemyOwners` `main.ts:13129-13133`).
    let at_war = state
        .war
        .diplomacy
        .relation(anchor.owner_id, city.owner_id)
        .is_some_and(|r| r.status == RelationStatus::War);
    if !at_war {
        return Err(SiegeBattleError::NotAtWar { city_id });
    }
    let tile = state
        .map
        .tile(city.position)
        .ok_or(SiegeBattleError::CityTileMissing(city_id))?;
    let (teren, las) = hex_terrain(tile.terrain);
    let era = |owner: i64| {
        empire_epoch_for_owner(owner, facts, start_era)
            .map(|(e, _)| e)
            .map_err(|e| SiegeBattleError::Producer(e.to_string()))
    };
    let city_owner = owner_i64(city.owner_id);
    let owner_era = era(city_owner)?;
    let inp = siege_inputs_with_deals(state, city_id, Some(owner_era))?;
    if attack_choice {
        // `hint_civilian` (`map-attack-city.ts:141-146`) / `!isCivilianUnit` w `adjacentPlayerAttackers` (`:75`).
        let anchor_id = unit_id.to_string();
        if inp
            .units
            .iter()
            .any(|u| u.id == anchor_id && is_civilian_unit(&u.category, &u.type_id))
        {
            return Err(SiegeBattleError::AnchorCannotAttack {
                unit_id,
                reason: "cywil",
            });
        }
    }
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
        pending: Vec::new(),
        live_key: next_live_key(),
        abort_requested: AtomicBool::new(false),
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

/// Stabilne sortowanie po `t0` (remisy w kolejności emisji / wstrzymania).
fn sort_by_t0(v: &mut [BattleActionDto]) {
    v.sort_by(|a, b| a.t0.partial_cmp(&b.t0).unwrap_or(std::cmp::Ordering::Equal));
}

/// Odpowiedź komendy sesji. D-WIRB-6: akcje wyemitowane w tej komendzie dołączają do wstrzymanych (`pending`), całość
/// jest sortowana stabilnie po `t0` (ciało pętli emituje marsz z przyszłym `t0`, zanim zegar odpali wcześniejsze klocki,
/// a `validate_actions` P4-1I3 wymaga niemalejącego `t0`), a oddawane są tylko akcje z `t0 <= vNow` ramki odpowiedzi
/// (kontrakt `check_order` konsumenta `playback.rs`); reszta czeka na kolejną odpowiedź albo na `FinishSiegeBattle`.
fn payload(
    s: &SiegeBattleSession,
    city_id: u64,
    pending: &mut Vec<BattleActionDto>,
    actions: &[TimedAction],
    units: bool,
) -> Result<SiegeBattlePayload, SiegeBattleError> {
    let mut ordered = actions.to_vec();
    ordered.sort_by(|a, b| a.t0.partial_cmp(&b.t0).unwrap_or(std::cmp::Ordering::Equal));
    let fresh = actions_to_dto(&ordered, &s.battle_loop().st)
        .map_err(|e| SiegeBattleError::Producer(format!("akcje: {e:?}")))?;
    let frame = session_frame(s)?;
    let mut all = std::mem::take(pending);
    all.extend(fresh);
    sort_by_t0(&mut all);
    let (out, keep): (Vec<_>, Vec<_>) = all.into_iter().partition(|a| a.t0 <= frame.v_now);
    *pending = keep;
    Ok(SiegeBattlePayload {
        city_id,
        phase: if s.phase() == SessionPhase::Finished {
            SiegeBattlePhaseDto::Finished
        } else {
            SiegeBattlePhaseDto::Running
        },
        units: if units { session_units(s) } else { Vec::new() },
        actions: out,
        frame: Some(frame),
        result: None,
        setup: None,
        tower_shooter: None,
    })
}

/// `StartSiegeStorm`: sesja w fazie czasu rzeczywistego (`bs.play`), odpowiedź z jednostkami sceny, akcjami startu i
/// ramką.
///
/// # Errors
/// [`SiegeBattleError`].
pub fn start_payload(
    battle: &mut ActiveSiegeBattle,
) -> Result<SiegeBattlePayload, SiegeBattleError> {
    let data = session_data()?;
    // `SiegeBattleSession::start` = `prepare` + `play`; scena startu (D-1I6-SETUP) czytana między nimi (`new
    // BattleScene` przed `bs.play`, `main.ts:36980-37019`).
    let mut s = SiegeBattleSession::prepare(&battle.start_state, &battle.input, data)?;
    let setup = battle_setup(&s, battle, data)?;
    let tower_shooter = tower_shooter(&s, &battle.input, data);
    s.play();
    let actions = s.battle_loop_mut().take_actions();
    let out = payload(&s, battle.city_id, &mut battle.pending, &actions, true).map(|mut p| {
        p.setup = Some(setup);
        p.tower_shooter = tower_shooter;
        p
    });
    keep_session(battle, s);
    out
}

/// `rosterToBattleUnits` obu stron (`main.ts:36980-36982`, `:34136-34143`) dokładnie jak w
/// [`SiegeBattleSession::prepare`] (rostery `collect_siege_rosters` obcięte do `BATTLE_MAX_PER_SIDE`), kluczem
/// `(strona, id rosteru)`. Sesja nie przechowuje `BattleUnit` (plik sesji poza zakresem tematu), więc producent sceny
/// liczy je ponownie z tych samych wejść (deterministycznie).
fn scene_battle_units(
    state: &PlayableState,
    input: &SiegeSessionInput,
    data: &SessionData,
) -> Result<BTreeMap<(usize, String), AdapterBattleUnit>, SiegeBattleError> {
    let inp = siege_inputs_with_deals(state, input.city_id, input.owner_era)?;
    let rosters = collect_siege_rosters(&SiegeRosterInput {
        city: &inp.city,
        anchor_id: &input.anchor_unit_id.to_string(),
        units: &inp.units,
        relations: &inp.relations,
        def_opts: inp.def_opts.clone(),
        ready_machines: &inp.ready_machines,
        turn: inp.turn,
        unit_rows: &data.unit_rows,
        militia: &data.militia,
    })?;
    let index = unit_def_index(&data.unit_rows);
    let ctx = RosterBattleCtx {
        rows: &data.unit_rows,
        index: &index,
        militia_defs: &rosters.militia_defs,
        owners: &input.owners,
        fallback: data.fallback,
    };
    let mut out = BTreeMap::new();
    for (si, roster, side) in [(0usize, &rosters.atk, Side::Atk), (1, &rosters.def, Side::Def)] {
        let capped = &roster[..roster.len().min(BATTLE_MAX_PER_SIDE)];
        for bu in roster_to_battle_units(capped, side, &ctx)? {
            out.insert((si, bu.id.clone()), bu);
        }
    }
    Ok(out)
}

/// `String(v)` pola wiersza danych (`null`/brak = `None`).
fn js_string(v: Option<&serde_json::Value>) -> Option<String> {
    match v {
        None | Some(serde_json::Value::Null) => None,
        Some(serde_json::Value::String(s)) => Some(s.clone()),
        Some(other) => Some(other.to_string()),
    }
}

/// D-1I6D-2: strzelec wieży sceny (`_placeSiegeTowers` + `towerShooterRow`, `battleScene.ts:4158-4170`, `:4209-4211`):
/// tylko przy materiale wieży (`towerMaterialFor(fortKind)`) i wierszu `strongestRangedUnitForEra(units,
/// clampEra(defenderEra), defCiv)`.
fn tower_shooter(
    s: &SiegeBattleSession,
    input: &SiegeSessionInput,
    data: &SessionData,
) -> Option<SiegeTowerShooterDto> {
    let siege = s.field().siege.as_ref()?;
    fort_dto(siege.fort_kind).1?;
    let row = strongest_ranged_unit_for_era(
        &data.tower_units,
        clamp_era(input.defender_era),
        input.def_civ.as_deref(),
    )?;
    Some(SiegeTowerShooterDto {
        typ: js_string(row.get("Typ")),
        jednostka: js_string(row.get("Jednostka")),
    })
}

/// `this.fortKind` sceny i `towerMaterialFor(fortKind)` (`game/city-towers.ts:23-27`) w typach DTO.
fn fort_dto(kind: CityFortificationKind) -> (FortKind, Option<VmTowerMaterial>) {
    match kind {
        CityFortificationKind::None => (FortKind::None, None),
        CityFortificationKind::Palisada => (FortKind::Palisada, Some(VmTowerMaterial::Drewno)),
        CityFortificationKind::Mur => (FortKind::Mur, Some(VmTowerMaterial::Kamien)),
    }
}

/// `rosterToBattleUnits(atkRosterRef, 0xffd54a)` (`main.ts:36981`).
pub const SIEGE_ATTACKER_COLOR: u32 = 0x00ff_d54a;
/// `rosterToBattleUnits(defRosterRef, 0xc84040)` (`main.ts:36982`).
pub const SIEGE_DEFENDER_COLOR: u32 = 0x00c8_4040;

/// D-1I6-SETUP: producent [`BattleSetupDto`] sceny szturmu — stan `new BattleScene(opts)` przed `bs.play`
/// (`main.ts:36980-37019`): pole T5a (`grid`, `desertPalette`), mur (`siege_wall_civ`: `(opts.siege.defCiv ??
/// opts.siege.civ) ?? 'rzym'`, `battleScene.ts:3480`; ścieżka szturmu podaje tylko `defCiv`), `fortKind` +
/// `towerMaterialFor` + `towerRows`, jednostki w kolejności spawnu `this.atk`, `this.def` (`_placeUnits`) z pozycją,
/// kierunkiem, koroną muru, HP, morale i amunicją z rozstawienia (po `_applyStartingMoralePowerPenalty`, jak ramka),
/// `kategoria`, `String(stats.Jednostka ?? nazwa)`, `maxHp`, `moraleMax`, `ammoMax = ammoCount(bu)` i kolorem strony;
/// `deploy: atkRosterRef.some(u => u.isGeneral)` ze stroną `deployPlayerSide: 'atk'`.
///
/// `s` = sesja po [`SiegeBattleSession::prepare`] (przed `play`).
///
/// # Errors
/// [`SiegeBattleError::Producer`] (sesja po `play`, niespójna ramka, brak jednostki rosteru, NaN/Inf), błąd adaptera.
pub fn battle_setup(
    s: &SiegeBattleSession,
    battle: &ActiveSiegeBattle,
    data: &SessionData,
) -> Result<BattleSetupDto, SiegeBattleError> {
    let bad = |m: String| SiegeBattleError::Producer(format!("scena startu: {m}"));
    if s.phase() != SessionPhase::Prepared {
        return Err(bad(format!(
            "sesja w fazie {:?}, oczekiwano Prepared",
            s.phase()
        )));
    }
    let frame = session_frame(s)?;
    let bus = scene_battle_units(&battle.start_state, &battle.input, data)?;
    let lp = s.battle_loop();
    let body = &lp.env.body;
    let ids = s.roster_ids();
    let mut frame_units = frame.units.iter();
    let mut units = Vec::with_capacity(frame.units.len());
    for (si, list, side, color) in [
        (0usize, &lp.st.atk, VmBattleSide::Atk, SIEGE_ATTACKER_COLOR),
        (1, &lp.st.def, VmBattleSide::Def, SIEGE_DEFENDER_COLOR),
    ] {
        for (i, u) in list.iter().enumerate() {
            let fu = frame_units
                .next()
                .ok_or_else(|| bad(format!("ramka bez jednostki {}", u.id)))?;
            if fu.id.get() != u.id {
                return Err(bad(format!("ramka: {} zamiast {}", fu.id.get(), u.id)));
            }
            let rid = ids[si]
                .get(i)
                .ok_or_else(|| bad(format!("brak id rosteru jednostki {}", u.id)))?;
            let bu = bus
                .get(&(si, rid.clone()))
                .ok_or_else(|| bad(format!("brak BattleUnit rosteru {rid}")))?;
            let morale_max = body.morale_max[si]
                .get(i)
                .copied()
                .ok_or_else(|| bad(format!("brak moraleMax jednostki {}", u.id)))?;
            let ammo_max = bu.ammo_count();
            for (what, v) in [
                ("hp", fu.hp),
                ("maxHp", bu.max_hp),
                ("morale", fu.morale),
                ("moraleMax", morale_max),
            ] {
                if !v.is_finite() {
                    return Err(bad(format!("{what} jednostki {} = {v}", u.id)));
                }
            }
            units.push(BattleUnitSpawnDto {
                id: fu.id,
                side,
                category: bu.kategoria.clone(),
                model_name: bu
                    .setup_unit()
                    .jednostka
                    .unwrap_or_else(|| bu.nazwa.clone()),
                owner_color: color,
                col: fu.col,
                row: fu.row,
                facing: fu.facing,
                on_wall_walkway: fu.on_wall_walkway,
                hp: fu.hp,
                max_hp: bu.max_hp,
                morale: fu.morale,
                morale_max,
                ammo_left: fu.ammo_left,
                ammo_max: ammo_max.is_finite().then_some(ammo_max),
            });
        }
    }
    if let Some(extra) = frame_units.next() {
        return Err(bad(format!(
            "ramka z nadmiarową jednostką {}",
            extra.id.get()
        )));
    }
    let field = s.field();
    let siege = field
        .siege
        .as_ref()
        .ok_or_else(|| bad("pole bez muru".to_owned()))?;
    let (kind, tower_material) = fort_dto(siege.fort_kind);
    let tower_rows = siege
        .tower_rows
        .iter()
        .map(|r| i32::try_from(*r).map_err(|_| bad(format!("wiersz wieży {r}"))))
        .collect::<Result<Vec<_>, _>>()?;
    Ok(BattleSetupDto {
        grid: BattleGridDto {
            cols: field.map.cols(),
            rows: field.map.rows(),
            tiles: field.map.tiles().to_vec(),
        },
        desert_palette: field.desert_palette,
        siege: true,
        deploy: battle
            .atk_roster
            .iter()
            .any(|u| u.is_general)
            .then_some(VmBattleSide::Atk),
        siege_civ: battle
            .input
            .def_civ
            .clone()
            .unwrap_or_else(|| "rzym".to_owned()),
        player_side: VmBattleSide::Atk,
        units,
        fort: BattleFortDto {
            kind,
            tower_material,
            tower_rows,
        },
    })
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
    let out = payload(&s, battle.city_id, &mut battle.pending, &rep.actions, false);
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
    let out = payload(&s, battle.city_id, &mut battle.pending, &rep.actions, false);
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
/// `:411-429`, gałąź zwycięzcy `:443-463`, punkt ruchu `:465`), `validateActiveSieges` (`main.ts:34744`), `afterSiegeUi`
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

    // `if (mapWinner === 'obronca') selectedId = null` (`main.ts:34713`).
    if winner == LoopWinner::Defender {
        state.selected_unit_id = None;
        for u in &mut state.units {
            u.selected = false;
        }
    }

    // `validateActiveSieges` (`main.ts:18019-18037`) dla szturmowanego miasta: oblegający = właściciel kotwicy (pin
    // `ctx.oblegajacyOwnerId === 0`, `:36800`). Pozostałe miasta: stan nie niesie `oblegajacyOwnerId` (raport).
    let besieger = battle.atk_roster.first().map_or(-1, |u| u.owner_id);
    let mut siege_ended = validate_storm_siege(state, cid, besieger);
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
        capture: None,
        removed_unit_ids: removed,
        hp: hp_set,
        consumed_machines,
        siege_ended,
    })
}

/// `endMapSiege(cityId)` (`main.ts:17880-17899`) w zakresie stanu: `oblegane = false`, `clearSiegeMachines(city)`.
/// Pola `oblegajacyOwnerId`, `siegeArmyGroupId`, `siegeCapitulationPending`, `oblegaCityId`, liczniki tur oblężenia: brak w
/// `PlayableState` (raport).
pub(crate) fn end_map_siege(state: &mut PlayableState, cid: CityId) {
    state.oblegane.remove(&cid);
    state.siege_machines_ready.remove(&cid);
}

/// `validateActiveSieges` (`main.ts:18019-18037`, `isSiegeStillValid`) dla szturmowanego miasta `cid` z oblegającym
/// `besieger`: oblężenie trwa, gdy miasto jest oblegane, para jest w wojnie i jednostka oblegającego stoi w odległości
/// 1 od miasta; inaczej `endMapSiege`. Zwraca `true`, gdy oblężenie zostało tu zakończone. Miasto nieoblegane albo
/// nieistniejące = `false` (brak zmiany).
pub(crate) fn validate_storm_siege(state: &mut PlayableState, cid: CityId, besieger: i64) -> bool {
    if !state.oblegane.contains(&cid) {
        return false;
    }
    let Some(city) = state.cities.iter().find(|c| c.id == cid) else {
        return false;
    };
    let hex = (i32::from(city.position.x()), i32::from(city.position.y()));
    let at_war = u64::try_from(besieger).ok().is_some_and(|b| {
        state
            .war
            .diplomacy
            .relation(PlayerId::new(b), city.owner_id)
            .is_some_and(|r| r.status == RelationStatus::War)
    });
    let adjacent = state.units.iter().any(|u| {
        owner_i64(u.owner_id) == besieger
            && hex_distance((i32::from(u.position.x()), i32::from(u.position.y())), hex) == 1
    });
    if !at_war || !adjacent {
        end_map_siege(state, cid);
        return true;
    }
    false
}

/// Wynik wejścia na heks miasta po wygranej atakującego (`post-battle-map.ts:445-448`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub(crate) struct AtkWinEntry {
    /// `wipeDefenderOnCityCenter` (`:191-199`): obrońcy rosteru na centrum miasta, kolejność rosteru.
    pub removed: Vec<u64>,
    /// `moveAtkRosterOntoBattleHex` (`:357-378`): jednostki, które weszły na heks bitwy, kolejność rosteru.
    pub moved: Vec<u64>,
}

/// D-WIRB-3 / #354 (D-ZMA-1): część `applyPostBattleMap` dla wygranej atakującego z wyłomem, którą część B oddała
/// hakowi T8 — `wipeDefenderOnCityCenter` (`post-battle-map.ts:191-199`), `retreatDefendersAfterAtkWin` (`:331-340`),
/// `moveAtkRosterOntoBattleHex` (`:357-378`, z `syncStackRuchLeft` = minimum, `armyMerge.ts:1158-1162`, `:908-911`).
/// [`apply_outcome`] wykonał już `spendAttackMpOnLive` (`:392-402`); kolejność jest obojętna, bo `max(0, min - 1)` =
/// `min(max(0, a - 1), …)` (operacje monotoniczne), a `spendAttackMpOnLive` nie czyta pozycji.
///
/// # Errors
/// [`SiegeBattleError::CityNotFound`].
pub(crate) fn enter_city_hex_after_atk_win(
    state: &mut PlayableState,
    battle: &ApplyRosters<'_>,
) -> Result<AtkWinEntry, SiegeBattleError> {
    let cid = CityId::new(battle.city_id);
    let city = state
        .cities
        .iter()
        .find(|c| c.id == cid)
        .ok_or(SiegeBattleError::CityNotFound(battle.city_id))?;
    let hex = (i32::from(city.position.x()), i32::from(city.position.y()));
    let mut out = AtkWinEntry::default();
    // `wipeDefenderOnCityCenter`: obiekt rosteru = żywa jednostka (pozycja bieżąca); jednostka usunięta / wirtualna
    // = `removeUnitById` bez skutku.
    for u in battle.def_roster {
        if let Some(i) = unit_index(state, &u.id) {
            let p = (
                i32::from(state.units[i].position.x()),
                i32::from(state.units[i].position.y()),
            );
            if p == hex {
                remove_unit(state, &u.id, &mut out.removed);
            }
        }
    }
    // `retreatDefendersAfterAtkWin`: ocalali obrońcy fan-out od atakujących (centrum miasta pomijane).
    let mut rp = RosterPos {
        pos: battle
            .atk_roster
            .iter()
            .chain(battle.def_roster.iter())
            .map(|u| (u.id.clone(), pos_of(u)))
            .collect(),
    };
    let def_alive: Vec<RosterUnit> = live(state, battle.def_roster)
        .into_iter()
        .cloned()
        .collect();
    let lead = def_alive
        .iter()
        .find(|u| {
            unit_index(state, &u.id).is_some_and(|i| {
                (
                    i32::from(state.units[i].position.x()),
                    i32::from(state.units[i].position.y()),
                ) == hex
            })
        })
        .or_else(|| def_alive.first())
        .map(|u| u.id.clone());
    if let Some(lead) = lead {
        let dir = pick_retreat_target(state, hex, rp.centroid(battle.atk_roster), true);
        place_fan_out_group(state, &mut rp, &def_alive, &lead, hex, dir, Some(hex));
    }
    // `moveAtkRosterOntoBattleHex`: kotwica i jednostki ze startowego heksu kotwicy (bez cywilów poza kotwicą).
    let anchor_id = battle.anchor_unit_id.to_string();
    let anchor_start = battle
        .atk_roster
        .iter()
        .find(|u| u.id == anchor_id)
        .map(pos_of);
    let mut moved_idx = Vec::new();
    for r in live(state, battle.atk_roster) {
        if is_civilian_unit(&r.category, &r.type_id) && r.id != anchor_id {
            continue;
        }
        let on_anchor_start = r.id == anchor_id || anchor_start == Some(pos_of(r));
        if !on_anchor_start {
            continue;
        }
        if let Some(i) = unit_index(state, &r.id) {
            #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
            {
                state.units[i].position = PositionDto::new(hex.0 as u16, hex.1 as u16);
            }
            out.moved.push(state.units[i].id.get());
            moved_idx.push(i);
        }
    }
    if moved_idx.len() > 1 {
        let min = moved_idx
            .iter()
            .map(|&i| f64::from(state.units[i].movement))
            .fold(f64::INFINITY, f64::min);
        for &i in &moved_idx {
            state.units[i].movement = MovementPoints::new(min);
        }
    }
    Ok(out)
}

/// `FinishSiegeBattle`: wynik sesji + zastosowanie do stanu.
///
/// # Errors
/// [`SiegeBattleError::Session`] (`NotFinished`), [`SiegeBattleError::Producer`].
pub fn finish(
    state: &mut PlayableState,
    battle: &ActiveSiegeBattle,
) -> Result<SiegeBattlePayload, SiegeBattleError> {
    // D-1I6D-3: porzucenie przed wynikiem (także bitwy trwającej): brak zastosowania, stan bez zmian.
    if battle.abort_requested.swap(false, Ordering::Relaxed) {
        return Err(SiegeBattleError::AbortRequested);
    }
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
    let mut result = apply_outcome(state, &rosters, &outcome, &ids)?;
    // #354 (D-ZMA-2): konsument haka T8 w tej samej komendzie — w pinie zdobycie jest częścią
    // `finishSiegeStormBattle` → `applyMapBattleOutcome` (`main.ts:34646-34744`).
    if let Some(req) = result.capture_requested.clone() {
        let capture =
            crate::domain::city_capture_apply::apply_storm_capture(state, &rosters, &req)?;
        result.siege_ended = result.siege_ended || capture.siege_ended;
        result.capture = Some(capture);
    }
    // D-WIRB-6: akcje wstrzymane z `t0` za ostatnią ramką (koniec bitwy przed końcem animacji marszu), po `t0`.
    let mut rest = battle.pending.clone();
    sort_by_t0(&mut rest);
    Ok(SiegeBattlePayload {
        city_id: battle.city_id,
        phase: SiegeBattlePhaseDto::Applied,
        units: Vec::new(),
        actions: rest,
        frame: None,
        result: Some(result),
        setup: None,
        tower_shooter: None,
    })
}

/// Id jednostki stanu z dziesiętnego id rosteru (`None` = jednostka wirtualna: milicja, machina).
#[must_use]
pub fn state_unit_id(roster_id: &str) -> Option<UnitId> {
    roster_id.parse::<u64>().ok().map(UnitId::new)
}
