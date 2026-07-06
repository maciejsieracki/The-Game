# MASTER → SILNIK: F-CITY-HEX — czysty hex po założeniu miasta

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/F-city-hex-czysty.md`  
**Zależność:** EKONOMIA dostarcza `applyCityFoundingToHex()` + snapshot (handoff EKONOMIA)  
**Status:** CZEKA  
**Flaga:** → SILNIK: CZEKA (po EKONOMIA GOTOWE)

---

## Co przesyłam

Maciej: po założeniu miasta **nie widać** drzew/surowców/ulepszeń na hexie miasta. Zostaje tylko typ gruntu. Bonusy plonów centrum **zostają** (snapshot w `City`).

---

## Co SILNIK ma zrobić

| AC | Kryterium |
|----|-----------|
| AC-1 | Po każdym `foundCityAt` / `foundCity` (gracz, AI, start gry) — wywołać helper EKONOMII na hexie `(q,r)` |
| AC-2 | Usunąć mesh ulepszenia z `improvementMeshes` / `placedImprovements` jeśli był na tym hexie |
| AC-3 | `rebuildResourceOverlays()` + odświeżenie dekoracji lasu na tym hexie (jeśli API scene na to pozwala) |
| AC-4 | `cityRenderer.sync` po zmianie — bez regresji fog-of-war |
| AC-5 | Test ręczny: załóż miasto na hexie z lasem → brak drzew w centrum, plony centrum bez regresji |

**Miejsca w `main.ts` (orientacyjnie):**
- `tryFoundPlayerCityAt`
- AI handler `cmd.type === 'foundCity'`
- Blok startu cluster / `foundCityAt` przy `doStartGame`

**NIE implementuj** logiki snapshot/plonów — to EKONOMIA lane.

---

## DoD

- [ ] AC-1–AC-5
- [ ] Build `/tmp/civ-dist` + smoke OK
- [ ] Meldunek `SILNIK-DO-MASTERA.md`

**Batch:** 1× main.ts po EKONOMIA GOTOWE.
