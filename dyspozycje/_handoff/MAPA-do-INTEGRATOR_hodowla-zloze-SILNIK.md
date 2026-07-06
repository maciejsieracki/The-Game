# MAPA → INTEGRATOR (SILNIK): hodowla + złoże — batch F-FOOD-HODOWLA-01

**Data:** 2026-06-26  
**Batch ID:** **F-FOOD-HODOWLA-01**  
**Status:** **→ INTEGRATOR: GOTOWE** (MAPA + wstępna integracja `main.ts`)  
**Decyzja Macieja:** złoże bydła/owiec = gotowe ulepszenie; farma na złożu = stack Farma+Bydło/Owce  
**Kanon:** `docs/decyzje/KANON-ULEPSZENIA-ZYWNOSC-HODOWLA.md`

---

## Co przesyłam (komplet lane MAPA + EKONOMIA)

| Warstwa | Pliki | Status |
|---------|-------|--------|
| Generator | `gra/src/map/gen-helpers.ts` — złoża `ZlozeBydla`, `ZlozeOwiec` | ✅ |
| Logika warstw | `gra/src/game/terrain-improvements.ts` — `foodLayerFromAnimalDeposit`, `improvementKeysForHex` | ✅ |
| Kwalifikacja | `gra/src/map/improvement-build.ts` — farma na złożu hodowl., merge warstw | ✅ |
| Unlock imperium | `gra/src/game/livestock-unlock.ts` — odblokowanie po farmie na złożu | ✅ |
| Render | `render/improvements.ts`, `robloxImprovements.ts`, `styleResources.ts` | ✅ |
| Galeria | `improvepreview/main.ts` — `?view=hodowla` (5 wariantów) | ✅ |
| **Integracja gry** | `gra/src/main.ts` — stack mesh, sync złoże, save/load warstw | ✅ wstępne |

**Backup SILNIK:** `gra/src/main.ts.bak-SILNIK-hodowla-2026-06-26`

---

## Co INTEGRATOR ma zweryfikować / domknąć

### AC integracji (playtest)

| # | Kryterium |
|---|-----------|
| I1 | Heks ze złożem krowy = pastwisko wizualnie (bez duplikatu overlay + mesh) |
| I2 | Postaw **farmę** na złożu bydła → jeden mesh **Farma+Bydło**, plony +5/+3 |
| I3 | **Nie można** budować bydła/owiec na złożu (auto-warstwa) |
| I4 | Bydło na polu bez złoża — dopiero po farmie na złożu (unlock imperium) |
| I5 | Save/load: `placedImprovements` jako `[hexKey, string[]]` (fallback: pojedynczy string) |
| I6 | Inkowie ep1–2: brak bydło/owce w panelu budowy; lama OK |
| I7 | `rebuildResourceOverlays` pomija `ZlozeBydla/Owiec` gdy jest mesh stack |

### Osobny batch (NIE ten)

| Temat | Lane | Uwaga |
|-------|------|-------|
| Konie z zasięgu miasta/fortu | MAPA + EKONOMIA | `resource-access.ts` — bez pastwiska |
| Opus review przed finalnym kanonem | Opus Ask | obowiązkowa bramka wg playbook |

---

## Zmiany w `main.ts` (SILNIK — już wpięte)

1. `placedImprovements: Map<string, string[]>` — warstwy gracza (nie złoże)
2. `mergedImprovementLayers(hexKey)` — merge złoże + placed
3. `spawnImprovementMesh` / `buildImprovementVisual` → `buildImprovementStack`
4. `applyBuildRequest` — append warstwa, nie replace
5. `rebuildResourceOverlays` — skip overlay hodowli gdy mesh istnieje
6. `syncLivestockAndPlacedMeshes()` — init po starcie, new game, load, restore save
7. `refreshBuildApi` — `playerEra`, `playerOwnerId`, `placedImprovements`
8. Ghost preview — stack z merged layers
9. `restorePlacedImprovementsFromSave` — obsługa `string[]`

**Init:** `rebuildResourceOverlays()` + `syncLivestockAndPlacedMeshes()` po deklaracji map (fix TDZ).

---

## Testy (bramka)

```powershell
cd gra
node tools/food-hodowla-test.cjs              # 21/21
node tools/map-improvement-qualify-test.cjs   # 34/34
node tools/logic-test.cjs
node tools/smoke.cjs
```

Build kanonu:
```powershell
npx vite build --outDir $env:TEMP\civ-dist
Copy-Item $env:TEMP\civ-dist\index.html ..\Gra-podglad.html
```

**Build wykonany 2026-06-26** → `Gra-podglad.html` (robo integracji — czeka Opus przed zamknięciem batchu).

---

## Podglądy offline

| Plik | Opis |
|------|------|
| `Gra-podglad-HODOWLA.html` | 5 wariantów stack (`?view=hodowla`) |
| `Civ-MAPA/Gra-podglad-ULEPSZENIA.html` | pełna galeria ulepszeń |

---

## Powiązane handoffy

- `EKONOMIA-do-INTEGRATOR_kanon-zywnosc-hodowla.md` — EKONOMIA ✅
- `MAPA-do-SILNIK_kanon-zywnosc-hodowla.md` — kwalifikacja + render (stary; patrz ten plik)
- `MASTER-do-SILNIK_kanon-zywnosc-hodowla-integracja.md` — checklist S1–S8

---

## Flaga

**MAPA:** `→ INTEGRATOR: GOTOWE F-FOOD-HODOWLA-01`  
**INTEGRATOR:** playtest I1–I7 → Opus → finalna publikacja kanonu
