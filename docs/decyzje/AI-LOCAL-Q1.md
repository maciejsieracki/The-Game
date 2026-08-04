# AI-LOCAL-Q1 — Faza lokalna ekspansji AI major

| Pole | Wartość |
|------|---------|
| **ID** | AI-LOCAL-Q1 |
| **Ekran** | AI early game · founding · zwiadowcy |
| **Status** | 🟢 **WDROŻONE** — FALA 220 `8a3c6d6d` · commit `b47a2e8` |
| **Decyzja** | **A** |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Faza lokalna kończy się **~tura 20** **LUB** gdy AI ma **1 zwiadowca**; **wioski nie blokują** founding.

---

## Reguła gameplay

| Element | Ustalenie |
|---------|-----------|
| Koniec fazy lokalnej | `turn > 20` **lub** ≥1 żywy zwiadowca ownera |
| Wioski (goodie-hut) | **Nie blokują** `planCityFounding` / founding w fazie lokalnej |
| Zakres | **AI major** (nie MP) — `isLocalExpansionPhase` |

Wcześniej: długa faza (2 scouty, t≤45) blokowała founding → gap Mocy vs gracz.

---

## Implementacja

- `ai.ts` — `AI_LOCAL_PHASE_MAX_TURN = 20` · `isLocalExpansionPhase`
- Test: `ai-test.cjs` T6g

---

## Powiązane

- `AI-FOUND-Q1.md` · `P-AI-MOC-GAP` (częściowo złagodzone)
