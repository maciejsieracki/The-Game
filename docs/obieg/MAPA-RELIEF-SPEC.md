# MAPA — specyfikacja reliefu (góry / wzgórza) i fair play rud

**Hasło:** `reguły relief` · powiązane: [`MAPA-RZEKI-SPEC.md`](MAPA-RZEKI-SPEC.md) · [`MAPA-KANON-GENERATOR.md`](MAPA-KANON-GENERATOR.md)

**Decydent gameplay:** Maciej (ABC) · **Implementacja:** lane MAPA

**Status:** wdrożone 2026-07-04 · anty-klastry: ranking **per komórka**, rozstaw min. 4/3 hex, cap ~2.5%/4% lądu

**Nadrzędna zasada fair play:** [`MAPA-FAIR-PLAY-SIATKA.md`](MAPA-FAIR-PLAY-SIATKA.md)

---

## 1. Cel (fair play)

- **Żelazo** występuje tylko na **Górach** (`hex.zloze = 'zelazo'`).
- **Miedź** występuje tylko na **Wzgórzach** (nakładka / złoże miedzi).

Jeśli góry skupione są w jednym klastrze, część cywilizacji startuje **bez dostępu do rud** — to błąd generatora.

---

## 2. Pakiety reliefu — dwie siatki (Maciej 2026-07-04 ~20:34)

| Ruda | Siatka | Teren | Minimum / komórkę |
|------|--------|--------|-------------------|
| **Miedź / brąz** | **15×15** | Wzgórza | **2× Wzgórza** |
| **Żelazo** | **25×25** | Góry | **2× Góry** |

Złoże losuje `placeDeposits` — teren do wydobycia jest gwarantowany w zasięgu każdej strefy.

**Nadrzędna spec:** [`MAPA-FAIR-PLAY-SIATKA.md`](MAPA-FAIR-PLAY-SIATKA.md)

---

## 3. Relacja do siatki wody

| Zasób | Siatka | Minimum |
|--------|--------|---------|
| **Woda** (rzeki) | **15×15** | 1 źródło → morze |
| **Miedź** (wzgórza) | **15×15** | 2 wzgórza |
| **Żelazo** (góry) | **25×25** | 2 góry |

Woda i miedź dzielą siatkę **15×15**; żelazo ma większą **25×25**.

---

## 4. Algorytm (skrót)

1. **`applyReliefByNoiseRank`** — bazowy udział gór/wzgórz z szumu (`reliefLandFractions`, per kontynent/wyspa).
2. **`ensureReliefGridCoverage`** — domyka dziury siatki (po **finalnym** lądzie, przed złożami):
   - brak Gór → wybór heksa z wysokim `mtnNoise` w komórce → `Gory`;
   - brak Wzgórz → osobny heks → `Wzgorza`;
   - max 4 przebiegi per masa lądu.
3. **`placeDeposits`** (później w pipeline) — losuje rudę na gotowym terenie.

---

## 5. Implementacja

| Plik | Funkcje |
|------|---------|
| `gra/src/map/gen-helpers.ts` | `reliefCoverageCellSize`, `ensureReliefGridCoverage`, `cellHasReliefPackage`, `reliefGridCoverageRatio` |
| `gra/src/map/generator.ts` | wywołanie **po** `enforceEarthTemplate` / rebalance, **przed** `placeDeposits` |
| Złoża | `placeDeposits` — reguły `DEPOSIT_RULES` (miedź→Wzgórza, żelazo→Góry) |

---

## 6. Test

```powershell
cd gra
node tools/relief-grid-coverage-test.cjs
```

Cel: ≥85% komórek siatki na dużych masach lądu (≥150 hex).

---

## 7. Playtest (Maciej)

Ctrl+F5 → **nowa gra** → każdy kontynent ma rozsiane pasmo gór/wzgórz, nie tylko jeden kraniec mapy.

---

*Append-only po decyzjach ABC Macieja.*
