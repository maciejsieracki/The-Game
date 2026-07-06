# EKONOMIA → INTEGRATOR F: D18 — wpięcie main.ts + cityPanel

| Pole | Wartość |
|------|---------|
| **Status** | 🟡 **CZEKA** (lane B już wpisał — F: verify + ROBOCZA) |
| **Warstwa** | 🟡 cross (main.ts, cityPanel hooks) |
| **Batch** | D18-BALANS-TRUDNOSC |

---

## Co lane B zmienił w silniku (poza zakresem „tylko JSON”)

### `gra/src/main.ts`

1. Import: `loadRevoltParams`, `stolicaEasyBonusActive`, `loadWealthParams`
2. `seedWealthImmunityAtFounding(c)` — immunitet z JSON per difficulty (10/5/3)
3. `finalizeCityFounding` — wywołuje `seedWealthImmunityAtFounding`
4. Pętla tury — `evaluateOrderFromBreakdown`:
   - `stolicaEasyBonus` (easy, pierwsze miasto, turn≤10)
   - `lawInput.population` (fix osady w silniku)
   - `updateRevoltGrace(..., revoltParams)` z JSON
5. `configureCityPanel`: `getTurn: () => turn`

### `gra/src/ui/cityPanel.ts`

- `getTurn` w config · `stolicaEasyBonusActive` w `computeOrderStateLocal`

---

## DoD Integratora

- [ ] Diff review — brak kolizji z innymi batchami F
- [ ] `npx vite build --outDir $env:TEMP\civ-dist` + bramka testów
- [ ] Promocja **ROBOCZA** po ACK Master + playtest Macieja
- [ ] md5 w `DZIENNIK-MASTERA.md`

**NIE** wymaga nowych linii poza tym diffem — moduły B gotowe.
