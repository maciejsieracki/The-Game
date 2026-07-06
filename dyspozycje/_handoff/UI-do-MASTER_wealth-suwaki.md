# UI → MASTER: suwaki Handlu + Wealth panel + Kup jednostkę

**Data:** 2026-06-26. **Decyzje Macieja:** 1A, 4A. **Lane:** UI (`cityPanel.ts` ONLY). **Status:** GOTOWE do wpiecia.

---

## Co przesyłam

Moduł `gra/src/ui/cityPanel.ts` — żywe suwaki Podziału Handlu, blok Wealth, sekcja `purchasableUnits` z przyciskiem Kup. **Bez zmian w `main.ts`.**

Backup: `gra/src/ui/cityPanel.ts.bak-UI-2026-06-26`

---

## Nowe typy eksportowane

```typescript
export interface PodzialHandluSplit {
  procentPieniadz: number;  // Skarbiec (podatek)
  procentNauka: number;     // Nauka
  procentLuksus: number;    // Społeczeństwo → Wealth
}

export interface PodzialPracySplit {
  procentBudynki: number;   // reszta = teren (ulepszenia)
}
```

---

## Rozszerzony `CityPanelConfig` — haki do wpiecia

| Hak | Sygnatura | Wymagany | Opis |
|-----|-----------|----------|------|
| `getPodzialHandlu` | `(cityId) => PodzialHandluSplit \| null` | nie | Odczyt bieżącego podziału (alternatywa dla pola na `City`) |
| `getPodzialPracy` | `(cityId) => PodzialPracySplit \| null` | nie | Odczyt suwaka Pracy |
| `onPodzialHandluChange` | `(cityId, split) => void` | **tak** (dla suwaków) | Zapis na `City` + przeliczenie plonów następnej tury |
| `onPodzialPracyChange` | `(cityId, { procentBudynki }) => void` | nie | Sekcja Pracy widoczna tylko gdy ten hak jest podany |
| `onPurchaseUnit` | `(cityId, itemId, koszt) => void` | **tak** (dla Kup) | Odejmij `koszt` ze skarbca, dodaj jednostkę do miasta |
| `getTreasury` | już istnieje | zalecany | Wyszarza „Kup" gdy za mało złota |

---

## Pola `City` oczekiwane od EKONOMII

```typescript
// cities.ts (EKONOMIA lane — dyspozycja EKONOMIA.md 1A)
podzialHandlu?: {
  procentNauka: number;
  procentPieniadz: number;
  procentLuksus: number;
};
podzialPracy?: { procentBudynki: number };

// już istnieje:
wealthState?: { poziom: number; pula: number };
```

UI czyta podział w kolejności:
1. `getPodzialHandlu(cityId)` (hook)
2. `city.podzialHandlu` / `city.podziałHandlu`
3. default z `buildEconParams` lub **70/20/10** (decyzja Maciej 1A)

---

## Snippet wpiecia (MASTER → `configureCityPanel`)

```typescript
configureCityPanel({
  // ... istniejące haki ...
  getPodzialHandlu: (id) => {
    const c = cities.find(x => x.id === id);
    return c?.podzialHandlu ?? null;
  },
  onPodzialHandluChange: (cityId, split) => {
    const c = cities.find(x => x.id === cityId);
    if (c) c.podzialHandlu = { ...split };
    updateHud();
  },
  onPodzialPracyChange: (cityId, split) => {
    const c = cities.find(x => x.id === cityId);
    if (c) c.podzialPracy = { ...split };
  },
  onPurchaseUnit: (cityId, itemId, koszt) => {
    if (player.gold < koszt) return;
    player.gold -= koszt;
    spawnUnitInCity(cityId, itemId); // logika UNITS/SILNIK
    updateHud();
  },
  getTreasury: (ownerId) => ownerId === 0 ? player.gold : 0,
});
```

---

## UI — sekcje panelu miasta (środkowa kolumna)

| Sekcja | ID mount | Źródło danych |
|--------|----------|---------------|
| Podział Handlu | `#cs-handel` | suwaki 3× (Skarbiec/Nauka/Społeczeństwo), suma=100% |
| Wealth | `#cs-wealth` | `city.wealthState` + `loadWealthParams` (W, pula, próg, mnożnik, szczęście) |
| Podział Pracy | `#cs-praca` | opcjonalny suwak (tylko z `onPodzialPracyChange`) |
| Dostępne do budowy | `#cs-build` | `buildableProduction()` — **tylko budynki** |
| Kup jednostkę | `#cs-units` | `purchasableUnits()` + przycisk **Kup** |

Produkcja w kolejce (Praca) — bez zmian. Jednostki **nie** trafiają do listy „Buduj".

---

## DoD (MASTER weryfikuje po wpieciu)

- [ ] Suwaki Handlu edytowalne dla miasta gracza; zmiana → `onPodzialHandluChange` → zapis na `City`.
- [ ] Wealth panel pokazuje realne `wealthState` po ticku tury.
- [ ] „Kup" wywołuje `onPurchaseUnit`; bez haka przycisk disabled.
- [ ] `buildableProduction` / `purchasableUnits` — listy poprawne (gate Koszary itd.).
- [ ] Build + testy bez regresji.

**Flaga:** GOTOWE — czeka na wpiecie callbacków w `main.ts`.
