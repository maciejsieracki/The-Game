# MASTER → MAPA: E1 — dekoracje vs las logiczny (gameplay-safe)

**Data:** 2026-06-29  
**Decyzja:** `docs/decyzje/E1-jakosc-mapy-bundle.md`  
**Status:** GOTOWE (2026-06-29)  
**Flaga:** GOTOWE → `MAPA-do-INTEGRATOR_E1-jakosc-las-parity.md`

---

## Problem (bug produktowy)

Dziś `robloxLite === true` (jakość Niska / Średnia na dużej mapie) **zmniejsza liczbę drzew** w `buildStyleForestCluster()` (`treeCount = lite ? 1 : 3–5`).

**Las w grze** = `hex.nakladka === Nakladka.Las` (generator) → tartak, wycinka, bonusy.

Gracz przy Niskiej jakości widzi **mniej drzew** na tym samym hexie → wrażenie innej mapy / złudzenie gameplayu.

**Decyzja Macieja:** jakość **nie zmienia** rozmieszczenia ani „obecności” lasu — tylko **szczegółowość meshy**.

---

## Co MAPA ma zrobić

| AC | Kryterium |
|----|-----------|
| AC-1 | `buildStyleForestCluster`: **stała** liczba drzew per hex (jak przy `high`); w trybie lite — **prostsze** modele (mniej warstw korony, mniejszy scale, bez cieni cast) |
| AC-2 | Hex z `Nakladka.Las` **zawsze** dostaje dekorację lasu (żaden preset nie pomija) |
| AC-3 | `buildStyleMountainPeak`, `buildStyleHillBump`, `buildStyleCoastSandEdges`, `addRobloxSkyDecor` — lite = mniej geometrii OK, **bez** wpływu na hex data |
| AC-4 | `resolveRenderPreset()` — bez zmian w generatorze; próg 3000 hex dla medium zostaje dla **mesh**, nie dla pomijania lasów |
| AC-5 | Komentarz w `mapRenderStyle.ts`: *„robloxLite = koszt GPU, nie warstwa logiczna mapy”* |
| AC-6 | Test: `gra/tools/map-quality-forest-parity-test.cjs` — ten sam seed → ta sama lista hexów z `Nakladka.Las`; opcjonalnie snapshot liczby wywołań `buildStyleForestCluster` per hex |

---

## Pliki (lane MAPA)

- `gra/src/render/mapRenderStyle.ts` — główna zmiana `buildStyleForestCluster`
- `gra/src/render/scene.ts` — weryfikacja warunku `nakladka === Las`
- `gra/tools/map-quality-forest-parity-test.cjs` — nowy (minimalny)

**NIE ruszać:** `generator.ts`, `gen-helpers.ts` (klasyfikacja lasu), `main.ts`

---

## DoD

- [ ] AC-1–AC-6
- [ ] Test ZIELONY
- [ ] Meldunek `MAPA-DO-MASTERA.md`
- [ ] Handoff `MAPA-do-INTEGRATOR_E1-jakosc-las-parity.md`

**Po GOTOWE:** INTEGRATOR rebuild kanonu.
