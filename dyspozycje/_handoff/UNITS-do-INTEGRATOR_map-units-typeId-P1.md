# UNITS → INTEGRATOR — typeId na mapie + pasy helmów (P1)

**Data:** 2026-06-29  
**Status:** **→ INTEGRATOR: GOTOWE** (rebuild wizualny kanonu; **bez** zmian `main.ts`)

## Co dostarcza UNITS

| Plik | Zmiana |
|------|--------|
| `gra/src/render/units.ts` | `UnitRenderer.sync` — rebuild tokenu gdy zmienia się `category` **lub** `typeId` |
| `gra/src/render/units.ts` | `addOwnerHelmStripe()` — poziomy pas `ownerColor` na hełmie melee |
| Kategorie z pasem | `miecznik`, `wlocznik`, `falanga`, `legionista`, `domyslny` (+ wcześniej `maczuga`/`topor`) |
| Strzelcy | bez pasa na hełmie (bez zmiany polityki) |

## Kontrakt runtime

`main.ts` już przekazuje `typeId` w `RuntimeUnit` i woła `unitRenderer.sync(units)` — **brak batcha w main**.

Po merge lane: rebuild kanonu wystarczy, żeby na mapie widać było różne modele per `typeId` (np. Legionista vs Falanga vs super-jednostki).

## Batch INTEGRATOR

1. Merge `gra/src/render/units.ts` (backup: `units.ts.bak-UNITS-20260629`)
2. `cd gra && npx vite build --outDir $env:TEMP\civ-dist`
3. Bramka: `node tools/smoke.cjs` (+ opcjonalnie `node tools/battle-smoke.cjs`)
4. Skopiować wynik do `Gra-podglad.html` (po review Opus)

## DoD

- [ ] Dwa tokeny tej samej kategorii, różne `typeId` — różne modele na mapie
- [ ] Jednostki wręcz mają widoczny pas ownerColor na hełmie
- [ ] Strzelcy bez pasa helmowego
- [ ] Build + smoke OK
