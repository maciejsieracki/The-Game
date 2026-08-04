# MP-DIPLO-Q1 — Ułatwienia dyplomacji AI major → MP

| Pole | Wartość |
|------|---------|
| **ID** | MP-DIPLO-Q1 |
| **Ekran** | Dyplomacja AI · absorpcja klastra · relacje same-civ MP |
| **Status** | 🟢 **WDROŻONE** — FALA 220 `8a3c6d6d` · commit `b47a2e8` |
| **Decyzja** | **A** (+ dopisek same-civ) |
| **Data** | 2026-08-04 |

---

## Cytat Macieja

> Ułatwienie **tylko AI major → MP** (nie gracz). **Dopisek:** same-civ (własne MP) → Zaufanie/Relacja **max ~100**; **priorytet nr 1** = szybka absorpcja klastra wokół AI.

---

## Reguła gameplay

| Zakres | Ustalenie |
|--------|-----------|
| Kto | Wyłącznie **AI major → miasta-państwa** (nie gracz ↔ MP) |
| Same-civ MP | Start relacji AI↔MP tego typu → **cap ~100** Zaufania/Relacji (`diplomacy-layers.ts`) |
| Priorytet AI | **#1** absorpcja klastra (same-civ MP wokół stolicy AI) — `ai-cs-absorption.ts` |
| Trudność | Łatwy ≈ dziś wojsko/diplo MP · Normal max1 + mid absorb · Hard 0 wojska + prawie zawsze accept AI→MP |

Gracz: **bez zmian** (R-AI-MP-WASAL-WCHLONIECIE Q3).

---

## Implementacja

- `ai-cs-absorption.ts` — rates + same-civ boost + `rollAiCsAccept`
- `diplomacy-layers.ts` — `startRelationForAiMajorSameCivCityState`
- `main.ts` — cap relacji major↔same-civ MP
- Testy: `ai-cs-absorption-test.cjs` 29/29 · `ai-mp-military-cap-test.cjs` T7

---

## Powiązane

- `R-AI-MP-WASAL-WCHLONIECIE.md` (bazowe Q1–Q3 2026-08-03)
- `REL-MP-SAME-Q1.md` (gracz ↔ MP +20 — **inna ścieżka**)
- `MP-ARMY-Q1.md`
