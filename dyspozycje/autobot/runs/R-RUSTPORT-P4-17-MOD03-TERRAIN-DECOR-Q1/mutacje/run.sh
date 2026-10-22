#!/bin/bash
# usage: run.sh NAME FILE SED_EXPR   (FILE relative to rust-port/renderer)
# Reproducible from the repository: the checkout is found from this script's
# location (git rev-parse), the backup is a mktemp file, the cargo target dir
# is $MUT_TARGET_DIR (default ${TMPDIR:-/tmp}/decor-mut-target). The mutated
# file is restored on exit (trap), also on Ctrl-C.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(git -C "$HERE" rev-parse --show-toplevel)" || exit 2
cd "$ROOT/rust-port/renderer" || exit 2
T="${MUT_TARGET_DIR:-${TMPDIR:-/tmp}/decor-mut-target}"
mkdir -p "$T"
backup="$(mktemp)"
cp "$2" "$backup"
trap 'cp "$backup" "$2"; rm -f "$backup"' EXIT
sed -i "$3" "$2"
if cmp -s "$2" "$backup"; then echo "$1 NOCHANGE"; exit 0; fi
out=$(CARGO_TARGET_DIR="$T" cargo test --locked --test decor_web_parity 2>&1)
rc=$?
if [ "$rc" -eq 0 ]; then
  echo "$1 SURVIVED"
else
  res=$(printf '%s\n' "$out" | grep -E 'bit_diff=[1-9]|error\[|^test .* FAILED|outcome .* only|only [0-9]+ distinct|platform maths|copies of core' | head -6 | tr '\n' ' ' | cut -c1-320)
  echo "$1 KILLED :: $res"
fi
