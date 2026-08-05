# R-WIARYGODNOSC-TEMPO-PRZYWROCENIE — przywrócenie mnożnika tempa (WIAR-Q3=C)

**Data:** 2026-08-03  
**Decyzja Macieja:** „Przywrócić TEMPO" — WIAR-Q3=C (oryginalna Dźwignia 1).

## ECHO

- **WIAR-Q3=C** — mnożnik tempa Wiarygodność→Zaufanie (nie bezpośredni strumień ΔZ=W/20).
- Strumień `W/20` **usunięty** z `tickDiplomacy`.
- **D4 bez zmian** — `modyfikatorZaufaniaD4OdWiarygodnosci`, `zaufaniePierwszyKontaktZD4` nadal `round(W/20)`.

## Wzór (kanon)

```
wzrostMult(W) = 1 + (W/100) × 0.5
spadekMult(W) = 1 − (W/100) × 0.5
```

Klamrowane W do −100…+100 przed wzorem.

| W | wzrost | spadek |
|---|--------|--------|
| +100 | ×1.5 | ×0.5 |
| 0 | ×1.0 | ×1.0 |
| −100 | ×0.5 | ×1.5 |

## Implementacja

- `gra/src/game/diplomacy-credibility.ts` — `wiarygodnoscWzrostMult`, `wiarygodnoscSpadekMult`, `applyWiarygodnoscTempoDoDelty`; `strumienWiarygodnoscDoZaufania` oznaczony legacy/ANULOWANY.
- `gra/src/game/diplomacy.ts` — `tickDiplomacy`: mnożnik na zsumowanym `dZ` (przed war-zeroing i clamp).
- `applyDiplomaticEvent` — **✅ WDROŻONE (R1b, 2026-08-05)** — opcjonalny `wiarygodnosc` → `applyWiarygodnoscTempoDoDelty` na dZ (nie dR); `applyDiploEventTracked` w `main.ts` przekazuje `getWiarygodnosc(0)` dla par gracz↔AI poza wojną.

## Przykłady

- sojusz +3, W=+100 → dZ = 4.5
- sojusz +3, W=−100 → dZ = 1.5
- ekspansja −2, W=+100 → dZ = −1
- ekspansja −2, W=−100 → dZ = −3
