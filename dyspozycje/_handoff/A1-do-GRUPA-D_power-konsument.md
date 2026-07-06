# Grupa A → Grupa D: Power jako input dyplomacji

**Status:** **INFO** · **Decyzja Macieja:** A1-Q15=A (2026-06-27)

---

## Kontekst

- **Grupa A:** wyświetla Power na HUD mapy (środek paska + overlay składników).
- **Grupa B:** dostarcza wytyczne wyliczania składników miasto/ekonomia → handoff `A1-do-GRUPA-B_power-wyliczanie.md`.
- **Grupa D:** Respekt, progi AI, panel dyplomacji — **konsumują** liczbę Power.

---

## Co Grupa D ma wiedzieć

1. Power **nie** jest na liście zasobów — osobny znacznik centralny [A′].
2. Respekt per nacja **zostaje w panelu dyplomacji** (nie duplikować na HUD mapy).
3. Po zmianie spec wyliczania (Grupa B) — zweryfikować progi w `diplomacy.ts` / `SPEC-Respekt.md`.
4. Overlay Power na mapie może pokazywać **przykładowy** Respekt względem sąsiada (demo mockup) — pełna lista relacji tylko w dyplomacji.

**Brak nowego ABC** — chyba że B zmieni wagi składników (wtedy Maciej).

**Flaga:** INFO — bez implementacji w Grupie D do czasu spec B
