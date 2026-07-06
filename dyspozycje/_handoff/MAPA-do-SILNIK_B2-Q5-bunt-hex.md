# MAPA → SILNIK: ikona buntu na heksie miasta (B2-Q5=C część 2)

**Status:** **→ SILNIK: GOTOWE** (lane MAPA · render `cities.ts` · 2026-07-01)  
**Data:** 2026-06-27 · **Przyjęto od Grupy B (Miasto):** 2026-07-01  
**Decyzja Macieja:** **B2-Q5=C**

---

## Co MAPA lane dostarcza

Rozszerzenie `CityRenderOptions` w `gra/src/render/cities.ts`:

```typescript
/** true gdy miasto miało bunt w bieżącej turze (lub do końca tury). */
getRevolt?: (cityId: string) => boolean;
```

**Render:** mała ikona 🔥 (sprite CSS2D / canvas label / prosty THREE.Sprite) nad modelem miasta, offset Y ~+1.2 nad `CITY_LIFT`.

- Widoczna tylko gdy `getRevolt(cityId) === true`
- Usuń / ukryj na początku następnej tury (SILNIK zeruje flagę)
- Nie koliduje z selekcją miasta ani oblężeniem

**Lane MAPA** implementuje overlay w `cities.ts` (sync tworzy/aktualizuje/usuwa sprite per city.id).

**Lane SILNIK** w `main.ts` przekazuje callback:

```typescript
cityRenderer.sync(cities, {
  ...existingOptions,
  getRevolt: (cityId) => cityOrderState.get(cityId)?.bunt === true,
});
```

---

## DoD

- [x] Ikona widoczna tylko przy `bunt===true` **lub** `revoltWarning===true` (callback SILNIK)
- [x] Nie psuje pozycjonowania modelu miasta (sprite dziecko grupy, offset Y +1.2)
- [x] sync() aktualizuje bez przebudowy całego modelu (`_syncRevolt` per sync)
- [ ] Test wizualny: 1 miasto z buntem vs miasto bez — **playtest Maciej / Integrator**

**Flaga lane MAPA:** **GOTOWE** · wpięcie callbacku = SILNIK (`getRevolt` w `_cityRenderOpts`)
