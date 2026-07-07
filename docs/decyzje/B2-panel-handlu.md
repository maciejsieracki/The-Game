# B2-Q1 — Panel handlu (duplikat surowców zakrywa suwaki)

**Data:** 2026-07-07  
**Decyzja Macieja:** **B** — układ zakładek + poprawa czytelności (scroll, overflow, odstępy).  
**Cytat:** „b"

**Status:** ✅ WDROŻONE — pełna spec: `docs/decyzje/B2-Q1-panel-handlu-zakladki.md`

## Powiązanie z B1

Decyzja B2-Q1 uzupełnia **B1-Q1** (`docs/decyzje/B1-panel-surowce.md`):

- Usunięto zduplikowany blok `#cs-surowce` ze skeletonu drawer.
- Jedyny blok surowców: stopka UX (`renderSurowce` w `cityPanel.ts`).
- Suwaki podziału handlu na zakładce `handel` — scroll + hint czytelności (B2-Q1=B).

## Weryfikacja kodu (2026-07-07)

- `cityPanel.ts`: `appendPodzialHandlu` z suwakami — OK; `civ-w4-tab-card--scroll` na zakładce handel — OK.
- Test `wire-ekonomia-test.cjs` — OK po buildzie.

## Co sprawdzić w grze

Prawa kolumna → ikona handlu → zakładka **Podział handlu i zamożność**: chip-grid + 3 suwaki + sekcja Zamożność — przewijalne, bez ucięcia; surowce tylko w stopce.
