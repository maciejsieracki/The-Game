# B1-Q11 — Ulepszenia terenu → plony v1.0

| Pole | Wartość |
|------|---------|
| **Decyzja Macieja** | **A** (2026-06-27) |
| **Status** | **ZAMKNIĘTE** |
| **Powiązane** | A4-Q1=A (budowa z mapy), B1.4=4C (okolica), D4 |

---

## Ustalenie

**v1.0 pełne:** wszystkie **15 typów** ulepszeń z `terrain-improvements.json` wpływają na plony heksa (`tileYield` / `WorkedTile`).

- Auto-assign i ręczne pola okolicy (**4C**) respektują bonus ulepszenia.
- Budowa ulepszeń = tryb **Budowa** na mapie (nie panel miasta).

---

## Lane / DoD

| Lane | Zadanie |
|------|---------|
| EKONOMIA | `tileYield()` + `WorkedTile.ulepszenie` |
| MAPA | sync render ↔ stan heksa |
| SILNIK | wire w turze ekonomii |
| Testy | regresja plonów per heks |

**Szacunek:** ~1–1,5 sprintu (największy batch z paczki ABC).

---

*Maciej: B1-Q11=A, formularz ABC 2026-06-27*
