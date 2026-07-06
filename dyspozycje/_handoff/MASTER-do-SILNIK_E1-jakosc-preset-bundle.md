# MASTER → SILNIK: E1 — wpięcie bundled preset jakości mapy

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Zależności:** UI (buildParams bundle) · MAPA (las parity) — można zacząć po UI  
**Status:** GOTOWE (2026-06-29, Grupa F)  
**Flaga:** GOTOWE

---

## Co przesyłam

Jeden suwak kreatora → pełny pakiet GPU + dekoracje:

```typescript
import { bundledMapQualityFromLabel } from './map/newGameMapDefaults';

function mapRenderOptionsFromParams(params: NewGameParams): MapRenderOptions {
  const tier = params.mapQuality ?? qualityTierFromLabel(params.mapQualityLabel ?? 'Średnia');
  const bundle = bundledMapQualityPreset(tier);
  return {
    style: GAME_MAP_RENDER_STYLE, // zawsze 'roblox'
    renderQuality: bundle.renderQuality,
    mapDetailQuality: bundle.mapDetailQuality,
  };
}
```

Funkcja `bundledMapQualityPreset` / `bundledMapQualityFromLabel` — już w `newGameMapDefaults.ts`.

---

## Co SILNIK ma zrobić

| AC | Kryterium |
|----|-----------|
| AC-1 | `mapRenderOptionsFromParams()` używa **bundla** — ignoruje osobne `renderQualityLabel` / `mapDetailQualityLabel` jeśli rozjechane z `mapQuality` |
| AC-2 | `doStartGame` → `buildScene(map, canvas, _currentRenderOptions)` — bez regresji |
| AC-3 | Save/load: zapisuj `mapQuality` (tier) + opcjonalnie denormalizuj `renderQuality`/`mapDetailQuality` z bundla przy wczytaniu |
| AC-4 | Query string / playtest: jeden param `mapQuality=Wysoka` wystarczy |
| AC-5 | Log `[NewGame]` — jedna linia jakości z bundla |
| AC-6 | **Nie** dodawać parametru jakości do `generujSwiat()` |

---

## Pliki

- `gra/src/main.ts` (jedyny editor)
- `gra/src/game/save.ts` — opcjonalnie pole `mapQuality?: QualityTier`

**NIE ruszać:** `scene.ts`, `generator.ts`, `newGameFlow.ts` (UI lane)

---

## DoD

- [ ] AC-1–AC-6
- [ ] Build `/tmp/civ-dist` + smoke OK
- [ ] Meldunek w DZIENNIK / SILNIK-DO-MASTERA jeśli istnieje
- [ ] Czeka Opus przed kanonem

**Batch:** 1× main.ts po MAPA+UI GOTOWE.
