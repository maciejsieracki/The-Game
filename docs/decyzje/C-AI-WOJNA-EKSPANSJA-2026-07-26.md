# C-AI-WOJNA-Q1 + C-AI-EKSP-Q1/Q2 — AI wojna i ekspansja miast (2026-07-26)

**Status:** 🟢 WDROŻONA (2026-07-26)  
**Grupa:** D (CYWILIZACJE / AI) + Integrator F (`main.ts`, `ai.ts`)  
**Kontekst:** Korekta opisu AI — brak osadników; wojna przed atakiem (C-BARB-Q2).

---

## C-AI-WOJNA-Q1 = **A**

**Cytat Macieja (formularz):** Dyplomacja **PRZED** ruchem — wypowiedzenie w tej turze, atak dopiero od **następnej** (karencja jak N1).

**Wdrożenie:**
- `canEngageOwner`: status `wojna` wymagany dla **każdego** celu (nie tylko gracz); barbarzyńcy wyjątek — zawsze `wojna` (C-BARB-Q1).
- Kolejność fazy AI: dyplomacja (w tym `wypowiedz_wojne` AI↔AI) **przed** `decideAITurn` / wykonaniem ataków.
- Atak w turze wypowiedzenia = zabroniony (parytet N1 dla AI).

---

## C-AI-EKSP-Q1 = **A**

**Cytat Macieja (formularz):** Max **1 miasto / turę / cywilizację**, gdy stać na Pracę + ludność i jest dobry hex.

**Wdrożenie:**
- Usunąć produkcję/ruch osadnika z `ai.ts`.
- `planCityFounding` (lub równoważne): `evaluateFoundCityAffordance` + `foundCityAt` — ten sam koszt co gracz (panel budowy).
- Heurystyka hex: reuse `findSettlerTarget` → wybór lokacji bez jednostki.

---

## C-AI-EKSP-Q2 = **A**

**Cytat Macieja (formularz):** Najpierw **miasta-państwa w klastrze**, dopiero potem zakładanie nowych miast.

**Wdrożenie:**
- Gdy `clusterConsolidationPhase` (cele w `clusterStateTargets`) — **brak** `foundCityAt`.
- Po wyczyszczeniu klastra — normalna ekspansja (C-AI-EKSP-Q1).

---

## Powiązane

- C-BARB-Q2 — wypowiedzenie wojny przed atakiem (wszystkie pary poza barbarzyńcami = stała wojna).
- R-AI-WOJNA-BRAMKA — `dyspozycje/REJESTR-PROSB-I-ZADAN.md`.
