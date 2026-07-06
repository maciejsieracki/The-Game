# MAPA → SILNIK: miasta Roblox — ghost założenia w main.ts

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **→ SILNIK: GOTOWE** (lane render) |
| **Data** | 2026-07-02 |
| **Warstwa** | 🟡 cross — `main.ts` ghost miasta |
| **CityRenderer** | ✅ już wpięte w `cities.ts` |

---

## Co przesyłam

Fabryka: `gra/src/render/settlementModel.ts`

```ts
buildSettlementModel(era, civ, level, ownerCol, withWalls, style?)
// style domyślnie GAME_MAP_RENDER_STYLE ('roblox')
// era 1 → stoneCityRoblox (wspólny A5-S2)
// era 2+ → bronzeCityRoblox (per cyw)
```

**Lane MAPA zrobił:**
- `cities.ts` → `CityRenderer.sync()` używa `buildSettlementModel`
- `visualKey` zawiera `GAME_MAP_RENDER_STYLE` (rebuild przy zmianie stylu)

---

## Co SILNIK ma wpiąć w `main.ts`

**1. Import** (zamiast osobno bronze/stone):

```ts
import { buildSettlementModel } from './render/settlementModel';
```

**2. `showGhostCity`** (~L2314–2316) — zamienić:

```ts
const g = player.era >= 2
  ? buildBronzeCity(civ, 1, 0xffd54a, false)
  : buildStoneAgeCity(civ, 1, 0xffd54a, false);
```

na:

```ts
const g = buildSettlementModel(player.era, civ, 1, 0xffd54a, false);
```

**3. Usunąć** nieużywane importy `buildBronzeCity` / `buildStoneAgeCity` jeśli tylko ghost.

**4. Batch:** rebuild kanon po wpięciu.

---

## DoD

- [ ] Ghost założenia miasta = ten sam styl co miasta na mapie (Roblox)
- [ ] `npx tsc --noEmit` OK
- [ ] Playtest: epoka kamienia + brąz, z/bez murów

**Nie dotyka:** logiki gry, ekonomii, `buildBronzeCity` w innych kontekstach poza ghost.
