# Design ↔ Lane — hak po haku (Maciej · 2026-07-04)

**Zasada nadrzędna:** najpierw **szkic w grze**, potem **Twój werdykt**, dopiero potem **designer** (jeśli w ogóle).

`master` / kod w kanonie = **szkic techniczny**. To **nie** zamyka tematu UX.

---

## Kolejność (domyślna — ustalona z Maciejem)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. SZKIC (lane) — funkcja + placeholder CSS w robocza/kanon │
│    → PNG / screenshot do Macieja                             │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. HAK 1 — TREŚĆ (Maciej)                                   │
│    Czy w panelu jest wszystko co ma być? Co usunąć/dodać?   │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. HAK 2 — WYGLĄD (Maciej) — werdykt A / B / C             │
└───────────────────────────┬─────────────────────────────────┘
                            ▼
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
   A: nadal stare      B: już nowe         C: układ OK,
   → DESIGN            → KONIEC            wygląd słaby
   → lane v2           (zostaw szkic)     → poprawki lane
   → master                                  → PNG
                                             → DESIGN
                                             → lane v2
                                             → master
```

---

## Werdykty Macieja (Hak 2)

| Kod | Znaczenie | Następny krok |
|-----|-----------|---------------|
| **A** | Wygląda nadal **stare** / nie 1E | Design mockup → lane v2 |
| **B** | **Już nowe** — nie ruszamy designera | `[x]` temat zamknięty |
| **C** | **Treść OK**, wygląd wymaga dopracowania | Maciej: lista poprawek → lane → PNG → Design |

---

## Kiedy Design (designer / sesja brand-book)

**TAK:** werdykt **A** lub **C** (po ewentualnych poprawkach lane z Hak 1 / C).

**NIE:** werdykt **B** — szkic zostaje w grze, Design nie startuje.

**Wejście Design:** PNG szkicu + baseline (jeśli jest) + lista uwag Macieja + komponenty DS (Panel 5C, Btn…).

**Wyjście Design:** mockup HTML 1E → lane v2 (bez improwizacji) → master.

---

## Tor A (Design najpierw) — wyjątek

Tylko gdy **mockup 1E już istnieje** (dyplomacja, E-15, miasto W3):

```
Mockup gotowy → Maciej OK → lane implement → master
```

Nie stosujemy do A-06 (brak mockupu — szedliśmy Tor B).

---

## Statusy w kolejce UX

| Status | Znaczenie |
|--------|-----------|
| `[~] szkic` | w kanonie, **czeka werdykt Macieja** (Hak 1–2) |
| `[~] poprawki` | Maciej podał uwagi, lane poprawia przed Design |
| `[~] design` | mockup w toku / gotowy, lane v2 czeka |
| `[x] UX` | Maciej werdykt **B** lub Design+lane v2 OK |
| `[x] kanon` | tylko technicznie — **≠ UX final** |

---

## A-06 — gdzie jesteśmy

| Krok | Status |
|------|--------|
| 1 Szkic lane v0 | ✅ w kanonie `a8da1fcb…` |
| PNG review | ✅ `docs/ux/export/A-06-review-stary-vs-szkic.png` |
| 2 Hak 1 treść | ⏳ **czeka Maciej** |
| 3 Hak 2 wygląd A/B/C | ⏳ **czeka Maciej** |
| Design | ⛔ **nie startować** przed werdyktem |

**Checklist:** [`export/A-06-REVIEW-MACIEJ.md`](../export/A-06-REVIEW-MACIEJ.md)

---

## Co pisać — gotowce

**Po szkicu (lane → Ty):**
> Otwórz `docs/ux/export/A-06-review-stary-vs-szkic.png` — Hak 1 treść + Hak 2 wygląd A/B/C.

**Ty (przykłady):**
- `A-06 treść OK · wygląd B` → koniec tematu
- `A-06 treść: usuń Połącz gdy 1 jednostka · wygląd C: za płasko` → lane poprawka → Design
- `A-06 treść OK · wygląd A` → Design mockup

**Design (dopiero po A lub C):**
> Mockup A-06 1E wg PNG + uwagi Macieja w `A-06-REVIEW-MACIEJ.md`.

---

*Workflow UX · hak po haku · 2026-07-04*
