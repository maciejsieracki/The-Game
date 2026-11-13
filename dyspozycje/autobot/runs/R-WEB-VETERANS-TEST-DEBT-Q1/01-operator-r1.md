# Operator receipt — veterans test debt

**Operator/model:** LunaHigh (`nextslotafterbattleloot11`; model supplied by handover)
**Repository/base:** `/workspace/main-integration-20261029`, `43c5487f69ab052820672dfbcddbfed0ab0bb5dc`
**Scope:** stale-test diagnosis and correction only; no game-rule changes.

The baseline reproduction `cd gra && node tools/weterani-test.cjs` returned **78 PASS, 1 FAIL**. The failing assertion expected nominal Konnica power 49, while the current raw data and `stackFieldPowerM` both returned 98. Current `units.json` records Konnica `fieldPower: 98`; the current M consumer computes the same baseline. The approved `R-MOC-TABLICZKA-VS-CIVPOWER-Q1` design and `armyMerge.ts` comment establish that full effective power is for the map token badge, while pre-battle remains nominal. Therefore 49 was a stale test pin, not a product behavior defect.

Updated only the section 10 test labels, checkpoint, and comments in `gra/tools/weterani-test.cjs`. The nominal checkpoint now compares against the existing `mRekrut` computed from the same unit data/power function; the effective veteran checkpoint uses computed `expectedMWeteran`. Existing checks for veteran bonus, equality with auto-battle power, and effective power exceeding nominal remain intact.

Post-change reproduction: `cd gra && node tools/weterani-test.cjs` — **79 PASS, 0 FAIL**. Full output is in `evidence/weterani-test-post.txt`. `git diff --check` passed. No build or Chromium run, per dispatch. No commit made and no shared register changed.
