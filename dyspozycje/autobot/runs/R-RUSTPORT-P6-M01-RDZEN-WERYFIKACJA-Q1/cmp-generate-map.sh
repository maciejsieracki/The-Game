#!/bin/bash
# Porownanie generate_map: baza (origin/rust-port/parity-v2) vs worktree M01. Plik testowy tymczasowy (nie commitowany).
WT=/home/user/The-Game/.claude/worktrees/wf_320a8312-64a-3
BASE=/tmp/claude-0/s/base
rm -rf "$BASE"; mkdir -p "$BASE"
cd "$WT" || exit 9
git archive origin/rust-port/parity-v2 rust-port/engine | tar -x -C "$BASE"
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0
cp /tmp/claude-0/s/zz_tmp_hash.rs "$BASE/rust-port/engine/tests/zz_tmp_hash.rs"
( cd "$BASE/rust-port/engine" && CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_320a8312-64a-3-base HASH_OUT=/tmp/claude-0/s/hash-base.txt cargo test --test zz_tmp_hash -q 2>&1 | tail -n 3 )
cp /tmp/claude-0/s/zz_tmp_hash.rs "$WT/rust-port/engine/tests/zz_tmp_hash.rs"
( cd "$WT/rust-port/engine" && CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_320a8312-64a-3 HASH_OUT=/tmp/claude-0/s/hash-new.txt cargo test --test zz_tmp_hash -q 2>&1 | tail -n 3 )
rm -f "$WT/rust-port/engine/tests/zz_tmp_hash.rs"
diff /tmp/claude-0/s/hash-base.txt /tmp/claude-0/s/hash-new.txt > /tmp/claude-0/s/hash-diff.txt
echo "diff EXIT=$? ; roznych wierszy: $(grep -c '^<' /tmp/claude-0/s/hash-diff.txt) z $(wc -l < /tmp/claude-0/s/hash-base.txt)"
