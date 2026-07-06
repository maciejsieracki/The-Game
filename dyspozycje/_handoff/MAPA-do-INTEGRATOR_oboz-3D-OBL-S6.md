# MAPA → INTEGRATOR — Obóz oblężniczy 3D (OBL-S6)

**Data:** 2026-06-29  
**Status:** **→ INTEGRATOR: GOTOWE** (moduł MAPA; wpięcie w `main.ts`)

## Co dostarcza MAPA

| Plik | Rola |
|------|------|
| `gra/src/render/siegeCampModels.ts` | Modele 3D: namioty, żołnierze, taran, wieża |
| `gra/src/render/siegeMarker.ts` | `SiegeMarkerRenderer` — obóz 3D zamiast płaskich dysków |
| `gra/src/render/siegeCampSync.ts` | Helpery: `machinesByCampHex`, `campOwnerByHex` |

## Kontrakt `SiegeMarkerRenderer.sync`

Rozszerzone opcje (`SiegeMarkerSyncOptions`):

```typescript
campHexesByCity?: Map<string, string[]>;
machinesByCampHex?: Map<string, SiegeMachineKind[]>;
ownerColorById?: Map<number, number>;
campOwnerByHex?: Map<string, number>;
```

Bez `machinesByCampHex` obóz pokazuje domyślny taran (placeholder).

## Batch w `main.ts` — `refreshSiegeMarkers()`

1. Import: `machinesByCampHex`, `campOwnerByHex` z `./render/siegeCampSync`
2. Import: `machinesByCampHex`, `campOwnerByHex`, `readyMachinesForCity` z `./render/siegeCampSync`
3. Dla każdego obleganego miasta:
   - `ready = readyMachinesForCity(city)` (lub `city.siegeMachines?.ready ?? []`)
   - `machinesByCampHex(camps, ready)`
   - `campOwnerByHex(camps, units, keyOf, city.ownerId)`
4. Przekazać do `siegeMarkerRenderer.sync(..., { ..., machinesByCampHex, campOwnerByHex, ownerColorById })`
5. `ownerColorById` — mapa z kolorów graczy (istniejąca paleta w main)

## DoD

- [ ] Playtest: oblężenie — widać obóz 3D (namioty + taran/wieża gdy ready)
- [ ] Build + smoke OK
- [ ] Bez zmiany logiki głodu/kapitulacji
