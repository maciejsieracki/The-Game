# B — asymetria kosztów wg trudności (2026-07-07)

**Status:** WDROŻONE  
**Decydent:** Maciej  
**Warstwa:** 🟡 cross (tempo kreatora + trudność + produkcja + badania + wzrost ludności)

## Decyzja

Asymetria kosztów **budynków (Praca)**, **jednostek (złoto)** i **badań (nauka)** oraz progu **wzrostu ludności (żywność w buforze)** działa **obok** tempa z kreatora. Baza = wybory gracza w kreatorze mapy.

### Koszty (budynki / jednostki / badania)

| Trudność | Gracz (ownerId 0) | AI + państwa miast (ownerId > 0) |
|----------|-------------------|-----------------------------------|
| **Łatwa** | ×1 (standard) | ×2 względem gracza |
| **Normalna** | ×1 | ×1 (symetria) |
| **Trudna** | ×2 | ×1 (standard) |

### Wzrost ludności — próg żywności do +1 populacji

Tempo kreatora **Wzrost ludności**: Wysoki ×1, Normalny ×2, Wolny ×4 (więcej żywności = wolniejszy wzrost). Na to nakłada się trudność:

| Trudność | Gracz | AI + państwa miast |
|----------|-------|---------------------|
| **Łatwa** | tempo kreatora | **×2 więcej żywności** niż gracz |
| **Normalna** | tempo kreatora | to samo co gracz |
| **Trudna** | **×2 więcej żywności** | **×0,5 progu** (dwa razy mniej żywności — „tańszy” wzrost) |

Cap Akweduktu **5 / 15** bez zmian — dotyczy tylko progu bufora, nie limitu populacji.

## Implementacja

- `gra/src/game/difficulty-cost.ts` — koszty + `getPopulationGrowthThresholdMultiplier`, `applyPopulationGrowthThreshold`
- `gra/src/game/population-growth-tempo.ts` — tempo kreatora Wysoki/Normalny/Wolny
- `gra/src/game/economy.ts` — `populationGrowth(..., wzrostThresholdMult)`
- `gra/src/game/turn-economy.ts` — per-owner mnoznik w `advanceCityEconomy`
- `gra/src/game/playerState.ts` — `wzrostLudnosciPace`
- `gra/src/ui/newGameFlow.ts` — opcja kreatora „Wzrost ludności”
- `gra/src/ui/cityPanel.ts` — wyświetlany próg z asymetrią
- `gra/src/main.ts` — tick ekonomii, save/load

## Przykłady

### Budynki (baza = 10 Pracy w JSON)

| Kreator | Trudność | Gracz | AI / miasto-państwo |
|---------|----------|-------|---------------------|
| Niski (×1) | Łatwa | 10 | 20 |
| Normalny (×2) | Łatwa | **20** | **40** |
| Wysoki (×4) | Trudna | 80 | 40 |

### Wzrost (pop 3, wsp. 8 → baza 34)

| Tempo | Trudność | Gracz (efektywny mnożnik) | AI (efektywny mnożnik) | Próg gracza | Próg AI |
|-------|----------|---------------------------|------------------------|-------------|---------|
| Normalny (×2) | Trudna | ×4 | ×1 | 136 | 34 |
| Normalny (×2) | Łatwa | ×2 | ×4 | 68 | 136 |
| Wysoki (×1) | Normalna | ×1 | ×1 | 34 | 34 |

## Testy

```bash
cd gra
node tools/difficulty-cost-test.cjs
node tools/population-growth-tempo-test.cjs
node tools/akwedukt-popcap-test.cjs
```

## Zasady

- **Nie** zmienia definicji tempa (niski/normalny/wysoki, szybka/standardowa/długa, wysoki/normalny/wolny wzrost).
- Państwa miast liczą się po stronie AI (ownerId > 0), nie gracza.
