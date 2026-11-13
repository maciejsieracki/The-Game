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
    /// Rodzaje pozycji, których ten port nie wykonuje (każdy rodzaj raz). Obejmuje gałęzie
    /// realnie wykonywane na pinie (np. `zloto`), ale też `jednostka`, która na pinie jest
    /// no-op. Niepusta lista = port nie obejmuje tych rodzajów; nie zawsze = rozbieżność z pinem.
    pub skipped_kinds: Vec<BasketItemKind>,
}

/// Port gałęzi `case 'zloze'` z `transferBasketItems` (pin `main.ts:12611-12620`).
///
/// Pin: `hexKey = item.hexKey ?? item.id`; push `{ granterOwnerId: from, granteeOwnerId: to,
/// partnerId: to, zlozeId: item.id, hexKey, active: true, dealId }`.
/// Pusta lista pozycji = no-op (pin: `if (!items?.length) return;`).
///
/// Uwagi o zakresie względem pina (wszystkie potwierdzone odczytem `07d2fbd72`):
/// - `jednostka` jest na pinie świadomym no-op (`case 'jednostka'`, komentarz TODO A1: nic
///   nie tworzy ani nie zdejmuje). Port też nic nie robi; trafia do `skipped_kinds` tylko
///   dlatego, że ten moduł nie wykonuje żadnej gałęzi poza `zloze`. NIE oznacza to rozbieżności
///   z pinem dla tego rodzaju.
/// - Przed pętlą pin woła `syncBasketResearchFromEngine()` i `buildDiploTreasury()`. Pierwsza
///   zapisuje wyłącznie `basketTransferCtx` (kontekst badań dla gałęzi `tech`/`surowiec_*`), a
///   druga tylko buduje obiekt z domknięciami bez efektów. Żadna nie zapisuje `zlozeGrants`,
///   więc dla gałęzi `zloze` ich brak nie zmienia wyniku. Efekt `basketTransferCtx` nie jest
///   portowany (dotyczy gałęzi niezportowanych).
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
