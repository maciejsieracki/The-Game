# R-PW-ACCEPT-OVERPAY — Przyjmij ofertę AI przy overpay

**Status:** ZDEPLOYOWANE FALA 214 `adefb5b8`  
**Data:** 2026-08-04 · **PR:** #79

## Decyzja Macieja

| ID | Odpowiedź | Treść |
|----|-----------|-------|
| **R-PW-ACCEPT-OVERPAY-Q1** | **A** | Gracz może **Przyjmij** gdy oddaje więcej PW niż wymaga fair-min partnera (overpay OK); blokada gdy net PW < 0 (korzyść gracza kosztem partnera). |

## Problem

Przycisk **Przyjmij** był zablokowany, gdy gracz oddawał **więcej** niż minimum fair — UI sugerowało „nieuczciwą ofertę dla partnera", choć gracz chciał świadomie przepłacić.

## Przyczyna

`previewNegotiationEntry` w `main.ts` wołał `evaluateProposal` / `pnDealAcceptedByAi` — bramka **fair-min AI**, nie netto gracza-respondenta.

## Rozwiązanie

- `previewIncomingPlayerAccept` w `diplomacy-acceptance-points.ts` — net PW = myOffer − theirOffer; akceptacja gdy **net ≥ 0**.
- `previewNegotiationEntry` — dla incoming handel/umowa: najpierw `previewIncomingPlayerAccept`, potem `evaluateProposal`.
- Test: `diplomacy-acceptance-points-test.cjs` (overpay 160 vs 100 → accept; underpay → block).

## Pliki

`gra/src/game/diplomacy-acceptance-points.ts` · `gra/src/main.ts` · `gra/tools/diplomacy-acceptance-points-test.cjs`
