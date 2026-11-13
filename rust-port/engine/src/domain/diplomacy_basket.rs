//! R-RUSTPORT-P6-ZLOZA-B: port realizacji koszyka — funkcja `transferBasketItems`.
//!
//! Pin: `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, `gra/src/main.ts:12566`.
//!
//! Zakres tego modułu (r2): gałęzie `zloze`, `tech`, `surowiec_boolean`, `surowiec_ilosc`
//! i `praca`. Gałęzie `zloto`, `zywnosc`, `miasto` oraz `jednostka` NIE są tu wykonywane:
//! ich rodzaje trafiają do `BasketTransferOutcome::skipped_kinds` (uzasadnienie przy
//! `transfer_basket_items`).
//!
//! Wpięcie w produkcję (ZŁOŻA-C/wiring) NIE należy do tego modułu.

use std::collections::BTreeMap;

use super::diplomacy::{
    grant_surowiec_boolean_access, grant_tech_to_owner, normalize_resource_quantity,
    transfer_surowiec_ilosc, BasketItem, BasketItemKind, BasketTransferContext, CityResourceState,
    ZlozeGrant,
};
use super::PlayerId;

/// Stan, na którym działa `transfer_basket_items`. Odpowiada zmiennym modułowym pina:
/// `basketTransferCtx`, `cities`, pule Pracy (`ownerPracaPool`/`setOwnerPracaPool`),
/// `capitalCityIdForOwner` oraz skali `pn_praca` z `diplomacy.json`.
pub struct BasketTransferState<'a> {
    /// Pin: `basketTransferCtx` (`researchedByOwner`, `surowiecBooleanGrants`, katalog tech).
    pub context: &'a mut BasketTransferContext,
    /// Pin: `cities` (pole `surowce` czytane i zapisywane przez `transferSurowiecIlosc`).
    pub cities: &'a mut [CityResourceState],
    /// Pin: `ownerPracaPool` / `setOwnerPracaPool` (w Rust jedna mapa właściciel → Praca).
    pub praca_pool_by_owner: &'a mut BTreeMap<u64, f64>,
    /// Pin: `capitalCityIdForOwner(ownerId)`. Wywołujący podaje tę samą regułę.
    pub capital_city_for: &'a dyn Fn(PlayerId) -> Option<String>,
    /// Pin: `diplomacyPnPraca(qty)` = `max(0, round(qty * skala))`; `skala` z `pn_praca`.
    pub pn_praca_skala: i64,
}

/// Wynik `transfer_basket_items`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct BasketTransferOutcome {
    /// Liczba utworzonych grantów złoża (`zlozeGrants.push` na pinie).
    pub grants_created: usize,
    /// Rodzaje pozycji, których ten port nie wykonuje (każdy rodzaj raz). Obejmuje `zloto`
    /// i `zywnosc` (NIE_ZMIERZONO, patrz dokumentacja funkcji), `jednostka` (no-op na pinie,
    /// TODO A1) oraz `dostep_do_surowca` (brak gałęzi `case` na pinie, no-op).
    pub skipped_kinds: Vec<BasketItemKind>,
    /// Efekty uboczne z pina, których port nie wykonuje. Obecne tylko, gdy tech został
    /// przyznany graczowi `0` (pin `main.ts:12483`: `player.zbadane` i
    /// `reconcilePlayerEraFromResearch`).
    pub unported_side_effects: Vec<&'static str>,
}

/// Pin `diplomacyPnPraca(qty)`.
fn pn_praca(qty: f64, skala: i64) -> f64 {
    (qty * skala as f64).round().max(0.0)
}

/// Port `transferBasketItems` (pin `main.ts:12566-12678`) dla gałęzi `zloze` (`:12611`),
/// `tech` (`:12621`), `surowiec_boolean` (`:12625`), `surowiec_ilosc` (`:12632`) i `praca`
/// (`:12593`).
///
/// Uwagi względem pina (odczyt `07d2fbd72`):
/// - Pusta lista pozycji = no-op (pin: `if (!items?.length) return;`).
/// - `zloto` (pin `:12576`): jednorazowy transfer złota (`applyOneShotGoldTransfer`). Rust nie
///   ma odpowiednika tej ścieżki skarbca. NIE_ZMIERZONO, rodzaj w `skipped_kinds`.
/// - `zywnosc` (pin `:12586`): zmiana `zapasyPanstwa` w `empireFoodStates` i czyszczenie
///   `_maxSafeRationCache`. Stan `OwnerFoodStates` (`city_growth.rs`) nie udostępnia zapisu
///   poza własnym modułem. NIE_ZMIERZONO, rodzaj w `skipped_kinds`.
/// - `miasto` (pin `:12648`): `transferCityByTreaty`. Brak wariantu `BasketItemKind` i brak
///   odpowiednika w Rust. NIE_ZMIERZONO (`typ: "miasto"` nie deserializuje się do `BasketItem`).
/// - `jednostka` (pin `:12664`): świadomy no-op na pinie (TODO A1). Zostaje jak w zloze.
/// - `tech` (pin `:12621`): `basketTransferCtx = r.context` zawsze. Efekty `player.zbadane`
///   i epoki dla gracza `0` raportowane w `unported_side_effects`.
pub fn transfer_basket_items(
    from_owner_id: PlayerId,
    to_owner_id: PlayerId,
    items: &[BasketItem],
    deal_id: Option<&str>,
    grants: &mut Vec<ZlozeGrant>,
    state: &mut BasketTransferState<'_>,
) -> BasketTransferOutcome {
    let mut outcome = BasketTransferOutcome::default();
    for item in items {
        match item.kind {
            BasketItemKind::Deposit => {
                let hex_key = item.hex_key.clone().unwrap_or_else(|| item.id.clone());
                grants.push(ZlozeGrant {
                    granter_owner_id: from_owner_id,
                    grantee_owner_id: to_owner_id,
                    partner_id: to_owner_id,
                    zloze_id: item.id.clone(),
                    hex_key,
                    active: true,
                    deal_id: deal_id.map(str::to_string),
                });
                outcome.grants_created += 1;
            }
            BasketItemKind::Technology => {
                let r = grant_tech_to_owner(&item.id, to_owner_id, state.context);
                *state.context = r.context;
                if r.granted && to_owner_id.get() == 0 {
                    outcome.unported_side_effects.push(
                        "tech_owner0: zbadane, reconcilePlayerEraFromResearch, powiadomienie",
                    );
                }
            }
            BasketItemKind::BooleanResource => {
                let r = grant_surowiec_boolean_access(
                    &item.id,
                    from_owner_id,
                    to_owner_id,
                    state.context,
                );
                *state.context = r.context;
            }
            BasketItemKind::QuantityResource => {
                // Pin: totalUnits = diplomacyNormalizeSurowiecIlosc(id, qty) (floor do kroku handlu).
                let total_units = normalize_resource_quantity(&item.id, item.quantity, None);
                let cap_id = (state.capital_city_for)(to_owner_id);
                let result = transfer_surowiec_ilosc(
                    &item.id,
                    total_units,
                    from_owner_id,
                    to_owner_id,
                    cap_id.as_deref(),
                    state.cities,
                );
                for (city, after) in state.cities.iter_mut().zip(result.cities.iter()) {
                    if after.resources != city.resources {
                        city.resources = after.resources.clone();
                    }
                }
            }
            BasketItemKind::Work => {
                // Pin: praca = diplomacyPnPraca(qty); from = max(0, from - praca); to += praca.
                // Odczyt puli `to` następuje PO zapisie `from` (jak na pinie; ma znaczenie gdy from == to).
                let praca = pn_praca(item.quantity, state.pn_praca_skala);
                let from_pool = state
                    .praca_pool_by_owner
                    .get(&from_owner_id.get())
                    .copied()
                    .unwrap_or(0.0);
                state
                    .praca_pool_by_owner
                    .insert(from_owner_id.get(), (from_pool - praca).max(0.0));
                let to_pool = state
                    .praca_pool_by_owner
                    .get(&to_owner_id.get())
                    .copied()
                    .unwrap_or(0.0);
                state
                    .praca_pool_by_owner
                    .insert(to_owner_id.get(), (to_pool + praca).max(0.0));
            }
            other => {
                if !outcome.skipped_kinds.contains(&other) {
                    outcome.skipped_kinds.push(other);
                }
            }
        }
    }
    outcome
}
