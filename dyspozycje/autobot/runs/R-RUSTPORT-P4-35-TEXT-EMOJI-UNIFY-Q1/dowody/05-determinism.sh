#!/usr/bin/env bash
# R-RUSTPORT-P4-35 — determinizm: złote hashe (textmix + RR-T8a/b/c + MOD-08/10)
# na rustc 1.87.0 i stable, debug i release. Każdy test porównuje z golden.tsv.
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
T="--test textmix_chromium --test textmix_unify --test raster_scenes --test text_scenes --test image_scenes --test overlay_web_parity --test cityoverlay_web_parity"
for tc in 1.87.0 stable; do
  for prof in "" "--release"; do
    echo "## rustc $tc ${prof:-debug}"
    # shellcheck disable=SC2086
    cargo +$tc test --locked $prof $T -- golden 2>&1 | grep -E "^test |test result"
    echo "EXIT=${PIPESTATUS[0]}"
    # shellcheck disable=SC2086
    cargo +$tc test --locked $prof --test textmix_chromium textmix_golden_hashes -- --nocapture 2>&1 | grep -E "^m[0-9]{2}_" | sha256sum
  done
done
