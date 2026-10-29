//! REPIN-WOJNA-NOWE-A: port `gra/src/game/ai-era-unit-promotion.ts` (pin `91dc998a`).
//!
//! web: gra/src/game/ai-era-unit-promotion.ts:38-63 (`promoteAiUnitForEra`).
//!
//! ZALOZENIA (adaptacja typow, zachowanie logiki bez zmian):
//! - `U` jest tu konkretna struktura `PromotableUnit` (w webie generyk z polami opcjonalnymi);
//! - `Epoka` definicji przychodzi jako liczba (adapter zywej gry wykonuje `epochNumber`), wiec
//!   porownanie `epochNumber(target) <= epochNumber(old)` to `target.epoka <= old.epoka`;
//! - `hp` i `ruchLeft` `null` i `undefined` (web: `??`) sa tu oba `None`.

/// Jednostka AI podlegajaca awansowi epokowemu (web: `AiEraPromotableUnit`).
#[derive(Debug, Clone, PartialEq)]
pub struct PromotableUnit {
    pub type_id: String,
    pub category: Option<String>,
    pub hp: Option<f64>,
    pub hp_max: Option<f64>,
    pub ruch_left: Option<f64>,
    pub replace_used_this_turn: bool,
}

/// Rekord definicji jednostki (web: `AiEraPromotionTarget`, pola uzywane przez logike).
#[derive(Debug, Clone, PartialEq)]
pub struct PromotionRecord {
    /// web: `Jednostka`.
    pub jednostka: String,
    /// web: `Epoka` po `epochNumber`.
    pub epoka: f64,
    /// web: `Typ` (`String(Typ ?? '').trim()` musi byc niepuste).
    pub typ: Option<String>,
}

/// Zaleznosci dostarczane przez zywa gre (web: `AiEraPromotionDeps`).
pub trait AiEraPromotionDeps {
    fn old_definition(&self, unit: &PromotableUnit) -> Option<PromotionRecord>;
    fn candidates(&self, unit: &PromotableUnit) -> Vec<PromotionRecord>;
    fn newest_same_role(
        &self,
        unit: &PromotableUnit,
        candidates: &[PromotionRecord],
    ) -> Option<PromotionRecord>;
    fn unit_cost(&self, unit_id: &str, unit: &PromotableUnit) -> f64;
    fn current_treasury(&self) -> f64;
    fn set_treasury(&mut self, value: f64);
    fn old_max_hp(&self, unit: &PromotableUnit, definition: &PromotionRecord) -> f64;
    fn new_max_hp(&self, target: &PromotionRecord, unit: &PromotableUnit) -> f64;
    fn category(&self, target: &PromotionRecord) -> String;
}

/// `Math.round` z JS (zaokraglenie w strone +inf przy remisie).
fn js_round(x: f64) -> f64 {
    let floor = x.floor();
    if x - floor >= 0.5 {
        floor + 1.0
    } else {
        floor
    }
}

/// Awans jednostki do najnowszej dostepnej jednostki tej samej roli (web: `promoteAiUnitForEra`).
/// Zwraca `true`, gdy awans sie wykonal. Drugie wywolanie w tej samej turze jest bez skutku.
pub fn promote_ai_unit_for_era<D: AiEraPromotionDeps>(
    unit: &mut PromotableUnit,
    deps: &mut D,
) -> bool {
    if unit.replace_used_this_turn {
        return false;
    }
    let Some(old_definition) = deps.old_definition(unit) else {
        return false;
    };
    if old_definition
        .typ
        .as_deref()
        .unwrap_or("")
        .trim()
        .is_empty()
    {
        return false;
    }
    let candidates = deps.candidates(unit);
    let Some(target) = deps.newest_same_role(unit, &candidates) else {
        return false;
    };
    if target.epoka <= old_definition.epoka {
        return false;
    }

    let surcharge =
        (deps.unit_cost(&target.jednostka, unit) - deps.unit_cost(&unit.type_id, unit)).max(0.0);
    let treasury = deps.current_treasury();
    if treasury < surcharge {
        return false;
    }

    let old_max_hp = deps.old_max_hp(unit, &old_definition);
    let new_max_hp = deps.new_max_hp(&target, unit);
    let old_hp = unit.hp.unwrap_or(old_max_hp);
    unit.type_id = target.jednostka.clone();
    unit.category = Some(deps.category(&target));
    let ratio = if old_max_hp > 0.0 {
        old_hp / old_max_hp
    } else {
        1.0
    };
    unit.hp = Some(js_round(new_max_hp * ratio).max(1.0));
    unit.hp_max = Some(new_max_hp);
    unit.ruch_left = Some(0.0);
    unit.replace_used_this_turn = true;
    if surcharge > 0.0 {
        deps.set_treasury(treasury - surcharge);
    }
    true
}
