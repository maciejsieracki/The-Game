# Evaluator — siege engines built only during siege

STATUS: FAIL
DOMAIN: GAME
TEMAT: R-WEB-SIEGE-ENGINES-BUILT-ONLY-DURING-SIEGE-Q1
GOAL: Build researched siege engines only for the active besieging army, during a wartime siege, with the card money/resource cost and the per-turn quota; retain already-built legacy machines in saves.
ZMIANY/COMMIT: No source changes. Evaluated candidate `6218f2ab1` plus operator report commit `67be61f5a`; report only.
TESTY: Focused test `node tools/siege-engines-built-during-siege-test.cjs`: 24 passed, 0 failed. `npm run typecheck -- --pretty false`: passed. `git diff --check cb17ba921..HEAD`: passed. Independently ran the legacy queue helper repro and actual `serializeGame()`/`deserializeGame()` round-trip (results below). Operator's reported Chromium HTTP run: blockade/no-recruit 57/57; I did not claim a browser slot. Operator reports the 48/2 city-wall suite failures reproduce on base `cb17ba921`.
BLOKADY: A pending legacy workshop queue still produces free ready machines during an active siege. This violates the confirmed paid-build rule and requires a same-ID operator correction.
RUNDY: 1/5
NASTĘPNY KROK: Operator should close the pending-queue path and add the two save scenarios below, then rerun the focused and relevant siege regression gates.
DEPLOY/PUSH: NIE WYKONANO

## Material defect — legacy pending queue still builds for free

`gra/src/main.ts:18051-18057` keeps `tickSiegeMachinesForCity()` active whenever `city.oblegane` is true and advances `city.siegeMachines.queue` without consulting the new paid-build API, research, money, stock, or the new quota. The function is still called in the turn flow at `gra/src/main.ts:38157`. `gra/src/game/siegeMachines.ts:41-54` turns queued `taran`/`wieza` entries into `ready`; `appendReadyMachinesToRoster()` then puts these machines into the siege battle roster at `gra/src/main.ts:18066-18089`. The new panel removes the enqueue controls, but that only prevents new legacy entries through the current UI; it does not neutralize pending entries already present in saves.

Reproduction on the candidate: deserialize or otherwise load a city with `{ oblegane: true, siegeMachines: { queue: ['taran'], ready: [], buildProgress: 0 } }`, with one adjacent besieger. At the next siege tick, the existing `advanceSiegeMachineBuild(city, 1)` call returns `1` and changes state to `{ queue: [], ready: ['taran'], buildProgress: 0 }`. I ran the helper directly and observed exactly that result. The machine can then enter the battle roster for free, even if the owner has no money/resource or the required technology and even when the new build quota has been spent.

Required closure: preserve already-ready/built legacy machines and legacy runtime siege units through save/load, but do not automatically finish a pending old workshop queue for free. Keep the queue inert or clear only its unpaid pending entries on load; all newly built machines must go through the paid, tech-gated, quota-gated API. Add separate regression scenarios: (1) saved pending queue does not advance into `ready` or yield a battle machine after load/active siege; (2) saved `ready` machine and legacy runtime engine survive actual serialization/deserialization and remain usable through the existing flow. No product decision is needed; this matches the confirmed rule that existing built machines remain while new builds require payment.

## Independent checks

- Re-ran the focused suite and typecheck successfully. The focus test covers the quota at 9/10/19/50/100/250, existing engine exclusion, same-turn counter reset/persistence, siege/war/tech/funds/resource gates, city/replacement catalogue filtering, and the shared AI/human policy.
- Inspected actual cost wiring in `main.ts`: the paid option gets money from `unitProductionItem()` and raw resource cost from `unitStockCost()`, then checks owner treasury/stock before deducting from that same owner's cities. Using the repository helpers with unmodified unit-card costs gave Taran `7¤ + 19 drewno`, Taran okuty `18¤ + 76 braz`, Wieża oblężnicza `20¤ + 76 braz`, and Katapulta `36¤ + 152 zelazo` after the existing epoch multipliers. Mixed-owner stock check confirmed owner 0's `1 drewno` was not counted toward owner 1, whose deduction changed its own `100` to `81`.
- Ran `serializeGame()` followed by `deserializeGame()` on a save fixture containing a ready legacy machine, a legacy runtime Taran, and `siegeEngineBuildsThisTurn`; all three values survived. The operator test's JSON stringify/parse fixture is weaker than this real save-module check, but save/load itself preserves these fields.
- Reviewed the acquisition routes: shared `purchasableUnits()` filters `Typ: Siege`; `purchaseRecruitmentUnit()` rejects direct city purchase; `availableReplacementsFor()` filters these types and `unitReplaceExecuteDeps()` rejects direct replacement. AI city recruitment uses the shared catalogue/purchase path, while siege AI calls the paid `buildAiSiegeEngine()` path. I found no additional current city/empire recruitment, direct-purchase, replacement, or mixed-owner cost bypass in those paths.
- Candidate diff is contained to the stated feature paths and its focused test/report. No unrelated source scope was found.
