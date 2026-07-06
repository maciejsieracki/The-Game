# MAPA → INTEGRATOR: E1 — las parity (jakość mapy vs dekoracje)

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Handoff źródło:** `MASTER-do-MAPA_E1-jakosc-dekoracje-gameplay-safe.md`  
**Status:** GOTOWE  
**Flaga:** → INTEGRATOR: GOTOWE · **NIE** `main.ts`

---

## Co przesyłam

| Zmiana | Plik |
|--------|------|
| `robloxLite` nie redukuje `treeCount` — stałe 3–5 drzew/hex | `gra/src/render/mapRenderStyle.ts` |
| Lite = prostsze meshe (mniej koron/warstw, bez castShadow) | `addRobloxTree`, `addMinecraftSpruce` |
| Export `forestTreeCountForHex()` — kontrakt testowy | `mapRenderStyle.ts` |
| Komentarz E1 przy dekoracji lasu | `gra/src/render/scene.ts` |

**Generator / gen-helpers:** bez zmian (celowo).

---

## Test regresji

```bash
cd gra
node tools/map-quality-forest-parity-test.cjs
```

**Wynik:** 98 pass, 0 fail (2026-06-29)

---

## DoD INTEGRATOR

- [ ] Rebuild kanonu po batch UI + SILNIK (bundle preset w `main.ts`)
- [ ] Wizualny smoke: Niska vs Wysoka — ta sama liczba „kęp” lasu na hexie z `Nakladka.Las`
- [ ] Opus przed publikacją

**Nie wymaga** osobnego batcha `main.ts` dla samego E1-MAPA.

---

## Zależności otwarte (inne lane)

| Lane | Zadanie |
|------|---------|
| UI | Jeden suwak + `bundledMapQualityFromLabel` |
| SILNIK | `mapRenderOptionsFromParams()` → bundle |
