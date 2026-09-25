STATUS: PASS
DOMAIN: GAME
TEMAT: R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
GOAL: AI siege defender-strength/tier/stance path consumes defending-city obl_mur_proc and obl_obrona_miasta_proc without changing the later real battle path.
ZMIANY/COMMIT: Narrow correction in gra/src/main.ts, gra/src/game/siege.ts, gra/src/game/siegeAi.ts, and gra/tools/civ-matrix-oblezenie-wiring-test.cjs. No commit.

TRACE:
- Initial AI call: main.ts scanAutoSiegesAfterAiTurn -> buildSiegeCityFromRuntime -> decideAISiegeStance.
- Ongoing AI call: main.ts maybeAiAssaultAfterMachines -> buildSiegeCityFromRuntime -> decideAISiegeStance.
- Both pass the defending city ownerId, defensive building ids, and a nullable civKey resolved from _menuCivIdByOwner, player.civType, or aiOwnerCivMap. Missing/unknown data stays null; no Greece fallback.
- siegeAi.ts -> estimateDefenderStrength -> siege.ts cityDefenseBonus -> shared city-defense.ts cityWallDefenseBonusPercent + civ-matrix.ts civMatrixParam.
- Only siegeAi passes applyCityBonus(..., true). resolveSiegeAttack keeps the default false, so the later real battle path does not receive a second structure application.

BEHAVIOR:
- Same city/army: Grecy strength > neutral strength > Zulusi strength.
- Shared structural percentages asserted: neutral 200%, Grecy 288%, Zulusi 160%.
- Unknown/missing civ equals the neutral matrix result.
- One-application formula asserted against the production AI strength result.

TESTY:
- cd gra && ./node_modules/.bin/tsc --noEmit — exit 0.
- cd gra && node tools/civ-matrix-oblezenie-wiring-test.cjs — exit 0; 83 pass, 0 fail.
- cd gra && node tools/siege-ai-test.cjs — exit 0; 17 pass, 0 fail.
- cd gra && node tools/logic-test.cjs — exit 0; 213 pass, 0 fail.
- cd gra && node tools/city-defense-terrain-gate-test.cjs — exit 0; 34 pass, 0 fail.
- cd gra && node tools/mur-paradoks-test.cjs — exit 0; 29 pass, 0 fail.
- git diff --check — exit 0.

GIT:
- BRANCH: hermes/R-CYWILIZACJE-MACIERZ-WIRING-OBLEZENIE-Q1-20260922
- HEAD: f52f3b76b4761136a43dc0ab32dde50552a176fe
- BASE: origin/main=0caa4dfa31d37337cd74fdbab95ee77da4806d98
- Current product paths are the prior four-path allowlist plus the three narrow production/test paths; no other product paths were changed.
- Existing dirty paths were preserved. No reset, clean, stash, rebase, checkout, commit, push, merge, deploy, or integration.

BLOKADY: brak technicznej blokady. Independent Evaluator required before any Final Control/integration gate.
RUNDY: narrow correction 1/5.
NASTĘPNY KROK: independent read-only Evaluator for this narrow correction.
DEPLOY/PUSH: NIE WYKONANO.
