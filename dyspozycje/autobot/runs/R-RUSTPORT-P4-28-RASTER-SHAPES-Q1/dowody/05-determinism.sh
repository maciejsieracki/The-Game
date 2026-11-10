#!/bin/bash
# Determinism of raster golden hashes: rustc 1.87.0 / stable × debug / release × 2 runs.
cd /home/user/The-Game/.claude/worktrees/wf_99676387-673-1/rust-port/renderer || exit 1
TMP=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/h.txt
for tc in 1.87.0 stable; do
  for prof in debug release; do
    flag=""
    [ "$prof" = release ] && flag="--release"
    for run in 1 2; do
      echo "\$ cargo +$tc test --locked $flag --test raster_scenes scenes_match_golden_hashes -- --nocapture   # run $run"
      cargo "+$tc" test --locked $flag --test raster_scenes scenes_match_golden_hashes -- --nocapture > "$TMP" 2>&1
      echo "EXIT=$?"
      echo "scene hash lines: $(grep -cE $'^[A-Za-z0-9_]+\t[0-9a-f]{16}$' "$TMP")"
      echo "sha256 of printed scene hashes: $(grep -E $'^[A-Za-z0-9_]+\t[0-9a-f]{16}$' "$TMP" | sha256sum | cut -d' ' -f1)"
      grep "test result" "$TMP"
    done
  done
done
echo "sha256 of golden.tsv body: $(grep -v '^#' tests/fixtures/raster/golden.tsv | sha256sum | cut -d' ' -f1)"
