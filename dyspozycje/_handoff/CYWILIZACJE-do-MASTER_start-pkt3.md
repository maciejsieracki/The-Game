# CYWILIZACJE → MASTER : dane startu + fix Sumerowie (main.ts) + pkt3 klaster

Data: 2026-06-25 | civs.json start-ready; pkt3 GOTOWY (ai-test 188/0); jeden fix w main.ts (lane MASTER).

## civs.json — dane dla EKRANU STARTU (DONE)
Każda z 9 nacji ma teraz: `typCywilizacji` (klucz enuma) + `archetyp` (klucz CIV_TO_ARCH) + `bonusy[]`. `export-civs.py` chroni nowe pola. JSON OK.
Mapowanie typCywilizacji/archetyp: grecy/grecy, rzymianie/rzym, chinczycy/chiny, inkowie/inkowie, zulusi/zulusi, egipt/egipt, **Sumerowie→babilon/sumer**, celtowie/celtowie, germanie/germanie.

## FIX Sumerowie (fallback 0.5) — ZMIANA W main.ts (lane MASTER/START)
`main.ts` buduje aiOwnerCivMap z `c.ikonaId` (3 miejsca: l.362, 2610, 2704) + `player.civType` z `_menuCivId` — keyowane po ikonaId. Dla Sumerów `ikonaId='sumerowie'` ≠ enum `'babilon'` → CIV_TO_ARCH fallback 0.5 zamiast archetypu.
**FIX (master):** w tych miejscach `c.typCywilizacji ?? c.ikonaId` (+ ekran startu przekazuje `typCywilizacji` do `player.civType`). Dane już spójne (`typCywilizacji='babilon'`), więc to ostatni element układanki.

## pkt3 — ekspansja AI świadoma klastra (DONE, ai-test 188/0)
`ai.ts findSettlerTarget` biasuje osadnika ku własnemu klastrowi (hex w `clusterCenter`±`clusterRadius`: +50 w klastrze / −20 poza). Brak danych klastra → zero regresji.
**WPIĘCIE (SILNIK):** po `computeClusters()` → `tc = placement.klastry.find(k => k.typ === civTyp)`; `decideAITurn(..., { clusterCenter: tc.centrum, clusterRadius: placement.minDystans * 2 })`. Format MAPA bez zmian.
