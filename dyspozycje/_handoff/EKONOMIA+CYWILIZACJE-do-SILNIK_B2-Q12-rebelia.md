# Handoff EKONOMIA + CYWILIZACJE → SILNIK — B2-Q12 rebelia

| Pole | Wartość |
|------|---------|
| **Status** | **GOTOWE** spec · **CZEKA** implementacja |
| **Decyzja** | **B2-Q12=C** |

## Silnik — co wpiąć

1. Po turze: `updateRevoltGrace(city)` — PorPct &lt; 10% → licznik 2→1→0
2. Grace wyczerpany + nadal &lt; 10% → `transferCityToRebels(cityId)`
3. Emit `RevoltWarningEvent` do `collectTurnEvents`
4. Save: `revoltGraceRemaining?: number`

## CYWILIZACJE

- `REBEL_FACTION_ID`, szary kolor miasta
- `ai.ts`: produkcja obronna rebeliantów
- Podbój → normalny transfer ownerId

## EKONOMIA (razem z Q12)

- `computeHappinessBreakdown` — bonus Luksus 30–70%
- `computeLawBreakdown` — garnizon → PrawPct do 100%

## DoD

- [ ] Test: grace 2 tury bez rebelii
- [ ] Test: PorPct recovery reset grace
- [ ] Test: T3 rebelia + odbicie
- [ ] Alert w event stream

## Flaga

**CZEKA** SILNIK batch (po lane EKONOMIA + CYWILIZACJE)
