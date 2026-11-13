# Deploy receipt — FALA 387 / AF4 current-base integration

STATUS: DEPLOYED — remote main/readback/smoke PASS
DOMAIN: GAME
TEMAT: R-BUILDING-COSTS-Q1 + R-UNIT-SORT-Q1

## Integration

- clean base: `origin/main=c08b3db14292221cad0a4e7a70608e9d09ee9afd`;
- integration commit: `00b1b391b37be16477d924e62449e20f027e2eed`;
- Final Control: `t_2ef08e4e/run703`, `PASS-WITH-NOTES`, `product_acceptance=true`, `objections=[]`;
- allowlist: 6 product files + 2 focused tests;
- stale source worktrees were not merged wholesale.

## Gates

- building epoch: `20 passed, 0 failed`;
- unit sort: `13 passed, 0 failed`;
- logic: `213/213`;
- upkeep: `73/0`;
- building cost tempo: `6/0`;
- building queue/refund: `5/0`;
- unit replace: `13/13`;
- recruitment cost: `PASS`;
- era improvement: `65/0`;
- TypeScript: `PASS`;
- syntax: `PASS`;
- Vite: `890 modules`;
- verifier: `VERIFY OK`.

Known baseline notes from Final Control remain documented: unchanged
`koszty-surowcowe` `126/3` and unchanged `unit-power` `4/2` archive oracles
match clean `origin/main` and are outside this candidate's acceptance contract.

## Artifact

- bundle: `Gra-ROBOCZA.html`;
- MD5: `4c1788bb880dbd66761410af0d277245`;
- SHA-256: `dba338ff46488b22d5c18e56b9a6fc7c376be0c0af60a78ec9bbdbb19fef6375`;
- size: `69878627` bytes;
- wave: **FALA 387**;
- no promotion to KANON/FINALNA.

## Boundary

The next authorized effects are branch push, fast-forward merge to `main`,
remote bundle/manifest readback and HTTP smoke. No worker performs those effects.
