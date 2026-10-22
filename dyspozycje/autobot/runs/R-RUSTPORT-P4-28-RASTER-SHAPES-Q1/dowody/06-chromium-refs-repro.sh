#!/bin/bash
# Reproducibility of the Chromium references: regenerate and compare MANIFEST.sha256.
cd /home/user/The-Game/.claude/worktrees/wf_99676387-673-1/rust-port/renderer/tests/fixtures/raster || exit 1
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad
cp MANIFEST.sha256 "$S/manifest_before"
echo '$ NODE_PATH=/opt/node22/lib/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs'
NODE_PATH=/opt/node22/lib/node_modules node gen.mjs
echo "EXIT=$?"
echo '$ diff manifest_before MANIFEST.sha256'
diff "$S/manifest_before" MANIFEST.sha256
echo "EXIT=$? (0 = identical regeneration)"
echo '$ sha256sum -c MANIFEST.sha256'
sha256sum -c MANIFEST.sha256
echo "EXIT=$?"
echo '$ du -sb ref . (bytes)'
du -sb ref .
cat versions.txt
