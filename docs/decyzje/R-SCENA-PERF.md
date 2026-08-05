# R-SCENA-PERF — Budowanie sceny

**Status:** 🔵 W TOKU · Q1=**A** · pomiar offline + mały fix merge (2026-08-05)  
**ID rejestr:** `R-SCENA-PERF-FALA138` · `BUG-SCENA-PERF-FALA138`

## ECHO
`R-SCENA-PERF-Q1 A` — najpierw pomiar (instrumentacja / kill-switch etapów) → potem fix wąskiego gardła.

## Sygnał
Maciej wybrał opcję **3** (sygnał na scenę) po FALA 226.

## Stan techniczny (branch `cursor/scena-perf-63a1`)
Instrumentacja w `gra/src/render/scene.ts` (FALA 150–155 + rozszerzenie FALA 138):
- `console.info('[civ] buildScene ms | hexes=… coast=… overlays=… rivers=… tail=… total=…')`
- `detail heksy` — alokacja / pryzmy / relief / styled w pętli / brzeg / pustynia / finalizacja
- `detail nakladki` — scalMerge + **collapsed / skipMerged / skipLight** (bez F12: też panel żółty + plik perf)

**Pomiar offline (bez WebGL / F12):**
```bash
cd gra && node tools/scene-perf-diag.cjs
```
→ liczba heksów, pre-pass rzek + **szacunek styledOverlays** (`countSceneOverlayCandidates`).

**Fix merge (mały win, bez refaktoru renderu):**
- `meshCount` cache przy `pushStyledOverlay` — brak drugiego `traverse` w fazie scalMerge
- `isAlreadyMergedDecor` — skip podwójnego `collapseToMergedMesh`
- Test: `node tools/merge-decor-no-regress-test.cjs`

Diagnoza historyczna: wąskie gardło **≠ mesh rzek** (FALA 149: `riverRenderStage=0` nadal wolno) — podejrzenie pętli heksów / `styledOverlays` merge.

## Krok dalej (opcjonalnie F12)
1. Ctrl+F5 + **Nowa gra** (skala Standard lub ta, na której boli)
2. Konsola lub żółty panel / plik `civ-perf-*.txt` → linie `[civ] buildScene ms` + `detail heksy` + `detail nakladki`
3. Operator: kill-switch / fix wg największej pozycji ms

**ZAKAZ:** duży refaktor renderu bez liczb z konsoli / offline est.

## Checklist bez F12
- [ ] `node tools/scene-perf-diag.cjs` — `heavy≈` vs `total` overlayów
- [ ] `node tools/merge-decor-no-regress-test.cjs` — PASS
- [ ] Nowa gra → plik perf / `[civ-perf]` w konsoli — który etap dominuje (hexes vs overlays vs tail)
