//! P6.1D: bonusy cywilizacji (web `gra/src/game/civ-bonuses.ts`, pin `edb8fb56`).
//!
//! Port 1:1 logiki: kategoria bojowa jednostki, dopasowanie `cel`, warunki kontekstu,
//! sumowanie mnozników statystyk, generowanie wpisow z macierzy cywilizacji, mnozniki
//! ruchu/zasiegu/oblezenia/muru oraz znizka kosztu budynkow.
//!
//! Liczby balansowe, identyfikatory parametrow macierzy i reguly routingu zyja w tabelach
//! `data/derived/civ-bonus-*.json` (edytowalne). W kodzie zostaja wylacznie:
//! - dyskryminatory enumeracyjne danych (`walka`, `bonus_obrona`, `jednostka_specjalna`,
//!   kategorie jednostek) - nazwane stale, nie wartosci balansowe;
//! - tokeny dopasowania tekstu (opisy i nazwy po polsku, bez polskich znakow) - logika
//!   parsowania `opis`/`typNazwa`, w module `tok`.
//!
//! `civMatrixParam` (civ-matrix.ts) jest od P6.1E pelnym portem w [`super::civ_matrix`];
//! prywatny `matrix_param` tego modulu deleguje do `civ_matrix::civ_matrix_param`.

use std::collections::HashMap;

use crate::data::civilizations::{BonusyItem, CivMatrixFile, WartoscValue};
use crate::data::derived::{
    civ_bonus_diacritics, civ_bonus_matrix_specs, civ_bonus_rules, CivBonusStatRule,
};

/// Dyskryminatory danych bonusow (web: literaly porownywane w civ-bonuses.ts).
mod kind {
    pub const REALIZUJE_WALKA: &str = "walka";
    pub const TYP_JEDNOSTKA_SPECJALNA: &str = "jednostka_specjalna";
    pub const TYP_BONUS_OBRONA: &str = "bonus_obrona";
    pub const TYP_BONUS_WALKA: &str = "bonus_walka";

    pub const CAT_MORSKA: &str = "morska";
    pub const CAT_OBLEZENIE: &str = "obleczenie";
    pub const CAT_RYDWANY: &str = "rydwany";
    pub const CAT_KAWALERIA: &str = "kawaleria";
    pub const CAT_LUKOWNICY: &str = "lukownicy";
    pub const CAT_PIECHOTA: &str = "piechota";
}

/// Tokeny dopasowania tekstu (po `strip_diacritics`: male litery, bez diakrytykow poza `ł`).
mod tok {
    pub const ROLA_MORSKA: &str = "morska";
    pub const COUNTER_NAVAL: &str = "naval";
    pub const ROLA_OBLEZNICZA: [&str; 2] = ["oblez-nicza", "obleznicza"];
    pub const COUNTER_SIEGE: &str = "siege";
    pub const NAZWA_RYDWAN: &str = "rydwan";
    pub const NAZWA_KAWALERIA: [&str; 4] = ["konn", "kawaler", "husar", "stepow"];
    pub const ROLA_FLANKA: &str = "flanka";
    pub const NAZWA_FLANKA_KON: [&str; 2] = ["kon", "jezd"];
    pub const ROLA_DYSTANS: &str = "dystans";
    pub const NAZWA_LUKOWNICY: [&str; 4] = ["lucz", "kusz", "procar", "luk"];

    pub const CEL_PIECHOTA: &str = "piechota";
    pub const CEL_LUKOWNICY: [&str; 2] = ["lukownicy", "dystans"];
    pub const CEL_KAWALERIA: &str = "kawaleria";
    pub const CEL_RYDWANY: &str = "rydwany";
    pub const CEL_MORSKA: &str = "morska";
    pub const CEL_OBLEZENIE: [&str; 2] = ["obleczenie", "obleznicza"];
    pub const CEL_WSZYSTKO: &str = "wszystko";

    pub const TEREN_LAS: [&str; 3] = ["las", "dzungl", "gor"];
    pub const OPIS_LAS: [&str; 3] = ["les", "dzungl", "gorsk"];
    pub const OPIS_UDERZENI: &str = "uderzeni";
    pub const OPIS_SZARZ: &str = "szarz";
    pub const OPIS_LES: &str = "les";
    pub const OPIS_PIERWSZ: &str = "pierwsz";
    pub const OPIS_STARCIU: &str = "starciu";
    pub const OPIS_LUB: &str = " lub ";
    pub const OPIS_ZASADZK: &str = "zasadzk";

    pub const OPIS_ATAKU: &str = "ataku";
    pub const OPIS_ATAK_SPACJA: &str = " atak";
    pub const OPIS_ATAK: &str = "atak";
    pub const OPIS_UDERZEN: &str = "uderzen";
    pub const OPIS_PANCERZ: &str = "pancerz";
    pub const OPIS_OBRON: &str = "obron";
    pub const OPIS_KAWALER: &str = "kawaler";
    pub const OPIS_DYSTANS: &str = "dystans";
    pub const OPIS_LUCZ: &str = "lucz";
    pub const OPIS_RYDWAN: &str = "rydwan";
    pub const OPIS_HP: &str = "hp";
    pub const OPIS_HEALTH: &str = "health";
    pub const OPIS_CIEZKA_PIECHOTA: &str = "ciezka piechota";
}

/// Wartosc bonusu: liczba (ulamek) albo tekst/lista (web: `number | string | string[]`).
#[derive(Debug, Clone, PartialEq)]
pub enum BonusValue {
    Number(f64),
    Text(String),
    List(Vec<String>),
}

impl BonusValue {
    /// `typeof wartosc === 'number'`.
    pub fn as_number(&self) -> Option<f64> {
        match self {
            Self::Number(v) => Some(*v),
            _ => None,
        }
    }
}

/// Wpis bonusu cywilizacji (web `CivBonusEntry`).
#[derive(Debug, Clone, PartialEq)]
pub struct CivBonusEntry {
    pub typ: String,
    pub cel: String,
    pub wartosc: BonusValue,
    pub opis: Option<String>,
    pub realizuje: Option<String>,
    pub matrix_param_id: Option<String>,
}

impl From<&BonusyItem> for CivBonusEntry {
    /// Wpis z `civs.json` (bez `matrixParamId`; pole opisowe `opis` i `realizuje` zawsze obecne).
    fn from(item: &BonusyItem) -> Self {
        Self {
            typ: item.typ.clone(),
            cel: item.cel.clone(),
            wartosc: match &item.wartosc {
                WartoscValue::Float(v) => BonusValue::Number(*v),
                WartoscValue::List(list) => BonusValue::List(list.clone()),
            },
            opis: Some(item.opis.clone()),
            realizuje: Some(item.realizuje.clone()),
            matrix_param_id: None,
        }
    }
}

/// Ksztalt jednostki potrzebny do dopasowania bonusow (web `CivBonusUnitShape`).
#[derive(Debug, Clone, PartialEq)]
pub struct CivBonusUnitShape {
    pub typ_nazwa: String,
    pub rola: String,
    pub missile_attack: Option<f64>,
    pub counter_typ: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CombatSide {
    Attacker,
    Defender,
}

/// Kontekst walki (web `CivCombatContext`). Brak pola w webie (`undefined`) = `false`/pusty tekst.
#[derive(Debug, Clone, PartialEq)]
pub struct CivCombatContext {
    pub side: CombatSide,
    pub terrain: String,
    pub is_charge_round: bool,
    pub own_territory: bool,
    pub on_wall_walkway: bool,
    pub shallow_sea: bool,
}

impl CivCombatContext {
    pub fn new(side: CombatSide) -> Self {
        Self {
            side,
            terrain: String::new(),
            is_charge_round: false,
            own_territory: false,
            on_wall_walkway: false,
            shallow_sea: false,
        }
    }
}

/// Addytywne mnozniki statystyk: `final stat *= (1 + suma)` (web `CivStatMultipliers`).
#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct CivStatMultipliers {
    pub atk: f64,
    pub obrona: f64,
    pub pancerz: f64,
    pub uderzenie: f64,
    pub ranged_atk: f64,
    pub health: f64,
}

impl CivStatMultipliers {
    fn add(&mut self, stat: &str, v: f64) {
        match stat {
            "atk" => self.atk += v,
            "obrona" => self.obrona += v,
            "pancerz" => self.pancerz += v,
            "uderzenie" => self.uderzenie += v,
            "rangedAtk" => self.ranged_atk += v,
            "health" => self.health += v,
            other => panic!("civ-bonus-rules.json: nieznana statystyka {other}"),
        }
    }
}

fn diacritics_map() -> &'static HashMap<char, String> {
    static MAP: std::sync::OnceLock<HashMap<char, String>> = std::sync::OnceLock::new();
    MAP.get_or_init(|| {
        civ_bonus_diacritics()
            .mapa
            .iter()
            .map(|(k, v)| {
                let mut chars = k.chars();
                let c = chars
                    .next()
                    .expect("civ-bonus-diacritics.json: pusty klucz");
                assert!(
                    chars.next().is_none(),
                    "civ-bonus-diacritics.json: klucz musi byc jednym znakiem"
                );
                (c, v.clone())
            })
            .collect()
    })
}

/// Web `stripDiacritics`: NFD, usuniecie znakow laczacych U+0300-U+036F, male litery.
/// `ł` nie dekomponuje sie w NFD i zostaje `ł` (zachowanie weba).
/// Zakres tabeli: patrz `civ-bonus-diacritics.json` (Latin-1/Extended-A/B/Additional).
pub fn strip_diacritics(s: &str) -> String {
    let map = diacritics_map();
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        if ('\u{0300}'..='\u{036F}').contains(&c) {
            continue;
        }
        match map.get(&c) {
            Some(base) => out.push_str(base),
            None => out.push(c),
        }
    }
    out.to_lowercase()
}

fn contains_any(haystack: &str, tokens: &[&str]) -> bool {
    tokens.iter().any(|t| haystack.contains(t))
}

/// Kategoria bojowa jednostki do dopasowania pola `cel` w bonusie (web `unitCombatCategory`).
pub fn unit_combat_category(unit: &CivBonusUnitShape) -> &'static str {
    let n = strip_diacritics(&unit.typ_nazwa);
    let rola = strip_diacritics(&unit.rola);
    let counter = strip_diacritics(unit.counter_typ.as_deref().unwrap_or(""));

    if rola == tok::ROLA_MORSKA || counter == tok::COUNTER_NAVAL {
        return kind::CAT_MORSKA;
    }
    if tok::ROLA_OBLEZNICZA.contains(&rola.as_str()) || counter == tok::COUNTER_SIEGE {
        return kind::CAT_OBLEZENIE;
    }
    if n.contains(tok::NAZWA_RYDWAN) {
        return kind::CAT_RYDWANY;
    }
    if contains_any(&n, &tok::NAZWA_KAWALERIA)
        || (rola == tok::ROLA_FLANKA && contains_any(&n, &tok::NAZWA_FLANKA_KON))
    {
        return kind::CAT_KAWALERIA;
    }
    if rola == tok::ROLA_DYSTANS
        || contains_any(&n, &tok::NAZWA_LUKOWNICY)
        || unit.missile_attack.unwrap_or(0.0) > 0.0
    {
        return kind::CAT_LUKOWNICY;
    }
    kind::CAT_PIECHOTA
}

/// Dopasowanie kategorii jednostki do pola `cel` bonusu (web `unitMatchesCel`).
pub fn unit_matches_cel(unit: &CivBonusUnitShape, cel: &str) -> bool {
    let cat = unit_combat_category(unit);
    let c = strip_diacritics(cel);
    if c == tok::CEL_PIECHOTA {
        return cat == kind::CAT_PIECHOTA;
    }
    if tok::CEL_LUKOWNICY.contains(&c.as_str()) {
        return cat == kind::CAT_LUKOWNICY;
    }
    if c == tok::CEL_KAWALERIA {
        return cat == kind::CAT_KAWALERIA;
    }
    if c == tok::CEL_RYDWANY {
        return cat == kind::CAT_RYDWANY;
    }
    if c == tok::CEL_MORSKA {
        return cat == kind::CAT_MORSKA;
    }
    if tok::CEL_OBLEZENIE.contains(&c.as_str()) {
        return cat == kind::CAT_OBLEZENIE;
    }
    if c == tok::CEL_WSZYSTKO {
        return true;
    }
    cat == c
}

fn terrain_is_forest_or_jungle(terrain: &str) -> bool {
    contains_any(&strip_diacritics(terrain), &tok::TEREN_LAS)
}

fn opis_mentions_forest(opis: &str) -> bool {
    contains_any(&strip_diacritics(opis), &tok::OPIS_LAS)
}

fn opis_charge_only(opis: &str) -> bool {
    let o = strip_diacritics(opis);
    if o.contains(tok::OPIS_UDERZENI) && o.contains(tok::OPIS_SZARZ) {
        return true;
    }
    if o.contains(tok::OPIS_PIERWSZ) {
        return true;
    }
    if o.contains(tok::OPIS_SZARZ) && !o.contains(tok::OPIS_LES) {
        return true;
    }
    if o.contains(tok::OPIS_STARCIU) {
        return true;
    }
    false
}

fn opis_forest_or_charge(opis: &str) -> bool {
    let o = strip_diacritics(opis);
    o.contains(tok::OPIS_LUB)
        && opis_mentions_forest(opis)
        && (o.contains(tok::OPIS_PIERWSZ) || o.contains(tok::OPIS_ZASADZK))
}

/// Czy bonus dziala w danym kontekscie walki (web `bonusApplies`).
pub fn bonus_applies(b: &CivBonusEntry, unit: &CivBonusUnitShape, ctx: &CivCombatContext) -> bool {
    if b.realizuje.as_deref() != Some(kind::REALIZUJE_WALKA) {
        return false;
    }
    if b.typ == kind::TYP_JEDNOSTKA_SPECJALNA {
        return false;
    }
    if b.wartosc.as_number().is_none() {
        return false;
    }
    if !unit_matches_cel(unit, &b.cel) {
        return false;
    }

    let rules = &civ_bonus_rules().warunki_kontekstu;
    let opis = b.opis.as_deref().unwrap_or("");
    let terrain = ctx.terrain.as_str();
    let matrix_id = b.matrix_param_id.as_deref().unwrap_or("");

    if rules.terytorium_wlasne_id.iter().any(|id| id == matrix_id) && !ctx.own_territory {
        return false;
    }
    if matrix_id.contains(&rules.fragment_mur) && !ctx.on_wall_walkway {
        return false;
    }
    if matrix_id.contains(&rules.fragment_las) && !terrain_is_forest_or_jungle(terrain) {
        return false;
    }
    if matrix_id.contains(&rules.fragment_plytkie_morze) && !ctx.shallow_sea {
        return false;
    }
    if matrix_id.contains(&rules.fragment_runda_szarzy) && !ctx.is_charge_round {
        return false;
    }

    if opis_forest_or_charge(opis) {
        let forest_ok = !terrain.is_empty() && terrain_is_forest_or_jungle(terrain);
        let charge_ok = ctx.is_charge_round;
        return forest_ok || charge_ok;
    }

    if opis_mentions_forest(opis) && !terrain.is_empty() && !terrain_is_forest_or_jungle(terrain) {
        return false;
    }

    if opis_charge_only(opis) && !ctx.is_charge_round {
        return false;
    }

    if b.typ == kind::TYP_BONUS_OBRONA && ctx.side != CombatSide::Defender {
        return false;
    }

    true
}

fn matrix_id_matches_stat_rule(matrix_id: &str, rule: &CivBonusStatRule) -> bool {
    matrix_id.starts_with(&rule.prefiks)
        && rule
            .wyklucz_fragment
            .as_deref()
            .is_none_or(|fragment| !matrix_id.contains(fragment))
}

fn apply_walk_bonus(m: &mut CivStatMultipliers, b: &CivBonusEntry, side: CombatSide) {
    let Some(v) = b.wartosc.as_number() else {
        return;
    };
    let opis = strip_diacritics(b.opis.as_deref().unwrap_or(""));
    let matrix_id = b.matrix_param_id.as_deref().unwrap_or("");
    let rules = civ_bonus_rules();

    if rules
        .pomijane
        .prefiksy
        .iter()
        .any(|prefix| matrix_id.starts_with(prefix.as_str()))
        || rules.pomijane.id.iter().any(|id| id == matrix_id)
    {
        return;
    }
    for rule in &rules.statystyki {
        if matrix_id_matches_stat_rule(matrix_id, rule) {
            m.add(&rule.stat, v);
        }
    }
    if !matrix_id.is_empty() {
        return;
    }

    if b.typ == kind::TYP_BONUS_OBRONA {
        m.obrona += v;
        if opis.contains(tok::OPIS_HP)
            || opis.contains(tok::OPIS_HEALTH)
            || opis.contains(tok::OPIS_CIEZKA_PIECHOTA)
        {
            m.health += v;
        }
        if opis.contains(tok::OPIS_PANCERZ) {
            m.pancerz += v;
        }
        return;
    }

    if b.typ != kind::TYP_BONUS_WALKA {
        return;
    }

    // "Atak" przed "uderzeniu": opisy typu "pierwszym uderzeniu" to narracja szarzy, nie stat Uderzenie.
    if opis.contains(tok::OPIS_ATAKU)
        || (opis.contains(tok::OPIS_ATAK_SPACJA) && !opis.contains(tok::OPIS_UDERZEN))
    {
        m.atk += v;
        if opis.contains(tok::OPIS_PANCERZ) {
            m.pancerz += v;
        }
        if opis.contains(tok::OPIS_OBRON) && side == CombatSide::Defender {
            m.obrona += v;
        }
        return;
    }

    if opis.contains(tok::OPIS_UDERZENI)
        || (opis.contains(tok::OPIS_SZARZ) && opis.contains(tok::OPIS_KAWALER))
    {
        m.uderzenie += v;
        return;
    }
    if opis.contains(tok::OPIS_DYSTANS)
        || (opis.contains(tok::OPIS_LUCZ) && opis.contains(tok::OPIS_RYDWAN))
    {
        m.ranged_atk += v;
        return;
    }
    if opis.contains(tok::OPIS_HP) && opis.contains(tok::OPIS_OBRON) {
        m.health += v;
        m.obrona += v;
        return;
    }
    if opis.contains(tok::OPIS_PANCERZ) && !opis.contains(tok::OPIS_ATAK) {
        m.pancerz += v;
        return;
    }

    m.atk += v;
    if opis.contains(tok::OPIS_PANCERZ) {
        m.pancerz += v;
    }
    if opis.contains(tok::OPIS_OBRON) && side == CombatSide::Defender {
        m.obrona += v;
    }
}

/// Sumuje bonusy walki jako ulgi procentowe (0.2 = +20% do statu); pusta lista = zera
/// (web `civCombatStatMultipliers`, `bonusy` `undefined`/pusta).
pub fn civ_combat_stat_multipliers(
    bonusy: &[CivBonusEntry],
    unit: &CivBonusUnitShape,
    ctx: &CivCombatContext,
) -> CivStatMultipliers {
    let mut m = CivStatMultipliers::default();
    for b in bonusy {
        if !bonus_applies(b, unit, ctx) {
            continue;
        }
        apply_walk_bonus(&mut m, b, ctx.side);
    }
    m
}

/// Web `applyMultiplier`: `base * (1 + addFrac)`.
pub fn apply_multiplier(base: f64, add_frac: f64) -> f64 {
    base * (1.0 + add_frac)
}

/// `civMatrixParam` (civ-matrix.ts): od P6.1E pelny port zyje w [`super::civ_matrix`]; tu tylko
/// krotki alias dla wywolan wewnatrz modulu (semantyka bez zmian: wiersz po
/// `ikonaId`/`typCywilizacji`/`Cywilizacja`, potem `defaults`, potem 0).
fn matrix_param(matrix: &CivMatrixFile, civ_key: &str, param_id: &str) -> f64 {
    super::civ_matrix::civ_matrix_param(matrix, civ_key, param_id)
}

/// Wpisy bonusow walki/ekonomii wynikajace z macierzy cywilizacji dla klucza `civ_key`
/// (web `civMatrixBonusyForCivKey`). Kolejnosc i skład z tabeli `civ-bonus-matrix-specs.json`.
pub fn civ_matrix_bonusy_for_civ_key(matrix: &CivMatrixFile, civ_key: &str) -> Vec<CivBonusEntry> {
    let specs = civ_bonus_matrix_specs();
    let labels = &specs.etykiety;
    let mut out = Vec::new();

    for spec in &specs.spec_walka {
        if specs.wykluczone_g1.iter().any(|id| id == &spec.id) {
            continue;
        }
        let wartosc = matrix_param(matrix, civ_key, &spec.id);
        if wartosc != 0.0 {
            out.push(CivBonusEntry {
                typ: spec.typ.clone(),
                cel: spec.cel.clone(),
                wartosc: BonusValue::Number(wartosc),
                opis: Some(format!("{}{}", labels.opis_prefiks, spec.id)),
                realizuje: Some(labels.realizuje_walka.clone()),
                matrix_param_id: Some(spec.id.clone()),
            });
        }
    }
    for extra in &specs.parametry_dodatkowe {
        let wartosc = matrix_param(matrix, civ_key, &extra.id);
        let cel = extra
            .wyjatki_civ
            .iter()
            .find(|w| w.civ_key == civ_key)
            .map_or(extra.cel_domyslne.as_str(), |w| w.cel.as_str());
        if wartosc != 0.0 {
            out.push(CivBonusEntry {
                typ: labels.typ_walka.clone(),
                cel: cel.to_owned(),
                wartosc: BonusValue::Number(wartosc),
                opis: Some(format!("{}{}", labels.opis_prefiks, extra.id)),
                realizuje: Some(labels.realizuje_walka.clone()),
                matrix_param_id: Some(extra.id.clone()),
            });
        }
    }
    let recruitment = &specs.koszt_rekrutacji;
    let wartosc = matrix_param(matrix, civ_key, &recruitment.id);
    if wartosc != 0.0 {
        out.push(CivBonusEntry {
            typ: recruitment.typ.clone(),
            cel: recruitment.cel.clone(),
            wartosc: BonusValue::Number(wartosc),
            opis: Some(format!("{}{}", labels.opis_prefiks, recruitment.id)),
            realizuje: Some(labels.realizuje_ekonomia.clone()),
            matrix_param_id: Some(recruitment.id.clone()),
        });
    }
    out
}

fn matching_matrix_sum(
    bonusy: &[CivBonusEntry],
    unit: &CivBonusUnitShape,
    ids: &[String],
    terrain: &str,
    shallow_sea: bool,
) -> f64 {
    let rules = &civ_bonus_rules().warunki_kontekstu;
    let mut sum = 0.0;
    for b in bonusy {
        let matrix_id = b.matrix_param_id.as_deref().unwrap_or("");
        if matrix_id.is_empty()
            || !ids.iter().any(|id| id == matrix_id)
            || !unit_matches_cel(unit, &b.cel)
        {
            continue;
        }
        if matrix_id.contains(&rules.fragment_las) && !terrain_is_forest_or_jungle(terrain) {
            continue;
        }
        if matrix_id.contains(&rules.fragment_plytkie_morze) && !shallow_sea {
            continue;
        }
        if let Some(v) = b.wartosc.as_number() {
            sum += v;
        }
    }
    sum
}

/// Mnoznik ruchu (web `civMovementMultiplier`).
pub fn civ_movement_multiplier(
    bonusy: &[CivBonusEntry],
    unit: &CivBonusUnitShape,
    terrain: &str,
    shallow_sea: bool,
) -> f64 {
    1.0 + matching_matrix_sum(
        bonusy,
        unit,
        &civ_bonus_rules().grupy_mnoznikow.ruch,
        terrain,
        shallow_sea,
    )
}

/// Mnoznik zasiegu ataku (web `civAttackRangeMultiplier`).
pub fn civ_attack_range_multiplier(bonusy: &[CivBonusEntry], unit: &CivBonusUnitShape) -> f64 {
    1.0 + matching_matrix_sum(
        bonusy,
        unit,
        &civ_bonus_rules().grupy_mnoznikow.zasieg,
        "",
        false,
    )
}

/// Mnoznik ataku oblezniczego (web `civSiegeAttackMultiplier`).
pub fn civ_siege_attack_multiplier(bonusy: &[CivBonusEntry], unit: &CivBonusUnitShape) -> f64 {
    1.0 + matching_matrix_sum(
        bonusy,
        unit,
        &civ_bonus_rules().grupy_mnoznikow.oblezenie,
        "",
        false,
    )
}

/// Mnoznik obrony na murze (web `civWallDefenseMultiplier`).
pub fn civ_wall_defense_multiplier(bonusy: &[CivBonusEntry], unit: &CivBonusUnitShape) -> f64 {
    1.0 + matching_matrix_sum(
        bonusy,
        unit,
        &civ_bonus_rules().grupy_mnoznikow.mur,
        "",
        false,
    )
}

/// Ulga na koszt Produkcji budynkow (0.2 = -20%), z gorna granica z tabeli
/// (web `civBuildingCostDiscount`).
pub fn civ_building_cost_discount(bonusy: &[CivBonusEntry]) -> f64 {
    let rule = &civ_bonus_rules().koszt_budynkow;
    let mut disc = 0.0;
    for b in bonusy {
        if b.realizuje.as_deref() != Some(rule.realizuje.as_str()) {
            continue;
        }
        if b.typ != rule.typ {
            continue;
        }
        if b.cel != rule.cel {
            continue;
        }
        if let Some(v) = b.wartosc.as_number() {
            if v > 0.0 {
                disc += v;
            }
        }
    }
    disc.min(rule.max_znizka)
}

/// Koszt budynku po uldze cywilizacji (web `buildingCostAfterCivDiscount`).
pub fn building_cost_after_civ_discount(base_cost: f64, bonusy: &[CivBonusEntry]) -> f64 {
    let disc = civ_building_cost_discount(bonusy);
    if disc <= 0.0 || base_cost <= 0.0 {
        return base_cost;
    }
    civ_bonus_rules()
        .koszt_budynkow
        .min_koszt
        .max((base_cost * (1.0 - disc)).floor())
}

/// PreBattle: tylko liczbowe modyfikatory walki (web `isCombatModifierBonus`).
pub fn is_combat_modifier_bonus(b: &CivBonusEntry) -> bool {
    if b.realizuje.as_deref() != Some(kind::REALIZUJE_WALKA) {
        return false;
    }
    if b.typ == kind::TYP_JEDNOSTKA_SPECJALNA {
        return false;
    }
    b.wartosc.as_number().is_some()
}
