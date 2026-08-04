# AI-MANAGE-Q1 — Auto-zarządca dla AI major

| Pole | Wartość |
|------|---------|
| **ID** | AI-MANAGE-Q1 |
| **Ekran** | Auto-zarządzanie miast (budowa / ulepszenia / suwaki) |
| **Status** | 🟢 **WDROŻONE** — FALA 220 `8a3c6d6d` · commit `b47a2e8` |
| **Decyzja** | **A** |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> **Auto-zarządca dla major AI** (nie MP / defensiveCopy). Tylko wzmacniać **AI major** — te same reguły gospodarcie co gracz.

---

## Reguła gameplay

| Owner | Auto-zarządzanie |
|-------|------------------|
| **Gracz (0)** | Przez UI (jak dziś) |
| **AI major** (`isMajorAiOwner`) | **Zawsze ON** — auto budowa / ulepszenia / suwaki |
| **MP / defensiveCopy** | **OFF** — bez auto-zarządcy |

Parytet ekonomii: major AI korzysta z tych samych reguł co gracz (nie „darmowe" bonusy MP).

---

## Implementacja

- `owner-utils.ts` — `isMajorAiOwner`
- `main.ts` — `decideAITurn` / tick auto-manage dla major AI
- Test: `ai-test.cjs` T13

---

## Powiązane

- `R-AUTO-V2.md` · `P-AI-MOC-GAP` (auto-manage wdrożone — gap nie zamknięty bez playtestu)
