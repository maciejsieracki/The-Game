# B7-Q1 + B8-Q1 — Kolejki produkcji i nawigacja miast

**B7:** A — dwie kolejki na górze sekcji Produkcja (budowa + rekrutacja), przed bieżącą pozycją.

**B8:** B — strzałki ‹ › przy nazwie miasta w górnym pasku (UX frame), wire `switchCity`.

**Wdrożenie (2026-07-07):**
- `appendBuildQueueSection` + `appendRecruitmentQueue` na początku `renderProd`.
- `renderCivResourceTopBar`: przyciski `#civ-v-city-prev` / `#civ-v-city-next` obok nazwy.

**Status:** ✅ WDROŻONE
