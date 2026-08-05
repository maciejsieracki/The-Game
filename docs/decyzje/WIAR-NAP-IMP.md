# WIAR-NAP-IMP — NAP terminowy lub bezterminowy

**Status:** ZAMKNIĘTE (wdrożenie 2026-08-05)  
**Źródło:** `dyspozycje/WIARYGODNOSC-SPECYFIKACJA.md` §9.1  
**ID rejestru:** WIAR-NAP-IMP

## Decyzja Macieja

Przy zawieraniu paktu o nieagresji gracz (i AI) może wybrać:

- **Wariant terminowy** — 10–20 tur (`wygasaTura = zawartaTura + turns`)
- **Wariant bezterminowy** — `wygasaTura: null` (jak sojusz)

## Implementacja

| Obszar | Plik | Mechanizm |
|--------|------|-----------|
| Kontrakt propozycji | `gra/src/game/diplomacy-proposals.ts` | `resolveNapDealExpiry(turn, payload)` — `turns > 0` → clamp 10–20; `turns <= 0` → null |
| UI audiencji | `gra/src/ui/diplomacyNegotiationModal.ts` | Akcja „2" (NAP): chipy 10/15/20 + „Bezterminowy"; input 0 |
| Stół audiencji (koszyk) | `gra/src/ui/diplomacyTradeBasket.ts` | Kafelek NAP (akcja „2"): chipy 10/15/20 + „Bezterminowy"; stepper min 0 |
| Tick dyplomacji | `gra/src/game/diplomacy.ts` | Istniejący filtr `wygasaTura === null \|\| wygasaTura > turn` — bez zmian |
| AI | `gra/src/game/ai.ts` | Przy Relacja ≥ progSojuszRelacja → `turns: 0` (bezterminowy), inaczej 15 tur |
| Podsumowanie stołu | `gra/src/main.ts` | `negotiationSummary` case `nap` |

## Testy

- `gra/tools/diplomacy-proposal-test.cjs` — §3b terminowy vs bezterminowy
- `gra/tools/wiarygodnosc-test.cjs` — §8d rozszerzenie NAP indefinite

## Zakres wyłączony

Wasalizacja / trybut W-gate — bez zmian (§9.10).
