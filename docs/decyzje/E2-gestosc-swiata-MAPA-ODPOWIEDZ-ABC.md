# E2 — Gęstość świata (odpowiedź MAPA → Grupa E / Maciej)

| Pole | Wartość |
|------|---------|
| **Od** | Grupa A / MAPA (generator + klastry) |
| **Do** | Maciej (decydent) via Grupa E |
| **Data** | 2026-06-29 |
| **Status** | **PRZYJĘTE** (MASTER operacyjnie — Maciej delegacja pełna 29.06) |

---

## Q1 — Suwak na głównej siatce (zamiast „Jakość mapy”)

### Rekomendacja MAPA: **B** (+ utrzymać osobno `rival_count`)

| Opcja | Werdykt | Uzasadnienie (stan kodu) |
|-------|---------|---------------------------|
| **A** Rywale = duplikat | **ODRZUCAMY** | `rival_count` już jest w kroku 4 (`rywaleMenuForMapLabel` → `rywaleNaKlaster` w `computeClusters`). |
| **B** Liczba **typów cywilizacji** | **REKOMENDACJA** | Dziś `aktywneTypyFromMapLabel` = 3/5/7/9 **tylko z rozmiaru**, bez ±1 gracza. To liczba **regionów Voronoi** (= kultur na mapie), nie miast w jednym klastrze. |
| **C** Miasta w obcym klastrze | **Częściowo = A** | `rywaleNaKlaster+1` miast **na typ** już steruje `rival_count`. Obcy typ = pełny klaster tym samym parametrem. |
| **D** Inne | — | Gęstość **w klastrze** (`minDystans` 4–9) — za techniczne na główną siatkę; zostaje w zaawansowanych jeśli kiedyś. |

**Etykieta UI (MAPA):**
- Nowy suwak: **„Typy cywilizacji”** (alternatywa: **„Kultury na mapie”**).
- Opis: *„Ile różnych kultur (regionów) na mapie — każda ma własne miasta startowe.”*
- **Nie** „państwa”, **nie** „liczba miast” (myli z `rival_count`).
- Istniejący wiersz: **„Rywale w klastrze”** (obecne `rival_count`) — *„Ile miast AI w twojej i każdej kulturze (łącznie ze stolicą).”*

**Skala B:** default = `aktywneTypyFromMapLabel(map_size)`; gracz **±1** (clamp 2…9, max `ROSTER_KLUCZE.length`).

**Decyzja Macieja:** B / inna: ___

---

## Q2 — Surowce (Mało / Normalnie / Dużo)

| Pytanie | Odpowiedź MAPA |
|---------|----------------|
| Global vs per typ? | **Globalny mnożnik `rarity`** w `placeDeposits()` — jeden parametr, prosty balans. Per-typ dopiero gdy Maciej chce np. więcej koni a mniej miedzi (osobna decyzja). |
| Mnożniki 0.6 / 1.0 / 1.4? | **AKCEPT (propozycja)** — `effectiveRarity = min(1, rule.rarity * mult)`. |
| `allowedOn` bez zmian? | **TAK** — krowy nie na górach, brak złóż w morzu/wybrzeżu (`isDryLandTerrain`, predykaty w `DEPOSIT_RULES`). |
| Seed deterministyczny? | **TAK** — ten sam `seed` + ten sam przebieg terenu/rzek; zmiana gęstości surowców zmienia **tylko** pass `placeDeposits` (osobny strumień `mulberry32(seed ^ DEPOSIT_SALT)` już dziś). Inna gęstość = inna liczba złóż, **ten sam** relief i lasy logiczne. |

**Decyzja Macieja:** mnożniki OK / inne: ___

---

## Q3 — Rzeki (Mało / Normalnie / Dużo)

| Propozycja | Wartość |
|------------|---------|
| Mapowanie | **`maxRivers`** w `generateRivers()` (dziś `generator.ts` = **5**) |
| Mało | **2** |
| Normalnie | **5** (kanon) |
| Dużo | **8** |

Długość (`minLen`/`maxLen`) i margines **bez zmian** na v1.

**Decyzja Macieja:** 2 / 5 / 8 OK / inne: ___

---

## Q4 — Pustynie i las logiczny

| Warstwa | Mechanizm | Suwak dotyczy |
|---------|-----------|---------------|
| **Pustynia** | `terenBazowy = Pustynia` gdy `desNoise > próg` w `classifyTerrain` | **Próg `desNoise`** (np. Mało 0.68 / Normalnie 0.63 / Dużo 0.58) |
| **Las logiczny** | `nakladka = Las` gdy `forNoise > próg` (≠ dekoracja 3D) | **Próg `forNoise`** (np. Mało 0.65 / Normalnie 0.58 / Dużo 0.50) |

**E1-Q3:** suwaki **pustynia/las** wpływają **wyłącznie** na dane hex (`terenBazowy` / `nakladka`). **Zero** wpływu na `bundledMapQualityPreset` / meshe 3D.

**Decyzja Macieja:** progi OK / inne: ___

---

## Q5 — Kontrakt techniczny (propozycja MAPA)

```typescript
/** Mało / Normalnie / Dużo — wspólny trójstan dla generatora. */
export type DensityTier = 'low' | 'medium' | 'high';

/** Gęstość świata (gameplay) — osobno od E1 bundle (GPU). */
export interface WorldDensityPreset {
  resources: DensityTier;
  rivers: DensityTier;
  desert: DensityTier;
  forest: DensityTier;
}

/** Domyślne: wszystko medium. */
export const DEFAULT_WORLD_DENSITY: WorldDensityPreset = {
  resources: 'medium',
  rivers: 'medium',
  desert: 'medium',
  forest: 'medium',
};

/** UI krok 4 — typy cywilizacji ±1 (Q1-B). */
export interface ClusterDensityChoice {
  /** Etykieta: delta -1 | 0 | +1 względem default z rozmiaru mapy. */
  typyDelta: -1 | 0 | 1;
}

export function aktywneTypyFromMenu(
  mapSizeLabel: string,
  typyDelta: -1 | 0 | 1 = 0,
): number;

export function typyCywilizacjiMenuForMapLabel(
  mapSizeLabel: string,
): { opts: string[]; descs: string[]; domyslny: number };

/** Rozwiązanie liczbowe presetów → parametry generatora. */
export interface WorldGenParams {
  maxRivers: number;
  resourceRarityMult: number;
  desertNoiseThreshold: number;
  forestNoiseThreshold: number;
}

export function worldGenParamsFromDensity(
  preset: WorldDensityPreset,
): WorldGenParams;

/** Rozszerzone API — NIE zmienia seed terenu między presetami (ten sam relief). */
export function generateMap(
  width: number,
  height: number,
  seed: number,
  typ: TypSwiata,
  opts?: { worldDensity?: WorldDensityPreset },
): GameMapWithStarts;

export function generujSwiat(
  seed: number | undefined,
  rozmiar: RozmiarSwiata,
  typ?: TypSwiata,
  opts?: { worldDensity?: WorldDensityPreset },
): GameMapWithStarts;
```

**UI / SILNIK (Grupa E):**
- `NewGameParams`: dodać `worldDensity`, `typyCywilizacjiDelta` (lub gotowe `aktywneTypy`).
- `mapQuality` / `bundledMapQualityPreset` → **tylko zaawansowane** (bez zmian kontraktu E1).
- `main.ts`: `generujSwiat(seed, rozmiar, typ, { worldDensity })` + `buildClusterStartPlan({ aktywneTypy: aktywneTypyFromMenu(...) })`.

**Save:** opcjonalnie `worldDensity` + `aktywneTypy` w meta zapisu (regeneracja przy load = ten sam seed).

---

## Podział lane po decyzji Macieja

| Lane | Deliverable |
|------|-------------|
| **MAPA** | `worldGenParamsFromDensity`, rozszerzenie `generateMap`/`generujSwiat`, `typyCywilizacjiMenuForMapLabel`, testy regresji DEPOSIT_RULES |
| **Grupa E (UI)** | Layout krok 4 + zaawansowane; przeniesienie `map_quality` |
| **Integrator** | `NewGameParams` → `main.ts` / save |

**Warstwa:** 🟡 cross (generator + klastry + kreator + save).

---

*MAPA, 2026-06-29 — do akceptacji Macieja (ABC Q1–Q4)*
