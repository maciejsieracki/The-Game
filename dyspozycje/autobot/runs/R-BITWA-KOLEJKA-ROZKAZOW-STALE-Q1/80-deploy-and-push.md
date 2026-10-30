# Deploy / push receipt — queue lifecycle

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1`
GOAL: po aktywacji/pominięciu ID kolejki są czyszczone, aby nie blokować kolejnych rozkazów.
SOURCE COMMIT: `96d088b4` (`fix(battle): clear stale queued order ids after activation`).
RELEASE COMMIT: `87aa8678427109b9a109aea7797ca3c171cfd84f` (`release: publish battle order queue fix to Robocza`).
REMOTE: `git ls-remote origin refs/heads/main` → `87aa8678427109b9a109aea7797ca3c171cfd84f`.

## Robocza artefakty

- `gra-robocza/Gra-ROBOCZA.html`: MD5 `2f15bd3b3ef6b3732cee4007f8c49cda`, SHA-256 `2c6e0e446af65e6d76d6e09f378801fe69f3614391489f4d418bac90bad336b7`, 70,045,250 B.
- `gra-robocza/Gra-ROBOCZA-POLE-BITWY.html`: MD5 `daf66e2423e0f550db70ee41d8cdf12f`, SHA-256 `ecf1e42a8ec6eeaddca66a86596c34614199f101b253c73c98e266ca16fde4ec`, 57,380,299 B.
- Manifest: main MD5/SHA/size and battle bundle MD5/SHA/size match the local files.
- Pinned raw main bundle SHA-256: `2c6e0e446af65e6d76d6e09f378801fe69f3614391489f4d418bac90bad336b7` — PASS.
- Pinned raw battle bundle SHA-256: `ecf1e42a8ec6eeaddca66a86596c34614199f101b253c73c98e266ca16fde4ec` — PASS.
- Vite 5.4.21: main 919 modules; standalone battle 589 modules. Robocza `SMOKE OK`; bundle verifier `VERIFY OK` (self-referential display-stamp hash reports WARN; manifest hash is exact).

## AutoBot chain

- Operator integrated rerun: 15/15 Chromium.
- Independent Evaluator: PASS-WITH-NOTES.
- Independent Final Control: PASS-WITH-NOTES, stage 8 before integration.
- Integration: exact two product hunks on current `main`; no unrelated source edits.
- Deployment: both Robocza bundles built, copied and verified.
- Push/readback: release commit and both pinned public bundle hashes verified.

LIMITS: 28v28 and a subset pointer order were tested; no claim is made for maximum 120/side. The 60-second observation did not reproduce a duplicate move, but cannot prove overlap impossible in all states.

Po zapisaniu receipt i trackera `node dyspozycje/autobot/tools/process-docs-audit.cjs` przeszedł: PASS (14 plików, 5 szablonów, 13 statusów).
