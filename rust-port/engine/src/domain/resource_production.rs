use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};

/// A resource produced by a terrain improvement.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub enum ResourceKey {
    #[serde(rename = "drewno")]
    Wood,
    #[serde(rename = "kamien")]
    Stone,
    #[serde(rename = "glina")]
    Clay,
    #[serde(rename = "ruda")]
    CopperOre,
    #[serde(rename = "ruda_zelaza")]
    IronOre,
    #[serde(rename = "ruda_cyny")]
    TinOre,
    #[serde(rename = "sol")]
    Salt,
    #[serde(rename = "zloto")]
    Gold,
    #[serde(rename = "kon")]
    Horse,
}

impl ResourceKey {
    /// The canonical data key used by the game data and save format.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Wood => "drewno",
            Self::Stone => "kamien",
            Self::Clay => "glina",
            Self::CopperOre => "ruda",
            Self::IronOre => "ruda_zelaza",
            Self::TinOre => "ruda_cyny",
            Self::Salt => "sol",
            Self::Gold => "zloto",
            Self::Horse => "kon",
        }
    }
}

/// One resolved territorial-resource yield.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ResourceYield {
    pub resource: ResourceKey,
    pub amount: u32,
}

/// Additive resource pool produced by all improvements in a scope.
#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ResourceProductionTotals {
    pub resources: BTreeMap<ResourceKey, u32>,
}

impl ResourceProductionTotals {
    pub fn amount_for(&self, resource: ResourceKey) -> u32 {
        self.resources.get(&resource).copied().unwrap_or(0)
    }

    pub fn get(&self, resource: ResourceKey) -> Option<u32> {
        self.resources.get(&resource).copied()
    }

    fn add(&mut self, yield_row: ResourceYield) {
        *self.resources.entry(yield_row.resource).or_default() += yield_row.amount;
    }
}

/// Normalize an improvement identifier at the domain boundary.
///
/// The aliases cover the canonical Polish data keys and the English names
/// used by older Rust callers. Unknown keys are deliberately rejected rather
/// than assigned a guessed resource.
pub fn normalize_improvement_key(raw: &str) -> Option<&'static str> {
    let key = raw.trim().to_lowercase();
    match key.as_str() {
        "tartak" | "lumber_mill" => Some("tartak"),
        "kamieniolom" | "kamieniołom" | "quarry" => Some("kamieniolom"),
        "glinianka" | "clay_pit" => Some("glinianka"),
        "kopalnia_miedzi" | "copper_mine" => Some("kopalnia_miedzi"),
        "kopalnia_zelaza" | "iron_mine" => Some("kopalnia_zelaza"),
        "kopalnia_cyny" | "tin_mine" => Some("kopalnia_cyny"),
        "warzelnia_soli" | "salt_works" => Some("warzelnia_soli"),
        "stadnina" | "horse_ranch" => Some("stadnina"),
        "kopalnia_zlota" | "gold_mine" => Some("kopalnia_zlota"),
        _ => None,
    }
}

/// Resolve the per-turn amount for an improvement in an owner's era.
///
/// Tartak and Kamieniołom scale by +50% for each later era, producing the
/// canonical 200/300/450 vector. Era zero and future/invalid values safely
/// use era one. All other resource improvements retain their flat rates.
pub fn resource_production_amount_for_era(key: &str, base_amount: u32, era: u8) -> u32 {
    let normalized = normalize_improvement_key(key);
    if !matches!(normalized, Some("tartak" | "kamieniolom")) {
        return base_amount;
    }

    match era {
        2 => rounded_ratio(base_amount, 3, 2),
        3 => rounded_ratio(base_amount, 9, 4),
        _ => base_amount,
    }
}

fn rounded_ratio(value: u32, numerator: u64, denominator: u64) -> u32 {
    let scaled = u64::from(value).saturating_mul(numerator);
    let rounded = scaled.saturating_add(denominator / 2) / denominator;
    rounded.min(u64::from(u32::MAX)) as u32
}

/// Resolve one territorial producer, independent of worker assignment.
pub fn resolve_resource_production(key: &str, era: u8) -> Option<ResourceYield> {
    let normalized = normalize_improvement_key(key)?;
    let (resource, base_amount) = match normalized {
        "tartak" => (ResourceKey::Wood, 200),
        "kamieniolom" => (ResourceKey::Stone, 200),
        "glinianka" => (ResourceKey::Clay, 50),
        "kopalnia_miedzi" => (ResourceKey::CopperOre, 20),
        "kopalnia_zelaza" => (ResourceKey::IronOre, 20),
        "kopalnia_cyny" => (ResourceKey::TinOre, 20),
        "warzelnia_soli" => (ResourceKey::Salt, 50),
        "stadnina" => (ResourceKey::Horse, 25),
        "kopalnia_zlota" => (ResourceKey::Gold, 1),
        _ => return None,
    };

    Some(ResourceYield {
        resource,
        amount: resource_production_amount_for_era(normalized, base_amount, era),
    })
}

/// Compatibility name matching the terrain-improvement resolver in TypeScript.
pub fn resource_yield_for_improvement(key: &str, era: u8) -> Option<ResourceYield> {
    resolve_resource_production(key, era)
}

/// Compatibility name matching the territorial resolver's domain concept.
pub fn territory_resource_yield_for_improvement(key: &str, era: u8) -> Option<ResourceYield> {
    resolve_resource_production(key, era)
}

/// Short compatibility name for callers that treat the resolver as a lookup.
pub fn resource_production_for(key: &str, era: u8) -> Option<ResourceYield> {
    resolve_resource_production(key, era)
}

/// Sum every resolved improvement additively, including duplicate layers.
/// Unknown/non-producing improvements contribute nothing.
pub fn stack_resource_production<'a, I, K>(keys: I, era: u8) -> ResourceProductionTotals
where
    I: IntoIterator<Item = K>,
    K: AsRef<str> + 'a,
{
    let mut totals = ResourceProductionTotals::default();
    for key in keys {
        if let Some(yield_row) = resolve_resource_production(key.as_ref(), era) {
            totals.add(yield_row);
        }
    }
    totals
}
