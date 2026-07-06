# D-CUD-TECH-WEJSCIA — tech cudu E vs epokaWejscia państwa

> **Status:** ✅ **ZAMKNIĘTE** — Maciej **2026-07-03**  
> **Lane:** CYWILIZACJE (`wonders.json`, `civs.json`) · `wonder-civ-tech.ts`

---

## Decyzja Macieja

Cuda **wyłączne (E)** danego państwa: **żaden** wynalazek w `techUnlock` nie może pochodzić z epoki **wcześniejszej** niż `epokaWejscia` tego typu.

| epokaWejscia państwa | Dozwolone tech w cudzie E |
|----------------------|---------------------------|
| **Kamień** | Kamień, Brąz, Żelazo |
| **Brąz** | Brąz, Żelazo |
| **Żelazo** | tylko Żelazo |

**Późniejsze epoki są OK** — cud może wymagać tech z Brązu lub Żelaza, jeśli państwo weszło wcześniej.  
**Zakaz:** tylko tech **sprzed** debiutu (np. Fenicjanie/Żelazo + Murarstwo/Kamień).

---

## Kod / dane

| Plik | Rola |
|------|------|
| `gra/src/game/wonder-civ-tech.ts` | walidacja reguły |
| `gra/tools/wonder-civ-tech-test.cjs` | bramka CI |
| `gra/data/wonders.json` | `_meta.kanon_tech_wejscie` + poprawione `techUnlock` |

Powiązane: **D-CYW-EPOKA-WEJSCIA-KASKADA.md**

---

## Przykłady (Antyk, cuda E aktywne)

| Państwo | wejście | Cud | techUnlock |
|---------|---------|-----|------------|
| Grecy | Kamień | Kolos | Żegluga (Brąz) ✓ |
| Rzym | Kamień | Koloseum | Inżynieria (Żelazo) ✓ |
| Babilonia | Brąz | Wiszące ogrody | Pismo (Brąz) ✓ |
| Celtowie | Brąz | Roquepertuse | Inżynieria (Żelazo) ✓ |
| Fenicjanie | Żelazo | Petra | Inżynieria ✓ |
| Słowianie | Żelazo | Posąg Peruna | Obróbka żelaza ✓ |

Cuda wyścigowe **R** — reguła dotyczy wszystkich uczestników przy starcie w danej epoce (osobny temat).
