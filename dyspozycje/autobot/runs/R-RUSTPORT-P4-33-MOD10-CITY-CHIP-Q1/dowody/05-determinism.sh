#!/usr/bin/env bash
# R-RUSTPORT-P4-33 — determinism of the MOD-10 textures: golden FNV-1a hashes
# (tests/fixtures/cityoverlay/golden.tsv) on rustc 1.87.0 and stable, debug and
# release, two runs each.
# Usage: 05-determinism.sh <repo root>
cd "$1/rust-port/renderer" || exit 2
G=tests/fixtures/cityoverlay/golden.tsv
echo "golden.tsv body sha256: $(grep -v '^#' $G | sha256sum | cut -c1-64)  ($(grep -vc '^#' $G) textures)"
for tc in 1.87.0 stable; do
  for prof in "" "--release"; do
    for run in 1 2; do
      out=$(cargo +$tc test --locked $prof --test cityoverlay_web_parity textures_match_golden_hashes -- --nocapture 2>&1)
      e=$?
      body=$(printf '%s\n' "$out" | grep -E '^(chip|label|worker)	' | sha256sum | cut -c1-64)
      n=$(printf '%s\n' "$out" | grep -cE '^(chip|label|worker)	')
      echo "toolchain=$tc profile=${prof:-debug} run=$run textures=$n sha256(hashes)=$body EXIT=$e"
    done
    cargo clean -q  # shared machine, little free disk
  done
done
