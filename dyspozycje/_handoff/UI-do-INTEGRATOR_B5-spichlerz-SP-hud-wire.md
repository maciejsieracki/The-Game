# UI → INTEGRATOR: B5-SP HUD wire (informacyjny)

| Pole | Wartość |
|------|---------|
| **Status** | ✅ **JUŻ WPIĘTE** — weryfikacja przy batch F |
| **Batch** | `B5-SP-HUD` |
| **Decyzja** | SP4=C · SP6-HUD=B |

---

## Kontrakt HudState (mapa)

```typescript
// gra/src/ui/hud.ts — HudState
zywnoscLabel: string;   // bieżące zapasy (floor)
zywnoscMax?: number;    // 100 × Spichlerze; 0 = brak magazynu
zywnoscRate?: number;   // netto /t (doPanstwa − kosztArmii)
glodWojska?: boolean;   // czerwony styl gdy true
```

## Wpięcie w silniku (sprawdź przy publish)

`main.ts` ~3570–3581 — `buildHudState` / `getState`:

```typescript
const foodMaxCap = getEmpireFoodMaxCap(0);
return {
  zywnoscLabel: String(foodReserve),
  zywnoscMax: foodMaxCap,
  zywnoscRate: foodNetRate,
  glodWojska: isArmyStarving(0),
  // ...
};
```

Import: `getEmpireFoodMaxCap` z `empire-food.ts`.

---

## UI lane (bez main.ts)

| Plik | Zmiana |
|------|--------|
| `gra/src/ui/hud.ts` | `formatFoodHudLabel` → `{zapasy} / {max}`; fallback `—` + tooltip przy max=0 |
| `gra/src/ui/cityPanel.ts` | SP4: brak chipa/wiersza zapasów w zakładce Spichlerz; pasek miasta = netto lokalne |

---

## DoD Integratora

- [ ] Po merge batch B+UI: smoke mapy — żywność HUD `X / Y` ze Spichlerzem
- [ ] Bez Spichlerza: HUD `—` + tooltip „Zbuduj Spichlerz"
- [ ] Panel miasta: brak globalnych zapasów na pasku zasobów

**Nie wymaga nowego patcha main.ts** jeśli obecny kod ~3573 bez zmian.
