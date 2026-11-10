#!/bin/bash
# R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — golden RGBA hashes of the label scenes on rustc 1.87.0 and
# the newest toolchain, debug and release, twice each (the test prints every hash and asserts
# them against tests/fixtures/labels/golden.tsv).
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
echo "golden.tsv body (scene lines) sha256: $(grep -v '^#' tests/fixtures/labels/golden.tsv | sha256sum | cut -d' ' -f1)"
for tc in 1.87.0 stable; do
  for prof in "" "--release"; do
    for run in 1 2; do
      out=$(cargo +$tc test --locked $prof --test labels_scenes scenes_match_golden_hashes -- --nocapture 2>&1)
      rc=$?
      hashes=$(printf '%s\n' "$out" | grep -E '^(r4|r5|r15|float)[a-z0-9_]*	[0-9a-f]{16}$')
      echo "toolchain=$tc ($(rustc +$tc --version | cut -d' ' -f2)) profile=${prof:-debug} run=$run scenes=$(printf '%s\n' "$hashes" | wc -l) sha256(hashes)=$(printf '%s\n' "$hashes" | sha256sum | cut -d' ' -f1) EXIT=$rc"
    done
  done
done
