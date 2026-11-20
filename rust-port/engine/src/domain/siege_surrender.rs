//! R-RUSTPORT-P6-SIEGE-SURRENDER-Q1 (W8 podzial 3/3): kapitulacja oblezenia - czesc decyzyjna i skutki stanu miasta.
//!
//! Port czystych fragmentow webowych (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, `gra/src/main.ts`):
//! * [`besieger_owner_for_city`] = `besiegerOwnerForCity` (main.ts:17634-17644);
//! * [`handle_siege_capitulation_phase`] = `handleSiegeCapitulationPhase` (main.ts:17646-17660);
//! * [`surrender_tick_action`] = lacznik decyzja ticka -> akcja (web main.ts:38864-38868, PRZED licznikiem tur);
//! * [`resolve_surrender_path`] = galezie `resolveSiegeSurrender` (main.ts:17662-17672, 17702-17707, 17869-17877);
//! * [`transfer_removal_ids`] = usuniecie obroncow starego wlasciciela z heksu miasta (main.ts:17787-17790);
//! * [`end_map_siege_fields`] = pola miasta gaszone przez `endMapSiege` (main.ts:17880-17893);
//! * [`surrender_population_after`] = `city.population = Math.max(1, city.population)` (main.ts po splice).
//!
//! Wejscie garnizonu do miasta po kapitulacji NIE jest tu powielane - lezy w `siege_enter_city.rs`
//! ([`crate::domain::siege_enter_city::enter_city_after_surrender`]); kolejnosc (usuniecie obroncow -> wejscie) jest
//! po stronie wolajacego.
//!
//! ## Skutki przejecia w `resolveSiegeSurrender` (galaz `newOwner`) - tabela stanu (obrona r2)
//!
//! Stan zweryfikowany grepem po `rust-port/engine/src` w tym commicie. "ISTNIEJE" = modul w Rust, ale NIE
//! podpiety tu; zgodnosc semantyczna z web NIE zweryfikowana w tym temacie. "BRAK" = nazwa nie znaleziona.
//!
//! | web (main.ts)                                  | Rust                                                        | stan |
//! |------------------------------------------------|-------------------------------------------------------------|------|
//! | besiegerOwnerForCity (17634)                   | [`besieger_owner_for_city`] (ten modul)                     | PORT |
//! | handleSiegeCapitulationPhase (17646)           | [`handle_siege_capitulation_phase`] (ten modul)             | PORT |
//! | splice obroncow starego wlasciciela (~17787)   | [`transfer_removal_ids`] (ten modul)                        | PORT |
//! | enterCityAfterSurrender                        | `siege_enter_city::enter_city_after_surrender`              | ISTNIEJE |
//! | sanitizeBuildQueue (production.ts)             | `production_queue::sanitize_build_queue`                    | ISTNIEJE |
//! | filterQueue                                    | `production_queue::filter_queue`                            | ISTNIEJE |
//! | clearCityStateFlagOnCapture (state)            | `state::clear_city_state_flag_on_capture`                   | ISTNIEJE |
//! | applyPostCaptureLawOnCapture                   | `siege_transfer_effects::apply_post_capture_law_on_capture` (wolany przez `apply_transfer_with_effects`) | ISTNIEJE |
//! | triggerRebelProtectionWarConsequence           | `siege_transfer_effects::rebel_protection_war_request` (zwraca zadanie wojny; deklaracja po stronie wolajacego) | ISTNIEJE |
//! | recordWarCityLossForPair                       | `diplomacy_war_peace_profile::record_war_city_loss`         | ISTNIEJE |
//! | maybeResolveRegularWarOnCityCapture            | `war_turn_declare::register_regular_war_city_loss` (wymaga WarTurnState) | ISTNIEJE |
//! | seedCityOwnerDefaults                          | `turn_economy_inputs_podzial::seed_city_owner_defaults_podzial` (wariant dla innych typow wejsc) | ISTNIEJE |
//! | siegeDefenderUnits (siege-starvation.ts)       | `siege_starvation::siege_defender_units` (inny zbior: nie splice) | ISTNIEJE |
//! | applyCapturePopulationLoss                     | `siege_transfer_effects::apply_capture_population_loss` (wolany przez `apply_transfer_with_effects` gdy `TransferExtras::pop_loss` = Some) | ISTNIEJE |
//! | beginWonderTransferWatch / settleWonderTransfer| wrapper: brak; rdzen planu w `siege_wonder_watch` (Q8)      | BRAK (wrapper) |
//! | noteCityCapture                                | `siege_transfer_q5::note_city_capture`                      | ISTNIEJE (Q5) |
//! | runCapitalCapturePlunder                       | `siege_capital_plunder::run_capital_capture_plunder` (Q6)   | PORT |
//! | recordCityCaptureEvent                         | `siege_capture_events::CaptureEventStore::record_city_capture_event` (Q7) | PORT |
//! | capturePopLossReportRow                        | nazwa nie wystepuje w `src`; `TRANSFER_EFFECTS` = Ui (siege_transfer.rs) | UI (poza domena) |
//! | applyLiveSafeRationForCity                     | `siege_transfer_q5::apply_live_safe_ration_for_city` (czesc decyzyjna; wolany PO `endMapSiege`) | ISTNIEJE (Q5) |
//! | foundedByOwner (pole miasta, ustawiane warunkowo) | pole `siege_transfer::TransferCity::found_by_owner`: `Some(false)` ustawiane w `apply_transfer_with_effects` (siege_transfer.rs); stamp `foundedBy` (warunek na `found_by_owner`) w `siege_transfer_effects::apply_capture_population_loss` | ISTNIEJE |
//! | showHintMessage (UI)                           | poza domena Rust                                            | N/D |
//!
//! Wniosek: galaz przejecia jest zlozona w `siege_transfer::apply_transfer_with_effects` (siege_transfer.rs), ale jej
//! wolajacy (podpiecie `resolveSiegeSurrender` z efektami, W8) NIE jest jeszcze w `src`. BRAK po tej weryfikacji: wrapper
//! `beginWonderTransferWatch`/`settleWonderTransfer`. `capturePopLossReportRow` jest poza domena (UI, Ui w `TRANSFER_EFFECTS`).
//!
//! Zalozenia (do akceptacji, brak w dispatchu):
//! * Z-SU-1 `besieger` = `None` odpowiada web `null` (brak oblegajacego); identyfikatory wlascicieli to `i64`.
//! * Z-SU-2 `are_enemy(a, b)` jest wstrzykiwane jako closure i wolane WYLACZNIE, gdy web wola `areEnemyOwners`
//!   (zmiana wlasciciela); brak zmiany wlasciciela nie wywoluje closure. Wektory generuje wykonanie pinu (log wywolan).
//! * Z-SU-3 `food`, `pop` to `f64`; `NaN` przechodzi jak w JS (`NaN <= 0` = false; `Math.max(1, NaN)` = NaN).
//! * Z-SU-4 wspolrzedne heksowe `i64` (web: liczby calkowite w danych gry, `hexDistance` zgodny z `max(|dq|,|dr|,|ds|)`).

use std::collections::HashMap;
use std::sync::OnceLock;

use crate::data::units_combat::parse_units;
use crate::domain::city_capture_apply::{apply_siege_capitulation, SiegeCapitulation};
use crate::domain::city_growth::p6_7a::{empire_food::build_empire_food_params, GameDifficulty};
use crate::domain::playable::PlayableState;
use crate::domain::playable_movement::ruch_jednostka_of;
use crate::domain::siege_battle_adapter::is_civilian_unit;
use crate::domain::siege_battle_apply::SiegeBattleError;
use crate::domain::siege_enter_city::EnterCity;
use crate::domain::siege_enter_city::EnterUnit;
use crate::domain::siege_starvation::{SiegeGarrisonUnit, SiegeStarvationCity};
use crate::domain::siege_turn::{siege_city_turn, SiegeTurnDecision};
use crate::domain::turn_economy_attrition::{apply_army_starvation_hp_loss, AttritionUnit};
use crate::domain::unit_health::unit_health;
use crate::domain::{CityId, PlayerId, PositionDto, UnitId};

/// Miasto widziane przez `besiegerOwnerForCity`: wlasciciel, heks i (opcjonalnie) `oblegajacyOwnerId`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BesiegerCity {
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
    /// Web `city.oblegajacyOwnerId` (`None` = pole nieustawione, `undefined` w JS).
    pub oblegajacy_owner_id: Option<i64>,
}

/// Jednostka widziana przez `besiegerOwnerForCity` (wlasciciel i heks).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct BesiegerUnit {
    pub owner_id: i64,
    pub q: i64,
    pub r: i64,
}

/// Web `hexDistance` (`units/setup.ts:361`): `max(|dq|, |dr|, |ds|)`, `ds = (-aq-ar) - (-bq-br)`.
fn hex_distance(aq: i64, ar: i64, bq: i64, br: i64) -> i64 {
    let dq = (aq - bq).abs();
    let dr = (ar - br).abs();
    let ds = ((-aq - ar) - (-bq - br)).abs();
    dq.max(dr).max(ds)
}

/// Web `besiegerOwnerForCity(city)`: 1) `oblegajacyOwnerId`, 2) `siegeBesiegerByCity`, 3) pierwszy obcy wlasciciel
/// jednostki w odleglosci 1 od miasta (kolejnosc wejscia `units`). `stored` = wpis `siegeBesiegerByCity.get(city.id)`.
pub fn besieger_owner_for_city(
    city: &BesiegerCity,
    stored: Option<i64>,
    units: &[BesiegerUnit],
) -> Option<i64> {
    if let Some(owner) = city.oblegajacy_owner_id {
        return Some(owner);
    }
    if let Some(owner) = stored {
        return Some(owner);
    }
    units
        .iter()
        .find(|u| u.owner_id != city.owner_id && hex_distance(u.q, u.r, city.q, city.r) == 1)
        .map(|u| u.owner_id)
}

/// Web `handleSiegeCapitulationPhase`: co zrobic z miastem w fazie kapitulacji (bez skutkow ubocznych).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CapitulationAction {
    /// Web `city.siegeCapitulationPending` = true -> `resolveSiegeSurrender(city.id)`.
    Resolve,
    /// Web zapasy <= 0 przy pustej fladze -> `city.siegeCapitulationPending = true` (+ alert, sync panelu).
    SetPending,
    /// Web brak zmian (zapasy > 0, flaga pusta).
    Hold,
}

/// Web `handleSiegeCapitulationPhase(city)`. `food` = web `getCityFood(city)`.
pub fn handle_siege_capitulation_phase(pending: bool, food: f64) -> CapitulationAction {
    if pending {
        CapitulationAction::Resolve
    } else if food <= 0.0 {
        CapitulationAction::SetPending
    } else {
        CapitulationAction::Hold
    }
}

/// Akcja wybrana przez lacznik ticka oblezenia (web main.ts:38864-38868).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SurrenderTickAction {
    /// Brak decyzji o kapitulacji w tym ticku.
    None,
    /// Web `if (st0.setLegacyPending) handleSiegeCapitulationPhase(oblCity)`.
    CapitulationPhase(CapitulationAction),
    /// Web `else if (surrenderNow) resolveSiegeSurrender(oblCity.id)`.
    Surrender,
}

/// Lacznik: decyzja [`siege_city_turn`](crate::domain::siege_turn::siege_city_turn) -> akcja kapitulacji.
/// Wolac DOKLADNIE w tym miejscu: po decyzji, PRZED `next_siege_turn` (web: `siegeTurnByCity.set(...)` po bloku).
/// `pending` = `city.siegeCapitulationPending`, `food` = `getCityFood(city)` w chwili wywolania.
pub fn surrender_tick_action(
    dec: &SiegeTurnDecision,
    pending: bool,
    food: f64,
) -> SurrenderTickAction {
    if dec.legacy_pending {
        SurrenderTickAction::CapitulationPhase(handle_siege_capitulation_phase(pending, food))
    } else if dec.surrender {
        SurrenderTickAction::Surrender
    } else {
        SurrenderTickAction::None
    }
}

/// Galaz wykonania `resolveSiegeSurrender`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SurrenderPath {
    /// Web: miasta nie ma w `cities` -> tylko `endMapSiege` (bez skutkow w miescie).
    NoCity,
    /// Web: `newOwner` rozni sie od wlasciciela, ale nie sa wrogami (np. pokoj) -> `endMapSiege` i `return`.
    NotEnemy,
    /// Web: brak oblegajacego albo ten sam wlasciciel -> komunikat "oblezenie zakonczone bez przejecia" i `endMapSiege`.
    NoCaptor,
    /// Web: przejecie miasta przez oblegajacego (pelna galaz, patrz tabela stanu w naglowku).
    Transfer,
}

/// Galezie `resolveSiegeSurrender` bez efektow ubocznych. `are_enemy(newOwner, oldOwner)` wolane tylko przy zmianie wlasciciela.
pub fn resolve_surrender_path(
    city_found: bool,
    city_owner: i64,
    besieger: Option<i64>,
    are_enemy: &dyn Fn(i64, i64) -> bool,
) -> SurrenderPath {
    if !city_found {
        return SurrenderPath::NoCity;
    }
    match besieger {
        Some(new_owner) if new_owner != city_owner => {
            if are_enemy(new_owner, city_owner) {
                SurrenderPath::Transfer
            } else {
                SurrenderPath::NotEnemy
            }
        }
        _ => SurrenderPath::NoCaptor,
    }
}

/// Id jednostek usuwanych z heksu miasta przy przejeciu (web: `units.splice` dla `u.q/u.r == city` i `u.ownerId == oldOwner`).
/// Zwraca w kolejnosci wejscia; zbior usunietych jest identyczny jak u web (petla wsteczna).
pub fn transfer_removal_ids(units: &[EnterUnit], city: &EnterCity, old_owner: i64) -> Vec<String> {
    units
        .iter()
        .filter(|u| u.q == city.q && u.r == city.r && u.owner_id == old_owner)
        .map(|u| u.id.clone())
        .collect()
}

/// Web `endMapSiege` - pola miasta czytane przez decyzje glodu. Ustawia `oblegane=false`, zeruje flage kapitulacji
/// i start maxHP (`delete siegeStarveStartMaxHp`). Pozostale pola (oblegajacy, grupa armii, maszyny) poza zakresem.
///
/// Uwaga (obrona r2, zarzut 7): web czyta te pola przez prawdziwosc (`!city.oblegane`, `city.siegeCapitulationPending`)
/// albo `=== true` (`cities.filter(c => c.oblegane === true)`); Rust czyta je przez `== Some(true)`, `!= Some(true)`
/// i `filter(> 0)`. Zatem `Some(false)` i `None` (web `undefined` po `delete`) sa dla wszystkich czytelnikow rownowazne.
pub fn end_map_siege_fields(city: &mut SiegeStarvationCity) {
    city.oblegane = Some(false);
    city.siege_capitulation_pending = Some(false);
    city.siege_starve_start_max_hp = None;
}

/// Web `city.population = Math.max(1, city.population)` po przejeciu.
pub fn surrender_population_after(pop: f64) -> f64 {
    if pop.is_nan() {
        f64::NAN
    } else {
        pop.max(1.0)
    }
}

// ---------------------------------------------------------------------------------------------------------------
// R-RUSTPORT-P6-KAPITULACJA-Q1 (W3): produkcyjny tick oblezenia (`advance_turn`, faza Economy) na `PlayableState`.
// ---------------------------------------------------------------------------------------------------------------

/// Pola web `City` czytane i pisane przez tick oblezenia / kapitulacje, ktorych `PlayableCity` nie niesie
/// (pin `game/cities.ts`: `oblegajacyOwnerId`, `siegeCapitulationPending`, `siegeStarveStartMaxHp`, `magazynZywnosci`).
/// Trzymane obok `PlayableCity` (wzorzec `oblegane` / `captured_from_owner_by_city`). Wartosci liczbowe w stanie sa
/// zawsze skonczone (zapis przez tick; `NaN`/`Inf` nie przychodza z JSON), stad reczne `Eq`.
#[derive(Debug, Clone, Copy, PartialEq, Default, serde::Serialize, serde::Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub struct PlayableCitySiege {
    /// Web `city.oblegajacyOwnerId` (`None` = `undefined`, `delete` w `endMapSiege`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub oblegajacy_owner_id: Option<PlayerId>,
    /// Web `city.siegeCapitulationPending` (`false` = pole falsy).
    #[serde(skip_serializing_if = "std::ops::Not::not")]
    pub siege_capitulation_pending: bool,
    /// Web `city.siegeStarveStartMaxHp` (`None` = `undefined`).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub siege_starve_start_max_hp: Option<f64>,
    /// Web `city.magazynZywnosci` jako liczba (`None` = brak pola; `getCityFood` = `max(0, v)` albo 0).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub magazyn_zywnosci: Option<f64>,
}

impl Eq for PlayableCitySiege {}

impl PlayableCitySiege {
    #[must_use]
    pub fn is_default(&self) -> bool {
        *self == Self::default()
    }

    /// Web `endMapSiege` (`main.ts:17880-17886`): `delete oblegajacyOwnerId`, `siegeCapitulationPending = false`,
    /// `delete siegeStarveStartMaxHp`. `magazynZywnosci` (pole miasta, nie oblezenia) zostaje.
    pub fn end_siege(&mut self) {
        self.oblegajacy_owner_id = None;
        self.siege_capitulation_pending = false;
        self.siege_starve_start_max_hp = None;
    }
}

/// Web `getCityFood(city)` = `readCityFoodBuffer(city.magazynZywnosci)` (`turn-economy.ts:1053`, `:1093`): liczba
/// skonczona -> `Math.max(0, v)`, brak pola -> 0.
#[must_use]
pub fn city_food_of(fields: Option<&PlayableCitySiege>) -> f64 {
    match fields.and_then(|f| f.magazyn_zywnosci) {
        Some(v) if v.is_finite() => v.max(0.0),
        _ => 0.0,
    }
}

/// Wpis raportu ticka oblezenia jednego miasta (kolejnosc = kolejnosc `cities`).
#[derive(Debug, Clone, PartialEq)]
pub struct SiegeTickEntry {
    pub city_id: CityId,
    /// Decyzja `siegeStarvationState` + atrycja (web `st0` / `surrenderNow`).
    pub decision: SiegeTurnDecision,
    /// Akcja kapitulacji wybrana w tym ticku (web `main.ts:38864-38868`).
    pub action: SurrenderTickAction,
    /// Jednostki garnizonu zniszczone atrycja glodu (`starv.destroyedIds`, kolejnosc `units`).
    pub destroyed_unit_ids: Vec<u64>,
    /// Wynik `resolveSiegeSurrender`, gdy wywolane.
    pub capitulation: Option<SiegeCapitulation>,
}

/// Raport ticka oblezenia (`advance_turn`, faza Economy).
#[derive(Debug, Clone, PartialEq, Default)]
pub struct SiegeTickReport {
    pub entries: Vec<SiegeTickEntry>,
    /// Obrona r1 (Z4, D-KAP-3 r2): blad `resolveSiegeSurrender` przerywajacy petle miast — pin lapie wyjatek bloku N3
    /// (`try { for (const tick of econ.perCity) ... } catch (errSiege) { console.error(...) }`, `main.ts:38809-38872`),
    /// wiec pozostale miasta w tym ticku NIE sa przetwarzane, a tura trwa dalej. `(miasto, tresc bledu)`.
    pub error: Option<(CityId, String)>,
}

/// Obrona r1 (Z4): faza tury, w ktorej `advance_turn` wykonuje blok N3 (pin: `runWorldEndTurn`, N3 PO ticku ekonomii
/// `main.ts:38808`; decyzja wlasciciela W8 r7 Q2 = kolejnosc jak pin: dyplomacja -> ekonomia+oblezenie).
pub const SIEGE_TICK_PHASE: crate::domain::events::TurnPhase =
    crate::domain::events::TurnPhase::Economy;

fn econ_params_raw() -> &'static serde_json::Value {
    static RAW: OnceLock<serde_json::Value> = OnceLock::new();
    RAW.get_or_init(|| {
        serde_json::from_str(include_str!("../../data/econ-params.json"))
            .expect("econ-params.json must parse")
    })
}

fn units_max_hp_by_type() -> &'static HashMap<String, f64> {
    static M: OnceLock<HashMap<String, f64>> = OnceLock::new();
    M.get_or_init(|| {
        let mut m = HashMap::new();
        for u in parse_units().expect("units.json must parse") {
            // `data.units.find(u => u.Jednostka === typeId)`: pierwszy wiersz o danej nazwie.
            let hp = unit_health(Some(&u));
            m.entry(u.jednostka.clone()).or_insert(hp);
        }
        m
    })
}

/// Web `getMaxHp(typeId)` w N3 (`main.ts:38831`): `unitHealth(data.units.find(u => u.Jednostka === typeId) ?? {})`.
#[must_use]
pub fn siege_unit_max_hp(type_id: &str) -> f64 {
    units_max_hp_by_type()
        .get(type_id)
        .copied()
        .unwrap_or_else(|| unit_health(None))
}

/// Web `glodWojskaHpFrac` (`buildEmpireFoodParams(data.econParams, effectiveGameDifficultyForOwner(owner))`,
/// `main.ts:38817-38820`). D-KAP-4: trudnosc = trudnosc gry ze stanu (miasta-panstwa / `cityStateDifficulty` nie
/// istnieja w `PlayableState`, wiec `effectiveGameDifficultyForOwner` = trudnosc menu dla kazdego wlasciciela).
///
/// # Errors
/// Obrona r1 (Z7): nieznana etykieta trudnosci = blad (jak `replace_difficulty_of` w `playable.rs`), nie cichy
/// `Normal`; tick zapisuje go w [`SiegeTickReport::error`] (pin liczy ulamek pierwszy w petli miasta, `main.ts:38817`).
pub fn glod_wojska_hp_frac(difficulty_label: &str) -> Result<f64, String> {
    let d = match difficulty_label {
        "Normalny" | "normal" => GameDifficulty::Normal,
        "Łatwy" | "easy" => GameDifficulty::Easy,
        "Trudny" | "hard" => GameDifficulty::Hard,
        other => return Err(format!("oblezenie: nieznana trudnosc gry `{other}`")),
    };
    Ok(build_empire_food_params(econ_params_raw(), d).glod_wojska_hp_frac)
}

/// Web `siegeDefenderUnits(units, city, isCivilianUnit)` (`siege-starvation.ts:72-79`) na stanie: indeksy jednostek
/// wlasciciela miasta na heksie miasta, niecywilnych i bez `hp <= 0` (kolejnosc `units`).
fn defender_indices(state: &PlayableState, owner: PlayerId, pos: PositionDto) -> Vec<usize> {
    state
        .units
        .iter()
        .enumerate()
        .filter(|(_, u)| {
            if u.owner_id != owner || u.position != pos {
                return false;
            }
            let rj = ruch_jednostka_of(state, u);
            if is_civilian_unit(&rj.category, rj.type_id.as_deref().unwrap_or("")) {
                return false;
            }
            !matches!(
                state.economy.units.get(&u.id.get()).and_then(|r| r.hp),
                Some(h) if h <= 0.0
            )
        })
        .map(|(i, _)| i)
        .collect()
}

fn garrison_of(state: &PlayableState, idx: &[usize]) -> Vec<SiegeGarrisonUnit> {
    idx.iter()
        .map(|&i| {
            let u = &state.units[i];
            let rep = state.economy.units.get(&u.id.get());
            let rj = ruch_jednostka_of(state, u);
            SiegeGarrisonUnit {
                hp: rep.and_then(|r| r.hp),
                hp_max: rep.and_then(|r| r.hp_max),
                type_id: rj.type_id,
            }
        })
        .collect()
}

/// Atrycja glodu (`main.ts:38842-38856`): `applyArmyStarvationHpLoss(realGarnizonUnits, city.ownerId, frac, getMaxHp)`,
/// zapis `hp`/`hpMax` do `economy.units`, `units.splice` zniszczonych. Zwraca id zniszczonych (kolejnosc `units`).
fn apply_attrition(
    state: &mut PlayableState,
    owner: PlayerId,
    idx: &[usize],
    frac: f64,
) -> Vec<u64> {
    let mut au: Vec<AttritionUnit> = idx
        .iter()
        .map(|&i| {
            let u = &state.units[i];
            let rep = state.economy.units.get(&u.id.get());
            let rj = ruch_jednostka_of(state, u);
            AttritionUnit {
                id: u.id.get().to_string(),
                owner_id: i64::try_from(u.owner_id.get()).unwrap_or(i64::MAX),
                type_id: rj.type_id.unwrap_or_default(),
                category: rj.category,
                hp: rep.and_then(|r| r.hp),
                hp_max: rep.and_then(|r| r.hp_max),
                oblega_city_id: None,
                in_garnizon: false,
                q: f64::from(u.position.x()),
                r: f64::from(u.position.y()),
            }
        })
        .collect();
    let owner_i = i64::try_from(owner.get()).unwrap_or(i64::MAX);
    let res = apply_army_starvation_hp_loss(&mut au, owner_i, frac, &siege_unit_max_hp);
    for a in &au {
        let Ok(uid) = a.id.parse::<u64>() else {
            continue;
        };
        if a.hp.is_some() || a.hp_max.is_some() {
            let e = state.economy.units.entry(uid).or_default();
            e.hp = a.hp;
            e.hp_max = a.hp_max;
        }
    }
    let destroyed: Vec<u64> = res
        .destroyed_ids
        .iter()
        .filter_map(|s| s.parse::<u64>().ok())
        .collect();
    if !destroyed.is_empty() {
        state.units.retain(|u| !destroyed.contains(&u.id.get()));
        for d in &destroyed {
            state.economy.units.remove(d);
            state.oblega_city_by_unit.remove(&UnitId::new(*d));
        }
    }
    destroyed
}

/// Web blok N3 „TURA OBLEZENIA” (`main.ts:38808-38870`, wolany w `runWorldEndTurn` po ticku ekonomii) na stanie:
/// dla kazdego obleganego miasta (kolejnosc `cities`) decyzja glodu
/// [`siege_city_turn`](crate::domain::siege_turn::siege_city_turn), atrycja, zapis startu glodu, potem
/// [`surrender_tick_action`]: flaga kapitulacji albo `resolveSiegeSurrender` ([`apply_siege_capitulation`]).
///
/// Decyzje (raport `01-operator-r1.md`): D-KAP-2 zapas = `getCityFood` (Rust nie wykonuje ticka ekonomii, wiec
/// `tick.obleganyGlod` = false i `tick.magazynPoTurze` = `undefined`); D-KAP-5 pola oblezenia miasta, ktore nie jest juz
/// oblegane (oblezenie zakonczone sciezka bez [`PlayableCitySiege::end_siege`], np. `validate_storm_siege`), sa
/// gaszone na starcie ticka tak, jak zrobilby to `endMapSiege` pinu. `siegeTurnByCity`, `tickSiegeMachinesForCity`,
/// `maybeAiAssaultAfterMachines` i panel UI: poza zakresem (raport, dlugi).
///
/// Blad kapitulacji (D-KAP-3 r2, semantyka pinu `try/catch` bloku N3, `main.ts:38809-38872`): petla miast konczy sie
/// na miescie z bledem, miasta przetworzone wczesniej (i atrycja/start glodu tego miasta) ZOSTAJA, a skutki samej
/// kapitulacji tego miasta sa cofniete w calosci (kapitulacja liczona na kopii stanu; pin zostawilby polowiczne
/// mutacje sprzed wyjatku — Rust ich nie odtwarza, D-KAP-3). Blad trafia do [`SiegeTickReport::error`]; wolajacy
/// (`advance_turn`) loguje go i kontynuuje ture jak pin (`console.error`).
pub fn run_siege_turn(state: &mut PlayableState) -> SiegeTickReport {
    // D-KAP-5: pola oblezenia miast nieoblezanych = stan po `endMapSiege`.
    let stale: Vec<CityId> = state
        .siege_city
        .keys()
        .filter(|c| !state.oblegane.contains(c))
        .copied()
        .collect();
    for c in stale {
        if let Some(f) = state.siege_city.get_mut(&c) {
            f.end_siege();
            if f.is_default() {
                state.siege_city.remove(&c);
            }
        }
    }
    let besieged: Vec<CityId> = state
        .cities
        .iter()
        .filter(|c| state.oblegane.contains(&c.id))
        .map(|c| c.id)
        .collect();
    let mut report = SiegeTickReport::default();
    for cid in besieged {
        let Some(city) = state.cities.iter().find(|c| c.id == cid).cloned() else {
            continue;
        };
        let frac = match glod_wojska_hp_frac(&state.params.difficulty) {
            Ok(f) => f,
            Err(e) => {
                report.error = Some((cid, e));
                break;
            }
        };
        let fields = state.siege_city.get(&cid).copied().unwrap_or_default();
        let food = city_food_of(Some(&fields));
        let idx = defender_indices(state, city.owner_id, city.position);
        let garrison = garrison_of(state, &idx);
        let starv_city = SiegeStarvationCity {
            oblegane: Some(true),
            siege_capitulation_pending: Some(fields.siege_capitulation_pending),
            siege_starve_start_max_hp: fields.siege_starve_start_max_hp,
        };
        let mut destroyed: Vec<u64> = Vec::new();
        let dec = {
            let st = &mut *state;
            let destroyed_ref = &mut destroyed;
            siege_city_turn(&starv_city, &garrison, food, &siege_unit_max_hp, || {
                *destroyed_ref = apply_attrition(st, city.owner_id, &idx, frac);
                let after = defender_indices(st, city.owner_id, city.position);
                garrison_of(st, &after)
            })
        };
        if dec.record_start {
            // Web `oblCity.siegeStarveStartMaxHp = st0.startMaxHp ?? undefined`.
            state
                .siege_city
                .entry(cid)
                .or_default()
                .siege_starve_start_max_hp = dec.start_max_hp;
        }
        let pending = state
            .siege_city
            .get(&cid)
            .is_some_and(|f| f.siege_capitulation_pending);
        let food_now = city_food_of(state.siege_city.get(&cid));
        let action = surrender_tick_action(&dec, pending, food_now);
        let mut failed: Option<SiegeBattleError> = None;
        let capitulation = match action {
            SurrenderTickAction::CapitulationPhase(CapitulationAction::SetPending) => {
                state
                    .siege_city
                    .entry(cid)
                    .or_default()
                    .siege_capitulation_pending = true;
                None
            }
            SurrenderTickAction::CapitulationPhase(CapitulationAction::Resolve)
            | SurrenderTickAction::Surrender => {
                let mut trial = state.clone();
                match apply_siege_capitulation(&mut trial, cid) {
                    Ok(cap) => {
                        *state = trial;
                        Some(cap)
                    }
                    Err(e) => {
                        failed = Some(e);
                        None
                    }
                }
            }
            SurrenderTickAction::CapitulationPhase(CapitulationAction::Hold)
            | SurrenderTickAction::None => None,
        };
        report.entries.push(SiegeTickEntry {
            city_id: cid,
            decision: dec,
            action,
            destroyed_unit_ids: destroyed,
            capitulation,
        });
        if let Some(e) = failed {
            report.error = Some((cid, e.to_string()));
            break;
        }
    }
    report
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capitulation_phase_resolves_only_when_pending() {
        assert_eq!(
            handle_siege_capitulation_phase(true, 5.0),
            CapitulationAction::Resolve
        );
        assert_eq!(
            handle_siege_capitulation_phase(true, 0.0),
            CapitulationAction::Resolve
        );
    }

    #[test]
    fn capitulation_phase_sets_pending_on_empty_stock() {
        assert_eq!(
            handle_siege_capitulation_phase(false, 0.0),
            CapitulationAction::SetPending
        );
        assert_eq!(
            handle_siege_capitulation_phase(false, -2.0),
            CapitulationAction::SetPending
        );
        assert_eq!(
            handle_siege_capitulation_phase(false, f64::NAN),
            CapitulationAction::Hold
        );
    }

    #[test]
    fn capitulation_phase_holds_with_food() {
        assert_eq!(
            handle_siege_capitulation_phase(false, 0.5),
            CapitulationAction::Hold
        );
    }

    #[test]
    fn linker_none_without_decision() {
        let d = SiegeTurnDecision::default();
        assert_eq!(
            surrender_tick_action(&d, false, 0.0),
            SurrenderTickAction::None
        );
        assert_eq!(
            surrender_tick_action(&d, true, 0.0),
            SurrenderTickAction::None
        );
    }

    #[test]
    fn linker_legacy_routes_to_phase_and_surrender_to_resolve() {
        let legacy = SiegeTurnDecision {
            legacy_pending: true,
            ..Default::default()
        };
        assert_eq!(
            surrender_tick_action(&legacy, false, 0.0),
            SurrenderTickAction::CapitulationPhase(CapitulationAction::SetPending)
        );
        assert_eq!(
            surrender_tick_action(&legacy, true, 0.0),
            SurrenderTickAction::CapitulationPhase(CapitulationAction::Resolve)
        );
        let surrender = SiegeTurnDecision {
            surrender: true,
            ..Default::default()
        };
        assert_eq!(
            surrender_tick_action(&surrender, false, 0.0),
            SurrenderTickAction::Surrender
        );
    }

    #[test]
    fn besieger_explicit_then_stored_then_adjacent() {
        let city = BesiegerCity {
            owner_id: 1,
            q: 0,
            r: 0,
            oblegajacy_owner_id: Some(3),
        };
        assert_eq!(besieger_owner_for_city(&city, Some(2), &[]), Some(3));
        let city = BesiegerCity {
            oblegajacy_owner_id: None,
            ..city
        };
        assert_eq!(besieger_owner_for_city(&city, Some(2), &[]), Some(2));
        let adj = BesiegerUnit {
            owner_id: 2,
            q: 1,
            r: 0,
        };
        let far = BesiegerUnit {
            owner_id: 4,
            q: 3,
            r: 0,
        };
        assert_eq!(besieger_owner_for_city(&city, None, &[far, adj]), Some(2));
        assert_eq!(besieger_owner_for_city(&city, None, &[far]), None);
    }

    #[test]
    fn surrender_path_branches() {
        let enemy_all: &dyn Fn(i64, i64) -> bool = &|_, _| true;
        let peace_all: &dyn Fn(i64, i64) -> bool = &|_, _| false;
        assert_eq!(
            resolve_surrender_path(false, 1, Some(2), enemy_all),
            SurrenderPath::NoCity
        );
        assert_eq!(
            resolve_surrender_path(true, 1, None, enemy_all),
            SurrenderPath::NoCaptor
        );
        assert_eq!(
            resolve_surrender_path(true, 1, Some(1), enemy_all),
            SurrenderPath::NoCaptor
        );
        assert_eq!(
            resolve_surrender_path(true, 1, Some(2), peace_all),
            SurrenderPath::NotEnemy
        );
        assert_eq!(
            resolve_surrender_path(true, 1, Some(2), enemy_all),
            SurrenderPath::Transfer
        );
    }

    #[test]
    fn enemy_check_skipped_without_owner_change() {
        let panic_closure: &dyn Fn(i64, i64) -> bool =
            &|_, _| panic!("areEnemyOwners nie powinno byc wolane");
        assert_eq!(
            resolve_surrender_path(true, 1, Some(1), panic_closure),
            SurrenderPath::NoCaptor
        );
        assert_eq!(
            resolve_surrender_path(true, 1, None, panic_closure),
            SurrenderPath::NoCaptor
        );
    }

    #[test]
    fn removal_ids_only_old_owner_on_city_hex() {
        let city = EnterCity {
            id: "c1".into(),
            q: 3,
            r: 4,
        };
        let u = |id: &str, owner: i64, q: i64, r: i64| EnterUnit {
            id: id.into(),
            owner_id: owner,
            q,
            r,
            ..Default::default()
        };
        let units = vec![
            u("a", 1, 3, 4),
            u("b", 2, 3, 4),
            u("c", 1, 3, 5),
            u("d", 1, 3, 4),
        ];
        assert_eq!(transfer_removal_ids(&units, &city, 1), vec!["a", "d"]);
        assert!(transfer_removal_ids(&units, &city, 9).is_empty());
    }

    #[test]
    fn end_siege_resets_starvation_fields() {
        let mut c = SiegeStarvationCity {
            oblegane: Some(true),
            siege_capitulation_pending: Some(true),
            siege_starve_start_max_hp: Some(20.0),
        };
        end_map_siege_fields(&mut c);
        assert_eq!(c.oblegane, Some(false));
        assert_eq!(c.siege_capitulation_pending, Some(false));
        assert_eq!(c.siege_starve_start_max_hp, None);
    }

    #[test]
    fn population_floor_matches_js_max() {
        assert_eq!(surrender_population_after(0.0), 1.0);
        assert_eq!(surrender_population_after(0.4), 1.0);
        assert_eq!(surrender_population_after(2.7), 2.7);
        assert!(surrender_population_after(f64::NAN).is_nan());
    }
}
