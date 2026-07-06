# MASTER → Grupa D — D-CUD2 utrzymanie wygasłego cudu

**Flaga:** 🟢 **AKTYWNA** (Maciej **Tak — wdrażaj** 2026-06-26)  
**Decyzja:** `docs/decyzje/D-CUD2-utrzymanie-wygasly.md` · **D-CUD2 = C**

---

## Co Master przekazuje

Maciej: **C** — po wygaśnięciu bonusów utrzymanie = **50%** starej stawki (`floor(utrzymanie/2)`, min. 0).

Przykład: Piramidy 2 → **1** złoto/turę po absolut.

---

## Co Grupa D robi

| Krok | Akcja |
|------|--------|
| 1 | `_meta.absolut.po_absolut` w `wonders.json` — wpis `utrzymanie_wygasly: "50pct"` + opis |
| 2 | Silnik / helper utrzymania cudów — era > absolut → połowa stawki |
| 3 | Test lane (cuda / turn-economy jeśli dotyczy) |
| 4 | Meldunek **`→ MASTER: GOTOWE`** · REJESTR 🔵 W TRAKCIE → 🟢 po wdrożeniu |

**Nie** zmieniaj decyzji D-CUD1 (+10 handlu, cud zostaje).

---

## DoD

- [ ] JSON `_meta` + implementacja 50%
- [ ] Testy lane zielone
- [ ] Wpis w `D-cywilizacje.md` § DECYZJE MACIEJA

---

**Master nie edytuje silnika cudów** — tylko dyspozycja. Grupa D · trigger: **`działaj`**.
