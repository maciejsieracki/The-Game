#!/bin/bash
# usage: run-max.sh <sha> <label>  -- jak run-one.sh, ale w KOPII roboczej (poza repo) zmienia hak startu
# __nnsMeasureDebug.startGame na poziom MAKSYMALNY: difficulty Trudny, kosztJednostekPace wysoki,
# diplomacyWarLevel trudna, kulturaReligiaLevel trudny. Nie zmienia commita ani repo.
set -u
S=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aiempty2
SHA=$1; LBL=$2
REPO=/home/user/The-Game/.claude/worktrees/wf_d9592027-527-1
B=$S/b-$LBL
rm -rf $B; mkdir -p $B
cd $REPO && git archive --format=tar -o $S/tmp-$LBL.tar $SHA gra || { echo ARCHIVE_FAIL; exit 1; }
tar -xf $S/tmp-$LBL.tar -C $B && rm -f $S/tmp-$LBL.tar
ln -s $S/base/gra/node_modules $B/gra/node_modules
node -e '
const fs=require("fs"); const f=process.argv[1]; let s=fs.readFileSync(f,"utf8");
const i=s.indexOf("__nnsMeasureDebug = {"); if(i<0) throw new Error("no hook");
const j=s.indexOf("setBalance:", i); const blk=s.slice(i,j);
let nb=blk.replace("difficulty: \x27Normalny\x27","difficulty: \x27Trudny\x27").replace("kosztJednostekPace: \x27niski\x27","kosztJednostekPace: \x27wysoki\x27").replace("cityLimitBase: 10,","cityLimitBase: 10, diplomacyWarLevel: \x27trudna\x27, kulturaReligiaLevel: \x27trudny\x27,");
if(nb===blk) throw new Error("no change");
s=s.slice(0,i)+nb+s.slice(j); fs.writeFileSync(f,s); console.log("patched-max OK");
' $B/gra/src/main.ts || { echo PATCH_FAIL; exit 1; }
cd $B/gra && node ./node_modules/vite/bin/vite.js build --outDir $S/dist-$LBL --emptyOutDir > $S/build-$LBL.log 2>&1 || { echo BUILD_FAIL; tail -20 $S/build-$LBL.log; exit 1; }
echo BUILD_OK
rm -rf $B
