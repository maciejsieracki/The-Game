//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q1 (SIEGE-SURRENDER Q2): galaz Transfer `resolveSiegeSurrender`.
//!
//! Pin webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75: `gra/src/main.ts:17646-17893` (galaz `newOwner`).
//! Ta funkcja wykonuje czesc skutkow przejecia, ktora ma odpowiednik w Rust (zmiana wlasciciela, podloga
//! populacji, usuniecie obroncow starego wlasciciela, flagi miasta, kolejka produkcji z odzyskiem Pracy).
//! Pozostale skutki sa WYPISANE w [`TRANSFER_EFFECTS`] jako `Missing` / `ExistsNotWired` / `CallerSide` (NIE_ZMIERZONO tam, gdzie nie zmierzono).
//! Wejscie garnizonu (`enterCityAfterSurrender`) i `endMapSiege` leza po stronie wolajacego
//! (kolejnosc: ta funkcja -> wejscie -> `end_map_siege_fields`).
//!
//! Warunek wstepny (sprawdza wolajacy, [`crate::domain::siege_surrender::resolve_surrender_path`] = `Transfer`):
//! miasto istnieje, oblegajacy `newOwner` != wlasciciel i `areEnemyOwners(newOwner, oldOwner)` = true.
//!
//! Zalozenia (do akceptacji, brak w dispatchu):
//! * Z-TR-1 `wasIndependentCityState` (web `wasIndependentCityStateBeforeCapture(city)`, odczyt PRZED zmiana
//!   flagi) jest parametrem wejsciowym - jego definicja lezy w osobnym module.
//! * Z-TR-2 `isCapitalOnlyBuilding` (web: `data.buildings...lokalizacja === 'stolica'`) i `isNewCapital`
//!   (web `capitalCityIdForOwner(newOwner) === city.id`) sa wstrzykiwane przez wolajacego.
//! * Z-TR-3 pule Pracy (`setOwnerPracaPool`) nie sa modyfikowane tutaj: funkcja zwraca kwoty
//!   (`refunded_praca_to_old`, `forfeited_praca_to_new`), a wolajacy dodaje je do puli.

use crate::domain::production_queue::{filter_queue, sanitize_build_queue};
use crate::domain::production_units::{CityProduction, ProductionItem};
use crate::domain::siege_enter_city::EnterUnit;
use crate::domain::siege_surrender::surrender_population_after;
use crate::domain::siege_transfer_effects::{
    apply_capture_population_loss, apply_post_capture_law_on_capture, rebel_protection_war_request,
    sanitize_production_queue_for_owner, was_protected_rebel, CapturePopLossInput,
    CapturePopLossOutcome, PostCaptureCityFields, RebelWarRequest,
};
use crate::domain::state::p6_6b::display_names::clear_city_state_flag_on_capture;

/// Status skutku z tabeli web -> Rust.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EffectStatus {
    /// Wykonany przez [`apply_transfer`] (nazwa Rust w polu).
    Ported(&'static str),
    /// Klocek istnieje w Rust, ale NIE jest wolany przez [`apply_transfer`] (zaleznosc jawna, nie podpieta).
    ExistsNotWired(&'static str),
    /// Brak nazwy w `rust-port/engine/src` (BRAK) - osobny temat, zaleznosc jawna.
    Missing,
    /// Krok lezy po stronie wolajacego (wartosc wejsciowa lub osobna funkcja w tym module siege_*).
    CallerSide(&'static str),
    /// Efekt UI / poza domena Rust (komunikaty, render, kamera, cache).
    Ui,
}

/// Tabela skutkow galezi Transfer: wszystkie wolania web z galezi (kolejnosc jak w pinie).
/// Test w `tests/p6_siege_transfer.rs` sprawdza, ze kazde wolanie zalogowane przez generator z pinu jest tu wpisane.
pub const TRANSFER_EFFECTS: &[(&str, EffectStatus)] = &[
    (
        "wasIndependentCityStateBeforeCapture",
        EffectStatus::CallerSide("Z-TR-1: parametr was_independent_city_state"),
    ),
    // BRAK (Q5): brak planera przeniesienia cudow (`planWonderTransfers`/`applyWonderTransfers`) i snapshotu
    // terytorium cudow w rust-port/engine/src (grep 2026-11-12 pusty); osobny temat (game/wonder-transfer.ts).
    ("beginWonderTransferWatch", EffectStatus::Missing),
    // Wykonane przez apply_transfer_with_effects gdy TransferExtras::pop_loss = Some (tryb legacy apply_transfer: NIE).
    // Generator pinu (p6_siege_transfer_gen.mjs) nadal stubuje to wolanie - wektory NIE zostaly przegenerowane.
    (
        "applyCapturePopulationLoss",
        EffectStatus::Ported("siege_transfer_effects::apply_capture_population_loss (TransferExtras::pop_loss)"),
    ),
    (
        "applyPostCaptureLawOnCapture",
        EffectStatus::Ported(
            "siege_transfer_effects::apply_post_capture_law_on_capture (TransferExtras::post_capture_law = Some; pola Prawa + revoltGraceRemaining=null; None = pominiete)",
        ),
    ),
    (
        "triggerRebelProtectionWarConsequence",
        EffectStatus::CallerSide(
            "siege_transfer_effects::rebel_protection_war_request zwraca RebelWarRequest (warunki web zgodne z wektorami); deklaracja wojny po stronie wolajacego",
        ),
    ),
    (
        "ownerDeclareWarOn",
        EffectStatus::CallerSide(
            "ZALEZNOSC W8 r4 (NIE_ZMIERZONO): force=true (omija isPeaceLockedBetween, czysci peaceUntilTurn) i powod 'wymuszona_inna' nie maja odpowiednika w diplomacy_truce_flow::declare_war_opts (tylko skip_n2)",
        ),
    ),
    // BRAK (Q5): jak beginWonderTransferWatch (ta sama zaleznosc: planer/snapshot cudow nie istnieje w Rust).
    ("settleWonderTransfer", EffectStatus::Missing),
    (
        "noteCityCapture",
        EffectStatus::Ported(
            "siege_transfer_q5::note_city_capture (wolajacy po apply_transfer; NIE w apply_transfer - TransferExtras bez pola kroniki, testy Q3/Q4 z literalami struktury)",
        ),
    ),
    (
        "clearCityStateFlagOnCapture",
        EffectStatus::Ported("state::p6_6b::display_names::clear_city_state_flag_on_capture"),
    ),
    ("markCityStateDirty", EffectStatus::Ui),
    (
        "maybeResolveRegularWarOnCityCapture",
        EffectStatus::ExistsNotWired(
            "war_turn_declare::register_regular_war_city_loss (wymaga WarTurnState)",
        ),
    ),
    (
        "recordWarCityLossForPair",
        EffectStatus::ExistsNotWired(
            "diplomacy_war_peace_profile::record_war_city_loss (wymaga meta pary)",
        ),
    ),
    (
        "sanitizeBuildQueue",
        EffectStatus::Ported("production_queue::sanitize_build_queue"),
    ),
    (
        "sanitizeProductionQueue",
        EffectStatus::Ported(
            "siege_transfer_effects::sanitize_production_queue_for_owner (TransferExtras::wonder_gate_ok; wonderGateOk po stronie wolajacego)",
        ),
    ),
    (
        "wonderGateOk",
        EffectStatus::CallerSide("ZALEZNOSC W8 r3: brak odpowiednika w Rust; predykat wonder_gate_ok po stronie wolajacego"),
    ),
    (
        "parseWonderProdId",
        EffectStatus::CallerSide("ZALEZNOSC W8 r3: brak odpowiednika w Rust; wykorzystywane tylko przez wonderGateOk"),
    ),
    (
        "filterQueue",
        EffectStatus::Ported("production_queue::filter_queue"),
    ),
    (
        "setOwnerPracaPool",
        EffectStatus::CallerSide("Z-TR-3: kwoty zwracane do wolajacego"),
    ),
    (
        "ownerPracaPool",
        EffectStatus::CallerSide("Z-TR-3: pula w wolajacym"),
    ),
    (
        "capitalCityIdForOwner",
        EffectStatus::CallerSide("Z-TR-2: parametr is_new_capital"),
    ),
    (
        "seedCityOwnerDefaults",
        EffectStatus::ExistsNotWired(
            "turn_economy_inputs_podzial::seed_city_owner_defaults_podzial (inne typy wejsc)",
        ),
    ),
    (
        "syncCityGarnizon",
        EffectStatus::Ported(
            "siege_transfer_q5::sync_city_garnizon (wolajacy PO enter_city_after_surrender; NIE w apply_transfer - kolejnosc web main.ts:17812)",
        ),
    ),
    (
        "armyStackLimit",
        EffectStatus::CallerSide("argument enterCityAfterSurrender (krok po apply_transfer)"),
    ),
    (
        "enterCityAfterSurrender",
        EffectStatus::CallerSide(
            "siege_enter_city::enter_city_after_surrender (po apply_transfer)",
        ),
    ),
    (
        "playerEverOwnedCityByOwner.add",
        EffectStatus::Ported(
            "siege_transfer_q5::record_player_ever_owned_city (wolajacy PO wejsciu garnizonu; NIE w apply_transfer - kolejnosc web main.ts:17816)",
        ),
    ),
    // PORTED (Q6): pladrowanie stolicy - `runCapitalCapturePlunder` (main.ts:35558) jako `run_capital_capture_plunder`
    // + czysty rdzen `capital-capture.ts` w `siege_capital_plunder`. Wektory: tests/p6_siege_capital_plunder.rs.
    // Granice jawne: akcesory ekonomii, etykiety/tekst raportu i Power/zjednoczenie sa wejsciami wolajacego.
    // Status "Ported" oznacza PORT LOGIKI z wektorami; wolajacy (wiring w produkcji, zalezny od W8) NIE jest
    // jeszcze podpiety - patrz kontrakt kolejnosci `lost_power` w siege_capital_plunder.rs.
    (
        "runCapitalCapturePlunder",
        EffectStatus::Ported(
            "siege_capital_plunder::run_capital_capture_plunder (logika + wektory p6_siege_capital_plunder; wolajacy niepodpiety - W8)",
        ),
    ),
    // PORTED (Q7): event store zdarzenia "zdobycie miasta" (`cityCaptureEventDetails` + karta `capture-*`) jako
    // `siege_capture_events::CaptureEventStore::record_city_capture_event`. Wektory: tests/p6_siege_capture_events.rs.
    // Granice jawne: `eliminationSpectacleByLabel` (spektakl) i `refreshD1bHud` (UI, licznik) - wejscia/efekty wolajacego.
    // Pole `spectacle` NIE jest portowane (wektory maja mape pusta); zaleznosc W8. Wolajacy (wiring w
    // apply_transfer_with_effects, zalezny od W8) NIE jest jeszcze podpiety.
    (
        "recordCityCaptureEvent",
        EffectStatus::Ported(
            "siege_capture_events::CaptureEventStore::record_city_capture_event (logika store bez pola spectacle - W8; wektory p6_siege_capture_events; wolajacy niepodpiety - W8)",
        ),
    ),
    // UWAGA (Q7 r2): `recordCivElimEvent` NIE jest w tej tabeli. W pinie 07d2fbd72 wolany jest poza galezia Transfer
    // (gra/src/main.ts:35336 - wchloniecie; :35767 - podboj ofiary-AI), a zakres galezi to 17646-17893. Port karty
    // `elim-cs-*` istnieje jako `siege_capture_events::CaptureEventStore::record_civ_elim_event` (wektory p6_siege_capture_events),
    // wolajacy poza galezia Transfer - zalezny od W8.
    ("showHintMessage", EffectStatus::Ui),
    // Pomocniki raportowe/UI wolane w galezi Transfer (pin main.ts, zakres 17646-17893: setSelectionHex,
    // mocLabel, buildCityCaptureReportRows, capturePopLossReportRow, captureReportOneLine, civLabelForOwner).
    // Nie sa czescia stanu domeny; Rust-owa warstwa raportu ich nie implementuje w tym temacie.
    ("setSelectionHex", EffectStatus::Ui),
    ("mocLabel", EffectStatus::Ui),
    ("buildCityCaptureReportRows", EffectStatus::Ui),
    ("capturePopLossReportRow", EffectStatus::Ui),
    ("captureReportOneLine", EffectStatus::Ui),
    ("civLabelForOwner", EffectStatus::Ui),
    (
        "endMapSiege",
        EffectStatus::CallerSide("siege_surrender::end_map_siege_fields (po wejsciu)"),
    ),
    (
        "applyLiveSafeRationForCity",
        EffectStatus::Ported(
            "siege_transfer_q5::apply_live_safe_ration_for_city (czesc decyzyjna; ensureCityRationDefaults, getCityRationLevel i maxSafe po stronie wolajacego; wolany PO endMapSiege)",
        ),
    ),
    (
        "areEnemyOwners",
        EffectStatus::CallerSide("siege_surrender::resolve_surrender_path (warunek wstepny)"),
    ),
];

/// Miasto w zakresie galezi Transfer (pola web `City` czytane i pisane przez przejecie).
#[derive(Debug, Clone, PartialEq)]
pub struct TransferCity {
    pub owner_id: i64,
    pub population: f64,
    pub q: i64,
    pub r: i64,
    /// Web `city.foundedByOwner` (`None` = pole nieobecne).
    pub found_by_owner: Option<bool>,
    /// Web `city.rebelState`.
    pub rebel_state: Option<bool>,
    /// Web `city.startCityState` (flaga miasta-panstwa, gaszona przy kazdym przejeciu).
    pub start_city_state: Option<bool>,
}

/// Dane kolejki produkcji miasta (web `cityProd.get(city.id)`), wraz z kontekstem stolicy.
pub struct TransferProduction<'a> {
    pub prod: &'a CityProduction,
    /// Z-TR-2: web `capitalCityIdForOwner(newOwner) === city.id`.
    pub is_new_capital: bool,
    /// Z-TR-2: web `data.buildings.find(b => b.id === item.id)?.lokalizacja === 'stolica'`.
    pub is_capital_only_building: &'a dyn Fn(&ProductionItem) -> bool,
}

/// Wynik galezi Transfer.
#[derive(Debug, Clone, PartialEq)]
pub struct TransferOutcome {
    pub old_owner: i64,
    pub new_owner: i64,
    /// Web `units.splice` dla obroncow starego wlasciciela na heksie miasta (w kolejnosci wejscia).
    pub removed_unit_ids: Vec<String>,
    /// Praca do zwrotu starego wlasciciela (`sanitizeBuildQueue().refundedPraca`).
    pub refunded_praca_to_old: f64,
    /// Praca przekazana zdobywcy (zbankowany postep odrzuconych budynkow-stolic + front).
    pub forfeited_praca_to_new: f64,
    /// Kolejka po przejeciu (`None` gdy miasto nie mialo kolejki).
    pub production: Option<CityProduction>,
    /// Czy `clearCityStateFlagOnCapture` faktycznie zgasilo flage (wywolac `markCityStateDirty`).
    pub start_city_state_cleared: bool,
    /// Web `citySiegeOwnerChanged = true` (wolajacy wola `applyLiveSafeRationForCity` PO `endMapSiege`).
    pub city_siege_owner_changed: bool,
    /// Kroki wykonane tutaj, nazwy web (kolejnosc jak w pinie).
    pub performed: Vec<&'static str>,
    /// Wynik `applyCapturePopulationLoss` (`None` = krok nie byl wykonany, tryb legacy [`apply_transfer`]).
    /// WOLAJACY MUSI zapisac `captured_from_owner_id` i `founded_by` (web `city.capturedFromOwnerId`,
    /// `city.foundedBy`): `TransferCity` nie ma tych pol.
    pub capture_loss: Option<CapturePopLossOutcome>,
    /// Web `city.wasRebellionReconquest` po `applyPostCaptureLawOnCapture` (`None` = krok nie wykonany / no-op).
    pub post_capture_law_reconquest: Option<bool>,
    /// Zadanie wojny z `triggerRebelProtectionWarConsequence`; WOLAJACY wykonuje `ownerDeclareWarOn(declarer, target, force=true)`.
    pub rebel_war_request: Option<RebelWarRequest>,
}

/// Opcjonalne skutki galezi Transfer, ktorych nie ma w [`apply_transfer`] (R-RUSTPORT-P6-SIEGE-TRANSFER-Q3-Q1).
#[derive(Default)]
pub struct TransferExtras<'a> {
    /// Wejscie `applyCapturePopulationLoss` (`None` = krok pominiety).
    pub pop_loss: Option<CapturePopLossInput>,
    /// Bramka `wonderGateOk(newOwner, wid)` dla `sanitizeProductionQueue(newOwner)`. `None` = bramka przepuszczajaca
    /// (sanityzacja nadal wykonana). ZALEZNOSC: `wonderGateOk`/`parseWonderProdId` nie maja odpowiednika w Rust (W8 r3);
    /// wolajacy z cudami w kolejce MUSI podac bramke, inaczej wynik rozni sie od weba.
    pub wonder_gate_ok: Option<&'a dyn Fn(&ProductionItem) -> bool>,
    /// Pola Prawa po zdobyciu miasta (`rebelPreviousOwnerId`, `rebelProtectionTurnsRemaining`, bonus Prawa) oraz
    /// `revoltGraceRemaining`. `Some` = wykonac `applyPostCaptureLawOnCapture` + `triggerRebelProtectionWarConsequence`
    /// (sekwencja web main.ts:17693-17703: odczyt ochrony PRZED kasowaniem).
    /// `None` = krok POMINIETY po cichu (tylko tryb legacy). Web wykonuje oba skutki ZAWSZE w galezi Transfer,
    /// wiec wolajacy produkcyjny (W8 r4) MUSI podac `Some`; `None` daje wynik rozny od weba (test
    /// `p6_siege_transfer_effects_q4::none_pomija_prawo_i_wojne_jawnie` to dokumentuje).
    pub post_capture_law: Option<PostCaptureCityFields<'a>>,
}

/// Galaz Transfer. Wywolac po warunku wstepnym (zob. naglowek). `was_independent_city_state` = web
/// `wasIndependentCityStateBeforeCapture(city)` odczytane PRZED ta funkcja.
///
/// Kolejnosc jak w web: zmiana wlasciciela -> flaga miasta-panstwa -> `foundedByOwner` -> kolejka produkcji
/// (odzysk Pracy) -> `rebelState` -> podloga populacji -> splice obroncow starego wlasciciela.
///
/// Tryb LEGACY (bez [`TransferExtras`]): NIE wykonuje `applyCapturePopulationLoss` (ta sciezka nie jest objeta wektorami
/// generatora); `sanitizeProductionQueue` wykonuje z bramka przepuszczajaca. Do produkcji uzywac
/// [`apply_transfer_with_effects`] z realna bramka cudow.
/// NIE PODPINAC wolajacego (W8 r3) przed wykonaniem pozostalych skutkow z [`TRANSFER_EFFECTS`]: BRAK
/// (`beginWonderTransferWatch`/`settleWonderTransfer`) oraz Ported-niepodpiete (`runCapitalCapturePlunder`,
/// `recordCityCaptureEvent`, ...). Prawo po przejęciu
/// i wojna z rebeliantów (Q4) sa dostepne przez [`TransferExtras::post_capture_law`].
pub fn apply_transfer(
    city: &mut TransferCity,
    new_owner: i64,
    was_independent_city_state: bool,
    units: &mut Vec<EnterUnit>,
    production: Option<TransferProduction<'_>>,
) -> TransferOutcome {
    apply_transfer_with_effects(
        city,
        new_owner,
        was_independent_city_state,
        units,
        production,
        TransferExtras::default(),
    )
}

/// Galaz Transfer z opcjonalnymi skutkami [`TransferExtras`] (`applyCapturePopulationLoss`,
/// `sanitizeProductionQueue(newOwner)`). Z `TransferExtras::default()` zachowuje zachowanie [`apply_transfer`].
///
/// Kolejnosc jak w web (main.ts:17700-17790): `applyCapturePopulationLoss` -> zmiana wlasciciela -> flaga
/// miasta-panstwa -> `foundedByOwner` -> `sanitizeBuildQueue` (zwrot Pracy staremu) -> `sanitizeProductionQueue`
/// (bramka cudow zdobywcy; banked liczony z WYNIKU sanityzacji) -> filtr stolicy -> `rebelState` -> podloga
/// populacji -> splice obroncow.
pub fn apply_transfer_with_effects(
    city: &mut TransferCity,
    new_owner: i64,
    was_independent_city_state: bool,
    units: &mut Vec<EnterUnit>,
    production: Option<TransferProduction<'_>>,
    mut extras: TransferExtras<'_>,
) -> TransferOutcome {
    let old_owner = city.owner_id;
    let mut performed: Vec<&'static str> = Vec::new();

    let capture_loss = extras.pop_loss.as_ref().map(|input| {
        assert_eq!(
            input.prev_owner, old_owner,
            "pop_loss.prev_owner != city.owner_id"
        );
        assert_eq!(
            input.new_owner, new_owner,
            "pop_loss.new_owner != new_owner"
        );
        apply_capture_population_loss(city.population, input)
    });
    if let Some(c) = &capture_loss {
        city.population = c.population;
        performed.push("applyCapturePopulationLoss");
    }

    // Web: wasProtectedRebel + rebelPrevOwnerSnapshot (odczyt PRZED applyPostCaptureLawOnCapture),
    // potem applyPostCaptureLawOnCapture, triggerRebelProtectionWarConsequence (main.ts:17700-17720).
    let mut post_capture_law_reconquest = None;
    let mut rebel_war_request = None;
    if let Some(f) = extras.post_capture_law.as_mut() {
        let was_protected = was_protected_rebel(city.rebel_state, f.law);
        let rebel_prev = f.law.rebel_previous_owner_id;
        post_capture_law_reconquest = apply_post_capture_law_on_capture(
            f.law,
            f.revolt_grace_remaining,
            new_owner,
            old_owner,
        );
        performed.push("applyPostCaptureLawOnCapture");
        rebel_war_request = rebel_protection_war_request(was_protected, rebel_prev, new_owner);
        performed.push("triggerRebelProtectionWarConsequence");
    }

    // BRAK (tabela): beginWonderTransferWatch/settleWonderTransfer, noteCityCapture - nie wykonane tutaj.
    city.owner_id = new_owner;

    let start_city_state_cleared = clear_city_state_flag_on_capture(&mut city.start_city_state);
    performed.push("clearCityStateFlagOnCapture");

    if !was_independent_city_state {
        city.found_by_owner = Some(false);
    }

    // BRAK / ExistsNotWired (tabela): maybeResolveRegularWarOnCityCapture, recordWarCityLossForPair,
    // seedCityOwnerDefaults - wolajacy (W8 r3) musi je wykonac po tej funkcji.

    let (refunded_praca_to_old, forfeited_praca_to_new, production_out) = match production {
        None => (0.0, 0.0, None),
        Some(p) => {
            performed.push("sanitizeBuildQueue");
            let migrated = sanitize_build_queue(p.prod);
            // web sanitizeProductionQueue(newOwner, migrated.prod): bramka cudow zdobywcy; zwrot Pracy
            // z jej wewnetrznej sanityzacji jest 0 (kolejka juz oczyszczona), wiec refund = migrated.refunded.
            // Krok wykonywany ZAWSZE jak w web. Brak bramki (`None`) = bramka przepuszczajaca (brak cudow
            // w kolejce); sanityzacja (w tym druga sanitizeBuildQueue) nadal sie wykonuje.
            performed.push("sanitizeProductionQueue");
            let allow_all = |_: &ProductionItem| true;
            let gate: &dyn Fn(&ProductionItem) -> bool =
                extras.wonder_gate_ok.unwrap_or(&allow_all);
            let sanitized = sanitize_production_queue_for_owner(&migrated.prod, gate);
            let (queue, wonder_forfeit) = (sanitized.prod, sanitized.forfeited_postep);
            // banked liczony z WYNIKU sanityzacji (web `sanitizedSurrenderProd.kolejka`), nie z migrated.prod.
            let is_cap = p.is_capital_only_building;
            let banked: f64 = if p.is_new_capital {
                0.0
            } else {
                queue
                    .kolejka
                    .iter()
                    .skip(1)
                    .filter(|i| is_cap(i))
                    .fold(0.0, |acc, i| match i.postep {
                        Some(v) if v.is_finite() && v > 0.0 => acc + v,
                        _ => acc,
                    })
            };
            let (capital_filtered, front_forfeit) = if p.is_new_capital {
                (queue.clone(), 0.0)
            } else {
                performed.push("filterQueue");
                let f = filter_queue(&queue, |i| !is_cap(i));
                (f.prod, f.forfeited_postep)
            };
            (
                migrated.refunded_praca,
                wonder_forfeit + front_forfeit + banked,
                Some(capital_filtered),
            )
        }
    };

    if city.rebel_state == Some(true) {
        city.rebel_state = Some(false);
    }

    city.population = surrender_population_after(city.population);

    let removed_unit_ids = transfer_removed_ids_in_place(units, city, old_owner);

    TransferOutcome {
        old_owner,
        new_owner,
        removed_unit_ids,
        refunded_praca_to_old,
        forfeited_praca_to_new,
        production: production_out,
        start_city_state_cleared,
        city_siege_owner_changed: true,
        performed,
        capture_loss,
        post_capture_law_reconquest,
        rebel_war_request,
    }
}

/// Usuniecie jednostek starego wlasciciela z heksu miasta; zwraca usuniete id (web: petla wsteczna + splice).
fn transfer_removed_ids_in_place(
    units: &mut Vec<EnterUnit>,
    city: &TransferCity,
    old_owner: i64,
) -> Vec<String> {
    let mut removed = Vec::new();
    units.retain(|u| {
        let hit = u.q == city.q && u.r == city.r && u.owner_id == old_owner;
        if hit {
            removed.push(u.id.clone());
        }
        !hit
    });
    removed
}
