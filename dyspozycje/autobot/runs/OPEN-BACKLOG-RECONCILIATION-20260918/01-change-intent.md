# 01-change-intent — Open gameplay backlog reconciliation

STATUS: RECONCILIATION_PENDING → final publish after verification
OWNER AUTHORIZATION: owner requested all listed open gameplay gates to be cleared,
then deploy to `gra-robocza`, merge/push to `main`.

## Source

Kanban board `the-game-real24`, profile `default`, project `p_9ae9ac64`.
The 15 process-only cards were read back individually, had no assignee, no active
run and no active children, and received an Orchestrator receipt before archival.

## Current target proof

- `origin/main`: `53b95b7c0c3a2846bd7464ef2d3b67a282ae01b0`;
- previous gameplay release: `e0e280c43909bdc8fe1d4d1ce926e15874c535c8`, verified as an ancestor;
- current primary bundle: `Gra-ROBOCZA.html`;
- current bundle MD5: `946df5aa5f8b3ca072719ef0c5acdeca`;
- current bundle SHA-256: `8330638ac6797258712014aff845fc0f9beaccf5d164d67b38ed42cbb04d5e2e`;
- current bundle size: `69877926` bytes.

## Reconciled topics

### ALREADY_IN_TARGET

- `R-HANDEL-DOCHOD-HALF-CEIL-Q1` — `t_5e6d380a`;
- `R-GARNIZON-PANEL-DOCELNY-Q1` — `t_2766e275`;
- `R-REKRUTACJA-PANEL-WYSOKOSC-5-KART-Q1` — `t_ea4df0ed`;
- `R-REKRUTACJA-MASOWA-TABELA-MIASTA-Q1` — `t_cf1f6b29`;
- `R-ARMIA-AI-SCALANIE-REKRUTACJA-Q1` — `t_41a8d6e1`;
- `R-ARMIA-MERGE-PANEL-SCROLL-Q1` — `t_57ff84fd`;
- `R-MIASTA-KOLONIA-NAZWA-POOL-Q1` — `t_0da4a616`;
- `R-REKRUTACJA-KOSZTY-POLOWA-ALL-Q1` — `t_5d7128a7`;
- `R-CYWILIZACJE-GRECJA-AKTYWNE-PARAMETRY-Q1` — `t_e25a0017`.

### NO-OP / BASE-VERIFIED

- `R-MIASTA-KOLONIA-REGRES-Q1` — `t_12c0b63f`;
- `R-CYWILIZACJE-GRECJA-ALOKACJE-PANSTWA-MIASTA-Q1` — `t_77d1992e`;
- `R-CYWILIZACJE-GRECJA-MACIERZ-113-Q1` — `t_fcf2e050`;
- `R-CYWILIZACJE-GRECJA-MACIERZ-TRUDNOSC-SKALOWANIE-Q1` — `t_d3f34c9c`.

### NO-OP / AUDIT-ONLY

- `R-AI-PRODUKCJA-WOJSKO-RALLY-ATTACK-Q1` — `t_a981cb7a`;
- `R-CYWILIZACJE-GRECJA-MACIERZ-UNWIRED-CONSUMERS-Q1` — `t_268e24ba`.

No product diff is copied from a worker worktree. No duplicate FALA is assigned.

## Scope and exclusions

Included: reconciliation receipt, manifest reconciliation metadata, WERSJE/KANAL
publication records, clean current-base build, verifier, hash and remote readback.

Excluded: new gameplay patch, stale worker worktrees, archived reports, RustReal
R20–R24, KANON/FINALNA promotion, and any unresolved timeout/owner-hold topic.

## Regression and publication gates

- clean worktree from current `origin/main`;
- project-local `npm ci`;
- focused project-local TypeScript check;
- direct Vite production build;
- `verify-robocza-bundle.cjs`;
- MD5/SHA-256/byte-size comparison with manifest;
- `git diff --check` and explicit staged-path review;
- push branch, fast-forward `main` only if remote base is unchanged;
- remote bundle/manifest readback and HTTP smoke;
- no new wave number because this is a no-product-diff reconciliation republish.

## Decision

Proceed with the owner's requested final ROBOCZA publish only after all gates pass.
Do not claim a new gameplay implementation where the target already contains the
change or the authoritative audit proves no product diff.
