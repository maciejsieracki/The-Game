# R-DEPLOY-GAME-BUGS-20260916 — ROBOCZA receipt

Status: `DEPLOYED — remote readback PASS; commit 2aeb52743476bd1175789049b350a34f1888dda3`

## Boundary

- Target lane: `gra-robocza`
- Source worktree: `/home/ubuntu/projects/The-Game-game-bugs-integration-20260916`
- Source branch: `hermes/R-GAME-BUGS-INTEGRATION-20260916`
- Base: `origin/main=3ff3264b487f597311c000e8e8434375ee88a651`
- Current source HEAD before publication commit: `0180d17231b62d2a5012c9c23d8a42d91c09f1e1`
- No promotion to `gra-kanon` or `FINALNA`.

## Product scope prepared

- recruitment half-cost/resource-upkeep correction;
- colony/city-name pool fix already accepted by its Final Control;
- Greece owner allocation and save/load reapply;
- city-state/defensive-copy owner-aware AI improvement envelope;
- AI Work/building-vs-improvement wiring;
- Greece active parameters and matrix consumers;
- AI combat difficulty multipliers `Easy=0.95`, `Normal=1.00`, `Hard=1.05`.

Test-only evidence correction included in source branch: barbarian camp call-site inventory and fallback mutation guard. It adds no barbarian product diff.

## Verification before publication

- Vite direct build: `889` modules, exit `0`.
- TypeScript: `node ./node_modules/typescript/bin/tsc --noEmit`, exit `0`.
- Bundle before stamp: `69,862,089` bytes; MD5 `37e1b9fce772928108de7112e74e0151`; SHA-256 `14305624366e03e0aebe164d872e1cff6f098f5b562c4e995755ceb8719dc198`.
- Stamped target bundle: `69,862,548` bytes; MD5 `7040d499548170e3805f231b5cac2e46`; SHA-256 `afd817232f8c6769024e160bdb3abfc3ac3c8b4e1760858f2ef4aec0a9657f22`.
- `node gra/tools/verify-robocza-bundle.cjs`: `VERIFY OK`; manifest match `OK`; Linux stamp match is the known `WARN` path of the iterative Node stamp port.
- Focused gates already passed on the clean integration branch: Greece matrix `390/0`, difficulty `16/0`, allocation `11/0`, save/load ordering `5/0`, AI Work `27/0`, owner policy `33/0`, production overflow `213/0`, AI difficulty `97/0`, AI slider `46/0`, economy audit `33/0`, recruitment `75/75` plus `190/0`, `13/0`, `82/0`, colony name `7/0`.
- Barbarian bounded evidence after two Operator timeouts: camp `85/0`, city behavior `177/0`, karencja real-render `13/0`; worktree product diff `0`. This is not a terminal Operator PASS and is excluded from the product scope.

## External state

- Remote push/readback: branch `hermes/R-GAME-BUGS-INTEGRATION-20260916` and `origin/main` both point to `2aeb52743476bd1175789049b350a34f1888dda3`. Remote bundle bytes/hash exactly match the manifest: `69862548`, MD5 `7040d499548170e3805f231b5cac2e46`, SHA-256 `afd817232f8c6769024e160bdb3abfc3ac3c8b4e1760858f2ef4aec0a9657f22`.
