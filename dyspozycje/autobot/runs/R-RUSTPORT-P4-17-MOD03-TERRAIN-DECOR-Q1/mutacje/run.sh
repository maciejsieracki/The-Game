#!/bin/bash
# usage: run.sh NAME FILE SED_EXPR   (FILE relative to rust-port/renderer)
cd /home/user/The-Game/.claude/worktrees/wf_b84d99df-bfb-1/rust-port/renderer || exit 2
B=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p417op/mut
cp "$2" "$B/backup"
sed -i "$3" "$2"
if cmp -s "$2" "$B/backup"; then echo "$1 NOCHANGE"; exit 0; fi
out=$(CARGO_TARGET_DIR=$B/target cargo test --locked --test decor_web_parity 2>&1)
cp "$B/backup" "$2"
res=$(echo "$out" | grep -E 'bit_diff=[1-9]|error\[|panicked' | head -4 | tr '\n' ' ' | cut -c1-260)
if echo "$out" | grep -q 'test result: ok. 6 passed'; then echo "$1 SURVIVED"; else echo "$1 KILLED :: $res"; fi
