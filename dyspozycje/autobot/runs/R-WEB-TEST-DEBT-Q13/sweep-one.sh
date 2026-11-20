#!/bin/bash
# R-WEB-TEST-DEBT-Q13 r5: uruchom jeden test (timeout $2 s, domyslnie 120), wypisz: exit|plik|ostatnia linia|pierwszy FAIL
# usage: sweep-one.sh <plik-test.cjs> [timeout_s]; cwd = gra/
t="$1"; to="${2:-120}"
out=$(cd "$(dirname "$0")/../../../../gra" && CHROME_PATH=/usr/bin/google-chrome timeout "$to" node "tools/$t" 2>&1); ec=$?
last=$(printf '%s\n' "$out" | grep -v '^\s*$' | tail -1 | tr '|' '/' | cut -c1-160)
first=$(printf '%s\n' "$out" | grep -m1 -E 'FAIL|Error|ERR_ASSERTION' | tr '|' '/' | cut -c1-240)
printf '%s|%s|%s|%s\n' "$ec" "$t" "$last" "$first"
