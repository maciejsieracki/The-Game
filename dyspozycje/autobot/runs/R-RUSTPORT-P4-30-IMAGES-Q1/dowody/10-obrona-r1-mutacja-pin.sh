#!/bin/bash
# Mutacja M-OB1: wejście JPG zmienione o 1 bajt (dopisany 0x00) -> inputs_are_the_pin_bytes musi paść.
cd /home/user/The-Game/.claude/worktrees/wf_5b41339e-109-3/rust-port/renderer || exit 1
T=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/tgt
export CARGO_TARGET_DIR=$T CARGO_PROFILE_DEV_DEBUG=0 CARGO_INCREMENTAL=0
F=tests/fixtures/image/input/portrait-grecy-braz.jpg
cp $F $T.bak
printf '\0' >> $F
cargo test --locked --test image_assets inputs_are_the_pin_bytes; echo "mutant EXIT=$? (oczekiwane !=0)"
cp $T.bak $F; rm -f $T.bak
cargo test --locked --test image_assets inputs_are_the_pin_bytes; echo "restored EXIT=$?"
sha256sum $F
rm -rf $T
