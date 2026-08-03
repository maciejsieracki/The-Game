# R-WIARYGODNOSC-TEMPO-PRZYWROCENIE — Przywrócenie mnożnika tempa (WIAR-Q3)

**Data:** 2026-08-03  
**Status:** 🔵 W TRAKCIE (PR #49, bez merge/deploy na main)  
**Powiązane:** WIAR-Q3=C · `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §5 Dźwignia 1  
**Branch:** `cursor/wiarygodnosc-tempo-q3-63a1` → **PR #49**

---

## ECHO — cytat Macieja

> **„Przywrócić TEMPO"** (2026-08-03, sesja cloud wieczór)

Maciej potwierdził, że oryginalna **Dźwignia 1** to **mnożnik tempa** wzrostu/spadku Zaufania, a nie bezpośredni strumień `W/20` co turę w `tickDiplomacy`. Strumień był zamiennikiem — gracz nie odczuwał „tempa" reputacji.

---

## Decyzja

| ID | Litera | Treść |
|----|--------|-------|
| **WIAR-Q3** | **C** | TEMPO (mnożnik) **+** PROGI (Dźwignia 3: sojusz W≥0, NAP W≥−40) |

### Wzór mnożnika tempa (obowiązujący po merge)

```
wzrostMult = 1 + (W / 100) × 0.5
spadekMult = 1 − (W / 100) × 0.5
```

Stosowane na istniejące składniki `dZ` w `tickDiplomacy` (nie jako osobny addend `W/20`).

### Co skasować

- Strumień **`ΔZaufanie/turę = W/20`** w `tickDiplomacy` (wdrożony jako C-WIAR-SKALA=20) — **ANULOWANY**.
- **Wyjątek:** `round(W/20)` na **pierwszym kontakcie** (Dźwignia 4 / C-WIAR-D4) — **zostaje**.

---

## Implementacja (PR #49)

- Pliki: `gra/src/game/diplomacy.ts`, `gra/src/game/diplomacy-credibility.ts`, test `wiarygodnosc-test.cjs`
- Self-check: typecheck + `node tools/wiarygodnosc-test.cjs`

---

## Dowód / następny krok

| Etap | Stan |
|------|------|
| Kod na branchu | ✅ PR #49 |
| Merge main | ⏸ czeka Maciej |
| Deploy ROBOCZA | ⏸ po `deploy` |
| Spec zaktualizowana | ✅ notka w `WIARYGODNOSC-SPECYFIKACJA.md` §5 |

**Handoff sesji:** `docs/decyzje/SESJA-WIARYGODNOSC-RELACJA-2026-08-03.md`
