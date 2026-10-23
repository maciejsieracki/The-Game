#!/usr/bin/env bash
# R-RUSTPORT-P4-35 — powtarzalność generatora: drugi przebieg gen.mjs na kopii
# katalogu fixtury (poza repo), porównanie MANIFEST.sha256 z wersją w repo.
FX="$(cd "$(dirname "$0")/../../../../../rust-port/renderer/tests/fixtures/textmix" && pwd)"
TMP="${TMPDIR:-/tmp}/p435-genrepro.$$"
mkdir -p "$TMP/rust-port/renderer/tests/fixtures/textmix" "$TMP/rust-port/renderer"
cp "$FX/gen.mjs" "$TMP/rust-port/renderer/tests/fixtures/textmix/"
cp -r "$FX/../../../assets" "$TMP/rust-port/renderer/assets"
( cd "$TMP/rust-port/renderer/tests/fixtures/textmix" && \
  NODE_PATH=/opt/node-tools/node_modules PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node gen.mjs ); echo "EXIT=$?"
diff "$FX/MANIFEST.sha256" "$TMP/rust-port/renderer/tests/fixtures/textmix/MANIFEST.sha256"; echo "DIFF_EXIT=$?"
rm -rf "$TMP"
