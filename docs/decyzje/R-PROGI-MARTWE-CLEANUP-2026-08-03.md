# R-PROGI-MARTWE-CLEANUP — martwe progi dyplomacji (2026-08-03)

**Status:** wdrożone w kodzie (bez deploy)  
**Branch:** `cursor/wiarygodnosc-progi-1-2-63a1`  
**Powiązane:** PR #52 (D3 W gates cherry-pick na tym branchu)

## Co usunięto

| Parametr | Powód |
|----------|--------|
| `progNapZaufanie` | NAP = **tylko Relacja** (`docs/decyzje/D3-PROG-DIFF-2026-07-21.md`). `evaluateProposal` nigdy nie sprawdzał Zaufania na NAP; AI w `ai.ts` nadal wymagał Zaufania — **usunięto check AI**, param martwy. |
| `progWchloniecieRespekt` | Nigdy używany — D3-PROG-G2 (akcja wchłonięcia) nie istnieje w UI; action 13 = Prezent. |
| `progHandelFairRatioMin` / `progHandelFairRatioMax` | Nigdy czytane w `gra/src` — fair deal = engine PN (`diplomacy-proposals.ts`). |

## Co zostało (ten branch)

- **D3 W gates** w `evaluateProposal`: sojusz `W ≥ 0`, NAP `W ≥ −40` (`wiarygodnoscProgSojuszMin` / `wiarygodnoscProgNapMin`).
- `buildProposalEvalContext` → `proposerWiarygodnosc` / `responderWiarygodnosc` z `getWiarygodnosc`.

## Pliki

- `gra/src/game/ai.ts` — NAP AI: Rel only
- `gra/src/game/diplomacy.ts` — `DIPLOMACY_PARAMS`, `DIPLO_ZAUFANIE_THRESHOLD_KEYS`, `DIPLO_RESPEKT_THRESHOLD_KEYS`
- `gra/data/diplomacy.json`
- `gra/src/types/diplomacy.ts` — `DiplomacyConfig`
- Testy: `diplomacy-proposal-test.cjs`, `diplomacy-test.cjs`

## CZEKAM-NA

Maciej — merge / deploy (bez deployu z tej sesji chmurowej).
