# PYTANIE-77-DOP — Mennica po zerwaniu szlaku ze złotem

**Status:** 🟢 **ZAMKNIĘTE**  
**Data:** 2026-07-27  
**Odpowiedź:** **B** — Mennica śpi **1 turę** po utracie dostępu do złota (szlak zerwany)

## Cytat Macieja

> PYTANIE-77-DOP: **B** — Mennica śpi 1 turę po utracie dostępu do złota (szlak zerwany).

## Implikacja

- Po utracie dostępu do złota (brak kopalni + brak aktywnego szlaku z grantem `zloto`) **istniejąca Mennica** nadal stoi, ale mnożnik Waluta+Mennica **nie działa przez 1 turę** (łaska).
- Od **2. tury** bez dostępu — pełne uśpienie efektu (jak dziś przy PYTANIE 83=B).
- Dotyczy wszystkich ownerów (parytet gracz + AI).

## Stan kodu (audyt 2026-07-27)

| Element | Stan | Dowód |
|---------|------|-------|
| Mennica śpi **natychmiast** bez złota | ✅ (83=B) | `ownerHasZlotoAccessNow` → `maMennicaEmpireWide` w `turn-economy.ts` ~1213 |
| Brak licznika „1 tura łaski" | ❌ | brak stanu per owner po utracie szlaku |
| UI „Mennica śpi — brak złota" | ✅ | `cityPanel.ts` ~8602 (natychmiastowe) |

**Werdykt kodu:** **ROZBIEŻNOŚĆ** — kod realizuje **PYTANIE 83=B** (natychmiast), nie **77-DOP=B** (1 tura opóźnienia).

## Co dalej

Wdrożenie na **`działaj`** (lane B): stan `mennicaZlotoGraceTurnsLeft` per owner; przy zerwaniu szlaku = 1; resolver `resolveOwnerZlotoAccess` uwzględnia łaskę; save/load.
