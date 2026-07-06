# Handoff EKONOMIA → UI — Szczęście procentowe (1C)

| Pole | Wartość |
|------|---------|
| **Status** | **GOTOWE** spec · **CZEKA** implementacja lane |
| **Decyzja** | Maciej **1C** 2026-06-27 |
| **Spec** | `docs/decyzje/B2-model-szczescie-procent.md`, `B2-szczescie-progi-efektow.md` |

## Co EKONOMIA dostarcza

```typescript
interface HappinessLine {
  id: string;       // klucz JSON np. szczescie_kara_wojna
  label: string;    // PL do panelu
  value: number;    // + lub -
}

interface HappinessBreakdown {
  lines: HappinessLine[];
  plusy: number;
  minusy: number;
  netto: number;
  szMax: number;
  szPct: number;    // 0..120
  tier: 'euphoria' | 'calm' | 'mild_unrest' | 'unrest' | 'revolt' | 'total_revolt';
  orderEffects: OrderEffects;  // mnożniki z tier → istniejący order.ts
}
```

Funkcja: `computeHappinessBreakdown(city, ctx, societyParams)`.

## Co UI robi

- Sekcja **Szczęście** — rozpiska jak Zdrowie + wiersz `Netto / SzMax → SzPct%`
- **Mieszkańcy:** emotikony **z progów %** (tabela w progi doc), nie licznik głów
- **Porządek:** tier + skrót kar z `orderEffects`

## Co SILNIK wpina

- `getHappinessBreakdown(cityId)` w `configureCityPanel`
- Tick: `orderMultByCity` bierze tier z **SzPct**, nie ze starego 4-składnikowego netto

## Blokery

- Maciej **B2-Q12** (PorPct 0–9% — bunt skrajny)

## DoD

- [ ] Klucze `szmax_*` w society-params.json
- [ ] `computeHappinessBreakdown` + testy progów
- [ ] UI sekcja + sync koszyki wizualne
- [ ] Excel progi zsynchronizowane
