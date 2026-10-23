#!/bin/bash
# R-RUSTPORT-P4-31-ATLAS-CACHE-Q1, round 2 — evidence for Evaluator r1 zarzut 3:
# on the ROUND-1 commit d4d15f5e (unchanged fixture), the mutation
# `ends_with(&keep)` -> `contains(&keep)` in purge_other_lod IS killed by lod_purge_matches_web.
# Usage: 12-mutation-contains-d4d15f5e.sh <scratch dir outside the repo>   (own CARGO_TARGET_DIR)
set -u
S=${1:?usage: $0 <scratch dir>}
REPO=$(git -C "$(dirname "$0")" rev-parse --show-toplevel)
rm -rf "$S/r1" && mkdir -p "$S/r1"
git -C "$REPO" archive -o "$S/r1.tar" d4d15f5e rust-port/renderer && tar -xf "$S/r1.tar" -C "$S/r1"
cd "$S/r1/rust-port/renderer" || exit 1
echo "## tree = git archive d4d15f5e; CARGO_TARGET_DIR=${CARGO_TARGET_DIR:-<default>}"
echo '$ cargo test --locked --test atlas_keys lod_purge_matches_web   (baseline)'
cargo test --locked --test atlas_keys lod_purge_matches_web 2>&1 | grep -E '^test |test result'; echo "EXIT=${PIPESTATUS[0]}"
grep -c '!k.ends_with(&keep)' src/raster/atlas/cache.rs
sed -i 's/!k.ends_with(&keep)/!k.contains(\&keep)/' src/raster/atlas/cache.rs
echo '$ (mutated) grep contains:'; grep -n '!k.contains(&keep)' src/raster/atlas/cache.rs
echo '$ cargo test --locked --test atlas_keys lod_purge_matches_web   (mutant contains)'
cargo test --locked --test atlas_keys lod_purge_matches_web 2>&1 | grep -E '^test |test result|panicked|kept for lod|freed for lod' | head -8; echo "EXIT=${PIPESTATUS[0]}"
