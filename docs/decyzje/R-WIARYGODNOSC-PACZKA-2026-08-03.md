# R-WIARYGODNOSC-PACZKA — Dźwignia 2=A, NAP, START (2026-08-03)

**Data:** 2026-08-03  
**Status:** 🟠 U INTEGRATORA (PR #47, bez merge/deploy na main)  
**Branch:** `cursor/wiarygodnosc-dzwignia2-a-63a1` → **PR #47**

---

## Decyzje w paczce

| ID | Litera | Treść |
|----|--------|-------|
| **R-WIARYGODNOSC-DZWIGNIA2-Q1** | **A** | **Bez Dźwigni 2** — nie obniżać sufitu Zaufania od darów na podstawie W |
| **NAP-BEZTERMIN** | **A** | Pakt o nieagresji może być bezterminowy (zgodnie z UI/spec) |
| **START-ETAP** | **A** | Start etapowy kontaktu dyplomatycznego (Dźwignia 4) — bez zmian modelu |

---

## ECHO — kontekst

Maciej odrzucił Dźwignię 2 (sufit darów zależny od Wiarygodności). W kodzie `main` **Dźwignia 2 nadal żyje** — **luka vs decyzja A**; usunąć przy merge tej paczki lub osobnym fixem.

Paczka PR #47 zawiera też:
- Badge Wiarygodności w UI dyplomacji (D3)
- Egzekucję **Dźwigni 3** w `evaluateProposal`: sojusz W≥0, NAP W≥−40

---

## Luki znane (2026-08-03)

1. **Dźwignia 2 w main** — sprzeczność z A; patrz `SESJA-WIARYGODNOSC-RELACJA-2026-08-03.md` §C.3
2. **Dźwignia 3 na main** — progi tylko na branchu PR #47 do czasu merge
3. **Tempo (WIAR-Q3)** — osobny PR #49; merge po lub przed #47 — uzgodnić kolejność

---

## Dowód

| Element | PR #47 |
|---------|--------|
| `evaluateProposal` progi W | branch |
| NAP beztermin | branch |
| UI badge W | branch |
| Deploy | ⏸ |

**Handoff:** `docs/decyzje/SESJA-WIARYGODNOSC-RELACJA-2026-08-03.md`
