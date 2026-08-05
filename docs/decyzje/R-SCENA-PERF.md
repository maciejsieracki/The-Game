# R-SCENA-PERF — Budowanie sceny

**Status:** 🔵 W TOKU · Q1=**A** · fix dżungli instanced (FALA 248) · **CZEKA F12 ms od Macieja** na weryfikację w grze  
**ID rejestr:** `R-SCENA-PERF-FALA138` · `BUG-SCENA-PERF-FALA138`

## ECHO
`R-SCENA-PERF-Q1 A` — najpierw pomiar (instrumentacja / kill-switch etapów) → potem fix wąskiego gardła.

## Sygnał
Maciej wybrał opcję **3** (sygnał na scenę) po FALA 226.

## Fix FALA 248 (branch `cursor/scena-perf-next-63a1`)

**Wąskie gardło (offline diag):** `jungleForest` ~1100–2500× ciężki `collapseToMergedMesh` na Pangea (roblox).

**Dźwignia:** `gra/src/render/djungla-modele.ts` + wpięcie w `scene.ts` — wzorzec `lasInst` (5× `InstancedMesh`, zero styledOverlay merge dla tropików).

| Mapa | Przed (est.) | Po (est.) |
|------|--------------|-----------|
| duży/pangea/42 roblox | total=2702 jungle=2492 heavy≈2549 | total=210 jungle=0 heavy≈57 |
| standard/pangea/42 roblox | total=1223 jungle=1102 heavy≈1140 | total=121 jungle=0 heavy≈38 |

Pozostałe ciężkie overlaye: głównie **oazy** (~40 mesh / heks).

## Stan techniczny
Instrumentacja w `gra/src/render/scene.ts` (FALA 150–155 + rozszerzenie FALA 138):
- `console.info('[civ] buildScene ms | hexes=… coast=… overlays=… rivers=… tail=… total=…')`
- `detail heksy` — alokacja / pryzmy / relief / styled w pętli / brzeg / pustynia / finalizacja
- `detail nakladki` — scalMerge + **collapsed / skipMerged / skipLight**

**Pomiar offline (bez WebGL / F12):**
```bash
cd gra && node tools/scene-perf-diag.cjs
```
→ liczba heksów, pre-pass rzek + **szacunek styledOverlays** (`countSceneOverlayCandidates`).

**Fix merge (wcześniejsze + FALA 248):**
- `meshCount` cache przy `pushStyledOverlay` — brak drugiego `traverse` w fazie scalMerge
- `isAlreadyMergedDecor` — skip podwójnego `collapseToMergedMesh`
- **dżungla roblox → `djunglaInst`** (5 draw calli zamiast ~1100× merge)
- Test: `node tools/merge-decor-no-regress-test.cjs`

Diagnoza historyczna: wąskie gardło **≠ mesh rzek** (FALA 149: `riverRenderStage=0` nadal wolno).

## Krok dalej — F12 (Maciej)
1. Ctrl+F5 + **Nowa gra** (skala Standard lub Duży / Pangea)
2. Konsola → linie `[civ] buildScene ms` + `detail nakladki` — **overlays** powinno spaść vs poprzednia robocza
3. Operator: jeśli nadal wolno → kolejny kandydat: oazy (`buildOaza` merge)

**ZAKAZ:** duży refaktor renderu bez liczb z konsoli / offline est.

## Checklist
- [x] `node tools/scene-perf-diag.cjs` — jungle=0, heavy≈ oazy only (duży/pangea)
- [x] `node tools/merge-decor-no-regress-test.cjs` — PASS
- [x] `npx tsc --noEmit` — 0 błędów
- [ ] F12 Maciej — `overlays` ms w `[civ] buildScene ms` (weryfikacja w grze)
