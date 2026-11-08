#!/bin/bash
set -e
V=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/vec-regen
T=/home/user/The-Game/.claude/worktrees/wf_73568134-40d-1/rust-port/engine/tests
cp $V/q1/advance.json $T/p6_adv_city_econ_vectors/advance.json
cp $V/q2a/q2a.json $T/p6_adv_q2a_vectors/q2a.json
cp $V/q4/q4.json $T/p6_adv_q4_vectors/q4.json
cp $V/q4b/q4b.json $T/p6_adv_q4_vectors/q4b.json
cp $V/q4b/q4c.json $T/p6_adv_q4_vectors/q4c.json
cp $V/q5/q5.json $T/p6_adv_q5_vectors/q5.json
cp $V/q5/unit_table_*.json $T/p6_adv_q5_vectors/
cp $V/q6/q6.json $T/p6_adv_q6_vectors/q6.json
cp $V/post/post_0.json $T/p6_econ_post_vectors/post_0.json
cp $V/empirefood/empirefood.json $T/p6_empirefood_vectors/empirefood.json
echo installed
