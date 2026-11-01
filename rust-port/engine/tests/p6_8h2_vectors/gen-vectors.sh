#!/usr/bin/env bash
# Regeneracja wektorow P6.8H2 (partia B, resource-access.ts) z pinu web.
# Uzycie z dowolnego katalogu:  rust-port/engine/tests/p6_8h2_vectors/gen-vectors.sh [SHA_PINU]
# Domyslny pin: 91dc998a. Zrodla web sa rozpakowywane przez `git archive` do katalogu
# tymczasowego (mktemp -d) i kompilowane tam; katalog gra/ NIE jest budowany ani modyfikowany.
# Wynik: cases.json (przypadki, generator gen_cases.py) i vectors.json (wyniki web) obok skryptu.
set -euo pipefail

PIN="${1:-91dc998a}"
DIR="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$DIR/../../../.." && pwd)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

git -C "$REPO" archive "$PIN" gra | tar -x -C "$WORK"
cd "$WORK"
npm init -y >/dev/null
npm i --silent esbuild@0.28.2 three@0.160.0
ln -s "$WORK/node_modules" "$WORK/gra/node_modules"
sed "s#__PIN__#$WORK/gra/src#g" "$DIR/entry.ts.in" > "$WORK/entry.ts"
python3 "$DIR/gen_cases.py" "$DIR/cases.json"
./node_modules/.bin/esbuild entry.ts --bundle --platform=node --format=cjs \
  --outfile=bundle.js --log-level=warning
node bundle.js "$DIR/cases.json" "$DIR/vectors.json"
echo "wektory z pinu $PIN: $DIR/vectors.json"
