# R-PIERWSZE-MIASTO — pierwszy osadnik przy 0 miast

**Status:** 🟢 **ZAMKNIĘTE**  
**Data:** 2026-07-27  
**Odpowiedź:** **B** — pełna blokada: tylko „Załóż miasto", bez ruchu i bez innych akcji osadnika

## Cytat Macieja

> R-PIERWSZE-MIASTO: **B** — pełna blokada: tylko „Załóż miasto", bez ruchu/innych akcji osadnika.  
> R-PIERWSZE-MIASTO-AI: **nie** (tylko gracz).

## Implikacja

- Gracz z **0 miast** i osadnikiem może wyłącznie założyć pierwsze miasto w oświetlonym kręgu startu.
- Zablokowane: marsz osadnika, inne akcje panelu jednostki, wybór ulepszeń zamiast miasta, wyjście z trybu bez założenia, koniec tury.
- **Bez parytetu AI** — dotyczy tylko `ownerId === 0`.

## Stan kodu (audyt 2026-07-27)

| Element | Stan | Dowód |
|---------|------|-------|
| `isAwaitingFirstPlayerCity()` | ✅ | `main.ts` ~5771 |
| Blokada `exitBuildMode` | ✅ | `main.ts` ~7306 |
| Blokada końca tury (`canEndTurn`, N) | ✅ | `main.ts` ~11975, ~16218 |
| Auto `foundCityMode` przy 🔨 | ✅ | `main.ts` ~12048 |
| Założenie tylko w kręgu startu | ✅ | `canFoundPlayerCityAt` ~5791 |
| **Blokada marszu osadnika** | ❌ | `planMarchTo` ~12758 — brak guarda |
| **Tylko „Załóż miasto" w panelu 🔨** | ❌ | `onSelectType` ~12062 gasi `foundCityMode` → ulepszenia dostępne |
| **Blokada innych akcji panelu jednostki** | ❌ | brak warunku `isAwaitingFirstPlayerCity` w akcjach osadnika |

**Werdykt kodu:** **CZĘŚCIOWO** — fundament (tura, exit, krąg) jest; brakuje twardej blokady ruchu i panelu.

## Co dalej

Wdrożenie na **`działaj`** (lane E / Integrator): guard w `planMarchTo`, filtrowanie `onSelectType` / panelu 🔨 i akcji osadnika gdy `isAwaitingFirstPlayerCity()`.
