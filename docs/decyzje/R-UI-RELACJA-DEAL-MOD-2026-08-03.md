# R-UI-RELACJA-DEAL-MOD — Wpływ Relacji na deal (panel PW)

**Data:** 2026-08-03  
**Status:** 🟠 U INTEGRATORA (PR #50, bez merge/deploy na main)  
**Branch:** `cursor/ui-relacja-deal-mod-63a1` → **PR #50**

---

## Decyzja / cel

Maciej potwierdził model wyceny:

- **Relacja** = Zaufanie + Respekt (0–200)
- **Relacja 100** = balans deala (0% modyfikatora)
- **Relacja > 100** → tańszy deal dla proponującego (korzyść negocjacyjna)
- **Relacja < 100** → droższy deal
- **Clamp modyfikatora PN: ±90%**

**UI:** nowy wiersz w panelu propozycji wymiany (PW): **„Wpływ Relacji na deal"** z wartością ±%.

---

## ECHO — cytat Macieja

> „O to mi chodziło" — przy wyjaśnieniu Relacji 100 = balans, clamp ±90%.

---

## Zakres PR #50

- Wyświetlanie modyfikatora Relacji w UI deala (nie zmiana samego silnika PN poza tym, co już liczy Relację)
- **Nie wchodzi:** NAP jako dodatkowy „tip na plus" przy dobrej Relacji — osobny temat (zapisany w `PYTANIA-OTWARTE.md`)

---

## Dowód

| Etap | Stan |
|------|------|
| Kod UI | ✅ PR #50 |
| Merge / deploy | ⏸ |

**Handoff:** `docs/decyzje/SESJA-WIARYGODNOSC-RELACJA-2026-08-03.md`
