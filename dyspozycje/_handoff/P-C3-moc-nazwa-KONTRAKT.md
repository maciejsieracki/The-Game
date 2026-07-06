# P-C3 — kontrakt nazewnictwa Moc / Power (broadcast)

**Status:** GOTOWE · **Decyzja Macieja:** P-C3 ZAMKNIĘTE 2026-06-26

---

## Co przekazujemy

Stary **Wpływ** (0–100, względem mapy) → **wycofany z UI**.

Nowa metryka obiektywna P-A:
- **PL UI:** **Moc** (np. ⚜ 3020)
- **EN:** **Power** (kod, docs, przyszłe i18n)
- **Kod:** bez rename (`power`, `computeObjectivePower`, `power-params.json`)

**Respekt** — nazwa bez zmian (% w dyplomacji).

---

## Co robi odbiorca

| Lane | Akcja |
|------|--------|
| **UI** | ✅ `power-labels.ts`, hud, overlay, newGameFlow — zrobione |
| **SILNIK / Integrator** | Przy kolejnym batchu kanonu: brak „Wpływ” / „Power” w stringach PL; użyć `mocLabel()` lub „Moc” |
| **EKONOMIA** | Spec + JSON zaktualizowane; testy bez zmiany nazw plików |
| **CYWILIZACJE / E** | Copy zwycięstwa: „Moc + dominacja” (nie Power) w PL |
| **Figma / UX** | Etykiety mockupów: **Moc** zamiast Wpływ/Power w polskich frame’ach |
| **Docs / panele** | PL: Moc · EN: Power |

---

## Nie robić

- Nie przywracać słowa **Wpływ** dla metryki siły imperium (myli się z „wpływ na szczęście” itd.).
- Nie zmieniać nazw plików/modułów `power-*` bez osobnej decyzji technicznej.

---

**Źródło prawdy:** `docs/decyzje/P-C3-moc-power-nazwa.md` · `gra/src/ui/power-labels.ts`
