# B-ODLEWNIA-KUZNIA-LANCUCH — decyzja Macieja (2026-07-27)

**Status:** ZAMKNIĘTE · wdrożenie w `gra/` (lane B / ekonomia)

## Kontekst

Dwa niezależne łańcuchy budynków w jednym slocie produkcyjnym miasta (upgrade zastępuje poprzednik):

1. **Łańcuch odlewni** — produkcja metali (brąz, żelazo, stal)
2. **Łańcuch kuźni** — tylko bonus Pancerza (+15% per tier, max +45%)

## Łańcuch odlewni (jeden slot, upgrade zastępuje)

| Tier | Id budynku | Nazwa wyświetlana | Produkcja konwertera |
|------|------------|-------------------|----------------------|
| 1 | `odlewnia_brazu` | **Odlewnia brązu** | BRĄZ (ruda + drewno) |
| 2 | `odlewnia_zelaza` | Odlewnia żelaza | BRĄZ + ŻELAZO (równolegle, jak tier1 brąz + tier2 żelazo) |
| 3 | `wielka_odlewnia` | Wielka odlewnia | BRĄZ + ŻELAZO + STAL |

- **„Piec hutniczy"** — rezerwowana nazwa na **przyszłe epoki**. **NIE** tworzymy id `piec_hutniczy` w grze dzisiaj.
- Stal przeniesiona z `wielka_kuznia` do `wielka_odlewnia`.

## Łańcuch kuźni (mechanika bez zmian, 15+15+15=45% Pancerz)

| Tier | Id | Produkcja |
|------|-----|-----------|
| 1 | `kuznia` | tylko Pancerz +15% |
| 2 | `kuznia_zelaza` | tylko Pancerz (łańcuch) |
| 3 | `wielka_kuznia` | tylko Pancerz — **bez** produkcji stali |

## Technologie (tech.json)

- **Hutnictwo żelaza:** wymagany budynek → Odlewnia brązu; odblokowuje Odlewnia żelaza + Kuźnia żelaza
- **Obróbka żelaza:** odblokowuje Wielka odlewnia + Wielka Kuźnia

## Implementacja

- `converters.ts`: pole opcjonalne `buildingId` na `ConverterRecipe`; multi-receptura per budynek
- `turn-economy.ts`: filtr `runtimeBuiltIds.includes(r.buildingId ?? r.id)`
- `braz-access.ts` / `zelazo-access.ts`: upgrade łańcucha odlewni liczy się do bramek dostępu
- `wielka_kuznia` usunięta z `DEFAULT_CONVERTER_RECIPES`

## Cytat decyzji

Maciej (2026-07-27): Odlewnia brązu (nie Piec hutniczy); odlewnia żelaza produkuje brąz+żelazo; wielka odlewnia dodaje stal; kuźnia→wielka kuźnia = tylko pancerz.
