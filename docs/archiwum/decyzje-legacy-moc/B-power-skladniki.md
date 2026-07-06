# B — Power: składniki miasto/ekonomia (Grupa B)

| Pole | Wartość |
|------|---------|
| **ID** | B-Power |
| **Decyzja Macieja** | **B-Power-Q1=A**, **B-Power-Q2=B**, **B-Power-Q3=A** (2026-06-27) |
| **Routing** | A1-Q15=A — wyliczanie → Grupa B; wyświetlenie → Grupa A |
| **Status** | **ZAMKNIĘTE** (spec) · implementacja → EKONOMIA lane + handoff SILNIK |

---

## Składniki lane B (wagi kanon — `diplomacy.json`)

| Klucz | Waga | Decyzja Macieja |
|-------|------|-----------------|
| `ludnosc` | 18% | **A** — `sumPop / maxPopNaMapie`, clamp 0–1 |
| `miasta` | 14% | **B** — mix 50% liczba miast + 50% heksy terytorium (vs max na mapie) |
| `gospodarka` | 12% | **A** — średni dochód **Pieniądz/t** (N ostatnich tur), znorm. vs max na mapie |

Pozostałe składniki (UNITS / SILNIK): `wielkoscArmii` 28%, `wygraneBitwy` 20%, `epoka` 8%.

---

## Wzory (propozycja implementacji)

```ts
ludnosc    = clamp( sumPop(owner) / max(sumPop(all), 1), 0, 1 )
miasta     = 0.5 * clamp( cityCount / max(cityCount(all), 1), 0, 1 )
           + 0.5 * clamp( hexCount / max(hexCount(all), 1), 0, 1 )
gospodarka = clamp( avgPieniadzPerTurn(owner, N=5) / max(avg(...all), 1), 0, 1 )
```

SILNIK scala z UNITS + epoka → `computePotegaNacji()` → HUD (Grupa A) + `computeRespekt()` (Grupa D).

---

## Kontrakt API (lane EKONOMIA)

```ts
export interface PowerContributionsCityEconomy {
  ludnosc: number;
  miasta: number;
  gospodarka: number;
}

export function computePowerContributionsCityEconomy(ctx: /* minimalny stan imperium */): PowerContributionsCityEconomy;
```

Handoff: `dyspozycje/_handoff/EKONOMIA-do-SILNIK_power-skladniki.md` (TODO).

---

## Overlay HUD (Grupa A — tylko wyświetlenie)

- Nazwy PL jak mockup [A′]
- Wartości **znormalizowane 0–1** × waga → pasek w overlay
- Przeliczenie: **co turę** (po `advanceTurnEconomy`)

---

*Źródło: Maciej, formularz ABC Grupa B, 2026-06-27*
