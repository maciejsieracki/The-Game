# Deploy ROBOCZA receipt — auto-battle loss correction — 2026-09-17

STATUS: DEPLOY-ROBOCZA / remote push and readback pending

## Source and integration

- board: `the-game-real24`
- project: `p_9ae9ac64`
- integration branch: `integration/robocza-auto-battle-20260917`
- base: `e0e280c43909bdc8fe1d4d1ce926e15874c535c8`
- integration/artifact commit: `4f68875d07991b3fc365ec21da04329d426654d7`
- Final Control: `t_59f1a3f7` / run `647` PASS

## Artifact

- file: `gra-robocza/Gra-ROBOCZA.html`
- bytes: `69875188`
- md5: `7340f635259dfd06a9467025e9c22c61`
- sha256: `137b513839d670468ef81241c6bb72de016dbf2bade65d37c8abf8b2018e8c2f`
- Vite: `889` modules
- verifier: `VERIFY OK`
- manifest match: `OK`
- smoke: `PASS`

## Product scope

- `gra/src/game/ai-difficulty-bonus.ts`
- `gra/src/game/post-battle-map.ts`
- `gra/tools/auto-battle-loss-audit-test.cjs`
- `gra/tools/post-battle-map-test.cjs` — fixture-only health correction

## Evidence

- post-battle map: `32/0`
- focused auto-battle audit: `52/0`
- AUTO power: `14/0`
- AUTO monotonicity: `43/0`
- Python/TypeScript parity: `150/0`
- TypeScript: PASS
- syntax: PASS
- diff-check: PASS
- clean-base negative control: `42/10` as expected

No building-cost implementation is included. No promotion to KANON/FINALNA.

PUSH/REMOTE READBACK: pending.
