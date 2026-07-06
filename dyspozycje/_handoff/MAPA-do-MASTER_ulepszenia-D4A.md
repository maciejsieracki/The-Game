# MAPA → MASTER: Budowa ulepszeń z mapy (D4=A)

**Data:** 2026-06-26 · **Od:** Grupa A · **Status:** GOTOWE (API + kwalifikacja)  
**Decyzja Macieja:** D4=A · **A4-D4-Q1=A** (2026-06-27) — pełna lista + warunki placementu

---

## Aktualizacja 2026-06-27 (Grupa A implementacja)

- Kwalifikacja dopięta wg `A4-D4-przeglad-ulepszen-terenu.md`:
  - **pastwisko** → wymaga nakładki zwierzęcej (kon/owce/bydło/lama)
  - **plantacja** → `hex.zloze === 'luksus'` + teren Ł/R
  - **tarasy** → `playerCivArchetype === 'inkowie'` + Wz
  - **warzelnia** → wybrzeże LUB `zloze === 'sol'`
- `ImprovementBuildState.playerCivArchetype` — SILNIK podaje przy tworzeniu API
- Generator: `gen-helpers` — złoża owce/bydło/lama/luksus/sól
- Handoff zbiorczy: `_handoff/UI-MAPA-do-SILNIK_D1B-A4-batch.md`

---

## Co przesyłam

Moduł `gra/src/map/improvement-build.ts`:

- Kwalifikacja heksów (teren, terytorium, rzeka, drogi, nakładki) — ta sama logika co `placementpreview`
- Koszty z `gra/data/terrain-improvements.json` (`koszt_praca`)
- Callbacki do trybu Budowa (raycaster → `handleHexClick`)

Render 3D: istniejący `buildImprovement()` w `gra/src/render/improvements.ts` (bez zmian).

Prototyp UX: `gra/src/placementpreview/` (pełny panel 15 ulepszeń).

---

## API

```typescript
import {
  createImprovementBuildApi,
  collectRoadKeys,
  type ImprovementBuildState,
  type ImprovementBuildRequest,
  type ImprovementBuildCallbacks,
} from './map/improvement-build';

const state: ImprovementBuildState = {
  map: gameMap,
  cityNodes: playerState.cityNodes,  // CityNode[] z territory.ts
  placedKeys: new Set(/* q,r już zajęte */),
  roadKeys: collectRoadKeys(gameMap),
};

const buildApi = createImprovementBuildApi(state, {
  activeKey: selectedImprovement,  // ImprovementKey | null
  onSelect: (req) => queueBuildCommand(req),
});

// Raycaster mapy:
buildApi.handleHexClick?.(q, r);

// Podświetlenie:
buildApi.getQualifyingHexes('farma');

// Koszt:
buildApi.getWorkCost('farma');  // → 20 (z JSON)
```

### ImprovementBuildRequest (do kolejki tury)

```typescript
{
  type: 'buildImprovement';
  key: ImprovementKey;
  q: number; r: number;
  hexKey: string;       // "q,r"
  kosztPraca: number;   // z terrain-improvements.json
}
```

---

## Co MASTER ma wpinać

1. **Tryb Budowa** w main.ts — przycisk/toolbar (wzorzec jak `foundCityMode` w mainview)
2. **Raycaster** → `handleHexClick` gdy `activeKey` ustawiony
3. **Podświetlenie** — `getQualifyingHexes(key)` → zielone nakładki (scene.ts / overlay)
4. **Kolejka tury** — `onSelect(req)` → EKONOMIA: odejmij `kosztPraca` z puli Pracy, postęp 0→100% na heksie
5. **Render** — po ukończeniu: `buildImprovement(key, ownerColor)` na heksie + `hex.ulepszenie`

Zależności: `isInTerritory(q,r,cityNodes)` z `map/territory.ts` (już eksportowane).

---

## DoD

- [x] Kwalifikacja 15 typów + droga segment + posterunek na krawędzi
- [x] Koszt Pracy z JSON
- [x] Kontrakt `ImprovementBuildRequest` dla silnika
- [ ] MASTER: tryb UI + petla tury + render po ukończeniu
- [ ] EKONOMIA: walidacja salda Pracy przed `onSelect`

---

## Kiedy handoff gotowy

**GOTOWE** — czeka na batch integracji MASTER.
