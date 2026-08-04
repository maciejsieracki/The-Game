# R-DYPLO-PRZYJMIJ-TRADE — Przyjmij na Traktat handlowy

**Data:** 2026-08-04  
**Status:** WDROŻONE (kod, bez deploy)  
**Typ:** bugfix (clear bug — bez ABC)

## Problem

Na stole negocjacji gracz kładzie **Traktat handlowy** (PW zielone, „Spełnia warunki — użyj Przyjmij”). Klik **Przyjmij** nie zakłada aktywnego traktatu.

## Przyczyna

Rozjazd `actionId` dla UI `'5'`:

- `proposalActionIdFromPayload` → `umowa_szlakow` (evaluateProposal obsługuje)
- `proposalActionIdFromUi` → `umowa_handlowa` (evaluateProposal **nie** obsługiwał → `Nieznana akcja dyplomatyczna`)

Panel PW liczył `umowa_handlowa`, silnik odrzucał — przycisk wyłączony lub klik bez efektu.

## Rozwiązanie

1. `evaluateProposal`: `case 'umowa_handlowa':` fall-through do `umowa_szlakow` (deal `RodzajTraktatu.UmowaSzlakow`).
2. `proposalActionIdFromUi('5')` → `umowa_szlakow` (jeden kanoniczny id).
3. UX: `title` na wyłączonym Przyjmij łączy powód preview + PW partnera.

## Pliki

- `gra/src/game/diplomacy-proposals.ts`
- `gra/src/ui/diplomacyTradeBasket.ts`
- `gra/src/ui/diplomacyAudience.ts`
- `gra/tools/diplomacy-proposal-test.cjs`
- `gra/tools/diplomacy-negotiation-table-test.cjs`

## Bramki

- `npx tsc --noEmit`
- `node tools/diplomacy-proposal-test.cjs`
- `node tools/diplomacy-negotiation-table-test.cjs`
- `node tools/diplomacy-acceptance-points-test.cjs` (regresja PW)
