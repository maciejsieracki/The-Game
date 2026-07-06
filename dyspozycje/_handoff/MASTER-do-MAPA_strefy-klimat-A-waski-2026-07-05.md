# MASTER → MAPA: strefy klimatyczne (A wąski)

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **START** |
| **Data** | 2026-07-05 |
| **Decyzja Macieja** | **A wąski** — [`docs/decyzje/MAPA-STREFY-KLIMAT-ABC-2026-07-05.md`](../../docs/decyzje/MAPA-STREFY-KLIMAT-ABC-2026-07-05.md) |
| **Kanon bazowy** | md5 **`0fd96b6f5fb021fb3294dde29c5692ce`** (BLEDY P0+P1, 2026-07-05) |
| **Lane** | Grupa A (MAPA) · **NIE** `main.ts` |

---

## Zakres

Trzy strefy klimatyczne wzdłuż osi **`r`** (środek mapy = suchy pas):

| Strefa | Szerokość | Efekt gameplay / teren |
|--------|-----------|------------------------|
| **Arid (środek)** | **~15%** wysokości mapy (`DRY_BELT_FRAC = 0.15`) | pustynia / step · **pustynie poza tym pasem — nie generować** |
| **Tropical (tuż nad/pod)** | kolejny pas (~20–25% każda strona) | las tropikalny / dżungla (render D-B2-3) |
| **Temperate (skraj góra/dół)** | reszta | umiarkowany · więcej lasu |

### Implementacja (propozycja techniczna)

1. **`climateZoneAt(q, r, height): 'arid' | 'tropical' | 'temperate'`** w `gen-helpers.ts`
   - `dist = |r - midRow| / (height/2)` → mapowanie na strefę
   - Progi: arid `dist < 0.075` (15% całej wysokości = ±7.5% od środka), tropical do ~0.30, reszta temperate
2. **Generator:** szum pustyni / lasu respektuje strefę (nie `desNoise` globalnie na całą mapę)
3. **Render:** `mapRenderStyle.ts` — dżungla gdy strefa=tropical (nie losowy hash); las umiarkowany w temperate
4. **Bez regresji:** fixy BLEDY (rzeki ujście, Morse→Morze) — **nie cofać**

---

## AC (Definition of Done)

1. Nowa mapa standardowa (seed 42, kontynenty): **widać 3 pasy** (suchy w środku, zielone strefy góra/dół)
2. **Pustynia tylko w pasie arid** — poza pasem brak `Pustynia` z samego szumu klimatu
3. **Dżungla** w pasie tropical (wizualnie odróżnialna od lasu umiarkowanego)
4. `node tools/map-gen-regression-test.cjs` — **PASS** (determinizm + rzeki bez regresji)
5. Meldunek: `MAPA-DO-MASTERA.md` → **`→ MASTER: GOTOWE`**

---

## Zakaz

- NIE ruszać `main.ts` — hook tylko przez handoff do F jeśli konieczny
- NIE zmieniać `applyDoubleCoastRing` / B0.4 bez osobnego ABC

---

## Po meldunku

Master → playtest Macieja (screen 3 stref) → ewentualna promocja kanonu przez F + Master.
