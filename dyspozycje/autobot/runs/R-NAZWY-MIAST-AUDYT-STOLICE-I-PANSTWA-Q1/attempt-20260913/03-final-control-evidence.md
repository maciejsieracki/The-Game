# Evidence — R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1 — Final Control

Run: `attempt-20260913`
Final Control task: `t_7d20d830`
Base HEAD from dispatch: `2b94ca8242b614b599bf3bf6624bafedca6190a2`
Current HEAD at control: `b6971e1a3de1980ce92d7477962dd1e9be278c75`
Branch: `hermes/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1`
Worktree: `/home/ubuntu/projects/The-Game-worktrees/R-NAZWY-MIAST-AUDYT-STOLICE-I-PANSTWA-Q1-bugs`

## 1. Terminalne etapy i provenance

Bezpośredni readback Kanban:

- `t_ba1a3b03` (Operator): `status=done`, event `completed`; source task report/receipt `STATUS=PASS`, `source_head=0b95694b73c429d01d8b65942235f2863947f986`.
- `t_5934752f` (Evaluator): `status=done`, event `completed`; source task report/receipt `STATUS=PASS`, `objections=[]`, `source_head=2b94ca8242b614b599bf3bf6624bafedca6190a2`.
- Final dispatch `03-dispatch.md` jest zapisany w bieżącym HEAD jako delta procesu; nie jest zmianą produktu. Final Control nie zmienia wcześniejszych artefaktów.

Hashe dwóch wcześniejszych faz policzone ponownie z bajtów plików:

Faza      | report (placeholder) | evidence | progress | journal | receipt readback
----------|----------------------|----------|----------|---------|-----------------
Operator  | b287d881a8bfea08b56b8cb20a3d7418a3a79d8bf9b969581504bcd2194d0d24 | c05c9d2bdc8829e06bc2b447a57bdf74e42bd38a6dc60a7ef158ad51055d21db | ffc8d26674f74edab64b55e38791b1efa27678ba0d0a5f989477832ca1fad930 | 8fdb869f49c729001e2b3c54e502ab23ef23818b66832488358d9abf27eb0036 | da7bfde11ff2a48f1ed4bd5ddc2dfd6f9fb4709f4ba6a36223086251f7a9bb69
Evaluator | c11b3b758941ac644f79289e254ace51ef723838875b6be4bc19bcab091bf445 | c74e3b284e45ce3f842cfc4c76144d105c19c5db9e825d3f697acb62a67a0993 | 30ffffca530e8086e57852fcf0307d57e765ce6b5d901b06280e7cbbe77cb58a | 2e8171bfeddc0072eafbef244c6f61dcb315a41bef89d1167c127bb67cdb9a88 | a9c87b4b7e4ea7d7fe2df7eb20050af2a51180afbe256b529faddde895e00075

For each report the report digest was calculated after replacing its stored 64-hex value with literal `<REPORT_SHA256>`. Evidence/progress/journal digests were calculated directly. Every calculated value equals the corresponding declaration in the phase receipt.

## 2. Git and allowlist readback

Commands run:

- `git status --short --untracked-files=all`
- `git diff --name-status`, `git diff --numstat`, `git diff --check`
- `git diff --diff-filter=D --name-status`
- `git diff --name-status 2b94ca8242b614b599bf3bf6624bafedca6190a2 HEAD`
- `git rev-parse HEAD`, `git rev-parse refs/remotes/origin/main`, `git branch --show-current`
- `git merge-base --is-ancestor refs/remotes/origin/main HEAD`

Readback before writing these five Final Control files:

- current HEAD: `b6971e1a3de1980ce92d7477962dd1e9be278c75`
- `origin/main`: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
- working product modifications: exactly `gra/data/civs.json`, `gra/src/game/civ-names.ts`, `gra/tools/civ-names-test.cjs`
- untracked earlier-phase files: exactly ten files, all under the attempt directory
- committed delta `2b94ca82..b6971e1a`: exactly `03-dispatch.md`
- deleted paths: none
- `git diff --check`: PASS

All three product paths are explicitly in the Operator allowlist. All files created by this Final Control are the five paths named in the Final Control dispatch, under the same attempt directory. No product/test/previous-phase file was edited by Final Control.

## 3. Independent data audit

The following was reproduced from a fresh Node script reading `gra/data/city-names-pools.json` and `gra/data/civs.json`. Definitions: `n/e/d` = elements / empty entries / duplicates inside one list; `MC∩MP` = same-civilization intersection.

ID           | Civ label       | MC n/e/d | MP n/e/d | MC∩MP | nazwyMiast=MC | MC[0]           | MP[0]
-------------|-----------------|----------|----------|-------|---------------|-----------------|-------------
grecy        | Grecy           | 100/0/0  | 10/0/0   | 0     | true          | Ateny           | Sykion
rzymianie    | Rzymianie       | 100/0/0  | 10/0/0   | 0     | true          | Rzym            | Nola
chinczycy    | Chińczycy       | 100/0/0  | 10/0/0   | 0     | true          | Xi'an           | Qin
inkowie      | Inkowie         | 100/0/0  | 10/0/0   | 0     | true          | Cusco           | Maras
zulusi       | Zulusi          | 100/0/0  | 10/0/0   | 0     | true          | uMgungundlovu   | esiPhezi
egipt        | Egipt           | 100/0/0  | 10/0/0   | 0     | true          | Memfis          | Tinis
sumer        | Sumerowie       | 100/0/0  | 10/0/0   | 0     | true          | Uruk            | Hamazi
celtowie     | Celtowie        | 100/0/0  | 10/0/0   | 0     | true          | Bibracte        | Titelberg
germanie     | Germanie       | 100/0/0  | 10/0/0   | 0     | true          | Mattium         | Eketorp
harappa      | Harappa        | 100/0/0  | 10/0/0   | 0     | true          | Harappa         | Shortugai
hetyci       | Hetyci         | 100/0/0  | 10/0/0   | 0     | true          | Hattusa         | Kussara
slowianie    | Słowianie      | 100/0/0  | 10/0/0   | 0     | true          | Kijów           | Radogoszcz
babilonia    | Babilonia      | 100/0/0  | 10/0/0   | 0     | true          | Babilon         | Bit-Jakin
asyria       | Asyria         | 100/0/0  | 10/0/0   | 0     | true          | Aszur           | Ekallatum
fenicjanie   | Fenicjanie     | 100/0/0  | 10/0/0   | 0     | true          | Byblos         | Iol

Pool key/civilization key sets: 15/15, missing 0, extra 0. Global metrics: MC `slots=1500 unique=1381 repeatedDistinct=94 repeatedOccurrences=119`; MP `slots=150 unique=150 repeatedDistinct=0 repeatedOccurrences=0`. Global cross-family collisions: exactly 3 — `Bit-Jakin`, `Bit-Dakkuri`, `Bit-Amukani`, all `asyria:miasta_cywilizacji × babilonia:miasta_panstwa`. Civilization labels: 15 rows, 15 unique, 0 empty, 0 duplicates; only `harappa` has its label as an MC city name (eponym).

## 4. Execution of the corrected behavior

Fresh source-level bundle/readback:

```text
old ff9ce26 no-pool: player=Sykion, foreign=Sykion
current no-pool: player=Ateny, foreign=Ateny
current with pools: player=Ateny, foreign=Ateny, rival1=Fliunt
legacy-only civs without nazwyMiast: player=Sykion, foreign=Sykion
source data: MC[0]=Ateny, MP[0]=Sykion
```

This reproduces the old no-pool defect and confirms the current regular-city fallback. The current implementation at `civ-names.ts:67-73,106-113` prefers `nazwyMiast[0]`; `clusterRivalCityName` remains on the state-city list. The caller flow is present at `loader.ts:19,421` and `cluster-spawn.ts:227,354,357-358,410`.

## 5. Real gate output

Commands were run from `gra/` against the current worktree. The six focused gates all exited 0:

```text
nazwy-miast-rozlaczne-pule-test.cjs  -> 9 passed, 0 failed, exit 0
city-names-pool-test.cjs             -> 12 passed, 0 failed, exit 0
city-names-pools-test.cjs            -> 6 passed, 0 failed, exit 0
civ-names-test.cjs                    -> 66 passed, 0 failed, exit 0
display-names-test.cjs                -> 27 passed, 0 failed, exit 0
mapa-etykieta-stolicy-test.cjs       -> 47 passed, 0 failed, exit 0
```

Typecheck:

```text
node ./node_modules/typescript/bin/tsc --noEmit
TypeScript 5.9.3; exit 0
```

The local `gra/node_modules` path was absent before typecheck, linked temporarily to an existing dependency tree, and absent after the check. The first `NODE_PATH`-only invocation failed because TypeScript's project resolver did not see `three`; it is explicitly not counted as the project check. No dependency was installed. Test-generated ignored bundles/entries were removed by exact path after execution; final ignored-file readback is empty.

`npm run build` and `npm run dev` were not run because repository process C-001 prohibits them in `gra/`. No browser runtime was required: this task changes data/pure naming functions and the executed map-label gate is static; `desktop_runtime_verified=false` is intentional.

## 6. Security and process boundary

Credential-pattern scan over the three changed product files found `0` hits for private-key headers, AWS access-key form, API/client secrets, passwords, or bearer authorization. No files were deleted. `product_approval=false` is preserved in upstream receipts and is not treated as integration approval.

No Final Control action performed a product edit, `git add`, commit, cherry-pick, reset, clean, stash, rebase, force-push, push, PR, merge, or deploy. `origin/main` remained `ff9ce26a...`; current branch is ahead locally and retains the uncommitted product diff for the Orchestrator.

Conclusion: all Final Control criteria pass; result is `PASS` with next state `INTEGRATION_REQUIRED`, not publication.
