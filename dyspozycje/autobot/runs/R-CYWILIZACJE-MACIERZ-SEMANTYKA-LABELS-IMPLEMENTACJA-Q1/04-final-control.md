# 04-final-control — partial semantic/UI scope

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1
ROLE: Final Control
TASK: t_72362f60
RUN: 894

## Verdict boundary

`PASS-WITH-NOTES` applies only to the bounded local candidate consisting of:

- the Normal-only, median-based semantic classifier;
- the complete 113-row civilization profile UI;
- the proven 11 `REAL_GAMEPLAY` and 5 `UI_ONLY` status classifications;
- the explicit inactive presentation of unresolved rows.

The full 113-field consumer requirement remains `DECISION_REQUIRED` / owner hold.
All 97 rows `D_REQUIRED-001..D_REQUIRED-097` remain explicitly
`UNWIRED`; rendering their matrix values is not accepted as gameplay wiring,
UI-only completion, or an implemented consumer. No Defense is created because
the terminal Evaluator reports contain `objections=[]`; the routing recovery was
evidence repair, not a numbered product objection.

This verdict does not authorize integration, commit, push, merge, deploy,
Tauri/Rust work, natural-war runtime work, save migration, or a speculative
consumer wave.

## Source and worktree readback

- Worktree: `/home/ubuntu/projects/The-Game/.worktrees/civ-matrix-semantic-labels-implementation-20260921`
- Branch: `hermes/R-CYWILIZACJE-MACIERZ-SEMANTYKA-LABELS-IMPLEMENTACJA-Q1-20260921`
- `BASE`: `f4c89d0081c622c16b207d338b49c8bacafc4553`
- `HEAD`: `f4c89d0081c622c16b207d338b49c8bacafc4553`
- `origin/main`: `f4c89d0081c622c16b207d338b49c8bacafc4553`
- Board/profile/project: `the-game-real24` / `default` / `p_9ae9ac64`
- Current task routing: Final Control, `gpt-5.6-luna`, `openai-codex`, `ultra`, `priority`.
- The candidate is local and dirty: the Operator product files and process
  artifacts are uncommitted; there is no product commit to integrate.
- Current status before these artifacts contained only the expected Operator
  product paths plus `01-*` and `03-*` evidence paths. No unrelated path was
  accepted into the candidate.

## Coverage and semantic contract

Independent JSON/status/hash reconciliation and source readback confirmed:

- 113 parameter definitions × 15 civilizations = 1,695 cells;
- 1,695 actual and unique civilization/parameter pairs;
- 11 `REAL_GAMEPLAY` parameters / 165 cells;
- 5 `UI_ONLY` parameters / 75 cells;
- 97 `UNWIRED` parameters / 1,455 cells;
- exact complete decision range `D_REQUIRED-001..D_REQUIRED-097`;
- all unresolved rows retain unresolved actor, condition, precedence and
  behavior-test fields; no zero adapter, invented effect, or Greece fallback.

The accepted display contract is:

- baseline: the Normal median over all 15 civilization rows, per parameter;
- polarity: parameter-specific `beneficial`, `harmful`, or
  `neutral/not-applicable`;
- directional delta: beneficial `raw - median`, harmful `median - raw`;
- exact median: `POZYTYWNY` with signed intensity `+1`;
- signed intensity: rounded/clamped to `-10..+10`, normalized by the most
  distant value from the median;
- AI/relations profile fields: `NEUTRALNY`, intensity `0`, with a separate
  profile/relations explanation;
- missing/unknown civilization or value: explicit blocked state, never Greece
  fallback;
- labels are presentation-derived and are not persisted in game state or save;
- the UI is Normal identity only and does not expose Easy/Hard labels in this
  profile; 11 active rows are shown by default and the other 102 rows are in
  one closed expandable `<details>` panel, with search and label/status filter.

## Verification evidence

### Re-executed by this Final Control

All commands were read-only with respect to the repository product. From
`gra/` where applicable:

- `node tools/civ-matrix-semantic-labels-test.cjs` — `PASS 41; FAIL 0`.
- `node tools/civ-matrix-greece-test.cjs` — `PASS 390; FAIL 0`.
- `node tools/civ-matrix-difficulty-test.cjs` — `16 passed, 0 failed`.
- `node ./node_modules/typescript/bin/tsc --noEmit` — exit `0`.
- `node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-matrix-final-control-894-dist --emptyOutDir` — exit `0`, 891 modules, `index.html` 69,806.34 kB.
- `node --check /tmp/t_02f263c1-browser-smoke.cjs` — exit `0`.
- Fresh Chromium/Playwright readback against that fresh build — exit `0`:
  1 profile, 113 rows, 11 active by default, 102 inactive in one closed
  `<details>`, expansion 102, search `meta_epoka` 3 visible rows, negative
  filter 11 visible rows all marked `NEGATYWNY`, no page or console errors.
- `git diff --check` — exit `0`.

The browser result was obtained through the existing known-good harness; no
second speculative harness or tracked test edit was introduced.

### Prior phase evidence kept separate

- Operator run 891 produced the implementation and `01-*` artifacts.
- Independent Evaluator `t_02f263c1` / run 892 reported `PASS-WITH-NOTES`,
  including semantic `41/0`, Greece `390/0`, difficulty `16/0`, TypeScript,
  direct production build and Chromium artifact readback. Its objections list
  is empty.
- Bounded routing recovery `t_b62c133a` / run 893 was restricted to routing,
  provenance and bounded structural checks. It reran semantic `41/0`,
  TypeScript, diff-check and hash/status reconciliation, but explicitly did
  not rerun the production build, Chromium, Greece regression, or difficulty
  regression. Those gates are not misattributed to the recovery; this Final
  Control reran them independently above.
- Source hashes recorded in the contract and routing evidence were recomputed:
  all 9/9 matched the current worktree.

## Routing and deployment provenance

The prior Evaluator's native creation had `project_id=null`; this remains
preserved as historical `INFRA/ROUTING_ERROR` for `t_02f263c1` / run 892 and
was not mutated or erased. The bounded recovery is a separate completed card:

t_b62c133a / run 893 → `done` / `completed`, native created event `15331`,
project `p_9ae9ac64`, process phase `evaluator`, parent `t_29f09234`, explicit
`gpt-5.6-luna` / `openai-codex`, reasoning `max`, service tier `priority`, and
its fresh idempotency key. The completion event and recovery artifact were read
back before this Final Control.

The recovery wrote no product file. There has been no commit, push, merge,
deploy or publication. The current candidate therefore remains local-only and
requires a later, separately authorized integration gate if the owner resolves
the 97-row hold.

## Allowlist and next gate

This Final Control writes only:

- `04-final-control.md`;
- `04-final-control.json`;
- `04-transition-receipt.md`.

Next legal action: preserve the 97-row owner decision hold. Do not open a
consumer implementation or integration phase until the owner supplies the
actor, condition, formula, precedence and behavior/save contract for the
unproven rows, or explicitly closes them as not active/dead. If that decision
is later made, create a separate, serialized consumer-wiring topic with its own
Operator → independent Evaluator → Final Control chain.

DEPLOY/PUSH: NIE WYKONANO
