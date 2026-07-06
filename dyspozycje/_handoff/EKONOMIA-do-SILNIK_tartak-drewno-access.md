# EKONOMIA → SILNIK — Tartak → dostęp Drewno w panelu (micro-batch)

| Pole | Wartość |
|------|---------|
| **Status** | **✅ WPIETE 2026-06-28** |
| **Batch ID** | `F-B-TARTAK-DREWNO` |
| **Priorytet** | P0 (1 linia + rebuild ROBOCZA) |
| **Decyzja Maciej** | 2026-06-27 — tartak = **+3 Pracy** + **dostęp boolean Drewno** (v0.1 bez ilości) |
| **Lane** | `resource-access.ts` — **GOTOWE** (3. argument `placedImprovements`) |

---

## Problem

Po F-B-PILNE + F-B-WYRAB-TARTAK hook `getResourceAccess` w `main.ts` **nie przekazuje** mapy ulepszeń → panel Surowce **nie pokazuje „Drewno”** po postawieniu tartaku na mapie.

---

## Fix (jedna zmiana)

W `extraCityPanelConfig()` → `getResourceAccess`:

**Było:**
```typescript
return getResourceAccessForCity(cityDto, map);
```

**Ma być:**
```typescript
return getResourceAccessForCity(cityDto, map, placedImprovements);
```

`placedImprovements` jest w scope `boot()` obok `applyBuildRequest` (Map hexKey → improvement key).

---

## DoD

- [ ] Postaw tartak w zasięgu miasta → panel miasta → sekcja **Surowce** zawiera **„Drewno”**
- [ ] Wyrąb **nie** dodaje Drewna (brak `surowiecOdblokowany` na wyrębie)
- [ ] `node tools/grupa-b-lane-test.cjs` PASS (27+)
- [ ] smoke OK → publish ROBOCZA

**Melduj:** `→ MASTER: GOTOWE-ROBOCZA F-B-TARTAK-DREWNO`

---

## Flaga

**→ SILNIK: GOTOWE**
