# Deploy receipt — FALA 388 — local release candidate

STATUS: READY_FOR_REMOTE_READBACK
DOMAIN: GAME
BOARD: `the-game-real24`
PROFILE: `default`
PROJECT: `p_9ae9ac64`

## Integration

- base: `7d02dfc5b73e992e389dd01992a52159e943a621`;
- code/integration commit before publication docs: `95fd93050585c19584700e34205da74576f2150f`;
- clean worktree: `/home/ubuntu/projects/The-Game-integration-wave388-20260918`;
- scope: six approved topics — AUTO losses, epoch costs, civilization/city-state placement, one starting scout, completed-Garnizon militia gate, and city/building production lifecycle;
- no dirty worker worktree was merged wholesale.

## Final Control

- `t_449872b9/run726` PASS;
- `t_0b7ea103/run738` PASS;
- `t_9f092ab3/run741` PASS-WITH-NOTES;
- `t_633d081e/run729` PASS;
- `t_4fce5bc7/run745` PASS-WITH-NOTES;
- `t_d7c5ad3a/run750` PASS-WITH-NOTES;
- all six have terminal product acceptance and no numbered product objections.

## Local gates

- owner production lifecycle: `53/0`;
- old UI rush-cost seam mutation: `50/3` RED;
- shared logic: `213/213`;
- AUTO/epoch/start/scout/militia focused gates: PASS;
- TypeScript: PASS;
- Vite: `890` modules, exit `0`;
- verifier: `VERIFY OK`.

## Local artifact

- bundle: `gra-robocza/Gra-ROBOCZA.html`;
- MD5: `0816f385ef6b38e368ca11c0edf11ae5`;
- SHA-256: `4962b053c46d121f779ac9dca46cb1860b2281c223c413c3eb981cb34651ede4`;
- size: `69881460` bytes;
- manifest matches the actual bundle; Linux stamp comparison is the known iterative `WARN`.

## Boundary

No remote push, merge, or live HTTP readback has been claimed yet. The next
receipt correction must record the exact publication commit, remote `origin/main`
SHA, byte-identical manifest/bundle readback, and HTTP smoke. No promotion to
KANON/FINALNA; Rust R20–R24 remain excluded.
