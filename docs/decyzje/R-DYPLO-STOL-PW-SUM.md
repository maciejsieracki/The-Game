# R-DYPLO-STOL-PW-SUM — bilans PW sumuje wszystkie umowy na stole

**Data:** 2026-08-04  
**Status:** WDROŻONE (kod, bez deploy)  
**Zgłoszenie:** Maciej — playtest stołu negocjacji

## Problem

Na **Stole negocjacji**, gdy na stole są **wiele pending umów** tej samej pary (np. Traktat handlowy + Umowa wymiany surowców), centralny panel **Punkty wymiany (PW)** liczył tylko **pierwszą (primary)** umowę. Dodatkowe umowy pokazywały badge „+N inna na stole", ale ich PW **nie wchodziły** do kolumn My oddajemy / Oni oddają / Bilans.

Efekt: dodanie wymiany surowców, która powinna wyrównać bilans (np. z −8 do 0), **nie zmieniała** liczb w panelu — Przyjmij pozostawał zablokowany.

## Przyczyna

`negotiationBalanceBarHtml()` w `diplomacyAudience.ts` wywoływał `balancePanelDataFromRow(primary, extra)` — tylko jeden wiersz + licznik pozostałych.

## Rozwiązanie

1. **`balancePanelDataFromRows(rows)`** w `diplomacyAcceptanceBalance.ts`:
   - Sumuje `myOfferPn` i `theirOfferPn` ze wszystkich wiersów (via istniejące `balancePanelDataFromRow` / `sideDisplayOfferPw`).
   - Metadane (actionLabel, negotiationId, direction, relacja, treaty base…) z **primary** (`pickPrimaryNegotiationRow`).
   - `actionLabel` przy wielu umowach: `primary + N inna/inne` (bez badge `extraOnTable`).
   - `canAccept` dla **incoming**: `(mySum − theirSum) >= 0` (R-PW-ACCEPT-OVERPAY).
   - `theirBalance` / `myBalance`: `balancePn` = net sumy, `accepted` wg net ≥ 0.

2. **`negotiationBalanceBarHtml`** → `balancePanelDataFromRows(rows)`.

## Testy

- `gra/tools/diplomacy-stol-pw-sum-test.cjs` — mock 72/80 + 10/2 → 82/82, net 0, canAccept true.

## Powiązane

- R-PW-ACCEPT-OVERPAY — blokada Przyjmij przy przewadze gracza (net < 0).
- R-DYPLO-WYMIANA-FLEX — unified Przyjmij/Usuń (osobny ABC, nie ten fix).
