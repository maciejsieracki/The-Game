# Handoff EKONOMIA → UI — Porządek procentowy (3)

| Pole | Wartość |
|------|---------|
| **Status** | **GOTOWE** spec · **CZEKA** implementacja |
| **Decyzje** | **1C**, **2A**, **3** (Porządek = SzPct + PrawPct) |
| **Spec** | `B2-porzadek-model.md`, `B2-porzadek-progi-efektow.md` |

## API (EKONOMIA)

```typescript
interface LawLine { id: string; label: string; value: number; }

interface LawBreakdown {
  lines: LawLine[];
  netto: number;
  prawMax: number;
  prawPct: number;
}

interface OrderBreakdown {
  sz: HappinessBreakdown;   // 1C+2A
  prawo: LawBreakdown;
  wagaSz: number;           // 0.5 default
  wagaPraw: number;
  porPct: number;
  tier: OrderTier;
  effects: OrderEffects;
}
```

`computeOrderBreakdown(city, ctx)` — jeden entry point dla panelu.

## UI

- Sekcje: **Szczęście** | **Prawo** | **Porządek** (lewa kolumna, B2-Q2=B)
- Porządek: pasek %, tier, wzór „50%×72 + 50%×60 = 66%”, lista aktywnych kar

## SILNIK

- `getOrderState(cityId)` → `OrderBreakdown`
- `orderMultByCity` z `effects` z PorPct tier

## DoD

- [ ] JSON: `szmax_*`, `prawo_max_*`, `prawo_*` składniki
- [ ] `computeLawBreakdown` + testy
- [ ] Integracja garnizonu (UNITS: jednostki w mieście)
- [ ] UI trzy sekcje + sync `orderPanel.ts`
- [ ] Progi PorPct w JSON + testy tier

## Blokery

- **B2-Q12** (PorPct 0–9%)
- Pytania **4–11** (okolica, B5, …) — osobno
