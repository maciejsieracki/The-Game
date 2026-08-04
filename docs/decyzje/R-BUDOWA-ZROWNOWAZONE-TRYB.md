# R-BUDOWA-ZROWNOWAZONE-TRYB — zrównoważony ≠ priorytet typów

**Status:** ZDEPLOYOWANE FALA 222/`132401ef` → FALA 223/`ee0e7e04` · playtest Maciej **OK** 2026-08-04  
**Data:** 2026-08-04  
**ID:** `R-BUDOWA-ZROWNOWAZONE-TRYB-Q1` = **A**

## Decyzja Macieja

> `R-BUDOWA-ZROWNOWAZONE-TRYB-Q1 A`

**A — osobny tryb auto „Zrównoważony”** (rekomendacja):
- 5 chipów typów z numerami: wzrost / wojsko / kultura / prawo / produkcja
- osobny przełącznik **Zrównoważony** (nie w kolejce numerów)
- włączenie zrównoważonego → typy wizualnie WYŁ (nieaktywne w priorytecie)
- klik typu → wyłącza zrównoważony, tryb Priorytet typów

## Opcje (archiwum ABC)

| | Opis |
|---|------|
| **A** | Osobny tryb + 5 typów (powyżej) |
| **B** | Zostawić zrównoważony jako 6. chip w tym samym rzędzie (status quo) |
| **C** | Usunąć zrównoważony z UI — tylko 5 typów + Lista + Ręczny |

## Implementacja

- `BudowaTryb` += `'zrownowazone'` · `isAutoBudowaTryb` obejmuje ten tryb
- `pickAutoBuildItem`: przy `tryb === 'zrownowazone'` heurystyka zrównoważona (jak focus `zrownowazone`)
- Migracja save: `priorytet` + tylko `['zrownowazone']` → `tryb: 'zrownowazone'`
- UI: `appendBudowaToolbarProfiles` — 5 typów + osobny chip Zrównoważony

## Pliki

`gra/src/game/cities.ts` · `auto-manage.ts` · `ui/cityPanel.ts` · `main.ts` · testy auto-manage
