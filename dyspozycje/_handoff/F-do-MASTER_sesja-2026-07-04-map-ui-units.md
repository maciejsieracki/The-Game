# F → MASTER: sesja 2026-07-04 — mapa 2×, brzegi, zoom, drogi 3×, panel heksu, UI pill

| Pole | Wartość |
|------|---------|
| **Status** | **→ MASTER: GOTOWE-ROBOCZA** |
| **Data** | 2026-07-04 |
| **Batch** | sesja Macieja (MAPA + UI + UNITS + SILNIK wiring) |
| **Poprzedni ROBOCZA (sesja rano)** | `ad5cc87c86b1f6988dd6245e7463f869` |
| **Nowy ROBOCZA** | **`53ec508f48b7a9e13e152b1ba5d44644`** |
| **Kanon root** | **NIE dotykany** — czeka Opus + `publish-kanon-snapshot.ps1` |

**Start testowy:** `gra-robocza/START.html` · **Ctrl+F5**

---

## Podsumowanie (co jest w `gra/src/`)

| # | Temat | Lane | Pliki |
|---|--------|------|-------|
| 1 | Poszarpane brzegi + mniej wody w lądzie | MAPA | `map/gen-helpers.ts`, `map/generator.ts` |
| 2 | Mapy **2× liniowo** (4× heksów) | MAPA + DATA | `data/map-gen-params.json`, `e-start-params.json`, `map-gen-params-loader.ts`, `newGameMapDefaults.ts`, `clusters.ts` |
| 3 | Zoom kamery **2×** + far clip skalowany | MAPA + SILNIK | `main.ts` (`cameraControllerOpts`), `render/scene.ts` |
| 4 | Ruch po drogach **3× szybciej** | UNITS | `units/setup.ts` (`ROAD_MOVE_SPEED_MULT = 3`) |
| 5 | Panel heksu rozszerzony (D17) — plony, ulepszenia | UI | `ui/hexContextTooltip.ts`, `ui/sidePanelHud.ts` |
| 6 | Usunięcie legacy pill `0/0` + toast hint | UI + SILNIK | `main.ts` |
| 7 | Lite forest meshes (palma 2 liście, dżungla bez korony) | MAPA/RENDER | `render/mapRenderStyle.ts` (fix testu E1) |

---

## Szczegóły implementacji

### MAPA — generator kontynentów
- `landMaskKontynenty`: wieloskalowy szum, łagodniejszy radial (2.1→1.55), węższa granica Voronoi.
- `applyJaggedCoastNoise`: 2 passy szumu na brzegu.
- `trimEnclosedOceanOnly`: morze odcięte od oceanu → ląd.
- `purgeInlandWaterForMultiLandTyp` wywołuje też `trimEnclosedOceanOnly`.
- Pipeline po `applyLandFractionByContinent`: jagged coast → `removeTinyLandIslands(5)` → trim; `coastOpts.maxInlandPoolSize: 8`; końcowy pass trim.

### MAPA — rozmiary map (×2 w Q/R)
| Etykieta | Q×R (nowe) |
|----------|------------|
| malenki | 76×52 |
| maly | 108×74 |
| standardowy | 168×120 |
| duzy | 240×168 |
| ogromny | 336×238 |
| superogromny | 672×476 |

Progi `mapSizeLabel` w `clusters.ts` / `newGameMapDefaults.ts` ×4 (4800 / 12000 / 25200 / 100000).

### SILNIK — kamera
- `maxDist = max(320, mapSpan * 1.2)` (wcześniej stałe ~160).

### UNITS — drogi
- `terrainMoveCost()`: koszt ÷3 gdy `hex.ulepszenie === Ulepszenie.Droga`.

### UI — panel heksu (D17)
- Surowce, ulepszenie postawione, hodowla/złoże, **Plony — rozbicie** per typ, możliwe ulepszenia terenu, suma.

### UI — HUD
- Usunięto `#hud`, `#nauka-btn`, `#diplo-btn`, stały dolny hint bar.
- Dodano toast `#civ-hint-toast`; uproszczono `updateHud()`.

---

## Testy (pre-kanon)

| Test | Wynik |
|------|-------|
| `map-quality-forest-parity-test.cjs` | **101/101** |
| `map-coast-buffer-test.cjs` | **115/115** |
| `map-continents-rivers-test.cjs` | **5/5** |
| `land-sea-ratio-test.cjs` | 9/9 (wcześniejsza sesja — bez regresji) |
| vite build → `$env:TEMP\civ-dist` | **OK** · ~8.59 MB |

**MASTER przed kanonem:** pełna bramka 17 suitów (`.\tools\bramka-test-publish.ps1`) + Opus review.

**Znany baseline-red:** `koszary-gate-test` (Lazaret=Średniowiecze — decyzja Macieja 2026-06-26).

---

## Co MASTER ma zrobić (kanon)

1. **Przeczytać ten handoff** + meldunki: `MAPA-DO-MASTERA.md`, `SILNIK-DO-MASTERA.md`, `UNITS-DO-MASTERA.md` (wpisy 2026-07-04).
2. **Zweryfikować `main.ts`** — zmiany UI pill + kamera już w źródle (batch sesji); backup zalecany: `main.ts.bak-SESJA-2026-07-04`.
3. **Playtest Macieja** na ROBOCZA (Ctrl+F5): brzegi, brak wody w lądzie, zoom, drogi, panel heksu, rozmiary map.
4. **Bramka 17 suitów** → build → **Opus** (mapa + UI heks + units drogi).
5. **`publish-kanon-snapshot.ps1`** → root `Gra-podglad.html` + md5 checkpoint w DZIENNIK.

**Uwaga:** osobny batch UI miasto (playtest OK ~10:40) — `_handoff/UI-do-MASTER_miasto-playtest-OK-promocja-2026-07-04.md`. Ten handoff **łączy** zmiany map/units/hex panel; miasto powinno być już w `gra/src/` jeśli promocja była wcześniej wpisana.

---

## Otwarte decyzje Macieja (ABC — NIE zaimplementowano)

Przy mapach 2× i domyślnym kreatorze wzór państw: `1 + N + (T−1)×(N+1)` (N = miasta/klaster, T = typy cywilizacji). Np. Standardowy ≈ **42 państwa** na ~20k heksów przy 15 typach w `civs.json`. Maciej ma zdecydować ABC o obniżeniu T/N — **później**, lane CYWILIZACJE + kreator.

---

## Pliki zmienione (checklist diff)

```
gra/src/main.ts
gra/src/map/gen-helpers.ts
gra/src/map/generator.ts
gra/src/map/clusters.ts
gra/src/map/newGameMapDefaults.ts
gra/src/units/setup.ts
gra/src/render/scene.ts
gra/src/render/mapRenderStyle.ts
gra/src/ui/hexContextTooltip.ts
gra/src/ui/sidePanelHud.ts
gra/src/data/map-gen-params-loader.ts
gra/data/map-gen-params.json
gra/data/e-start-params.json
gra/tools/map-quality-forest-parity-test.cjs
```

---

## DoD (Definition of Done dla MASTER)

- [ ] Playtest Macieja OK (mapa, zoom, drogi, panel heksu)
- [ ] Bramka 17 suitów ZIELONA (baseline-red wyjątek)
- [ ] Opus APPROVE
- [ ] Kanon opublikowany · md5 w DZIENNIK
- [ ] Decyzja ABC T/N cywilizacji — osobny sprint (opcjonalnie przed v1.0)
