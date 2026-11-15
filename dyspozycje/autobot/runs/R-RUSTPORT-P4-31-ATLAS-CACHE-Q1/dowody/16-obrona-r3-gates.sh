#!/bin/bash
# Obrona r3 (R-RUSTPORT-P4-31-ATLAS-CACHE-Q1): bramki + mutant E12 na kodzie obrony.
S=/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad
R=$S/code/rust-port/renderer
cd $R || exit 9
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=$S/p431ob-target
echo "HEAD=$(git rev-parse HEAD) (parent $(git rev-parse HEAD^))"
cargo --version; rustc --version
echo "== fmt"; cargo fmt --all -- --check; echo "EXIT=$?"
echo "== clippy cpu"; cargo clippy --locked --all-targets -- -D warnings 2>&1 | tail -2; echo "EXIT=${PIPESTATUS[0]}"
echo "== clippy gpu"; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1 | tail -2; echo "EXIT=${PIPESTATUS[0]}"
echo "== test all"; cargo test --locked --all-targets > $S/p431ob/test-all.log 2>&1; echo "EXIT=$?"
grep -E '^test result' $S/p431ob/test-all.log | awk '{p+=$4; f+=$6; i+=$8} END {print "passed="p" failed="f" ignored="i}'
grep -E 'end_of_turn_alone_keeps_the_key_index_bounded|lru_eviction_of_a_shown_texture_duplicates_it' $S/p431ob/test-all.log
echo "== test gpu"; cargo test --locked --features gpu --test atlas_gpu --test gpu_probe 2>&1 | grep -E '^test |^test result|SKIPPED'; echo "EXIT=${PIPESTATUS[0]}"
echo "== mutant E12 (end_of_turn bez keys.retain)"
F=src/raster/atlas/cache.rs; cp $F $F.bak
python3 - "$F" <<'PY'
import sys; p=sys.argv[1]; s=open(p,encoding='utf-8').read()
old="        self.keys.retain(|k| inner.contains_key(k));\n        Ok(n)"
assert s.count(old)==1, s.count(old)
open(p,'w',encoding='utf-8').write(s.replace(old,"        let _ = inner;\n        Ok(n)"))
PY
cargo test --locked --lib raster::atlas::cache 2>&1 | grep -E '^test |panicked|^test result'; echo "EXIT=${PIPESTATUS[0]} (oczekiwane !=0 = KILLED)"
mv $F.bak $F
echo "== git diff --check"; git diff --check; echo "EXIT=$?"
echo "== Cargo.toml/Cargo.lock"; git diff --quiet HEAD -- Cargo.toml Cargo.lock; echo "unchanged EXIT=$?"
echo "GATES_DONE"
