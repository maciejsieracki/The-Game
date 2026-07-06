# MAPA → SILNIK: FOOD-HODOWLA — kwalifikacja + render warstw

**Data:** 2026-06-29  
**Od:** lane MAPA (P2 GOTOWE)  
**Status:** **→ SILNIK: GOTOWE** (MAPA) — czeka batch F-FOOD-HODOWLA-01  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

---

## Co MAPA dostarczyła

### Kwalifikacja (`gra/src/map/improvement-build.ts`)

- `bydlo` / `owce` / `lama` zamiast `pastwisko`
- Warstwy: `canAddFoodLayer()`, `FOOD_LAYER_KEYS`, `getHexLayers()` via `improvementKeysForHex()`
- Import z EKONOMII: `isLivestockAllowed`, `computeEmpireLivestockUnlocks`, `isLivestockUnlockedForPlacement`
- Tarasy: `isTarasyCiv()` — Chińczycy + Inkowie
- Farma/irygacja: `hasBlockingDepositForFarm()` — blok złoża
- Stan: `placedImprovements`, `playerEra`, `playerOwnerId` w `ImprovementBuildState`

### Render (`gra/src/render/`)

- `improvements.ts` — modele bydło/owce/lama; `buildImprovementStack(keys[])` (farma+irygacja → pole_irygowane)
- `robloxImprovements.ts` — rbxBydlo / rbxOwce / rbxLama
- `buildModeHud.ts` — ikony 🐄🐑🦙

### Panel-A

- `gen-panel-a.py` regen + `test-panel-a-roundtrip.py` OK
- Eksport: `bydlo.*` / `owce.*` / `lama.*` → `terrain-improvements.json`

### Testy

```bash
node gra/tools/map-improvement-qualify-test.cjs   # 32 pass
node gra/tools/food-hodowla-test.cjs             # EKONOMIA 21/21
```

### Podglądy

- `placementpreview/main.ts` — `buildImprovementQualifier` (kanon)
- `mainview/main.ts` — **TODO SILNIK/preview:** mirror jak placementpreview (legacy qualifies)

---

## Co SILNIK ma wpiąć (batch F-FOOD-HODOWLA-01)

| # | Zadanie |
|---|---------|
| S1 | `hex.ulepszenia: string[]` — zapis wielu warstw (fallback: `hex.ulepszenie`) |
| S2 | Budowa: druga warstwa na heksie z farmą (bydło XOR irygacja) |
| S3 | `createImprovementBuildApi` — przekazać `playerEra`, `playerOwnerId`, `placedImprovements` |
| S4 | Render mapy: `buildImprovementStack(improvementKeysForHex(hex))` zamiast pojedynczego klucza |
| S5 | Usunąć `pastwisko` z UI/main — lista z `IMPROVEMENTS` (już bez pastwisko) |
| S6 | Bramka batch: EKONOMIA + MAPA obie `GOTOWE` → dopiero Integrator ROBOCZA |

**NIE duplikować:** logika unlock hodowli = `livestock-unlock.ts` (EKONOMIA).

---

## AC (SILNIK)

- [ ] Heks z farmą + bydło renderuje oba modele (lub stack)
- [ ] Inkowie ep&lt;3: panel bez bydło/owce (tylko lama) — delegacja `isLivestockAllowed`
- [ ] Pierwsze bydło tylko na złożu; kolejne po unlock imperium
- [ ] `map-improvement-qualify-test.cjs` + `food-hodowla-test.cjs` zielone po integracji

---

## Powiązane

- EKONOMIA → SILNIK: `EKONOMIA-do-SILNIK_kanon-zywnosc-hodowla.md` (GOTOWE)
- MASTER: `MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md`
