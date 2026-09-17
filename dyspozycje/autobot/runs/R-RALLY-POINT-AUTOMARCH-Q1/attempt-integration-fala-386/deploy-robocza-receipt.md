# Deploy receipt — R-RALLY-POINT-AUTOMARCH-Q1 / FALA 386

STATUS: LOCAL PUBLISH PREPARED — push/readback pending
DOMAIN: GAME
TEMAT: R-RALLY-POINT-AUTOMARCH-Q1
WAVE: FALA 386

## Integration

- base: `25133ccb9367b1e0cc11e561065dfef08bed3f40`
- branch: `hermes/integration/fala-386-rally-20260918`
- integration commit: `8eba87007a866edc80c4776df77697af65e17f2d`
- source Final Control: `t_fabbd788/run681`, PASS-WITH-NOTES, no product objections
- excluded: `af4d65cf` and all mixed/stale worktree changes

## Gates

- rally point automarch: `22/0`
- planned march: `18/0`
- logic: `213/213`
- TypeScript: PASS
- syntax: PASS
- diff-check: PASS
- Vite: `890` modules
- primary bundle verifier: `VERIFY OK`
- manifest match: `OK`
- Linux stamp: known `WARN` for Node stamp port

## Artifact

- primary: `gra-robocza/Gra-ROBOCZA.html`
- MD5: `946df5aa5f8b3ca072719ef0c5acdeca`
- SHA-256: `8330638ac6797258712014aff845fc0f9beaccf5d164d67b38ed42cbb04d5e2e`
- bytes: `69877926`
- build output before stamp: `69877467` bytes

## Publication boundary

- no promotion to KANON/FINALNA;
- legacy PLAYTEST aliases are absent after repository cleanup and are recorded in
  `ROBOCZA-MANIFEST.json` as `legacyAliasesNotPresent`;
- next gate: push branch, remote branch readback, push/merge `main`, remote bundle
  readback, and smoke against the actual target.
