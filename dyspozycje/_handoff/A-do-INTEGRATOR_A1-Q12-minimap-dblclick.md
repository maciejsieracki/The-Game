# GRUPA A → INTEGRATOR (F): A1-Q12 overlay + MAPA-F2 dblclick

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **→ INTEGRATOR: GOTOWE lane UI** |
| **Data** | 2026-07-01 |
| **Obieg** | `_DYSPOZYCJA-WSPOLNY-OBIEG.md` · `DYSPOZYCJA-GRUPA-A.md` |
| **Warstwa** | 🟡 cross (UI gotowe · `main.ts` opcjonalnie bogatsze dane) |

---

## Co przesyłam (lane A / UI)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/siegeMapPanel.ts` | **C3-Q7=A** — panel boczny (prawa krawędź), mapa widoczna |
| `gra/src/ui/hud.ts` | Klik 🎭/⛪ na pasku [A] → overlay |
| `gra/src/ui/minimapHud.ts` | **Klik** = toggle zasięgu (jak dotąd) · **dblclick** = panel imperium |
| `gra/src/ui/empireOverlayHud.ts` | Rozszerzone pola opcjonalne A1-Q12a/b (progi, presja, szczęście) |

**Już w kanonie (F):** toggle zasięgu 3D · `getCultureOverlay` / `getReligionOverlay` w `main.ts` · przyciski minimapy.

---

## Co INTEGRATOR ma zrobić (opcjonalnie P4)

1. **Zweryfikować** że `minimapLayers` + `getCultureOverlay`/`getReligionOverlay` są podpięte (już są w `main.ts` ~3802, ~3978).
2. **Opcjonalnie wzbogacić** `buildCultureOverlayData()` / `buildReligionOverlayData()` o pola opcjonalne z `empireOverlayHud.ts`:
   - kultura: `thresholds`, `nextThreshold`, `pctToNext`, `happinessNote`, `sourcesNote`
   - religia: `spreadNote`, `dominanceThresholdPct`, `dominantCityCount`, `foreignCityCount`, `happinessNote`
3. **Nie zmieniać** semantyki: klik ikony minimapy = toggle · dblclick = panel (UI auto-wiring przez `buildMinimapLayers()`).

---

## DoD

- [ ] Klik Kultura/Religia na pasku [A] otwiera overlay (bez regresji toggle minimapy)
- [ ] Dblclick 🎭/⛪ przy minimapie otwiera ten sam overlay
- [ ] Toggle zasięgu na mapie 3D nadal działa (klik pojedynczy)
- [ ] Build + smoke OK po wpięciu

**Playtest Macieja:** ⏸ poza priorytetem

**Flaga lane:** UI **GOTOWE** — batch Integratora opcjonalny (wzbogacenie danych)
