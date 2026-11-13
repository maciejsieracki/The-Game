# Independent evaluator — R-WEB-VETERANS-TEST-DEBT-Q1

**Wynik: PASS**

Reviewed only section 10 of `gra/tools/weterani-test.cjs`, using the dispatch and operator receipt as the stated scope. The old fixed nominal expectation of 49 was stale: the current `gra/data/units.json` Konnica row has `fieldPower: 98`, and `armyFieldPower` returns that cached field power when applicable. `stackFieldPowerM` calls the production `sumRosterFieldM` with the supplied definition, and its raw Konnica result is 98. This matches the updated nominal checkpoint against `mRekrut`.

The updated design reference is appropriate. `R-MOC-TABLICZKA-VS-CIVPOWER-Q1` assigns full effective power to the map token badge and distinguishes civilization power. The pre-battle nominal behavior is also supported by the production consumers: `main.ts::preBattleUnitFromRuntime` and `battle/mapFieldBattle.ts::preBattleUnitFromRuntime` use `unitDefFor(u)` and `armyFieldPower(def)`. The `stackFieldPowerM` source comment explicitly limits its full-display injection to the map token and says pre-battle remains nominal.

Section 10 retains the substantive guards: nominal raw power equals the computed recruit baseline; the veteran result equals `expectedMWeteran`; veteran token power equals section 9 auto-power for the same roster; and veteran power is greater than nominal. Both source assertions remain present: `main.ts` must inject `combatPowerFullDisplayDefFor(u)` into `StackVitalsDeps.defOf`, and that function must exist. The expectation labels now use computed values without removing those comparisons or loosening their tolerances.

Independent run from `gra/`: `node tools/weterani-test.cjs` — **79 PASS, 0 FAIL**. It reported nominal Konnica 98 and veteran effective power 116.

**OBRONA POMINIĘTA:** none.
