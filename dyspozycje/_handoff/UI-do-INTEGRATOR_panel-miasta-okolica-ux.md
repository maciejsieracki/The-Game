# UI/MAPA → INTEGRATOR: panel miasta + overlay okolicy 3D

**Status:** GOTOWE (wpięte w `main.ts` 2026-06-26)  
**Prototyp zaakceptowany:** `Gra-podglad-OKOLICA-UX.html` (Maciej: „Ok, ekstra, mamy to”)

---

## Co przesyłam

| Plik | Rola |
|------|------|
| `gra/src/render/cityOkolicaOverlay.ts` | Overlay 3D: zasięg miasta, zielone pola z 👤, sprite'y plonów (złote większe cyfry tylko na polu produkcyjnym) |
| `gra/src/ui/cityUxFrame.ts` | Ramka Civ V (góra/lewo/prawo), `isPointOverCityPanelUi(x,y)` |
| `gra/src/ui/cityPanel.ts` | `showCityPanel` → `showCityUxFrame`, mini-SVG okolica |
| `gra/src/okolicapreview/main.ts` | **Referencja integracji** (wzorzec sync/dispose/klik) |

---

## Co Integrator zrobił w `main.ts`

1. **Import:** `syncCityOkolicaOverlay`, `disposeCityOkolicaOverlayGroup`, `isPointOverCityPanelUi`, `yieldOfMapHex`, `resolveWorkedTiles`
2. **Stan:** `okolicaOverlayGroup: THREE.Group | null`
3. **Helpery:** `okolicaWorkedKeySet`, `syncOkolicaOverlay()`, `disposeOkolicaOverlay()`, `hideCityPanelFull()`
4. **Hooki:**
   - `openCityPanelForPlayer` → `syncOkolicaOverlay()` po `showCityPanel`
   - `applyOkolicaTileAdjust` / `onOkolicaFocusChange` / `onOkolicaRestoreAuto` → `syncOkolicaOverlay()`
   - zamknięcie panelu → `disposeOkolicaOverlay()` (via `hideCityPanelFull`)
   - rebuild sceny → `disposeOkolicaOverlay()` przed `disposeScene()`
5. **Kamera:** `CameraControllerOptions.blockPointerAt` → `isPointOverCityPanelUi` (drag/zoom blokowany nad UI)
6. **Klik mapy:** `mouseup` ignoruje klik gdy kursor nad panelem miasta

**Backup:** `gra/src/main.ts.bak-SILNIK-okolica-overlay-2026-06-26`

---

## DoD (kryteria akceptacji)

- [ ] Otwarcie panelu miasta gracza pokazuje overlay zasięgu + plony na mapie 3D
- [ ] Klik heksu w okolicy (poza UI) toggle 👤; overlay odświeża się natychmiast
- [ ] Cyfry plonów: **złote + większe tylko na polu z 👤**; reszta białe/normalne
- [ ] Drag/zoom kamery nie działa nad ramką panelu
- [ ] Zamknięcie panelu / ESC / wybór jednostki usuwa overlay
- [ ] Build + smoke OK

---

## Kiedy handoff jest gotowy

**GOTOWE** — kod lane dostarczony; integracja w `main.ts` wykonana. Czeka: build kanon + bramka testów + playtest Macieja + Opus review.
