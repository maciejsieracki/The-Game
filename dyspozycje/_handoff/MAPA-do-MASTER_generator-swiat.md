# HANDOFF: Generator Swiata — TYP + API (Civ-MAPA → MASTER)

Data: 2026-06-26

## Sygnatury publicznych funkcji

### `generateMap` (rozszerzona, wstecznie zgodna)
```typescript
// src/map/generator.ts
export function generateMap(
  width  = DEFAULT_WIDTH,   // 36
  height = DEFAULT_HEIGHT,  // 28
  seed   = 42,
  typ: TypSwiata = 'kontynenty',  // NOWY, opcjonalny 4. parametr
): GameMapWithStarts
```
Istniejące wywołania `generateMap(w, h, seed)` działają bez zmian.  
Seed=0 jest konwertowany do 42 wewnętrznie.

### `generujSwiat` (nowe API rozmiarowe)
```typescript
// src/map/generator.ts
export function generujSwiat(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ: TypSwiata = 'kontynenty',
): GameMapWithStarts
```
Gdy `seed=0` lub `undefined` — losuje `(Date.now() ^ 0xdeadbeef) >>> 0` i zapisuje w `map.seed`.

### `TypSwiata`
```typescript
// src/map/gen-helpers.ts
export type TypSwiata = 'kontynenty' | 'pangea' | 'wyspy';
```

---

## Tabela rozmiar → heksy

| Rozmiar       | width × height | Heksów (~) | Cel      |
|---------------|----------------|------------|----------|
| `malenki`     | 38 × 26        | ~988       | ~1000    |
| `maly`        | 54 × 37        | ~1998      | ~2000    |
| `standardowy` | 84 × 60        | ~5040      | ~5000    |
| `duzy`        | 120 × 84       | ~10080     | ~10000   |
| `ogromny`     | 168 × 119      | ~19992     | ~20000   |

Proporcja width:height ≈ 1.4:1.

---

## Opis 3 typów świata

### `kontynenty` (domyślny)
- Generuje 2–4 oddzielnych centrów kontynentalnych (liczba zależy od rozmiaru mapy).
- Każde centrum: radialny spadek Gaussowski + bias noise.
- Maska końcowa = max(wszystkich centrów) × maska krawędziowa × lekki noise deformujący.
- Efekt: kilka wyraźnie oddzielonych mas lądowych z morzem pomiędzy.

### `pangea`
- Jeden silny centralny bias (radialny spadek z centrum mapy, szeroki promień 105%).
- Noise deformuje brzegi Pangei.
- Ląd zajmuje ~60–70% powierzchni. Morze tylko przy krawędziach.

### `wyspy`
- Brak centralnego biasu — noise jest jedynym generatorem lądu.
- Dwa poziomy noise (coarse + fine) z wyższą skalą = drobniejsze wyspy.
- Wysoki próg odcięcia (0.50) → wiele izolowanych małych wysp.
- Maska krawędziowa zapewnia morze przy brzegach mapy.

Implementacja: `src/map/gen-helpers.ts` — funkcje `landMaskKontynenty`, `landMaskPangea`, `landMaskWyspy`.  
Wybór w: `src/map/generator.ts`, linia ~74 (w przebiegu 1, dla każdego heksa).

---

## Losowy seed

`generateMap(w, h, 0, typ)` → seed=42 (bezpieczne minimum).  
`generujSwiat(0, rozmiar, typ)` → seed z `Date.now()`, zapisany w `map.seed`.  
Podgląd: `?seed=0` w URL → losowy seed generowany przy bootowaniu.

---

## Podgląd (`?typ=`)

`Gra-podglad-MAPA.html` — URL parametry:
- `?typ=kontynenty|pangea|wyspy` — przełącza typ (przyciski w HUD)
- `?rozmiar=malenki|maly|standardowy|duzy|ogromny` — nadpisuje ?w=/?h=
- `?seed=N` — ziarno (0 = losowy)
- `?w=N&h=N` — ręczny rozmiar (działa jak wcześniej)

HUD pokazuje: `WxH hex (total razem) · typ: Kontynenty/Pangea/Wyspy · seed N · rzek: N · miast: N · surowce: N`

---

## Test skali

| Rozmiar        | Heksów  | Build | Status                         |
|----------------|---------|-------|--------------------------------|
| Standardowy    | ~5040   | ✓     | OK                             |
| Duzy           | ~10080  | ✓     | OK (InstancedMesh terenu — OK) |
| Ogromny        | ~19992  | ✓     | OK (build; render niesprawdzony wizualnie) |

Build: 516 kB (Three.js bundled), gzip: 135 kB.

---

## Follow-upy

### [WYSOKI] Render dekoracji (lasy/góry) przy 10k–20k heksów

Terrain (heksy bazowe) używa `InstancedMesh` → skaluje się dobrze.  
Dekoracje (`improvements.ts`, `resources.ts`) tworzą **osobny `Object3D` per heks** — przy 20k heksach z lasami (~30% = ~6000 obiektów) może wystąpić dławienie framerate.

Rekomendacja na follow-up: przerobić `buildForestDecoration`, `buildMountainDecoration` i `buildResourceOverlay` na InstancedMesh (grupowanie po typie nakładki), analogicznie jak terrain tiles w `scene.ts`.

### [NISKI] Optymalizacja `computeStartPositions` przy 20k

Algorytm O(n²) — przy ~6000 heksów lądowych i 20k mapie może być powolny przy niskim `absMinDist`. Można zastąpić spatial grid.
