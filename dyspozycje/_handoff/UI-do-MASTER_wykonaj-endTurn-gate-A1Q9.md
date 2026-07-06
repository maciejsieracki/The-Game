# Handoff UI → MASTER/SILNIK — A1-Q9 WYKONAJ + brama końca tury

**Status:** GOTOWE (spec) · **CZEKA** implementacja lane + wpięcie `main.ts`  
**Decyzja Macieja:** 2026-06-26 · **A1-Q9 = A** (+ rozszerzenie blocking)  
**Powiązane:** A1-Q8 = A (`sidePanelHud`), A1-Q10 (pozycja Koniec tury — osobno)

---

## Co przesyłam

### UI (`hud.ts`, `sidePanelHud.ts`, mockup D1B)

1. **Przycisk WYKONAJ** na `#bottom-bar`, **lewo od** „Koniec tury” (styl secondary / pomarańczowy akcent gdy aktywny).
2. Rozszerzenie typu:

```ts
export interface SidePanelEvent {
  id: string;
  icon: string;
  title: string;
  subtitle?: string;
  kind: SidePanelEventKind;
  /** true = gracz MUSI rozstrzygnąć przed końcem tury; ✕ ukryte */
  blocking?: boolean;
}
```

3. **WYKONAJ:** wywołuje `onExecutePending()` — domyślnie = `onEventClick(firstBlockingId)` lub otwarcie właściwego overlay (nauka, bitwa, miasto…).
4. **Stan przycisków:**
   - `blockingCount > 0` → WYKONAJ **enabled**, Koniec tury **disabled** (+ tooltip: „Rozstrzygnij wydarzenia po prawej”).
   - `blockingCount === 0` → WYKONAJ **disabled** (szary), Koniec tury **enabled**.
5. Chip **blocking:** bez krzyżyka ✕; chip informacyjny — ✕ OK (jak dziś).

### SILNIK (kontrakt do `HudConfig` w `main.ts`)

```ts
getEvents?: () => SidePanelEvent[];
onEventClick?: (id: string) => void;
onEventDismiss?: (id: string) => void; // tylko non-blocking
onExecutePending?: () => void;
canEndTurn?: () => boolean; // false gdy blocking > 0
```

- Kolejka decyzji tury: np. „wybierz tech”, „potwierdź bitwę”, „nowe miasto — nazwij”, „dyplomacja — odpowiedz”.
- Po rozstrzygnięciu: usuń z kolejki → odśwież HUD.
- **Brama:** `endTurn` (UI + skróty Enter/N) sprawdza `canEndTurn()`; opcjonalnie toast jeśli gracz klika disabled.

---

## Co Odbiorca ma z tym zrobić

| Odbiorca | Zadanie |
|----------|---------|
| **UI lane** | Mockup D1B: `#btn-wykonaj`; `sidePanelHud` blocking UX; `hud.ts` bottom bar + gate UI |
| **MASTER** | Wpięcie haków w `main.ts` przy batch D1B |
| **SILNIK** | `pendingTurnDecisions` + `canEndTurn` + populacja `getEvents()` |

---

## DoD

- [ ] WYKONAJ widoczny obok Koniec tury (mockup + `hud.ts`)
- [ ] Blocking chip bez ✕; informacyjny z ✕
- [ ] Koniec tury + Enter/N zablokowane gdy `blockingCount > 0`
- [ ] WYKONAJ otwiera / rozstrzyga pierwsze blocking wydarzenie
- [ ] Test ręczny: 2 blocking → rozstrzygnij 1 → nadal blocked → rozstrzygnij 2 → end turn OK

**Flaga:** GOTOWE (spec) / implementacja **CZEKA** batch D1B
