# EKONOMIA → MASTER: D16-D17-START — GOTOWE

| Pole | Wartość |
|------|---------|
| **Status** | 🟢 **GOTOWE** |
| **Batch** | `D16-D17-START` |
| **Decyzja Macieja** | **2026-07-01 · D16-A + D17-A** |
| **Warstwa** | 🟢 lane B — bez `main.ts` |

---

## Co przesyłam

### D16-A — łagodny start (Porządek / Szczęście / Wealth)

| AC | Implementacja |
|----|----------------|
| Bonus osady Prawo | `society-breakdown.ts` · `prawo_bonus_osada` (+4 normal) · `LawBreakdownInput.population` |
| Religia bez świątyni | `culture-religion.ts` · `religionHappiness(..., hasSwiatynia=false)` → 0 zamiast kara |
| Wealth W=0 neutral | `econ-params.json` · `wealth_kara_zero: 0` (normal) |
| Immunitet 5 tur W | `wealth.ts` · `advanceWealth(..., { minPoziom: 1 })` · `cities.ts` · `wealthImmunityRemaining: 5` · `turn-economy.ts` tick |

### D17-A — woda / rzeka

| AC | Implementacja |
|----|----------------|
| `cityHasWaterAccess(city, map)` | `turn-economy.ts` (eksport) |
| Health z mapy | `computeCityHealth` + `computeCityHealthBreakdown` · opcjonalny `{ city, map }` |
| UI panel | `cityPanel.ts` — przekazuje `{ city, map }` do breakdown |

---

## Testy (zielone)

```
society-breakdown-test.cjs   21/21
wire-ekonomia-test.cjs       34/34
wealth-test.cjs              28/28
logic-test.cjs               religion PASS (hasSwiatynia=true w teście kara)
```

---

## Uwaga kalibracji

- `prawo_bonus_osada` **normal = 4** (nie 3) — wymagane dla DoD PorPct ≥ 20% przy wagach 0,5/0,5 i pop=1.
- Handoff Integrator: `EKONOMIA-do-INTEGRATOR_d16-main-wiring.md` — **2 linie w `main.ts`** (population w lawInput; hasSwiatynia w religionHappiness; opcjonalnie waterCtx w getCityHealth).

---

## DoD

- ✅ pop=1 PorPct ≥ 20%, brak bandy „Bunt skrajny”
- ✅ W=0 → zadowolenie 0 (nie −2)
- ✅ immunitet: poziom W nie spada przy niskim luksusie T1–T5
- ✅ miasto sąsiad rzeki: bonus Rzeka, brak „Brak wody”
- ✅ pustynia bez wody: kara „Brak wody”

**NIE** publikować ROBOCZA — Integrator F po ACK Master.
