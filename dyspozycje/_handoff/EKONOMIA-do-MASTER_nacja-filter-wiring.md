# EKONOMIA → MASTER: wpięcie filtra Nacja (CELT-Q3=A)

**Status:** ✅ **WPIĘTE** (MASTER 2026-07-04) · moduł EKONOMIA + `main.ts` wiring  
**Decyzje Macieja 2026-07-04:** CELT-Q1=A · CELT-Q2=A · CELT-Q3=A

## Co przesyłam

| Plik | Zmiana |
|------|--------|
| `gra/src/game/production.ts` | `civUnitNacja` w `AvailabilityContext`, `unitNacjaForCivKey()`, filtr `Nacja` w `availableProduction()` |
| `gra/src/ui/cityPanel.ts` | `getCivKey?` w config, przekazanie `civUnitNacja` do prodCtx |
| `gra/data/units.json` | ~~Soldurii + roster-6~~ → **Grupa C** (CYW tylko brief) |

## Co MASTER ma zrobić (1 batch main.ts)

1. Import: `unitNacjaForCivKey` z `./game/production` (jeśli jeszcze brak).

2. W obu wywołaniach `configureCityPanel({...})` dodać:

```typescript
getCivKey: (ownerId: number) =>
  ownerId === 0
    ? (player.civType || 'grecy')
    : (aiOwnerCivMap.get(ownerId) ?? 'grecy'),
```

3. W bloku auto-manage (`autoManageCity`, ~8164) rozszerzyć `ctx`:

```typescript
ctx: {
  builtBuildingIds: builtForCity,
  productionQueue: prod0.kolejka,
  epoch: city.ownerId === 0 ? player.era : (aiEra.get(city.ownerId) ?? player.era),
  civBonusy: civBonusyForOwnerId(city.ownerId),
  civUnitNacja: unitNacjaForCivKey(
    city.ownerId === 0
      ? (player.civType || 'grecy')
      : (aiOwnerCivMap.get(city.ownerId) ?? 'grecy'),
  ),
},
```

(Uwaga: jeśli AI ma osobną epokę — użyć istniejącego lookupu epoki per owner.)

## DoD

- Celtowie widzą Gaesatae/Soldurii; inne cyw. nie.
- Grecy nie widzą Gaesatae mimo tech Brązownictwo.
- Harappa / Hetyci / … widzą swoją spec. po odblokowaniu tech.
- Build `/tmp/civ-dist` + bramka testów przed kanonem.

## NIE w scope tego handoffu

- Promocja `Gra-podglad.html` (Integrator F / MASTER na końcu).
- Modele 3D roster-6 (UNITS/MAPA).
- `ai-params` / archetypy roster-6 (CYW).
