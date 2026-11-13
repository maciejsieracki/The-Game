# Follow-up evaluator — masonry progression guard

**STATUS: PASS — the prior downgrade objection is fixed.** I evaluated candidate `5a2ac1766` against the exact earlier fixture and also checked queued builds, AI selection, stale completions, and real save serialization.

The shared wall-tier guard now removes stone from `availableProduction()`, `buildableProduction()`, and `eraBuildingCatalog()` when brick walls are built or queued. I reproduced the original case with epoch 2, Murarstwo and Budownictwo unlocked, and `builtBuildingIds: ['mury']`: none of the three player-facing selectors offered `mury_kamienne`. A queued brick item also hid stone across all three selectors. A city with stone still offered brick, preserving forward progression.

I invoked the actual `chooseCityProduction()` with its production gate backed by the real `buildableProduction()` selector. The gate rejected stone after brick, and AI returned no downgrade candidate. The existing `auto-manage-test.cjs` also passed 45/45. Delayed completion fixtures preserved brick and additive `fort`/`baszta` IDs when stone or palisade finished late; delayed palisade completion beside stone kept only stone. A real `serializeGame()` → `deserializeGame()` round trip preserved the legacy city state `['mury', 'fort', 'baszta']` unchanged.

Validation passed: `upgrade-budynki-test.cjs` 61/61, `auto-manage-test.cjs` 45/45, `prereq-budynkow-test.cjs` 62/62, `palisade-battle-wall-rules-test.cjs` 55/55, `npx tsc --noEmit`, and `git diff --check`. The correction only touches the production selector/completion rules and their focused regression tests; no renderer or data files changed since the earlier live Chromium verification.

No remaining evaluator objection. Candidate is ready for Final Control.
