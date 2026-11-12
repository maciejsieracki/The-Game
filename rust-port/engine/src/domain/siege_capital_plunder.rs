//! R-RUSTPORT-P6-SIEGE-TRANSFER-Q6-Q1: `runCapitalCapturePlunder` (pin webu) jako czyste funkcje.
//!
//! Pin webu 07d2fbd72f758705f8e1d59cc4968027ffbafe75:
//! * `gra/src/game/capital-capture.ts` - rdzen przejecia stolicy: `cityFoundOrder`, `oldestCityOfOwner`,
//!   `wasCapitalOfOldOwner`, `remainingCitiesOfOwner`, `transferWholeEstateToWinner`, `applyCapitalCapturePlunder`,
//!   `barbarianCaptorResourceAccess`, `barbarianCapturedPowerGain`, `applyBarbarianAwareCapitalCapturePlunder`;
//! * `gra/src/main.ts` (`runCapitalCapturePlunder`, closure) - glue: decyzja galezi (rebelia / przejecie stolicy /
//!   eliminacja / triumf), kolejnosc wolan UI i zapisy stanu (mapa stolic, zdobycze Power, slot raportu, spektakl).
//!
//! Granice (jawne, NIE stuby po cichu):
//! * Akcesory ekonomii ([`OwnerResourceAccess`]) - wolajacy dostarcza implementacje (w grze: stan gracza/AI).
//! * Etykiety i tekst raportu ([`PlunderLabels`]) - wolajacy dostarcza `civLabelForOwner`, `mocLabel`,
//!   `civDisplayNameForOwner`, `civKeyForOwnerId`, `captureReportOneLine` i `buildSpectacleForElimination`
//!   (warstwa UI/spektaklu, poza domena Rust). Kazde wolanie tych funkcji jest zapisywane w `ui_calls` (z argumentami).
//! * `buildObjectivePowerForOwner(oldOwner).power` (`lost_power`) i `shouldShowPlayerTriumphCityStateUnification`
//!   (`triumph_unification`) - wartosci wejsciowe od wolajacego (Power i detekcja zjednoczenia Grecji sa poza tym modulem).
//! * `buildCityCaptureReportRows` - w Rust budowany jako obiekt argumentow (`kind` + pola); sam tekst linii jest
//!   dostarczony przez [`PlunderLabels::one_line`].
//! * `eliminateOwner`, `markCityStateDirty`, `showHintMessage`, `recordCityCaptureEvent`, `recordCivElimEvent`,
//!   `showTriumphCityStateNotice` - efekty uboczne po stronie wolajacego; tu tylko zapisywane w `ui_calls`.
//!   Store po stronie wolajacego dla `recordCityCaptureEvent` / `recordCivElimEvent`: `siege_capture_events::CaptureEventStore` (Q7).
//!
//! Zalozenia (do akceptacji, brak w dispatchu):
//! * Z-PL-1 `cityFoundOrder` zwraca `f64` (`INFINITY` dla id niepasujacego do `city<N>`), tak jak JS `Number`.
//! * Z-PL-2 `Math.max(0, NaN)` = NaN (JS) - [`js_max0`]; w wektorach nie wystepuje NaN.
//! * Z-PL-3 `designatedCapitalId` = `capitalCityIdByOwner.get(oldOwner) ?? undefined` (wolane w [`run_capital_capture_plunder`]).

use std::collections::{BTreeMap, BTreeSet};

use serde_json::{json, Value};

/// Web `BARBARIAN_OWNER_ID` (gra/src/game/barbarians.ts).
pub const BARBARIAN_OWNER_ID: i64 = -1;
/// Web `REBEL_FACTION_OWNER_ID` (gra/src/game/society-breakdown.ts).
pub const REBEL_FACTION_OWNER_ID: i64 = -99;

/// Web `isBarbarian(ownerId)` (barbarians.ts:54).
pub fn is_barbarian(owner_id: i64) -> bool {
    owner_id == BARBARIAN_OWNER_ID
}

/// Minimalny widok miasta potrzebny do przejecia stolicy (pola web `City` uzywane w capital-capture.ts / main.ts).
#[derive(Debug, Clone, PartialEq)]
pub struct PlunderCity {
    pub id: String,
    pub name: String,
    pub owner_id: i64,
    pub population: f64,
    /// Web `City.surowce` (magazyn miasta). Klucze w kolejnosci wstawiania nie maja znaczenia (porownanie mapy).
    pub surowce: BTreeMap<String, f64>,
}

/// Web `OwnerResourceAccess` (capital-capture.ts). Akcesory zywnosci sa opcjonalne w webie: `food_supported`
/// = obecnosc `getFoodReserve && setFoodReserve`; `get_food_capacity` = `None` gdy brak akcesora `getFoodCapacity`.
pub trait OwnerResourceAccess {
    fn get_treasury(&self, owner: i64) -> f64;
    fn set_treasury(&mut self, owner: i64, value: f64);
    fn get_praca_pool(&self, owner: i64) -> f64;
    fn set_praca_pool(&mut self, owner: i64, value: f64);
    fn get_nauka_pool(&self, owner: i64) -> f64;
    fn set_nauka_pool(&mut self, owner: i64, value: f64);
    fn get_researched_techs(&self, owner: i64) -> BTreeSet<String>;
    fn add_researched_techs(&mut self, owner: i64, ids: &[String]);
    fn food_supported(&self) -> bool;
    fn get_food_reserve(&self, owner: i64) -> f64;
    fn set_food_reserve(&mut self, owner: i64, value: f64);
    fn get_food_capacity(&self, owner: i64) -> Option<f64>;
}

/// Web `barbarianCaptorResourceAccess(base, newOwner)`: zapisy DO `captor` (skarbiec/praca/nauka/zywnosc/techy)
/// sa no-opowane; odczyty i zapisy do innych ownerow przechodza. Zywnosc tylko gdy baza ja ma.
pub struct BarbarianCaptorAccess<'a, A: OwnerResourceAccess + ?Sized> {
    pub base: &'a mut A,
    pub captor: i64,
}

impl<A: OwnerResourceAccess + ?Sized> OwnerResourceAccess for BarbarianCaptorAccess<'_, A> {
    fn get_treasury(&self, owner: i64) -> f64 {
        self.base.get_treasury(owner)
    }
    fn set_treasury(&mut self, owner: i64, value: f64) {
        if owner != self.captor {
            self.base.set_treasury(owner, value);
        }
    }
    fn get_praca_pool(&self, owner: i64) -> f64 {
        self.base.get_praca_pool(owner)
    }
    fn set_praca_pool(&mut self, owner: i64, value: f64) {
        if owner != self.captor {
            self.base.set_praca_pool(owner, value);
        }
    }
    fn get_nauka_pool(&self, owner: i64) -> f64 {
        self.base.get_nauka_pool(owner)
    }
    fn set_nauka_pool(&mut self, owner: i64, value: f64) {
        if owner != self.captor {
            self.base.set_nauka_pool(owner, value);
        }
    }
    fn get_researched_techs(&self, owner: i64) -> BTreeSet<String> {
        self.base.get_researched_techs(owner)
    }
    fn add_researched_techs(&mut self, owner: i64, ids: &[String]) {
        if owner != self.captor {
            self.base.add_researched_techs(owner, ids);
        }
    }
    fn food_supported(&self) -> bool {
        self.base.food_supported()
    }
    fn get_food_reserve(&self, owner: i64) -> f64 {
        self.base.get_food_reserve(owner)
    }
    fn set_food_reserve(&mut self, owner: i64, value: f64) {
        if owner != self.captor {
            self.base.set_food_reserve(owner, value);
        }
    }
    fn get_food_capacity(&self, owner: i64) -> Option<f64> {
        self.base.get_food_capacity(owner)
    }
}

/// JS `Math.max(0, x)`: NaN propaguje sie (w odroznieniu od `f64::max`).
pub fn js_max0(x: f64) -> f64 {
    if x.is_nan() {
        f64::NAN
    } else {
        x.max(0.0)
    }
}

/// Web `cityFoundOrder(id)` (capital-capture.ts): N z `^city(\d+)$`, inaczej `+Infinity`.
pub fn city_found_order(id: &str) -> f64 {
    match id.strip_prefix("city") {
        Some(digits) if !digits.is_empty() && digits.bytes().all(|b| b.is_ascii_digit()) => {
            digits.parse::<f64>().unwrap_or(f64::INFINITY)
        }
        _ => f64::INFINITY,
    }
}

/// Web `oldestCityOfOwner(ownerId, cities)`: najstarsze miasto ownera. Porownanie `<` z startem `+Infinity`
/// (miasto o id spoza wzorca nigdy nie jest wybrane, jak w JS).
pub fn oldest_city_of_owner(owner_id: i64, cities: &[PlunderCity]) -> Option<&PlunderCity> {
    let mut best: Option<&PlunderCity> = None;
    let mut best_order = f64::INFINITY;
    for c in cities {
        if c.owner_id != owner_id {
            continue;
        }
        let order = city_found_order(&c.id);
        if order < best_order {
            best = Some(c);
            best_order = order;
        }
    }
    best
}

/// Web `wasCapitalOfOldOwner(city, oldOwner, citiesAfterCapture, designatedCapitalId?)`.
/// `designated` = `None` (undefined/null) -> fallback "najstarsze miasto" po pozostalych miastach oldOwner.
pub fn was_capital_of_old_owner(
    city: &PlunderCity,
    old_owner: i64,
    cities_after: &[PlunderCity],
    designated: Option<&str>,
) -> bool {
    if let Some(d) = designated {
        return d == city.id;
    }
    let order = city_found_order(&city.id);
    for c in cities_after {
        if c.id == city.id {
            continue;
        }
        if c.owner_id != old_owner {
            continue;
        }
        if city_found_order(&c.id) < order {
            return false;
        }
    }
    true
}

/// Web `remainingCitiesOfOwner(oldOwner, citiesAfterCapture)`.
pub fn remaining_cities_of_owner(
    old_owner: i64,
    cities_after: &[PlunderCity],
) -> Vec<&PlunderCity> {
    cities_after
        .iter()
        .filter(|c| c.owner_id == old_owner)
        .collect()
}

/// Wynik `transferWholeEstateToWinner` (web `EstateTransferResult`).
#[derive(Debug, Clone, PartialEq)]
pub struct EstateTransferResult {
    pub skarbiec_przejety: f64,
    pub praca_pool_przejeta: f64,
    pub nauka_przejeta: f64,
    pub zywnosc_przejeta: f64,
    pub zywnosc_utracona: f64,
    pub zywnosc_ofiary_razem: f64,
    pub surowce_przejete: BTreeMap<String, f64>,
}

/// Web `transferWholeEstateToWinner(oldOwner, newOwner, victimCities, access)`: skarbiec, pula pracy, surowce,
/// zywnosc (do pojemnosci zdobywcy, nadwyzka ginie), nauka. Ofiara zostaje wyzerowana.
pub fn transfer_whole_estate_to_winner<A: OwnerResourceAccess + ?Sized>(
    old_owner: i64,
    new_owner: i64,
    victim_cities: &[PlunderCity],
    access: &mut A,
) -> EstateTransferResult {
    // Pieniadze
    let skarbiec = access.get_treasury(old_owner);
    if skarbiec > 0.0 {
        let v = access.get_treasury(new_owner) + skarbiec;
        access.set_treasury(new_owner, v);
    }
    access.set_treasury(old_owner, 0.0);

    // Pula pracy
    let praca = access.get_praca_pool(old_owner);
    if praca > 0.0 {
        let v = access.get_praca_pool(new_owner) + praca;
        access.set_praca_pool(new_owner, v);
    }
    access.set_praca_pool(old_owner, 0.0);

    // Surowce: magazyn panstwa = suma magazynow miast; wartosci calkowite (floor), tylko > 0
    let mut surowce: BTreeMap<String, f64> = BTreeMap::new();
    for c in victim_cities {
        for (key, raw) in &c.surowce {
            let v = raw.floor();
            if v > 0.0 {
                *surowce.entry(key.clone()).or_insert(0.0) += v;
            }
        }
    }

    // Zywnosc Spichlerza: do pojemnosci zwyciezcy
    let mut zywnosc_przejeta = 0.0;
    let mut zywnosc_utracona = 0.0;
    let mut zywnosc_ofiary_razem = 0.0;
    if access.food_supported() {
        zywnosc_ofiary_razem = js_max0(access.get_food_reserve(old_owner).floor());
        if zywnosc_ofiary_razem > 0.0 {
            let winner_food = access.get_food_reserve(new_owner);
            let room = match access.get_food_capacity(new_owner) {
                Some(cap) if cap.is_finite() && cap > 0.0 => js_max0((cap - winner_food).floor()),
                _ => f64::INFINITY,
            };
            zywnosc_przejeta = zywnosc_ofiary_razem.min(room);
            zywnosc_utracona = zywnosc_ofiary_razem - zywnosc_przejeta;
            if zywnosc_przejeta > 0.0 {
                access.set_food_reserve(new_owner, winner_food + zywnosc_przejeta);
            }
        }
        access.set_food_reserve(old_owner, 0.0);
    }

    // Nauka
    let nauka = access.get_nauka_pool(old_owner);
    if nauka > 0.0 {
        let v = access.get_nauka_pool(new_owner) + nauka;
        access.set_nauka_pool(new_owner, v);
    }
    access.set_nauka_pool(old_owner, 0.0);

    EstateTransferResult {
        skarbiec_przejety: skarbiec,
        praca_pool_przejeta: praca,
        nauka_przejeta: nauka,
        zywnosc_przejeta,
        zywnosc_utracona,
        zywnosc_ofiary_razem,
        surowce_przejete: surowce,
    }
}

/// Zdarzenie przejecia stolicy (web `CapitalCaptureEventKind`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CaptureEvent {
    /// `przejecie_stolicy`: cywilizacja przezywa (ma inne miasta).
    PrzejecieStolicy,
    /// `eliminacja`: przejete zostalo ostatnie miasto.
    Eliminacja,
}

/// Web `CapitalCaptureOutcome`.
#[derive(Debug, Clone, PartialEq)]
pub struct CapitalCaptureOutcome {
    pub event: CaptureEvent,
    pub old_owner: i64,
    pub new_owner: i64,
    pub skarbiec_przejety: f64,
    pub nauka_przejeta: f64,
    pub praca_pool_przejeta: f64,
    pub techs_skopiowane: Vec<String>,
    pub zywnosc_przejeta: f64,
    pub zywnosc_utracona: f64,
    pub zywnosc_ofiary_razem: f64,
    pub surowce_przejete: BTreeMap<String, f64>,
    pub new_capital_id_for_old_owner: Option<String>,
    pub eliminacja: bool,
}

/// Web `applyCapitalCapturePlunder(city, oldOwner, newOwner, citiesAfterCapture, access, designatedCapitalId?)`.
/// Wolane PO zmianie `ownerId` miasta. `None` = przejete miasto nie bylo stolica oldOwner.
pub fn apply_capital_capture_plunder<A: OwnerResourceAccess + ?Sized>(
    city: &PlunderCity,
    old_owner: i64,
    new_owner: i64,
    cities_after: &[PlunderCity],
    access: &mut A,
    designated: Option<&str>,
) -> Option<CapitalCaptureOutcome> {
    if !was_capital_of_old_owner(city, old_owner, cities_after, designated) {
        return None;
    }
    let remaining = remaining_cities_of_owner(old_owner, cities_after);
    let eliminacja = remaining.is_empty();
    // Sukcesja: najstarsze z POZOSTALYCH miast oldOwner (ten sam wynik co oldest po `remaining`).
    let new_capital_id_for_old_owner = if eliminacja {
        None
    } else {
        oldest_city_of_owner(old_owner, cities_after).map(|c| c.id.clone())
    };

    if eliminacja {
        // Zdarzenie 2: caly majatek panstwa (jeden rdzen) + techy zwyciezcy.
        let t = transfer_whole_estate_to_winner(
            old_owner,
            new_owner,
            std::slice::from_ref(city),
            access,
        );
        let winner_techs = access.get_researched_techs(new_owner);
        let loser_techs = access.get_researched_techs(old_owner);
        let missing: Vec<String> = loser_techs
            .iter()
            .filter(|id| !winner_techs.contains(*id))
            .cloned()
            .collect();
        if !missing.is_empty() {
            access.add_researched_techs(new_owner, &missing);
        }
        Some(CapitalCaptureOutcome {
            event: CaptureEvent::Eliminacja,
            old_owner,
            new_owner,
            skarbiec_przejety: t.skarbiec_przejety,
            nauka_przejeta: t.nauka_przejeta,
            praca_pool_przejeta: t.praca_pool_przejeta,
            techs_skopiowane: missing,
            zywnosc_przejeta: t.zywnosc_przejeta,
            zywnosc_utracona: t.zywnosc_utracona,
            zywnosc_ofiary_razem: t.zywnosc_ofiary_razem,
            surowce_przejete: t.surowce_przejete,
            new_capital_id_for_old_owner,
            eliminacja: true,
        })
    } else {
        // Zdarzenie 1: skarbiec -> zwyciezca, pula pracy przepada (bez transferu).
        let skarbiec = access.get_treasury(old_owner);
        if skarbiec > 0.0 {
            let v = access.get_treasury(new_owner) + skarbiec;
            access.set_treasury(new_owner, v);
        }
        access.set_treasury(old_owner, 0.0);
        access.set_praca_pool(old_owner, 0.0);
        Some(CapitalCaptureOutcome {
            event: CaptureEvent::PrzejecieStolicy,
            old_owner,
            new_owner,
            skarbiec_przejety: skarbiec,
            nauka_przejeta: 0.0,
            praca_pool_przejeta: 0.0,
            techs_skopiowane: Vec::new(),
            zywnosc_przejeta: 0.0,
            zywnosc_utracona: 0.0,
            zywnosc_ofiary_razem: 0.0,
            surowce_przejete: BTreeMap::new(),
            new_capital_id_for_old_owner,
            eliminacja: false,
        })
    }
}

/// Web `barbarianCapturedPowerGain(lostPower, barbCaptor)`: barbarzyncy nie dziedzicza Power ofiary.
pub fn barbarian_captured_power_gain(lost_power: f64, barb_captor: bool) -> f64 {
    if barb_captor {
        0.0
    } else {
        lost_power
    }
}

/// Web `applyBarbarianAwareCapitalCapturePlunder(...)`: barbarzynca jako ofiara -> `None`; barbarzynca jako
/// zdobywca -> zapisy do zdobywcy no-opowane (`BarbarianCaptorAccess`).
pub fn apply_barbarian_aware_capital_capture_plunder<
    A: OwnerResourceAccess + ?Sized,
    F: Fn(i64) -> bool,
>(
    city: &PlunderCity,
    old_owner: i64,
    new_owner: i64,
    cities_after: &[PlunderCity],
    access: &mut A,
    designated: Option<&str>,
    is_barbarian_owner: F,
) -> Option<CapitalCaptureOutcome> {
    if is_barbarian_owner(old_owner) {
        return None;
    }
    if is_barbarian_owner(new_owner) {
        let mut wrapped = BarbarianCaptorAccess {
            base: access,
            captor: new_owner,
        };
        apply_capital_capture_plunder(
            city,
            old_owner,
            new_owner,
            cities_after,
            &mut wrapped,
            designated,
        )
    } else {
        apply_capital_capture_plunder(city, old_owner, new_owner, cities_after, access, designated)
    }
}

// ---------------------------------------------------------------------------------------------------------------
// Glue main.ts: runCapitalCapturePlunder
// ---------------------------------------------------------------------------------------------------------------

/// Granice UI (patrz naglowek). Implementacja w grze lub w testach zwraca etykiety tego samego ksztaltu, co atrapy
/// w generatorze (`tests/p6_siege_capital_plunder_gen.mjs`).
pub trait PlunderLabels {
    fn civ_label(&self, owner_id: i64) -> String;
    fn moc_label(&self) -> String;
    /// Web `civDisplayNameForOwner(owner)`; `None` = `null`/`undefined` (wtedy wolany jest `civ_label`).
    fn civ_display_name(&self, owner_id: i64) -> Option<String>;
    fn civ_key_for_owner_id(&self, owner_id: i64) -> String;
    /// Web `captureReportOneLine(rows)`; argument = `kind` wierszy.
    fn one_line(&self, kind: &str) -> String;
    /// Web `buildSpectacleForElimination(...)`: wartosc zapisywana w `eliminationSpectacleByLabel`.
    fn spectacle(&self, label: &str) -> String;
}

/// Stan zapisywany przez `runCapitalCapturePlunder` (web: `capitalCityIdByOwner`, `zdobyczePowerByOwner`,
/// `eliminationSpectacleByLabel`, `capitalCaptureReportSlot`).
#[derive(Debug, Clone, Default, PartialEq)]
pub struct PlunderState {
    pub capital_city_id_by_owner: BTreeMap<i64, String>,
    pub zdobycze_power_by_owner: BTreeMap<i64, f64>,
    pub elimination_spectacle_by_label: BTreeMap<String, String>,
    /// `(kind, oneLine)` wiersza raportu; web `capitalCaptureReportSlot`.
    pub capital_capture_report_slot: Option<(String, String)>,
}

/// Wejscie `runCapitalCapturePlunder(city, oldOwner, newOwner)` wraz z wartosciami, ktore web czyta z
/// otoczenia (`cities`, `cityBuilt`, `buildObjectivePowerForOwner`, `shouldShowPlayerTriumph...`).
pub struct PlunderInput<'a> {
    pub city: &'a PlunderCity,
    pub old_owner: i64,
    pub new_owner: i64,
    /// Web `cities` (po zmianie ownerId zdobytego miasta).
    pub cities: &'a [PlunderCity],
    /// Web `(cityBuilt.get(city.id) ?? []).length`.
    pub building_count: usize,
    /// Web `buildObjectivePowerForOwner(oldOwner).power` (liczone tylko w galezi eliminacji).
    ///
    /// KONTRAKT KOLEJNOSCI (pin 07d2fbd72, gra/src/main.ts): wolajacy musi policzyc te wartosc PO
    /// `applyBarbarianAwareCapitalCapturePlunder` (main.ts:35611), a PRZED `eliminateOwner(oldOwner)`
    /// (main.ts:35769) - tj. w punkcie, w ktorym `buildObjectivePowerForOwner(oldOwner)` (main.ts:35672)
    /// jeszcze widzi stan ofiary po transferze miasta. Rust tej kolejnosci NIE egzekwuje (wartosc jest
    /// wejsciem); egzekwuje ja wiring W8 (osobny temat).
    pub lost_power: f64,
    /// Web `shouldShowPlayerTriumphCityStateUnification(...)` (wolane tylko gdy `newOwner === 0`).
    /// Wartosc wejsciowa: detekcja zjednoczenia Grecji (`typCityCopyOwners`, `aiOwnerCivMap`) jest poza modulem.
    pub triumph_unification: bool,
}

/// Zwrot eliminacji dla gracza (web `{ eliminatedCivLabel, eliminatedDetails }`).
#[derive(Debug, Clone, PartialEq)]
pub struct EliminationDetails {
    pub eliminated_civ_label: String,
    pub eliminated_details: String,
}

fn ui_call(name: &str, args: Vec<Value>) -> Value {
    json!({ "fn": name, "args": args })
}

fn rows_ref(kind: &str) -> Value {
    json!({ "kind": kind })
}

/// Web `runCapitalCapturePlunder(city, oldOwner, newOwner)` (main.ts:35558). Zwraca `(zwrot, ui_calls)`.
/// `ui_calls` = kolejne wolania atrap UI/efektow ubocznych w kolejnosci web, z argumentami.
pub fn run_capital_capture_plunder<A: OwnerResourceAccess + ?Sized, L: PlunderLabels>(
    input: &PlunderInput<'_>,
    state: &mut PlunderState,
    access: &mut A,
    labels: &L,
) -> (Option<EliminationDetails>, Vec<Value>) {
    let mut ui: Vec<Value> = Vec::new();
    let old = input.old_owner;
    let new = input.new_owner;
    let city = input.city;
    state.capital_capture_report_slot = None;

    // Rebelia (-99): nie jest realna cywilizacja. Komunikat tylko gdy zdobywca != gracz.
    if old == REBEL_FACTION_OWNER_ID {
        if new != 0 {
            let civ_new = labels.civ_label(new);
            ui.push(ui_call("civLabelForOwner", vec![json!(new)]));
            let msg = format!(
                "{}: dawne zbuntowane miasto przejęte przez {}.",
                city.name, civ_new
            );
            ui.push(ui_call("showHintMessage", vec![json!(msg), json!(5000)]));
        }
        return (None, ui);
    }

    let designated = state.capital_city_id_by_owner.get(&old).map(String::as_str);
    let barb_captor = is_barbarian(new);
    let outcome = apply_barbarian_aware_capital_capture_plunder(
        city,
        old,
        new,
        input.cities,
        access,
        designated,
        is_barbarian,
    );
    let Some(outcome) = outcome else {
        return (None, ui);
    };

    if outcome.event == CaptureEvent::PrzejecieStolicy {
        // Sukcesja: nowa stolica oldOwner = najstarsze z pozostalych miast (lub brak wpisu).
        match &outcome.new_capital_id_for_old_owner {
            Some(id) => {
                state.capital_city_id_by_owner.insert(old, id.clone());
            }
            None => {
                state.capital_city_id_by_owner.remove(&old);
            }
        }
        let kind = "stolica";
        let moc = labels.moc_label();
        ui.push(ui_call("mocLabel", vec![]));
        let rows_args = json!({
            "kind": kind,
            "mocEtykieta": moc,
            "ludnosc": input.city.population.floor().max(0.0),
            "budynki": input.building_count,
            "zloto": outcome.skarbiec_przejety.floor(),
            "nauka": 0,
            "technologie": 0,
            "moc": 0,
            "barbarzyncaZdobywca": barb_captor,
            "surowce": input.city.surowce,
            "pracaPoolPrzejeta": 0,
        });
        ui.push(ui_call("buildCityCaptureReportRows", vec![rows_args]));
        let one_line = labels.one_line(kind);
        ui.push(ui_call("captureReportOneLine", vec![rows_ref(kind)]));
        state.capital_capture_report_slot = Some((kind.to_string(), one_line.clone()));
        let victim_label = labels.civ_label(old);
        ui.push(ui_call("civLabelForOwner", vec![json!(old)]));
        let captor_label = labels.civ_label(new);
        ui.push(ui_call("civLabelForOwner", vec![json!(new)]));
        ui.push(ui_call(
            // Efekt UI (Q7): store `siege_capture_events::CaptureEventStore::record_city_capture_event`.
            "recordCityCaptureEvent",
            vec![json!({
                "cityId": city.id,
                "cityName": city.name,
                "oldOwner": old,
                "newOwner": new,
                "rows": rows_ref(kind),
                "victimLabel": victim_label,
                "captorLabel": captor_label,
            })],
        ));
        let civ_old = labels.civ_label(old);
        ui.push(ui_call("civLabelForOwner", vec![json!(old)]));
        let civ_new = labels.civ_label(new);
        ui.push(ui_call("civLabelForOwner", vec![json!(new)]));
        let msg = format!(
            "{}: stolica {} przejęta przez {}. {}",
            city.name, civ_old, civ_new, one_line
        );
        ui.push(ui_call("showHintMessage", vec![json!(msg), json!(5000)]));
        ui.push(ui_call("markCityStateDirty", vec![]));
        return (None, ui);
    }

    // Zdobycze Power: barbarzyncy nie dziedzicza Power ofiary.
    ui.push(ui_call("buildObjectivePowerForOwner", vec![json!(old)]));
    let lost_power = input.lost_power;
    let power_gain = barbarian_captured_power_gain(lost_power, barb_captor);
    if power_gain > 0.0 {
        let prev = state
            .zdobycze_power_by_owner
            .get(&new)
            .copied()
            .unwrap_or(0.0);
        state.zdobycze_power_by_owner.insert(new, prev + power_gain);
    }
    let eliminated_civ_label = labels.civ_label(old);
    ui.push(ui_call("civLabelForOwner", vec![json!(old)]));
    let kind = "eliminacja";
    let moc = labels.moc_label();
    ui.push(ui_call("mocLabel", vec![]));
    let rows_args = json!({
        "kind": kind,
        "mocEtykieta": moc,
        "ludnosc": input.city.population.floor().max(0.0),
        "budynki": input.building_count,
        "zloto": outcome.skarbiec_przejety.floor(),
        "nauka": outcome.nauka_przejeta.floor(),
        "technologie": outcome.techs_skopiowane.len(),
        "moc": power_gain,
        "barbarzyncaZdobywca": barb_captor,
        "surowce": outcome.surowce_przejete,
        "zywnoscPrzejeta": outcome.zywnosc_przejeta,
        "zywnoscUtracona": outcome.zywnosc_utracona,
        "zywnoscOfiaryRazem": outcome.zywnosc_ofiary_razem,
        "pracaPoolPrzejeta": outcome.praca_pool_przejeta.floor(),
    });
    ui.push(ui_call("buildCityCaptureReportRows", vec![rows_args]));
    let eliminated_details = labels.one_line(kind);
    ui.push(ui_call("captureReportOneLine", vec![rows_ref(kind)]));
    state.capital_capture_report_slot = Some((kind.to_string(), eliminated_details.clone()));
    let spectacle = labels.spectacle(&eliminated_civ_label);
    ui.push(ui_call(
        "buildSpectacleForElimination",
        vec![
            json!({ "id": city.id }),
            json!(old),
            json!(new),
            json!(eliminated_civ_label),
            json!(lost_power),
        ],
    ));
    state
        .elimination_spectacle_by_label
        .insert(eliminated_civ_label.clone(), spectacle);
    let captor_label = labels.civ_label(new);
    ui.push(ui_call("civLabelForOwner", vec![json!(new)]));
    ui.push(ui_call(
        // Efekt UI (Q7): store `siege_capture_events::CaptureEventStore::record_city_capture_event`.
        "recordCityCaptureEvent",
        vec![json!({
            "cityId": city.id,
            "cityName": city.name,
            "oldOwner": old,
            "newOwner": new,
            "rows": rows_ref(kind),
            "victimLabel": eliminated_civ_label,
            "captorLabel": captor_label,
            "eliminatedCivLabel": eliminated_civ_label,
        })],
    ));
    let is_triumph = if new == 0 {
        let key = labels.civ_key_for_owner_id(0);
        ui.push(ui_call("civKeyForOwnerId", vec![json!(0)]));
        let cities_ids: Vec<Value> = input.cities.iter().map(|c| json!({ "id": c.id })).collect();
        // Web przekazuje realne `typCityCopyOwners` (Set) i `aiOwnerCivMap` (Map) (main.ts:35734-35741).
        // Modul ich nie posiada; tu rejestrowane sa `null` jak w atrapie generatora (ta sama granica co
        // `triumph_unification`). Vektory potwierdzaja kolejnosc i pozostale argumenty, NIE zawartosc tych kolekcji.
        ui.push(ui_call(
            "shouldShowPlayerTriumphCityStateUnification",
            vec![json!({
                "newOwner": new,
                "oldOwner": old,
                "playerCivKey": key,
                "typCityCopyOwners": null,
                "aiOwnerCivMap": null,
                "cities": cities_ids,
            })],
        ));
        input.triumph_unification
    } else {
        false
    };
    if is_triumph {
        let triumph_label = match labels.civ_display_name(0) {
            Some(name) => {
                ui.push(ui_call("civDisplayNameForOwner", vec![json!(0)]));
                name
            }
            None => {
                ui.push(ui_call("civDisplayNameForOwner", vec![json!(0)]));
                ui.push(ui_call("civLabelForOwner", vec![json!(0)]));
                labels.civ_label(0)
            }
        };
        ui.push(ui_call(
            "showTriumphCityStateNotice",
            vec![json!({ "civLabel": triumph_label, "cityName": city.name })],
        ));
    } else if new != 0 && old != 0 {
        ui.push(ui_call(
            // Efekt UI (Q7): store `siege_capture_events::CaptureEventStore::record_civ_elim_event`.
            "recordCivElimEvent",
            vec![
                json!(old),
                json!(eliminated_civ_label),
                json!(eliminated_details),
                json!("podboj"),
            ],
        ));
    }
    ui.push(ui_call("eliminateOwner", vec![json!(old)]));
    ui.push(ui_call("markCityStateDirty", vec![]));
    let ret = if new == 0 && !is_triumph {
        Some(EliminationDetails {
            eliminated_civ_label,
            eliminated_details,
        })
    } else {
        None
    };
    (ret, ui)
}
