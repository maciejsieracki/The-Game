# EKONOMIA → SILNIK: kanon żywność + hodowla (API)

**Data:** 2026-06-26  
**Batch:** FOOD-HODOWLA P2 (EKONOMIA lane)  
**Status:** **GOTOWE** — `→ SILNIK: GOTOWE`  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

---

## Co przesyłam

### 1. Dane (`terrain-improvements.json`)

- Usunięto `pastwisko`; dodano `bydlo`, `owce`, `lama` z bonusami kanonu.
- Farma +3, irygacja +5, tarasy +3, łodzie +3 praca (już w JSON).
- Legacy alias: `pastwisko` → `bydlo` w `normalizeImprovementKey` (save/stary enum).

### 2. Plony — suma warstw

| API | Plik |
|-----|------|
| `WorkedTile.ulepszeniaKeys?: string[]` | `economy.ts` |
| `improvementKeysForHex(hex)` | `terrain-improvements.ts` |
| `applyImprovementBonuses(yld, keys[])` | `terrain-improvements.ts` |
| `hexToWorkedTile(hex)` — czyta `hex.ulepszenia[]` lub fallback `hex.ulepszenie` | `turn-economy.ts` |

**Kontrakt Hex (SILNIK wdraża):**

```typescript
interface Hex {
  ulepszenie: Ulepszenie;           // legacy single — migracja save
  ulepszenia?: string[];            // NOWE — warstwy kanonu
}
```

**Przykład AC:** `ulepszenia: ['farma','irygacja']` → `tileYield` = +8 żywności.

### 3. Hodowla — unlock imperium

| API | Plik |
|-----|------|
| `isLivestockAllowed(civType, improvementKey, era)` | `livestock-unlock.ts` |
| `computeEmpireLivestockUnlocks(placedMap, map, ownerId?)` | `livestock-unlock.ts` |
| `isLivestockUnlockedForPlacement(key, hex, empireUnlocks)` | `livestock-unlock.ts` |
| `getResourceAccessForCity(..., options?: { ownerId, empireLivestockUnlocks })` | `resource-access.ts` |

**placedImprovements** — rozszerzony typ: `Map<string, string | readonly string[]>` (warstwy per heks).

**Logika unlock:** pierwsze `bydlo`/`owce`/`lama` na heksie ze **złożem** tego zwierzęcia → `Set<LivestockKey>` imperium → kolejne pastwiska na zwykłym terenie (MAPA kwalifikuje teren).

**Inkowie:** `era < 3` → `isLivestockAllowed` = false dla bydlo/owce/kon; lama zawsze dla Inków.

---

## Co SILNIK ma zrobić

1. Dodać `ulepszenia?: string[]` do `Hex` + migracja save (S1, S8).
2. `placedLayers: Map<hexKey, Set<string>>` zamiast single key (S3).
3. Wire `buildImprovementFactory` — append warstwa, nie replace (S2).
4. Import `isLivestockAllowed`, `computeEmpireLivestockUnlocks`, `isLivestockUnlockedForPlacement` w trybie budowy (S5–S6).
5. Przekazać `ownerId` do `getResourceAccessForCity` z `main.ts`.
6. Usunąć UI `pastwisko` → bydlo/owce/lama (S8).

**NIE ruszać w SILNIK:** logika `tileYield` / JSON — już w EKONOMIA.

---

## AC weryfikacja (test lane)

```bash
cd gra
node tools/food-hodowla-test.cjs   # AC-E1..E4
npx tsc --noEmit
```

---

## DoD

- [x] AC-E1–E5 (lane)
- [x] Ten handoff
- [x] Wpis `EKONOMIA-DO-MASTERA.md`
- [x] Flaga **`→ SILNIK: GOTOWE`**

**Blokada integracji:** czeka jeszcze **MAPA** (`→ SILNIK: GOTOWE` z MAPA lane) przed batch F-FOOD-HODOWLA-01 w `main.ts`.
