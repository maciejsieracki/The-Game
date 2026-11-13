# Final control — R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-BRONZE-FOUNDRY-OUTPUT-25-50-Q1
GOAL: Apply owner-era bronze throughput caps of 25/t in era 2 and 50/t from era 3 onward to every bronze foundry recipe, preserve inputs and iron/steel behavior, and keep production displays aligned with runtime.
ZMIANY/COMMIT: Reviewed candidate `dc2292740e487293c26f653f7713ee996a76d0db` (`Fix bronze foundry output by owner era`). The committed diff is limited to the approved parameter, converter, economy, HUD, test and run-evidence files. No source edits made during final control. The only pre-existing worktree addition is the untracked evaluator report `20-evaluator.md`.
TESTY: PASS — `node tools/foundry-throughput-x2-era-mult-test.cjs` (159 passed); `node tools/converter-era-scaling-test.cjs` (117 passed); `node tools/citypanel-konwerter-produkcja-test.cjs` (83 passed); `node tools/hud-konwerter-dopasowanie-test.cjs` (20 passed); `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json` (exit 0); `git diff --check <parent> <candidate>` (exit 0).
BLOKADY: None for integration. These checks exercise real converter/economy/UI calculation code with deterministic fixtures; no live campaign was run, so no live-campaign behavior is claimed. The real economy-tick parity fixture directly exercises the era-2 player and era-3 AI through the tier-1 bronze foundry. The tier-2 and tier-3 bronze recipes share the same explicit row selector and building-to-recipe routing; their rate/display mapping is covered by recipe and building display fixtures rather than separate full tick fixtures.
RUNDY: Final control for candidate `dc2292740e487293c26f653f7713ee996a76d0db`.
NASTĘPNY KROK: Ready for the orchestrator’s integration gate.
DEPLOY/PUSH: NOT PERFORMED.

## Independent findings

- All three bronze output recipes (`odlewnia_brazu`, `odlewnia_zelaza__braz`, `wielka_odlewnia__braz`) select the era-2 and era-3 parameter rows through `converterThroughputEraParamKey`. Era 3’s row carries forward for later eras. `buildings.json` places the foundry tiers in eras 2, 3, and 4 respectively.
- The same owner-era selection is used when building `runConverters` throughput maps for the tick and resource preview. HUD rates resolve the owner’s empire era and use the same row selector; the city panel delegates to `converterProductionDisplayForBuilding`.
- Bronze recipe inputs remain `ruda: 1`, `drewno: 1`, and `ruda_cyny: 0.1`. Iron and steel recipes retain their existing throughput keys and remain in `CONVERTER_FOUNDRY_ERA_RECIPE_IDS`; the shared `budynek_huta_przepustowosc` row is not globally changed to impose the bronze cap on iron/steel.
- The changed paths match the pre-edit allowlist and recorded test updates. I found no in-scope behavior defect or regression that blocks integration.
