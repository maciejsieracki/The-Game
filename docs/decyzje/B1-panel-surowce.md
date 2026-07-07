# B1-Q1 — Duplikat „Surowce w zasięgu”

**Decyzja:** B — usunąć tylko zduplikowany blok; panel zostaje w stopce UX.

**Wdrożenie (2026-07-07):**
- Usunięto `#cs-surowce` ze skeletonu drawer oraz martwe `renderSurowce` z `rerender()`.
- Jedyny blok surowców: stopka UX (`renderSurowce` ~6968 w `cityPanel.ts`).
- Suwaki podziału handlu (`appendPodzialHandlu` → `onPodzialHandluChange` → `rerender`) — bez zmian, test `wire-ekonomia-test` 37/37.

**B2-Q1 (2026-07-07):** Maciej **B** — układ zakładek, poprawa czytelności handlu. Szczegóły: `docs/decyzje/B2-Q1-panel-handlu-zakladki.md`.

**Status:** ✅ WDROŻONE
