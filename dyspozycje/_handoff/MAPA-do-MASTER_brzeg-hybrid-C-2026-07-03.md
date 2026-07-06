# MAPA → MASTER: brzeg hybryda C + delta A (2026-07-03)

> **Status:** → MASTER: GOTOWE  
> **Decyzje:** D-MAPA-BRZEg **C** · D-MAPA-DELTA **A**  
> **Warstwa:** 🟡 cross (render mapy + riverPaths, bez `main.ts`)

---

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/src/render/mapRenderStyle.ts` | `buildStyleLandCoastSandCap`, `buildStyleCoastSandTopCap`, kierunkowa `buildStyleCoastWaterCap`, `computeRiverDeltaHexKeys`, łagodniejszy profil Wybrzeże |
| `gra/src/render/scene.ts` | montaż nakładek ląd+Wybrzeże; delta fan; szersze ujście rzeki (coast color) |
| `gra/tools/map-coast-buffer-test.cjs` | asercje land beach cap + delta fan |

**NIE ruszano:** `main.ts`, `gra-kanon/`, publish.

---

## Co Integrator ma zrobić

1. Wpięcie przez F po review — **brak zmian API poza renderem** (buildScene bez nowych parametrów).
2. Po publish roboczej: weryfikacja wizualna brzegu (piasek ląd+Wybrzeże, brak klifu) i delty u ujść rzek.

---

## DoD lane

- [x] Piasek na lądzie (~30% R od krawędzi Wybrzeża)
- [x] Pełna tafła piasku na Wybrzeżu + woda tylko od Morza
- [x] Profil Wybrzeże podniesiony (top 0.40 vs ląd 0.45)
- [x] Delta fan 2–3 heksy + szersze ujście (jasnoniebieski)
- [x] `map-coast-buffer-test.cjs` **81/81 ZIELONE**
- [x] `node tools/smoke.cjs` OK

---

## Po wpięciu F — co sprawdzić

- Nowa gra → brzeg: piasek widoczny na lądzie i Wybrzeżu z kamery izometrycznej.
- Rzeka u ujścia: rozszerzenie w jasnoniebieskie Wybrzeże (fan), ciągłość z odcinkiem lądowym.
- Brak pionowej „ściany” między trawą a piaskiem.

**PLAYTEST-KANDYDAT:** PT-MAPA-BRZEg-C → rejestr §2 (Master informuje Macieja).
