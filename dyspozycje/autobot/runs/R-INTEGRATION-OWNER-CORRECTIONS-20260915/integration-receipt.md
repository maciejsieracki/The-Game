# Integration receipt — owner corrections 2026-09-15

**Target branch:** `hermes/integration-owner-corrections-20260915`
**Base:** `origin/main` = `94014b7b9f7ee9d5a61681680f88d42e2258851e`
**Worktree:** `/home/ubuntu/projects/The-Game-worktrees/INTEGRATION-OWNER-CORRECTIONS-20260915`
**Profile/project/board:** `default` / `p_9ae9ac64` / `the-game-real24`

## Integrated product allowlist

### AI

- `gra/src/game/ai-major-absorb.ts`
- targeted production guard/call-sites in `gra/src/main.ts`
- `gra/tools/ai-major-absorb-test.cjs`

Contract: own-cluster city-state absorption remains available; major→major only on `hard`, from turn 25, with attacker/victim power ratio >=10; ordinary war retains two-city cap and forced peace.

The audit-only `ai-dyplo-only-miasta-panstwa-test.cjs` was deliberately not integrated because it tests source text directly, which is prohibited by the repository test rules. Its runtime/source evidence remains in the approved Operator/Evaluator artifacts.

### Recruitment costs

- `gra/data/units.json`
- targeted `unitMoneyCost` correction in `gra/src/game/production.ts`
- `gra/tools/recruitment-cost-50-wood-test.cjs`

Effective Niski/normal values verified: money `10/6/6/8/20/26/9/14/9/14`; wood `25`, Taran `38`; money upkeep unchanged; wood upkeep `5`, Taran `8`. No food, Manpower or percentage parameter was integrated.

### Documentation

- `docs/decyzje/R-AI-DYPLO-ONLY-MIASTA-PANSTWA-Q1.md`
- `docs/decyzje/R-REKRUTACJA-KOSZT-50-DREWNO-Q1.md`
- `docs/decyzje/R-NAZWY-MIAST-PANSTWA-POOL-POPULARNOSC-Q1.md`
- `dyspozycje/REJESTR-PROSB-I-ZADAN.md`
- `dyspozycje/PYTANIA-OTWARTE.md`

Names code was not integrated. Current one-civilization-per-type map rule remains unchanged; the no-suffix/queue behavior is future specification only.

## Integrated-state verification

- `node tools/ai-major-absorb-test.cjs`: `35 passed, 0 failed`
- `node tools/ai-cs-absorption-test.cjs`: `33 passed, 0 failed`
- `node tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs`: `22 PASS, 0 FAIL`
- `node tools/recruitment-cost-50-wood-test.cjs`: `190 passed, 0 failed`
- `node tools/unit-cost-tempo-test.cjs`: `9 passed, 0 failed`
- `node tools/upkeep-test.cjs`: `73 passed, 0 failed`
- `node tools/ai-prod-gate-difficulty-test.cjs`: `8 passed, 0 failed`
- `npm run typecheck`: `PASS`
- `npm run build`: `PASS`, `888 modules`, Vite `27.07 s`
- `git diff --check`: `PASS`

`unit-resource-upkeep-test.cjs` and `unit-stock-cost-test.cjs` retain `17` pre-existing failures on the clean `origin/main` baseline; neither test nor its unrelated mount/horse expectations was changed by this integration.

## Delivery boundary

This receipt records local integration preparation and verification only. No commit, push, merge, remote mutation or deploy was performed while generating the receipt. The next Orchestrator gate is explicit commit/readback, followed by the separately authorized delivery procedure.
