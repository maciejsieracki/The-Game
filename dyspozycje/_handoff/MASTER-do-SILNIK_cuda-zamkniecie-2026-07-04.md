# MASTER → SILNIK: cuda — zamknięcie paczki G1 (refaktor budowy)

> **Status:** **GOTOWE do dyspozycji** · decyzje Maciej 2026-07-04  
> **Decyzje:** `docs/decyzje/D-CUD-G1A-G1D-ZAMK-2026-07-04.md`

---

## Decyzje Macieja (skrót)

| ID | Decyzja |
|----|---------|
| **G1A** | Budowa cudu = **ulepszenie terenu** na hexie w zasięgu; koszt Praca/pieniądze — **nie** kolejka miasta |
| **G1B** | **`wymagaTerenu` = twarda bramka** |
| **G1C** | Cud **R** → **100%** bonusów |
| **G1D** | ×**3** na `bonusy.miasto` (implementacja w EKONOMIA G2) |

---

## Co jest dziś (CUDA-G1 — do wymiany)

- Toolbar `#civ-wonders-picker` + kolejka `__wonder__:<id>`
- Auto-hex po ukończeniu (`pickWonderHexForCity`)
- Brak bramki terenu

---

## Co MASTER/SILNIK ma zrobić (batchy sekwencyjne)

### Batch 1 — flow ulepszeń terenu (P0)

1. Cud jako typ budowy/ulepszenia na **hexie** (kontrakt z UI mapy + `terrain-improvements` lub osobny picker hex).
2. Start tylko gdy: bramka tech/epoka/E/R (`wonder-availability`) **+** `wymagaTerenu` **+** koszt Praca/¤.
3. Zachować: `completedWorldWonders`, wyścig R, save/load.
4. Deprecate / ukryć toolbar-only flow (po migracji).

### Batch 2 — sync z EKONOMIA

- Po meldunku `EKONOMIA-DO-MASTERA` (utrzymanie + absolut) — wpinać upkeep w turę.

**Poza scope tego handoffu:** pełne bonusy yield ×3 (EKONOMIA G2 faza 2).

---

## DoD

- [ ] Gracz buduje cud z **hexu/map build menu** (nie kolejka miasta)
- [ ] Piramidy bez pustyni = **blokada** z komunikatem
- [ ] Wyścig R bez regresji
- [ ] Testy: wonder-availability + nowy test terenu (lane MAPA/EKONOMIA kontrakt)
- [ ] Build + bramka 17 suitów

**Flaga:** CZEKA batch MASTER
