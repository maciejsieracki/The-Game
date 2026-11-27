#!/bin/bash
# usage: run-one.sh <sha> <label>   -- eksport gra/ z commita (git archive) + build vite do dist-<label>
set -u
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aiempty2
SHA=$1; LBL=$2
REPO=/home/user/The-Game/.claude/worktrees/wf_d9592027-527-1
B=$S/b-$LBL
rm -rf $B; mkdir -p $B
cd $REPO && git archive --format=tar -o $S/tmp-$LBL.tar $SHA gra || { echo ARCHIVE_FAIL; exit 1; }
tar -xf $S/tmp-$LBL.tar -C $B && rm -f $S/tmp-$LBL.tar
ln -s $S/base/gra/node_modules $B/gra/node_modules
cd $B/gra && node ./node_modules/vite/bin/vite.js build --outDir $S/dist-$LBL --emptyOutDir > $S/build-$LBL.log 2>&1 || { echo BUILD_FAIL; tail -20 $S/build-$LBL.log; exit 1; }
echo BUILD_OK
rm -rf $B
