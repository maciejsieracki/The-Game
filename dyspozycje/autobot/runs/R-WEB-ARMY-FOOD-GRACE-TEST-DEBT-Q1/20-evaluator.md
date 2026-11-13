# Independent evaluator

STATUS: PASS — OBRONA POMINIĘTA (brak osobnego raportu obrony w tym runie)

## Scope and verification

Reviewed `00-dispatch.md`, `10-operator.md`, the focused test diff, and the read-only runtime and decision sources. Re-ran the focused test from `gra/`:

```text
node tools/glod-wojska-karencja-test.cjs
 glod-wojska-karencja-test: 40 pass, 0 fail
```

The only tracked source diff in this run's allowlisted test is `gra/tools/glod-wojska-karencja-test.cjs`; the production food helpers and data remain unchanged. The run directory contains the operator and evaluator records.

## Independent findings

- **Clamped reserve and hunger are both checked.** `advanceEmpireFood` subtracts army cost, computes `glodWojska` from the resulting pre-clamp balance (`central < 0`), then stores `Math.max(0, central)`. The revised first-turn case asserts `zapasyPo === 0` and `glodWojska === true`, as well as the consecutive-deficit counter. This matches the actual order and preserves negative-boundary coverage without expecting a persisted negative reserve.
- **Recovery case creates a genuine new deficit.** The recovery tick begins with the clamped reserve at 0, adds its `zywnoscNetto: 1` local balance, and has no army, leaving a positive reserve and resetting the counter. The following tick has no production and 20 own-territory units. `unitFoodPerTurn` multiplies the base 1 by own-territory 1 and the deployed FALA1×FALA2 multiplier 4, so the army consumes 80; starting from reserve 1 this is a new deficit. The test asserts counter restart at 1 and attrition remains off on that new first deficit turn.
- **Upkeep expectations have evidence for ×4.** `economy-upkeep.ts` imports `R_STAWKI_FALA1_FALA2_MULT` and applies it to unit food after camp and territory multipliers. `r-stawki-strojenie.ts` defines it as 2×2. The deployed record is explicit in `REJESTR-PROSB-I-ZADAN.md` under `R-NADMIAR-POOLS` and `WERSJE.md` FALA 215: upkeep and military food ×4. Thus updated expectations (march own 4, outside 8; camp own 2, outside 4) reflect code and approved deployed decisions, not a balance guess.
- **Baseline comparison / assertion strength.** The operator reports baseline 29/39 with 10 failures. The checked-in edit changes the obsolete `-20` reserve expectation to the zero clamp and adds a separate hunger assertion; changes the recovery surplus from 140 to 1 so the next 80-food army cost actually returns the state to deficit; and updates the eight outdated upkeep literals to the deployed ×4 rate while retaining the x1/x2 territory and x0.5 camp factors. Existing cadence, reset, countdown, HP, AI-parity, config and mixed-stack coverage remains present. The test now has 40 assertions and all pass; I found no skip, reduced boundary condition, production edit, or gameplay/data change in this scope.

## Result

PASS. No blocking issue found for this test-only repair.
