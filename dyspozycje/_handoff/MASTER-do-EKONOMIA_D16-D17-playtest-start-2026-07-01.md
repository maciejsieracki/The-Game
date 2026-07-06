# MASTER → EKONOMIA (Grupa B): D16 start balans + D17 woda/rzeka

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE** |
| **Batch** | `D16-D17-START` |
| **Decyzja Macieja** | **2026-07-01 · oba = A** (playtest: bunt na starcie + kara „Brak wody” nad rzeką) |
| **Warstwa** | 🟢 lane B — `turn-economy.ts`, `society-breakdown.ts`, `wealth.ts`, `culture-religion.ts`, `society-params.json`, `econ-params.json` · **bez `main.ts`** |

---

## D16-A — pakiet „łagodny start” (Porządek / Szczęście / Wealth)

**Problem:** pop=1, Prawo=0 → PorPct ~8% → „Bunt skrajny” od T1. Wealth spada W1→0 w pierwszej turze → kara −2.

### AC (wdrożyć wszystkie 4)

1. **Bonus osady (Prawo):** +3 pkt Prawa gdy `population ≤ 4` (linia UI: „Osada / małe miasto”). Parametr w `society-params.json` → `prawo_bonus_osada` (easy 4 / normal 3 / hard 2).
2. **Religia:** `religia_kara_brak_religii` **nie stosować**, dopóki w mieście **brak** budynku `swiatynia` (0 zamiast −1 na starcie).
3. **Wealth W=0:** `wealth_kara_zero` → **0** (normal; easy 0; hard −1 opcjonalnie) — bieda neutralna, nie kumuluje kar.
4. **Wealth immunitet:** pierwsze **5 tur** od założenia miasta (`city.foundedTurn` lub licznik na `City`) — **brak spadku poziomu W** z utrzymania (pula może rosnąć/spadać, poziom nie spada poniżej startowego W=1).

### DoD D16 (playtest scenariusz)

- Miasto startowe pop=1, bez garnizonu, bez świątyni, suwak luksus 10%:
  - **PorPct ≥ 20%** (brak „Bunt skrajny” w T1)
  - Brak linii „Wealth (pula luksusu): −2” w T1 po pierwszej turze ekonomii

---

## D17-A — wpięcie wody zgodne z opisem parametru

**Problem:** `computeCityHealth` skanuje tylko `cityWorkedTilesForEconomy` (centrum + N pól plonów). Parametr mówi: bonus gdy miasto **sąsiaduje** z rzeką. Miasto nad rzeką dostaje „Brak wody −2”.

### AC

1. Nowa funkcja **`cityHasWaterAccess(city, map): boolean`** w `turn-economy.ts` (eksport):
   - `true` gdy **centrum** ma `hex.rzeka.obecna`, **lub**
   - **którykolwiek z 6 sąsiadów** centrum ma `obecna`, **lub**
   - centrum lub sąsiad jest w `map.riverPaths` (jak `isRiverAdjacent` w `improvement-build.ts`).
2. **`computeCityHealth`** i **`computeCityHealthBreakdown`:** zamiast skanować `tiles[].maRzeke` → użyć `cityHasWaterAccess`.
3. UI: linia „Rzeka +2” gdy dostęp; **brak** „Brak wody” gdy dostęp.

### DoD D17

- Test: miasto na heksie **sąsiadującym** z `riverPaths`, bez studni/akweduktu → `total ≥ +1` (rzeka + małe miasto), **bez** linii „Brak wody”.
- Regresja: miasto w pustyni bez wody, bez budynków → nadal kara „Brak wody”.

---

## Testy

```
node gra/tools/society-breakdown-test.cjs   — rozszerzyć scenariusz start pop=1
node gra/tools/wire-ekonomia-test.cjs       — WIRE 1: rzeka sąsiad vs brak wody
node gra/tools/wealth-test.cjs              — immunitet 5 tur (nowy case)
```

---

## Meldunek

Append `EKONOMIA-DO-MASTERA.md`:

```
→ MASTER: GOTOWE · batch D16-D17-START · testy X/X
Handoff: (opcjonalnie) parametry w society-params.json — lista kluczy
```

**NIE** edytuj `main.ts` · **NIE** publikuj ROBOCZA (Integrator F po ACK Master).
