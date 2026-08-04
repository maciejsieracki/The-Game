# AI-FOUND-Q1 — Founding AI major: min. populacja źródła

| Pole | Wartość |
|------|---------|
| **ID** | AI-FOUND-Q1 |
| **Ekran** | AI zakładanie miast (founding) |
| **Status** | 🟢 **WDROŻONE** — FALA 220 `8a3c6d6d` · commit `b47a2e8` |
| **Decyzja** | **A** |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Founding AI major **pop ≥ 2** (jak gracz — koszt founding −1 ludność → źródło musi mieć ≥2).

---

## Reguła gameplay

- **AI major** (`ownerId > 0`, nie MP): miasto-źródło founding wymaga **populacja ≥ 2** przed osadnikiem.
- Po founding: źródło **2→1** (symetria z graczem).
- MP / defensiveCopy: **bez zmian** (osobna ścieżka founding).

---

## Implementacja

- `city-founding.ts` — `AI_MAJOR_FOUNDING_SOURCE_MIN_POP = 2`
- `ai.ts` — `pickSourceCityForFounding` dla major AI
- Test: `ai-test.cjs` T8a

---

## Powiązane

- `R-AI-KOLONIZACJA.md` (AI surge pop≥5 — **inna** bramka kolonizacji)
- `P-AI-MOC-GAP` — częściowo złagodzone (nie zamknięte bez playtestu)
