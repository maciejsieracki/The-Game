# R-RABAT-SOL-GARNIZON-Q1 — podwójny rabat utrzymania garnizonu przy Soli

**Status:** 🟢 **ZAMKNIĘTA** · **A** (2026-08-06) — potwierdzenie istniejącego zachowania, ZERO zmian w kodzie.

## Sytuacja

Dwa niezależne mechanizmy rabatu utrzymania współistniały bez jawnej decyzji o ich łączeniu:
mnożnik `camping` (`gra/src/game/turn-economy.ts:1302`) i `isGarrisonInSolCity`
(`gra/src/game/economy-upkeep.ts:939-969`). Znalezisko audytu 2026-08-06.

## ECHO

| ID | Odpowiedź | Skutek |
|----|-----------|--------|
| **R-RABAT-SOL-GARNIZON-Q1** | **A** | Rabaty SUMUJĄ SIĘ (działają niezależnie) — to jest ZAMIERZONE zachowanie, nie bug. Kod pozostaje bez zmian. |

## Wdrożenie

Brak — decyzja potwierdza status quo. Zapisane, żeby przyszły audyt nie zgłaszał tego ponownie jako
niejednoznaczność.
