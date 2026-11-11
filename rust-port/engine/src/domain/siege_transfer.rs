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
    ("beginWonderTransferWatch", EffectStatus::Missing),
    // Generator pinu stubuje to wolanie (zwraca undefined, bez wykonania web): wektory populacji
    // zakladaja applyCapturePopulationLoss = no-op, tzn. utrata obywatela przy kapitulacji NIE jest odtworzona.
    ("applyCapturePopulationLoss", EffectStatus::Missing),
    ("applyPostCaptureLawOnCapture", EffectStatus::Missing),
    (
        "triggerRebelProtectionWarConsequence",
        EffectStatus::Missing,
    ),
    ("settleWonderTransfer", EffectStatus::Missing),
    ("noteCityCapture", EffectStatus::Missing),
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
    ("sanitizeProductionQueue", EffectStatus::Missing),
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
    ("syncCityGarnizon", EffectStatus::Missing),
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
    ("playerEverOwnedCityByOwner.add", EffectStatus::Missing),
    ("runCapitalCapturePlunder", EffectStatus::Missing),
    ("recordCityCaptureEvent", EffectStatus::Missing),
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
    ("applyLiveSafeRationForCity", EffectStatus::Missing),
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
}

/// Galaz Transfer. Wywolac po warunku wstepnym (zob. naglowek). `was_independent_city_state` = web
/// `wasIndependentCityStateBeforeCapture(city)` odczytane PRZED ta funkcja.
///
/// Kolejnosc jak w web: zmiana wlasciciela -> flaga miasta-panstwa -> `foundedByOwner` -> kolejka produkcji
/// (odzysk Pracy) -> `rebelState` -> podloga populacji -> splice obroncow starego wlasciciela.
///
/// NIE PODPINAC wolajacego (W8 r3) przed wykonaniem skutkow BRAK z [`TRANSFER_EFFECTS`]: przede wszystkim
/// `applyCapturePopulationLoss` i `sanitizeProductionQueue(newOwner)`. Bez nich wynik rozni sie od weba
/// (populacja bez utraty obywatela, kolejka bez sanitizacji zdobywcy). Ta funkcja jest bezpieczna tylko jako
/// modul bez wolajacego.
pub fn apply_transfer(
    city: &mut TransferCity,
    new_owner: i64,
    was_independent_city_state: bool,
    units: &mut Vec<EnterUnit>,
    production: Option<TransferProduction<'_>>,
) -> TransferOutcome {
    let old_owner = city.owner_id;
    let mut performed: Vec<&'static str> = Vec::new();

    // BRAK (tabela): applyCapturePopulationLoss, applyPostCaptureLawOnCapture, triggerRebelProtectionWarConsequence,
    // beginWonderTransferWatch/settleWonderTransfer, noteCityCapture - nie wykonane tutaj.
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
            // BRAK: sanitizeProductionQueue(newOwner, ...) - pominiety; wolajacy musi to wykonac wczesniej.
            // ROZBIEZNOSC Z WEBEM (zarzut Evaluatora): web liczy `banked` z wyniku sanitizeProductionQueue
            // (`sanitizedSurrenderProd.kolejka`), a tutaj z `migrated.prod` (wynik sanitizeBuildQueue).
            // Zgodnosc zachodzi tylko, gdy sanitizeProductionQueue jest identycznoscia; NIE_ZMIERZONO dla
            // kolejek, w ktorych ten krok cos zmienia (brak wektorow kolejki z pinu, patrz test p6_siege_transfer).
            let is_cap = p.is_capital_only_building;
            let banked: f64 = if p.is_new_capital {
                0.0
            } else {
                migrated
                    .prod
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
                (migrated.prod.clone(), 0.0)
            } else {
                performed.push("filterQueue");
                let f = filter_queue(&migrated.prod, |i| !is_cap(i));
                (f.prod, f.forfeited_postep)
            };
            (
                migrated.refunded_praca,
                front_forfeit + banked,
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
