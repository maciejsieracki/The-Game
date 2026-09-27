STATUS: FAIL
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
ROLE: Final Control — bounded recovery round2 / provider-fallback
GOAL: Niezależny audyt wiring-u parametrów Oblężenia bez zmian produktu, danych, testów, commit/push/merge/deploy.

ZMIANY/COMMIT:
- Produkt pozostawiony bez zmian.
- Zapisano wyłącznie trzy artefakty tej bramki: ten raport, 03-evidence-recovery-20260923.json oraz 03-transition-receipt-recovery-20260923.md.
- `gra/data/civ-matrix.json`: 45/45 komórek zgodnych z INPUT; rzeczywisty diff względem origin/main dotyczy wyłącznie 20 komórek, bo część wartości 0.0 jest semantycznie równa wcześniejszemu 0.
- Brak commit/push/merge/deploy.

ZAKRES I METODA:
Przeczytano 00-dispatch.md, 01-operator.md, 01-evidence.json, 02-evaluator.md, 02-evidence.json, 03-dispatch-final-control.md oraz aktualny diff kodu. Niezależnie prześledzono produkcyjne call pathy w main.ts, battleScene.ts, city-defense.ts, siege.ts, siegeAi.ts i siegeMachines.ts. Poprzednie raporty traktowano jako wskazówki, nie jako dowód.

1. KALIBRACJA ±0.20 — WERDYKT: MATERIALLY MEANINGFUL

Actual downstream example from production formula:
- `gra/src/main.ts:27558-27613` (`effectiveDefenderM`) splits defender M into attack and defense, then applies the city structural percentage only to the defense component.
- The accepted `mur-paradoks-test.cjs:254-257` fixture uses the same production split and reports neutral walled M = 95.0; the decomposition is attack=26, defense=23, structural wall=200%.
- Neutral: `26 + 23 * (1 + 2.00) = 95.0`.
- Grecy have `obl_mur_proc=+0.20` and `obl_obrona_miasta_proc=+0.20` (`gra/data/civ-matrix.json:908-910`). The wired shared function computes `200 * 1.2 * 1.2 = 288%`; downstream M is `26 + 23 * (1 + 2.88) = 115.2`.
- Zulusi have `obl_mur_proc=-0.20` and `obl_obrona_miasta_proc=0`; downstream M is `26 + 23 * (1 + 1.60) = 85.8`.
- Grecy vs neutral is +21.26%; Grecy vs Zulusi is +34.27% on this real defender-M path. This is materially meaningful, though below the accepted Manpower precedent's 12000 vs 8000 = 50% relative spread for ±0.20 max-pool values. It is the same order of magnitude, not cosmetic.

2. PRODUCTION CONSUMERS AND THIRD PATH — BLOCKING OMISSION FOUND

Confirmed:
- `gra/src/game/city-defense.ts:81-103` is the shared percentage function used by both map auto-battle and interactive battle.
- Map path: `gra/src/main.ts:26784-26794` (`structureDefenseBonusFor`) calls `cityWallDefenseBonusPercent` with the city owner's civKey from `civKeyForOwnerId`.
- Interactive path: `gra/src/battle/battleScene.ts:2639-2645` calls the same function with `_defenderCivIconId`.
- Siege-machine damage has one live wall/gate path in `battleScene.ts`: `gra/src/battle/battleScene.ts:5886-5915` gates `_attackGate`/`_attackWallTile` on `isSiegeUnit(ru.bu) && ru.side === 'atk'`; the multiplier is applied at `7149-7175` and `7191-7194` through `_attackerCivIconId`.
- `siege.ts`/`siegeAi.ts` are NOT dead/reference-only modules. `gra/src/main.ts:14929-14962` calls `decideAISiegeStance` in the production AI siege loop, and `14966-14987` calls it again for ongoing sieges.

Blocking objection 1:
`gra/src/game/siegeAi.ts:103-124,209-218` computes the live AI's `defenderStrength` via `cityDefenseBonus` from `gra/src/game/siege.ts:399-439`. That function has no civKey or civ-matrix inputs and, by its own production comments/data contract (`siege.ts:387-391,413-418`), its wall flat values are zero; it therefore does not consume `obl_mur_proc` or `obl_obrona_miasta_proc`. The real map battle later uses `structureDefenseBonusFor`, but the earlier AI tier/stance decision does not.

Consequence: the production AI can classify the same walled city as assault/siege_build/starve using defender strength that ignores the newly wired civ-specific city-defense parameters. This is a genuine omitted live production consumer, not a test/reference module. Per the dispatch's explicit rule (“a real omitted production path is a blocking objection”), this requires a narrow Operator correction before integration.

3. SIDE SELECTION — WERDYKT: CORRECT FOR CURRENT ENGINE

- City wall/general defense uses defender ownership: map path uses `cityOnHex.ownerId` (`main.ts:26764-26769`), interactive path uses `_defenderCivIconId` assigned before the wall calculation (`battleScene.ts:2615-2644`).
- Siege-machine damage uses attacker ownership: all calls to `_attackGate`/`_attackWallTile` are reached only from the `ru.side === 'atk'` gate (`battleScene.ts:5886-5915`), and both damage methods use `_attackerCivIconId` (`7149-7175`, `7191-7194`).
- No defensive sortie/counterattack path was found. Defending siege units enter the dedicated hold branch (`battleScene.ts:5938-5952`): they shoot/attack only adjacent targets and never execute wall/gate-destruction methods. A defending city's siege machine therefore has no current engine scenario in which it should receive `obl_machines_proc` as defender-owned wall damage.

4. CIV-MATRIX DIFF VS MANPOWER — STRUCTURALLY MERGEABLE

Programmatic comparison against the shared base:
- Manpower commit `87ce2daf` changes 19 cells, only `mp_regen_proc`, `mp_max_proc`, `mp_koszt_jednostki_proc`.
- Current Oblężenie worktree changes 20 cells relative to origin/main, only `obl_obrona_miasta_proc`, `obl_mur_proc`, `obl_machines_proc`.
- Intersection of changed `(civKey, field)` paths: 0.
- `paramDefs=113`, `defaults=113`; no ordering/schema drift was found.

The JSON branches are structurally mergeable. No merge or conflict resolution was performed.

5. TESTS AND GATES

Product evidence:
- `node tools/civ-matrix-oblezenie-wiring-test.cjs` — exit 0; 75 pass, 0 fail.
- `node tools/city-defense-terrain-gate-test.cjs` — exit 0; 34 pass, 0 fail.
- `node tools/defense-breakdown-test.cjs` — exit 0; 44 pass, 0 fail.
- `node tools/fortify-pole-test.cjs` — exit 0; 41 pass, 0 fail.
- `node tools/mur-paradoks-test.cjs` — exit 0; 29 pass, 0 fail.
- `./node_modules/.bin/tsc --noEmit` from `gra/` — exit 0.
- Programmatic civ-matrix comparison against INPUT — exit 0; 0 mismatches across all 45 cells; only the three allowed Oblężenie fields changed relative to origin/main.
- `git diff --check` — exit 0.

Pre-existing failures preserved:
- `node tools/empire-panel-miasto-obywatele-content-test.cjs` from `gra/` — exit 1; 115 pass, 1 fail, same failure declared and independently confirmed by the Evaluator on clean origin/main.
- `node tools/koszty-surowcowe-test.cjs` from `gra/` — exit 1; 126 pass, 3 fail, same failures declared and independently confirmed by the Evaluator on clean origin/main.

Harness-only attempts (not product evidence):
- Initial root-level `npx tsc --noEmit` — exit 1 because the root has no local TypeScript compiler; corrected project-local invocation above passed.
- Initial root-level invocations of the two failing tests — exit 1 with MODULE_NOT_FOUND because tests live under `gra/tools`; corrected `gra/` invocations above produced the expected 115/1 and 126/3 results.

FINAL VERDICT: FAIL

Blocking objections:
1. Live AI siege stance path bypasses the civ-specific city-defense multiplier: `main.ts:14929-14962,14966-14987` → `siegeAi.ts:103-124,209-218` → `siege.ts:399-439`. Consequence: AI `defenderStrength`, tier and assault/siege decision ignore `obl_mur_proc` and `obl_obrona_miasta_proc`, while the actual battle path uses them. This is an omitted production consumer and blocks acceptance.

PRODUCT_ACCEPTANCE: false
NONBLOCKING NOTES:
- Shared city-defense parity and attacker/defender side selection are correct for the currently implemented battle paths.
- No defending-city siege-machine sortie/counterattack path exists today, so attacker-side machine ownership is correct for the live engine.
- The two unrelated existing test failures remain preserved and are not attributed to this topic.

NEXT PHASE: Return to the existing Operator topic for one narrow correction of the live siegeAi/siege.ts AI-strength path. Do not create another Final Control after this bounded recovery fails, per dispatch contract.
PUSH/MERGE/DEPLOY: NIE WYKONANO
