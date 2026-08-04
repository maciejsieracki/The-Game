# REL-WIARYG-DRIFT-Q1 — Dryf Zaufania z Wiarygodności

**Status:** WDROŻONE (2026-08-04)  
**Decyzja Macieja:** pasywny Δ Zaufania/turę z globalnej Wiarygodności (−100…+100), liniowo ±3 przy ±100.

## Reguła

- `delta = clamp(W, −100, 100) × 0,03` (W=0 → 0).
- Dryf z W **niezależny** od umów; umowy dokładają istniejące bonusy/tury (handel, sojusz, NAP, religia…).
- Zastąpiony flat **+1/turę** za „pokojowy kontakt bez umowy" — **nie** sumuje się z dryfem W.
- Usunięty mnożnik W na zsumowany ΔZ (`applyWiarygodnoscTempoDoDelty` w `tickDiplomacy`) — brak podwójnego wpływu W.

## Kod

- `gra/src/game/diplomacy-credibility.ts` — `zaufanieDryfOdWiarygodnosci`
- `gra/src/game/diplomacy.ts` — `computeTickZaufanieDelta`, `tickDiplomacy`
- `gra/src/game/diplomacy-factors.ts` — rozbicie UI „Wiarygodność (dryf)"
- `gra/src/ui/diplomacyAudience.ts` — Δ Zaufania/Relacji / turę przy audiencji
- `gra/tools/wiarygodnosc-test.cjs` — asercje W=±100, W=0

## UI

Audiencja dyplomatyczna: przy Zaufaniu i Relacji wyświetlana efektywna Δ/turę (W + umowy).
