# MASTER → EKONOMIA: CUDA-G2 — utrzymanie + absolut (faza 1)

> **Status:** **GOTOWE do dyspozycji** · Maciej 2026-07-04  
> **Decyzje:** `D-CUD-G1A-G1D-ZAMK-2026-07-04.md` · `D-CUD2-utrzymanie-wygasly.md` · `_meta` w `wonders.json`

---

## Faza 1 (P0 — zamknięcie paczki cuda)

| Element | Reguła | Źródło |
|---------|--------|--------|
| **Utrzymanie aktywne** | `utrzymanie` ¤/turę z JSON, póki cud w absolut | `wonders.json` |
| **Po absolut** | Bonusy z JSON **off**; utrzymanie = **`floor(utrzymanie/2)`** min 0 | **D-CUD2=C** |
| **Turystyka po absolut** | **+10 handlu** dla **najbliższego miasta** do hexu cudu | **D-CUD1** |
| **Ruina** | Model zostaje; `wonderIsRuin` już w `main.ts` — spiąć z ekonomią | D-CUD1 |

**Pliki lane:** `turn-economy.ts`, `upkeep.ts`, `wealth.ts` (wg własności), kontrakt do `wonders-data.ts` / `getWonderAbsolutEpoka`.

---

## Faza 2 (po faza 1 + playtest — osobna dyspozycja)

| Element | Reguła |
|---------|--------|
| **Bonusy miasto** | Wartości JSON × **3** × każde miasto | **G1D=A** |
| **Cud R** | **100%** bonusów dla zwycięzcy | **G1C=A** |
| **Bonusy imperium** (% wpływ, wojna…) | **BACKLOG** — lista ABC nr 17–21 |

---

## Testy (DoD faza 1)

- [ ] Piramidy utrzymanie 2 → po absolut 1 ¤/turę
- [ ] Po absolut: brak +kultura z JSON; +10 handlu najbliższe miasto
- [ ] Regresja wire/upkeep/currency
- [ ] Meldunek `EKONOMIA-DO-MASTERA.md`

**NIE ruszać:** `main.ts` — handoff do MASTER po module.

**Flaga:** CZEKA `START lane EKONOMIA`
