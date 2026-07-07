# B5 — Feedback końca tury

**Decyzja Macieja:** **A** (2026-07-07)

## Opcja A (wybrana)

Overlay na mapie przy „Zakończ turę”:
- pasek postępu 0→100%,
- faza (ekonomia, AI, barbarzyńcy…),
- **„Teraz gra: &lt;nazwa miasta/państwa&gt;”** per rywal AI.

## Implementacja

- `gra/src/ui/turnTransitionOverlay.ts`
- hooki w `main.ts` (`runPlayerEndTurn` / skrót N / HUD „Zakończ turę”)

## Status

WDROŻONE (build roboczy).
