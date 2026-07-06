# HANDOFF: EKONOMIA → MASTER — podziałHandlu / podziałPracy per City (1A, 3A)

**Data:** 2026-06-27. **Lane:** EKONOMIA. **Decyzje Macieja:** 1A, 3A (default Handlu 20/70/10, Praca 70% budynki). **Status:** GOTOWE w lane; UI suwak = osobny task.

---

## Co dostarczone (lane, bez main.ts)

| Plik | Zmiana |
|---|---|
| `gra/src/game/cities.ts` | `CityPodzialHandlu`, `CityPodzialPracy`, pola `podzialHandlu?`, `podzialPracy?`; init w `foundCity` / `foundCityAt` (default 20/70/10 + 70% praca) |
| `gra/src/game/turn-economy.ts` | `toEconomyCity()` czyta per-city podział; `splitPraca` używa `city.podzialPracy` gdy jest |
| `gra/tools/wire-ekonomia-test.cjs` | Scenariusz regresji: per-city luksus 30% → luksus=3 vs default 10% → luksus=1 |

**Backupy:** `*.bak-EKONOMIA-2026-06-27`

---

## Typy (City)

```typescript
export interface CityPodzialHandlu {
  procentNauka:    number;
  procentPieniadz: number;
  procentLuksus:   number;
}

export interface CityPodzialPracy {
  procentBudynki: number;
}

// Na City (opcjonalne — brak = fallback global w toEconomyCity):
podzialHandlu?: CityPodzialHandlu;
podzialPracy?:  CityPodzialPracy;
```

**Nowe miasto** (`foundCity` / `foundCityAt`): zawsze dostaje kopie `DEFAULT_PODZIAL_HANDLU` (20/70/10) i `DEFAULT_PODZIAL_PRACY` (70).

---

## Kontrakt runtime

```
toEconomyCity(city, params, ...):
  podziałHandlu = city.podzialHandlu ?? params (suwaakHandel*)
  podziałPracy  = city.podzialPracy  ?? params (suwaakPracaBudynki)

advanceCityEconomy:
  cityYieldPerTurn(econCity)  — używa podziału z miasta
  splitPraca(praca, city.podzialPracy?.procentBudynki ?? params.suwaakPracaBudynki)
```

**Save/load:** pola są na obiekcie `City` w `cities[]` — serializacja działa bez zmian w SILNIK (o ile save zapisuje cały City).

---

## Co MASTER / UI (później)

1. **Panel miasta (UI):** suwak Społeczeństwo / Handlu / Pracy — zapis na `city.podzialHandlu` / `city.podzialPracy` (decyzja 1A).
2. **main.ts:** brak wymaganego wpiecia — lane już czyta pola w `advanceCityEconomy` przez `toEconomyCity`. Opcjonalnie: migracja starych save (miasta bez pól → OK, fallback global).
3. **Playtest:** dwa miasta tego samego gracza, różny `procentLuksus` → różny strumień Wealth.

---

## Przykład merge (UI zapis suwaka)

```typescript
city.podzialHandlu = {
  procentNauka:    sliderNauka,
  procentPieniadz: sliderPieniadz,
  procentLuksus:   sliderLuksus,
};
// Suma powinna = 100 (walidacja w UI, nie w lane EKONOMIA v1.0)
```

---

## DoD (lane)

- [x] `toEconomyCity` używa per-city podziału.
- [x] Test regresji `wire-ekonomia-test.cjs` — per-city luksus 30%.
- [x] Backup plików przed edycją.
- [x] Meldunek w `EKONOMIA-DO-MASTERA.md`.

**Flaga:** GOTOWE / czeka UI suwak + opcjonalny playtest MASTER.
