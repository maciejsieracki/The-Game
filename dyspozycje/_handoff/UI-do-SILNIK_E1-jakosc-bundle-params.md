# UI → SILNIK: E1 — parametry bundla jakości mapy

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Status:** **→ SILNIK: GOTOWE** (UI lane)  
**Flaga:** UI dostarczyło `NewGameParams` z bundlem 1:1

---

## Co UI wysyła w `NewGameParams` (krok 5 / `onStart`)

Gracz wybiera **tylko** `mapQualityLabel` (Niska / Średnia / Wysoka).

UI woła:

```typescript
import { bundledMapQualityFromLabel } from '../map/newGameMapDefaults';
const bundle = bundledMapQualityFromLabel(mapQualityLabel);
```

| Pole | Wartość |
|------|---------|
| `mapQualityLabel` | etykieta z kreatora |
| `mapQuality` | tier z etykiety |
| `renderQualityLabel` | **=** `qualityTierToLabel(bundle.renderQuality)` |
| `mapDetailQualityLabel` | **=** ten sam co render |
| `renderQuality` | `bundle.renderQuality` |
| `mapDetailQuality` | `bundle.mapDetailQuality` |

**Reguła:** `renderQuality === mapDetailQuality === mapQuality` (ten sam tier).

---

## SILNIK — oczekiwane wpięcie

1. `mapRenderOptionsFromParams(params)` — preferuj bundle z `mapQualityLabel` przez `bundledMapQualityFromLabel()`; **ignoruj** osobne ścieżki dual-track.
2. Zapis gry — oba pola tier nadal OK (identyczne).
3. **NIE** czytać `render_quality` z UI (usunięte z kreatora i modala).

---

## DoD SILNIK

- [ ] Start gry: Niska → `low/low`, Wysoka → `high/high`
- [ ] Brak regresji save/load
- [ ] Build + bramka testów przed kanonem

**UI nie ruszało:** `main.ts`, `scene.ts`, `generator.ts`.
