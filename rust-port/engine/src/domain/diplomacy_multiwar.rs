//! R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1 (runda 2): port 1:1 z webem (pin `origin/main` a61337844)
//! czystych bramek wojen epoki i zmęczenia wojną:
//! - `gra/src/game/war-rules-multiwar.ts` (`forcedEraTagFromPowod` :139, `isForcedEraWarEnabled` :168,
//!   `canDeclareEraForcedWar` :154, `canCivJoinEraForcedWar` :197, `eraWarCivKey` :180, `eraWarCountFor` :185,
//!   `evaluateEraForcedWarGate` :266, `playerEpochWarEnabled` = `params.playerEpochWarEnabled ?? true` main.ts:43049),
//! - `gra/src/game/war-weariness.ts` (`warWearinessLevel`, `wearinessPeacePriceFactor`, `isWarWeary`,
//!   `loserDespair`, `despairStage`, `stageCityLimit`, `offerMultiplier`).
//!
//! PARAMETRY SA LITERALAMI W KODZIE (nie w `data/`): `gra/data/war-rules-params.json` i
//! `gra/data/war-weariness-params.json` (pin a61337844). Powod: nowy plik w `rust-port/engine/data/`
//! lamal `tests/data_compliance.rs:384` i `tests/data_loader.rs:88` (liczenie plikow). Kopie JSON to
//! fixtury testowe w `tests/p6_dyplo_multiwar_gates_data/`.
//!
//! NIE PORTOWANE w tej rundzie (zob. `dyspozycje/rust-port/p6/P6-DYPLOMACJA-MULTIWAR.md`):
//! `planEscalatedPeacePayment` / runWarWearinessTick (zaleza od `diplomacy-ai-forced-peace.ts`),
//! `diplomacy-siege-war-gate.ts`, `evaluateInterCivWarGate` (R1/R2), `recordEraForcedWarParticipation`,
//! `restoreEraWarCounts`, `pickPlayerReferenceCity`.
//!
//! JS-SEMANTYKA: `Math.max/min/clamp` propaguja NaN (w Rust `f64::max` ignoruje NaN), wiec sa tu
//! odtworzone funkcje `js_max`, `js_min`, `js_clamp`. Porównanie `Math.max(0, -0)` -> +0 zachowane.

use std::collections::HashMap;

use serde_json::Value;

/// Web `Math.max(a, b)`: NaN propaguje; remis zero: +0 wygrywa z -0.
pub fn js_max(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { b } else { a };
    }
    if a > b {
        a
    } else {
        b
    }
}

/// Web `Math.min(a, b)`: NaN propaguje; remis zero: -0 wygrywa z +0.
pub fn js_min(a: f64, b: f64) -> f64 {
    if a.is_nan() || b.is_nan() {
        return f64::NAN;
    }
    if a == b {
        return if a.is_sign_negative() { a } else { b };
    }
    if a < b {
        a
    } else {
        b
    }
}

/// Web `clamp(v, lo, hi) = Math.min(hi, Math.max(lo, v))` (war-weariness.ts:20).
pub fn js_clamp(v: f64, lo: f64, hi: f64) -> f64 {
    js_min(hi, js_max(lo, v))
}

/// Etykieta epoki wojny wymuszonej (web `ForcedEraTag`, war-rules-multiwar.ts:134).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ForcedEraTag {
    Bronze,
    Stone,
    Iron,
}

/// Literal `enabledForcedWarEras` z `gra/data/war-rules-params.json` (pin a61337844; wartosc zgodna z 5dd53e60f): Kamień, Brąz, Żelazo.
pub const ENABLED_FORCED_WAR_ERAS: [ForcedEraTag; 3] = [
    ForcedEraTag::Stone,
    ForcedEraTag::Bronze,
    ForcedEraTag::Iron,
];

/// Parametry bramki wojen epoki (web `WarRulesParams`, pola używane przez bramkę).
#[derive(Debug, Clone, Copy)]
pub struct EraWarParams<'a> {
    /// Web `enabledForcedWarEras`.
    pub enabled_forced_war_eras: &'a [ForcedEraTag],
    /// Web `maxEraForcedWarsPerEra` (`None` = null = bez limitu). Literal: `None`.
    pub max_era_forced_wars_per_era: Option<i64>,
    /// Web `maxEraForcedWarsPerCivPerEra` (`None` = bez limitu). Literal: `Some(1)`.
    pub max_era_forced_wars_per_civ_per_era: Option<i64>,
}

/// Literal parametrów z `gra/data/war-rules-params.json` (pin a61337844; pola zgodne z 5dd53e60f, REPIN = partia F).
pub const ERA_WAR_PARAMS: EraWarParams<'static> = EraWarParams {
    enabled_forced_war_eras: &ENABLED_FORCED_WAR_ERAS,
    max_era_forced_wars_per_era: None,
    max_era_forced_wars_per_civ_per_era: Some(1),
};

/// Web `forcedEraTagFromPowod` (war-rules-multiwar.ts:139): prefiks `R-EPOKA-(BRAZU|KAMIEN|ZELAZO)-WYMUSZONA-WOJNA:`.
pub fn forced_era_tag_from_powod(powod: &str) -> Option<ForcedEraTag> {
    let rest = powod.strip_prefix("R-EPOKA-")?;
    let (tag, after) = [
        ("BRAZU", ForcedEraTag::Bronze),
        ("KAMIEN", ForcedEraTag::Stone),
        ("ZELAZO", ForcedEraTag::Iron),
    ]
    .into_iter()
    .find_map(|(name, t)| rest.strip_prefix(name).map(|r| (t, r)))?;
    after.starts_with("-WYMUSZONA-WOJNA:").then_some(tag)
}

/// Web `isForcedEraWarEnabled` (war-rules-multiwar.ts:168).
pub fn is_forced_era_war_enabled(tag: ForcedEraTag, enabled: &[ForcedEraTag]) -> bool {
    enabled.contains(&tag)
}

/// Web `canDeclareEraForcedWar` (war-rules-multiwar.ts:154). `declared` = `declaredByTag.get(tag) ?? 0`.
pub fn can_declare_era_forced_war(declared: i64, max_per_era: Option<i64>) -> bool {
    match max_per_era {
        None => true,
        Some(max) => declared < max,
    }
}

/// Web `eraWarCivKey` (war-rules-multiwar.ts:180): `${ownerId}:${epoch}`.
pub fn era_war_civ_key(owner_id: i64, epoch: i64) -> String {
    format!("{owner_id}:{epoch}")
}

/// Web `eraWarCountFor` (war-rules-multiwar.ts:185): brak wpisu = 0.
pub fn era_war_count_for(counts: &HashMap<String, i64>, owner_id: i64, epoch: i64) -> i64 {
    counts
        .get(&era_war_civ_key(owner_id, epoch))
        .copied()
        .unwrap_or(0)
}

/// Web `canCivJoinEraForcedWar` (war-rules-multiwar.ts:197).
pub fn can_civ_join_era_forced_war(
    counts: &HashMap<String, i64>,
    owner_id: i64,
    epoch: i64,
    max_per_civ: Option<i64>,
) -> bool {
    match max_per_civ {
        None => true,
        Some(max) => era_war_count_for(counts, owner_id, epoch) < max,
    }
}

/// Web `EraWarGateVerdict` (war-rules-multiwar.ts:257).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EraWarGateVerdict {
    Ok,
    EraDisabled,
    EraCap,
    CivCapAttacker,
    CivCapTarget,
}

/// Wejście `evaluateEraForcedWarGate` (war-rules-multiwar.ts:266).
#[derive(Debug, Clone)]
pub struct EraWarGateInput<'a> {
    pub multiwar_enabled: bool,
    /// `None` = powód nie jest wojną epoki (web `tag === null`).
    pub tag: Option<ForcedEraTag>,
    /// Web `declaredByTag.get(tag) ?? 0`.
    pub declared_for_tag: i64,
    pub counts: &'a HashMap<String, i64>,
    pub attacker_id: i64,
    pub attacker_epoch: i64,
    pub target_id: i64,
    pub target_epoch: i64,
}

/// Web `evaluateEraForcedWarGate` (war-rules-multiwar.ts:266). Kolejność: epoka wyłączona flagą (także bez
/// multiwar), potem (tylko przy multiwar) limit globalny, licznik napastnika, licznik celu.
pub fn evaluate_era_forced_war_gate(
    inp: &EraWarGateInput<'_>,
    p: &EraWarParams<'_>,
) -> EraWarGateVerdict {
    let Some(tag) = inp.tag else {
        return EraWarGateVerdict::Ok;
    };
    if !is_forced_era_war_enabled(tag, p.enabled_forced_war_eras) {
        return EraWarGateVerdict::EraDisabled;
    }
    if !inp.multiwar_enabled {
        return EraWarGateVerdict::Ok;
    }
    if !can_declare_era_forced_war(inp.declared_for_tag, p.max_era_forced_wars_per_era) {
        return EraWarGateVerdict::EraCap;
    }
    if !can_civ_join_era_forced_war(
        inp.counts,
        inp.attacker_id,
        inp.attacker_epoch,
        p.max_era_forced_wars_per_civ_per_era,
    ) {
        return EraWarGateVerdict::CivCapAttacker;
    }
    if !can_civ_join_era_forced_war(
        inp.counts,
        inp.target_id,
        inp.target_epoch,
        p.max_era_forced_wars_per_civ_per_era,
    ) {
        return EraWarGateVerdict::CivCapTarget;
    }
    EraWarGateVerdict::Ok
}

/// Web `playerEpochWarEnabled = params.playerEpochWarEnabled ?? true` (main.ts:43049). Brak pola w zapisie = true.
pub fn player_epoch_war_enabled(saved: Option<bool>) -> bool {
    saved.unwrap_or(true)
}

// ---------------------------------------------------------------------------
// Zmęczenie wojną (gra/src/game/war-weariness.ts) — literały z gra/data/war-weariness-params.json
// ---------------------------------------------------------------------------

/// Podzbiór `WarWearinessParams` używany przez funkcje czyste (pola jak w JSON, pin a61337844).
#[derive(Debug, Clone, Copy)]
pub struct WarWearinessParams {
    pub pelne_tur: f64,
    pub waga_strat_miasta: f64,
    pub stagnacja_od_tur: f64,
    pub stagnacja_waga: f64,
    pub stagnacja_skala_tur: f64,
    pub prog_chetnosci: f64,
    pub udzial_wyraznie: f64,
    pub waga_zmeczenia: f64,
    pub waga_sily: f64,
    pub waga_strat: f64,
    pub straty_nasycenie: f64,
    pub progi_stopni: &'static [f64],
    pub mnozni_stopni: &'static [f64],
    pub mnoznik_na_odrzucenie: f64,
    pub max_miast_na_pokoj: i64,
    pub rabat_ceny_pokoju_max: f64,
}

const PROGI_STOPNI: [f64; 3] = [0.25, 0.45, 0.65];
const MNOZNI_STOPNI: [f64; 4] = [1.0, 1.5, 2.0, 2.5];

/// Literal `gra/data/war-weariness-params.json` (pin a61337844): zmeczenie + przegrywajacy + czlowiek.rabatCenyPokojuMax.
pub const WAR_WEARINESS_PARAMS: WarWearinessParams = WarWearinessParams {
    pelne_tur: 200.0,
    waga_strat_miasta: 0.03,
    stagnacja_od_tur: 30.0,
    stagnacja_waga: 0.3,
    stagnacja_skala_tur: 100.0,
    prog_chetnosci: 0.5,
    udzial_wyraznie: 0.45,
    waga_zmeczenia: 0.5,
    waga_sily: 0.5,
    waga_strat: 0.3,
    straty_nasycenie: 3.0,
    progi_stopni: &PROGI_STOPNI,
    mnozni_stopni: &MNOZNI_STOPNI,
    mnoznik_na_odrzucenie: 0.2,
    max_miast_na_pokoj: 2,
    rabat_ceny_pokoju_max: 0.6,
};

/// Web `warWearinessLevel` (war-weariness.ts:50). `turns_since_city_change = None` = `undefined` (od początku wojny).
pub fn war_weariness_level(
    turns_at_war: f64,
    lost_cities_total: f64,
    turns_since_city_change: Option<f64>,
    p: &WarWearinessParams,
) -> f64 {
    let turns = js_max(0.0, turns_at_war);
    let since = turns_since_city_change.unwrap_or(turns);
    let stagn = p.stagnacja_waga
        * js_clamp(
            (since - p.stagnacja_od_tur) / p.stagnacja_skala_tur,
            0.0,
            1.0,
        );
    js_clamp(
        turns / p.pelne_tur + p.waga_strat_miasta * js_max(0.0, lost_cities_total) + stagn,
        0.0,
        1.0,
    )
}

/// Web `wearinessPeacePriceFactor` (war-weariness.ts:61).
pub fn weariness_peace_price_factor(level: f64, p: &WarWearinessParams) -> f64 {
    let t = p.prog_chetnosci;
    let x = js_clamp((level - t) / js_max(1e-9, 1.0 - t), 0.0, 1.0);
    1.0 - p.rabat_ceny_pokoju_max * x
}

/// Web `isWarWeary` (war-weariness.ts:67). NaN -> false.
pub fn is_war_weary(level: f64, p: &WarWearinessParams) -> bool {
    level >= p.prog_chetnosci
}

/// Web `loserDespair` (war-weariness.ts:78). `share > udzial` -> 0 (także gdy `share` = NaN: porównanie fałszywe).
pub fn loser_despair(level: f64, share: f64, lost_cities: f64, p: &WarWearinessParams) -> f64 {
    if share > p.udzial_wyraznie {
        return 0.0;
    }
    let weak = js_clamp((p.udzial_wyraznie - share) / p.udzial_wyraznie, 0.0, 1.0);
    let loss = js_clamp(js_max(0.0, lost_cities) / p.straty_nasycenie, 0.0, 1.0);
    js_clamp(
        p.waga_zmeczenia * level + p.waga_sily * weak + p.waga_strat * loss,
        0.0,
        1.0,
    )
}

/// Web `despairStage` (war-weariness.ts:88): liczba progów `<= despair` (0..3). NaN -> 0.
pub fn despair_stage(despair: f64, p: &WarWearinessParams) -> i64 {
    p.progi_stopni.iter().filter(|&&t| despair >= t).count() as i64
}

/// Web `stageCityLimit` (war-weariness.ts:94).
pub fn stage_city_limit(stage: i64, p: &WarWearinessParams) -> i64 {
    if stage <= 1 {
        return 0;
    }
    if stage == 2 {
        return 1i64.min(p.max_miast_na_pokoj);
    }
    p.max_miast_na_pokoj
}

/// Web `offerMultiplier` (war-weariness.ts:101): `base(stage) * (1 + mnoznik * max(0, odrzucone))`.
pub fn offer_multiplier(stage: i64, rejected_offers: f64, p: &WarWearinessParams) -> f64 {
    let arr = p.mnozni_stopni;
    let idx = stage.max(0).min(arr.len() as i64 - 1) as usize;
    let base = arr[idx];
    base * (1.0 + p.mnoznik_na_odrzucenie * js_max(0.0, rejected_offers))
}

// ---------------------------------------------------------------------------
// P6-ZAPIS-ERAWAR (web R-WEB-ERA-WAR-COUNTER-Q1, pin `origin/main` 679ab078a):
// `recordEraForcedWarParticipation` (war-rules-multiwar.ts:241),
// `rebuildEraWarCountsFromActivePairs` (:258), `restoreEraWarCounts` (:276).
// ---------------------------------------------------------------------------

/// Web `Map<string, number>` licznika wojen epoki z zachowaną kolejnością wstawiania
/// (web zapisuje `Array.from(map.entries())`, więc kolejność jest częścią zapisu).
/// Wartości to liczby całkowite (web inkrementuje o 1; odczyt przyjmuje tylko całkowite, patrz
/// `restore_era_war_counts`).
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct EraWarCounts {
    entries: Vec<(String, i64)>,
}

impl EraWarCounts {
    /// Pusty licznik (web `new Map()`).
    pub fn new() -> Self {
        Self::default()
    }

    /// Web `Map.set`: istniejący klucz zachowuje pozycję i dostaje nową wartość, nowy trafia na koniec.
    pub fn set(&mut self, key: String, value: i64) {
        match self.entries.iter_mut().find(|(k, _)| *k == key) {
            Some(entry) => entry.1 = value,
            None => self.entries.push((key, value)),
        }
    }

    /// Web `Map.get` (`None` = brak wpisu).
    pub fn get(&self, key: &str) -> Option<i64> {
        self.entries.iter().find(|(k, _)| k == key).map(|(_, v)| *v)
    }

    /// Wpisy w kolejności wstawiania (web `Array.from(map.entries())`).
    pub fn entries(&self) -> &[(String, i64)] {
        &self.entries
    }

    /// Widok do odczytu przez `era_war_count_for` / `can_civ_join_era_forced_war`.
    pub fn to_hash_map(&self) -> HashMap<String, i64> {
        self.entries.iter().cloned().collect()
    }

    /// Liczba wpisów.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    /// True gdy licznik jest pusty.
    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

/// Para aktywnej wojny wymuszonej (web `{ attackerId, targetId }` z map `*ForceWarActiveByPairKey`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ActiveWarPair {
    pub attacker_id: i64,
    pub target_id: i64,
}

/// Web `recordEraForcedWarParticipation` (war-rules-multiwar.ts:241): napastnik i cel dostają
/// po jednym wpisie w bieżącej epoce. Kroki są sekwencyjne jak w webie: gdy klucze są równe
/// (napastnik == cel w tej samej epoce), licznik rośnie o 2.
pub fn record_era_forced_war_participation(
    counts: &mut EraWarCounts,
    attacker_id: i64,
    target_id: i64,
    attacker_epoch: i64,
    target_epoch: i64,
) {
    let ka = era_war_civ_key(attacker_id, attacker_epoch);
    let kt = era_war_civ_key(target_id, target_epoch);
    let na = counts.get(&ka).unwrap_or(0) + 1;
    counts.set(ka, na);
    let nt = counts.get(&kt).unwrap_or(0) + 1;
    counts.set(kt, nt);
}

/// Web `rebuildEraWarCountsFromActivePairs` (war-rules-multiwar.ts:258): zapis bez pola liczników.
/// Każda strona aktywnej pary dostaje wartość 1 w bieżącej epoce (ustawiane, nie dodawane).
pub fn rebuild_era_war_counts_from_active_pairs(
    active_pairs: &[ActiveWarPair],
    epoch_of: impl Fn(i64) -> i64,
) -> EraWarCounts {
    let mut out = EraWarCounts::new();
    for pair in active_pairs {
        for oid in [pair.attacker_id, pair.target_id] {
            out.set(era_war_civ_key(oid, epoch_of(oid)), 1);
        }
    }
    out
}

/// Web `restoreEraWarCounts` (war-rules-multiwar.ts:276): odczyt licznika przy wczytaniu zapisu.
/// `saved` = `meta.warRulesEraWarCountByCiv` (`None` = pole nieobecne). Gdy `saved` nie jest
/// tablicą (brak, `null`, zły typ) → odbudowa z aktywnych par. Tablica → wpisy `[klucz, n]`,
/// gdzie klucz to string, a `n` to liczba całkowita skończona; błędne wpisy są pomijane.
/// Powtórzony klucz: wartość z ostatniego wpisu, pozycja z pierwszego (semantyka `Map.set`).
pub fn restore_era_war_counts(
    saved: Option<&Value>,
    active_pairs: &[ActiveWarPair],
    epoch_of: impl Fn(i64) -> i64,
) -> EraWarCounts {
    let entries = match saved {
        Some(Value::Array(entries)) => entries,
        _ => return rebuild_era_war_counts_from_active_pairs(active_pairs, epoch_of),
    };
    let mut out = EraWarCounts::new();
    for entry in entries {
        let Value::Array(pair) = entry else { continue };
        let (Some(Value::String(key)), Some(raw)) = (pair.first(), pair.get(1)) else {
            continue;
        };
        if let Some(n) = json_count(raw) {
            out.set(key.clone(), n);
        }
    }
    out
}

/// Liczba JSON jako licznik: skończona, całkowita, w zakresie dokładnej reprezentacji f64.
/// Ułamki są pomijane (świadome odstępstwo od weba, zob. P6-ZAPIS-ERAWAR.md).
fn json_count(v: &Value) -> Option<i64> {
    let f = v.as_f64()?;
    if f.is_finite() && f.fract() == 0.0 && f.abs() <= 9_007_199_254_740_991.0 {
        Some(f as i64)
    } else {
        None
    }
}
