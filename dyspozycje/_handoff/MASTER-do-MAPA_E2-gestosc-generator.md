# MASTER → MAPA: E2 — generator gęstości świata

**Status:** **GOTOWE** (2026-07-01) · orkiestrator: `dyspozycje/ORCHESTRATOR-DISPATCH-E2-2026-06-28.md`  
**Decyzja:** `docs/decyzje/E2-gestosc-swiat-kreator.md` (Maciej 2026-06-28 zamknięte)  
**Kontrakt UI (już w repo):** `WorldGenerationPreset` w `newGameMapDefaults.ts`

---

## Co UI / SILNIK będą przekazywać

```typescript
interface WorldGenerationPreset {
  resources: DensityTier;  // low | medium | high
  rivers: DensityTier;
  desert: DensityTier;
  forest: DensityTier;     // nakładka Nakladka.Las — NIE dekoracja 3D
}
// + civTypesCount: number (z kreatora, ±1 od aktywneTypy)
// + mapQuality bundle (E1) — osobno, scene.ts
```

---

## MAPA — implementacja

| AC | Zadanie |
|----|---------|
| AC-1 | `generujSwiat(seed, rozmiar, typ, opts?)` — opcjonalny `WorldGenerationPreset` + `civTypesCount` |
| AC-2 | **Surowce:** mnożnik suwaka **0.6 / 1.0 / 1.4** w `placeDeposits` **oraz podwyższona baza `rarity`** (Normalnie = więcej złóż niż dziś w generatorze). **`allowedOn` bez zmian** |
| AC-3 | **Rzeki:** baza **2 / 5 / 8** na **Małej** mapie; **skala proporcjonalna** z rozmiarem mapy (Maciej: 2 rzeki na małej ≠ 2 na ogromnej) |
| AC-4 | **Pustynia:** mnożnik/progi **0.5 / 1.0 / 2.0** (drastyczniej niż propozycja ±0.05) |
| AC-5 | **Las logiczny:** mnożnik/progi **0.5 / 1.0 / 2.0** — osobny parametr; **nie** dekoracja 3D / E1 bundle |
| AC-6 | **Typy cywilizacji:** `cluster-spawn` / placement respektuje `civTypesCount` z menu |
| AC-7 | Testy: krowy nigdy na górach; determinism seed; `tools/logic-test` lub nowy `world-density-test.cjs` |

---

## Pliki (lane MAPA)

- `gra/src/map/gen-helpers.ts`
- `gra/src/map/generator.ts`
- `gra/src/map/newGameMapDefaults.ts` (funkcje preset → mnożniki — uzupełnij)
- `gra/src/map/cluster-spawn.ts` (jeśli dotyczy typów)

**NIE:** `main.ts`, `newGameFlow.ts`

---

## DoD

- [x] AC-1–AC-7
- [x] Handoff `MAPA-do-SILNIK_E2-world-opts.md` z przykładem wywołania
- [x] Meldunek `MAPA-DO-MASTERA.md` + test `world-density-test.cjs` (28 pass)

**Flaga:** `→ SILNIK: GOTOWE`
