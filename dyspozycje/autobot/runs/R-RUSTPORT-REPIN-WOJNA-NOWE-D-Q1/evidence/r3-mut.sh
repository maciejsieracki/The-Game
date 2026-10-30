#!/bin/bash
# Mutacje galezi W1/W2 (runda 3). Uzycie: mut.sh <nazwa> <plik-wzgledem-src/domain> <stary> <nowy>
ENG=/home/user/The-Game/.claude/worktrees/wf_08acdd25-537-1/rust-port/engine
SRC=$ENG/src/domain
BK=/tmp/claude-0/webref-r3/bk
mkdir -p $BK
name=$1; file=$2; old=$3; new=$4
cp $SRC/$file $BK/$name.orig
n=$(grep -cF -- "$old" $SRC/$file)
if [ "$n" != "1" ]; then echo "$name SKIP: wzorzec wystepuje $n razy"; exit 0; fi
perl -0pi -e "s/\Q$old\E/$new/" $SRC/$file
if cmp -s $BK/$name.orig $SRC/$file; then echo "$name SKIP: brak zmiany"; exit 0; fi
cd $ENG
CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 timeout 500 cargo test --test p6_repin_wojna_d_vectors --test p6_repin_wojna_d_engage > $BK/$name.log 2>&1
ec=$?
cp $BK/$name.orig $SRC/$file
if cmp -s $BK/$name.orig $SRC/$file; then rs=restored; else rs=RESTORE_FAILED; fi
res=$(grep -E "^test result|panicked" $BK/$name.log | head -2 | tr '\n' ' ')
echo "$name EXIT=$ec $rs :: $res"
