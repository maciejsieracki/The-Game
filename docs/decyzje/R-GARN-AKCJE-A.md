# R-GARN-AKCJE-A — garnizon na liście armii + auto-wyjście przy ruchu

**Decyzja:** C-GARN-Q1 = A + rozszerzenie właściciela (2026-07-26)  
**Status:** WDROŻONE (kod, branch `cursor/garn-akcje-a-63a1`)

## Zachowanie

1. **Lista armii (lewy HUD ⚔)** — jednostki w garnizonie (`inGarnizon`), ufortyfikowane w polu (`ufortyfikowanyWPolu`) i uśpione (`sentry`) są widoczne i zaznaczalne; badge: „w garnizonie” / „ufortyfikowana w polu” / „uśpiona”.
2. **Rozkaz ruchu** (klik na mapę, marsz) — `wakeStackForMoveOrder()` w `startAnimatedMove`: odfortyfikowanie garnizonu, zdjęcie fortyfikacji w polu, obudzenie sentry; synchronizacja `city.garnizon`.
3. **Planowanie ruchu** — `planningStackRuchLeft()` symuluje pul ze `fortifyRuchSnapshot` dopóki jednostka jest w trybie ufortyfikowania (reachable + pasek ruchu na liście). `visibleStackOnHex` **bez zmian** (merge/blokady).
4. **Panel miasta** — akcja „Odfortyfikuj” / `onLeaveGarrison` (FALA 212); bez duplikatu.

## Pliki

| Plik | Rola |
|------|------|
| `gra/src/game/armyMerge.ts` | `planningStackRuchLeft`, `wakeStackForMoveOrder`, `activeUnitStack` |
| `gra/src/ui/armyListHud.ts` | badge + tooltip |
| `gra/src/main.ts` | `buildPlayerArmyListEntries`, `stackCanMove`, marsz |
| `gra/tools/garnizon-exit-test.cjs` | test regresji |

## Bramka

```bash
cd gra && npx tsc --noEmit && node tools/garnizon-exit-test.cjs
```
