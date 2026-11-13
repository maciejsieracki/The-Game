//! R-RUSTPORT-P6-ZLOZA-B: port realizacji koszyka — gałąź `zloze` funkcji `transferBasketItems`.
//!
//! Pin: `07d2fbd72f758705f8e1d59cc4968027ffbafe75`, `gra/src/main.ts:12566` (funkcja),
//! `:12613` (push `ZlozeGrant` w gałęzi `case 'zloze'`).
//!
//! Zakres tego modułu: WYŁĄCZNIE tworzenie grantu złoża przy realizacji pozycji koszyka
//! typu `zloze` (kolejność pozycji zachowana, tak jak na pinie). Pozostałe gałęzie
//! `transferBasketItems` (`zloto`, `praca`, `zywnosc`, `tech`, `surowiec_*`, `miasto`,
//! `jednostka`) NIE są tu portowane — nie mają jeszcze odpowiednika realizacji w Rust;
//! funkcja raportuje je w `BasketZlozeOutcome::skipped_kinds`, żeby wywołujący nie
//! traktował ich jako wykonanych.
//!
//! Wpięcie w produkcję (ZŁOŻA-C/wiring) NIE należy do tego modułu.

use super::diplomacy::{BasketItem, BasketItemKind, ZlozeGrant};
use super::PlayerId;

/// Wynik `transfer_basket_zloze_grants`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct BasketZlozeOutcome {
    /// Liczba utworzonych grantów (`zlozeGrants.push` na pinie).
    pub grants_created: usize,
    /// Rodzaje pozycji pominięte przez ten port (niepuste = port niepełny wobec pinu).
    pub skipped_kinds: Vec<BasketItemKind>,
}

/// Port gałęzi `case 'zloze'` z `transferBasketItems` (pin `main.ts:12611-12620`).
///
/// Pin: `hexKey = item.hexKey ?? item.id`; push `{ granterOwnerId: from, granteeOwnerId: to,
/// partnerId: to, zlozeId: item.id, hexKey, active: true, dealId }`.
/// Pusta lista pozycji = no-op (pin: `if (!items?.length) return;`).
pub fn transfer_basket_zloze_grants(
    from_owner_id: PlayerId,
    to_owner_id: PlayerId,
    items: &[BasketItem],
    deal_id: Option<&str>,
    grants: &mut Vec<ZlozeGrant>,
) -> BasketZlozeOutcome {
    let mut outcome = BasketZlozeOutcome::default();
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
            other => {
                if !outcome.skipped_kinds.contains(&other) {
                    outcome.skipped_kinds.push(other);
                }
            }
        }
    }
    outcome
}
