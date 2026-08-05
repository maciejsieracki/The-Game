# R-SCENA-PERF — Budowanie sceny

**Status:** 🔵 W TOKU · Q1=**A** · sygnał Macieja 2026-08-05 (~13:29)  
**ID rejestr:** `R-SCENA-PERF-FALA138` · `BUG-SCENA-PERF-FALA138`

## ECHO
`R-SCENA-PERF-Q1 A` — najpierw pomiar (instrumentacja / kill-switch etapów) → potem fix wąskiego gardła.

## Sygnał
Maciej wybrał opcję **3** (sygnał na scenę) po FALA 226.

## Stan techniczny (main / FALA 226)
Instrumentacja **już jest** w `gra/src/render/scene.ts` (FALA 150–155):
- `console.info('[civ] buildScene ms | hexes=… coast=… overlays=… rivers=… tail=… total=…')`
- detail heksy / nakładki
- overlay UI faz: heksy / brzeg / nakładki / rzeki / finał

Diagnoza historyczna: wąskie gardło **≠ mesh rzek** (FALA 149: `riverRenderStage=0` nadal wolno) — podejrzenie pętli heksów / `styledOverlays` merge.

## Stan operacyjny (2026-08-05 ~13:44)
Maciej fokus: **playtest R-AUTO** → F12 **wstrzymane**. Po `OK`/`BUG` R-AUTO wracamy do pomiaru.
Handoff: `dyspozycje/_handoff/HANDOFF-SESJA-2026-08-05_FALA-225-226.md`.

## Krok teraz (pomiar)
1. `git pull` + Ctrl+F5 + **Nowa gra** (skala Standard lub ta, na której boli)
2. F12 → konsola → skopiuj linie `[civ] buildScene ms` + `detail heksy` + `detail nakladki`
3. Wklej w czat → Operator: kill-switch / fix wg największej pozycji

**ZAKAZ:** duży refaktor renderu bez liczb z konsoli.
