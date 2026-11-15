#!/bin/bash
# obrona r3, zarzut 6: toUpperCase — rustc 1.97.0 / 1.87.0 × tabela fixtury (node v22.22.0) / node v22.23.4 (Unicode 17.0)
S=${S:?katalog scratch poza repo, np. S=$(mktemp -d)}; node "$(dirname "$0")/05-obrona-r3-upper-gen.mjs" "$S/upper-node22234.tsv"
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=$S/target
node -p '"node " + process.version + " unicode " + process.versions.unicode'
for tc in 1.97.0 1.87.0; do
  for tab in fixture node22234; do
    echo "== rustc $tc, tabela $tab"
    if [ $tab = fixture ]; then unset TEXT_UPPER_TSV; else export TEXT_UPPER_TSV=$S/upper-node22234.tsv; fi
    cargo +$tc test --locked --test text_upper -- --nocapture whole_unicode 2>&1 | grep -E '^checked|test result'
    echo "EXIT=${PIPESTATUS[0]}"
  done
done
