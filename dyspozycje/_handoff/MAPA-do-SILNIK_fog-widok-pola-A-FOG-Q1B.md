# MAPA → SILNIK: mgła wojny per jednostka (A-FOG-Q1=B)

**Status:** **WPIĘTE** (2026-06-27 ~21:10) · ROBOCZA md5 `eada39d752b561d7779ae8813b03e85d`  
**Flaga:** WPIĘTE  
**Decyzja Macieja:** `A-FOG-Q1=B` (2026-06-27)  
**Dokumentacja:** `docs/grupa-a/A-FOG-Q1-widok-jednostki.md`

---

## Kontekst

Maciej: jednostka **likwiduje mgłę** na odległość równą **potencjalnemu ruchowi** w następnej turze (kolumna **Ruch** na mapie strategicznej).

**Wyjątek B:** **Zwiadowca** — min. **5 heksów** (`max(Ruch, 5)`).

**Miasto:** widoczność mgły = **Grupa B** — nie blokować tego batchu; tymczasowo `DEFAULT_SIGHT = 3` dla `typeId === 'city'`.

**Supersedes (jednostki):** stałe `DEFAULT_SIGHT=3` w `currentVisible()` — zastąpić resolverem per typ.

---

## Co przesyłam (GOTOWE w repo)

| Plik | Zmiana |
|------|--------|
| `gra/data/units.json` | **„Widok pola"** = Ruch (39 wierszy); Zwiadowca = 5 |
| `gra/src/game/visibility.ts` | `buildUnitSightResolver()`, `computeVisible(..., number \| UnitSightResolver)` |
| `Civ-UNITS/widok-pola-A-FOG-Q1B.csv` | Tabela 50 jednostek → Excel `Jednostki.xlsx` (Maciej) |

---

## Co ma zrobić SILNIK

### 1. Backup

```powershell
Copy-Item gra/src/main.ts gra/src/main.ts.bak-SILNIK-20260627-A-FOG-Q1B
```

### 2. Wpięcie w `main.ts`

**Import** (dopisać do istniejącego z `./game/visibility`):

```typescript
import {
  computeVisible,
  addExplored,
  allHexKeys,
  DEFAULT_SIGHT,
  computeVisibleAt,
  buildUnitSightResolver,
} from './game/visibility';
```

**Resolver** — raz w scope gry (tam gdzie `data` / `loadGameData` jest dostępne, np. przy `doStartGame` lub tuż po `const data = ...`):

```typescript
const unitSight = buildUnitSightResolver(data.units, DEFAULT_SIGHT);
```

**`currentVisible()`** — zamienić:

```typescript
return computeVisible(sources, map, DEFAULT_SIGHT);
```

na:

```typescript
return computeVisible(sources, map, unitSight);
```

### 3. Bramka

```powershell
cd gra
npx vite build --outDir $env:TEMP\civ-dist
node tools/logic-test.cjs
node tools/smoke.cjs
node tools/battle-smoke.cjs
```

### 4. Playtest (ROBOCZA / kanon)

- **F** = mgła ON
- Wojownik / Hastati (Ruch 2) → widoczny krąg **2** hexy od jednostki
- Zwiadowca → **5** heksów
- Konnica (Ruch 4) → **4** hexy
- Katapulta (Ruch 1) → **1** hex
- Miasto gracza → nadal **3** hexy (do czasu decyzji Grupy B)

### 5. Opus → kanon (standardowy gate)

---

## DoD

- [ ] `currentVisible()` używa `buildUnitSightResolver(data.units, DEFAULT_SIGHT)`
- [ ] Zwiadowca 5 · piechota 2 · konnica 4 · katapulta 1 (wizualnie + logic)
- [ ] Miasta: `DEFAULT_SIGHT=3` (bez regresji)
- [ ] `logic-test.cjs` — bez regresji (test 5 nadal może używać stałego `DEFAULT_SIGHT`)
- [ ] Start gry: `START_REVEAL_RADIUS=5` bez zmian
- [ ] Opus APPROVE → `Gra-podglad.html` + md5 w `SILNIK-DO-MASTERA.md`

---

## Nie w scope tego batchu

| Temat | Owner |
|-------|--------|
| Widoczność **miasta** | **Grupa B** |
| Rzeki przez mgłę | MAPA `F-do-MAPA_fog-rzeki.md` |
| Excel `Jednostki.xlsx` | Maciej (CSV gotowy) |

---

**→ SILNIK: GOTOWE** — proszę wpiąć resolver w `main.ts` po bramce + Opus.
