# Handoff EKONOMIA → UI + SILNIK — Okolica pól (4C)

| Pole | Wartość |
|------|---------|
| **Status** | **GOTOWE** spec · **CZEKA** implementacja |
| **Decyzja** | **4C** — auto + profile skupienia + ręczna korekta 👤 · **v1.0 pełne** |
| **Spec** | `docs/decyzje/B1-okolica-pola.md` |

## Co przesyłam

### Typy (propozycja)

```typescript
type OkolicaFocus = 'zrownowazone' | 'zywnosc' | 'produkcja' | 'podatki';
type OkolicaTryb = 'auto' | 'reczny';

// City — nowe pola opcjonalne
okolicaFocus?: OkolicaFocus;
okolicaTryb?: OkolicaTryb;
okolicaReczne?: Record<string, number>; // "q,r" -> 0|1
```

### API

```typescript
wagiForFocus(focus: OkolicaFocus): { zywnosc; praca; handel }

resolveWorkedTiles(
  city: City,
  map: GameMap,
  yieldOf: (q,r) => TileYield,
): OkolicaTile[]  // auto OR reczny

setTileWorker(city, q, r, delta: +1|-1): City  // walidacja pop/zasięg
resetOkolicaAuto(city): City  // tryb auto + assignWorkedTiles
```

### Profile wagi (start)

| focus | z | p | h |
|-------|---|---|---|
| zrownowazone | 1 | 1 | 1 |
| zywnosc | 3 | 0.5 | 0.5 |
| produkcja | 0.5 | 3 | 0.5 |
| podatki | 0.5 | 0.5 | 3 |

## Co odbiorca robi

| Odbiorca | Akcja |
|----------|--------|
| **UI** | Radio profile, mini-mapa +/- 👤, plony/heks, Przywróć auto |
| **SILNIK** | Persist City, `getWorkedTiles` z `resolveWorkedTiles`, auto-manage ⚙ |
| **EKONOMIA** | `cityWorkedTilesForEconomy` → `resolveWorkedTiles` (jedno źródło) |

## DoD

- Panel okolica = ekonomia tury (koniec rozjazdu bilans vs silnik)
- 4 profile + ręczna korekta + save/load
- `okolica-test.cjs` rozszerzone

## Flaga

**GOTOWE** (spec) / **CZEKA** (kod)
