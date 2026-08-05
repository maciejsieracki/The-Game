# R-PIERWSZE-MIASTO — pierwszy osadnik przy 0 miast

**Status:** 🟢 **WDROŻONE**  
**Data decyzji:** 2026-07-27  
**Wdrożenie kodu:** 2026-08-05 (branch `cursor/pierwsze-miasto-63a1`)  
**Odpowiedź:** **B** — pełna blokada: tylko „Załóż miasto", bez ruchu i bez innych akcji osadnika

## Cytat Macieja

> R-PIERWSZE-MIASTO: **B** — pełna blokada: tylko „Załóż miasto", bez ruchu/innych akcji osadnika.  
> R-PIERWSZE-MIASTO-AI: **nie** (tylko gracz).

## Implikacja

- Gracz z **0 miast** i osadnikiem może wyłącznie założyć pierwsze miasto w oświetlonym kręgu startu.
- Zablokowane: marsz osadnika, inne akcje panelu jednostki, wybór ulepszeń/cudów zamiast miasta, wyjście z trybu bez założenia, koniec tury.
- **Bez parytetu AI** — dotyczy tylko `ownerId === 0`.

## Stan kodu (audyt 2026-08-05)

| Element | Stan | Dowód |
|---------|------|-------|
| `isAwaitingFirstPlayerCity()` | ✅ | `gra/src/game/first-player-city.ts` · `main.ts` |
| Blokada `exitBuildMode` | ✅ | `main.ts` `exitBuildMode` |
| Blokada końca tury (`canEndTurn`, N) | ✅ | `main.ts` `canPlayerInitiateEndTurn` |
| Auto `foundCityMode` przy 🔨 | ✅ | `main.ts` `onOpenBuild` |
| Założenie tylko w kręgu startu | ✅ | `validateFirstPlayerCityPlacement` · `canFoundPlayerCityAt` |
| **Blokada marszu osadnika** | ✅ | `planMarchTo` · `beginMoveSelectedUnitTo` · `executeMarchSegment*` |
| **Tylko „Załóż miasto" w panelu 🔨** | ✅ | `buildModeHud.ts` `isFoundCityOnly` · `onSelectType`/`onSelectWonder` guard |
| **Blokada innych akcji panelu jednostki** | ✅ | `buildArmyStackHudState` → `actions: []` · `handleSelectedUnitHudAction` early return · `canMerge`/`canSplit` false |

**Werdykt kodu:** **WDROŻONE** — fundament + twarde blokady ruchu i panelu.

## Testy

- `node gra/tools/first-player-city-test.cjs` — logika pure (`first-player-city.ts`)
- `npx tsc --noEmit` — 0 błędów

## Pliki

| Plik | Rola |
|------|------|
| `gra/src/game/first-player-city.ts` | Pure helpers (awaiting, krąg startu, walidacja) |
| `gra/src/main.ts` | Guardy UI/ruch/tura |
| `gra/src/ui/buildModeHud.ts` | Panel 🔨 — tylko „Załóż miasto" gdy `isFoundCityOnly` |
