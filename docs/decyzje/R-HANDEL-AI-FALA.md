# R-HANDEL-AI-FALA — koszyki umów handlowych AI

**Status:** WDROŻONE (kod) · 2026-08-03 · bez deploy ROBOCZA  
**Branch:** `cursor/handel-ai-polacz-63a1`

## Decyzja

| ID | Odpowiedź | Treść |
|----|-----------|--------|
| **R-HANDEL-AI-FALA-Q1** | **B** | Skalowany koszyk: AI buduje umowę z realnych zapasów obu stron; pusta oferta nigdy nie trafia na stół; możliwy drobiazg złota |

(Maciej: „zajmij się” tematem + rekomendacja B z paczki Integrator 2026-08-03.)

## Implementacja

- `buildClampedAiTradeAgreementPayload()` — `gra/src/game/diplomacy-ai-balance.ts`
- `enqueueNegotiationFromAiCmd` — `main.ts`: dla `zaproponuj_umowe_handlowa` buduje koszyk, clamp, early return gdy pusty
- Cap złota: `AI_TRADE_AGREEMENT_SWEETENER_MAX` / `AI_TRADE_GOLD_MAX`
- Test: `diplomacy-ai-balance-test.cjs` 17/17

## Playtest (po deploy)

AI cywilizacja proponuje umowę → karta ma niepusty koszyk zgodny z magazynami; brak „pustych” ofert.
