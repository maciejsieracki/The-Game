# R-REKRUTACJA-KARTY-BRAK-REKRUTOW-Q1 / INFRA-006 — integration receipt

- **STATUS:** `INTEGRATED — TEST-ONLY ALLOWLIST`
- **Final Control:** `t_cf130583` / run `360`, `PASS-WITH-NOTES`, zero numbered objections.
- **Integration gate:** `t_b1ad8cb3`.
- **Clean integration base:** remote `main` at `29fd77ef7bccff4701e019161c7db778653bf7f5`.
- **Allowlist integrated:**
  - `gra/tools/recruit-card-manpower-real-render-test.cjs`
  - `gra/tools/recruit-card-stock-chip-real-render-test.cjs`
- **Product paths:** `gra/src/**` and `gra/data/**` have no diff.
- **Validation on integration worktree:** manpower `17 passed, 0 failed`; stock-chip `15 passed, 0 failed`; logic `213/213`; TypeScript PASS; `git diff --check` PASS.
- **Behavior verified:** unit card exposes recruiter availability/required/shortfall; one-time stock cost is separated from upkeep; current Wojownik values are 25 Drewna purchase and 5 Drewna/t upkeep; mutation guard remains expected nonzero.
- **Bundle:** no rebuild required because product bytes did not change; existing `gra-robocza` bundle remains MD5 `9d22166c7de999a12971a857d8cd3c65`, SHA-256 `858e6763b77ebb93f7e29e4e5ff71a62d28d6ebc684971f59513f30eee1b116b`, verifier `VERIFY OK`.
- **Delivery:** commit and push are performed by the Orchestrator after this receipt; no promotion to `gra-kanon` or `FINALNA`.
