# MAPA → MASTER: ocean znika przy zoom out (regresja ×10)

**Status:** CZĘŚCIOWY FIX w roboczej · wymaga playtestu Macieja + decyzji ABC  
**Data:** 2026-07-04  
**Priorytet:** P0 playtest — Maciej zgłasza 10. raz  
**Lane:** MAPA (render/scene.ts) + ewentualnie SILNIK (kontrakt setFog)

---

## Objaw (Maciej)

- Przy **oddalaniu** kamery znika „enoceana” (globalna tafla + tło wokół wyspy).
- Przy **przybliżaniu** wraca.
- Na screenach: **szary/biały trójkąt** w rogu kadru = widać krawędź płaszczyzny oceanu albo tło sceny, nie wodę.

---

## Diagnoza (root cause — 3 warstwy)

### 1. Płaszczyzna oceanu za mała
`padO = R * 7` — stały margines niezależny od `maxDist` kamery (320+).  
Przy max zoom out kadr obejmuje **więcej** niż `(mapBounds + 2×padO)` → rogi bez wody.

### 2. THREE.Fog zjada taflę
Roblox: `Fog(near=mapSpan×0.28, far=mapSpan×2.6)`.  
Przy `maxDist≈320–400` odległość do płaszczyzny oceanu (Y=OCEAN_BED_Y) **> fog.far** → tafla wtapia się w kolor mgły / znika.

### 3. Materiał oceanu reaguje na mgłę
`MeshLambertMaterial` domyślnie `fog: true` — nawet przy większej płaszczyźnie woda **przyciemnia się do zera** zanim kamera dojedzie do horyzontu.

### 4. (Osobno) FoW + skrót M
`oceanMesh.visible = !anyHiddenFinal` — gdy **choć jeden** hex unknown (np. ocean nieodkryty), globalna tafla **OFF**, tło = czarny FoW.  
Skrót **M** odkrywa ląd, **nie** ocean → wokół wyspy nadal brak niebieskiej tafli (czarny void). To **inny** objaw niż zoom, ale myli się w playteście.

---

## Fix wdrożony (2026-07-04, sesja — do weryfikacji)

Plik: `gra/src/render/scene.ts`

| Zmiana | Cel |
|--------|-----|
| `maxZoomDist` jak w `main.ts` → `padO = max(maxZoomDist×3.2, …)` | Płaszczyzna pokrywa kadr |
| `fog.far = max(mapSpan×2.6, maxZoomDist×5.5)` | Mgła nie ucina oceanu |
| `farClip` ↑ z `maxZoomDist` | Brak clipu kamery |
| `oceanMat.fog = false`, `frameMat.fog = false` | Tafla zawsze pełna jasność |
| `scene.background = deepOcean` gdy brak unknown | Rożki kadru = kolor wody, nie szary/sky |

**Nie ruszano:** logiki `anyHiddenFinal` / skrótu M / FoW.

---

## Opcje dalsze (MASTER → decyzja + lane)

### A — Zostawić fix renderu (REKOMENDACJA na teraz)
Playtest: Ctrl+F5 robocza → zoom min/max z **F** (FoW off) i z **M** (ląd odkryty).  
Jeśli OK → promocja kanonu po Opus.

### B — Ocean przy skrócie M (produkt)
Gdy `revealAllLand=true`: pokazać `oceanMesh` mimo unknown na Morzu.  
Wymaga: flaga w `setFog(visible, explored, opts?: { showOceanBackdrop?: boolean })` lub osobne API.  
**SILNIK** wpina w `refreshFog()` · **MAPA** implementuje.

### C — Ocean zawsze jako tło (poza FoW czernią)
`oceanMesh.visible = true` zawsze gdy `fogOn`; tylko heksy wody respektują FoW.  
Prostsze wizualnie, może psuć „nie wiem co za horyzontem”.

### D — Shader / skybox zamiast PlaneGeometry
Usunąć zależność od rozmiaru płaszczyzny — horyzont z `scene.background` + ewentualnie cylinder. Większy refactor.

---

## DoD playtestu Macieja

- [ ] Max zoom out: **ciągła** ciemnoniebieska tafla wokół wyspy (bez szarych trójkątów).
- [ ] Zoom in/out: brak migania oceanu.
- [ ] **M**: ląd odkryty — ocean wokół **czy** ma być niebieski (decyzja B/C)?
- [ ] **F**: pełna mapa — ocean stabilny.
- [ ] Brzeg wyspy: bez regresji „zalania” / jaśniejszych dekoracji.

---

## Pliki

- `gra/src/render/scene.ts` — fix zoom
- `gra/src/main.ts` — skróty M/F, `revealAllLand`
- `gra/src/game/visibility.ts` — `allDryLandKeys`, `exploredSetForRender`

**Integrator:** Grupa F / MASTER po ACK Macieja · **Opus** przed kanonem.
