# MAPA → INTEGRATOR: miasta Roblox (kamień + brąz) — rebuild kanon

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **→ INTEGRATOR: GOTOWE** |
| **Data** | 2026-07-02 |
| **Warstwa** | 🟡 cross (`cities.ts` + bundle) |
| **Decyzja Macieja** | sign-off podglądów brąz + kamień Roblox |

---

## Co wdrożono (lane MAPA)

| Plik | Zmiana |
|------|--------|
| `render/bronzeCityRoblox.ts` | brąz per cyw, mury hex |
| `render/stoneCityRoblox.ts` | kamień wspólny (A5-S2) |
| `render/settlementModel.ts` | fabryka classic/roblox |
| `render/cities.ts` | `CityRenderer` → Roblox gdy `GAME_MAP_RENDER_STYLE=roblox` |

**Podglądy:** `Civ-MAPA/Gra-podglad-MIASTA-BRAZU-ROBLOX.html`, `…KAMIEN-ROBLOX.html`

**Czeka SILNIK:** ghost miasta w `main.ts` — handoff `MAPA-do-SILNIK_settlement-roblox-ghost.md`

---

## Akcja Integratora

1. Scal batch SILNIK ghost (jeśli gotowy) lub rebuild z samym `cities.ts`
2. `npx vite build --outDir $env:TEMP\civ-dist` → `Gra-podglad.html`
3. Playtest Maciej: miasta kamień/brąz na mapie + mury

---

## DoD

- [ ] Miasta na mapie = styl Roblox (spójne z ulepszeniami/jednostkami)
- [ ] Kamień = jeden wspólny model (nie per cyw)
- [ ] Brąz = per cywilizacja, mury hex
