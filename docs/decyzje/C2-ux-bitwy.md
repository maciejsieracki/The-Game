# C2 — UX mapy bitwy (pole 3D)

**Ekran:** **mapa bitwy** (`Gra-podglad-BITWA.html`, `battleScene.ts`) — **≠ A2** (mapa świata).  
**Status:** **ZAMKNIĘTE** (D5=B; C2-Q2…Q7 + efekty TW v1.0)  
**Było:** T7

---

## Decyzje Macieja

| Pytanie | Decyzja | Data |
|---------|---------|------|
| D5 (kto proponuje Q2–Q7) | **B** — UI proponuje, Maciej zatwierdza | 2026-06-26 |
| **C2-Q2** minimapa w bitwie | **A** — lewy-dolny róg, TW | 2026-06-26 |
| **C2-Q3** tooltip + panel | **A** — hover + panel ~220 px | 2026-06-26 |
| **C2-Q4** górny pasek | **A** — pełny pasek | 2026-06-26 |
| **C2-Q6** styl | **A** — ciemny + złoto | 2026-06-26 |
| **C2-Q7** sterowanie | **A** — mysz + S/P/H/M **+ efekty TW v1.0** (łuk/miecz, linie rozkazów, Ctrl+M / drag roster = scalanie rannych) | 2026-06-26 |

**Doprecyzowanie Macieja (Q7):** efekty Total War **nie odkładać** — wdrożyć w v1.0 razem z Q7=A.

---

## Wykonanie

| Element | Stan | Pliki |
|---------|------|-------|
| C2-Q2–Q6 | ZAMKNIĘTE | `battleScene.ts`, `battleMinimap.ts`, `preBattle.ts` |
| C2-Q7 + TW FX | ZAMKNIĘTE | `battleScene.ts` — kursor łuk/miecz, linie żółte/czerwone, Ctrl+M + drag roster merge |

Backup: `battleScene.ts.bak-UNITS-20260626-twfx`

---

## → SILNIK

**GOTOWE DO WPIĘCIA:** **TAK** — moduły UNITS; bramka: build + `battle-smoke.cjs` + Opus (Master Silnik).

---

## Faza 2 (C2v2) — ODŁOŻONE

| Pole | Wartość |
|------|---------|
| **Status** | ⏸ **NIE TERAZ** — po **kanonie** |
| **Playtest bitwy 3D** | dopiero po kanonie |
| **Kolejność** | **C2v2-Q2=B** — najpierw balance-check / Panel-C, potem UX v2 |
| **Pytania C2v2-Q1…Q3** | zapisane w czacie 2026-06-26 · **nieaktywne** — nie pytać ponownie do kanonu |
| **C2-FLOW (2026-07-03)** | **ZAMKNIĘTE decyzją** — start RĘCZNY, inicjatywa ATK/DEF · spec: `docs/decyzje/C2-FLOW-manual-start-tura.md` · **wdrożenie w C2v2** |

**C2 z ABC (Q2…Q7):** bez zmian — **ZAMKNIĘTE**, w kanonie.

---

Propozycje UI: `_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md`  
Ograniczenia: `_handoff/UNITS-do-UI_battle-ux-constraints.md`
