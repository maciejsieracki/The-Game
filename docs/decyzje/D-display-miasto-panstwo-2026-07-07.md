# D-DISPLAY-MIASTO-PANSTWO — dopisek w nazwach UI

**Status:** ZAMKNIĘTE  
**Data:** 2026-07-07  
**Grupa:** D (Cywilizacje / dyplomacja)

## Cytat Macieja

> Przy nazwach w dyplomacji, na mapie i innych miejscach — **dopisek „miasto-państwo”** gdy rozmawia/widzi **państwo-miasto** z klastra, żeby odróżnić od **cywilizacji** (imperium gracza / pełna nacja).

## Decyzja

| Typ | Przykład | Format |
|-----|----------|--------|
| Miasto-państwo klastra | Sparta, Teby, kopie obcego typu | `Sparta · miasto-państwo` |
| Imperium / pełna cywilizacja | Ateny gracza, stolica obcego typu | sama nazwa, bez dopisku |

## Reguła techniczna

- **`City.startCityState`** — ustawiane przy spawnie klastra (`simplifiedDiplomacyOwners` + `typCityCopyOwners` w `main.ts`).
- **`isOwnerClusterCityState(ownerId)`** — zestawy ownerów + flaga na mieście; owner `0` = gracz → zawsze imperium.
- Helper: `gra/src/game/display-names.ts` → `formatEntityDisplayName({ baseName, isCityState })`.

## Dowód

- `gra/src/game/display-names.ts`
- `gra/tools/display-names-test.cjs` (3 scenariusze + slot/owner)
- UI: dyplomacja (`ownerDiploLabel`), mapa (`cities.ts`), tooltip heksu, panel miasta
