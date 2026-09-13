# Evidence — R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1

KANBAN_CARD: t_af4dfeb8
TEMAT: R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1
STATUS: PASS-WITH-NOTES

## 1. Autoritative input

Source: `/home/ubuntu/.hermes/attachments/The-Game-startowe-jednostki-do-korekty.xlsx`
SHA-256: `e04a427c5f761b19471b11855a236f280949b9b3be04682c09fcec2f03739cce`

Odczyt XML właściwego XLSX:
- Arkusz `Trudność główna`: gracz `2/1/0`, obce państwo-miasto `2/1/0`, główne AI `0/1/2` dodatkowych jednostek.
- Arkusz `Trudność państw-miast`: państwo-miasto typu gracza `0/1/2` z osobnego suwaka.
- Dla hard arkusz główny wskazuje dodatkowe miasto `1`; kontrakt dispatchu zachowuje fallback jednostkowy przy braku legalnego miejsca.

## 2. Git and scope readback

- HEAD: `8e5e81255449bc98c9674c6a6e5505d408b343fc`
- merge-base z `origin/main`: `ff9ce26a663c53c9f711e50536eb10f59dc4b70b`
- branch: `hermes/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- worktree: `/home/ubuntu/projects/The-Game-worktrees/R-GRACZ-STARTOWE-JEDNOSTKI-TRUDNOSC-Q1`
- dispatch branch field: `hermes/R-STARTOWE-JEDNOSTKI-WSZYSTKIE-OSIE-Q1` (faktyczny Git branch powyżej pozostawiono bez zmiany)
- product status before writing run artifacts: wyłącznie sześć allowlisted files modified; po zapisaniu tego handoffu dochodzi pięć allowlisted run artifacts w tym katalogu.
- `git diff --check`: exit `0`.
- `git diff --numstat`:
  - `gra/data/ai-params.json`: `1 1`
  - `gra/src/game/ai-difficulty-bonus.ts`: `4 4`
  - `gra/src/game/ai.ts`: `1 1`
  - `gra/tools/ai-difficulty-bonus-test.cjs`: `18 8`
  - `gra/tools/city-state-start-units-live-test.cjs`: `11 3`
  - `gra/tools/starting-army-first-city-live-test.cjs`: `3 3`
  - suma: `38` added / `20` deleted.
- `gra/src/main.ts`: no diff. Readback call sites: PM same-type `8951`, player `9001`, foreign PM `9086`, major AI `9112`; first-city guard and grant `13166-13182`.
- Temporary test bundles and runtime output directories removed; no `/tmp/civ-city-state-start-units-live-*` or `/tmp/civ-starting-army-first-city-*` remained after cleanup.

## 3. Exact focused commands and results

All commands ran from `gra/`.

- `node --check tools/ai-difficulty-bonus-test.cjs && node --check tools/city-state-start-units-test.cjs && node --check tools/city-state-start-units-live-test.cjs && node --check tools/starting-army-first-city-live-test.cjs` — exit `0`.
- `node tools/ai-difficulty-bonus-test.cjs` — `ai-difficulty-bonus-test: 90 passed, 0 failed`.
- `node tools/city-state-start-units-test.cjs` — `WYNIK: 16 PASS, 0 FAIL`.
- `node tools/ai-balans-step5-test.cjs` — `18 passed, 0 failed`.
- `node tools/city-state-cluster-diff-test.cjs` — `31 passed, 0 failed`.
- `node tools/miasta-zbyt-blisko-test.cjs` — `Map wygenerowanych: 20`; plan `23281/23281` par w normie; realna kolejność `25463/25463` par w normie; naruszenia `0`.
- `node_modules/.bin/tsc --noEmit` — exit `0`.
- `node tools/ai-test.cjs` — `291 passed, 4 failed`; failures are exactly T2S-b (two assertions), T2S-b2 and T10b. A clean `git archive HEAD` copy produced the identical four failure lines and the identical `291 passed, 4 failed` result.

## 4. Runtime/live evidence

Browser executable used for both live runs:
`/home/ubuntu/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome`

- `CS_CHROME_PATH=... node tools/city-state-start-units-live-test.cjs` — `25 pass, 0 fail`.
  - Three full world generations: `gameDifficulty=hard,normal,easy`, constant `cityStateDifficulty=normal`.
  - Player capital units: hard `0`, normal `1`, easy `2`.
  - Foreign city-state units: hard `0`, normal `1`, easy `2`.
  - Same-type city-state rivals: exactly `1` on all three runs because PM slider stayed normal.
  - Console/JS errors: `0`.
- `STARTING_ARMY_CHROME_PATH=... node tools/starting-army-first-city-live-test.cjs` — `13 pass, 0 fail`.
  - Two different human seats and start hexes.
  - Seat 1 first founding: exactly `1` unit; second founding: no new unit.
  - Seat 2 first founding: its own one-time `1` unit.
  - Chromium JS errors: `0`.

## 5. Mutation evidence

Mutation was run in a temporary copy of `src/` and `data/` inside `gra/`; the tracked worktree was not changed. The current player helper body:
`easy -> 2`, `normal -> 1`, `hard -> 0`
was replaced in the temporary copy with the former `1/2/3` behavior. Command used the test's `AI_SRC_DIR` override.

Observed mutant output:
- `gracz easy -> 2 (got 1, want 2)`
- `gracz normal -> 1 (got 2, want 1)`
- `gracz hard -> 0 (got 3, want 0)`
- `ai-difficulty-bonus-test: 87 passed, 3 failed`
- wrapper: `mutant_test_exit=1`, `mutant_killed=YES`.

## 6. Product diff interpretation

The source wiring already separated the four axes, so no `main.ts` edit was needed. The product corrections are limited to the authoritative data/helper fallback and the corresponding tests: player `2/1/0`, major AI `0/1/2` with hard city/fallback retained, foreign PM `2/1/0`, player-type PM `0/1/2` from its own slider.

DEPLOY/PUSH/MERGE: not performed.
NEXT GATE: Evaluator.
