#!/bin/bash
# r2 (obrona): regenerate Chromium references with the r2 gen.mjs (strokeStyle
# gradient path removed) and show that only the gen.mjs line of MANIFEST changes
# (all ref/*.rgba, colors.tsv, versions.txt bit-identical to commit 5baad8ae).
cd /home/user/The-Game/.claude/worktrees/wf_99676387-673-3/rust-port/renderer/tests/fixtures/raster || exit 1
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
cp MANIFEST.sha256 "$S/manifest_r1"
echo '$ NODE_PATH=/opt/node22/lib/node_modules node gen.mjs'
NODE_PATH=/opt/node22/lib/node_modules node gen.mjs
echo "EXIT=$?"
echo '$ diff manifest_r1 MANIFEST.sha256'
diff "$S/manifest_r1" MANIFEST.sha256
echo "EXIT=$? (1 expected: only the gen.mjs line differs)"
echo '$ diff <(grep -v " gen.mjs$" manifest_r1) <(grep -v " gen.mjs$" MANIFEST.sha256)'
diff <(grep -v ' gen.mjs$' "$S/manifest_r1") <(grep -v ' gen.mjs$' MANIFEST.sha256)
echo "EXIT=$? (0 = every reference file identical)"
echo '$ sha256sum -c --quiet MANIFEST.sha256'
sha256sum -c --quiet MANIFEST.sha256
echo "EXIT=$?"
cat versions.txt
