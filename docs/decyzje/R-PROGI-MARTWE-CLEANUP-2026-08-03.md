# R-PROGI-MARTWE-CLEANUP — martwe progi dyplomacji (2026-08-03)

**Status:** wdrożone w kodzie (bez deploy)  
**Branch:** `cursor/wiarygodnosc-progi-1-2-63a1`  
**Powiązane:** PR #52 (D3 W gates cherry-pick na tym branchu)

## Co usunięto

| Parametr | Powód |
|----------|--------|
| `progNapZaufanie` | NAP = **tylko Relacja** (`docs/decyzje/D3-PROG-DIFF-2026-07-21.md`). `evaluateProposal` nigdy nie sprawdzał Zaufania na NAP; AI w `ai.ts` nadal wymagał Zaufania — **usunięto check AI**, param martwy. |
| `progHandelFairRatioMin` / `progHandelFairRatioMax` | Nigdy czytane w `gra/src` — fair deal = engine PN (`diplomacy-proposals.ts`). |

**Korekta merge FALA 206 (#54 + #56):** `progWchloniecieRespekt` **zachowany** (wartość 90) — używany przez wchłonięcie gracza (`R-GRACZ-WCHLONIECIE`, PR #56) w `diplomacy-proposals.ts` / `diplomacy-locks.ts`. Pierwotny wpis „martwy” był sprzed wdrożenia akcji wchłonięcia.

## Co zostało (ten branch)

- **D3 W gates** w `evaluateProposal`: sojusz `W ≥ 0`, NAP `W ≥ −40` (`wiarygodnoscProgSojuszMin` / `wiarygodnoscProgNapMin`).
- `buildProposalEvalContext` → `proposerWiarygodnosc` / `responderWiarygodnosc` z `getWiarygodnosc`.
- `progWchloniecieRespekt: 90` — bramka Respektu dla wchłonięcia (PR #56).

## Pliki

- `gra/src/game/ai.ts` — NAP AI: Rel only
- `gra/src/game/diplomacy.ts` — `DIPLOMACY_PARAMS`, `DIPLO_ZAUFANIE_THRESHOLD_KEYS`, `DIPLO_RESPEKT_THRESHOLD_KEYS`
- `gra/data/diplomacy.json`
- `gra/src/types/diplomacy.ts` — `DiplomacyConfig`
- Testy: `diplomacy-proposal-test.cjs`, `diplomacy-test.cjs`

## CZEKAM-NA

Maciej — merge / deploy (bez deployu z tej sesji chmurowej).
