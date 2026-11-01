#!/usr/bin/env bash
# P6.8I r5: bramki. Uzycie (z dowolnego katalogu): gate-r5.sh <fmt|clippy|test8i|testfull|diff>
# Log: logs/gate-r5-<nazwa>.txt, JEDNA linia `EXIT=<kod>` na koncu (bez pustej linii przed nia), sciezka worktree
# zamaskowana jako <WORKTREE>. Target cargo na /dev/shm (usun po etapie: rm -rf /dev/shm/p6-8i-r5).
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/../../../.." && pwd)"
LOGS="$HERE/logs"
mkdir -p "$LOGS"
export CARGO_TARGET_DIR=/dev/shm/p6-8i-r5 CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
OUT="$LOGS/gate-r5-$1.txt"
TMP="$(mktemp)"
cd "$REPO/rust-port/engine" || exit 2
case "$1" in
  fmt) cargo fmt --check >"$TMP" 2>&1 ;;
  clippy) cargo clippy --all-targets -- -D warnings >"$TMP" 2>&1 ;;
  test8i) cargo test --test p6_8i_pick --test p6_8i_relief -- --nocapture >"$TMP" 2>&1 ;;
  testfull) cargo test >"$TMP" 2>&1 ;;
  diff) (cd "$REPO" && git diff --check d977ad560 >"$TMP" 2>&1 && git diff --check >>"$TMP" 2>&1 && git diff --cached --check >>"$TMP" 2>&1) ;;
  *) echo "nieznana bramka $1"; exit 2 ;;
esac
CODE=$?
# usun puste linie na koncu, zamaskuj sciezke worktree, dopisz jedna linie EXIT=
sed -e "s#$REPO#<WORKTREE>#g" "$TMP" | sed -e :a -e '/^\n*$/{$d;N;ba' -e '}' >"$OUT"
echo "EXIT=$CODE" >>"$OUT"
rm -f "$TMP"
tail -n 3 "$OUT"
