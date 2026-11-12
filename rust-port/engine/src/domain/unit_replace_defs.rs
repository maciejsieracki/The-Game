//! P6-UNIT-REPLACE-L3-DEFS (dlug L-3, etap 3) + P6-UNIT-REPLACE-L3-KOSZT (etap 4): produkcyjne
//! zrodlo tabeli `ReplaceUnitDef`.
//!
//! Zakres tego modulu:
//! - `category_of`: 1:1 port web `categoryOf(name, role, isSuper, typ)` z
//!   `gra/src/units/setup.ts` (pin 07d2fbd72, linie 239-311: `normalizeForMatch` od linii 239,
//!   `categoryOf` linie 246-311).
//!   Funkcja czysta; wektory z pinu: `tests/p6_unit_replace_defs_vectors/`.
//! - `production_replace_defs_with` / `production_replace_defs_for_civ`: tabela `ReplaceUnitDef`
//!   zbudowana z osadzonego `rust-port/engine/data/units.json` (kategoria, `health`, `Epoka`, `Surowiec`,
//!   `Surowiec (ilość)`, `Typ`) oraz z tabeli `derived/unit-gold-costs.json` (koszt bazowy po skali epoki).
//!   Koszt Pieniadza = `unit_replace_cost::replace_money_cost` (web `replaceUnitMoneyCost`: markery
//!   cywilizacji, tempo, trudnosc). HP bazowe = `health` (web `unitHealth`).

use std::collections::BTreeMap;
use std::sync::OnceLock;

use crate::data::civilizations::{parse_civ_matrix, CivMatrixFile};
use crate::data::derived::parse_unit_gold_costs;
use crate::data::units_combat::{parse_units, UnitRecord};
use crate::domain::building_costs::p6_7b::{EpochInput, UnitStockCostSource};
use crate::domain::building_costs::repin_b2::civ_production_cost_markers;
use crate::domain::civ_bonuses::strip_diacritics;
use crate::domain::recruitment::army_merge::UnitCostPace;
use crate::domain::types::Difficulty;
use crate::domain::unit_replace_cost::{replace_money_cost, ReplaceCostContext};
use crate::domain::unit_replace_wiring::ReplaceUnitDef;

/// Web `normalizeForMatch`: NFD, usuniecie U+0300-U+036F, `Ł`/`ł` -> `l`, male litery.
/// `strip_diacritics` robi NFD + usuniecie znakow laczacych + male litery (ł zostaje),
/// wiec kolejnosc (mapa ł -> l po lowercase) daje ten sam wynik co web.
fn normalize_for_match(s: &str) -> String {
    strip_diacritics(s).replace('ł', "l")
}

/// Port web `categoryOf(name, role, isSuper, typ)` (gra/src/units/setup.ts).
///
/// `typ` = pole `Typ` z units.json; `None` i `Some("")` sa rownowazne (JS: falsy). Fallback po `Typ`
/// celowo pomija `Offensive` (dwie rodziny broni). Zwraca jedna z: `super`, `osadnik`, `robotnik`,
/// `zwiadowca`, `galera`, `rydwan`, `konnica`, `falanga`, `legionista`, `wlocznik`, `miecznik`,
/// `lucznik`, `procarz`, `oszczepnik`, `maczuga`, `topor`, `obleznicza`, `domyslny`.
pub fn category_of(name: &str, role: &str, is_super: bool, typ: Option<&str>) -> &'static str {
    if is_super {
        return "super";
    }
    let n = normalize_for_match(name);
    let r = normalize_for_match(role);
    let any_kw = |kws: &[&str]| kws.iter().any(|kw| n.contains(kw) || r.contains(kw));

    // Wsparcie cywilne najpierw (nigdy nie wpada w 'domyslny').
    if n.contains("osadnik") || r.contains("osadnik") {
        return "osadnik";
    }
    if n.contains("robotnik")
        || n.contains("worker")
        || n.contains("budown")
        || r.contains("robotnik")
    {
        return "robotnik";
    }
    if n.contains("zwiadowca")
        || n.contains("scout")
        || n.contains("zwiad")
        || r.contains("zwiadowca")
    {
        return "zwiadowca";
    }
    // Morskie.
    if n.contains("galera")
        || n.contains("galley")
        || n.contains("okret")
        || n.contains("statek")
        || r.contains("morsk")
        || r.contains("naval")
    {
        return "galera";
    }
    // Rydwany.
    if n.contains("rydwan")
        || n.contains("chariot")
        || r.contains("rydwan")
        || r.contains("chariot")
    {
        return "rydwan";
    }
    if any_kw(&[
        "konnic", "jezdz", "jazd", "kawaler", "rycerz", "cavalry", "horse",
    ]) {
        return "konnica";
    }
    // Falanga przed ogolnym wlocznikiem.
    if n.contains("falanga") || n.contains("hoplit") || n.contains("phalanx") {
        return "falanga";
    }
    // Legionista przed ogolnym mieczem.
    if n.contains("legionist") || n.contains("hastati") || n.contains("legion") {
        return "legionista";
    }
    if any_kw(&["wloczn", "pikinier", "spear", "impi"]) {
        return "wlocznik";
    }
    if any_kw(&["miecz", "sword", "gladi", "khopesh"]) {
        return "miecznik";
    }
    if any_kw(&["luczn", "archer", "kusznik", "crossbow"]) {
        return "lucznik";
    }
    if any_kw(&["procarz", "sling"]) {
        return "procarz";
    }
    if any_kw(&["oszczep", "javelin", "atlatl", "estolic"]) {
        return "oszczepnik";
    }
    if any_kw(&["maczug", "chaska", "club", "mace", "champi"]) {
        return "maczuga";
    }
    if any_kw(&["topor", "axe"]) {
        return "topor";
    }
    // Machiny oblezane (po nazwie albo po roli).
    if any_kw(&[
        "taran",
        "katapult",
        "oblezn",
        "siege",
        "battering",
        "trebuchet",
    ]) {
        return "obleznicza";
    }
    // Wyjatek wprost z noty `Uwagi` (Wojownik tyrreński = TOPOR/tasak).
    if n.contains("tyrren") {
        return "topor";
    }
    // Fallback po `Typ` (JS: `if (typ)` - pusty napis jest falsy).
    if let Some(t) = typ.filter(|t| !t.is_empty()) {
        match normalize_for_match(t).as_str() {
            "swordsman" => return "miecznik",
            "spearman" => return "wlocznik",
            "falangite" => return "falanga",
            "mount" => return "konnica",
            "distance" => return "lucznik",
            "slinger" => return "procarz",
            "naval" => return "galera",
            "siege" => return "obleznicza",
            _ => {}
        }
    }
    "domyslny"
}

/// Zrodlo tabeli produkcyjnej (do dokumentacji i raportow).
pub const PRODUCTION_DEFS_SOURCE: &str =
    "units.json (Jednostka, Rola (linia), Super-jednostka, Typ, health, Epoka, Surowiec, Surowiec (ilość)) \
     + derived/unit-gold-costs.json (koszt bazowy Pieniądz po skali epoki) \
     + unit_replace_cost (markery cywilizacji, tempo, trudnosc = web replaceUnitMoneyCost)";

/// Dane wejsciowe tabeli, parsowane raz: rekordy units.json, koszt bazowy i macierz cywilizacji.
struct ReplaceSource {
    records: Vec<UnitRecord>,
    gold_base: BTreeMap<String, f64>,
    civ_matrix: CivMatrixFile,
}

fn replace_source() -> &'static ReplaceSource {
    static SOURCE: OnceLock<ReplaceSource> = OnceLock::new();
    SOURCE.get_or_init(|| {
        let records = parse_units().expect("embedded units.json must parse");
        let gold = parse_unit_gold_costs().expect("embedded derived gold table must parse");
        let gold_base = gold
            .wiersze
            .iter()
            .map(|row| (row.jednostka.clone(), f64::from(row.pieniadz_koszt)))
            .collect();
        let civ_matrix = parse_civ_matrix().expect("embedded civ-matrix.json must parse");
        ReplaceSource {
            records,
            gold_base,
            civ_matrix,
        }
    })
}

/// Produkcyjna tabela `ReplaceUnitDef` dla wlasciciela z danym kontekstem kosztu (web
/// `replaceUnitMoneyCost` dla tego samego stanu). `money_cost` = pelny koszt Pieniadza po markerach,
/// tempie i trudnosci; `max_hp` = bazowe `health` (web `unitHealth`), bez bonusow jednostki.
/// Panikuje tylko wtedy, gdy osadzone dane nie parsuja albo brakuje kosztu bazowego jednostki.
pub fn production_replace_defs_with(
    ctx: &ReplaceCostContext<'_>,
) -> BTreeMap<String, ReplaceUnitDef> {
    let source = replace_source();
    source
        .records
        .iter()
        .map(|record| {
            let base = *source
                .gold_base
                .get(record.jednostka.as_str())
                .unwrap_or_else(|| panic!("derived gold table lacks {}", record.jednostka));
            let def = ReplaceUnitDef {
                category: category_of(
                    &record.jednostka,
                    &record.rola_linia,
                    record.super_jednostka == "TAK",
                    Some(&record.typ),
                )
                .to_owned(),
                money_cost: replace_money_cost(base, &record.jednostka, ctx),
                stock_source: Some(stock_source_of(record)),
                max_hp: record.health_lc as f64,
            };
            (record.jednostka.clone(), def)
        })
        .collect()
}

/// Produkcyjna tabela dla wlasciciela gracza (owner 0) z cywilizacja `civ_key`, tempem `pace_key`
/// (klucz `unit-cost-tempo.json`: `niski` / `normalny` / `wysoki`) i trudnoscia `difficulty`.
/// Markery: web `civBonusyForOwnerId(0)` -> `civProductionCostBonusyForCivKey`; brak wiersza
/// macierzy dla klucza = brak markerow (jak web).
pub fn production_replace_defs_for_civ(
    civ_key: &str,
    pace_key: &str,
    difficulty: Difficulty,
) -> BTreeMap<String, ReplaceUnitDef> {
    let markers = civ_production_cost_markers(&replace_source().civ_matrix, civ_key);
    production_replace_defs_with(&ReplaceCostContext {
        markers: &markers,
        pace: Some(UnitCostPace::Key(pace_key)),
        owner_id: 0,
        difficulty,
    })
}

/// Koszt bazowy jednostki po skali epoki z derived/unit-gold-costs.json (przed markerami, tempem i
/// trudnoscia). Sluzy testom parytetu do wykrycia rozbieznosci DANYCH (baza Rust vs pin), `None` = brak.
pub fn production_base_gold(unit: &str) -> Option<f64> {
    replace_source().gold_base.get(unit).copied()
}

/// Web `unitStockCost(lookupUnitDef(newTypeId))`: pola surowcowe z units.json.
fn stock_source_of(record: &UnitRecord) -> UnitStockCostSource {
    UnitStockCostSource {
        jednostka: Some(record.jednostka.clone()),
        typ: Some(record.typ.clone()),
        epoka: EpochInput::Text(record.epoka.clone()),
        surowiec: record.surowiec.clone(),
        surowiec_ilosc: Some(record.surowiec_ilosc as f64),
    }
}
