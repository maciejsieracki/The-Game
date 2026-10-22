#!/bin/bash
# R-RUSTPORT-P4-29-TEXT-FONTS-Q1 — golden hashes of the 36 text scenes on
# rustc 1.87.0 and the newest toolchain, debug and release, twice each.
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
echo "golden.tsv body (scene lines) sha256: $(grep -v '^#' tests/fixtures/text/golden.tsv | sha256sum | cut -d' ' -f1)"
for tc in 1.87.0 stable; do
  for prof in "" "--release"; do
    for run in 1 2; do
      out=$(cargo +$tc test --locked $prof --test text_scenes scenes_match_golden_hashes -- --nocapture 2>&1)
      rc=$?
      hashes=$(printf '%s\n' "$out" | grep -E '^(t|x)[a-z0-9_]+	[0-9a-f]{16}$')
      echo "toolchain=$tc profile=${prof:-debug} run=$run scenes=$(printf '%s\n' "$hashes" | wc -l) sha256(hashes)=$(printf '%s\n' "$hashes" | sha256sum | cut -d' ' -f1) EXIT=$rc"
    done
  done
done
