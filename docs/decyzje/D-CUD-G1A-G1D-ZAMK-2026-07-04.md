# D-CUD-G1A…G1D + G1-ZAMK — paczka blokująca cuda v1.0

> **Status:** ✅ **ZAMKNIĘTE** — Maciej **2026-07-04**  
> **Handoff:** `dyspozycje/_handoff/MASTER-do-EKONOMIA_CUDA-G2-2026-07-04.md` · `MASTER-do-SILNIK_cuda-zamkniecie-2026-07-04.md`

---

## G1A — Model budowy (wariant własny Macieja)

**Decyzja:** Cuda budujemy **z flow ulepszeń terenu** (jak Farma/Tartak), **nie** z kolejki produkcji miasta ani osobnego pickera toolbar-only.

| Element | Kanon |
|---------|--------|
| **Wejście UI** | Menu ulepszeń terenu / budowa na hexie w zasięgu terytorium |
| **Warunek startu** | Wystarczająca **Praca** i/lub **pieniądze** (koszt z `wonders.json`) |
| **Miejsce** | **Dowolny hex w zasięgu** gracza (terytorium), spełniający **G1B** |
| **Docelowo** | Spójne z `wonders.json`: „budowa = hex w terytorium” |

**Implikacja:** obecny CUDA-G1 (toolbar „Cuda” + kolejka miasta + auto-hex) wymaga **refaktoru** SILNIK/UI/MAPA — nie tylko rozszerzenia.

---

## G1B — `wymagaTerenu`

**Decyzja:** **B** — **twarda bramka**. Start budowy tylko na hexie spełniającym `wymagaTerenu` (pustynia, trudny teren, skała…). Bez hexu = cud zablokowany + powód w UI.

---

## G1C — Bonus cudu wyścigowego (R)

**Decyzja:** **A** — zwycięzca wyścigu dostaje **100%** bonusów z `wonders.json` (bez mnożnika 0,85).

---

## G1D — Mnożnik `bonusy.miasto`

**Decyzja:** **A** — **`bonus_miasto_mnoznik: 3`** dla **wszystkich** pól sekcji `bonusy.miasto`, potem reguła × każde miasto (CUDA-G2).

---

## G1-ZAMK — Zakres wdrożenia na zamknięcie paczki

**Decyzja Macieja (potwierdzenie warstwy post-absolut + utrzymanie):**

| Element | Kanon |
|---------|--------|
| **Utrzymanie aktywne** | Pełna stawka z JSON (`utrzymanie` ¤/turę) — **D-CUD2 wdrożenie** |
| **Po absolut (ep. 7+)** | Utrzymanie = **50%** (`floor/2`, min 0) — **D-CUD2=C** |
| **Po absolut — jedyny yield** | **+10 handlu** dla **najbliższego miasta** (turystyka) — **D-CUD1** |
| **Bonusy z JSON** | Wygasają po `absolut`; implementacja yieldów miasto ×3 — **CUDA-G2 faza 2** (po batchu utrzymania) |

**Paczka cuda v1.0 uznana za domkniętą decyzyjnie** — lista ABC nr 5–30 → backlog, nie blokuje handoffu.

---

## Powiązane (już zamknięte — nie pytamy ponownie)

- **D-CUD1** — ruina na mapie, bonusy wygasają, +10 handlu turystycznego  
- **D-CUD2** — utrzymanie wygasłego 50%  
- **D-CUD4** — start = wszystkie tech z `techUnlock` odkryte  
- **D-CYW-EPOKA-WEJSCIA** · **D-CUD-TECH-WEJSCIA**
