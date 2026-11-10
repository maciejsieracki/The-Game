#!/usr/bin/env bash
# R-RUSTPORT-P4-35-TEXT-EMOJI-UNIFY-Q1 — obrona r1: pomiary zarzutów 2 i 3, mutacja E5, bramy.
# Uruchomienie: bash 09-obrona-r1.sh > 09-obrona-r1.log 2>&1 (z dowolnego katalogu).
# Dysk: CARGO_INCREMENTAL=0 i bez debuginfo (jak Evaluator r1 — pełny dysk w 1. próbie).
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
D="$(cd "$(dirname "$0")" && pwd)"
cd "$D/../../../../../rust-port/renderer" || exit 1
echo "## HEAD"; git rev-parse HEAD; git status --short
echo "## rustc"; rustc --version; rustc +1.87.0 --version
echo "## Chromium: gradient jako fillStyle/strokeStyle a glif kolorowy (zarzut 3; sumy R G B A)"
PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node "$D/09-chromium-gradient-probe.mjs" "$PWD/assets/"; echo "EXIT=$?"
echo "## generator: ponowny przebieg gen.mjs w kopii poza repo -> MANIFEST identyczny"
T="$(mktemp -d)"; mkdir -p "$T/r/tests/fixtures"; cp -r tests/fixtures/textmix "$T/r/tests/fixtures/"; cp -r assets "$T/r/"
(cd "$T/r/tests/fixtures/textmix" && NODE_PATH=/opt/node-tools/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs)
diff "$T/r/tests/fixtures/textmix/MANIFEST.sha256" tests/fixtures/textmix/MANIFEST.sha256; echo "DIFF_EXIT=$?"; rm -rf "$T"
echo "## textmix (nocapture): kontrole AA (zarzut 2) i próby gradientu (zarzut 3)"
cargo test --locked --test textmix_chromium --test textmix_manifest -- --nocapture; echo "EXIT=$?"
echo "## mutacja E5 (Evaluator r1): emoji.rs draw_mixed unwrap_or(1.0) -> unwrap_or(0.0)"
B="$(mktemp)"; cp src/raster/image/emoji.rs "$B"
sed -i 's/    .unwrap_or(1.0);/    .unwrap_or(0.0);/' src/raster/image/emoji.rs; diff "$B" src/raster/image/emoji.rs
cargo test --locked --test textmix_chromium textmix_stroke_probe_matches_chromium 2>&1 | grep -E 'panicked|channel|test result'; echo "EXIT=${PIPESTATUS[0]} (oczekiwane != 0: mutacja zabita)"
cp "$B" src/raster/image/emoji.rs; rm -f "$B"; grep -c '    .unwrap_or(1.0);' src/raster/image/emoji.rs
echo "## cargo fmt --all -- --check"
cargo fmt --all -- --check; echo "EXIT=$?"
echo "## cargo clippy --locked --all-targets -- -D warnings"
cargo clippy --locked --all-targets -- -D warnings; echo "EXIT=$?"
echo "## cargo clippy --locked --all-targets --features gpu -- -D warnings"
cargo clippy --locked --all-targets --features gpu -- -D warnings; echo "EXIT=$?"
echo "## cargo test --locked --all-targets (stable)"
cargo test --locked --all-targets --no-fail-fast 2>&1 | grep -E '^(test result|     Running|error|test .* FAILED)'; echo "EXIT=${PIPESTATUS[0]}"
echo "## cargo +1.87.0 test --locked --all-targets"
cargo +1.87.0 test --locked --all-targets --no-fail-fast 2>&1 | grep -E '^(test result|     Running|error|test .* FAILED)'; echo "EXIT=${PIPESTATUS[0]}"
echo "## golden textmix stable vs 1.87.0"
for tc in stable 1.87.0; do cargo +$tc test --locked --test textmix_chromium textmix_golden_hashes -- --nocapture 2>/dev/null | grep -E '^m[0-9]' | sha256sum | sed "s/-/$tc/"; done
echo "## git diff --check"
git diff --check; echo "EXIT=$?"
