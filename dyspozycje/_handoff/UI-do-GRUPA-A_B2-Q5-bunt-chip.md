# UI (Grupa B) → Grupa A: alert buntu — chip wydarzeń (B2-Q5=C część 1)

**Status:** GOTOWE (spec + render MAPA) · **chip** via `getEvents` w SILNIK · **CZEKA** klik→kamera (SILNIK)  
**Data:** 2026-06-27 · **Przekaz od Miasta (B):** 2026-07-01  
**Decyzja Macieja:** **B2-Q5=C** (chip wydarzeń **+** ikona na heksie — część 2 → MAPA)

---

## Kontekst

Gdy w turze wybuchnie bunt (migracja −1/+1), gracz widzi alert **poza** panelem miasta.

**Część C (ten handoff):** chip w panelu bocznym wydarzeń:

`🔥 Bunt: [nazwa miasta]`

Panel miasta (Grupa B) nadal pokazuje status w sekcji Porządek.

**Część C (MAPA):** `dyspozycje/_handoff/MAPA-do-SILNIK_B2-Q5-bunt-hex.md`

---

## Co Grupa A ma zrobić

1. W `sidePanelHud.ts` / `hud.ts` — obsłużyć wydarzenia buntu z `getEvents()`
2. Format chipu (istniejący `SidePanelEvent`):

```typescript
{
  id: `revolt-${cityId}`,
  icon: '🔥',
  title: `Bunt: ${cityName}`,
  subtitle: 'Migracja mieszkańców',
  kind: 'city',  // lub rozszerzyć SidePanelEventKind o 'revolt'
}
```

3. `onEventClick` → centrum kamery na `(q,r)` miasta (+ opcjonalnie otwarcie panelu miasta)
4. Chip widoczny **tylko** gdy `bunt===true` w bieżącej turze (nie tier=T2 — bunt to zdarzenie migracji)

---

## Kontrakt od SILNIKA (main.ts)

```typescript
getEvents?: () => SidePanelEvent[];
// SILNIK dokleja chipy buntu do listy wydarzeń tury z cityOrderState / revoltLog
```

Alternatywa: osobny hook `getRevoltEvents?: () => SidePanelEvent[]` — Grupa A scala w `hud.update()`.

---

## Zależności

- Batch B2-porzadek w SILNIKU (`EKONOMIA+UI-do-SILNIK_B2-porzadek-komplet.md`) — flaga `bunt` w `cityOrderState`
- Wpięcie `getEvents` w `configureHud` — SILNIK

---

## DoD

- [x] Chip tylko po faktycznym buncie tej tury (`bunt===true`) — `collectTurnEvents` w SILNIK
- [x] Chip grace (`revoltWarning`) — KRYTYCZNE w panelu wydarzeń
- [ ] Klik → **kamera na mieście** — dziś tylko hint; **SILNIK** `onEventClick` w `configureHud`
- [x] Nie duplikuje globalnego HUD zadowolenia (scope per miasto)
- [x] Mockup: `UI/Makieta-HUD-D1B-preview.html` (sekcja wydarzeń)

**Flaga lane MAPA (render 🔥):** **GOTOWE** · `gra/src/render/cities.ts`  
**Flaga chip:** częściowo — wyświetlanie ✅ · klik→kamera ⏳ SILNIK
