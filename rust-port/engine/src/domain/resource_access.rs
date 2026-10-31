//! P6.8H (partia A): port `gra/src/game/{zloto,cyna,zelazo}-access.ts` oraz pomocnikow
//! kultury z `gra/src/game/society-inputs.ts` — czysta logika dostepu do surowcow.
//!
//! Reużyte istniejące symbole (NIE duplikowane):
//! - `improvements::normalize_improvement_key` (web `normalizeImprovementKey`),
//! - `improvements::migrate_legacy_kopalnia_key` (web `migrateLegacyKopalniaKey`),
//! - `building_costs::p6_7b::{empire_zloto_stock, owner_can_feed_mennica, StockRecord}`
//!   (web `empireZlotoStock`, `ownerCanFeedMennica`).
//!
//! Kontrakt JS, ktory trzeba zachowac (patrz komentarze przy funkcjach):
//! - `placedImprovements` to `Map` (kolejnosc wstawiania); wartosc to pojedynczy napis
//!   (`Placed::One`) albo lista warstw (`Placed::Many`) — dwie galezie `typeof` w webie.
//! - `hexes[klucz]?.zloze` — brak heksu, brak pola i `undefined` daja ten sam wynik.
//! - `stock?.x ?? 0 > 0` — NaN nie jest `> 0`; `?? 0` lapie tylko `undefined`/`null`.
//! - legacy `empireStock: boolean` (TS) to to samo co brak stocku: Rust przyjmuje `None`.

use std::collections::HashMap;

use super::building_costs::p6_7b::{empire_zloto_stock, owner_can_feed_mennica, StockRecord};
use super::improvements::{migrate_legacy_kopalnia_key, normalize_improvement_key};

// ---------------------------------------------------------------------------------------------
// Stale (web `export const`)
// ---------------------------------------------------------------------------------------------

/// Web `KOPALNIA_CYNY_KEY` (`cyna-access.ts`).
pub const KOPALNIA_CYNY_KEY: &str = "kopalnia_cyny";
/// Web `ZLOZE_CYNY_KEY` (`cyna-access.ts`).
pub const ZLOZE_CYNY_KEY: &str = "cyna";
/// Web `KOPALNIA_ZELAZA_KEY` (`zelazo-access.ts`).
pub const KOPALNIA_ZELAZA_KEY: &str = "kopalnia_zelaza";
/// Web `KOPALNIA_KEY` (`zelazo-access.ts`, @deprecated = `KOPALNIA_ZELAZA_KEY`).
pub const KOPALNIA_KEY: &str = KOPALNIA_ZELAZA_KEY;
/// Web `ODLEWNIA_ZELAZA_BUILDING_ID` (`zelazo-access.ts`).
pub const ODLEWNIA_ZELAZA_BUILDING_ID: &str = "odlewnia_zelaza";
/// Web `ZLOZE_ZELAZO_KEY` (`zelazo-access.ts`).
pub const ZLOZE_ZELAZO_KEY: &str = "zelazo";
/// Web `KOPALNIA_ZLOTA_KEY` (`zloto-access.ts`).
pub const KOPALNIA_ZLOTA_KEY: &str = "kopalnia_zlota";
/// Web `ZLOTO_STOCK_KEY` (`zloto-access.ts`): klucz Zlota w magazynie panstwa.
pub const ZLOTO_STOCK_KEY: &str = "zloto";
/// Web `ZLOTO_LABEL` (`zloto-access.ts`). Uzywane przez `building-resource-gate.ts` (poza partia A).
pub const ZLOTO_LABEL: &str = "Złoto";
/// Web `KOPALNIA_ZLOTA_YIELD_PER_TURN` (`zloto-access.ts`, B4: 1/t na kopalnie).
/// Web: brak importerow poza definicja (`git grep 91dc998a -- gra/src`).
pub const KOPALNIA_ZLOTA_YIELD_PER_TURN: f64 = 1.0;
/// Web `TRADE_GRANT_ZLOTO_SYNTHETIC_KEY` (`zloto-access.ts`, @deprecated).
pub const TRADE_GRANT_ZLOTO_SYNTHETIC_KEY: &str = "__trasa_zloto__";
/// Web `MENNICA_ZLOTO_DRAIN_PER_TURN` (`zloto-access.ts`). Zrodlo danych:
/// `building_costs::p6_7b` czyta ta sama wartosc z `building-cost-params.json`.
pub const MENNICA_ZLOTO_DRAIN_PER_TURN: f64 = 1.0;

/// Wartosc wpisu w `placedImprovements` (web: `string | readonly string[]`).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Placed<'a> {
    /// Web: `typeof imp === 'string'`.
    One(&'a str),
    /// Web: `readonly string[]`.
    Many(&'a [String]),
}

/// Web `Map<string, string | readonly string[]>` w kolejnosci wstawiania.
pub type PlacedMap<'a> = [(&'a str, Placed<'a>)];

/// Web `ZlozeHexMapLike.hexes`: klucz "q,r" -> `zloze` (`None` = brak pola / heks bez zloza).
pub type HexZlozeMap = HashMap<String, Option<String>>;

/// Web `hex?.zloze?.toString().trim().toLowerCase()`.
fn hex_zloze_normalized(hexes: &HexZlozeMap, hex_key: &str) -> Option<String> {
    hexes
        .get(hex_key)
        .and_then(|zloze| zloze.as_deref())
        .map(|zloze| zloze.trim().to_lowercase())
}

/// Web `improvementKeysOnPlaced` (`cyna-access.ts`, `zelazo-access.ts`):
/// `normalizeImprovementKey(x) ?? migrateLegacyKopalniaKey(x)`, bez pustych kluczy.
fn keys_with_legacy_migration(imp: Placed<'_>) -> Vec<String> {
    let one = |raw: &str| {
        normalize_improvement_key(Some(raw))
            .or_else(|| migrate_legacy_kopalnia_key(raw, None))
            .filter(|key| !key.is_empty())
    };
    match imp {
        Placed::One(raw) => one(raw).into_iter().collect(),
        Placed::Many(list) => list.iter().filter_map(|raw| one(raw.as_str())).collect(),
    }
}

/// Web `improvementKeysOnPlaced` (`zloto-access.ts`) i `improvementKeysOnPlacedHex`
/// (`resource-access.ts`): tylko `normalizeImprovementKey`, bez migracji legacy.
fn keys_normalized_only(imp: Placed<'_>) -> Vec<String> {
    match imp {
        Placed::One(raw) => normalize_improvement_key(Some(raw)).into_iter().collect(),
        Placed::Many(list) => list
            .iter()
            .filter_map(|raw| normalize_improvement_key(Some(raw.as_str())))
            .collect(),
    }
}

// ---------------------------------------------------------------------------------------------
// cyna-access.ts
// ---------------------------------------------------------------------------------------------

/// Web `empireHasKopalniaNaZlozuCyny`: ukonczona Kopalnia cyny na heksie ze zlozem cyny.
/// `placed` = `None` lub pusta mapa -> `false`; `hexes` = `None` (brak mapy) -> `false`.
pub fn empire_has_kopalnia_na_zlozu_cyny(
    placed: Option<&PlacedMap<'_>>,
    hexes: Option<&HexZlozeMap>,
) -> bool {
    let (Some(placed), Some(hexes)) = (placed, hexes) else {
        return false;
    };
    if placed.is_empty() {
        return false;
    }
    placed.iter().any(|(hex_key, imp)| {
        hex_zloze_normalized(hexes, hex_key).as_deref() == Some(ZLOZE_CYNY_KEY)
            && keys_with_legacy_migration(*imp)
                .iter()
                .any(|key| key == KOPALNIA_CYNY_KEY)
    })
}

/// Web `cityHasOdlewniaForCyna`: Odlewnia brazu lub dowolny upgrade lancucha.
pub fn city_has_odlewnia_for_cyna(built_ids: &[String]) -> bool {
    built_ids
        .iter()
        .any(|id| matches!(id.as_str(), "odlewnia_brazu" | "odlewnia_zelaza" | "wielka_odlewnia"))
}

/// Web `hasCynaAccess(empireStock, builtIds)`. Legacy `boolean` z TS = `None` (jak brak stocku).
/// `built_ids` = `None` (undefined w TS) -> tylko warunek magazynu.
pub fn has_cyna_access(empire_stock: Option<&StockRecord>, built_ids: Option<&[String]>) -> bool {
    let has_stock = empire_stock
        .and_then(|stock| stock.get("ruda_cyny").copied())
        .unwrap_or(0.0)
        > 0.0;
    match built_ids {
        None => has_stock,
        Some(built) => has_stock && city_has_odlewnia_for_cyna(built),
    }
}

// ---------------------------------------------------------------------------------------------
// zelazo-access.ts
// ---------------------------------------------------------------------------------------------

/// Web `empireHasKopalniaNaZlozuZelaza`: Kopalnia zelaza na zlozu zelaza, takze legacy
/// `kopalnia` na zlozu zelaza (stare save przed migracja).
pub fn empire_has_kopalnia_na_zlozu_zelaza(
    placed: Option<&PlacedMap<'_>>,
    hexes: Option<&HexZlozeMap>,
) -> bool {
    let (Some(placed), Some(hexes)) = (placed, hexes) else {
        return false;
    };
    if placed.is_empty() {
        return false;
    }
    placed.iter().any(|(hex_key, imp)| {
        if hex_zloze_normalized(hexes, hex_key).as_deref() != Some(ZLOZE_ZELAZO_KEY) {
            return false;
        }
        if keys_with_legacy_migration(*imp)
            .iter()
            .any(|key| key == KOPALNIA_ZELAZA_KEY)
        {
            return true;
        }
        match imp {
            Placed::One(raw) => *raw == "kopalnia",
            Placed::Many(list) => list.iter().any(|raw| raw.as_str() == "kopalnia"),
        }
    })
}

/// Web `cityHasOdlewniaZelaza`: Odlewnia zelaza lub Wielka odlewnia.
pub fn city_has_odlewnia_zelaza(built_ids: &[String]) -> bool {
    built_ids
        .iter()
        .any(|id| id.as_str() == ODLEWNIA_ZELAZA_BUILDING_ID || id.as_str() == "wielka_odlewnia")
}

/// Web `hasZelazoAccess(empireStock, builtIds)`. Legacy `boolean` = `None` (jak w `hasCynaAccess`).
pub fn has_zelazo_access(empire_stock: Option<&StockRecord>, built_ids: Option<&[String]>) -> bool {
    let has_stock = empire_stock
        .and_then(|stock| stock.get("zelazo").copied())
        .unwrap_or(0.0)
        > 0.0;
    match built_ids {
        None => has_stock,
        Some(built) => has_stock && city_has_odlewnia_zelaza(built),
    }
}

// ---------------------------------------------------------------------------------------------
// zloto-access.ts
// ---------------------------------------------------------------------------------------------

/// Web `countKopalnieZlota`: liczba wpisow `kopalnia_zlota` (1/t kazda). `None` -> 0.
pub fn count_kopalnie_zlota(placed: Option<&PlacedMap<'_>>) -> usize {
    placed.map_or(0, |placed| {
        placed
            .iter()
            .map(|(_, imp)| {
                keys_normalized_only(*imp)
                    .iter()
                    .filter(|key| key.as_str() == KOPALNIA_ZLOTA_KEY)
                    .count()
            })
            .sum()
    })
}

/// Web `empireHasKopalniaZlota`: `countKopalnieZlota > 0`.
pub fn empire_has_kopalnia_zlota(placed: Option<&PlacedMap<'_>>) -> bool {
    count_kopalnie_zlota(placed) > 0
}

/// Web `ownerHasZlotoStock`: w puli jest jakiekolwiek Zloto (R3=B).
pub fn owner_has_zloto_stock(empire_stock: Option<&StockRecord>) -> bool {
    empire_zloto_stock(empire_stock) > 0.0
}

/// Web `resolveOwnerZlotoFromStock(ownerId, empireStock, graceResolver?)`.
/// `grace_resolver` = `None` (brak funkcji) albo funkcja zwracajaca `bool`
/// (web: `graceResolver?.(ownerId) === true`).
pub fn resolve_owner_zloto_from_stock(
    owner_id: i64,
    empire_stock: Option<&StockRecord>,
    grace_resolver: Option<&dyn Fn(i64) -> bool>,
) -> bool {
    let grace = grace_resolver.is_some_and(|resolver| resolver(owner_id));
    owner_can_feed_mennica(empire_stock, grace)
}

/// Web `deductMennicaZlotoDrain(empireStock)`: zwraca kopie; zapas `< 1` zostaje bez zmian.
/// NaN nie jest `< 1` (false), wiec odejmowanie daje NaN — jak w JS.
pub fn deduct_mennica_zloto_drain(empire_stock: &StockRecord) -> StockRecord {
    let current = empire_stock.get("zloto").copied().unwrap_or(0.0);
    let mut out = empire_stock.clone();
    if current < MENNICA_ZLOTO_DRAIN_PER_TURN {
        return out;
    }
    out.insert(
        "zloto".to_owned(),
        current - MENNICA_ZLOTO_DRAIN_PER_TURN,
    );
    out
}

/// Web `placedImprovementsWithZlotoTradeGrant` (@deprecated): no-op — zwraca wejscie bez zmian.
pub fn placed_improvements_with_zloto_trade_grant<'a>(
    placed: &'a PlacedMap<'a>,
    _has_trade_grant: bool,
) -> &'a PlacedMap<'a> {
    placed
}

// ---------------------------------------------------------------------------------------------
// society-inputs.ts (kultura miasta — pomocniki bez zaleznosci od religii/stolicy)
// ---------------------------------------------------------------------------------------------

/// Pola miasta czytane przez web `resolveOwnCultureShare` / `cityCultureMixActive`
/// (`ownCultureShare?` i fallback `kulturaOwnShare?`). `None` = pole `undefined`/`null`.
#[derive(Debug, Clone, Copy, Default, PartialEq)]
pub struct CultureMixFields {
    pub own_culture_share: Option<f64>,
    pub kultura_own_share: Option<f64>,
}

/// Linia skladu kultury (web `CultureMixLine`).
#[derive(Debug, Clone, PartialEq)]
pub struct CultureMixLine {
    pub label: String,
    pub pct: f64,
    pub is_owner: bool,
}

/// Web `Math.max(0, Math.min(1, x))`. `f64::clamp` zwraca NaN dla NaN (jak JS `Math.min/max`),
/// a jego granice 0.0 i 1.0 nie są NaN, więc nie panikuje.
fn js_clamp_unit(x: f64) -> f64 {
    x.clamp(0.0, 1.0)
}

/// Web `resolveOwnCultureShare`: `?? ` (tylko `undefined`/`null`), skonczona liczba -> clamp
/// do [0,1]; NaN/Infinity/brak -> 1.
pub fn resolve_own_culture_share(city: &CultureMixFields) -> f64 {
    match city.own_culture_share.or(city.kultura_own_share) {
        Some(raw) if raw.is_finite() => js_clamp_unit(raw),
        _ => 1.0,
    }
}

/// Web `cityCultureMixActive`: `typeof ... === 'number'` na ktoryms z pol (NaN tez liczy sie).
pub fn city_culture_mix_active(city: &CultureMixFields) -> bool {
    city.own_culture_share.is_some() || city.kultura_own_share.is_some()
}

/// Web `clearCityCultureMix`: kasuje oba pola (`delete`).
pub fn clear_city_culture_mix(city: &mut CultureMixFields) {
    city.own_culture_share = None;
    city.kultura_own_share = None;
}

/// Web `cultureMixBreakdown(ownerLabel, ownShare, mixActive)`.
pub fn culture_mix_breakdown(
    owner_culture_label: &str,
    own_culture_share: f64,
    mix_active: bool,
) -> Vec<CultureMixLine> {
    // Math.round (JS) dla wartosci >= 0 == Rust f64::round; NaN zostaje NaN.
    let own_pct = (js_clamp_unit(own_culture_share) * 100.0).round();
    let foreign_pct = 100.0 - own_pct;
    if !mix_active || foreign_pct <= 0.0 {
        return vec![CultureMixLine {
            label: owner_culture_label.to_owned(),
            pct: 100.0,
            is_owner: true,
        }];
    }
    let mut lines = vec![CultureMixLine {
        label: owner_culture_label.to_owned(),
        pct: own_pct,
        is_owner: true,
    }];
    if foreign_pct > 0.0 {
        lines.push(CultureMixLine {
            label: "Obca kultura".to_owned(),
            pct: foreign_pct,
            is_owner: false,
        });
    }
    lines
}
